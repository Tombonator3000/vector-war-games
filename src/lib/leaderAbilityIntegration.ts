/**
 * Leader Ability Integration - FASE 3.2
 *
 * Integrates leader abilities with the main game loop.
 * Handles initialization, per-turn updates, and effect application.
 */

import type { Nation, GameState } from '@/types/game';
import type { LeaderAbilityState } from '@/types/leaderAbilities';
import { updateAbilityPerTurn, initializeLeaderAbilityState } from '@/types/leaderAbilities';
import { getLeaderAbility } from '@/data/leaderAbilities';
import { executeLeaderAbility } from '@/lib/leaderAbilityExecutor';

/**
 * Initialize leader ability for a nation
 */
export function initializeNationLeaderAbility(nation: Nation): void {
  const ability = getLeaderAbility(nation.leader);

  if (ability) {
    nation.leaderAbilityState = initializeLeaderAbilityState(nation.leader, ability);
    console.log(`Initialized leader ability for ${nation.name}: ${ability.name}`);
  }
}

/**
 * Update all leader abilities each turn
 */
export function updateLeaderAbilitiesPerTurn(nations: Nation[]): void {
  for (const nation of nations) {
    if (nation.leaderAbilityState) {
      // Update ability cooldowns
      nation.leaderAbilityState.ability = updateAbilityPerTurn(nation.leaderAbilityState.ability);

      // Check if ability is now available
      nation.leaderAbilityState.isAvailable =
        nation.leaderAbilityState.ability.usesRemaining > 0 &&
        nation.leaderAbilityState.ability.currentCooldown === 0;

      // Clear unavailable reason if now available
      if (nation.leaderAbilityState.isAvailable) {
        nation.leaderAbilityState.unavailableReason = undefined;
      }
    }

    // Update temporary ability effects
    updateTemporaryEffects(nation);
  }
}

/**
 * Update temporary effects from abilities
 */
function updateTemporaryEffects(nation: Nation): void {
  // First strike bonus
  if (nation.firstStrikeTurnsRemaining !== undefined && nation.firstStrikeTurnsRemaining > 0) {
    nation.firstStrikeTurnsRemaining--;
    if (nation.firstStrikeTurnsRemaining === 0) {
      nation.firstStrikeActive = false;
      nation.firstStrikeBonus = 0;
    }
  }

  // Rapid mobilization
  if (nation.rapidMobilizationTurnsRemaining !== undefined && nation.rapidMobilizationTurnsRemaining > 0) {
    nation.rapidMobilizationTurnsRemaining--;
    if (nation.rapidMobilizationTurnsRemaining === 0) {
      nation.rapidMobilizationActive = false;
      nation.rapidMobilizationCostReduction = 0;
    }
  }

  // Missile shield
  if (nation.missileShieldTurnsRemaining !== undefined && nation.missileShieldTurnsRemaining > 0) {
    nation.missileShieldTurnsRemaining--;
    if (nation.missileShieldTurnsRemaining === 0) {
      nation.missileShieldActive = false;
    }
  }

  // Economic boom
  if (nation.economicBoomTurnsRemaining !== undefined && nation.economicBoomTurnsRemaining > 0) {
    nation.economicBoomTurnsRemaining--;
    if (nation.economicBoomTurnsRemaining === 0) {
      nation.economicBoomActive = false;
      nation.economicBoomMultiplier = 1.0;
    }
  }

  // Corruption effect
  if (nation.corruptionTurnsRemaining !== undefined && nation.corruptionTurnsRemaining > 0) {
    // Apply corruption (convert population)
    if (nation.corruptionRate && nation.corruptionSourceId) {
      const populationLoss = Math.floor(nation.population * nation.corruptionRate);
      nation.population = Math.max(0, nation.population - populationLoss);

      // Transfer population to source nation (if Great Old Ones scenario)
      // This would be handled by scenario-specific logic
    }

    nation.corruptionTurnsRemaining--;
    if (nation.corruptionTurnsRemaining === 0) {
      nation.corruptionActive = false;
      nation.corruptionRate = 0;
      nation.corruptionSourceId = undefined;
    }
  }

  // Extra turn granted
  if (nation.extraTurnGranted) {
    // This is handled in the main game loop
    // Just a flag that gets checked
  }
}

/**
 * Use a leader ability
 */
