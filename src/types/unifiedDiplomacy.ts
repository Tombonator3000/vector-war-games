/**
 * UNIFIED DIPLOMACY SYSTEM
 *
 * Consolidates Phase 1 (Trust/Favors), Phase 2 (Grievances/Alliances),
 * and Phase 3 (DIP/Council) into ONE simple system.
 *
 * Core Concept: Single "Relationship" metric (-100 to +100) per nation pair
 */

export const MIN_RELATIONSHIP = -100;
export const MAX_RELATIONSHIP = 100;
export const NEUTRAL_RELATIONSHIP = 0;

// Relationship thresholds
export const RELATIONSHIP_HOSTILE = -60;      // Likely to attack
export const RELATIONSHIP_UNFRIENDLY = -30;   // Won't cooperate
export const RELATIONSHIP_NEUTRAL = 0;        // Starting point
export const RELATIONSHIP_FRIENDLY = 30;      // Open to deals
export const RELATIONSHIP_ALLIED = 60;        // Can form alliance

/**
 * Simplified treaty types (down from 8+ types)
 */
export type TreatyType = 'truce' | 'alliance';

/**
 * Treaty between two nations
 */
export interface UnifiedTreaty {
  type: TreatyType;
  withNationId: string;
  establishedTurn: number;
  expiresAt?: number;  // undefined = permanent (alliances), number = turns (truces)
}

/**
 * Relationship modifier event
 */
export interface RelationshipModifier {
  turn: number;
  reason: string;
  delta: number;
  newValue: number;
}

/**
 * Consolidated relationship constants
 */
export const RelationshipDeltas = {
  // Positive actions
  FORM_ALLIANCE: 40,
  HONOR_TREATY: 5,
  SEND_AID: 10,
  SUPPORT_IN_WAR: 15,

  // Negative actions
  BREAK_TREATY: -35,
  NUCLEAR_ATTACK: -50,
  BIO_ATTACK: -45,
  TERRITORIAL_ATTACK: -25,
  ESPIONAGE_CAUGHT: -15,

  // Decay
  DECAY_TOWARD_NEUTRAL: 0.5,  // Slowly drift toward 0
} as const;

/**
 * Get relationship category
 */
export function getRelationshipCategory(relationship: number): string {
  if (relationship >= RELATIONSHIP_ALLIED) return 'Allied';
  if (relationship >= RELATIONSHIP_FRIENDLY) return 'Friendly';
  if (relationship >= RELATIONSHIP_UNFRIENDLY) return 'Neutral';
  if (relationship >= RELATIONSHIP_HOSTILE) return 'Unfriendly';
  return 'Hostile';
}

/**
 * Get relationship color for UI
 */
export function getRelationshipColor(relationship: number): string {
  if (relationship >= RELATIONSHIP_ALLIED) return 'text-green-500';
  if (relationship >= RELATIONSHIP_FRIENDLY) return 'text-green-400';
  if (relationship >= RELATIONSHIP_UNFRIENDLY) return 'text-gray-400';
  if (relationship >= RELATIONSHIP_HOSTILE) return 'text-orange-400';
  return 'text-red-500';
}

/**
 * Check if relationship allows alliance
 */
export function canFormAlliance(relationship: number): boolean {
  return relationship >= RELATIONSHIP_ALLIED;
}

/**
 * Check if relationship prevents attack (truce)
 */
export function hasTruceLevel(relationship: number): boolean {
  return relationship >= RELATIONSHIP_FRIENDLY;
}

/**
 * Clamp relationship to valid range
 */
export function clampRelationship(value: number): number {
  return Math.max(MIN_RELATIONSHIP, Math.min(MAX_RELATIONSHIP, value));
}

/**
 * Calculate relationship decay (toward neutral)
 */
export function calculateRelationshipDecay(current: number): number {
  if (current > NEUTRAL_RELATIONSHIP) {
    return -RelationshipDeltas.DECAY_TOWARD_NEUTRAL;
  } else if (current < NEUTRAL_RELATIONSHIP) {
    return RelationshipDeltas.DECAY_TOWARD_NEUTRAL;
  }
  return 0;
}

/**
 * Get acceptance modifier for diplomatic proposals
 * Returns multiplier (0.0 = impossible, 1.0 = normal, 2.0 = very likely)
 */
export function getAcceptanceModifier(relationship: number): number {
  // Linear scaling: -100 = 0.0x, 0 = 1.0x, +100 = 2.0x
  return 1.0 + (relationship / 100);
}

/**
 * Proposal types (simplified from original 8 types)
 */
export type ProposalType =
  | 'alliance'          // Form permanent alliance
  | 'truce'             // Temporary peace (10 turns)
  | 'aid'               // Economic assistance
  | 'joint-war'         // Declare war together
  | 'peace';            // End conflict

export interface DiplomaticProposal {
  id: string;
  type: ProposalType;
  proposerId: string;
  targetId: string;
  message: string;
  turn: number;
  playerInitiated: boolean;
  terms?: {
    duration?: number;        // For truces
    targetNationId?: string;  // For joint wars
    resourceAmount?: number;  // For aid
  };
}

export interface DiplomaticResponse {
  proposalId: string;
  accepted: boolean;
  reason: string;
}
