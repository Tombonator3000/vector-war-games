import { describe, expect, it } from 'vitest';
import { hasSurvivedCampaign, isApproachingSurvivalVictory } from '@/utils/survivalVictory.utils';

describe('survival victory uses the population unit of the simulation', () => {
  it('awards survival at turn 50 with 50 million people', () => {
    expect(hasSurvivedCampaign(50, 50)).toBe(true);
    expect(hasSurvivedCampaign(50, 49.9)).toBe(false);
    expect(hasSurvivedCampaign(49, 186)).toBe(false);
  });

  it('warns only during the last ten turns before victory', () => {
    expect(isApproachingSurvivalVictory(39, 186)).toBe(false);
    expect(isApproachingSurvivalVictory(40, 186)).toBe(true);
    expect(isApproachingSurvivalVictory(49, 50)).toBe(true);
    expect(isApproachingSurvivalVictory(50, 50)).toBe(false);
    expect(isApproachingSurvivalVictory(40, 49)).toBe(false);
  });

  it('rejects malformed population values', () => {
    expect(hasSurvivedCampaign(50, NaN)).toBe(false);
    expect(hasSurvivedCampaign(50, Infinity)).toBe(false);
  });
});
