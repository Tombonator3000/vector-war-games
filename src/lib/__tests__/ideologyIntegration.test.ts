import { describe, expect, it } from 'vitest';

import { applyIdeologyBonusesForProduction } from '@/lib/ideologyIntegration';
import { initializeIdeologyState } from '@/lib/ideologyManager';
import type { Nation } from '@/types/game';

function createTestNation(overrides: Partial<Nation> = {}): Nation {
  return {
    id: 'test-nation',
    isPlayer: false,
    name: 'Test Nation',
    leader: 'Test Leader',
    lon: 0,
    lat: 0,
    color: '#ffffff',
    population: 100,
    missiles: 0,
    defense: 10,
    production: 100,
    uranium: 0,
    intel: 0,
    morale: 50,
    publicOpinion: 50,
    electionTimer: 4,
    cabinetApproval: 50,
    warheads: {},
    ...overrides,
  };
}

describe('applyIdeologyBonusesForProduction', () => {
  it('does not stack ideology multipliers across production phases for a static ideology', () => {
    const nation = createTestNation({
      ideologyState: initializeIdeologyState('authoritarianism'),
      productionMultiplier: 1,
    });

    applyIdeologyBonusesForProduction([nation]);
    const firstMultiplier = nation.productionMultiplier ?? 0;

    applyIdeologyBonusesForProduction([nation]);

    expect(nation.productionMultiplier).toBeCloseTo(firstMultiplier, 10);
    expect(nation.ideologyState?.lastAppliedProductionMultiplier).toBeCloseTo(1.15, 10);
  });

  it('preserves non-ideology production modifiers when reapplying ideology bonuses', () => {
    const nation = createTestNation({
      ideologyState: initializeIdeologyState('authoritarianism'),
      productionMultiplier: 1.5,
    });

    applyIdeologyBonusesForProduction([nation]);
    expect(nation.productionMultiplier).toBeCloseTo(1.5 * 1.15, 10);

    if (nation.ideologyState) {
      nation.ideologyState.currentIdeology = 'technocracy';
    }

    applyIdeologyBonusesForProduction([nation]);

    expect(nation.productionMultiplier).toBeCloseTo(1.5 * 1.1, 10);
    expect(nation.ideologyState?.lastAppliedProductionMultiplier).toBeCloseTo(1.1, 10);
  });
});


