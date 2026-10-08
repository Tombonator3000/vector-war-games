/**
 * Stable entry point for launch, resolution, and production handlers.
 * Phase-specific processing lives in gamePhases/.
 */
import type { Nation } from '@/types/game';
import type { LaunchDependencies } from '@/types/gamePhase.types';
import { validateLaunch } from '@/lib/launchValidation';
import { applyLaunchStateChanges, handleLaunchSideEffects } from '@/lib/launchEffects';

export type {
  LaunchDependencies,
  ResolutionPhaseDependencies,
  ProductionPhaseDependencies,
} from '@/types/gamePhase.types';
export { resolutionPhase } from './gamePhases/resolutionPhase';
export { productionPhase } from './gamePhases/productionPhase';

export function launch(
  from: Nation,
  to: Nation,
  yieldMT: number,
  deps: LaunchDependencies
): boolean {
  // Defensive check: ensure deps object is defined
  if (!deps) {
    console.error('[Launch Handler] Dependencies object is undefined');
    return false;
  }

  const { S, log, toast, AudioSys, DoomsdayClock, WARHEAD_YIELD_TO_ID, RESEARCH_LOOKUP } = deps;

  // Defensive check: ensure game state is available
  if (!S) {
    console.error('[Launch Handler] Game state (S) is undefined');
    if (toast) {
      toast({
        title: 'System error',
        description: 'Game state not available. Please refresh the page.'
      });
    }
    return false;
  }

  // Validate launch preconditions
  const validationResult = validateLaunch({
    from,
    to,
    yieldMT,
    defcon: S.defcon,
    warheadYieldToId: WARHEAD_YIELD_TO_ID,
    researchLookup: RESEARCH_LOOKUP,
  });

  // Handle validation failure
  if (!validationResult.valid) {
    if (validationResult.errorMessage) {
      log(validationResult.errorMessage, validationResult.errorType || 'warning');
    }
    if (validationResult.requiresToast && validationResult.toastConfig) {
      toast(validationResult.toastConfig);
    }
    return false;
  }

  // Apply state changes
  applyLaunchStateChanges(from, to, yieldMT, S);

  // Handle side effects
  handleLaunchSideEffects({
    from,
    to,
    yieldMT,
    gameState: S,
    log,
    toast,
    AudioSys,
    DoomsdayClock,
  });

  return true;
}
