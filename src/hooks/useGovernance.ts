import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  politicalEvents,
  type GovernanceDelta,
  type PoliticalEventDefinition,
  type PoliticalEventOption,
  type PoliticalEventThresholdKey,
} from '@/lib/events/politicalEvents';
import { useRNG } from '@/contexts/RNGContext';

const politicalEventIndex = new Map<string, PoliticalEventDefinition>(
  politicalEvents.map((event) => [event.id, event]),
);

const getEventDefinitionById = (id: string) => politicalEventIndex.get(id);

const getEventCooldownTurns = (definition: PoliticalEventDefinition | undefined) =>
  definition?.cooldownTurns ?? 1;

const thresholdEvaluators: Record<
  PoliticalEventThresholdKey,
  (metrics: GovernanceMetrics, threshold: number) => boolean
> = {
  moraleBelow: (metrics, threshold) => metrics.morale < threshold,
  publicOpinionBelow: (metrics, threshold) => metrics.publicOpinion < threshold,
  cabinetApprovalBelow: (metrics, threshold) => metrics.cabinetApproval < threshold,
};

const meetsPoliticalEventConditions = (
  definition: PoliticalEventDefinition,
  metrics: GovernanceMetrics,
  currentTurn: number,
): boolean => {
  const { conditions } = definition;
  if (!conditions) {
    return true;
  }

  if (typeof conditions.minTurn === 'number' && currentTurn < conditions.minTurn) {
    return false;
  }

  const requireAnySet = new Set<PoliticalEventThresholdKey>(conditions.requireAny ?? []);
  let anyThresholdMet = false;
  let hasAnyCandidate = false;

  for (const key of Object.keys(thresholdEvaluators) as PoliticalEventThresholdKey[]) {
    const value = conditions[key];
    if (typeof value !== 'number') {
      continue;
    }

    const isMet = thresholdEvaluators[key](metrics, value);
    if (requireAnySet.has(key)) {
      hasAnyCandidate = true;
      if (isMet) {
        anyThresholdMet = true;
      }
    } else if (!isMet) {
      return false;
    }
  }

  if (requireAnySet.size > 0) {
    if (!hasAnyCandidate) {
      return false;
    }
    if (!anyThresholdMet) {
      return false;
    }
  }

  return true;
};

export interface GovernanceMetrics {
  morale: number;
  publicOpinion: number;
  electionTimer: number;
  cabinetApproval: number;
}

export interface GovernanceNationRef {
  id: string;
  name: string;
  isPlayer: boolean;
  morale: number;
  publicOpinion: number;
  electionTimer: number;
  cabinetApproval: number;
  instability?: number;
  production: number;
  intel: number;
  uranium: number;
}

export interface GovernanceEventState {
  nationId: string;
  definition: PoliticalEventDefinition;
  triggeredTurn: number;
}

