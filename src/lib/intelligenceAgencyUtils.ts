/**
 * Intelligence Agency Operations Utilities
 *
 * Manages intelligence agencies, operations, and upgrades
 */

import type { Nation } from '@/types/game';
import type {
  IntelligenceAgency,
  AgencyLevel,
  AgencyUpgrade,
  IntelOperation,
  IntelOperationType,
  IntelOperationResult,
  IntelOperationEffect,
  AGENCY_UPGRADES,
} from '@/types/heartsOfIronPhase4';
import type { SpyAgent } from '@/types/spySystem';
import { generateId } from './idGenerator';
import type { PolicyEffects } from '@/types/policy';

function getPolicyEffectsForNation(nationId: string): PolicyEffects | null {
  if (typeof window === 'undefined') return null;

  const map = (window as any).__policyEffectsByNation as
    | Record<string, PolicyEffects>
    | undefined;

  return map?.[nationId] ?? null;
}

/**
 * Initialize intelligence agency for a nation
 */
export function createIntelligenceAgency(nationId: string): IntelligenceAgency {
  return {
    nationId,
    level: 1,
    experience: 0,

    capabilities: {
      cryptology: 10,
      infiltration: 10,
      counterIntelligence: 10,
      propaganda: 10,
      sabotage: 10,
    },

    upgrades: [],
    maxOperatives: 3, // Base capacity
    activeOperatives: 0,

    cryptology: 0,
    infiltration: 0,

    reputation: 'unknown',

    activeOperations: [],
    completedOperations: [],
  };
}

/**
 * Calculate agency reputation based on completed operations
 */
export function calculateAgencyReputation(agency: IntelligenceAgency): typeof agency.reputation {
  const completed = agency.completedOperations.length;
  const successful = agency.completedOperations.filter(op => op.success).length;

  const successRate = completed > 0 ? successful / completed : 0;
  const score = (completed * 0.5) + (successful * 1.0) + (agency.level * 10);

  if (score < 10 || successRate < 0.3) return 'unknown';
  if (score < 30 || successRate < 0.5) return 'developing';
  if (score < 60 || successRate < 0.7) return 'competent';
  if (score < 100 || successRate < 0.85) return 'formidable';
  return 'legendary';
}

/**
 * Check if agency can upgrade to next level
 */
export function canUpgradeAgencyLevel(agency: IntelligenceAgency): boolean {
  if (agency.level >= 5) return false;
  return agency.experience >= 100;
}

/**
 * Upgrade agency to next level
 */
export function upgradeAgencyLevel(agency: IntelligenceAgency): IntelligenceAgency {
  if (!canUpgradeAgencyLevel(agency)) return agency;

  return {
    ...agency,
    level: (agency.level + 1) as AgencyLevel,
    experience: agency.experience - 100,
    maxOperatives: agency.maxOperatives + 1, // +1 operative per level
  };
}

/**
 * Check if agency can purchase an upgrade
 */
export function canPurchaseUpgrade(
  agency: IntelligenceAgency,
  upgrade: AgencyUpgrade,
  nation: Nation
): { canPurchase: boolean; reason?: string } {
  // Check level requirement
  if (agency.level < upgrade.requiredLevel) {
    return {
      canPurchase: false,
      reason: `Requires agency level ${upgrade.requiredLevel}`,
    };
  }

  // Check if already purchased
  if (agency.upgrades.some(u => u.id === upgrade.id)) {
    return {
      canPurchase: false,
      reason: 'Already purchased',
    };
  }

  // Check prerequisites
  for (const prereq of upgrade.prerequisites) {
    if (!agency.upgrades.some(u => u.id === prereq)) {
      return {
        canPurchase: false,
        reason: `Requires upgrade: ${prereq}`,
      };
    }
  }

  // Check costs
  if (nation.intel < upgrade.intelCost) {
    return {
      canPurchase: false,
      reason: `Insufficient intel (need ${upgrade.intelCost})`,
    };
  }

  // Political power check would go here if we have that in nation state

  return { canPurchase: true };
}

/**
 * Purchase an agency upgrade
 */
export function purchaseAgencyUpgrade(
  agency: IntelligenceAgency,
  upgrade: AgencyUpgrade,
  nation: Nation
): { agency: IntelligenceAgency; nation: Nation } {
  // Apply upgrade effects
  let updatedAgency = { ...agency, upgrades: [...agency.upgrades, upgrade] };

  for (const effect of upgrade.effects) {
    switch (effect.type) {
      case 'max_operatives':
        updatedAgency.maxOperatives += effect.value;
        break;
      case 'cryptology_bonus':
        updatedAgency.capabilities.cryptology += effect.value;
        break;
      case 'infiltration_bonus':
        updatedAgency.capabilities.infiltration += effect.value;
        break;
      // Other effects applied during operation execution
    }
  }

  // Deduct costs
  const updatedNation = {
    ...nation,
    intel: nation.intel - upgrade.intelCost,
  };

  return { agency: updatedAgency, nation: updatedNation };
}

