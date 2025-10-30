/**
 * Territory Bonuses System
 * Inspired by Risk's continent bonuses
 */

export type ContinentId =
  | 'north_america'
  | 'south_america'
  | 'europe'
  | 'asia'
  | 'africa'
  | 'middle_east'
  | 'arctic'
  | 'oceania';

export type TerritoryImprovementType =
  | 'fortification'
  | 'supply_depot'
  | 'intel_hub'
  | 'garrison'
  | 'missile_silo'
  | 'naval_base';

export interface TerritoryBonus {
  productionPerTurn?: number;
  uraniumPerTurn?: number;
  intelPerTurn?: number;
  defenseBonus?: number;
  missileCapacity?: number;
  researchSpeedBonus?: number; // Percentage
}

export interface ContinentBonus extends TerritoryBonus {
  continentId: ContinentId;
  name: string;
  description: string;
  requiredTerritories: string[];
  icon: string;
}

export interface TerritoryImprovement {
  type: TerritoryImprovementType;
  territoryId: string;
  ownerId: string;
  constructedTurn: number;
  bonus: TerritoryBonus;
  maintenanceCost: number;
  name: string;
  description: string;
}

export interface TerritoryImprovementTemplate {
  type: TerritoryImprovementType;
  name: string;
  description: string;
  buildCost: {
    production?: number;
    intel?: number;
    turns?: number;
  };
  maintenanceCost: number;
  bonus: TerritoryBonus;
  icon: string;
}

// Continent definitions
export const CONTINENT_BONUSES: Record<ContinentId, ContinentBonus> = {
  north_america: {
    continentId: 'north_america',
    name: 'North America',
    description: 'Industrial powerhouse with advanced tech',
    requiredTerritories: ['usa', 'canada', 'mexico'],
    icon: '🌎',
    productionPerTurn: 30,
    missileCapacity: 1,
  },
  europe: {
    continentId: 'europe',
    name: 'Europe',
    description: 'Research hub and diplomatic center',
    requiredTerritories: ['uk', 'france', 'germany', 'italy'],
    icon: '🇪🇺',
    intelPerTurn: 20,
    researchSpeedBonus: 10,
  },
  asia: {
    continentId: 'asia',
    name: 'Asia',
    description: 'Massive production capacity and population',
    requiredTerritories: ['china', 'india', 'japan', 'korea', 'southeast_asia'],
    icon: '🌏',
    productionPerTurn: 40,
  },
  middle_east: {
    continentId: 'middle_east',
    name: 'Middle East',
    description: 'Strategic oil reserves (uranium equivalent)',
    requiredTerritories: ['saudi_arabia', 'iran', 'iraq'],
    icon: '🕌',
    uraniumPerTurn: 15,
  },
  arctic: {
    continentId: 'arctic',
    name: 'Arctic Region',
    description: 'Strategic submarine advantage',
    requiredTerritories: ['greenland', 'svalbard'],
    icon: '🧊',
    defenseBonus: 20,
  },
  africa: {
    continentId: 'africa',
    name: 'Africa',
    description: 'Rich in rare resources',
    requiredTerritories: ['south_africa', 'egypt', 'nigeria'],
    icon: '🌍',
    productionPerTurn: 20,
    uraniumPerTurn: 10,
  },
  south_america: {
    continentId: 'south_america',
    name: 'South America',
    description: 'Defensible terrain and resources',
    requiredTerritories: ['brazil', 'argentina', 'colombia'],
    icon: '🌎',
    productionPerTurn: 15,
    defenseBonus: 15,
  },
  oceania: {
    continentId: 'oceania',
    name: 'Oceania',
    description: 'Naval dominance and isolation',
    requiredTerritories: ['australia', 'new_zealand'],
    icon: '🏝️',
    defenseBonus: 25,
  },
};

// Territory improvement templates
export const TERRITORY_IMPROVEMENTS: Record<
  TerritoryImprovementType,
  TerritoryImprovementTemplate
