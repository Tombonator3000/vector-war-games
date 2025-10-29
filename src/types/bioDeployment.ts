/**
 * Bio-Weapon Deployment and Target Selection System
 * Allows players to choose specific nations to attack with customized deployment methods
 */

export type DeploymentMethodId = 'covert' | 'airport' | 'simultaneous' | 'border';

export interface DeploymentMethod {
  id: DeploymentMethodId;
  name: string;
  description: string;

  // Costs
  dnaCost: number;
  actionsRequired: number;

  // Characteristics
  initialInfectionRate: number; // Base infection spread speed
  detectionRisk: number; // 0-100, chance of being detected early
  spreadSpeed: number; // Multiplier for spread rate

  // Special features
  canTargetMultiple: boolean;
  maxTargets: number;
  requiresAirport?: boolean;
  requiresBorder?: boolean;

  // False flag
  supportsFalseFlag: boolean;
  falseFlagDetectionPenalty?: number; // Extra detection risk if using false flag
}

export interface DeploymentTarget {
  nationId: string;
  deploymentMethod: DeploymentMethodId;

  // False flag options
  useFalseFlag: boolean;
  falseFlagNationId?: string; // Make it look like this nation did it

  // Timing
  deployedTurn: number;

  // Infection status
  infected: boolean;
  infectionLevel: number; // 0-100
  deaths: number;
  detected: boolean;
  attributedToNation?: string; // Who they think did it
}

export interface CountryInfectionState {
  nationId: string;
  infected: boolean;
  infectionLevel: number; // 0-100, percentage of population infected
  infectionStartTurn: number;

  // Spread modifiers
  containmentLevel: number; // 0-100, how well they're containing
  healthcareQuality: number; // Affects death rate

  // Deaths
  deaths: number;
  deathRate: number; // Per turn

  // Detection & Attribution
  detectedBioWeapon: boolean;
  detectionTurn?: number;
  suspectedOrigin?: string; // Nation ID they suspect
  suspicionLevel: number; // 0-100

  // Spread tracking
  spreadFrom?: string; // Nation ID that spread it here
  spreadMethod?: 'initial' | 'air-travel' | 'border' | 'trade';
}

export interface BioDeploymentState {
  // Active deployments
  activeDeployments: DeploymentTarget[];

  // Per-country tracking
  countryInfections: Map<string, CountryInfectionState>;

  // Global stats (derived from country data)
  totalInfected: number;
  totalDeaths: number;
  countriesInfected: number;

  // Attribution & Detection
  playerDetected: boolean;
  playerSuspicionLevel: number; // 0-100, global suspicion
  nationsKnowingTruth: string[]; // Nations that know player did it

  // Deployment history
  deploymentsUsed: number;
  lastDeploymentTurn: number;
}

// Deployment method definitions
export const DEPLOYMENT_METHODS: DeploymentMethod[] = [
  {
    id: 'covert',
    name: 'Covert Insertion',
    description: 'Sleeper agents deploy pathogen discreetly. Slow spread but very hard to detect.',
    dnaCost: 5,
    actionsRequired: 1,
    initialInfectionRate: 0.5,
    detectionRisk: 10,
    spreadSpeed: 0.8,
    canTargetMultiple: false,
    maxTargets: 1,
    supportsFalseFlag: true,
    falseFlagDetectionPenalty: 5,
  },
  {
    id: 'airport',
    name: 'Airport Deployment',
    description: 'Release pathogen at major travel hub. Fast spread via air travel, moderate detection risk.',
    dnaCost: 10,
    actionsRequired: 1,
    initialInfectionRate: 1.5,
    detectionRisk: 35,
    spreadSpeed: 1.5,
    canTargetMultiple: false,
    maxTargets: 1,
    requiresAirport: true,
    supportsFalseFlag: true,
    falseFlagDetectionPenalty: 10,
  },
  {
    id: 'border',
    name: 'Border Infiltration',
    description: 'Deploy along porous borders. Spreads to neighboring nations naturally.',
    dnaCost: 8,
    actionsRequired: 1,
    initialInfectionRate: 1.0,
    detectionRisk: 20,
    spreadSpeed: 1.2,
    canTargetMultiple: false,
    maxTargets: 1,
    requiresBorder: true,
    supportsFalseFlag: true,
    falseFlagDetectionPenalty: 8,
  },
  {
    id: 'simultaneous',
    name: 'Simultaneous Multi-Target Strike',
    description: 'Deploy to multiple nations at once. Maximum chaos, high cost, extreme detection risk.',
    dnaCost: 25,
    actionsRequired: 2,
    initialInfectionRate: 1.2,
    detectionRisk: 60,
    spreadSpeed: 1.3,
    canTargetMultiple: true,
    maxTargets: 5,
    supportsFalseFlag: false, // Too obvious for false flag
  },
];

export function getDeploymentMethod(id: DeploymentMethodId): DeploymentMethod {
  const method = DEPLOYMENT_METHODS.find(m => m.id === id);
  if (!method) {
    throw new Error(`Unknown deployment method: ${id}`);
  }
  return method;
}

export function canAffordDeployment(
  method: DeploymentMethod,
  dnaPoints: number,
  actions: number
): boolean {
  return dnaPoints >= method.dnaCost && actions >= method.actionsRequired;
}

export function calculateDetectionChance(
  method: DeploymentMethod,
  useFalseFlag: boolean,
  targetNationIntelligence: number // 0-100
): number {
  let baseDetection = method.detectionRisk;

  if (useFalseFlag && method.supportsFalseFlag && method.falseFlagDetectionPenalty) {
    baseDetection += method.falseFlagDetectionPenalty;
  }

  // Intelligence level affects detection
  const intelligenceMultiplier = 1 + (targetNationIntelligence / 100);

  return Math.min(100, baseDetection * intelligenceMultiplier);
}
