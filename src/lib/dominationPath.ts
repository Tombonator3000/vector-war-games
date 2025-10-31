/**
 * Path of Domination - Week 4 Implementation
 * Summoning System, Terror Propagation, Military Confrontation, Beast Awakening
 */

import {
  EntityTier,
  SummonedEntity,
  RitualSite,
  RitualSiteBiome,
  GreatOldOnesState,
  RegionalState,
  OccultResources,
} from '../types/greatOldOnes';

// ============================================================================
// SUMMONING SYSTEM - Tiered Entity Hierarchy
// ============================================================================

export interface EntityTemplate {
  tier: EntityTier;
  baseName: string;
  description: string;

  /** Resource cost to summon */
  cost: {
    sanityFragments: number;
    eldritchPower: number;
    cultistsRequired: number;
  };

  /** Base stats */
  stats: {
    power: number;
    terrorRadius: number;
    controlDifficulty: number;  // 0-100, higher = harder to control
  };

  /** Which biomes boost this entity? */
  affinityBiomes: RitualSiteBiome[];

  /** Backlash disaster type if summoning fails */
  backlashType: BacklashType;

  /** Special abilities */
  abilities: string[];
}

export type BacklashType =
  | 'minor_casualties'     // Few cultists die
  | 'site_damaged'         // Ritual site takes damage
  | 'veil_breach'          // Major veil integrity loss
  | 'entity_rampages'      // Uncontrolled entity spawns
  | 'reality_tear'         // Regional sanity collapse
  | 'cultist_madness'      // Entire cell goes insane
  | 'elder_wrath';         // Elder One punishes failure

export const ENTITY_TEMPLATES: Record<EntityTier, EntityTemplate> = {
  servitor: {
    tier: 'servitor',
    baseName: 'Lesser Servitor',
    description: 'Weak but expendable entities, perfect for terror campaigns and guard duty.',
    cost: {
      sanityFragments: 20,
      eldritchPower: 10,
      cultistsRequired: 3,
    },
    stats: {
      power: 15,
      terrorRadius: 2,
      controlDifficulty: 20,
    },
    affinityBiomes: ['urban', 'ruins'],
    backlashType: 'minor_casualties',
    abilities: ['terror_aura', 'phase_shift', 'night_vision'],
  },

  horror: {
    tier: 'horror',
    baseName: 'Whispering Horror',
    description: 'Combat-capable entities that spread madness through psychic assault.',
    cost: {
      sanityFragments: 50,
      eldritchPower: 30,
      cultistsRequired: 8,
    },
    stats: {
      power: 40,
      terrorRadius: 5,
      controlDifficulty: 45,
    },
    affinityBiomes: ['urban', 'forest', 'ruins'],
    backlashType: 'site_damaged',
    abilities: ['psychic_scream', 'shadow_walk', 'fear_projection', 'mind_break'],
  },

  star_spawn: {
    tier: 'star_spawn',
    baseName: 'Star Spawn',
    description: 'Powerful cosmic entities requiring strong binding circles to control.',
    cost: {
      sanityFragments: 150,
      eldritchPower: 100,
      cultistsRequired: 20,
    },
    stats: {
      power: 85,
      terrorRadius: 10,
      controlDifficulty: 70,
    },
    affinityBiomes: ['mountain', 'ruins', 'desert'],
    backlashType: 'entity_rampages',
    abilities: ['reality_warp', 'cosmic_dread', 'matter_manipulation', 'telepathy', 'regeneration'],
  },

  avatar: {
    tier: 'avatar',
    baseName: 'Avatar of the Deep',
    description: 'Physical manifestations of Great Old Ones, capable of regional devastation.',
    cost: {
      sanityFragments: 400,
      eldritchPower: 250,
      cultistsRequired: 50,
    },
    stats: {
      power: 150,
      terrorRadius: 20,
      controlDifficulty: 90,
    },
    affinityBiomes: ['ocean', 'mountain'],
    backlashType: 'reality_tear',
    abilities: ['mass_hysteria', 'dream_invasion', 'weather_control', 'earthquake', 'tidal_wave', 'immortal'],
  },

  great_old_one: {
    tier: 'great_old_one',
    baseName: 'Great Old One',
    description: 'Campaign-ending summoning. The stars must be right. Reality will never be the same.',
    cost: {
      sanityFragments: 1000,
      eldritchPower: 500,
      cultistsRequired: 100,
    },
    stats: {
      power: 300,
      terrorRadius: 50,
      controlDifficulty: 100,
    },
    affinityBiomes: ['ocean', 'mountain', 'ruins'],
    backlashType: 'elder_wrath',
    abilities: ['reality_rewrite', 'mass_transformation', 'cosmic_horror', 'unstoppable', 'world_shaper'],
  },
};

