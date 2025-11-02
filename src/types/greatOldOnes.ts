/**
 * Great Old Ones Total Conversion - Type Definitions
 * Transforms Vector War into a Lovecraftian cult management strategy game
 */

// ============================================================================
// DOCTRINE SYSTEM
// ============================================================================

export type Doctrine = 'domination' | 'corruption' | 'convergence';

export interface DoctrineConfig {
  id: Doctrine;
  name: string;
  description: string;
  tagline: string;

  /** Immediate bonuses when doctrine is selected */
  bonuses: {
    sanityHarvestRate?: number;      // Multiplier for sanity fragment collection
    eldritchPowerDecay?: number;     // Multiplier for power decay rate
    veilIntegrityLoss?: number;      // Multiplier for veil damage from actions
    corruptionSpread?: number;       // Multiplier for corruption gain
    summoningRisk?: number;          // Multiplier for summoning backlash chance
    infiltrationSpeed?: number;      // Multiplier for infiltration operations
  };

  /** Penalties when doctrine is selected */
  penalties: {
    investigatorSpawnRate?: number;  // Multiplier for investigator appearance
    publicSuspicion?: number;        // Base suspicion level increase
    resourceCost?: number;           // Multiplier for operation costs
  };

  /** Unique mechanics unlocked by this doctrine */
  unlockedMechanics: string[];
}

export const DOCTRINES: Record<Doctrine, DoctrineConfig> = {
  domination: {
    id: 'domination',
    name: 'Path of Domination',
    description: 'Conquer humanity through summoned entities and overwhelming terror. Rule the remnants of civilization through fear.',
    tagline: 'Through Terror, Dominion',
    bonuses: {
      summoningRisk: 0.8,              // 20% less backlash risk
      sanityHarvestRate: 1.3,          // 30% more fragments from terror
      eldritchPowerDecay: 0.9,         // 10% slower decay
    },
    penalties: {
      veilIntegrityLoss: 1.5,          // 50% more veil damage (visible terror)
      investigatorSpawnRate: 1.3,      // 30% more investigators spawn
    },
    unlockedMechanics: [
      'advanced_summoning',
      'terror_propagation',
      'entity_control',
      'fear_campaigns',
      'beast_awakening',
    ],
  },

  corruption: {
    id: 'corruption',
    name: 'Path of Corruption',
    description: 'Infiltrate and subvert institutions from within. Spread madness through culture, media, and politics.',
    tagline: 'Through Subversion, Dominion',
    bonuses: {
      infiltrationSpeed: 1.4,          // 40% faster infiltration
      veilIntegrityLoss: 0.6,          // 40% less veil damage (stealth)
      corruptionSpread: 1.5,           // 50% faster corruption
    },
    penalties: {
      sanityHarvestRate: 0.8,          // 20% less fragments (subtle methods)
      resourceCost: 1.2,               // 20% higher operation costs
    },
    unlockedMechanics: [
      'infiltration_networks',
      'memetic_warfare',
      'dream_invasion',
      'puppet_governments',
      'sleeper_cells',
    ],
  },

  convergence: {
    id: 'convergence',
    name: 'Path of Convergence',
    description: 'Offer humanity voluntary transcendence. Guide willing converts toward cosmic enlightenment.',
    tagline: 'Through Enlightenment, Ascension',
    bonuses: {
      corruptionSpread: 1.3,           // 30% faster corruption (willing converts)
      investigatorSpawnRate: 0.7,      // 30% fewer investigators (benevolent image)
      sanityHarvestRate: 1.2,          // 20% more fragments (willing sacrifice)
    },
    penalties: {
      summoningRisk: 1.3,              // 30% more backlash (gentler methods)
      eldritchPowerDecay: 1.2,         // 20% faster decay (sharing power)
    },
    unlockedMechanics: [
      'enlightenment_programs',
      'voluntary_transcendence',
      'cultural_transformation',
      'hybrid_evolution',
      'pilgrimage_sites',
    ],
  },
};

// ============================================================================
// RESOURCE SYSTEM
// ============================================================================

export interface OccultResources {
  /** Harvested from broken minds - used for rituals and summonings */
  sanityFragments: number;

  /** Accumulated through rituals - decays over time */
  eldritchPower: number;

