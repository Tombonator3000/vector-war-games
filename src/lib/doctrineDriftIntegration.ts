/**
 * Doctrine Drift Game Loop Integration
 * Tracks player actions and gradually shifts doctrine over time
 */

import type { GreatOldOnesState, Doctrine, DriftAction } from '@/types/greatOldOnes';
import {
  recordDriftAction,
  decayDriftValues,
  checkDriftThreshold,
  applyDoctrineDrift,
  initializeDoctrineDrift,
} from '@/lib/hybridDoctrineHelpers';
import { addMissionLogEntry } from '@/lib/greatOldOnesHelpers';

// ============================================================================
// DRIFT TRACKING BASED ON ACTIONS
// ============================================================================

/**
 * Track drift when summoning entities (favors Domination)
 */
export function trackSummoningDrift(
  state: GreatOldOnesState,
  turn: number,
  entityTier: 'servitor' | 'horror' | 'star_spawn' | 'avatar' | 'great_old_one'
): GreatOldOnesState {
  if (!state.doctrineDrift || !state.doctrineDrift.active) return state;

  // Higher tier entities = more drift
  const driftAmounts = {
    servitor: 2,
    horror: 4,
    star_spawn: 6,
    avatar: 10,
    great_old_one: 15,
  };

  const driftAmount = driftAmounts[entityTier];

  const updatedDrift = recordDriftAction(
    state.doctrineDrift,
    turn,
    'summoning',
    'domination',
    driftAmount,
    `Summoned a ${entityTier}, increasing Domination doctrine affinity`
  );

  return {
    ...state,
    doctrineDrift: updatedDrift,
  };
}

/**
 * Track drift when performing infiltration operations (favors Corruption)
 */
export function trackInfiltrationDrift(
  state: GreatOldOnesState,
  turn: number,
  operationType: 'infiltrate' | 'memetic' | 'dream' | 'puppet'
): GreatOldOnesState {
  if (!state.doctrineDrift || !state.doctrineDrift.active) return state;

  const driftAmounts = {
    infiltrate: 3,
    memetic: 4,
    dream: 5,
    puppet: 8,
  };

  const driftAmount = driftAmounts[operationType];

  const updatedDrift = recordDriftAction(
    state.doctrineDrift,
    turn,
    'infiltration',
    'corruption',
    driftAmount,
    `Performed ${operationType} operation, increasing Corruption doctrine affinity`
  );

  return {
    ...state,
    doctrineDrift: updatedDrift,
  };
}

/**
 * Track drift when spreading enlightenment (favors Convergence)
 */
export function trackEnlightenmentDrift(
  state: GreatOldOnesState,
  turn: number,
  programType: 'enlightenment' | 'cultural' | 'celebrity' | 'redemption'
): GreatOldOnesState {
  if (!state.doctrineDrift || !state.doctrineDrift.active) return state;

  const driftAmounts = {
    enlightenment: 3,
    cultural: 4,
    celebrity: 6,
    redemption: 10,
  };

  const driftAmount = driftAmounts[programType];

  const updatedDrift = recordDriftAction(
    state.doctrineDrift,
    turn,
    'cultural',
    'convergence',
    driftAmount,
    `Launched ${programType} program, increasing Convergence doctrine affinity`
  );

  return {
    ...state,
    doctrineDrift: updatedDrift,
  };
}

/**
 * Track drift when using terror campaigns (favors Domination)
 */
export function trackTerrorDrift(
  state: GreatOldOnesState,
  turn: number,
  terrorLevel: 'minor' | 'moderate' | 'major' | 'catastrophic'
): GreatOldOnesState {
  if (!state.doctrineDrift || !state.doctrineDrift.active) return state;

  const driftAmounts = {
    minor: 2,
    moderate: 4,
    major: 6,
    catastrophic: 10,
  };

  const driftAmount = driftAmounts[terrorLevel];

  const updatedDrift = recordDriftAction(
    state.doctrineDrift,
    turn,
    'terror',
    'domination',
    driftAmount,
    `Executed ${terrorLevel} terror campaign, increasing Domination doctrine affinity`
  );

  return {
    ...state,
    doctrineDrift: updatedDrift,
  };
}

// ============================================================================
// PER-TURN DRIFT PROCESSING
// ============================================================================

