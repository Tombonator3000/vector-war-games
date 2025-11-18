/**
 * Government System for Vector War Games
 *
 * Defines government types that control how political systems, elections,
 * opposition, and internal stability work for each nation.
 */

/**
 * Available government types
 */
export type GovernmentType =
  | 'democracy'
  | 'constitutional_monarchy'
  | 'dictatorship'
  | 'military_junta'
  | 'one_party_state'
  | 'absolute_monarchy'
  | 'technocracy'
  | 'theocracy';

/**
 * Government state for a nation
 */
export interface GovernmentState {
  /** Current government type */
  currentGovernment: GovernmentType;

  /** Stability of the current government (0-100) */
  governmentStability: number;

  /** Legitimacy of the current government (0-100) */
  legitimacy: number;

  /** Support levels for each government type among population */
  governmentSupport: Record<GovernmentType, number>;

  /** Turn when government was last changed */
  lastGovernmentChangeTurn?: number;

  /** Whether this government came to power through force */
  cameByForce: boolean;

  /** Coup risk level (0-100) */
  coupRisk: number;

  /** Succession plan clarity (higher = smoother transitions) */
  successionClarity: number;

  /** Years/turns in power (affects legitimacy over time) */
  turnsInPower: number;
}

/**
 * Bonuses and modifiers granted by each government type
 */
export interface GovernmentBonuses {
  /** Production multiplier */
  productionMultiplier: number;

  /** Research speed multiplier */
  researchMultiplier: number;

  /** Political power generation per turn */
  politicalPowerPerTurn: number;

  /** Military recruitment speed multiplier */
  recruitmentMultiplier: number;

  /** Military cost reduction (0-1, where 0.2 = 20% cheaper) */
  militaryCostReduction: number;

  /** Diplomatic influence bonus */
  diplomaticInfluenceBonus: number;

  /** Base stability modifier */
  baseStabilityModifier: number;

  /** Opposition strength modifier (multiplier, <1 = suppressed) */
  oppositionSuppressionMultiplier: number;

  /** Election frequency modifier (0 = no elections) */
  electionFrequencyModifier: number;

  /** War declaration ease (lower = easier to declare war) */
  warDeclarationThreshold: number;

  /** Popular unrest threshold (higher = more tolerant) */
  unrestTolerance: number;

  /** Coup resistance (0-100, higher = more resistant) */
  coupResistance: number;

  /** Intel generation bonus */
  intelBonus: number;

  /** Propaganda effectiveness */
  propagandaEffectiveness: number;

  /** Cultural power bonus */
  culturalPowerBonus: number;

  /** Economic freedom multiplier */
  economicFreedomMultiplier: number;

  /** Civil liberties level (0-100) */
  civilLibertiesLevel: number;
}

/**
 * Government transition event
 */
export interface GovernmentTransition {
  /** Turn when transition occurred */
  turn: number;

  /** Previous government type */
  fromGovernment: GovernmentType;

  /** New government type */
  toGovernment: GovernmentType;

  /** How the transition occurred */
  transitionType: 'election' | 'coup' | 'revolution' | 'reform' | 'collapse' | 'war_loss' | 'inheritance';

  /** Whether transition was peaceful */
  peaceful: boolean;

  /** Stability cost of transition */
  stabilityCost: number;

  /** Description of transition */
  description: string;
}

/**
 * Coup attempt state
 */
export interface CoupAttempt {
  /** Turn when coup attempt occurred */
  turn: number;

  /** Faction behind the coup */
  faction: string;

  /** Target government type after coup */
  targetGovernment: GovernmentType;

  /** Coup strength (0-100) */
  strength: number;

  /** Whether coup succeeded */
  succeeded: boolean;

  /** Casualties from coup attempt */
  casualties?: number;
}

/**
 * Government reform tracking
 */
export interface GovernmentReform {
  /** Reform identifier */
  id: string;

  /** Reform name */
  name: string;

  /** Turn implemented */
  implementedTurn: number;

  /** Stability cost */
  stabilityCost: number;

  /** Legitimacy gained */
  legitimacyGain: number;

  /** Effects of the reform */
  effects: Partial<GovernmentBonuses>;
}

