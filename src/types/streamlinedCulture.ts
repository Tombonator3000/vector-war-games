/**
 * STREAMLINED CULTURE SYSTEM
 *
 * Simplified from complex PopGroups, immigration, propaganda, wonders, and influence
 * to a simple system that integrates with diplomacy.
 *
 * Core Concept:
 * - Cultural Power = intel / 10
 * - Propaganda campaigns reduce enemy relationships and increase instability
 * - Cultural wonders provide production/intel bonuses
 */

import type { Nation } from './game';

/**
 * Simplified cultural power calculation
 */
export function calculateCulturalPower(nation: Nation): number {
  const baseFromIntel = nation.intel / 10;
  const wonderBonus = (nation.culturalWonders?.length || 0) * 5;
  return baseFromIntel + wonderBonus;
}

/**
 * Simplified propaganda campaign types
 */
export type PropagandaType =
  | 'subversion'      // Increase target instability
  | 'attraction'      // Improve relationship with target
  | 'demoralization'; // Reduce target morale

export interface SimplifiedPropagandaCampaign {
  id: string;
  launcherIds: string;
  targetId: string;
  type: PropagandaType;
  startTurn: number;
  duration: number;
  turnsRemaining: number;
  intelInvested: number;
  discovered: boolean;
  discoveredOnTurn?: number;
}

/**
 * Propaganda campaign costs and effects
 */
export const PROPAGANDA_DEFINITIONS = {
  subversion: {
    name: 'Subversive Propaganda',
    description: 'Spread discontent in target nation',
    intelCost: 30,
    duration: 4,
    effects: {
      instabilityIncrease: 8,
      relationshipDamage: -10,
      discoveryChance: 0.3,
    },
    icon: '🔥',
  },
  attraction: {
    name: 'Cultural Attraction',
    description: 'Improve your image in target nation',
    intelCost: 25,
    duration: 3,
    effects: {
      relationshipImprovement: 15,
      discoveryChance: 0.1,
    },
    icon: '🎭',
  },
  demoralization: {
    name: 'Demoralizing Propaganda',
    description: 'Lower enemy morale and fighting spirit',
    intelCost: 35,
    duration: 5,
    effects: {
      moraleReduction: 10,
      relationshipDamage: -5,
      discoveryChance: 0.25,
    },
    icon: '📢',
  },
} as const;

/**
 * Simplified cultural wonders (down from complex system)
 */
export type CulturalWonderType =
  | 'media-hub'
  | 'university'
  | 'monument';

export interface SimplifiedCulturalWonder {
  type: CulturalWonderType;
  name: string;
  description: string;
  productionBonus: number;
  intelBonus: number;
  culturalPowerBonus: number;
  buildCost: {
    production: number;
    intel: number;
  };
  icon: string;
}

export const CULTURAL_WONDERS: Record<CulturalWonderType, SimplifiedCulturalWonder> = {
  'media-hub': {
    type: 'media-hub',
    name: 'Global Media Hub',
    description: 'Broadcast your culture worldwide',
    productionBonus: 10,
    intelBonus: 15,
    culturalPowerBonus: 10,
    buildCost: {
      production: 80,
      intel: 40,
    },
    icon: '📡',
  },
  university: {
    type: 'university',
    name: 'Elite University',
    description: 'Attract the best minds',
    productionBonus: 15,
    intelBonus: 20,
    culturalPowerBonus: 8,
    buildCost: {
      production: 100,
      intel: 50,
    },
    icon: '🎓',
  },
  monument: {
    type: 'monument',
    name: 'National Monument',
    description: 'Symbol of your civilization',
    productionBonus: 20,
    intelBonus: 5,
    culturalPowerBonus: 15,
    buildCost: {
      production: 120,
      intel: 30,
    },
    icon: '🏛️',
  },
};

/**
 * Execute propaganda campaign effects
 */
