/**
 * Territorial Resources System Implementation
 *
 * Core logic for territorial resource management, generation, and trade
 */

import type { Nation, GameState } from '@/types/game';
import type { TerritoryState } from '@/hooks/useConventionalWarfare';
import type {
  ResourceStockpile,
  ResourceGeneration,
  ResourceTrade,
  TerritoryResources,
  ResourceDeposit,
  StrategyResourceType,
  ResourceRequirement,
  ResourceShortage,
  ResourceConsumption,
} from '@/types/territorialResources';
import {
  calculateTerritoryResourceGeneration,
  hasResources,
  consumeResources,
  calculateResourceShortage,
  RESOURCE_DEPOSIT_TEMPLATES,
} from '@/types/territorialResources';
import type { ResourceMarket } from '@/lib/resourceMarketSystem';

/**
 * Initialize resource stockpile for a nation
 */
function syncLegacyStrategicResourceField(
  nation: Nation,
  resource: StrategyResourceType
): void {
  if (resource === 'uranium') {
    nation.uranium = nation.resourceStockpile?.uranium ?? 0;
  }
}

function syncAllLegacyStrategicResourceFields(nation: Nation): void {
  const mirroredResources: StrategyResourceType[] = ['uranium'];
  mirroredResources.forEach(resource => {
    syncLegacyStrategicResourceField(nation, resource);
  });
}

export function initializeResourceStockpile(nation: Nation): void {
  if (!nation.resourceStockpile) {
    nation.resourceStockpile = {
      oil: 50,
      uranium: nation.uranium || 30, // Migrate existing uranium
      rare_earths: 40,
      food: 60,
    };
  }
  syncAllLegacyStrategicResourceFields(nation);
}

export function addStrategicResource(
  nation: Nation,
  resource: StrategyResourceType,
  amount: number
): number {
  initializeResourceStockpile(nation);
  if (amount === 0) {
    return nation.resourceStockpile![resource] ?? 0;
  }

  if (amount < 0) {
    spendStrategicResource(nation, resource, Math.abs(amount));
    return nation.resourceStockpile![resource] ?? 0;
  }

  const stockpile = nation.resourceStockpile!;
  const current = stockpile[resource] ?? 0;
  stockpile[resource] = current + amount;
  syncLegacyStrategicResourceField(nation, resource);
  return stockpile[resource];
}

export function spendStrategicResource(
  nation: Nation,
  resource: StrategyResourceType,
  amount: number
): boolean {
  if (amount <= 0) {
    return true;
  }
  initializeResourceStockpile(nation);
  const stockpile = nation.resourceStockpile!;
  const current = stockpile[resource] ?? 0;

  if (current >= amount) {
    stockpile[resource] = current - amount;
    syncLegacyStrategicResourceField(nation, resource);
    return true;
  }

  stockpile[resource] = 0;
  syncLegacyStrategicResourceField(nation, resource);
  return false;
}

/**
 * Map territories to resource deposits
 * This creates the strategic resource layer on the map
 */
export function assignTerritoryResources(
  territories: Record<string, TerritoryState>
): Record<string, TerritoryResources> {
  const territoryResources: Record<string, TerritoryResources> = {};

  Object.entries(territories).forEach(([id, territory]) => {
    // Assign resources based on territory name/region
    let deposits: ResourceDeposit[] = [];

    // Match territory to resource templates based on name/region
    if (territory.name.includes('Middle East') || territory.region.includes('Middle East')) {
      deposits = [...RESOURCE_DEPOSIT_TEMPLATES.middle_east_oil];
    } else if (territory.name.includes('Eurasian') || territory.region.includes('Siberia')) {
      deposits = [...RESOURCE_DEPOSIT_TEMPLATES.russia_oil];
    } else if (territory.name.includes('Indo-Pacific') || territory.region.includes('Pacific')) {
      deposits = [...RESOURCE_DEPOSIT_TEMPLATES.australia_uranium];
    } else if (territory.name.includes('Equatorial') || territory.region.includes('Africa')) {
      deposits = [
        { type: 'rare_earths', amount: 12, richness: 1.4 },
        { type: 'uranium', amount: 8, richness: 1.2 },
      ];
    } else if (territory.name.includes('American') || territory.region.includes('Western Hemisphere')) {
      deposits = [...RESOURCE_DEPOSIT_TEMPLATES.usa_food];
    } else if (territory.name.includes('Southern') || territory.region.includes('South')) {
      deposits = [...RESOURCE_DEPOSIT_TEMPLATES.brazil_food];
    } else if (territory.name.includes('Arctic')) {
      deposits = [
        { type: 'oil', amount: 10, richness: 1.5 },
        { type: 'uranium', amount: 6, richness: 1.2 },
      ];
    } else if (territory.name.includes('Proxy') || territory.name.includes('Battleground')) {
      // Contested territories have valuable resources (reason for conflict!)
      deposits = [
        { type: 'oil', amount: 15, richness: 1.6 },
        { type: 'rare_earths', amount: 10, richness: 1.4 },
      ];
    } else {
      // Default balanced resources
      deposits = [...RESOURCE_DEPOSIT_TEMPLATES.balanced];
    }

    territoryResources[id] = {
      territoryId: id,
      deposits,
      productionPenalty: 1.0,
    };
  });

  return territoryResources;
}

