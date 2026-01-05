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
import {
  calculateAllModifiers,
  PERSONALITY_MODIFIERS,
  type EvaluationModifiers,
} from './evaluationModifiers';
import {
  calculateAcceptanceProbability,
  generateNegotiationFeedback,
  gatherRejectionReasons,
  shouldMakeCounterOffer,
  generateCounterOffer,
  ACCEPTANCE_THRESHOLDS,
} from './evaluationFeedback';

// ============================================================================
// Constants
// ============================================================================

// Note: ACCEPTANCE_THRESHOLDS and PERSONALITY_MODIFIERS have been moved to
// evaluationFeedback.ts and evaluationModifiers.ts respectively for better organization.

// ============================================================================
// Main Evaluation Function
// ============================================================================

/**
 * Evaluate a negotiation from the AI's perspective
 * Returns comprehensive evaluation including acceptance probability and potential counter-offers
 *
 * Refactored to use modular components for improved testability and maintainability.
 */
export function evaluateNegotiation(
  negotiation: NegotiationState,
  aiNation: Nation,
  playerNation: Nation,
  allNations: Nation[],
  currentTurn: number,
  rng: () => number = Math.random
): AIEvaluation {
  // Get relationship data
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

  // Calculate all modifiers using the modifiers module
  const modifiers = calculateAllModifiers(
    negotiation,
    aiNation,
    playerNation,
    allNations,
    relationship,
    trust,
    favors
  );

  // Calculate agenda modifier (Phase 4: Agenda System)
  const agendaModifier = calculateAgendaNegotiationBonus(
    playerNation,
    aiNation,
    { nations: allNations, turn: currentTurn } as any
  );

  // Add random factor
  const randomFactor = (rng() - 0.5) * 20; // -10 to +10

  // Calculate final score
  const finalScore = netValue +
                      modifiers.relationshipModifier +
                      modifiers.trustModifier +
                      modifiers.favorModifier +
                      modifiers.personalityBonus +
                      agendaModifier +
                      modifiers.strategicValue +
                      modifiers.grievancePenalty +
                      randomFactor;

  // Calculate acceptance probability
  const acceptanceProbability = calculateAcceptanceProbability(finalScore);

  // Generate feedback
  const feedback = generateNegotiationFeedback(
    finalScore,
    aiNation,
    playerNation,
    relationship,
    trust,
    modifiers.grievancePenalty
  );

  // Generate counter-offer if appropriate
  let counterOffer: CounterOffer | undefined;
  if (finalScore < ACCEPTANCE_THRESHOLDS.LIKELY &&
      finalScore > ACCEPTANCE_THRESHOLDS.UNLIKELY) {
    if (shouldMakeCounterOffer(finalScore, aiNation.aiPersonality || 'balanced', relationship, trust)) {
      counterOffer = generateCounterOffer(
        negotiation,
        aiNation,
        playerNation,
        finalScore,
        allNations,
        context
      ) || undefined;
    }
  }

  // Gather rejection reasons
  const rejectionReasons = gatherRejectionReasons(
    finalScore,
    netValue,
    trust,
    relationship,
    modifiers.grievancePenalty,
    agendaModifier,
    playerNation,
    aiNation,
    allNations,
    currentTurn
  );

  return {
    offerValue,
    requestValue,
    netValue,
    relationshipModifier: modifiers.relationshipModifier,
    trustModifier: modifiers.trustModifier,
    favorModifier: modifiers.favorModifier,
    personalityBonus: modifiers.personalityBonus,
    agendaModifier,
    strategicValue: modifiers.strategicValue,
    grievancePenalty: modifiers.grievancePenalty,
    randomFactor,
    finalScore,
    acceptanceProbability,
    feedback,
    counterOffer,
    rejectionReasons: rejectionReasons.length > 0 ? rejectionReasons : undefined,
  };
}

// ============================================================================
// Re-exported Functions for Compatibility
// ============================================================================

// Note: These functions have been moved to evaluationModifiers.ts and evaluationFeedback.ts
// They are re-exported here for backward compatibility with existing code.

export { getAIDesiredItems } from './evaluationFeedback';

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
