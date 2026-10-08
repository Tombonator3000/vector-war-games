import type { Nation } from '@/types/game';
import type { PolicyEffects } from '@/types/policy';
import { PRODUCTION_CONFIG, PENALTY_CONFIG, INSTABILITY_CONFIG } from '@/constants/gamePhase.constants';
import { calculateMoraleProductionMultiplier } from '@/hooks/useGovernance';
import { addStrategicResource } from '@/lib/territorialResourcesSystem';

function calculateProductionMultipliers(
  n: Nation,
  player: Nation | null,
  log: (msg: string, type?: string) => void
): { prodMult: number; uranMult: number } {
  let prodMult = 1;
  let uranMult = 1;

  // Fallout hunger penalty
  const hungerPenalty = Math.min(PENALTY_CONFIG.MAX_HUNGER_PENALTY, (n.falloutHunger ?? 0) / PENALTY_CONFIG.HUNGER_DIVISOR);
  if (hungerPenalty > 0) {
    prodMult *= 1 - hungerPenalty;
    if (player && n === player && hungerPenalty >= PENALTY_CONFIG.HUNGER_LOG_THRESHOLD) {
      log(`${n.name} agricultural collapse: fallout starvation cripples output`, 'warning');
    }
  }

  // Radiation sickness penalty
  const sicknessPenalty = Math.min(PENALTY_CONFIG.MAX_SICKNESS_PENALTY, (n.radiationSickness ?? 0) / PENALTY_CONFIG.SICKNESS_DIVISOR);
  if (sicknessPenalty > 0) {
    const penaltyFactor = 1 - sicknessPenalty;
    prodMult *= penaltyFactor;
    uranMult *= Math.max(PENALTY_CONFIG.MIN_URANIUM_MULT_SICKNESS, penaltyFactor - PENALTY_CONFIG.SICKNESS_URANIUM_FACTOR * sicknessPenalty);
  }

  // Refugee flow labor loss
  if (n.refugeeFlow && n.refugeeFlow > 0) {
    const laborLoss = Math.min(PENALTY_CONFIG.MAX_REFUGEE_LABOR_LOSS, n.refugeeFlow / Math.max(1, n.population + n.refugeeFlow));
    prodMult *= 1 - laborLoss;
  }

  // Green shift debuff
  if (n.greenShiftTurns && n.greenShiftTurns > 0) {
    prodMult *= PENALTY_CONFIG.GREEN_SHIFT_PROD_MULT;
    uranMult *= PENALTY_CONFIG.GREEN_SHIFT_URANIUM_MULT;
    n.greenShiftTurns--;
    if (player && n === player) {
      log('Eco movement reduces nuclear production', 'warning');
    }
  }

  // Environment penalty
  if (n.environmentPenaltyTurns && n.environmentPenaltyTurns > 0) {
    prodMult *= PENALTY_CONFIG.ENVIRONMENT_PENALTY_MULT;
    uranMult *= PENALTY_CONFIG.ENVIRONMENT_PENALTY_MULT;
    n.environmentPenaltyTurns--;
    if (n.environmentPenaltyTurns === 0 && n.isPlayer) {
      log('Environmental treaty penalties have expired.', 'success');
    }
  }

  return { prodMult, uranMult };
}

function applyPolicyEffectsToNation(
  n: Nation,
  policyNationId: string | undefined,
  policyEffects: PolicyEffects | undefined
): { isPolicyNation: boolean; policyProductionModifier: number } {
  const isPolicyNation = policyNationId === n.id;
  const policyProductionModifier =
    isPolicyNation && policyEffects?.productionModifier !== undefined ? policyEffects.productionModifier : 1;

  n.recruitmentPolicyModifier = isPolicyNation ? policyEffects?.militaryRecruitmentModifier ?? 1 : 1;
  n.defensePolicyBonus = isPolicyNation ? policyEffects?.defenseBonus ?? 0 : 0;
  n.missileAccuracyBonus = isPolicyNation ? policyEffects?.missileAccuracyBonus ?? 0 : 0;
  n.intelSuccessBonus = isPolicyNation ? policyEffects?.espionageSuccessBonus ?? 0 : 0;
  n.counterIntelBonus = isPolicyNation ? policyEffects?.counterIntelBonus ?? 0 : 0;

  return { isPolicyNation, policyProductionModifier };
}

