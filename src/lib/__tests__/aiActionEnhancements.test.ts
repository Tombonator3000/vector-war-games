import { describe, expect, it, vi } from 'vitest';
import { aiConventionalWarfareAction } from '../aiActionEnhancements';
import type { Nation } from '@/types/game';

type PartialNation = Partial<Nation> & { id: string; name: string };

function createNation(overrides: PartialNation): Nation {
  const base: Partial<Nation> = {
    population: 100,
    production: 40,
    intel: 20,
    ai: 'balanced',
    alliances: [],
    treaties: {},
    threats: {},
    eliminated: false,
  };

  return { ...base, ...overrides } as Nation;
}

describe('aiConventionalWarfareAction', () => {
  it('deploys reserve units to contested territories', () => {
    const log = vi.fn();
    const deployUnit = vi.fn(() => ({ success: true }));
    const territories = {
      safe: {
        id: 'safe',
        name: 'Safe Rear',
        controllingNationId: 'ai',
        neighbors: ['front'],
        armies: 5,
        strategicValue: 1,
        productionBonus: 1,
      },
      front: {
        id: 'front',
        name: 'Frontline',
        controllingNationId: 'ai',
        neighbors: ['safe', 'enemy'],
        armies: 2,
        strategicValue: 3,
        productionBonus: 2,
      },
      enemy: {
        id: 'enemy',
        name: 'Enemy Territory',
        controllingNationId: 'enemy',
        neighbors: ['front'],
        armies: 2,
        strategicValue: 2,
        productionBonus: 1,
      },
    };

    const aiNation = createNation({ id: 'ai', name: 'AI Nation' });
    const nations = [
      aiNation,
      createNation({ id: 'enemy', name: 'Enemy State', population: 80 }),
    ];

    const mathRandom = vi.spyOn(Math, 'random');
    mathRandom.mockReturnValueOnce(0.99); // Skip training
    mathRandom.mockReturnValueOnce(0.1); // Trigger deployment
    mathRandom.mockReturnValueOnce(0.99); // Skip attack

    const result = aiConventionalWarfareAction(
      aiNation,
      nations,
      {
        deployUnit,
        templates: {
          armored_corps: { name: 'Armored Corps' },
        },
        getUnitsForNation: () => [
          {
            id: 'unit-1',
            status: 'reserve',
            templateId: 'armored_corps',
            label: '1st Armored Corps',
          },
        ],
        getDeployableTerritories: () => [territories.front, territories.safe],
        territories,
      },
      10,
      log,
    );

    expect(result).toBe(true);
    expect(deployUnit).toHaveBeenCalledWith('unit-1', 'front');
    expect(log).toHaveBeenCalledWith('AI Nation deploys 1st Armored Corps to Frontline');
    mathRandom.mockRestore();
  });

  it('initiates border conflicts against vulnerable enemies', () => {
    const log = vi.fn();
    const resolveBorderConflict = vi.fn(() => ({ success: true }));
    const territories = {
      front: {
        id: 'front',
        name: 'Border Province',
        controllingNationId: 'ai',
        neighbors: ['enemy'],
        armies: 6,
        strategicValue: 2,
        productionBonus: 1,
      },
      enemy: {
        id: 'enemy',
        name: 'Enemy Province',
        controllingNationId: 'enemy',
        neighbors: ['front'],
        armies: 2,
        strategicValue: 3,
        productionBonus: 2,
      },
    };

    const aiNation = createNation({
      id: 'ai',
      name: 'AI Nation',
      ai: 'aggressive',
      threats: { enemy: 60 },
    });
    const nations = [
      aiNation,
      createNation({ id: 'enemy', name: 'Enemy State', population: 90 }),
    ];

    const mathRandom = vi.spyOn(Math, 'random');
    mathRandom.mockReturnValueOnce(0.99); // Skip training
    mathRandom.mockReturnValueOnce(0.2); // Trigger attack for aggressive AI (0.35 threshold)

    const result = aiConventionalWarfareAction(
      aiNation,
      nations,
      {
        resolveBorderConflict,
        getUnitsForNation: () => [],
        territories,
      },
      20,
      log,
    );

    expect(result).toBe(true);
    expect(resolveBorderConflict).toHaveBeenCalledWith('front', 'enemy', expect.any(Number));
    expect(log).toHaveBeenCalledWith(
      'AI Nation launches border offensive from Border Province into Enemy Province',
    );
    mathRandom.mockRestore();
  });
});
