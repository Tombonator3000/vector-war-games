/**
 * Tests for Evaluation Feedback Module
 *
 * Comprehensive test suite for feedback generation, acceptance probability,
 * and counter-offer logic.
 */

import { describe, it, expect } from 'vitest';
import type { Nation } from '@/types/game';
import type { NegotiationState, ItemValueContext } from '@/types/negotiation';
import {
  calculateAcceptanceProbability,
  generateNegotiationFeedback,
  shouldMakeCounterOffer,
  gatherRejectionReasons,
  getAIDesiredItems,
  ACCEPTANCE_THRESHOLDS,
  REJECTION_THRESHOLDS,
} from '../evaluationFeedback';

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
    alliances: [],
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
// Acceptance Probability Tests
// ============================================================================

describe('calculateAcceptanceProbability', () => {
  it('should return 95% for auto-accept threshold', () => {
    expect(calculateAcceptanceProbability(ACCEPTANCE_THRESHOLDS.AUTO_ACCEPT)).toBe(95);
    expect(calculateAcceptanceProbability(350)).toBe(95);
  });

  it('should return 80% for very likely threshold', () => {
    expect(calculateAcceptanceProbability(ACCEPTANCE_THRESHOLDS.VERY_LIKELY)).toBe(80);
    expect(calculateAcceptanceProbability(250)).toBe(80);
  });

  it('should return 60% for likely threshold', () => {
    expect(calculateAcceptanceProbability(ACCEPTANCE_THRESHOLDS.LIKELY)).toBe(60);
    expect(calculateAcceptanceProbability(150)).toBe(60);
  });

  it('should return 40% for possible threshold', () => {
    expect(calculateAcceptanceProbability(ACCEPTANCE_THRESHOLDS.POSSIBLE)).toBe(40);
    expect(calculateAcceptanceProbability(50)).toBe(40);
  });

  it('should return 20% for counter-offer threshold', () => {
    expect(calculateAcceptanceProbability(ACCEPTANCE_THRESHOLDS.COUNTER_OFFER)).toBe(20);
    expect(calculateAcceptanceProbability(-50)).toBe(20);
  });

  it('should return 5% for unlikely threshold', () => {
    expect(calculateAcceptanceProbability(ACCEPTANCE_THRESHOLDS.UNLIKELY)).toBe(5);
    expect(calculateAcceptanceProbability(-150)).toBe(5);
  });

  it('should return 0% for very low scores', () => {
    expect(calculateAcceptanceProbability(-250)).toBe(0);
    expect(calculateAcceptanceProbability(-1000)).toBe(0);
  });
});

// ============================================================================
// Feedback Generation Tests
// ============================================================================

