/**
 * Spy System Types
 *
 * Implements an expanded espionage system with:
 * - Individual spy agents with skills and experience
 * - Multiple mission types (tech theft, sabotage, assassination, etc.)
 * - Counterintelligence mechanics (detection, capture, execution)
 * - Diplomatic consequences for caught spies
 * - Integration with cyber warfare, leaders, and council
 */

import type { Nation } from './game';

/**
 * Spy agent representing an individual operative
 */
export interface SpyAgent {
  id: string;
  name: string;                          // Cover name
  realName?: string;                     // Actual name (hidden from target)
  nationId: string;                      // Home nation
  targetNationId: string | null;         // Where currently deployed (null if at home)
  skill: number;                         // 0-100, affects success rate
  experience: number;                    // Total successful missions completed
  cover: SpyCoverType;                   // Agent's cover story
  status: SpyStatus;                     // Current status
  recruitedTurn: number;                 // When recruited
  lastMissionTurn?: number;              // Last mission turn
  currentMission?: SpyMission;           // Active mission
  missionHistory: CompletedMission[];    // Past missions
  discoveryRisk: number;                 // Base risk of being discovered (0-100)
  morale: number;                        // Spy's morale (0-100, affects performance)
  trainingLevel: SpyTrainingLevel;       // Training level
  specializations?: SpySpecialization[]; // Special skills
}

/**
 * Spy status
 */
export type SpyStatus =
  | 'active'        // Active and operational
  | 'training'      // Being trained
  | 'idle'          // Awaiting orders
  | 'on-mission'    // Currently on a mission
  | 'captured'      // Captured by enemy
  | 'eliminated'    // Killed
  | 'retired'       // Retired from service
  | 'double-agent'  // Turned by enemy
  | 'burned';       // Cover blown, no longer effective

/**
 * Cover identities for spies
 */
export type SpyCoverType =
  | 'diplomat'          // Embassy staff
  | 'trader'            // Business person
  | 'refugee'           // Refugee/immigrant
  | 'student'           // Academic exchange
  | 'journalist'        // Press correspondent
  | 'businessman'       // Corporate executive
  | 'tourist'           // Tourist/traveler
  | 'military-attache'  // Military liaison
  | 'scientist'         // Research scientist
  | 'aid-worker';       // Humanitarian worker

/**
 * Spy training levels
 */
export type SpyTrainingLevel =
  | 'recruit'      // Basic training
  | 'operative'    // Standard operative
  | 'agent'        // Experienced agent
  | 'elite'        // Elite operative
  | 'master';      // Master spy

/**
 * Spy specializations
 */
export type SpySpecialization =
  | 'infiltration'      // Better at infiltrating targets
  | 'sabotage'          // Better at sabotage missions
  | 'assassination'     // Better at assassination
  | 'tech-theft'        // Better at stealing technology
  | 'counter-intel'     // Better at counter-intelligence
  | 'cryptography'      // Better at encryption/decryption
  | 'seduction'         // Better at social engineering
  | 'disguise'          // Better at maintaining cover
  | 'combat'            // Better at direct combat
  | 'hacking';          // Better at cyber operations

/**
 * Spy mission types
 */
export type SpyMissionType =
  | 'steal-tech'           // Steal research/technology
  | 'sabotage-production'  // Sabotage production facilities
  | 'sabotage-military'    // Sabotage military assets
  | 'rig-election'         // Influence elections
  | 'sow-dissent'          // Reduce trust with other nations
  | 'assassination'        // Assassinate leader
  | 'gather-intel'         // Gather general intelligence
  | 'counter-intel'        // Hunt enemy spies
  | 'propaganda'           // Spread propaganda
  | 'recruit-asset'        // Recruit local assets
  | 'cyber-assist'         // Assist in cyber operations
  | 'false-flag'           // Frame another nation
  | 'exfiltrate';          // Extract someone/something

/**
 * Active spy mission
 */
export interface SpyMission {
  id: string;
  type: SpyMissionType;
  spyId: string;                         // Spy assigned to mission
  targetNationId: string;                // Target nation
  startTurn: number;                     // When mission started
  duration: number;                      // Expected duration in turns
  completionTurn: number;                // When mission will complete
  status: MissionStatus;                 // Current status
  successChance: number;                 // Calculated success chance (0-100)
  detectionRisk: number;                 // Risk of detection (0-100)
  intelCost: number;                     // Intel cost to launch
  productionCost?: number;               // Production cost (if any)
  requirements?: MissionRequirement[];   // Special requirements
  rewards?: MissionReward;               // Expected rewards
  result?: MissionResult;                // Result after completion
}

