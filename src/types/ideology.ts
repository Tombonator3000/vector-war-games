/**
 * Ideology System for Vector War Games
 *
 * Defines ideological frameworks that influence nation bonuses, diplomacy,
 * cultural warfare, and population dynamics.
 */

/**
 * Available ideology types
 */
export type IdeologyType =
  | 'democracy'
  | 'authoritarianism'
  | 'communism'
  | 'theocracy'
  | 'technocracy';

/**
 * Ideology state for a nation
 */
export interface IdeologyState {
  /** Current ideology of the nation */
  currentIdeology: IdeologyType;

  /** Stability of the current ideology (0-100) */
  ideologyStability: number;

  /** Support levels for each ideology among population */
  ideologicalSupport: Record<IdeologyType, number>;

  /** Active ideological pressure from other nations */
  ideologicalPressures: IdeologicalPressure[];

  /** Turn when ideology was last changed */
  lastIdeologyChangeTurn?: number;

  /** Last production multiplier applied from ideology bonuses */
  lastAppliedProductionMultiplier?: number;

  /** Whether this nation is actively spreading its ideology */
  ideologicalExport: boolean;

  /** Effectiveness of ideological defense (0-100) */
  ideologicalDefense: number;
}

/**
 * Ideological pressure from one nation to another
 */
export interface IdeologicalPressure {
  /** Nation ID spreading the ideology */
  fromNation: string;

  /** Ideology being spread */
  ideology: IdeologyType;

  /** Strength of the pressure (0-100) */
  strength: number;

  /** Turns this pressure has been active */
  duration: number;

  /** Intel cost per turn to maintain */
  intelCost: number;
}

/**
 * Bonuses granted by each ideology
 */
export interface IdeologyBonuses {
  /** Production multiplier */
  productionMultiplier: number;

  /** Diplomacy points per turn */
  diplomacyPerTurn: number;

  /** Research speed multiplier */
  researchMultiplier: number;

  /** Cultural power bonus */
  culturalPowerBonus: number;

  /** Morale loss reduction (0-1) */
  moraleLossReduction: number;

  /** Population equality/happiness bonus */
  populationHappinessBonus: number;

  /** Cultural defense bonus */
  culturalDefenseBonus: number;

  /** Propaganda effectiveness multiplier */
  propagandaEffectiveness: number;

  /** Cyber warfare bonus */
  cyberWarfareBonus: number;

  /** Election quality bonus (for internal stability) */
  electionBonus: number;

  /** Intel generation bonus */
  intelBonus: number;

  /** Unit attack bonus */
  unitAttackBonus: number;

  /** Unit defense bonus */
  unitDefenseBonus: number;

  /** Immigration attraction modifier */
  immigrationModifier: number;
}

/**
 * Revolution state tracking
 */
export interface RevolutionState {
  /** Whether a revolution is currently brewing */
  revolutionRisk: number; // 0-100

  /** Ideology the revolution would transition to */
  targetIdeology?: IdeologyType;

  /** Turns until revolution triggers (if risk is high) */
  turnsUntilRevolution?: number;

  /** Factions supporting the revolution */
  revolutionaryFactions: RevolutionaryFaction[];
}

/**
 * Faction supporting an ideological change
 */
export interface RevolutionaryFaction {
  /** Faction identifier */
  id: string;

  /** Ideology the faction supports */
  supportedIdeology: IdeologyType;

  /** Strength of the faction (0-100) */
  strength: number;

  /** Population groups aligned with this faction */
  supportingPopGroups: string[];
}

/**
 * Event triggered by ideology system
 */
export interface IdeologyEvent {
  /** Event type */
  type: 'revolution' | 'ideology_change' | 'ideological_conflict' | 'ideological_alignment';

  /** Nation(s) affected */
  affectedNations: string[];

  /** Ideology involved */
  ideology: IdeologyType;

  /** Event description */
  description: string;

  /** Turn when event occurred */
  turn: number;
}

/**
 * Configuration for ideology spreading
 */
export interface IdeologySpreadConfig {
  /** Base intel cost per turn */
  baseIntelCost: number;

  /** Base strength of pressure */
  baseStrength: number;

  /** Cultural power multiplier */
  culturalPowerMultiplier: number;

  /** Distance decay factor */
  distanceDecay: number;

  /** Relationship impact */
  relationshipBonus: number;
}

/**
 * Get ideology display information
 */
export interface IdeologyInfo {
  type: IdeologyType;
  name: string;
  description: string;
  icon: string;
  color: string;
  bonuses: IdeologyBonuses;
  strengths: string[];
  weaknesses: string[];
}
