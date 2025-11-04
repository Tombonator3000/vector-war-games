/**
 * POP SYSTEM TYPE DEFINITIONS
 * Enhanced population mechanics inspired by Stellaris and Civilization
 */

export type SkillLevel = 'low' | 'medium' | 'high';

export interface PopGroup {
  id: string;
  size: number;                 // Millions of people
  origin: string;               // Which nation they came from
  loyalty: number;              // 0-100, affects productivity and stability
  culture: string;              // Cultural identity
  skills: SkillLevel;           // Education level
  assimilation: number;         // 0-100, how integrated they are
  happiness: number;            // 0-100, affects productivity
  yearsSinceArrival: number;    // Time since immigration (in turns)
  ideologyPreference?: import('./ideology').IdeologyType; // Preferred ideology
  ideologySupport?: number;     // 0-100, support for their preferred ideology
}

/**
 * Immigration policy types
 */
export type ImmigrationPolicyType =
  | 'closed_borders'      // No immigration, +stability
  | 'selective'           // High-skill only, expensive
  | 'humanitarian'        // Refugees, +diplomacy
  | 'open_borders'        // Max immigration, -stability
  | 'cultural_exchange'   // Balanced cultural flow
  | 'brain_drain_ops';    // Aggressive talent poaching

/**
 * Immigration policy effects
 */
export interface ImmigrationPolicy {
  type: ImmigrationPolicyType;
  stabilityModifier: number;        // % change to stability
  economicGrowth: number;           // % economic boost
  diplomaticImpact: number;         // Change to global reputation
  culturalAssimilationRate: number; // Rate of pop integration per turn
  immigrationRate: number;          // Millions per turn
  intelCostPerTurn: number;         // Intel cost to maintain
  productionCostPerTurn?: number;   // Production cost to maintain
  description: string;              // Policy description
}

/**
 * Cultural defense types
 */
export type CulturalDefenseType =
  | 'border_security'         // Reduces immigration
  | 'counter_propaganda'      // Neutralizes campaigns
  | 'cultural_preservation'   // Increases assimilation
  | 'education_programs'      // Converts hostile pops
  | 'intelligence_sweep'      // Reveals hidden operations
  | 'loyalty_incentives';     // Increases pop happiness

/**
 * Cultural defense option
 */
export interface CulturalDefense {
  type: CulturalDefenseType;
  intelCost?: number;
  productionCost?: number;
  effectiveness: number;          // Base effectiveness
  duration: number;               // Turns active
  description: string;
}
