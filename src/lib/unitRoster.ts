/**
 * Hybrid Unit Roster - Week 3
 * Cultist types, summoned entities, infiltrators
 */

import type {
  CultistCell,
  CultistTier,
  SummonedEntity,
  EntityTier,
  GreatOldOnesState,
  Doctrine,
  RitualSite,
  RitualSiteBiome,
} from '../types/greatOldOnes';

// ============================================================================
// CULTIST TYPES & PROGRESSION
// ============================================================================

export interface CultistTypeConfig {
  tier: CultistTier;
  name: string;
  description: string;

  /** Base stats */
  stats: {
    combatPower: number;
    ritualSkill: number;
    infiltrationSkill: number;
    sanityYield: number;  // How much sanity they harvest per turn
    loyalty: number;       // Resistance to capture/interrogation
  };

  /** Training requirements */
  training: {
    sanityFragmentCost: number;
    eldritchPowerCost: number;
    trainingTurns: number;
    requiredSiteTier: string;
  };

  /** Available assignments */
  availableAssignments: Array<'idle' | 'recruiting' | 'harvesting' | 'ritual' | 'infiltration' | 'defense'>;

  /** Special abilities */
  abilities: string[];
}

export const CULTIST_CONFIGS: Record<CultistTier, CultistTypeConfig> = {
  initiate: {
    tier: 'initiate',
    name: 'Street-Level Initiate',
    description: 'New recruits performing basic tasks and low-risk rituals',
    stats: {
      combatPower: 1,
      ritualSkill: 1,
      infiltrationSkill: 2,
      sanityYield: 5,
      loyalty: 40,
    },
    training: {
      sanityFragmentCost: 0,
      eldritchPowerCost: 0,
      trainingTurns: 0,
      requiredSiteTier: 'shrine',
    },
    availableAssignments: ['idle', 'recruiting', 'harvesting', 'defense'],
    abilities: ['street_recruitment', 'basic_reconnaissance'],
  },

  acolyte: {
    tier: 'acolyte',
    name: 'Devoted Acolyte',
    description: 'Experienced cultists capable of mid-tier rituals and combat support',
    stats: {
      combatPower: 3,
      ritualSkill: 5,
      infiltrationSkill: 4,
      sanityYield: 15,
      loyalty: 70,
    },
    training: {
      sanityFragmentCost: 50,
      eldritchPowerCost: 25,
      trainingTurns: 2,
      requiredSiteTier: 'temple',
    },
    availableAssignments: ['idle', 'recruiting', 'harvesting', 'ritual', 'infiltration', 'defense'],
    abilities: ['mid_tier_rituals', 'combat_trained', 'sacrificial_volunteers'],
  },

  high_priest: {
    tier: 'high_priest',
    name: 'High Priest',
    description: 'Elite leaders who can channel entities and resist interrogation',
    stats: {
      combatPower: 5,
      ritualSkill: 10,
      infiltrationSkill: 7,
      sanityYield: 30,
      loyalty: 95,
    },
    training: {
      sanityFragmentCost: 200,
      eldritchPowerCost: 150,
      trainingTurns: 5,
      requiredSiteTier: 'nexus',
    },
    availableAssignments: ['idle', 'recruiting', 'harvesting', 'ritual', 'infiltration', 'defense'],
    abilities: ['major_rituals', 'entity_channeling', 'psychic_resistance', 'leadership'],
  },
};

/**
 * Train cultists to next tier
 */
