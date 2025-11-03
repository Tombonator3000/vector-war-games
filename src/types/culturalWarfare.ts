/**
 * CULTURAL WARFARE TYPE DEFINITIONS
 * Multi-turn propaganda campaigns and cultural influence mechanics
 */

/**
 * Cultural influence between nations
 */
export interface CulturalInfluence {
  sourceNation: string;
  targetNation: string;
  strength: number;             // 0-100
  growthRate: number;           // How fast it grows per turn
  modifiers: string[];          // Factors affecting growth
  lastUpdated?: number;         // Turn when last updated
}

/**
 * Propaganda campaign types
 */
export type PropagandaCampaignType =
  | 'subversion'        // Destabilize target
  | 'attraction'        // Attract population
  | 'demoralization'    // Reduce happiness
  | 'conversion';       // Convert cultural power

/**
 * Multi-turn propaganda campaign
 */
export interface PropagandaCampaign {
  id: string;
  sourceNation: string;
  targetNation: string;
  type: PropagandaCampaignType;
  investment: number;           // Intel per turn
  turnsRemaining: number;       // Turns until execution
  totalDuration: number;        // Original duration
  effectiveness: number;        // Success chance (0-1)
  discovered: boolean;          // Has target discovered it?
  counterMeasures: number;      // Target's defensive strength
  startedAt: number;            // Turn when started
}

/**
 * Cultural operation types (one-shot operations)
 */
export type CulturalOperationType =
  | 'sponsor_dissidents'     // Slow destabilization
  | 'cultural_export'        // Peaceful influence boost
  | 'ideological_warfare'    // Aggressive conversion
  | 'fifth_column'           // Plant loyal agents
  | 'mass_media_campaign'    // Broad but shallow
  | 'academic_exchange';     // Long-term stable

/**
 * Operation outcome
 */
export interface OperationOutcome {
  success: boolean;
  effect: string;                     // Description of what happened
  culturalInfluenceGain?: number;
  populationConverted?: number;
  stabilityDamage?: number;
  discoveryRisk?: number;
  diplomaticPenalty?: number;
}

/**
 * Cultural wonder types
 */
export type CulturalWonderType =
  | 'global_media_network'
  | 'cultural_academy'
  | 'world_heritage_sites'
  | 'international_university'
  | 'propaganda_bureau';

/**
 * Cultural wonder
 */
export interface CulturalWonder {
  id: string;
  type: CulturalWonderType;
  name: string;
  productionCost: number;
  intelCost: number;
  buildTime: number;              // Turns to complete
  turnsRemaining?: number;        // If under construction
  effects: {
    culturalPowerBonus: number;
    assimilationRateBonus: number;
    immigrationAttractionBonus: number;
    diplomaticInfluenceBonus: number;
  };
  uniqueAbility: string;
  description: string;
  completed?: boolean;
}

/**
 * Cultural zone
 */
export interface CulturalZone {
  nationId: string;
  dominantCulture: string;
  influences: CulturalInfluence[];
  contestedLevel: number;         // 0-100, how much competition
}
