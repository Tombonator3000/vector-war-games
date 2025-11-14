/**
 * NGO Turn Processor
 * Handles turn-by-turn processing of NGO operations
 */

import type { Nation } from '@/types/game';
import type {
  NGOOperation,
  NGOImmigrationWave,
  NGOExposureEvent,
  NGOState,
} from '@/types/ngoSystem';
import type { PopGroup } from '@/types/popSystem';
import {
  calculateEffectiveImmigrationRate,
  calculateEffectiveDestabilization,
  calculateDetectionRisk,
  NGO_OPERATION_TEMPLATES,
} from './ngoOperationsData';

/**
 * Process all NGO operations for all nations in a turn
 */
export function processNGOOperationsTurn(nations: Nation[], currentTurn: number): {
  immigrationWaves: NGOImmigrationWave[];
  exposureEvents: NGOExposureEvent[];
  logs: string[];
} {
  const immigrationWaves: NGOImmigrationWave[] = [];
  const exposureEvents: NGOExposureEvent[] = [];
  const logs: string[] = [];

  // Process each nation's NGO operations
  for (const nation of nations) {
    if (!nation.ngoState || nation.eliminated) continue;

    const ngoState = nation.ngoState;
    const activeOps = ngoState.activeOperations.filter(
      (op) => op.status === 'active'
    );

    for (const operation of activeOps) {
      // Process the operation
      const result = processNGOOperation(
        operation,
        nations,
        ngoState,
        currentTurn
      );

      if (result.immigrationWave) {
        immigrationWaves.push(result.immigrationWave);
      }

      if (result.exposureEvent) {
        exposureEvents.push(result.exposureEvent);
      }

      logs.push(...result.logs);

      // Decrement turns remaining
      operation.turnsRemaining--;

      // Complete operation if done
      if (operation.turnsRemaining <= 0) {
        operation.status = 'completed';
        ngoState.successfulOperations++;
        logs.push(
          `NGO operation "${operation.name}" completed by ${nation.name}`
        );
      }
    }
  }

  return { immigrationWaves, exposureEvents, logs };
}

/**
 * Process a single NGO operation for one turn
 */
