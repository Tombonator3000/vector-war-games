/**
 * UNIFIED INTEL OPERATIONS SYSTEM
 *
 * Consolidates 6 intel types (espionage, cyber, satellites, cover ops, deep recon)
 * into 3 clear, distinct operations:
 *
 * 1. Deploy Satellite - Reveals enemy stats
 * 2. Sabotage - Destroys enemy missiles/warheads
 * 3. Cyber Attack - Disables enemy systems temporarily
 */

import type { Nation } from './game';

export type IntelOperationType = 'satellite' | 'sabotage' | 'cyber-attack';

export interface IntelOperation {
  type: IntelOperationType;
  name: string;
  description: string;
  intelCost: number;
  cooldown: number;
  requiredResearch?: string;
  icon: string;
}

/**
 * The 3 unified intel operations
 */
export const INTEL_OPERATIONS: Record<IntelOperationType, IntelOperation> = {
  satellite: {
    type: 'satellite',
    name: 'Deploy Satellite',
    description: 'Deploy surveillance satellite to reveal enemy nation stats (missiles, warheads, resources) for 5 turns',
    intelCost: 15,
    cooldown: 3,
    icon: '🛰️',
  },
  sabotage: {
    type: 'sabotage',
    name: 'Sabotage Operation',
    description: 'Covert operation to destroy enemy missiles or warheads. High risk of discovery.',
    intelCost: 30,
    cooldown: 5,
    icon: '💣',
  },
  'cyber-attack': {
    type: 'cyber-attack',
    name: 'Cyber Attack',
    description: 'Hack enemy systems to disable missiles temporarily and steal intel. Harder to detect than sabotage.',
    intelCost: 25,
    cooldown: 4,
    icon: '💻',
  },
};

/**
 * Satellite deployment result
 */
export interface SatelliteDeploymentResult {
  success: boolean;
  targetId: string;
  duration: number; // turns
  revealedData: {
    missiles: number;
    warheads: Record<number, number>;
    production: number;
    uranium: number;
    intel: number;
    population: number;
    cities: number;
  };
  expiresAtTurn: number;
}

/**
 * Sabotage operation result
 */
export interface SabotageOperationResult {
  success: boolean;
  targetId: string;
  discovered: boolean;
  missilesDestroyed?: number;
  warheadsDestroyed?: number;
  relationshipPenalty?: number;
  message: string;
}

/**
 * Cyber attack result (references enhanced cyber feedback)
 */
export interface CyberAttackResult {
  success: boolean;
  targetId: string;
  discovered: boolean;
  attributed: boolean;
  attributedTo: string | null;
  missilesDisabled?: number;
  disabledDuration?: number; // turns
  intelStolen?: number;
  readinessDrained?: number;
  message: string;
}

/**
 * Execute satellite deployment
 */
export function executeSatelliteDeployment(
  launcher: Nation,
  target: Nation,
  currentTurn: number
): SatelliteDeploymentResult {
  const duration = 5;

  return {
    success: true,
    targetId: target.id,
    duration,
    revealedData: {
      missiles: target.missiles,
      warheads: { ...target.warheads },
      production: target.production,
      uranium: target.uranium,
      intel: target.intel,
      population: target.population,
      cities: target.cities || 0,
    },
    expiresAtTurn: currentTurn + duration,
  };
}

/**
 * Execute sabotage operation
 */
