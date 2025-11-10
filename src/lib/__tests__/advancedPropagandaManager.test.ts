import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  initiateRecruitment,
  launchPhobiaCampaign,
  deployReligiousWeapon,
  initializeAdvancedPropagandaState,
} from '../advancedPropagandaManager';
import type { GameState, Nation } from '@/types/game';
import type { AdvancedPropagandaState } from '@/types/advancedPropaganda';

function createNation(overrides: Partial<Nation> = {}): Nation {
  const baseIdeologySupport = {
    democracy: 60,
    authoritarianism: 10,
    communism: 10,
    theocracy: 10,
    technocracy: 10,
  } as const;

  const baseNation: Nation = {
    id: 'nationA',
    isPlayer: true,
    name: 'Nation A',
    leader: 'Leader A',
    lon: 0,
    lat: 0,
    color: '#ffffff',
    population: 100,
    missiles: 0,
    defense: 0,
    production: 100,
    uranium: 10,
    intel: 250,
    warheads: {},
    morale: 80,
    publicOpinion: 50,
    electionTimer: 4,
    cabinetApproval: 60,
    relationships: {},
    culturalInfluences: [
      {
        sourceNation: 'nationA',
        targetNation: 'nationB',
        strength: 5,
        growthRate: 1,
        modifiers: [],
      },
    ],
    ideologyState: {
      currentIdeology: 'democracy',
      ideologyStability: 60,
      ideologicalSupport: {
        democracy: baseIdeologySupport.democracy,
        authoritarianism: baseIdeologySupport.authoritarianism,
        communism: baseIdeologySupport.communism,
        theocracy: baseIdeologySupport.theocracy,
        technocracy: baseIdeologySupport.technocracy,
      },
      ideologicalPressures: [],
      ideologicalExport: false,
      ideologicalDefense: 50,
    },
    popGroups: [
      {
        id: 'pop1',
        size: 10,
        origin: 'nationA',
        loyalty: 60,
        culture: 'Nation A',
        skills: 'medium',
        assimilation: 70,
        happiness: 65,
        yearsSinceArrival: 10,
      },
    ],
  };

  return { ...baseNation, ...overrides };
}

describe('advancedPropagandaManager', () => {
  let gameState: GameState;
  let propagandaState: AdvancedPropagandaState;

  beforeEach(() => {
    const recruiterNation: Nation = createNation({
      id: 'nationA',
      relationships: { nationB: 15 },
    });

    const targetNation: Nation = createNation({
      id: 'nationB',
      name: 'Nation B',
      leader: 'Leader B',
      isPlayer: false,
      relationships: { nationA: -5 },
      ideologyState: {
        currentIdeology: 'authoritarianism',
        ideologyStability: 55,
        ideologicalSupport: {
          democracy: 20,
          authoritarianism: 40,
          communism: 15,
          theocracy: 10,
          technocracy: 15,
        },
        ideologicalPressures: [],
        ideologicalExport: false,
        ideologicalDefense: 45,
      },
      intel: 120,
      culturalInfluences: [],
      popGroups: [
        {
          id: 'pop2',
          size: 8,
          origin: 'nationB',
          loyalty: 55,
          culture: 'Nation B',
          skills: 'medium',
          assimilation: 60,
          happiness: 60,
          yearsSinceArrival: 12,
        },
      ],
    });

    gameState = {
      turn: 1,
      defcon: 5,
      phase: 'PLAYER',
      actionsRemaining: 1,
      paused: false,
      gameOver: false,
      selectedLeader: null,
      selectedDoctrine: null,
      missiles: [],
      bombers: [],
      explosions: [],
      particles: [],
      radiationZones: [],
      empEffects: [],
      rings: [],
      screenShake: 0,
      falloutMarks: [],
      satelliteOrbits: [],
      nations: [recruiterNation, targetNation],
    } as unknown as GameState;

    propagandaState = initializeAdvancedPropagandaState();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deducts intel and tracks operations when initiating advanced propaganda', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.42);

    const recruiter = gameState.nations.find(nation => nation.id === 'nationA');
    expect(recruiter).toBeDefined();
    if (!recruiter) throw new Error('Recruiter nation missing in test setup.');

    const initialIntel = recruiter.intel;

    const recruitment = initiateRecruitment(gameState, 'nationA', 'nationB', 'journalist');
    expect(recruitment).not.toBeNull();
    if (recruitment) {
      propagandaState.recruitmentOperations.push(recruitment);
    }
    expect(recruiter.intel).toBe(initialIntel - 30);

    const phobia = launchPhobiaCampaign(gameState, 'nationA', 'nationB', 'enemy_fear', 'moderate');
    expect(phobia).not.toBeNull();
    if (phobia) {
      propagandaState.phobiaCampaigns.push(phobia);
    }
    expect(recruiter.intel).toBe(initialIntel - 30 - 40);

    const weapon = deployReligiousWeapon(gameState, 'nationA', ['nationB'], 'sacred_mission');
    expect(weapon).not.toBeNull();
    if (weapon) {
      propagandaState.religiousWeapons.push(weapon);
    }
    expect(recruiter.intel).toBe(initialIntel - 30 - 40 - 70);

    expect(propagandaState.recruitmentOperations).toHaveLength(1);
    expect(propagandaState.phobiaCampaigns).toHaveLength(1);
    expect(propagandaState.religiousWeapons).toHaveLength(1);

    expect(propagandaState.recruitmentOperations[0]?.targetNation).toBe('nationB');
    expect(propagandaState.phobiaCampaigns[0]?.targetNation).toBe('nationB');
    expect(propagandaState.religiousWeapons[0]?.targetNations).toContain('nationB');
  });
});
