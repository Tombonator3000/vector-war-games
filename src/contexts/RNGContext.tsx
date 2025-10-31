/**
 * RNG Context Provider
 *
 * Provides a seeded random number generator to the entire application.
 * This ensures that all random events in the game are deterministic and
 * can be synchronized across multiplayer clients or replayed.
 *
 * @example
 * // In your app root:
 * <RNGProvider initialSeed={12345}>
 *   <App />
 * </RNGProvider>
 *
 * // In any component or hook:
 * const { rng } = useRNG();
 * const randomValue = rng.next();
 */

import { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';
import { SeededRandom } from '@/lib/seededRandom';

export interface RNGState {
  seed: number;
  state: number;
}

export interface RNGContextType {
  /**
   * The current RNG instance
   * Use this to generate random numbers
   */
  rng: SeededRandom;

  /**
   * Reset the RNG with a new seed
   * This will create a new RNG instance
   */
  reseedRNG: (seed: number) => void;

  /**
   * Get the current RNG state for saving
   * Includes both the seed and current state
   */
  getRNGState: () => RNGState;

  /**
   * Restore RNG state from a save
   * @param seed - The original seed
   * @param state - The saved state value
   */
  setRNGState: (seed: number, state: number) => void;

  /**
   * Reset the RNG to its initial state (same seed, reset state)
   */
  resetRNG: () => void;
}

const RNGContext = createContext<RNGContextType | null>(null);

export interface RNGProviderProps {
  children: ReactNode;
  /**
   * Initial seed for the RNG
   * If not provided, uses current timestamp
   */
  initialSeed?: number;
}

/**
 * Provider component for the RNG system
 * Wrap your app with this to enable seeded randomness
 */
export function RNGProvider({ children, initialSeed }: RNGProviderProps) {
  // Initialize RNG with provided seed or timestamp
  const [rng, setRNG] = useState(() => {
    const seed = initialSeed ?? Date.now();
    return new SeededRandom(seed);
  });

  // Reseed with a completely new seed
  const reseedRNG = useCallback((seed: number) => {
    setRNG(new SeededRandom(seed));
  }, []);

  // Get current state for saving
  const getRNGState = useCallback((): RNGState => {
    return {
      seed: rng.getSeed(),
      state: rng.getState(),
    };
  }, [rng]);

  // Restore state from save
  const setRNGState = useCallback((seed: number, state: number) => {
    const newRNG = new SeededRandom(seed);
    newRNG.setState(state);
    setRNG(newRNG);
  }, []);

  // Reset to initial state (same seed, reset sequence)
  const resetRNG = useCallback(() => {
    const currentSeed = rng.getSeed();
    setRNG(new SeededRandom(currentSeed));
  }, [rng]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      rng,
      reseedRNG,
      getRNGState,
      setRNGState,
      resetRNG,
    }),
    [rng, reseedRNG, getRNGState, setRNGState, resetRNG]
  );

  return <RNGContext.Provider value={contextValue}>{children}</RNGContext.Provider>;
}

/**
 * Hook to access the RNG system
 * Must be used within an RNGProvider
 *
 * @throws Error if used outside of RNGProvider
 * @returns RNG context with rng instance and control functions
 *
 * @example
 * function MyComponent() {
 *   const { rng } = useRNG();
 *
 *   const rollDice = () => {
 *     return rng.nextInt(1, 6);
 *   };
 *
 *   const coinFlip = () => {
 *     return rng.nextBool() ? 'heads' : 'tails';
 *   };
 *
 *   return <button onClick={rollDice}>Roll Dice</button>;
 * }
 */
export function useRNG(): RNGContextType {
  const context = useContext(RNGContext);

  if (!context) {
    throw new Error('useRNG must be used within an RNGProvider');
  }

  return context;
}

/**
 * Optional hook for components that may not have RNG available
 * Returns null if not within an RNGProvider
 *
 * Useful for components that can work with or without deterministic randomness
 *
 * @returns RNG context or null
 */
export function useOptionalRNG(): RNGContextType | null {
  return useContext(RNGContext);
}
