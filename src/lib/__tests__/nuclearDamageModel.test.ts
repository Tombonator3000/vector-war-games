import { describe, it, expect } from 'vitest';
import { calculateNuclearImpact, applyNuclearImpactToNation } from '@/lib/nuclearDamageModel';
import type { Nation } from '@/types/game';

function createMockNation(overrides: Partial<Nation> = {}): Nation {
  return {
    id: 'test',
    isPlayer: false,
    name: 'Testland',
    leader: 'Test Leader',
    lon: 0,
    lat: 0,
    color: '#fff',
    population: 120,
    missiles: 24,
    defense: 3,
    production: 90,
    uranium: 40,
    intel: 10,
    warheads: {},
    morale: 55,
    publicOpinion: 50,
    electionTimer: 12,
    cabinetApproval: 48,
    instability: 10,
    ...overrides,
  } as Nation;
}

describe('nuclearDamageModel', () => {
  it('generates multi-stage humanitarian and environmental fallout', () => {
    const result = calculateNuclearImpact({
      yieldMT: 75,
      defense: 2,
      population: 150,
      cities: 14,
      production: 110,
      missiles: 28,
      bombers: 12,
      submarines: 6,
      uranium: 55,
      nationName: 'Aurora Republic',
    });

    expect(result.stageReports).toHaveLength(3);
    expect(result.totalCasualties).toBeGreaterThan(0);
    expect(result.totalCityLosses).toBeGreaterThan(0);
    expect(result.productionLoss).toBeGreaterThan(0);
    expect(result.winterDelta).toBeGreaterThan(0);
    expect(result.radiationDelta).toBeGreaterThan(0);
    expect(result.humanitarianSummary).toMatch(/dead/i);
    expect(result.environmentalSummary).toMatch(/nuclear winter/i);
    expect(result.overlayMessage).toMatch(/Aurora Republic/);
  });

  it('applies calculated impact to a nation with refugees and instability', () => {
    const nation = createMockNation({ cities: 10, bombers: 10, submarines: 4 });
    const impact = calculateNuclearImpact({
      yieldMT: 60,
      defense: nation.defense,
      population: nation.population,
      cities: nation.cities,
      production: nation.production,
      missiles: nation.missiles,
      bombers: nation.bombers,
      submarines: nation.submarines,
      uranium: nation.uranium,
      nationName: nation.name,
    });

    const initialPopulation = nation.population;
    const initialProduction = nation.production;
    const initialMissiles = nation.missiles;
    const initialInstability = nation.instability ?? 0;

    expect(impact.totalRefugees).toBeGreaterThan(0);

    applyNuclearImpactToNation(nation, impact);

    expect(nation.population).toBeLessThan(initialPopulation);
    expect(nation.production).toBeLessThan(initialProduction);
    expect(nation.missiles).toBeLessThan(initialMissiles);
    expect((nation.instability ?? 0)).toBeGreaterThan(initialInstability);
    expect(nation.migrantsThisTurn ?? 0).toBeGreaterThanOrEqual(impact.totalRefugees);
    expect(nation.migrantsTotal ?? 0).toBeGreaterThanOrEqual(impact.totalRefugees);
    expect(nation.defense).toBeLessThan(3);
  });
});
