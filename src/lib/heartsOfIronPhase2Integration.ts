/**
 * Hearts of Iron Phase 2 Integration
 *
 * Integrates Military Templates, Supply System, and War Support into the game loop.
 */

import type { Nation } from '@/types/game';

/**
 * Process all Phase 2 systems for the turn
 * This should be called during the production phase
 */
export function processHeartsOfIronPhase2(
  nations: Nation[],
  currentTurn: number,
  militaryTemplatesHook: any,
  supplySystemHook: any,
  warSupportHook: any,
  log: (msg: string, type?: string) => void
): void {
  try {
    // Process military unit maintenance
    if (militaryTemplatesHook && militaryTemplatesHook.processTurnMaintenance) {
      militaryTemplatesHook.processTurnMaintenance();
    }

    // Process supply distribution
    if (supplySystemHook && supplySystemHook.processTurnSupply) {
      supplySystemHook.processTurnSupply();

      // Log supply deficits for player
      nations.forEach((nation) => {
        if (nation.isPlayer) {
          const network = supplySystemHook.getSupplyNetwork(nation.id);
          if (network && network.deficits.length > 0) {
            const criticalDeficits = network.deficits.filter((d: any) => d.attritionPerTurn > 2);
            if (criticalDeficits.length > 0) {
              log(
                `⚠️ Supply Crisis: ${criticalDeficits.length} ${criticalDeficits.length === 1 ? 'territory has' : 'territories have'} critical supply shortages`,
                'warning'
              );
            }
          }
        }
      });
    }

    // Process war support and stability
    if (warSupportHook && warSupportHook.processTurnWarSupport) {
      warSupportHook.processTurnWarSupport();

      // Log stability warnings for player
      nations.forEach((nation) => {
        if (nation.isPlayer) {
          const warSupportState = warSupportHook.getWarSupportState(nation.id);
          if (warSupportState) {
            // Warn about low war support
            if (warSupportState.warSupport < 30) {
              log('📉 War Support is critically low! Consider propaganda actions.', 'warning');
            }

            // Warn about low stability
            if (warSupportState.stability < 30) {
              log('⚠️ National Stability is at risk! Crisis may be imminent.', 'alert');
            }

            // Warn about crises
            const crises = warSupportHook.getActiveCrises(nation.id);
            if (crises && crises.length > 0) {
              crises.forEach((crisis: any) => {
                log(`🚨 NATIONAL CRISIS: ${crisis.type.toUpperCase().replace('_', ' ')}!`, 'alert');
              });
            }
          }
        }
      });
    }

    // Apply war support and stability effects to nation stats
    nations.forEach((nation) => {
      if (nation.population <= 0) return;

      const warSupportState = warSupportHook?.getWarSupportState?.(nation.id);
      if (!warSupportState) return;

      // Calculate effects
      const stabilityEffects = warSupportHook.calculateStabilityEffects(nation.id);
      const warSupportEffects = warSupportHook.calculateWarSupportEffects(nation.id);

      // Apply stability effects to production
      if (typeof nation.production === 'number' && stabilityEffects) {
        const stabilityMultiplier = stabilityEffects.productionEfficiency || 1;

        // Store original production if not already stored
        if (!nation._baseProduction) {
          nation._baseProduction = nation.production;
        }

        // Apply stability multiplier
        nation.production = Math.floor(nation._baseProduction * stabilityMultiplier);
      }

      // Apply war support effects to morale (if morale system exists)
      if (typeof nation.morale === 'number' && warSupportEffects) {
        // War support affects morale recovery
        const moraleBonus = (warSupportState.warSupport - 50) * 0.2; // -10 to +10
        nation.morale = Math.max(0, Math.min(100, nation.morale + moraleBonus * 0.1));
      }

      // Store effects for UI display
      nation._hoiPhase2Effects = {
        stability: warSupportState.stability,
        warSupport: warSupportState.warSupport,
        productionMultiplier: stabilityEffects?.productionEfficiency || 1,
        recruitmentMultiplier: warSupportEffects?.recruitmentSpeed || 1,
      };
    });
  } catch (error) {
    console.error('[Hearts of Iron Phase 2] Error processing turn:', error);
    log('⚠️ Error processing military systems', 'warning');
  }
}

