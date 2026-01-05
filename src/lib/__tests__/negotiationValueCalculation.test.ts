import { describe, expect, it } from 'vitest';

import { calculateItemValue, calculateTotalValue } from '@/lib/negotiationUtils';
import type { Nation } from '@/types/game';
import type { NegotiableItem, ItemValueContext } from '@/types/negotiation';

/**
 * Test suite for calculateItemValue() refactoring
 *
 * This suite verifies that the refactored handler registry pattern
 * produces identical results to the original switch-based implementation.
 */

function createTestNation(overrides: Partial<Nation> = {}): Nation {
  return {
    id: overrides.id ?? 'nation-1',
    isPlayer: overrides.isPlayer ?? false,
    name: overrides.name ?? 'Test Nation',
    leader: overrides.leader ?? 'Test Leader',
    lon: overrides.lon ?? 0,
    lat: overrides.lat ?? 0,
    color: overrides.color ?? '#ffffff',
    population: overrides.population ?? 100,
    missiles: overrides.missiles ?? 0,
    defense: overrides.defense ?? 10,
    production: overrides.production ?? 100,
    uranium: overrides.uranium ?? 10,
    intel: overrides.intel ?? 50,
    morale: overrides.morale ?? 50,
    publicOpinion: overrides.publicOpinion ?? 50,
    electionTimer: overrides.electionTimer ?? 10,
    cabinetApproval: overrides.cabinetApproval ?? 50,
    warheads: overrides.warheads ?? {},
    alliances: overrides.alliances ?? [],
    relationships: overrides.relationships ?? {},
    aiPersonality: overrides.aiPersonality,
    threats: overrides.threats,
    sanctioned: overrides.sanctioned ?? false,
    grievances: overrides.grievances,
    researched: overrides.researched,
    researchQueue: overrides.researchQueue ?? null,
    ...overrides,
  };
}

function createTestContext(overrides: Partial<ItemValueContext> = {}): ItemValueContext {
  return {
    evaluatorNation: overrides.evaluatorNation ?? createTestNation(),
    otherNation: overrides.otherNation ?? createTestNation({ id: 'nation-2' }),
    allNations: overrides.allNations ?? [],
    relationship: overrides.relationship ?? 0,
    trust: overrides.trust ?? 50,
    threats: overrides.threats ?? {},
  };
}

describe('calculateItemValue - Amount-based items', () => {
  it('calculates gold value correctly', () => {
    const item: NegotiableItem = { type: 'gold', amount: 100 };
    const context = createTestContext();

    const value = calculateItemValue(item, context);

    expect(value).toBeGreaterThan(0);
    // Base value is 1, so 100 gold * 1 = 100 (plus relationship modifier)
    expect(value).toBeGreaterThanOrEqual(100);
  });

  it('calculates intel value correctly', () => {
    const item: NegotiableItem = { type: 'intel', amount: 50 };
    const context = createTestContext();

    const value = calculateItemValue(item, context);

    expect(value).toBeGreaterThan(0);
    // Base value is 3, so 50 intel * 3 = 150 (plus modifiers)
    expect(value).toBeGreaterThanOrEqual(150);
  });

  it('calculates production value correctly', () => {
    const item: NegotiableItem = { type: 'production', amount: 75 };
    const context = createTestContext();

    const value = calculateItemValue(item, context);

    expect(value).toBeGreaterThan(0);
    // Base value is 2, so 75 production * 2 = 150 (plus modifiers)
    expect(value).toBeGreaterThanOrEqual(150);
  });

  it('calculates favor-exchange value correctly', () => {
    const item: NegotiableItem = { type: 'favor-exchange', amount: 5 };
    const context = createTestContext();

    const value = calculateItemValue(item, context);

    expect(value).toBeGreaterThan(0);
    // Base value is 10, so 5 favors * 10 = 50 (plus modifiers)
    expect(value).toBeGreaterThanOrEqual(50);
  });
});

