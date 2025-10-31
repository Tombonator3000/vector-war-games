/**
 * Scenario and Campaign Configuration
 * Defines time progression, election mechanics, and scenario-specific settings
 */

import type { GameEra, GameFeature } from './era';

export type TimeUnit = 'year' | 'month' | 'week' | 'day';

export interface TimeConfig {
  /** Base time unit per turn (e.g., 'month', 'year') */
  unit: TimeUnit;

  /** How many time units pass per turn (default: 1) */
  unitsPerTurn: number;

  /** Starting year for the scenario */
  startYear: number;

  /** Starting month (1-12, only used if unit is 'month' or smaller) */
  startMonth?: number;

  /** Display format for time (e.g., "MMM YYYY", "YYYY") */
  displayFormat: string;
}

export interface ElectionConfig {
  /** Turns between elections (default: 12) */
  interval: number;

  /** Whether elections are enabled */
  enabled: boolean;

  /** Minimum morale to avoid election penalty (-20 to 100) */
  minMoraleThreshold: number;

  /** Minimum public opinion to avoid election loss (-20 to 100) */
  minPublicOpinionThreshold: number;

  /** How much actions affect public opinion */
  actionInfluenceMultiplier: number;

  /** How much other nations' actions affect player elections */
  foreignInfluenceEnabled: boolean;

  /** Consequences of losing election */
  loseElectionConsequence: 'gameOver' | 'leaderChange' | 'instability' | 'none';
}

export type ScenarioEraOverrides = Partial<
  Record<
    GameEra,
    {
      /** Custom era start turn */
      startTurn?: number;
      /** Custom era end turn */
      endTurn?: number;
      /** Replace unlocked features for the era */
      unlockedFeatures?: GameFeature[];
    }
  >
>;

export interface ScenarioConfig {
  /** Scenario identifier */
  id: string;

  /** Display name */
  name: string;

  /** Description */
  description: string;

  /** Time configuration */
  timeConfig: TimeConfig;

  /** Election configuration */
  electionConfig: ElectionConfig;

  /** Starting DEFCON level */
  startingDefcon: number;

  /** Special rules or modifiers */
  modifiers?: {
    /** Speed up or slow down time (multiplier) */
    timeSpeedMultiplier?: number;

    /** Modify election difficulty */
    electionDifficultyMultiplier?: number;

    /** Starting resources modifier */
    startingResourcesMultiplier?: number;
  };

  /** Era-specific overrides for unlock pacing */
  eraOverrides?: ScenarioEraOverrides;
}

/**
 * Pre-defined scenarios
 */
export const SCENARIOS: Record<string, ScenarioConfig> = {
  coldWar: {
    id: 'coldWar',
    name: 'Cold War Era',
    description: 'Classic Cold War scenario starting in 1950 with annual turns (1 turn = 1 year)',
    timeConfig: {
      unit: 'year',
      unitsPerTurn: 1,
      startYear: 1950,
      displayFormat: 'YYYY',
    },
    electionConfig: {
      interval: 4, // Elections every 4 turns (4-year cycle)
      enabled: true,
      minMoraleThreshold: 30,
      minPublicOpinionThreshold: 25,
      actionInfluenceMultiplier: 1.0,
      foreignInfluenceEnabled: true,
      loseElectionConsequence: 'leaderChange',
    },
    startingDefcon: 5,
  },

  cubanCrisis: {
    id: 'cubanCrisis',
    name: 'Cuban Missile Crisis',
    description: 'High tension scenario - 1 turn = 1 day',
    timeConfig: {
      unit: 'day',
      unitsPerTurn: 1,
      startYear: 1962,
      startMonth: 10,
      displayFormat: 'DD MMM YYYY',
    },
    electionConfig: {
      interval: 0, // No elections during crisis
      enabled: false,
      minMoraleThreshold: 0,
      minPublicOpinionThreshold: 0,
      actionInfluenceMultiplier: 2.0, // Actions have double impact on opinion
      foreignInfluenceEnabled: true,
      loseElectionConsequence: 'none',
    },
    startingDefcon: 3,
    modifiers: {
      timeSpeedMultiplier: 0.5, // Faster paced
    },
    eraOverrides: {
      early: {
        endTurn: 3,
      },
      mid: {
        startTurn: 4,
        endTurn: 6,
        unlockedFeatures: [
          'nuclear_missiles',
          'nuclear_bombers',
          'defense_systems',
          'basic_diplomacy',
          'basic_research',
          'conventional_warfare',
          'territory_control',
          'advanced_diplomacy',
        ],
      },
      late: {
        startTurn: 7,
        endTurn: 14,
        unlockedFeatures: [
          'nuclear_missiles',
          'nuclear_bombers',
          'defense_systems',
          'basic_diplomacy',
          'basic_research',
          'conventional_warfare',
          'territory_control',
          'cyber_warfare',
          'advanced_diplomacy',
          'submarines',
          'satellites',
          'propaganda_victory',
        ],
      },
    },
  },

  modernEra: {
    id: 'modernEra',
    name: 'Modern Era',
    description: 'Modern geopolitical scenario - 1 turn = 1 week',
    timeConfig: {
      unit: 'week',
      unitsPerTurn: 1,
      startYear: 2024,
      startMonth: 1,
      displayFormat: 'Week of MMM DD, YYYY',
    },
    electionConfig: {
      interval: 52, // Elections every 52 weeks (1 year)
      enabled: true,
      minMoraleThreshold: 40,
      minPublicOpinionThreshold: 35,
      actionInfluenceMultiplier: 1.5,
      foreignInfluenceEnabled: true,
      loseElectionConsequence: 'leaderChange',
    },
    startingDefcon: 5,
  },

  longGame: {
    id: 'longGame',
    name: 'Long Game',
    description: 'Extended campaign - 1 turn = 1 year',
    timeConfig: {
      unit: 'year',
      unitsPerTurn: 1,
      startYear: 1945,
      displayFormat: 'YYYY',
    },
    electionConfig: {
      interval: 4, // Elections every 4 years
      enabled: true,
      minMoraleThreshold: 35,
      minPublicOpinionThreshold: 30,
      actionInfluenceMultiplier: 0.8,
      foreignInfluenceEnabled: true,
      loseElectionConsequence: 'leaderChange',
    },
    startingDefcon: 5,
  },
};

/**
 * Get default scenario (Cold War)
 */
export function getDefaultScenario(): ScenarioConfig {
  return SCENARIOS.coldWar;
}
