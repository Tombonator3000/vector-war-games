/**
 * Diplomatic Reputation System (Phase 4)
 * Global reputation score that affects all AI nations' base relationship
 */

export type ReputationLevel =
  | 'pariah'        // -100 to -60: Universally despised
  | 'untrustworthy' // -59 to -20: Poor reputation
  | 'neutral'       // -19 to 19: No strong reputation
  | 'reliable'      // 20 to 59: Positive reputation
  | 'trusted';      // 60 to 100: Excellent reputation

export interface DiplomaticReputation {
  /** Overall reputation score (-100 to +100) */
  score: number;

  /** Current reputation level */
  level: ReputationLevel;

  /** Breakdown of reputation sources */
  sources: {
    promiseKeeping: number;     // Keeping/breaking promises
    allianceLoyalty: number;    // Alliance faithfulness
    nuclearRestraint: number;   // Nuclear weapon usage restraint
    aidGenerosity: number;      // Aid given to others
    treatyCompliance: number;   // Treaty adherence
    warAggression: number;      // Aggressive war declarations
  };

  /** Recent actions affecting reputation */
  recentActions: ReputationAction[];

  /** Passive relationship modifier applied to all nations */
  globalRelationshipModifier: number;
}

export interface ReputationAction {
  turn: number;
  actionType: ReputationActionType;
  reputationChange: number;
  description: string;
  affectedNation?: string; // Optional: specific nation involved
}

export type ReputationActionType =
  | 'promise-kept'
  | 'promise-broken'
  | 'alliance-honored'
  | 'alliance-betrayed'
  | 'nuclear-strike'
  | 'nuclear-restraint'
  | 'aid-sent'
  | 'aid-refused'
  | 'treaty-signed'
  | 'treaty-broken'
  | 'war-declared'
  | 'peace-made'
  | 'genocide'
  | 'humanitarian-aid';

/**
 * Reputation change values for different actions
 */
export const REPUTATION_CHANGES: Record<ReputationActionType, number> = {
  'promise-kept': 2,
  'promise-broken': -10,
  'alliance-honored': 5,
  'alliance-betrayed': -15,
  'nuclear-strike': -8,
  'nuclear-restraint': 3,
  'aid-sent': 4,
  'aid-refused': -2,
  'treaty-signed': 3,
  'treaty-broken': -12,
  'war-declared': -5,
  'peace-made': 4,
  'genocide': -20,
  'humanitarian-aid': 6,
};

/**
 * Calculate reputation level from score
 */
export function getReputationLevel(score: number): ReputationLevel {
  if (score >= 60) return 'trusted';
  if (score >= 20) return 'reliable';
  if (score >= -19) return 'neutral';
  if (score >= -59) return 'untrustworthy';
  return 'pariah';
}

/**
 * Get global relationship modifier based on reputation level
 */
export function getReputationRelationshipModifier(level: ReputationLevel): number {
  switch (level) {
    case 'trusted': return 15;
    case 'reliable': return 8;
    case 'neutral': return 0;
    case 'untrustworthy': return -8;
    case 'pariah': return -20;
    default: return 0;
  }
}

/**
 * Get color for reputation level (for UI)
 */
export function getReputationColor(level: ReputationLevel): string {
  switch (level) {
    case 'trusted': return 'text-green-400';
    case 'reliable': return 'text-blue-400';
    case 'neutral': return 'text-slate-400';
    case 'untrustworthy': return 'text-orange-400';
    case 'pariah': return 'text-red-400';
    default: return 'text-slate-400';
  }
}

/**
 * Get description for reputation level
 */
export function getReputationDescription(level: ReputationLevel): string {
  switch (level) {
    case 'trusted':
      return 'Your word is your bond. Nations trust you implicitly.';
    case 'reliable':
      return 'You have a positive reputation on the world stage.';
    case 'neutral':
      return 'Your reputation is neither good nor bad.';
    case 'untrustworthy':
      return 'Other nations view you with suspicion.';
    case 'pariah':
      return 'You are universally despised. Nations will not trust you.';
    default:
      return 'Unknown reputation';
  }
}
