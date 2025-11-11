/**
 * Game Utility Functions
 *
 * Pure utility functions for game resource management, validation, and common operations.
 * Extracted from Index.tsx as part of refactoring effort.
 */

import type { Nation, DefconChangeEvent } from '@/types/game';
import type { StrategyResourceType } from '@/types/territorialResources';
import {
  initializeResourceStockpile,
  spendStrategicResource,
} from '@/lib/territorialResourcesSystem';
import { GameStateManager } from '@/state/GameStateManager';

const STRATEGIC_RESOURCES: StrategyResourceType[] = ['oil', 'uranium', 'rare_earths', 'food'];

/**
 * Check if a nation can afford a given resource cost
 * Handles both traditional resources (production, intel, uranium) and strategic resources (oil, rare_earths, food)
 */
export function canAfford(nation: Nation, cost: Record<string, number>): boolean {
  initializeResourceStockpile(nation);
  return Object.entries(cost).every(([resource, amount]) => {
    // Strategic resources are in resourceStockpile
    if (STRATEGIC_RESOURCES.includes(resource as StrategyResourceType)) {
      const stockpile = nation.resourceStockpile || { oil: 0, uranium: 0, rare_earths: 0, food: 0 };
      return (stockpile[resource as StrategyResourceType] || 0) >= amount;
    }

    // Traditional resources (production, intel, uranium)
    const current = nation[resource as keyof Nation] as number || 0;
    return current >= amount;
  });
}

/**
 * Deduct resources from a nation
 * Handles both traditional resources (production, intel, uranium) and strategic resources (oil, rare_earths, food)
 */
export function pay(nation: Nation, cost: Record<string, number>): void {
  initializeResourceStockpile(nation);
  Object.entries(cost).forEach(([resource, amount]) => {
    // Strategic resources are in resourceStockpile
    if (STRATEGIC_RESOURCES.includes(resource as StrategyResourceType)) {
      spendStrategicResource(nation, resource as StrategyResourceType, amount);
    } else {
      // Traditional resources (production, intel, uranium)
      const key = resource as keyof Nation;
      const currentValue = nation[key] as number;
      (nation[key] as number) = currentValue - amount;
    }
  });
}

/**
 * Calculate the cost of building a new city (exponential scaling)
 */
export function getCityCost(nation: Nation): Record<string, number> {
  const cityCount = nation.cities || 1;
  const nextCityIndex = cityCount;

  // Exponential cost scaling
  const productionCost = Math.floor(20 * Math.pow(1.5, nextCityIndex));
  const rareEarthsCost = Math.floor(5 * Math.pow(1.6, nextCityIndex));

  const cost: Record<string, number> = {
    production: productionCost,
    rare_earths: rareEarthsCost,
  };

  // Oil requirement starting from 3rd city
  if (nextCityIndex >= 3) {
    cost.oil = 5 * (nextCityIndex - 2);
  }

  return cost;
}

/**
 * Calculate the construction time for a new city
 */
export function getCityBuildTime(nation: Nation): number {
  const cityCount = nation.cities || 1;
  return 2 + cityCount; // City 1: 3 turns, City 2: 4 turns, etc.
}

/**
 * Calculate per-turn maintenance costs for all cities
 */
export function getCityMaintenanceCosts(nation: Nation): Record<string, number> {
  const cityCount = nation.cities || 1;
  return {
    oil: cityCount * 0.5,      // 0.5 oil per city per turn
    food: cityCount * 10,       // 10 food per city per turn (equivalent to 100 population)
  };
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

/**
 * Interface for DEFCON change callbacks
 */
export interface DefconChangeCallbacks {
  onAudioTransition?: (previousDefcon: number, newDefcon: number) => void;
  onLog?: (message: string, type: 'warning' | 'success') => void;
  onNewsItem?: (category: string, message: string, importance: 'critical' | 'important') => void;
  onUpdateDisplay?: () => void;
  onShowModal?: (event: DefconChangeEvent) => void;
}

/**
 * Centralized DEFCON change handler
 * Handles DEFCON changes with history tracking, audio, logging, and modal display
 */
export function handleDefconChange(
  delta: number,
  reason: string,
  triggeredBy: 'player' | 'ai' | 'event' | 'system',
  callbacks?: DefconChangeCallbacks
): boolean {
  const previousDefcon = GameStateManager.getDefcon();
  const newDefcon = Math.max(1, Math.min(5, previousDefcon + delta));

  // No change, return early
  if (newDefcon === previousDefcon) {
    return false;
  }

  // Update DEFCON
  GameStateManager.setDefcon(newDefcon);

  // Create history event
  const event: DefconChangeEvent = {
    turn: GameStateManager.getTurn(),
    previousDefcon,
    newDefcon,
    reason,
    category: delta < 0 ? 'escalation' : 'de-escalation',
    triggeredBy,
    timestamp: Date.now(),
  };

  // Add to history
  GameStateManager.addDefconChangeEvent(event);

  // Execute callbacks
  if (callbacks?.onAudioTransition) {
    callbacks.onAudioTransition(previousDefcon, newDefcon);
  }

  if (callbacks?.onLog) {
    const message = delta < 0
      ? `DEFCON ${newDefcon}: ${reason}`
      : `DEFCON ${newDefcon}: ${reason}`;
    callbacks.onLog(message, delta < 0 ? 'warning' : 'success');
  }

  if (callbacks?.onNewsItem) {
    const message = delta < 0
      ? `DEFCON ${newDefcon}: ${reason}`
      : `DEFCON ${newDefcon}: ${reason}`;
    callbacks.onNewsItem('military', message, delta < 0 ? 'critical' : 'important');
  }

  if (callbacks?.onUpdateDisplay) {
    callbacks.onUpdateDisplay();
  }

  if (callbacks?.onShowModal) {
    callbacks.onShowModal(event);
  }

  return true;
}
