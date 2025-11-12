import type { ReactNode } from 'react';

export const GLOBAL_CASUALTY_THRESHOLDS = [500_000, 1_000_000, 5_000_000];
export const NATION_SPIKE_THRESHOLDS = [100_000, 250_000, 500_000, 1_000_000];

export interface CasualtyAlertTracker {
  lastGlobalTotal: number;
  triggeredThresholds: Set<number>;
  nationTotals: Map<string, number>;
  nationSpikeLevels: Map<string, number>;
}

export interface NationIdentifier {
  id: string;
  name: string;
}

export interface NationImpactSummary {
  nationId: string;
  nationName: string;
  turnDeaths: number;
  totalDeaths: number;
}

export interface CasualtySummaryPayload {
  type: 'global' | 'nation';
  threshold: number;
  turn: number;
  totalCasualties: number;
  pandemicCasualties: number;
  plagueCasualties: number;
  hardestHit: NationImpactSummary[];
  focusNation?: NationImpactSummary;
}

export interface CasualtyAlertHandlers {
  openModal: (title: string, content: ReactNode) => void;
  addNewsItem: (category: string, text: string, priority: string) => void;
  buildSummary: (payload: CasualtySummaryPayload) => ReactNode;
}

export interface EvaluateCasualtyMilestonesParams {
  tracker: CasualtyAlertTracker;
  pandemicCasualtyTally: number;
  plagueKillTotal: number;
  casualtyTotalsThisTurn: Record<string, number> | undefined;
  nations: NationIdentifier[];
  turn: number;
  handlers: CasualtyAlertHandlers;
}

export function createCasualtyAlertTracker(): CasualtyAlertTracker {
  return {
    lastGlobalTotal: 0,
    triggeredThresholds: new Set<number>(),
    nationTotals: new Map<string, number>(),
    nationSpikeLevels: new Map<string, number>(),
  };
}

const formatNumber = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 0 });

export function evaluateCasualtyMilestones({
  tracker,
  pandemicCasualtyTally,
  plagueKillTotal,
  casualtyTotalsThisTurn,
  nations,
  turn,
  handlers,
}: EvaluateCasualtyMilestonesParams): boolean {
  const totalPandemicCasualties = Math.max(0, Math.round(pandemicCasualtyTally));
  const totalPlagueCasualties = Math.max(0, Math.round(plagueKillTotal));
  const combinedTotal = totalPandemicCasualties + totalPlagueCasualties;
  const previousTotal = tracker.lastGlobalTotal ?? 0;

  tracker.lastGlobalTotal = combinedTotal;

  const casualtiesThisTurn = Object.entries(casualtyTotalsThisTurn ?? {})
    .map(([nationId, deaths]) => ({
      nationId,
      deaths: Number.isFinite(deaths) ? deaths : 0,
    }))
    .filter((entry) => entry.deaths > 0);

  const nationLookup = new Map<string, string>(nations.map((nation) => [nation.id, nation.name]));

  casualtiesThisTurn.forEach(({ nationId, deaths }) => {
    const previousNationTotal = tracker.nationTotals.get(nationId) ?? 0;
    tracker.nationTotals.set(nationId, previousNationTotal + deaths);
  });

  const hardestHit = Array.from(tracker.nationTotals.entries())
    .map(([nationId, totalDeaths]) => ({
      nationId,
      nationName: nationLookup.get(nationId) ?? nationId,
      totalDeaths,
      turnDeaths: casualtiesThisTurn.find((entry) => entry.nationId === nationId)?.deaths ?? 0,
    }))
    .filter((entry) => entry.totalDeaths > 0)
    .sort((a, b) => b.totalDeaths - a.totalDeaths)
    .slice(0, 5);

  const triggeredGlobalThresholds = GLOBAL_CASUALTY_THRESHOLDS.filter((threshold) => {
    if (tracker.triggeredThresholds.has(threshold)) {
      return false;
    }
    return previousTotal < threshold && combinedTotal >= threshold;
  });

  triggeredGlobalThresholds.forEach((threshold) => tracker.triggeredThresholds.add(threshold));

  if (triggeredGlobalThresholds.length > 0) {
    const highestThreshold = Math.max(...triggeredGlobalThresholds);
    const summaryPayload: CasualtySummaryPayload = {
      type: 'global',
      threshold: highestThreshold,
      turn,
      totalCasualties: combinedTotal,
      pandemicCasualties: totalPandemicCasualties,
      plagueCasualties: totalPlagueCasualties,
      hardestHit,
    };

    handlers.addNewsItem(
      'crisis',
      `Global casualties surpass ${formatNumber(highestThreshold)} lives lost.`,
      'critical',
    );

    handlers.openModal('GLOBAL CASUALTY ALERT', handlers.buildSummary(summaryPayload));
    return true;
  }

  const nationAlerts = casualtiesThisTurn
    .map(({ nationId, deaths }) => {
      const highestThreshold = NATION_SPIKE_THRESHOLDS.filter((threshold) => {
        const lastTriggered = tracker.nationSpikeLevels.get(nationId) ?? 0;
        return deaths >= threshold && threshold > lastTriggered;
      });

      if (highestThreshold.length === 0) {
        return null;
      }

      const threshold = Math.max(...highestThreshold);
      tracker.nationSpikeLevels.set(nationId, threshold);

      return {
        nationId,
        threshold,
        deaths,
        totalDeaths: tracker.nationTotals.get(nationId) ?? deaths,
      };
    })
    .filter((entry): entry is { nationId: string; threshold: number; deaths: number; totalDeaths: number } => entry !== null);

  if (nationAlerts.length > 0) {
    nationAlerts.sort((a, b) => {
      if (a.threshold === b.threshold) {
        return b.deaths - a.deaths;
      }
      return b.threshold - a.threshold;
    });

    const focus = nationAlerts[0];
    const focusNationName = nationLookup.get(focus.nationId) ?? focus.nationId;

    const summaryPayload: CasualtySummaryPayload = {
      type: 'nation',
      threshold: focus.threshold,
      turn,
      totalCasualties: combinedTotal,
      pandemicCasualties: totalPandemicCasualties,
      plagueCasualties: totalPlagueCasualties,
      focusNation: {
        nationId: focus.nationId,
        nationName: focusNationName,
        turnDeaths: focus.deaths,
        totalDeaths: focus.totalDeaths,
      },
      hardestHit,
    };

    handlers.addNewsItem(
      'crisis',
      `${focusNationName} suffers ${formatNumber(focus.deaths)} casualties in a single turn.`,
      'urgent',
    );

    handlers.openModal('CATASTROPHIC CASUALTIES REPORTED', handlers.buildSummary(summaryPayload));
    return true;
  }

  return false;
}
