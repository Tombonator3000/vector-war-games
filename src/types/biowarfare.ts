/**
 * Bio-warfare types and definitions
 * Inspired by Plague Inc gameplay mechanics
 */

import type { CountryInfectionState, DeploymentTarget } from './bioDeployment';

// ============================================================================
// PLAGUE TYPES
// ============================================================================

export type PlagueTypeId =
  | 'bacteria'
  | 'virus'
  | 'fungus'
  | 'parasite'
  | 'prion'
  | 'nano-virus'
  | 'bio-weapon';

export interface PlagueType {
  id: PlagueTypeId;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  specialMechanic: string;

  // Starting stats modifiers
  baseTransmission: number; // -2 to +2
  baseSeverity: number;
  baseLethality: number;

  // Cost multipliers for evolution
  transmissionCostMultiplier: number;
  symptomCostMultiplier: number;
  abilityCostMultiplier: number;

  // Special properties
  naturalMutationRate: number; // 0-1, chance to gain random symptoms
  startWithCure: boolean; // Nano-virus starts with cure research active
  autoIncreasingLethality: boolean; // Bio-weapon gets deadlier automatically

  // Unlock requirements (for campaign mode)
  unlocked: boolean;
  unlockRequirement?: string;
}

// ============================================================================
// EVOLUTION TREE CATEGORIES
// ============================================================================

export type EvolutionCategory = 'transmission' | 'symptom' | 'ability' | 'defense';

export type TransmissionId =
  | 'air-1' | 'air-2'
  | 'water-1' | 'water-2'
  | 'blood-1' | 'blood-2'
  | 'insect-1' | 'insect-2'
  | 'bird-1' | 'bird-2'
  | 'rodent-1' | 'rodent-2'
  | 'livestock-1'
  | 'extreme-bioaerosol'
  | 'extreme-zoonosis';

export type SymptomId =
  // Tier 1 - Mild
  | 'coughing' | 'sneezing' | 'rash' | 'sweating'
  | 'nausea' | 'vomiting' | 'cysts' | 'fever'
  // Tier 2 - Moderate
  | 'pneumonia' | 'skin-lesions' | 'immune-suppression' | 'abscesses'
  | 'diarrhea' | 'pulmonary-edema' | 'inflammation'
  // Tier 3 - Severe
  | 'total-organ-failure' | 'hemorrhagic-shock' | 'necrosis'
  | 'insanity' | 'paralysis' | 'coma'
  // Tier 4 - Lethal
  | 'cytokine-storm' | 'systemic-infection' | 'liquefaction';

export type AbilityId =
  | 'cold-resistance-1' | 'cold-resistance-2'
  | 'heat-resistance-1' | 'heat-resistance-2'
  | 'drug-resistance-1' | 'drug-resistance-2' | 'drug-resistance-3'
  | 'genetic-hardening-1' | 'genetic-hardening-2' | 'genetic-hardening-3'
  | 'environmental-hardening'
  | 'genetic-reshuffle-1' | 'genetic-reshuffle-2' | 'genetic-reshuffle-3'
  | 'neural-atrophy' | 'bacterial-resilience' | 'viral-instability'
  | 'spore-burst' | 'symbiosis';

export type DefenseId =
  | 'vaccine-prototyping'
  | 'vaccine-field-trials'
  | 'vaccine-mass-production'
  | 'radiation-shielding-1'
  | 'radiation-shielding-2';

export type EvolutionNodeId = TransmissionId | SymptomId | AbilityId | DefenseId;

// ============================================================================
// EVOLUTION NODE DEFINITION
// ============================================================================

export interface EvolutionNode {
  id: EvolutionNodeId;
  category: EvolutionCategory;
  name: string;
  description: string;
  flavor: string; // Thematic description

  // Costs
  dnaCost: number;

  // Prerequisites (must have these nodes unlocked first)
  requires?: EvolutionNodeId[];

  // Conflicts (cannot have both)
  conflicts?: EvolutionNodeId[];