/**
 * Event triggered by government system
 */
export interface GovernmentEvent {
  /** Event type */
  type: 'coup_attempt' | 'government_change' | 'succession_crisis' | 'reform' | 'legitimacy_crisis';

  /** Nation(s) affected */
  affectedNations: string[];

  /** Government involved */
  government: GovernmentType;

  /** Event description */
  description: string;

  /** Turn when event occurred */
  turn: number;

  /** Severity of event */
  severity: 'minor' | 'moderate' | 'major' | 'critical';
}

/**
 * Get government display information
 */
export interface GovernmentInfo {
  type: GovernmentType;
  name: string;
  description: string;
  icon: string;
  color: string;
  bonuses: GovernmentBonuses;
  strengths: string[];
  weaknesses: string[];
  electionInfo: string;
}

/**
 * Predefined government type bonuses
 */
export const GOVERNMENT_BONUSES: Record<GovernmentType, GovernmentBonuses> = {
  democracy: {
    productionMultiplier: 1.0,
    researchMultiplier: 1.15,
    politicalPowerPerTurn: 2,
    recruitmentMultiplier: 0.9,
    militaryCostReduction: 0,
    diplomaticInfluenceBonus: 15,
    baseStabilityModifier: 10,
    oppositionSuppressionMultiplier: 1.0, // Full opposition activity
    electionFrequencyModifier: 1.0, // Regular elections
    warDeclarationThreshold: 0.7, // Hard to declare war
    unrestTolerance: 60,
    coupResistance: 80,
    intelBonus: 5,
    propagandaEffectiveness: 0.8,
    culturalPowerBonus: 10,
    economicFreedomMultiplier: 1.2,
    civilLibertiesLevel: 85,
  },
  constitutional_monarchy: {
    productionMultiplier: 1.05,
    researchMultiplier: 1.1,
    politicalPowerPerTurn: 3,
    recruitmentMultiplier: 1.0,
    militaryCostReduction: 0,
    diplomaticInfluenceBonus: 20,
    baseStabilityModifier: 15,
    oppositionSuppressionMultiplier: 0.7, // Moderate suppression
    electionFrequencyModifier: 1.0, // Regular elections
    warDeclarationThreshold: 0.5,
    unrestTolerance: 55,
    coupResistance: 70,
    intelBonus: 8,
    propagandaEffectiveness: 1.0,
    culturalPowerBonus: 15,
    economicFreedomMultiplier: 1.1,
    civilLibertiesLevel: 75,
  },
  dictatorship: {
    productionMultiplier: 0.95,
    researchMultiplier: 0.9,
    politicalPowerPerTurn: 5,
    recruitmentMultiplier: 1.3,
    militaryCostReduction: 0.1,
    diplomaticInfluenceBonus: -10,
    baseStabilityModifier: -5,
    oppositionSuppressionMultiplier: 0.3, // Heavy suppression
    electionFrequencyModifier: 0, // No elections
    warDeclarationThreshold: 0.2, // Easy to declare war
    unrestTolerance: 35,
    coupResistance: 40,
    intelBonus: 15,
    propagandaEffectiveness: 1.3,
    culturalPowerBonus: -5,
    economicFreedomMultiplier: 0.8,
    civilLibertiesLevel: 20,
  },
  military_junta: {
    productionMultiplier: 0.9,
    researchMultiplier: 0.85,
    politicalPowerPerTurn: 4,
    recruitmentMultiplier: 1.5,
    militaryCostReduction: 0.2,
    diplomaticInfluenceBonus: -15,
    baseStabilityModifier: -10,
    oppositionSuppressionMultiplier: 0.2, // Very heavy suppression
    electionFrequencyModifier: 0, // No elections
    warDeclarationThreshold: 0.1, // Very easy to declare war
    unrestTolerance: 30,
    coupResistance: 50,
    intelBonus: 20,
    propagandaEffectiveness: 1.1,
    culturalPowerBonus: -10,
    economicFreedomMultiplier: 0.75,
    civilLibertiesLevel: 15,
  },
  one_party_state: {
    productionMultiplier: 1.1,
    researchMultiplier: 1.05,
    politicalPowerPerTurn: 4,
    recruitmentMultiplier: 1.2,
    militaryCostReduction: 0.05,
    diplomaticInfluenceBonus: -5,
    baseStabilityModifier: 5,
    oppositionSuppressionMultiplier: 0.4, // Heavy suppression
    electionFrequencyModifier: 0.5, // Rare "elections"
    warDeclarationThreshold: 0.3,
    unrestTolerance: 40,
    coupResistance: 60,
    intelBonus: 18,
    propagandaEffectiveness: 1.4,
    culturalPowerBonus: 5,
    economicFreedomMultiplier: 0.85,
    civilLibertiesLevel: 30,
  },
  absolute_monarchy: {
    productionMultiplier: 1.0,
    researchMultiplier: 0.95,
    politicalPowerPerTurn: 4,
    recruitmentMultiplier: 1.1,
    militaryCostReduction: 0,
    diplomaticInfluenceBonus: 10,
    baseStabilityModifier: 20,
    oppositionSuppressionMultiplier: 0.5, // Moderate suppression
    electionFrequencyModifier: 0, // No elections
    warDeclarationThreshold: 0.25,
    unrestTolerance: 45,
    coupResistance: 55,
    intelBonus: 10,
    propagandaEffectiveness: 1.2,
    culturalPowerBonus: 20,
    economicFreedomMultiplier: 0.9,
    civilLibertiesLevel: 35,
  },
  technocracy: {
    productionMultiplier: 1.15,
    researchMultiplier: 1.3,
    politicalPowerPerTurn: 3,
    recruitmentMultiplier: 0.85,
    militaryCostReduction: 0,
    diplomaticInfluenceBonus: 5,
    baseStabilityModifier: 5,
    oppositionSuppressionMultiplier: 0.6, // Moderate suppression
    electionFrequencyModifier: 0.7, // Reduced elections
    warDeclarationThreshold: 0.6,
    unrestTolerance: 50,
    coupResistance: 65,
    intelBonus: 12,
    propagandaEffectiveness: 0.9,
    culturalPowerBonus: 8,
    economicFreedomMultiplier: 1.15,
    civilLibertiesLevel: 65,
  },
  theocracy: {
    productionMultiplier: 0.95,
    researchMultiplier: 0.8,
    politicalPowerPerTurn: 4,
    recruitmentMultiplier: 1.25,
    militaryCostReduction: 0,
    diplomaticInfluenceBonus: -5,
    baseStabilityModifier: 15,
    oppositionSuppressionMultiplier: 0.35, // Heavy suppression
    electionFrequencyModifier: 0, // No elections
    warDeclarationThreshold: 0.3,
    unrestTolerance: 40,
    coupResistance: 70,
    intelBonus: 8,
    propagandaEffectiveness: 1.5,
    culturalPowerBonus: 25,
    economicFreedomMultiplier: 0.85,
    civilLibertiesLevel: 25,
  },
};

