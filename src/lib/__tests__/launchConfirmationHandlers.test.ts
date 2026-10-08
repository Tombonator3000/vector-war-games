import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameState, Nation } from '@/types/game';
import type { ActionConsequences } from '@/types/consequences';
import type { LaunchDependencies } from '@/lib/gamePhaseHandlers';
import { confirmPendingLaunch, type DeliveryMethod, type LaunchConfirmationDeps } from '../launchConfirmationHandlers';
import { launch } from '../gamePhaseHandlers';
import { launchBomber, launchSubmarine } from '../nuclearLaunchHandlers';

const current = vi.hoisted(() => ({ state: null as GameState | null, nations: [] as Nation[], sessionVersion: 0 }));
vi.mock('@/state/GameStateManager', () => ({ default: {
  getState: () => current.state,
  getNations: () => current.nations,
  getSessionVersion: () => current.sessionVersion,
} }));
vi.mock('@/state/PlayerManager', () => ({ default: { get: () => current.nations.find(nation => nation.isPlayer) ?? null } }));
vi.mock('@/state/DoomsdayClock', () => ({ default: { tick: vi.fn() } }));
vi.mock('../gamePhaseHandlers', () => ({ launch: vi.fn(() => true) }));
vi.mock('../nuclearLaunchHandlers', () => ({ launchBomber: vi.fn(() => true), launchSubmarine: vi.fn(() => true) }));
vi.mock('../consequenceCalculator', () => ({ calculateActionConsequences: vi.fn(() => ({ longTerm: [], risks: [] })) }));

function nation(id: string, isPlayer = false): Nation {
  return {
    id, isPlayer, name: id, leader: 'Leader', lon: 0, lat: 0, color: '#fff',
    population: 100, missiles: 3, bombers: 2, submarines: 2, defense: 0,
    production: 0, uranium: 0, intel: 0, warheads: { 10: 3 }, treaties: {},
  };
}

function setup(deliveryMethod: DeliveryMethod = 'bomber') {
  const player = nation('player', true);
  const target = nation('target');
  const state = { turn: 2, phase: 'PLAYER', actionsRemaining: 2, gameOver: false, defcon: 2,
    missiles: [], bombers: [], submarines: [] } as unknown as GameState;
  current.state = state;
  current.nations = [player, target];
  let callback: (() => void) | undefined;
  const deps: LaunchConfirmationDeps = {
    pendingLaunch: { target, warheads: [{ yield: 10, count: 3, requiredDefcon: 2 }],
      deliveryOptions: [{ id: deliveryMethod, label: deliveryMethod, count: 2 }] },
    selectedWarheadYield: 10, selectedDeliveryMethod: deliveryMethod, gameState: state,
    toast: vi.fn(), resetLaunchControl: vi.fn(), log: vi.fn(), triggerConsequenceAlerts: vi.fn(),
    consumeAction: vi.fn(() => { state.actionsRemaining--; }),
    queueConsequencePreview: vi.fn((_consequences: ActionConsequences, onConfirm: () => void) => { callback = onConfirm; return true; }),
    setConsequencePreview: vi.fn(), setConsequenceCallback: vi.fn(), playSFX: vi.fn(),
    launchDeps: { S: state, nations: current.nations, log: vi.fn(), toast: vi.fn(),
      WARHEAD_YIELD_TO_ID: new Map(), RESEARCH_LOOKUP: {}, AudioSys: { playSFX: vi.fn() },
      DoomsdayClock: { tick: vi.fn() }, PlayerManager: {},
      projectLocal: () => ({ x: 0, y: 0, visible: true }) } as LaunchDependencies,
  };
  return { player, target, state, deps, confirm: () => callback?.() };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(launch).mockReset().mockReturnValue(true);
  vi.mocked(launchBomber).mockReset().mockReturnValue(true);
  vi.mocked(launchSubmarine).mockReset().mockReturnValue(true);
  current.sessionVersion = 0;
});

