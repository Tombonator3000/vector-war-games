/**
 * Tests for Evaluation Modifiers Module
 *
 * Comprehensive test suite for negotiation evaluation modifier calculations.
 */

import { describe, it, expect } from 'vitest';
import type { Nation } from '@/types/game';
import type { NegotiationState } from '@/types/negotiation';
import {
  calculateRelationshipModifier,
  calculateTrustModifier,
  calculateFavorModifier,
  calculatePersonalityBonus,
  calculateStrategicValue,
  calculateGrievancePenalty,
  calculateAllModifiers,
  MODIFIER_WEIGHTS,
  PERSONALITY_MODIFIERS,
} from '../evaluationModifiers';

// ============================================================================
// Test Helpers
// ============================================================================

function createMockNation(overrides?: Partial<Nation>): Nation {
  return {
    id: 'test-nation',
    name: 'Test Nation',
    population: 1000,
    production: 100,
    intel: 50,
    lon: 0,
    lat: 0,
    color: '#FF0000',
    aiPersonality: 'balanced',
    threats: {},
    grievances: [],
    ...overrides,
  } as Nation;
}

function createMockNegotiation(overrides?: Partial<NegotiationState>): NegotiationState {
  return {
    id: 'test-negotiation',
    initiatorId: 'player',
    respondentId: 'ai',
    offerItems: [],
    requestItems: [],
    currentRound: 1,
    maxRounds: 5,
    status: 'active',
    history: [],
    createdTurn: 0,
    expiresAtTurn: 10,
    ...overrides,
  };
}

// ============================================================================
// Relationship Modifier Tests
// ============================================================================

describe('calculateRelationshipModifier', () => {
  it('should return 0 for neutral relationship', () => {
    expect(calculateRelationshipModifier(0)).toBe(0);
  });

  it('should return positive value for positive relationship', () => {
    expect(calculateRelationshipModifier(50)).toBe(25);
    expect(calculateRelationshipModifier(100)).toBe(50);
  });

  it('should return negative value for negative relationship', () => {
    expect(calculateRelationshipModifier(-50)).toBe(-25);
    expect(calculateRelationshipModifier(-100)).toBe(-50);
  });

  it('should scale linearly with relationship', () => {
    const result = calculateRelationshipModifier(60);
    expect(result).toBe(60 * MODIFIER_WEIGHTS.RELATIONSHIP_MULT);
  });
});

// ============================================================================
// Trust Modifier Tests
// ============================================================================

describe('calculateTrustModifier', () => {
  it('should return 0 for trust of 50', () => {
    expect(calculateTrustModifier(50)).toBe(0);
  });

  it('should return positive value for high trust', () => {
    expect(calculateTrustModifier(100)).toBe(30);
    expect(calculateTrustModifier(75)).toBe(15);
  });

  it('should return negative value for low trust', () => {
    expect(calculateTrustModifier(0)).toBe(-30);
    expect(calculateTrustModifier(25)).toBe(-15);
  });

  it('should scale with trust level', () => {
    const result = calculateTrustModifier(70);
    expect(result).toBe((70 - MODIFIER_WEIGHTS.TRUST_BASE) * MODIFIER_WEIGHTS.TRUST_MULT);
  });
});

// ============================================================================
// Favor Modifier Tests
// ============================================================================

describe('calculateFavorModifier', () => {
  it('should return 0 for zero favors', () => {
    expect(calculateFavorModifier(0)).toBe(0);
  });

  it('should return positive value when AI owes favors', () => {
    expect(calculateFavorModifier(10)).toBe(5);
    expect(calculateFavorModifier(20)).toBe(10);
  });

  it('should return negative value when player owes favors', () => {
    expect(calculateFavorModifier(-10)).toBe(-5);
    expect(calculateFavorModifier(-20)).toBe(-10);
  });

  it('should scale linearly with favor count', () => {
    const result = calculateFavorModifier(15);
    expect(result).toBe(15 * MODIFIER_WEIGHTS.FAVOR_MULT);
  });
});

// ============================================================================
// Personality Bonus Tests
// ============================================================================

