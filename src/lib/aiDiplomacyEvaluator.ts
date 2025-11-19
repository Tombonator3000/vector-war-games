/**
 * AI Diplomacy Evaluator
 * Determines whether AI nations should accept or reject diplomatic proposals
 * Based on threat levels, military power, personality, and strategic considerations
 * ENHANCED: Now integrates advanced negotiation triggers for sophisticated AI diplomacy
 */

import { Nation } from '@/types/game';
import {
  DiplomacyProposal,
  DiplomacyResponse,
  DiplomacyEvaluationFactors,
  calculateAcceptanceScore,
  getAcceptanceThreshold,
  generateDiplomaticMessage
} from '@/types/diplomacy';
import { safeRatio } from '@/lib/safeMath';
import { getRelationship } from '@/lib/relationshipUtils';
import { getTrust, getFavors, getTrustModifier } from '@/types/trustAndFavors';
import { getPromiseTrustworthiness } from '@/lib/promiseActions';
import { getGrievanceDiplomacyPenalty, getClaimWarJustification } from '@/lib/grievancesAndClaimsUtils';
import { getAllianceBetween } from '@/types/specializedAlliances';
import { checkAllTriggers } from '@/lib/aiNegotiationTriggers';
import { getDoctrineCompatibilityModifier } from '@/lib/doctrineDiplomacyUtils';

/**
 * Evaluate whether AI should accept a player's diplomatic proposal
 */
export function evaluateProposal(
  proposal: DiplomacyProposal,
  aiNation: Nation,
  proposerNation: Nation,
  allNations: Nation[],
  rng?: { next: () => number }
): DiplomacyResponse {
  const factors = calculateEvaluationFactors(proposal, aiNation, proposerNation, allNations, rng);
  const score = calculateAcceptanceScore(factors);
  const threshold = getAcceptanceThreshold(proposal.type);

  const accepted = score >= threshold;
  const reason = generateResponseReason(proposal, accepted, factors, score, threshold);

  return {
    proposalId: proposal.id,
    accepted,
    reason
  };
}

/**
 * Calculate all factors that influence AI's decision
 */
function calculateEvaluationFactors(
  proposal: DiplomacyProposal,
  aiNation: Nation,
  proposerNation: Nation,
  allNations: Nation[],
  rng?: { next: () => number }
): DiplomacyEvaluationFactors {
  // Threat level from proposer (-10 friendly to +10 hostile)
  const threatLevel = (aiNation.threats?.[proposerNation.id] || 0) / 10;

  // Military power ratio (their strength / our strength)
  const proposerPower = calculateMilitaryPower(proposerNation);
  const aiPower = calculateMilitaryPower(aiNation);
  const militaryRatio = safeRatio(proposerPower, aiPower, 1);

  // Relationship score based on actual relationships and treaties
  const relationshipScore = calculateRelationshipScore(aiNation, proposerNation);

  // Personality bias based on AI type
  const personalityBias = getPersonalityBias(aiNation.aiPersonality || 'balanced', proposal.type);

  // Strategic value of this specific proposal
  const strategicValue = calculateStrategicValue(proposal, aiNation, proposerNation, allNations);

  // Random factor for unpredictability (-10 to +10)
  const randomValue = rng ? rng.next() : Math.random();
  const randomFactor = (randomValue * 20) - 10;

  // Recent history modifier (simplified for now)
  const recentHistory = 0;

  return {
    threatLevel,
    militaryRatio,
    relationshipScore,
    personalityBias,
    strategicValue,
    randomFactor,
    recentHistory
  };
}

/**
 * Calculate military power for a nation
 */
function calculateMilitaryPower(nation: Nation): number {
  const missileValue = nation.missiles * 10;
  const bomberValue = (nation.bombers || 0) * 8;
  const submarineValue = (nation.submarines || 0) * 12;
  const defenseValue = nation.defense * 5;
  const productionValue = nation.production * 2;

  return missileValue + bomberValue + submarineValue + defenseValue + productionValue;
}

/**
 * Calculate relationship score based on actual relationships and treaties
 * Primary component is the relationship value (-100 to +100), with treaty modifiers
 * Enhanced with Trust and Favors systems
 */