export function useLeaderAbility(
  nation: Nation,
  gameState: GameState,
  targetId?: string
): {
  success: boolean;
  message: string;
  effects: string[];
} {
  if (!nation.leaderAbilityState) {
    return {
      success: false,
      message: 'No leader ability available',
      effects: [],
    };
  }

  const result = executeLeaderAbility(
    nation.leaderAbilityState.ability,
    nation,
    gameState,
    targetId
  );

  if (result.success) {
    // Update nation's ability state
    nation.leaderAbilityState = result.newState;

    // Add to history
    nation.leaderAbilityState.history.push({
      turn: gameState.turn,
      targetId,
      targetName: targetId ? gameState.nations.find(n => n.id === targetId)?.name : undefined,
      result: 'success',
      effectDescription: result.message,
    });

    // Format effects for display
    const effectDescriptions = result.effects.map(e => e.description);

    return {
      success: true,
      message: result.message,
      effects: effectDescriptions,
    };
  }

  return {
    success: false,
    message: result.message,
    effects: [],
  };
}

/**
 * Apply production bonuses from active abilities
 */
export function applyAbilityProductionBonuses(nation: Nation, baseProduction: number): number {
  let production = baseProduction;

  // Rapid mobilization cost reduction
  if (nation.rapidMobilizationActive && nation.rapidMobilizationCostReduction) {
    // This affects costs, not production directly
    // Handled in build cost calculations
  }

  // Economic boom production multiplier
  if (nation.economicBoomActive && nation.economicBoomMultiplier) {
    production = Math.floor(production * nation.economicBoomMultiplier);
  }

  return production;
}

/**
 * Apply combat bonuses from active abilities
 */
export function applyAbilityCombatBonuses(
  attacker: Nation,
  baseDamage: number
): number {
  let damage = baseDamage;

  // First strike bonus
  if (attacker.firstStrikeActive && attacker.firstStrikeBonus) {
    damage = Math.floor(damage * (1 + attacker.firstStrikeBonus / 100));
  }

  return damage;
}

/**
 * Check if nation is immune to missile attacks
 */
export function isImmuneToMissiles(nation: Nation): boolean {
  return nation.missileShieldActive === true;
}

/**
 * Apply build cost reductions from abilities
 */
export function applyAbilityBuildCostReduction(nation: Nation, baseCost: number): number {
  let cost = baseCost;

  // Rapid mobilization cost reduction
  if (nation.rapidMobilizationActive && nation.rapidMobilizationCostReduction) {
    cost = Math.floor(cost * (1 - nation.rapidMobilizationCostReduction));
  }

  return cost;
}

/**
 * Get status text for active ability effects
 */
export function getActiveAbilityEffects(nation: Nation): string[] {
  const effects: string[] = [];

  if (nation.firstStrikeActive && nation.firstStrikeTurnsRemaining) {
    effects.push(`First Strike: +${nation.firstStrikeBonus}% damage (${nation.firstStrikeTurnsRemaining} turns)`);
  }

  if (nation.rapidMobilizationActive && nation.rapidMobilizationTurnsRemaining) {
    effects.push(`Rapid Mobilization: -${(nation.rapidMobilizationCostReduction || 0) * 100}% costs (${nation.rapidMobilizationTurnsRemaining} turns)`);
  }

  if (nation.missileShieldActive && nation.missileShieldTurnsRemaining) {
    effects.push(`Missile Shield: Immune to missiles (${nation.missileShieldTurnsRemaining} turns)`);
  }

  if (nation.economicBoomActive && nation.economicBoomTurnsRemaining) {
    effects.push(`Economic Boom: +${((nation.economicBoomMultiplier || 1) - 1) * 100}% production (${nation.economicBoomTurnsRemaining} turns)`);
  }

  if (nation.corruptionActive && nation.corruptionTurnsRemaining) {
    effects.push(`Corruption: -${(nation.corruptionRate || 0) * 100}% population/turn (${nation.corruptionTurnsRemaining} turns)`);
  }

  return effects;
}

/**
 * Check if nation has extra turn available
 */
export function hasExtraTurn(nation: Nation): boolean {
  return nation.extraTurnGranted === true;
}

/**
 * Consume extra turn
 */
export function consumeExtraTurn(nation: Nation): void {
  nation.extraTurnGranted = false;
}
