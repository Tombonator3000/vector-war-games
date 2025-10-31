/**
 * Seeded Random Number Generator
 *
 * Uses the Mulberry32 algorithm for fast, deterministic random number generation.
 * This ensures that the same seed always produces the same sequence of random numbers,
 * which is critical for:
 * - Multiplayer synchronization
 * - Replay functionality
 * - Testing and debugging
 *
 * @example
 * const rng = new SeededRandom(12345);
 * const value = rng.next(); // 0-1
 * const dice = rng.nextInt(1, 6); // 1-6
 * const coinFlip = rng.nextBool(); // true/false
 */

export class SeededRandom {
  private seed: number;
  private state: number;

  /**
   * Create a new seeded random number generator
   * @param seed - The seed value (any integer)
   */
  constructor(seed: number) {
    this.seed = seed;
    this.state = seed;
  }

  /**
   * Generate the next random number in the sequence
   * Uses Mulberry32 algorithm - fast and high quality
   * @returns A number between 0 (inclusive) and 1 (exclusive)
   */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Generate a random integer in a range (inclusive)
   * @param min - Minimum value (inclusive)
   * @param max - Maximum value (inclusive)
   * @returns Random integer between min and max
   * @example rng.nextInt(1, 6) // Dice roll: 1, 2, 3, 4, 5, or 6
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Generate a random boolean value
   * @param probability - Probability of returning true (0-1), defaults to 0.5
   * @returns true or false
   * @example rng.nextBool(0.7) // 70% chance of true
   */
  nextBool(probability: number = 0.5): boolean {
    return this.next() < probability;
  }

  /**
   * Choose a random element from an array
   * @param array - The array to choose from
   * @returns A random element from the array
   * @example rng.choice(['rock', 'paper', 'scissors'])
   */
  choice<T>(array: T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot choose from empty array');
    }
    return array[Math.floor(this.next() * array.length)];
  }

  /**
   * Shuffle an array using Fisher-Yates algorithm
   * Returns a new shuffled array without modifying the original
   * @param array - The array to shuffle
   * @returns A new shuffled array
   */
  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /**
   * Generate a random number in a normal (Gaussian) distribution
   * Uses Box-Muller transform
   * @param mean - The mean of the distribution (default: 0)
   * @param stdDev - The standard deviation (default: 1)
   * @returns A random number from the normal distribution
   */
  nextGaussian(mean: number = 0, stdDev: number = 1): number {
    // Box-Muller transform
    const u1 = this.next();
    const u2 = this.next();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0 * stdDev + mean;
  }

  /**
   * Generate a random number within a range
   * @param min - Minimum value (inclusive)
   * @param max - Maximum value (exclusive)
   * @returns Random number between min and max
   * @example rng.nextRange(0, 100) // 0 to 99.999...
   */
  nextRange(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  /**
   * Get the original seed value
   * @returns The seed used to initialize this RNG
   */
  getSeed(): number {
    return this.seed;
  }

  /**
   * Get the current internal state
   * Used for saving/loading game state
   * @returns The current state value
   */
  getState(): number {
    return this.state;
  }

  /**
   * Set the internal state directly
   * Used for restoring game state from saves
   * @param state - The state value to restore
   */
  setState(state: number): void {
    this.state = state;
  }

  /**
   * Create a new RNG with the same configuration
   * but independent state (useful for branching)
   * @returns A new SeededRandom instance with the same seed
   */
  clone(): SeededRandom {
    const cloned = new SeededRandom(this.seed);
    cloned.setState(this.state);
    return cloned;
  }

  /**
   * Reset the RNG to its initial state
   * Useful for replaying sequences
   */
  reset(): void {
    this.state = this.seed;
  }
}

/**
 * Create a default RNG instance with a time-based seed
 * Use this for non-critical randomness or development
 * @returns A new SeededRandom instance
 */
export function createDefaultRNG(): SeededRandom {
  // Use a combination of timestamp and performance.now() for better entropy
  const seed = Date.now() + Math.floor(performance.now() * 1000);
  return new SeededRandom(seed);
}

/**
 * Create an RNG from a string seed (useful for user-entered seeds)
 * @param seedString - Any string to use as a seed
 * @returns A new SeededRandom instance
 */
export function createRNGFromString(seedString: string): SeededRandom {
  // Simple string hash function
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    const char = seedString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return new SeededRandom(hash);
}
