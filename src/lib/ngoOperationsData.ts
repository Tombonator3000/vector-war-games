/**
 * NGO Operations Data
 * Defines available NGO operations for immigration and destabilization
 */

import type { NGOOperationTemplate, NGOType } from '@/types/ngoSystem';

export const NGO_OPERATION_TEMPLATES: Record<NGOType, NGOOperationTemplate> = {
  humanitarian_aid: {
    ngoType: 'humanitarian_aid',
    name: 'Humanitarian Aid NGO',
    description:
      'Establish a humanitarian aid organization to assist refugees fleeing conflict. Moderately effective at moving population while maintaining plausible deniability.',
    icon: '🏥',

    setupCost: {
      gold: 150,
      intel: 20,
    },

    costPerTurn: {
      gold: 50,
      intel: 5,
    },

    baseEffects: {
      immigrationRate: 0.8, // 0.8M migrants per turn
      targetInstability: 3,  // Moderate instability
      sourceInstability: 1,  // Minimal source disruption
      targetOpposition: 2,   // Some opposition boost
    },

    minDuration: 5,
    maxDuration: 20,
    baseDetectionRisk: 15, // 15% chance per turn

    isCovert: false, // Public operations

    requirements: {
      minNGOInfrastructure: 0, // Entry-level NGO
      minIntel: 50,
    },

    relationsPenaltyIfExposed: -10,
    canTargetAllies: true, // Can be used against allies
  },

  cultural_exchange: {
    ngoType: 'cultural_exchange',
    name: 'Cultural Exchange Program',
    description:
      'Sponsor cultural exchange programs that encourage long-term migration. Lower destabilization but creates loyal population groups.',
    icon: '🎭',

    setupCost: {
      gold: 200,
      production: 30,
    },

    costPerTurn: {
      gold: 60,
      production: 10,
    },

    baseEffects: {
      immigrationRate: 0.5,  // Slower migration
      targetInstability: 1,  // Minimal instability
      sourceInstability: 0,  // No source disruption
      targetOpposition: 0,   // No opposition boost
    },

    minDuration: 8,
    maxDuration: 30,
    baseDetectionRisk: 5,  // Very low risk

    isCovert: false,

    requirements: {
      minNGOInfrastructure: 20,
      minIntel: 30,
    },

    relationsPenaltyIfExposed: -5,
    canTargetAllies: true,
  },

  migration_advocacy: {
    ngoType: 'migration_advocacy',
    name: 'Migration Advocacy Network',
    description:
      'Create advocacy organizations that lobby for open borders and migrant rights. High destabilization through political pressure.',
    icon: '📢',

    setupCost: {
      gold: 180,
      intel: 35,
    },

    costPerTurn: {
      gold: 70,
      intel: 10,
    },

    baseEffects: {
      immigrationRate: 1.2,  // Moderate migration
      targetInstability: 6,  // High instability
      sourceInstability: 2,  // Some source disruption
      targetOpposition: 5,   // Strong opposition boost
    },

    minDuration: 6,
    maxDuration: 18,
    baseDetectionRisk: 25, // Higher risk

    isCovert: false,

    requirements: {
      minNGOInfrastructure: 30,
      minIntel: 60,
    },

    relationsPenaltyIfExposed: -20,
    canTargetAllies: false,
  },

  refugee_resettlement: {
    ngoType: 'refugee_resettlement',
    name: 'Refugee Resettlement Agency',
    description:
      'Operate large-scale refugee resettlement programs. Maximum immigration rate with high destabilization potential.',
    icon: '🚐',

    setupCost: {
      gold: 300,
      intel: 50,
      production: 40,
    },

    costPerTurn: {
      gold: 100,
      intel: 15,
      production: 15,
    },

    baseEffects: {
      immigrationRate: 2.0,  // High migration rate
      targetInstability: 8,  // Very high instability
      sourceInstability: 3,  // Significant source disruption
      targetOpposition: 7,   // Major opposition boost
    },

    minDuration: 4,
    maxDuration: 12,
    baseDetectionRisk: 35, // High detection risk

    isCovert: false,

    requirements: {
      minNGOInfrastructure: 50,
      minIntel: 80,
    },

    relationsPenaltyIfExposed: -30,
    canTargetAllies: false,
  },

  border_assistance: {
    ngoType: 'border_assistance',
    name: 'Border Assistance Network',
    description:
      'Covert operations to facilitate illegal border crossings. Highly effective but very risky if exposed.',
    icon: '🗺️',

    setupCost: {
      gold: 250,
      intel: 80,
    },

    costPerTurn: {
      gold: 90,
      intel: 25,
    },

    baseEffects: {
      immigrationRate: 1.5,  // High migration
      targetInstability: 10, // Maximum instability
      sourceInstability: 4,  // High source disruption
      targetOpposition: 8,   // Maximum opposition boost
    },

    minDuration: 3,
    maxDuration: 10,
    baseDetectionRisk: 45, // Very high risk

    isCovert: true, // Covert operation

    requirements: {
      minNGOInfrastructure: 60,
      minIntel: 100,
      requiredTech: ['advanced_intelligence'],
    },

    relationsPenaltyIfExposed: -50, // Severe penalty
    canTargetAllies: false,
  },
};

