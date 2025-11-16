import { describe, expect, it } from 'vitest';
import { updateCasusBelliForAllNations } from '../casusBelliIntegration';
import type { Nation } from '../../types/game';

function createNation(overrides: Partial<Nation> = {}): Nation {
  return {
    id: 'nation',
    isPlayer: false,
    name: 'Test Nation',
    leader: 'Leader',
    lon: 0,
    lat: 0,
    color: '#ffffff',
    population: 10_000_000,
    missiles: 0,
    defense: 0,
    production: 0,
    uranium: 0,
    intel: 0,
    morale: 50,
    publicOpinion: 50,
    electionTimer: 0,
    cabinetApproval: 50,
    warheads: {},
    ...overrides,
  };
}

describe('updateCasusBelliForAllNations', () => {
  it('treats malformed grievances and claims as empty collections', () => {
    const attacker = createNation({
      id: 'attacker',
      name: 'Attackerland',
      grievances: 'not-an-array' as unknown as Nation['grievances'],
      claims: { invalid: true } as unknown as Nation['claims'],
    });
    const defender = createNation({ id: 'defender', name: 'Defenderia' });

    const result = updateCasusBelliForAllNations([attacker, defender], 5);

    expect(result[0].casusBelli).toBeDefined();
    expect(Array.isArray(result[0].casusBelli)).toBe(true);
    expect(result[0].casusBelli).toHaveLength(0);
  });
});
