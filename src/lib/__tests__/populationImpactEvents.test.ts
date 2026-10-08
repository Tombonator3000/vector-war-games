import { describe, expect, it, vi } from 'vitest';
import { reportPopulationImpact, subscribePopulationImpacts } from '../populationImpactEvents';

describe('population impact feedback', () => {
  it('safely reports casualties with no React subscriber mounted', () => {
    expect(() => reportPopulationImpact(1_000_000, 'Test nation')).not.toThrow();
  });

  it('delivers the casualty count and unsubscribes on unmount', () => {
    const listener = vi.fn();
    const unsubscribe = subscribePopulationImpacts(listener);
    reportPopulationImpact(500_000, 'Test nation');
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ casualties: 500_000, targetName: 'Test nation' }));
    unsubscribe();
    reportPopulationImpact(500_000, 'Another nation');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('does not show empty or invalid casualty messages', () => {
    const listener = vi.fn();
    const unsubscribe = subscribePopulationImpacts(listener);
    for (const value of [0, -1, NaN, Infinity]) reportPopulationImpact(value, 'Test nation');
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });
});