/**
 * Launch an intelligence operation
 */
export function launchIntelOperation(
  agency: IntelligenceAgency,
  type: IntelOperationType,
  targetNationId: string,
  assignedOperatives: SpyAgent[],
  currentTurn: number
): IntelOperation {
  const operation = getOperationTemplate(type);
  const baseSuccess = calculateBaseSuccessChance(type, assignedOperatives, agency);
  const detection = calculateDetectionRisk(type, assignedOperatives, agency);

  return {
    id: generateId(),
    type,
    agencyId: agency.nationId,
    targetNationId,
    assignedOperatives: assignedOperatives.map(op => op.id),
    startedTurn: currentTurn,
    duration: operation.duration,
    progress: 0,
    baseSuccessChance: baseSuccess,
    modifiedSuccessChance: baseSuccess,
    detectionRisk: detection,
    intelCost: operation.intelCost,
    ppCost: operation.ppCost,
    status: 'preparing',
  };
}

/**
 * Get operation template with base stats
 */
function getOperationTemplate(type: IntelOperationType): {
  duration: number;
  intelCost: number;
  ppCost?: number;
} {
  const templates: Record<IntelOperationType, ReturnType<typeof getOperationTemplate>> = {
    steal_cipher: { duration: 4, intelCost: 40 },
    decipher_communications: { duration: 3, intelCost: 35 },
    plant_false_intel: { duration: 2, intelCost: 30 },
    infiltrate_government: { duration: 6, intelCost: 60, ppCost: 50 },
    infiltrate_military: { duration: 5, intelCost: 50, ppCost: 40 },
    infiltrate_civilian: { duration: 4, intelCost: 40 },
    targeted_sabotage: { duration: 3, intelCost: 45 },
    heavy_sabotage: { duration: 4, intelCost: 60, ppCost: 30 },
    collaboration_government: { duration: 8, intelCost: 100, ppCost: 100 },
    root_out_resistance: { duration: 3, intelCost: 35 },
    boost_resistance: { duration: 4, intelCost: 40 },
    boost_ideology: { duration: 5, intelCost: 50 },
    coup_government: { duration: 6, intelCost: 80, ppCost: 80 },
    steal_blueprints: { duration: 4, intelCost: 50 },
    capture_operative: { duration: 3, intelCost: 40 },
  };

  return templates[type];
}

/**
 * Calculate base success chance for operation
 */
function calculateBaseSuccessChance(
  type: IntelOperationType,
  operatives: SpyAgent[],
  agency: IntelligenceAgency
): number {
  // Base chance depends on operation type
  const baseChances: Record<IntelOperationType, number> = {
    steal_cipher: 60,
    decipher_communications: 70,
    plant_false_intel: 65,
    infiltrate_government: 40,
    infiltrate_military: 45,
    infiltrate_civilian: 60,
    targeted_sabotage: 55,
    heavy_sabotage: 45,
    collaboration_government: 30,
    root_out_resistance: 65,
    boost_resistance: 60,
    boost_ideology: 50,
    coup_government: 35,
    steal_blueprints: 55,
    capture_operative: 50,
  };

  let chance = baseChances[type];

  // Add operative skill bonuses (guard against empty array)
  const avgSkill = operatives.length > 0
    ? operatives.reduce((sum, op) => sum + op.skill, 0) / operatives.length
    : 0;
  chance += avgSkill / 5; // Up to +20 from maxed operatives

  // Add agency capability bonuses
  if (type.includes('cipher') || type === 'decipher_communications') {
    chance += agency.capabilities.cryptology / 10;
  } else if (type.includes('infiltrate')) {
    chance += agency.capabilities.infiltration / 10;
  } else if (type.includes('sabotage')) {
    chance += agency.capabilities.sabotage / 10;
  } else if (type.includes('ideology') || type === 'plant_false_intel') {
    chance += agency.capabilities.propaganda / 10;
  }

  // Agency upgrade bonuses
  const operationBonus = agency.upgrades
    .flatMap(u => u.effects)
    .filter(e => e.type === 'operation_success')
    .reduce((sum, e) => sum + e.value, 0);

  chance += operationBonus;

  const policyBonus = getPolicyEffectsForNation(agency.nationId)?.espionageSuccessBonus ?? 0;
  chance += policyBonus;

  return Math.min(95, Math.max(10, chance));
}

