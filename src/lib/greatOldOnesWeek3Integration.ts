/**
 * Great Old Ones - Week 3 Integration
 * Integrates ritual site mechanics, unit roster, and mission generator
 */

import type { GreatOldOnesState } from '../types/greatOldOnes';
import type { Infiltrator } from './unitRoster';
import type { Mission, CounterOperation } from './missionGenerator';

// Ritual site mechanics
import {
  updateRitualSites,
  evaluateSitePlacement,
} from './ritualSiteMechanics';

// Unit roster
import {
  updateEntityBindings,
} from './unitRoster';

// Mission generator
import {
  generateMissions,
  generateCounterOps,
  scoreMissionOutcome,
} from './missionGenerator';

// ============================================================================
// EXTENDED STATE FOR WEEK 3 FEATURES
// ============================================================================

export interface Week3ExtendedState {
  /** Infiltrators (not stored in base GreatOldOnesState) */
  infiltrators: Infiltrator[];

  /** Available missions */
  availableMissions: Mission[];

  /** Active missions */
  activeMissions: Mission[];

  /** Completed missions */
  completedMissions: Mission[];

  /** Human counter-operations */
  counterOperations: CounterOperation[];

  /** Doctrine points (for unlocking special mechanics) */
  doctrinePoints: number;

  /** Elder One favor (affects victory conditions) */
  elderOneFavor: number;
}

/**
 * Initialize Week 3 extended state
 */
export function initializeWeek3State(): Week3ExtendedState {
  return {
    infiltrators: [],
    availableMissions: [],
    activeMissions: [],
    completedMissions: [],
    counterOperations: [],
    doctrinePoints: 0,
    elderOneFavor: 0,
  };
}

// ============================================================================
// TURN UPDATE INTEGRATION
// ============================================================================

/**
 * Update all Week 3 systems for a new turn
 */
export function updateWeek3Systems(
  state: GreatOldOnesState,
  week3State: Week3ExtendedState
): Week3ExtendedState {
  const updated = { ...week3State };

  // Update ritual sites
  updateRitualSites(state);

  // Update entity bindings (check for rampages)
  updateEntityBindings(state);

  // Update infiltrator depth and influence
  updated.infiltrators = updateInfiltrators(updated.infiltrators, state);

  // Progress active missions
  updated.activeMissions = progressMissions(updated.activeMissions, state);

  // Check for mission expirations
  const { active, expired } = checkMissionExpirations(updated.activeMissions, state);
  updated.activeMissions = active;
  expired.forEach(mission => {
    updated.completedMissions.push({
      ...mission,
      status: 'failed',
    });
  });

  // Generate new missions if needed
  if (updated.availableMissions.length < 3) {
    const newMissions = generateMissions(state, 3 - updated.availableMissions.length);
    updated.availableMissions.push(...newMissions);
  }

  // Generate counter-operations based on investigation heat
  const newCounterOps = generateCounterOps(state);
  updated.counterOperations.push(...newCounterOps);

  // Progress counter-operations
  updated.counterOperations = progressCounterOps(updated.counterOperations, state);

  return updated;
}

// ============================================================================
// INFILTRATOR UPDATES
// ============================================================================

function updateInfiltrators(
  infiltrators: Infiltrator[],
  state: GreatOldOnesState
): Infiltrator[] {
  return infiltrators.map(infiltrator => {
    if (infiltrator.exposed) {
      return infiltrator; // No progress when exposed
    }

    // Gradually increase depth and influence
    const depthGain = Math.random() * 2 + 1; // 1-3% per turn
    const influenceGain = Math.random() * 1.5 + 0.5; // 0.5-2% per turn

    // Region corruption helps infiltration
    const region = state.regions.find(r => r.regionId === infiltrator.regionId);
    const corruptionBonus = region ? region.corruption / 100 : 0;

    return {
      ...infiltrator,
      depth: Math.min(100, infiltrator.depth + depthGain + corruptionBonus),
      influence: Math.min(100, infiltrator.influence + influenceGain),
    };
  });
}

// ============================================================================
// MISSION PROGRESSION
// ============================================================================

