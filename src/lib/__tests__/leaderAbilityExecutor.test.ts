import { beforeEach, describe, expect, it } from 'vitest';

import { executeLeaderAbility } from '../leaderAbilityExecutor';
import PlayerManager from '@/state/PlayerManager';
import type { GameState, Nation } from '@/types/game';
import type { LeaderAbility } from '@/types/leaderAbilities';

function createNation(overrides: Partial<Nation>): Nation {
  return {
    id: 'nation',
    isPlayer: false,
    name: 'Nation',
    leader: 'Leader',
    lon: 0,
    lat: 0,
    color: '#fff',
    population: 1000,
    missiles: 10,
    defense: 100,
    production: 200,
    uranium: 50,
    intel: 75,
    morale: 60,
    publicOpinion: 60,
    electionTimer: 10,
    cabinetApproval: 50,
    warheads: {},
    relationships: {},
    ...overrides,
  };
}

describe('executeLeaderAbility', () => {
  beforeEach(() => {
    PlayerManager.setNations([]);
  });

  it('applies first-strike effects to attacker and target', () => {
    const attacker = createNation({
      id: 'attacker',
      name: 'Attacker',
      leader: 'Attacker Leader',
      isPlayer: true,
      morale: 70,
      publicOpinion: 70,
      relationships: { target: 10 },
    });

    const target = createNation({
      id: 'target',
      name: 'Target',
      leader: 'Target Leader',
      defense: 120,
      morale: 80,
      publicOpinion: 65,
      relationships: { attacker: 20 },
    });

    const nations: Nation[] = [attacker, target];
    PlayerManager.setNations(nations);

    const ability: LeaderAbility = {
      id: 'first_strike_test',
      name: 'First Strike',
      description: 'Test strike',
      icon: '🔥',
      maxUses: 1,
      usesRemaining: 1,
      cooldownTurns: 0,
      currentCooldown: 0,
      lastUsedTurn: null,
      effect: {
        type: 'first-strike',
        duration: 1,
        value: 100,
        metadata: { defensePenalty: 0.5 },
      },
      targetType: 'single-nation',
      requirements: [],
      category: 'military',
    };

    const gameState: GameState = {
      turn: 1,
      defcon: 5,
      phase: 'PLAYER',
      actionsRemaining: 3,
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
      falloutEffects: {},
      satelliteOrbits: [],
      nations,
    } as unknown as GameState;

    const result = executeLeaderAbility(ability, attacker, gameState, target.id);

    expect(result.success).toBe(true);
    expect(attacker.firstStrikeActive).toBe(true);
    expect(attacker.firstStrikeBonus).toBe(100);
    expect(attacker.firstStrikeTurnsRemaining).toBe(1);

    expect(target.defense).toBeLessThan(120);
    expect(target.morale).toBeLessThan(80);
    expect(target.publicOpinion).toBeLessThan(65);

    expect(attacker.relationships?.target).toBeLessThan(10);
    expect(target.relationships?.attacker).toBeLessThan(20);
  });
});