/**
 * Calculate total resource generation for a nation based on controlled territories
 */
export function calculateNationResourceGeneration(
  nation: Nation,
  territories: Record<string, TerritoryState>,
  territoryResources: Record<string, TerritoryResources>
): ResourceGeneration {
  const generation: ResourceGeneration = {
    oil: 0,
    uranium: 0,
    rare_earths: 0,
    food: 0,
  };

  // Find all territories controlled by this nation
  const controlledTerritories = Object.values(territories).filter(
    t => t.controllingNationId === nation.id
  );

  // Sum up resource generation from each territory
  controlledTerritories.forEach(territory => {
    const resources = territoryResources[territory.id];
    if (!resources) return;

    const territoryGen = calculateTerritoryResourceGeneration(resources);
    generation.oil += territoryGen.oil;
    generation.uranium += territoryGen.uranium;
    generation.rare_earths += territoryGen.rare_earths;
    generation.food += territoryGen.food;
  });

  // Apply nation-wide modifiers (morale, technology, etc.)
  // Reduced morale impact from 0.5-1.5x to 0.7-1.3x (less extreme swings)
  const moraleModifier = Math.max(0.7, Math.min(1.3, 0.7 + ((nation.morale || 50) - 25) / 125));

  generation.oil = Math.floor(generation.oil * moraleModifier);
  generation.uranium = Math.floor(generation.uranium * moraleModifier);
  generation.rare_earths = Math.floor(generation.rare_earths * moraleModifier);
  generation.food = Math.floor(generation.food * moraleModifier);

  return generation;
}

/**
 * Calculate resource consumption for a nation
 */
export function calculateNationResourceConsumption(
  nation: Nation,
  territories: Record<string, TerritoryState>
): ResourceConsumption {
  const consumption: ResourceConsumption = {
    military: { oil: 0 },
    technology: { rare_earths: 0 },
    population: { food: 0 },
    total: { oil: 0, rare_earths: 0, food: 0 },
  };

  // Military consumption: armies need oil
  const controlledTerritories = Object.values(territories).filter(
    t => t.controllingNationId === nation.id
  );

  let totalArmies = 0;
  controlledTerritories.forEach(t => {
    totalArmies += t.armies;
  });

  // Each army consumes 0.5 oil per turn
  consumption.military.oil = Math.ceil(totalArmies * 0.5);

  // Population consumes food: 1 food per 10 population
  consumption.population.food = Math.ceil((nation.population || 0) / 10);

  // Technology research consumes rare earths
  if (nation.researchQueue && nation.researchQueue.projectId) {
    consumption.technology.rare_earths = 2;  // Active research costs rare earths
  }

  // Calculate totals
  consumption.total = {
    oil: consumption.military.oil || 0,
    rare_earths: consumption.technology.rare_earths || 0,
    food: consumption.population.food || 0,
  };

  return consumption;
}

/**
 * Apply resource generation and consumption for a nation during production phase
 */