/**
 * Initialize Phase 2 systems for a nation
 */
export function initializePhase2ForNation(nation: Nation): void {
  // Initialize base production tracking
  if (typeof nation.production === 'number' && !nation._baseProduction) {
    nation._baseProduction = nation.production;
  }

  // Initialize effects tracking
  if (!nation._hoiPhase2Effects) {
    nation._hoiPhase2Effects = {
      stability: 50,
      warSupport: 50,
      productionMultiplier: 1,
      recruitmentMultiplier: 1,
    };
  }
}

/**
 * Handle war-related events affecting war support
 */
export function handleWarEvent(
  nationId: string,
  eventType: 'war_declared' | 'war_won' | 'war_lost' | 'territory_captured' | 'territory_lost' | 'nuclear_strike_launched' | 'nuclear_strike_received',
  warSupportHook: any,
  log: (msg: string, type?: string) => void
): void {
  if (!warSupportHook || !warSupportHook.handleWarEvent) return;

  try {
    warSupportHook.handleWarEvent(nationId, eventType);

    const eventMessages: Record<typeof eventType, string> = {
      war_declared: 'War has been declared! Public opinion shifts.',
      war_won: '🎉 Victory! War support and stability increase!',
      war_lost: '💔 Defeat. War support and stability decline.',
      territory_captured: '📍 Territory captured! Small morale boost.',
      territory_lost: '⚠️ Territory lost! Public opinion declines.',
      nuclear_strike_launched: '☢️ Nuclear strike launched. Public opinion is divided.',
      nuclear_strike_received: '🚨 Nuclear attack received! Major impact on stability!',
    };

    log(eventMessages[eventType], eventType.includes('won') || eventType.includes('captured') ? 'success' : 'warning');
  } catch (error) {
    console.error('[Hearts of Iron Phase 2] Error handling war event:', error);
  }
}

/**
 * Calculate supply demand from deployed units
 */
export function calculateSupplyDemand(
  territoryId: string,
  deployedUnits: any[],
  supplySystemHook: any
): void {
  if (!supplySystemHook || !supplySystemHook.updateSupplyDemand) return;

  const unitsInTerritory = deployedUnits.filter((unit) => unit.territoryId === territoryId);

  // Calculate total supply demand (each unit's template has supplyUse stat)
  let totalDemand = 0;
  unitsInTerritory.forEach((unit) => {
    // Assume each unit needs base supply of 50 plus their template's supply use
    totalDemand += 50;
  });

  supplySystemHook.updateSupplyDemand(territoryId, totalDemand);
}

/**
 * Apply attrition to units without adequate supply
 */
export function applySupplyAttrition(
  deployedUnits: any[],
  attritionEffects: any[],
  militaryTemplatesHook: any,
  log: (msg: string, type?: string) => void
): void {
  if (!militaryTemplatesHook || !militaryTemplatesHook.updateUnitStatus) return;

  attritionEffects.forEach((effect) => {
    const unit = deployedUnits.find((u) => u.id === effect.unitId);
    if (unit) {
      const healthLoss = effect.damagePerTurn;
      const organizationLoss = effect.organizationLoss;

      militaryTemplatesHook.updateUnitStatus(unit.nationId, unit.id, {
        health: Math.max(0, unit.health - healthLoss),
        organization: Math.max(0, unit.organization - organizationLoss),
      });

      if (unit.health <= 20) {
        log(`⚠️ ${unit.name} is suffering heavy attrition! (${Math.round(unit.health)}% health)`, 'warning');
      }
    }
  });
}

// Extend Nation type with Phase 2 data (TypeScript declaration merging)
declare module '@/types/game' {
  interface Nation {
    _baseProduction?: number;
    _hoiPhase2Effects?: {
      stability: number;
      warSupport: number;
      productionMultiplier: number;
      recruitmentMultiplier: number;
    };
  }
}
