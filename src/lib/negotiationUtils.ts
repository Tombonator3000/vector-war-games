/**
 * Negotiation Utilities
 *
 * Core utility functions for managing multi-item negotiations between nations.
 * Handles negotiation creation, item management, value calculations, validation,
 * and deal application.
 */

import type { GameState, Nation } from '@/types/game';
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
import {
  adjustRelationshipScore,
  createPromise,
  modifyFavors,
  updateTrustScore,
} from './trustAndFavorsUtils';
import { ensureTreatyRecord, adjustThreat } from './nationUtils';
import {
  createResourceTrade,
  initializeResourceStockpile,
} from './territorialResourcesSystem';
import type { StrategyResourceType } from '@/types/territorialResources';
import { resolveGrievance } from './grievancesAndClaimsUtils';

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
 * Handler function type for calculating item values.
 * Each handler is responsible for calculating the base value of a single item type.
 */
type ItemValueCalculator = (
  item: NegotiableItem,
  context: ItemValueContext,
  baseValue: number
) => number;

/**
 * Calculate the value of a single negotiable item
 * Value is from the perspective of the evaluator (the nation receiving the item)
 *
 * Refactored to use handler registry pattern for improved maintainability.
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

  // Lookup handler for this item type
  const calculator = VALUE_CALCULATOR_HANDLERS[item.type];

  // Calculate base value using handler or default to baseValue
  const value = calculator
    ? calculator(item, context, baseValue)
    : baseValue;

  // Apply context modifiers
  const modifiedValue = applyContextModifiers(value, item, context);

  return Math.max(0, Math.round(modifiedValue));
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

// ============================================================================
// Item Value Calculator Handlers
// ============================================================================

/** Calculate value for gold, intel, and production (amount-based resources) */
function calculateAmountBasedValue(
  item: NegotiableItem,
  _context: ItemValueContext,
  baseValue: number
): number {
  return baseValue * (item.amount || 0);
}

/** Calculate value for sanction lift */
function calculateSanctionLiftValue(
  _item: NegotiableItem,
  context: ItemValueContext,
  baseValue: number
): number {
  // More valuable if currently sanctioned
  return context.evaluatorNation.sanctioned ? baseValue * 2 : baseValue;
}

/** Calculate value for open borders */
function calculateOpenBordersValue(
  item: NegotiableItem,
  _context: ItemValueContext,
  baseValue: number
): number {
  return baseValue * (item.duration || 1);
}

/** Calculate value for resource sharing */
function calculateResourceShareValue(
  item: NegotiableItem,
  _context: ItemValueContext,
  _baseValue: number
): number {
  // Resource per turn times duration
  return (item.amount || 0) * (item.duration || 1) * 2;
}

/** Calculate value for trade agreements */
function calculateTradeAgreementValue(
  item: NegotiableItem,
  _context: ItemValueContext,
  baseValue: number
): number {
  return baseValue * (item.duration || 1);
}

// ============================================================================
// Item Value Calculator Registry
// ============================================================================

/**
 * Registry mapping item types to their value calculator handlers.
 * This pattern makes it easy to add new item types and keeps each calculator focused.
 */
