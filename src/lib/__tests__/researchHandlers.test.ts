import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Nation } from '@/types/game';
import { CityLights } from '@/state/CityLights';
import { advanceCityConstruction, advanceResearch, type ResearchHandlerDependencies } from '../researchHandlers';

vi.mock('@/state/CityLights', () => ({ CityLights: { addCity: vi.fn() } }));
vi.mock('@/lib/gameUtils', () => ({ canAfford: vi.fn(), pay: vi.fn() }));
vi.mock('@/lib/gameConstants', () => ({
  WARHEAD_YIELD_TO_ID: new Map(),
  RESEARCH_LOOKUP: {
    defense_test: {
      id: 'defense_test', name: 'Defense Test', turns: 2,
      onComplete: (nation: Nation) => { nation.defense += 2; },
    },
  },
}));

function createNation(): Nation {
  return {
    id: 'player', name: 'Player', leader: 'Test', isPlayer: true,
    lat: 0, lon: 0, color: '#fff', population: 100, production: 100,
    uranium: 100, intel: 100, missiles: 0, defense: 0, warheads: {},
    cities: 1, researched: {},
  };
}

function createDependencies(nation: Nation): ResearchHandlerDependencies {
  return {
    PlayerManager: { get: () => nation },
    AudioSys: { playSFX: vi.fn() },
    log: vi.fn(), toast: vi.fn(), updateDisplay: vi.fn(),
  };
}

beforeEach(() => { vi.clearAllMocks(); });

describe('research and city progress', () => {
  it('advances a two-turn research once per production phase and completes once', () => {
    const nation = createNation();
    const deps = createDependencies(nation);
    nation.researchQueue = { projectId: 'defense_test', turnsRemaining: 2, totalTurns: 2 };
    advanceResearch(nation, 'RESOLUTION', deps);
    expect(nation.researchQueue.turnsRemaining).toBe(2);
    advanceResearch(nation, 'PRODUCTION', deps);
    expect(nation.researchQueue.turnsRemaining).toBe(1);
    advanceResearch(nation, 'RESOLUTION', deps);
    expect(nation.researched.defense_test).toBeUndefined();
    advanceResearch(nation, 'PRODUCTION', deps);
    advanceResearch(nation, 'PRODUCTION', deps);
    expect(nation.researchQueue).toBeNull();
    expect(nation.researched.defense_test).toBe(true);
    expect(nation.defense).toBe(2);
    expect(deps.log).toHaveBeenCalledTimes(1);
  });

  it('finishes a restored zero-turn research queue instead of leaving it stuck', () => {
    const nation = createNation();
    nation.researchQueue = { projectId: 'defense_test', turnsRemaining: 0, totalTurns: 2 };
    advanceResearch(nation, 'PRODUCTION', createDependencies(nation));
    expect(nation.researchQueue).toBeNull();
    expect(nation.researched.defense_test).toBe(true);
  });

  it('does not advance cities during resolution or add city lights twice', () => {
    const nation = createNation();
    const deps = createDependencies(nation);
    nation.cityConstructionQueue = { turnsRemaining: 2, totalTurns: 2 };
    advanceCityConstruction(nation, 'RESOLUTION', deps);
    expect(nation.cityConstructionQueue.turnsRemaining).toBe(2);
    advanceCityConstruction(nation, 'PRODUCTION', deps);
    advanceCityConstruction(nation, 'RESOLUTION', deps);
    expect(nation.cities).toBe(1);
    advanceCityConstruction(nation, 'PRODUCTION', deps);
    advanceCityConstruction(nation, 'PRODUCTION', deps);
    expect(nation.cities).toBe(2);
    expect(nation.cityConstructionQueue).toBeNull();
    expect(CityLights.addCity).toHaveBeenCalledTimes(1);
  });

  it('preserves a valid zero-city count when the first city is completed', () => {
    const nation = createNation();
    nation.cities = 0;
    nation.cityConstructionQueue = { turnsRemaining: 0, totalTurns: 2 };
    advanceCityConstruction(nation, 'PRODUCTION', createDependencies(nation));
    expect(nation.cities).toBe(1);
  });
});

