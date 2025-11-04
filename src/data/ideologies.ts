/**
 * Ideology Definitions
 *
 * Defines all available ideologies with their bonuses, characteristics,
 * and display information.
 */

import { IdeologyType, IdeologyBonuses, IdeologyInfo } from '../types/ideology';

/**
 * Bonuses for each ideology type
 */
export const IDEOLOGY_BONUSES: Record<IdeologyType, IdeologyBonuses> = {
  democracy: {
    productionMultiplier: 1.0,
    diplomacyPerTurn: 2,
    researchMultiplier: 1.1,
    culturalPowerBonus: 0,
    moraleLossReduction: 0.1,
    populationHappinessBonus: 10,
    culturalDefenseBonus: 5,
    propagandaEffectiveness: 0.9,
    cyberWarfareBonus: 0,
    electionBonus: 15,
    intelBonus: 5,
    unitAttackBonus: 0,
    unitDefenseBonus: 0,
    immigrationModifier: 1.2,
  },

  authoritarianism: {
    productionMultiplier: 1.15,
    diplomacyPerTurn: -1,
    researchMultiplier: 0.95,
    culturalPowerBonus: -5,
    moraleLossReduction: 0.3,
    populationHappinessBonus: -10,
    culturalDefenseBonus: 0,
    propagandaEffectiveness: 1.1,
    cyberWarfareBonus: 5,
    electionBonus: -10,
    intelBonus: 10,
    unitAttackBonus: 5,
    unitDefenseBonus: 5,
    immigrationModifier: 0.7,
  },

  communism: {
    productionMultiplier: 1.05,
    diplomacyPerTurn: 0,
    researchMultiplier: 1.0,
    culturalPowerBonus: 5,
    moraleLossReduction: 0.15,
    populationHappinessBonus: 5,
    culturalDefenseBonus: 15,
    propagandaEffectiveness: 1.15,
    cyberWarfareBonus: 0,
    electionBonus: -5,
    intelBonus: 5,
    unitAttackBonus: 0,
    unitDefenseBonus: 10,
    immigrationModifier: 0.8,
  },

  theocracy: {
    productionMultiplier: 0.95,
    diplomacyPerTurn: -1,
    researchMultiplier: 0.9,
    culturalPowerBonus: 15,
    moraleLossReduction: 0.2,
    populationHappinessBonus: 0,
    culturalDefenseBonus: 10,
    propagandaEffectiveness: 1.25,
    cyberWarfareBonus: -5,
    electionBonus: -15,
    intelBonus: 0,
    unitAttackBonus: 10,
    unitDefenseBonus: 5,
    immigrationModifier: 0.6,
  },

  technocracy: {
    productionMultiplier: 1.1,
    diplomacyPerTurn: 0,
    researchMultiplier: 1.3,
    culturalPowerBonus: 0,
    moraleLossReduction: 0.05,
    populationHappinessBonus: 0,
    culturalDefenseBonus: 5,
    propagandaEffectiveness: 1.0,
    cyberWarfareBonus: 20,
    electionBonus: 0,
    intelBonus: 15,
    unitAttackBonus: 0,
    unitDefenseBonus: 0,
    immigrationModifier: 1.1,
  },
};

/**
 * Full information about each ideology
 */
