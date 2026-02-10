/**
 * Evaluation Feedback Module
 *
 * Functions for generating feedback, calculating acceptance probability,
 * creating counter-offers, and gathering rejection reasons.
 * Extracted from aiNegotiationEvaluator.ts for improved testability and maintainability.
 */

import type { Nation } from '@/types/game';
import type {
  NegotiationState,
  CounterOffer,
  CounterOfferChange,
  NegotiableItem,
  ItemValueContext,
} from '@/types/negotiation';
import { calculateItemValue } from './negotiationUtils';
import {
  checkAgendaViolations,
  getAgendaFeedback,
} from './agendaSystem';

// ============================================================================
// Constants
// ============================================================================

/**
 * Thresholds for AI acceptance decisions
 */
export const ACCEPTANCE_THRESHOLDS = {
  AUTO_ACCEPT: 300,       // >300: ~95% acceptance
  VERY_LIKELY: 200,       // >200: ~80% acceptance
  LIKELY: 100,            // >100: ~60% acceptance
  POSSIBLE: 0,            // >0: ~40% acceptance
  COUNTER_OFFER: -100,    // >-100: 20% accept, consider counter-offer
  UNLIKELY: -200,         // >-200: 5% accept, unlikely counter-offer
  // <-200: Flat rejection
} as const;

/**
 * Thresholds for rejection reasons
 */
export const REJECTION_THRESHOLDS = {
  NET_VALUE: -50,
  TRUST: 30,
  RELATIONSHIP: -30,
  GRIEVANCE: -20,
  AGENDA: -20,
} as const;

/**
 * Thresholds for counter-offer decisions
 */
export const COUNTER_OFFER_THRESHOLDS = {
  RELATIONSHIP_MIN: -50,
  TRUST_MIN: 20,
  DEFENSIVE_PROBABILITY: 0.8,
  ISOLATIONIST_PROBABILITY: 0.4,
  DEFAULT_PROBABILITY: 0.6,
} as const;

// ============================================================================
// Acceptance Probability
// ============================================================================

/**
 * Convert final score to acceptance probability (0-100%)
 */
export function calculateAcceptanceProbability(finalScore: number): number {
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

/**
 * Generate contextual feedback message based on evaluation score and context
 */
export function generateNegotiationFeedback(
  finalScore: number,
  aiNation: Nation,
  playerNation: Nation,
  relationship: number,
  trust: number,
  grievancePenalty: number
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
      'This doesn\'t work for me. Let me suggest some changes.',
      'Not enough. Here\'s what I need...',
      'I\'m afraid I need more than this.',
      'This is unbalanced. Let me propose adjustments.',
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  // Very negative - provide specific reason
  if (trust < REJECTION_THRESHOLDS.TRUST) {
    return 'I don\'t trust you enough for this deal.';
  }
  if (relationship < REJECTION_THRESHOLDS.RELATIONSHIP) {
    return 'Our relationship is too poor for such an arrangement.';
  }
  if (grievancePenalty < REJECTION_THRESHOLDS.GRIEVANCE) {
    return 'We have too many unresolved grievances.';
  }

  return 'This is completely unacceptable.';
}

// ============================================================================
// Rejection Reasons
// ============================================================================

/**
 * Gather all rejection reasons based on evaluation results
 */
export function gatherRejectionReasons(
  finalScore: number,
  netValue: number,
  trust: number,
  relationship: number,
  grievancePenalty: number,
  agendaModifier: number,
  playerNation: Nation,
  aiNation: Nation,
  allNations: Nation[],
  currentTurn: number
): string[] {
  const reasons: string[] = [];

  if (finalScore >= 0) {
    return reasons; // No rejection reasons if score is positive
  }

  // Check each potential rejection factor
  if (netValue < REJECTION_THRESHOLDS.NET_VALUE) {
    reasons.push('Deal heavily favors you');
  }

  if (trust < REJECTION_THRESHOLDS.TRUST) {
    reasons.push('I don\'t trust you enough');
  }

  if (relationship < REJECTION_THRESHOLDS.RELATIONSHIP) {
    reasons.push('Our relationship is too poor');
  }

  if (grievancePenalty < REJECTION_THRESHOLDS.GRIEVANCE) {
    reasons.push('We have unresolved grievances');
  }

  // Check agenda violations (Phase 4)
  if (agendaModifier < REJECTION_THRESHOLDS.AGENDA) {
    const violations = checkAgendaViolations(
      playerNation,
      aiNation,
      { nations: allNations, turn: currentTurn } as any
    );
    const agendaFeedback = getAgendaFeedback(
      playerNation,
      aiNation,
      { nations: allNations, turn: currentTurn } as any
    );

    if (violations.length > 0) {
      const firstViolation = violations[0];
      const violationFeedback = agendaFeedback.byAgenda[firstViolation.agenda.id]?.negative[0]
        || agendaFeedback.negative[0]
        || firstViolation.modifiers[0]?.description;

      if (violationFeedback) {
        reasons.push(violationFeedback);
      }
    }
  }

  return reasons;
}

// ============================================================================
// Counter-Offer Generation
// ============================================================================

/**
 * Determine if AI should make a counter-offer based on score, personality, and relationship
 */
export function shouldMakeCounterOffer(
  finalScore: number,
  personality: string,
  relationship: number,
  trust: number
): boolean {
  // Don't counter if relationship is too hostile
  if (relationship < COUNTER_OFFER_THRESHOLDS.RELATIONSHIP_MIN) {
    return false;
  }

  // Don't counter if trust is very low
  if (trust < COUNTER_OFFER_THRESHOLDS.TRUST_MIN) {
    return false;
  }

  // Counter if score is in the range
  if (finalScore < ACCEPTANCE_THRESHOLDS.LIKELY &&
      finalScore > ACCEPTANCE_THRESHOLDS.UNLIKELY) {
    // Defensive AI more likely to counter
    if (personality === 'defensive') {
      return Math.random() < COUNTER_OFFER_THRESHOLDS.DEFENSIVE_PROBABILITY;
    }
    // Isolationist less likely
    if (personality === 'isolationist') {
      return Math.random() < COUNTER_OFFER_THRESHOLDS.ISOLATIONIST_PROBABILITY;
    }
    // Others moderate
    return Math.random() < COUNTER_OFFER_THRESHOLDS.DEFAULT_PROBABILITY;
  }

  return false;
}

/**
 * Get items that the AI desires from the player
 */
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

/**
 * Generate a counter-offer by modifying the current negotiation
 */
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