/**
 * Government information for display
 */
export const GOVERNMENT_INFO: Record<GovernmentType, GovernmentInfo> = {
  democracy: {
    type: 'democracy',
    name: 'Democracy',
    description: 'Power derives from free and fair elections with regular transitions of power.',
    icon: '🗳️',
    color: '#3b82f6',
    bonuses: GOVERNMENT_BONUSES.democracy,
    strengths: ['High stability with public support', 'Strong research and diplomacy', 'Coup resistant', 'High civil liberties'],
    weaknesses: ['Slower military buildup', 'War requires justification', 'Active opposition', 'Vulnerable to public opinion'],
    electionInfo: 'Elections every 12 turns',
  },
  constitutional_monarchy: {
    type: 'constitutional_monarchy',
    name: 'Constitutional Monarchy',
    description: 'Ceremonial monarch with elected parliament and democratic institutions.',
    icon: '👑',
    color: '#8b5cf6',
    bonuses: GOVERNMENT_BONUSES.constitutional_monarchy,
    strengths: ['Excellent stability', 'Strong diplomatic prestige', 'Balanced governance', 'Cultural bonuses'],
    weaknesses: ['Moderate suppression needed', 'Succession complexities', 'Tradition-bound'],
    electionInfo: 'Elections every 12 turns',
  },
  dictatorship: {
    type: 'dictatorship',
    name: 'Dictatorship',
    description: 'Autocratic rule by a single leader with absolute power and suppressed opposition.',
    icon: '👤',
    color: '#ef4444',
    bonuses: GOVERNMENT_BONUSES.dictatorship,
    strengths: ['Fast military mobilization', 'Strong intel apparatus', 'Quick decisions', 'Heavy opposition suppression'],
    weaknesses: ['High coup risk', 'Low legitimacy', 'Poor research', 'International isolation'],
    electionInfo: 'No elections',
  },
  military_junta: {
    type: 'military_junta',
    name: 'Military Junta',
    description: 'Military officers rule directly with martial law and military priorities.',
    icon: '⚔️',
    color: '#dc2626',
    bonuses: GOVERNMENT_BONUSES.military_junta,
    strengths: ['Rapid military expansion', 'Cheap military units', 'Strong intel', 'Efficient war machine'],
    weaknesses: ['Very unstable', 'Economic weakness', 'International pariah', 'Brutal suppression required'],
    electionInfo: 'No elections',
  },
  one_party_state: {
    type: 'one_party_state',
    name: 'One-Party State',
    description: 'Single party controls all government with no legal opposition.',
    icon: '🏛️',
    color: '#f59e0b',
    bonuses: GOVERNMENT_BONUSES.one_party_state,
    strengths: ['Strong production', 'Effective propaganda', 'Controlled stability', 'Organized mobilization'],
    weaknesses: ['Suppressed innovation', 'Limited freedoms', 'Rigid ideology', 'Rare political change'],
    electionInfo: 'Show elections every 24 turns',
  },
  absolute_monarchy: {
    type: 'absolute_monarchy',
    name: 'Absolute Monarchy',
    description: 'Hereditary ruler with unlimited power and divine right to rule.',
    icon: '♔',
    color: '#a855f7',
    bonuses: GOVERNMENT_BONUSES.absolute_monarchy,
    strengths: ['Excellent stability', 'Clear succession', 'Strong cultural identity', 'Long-term planning'],
    weaknesses: ['No democratic input', 'Succession crises possible', 'Resistant to change', 'Limited freedoms'],
    electionInfo: 'No elections (hereditary succession)',
  },
  technocracy: {
    type: 'technocracy',
    name: 'Technocracy',
    description: 'Rule by technical experts and scientists based on rational decision-making.',
    icon: '🔬',
    color: '#06b6d4',
    bonuses: GOVERNMENT_BONUSES.technocracy,
    strengths: ['Exceptional research', 'Strong production', 'Efficient governance', 'Evidence-based policy'],
    weaknesses: ['Low public engagement', 'Technocratic elitism', 'Reduced elections', 'Limited military focus'],
    electionInfo: 'Limited elections every 18 turns',
  },
  theocracy: {
    type: 'theocracy',
    name: 'Theocracy',
    description: 'Religious leaders govern according to divine law and religious doctrine.',
    icon: '☪️',
    color: '#f97316',
    bonuses: GOVERNMENT_BONUSES.theocracy,
    strengths: ['Strong cultural power', 'Excellent propaganda', 'High stability', 'Devoted population'],
    weaknesses: ['Poor research', 'Religious restrictions', 'Limited freedoms', 'Ideological conflicts'],
    electionInfo: 'No elections (religious selection)',
  },
};