function calculateRelationshipScore(nation1: Nation, nation2: Nation): number {
  // Start with actual relationship value (-100 to +100), scaled to reasonable range
  const baseRelationship = getRelationship(nation1, nation2.id);
  let score = baseRelationship / 2; // Scale to -50 to +50

  // Check for existing alliance
  if (nation1.treaties?.[nation2.id]?.alliance) {
    score += 30;
  }

  // Check for active truce
  const truceTurns = nation1.treaties?.[nation2.id]?.truceTurns || 0;
  if (truceTurns > 0) {
    score += 15;
  }

  // Check if sanctioned
  if (nation1.sanctionedBy?.[nation2.id]) {
    score -= 20;
  }

  // *** PHASE 1 ENHANCEMENT: Trust modifier ***
  // Trust affects how reliable they seem (0-100 scale)
  const trust = getTrust(nation1, nation2.id);
  const trustBonus = (trust - 50) / 2; // -25 to +25 based on trust
  score += trustBonus;

  // *** PHASE 1 ENHANCEMENT: Favors modifier ***
  // Favors owed make proposals more likely to be accepted
  const favors = getFavors(nation1, nation2.id);
  const favorBonus = Math.min(20, favors / 2); // Max +20 bonus from favors
  score += favorBonus;

  // *** PHASE 1 ENHANCEMENT: Promise trustworthiness ***
  // Nations that keep promises are more trusted
  const promiseScore = getPromiseTrustworthiness(nation2);
  const promiseBonus = (promiseScore - 50) / 5; // -10 to +10 based on promise history
  score += promiseBonus;

  // *** PHASE 2 ENHANCEMENT: Grievances penalty ***
  // Active grievances reduce willingness to cooperate
  const grievancePenalty = getGrievanceDiplomacyPenalty(nation1, nation2.id);
  score += grievancePenalty; // This is negative, reducing score

  // *** PHASE 2 ENHANCEMENT: Specialized alliance bonus ***
  // Having a specialized alliance increases cooperation
  const specializedAlliance = getAllianceBetween(nation1, nation2.id);
  if (specializedAlliance && specializedAlliance.active) {
    const allianceBonus = 10 + (specializedAlliance.level * 5) + (specializedAlliance.cooperation / 5);
    score += allianceBonus; // Up to 10 + 25 (level 5) + 20 (100 cooperation) = +55 bonus
  }

  // *** PHASE 3 ENHANCEMENT: Diplomatic Influence bonus ***
  // High DIP indicates diplomatic sophistication and influence
  if (nation2.diplomaticInfluence) {
    const dipBonus = Math.min(15, nation2.diplomaticInfluence.points / 10);
    score += dipBonus; // Up to +15 bonus for high DIP
  }

  // *** PHASE 3 ENHANCEMENT: Council membership respect ***
  // Council members have more diplomatic clout
  if (nation2.councilMembership === 'permanent') {
    score += 20; // Permanent members get significant respect
  } else if (nation2.councilMembership === 'elected') {
    score += 10; // Elected members get moderate respect
  } else if (nation2.councilMembership === 'observer') {
    score += 5; // Observers get slight respect
  }

  // *** DOCTRINE SYSTEM: Doctrine compatibility ***
  // Military doctrines affect diplomatic compatibility
  if (nation1.doctrine && nation2.doctrine) {
    try {
      const doctrineModifier = getDoctrineCompatibilityModifier(
        nation1.doctrine as any,
        nation2.doctrine as any
      );
      score += doctrineModifier; // -25 to +20 based on doctrine compatibility
    } catch {
      // Doctrine system not available, skip modifier
    }
  }

  // *** GOVERNMENT SYSTEM: Government compatibility ***
  // Government types affect diplomatic relations - temporarily disabled due to import issues
  // TODO: Re-enable once circular dependency is resolved
  /*
  if (nation1.governmentState?.currentGovernment && nation2.governmentState?.currentGovernment) {
    try {
      const governmentModule = await import('@/types/government');
      const governmentModifier = governmentModule.calculateGovernmentCompatibility(
        nation1.governmentState.currentGovernment,
        nation2.governmentState.currentGovernment
      );
      score += governmentModifier; // -15 to +20 based on government compatibility
    } catch {
      // Government system not available, skip modifier
    }
  }
  */

  return score;
}

