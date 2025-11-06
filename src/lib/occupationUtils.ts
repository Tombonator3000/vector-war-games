/**
 * Occupation & Resistance System Utilities
 *
 * Manages occupied territories, resistance movements, and garrison requirements
 */

import type { Nation } from '@/types/game';
import type {
  OccupiedTerritory,
  ResistanceState,
  GarrisonState,
  OccupationPolicyType,
  UprisingEvent,
  OCCUPATION_POLICIES,
  ResistanceActivity,
  ForeignResistanceSupport,
} from '@/types/heartsOfIronPhase4';
import { generateId } from './idGenerator';

/**
 * Create a new occupied territory
 */
export function createOccupiedTerritory(
  territoryId: string,
  occupierId: string,
  formerOwnerId: string,
  currentTurn: number,
  initialPolicy: OccupationPolicyType = 'moderate'
): OccupiedTerritory {
  const policy = OCCUPATION_POLICIES[initialPolicy];

  return {
    territoryId,
    occupierId,
    formerOwnerId,
    occupiedSince: currentTurn,

    resistance: createResistanceState(),

    garrison: createGarrisonState(),

    policy,

    resourceExtraction: {
      production: 0,
      uranium: 0,
      intel: 0,
      efficiency: 1.0 - policy.resourcePenalty,
      sabotageLevel: 0,
    },

    status: 'tense',
  };
}

/**
 * Create initial resistance state
 */
function createResistanceState(): ResistanceState {
  return {
    level: 30, // Start with moderate resistance
    compliance: 20, // Low initial compliance

    activity: [],

    growthRate: 2, // Base growth per turn

    foreignSupport: [],

    strength: 10, // Low initial military capability
    organization: 20, // Moderate organization
  };
}

/**
 * Create initial garrison state
 */
function createGarrisonState(): GarrisonState {
  return {
    assignedUnits: [],
    totalStrength: 0,
    requiredStrength: 100, // Will be recalculated
    suppressionEffectiveness: 0,
    garrisonMorale: 80, // Start with good morale
  };
}

/**
 * Calculate required garrison strength
 */
export function calculateRequiredGarrison(
  occupation: OccupiedTerritory,
  territoryPopulation: number
): number {
  const baseRequirement = territoryPopulation / 1000000; // 1 unit per million pop

  const resistanceMultiplier = 1 + (occupation.resistance.level / 100);
  const policyMultiplier = occupation.policy.garrisonRequirement;

  return Math.ceil(baseRequirement * resistanceMultiplier * policyMultiplier);
}

/**
 * Calculate garrison suppression effectiveness
 */
export function calculateSuppressionEffectiveness(garrison: GarrisonState): number {
  if (garrison.totalStrength === 0) return 0;

  const strengthRatio = garrison.totalStrength / garrison.requiredStrength;
  const moraleModifier = garrison.garrisonMorale / 100;

  let effectiveness = Math.min(100, strengthRatio * 100 * moraleModifier);

  // Diminishing returns above 100% strength
  if (strengthRatio > 1) {
    const excess = strengthRatio - 1;
    effectiveness = 100 + (excess * 20); // Less effective past 100%
  }

  return Math.min(150, effectiveness);
}

/**
 * Update resistance state each turn
 */
export function updateResistanceState(
  occupation: OccupiedTerritory,
  currentTurn: number
): OccupiedTerritory {
  const resistance = { ...occupation.resistance };

  // Calculate resistance growth
  let growthRate = occupation.policy.resistanceImpact;

  // Foreign support increases growth
  const supportBonus = resistance.foreignSupport.reduce(
    (sum, support) => sum + support.amountPerTurn / 10,
    0
  );
  growthRate += supportBonus;

  // Garrison suppression reduces growth
  const suppression = occupation.garrison.suppressionEffectiveness;
  growthRate -= suppression / 20; // Each 20 suppression = -1 growth

  // Update resistance level
  resistance.level = Math.max(0, Math.min(100, resistance.level + growthRate));

  // Calculate compliance change
  const complianceChange = occupation.policy.complianceGain;
  const resistancePenalty = resistance.level / 50; // High resistance slows compliance
  const netComplianceChange = complianceChange - resistancePenalty;

  resistance.compliance = Math.max(
    0,
    Math.min(100, resistance.compliance + netComplianceChange)
  );

  // Update resistance strength
  resistance.strength = Math.floor((resistance.level * resistance.organization) / 50);

  // Generate resistance activities
  resistance.activity = generateResistanceActivities(resistance, occupation);

  return {
    ...occupation,
    resistance,
  };
}