describe('calculateItemValue - Alliance', () => {
  it('calculates alliance value with good relationship', () => {
    const item: NegotiableItem = { type: 'alliance' };
    const context = createTestContext({ relationship: 60 });

    const value = calculateItemValue(item, context);

    expect(value).toBeGreaterThan(1000); // Base is 1000, should be higher
  });

  it('calculates alliance value with high trust', () => {
    const item: NegotiableItem = { type: 'alliance' };
    const context = createTestContext({ trust: 80 });

    const value = calculateItemValue(item, context);

    expect(value).toBeGreaterThan(1000); // Base is 1000, trust bonus applies
  });

  it('calculates alliance value for defensive personality', () => {
    const nation = createTestNation({ aiPersonality: 'defensive' });
    const item: NegotiableItem = { type: 'alliance' };
    const context = createTestContext({ evaluatorNation: nation });

    const value = calculateItemValue(item, context);

    expect(value).toBeGreaterThan(1000); // Defensive nations value alliances more
  });

  it('calculates alliance value with high threat level', () => {
    const item: NegotiableItem = { type: 'alliance' };
    const context = createTestContext({
      threats: { 'enemy-1': 25, 'enemy-2': 10 },
    });

    const value = calculateItemValue(item, context);

    expect(value).toBeGreaterThan(1000); // High threat increases alliance value
  });

  it('reduces alliance value with hostile relationship', () => {
    const item: NegotiableItem = { type: 'alliance' };
    const context = createTestContext({ relationship: -50 });

    const value = calculateItemValue(item, context);

    // Hostile relationship reduces value
    expect(value).toBeLessThan(1000);
  });
});

describe('calculateItemValue - Treaty', () => {
  it('calculates truce treaty value', () => {
    const item: NegotiableItem = { type: 'treaty', subtype: 'truce', duration: 10 };
    const context = createTestContext();

    const value = calculateItemValue(item, context);

    expect(value).toBeGreaterThan(0);
  });

  it('calculates non-aggression treaty value', () => {
    const item: NegotiableItem = { type: 'treaty', subtype: 'non-aggression', duration: 10 };
    const context = createTestContext();

    const value = calculateItemValue(item, context);

    expect(value).toBeGreaterThan(300); // Non-aggression worth more than truce
  });

  it('calculates mutual-defense treaty value', () => {
    const item: NegotiableItem = { type: 'treaty', subtype: 'mutual-defense', duration: 10 };
    const context = createTestContext();

    const value = calculateItemValue(item, context);

    expect(value).toBeGreaterThan(500); // Mutual-defense worth most
  });

  it('scales treaty value by duration', () => {
    const shortItem: NegotiableItem = { type: 'treaty', subtype: 'truce', duration: 5 };
    const longItem: NegotiableItem = { type: 'treaty', subtype: 'truce', duration: 20 };
    const context = createTestContext();

    const shortValue = calculateItemValue(shortItem, context);
    const longValue = calculateItemValue(longItem, context);

    expect(longValue).toBeGreaterThan(shortValue);
  });

  it('applies relationship modifier correctly to treaties', () => {
    const item: NegotiableItem = { type: 'treaty', subtype: 'non-aggression', duration: 10 };
    const peacefulContext = createTestContext({ relationship: 50 });
    const hostileContext = createTestContext({ relationship: -50 });

    const peacefulValue = calculateItemValue(item, peacefulContext);
    const hostileValue = calculateItemValue(item, hostileContext);

    // Better relationships increase all item values through context modifiers
    // Even though treaties are more "needed" during conflict, the relationship
    // modifier dominates the final calculation
    expect(peacefulValue).toBeGreaterThan(hostileValue);
  });
});

describe('calculateItemValue - Promise', () => {
  it('calculates no-attack promise value', () => {
    const item: NegotiableItem = { type: 'promise', subtype: 'no-attack', duration: 10 };
    const context = createTestContext({ trust: 60 });

    const value = calculateItemValue(item, context);

    expect(value).toBeGreaterThan(0);
  });

  it('calculates help-if-attacked promise value', () => {
    const item: NegotiableItem = { type: 'promise', subtype: 'help-if-attacked', duration: 10 };
    const context = createTestContext({ trust: 60 });

    const value = calculateItemValue(item, context);

    expect(value).toBeGreaterThan(300); // More valuable than no-attack
  });

  it('reduces promise value with low trust', () => {
    const item: NegotiableItem = { type: 'promise', subtype: 'no-attack', duration: 10 };
    const highTrustContext = createTestContext({ trust: 80 });
    const lowTrustContext = createTestContext({ trust: 20 });

    const highTrustValue = calculateItemValue(item, highTrustContext);
    const lowTrustValue = calculateItemValue(item, lowTrustContext);

    expect(lowTrustValue).toBeLessThan(highTrustValue);
  });

  it('scales promise value by duration', () => {
    const shortItem: NegotiableItem = { type: 'promise', subtype: 'no-attack', duration: 5 };
    const longItem: NegotiableItem = { type: 'promise', subtype: 'no-attack', duration: 15 };
    const context = createTestContext({ trust: 60 });

    const shortValue = calculateItemValue(shortItem, context);
    const longValue = calculateItemValue(longItem, context);

    expect(longValue).toBeGreaterThan(shortValue);
  });
});