/**
 * Get personality bias for different AI types
 */
function getPersonalityBias(aiType: string, proposalType: string): number {
  const biases: Record<string, Record<string, number>> = {
    aggressive: {
      alliance: -15,
      truce: -10,
      'non-aggression': -5,
      'aid-request': -10,
      'sanction-lift': 0,
      'joint-war': +20,
      'demand-surrender': +15,
      'peace-offer': -15
    },
    defensive: {
      alliance: +15,
      truce: +10,
      'non-aggression': +15,
      'aid-request': +5,
      'sanction-lift': +5,
      'joint-war': -10,
      'demand-surrender': -20,
      'peace-offer': +15
    },
    balanced: {
      alliance: +5,
      truce: +5,
      'non-aggression': +5,
      'aid-request': 0,
      'sanction-lift': 0,
      'joint-war': 0,
      'demand-surrender': -5,
      'peace-offer': +5
    },
    isolationist: {
      alliance: -20,
      truce: +5,
      'non-aggression': +10,
      'aid-request': -15,
      'sanction-lift': 0,
      'joint-war': -25,
      'demand-surrender': -10,
      'peace-offer': +10
    },
    trickster: {
      alliance: -10,
      truce: +5,
      'non-aggression': 0,
      'aid-request': -5,
      'sanction-lift': 0,
      'joint-war': +5,
      'demand-surrender': +5,
      'peace-offer': 0
    },
    chaotic: {
      alliance: 0,
      truce: 0,
      'non-aggression': 0,
      'aid-request': 0,
      'sanction-lift': 0,
      'joint-war': +10,
      'demand-surrender': +10,
      'peace-offer': -5
    }
  };

  return biases[aiType]?.[proposalType] || 0;
}

/**
 * Calculate strategic value of a proposal
 */
function calculateStrategicValue(
  proposal: DiplomacyProposal,
  aiNation: Nation,
  proposerNation: Nation,
  allNations: Nation[]
): number {
  let value = 0;

  switch (proposal.type) {
    case 'alliance':
      // More valuable if proposer is strong
      const proposerPower = calculateMilitaryPower(proposerNation);
      const avgPower = allNations.reduce((sum, n) => sum + calculateMilitaryPower(n), 0) / allNations.length;
      if (proposerPower > avgPower * 1.3) {
        value += 15; // Strong ally
      } else if (proposerPower < avgPower * 0.7) {
        value -= 10; // Weak ally
      }
      break;

    case 'truce':
      // More valuable if we're losing or weak
      const aiPower = calculateMilitaryPower(aiNation);
      const powerRatio = aiPower > 0 ? calculateMilitaryPower(proposerNation) / aiPower : 1;
      if (powerRatio > 1.5) {
        value += 20; // They're much stronger, we need peace
      }
      if (aiNation.instability && aiNation.instability > 50) {
        value += 15; // We're unstable, need peace
      }
      break;

    case 'aid-request':
      // Less valuable if we're low on resources
      if (aiNation.production < 30) {
        value -= 20; // Can't afford it
      }
      if (aiNation.intel < 20) {
        value -= 10; // Low intel
      }
      // More valuable if it improves relations with important nation
      if (calculateMilitaryPower(proposerNation) > avgPower) {
        value += 10;
      }
      break;

    case 'non-aggression':
      // Valuable if we want to focus elsewhere
      const enemyCount = Object.keys(aiNation.threats || {}).filter(id =>
        (aiNation.threats?.[id] || 0) > 10
      ).length;
      if (enemyCount > 2) {
        value += 15; // Too many enemies, good to secure one front
      }
      break;

    case 'joint-war':
      // Valuable if target is a threat
      const targetId = proposal.terms.targetNationId;
      if (targetId && (aiNation.threats?.[targetId] || 0) > 15) {
        value += 25; // Common enemy
      }
      break;

    case 'sanction-lift':
      // Valuable if we benefit from trade
      if (aiNation.production < 40) {
        value -= 10; // They need us more than we need them
      }
      break;
  }

  return value;
}

/**
 * Generate a reason for accepting or rejecting
 */
