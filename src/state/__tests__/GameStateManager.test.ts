import { beforeEach, describe, expect, it } from 'vitest';
import GameStateManager, { type LocalNation } from '../GameStateManager';
import PlayerManager from '../PlayerManager';
import { cloneGameStateSnapshot } from '../gameStateSnapshot';
import { SCENARIOS } from '@/types/scenario';

function makeNation(id = 'player', isPlayer = true): LocalNation {
  return {
    id, isPlayer, name: id, leader: 'Test leader', lon: 0, lat: 0, color: '#fff',
    population: 100, missiles: 5, defense: 3, production: 25, uranium: 15, intel: 10,
    warheads: { 10: 3 }, morale: 70, publicOpinion: 65, electionTimer: 4, cabinetApproval: 60,
  };
}

beforeEach(() => {
  GameStateManager.reset();
  PlayerManager.reset();
});

describe('GameStateManager snapshots and reset', () => {
  it('advances the session generation only when a game is reset', () => {
    const session = GameStateManager.getSessionVersion();
    GameStateManager.setState({ turn: 8 });
    expect(GameStateManager.getSessionVersion()).toBe(session);

    GameStateManager.reset();
    expect(GameStateManager.getSessionVersion()).toBe(session + 1);
  });

  it('resets the existing state object and removes data from the previous game', () => {
    const state = GameStateManager.getState();
    GameStateManager.setNations([makeNation()]);
    GameStateManager.setConventionalDeltas([{ id: 'delta', description: '', appliedAt: '', payload: {} }]);
    state.turn = 25;
    state.showEndGameScreen = true;
    Reflect.set(state, 'previousSession', true);

    GameStateManager.reset();

    expect(GameStateManager.getState()).toBe(state);
    expect(state.turn).toBe(1);
    expect(state.showEndGameScreen).toBe(false);
    expect(Reflect.has(state, 'previousSession')).toBe(false);
    expect(state.nations).toEqual([]);
    expect(GameStateManager.getConventionalDeltas()).toEqual([]);
  });

  it('fills required defaults when loading a partial or older snapshot', () => {
    GameStateManager.setNations([makeNation()]);
    GameStateManager.setState({ turn: 8, phase: 'AI' });
    const state = GameStateManager.getState();

    expect(state.turn).toBe(8);
    expect(state.phase).toBe('AI');
    expect(state.nations).toEqual([]);
    expect(state.missiles).toEqual([]);
    expect(state.bombers).toEqual([]);
    expect(state.statistics?.nonPandemicCasualties).toBe(0);
    expect(state.paused).toBe(false);
    expect(state.diplomacy?.peaceTurns).toBe(0);
  });

  it('normalizes invalid turn, action, DEFCON and array values', () => {
    GameStateManager.setState({
      turn: NaN, actionsRemaining: -3, defcon: 8.8,
      missiles: null, phase: 'BROKEN',
    } as unknown as Parameters<typeof GameStateManager.setState>[0]);
    const state = GameStateManager.getState();

    expect(state.turn).toBe(1);
    expect(state.actionsRemaining).toBe(0);
    expect(state.defcon).toBe(5);
    expect(state.missiles).toEqual([]);
    expect(state.phase).toBe('PLAYER');
  });

  it('preserves live nation references when setting the current state', () => {
    const nation = makeNation();
    GameStateManager.setNations([nation]);
    const state = GameStateManager.getState();

    GameStateManager.setState(state);

    expect(GameStateManager.getState()).toBe(state);
    expect(GameStateManager.getNation(nation.id)).toBe(nation);
  });

  it('uses the selected scenario starting DEFCON and isolates its configuration', () => {
    GameStateManager.initializeWithScenario(SCENARIOS.cubanCrisis);
    const state = GameStateManager.getState();

    expect(state.defcon).toBe(3);
    expect(state.actionsRemaining).toBe(2);
    expect(state.scenario).not.toBe(SCENARIOS.cubanCrisis);
    state.scenario!.timeConfig.unitsPerTurn = 99;
    expect(SCENARIOS.cubanCrisis.timeConfig.unitsPerTurn).toBe(1);

    GameStateManager.reset();
    state.scenario!.timeConfig.unitsPerTurn = 99;
    expect(SCENARIOS.coldWar.timeConfig.unitsPerTurn).toBe(1);
    GameStateManager.reset();
    expect(state.scenario!.timeConfig.unitsPerTurn).toBe(1);
  });

  it('clones nested state while preserving relationships inside the snapshot graph', () => {
    const nation = makeNation();
    const snapshot = cloneGameStateSnapshot({
      nations: [nation],
      missiles: [{ t: 0, fromLon: 0, fromLat: 0, toLon: 0, toLat: 0, yield: 10, target: nation }],
    });

    expect(snapshot.nations[0]).not.toBe(nation);
    expect(snapshot.missiles[0].target).toBe(snapshot.nations[0]);
    snapshot.nations[0].warheads[10] = 0;
    expect(nation.warheads[10]).toBe(3);
  });
});

describe('PlayerManager authoritative nation access', () => {
  it('observes nation replacements and resets without a separate player update', () => {
    const oldPlayer = makeNation('old');
    PlayerManager.setNations([oldPlayer]);
    expect(PlayerManager.get()).toBe(oldPlayer);

    const newPlayer = makeNation('new');
    GameStateManager.setState({ nations: [newPlayer] });
    expect(PlayerManager.get()).toBe(newPlayer);

    GameStateManager.reset();
    expect(PlayerManager.get()).toBeNull();
    expect(PlayerManager.getNations()).toEqual([]);
  });

  it('observes nation patches and invalidates a player flag that changed in place', () => {
    PlayerManager.setNations([makeNation()]);
    expect(PlayerManager.get()?.population).toBe(100);

    GameStateManager.updateNations(new Map([['player', { population: 80 }]]));
    expect(PlayerManager.get()?.population).toBe(80);

    GameStateManager.getNations()[0].isPlayer = false;
    expect(PlayerManager.get()).toBeNull();
  });

  it('registers an unregistered player in the authoritative state', () => {
    const player = makeNation();
    PlayerManager.set(player);

    expect(GameStateManager.getNation(player.id)).toBe(player);
    expect(PlayerManager.get()).toBe(player);
  });
});