describe('persistent ideology bonuses', () => {
  it('replaces the production factor when a new ideology state replaces the old object', () => {
    const nation = createTestNation({
      ideologyState: initializeIdeologyState('authoritarianism'), productionMultiplier: 1.5,
    });
    applyIdeologyBonusesForProduction([nation]);
    nation.ideologyState = initializeIdeologyState('technocracy');
    applyIdeologyBonusesForProduction([nation]);
    expect(nation.productionMultiplier).toBeCloseTo(1.5 * 1.1);
  });

  it('preserves the production factor across a save round trip', () => {
    const nation = createTestNation({
      ideologyState: initializeIdeologyState('authoritarianism'), productionMultiplier: 1.5,
    });
    applyIdeologyBonusesForProduction([nation]);
    const restored = JSON.parse(JSON.stringify(nation)) as Nation;
    applyIdeologyBonusesForProduction([restored]);
    expect(restored.productionMultiplier).toBeCloseTo(1.5 * 1.15);
  });

  it('uses the legacy ideology-state tracker when loading an older save', () => {
    const nation = createTestNation({
      ideologyState: initializeIdeologyState('authoritarianism'), productionMultiplier: 1.5,
    });
    applyIdeologyBonusesForProduction([nation]);
    delete nation.lastAppliedIdeologyProductionMultiplier;
    applyIdeologyBonusesForProduction([nation]);
    expect(nation.productionMultiplier).toBeCloseTo(1.5 * 1.15);
  });

  function createNation(ideology: 'authoritarianism' | 'theocracy' = 'authoritarianism'): Nation {
    return createTestNation({
      ideologyState: initializeIdeologyState(ideology),
      unitAttackBonus: 2,
      unitDefenseBonus: 3,
      immigrationBonus: 7,
      culturalPower: 100,
      cyber: {
        readiness: 10, maxReadiness: 100, offense: 12, defense: 8, detection: 0, attribution: 0,
      },
    });
  }

  it('keeps static bonuses stable while retaining per-turn intel and cultural income', () => {
    const nation = createNation();
    for (let turn = 0; turn < 12; turn++) applyIdeologyBonusesForProduction([nation]);
    expect(nation.unitAttackBonus).toBe(7);
    expect(nation.unitDefenseBonus).toBe(8);
    expect(nation.immigrationBonus).toBeCloseTo(-23);
    expect(nation.cyber?.offense).toBe(17);
    expect(nation.cyber?.defense).toBe(13);
    expect(nation.intel).toBe(120);
    expect(nation.culturalPower).toBe(40);
  });

  it('replaces old static bonuses after the ideology state is replaced', () => {
    const nation = createNation();
    applyIdeologyBonusesForProduction([nation]);
    nation.ideologyState = initializeIdeologyState('technocracy');
    applyIdeologyBonusesForProduction([nation]);
    expect(nation.unitAttackBonus).toBe(2);
    expect(nation.unitDefenseBonus).toBe(3);
    expect(nation.immigrationBonus).toBeCloseTo(17);
    expect(nation.cyber?.offense).toBe(32);
    expect(nation.cyber?.defense).toBe(28);
  });

  it('preserves external modifiers gained between production turns', () => {
    const nation = createNation();
    applyIdeologyBonusesForProduction([nation]);
    nation.unitAttackBonus! += 3;
    nation.unitDefenseBonus! += 2;
    nation.immigrationBonus! += 6;
    nation.cyber!.offense += 4;
    nation.cyber!.defense += 8;
    applyIdeologyBonusesForProduction([nation]);
    expect(nation.unitAttackBonus).toBe(10);
    expect(nation.unitDefenseBonus).toBe(10);
    expect(nation.immigrationBonus).toBeCloseTo(-17);
    expect(nation.cyber?.offense).toBe(21);
    expect(nation.cyber?.defense).toBe(21);
  });

  it('restores the exact cyber baseline when a negative bonus was clamped', () => {
    const nation = createNation('theocracy');
    nation.cyber!.offense = 3;
    nation.cyber!.defense = 2;
    for (let turn = 0; turn < 3; turn++) applyIdeologyBonusesForProduction([nation]);
    expect(nation.cyber?.offense).toBe(0);
    expect(nation.cyber?.defense).toBe(0);
    nation.ideologyState!.currentIdeology = 'democracy';
    applyIdeologyBonusesForProduction([nation]);
    expect(nation.cyber?.offense).toBe(3);
    expect(nation.cyber?.defense).toBe(2);
  });

  it('applies the cyber bonus once when a cyber profile is added later', () => {
    const nation = createNation();
    const cyber = nation.cyber!;
    nation.cyber = undefined;
    applyIdeologyBonusesForProduction([nation]);
    nation.cyber = cyber;
    applyIdeologyBonusesForProduction([nation]);
    applyIdeologyBonusesForProduction([nation]);
    expect(nation.cyber.offense).toBe(17);
    expect(nation.cyber.defense).toBe(13);
  });

  it('keeps static tracking across a save round trip', () => {
    const nation = createNation();
    applyIdeologyBonusesForProduction([nation]);
    const restored = JSON.parse(JSON.stringify(nation)) as Nation;
    applyIdeologyBonusesForProduction([restored]);
    expect(restored.unitAttackBonus).toBe(7);
    expect(restored.unitDefenseBonus).toBe(8);
    expect(restored.cyber?.offense).toBe(17);
    expect(restored.cyber?.defense).toBe(13);
  });
});