export const IDEOLOGY_INFO: Record<IdeologyType, IdeologyInfo> = {
  democracy: {
    type: 'democracy',
    name: 'Democracy',
    description:
      'A system of government where power is vested in the people, who rule through elected representatives.',
    icon: '🗳️',
    color: '#3b82f6',
    bonuses: IDEOLOGY_BONUSES.democracy,
    strengths: [
      '+2 Diplomacy points per turn',
      '+15% election quality bonus',
      '+10% research speed',
      '+20% immigration attraction',
      '+10 population happiness',
      'Reduced morale loss',
    ],
    weaknesses: [
      'Lower propaganda effectiveness',
      'No military bonuses',
      'Slower policy implementation',
    ],
  },

  authoritarianism: {
    type: 'authoritarianism',
    name: 'Authoritarianism',
    description:
      'A system characterized by strong central power and limited political freedoms.',
    icon: '👑',
    color: '#ef4444',
    bonuses: IDEOLOGY_BONUSES.authoritarianism,
    strengths: [
      '+15% production bonus',
      '+5 attack and defense for all units',
      '+30% reduced morale penalty',
      '+10 intel generation',
      '+10% propaganda effectiveness',
      '+5 cyber warfare',
    ],
    weaknesses: [
      '-1 diplomacy per turn',
      '-10 population happiness',
      '-30% immigration attraction',
      '-10% election quality',
      'Lower cultural power',
    ],
  },

  communism: {
    type: 'communism',
    name: 'Communism',
    description:
      'An ideology advocating for collective ownership and equal distribution of resources.',
    icon: '☭',
    color: '#dc2626',
    bonuses: IDEOLOGY_BONUSES.communism,
    strengths: [
      '+15% cultural defense',
      '+15% propaganda effectiveness',
      '+5 cultural power',
      '+5 population happiness',
      '+10 defense bonus',
      'Reduced morale loss',
    ],
    weaknesses: [
      '-20% immigration attraction',
      'Slight election quality penalty',
      'Moderate production bonus only',
    ],
  },

  theocracy: {
    type: 'theocracy',
    name: 'Theocracy',
    description:
      'A system of government in which religious leaders control political power.',
    icon: '✝️',
    color: '#fbbf24',
    bonuses: IDEOLOGY_BONUSES.theocracy,
    strengths: [
      '+15 cultural power',
      '+25% propaganda effectiveness',
      '+10 attack bonus',
      '+20% reduced morale loss',
      '+10% cultural defense',
    ],
    weaknesses: [
      '-5% production',
      '-10% research speed',
      '-15% election quality',
      '-40% immigration attraction',
      '-5 cyber warfare',
    ],
  },

  technocracy: {
    type: 'technocracy',
    name: 'Technocracy',
    description:
      'A system of governance where decision-makers are selected based on technical expertise.',
    icon: '⚡',
    color: '#8b5cf6',
    bonuses: IDEOLOGY_BONUSES.technocracy,
    strengths: [
      '+30% research speed',
      '+20 cyber warfare bonus',
      '+15 intel generation',
      '+10% production bonus',
      '+10% immigration attraction',
    ],
    weaknesses: [
      'Minimal morale loss reduction',
      'No election quality bonus',
      'No cultural power bonus',
      'No military bonuses',
    ],
  },
};

/**
 * Default ideology spread configuration
 */
export const DEFAULT_IDEOLOGY_SPREAD_CONFIG = {
  baseIntelCost: 20,
  baseStrength: 10,
  culturalPowerMultiplier: 0.5,
  distanceDecay: 0.8,
  relationshipBonus: 0.3,
};

/**
 * Thresholds for revolution risk
 */
export const REVOLUTION_THRESHOLDS = {
  /** Morale below this triggers revolution risk */
  MORALE_THRESHOLD: 30,

  /** Cabinet approval below this increases risk */
  APPROVAL_THRESHOLD: 25,

  /** Revolution risk above this triggers revolution */
  REVOLUTION_TRIGGER: 80,

  /** Turns of high risk before revolution */
  TURNS_UNTIL_REVOLUTION: 3,
};

/**
 * Ideology compatibility matrix (0-100)
 * Higher values mean more compatible ideologies
 */
export const IDEOLOGY_COMPATIBILITY: Record<IdeologyType, Record<IdeologyType, number>> = {
  democracy: {
    democracy: 100,
    authoritarianism: 20,
    communism: 30,
    theocracy: 40,
    technocracy: 70,
  },
  authoritarianism: {
    democracy: 20,
    authoritarianism: 100,
    communism: 40,
    theocracy: 60,
    technocracy: 50,
  },
  communism: {
    democracy: 30,
    authoritarianism: 40,
    communism: 100,
    theocracy: 35,
    technocracy: 45,
  },
  theocracy: {
    democracy: 40,
    authoritarianism: 60,
    communism: 35,
    theocracy: 100,
    technocracy: 25,
  },
  technocracy: {
    democracy: 70,
    authoritarianism: 50,
    communism: 45,
    theocracy: 25,
    technocracy: 100,
  },
};

/**
 * Calculate relationship modifier based on ideology compatibility
 */
export function getIdeologyRelationshipModifier(
  ideology1: IdeologyType,
  ideology2: IdeologyType
): number {
  const compatibility = IDEOLOGY_COMPATIBILITY[ideology1][ideology2];

  // Convert 0-100 compatibility to -20 to +20 relationship modifier
  return Math.round((compatibility - 50) * 0.4);
}

/**
 * Get initial ideological support distribution for a new nation
 */
export function getInitialIdeologicalSupport(primaryIdeology: IdeologyType): Record<IdeologyType, number> {
  const support: Record<IdeologyType, number> = {
    democracy: 20,
    authoritarianism: 20,
    communism: 20,
    theocracy: 20,
    technocracy: 20,
  };

  // Primary ideology gets majority support
  support[primaryIdeology] = 60;

  // Distribute remaining support based on compatibility
  const compatibilities = IDEOLOGY_COMPATIBILITY[primaryIdeology];
  const otherIdeologies = (Object.keys(support) as IdeologyType[]).filter((id) => id !== primaryIdeology);

  const totalCompatibility = otherIdeologies.reduce((sum, id) => sum + compatibilities[id], 0);

  otherIdeologies.forEach((ideology) => {
    const compatibilityRatio = compatibilities[ideology] / totalCompatibility;
    support[ideology] = Math.round(40 * compatibilityRatio);
  });

  return support;
}