function progressMissions(
  missions: Mission[],
  state: GreatOldOnesState
): Mission[] {
  return missions.map(mission => {
    // Auto-progress based on assigned cultists and state
    const region = state.regions.find(r => r.regionId === mission.regionId);
    if (!region) return mission;

    let progressGain = 0;

    // Different mission types progress differently
    switch (mission.category) {
      case 'harvest_sanity':
        // Progress based on harvesting cultists
        const harvestingCells = state.cultistCells.filter(
          c => c.regionId === mission.regionId && c.assignment === 'harvesting'
        ).length;
        progressGain = harvestingCells * 5;
        break;

      case 'perform_ritual':
        // Progress based on ritual site activity
        const activeSites = region.ritualSites.filter(s => s.activeRitual);
        progressGain = activeSites.length * 10;
        break;

      case 'spread_corruption':
        // Progress based on corruption gain
        progressGain = region.corruption > mission.progress ? 5 : 0;
        break;

      case 'infiltrate_institution':
        // Progress based on infiltrator activity
        progressGain = 3;
        break;

      default:
        // Default slow progress
        progressGain = 2;
    }

    // Apply modifiers
    progressGain *= (1 + mission.modifiers.doctrineBonus - mission.modifiers.investigationPenalty);
    progressGain *= state.alignment.ritualPowerModifier;

    const newProgress = Math.min(100, mission.progress + progressGain);

    // Update objectives based on progress
    const updatedObjectives = mission.objectives.map(obj => {
      if (obj.completed) return obj;

      const objProgress = Math.floor((newProgress / 100) * obj.target);
      return {
        ...obj,
        progress: objProgress,
        completed: objProgress >= obj.target,
      };
    });

    return {
      ...mission,
      progress: newProgress,
      objectives: updatedObjectives,
    };
  });
}

function checkMissionExpirations(
  missions: Mission[],
  state: GreatOldOnesState
): { active: Mission[]; expired: Mission[] } {
  const active: Mission[] = [];
  const expired: Mission[] = [];

  missions.forEach(mission => {
    const turnsElapsed = state.alignment.turn - mission.createdTurn;
    if (turnsElapsed >= mission.timeLimit) {
      expired.push(mission);
    } else {
      active.push(mission);
    }
  });

  return { active, expired };
}

// ============================================================================
// COUNTER-OPERATION PROGRESSION
// ============================================================================

function progressCounterOps(
  counterOps: CounterOperation[],
  state: GreatOldOnesState
): CounterOperation[] {
  const remaining: CounterOperation[] = [];

  counterOps.forEach(counterOp => {
    const updated = {
      ...counterOp,
      turnsUntilExecution: counterOp.turnsUntilExecution - 1,
    };

    if (updated.turnsUntilExecution <= 0) {
      // Execute counter-operation
      executeCounterOp(updated, state);
    } else {
      remaining.push(updated);
    }
  });

  return remaining;
}

function executeCounterOp(
  counterOp: CounterOperation,
  state: GreatOldOnesState
): void {
  const region = state.regions.find(r => r.regionId === counterOp.targetRegionId);
  if (!region) return;

  switch (counterOp.type) {
    case 'raid':
      // Apply raid damage
      if (counterOp.potentialDamage.cultistLosses) {
        // Remove cultist cells
        const cellsToRemove = counterOp.potentialDamage.cultistLosses;
        state.cultistCells = state.cultistCells.filter((cell, index) =>
          cell.regionId !== counterOp.targetRegionId || index >= cellsToRemove
        );
        region.cultistCells = Math.max(0, region.cultistCells - cellsToRemove);
      }

      if (counterOp.potentialDamage.siteDestruction && counterOp.targetSiteId) {
        // Destroy site
        region.ritualSites = region.ritualSites.filter(s => s.id !== counterOp.targetSiteId);
      }

      if (counterOp.potentialDamage.veilDamage) {
        state.resources.veilIntegrity = Math.max(
          0,
          state.resources.veilIntegrity - counterOp.potentialDamage.veilDamage
        );
      }
      break;

    case 'investigation':
      if (counterOp.potentialDamage.veilDamage) {
        state.resources.veilIntegrity = Math.max(
          0,
          state.resources.veilIntegrity - counterOp.potentialDamage.veilDamage
        );
      }
      region.investigationHeat = Math.min(100, region.investigationHeat + 20);
      break;

    case 'counter_ritual':
      // Disrupt active rituals
      region.ritualSites.forEach(site => {
        if (site.activeRitual) {
          site.activeRitual = undefined;
        }
      });

      // Banish some entities
      state.summonedEntities = state.summonedEntities.filter(
        e => e.regionId !== counterOp.targetRegionId || Math.random() > 0.3
      );
      break;

    case 'exposure':
      if (counterOp.potentialDamage.veilDamage) {
        state.resources.veilIntegrity = Math.max(
          0,
          state.resources.veilIntegrity - counterOp.potentialDamage.veilDamage
        );
      }

      if (counterOp.potentialDamage.cultistLosses) {
        // Compromise some cells
        state.cultistCells
          .filter(c => c.regionId === counterOp.targetRegionId)
          .slice(0, counterOp.potentialDamage.cultistLosses)
          .forEach(cell => {
            cell.compromised = true;
          });
      }
      break;
  }
}

