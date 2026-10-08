import type { GameState, Nation } from '@/types/game';
import type { ResourceTrade } from '@/types/territorialResources';
import type { ConventionalPhaseState } from '@/types/gamePhase.types';
import type { TerritoryState } from '@/hooks/useConventionalWarfare';
import type { SeededRandom } from '@/lib/seededRandom';
import { getCityMaintenanceCosts } from '@/lib/gameUtils';
import {
  processNationResources,
  processResourceTrades,
  initializeResourceStockpile,
  assignTerritoryResources,
} from '@/lib/territorialResourcesSystem';
import { initializeResourceMarket, updateResourceMarket } from '@/lib/resourceMarketSystem';
import { processResourceDepletion, DEFAULT_DEPLETION_CONFIG } from '@/lib/resourceDepletionSystem';

export function initializeTerritorialResourcesSystem(
  S: GameState,
  conventionalState: ConventionalPhaseState | undefined,
  log: (msg: string, type?: string) => void
): void {
  if (!S.territoryResources && conventionalState?.territories) {
    S.territoryResources = assignTerritoryResources(conventionalState.territories);
    S.resourceTrades = [];
    S.resourceMarket = initializeResourceMarket();
    S.depletionWarnings = [];
    log('Territorial Resources System initialized', 'success');
  }
}

export function initializeNationStockpiles(nations: Nation[]): void {
  for (const n of nations) {
    if (n.population > 0 && !n.eliminated && !n.resourceStockpile) {
      initializeResourceStockpile(n);
    }
  }
}

function buildTerritoriesByNation(
  territories: Record<string, TerritoryState>
): Record<string, TerritoryState[]> {
  const territoriesByNation: Record<string, TerritoryState[]> = {};
  const territoryEntries = Object.values(territories);

  for (const territory of territoryEntries) {
    const controllerId = territory.controllingNationId;
    if (!controllerId) continue;
    if (!territoriesByNation[controllerId]) {
      territoriesByNation[controllerId] = [];
    }
    territoriesByNation[controllerId].push(territory);
  }

  return territoriesByNation;
}

function processResourceMarketUpdates(
  S: GameState,
  nations: Nation[],
  player: Nation | null,
  rng: SeededRandom,
  log: (msg: string, type?: string) => void
): void {
  if (!S.resourceMarket) return;

  S.resourceMarket = updateResourceMarket(S.resourceMarket, S, nations, S.turn, rng);

  // Log market events for player
  if (player && S.resourceMarket.activeEvent &&
      S.resourceMarket.eventDuration === S.resourceMarket.activeEvent.duration) {
    log(`📊 Market Event: ${S.resourceMarket.activeEvent.name} - ${S.resourceMarket.activeEvent.description}`, 'alert');
  }
}

function processDepletionAndWarnings(
  S: GameState,
  nations: Nation[],
  conventionalState: ConventionalPhaseState | undefined,
  player: Nation | null,
  log: (msg: string, type?: string) => void
): void {
  const nationsById = new Map<string, Nation>(nations.map(n => [n.id, n]));

  const depletionResult = processResourceDepletion(
    S.territoryResources!,
    conventionalState?.territories || {},
    nations,
    DEFAULT_DEPLETION_CONFIG,
    nationsById
  );
  S.territoryResources = depletionResult.territoryResources;
  S.depletionWarnings = depletionResult.warnings;

  // Warn player about critical depletion
  if (player && conventionalState?.territories) {
    const playerWarnings = depletionResult.warnings.filter(w => {
      const territory = conventionalState.territories[w.territoryId];
      return territory?.controllingNationId === player.id;
    });

    for (const warning of playerWarnings) {
      if (warning.severity === 'depleted') {
        log(`💀 ${warning.resource.toUpperCase()} DEPLETED in ${warning.territoryName}!`, 'alert');
      } else if (warning.severity === 'critical') {
        log(`⚠️ ${warning.resource.toUpperCase()} critical in ${warning.territoryName} (${Math.round(warning.remainingPercent)}% remaining)`, 'warning');
      }
    }
  }
}