export function trainCultist(
  cell: CultistCell,
  state: GreatOldOnesState
): { success: boolean; cell?: CultistCell; reason?: string } {
  // Check current tier
  if (cell.tier === 'high_priest') {
    return { success: false, reason: 'Already at maximum tier' };
  }

  const nextTier: CultistTier = cell.tier === 'initiate' ? 'acolyte' : 'high_priest';
  const config = CULTIST_CONFIGS[nextTier];

  // Check if region has required site tier
  const region = state.regions.find(r => r.regionId === cell.regionId);
  if (!region) {
    return { success: false, reason: 'Region not found' };
  }

  const hasSufficientSite = region.ritualSites.some(
    site => site.type === config.training.requiredSiteTier ||
           (config.training.requiredSiteTier === 'shrine') ||
           (config.training.requiredSiteTier === 'temple' && (site.type === 'nexus' || site.type === 'gateway')) ||
           (config.training.requiredSiteTier === 'nexus' && site.type === 'gateway')
  );

  if (!hasSufficientSite) {
    return { success: false, reason: `Requires ${config.training.requiredSiteTier} or better in region` };
  }

  // Check resources
  if (state.resources.sanityFragments < config.training.sanityFragmentCost) {
    return { success: false, reason: `Requires ${config.training.sanityFragmentCost} sanity fragments` };
  }

  if (state.resources.eldritchPower < config.training.eldritchPowerCost) {
    return { success: false, reason: `Requires ${config.training.eldritchPowerCost} eldritch power` };
  }

  // Deduct costs
  state.resources.sanityFragments -= config.training.sanityFragmentCost;
  state.resources.eldritchPower -= config.training.eldritchPowerCost;

  // Upgrade cell
  const upgradedCell: CultistCell = {
    ...cell,
    tier: nextTier,
    attunement: cell.attunement + 20, // Training increases attunement
  };

  return { success: true, cell: upgradedCell };
}

// ============================================================================
// INFILTRATOR UNITS
// ============================================================================

export type InfiltratorType =
  | 'corporate_saboteur'
  | 'political_operative'
  | 'media_prophet'
  | 'academic_agent'
  | 'military_mole';

export interface Infiltrator {
  id: string;
  type: InfiltratorType;
  name: string;
  regionId: string;

  /** Which institution they've infiltrated */
  targetInstitution: string;

  /** Infiltration depth (0-100) */
  depth: number;

  /** Influence level (0-100) */
  influence: number;

  /** Has this infiltrator been exposed? */
  exposed: boolean;

  /** Special operations available */
  operations: string[];

  /** Current assignment */
  currentTask?: InfiltratorTask;
}

export interface InfiltratorTask {
  taskId: string;
  description: string;
  turnsRemaining: number;
  successChance: number;
  reward: {
    corruptionGain?: number;
    sanityFragments?: number;
    veilDamage?: number;
  };
}

export interface InfiltratorConfig {
  type: InfiltratorType;
  name: string;
  description: string;

  /** Ideal doctrine for this infiltrator */
  doctrineAffinity: Doctrine;

  /** Cost to recruit */
  recruitmentCost: {
    sanityFragments: number;
    eldritchPower: number;
  };

  /** Base stats */
  baseDepth: number;
  baseInfluence: number;

  /** Available operations */
  operations: {
    id: string;
    name: string;
    description: string;
    requiredDepth: number;
    duration: number;
    reward: InfiltratorTask['reward'];
  }[];
}

