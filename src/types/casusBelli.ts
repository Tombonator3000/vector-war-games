/**
 * Casus Belli System
 *
 * Defines legitimate reasons for war and the formal war declaration mechanics.
 * Integrates with grievances, claims, council authorization, and diplomatic penalties.
 */

import type { ClaimType } from './grievancesAndClaims';

/**
 * Types of Casus Belli (reasons for war)
 */
export type CasusBelliType =
  | 'territorial-claim'     // Based on territorial/resource claims
  | 'liberation-war'        // Free allies from occupation
  | 'holy-war'              // Ideological/religious conflict
  | 'preemptive-strike'     // High threat level from target
  | 'defensive-pact'        // Ally was attacked
  | 'grievance-retribution' // Retaliation for severe grievances
  | 'regime-change'         // Overthrow hostile government
  | 'punitive-expedition'   // Punish treaty violations
  | 'council-authorized'    // Sanctioned by international council
  | 'leader-special';       // Special leader ability Casus Belli

/**
 * Validity of a Casus Belli
 */
export type CasusBelliValidity = 'valid' | 'weak' | 'invalid';

/**
 * A Casus Belli represents a legitimate reason to declare war
 */
export interface CasusBelli {
  id: string;
  type: CasusBelliType;
  againstNationId: string;
  justification: number;        // 0-100, how strong the CB is
  description: string;
  createdTurn: number;
  expiresAt?: number;           // Turn when CB expires (if temporary)
  claimIds?: string[];          // Associated territorial claims
  grievanceIds?: string[];      // Associated grievances
  councilResolutionId?: string; // Council resolution authorizing war
  leaderAbilityId?: string;     // Leader ability granting CB
  used: boolean;                // Whether CB has been used
  publicSupport: number;        // 0-100, public backing for war
}

/**
 * War goals define what the attacker wants to achieve
 */
export type WarGoalType =
  | 'annex-territory'       // Take specific territories
  | 'annex-all'             // Total conquest
  | 'liberate-territory'    // Free occupied territories
  | 'regime-change'         // Change government type
  | 'reparations'           // Demand resources/payment
  | 'disarmament'           // Force military reduction
  | 'vassal'                // Make target a subject
  | 'humiliate'             // Damage prestige/relationships
  | 'enforce-ideology'      // Force ideology/religion change
  | 'demilitarize-zone';    // Create buffer zones

/**
 * War goal with specific parameters
 */
export interface WarGoal {
  id: string;
  type: WarGoalType;
  targetNationId: string;
  parameters: WarGoalParameters;
  warScore: number;         // Score required to enforce (0-100)
  achieved: boolean;
  description: string;
}

/**
 * Parameters for different war goal types
 */
export interface WarGoalParameters {
  territoryIds?: string[];           // For territorial goals
  resourceAmount?: {                 // For reparations
    production?: number;
    intel?: number;
    research?: number;
  };
  militaryReduction?: number;        // % reduction for disarmament
  ideologyType?: string;             // For ideology enforcement
  demilitarizedTerritories?: string[]; // For DMZ
  duration?: number;                 // Duration in turns
}

/**
 * Active war state between two nations
 */
export interface WarState {
  id: string;
  attackerNationId: string;
  defenderNationId: string;
  casusBelliId: string;
  warGoals: WarGoal[];
  startTurn: number;
  attackerWarScore: number;   // 0-100
  defenderWarScore: number;   // 0-100
  allies: {
    attacker: string[];       // Allied nation IDs
    defender: string[];
  };
  status: 'active' | 'white-peace' | 'attacker-victory' | 'defender-victory';
  peaceOffered?: PeaceOffer;
  councilIntervention?: string; // Resolution ID if council intervened
}

/**
 * Peace offer terms
 */
export interface PeaceOffer {
  id: string;
  fromNationId: string;
  toNationId: string;
  warId: string;
  terms: PeaceTerms;
  createdTurn: number;
  expiresAt: number;
  message?: string;
}

/**
 * Peace terms define the end-of-war settlement
 */
