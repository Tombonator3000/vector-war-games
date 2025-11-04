// @ts-nocheck - Temporary during unified diplomacy migration
/**
 * Multi-Party Diplomacy Types - FASE 3.4
 *
 * Enables diplomatic agreements involving 3+ nations:
 * - Multi-lateral alliances
 * - Joint war declarations
 * - Council meetings with voting
 * - Coalition agreements
 */

import type { Nation, GameState } from './game';
import type { NegotiableItem } from './negotiation';

/**
 * Multi-party diplomatic agreement
 */
export interface MultiPartyAgreement {
  id: string;
  type: MultiPartyAgreementType;
  title: string;
  description: string;
  participantIds: string[];           // All participating nations
  initiatorId: string;                // Nation that proposed it
  status: AgreementStatus;
  votes: Record<string, AgreementVote>; // Nation ID -> Vote
  createdTurn: number;
  votingDeadline: number;             // Turn when voting ends
  requiredVotes: number;              // Minimum yes votes needed
  terms: MultiPartyTerms;             // Agreement terms
  metadata?: Record<string, any>;
}

/**
 * Types of multi-party agreements
 */
export type MultiPartyAgreementType =
  | 'multi-lateral-alliance'    // Alliance of 3+ nations
  | 'joint-war-declaration'     // Multiple nations declare war together
  | 'coalition-pact'            // Coalition against common threat
  | 'non-aggression-bloc'       // Mutual non-aggression pact
  | 'trade-agreement'           // Multi-nation trade deal
  | 'council-resolution'        // International council vote
  | 'peace-treaty'              // Multi-nation peace agreement
  | 'joint-embargo';            // Coordinated sanctions

/**
 * Status of multi-party agreement
 */
export type AgreementStatus =
  | 'proposed'      // Proposed, awaiting votes
  | 'voting'        // Currently voting
  | 'passed'        // Passed and active
  | 'failed'        // Failed to pass
  | 'expired'       // Expired without enough votes
  | 'broken'        // Agreement was broken
  | 'completed';    // Agreement fulfilled/ended

/**
 * Vote on an agreement
 */
export interface AgreementVote {
  nationId: string;
  vote: 'yes' | 'no' | 'abstain' | 'pending';
  votedTurn: number;
  reason?: string;
}

/**
 * Terms of a multi-party agreement
 */
export interface MultiPartyTerms {
  duration?: number;                  // Agreement duration in turns
  targetNationIds?: string[];         // Target nations (for war/embargo)
  obligations: NationObligation[];    // What each nation must do
  benefits: NationBenefit[];          // What each nation gains
  penalties: BreachPenalty[];         // Penalties for breaking agreement
  conditions?: AgreementCondition[];  // Conditions for agreement
}

/**
 * Obligation for a participant
 */
export interface NationObligation {
  nationId: string;                   // Nation with obligation
  type: ObligationType;
  value?: number;
  description: string;
  turnFrequency?: number;             // How often (every N turns)
}

/**
 * Types of obligations
 */
export type ObligationType =
  | 'military-support'      // Provide military assistance
  | 'resource-tribute'      // Pay resources
  | 'no-aggression'         // Cannot attack members
  | 'defend-member'         // Must defend if attacked
  | 'vote-alignment'        // Must vote same way
  | 'share-intel'           // Share intelligence
  | 'embargo-target';       // Embargo specific nation

/**
 * Benefit for a participant
 */
export interface NationBenefit {
  nationId: string;                   // Nation receiving benefit
  type: BenefitType;
  value?: number;
  description: string;
  turnFrequency?: number;             // How often received
}

/**
 * Types of benefits
 */
export type BenefitType =
  | 'military-protection'   // Protected by alliance
  | 'resource-sharing'      // Receive resources
  | 'trade-bonus'           // Trade advantages
  | 'research-sharing'      // Access to tech
  | 'diplomatic-support'    // Relationship bonuses
  | 'veto-power';           // Can veto certain actions

/**
 * Penalty for breaking agreement
 */
export interface BreachPenalty {
  type: PenaltyType;
  value: number;
  description: string;
  applyToAll: boolean;                // All members penalize breaker?
}

/**
 * Types of breach penalties
 */
export type PenaltyType =
  | 'relationship-drop'     // Lose relationship
  | 'economic-sanctions'    // Economic penalties
  | 'military-action'       // Coordinated attack
  | 'expulsion'             // Kicked from agreement
  | 'reputation-damage';    // Global reputation hit

/**
 * Condition for agreement activation/continuation
 */