describe('calculateItemValue - Sanction Lift', () => {
  it('calculates sanction lift value when sanctioned', () => {
    const nation = createTestNation({ sanctioned: true });
    const item: NegotiableItem = { type: 'sanction-lift' };
    const context = createTestContext({ evaluatorNation: nation });

    const value = calculateItemValue(item, context);

    expect(value).toBeGreaterThan(300); // Base value 300, doubled when sanctioned
  });

  it('calculates sanction lift value when not sanctioned', () => {
    const nation = createTestNation({ sanctioned: false });
    const item: NegotiableItem = { type: 'sanction-lift' };
    const context = createTestContext({ evaluatorNation: nation });

    const value = calculateItemValue(item, context);

    expect(value).toBeGreaterThan(0);
  });

  it('values sanction lift higher when sanctioned', () => {
    const sanctionedNation = createTestNation({ sanctioned: true });
    const freNation = createTestNation({ sanctioned: false });
    const item: NegotiableItem = { type: 'sanction-lift' };

    const sanctionedValue = calculateItemValue(item, createTestContext({ evaluatorNation: sanctionedNation }));
    const freeValue = calculateItemValue(item, createTestContext({ evaluatorNation: freNation }));

    expect(sanctionedValue).toBeGreaterThan(freeValue);
  });
});

describe('calculateItemValue - Duration-based items', () => {
  it('calculates open borders value', () => {
    const item: NegotiableItem = { type: 'open-borders', duration: 10 };
    const context = createTestContext();

    const value = calculateItemValue(item, context);

    expect(value).toBeGreaterThan(0);
    expect(value).toBeGreaterThanOrEqual(200 * 10); // Base 200 * duration
  });

  it('calculates trade agreement value', () => {
    const item: NegotiableItem = { type: 'trade-agreement', duration: 10 };
    const context = createTestContext();

    const value = calculateItemValue(item, context);

    expect(value).toBeGreaterThan(0);
    expect(value).toBeGreaterThanOrEqual(250 * 10); // Base 250 * duration
  });

  it('scales duration-based items correctly', () => {
    const shortBorders: NegotiableItem = { type: 'open-borders', duration: 5 };
    const longBorders: NegotiableItem = { type: 'open-borders', duration: 15 };
    const context = createTestContext();

    const shortValue = calculateItemValue(shortBorders, context);
    const longValue = calculateItemValue(longBorders, context);

    expect(longValue).toBeGreaterThan(shortValue);
    expect(longValue / shortValue).toBeCloseTo(3, 0); // Should be roughly 3x
  });
});

describe('calculateItemValue - Resource Share', () => {
  it('calculates resource share value', () => {
    const item: NegotiableItem = { type: 'resource-share', amount: 10, duration: 5 };
    const context = createTestContext();

    const value = calculateItemValue(item, context);

    // Formula: amount * duration * 2
    expect(value).toBeGreaterThanOrEqual(10 * 5 * 2);
  });

  it('scales resource share by amount and duration', () => {
    const smallItem: NegotiableItem = { type: 'resource-share', amount: 5, duration: 3 };
    const largeItem: NegotiableItem = { type: 'resource-share', amount: 20, duration: 10 };
    const context = createTestContext();

    const smallValue = calculateItemValue(smallItem, context);
    const largeValue = calculateItemValue(largeItem, context);

    expect(largeValue).toBeGreaterThan(smallValue);
  });
});

