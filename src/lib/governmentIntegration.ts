/**
 * Government System Integration
 *
 * Integrates government mechanics with the game's turn processing,
 * diplomacy, elections, and other systems.
 */

import type { Nation } from '../types/game';
import type { GovernmentState, GovernmentType } from '../types/government';
import { GOVERNMENT_BONUSES, getElectionInterval } from '../types/government';

/**
 * Determine default government type for a nation based on characteristics
 */
function determineDefaultGovernment(nation: Nation): GovernmentType {
  // Player starts with democracy
  if (nation.isPlayer) return 'democracy';

  // Assign based on AI personality, doctrine, or ideology
  if (nation.aiPersonality === 'aggressive') return 'military_junta';
  if (nation.aiPersonality === 'defensive') return 'democracy';
  if (nation.aiPersonality === 'expansionist') return 'dictatorship';

  // Based on doctrine
  if (nation.doctrine === 'isolationist') return 'absolute_monarchy';
  if (nation.doctrine === 'diplomatic') return 'constitutional_monarchy';
  if (nation.doctrine === 'scientific') return 'technocracy';
  if (nation.doctrine === 'militarist') return 'military_junta';

  // Based on ideology (if it exists)
  if (nation.ideologyState) {
    const ideology = nation.ideologyState.currentIdeology;
    if (ideology === 'democracy') return 'democracy';
    if (ideology === 'authoritarianism') return 'dictatorship';
    if (ideology === 'communism') return 'one_party_state';
    if (ideology === 'theocracy') return 'theocracy';
    if (ideology === 'technocracy') return 'technocracy';
  }

  // Random assignment weighted toward common types
  const governments: GovernmentType[] = [
    'democracy',
    'democracy', // More democracies
    'constitutional_monarchy',
    'dictatorship',
    'military_junta',
    'one_party_state',
    'absolute_monarchy',
    'technocracy',
    'theocracy',
  ];
  return governments[Math.floor(Math.random() * governments.length)];
}

/**
 * Initialize default government state
 */
function initializeDefaultGovernmentState(governmentType: GovernmentType): GovernmentState {
  return {
    currentGovernment: governmentType,
    governmentStability: 70,
    legitimacy: 65,
    governmentSupport: {
      democracy: governmentType === 'democracy' ? 45 : 15,
      constitutional_monarchy: governmentType === 'constitutional_monarchy' ? 45 : 10,
      dictatorship: governmentType === 'dictatorship' ? 45 : 8,
      military_junta: governmentType === 'military_junta' ? 45 : 5,
      one_party_state: governmentType === 'one_party_state' ? 45 : 12,
      absolute_monarchy: governmentType === 'absolute_monarchy' ? 45 : 8,
      technocracy: governmentType === 'technocracy' ? 45 : 10,
      theocracy: governmentType === 'theocracy' ? 45 : 7,
    },
    cameByForce: false,
    coupRisk: 15,
    successionClarity: governmentType === 'democracy' ? 100 : 70,
    turnsInPower: 0,
  };
}

/**
 * Initialize government system for all nations
 */
export function initializeGovernmentSystem(nations: Nation[]): void {
  nations.forEach((nation) => {
    if (!nation.governmentState) {
      const defaultGovernment = determineDefaultGovernment(nation);
      nation.governmentState = initializeDefaultGovernmentState(defaultGovernment);
    }
    // Initialize unlocked governments (all nations start with democracy unlocked)
    if (!nation.unlockedGovernments) {
      nation.unlockedGovernments = ['democracy'];
    }
  });
}

/**
 * Apply government bonuses to a nation
 * This should be called when calculating production, research, etc.
 */
