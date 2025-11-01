/**
 * Grievances and Claims System - Phase 2 Diplomacy Enhancement
 *
 * Grievances: Historical wrongs and complaints that affect diplomacy
 * Claims: Territorial or resource claims on other nations
 */

import type { Nation } from './game';

// ============================================================================
// GRIEVANCES
// ============================================================================

/**
 * Types of diplomatic grievances
 */
export type GrievanceType =
  | 'broken-promise'        // Broke a diplomatic promise
  | 'broken-treaty'         // Broke a treaty or alliance
  | 'surprise-attack'       // Attacked without warning
  | 'civilian-casualties'   // Caused massive civilian casualties (nukes, bioweapons)
  | 'territorial-seizure'   // Took territory by force
  | 'sanction-harm'        // Economic sanctions caused damage
  | 'refused-aid'          // Refused to provide aid when requested
  | 'betrayed-ally'        // Betrayed an ally in war
  | 'espionage-caught'     // Caught conducting espionage
  | 'war-crimes';          // Used banned weapons or tactics

/**
 * Severity of a grievance
 */
export type GrievanceSeverity = 'minor' | 'moderate' | 'major' | 'severe';

/**
 * A diplomatic grievance held by one nation against another
 */
export interface Grievance {
  id: string;
  type: GrievanceType;
  severity: GrievanceSeverity;
  againstNationId: string;   // Nation that wronged this nation
  description: string;        // Human-readable description
  createdTurn: number;        // When grievance was created
  expiresIn: number;          // Turns until grievance fades (0 = permanent)
  relationshipPenalty: number; // Ongoing relationship penalty
  trustPenalty: number;       // Ongoing trust penalty
  resolved: boolean;          // If resolved through diplomacy/reparations
}

/**
 * Grievance severity constants
 */
export const GrievanceSeverityWeights = {
  minor: 1,
  moderate: 2,
  major: 3,
  severe: 5,
} as const;

/**
 * Standard grievance definitions
 */
export const GrievanceDefinitions: Record<GrievanceType, {
  defaultSeverity: GrievanceSeverity;
  defaultExpiry: number;
  relationshipPenalty: number;
  trustPenalty: number;
  description: string;
}> = {
  'broken-promise': {
    defaultSeverity: 'major',
    defaultExpiry: 30,
    relationshipPenalty: -15,
    trustPenalty: -20,
    description: 'Broke a diplomatic promise',
  },
  'broken-treaty': {
    defaultSeverity: 'severe',
    defaultExpiry: 50,
    relationshipPenalty: -30,
    trustPenalty: -35,
    description: 'Violated a treaty or broke an alliance',
  },
  'surprise-attack': {
    defaultSeverity: 'severe',
    defaultExpiry: 40,
    relationshipPenalty: -35,
    trustPenalty: -40,
    description: 'Launched a surprise attack without warning',
  },
  'civilian-casualties': {
    defaultSeverity: 'severe',
    defaultExpiry: 60,
    relationshipPenalty: -40,
    trustPenalty: -30,
    description: 'Caused massive civilian casualties',
  },
  'territorial-seizure': {
    defaultSeverity: 'major',
    defaultExpiry: 50,
    relationshipPenalty: -25,
    trustPenalty: -15,
    description: 'Seized territory by military force',
  },
  'sanction-harm': {
    defaultSeverity: 'moderate',
    defaultExpiry: 25,
    relationshipPenalty: -10,
    trustPenalty: -5,
    description: 'Economic sanctions caused harm',
  },
  'refused-aid': {
    defaultSeverity: 'minor',
    defaultExpiry: 15,
    relationshipPenalty: -5,
    trustPenalty: -8,
    description: 'Refused to provide aid when requested',
  },
  'betrayed-ally': {
    defaultSeverity: 'severe',
    defaultExpiry: 60,
    relationshipPenalty: -45,
    trustPenalty: -50,
    description: 'Betrayed an ally in their time of need',
  },
  'espionage-caught': {
    defaultSeverity: 'moderate',
    defaultExpiry: 20,
    relationshipPenalty: -12,
    trustPenalty: -10,
    description: 'Caught conducting espionage operations',
  },
  'war-crimes': {
    defaultSeverity: 'severe',
    defaultExpiry: 80,
    relationshipPenalty: -50,
    trustPenalty: -45,
    description: 'Committed war crimes or used banned weapons',
  },
};

// ============================================================================
// CLAIMS
// ============================================================================

/**
 * Types of claims a nation can make
 */
export type ClaimType =
  | 'historical'     // Historical claim to territory
  | 'strategic'      // Strategic interest in a region
  | 'resource'       // Claim based on resource access
  | 'cultural'       // Cultural or ethnic claim
  | 'liberation'     // Claim to "liberate" oppressed peoples
  | 'reparations';   // Claim for war reparations