// ============================================================================
// SUMMONING RITUAL MINIGAME
// ============================================================================

export interface SummoningAttempt {
  entityTier: EntityTier;
  ritualSite: RitualSite;
  assignedCultists: number;

  /** Optional components that boost success chance */
  ritualComponents: RitualComponent[];

  /** True names provide control bonuses */
  trueName?: string;

  /** Player can choose to rush (higher risk) */
  rushed: boolean;
}

export interface RitualComponent {
  id: string;
  name: string;
  description: string;
  successBonus: number;
  controlBonus: number;
}

export interface SummoningResult {
  success: boolean;
  entity?: SummonedEntity;
  backlash?: BacklashEvent;
  controlAchieved: boolean;
  bindingStrength: number;
  message: string;
}

export interface BacklashEvent {
  type: BacklashType;
  severity: number;  // 1-10
  effects: BacklashEffect[];
  description: string;
}

export interface BacklashEffect {
  type: 'cultist_loss' | 'site_damage' | 'veil_damage' | 'sanity_drain' | 'entity_spawn' | 'power_loss';
  value: number;
  regionId: string;
}

/**
 * Calculates the success chance for a summoning attempt
 */
export function calculateSummoningChance(
  attempt: SummoningAttempt,
  state: GreatOldOnesState
): number {
  const template = ENTITY_TEMPLATES[attempt.entityTier];

  // Base chance starts at 50%
  let chance = 50;

  // Site type bonus
  const siteBonus = {
    shrine: 0,
    temple: 10,
    nexus: 20,
    gateway: 30,
  }[attempt.ritualSite.type];
  chance += siteBonus;

  // Biome affinity
  if (template.affinityBiomes.includes(attempt.ritualSite.biome)) {
    chance += 15;
  }

  // Cultist skill bonus (more cultists = better, but diminishing returns)
  const cultistBonus = Math.min(
    20,
    (attempt.assignedCultists / template.cost.cultistsRequired) * 10
  );
  chance += cultistBonus;

  // Ritual components
  const componentBonus = attempt.ritualComponents.reduce(
    (sum, comp) => sum + comp.successBonus,
    0
  );
  chance += componentBonus;

  // Cosmic alignment bonus
  chance += state.alignment.ritualPowerModifier;

  // Doctrine bonus (Domination has 20% less risk = effectively +20% success)
  if (state.doctrine === 'domination') {
    chance += 20;
  }

  // Rushing penalty
  if (attempt.rushed) {
    chance -= 30;
  }

  // Site defensive wards help stabilize
  if (attempt.ritualSite.hasDefensiveWards) {
    chance += 10;
  }

  // Cap between 5% and 95%
  return Math.max(5, Math.min(95, chance));
}

/**
 * Calculates initial binding strength for a successfully summoned entity
 */
