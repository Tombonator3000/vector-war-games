/**
 * Grievances and Claims Management Utilities
 *
 * Functions for creating, managing, and resolving grievances and claims
 */

import type { Nation } from '@/types/game';
import type {
  Grievance,
  GrievanceType,
  GrievanceSeverity,
  Claim,
  ClaimType,
  ClaimStrength,
} from '@/types/grievancesAndClaims';
import {
  GrievanceDefinitions,
  ClaimDefinitions,
  ClaimStrengthModifiers,
} from '@/types/grievancesAndClaims';
import { modifyTrust } from './trustAndFavorsUtils';

// ============================================================================
// GRIEVANCE MANAGEMENT
// ============================================================================

/**
 * Create a grievance against another nation
 */
export function createGrievance(
  nation: Nation,
  againstNationId: string,
  type: GrievanceType,
  currentTurn: number,
  customDescription?: string,
  customSeverity?: GrievanceSeverity
): Nation {
  if (nation.id === againstNationId) return nation;

  const definition = GrievanceDefinitions[type];
  const severity = customSeverity ?? definition.defaultSeverity;

  const grievance: Grievance = {
    id: `${nation.id}-${againstNationId}-${type}-${currentTurn}`,
    type,
    severity,
    againstNationId,
    description: customDescription ?? definition.description,
    createdTurn: currentTurn,
    expiresIn: definition.defaultExpiry,
    relationshipPenalty: definition.relationshipPenalty,
    trustPenalty: definition.trustPenalty,
    resolved: false,
  };

  const grievances = nation.grievances ?? [];

  // Apply trust penalty immediately
  const nationWithTrust = modifyTrust(
    nation,
    againstNationId,
    definition.trustPenalty,
    `Grievance: ${definition.description}`,
    currentTurn
  );

  return {
    ...nationWithTrust,
    grievances: [...grievances, grievance],
  };
}

/**
 * Resolve a grievance (through reparations, diplomacy, etc.)
 */
export function resolveGrievance(
  nation: Nation,
  grievanceId: string,
  currentTurn: number
): Nation {
  if (!nation.grievances) return nation;

  const grievanceIndex = nation.grievances.findIndex((g) => g.id === grievanceId);
  if (grievanceIndex === -1) return nation;

  const grievance = nation.grievances[grievanceIndex];
  if (grievance.resolved) return nation;

  const updatedGrievances = [...nation.grievances];
  updatedGrievances[grievanceIndex] = { ...grievance, resolved: true };

  // Restore some trust when grievance is resolved (50% of penalty)
  const trustRestoration = Math.abs(grievance.trustPenalty) * 0.5;
  const nationWithTrust = modifyTrust(
    nation,
    grievance.againstNationId,
    trustRestoration,
    `Resolved grievance: ${grievance.description}`,
    currentTurn
  );

  return {
    ...nationWithTrust,
    grievances: updatedGrievances,
  };
}

/**
 * Decay grievances over time
 */
export function decayGrievances(nation: Nation, currentTurn: number): Nation {
  if (!nation.grievances) return nation;

  const updatedGrievances = nation.grievances
    .map((g) => {
      if (g.resolved || g.expiresIn === 0) return g;

      // Reduce expiry time
      const newExpiresIn = Math.max(0, g.expiresIn - 1);

      // If expiring now, mark as resolved
      if (newExpiresIn === 0) {
        return { ...g, expiresIn: 0, resolved: true };
      }

      return { ...g, expiresIn: newExpiresIn };
    })
    .filter((g) => !g.resolved || currentTurn - g.createdTurn < 100); // Keep resolved for 100 turns for history

  return {
    ...nation,
    grievances: updatedGrievances,
  };
}

/**
 * Get active (unresolved) grievances against a specific nation
 */
export function getActiveGrievances(nation: Nation, againstNationId: string): Grievance[] {
  if (!nation.grievances) return [];

  return nation.grievances.filter(
    (g) => g.againstNationId === againstNationId && !g.resolved
  );
}

/**
 * Check if a nation has any active grievances against another
 */
export function hasActiveGrievances(nation: Nation, againstNationId: string): boolean {
  return getActiveGrievances(nation, againstNationId).length > 0;
}

// ============================================================================
// CLAIM MANAGEMENT
// ============================================================================

/**
 * Create a claim on another nation
 */
export function createClaim(
  nation: Nation,
  onNationId: string,
  type: ClaimType,
  strength: ClaimStrength,
  currentTurn: number,
  customDescription?: string
): Nation {
  if (nation.id === onNationId) return nation;

  const definition = ClaimDefinitions[type];
  const strengthMod = ClaimStrengthModifiers[strength];

  const claim: Claim = {
    id: `${nation.id}-${onNationId}-${type}-${currentTurn}`,
    type,
    strength,
    onNationId,
    description: customDescription ?? definition.description,
    createdTurn: currentTurn,
    warJustification: Math.floor(definition.baseWarJustification * strengthMod),
    publicSupport: Math.floor(definition.basePublicSupport * strengthMod),
    renounced: false,
  };

  const claims = nation.claims ?? [];

  return {
    ...nation,
    claims: [...claims, claim],
  };
}