export function executePropagandaCampaign(
  launcher: Nation,
  target: Nation,
  type: PropagandaType
): { success: boolean; discovered: boolean; effects: string[] } {
  const campaign = PROPAGANDA_DEFINITIONS[type];
  const effects: string[] = [];

  // Check if discovered
  const discovered = Math.random() < campaign.effects.discoveryChance;

  if (campaign.effects.instabilityIncrease) {
    target.instability = (target.instability || 0) + campaign.effects.instabilityIncrease;
    effects.push(`+${campaign.effects.instabilityIncrease} instability to ${target.name}`);
  }

  if (campaign.effects.relationshipDamage) {
    // Apply to relationships (requires unified diplomacy system)
    const currentRelationship = target.relationships?.[launcher.id] || 0;
    if (target.relationships) {
      target.relationships[launcher.id] = Math.max(
        -100,
        currentRelationship + campaign.effects.relationshipDamage
      );
    }
    effects.push(`${campaign.effects.relationshipDamage} relationship with ${target.name}`);
  }

  if (campaign.effects.relationshipImprovement) {
    const currentRelationship = target.relationships?.[launcher.id] || 0;
    if (target.relationships) {
      target.relationships[launcher.id] = Math.min(
        100,
        currentRelationship + campaign.effects.relationshipImprovement
      );
    }
    effects.push(`+${campaign.effects.relationshipImprovement} relationship with ${target.name}`);
  }

  if (campaign.effects.moraleReduction) {
    target.morale = Math.max(0, target.morale - campaign.effects.moraleReduction);
    effects.push(`-${campaign.effects.moraleReduction} morale to ${target.name}`);
  }

  if (discovered) {
    // Relationship penalty for being caught
    const currentRelationship = target.relationships?.[launcher.id] || 0;
    if (target.relationships) {
      target.relationships[launcher.id] = Math.max(-100, currentRelationship - 15);
    }
    effects.push('⚠️ Campaign was discovered!');
  }

  return {
    success: true,
    discovered,
    effects,
  };
}

/**
 * Build cultural wonder
 */
export function buildCulturalWonder(
  nation: Nation,
  wonderType: CulturalWonderType
): { success: boolean; reason?: string } {
  const wonder = CULTURAL_WONDERS[wonderType];

  // Check if already built
  if (nation.culturalWonders?.some((w: any) => w.type === wonderType)) {
    return { success: false, reason: 'Wonder already built' };
  }

  // Check costs
  if (nation.production < wonder.buildCost.production) {
    return { success: false, reason: 'Insufficient production' };
  }
  if (nation.intel < wonder.buildCost.intel) {
    return { success: false, reason: 'Insufficient intel' };
  }

  // Deduct costs
  nation.production -= wonder.buildCost.production;
  nation.intel -= wonder.buildCost.intel;

  // Add wonder
  if (!nation.culturalWonders) {
    nation.culturalWonders = [];
  }
  nation.culturalWonders.push({
    type: wonderType,
    name: wonder.name,
    builtTurn: 0, // Will be set by caller
  });

  // Apply bonuses (these should be applied during resource generation)
  // The bonuses are read from CULTURAL_WONDERS when calculating resources

  return { success: true };
}

/**
 * Calculate cultural wonder bonuses for a nation
 */
export function getCulturalWonderBonuses(nation: Nation): {
  production: number;
  intel: number;
  culturalPower: number;
} {
  if (!nation.culturalWonders || nation.culturalWonders.length === 0) {
    return { production: 0, intel: 0, culturalPower: 0 };
  }

  let production = 0;
  let intel = 0;
  let culturalPower = 0;

  for (const wonder of nation.culturalWonders) {
    const def = CULTURAL_WONDERS[wonder.type as CulturalWonderType];
    if (def) {
      production += def.productionBonus;
      intel += def.intelBonus;
      culturalPower += def.culturalPowerBonus;
    }
  }

  return { production, intel, culturalPower };
}

/**
 * Simplified immigration system
 * Immigration now just provides population growth based on morale and policy
 */
export type ImmigrationPolicy = 'closed' | 'restricted' | 'open';

export const IMMIGRATION_POLICIES = {
  closed: {
    name: 'Closed Borders',
    populationGrowthModifier: 0,
    instabilityModifier: -2, // Less instability
    icon: '🚫',
  },
  restricted: {
    name: 'Restricted Immigration',
    populationGrowthModifier: 0.5,
    instabilityModifier: 0,
    icon: '⚖️',
  },
  open: {
    name: 'Open Borders',
    populationGrowthModifier: 1.5,
    instabilityModifier: 3, // More instability from rapid growth
    icon: '🌍',
  },
} as const;

export function calculateImmigrationBonus(
  nation: Nation,
  policy: ImmigrationPolicy
): number {
  const policyDef = IMMIGRATION_POLICIES[policy];
  const baseBonusPerTurn = 0.5; // 0.5M per turn base
  const moraleMultiplier = Math.max(0, nation.morale / 50); // 0-2x based on morale

  return baseBonusPerTurn * policyDef.populationGrowthModifier * moraleMultiplier;
}
