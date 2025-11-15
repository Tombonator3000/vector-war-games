import type { ReactNode } from 'react';
import type { NewsItem } from '@/components/NewsTicker';

interface GlobalCasualtyMilestone {
  threshold: number;
  id: string;
  label: string;
  headline: string;
  narrative: string;
}

export const GLOBAL_CASUALTY_MILESTONES: GlobalCasualtyMilestone[] = [
  {
    threshold: 5_000_000,
    id: 'wwi',
    label: 'World War I',
    headline: 'Global losses rival the trenches of World War I.',
    narrative:
      'Reports describe cities dissolving into attritional warfare. Medical corps and relief agencies are drained to the breaking point as casualty figures echo the industrial slaughter of the Great War.',
  },
  {
    threshold: 50_000_000,
    id: 'spanish-flu',
    label: 'Spanish Flu Pandemic',
    headline: 'Fatalities eclipse the Spanish Flu pandemic.',
    narrative:
      'Emergency broadcasters compare morgues to 1918, where streets became triage wards and nations rationed grief. Analysts warn that civic order is eroding as the pathogen spreads faster than countermeasures.',
  },
  {
    threshold: 75_000_000,
    id: 'wwii',
    label: 'World War II',
    headline: 'Death toll now on par with World War II.',
    narrative:
      'Military historians confirm that the combined fatalities mirror the devastation of the Second World War. Governments activate continuity protocols, fearing a collapse of the global order.',
  },
  {
    threshold: 200_000_000,
    id: 'black-death',
    label: 'Black Death',
    headline: 'Humanity faces a Black Death-level catastrophe.',
    narrative:
      'Global monitoring stations transmit apocalyptic alerts: the death toll has reached medieval plague levels. Entire regions are silent as supply chains, governance, and healthcare crumble simultaneously.',
  },
];
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
  milestoneId?: string;
  milestoneLabel?: string;
  milestoneHeadline?: string;
  milestoneNarrative?: string;
}

export interface CasualtyAlertHandlers {
  openModal: (title: string, content: ReactNode) => void;
  addNewsItem: (
    category: NewsItem['category'],
    text: string,
    priority: NewsItem['priority']
  ) => void;
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

  const triggeredGlobalMilestones = GLOBAL_CASUALTY_MILESTONES.filter((milestone) => {
    if (tracker.triggeredThresholds.has(milestone.threshold)) {
      return false;
    }
    return previousTotal < milestone.threshold && combinedTotal >= milestone.threshold;
  });

  triggeredGlobalMilestones.forEach((milestone) => tracker.triggeredThresholds.add(milestone.threshold));

  if (triggeredGlobalMilestones.length > 0) {
    const highestMilestone = triggeredGlobalMilestones.reduce((previous, current) =>
      current.threshold > previous.threshold ? current : previous,
    );
    const summaryPayload: CasualtySummaryPayload = {
      type: 'global',
      threshold: highestMilestone.threshold,
      turn,
      totalCasualties: combinedTotal,
      pandemicCasualties: totalPandemicCasualties,
      plagueCasualties: totalPlagueCasualties,
      hardestHit,
      milestoneId: highestMilestone.id,
      milestoneLabel: highestMilestone.label,
      milestoneHeadline: highestMilestone.headline,
      milestoneNarrative: highestMilestone.narrative,
    };

    handlers.addNewsItem(
      'crisis',
      `[Emergency Broadcast] ${highestMilestone.headline} ${highestMilestone.narrative} Confirmed losses now exceed ${formatNumber(highestMilestone.threshold)} lives.`,
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