export function calculateBindingStrength(
  attempt: SummoningAttempt,
  state: GreatOldOnesState
): number {
  const template = ENTITY_TEMPLATES[attempt.entityTier];

  // Start at 100 and subtract control difficulty
  let binding = 100 - template.stats.controlDifficulty;

  // True name provides massive control boost
  if (attempt.trueName) {
    binding += 40;
  }

  // Ritual components with control bonuses
  const controlBonus = attempt.ritualComponents.reduce(
    (sum, comp) => sum + comp.controlBonus,
    0
  );
  binding += controlBonus;

  // High priest presence helps
  const highPriestCount = state.council.members.filter(
    priest => priest.doctrineAffinity === 'domination'
  ).length;
  binding += highPriestCount * 5;

  // Defensive wards contain the entity
  if (attempt.ritualSite.hasDefensiveWards) {
    binding += 15;
  }

  // Cap between 10 and 100
  return Math.max(10, Math.min(100, binding));
}

/**
 * Performs a summoning ritual attempt
 */
export function attemptSummoning(
  attempt: SummoningAttempt,
  state: GreatOldOnesState
): SummoningResult {
  const template = ENTITY_TEMPLATES[attempt.entityTier];
  const successChance = calculateSummoningChance(attempt, state);

  // Roll for success
  const roll = Math.random() * 100;
  const success = roll <= successChance;

  if (success) {
    // Calculate binding strength
    const bindingStrength = calculateBindingStrength(attempt, state);
    const controlAchieved = bindingStrength >= 50;

    // Create the entity
    const entity: SummonedEntity = {
      id: `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: generateEntityName(template),
      tier: attempt.entityTier,
      regionId: attempt.ritualSite.regionId,
      bound: controlAchieved,
      bindingStrength,
      power: template.stats.power,
      terrorRadius: template.stats.terrorRadius,
      task: controlAchieved ? 'guard' : 'rampage',
    };

    return {
      success: true,
      entity,
      controlAchieved,
      bindingStrength,
      message: controlAchieved
        ? `${entity.name} has been successfully summoned and bound to your will!`
        : `${entity.name} manifests, but the binding fails! The entity breaks free!`,
    };
  } else {
    // Summoning failed - generate backlash
    const backlash = generateBacklash(template, attempt, state);

    return {
      success: false,
      controlAchieved: false,
      bindingStrength: 0,
      backlash,
      message: `The summoning ritual fails catastrophically! ${backlash.description}`,
    };
  }
}

/**
 * Generates a backlash event when summoning fails
 */
function generateBacklash(
  template: EntityTemplate,
  attempt: SummoningAttempt,
  state: GreatOldOnesState
): BacklashEvent {
  const severity = Math.ceil(Math.random() * 10);
  const effects: BacklashEffect[] = [];

  switch (template.backlashType) {
    case 'minor_casualties':
      effects.push({
        type: 'cultist_loss',
        value: Math.ceil(attempt.assignedCultists * 0.3),
        regionId: attempt.ritualSite.regionId,
      });
      return {
        type: 'minor_casualties',
        severity,
        effects,
        description: 'The ritual circle collapses, consuming several cultists in eldritch fire.',
      };

    case 'site_damaged':
      effects.push({
        type: 'site_damage',
        value: 40,
        regionId: attempt.ritualSite.regionId,
      });
      effects.push({
        type: 'power_loss',
        value: attempt.ritualSite.storedPower * 0.5,
        regionId: attempt.ritualSite.regionId,
      });
      return {
        type: 'site_damaged',
        severity,
        effects,
        description: 'Eldritch energies surge uncontrolled, damaging the ritual site structure.',
      };

    case 'veil_breach':
      effects.push({
        type: 'veil_damage',
        value: 30,
        regionId: attempt.ritualSite.regionId,
      });
      return {
        type: 'veil_breach',
        severity,
        effects,
        description: 'A massive breach in reality is witnessed by dozens. Investigators mobilize!',
      };

    case 'entity_rampages':
      // Spawn a weaker, uncontrolled version
      effects.push({
        type: 'entity_spawn',
        value: 1,
        regionId: attempt.ritualSite.regionId,
      });
      effects.push({
        type: 'sanity_drain',
        value: 20,
        regionId: attempt.ritualSite.regionId,
      });
      return {
        type: 'entity_rampages',
        severity,
        effects,
        description: 'Something came through, but it refuses your control! The entity rampages!',
      };

    case 'reality_tear':
      effects.push({
        type: 'sanity_drain',
        value: 40,
        regionId: attempt.ritualSite.regionId,
      });
      effects.push({
        type: 'veil_damage',
        value: 50,
        regionId: attempt.ritualSite.regionId,
      });
      return {
        type: 'reality_tear',
        severity,
        effects,
        description: 'Reality itself tears open! Mass hysteria spreads as the impossible becomes visible!',
      };

    case 'cultist_madness':
      effects.push({
        type: 'cultist_loss',
        value: attempt.assignedCultists,
        regionId: attempt.ritualSite.regionId,
      });
      effects.push({
        type: 'sanity_drain',
        value: 15,
        regionId: attempt.ritualSite.regionId,
      });
      return {
        type: 'cultist_madness',
        severity,
        effects,
        description: 'All cultists participating are driven irreversibly insane, becoming gibbering husks.',
      };

    case 'elder_wrath':
      effects.push({
        type: 'power_loss',
        value: state.resources.eldritchPower * 0.8,
        regionId: attempt.ritualSite.regionId,
      });
      effects.push({
        type: 'cultist_loss',
        value: attempt.assignedCultists,
        regionId: attempt.ritualSite.regionId,
      });
      effects.push({
        type: 'sanity_drain',
        value: 50,
        regionId: attempt.ritualSite.regionId,
      });
      return {
        type: 'elder_wrath',
        severity: 10,
        effects,
        description: 'You have ANGERED the Old Ones! Their wrath descends upon your order!',
      };
  }
}

/**
 * Generates a unique entity name
 */
function generateEntityName(template: EntityTemplate): string {
  const prefixes = ['The', 'Dread', 'Shadow', 'Void', 'Ancient', 'Eternal'];
  const suffixes = ['Walker', 'Screamer', 'Devourer', 'Bringer', 'Witness', 'Herald'];

  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

  return `${prefix} ${suffix}`;
}

// ============================================================================
// ENTITY CONTROL MECHANICS
// ============================================================================

export interface ControlCheckResult {
  maintained: boolean;
  bindingChange: number;
  message: string;
  consequence?: string;
}

/**
 * Checks if an entity remains under control each turn
 */
export function performControlCheck(
  entity: SummonedEntity,
  state: GreatOldOnesState
): ControlCheckResult {
  // Already rampaging entities cannot be recaptured easily
  if (!entity.bound && entity.bindingStrength < 30) {
    return {
      maintained: false,
      bindingChange: -5,
      message: `${entity.name} continues its rampage, immune to your control attempts.`,
    };
  }

  const template = ENTITY_TEMPLATES[entity.tier];

  // Base control difficulty
  let difficulty = template.stats.controlDifficulty;

  // More powerful entities are harder to control
  if (entity.power > 100) difficulty += 10;

  // Binding naturally decays over time
  let bindingChange = -2;

  // High priests can help maintain control
  const dominationPriests = state.council.members.filter(
    p => p.doctrineAffinity === 'domination'
  ).length;
  bindingChange += dominationPriests * 0.5;

  // Veil being low makes entities harder to control (reality weakens)
  if (state.veil.integrity < 30) {
    bindingChange -= 3;
  }

  // Roll for control
  const roll = Math.random() * 100;
  const newBinding = Math.max(0, Math.min(100, entity.bindingStrength + bindingChange));

  if (roll > difficulty && newBinding >= 50) {
    return {
      maintained: true,
      bindingChange,
      message: `${entity.name} remains bound to your will.`,
    };
  } else if (newBinding >= 30) {
    return {
      maintained: true,
      bindingChange,
      message: `${entity.name}'s binding weakens, but holds... for now.`,
      consequence: 'The entity grows restless. Strengthen the binding or face consequences.',
    };
  } else {
    return {
      maintained: false,
      bindingChange: -20,
      message: `The binding shatters! ${entity.name} breaks free!`,
      consequence: 'The entity begins rampaging, attacking anything nearby including your cultists!',
    };
  }
}

