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
 * The cache is automatically invalidated when the nations array changes.
 */
class PlayerManager {
  private static _cached: Nation | null = null;
  private static _nationsArray: Nation[] = [];

  /**
   * Sets the nations array that this manager will search through
   * @param nations - Array of all nations in the game
   */
  static setNations(nations: Nation[]): void {
    this._nationsArray = nations;
    // Invalidate cache when nations array changes
    this._cached = null;
  }

  /**
   * Gets the nations array
   * @returns Array of all nations
   */
  static getNations(): Nation[] {
    return this._nationsArray;
  }

  /**
   * Gets the player's nation
   * @returns The player's nation or null if not found
   */
  static get(): Nation | null {
    // Check if cached value is still valid
    if (this._cached && this._nationsArray.includes(this._cached)) {
      return this._cached;
    }

    // Search for player nation
    const player = this._nationsArray.find(n => n?.isPlayer);
    if (player) {
      this._cached = player;
      return player;
    }

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
      this._nationsArray = GameStateManager.getNations();
      this._cached = updatedNation;
      return;
    }

    // Fallback for cases where the nation has not yet been registered
    const existingIndex = this._nationsArray.findIndex((n) => n?.id === nation.id);
    if (existingIndex !== -1) {
      this._nationsArray[existingIndex] = { ...this._nationsArray[existingIndex], ...nation };
    } else {
      this._nationsArray = [...this._nationsArray, nation];
    }

    GameStateManager.setNations(this._nationsArray as any);
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
