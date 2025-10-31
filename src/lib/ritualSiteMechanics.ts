/**
 * Ritual Site Mechanics - Week 3
 * Geostrategic placement, environmental requirements, upgrade paths
 */

import type {
  RitualSite,
  RitualSiteType,
  RitualSiteBiome,
  GreatOldOnesState,
  RegionalState,
  CulturalTrait,
} from '../types/greatOldOnes';

// ============================================================================
// BIOME BONUSES
// ============================================================================

export interface BiomeBonus {
  /** Ritual power multiplier for this biome */
  ritualPowerBonus: number;

  /** Which entity types can be summoned here */
  summoningAffinity: string[];

  /** Sanity harvesting multiplier */
  sanityHarvestBonus: number;

  /** Natural concealment bonus */
  concealmentBonus: number;

  /** Special abilities unlocked at this biome */
  specialAbilities: string[];

  /** Description of biome benefits */
  description: string;
}

export const BIOME_BONUSES: Record<RitualSiteBiome, BiomeBonus> = {
  ocean: {
    ritualPowerBonus: 1.3,
    summoningAffinity: ['deep_ones', 'dagon', 'hydra', 'cthulhu'],
    sanityHarvestBonus: 0.8,
    concealmentBonus: 1.5,
    specialAbilities: ['tidal_rituals', 'submarine_approach', 'aquatic_entities'],
    description: 'Ocean sites enable Deep One summoning and provide excellent concealment',
  },

  mountain: {
    ritualPowerBonus: 1.5,
    summoningAffinity: ['star_spawn', 'flying_polyps', 'elder_things'],
    sanityHarvestBonus: 0.6,
    concealmentBonus: 1.2,
    specialAbilities: ['stellar_channeling', 'sky_signs', 'altitude_rituals'],
    description: 'Mountain peaks channel stellar alignments with maximum ritual power',
  },

  urban: {
    ritualPowerBonus: 1.0,
    summoningAffinity: ['servitors', 'nightgaunts', 'hunting_horrors'],
    sanityHarvestBonus: 1.8,
    concealmentBonus: 0.9,
    specialAbilities: ['crowd_harvesting', 'urban_infiltration', 'mass_madness'],
    description: 'Urban centers maximize sanity harvesting from dense populations',
  },

  ruins: {
    ritualPowerBonus: 1.4,
    summoningAffinity: ['shoggoths', 'elder_things', 'ancient_ones'],
    sanityHarvestBonus: 0.5,
    concealmentBonus: 1.8,
    specialAbilities: ['ancient_power', 'archaeology_cover', 'artifact_discovery'],
    description: 'Ancient ruins resonate with primordial power and hide secrets well',
  },

  desert: {
    ritualPowerBonus: 1.2,
    summoningAffinity: ['sand_dwellers', 'nameless_city_horrors', 'ghouls'],
    sanityHarvestBonus: 0.4,
    concealmentBonus: 1.6,
    specialAbilities: ['isolation_rituals', 'heat_visions', 'buried_temples'],
    description: 'Deserts provide isolation for dangerous rituals away from prying eyes',
  },

  forest: {
    ritualPowerBonus: 1.1,
    summoningAffinity: ['dark_young', 'goat_spawn', 'woodland_horrors'],
    sanityHarvestBonus: 0.7,
    concealmentBonus: 1.4,
    specialAbilities: ['natural_cover', 'druidic_rituals', 'forest_guardians'],
    description: 'Forests blend rituals with nature, hiding them from civilization',
  },
};

// ============================================================================
// SITE UPGRADE SYSTEM
// ============================================================================

export interface SiteUpgradeConfig {
  type: RitualSiteType;
  name: string;

  /** Cost to upgrade to this tier */
  upgradeCost: {
    sanityFragments: number;
    eldritchPower: number;
    cultists: number;
    turns: number;
  };

  /** Benefits at this tier */
  benefits: {
    powerStorage: number;
    powerGenerationRate: number;
    maxCultists: number;
    summoningTier: number;
    defenseBonus: number;
  };

  /** What this tier unlocks */
  unlocks: string[];

  description: string;
}

