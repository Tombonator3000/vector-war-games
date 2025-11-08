import { describe, expect, it } from 'vitest';

import { applyDIPIncome, getDIP, modifyDIP, updateDIPIncome } from '@/lib/diplomaticCurrencyUtils';
import type { Nation } from '@/types/game';

function createBaseNation(overrides: Partial<Nation> = {}): Nation {
  return {
    id: 'test-nation',
    name: 'Test Nation',
    leader: 'Test Leader',
    isPlayer: false,
    lon: 0,
    lat: 0,
    color: '#ffffff',
    population: 100,
    missiles: 0,
    defense: 0,
    production: 0,
    uranium: 0,
    intel: 0,
    warheads: {},
    morale: 50,
    publicOpinion: 50,
    electionTimer: 10,
    cabinetApproval: 50,
    ...overrides,
  };
}

const baseIncome = {
  baseIncome: 5,
  fromAlliances: 0,
  fromCouncilSeat: 0,
  fromMediation: 0,
  fromPeaceYears: 0,
  total: 5,
};

describe('diplomaticCurrencyUtils', () => {
  it('returns DIP from modern influence structure', () => {
    const nation = createBaseNation({
      diplomaticInfluence: {
        points: 80,
        capacity: 200,
        perTurnIncome: baseIncome,
        history: [],
      },
    });

    expect(getDIP(nation)).toBe(80);
  });

  it('reads and upgrades legacy currentDIP values when modifying influence', () => {
    const legacyNation = createBaseNation({
      diplomaticInfluence: {
        // Legacy save files used currentDIP instead of points
        currentDIP: 90,
        capacity: 200,
        perTurnIncome: baseIncome,
        history: [],
      } as any,
    });

    expect(getDIP(legacyNation)).toBe(90);

    const updated = modifyDIP(legacyNation, 5, 'Legacy carry-over', 3);
    expect(updated.diplomaticInfluence?.points).toBe(95);
    expect(updated.diplomaticInfluence?.history.at(-1)).toMatchObject({
      delta: 5,
      newBalance: 95,
      reason: 'Legacy carry-over',
      turn: 3,
    });
  });

  it('applies peace streak bonuses and records income transactions', () => {
    const nation = createBaseNation({
      diplomaticInfluence: {
        points: 10,
        capacity: 200,
        perTurnIncome: baseIncome,
        history: [],
      },
    });

    const peaceTurns = 12; // Two bonuses at 5 turns each (with remainder ignored)
    const withIncome = updateDIPIncome(nation, [nation], 4, peaceTurns);

    expect(withIncome.diplomaticInfluence?.perTurnIncome.fromPeaceYears).toBe(2);
    expect(withIncome.diplomaticInfluence?.perTurnIncome.total).toBe(7);

    const afterApply = applyDIPIncome(withIncome, 4);

    expect(afterApply.diplomaticInfluence?.points).toBe(17);
    expect(afterApply.diplomaticInfluence?.history).toHaveLength(1);
    expect(afterApply.diplomaticInfluence?.history[0]).toMatchObject({
      delta: 7,
      reason: 'Per-turn income',
      turn: 4,
    });
  });
});
