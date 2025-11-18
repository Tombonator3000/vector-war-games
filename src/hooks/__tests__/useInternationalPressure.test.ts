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

  it('resets international pressure data between campaign restarts', () => {
    const { result } = renderHook(() =>
      useInternationalPressure({
        currentTurn: 12,
      })
    );

    act(() => {
      result.current.initializePressure('nation-1');
    });

    act(() => {
      result.current.imposeSanctions('nation-1', ['nation-2'], ['trade'], 3, 4);
      result.current.grantAid('nation-1', ['nation-3'], ['economic'], 5, []);
    });

    expect(result.current.sanctions).toHaveLength(1);
    expect(result.current.sanctions[0]?.rationale).toBeTruthy();
    expect(result.current.aidPackages).toHaveLength(1);
    expect(result.current.getPressure('nation-1')?.activeSanctions).toHaveLength(1);
    expect(result.current.getPressure('nation-1')?.activeAid).toHaveLength(1);

    act(() => {
      result.current.reset();
    });

    expect(result.current.resolutions).toHaveLength(0);
    expect(result.current.sanctions).toHaveLength(0);
    expect(result.current.aidPackages).toHaveLength(0);
    expect(result.current.pressureState).toHaveLength(0);
    expect(result.current.getPressure('nation-1')).toBeUndefined();

    act(() => {
      result.current.initializePressure('nation-1');
    });

    const resetPressure = result.current.getPressure('nation-1');
    expect(resetPressure?.activeResolutions).toEqual([]);
    expect(resetPressure?.activeSanctions).toEqual([]);
    expect(resetPressure?.activeAid).toEqual([]);

    act(() => {
      result.current.imposeSanctions('nation-1', ['nation-4'], ['financial'], 2, 3);
      result.current.grantAid('nation-1', ['nation-5'], ['humanitarian'], 2, []);
    });

    expect(result.current.sanctions[0]?.id).toBe('sanction_0');
    expect(result.current.sanctions[0]?.rationale).toBeTruthy();
    expect(result.current.aidPackages[0]?.id).toBe('aid_0');
  });
});