/**
 * Strength of a claim
 */
export type ClaimStrength = 'weak' | 'moderate' | 'strong' | 'absolute';

/**
 * A territorial or resource claim
 */
export interface Claim {
  id: string;
  type: ClaimType;
  strength: ClaimStrength;
  onNationId: string;         // Nation being claimed against
  description: string;         // Description of the claim
  createdTurn: number;         // When claim was established
  warJustification: number;    // Bonus to war justification (0-50)
  publicSupport: number;       // Domestic support for pressing claim (0-100)
  renounced: boolean;          // If claim has been renounced
}

/**
 * Claim strength modifiers
 */
export const ClaimStrengthModifiers = {
  weak: 1.0,
  moderate: 1.2,
  strong: 1.5,
  absolute: 2.0,
} as const;

/**
 * Standard claim definitions
 */
export const ClaimDefinitions: Record<ClaimType, {
  baseWarJustification: number;
  basePublicSupport: number;
  description: string;
}> = {
  'historical': {
    baseWarJustification: 15,
    basePublicSupport: 60,
    description: 'Historical territorial claim',
  },
  'strategic': {
    baseWarJustification: 10,
    basePublicSupport: 40,
    description: 'Strategic regional interest',
  },
  'resource': {
    baseWarJustification: 12,
    basePublicSupport: 50,
    description: 'Resource access claim',
  },
  'cultural': {
    baseWarJustification: 18,
    basePublicSupport: 70,
    description: 'Cultural or ethnic claim',
  },
  'liberation': {
    baseWarJustification: 20,
    basePublicSupport: 65,
    description: 'Liberation of oppressed peoples',
  },
  'reparations': {
    baseWarJustification: 8,
    basePublicSupport: 55,
    description: 'War reparations claim',
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get total grievance weight against a nation
 */
export function getTotalGrievanceWeight(nation: Nation, targetNationId: string): number {
  if (!nation.grievances) return 0;

  const grievances = nation.grievances.filter(
    (g) => g.againstNationId === targetNationId && !g.resolved
  );

  return grievances.reduce((total, g) => {
    return total + GrievanceSeverityWeights[g.severity];
  }, 0);
}

/**
 * Get total relationship penalty from grievances
 */
export function getGrievanceRelationshipPenalty(
  nation: Nation,
  targetNationId: string
): number {
  if (!nation.grievances) return 0;

  const grievances = nation.grievances.filter(
    (g) => g.againstNationId === targetNationId && !g.resolved
  );

  return grievances.reduce((total, g) => total + g.relationshipPenalty, 0);
}

/**
 * Get total trust penalty from grievances
 */
export function getGrievanceTrustPenalty(nation: Nation, targetNationId: string): number {
  if (!nation.grievances) return 0;

  const grievances = nation.grievances.filter(
    (g) => g.againstNationId === targetNationId && !g.resolved
  );

  return grievances.reduce((total, g) => total + g.trustPenalty, 0);
}

/**
 * Check if a nation has any severe grievances against another
 */
export function hasSevereGrievances(nation: Nation, targetNationId: string): boolean {
  if (!nation.grievances) return false;

  return nation.grievances.some(
    (g) => g.againstNationId === targetNationId && g.severity === 'severe' && !g.resolved
  );
}

/**
 * Get total war justification from claims
 */
export function getTotalClaimJustification(nation: Nation, targetNationId: string): number {
  if (!nation.claims) return 0;

  const claims = nation.claims.filter(
    (c) => c.onNationId === targetNationId && !c.renounced
  );

  return claims.reduce((total, c) => {
    const strengthMod = ClaimStrengthModifiers[c.strength];
    return total + (c.warJustification * strengthMod);
  }, 0);
}

/**
 * Check if nation has claims on target
 */
export function hasClaims(nation: Nation, targetNationId: string): boolean {
  if (!nation.claims) return false;
  return nation.claims.some((c) => c.onNationId === targetNationId && !c.renounced);
}

/**
 * Get grievance severity color for UI
 */
export function getGrievanceSeverityColor(severity: GrievanceSeverity): string {
  switch (severity) {
    case 'minor':
      return 'text-yellow-400';
    case 'moderate':
      return 'text-orange-400';
    case 'major':
      return 'text-red-400';
    case 'severe':
      return 'text-red-600';
    default:
      return 'text-gray-400';
  }
}

/**
 * Get claim strength color for UI
 */
export function getClaimStrengthColor(strength: ClaimStrength): string {
  switch (strength) {
    case 'weak':
      return 'text-gray-400';
    case 'moderate':
      return 'text-yellow-400';
    case 'strong':
      return 'text-orange-400';
    case 'absolute':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
}
