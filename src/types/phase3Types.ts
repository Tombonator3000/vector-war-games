/**
 * Phase 3 Types - Advanced Systems & Late Game (Weeks 8-11)
 * Narrative Arcs, Counter-Occult Mechanics, and Endgame Systems
 */

import { Doctrine } from './greatOldOnes';

// ============================================================================
// WEEK 8: NARRATIVE ARCS & COSMIC SECRETS
// ============================================================================

/** Player motivation types */
export type MotivationType =
  | 'world_domination'
  | 'human_ascension'
  | 'feed_old_ones'
  | 'prevent_catastrophe'
  | 'personal_apotheosis';

/** Branches in the motivation reveal chain */
export interface MotivationBranch {
  id: string;
  type: MotivationType;
  name: string;
  description: string;

  /** Player choices that led to this branch */
  triggeringChoices: string[];

  /** Current revelation level (0-100) */
  revelationProgress: number;

  /** Flashback scenes unlocked */
  flashbacksUnlocked: string[];

  /** Does this path offer redemption? */
  redemptionAvailable: boolean;
}

/** The Great Truth about the Old Ones */
export interface GreatTruthState {
  /** How much has been revealed (0-100) */
  revelationLevel: number;

  /** Player's interpretation of the truth */
  interpretation: 'malevolent' | 'indifferent' | 'benevolent' | 'unknown';

  /** What will awakening actually cause? */
  actualConsequence: 'salvation' | 'extinction' | 'transformation' | 'transcendence';

  /** Contradictory evidence discovered */
  contradictions: TruthContradiction[];

  /** Has player accepted or rejected the truth? */
  playerStance: 'believer' | 'skeptic' | 'opportunist' | 'horrified' | null;
}

export interface TruthContradiction {
  id: string;
  title: string;
  description: string;
  evidence: string[];
  weight: number; // How significant is this contradiction?
}

/** Internal Order factions */
export type OrderFaction = 'purists' | 'progressives' | 'transcendents';

export interface OrderFactionState {
  faction: OrderFaction;
  name: string;
  description: string;

  /** Faction strength (0-100) */
  power: number;

  /** Leader character */
  leader: FactionLeader;

  /** Faction goals */
  agenda: string;

  /** Relationship with player (-100 to 100) */
  playerRelation: number;
}

export interface FactionLeader {
  id: string;
  name: string;
  title: string;
  personality: string;
  secretAgenda?: string;
}

/** Rival cults competing for Old One favor */
export interface RivalCult {
  id: string;
  name: string;
  patronEntity: 'cthulhu' | 'hastur' | 'nyarlathotep' | 'azathoth' | 'yog_sothoth';

  /** Cult strength (0-100) */
  power: number;

  /** How close are they to their goal? */
  progress: number;

  /** Their current operation */
  currentOperation?: string;

  /** Can we ally or must we compete? */
  relationshipType: 'hostile' | 'neutral' | 'potential_ally';
}

/** Council schisms and betrayals */
export interface OrderSchism {
  id: string;
  name: string;
  cause: string;

  /** Factions involved */
  factions: OrderFaction[];

  /** High Priests taking sides */
  loyalists: string[]; // Priest IDs
  rebels: string[]; // Priest IDs

  /** Severity (0-100) */
  severity: number;

  /** Can this be resolved peacefully? */
  resolvable: boolean;

  /** Consequences if not resolved */
  consequences: string[];
}

// ============================================================================
// WEEK 9: COUNTER-OCCULT MECHANICS
// ============================================================================

/** Human resistance research paths */
export type ResearchPath =
  | 'occult_defense'
  | 'psychic_shielding'
  | 'counter_rituals'
  | 'artifact_weapons'
  | 'reality_anchors';

export interface ResistanceResearch {
  path: ResearchPath;
  name: string;
  description: string;

  /** Research progress (0-100) */
  progress: number;

  /** Technologies unlocked */
  unlockedTech: ResistanceTechnology[];

  /** How much does this counter the Order? */
  effectivenessAgainstOrder: number;
}

export interface ResistanceTechnology {
  id: string;
  name: string;
  description: string;
  researchPath: ResearchPath;

  /** What does this tech counter? */
  counters: ('rituals' | 'entities' | 'corruption' | 'madness' | 'infiltration')[];

  /** Effectiveness percentage */
  effectiveness: number;

  /** Deployment level (0-100) */
  deployment: number;
}

/** Global unity against the Order */
export interface GlobalUnityState {
  /** Overall unity score (0-100) */
  unityScore: number;

