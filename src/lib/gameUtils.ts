/**
 * Game Utility Functions
 *
 * Pure utility functions for game resource management, validation, and common operations.
 * Extracted from Index.tsx as part of refactoring effort.
 */

import type { Nation } from '@/types/game';

/**
 * Check if a nation can afford a given resource cost
 */
export function canAfford(nation: Nation, cost: Record<string, number>): boolean {
  return Object.entries(cost).every(([resource, amount]) => {
    const current = nation[resource as keyof Nation] as number || 0;
    return current >= amount;
  });
}

/**
 * Deduct resources from a nation
 */
export function pay(nation: Nation, cost: Record<string, number>): void {
  Object.entries(cost).forEach(([resource, amount]) => {
    const key = resource as keyof Nation;
    const currentValue = nation[key] as number;
    (nation[key] as number) = currentValue - amount;
  });
}

/**
 * Calculate the cost of building a new city
 */
export function getCityCost(nation: Nation): Record<string, number> {
  const cityCount = nation.cities || 1;
  return { production: 20 + (cityCount - 1) * 5 };
}

/**
 * Check if an action is allowed at the current DEFCON level
 */
export function canPerformAction(action: string, defcon: number): boolean {
  if (action === 'attack') return defcon <= 2;
  if (action === 'escalate') return defcon > 1;
  return true;
}

/**
 * Check if there is an active peace treaty between player and target
 */
export function hasActivePeaceTreaty(player: Nation | null, target: Nation): boolean {
  if (!player) return false;
  const treaty = player.treaties?.[target.id];
  if (!treaty) return false;
  if (treaty.alliance) return true;
  if (typeof treaty.truceTurns === 'number' && treaty.truceTurns > 0) return true;
  return false;
}

/**
 * Check if a nation is eligible as an enemy target
 */
export function isEligibleEnemyTarget(player: Nation | null, target: Nation): boolean {
  if (target.isPlayer) return false;
  if (target.population <= 0) return false;
  if (hasActivePeaceTreaty(player, target)) return false;
  return true;
}
