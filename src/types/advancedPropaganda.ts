/**
 * Advanced Propaganda Systems
 * Includes useful idiots, phobia weaponization, and religious/ideological warfare
 */

import { IdeologyType } from './ideology';

// ============================================================================
// USEFUL IDIOTS SYSTEM
// ============================================================================

/**
 * Types of useful idiots that can be recruited
 */
export type UsefulIdiotType =
  | 'academic'           // University professors, intellectuals
  | 'journalist'         // Media personalities, reporters
  | 'politician'         // Local politicians, activists
  | 'celebrity'          // Entertainers, influencers
  | 'business_leader'    // CEOs, industry leaders
  | 'religious_leader'   // Clergy, spiritual guides
  | 'influencer';        // Social media personalities

/**
 * Recruitment status of a useful idiot
 */
export type RecruitmentStatus =
  | 'identified'         // Target identified but not yet recruited
  | 'courting'          // Recruitment in progress
  | 'active'            // Actively spreading propaganda
  | 'compromised'       // Cover blown, usefulness degraded
  | 'burned';           // Publicly exposed, no longer useful

/**
 * A useful idiot - someone unwittingly spreading your propaganda
 */
export interface UsefulIdiot {
  id: string;
  name: string;                      // Generated name for narrative
  type: UsefulIdiotType;
  nation: string;                    // Nation they belong to
  recruiterNation: string;           // Nation that recruited them

  // Effectiveness metrics
  influence: number;                 // 0-100, how many people they can reach
  credibility: number;               // 0-100, how much they're trusted
  ideologicalAlignment: number;      // 0-100, how aligned with your ideology

  // Operational metrics
  status: RecruitmentStatus;
  turnsActive: number;
  totalPropagandaValue: number;      // Accumulated influence

  // Risk metrics
  suspicionLevel: number;            // 0-100, likelihood of exposure
  exposureRisk: number;              // 0-100, per-turn exposure chance

  // Maintenance
  intelCostPerTurn: number;          // Cost to maintain
  lastActionTurn: number;

  // Narrative
  coverStory?: string;
  exposureNarrative?: string;
}

/**
 * Actions that can be performed with useful idiots
 */
export type UsefulIdiotAction =
  | 'recruit'            // Begin recruitment
  | 'activate'           // Put to work spreading propaganda
  | 'amplify'            // Increase their reach (costs more intel)
  | 'protect'            // Reduce exposure risk
  | 'burn'              // Deliberately expose them for maximum impact
  | 'extract';          // Remove them from operation

/**
 * Recruitment operation
 */
export interface RecruitmentOperation {
  id: string;
  targetType: UsefulIdiotType;
  targetNation: string;
  recruiterNation: string;
  intelInvestment: number;
  turnsRemaining: number;
  successChance: number;
  discovered: boolean;
  startedAt: number;
}

// ============================================================================
// PHOBIA-BASED PROPAGANDA
// ============================================================================

/**
 * Types of phobias that can be weaponized
 */
export type PhobiaType =
  | 'xenophobia'         // Fear of foreigners/outsiders
  | 'technophobia'       // Fear of technology/AI
  | 'economic_anxiety'   // Fear of economic collapse
  | 'existential_dread'  // Fear of meaninglessness/doom
  | 'enemy_fear'         // Fear of specific enemy nation
  | 'cultural_erasure'   // Fear of losing cultural identity
  | 'surveillance_fear'  // Fear of being watched/controlled
  | 'apocalypse_fear';   // Fear of end times/nuclear war

/**
 * Intensity level of phobia campaign
 */
export type PhobiaIntensity =
  | 'subtle'             // Gradual, hard to detect
  | 'moderate'           // Noticeable but plausible
  | 'aggressive'         // Obvious but effective
  | 'panic';            // All-out fear mongering

/**
 * A phobia-based propaganda campaign
 */
export interface PhobiaCampaign {
  id: string;
  type: PhobiaType;
  sourceNation: string;
  targetNation: string;

  // Campaign parameters
  intensity: PhobiaIntensity;
  intelCostPerTurn: number;
  turnsActive: number;
  totalDuration: number;

  // Effects
  currentPhobiaLevel: number;        // 0-100, how afraid population is
  spreadRate: number;                // How quickly fear spreads

  // Targets
  targetPopGroups?: string[];        // Specific pop groups to target
  targetIdeologies?: IdeologyType[]; // Specific ideologies to target

  // Consequences
  paranoia: number;                  // 0-100, irrational fear level
  radicalizedPops: number;           // Pops pushed to extremes
  violentIncidents: number;          // Hate crimes, attacks

  // Detection
  discovered: boolean;
  discoveryTurn?: number;
  exposureNarrative?: string;