function generateResponseReason(
  proposal: DiplomacyProposal,
  accepted: boolean,
  factors: DiplomacyEvaluationFactors,
  score: number,
  threshold: number
): string {
  if (accepted) {
    // Acceptance reasons
    if (factors.militaryRatio > 1.5) {
      return "Your military strength is impressive. We accept this proposal.";
    }
    if (factors.relationshipScore > 20) {
      return "Our positive relationship makes this an easy decision. Accepted.";
    }
    if (factors.strategicValue > 15) {
      return "This proposal serves our strategic interests well. We accept.";
    }
    if (proposal.type === 'truce' && factors.threatLevel > 5) {
      return "A temporary ceasefire is acceptable. Let us pause hostilities.";
    }
    if (proposal.type === 'alliance') {
      return "Together we shall be stronger. We accept your alliance.";
    }
    return "Your proposal is reasonable. We accept.";
  } else {
    // Rejection reasons
    if (score < threshold - 30) {
      return "This proposal is completely unacceptable to us. Rejected.";
    }
    if (factors.threatLevel < -5) {
      return "We do not trust you. This proposal is rejected.";
    }
    if (factors.personalityBias < -15) {
      return "This does not align with our national interests. Rejected.";
    }
    if (proposal.type === 'alliance' && factors.relationshipScore < 0) {
      return "Our relations are not strong enough for such a commitment. Perhaps in the future.";
    }
    if (proposal.type === 'aid-request') {
      return "We cannot spare resources at this time. Request denied.";
    }
    if (proposal.type === 'demand-surrender') {
      return "We will never submit to such demands!";
    }
    if (Math.abs(score - threshold) < 10) {
      return "We must decline, though we appreciate the gesture.";
    }
    return "This proposal does not serve our interests. Rejected.";
  }
}

/**
 * Determine if AI should initiate a proposal to the player
 * Returns a proposal if AI wants to make one, null otherwise
 * ENHANCED: Now uses sophisticated trigger system with 6+ negotiation types
 */
export function shouldAIInitiateProposal(
  aiNation: Nation,
  playerNation: Nation,
  turn: number,
  rng?: { next: () => number },
  allNations?: Nation[]
): DiplomacyProposal | null {
  // If allNations is provided, use advanced trigger system
  if (allNations) {
    const trigger = checkAllTriggers(aiNation, playerNation, allNations, turn, 0);

    if (trigger) {
      // Convert sophisticated trigger to legacy proposal format
      const proposalType = convertPurposeToProposalType(trigger.purpose);

      return {
        id: `ai-proposal-${turn}-${aiNation.id}`,
        type: proposalType,
        proposerId: aiNation.id,
        targetId: playerNation.id,
        terms: generateTermsFromTrigger(trigger),
        message: trigger.context.reason,
        turn,
        playerInitiated: false
        // Note: metadata stripped to match DiplomacyProposal interface
        // Original metadata: purpose, urgency, priority, triggerContext
      };
    }
  }

  // Fallback to legacy simple logic if no allNations provided
  return shouldAIInitiateProposalLegacy(aiNation, playerNation, turn, rng);
}

/**
 * Convert negotiation purpose to legacy proposal type
 * Maps new purpose types to valid ProposalType values
 */
function convertPurposeToProposalType(purpose: string): 'alliance' | 'truce' | 'non-aggression' | 'aid-request' | 'sanction-lift' | 'joint-war' | 'demand-surrender' | 'peace-offer' {
  switch (purpose) {
    case 'request-help': return 'aid-request';
    case 'offer-alliance': return 'alliance';
    case 'reconciliation': return 'peace-offer';
    case 'demand-compensation': return 'demand-surrender'; // Map to valid type: demands are similar
    case 'warning': return 'truce'; // Map to valid type: warning implies de-escalation
    case 'peace-offer': return 'peace-offer';
    case 'trade-opportunity': return 'aid-request'; // Map to valid type: economic cooperation
    case 'mutual-defense': return 'alliance';
    case 'joint-venture': return 'joint-war';
    default: return 'alliance';
  }
}

/**
 * Generate proposal terms from trigger context
 */
