import { describe, expect, it } from 'vitest';

import type { Nation } from '@/types/game';
import {
  addStrategicResource,
  initializeResourceStockpile,
  spendStrategicResource,
} from '@/lib/territorialResourcesSystem';

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
});
