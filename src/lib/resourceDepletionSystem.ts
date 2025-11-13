/**
 * Resource Depletion System
 *
 * Resource deposits gradually deplete with overuse, creating long-term strategic considerations
 */

import type { TerritoryResources, ResourceDeposit, StrategyResourceType } from '@/types/territorialResources';
import type { Nation } from '@/types/game';

/**
 * Depletion configuration
 */
export interface DepletionConfig {
  enabled: boolean;
  depletionRate: number;          // Base depletion per turn (0-1)
  overuseThreshold: number;       // Consumption/production ratio that triggers faster depletion
  overuseMultiplier: number;      // Multiplier when overused
  recoveryRate: number;           // Recovery when underused
  criticalThreshold: number;      // When deposit is considered "depleted"
  warningThreshold: number;       // When to warn player
}

/**
 * Default depletion configuration
 */
export const DEFAULT_DEPLETION_CONFIG: DepletionConfig = {
  enabled: true,
  depletionRate: 0.002,           // 0.2% per turn base
  overuseThreshold: 1.5,          // Using 150% of sustainable rate
  overuseMultiplier: 3.0,         // 3x faster depletion when overused
  recoveryRate: 0.001,            // 0.1% recovery per turn when underused
  criticalThreshold: 0.3,         // 30% remaining = critical
  warningThreshold: 0.5,          // 50% remaining = warning
};

/**
 * Depletion warning
 */
export interface DepletionWarning {
  territoryId: string;
  territoryName: string;
  resource: StrategyResourceType;
  remainingPercent: number;
  severity: 'warning' | 'critical' | 'depleted';
}

/**
 * Process resource depletion for all territories
 */
export function processResourceDepletion(
  territoryResources: Record<string, TerritoryResources>,
  territories: Record<string, any>,
  nations: Nation[],
  config: DepletionConfig = DEFAULT_DEPLETION_CONFIG,
  nationMap?: Map<string, Nation>
): {
  territoryResources: Record<string, TerritoryResources>;
  warnings: DepletionWarning[];
} {
  if (!config.enabled) {
    return { territoryResources, warnings: [] };
  }

  const warnings: DepletionWarning[] = [];
  const updatedResources = { ...territoryResources };
  const lookup = nationMap ?? new Map<string, Nation>(nations.map(nation => [nation.id, nation]));

  Object.entries(updatedResources).forEach(([territoryId, territoryResource]) => {
    const territory = territories[territoryId];
    if (!territory) return;

    const controllingNation = territory.controllingNationId
      ? lookup.get(territory.controllingNationId)
      : undefined;
    if (!controllingNation) return; // Uncontrolled territories don't deplete

    // Update each deposit
    territoryResource.deposits = territoryResource.deposits.map(deposit => {
      if (deposit.depleted) return deposit;

      const updatedDeposit = { ...deposit };

      // Initialize depletion rate if not present
      if (updatedDeposit.depletionRate === undefined) {
        updatedDeposit.depletionRate = 1.0; // Start at 100% capacity
      }

      // Calculate consumption vs production
      const consumption = calculateResourceConsumption(controllingNation, deposit.type);
      const production = deposit.amount * deposit.richness * (updatedDeposit.depletionRate || 1.0);

      let depletionAmount = config.depletionRate;

      if (consumption > production * config.overuseThreshold) {
        // Overusing! Faster depletion
        depletionAmount *= config.overuseMultiplier;
      } else if (consumption < production * 0.8) {
        // Underusing - allow recovery
        updatedDeposit.depletionRate = Math.min(
          1.0,
          (updatedDeposit.depletionRate || 1.0) + config.recoveryRate
        );
        return updatedDeposit; // Skip depletion this turn
      }

      // Apply depletion
      updatedDeposit.depletionRate = Math.max(
        0,
        (updatedDeposit.depletionRate || 1.0) - depletionAmount
      );

      // Check if deposit is now depleted
      if (updatedDeposit.depletionRate <= config.criticalThreshold) {
        if (updatedDeposit.depletionRate <= 0.1) {
          updatedDeposit.depleted = true;
          warnings.push({
            territoryId,
            territoryName: territory.name,
            resource: deposit.type,
            remainingPercent: 0,
            severity: 'depleted',
          });
        } else {
          warnings.push({
            territoryId,
            territoryName: territory.name,
            resource: deposit.type,
            remainingPercent: updatedDeposit.depletionRate * 100,
            severity: 'critical',
          });
        }
      } else if (updatedDeposit.depletionRate <= config.warningThreshold) {
        warnings.push({
          territoryId,
          territoryName: territory.name,
          resource: deposit.type,
          remainingPercent: updatedDeposit.depletionRate * 100,
          severity: 'warning',
        });
      }

      return updatedDeposit;
    });
  });

  return { territoryResources: updatedResources, warnings };
}

