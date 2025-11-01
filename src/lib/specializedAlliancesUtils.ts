/**
 * Specialized Alliances Management Utilities
 *
 * Functions for creating, managing, and maintaining specialized alliances
 */

import type { Nation } from '@/types/game';
import type {
  SpecializedAlliance,
  AllianceType,
  AllianceBenefit,
} from '@/types/specializedAlliances';
import {
  getAllianceConfig,
  getAllianceBenefits,
  getAllianceBetween,
  calculateCooperationDecay,
} from '@/types/specializedAlliances';
import { modifyTrust } from './trustAndFavorsUtils';

// ============================================================================
// ALLIANCE CREATION AND MANAGEMENT
// ============================================================================

/**
 * Create a specialized alliance between two nations
 */
export function createSpecializedAlliance(
  nation1: Nation,
  nation2: Nation,
  type: AllianceType,
  currentTurn: number
): { nation1: Nation; nation2: Nation } {
  if (nation1.id === nation2.id) return { nation1, nation2 };

  // Check if alliance already exists
  const existingAlliance = getAllianceBetween(nation1, nation2.id);
  if (existingAlliance) {
    return { nation1, nation2 };
  }

  const config = getAllianceConfig(type);

  const alliance: SpecializedAlliance = {
    id: `${nation1.id}-${nation2.id}-${type}-${currentTurn}`,
    type,
    nation1Id: nation1.id,
    nation2Id: nation2.id,
    createdTurn: currentTurn,
    active: true,
    level: 1,
    cooperation: 50, // Start at neutral cooperation
    obligations: config.obligations.map((o) => ({ ...o })),
    benefits: getAllianceBenefits(type, 1),
  };

  const alliances1 = nation1.specializedAlliances ?? [];
  const alliances2 = nation2.specializedAlliances ?? [];

  // Also add to traditional alliances list for compatibility
  const traditionalAlliances1 = nation1.alliances ?? [];
  const traditionalAlliances2 = nation2.alliances ?? [];

  return {
    nation1: {
      ...nation1,
      specializedAlliances: [...alliances1, alliance],
      alliances: traditionalAlliances1.includes(nation2.id)
        ? traditionalAlliances1
        : [...traditionalAlliances1, nation2.id],
    },
    nation2: {
      ...nation2,
      specializedAlliances: [...alliances2, alliance],
      alliances: traditionalAlliances2.includes(nation1.id)
        ? traditionalAlliances2
        : [...traditionalAlliances2, nation1.id],
    },
  };
}

/**
 * Break/dissolve an alliance
 */
export function dissolveAlliance(
  nation1: Nation,
  nation2: Nation,
  currentTurn: number
): { nation1: Nation; nation2: Nation } {
  const alliance = getAllianceBetween(nation1, nation2.id);
  if (!alliance) return { nation1, nation2 };

  // Mark as inactive
  const alliances1 = nation1.specializedAlliances ?? [];
  const alliances2 = nation2.specializedAlliances ?? [];

  const updatedAlliances1 = alliances1.map((a) =>
    a.id === alliance.id ? { ...a, active: false } : a
  );
  const updatedAlliances2 = alliances2.map((a) =>
    a.id === alliance.id ? { ...a, active: false } : a
  );

  // Remove from traditional alliances
  const traditionalAlliances1 = nation1.alliances?.filter((id) => id !== nation2.id) ?? [];
  const traditionalAlliances2 = nation2.alliances?.filter((id) => id !== nation1.id) ?? [];

  // Apply trust penalty for breaking alliance
  const nation1WithTrust = modifyTrust(
    nation1,
    nation2.id,
    -15,
    'Broke alliance',
    currentTurn
  );
  const nation2WithTrust = modifyTrust(
    nation2,
    nation1.id,
    -15,
    'Broke alliance',
    currentTurn
  );

  return {
    nation1: {
      ...nation1WithTrust,
      specializedAlliances: updatedAlliances1,
      alliances: traditionalAlliances1,
    },
    nation2: {
      ...nation2WithTrust,
      specializedAlliances: updatedAlliances2,
      alliances: traditionalAlliances2,
    },
  };
}

// ============================================================================
// COOPERATION AND LEVELING
// ============================================================================