  /** How hidden the Order remains (0-100) */
  veilIntegrity: number;

  /** Societal decay enabling eldritch influence (0-100) */
  corruptionIndex: number;
}

export interface ResourceLimits {
  maxSanityFragments: number;
  maxEldritchPower: number;
  eldritchPowerDecayRate: number;  // Percentage lost per turn
}

// ============================================================================
// REGIONAL STATE
// ============================================================================

export interface RegionalState {
  regionId: string;
  regionName: string;

  /** Population sanity level (0-100, lower = more mad) */
  sanitySanity: number;

  /** Corruption level in this region (0-100) */
  corruption: number;

  /** Active cultist cells in region */
  cultistCells: number;

  /** Investigator presence (0-100) */
  investigationHeat: number;

  /** Active ritual sites */
  ritualSites: RitualSite[];

  /** Cultural resistance traits */
  culturalTraits: CulturalTrait[];

  /** Recent events affecting this region */
  recentEvents: string[];
}

export type CulturalTrait =
  | 'rationalist'      // Harder to corrupt through mysticism
  | 'superstitious'    // More susceptible to fear
  | 'academic'         // Provides investigation bonuses
  | 'isolated'         // Slower corruption spread
  | 'urban'            // Better for sanity harvesting
  | 'faithful';        // Resistant to corruption

// ============================================================================
// RITUAL SITES
// ============================================================================

export type RitualSiteType = 'shrine' | 'temple' | 'nexus' | 'gateway';
export type RitualSiteBiome = 'ocean' | 'mountain' | 'urban' | 'ruins' | 'desert' | 'forest';

export interface RitualSite {
  id: string;
  name: string;
  regionId: string;

  /** Site tier affects capabilities */
  type: RitualSiteType;

  /** Environmental type affects rituals */
  biome: RitualSiteBiome;

  /** Stored eldritch power at this site */
  storedPower: number;

  /** Is site concealed from investigators? */
  hasGlamourVeil: boolean;

  /** Is site protected with defensive wards? */
  hasDefensiveWards: boolean;

  /** Upgrade progress (0-100) */
  upgradeProgress: number;

  /** Currently active ritual */
  activeRitual?: ActiveRitual;

  /** Discovery risk (0-100) */
  exposureRisk: number;
}

export interface ActiveRitual {
  ritualId: string;
  ritualName: string;
  turnsRemaining: number;
  powerInvested: number;
  successChance: number;
}

// ============================================================================
// CULTIST UNITS
// ============================================================================

export type CultistTier = 'initiate' | 'acolyte' | 'high_priest';
export type EntityTier = 'servitor' | 'horror' | 'star_spawn' | 'avatar' | 'great_old_one';

export interface CultistCell {
  id: string;
  regionId: string;
  tier: CultistTier;
  count: number;

  /** Current assignment */
  assignment: 'idle' | 'recruiting' | 'harvesting' | 'ritual' | 'infiltration' | 'defense';

  /** Experience level (0-100) */
  attunement: number;

  /** Has this cell been discovered? */
  compromised: boolean;
}

export interface SummonedEntity {
  id: string;
  name: string;
  tier: EntityTier;
  regionId: string;

  /** Is entity under control? */
  bound: boolean;

  /** Control strength (0-100) */
  bindingStrength: number;

  /** Entity power level */
  power: number;

  /** Terror effect radius */
  terrorRadius: number;

  /** Assignment */
  task: 'guard' | 'assault' | 'terror' | 'rampage';
}

// ============================================================================
// INVESTIGATION SYSTEM
// ============================================================================

export interface InvestigatorUnit {
  id: string;
  name: string;
  type: 'detective' | 'occult_researcher' | 'government_agent' | 'psychic';

  /** Special abilities */
  abilities: InvestigatorAbility[];

  /** Current location */
  regionId: string;

  /** Investigation target */
  targetRegionId?: string;

  /** Progress on current investigation (0-100) */
  investigationProgress: number;

  /** Psychic resistance (0-100) */
  psychicResistance: number;

  /** Can detect artifacts? */
  hasArtifactDetection: boolean;
}

export type InvestigatorAbility =
  | 'psychic_resistance'
  | 'artifact_detection'
  | 'ritual_disruption'
  | 'cult_infiltration'
  | 'true_sight';

