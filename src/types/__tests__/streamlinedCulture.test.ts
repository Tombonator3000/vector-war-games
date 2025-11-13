import { describe, expect, it } from 'vitest';

import { applyImmigrationPolicyEffects } from '../streamlinedCulture';
import { applyImmigrationPolicy } from '../../lib/streamlinedCultureLogic';
import type { Nation } from '../game';

const createNation = (overrides: Partial<Nation> = {}): Nation =>
  ({
    id: 'test-nation',
    isPlayer: false,
    name: 'Test Nation',
    leader: 'Leader',
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
    electionTimer: 0,
    cabinetApproval: 50,
    ...overrides,
  } as Nation);

describe('immigration policy instability modifiers', () => {
  it('increases instability for policies with positive modifiers', () => {
    const nation = createNation({ instability: 5 });

    const effects = applyImmigrationPolicyEffects(nation, 'open_borders');

    expect(effects.instabilityChange).toBe(10);

    const updatedNation = applyImmigrationPolicy(nation, 'open_borders');

    expect(updatedNation.instability).toBe(15);
  });

  it('reduces instability for policies with negative modifiers', () => {
    const nation = createNation({ instability: 10 });

    const closedBorders = applyImmigrationPolicyEffects(nation, 'closed_borders');
    const selective = applyImmigrationPolicyEffects(nation, 'selective');

    expect(closedBorders.instabilityChange).toBe(-5);
    expect(selective.instabilityChange).toBe(-2);

    const updatedNation = applyImmigrationPolicy(nation, 'closed_borders');

    expect(updatedNation.instability).toBe(5);
  });
});