export interface PeaceTerms {
  type: 'white-peace' | 'conditional-peace' | 'unconditional-surrender';
  territoryChanges?: TerritoryChange[];
  reparations?: ResourceReparations;
  militaryLimitations?: MilitaryLimitations;
  ideologyChange?: string;
  claimsRenounced?: string[];     // Claim IDs to renounce
  grievancesResolved?: string[];  // Grievance IDs to resolve
  treatyDuration?: number;        // Forced peace duration in turns
  additionalTerms?: string[];     // Custom terms descriptions
}

/**
 * Territory transfer as part of peace
 */
export interface TerritoryChange {
  territoryId: string;
  fromNationId: string;
  toNationId: string;
  temporary?: boolean;
  duration?: number;
}

/**
 * Resource payments as reparations
 */
export interface ResourceReparations {
  production?: number;
  intel?: number;
  research?: number;
  duration: number;          // Turns to pay
  perTurn: boolean;          // If true, paid per turn; otherwise lump sum
}

/**
 * Military restrictions imposed by peace
 */
export interface MilitaryLimitations {
  maxMilitarySize?: number;
  bannedWeaponTypes?: Array<'nuclear' | 'cyber' | 'bio' | 'conventional'>;
  demilitarizedZones?: string[];  // Territory IDs
  duration: number;                // Turns to enforce
}

/**
 * Validation result for attempting war
 */
export interface WarValidation {
  canDeclareWar: boolean;
  validity: CasusBelliValidity;
  justificationScore: number;  // 0-100
  diplomaticPenalty: number;   // Relationship penalty if war is unjustified
  trustPenalty: number;        // Trust penalty if war is unjustified
  publicSupportModifier: number; // Domestic public opinion
  reasons: string[];           // Human-readable reasons
  availableCasusBelli: CasusBelli[];
  blockers?: string[];         // Why war cannot be declared
}

/**
 * Justification factors for evaluating Casus Belli
 */
export interface JustificationFactors {
  claimJustification: number;      // 0-50 from territorial claims
  grievanceJustification: number;  // 0-50 from grievances
  threatLevel: number;             // 0-30 from threat assessment
  ideologicalConflict: number;     // 0-20 from ideology difference
  councilAuthorization: number;    // 0-40 from council resolution
  leaderAbility: number;           // 0-30 from leader special ability
  allyDefense: number;             // 0-40 if defending ally
  publicOpinion: number;           // -20 to +20 modifier
  totalJustification: number;      // Sum of all factors
}

/**
 * Thresholds for war justification
 */
export const WAR_JUSTIFICATION_THRESHOLDS = {
  VALID: 50,           // 50+ = valid Casus Belli
  WEAK: 30,            // 30-49 = weak CB (penalties)
  INVALID: 0,          // <30 = invalid (major penalties)
  COUNCIL_CONDEMN: 20, // <20 = council likely to condemn
} as const;

/**
 * Diplomatic penalties for unjustified wars
 */
export const UNJUSTIFIED_WAR_PENALTIES = {
  WEAK_CB: {
    relationshipPenalty: -15,
    trustPenalty: -10,
    councilLegitimacyHit: 5,
  },
  NO_CB: {
    relationshipPenalty: -40,
    trustPenalty: -30,
    councilLegitimacyHit: 15,
    grievanceType: 'surprise-attack' as const,
  },
} as const;

/**
 * War score modifiers for determining victory
 */
export const WAR_SCORE_EVENTS = {
  OCCUPY_TERRITORY: 10,
  MAJOR_BATTLE_WIN: 15,
  MINOR_BATTLE_WIN: 5,
  DESTROY_ARMY: 20,
  NUCLEAR_STRIKE: 30,
  BLOCKADE_SUCCESS: 8,
  CAPITAL_OCCUPATION: 40,
  ALLY_JOINS: 10,
  DEFENSIVE_VICTORY: 12,
} as const;

/**
 * Peace term enforcement scores
 */
export const PEACE_TERM_COSTS = {
  ANNEX_TERRITORY: 20,      // Per territory
  ANNEX_ALL: 100,           // Total conquest
  REGIME_CHANGE: 60,
  REPARATIONS_MINOR: 15,
  REPARATIONS_MAJOR: 35,
  DISARMAMENT: 45,
  VASSAL: 80,
  HUMILIATE: 25,
  ENFORCE_IDEOLOGY: 50,
  DEMILITARIZE_ZONE: 10,    // Per territory
} as const;