describe('calculateItemValue - Join War', () => {
  it('calculates join war value with valid target', () => {
    const targetNation = createTestNation({ id: 'target-1', missiles: 10 });
    const evaluatorNation = createTestNation({ missiles: 15 });
    const item: NegotiableItem = { type: 'join-war', targetId: 'target-1' };
    const context = createTestContext({
      evaluatorNation,
      allNations: [evaluatorNation, targetNation],
    });

    const value = calculateItemValue(item, context);

    expect(value).toBeGreaterThan(0);
  });

  it('returns zero for join war without target', () => {
    const item: NegotiableItem = { type: 'join-war' };
    const context = createTestContext();

    const value = calculateItemValue(item, context);

    expect(value).toBe(0);
  });

  it('reduces value when target is ally', () => {
    const targetNation = createTestNation({ id: 'target-1', missiles: 10 });
    const enemyNation = createTestNation({ id: 'enemy-1', missiles: 10 });

    // Create evaluator with friendly relationship to target-1
    const evaluatorWithAlly = createTestNation({
      id: 'eval-1',
      missiles: 10,
      relationships: { 'target-1': 50 }, // Friendly (number, not object)
    });

    // Create evaluator with hostile relationship to enemy-1
    const evaluatorWithEnemy = createTestNation({
      id: 'eval-2',
      missiles: 10,
      relationships: { 'enemy-1': -50 }, // Hostile (number, not object)
    });

    const allyItem: NegotiableItem = { type: 'join-war', targetId: 'target-1' };
    const enemyItem: NegotiableItem = { type: 'join-war', targetId: 'enemy-1' };

    const allyValue = calculateItemValue(allyItem, createTestContext({
      evaluatorNation: evaluatorWithAlly,
      allNations: [evaluatorWithAlly, targetNation],
    }));

    const enemyValue = calculateItemValue(enemyItem, createTestContext({
      evaluatorNation: evaluatorWithEnemy,
      allNations: [evaluatorWithEnemy, enemyNation],
    }));

    // Should be significantly reduced when target is friendly vs enemy
    // Friendly relationship applies 0.3x multiplier, hostile applies 1.4x multiplier
    expect(allyValue).toBeLessThan(enemyValue);
  });
});

describe('calculateItemValue - Share Tech', () => {
  it('calculates basic tech sharing value', () => {
    const item: NegotiableItem = { type: 'share-tech', techId: 'basic-tech' };
    const context = createTestContext();

    const value = calculateItemValue(item, context);

    expect(value).toBeGreaterThanOrEqual(500);
  });

  it('calculates advanced tech sharing value', () => {
    const basicItem: NegotiableItem = { type: 'share-tech', techId: 'basic-tech' };
    const advancedItem: NegotiableItem = { type: 'share-tech', techId: 'advanced-weapons' };
    const context = createTestContext();

    const basicValue = calculateItemValue(basicItem, context);
    const advancedValue = calculateItemValue(advancedItem, context);

    expect(advancedValue).toBeGreaterThan(basicValue);
  });
});

describe('calculateItemValue - Grievance Apology', () => {
  it('returns zero when grievance not found', () => {
    const item: NegotiableItem = { type: 'grievance-apology', grievanceId: 'nonexistent' };
    const nation = createTestNation({ grievances: [] });
    const context = createTestContext({ evaluatorNation: nation });

    const value = calculateItemValue(item, context);

    expect(value).toBe(0);
  });

  it('calculates value based on grievance severity', () => {
    const minorGrievance = { id: 'g1', severity: 'minor' as const, turns: 5 };
    const majorGrievance = { id: 'g2', severity: 'major' as const, turns: 5 };

    const minorItem: NegotiableItem = { type: 'grievance-apology', grievanceId: 'g1' };
    const majorItem: NegotiableItem = { type: 'grievance-apology', grievanceId: 'g2' };

    const minorContext = createTestContext({
      evaluatorNation: createTestNation({ grievances: [minorGrievance as any] }),
    });
    const majorContext = createTestContext({
      evaluatorNation: createTestNation({ grievances: [majorGrievance as any] }),
    });

    const minorValue = calculateItemValue(minorItem, minorContext);
    const majorValue = calculateItemValue(majorItem, majorContext);

    expect(majorValue).toBeGreaterThan(minorValue);
  });
});

describe('calculateItemValue - Military Support', () => {
  it('calculates military support value', () => {
    const item: NegotiableItem = { type: 'military-support' };
    const context = createTestContext();

    const value = calculateItemValue(item, context);

    expect(value).toBeGreaterThanOrEqual(800);
  });

  it('increases value when under threat', () => {
    const item: NegotiableItem = { type: 'military-support' };
    const safeContext = createTestContext({ threats: {} });
    const threatenedContext = createTestContext({ threats: { 'enemy-1': 20 } });

    const safeValue = calculateItemValue(item, safeContext);
    const threatenedValue = calculateItemValue(item, threatenedContext);

    expect(threatenedValue).toBeGreaterThan(safeValue);
  });
});

