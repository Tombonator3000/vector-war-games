/**
 * Tests for Evaluation Feedback Module
 *
 * Comprehensive test suite for feedback generation, acceptance probability,
 * and counter-offer logic.
 */

import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
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
  COUNTER_OFFER_THRESHOLDS,
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

beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('generateNegotiationFeedback', () => {
  const aiNation = createMockNation();
  const playerNation = createMockNation({ id: 'player' });
  const messageGroups = [
    {
      category: 'auto-accept',
      score: ACCEPTANCE_THRESHOLDS.AUTO_ACCEPT,
      messages: [
        'This is an excellent proposal. I accept!',
        'You are most generous. We have a deal.',
        'I appreciate this offer and gladly accept.',
      ],
    },
    {
      category: 'acceptance',
      score: ACCEPTANCE_THRESHOLDS.LIKELY,
      messages: [
        'This seems fair. I accept your terms.',
        'I find this acceptable.',
        'We have ourselves a deal.',
        'This works for me.',
      ],
    },
    {
      category: 'negotiation',
      score: ACCEPTANCE_THRESHOLDS.POSSIBLE,
      messages: [
        "This could work, but I'd like a bit more.",
        "We're close. Add a little more and we have a deal.",
        'Almost there. What else can you offer?',
        'Not quite enough, but we can work with this.',
      ],
    },
    {
      category: 'counter-offer',
      score: ACCEPTANCE_THRESHOLDS.COUNTER_OFFER,
      messages: [
        "This doesn't work for me. Let me suggest some changes.",
        "Not enough. Here's what I need...",
        "I'm afraid I need more than this.",
        'This is unbalanced. Let me propose adjustments.',
      ],
    },
  ];

  it.each(messageGroups)('selects every valid $category message at the score threshold', ({ score, messages }) => {
    for (const [index, expected] of messages.entries()) {
      vi.mocked(Math.random).mockReturnValue((index + 0.5) / messages.length);
      expect(generateNegotiationFeedback(score, aiNation, playerNation, 50, 70, 0))
        .toBe(expected);
    }
  });

  it.each([
    [ACCEPTANCE_THRESHOLDS.AUTO_ACCEPT - 1, 'This seems fair. I accept your terms.'],
    [ACCEPTANCE_THRESHOLDS.LIKELY - 1, "This could work, but I'd like a bit more."],
    [ACCEPTANCE_THRESHOLDS.POSSIBLE - 1, "This doesn't work for me. Let me suggest some changes."],
    [ACCEPTANCE_THRESHOLDS.COUNTER_OFFER - 1, 'This is completely unacceptable.'],
  ] as const)('uses the lower feedback category just below score %s', (score, expected) => {
    expect(generateNegotiationFeedback(score, aiNation, playerNation, 50, 70, 0))
      .toBe(expected);
  });

  it.each([
    [20, 50, 0, "I don't trust you enough for this deal."],
    [50, -50, 0, 'Our relationship is too poor for such an arrangement.'],
    [50, 50, -30, 'We have too many unresolved grievances.'],
    [REJECTION_THRESHOLDS.TRUST, REJECTION_THRESHOLDS.RELATIONSHIP,
      REJECTION_THRESHOLDS.GRIEVANCE, 'This is completely unacceptable.'],
  ] as const)('provides the contextual rejection for trust %s / relationship %s / grievance %s',
    (trust, relationship, grievancePenalty, expected) => {
      expect(generateNegotiationFeedback(-250, aiNation, playerNation, relationship, trust, grievancePenalty))
        .toBe(expected);
      expect(Math.random).not.toHaveBeenCalled();
    });
});

describe('shouldMakeCounterOffer', () => {
  it.each([
    ['defensive', COUNTER_OFFER_THRESHOLDS.DEFENSIVE_PROBABILITY],
    ['isolationist', COUNTER_OFFER_THRESHOLDS.ISOLATIONIST_PROBABILITY],
    ['balanced', COUNTER_OFFER_THRESHOLDS.DEFAULT_PROBABILITY],
    ['aggressive', COUNTER_OFFER_THRESHOLDS.DEFAULT_PROBABILITY],
    ['unknown', COUNTER_OFFER_THRESHOLDS.DEFAULT_PROBABILITY],
  ] as const)('uses the exact probability boundary for %s', (personality, probability) => {
    vi.mocked(Math.random).mockReturnValue(probability - 0.001);
    expect(shouldMakeCounterOffer(0, personality, 50, 50)).toBe(true);
    vi.mocked(Math.random).mockReturnValue(probability);
    expect(shouldMakeCounterOffer(0, personality, 50, 50)).toBe(false);
    vi.mocked(Math.random).mockReturnValue(probability + 0.001);
    expect(shouldMakeCounterOffer(0, personality, 50, 50)).toBe(false);
  });

  it.each([
    ['hostile relationship', 0, COUNTER_OFFER_THRESHOLDS.RELATIONSHIP_MIN - 1, 50],
    ['low trust', 0, 50, COUNTER_OFFER_THRESHOLDS.TRUST_MIN - 1],
    ['acceptable score', ACCEPTANCE_THRESHOLDS.LIKELY, 50, 50],
    ['very poor score', ACCEPTANCE_THRESHOLDS.UNLIKELY, 50, 50],
  ] as const)('rejects a counter-offer for %s without drawing randomness', (_reason, score, relationship, trust) => {
    expect(shouldMakeCounterOffer(score, 'balanced', relationship, trust)).toBe(false);
    expect(Math.random).not.toHaveBeenCalled();
  });

  it.each([
    [ACCEPTANCE_THRESHOLDS.UNLIKELY + 1, 50, 50],
    [ACCEPTANCE_THRESHOLDS.LIKELY - 1, 50, 50],
    [0, COUNTER_OFFER_THRESHOLDS.RELATIONSHIP_MIN, 50],
    [0, 50, COUNTER_OFFER_THRESHOLDS.TRUST_MIN],
  ] as const)('allows a counter-offer at score %s / relationship %s / trust %s',
    (score, relationship, trust) => {
      expect(shouldMakeCounterOffer(score, 'balanced', relationship, trust)).toBe(true);
      expect(Math.random).toHaveBeenCalledTimes(1);
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
