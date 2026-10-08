import GameStateManager, { type LocalGameState } from '@/state/GameStateManager';
import { cloneGameStateSnapshot } from '@/state/gameStateSnapshot';

/**
 * Applies a remote co-op game state update to the local runtime.
 *
 * The remote state is sanitized to avoid shared references, synchronized with the
 * GameStateManager, and re-exposed on the window so hooks that inspect
 * `window.S` (like useFlashpoints) receive the latest scenario metadata.
 */
export function applyRemoteGameStateSync(remoteState: Partial<LocalGameState>): LocalGameState {
  const sanitizedState = cloneGameStateSnapshot(remoteState);
  GameStateManager.setState(sanitizedState);
  const synchronizedState = GameStateManager.getState();

  if (typeof window !== 'undefined') {
    (window as Window & { S?: LocalGameState }).S = synchronizedState;
    console.log('[Game State] Synchronized S from co-op import. Scenario ID:', synchronizedState.scenario?.id);
  }

  return synchronizedState;
}

