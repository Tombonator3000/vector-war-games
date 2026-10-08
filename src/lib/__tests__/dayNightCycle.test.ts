import { describe, expect, it } from 'vitest';
import { getDayNightBlendForTurn } from '../dayNightCycle';

describe('four turn lighting cycle', () => {
  it('reaches full night and repeats without skipping dawn', () => {
    expect(Array.from({ length: 8 }, (_, index) => getDayNightBlendForTurn(index + 1)))
      .toEqual([0, 0.5, 1, 0.5, 0, 0.5, 1, 0.5]);
  });
  it('falls back to day for invalid saved turn values', () => {
    expect(getDayNightBlendForTurn(NaN)).toBe(0);
    expect(getDayNightBlendForTurn(Infinity)).toBe(0);
  });
});