export function applyGovernmentBonuses(nation: Nation): {
  productionMultiplier: number;
  researchMultiplier: number;
  recruitmentMultiplier: number;
  militaryCostReduction: number;
  diplomaticInfluenceBonus: number;
  baseStabilityModifier: number;
  oppositionSuppressionMultiplier: number;
  propagandaEffectiveness: number;
  intelBonus: number;
} {
  if (!nation.governmentState) {
    // No government state, return neutral bonuses
    return {
      productionMultiplier: 1.0,
      researchMultiplier: 1.0,
      recruitmentMultiplier: 1.0,
      militaryCostReduction: 0,
      diplomaticInfluenceBonus: 0,
      baseStabilityModifier: 0,
      oppositionSuppressionMultiplier: 1.0,
      propagandaEffectiveness: 1.0,
      intelBonus: 0,
    };
  }

  const bonuses = GOVERNMENT_BONUSES[nation.governmentState.currentGovernment];

  return {
    productionMultiplier: bonuses.productionMultiplier,
    researchMultiplier: bonuses.researchMultiplier,
    recruitmentMultiplier: bonuses.recruitmentMultiplier,
    militaryCostReduction: bonuses.militaryCostReduction,
    diplomaticInfluenceBonus: bonuses.diplomaticInfluenceBonus,
    baseStabilityModifier: bonuses.baseStabilityModifier,
    oppositionSuppressionMultiplier: bonuses.oppositionSuppressionMultiplier,
    propagandaEffectiveness: bonuses.propagandaEffectiveness,
    intelBonus: bonuses.intelBonus,
  };
}

/**
 * Get government production multiplier for easy integration
 */
export function getGovernmentProductionMultiplier(nation: Nation): number {
  const bonuses = applyGovernmentBonuses(nation);
  return bonuses.productionMultiplier;
}

/**
 * Get government research multiplier for easy integration
 */
export function getGovernmentResearchMultiplier(nation: Nation): number {
  const bonuses = applyGovernmentBonuses(nation);
  return bonuses.researchMultiplier;
}

/**
 * Get government recruitment multiplier for easy integration
 */
export function getGovernmentRecruitmentMultiplier(nation: Nation): number {
  const bonuses = applyGovernmentBonuses(nation);
  return bonuses.recruitmentMultiplier;
}

/**
 * Get government military cost reduction for easy integration
 */
export function getGovernmentMilitaryCostReduction(nation: Nation): number {
  const bonuses = applyGovernmentBonuses(nation);
  return bonuses.militaryCostReduction;
}

/**
 * Get opposition suppression multiplier for use in opposition system
 */
export function getGovernmentOppositionSuppression(nation: Nation): number {
  const bonuses = applyGovernmentBonuses(nation);
  return bonuses.oppositionSuppressionMultiplier;
}

/**
 * Get propaganda effectiveness multiplier
 */
export function getGovernmentPropagandaEffectiveness(nation: Nation): number {
  const bonuses = applyGovernmentBonuses(nation);
  return bonuses.propagandaEffectiveness;
}

/**
 * Check if a nation should hold elections based on government type
 */
export function shouldNationHoldElections(nation: Nation): boolean {
  if (!nation.governmentState) return true; // Default to yes if no gov state

  const interval = getElectionInterval(nation.governmentState.currentGovernment);
  return interval > 0; // Elections if interval > 0
}

/**
 * Get election interval for a nation
 */
export function getNationElectionInterval(nation: Nation): number {
  if (!nation.governmentState) return 12; // Default interval

  return getElectionInterval(nation.governmentState.currentGovernment);
}

/**
 * Apply government bonuses to production for all nations
 * Should be called before production phase calculations
 */
export function applyGovernmentBonusesForProduction(nations: Nation[]): void {
  nations.forEach((nation) => {
    if (nation.population <= 0 || nation.eliminated) return;
    if (!nation.governmentState) return;

    const bonuses = applyGovernmentBonuses(nation);

    // Apply production multiplier
    if (!nation.productionMultiplier) {
      nation.productionMultiplier = 1.0;
    }
    nation.productionMultiplier *= bonuses.productionMultiplier;

    // Note: Research multiplier bonus is applied but not stored
    // as a persistent property on the nation

    // Apply other bonuses as needed
    // These can be read when needed in other systems
  });
}
