import { useCallback, useEffect, useRef, useState } from 'react';
import type { Nation, NationCyberProfile } from '@/types/game';
import { createEnhancedCyberOutcome, applyCyberEffects } from '@/types/enhancedCyberFeedback';

export type CyberActionId = 'intrusion' | 'fortify' | 'false_flag';
export type CyberLogTone = 'normal' | 'warning' | 'success' | 'alert';
export type CyberNewsCategory = 'intel' | 'crisis' | 'diplomatic' | 'science' | 'military';
export type CyberNewsPriority = 'routine' | 'important' | 'urgent' | 'critical';

export interface CyberOperationLogEntry {
  id: string;
  type: CyberActionId;
  turn: number;
  attackerId?: string;
  targetId?: string;
  success: boolean;
  detected: boolean;
  attributedTo?: string | null;
  summary: string;
  falseFlag?: boolean;
}

export interface CyberActionAvailability {
  id: CyberActionId;
  cost: number;
  cooldown: number;
  remainingCooldown?: number;
  canExecute: boolean;
  reason?: string;
  scapegoatId?: string;
}

export interface CyberOperationOutcome {
  executed: boolean;
  success?: boolean;
  detected?: boolean;
  attributed?: boolean;
  attributedTo?: string | null;
  falseFlag?: boolean;
  message: string;
  severity?: 'minor' | 'major';
}

export type CyberResearchUnlock =
  | 'firewalls'
  | 'intrusion_detection'
  | 'advanced_offense'
  | 'stealth_protocols'
  | 'attribution_obfuscation'
  | 'ai_defense'
  | 'cyber_superweapon';

