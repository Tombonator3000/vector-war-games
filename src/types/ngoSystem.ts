/**
 * NGO System - Types and Interfaces
 * Allows nations to sponsor NGOs that facilitate immigration and cause destabilization
 */

export type NGOType =
  | 'humanitarian_aid'      // Focus on refugee assistance
  | 'cultural_exchange'     // Cultural programs
  | 'migration_advocacy'    // Pro-migration advocacy
  | 'refugee_resettlement'  // Resettlement operations
  | 'border_assistance';    // Border crossing assistance

export type NGOOperationStatus = 'active' | 'completed' | 'exposed' | 'failed';

export interface NGOOperation {
  id: string;
  name: string;
  sponsorNationId: string;      // Nation funding the NGO
  sourceNationId: string;        // Nation losing population
  targetNationId: string;        // Nation receiving migrants
  ngoType: NGOType;

  // Operation parameters
  startTurn: number;
  duration: number;              // Turns the operation runs
  turnsRemaining: number;
  status: NGOOperationStatus;

  // Costs and effects
  costPerTurn: {
    gold: number;
    intel?: number;              // Intelligence resources for covert ops
    production?: number;
  };

  // Effects per turn
  effects: {
    immigrationRate: number;     // Migrants per turn from source to target
    targetInstability: number;   // Instability added to target nation
    sourceInstability: number;   // Minor instability in source nation
    targetOpposition: number;    // Boosts opposition in target
    diplomaticCost: number;      // Relations penalty if exposed
  };

  // Detection and exposure
  detectionRisk: number;         // Base % chance per turn of being exposed
  exposureChance: number;        // Cumulative exposure chance
  isCovert: boolean;             // Whether operation is hidden
  exposedToNations: string[];    // Nations that detected this operation

  // Immigration details
  totalMigrants: number;         // Total migrants moved so far
  popGroupsCreated: string[];    // IDs of created population groups
}

export interface NGOState {
  // Active operations
  activeOperations: NGOOperation[];

  // NGO capacity and infrastructure
  ngoInfrastructure: number;     // 0-100, affects operation efficiency
  maxActiveOperations: number;   // Limited concurrent operations

  // Reputation and relations
  ngoReputation: number;         // 0-100, affects success rate
  exposedOperations: number;     // Count of exposed operations

  // Statistics
  totalMigrantsMoved: number;
  totalOperationsLaunched: number;
  successfulOperations: number;
}

export interface NGOOperationTemplate {
  ngoType: NGOType;
  name: string;
  description: string;
  icon: string;

  // Base costs
  setupCost: {
    gold: number;
    intel?: number;
    production?: number;
  };

  costPerTurn: {
    gold: number;
    intel?: number;
    production?: number;
  };

  // Base effects (modified by various factors)
  baseEffects: {
    immigrationRate: number;
    targetInstability: number;
    sourceInstability: number;
    targetOpposition: number;
  };

  // Operation parameters
  minDuration: number;
  maxDuration: number;
  baseDetectionRisk: number;
  isCovert: boolean;

  // Requirements
  requirements: {
    minNGOInfrastructure?: number;
    minIntel?: number;
    requiredTech?: string[];
    bannedIdeologies?: string[];  // Some ideologies can't use certain NGOs
  };

  // Diplomatic implications
  relationsPenaltyIfExposed: number;
  canTargetAllies: boolean;
}

export interface NGOOperationResult {
  success: boolean;
  operation?: NGOOperation;
  message: string;
  consequences: {
    goldSpent: number;
    intelSpent?: number;
    productionSpent?: number;
    operationId?: string;
  };
}

export interface NGOExposureEvent {
  operationId: string;
  exposedToNationId: string;
  turn: number;
  exposureType: 'intelligence' | 'media' | 'diplomatic' | 'accidental';
  consequences: {
    relationsPenalty: number;
    reputationLoss: number;
    operationTerminated: boolean;
  };
}

export interface NGOImmigrationWave {
  operationId: string;
  sourceNationId: string;
  targetNationId: string;
  migrants: number;
  turn: number;
  popGroupId?: string;

  // Effects on target
  instabilityAdded: number;
  oppositionStrengthIncrease: number;
  culturalTension: number;
}

// Helper type for UI display
export interface NGOOperationSummary {
  operationId: string;
  ngoType: NGOType;
  name: string;
  source: string;
  target: string;
  turnsRemaining: number;
  costPerTurn: string;  // Formatted string
  migrantsPerTurn: number;
  totalMigrants: number;
  status: NGOOperationStatus;
  exposureRisk: string; // Formatted percentage
  isExposed: boolean;
}