export interface AgreementCondition {
  type: ConditionType;
  value: number;
  description: string;
  checkTurn?: number;                 // When to check condition
}

/**
 * Types of agreement conditions
 */
export type ConditionType =
  | 'min-members'           // Minimum active members
  | 'threat-level'          // Threat must be above threshold
  | 'war-ongoing'           // War must be active
  | 'peace-maintained'      // Peace must be kept
  | 'resource-threshold';   // Resource requirements

/**
 * Council meeting for major decisions
 */
export interface CouncilMeeting {
  id: string;
  title: string;
  description: string;
  type: CouncilMeetingType;
  hostId: string;                     // Nation hosting meeting
  attendeeIds: string[];              // Invited nations
  proposedResolution: MultiPartyAgreement;
  agenda: CouncilAgendaItem[];
  scheduledTurn: number;
  status: 'scheduled' | 'in-session' | 'completed' | 'cancelled';
  outcomes?: CouncilOutcome[];
}

/**
 * Types of council meetings
 */
export type CouncilMeetingType =
  | 'emergency-session'     // Emergency meeting
  | 'regular-summit'        // Regular diplomatic summit
  | 'peace-conference'      // Peace negotiations
  | 'war-council'           // Planning military action
  | 'economic-summit';      // Economic cooperation

/**
 * Agenda item for council meeting
 */
export interface CouncilAgendaItem {
  id: string;
  title: string;
  description: string;
  proposerId: string;
  type: 'discussion' | 'vote' | 'announcement';
  resolution?: MultiPartyAgreement;
}

/**
 * Outcome of council meeting
 */
export interface CouncilOutcome {
  agendaItemId: string;
  result: 'passed' | 'failed' | 'deferred';
  votes: Record<string, AgreementVote>;
  effect: string;
}

/**
 * Coalition - temporary alliance for specific purpose
 */
export interface Coalition {
  id: string;
  name: string;
  purpose: string;
  leaderId: string;                   // Lead nation
  memberIds: string[];                // All members
  targetIds: string[];                // Target nations (if any)
  type: CoalitionType;
  strength: number;                   // Combined military strength
  createdTurn: number;
  expiresAtTurn?: number;
  active: boolean;
}

/**
 * Types of coalitions
 */
export type CoalitionType =
  | 'military'              // Military coalition
  | 'economic'              // Economic partnership
  | 'defensive'             // Defensive pact
  | 'offensive'             // Offensive alliance
  | 'diplomatic';           // Diplomatic bloc

/**
 * Create a multi-party agreement proposal
 */