/**
 * Update doctrine drift each turn
 * - Decay drift values toward neutral
 * - Check if threshold reached for automatic doctrine shift
 */
export function updateDoctrineDriftPerTurn(
  state: GreatOldOnesState,
  turn: number
): GreatOldOnesState {
  if (!state.doctrineDrift || !state.doctrineDrift.active) return state;

  // Apply decay (drift slowly returns to neutral)
  let updatedState = {
    ...state,
    doctrineDrift: decayDriftValues(state.doctrineDrift, 1), // Decay 1 point per turn
  };

  // Check if any doctrine has reached threshold
  const driftDoctrine = checkDriftThreshold(updatedState.doctrineDrift!, state.doctrine);

  if (driftDoctrine && driftDoctrine !== state.doctrine) {
    // Doctrine drift threshold reached!
    const driftedState = applyDoctrineDrift(updatedState, driftDoctrine);

    // Add mission log entry
    const finalState = addMissionLogEntry(driftedState, {
      category: 'event',
      title: 'Doctrine Drift Detected',
      description: `Your actions have fundamentally changed the Order's approach. The council has shifted to the ${driftDoctrine} doctrine due to your consistent ${driftDoctrine}-aligned operations.`,
    });
    return finalState;
  }

  return updatedState;
}

// ============================================================================
// DRIFT WARNING SYSTEM
// ============================================================================

/**
 * Check if player is approaching drift threshold
 * Returns warning if any doctrine is >60% toward threshold
 */
export function checkDriftWarning(state: GreatOldOnesState): {
  warning: boolean;
  driftingToward: Doctrine | null;
  percentageToThreshold: number;
} {
  if (!state.doctrineDrift || !state.doctrineDrift.active) {
    return { warning: false, driftingToward: null, percentageToThreshold: 0 };
  }

  const { driftValues, driftThreshold } = state.doctrineDrift;
  let highestDrift = 0;
  let driftDoctrine: Doctrine | null = null;

  for (const [doctrine, value] of Object.entries(driftValues)) {
    if (value > highestDrift && doctrine !== state.doctrine) {
      highestDrift = value;
      driftDoctrine = doctrine as Doctrine;
    }
  }

  const percentageToThreshold = (highestDrift / driftThreshold) * 100;
  const warning = percentageToThreshold >= 60; // Warning at 60%

  return {
    warning,
    driftingToward: driftDoctrine,
    percentageToThreshold: Math.round(percentageToThreshold),
  };
}

/**
 * Get corrective action suggestions for player
 */
export function getDriftCorrectiveActions(currentDoctrine: Doctrine): string[] {
  const suggestions: Record<Doctrine, string[]> = {
    domination: [
      'Focus on summoning more entities',
      'Execute terror campaigns',
      'Use military assault operations',
      'Avoid cultural and diplomatic operations',
    ],
    corruption: [
      'Perform more infiltration operations',
      'Launch memetic campaigns',
      'Build puppet governments',
      'Reduce visible summoning activities',
    ],
    convergence: [
      'Launch enlightenment programs',
      'Promote cultural movements',
      'Seek celebrity endorsements',
      'Reduce terror and aggressive operations',
    ],
  };

  return suggestions[currentDoctrine] || [];
}

/**
 * Initialize doctrine drift when starting Great Old Ones campaign
 */
export function initializeDoctrineDriftForCampaign(
  state: GreatOldOnesState
): GreatOldOnesState {
  if (state.doctrineDrift) return state; // Already initialized

  return {
    ...state,
    doctrineDrift: initializeDoctrineDrift(),
  };
}

/**
 * Disable doctrine drift (player option)
 */
export function disableDoctrineDrift(state: GreatOldOnesState): GreatOldOnesState {
  if (!state.doctrineDrift) return state;

  return {
    ...state,
    doctrineDrift: {
      ...state.doctrineDrift,
      active: false,
    },
  };
}

/**
 * Enable doctrine drift
 */
export function enableDoctrineDrift(state: GreatOldOnesState): GreatOldOnesState {
  if (!state.doctrineDrift) {
    return initializeDoctrineDriftForCampaign(state);
  }

  return {
    ...state,
    doctrineDrift: {
      ...state.doctrineDrift,
      active: true,
    },
  };
}
