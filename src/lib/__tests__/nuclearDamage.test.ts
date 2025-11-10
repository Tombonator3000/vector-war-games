import { describe, it, expect } from 'vitest';

import {
  MAX_DEFENSE_LEVEL,
  calculateDefenseDamageMultiplier,
  simulateNuclearStrike,
} from '@/lib/nuclearDamage';

describe('nuclear damage helpers', () => {
  it('caps defense multiplier to keep damage above zero', () => {
    const excessiveDefense = MAX_DEFENSE_LEVEL * 5;
    const multiplier = calculateDefenseDamageMultiplier(excessiveDefense);
    expect(multiplier).toBeGreaterThan(0);
    expect(multiplier).toBeLessThan(1);
  });

  it('simulates high-defense strike with blast and fallout casualties', () => {
    const initialPopulation = 120;
    const { directDamage, falloutDamage, postBlastPopulation, finalPopulation } = simulateNuclearStrike({
      yieldMT: 50,
      defense: MAX_DEFENSE_LEVEL * 2,
      population: initialPopulation,
    });

    expect(directDamage).toBeGreaterThan(0);
    expect(postBlastPopulation).toBeLessThan(initialPopulation);
    expect(falloutDamage).toBeGreaterThan(0);
    expect(finalPopulation).toBeLessThan(postBlastPopulation);
  });
});