/**
 * Mission status
 */
export type MissionStatus =
  | 'planning'      // Being planned
  | 'preparing'     // Preparing to execute
  | 'in-progress'   // Currently executing
  | 'completed'     // Successfully completed
  | 'failed'        // Failed
  | 'discovered'    // Discovered by target
  | 'aborted';      // Aborted

/**
 * Mission requirements
 */
export interface MissionRequirement {
  type: 'skill' | 'specialization' | 'cover' | 'relationship' | 'tech' | 'other';
  value: string | number;
  description: string;
}

/**
 * Mission rewards
 */
export interface MissionReward {
  intelGained?: number;
  techStolen?: string;                   // Research project ID stolen
  productionDamage?: number;             // Production reduced
  moraleImpact?: number;                 // Morale change
  trustImpact?: Record<string, number>;  // Trust changes with nations
  relationshipImpact?: Record<string, number>; // Relationship changes
  leaderAssassinated?: boolean;          // Leader killed
  resourcesStolen?: {
    production?: number;
    uranium?: number;
    intel?: number;
  };
  otherEffects?: string[];               // Other narrative effects
}

/**
 * Mission result after completion
 */
export interface MissionResult {
  success: boolean;                      // Mission succeeded
  discovered: boolean;                   // Spy was discovered
  spyCaught: boolean;                    // Spy was captured
  spyEliminated: boolean;                // Spy was killed
  coverBlown: boolean;                   // Cover identity compromised
  rewards?: MissionReward;               // Actual rewards gained
  narrative?: string;                    // Story/description of outcome
  evidenceLeft?: boolean;                // Evidence linking back to home nation
  witnessesEliminated?: number;          // Witnesses eliminated during mission
  civilianCasualties?: number;           // Civilian casualties
  discoveryDetails?: {                   // Details about how spy was discovered
    howDiscovered: string;
    captureMethod?: string;
    spyFate?: 'executed' | 'imprisoned' | 'exchanged' | 'turned' | 'escaped';
    diplomaticConsequences?: string[];
  };
}

/**
 * Completed mission record
 */
export interface CompletedMission {
  missionId: string;
  type: SpyMissionType;
  targetNationId: string;
  completedTurn: number;
  result: MissionResult;
}

/**
 * Counter-intelligence operation
 */
export interface CounterIntelOperation {
  id: string;
  nationId: string;                      // Nation conducting operation
  targetNationId?: string;               // Specific target (if any)
  startTurn: number;
  duration: number;
  intelCost: number;
  successChance: number;                 // Chance to find spies
  spiesDetected?: string[];              // IDs of detected spies
  status: 'active' | 'completed' | 'failed';
}

/**
 * Diplomatic incident from caught spy
 */
export interface SpyIncident {
  id: string;
  spyId: string;
  spyNationId: string;                   // Nation that owns the spy
  targetNationId: string;                // Nation that caught the spy
  turn: number;
  missionType: SpyMissionType;
  spyFate: 'executed' | 'imprisoned' | 'exchanged' | 'turned' | 'escaped';
  evidenceQuality: 'weak' | 'moderate' | 'strong' | 'conclusive';
  publicized: boolean;                   // Was it made public?
  councilInvolvement?: boolean;          // Did it go to international council?
  resolution?: SpyIncidentResolution;    // How it was resolved
}

/**
 * Resolution of spy incident
 */
export interface SpyIncidentResolution {
  type: 'apology' | 'compensation' | 'sanctions' | 'war' | 'covered-up' | 'ignored';
  relationshipPenalty: number;
  trustPenalty: number;
  reputationPenalty: number;
  compensationPaid?: number;             // DIP or resources paid
  councilSanctions?: boolean;
  narrative?: string;
}

/**
 * Spy network state for a nation
 */
export interface SpyNetworkState {
  spies: SpyAgent[];                     // All spies owned by nation
  activeMissions: SpyMission[];          // Active missions
  completedMissions: CompletedMission[]; // Mission history
  incidents: SpyIncident[];              // Spy incidents
  counterIntelOps: CounterIntelOperation[]; // Active counter-intel ops
  recruitmentCooldown: number;           // Turns until can recruit again
  totalSpiesCaptured: number;            // Lifetime captured spies
  totalSpiesLost: number;                // Lifetime lost spies
  totalSuccessfulMissions: number;       // Lifetime successful missions
  reputation: SpyReputationType;         // Spy network reputation
}

