// @ts-nocheck
/**
 * Great Old Ones Complete Integration
 * Master integration file that connects all campaign systems
 */

import type { GreatOldOnesState } from '../types/greatOldOnes';
import type { ActCampaignState, ManifestationEvent, CounterOperation } from '../types/actCampaign';
import { updateActCampaignState, resolveActProgressionVote } from './actCampaignSystem';
import { updateDoctrineDriftPerTurn } from './doctrineDriftIntegration';
import {
  attemptInvestigatorSpawn,
  executeInvestigatorActions,
  processInvestigatorAttrition,
  checkForCounterOperations,
  executeCounterOperation,
} from './investigationAI';
import { updateManifestationEvents } from './manifestationEventSystem';
import { updateGreatOldOnesResources } from './greatOldOnesHelpers';

// ============================================================================
// EXTENDED STATE INTERFACE
// ============================================================================

/**
 * Extended state that includes all new campaign systems
 */
export interface ExtendedGreatOldOnesState extends GreatOldOnesState {
  /** Act-based campaign state */
  actCampaignState?: ActCampaignState;

  /** Active manifestation events */
  manifestationEvents?: ManifestationEvent[];

  /** Active counter-operations */
  activeCounterOperations?: CounterOperation[];
}

// ============================================================================
// MASTER UPDATE FUNCTION
// ============================================================================

/**
 * Master update function for Great Old Ones campaign
 * Called every turn to update all systems
 */
