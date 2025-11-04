/**
 * Policy System Types
 * 
 * Policies are long-term strategic choices that provide ongoing benefits
 * and costs. Unlike events, policies remain active until changed.
 */

export type PolicyCategory = 'economic' | 'military' | 'social' | 'foreign';

export interface PolicyCost {
  gold?: number;
  production?: number;
  intel?: number;
  uranium?: number;
  moralePerTurn?: number;
  approvalPerTurn?: number;
}

export interface PolicyEffects {
  // Production & Economy
  productionModifier?: number; // Multiplier (e.g., 1.15 = +15%)
  goldPerTurn?: number;
  uraniumPerTurn?: number;
  
  // Governance
  moraleModifier?: number; // Flat bonus/penalty per turn
  publicOpinionModifier?: number;
  cabinetApprovalModifier?: number;
  instabilityModifier?: number;
  
  // Military
  militaryRecruitmentModifier?: number;
  defenseBonus?: number;
  missileAccuracyBonus?: number;
  
  // Diplomacy
  diplomaticInfluenceModifier?: number;
  relationshipDecayModifier?: number; // Affects how fast relationships decay
  
  // Intelligence
  intelPerTurn?: number;
  espionageSuccessBonus?: number;
  counterIntelBonus?: number;
  
  // Special
  description?: string; // Human-readable effect description
}

export interface Policy {
  id: string;
  name: string;
  category: PolicyCategory;
  description: string;
  flavorText?: string;
  
  // Requirements
  prerequisites: PolicyPrerequisite[];
  
  // Costs
  enactmentCost: PolicyCost; // One-time cost to enact
  maintenanceCost?: PolicyCost; // Ongoing cost per turn
  
  // Effects
  effects: PolicyEffects;
  
  // Relationships with other policies
  conflictsWith: string[]; // Cannot be active at same time
  synergiesWith: string[]; // Bonus effects when both active
  synergyBonus?: PolicyEffects; // Additional effects from synergy
  
  // Gameplay
  canRepeal: boolean; // Can this policy be cancelled?
  repealCost?: PolicyCost; // Cost to cancel
  tier: 1 | 2 | 3; // Policy tier (higher = more powerful)
}

export interface PolicyPrerequisite {
  type: 'tech' | 'turn' | 'morale' | 'approval' | 'policy';
  value: string | number;
  description: string;
}

export interface ActivePolicy {
  policyId: string;
  enactedTurn: number;
  turnsActive: number;
}

export interface PolicyState {
  activePolicies: ActivePolicy[];
  availablePolicies: string[]; // IDs of policies that can be enacted
  policyHistory: PolicyHistoryEntry[];
}

export interface PolicyHistoryEntry {
  policyId: string;
  action: 'enacted' | 'repealed';
  turn: number;
  reason?: string;
}

export interface PolicyChangeProposal {
  type: 'enact' | 'repeal';
  policyId: string;
  cost: PolicyCost;
  expectedEffects: PolicyEffects;
}