describe('calculatePersonalityBonus', () => {
  it('should return 0 for balanced personality with no relevant items', () => {
    const nation = createMockNation({ aiPersonality: 'balanced' });
    const negotiation = createMockNegotiation();
    expect(calculatePersonalityBonus(negotiation, nation)).toBe(0);
  });

  it('should apply alliance bonus for defensive personality', () => {
    const nation = createMockNation({ aiPersonality: 'defensive' });
    const negotiation = createMockNegotiation({
      offerItems: [{ type: 'alliance', description: 'Alliance' }],
    });
    const result = calculatePersonalityBonus(negotiation, nation);
    expect(result).toBe(PERSONALITY_MODIFIERS.defensive.alliance * MODIFIER_WEIGHTS.PERSONALITY_MULT);
  });

  it('should apply alliance penalty for aggressive personality', () => {
    const nation = createMockNation({ aiPersonality: 'aggressive' });
    const negotiation = createMockNegotiation({
      offerItems: [{ type: 'alliance', description: 'Alliance' }],
    });
    const result = calculatePersonalityBonus(negotiation, nation);
    expect(result).toBe(PERSONALITY_MODIFIERS.aggressive.alliance * MODIFIER_WEIGHTS.PERSONALITY_MULT);
  });

  it('should apply treaty bonus for defensive personality', () => {
    const nation = createMockNation({ aiPersonality: 'defensive' });
    const negotiation = createMockNegotiation({
      offerItems: [{ type: 'treaty', description: 'Treaty' }],
    });
    const result = calculatePersonalityBonus(negotiation, nation);
    expect(result).toBe(PERSONALITY_MODIFIERS.defensive.treaty * MODIFIER_WEIGHTS.PERSONALITY_MULT);
  });

  it('should apply war item bonus for aggressive personality', () => {
    const nation = createMockNation({ aiPersonality: 'aggressive' });
    const negotiation = createMockNegotiation({
      offerItems: [{ type: 'join-war', targetId: 'enemy', description: 'Join war' }],
    });
    const result = calculatePersonalityBonus(negotiation, nation);
    expect(result).toBe(PERSONALITY_MODIFIERS.aggressive.warlike * MODIFIER_WEIGHTS.PERSONALITY_MULT);
  });

  it('should combine multiple bonuses', () => {
    const nation = createMockNation({ aiPersonality: 'defensive' });
    const negotiation = createMockNegotiation({
      offerItems: [
        { type: 'alliance', description: 'Alliance' },
        { type: 'treaty', description: 'Treaty' },
      ],
    });
    const result = calculatePersonalityBonus(negotiation, nation);
    const expected = (PERSONALITY_MODIFIERS.defensive.alliance + PERSONALITY_MODIFIERS.defensive.treaty) * MODIFIER_WEIGHTS.PERSONALITY_MULT;
    expect(result).toBe(expected);
  });
});

// ============================================================================
// Strategic Value Tests
// ============================================================================

