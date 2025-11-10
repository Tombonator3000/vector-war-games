import type { Nation } from '@/types/game';

export const DEFENSE_SOFT_CAP = 20;
export const MAX_DEFENSE_LEVEL = 30;

export function clampDefenseValue(defense: number | undefined): number {
  if (typeof defense !== 'number' || Number.isNaN(defense)) {
    return 0;
  }
  return Math.min(MAX_DEFENSE_LEVEL, Math.max(0, defense));
}

export function calculateDefenseDamageMultiplier(defense: number | undefined): number {
  const clamped = clampDefenseValue(defense);
  const mitigation = clamped / (clamped + DEFENSE_SOFT_CAP);
  const multiplier = 1 - mitigation;
  return Math.min(1, Math.max(0, multiplier));
}

export function calculateDirectNuclearDamage(yieldMT: number, defense: number | undefined): number {
  const multiplier = calculateDefenseDamageMultiplier(defense);
  return yieldMT * multiplier;
}

export function calculateFalloutDamage(
  intensity: number,
  radiationMitigation: number = 0
): number {
  const mitigation = Math.min(1, Math.max(0, radiationMitigation));
  return Math.max(0, intensity * 3 * (1 - mitigation));
}

export interface NuclearStrikeSimulationInput {
  yieldMT: number;
  defense: number | undefined;
  population: number;
  radiationMitigation?: number;
}

export interface NuclearStrikeSimulationResult {
  directDamage: number;
  falloutDamage: number;
  postBlastPopulation: number;
  finalPopulation: number;
}

export function simulateNuclearStrike({
  yieldMT,
  defense,
  population,
  radiationMitigation = 0,
}: NuclearStrikeSimulationInput): NuclearStrikeSimulationResult {
  const directDamage = calculateDirectNuclearDamage(yieldMT, defense);
  const postBlastPopulation = Math.max(0, population - directDamage);

  const initialZoneIntensity = yieldMT / 100;
  const decayedIntensity = initialZoneIntensity * 0.95;
  const falloutDamage = Math.min(
    postBlastPopulation,
    calculateFalloutDamage(decayedIntensity, radiationMitigation)
  );
  const finalPopulation = Math.max(0, postBlastPopulation - falloutDamage);

  return {
    directDamage,
    falloutDamage,
    postBlastPopulation,
    finalPopulation,
  };
}

export function applyDefenseClamp(nation: Pick<Nation, 'defense'>): void {
  nation.defense = clampDefenseValue(nation.defense ?? 0);
}