export function updateGreatOldOnesCampaign(
  state: ExtendedGreatOldOnesState,
  turn: number
): ExtendedGreatOldOnesState {
  let updatedState = { ...state };

  // 1. Update base resources (sanity fragments, eldritch power, corruption, etc.)
  updatedState = updateGreatOldOnesResources(updatedState, turn);

  // 2. Update doctrine drift (track natural decay and check for threshold)
  updatedState = updateDoctrineDriftPerTurn(updatedState, turn);

  // 3. Update act campaign state (check unlock conditions, trigger story beats)
  if (updatedState.actCampaignState) {
    updatedState.actCampaignState = updateActCampaignState(
      updatedState,
      updatedState.actCampaignState,
      turn
    );
  }

  // 4. Investigator systems
  // 4a. Attempt to spawn new investigators
  const newInvestigator = attemptInvestigatorSpawn(updatedState);
  if (newInvestigator) {
    // Already added to state by spawn function
  }

  // 4b. Execute investigator actions
  executeInvestigatorActions(updatedState);

  // 4c. Process investigator attrition (madness, disappearances, retirement)
  processInvestigatorAttrition(updatedState);

  // 4d. Check for counter-operations
  const counterOp = checkForCounterOperations(updatedState);
  if (counterOp && !updatedState.activeCounterOperations) {
    updatedState.activeCounterOperations = [];
  }
  if (counterOp) {
    updatedState.activeCounterOperations!.push(counterOp);
  }

  // 4e. Update and execute counter-operations
  if (updatedState.activeCounterOperations) {
    updatedState.activeCounterOperations = updatedState.activeCounterOperations
      .map(op => {
        op.turnsUntilExecution--;
        if (op.turnsUntilExecution <= 0) {
          executeCounterOperation(op, updatedState);
          return null; // Remove after execution
        }
        return op;
      })
      .filter(op => op !== null) as CounterOperation[];
  }

  // 5. Update manifestation events
  if (updatedState.manifestationEvents) {
    updatedState.manifestationEvents = updateManifestationEvents(
      updatedState.manifestationEvents,
      updatedState
    );
  }

  return updatedState;
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize extended Great Old Ones state with all new systems
 */
export function initializeExtendedState(baseState: GreatOldOnesState): ExtendedGreatOldOnesState {
  // Import act campaign initialization
  const { initializeActCampaignState } = require('./actCampaignSystem');

  return {
    ...baseState,
    actCampaignState: initializeActCampaignState(),
    manifestationEvents: [],
    activeCounterOperations: [],
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if player should be notified about act unlock
 */
export function shouldNotifyActUnlock(state: ExtendedGreatOldOnesState): boolean {
  if (!state.actCampaignState) return false;

  // Check if Act 2 or 3 conditions met but not yet unlocked
  const act2ConditionsMet =
    state.actCampaignState.actStatus[2].conditionsMet &&
    !state.actCampaignState.actStatus[2].unlocked;

  const act3ConditionsMet =
    state.actCampaignState.actStatus[3].conditionsMet &&
    !state.actCampaignState.actStatus[3].unlocked;

  return act2ConditionsMet || act3ConditionsMet;
}

/**
 * Get pending act votes that need player attention
 */
export function getPendingActVotes(state: ExtendedGreatOldOnesState) {
  if (!state.actCampaignState) return [];
  return state.actCampaignState.pendingVotes.filter(v => v.status === 'pending');
}

/**
 * Check if campaign is in critical state (high investigation heat, low veil, etc.)
 */
export function checkCriticalState(state: ExtendedGreatOldOnesState): {
  critical: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];

  // Low veil integrity
  if (state.veil.integrity < 20) {
    reasons.push('Veil integrity critically low - Order is fully exposed');
  }

  // High investigation heat
  const avgInvestigationHeat =
    state.regions.reduce((sum, r) => sum + r.investigationHeat, 0) / state.regions.length;
  if (avgInvestigationHeat > 70) {
    reasons.push('Investigation pressure is overwhelming');
  }

  // Many investigators
  if (state.investigators.length > 5) {
    reasons.push(`${state.investigators.length} investigators active - danger level extreme`);
  }

  // Low corruption with many investigators
  if (state.resources.corruptionIndex < 30 && state.investigators.length > 3) {
    reasons.push('Corruption too low to defend against investigators');
  }

  // Low sanity with no harvesting
  if (state.resources.sanityFragments < 50) {
    reasons.push('Running out of sanity fragments - ritual capability compromised');
  }

  // Low eldritch power
  if (state.resources.eldritchPower < 50) {
    reasons.push('Eldritch power reserves depleted');
  }

  return {
    critical: reasons.length >= 2, // Critical if 2+ issues
    reasons,
  };
}

/**
 * Get campaign progress summary for UI display
 */
export function getCampaignProgressSummary(state: ExtendedGreatOldOnesState): {
  currentAct: number;
  actName: string;
  storyMissionsCompleted: number;
  totalStoryMissions: number;
  proceduralMissionsCompleted: number;
  nextActUnlocked: boolean;
  progressPercentage: number;
} {
  if (!state.actCampaignState) {
    return {
      currentAct: 1,
      actName: 'The Gathering',
      storyMissionsCompleted: 0,
      totalStoryMissions: 0,
      proceduralMissionsCompleted: 0,
      nextActUnlocked: false,
      progressPercentage: 0,
    };
  }

  const { currentAct, completedStoryMissions, proceduralMissionsCompleted } =
    state.actCampaignState;

  // Import ACT_DEFINITIONS
  const { ACT_DEFINITIONS } = require('./actCampaignSystem');
  const currentActDef = ACT_DEFINITIONS[currentAct];

  const storyMissionsCompleted = completedStoryMissions.filter(id =>
    currentActDef.storyMissions.some((m: any) => m.id === id)
  ).length;

  const totalStoryMissions = currentActDef.storyMissions.length;
  const proceduralCompleted = proceduralMissionsCompleted[currentAct];
  const totalProcedural = currentActDef.proceduralMissionCount;

  const totalMissions = totalStoryMissions + totalProcedural;
  const completedMissions = storyMissionsCompleted + proceduralCompleted;
  const progressPercentage = Math.round((completedMissions / totalMissions) * 100);

  // Check if next act is unlocked
  const nextAct = (currentAct + 1) as 1 | 2 | 3;
  const nextActUnlocked =
    nextAct <= 3 ? state.actCampaignState.actStatus[nextAct].unlocked : false;

  return {
    currentAct,
    actName: currentActDef.name,
    storyMissionsCompleted,
    totalStoryMissions,
    proceduralMissionsCompleted: proceduralCompleted,
    nextActUnlocked,
    progressPercentage,
  };
}

/**
 * Get all available actions for player this turn
 */
export function getAvailableActions(state: ExtendedGreatOldOnesState): {
  canPerformRitual: boolean;
  canSummonEntity: boolean;
  canInfiltrate: boolean;
  canLaunchOperation: boolean;
  reasons: Record<string, string>;
} {
  const reasons: Record<string, string> = {};

  // Can perform ritual if have sanity fragments
  const canPerformRitual = state.resources.sanityFragments >= 50;
  if (!canPerformRitual) {
    reasons.ritual = 'Need at least 50 sanity fragments';
  }

  // Can summon if have eldritch power
  const canSummonEntity = state.resources.eldritchPower >= 100;
  if (!canSummonEntity) {
    reasons.summon = 'Need at least 100 eldritch power';
  }

  // Can infiltrate if have cultist cells
  const canInfiltrate = state.cultistCells.length > 0;
  if (!canInfiltrate) {
    reasons.infiltrate = 'Need at least one cultist cell';
  }

  // Can launch operation if not overwhelmed by investigations
  const avgInvestigationHeat =
    state.regions.reduce((sum, r) => sum + r.investigationHeat, 0) / state.regions.length;
  const canLaunchOperation = avgInvestigationHeat < 80;
  if (!canLaunchOperation) {
    reasons.operation = 'Investigation heat too high - operations compromised';
  }

  return {
    canPerformRitual,
    canSummonEntity,
    canInfiltrate,
    canLaunchOperation,
    reasons,
  };
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export {
  // Act campaign
  updateActCampaignState,
  resolveActProgressionVote,

  // Doctrine drift
  updateDoctrineDriftPerTurn,

  // Investigation AI
  attemptInvestigatorSpawn,
  executeInvestigatorActions,
  processInvestigatorAttrition,
  checkForCounterOperations,
  executeCounterOperation,

  // Manifestation events
  updateManifestationEvents,

  // Resources
  updateGreatOldOnesResources,
};
