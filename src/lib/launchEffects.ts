/**
 * Launch Effects Module
 *
 * Handles side effects for missile launches:
 * - Logging
 * - Audio feedback
 * - Toast notifications
 * - News generation
 * - Opinion changes
 * - Doomsday clock updates
 */

import type { Nation } from '@/types/Nation';
import type { GameState } from '@/types/GameState';

export interface LaunchEffectsContext {
  from: Nation;
  to: Nation;
  yieldMT: number;
  gameState: GameState;
  log: (msg: string, type?: string) => void;
  toast: (options: any) => void;
  AudioSys: any;
  DoomsdayClock: any;
}

/**
 * Apply state mutations for a missile launch
 */
export function applyLaunchStateChanges(
  from: Nation,
  to: Nation,
  yieldMT: number,
  gameState: GameState
): void {
  // Decrement warhead count
  from.warheads[yieldMT]--;
  if (from.warheads[yieldMT] <= 0) {
    delete from.warheads[yieldMT];
  }

  // Decrement missile count
  from.missiles--;

  // Add random offset to spread impacts across the country (±3 degrees)
  const lonOffset = (Math.random() - 0.5) * 6;
  const latOffset = (Math.random() - 0.5) * 6;

  // Create missile object
  gameState.missiles.push({
    from,
    to,
    t: 0,
    fromLon: from.lon,
    fromLat: from.lat,
    toLon: to.lon + lonOffset,
    toLat: to.lat + latOffset,
    yield: yieldMT,
    target: to,
    color: from.color,
  });

  // Mark as aggressive action
  from.lastAggressiveAction = gameState.turn;
}

/**
 * Handle all side effects for a missile launch
 */
export function handleLaunchSideEffects(context: LaunchEffectsContext): void {
  const { from, to, yieldMT, gameState, log, toast, AudioSys, DoomsdayClock } = context;

  // Log the launch
  log(`${from.name} → ${to.name}: LAUNCH ${yieldMT}MT`);

  // Play audio feedback
  AudioSys.playSFX('launch');

  // Update doomsday clock
  DoomsdayClock.tick(0.3);

  // Update public opinion for player launches
  if (from.isPlayer && gameState.scenario?.electionConfig) {
    // Import dynamically to avoid circular dependencies
    const { modifyOpinionFromAction } = require('./electionMechanics');
    modifyOpinionFromAction(from, 'LAUNCH_MISSILE', true, gameState.scenario.electionConfig);
  }

  // Show toast for player launches
  if (from.isPlayer) {
    toast({
      title: '🚀 Missile Launched',
      description: `${yieldMT}MT warhead inbound to ${to.name}. -1 missile, -1 warhead.`,
      variant: 'destructive',
    });
  }

  // Generate news
  generateLaunchNews(from, to, yieldMT);
}

/**
 * Generate news item for missile launch
 */
function generateLaunchNews(from: Nation, to: Nation, yieldMT: number): void {
  if (window.__gameAddNewsItem) {
    const priority = yieldMT > 50 ? 'critical' : 'urgent';
    window.__gameAddNewsItem(
      'military',
      `${from.name} launches ${yieldMT}MT warhead at ${to.name}`,
      priority
    );
  }
}