// ============================================================================
// MISSION COMPLETION
// ============================================================================

/**
 * Complete a mission and apply rewards/penalties
 */
export function completeMission(
  mission: Mission,
  state: GreatOldOnesState,
  week3State: Week3ExtendedState,
  completionTime: number,
  bonusFactors?: {
    noVeilDamage?: boolean;
    noCasulties?: boolean;
    speedBonus?: boolean;
  }
): Week3ExtendedState {
  const completedObjectives = mission.objectives.filter(o => o.completed).length;

  // Score the outcome
  const outcome = scoreMissionOutcome(mission, completionTime, completedObjectives, bonusFactors);

  // Apply rewards
  if (outcome.actualRewards.sanityFragments) {
    state.resources.sanityFragments = Math.min(
      state.limits.maxSanityFragments,
      state.resources.sanityFragments + outcome.actualRewards.sanityFragments
    );
  }

  if (outcome.actualRewards.eldritchPower) {
    state.resources.eldritchPower = Math.min(
      state.limits.maxEldritchPower,
      state.resources.eldritchPower + outcome.actualRewards.eldritchPower
    );
  }

  if (outcome.actualRewards.corruptionGain) {
    const region = state.regions.find(r => r.regionId === mission.regionId);
    if (region) {
      region.corruption = Math.min(100, region.corruption + outcome.actualRewards.corruptionGain);
    }
  }

  if (outcome.actualRewards.cultistRecruits) {
    // Add new cultist cells to the region
    const region = state.regions.find(r => r.regionId === mission.regionId);
    if (region) {
      region.cultistCells += outcome.actualRewards.cultistRecruits;
    }
  }

  // Apply penalties
  if (outcome.actualPenalties.veilDamage) {
    state.resources.veilIntegrity = Math.max(
      0,
      state.resources.veilIntegrity - outcome.actualPenalties.veilDamage
    );
  }

  if (outcome.actualPenalties.investigationHeat) {
    const region = state.regions.find(r => r.regionId === mission.regionId);
    if (region) {
      region.investigationHeat = Math.min(
        100,
        region.investigationHeat + outcome.actualPenalties.investigationHeat
      );
    }
  }

  // Update Week 3 state
  const updated = { ...week3State };
  updated.doctrinePoints += outcome.doctrineImpact;
  updated.elderOneFavor += outcome.elderOneFavor;

  // Move mission to completed
  updated.activeMissions = updated.activeMissions.filter(m => m.id !== mission.id);
  updated.completedMissions.push({
    ...mission,
    status: outcome.success ? 'completed' : 'failed',
  });

  return updated;
}

// ============================================================================
// SITE PLACEMENT RECOMMENDATIONS
// ============================================================================

/**
 * Get recommendations for where to place a new ritual site
 */
export function getRecommendedSitePlacements(state: GreatOldOnesState) {
  return evaluateSitePlacement(state);
}

// ============================================================================
// WEEK 3 STATISTICS
// ============================================================================

export interface Week3Statistics {
  totalMissionsCompleted: number;
  totalMissionsFailed: number;
  averageMissionGrade: string;
  totalInfiltrators: number;
  totalEntitiesSummoned: number;
  totalRitualSites: number;
  doctrinePoints: number;
  elderOneFavor: number;
  activeCounterOps: number;
}

/**
 * Calculate Week 3 statistics
 */
export function calculateWeek3Statistics(
  state: GreatOldOnesState,
  week3State: Week3ExtendedState
): Week3Statistics {
  const totalRitualSites = state.regions.reduce(
    (sum, r) => sum + r.ritualSites.length,
    0
  );

  const successfulMissions = week3State.completedMissions.filter(m => m.status === 'completed');
  const failedMissions = week3State.completedMissions.filter(m => m.status === 'failed');

  return {
    totalMissionsCompleted: successfulMissions.length,
    totalMissionsFailed: failedMissions.length,
    averageMissionGrade: calculateAverageGrade(week3State.completedMissions),
    totalInfiltrators: week3State.infiltrators.length,
    totalEntitiesSummoned: state.summonedEntities.length,
    totalRitualSites,
    doctrinePoints: week3State.doctrinePoints,
    elderOneFavor: week3State.elderOneFavor,
    activeCounterOps: week3State.counterOperations.length,
  };
}

function calculateAverageGrade(missions: Mission[]): string {
  if (missions.length === 0) return 'N/A';

  const gradeValues: Record<string, number> = {
    S: 6,
    A: 5,
    B: 4,
    C: 3,
    D: 2,
    F: 1,
  };

  // Note: Missions don't store grades, so this is a placeholder
  // In a real implementation, you'd store the grade with the completed mission
  return 'B';
}
