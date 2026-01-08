/**
 * SIMPLIFIED BIO-WARFARE SYSTEM
 *
 * Replaces complex lab tiers, plague types, and evolution trees with
 * a simple: "Deploy Bio-Weapon → Population Loss" system.
 *
 * Research determines effectiveness, defense research reduces damage.
 */

import { SeededRandom } from '@/lib/seededRandom';

export interface SimplifiedBioWeaponState {
  // Research progress
  bioWeaponResearched: boolean;        // Can deploy bio-weapons
  bioDefenseLevel: number;             // 0-3 defense level

  // Active deployments
  activeBioAttacks: BioAttackDeployment[];

  // Detection
  bioAttacksSuffered: number;          // Total bio-attacks suffered
  lastBioAttackTurn?: number;          // When last attacked
  bioAttackedBy?: string[];            // Nations that attacked
}

export interface BioAttackDeployment {
  id: string;
  attackerId: string;
  targetId: string;
  deployedTurn: number;
  durationTurns: number;              // How long the plague lasts
  turnsRemaining: number;

  // Damage calculation
  basePopulationLossPerTurn: number;  // Base 2-5% per turn
  totalPopulationLost: number;        // Running total

  // Detection
  discovered: boolean;
  discoveredOnTurn?: number;
}

/**
 * Bio-weapon research requirements
 */
export const BIO_WEAPON_RESEARCH_REQUIREMENTS = {
  name: 'Bio-Weapon Development',
  productionCost: 100,
  intelCost: 50,
  turnsToComplete: 4,
  description: 'Develop biological weapons capable of devastating enemy populations',
};

/**
 * Bio-defense levels (tiers 0-3)
 */
export interface BioDefenseLevel {
  level: number;
  name: string;
  damageReduction: number;           // % reduction to bio-weapon damage
  detectionChance: number;           // % chance to detect incoming attack
  productionCost: number;
  intelCost: number;
  turnsToComplete: number;
}

export const BIO_DEFENSE_LEVELS: BioDefenseLevel[] = [
  {
    level: 0,
    name: 'No Defense',
    damageReduction: 0,
    detectionChance: 0.1,             // 10% base chance
    productionCost: 0,
    intelCost: 0,
    turnsToComplete: 0,
  },
  {
    level: 1,
    name: 'Basic Bio-Defense',
    damageReduction: 0.3,             // 30% reduction
    detectionChance: 0.4,
    productionCost: 80,
    intelCost: 30,
    turnsToComplete: 3,
  },
  {
    level: 2,
    name: 'Advanced Bio-Defense',
    damageReduction: 0.5,             // 50% reduction
    detectionChance: 0.6,
    productionCost: 150,
    intelCost: 50,
    turnsToComplete: 4,
  },
  {
    level: 3,
    name: 'Total Bio-Security',
    damageReduction: 0.75,            // 75% reduction
    detectionChance: 0.9,
    productionCost: 250,
    intelCost: 80,
    turnsToComplete: 5,
  },
];

/**
 * Calculate bio-weapon damage
 */
export function calculateBioWeaponDamage(
  targetPopulation: number,
  defenseLevel: number,
  rng: SeededRandom
): number {
  // Base: 2-5% population loss per turn for 5-8 turns
  const basePercentLoss = 0.03 + rng.next() * 0.02; // 3-5%
  const baseDamage = targetPopulation * basePercentLoss;

  // Apply defense reduction
  const defense = BIO_DEFENSE_LEVELS[defenseLevel];
  const actualDamage = baseDamage * (1 - defense.damageReduction);

  return Math.floor(actualDamage);
}

/**
 * Calculate attack duration (turns)
 */
export function calculateBioAttackDuration(rng: SeededRandom): number {
  return 5 + Math.floor(rng.next() * 4); // 5-8 turns
}

/**
 * Check if bio-attack is detected
 */
export function rollBioDetection(defenseLevel: number, rng: SeededRandom): boolean {
  const defense = BIO_DEFENSE_LEVELS[defenseLevel];
  return rng.next() < defense.detectionChance;
}

/**
 * Get bio-defense by level
 */
export function getBioDefense(level: number): BioDefenseLevel {
  return BIO_DEFENSE_LEVELS[Math.min(level, 3)];
}

/**
 * Can nation afford bio-defense upgrade?
 */
export function canAffordBioDefenseUpgrade(
  currentLevel: number,
  production: number,
  intel: number
): boolean {
  if (currentLevel >= 3) return false;
  const nextLevel = BIO_DEFENSE_LEVELS[currentLevel + 1];
  return production >= nextLevel.productionCost && intel >= nextLevel.intelCost;
}

/**
 * Get cost to deploy bio-weapon
 */
export const BIO_WEAPON_DEPLOYMENT_COST = {
  intel: 50,
  uranium: 20,
  actionCost: 1,
} as const;

/**
 * Diplomatic penalty for using bio-weapons
 */
export const BIO_WEAPON_RELATIONSHIP_PENALTY = -45;
export const BIO_WEAPON_GLOBAL_OPINION_PENALTY = -20; // If discovered