export const SITE_UPGRADE_PATHS: Record<RitualSiteType, SiteUpgradeConfig> = {
  shrine: {
    type: 'shrine',
    name: 'Minor Shrine',
    upgradeCost: {
      sanityFragments: 0,
      eldritchPower: 0,
      cultists: 0,
      turns: 0,
    },
    benefits: {
      powerStorage: 100,
      powerGenerationRate: 5,
      maxCultists: 10,
      summoningTier: 1, // Servitors only
      defenseBonus: 0,
    },
    unlocks: ['basic_rituals', 'initiate_training'],
    description: 'A basic ritual site for foundational workings',
  },

  temple: {
    type: 'temple',
    name: 'Dark Temple',
    upgradeCost: {
      sanityFragments: 200,
      eldritchPower: 100,
      cultists: 5,
      turns: 3,
    },
    benefits: {
      powerStorage: 300,
      powerGenerationRate: 15,
      maxCultists: 30,
      summoningTier: 2, // Horrors
      defenseBonus: 20,
    },
    unlocks: ['advanced_rituals', 'acolyte_training', 'minor_summonings', 'glamour_veil'],
    description: 'A fortified temple capable of significant rituals',
  },

  nexus: {
    type: 'nexus',
    name: 'Power Nexus',
    upgradeCost: {
      sanityFragments: 500,
      eldritchPower: 300,
      cultists: 10,
      turns: 5,
    },
    benefits: {
      powerStorage: 800,
      powerGenerationRate: 40,
      maxCultists: 75,
      summoningTier: 3, // Star Spawn
      defenseBonus: 50,
    },
    unlocks: ['major_rituals', 'high_priest_training', 'major_summonings', 'defensive_wards', 'ley_line_tapping'],
    description: 'A nexus of eldritch power drawing on ley lines',
  },

  gateway: {
    type: 'gateway',
    name: 'Reality Gateway',
    upgradeCost: {
      sanityFragments: 1000,
      eldritchPower: 800,
      cultists: 20,
      turns: 10,
    },
    benefits: {
      powerStorage: 2000,
      powerGenerationRate: 100,
      maxCultists: 150,
      summoningTier: 5, // Great Old Ones
      defenseBonus: 100,
    },
    unlocks: ['awakening_rituals', 'avatar_summonings', 'great_old_one_contact', 'reality_breach', 'dimensional_anchor'],
    description: 'A gateway capable of bringing forth the Great Old Ones themselves',
  },
};

/**
 * Get the next upgrade tier for a site
 */
export function getNextUpgradeTier(currentType: RitualSiteType): RitualSiteType | null {
  const upgradePath: RitualSiteType[] = ['shrine', 'temple', 'nexus', 'gateway'];
  const currentIndex = upgradePath.indexOf(currentType);

  if (currentIndex === -1 || currentIndex === upgradePath.length - 1) {
    return null; // Already at max tier
  }

  return upgradePath[currentIndex + 1];
}

/**
 * Check if a site can be upgraded
 */
export function canUpgradeSite(
  site: RitualSite,
  state: GreatOldOnesState
): { canUpgrade: boolean; reason?: string } {
  const nextTier = getNextUpgradeTier(site.type);

  if (!nextTier) {
    return { canUpgrade: false, reason: 'Site is already at maximum tier' };
  }

  const upgradeConfig = SITE_UPGRADE_PATHS[nextTier];

  // Check resources
  if (state.resources.sanityFragments < upgradeConfig.upgradeCost.sanityFragments) {
    return {
      canUpgrade: false,
      reason: `Requires ${upgradeConfig.upgradeCost.sanityFragments} sanity fragments`
    };
  }

  if (state.resources.eldritchPower < upgradeConfig.upgradeCost.eldritchPower) {
    return {
      canUpgrade: false,
      reason: `Requires ${upgradeConfig.upgradeCost.eldritchPower} eldritch power`
    };
  }

  // Check cultist availability in region
  const region = state.regions.find(r => r.regionId === site.regionId);
  if (region && region.cultistCells < upgradeConfig.upgradeCost.cultists) {
    return {
      canUpgrade: false,
      reason: `Requires ${upgradeConfig.upgradeCost.cultists} cultist cells in the region`
    };
  }

  return { canUpgrade: true };
}

/**
 * Begin upgrading a site
 */
export function beginSiteUpgrade(
  site: RitualSite,
  state: GreatOldOnesState
): RitualSite {
  const nextTier = getNextUpgradeTier(site.type);
  if (!nextTier) return site;

  const upgradeConfig = SITE_UPGRADE_PATHS[nextTier];

  // Deduct costs
  state.resources.sanityFragments -= upgradeConfig.upgradeCost.sanityFragments;
  state.resources.eldritchPower -= upgradeConfig.upgradeCost.eldritchPower;

  // Start upgrade progress
  return {
    ...site,
    upgradeProgress: 0,
    activeRitual: {
      ritualId: `upgrade_${nextTier}`,
      ritualName: `Upgrading to ${upgradeConfig.name}`,
      turnsRemaining: upgradeConfig.upgradeCost.turns,
      powerInvested: upgradeConfig.upgradeCost.eldritchPower,
      successChance: 95,
    },
  };
}

/**
 * Progress site upgrade each turn
 */
