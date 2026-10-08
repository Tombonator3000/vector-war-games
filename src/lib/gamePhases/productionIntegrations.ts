import type { Nation } from '@/types/game';
import type { ConventionalPhaseState, ProductionIntegrationWindow } from '@/types/gamePhase.types';
import type { ResourceStockpile } from '@/types/territorialResources';

function safeCallWindowApi(
  apiName: string,
  methodName: string,
  log: (msg: string, type?: string) => void,
  successMessage: string
): void {
  if (typeof window === 'undefined') return;

  const api = (window as unknown as Record<string, unknown>)[apiName];
  if (!api || typeof api !== 'object') return;
  const method = (api as Record<string, unknown>)[methodName];
  if (typeof method !== 'function') return;

  try {
    method.call(api);
    log(successMessage, 'success');
  } catch (error) {
    console.error(`[Production Phase] Error processing ${apiName}:`, error);
  }
}

function processEconomicDepthSystems(
  nations: Nation[],
  log: (msg: string, type?: string) => void
): void {
  if (typeof window === 'undefined') return;

  const economicDepthApi = (window as ProductionIntegrationWindow).economicDepthApi;
  if (!economicDepthApi) return;

  try {
    // Build stockpile map for resource refinement
    const nationStockpiles = new Map<string, ResourceStockpile>();
    for (const n of nations) {
      if (n.resourceStockpile) {
        nationStockpiles.set(n.id, n.resourceStockpile);
      }
    }

    // Process economic turn (trade, refinement, infrastructure)
    economicDepthApi.processEconomicTurn(nationStockpiles);

    // Apply refined resource bonuses to nations
    if (economicDepthApi.nationRefineryStats) {
      for (const n of nations) {
        const refineryStats = economicDepthApi.nationRefineryStats.get(n.id);
        if (refineryStats?.totalOutput) {
          const steelBonus = (refineryStats.totalOutput.steel || 0) * 0.1;
          const electronicsBonus = (refineryStats.totalOutput.electronics || 0) * 0.05;

          if (steelBonus > 0) {
            n.production = Math.floor((n.production || 0) + steelBonus);
          }
          if (electronicsBonus > 0) {
            n.intel = Math.floor((n.intel || 0) + electronicsBonus);
          }
        }
      }
    }

    log('✅ Economic depth systems processed', 'success');
  } catch (error) {
    console.error('[Production Phase] Error processing economic depth:', error);
  }
}

function processSupplySystem(
  conventionalState: ConventionalPhaseState | undefined,
  log: (msg: string, type?: string) => void
): void {
  if (typeof window === 'undefined') return;

  const supplySystemApi = (window as ProductionIntegrationWindow).supplySystemApi;
  if (!supplySystemApi) return;

  try {
    // Update supply demand from conventional units
    if (conventionalState?.territories) {
      for (const territory of Object.values(conventionalState.territories)) {
        if (territory?.garrisonsPresent) {
          const supplyDemand = territory.garrisonsPresent.length * 50;
          supplySystemApi.updateSupplyDemand(territory.id, supplyDemand);
        }
      }
    }

    // Process supply distribution
    supplySystemApi.processTurnSupply();

    // Apply attrition to under-supplied units
    const attritionEffects = supplySystemApi.getAttritionEffects();
    if (attritionEffects.length > 0) {
      log(`⚠️ ${attritionEffects.length} units suffering from supply attrition`, 'warning');
    }

    log('✅ Supply system and attrition processed', 'success');
  } catch (error) {
    console.error('[Production Phase] Error processing supply system:', error);
  }
}

export function processExternalIntegrationAPIs(
  nations: Nation[],
  conventionalState: ConventionalPhaseState | undefined,
  log: (msg: string, type?: string) => void
): void {
  if (typeof window === 'undefined') return;

  // Economic depth systems
  processEconomicDepthSystems(nations, log);

  // Military templates maintenance
  safeCallWindowApi('militaryTemplatesApi', 'processTurnMaintenance', log,
    '✅ Military templates maintenance processed');

  // Supply system
  processSupplySystem(conventionalState, log);

  // War support and stability
  safeCallWindowApi('warSupportApi', 'processTurnWarSupport', log,
    '✅ War support and stability processed');

  // Political factions
  safeCallWindowApi('politicalFactionsApi', 'processTurnUpdates', log,
    '✅ Political factions updated');

  // Regional morale
  safeCallWindowApi('regionalMoraleApi', 'processTurnUpdates', log,
    '✅ Regional morale advanced');

  // Media warfare
  safeCallWindowApi('mediaWarfareApi', 'processTurnUpdates', log,
    '✅ Media warfare campaigns resolved');

  // Production queues
  const productionQueueApi = (window as ProductionIntegrationWindow).productionQueueApi;
  if (productionQueueApi?.processTurnProduction) {
    try {
      const completions = productionQueueApi.processTurnProduction();
      if (Array.isArray(completions) && completions.length > 0) {
        log(`✅ ${completions.length} production projects advanced`, 'success');
      } else {
        log('✅ Production queues updated', 'success');
      }
    } catch (error) {
      console.error('[Production Phase] Error processing production queues:', error);
    }
  }

  // Resource refinement
  safeCallWindowApi('resourceRefinementApi', 'processTurn', log,
    '✅ Resource refinement progressed');
}