const VALUE_CALCULATOR_HANDLERS: Partial<Record<NegotiableItemType, ItemValueCalculator>> = {
  'gold': calculateAmountBasedValue,
  'intel': calculateAmountBasedValue,
  'production': calculateAmountBasedValue,
  'alliance': (item, context) => calculateAllianceValue(item, context),
  'treaty': (item, context) => calculateTreatyValue(item, context),
  'promise': (item, context) => calculatePromiseValue(item, context),
  'favor-exchange': calculateAmountBasedValue,
  'sanction-lift': calculateSanctionLiftValue,
  'join-war': (item, context) => calculateJoinWarValue(item, context),
  'share-tech': (item, context) => calculateShareTechValue(item, context),
  'open-borders': calculateOpenBordersValue,
  'grievance-apology': (item, context) => calculateGrievanceApologyValue(item, context),
  'resource-share': calculateResourceShareValue,
  'military-support': (item, context) => calculateMilitarySupportValue(item, context),
  'trade-agreement': calculateTradeAgreementValue,
};

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
  currentTurn: number,
  gameState?: GameState
): {
  initiator: Nation;
  respondent: Nation;
  allNations: Nation[];
  gameState?: GameState;
  success: boolean;
} {
  let updatedInitiator = { ...initiator };
  let updatedRespondent = { ...respondent };
  let updatedGameState = gameState;

  // Apply items initiator offers (goes to respondent)
  for (const item of negotiation.offerItems) {
    const result = applyNegotiationItemEffects(
      item,
      updatedInitiator,
      updatedRespondent,
      {
        currentTurn,
        side: 'offer',
        gameState: updatedGameState,
        allNations,
      }
    );
    updatedInitiator = result.giver;
    updatedRespondent = result.receiver;
    updatedGameState = result.gameState ?? updatedGameState;
  }

  // Apply items initiator requests (goes to initiator)
  for (const item of negotiation.requestItems) {
    const result = applyNegotiationItemEffects(
      item,
      updatedRespondent,
      updatedInitiator,
      {
        currentTurn,
        side: 'request',
        gameState: updatedGameState,
        allNations,
      }
    );
    updatedRespondent = result.giver;
    updatedInitiator = result.receiver;
    updatedGameState = result.gameState ?? updatedGameState;
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
    gameState: updatedGameState,
    success: true,
  };
}

// ============================================================================
// Negotiation Item Effect Types & Helpers
// ============================================================================

interface ApplyNegotiationItemContext {
  currentTurn: number;
  side: 'offer' | 'request';
  gameState?: GameState;
  allNations: Nation[];
}

interface ApplyNegotiationItemResult {
  giver: Nation;
  receiver: Nation;
  gameState?: GameState;
}

/**
 * Handler function type for applying negotiation item effects.
 * Each handler is responsible for a single item type.
 */
type ItemEffectHandler = (
  item: NegotiableItem,
  giver: Nation,
  receiver: Nation,
  context: ApplyNegotiationItemContext
) => ApplyNegotiationItemResult;

function addAlliance(nation: Nation, allyId: string): Nation {
  const alliances = new Set([...(nation.alliances || []), allyId]);
  return { ...nation, alliances: Array.from(alliances) };
}

function addActiveTreaty(
  nation: Nation,
  withNationId: string,
  expiryTurn: number,
  type: 'truce' | 'peace'
): Nation {
  const activeTreaties = nation.activeTreaties || [];
  const filtered = activeTreaties.filter(t => t.withNationId !== withNationId || t.type !== type);
  return {
    ...nation,
    activeTreaties: [...filtered, { withNationId, expiryTurn, type }],
  };
}

function cloneConventionalTerritories(state?: GameState) {
  if (!state?.conventional) return state;
  const conventional = {
    ...state.conventional,
    territories: { ...state.conventional.territories },
  };
  return { ...state, conventional };
}

function cloneResourceTrades(state?: GameState) {
  if (!state) return state;
  return {
    ...state,
    resourceTrades: [...(state.resourceTrades || [])],
  };
}

// ============================================================================
// Individual Item Effect Handlers
// ============================================================================

/** Transfers gold (production) from giver to receiver */
function handleGoldTransfer(
  item: NegotiableItem,
  giver: Nation,
  receiver: Nation
): ApplyNegotiationItemResult {
  const amount = item.amount || 0;
  return {
    giver: { ...giver, production: (giver.production || 0) - amount },
    receiver: { ...receiver, production: (receiver.production || 0) + amount },
  };
}

/** Transfers intel from giver to receiver */
function handleIntelTransfer(
  item: NegotiableItem,
  giver: Nation,
  receiver: Nation
): ApplyNegotiationItemResult {
  const amount = item.amount || 0;
  return {
    giver: { ...giver, intel: (giver.intel || 0) - amount },
    receiver: { ...receiver, intel: (receiver.intel || 0) + amount },
  };
}

/** Transfers production capacity from giver to receiver */
function handleProductionTransfer(
  item: NegotiableItem,
  giver: Nation,
  receiver: Nation
): ApplyNegotiationItemResult {
  const amount = item.amount || 0;
  return {
    giver: { ...giver, production: (giver.production || 0) - amount },
    receiver: { ...receiver, production: (receiver.production || 0) + amount },
  };
}