> = {
  fortification: {
    type: 'fortification',
    name: 'Fortification',
    description: 'Defensive structures that increase territory defense',
    buildCost: {
      production: 30,
      turns: 2,
    },
    maintenanceCost: 5,
    bonus: {
      defenseBonus: 50,
    },
    icon: '🏰',
  },
  supply_depot: {
    type: 'supply_depot',
    name: 'Supply Depot',
    description: 'Logistics hub that boosts production',
    buildCost: {
      production: 50,
      turns: 3,
    },
    maintenanceCost: 10,
    bonus: {
      productionPerTurn: 10,
    },
    icon: '📦',
  },
  intel_hub: {
    type: 'intel_hub',
    name: 'Intelligence Hub',
    description: 'Reveals enemy units in adjacent territories',
    buildCost: {
      production: 40,
      intel: 20,
      turns: 2,
    },
    maintenanceCost: 8,
    bonus: {
      intelPerTurn: 5,
    },
    icon: '🔍',
  },
  garrison: {
    type: 'garrison',
    name: 'Garrison',
    description: 'Prevents enemy capture for 3 turns',
    buildCost: {
      production: 20,
      turns: 1,
    },
    maintenanceCost: 5,
    bonus: {
      defenseBonus: 30,
    },
    icon: '⚔️',
  },
  missile_silo: {
    type: 'missile_silo',
    name: 'Missile Silo',
    description: 'Increases missile storage capacity',
    buildCost: {
      production: 60,
      uranium: 10,
      turns: 4,
    },
    maintenanceCost: 15,
    bonus: {
      missileCapacity: 2,
    },
    icon: '🚀',
  },
  naval_base: {
    type: 'naval_base',
    name: 'Naval Base',
    description: 'Allows submarine deployment and naval operations',
    buildCost: {
      production: 70,
      turns: 5,
    },
    maintenanceCost: 12,
    bonus: {
      defenseBonus: 20,
    },
    icon: '⚓',
  },
};

/**
 * Calculate total bonuses for a nation from controlled territories
 */
export function calculateTerritoryBonuses(
  controlledTerritories: string[],
  improvements: TerritoryImprovement[]
): TerritoryBonus {
  const totalBonus: TerritoryBonus = {
    productionPerTurn: 0,
    uraniumPerTurn: 0,
    intelPerTurn: 0,
    defenseBonus: 0,
    missileCapacity: 0,
    researchSpeedBonus: 0,
  };

  // Add continent bonuses
  Object.values(CONTINENT_BONUSES).forEach((continent) => {
    const controlsContinent = continent.requiredTerritories.every((territory) =>
      controlledTerritories.includes(territory)
    );

    if (controlsContinent) {
      totalBonus.productionPerTurn! += continent.productionPerTurn || 0;
      totalBonus.uraniumPerTurn! += continent.uraniumPerTurn || 0;
      totalBonus.intelPerTurn! += continent.intelPerTurn || 0;
      totalBonus.defenseBonus! += continent.defenseBonus || 0;
      totalBonus.missileCapacity! += continent.missileCapacity || 0;
      totalBonus.researchSpeedBonus! += continent.researchSpeedBonus || 0;
    }
  });

  // Add improvement bonuses
  improvements.forEach((improvement) => {
    totalBonus.productionPerTurn! += improvement.bonus.productionPerTurn || 0;
    totalBonus.uraniumPerTurn! += improvement.bonus.uraniumPerTurn || 0;
    totalBonus.intelPerTurn! += improvement.bonus.intelPerTurn || 0;
    totalBonus.defenseBonus! += improvement.bonus.defenseBonus || 0;
    totalBonus.missileCapacity! += improvement.bonus.missileCapacity || 0;
    totalBonus.researchSpeedBonus! += improvement.bonus.researchSpeedBonus || 0;
  });

  return totalBonus;
}

/**
 * Get continents that a nation is close to controlling
 */
export function getNearControlContinents(
  controlledTerritories: string[]
): Array<{ continent: ContinentBonus; territoriesNeeded: string[] }> {
  const nearControl: Array<{ continent: ContinentBonus; territoriesNeeded: string[] }> =
    [];

  Object.values(CONTINENT_BONUSES).forEach((continent) => {
    const missingTerritories = continent.requiredTerritories.filter(
      (territory) => !controlledTerritories.includes(territory)
    );

    // If missing 1-2 territories, it's near control
    if (missingTerritories.length > 0 && missingTerritories.length <= 2) {
      nearControl.push({
        continent,
        territoriesNeeded: missingTerritories,
      });
    }
  });

  return nearControl;
}
