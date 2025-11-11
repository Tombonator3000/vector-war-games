/**
 * Production Items Data
 *
 * Defines all buildable items in the production queue system.
 */

import { ProductionTemplate, ProductionItemType } from '../types/production';

export const PRODUCTION_TEMPLATES: Record<ProductionItemType, ProductionTemplate> = {
  // ==========================================
  // MILITARY EQUIPMENT
  // ==========================================

  icbm: {
    type: 'icbm',
    name: 'ICBM',
    description: 'Intercontinental Ballistic Missile. Long-range nuclear delivery system.',
    category: 'military',
    icon: '🚀',
    baseTurnsToComplete: 3,
    resourceCosts: {
      production: 52,
      uranium: 15,
    },
    unlocks: 'nuclear_missile',
  },

  slbm: {
    type: 'slbm',
    name: 'SLBM',
    description: 'Submarine-Launched Ballistic Missile. Mobile nuclear deterrent.',
    category: 'military',
    icon: '🎯',
    baseTurnsToComplete: 4,
    resourceCosts: {
      production: 65,
      uranium: 18,
    },
    requiresResearch: ['submarine_tech'],
    unlocks: 'slbm_missile',
  },

  nuclear_submarine: {
    type: 'nuclear_submarine',
    name: 'Nuclear Submarine',
    description: 'Ballistic missile submarine. Can launch SLBMs from anywhere.',
    category: 'special',
    icon: '🚢',
    baseTurnsToComplete: 12,
    resourceCosts: {
      production: 228,
      uranium: 40,
    },
    requiresResearch: ['submarine_tech'],
    requiresBuilding: ['naval_base'],
    minTurn: 11,
    unlocks: 'submarine_unit',
  },

  army: {
    type: 'army',
    name: 'Army Division',
    description: 'Conventional ground forces for territorial conquest.',
    category: 'military',
    icon: '⚔️',
    baseTurnsToComplete: 5,
    resourceCosts: {
      production: 78,
    },
    minTurn: 11,
    unlocks: 'army_unit',
  },

  air_wing: {
    type: 'air_wing',
    name: 'Air Wing',
    description: 'Fighter and bomber squadrons for air superiority.',
    category: 'military',
    icon: '✈️',
    baseTurnsToComplete: 4,
    resourceCosts: {
      production: 65,
    },
    minTurn: 11,
    unlocks: 'air_unit',
  },

  naval_fleet: {
    type: 'naval_fleet',
    name: 'Naval Fleet',
    description: 'Surface naval forces for power projection.',
    category: 'military',
    icon: '⚓',
    baseTurnsToComplete: 8,
    resourceCosts: {
      production: 130,
    },
    requiresBuilding: ['naval_base'],
    minTurn: 11,
    unlocks: 'naval_unit',
  },

  // ==========================================
  // DEFENSE SYSTEMS
  // ==========================================

  abm_system: {
    type: 'abm_system',
    name: 'ABM System',
    description: 'Anti-Ballistic Missile defense system. Intercepts incoming nuclear missiles.',
    category: 'military',
    icon: '🛡️',
    baseTurnsToComplete: 6,
    resourceCosts: {
      production: 91,
    },
    unlocks: 'abm_defense',
  },

  radar_station: {
    type: 'radar_station',
    name: 'Radar Station',
    description: 'Early warning radar network. Increases missile interception chance.',
    category: 'military',
    icon: '📡',
    baseTurnsToComplete: 4,
    resourceCosts: {
      production: 46,
    },
    unlocks: 'radar_building',
  },

  bunker: {
    type: 'bunker',
    name: 'Hardened Bunker',
    description: 'Protective bunker for civilian population. Reduces nuclear damage.',
    category: 'military',
    icon: '🏰',
    baseTurnsToComplete: 5,
    resourceCosts: {
      production: 52,
    },
    unlocks: 'bunker_building',
  },

  // ==========================================
  // INFRASTRUCTURE
  // ==========================================

  factory: {
    type: 'factory',
    name: 'Factory',
    description: 'Industrial factory. Adds +1 production line and +5% production output.',
    category: 'infrastructure',
    icon: '🏭',
    baseTurnsToComplete: 5,
    resourceCosts: {
      production: 65,
    },
    unlocks: 'factory_building',
  },

  research_lab: {
    type: 'research_lab',
    name: 'Research Laboratory',
    description: 'Advanced research facility. +15% research speed.',
    category: 'infrastructure',
    icon: '🔬',
    baseTurnsToComplete: 6,
    resourceCosts: {
      production: 78,
    },
    requiresFocus: ['research_investment'],
    unlocks: 'research_lab_building',
  },

  intel_facility: {
    type: 'intel_facility',
    name: 'Intelligence Facility',
    description: 'Intelligence agency headquarters. +10 intel per turn.',
    category: 'infrastructure',
    icon: '🕵️',
    baseTurnsToComplete: 7,
    resourceCosts: {
      production: 91,
    },
    requiresFocus: ['intelligence_agency'],
    unlocks: 'intel_facility_building',
  },

  // ==========================================
  // SPECIAL PROJECTS
  // ==========================================

  satellite: {
    type: 'satellite',
    name: 'Spy Satellite',
    description: 'Orbital surveillance network. Reveals enemy territories and movements.',
    category: 'special',
    icon: '🛰️',
    baseTurnsToComplete: 10,
    resourceCosts: {
      production: 163,
      uranium: 10,
    },
    requiresFocus: ['satellite_network'],
    minTurn: 11,
    unlocks: 'satellite_system',
  },

  bio_facility: {
    type: 'bio_facility',
    name: 'Bio-Weapons Facility',
    description: 'Biological warfare research and production facility.',
    category: 'special',
    icon: '☣️',
    baseTurnsToComplete: 8,
    resourceCosts: {
      production: 117,
      intel: 30,
    },
    requiresResearch: ['bio_weapons'],
    minTurn: 26,
    unlocks: 'bio_facility_building',
  },

  cyber_center: {
    type: 'cyber_center',
    name: 'Cyber Warfare Center',
    description: 'Advanced cyber operations facility. +20 cyber attack/defense.',
    category: 'special',
    icon: '💻',
    baseTurnsToComplete: 7,
    resourceCosts: {
      production: 98,
      intel: 20,
    },
    requiresFocus: ['cyber_warfare_division'],
    minTurn: 11,
    unlocks: 'cyber_center_building',
  },
};

