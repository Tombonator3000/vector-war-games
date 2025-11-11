/**
 * Negotiation Utilities
 *
 * Core utility functions for managing multi-item negotiations between nations.
 * Handles negotiation creation, item management, value calculations, validation,
 * and deal application.
 */

import type { Nation } from '@/types/game';
import type {
  NegotiationState,
  NegotiableItem,
  NegotiableItemType,
  NegotiationStatus,
  NegotiationRound,
  ValidationResult,
  ValidationError,
  ItemValueContext,
} from '@/types/negotiation';
import { generateId } from './idGenerator';
import { getRelationship } from './relationshipUtils';
import { getTrust } from '@/types/trustAndFavors';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_MAX_ROUNDS = 5;
const DEFAULT_EXPIRATION_TURNS = 10;

/**
 * Base values for different item types
 * These are scaled based on context, relationship, and other factors
 */
const BASE_ITEM_VALUES: Record<NegotiableItemType, number> = {
  'gold': 1,                      // 1:1 value
  'intel': 3,                     // Intel is 3x more valuable than gold
  'production': 2,                // Production is 2x more valuable than gold
  'alliance': 1000,               // High base value, heavily modified by relationship
  'treaty': 500,                  // Base treaty value
  'promise': 300,                 // Base promise value
  'favor-exchange': 10,           // Per favor point
  'sanction-lift': 300,           // Fixed value
  'join-war': 1000,               // Highly variable based on target
  'share-tech': 500,              // Variable based on tech
  'open-borders': 200,            // Fixed value per turn
  'grievance-apology': 400,       // Variable based on grievance severity
  'resource-share': 150,          // Per turn
  'military-support': 800,        // High value
  'trade-agreement': 250,         // Per turn
};

// ============================================================================
// Negotiation Creation & Management
// ============================================================================

/**
 * Create a new negotiation between two nations
 */
export function createNegotiation(
  initiatorId: string,
  respondentId: string,
  currentTurn: number,
  purpose?: string
): NegotiationState {
  return {
    id: `negotiation-${generateId()}`,
    initiatorId,
    respondentId,
    offerItems: [],
    requestItems: [],
    currentRound: 1,
    maxRounds: DEFAULT_MAX_ROUNDS,
    status: 'active' as NegotiationStatus,
    history: [],
    createdTurn: currentTurn,
    expiresAtTurn: currentTurn + DEFAULT_EXPIRATION_TURNS,
    purpose: purpose as any,
  };
}

/**
 * Add an item to the offer side of a negotiation
 */
export function addItemToOffer(
  negotiation: NegotiationState,
  item: NegotiableItem
): NegotiationState {
  return {
    ...negotiation,
    offerItems: [...negotiation.offerItems, item],
  };
}

/**
 * Add an item to the request side of a negotiation
 */
export function addItemToRequest(
  negotiation: NegotiationState,
  item: NegotiableItem
): NegotiationState {
  return {
    ...negotiation,
    requestItems: [...negotiation.requestItems, item],
  };
}

/**
 * Remove an item from either side of a negotiation
 */
export function removeItem(
  negotiation: NegotiationState,
  itemIndex: number,
  side: 'offer' | 'request'
): NegotiationState {
  if (side === 'offer') {
    const newOfferItems = [...negotiation.offerItems];
    newOfferItems.splice(itemIndex, 1);
    return {
      ...negotiation,
      offerItems: newOfferItems,
    };
  } else {
    const newRequestItems = [...negotiation.requestItems];
    newRequestItems.splice(itemIndex, 1);
    return {
      ...negotiation,
      requestItems: newRequestItems,
    };
  }
}

/**
 * Clear all items from a negotiation
 */
export function clearNegotiation(negotiation: NegotiationState): NegotiationState {
  return {
    ...negotiation,
    offerItems: [],
    requestItems: [],
  };
}

/**
 * Add a round to negotiation history
 */