/**
 * Calculate detection risk for operation
 */
function calculateDetectionRisk(
  type: IntelOperationType,
  operatives: SpyAgent[],
  agency: IntelligenceAgency
): number {
  // Base detection risk
  const baseRisks: Record<IntelOperationType, number> = {
    steal_cipher: 45,
    decipher_communications: 20,
    plant_false_intel: 35,
    infiltrate_government: 60,
    infiltrate_military: 55,
    infiltrate_civilian: 40,
    targeted_sabotage: 50,
    heavy_sabotage: 65,
    collaboration_government: 70,
    root_out_resistance: 30,
    boost_resistance: 45,
    boost_ideology: 40,
    coup_government: 75,
    steal_blueprints: 50,
    capture_operative: 55,
  };

  let risk = baseRisks[type];

  // Operative skill reduces detection (guard against empty array)
  const avgSkill = operatives.length > 0
    ? operatives.reduce((sum, op) => sum + op.skill, 0) / operatives.length
    : 0;
  risk -= avgSkill / 5;

  // Agency upgrades reduce detection
  const detectionReduction = agency.upgrades
    .flatMap(u => u.effects)
    .filter(e => e.type === 'detection_reduction')
    .reduce((sum, e) => sum + e.value, 0);

  risk -= detectionReduction;

  return Math.min(95, Math.max(5, risk));
}

/**
 * Progress operation by one turn
 */
export function progressIntelOperation(
  operation: IntelOperation,
  currentTurn: number
): IntelOperation {
  if (operation.status !== 'in_progress' && operation.status !== 'preparing') {
    return operation;
  }

  const newProgress = operation.progress + (100 / operation.duration);

  if (newProgress >= 100) {
    // Operation completes
    return {
      ...operation,
      progress: 100,
      status: 'completed',
    };
  }

  return {
    ...operation,
    progress: newProgress,
    status: 'in_progress',
  };
}

/**
 * Execute completed operation and generate results
 */
export function executeIntelOperation(
  operation: IntelOperation,
  agency: IntelligenceAgency,
  targetNation: Nation,
  operatives: SpyAgent[]
): IntelOperationResult {
  // Roll for success
  const attackerPolicy = getPolicyEffectsForNation(agency.nationId);
  const defenderPolicy = getPolicyEffectsForNation(targetNation.id);

  const counterIntelPenalty = defenderPolicy?.counterIntelBonus ?? 0;
  const attackerCounterIntel = attackerPolicy?.counterIntelBonus ?? 0;

  const adjustedSuccessChance = Math.min(
    95,
    Math.max(5, operation.modifiedSuccessChance - counterIntelPenalty)
  );
  const successRoll = Math.random() * 100;
  const success = successRoll <= adjustedSuccessChance;

  const adjustedDetectionRisk = Math.min(
    95,
    Math.max(5, operation.detectionRisk + counterIntelPenalty - attackerCounterIntel)
  );
  const detectionRoll = Math.random() * 100;
  const discovered = detectionRoll <= adjustedDetectionRisk;

  const result: IntelOperationResult = {
    success,
    discovered,
    operativesCaptured: [],
    operativesKilled: [],
    effects: [],
    description: '',
  };

  // Handle discovery consequences
  if (discovered && success) {
    // Discovered but successful - some operatives may be captured
    const captureChance = 0.3;
    operatives.forEach(op => {
      if (Math.random() < captureChance) {
        result.operativesCaptured.push(op.id);
      }
    });
  } else if (discovered && !success) {
    // Discovered and failed - higher capture rate
    const captureChance = 0.6;
    operatives.forEach(op => {
      if (Math.random() < captureChance) {
        result.operativesCaptured.push(op.id);
        // Chance of death
        if (Math.random() < 0.2) {
          result.operativesKilled.push(op.id);
        }
      }
    });
  }

  // Generate effects based on operation type and success
  if (success) {
    result.effects = generateOperationEffects(operation.type, targetNation, agency);
    result.description = generateSuccessDescription(operation.type, discovered);
  } else {
    result.description = generateFailureDescription(operation.type, discovered);
  }

  return result;
}

/**
 * Generate operation effects
 */
