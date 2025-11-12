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
  launcherId: string;
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
 * Strategic immigration system - Immigration as a weapon
 * Policies now have economic, diplomatic, and warfare implications
 */
export type ImmigrationPolicy =
  | 'closed_borders'
  | 'selective'
  | 'humanitarian'
  | 'open_borders'
  | 'cultural_exchange'
  | 'brain_drain_ops';

export interface ImmigrationPolicyDefinition {
  name: string;
  description: string;
  populationGrowthModifier: number;
  instabilityModifier: number;
  economicGrowthBonus: number; // Production bonus per turn
  diplomaticImpact: number; // Reputation modifier
  intelCostPerTurn: number; // Ongoing intel cost
  productionCostPerTurn?: number; // Optional production cost
  icon: string;
}

export const IMMIGRATION_POLICIES: Record<ImmigrationPolicy, ImmigrationPolicyDefinition> = {
  closed_borders: {
    name: 'Closed Borders',
    description: 'No immigration. Increases stability but reduces growth and hurts reputation.',
    populationGrowthModifier: 0,
    instabilityModifier: -5, // +5% stability
    economicGrowthBonus: -2, // -2 production per turn
    diplomaticImpact: -5, // Hurts reputation
    intelCostPerTurn: 3, // Border enforcement
    icon: '🚫',
  },
  selective: {
    name: 'Selective Immigration',
    description: 'High-skill immigrants only. Expensive but strong economic benefits.',
    populationGrowthModifier: 0.8,
    instabilityModifier: 2, // Slight stability boost
    economicGrowthBonus: 8, // +8 production per turn
    diplomaticImpact: 0,
    intelCostPerTurn: 6, // Expensive screening
    icon: '🎓',
  },
  humanitarian: {
    name: 'Humanitarian Policy',
    description: 'Accept refugees. Strains resources but greatly improves diplomatic standing.',
    populationGrowthModifier: 1.2,
    instabilityModifier: 5, // -5% stability (strain)
    economicGrowthBonus: 0,
    diplomaticImpact: 10, // Major reputation boost
    intelCostPerTurn: 8, // Processing costs
    productionCostPerTurn: 5, // Housing and services
    icon: '🕊️',
  },
  open_borders: {
    name: 'Open Borders',
    description: 'Maximum immigration. Rapid growth but high instability.',
    populationGrowthModifier: 2.0,
    instabilityModifier: 10, // -10% stability
    economicGrowthBonus: 5, // Large labor force
    diplomaticImpact: 3,
    intelCostPerTurn: 1, // Minimal bureaucracy
    icon: '🌍',
  },
  cultural_exchange: {
    name: 'Cultural Exchange',
    description: 'Balanced exchange programs. Mutual understanding and diplomatic ties.',
    populationGrowthModifier: 1.0,
    instabilityModifier: 0,
    economicGrowthBonus: 3,
    diplomaticImpact: 8, // Strong reputation boost
    intelCostPerTurn: 7, // Program management
    icon: '🤝',
  },
  brain_drain_ops: {
    name: 'Brain Drain Operations',
    description: '⚔️ WEAPON: Aggressively recruit elite talent. Powerful economic boost but damages relations.',
    populationGrowthModifier: 0.6,
    instabilityModifier: 3, // Some disruption
    economicGrowthBonus: 12, // +12 production (elite talent)
    diplomaticImpact: -8, // Damages relations (aggressive poaching)
    intelCostPerTurn: 15, // Very expensive campaigns
    icon: '🧠',
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

/**
 * Apply immigration policy effects to nation (called each turn)
 */
export function applyImmigrationPolicyEffects(
  nation: Nation,
  policy: ImmigrationPolicy
): {
  populationGain: number;
  instabilityChange: number;
  productionBonus: number;
  intelCost: number;
  productionCost: number;
} {
  const policyDef = IMMIGRATION_POLICIES[policy];

  // Calculate population gain
  const populationGain = calculateImmigrationBonus(nation, policy);

  // Apply instability change (negative modifier = more stable)
  const instabilityChange = -policyDef.instabilityModifier;

  // Apply economic growth bonus
  const productionBonus = policyDef.economicGrowthBonus;

  // Get costs
  const intelCost = policyDef.intelCostPerTurn;
  const productionCost = policyDef.productionCostPerTurn || 0;

  return {
    populationGain,
    instabilityChange,
    productionBonus,
    intelCost,
    productionCost,
  };
}