/**
 * Attempts to rebind a rampaging entity
 */
export function attemptRebinding(
  entity: SummonedEntity,
  ritualSite: RitualSite,
  cultistsAssigned: number,
  eldritchPowerSpent: number,
  state: GreatOldOnesState
): ControlCheckResult {
  const template = ENTITY_TEMPLATES[entity.tier];

  let successChance = 30; // Base 30% chance to rebind

  // More cultists help
  successChance += Math.min(20, cultistsAssigned * 2);

  // Power investment helps
  successChance += Math.min(30, eldritchPowerSpent / 5);

  // Defensive wards on site
  if (ritualSite.hasDefensiveWards) {
    successChance += 15;
  }

  // Doctrine bonus
  if (state.doctrine === 'domination') {
    successChance += 10;
  }

  const roll = Math.random() * 100;

  if (roll <= successChance) {
    const newBinding = 50 + Math.random() * 20;
    return {
      maintained: true,
      bindingChange: newBinding - entity.bindingStrength,
      message: `Success! ${entity.name} has been rebound!`,
    };
  } else {
    return {
      maintained: false,
      bindingChange: 0,
      message: `The rebinding ritual fails. ${entity.name} remains free.`,
      consequence: 'The entity attacks the ritual site in rage!',
    };
  }
}