/**
 * Renounce a claim
 */
export function renounceClaim(
  nation: Nation,
  claimId: string,
  currentTurn: number
): Nation {
  if (!nation.claims) return nation;

  const claimIndex = nation.claims.findIndex((c) => c.id === claimId);
  if (claimIndex === -1) return nation;

  const claim = nation.claims[claimIndex];
  if (claim.renounced) return nation;

  const updatedClaims = [...nation.claims];
  updatedClaims[claimIndex] = { ...claim, renounced: true };

  // Improve relationship when claim is renounced
  const nationWithTrust = modifyTrust(
    nation,
    claim.onNationId,
    5,
    `Renounced claim: ${claim.description}`,
    currentTurn
  );

  return {
    ...nationWithTrust,
    claims: updatedClaims,
  };
}

/**
 * Press a claim (convert to grievance if rejected, increase tensions)
 */
export function pressClaim(
  nation: Nation,
  claimId: string,
  currentTurn: number
): { nation: Nation; warJustification: number } {
  if (!nation.claims) return { nation, warJustification: 0 };

  const claim = nation.claims.find((c) => c.id === claimId);
  if (!claim || claim.renounced) return { nation, warJustification: 0 };

  // Pressing a claim gives war justification bonus
  const strengthMod = ClaimStrengthModifiers[claim.strength];
  const justification = claim.warJustification * strengthMod;

  return {
    nation,
    warJustification: justification,
  };
}

/**
 * Get active (non-renounced) claims on a specific nation
 */
export function getActiveClaims(nation: Nation, onNationId: string): Claim[] {
  if (!nation.claims) return [];

  return nation.claims.filter((c) => c.onNationId === onNationId && !c.renounced);
}

/**
 * Check if a nation has any active claims on another
 */
export function hasActiveClaims(nation: Nation, onNationId: string): boolean {
  return getActiveClaims(nation, onNationId).length > 0;
}

/**
 * Age claims (reduce public support over time if not pressed)
 */
export function ageClaims(nation: Nation, currentTurn: number): Nation {
  if (!nation.claims) return nation;

  const updatedClaims = nation.claims.map((claim) => {
    if (claim.renounced) return claim;

    const turnsSinceCreation = currentTurn - claim.createdTurn;

    // Every 10 turns, reduce public support by 5%
    if (turnsSinceCreation % 10 === 0 && turnsSinceCreation > 0) {
      const newPublicSupport = Math.max(20, claim.publicSupport - 5);
      return { ...claim, publicSupport: newPublicSupport };
    }

    return claim;
  });

  return {
    ...nation,
    claims: updatedClaims,
  };
}

// ============================================================================
// COMBINED UTILITIES
// ============================================================================

/**
 * Calculate total diplomatic penalty from grievances
 * Returns modifier for proposal acceptance (-50 to 0)
 */
export function getGrievanceDiplomacyPenalty(
  nation: Nation,
  targetNationId: string
): number {
  if (!nation.grievances) return 0;

  const activeGrievances = getActiveGrievances(nation, targetNationId);
  if (activeGrievances.length === 0) return 0;

  // Calculate penalty based on grievance severity
  const totalPenalty = activeGrievances.reduce((sum, grievance) => {
    switch (grievance.severity) {
      case 'minor':
        return sum - 5;
      case 'moderate':
        return sum - 10;
      case 'major':
        return sum - 20;
      case 'severe':
        return sum - 30;
      default:
        return sum;
    }
  }, 0);

  return Math.max(-50, totalPenalty);
}

/**
 * Calculate war justification bonus from claims
 * Returns bonus for declaring war (0 to 50)
 */
export function getClaimWarJustification(nation: Nation, targetNationId: string): number {
  if (!nation.claims) return 0;

  const activeClaims = getActiveClaims(nation, targetNationId);
  if (activeClaims.length === 0) return 0;

  const totalJustification = activeClaims.reduce((sum, claim) => {
    return sum + claim.warJustification;
  }, 0);

  return Math.min(50, totalJustification);
}

/**
 * Get public support for war based on claims
 */
export function getClaimPublicSupport(nation: Nation, targetNationId: string): number {
  if (!nation.claims) return 0;

  const activeClaims = getActiveClaims(nation, targetNationId);
  if (activeClaims.length === 0) return 0;

  // Average public support from all claims
  const avgSupport =
    activeClaims.reduce((sum, claim) => sum + claim.publicSupport, 0) /
    activeClaims.length;

  return Math.floor(avgSupport);
}

/**
 * Initialize grievances and claims for game start
 */
export function initializeGrievancesAndClaims(nations: Nation[]): Nation[] {
  return nations.map((nation) => ({
    ...nation,
    grievances: nation.grievances ?? [],
    claims: nation.claims ?? [],
  }));
}

/**
 * Apply turn-based updates to grievances and claims
 */
export function updateGrievancesAndClaimsPerTurn(
  nation: Nation,
  currentTurn: number
): Nation {
  let updated = decayGrievances(nation, currentTurn);
  updated = ageClaims(updated, currentTurn);
  return updated;
}