  /** Active alliances */
  alliances: HumanAlliance[];

  /** Joint operations being planned */
  jointOperations: JointOperation[];

  /** Can humanity win? */
  victoryPossible: boolean;
}

export interface HumanAlliance {
  id: string;
  name: string;
  type: 'religious' | 'scientific' | 'military' | 'political';

  /** Member nations/organizations */
  members: string[];

  /** Alliance strength */
  strength: number;

  /** Resources pooled */
  resources: {
    funding: number;
    personnel: number;
    technology: number;
  };
}

export interface JointOperation {
  id: string;
  name: string;
  type: 'assault' | 'investigation' | 'purge' | 'exorcism' | 'counter_ritual';

  /** Target (region, site, entity) */
  targetId: string;
  targetType: 'region' | 'ritual_site' | 'entity' | 'infiltrator';

  /** Participating alliances */
  participants: string[];

  /** Preparation progress */
  preparation: number;

  /** Estimated success chance */
  successChance: number;

  /** Turns until execution */
  turnsUntilLaunch: number;
}

/** Investigation task forces */
export interface InvestigationTaskForce {
  id: string;
  name: string;

  /** Lead investigator */
  leader: {
    name: string;
    specialization: string;
    abilities: string[];
  };

  /** Task force capabilities */
  capabilities: {
    investigation: number;
    combat: number;
    occultKnowledge: number;
    psychicResistance: number;
  };

  /** Current mission */
  currentMission?: {
    target: string;
    progress: number;
    discovered: string[];
  };
}

/** Sanity restoration programs */
export interface SanityRestoration {
  id: string;
  type: 'therapy' | 'memetic_counter' | 'religious_revival' | 'pharmaceutical';
  name: string;

  /** Regions being treated */
  activeRegions: string[];

  /** Effectiveness (0-100) */
  effectiveness: number;

  /** Sanity restored per turn */
  restorationRate: number;

  /** Can the Order counter this? */
  vulnerable: boolean;
}

/** Exorcism and banishment operations */
export interface ExorcismOperation {
  id: string;
  name: string;

  /** Target entity to banish */
  targetEntityId: string;

  /** Ritual requirements */
  requirements: {
    participants: number;
    artifacts: string[];
    preparation: number;
  };

  /** Success probability */
  successChance: number;

  /** Progress (0-100) */
  progress: number;

  /** Consequences if it succeeds */
  banishmentConsequences: {
    veilRestoration: number;
    sanityRestoration: number;
    orderSetback: number;
  };
}

// ============================================================================
// WEEK 10-11: ENDGAME & REPLAYABILITY
// ============================================================================

/** Extended victory conditions with nuance */
export interface EnhancedVictoryCondition {
  type: string;
  name: string;
  description: string;

  /** Flavor of victory based on player choices */
  variant: 'brutal' | 'cunning' | 'benevolent' | 'tragic' | 'pyrrhic';

  /** Conditions met */
  conditionsMet: {
    [key: string]: boolean;
  };

  /** Final score */
  score: number;

  /** Ending narration */
  endingNarrative: string;

  /** What unlocks for NG+? */
  newGamePlusUnlocks: string[];
}

/** Dynamic campaign variables */
export interface CampaignState {
  /** Starting era */
  era: 'victorian' | 'cold_war' | 'modern' | 'cyberpunk' | 'custom';

  /** Generated investigator traits */
  investigatorTraits: InvestigatorTrait[];

  /** Random events that occurred */
  historicalEvents: CampaignEvent[];

  /** Player choices made */
  majorChoices: PlayerChoice[];

  /** Campaign difficulty */
  difficulty: 'story' | 'normal' | 'hard' | 'nightmare' | 'impossible';
}

export interface InvestigatorTrait {
  id: string;
  name: string;
  description: string;

  /** How does this affect investigations? */
  investigationBonus: number;

  /** Special abilities */
  specialAbilities: string[];
}

export interface CampaignEvent {
  turn: number;
  eventId: string;
  name: string;
  description: string;

  /** Impact on game state */
  impact: {
    type: string;
    value: number;
  }[];

  /** Player response */
  playerResponse?: string;
}

export interface PlayerChoice {
  turn: number;
  choiceId: string;
  context: string;
  optionSelected: string;

  /** Consequences that followed */
  consequences: string[];

  /** Doctrine alignment */
  doctrineAlignment: Doctrine | null;

  /** Morality score change */
  moralityChange: number;
}