function processInstabilityEffects(
  n: Nation,
  log: (msg: string, type?: string) => void
): void {
  if (n.instability && n.instability > INSTABILITY_CONFIG.EFFECT_THRESHOLD) {
    const unrest = Math.floor(n.instability / INSTABILITY_CONFIG.UNREST_DIVISOR);
    n.population = Math.max(0, n.population - unrest);
    n.production = Math.max(0, n.production - unrest);
    if (n.instability > INSTABILITY_CONFIG.CIVIL_WAR_THRESHOLD) {
      log(`${n.name} suffers civil war! Major losses!`, 'alert');
      n.population *= INSTABILITY_CONFIG.CIVIL_WAR_POP_MULT;
      n.instability = INSTABILITY_CONFIG.CIVIL_WAR_INSTABILITY_RESET;
    }
  }

  // Decay instability slowly
  if (n.instability) {
    n.instability = Math.max(0, n.instability - INSTABILITY_CONFIG.DECAY_PER_TURN);
  }
}

function calculateNationBaseProduction(
  n: Nation,
  player: Nation | null,
  policyNationId: string | undefined,
  policyEffects: PolicyEffects | undefined,
  log: (msg: string, type?: string) => void
): void {
  if (n.population <= 0 || n.eliminated) return;

  // Calculate base values
  const baseProduction = Math.floor(n.population * PRODUCTION_CONFIG.POPULATION_PROD_MULT);
  const baseProd = baseProduction + (n.cities ?? 1) * PRODUCTION_CONFIG.CITY_PROD_BONUS;
  const baseUranium = Math.floor(n.population * PRODUCTION_CONFIG.POPULATION_URANIUM_MULT) + (n.cities ?? 1) * PRODUCTION_CONFIG.CITY_URANIUM_BONUS;
  const baseIntel = Math.floor(n.population * PRODUCTION_CONFIG.POPULATION_INTEL_MULT) + (n.cities ?? 1) * PRODUCTION_CONFIG.CITY_INTEL_BONUS;

  // Calculate multipliers from penalties/bonuses
  const { prodMult, uranMult } = calculateProductionMultipliers(n, player, log);

  // Apply economy tech bonuses
  const economyProdMult = n.productionMultiplier ?? 1.0;
  const economyUraniumBonus = n.uraniumPerTurn || 0;
  const moraleMultiplier = calculateMoraleProductionMultiplier(n.morale ?? 0);

  // Apply policy effects
  const { policyProductionModifier } = applyPolicyEffectsToNation(n, policyNationId, policyEffects);

  // Calculate final production values
  const productionGain = Math.floor(
    baseProd * prodMult * economyProdMult * moraleMultiplier * policyProductionModifier
  );
  n.production += productionGain;

  const uraniumGain = Math.floor(baseUranium * uranMult * moraleMultiplier * policyProductionModifier) + economyUraniumBonus;
  addStrategicResource(n, 'uranium', uraniumGain);

  n.intel += Math.floor(baseIntel * moraleMultiplier * policyProductionModifier);

  // Process instability effects
  processInstabilityEffects(n, log);

  // Border closure countdown
  if (n.bordersClosedTurns && n.bordersClosedTurns > 0) {
    n.bordersClosedTurns--;
  }

  // Counterintel research bonus
  if (n.researched?.counterintel) {
    const intelBonus = Math.ceil(baseIntel * PRODUCTION_CONFIG.COUNTERINTEL_BONUS_MULT);
    n.intel += intelBonus;
  }
}

export function processNationProductions(
  nations: Nation[],
  player: Nation | null,
  policyNationId: string | undefined,
  policyEffects: PolicyEffects | undefined,
  log: (msg: string, type?: string) => void
): void {
  for (const n of nations) {
    calculateNationBaseProduction(n, player, policyNationId, policyEffects, log);
  }
}