describe('generateNegotiationFeedback', () => {
  const aiNation = createMockNation();
  const playerNation = createMockNation({ id: 'player' });

  it('should return positive message for auto-accept score', () => {
    const feedback = generateNegotiationFeedback(
      ACCEPTANCE_THRESHOLDS.AUTO_ACCEPT,
      aiNation,
      playerNation,
      50,  // relationship
      70,  // trust
      0    // grievancePenalty
    );
    expect(feedback).toMatch(/excellent|generous|accept/i);
  });

  it('should return acceptance message for likely score', () => {
    const feedback = generateNegotiationFeedback(
      ACCEPTANCE_THRESHOLDS.LIKELY,
      aiNation,
      playerNation,
      50,
      70,
      0
    );
    expect(feedback).toMatch(/fair|acceptable|deal/i);
  });

  it('should return negotiation message for possible score', () => {
    const feedback = generateNegotiationFeedback(
      ACCEPTANCE_THRESHOLDS.POSSIBLE + 10,
      aiNation,
      playerNation,
      50,
      70,
      0
    );
    expect(feedback).toMatch(/could work|close|bit more|almost/i);
  });

  it('should return counter-offer message for counter-offer score', () => {
    const feedback = generateNegotiationFeedback(
      ACCEPTANCE_THRESHOLDS.COUNTER_OFFER + 10,
      aiNation,
      playerNation,
      50,
      70,
      0
    );
    expect(feedback).toMatch(/doesn't work|not enough|need more|unbalanced/i);
  });

  it('should mention trust for low trust scores', () => {
    const feedback = generateNegotiationFeedback(
      -250,
      aiNation,
      playerNation,
      50,
      20,  // low trust
      0
    );
    expect(feedback).toMatch(/trust/i);
  });

  it('should mention relationship for poor relationship', () => {
    const feedback = generateNegotiationFeedback(
      -250,
      aiNation,
      playerNation,
      -50,  // poor relationship
      50,
      0
    );
    expect(feedback).toMatch(/relationship/i);
  });

  it('should mention grievances when penalty is high', () => {
    const feedback = generateNegotiationFeedback(
      -250,
      aiNation,
      playerNation,
      50,
      50,
      -30  // high grievance penalty
    );
    expect(feedback).toMatch(/grievance/i);
  });

  it('should return generic rejection for very negative scores', () => {
    const feedback = generateNegotiationFeedback(
      -250,
      aiNation,
      playerNation,
      0,    // neutral relationship
      50,   // decent trust
      0     // no grievances
    );
    expect(feedback).toMatch(/unacceptable/i);
  });
});

// ============================================================================
// Counter-Offer Decision Tests
// ============================================================================

describe('shouldMakeCounterOffer', () => {
  it('should not counter if relationship is too hostile', () => {
    const result = shouldMakeCounterOffer(
      -50,      // score in counter-offer range
      'balanced',
      -60,      // very hostile relationship
      50        // decent trust
    );
    expect(result).toBe(false);
  });

  it('should not counter if trust is very low', () => {
    const result = shouldMakeCounterOffer(
      -50,
      'balanced',
      50,   // good relationship
      15    // very low trust
    );
    expect(result).toBe(false);
  });

  it('should not counter if score is too high', () => {
    const result = shouldMakeCounterOffer(
      ACCEPTANCE_THRESHOLDS.LIKELY,  // already acceptable
      'balanced',
      50,
      50
    );
    expect(result).toBe(false);
  });

  it('should not counter if score is too low', () => {
    const result = shouldMakeCounterOffer(
      ACCEPTANCE_THRESHOLDS.UNLIKELY - 10,  // too negative
      'balanced',
      50,
      50
    );
    expect(result).toBe(false);
  });

  it('should potentially counter for scores in range', () => {
    // Test multiple times due to randomness
    let countered = false;
    for (let i = 0; i < 10; i++) {
      const result = shouldMakeCounterOffer(
        0,  // in counter-offer range
        'balanced',
        50,
        50
      );
      if (result) {
        countered = true;
        break;
      }
    }
    // Should counter at least once out of 10 tries (60% chance each)
    expect(countered).toBe(true);
  });

  it('should counter more often for defensive personality', () => {
    // Defensive has 80% chance, should counter in most trials
    let counterCount = 0;
    for (let i = 0; i < 10; i++) {
      const result = shouldMakeCounterOffer(
        0,
        'defensive',
        50,
        50
      );
      if (result) counterCount++;
    }
    // Should counter in majority of trials
    expect(counterCount).toBeGreaterThan(5);
  });

  it('should counter less often for isolationist personality', () => {
    // Isolationist has 40% chance
    let counterCount = 0;
    for (let i = 0; i < 10; i++) {
      const result = shouldMakeCounterOffer(
        0,
        'isolationist',
        50,
        50
      );
      if (result) counterCount++;
    }
    // Should not counter in majority of trials
    expect(counterCount).toBeLessThan(8);
  });
});

// ============================================================================
// Rejection Reasons Tests
// ============================================================================

describe('gatherRejectionReasons', () => {
  const aiNation = createMockNation();
  const playerNation = createMockNation({ id: 'player' });
  const allNations = [aiNation, playerNation];

  it('should return empty array for positive scores', () => {
    const reasons = gatherRejectionReasons(
      100,  // positive score
      50,
      50,
      50,
      0,
      0,
      playerNation,
      aiNation,
      allNations,
      0
    );
    expect(reasons).toEqual([]);
  });

  it('should include net value reason when deal favors player', () => {
    const reasons = gatherRejectionReasons(
      -100,
      -60,  // heavily negative net value
      50,
      50,
      0,
      0,
      playerNation,
      aiNation,
      allNations,
      0
    );
    expect(reasons).toContain('Deal heavily favors you');
  });

  it('should include trust reason when trust is low', () => {
    const reasons = gatherRejectionReasons(
      -100,
      0,
      25,   // low trust
      50,
      0,
      0,
      playerNation,
      aiNation,
      allNations,
      0
    );
    expect(reasons).toContain('I don\'t trust you enough');
  });

  it('should include relationship reason when relationship is poor', () => {
    const reasons = gatherRejectionReasons(
      -100,
      0,
      50,
      -40,  // poor relationship
      0,
      0,
      playerNation,
      aiNation,
      allNations,
      0
    );
    expect(reasons).toContain('Our relationship is too poor');
  });

  it('should include grievance reason when penalty is high', () => {
    const reasons = gatherRejectionReasons(
      -100,
      0,
      50,
      50,
      -25,  // high grievance penalty
      0,
      playerNation,
      aiNation,
      allNations,
      0
    );
    expect(reasons).toContain('We have unresolved grievances');
  });

  it('should include multiple reasons when applicable', () => {
    const reasons = gatherRejectionReasons(
      -100,
      -60,  // negative net value
      25,   // low trust
      -40,  // poor relationship
      -25,  // high grievance penalty
      0,
      playerNation,
      aiNation,
      allNations,
      0
    );
    expect(reasons.length).toBeGreaterThan(1);
    expect(reasons).toContain('Deal heavily favors you');
    expect(reasons).toContain('I don\'t trust you enough');
    expect(reasons).toContain('Our relationship is too poor');
    expect(reasons).toContain('We have unresolved grievances');
  });
});

// ============================================================================
// AI Desired Items Tests
// ============================================================================

describe('getAIDesiredItems', () => {
  const playerNation = createMockNation({ id: 'player' });
  const allNations = [playerNation];
  const context = {
    evaluatorNation: createMockNation(),
    otherNation: playerNation,
    allNations,
    currentTurn: 0,
    relationship: 50,
    trust: 50,
    threats: {},
    gameState: { nations: allNations, turn: 0 } as any,
  };

  it('should desire gold when production is low', () => {
    const aiNation = createMockNation({ production: 50 });
    const items = getAIDesiredItems(aiNation, playerNation, allNations, context);
    const goldItem = items.find(i => i.type === 'gold');
    expect(goldItem).toBeDefined();
    expect(goldItem?.amount).toBe(200);
  });

  it('should not desire gold when production is high', () => {
    const aiNation = createMockNation({ production: 200 });
    const items = getAIDesiredItems(aiNation, playerNation, allNations, context);
    const goldItem = items.find(i => i.type === 'gold');
    expect(goldItem).toBeUndefined();
  });

  it('should desire intel when intel is low', () => {
    const aiNation = createMockNation({ intel: 20 });
    const items = getAIDesiredItems(aiNation, playerNation, allNations, context);
    const intelItem = items.find(i => i.type === 'intel');
    expect(intelItem).toBeDefined();
    expect(intelItem?.amount).toBe(15);
  });

  it('should not desire intel when intel is high', () => {
    const aiNation = createMockNation({ intel: 60 });
    const items = getAIDesiredItems(aiNation, playerNation, allNations, context);
    const intelItem = items.find(i => i.type === 'intel');
    expect(intelItem).toBeUndefined();
  });

  it('should desire alliance when under threat and not already allied', () => {
    const aiNation = createMockNation({
      threats: { enemy: 15 },
      alliances: [],
    });
    const items = getAIDesiredItems(aiNation, playerNation, allNations, context);
    const allianceItem = items.find(i => i.type === 'alliance');
    expect(allianceItem).toBeDefined();
    expect(allianceItem?.subtype).toBe('defensive');
  });

  it('should not desire alliance when already allied', () => {
    const aiNation = createMockNation({
      threats: { enemy: 15 },
      alliances: ['player'],
    });
    const items = getAIDesiredItems(aiNation, playerNation, allNations, context);
    const allianceItem = items.find(i => i.type === 'alliance');
    expect(allianceItem).toBeUndefined();
  });

  it('should desire help in war against threatening enemy', () => {
    const aiNation = createMockNation({
      threats: { enemy1: 20 },
    });
    const items = getAIDesiredItems(aiNation, playerNation, allNations, context);
    const warItem = items.find(i => i.type === 'join-war');
    expect(warItem).toBeDefined();
    expect(warItem?.targetId).toBe('enemy1');
  });

  it('should not desire help in war when no threatening enemies', () => {
    const aiNation = createMockNation({
      threats: { enemy1: 10 },
    });
    const items = getAIDesiredItems(aiNation, playerNation, allNations, context);
    const warItem = items.find(i => i.type === 'join-war');
    expect(warItem).toBeUndefined();
  });

  it('should desire apology for unresolved non-minor grievances', () => {
    const aiNation = createMockNation({
      grievances: [
        {
          id: 'g1',
          againstNationId: 'player',
          type: 'espionage',
          severity: 'moderate',
          turn: 1,
          resolved: false,
          description: 'Spied on us',
        },
      ],
    });
    const items = getAIDesiredItems(aiNation, playerNation, allNations, context);
    const apologyItem = items.find(i => i.type === 'grievance-apology');
    expect(apologyItem).toBeDefined();
    expect(apologyItem?.grievanceId).toBe('g1');
  });

  it('should not desire apology for minor grievances', () => {
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
    const items = getAIDesiredItems(aiNation, playerNation, allNations, context);
    const apologyItem = items.find(i => i.type === 'grievance-apology');
    expect(apologyItem).toBeUndefined();
  });
});
