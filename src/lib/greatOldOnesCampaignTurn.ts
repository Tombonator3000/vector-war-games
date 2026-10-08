/** Coordinates campaign subsystems without accessing React component state. */
import type { GreatOldOnesState } from '@/types/greatOldOnes';
import type { Week3ExtendedState } from '@/lib/greatOldOnesWeek3Integration';
import type { Phase2State } from '@/lib/phase2Integration';
import type { Phase3State } from '@/types/phase3Types';
import type { SeededRandom } from '@/lib/seededRandom';

export interface CampaignSubsystems {
  week3: Week3ExtendedState | null;
  phase2: Phase2State | null;
  phase3: Phase3State | null;
}

export interface CampaignTurnOperations {
  updateWeek3: (state: GreatOldOnesState, week3: Week3ExtendedState) => Week3ExtendedState;
  canUnlockPhase2: (state: GreatOldOnesState) => { shouldUnlock: boolean };
  updatePhase2: (state: GreatOldOnesState, phase2: Phase2State, rng?: SeededRandom) => Phase2State;
  canUnlockPhase3: (state: GreatOldOnesState, phase2: Phase2State) => { shouldUnlock: boolean };
  updatePhase3: (state: GreatOldOnesState, phase2: Phase2State, phase3: Phase3State) => Phase3State;
  onUnlock: (phase: 2 | 3) => void;
  rng?: SeededRandom;
}

/** Advance each available subsystem once, passing current Phase 2 to Phase 3. */
export function advanceGreatOldOnesCampaign(
  state: GreatOldOnesState,
  current: CampaignSubsystems,
  operations: CampaignTurnOperations
): CampaignSubsystems {
  const week3 = current.week3 ? operations.updateWeek3(state, current.week3) : null;
  let phase2 = current.phase2 ? { ...current.phase2 } : null;
  let phase3 = current.phase3 ? { ...current.phase3 } : null;
  if (phase2) {
    if (!phase2.unlocked && operations.canUnlockPhase2(state).shouldUnlock) {
      phase2.unlocked = true;
      operations.onUnlock(2);
    }
    if (phase2.unlocked) phase2 = operations.updatePhase2(state, phase2, operations.rng);
  }
  if (phase3 && phase2) {
    if (!phase3.unlocked && operations.canUnlockPhase3(state, phase2).shouldUnlock) {
      phase3.unlocked = true;
      operations.onUnlock(3);
    }
    if (phase3.unlocked) phase3 = operations.updatePhase3(state, phase2, phase3);
  }
  return { week3, phase2, phase3 };
}
