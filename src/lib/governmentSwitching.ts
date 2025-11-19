/**
 * Government Switching System
 *
 * Handles the logic for switching between government types,
 * including stability costs, cooldowns, and transition effects.
 */

import type { Nation } from '@/types/game';
import type { GovernmentType, GovernmentState } from '@/types/government';
import { GOVERNMENT_BONUSES, GOVERNMENT_INFO } from '@/types/government';

export const TRANSITION_COOLDOWN_TURNS = 10; // Turns that must pass before another government change
export const BASE_STABILITY_COST = 15; // Base stability penalty percentage
export const MINIMUM_STABILITY_TO_CHANGE = 30; // Minimum stability required to change government

export interface GovernmentTransitionResult {
  success: boolean;
  message: string;
  newGovernmentState?: GovernmentState;
  stabilityChange?: number;
}

/**
 * Check if a nation can change its government
 */
export function canChangeGovernment(
  nation: Nation,
  currentTurn: number
): { allowed: boolean; reason?: string } {
  if (!nation.governmentState) {
    return { allowed: false, reason: 'No government state initialized' };
  }

  // Check stability requirement
  if (nation.governmentState.governmentStability < MINIMUM_STABILITY_TO_CHANGE) {
    return {
      allowed: false,
      reason: `Government too unstable (${Math.round(nation.governmentState.governmentStability)}% < ${MINIMUM_STABILITY_TO_CHANGE}%)`,
    };
  }

  // Check cooldown
  const lastChangeTurn = nation.governmentState.lastGovernmentChangeTurn ?? 0;
  const turnsUntilCanChange = Math.max(0, TRANSITION_COOLDOWN_TURNS - (currentTurn - lastChangeTurn));

  if (turnsUntilCanChange > 0) {
    return {
      allowed: false,
      reason: `Transition cooldown active (${turnsUntilCanChange} turn${turnsUntilCanChange !== 1 ? 's' : ''} remaining)`,
    };
  }

  return { allowed: true };
}

/**
 * Calculate the stability cost of switching to a new government
 */
export function calculateStabilityCost(
  fromGovernment: GovernmentType,
  toGovernment: GovernmentType,
  currentStability: number
): number {
  let cost = BASE_STABILITY_COST;

  // Increased cost for radical changes
  const democratic = ['democracy', 'constitutional_monarchy'];
  const authoritarian = ['dictatorship', 'military_junta', 'one_party_state', 'theocracy'];

  if (
    (democratic.includes(fromGovernment) && authoritarian.includes(toGovernment)) ||
    (authoritarian.includes(fromGovernment) && democratic.includes(toGovernment))
  ) {
    cost += 10; // +10% additional cost for ideology shift
  }

  // Lower cost if stability is already low (easier to change when unstable)
  if (currentStability < 50) {
    cost *= 0.8;
  }

  return Math.round(cost);
}

/**
 * Execute a government transition
 */
export function transitionGovernment(
  nation: Nation,
  newGovernmentType: GovernmentType,
  currentTurn: number
): GovernmentTransitionResult {
  if (!nation.governmentState) {
    return {
      success: false,
      message: 'No government state to transition from',
    };
  }

  // Check if government is unlocked
  const unlockedGovs = nation.unlockedGovernments || ['democracy'];
  if (!unlockedGovs.includes(newGovernmentType)) {
    return {
      success: false,
      message: `${GOVERNMENT_INFO[newGovernmentType].name} not unlocked. Research required.`,
    };
  }

  // Check if already this government
  if (nation.governmentState.currentGovernment === newGovernmentType) {
    return {
      success: false,
      message: 'Already using this government type',
    };
  }

  // Check if can change
  const canChange = canChangeGovernment(nation, currentTurn);
  if (!canChange.allowed) {
    return {
      success: false,
      message: canChange.reason || 'Cannot change government',
    };
  }

  const oldGovernment = nation.governmentState.currentGovernment;
  const stabilityCost = calculateStabilityCost(
    oldGovernment,
    newGovernmentType,
    nation.governmentState.governmentStability
  );

  // Create new government state
  const newGovernmentState: GovernmentState = {
    ...nation.governmentState,
    currentGovernment: newGovernmentType,
    governmentStability: Math.max(0, nation.governmentState.governmentStability - stabilityCost),
    legitimacy: Math.max(20, nation.governmentState.legitimacy - 10), // Small legitimacy hit
    lastGovernmentChangeTurn: currentTurn,
    cameByForce: false, // Peaceful transition through selection
    turnsInPower: 0,
    coupRisk: nation.governmentState.coupRisk + 5, // Slight increase in coup risk during transition
  };

  // Update support levels for new government
  newGovernmentState.governmentSupport = {
    ...nation.governmentState.governmentSupport,
    [newGovernmentType]: Math.min(
      100,
      (nation.governmentState.governmentSupport[newGovernmentType] || 20) + 15
    ),
    [oldGovernment]: Math.max(
      5,
      (nation.governmentState.governmentSupport[oldGovernment] || 20) - 10
    ),
  };

  return {
    success: true,
    message: `Successfully transitioned from ${GOVERNMENT_INFO[oldGovernment].name} to ${GOVERNMENT_INFO[newGovernmentType].name}`,
    newGovernmentState,
    stabilityChange: -stabilityCost,
  };
}

/**
 * Get turns until government can be changed again
 */
export function getTurnsUntilCanChange(nation: Nation, currentTurn: number): number {
  if (!nation.governmentState) return 0;

  const lastChangeTurn = nation.governmentState.lastGovernmentChangeTurn ?? 0;
  return Math.max(0, TRANSITION_COOLDOWN_TURNS - (currentTurn - lastChangeTurn));
}

/**
 * Check if a government type is unlocked for a nation
 */
export function isGovernmentUnlocked(nation: Nation, governmentType: GovernmentType): boolean {
  const unlockedGovs = nation.unlockedGovernments || ['democracy'];
  return unlockedGovs.includes(governmentType);
}

/**
 * Get all unlocked governments for a nation
 */
export function getUnlockedGovernments(nation: Nation): GovernmentType[] {
  return nation.unlockedGovernments || ['democracy'];
}

/**
 * Initialize unlocked governments for a new nation
 * Called when game starts or nation is created
 */
export function initializeUnlockedGovernments(nation: Nation): void {
  if (!nation.unlockedGovernments) {
    nation.unlockedGovernments = ['democracy']; // Everyone starts with democracy
  }
}

/**
 * Apply government bonuses to nation stats
 * This should be called during turn processing to apply government effects
 */
export function applyGovernmentBonuses(nation: Nation): void {
  if (!nation.governmentState) return;

  const bonuses = GOVERNMENT_BONUSES[nation.governmentState.currentGovernment];

  // Apply production multiplier
  if (bonuses.productionMultiplier !== 1.0) {
    nation.productionMultiplier = (nation.productionMultiplier || 1.0) * bonuses.productionMultiplier;
  }

  // Note: Other bonuses like research multiplier, recruitment, etc. should be
  // applied in their respective systems by reading from GOVERNMENT_BONUSES
}
