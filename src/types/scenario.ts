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
    name: 'Cuban Missile Crisis (1962)',
    description:
      'October 16-28, 1962: Experience the thirteen days that brought the world to the brink of nuclear war. Features historically accurate leaders (JFK, Khrushchev, Castro), real diplomatic flashpoints, multi-party negotiations (Cuba, Turkey, NATO, UN), and authentic Cold War mechanics.',
    timeConfig: {
      unit: 'day',
      unitsPerTurn: 1,
      startYear: 1962,
      startMonth: 10,
      displayFormat: 'DD MMM YYYY',
    },
    electionConfig: {
      interval: 0,
      enabled: false,
      minMoraleThreshold: 0,
      minPublicOpinionThreshold: 0,
      actionInfluenceMultiplier: 2.0,
      foreignInfluenceEnabled: true,
      loseElectionConsequence: 'none',
    },
    startingDefcon: 3,
    modifiers: {
      timeSpeedMultiplier: 0.5,
    },
    eraOverrides: {
      early: {
        endTurn: 13,
        unlockedFeatures: [
          'nuclear_missiles',
          'nuclear_bombers',
          'defense_systems',
          'basic_diplomacy',
          'advanced_diplomacy',
          'basic_research',
          'conventional_warfare',
          'territory_control',
          'submarines',
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

  greatOldOnes: {
    id: 'greatOldOnes',
    name: 'Rise of the Old Ones',
    description: 'May 2025: Ancient cults vie for power as eldritch entities stir. A Lovecraftian reskin where nations become cults, armies become hordes, and diplomacy becomes dark pacts.',
    timeConfig: {
      unit: 'day',
      unitsPerTurn: 1,
      startYear: 2025,
      startMonth: 5,
      displayFormat: 'DD MMM YYYY',
    },
    electionConfig: {
      interval: 0, // No elections during existential crisis
      enabled: false,
      minMoraleThreshold: 0,
      minPublicOpinionThreshold: 0,
      actionInfluenceMultiplier: 3.0, // Actions have triple impact (cosmic horror)
      foreignInfluenceEnabled: false, // Beyond politics
      loseElectionConsequence: 'none',
    },
    startingDefcon: 2, // High alert - cosmic threat detected
    modifiers: {
      timeSpeedMultiplier: 0.4, // Even faster paced than Cuban Crisis
      startingResourcesMultiplier: 1.2, // Slightly more resources to fight cosmic threat
    },
    eraOverrides: {
      // Modern era - all features unlocked to fight cosmic horror
      early: {
        endTurn: 10,
        unlockedFeatures: [
          'nuclear_missiles',
          'nuclear_bombers',
          'defense_systems',
          'basic_diplomacy',
          'basic_research',
          'conventional_warfare',
          'territory_control',
          'advanced_diplomacy',
          'submarines',
          'cyber_warfare',
          'space_weapons',
          'ai_systems',
        ],
      },
      mid: {
        startTurn: 11,
        endTurn: 25,
        unlockedFeatures: [
          'nuclear_missiles',
          'nuclear_bombers',
          'defense_systems',
          'basic_diplomacy',
          'basic_research',
          'conventional_warfare',
          'territory_control',
          'advanced_diplomacy',
          'submarines',
          'cyber_warfare',
          'space_weapons',
          'ai_systems',
          'propaganda_victory',
          'economic_warfare',
        ],
      },
      late: {
        startTurn: 26,
        endTurn: 40,
        unlockedFeatures: [
          'nuclear_missiles',
          'nuclear_bombers',
          'defense_systems',
          'basic_diplomacy',
          'basic_research',
          'conventional_warfare',
          'territory_control',
          'advanced_diplomacy',
          'submarines',
          'cyber_warfare',
          'space_weapons',
          'ai_systems',
          'propaganda_victory',
          'economic_warfare',
          'quantum_computing',
        ],
      },
    },
  },
};

/**
 * Get default scenario (Cold War)
 */
export function getDefaultScenario(): ScenarioConfig {
  return SCENARIOS.coldWar;
}
