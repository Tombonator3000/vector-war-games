/**
 * Evaluation Modifiers Module
 *
 * Pure functions for calculating negotiation evaluation modifiers.
 * Extracted from aiNegotiationEvaluator.ts for improved testability and maintainability.
 */

import type { Nation } from '@/types/game';
import type { NegotiationState, ItemValueContext } from '@/types/negotiation';
import { getRelationship } from './relationshipUtils';

// ============================================================================
// Constants
// ============================================================================

/**
 * AI personality modifiers for negotiation
 */
export const PERSONALITY_MODIFIERS = {
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
} as const;

export const MODIFIER_WEIGHTS = {
  RELATIONSHIP_MULT: 0.5,
  TRUST_BASE: 50,
  TRUST_MULT: 0.6,
  FAVOR_MULT: 0.5,
  PERSONALITY_MULT: 100,
  STRATEGIC_THREAT_HIGH: 15,
  STRATEGIC_THREAT_MID: 8,
  STRATEGIC_ALLIANCE_HIGH: 50,
  STRATEGIC_ALLIANCE_MID: 25,
  STRATEGIC_JOIN_WAR: 30,
  GRIEVANCE_MINOR: 5,
  GRIEVANCE_MODERATE: 10,
  GRIEVANCE_MAJOR: 20,
  GRIEVANCE_SEVERE: 30,
} as const;

// ============================================================================
// Modifier Calculation Functions
// ============================================================================

/**
 * Calculate relationship modifier (-50 to +50 based on relationship -100 to +100)
 */
export function calculateRelationshipModifier(relationship: number): number {
  return relationship * MODIFIER_WEIGHTS.RELATIONSHIP_MULT;
}

/**
 * Calculate trust modifier (-30 to +30 based on trust 0 to 100)
 */
export function calculateTrustModifier(trust: number): number {
  return (trust - MODIFIER_WEIGHTS.TRUST_BASE) * MODIFIER_WEIGHTS.TRUST_MULT;
}

/**
 * Calculate favor modifier (+5 per 10 favors owed to player, -5 per 10 favors player owes)
 */
export function calculateFavorModifier(favors: number): number {
  return favors * MODIFIER_WEIGHTS.FAVOR_MULT;
}

/**
 * Calculate personality bonus based on AI personality and negotiation items
 */
export function calculatePersonalityBonus(
  negotiation: NegotiationState,
  aiNation: Nation
): number {
  const personality = aiNation.aiPersonality || 'balanced';
  const modifiers = PERSONALITY_MODIFIERS[personality as keyof typeof PERSONALITY_MODIFIERS] || PERSONALITY_MODIFIERS.balanced;

  let bonus = 0;

  // Check for alliance items
  const hasAlliance = negotiation.offerItems.some(i => i.type === 'alliance') ||
                      negotiation.requestItems.some(i => i.type === 'alliance');
  if (hasAlliance && modifiers.alliance) {
    bonus += modifiers.alliance * MODIFIER_WEIGHTS.PERSONALITY_MULT;
  }

  // Check for treaty items
  const hasTreaty = negotiation.offerItems.some(i => i.type === 'treaty') ||
                    negotiation.requestItems.some(i => i.type === 'treaty');
  if (hasTreaty && modifiers.treaty) {
    bonus += modifiers.treaty * MODIFIER_WEIGHTS.PERSONALITY_MULT;
  }

  // Check for war-related items
  const hasWarItem = negotiation.offerItems.some(i => i.type === 'join-war') ||
                     negotiation.requestItems.some(i => i.type === 'join-war');
  if (hasWarItem && modifiers.warlike) {
    bonus += modifiers.warlike * MODIFIER_WEIGHTS.PERSONALITY_MULT;
  }

  return bonus;
}

/**
 * Calculate strategic value based on threats, alliances, and war situations
 */
export function calculateStrategicValue(
  negotiation: NegotiationState,
  aiNation: Nation,
  playerNation: Nation,
  allNations: Nation[]
): number {
  let value = 0;

  // Alliance is strategically valuable if AI is under threat
  const threatLevel = Object.values(aiNation.threats || {}).reduce((sum, t) => sum + t, 0);
  const hasAlliance = negotiation.offerItems.some(i => i.type === 'alliance');

  if (hasAlliance && threatLevel > MODIFIER_WEIGHTS.STRATEGIC_THREAT_HIGH) {
    value += MODIFIER_WEIGHTS.STRATEGIC_ALLIANCE_HIGH; // Alliance very valuable under threat
  } else if (hasAlliance && threatLevel > MODIFIER_WEIGHTS.STRATEGIC_THREAT_MID) {
    value += MODIFIER_WEIGHTS.STRATEGIC_ALLIANCE_MID;
  }

  // Joining war against common enemy
  const joinWarItems = negotiation.offerItems.filter(i => i.type === 'join-war');
  for (const item of joinWarItems) {
    if (item.targetId) {
      const enemyThreat = aiNation.threats?.[item.targetId] || 0;
      if (enemyThreat > 10) {
        value += MODIFIER_WEIGHTS.STRATEGIC_JOIN_WAR; // Help against a threatening enemy
      }
    }
  }

  return value;
}

/**
 * Calculate penalty from unresolved grievances
 */
export function calculateGrievancePenalty(aiNation: Nation, playerNation: Nation): number {
  const grievances = aiNation.grievances?.filter(
    g => g.againstNationId === playerNation.id && !g.resolved
  ) || [];

  let penalty = 0;
  for (const grievance of grievances) {
    switch (grievance.severity) {
      case 'minor':
        penalty -= MODIFIER_WEIGHTS.GRIEVANCE_MINOR;
        break;
      case 'moderate':
        penalty -= MODIFIER_WEIGHTS.GRIEVANCE_MODERATE;
        break;
      case 'major':
        penalty -= MODIFIER_WEIGHTS.GRIEVANCE_MAJOR;
        break;
      case 'severe':
        penalty -= MODIFIER_WEIGHTS.GRIEVANCE_SEVERE;
        break;
    }
  }

  return penalty;
}

/**
 * Calculate all modifiers for a negotiation evaluation
 */
export interface EvaluationModifiers {
  relationshipModifier: number;
  trustModifier: number;
  favorModifier: number;
  personalityBonus: number;
  strategicValue: number;
  grievancePenalty: number;
}

export function calculateAllModifiers(
  negotiation: NegotiationState,
  aiNation: Nation,
  playerNation: Nation,
  allNations: Nation[],
  relationship: number,
  trust: number,
  favors: number
): EvaluationModifiers {
  return {
    relationshipModifier: calculateRelationshipModifier(relationship),
    trustModifier: calculateTrustModifier(trust),
    favorModifier: calculateFavorModifier(favors),
    personalityBonus: calculatePersonalityBonus(negotiation, aiNation),
    strategicValue: calculateStrategicValue(negotiation, aiNation, playerNation, allNations),
    grievancePenalty: calculateGrievancePenalty(aiNation, playerNation),
  };
}
