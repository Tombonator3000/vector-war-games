import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

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
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
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
