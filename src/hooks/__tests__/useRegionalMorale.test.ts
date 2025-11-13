import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { useRegionalMorale } from '../useRegionalMorale';

const baseTerritories = [
  {
    id: 'territory-1',
    name: 'Territory 1',
    controllingNationId: 'nation-1',
    neighbors: [],
    strategicValue: 1,
  },
];

describe('useRegionalMorale civil war risk scaling', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('ramps nation civil war risk when unrest persists across multiple turns', async () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99);

    const { result, rerender } = renderHook(
      ({ currentTurn }) =>
        useRegionalMorale({
          territories: baseTerritories,
          currentTurn,
        }),
      {
        initialProps: { currentTurn: 0 },
      }
    );

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.startProtest('territory-1', ['low_morale']);
    });

    await act(async () => {
      result.current.processTurnUpdates();
      await Promise.resolve();
    });

    const activeProtest = result.current.getTerritoryMoraleData('territory-1')?.protests;
    expect(activeProtest).toBeTruthy();

    const singleTurnDuration = result.current.territoryUnrestDuration.get('territory-1') ?? 0;
    expect(singleTurnDuration).toBeGreaterThanOrEqual(1);

    const singleTurnRisk = result.current.calculateNationCivilWarRisk('nation-1', 45, 40);
    expect(singleTurnRisk.turnsAtRisk).toBe(singleTurnDuration);

    // Advance several more turns with persistent unrest
    for (let turn = 1; turn <= 3; turn++) {
      rerender({ currentTurn: turn });
      await act(async () => {
        result.current.processTurnUpdates();
        await Promise.resolve();
      });
    }

    const sustainedRisk = result.current.calculateNationCivilWarRisk('nation-1', 45, 40);

    expect(sustainedRisk.turnsAtRisk).toBeGreaterThan(singleTurnRisk.turnsAtRisk);
    expect(sustainedRisk.riskLevel).toBeGreaterThan(singleTurnRisk.riskLevel);

    randomSpy.mockRestore();
  });
});