export function createMultiPartyAgreement(
  type: MultiPartyAgreementType,
  initiatorId: string,
  participantIds: string[],
  terms: MultiPartyTerms,
  currentTurn: number
): MultiPartyAgreement {
  return {
    id: `mp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    title: getAgreementTitle(type),
    description: getAgreementDescription(type),
    participantIds,
    initiatorId,
    status: 'proposed',
    votes: {},
    createdTurn: currentTurn,
    votingDeadline: currentTurn + 3, // 3 turns to vote
    requiredVotes: Math.ceil(participantIds.length * 0.6), // 60% majority
    terms,
  };
}

/**
 * Cast a vote on an agreement
 */
export function castVote(
  agreement: MultiPartyAgreement,
  nationId: string,
  vote: 'yes' | 'no' | 'abstain',
  currentTurn: number,
  reason?: string
): MultiPartyAgreement {
  return {
    ...agreement,
    votes: {
      ...agreement.votes,
      [nationId]: {
        nationId,
        vote,
        votedTurn: currentTurn,
        reason,
      },
    },
    status: 'voting',
  };
}

/**
 * Check if agreement has passed
 */
export function checkAgreementStatus(
  agreement: MultiPartyAgreement,
  currentTurn: number
): MultiPartyAgreement {
  // Check if voting deadline passed
  if (currentTurn >= agreement.votingDeadline) {
    const yesVotes = Object.values(agreement.votes).filter(v => v.vote === 'yes').length;

    if (yesVotes >= agreement.requiredVotes) {
      return { ...agreement, status: 'passed' };
    } else {
      return { ...agreement, status: 'failed' };
    }
  }

  return agreement;
}

/**
 * Get title for agreement type
 */
function getAgreementTitle(type: MultiPartyAgreementType): string {
  switch (type) {
    case 'multi-lateral-alliance':
      return 'Multi-Lateral Alliance';
    case 'joint-war-declaration':
      return 'Joint Declaration of War';
    case 'coalition-pact':
      return 'Coalition Pact';
    case 'non-aggression-bloc':
      return 'Non-Aggression Bloc';
    case 'trade-agreement':
      return 'Multi-Nation Trade Agreement';
    case 'council-resolution':
      return 'Council Resolution';
    case 'peace-treaty':
      return 'Multi-Party Peace Treaty';
    case 'joint-embargo':
      return 'Joint Embargo Agreement';
    default:
      return 'Multi-Party Agreement';
  }
}

/**
 * Get description for agreement type
 */
function getAgreementDescription(type: MultiPartyAgreementType): string {
  switch (type) {
    case 'multi-lateral-alliance':
      return 'A formal alliance between multiple nations with mutual defense obligations.';
    case 'joint-war-declaration':
      return 'A coordinated declaration of war against a common enemy.';
    case 'coalition-pact':
      return 'A temporary coalition formed to address a specific threat.';
    case 'non-aggression-bloc':
      return 'An agreement where all parties pledge not to attack each other.';
    case 'trade-agreement':
      return 'A trade agreement providing economic benefits to all participants.';
    case 'council-resolution':
      return 'A resolution voted on by the international council.';
    case 'peace-treaty':
      return 'A peace agreement between multiple warring parties.';
    case 'joint-embargo':
      return 'Coordinated economic sanctions against a target nation.';
    default:
      return 'A diplomatic agreement between multiple parties.';
  }
}

/**
 * Calculate AI likelihood to vote yes on agreement
 */
export function calculateAIVoteProbability(
  agreement: MultiPartyAgreement,
  aiNation: Nation,
  gameState: GameState
): number {
  let probability = 0.5; // Base 50%

  const initiator = gameState.nations.find(n => n.id === agreement.initiatorId);
  if (!initiator) return 0;

  // Relationship with initiator matters
  const relationship = aiNation.relationship?.[initiator.id] || 0;
  probability += relationship / 200; // -0.5 to +0.5

  // Agreement type preferences
  switch (agreement.type) {
    case 'multi-lateral-alliance':
      // Defensive nations more likely
      if (aiNation.aiPersonality === 'defensive' || aiNation.aiPersonality === 'cautious') {
        probability += 0.2;
      }
      break;

    case 'joint-war-declaration':
      // Aggressive nations more likely
      if (aiNation.aiPersonality === 'aggressive' || aiNation.aiPersonality === 'warmonger') {
        probability += 0.3;
      }
      // Check if AI has grievances with target
      if (agreement.terms.targetNationIds) {
        for (const targetId of agreement.terms.targetNationIds) {
          const targetRelationship = aiNation.relationship?.[targetId] || 0;
          if (targetRelationship < -30) {
            probability += 0.2;
          }
        }
      }
      break;

    case 'non-aggression-bloc':
      // Almost always good for peace-loving nations
      if (aiNation.aiPersonality === 'peaceful' || aiNation.aiPersonality === 'diplomat') {
        probability += 0.3;
      }
      break;

    case 'trade-agreement':
      // Economic nations love this
      if (aiNation.aiPersonality === 'economic') {
        probability += 0.3;
      }
      // Low on resources = more likely
      if (aiNation.production < 50) {
        probability += 0.2;
      }
      break;

    case 'joint-embargo':
      // Only if really dislike target
      if (agreement.terms.targetNationIds) {
        let avgRelationship = 0;
        for (const targetId of agreement.terms.targetNationIds) {
          avgRelationship += aiNation.relationship?.[targetId] || 0;
        }
        avgRelationship /= agreement.terms.targetNationIds.length;
        if (avgRelationship < -40) {
          probability += 0.3;
        }
      }
      break;
  }

  // Check if benefits outweigh obligations
  const aiObligations = agreement.terms.obligations.filter(o => o.nationId === aiNation.id);
  const aiBenefits = agreement.terms.benefits.filter(b => b.nationId === aiNation.id);

  if (aiBenefits.length > aiObligations.length) {
    probability += 0.15;
  } else if (aiObligations.length > aiBenefits.length + 1) {
    probability -= 0.15;
  }

  // Clamp to 0-1
  return Math.max(0, Math.min(1, probability));
}

/**
 * Initialize multi-party diplomacy state in game
 */
export interface MultiPartyDiplomacyState {
  agreements: MultiPartyAgreement[];
  councils: CouncilMeeting[];
  coalitions: Coalition[];
  pendingProposals: MultiPartyAgreement[];
}

export function initializeMultiPartyDiplomacyState(): MultiPartyDiplomacyState {
  return {
    agreements: [],
    councils: [],
    coalitions: [],
    pendingProposals: [],
  };
}