export function addNegotiationRound(
  negotiation: NegotiationState,
  round: NegotiationRound
): NegotiationState {
  return {
    ...negotiation,
    history: [...negotiation.history, round],
    currentRound: negotiation.currentRound + 1,
  };
}

// ============================================================================
// Item Value Calculation
// ============================================================================

/**
 * Calculate the value of a single negotiable item
 * Value is from the perspective of the evaluator (the nation receiving the item)
 *
 * @param item - The item to evaluate
 * @param context - Context for evaluation (nations, game state, etc.)
 * @returns Numeric value representing worth to evaluator
 */
export function calculateItemValue(
  item: NegotiableItem,
  context: ItemValueContext
): number {
  const baseValue = BASE_ITEM_VALUES[item.type] || 0;
  let value = baseValue;

  // Apply item-specific calculations
  switch (item.type) {
    case 'gold':
    case 'intel':
    case 'production':
      value = baseValue * (item.amount || 0);
      break;

    case 'alliance':
      value = calculateAllianceValue(item, context);
      break;

    case 'treaty':
      value = calculateTreatyValue(item, context);
      break;

    case 'promise':
      value = calculatePromiseValue(item, context);
      break;

    case 'favor-exchange':
      value = baseValue * (item.amount || 0);
      break;

    case 'sanction-lift':
      // More valuable if currently sanctioned
      if (context.evaluatorNation.sanctioned) {
        value = baseValue * 2;
      }
      break;

    case 'join-war':
      value = calculateJoinWarValue(item, context);
      break;

    case 'share-tech':
      value = calculateShareTechValue(item, context);
      break;

    case 'open-borders':
      value = baseValue * (item.duration || 1);
      break;

    case 'grievance-apology':
      value = calculateGrievanceApologyValue(item, context);
      break;

    case 'resource-share':
      value = (item.amount || 0) * (item.duration || 1) * 2; // Resource per turn times duration
      break;

    case 'military-support':
      value = calculateMilitarySupportValue(item, context);
      break;

    case 'trade-agreement':
      value = baseValue * (item.duration || 1);
      break;

    default:
      value = baseValue;
  }

  // Apply context modifiers
  value = applyContextModifiers(value, item, context);

  return Math.max(0, Math.round(value));
}

/**
 * Calculate value of an alliance offer
 */
function calculateAllianceValue(
  item: NegotiableItem,
  context: ItemValueContext
): number {
  let value = BASE_ITEM_VALUES.alliance;

  const relationship = context.relationship;
  const trust = context.trust;

  // Alliance more valuable with good relationship
  if (relationship > 50) {
    value *= 1.3;
  } else if (relationship > 0) {
    value *= 1.1;
  } else if (relationship < -25) {
    value *= 0.6; // Less valuable if hostile
  }

  // Trust increases value
  if (trust > 70) {
    value *= 1.2;
  } else if (trust < 30) {
    value *= 0.7;
  }

  // Defensive nations value alliances more
  if (context.evaluatorNation.aiPersonality === 'defensive') {
    value *= 1.3;
  }

  // If under threat, alliance much more valuable
  const threatLevel = Object.values(context.threats || {}).reduce((sum, t) => sum + t, 0);
  if (threatLevel > 20) {
    value *= 1.5;
  } else if (threatLevel > 10) {
    value *= 1.2;
  }

  return value;
}

/**
 * Calculate value of a treaty
 */
function calculateTreatyValue(
  item: NegotiableItem,
  context: ItemValueContext
): number {
  const baseValue = BASE_ITEM_VALUES.treaty;
  const duration = item.duration || 10;
  const subtype = item.subtype || 'non-aggression';

  let value = baseValue;

  // Different treaty types have different values
  switch (subtype) {
    case 'truce':
      value = 300;
      break;
    case 'non-aggression':
      value = 500;
      break;
    case 'mutual-defense':
      value = 800;
      break;
    case 'research-agreement':
      value = 600;
      break;
    default:
      value = 400;
  }

  // Scale by duration
  value *= Math.min(duration / 10, 2); // Cap at 2x for long durations

  // More valuable during conflict
  if (context.relationship < -30) {
    value *= 1.3;
  }

  return value;
}