// ============================================================================
// TERROR PROPAGATION SYSTEM
// ============================================================================

export interface TerrorCampaign {
  id: string;
  name: string;
  targetRegionId: string;
  assignedEntities: string[];  // Entity IDs

  /** Type of terror operation */
  type: 'mass_nightmares' | 'public_manifestation' | 'sky_signs' | 'massacre' | 'possession_display';

  duration: number;
  currentProgress: number;
}

export interface TerrorResult {
  fearGenerated: number;
  sanityDrained: number;
  veilDamage: number;
  mediaResponse: 'coverup' | 'panic' | 'denial' | 'exploitation';
  conversions: number;  // People who join the cult out of fear
  message: string;
}

/**
 * Executes a terror campaign
 */
export function executeTerrorCampaign(
  campaign: TerrorCampaign,
  entities: SummonedEntity[],
  region: RegionalState,
  state: GreatOldOnesState
): TerrorResult {
  const assignedEntityObjects = entities.filter(e =>
    campaign.assignedEntities.includes(e.id)
  );

  // Calculate total terror power
  const totalTerror = assignedEntityObjects.reduce(
    (sum, e) => sum + e.terrorRadius * e.power,
    0
  );

  // Base fear generated
  let fearGenerated = totalTerror * 0.5;

  // Type modifiers
  const typeModifiers = {
    mass_nightmares: { fear: 0.8, sanity: 1.5, veil: 0.5 },
    public_manifestation: { fear: 2.0, sanity: 1.2, veil: 3.0 },
    sky_signs: { fear: 1.5, sanity: 1.0, veil: 2.0 },
    massacre: { fear: 2.5, sanity: 0.8, veil: 4.0 },
    possession_display: { fear: 1.8, sanity: 1.8, veil: 2.5 },
  };

  const modifier = typeModifiers[campaign.type];
  fearGenerated *= modifier.fear;

  // Sanity drain
  const sanityDrained = (totalTerror * 0.3 * modifier.sanity) *
    (region.culturalTraits.includes('superstitious') ? 1.5 : 1.0);

  // Veil damage
  const veilDamage = (totalTerror * 0.2 * modifier.veil) *
    (state.doctrine === 'domination' ? 1.5 : 1.0);

  // Some people join out of fear or nihilistic despair
  const conversionRate = state.doctrine === 'domination' ? 0.02 : 0.01;
  const conversions = Math.floor(fearGenerated * conversionRate);

  // Media response based on veil and fear level
  let mediaResponse: 'coverup' | 'panic' | 'denial' | 'exploitation';
  if (state.veil.integrity > 60) {
    mediaResponse = 'coverup';
  } else if (fearGenerated > 100) {
    mediaResponse = 'panic';
  } else if (region.culturalTraits.includes('rationalist')) {
    mediaResponse = 'denial';
  } else {
    mediaResponse = 'exploitation';
  }

  return {
    fearGenerated,
    sanityDrained,
    veilDamage,
    mediaResponse,
    conversions,
    message: generateTerrorMessage(campaign.type, fearGenerated, mediaResponse),
  };
}