function generateTermsFromTrigger(trigger: any): any {
  const terms: any = {};

  if (trigger.context.targetNation) {
    terms.targetNationId = trigger.context.targetNation;
  }

  if (trigger.context.resourceType) {
    terms.resourceType = trigger.context.resourceType;
  }

  if (trigger.context.grievanceId) {
    terms.grievanceId = trigger.context.grievanceId;
  }

  if (trigger.purpose === 'demand-compensation' && trigger.context.totalSeverity) {
    terms.compensationAmount = trigger.context.totalSeverity * 10;
  }

  return terms;
}

/**
 * Legacy proposal logic (fallback)
 */
function shouldAIInitiateProposalLegacy(
  aiNation: Nation,
  playerNation: Nation,
  turn: number,
  rng?: { next: () => number }
): DiplomacyProposal | null {
  const threatLevel = aiNation.threats?.[playerNation.id] || 0;
  const hasAlliance = aiNation.treaties?.[playerNation.id]?.alliance;
  const hasTruce = (aiNation.treaties?.[playerNation.id]?.truceTurns || 0) > 0;
  const aiType = aiNation.aiPersonality || 'balanced';

  // Don't propose if already allied
  if (hasAlliance) return null;

  // Random chance based on AI type
  const diplomaticChance = aiType === 'defensive' ? 0.15 : aiType === 'aggressive' ? 0.05 : 0.1;
  const randomValue = rng ? rng.next() : Math.random();
  if (randomValue > diplomaticChance) return null;

  // Defensive AI seeks alliances when threatened
  if (aiType === 'defensive' && threatLevel > 8 && !hasTruce) {
    return {
      id: `ai-proposal-${turn}-${aiNation.id}`,
      type: 'alliance',
      proposerId: aiNation.id,
      targetId: playerNation.id,
      terms: {},
      message: `We face common threats. An alliance between ${aiNation.name} and ${playerNation.name} would benefit us both.`,
      turn,
      playerInitiated: false
    };
  }

  // AI requests truce when losing or weak
  const aiPower = calculateMilitaryPower(aiNation);
  const playerPower = calculateMilitaryPower(playerNation);

  if (playerPower > aiPower * 1.5 && threatLevel > 5 && !hasTruce) {
    return {
      id: `ai-proposal-${turn}-${aiNation.id}`,
      type: 'truce',
      proposerId: aiNation.id,
      targetId: playerNation.id,
      terms: { duration: 3 },
      message: `${aiNation.name} proposes a 3-turn truce. Let us pause our conflict and avoid unnecessary destruction.`,
      turn,
      playerInitiated: false
    };
  }

  // AI requests aid when unstable
  const aidRandom = rng ? rng.next() : Math.random();
  if (aiNation.instability && aiNation.instability > 60 && aidRandom > 0.7) {
    return {
      id: `ai-proposal-${turn}-${aiNation.id}`,
      type: 'aid-request',
      proposerId: aiNation.id,
      targetId: playerNation.id,
      terms: {},
      message: `${aiNation.name} is experiencing severe instability. We request economic assistance from ${playerNation.name}.`,
      turn,
      playerInitiated: false
    };
  }

  // AI requests sanction lift
  const sanctionRandom = rng ? rng.next() : Math.random();
  if (aiNation.sanctionedBy?.[playerNation.id] && sanctionRandom > 0.8) {
    return {
      id: `ai-proposal-${turn}-${aiNation.id}`,
      type: 'sanction-lift',
      proposerId: aiNation.id,
      targetId: playerNation.id,
      terms: {},
      message: `The sanctions imposed by ${playerNation.name} are harming our people. We request you lift them and restore normal relations.`,
      turn,
      playerInitiated: false
    };
  }

  // Aggressive AI may demand tribute
  const tributeRandom = rng ? rng.next() : Math.random();
  if (aiType === 'aggressive' && aiPower > playerPower * 1.8 && tributeRandom > 0.9) {
    return {
      id: `ai-proposal-${turn}-${aiNation.id}`,
      type: 'demand-surrender',
      proposerId: aiNation.id,
      targetId: playerNation.id,
      terms: { tributeAmount: 50 },
      message: `${aiNation.name} is far superior to ${playerNation.name}. Submit tribute of 50 production or face consequences.`,
      turn,
      playerInitiated: false
    };
  }

  return null;
}