/**
 * Calculate value of a promise
 */
function calculatePromiseValue(
  item: NegotiableItem,
  context: ItemValueContext
): number {
  const baseValue = BASE_ITEM_VALUES.promise;
  const subtype = item.subtype || 'no-attack';
  const duration = item.duration || 10;

  let value = baseValue;

  // Different promise types
  switch (subtype) {
    case 'no-attack':
      value = 300;
      break;
    case 'help-if-attacked':
      value = 500;
      break;
    case 'no-ally-with':
      value = 400;
      break;
    case 'no-nukes':
      value = 600;
      break;
    default:
      value = 300;
  }

  value *= Math.min(duration / 10, 1.5);

  // Promises less valuable if trust is low
  if (context.trust < 40) {
    value *= 0.6;
  }

  return value;
}

/**
 * Calculate value of joining a war
 */
function calculateJoinWarValue(
  item: NegotiableItem,
  context: ItemValueContext
): number {
  if (!item.targetId) return 0;

  const target = context.allNations.find(n => n.id === item.targetId);
  if (!target) return 0;

  const evaluator = context.evaluatorNation;

  // Base value depends on target strength
  const targetMilitary = (target.missiles || 0) + (target.bombers || 0) * 5;
  const evaluatorMilitary = (evaluator.missiles || 0) + (evaluator.bombers || 0) * 5;

  let value = BASE_ITEM_VALUES['join-war'];

  // If target is stronger, requesting help is more valuable (to requester)
  // But evaluator values it less (it's risky for them)
  const militaryRatio = targetMilitary / Math.max(evaluatorMilitary, 1);
  if (militaryRatio > 1.5) {
    value *= 0.6; // Risky for evaluator
  } else if (militaryRatio < 0.5) {
    value *= 1.2; // Easy target
  }

  // Check relationship with target
  const relationshipWithTarget = getRelationship(evaluator, item.targetId);
  if (relationshipWithTarget > 25) {
    value *= 0.3; // Very reluctant to attack ally
  } else if (relationshipWithTarget < -25) {
    value *= 1.4; // Happy to attack enemy
  }

  return value;
}

/**
 * Calculate value of sharing technology
 */
function calculateShareTechValue(
  item: NegotiableItem,
  context: ItemValueContext
): number {
  // Simplified - in real game, would check specific tech
  const baseValue = BASE_ITEM_VALUES['share-tech'];

  // Advanced techs more valuable
  if (item.techId?.includes('advanced') || item.techId?.includes('super')) {
    return baseValue * 2;
  }

  return baseValue;
}

/**
 * Calculate value of apologizing for a grievance
 */
function calculateGrievanceApologyValue(
  item: NegotiableItem,
  context: ItemValueContext
): number {
  if (!item.grievanceId) return 0;

  const grievance = context.evaluatorNation.grievances?.find(
    g => g.id === item.grievanceId
  );

  if (!grievance) return 0;

  const baseValue = BASE_ITEM_VALUES['grievance-apology'];

  // Scale by grievance severity
  switch (grievance.severity) {
    case 'minor':
      return baseValue * 0.5;
    case 'moderate':
      return baseValue;
    case 'major':
      return baseValue * 1.5;
    case 'severe':
      return baseValue * 2;
    default:
      return baseValue;
  }
}

/**
 * Calculate value of military support
 */
