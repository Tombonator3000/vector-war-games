/**
 * Bio Lab Construction and Research System
 * Tech tree progression for bio-warfare capabilities
 */

export type BioLabTier = 0 | 1 | 2 | 3 | 4;

export interface BioLabTierDefinition {
  tier: BioLabTier;
  name: string;
  description: string;

  // Construction costs
  productionCost: number;
  uraniumCost: number;
  constructionTurns: number;

  // Prerequisites
  requiresTier: BioLabTier | null;
  requiresResearch?: string[]; // Other research projects

  // Unlocks
  unlocks: string[];

  // Bonuses
  researchSpeedBonus: number; // Multiplier for vaccine development
  evolutionCostReduction: number; // Percentage off DNA costs
  detectionResistance: number; // Harder for enemies to detect
}

export interface BioLabFacility {
  // Current status
  tier: BioLabTier;
  active: boolean;

  // Construction
  underConstruction: boolean;
  constructionProgress: number; // Turns completed
  constructionTarget: number; // Total turns needed
  targetTier: BioLabTier; // What tier is being built

  // Costs paid
  productionInvested: number;
  uraniumInvested: number;

  // Detection
  suspicionLevel: number; // 0-100, how suspicious it looks
  knownByNations: string[]; // Which nations detected it
  lastIntelAttempt: number; // Turn of last spy attempt

  // Operational
  researchSpeed: number; // Current vaccine research multiplier
  sabotaged: boolean;
  sabotageTurnsRemaining: number;
}

export interface BioLabConstructionOption {
  tier: BioLabTier;
  definition: BioLabTierDefinition;
  available: boolean;
  reason?: string; // Why not available
  canAfford: boolean;
  hasPrerequisites: boolean;
}

// Lab tier definitions
export const BIO_LAB_TIERS: BioLabTierDefinition[] = [
  {
    tier: 0,
    name: 'No Bio Laboratory',
    description: 'No biological warfare or research capabilities',
    productionCost: 0,
    uraniumCost: 0,
    constructionTurns: 0,
    requiresTier: null,
    unlocks: [],
    researchSpeedBonus: 1.0,
    evolutionCostReduction: 0,
    detectionResistance: 0,
  },
  {
    tier: 1,
    name: 'Biological Research Facility',
    description: 'Basic disease tracking and pandemic response capabilities. Required for vaccine development.',
    productionCost: 50,
    uraniumCost: 0,
    constructionTurns: 5,
    requiresTier: null,
    unlocks: [
      'Disease surveillance',
      'Basic vaccine research',
      'Pandemic response protocols',
    ],
    researchSpeedBonus: 1.2,
    evolutionCostReduction: 0,
    detectionResistance: 0,
  },
  {
    tier: 2,
    name: 'Advanced Virology Laboratory',
    description: 'Sophisticated pathogen analysis and vaccine development. Enhanced disease tracking.',
    productionCost: 150,
    uraniumCost: 0,
    constructionTurns: 8,
    requiresTier: 1,
    unlocks: [
      'Pathogen sequencing',
      'Accelerated vaccine development',
      'International disease monitoring',
    ],
    researchSpeedBonus: 1.5,
    evolutionCostReduction: 0,
    detectionResistance: 10,
  },
  {
    tier: 3,
    name: 'BioForge Facility',
    description: 'CLASSIFIED: Offensive biological weapon development. Pathogen engineering and evolution tree access.',
    productionCost: 300,
    uraniumCost: 50,
    constructionTurns: 12,
    requiresTier: 2,
    unlocks: [
      '⚠️ Offensive bio-weapon development',
      'Pathogen evolution tree',
      'Plague type selection (Basic: Bacteria, Virus, Fungus)',
      'Deployment capabilities',
    ],
    researchSpeedBonus: 2.0,
    evolutionCostReduction: 0,
    detectionResistance: 20,
  },
  {
    tier: 4,
    name: 'Genetic Engineering Complex',
    description: 'HIGHLY CLASSIFIED: Advanced bio-weapon engineering. Unlock exotic plague types and reduced evolution costs.',
    productionCost: 500,
    uraniumCost: 100,
    constructionTurns: 15,
    requiresTier: 3,
    unlocks: [
      'Advanced plague types (Parasite, Prion, Nano-virus, Bio-weapon)',
      '25% reduced evolution costs',
      'Accelerated mutation research',
      'False flag deployment options',
    ],
    researchSpeedBonus: 2.5,
    evolutionCostReduction: 25,
    detectionResistance: 30,
  },
];

export function getBioLabTierDefinition(tier: BioLabTier): BioLabTierDefinition {
  return BIO_LAB_TIERS[tier];
}

export function getNextTierDefinition(currentTier: BioLabTier): BioLabTierDefinition | null {
  if (currentTier >= 4) return null;
  return BIO_LAB_TIERS[currentTier + 1];
}

export function canAffordLabTier(
  tier: BioLabTier,
  production: number,
  uranium: number
): boolean {
  const def = getBioLabTierDefinition(tier);
  return production >= def.productionCost && uranium >= def.uraniumCost;
}

export function hasPrerequisitesForTier(
  tier: BioLabTier,
  currentTier: BioLabTier,
  researched: Record<string, boolean> = {}
): boolean {
  const def = getBioLabTierDefinition(tier);

  // Check tier prerequisite
  if (def.requiresTier !== null && currentTier < def.requiresTier) {
    return false;
  }

  // Check research prerequisites
  if (def.requiresResearch) {
    for (const research of def.requiresResearch) {
      if (!researched[research]) {
        return false;
      }
    }
  }

  return true;
}
