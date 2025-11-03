/**
 * AI Negotiation Evaluator
 *
 * Handles AI evaluation of negotiation deals, counter-offer generation,
 * and proactive AI diplomacy initiation.
 */

import type { Nation } from '@/types/game';
import type {
  NegotiationState,
  AIEvaluation,
  CounterOffer,
  CounterOfferChange,
  NegotiableItem,
  NegotiationPurpose,
  AIInitiatedNegotiation,
  NegotiationUrgency,
  ItemValueContext,
} from '@/types/negotiation';
import type { Grievance } from '@/types/grievancesAndClaims';
import {
  calculateItemValue,
  calculateTotalValue,
  createNegotiation,
  addItemToOffer,
  addItemToRequest,
} from './negotiationUtils';
import { getRelationship } from './relationshipUtils';
import { getTrust, getFavors } from '@/types/trustAndFavors';
import {
  calculateAgendaNegotiationBonus,
  getAgendaFeedback,
  checkAgendaViolations,
} from './agendaSystem';

// ============================================================================
// Constants
// ============================================================================

/**
 * Thresholds for AI acceptance decisions
 */
const ACCEPTANCE_THRESHOLDS = {
  AUTO_ACCEPT: 300,       // >300: ~95% acceptance
  VERY_LIKELY: 200,       // >200: ~80% acceptance
  LIKELY: 100,            // >100: ~60% acceptance
  POSSIBLE: 0,            // >0: ~40% acceptance
  COUNTER_OFFER: -100,    // >-100: 20% accept, consider counter-offer
  UNLIKELY: -200,         // >-200: 5% accept, unlikely counter-offer
  // <-200: Flat rejection
};

/**
 * AI personality modifiers for negotiation
 */
const PERSONALITY_MODIFIERS = {
  aggressive: {
    alliance: -0.3,
    treaty: -0.2,
    warlike: 0.3,
  },
  defensive: {
    alliance: 0.4,
    treaty: 0.3,
    warlike: -0.4,
  },
  balanced: {
    alliance: 0.1,
    treaty: 0.1,
    warlike: 0,
  },
  isolationist: {
    alliance: -0.5,
    treaty: -0.3,
    warlike: -0.2,
  },
  trickster: {
    alliance: 0,
    treaty: -0.1,
    warlike: 0.2,
  },
  chaotic: {
    alliance: 0,
    treaty: 0,
    warlike: 0,
  },
};

// ============================================================================
// Main Evaluation Function
// ============================================================================

/**
 * Evaluate a negotiation from the AI's perspective
 * Returns comprehensive evaluation including acceptance probability and potential counter-offers
 */
