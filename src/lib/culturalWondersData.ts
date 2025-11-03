/**
 * CULTURAL WONDERS DATA
 * Powerful buildings that provide permanent cultural bonuses
 */

import type { CulturalWonder, CulturalWonderType } from '../types/culturalWarfare';

export const CULTURAL_WONDERS: Record<CulturalWonderType, Omit<CulturalWonder, 'id' | 'turnsRemaining' | 'completed'>> = {
  global_media_network: {
    type: 'global_media_network',
    name: 'Global Media Network',
    productionCost: 80,
    intelCost: 60,
    buildTime: 6,
    effects: {
      culturalPowerBonus: 25,
      assimilationRateBonus: 0,
      immigrationAttractionBonus: 15,
      diplomaticInfluenceBonus: 10,
    },
    uniqueAbility: 'propaganda_immunity',
    description: 'Massive media infrastructure granting immunity to propaganda campaigns and broadcasting your culture worldwide.',
  },

  cultural_academy: {
    type: 'cultural_academy',
    name: 'Academy of Arts & Sciences',
    productionCost: 60,
    intelCost: 40,
    buildTime: 5,
    effects: {
      culturalPowerBonus: 15,
      assimilationRateBonus: 30,
      immigrationAttractionBonus: 20,
      diplomaticInfluenceBonus: 5,
    },
    uniqueAbility: 'great_people_generation',
    description: 'Premier educational institution that attracts the best minds and accelerates cultural assimilation.',
  },

  world_heritage_sites: {
    type: 'world_heritage_sites',
    name: 'World Heritage Sites',
    productionCost: 50,
    intelCost: 30,
    buildTime: 4,
    effects: {
      culturalPowerBonus: 20,
      assimilationRateBonus: 10,
      immigrationAttractionBonus: 25,
      diplomaticInfluenceBonus: 15,
    },
    uniqueAbility: 'tourism_victory_progress',
    description: 'Protected cultural landmarks that attract immigrants and boost cultural influence through tourism.',
  },

  international_university: {
    type: 'international_university',
    name: 'International University',
    productionCost: 70,
    intelCost: 50,
    buildTime: 5,
    effects: {
      culturalPowerBonus: 18,
      assimilationRateBonus: 25,
      immigrationAttractionBonus: 30,
      diplomaticInfluenceBonus: 12,
    },
    uniqueAbility: 'elite_education',
    description: 'World-class university that attracts international students and creates lasting cultural bonds.',
  },

  propaganda_bureau: {
    type: 'propaganda_bureau',
    name: 'Central Propaganda Bureau',
    productionCost: 55,
    intelCost: 70,
    buildTime: 5,
    effects: {
      culturalPowerBonus: 30,
      assimilationRateBonus: 5,
      immigrationAttractionBonus: 5,
      diplomaticInfluenceBonus: -5,
    },
    uniqueAbility: 'enhanced_campaigns',
    description: 'State propaganda apparatus that makes cultural warfare campaigns 50% more effective but hurts diplomacy.',
  },
};

/**
 * Create a cultural wonder instance
 */
export function createCulturalWonder(type: CulturalWonderType): CulturalWonder {
  const template = CULTURAL_WONDERS[type];
  return {
    ...template,
    id: `wonder_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    turnsRemaining: template.buildTime,
    completed: false,
  };
}

/**
 * Get wonder description with effects
 */
export function getWonderFullDescription(wonder: CulturalWonder): string {
  const effects: string[] = [];

  if (wonder.effects.culturalPowerBonus > 0) {
    effects.push(`+${wonder.effects.culturalPowerBonus} Cultural Power`);
  }
  if (wonder.effects.assimilationRateBonus > 0) {
    effects.push(`+${wonder.effects.assimilationRateBonus}% Assimilation Rate`);
  }
  if (wonder.effects.immigrationAttractionBonus > 0) {
    effects.push(`+${wonder.effects.immigrationAttractionBonus}% Immigration Attraction`);
  }
  if (wonder.effects.diplomaticInfluenceBonus !== 0) {
    const sign = wonder.effects.diplomaticInfluenceBonus > 0 ? '+' : '';
    effects.push(`${sign}${wonder.effects.diplomaticInfluenceBonus} Diplomatic Influence`);
  }

  return `${wonder.description}\n\nEffects: ${effects.join(', ')}`;
}