  // Effects on plague stats
  effects: {
    infectivity?: number; // -10 to +10
    severity?: number; // -5 to +10
    lethality?: number; // -5 to +15
    cureResistance?: number; // slows cure research, 0-10
  };

  defenseEffects?: {
    vaccineProgress?: number; // Boost to allied vaccine progress
    radiationMitigation?: number; // % mitigation applied to radiation fallout (0-1)
  };

  // Special flags
  increasesVisibility?: boolean; // Makes plague more noticeable
  mutatesFrom?: SymptomId[]; // Can randomly mutate from these symptoms

  // Plague-type specific
  plagueTypeModifier?: Partial<Record<PlagueTypeId, {
    dnaCostMultiplier?: number;
    effectsMultiplier?: number;
    disabled?: boolean;
  }>>;
}

// ============================================================================
// PLAGUE STATE
// ============================================================================

export interface PlagueState {
  // Selected plague type
  selectedPlagueType: PlagueTypeId | null;
  plagueStarted: boolean;

  // DNA points (currency for evolution)
  dnaPoints: number;

  // Unlocked evolution nodes
  unlockedNodes: Set<EvolutionNodeId>;

  // Active symptom tree
  activeTransmissions: TransmissionId[];
  activeSymptoms: SymptomId[];
  activeAbilities: AbilityId[];

  // Calculated stats (derived from active nodes)
  calculatedStats: {
    totalInfectivity: number;
    totalSeverity: number;
    totalLethality: number;
    cureResistance: number;

    // Climate resistances
    coldResistance: number; // 0-2
    heatResistance: number; // 0-2

    // Special resistances
    drugResistance: number; // 0-3
    geneticHardening: number; // 0-3

    // Defensive research bonuses
    vaccineAcceleration: number; // Additional vaccine progress applied on unlock
    radiationMitigation: number; // 0-1 mitigation scalar
  };

  // Countries infected (legacy, for backward compatibility)
  countriesInfected: string[];

  // Deployment & Target Selection
  deploymentHistory: DeploymentTarget[]; // All past and active deployments
  countryInfections: Map<string, CountryInfectionState>; // Per-country detailed tracking

  // Detection & Attribution
  globalSuspicionLevel: number; // 0-100, how suspicious the world is
  nationsKnowingTruth: string[]; // Nations that confirmed player as source
  attributionAttempts: number; // Times nations tried to identify source

  // Cure progress
  cureProgress: number; // 0-100
  cureActive: boolean;

  // Plague type progression
  unlockedPlagueTypes: Set<PlagueTypeId>; // All unlocked plague types
  completedPlagues: Set<PlagueTypeId>; // Plagues that have been completed
  plagueCompletionStats: {
    // Current run stats
    totalKills: number; // Total deaths across all nations
    peakInfection: number; // Peak global infection %
    nationsInfected: number; // Number of nations infected
  };
}

// ============================================================================
// DNA GAIN EVENTS
// ============================================================================

export type DNAGainReason =
  | 'country-infected' // New country infected
  | 'death' // Deaths grant DNA
  | 'pop-burst' // Infection pop/bubble popped
  | 'mutation' // Random mutation
  | 'milestone' // Reached infection milestone
  | 'special-event'; // Flashpoint or event

export interface DNAGainEvent {
  reason: DNAGainReason;
  amount: number;
  message?: string;
}

// ============================================================================
// EVOLUTION ACTIONS
// ============================================================================

export interface EvolveNodePayload {
  nodeId: EvolutionNodeId;
  forced?: boolean; // Mutation bypasses cost
}

export interface DevolveNodePayload {
  nodeId: EvolutionNodeId;
  refund?: number; // DNA refund amount (usually 25% or 50%)
}

// ============================================================================
// DEPLOYMENT ACTIONS
// ============================================================================

export interface DeployBioWeaponPayload {
  targets: Array<{
    nationId: string;
    deploymentMethod: string; // DeploymentMethodId from bioDeployment
    useFalseFlag: boolean;
    falseFlagNationId?: string;
  }>;
}
