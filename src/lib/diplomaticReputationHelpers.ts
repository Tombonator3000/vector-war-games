/**
 * Diplomatic Reputation System Helpers
 * Functions to track and update global diplomatic reputation
 */

import type { DiplomaticReputation, ReputationActionType, ReputationAction } from '@/types/diplomaticReputation';
import {
  REPUTATION_CHANGES,
  getReputationLevel,
  getReputationRelationshipModifier,
} from '@/types/diplomaticReputation';

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize diplomatic reputation for a nation
 */
export function initializeDiplomaticReputation(): DiplomaticReputation {
  return {
    score: 0,
    level: 'neutral',
    sources: {
      promiseKeeping: 0,
      allianceLoyalty: 0,
      nuclearRestraint: 0,
      aidGenerosity: 0,
      treatyCompliance: 0,
      warAggression: 0,
    },
    recentActions: [],
    globalRelationshipModifier: 0,
  };
}

// ============================================================================
// REPUTATION UPDATES
// ============================================================================

/**
 * Record a reputation-affecting action
 */
export function recordReputationAction(
  reputation: DiplomaticReputation,
  turn: number,
  actionType: ReputationActionType,
  description: string,
  affectedNation?: string
): DiplomaticReputation {
  const reputationChange = REPUTATION_CHANGES[actionType];

  const newAction: ReputationAction = {
    turn,
    actionType,
    reputationChange,
    description,
    affectedNation,
  };

  // Update sources based on action type
  const updatedSources = { ...reputation.sources };

  switch (actionType) {
    case 'promise-kept':
    case 'promise-broken':
      updatedSources.promiseKeeping += reputationChange;
      break;
    case 'alliance-honored':
    case 'alliance-betrayed':
      updatedSources.allianceLoyalty += reputationChange;
      break;
    case 'nuclear-strike':
    case 'nuclear-restraint':
      updatedSources.nuclearRestraint += reputationChange;
      break;
    case 'aid-sent':
    case 'humanitarian-aid':
      updatedSources.aidGenerosity += reputationChange;
      break;
    case 'treaty-signed':
    case 'treaty-broken':
      updatedSources.treatyCompliance += reputationChange;
      break;
    case 'war-declared':
    case 'genocide':
      updatedSources.warAggression += reputationChange;
      break;
  }

  // Calculate new total score (sum of all sources)
  const newScore = Math.max(
    -100,
    Math.min(
      100,
      Object.values(updatedSources).reduce((sum, value) => sum + value, 0)
    )
  );

  const newLevel = getReputationLevel(newScore);
  const newModifier = getReputationRelationshipModifier(newLevel);

  // Keep only recent 20 actions
  const updatedActions = [newAction, ...reputation.recentActions].slice(0, 20);

  return {
    ...reputation,
    score: newScore,
    level: newLevel,
    sources: updatedSources,
    recentActions: updatedActions,
    globalRelationshipModifier: newModifier,
  };
}

/**
 * Apply passive reputation decay (slowly regress toward neutral)
 */
export function applyReputationDecay(
  reputation: DiplomaticReputation,
  decayRate: number = 0.5
): DiplomaticReputation {
  // Decay each source toward 0
  const updatedSources = { ...reputation.sources };

  for (const [key, value] of Object.entries(updatedSources)) {
    if (value > 0) {
      updatedSources[key as keyof typeof updatedSources] = Math.max(0, value - decayRate);
    } else if (value < 0) {
      updatedSources[key as keyof typeof updatedSources] = Math.min(0, value + decayRate);
    }
  }

  // Recalculate score
  const newScore = Math.max(
    -100,
    Math.min(
      100,
      Object.values(updatedSources).reduce((sum, value) => sum + value, 0)
    )
  );

  const newLevel = getReputationLevel(newScore);
  const newModifier = getReputationRelationshipModifier(newLevel);

  return {
    ...reputation,
    score: newScore,
    level: newLevel,
    sources: updatedSources,
    globalRelationshipModifier: newModifier,
  };
}

/**
 * Get breakdown of reputation sources for UI
 */
export function getReputationBreakdown(reputation: DiplomaticReputation): {
  source: string;
  value: number;
  description: string;
}[] {
  return [
    {
      source: 'Promise Keeping',
      value: reputation.sources.promiseKeeping,
      description: 'Reputation from keeping or breaking promises',
    },
    {
      source: 'Alliance Loyalty',
      value: reputation.sources.allianceLoyalty,
      description: 'Reputation from alliance faithfulness',
    },
    {
      source: 'Nuclear Restraint',
      value: reputation.sources.nuclearRestraint,
      description: 'Reputation from nuclear weapon usage',
    },
    {
      source: 'Aid Generosity',
      value: reputation.sources.aidGenerosity,
      description: 'Reputation from aid and humanitarian efforts',
    },
    {
      source: 'Treaty Compliance',
      value: reputation.sources.treatyCompliance,
      description: 'Reputation from treaty adherence',
    },
    {
      source: 'War Conduct',
      value: reputation.sources.warAggression,
      description: 'Reputation from war declarations and conduct',
    },
  ];
}

/**
 * Check if reputation affects acceptance chance for diplomatic actions
 */
export function getReputationAcceptanceModifier(reputation: DiplomaticReputation): number {
  // Bonus/penalty to acceptance evaluation
  switch (reputation.level) {
    case 'trusted': return 50;
    case 'reliable': return 25;
    case 'neutral': return 0;
    case 'untrustworthy': return -25;
    case 'pariah': return -50;
    default: return 0;
  }
}
