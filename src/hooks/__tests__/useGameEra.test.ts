import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useGameEra } from '../useGameEra';
import { SCENARIOS } from '@/types/scenario';

describe('useGameEra', () => {
  it('returns metadata arrays for Great Old Ones without throwing', () => {
    const { result } = renderHook(() =>
      useGameEra({ currentTurn: 26, scenario: SCENARIOS.greatOldOnes })
    );

    expect(() => result.current.getLockedFeatures()).not.toThrow();
    const locked = result.current.getLockedFeatures();
    expect(Array.isArray(locked)).toBe(true);
    expect(locked.every((info) => info && typeof info.feature === 'string')).toBe(true);

    expect(() => result.current.getNewlyUnlockedFeatures()).not.toThrow();
    const newlyUnlocked = result.current.getNewlyUnlockedFeatures();
    expect(Array.isArray(newlyUnlocked)).toBe(true);
    expect(newlyUnlocked.every((info) => info && typeof info.feature === 'string')).toBe(true);
  });
});
