/**
 * Great Old Ones Helper Functions
 * Utilities for initializing and managing the cult campaign state
 */

import type {
  GreatOldOnesState,
  Doctrine,
  RegionalState,
  CosmicAlignment,
  CelestialEvent,
  HighPriestCouncil,
  HighPriest,
  VeilState,
  CultistCell,
  RitualSite,
} from '../types/greatOldOnes';
import { calculateVeilStatus } from '../types/greatOldOnes';

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize a new Great Old Ones campaign state
 */
export function initializeGreatOldOnesState(): GreatOldOnesState {
  return {
    active: true,
    doctrine: null,

    resources: {
      sanityFragments: 100,
      eldritchPower: 50,
      veilIntegrity: 95,
      corruptionIndex: 5,
    },

    limits: {
      maxSanityFragments: 1000,
      maxEldritchPower: 500,
      eldritchPowerDecayRate: 2, // 2% per turn
    },

    regions: initializeRegions(),

    council: initializeHighPriestCouncil(),

    cultistCells: [],
    summonedEntities: [],
    investigators: [],

    veil: {
      integrity: 95,
      status: 'hidden',
      publicAwareness: 5,
      emergencyPowers: false,
      mediaCoverage: 0,
    },

    alignment: initializeCosmicAlignment(1),

    activeOperations: [],
    missionLog: [],

    campaignProgress: {
      currentAct: 1,
      missionsCompleted: [],
      actUnlocked: [true, false, false],
    },
  };
}

/**
 * Initialize regional states
 */
function initializeRegions(): RegionalState[] {
  const regionConfigs = [
    { id: 'north_america', name: 'North America', traits: ['urban', 'rationalist'] as const },
    { id: 'south_america', name: 'South America', traits: ['superstitious', 'isolated'] as const },
    { id: 'europe', name: 'Europe', traits: ['academic', 'rationalist'] as const },
    { id: 'africa', name: 'Africa', traits: ['superstitious', 'isolated'] as const },
    { id: 'middle_east', name: 'Middle East', traits: ['faithful', 'urban'] as const },
    { id: 'russia', name: 'Russia', traits: ['isolated', 'rationalist'] as const },
    { id: 'india', name: 'India', traits: ['superstitious', 'urban'] as const },
    { id: 'china', name: 'China', traits: ['rationalist', 'urban'] as const },
    { id: 'southeast_asia', name: 'Southeast Asia', traits: ['superstitious', 'urban'] as const },
    { id: 'oceania', name: 'Oceania', traits: ['isolated', 'rationalist'] as const },
  ];

  return regionConfigs.map(config => ({
    regionId: config.id,
    regionName: config.name,
    sanitySanity: 80,
    corruption: 0,
    cultistCells: 0,
    investigationHeat: 10,
    ritualSites: [],
    culturalTraits: config.traits,
    recentEvents: [],
  }));
}

/**
 * Initialize the High Priest Council
 */
function initializeHighPriestCouncil(): HighPriestCouncil {
  const priests: HighPriest[] = [
    {
      id: 'priest_conquest',
      name: 'Mordecai Blackwood',
      title: 'High Priest of Conquest',
      doctrineAffinity: 'domination',
      loyalty: 80,
      influence: 90,
      abilities: ['summoning_mastery', 'terror_tactics'],
      agenda: 'Awaken the Great Old Ones through force',
    },
    {
      id: 'priest_corruption',
      name: 'Lilith Ashford',
      title: 'High Priestess of Corruption',
      doctrineAffinity: 'corruption',
      loyalty: 80,
      influence: 85,
      abilities: ['infiltration_expert', 'memetic_manipulation'],
      agenda: 'Control humanity from within the shadows',
    },
    {
      id: 'priest_convergence',
      name: 'Thaddeus Grey',
      title: 'High Priest of Convergence',
      doctrineAffinity: 'convergence',
      loyalty: 80,
      influence: 75,
      abilities: ['enlightenment_preacher', 'psychic_attunement'],
      agenda: 'Guide humanity to voluntary transcendence',
    },
  ];

  return {
    members: priests,
    currentAgenda: null,
    pendingVotes: [],
    unity: 80,
  };
}

/**
 * Initialize cosmic alignment for a given turn
 */
function initializeCosmicAlignment(turn: number): CosmicAlignment {
  return {
    turn,
    lunarPhase: calculateLunarPhase(turn),
    planetaryAlignment: calculatePlanetaryAlignment(turn),
    celestialEvents: [],
    ritualPowerModifier: 1.0,
  };
}

