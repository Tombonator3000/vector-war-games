import { describe, expect, it } from 'vitest';

import {
  applyCubaPeaceConferenceOutcome,
  isCubaConferenceMetadata,
  seedCubaCrisisPeaceConference,
} from '@/lib/cubaCrisisPeaceConference';
import type { GameState, Nation } from '@/types/game';
import type { MultiPartyAgreement } from '@/types/multiPartyDiplomacy';

function createNation(id: string, overrides: Partial<Nation> = {}): Nation {
  return {
    id,
    name: id.toUpperCase(),
    leader: `${id}-leader`,
    isPlayer: false,
    lon: 0,
    lat: 0,
    color: '#00ffff',
    population: 100,
    missiles: 5,
    defense: 3,
    production: 100,
    uranium: 5,
    intel: 5,
    warheads: {},
    morale: 50,
    publicOpinion: 50,
    electionTimer: 4,
    cabinetApproval: 50,
    relationships: {},
    trustRecords: {},
    treaties: {},
    ...overrides,
  } as Nation;
}

function createGameState(): GameState {
  const nations: Nation[] = [
    createNation('us', { isPlayer: true }),
    createNation('soviet'),
    createNation('cuba'),
    createNation('turkey'),
    createNation('nato'),
    createNation('warsaw'),
    createNation('un'),
  ];

  return {
    turn: 10,
    defcon: 2,
    phase: 'PLAYER',
    actionsRemaining: 2,
    paused: false,
    gameOver: false,
    selectedLeader: null,
    selectedDoctrine: null,
    missiles: [],
    bombers: [],
    submarines: [],
    explosions: [],
    particles: [],
    radiationZones: [],
    empEffects: [],
    rings: [],
    falloutMarks: [],
    satelliteOrbits: [],
    nations,
  } as GameState;
}

describe('seedCubaCrisisPeaceConference', () => {
  it('creates multi-party agreements with Cuba scenario metadata', () => {
    const gameState = createGameState();

    const agreements = seedCubaCrisisPeaceConference(gameState);

    expect(agreements).toHaveLength(2);
    const first = agreements[0];

    expect(first.type).toBe('peace-treaty');
    expect(isCubaConferenceMetadata(first.metadata)).toBe(true);
    expect(first.terms.obligations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ nationId: 'us', type: 'no-aggression' }),
        expect.objectContaining({ nationId: 'soviet', type: 'military-support' }),
      ])
    );
    expect(gameState.multiPartyDiplomacy?.pendingProposals).toHaveLength(2);
  });
});

describe('applyCubaPeaceConferenceOutcome', () => {
  it('applies alliances, concessions, and scoring to the game state', () => {
    const gameState = createGameState();
    const [agreement] = seedCubaCrisisPeaceConference(gameState);

    const resolvedAgreement: MultiPartyAgreement = {
      ...agreement,
      status: 'passed',
    };

    applyCubaPeaceConferenceOutcome(resolvedAgreement, gameState);

    const us = gameState.nations.find(n => n.id === 'us')!;
    const cuba = gameState.nations.find(n => n.id === 'cuba')!;
    const soviet = gameState.nations.find(n => n.id === 'soviet')!;
    const turkey = gameState.nations.find(n => n.id === 'turkey')!;
    const un = gameState.nations.find(n => n.id === 'un')!;

    expect(us.treaties?.cuba?.nonAggression).toBe(true);
    expect(turkey.treaties?.us?.alliance).toBe(true);
    expect(turkey.treaties?.soviet?.nonAggression).toBe(true);

    expect(cuba.relationships?.us).toBeGreaterThan(20);
    expect(cuba.trustRecords?.us?.value).toBe(73);

    expect(soviet.relationships?.us).toBe(32);

    expect(un.relationships?.us).toBe(8);
    expect(un.relationships?.soviet).toBe(8);

    expect(gameState.defcon).toBe(3);
  });
});