/**
 * Generate resistance activities based on state
 */
function generateResistanceActivities(
  resistance: ResistanceState,
  occupation: OccupiedTerritory
): ResistanceActivity[] {
  const activities: ResistanceActivity[] = [];

  // Higher resistance = more activities
  if (resistance.level > 20) activities.push('propaganda');
  if (resistance.level > 40) activities.push('sabotage');
  if (resistance.level > 60) activities.push('assassination');
  if (resistance.level > 80) activities.push('armed_uprising');

  // Always gathering intel
  activities.push('intel_gathering');

  return activities;
}

/**
 * Apply sabotage to resource extraction
 */
export function applySabotageToResources(occupation: OccupiedTerritory): OccupiedTerritory {
  const sabotageLevel = Math.min(100, occupation.resistance.level + occupation.resistance.strength);

  const efficiency = Math.max(0, 1 - occupation.policy.resourcePenalty - (sabotageLevel / 200));

  return {
    ...occupation,
    resourceExtraction: {
      ...occupation.resourceExtraction,
      sabotageLevel,
      efficiency,
    },
  };
}

/**
 * Calculate uprising risk
 */
export function calculateUprisingRisk(occupation: OccupiedTerritory): number {
  let risk = 0;

  // Base risk from resistance level
  risk += occupation.resistance.level / 2;

  // Insufficient garrison increases risk
  if (occupation.garrison.totalStrength < occupation.garrison.requiredStrength) {
    const deficit = occupation.garrison.requiredStrength - occupation.garrison.totalStrength;
    risk += deficit * 2;
  }

  // Brutal policy increases risk
  if (occupation.policy.type === 'brutal') {
    risk += 20;
  }

  // High resistance strength increases risk
  risk += occupation.resistance.strength / 2;

  return Math.min(100, Math.max(0, risk));
}

/**
 * Check for uprising and create event if it occurs
 */
export function checkForUprising(
  occupation: OccupiedTerritory,
  currentTurn: number
): UprisingEvent | null {
  const risk = calculateUprisingRisk(occupation);

  // Roll for uprising
  if (Math.random() * 100 > risk) {
    return null; // No uprising
  }

  // Create uprising event
  return {
    id: generateId(),
    territoryId: occupation.territoryId,
    turn: currentTurn,

    resistanceStrength: occupation.resistance.strength * 10, // Scale up
    garrisonStrength: occupation.garrison.totalStrength,

    outcome: 'ongoing',

    resistanceCasualties: 0,
    garrisonCasualties: 0,
    civilianCasualties: 0,

    resistanceChange: 0,
    complianceChange: 0,
    internationalReaction: 0,
  };
}

/**
 * Resolve uprising combat
 */