function processNGOOperation(
  operation: NGOOperation,
  nations: Nation[],
  sponsorNGOState: NGOState,
  currentTurn: number
): {
  immigrationWave?: NGOImmigrationWave;
  exposureEvent?: NGOExposureEvent;
  logs: string[];
} {
  const logs: string[] = [];

  // Find nations involved
  const sourceNation = nations.find((n) => n.id === operation.sourceNationId);
  const targetNation = nations.find((n) => n.id === operation.targetNationId);
  const sponsorNation = nations.find((n) => n.id === operation.sponsorNationId);

  if (!sourceNation || !targetNation || !sponsorNation) {
    logs.push(`NGO operation ${operation.id} has invalid nation references`);
    return { logs };
  }

  // Skip if source or target is eliminated
  if (sourceNation.eliminated || targetNation.eliminated) {
    operation.status = 'failed';
    logs.push(`NGO operation "${operation.name}" failed - nation eliminated`);
    return { logs };
  }

  const template = NGO_OPERATION_TEMPLATES[operation.ngoType];
  const turnsActive = operation.duration - operation.turnsRemaining;

  // Calculate effective immigration rate
  const effectiveImmigrationRate = calculateEffectiveImmigrationRate(
    operation.effects.immigrationRate,
    sponsorNGOState.ngoInfrastructure,
    sourceNation.population,
    targetNation.currentImmigrationPolicy,
    100 - (targetNation.instability || 0)
  );

  // Calculate effective destabilization
  const effectiveDestabilization = calculateEffectiveDestabilization(
    operation.effects.targetInstability,
    targetNation.population,
    effectiveImmigrationRate,
    targetNation.oppositionState?.strength || 0
  );

  // Apply effects to target nation
  applyNGOEffects(
    targetNation,
    sourceNation,
    effectiveImmigrationRate,
    effectiveDestabilization,
    operation.effects.targetOpposition,
    operation.id
  );

  // Apply minor effects to source nation
  if (operation.effects.sourceInstability > 0) {
    sourceNation.instability =
      (sourceNation.instability || 0) + operation.effects.sourceInstability;
  }

  // Update operation statistics
  operation.totalMigrants += effectiveImmigrationRate;
  sponsorNGOState.totalMigrantsMoved += effectiveImmigrationRate;

  // Create immigration wave record
  const immigrationWave: NGOImmigrationWave = {
    operationId: operation.id,
    sourceNationId: operation.sourceNationId,
    targetNationId: operation.targetNationId,
    migrants: effectiveImmigrationRate,
    turn: currentTurn,
    instabilityAdded: effectiveDestabilization,
    oppositionStrengthIncrease: operation.effects.targetOpposition,
    culturalTension: Math.round(effectiveImmigrationRate * 2),
  };

  // Check for detection/exposure
  const detectionRisk = calculateDetectionRisk(
    operation.detectionRisk,
    turnsActive,
    targetNation.intel || 0,
    sponsorNGOState.ngoReputation,
    operation.isCovert
  );

  operation.exposureChance = detectionRisk;

  // Roll for exposure
  const exposureRoll = Math.random() * 100;
  let exposureEvent: NGOExposureEvent | undefined;

  if (exposureRoll < detectionRisk && !operation.exposedToNations.includes(targetNation.id)) {
    // Operation exposed to target nation!
    operation.exposedToNations.push(targetNation.id);
    sponsorNGOState.exposedOperations++;

    const relationsPenalty = template.relationsPenaltyIfExposed;
    const reputationLoss = Math.round(detectionRisk / 5);

    // Apply diplomatic penalty
    if (targetNation.relationships && sponsorNation.id) {
      const currentRelations = targetNation.relationships[sponsorNation.id] || 0;
      targetNation.relationships[sponsorNation.id] = Math.max(
        -100,
        currentRelations + relationsPenalty
      );
    }

    // Reduce NGO reputation
    sponsorNGOState.ngoReputation = Math.max(
      0,
      sponsorNGOState.ngoReputation - reputationLoss
    );

    // Terminate operation if severely exposed
    const shouldTerminate = exposureRoll < detectionRisk / 2;
    if (shouldTerminate) {
      operation.status = 'exposed';
    }

    exposureEvent = {
      operationId: operation.id,
      exposedToNationId: targetNation.id,
      turn: currentTurn,
      exposureType: operation.isCovert ? 'intelligence' : 'media',
      consequences: {
        relationsPenalty,
        reputationLoss,
        operationTerminated: shouldTerminate,
      },
    };

    logs.push(
      `NGO operation "${operation.name}" exposed! ${sponsorNation.name}'s involvement detected by ${targetNation.name}`
    );
  }

  return { immigrationWave, exposureEvent, logs };
}

/**
 * Apply NGO effects to target nation
 */