// ============================================================================
// DOCTRINE SELECTION
// ============================================================================

/**
 * Select a doctrine and apply its bonuses/penalties
 */
export function selectDoctrine(
  state: GreatOldOnesState,
  doctrine: Doctrine
): GreatOldOnesState {
  const doctrineConfig = DOCTRINES[doctrine];

  // Update state with selected doctrine
  const updatedState: GreatOldOnesState = {
    ...state,
    doctrine,
  };

  // Apply resource limit modifiers
  if (doctrineConfig.bonuses.eldritchPowerDecay) {
    updatedState.limits = {
      ...updatedState.limits,
      eldritchPowerDecayRate:
        updatedState.limits.eldritchPowerDecayRate * doctrineConfig.bonuses.eldritchPowerDecay,
    };
  }

  // Apply initial veil modifier
  if (doctrineConfig.bonuses.veilIntegrityLoss) {
    // This will be applied during operations, but we note it here
  }

  // Log the selection
  addMissionLogEntry(updatedState, {
    category: 'event',
    title: `${doctrineConfig.name} Selected`,
    description: `The Order has committed to ${doctrineConfig.tagline}. ${doctrineConfig.description}`,
  });

  return updatedState;
}

// ============================================================================
// RESOURCE MANAGEMENT
// ============================================================================

/**
 * Update resources during production phase
 */
export function updateGreatOldOnesResources(
  state: GreatOldOnesState,
  turn: number
): GreatOldOnesState {
  const updated = { ...state };

  // Decay eldritch power
  const decayAmount = Math.floor(
    updated.resources.eldritchPower * (updated.limits.eldritchPowerDecayRate / 100)
  );
  updated.resources.eldritchPower = Math.max(
    0,
    updated.resources.eldritchPower - decayAmount
  );

  // Generate sanity fragments from active harvesting operations
  const harvestingCells = updated.cultistCells.filter(c => c.assignment === 'harvesting');
  const baseHarvest = harvestingCells.length * 10;

  // Apply doctrine bonuses
  let harvestMultiplier = 1.0;
  if (updated.doctrine) {
    const doctrineConfig = DOCTRINES[updated.doctrine];
    harvestMultiplier = doctrineConfig.bonuses.sanityHarvestRate || 1.0;
  }

  const sanityGain = Math.floor(baseHarvest * harvestMultiplier);
  updated.resources.sanityFragments = Math.min(
    updated.limits.maxSanityFragments,
    updated.resources.sanityFragments + sanityGain
  );

  // Update corruption based on active operations
  updated.regions.forEach(region => {
    // Corruption spreads naturally in regions with cultist presence
    if (region.cultistCells > 0) {
      const corruptionSpread = 0.5 + region.cultistCells * 0.1;
      region.corruption = Math.min(100, region.corruption + corruptionSpread);

      // Update global corruption index
      const globalCorruption = calculateGlobalCorruption(updated.regions);
      updated.resources.corruptionIndex = globalCorruption;
    }

    // Sanity degrades in corrupted regions
    if (region.corruption > 20) {
      const sanityLoss = (region.corruption / 100) * 0.5;
      region.sanitySanity = Math.max(0, region.sanitySanity - sanityLoss);
    }
  });

  // Update veil based on visibility of operations
  updateVeilIntegrity(updated);

  // Update cosmic alignment
  updated.alignment = updateCosmicAlignment(updated.alignment, turn);

  return updated;
}

/**
 * Calculate global corruption index from all regions
 */
function calculateGlobalCorruption(regions: RegionalState[]): number {
  const totalCorruption = regions.reduce((sum, r) => sum + r.corruption, 0);
  return Math.floor(totalCorruption / regions.length);
}

/**
 * Update veil integrity based on current state
 */
