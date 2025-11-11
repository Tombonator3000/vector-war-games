/**
 * Territorial Resources System
 *
 * Strategic resources on the map that nations must control and trade to succeed.
 * Resources are tied to specific territories and control determines access.
 */

/**
 * Strategic resource types available in the game
 */
export type StrategyResourceType =
  | 'oil'           // Required for armies and conventional warfare
  | 'uranium'       // Required for nukes (already exists but now territorial)
  | 'rare_earths'   // Required for advanced technology
  | 'food';         // Required for population growth

/**
 * Resource deposit on a territory
 */
export interface ResourceDeposit {
  type: StrategyResourceType;
  amount: number;           // Base production per turn
  richness: number;         // Multiplier (0.5 - 2.0)
  depleted?: boolean;       // Can be depleted by overuse
  depletionRate?: number;   // Rate at which it depletes (0-1)
}

/**
 * Nation's resource stockpile
 */
export interface ResourceStockpile {
  oil: number;
  uranium: number;  // This will replace/augment the existing Nation.uranium field
  rare_earths: number;
  food: number;
}

/**
 * Resource generation per turn tracking
 */
export interface ResourceGeneration {
  oil: number;
  uranium: number;
  rare_earths: number;
  food: number;
}

/**
 * Resource trade agreement between two nations
 */
export interface ResourceTrade {
  id: string;
  fromNationId: string;
  toNationId: string;
  resource: StrategyResourceType;
  amountPerTurn: number;
  duration: number;           // Turns remaining
  totalTurns: number;         // Original duration
  pricePerTurn?: number;      // Optional payment in production/gold
  createdTurn: number;
}

/**
 * Resource requirements for different game systems
 */
export interface ResourceRequirement {
  oil?: number;
  uranium?: number;
  rare_earths?: number;
  food?: number;
  production?: number;  // Traditional production resource
  intel?: number;       // Traditional intel resource
}

/**
 * Territory with resource deposits
 */
export interface TerritoryResources {
  territoryId: string;
  deposits: ResourceDeposit[];
  productionPenalty?: number;  // Bio-warfare or damage penalty (0-1)
}

/**
 * Resource consumption tracking
 */
export interface ResourceConsumption {
  military: ResourceRequirement;      // Units maintenance
  technology: ResourceRequirement;     // Research requirements
  population: ResourceRequirement;     // Population growth
  total: ResourceRequirement;          // Total consumption per turn
}

/**
 * Resource shortage effects
 */
export interface ResourceShortage {
  resource: StrategyResourceType;
  severity: number;           // 0-1, how severe the shortage is
  effects: {
    productionPenalty?: number;   // Production reduction
    moraleImpact?: number;        // Morale decrease
    unitEffectiveness?: number;   // Combat penalty
    growthPenalty?: number;       // Population growth penalty
  };
}

/**
 * Calculate resource generation for a territory
 */
export function calculateTerritoryResourceGeneration(
  territoryResources: TerritoryResources
): ResourceGeneration {
  const generation: ResourceGeneration = {
    oil: 0,
    uranium: 0,
    rare_earths: 0,
    food: 0,
  };

  const productionPenalty = territoryResources.productionPenalty || 1.0;

  territoryResources.deposits.forEach(deposit => {
    if (deposit.depleted) return;

    const baseAmount = deposit.amount * deposit.richness * productionPenalty;
    const depletionModifier = Math.max(0, deposit.depletionRate ?? 1);
    const adjustedAmount = baseAmount * depletionModifier;

    generation[deposit.type] += Math.floor(adjustedAmount);
  });

  return generation;
}

/**
 * Check if a nation has sufficient resources for a requirement
 */
export function hasResources(
  stockpile: Partial<ResourceStockpile>,
  requirement: ResourceRequirement
): boolean {
  if (requirement.oil && (stockpile.oil || 0) < requirement.oil) return false;
  if (requirement.uranium && (stockpile.uranium || 0) < requirement.uranium) return false;
  if (requirement.rare_earths && (stockpile.rare_earths || 0) < requirement.rare_earths) return false;
  if (requirement.food && (stockpile.food || 0) < requirement.food) return false;
  return true;
}

/**
 * Consume resources from a nation's stockpile
 */
