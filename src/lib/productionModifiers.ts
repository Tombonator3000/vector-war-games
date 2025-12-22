/**
 * Production Modifiers System
 *
 * Extracts production modifier calculations from productionPhase into a cleaner,
 * more maintainable, and testable structure using a pipeline pattern.
 *
 * Each modifier is a pure function that takes the current multipliers and nation state,
 * returning updated multipliers. This makes individual modifiers easy to test and understand.
 */

import type { Nation } from '@/types/game';
import type { PolicyEffects } from '@/types/policy';

/**
 * Current production multipliers being calculated
 */
export interface ProductionMultipliers {
  production: number;
  uranium: number;
  intel: number;
}

/**
 * Context needed for modifier calculations
 */
export interface ModifierContext {
  nation: Nation;
  player: Nation | null;
  policyEffects?: PolicyEffects;
  isPolicyNation: boolean;
  log: (msg: string, type?: string) => void;
}

/**
 * Result of applying a modifier - includes optional log message
 */
export interface ModifierResult {
  multipliers: ProductionMultipliers;
  logMessage?: { text: string; type: string };
}

/**
 * A production modifier function signature
 */
export type ProductionModifier = (
  multipliers: ProductionMultipliers,
  context: ModifierContext
) => ModifierResult;

// =============================================================================
// Individual Modifier Functions
// =============================================================================

/**
 * Apply hunger penalty from fallout effects
 * Caps at 50% reduction
 */
export const applyHungerPenalty: ProductionModifier = (multipliers, context) => {
  const { nation, player } = context;
  const hungerPenalty = Math.min(0.50, (nation.falloutHunger ?? 0) / 100);

  if (hungerPenalty <= 0) {
    return { multipliers };
  }

  const newMultipliers = {
    ...multipliers,
    production: multipliers.production * (1 - hungerPenalty),
  };

  const shouldLog = player && nation === player && hungerPenalty > 0.5;
  return {
    multipliers: newMultipliers,
    logMessage: shouldLog
      ? { text: `${nation.name} agricultural collapse: fallout starvation cripples output`, type: 'warning' }
      : undefined,
  };
};

/**
 * Apply sickness penalty from radiation effects
 * Caps at 40% reduction, affects uranium more severely
 */
export const applySicknessPenalty: ProductionModifier = (multipliers, context) => {
  const { nation } = context;
  const sicknessPenalty = Math.min(0.40, (nation.radiationSickness ?? 0) / 130);

  if (sicknessPenalty <= 0) {
    return { multipliers };
  }

  const penaltyFactor = 1 - sicknessPenalty;
  return {
    multipliers: {
      ...multipliers,
      production: multipliers.production * penaltyFactor,
      uranium: multipliers.uranium * Math.max(0.1, penaltyFactor - 0.1 * sicknessPenalty),
    },
  };
};

/**
 * Apply refugee flow penalty based on labor loss
 * Caps at 40% reduction
 */
export const applyRefugeePenalty: ProductionModifier = (multipliers, context) => {
  const { nation } = context;

  if (!nation.refugeeFlow || nation.refugeeFlow <= 0) {
    return { multipliers };
  }

  const laborLoss = Math.min(
    0.4,
    nation.refugeeFlow / Math.max(1, nation.population + nation.refugeeFlow)
  );

  return {
    multipliers: {
      ...multipliers,
      production: multipliers.production * (1 - laborLoss),
    },
  };
};

/**
 * Apply green shift penalty and decrement timer
 * Fixed 30% production reduction, 50% uranium reduction
 */
export const applyGreenShiftPenalty: ProductionModifier = (multipliers, context) => {
  const { nation, player } = context;

  if (!nation.greenShiftTurns || nation.greenShiftTurns <= 0) {
    return { multipliers };
  }

  // Note: The actual timer decrement happens in the main function
  // This modifier only calculates the multiplier effect
  const shouldLog = player && nation === player;

  return {
    multipliers: {
      ...multipliers,
      production: 0.7, // Fixed multiplier, overrides previous
      uranium: 0.5,    // Fixed multiplier, overrides previous
    },
    logMessage: shouldLog
      ? { text: 'Eco movement reduces nuclear production', type: 'warning' }
      : undefined,
  };
};

