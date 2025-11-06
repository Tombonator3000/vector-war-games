/**
 * Hearts of Iron IV Phase 4: Advanced Features
 *
 * This phase implements:
 * 1. Intelligence Agency Operations (expanded spy mechanics)
 * 2. Resistance & Occupation System
 * 3. Enhanced Peace Conference System
 */

import type { Nation } from './game';
import type { SpyAgent, SpyMission, SpyMissionType } from './spySystem';
import type { ContinentId } from './territory';

// ============================================================================
// INTELLIGENCE AGENCY OPERATIONS
// ============================================================================

/**
 * Intelligence Agency - National spy headquarters
 */
export interface IntelligenceAgency {
  nationId: string;
  level: AgencyLevel;
  experience: number; // 0-100 per level

  // Agency capabilities
  capabilities: AgencyCapabilities;

  // Active upgrades
  upgrades: AgencyUpgrade[];

  // Operatives capacity
  maxOperatives: number;
  activeOperatives: number;

  // Agency resources
  cryptology: number; // Used for codebreaking
  infiltration: number; // Used for deep cover ops

  // Agency reputation
  reputation: AgencyReputation;

  // Ongoing operations
  activeOperations: IntelOperation[];
  completedOperations: CompletedIntelOperation[];
}

/**
 * Agency levels (unlock new operation types)
 */
export type AgencyLevel = 1 | 2 | 3 | 4 | 5;

/**
 * Agency capabilities (improved through operations)
 */
export interface AgencyCapabilities {
  cryptology: number; // 0-100, codebreaking ability
  infiltration: number; // 0-100, deep cover ability
  counterIntelligence: number; // 0-100, spy catching
  propaganda: number; // 0-100, influence operations
  sabotage: number; // 0-100, covert action
}

/**
 * Agency upgrades (permanent bonuses)
 */
export interface AgencyUpgrade {
  id: string;
  name: string;
  description: string;
  category: 'operatives' | 'operations' | 'cryptology' | 'infiltration';

  // Costs
  ppCost: number; // Political power cost
  intelCost: number;

  // Effects
  effects: AgencyUpgradeEffect[];

  // Requirements
  requiredLevel: AgencyLevel;
  prerequisites: string[]; // Other upgrade IDs
}

export interface AgencyUpgradeEffect {
  type: 'max_operatives' | 'operation_success' | 'detection_reduction' |
        'cryptology_bonus' | 'infiltration_bonus' | 'cost_reduction';
  value: number;
}

/**
 * Agency reputation (affects AI behavior)
 */
export type AgencyReputation =
  | 'unknown' // Not active in espionage
  | 'developing' // Building capabilities
  | 'competent' // Standard spy network
  | 'formidable' // Feared by rivals
  | 'legendary'; // Best in the world

/**
 * Intelligence operations (HoI4-style)
 */
export interface IntelOperation {
  id: string;
  type: IntelOperationType;
  agencyId: string;
  targetNationId: string;

  // Assigned operatives
  assignedOperatives: string[]; // Spy IDs

  // Operation details
  startedTurn: number;
  duration: number; // Turns to complete
  progress: number; // 0-100

  // Success calculation
  baseSuccessChance: number;
  modifiedSuccessChance: number;
  detectionRisk: number;

  // Costs
  intelCost: number;
  ppCost?: number;

  // Status
  status: 'preparing' | 'in_progress' | 'completed' | 'failed' | 'discovered';

  // Results
  result?: IntelOperationResult;
}

/**
 * Intelligence operation types
 */
export type IntelOperationType =
  // Cryptology Operations
  | 'steal_cipher' // Steal enemy encryption keys
  | 'decipher_communications' // Read enemy messages
  | 'plant_false_intel' // Feed false information

  // Infiltration Operations
  | 'infiltrate_government' // Place deep cover agent
  | 'infiltrate_military' // Infiltrate armed forces
  | 'infiltrate_civilian' // Infiltrate population

  // Sabotage Operations
  | 'targeted_sabotage' // Destroy specific target
  | 'heavy_sabotage' // Major infrastructure damage
  | 'collaboration_government' // Create puppet regime

  // Network Operations
  | 'root_out_resistance' // Suppress occupied territory resistance
  | 'boost_resistance' // Aid resistance in enemy territory
  | 'boost_ideology' // Spread your ideology

  // Covert Operations
  | 'coup_government' // Overthrow government
  | 'steal_blueprints' // Steal research
  | 'capture_operative' // Kidnap enemy spy;

