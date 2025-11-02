/**
 * Hybrid Doctrine System
 * Allows combining two doctrines with 60/40 split for strategic depth
 */

import type {
  Doctrine,
  DoctrineConfig,
  HybridDoctrine,
  DoctrineDrift,
  DriftAction,
  GreatOldOnesState,
} from '@/types/greatOldOnes';
import { DOCTRINES, getHybridDoctrineName } from '@/types/greatOldOnes';

// ============================================================================
// HYBRID DOCTRINE CREATION & BONUS CALCULATION
// ============================================================================

/**
 * Create a hybrid doctrine from two doctrines
 */
export function createHybridDoctrine(
  primary: Doctrine,
  secondary: Doctrine,
  primaryWeight: number = 0.6,
  secondaryWeight: number = 0.4
): HybridDoctrine {
  if (primary === secondary) {
    throw new Error('Cannot create hybrid from same doctrine');
  }

  return {
    primary,
    secondary,
    primaryWeight,
    secondaryWeight,
    hybridName: getHybridDoctrineName(primary, secondary),
  };
}

/**
 * Calculate combined bonuses for a hybrid doctrine
 * Returns weighted bonuses from both doctrines
 */
export function calculateHybridBonuses(hybrid: HybridDoctrine): DoctrineConfig['bonuses'] {
  const primaryConfig = DOCTRINES[hybrid.primary];
  const secondaryConfig = DOCTRINES[hybrid.secondary];

  // Combine bonuses with weighted averages
  const combinedBonuses: DoctrineConfig['bonuses'] = {};

  // Helper function to combine bonus values
  const combineBonusValue = (
    primaryValue: number | undefined,
    secondaryValue: number | undefined
  ): number | undefined => {
    const pValue = primaryValue ?? 1.0;
    const sValue = secondaryValue ?? 1.0;

    // Weighted average: (0.6 * primary) + (0.4 * secondary)
    return pValue * hybrid.primaryWeight + sValue * hybrid.secondaryWeight;
  };

  combinedBonuses.sanityHarvestRate = combineBonusValue(
    primaryConfig.bonuses.sanityHarvestRate,
    secondaryConfig.bonuses.sanityHarvestRate
  );

  combinedBonuses.eldritchPowerDecay = combineBonusValue(
    primaryConfig.bonuses.eldritchPowerDecay,
    secondaryConfig.bonuses.eldritchPowerDecay
  );

  combinedBonuses.veilIntegrityLoss = combineBonusValue(
    primaryConfig.bonuses.veilIntegrityLoss,
    secondaryConfig.bonuses.veilIntegrityLoss
  );

  combinedBonuses.corruptionSpread = combineBonusValue(
    primaryConfig.bonuses.corruptionSpread,
    secondaryConfig.bonuses.corruptionSpread
  );

  combinedBonuses.summoningRisk = combineBonusValue(
    primaryConfig.bonuses.summoningRisk,
    secondaryConfig.bonuses.summoningRisk
  );

  combinedBonuses.infiltrationSpeed = combineBonusValue(
    primaryConfig.bonuses.infiltrationSpeed,
    secondaryConfig.bonuses.infiltrationSpeed
  );

  return combinedBonuses;
}

/**
 * Calculate combined penalties for a hybrid doctrine
 */
export function calculateHybridPenalties(hybrid: HybridDoctrine): DoctrineConfig['penalties'] {
  const primaryConfig = DOCTRINES[hybrid.primary];
  const secondaryConfig = DOCTRINES[hybrid.secondary];

  const combinedPenalties: DoctrineConfig['penalties'] = {};

  const combinePenaltyValue = (
    primaryValue: number | undefined,
    secondaryValue: number | undefined
  ): number | undefined => {
    const pValue = primaryValue ?? 1.0;
    const sValue = secondaryValue ?? 1.0;
    return pValue * hybrid.primaryWeight + sValue * hybrid.secondaryWeight;
  };

  combinedPenalties.investigatorSpawnRate = combinePenaltyValue(
    primaryConfig.penalties.investigatorSpawnRate,
    secondaryConfig.penalties.investigatorSpawnRate
  );

  combinedPenalties.publicSuspicion = combinePenaltyValue(
    primaryConfig.penalties.publicSuspicion,
    secondaryConfig.penalties.publicSuspicion
  );

  combinedPenalties.resourceCost = combinePenaltyValue(
    primaryConfig.penalties.resourceCost,
    secondaryConfig.penalties.resourceCost
  );

  return combinedPenalties;
}

/**
 * Get combined unlocked mechanics from both doctrines
 */
export function getHybridUnlockedMechanics(hybrid: HybridDoctrine): string[] {
  const primaryConfig = DOCTRINES[hybrid.primary];
  const secondaryConfig = DOCTRINES[hybrid.secondary];

  // Combine and deduplicate mechanics
  const allMechanics = [
    ...primaryConfig.unlockedMechanics,
    ...secondaryConfig.unlockedMechanics,
  ];

  return Array.from(new Set(allMechanics));
}

