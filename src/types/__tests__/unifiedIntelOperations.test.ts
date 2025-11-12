import { describe, expect, it, vi, afterEach } from 'vitest';

import { executeCyberAttack } from '../unifiedIntelOperations';
import type { Nation } from '../game';

function createNation(id: string): Nation {
  return {
    id,
    isPlayer: id === 'player',
    name: id === 'player' ? 'Player Union' : 'Target Republic',
    leader: 'Leader',
    lon: 0,
    lat: 0,
    color: '#ffffff',
    population: 100,
    missiles: 6,
    defense: 3,
    production: 120,
    uranium: 40,
    intel: 60,
    warheads: { 1: 4 },
    morale: 55,
    publicOpinion: 50,
    electionTimer: 4,
    cabinetApproval: 60,
    cyber: {
      offense: 60,
      defense: 55,
      readiness: 75,
    },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('executeCyberAttack reaction severity', () => {
  it('returns severe diplomatic fallout when discovered and attributed', () => {
    const player = createNation('player');
    const target = createNation('target');

    const rolls = [0.1, 0.4, 0.2, 0.3];
    vi.spyOn(Math, 'random').mockImplementation(() => rolls.shift() ?? 0.99);

    const result = executeCyberAttack(player, target);

    expect(result.discovered).toBe(true);
    expect(result.attributed).toBe(true);
    expect(result.relationshipPenalty).toBeLessThan(0);
    expect(result.relationshipPenalty).toBe(-22);
    expect(result.defconDelta).toBe(-2);
    expect(result.retaliationExpected).toBe(true);
  });

  it('applies moderate penalties when detected without attribution', () => {
    const player = createNation('player');
    const target = createNation('target');

    const rolls = [0.1, 0.4, 0.2, 0.9];
    vi.spyOn(Math, 'random').mockImplementation(() => rolls.shift() ?? 0.99);

    const result = executeCyberAttack(player, target);

    expect(result.discovered).toBe(true);
    expect(result.attributed).toBe(false);
    expect(result.relationshipPenalty).toBe(-12);
    expect(result.defconDelta).toBe(-1);
    expect(result.retaliationExpected).toBeUndefined();
  });

  it('leaves relationships and DEFCON unchanged when undetected', () => {
    const player = createNation('player');
    const target = createNation('target');

    const rolls = [0.9, 0.4, 0.2];
    vi.spyOn(Math, 'random').mockImplementation(() => rolls.shift() ?? 0.99);

    const result = executeCyberAttack(player, target);

    expect(result.discovered).toBe(false);
    expect(result.relationshipPenalty).toBe(0);
    expect(result.defconDelta).toBe(0);
    expect(result.retaliationExpected).toBeUndefined();
  });
});