export function resolveUprising(
  uprising: UprisingEvent,
  occupation: OccupiedTerritory
): {
  uprising: UprisingEvent;
  occupation: OccupiedTerritory;
} {
  const resistanceRoll = Math.random() * uprising.resistanceStrength;
  const garrisonRoll = Math.random() * uprising.garrisonStrength;

  let outcome: UprisingEvent['outcome'];
  let resistanceChange = 0;
  let complianceChange = 0;
  let internationalReaction = 0;

  if (garrisonRoll > resistanceRoll * 1.5) {
    // Garrison wins decisively
    outcome = 'suppressed';
    resistanceChange = -20;
    complianceChange = -10;
    uprising.resistanceCasualties = Math.floor(uprising.resistanceStrength * 0.6);
    uprising.garrisonCasualties = Math.floor(uprising.garrisonStrength * 0.1);
    uprising.civilianCasualties = Math.floor(uprising.resistanceStrength * 0.3);
    internationalReaction = -15;
  } else if (resistanceRoll > garrisonRoll * 1.5) {
    // Resistance wins
    outcome = 'successful';
    resistanceChange = 30;
    complianceChange = -30;
    uprising.resistanceCasualties = Math.floor(uprising.resistanceStrength * 0.2);
    uprising.garrisonCasualties = Math.floor(uprising.garrisonStrength * 0.5);
    uprising.civilianCasualties = Math.floor(uprising.resistanceStrength * 0.1);
    internationalReaction = -30;
  } else {
    // Stalemate - ongoing
    outcome = 'ongoing';
    resistanceChange = 5;
    complianceChange = -5;
    uprising.resistanceCasualties = Math.floor(uprising.resistanceStrength * 0.3);
    uprising.garrisonCasualties = Math.floor(uprising.garrisonStrength * 0.2);
    uprising.civilianCasualties = Math.floor(uprising.resistanceStrength * 0.2);
    internationalReaction = -20;
  }

  // Update uprising
  const updatedUprising = {
    ...uprising,
    outcome,
    resistanceChange,
    complianceChange,
    internationalReaction,
  };

  // Update occupation
  let updatedOccupation = { ...occupation };

  updatedOccupation.resistance.level = Math.max(
    0,
    Math.min(100, updatedOccupation.resistance.level + resistanceChange)
  );

  updatedOccupation.resistance.compliance = Math.max(
    0,
    Math.min(100, updatedOccupation.resistance.compliance + complianceChange)
  );

  // Reduce garrison strength
  updatedOccupation.garrison.totalStrength = Math.max(
    0,
    updatedOccupation.garrison.totalStrength - uprising.garrisonCasualties
  );

  // If uprising successful, change status
  if (outcome === 'successful') {
    updatedOccupation.status = 'liberated';
  } else if (outcome === 'suppressed') {
    updatedOccupation.status = updatedOccupation.resistance.level > 50 ? 'unstable' : 'tense';
  }

  return {
    uprising: updatedUprising,
    occupation: updatedOccupation,
  };
}

/**
 * Change occupation policy
 */
export function changeOccupationPolicy(
  occupation: OccupiedTerritory,
  newPolicyType: OccupationPolicyType
): OccupiedTerritory {
  const newPolicy = OCCUPATION_POLICIES[newPolicyType];

  return {
    ...occupation,
    policy: newPolicy,
    resourceExtraction: {
      ...occupation.resourceExtraction,
      efficiency: 1.0 - newPolicy.resourcePenalty,
    },
  };
}

/**
 * Add foreign support to resistance
 */
export function addForeignResistanceSupport(
  occupation: OccupiedTerritory,
  supportingNationId: string,
  type: ForeignResistanceSupport['type'],
  amountPerTurn: number
): OccupiedTerritory {
  const support: ForeignResistanceSupport = {
    supportingNationId,
    type,
    amountPerTurn,
    discovered: false,
  };

  return {
    ...occupation,
    resistance: {
      ...occupation.resistance,
      foreignSupport: [...occupation.resistance.foreignSupport, support],
    },
  };
}

/**
 * Remove foreign support (if discovered or ceased)
 */
export function removeForeignResistanceSupport(
  occupation: OccupiedTerritory,
  supportingNationId: string
): OccupiedTerritory {
  return {
    ...occupation,
    resistance: {
      ...occupation.resistance,
      foreignSupport: occupation.resistance.foreignSupport.filter(
        s => s.supportingNationId !== supportingNationId
      ),
    },
  };
}

/**
 * Update garrison units
 */
