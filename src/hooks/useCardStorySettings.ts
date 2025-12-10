/**
 * Hook for accessing Card Story Modal settings from localStorage
 *
 * Provides the current card story position setting and methods to update it.
 */

import { useState, useEffect, useCallback } from 'react';

export type CardStoryPosition = 'left' | 'right' | 'disabled';

const STORAGE_KEY = 'norad_card_story_position';
const DEFAULT_POSITION: CardStoryPosition = 'left';

/**
 * Get the current card story position from localStorage
 */
export function getCardStoryPosition(): CardStoryPosition {
  if (typeof window === 'undefined') return DEFAULT_POSITION;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'left' || stored === 'right' || stored === 'disabled') {
      return stored;
    }
  } catch {
    // localStorage may not be available
  }
  return DEFAULT_POSITION;
}

/**
 * Set the card story position in localStorage
 */
export function setCardStoryPosition(position: CardStoryPosition): void {
  try {
    localStorage.setItem(STORAGE_KEY, position);
  } catch {
    // localStorage may not be available
  }
}

/**
 * Hook for accessing and updating the card story modal position setting
 */
export function useCardStorySettings() {
  const [position, setPosition] = useState<CardStoryPosition>(() => getCardStoryPosition());

  // Sync with localStorage changes from other components
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        if (e.newValue === 'left' || e.newValue === 'right' || e.newValue === 'disabled') {
          setPosition(e.newValue);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updatePosition = useCallback((newPosition: CardStoryPosition) => {
    setPosition(newPosition);
    setCardStoryPosition(newPosition);
  }, []);

  const isEnabled = position !== 'disabled';

  return {
    position,
    setPosition: updatePosition,
    isEnabled,
    /** Position suitable for the modal component (defaults to 'left' when disabled) */
    modalPosition: position === 'disabled' ? 'left' : position,
  };
}

export default useCardStorySettings;