function updateVeilIntegrity(state: GreatOldOnesState): void {
  let veilDamage = 0;

  // Active summoned entities damage the veil
  state.summonedEntities.forEach(entity => {
    if (entity.tier === 'great_old_one') veilDamage += 5;
    else if (entity.tier === 'avatar') veilDamage += 3;
    else if (entity.tier === 'star_spawn') veilDamage += 1.5;
    else if (entity.tier === 'horror') veilDamage += 0.5;
  });

  // High corruption damages veil
  if (state.resources.corruptionIndex > 50) {
    veilDamage += (state.resources.corruptionIndex - 50) * 0.05;
  }

  // Active investigations restore veil (investigators expose truth)
  const investigatorHealRate = state.investigators.length * 0.2;

  const netVeilChange = -veilDamage + investigatorHealRate;
  state.resources.veilIntegrity = Math.max(
    0,
    Math.min(100, state.resources.veilIntegrity + netVeilChange)
  );

  // Update veil state
  state.veil.integrity = state.resources.veilIntegrity;
  state.veil.status = calculateVeilStatus(state.veil.integrity);
  state.veil.publicAwareness = 100 - state.veil.integrity;
}

// ============================================================================
// COSMIC ALIGNMENT SYSTEM
// ============================================================================

/**
 * Calculate lunar phase for a given turn (0-7, 0=new moon, 4=full moon)
 */
function calculateLunarPhase(turn: number): number {
  return turn % 8;
}

/**
 * Calculate planetary alignment strength (0-100)
 */
function calculatePlanetaryAlignment(turn: number): number {
  // Use sine wave for natural variation
  const cycle = Math.sin((turn * Math.PI) / 20);
  return Math.floor(50 + cycle * 50);
}

/**
 * Update cosmic alignment for a new turn
 */
function updateCosmicAlignment(current: CosmicAlignment, turn: number): CosmicAlignment {
  const lunarPhase = calculateLunarPhase(turn);
  const planetaryAlignment = calculatePlanetaryAlignment(turn);

  // Check for special celestial events
  const celestialEvents: CelestialEvent[] = [];

  // Full moon (every 8 turns)
  if (lunarPhase === 4) {
    celestialEvents.push({
      id: `full_moon_${turn}`,
      name: 'Full Moon',
      description: 'The moon is full, amplifying ritual power.',
      type: 'solstice',
      powerBonus: 1.2,
      duration: 1,
    });
  }

  // New moon (every 8 turns)
  if (lunarPhase === 0) {
    celestialEvents.push({
      id: `new_moon_${turn}`,
      name: 'New Moon',
      description: 'The moon is dark, perfect for hidden rituals.',
      type: 'solstice',
      powerBonus: 1.1,
      duration: 1,
    });
  }

  // Eclipse (rare, every 36 turns)
  if (turn % 36 === 0 && turn > 0) {
    celestialEvents.push({
      id: `eclipse_${turn}`,
      name: 'Solar Eclipse',
      description: 'The sun is consumed by darkness. Reality weakens.',
      type: 'eclipse',
      powerBonus: 1.8,
      duration: 1,
    });
  }

  // Comet (very rare, every 100 turns)
  if (turn % 100 === 0 && turn > 0) {
    celestialEvents.push({
      id: `comet_${turn}`,
      name: 'Crimson Comet',
      description: 'A blood-red comet streaks across the sky. The stars are aligning.',
      type: 'comet',
      powerBonus: 2.0,
      duration: 3,
    });
  }

  // The Stars Are Right (legendary, turn 200)
  if (turn === 200) {
    celestialEvents.push({
      id: 'stars_right',
      name: 'THE STARS ARE RIGHT',
      description: 'The cosmos aligns in a configuration not seen in millennia. The Great Old Ones can be awakened.',
      type: 'stars_right',
      powerBonus: 5.0,
      duration: 10,
    });
  }

  // Calculate overall ritual power modifier
  let ritualPowerModifier = 1.0;

  // Lunar phase modifier
  if (lunarPhase === 4) ritualPowerModifier += 0.2; // Full moon
  else if (lunarPhase === 0) ritualPowerModifier += 0.1; // New moon

  // Planetary alignment modifier
  if (planetaryAlignment > 80) ritualPowerModifier += 0.3;
  else if (planetaryAlignment > 60) ritualPowerModifier += 0.15;

  // Celestial event modifiers
  celestialEvents.forEach(event => {
    ritualPowerModifier += event.powerBonus - 1.0;
  });

  return {
    turn,
    lunarPhase,
    planetaryAlignment,
    celestialEvents,
    ritualPowerModifier,
  };
}

// ============================================================================
// MISSION LOG
// ============================================================================

/**
 * Add an entry to the mission log
 */