  // Metadata
  startedAt: number;
  lastUpdated: number;
}

/**
 * Effects of phobia on a nation
 */
export interface PhobiaEffects {
  nation: string;
  activePhobias: Map<PhobiaType, number>; // Type -> intensity (0-100)

  // Consequences
  stabilityPenalty: number;          // Reduced stability
  productionPenalty: number;         // Reduced efficiency due to fear
  immigrationPenalty: number;        // People afraid to move
  diplomaticPenalty: number;         // Harder to make friends

  // Benefits (to attacker)
  manipulationBonus: number;         // Easier to manipulate afraid people
  recruitmentBonus: number;          // Easier to recruit useful idiots
}

// ============================================================================
// RELIGIOUS/IDEOLOGICAL WEAPONIZATION
// ============================================================================

/**
 * Types of religious/ideological weapons
 */
export type ReligiousWeaponType =
  | 'holy_war'           // Religious justification for conflict
  | 'heresy_accusation'  // Label enemies as heretics
  | 'prophetic_narrative' // Claim divine destiny/prophecy
  | 'martyrdom_cult'     // Glorify sacrifice for the cause
  | 'sacred_mission'     // Frame war as religious duty
  | 'apocalyptic_theology' // End-times narrative
  | 'ideological_purity'  // Demand absolute adherence
  | 'enemy_demonization'; // Paint enemy as evil incarnate

/**
 * Religious/ideological weapon operation
 */
export interface ReligiousWeapon {
  id: string;
  type: ReligiousWeaponType;
  sourceNation: string;
  targetNations: string[];           // Can target multiple nations

  // Power metrics
  fervor: number;                    // 0-100, intensity of belief
  reach: number;                     // 0-100, how many affected
  conviction: number;                // 0-100, strength of belief

  // Campaign parameters
  intelCostPerTurn: number;
  turnsActive: number;

  // Effects on source nation
  populationMoraleBonus: number;     // Population more willing to fight
  unitCombatBonus: number;           // Units fight harder
  productionBonus: number;           // People work harder for "the cause"
  stabilityBonus: number;            // United by belief

  // Effects on target nations
  destabilizationEffect: number;     // Destabilize enemy
  ideologicalConversion: number;     // Convert enemy pops
  resistanceMovements: number;       // Spawn internal resistance

  // Risks
  backlashRisk: number;              // 0-100, chance of backfire
  extremismRisk: number;             // 0-100, chance of creating extremists

  // Compatibility
  compatibleIdeologies: IdeologyType[];
  incompatibleIdeologies: IdeologyType[];

  // Metadata
  startedAt: number;
  lastUpdated: number;
}

/**
 * Religious warfare state for a nation
 */
export interface ReligiousWarfareState {
  nation: string;

  // Active operations
  activeWeapons: ReligiousWeapon[];

  // Defensive posture
  religiousDefense: number;          // 0-100, resistance to religious propaganda
  secularization: number;            // 0-100, how secular the society is

  // Population effects
  religiousFervor: number;           // 0-100, population religious intensity
  ideologicalZealotry: number;       // 0-100, extremism level

  // Consequences
  internalExtremists: number;        // Number of radicalized citizens
  violentExtremism: boolean;         // Has violence occurred?
  religiousSchisms: number;          // Internal religious conflicts
}

// ============================================================================
// INTEGRATED PROPAGANDA OPERATIONS
// ============================================================================

/**
 * Combined propaganda operation using multiple techniques
 */
export interface IntegratedPropagandaOperation {
  id: string;
  name: string;
  sourceNation: string;
  targetNation: string;

  // Components
  usefulIdiots: UsefulIdiot[];
  phobiaCampaigns: PhobiaCampaign[];
  religiousWeapons: ReligiousWeapon[];

  // Coordination bonus
  synergyBonus: number;              // 0-50, bonus from combining tactics

  // Overall effectiveness
  totalEffectiveness: number;        // 0-100
  totalIntelCost: number;

  // Operation timeline
  startedAt: number;
  estimatedCompletionTurn: number;

  // Strategic objectives
  objectives: PropagandaObjective[];
  completedObjectives: string[];
}

/**
 * Strategic objective for propaganda operations
 */
export interface PropagandaObjective {
  id: string;
  type: 'destabilize' | 'convert' | 'paralyze' | 'radicalize' | 'divide';
  description: string;
  targetMetric: string;              // e.g., "stability < 30"
  completed: boolean;
  reward?: PropagandaReward;
}

/**
 * Rewards for successful propaganda operations
 */
export interface PropagandaReward {
  culturalPowerGain?: number;
  intelGain?: number;
  relationshipChange?: number;
  populationDefection?: number;      // Pops that defect to your nation
  ideologicalConversion?: boolean;   // Target changes ideology
}