function processNationTerritorialResources(
  nations: Nation[],
  territoriesByNation: Record<string, TerritoryState[]>,
  S: GameState,
  deliveries: ResourceTrade[],
  player: Nation | null,
  log: (msg: string, type?: string) => void
): void {
  for (const n of nations) {
    if (n.population <= 0 || n.eliminated) continue;

    const controlledTerritories = territoriesByNation[n.id] ?? [];
    const result = processNationResources(
      n,
      controlledTerritories,
      S.territoryResources!,
      deliveries,
      S.turn
    );

    // Log resource changes for player
    if (player && n === player && result.generation) {
      const gen = result.generation;
      if (gen.oil > 0 || gen.uranium > 0 || gen.rare_earths > 0 || gen.food > 0) {
        log(
          `Resources: +${gen.oil} Oil, +${gen.uranium} Uranium, +${gen.rare_earths} Rare Earths, +${gen.food} Food`,
          'success'
        );
      }

      // Warn about shortages
      for (const shortage of result.shortages) {
        log(`⚠️ ${shortage.resource.toUpperCase()} SHORTAGE! (${Math.round(shortage.severity * 100)}%)`, 'warning');
      }
    }

    // Store generation for UI display
    n.resourceGeneration = result.generation;
  }
}

function applyCityMaintenanceCosts(
  nations: Nation[],
  player: Nation | null,
  log: (msg: string, type?: string) => void
): void {
  for (const n of nations) {
    if (n.population <= 0 || n.eliminated) continue;
    if (!n.cities || n.cities < 1) continue;
    if (!n.resourceStockpile) continue;

    const maintenanceCosts = getCityMaintenanceCosts(n);
    let totalShortage = 0;

    // Deduct maintenance costs
    for (const [resource, amount] of Object.entries(maintenanceCosts)) {
      const available = n.resourceStockpile[resource as keyof typeof n.resourceStockpile] || 0;
      const deficit = Math.max(0, amount - available);

      if (deficit > 0) {
        totalShortage += deficit / amount;
        n.resourceStockpile[resource as keyof typeof n.resourceStockpile] = 0;
      } else {
        n.resourceStockpile[resource as keyof typeof n.resourceStockpile] = available - amount;
      }
    }

    // Apply penalties for maintenance shortages
    if (totalShortage > 0) {
      const moraleImpact = Math.floor(totalShortage * 10);
      n.morale = Math.max(0, (n.morale ?? 100) - moraleImpact);

      if (player && n === player) {
        log(`⚠️ City maintenance shortages! Morale -${moraleImpact}`, 'warning');
      }
    }
  }
}

export function processTerritorialResourceSystems(
  S: GameState,
  nations: Nation[],
  conventionalState: ConventionalPhaseState | undefined,
  player: Nation | null,
  rng: SeededRandom,
  log: (msg: string, type?: string) => void
): void {
  if (!S.territoryResources || !conventionalState?.territories) return;

  // Build territory lookup by nation
  const territoriesByNation = buildTerritoriesByNation(conventionalState.territories);

  // Update resource market
  processResourceMarketUpdates(S, nations, player, rng, log);

  // Process resource depletion
  processDepletionAndWarnings(S, nations, conventionalState, player, log);

  // Settlement decrements duration, including the paid final shipment to zero.
  const settledTrades = processResourceTrades(
    S.resourceTrades ?? [], nations, S.turn, S.resourceMarket
  );
  const deliveries = settledTrades.map(trade => ({ ...trade, duration: trade.duration + 1 }));
  S.resourceTrades = settledTrades.filter(trade => trade.duration > 0);

  // Process each nation's resources
  processNationTerritorialResources(nations, territoriesByNation, S, deliveries, player, log);

  // Apply city maintenance costs
  applyCityMaintenanceCosts(nations, player, log);
}