/**
 * Operation result
 */
export interface IntelOperationResult {
  success: boolean;
  discovered: boolean;
  operativesCaptured: string[]; // Spy IDs
  operativesKilled: string[]; // Spy IDs

  // Effects
  effects: IntelOperationEffect[];

  // Narrative
  description: string;
}

export interface IntelOperationEffect {
  type: 'research_stolen' | 'production_damage' | 'resistance_change' |
        'ideology_shift' | 'government_change' | 'cipher_obtained' | 'intel_gained';
  value: number | string;
  targetId?: string;
}

/**
 * Completed operation record
 */
export interface CompletedIntelOperation {
  operationId: string;
  type: IntelOperationType;
  targetNationId: string;
  completedTurn: number;
  success: boolean;
  discoveredBy: string | null;
}

// ============================================================================
// RESISTANCE & OCCUPATION SYSTEM
// ============================================================================

/**
 * Occupied territory state
 */
export interface OccupiedTerritory {
  territoryId: string; // Nation ID or continent ID being occupied
  occupierId: string; // Nation controlling the territory
  formerOwnerId: string; // Original owner
  occupiedSince: number; // Turn when occupation began

  // Resistance mechanics
  resistance: ResistanceState;

  // Garrison
  garrison: GarrisonState;

  // Occupation policy
  policy: OccupationPolicy;

  // Resource extraction
  resourceExtraction: ResourceExtraction;

  // Status
  status: OccupationStatus;
}

/**
 * Resistance state in occupied territory
 */
export interface ResistanceState {
  level: number; // 0-100, how organized is resistance
  compliance: number; // 0-100, how accepting is population

  // Resistance activities
  activity: ResistanceActivity[];

  // Resistance growth rate
  growthRate: number; // Per turn

  // Support from outside
  foreignSupport: ForeignResistanceSupport[];

  // Resistance capabilities
  strength: number; // Military capability
  organization: number; // Coordination level
}

/**
 * Resistance activities
 */
export type ResistanceActivity =
  | 'sabotage' // Damage infrastructure
  | 'assassination' // Kill collaborators/occupiers
  | 'propaganda' // Spread anti-occupation messages
  | 'intel_gathering' // Spy on occupiers
  | 'armed_uprising'; // Open rebellion

/**
 * Foreign support for resistance
 */
export interface ForeignResistanceSupport {
  supportingNationId: string;
  type: 'weapons' | 'training' | 'intel' | 'funding';
  amountPerTurn: number;
  discovered: boolean; // Has occupier discovered this?
}

/**
 * Garrison state
 */
export interface GarrisonState {
  // Units assigned
  assignedUnits: string[]; // Conventional unit IDs

  // Garrison strength
  totalStrength: number;
  requiredStrength: number; // Based on resistance & policy

  // Effectiveness
  suppressionEffectiveness: number; // 0-100

  // Morale
  garrisonMorale: number; // 0-100, affects effectiveness
}

/**
 * Occupation policy
 */
export interface OccupationPolicy {
  type: OccupationPolicyType;

  // Effects
  resistanceImpact: number; // How much resistance grows per turn
  complianceGain: number; // How much compliance grows per turn
  resourcePenalty: number; // 0-1, efficiency of resource extraction
  garrisonRequirement: number; // Multiplier for garrison needs

  // Diplomatic consequences
  relationshipPenalty: number; // Global reputation hit
  grievanceGeneration: number; // Grievances generated per turn

  // Special effects
  allowRecruitment: boolean; // Can recruit local units
  allowProduction: boolean; // Can use local production
}

/**
 * Occupation policy types
 */
export type OccupationPolicyType =
  | 'lenient' // Light occupation, high freedom
  | 'moderate' // Balanced approach
  | 'harsh' // Strict control, low freedom
  | 'brutal' // Total suppression
  | 'liberation' // Portrayed as liberators
  | 'autonomy'; // Grant autonomy

