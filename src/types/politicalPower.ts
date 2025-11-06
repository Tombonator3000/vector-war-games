/**
 * Political Power System Types
 *
 * Hearts of Iron IV-inspired political power currency system.
 * Political power is spent on national decisions, focus activation, and policy changes.
 */

export interface PoliticalPowerState {
  nationId: string;
  currentPP: number; // Current political power
  maxPP: number; // Storage capacity (default 300)
  generationRate: number; // PP per turn

  // Modifiers
  baseGeneration: number; // Base 2 PP/turn
  leaderBonus: number; // From leader traits
  ideologyBonus: number; // From ideology
  advisorBonuses: AdvisorBonus[];
  temporaryModifiers: PPModifier[];

  // History
  lastTurnGeneration: number;
  totalGenerated: number;
  totalSpent: number;
}

export interface AdvisorBonus {
  id: string;
  advisorName: string;
  bonusType: 'pp_generation' | 'pp_max' | 'decision_cost_reduction';
  value: number; // +1 PP/turn, +50 max PP, -10% cost, etc.
  hiredTurn: number;
}

export interface PPModifier {
  id: string;
  source: string; // "Focus: Industrial Expansion", "Event: Economic Boom", etc.
  modifierType: 'generation' | 'max' | 'cost_reduction';
  value: number;
  duration: number; // Turns remaining (-1 = permanent)
  appliedTurn: number;
}

export interface NationalDecision {
  id: string;
  name: string;
  description: string;
  category: DecisionCategory;
  icon: string;
  ppCost: number;

  // Requirements
  requirements: DecisionRequirement[];

  // Effects
  effects: DecisionEffect[];

  // Cooldown
  cooldownTurns?: number;
  lastUsedTurn?: number;

  // Availability
  eraRequirement?: number; // Minimum turn
  researchRequirement?: string[]; // Tech IDs required
  territoryRequirement?: number; // Minimum territories
  focusRequirement?: string[]; // Focus IDs required
  ideologyRequirement?: string; // Specific ideology
}

export type DecisionCategory =
  | 'economy'
  | 'military'
  | 'diplomacy'
  | 'research'
  | 'domestic'
  | 'war'
  | 'emergency';

export interface DecisionRequirement {
  type:
    | 'min_turn'
    | 'min_territories'
    | 'min_gold'
    | 'at_war'
    | 'at_peace'
    | 'has_research'
    | 'has_focus'
    | 'min_morale'
    | 'max_defcon'
    | 'has_alliance'
    | 'ideology';
  value: any;
  description: string;
}

export interface DecisionEffect {
  type:
    | 'production_boost'
    | 'morale_boost'
    | 'research_boost'
    | 'influence_boost'
    | 'military_boost'
    | 'diplomacy_boost'
    | 'gold_boost'
    | 'intel_boost'
    | 'unlock_action'
    | 'temporary_buff'
    | 'permanent_buff';

  // Stat changes
  statChanges?: {
    production?: number;
    morale?: number;
    research?: number;
    influence?: number;
    gold?: number;
    intel?: number;
    diplomacy?: number;
  };

  // Multipliers (for percentage bonuses)
  multipliers?: {
    productionMultiplier?: number; // 1.2 = +20%
    researchMultiplier?: number;
    militaryMultiplier?: number;
  };

  // Duration
  duration?: number; // Turns (-1 = permanent)

  // Message
  message: string;
}

export interface AdvisorTemplate {
  id: string;
  name: string;
  title: string; // "Economic Advisor", "Military Strategist", etc.
  description: string;
  portrait: string; // Portrait image path or emoji
  hireCost: number; // PP cost to hire
  bonuses: AdvisorBonus[];

  // Requirements
  minTurn?: number;
  requiredIdeology?: string;
  requiredFocus?: string[];
}

export interface DecisionLog {
  nationId: string;
  decisionId: string;
  decisionName: string;
  ppSpent: number;
  turnExecuted: number;
  effects: DecisionEffect[];
}

export interface PoliticalPowerManager {
  nations: Map<string, PoliticalPowerState>;
  decisionLog: DecisionLog[];
  activeAdvisors: Map<string, AdvisorTemplate[]>; // nationId -> advisors
}

// Helper type for UI
export interface AvailableDecision extends NationalDecision {
  canAfford: boolean;
  meetsRequirements: boolean;
  onCooldown: boolean;
  missingRequirements: string[];
}
