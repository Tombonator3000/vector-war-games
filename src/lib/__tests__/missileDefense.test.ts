import { describe, expect, it } from 'vitest';
import {
  calculateMissileInterceptChance,
  MAX_MISSILE_INTERCEPT_CHANCE,
} from '@/lib/missileDefense';

describe('calculateMissileInterceptChance', () => {
  it('returns zero when no defenses are present', () => {
    const breakdown = calculateMissileInterceptChance(0);
    expect(breakdown.totalChance).toBe(0);
    expect(breakdown.baseChance).toBe(0);
    expect(breakdown.allyChances).toEqual([]);
  });

  it('caps total interception chance at the maximum threshold', () => {
    const breakdown = calculateMissileInterceptChance(80, [60, 40]);
    expect(breakdown.totalChance).toBeLessThanOrEqual(MAX_MISSILE_INTERCEPT_CHANCE);
    expect(breakdown.totalChance).toBeCloseTo(MAX_MISSILE_INTERCEPT_CHANCE, 5);
  });

  it('scales allied contributions proportionally when the cap is reached', () => {
    const breakdown = calculateMissileInterceptChance(50, [30, 20]);
    const sumOfParts = breakdown.baseChance + breakdown.allyChances.reduce((sum, value) => sum + value, 0);

    expect(sumOfParts).toBeCloseTo(breakdown.totalChance, 6);
    expect(breakdown.allyChances.length).toBe(2);
    expect(breakdown.allyChances[0]).toBeGreaterThan(0);
    expect(breakdown.allyChances[1]).toBeGreaterThan(0);
  });
});