/**
 * Resource extraction from occupied territory
 */
export interface ResourceExtraction {
  production: number; // Per turn
  uranium: number; // Per turn
  intel: number; // Per turn

  // Efficiency (affected by resistance and policy)
  efficiency: number; // 0-1 multiplier

  // Resistance interference
  sabotageLevel: number; // 0-100, reduces efficiency
}

/**
 * Occupation status
 */
export type OccupationStatus =
  | 'stable' // Low resistance, high compliance
  | 'tense' // Moderate resistance
  | 'unstable' // High resistance, low compliance
  | 'uprising' // Active rebellion
  | 'liberated'; // Resistance won

/**
 * Uprising event
 */
export interface UprisingEvent {
  id: string;
  territoryId: string;
  turn: number;

  // Forces
  resistanceStrength: number;
  garrisonStrength: number;

  // Outcome
  outcome: 'suppressed' | 'ongoing' | 'successful';

  // Casualties
  resistanceCasualties: number;
  garrisonCasualties: number;
  civilianCasualties: number;

  // Consequences
  resistanceChange: number;
  complianceChange: number;
  internationalReaction: number; // Diplomatic penalty
}

// ============================================================================
// ENHANCED PEACE CONFERENCE SYSTEM
// ============================================================================

/**
 * Enhanced peace conference with war contribution tracking
 */
export interface EnhancedPeaceConference {
  id: string;
  name: string;
  convenedBy: string;
  convenedTurn: number;

  // War context
  warIds: string[];

  // Participants with contribution scores
  participants: PeaceConferenceParticipant[];

  // Conference mechanics
  warscorePool: Record<string, number>; // Nation ID -> warscore points
  currentRound: number;
  maxRounds: number;

  // Demands and bids
  demands: PeaceDemand[];
  demandHistory: PeaceDemand[];

  // Status
  status: ConferenceStatus;

  // Results
  finalTreaty?: PeaceTreaty;
}

/**
 * Peace conference participant with war contribution
 */
export interface PeaceConferenceParticipant {
  nationId: string;
  side: 'victor' | 'defeated' | 'mediator' | 'guarantor';

  // War contribution
  warContribution: WarContribution;

  // Warscore
  totalWarscore: number; // Points to spend on demands
  remainingWarscore: number; // Points left

  // Objectives
  primaryObjectives: string[];
  redLines: string[];

  // Diplomacy
  votingPower: number;
  walkoutRisk: number; // 0-100
  attended: boolean;
}

/**
 * War contribution (determines warscore)
 */
export interface WarContribution {
  // Military actions
  territoriesCaptured: number;
  enemyCasualtiesInflicted: number;
  battlesWon: number;

  // Support actions
  lendLeaseProvided: number;
  allianceSupport: number;

  // Time investment
  turnsInWar: number;

  // Losses
  territoriesLost: number;
  casualtiesSuffered: number;

  // Calculated score
  contributionScore: number; // Total calculated contribution
}

/**
 * Peace demand (HoI4-style)
 */
export interface PeaceDemand {
  id: string;
  demandingNation: string;
  demandType: PeaceDemandType;
  target: string; // Nation or territory ID

  // Cost in warscore
  warscoreCost: number;

  // Specifics
  details: PeaceDemandDetails;

  // Support/Opposition
  supporters: string[];
  opponents: string[];

  // Status
  status: 'proposed' | 'contested' | 'accepted' | 'rejected';

  // Justification
  justification: string;
}

/**
 * Peace demand types
 */
export type PeaceDemandType =
  | 'annex_territory' // Take full control
  | 'puppet_state' // Create puppet
  | 'disarmament' // Force military reduction
  | 'reparations' // Resource payments
  | 'regime_change' // Change government
  | 'demilitarized_zone' // Ban military in region
  | 'return_territory' // Give back captured land
  | 'war_crimes_trial' // Punish leaders
  | 'technology_transfer' // Force tech sharing
  | 'base_rights'; // Military base access

/**
 * Demand details (specific to type)
 */
export interface PeaceDemandDetails {
  // Territory demands
  territoryIds?: string[];

  // Disarmament
  militaryReduction?: {
    missiles: number;
    conventionalUnits: number;
    warheads: Record<number, number>;
  };

