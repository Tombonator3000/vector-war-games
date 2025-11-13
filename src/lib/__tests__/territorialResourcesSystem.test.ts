import { describe, expect, it } from 'vitest';

import type { Nation } from '@/types/game';
import {
  addStrategicResource,
  initializeResourceStockpile,
  processNationResources,
  spendStrategicResource,
} from '@/lib/territorialResourcesSystem';
import type { TerritoryResources, ResourceTrade } from '@/types/territorialResources';
import type { TerritoryState } from '@/hooks/useConventionalWarfare';

function createMockNation(overrides: Partial<Nation> = {}): Nation {
  return {
    id: 'test-nation',
    name: 'Test Nation',
    population: 100,
    morale: 50,
    production: 100,
    uranium: 20,
    ...overrides,
  } as Nation;
}

describe('territorialResourcesSystem strategic helpers', () => {
  it('initializes stockpile and mirrors uranium to legacy field', () => {
    const nation = createMockNation({ uranium: 10, resourceStockpile: undefined });

    initializeResourceStockpile(nation);

    expect(nation.resourceStockpile).toBeDefined();
    expect(nation.resourceStockpile?.uranium).toBe(10);
    expect(nation.uranium).toBe(10);
  });

  it('adds and spends strategic resources while syncing legacy uranium', () => {
    const nation = createMockNation({ uranium: 5, resourceStockpile: undefined });
    initializeResourceStockpile(nation);

    addStrategicResource(nation, 'uranium', 15);
    expect(nation.resourceStockpile?.uranium).toBe(20);
    expect(nation.uranium).toBe(20);

    const spentSuccessfully = spendStrategicResource(nation, 'uranium', 12);
    expect(spentSuccessfully).toBe(true);
    expect(nation.resourceStockpile?.uranium).toBe(8);
    expect(nation.uranium).toBe(8);

    const spentAll = spendStrategicResource(nation, 'uranium', 10);
    expect(spentAll).toBe(false);
    expect(nation.resourceStockpile?.uranium).toBe(0);
    expect(nation.uranium).toBe(0);
  });

  it('handles negative additions as spends', () => {
    const nation = createMockNation({ uranium: 12, resourceStockpile: undefined });
    initializeResourceStockpile(nation);

    addStrategicResource(nation, 'uranium', -5);

    expect(nation.resourceStockpile?.uranium).toBe(7);
    expect(nation.uranium).toBe(7);
  });

  it('processes resource generation, trade income, and consumption for controlled territories', () => {
    const nation = createMockNation({
      id: 'nation-a',
      morale: 60,
      population: 95,
      resourceStockpile: {
        oil: 20,
        uranium: 10,
        rare_earths: 5,
        food: 15,
      },
      researchQueue: { projectId: 'advanced-tech' } as any,
    });

    const controlledTerritories: TerritoryState[] = [
      {
        id: 't1',
        name: 'Territory One',
        region: 'Test Region',
        type: 'land',
        anchorLat: 0,
        anchorLon: 0,
        controllingNationId: 'nation-a',
        contestedBy: [],
        strategicValue: 0,
        productionBonus: 0,
        instabilityModifier: 0,
        conflictRisk: 0,
        neighbors: [],
        armies: 3,
        unitComposition: { army: 0, navy: 0, air: 0 },
      },
      {
        id: 't2',
        name: 'Territory Two',
        region: 'Test Region',
        type: 'land',
        anchorLat: 0,
        anchorLon: 0,
        controllingNationId: 'nation-a',
        contestedBy: [],
        strategicValue: 0,
        productionBonus: 0,
        instabilityModifier: 0,
        conflictRisk: 0,
        neighbors: [],
        armies: 1,
        unitComposition: { army: 0, navy: 0, air: 0 },
      },
      {
        id: 't3',
        name: 'Breadbasket',
        region: 'Test Region',
        type: 'land',
        anchorLat: 0,
        anchorLon: 0,
        controllingNationId: 'nation-a',
        contestedBy: [],
        strategicValue: 0,
        productionBonus: 0,
        instabilityModifier: 0,
        conflictRisk: 0,
        neighbors: [],
        armies: 0,
        unitComposition: { army: 0, navy: 0, air: 0 },
      },
    ];

    const territoryResources: Record<string, TerritoryResources> = {
      t1: {
        territoryId: 't1',
        deposits: [
          { type: 'oil', amount: 4, richness: 2 },
        ],
      },
      t2: {
        territoryId: 't2',
        deposits: [
          { type: 'uranium', amount: 3, richness: 2 },
          { type: 'rare_earths', amount: 5, richness: 1 },
        ],
      },
      t3: {
        territoryId: 't3',
        deposits: [
          { type: 'food', amount: 7, richness: 1 },
        ],
      },
    };

    const activeTrades: ResourceTrade[] = [
      {
        id: 'trade-oil',
        fromNationId: 'ally',
        toNationId: 'nation-a',
        resource: 'oil',
        amountPerTurn: 2,
        duration: 3,
        totalTurns: 3,
        createdTurn: 1,
      },
      {
        id: 'trade-rare',
        fromNationId: 'ally',
        toNationId: 'nation-a',
        resource: 'rare_earths',
        amountPerTurn: 1,
        duration: 2,
        totalTurns: 2,
        createdTurn: 1,
      },
    ];

    const result = processNationResources(
      nation,
      controlledTerritories,
      territoryResources,
      activeTrades,
      5
    );

    expect(result.generation).toEqual({ oil: 9, uranium: 7, rare_earths: 6, food: 8 });
    expect(result.tradeIncome).toEqual({ oil: 2, uranium: 0, rare_earths: 1, food: 0 });
    expect(result.consumption.total).toEqual({ oil: 2, rare_earths: 2, food: 10 });
    expect(result.shortages).toHaveLength(0);
    expect(nation.resourceStockpile).toEqual({ oil: 29, uranium: 17, rare_earths: 10, food: 13 });
    expect(nation.uranium).toBe(17);
  });
});