function generateTerrorMessage(
  type: TerrorCampaign['type'],
  fear: number,
  media: TerrorResult['mediaResponse']
): string {
  const messages = {
    mass_nightmares: `An epidemic of nightmares sweeps the region. Sleep becomes terror.`,
    public_manifestation: `Eldritch horrors appear in broad daylight! Mass hysteria erupts!`,
    sky_signs: `Impossible patterns appear in the sky. Those who look too long go mad.`,
    massacre: `A brutal massacre leaves no survivors, only warnings written in blood.`,
    possession_display: `Dozens are simultaneously possessed, speaking in ancient tongues.`,
  };

  const mediaMessages = {
    coverup: ' Authorities desperately suppress the truth.',
    panic: ' Media coverage spreads the terror worldwide!',
    denial: ' Rationalists scramble to explain away the impossible.',
    exploitation: ' Sensationalist media turns horror into entertainment.',
  };

  return messages[type] + mediaMessages[media];
}

// ============================================================================
// MILITARY CONFRONTATION SYSTEM
// ============================================================================

export interface MilitaryEngagement {
  regionId: string;
  entities: SummonedEntity[];
  militaryStrength: number;  // Government military response level

  /** Entity advantages */
  asymmetricFactors: {
    nighttime: boolean;          // Entities stronger at night
    urbanTerrain: boolean;       // Close quarters favor horror
    civilianShield: boolean;     // Civilians present (collateral damage)
    weatherControl: boolean;     // Entities with weather powers
  };

  /** Military counters */
  militaryCounters: {
    blessedWeapons: boolean;
    flamethrowers: boolean;
    heavyArtillery: boolean;
    militaryPsychics: boolean;
  };
}

export interface CombatResult {
  entityLosses: number;
  militaryLosses: number;
  civilianCasualties: number;
  territoryCaptured: boolean;
  sanityCost: number;
  veilDamage: number;
  message: string;
}

/**
 * Resolves military engagement between entities and conventional forces
 */