export const INFILTRATOR_CONFIGS: Record<InfiltratorType, InfiltratorConfig> = {
  corporate_saboteur: {
    type: 'corporate_saboteur',
    name: 'Corporate Saboteur',
    description: 'Corrupts business empires from within, spreading eldritch influence through capitalism',
    doctrineAffinity: 'corruption',
    recruitmentCost: {
      sanityFragments: 100,
      eldritchPower: 50,
    },
    baseDepth: 20,
    baseInfluence: 15,
    operations: [
      {
        id: 'stock_manipulation',
        name: 'Stock Manipulation',
        description: 'Crash markets to spread economic despair',
        requiredDepth: 30,
        duration: 2,
        reward: { sanityFragments: 30, corruptionGain: 5 },
      },
      {
        id: 'product_corruption',
        name: 'Product Corruption',
        description: 'Embed eldritch symbols in consumer products',
        requiredDepth: 50,
        duration: 3,
        reward: { corruptionGain: 10, veilDamage: 2 },
      },
      {
        id: 'monopoly_creation',
        name: 'Monopoly Creation',
        description: 'Create corporate monopoly serving the Order',
        requiredDepth: 70,
        duration: 5,
        reward: { corruptionGain: 20, sanityFragments: 50 },
      },
    ],
  },

  political_operative: {
    type: 'political_operative',
    name: 'Political Operative',
    description: 'Subverts governments, passing eldritch-friendly legislation',
    doctrineAffinity: 'corruption',
    recruitmentCost: {
      sanityFragments: 150,
      eldritchPower: 75,
    },
    baseDepth: 15,
    baseInfluence: 25,
    operations: [
      {
        id: 'suppress_investigation',
        name: 'Suppress Investigation',
        description: 'Use political pressure to shut down occult investigations',
        requiredDepth: 40,
        duration: 2,
        reward: { veilDamage: -10 },
      },
      {
        id: 'pass_legislation',
        name: 'Pass Legislation',
        description: 'Pass laws that benefit the Order',
        requiredDepth: 60,
        duration: 4,
        reward: { corruptionGain: 15 },
      },
      {
        id: 'puppet_government',
        name: 'Install Puppet Government',
        description: 'Complete takeover of regional government',
        requiredDepth: 90,
        duration: 8,
        reward: { corruptionGain: 40, sanityFragments: 100 },
      },
    ],
  },

  media_prophet: {
    type: 'media_prophet',
    name: 'Media Prophet',
    description: 'Spreads eldritch gospels through mass media and social networks',
    doctrineAffinity: 'convergence',
    recruitmentCost: {
      sanityFragments: 80,
      eldritchPower: 60,
    },
    baseDepth: 25,
    baseInfluence: 30,
    operations: [
      {
        id: 'meme_warfare',
        name: 'Memetic Warfare',
        description: 'Spread eldritch memes through social media',
        requiredDepth: 30,
        duration: 2,
        reward: { corruptionGain: 8, sanityFragments: 20 },
      },
      {
        id: 'documentary_propaganda',
        name: 'Documentary Propaganda',
        description: 'Create "documentary" normalizing the supernatural',
        requiredDepth: 50,
        duration: 4,
        reward: { corruptionGain: 12, veilDamage: 5 },
      },
      {
        id: 'celebrity_conversion',
        name: 'Celebrity Conversion',
        description: 'Convert major celebrity to the Order',
        requiredDepth: 80,
        duration: 6,
        reward: { corruptionGain: 25, sanityFragments: 80 },
      },
    ],
  },

  academic_agent: {
    type: 'academic_agent',
    name: 'Academic Agent',
    description: 'Infiltrates universities, teaching forbidden knowledge as legitimate science',
    doctrineAffinity: 'convergence',
    recruitmentCost: {
      sanityFragments: 120,
      eldritchPower: 80,
    },
    baseDepth: 30,
    baseInfluence: 20,
    operations: [
      {
        id: 'publish_papers',
        name: 'Publish Eldritch Papers',
        description: 'Publish academic papers containing forbidden knowledge',
        requiredDepth: 40,
        duration: 3,
        reward: { corruptionGain: 10, sanityFragments: 30 },
      },
      {
        id: 'curriculum_change',
        name: 'Curriculum Change',
        description: 'Introduce eldritch mathematics into university curriculum',
        requiredDepth: 60,
        duration: 5,
        reward: { corruptionGain: 18, sanityFragments: 50 },
      },
      {
        id: 'research_grant',
        name: 'Eldritch Research Grant',
        description: 'Fund research into cosmic horror disguised as theoretical physics',
        requiredDepth: 75,
        duration: 6,
        reward: { corruptionGain: 22, sanityFragments: 70 },
      },
    ],
  },

  military_mole: {
    type: 'military_mole',
    name: 'Military Mole',
    description: 'Corrupts military units to defend Order operations',
    doctrineAffinity: 'domination',
    recruitmentCost: {
      sanityFragments: 180,
      eldritchPower: 100,
    },
    baseDepth: 10,
    baseInfluence: 35,
    operations: [
      {
        id: 'false_flag',
        name: 'False Flag Operation',
        description: 'Blame rival nations for supernatural events',
        requiredDepth: 35,
        duration: 3,
        reward: { veilDamage: -5, corruptionGain: 5 },
      },
      {
        id: 'weapons_diversion',
        name: 'Weapons Diversion',
        description: 'Divert military weapons to cultist cells',
        requiredDepth: 55,
        duration: 4,
        reward: { corruptionGain: 12 },
      },
      {
        id: 'military_protection',
        name: 'Military Protection',
        description: 'Deploy military to "protect" ritual sites',
        requiredDepth: 85,
        duration: 7,
        reward: { corruptionGain: 30, veilDamage: -15 },
      },
    ],
  },
};