/** New Game+ legacy perks */
export interface LegacyPerk {
  id: string;
  name: string;
  description: string;
  type: 'remembered_madness' | 'cult_inheritance' | 'eldritch_favor' | 'forbidden_knowledge';

  /** What does this perk do? */
  effects: {
    resourceBonus?: number;
    startingCultists?: number;
    startingSites?: number;
    doctrineUnlock?: boolean;
    investigatorHandicap?: number;
  };

  /** How was this unlocked? */
  unlockCondition: string;
}

/** Post-game analytics */
export interface CampaignAnalytics {
  /** Overall performance */
  overallScore: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';

  /** Doctrine performance */
  doctrinePerformance: {
    doctrine: Doctrine;
    efficiency: number;
    missionsCompleted: number;
    favorGained: number;
  };

  /** Sanity drain timeline */
  sanityTimeline: {
    turn: number;
    globalSanity: number;
    cause: string;
  }[];

  /** Corruption map */
  corruptionMap: {
    regionId: string;
    peakCorruption: number;
    firstInstitutionFell: string;
    institutionsFallen: string[];
  }[];

  /** Entity summoning log */
  entityLog: {
    entityName: string;
    tier: string;
    turnSummoned: number;
    turnBanished?: number;
    rampaged: boolean;
    terrorCaused: number;
  }[];

  /** Investigator encounters */
  investigatorLog: {
    name: string;
    encountered: number;
    defeated: number;
    converted: number;
    escaped: number;
  }[];

  /** Mission statistics */
  missionStats: {
    total: number;
    successful: number;
    failed: number;
    perfectScores: number;
    averageDifficulty: number;
  };

  /** Unlocked lore entries */
  loreUnlocked: LoreEntry[];
}

export interface LoreEntry {
  id: string;
  category: 'entity' | 'ritual' | 'artifact' | 'location' | 'character';
  title: string;
  content: string;
  unlockedBy: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
}

/** Procedural campaign generator settings */
export interface CampaignGenerator {
  /** Seed for reproducibility */
  seed: string;

  /** Era settings */
  era: CampaignState['era'];

  /** Randomized elements */
  randomization: {
    investigatorLeadership: boolean;
    startingRegions: boolean;
    ritualSiteLocations: boolean;
    eventTiming: boolean;
    rivalCults: boolean;
  };

  /** Difficulty modifiers */
  modifiers: {
    investigatorSpawnRate: number;
    sanityResistance: number;
    corruptionDifficulty: number;
    entityControlDifficulty: number;
  };

  /** Story beat toggles */
  storyBeats: {
    firstManifestation: boolean;
    greatSchism: boolean;
    celebrityConvert: boolean;
    investigatorStrike: boolean;
    nightmarePlague: boolean;
  };
}

// ============================================================================
// PHASE 3 COMPLETE STATE
// ============================================================================

export interface Phase3State {
  /** Is Phase 3 unlocked? */
  unlocked: boolean;

  /** Current phase 3 week (8-11) */
  currentWeek: number;

  // === WEEK 8: NARRATIVE ARCS ===
  narrative: {
    motivationBranch: MotivationBranch | null;
    greatTruth: GreatTruthState;
    orderFactions: OrderFactionState[];
    rivalCults: RivalCult[];
    activeSchisms: OrderSchism[];
  };

  // === WEEK 9: COUNTER-OCCULT ===
  counterOccult: {
    resistanceResearch: ResistanceResearch[];
    globalUnity: GlobalUnityState;
    taskForces: InvestigationTaskForce[];
    sanityRestoration: SanityRestoration[];
    exorcismOps: ExorcismOperation[];
  };

  // === WEEK 10-11: ENDGAME ===
  endgame: {
    campaignState: CampaignState;
    availableVictories: EnhancedVictoryCondition[];
    achievedVictory: EnhancedVictoryCondition | null;
    analytics: CampaignAnalytics | null;
    legacyPerks: LegacyPerk[];
  };

  /** Campaign generator for NG+ */
  generator: CampaignGenerator;
}

/**
 * Initialize Phase 3 state
 */