// ============================================================================
// STELLAR ALIGNMENT CALENDAR
// ============================================================================

export interface CosmicAlignment {
  turn: number;

  /** Current lunar phase (0-7, 0=new moon, 4=full moon) */
  lunarPhase: number;

  /** Planetary alignment strength (0-100) */
  planetaryAlignment: number;

  /** Special astronomical events this turn */
  celestialEvents: CelestialEvent[];

  /** Overall ritual power modifier for this turn */
  ritualPowerModifier: number;
}

export interface CelestialEvent {
  id: string;
  name: string;
  description: string;
  type: 'eclipse' | 'comet' | 'conjunction' | 'solstice' | 'equinox' | 'stars_right';
  powerBonus: number;
  duration: number;  // How many turns this event lasts
}

// ============================================================================
// HIGH PRIEST COUNCIL
// ============================================================================

export interface HighPriestCouncil {
  members: HighPriest[];

  /** Current council agenda */
  currentAgenda: CouncilAgenda | null;

  /** Pending votes */
  pendingVotes: CouncilVote[];

  /** Council unity (0-100) */
  unity: number;
}

export interface HighPriest {
  id: string;
  name: string;
  title: string;

  /** Which doctrine does this priest favor? */
  doctrineAffinity: Doctrine;

  /** Loyalty to player (0-100) */
  loyalty: number;

  /** Power/influence in council (0-100) */
  influence: number;

  /** Special abilities */
  abilities: string[];

  /** Personal agenda */
  agenda?: string;
}

export interface CouncilAgenda {
  id: string;
  title: string;
  description: string;
  proposedBy: string;  // High priest ID
  requiredVotes: number;
  currentVotes: number;
}

export interface CouncilVote {
  agendaId: string;
  votesFor: string[];    // High priest IDs
  votesAgainst: string[];
  turnsRemaining: number;
}

// ============================================================================
// OPERATIONS & MISSIONS
// ============================================================================

export interface OccultOperation {
  id: string;
  name: string;
  description: string;
  category: 'harvest' | 'ritual' | 'infiltration' | 'summoning' | 'corruption' | 'silence';

  /** Cost to perform */
  cost: {
    sanityFragments?: number;
    eldritchPower?: number;
    cultists?: number;
  };

  /** Veil damage from performing this operation */
  veilDamage: number;

  /** Time to complete */
  duration: number;

  /** Success probability (0-1) */
  baseSuccessChance: number;

  /** Modifiers based on doctrine, region, etc */
  modifiers?: OperationModifiers;
}

export interface OperationModifiers {
  doctrineBonus?: Partial<Record<Doctrine, number>>;
  culturalTraitModifiers?: Partial<Record<CulturalTrait, number>>;
  celestialBonus?: number;
  investigationPenalty?: number;
}

// ============================================================================
// VEIL INTEGRITY SYSTEM
// ============================================================================

export type VeilStatus = 'hidden' | 'rumors' | 'known' | 'crisis' | 'shattered';

export interface VeilState {
  integrity: number;  // 0-100
  status: VeilStatus;

  /** Public awareness of supernatural (0-100) */
  publicAwareness: number;

  /** Government response level */
  emergencyPowers: boolean;

  /** Media coverage of occult events */
  mediaCoverage: number;
}

export function calculateVeilStatus(integrity: number): VeilStatus {
  if (integrity >= 80) return 'hidden';
  if (integrity >= 40) return 'rumors';
  if (integrity >= 10) return 'known';
  if (integrity > 0) return 'crisis';
  return 'shattered';
}

// ============================================================================
// VICTORY CONDITIONS
// ============================================================================

export type OccultVictoryType =
  | 'total_domination'      // Old Ones fully awakened, humanity enslaved
  | 'shadow_empire'         // Corruption complete, puppet governments
  | 'transcendence'         // Voluntary merger with cosmic entities
  | 'convergence'           // Co-existence charter achieved
  | 'banishment'            // Order defeated (loss)
  | 'cosmic_joke';          // Player was pawn all along

export interface OccultVictoryCondition {
  type: OccultVictoryType;
  name: string;
  description: string;

