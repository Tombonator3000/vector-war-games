/**
 * State Management Module
 *
 * Centralized exports for all state management classes and utilities.
 *
 * Phase 6 Refactoring: Extracted from Index.tsx
 *
 * Usage:
 * ```typescript
 * import { GameStateManager, PlayerManager, DoomsdayClock } from '@/state';
 *
 * // Access game state
 * const turn = GameStateManager.getTurn();
 * const player = PlayerManager.get();
 *
 * // Update state
 * GameStateManager.nextTurn();
 * DoomsdayClock.tick();
 * ```
 */

export { default as GameStateManager } from './GameStateManager';
export { default as PlayerManager } from './PlayerManager';
export { default as DoomsdayClock } from './DoomsdayClock';

// Re-export types for convenience
export type {
  GameState,
  LocalGameState,
  LocalNation,
  DiplomacyState,
} from './GameStateManager';

export { createDefaultDiplomacyState } from './GameStateManager';