/**
 * Apply environmental treaty penalty
 * 30% reduction to both production and uranium
 */
export const applyEnvironmentPenalty: ProductionModifier = (multipliers, context) => {
  const { nation } = context;

  if (!nation.environmentPenaltyTurns || nation.environmentPenaltyTurns <= 0) {
    return { multipliers };
  }

  // Note: Timer decrement and expiration log happen in main function
  return {
    multipliers: {
      ...multipliers,
      production: multipliers.production * 0.7,
      uranium: multipliers.uranium * 0.7,
    },
  };
};

// =============================================================================
// Modifier Pipeline
// =============================================================================

/**
 * Default set of production modifiers applied in order
 */
export const DEFAULT_MODIFIERS: ProductionModifier[] = [
  applyHungerPenalty,
  applySicknessPenalty,
  applyRefugeePenalty,
  applyGreenShiftPenalty,
  applyEnvironmentPenalty,
];

/**
 * Apply all production modifiers in sequence
 *
 * @param context - The modifier context including nation and dependencies
 * @param modifiers - Array of modifier functions to apply (defaults to DEFAULT_MODIFIERS)
 * @returns Final multipliers and any log messages to display
 */
export function calculateProductionMultipliers(
  context: ModifierContext,
  modifiers: ProductionModifier[] = DEFAULT_MODIFIERS
): { multipliers: ProductionMultipliers; logMessages: Array<{ text: string; type: string }> } {
  const initialMultipliers: ProductionMultipliers = {
    production: 1,
    uranium: 1,
    intel: 1,
  };

  const logMessages: Array<{ text: string; type: string }> = [];

  const finalMultipliers = modifiers.reduce((currentMultipliers, modifier) => {
    const result = modifier(currentMultipliers, context);
    if (result.logMessage) {
      logMessages.push(result.logMessage);
    }
    return result.multipliers;
  }, initialMultipliers);

  return { multipliers: finalMultipliers, logMessages };
}

// =============================================================================
// Base Production Calculations
// =============================================================================

/**
 * Calculate base production values before modifiers
 */
export interface BaseProduction {
  production: number;
  uranium: number;
  intel: number;
}

export function calculateBaseProduction(nation: Nation): BaseProduction {
  const cities = nation.cities || 1;
  const population = nation.population;

  return {
    production: Math.floor(population * 0.20) + cities * 20,
    uranium: Math.floor(population * 0.025) + cities * 4,
    intel: Math.floor(population * 0.04) + cities * 3,
  };
}

// =============================================================================
// Economy Bonuses
// =============================================================================

export interface EconomyBonuses {
  productionMultiplier: number;
  uraniumPerTurn: number;
}

export function getEconomyBonuses(nation: Nation): EconomyBonuses {
  return {
    productionMultiplier: nation.productionMultiplier || 1.0,
    uraniumPerTurn: nation.uraniumPerTurn || 0,
  };
}

// =============================================================================
// Policy Effects Application
// =============================================================================

export interface AppliedPolicyEffects {
  productionModifier: number;
  recruitmentModifier: number;
  defenseBonus: number;
  missileAccuracyBonus: number;
  intelSuccessBonus: number;
  counterIntelBonus: number;
}

export function getPolicyEffects(
  policyEffects: PolicyEffects | undefined,
  isPolicyNation: boolean
): AppliedPolicyEffects {
  if (!isPolicyNation || !policyEffects) {
    return {
      productionModifier: 1,
      recruitmentModifier: 1,
      defenseBonus: 0,
      missileAccuracyBonus: 0,
      intelSuccessBonus: 0,
      counterIntelBonus: 0,
    };
  }

  return {
    productionModifier: policyEffects.productionModifier ?? 1,
    recruitmentModifier: policyEffects.militaryRecruitmentModifier ?? 1,
    defenseBonus: policyEffects.defenseBonus ?? 0,
    missileAccuracyBonus: policyEffects.missileAccuracyBonus ?? 0,
    intelSuccessBonus: policyEffects.espionageSuccessBonus ?? 0,
    counterIntelBonus: policyEffects.counterIntelBonus ?? 0,
  };
}

