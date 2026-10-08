import { describe, expect, it, vi } from 'vitest';
import type { GameState, Nation } from '@/types/game';
import { applyLaunchStateChanges, handleLaunchSideEffects } from '../launchEffects';

describe('missile launch effects', () => {
  const createNation = (id: string, isPlayer = false) => ({ id, name: id, isPlayer,
    lon: 0, lat: 0, color: '#ffffff', missiles: 2, warheads: { 50: 1 }, publicOpinion: 60 }) as unknown as Nation;

  it('consumes one missile and warhead and records the player launch', () => {
    const player = createNation('player', true);
    const target = createNation('target');
    const state = { turn: 3, missiles: [], statistics: { nukesLaunched: 0 } } as unknown as GameState;
    applyLaunchStateChanges(player, target, 50, state);
    expect(player.missiles).toBe(1);
    expect(player.warheads[50]).toBeUndefined();
    expect(state.missiles).toHaveLength(1);
    expect(state.missiles[0].target).toBe(target);
    expect(player.lastAggressiveAction).toBe(3);
    expect(state.statistics.nukesLaunched).toBe(1);
  });

  it('keeps the player statistics separate from AI launches', () => {
    const state = { turn: 3, missiles: [], statistics: { nukesLaunched: 2 } } as unknown as GameState;
    applyLaunchStateChanges(createNation('ai'), createNation('target'), 50, state);
    expect(state.statistics.nukesLaunched).toBe(2);
  });

  it('updates election opinion through an ESM import in the browser', () => {
    const player = createNation('player', true);
    const state = { scenario: { electionConfig: { actionInfluenceMultiplier: 1 } } } as unknown as GameState;
    const playSFX = vi.fn();
    const tick = vi.fn();
    const toast = vi.fn();
    expect(() => handleLaunchSideEffects({ from: player, to: createNation('target'), yieldMT: 50,
      gameState: state, log: vi.fn(), toast, AudioSys: { playSFX }, DoomsdayClock: { tick } })).not.toThrow();
    expect(player.publicOpinion).toBe(55);
    expect(playSFX).toHaveBeenCalledWith('launch');
    expect(tick).toHaveBeenCalledWith(0.3);
    expect(toast).toHaveBeenCalledOnce();
  });
});