/** Forms an alliance between both nations */
function handleAllianceFormation(
  _item: NegotiableItem,
  giver: Nation,
  receiver: Nation,
  context: ApplyNegotiationItemContext
): ApplyNegotiationItemResult {
  let updatedGiver = addAlliance(giver, receiver.id);
  let updatedReceiver = addAlliance(receiver, giver.id);

  updatedGiver = adjustRelationshipScore(
    updatedGiver,
    receiver.id,
    10,
    'Alliance formed via negotiation',
    context.currentTurn
  );
  updatedReceiver = adjustRelationshipScore(
    updatedReceiver,
    giver.id,
    10,
    'Alliance formed via negotiation',
    context.currentTurn
  );

  return { giver: updatedGiver, receiver: updatedReceiver };
}

/** Establishes a treaty between nations (truce, peace, mutual-defense, etc.) */
function handleTreatyEstablishment(
  item: NegotiableItem,
  giver: Nation,
  receiver: Nation,
  context: ApplyNegotiationItemContext
): ApplyNegotiationItemResult {
  let updatedGiver = { ...giver };
  let updatedReceiver = { ...receiver };
  let updatedGameState = context.gameState;

  const treatyType = (item.subtype || 'truce').toLowerCase();
  const duration = item.duration || 10;
  const expiryTurn = context.currentTurn + duration;

  const giverTreaty = ensureTreatyRecord(updatedGiver, updatedReceiver);
  const receiverTreaty = ensureTreatyRecord(updatedReceiver, updatedGiver);

  // Handle truce-type treaties
  if (['truce', 'non-aggression', 'ceasefire', 'peace'].includes(treatyType)) {
    giverTreaty.truceTurns = Math.max(giverTreaty.truceTurns || 0, duration);
    receiverTreaty.truceTurns = Math.max(receiverTreaty.truceTurns || 0, duration);

    const treatyKind = treatyType === 'peace' ? 'peace' : 'truce';
    updatedGiver = addActiveTreaty(updatedGiver, receiver.id, expiryTurn, treatyKind);
    updatedReceiver = addActiveTreaty(updatedReceiver, giver.id, expiryTurn, treatyKind);

    updatedGiver = updateTrustScore(
      updatedGiver,
      receiver.id,
      4,
      `Treaty signed: ${treatyType}`,
      context.currentTurn
    );
    updatedReceiver = updateTrustScore(
      updatedReceiver,
      giver.id,
      4,
      `Treaty signed: ${treatyType}`,
      context.currentTurn
    );
  }

  // Handle mutual-defense treaties (form alliance)
  if (treatyType === 'mutual-defense') {
    giverTreaty.alliance = true;
    receiverTreaty.alliance = true;
    updatedGiver = addAlliance(updatedGiver, receiver.id);
    updatedReceiver = addAlliance(updatedReceiver, giver.id);
  }

  // Handle territory transfer if specified
  const territoryId =
    (item.metadata && (item.metadata.territoryId || item.metadata.territoryTransfer)) || undefined;
  if (territoryId && updatedGameState?.conventional?.territories?.[territoryId]) {
    updatedGameState = cloneConventionalTerritories(updatedGameState);
    const territories = updatedGameState!.conventional!.territories;
    const territory = { ...territories[territoryId] };
    territory.controllingNationId = receiver.id;
    territory.contestedBy = territory.contestedBy?.filter(id => id !== receiver.id) || [];
    territories[territoryId] = territory;

    if (updatedGiver.controlledTerritories) {
      updatedGiver = {
        ...updatedGiver,
        controlledTerritories: updatedGiver.controlledTerritories.filter(t => t !== territoryId),
      };
    }
    const receiverTerritories = new Set([...(updatedReceiver.controlledTerritories || []), territoryId]);
    updatedReceiver = {
      ...updatedReceiver,
      controlledTerritories: Array.from(receiverTerritories),
    };
  }

  return { giver: updatedGiver, receiver: updatedReceiver, gameState: updatedGameState };
}

