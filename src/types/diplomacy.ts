/**
 * Diplomacy Proposal System
 * Implements Civilization-style diplomacy where AI can propose deals
 * and both AI and player can accept/reject proposals
 */

export type ProposalType =
  | 'alliance'           // Permanent alliance (costs resources)
  | 'truce'             // Temporary peace treaty
  | 'non-aggression'    // Non-aggression pact
  | 'aid-request'       // Request for economic assistance
  | 'sanction-lift'     // Request to lift sanctions
  | 'joint-war'         // Propose war against common enemy
  | 'demand-surrender'  // Demand target surrender/tribute
  | 'peace-offer';      // Offer peace terms

export interface ProposalTerms {
  duration?: number;              // For truces (in turns)
  goldAmount?: number;            // Gold/production to exchange
  resourceAmount?: number;        // Resources to exchange
  targetNationId?: string;        // For joint war declarations
  tributeAmount?: number;         // For surrender demands
  reason?: string;                // Diplomatic message
}

export interface DiplomacyProposal {
  id: string;                     // Unique proposal ID
  type: ProposalType;             // Type of proposal
  proposerId: string;             // Nation making the proposal
  targetId: string;               // Nation receiving the proposal
  terms: ProposalTerms;           // Terms of the proposal
  message: string;                // Diplomatic message explaining proposal
  turn: number;                   // Turn when proposal was made
  expiresAt?: number;             // Turn when proposal expires
  playerInitiated: boolean;       // True if player proposed, false if AI
}

export interface DiplomacyResponse {
  proposalId: string;
  accepted: boolean;
  reason: string;                 // Explanation for accept/reject
  counterOffer?: DiplomacyProposal; // Optional counter-proposal
}

export interface DiplomacyEvaluationFactors {
  threatLevel: number;            // -10 to +10 (negative = friendly)
  militaryRatio: number;          // Their power / our power
  relationshipScore: number;      // Overall relationship modifier
  personalityBias: number;        // AI personality influence
  strategicValue: number;         // How valuable is this deal?
  randomFactor: number;           // Add unpredictability
  recentHistory: number;          // Recent interactions modifier
}

export interface DiplomacyHistory {
  turn: number;
  action: string;
  withNation: string;
  result: 'accepted' | 'rejected' | 'expired';
  relationshipChange: number;
}

/**
 * Calculate acceptance score for AI evaluating a proposal
 * Returns score from -100 to +100
 * Positive scores likely to accept, negative likely to reject
 */
export function calculateAcceptanceScore(factors: DiplomacyEvaluationFactors): number {
  let score = 0;

  // Threat level: high threat = more likely to accept peace/truce
  // Low threat = less likely to want diplomacy
  score += factors.threatLevel * 5;

  // Military ratio: if we're stronger, less likely to accept unless beneficial
  // If we're weaker, more likely to accept defensive pacts
  if (factors.militaryRatio < 0.5) {
    score += 20; // We're much weaker, more desperate
  } else if (factors.militaryRatio < 0.8) {
    score += 10; // Somewhat weaker
  } else if (factors.militaryRatio > 1.5) {
    score -= 10; // We're much stronger, less need
  }

  // Relationship score directly influences acceptance
  score += factors.relationshipScore * 3;

  // Personality bias
  score += factors.personalityBias;

  // Strategic value of the deal
  score += factors.strategicValue;

  // Random factor for unpredictability (-10 to +10)
  score += factors.randomFactor;

  // Recent history
  score += factors.recentHistory;

  return Math.max(-100, Math.min(100, score));
}

/**
 * Determine acceptance threshold based on proposal type
 */
export function getAcceptanceThreshold(proposalType: ProposalType): number {
  switch (proposalType) {
    case 'alliance':
      return 30; // High bar for permanent alliance
    case 'truce':
      return 10; // Lower bar during conflict
    case 'non-aggression':
      return 20; // Moderate commitment
    case 'aid-request':
      return 15; // Depends on relationship
    case 'sanction-lift':
      return 25; // Requires good standing
    case 'joint-war':
      return 35; // Very high bar
    case 'demand-surrender':
      return 40; // Extremely high (usually rejected)
    case 'peace-offer':
      return 5;  // Low bar, most want peace
    default:
      return 20;
  }
}

/**
 * Generate diplomatic message based on proposal type and context
 */
export function generateDiplomaticMessage(
  proposal: DiplomacyProposal,
  proposerName: string,
  targetName: string,
  isAcceptance: boolean
): string {
  const messages = {
    alliance: {
      proposal: `${proposerName} proposes a permanent alliance with ${targetName}. Together, we can ensure mutual security and prosperity.`,
      accept: `${targetName} accepts the alliance! Our nations shall stand together.`,
      reject: `${targetName} declines the alliance. The time is not right for such commitments.`
    },
    truce: {
      proposal: `${proposerName} proposes a ${proposal.terms.duration}-turn truce with ${targetName}. Let us pause hostilities and seek peace.`,
      accept: `${targetName} agrees to the truce. Let this be a time of peace.`,
      reject: `${targetName} refuses the truce. The conflict continues.`
    },
    'non-aggression': {
      proposal: `${proposerName} proposes a non-aggression pact with ${targetName}. Let us agree not to attack each other.`,
      accept: `${targetName} accepts the non-aggression pact.`,
      reject: `${targetName} will not commit to non-aggression at this time.`
    },
    'aid-request': {
      proposal: `${proposerName} requests economic aid from ${targetName}. Our nation faces difficult times.`,
      accept: `${targetName} agrees to provide aid. Your assistance is appreciated.`,
      reject: `${targetName} cannot provide aid at this time.`
    },
    'sanction-lift': {
      proposal: `${proposerName} requests that ${targetName} lift economic sanctions. Let us restore normal relations.`,
      accept: `${targetName} agrees to lift sanctions.`,
      reject: `${targetName} maintains sanctions. The situation has not changed.`
    },
    'joint-war': {
      proposal: `${proposerName} proposes a joint military campaign with ${targetName} against a common foe.`,
      accept: `${targetName} joins the coalition! We shall fight together.`,
      reject: `${targetName} will not participate in this conflict.`
    },
    'demand-surrender': {
      proposal: `${proposerName} demands tribute from ${targetName}. Submit or face consequences.`,
      accept: `${targetName} reluctantly agrees to the tribute.`,
      reject: `${targetName} refuses your demands!`
    },
    'peace-offer': {
      proposal: `${proposerName} offers peace to ${targetName}. Let us end this conflict.`,
      accept: `${targetName} accepts the peace offer.`,
      reject: `${targetName} rejects peace. The war continues.`
    }
  };

  const typeMessages = messages[proposal.type];
  if (isAcceptance) {
    return typeMessages.accept;
  } else {
    return proposal.playerInitiated ? typeMessages.reject : typeMessages.proposal;
  }
}