/**
 * Calculate coup risk based on government stability and other factors
 */
export function calculateCoupRisk(
  governmentType: GovernmentType,
  stability: number,
  legitimacy: number,
  morale: number,
  militaryStrength: number,
): number {
  const bonuses = GOVERNMENT_BONUSES[governmentType];

  // Base risk increases as stability and legitimacy decrease
  const stabilityRisk = Math.max(0, (100 - stability) * 0.3);
  const legitimacyRisk = Math.max(0, (100 - legitimacy) * 0.4);
  const moraleRisk = Math.max(0, (100 - morale) * 0.2);

  // Strong military increases coup risk for civilian governments
  const militaryRiskFactor = militaryStrength > 70 &&
    !['military_junta', 'dictatorship'].includes(governmentType) ? 10 : 0;

  const totalRisk = stabilityRisk + legitimacyRisk + moraleRisk + militaryRiskFactor;

  // Apply government's coup resistance
  const resistedRisk = totalRisk * (1 - bonuses.coupResistance / 100);

  return Math.min(100, Math.max(0, resistedRisk));
}

/**
 * Determine if elections should be held this turn
 */
export function shouldHoldElection(
  governmentType: GovernmentType,
  electionTimer: number,
): boolean {
  const bonuses = GOVERNMENT_BONUSES[governmentType];

  // No elections for governments with 0 election frequency
  if (bonuses.electionFrequencyModifier === 0) {
    return false;
  }

  // Check if election timer has expired
  // Modified timer based on government type
  const baseElectionInterval = 12;
  const actualInterval = Math.round(baseElectionInterval / bonuses.electionFrequencyModifier);

  return electionTimer <= 0 || electionTimer >= actualInterval;
}