function applyNGOEffects(
  targetNation: Nation,
  sourceNation: Nation,
  migrants: number,
  instability: number,
  oppositionBoost: number,
  operationId: string
): void {
  // Add migrants to target nation
  targetNation.migrantsThisTurn = (targetNation.migrantsThisTurn || 0) + migrants;
  targetNation.migrantsTotal = (targetNation.migrantsTotal || 0) + migrants;

  // Create or update population group
  if (!targetNation.popGroups) {
    targetNation.popGroups = [];
  }

  // Find existing pop group from same source or create new
  let popGroup = targetNation.popGroups.find(
    (pg) => pg.origin === sourceNation.id && pg.yearsSinceArrival < 2
  );

  if (!popGroup) {
    // Create new population group
    popGroup = {
      id: `ngo_${operationId}_${sourceNation.id}_${Date.now()}`,
      size: migrants,
      origin: sourceNation.id,
      loyalty: 30, // Low initial loyalty due to artificial migration
      culture: sourceNation.culturalIdentity || sourceNation.name,
      skills: 'medium',
      assimilation: 0,
      happiness: 40, // Lower happiness due to forced/encouraged migration
      yearsSinceArrival: 0,
      ideologyPreference: sourceNation.ideologyState?.currentIdeology,
      ideologySupport: 30,
    };
    targetNation.popGroups.push(popGroup);
  } else {
    // Add to existing group
    popGroup.size += migrants;
    // Lower loyalty/happiness due to continued artificial migration
    popGroup.loyalty = Math.max(20, popGroup.loyalty - 2);
    popGroup.happiness = Math.max(30, popGroup.happiness - 2);
  }

  // Add instability
  targetNation.instability = (targetNation.instability || 0) + instability;

  // Boost opposition if exists
  if (targetNation.oppositionState && oppositionBoost > 0) {
    targetNation.oppositionState.strength = Math.min(
      100,
      targetNation.oppositionState.strength + oppositionBoost
    );
  }

  // Reduce public opinion slightly
  targetNation.publicOpinion = Math.max(
    0,
    targetNation.publicOpinion - Math.round(instability / 2)
  );

  // Reduce morale slightly
  targetNation.morale = Math.max(
    0,
    targetNation.morale - Math.round(instability / 3)
  );
}

/**
 * Launch a new NGO operation
 */
