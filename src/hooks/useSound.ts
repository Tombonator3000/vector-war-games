import { useCallback } from 'react';
import { audioManager } from '@/utils/audioManager';

/**
 * Hook for playing sound effects
 */
export function useSound() {
  const playUI = useCallback((sound: string = 'ui-click') => {
    audioManager.playUI(sound);
  }, []);

  const playSFX = useCallback((sound: string) => {
    audioManager.playSFX(sound);
  }, []);

  const playCritical = useCallback((sound: string) => {
    audioManager.playCritical(sound);
  }, []);

  return {
    playUI,
    playSFX,
    playCritical,
  };
}
