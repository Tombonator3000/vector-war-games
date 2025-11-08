/**
 * UNIFIED DIPLOMACY SYSTEM
 *
 * Consolidates Phase 1 (Trust/Favors), Phase 2 (Grievances/Alliances),
 * and Phase 3 (DIP/Council) into ONE simple system.
 *
 * Core Concept: Single "Relationship" metric (-100 to +100) per nation pair
 */

export {
  MIN_RELATIONSHIP,
  MAX_RELATIONSHIP,
  NEUTRAL_RELATIONSHIP,
  RELATIONSHIP_HOSTILE,
  RELATIONSHIP_UNFRIENDLY,
  RELATIONSHIP_NEUTRAL,
  RELATIONSHIP_FRIENDLY,
  RELATIONSHIP_ALLIED,
  RelationshipDeltas,
  getRelationshipCategory,
  getRelationshipColor,
  canFormAlliance,
  hasTruceLevel,
  clampRelationship,
  calculateRelationshipDecay,
  getAcceptanceModifier,
} from '@/lib/relationshipUtils';

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
