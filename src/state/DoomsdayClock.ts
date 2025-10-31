/**
 * DoomsdayClock
 *
 * Singleton class that manages the Doomsday Clock state.
 * The clock represents how close the world is to nuclear catastrophe.
 *
 * Phase 6 Refactoring: Extracted from Index.tsx
 */

/**
 * DoomsdayClock singleton
 *
 * Tracks minutes to midnight (0 = midnight/doomsday)
 * Range: 0-12 minutes
 */
class DoomsdayClock {
  private static _minutes = 7.0;

  /**
   * Gets the current time on the Doomsday Clock
   * @returns Minutes to midnight (0-12)
   */
  static get minutes(): number {
    return this._minutes;
  }

  /**
   * Sets the Doomsday Clock time
   * @param value - Minutes to midnight (clamped to 0-12)
   */
  static set minutes(value: number) {
    this._minutes = Math.max(0, Math.min(12, value));
  }

  /**
   * Moves the clock closer to midnight (things got worse)
   * @param amount - Minutes to move forward (default: 0.5)
   */
  static tick(amount = 0.5): void {
    this._minutes = Math.max(0, this._minutes - amount);
  }

  /**
   * Moves the clock away from midnight (things improved)
   * @param amount - Minutes to move back (default: 0.5)
   */
  static improve(amount = 0.5): void {
    this._minutes = Math.min(12, this._minutes + amount);
  }

  /**
   * Resets the clock to default starting position
   * @param minutes - Starting time (default: 7.0)
   */
  static reset(minutes = 7.0): void {
    this._minutes = Math.max(0, Math.min(12, minutes));
  }

  /**
   * Updates the DOM display of the Doomsday Clock
   * Looks for element with id 'doomsdayTime'
   */
  static update(): void {
    const display = document.getElementById('doomsdayTime');
    if (display) {
      const mins = Math.floor(this._minutes);
      const secs = Math.floor((this._minutes % 1) * 60);
      display.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    }
  }

  /**
   * Checks if we've reached midnight
   * @returns true if the clock has reached 0
   */
  static isMidnight(): boolean {
    return this._minutes <= 0;
  }

  /**
   * Gets the current state as a formatted string
   * @returns Formatted time string (MM:SS)
   */
  static getFormattedTime(): string {
    const mins = Math.floor(this._minutes);
    const secs = Math.floor((this._minutes % 1) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}

export default DoomsdayClock;
