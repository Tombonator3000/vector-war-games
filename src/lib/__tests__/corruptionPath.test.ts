import { describe, expect, it } from 'vitest';

import { generateInstitutionBenefits, infiltrateInstitution } from '../corruptionPath';
import type { InfluenceNode } from '../corruptionPath';
import type { RegionalState } from '@/types/greatOldOnes';
import type { RegionalMorale } from '@/types/regionalMorale';
import { SeededRandom } from '../seededRandom';
import type { GreatOldOnesState } from '@/types/greatOldOnes';
import { initializePhase2State, processPhase2Turn } from '@/lib/phase2Integration';

const makeState = (region: RegionalState): GreatOldOnesState => ({
  active: true,
  doctrine: 'corruption',
  resources: {
    sanityFragments: 100,
    eldritchPower: 200,
    veilIntegrity: 80,
    corruptionIndex: 50,
  },
  limits: {
    maxSanityFragments: 500,
    maxEldritchPower: 500,
    eldritchPowerDecayRate: 5,
  },
  regions: [region],
  council: { members: [], currentAgenda: null, pendingVotes: [], unity: 80 },
  cultistCells: [],
  summonedEntities: [],
  investigators: [],
  veil: {
    integrity: 80,
    status: 'hidden',
    publicAwareness: 10,
    emergencyPowers: false,
    mediaCoverage: 10,
  },
  alignment: {
    turn: 1,
    lunarPhase: 0,
    planetaryAlignment: 10,
    celestialEvents: [],
    ritualPowerModifier: 0,
  },
  activeOperations: [],
  missionLog: [],
  campaignProgress: {
    currentAct: 1,
    missionsCompleted: [],
    actUnlocked: [true, false, false],
  },
});

describe('generateInstitutionBenefits', () => {
  it('enhances government influence in compromised regions', () => {
    const region: RegionalState = {
      regionId: 'r1',
      regionName: 'Eurasia',
      sanitySanity: 80,
      corruption: 72,
      cultistCells: 0,
      investigationHeat: 20,
      ritualSites: [],
      culturalTraits: ['urban'],
      recentEvents: [],
    };

    const benefits = generateInstitutionBenefits('government', region);
    const resource = benefits.find(b => b.type === 'resource_generation');
    const suppression = benefits.find(b => b.type === 'investigation_suppression');

    expect(resource?.value).toBe(20);
    expect(suppression?.value).toBe(16);
  });

  it('responds to low morale media environments', () => {
    const moraleRegion: RegionalMorale = {
      territoryId: 't-1',
      morale: 28,
      lastEventTurn: 0,
      lastMoraleChange: -5,
      historicalMorale: [],
      protests: null,
      strikes: null,
      refugeeInflux: 0,
    };

    const benefits = generateInstitutionBenefits('media', moraleRegion);
    const recruitment = benefits.find(b => b.type === 'cultist_recruitment');

    expect(recruitment?.value).toBe(18);
  });
});

describe('infiltrateInstitution benefit assignment', () => {
  it('creates nodes with context-aware benefits on success', () => {
    const region: RegionalState = {
      regionId: 'r2',
      regionName: 'Pacifica',
      sanitySanity: 75,
      corruption: 65,
      cultistCells: 0,
      investigationHeat: 25,
      ritualSites: [],
      culturalTraits: ['urban', 'academic'],
      recentEvents: [],
    };

    const state = makeState(region);
    const rng = new SeededRandom(1);
    const result = infiltrateInstitution('media', region.regionId, 20, 200, state, rng);

    expect(result.success).toBe(true);
    expect(result.node?.benefits.length).toBeGreaterThan(0);
    expect(result.node?.benefits.some(b => b.type === 'cultist_recruitment')).toBe(true);
  });
});

describe('Phase 2 corruption benefit processing', () => {
  it('applies influence node benefits during phase tick', () => {
    const region: RegionalState = {
      regionId: 'r-benefit',
      regionName: 'Testonia',
      sanitySanity: 78,
      corruption: 55,
      cultistCells: 0,
      investigationHeat: 40,
      ritualSites: [],
      culturalTraits: [],
      recentEvents: [],
    };

    const state = makeState(region);
    const phase2State = initializePhase2State();
    phase2State.unlocked = true;
    phase2State.corruption.influenceNetwork.nodes = [
      {
        id: 'influence-node',
        institutionType: 'government',
        regionId: region.regionId,
        name: 'Test Node',
        corruptionLevel: 60,
        compromisedIndividuals: [],
        sleeperCells: 2,
        benefits: [
          { type: 'resource_generation', value: 10, description: 'Divert budgets' },
          { type: 'cultist_recruitment', value: 6, description: 'Recruit insiders' },
          { type: 'ritual_support', value: 4, description: 'Provide logistics' },
          { type: 'veil_protection', value: 5, description: 'Suppress leaks' },
        ],
        exposureRisk: 8,
        underInvestigation: false,
      } satisfies InfluenceNode,
    ];

    const { stateChanges } = processPhase2Turn(state, phase2State);

    expect(stateChanges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'sanity_fragments', value: 10 }),
        expect.objectContaining({ type: 'cultist_recruitment', value: 6 }),
        expect.objectContaining({ type: 'corruption_gain', value: 4 }),
        expect.objectContaining({ type: 'veil_damage', value: -5 }),
      ])
    );
  });
});