export function processNationResources(
  nation: Nation,
  territories: Record<string, TerritoryState>,
  territoryResources: Record<string, TerritoryResources>,
  activeTrades: ResourceTrade[],
  turn: number
): {
  generation: ResourceGeneration;
  consumption: ResourceConsumption;
  shortages: ResourceShortage[];
  tradeIncome: ResourceGeneration;
} {
  // Initialize stockpile if needed
  initializeResourceStockpile(nation);

  // Calculate generation
  const generation = calculateNationResourceGeneration(nation, territories, territoryResources);

  // Calculate consumption
  const consumption = calculateNationResourceConsumption(nation, territories);

  // Process trade income
  const tradeIncome: ResourceGeneration = { oil: 0, uranium: 0, rare_earths: 0, food: 0 };
  activeTrades
    .filter(trade => trade.toNationId === nation.id && trade.duration > 0)
    .forEach(trade => {
      tradeIncome[trade.resource] += trade.amountPerTurn;
    });

  // Apply generation and trade income
  addStrategicResource(nation, 'oil', generation.oil + tradeIncome.oil);
  addStrategicResource(nation, 'uranium', generation.uranium + tradeIncome.uranium);
  addStrategicResource(nation, 'rare_earths', generation.rare_earths + tradeIncome.rare_earths);
  addStrategicResource(nation, 'food', generation.food + tradeIncome.food);

  // Attempt to consume resources
  const shortages: ResourceShortage[] = [];

  // Try to consume required resources
  (['oil', 'rare_earths', 'food'] as StrategyResourceType[]).forEach(resource => {
    const needed = consumption.total[resource] || 0;
    const available = nation.resourceStockpile![resource] || 0;

    if (available >= needed) {
      // Sufficient resources
      spendStrategicResource(nation, resource, needed);
    } else {
      // Shortage!
      const shortage = calculateResourceShortage(
        nation.resourceStockpile!,
        consumption.total,
        resource
      );
      if (shortage) {
        shortages.push(shortage);
      }
      // Consume what's available
      if (available > 0) {
        spendStrategicResource(nation, resource, available);
      }
    }
  });

  // Apply shortage effects
  shortages.forEach(shortage => {
    if (shortage.effects.moraleImpact) {
      nation.morale = Math.max(0, nation.morale - shortage.effects.moraleImpact);
    }
    if (shortage.effects.productionPenalty) {
      nation.production = Math.floor(
        nation.production * (1 - shortage.effects.productionPenalty)
      );
    }
  });

  // Cap resources at reasonable maximums
  const RESOURCE_CAPS = { oil: 500, uranium: 300, rare_earths: 400, food: 600 };
  nation.resourceStockpile!.oil = Math.min(nation.resourceStockpile!.oil, RESOURCE_CAPS.oil);
  nation.resourceStockpile!.uranium = Math.min(nation.resourceStockpile!.uranium, RESOURCE_CAPS.uranium);
  nation.resourceStockpile!.rare_earths = Math.min(nation.resourceStockpile!.rare_earths, RESOURCE_CAPS.rare_earths);
  nation.resourceStockpile!.food = Math.min(nation.resourceStockpile!.food, RESOURCE_CAPS.food);

  syncAllLegacyStrategicResourceFields(nation);

  return { generation, consumption, shortages, tradeIncome };
}

/**
 * Create a resource trade agreement between two nations
 */
export function createResourceTrade(
  fromNationId: string,
  toNationId: string,
  resource: StrategyResourceType,
  amountPerTurn: number,
  duration: number,
  turn: number,
  pricePerTurn?: number
): ResourceTrade {
  return {
    id: `trade_${fromNationId}_${toNationId}_${resource}_${turn}`,
    fromNationId,
    toNationId,
    resource,
    amountPerTurn,
    duration,
    totalTurns: duration,
    pricePerTurn,
    createdTurn: turn,
  };
}

/**
 * Process all active resource trades
 */
export function processResourceTrades(
  trades: ResourceTrade[],
  nations: Nation[],
  turn: number,
  market?: ResourceMarket
): ResourceTrade[] {
  const nationMap = new Map(nations.map(n => [n.id, n]));
  const activeTrades: ResourceTrade[] = [];

  trades.forEach(trade => {
    if (trade.duration <= 0) return;  // Expired

    const fromNation = nationMap.get(trade.fromNationId);
    const toNation = nationMap.get(trade.toNationId);

    if (!fromNation || !toNation) return;  // Nation eliminated

    initializeResourceStockpile(fromNation);
    initializeResourceStockpile(toNation);

    // Check if nations are at war (cancels trade)
    const relationship = fromNation.relationships?.[toNation.id] || 0;
    if (relationship < -50) {
      // Trade disrupted by hostilities
      return;
    }

    let dynamicPrice: number | undefined;
    if (market) {
      const pricePerUnit = market.prices[trade.resource];
      if (typeof pricePerUnit === 'number') {
        dynamicPrice = Math.ceil(pricePerUnit * trade.amountPerTurn);
      }
    }
    const pricePerTurn = dynamicPrice ?? trade.pricePerTurn;

    // Deduct from sender (handled in processNationResources for receiver)
    if (
      fromNation.resourceStockpile &&
      (fromNation.resourceStockpile[trade.resource] || 0) >= trade.amountPerTurn
    ) {
      spendStrategicResource(fromNation, trade.resource, trade.amountPerTurn);

      // Apply payment if any
      if (pricePerTurn && toNation.production >= pricePerTurn) {
        toNation.production -= pricePerTurn;
        fromNation.production += pricePerTurn;
        trade.pricePerTurn = pricePerTurn;
      }

      // Decrement duration
      trade.duration--;
      activeTrades.push(trade);
    }
  });

  return activeTrades;
}

/**
 * Apply bio-warfare damage to food production in a territory
 */
export function applyBioWarfareDamage(
  territoryResources: TerritoryResources,
  damagePercent: number
): void {
  territoryResources.productionPenalty = Math.max(
    0,
    Math.min(1, (territoryResources.productionPenalty || 1.0) - damagePercent)
  );
}

/**
 * Get resource icon and name for display
 */
export function getResourceDisplay(resource: StrategyResourceType): { icon: string; name: string } {
  const displays = {
    oil: { icon: '🛢️', name: 'Oil' },
    uranium: { icon: '☢️', name: 'Uranium' },
    rare_earths: { icon: '💎', name: 'Rare Earths' },
    food: { icon: '🌾', name: 'Food' },
  };
  return displays[resource];
}