describe('calculateStrategicValue', () => {
  it('should return 0 when no strategic items present', () => {
    const aiNation = createMockNation({ threats: {} });
    const playerNation = createMockNation();
    const negotiation = createMockNegotiation();
    const result = calculateStrategicValue(negotiation, aiNation, playerNation, []);
    expect(result).toBe(0);
  });

  it('should value alliance highly when under severe threat', () => {
    const aiNation = createMockNation({
      threats: { enemy1: 10, enemy2: 8 }, // Total 18
    });
    const playerNation = createMockNation();
    const negotiation = createMockNegotiation({
      offerItems: [{ type: 'alliance', description: 'Alliance' }],
    });
    const result = calculateStrategicValue(negotiation, aiNation, playerNation, []);
    expect(result).toBe(MODIFIER_WEIGHTS.STRATEGIC_ALLIANCE_HIGH);
  });

  it('should value alliance moderately when under moderate threat', () => {
    const aiNation = createMockNation({
      threats: { enemy1: 9 },
    });
    const playerNation = createMockNation();
    const negotiation = createMockNegotiation({
      offerItems: [{ type: 'alliance', description: 'Alliance' }],
    });
    const result = calculateStrategicValue(negotiation, aiNation, playerNation, []);
    expect(result).toBe(MODIFIER_WEIGHTS.STRATEGIC_ALLIANCE_MID);
  });

  it('should value joining war against threatening enemy', () => {
    const aiNation = createMockNation({
      threats: { enemy1: 15 },
    });
    const playerNation = createMockNation();
    const negotiation = createMockNegotiation({
      offerItems: [{ type: 'join-war', targetId: 'enemy1', description: 'Join war' }],
    });
    const result = calculateStrategicValue(negotiation, aiNation, playerNation, []);
    expect(result).toBe(MODIFIER_WEIGHTS.STRATEGIC_JOIN_WAR);
  });

  it('should not value joining war against non-threatening enemy', () => {
    const aiNation = createMockNation({
      threats: { enemy1: 5 },
    });
    const playerNation = createMockNation();
    const negotiation = createMockNegotiation({
      offerItems: [{ type: 'join-war', targetId: 'enemy1', description: 'Join war' }],
    });
    const result = calculateStrategicValue(negotiation, aiNation, playerNation, []);
    expect(result).toBe(0);
  });
});

// ============================================================================
// Grievance Penalty Tests
// ============================================================================

describe('calculateGrievancePenalty', () => {
  it('should return 0 when no grievances exist', () => {
    const aiNation = createMockNation({ grievances: [] });
    const playerNation = createMockNation({ id: 'player' });
    expect(calculateGrievancePenalty(aiNation, playerNation)).toBe(0);
  });

  it('should apply minor penalty for minor grievance', () => {
    const aiNation = createMockNation({
      grievances: [
        {
          id: 'g1',
          againstNationId: 'player',
          type: 'border-violation',
          severity: 'minor',
          turn: 1,
          resolved: false,
          description: 'Minor issue',
        },
      ],
    });
    const playerNation = createMockNation({ id: 'player' });
    expect(calculateGrievancePenalty(aiNation, playerNation)).toBe(-MODIFIER_WEIGHTS.GRIEVANCE_MINOR);
  });

  it('should apply moderate penalty for moderate grievance', () => {
    const aiNation = createMockNation({
      grievances: [
        {
          id: 'g1',
          againstNationId: 'player',
          type: 'espionage',
          severity: 'moderate',
          turn: 1,
          resolved: false,
          description: 'Moderate issue',
        },
      ],
    });
    const playerNation = createMockNation({ id: 'player' });
    expect(calculateGrievancePenalty(aiNation, playerNation)).toBe(-MODIFIER_WEIGHTS.GRIEVANCE_MODERATE);
  });

  it('should apply major penalty for major grievance', () => {
    const aiNation = createMockNation({
      grievances: [
        {
          id: 'g1',
          againstNationId: 'player',
          type: 'territory-seizure',
          severity: 'major',
          turn: 1,
          resolved: false,
          description: 'Major issue',
        },
      ],
    });
    const playerNation = createMockNation({ id: 'player' });
    expect(calculateGrievancePenalty(aiNation, playerNation)).toBe(-MODIFIER_WEIGHTS.GRIEVANCE_MAJOR);
  });

  it('should apply severe penalty for severe grievance', () => {
    const aiNation = createMockNation({
      grievances: [
        {
          id: 'g1',
          againstNationId: 'player',
          type: 'nuclear-attack',
          severity: 'severe',
          turn: 1,
          resolved: false,
          description: 'Severe issue',
        },
      ],
    });
    const playerNation = createMockNation({ id: 'player' });
    expect(calculateGrievancePenalty(aiNation, playerNation)).toBe(-MODIFIER_WEIGHTS.GRIEVANCE_SEVERE);
  });

  it('should sum multiple grievances', () => {
    const aiNation = createMockNation({
      grievances: [
        {
          id: 'g1',
          againstNationId: 'player',
          type: 'border-violation',
          severity: 'minor',
          turn: 1,
          resolved: false,
          description: 'Minor issue',
        },
        {
          id: 'g2',
          againstNationId: 'player',
          type: 'espionage',
          severity: 'moderate',
          turn: 2,
          resolved: false,
          description: 'Moderate issue',
        },
      ],
    });
    const playerNation = createMockNation({ id: 'player' });
    const expected = -(MODIFIER_WEIGHTS.GRIEVANCE_MINOR + MODIFIER_WEIGHTS.GRIEVANCE_MODERATE);
    expect(calculateGrievancePenalty(aiNation, playerNation)).toBe(expected);
  });

  it('should ignore resolved grievances', () => {
    const aiNation = createMockNation({
      grievances: [
        {
          id: 'g1',
          againstNationId: 'player',
          type: 'border-violation',
          severity: 'major',
          turn: 1,
          resolved: true,
          description: 'Resolved issue',
        },
      ],
    });
    const playerNation = createMockNation({ id: 'player' });
    expect(calculateGrievancePenalty(aiNation, playerNation)).toBe(0);
  });

  it('should ignore grievances against other nations', () => {
    const aiNation = createMockNation({
      grievances: [
        {
          id: 'g1',
          againstNationId: 'other-nation',
          type: 'border-violation',
          severity: 'major',
          turn: 1,
          resolved: false,
          description: 'Against someone else',
        },
      ],
    });
    const playerNation = createMockNation({ id: 'player' });
    expect(calculateGrievancePenalty(aiNation, playerNation)).toBe(0);
  });
});