export function progressSiteUpgrade(site: RitualSite): RitualSite {
  if (!site.activeRitual || !site.activeRitual.ritualId.startsWith('upgrade_')) {
    return site;
  }

  const turnsRemaining = site.activeRitual.turnsRemaining - 1;
  const progress = site.upgradeProgress + (100 / site.activeRitual.turnsRemaining);

  if (turnsRemaining <= 0) {
    // Upgrade complete!
    const nextTier = getNextUpgradeTier(site.type);
    if (!nextTier) return site;

    return {
      ...site,
      type: nextTier,
      upgradeProgress: 0,
      activeRitual: undefined,
    };
  }

  return {
    ...site,
    upgradeProgress: progress,
    activeRitual: {
      ...site.activeRitual,
      turnsRemaining,
    },
  };
}

// ============================================================================
// DEFENSIVE MECHANICS
// ============================================================================

export interface SiteDefenseConfig {
  hasGlamourVeil: boolean;
  hasDefensiveWards: boolean;

  /** Detection chance reduction (0-1) */
  detectionReduction: number;

  /** Raid damage reduction (0-1) */
  raidDefense: number;

  /** Counter-ritual resistance */
  ritualDisruptionResistance: number;
}

/**
 * Calculate site defense capabilities
 */
export function calculateSiteDefenses(site: RitualSite): SiteDefenseConfig {
  const biomeBonus = BIOME_BONUSES[site.biome];
  const tierConfig = SITE_UPGRADE_PATHS[site.type];

  let detectionReduction = 0;
  let raidDefense = 0;
  let ritualDisruptionResistance = 0;

  // Glamour veil reduces detection
  if (site.hasGlamourVeil) {
    detectionReduction += 0.4;
  }

  // Defensive wards protect against raids
  if (site.hasDefensiveWards) {
    raidDefense += 0.5;
    ritualDisruptionResistance += 0.6;
  }

  // Biome concealment bonus
  detectionReduction += (biomeBonus.concealmentBonus - 1.0) * 0.2;

  // Tier defense bonus
  raidDefense += tierConfig.benefits.defenseBonus / 200;

  return {
    hasGlamourVeil: site.hasGlamourVeil,
    hasDefensiveWards: site.hasDefensiveWards,
    detectionReduction: Math.min(0.9, detectionReduction),
    raidDefense: Math.min(0.9, raidDefense),
    ritualDisruptionResistance: Math.min(0.8, ritualDisruptionResistance),
  };
}

/**
 * Add glamour veil to a site
 */
export function addGlamourVeil(
  site: RitualSite,
  state: GreatOldOnesState
): { success: boolean; site?: RitualSite; reason?: string } {
  // Check if temple tier or higher
  if (site.type === 'shrine') {
    return { success: false, reason: 'Glamour veils require Temple tier or higher' };
  }

  // Check cost
  const cost = 50;
  if (state.resources.eldritchPower < cost) {
    return { success: false, reason: `Requires ${cost} eldritch power` };
  }

  state.resources.eldritchPower -= cost;

  return {
    success: true,
    site: {
      ...site,
      hasGlamourVeil: true,
      exposureRisk: Math.max(0, site.exposureRisk - 30),
    },
  };
}

/**
 * Add defensive wards to a site
 */
export function addDefensiveWards(
  site: RitualSite,
  state: GreatOldOnesState
): { success: boolean; site?: RitualSite; reason?: string } {
  // Check if nexus tier or higher
  if (site.type === 'shrine' || site.type === 'temple') {
    return { success: false, reason: 'Defensive wards require Nexus tier or higher' };
  }

  // Check cost
  const cost = 150;
  if (state.resources.eldritchPower < cost) {
    return { success: false, reason: `Requires ${cost} eldritch power` };
  }

  state.resources.eldritchPower -= cost;

  return {
    success: true,
    site: {
      ...site,
      hasDefensiveWards: true,
    },
  };
}

// ============================================================================
// GEOSTRATEGIC SITE SELECTION
// ============================================================================

export interface SitePlacementScore {
  regionId: string;
  regionName: string;
  score: number;
  factors: {
    corruption: number;
    cultistPresence: number;
    investigationRisk: number;
    culturalFit: number;
    biomeAvailability: number;
  };
  recommendedBiome: RitualSiteBiome;
  reasoning: string;
}

/**
 * Evaluate regions for optimal ritual site placement
 */
export function evaluateSitePlacement(
  state: GreatOldOnesState,
  desiredBiome?: RitualSiteBiome
): SitePlacementScore[] {
  return state.regions.map(region => {
    const scores = calculatePlacementScore(region, state, desiredBiome);
    return {
      regionId: region.regionId,
      regionName: region.regionName,
      score: scores.total,
      factors: scores.factors,
      recommendedBiome: scores.recommendedBiome,
      reasoning: scores.reasoning,
    };
  }).sort((a, b) => b.score - a.score);
}

