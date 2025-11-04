import { describe, expect, it } from 'vitest';

import { migrateToUnifiedRelationship } from '@/lib/unifiedDiplomacyMigration';
import type { Nation } from '@/types/game';

function createNation(overrides: Partial<Nation> = {}): Nation {
  return {
    id: 'origin',
    name: 'Origin',
    leader: 'Test Leader',
    isPlayer: false,
    lon: 0,
    lat: 0,
    color: '#00ffff',
    population: 200,
    missiles: 2,
    defense: 1,
    production: 0,
    uranium: 0,
    intel: 0,
    warheads: {},
    morale: 50,
    publicOpinion: 50,
    electionTimer: 10,
    cabinetApproval: 50,
    ...overrides,
  };
}

const baseIncome = {
  baseIncome: 5,
  fromAlliances: 0,
  fromCouncilSeat: 0,
  fromMediation: 0,
  fromPeaceYears: 0,
  total: 5,
};

describe('migrateToUnifiedRelationship', () => {
  it('uses modern trust, favor, and DIP fields when calculating relationship', () => {
    const nation = createNation({
      trustRecords: {
        ally: { value: 80, lastUpdated: 1, history: [] },
      } as any,
      favorBalances: {
        ally: { value: 20, lastUpdated: 2, history: [] },
      } as any,
      diplomaticInfluence: {
        points: 95,
        capacity: 200,
        perTurnIncome: baseIncome,
        history: [],
      },
    });

    const relationship = migrateToUnifiedRelationship(nation, 'ally');
    // Trust (80) => +60, favors (20) => +10, DIP (95) => +4
    expect(relationship).toBe(74);
  });

  it('falls back to legacy trust, favor, and DIP fields when present', () => {
    const nation = createNation({
      trustRecords: {
        ally: { score: 70, lastUpdated: 1, history: [] },
      } as any,
      favorBalances: {
        ally: { balance: -30, lastUpdated: 1, history: [] },
      } as any,
      diplomaticInfluence: {
        currentDIP: 120,
        capacity: 200,
        perTurnIncome: baseIncome,
        history: [],
      } as any,
    });

    const relationship = migrateToUnifiedRelationship(nation, 'ally');
    // Trust (70) => +40, favors (-30) => -15, DIP (120) => +7
    expect(relationship).toBe(32);
  });
});