/**
 * Recruit an infiltrator
 */
export function recruitInfiltrator(
  type: InfiltratorType,
  regionId: string,
  state: GreatOldOnesState
): { success: boolean; infiltrator?: Infiltrator; reason?: string } {
  const config = INFILTRATOR_CONFIGS[type];

  // Check resources
  if (state.resources.sanityFragments < config.recruitmentCost.sanityFragments) {
    return { success: false, reason: `Requires ${config.recruitmentCost.sanityFragments} sanity fragments` };
  }

  if (state.resources.eldritchPower < config.recruitmentCost.eldritchPower) {
    return { success: false, reason: `Requires ${config.recruitmentCost.eldritchPower} eldritch power` };
  }

  // Deduct costs
  state.resources.sanityFragments -= config.recruitmentCost.sanityFragments;
  state.resources.eldritchPower -= config.recruitmentCost.eldritchPower;

  const infiltrator: Infiltrator = {
    id: `infiltrator_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    name: generateInfiltratorName(type),
    regionId,
    targetInstitution: generateTargetInstitution(type),
    depth: config.baseDepth,
    influence: config.baseInfluence,
    exposed: false,
    operations: config.operations.map(op => op.id),
  };

  return { success: true, infiltrator };
}

function generateInfiltratorName(type: InfiltratorType): string {
  const firstNames = ['Alex', 'Morgan', 'Jordan', 'Taylor', 'Casey', 'Riley', 'Avery', 'Quinn'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore'];
  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
}

function generateTargetInstitution(type: InfiltratorType): string {
  const institutions: Record<InfiltratorType, string[]> = {
    corporate_saboteur: ['MegaCorp Inc.', 'Global Industries', 'TechGiant LLC', 'Finance International'],
    political_operative: ['Senate', 'Parliament', 'City Council', 'State Legislature'],
    media_prophet: ['News Network', 'Social Media Platform', 'Entertainment Studio', 'Publishing House'],
    academic_agent: ['State University', 'Research Institute', 'Technical College', 'Science Academy'],
    military_mole: ['Defense Department', 'Intelligence Agency', 'Military Base', 'Special Forces'],
  };

  const options = institutions[type];
  return options[Math.floor(Math.random() * options.length)];
}

// ============================================================================
// ENTITY SUMMONING
// ============================================================================

export interface EntityConfig {
  tier: EntityTier;
  name: string;
  description: string;

  /** Summoning requirements */
  summoning: {
    sanityFragmentCost: number;
    eldritchPowerCost: number;
    requiredSiteTier: string;
    summoningTurns: number;
    requiredBiome?: RitualSiteBiome;
    requiredAlignment?: number; // Minimum ritual power modifier
  };

  /** Entity stats */
  stats: {
    power: number;
    terrorRadius: number;
    sanityDrainRate: number;
    veilDamage: number;
    controlDifficulty: number; // 0-100, higher = harder to control
  };

  /** Doctrine-specific benefits */
  doctrineBonus?: Partial<Record<Doctrine, string>>;

  /** Special abilities */
  abilities: string[];
}

export const ENTITY_CONFIGS: Record<string, EntityConfig> = {
  // Tier 1: Servitors
  servitor: {
    tier: 'servitor',
    name: 'Lesser Servitor',
    description: 'Weak entities for simple tasks and terror',
    summoning: {
      sanityFragmentCost: 50,
      eldritchPowerCost: 30,
      requiredSiteTier: 'shrine',
      summoningTurns: 1,
    },
    stats: {
      power: 10,
      terrorRadius: 1,
      sanityDrainRate: 2,
      veilDamage: 1,
      controlDifficulty: 10,
    },
    doctrineBonus: {
      domination: 'Enhanced terror aura',
    },
    abilities: ['basic_terror', 'minor_physical_form'],
  },

  // Tier 2: Horrors
  nightgaunt: {
    tier: 'horror',
    name: 'Nightgaunt',
    description: 'Flying horrors that terrorize and abduct',
    summoning: {
      sanityFragmentCost: 100,
      eldritchPowerCost: 75,
      requiredSiteTier: 'temple',
      summoningTurns: 2,
      requiredBiome: 'mountain',
    },
    stats: {
      power: 25,
      terrorRadius: 3,
      sanityDrainRate: 8,
      veilDamage: 5,
      controlDifficulty: 30,
    },
    doctrineBonus: {
      domination: 'Can abduct investigators',
      corruption: 'Silent operations, less veil damage',
    },
    abilities: ['flight', 'abduction', 'silent_terror'],
  },

  whispering_horror: {
    tier: 'horror',
    name: 'Whispering Horror',
    description: 'Invisible entities spreading madness through whispers',
    summoning: {
      sanityFragmentCost: 120,
      eldritchPowerCost: 90,
      requiredSiteTier: 'temple',
      summoningTurns: 2,
    },
    stats: {
      power: 15,
      terrorRadius: 5,
      sanityDrainRate: 15,
      veilDamage: 2,
      controlDifficulty: 35,
    },
    doctrineBonus: {
      corruption: 'Invisible, very low veil damage',
      convergence: 'Can deliver "enlightening" messages',
    },
    abilities: ['invisibility', 'mental_corruption', 'whisper_madness'],
  },

  // Tier 3: Star Spawn
  star_spawn: {
    tier: 'star_spawn',
    name: 'Star Spawn of Cthulhu',
    description: 'Powerful entities from the stars, heralds of the Great Old Ones',
    summoning: {
      sanityFragmentCost: 300,
      eldritchPowerCost: 250,
      requiredSiteTier: 'nexus',
      summoningTurns: 4,
      requiredAlignment: 1.5,
    },
    stats: {
      power: 60,
      terrorRadius: 10,
      sanityDrainRate: 30,
      veilDamage: 15,
      controlDifficulty: 60,
    },
    doctrineBonus: {
      domination: 'Massive combat power, can destroy military units',
      convergence: 'Can serve as "herald" for transcendence rituals',
    },
    abilities: ['massive_terror', 'reality_distortion', 'psychic_assault', 'regeneration'],
  },

  deep_one: {
    tier: 'star_spawn',
    name: 'Deep One',
    description: 'Aquatic horrors from the ocean depths',
    summoning: {
      sanityFragmentCost: 250,
      eldritchPowerCost: 200,
      requiredSiteTier: 'nexus',
      summoningTurns: 3,
      requiredBiome: 'ocean',
    },
    stats: {
      power: 50,
      terrorRadius: 8,
      sanityDrainRate: 25,
      veilDamage: 12,
      controlDifficulty: 50,
    },
    doctrineBonus: {
      domination: 'Can establish underwater bases',
      corruption: 'Can infiltrate coastal cities',
    },
    abilities: ['aquatic', 'coastal_invasion', 'hybrid_breeding', 'immortality'],
  },

  // Tier 4: Avatar
  avatar_nyarlathotep: {
    tier: 'avatar',
    name: 'Avatar of Nyarlathotep',
    description: 'Physical manifestation of the Crawling Chaos',
    summoning: {
      sanityFragmentCost: 800,
      eldritchPowerCost: 600,
      requiredSiteTier: 'gateway',
      summoningTurns: 8,
      requiredAlignment: 2.0,
    },
    stats: {
      power: 150,
      terrorRadius: 20,
      sanityDrainRate: 60,
      veilDamage: 30,
      controlDifficulty: 85,
    },
    doctrineBonus: {
      corruption: 'Master manipulator, can impersonate humans perfectly',
      domination: 'Commands all lesser entities',
      convergence: 'Can grant "enlightenment" selectively',
    },
    abilities: ['shapeshifting', 'perfect_deception', 'master_corruption', 'reality_manipulation', 'avatar_form'],
  },

  // Tier 5: Great Old One
  cthulhu: {
    tier: 'great_old_one',
    name: 'Cthulhu',
    description: 'The Great Dreamer awakens from R\'lyeh',
    summoning: {
      sanityFragmentCost: 2000,
      eldritchPowerCost: 1500,
      requiredSiteTier: 'gateway',
      summoningTurns: 15,
      requiredBiome: 'ocean',
      requiredAlignment: 5.0, // The Stars Are Right
    },
    stats: {
      power: 500,
      terrorRadius: 100,
      sanityDrainRate: 200,
      veilDamage: 100,
      controlDifficulty: 99,
    },
    doctrineBonus: {
      domination: 'INSTANT VICTORY - Total Domination achieved',
    },
    abilities: ['world_ending', 'dream_control', 'mass_madness', 'reality_shattering', 'immortal_god'],
  },
};

/**
 * Summon an entity at a ritual site
 */
export function summonEntity(
  entityType: string,
  site: RitualSite,
  state: GreatOldOnesState
): { success: boolean; entity?: SummonedEntity; reason?: string } {
  const config = ENTITY_CONFIGS[entityType];
  if (!config) {
    return { success: false, reason: 'Unknown entity type' };
  }

  // Check site tier
  const siteHierarchy = ['shrine', 'temple', 'nexus', 'gateway'];
  const requiredIndex = siteHierarchy.indexOf(config.summoning.requiredSiteTier);
  const currentIndex = siteHierarchy.indexOf(site.type);

  if (currentIndex < requiredIndex) {
    return { success: false, reason: `Requires ${config.summoning.requiredSiteTier} or better` };
  }

  // Check biome requirement
  if (config.summoning.requiredBiome && site.biome !== config.summoning.requiredBiome) {
    return { success: false, reason: `Requires ${config.summoning.requiredBiome} biome` };
  }

  // Check alignment requirement
  if (config.summoning.requiredAlignment && state.alignment.ritualPowerModifier < config.summoning.requiredAlignment) {
    return { success: false, reason: `Requires ritual power modifier of at least ${config.summoning.requiredAlignment}` };
  }

  // Check resources
  if (state.resources.sanityFragments < config.summoning.sanityFragmentCost) {
    return { success: false, reason: `Requires ${config.summoning.sanityFragmentCost} sanity fragments` };
  }

  if (state.resources.eldritchPower < config.summoning.eldritchPowerCost) {
    return { success: false, reason: `Requires ${config.summoning.eldritchPowerCost} eldritch power` };
  }

  // Deduct costs
  state.resources.sanityFragments -= config.summoning.sanityFragmentCost;
  state.resources.eldritchPower -= config.summoning.eldritchPowerCost;

  // Create entity
  const entity: SummonedEntity = {
    id: `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: config.name,
    tier: config.tier,
    regionId: site.regionId,
    bound: true,
    bindingStrength: Math.max(0, 100 - config.stats.controlDifficulty),
    power: config.stats.power,
    terrorRadius: config.stats.terrorRadius,
    task: 'guard',
  };

  return { success: true, entity };
}

/**
 * Update entity binding strength and check for rampages
 */
export function updateEntityBindings(state: GreatOldOnesState): void {
  state.summonedEntities.forEach((entity, index) => {
    const entityType = Object.keys(ENTITY_CONFIGS).find(
      key => ENTITY_CONFIGS[key].name === entity.name
    );

    if (!entityType) return;

    const config = ENTITY_CONFIGS[entityType];

    // Binding naturally weakens over time
    const decayRate = config.stats.controlDifficulty / 200;
    state.summonedEntities[index].bindingStrength = Math.max(
      0,
      entity.bindingStrength - decayRate
    );

    // Check for rampage
    if (entity.bindingStrength < 30 && entity.bound) {
      state.summonedEntities[index].bound = false;
      state.summonedEntities[index].task = 'rampage';

      // Rampaging entities cause massive veil damage
      state.resources.veilIntegrity -= config.stats.veilDamage * 2;
    }
  });
}