export function evaluateNegotiation(
  negotiation: NegotiationState,
  aiNation: Nation,
  playerNation: Nation,
  allNations: Nation[],
  currentTurn: number,
  rng: () => number = Math.random
): AIEvaluation {
  const relationship = getRelationship(aiNation, playerNation.id);
  const trust = getTrust(aiNation, playerNation.id);
  const favors = getFavors(aiNation, playerNation.id);

  // Create evaluation context
  const context: ItemValueContext = {
    evaluatorNation: aiNation,
    otherNation: playerNation,
    allNations,
    currentTurn,
    relationship,
    trust,
    threats: aiNation.threats || {},
    gameState: { nations: allNations, turn: currentTurn } as any,
  };

  // Calculate base values
  const offerValue = calculateTotalValue(negotiation.offerItems, context);
  const requestValue = calculateTotalValue(negotiation.requestItems, context);
  const netValue = offerValue - requestValue; // Positive = good for AI

  // Calculate modifiers
  const relationshipModifier = calculateRelationshipModifier(relationship);
  const trustModifier = calculateTrustModifier(trust);
  const favorModifier = calculateFavorModifier(favors);
  const personalityBonus = calculatePersonalityBonus(negotiation, aiNation);

  // Calculate agenda modifier (Phase 4: Agenda System)
  const agendaModifier = calculateAgendaNegotiationBonus(
    playerNation,
    aiNation,
    { nations: allNations, turn: currentTurn }
  );

  const strategicValue = calculateStrategicValue(negotiation, aiNation, playerNation, allNations);
  const grievancePenalty = calculateGrievancePenalty(aiNation, playerNation);
  const randomFactor = (rng() - 0.5) * 20; // -10 to +10

  // Calculate final score
  const finalScore = netValue +
                      relationshipModifier +
                      trustModifier +
                      favorModifier +
                      personalityBonus +
                      agendaModifier +
                      strategicValue +
                      grievancePenalty +
                      randomFactor;

  // Calculate acceptance probability
  const acceptanceProbability = calculateAcceptanceProbability(finalScore);

  // Generate feedback
  const feedback = generateNegotiationFeedback(
    finalScore,
    {
      offerValue,
      requestValue,
      netValue,
      relationshipModifier,
      trustModifier,
      favorModifier,
      personalityBonus,
      agendaModifier,
      strategicValue,
      grievancePenalty,
      randomFactor,
      finalScore,
      acceptanceProbability,
      feedback: '',
    },
    aiNation,
    playerNation,
    relationship,
    trust
  );

  // Generate counter-offer if appropriate
  let counterOffer: CounterOffer | undefined;
  const rejectionReasons: string[] = [];

  if (finalScore < ACCEPTANCE_THRESHOLDS.LIKELY &&
      finalScore > ACCEPTANCE_THRESHOLDS.UNLIKELY) {
    // Consider counter-offer
    if (shouldMakeCounterOffer(finalScore, aiNation.ai || 'balanced', relationship, trust)) {
      counterOffer = generateCounterOffer(
        negotiation,
        aiNation,
        playerNation,
        finalScore,
        allNations,
        context
      );
    }
  }

  // Gather rejection reasons
  if (finalScore < 0) {
    if (netValue < -50) rejectionReasons.push('Deal heavily favors you');
    if (trust < 30) rejectionReasons.push('I don\'t trust you enough');
    if (relationship < -30) rejectionReasons.push('Our relationship is too poor');
    if (grievancePenalty < -20) rejectionReasons.push('We have unresolved grievances');

    // Check agenda violations (Phase 4)
    if (agendaModifier < -20) {
      const violations = checkAgendaViolations(
        playerNation,
        aiNation,
        { nations: allNations, turn: currentTurn }
      );
      const agendaFeedback = getAgendaFeedback(
        playerNation,
        aiNation,
        { nations: allNations, turn: currentTurn }
      );

      if (violations.length > 0) {
        const firstViolation = violations[0];
        const violationFeedback = agendaFeedback.byAgenda[firstViolation.agenda.id]?.negative[0]
          || agendaFeedback.negative[0]
          || firstViolation.modifiers[0]?.description;

        if (violationFeedback) {
          rejectionReasons.push(violationFeedback);
        }
      }
    }
  }

  return {
    offerValue,
    requestValue,
    netValue,
    relationshipModifier,
    trustModifier,
    favorModifier,
    personalityBonus,
    agendaModifier,
    strategicValue,
    grievancePenalty,
    randomFactor,
    finalScore,
    acceptanceProbability,
    feedback,
    counterOffer,
    rejectionReasons: rejectionReasons.length > 0 ? rejectionReasons : undefined,
  };
}

// ============================================================================
// Modifier Calculations
// ============================================================================

function calculateRelationshipModifier(relationship: number): number {
  // -50 to +50 based on relationship (-100 to +100)
  return relationship * 0.5;
}

function calculateTrustModifier(trust: number): number {
  // -30 to +30 based on trust (0 to 100)
  return (trust - 50) * 0.6;
}

function calculateFavorModifier(favors: number): number {
  // +5 per 10 favors owed to player, -5 per 10 favors player owes
  return favors * 0.5;
}

