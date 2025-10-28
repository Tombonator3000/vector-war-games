import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCyberWarfare, createDefaultNationCyberProfile, applyCyberResearchUnlock } from '../useCyberWarfare';
import type { Nation } from '@/types/game';

const createNation = (id: string, overrides: Partial<Nation> = {}): Nation => ({
  id,
  isPlayer: id === 'player',
  name: id.toUpperCase(),
  leader: `${id}-leader`,
  lon: 0,
  lat: 0,
  color: '#00ffff',
  population: 120,
  missiles: 2,
  bombers: 1,
  defense: 4,
  instability: 5,
  production: 25,
  uranium: 10,
  intel: 12,
  warheads: {},
  researched: {},
  researchQueue: null,
  treaties: {},
  satellites: {},
  threats: {},
  migrantsThisTurn: 0,
  migrantsTotal: 0,
  migrantsLastTurn: 0,
  immigrants: 0,
  coverOpsTurns: 0,
  deepRecon: {},
  sanctionTurns: 0,
  sanctioned: false,
  sanctionedBy: {},
  environmentPenaltyTurns: 0,
  conventional: undefined,
  controlledTerritories: [],
  cyber: createDefaultNationCyberProfile(),
  ...overrides,
});

const rngFrom = (values: number[]) => {
  let index = 0;
  return () => {
    const value = values[index];
    index = Math.min(values.length, index + 1);
    return value ?? 0;
  };
};

describe('useCyberWarfare', () => {
  it('resolves offensive intrusions using probabilistic success and resource impacts', () => {
    const attacker = createNation('player', {
      cyber: { ...createDefaultNationCyberProfile(), readiness: 80, offense: 72, detection: 40 },
    });
    const target = createNation('target', {
      isPlayer: false,
      name: 'Target',
      cyber: { ...createDefaultNationCyberProfile(), readiness: 60, defense: 48, detection: 28 },
    });
    const nations = [attacker, target];
    const rng = rngFrom([0.1, 0.9]); // success, undetected

    const { result } = renderHook(() =>
      useCyberWarfare({
        currentTurn: 1,
        getNation: id => nations.find(n => n.id === id),
        getNations: () => nations,
        rng,
      }),
    );

    act(() => {
      const outcome = result.current.launchAttack('player', 'target');
      expect(outcome.executed).toBe(true);
      expect(outcome.success).toBe(true);
      expect(outcome.detected).toBe(false);
    });

    expect(target.intel).toBe(5); // drained by seven from initial 12
    expect(target.cyber?.readiness).toBeLessThan(60);
  });

  it('supports attribution logic for false flag intrusions', () => {
    const attacker = createNation('player', {
      cyber: { ...createDefaultNationCyberProfile(), readiness: 80, offense: 70, detection: 35 },
      researched: { cyber_ids: true },
    });
    applyCyberResearchUnlock(attacker, 'intrusion_detection');

    const scapegoat = createNation('scapegoat', { isPlayer: false, name: 'Scapegoat' });
    const target = createNation('target', {
      isPlayer: false,
      name: 'Frontier',
      cyber: { ...createDefaultNationCyberProfile(), detection: 60, attribution: 55, readiness: 70 },
      threats: { scapegoat: 40 },
    });
    applyCyberResearchUnlock(target, 'intrusion_detection');

    const nations = [attacker, target, scapegoat];
    const defconShift = vi.fn();
    const rng = rngFrom([0.05, 0.1, 0.1, 0.2]); // success, detected, attributed, false flag succeeds

    const { result } = renderHook(() =>
      useCyberWarfare({
        currentTurn: 4,
        getNation: id => nations.find(n => n.id === id),
        getNations: () => nations,
        rng,
        onDefconShift: defconShift,
      }),
    );

    let outcome: ReturnType<typeof result.current.launchFalseFlag>;
    act(() => {
      outcome = result.current.launchFalseFlag('player', 'target');
    });

    expect(outcome!.executed).toBe(true);
    expect(outcome!.falseFlag).toBe(true);
    expect(outcome!.attributedTo).toBe('scapegoat');
    expect(target.threats?.scapegoat).toBeGreaterThan(0);
    expect(defconShift).toHaveBeenCalledWith(-1, expect.stringContaining('Scapegoat'));
  });

  it('guards cyber actions on readiness and regenerates between turns', () => {
    const attacker = createNation('player', {
      cyber: { ...createDefaultNationCyberProfile(), readiness: 20 },
    });
    const nations = [attacker];

    const { result } = renderHook(() =>
      useCyberWarfare({
        currentTurn: 2,
        getNation: id => nations.find(n => n.id === id),
        getNations: () => nations,
      }),
    );

    const initialAvailability = result.current.getActionAvailability('player', 'intrusion');
    expect(initialAvailability.canExecute).toBe(false);
    expect(initialAvailability.reason).toMatch(/readiness/i);

    act(() => {
      result.current.advanceTurn();
    });

    expect(attacker.cyber?.readiness).toBeGreaterThan(20);
    const refreshedAvailability = result.current.getActionAvailability('player', 'intrusion');
    expect(refreshedAvailability.canExecute).toBe(true);
  });
});