  /** Conditions that must be met */
  conditions: {
    corruptionThreshold?: number;
    sanityThreshold?: number;
    entitiesAwakened?: number;
    regionsControlled?: number;
    voluntaryConversionRate?: number;
  };

  /** Which doctrine(s) can achieve this victory */
  doctrinesAllowed: Doctrine[];
}

export const OCCULT_VICTORY_CONDITIONS: Record<OccultVictoryType, OccultVictoryCondition> = {
  total_domination: {
    type: 'total_domination',
    name: 'Total Domination',
    description: 'The Great Old Ones walk the Earth. Humanity kneels or perishes.',
    conditions: {
      entitiesAwakened: 3,
      corruptionThreshold: 80,
      sanityThreshold: 20,
    },
    doctrinesAllowed: ['domination'],
  },

  shadow_empire: {
    type: 'shadow_empire',
    name: 'Shadow Empire',
    description: 'The world serves the Order unknowingly. Puppet masters rule in darkness.',
    conditions: {
      corruptionThreshold: 90,
      regionsControlled: 12,
      sanityThreshold: 40,
    },
    doctrinesAllowed: ['corruption'],
  },

  transcendence: {
    type: 'transcendence',
    name: 'Transcendence',
    description: 'Humanity has evolved beyond flesh. A new cosmic consciousness emerges.',
    conditions: {
      voluntaryConversionRate: 80,
      corruptionThreshold: 70,
    },
    doctrinesAllowed: ['convergence'],
  },

  convergence: {
    type: 'convergence',
    name: 'Convergence',
    description: 'Humanity and the Old Ones coexist. A new age of cosmic enlightenment begins.',
    conditions: {
      voluntaryConversionRate: 60,
      sanityThreshold: 50,
      regionsControlled: 8,
    },
    doctrinesAllowed: ['convergence'],
  },

  banishment: {
    type: 'banishment',
    name: 'Banishment',
    description: 'The Order has been defeated. The entities return to their slumber... for now.',
    conditions: {
      corruptionThreshold: 10,
      sanityThreshold: 70,
    },
    doctrinesAllowed: ['domination', 'corruption', 'convergence'],
  },

  cosmic_joke: {
    type: 'cosmic_joke',
    name: 'The Cosmic Joke',
    description: 'You were never in control. You served a greater entity all along.',
    conditions: {
      entitiesAwakened: 1,
      corruptionThreshold: 50,
    },
    doctrinesAllowed: ['domination', 'corruption', 'convergence'],
  },
};

// ============================================================================
// GREAT OLD ONES GAME STATE EXTENSION
// ============================================================================

export interface GreatOldOnesState {
  /** Is this campaign mode active? */
  active: boolean;

  /** Selected doctrine */
  doctrine: Doctrine | null;

  /** Has Council Schism been used to change doctrine? (can only be done once) */
  councilSchismUsed?: boolean;

  /** Resources */
  resources: OccultResources;

  /** Resource limits */
  limits: ResourceLimits;

  /** Regional states */
  regions: RegionalState[];

  /** High Priest council */
  council: HighPriestCouncil;

  /** Active cultist cells */
  cultistCells: CultistCell[];

  /** Summoned entities */
  summonedEntities: SummonedEntity[];

  /** Active investigators */
  investigators: InvestigatorUnit[];

  /** Veil state */
  veil: VeilState;

  /** Cosmic alignment calendar */
  alignment: CosmicAlignment;

  /** Active operations */
  activeOperations: ActiveOperation[];

  /** Mission log */
  missionLog: MissionLogEntry[];

  /** Campaign act progress */
  campaignProgress: {
    currentAct: 1 | 2 | 3;
    missionsCompleted: string[];
    actUnlocked: boolean[];
  };
}

export interface ActiveOperation {
  operation: OccultOperation;
  startedTurn: number;
  assignedCells: string[];  // Cultist cell IDs
  targetRegionId: string;
  progress: number;  // 0-100
}

export interface MissionLogEntry {
  turn: number;
  timestamp: string;
  category: 'harvest' | 'ritual' | 'infiltration' | 'summoning' | 'investigation' | 'event';
  title: string;
  description: string;
  sanityChange?: number;
  corruptionChange?: number;
  veilChange?: number;
}