export function consumeResources(
  stockpile: ResourceStockpile,
  requirement: ResourceRequirement
): boolean {
  if (!hasResources(stockpile, requirement)) return false;

  stockpile.oil -= requirement.oil || 0;
  stockpile.uranium -= requirement.uranium || 0;
  stockpile.rare_earths -= requirement.rare_earths || 0;
  stockpile.food -= requirement.food || 0;

  return true;
}

/**
 * Calculate resource shortage severity
 */
export function calculateResourceShortage(
  stockpile: Partial<ResourceStockpile>,
  consumption: ResourceRequirement,
  resource: StrategyResourceType
): ResourceShortage | null {
  const available = stockpile[resource] || 0;
  const needed = consumption[resource] || 0;

  if (needed === 0 || available >= needed) return null;

  const severity = Math.min(1, (needed - available) / needed);

  // Define effects based on resource type and severity
  const effects: ResourceShortage['effects'] = {};

  switch (resource) {
    case 'oil':
      effects.unitEffectiveness = severity * 0.5;  // Up to 50% combat penalty
      effects.moraleImpact = severity * 10;        // Up to -10 morale
      break;
    case 'uranium':
      effects.productionPenalty = severity * 0.3;  // Up to 30% production penalty
      break;
    case 'rare_earths':
      effects.productionPenalty = severity * 0.2;  // Up to 20% production penalty
      break;
    case 'food':
      effects.growthPenalty = severity;            // Up to 100% growth penalty
      effects.moraleImpact = severity * 20;        // Up to -20 morale
      break;
  }

  return { resource, severity, effects };
}

/**
 * Resource deposit templates for different territory types
 */
export const RESOURCE_DEPOSIT_TEMPLATES: Record<string, ResourceDeposit[]> = {
  // Major oil producers
  middle_east_oil: [
    { type: 'oil', amount: 20, richness: 1.8 },
    { type: 'uranium', amount: 5, richness: 1.0 },
    { type: 'rare_earths', amount: 3, richness: 1.0 },
  ],
  russia_oil: [
    { type: 'oil', amount: 15, richness: 1.5 },
    { type: 'rare_earths', amount: 12, richness: 1.3 },
  ],

  // Uranium producers
  australia_uranium: [
    { type: 'uranium', amount: 15, richness: 2.0 },
    { type: 'rare_earths', amount: 15, richness: 1.5 },
  ],
  kazakhstan_uranium: [
    { type: 'uranium', amount: 12, richness: 1.8 },
    { type: 'oil', amount: 8, richness: 1.2 },
    { type: 'rare_earths', amount: 5, richness: 1.2 },
  ],

  // Rare earth producers
  china_rare_earths: [
    { type: 'rare_earths', amount: 25, richness: 2.0 },
    { type: 'food', amount: 20, richness: 1.2 },
  ],

  // Food producers
  usa_food: [
    { type: 'food', amount: 35, richness: 1.8 },
    { type: 'oil', amount: 10, richness: 1.3 },
    { type: 'rare_earths', amount: 5, richness: 1.0 },
  ],
  brazil_food: [
    { type: 'food', amount: 30, richness: 1.6 },
    { type: 'rare_earths', amount: 8, richness: 1.0 },
  ],

  // Balanced territories (increased food and added rare earths)
  balanced: [
    { type: 'oil', amount: 5, richness: 1.0 },
    { type: 'food', amount: 18, richness: 1.0 },
    { type: 'rare_earths', amount: 3, richness: 1.0 },
  ],

  // Poor territories
  barren: [
    { type: 'food', amount: 8, richness: 0.8 },
  ],
};

/**
 * Resource display information
 */
export const RESOURCE_INFO: Record<StrategyResourceType, {
  name: string;
  icon: string;
  description: string;
  color: string;
}> = {
  oil: {
    name: 'Oil',
    icon: '🛢️',
    description: 'Required for training and maintaining armies',
    color: '#2c2c2c',
  },
  uranium: {
    name: 'Uranium',
    icon: '☢️',
    description: 'Required for nuclear weapons and advanced research',
    color: '#00ff00',
  },
  rare_earths: {
    name: 'Rare Earths',
    icon: '💎',
    description: 'Required for advanced technology and cyber warfare',
    color: '#9b59b6',
  },
  food: {
    name: 'Food',
    icon: '🌾',
    description: 'Required for population growth and stability',
    color: '#f39c12',
  },
};