/**
 * Modify cooperation score for an alliance
 */
export function modifyCooperation(
  nation: Nation,
  partnerId: string,
  delta: number,
  currentTurn: number
): Nation {
  const alliance = getAllianceBetween(nation, partnerId);
  if (!alliance) return nation;

  const alliances = nation.specializedAlliances ?? [];
  const newCooperation = Math.max(0, Math.min(100, alliance.cooperation + delta));

  const updatedAlliances = alliances.map((a) =>
    a.id === alliance.id ? { ...a, cooperation: newCooperation } : a
  );

  return {
    ...nation,
    specializedAlliances: updatedAlliances,
  };
}

/**
 * Increase alliance level based on cooperation and time
 */
export function updateAllianceLevel(
  nation: Nation,
  partnerId: string,
  currentTurn: number
): Nation {
  const alliance = getAllianceBetween(nation, partnerId);
  if (!alliance || !alliance.active) return nation;

  // Requirements for leveling up
  const turnsActive = currentTurn - alliance.createdTurn;
  const turnRequirement = alliance.level * 10; // Level 1->2: 10 turns, 2->3: 20 turns, etc.
  const cooperationRequirement = 40 + alliance.level * 10; // Level 1->2: 50 coop, 2->3: 60 coop

  if (
    alliance.level < 5 &&
    turnsActive >= turnRequirement &&
    alliance.cooperation >= cooperationRequirement
  ) {
    const newLevel = alliance.level + 1;
    const alliances = nation.specializedAlliances ?? [];

    const updatedAlliances = alliances.map((a) =>
      a.id === alliance.id
        ? {
            ...a,
            level: newLevel,
            benefits: getAllianceBenefits(alliance.type, newLevel),
          }
        : a
    );

    return {
      ...nation,
      specializedAlliances: updatedAlliances,
    };
  }

  return nation;
}

/**
 * Apply cooperation decay if allies haven't interacted
 */
export function applyCooperationDecay(
  nation: Nation,
  partnerId: string,
  lastInteractionTurn: number,
  currentTurn: number
): Nation {
  const alliance = getAllianceBetween(nation, partnerId);
  if (!alliance || !alliance.active) return nation;

  const decay = calculateCooperationDecay(lastInteractionTurn, currentTurn);
  if (decay === 0) return nation;

  return modifyCooperation(nation, partnerId, decay, currentTurn);
}

// ============================================================================
// OBLIGATION VIOLATIONS
// ============================================================================

/**
 * Handle violation of alliance obligation
 */
export function violateObligation(
  violator: Nation,
  partnerId: string,
  obligationType: string,
  currentTurn: number
): Nation {
  const alliance = getAllianceBetween(violator, partnerId);
  if (!alliance) return violator;

  const config = getAllianceConfig(alliance.type);
  const obligation = config.obligations.find((o) => o.type === obligationType);

  if (!obligation) return violator;

  // Apply penalties
  let updated = violator;

  if (obligation.violationPenalty.trust !== 0) {
    updated = modifyTrust(
      updated,
      partnerId,
      obligation.violationPenalty.trust,
      `Violated ${alliance.type} alliance obligation: ${obligation.description}`,
      currentTurn
    );
  }

  if (obligation.violationPenalty.cooperation !== 0) {
    updated = modifyCooperation(
      updated,
      partnerId,
      obligation.violationPenalty.cooperation,
      currentTurn
    );
  }

  // For mandatory obligations, consider dissolving alliance if severe
  if (obligation.mandatory && obligation.violationPenalty.trust <= -30) {
    // Mark for potential dissolution (would be handled in diplomacy resolution)
    const alliances = updated.specializedAlliances ?? [];
    const updatedAlliances = alliances.map((a) =>
      a.id === alliance.id ? { ...a, cooperation: Math.max(0, a.cooperation - 20) } : a
    );

    updated = {
      ...updated,
      specializedAlliances: updatedAlliances,
    };
  }

  return updated;
}

// ============================================================================
// BENEFIT CALCULATIONS
// ============================================================================

/**
 * Get total military bonus from alliances (attack/defense)
 */