function calculateMilitarySupportValue(
  item: NegotiableItem,
  context: ItemValueContext
): number {
  const baseValue = BASE_ITEM_VALUES['military-support'];

  // More valuable if under threat
  const threatLevel = Object.values(context.threats || {}).reduce((sum, t) => sum + t, 0);
  if (threatLevel > 15) {
    return baseValue * 1.5;
  } else if (threatLevel > 8) {
    return baseValue * 1.2;
  }

  return baseValue;
}

/**
 * Apply context-dependent modifiers to item value
 */
function applyContextModifiers(
  value: number,
  item: NegotiableItem,
  context: ItemValueContext
): number {
  let modified = value;

  // Relationship scaling
  // Better relationships make all items more valuable (trust factor)
  const relationshipMultiplier = 1 + (context.relationship / 200);
  modified *= relationshipMultiplier;

  // Resource scarcity modifiers
  if (item.type === 'gold' && context.evaluatorNation.production < 50) {
    modified *= 1.3; // More valuable when low on resources
  }

  if (item.type === 'intel' && (context.evaluatorNation.intel || 0) < 20) {
    modified *= 1.4;
  }

  // Personality modifiers
  if (context.evaluatorNation.aiPersonality === 'aggressive' &&
      (item.type === 'alliance' || item.type === 'treaty')) {
    modified *= 0.8; // Aggressive AI values diplomacy less
  }

  if (context.evaluatorNation.aiPersonality === 'defensive' &&
      (item.type === 'alliance' || item.type === 'treaty')) {
    modified *= 1.3; // Defensive AI values diplomacy more
  }

  return modified;
}

/**
 * Calculate total value of a list of items
 */