describe('nuclear strike confirmation', () => {
  it.each(['bomber', 'submarine'] as const)('queues a %s preview and consumes one action/inventory exactly once', method => {
    const { player, state, deps, confirm } = setup(method);
    player.missiles = 0;
    confirmPendingLaunch(deps);
    expect(player.warheads[10]).toBe(3);
    expect(deps.consumeAction).not.toHaveBeenCalled();
    confirm();
    confirm();
    const helper = method === 'bomber' ? launchBomber : launchSubmarine;
    expect(helper).toHaveBeenCalledOnce();
    expect(player.warheads[10]).toBe(2);
    expect(player[method === 'bomber' ? 'bombers' : 'submarines']).toBe(1);
    expect(player.lastAggressiveAction).toBe(state.turn);
    expect(state.actionsRemaining).toBe(1);
    expect(deps.consumeAction).toHaveBeenCalledOnce();
  });

  it('dispatches an ICBM with dependencies and rejects duplicate confirmation', () => {
    const { deps, confirm } = setup('missile');
    confirmPendingLaunch(deps);
    confirm();
    confirm();
    expect(launch).toHaveBeenCalledOnce();
    expect(vi.mocked(launch).mock.calls[0][3].S).toBe(current.state);
    expect(deps.consumeAction).toHaveBeenCalledOnce();
  });

  it.each([false, 'throw'] as const)('preserves inventory and action when a helper fails (%s)', failure => {
    const { player, state, deps, confirm } = setup();
    vi.mocked(launchBomber).mockImplementation(() => {
      state.bombers.push({ t: 0 });
      if (failure === 'throw') throw new Error('Unavailable platform');
      return false;
    });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    confirmPendingLaunch(deps);
    confirm();
    expect(player.warheads[10]).toBe(3);
    expect(player.bombers).toBe(2);
    expect(state.bombers).toEqual([]);
    expect(deps.consumeAction).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('restores inventory if an ICBM helper changes it before throwing', () => {
    const { player, state, deps, confirm } = setup('missile');
    vi.mocked(launch).mockImplementation(() => {
      player.warheads[10]--;
      player.missiles--;
      state.missiles.push({ t: 0 } as never);
      throw new Error('Side effect failed');
    });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    confirmPendingLaunch(deps);
    confirm();
    expect(player.warheads[10]).toBe(3);
    expect(player.missiles).toBe(3);
    expect(state.missiles).toEqual([]);
    expect(deps.consumeAction).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it.each(['warheads', 'platform', 'defcon', 'truce', 'alliance', 'destroyed', 'eliminated', 'missing',
    'phase', 'actions', 'gameOver', 'turn'] as const)('revalidates %s after the preview opens', change => {
    const { player, target, state, deps, confirm } = setup();
    confirmPendingLaunch(deps);
    if (change === 'warheads') player.warheads[10] = 0;
    if (change === 'platform') player.bombers = 0;
    if (change === 'defcon') state.defcon = 5;
    if (change === 'truce') target.treaties = { player: { truceTurns: 2 } };
    if (change === 'alliance') target.alliances = ['player'];
    if (change === 'destroyed') target.population = 0;
    if (change === 'eliminated') target.eliminated = true;
    if (change === 'missing') current.nations = [player];
    if (change === 'phase') state.phase = 'AI';
    if (change === 'actions') state.actionsRemaining = 0;
    if (change === 'gameOver') state.gameOver = true;
    if (change === 'turn') state.turn++;
    confirm();
    expect(launchBomber).not.toHaveBeenCalled();
    expect(deps.consumeAction).not.toHaveBeenCalled();
  });

  it('uses the replacement target from current state rather than the preview snapshot', () => {
    const { target, deps, confirm } = setup();
    confirmPendingLaunch(deps);
    const replacement = { ...target, population: 40 };
    current.nations = [current.nations[0], replacement];
    confirm();
    expect(vi.mocked(launchBomber).mock.calls[0][1]).toBe(replacement);
  });

  it('rejects a preview from a previous game even when the turn and player ID match', () => {
    const { deps, confirm } = setup();
    confirmPendingLaunch(deps);
    current.sessionVersion++;
    current.nations = [nation('player', true), nation('target')];
    confirm();
    expect(launchBomber).not.toHaveBeenCalled();
    expect(deps.consumeAction).not.toHaveBeenCalled();
  });

  it('uses an updater wrapper when storing the fallback confirmation callback', () => {
    const { deps } = setup();
    vi.mocked(deps.queueConsequencePreview).mockReturnValue(false);
    confirmPendingLaunch(deps);
    const setterArgument = vi.mocked(deps.setConsequenceCallback).mock.calls[0][0];
    expect(setterArgument).toBeTypeOf('function');
    const storedCallback = setterArgument!();
    expect(launchBomber).not.toHaveBeenCalled();
    expect(storedCallback).toBeTypeOf('function');
  });

  it('rejects missing launch dependencies without consuming resources', () => {
    const { player, deps } = setup();
    deps.launchDeps = undefined as unknown as LaunchDependencies;
    expect(() => confirmPendingLaunch(deps)).not.toThrow();
    expect(player.warheads[10]).toBe(3);
    expect(deps.queueConsequencePreview).not.toHaveBeenCalled();
  });
});