export function getMilitaryAllianceBonus(
  nation: Nation,
  type: 'attack' | 'defense'
): number {
  if (!nation.specializedAlliances) return 0;

  const militaryAlliances = nation.specializedAlliances.filter(
    (a) => (a.type === 'military' || a.type === 'defensive') && a.active
  );

  return militaryAlliances.reduce((total, alliance) => {
    const benefits = alliance.benefits;
    const bonusType = type === 'attack' ? 'unit-bonus' : 'defense-bonus';
    const bonus = benefits.find((b) => b.type === bonusType && b.active);
    return total + (bonus?.value ?? 0);
  }, 0);
}

/**
 * Get total production bonus from economic alliances
 */
export function getProductionBonus(nation: Nation): number {
  if (!nation.specializedAlliances) return 0;

  const economicAlliances = nation.specializedAlliances.filter(
    (a) => a.type === 'economic' && a.active
  );

  return economicAlliances.reduce((total, alliance) => {
    const benefits = alliance.benefits;
    const bonus = benefits.find((b) => b.type === 'production-bonus' && b.active);
    return total + (bonus?.value ?? 0);
  }, 0);
}

/**
 * Get total research speed bonus from research alliances
 */
export function getResearchSpeedBonus(nation: Nation): number {
  if (!nation.specializedAlliances) return 0;

  const researchAlliances = nation.specializedAlliances.filter(
    (a) => a.type === 'research' && a.active
  );

  return researchAlliances.reduce((total, alliance) => {
    const benefits = alliance.benefits;
    const bonus = benefits.find((b) => b.type === 'research-speed' && b.active);
    return total + (bonus?.value ?? 0);
  }, 0);
}

/**
 * Check if nation has a specific alliance benefit
 */
export function hasAllianceBenefit(
  nation: Nation,
  partnerId: string,
  benefitType: string
): boolean {
  const alliance = getAllianceBetween(nation, partnerId);
  if (!alliance || !alliance.active) return false;

  return alliance.benefits.some((b) => b.type === benefitType && b.active);
}

/**
 * Get all active benefits from all alliances
 */
export function getAllActiveBenefits(nation: Nation): AllianceBenefit[] {
  if (!nation.specializedAlliances) return [];

  const activeAlliances = nation.specializedAlliances.filter((a) => a.active);

  const allBenefits: AllianceBenefit[] = [];
  for (const alliance of activeAlliances) {
    allBenefits.push(...alliance.benefits.filter((b) => b.active));
  }

  return allBenefits;
}

// ============================================================================
// TURN UPDATES
// ============================================================================

/**
 * Update all alliances for a nation per turn
 */
export function updateAlliancesPerTurn(
  nation: Nation,
  currentTurn: number,
  allNations: Nation[]
): Nation {
  if (!nation.specializedAlliances) return nation;

  let updated = nation;

  // Update each active alliance
  for (const alliance of nation.specializedAlliances) {
    if (!alliance.active) continue;

    const partnerId =
      alliance.nation1Id === nation.id ? alliance.nation2Id : alliance.nation1Id;

    // Check for level up opportunities
    updated = updateAllianceLevel(updated, partnerId, currentTurn);

    // Increase cooperation slightly for active alliances (+0.5 per turn)
    if (alliance.cooperation < 100) {
      updated = modifyCooperation(updated, partnerId, 0.5, currentTurn);
    }
  }

  return updated;
}

/**
 * Initialize specialized alliances for game start
 */
export function initializeSpecializedAlliances(nations: Nation[]): Nation[] {
  return nations.map((nation) => ({
    ...nation,
    specializedAlliances: nation.specializedAlliances ?? [],
  }));
}

/**
 * Convert traditional alliance to specialized alliance
 */
export function convertToSpecializedAlliance(
  nation1: Nation,
  nation2: Nation,
  type: AllianceType,
  currentTurn: number
): { nation1: Nation; nation2: Nation } {
  // Check if they have a traditional alliance
  const hasTraditionalAlliance =
    nation1.alliances?.includes(nation2.id) && nation2.alliances?.includes(nation1.id);

  if (!hasTraditionalAlliance) {
    return { nation1, nation2 };
  }

  // Create specialized alliance
  return createSpecializedAlliance(nation1, nation2, type, currentTurn);
}
