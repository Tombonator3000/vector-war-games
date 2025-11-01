/**
 * Trust and Favors System
 *
 * Trust: Long-term relationship reliability (0-100, starts at 50)
 * - Increases: Honoring treaties, long alliances, keeping promises
 * - Decreases: Breaking treaties, surprise attacks, betrayals
 * - Effects: High trust = better deals, low trust = expensive proposals, won't ally
 *
 * Favors: Short-term diplomatic obligations (can be positive or negative)
 * - Earned: Helping in war, sending aid, sharing intel, giving territory
 * - Spent: Call to war, request aid, demand territory, increase trust
 */

import type { Nation } from './game';

// Trust system constants
export const MIN_TRUST = 0;
export const MAX_TRUST = 100;
export const DEFAULT_TRUST = 50; // Neutral starting point

// Trust thresholds
export const TRUST_THRESHOLD_HIGH = 80; // Won't be rivaled
export const TRUST_THRESHOLD_LOW = 30; // Won't ally

// Trust change amounts
export const TrustDeltas = {
  // Positive actions (increase trust)
  HONOR_TREATY: 5,
  LONG_ALLIANCE_PER_TURN: 0.5, // Slow build over time
  KEEP_PROMISE: 10,
  DEFEND_ALLY: 8,
  REJECT_ENEMY_OFFER: 3,

  // Negative actions (decrease trust)
  BREAK_TREATY: -25,
  SURPRISE_ATTACK: -40,
  BREAK_PROMISE: -20,
  BETRAY_ALLY: -35,
  REFUSE_HELP_CALL: -15,

  // Neutral decay
  DECAY_ABOVE_NEUTRAL: -0.5, // Trust > 50 decays slowly toward 50
  DECAY_BELOW_NEUTRAL: 0.5,  // Trust < 50 increases slowly toward 50
} as const;

// Favors system constants
export const MIN_FAVORS = -100;
export const MAX_FAVORS = 100;

// Favor earning amounts
export const FavorEarning = {
  // War participation (based on contribution)
  WAR_PARTICIPATION_LOW: 5,      // < 20% contribution
  WAR_PARTICIPATION_MEDIUM: 10,  // 20-50% contribution
  WAR_PARTICIPATION_HIGH: 20,    // > 50% contribution

  // Other actions
  SEND_AID: 2,
  SHARE_INTEL: 3,
  GIVE_TERRITORY: 10, // Per significant territory
  NOT_CALL_TO_WAR: 1, // Per turn when could have called
  SUPPORT_IN_COUNCIL: 2, // Future: voting together
  BROKER_PEACE: 5,
} as const;

// Favor spending costs
export const FavorCosts = {
  CALL_TO_WAR: 10,           // Guarantee ally joins war
  REQUEST_AID: 5,            // Ask for economic assistance
  REQUEST_MILITARY_ACCESS: 3, // Ask for passage rights
  DEMAND_TERRITORY: 15,       // Claim provinces in peace
  INCREASE_TRUST: 10,         // +5 trust
  DEMAND_SANCTION_LIFT: 5,    // Ask them to remove sanctions
  REQUEST_INTEL_SHARE: 4,     // Get intelligence on enemy
} as const;

/**
 * Trust record for a nation pair
 */
export interface TrustRecord {
  value: number;           // Current trust level (0-100)
  lastUpdated: number;     // Turn when last modified
  history: TrustEvent[];   // Recent trust changes
}

/**
 * Trust change event
 */
export interface TrustEvent {
  turn: number;
  delta: number;
  reason: string;
  newValue: number;
}

/**
 * Favor balance for a nation pair
 */
export interface FavorBalance {
  value: number;           // Net favors (positive = they owe you, negative = you owe them)
  lastUpdated: number;     // Turn when last modified
  history: FavorEvent[];   // Recent favor changes
}

/**
 * Favor change event
 */
export interface FavorEvent {
  turn: number;
  delta: number;
  reason: string;
  newValue: number;
}

/**
 * Diplomatic promise made between nations
 */
export interface DiplomaticPromise {
  id: string;
  type: PromiseType;
  fromNationId: string;
  toNationId: string;
  createdTurn: number;
  expiresTurn: number;
  fulfilled: boolean;
  broken: boolean;
  terms: PromiseTerms;
}

