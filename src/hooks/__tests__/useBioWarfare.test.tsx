import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import type { ReactNode } from 'react';
import { RNGProvider } from '@/contexts/RNGContext';
import { useBioWarfare } from '../useBioWarfare';

describe('useBioWarfare defensive research', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    if (typeof window !== 'undefined') {
      window.__bioDefenseStats = undefined;
    }
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <RNGProvider initialSeed={42}>{children}</RNGProvider>
  );

  it('applies vaccine countermeasure when vaccine research unlocks', () => {
    const addNews = vi.fn();
    const { result } = renderHook(() => useBioWarfare(addNews), { wrapper });

    act(() => {
      result.current.selectPlagueType('bacteria');
      result.current.addDNAPoints({ amount: 30, reason: 'milestone' });
      result.current.triggerBioWarfare({ severity: 'moderate', origin: 'bio-terror' });
    });

    act(() => {
      result.current.evolveNode({ nodeId: 'drug-resistance-1' });
    });
    act(() => {
      result.current.evolveNode({ nodeId: 'vaccine-prototyping' });
    });

    expect(result.current.plagueState.calculatedStats.vaccineAcceleration).toBe(12);
    expect(window.__bioDefenseStats?.vaccineAcceleration ?? 0).toBe(12);
  });

  it('updates fallout mitigation when shielding research unlocks', () => {
    const addNews = vi.fn();
    const { result } = renderHook(() => useBioWarfare(addNews), { wrapper });

    act(() => {
      result.current.selectPlagueType('bacteria');
      result.current.addDNAPoints({ amount: 40, reason: 'milestone' });
    });

    act(() => {
      result.current.evolveNode({ nodeId: 'genetic-hardening-1' });
      result.current.evolveNode({ nodeId: 'radiation-shielding-1' });
    });

    expect(result.current.plagueState.calculatedStats.radiationMitigation).toBeCloseTo(0.2, 5);
    expect(window.__bioDefenseStats?.radiationMitigation ?? 0).toBeCloseTo(
      result.current.plagueState.calculatedStats.radiationMitigation,
      5,
    );
  });
});
