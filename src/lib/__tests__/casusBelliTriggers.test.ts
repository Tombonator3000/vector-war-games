import { describe, expect, it } from 'vitest';
import type { Nation } from '../../types/game';
import type { CouncilResolution } from '../../types/diplomacyPhase3';
import type { Grievance } from '../../types/grievancesAndClaims';
import { generateAutomaticCasusBelli } from '../casusBelliUtils';

const baseNation: Omit<
  Nation,
  'id' | 'name' | 'leader' | 'color' | 'lon' | 'lat'
> = {
  isPlayer: false,
  leaderName: 'Leader',
  aiPersonality: 'balanced',
  doctrine: 'standard',
  ai: 'standard',
  population: 10_000_000,
  missiles: 5,
  defense: 50,
  production: 100,
  uranium: 25,
  intel: 40,
  morale: 60,
  publicOpinion: 55,
  electionTimer: 12,
  cabinetApproval: 60,
  warheads: {},
};

const currentTurn = 10;

function nationFactory(
  id: string,
  overrides: Partial<Nation> = {}
): Nation {
  return {
    id,
    name: id,
    leader: `${id}-leader`,
    lon: 0,
    lat: 0,
    color: '#fff',
    ...baseNation,
    ...overrides,
  };
}

describe('generateAutomaticCasusBelli triggers', () => {
  it('creates a defensive-pact CB when an ally is attacked', () => {
    const defender = nationFactory('aggressor');
    const ally = nationFactory('ally', {
      activeWars: [
        {
          id: 'war-1',
          attackerNationId: defender.id,
          defenderNationId: 'ally',
          casusBelliId: 'cb',
          warGoals: [],
          startTurn: 1,
          attackerWarScore: 10,
          defenderWarScore: 0,
          allies: { attacker: [], defender: [] },
          status: 'active',
        },
      ],
    });

    const attacker = nationFactory('attacker', { alliances: [ally.id] });

    const autoCBs = generateAutomaticCasusBelli(
      attacker,
      defender,
      [],
      [],
      currentTurn,
      { allNations: [attacker, defender, ally] }
    );

    expect(autoCBs.some((cb) => cb.type === 'defensive-pact')).toBe(true);
  });

  it('creates a liberation-war CB when occupied territory grievances exist', () => {
    const attacker = nationFactory('liberator');
    const defender = nationFactory('occupier');

    const grievances: Grievance[] = [
      {
        id: 'g1',
        type: 'territorial-seizure',
        severity: 'major',
        againstNationId: defender.id,
        description: 'Occupied our land',
        createdTurn: 1,
        expiresIn: 20,
        relationshipPenalty: -20,
        trustPenalty: -10,
        resolved: false,
      },
    ];

    const autoCBs = generateAutomaticCasusBelli(
      attacker,
      defender,
      grievances,
      [],
      currentTurn
    );

    expect(autoCBs.some((cb) => cb.type === 'liberation-war')).toBe(true);
  });

  it('creates a regime-change CB against hostile, threatening nations', () => {
    const attacker = nationFactory('attacker', { relationships: { target: -60 } });
    const defender = nationFactory('target', {
      threats: { attacker: 80 },
      ideologyState: {
        currentIdeology: 'authoritarianism',
        ideologyStability: 35,
        ideologicalSupport: { democracy: 5, authoritarianism: 80 },
        ideologicalPressures: [],
        ideologicalExport: true,
        ideologicalDefense: 40,
      },
    });

    const autoCBs = generateAutomaticCasusBelli(
      attacker,
      defender,
      [],
      [],
      currentTurn
    );

    expect(autoCBs.some((cb) => cb.type === 'regime-change')).toBe(true);
  });

  it('creates a punitive-expedition CB for treaty-breaking grievances', () => {
    const attacker = nationFactory('attacker');
    const defender = nationFactory('treaty-breaker');

    const grievances: Grievance[] = [
      {
        id: 'g2',
        type: 'broken-treaty',
        severity: 'severe',
        againstNationId: defender.id,
        description: 'Violated non-aggression pact',
        createdTurn: 2,
        expiresIn: 40,
        relationshipPenalty: -30,
        trustPenalty: -35,
        resolved: false,
      },
    ];

    const autoCBs = generateAutomaticCasusBelli(
      attacker,
      defender,
      grievances,
      [],
      currentTurn
    );

    expect(autoCBs.some((cb) => cb.type === 'punitive-expedition')).toBe(true);
  });

  it('creates a council-authorized CB when a resolution targets the defender', () => {
    const attacker = nationFactory('attacker');
    const defender = nationFactory('sanctioned');
    const resolution: CouncilResolution = {
      id: 'res-1',
      type: 'ceasefire',
      title: 'Authorize action against sanctioned',
      description: 'Council approves enforcement',
      proposedBy: 'ally',
      proposedTurn: 5,
      targetNationId: defender.id,
      parameters: {},
      status: 'passed',
      effectiveness: 80,
      compliance: {},
    };

    const autoCBs = generateAutomaticCasusBelli(
      attacker,
      defender,
      [],
      [],
      currentTurn,
      { councilResolutions: [resolution] }
    );

    expect(autoCBs.some((cb) => cb.type === 'council-authorized')).toBe(true);
  });

  it('creates a leader-special CB when leader ability is available', () => {
    const attacker = nationFactory('attacker', {
      leaderAbilityState: {
        leaderName: 'attacker-leader',
        isAvailable: true,
        unavailableReason: undefined,
        history: [],
        ability: {
          id: 'ability-1',
          name: 'Special War Powers',
          description: 'Leader can declare special war',
          icon: '⭐',
          maxUses: 1,
          usesRemaining: 1,
          cooldownTurns: 5,
          currentCooldown: 0,
          lastUsedTurn: null,
          effect: { type: 'first-strike', targetId: 'rival', value: 20 },
          targetType: 'single-nation',
          requirements: [],
          category: 'military',
        },
      },
    });

    const defender = nationFactory('rival');

    const autoCBs = generateAutomaticCasusBelli(
      attacker,
      defender,
      [],
      [],
      currentTurn
    );

    expect(autoCBs.some((cb) => cb.type === 'leader-special')).toBe(true);
  });
});
