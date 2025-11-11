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
    name: 'Stellar Alignment Ritual',
    description: 'Apocalyptic ritual channeling cosmic energies. Rains eldritch devastation across continents.',
    category: 'military',
    icon: '🚀',
    baseTurnsToComplete: 3,
    resourceCosts: {
      production: 80,
      uranium: 15,
    },
    unlocks: 'nuclear_missile',
  },

  slbm: {
    type: 'slbm',
    name: 'Abyssal Apocalypse Sigil',
    description: 'Deep-sea ritual launcher. Summons destruction from the ocean depths.',
    category: 'military',
    icon: '🎯',
    baseTurnsToComplete: 4,
    resourceCosts: {
      production: 150,
      uranium: 18,
    },
    requiresResearch: ['submarine_tech'],
    unlocks: 'slbm_missile',
  },

  nuclear_submarine: {
    type: 'nuclear_submarine',
    name: 'Deep One Host',
    description: 'Abyssal leviathan carrying apocalypse sigils. Strikes from the crushing depths.',
    category: 'special',
    icon: '🚢',
    baseTurnsToComplete: 12,
    resourceCosts: {
      production: 500,
      uranium: 40,
    },
    requiresResearch: ['submarine_tech'],
    requiresBuilding: ['naval_base'],
    minTurn: 11,
    unlocks: 'submarine_unit',
  },

  army: {
    type: 'army',
    name: 'Cultist Horde',
    description: 'Fanatic cultists driven by eldritch madness. Swarm enemies with unholy fervor.',
    category: 'military',
    icon: '⚔️',
    baseTurnsToComplete: 5,
    resourceCosts: {
      production: 120,
    },
    minTurn: 11,
    unlocks: 'army_unit',
  },

  air_wing: {
    type: 'air_wing',
    name: 'Night-Gaunt Swarm',
    description: 'Winged horrors from beyond. Blot out the sun with their terrible wings.',
    category: 'military',
    icon: '✈️',
    baseTurnsToComplete: 4,
    resourceCosts: {
      production: 150,
    },
    minTurn: 11,
    unlocks: 'air_unit',
  },

  naval_fleet: {
    type: 'naval_fleet',
    name: 'Abyssal Vessel Fleet',
    description: 'Corrupted warships crewed by the drowned. Project eldritch power across the seas.',
    category: 'military',
    icon: '⚓',
    baseTurnsToComplete: 8,
    resourceCosts: {
      production: 300,
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
    name: 'Protective Ward Network',
    description: 'Arcane barrier system. Disrupts incoming eldritch rituals with counter-sigils.',
    category: 'military',
    icon: '🛡️',
    baseTurnsToComplete: 6,
    resourceCosts: {
      production: 200,
    },
    unlocks: 'abm_defense',
  },

  radar_station: {
    type: 'radar_station',
    name: 'Scrying Station',
    description: 'Crystal orb network. Detects approaching cosmic horrors and provides early warning.',
    category: 'military',
    icon: '📡',
    baseTurnsToComplete: 4,
    resourceCosts: {
      production: 100,
    },
    unlocks: 'radar_building',
  },

  bunker: {
    type: 'bunker',
    name: 'Eldritch Sanctum',
    description: 'Reality-anchored shelter for cult followers. Reduces apocalyptic ritual damage.',
    category: 'military',
    icon: '🏰',
    baseTurnsToComplete: 5,
    resourceCosts: {
      production: 120,
    },
    unlocks: 'bunker_building',
  },

  // ==========================================
  // INFRASTRUCTURE
  // ==========================================

  factory: {
    type: 'factory',
    name: 'Essence Forge',
    description: 'Profane manufactory extracting life force. Adds +1 production line and +5% essence output.',
    category: 'infrastructure',
    icon: '🏭',
    baseTurnsToComplete: 5,
    resourceCosts: {
      production: 100,
    },
    unlocks: 'factory_building',
  },

  research_lab: {
    type: 'research_lab',
    name: 'Forbidden Archive',
    description: 'Library of unspeakable tomes. +15% forbidden knowledge acquisition speed.',
    category: 'infrastructure',
    icon: '🔬',
    baseTurnsToComplete: 6,
    resourceCosts: {
      production: 180,
    },
    requiresFocus: ['research_investment'],
    unlocks: 'research_lab_building',
  },

  intel_facility: {
    type: 'intel_facility',
    name: 'Shadow Temple',
    description: 'Dark sanctuary for spies and seers. +10 corruption points per turn.',
    category: 'infrastructure',
    icon: '🕵️',
    baseTurnsToComplete: 7,
    resourceCosts: {
      production: 200,
    },
    requiresFocus: ['intelligence_agency'],
    unlocks: 'intel_facility_building',
  },

  // ==========================================
  // SPECIAL PROJECTS
  // ==========================================

  satellite: {
    type: 'satellite',
    name: 'All-Seeing Eye',
    description: 'Orbital scrying orb network. Gazes upon enemy domains and cultist movements.',
    category: 'special',
    icon: '🛰️',
    baseTurnsToComplete: 10,
    resourceCosts: {
      production: 350,
      uranium: 10,
    },
    requiresFocus: ['satellite_network'],
    minTurn: 11,
    unlocks: 'satellite_system',
  },

  bio_facility: {
    type: 'bio_facility',
    name: 'Plague Pit',
    description: 'Pestilence breeding ground. Cultivates horrific contagions from beyond.',
    category: 'special',
    icon: '☣️',
    baseTurnsToComplete: 8,
    resourceCosts: {
      production: 250,
      intel: 30,
    },
    requiresResearch: ['bio_weapons'],
    minTurn: 26,
    unlocks: 'bio_facility_building',
  },

  cyber_center: {
    type: 'cyber_center',
    name: 'Mind Control Nexus',
    description: 'Psychic domination facility. +20 mental corruption attack/defense.',
    category: 'special',
    icon: '💻',
    baseTurnsToComplete: 7,
    resourceCosts: {
      production: 220,
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
    electronics: number;
    steel: number;
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

  if (
    template.resourceCosts.electronics &&
    availableResources.electronics < template.resourceCosts.electronics
  ) {
    missing.push('electronics');
  }

  if (template.resourceCosts.steel && availableResources.steel < template.resourceCosts.steel) {
    missing.push('steel');
  }

  if (template.resourceCosts.intel && availableResources.intel < template.resourceCosts.intel) {
    missing.push('intel');
  }

  return {
    canAfford: missing.length === 0,
    missing,
  };
}