export function initializePhase3State(seed?: string): Phase3State {
  return {
    unlocked: false,
    currentWeek: 8,

    narrative: {
      motivationBranch: null,
      greatTruth: {
        revelationLevel: 0,
        interpretation: 'unknown',
        actualConsequence: 'transformation', // Will be determined by player actions
        contradictions: [],
        playerStance: null,
      },
      orderFactions: initializeOrderFactions(),
      rivalCults: [],
      activeSchisms: [],
    },

    counterOccult: {
      resistanceResearch: initializeResistanceResearch(),
      globalUnity: {
        unityScore: 0,
        alliances: [],
        jointOperations: [],
        victoryPossible: false,
      },
      taskForces: [],
      sanityRestoration: [],
      exorcismOps: [],
    },

    endgame: {
      campaignState: {
        era: 'modern',
        investigatorTraits: [],
        historicalEvents: [],
        majorChoices: [],
        difficulty: 'normal',
      },
      availableVictories: [],
      achievedVictory: null,
      analytics: null,
      legacyPerks: [],
    },

    generator: {
      seed: seed || generateSeed(),
      era: 'modern',
      randomization: {
        investigatorLeadership: true,
        startingRegions: true,
        ritualSiteLocations: true,
        eventTiming: true,
        rivalCults: true,
      },
      modifiers: {
        investigatorSpawnRate: 1.0,
        sanityResistance: 1.0,
        corruptionDifficulty: 1.0,
        entityControlDifficulty: 1.0,
      },
      storyBeats: {
        firstManifestation: true,
        greatSchism: true,
        celebrityConvert: true,
        investigatorStrike: true,
        nightmarePlague: true,
      },
    },
  };
}

/**
 * Initialize the three Order factions
 */
function initializeOrderFactions(): OrderFactionState[] {
  return [
    {
      faction: 'purists',
      name: 'The Purists',
      description: 'Traditional cultists who follow ancient rituals and reject modern methods',
      power: 33,
      leader: {
        id: 'faction_leader_purist',
        name: 'Elder Silas Ravencroft',
        title: 'Keeper of the Old Ways',
        personality: 'Stern, dogmatic, obsessed with tradition',
        secretAgenda: 'Believes only pure bloodlines should lead the Order',
      },
      agenda: 'Maintain ritual purity and ancient traditions',
      playerRelation: 0,
    },
    {
      faction: 'progressives',
      name: 'The Progressives',
      description: 'Modern cultists who embrace technology and contemporary methods',
      power: 33,
      leader: {
        id: 'faction_leader_progressive',
        name: 'Dr. Victoria Chen',
        title: 'Herald of the New Age',
        personality: 'Ambitious, innovative, pragmatic',
        secretAgenda: 'Seeks to merge eldritch power with artificial intelligence',
      },
      agenda: 'Modernize the Order and use technology to spread influence',
      playerRelation: 0,
    },
    {
      faction: 'transcendents',
      name: 'The Transcendents',
      description: 'Mystics who seek personal godhood through eldritch transformation',
      power: 34,
      leader: {
        id: 'faction_leader_transcendent',
        name: 'Azrael Darkwater',
        title: 'The Ascended One',
        personality: 'Charismatic, visionary, potentially mad',
        secretAgenda: 'Plans to consume the other factions to achieve apotheosis',
      },
      agenda: 'Transcend humanity and become like the Great Old Ones',
      playerRelation: 0,
    },
  ];
}

/**
 * Initialize resistance research paths
 */
function initializeResistanceResearch(): ResistanceResearch[] {
  return [
    {
      path: 'occult_defense',
      name: 'Occult Defense',
      description: 'Wards and protective circles to block eldritch influence',
      progress: 0,
      unlockedTech: [],
      effectivenessAgainstOrder: 0,
    },
    {
      path: 'psychic_shielding',
      name: 'Psychic Shielding',
      description: 'Mental training and devices to resist madness',
      progress: 0,
      unlockedTech: [],
      effectivenessAgainstOrder: 0,
    },
    {
      path: 'counter_rituals',
      name: 'Counter-Rituals',
      description: 'Banishment rites and entity binding techniques',
      progress: 0,
      unlockedTech: [],
      effectivenessAgainstOrder: 0,
    },
    {
      path: 'artifact_weapons',
      name: 'Artifact Weapons',
      description: 'Elder Signs, blessed relics, and reality-stabilizing tools',
      progress: 0,
      unlockedTech: [],
      effectivenessAgainstOrder: 0,
    },
    {
      path: 'reality_anchors',
      name: 'Reality Anchors',
      description: 'Devices that reinforce normal physics and prevent manifestations',
      progress: 0,
      unlockedTech: [],
      effectivenessAgainstOrder: 0,
    },
  ];
}

/**
 * Generate a random seed for campaign
 */
function generateSeed(): string {
  return Math.random().toString(36).substring(2, 15);
}