function generateOperationEffects(
  type: IntelOperationType,
  target: Nation,
  agency: IntelligenceAgency
): IntelOperationEffect[] {
  const effects: IntelOperationEffect[] = [];

  switch (type) {
    case 'steal_cipher':
      effects.push({
        type: 'cipher_obtained',
        value: target.id,
      });
      effects.push({
        type: 'intel_gained',
        value: 30,
      });
      break;

    case 'steal_blueprints':
      // Steal random research
      const researched = target.researched || {};
      const availableResearch = Object.keys(researched).filter(r => researched[r]);
      if (availableResearch.length > 0) {
        const stolen = availableResearch[Math.floor(Math.random() * availableResearch.length)];
        effects.push({
          type: 'research_stolen',
          value: stolen,
        });
      }
      break;

    case 'targeted_sabotage':
      effects.push({
        type: 'production_damage',
        value: 50,
        targetId: target.id,
      });
      break;

    case 'heavy_sabotage':
      effects.push({
        type: 'production_damage',
        value: 150,
        targetId: target.id,
      });
      break;

    case 'boost_resistance':
      effects.push({
        type: 'resistance_change',
        value: 20, // +20 resistance
        targetId: target.id,
      });
      break;

    case 'root_out_resistance':
      effects.push({
        type: 'resistance_change',
        value: -30, // -30 resistance
        targetId: target.id,
      });
      break;

    case 'boost_ideology':
      effects.push({
        type: 'ideology_shift',
        value: 10,
        targetId: target.id,
      });
      break;

    case 'coup_government':
      effects.push({
        type: 'government_change',
        value: 'regime_changed',
        targetId: target.id,
      });
      break;

    // Add more operation effects as needed
  }

  return effects;
}

/**
 * Generate success description
 */
function generateSuccessDescription(type: IntelOperationType, discovered: boolean): string {
  const discoveryText = discovered ? ' Operation was discovered, but succeeded.' : ' Operation completed undetected.';

  const descriptions: Record<IntelOperationType, string> = {
    steal_cipher: 'Successfully obtained enemy cipher codes.' + discoveryText,
    decipher_communications: 'Deciphered enemy communications.' + discoveryText,
    plant_false_intel: 'Planted false intelligence in enemy networks.' + discoveryText,
    infiltrate_government: 'Agent successfully infiltrated government.' + discoveryText,
    infiltrate_military: 'Agent embedded in military command.' + discoveryText,
    infiltrate_civilian: 'Network established in civilian sector.' + discoveryText,
    targeted_sabotage: 'Target destroyed successfully.' + discoveryText,
    heavy_sabotage: 'Major infrastructure damage inflicted.' + discoveryText,
    collaboration_government: 'Collaboration government established.' + discoveryText,
    root_out_resistance: 'Resistance elements neutralized.' + discoveryText,
    boost_resistance: 'Resistance forces strengthened.' + discoveryText,
    boost_ideology: 'Ideological influence expanded.' + discoveryText,
    coup_government: 'Government overthrown successfully.' + discoveryText,
    steal_blueprints: 'Research blueprints stolen.' + discoveryText,
    capture_operative: 'Enemy operative captured.' + discoveryText,
  };

  return descriptions[type];
}

/**
 * Generate failure description
 */
function generateFailureDescription(type: IntelOperationType, discovered: boolean): string {
  if (discovered) {
    return 'Operation failed and was discovered by enemy counterintelligence.';
  }
  return 'Operation failed to achieve objectives.';
}

/**
 * Award experience to agency for completed operation
 */
export function awardAgencyExperience(
  agency: IntelligenceAgency,
  operation: IntelOperation,
  success: boolean
): IntelligenceAgency {
  const baseXP = 10;
  const successBonus = success ? 5 : 0;
  const difficultyBonus = Math.floor((100 - operation.modifiedSuccessChance) / 10);

  const totalXP = baseXP + successBonus + difficultyBonus;

  return {
    ...agency,
    experience: agency.experience + totalXP,
  };
}

/**
 * Get available operations for agency level
 */
export function getAvailableOperations(agencyLevel: AgencyLevel): IntelOperationType[] {
  const allOperations: IntelOperationType[] = [
    'steal_cipher',
    'decipher_communications',
    'plant_false_intel',
    'infiltrate_government',
    'infiltrate_military',
    'infiltrate_civilian',
    'targeted_sabotage',
    'heavy_sabotage',
    'collaboration_government',
    'root_out_resistance',
    'boost_resistance',
    'boost_ideology',
    'coup_government',
    'steal_blueprints',
    'capture_operative',
  ];

  // Unlock more operations at higher levels
  const levelRestrictions: Record<AgencyLevel, number> = {
    1: 5, // Only first 5 operations
    2: 9,
    3: 12,
    4: 14,
    5: 15, // All operations
  };

  return allOperations.slice(0, levelRestrictions[agencyLevel]);
}

/**
 * Calculate cost reduction from upgrades
 */
export function calculateCostReduction(agency: IntelligenceAgency): number {
  return agency.upgrades
    .flatMap(u => u.effects)
    .filter(e => e.type === 'cost_reduction')
    .reduce((sum, e) => sum + e.value, 0);
}