export interface UseCyberWarfareOptions {
  currentTurn: number;
  getNation: (id: string) => Nation | undefined;
  getNations: () => Nation[];
  onLog?: (message: string, tone?: CyberLogTone) => void;
  onToast?: (payload: { title: string; description: string; variant?: 'default' | 'destructive' }) => void;
  onNews?: (category: CyberNewsCategory, text: string, priority: CyberNewsPriority) => void;
  onDefconShift?: (delta: number, reason: string) => void;
  rng?: () => number;
  onProfilesUpdated?: (nationIds: string[]) => void;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const ACTION_RULES: Record<CyberActionId, { cost: number; cooldown: number; requiresResearch?: string }> = {
  intrusion: { cost: 25, cooldown: 2 },
  fortify: { cost: 15, cooldown: 1 },
  false_flag: { cost: 35, cooldown: 3, requiresResearch: 'cyber_ids' },
};

const LOG_LIMIT = 25;

const ensureThreatMap = (nation: Nation) => {
  if (!nation.threats) {
    nation.threats = {};
  }
};

const increaseThreat = (nation: Nation, otherId: string, amount: number) => {
  if (amount === 0) return;
  ensureThreatMap(nation);
  const current = nation.threats?.[otherId] ?? 0;
  const next = clamp(current + amount, 0, 100);
  if (next <= 0) {
    delete nation.threats?.[otherId];
    return;
  }
  nation.threats![otherId] = next;
};

export const createDefaultNationCyberProfile = (): NationCyberProfile => ({
  readiness: 60,
  maxReadiness: 100,
  offense: 55,
  defense: 52,
  detection: 32,
  attribution: 35,
  research: {},
});

export const applyCyberResearchUnlock = (
  nation: { cyber?: NationCyberProfile },
  unlock: CyberResearchUnlock,
): NationCyberProfile => {
  const profile = nation.cyber ? { ...nation.cyber } : createDefaultNationCyberProfile();
  profile.research = profile.research ? { ...profile.research } : {};
  switch (unlock) {
    case 'firewalls':
      profile.research.firewalls = true;
      profile.maxReadiness += 15;
      profile.defense += 8;
      profile.detection += 6;
      profile.readiness = Math.min(profile.maxReadiness, profile.readiness + 12);
      break;
    case 'intrusion_detection':
      profile.research.intrusionDetection = true;
      profile.detection += 12;
      profile.attribution += 18;
      profile.readiness = Math.min(profile.maxReadiness, profile.readiness + 8);
      break;
    case 'advanced_offense':
      profile.research.advancedOffense = true;
      profile.offense += 10;
      // Intrusion cost reduction will be handled in action execution
      profile.readiness = Math.min(profile.maxReadiness, profile.readiness + 5);
      break;
    case 'stealth_protocols':
      profile.research.stealthProtocols = true;
      profile.detection -= 15; // Harder for enemies to detect
      profile.readiness = Math.min(profile.maxReadiness, profile.readiness + 8);
      break;
    case 'attribution_obfuscation':
      profile.research.attributionObfuscation = true;
      profile.attribution -= 25; // Enemy attribution is less accurate
      profile.readiness = Math.min(profile.maxReadiness, profile.readiness + 10);
      break;
    case 'ai_defense':
      profile.research.aiDefense = true;
      profile.defense += 10;
      profile.maxReadiness += 10;
      // Counter-attack chance will be handled separately
      profile.readiness = Math.min(profile.maxReadiness, profile.readiness + 15);
      break;
    case 'cyber_superweapon':
      profile.research.cyberSuperweapon = true;
      // Unlocks special cyber nuke action
      profile.readiness = Math.min(profile.maxReadiness, profile.readiness + 20);
      break;
  }
  nation.cyber = profile;
  return profile;
};

export function useCyberWarfare(options: UseCyberWarfareOptions) {
  const {
    getNation,
    getNations,
    onLog,
    onToast,
    onNews,
    onDefconShift,
    onProfilesUpdated,
  } = options;

  const rngRef = useRef<() => number>(options.rng ?? Math.random);
  useEffect(() => {
    rngRef.current = options.rng ?? Math.random;
  }, [options.rng]);

  const turnRef = useRef(options.currentTurn);
  useEffect(() => {
    turnRef.current = options.currentTurn;
  }, [options.currentTurn]);

  const [cooldowns, setCooldowns] = useState<Record<string, Partial<Record<CyberActionId, number>>>>({});
  const [logs, setLogs] = useState<CyberOperationLogEntry[]>([]);

  const ensureProfile = useCallback((nation: Nation): NationCyberProfile => {
    if (!nation.cyber) {
      nation.cyber = createDefaultNationCyberProfile();
    } else if (!nation.cyber.research) {
      nation.cyber.research = {};
    }
    return nation.cyber;
  }, []);

  const getCooldown = useCallback(
    (nationId: string, action: CyberActionId) => cooldowns[nationId]?.[action] ?? 0,
    [cooldowns],
  );

  const setCooldown = useCallback((nationId: string, action: CyberActionId, value: number) => {
    setCooldowns(prev => {
      const next = { ...prev };
      next[nationId] = { ...(next[nationId] ?? {}), [action]: value };
      return next;
    });
  }, []);

  const pushLog = useCallback((entry: CyberOperationLogEntry) => {
    setLogs(prev => [...prev.slice(-LOG_LIMIT + 1), entry]);
  }, []);

  const pickFalseFlagScapegoat = useCallback(
    (attacker: Nation, target: Nation): Nation | undefined => {
      const threats = target.threats ? Object.entries(target.threats) : [];
      const ordered = threats
        .filter(([nationId]) => nationId !== attacker.id)
        .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
      for (const [nationId] of ordered) {
        const candidate = getNation(nationId);
        if (candidate && candidate.id !== target.id && candidate.population > 0) {
          return candidate;
        }
      }
      const fallbacks = getNations().filter(
        nation => nation.id !== attacker.id && nation.id !== target.id && nation.population > 0,
      );
      return fallbacks[0];
    },
    [getNation, getNations],
  );

  const computeSuccessChance = useCallback((attacker: NationCyberProfile, defender: NationCyberProfile) => {
    const offenseTerm = (attacker.offense - defender.defense) / 220;
    const readinessRatio = attacker.maxReadiness > 0 ? attacker.readiness / attacker.maxReadiness : 0;
    const readinessTerm = (readinessRatio - 0.5) * 0.35;
    const researchBoost = attacker.research.intrusionDetection ? 0.05 : 0;
    return clamp(0.45 + offenseTerm + readinessTerm + researchBoost, 0.1, 0.95);
  }, []);

  const computeDetectionChance = useCallback((targetProfile: NationCyberProfile) => {
    const readinessPenalty = targetProfile.readiness < targetProfile.maxReadiness * 0.3 ? -0.08 : 0;
    const researchBonus = targetProfile.research.intrusionDetection ? 0.12 : 0;
    return clamp(0.28 + targetProfile.detection / 150 + readinessPenalty + researchBonus, 0.12, 0.95);
  }, []);

  const computeAttributionChance = useCallback((targetProfile: NationCyberProfile) => {
    const researchBonus = targetProfile.research.intrusionDetection ? 0.1 : 0;
    return clamp(0.35 + targetProfile.attribution / 190 + researchBonus, 0.15, 0.9);
  }, []);

  const computeFalseFlagChance = useCallback((targetProfile: NationCyberProfile) => {
    return clamp(0.55 - targetProfile.attribution / 220, 0.08, 0.68);
  }, []);

  const getActionAvailability = useCallback(
    (nationId: string, action: CyberActionId, targetId?: string): CyberActionAvailability => {
      const rule = ACTION_RULES[action];
      const nation = getNation(nationId);
      if (!nation) {
        return {
          id: action,
          cost: rule.cost,
          cooldown: rule.cooldown,
          canExecute: false,
          reason: 'Nation unavailable',
        };
      }
      const profile = ensureProfile(nation);
      const remainingCooldown = getCooldown(nationId, action);
      if (remainingCooldown > 0) {
        return {
          id: action,
          cost: rule.cost,
          cooldown: rule.cooldown,
          remainingCooldown,
          canExecute: false,
          reason: `Cooldown: ${remainingCooldown} turn(s) remaining`,
        };
      }
      if (profile.readiness < rule.cost) {
        return {
          id: action,
          cost: rule.cost,
          cooldown: rule.cooldown,
          canExecute: false,
          reason: 'Insufficient cyber readiness',
        };
      }
      if (rule.requiresResearch && !nation.researched?.[rule.requiresResearch]) {
        return {
          id: action,
          cost: rule.cost,
          cooldown: rule.cooldown,
          canExecute: false,
          reason: 'Research prerequisite incomplete',
        };
      }
      if (action === 'false_flag' && targetId) {
        const target = getNation(targetId);
        if (!target) {
          return {
            id: action,
            cost: rule.cost,
            cooldown: rule.cooldown,
            canExecute: false,
            reason: 'Select a valid target',
          };
        }
        const scapegoat = pickFalseFlagScapegoat(nation, target);
        if (!scapegoat) {
          return {
            id: action,
            cost: rule.cost,
            cooldown: rule.cooldown,
            canExecute: false,
            reason: 'No viable rival to frame',
          };
        }
        return {
          id: action,
          cost: rule.cost,
          cooldown: rule.cooldown,
          canExecute: true,
          scapegoatId: scapegoat.id,
        };
      }
      return {
        id: action,
        cost: rule.cost,
        cooldown: rule.cooldown,
        canExecute: true,
      };
    },
    [ensureProfile, getCooldown, getNation, pickFalseFlagScapegoat],
  );

  const resolveIntrusion = useCallback(
    (
      attacker: Nation,
      target: Nation,
      action: CyberActionId,
      scapegoatId?: string,
    ): CyberOperationOutcome => {
      const rule = ACTION_RULES[action];
      const attackerProfile = ensureProfile(attacker);
      const targetProfile = ensureProfile(target);

      const availability = getActionAvailability(attacker.id, action, target.id);
      if (!availability.canExecute) {
        if (availability.reason) {
          onToast?.({ title: 'Cyber action unavailable', description: availability.reason });
        }
        return {
          executed: false,
          message: availability.reason ?? 'Action unavailable',
        };
      }

      attackerProfile.readiness = Math.max(0, attackerProfile.readiness - rule.cost);
      setCooldown(attacker.id, action, rule.cooldown);

      const successChance = computeSuccessChance(attackerProfile, targetProfile);
      const detectionChance = computeDetectionChance(targetProfile);
      const attributionChance = computeAttributionChance(targetProfile);
      const falseFlagChance = computeFalseFlagChance(targetProfile);

      const success = rngRef.current() < successChance;
      const detected = rngRef.current() < detectionChance;
      let attributed = false;
      let attributedTo: string | null = null;
      let falseFlagSuccess = false;

      if (detected && rngRef.current() < attributionChance) {
        attributed = true;
        attributedTo = attacker.id;
        if (scapegoatId) {
          const scapegoat = getNation(scapegoatId);
          if (scapegoat) {
            const scapegoatRoll = rngRef.current();
            if (scapegoatRoll < falseFlagChance) {
              attributedTo = scapegoat.id;
              falseFlagSuccess = true;
              increaseThreat(target, scapegoat.id, 14);
              increaseThreat(scapegoat, target.id, 10);
            }
          }
        }
      }

      // Use enhanced cyber feedback system for specific, visible effects
      const outcome = createEnhancedCyberOutcome(
        attacker,
        target,
        success,
        detected,
        attributed,
        attributedTo
      );

      // Apply cyber effects to target
      if (success) {
        applyCyberEffects(target, outcome.effects);
        increaseThreat(target, attacker.id, detected ? 12 : 6);
        if (falseFlagSuccess && attributedTo) {
          const scapegoat = getNation(attributedTo);
          if (scapegoat) {
            increaseThreat(target, scapegoat.id, 18);
          }
        }
      } else {
        attackerProfile.readiness = Math.max(0, attackerProfile.readiness - 5);
        increaseThreat(target, attacker.id, detected ? 10 : 3);
      }

      const attackerName = attacker.name;
      const targetName = target.name;
      const scapegoatName = scapegoatId ? getNation(scapegoatId)?.name : null;

      // Log enhanced summary message
      const tone: CyberLogTone = success ? (detected ? 'warning' : 'success') : 'warning';
      onLog?.(outcome.summaryMessage, tone);

      // Show enhanced toast notification
      onToast?.({
        title: outcome.toastTitle,
        description: outcome.toastDescription,
        variant: outcome.toastVariant,
      });

      if (detected) {
        if (falseFlagSuccess && scapegoatName && attributedTo) {
          onNews?.(
            'intel',
            `${targetName} blames ${scapegoatName} for a crippling cyber strike`,
            'critical',
          );
          onDefconShift?.(-1, `${targetName} escalates tensions with ${scapegoatName} over cyber evidence`);
        } else if (attributedTo === attacker.id) {
          onNews?.(
            'intel',
            `${targetName} traces cyber attack to ${attackerName}`,
            'important',
          );
          onDefconShift?.(-1, `${targetName} traces cyber attack to ${attackerName}`);
        } else {
          onNews?.('intel', `${targetName} detects intrusion but attribution remains murky`, 'important');
        }
      } else if (success) {
        onNews?.('intel', `Silent breach compromises ${targetName}'s critical systems`, 'urgent');
      }

      if (attributedTo) {
        targetProfile.lastAttribution = {
          turn: turnRef.current,
          attackerId: attacker.id,
          outcome: success ? 'success' : 'failed',
          falseFlagged: falseFlagSuccess,
          attributedTo,
        };
      }

      const entry: CyberOperationLogEntry = {
        id: `cyber_${turnRef.current}_${Math.random().toString(36).slice(2)}`,
        type: action,
        turn: turnRef.current,
        attackerId: attacker.id,
        targetId: target.id,
        success,
        detected,
        attributedTo: attributed ? attributedTo ?? null : null,
        summary: outcome.summaryMessage,
        falseFlag: !!scapegoatId,
      };
      pushLog(entry);

      const updatedNationIds = new Set<string>([attacker.id, target.id]);
      if (scapegoatId && falseFlagSuccess) {
        updatedNationIds.add(scapegoatId);
      }
      onProfilesUpdated?.(Array.from(updatedNationIds));

      return {
        executed: true,
        success,
        detected,
        attributed,
        attributedTo,
        falseFlag: !!scapegoatId,
        message: outcome.summaryMessage,
        severity: success && detected ? 'major' : 'minor',
      };
    },
    [
      computeAttributionChance,
      computeDetectionChance,
      computeFalseFlagChance,
      computeSuccessChance,
      ensureProfile,
      getActionAvailability,
      getNation,
      onDefconShift,
      onLog,
      onNews,
      onProfilesUpdated,
      onToast,
      pushLog,
      setCooldown,
    ],
  );

  const launchAttack = useCallback(
    (attackerId: string, targetId: string): CyberOperationOutcome => {
      const attacker = getNation(attackerId);
      const target = getNation(targetId);
      if (!attacker || !target) {
        const message = 'Invalid attacker or target';
        onToast?.({ title: 'Cyber command error', description: message });
        return { executed: false, message };
      }
      return resolveIntrusion(attacker, target, 'intrusion');
    },
    [getNation, onToast, resolveIntrusion],
  );

  const launchFalseFlag = useCallback(
    (attackerId: string, targetId: string): CyberOperationOutcome => {
      const attacker = getNation(attackerId);
      const target = getNation(targetId);
      if (!attacker || !target) {
        const message = 'Invalid attacker or target';
        onToast?.({ title: 'Cyber command error', description: message });
        return { executed: false, message };
      }
      const scapegoat = pickFalseFlagScapegoat(attacker, target);
      if (!scapegoat) {
        const message = 'No rival available to frame';
        onToast?.({ title: 'False flag unavailable', description: message });
        return { executed: false, message };
      }
      return resolveIntrusion(attacker, target, 'false_flag', scapegoat.id);
    },
    [getNation, onToast, pickFalseFlagScapegoat, resolveIntrusion],
  );

  const hardenNetworks = useCallback(
    (nationId: string): CyberOperationOutcome => {
      const nation = getNation(nationId);
      if (!nation) {
        const message = 'Nation unavailable';
        onToast?.({ title: 'Cyber command error', description: message });
        return { executed: false, message };
      }
      const availability = getActionAvailability(nationId, 'fortify');
      if (!availability.canExecute) {
        if (availability.reason) {
          onToast?.({ title: 'Cannot fortify', description: availability.reason });
        }
        return {
          executed: false,
          message: availability.reason ?? 'Action unavailable',
        };
      }
      const profile = ensureProfile(nation);
      const rule = ACTION_RULES.fortify;
      profile.readiness = Math.max(0, profile.readiness - rule.cost);
      const restoration = 28 + (profile.research.firewalls ? 12 : 6);
      profile.readiness = Math.min(profile.maxReadiness, profile.readiness + restoration);
      setCooldown(nationId, 'fortify', rule.cooldown);
      const summary = `${nation.name} reinforces digital fortifications (+${Math.round(restoration)} readiness).`;
      onLog?.(summary, 'success');
      onToast?.({ title: 'Networks hardened', description: summary });
      onNews?.('intel', `${nation.name} advertises new cyber defenses`, 'routine');
      pushLog({
        id: `cyber_${turnRef.current}_${Math.random().toString(36).slice(2)}`,
        type: 'fortify',
        turn: turnRef.current,
        attackerId: nation.id,
        targetId: nation.id,
        success: true,
        detected: false,
        summary,
      });
      onProfilesUpdated?.([nation.id]);
      return {
        executed: true,
        success: true,
        message: summary,
        severity: 'minor',
      };
    },
    [
      ensureProfile,
      getActionAvailability,
      getNation,
      onLog,
      onNews,
      onProfilesUpdated,
      onToast,
      pushLog,
      setCooldown,
    ],
  );

  const advanceTurn = useCallback(() => {
    setCooldowns(prev => {
      const next: typeof prev = {};
      const all = getNations();
      all.forEach(nation => {
        const existing = prev[nation.id] ?? {};
        const reduced: Partial<Record<CyberActionId, number>> = {};
        (Object.keys(ACTION_RULES) as CyberActionId[]).forEach(actionId => {
          const value = existing[actionId];
          if (value && value > 0) {
            const nextValue = Math.max(0, value - 1);
            if (nextValue > 0) {
              reduced[actionId] = nextValue;
            }
          }
        });
        if (Object.keys(reduced).length > 0) {
          next[nation.id] = reduced;
        }
      });
      return next;
    });

    const nationsList = getNations();
    nationsList.forEach(nation => {
      const profile = ensureProfile(nation);
      const regen = 12 + (profile.research.firewalls ? 5 : 0) + (profile.research.intrusionDetection ? 3 : 0);
      profile.readiness = Math.min(profile.maxReadiness, profile.readiness + regen);
    });
    onProfilesUpdated?.(nationsList.map(nation => nation.id));
  }, [ensureProfile, getNations, onProfilesUpdated]);

  const runAiPlan = useCallback(
    (nationId: string): CyberOperationOutcome | null => {
      const aiNation = getNation(nationId);
      if (!aiNation || aiNation.isPlayer) return null;
      const player = getNations().find(n => n.isPlayer && n.population > 0);
      if (!player) return null;
      const availability = getActionAvailability(aiNation.id, 'intrusion', player.id);
      if (!availability.canExecute) return null;
      const aggressionRoll = rngRef.current();
      if (aggressionRoll > 0.32) return null;
      const outcome = resolveIntrusion(aiNation, player, 'intrusion');
      return outcome.executed ? outcome : null;
    },
    [
      getActionAvailability,
      getNation,
      getNations,
      resolveIntrusion,
    ],
  );

  const profileForNation = useCallback(
    (nationId: string): NationCyberProfile | undefined => {
      const nation = getNation(nationId);
      if (!nation) return undefined;
      return ensureProfile(nation);
    },
    [ensureProfile, getNation],
  );

  return {
    logs,
    getProfile: profileForNation,
    getActionAvailability,
    launchAttack,
    launchFalseFlag,
    hardenNetworks,
    advanceTurn,
    runAiPlan,
  };
}

export type UseCyberWarfareReturn = ReturnType<typeof useCyberWarfare>;