  // Reparations
  reparations?: {
    production: number;
    uranium: number;
    gold: number;
    duration: number; // Turns
  };

  // Regime change
  newLeader?: string;
  newIdeology?: string;

  // Demilitarized zone
  dmzTerritories?: string[];

  // Technology
  researchIds?: string[];

  // Base rights
  baseLocations?: string[];
  baseDuration?: number;
}

/**
 * Conference status
 */
export type ConferenceStatus =
  | 'assembling' // Gathering participants
  | 'negotiating' // Active negotiations
  | 'voting' // Voting on proposals
  | 'concluded' // Successfully concluded
  | 'collapsed' // Failed to reach agreement
  | 'deadlocked'; // Stalemate

/**
 * Peace treaty
 */
export interface PeaceTreaty {
  id: string;
  conferenceId: string;
  name: string;
  signedTurn: number;

  // Parties
  signatories: string[];
  guarantors: string[];

  // Terms (accepted demands)
  terms: PeaceDemand[];

  // Duration and compliance
  duration: number;
  expiryTurn: number;
  compliance: Record<string, number>; // Nation ID -> compliance level

  // Violations
  violations: TreatyViolation[];

  // Status
  status: TreatyStatus;
}

/**
 * Treaty violation
 */
export interface TreatyViolation {
  violatorId: string;
  termViolated: number; // Index in terms array
  violationTurn: number;
  description: string;
  severity: 'minor' | 'major' | 'complete_breach';

  // Consequences
  guarantorResponse?: GuarantorResponse;
}

/**
 * Guarantor response to violation
 */
export interface GuarantorResponse {
  guarantorId: string;
  responseType: 'warning' | 'sanctions' | 'military_intervention' | 'none';
  relationshipPenalty: number;
  description: string;
}

/**
 * Treaty status
 */
export type TreatyStatus =
  | 'active' // Treaty in effect
  | 'fulfilled' // All terms completed
  | 'violated' // Major violation occurred
  | 'expired' // Time expired
  | 'nullified'; // Cancelled

// ============================================================================
// OCCUPATION POLICY DEFINITIONS
// ============================================================================

/**
 * Available occupation policies with balanced stats
 */
export const OCCUPATION_POLICIES: Record<OccupationPolicyType, OccupationPolicy> = {
  lenient: {
    type: 'lenient',
    resistanceImpact: 1, // Very low resistance growth
    complianceGain: 3, // High compliance gain
    resourcePenalty: 0.5, // Only 50% efficiency
    garrisonRequirement: 1.5, // Need 50% more troops
    relationshipPenalty: -5, // Minimal diplomatic penalty
    grievanceGeneration: 2,
    allowRecruitment: true,
    allowProduction: true,
  },
  moderate: {
    type: 'moderate',
    resistanceImpact: 2,
    complianceGain: 2,
    resourcePenalty: 0.7,
    garrisonRequirement: 1.0,
    relationshipPenalty: -10,
    grievanceGeneration: 5,
    allowRecruitment: true,
    allowProduction: true,
  },
  harsh: {
    type: 'harsh',
    resistanceImpact: 4,
    complianceGain: 0.5,
    resourcePenalty: 0.85,
    garrisonRequirement: 0.75,
    relationshipPenalty: -25,
    grievanceGeneration: 15,
    allowRecruitment: false,
    allowProduction: true,
  },
  brutal: {
    type: 'brutal',
    resistanceImpact: 6,
    complianceGain: 0,
    resourcePenalty: 0.95,
    garrisonRequirement: 0.5,
    relationshipPenalty: -50,
    grievanceGeneration: 30,
    allowRecruitment: false,
    allowProduction: true,
  },
  liberation: {
    type: 'liberation',
    resistanceImpact: -2, // Actually reduces resistance
    complianceGain: 4,
    resourcePenalty: 0.3, // Very low extraction
    garrisonRequirement: 0.8,
    relationshipPenalty: 0, // No penalty, possible bonus
    grievanceGeneration: 0,
    allowRecruitment: true,
    allowProduction: false, // Don't exploit liberated people
  },
  autonomy: {
    type: 'autonomy',
    resistanceImpact: -1,
    complianceGain: 5,
    resourcePenalty: 0.4,
    garrisonRequirement: 0.6,
    relationshipPenalty: 5, // Actually improves relations
    grievanceGeneration: 0,
    allowRecruitment: true,
    allowProduction: false,
  },
};