function calculatePersonalityBonus(
  negotiation: NegotiationState,
  aiNation: Nation
): number {
  const personality = aiNation.ai || 'balanced';
  const modifiers = PERSONALITY_MODIFIERS[personality as keyof typeof PERSONALITY_MODIFIERS] || PERSONALITY_MODIFIERS.balanced;

  let bonus = 0;

  // Check for alliance items
  const hasAlliance = negotiation.offerItems.some(i => i.type === 'alliance') ||
                      negotiation.requestItems.some(i => i.type === 'alliance');
  if (hasAlliance && modifiers.alliance) {
    bonus += modifiers.alliance * 100;
  }

  // Check for treaty items
  const hasTreaty = negotiation.offerItems.some(i => i.type === 'treaty') ||
                    negotiation.requestItems.some(i => i.type === 'treaty');
  if (hasTreaty && modifiers.treaty) {
    bonus += modifiers.treaty * 100;
  }

  // Check for war-related items
  const hasWarItem = negotiation.offerItems.some(i => i.type === 'join-war') ||
                     negotiation.requestItems.some(i => i.type === 'join-war');
  if (hasWarItem && modifiers.warlike) {
    bonus += modifiers.warlike * 100;
  }

  return bonus;
}

function calculateStrategicValue(
  negotiation: NegotiationState,
  aiNation: Nation,
  playerNation: Nation,
  allNations: Nation[]
): number {
  let value = 0;

  // Alliance is strategically valuable if AI is under threat
  const threatLevel = Object.values(aiNation.threats || {}).reduce((sum, t) => sum + t, 0);
  const hasAlliance = negotiation.offerItems.some(i => i.type === 'alliance');

  if (hasAlliance && threatLevel > 15) {
    value += 50; // Alliance very valuable under threat
  } else if (hasAlliance && threatLevel > 8) {
    value += 25;
  }

  // Joining war against common enemy
  const joinWarItems = negotiation.offerItems.filter(i => i.type === 'join-war');
  for (const item of joinWarItems) {
    if (item.targetId) {
      const enemyThreat = aiNation.threats?.[item.targetId] || 0;
      if (enemyThreat > 10) {
        value += 30; // Help against a threatening enemy
      }
    }
  }

  return value;
}

function calculateGrievancePenalty(aiNation: Nation, playerNation: Nation): number {
  const grievances = aiNation.grievances?.filter(
    g => g.againstNationId === playerNation.id && !g.resolved
  ) || [];

  let penalty = 0;
  for (const grievance of grievances) {
    switch (grievance.severity) {
      case 'minor':
        penalty -= 5;
        break;
      case 'moderate':
        penalty -= 10;
        break;
      case 'major':
        penalty -= 20;
        break;
      case 'severe':
        penalty -= 30;
        break;
    }
  }

  return penalty;
}

function calculateAcceptanceProbability(finalScore: number): number {
  // Convert final score to probability (0-100%)
  if (finalScore >= ACCEPTANCE_THRESHOLDS.AUTO_ACCEPT) return 95;
  if (finalScore >= ACCEPTANCE_THRESHOLDS.VERY_LIKELY) return 80;
  if (finalScore >= ACCEPTANCE_THRESHOLDS.LIKELY) return 60;
  if (finalScore >= ACCEPTANCE_THRESHOLDS.POSSIBLE) return 40;
  if (finalScore >= ACCEPTANCE_THRESHOLDS.COUNTER_OFFER) return 20;
  if (finalScore >= ACCEPTANCE_THRESHOLDS.UNLIKELY) return 5;
  return 0;
}

// ============================================================================
// Feedback Generation
// ============================================================================

