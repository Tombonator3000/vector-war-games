import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { usePandemic } from '../usePandemic';

describe('usePandemic bio-warfare traits', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('upgrades, downgrades, and resets trait loadouts with resource tracking', () => {
    const addNews = vi.fn();
    const { result } = renderHook(() => usePandemic(addNews));

    expect(result.current.pandemicState.labResources).toBe(8);

    act(() => {
      result.current.upgradeTrait('transmission');
    });

    expect(result.current.pandemicState.traitLoadout.transmission).toBe(1);
    expect(result.current.pandemicState.labResources).toBe(5);

    act(() => {
      result.current.downgradeTrait('transmission');
    });

    expect(result.current.pandemicState.traitLoadout.transmission).toBe(0);
    expect(result.current.pandemicState.labResources).toBe(8);

    act(() => {
      result.current.upgradeTrait('transmission');
      result.current.upgradeTrait('stealth');
    });

    expect(result.current.pandemicState.traitLoadout).toMatchObject({
      transmission: 1,
      stealth: 1,
      lethality: 0
    });

    act(() => {
      result.current.resetTraits();
    });

    expect(result.current.pandemicState.traitLoadout).toMatchObject({
      transmission: 0,
      stealth: 0,
      lethality: 0
    });
    expect(result.current.pandemicState.labResources).toBe(8);
    expect(result.current.pandemicState.activeTraits).toMatchObject({
      transmission: 0,
      stealth: 0,
      lethality: 0
    });
  });

  it('applies deployed traits to pandemic trigger dynamics', () => {
    const addNews = vi.fn();
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.2);

    const baseHook = renderHook(() => usePandemic(addNews));
    act(() => {
      baseHook.result.current.triggerPandemic({ severity: 'moderate', origin: 'bio-terror' });
    });
    const baselineInfection = baseHook.result.current.pandemicState.globalInfection;
    const baselineLethality = baseHook.result.current.pandemicState.lethality;

    const traitHook = renderHook(() => usePandemic(addNews));
    act(() => {
      traitHook.result.current.upgradeTrait('transmission');
      traitHook.result.current.upgradeTrait('lethality');
    });
    act(() => {
      traitHook.result.current.deployTraits();
    });
    act(() => {
      traitHook.result.current.triggerPandemic({ severity: 'moderate', origin: 'bio-terror' });
    });

    expect(traitHook.result.current.pandemicState.globalInfection).toBeGreaterThan(baselineInfection);
    expect(traitHook.result.current.pandemicState.lethality).toBeGreaterThanOrEqual(baselineLethality);

    randomSpy.mockRestore();
  });

  it('tracks casualties over turns and resolves when countermeasures succeed', () => {
    const addNews = vi.fn();
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.15);
    const { result } = renderHook(() => usePandemic(addNews));

    act(() => {
      result.current.upgradeTrait('lethality');
      result.current.upgradeTrait('transmission');
    });
    act(() => {
      result.current.deployTraits();
    });
    act(() => {
      result.current.triggerPandemic({ severity: 'severe', origin: 'bio-terror', initialInfection: 60, initialContainment: 0 });
    });

    const casualtiesBefore = result.current.pandemicState.casualtyTally;

    let firstEffect;
    act(() => {
      firstEffect = result.current.advancePandemicTurn({ turn: 1, defcon: 3, playerPopulation: 600 });
    });

    expect(firstEffect).not.toBeNull();
    expect(result.current.pandemicState.casualtyTally).toBeGreaterThan(casualtiesBefore);

    act(() => {
      result.current.applyCountermeasure({ type: 'containment', value: 90 });
      result.current.applyCountermeasure({ type: 'vaccine', value: 100 });
      result.current.applyCountermeasure({ type: 'suppression', value: 90 });
    });

    let resolveEffect: ReturnType<typeof result.current.advancePandemicTurn> = null;
    let turnIndex = 2;
    while (result.current.pandemicState.active && turnIndex < 6) {
      act(() => {
        resolveEffect = result.current.advancePandemicTurn({
          turn: turnIndex,
          defcon: 3,
          playerPopulation: 600
        });
      });
      turnIndex += 1;
    }

    expect(result.current.pandemicState.active).toBe(false);
    expect(result.current.pandemicState.casualtyTally).toBeGreaterThan(0);

    randomSpy.mockRestore();
  });
});