/**
 * Get production template by type
 */
export function getProductionTemplate(type: ProductionItemType): ProductionTemplate {
  return PRODUCTION_TEMPLATES[type];
}

/**
 * Get all available production templates for a nation
 */
export function getAvailableProductionTemplates(
  currentTurn: number,
  completedResearch: string[],
  completedFocuses: string[],
  availableBuildings: string[]
): ProductionTemplate[] {
  return Object.values(PRODUCTION_TEMPLATES).filter((template) => {
    // Check turn requirement
    if (template.minTurn && currentTurn < template.minTurn) {
      return false;
    }

    // Check research requirements
    if (template.requiresResearch) {
      if (!template.requiresResearch.every((tech) => completedResearch.includes(tech))) {
        return false;
      }
    }

    // Check focus requirements
    if (template.requiresFocus) {
      if (!template.requiresFocus.every((focus) => completedFocuses.includes(focus))) {
        return false;
      }
    }

    // Check building requirements
    if (template.requiresBuilding) {
      if (!template.requiresBuilding.every((building) => availableBuildings.includes(building))) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Calculate actual turns to complete based on production allocation
 */
export function calculateTurnsToComplete(
  template: ProductionTemplate,
  productionPerTurn: number,
  efficiency: number = 1.0
): number {
  const effectiveProduction = productionPerTurn * efficiency;
  const turns = Math.ceil(template.resourceCosts.production / effectiveProduction);
  return Math.max(1, turns);
}

/**
 * Check if nation has enough resources to start production
 */
export function canAffordProduction(
  template: ProductionTemplate,
  availableResources: {
    production: number;
    uranium: number;
    intel: number;
  }
): { canAfford: boolean; missing: string[] } {
  const missing: string[] = [];

  if (availableResources.production < template.resourceCosts.production) {
    missing.push('production');
  }

  if (template.resourceCosts.uranium && availableResources.uranium < template.resourceCosts.uranium) {
    missing.push('uranium');
  }

  if (template.resourceCosts.intel && availableResources.intel < template.resourceCosts.intel) {
    missing.push('intel');
  }

  return {
    canAfford: missing.length === 0,
    missing,
  };
}