export interface UseGovernanceOptions {
  currentTurn: number;
  getNations: () => GovernanceNationRef[];
  onMetricsSync?: (nationId: string, metrics: GovernanceMetrics) => void;
  onApplyDelta?: (nationId: string, delta: GovernanceDelta) => void;
  onAddNewsItem?: (category: 'governance' | 'crisis' | 'diplomatic', text: string, priority: 'routine' | 'important' | 'critical') => void;
  defaultElectionInterval?: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const DEFAULT_METRICS: GovernanceMetrics = {
  morale: 65,
  publicOpinion: 60,
  electionTimer: 12,
  cabinetApproval: 58,
};

function resolveElectionInterval(interval: number | undefined) {
  return typeof interval === 'number' && interval > 0 ? interval : DEFAULT_METRICS.electionTimer;
}

function seedMetrics(
  nation: GovernanceNationRef | undefined,
  defaultElectionInterval: number,
): GovernanceMetrics {
  const fallbackElectionTimer = resolveElectionInterval(defaultElectionInterval);
  if (!nation) {
    return { ...DEFAULT_METRICS, electionTimer: fallbackElectionTimer };
  }
  return {
    morale: typeof nation.morale === 'number' ? nation.morale : DEFAULT_METRICS.morale,
    publicOpinion: typeof nation.publicOpinion === 'number' ? nation.publicOpinion : DEFAULT_METRICS.publicOpinion,
    electionTimer:
      typeof nation.electionTimer === 'number' ? nation.electionTimer : fallbackElectionTimer,
    cabinetApproval: typeof nation.cabinetApproval === 'number' ? nation.cabinetApproval : DEFAULT_METRICS.cabinetApproval,
  };
}

function pickOutcome(option: PoliticalEventOption, rng: { next: () => number }) {
  if (option.outcomes.length === 1) {
    return option.outcomes[0];
  }
  const roll = rng.next();
  let accumulator = 0;
  for (const outcome of option.outcomes) {
    const chance = typeof outcome.chance === 'number' ? outcome.chance : 1 / option.outcomes.length;
    accumulator += chance;
    if (roll <= accumulator) {
      return outcome;
    }
  }
  return option.outcomes[option.outcomes.length - 1];
}

export function calculateMoraleProductionMultiplier(morale: number): number {
  if (morale >= 85) return 1.25;
  if (morale >= 70) return 1.1;
  if (morale >= 55) return 1.0;
  if (morale >= 40) return 0.85;
  return 0.7;
}

export function calculateMoraleRecruitmentModifier(morale: number): number {
  if (morale >= 85) return 1.2;
  if (morale >= 70) return 1.05;
  if (morale >= 55) return 1.0;
  if (morale >= 40) return 0.9;
  return 0.75;
}

function evaluateOptionExpectation(option: PoliticalEventOption): number {
  if (option.outcomes.length === 0) return 0;
  return option.outcomes.reduce((total, outcome) => {
    const chance = typeof outcome.chance === 'number' ? outcome.chance : 1 / option.outcomes.length;
    return total + chance * (outcome.effects.morale ?? 0);
  }, 0);
}

function getNextElectionTimer(metrics: GovernanceMetrics, defaultElectionInterval: number) {
  const fallbackElectionTimer = resolveElectionInterval(defaultElectionInterval);
  return metrics.electionTimer > 0 ? metrics.electionTimer : fallbackElectionTimer;
}

export interface UseGovernanceReturn {
  metrics: Record<string, GovernanceMetrics>;
  activeEvent: GovernanceEventState | null;
  selectOption: (optionId: string) => { description: string; effects: GovernanceDelta } | null;
  dismissEvent: () => void;
  applyGovernanceDelta: (nationId: string, delta: GovernanceDelta, description?: string) => void;
}

export function useGovernance({
  currentTurn,
  getNations,
  onMetricsSync,
  onApplyDelta,
  onAddNewsItem,
  defaultElectionInterval,
}: UseGovernanceOptions): UseGovernanceReturn {
  const { rng } = useRNG();
  const resolvedElectionInterval = useMemo(
    () => resolveElectionInterval(defaultElectionInterval),
    [defaultElectionInterval],
  );
  const [metrics, setMetrics] = useState<Record<string, GovernanceMetrics>>(() => {
    const initial: Record<string, GovernanceMetrics> = {};
    getNations().forEach((nation) => {
      initial[nation.id] = seedMetrics(nation, resolvedElectionInterval);
    });
    return initial;
  });

  const [activeEvent, setActiveEvent] = useState<GovernanceEventState | null>(null);
  const eventTurnHistoryRef = useRef<Map<string, Map<string, number>>>(new Map());

  const recordEventTurn = useCallback((nationId: string, eventId: string, turn: number) => {
    let nationEvents = eventTurnHistoryRef.current.get(nationId);
    if (!nationEvents) {
      nationEvents = new Map<string, number>();
      eventTurnHistoryRef.current.set(nationId, nationEvents);
    }
    nationEvents.set(eventId, turn);
  }, []);

  useEffect(() => {
    const tracker = eventTurnHistoryRef.current;
    tracker.forEach((events, nationId) => {
      events.forEach((lastTurn, eventId) => {
        const definition = getEventDefinitionById(eventId);
        const cooldown = getEventCooldownTurns(definition);
        if (currentTurn - lastTurn >= cooldown) {
          events.delete(eventId);
        }
      });
      if (events.size === 0) {
        tracker.delete(nationId);
      }
    });
  }, [currentTurn]);

  const syncNationMetrics = useCallback(
    (
      nationId: string,
      updater: (metrics: GovernanceMetrics, nation: GovernanceNationRef | undefined) => GovernanceMetrics,
    ) => {
      setMetrics((prev) => {
        const nation = getNations().find((n) => n.id === nationId);
        const current = prev[nationId] ?? seedMetrics(nation, resolvedElectionInterval);
        const next = updater(current, nation);
        onMetricsSync?.(nationId, next);
        return { ...prev, [nationId]: next };
      });
    },
    [getNations, onMetricsSync, resolvedElectionInterval],
  );

  const applyGovernanceDelta = useCallback(
    (nationId: string, delta: GovernanceDelta, description?: string) => {
      const nation = getNations().find((n) => n.id === nationId);
      syncNationMetrics(nationId, (current) => {
        const next: GovernanceMetrics = {
          morale: clamp(current.morale + (delta.morale ?? 0), 0, 100),
          publicOpinion: clamp(current.publicOpinion + (delta.publicOpinion ?? 0), 0, 100),
          electionTimer: Math.max(0, current.electionTimer + (delta.electionTimer ?? 0)),
          cabinetApproval: clamp(current.cabinetApproval + (delta.cabinetApproval ?? 0), 0, 100),
        };
        return next;
      });

      if (onApplyDelta) {
        onApplyDelta(nationId, delta);
      }

      if (description && nation?.isPlayer) {
        onAddNewsItem?.('governance', description, 'important');
      }
    },
    [getNations, onAddNewsItem, onApplyDelta, syncNationMetrics],
  );

  useEffect(() => {
    const updates: Array<{ id: string; metrics: GovernanceMetrics }> = [];
    setMetrics((prev) => {
      const next = { ...prev };
      getNations().forEach((nation) => {
        const current = prev[nation.id] ?? seedMetrics(nation, resolvedElectionInterval);
        const moraleDecay = 1 + Math.max(0, (nation.instability ?? 0) - 40) * 0.02;
        const cabinetSupport = (current.cabinetApproval - 50) * 0.02;
        const publicOpinionEffect = (current.publicOpinion - 50) * 0.01;
        const morale = clamp(current.morale - moraleDecay + cabinetSupport + publicOpinionEffect, 0, 100);

        const opinionDrift = (morale - current.publicOpinion) * 0.05;
        const nextPublicOpinion = clamp(current.publicOpinion + opinionDrift, 0, 100);
        const approvalDrift = (nextPublicOpinion - current.cabinetApproval) * 0.04;
        const nextCabinetApproval = clamp(current.cabinetApproval + approvalDrift, 0, 100);

        const nextMetrics: GovernanceMetrics = {
          morale,
          publicOpinion: nextPublicOpinion,
          cabinetApproval: nextCabinetApproval,
          electionTimer: Math.max(0, current.electionTimer - 1),
        };

        next[nation.id] = nextMetrics;
        updates.push({ id: nation.id, metrics: nextMetrics });
      });
      return next;
    });

    updates.forEach(({ id, metrics: snapshot }) => {
      onMetricsSync?.(id, snapshot);
    });
  }, [currentTurn, getNations, onMetricsSync, resolvedElectionInterval]);

  const autoResolve = useCallback(
    (nation: GovernanceNationRef, definition: PoliticalEventDefinition) => {
      const bestOption = [...definition.options].sort(
        (a, b) => evaluateOptionExpectation(b) - evaluateOptionExpectation(a),
      )[0];
      const outcome = pickOutcome(bestOption, rng);
      applyGovernanceDelta(nation.id, outcome.effects);
      recordEventTurn(nation.id, definition.id, currentTurn);
      return outcome;
    },
    [applyGovernanceDelta, currentTurn, recordEventTurn, rng],
  );

  const ensureElectionTimer = useCallback(() => {
    Object.entries(metrics).forEach(([nationId, data]) => {
      if (data.electionTimer <= 0) {
        syncNationMetrics(nationId, (current) => ({
          ...current,
          electionTimer: getNextElectionTimer(current, resolvedElectionInterval),
        }));
      }
    });
  }, [metrics, resolvedElectionInterval, syncNationMetrics]);

  useEffect(() => {
    if (activeEvent) return;
    const nations = getNations();
    for (const nation of nations) {
      const nationMetrics = metrics[nation.id] ?? seedMetrics(nation, resolvedElectionInterval);
      if (nationMetrics.electionTimer <= 0) {
        const electionEvent = politicalEvents.find((event) => event.conditions?.electionImminent);
        if (!electionEvent) {
          ensureElectionTimer();
          continue;
        }

        const lastTurn = eventTurnHistoryRef.current.get(nation.id)?.get(electionEvent.id);
        if (
          typeof lastTurn === 'number' &&
          currentTurn - lastTurn < getEventCooldownTurns(electionEvent)
        ) {
          continue;
        }

        if (!meetsPoliticalEventConditions(electionEvent, nationMetrics, currentTurn)) {
          syncNationMetrics(nation.id, (current) => ({
            ...current,
            electionTimer: getNextElectionTimer(current, resolvedElectionInterval),
          }));
          continue;
        }

        if (nation.isPlayer) {
          recordEventTurn(nation.id, electionEvent.id, currentTurn);
          setActiveEvent({ nationId: nation.id, definition: electionEvent, triggeredTurn: currentTurn });
        } else {
          const outcome = autoResolve(nation, electionEvent);
          onAddNewsItem?.(
            'governance',
            `${nation.name} election yields ${
              outcome.effects.morale && outcome.effects.morale > 0
                ? 'renewed mandate'
                : 'fractured coalition'
            }.`,
            'routine',
          );
        }
        syncNationMetrics(nation.id, (current) => ({
          ...current,
          electionTimer: getNextElectionTimer(current, resolvedElectionInterval),
        }));
        return;
      }
    }

    const candidates = politicalEvents.filter((event) => !event.conditions?.electionImminent);
    const eligibleTargets: Array<{ nation: GovernanceNationRef; events: PoliticalEventDefinition[] }> = [];

    for (const nation of nations) {
      const snapshot = metrics[nation.id] ?? seedMetrics(nation, resolvedElectionInterval);
      const applicableEvents = candidates.filter((event) =>
        meetsPoliticalEventConditions(event, snapshot, currentTurn),
      );
      if (applicableEvents.length === 0) {
        continue;
      }

      const freshEvents = applicableEvents.filter((event) => {
        const lastTurn = eventTurnHistoryRef.current.get(nation.id)?.get(event.id);
        if (typeof lastTurn !== 'number') {
          return true;
        }
        return currentTurn - lastTurn >= getEventCooldownTurns(event);
      });

      if (freshEvents.length > 0) {
        eligibleTargets.push({ nation, events: freshEvents });
      }
    }

    if (eligibleTargets.length === 0) {
      return;
    }

    const target = rng.choice(eligibleTargets);
    const selected = rng.choice(target.events);

    if (target.nation.isPlayer) {
      recordEventTurn(target.nation.id, selected.id, currentTurn);
      setActiveEvent({ nationId: target.nation.id, definition: selected, triggeredTurn: currentTurn });
      onAddNewsItem?.('governance', selected.title, 'important');
    } else {
      const outcome = autoResolve(target.nation, selected);
      onAddNewsItem?.(
        'governance',
        `${target.nation.name} resolves ${selected.title.toLowerCase()} (${outcome.description}).`,
        'routine',
      );
    }
  }, [
    activeEvent,
    autoResolve,
    currentTurn,
    ensureElectionTimer,
    getNations,
    metrics,
    onAddNewsItem,
    resolvedElectionInterval,
    syncNationMetrics,
  ]);

  const selectOption = useCallback(
    (optionId: string) => {
      if (!activeEvent) return null;
      const option = activeEvent.definition.options.find((opt) => opt.id === optionId);
      if (!option) return null;
      const outcome = pickOutcome(option, rng);
      applyGovernanceDelta(activeEvent.nationId, outcome.effects, outcome.description);
      setActiveEvent(null);
      return { description: outcome.description, effects: outcome.effects };
    },
    [activeEvent, applyGovernanceDelta, rng],
  );

  const dismissEvent = useCallback(() => {
    if (!activeEvent) return;
    const definition = activeEvent.definition;
    if (definition.fallbackDelta) {
      applyGovernanceDelta(activeEvent.nationId, definition.fallbackDelta, definition.fallbackSummary);
    }
    setActiveEvent(null);
  }, [activeEvent, applyGovernanceDelta]);

  const memoisedMetrics = useMemo(() => metrics, [metrics]);

  return {
    metrics: memoisedMetrics,
    activeEvent,
    selectOption,
    dismissEvent,
    applyGovernanceDelta,
  };
}

export type { GovernanceDelta } from '@/lib/events/politicalEvents';