export function addMissionLogEntry(
  state: GreatOldOnesState,
  entry: Omit<typeof state.missionLog[0], 'turn' | 'timestamp'>
): void {
  state.missionLog.push({
    ...entry,
    turn: state.alignment.turn,
    timestamp: new Date().toISOString(),
  });

  // Keep log size manageable (last 100 entries)
  if (state.missionLog.length > 100) {
    state.missionLog = state.missionLog.slice(-100);
  }
}

// ============================================================================
// CULTIST OPERATIONS
// ============================================================================

/**
 * Create a new cultist cell in a region
 */
export function createCultistCell(
  state: GreatOldOnesState,
  regionId: string,
  tier: 'initiate' | 'acolyte' | 'high_priest' = 'initiate',
  count: number = 10
): CultistCell {
  const cell: CultistCell = {
    id: `cell_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    regionId,
    tier,
    count,
    assignment: 'idle',
    attunement: 0,
    compromised: false,
  };

  state.cultistCells.push(cell);

  // Update region cultist count
  const region = state.regions.find(r => r.regionId === regionId);
  if (region) {
    region.cultistCells++;
  }

  return cell;
}

/**
 * Create a ritual site in a region
 */
export function createRitualSite(
  state: GreatOldOnesState,
  regionId: string,
  biome: RitualSite['biome'],
  name?: string
): RitualSite {
  const site: RitualSite = {
    id: `site_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: name || generateRitualSiteName(biome),
    regionId,
    type: 'shrine',
    biome,
    storedPower: 0,
    hasGlamourVeil: false,
    hasDefensiveWards: false,
    upgradeProgress: 0,
    exposureRisk: 10,
  };

  const region = state.regions.find(r => r.regionId === regionId);
  if (region) {
    region.ritualSites.push(site);
  }

  return site;
}

/**
 * Generate a thematic name for a ritual site
 */
function generateRitualSiteName(biome: RitualSite['biome']): string {
  const names: Record<RitualSite['biome'], string[]> = {
    ocean: ['The Drowned Temple', 'Abyssal Shrine', 'Deep One Grotto', 'Sunken Obelisk'],
    mountain: ['Peak of Madness', 'Stargazer Summit', 'Howling Pinnacle', 'Sky Altar'],
    urban: ['Abandoned Asylum', 'Forgotten Subway', 'Condemned Church', 'Hidden Catacomb'],
    ruins: ['Ancient Megalith', 'Cyclopean Ruins', 'Nameless City', 'Forbidden Dig Site'],
    desert: ['Sand-Buried Temple', 'Oasis of Whispers', 'Dune Vault', 'Lost Necropolis'],
    forest: ['Dark Grove', 'Witch Circle', 'Moss-Covered Shrine', 'Primordial Tree'],
  };

  const options = names[biome];
  return options[Math.floor(Math.random() * options.length)];
}

// ============================================================================
// VICTORY CHECKING
// ============================================================================

/**
 * Check if any victory conditions have been met
 */
export function checkVictoryConditions(state: GreatOldOnesState): string | null {
  if (!state.doctrine) return null;

  const globalSanity = state.regions.reduce((sum, r) => sum + r.sanitySanity, 0) / state.regions.length;
  const regionsControlled = state.regions.filter(r => r.corruption > 70).length;
  const entitiesAwakened = state.summonedEntities.filter(e => e.tier === 'great_old_one').length;

  // Total Domination (Domination doctrine)
  if (
    state.doctrine === 'domination' &&
    entitiesAwakened >= 3 &&
    state.resources.corruptionIndex >= 80 &&
    globalSanity <= 20
  ) {
    return 'total_domination';
  }

  // Shadow Empire (Corruption doctrine)
  if (
    state.doctrine === 'corruption' &&
    state.resources.corruptionIndex >= 90 &&
    regionsControlled >= 12 &&
    globalSanity >= 40
  ) {
    return 'shadow_empire';
  }

  // Transcendence (Convergence doctrine)
  if (
    state.doctrine === 'convergence' &&
    state.resources.corruptionIndex >= 70
  ) {
    // Would need to track voluntary conversion rate
    return 'transcendence';
  }

  // Convergence (Convergence doctrine)
  if (
    state.doctrine === 'convergence' &&
    globalSanity >= 50 &&
    regionsControlled >= 8
  ) {
    return 'convergence';
  }

  // Banishment (loss condition)
  if (
    state.resources.corruptionIndex <= 10 &&
    globalSanity >= 70
  ) {
    return 'banishment';
  }

  return null;
}
