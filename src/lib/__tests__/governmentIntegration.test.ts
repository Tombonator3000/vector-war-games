import { describe, expect, it } from 'vitest';
import type { Nation } from '@/types/game';
import { GOVERNMENT_BONUSES } from '@/types/government';
import {
  initializeGovernmentSystem,
  applyGovernmentBonusesForProduction,
} from '../governmentIntegration';

function createNation(multiplier = 2): Nation {
  const nation = {
    id: 'player',
    isPlayer: true,
    population: 100,
    productionMultiplier: multiplier,
  } as Nation;
  initializeGovernmentSystem([nation]);
  return nation;
}

describe('government production bonuses', () => {
  it('replaces the prior government factor without compounding tech bonuses', () => {
    const nation = createNation();
    const governmentMultiplier = GOVERNMENT_BONUSES.democracy.productionMultiplier;
    for (let turn = 0; turn < 12; turn++) {
      applyGovernmentBonusesForProduction([nation]);
      expect(nation.productionMultiplier).toBeCloseTo(2 * governmentMultiplier);
    }
  });

  it('replaces the previous factor after changing government', () => {
    const nation = createNation();
    applyGovernmentBonusesForProduction([nation]);
    nation.governmentState!.currentGovernment = 'technocracy';
    applyGovernmentBonusesForProduction([nation]);
    expect(nation.productionMultiplier).toBeCloseTo(
      2 * GOVERNMENT_BONUSES.technocracy.productionMultiplier
    );
  });

  it('retains contribution tracking when the government hook replaces its state object', () => {
    const nation = createNation();
    const hookSnapshot = { ...nation.governmentState! };
    applyGovernmentBonusesForProduction([nation]);
    nation.governmentState = { ...hookSnapshot, turnsInPower: 1 };
    applyGovernmentBonusesForProduction([nation]);
    expect(nation.productionMultiplier).toBeCloseTo(
      2 * GOVERNMENT_BONUSES.democracy.productionMultiplier
    );
  });

  it('preserves additional production research gained between turns', () => {
    const nation = createNation();
    applyGovernmentBonusesForProduction([nation]);
    nation.productionMultiplier! *= 1.25;
    applyGovernmentBonusesForProduction([nation]);
    expect(nation.productionMultiplier).toBeCloseTo(
      2 * 1.25 * GOVERNMENT_BONUSES.democracy.productionMultiplier
    );
  });

  it('keeps an explicit zero production multiplier', () => {
    const nation = createNation(0);
    applyGovernmentBonusesForProduction([nation]);
    expect(nation.productionMultiplier).toBe(0);
  });

  it('retains factor tracking after a save round trip', () => {
    const nation = createNation();
    applyGovernmentBonusesForProduction([nation]);
    const restored = JSON.parse(JSON.stringify(nation)) as Nation;
    applyGovernmentBonusesForProduction([restored]);
    expect(restored.productionMultiplier).toBeCloseTo(
      2 * GOVERNMENT_BONUSES.democracy.productionMultiplier
    );
  });
});