export function resolveMilitaryEngagement(
  engagement: MilitaryEngagement,
  state: GreatOldOnesState
): CombatResult {
  // Calculate entity combat power
  let entityPower = engagement.entities.reduce((sum, e) => sum + e.power, 0);

  // Asymmetric warfare bonuses
  if (engagement.asymmetricFactors.nighttime) entityPower *= 1.3;
  if (engagement.asymmetricFactors.urbanTerrain) entityPower *= 1.2;
  if (engagement.asymmetricFactors.weatherControl) entityPower *= 1.4;

  // Military power with counters
  let militaryPower = engagement.militaryStrength;
  if (engagement.militaryCounters.blessedWeapons) militaryPower *= 1.5;
  if (engagement.militaryCounters.flamethrowers) militaryPower *= 1.3;
  if (engagement.militaryCounters.heavyArtillery) militaryPower *= 1.2;
  if (engagement.militaryCounters.militaryPsychics) militaryPower *= 1.4;

  // Resolve combat
  const powerRatio = entityPower / militaryPower;

  let entityLosses = 0;
  let militaryLosses = 0;
  let territoryCaptured = false;

  if (powerRatio > 2) {
    // Entity overwhelming victory
    entityLosses = Math.floor(engagement.entities.length * 0.1);
    militaryLosses = Math.floor(engagement.militaryStrength * 0.8);
    territoryCaptured = true;
  } else if (powerRatio > 1) {
    // Entity victory
    entityLosses = Math.floor(engagement.entities.length * 0.3);
    militaryLosses = Math.floor(engagement.militaryStrength * 0.6);
    territoryCaptured = true;
  } else if (powerRatio > 0.5) {
    // Stalemate
    entityLosses = Math.floor(engagement.entities.length * 0.5);
    militaryLosses = Math.floor(engagement.militaryStrength * 0.4);
  } else {
    // Military victory
    entityLosses = Math.floor(engagement.entities.length * 0.7);
    militaryLosses = Math.floor(engagement.militaryStrength * 0.3);
  }

  // Civilian casualties (especially with civilian shield)
  const civilianCasualties = engagement.asymmetricFactors.civilianShield
    ? militaryLosses * 3
    : militaryLosses * 0.5;

  // Sanity cost from witnessing battle
  const sanityCost = (entityPower * 0.1) + (civilianCasualties * 0.05);

  // Veil damage from public warfare
  const veilDamage = 30 + (entityPower * 0.1);

  return {
    entityLosses,
    militaryLosses,
    civilianCasualties,
    territoryCaptured,
    sanityCost,
    veilDamage,
    message: generateCombatMessage(powerRatio, territoryCaptured, civilianCasualties),
  };
}

function generateCombatMessage(ratio: number, captured: boolean, civilians: number): string {
  if (ratio > 2) {
    return `Total victory! Your entities slaughter the military forces. ${civilians > 100 ? 'Massive civilian casualties horrify the world.' : 'The region falls.'}`;
  } else if (ratio > 1 && captured) {
    return `Your entities prevail, capturing the territory. ${civilians > 50 ? 'Heavy civilian casualties.' : 'The military retreats in disarray.'}`;
  } else if (ratio > 0.5) {
    return `Brutal stalemate. Both sides take heavy losses. ${civilians > 0 ? 'Civilians caught in the crossfire.' : ''}`;
  } else {
    return `The military repels your entities! ${ratio < 0.3 ? 'Devastating losses.' : 'Your forces retreat.'}`;
  }
}

// ============================================================================
// LEGENDARY BEAST AWAKENING
// ============================================================================

export interface GreatOldOneAwakening {
  entityName: 'Cthulhu' | 'Hastur' | 'Shub-Niggurath' | 'Nyarlathotep' | 'Azathoth';

  /** Multi-stage ritual chain */
  stages: AwakeningStage[];
  currentStage: number;

  /** Global coordination required */
  sitesRequired: number;
  sitesActivated: string[];  // Ritual site IDs

  /** Celestial requirement */
  requiresStarsRight: boolean;
  starsAligned: boolean;

  /** Progress tracking */
  progress: number;  // 0-100
}

export interface AwakeningStage {
  stageNumber: number;
  name: string;
  description: string;

  requirements: {
    sanityFragments: number;
    eldritchPower: number;
    cultistsRequired: number;
    specificBiomes: RitualSiteBiome[];
  };

  partialAwakeningEffect?: string;  // What happens if stage succeeds
}

