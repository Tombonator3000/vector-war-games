import { describe, expect, it } from 'vitest';

import {
  processResourceDepletion,
  DEFAULT_DEPLETION_CONFIG,
  type DepletionConfig,
} from '@/lib/resourceDepletionSystem';
import type { TerritoryResources } from '@/types/territorialResources';
import type { Nation } from '@/types/game';

function createNation(overrides: Partial<Nation> = {}): Nation {
  return {
    id: 'nation-1',
    isPlayer: false,
    name: 'Alpha',
    leader: 'Leader',
    lon: 0,
    lat: 0,
    color: '#fff',
    population: 1200,
    missiles: 10,
    defense: 0,
    production: 0,
    uranium: 0,
    intel: 0,
    warheads: { 0: 0 },
    morale: 100,
    publicOpinion: 50,
    electionTimer: 5,
    cabinetApproval: 50,
    ...overrides,
  };
}

function createTerritoryResources(
  deposits: TerritoryResources['deposits'],
): Record<string, TerritoryResources> {
  return {
    'territory-1': {
      territoryId: 'territory-1',
      deposits: deposits.map(deposit => ({ ...deposit })),
    },
  };
}

const territories = {
  'territory-1': {
    id: 'territory-1',
    name: 'Territory One',
    controllingNationId: 'nation-1',
  },
};

function mergeConfig(overrides: Partial<DepletionConfig>): DepletionConfig {
  return {
    ...DEFAULT_DEPLETION_CONFIG,
    ...overrides,
  };
}

describe('processResourceDepletion', () => {
  it('reduces depletion rate and surfaces warnings using the provided nation map', () => {
    const nation = createNation();
    const territoryResources = createTerritoryResources([
      { type: 'oil', amount: 10, richness: 1, depletionRate: 1 },
    ]);

    const config = mergeConfig({
      depletionRate: 0.5,
      overuseMultiplier: 1,
      warningThreshold: 0.6,
      criticalThreshold: 0.3,
    });

    const nationMap = new Map<string, Nation>([[nation.id, nation]]);

    const result = processResourceDepletion(
      territoryResources,
      territories,
      [nation],
      config,
      nationMap,
    );

    const updatedDeposit = result.territoryResources['territory-1'].deposits[0];
    expect(updatedDeposit.depletionRate).toBeCloseTo(0.5);
    expect(updatedDeposit.depleted).toBeUndefined();
    expect(result.warnings).toEqual([
      expect.objectContaining({
        territoryId: 'territory-1',
        resource: 'oil',
        severity: 'warning',
      }),
    ]);
  });

  it('marks deposits as depleted and emits depleted warnings when exhaustion occurs', () => {
    const nation = createNation({ missiles: 5 });
    const territoryResources = createTerritoryResources([
      { type: 'oil', amount: 10, richness: 1, depletionRate: 0.15 },
    ]);

    const config = mergeConfig({
      depletionRate: 0.2,
      overuseMultiplier: 1,
      criticalThreshold: 0.3,
    });

    const result = processResourceDepletion(
      territoryResources,
      territories,
      [nation],
      config,
    );

    const updatedDeposit = result.territoryResources['territory-1'].deposits[0];
    expect(updatedDeposit.depleted).toBe(true);
    expect(updatedDeposit.depletionRate).toBe(0);
    expect(result.warnings).toEqual([
      expect.objectContaining({
        territoryId: 'territory-1',
        resource: 'oil',
        severity: 'depleted',
      }),
    ]);
  });
});