// ============================================================================
// AGENCY UPGRADE CATALOG
// ============================================================================

/**
 * Available intelligence agency upgrades
 */
export const AGENCY_UPGRADES: Record<string, AgencyUpgrade> = {
  // Level 1 upgrades
  expanded_network: {
    id: 'expanded_network',
    name: 'Expanded Operative Network',
    description: 'Recruit more operatives for your agency',
    category: 'operatives',
    ppCost: 50,
    intelCost: 30,
    effects: [{ type: 'max_operatives', value: 2 }],
    requiredLevel: 1,
    prerequisites: [],
  },
  basic_cryptology: {
    id: 'basic_cryptology',
    name: 'Basic Cryptology',
    description: 'Improve codebreaking capabilities',
    category: 'cryptology',
    ppCost: 40,
    intelCost: 25,
    effects: [{ type: 'cryptology_bonus', value: 10 }],
    requiredLevel: 1,
    prerequisites: [],
  },

  // Level 2 upgrades
  advanced_training: {
    id: 'advanced_training',
    name: 'Advanced Operative Training',
    description: 'Increase success rate of operations',
    category: 'operations',
    ppCost: 75,
    intelCost: 40,
    effects: [{ type: 'operation_success', value: 10 }],
    requiredLevel: 2,
    prerequisites: ['expanded_network'],
  },
  counterintelligence_school: {
    id: 'counterintelligence_school',
    name: 'Counterintelligence School',
    description: 'Train agents to catch enemy spies',
    category: 'operations',
    ppCost: 60,
    intelCost: 35,
    effects: [{ type: 'detection_reduction', value: 15 }],
    requiredLevel: 2,
    prerequisites: [],
  },

  // Level 3 upgrades
  master_cryptanalysts: {
    id: 'master_cryptanalysts',
    name: 'Master Cryptanalysts',
    description: 'Elite codebreakers',
    category: 'cryptology',
    ppCost: 100,
    intelCost: 60,
    effects: [{ type: 'cryptology_bonus', value: 25 }],
    requiredLevel: 3,
    prerequisites: ['basic_cryptology'],
  },
  deep_cover_specialists: {
    id: 'deep_cover_specialists',
    name: 'Deep Cover Specialists',
    description: 'Agents who can infiltrate governments',
    category: 'infiltration',
    ppCost: 120,
    intelCost: 70,
    effects: [
      { type: 'infiltration_bonus', value: 30 },
      { type: 'max_operatives', value: 1 }
    ],
    requiredLevel: 3,
    prerequisites: ['advanced_training'],
  },

  // Level 4 upgrades
  covert_operations_division: {
    id: 'covert_operations_division',
    name: 'Covert Operations Division',
    description: 'Specialized unit for high-risk operations',
    category: 'operations',
    ppCost: 150,
    intelCost: 90,
    effects: [
      { type: 'operation_success', value: 15 },
      { type: 'cost_reduction', value: 20 }
    ],
    requiredLevel: 4,
    prerequisites: ['deep_cover_specialists'],
  },

  // Level 5 upgrades
  legendary_spymaster: {
    id: 'legendary_spymaster',
    name: 'Legendary Spymaster',
    description: 'Your agency becomes the best in the world',
    category: 'operations',
    ppCost: 200,
    intelCost: 120,
    effects: [
      { type: 'max_operatives', value: 3 },
      { type: 'operation_success', value: 20 },
      { type: 'detection_reduction', value: 25 }
    ],
    requiredLevel: 5,
    prerequisites: ['covert_operations_division'],
  },
};

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Phase 4 state container
 */
export interface HeartsOfIronPhase4State {
  // Intelligence agencies by nation
  agencies: Record<string, IntelligenceAgency>;

  // Occupied territories
  occupations: OccupiedTerritory[];

  // Active uprisings
  uprisings: UprisingEvent[];

  // Enhanced peace conferences
  peaceConferences: EnhancedPeaceConference[];

  // Active treaties
  treaties: PeaceTreaty[];
}
