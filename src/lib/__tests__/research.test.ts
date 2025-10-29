import { describe, expect, it } from 'vitest';
import type { Nation } from '@/types/game';
import {
  MIRV_SPLIT_BASE_CHANCE,
  STEALTH_INTERCEPT_MODIFIER,
  calculateBomberInterceptChance,
  getMirvSplitChance,
} from '../research';

const createNation = (researched?: Record<string, boolean>): Nation => ({
  id: 'test',
  isPlayer: false,
  name: 'Testland',
  leader: 'Test Leader',
  lon: 0,
  lat: 0,
  color: '#fff',
  population: 10,
  missiles: 5,
  defense: 6,
  production: 0,
  uranium: 0,
  intel: 0,
  warheads: {},
  morale: 50,
  publicOpinion: 50,
  electionTimer: 10,
  cabinetApproval: 50,
  researched,
});

describe('getMirvSplitChance', () => {
  it('returns zero chance before MIRV research completes', () => {
    const nation = createNation();
    expect(getMirvSplitChance(nation, false)).toBe(0);
  });

  it('returns the base MIRV chance after research completes', () => {
    const nation = createNation({ mirv: true });
    expect(getMirvSplitChance(nation, false)).toBe(MIRV_SPLIT_BASE_CHANCE);
  });

  it('does not apply MIRV chance to already split payloads', () => {
    const nation = createNation({ mirv: true });
    expect(getMirvSplitChance(nation, true)).toBe(0);
  });
});

describe('calculateBomberInterceptChance', () => {
  it('uses the unmodified defense ratio before stealth research', () => {
    const origin = createNation();
    expect(calculateBomberInterceptChance(12, origin)).toBeCloseTo(1);
  });

  it('applies the stealth modifier only after research completion', () => {
    const origin = createNation({ stealth: true });
    const chance = calculateBomberInterceptChance(12, origin);
    expect(chance).toBeCloseTo(STEALTH_INTERCEPT_MODIFIER);
  });
});
