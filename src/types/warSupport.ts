/**
 * War Support & Stability System Types
 *
 * Hearts of Iron IV-inspired public opinion and national stability mechanics.
 * War Support affects military capabilities, while Stability affects production and politics.
 */

export type StabilityLevel = 'crisis' | 'unstable' | 'stable' | 'very_stable' | 'unshakeable';
export type WarSupportLevel = 'pacifist' | 'reluctant' | 'willing' | 'eager' | 'fanatic';

export interface WarSupportState {
  nationId: string;

  // War Support (0-100%)
  warSupport: number;
  warSupportLevel: WarSupportLevel;

  // Modifiers affecting war support
  baseWarSupport: number; // Base value (default 50)
  ideologyModifier: number; // -20 to +20
  leaderModifier: number; // -10 to +10
  eventModifiers: WarSupportModifier[]; // Temporary events
  warStatusModifier: number; // From being at war, winning/losing

  // Stability (0-100%)
  stability: number;
  stabilityLevel: StabilityLevel;

  // Modifiers affecting stability
  baseStability: number; // Base value (default 50)
  politicalModifier: number; // From decisions, focuses
  economicModifier: number; // From economy state
  eventModifiers: StabilityModifier[]; // Temporary events
  occupationPenalty: number; // From occupied territories

  // Trends
  warSupportTrend: 'increasing' | 'stable' | 'decreasing';
  stabilityTrend: 'increasing' | 'stable' | 'decreasing';
  warSupportChangePerTurn: number;
  stabilityChangePerTurn: number;
}

export interface WarSupportModifier {
  id: string;
  name: string;
  description: string;
  amount: number; // -50 to +50
  duration: number; // Turns remaining, -1 for permanent
  source: 'event' | 'decision' | 'combat' | 'diplomacy' | 'leader';
  appliedTurn: number;
}

export interface StabilityModifier {
  id: string;
  name: string;
  description: string;
  amount: number; // -50 to +50
  duration: number; // Turns remaining, -1 for permanent
  source: 'event' | 'decision' | 'economy' | 'occupation' | 'unrest';
  appliedTurn: number;
}

// Effects on gameplay
export interface WarSupportEffects {
  // Military effects
  recruitmentSpeed: number; // 0.5-1.5x
  divisionRecovery: number; // 0.5-1.5x
  surrenderLimit: number; // 20-80% losses before surrender
  warGoalCost: number; // PP cost for war goals, 0.5-2.0x
  commandPowerGain: number; // Command power generation, 0.5-1.5x

  // Diplomatic effects
  joinFactionWillingness: number; // -50 to +50
  peaceConferencePower: number; // Influence in peace deals

  // Economic effects (indirect)
  conscriptionLaw: 'volunteer' | 'limited' | 'extensive' | 'total'; // Available laws
}

export interface StabilityEffects {
  // Production effects
  productionEfficiency: number; // 0.5-1.3x
  factoryOutput: number; // 0.5-1.2x
  constructionSpeed: number; // 0.5-1.2x

  // Political effects
  politicalPowerGain: number; // 0.5-1.5x
  focusCompletionSpeed: number; // 0.7-1.3x
  decisionCost: number; // PP costs, 0.5-2.0x

  // Unrest effects
  resistanceActivity: number; // In occupied territories, 0.5-2.0x
  complianceGain: number; // In occupied territories, 0.5-2.0x

  // Crisis effects
  riskOfCoup: boolean; // If stability < 20%
  riskOfCivilWar: boolean; // If stability < 10%
}

// Events that affect war support and stability
export interface WarSupportEvent {
  id: string;
  name: string;
  description: string;
  trigger: WarSupportEventTrigger;
  effects: {
    warSupportChange: number;
    stabilityChange: number;
    duration?: number; // For temporary modifiers
  };
  conditions: WarSupportEventCondition[];
}

export interface WarSupportEventTrigger {
  type:
    | 'war_declared'
    | 'war_won'
    | 'war_lost'
    | 'territory_captured'
    | 'territory_lost'
    | 'ally_joins_war'
    | 'ally_betrays'
    | 'nuclear_strike_launched'
    | 'nuclear_strike_received'
    | 'civilian_casualties'
    | 'military_victory'
    | 'military_defeat'
    | 'peace_treaty'
    | 'economic_crisis'
    | 'leader_dies'
    | 'scandal';
}

export interface WarSupportEventCondition {
  type: 'war_support_above' | 'war_support_below' | 'stability_above' | 'stability_below' | 'at_war' | 'at_peace' | 'turn_after';
  value: number;
}

// Actions players can take to influence war support and stability
export interface WarSupportAction {
  id: string;
  name: string;
  description: string;
  category: 'propaganda' | 'policy' | 'economic' | 'military';

  // Costs
  ppCost: number;
  productionCost?: number;

  // Effects
  warSupportChange: number;
  stabilityChange: number;
  duration: number; // Turns

  // Requirements
  minWarSupport?: number;
  minStability?: number;
  atWar?: boolean;
  requiresFocus?: string[];

  // Cooldown
  cooldownTurns: number;
  lastUsedTurn?: number;
}

// Historical war support/stability tracking
export interface WarSupportHistory {
  nationId: string;
  turn: number;
  warSupport: number;
  stability: number;
  majorEvents: string[]; // Event IDs that occurred this turn
}

// Laws that can be changed (affected by war support and stability)
export interface NationalLaw {
  id: string;
  category: 'conscription' | 'economy' | 'trade';
  name: string;
  description: string;

  // Requirements
  minWarSupport: number;
  minStability: number;
  ppCost: number;

  // Effects
  effects: {
    recruitmentSpeed?: number;
    productionEfficiency?: number;
    consumerGoods?: number; // % of production
    tradeCapacity?: number;
    warSupportDrain?: number; // Per turn penalty/bonus
    stabilityChange?: number;
  };
}

// Crisis events when things get too low
export interface NationalCrisis {
  id: string;
  nationId: string;
  type: 'coup' | 'civil_war' | 'revolution' | 'government_collapse' | 'military_mutiny';
  trigger: 'low_war_support' | 'low_stability' | 'both';
  turn: number;

  // Effects
  effects: {
    leaderChange?: boolean;
    ideologyChange?: boolean;
    territoryLoss?: number; // Percentage
    productionLoss?: number; // Percentage
    allianceBroken?: boolean;
  };

  // Resolution
  resolved: boolean;
  resolutionTurn?: number;
  resolutionMethod?: 'suppressed' | 'compromised' | 'overthrown';
}
