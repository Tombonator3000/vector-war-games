import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  phaseTwoData,
  type LogisticsRouteDefinition,
  type LogisticsStatus,
  type PhaseTwoData,
  type PhaseTwoEvent,
  type ProtocolDefinition,
  type ThreatSectorDefinition,
} from "@/lib/phase-two";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

type AlertEntry = {
  id: string;
  text: string;
};

type LogisticsDerived = LogisticsRouteDefinition & {
  status: LogisticsStatus;
  capacity: number;
  risk: string;
  notes: AlertEntry[];
};

type ThreatDerived = ThreatSectorDefinition & {
  intensity: number;
  notes: AlertEntry[];
};

type OperationDerived = PhaseTwoData["operations"][number] & {
  status: "Aktiv" | "Planlagt";
};

type TimelineStatus = "completed" | "active" | "upcoming";

export interface PhaseTwoMetrics {
  turn: number;
  defcon: number;
  morale: number;
  intel: number;
  activeSeasonId: string;
  unlockedOperations: string[];
  alerts: AlertEntry[];
  logisticsIntegrity: number;
}

export interface TimelineEntry extends PhaseTwoEvent {
  status: TimelineStatus;
}

export const usePhaseTwoData = () =>
  useQuery<PhaseTwoData>({
    queryKey: ["phase-two", "data"],
    queryFn: async () => phaseTwoData,
    staleTime: Infinity,
  });

