/**
 * Doctrine Diplomacy Integration Types
 *
 * Defines how military doctrines affect diplomatic relationships,
 * proposal acceptance, and unlock special diplomatic options.
 */

import type { DoctrineKey } from './doctrineIncidents';

/**
 * Doctrine Compatibility Matrix
 * How different doctrine combinations affect relationships
 */
export const DOCTRINE_COMPATIBILITY: Record<DoctrineKey, Record<DoctrineKey, number>> = {
  mad: {
    mad: 10,        // Both understand mutual deterrence
    defense: 0,     // Neutral - both defensive-minded
    firstStrike: -10, // Paranoid about each other
    detente: -15,   // Conflicting worldviews
  },
  defense: {
    mad: 0,
    defense: 5,     // Both cautious and defensive
    firstStrike: -5,  // Worried about preemption
    detente: 10,    // Both prefer stability
  },
  firstStrike: {
    mad: -10,
    defense: -5,
    firstStrike: -20, // Both paranoid and aggressive
    detente: -25,   // Maximum incompatibility
  },
  detente: {
    mad: -15,
    defense: 10,
    firstStrike: -25,
    detente: 20,    // Both peaceful and cooperative
  },
};

/**
 * Doctrine-specific diplomatic proposals
 * Each doctrine unlocks unique proposal types
 */
export type DoctrineProposalType =
  | 'mutual-deterrence-pact'    // MAD only
  | 'no-first-use-treaty'       // MAD & Defense
  | 'abm-technology-share'      // Defense only
  | 'joint-early-warning'       // Defense only
  | 'preemptive-alliance'       // First Strike only
  | 'target-coordination'       // First Strike only
  | 'nuclear-arms-reduction'    // Détente only
  | 'hotline-agreement'         // Détente only
  | 'enhanced-non-aggression';  // Détente only

export interface DoctrineProposalConfig {
  id: DoctrineProposalType;
  name: string;
  description: string;
  requiredDoctrine: DoctrineKey | DoctrineKey[];
  targetDoctrinePreference?: DoctrineKey[]; // works best with these doctrines

  effects: {
    // Relationship bonus
    relationshipBonus: number;
    trustBonus?: number;

    // Military effects
    deterrenceBonus?: number;
    defenseBonus?: number;
    firstStrikeReduction?: number; // reduces chance of surprise attack

    // Economic effects
    productionBonus?: number;
    goldBonus?: number;

    // Special mechanics
    sharedIntel?: boolean; // both parties share intelligence
    mutualDefense?: boolean; // auto-join if attacked
    disarmamentRequired?: boolean; // requires reducing arsenals
  };

  // Costs to propose
  costs: {
    intelCost: number;
    goldCost?: number;
    productionCost?: number;
  };

  // Requirements to propose
  requirements?: {
    minRelationship?: number;
    minTrust?: number;
    minTurn?: number;
    notAtWar?: boolean;
    hasResearch?: string[];
  };

  // How long does this agreement last?
  duration: number | 'permanent';

  // Base acceptance modifier (before doctrine compatibility)
  baseAcceptanceModifier: number;
}

/**
 * Doctrine effects on standard diplomacy proposals
 */
export interface DoctrineProposalModifier {
  proposalType: string; // e.g., 'alliance', 'truce', 'aid-request'
  doctrinePair: [DoctrineKey, DoctrineKey]; // [proposer, target]
  acceptanceModifier: number;
  reason: string; // explanation for UI
}

/**
 * Active doctrine-based agreements between nations
 */
export interface DoctrineAgreement {
  id: string;
  type: DoctrineProposalType;
  participants: string[]; // nation ids
  signedTurn: number;
  expiryTurn: number | null; // null if permanent
  active: boolean;

  // Track compliance
  violations: {
    nationId: string;
    turn: number;
    violationType: string;
    penaltyApplied: boolean;
  }[];
}

/**
 * Doctrine reputation system
 * Track how each nation's doctrine is perceived globally
 */
export interface DoctrineReputation {
  nationId: string;
  doctrine: DoctrineKey;

  // Reputation scores (0-100)
  credibility: number; // Do they stick to their doctrine?
  predictability: number; // Are their actions consistent?
  trustworthiness: number; // Do they honor agreements?

  // Historical tracking
  doctrineChanges: number; // How many times changed doctrine
  agreementsHonored: number;
  agreementsBroken: number;

  // Perception modifiers
  perceivedAggression: number; // 0-100, affects diplomacy
  perceivedReliability: number; // 0-100, affects alliance formation
}
