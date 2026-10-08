export const THREAT_CONFIG = {
  MISSILE_THRESHOLD: 10,
  WARHEAD_THRESHOLD: 15,
  ARSENAL_THREAT_INCREMENT: 1,
  PLAYER_THREAT_INCREMENT: 2,
  DECAY_RATE: 0.5,
  MAX_THREAT: 100,
} as const;

export const NUCLEAR_WINTER_CONFIG = {
  MAX_SEVERITY: 0.5,
  SEVERITY_DIVISOR: 10,
  POPULATION_LOSS_RATE: 0.05,
  ALERT_THRESHOLD: 5,
  DECAY_RATE: 0.95,
} as const;

export const PRODUCTION_CONFIG = {
  /** Population multiplier for base production */
  POPULATION_PROD_MULT: 0.20,
  /** Production bonus per city */
  CITY_PROD_BONUS: 20,
  /** Population multiplier for uranium generation */
  POPULATION_URANIUM_MULT: 0.025,
  /** Uranium bonus per city */
  CITY_URANIUM_BONUS: 4,
  /** Population multiplier for intel generation */
  POPULATION_INTEL_MULT: 0.04,
  /** Intel bonus per city */
  CITY_INTEL_BONUS: 3,
  /** Counterintel research bonus multiplier */
  COUNTERINTEL_BONUS_MULT: 0.2,
} as const;

export const PENALTY_CONFIG = {
  /** Maximum hunger penalty (50%) */
  MAX_HUNGER_PENALTY: 0.50,
  /** Hunger divisor for penalty calculation */
  HUNGER_DIVISOR: 100,
  /** Hunger threshold for logging agricultural collapse */
  HUNGER_LOG_THRESHOLD: 0.5,
  /** Maximum sickness penalty (40%) */
  MAX_SICKNESS_PENALTY: 0.40,
  /** Sickness divisor for penalty calculation */
  SICKNESS_DIVISOR: 130,
  /** Minimum uranium multiplier after sickness penalty */
  MIN_URANIUM_MULT_SICKNESS: 0.1,
  /** Sickness uranium reduction factor */
  SICKNESS_URANIUM_FACTOR: 0.1,
  /** Maximum labor loss from refugees (40%) */
  MAX_REFUGEE_LABOR_LOSS: 0.4,
  /** Green shift production multiplier */
  GREEN_SHIFT_PROD_MULT: 0.7,
  /** Green shift uranium multiplier */
  GREEN_SHIFT_URANIUM_MULT: 0.5,
  /** Environment penalty multiplier */
  ENVIRONMENT_PENALTY_MULT: 0.7,
} as const;

export const INSTABILITY_CONFIG = {
  /** Threshold for instability effects to kick in */
  EFFECT_THRESHOLD: 50,
  /** Divisor for calculating unrest from instability */
  UNREST_DIVISOR: 10,
  /** Threshold for civil war */
  CIVIL_WAR_THRESHOLD: 100,
  /** Population multiplier after civil war */
  CIVIL_WAR_POP_MULT: 0.8,
  /** Instability reset value after civil war */
  CIVIL_WAR_INSTABILITY_RESET: 50,
  /** Per-turn instability decay */
  DECAY_PER_TURN: 2,
} as const;