export const GREAT_OLD_ONE_AWAKENINGS: Record<string, GreatOldOneAwakening> = {
  cthulhu: {
    entityName: 'Cthulhu',
    stages: [
      {
        stageNumber: 1,
        name: 'The Dreaming Begins',
        description: 'Cthulhu stirs in sunken R\'lyeh. Dreams ripple across the world.',
        requirements: {
          sanityFragments: 300,
          eldritchPower: 200,
          cultistsRequired: 50,
          specificBiomes: ['ocean'],
        },
        partialAwakeningEffect: 'Global nightmare epidemic. +20% sanity drain worldwide.',
      },
      {
        stageNumber: 2,
        name: 'The City Rises',
        description: 'R\'lyeh breaks the surface. Non-Euclidean geometry defies reality.',
        requirements: {
          sanityFragments: 500,
          eldritchPower: 350,
          cultistsRequired: 100,
          specificBiomes: ['ocean', 'ruins'],
        },
        partialAwakeningEffect: 'Massive tidal waves. Coastal regions devastated. Reality distortion spreads.',
      },
      {
        stageNumber: 3,
        name: 'The Dead God Wakes',
        description: 'Cthulhu emerges. The stars are right. Humanity\'s age ends.',
        requirements: {
          sanityFragments: 1000,
          eldritchPower: 500,
          cultistsRequired: 200,
          specificBiomes: ['ocean', 'ruins', 'urban'],
        },
        partialAwakeningEffect: 'CAMPAIGN ENDING: Total Domination Victory',
      },
    ],
    currentStage: 0,
    sitesRequired: 5,
    sitesActivated: [],
    requiresStarsRight: true,
    starsAligned: false,
    progress: 0,
  },
  // Add more Old Ones as needed...
};

/**
 * Advances a Great Old One awakening stage
 */
export function progressAwakening(
  awakening: GreatOldOneAwakening,
  ritualSiteIds: string[],
  state: GreatOldOnesState
): { success: boolean; message: string; consequences: string[] } {
  const stage = awakening.stages[awakening.currentStage];

  if (!stage) {
    return {
      success: false,
      message: 'This awakening chain is complete!',
      consequences: [],
    };
  }

  // Check requirements
  const consequences: string[] = [];

  if (state.resources.sanityFragments < stage.requirements.sanityFragments) {
    return {
      success: false,
      message: `Insufficient Sanity Fragments. Need ${stage.requirements.sanityFragments}, have ${state.resources.sanityFragments}.`,
      consequences: [],
    };
  }

  if (state.resources.eldritchPower < stage.requirements.eldritchPower) {
    return {
      success: false,
      message: `Insufficient Eldritch Power. Need ${stage.requirements.eldritchPower}, have ${state.resources.eldritchPower}.`,
      consequences: [],
    };
  }

  // Check sites have correct biomes
  const sites = state.regions
    .flatMap(r => r.ritualSites)
    .filter(s => ritualSiteIds.includes(s.id));

  const biomesNeeded = stage.requirements.specificBiomes;
  const biomesPresent = sites.map(s => s.biome);
  const hasRequiredBiomes = biomesNeeded.every(b => biomesPresent.includes(b));

  if (!hasRequiredBiomes) {
    return {
      success: false,
      message: `Missing required biomes: ${biomesNeeded.join(', ')}`,
      consequences: [],
    };
  }

  // Check stars alignment for final stage
  if (awakening.currentStage === awakening.stages.length - 1 && awakening.requiresStarsRight) {
    const hasStarsRight = state.alignment.celestialEvents.some(e => e.type === 'stars_right');
    if (!hasStarsRight) {
      return {
        success: false,
        message: 'The stars are not yet right for the final awakening!',
        consequences: ['You must wait for the celestial convergence...'],
      };
    }
  }

  // Perform the ritual
  consequences.push(`${stage.name} ritual complete!`);
  consequences.push(stage.description);

  if (stage.partialAwakeningEffect) {
    consequences.push(stage.partialAwakeningEffect);
  }

  // Global veil damage from major ritual
  consequences.push(`Massive veil breach! -${30 + awakening.currentStage * 10} Veil Integrity`);

  return {
    success: true,
    message: `Stage ${stage.stageNumber} complete: ${stage.name}`,
    consequences,
  };
}