/** Maps promise subtypes to internal promise types */
function mapPromiseSubtype(subtype?: string): 'no-attack' | 'help-if-attacked' | 'no-ally-with' | 'support-council' | 'neutral-mediator' {
  switch (subtype) {
    case 'not-attack':
      return 'no-attack';
    case 'support-war':
      return 'help-if-attacked';
    case 'not-compete':
      return 'no-ally-with';
    case 'share-intel':
      return 'support-council';
    default:
      return 'neutral-mediator';
  }
}

/** Creates a promise from giver to receiver */
function handlePromiseCreation(
  item: NegotiableItem,
  giver: Nation,
  receiver: Nation,
  context: ApplyNegotiationItemContext
): ApplyNegotiationItemResult {
  const mappedType = mapPromiseSubtype(item.subtype);
  const terms = {
    duration: item.duration || 10,
    targetNationId: item.metadata?.targetNationId,
    trustReward: 6,
    relationshipPenalty: 10,
  };

  const updatedGiver = createPromise(giver, receiver.id, mappedType, terms, context.currentTurn);
  return { giver: updatedGiver, receiver };
}

/** Exchanges favors between nations */
function handleFavorExchange(
  item: NegotiableItem,
  giver: Nation,
  receiver: Nation,
  context: ApplyNegotiationItemContext
): ApplyNegotiationItemResult {
  const amount = item.amount || 0;
  if (amount === 0) {
    return { giver, receiver };
  }

  const updatedGiver = modifyFavors(
    giver,
    receiver.id,
    -amount,
    'Favor exchange via negotiation',
    context.currentTurn
  );
  const updatedReceiver = modifyFavors(
    receiver,
    giver.id,
    amount,
    'Favor exchange via negotiation',
    context.currentTurn
  );

  return { giver: updatedGiver, receiver: updatedReceiver };
}

/** Lifts sanctions from the giver against the receiver */
function handleSanctionLift(
  _item: NegotiableItem,
  giver: Nation,
  receiver: Nation
): ApplyNegotiationItemResult {
  if (!receiver.sanctionedBy?.[giver.id]) {
    return { giver, receiver };
  }

  const sanctionedBy = { ...receiver.sanctionedBy };
  delete sanctionedBy[giver.id];
  const updatedReceiver = {
    ...receiver,
    sanctionedBy,
    sanctioned: Object.keys(sanctionedBy).length > 0,
  };

  return { giver, receiver: updatedReceiver };
}

/** Joins a war against a target nation */
function handleJoinWar(
  item: NegotiableItem,
  giver: Nation,
  receiver: Nation
): ApplyNegotiationItemResult {
  if (!item.targetId) {
    return { giver, receiver };
  }

  const threatIncrease = item.amount ?? 20;
  const giverThreats = { ...(giver.threats || {}) };
  const receiverThreats = { ...(receiver.threats || {}) };

  giverThreats[item.targetId] = Math.max((giverThreats[item.targetId] || 0) + threatIncrease / 2, 10);
  receiverThreats[item.targetId] = Math.max((receiverThreats[item.targetId] || 0) + threatIncrease, 20);

  const updatedGiver = { ...giver, threats: giverThreats };
  const updatedReceiver = { ...receiver, threats: receiverThreats };

  adjustThreat(updatedReceiver, item.targetId, 15);

  return { giver: updatedGiver, receiver: updatedReceiver };
}

/** Shares technology from giver to receiver */
function handleTechSharing(
  item: NegotiableItem,
  giver: Nation,
  receiver: Nation,
  context: ApplyNegotiationItemContext
): ApplyNegotiationItemResult {
  if (!item.techId) {
    return { giver, receiver };
  }

  const giverTech = { ...(giver.researched || {}) };
  const receiverTech = { ...(receiver.researched || {}) };
  receiverTech[item.techId] = true;

  let updatedReceiver: Nation = {
    ...receiver,
    researched: receiverTech,
    researchQueue:
      receiver.researchQueue?.projectId === item.techId
        ? null
        : receiver.researchQueue,
  };
  const updatedGiver = { ...giver, researched: giverTech };

  updatedReceiver = updateTrustScore(
    updatedReceiver,
    giver.id,
    5,
    `Technology shared: ${item.techId}`,
    context.currentTurn
  );

  return { giver: updatedGiver, receiver: updatedReceiver };
}