/**
 * Calculate resource consumption for a nation (simplified)
 */
function calculateResourceConsumption(nation: Nation, resource: StrategyResourceType): number {
  // This is a simplified calculation - actual consumption is more complex
  switch (resource) {
    case 'oil':
      // Rough estimate based on military
      return (nation.missiles || 0) * 2 + (nation.bombers || 0) * 3;
    case 'uranium':
      // Based on warheads
      const warheadCount = Object.values(nation.warheads || {}).reduce((sum, count) => sum + count, 0);
      return warheadCount * 0.5;
    case 'rare_earths':
      // Based on research activity
      return nation.researchQueue ? 5 : 0;
    case 'food':
      // Based on population
      return nation.population / 10;
    default:
      return 0;
  }
}

/**
 * Restore a depleted deposit (via technology or event)
 */
export function restoreDepositProductivity(
  territoryId: string,
  resource: StrategyResourceType,
  territoryResources: Record<string, TerritoryResources>,
  restorePercent: number = 0.5
): Record<string, TerritoryResources> {
  const updated = { ...territoryResources };
  const territory = updated[territoryId];

  if (!territory) return updated;

  territory.deposits = territory.deposits.map(deposit => {
    if (deposit.type === resource && deposit.depleted) {
      return {
        ...deposit,
        depleted: false,
        depletionRate: restorePercent,
      };
    }
    return deposit;
  });

  return updated;
}

/**
 * Get depletion status for a territory
 */
export function getTerritoryDepletionStatus(
  territoryResource: TerritoryResources,
  config: DepletionConfig = DEFAULT_DEPLETION_CONFIG
): {
  hasWarnings: boolean;
  hasCritical: boolean;
  hasDepleted: boolean;
  deposits: Array<{
    resource: StrategyResourceType;
    status: 'healthy' | 'warning' | 'critical' | 'depleted';
    percent: number;
  }>;
} {
  let hasWarnings = false;
  let hasCritical = false;
  let hasDepleted = false;

  const deposits = territoryResource.deposits.map(deposit => {
    const percent = (deposit.depletionRate || 1.0) * 100;
    let status: 'healthy' | 'warning' | 'critical' | 'depleted';

    if (deposit.depleted || percent <= 10) {
      status = 'depleted';
      hasDepleted = true;
    } else if (percent <= config.criticalThreshold * 100) {
      status = 'critical';
      hasCritical = true;
    } else if (percent <= config.warningThreshold * 100) {
      status = 'warning';
      hasWarnings = true;
    } else {
      status = 'healthy';
    }

    return {
      resource: deposit.type,
      status,
      percent,
    };
  });

  return { hasWarnings, hasCritical, hasDepleted, deposits };
}

/**
 * Calculate how many turns until a deposit is depleted at current rate
 */
export function getTurnsUntilDepletion(
  deposit: ResourceDeposit,
  consumption: number,
  config: DepletionConfig = DEFAULT_DEPLETION_CONFIG
): number | null {
  if (deposit.depleted) return 0;

  const currentRate = deposit.depletionRate || 1.0;
  const production = deposit.amount * deposit.richness * currentRate;

  if (consumption <= production * 0.8) {
    return null; // Sustainable or recovering
  }

  let depletionPerTurn = config.depletionRate;
  if (consumption > production * config.overuseThreshold) {
    depletionPerTurn *= config.overuseMultiplier;
  }

  const turnsToZero = currentRate / depletionPerTurn;
  return Math.floor(turnsToZero);
}

/**
 * Emergency extraction - boost production but cause severe depletion
 */
export function applyEmergencyExtraction(
  territoryId: string,
  resource: StrategyResourceType,
  territoryResources: Record<string, TerritoryResources>,
  boostMultiplier: number = 2.0,
  depletionCost: number = 0.3
): {
  territoryResources: Record<string, TerritoryResources>;
  boostedProduction: number;
} {
  const updated = { ...territoryResources };
  const territory = updated[territoryId];
  let boostedProduction = 0;

  if (!territory) return { territoryResources: updated, boostedProduction };

  territory.deposits = territory.deposits.map(deposit => {
    if (deposit.type === resource && !deposit.depleted) {
      const updatedDeposit = { ...deposit };
      const currentRate = updatedDeposit.depletionRate || 1.0;

      // Calculate boosted production
      const normalProduction = deposit.amount * deposit.richness * currentRate;
      boostedProduction = normalProduction * boostMultiplier;

      // Apply severe depletion
      updatedDeposit.depletionRate = Math.max(0, currentRate - depletionCost);
      if (updatedDeposit.depletionRate <= 0.1) {
        updatedDeposit.depleted = true;
      }

      return updatedDeposit;
    }
    return deposit;
  });

  return { territoryResources: updated, boostedProduction };
}