/**
 * Apply policy effects to a nation's state
 */
export function applyPolicyEffectsToNation(
  nation: Nation,
  effects: AppliedPolicyEffects
): void {
  nation.recruitmentPolicyModifier = effects.recruitmentModifier;
  nation.defensePolicyBonus = effects.defenseBonus;
  nation.missileAccuracyBonus = effects.missileAccuracyBonus;
  nation.intelSuccessBonus = effects.intelSuccessBonus;
  nation.counterIntelBonus = effects.counterIntelBonus;
}

// =============================================================================
// Final Production Calculation
// =============================================================================

export interface ProductionResult {
  productionGain: number;
  uraniumGain: number;
  intelGain: number;
}

/**
 * Calculate final production gains combining all factors
 */
export function calculateFinalProduction(
  baseProduction: BaseProduction,
  modifierMultipliers: ProductionMultipliers,
  economyBonuses: EconomyBonuses,
  moraleMultiplier: number,
  policyProductionModifier: number,
  hasCounterintel: boolean
): ProductionResult {
  const productionGain = Math.floor(
    baseProduction.production *
    modifierMultipliers.production *
    economyBonuses.productionMultiplier *
    moraleMultiplier *
    policyProductionModifier
  );

  const uraniumGain =
    Math.floor(
      baseProduction.uranium *
      modifierMultipliers.uranium *
      moraleMultiplier *
      policyProductionModifier
    ) + economyBonuses.uraniumPerTurn;

  let intelGain = Math.floor(
    baseProduction.intel * moraleMultiplier * policyProductionModifier
  );

  // Counter-intel research bonus
  if (hasCounterintel) {
    intelGain += Math.ceil(baseProduction.intel * 0.2);
  }

  return { productionGain, uraniumGain, intelGain };
}

// =============================================================================
// Instability Effects
// =============================================================================

export interface InstabilityResult {
  populationLoss: number;
  productionLoss: number;
  civilWarTriggered: boolean;
  newInstability: number;
}

/**
 * Calculate and apply instability effects
 */
export function calculateInstabilityEffects(nation: Nation): InstabilityResult {
  const instability = nation.instability ?? 0;

  if (instability <= 50) {
    return {
      populationLoss: 0,
      productionLoss: 0,
      civilWarTriggered: false,
      newInstability: Math.max(0, instability - 2), // Decay
    };
  }

  const unrest = Math.floor(instability / 10);
  const civilWarTriggered = instability > 100;

  return {
    populationLoss: unrest,
    productionLoss: unrest,
    civilWarTriggered,
    newInstability: civilWarTriggered ? 50 : Math.max(0, instability - 2),
  };
}

/**
 * Apply instability effects to a nation
 */
export function applyInstabilityEffects(
  nation: Nation,
  effects: InstabilityResult,
  log: (msg: string, type?: string) => void
): void {
  if (effects.populationLoss > 0) {
    nation.population = Math.max(0, nation.population - effects.populationLoss);
  }

  if (effects.productionLoss > 0) {
    nation.production = Math.max(0, nation.production - effects.productionLoss);
  }

  if (effects.civilWarTriggered) {
    log(`${nation.name} suffers civil war! Major losses!`, 'alert');
    nation.population *= 0.8;
  }

  nation.instability = effects.newInstability;
}

// =============================================================================
// Timer Updates
// =============================================================================

/**
 * Update various timers on a nation and return any expiration messages
 */
export function updateNationTimers(
  nation: Nation,
  log: (msg: string, type?: string) => void
): void {
  // Green shift timer
  if (nation.greenShiftTurns && nation.greenShiftTurns > 0) {
    nation.greenShiftTurns--;
  }

  // Environment penalty timer
  if (nation.environmentPenaltyTurns && nation.environmentPenaltyTurns > 0) {
    nation.environmentPenaltyTurns--;
    if (nation.environmentPenaltyTurns === 0 && nation.isPlayer) {
      log('Environmental treaty penalties have expired.', 'success');
    }
  }

  // Border closure timer
  if (nation.bordersClosedTurns && nation.bordersClosedTurns > 0) {
    nation.bordersClosedTurns--;
  }
}