/** Establishes open borders between nations */
function handleOpenBorders(
  item: NegotiableItem,
  giver: Nation,
  receiver: Nation,
  context: ApplyNegotiationItemContext
): ApplyNegotiationItemResult {
  const duration: number = typeof item.duration === 'number' ? item.duration : 10;

  let updatedGiver = { ...giver };
  let updatedReceiver = { ...receiver };

  const giverTreaty = ensureTreatyRecord(updatedGiver, updatedReceiver);
  const receiverTreaty = ensureTreatyRecord(updatedReceiver, updatedGiver);
  giverTreaty.openBordersTurns = Math.max(giverTreaty.openBordersTurns || 0, duration);
  receiverTreaty.openBordersTurns = Math.max(receiverTreaty.openBordersTurns || 0, duration);

  updatedGiver = { ...updatedGiver, bordersClosedTurns: 0 };
  updatedReceiver = { ...updatedReceiver, bordersClosedTurns: 0 };

  updatedGiver = updateTrustScore(
    updatedGiver,
    receiver.id,
    3,
    'Open borders agreement',
    context.currentTurn
  );
  updatedReceiver = updateTrustScore(
    updatedReceiver,
    giver.id,
    3,
    'Open borders agreement',
    context.currentTurn
  );

  return { giver: updatedGiver, receiver: updatedReceiver };
}

/** Resolves a grievance through apology */
function handleGrievanceApology(
  item: NegotiableItem,
  giver: Nation,
  receiver: Nation,
  context: ApplyNegotiationItemContext
): ApplyNegotiationItemResult {
  const grievanceId = item.grievanceId || item.metadata?.grievanceId;
  if (!grievanceId) {
    return { giver, receiver };
  }

  const updatedReceiver = resolveGrievance(receiver, grievanceId, context.currentTurn);
  return { giver, receiver: updatedReceiver };
}

/** Establishes a resource sharing agreement */
function handleResourceShare(
  item: NegotiableItem,
  giver: Nation,
  receiver: Nation,
  context: ApplyNegotiationItemContext
): ApplyNegotiationItemResult {
  const amountPerTurn = item.amount || 0;
  const duration = item.duration || 10;
  let updatedReceiver = { ...receiver };
  let updatedGameState = context.gameState;

  if (amountPerTurn <= 0) {
    return { giver, receiver, gameState: updatedGameState };
  }

  const resource = (item.metadata?.resource || item.metadata?.resourceType || 'oil') as StrategyResourceType;

  if (updatedGameState) {
    const nextState = cloneResourceTrades(updatedGameState);
    initializeResourceStockpile(giver);
    initializeResourceStockpile(updatedReceiver);
    const trade = createResourceTrade(
      giver.id,
      receiver.id,
      resource,
      amountPerTurn,
      duration,
      context.currentTurn,
      item.metadata?.pricePerTurn
    );
    nextState.resourceTrades = [...(nextState.resourceTrades || []), trade];
    updatedGameState = nextState;
  } else {
    initializeResourceStockpile(updatedReceiver);
    if (updatedReceiver.resourceStockpile) {
      updatedReceiver.resourceStockpile[resource] =
        (updatedReceiver.resourceStockpile[resource] || 0) + amountPerTurn;
    }
  }

  return { giver, receiver: updatedReceiver, gameState: updatedGameState };
}

/** Provides military support to receiver */
function handleMilitarySupport(
  item: NegotiableItem,
  giver: Nation,
  receiver: Nation
): ApplyNegotiationItemResult {
  const duration: number = typeof item.duration === 'number' ? item.duration : 5;

  const treaty = ensureTreatyRecord(receiver, giver);
  treaty.militarySupportTurns = Math.max(treaty.militarySupportTurns || 0, duration);

  const updatedReceiver = {
    ...receiver,
    defense: Math.max(0, (receiver.defense || 0) + 5),
  };
  const updatedGiver = {
    ...giver,
    production: Math.max(0, (giver.production || 0) - Math.floor(duration / 2)),
  };

  return { giver: updatedGiver, receiver: updatedReceiver };
}