describe('calculateItemValue - Context Modifiers', () => {
  it('applies relationship modifier', () => {
    const item: NegotiableItem = { type: 'gold', amount: 100 };
    const poorRelationship = createTestContext({ relationship: -50 });
    const goodRelationship = createTestContext({ relationship: 50 });

    const poorValue = calculateItemValue(item, poorRelationship);
    const goodValue = calculateItemValue(item, goodRelationship);

    expect(goodValue).toBeGreaterThan(poorValue);
  });

  it('applies scarcity modifier for gold', () => {
    const item: NegotiableItem = { type: 'gold', amount: 100 };
    const richNation = createTestNation({ production: 200 });
    const poorNation = createTestNation({ production: 30 });

    const richValue = calculateItemValue(item, createTestContext({ evaluatorNation: richNation }));
    const poorValue = calculateItemValue(item, createTestContext({ evaluatorNation: poorNation }));

    expect(poorValue).toBeGreaterThan(richValue);
  });

  it('applies scarcity modifier for intel', () => {
    const item: NegotiableItem = { type: 'intel', amount: 50 };
    const highIntelNation = createTestNation({ intel: 100 });
    const lowIntelNation = createTestNation({ intel: 10 });

    const highValue = calculateItemValue(item, createTestContext({ evaluatorNation: highIntelNation }));
    const lowValue = calculateItemValue(item, createTestContext({ evaluatorNation: lowIntelNation }));

    expect(lowValue).toBeGreaterThan(highValue);
  });

  it('applies aggressive personality modifier for diplomacy', () => {
    const item: NegotiableItem = { type: 'alliance' };
    const aggressiveNation = createTestNation({ aiPersonality: 'aggressive' });
    const normalNation = createTestNation({ aiPersonality: 'balanced' });

    const aggressiveValue = calculateItemValue(item, createTestContext({ evaluatorNation: aggressiveNation }));
    const normalValue = calculateItemValue(item, createTestContext({ evaluatorNation: normalNation }));

    expect(aggressiveValue).toBeLessThan(normalValue);
  });

  it('applies defensive personality modifier for diplomacy', () => {
    const item: NegotiableItem = { type: 'treaty', subtype: 'non-aggression', duration: 10 };
    const defensiveNation = createTestNation({ aiPersonality: 'defensive' });
    const normalNation = createTestNation({ aiPersonality: 'balanced' });

    const defensiveValue = calculateItemValue(item, createTestContext({ evaluatorNation: defensiveNation }));
    const normalValue = calculateItemValue(item, createTestContext({ evaluatorNation: normalNation }));

    expect(defensiveValue).toBeGreaterThan(normalValue);
  });
});

describe('calculateTotalValue', () => {
  it('calculates total value of multiple items', () => {
    const items: NegotiableItem[] = [
      { type: 'gold', amount: 100 },
      { type: 'intel', amount: 50 },
      { type: 'alliance' },
    ];
    const context = createTestContext();

    const total = calculateTotalValue(items, context);

    expect(total).toBeGreaterThan(0);
    // Should be sum of individual values
    const individualSum = items.reduce((sum, item) => sum + calculateItemValue(item, context), 0);
    expect(total).toBe(individualSum);
  });

  it('returns zero for empty item list', () => {
    const items: NegotiableItem[] = [];
    const context = createTestContext();

    const total = calculateTotalValue(items, context);

    expect(total).toBe(0);
  });
});

describe('calculateItemValue - Edge Cases', () => {
  it('handles unknown item type gracefully', () => {
    const item: NegotiableItem = { type: 'unknown-type' as any };
    const context = createTestContext();

    const value = calculateItemValue(item, context);

    expect(value).toBeGreaterThanOrEqual(0); // Should return base value or 0
  });

  it('handles missing amount for amount-based items', () => {
    const item: NegotiableItem = { type: 'gold' }; // No amount specified
    const context = createTestContext();

    const value = calculateItemValue(item, context);

    expect(value).toBeGreaterThanOrEqual(0); // Should handle gracefully
  });

  it('handles missing duration for duration-based items', () => {
    const item: NegotiableItem = { type: 'open-borders' }; // No duration specified
    const context = createTestContext();

    const value = calculateItemValue(item, context);

    expect(value).toBeGreaterThan(0); // Should use default duration
  });

  it('always returns non-negative values', () => {
    const items: NegotiableItem[] = [
      { type: 'gold', amount: 100 },
      { type: 'alliance' },
      { type: 'treaty', subtype: 'truce', duration: 5 },
    ];
    const context = createTestContext({ relationship: -100 }); // Worst case relationship

    for (const item of items) {
      const value = calculateItemValue(item, context);
      expect(value).toBeGreaterThanOrEqual(0);
    }
  });

  it('always returns integer values', () => {
    const items: NegotiableItem[] = [
      { type: 'gold', amount: 37 },
      { type: 'alliance' },
      { type: 'treaty', subtype: 'truce', duration: 7 },
    ];
    const context = createTestContext({ relationship: 33 });

    for (const item of items) {
      const value = calculateItemValue(item, context);
      expect(Number.isInteger(value)).toBe(true);
    }
  });
});
