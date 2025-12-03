import { describe, expect, it, beforeEach } from 'vitest';
import { initializeNationLeaderAbility, activateLeaderAbility } from '../leaderAbilityIntegration';
import PlayerManager from '@/state/PlayerManager';
import type { Nation, GameState } from '@/types/game';

function createTestNation(overrides: Partial<Nation> = {}): Nation {
  return {
    id: overrides.id || 'nation-1',
    name: overrides.name || 'Test Nation',
    leader: overrides.leader || 'Nikita Khrushchev',
    isPlayer: overrides.isPlayer ?? true,
    lon: overrides.lon ?? 0,
    lat: overrides.lat ?? 0,
    color: overrides.color ?? '#ffffff',
    population: overrides.population ?? 100,
    missiles: overrides.missiles ?? 5,
    defense: overrides.defense ?? 5,
    production: overrides.production ?? 10,
    uranium: overrides.uranium ?? 0,
    intel: overrides.intel ?? 0,
    morale: overrides.morale ?? 50,
    publicOpinion: overrides.publicOpinion ?? 50,
    electionTimer: overrides.electionTimer ?? 0,
    cabinetApproval: overrides.cabinetApproval ?? 50,
    warheads: overrides.warheads ?? {},
    ...overrides,
  };
}

function createTestGameState(nations: Nation[]): GameState {
  return {
    turn: 5,
    defcon: 5,
    phase: 'PLAYER',
    actionsRemaining: 1,
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
    refugeeCamps: [],
    screenShake: 0,
    overlay: null,
    fx: 1,
    nuclearWinterLevel: 0,
    globalRadiation: 0,
    events: false,
    diplomacy: undefined,
    falloutMarks: [],
    falloutEffects: {},
    satelliteOrbits: [],
    nations,
  };
}

describe('leaderAbilityIntegration', () => {
  beforeEach(() => {
    PlayerManager.setNations([]);
  });

  it('records history even when the target nation is missing', () => {
    const nation = createTestNation();
    PlayerManager.setNations([nation]);
    initializeNationLeaderAbility(nation);

    const gameState = createTestGameState(PlayerManager.getNations());
    const missingTargetId = 'non-existent-target';

    const result = activateLeaderAbility(nation, gameState, missingTargetId);

    expect(result.success).toBe(true);
    expect(nation.leaderAbilityState).toBeDefined();
    expect(nation.leaderAbilityState?.history).toHaveLength(1);
    const historyEntry = nation.leaderAbilityState?.history[0];
    expect(historyEntry?.targetId).toBe(missingTargetId);
    expect(historyEntry?.targetName).toBe('Selected targets');
  });
});