export function launchNGOOperation(
  sponsorNation: Nation,
  sourceNationId: string,
  targetNationId: string,
  ngoType: string,
  duration: number,
  currentTurn: number
): {
  success: boolean;
  operation?: NGOOperation;
  message: string;
} {
  if (!sponsorNation.ngoState) {
    return {
      success: false,
      message: 'Nation does not have NGO infrastructure initialized',
    };
  }

  const template = NGO_OPERATION_TEMPLATES[ngoType as keyof typeof NGO_OPERATION_TEMPLATES];
  if (!template) {
    return {
      success: false,
      message: 'Invalid NGO operation type',
    };
  }

  const ngoState = sponsorNation.ngoState;

  // Check if at max operations
  if (ngoState.activeOperations.length >= ngoState.maxActiveOperations) {
    return {
      success: false,
      message: `Maximum active operations reached (${ngoState.maxActiveOperations})`,
    };
  }

  // Check requirements
  if (
    template.requirements.minNGOInfrastructure &&
    ngoState.ngoInfrastructure < template.requirements.minNGOInfrastructure
  ) {
    return {
      success: false,
      message: `Requires NGO infrastructure level ${template.requirements.minNGOInfrastructure}`,
    };
  }

  if (template.requirements.minIntel && sponsorNation.intel < template.requirements.minIntel) {
    return {
      success: false,
      message: `Requires ${template.requirements.minIntel} intel`,
    };
  }

  // Check if duration is valid
  if (duration < template.minDuration || duration > template.maxDuration) {
    return {
      success: false,
      message: `Duration must be between ${template.minDuration} and ${template.maxDuration} turns`,
    };
  }

  // Check if can afford setup cost
  const setupCost = template.setupCost;
  if (sponsorNation.gold !== undefined && setupCost.gold > sponsorNation.gold) {
    return {
      success: false,
      message: `Insufficient gold (need ${setupCost.gold}, have ${sponsorNation.gold})`,
    };
  }

  if (setupCost.intel && sponsorNation.intel < setupCost.intel) {
    return {
      success: false,
      message: `Insufficient intel (need ${setupCost.intel}, have ${sponsorNation.intel})`,
    };
  }

  if (setupCost.production && sponsorNation.production < setupCost.production) {
    return {
      success: false,
      message: `Insufficient production (need ${setupCost.production}, have ${sponsorNation.production})`,
    };
  }

  // Deduct setup costs
  if (sponsorNation.gold !== undefined) {
    sponsorNation.gold -= setupCost.gold;
  }
  if (setupCost.intel) {
    sponsorNation.intel = Math.max(0, sponsorNation.intel - setupCost.intel);
  }
  if (setupCost.production) {
    sponsorNation.production = Math.max(0, sponsorNation.production - setupCost.production);
  }

  // Create operation
  const operation: NGOOperation = {
    id: `ngo_op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: `${template.name} Operation`,
    sponsorNationId: sponsorNation.id,
    sourceNationId,
    targetNationId,
    ngoType: template.ngoType,
    startTurn: currentTurn,
    duration,
    turnsRemaining: duration,
    status: 'active',
    costPerTurn: { ...template.costPerTurn },
    effects: { ...template.baseEffects, diplomaticCost: template.relationsPenaltyIfExposed },
    detectionRisk: template.baseDetectionRisk,
    exposureChance: template.baseDetectionRisk,
    isCovert: template.isCovert,
    exposedToNations: [],
    totalMigrants: 0,
    popGroupsCreated: [],
  };

  // Add to active operations
  ngoState.activeOperations.push(operation);
  ngoState.totalOperationsLaunched++;

  return {
    success: true,
    operation,
    message: `Successfully launched ${template.name} operation`,
  };
}

/**
 * Cancel an ongoing NGO operation
 */
export function cancelNGOOperation(
  sponsorNation: Nation,
  operationId: string
): { success: boolean; message: string } {
  if (!sponsorNation.ngoState) {
    return { success: false, message: 'No NGO state found' };
  }

  const operationIndex = sponsorNation.ngoState.activeOperations.findIndex(
    (op) => op.id === operationId && op.status === 'active'
  );

  if (operationIndex === -1) {
    return { success: false, message: 'Operation not found or already completed' };
  }

  const operation = sponsorNation.ngoState.activeOperations[operationIndex];
  operation.status = 'failed';

  return {
    success: true,
    message: `Operation "${operation.name}" cancelled`,
  };
}

/**
 * Upgrade NGO infrastructure
 */
export function upgradeNGOInfrastructure(
  nation: Nation,
  goldCost: number = 200,
  productionCost: number = 50
): { success: boolean; message: string; newLevel?: number } {
  if (!nation.ngoState) {
    return { success: false, message: 'NGO state not initialized' };
  }

  if (nation.gold !== undefined && nation.gold < goldCost) {
    return { success: false, message: `Insufficient gold (need ${goldCost})` };
  }

  if (nation.production < productionCost) {
    return { success: false, message: `Insufficient production (need ${productionCost})` };
  }

  if (nation.ngoState.ngoInfrastructure >= 100) {
    return { success: false, message: 'NGO infrastructure already at maximum' };
  }

  // Deduct costs
  if (nation.gold !== undefined) {
    nation.gold -= goldCost;
  }
  nation.production -= productionCost;

  // Increase infrastructure
  const increase = 10;
  nation.ngoState.ngoInfrastructure = Math.min(
    100,
    nation.ngoState.ngoInfrastructure + increase
  );

  // Increase max operations at certain milestones
  if (nation.ngoState.ngoInfrastructure >= 80 && nation.ngoState.maxActiveOperations < 5) {
    nation.ngoState.maxActiveOperations = 5;
  } else if (nation.ngoState.ngoInfrastructure >= 50 && nation.ngoState.maxActiveOperations < 4) {
    nation.ngoState.maxActiveOperations = 4;
  } else if (nation.ngoState.ngoInfrastructure >= 30 && nation.ngoState.maxActiveOperations < 3) {
    nation.ngoState.maxActiveOperations = 3;
  }

  return {
    success: true,
    message: `NGO infrastructure upgraded to ${nation.ngoState.ngoInfrastructure}`,
    newLevel: nation.ngoState.ngoInfrastructure,
  };
}
