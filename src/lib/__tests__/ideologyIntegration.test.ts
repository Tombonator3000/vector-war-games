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
