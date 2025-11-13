import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { SeededRandom } from '@/lib/seededRandom';
import { usePandemic } from '../usePandemic';

describe('usePandemic bio-warfare traits', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('upgrades, downgrades, and resets trait loadouts with resource tracking', () => {
    const addNews = vi.fn();
    const rng = new SeededRandom(1);
    const { result } = renderHook(() => usePandemic(addNews, rng));

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
    const baseRng = new SeededRandom(1234);
    const baseHook = renderHook(() => usePandemic(addNews, baseRng));
    act(() => {
      baseHook.result.current.triggerPandemic({ severity: 'moderate', origin: 'bio-terror' });
    });
    const baselineInfection = baseHook.result.current.pandemicState.globalInfection;
    const baselineLethality = baseHook.result.current.pandemicState.lethality;

    const traitRng = new SeededRandom(1234);
    const traitHook = renderHook(() => usePandemic(addNews, traitRng));
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
  });

  it('tracks casualties over turns and resolves when countermeasures succeed', () => {
    const addNews = vi.fn();
    const rng = new SeededRandom(2024);
    const { result } = renderHook(() => usePandemic(addNews, rng));

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

    let firstResolution;
    act(() => {
      firstResolution = result.current.advancePandemicTurn({ turn: 1, defcon: 3, playerPopulation: 600 });
    });

    expect(firstResolution?.effect).toBeTruthy();
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
  });

  it('produces identical progression for identical seeds', () => {
    const addNewsA = vi.fn();
    const addNewsB = vi.fn();
    const seed = 314159;
    const rngA = new SeededRandom(seed);
    const rngB = new SeededRandom(seed);

    const firstHook = renderHook(() => usePandemic(addNewsA, rngA));
    const secondHook = renderHook(() => usePandemic(addNewsB, rngB));

    act(() => {
      firstHook.result.current.triggerPandemic({ severity: 'moderate', origin: 'bio-terror' });
      secondHook.result.current.triggerPandemic({ severity: 'moderate', origin: 'bio-terror' });
    });

    for (let turn = 1; turn <= 4; turn += 1) {
      act(() => {
        firstHook.result.current.advancePandemicTurn({ turn, defcon: 3, playerPopulation: 600 });
        secondHook.result.current.advancePandemicTurn({ turn, defcon: 3, playerPopulation: 600 });
      });

      expect(firstHook.result.current.pandemicState).toEqual(secondHook.result.current.pandemicState);
    }

    expect(addNewsA.mock.calls).toEqual(addNewsB.mock.calls);
  });
});
