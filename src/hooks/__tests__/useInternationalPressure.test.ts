import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useInternationalPressure } from '../useInternationalPressure';
import type { InternationalResolution } from '../../types/regionalMorale';

describe('useInternationalPressure', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('finalizes abstention-only resolutions without warnings and keeps the resolution pending', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() =>
      useInternationalPressure({
        currentTurn: 1,
      })
    );

    let resolution: InternationalResolution;
    act(() => {
      resolution = result.current.proposeResolution('condemnation', 'test-nation', [], { legitimacy: -5 }, 3);
    });

    act(() => {
      result.current.voteOnResolution(resolution.id, 'observer', 'abstain');
    });

    let finalizeResult;
    act(() => {
      finalizeResult = result.current.finalizeResolution(resolution.id);
    });

    expect(finalizeResult.passed).toBe(false);

    const storedResolution = result.current.resolutions.find((item) => item.id === resolution.id);
    expect(storedResolution).toBeDefined();
    expect(storedResolution?.passed).toBe(false);
    expect(storedResolution).not.toBe(resolution);
    expect(storedResolution?.turnsRemaining).toBe(3);

    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
