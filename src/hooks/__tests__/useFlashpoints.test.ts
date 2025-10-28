import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { calculateFlashpointProbability, useFlashpoints } from '../useFlashpoints';

describe('useFlashpoints', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null when the random roll exceeds the trigger probability', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const { result } = renderHook(() => useFlashpoints());

    let flashpoint = null;
    act(() => {
      flashpoint = result.current.triggerRandomFlashpoint(10, 5);
    });

    expect(randomSpy).toHaveBeenCalled();
    expect(flashpoint).toBeNull();
    expect(result.current.activeFlashpoint).toBeNull();
  });

  it('triggers and resolves flashpoints deterministically and tracks history', () => {
    const randomSpy = vi.spyOn(Math, 'random');
    const { result } = renderHook(() => useFlashpoints());

    // Trigger a flashpoint by ensuring the first random roll falls under the calculated probability
    randomSpy.mockReturnValueOnce(0.05); // Probability check
    randomSpy.mockReturnValueOnce(0); // Select the first template deterministically

    let triggeredFlashpoint = null;
    act(() => {
      triggeredFlashpoint = result.current.triggerRandomFlashpoint(100, 1);
    });

    expect(triggeredFlashpoint).not.toBeNull();
    expect(result.current.activeFlashpoint).toEqual(triggeredFlashpoint);

    const successOption =
      triggeredFlashpoint!.options.find(option => option.outcome.probability > 0) ?? triggeredFlashpoint!.options[0];
    const successRoll = Math.max(successOption.outcome.probability - 1e-6, 0);

    randomSpy.mockReturnValueOnce(successRoll);

    let successResolution;
    act(() => {
      successResolution = result.current.resolveFlashpoint(successOption.id, triggeredFlashpoint!);
    });

    expect(successResolution.success).toBe(true);
    expect(result.current.flashpointHistory).toHaveLength(1);
    expect(result.current.flashpointHistory[0]).toMatchObject({
      choice: successOption.id,
      result: 'success'
    });
    expect(result.current.activeFlashpoint).toBeNull();

    // Trigger another flashpoint to test failure handling and history tracking
    randomSpy.mockReturnValueOnce(0.01);
    randomSpy.mockReturnValueOnce(0.5);

    let secondFlashpoint = null;
    act(() => {
      secondFlashpoint = result.current.triggerRandomFlashpoint(100, 1);
    });

    expect(secondFlashpoint).not.toBeNull();
    expect(result.current.activeFlashpoint).toEqual(secondFlashpoint);

    const failureOption =
      secondFlashpoint!.options.find(option => option.outcome.probability < 1) ?? secondFlashpoint!.options[0];
    const failureRoll = Math.min(failureOption.outcome.probability + 0.1, 0.99);

    randomSpy.mockReturnValueOnce(failureRoll);

    let failureResolution;
    act(() => {
      failureResolution = result.current.resolveFlashpoint(failureOption.id, secondFlashpoint!);
    });

    expect(failureResolution.success).toBe(false);
    expect(result.current.flashpointHistory).toHaveLength(2);
    expect(result.current.flashpointHistory[1]).toMatchObject({
      choice: failureOption.id,
      result: 'failure'
    });
    expect(result.current.activeFlashpoint).toBeNull();
  });
});

describe('calculateFlashpointProbability', () => {
  it('aligns with documented scaling factors', () => {
    const lowTurnLowTension = calculateFlashpointProbability(10, 5);
    const highTurnHighTension = calculateFlashpointProbability(100, 1);

    expect(lowTurnLowTension).toBeCloseTo(0.02 * (6 - 5) * (10 / 50));
    expect(highTurnHighTension).toBeCloseTo(0.02 * (6 - 1) * 2); // turn multiplier capped at 2
    expect(highTurnHighTension).toBeGreaterThan(lowTurnLowTension);
  });

  it('clamps probability within the 0-1 range and normalizes inputs', () => {
    expect(calculateFlashpointProbability(-5, 10)).toBe(0); // negative turns treated as zero

    const clampedHigh = calculateFlashpointProbability(5000, -3);
    expect(clampedHigh).toBeLessThanOrEqual(1);
    expect(clampedHigh).toBeGreaterThanOrEqual(0);
    expect(clampedHigh).toBeCloseTo(0.02 * (6 - 1) * 2); // defcon and turn values are normalized
  });
});
