import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { applyRemoteGameStateSync } from '../coopSync';
import GameStateManager from '@/state/GameStateManager';
import { SCENARIOS } from '@/types/scenario';
import { useFlashpoints } from '@/hooks/useFlashpoints';

vi.mock('@/contexts/RNGContext', () => {
  const rng = {
    next: () => Math.random(),
    nextInt: (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min,
    choice: <T>(array: T[]) => {
      if (array.length === 0) {
        throw new Error('Cannot choose from empty array');
      }
      const index = Math.floor(Math.random() * array.length);
      return array[index];
    },
  };

  return {
    useRNG: () => ({ rng }),
  };
});

const getFreshState = () => ({
  ...GameStateManager.getState(),
});

describe('applyRemoteGameStateSync', () => {
  beforeEach(() => {
    GameStateManager.reset();
  });
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('keeps window and legacy consumers attached to the authoritative state', () => {
    const originalState = GameStateManager.getState();
    const synchronized = applyRemoteGameStateSync({ turn: 7 });

    expect(synchronized).toBe(originalState);
    expect((window as Window & { S?: unknown }).S).toBe(originalState);
    expect(synchronized.missiles).toEqual([]);
    expect(synchronized.statistics?.nonPandemicCasualties).toBe(0);
    originalState.turn = 8;
    expect(synchronized.turn).toBe(8);
  });

  it('isolates nested remote campaign and nation state from local mutations', () => {
    const remote = {
      ...getFreshState(),
      scenario: SCENARIOS.cubanCrisis,
      nations: [{
        id: 'player', isPlayer: true, name: 'Player', leader: 'Leader', lon: 0, lat: 0,
        color: '#fff', population: 100, missiles: 2, defense: 3, production: 25,
        uranium: 15, intel: 10, warheads: { 10: 3 }, morale: 70, publicOpinion: 65,
        electionTimer: 4, cabinetApproval: 60, researched: { warhead_20: true },
      }],
    };

    const synchronized = applyRemoteGameStateSync(remote);
    synchronized.nations[0].warheads[10] = 0;
    synchronized.nations[0].researched!.warhead_20 = false;
    synchronized.scenario!.timeConfig.unitsPerTurn = 99;

    expect(remote.nations[0].warheads[10]).toBe(3);
    expect(remote.nations[0].researched.warhead_20).toBe(true);
    expect(remote.scenario.timeConfig.unitsPerTurn).toBe(1);
  });

  it('re-exposes the synchronized scenario so flashpoints observe the remote import', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);

    const initialState = {
      ...getFreshState(),
      scenario: SCENARIOS.coldWar,
    };

    (window as any).S = initialState;
    GameStateManager.setState(initialState);
    localStorage.setItem('norad_selected_scenario', 'coldWar');

    const { result } = renderHook(() => useFlashpoints());

    const remoteState = {
      ...initialState,
      scenario: SCENARIOS.cubanCrisis,
    };

    act(() => {
      applyRemoteGameStateSync(remoteState);
    });

    let synchronizedFlashpoint;
    act(() => {
      synchronizedFlashpoint = result.current.triggerRandomFlashpoint(2, 2);
    });

    expect((window as any).S.scenario?.id).toBe('cubanCrisis');
    expect(GameStateManager.getState().scenario?.id).toBe('cubanCrisis');
    expect(synchronizedFlashpoint?.id).toBe('excomm-enhanced-1');
  });
});