export function calculateTotalValue(
  items: NegotiableItem[],
  context: ItemValueContext
): number {
  return items.reduce((total, item) => {
    return total + calculateItemValue(item, context);
  }, 0);
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate that a negotiation is legal and both parties can fulfill it
 */
export function validateNegotiation(
  negotiation: NegotiationState,
  initiator: Nation,
  respondent: Nation
): ValidationResult {
  const errors: ValidationError[] = [];

  // Check that negotiation has items
  if (negotiation.offerItems.length === 0 && negotiation.requestItems.length === 0) {
    errors.push({
      field: 'items',
      message: 'Negotiation must have at least one item offered or requested',
      severity: 'error',
    });
  }

  // Validate initiator can afford offered items
  const initiatorCanAfford = canAffordItems(initiator, negotiation.offerItems);
  if (!initiatorCanAfford.valid) {
    errors.push({
      field: 'offerItems',
      message: `Initiator cannot afford: ${initiatorCanAfford.reason}`,
      severity: 'error',
    });
  }

  // Validate respondent can afford requested items
  const respondentCanAfford = canAffordItems(respondent, negotiation.requestItems);
  if (!respondentCanAfford.valid) {
    errors.push({
      field: 'requestItems',
      message: `Respondent cannot afford: ${respondentCanAfford.reason}`,
      severity: 'error',
    });
  }

  // Check for invalid item combinations
  const hasMultipleAlliances = negotiation.offerItems.filter(i => i.type === 'alliance').length +
                                negotiation.requestItems.filter(i => i.type === 'alliance').length;
  if (hasMultipleAlliances > 1) {
    errors.push({
      field: 'items',
      message: 'Cannot have multiple alliances in one deal',
      severity: 'warning',
    });
  }

  return {
    valid: errors.filter(e => e.severity === 'error').length === 0,
    errors: errors.length > 0 ? errors : undefined,
    reason: errors.length > 0 ? errors[0].message : undefined,
  };
}

/**
 * Check if a nation can afford a list of items
 */
export function canAffordItems(
  nation: Nation,
  items: NegotiableItem[]
): ValidationResult {
  for (const item of items) {
    switch (item.type) {
      case 'gold':
        if ((nation.production || 0) < (item.amount || 0)) {
          return {
            valid: false,
            reason: `Not enough gold (need ${item.amount}, have ${nation.production})`,
          };
        }
        break;

      case 'intel':
        if ((nation.intel || 0) < (item.amount || 0)) {
          return {
            valid: false,
            reason: `Not enough intel (need ${item.amount}, have ${nation.intel})`,
          };
        }
        break;

      case 'production':
        if ((nation.production || 0) < (item.amount || 0)) {
          return {
            valid: false,
            reason: `Not enough production (need ${item.amount}, have ${nation.production})`,
          };
        }
        break;

      case 'share-tech':
        if (item.techId && !nation.researched?.[item.techId]) {
          return {
            valid: false,
            reason: `Technology ${item.techId} not researched`,
          };
        }
        break;

      // Other items don't have affordability constraints
    }
  }

  return { valid: true };
}

// ============================================================================
// Deal Application
// ============================================================================

/**
 * Apply a negotiation deal to both nations
 * This executes all the terms of the agreement
 */
export function applyNegotiationDeal(
  negotiation: NegotiationState,
  initiator: Nation,
  respondent: Nation,
  allNations: Nation[],
  currentTurn: number
): { initiator: Nation; respondent: Nation; allNations: Nation[] } {
  let updatedInitiator = { ...initiator };
  let updatedRespondent = { ...respondent };

  // Apply items initiator offers (goes to respondent)
  for (const item of negotiation.offerItems) {
    const result = applyItem(item, updatedInitiator, updatedRespondent, currentTurn, 'offer');
    updatedInitiator = result.giver;
    updatedRespondent = result.receiver;
  }

  // Apply items initiator requests (goes to initiator)
  for (const item of negotiation.requestItems) {
    const result = applyItem(item, updatedRespondent, updatedInitiator, currentTurn, 'request');
    updatedRespondent = result.giver;
    updatedInitiator = result.receiver;
  }

  // Update nations in the array
  const updatedNations = allNations.map(n => {
    if (n.id === initiator.id) return updatedInitiator;
    if (n.id === respondent.id) return updatedRespondent;
    return n;
  });

  return {
    initiator: updatedInitiator,
    respondent: updatedRespondent,
    allNations: updatedNations,
  };
}

/**
 * Apply a single item transfer
 */
function applyItem(
  item: NegotiableItem,
  giver: Nation,
  receiver: Nation,
  currentTurn: number,
  side: 'offer' | 'request'
): { giver: Nation; receiver: Nation } {
  let updatedGiver = { ...giver };
  let updatedReceiver = { ...receiver };

  switch (item.type) {
    case 'gold':
      updatedGiver.production = (updatedGiver.production || 0) - (item.amount || 0);
      updatedReceiver.production = (updatedReceiver.production || 0) + (item.amount || 0);
      break;

    case 'intel':
      updatedGiver.intel = (updatedGiver.intel || 0) - (item.amount || 0);
      updatedReceiver.intel = (updatedReceiver.intel || 0) + (item.amount || 0);
      break;

    case 'production':
      updatedGiver.production = (updatedGiver.production || 0) - (item.amount || 0);
      updatedReceiver.production = (updatedReceiver.production || 0) + (item.amount || 0);
      break;

    case 'alliance':
      // Create alliance - this would integrate with existing alliance system
      updatedGiver.alliances = [...(updatedGiver.alliances || []), receiver.id];
      updatedReceiver.alliances = [...(updatedReceiver.alliances || []), giver.id];
      break;

    case 'sanction-lift':
      if (updatedReceiver.sanctionedBy?.[giver.id]) {
        const sanctionedBy = { ...updatedReceiver.sanctionedBy };
        delete sanctionedBy[giver.id];
        updatedReceiver.sanctionedBy = sanctionedBy;
        updatedReceiver.sanctioned = Object.keys(sanctionedBy).length > 0;
      }
      break;

    // Other item types would be handled here
    // For now, we'll leave them as TODO since they require deeper integration
  }

  return { giver: updatedGiver, receiver: updatedReceiver };
}
