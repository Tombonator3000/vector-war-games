/**
 * PlayerManager
 *
 * Singleton class that manages access to the player's Nation object.
 * Provides caching for performance optimization.
 *
 * Phase 6 Refactoring: Extracted from Index.tsx
 */

import type { Nation } from '@/types/game';
import GameStateManager from '@/state/GameStateManager';

/**
 * PlayerManager singleton
 *
 * Provides cached access to the player's nation object.
 * Reads the authoritative nations array so imports and resets cannot leave
 * the player cache attached to a previous game.
 */
class PlayerManager {
  private static _cached: Nation | null = null;

  /**
   * Sets the nations array that this manager will search through
   * @param nations - Array of all nations in the game
   */
  static setNations(nations: Nation[]): void {
    GameStateManager.setNations(nations);
    // Invalidate cache when nations array changes
    this._cached = null;
  }

  /**
   * Gets the nations array
   * @returns Array of all nations
   */
  static getNations(): Nation[] {
    return GameStateManager.getNations();
  }

  /**
   * Gets the player's nation
   * @returns The player's nation or null if not found
   */
  static get(): Nation | null {
    const nations = this.getNations();
    // Check if cached value is still valid
    if (this._cached?.isPlayer && nations.includes(this._cached)) {
      return this._cached;
    }

    // Search for player nation
    const player = nations.find(n => n?.isPlayer);
    if (player) {
      this._cached = player;
      return player;
    }

    this._cached = null;
    return null;
  }

  /**
   * Updates the cached player nation and keeps global state in sync
   * @param nation - Updated player nation data
   */
  static set(nation: Nation | null): void {
    if (!nation) {
      this._cached = null;
      return;
    }

    const updatedNation = GameStateManager.updateNation(
      nation.id,
      (current) => ({ ...current, ...nation })
    );

    if (updatedNation) {
      // Ensure our local references stay aligned with the authoritative state
      this._cached = updatedNation;
      return;
    }

    // Fallback for cases where the nation has not yet been registered
    GameStateManager.setNations([...this.getNations(), nation]);
    this._cached = nation;
  }

  /**
   * Resets the cached player nation
   * Call this when the player nation might have changed
   */
  static reset(): void {
    this._cached = null;
  }

  /**
   * Checks if there is a player nation
   * @returns true if a player nation exists
   */
  static hasPlayer(): boolean {
    return this.get() !== null;
  }
}

export default PlayerManager;

