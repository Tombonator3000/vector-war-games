import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SeededRandom } from '@/lib/seededRandom';
import { useFogOfWar } from '../useFogOfWar';

const baseConfig = {
  baseAccuracy: 0.5,
  satelliteCoverage: false,
  deepReconActive: false,
  counterintelActive: false,
};

describe('useFogOfWar', () => {
  it('produces repeatable intel noise with the same RNG seed', () => {
    const rngA = new SeededRandom(1337);
    const rngB = new SeededRandom(1337);

    const { result: first } = renderHook(() => useFogOfWar(rngA));
    const { result: second } = renderHook(() => useFogOfWar(rngB));

    const noiseA = first.current.applyIntelNoise(120, baseConfig);
    const noiseB = second.current.applyIntelNoise(120, baseConfig);

    expect(noiseA).toEqual(noiseB);
  });

  it('uses injected RNG to select the same false intel for identical seeds', () => {
    const rngA = new SeededRandom(2048);
    const rngB = new SeededRandom(2048);

    const { result: first } = renderHook(() => useFogOfWar(rngA));
    const { result: second } = renderHook(() => useFogOfWar(rngB));

    const intelA = first.current.generateFalseIntel(baseConfig);
    const intelB = second.current.generateFalseIntel(baseConfig);

    expect(intelA).toEqual(intelB);
  });

  it('returns different noise outputs when seeds diverge', () => {
    const { result: first } = renderHook(() => useFogOfWar(new SeededRandom(1)));
    const { result: second } = renderHook(() => useFogOfWar(new SeededRandom(9999)));

    const noiseA = first.current.applyIntelNoise(200, baseConfig);
    const noiseB = second.current.applyIntelNoise(200, baseConfig);

    expect(noiseA.reported).not.toEqual(noiseB.reported);
  });
});