/** Establishes a trade agreement with exports and imports */
function handleTradeAgreement(
  item: NegotiableItem,
  giver: Nation,
  receiver: Nation,
  context: ApplyNegotiationItemContext
): ApplyNegotiationItemResult {
  let updatedGiver = { ...giver };
  let updatedReceiver = { ...receiver };
  let updatedGameState = context.gameState;

  const duration = item.duration || 10;
  const exports = item.metadata?.exports as
    | { resource: StrategyResourceType; amount: number; pricePerTurn?: number }
    | undefined;
  const imports = item.metadata?.imports as
    | { resource: StrategyResourceType; amount: number; pricePerTurn?: number }
    | undefined;

  let nextState = updatedGameState ? cloneResourceTrades(updatedGameState) : undefined;

  // Handle exports (giver -> receiver)
  if (exports && exports.amount > 0 && nextState) {
    initializeResourceStockpile(updatedGiver);
    initializeResourceStockpile(updatedReceiver);
    nextState.resourceTrades!.push(
      createResourceTrade(
        giver.id,
        receiver.id,
        exports.resource,
        exports.amount,
        duration,
        context.currentTurn,
        exports.pricePerTurn
      )
    );
  }

  // Handle imports (receiver -> giver)
  if (imports && imports.amount > 0 && nextState) {
    initializeResourceStockpile(updatedGiver);
    initializeResourceStockpile(updatedReceiver);
    nextState.resourceTrades!.push(
      createResourceTrade(
        receiver.id,
        giver.id,
        imports.resource,
        imports.amount,
        duration,
        context.currentTurn,
        imports.pricePerTurn
      )
    );
  }

  // Ensure state is cloned if we have trades but no state yet
  if (!nextState && (exports || imports)) {
    nextState = cloneResourceTrades(updatedGameState);
  }

  // Fallback: production boost if no specific exports/imports
  if (!exports && !imports && item.amount) {
    const productionBoost = item.amount;
    updatedReceiver.production = (updatedReceiver.production || 0) + productionBoost;
    updatedGiver.production = Math.max(0, (updatedGiver.production || 0) - Math.floor(productionBoost / 2));
  }

  updatedGameState = nextState ?? updatedGameState;

  return { giver: updatedGiver, receiver: updatedReceiver, gameState: updatedGameState };
}

// ============================================================================
// Item Effect Handler Registry
// ============================================================================

/**
 * Registry mapping item types to their effect handlers.
 * This pattern makes it easy to add new item types and keeps each handler focused.
 */
const ITEM_EFFECT_HANDLERS: Partial<Record<NegotiableItemType, ItemEffectHandler>> = {
  'gold': handleGoldTransfer,
  'intel': handleIntelTransfer,
  'production': handleProductionTransfer,
  'alliance': handleAllianceFormation,
  'treaty': handleTreatyEstablishment,
  'promise': handlePromiseCreation,
  'favor-exchange': handleFavorExchange,
  'sanction-lift': handleSanctionLift,
  'join-war': handleJoinWar,
  'share-tech': handleTechSharing,
  'open-borders': handleOpenBorders,
  'grievance-apology': handleGrievanceApology,
  'resource-share': handleResourceShare,
  'military-support': handleMilitarySupport,
  'trade-agreement': handleTradeAgreement,
};

// ============================================================================
// Main Effect Application Function
// ============================================================================

/**
 * Apply a single negotiation item and return the updated nations and optional game state changes.
 * Uses a registry-based dispatch pattern for clarity and extensibility.
 */
function applyNegotiationItemEffects(
  item: NegotiableItem,
  giver: Nation,
  receiver: Nation,
  context: ApplyNegotiationItemContext
): ApplyNegotiationItemResult {
  const handler = ITEM_EFFECT_HANDLERS[item.type];

  if (handler) {
    return handler(item, giver, receiver, context);
  }

  // Default: return unchanged if no handler found
  return { giver: { ...giver }, receiver: { ...receiver }, gameState: context.gameState };
}