// ============================================================================
// Calculate All Modifiers Tests
// ============================================================================

describe('calculateAllModifiers', () => {
  it('should calculate all modifiers correctly', () => {
    const aiNation = createMockNation({
      aiPersonality: 'defensive',
      threats: { enemy: 16 },
      grievances: [
        {
          id: 'g1',
          againstNationId: 'player',
          type: 'border-violation',
          severity: 'minor',
          turn: 1,
          resolved: false,
          description: 'Minor issue',
        },
      ],
    });
    const playerNation = createMockNation({ id: 'player' });
    const negotiation = createMockNegotiation({
      offerItems: [{ type: 'alliance', description: 'Alliance' }],
    });

    const result = calculateAllModifiers(
      negotiation,
      aiNation,
      playerNation,
      [aiNation, playerNation],
      50, // relationship
      60, // trust
      5   // favors
    );

    expect(result.relationshipModifier).toBe(25);
    expect(result.trustModifier).toBe(6);
    expect(result.favorModifier).toBe(2.5);
    expect(result.personalityBonus).toBe(PERSONALITY_MODIFIERS.defensive.alliance * MODIFIER_WEIGHTS.PERSONALITY_MULT);
    expect(result.strategicValue).toBe(MODIFIER_WEIGHTS.STRATEGIC_ALLIANCE_HIGH);
    expect(result.grievancePenalty).toBe(-MODIFIER_WEIGHTS.GRIEVANCE_MINOR);
  });

  it('should handle negative values correctly', () => {
    const aiNation = createMockNation({
      aiPersonality: 'aggressive',
      threats: {},
      grievances: [
        {
          id: 'g1',
          againstNationId: 'player',
          type: 'nuclear-attack',
          severity: 'severe',
          turn: 1,
          resolved: false,
          description: 'Severe issue',
        },
      ],
    });
    const playerNation = createMockNation({ id: 'player' });
    const negotiation = createMockNegotiation({
      offerItems: [{ type: 'alliance', description: 'Alliance' }],
    });

    const result = calculateAllModifiers(
      negotiation,
      aiNation,
      playerNation,
      [aiNation, playerNation],
      -50,  // relationship
      20,   // trust
      -10   // favors
    );

    expect(result.relationshipModifier).toBe(-25);
    expect(result.trustModifier).toBe(-18);
    expect(result.favorModifier).toBe(-5);
    expect(result.personalityBonus).toBe(PERSONALITY_MODIFIERS.aggressive.alliance * MODIFIER_WEIGHTS.PERSONALITY_MULT);
    expect(result.strategicValue).toBe(0);
    expect(result.grievancePenalty).toBe(-MODIFIER_WEIGHTS.GRIEVANCE_SEVERE);
  });
});