export function executeSabotageOperation(
  launcher: Nation,
  target: Nation,
  targetType: 'missiles' | 'warheads'
): SabotageOperationResult {
  const discoveryChance = 0.4; // 40% chance to be discovered
  const discovered = Math.random() < discoveryChance;

  const successChance = 0.7; // 70% base success rate
  const success = Math.random() < successChance;

  if (!success) {
    return {
      success: false,
      targetId: target.id,
      discovered,
      message: `Sabotage operation against ${target.name} failed!`,
      relationshipPenalty: discovered ? -25 : 0,
    };
  }

  let missilesDestroyed = 0;
  let warheadsDestroyed = 0;

  if (targetType === 'missiles') {
    // Destroy 1-3 missiles
    missilesDestroyed = Math.min(
      target.missiles,
      Math.floor(Math.random() * 3) + 1
    );
    target.missiles = Math.max(0, target.missiles - missilesDestroyed);
  } else {
    // Destroy random warheads
    const availableYields = Object.keys(target.warheads).filter(
      (y) => target.warheads[Number(y)] > 0
    );
    if (availableYields.length > 0) {
      const randomYield = Number(availableYields[Math.floor(Math.random() * availableYields.length)]);
      warheadsDestroyed = Math.min(
        target.warheads[randomYield],
        Math.floor(Math.random() * 2) + 1
      );
      target.warheads[randomYield] = Math.max(0, target.warheads[randomYield] - warheadsDestroyed);
    }
  }

  const message = targetType === 'missiles'
    ? `Sabotage destroyed ${missilesDestroyed} missile${missilesDestroyed > 1 ? 's' : ''} in ${target.name}!`
    : `Sabotage destroyed ${warheadsDestroyed} warhead${warheadsDestroyed > 1 ? 's' : ''} in ${target.name}!`;

  return {
    success: true,
    targetId: target.id,
    discovered,
    missilesDestroyed,
    warheadsDestroyed,
    message,
    relationshipPenalty: discovered ? -30 : 0,
  };
}

/**
 * Execute cyber attack (simplified version)
 */
export function executeCyberAttack(
  launcher: Nation,
  target: Nation
): CyberAttackResult {
  const discoveryChance = 0.25; // 25% chance to be discovered (lower than sabotage)
  const discovered = Math.random() < discoveryChance;

  const successChance = 0.75; // 75% success rate (higher than sabotage)
  const success = Math.random() < successChance;

  if (!success) {
    return {
      success: false,
      targetId: target.id,
      discovered,
      attributed: false,
      attributedTo: null,
      message: `Cyber attack on ${target.name} failed!`,
    };
  }

  // Disable missiles temporarily
  const missilesDisabled = Math.min(
    target.missiles,
    Math.floor(Math.random() * 4) + 1 // 1-4 missiles
  );
  const disabledDuration = 2; // 2 turns

  // Steal intel
  const intelStolen = Math.floor((launcher.cyber?.offense || 50) / 15) + 3;
  target.intel = Math.max(0, target.intel - intelStolen);

  // Drain cyber readiness
  const readinessDrained = Math.floor((launcher.cyber?.offense || 50) / 5) + 10;
  if (target.cyber) {
    target.cyber.readiness = Math.max(0, target.cyber.readiness - readinessDrained);
  }

  const attributed = discovered && Math.random() < 0.5;

  const message = `Cyber attack on ${target.name}: Disabled ${missilesDisabled} missiles for ${disabledDuration} turns, stole ${intelStolen} intel, drained ${readinessDrained} cyber readiness!`;

  return {
    success: true,
    targetId: target.id,
    discovered,
    attributed,
    attributedTo: attributed ? launcher.id : null,
    missilesDisabled,
    disabledDuration,
    intelStolen,
    readinessDrained,
    message,
  };
}

/**
 * Check if nation can execute intel operation
 */
export function canExecuteIntelOperation(
  nation: Nation,
  operationType: IntelOperationType
): { canExecute: boolean; reason?: string } {
  const operation = INTEL_OPERATIONS[operationType];

  // Check intel cost
  if (nation.intel < operation.intelCost) {
    return {
      canExecute: false,
      reason: `Insufficient intel. Required: ${operation.intelCost}, Available: ${nation.intel}`,
    };
  }

  // Check research requirement
  if (operation.requiredResearch && !nation.researched?.[operation.requiredResearch]) {
    return {
      canExecute: false,
      reason: `Required research: ${operation.requiredResearch}`,
    };
  }

  return { canExecute: true };
}

/**
 * Get intel operation costs
 */
export function getIntelOperationCost(operationType: IntelOperationType): number {
  return INTEL_OPERATIONS[operationType].intelCost;
}

/**
 * Active satellite tracking
 */
export interface ActiveSatellite {
  launcherId: string;
  targetId: string;
  deployedTurn: number;
  expiresAtTurn: number;
  revealedData: SatelliteDeploymentResult['revealedData'];
}

/**
 * Temporarily disabled missiles from cyber attacks
 */
export interface DisabledMissiles {
  targetId: string;
  count: number;
  disabledTurn: number;
  expiresAtTurn: number;
}