function calculatePlacementScore(
  region: RegionalState,
  state: GreatOldOnesState,
  desiredBiome?: RitualSiteBiome
) {
  const factors = {
    corruption: region.corruption / 100,
    cultistPresence: Math.min(1, region.cultistCells / 5),
    investigationRisk: 1 - (region.investigationHeat / 100),
    culturalFit: calculateCulturalFit(region.culturalTraits, state.doctrine),
    biomeAvailability: desiredBiome ? 0.5 : 1.0,
  };

  // Weighted score
  const total = (
    factors.corruption * 0.3 +
    factors.cultistPresence * 0.25 +
    factors.investigationRisk * 0.25 +
    factors.culturalFit * 0.15 +
    factors.biomeAvailability * 0.05
  );

  // Recommend biome based on region traits
  const recommendedBiome = recommendBiomeForRegion(region);

  const reasoning = generatePlacementReasoning(factors, region, recommendedBiome);

  return {
    total,
    factors,
    recommendedBiome,
    reasoning,
  };
}

function calculateCulturalFit(
  traits: CulturalTrait[],
  doctrine: string | null
): number {
  let fit = 0.5; // Base fit

  if (doctrine === 'domination') {
    if (traits.includes('superstitious')) fit += 0.3;
    if (traits.includes('rationalist')) fit -= 0.2;
    if (traits.includes('faithful')) fit -= 0.1;
  } else if (doctrine === 'corruption') {
    if (traits.includes('urban')) fit += 0.3;
    if (traits.includes('academic')) fit += 0.2;
    if (traits.includes('isolated')) fit -= 0.3;
  } else if (doctrine === 'convergence') {
    if (traits.includes('superstitious')) fit += 0.2;
    if (traits.includes('faithful')) fit += 0.1;
    if (traits.includes('rationalist')) fit -= 0.1;
  }

  return Math.max(0, Math.min(1, fit));
}

function recommendBiomeForRegion(region: RegionalState): RitualSiteBiome {
  // Simple heuristic based on region traits
  if (region.culturalTraits.includes('urban')) {
    return 'urban';
  } else if (region.culturalTraits.includes('isolated')) {
    // Could be desert, forest, or mountain
    return Math.random() > 0.5 ? 'desert' : 'forest';
  } else if (region.culturalTraits.includes('superstitious')) {
    return 'ruins';
  }

  // Default to urban
  return 'urban';
}

function generatePlacementReasoning(
  factors: any,
  region: RegionalState,
  biome: RitualSiteBiome
): string {
  const reasons: string[] = [];

  if (factors.corruption > 0.6) {
    reasons.push('High corruption makes site establishment easier');
  } else if (factors.corruption < 0.3) {
    reasons.push('Low corruption will make site vulnerable');
  }

  if (factors.cultistPresence > 0.6) {
    reasons.push('Strong cultist presence provides support');
  } else if (factors.cultistPresence < 0.3) {
    reasons.push('Weak cultist presence requires building infrastructure first');
  }

  if (factors.investigationRisk < 0.4) {
    reasons.push('HIGH INVESTIGATION RISK - expect frequent raids');
  } else if (factors.investigationRisk > 0.7) {
    reasons.push('Low investigation heat provides safety');
  }

  const biomeInfo = BIOME_BONUSES[biome];
  reasons.push(`${biome} site: ${biomeInfo.description}`);

  return reasons.join('. ');
}

// ============================================================================
// POWER GENERATION
// ============================================================================

/**
 * Generate eldritch power at a ritual site each turn
 */
export function generateSitePower(
  site: RitualSite,
  alignment: { ritualPowerModifier: number }
): number {
  const tierConfig = SITE_UPGRADE_PATHS[site.type];
  const biomeBonus = BIOME_BONUSES[site.biome];

  const basePower = tierConfig.benefits.powerGenerationRate;
  const biomeMod = biomeBonus.ritualPowerBonus;
  const alignmentMod = alignment.ritualPowerModifier;

  return Math.floor(basePower * biomeMod * alignmentMod);
}

/**
 * Update all ritual sites for a turn
 */
export function updateRitualSites(state: GreatOldOnesState): void {
  state.regions.forEach(region => {
    region.ritualSites.forEach((site, index) => {
      // Progress any upgrades
      region.ritualSites[index] = progressSiteUpgrade(site);

      // Generate power
      const powerGenerated = generateSitePower(site, state.alignment);
      region.ritualSites[index].storedPower = Math.min(
        SITE_UPGRADE_PATHS[site.type].benefits.powerStorage,
        site.storedPower + powerGenerated
      );

      // Update exposure risk based on activity
      if (site.activeRitual) {
        region.ritualSites[index].exposureRisk = Math.min(
          100,
          site.exposureRisk + 2
        );
      } else {
        region.ritualSites[index].exposureRisk = Math.max(
          0,
          site.exposureRisk - 1
        );
      }
    });
  });
}