/**
 * Get effective doctrine configuration for a hybrid
 */
export function getEffectiveDoctrineConfig(hybrid: HybridDoctrine): DoctrineConfig {
  return {
    id: hybrid.primary, // Primary doctrine ID
    name: hybrid.hybridName,
    description: `A hybrid approach combining ${DOCTRINES[hybrid.primary].name} (${hybrid.primaryWeight * 100}%) and ${DOCTRINES[hybrid.secondary].name} (${hybrid.secondaryWeight * 100}%).`,
    tagline: `${DOCTRINES[hybrid.primary].tagline} & ${DOCTRINES[hybrid.secondary].tagline}`,
    bonuses: calculateHybridBonuses(hybrid),
    penalties: calculateHybridPenalties(hybrid),
    unlockedMechanics: getHybridUnlockedMechanics(hybrid),
  };
}

// ============================================================================
// DOCTRINE DRIFT SYSTEM
// ============================================================================

/**
 * Initialize doctrine drift tracking
 */
export function initializeDoctrineDrift(): DoctrineDrift {
  return {
    driftValues: {
      domination: 0,
      corruption: 0,
      convergence: 0,
    },
    driftThreshold: 75,
    active: true,
    recentActions: [],
  };
}

/**
 * Record an action that affects doctrine drift
 */
export function recordDriftAction(
  drift: DoctrineDrift,
  turn: number,
  actionType: DriftAction['actionType'],
  doctrineAffinity: Doctrine,
  driftAmount: number,
  description: string
): DoctrineDrift {
  const newAction: DriftAction = {
    turn,
    actionType,
    doctrineAffinity,
    driftAmount,
    description,
  };

  // Update drift values
  const updatedDriftValues = { ...drift.driftValues };
  updatedDriftValues[doctrineAffinity] = Math.min(
    100,
    updatedDriftValues[doctrineAffinity] + driftAmount
  );

  // Keep only recent actions (last 10)
  const updatedActions = [newAction, ...drift.recentActions].slice(0, 10);

  return {
    ...drift,
    driftValues: updatedDriftValues,
    recentActions: updatedActions,
  };
}

/**
 * Decay drift values over time (natural regression to neutral)
 */
export function decayDriftValues(drift: DoctrineDrift, decayAmount: number = 2): DoctrineDrift {
  const updatedDriftValues = { ...drift.driftValues };

  // Decay all drift values toward 0
  for (const doctrine of Object.keys(updatedDriftValues) as Doctrine[]) {
    if (updatedDriftValues[doctrine] > 0) {
      updatedDriftValues[doctrine] = Math.max(0, updatedDriftValues[doctrine] - decayAmount);
    }
  }

  return {
    ...drift,
    driftValues: updatedDriftValues,
  };
}

/**
 * Check if any doctrine has reached drift threshold
 * Returns doctrine that should be shifted to, or null
 */
export function checkDriftThreshold(
  drift: DoctrineDrift,
  currentDoctrine: Doctrine | null
): Doctrine | null {
  if (!drift.active) return null;

  // Find doctrine with highest drift that exceeds threshold
  let highestDrift = 0;
  let driftDoctrine: Doctrine | null = null;

  for (const [doctrine, value] of Object.entries(drift.driftValues)) {
    if (value >= drift.driftThreshold && value > highestDrift) {
      // Don't drift to current doctrine
      if (doctrine !== currentDoctrine) {
        highestDrift = value;
        driftDoctrine = doctrine as Doctrine;
      }
    }
  }

  return driftDoctrine;
}

/**
 * Apply doctrine drift to state if threshold reached
 */
export function applyDoctrineDrift(
  state: GreatOldOnesState,
  newDoctrine: Doctrine
): GreatOldOnesState {
  return {
    ...state,
    doctrine: newDoctrine,
    // Reset drift values after drift occurs
    doctrineDrift: state.doctrineDrift
      ? {
          ...state.doctrineDrift,
          driftValues: {
            domination: 0,
            corruption: 0,
            convergence: 0,
          },
        }
      : undefined,
  };
}

/**
 * Get drift percentage for UI display
 */
export function getDriftPercentage(drift: DoctrineDrift, doctrine: Doctrine): number {
  return Math.round((drift.driftValues[doctrine] / drift.driftThreshold) * 100);
}

/**
 * Get doctrine that player is drifting toward (if any)
 */
export function getDominantDrift(drift: DoctrineDrift): { doctrine: Doctrine; value: number } | null {
  let highestDrift = 0;
  let dominantDoctrine: Doctrine | null = null;

  for (const [doctrine, value] of Object.entries(drift.driftValues)) {
    if (value > highestDrift) {
      highestDrift = value;
      dominantDoctrine = doctrine as Doctrine;
    }
  }

  if (dominantDoctrine && highestDrift > 20) {
    return { doctrine: dominantDoctrine, value: highestDrift };
  }

  return null;
}