export function generateNegotiationFeedback(
  finalScore: number,
  evaluation: AIEvaluation,
  aiNation: Nation,
  playerNation: Nation,
  relationship: number,
  trust: number
): string {
  // Very positive
  if (finalScore >= ACCEPTANCE_THRESHOLDS.AUTO_ACCEPT) {
    const messages = [
      'This is an excellent proposal. I accept!',
      'You are most generous. We have a deal.',
      'I appreciate this offer and gladly accept.',
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  // Positive
  if (finalScore >= ACCEPTANCE_THRESHOLDS.LIKELY) {
    const messages = [
      'This seems fair. I accept your terms.',
      'I find this acceptable.',
      'We have ourselves a deal.',
      'This works for me.',
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  // Neutral (possible with adjustments)
  if (finalScore >= ACCEPTANCE_THRESHOLDS.POSSIBLE) {
    const messages = [
      'This could work, but I\'d like a bit more.',
      'We\'re close. Add a little more and we have a deal.',
      'Almost there. What else can you offer?',
      'Not quite enough, but we can work with this.',
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  // Negative (counter-offer territory)
  if (finalScore >= ACCEPTANCE_THRESHOLDS.COUNTER_OFFER) {
    const messages = [
      'This doesn\'t quite work for me. Let me suggest some changes.',
      'Not enough. Here\'s what I need...',
      'I\'m afraid I need more than this.',
      'This is unbalanced. Let me propose adjustments.',
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  // Very negative
  if (trust < 30) {
    return 'I don\'t trust you enough for this deal.';
  }
  if (relationship < -30) {
    return 'Our relationship is too poor for such an arrangement.';
  }
  if (evaluation.grievancePenalty < -20) {
    return 'We have too many unresolved grievances.';
  }

  return 'This is completely unacceptable.';
}

// ============================================================================
// Counter-Offer Generation
// ============================================================================

export function shouldMakeCounterOffer(
  finalScore: number,
  personality: string,
  relationship: number,
  trust: number
): boolean {
  // Don't counter if relationship is too hostile
  if (relationship < -50) return false;

  // Don't counter if trust is very low
  if (trust < 20) return false;

  // Counter if score is in the range
  if (finalScore < ACCEPTANCE_THRESHOLDS.LIKELY &&
      finalScore > ACCEPTANCE_THRESHOLDS.UNLIKELY) {
    // Defensive AI more likely to counter
    if (personality === 'defensive') return Math.random() < 0.8;
    // Isolationist less likely
    if (personality === 'isolationist') return Math.random() < 0.4;
    // Others moderate
    return Math.random() < 0.6;
  }

  return false;
}

export function generateCounterOffer(
  negotiation: NegotiationState,
  aiNation: Nation,
  playerNation: Nation,
  currentScore: number,
  allNations: Nation[],
  context: ItemValueContext
): CounterOffer | null {
  const deficit = Math.abs(currentScore);
  const changes: CounterOfferChange[] = [];

  // Strategy: Add items to what AI receives or remove from what AI gives
  // Prefer adding to request (asking player for more)

  let modifiedNegotiation = { ...negotiation };

  // How much value do we need to add?
  const neededValue = deficit + 50; // Add buffer for acceptance

  // Try to add items to request
  const desiredItems = getAIDesiredItems(aiNation, playerNation, allNations, context);

  for (const item of desiredItems) {
    if (neededValue <= 0) break;

    const itemValue = calculateItemValue(item, context);
    if (itemValue > 0 && itemValue <= neededValue * 1.5) {
      modifiedNegotiation.requestItems = [...modifiedNegotiation.requestItems, item];
      changes.push({
        type: 'add',
        side: 'request',
        item,
        reason: `I need ${item.type} to make this work`,
      });
      break; // Add one item at a time
    }
  }

  // If still not enough, try removing from offer
  if (changes.length === 0 && modifiedNegotiation.offerItems.length > 0) {
    // Find least valuable item AI is offering
    const leastValuableIndex = modifiedNegotiation.offerItems.reduce((minIdx, item, idx, arr) => {
      const minValue = calculateItemValue(arr[minIdx], context);
      const currentValue = calculateItemValue(item, context);
      return currentValue < minValue ? idx : minIdx;
    }, 0);

    const removedItem = modifiedNegotiation.offerItems[leastValuableIndex];
    modifiedNegotiation.offerItems = modifiedNegotiation.offerItems.filter((_, idx) => idx !== leastValuableIndex);
    changes.push({
      type: 'remove',
      side: 'offer',
      item: removedItem,
      reason: `I cannot offer ${removedItem.type} in this deal`,
    });
  }

  if (changes.length === 0) {
    return null; // Couldn't generate meaningful counter-offer
  }

  // Generate explanation
  const explanation = changes.map(c => c.reason).join('. ');

  return {
    offerItems: modifiedNegotiation.offerItems,
    requestItems: modifiedNegotiation.requestItems,
    explanation,
    changes,
  };
}

// ============================================================================
// AI Desire Functions
// ============================================================================

export function getAIDesiredItems(
  aiNation: Nation,
  playerNation: Nation,
  allNations: Nation[],
  context: ItemValueContext
): NegotiableItem[] {
  const desired: NegotiableItem[] = [];

  // Desire gold if low on resources
  if ((aiNation.production || 0) < 100) {
    desired.push({
      type: 'gold',
      amount: 200,
      description: 'Gold to boost economy',
    });
  }

  // Desire intel if low
  if ((aiNation.intel || 0) < 30) {
    desired.push({
      type: 'intel',
      amount: 15,
      description: 'Intelligence points',
    });
  }

  // Desire alliance if under threat
  const threatLevel = Object.values(aiNation.threats || {}).reduce((sum, t) => sum + t, 0);
  if (threatLevel > 12 && !aiNation.alliances?.includes(playerNation.id)) {
    desired.push({
      type: 'alliance',
      subtype: 'defensive',
      description: 'Defensive alliance for security',
    });
  }

  // Desire help in war if enemy exists
  for (const [enemyId, threat] of Object.entries(aiNation.threats || {})) {
    if (threat > 15) {
      desired.push({
        type: 'join-war',
        targetId: enemyId,
        description: 'Help against common enemy',
      });
      break; // Only ask for help against one enemy
    }
  }

  // Desire grievance apology if exists
  const grievances = aiNation.grievances?.filter(
    g => g.againstNationId === playerNation.id && !g.resolved
  ) || [];
  if (grievances.length > 0 && grievances[0].severity !== 'minor') {
    desired.push({
      type: 'grievance-apology',
      grievanceId: grievances[0].id,
      description: 'Apology for past actions',
    });
  }

  return desired;
}

export function getAIOfferableItems(
  aiNation: Nation,
  playerNation: Nation,
  relationship: number,
  trust: number
): NegotiableItem[] {
  const offerable: NegotiableItem[] = [];

  // Can offer gold if has excess
  if ((aiNation.production || 0) > 200) {
    offerable.push({
      type: 'gold',
      amount: 100,
      description: 'Gold payment',
    });
  }

  // Can offer intel if has excess
  if ((aiNation.intel || 0) > 50) {
    offerable.push({
      type: 'intel',
      amount: 10,
      description: 'Intelligence sharing',
    });
  }

  // Can offer alliance if relationship is good
  if (relationship > 25 && trust > 50 && !aiNation.alliances?.includes(playerNation.id)) {
    offerable.push({
      type: 'alliance',
      description: 'Alliance agreement',
    });
  }

  // Can offer treaty
  if (relationship > 0) {
    offerable.push({
      type: 'treaty',
      subtype: 'non-aggression',
      duration: 10,
      description: 'Non-aggression pact',
    });
  }

  // Can offer sanction lift if sanctioning
  if (playerNation.sanctionedBy?.[aiNation.id]) {
    offerable.push({
      type: 'sanction-lift',
      description: 'Lift economic sanctions',
    });
  }

  return offerable;
}

// ============================================================================
// Proactive AI Diplomacy
// ============================================================================

export function aiConsiderInitiatingNegotiation(
  aiNation: Nation,
  targetNation: Nation,
  allNations: Nation[],
  currentTurn: number,
  rng: () => number = Math.random
): AIInitiatedNegotiation | null {
  const relationship = getRelationship(aiNation, targetNation.id);
  const trust = getTrust(aiNation, targetNation.id);

  // Don't initiate if very hostile
  if (relationship < -60) return null;

  // Check various triggers
  const threatLevel = Object.values(aiNation.threats || {}).reduce((sum, t) => sum + t, 0);

  // Trigger: Under threat, request help
  if (threatLevel > 15 && relationship > -20 && rng() < 0.3) {
    return createHelpRequest(aiNation, targetNation, allNations, currentTurn, threatLevel);
  }

  // Trigger: Good relationship, offer alliance
  if (relationship > 30 && trust > 60 && !aiNation.alliances?.includes(targetNation.id) && rng() < 0.2) {
    return createAllianceOffer(aiNation, targetNation, currentTurn);
  }

  // Trigger: Has excess resources, offer trade
  if ((aiNation.production || 0) > 300 && relationship > 0 && rng() < 0.15) {
    return createTradeOffer(aiNation, targetNation, currentTurn);
  }

  // Trigger: Grievances exist, demand compensation
  const grievances = aiNation.grievances?.filter(
    g => g.againstNationId === targetNation.id && !g.resolved && g.severity !== 'minor'
  ) || [];
  if (grievances.length > 0 && trust < 40 && rng() < 0.25) {
    return createCompensationDemand(aiNation, targetNation, currentTurn, grievances[0]);
  }

  return null;
}

// Helper functions for creating AI-initiated negotiations

function createHelpRequest(
  aiNation: Nation,
  targetNation: Nation,
  allNations: Nation[],
  currentTurn: number,
  threatLevel: number
): AIInitiatedNegotiation {
  const negotiation = createNegotiation(aiNation.id, targetNation.id, currentTurn, 'request-help');

  // AI offers resources in exchange for alliance or military help
  negotiation.offerItems = [
    { type: 'gold', amount: 200, description: 'Payment for assistance' },
  ];
  negotiation.requestItems = [
    { type: 'alliance', subtype: 'defensive', description: 'Defensive alliance' },
  ];

  return {
    aiNationId: aiNation.id,
    targetNationId: targetNation.id,
    purpose: 'request-help',
    proposedDeal: negotiation,
    message: `We face serious threats. Let us stand together against our enemies.`,
    urgency: threatLevel > 20 ? 'critical' : 'high',
    expiresAtTurn: currentTurn + 5,
    createdTurn: currentTurn,
  };
}

function createAllianceOffer(
  aiNation: Nation,
  targetNation: Nation,
  currentTurn: number
): AIInitiatedNegotiation {
  const negotiation = createNegotiation(aiNation.id, targetNation.id, currentTurn, 'offer-alliance');

  negotiation.offerItems = [
    { type: 'alliance', description: 'Alliance agreement' },
    { type: 'open-borders', duration: 20, description: 'Open borders' },
  ];
  negotiation.requestItems = [
    { type: 'treaty', subtype: 'non-aggression', duration: 20, description: 'Non-aggression pact' },
  ];

  return {
    aiNationId: aiNation.id,
    targetNationId: targetNation.id,
    purpose: 'offer-alliance',
    proposedDeal: negotiation,
    message: 'Our nations would benefit from a formal alliance. Let us strengthen our friendship.',
    urgency: 'medium',
    expiresAtTurn: currentTurn + 8,
    createdTurn: currentTurn,
  };
}

function createTradeOffer(
  aiNation: Nation,
  targetNation: Nation,
  currentTurn: number
): AIInitiatedNegotiation {
  const negotiation = createNegotiation(aiNation.id, targetNation.id, currentTurn, 'trade-opportunity');

  negotiation.offerItems = [
    { type: 'gold', amount: 150, description: 'Gold for trade' },
  ];
  negotiation.requestItems = [
    { type: 'favor-exchange', amount: 10, description: 'Future favors' },
  ];

  return {
    aiNationId: aiNation.id,
    targetNationId: targetNation.id,
    purpose: 'trade-opportunity',
    proposedDeal: negotiation,
    message: 'I have resources that might interest you. Perhaps we can arrange a trade?',
    urgency: 'low',
    expiresAtTurn: currentTurn + 10,
    createdTurn: currentTurn,
  };
}

function createCompensationDemand(
  aiNation: Nation,
  targetNation: Nation,
  currentTurn: number,
  grievance: Grievance
): AIInitiatedNegotiation {
  const negotiation = createNegotiation(aiNation.id, targetNation.id, currentTurn, 'demand-compensation');

  negotiation.offerItems = [];
  negotiation.requestItems = [
    { type: 'grievance-apology', grievanceId: grievance.id, description: 'Formal apology' },
    { type: 'gold', amount: 100, description: 'Compensation' },
  ];

  return {
    aiNationId: aiNation.id,
    targetNationId: targetNation.id,
    purpose: 'demand-compensation',
    proposedDeal: negotiation,
    message: 'You have wronged me. I demand compensation for your actions.',
    urgency: 'high',
    expiresAtTurn: currentTurn + 5,
    createdTurn: currentTurn,
  };
}
