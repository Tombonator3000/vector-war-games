import { describe, expect, it } from 'vitest';

import { PopSystemManager } from '@/lib/popSystemManager';
import type { PopGroup } from '@/types/popSystem';

let sequence = 0;

function createPopGroup(overrides: Partial<PopGroup> = {}): PopGroup {
  return {
    id: overrides.id ?? `pop-${sequence += 1}`,
    size: overrides.size ?? 40,
    origin: overrides.origin ?? 'Testland',
    loyalty: overrides.loyalty ?? 50,
    culture: overrides.culture ?? 'test',
    skills: overrides.skills ?? 'medium',
    assimilation: overrides.assimilation ?? 45,
    happiness: overrides.happiness ?? 55,
    yearsSinceArrival: overrides.yearsSinceArrival ?? 5,
    ideologyPreference: overrides.ideologyPreference,
    ideologySupport: overrides.ideologySupport,
  };
}

describe('PopSystemManager.applyCasualties', () => {
  it('distributes casualties across population groups and preserves totals', () => {
    const popGroups: PopGroup[] = [
      createPopGroup({ id: 'alpha', size: 60 }),
      createPopGroup({ id: 'bravo', size: 40 }),
    ];

    const applied = PopSystemManager.applyCasualties(popGroups, 20);

    expect(applied).toBeCloseTo(20, 5);
    expect(popGroups[0].size).toBeCloseTo(48, 5);
    expect(popGroups[1].size).toBeCloseTo(32, 5);
    expect(PopSystemManager.getTotalPopulation(popGroups)).toBeCloseTo(80, 5);
  });

  it('caps casualties at the remaining population', () => {
    const popGroups: PopGroup[] = [
      createPopGroup({ id: 'alpha', size: 15 }),
      createPopGroup({ id: 'bravo', size: 5 }),
    ];

    const applied = PopSystemManager.applyCasualties(popGroups, 50);

    expect(applied).toBeCloseTo(20, 5);
    expect(PopSystemManager.getTotalPopulation(popGroups)).toBe(0);
    expect(popGroups.every(pop => pop.size === 0)).toBe(true);
  });
});