/**
 * Spy network reputation
 */
export type SpyReputationType =
  | 'unknown'          // Not known for espionage
  | 'novice'           // Beginning spy operations
  | 'competent'        // Decent spy network
  | 'professional'     // Professional spy network
  | 'elite'            // Elite spy network
  | 'legendary'        // Legendary spy network
  | 'notorious';       // Known for dirty tricks

/**
 * Spy recruitment options
 */
export interface SpyRecruitmentOptions {
  cover: SpyCoverType;
  targetNation?: string;                 // Pre-assign to target
  specialization?: SpySpecialization;    // Recruit with specialization
  trainingLevel?: SpyTrainingLevel;      // Initial training level
}

/**
 * Costs for spy operations
 */
export const SPY_COSTS = {
  // Recruitment costs (intel + production)
  RECRUIT_BASE: { intel: 40, production: 20 },
  RECRUIT_TRAINED: { intel: 60, production: 35 },
  RECRUIT_ELITE: { intel: 80, production: 50 },

  // Mission costs (intel only, some missions have production costs)
  STEAL_TECH: 50,
  SABOTAGE_PRODUCTION: 40,
  SABOTAGE_MILITARY: 45,
  RIG_ELECTION: 60,
  SOW_DISSENT: 35,
  ASSASSINATION: 80,
  GATHER_INTEL: 25,
  COUNTER_INTEL: 30,
  PROPAGANDA: 30,
  RECRUIT_ASSET: 35,
  CYBER_ASSIST: 40,
  FALSE_FLAG: 70,
  EXFILTRATE: 55,

  // Additional production costs for some missions
  SABOTAGE_PRODUCTION_PROD: 15,
  ASSASSINATION_PROD: 25,

  // Counter-intelligence cost
  COUNTER_INTEL_BASE: 30,
} as const;

/**
 * Mission durations (in turns)
 */
export const MISSION_DURATIONS = {
  STEAL_TECH: 3,
  SABOTAGE_PRODUCTION: 2,
  SABOTAGE_MILITARY: 2,
  RIG_ELECTION: 4,
  SOW_DISSENT: 3,
  ASSASSINATION: 3,
  GATHER_INTEL: 2,
  COUNTER_INTEL: 2,
  PROPAGANDA: 2,
  RECRUIT_ASSET: 3,
  CYBER_ASSIST: 1,
  FALSE_FLAG: 3,
  EXFILTRATE: 2,
} as const;

/**
 * Base detection risks for mission types (before modifiers)
 */
export const BASE_DETECTION_RISKS = {
  STEAL_TECH: 40,
  SABOTAGE_PRODUCTION: 35,
  SABOTAGE_MILITARY: 45,
  RIG_ELECTION: 50,
  SOW_DISSENT: 30,
  ASSASSINATION: 60,
  GATHER_INTEL: 25,
  COUNTER_INTEL: 20,
  PROPAGANDA: 25,
  RECRUIT_ASSET: 35,
  CYBER_ASSIST: 30,
  FALSE_FLAG: 55,
  EXFILTRATE: 40,
} as const;

/**
 * Penalties when spies are caught
 */
export const SPY_CAUGHT_PENALTIES = {
  RELATIONSHIP: -30,        // Relationship penalty
  TRUST: -25,              // Trust penalty
  REPUTATION: -15,         // Global diplomatic reputation penalty
  DIP_COST: 50,            // DIP cost for compensation (if offered)
} as const;

/**
 * Skill progression
 */
export const SKILL_PROGRESSION = {
  EXPERIENCE_PER_MISSION: 10,           // Experience gained per successful mission
  SKILL_GAIN_PER_MISSION: 5,            // Skill points gained per mission
  TRAINING_LEVELS: {
    recruit: 0,      // 0-30 skill
    operative: 30,   // 30-50 skill
    agent: 50,       // 50-70 skill
    elite: 70,       // 70-85 skill
    master: 85,      // 85-100 skill
  }
} as const;

/**
 * Counterintelligence effectiveness
 */
export const COUNTER_INTEL_EFFECTIVENESS = {
  BASE_DETECTION_CHANCE: 30,            // Base chance to detect spies
  PER_SPY_DETECTION_ROLL: 0.15,        // Chance to detect each spy
  CYBER_DEFENSE_MODIFIER: 0.3,         // Cyber defense bonus
  LEADER_ABILITY_MODIFIER: 0.2,        // Leader ability bonus
} as const;