// ============================================================================
// ADVANCED PROPAGANDA MANAGER STATE
// ============================================================================

/**
 * Overall state of advanced propaganda systems
 */
export interface AdvancedPropagandaState {
  // All active operations
  usefulIdiots: UsefulIdiot[];
  recruitmentOperations: RecruitmentOperation[];
  phobiaCampaigns: PhobiaCampaign[];
  religiousWeapons: ReligiousWeapon[];
  integratedOperations: IntegratedPropagandaOperation[];

  // Per-nation effects
  phobiaEffects: Map<string, PhobiaEffects>;
  religiousWarfareStates: Map<string, ReligiousWarfareState>;

  // Statistics
  totalIntelSpent: number;
  totalOperationsCompleted: number;
  totalUsefulIdiotsRecruited: number;
  totalExposures: number;
}

// ============================================================================
// CONSTANTS AND CONFIGURATION
// ============================================================================

/**
 * Configuration for useful idiots system
 */
export const USEFUL_IDIOT_CONFIG = {
  RECRUITMENT_BASE_COST: 50,         // Base intel cost to recruit
  MAINTENANCE_COST_MULTIPLIER: 0.1,  // % of influence as upkeep
  BASE_EXPOSURE_RISK: 5,             // Base % per turn
  INFLUENCE_DECAY_RATE: 2,           // Loss per turn if inactive

  TYPE_BONUSES: {
    academic: { credibility: 85, influence: 60, cost: 70 },
    journalist: { credibility: 70, influence: 80, cost: 60 },
    politician: { credibility: 50, influence: 90, cost: 80 },
    celebrity: { credibility: 40, influence: 95, cost: 75 },
    business_leader: { credibility: 75, influence: 70, cost: 85 },
    religious_leader: { credibility: 80, influence: 85, cost: 90 },
    influencer: { credibility: 35, influence: 85, cost: 50 },
  },
};

/**
 * Configuration for phobia campaigns
 */
export const PHOBIA_CAMPAIGN_CONFIG = {
  INTENSITY_COSTS: {
    subtle: 20,
    moderate: 40,
    aggressive: 70,
    panic: 120,
  },

  DETECTION_RISKS: {
    subtle: 5,
    moderate: 15,
    aggressive: 35,
    panic: 60,
  },

  SPREAD_RATES: {
    subtle: 3,
    moderate: 7,
    aggressive: 15,
    panic: 30,
  },

  EFFECTS_MULTIPLIER: {
    xenophobia: { stability: -1.5, diplomacy: -2.0 },
    technophobia: { production: -1.0, research: -1.5 },
    economic_anxiety: { production: -1.5, stability: -1.0 },
    existential_dread: { morale: -2.0, stability: -1.0 },
    enemy_fear: { morale: -1.0, militancy: 1.5 },
    cultural_erasure: { cultural_defense: 2.0, stability: -1.0 },
    surveillance_fear: { intel: -1.0, stability: -0.5 },
    apocalypse_fear: { morale: -2.5, production: -1.0 },
  },
};

/**
 * Configuration for religious weapons
 */
export const RELIGIOUS_WEAPON_CONFIG = {
  BASE_COSTS: {
    holy_war: 100,
    heresy_accusation: 60,
    prophetic_narrative: 80,
    martyrdom_cult: 90,
    sacred_mission: 70,
    apocalyptic_theology: 110,
    ideological_purity: 85,
    enemy_demonization: 50,
  },

  FERVOR_BONUSES: {
    holy_war: { morale: 15, combat: 20, stability: 10 },
    heresy_accusation: { target_stability: -20, conviction: 15 },
    prophetic_narrative: { morale: 20, production: 10 },
    martyrdom_cult: { combat: 30, morale: -10 },
    sacred_mission: { morale: 15, production: 15 },
    apocalyptic_theology: { morale: 25, extremism_risk: 40 },
    ideological_purity: { stability: 20, extremism_risk: 30 },
    enemy_demonization: { combat: 15, diplomacy: -25 },
  },

  IDEOLOGY_COMPATIBILITY: {
    holy_war: ['theocracy', 'authoritarianism'],
    heresy_accusation: ['theocracy'],
    prophetic_narrative: ['theocracy', 'authoritarianism'],
    martyrdom_cult: ['theocracy', 'communism'],
    sacred_mission: ['theocracy', 'authoritarianism', 'democracy'],
    apocalyptic_theology: ['theocracy'],
    ideological_purity: ['communism', 'authoritarianism', 'theocracy'],
    enemy_demonization: ['authoritarianism', 'theocracy', 'communism'],
  },
};
