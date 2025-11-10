import { GameStateManager, type LocalGameState } from '@/state';

/**
 * Applies a remote co-op game state update to the local runtime.
 *
 * The remote state is sanitized to avoid shared references, synchronized with the
 * GameStateManager, and re-exposed on the window so hooks that inspect
 * `window.S` (like useFlashpoints) receive the latest scenario metadata.
 */
export function applyRemoteGameStateSync(remoteState: Partial<LocalGameState>): LocalGameState {
  const sanitizedState: LocalGameState = {
    ...remoteState,
    falloutMarks: Array.isArray(remoteState.falloutMarks)
      ? remoteState.falloutMarks.map(mark => ({ ...mark }))
      : [],
    falloutEffects: remoteState.falloutEffects
      ? Object.fromEntries(
          Object.entries(remoteState.falloutEffects).map(([id, effect]) => [
            id,
            { ...effect },
          ])
        )
      : {},
    satelliteOrbits: Array.isArray(remoteState.satelliteOrbits)
      ? remoteState.satelliteOrbits.map(orbit => ({ ...orbit }))
      : [],
  } as LocalGameState;

  if (!Array.isArray(sanitizedState.satelliteOrbits)) {
    sanitizedState.satelliteOrbits = [];
  }

  if (!Array.isArray(sanitizedState.falloutMarks)) {
    sanitizedState.falloutMarks = [];
  }

  if (!sanitizedState.falloutEffects) {
    sanitizedState.falloutEffects = {};
  }

  GameStateManager.setState(sanitizedState);

  if (typeof window !== 'undefined') {
    (window as any).S = sanitizedState;
    console.log('[Game State] Synchronized S from co-op import. Scenario ID:', sanitizedState.scenario?.id);
  }

  return sanitizedState;
}