/**
 * Get the modified election interval for a government type
 */
export function getElectionInterval(governmentType: GovernmentType): number {
  const bonuses = GOVERNMENT_BONUSES[governmentType];
  const baseInterval = 12;

  if (bonuses.electionFrequencyModifier === 0) {
    return 0; // No elections
  }

  return Math.round(baseInterval / bonuses.electionFrequencyModifier);
}

/**
 * Calculate succession clarity (important for monarchies and dictatorships)
 */
export function calculateSuccessionClarity(
  governmentType: GovernmentType,
  turnsInPower: number,
  legitimacy: number,
): number {
  if (['democracy', 'constitutional_monarchy'].includes(governmentType)) {
    return 100; // Elections make succession clear
  }

  if (governmentType === 'absolute_monarchy') {
    // Monarchies have clear succession if legitimacy is high
    return Math.min(100, legitimacy + (turnsInPower > 20 ? 20 : 0));
  }

  if (['dictatorship', 'military_junta'].includes(governmentType)) {
    // Autocracies have unclear succession
    return Math.max(0, 50 - turnsInPower * 0.5);
  }

  // One-party states have party mechanisms
  return 70;
}

/**
 * Get government type name for display
 */
export function getGovernmentName(governmentType: GovernmentType): string {
  return GOVERNMENT_INFO[governmentType].name;
}

/**
 * Get government description
 */
export function getGovernmentDescription(governmentType: GovernmentType): string {
  return GOVERNMENT_INFO[governmentType].description;
}

/**
 * Check if government type allows free elections
 */
export function allowsFreeElections(governmentType: GovernmentType): boolean {
  return GOVERNMENT_BONUSES[governmentType].electionFrequencyModifier >= 1.0;
}

/**
 * Check if government type is authoritarian
 */
export function isAuthoritarian(governmentType: GovernmentType): boolean {
  return ['dictatorship', 'military_junta', 'one_party_state', 'theocracy'].includes(governmentType);
}

/**
 * Check if government has hereditary succession
 */
export function hasHereditarySuccession(governmentType: GovernmentType): boolean {
  return ['absolute_monarchy', 'constitutional_monarchy'].includes(governmentType);
}

/**
 * Calculate government compatibility for diplomacy
 */
export function calculateGovernmentCompatibility(
  gov1: GovernmentType,
  gov2: GovernmentType,
): number {
  // Same government = perfect compatibility
  if (gov1 === gov2) {
    return 20;
  }

  // Define compatibility groups
  const democratic = ['democracy', 'constitutional_monarchy'];
  const authoritarian = ['dictatorship', 'military_junta', 'one_party_state'];
  const monarchical = ['absolute_monarchy', 'constitutional_monarchy'];
  const religious = ['theocracy'];
  const technical = ['technocracy'];

  const groups = [democratic, authoritarian, monarchical, religious, technical];

  // Check if both are in same group
  for (const group of groups) {
    if (group.includes(gov1) && group.includes(gov2)) {
      return 10; // Good compatibility
    }
  }

  // Democracy vs Authoritarian = bad
  if (
    (democratic.includes(gov1) && authoritarian.includes(gov2)) ||
    (democratic.includes(gov2) && authoritarian.includes(gov1))
  ) {
    return -15;
  }

  // Otherwise neutral
  return 0;
}