export function updateGarrison(
  occupation: OccupiedTerritory,
  assignedUnits: string[],
  totalStrength: number
): OccupiedTerritory {
  const garrison: GarrisonState = {
    assignedUnits,
    totalStrength,
    requiredStrength: occupation.garrison.requiredStrength,
    suppressionEffectiveness: 0,
    garrisonMorale: occupation.garrison.garrisonMorale,
  };

  garrison.suppressionEffectiveness = calculateSuppressionEffectiveness(garrison);

  return {
    ...occupation,
    garrison,
  };
}

/**
 * Update garrison morale
 */
export function updateGarrisonMorale(
  occupation: OccupiedTerritory,
  currentTurn: number
): OccupiedTerritory {
  let moraleDelta = 0;

  // Low morale from being outnumbered
  if (occupation.garrison.totalStrength < occupation.garrison.requiredStrength) {
    moraleDelta -= 2;
  }

  // Low morale from high resistance
  if (occupation.resistance.level > 70) {
    moraleDelta -= 1;
  }

  // Low morale from long occupation
  const occupationLength = currentTurn - occupation.occupiedSince;
  if (occupationLength > 20) {
    moraleDelta -= 1;
  }

  // Good morale from high compliance
  if (occupation.resistance.compliance > 70) {
    moraleDelta += 1;
  }

  const newMorale = Math.max(
    0,
    Math.min(100, occupation.garrison.garrisonMorale + moraleDelta)
  );

  return {
    ...occupation,
    garrison: {
      ...occupation.garrison,
      garrisonMorale: newMorale,
    },
  };
}

/**
 * Calculate diplomatic penalty from occupation
 */
export function calculateDiplomaticPenalty(occupation: OccupiedTerritory): number {
  let penalty = occupation.policy.relationshipPenalty;

  // Additional penalty for high resistance
  if (occupation.resistance.level > 70) {
    penalty -= 10;
  }

  // Additional penalty for brutal suppression
  if (occupation.status === 'uprising') {
    penalty -= 20;
  }

  return penalty;
}

/**
 * Extract resources from occupied territory
 */
export function extractResources(
  occupation: OccupiedTerritory,
  baseProduction: number,
  baseUranium: number,
  baseIntel: number
): {
  production: number;
  uranium: number;
  intel: number;
} {
  const efficiency = occupation.resourceExtraction.efficiency;

  return {
    production: Math.floor(baseProduction * efficiency),
    uranium: Math.floor(baseUranium * efficiency),
    intel: Math.floor(baseIntel * efficiency),
  };
}

/**
 * Get occupation status description
 */
export function getOccupationStatusDescription(
  occupation: OccupiedTerritory
): string {
  switch (occupation.status) {
    case 'stable':
      return `Stable occupation. Resistance: ${occupation.resistance.level}%, Compliance: ${occupation.resistance.compliance}%`;
    case 'tense':
      return `Tense situation. Resistance: ${occupation.resistance.level}%, Compliance: ${occupation.resistance.compliance}%`;
    case 'unstable':
      return `Unstable occupation. High resistance: ${occupation.resistance.level}%`;
    case 'uprising':
      return `Active uprising! Resistance strength: ${occupation.resistance.strength}`;
    case 'liberated':
      return 'Territory liberated by resistance forces';
  }
}

/**
 * Update occupation status based on resistance and compliance
 */
export function updateOccupationStatus(
  occupation: OccupiedTerritory
): OccupiedTerritory {
  let status = occupation.status;

  if (occupation.status === 'liberated') {
    return occupation; // Already liberated
  }

  const resistance = occupation.resistance.level;
  const compliance = occupation.resistance.compliance;

  if (resistance < 30 && compliance > 70) {
    status = 'stable';
  } else if (resistance < 50 && compliance > 40) {
    status = 'tense';
  } else if (resistance >= 50 || compliance < 40) {
    status = 'unstable';
  }

  // Uprising status is set by uprising events

  return {
    ...occupation,
    status,
  };
}
