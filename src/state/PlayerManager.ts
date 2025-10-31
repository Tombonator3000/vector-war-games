/**
 * PlayerManager
 *
 * Singleton class that manages access to the player's Nation object.
 * Provides caching for performance optimization.
 *
 * Phase 6 Refactoring: Extracted from Index.tsx
 */

import type { Nation } from '@/types/game';

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