/**
 * Calculate effective immigration rate based on various factors
 */
export function calculateEffectiveImmigrationRate(
  baseRate: number,
  sponsorNGOInfrastructure: number,
  sourcePopulation: number,
  targetImmigrationPolicy: string | undefined,
  targetStability: number
): number {
  let rate = baseRate;

  // NGO infrastructure bonus (0-100 infrastructure gives 0-50% bonus)
  const infrastructureBonus = 1 + (sponsorNGOInfrastructure / 200);
  rate *= infrastructureBonus;

  // Source population affects migration potential
  if (sourcePopulation < 20) {
    rate *= 0.5; // Small nations have less migration potential
  } else if (sourcePopulation > 100) {
    rate *= 1.3; // Large nations have more migration potential
  }

  // Target immigration policy affects flow
  switch (targetImmigrationPolicy) {
    case 'closed_borders':
      rate *= 0.3; // Very difficult to migrate
      break;
    case 'selective':
      rate *= 0.6;
      break;
    case 'humanitarian':
      rate *= 1.2; // Easier migration
      break;
    case 'open_borders':
      rate *= 1.5; // Much easier migration
      break;
    case 'cultural_exchange':
      rate *= 1.1;
      break;
  }

  // Target stability affects migration (unstable nations are easier to infiltrate)
  const instability = 100 - targetStability;
  const instabilityBonus = 1 + (instability / 200); // 0-50% bonus
  rate *= instabilityBonus;

  return Math.max(0.1, rate); // Minimum 0.1M migrants per turn
}

/**
 * Calculate effective destabilization based on various factors
 */
export function calculateEffectiveDestabilization(
  baseDestabilization: number,
  targetPopulation: number,
  migrantFlow: number,
  targetOppositionStrength: number
): number {
  let destabilization = baseDestabilization;

  // Migration as percentage of population amplifies destabilization
  const migrantRatio = migrantFlow / targetPopulation;
  const migrantMultiplier = 1 + migrantRatio * 20; // Up to 2x bonus for high migration
  destabilization *= migrantMultiplier;

  // Opposition strength amplifies destabilization
  const oppositionBonus = 1 + (targetOppositionStrength / 200);
  destabilization *= oppositionBonus;

  return Math.round(destabilization);
}

/**
 * Calculate detection risk for an NGO operation
 */
export function calculateDetectionRisk(
  baseRisk: number,
  turnActive: number,
  targetIntelligence: number,
  sponsorNGOReputation: number,
  isCovert: boolean
): number {
  let risk = baseRisk;

  // Risk increases over time (operations get noticed)
  const timeMultiplier = 1 + (turnActive * 0.1);
  risk *= timeMultiplier;

  // Target intelligence increases detection
  const intelBonus = targetIntelligence / 100; // 0-2x multiplier
  risk *= 1 + intelBonus;

  // NGO reputation reduces risk (0-100 reputation gives 0-30% reduction)
  const reputationReduction = (sponsorNGOReputation / 100) * 0.3;
  risk *= 1 - reputationReduction;

  // Covert operations are harder to detect
  if (isCovert) {
    risk *= 0.7;
  }

  return Math.min(95, Math.max(1, Math.round(risk))); // 1-95% range
}

/**
 * Initialize NGO state for a nation
 */
export function initializeNGOState() {
  return {
    activeOperations: [],
    ngoInfrastructure: 0,
    maxActiveOperations: 2, // Start with 2 concurrent operations
    ngoReputation: 50,      // Start at neutral
    exposedOperations: 0,
    totalMigrantsMoved: 0,
    totalOperationsLaunched: 0,
    successfulOperations: 0,
  };
}