/**
 * Types of diplomatic promises
 */
export type PromiseType =
  | 'no-attack'           // Won't attack for X turns
  | 'help-if-attacked'    // Will defend if they're attacked
  | 'no-ally-with'        // Won't ally with specified enemy
  | 'support-council'     // Will support in council votes (future)
  | 'no-nuclear-weapons'  // Won't use nukes
  | 'neutral-mediator';   // Won't declare wars, acts as mediator

/**
 * Terms of a diplomatic promise
 */
export interface PromiseTerms {
  duration?: number;           // Turns until promise expires
  targetNationId?: string;     // For "no-ally-with" promises
  trustReward?: number;        // Trust gained if kept
  trustPenalty?: number;       // Trust lost if broken
  relationshipPenalty?: number; // Relationship lost if broken
  global?: boolean;            // Applies to all nations (e.g., "no nuclear weapons")
}

/**
 * Get trust value between two nations
 */
export function getTrust(nation: Nation, targetNationId: string): number {
  if (!nation.trustRecords) return DEFAULT_TRUST;
  const record = nation.trustRecords[targetNationId];
  return record?.value ?? DEFAULT_TRUST;
}

/**
 * Get favor balance between two nations
 * Positive = they owe you favors, Negative = you owe them favors
 */
export function getFavors(nation: Nation, targetNationId: string): number {
  if (!nation.favorBalances) return 0;
  const balance = nation.favorBalances[targetNationId];
  return balance?.value ?? 0;
}

/**
 * Clamp trust to valid range
 */
export function clampTrust(value: number): number {
  return Math.max(MIN_TRUST, Math.min(MAX_TRUST, value));
}

/**
 * Clamp favors to valid range
 */
export function clampFavors(value: number): number {
  return Math.max(MIN_FAVORS, Math.min(MAX_FAVORS, value));
}

/**
 * Get trust category description
 */
export function getTrustCategory(trust: number): string {
  if (trust >= 80) return 'Trusted Partner';
  if (trust >= 60) return 'Reliable';
  if (trust >= 40) return 'Neutral';
  if (trust >= 20) return 'Untrustworthy';
  return 'Treacherous';
}

/**
 * Get trust color for UI display
 */
export function getTrustColor(trust: number): string {
  if (trust >= 80) return 'text-green-500';
  if (trust >= 60) return 'text-green-400';
  if (trust >= 40) return 'text-gray-400';
  if (trust >= 20) return 'text-orange-400';
  return 'text-red-500';
}

/**
 * Check if trust is high enough for alliance
 */
export function canAllyBasedOnTrust(trust: number): boolean {
  return trust >= TRUST_THRESHOLD_LOW;
}

/**
 * Check if there are enough favors to spend
 */
export function hasEnoughFavors(nation: Nation, targetNationId: string, cost: number): boolean {
  const favors = getFavors(nation, targetNationId);
  return favors >= cost;
}

/**
 * Get trust modifier for diplomacy actions
 * Returns multiplier for proposal acceptance (0.5 at trust 0, 1.0 at trust 50, 1.5 at trust 100)
 */
export function getTrustModifier(trust: number): number {
  return 0.5 + (trust / 100);
}

/**
 * Calculate automatic trust decay per turn
 * Trust naturally drifts toward neutral (50) over time
 */
export function calculateTrustDecay(currentTrust: number): number {
  if (currentTrust > DEFAULT_TRUST) {
    return TrustDeltas.DECAY_ABOVE_NEUTRAL;
  } else if (currentTrust < DEFAULT_TRUST) {
    return TrustDeltas.DECAY_BELOW_NEUTRAL;
  }
  return 0;
}

/**
 * Get standard trust change for common actions
 */
export function getStandardTrustDelta(action: keyof typeof TrustDeltas): number {
  return TrustDeltas[action];
}

/**
 * Get standard favor earning for actions
 */
export function getStandardFavorEarning(action: keyof typeof FavorEarning): number {
  return FavorEarning[action];
}

/**
 * Get favor cost for spending action
 */
export function getFavorCost(action: keyof typeof FavorCosts): number {
  return FavorCosts[action];
}