export const usePhaseTwoSimulation = () => {
  const { data, isLoading } = usePhaseTwoData();
  const [stepIndex, setStepIndex] = useState(0);

  const timeline = data?.script ?? [];
  const boundedIndex = timeline.length > 0 ? Math.min(stepIndex, timeline.length - 1) : 0;
  const appliedSteps = useMemo(() => {
    if (!timeline.length) {
      return [] as PhaseTwoEvent[];
    }

    return timeline.slice(0, boundedIndex + 1);
  }, [timeline, boundedIndex]);

  const logistics = useMemo<LogisticsDerived[]>(() => {
    if (!data) {
      return [];
    }

    const derived: LogisticsDerived[] = data.logistics.map((route) => ({
      ...route,
      status: route.baseStatus,
      capacity: route.baseCapacity,
      risk: route.baseRisk,
      notes: [],
    }));

    const map = new Map<string, LogisticsDerived>(derived.map((route) => [route.id, route]));

    appliedSteps.forEach((event) => {
      event.effects.logistics?.forEach((impact) => {
        const route = map.get(impact.id);
        if (!route) {
          return;
        }

        if (impact.status) {
          route.status = impact.status;
        }
        if (typeof impact.capacityDelta === "number") {
          route.capacity = clamp(route.capacity + impact.capacityDelta, 0, 130);
        }
        if (impact.risk) {
          route.risk = impact.risk;
        }
        if (impact.note) {
          route.notes.push({ id: event.id, text: impact.note });
        }
      });
    });

    return derived;
  }, [data, appliedSteps]);

  const threats = useMemo<ThreatDerived[]>(() => {
    if (!data) {
      return [];
    }

    const derived: ThreatDerived[] = data.threatSectors.map((sector) => ({
      ...sector,
      intensity: sector.baseIntensity,
      notes: [],
    }));

    const map = new Map<string, ThreatDerived>(derived.map((sector) => [sector.id, sector]));

    appliedSteps.forEach((event) => {
      event.effects.threats?.forEach((impact) => {
        const sector = map.get(impact.id);
        if (!sector) {
          return;
        }

        if (typeof impact.intensityDelta === "number") {
          sector.intensity = clamp(sector.intensity + impact.intensityDelta, 0, 100);
        }

        if (impact.posture) {
          sector.posture = impact.posture;
        }

        if (impact.note) {
          sector.notes.push({ id: event.id, text: impact.note });
        }
      });
    });

    return derived;
  }, [data, appliedSteps]);

  const logisticsIntegrity = useMemo(() => {
    if (!logistics.length) {
      return 0;
    }

    const scoreMap: Record<LogisticsStatus, number> = {
      Stabil: 1,
      Presset: 0,
      Kritisk: -1,
      Sårbar: 0.5,
    };

    const score = logistics.reduce((total, route) => total + (scoreMap[route.status] ?? 0), 0) / logistics.length;

    return Math.round(((score + 1) / 2) * 100);
  }, [logistics]);

  const metrics = useMemo<PhaseTwoMetrics | null>(() => {
    if (!data) {
      return null;
    }

    const summary = {
      turn: data.base.turn,
      defcon: data.base.defcon,
      morale: data.base.morale,
      intel: data.base.intel,
      activeSeasonId: data.base.activeSeasonId,
      unlockedOperations: new Set<string>(),
      alerts: [] as AlertEntry[],
    };

    appliedSteps.forEach((event) => {
      summary.turn = event.turn ?? summary.turn + 1;

      if (typeof event.effects.defconDelta === "number") {
        summary.defcon = clamp(summary.defcon + event.effects.defconDelta, 1, 5);
      }

      if (typeof event.effects.moraleDelta === "number") {
        summary.morale = clamp(summary.morale + event.effects.moraleDelta, 0, 100);
      }

      if (typeof event.effects.intelDelta === "number") {
        summary.intel = clamp(summary.intel + event.effects.intelDelta, 0, 100);
      }

      if (event.effects.seasonId) {
        summary.activeSeasonId = event.effects.seasonId;
      }

      event.effects.operationsUnlocked?.forEach((operationId) => {
        summary.unlockedOperations.add(operationId);
      });

      event.effects.alerts?.forEach((text) => {
        summary.alerts.push({ id: event.id, text });
      });
    });

    return {
      ...summary,
      unlockedOperations: Array.from(summary.unlockedOperations),
      logisticsIntegrity,
    };
  }, [data, appliedSteps, logisticsIntegrity]);

  const seasonMap = useMemo(() => {
    if (!data) {
      return new Map<string, PhaseTwoData["seasons"][number]>();
    }

    return new Map(data.seasons.map((season) => [season.id, season]));
  }, [data]);

  const activeSeason = metrics ? seasonMap.get(metrics.activeSeasonId) ?? null : null;

  const operations = useMemo<OperationDerived[]>(() => {
    if (!data) {
      return [];
    }

    const unlocked = new Set(metrics?.unlockedOperations ?? []);
    return data.operations.map((operation) => ({
      ...operation,
      status: unlocked.has(operation.id) ? "Aktiv" : "Planlagt",
    }));
  }, [data, metrics]);

  const protocols = useMemo<ProtocolDefinition[]>(() => data?.protocols ?? [], [data]);

  const timelineEntries = useMemo<TimelineEntry[]>(() => {
    if (!timeline.length) {
      return [];
    }

    return timeline.map((event, index) => ({
      ...event,
      status: index < boundedIndex ? "completed" : index === boundedIndex ? "active" : "upcoming",
    }));
  }, [timeline, boundedIndex]);

  const currentEvent = timelineEntries[boundedIndex] ?? null;

  const canAdvance = boundedIndex < timeline.length - 1;
  const canRewind = boundedIndex > 0;

  const advance = useCallback(() => {
    if (!canAdvance) {
      return;
    }

    setStepIndex((prev) => Math.min(prev + 1, timeline.length - 1));
  }, [canAdvance, timeline.length]);

  const rewind = useCallback(() => {
    if (!canRewind) {
      return;
    }

    setStepIndex((prev) => Math.max(prev - 1, 0));
  }, [canRewind]);

  return {
    isLoading,
    metrics,
    activeSeason,
    logistics,
    threats,
    operations,
    protocols,
    timeline: timelineEntries,
    currentEvent,
    canAdvance,
    canRewind,
    advance,
    rewind,
  };
};

export type { LogisticsStatus, LogisticsDerived, ThreatDerived, OperationDerived, ProtocolDefinition };
