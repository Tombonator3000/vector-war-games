/**
 * Regional Morale & Civil Stability System
 *
 * This system extends the national morale mechanics to work at the territory level,
 * adding depth through protests, strikes, and regional instability.
 */

// ============================================================================
// PRIORITY 3: Regional Morale System
// ============================================================================

/**
 * Morale state for a specific territory
 */
export interface RegionalMorale {
  territoryId: string;
  morale: number; // 0-100
  lastEventTurn: number;
  lastMoraleChange: number; // Track delta from last turn
  historicalMorale: number[]; // Last 5 turns for trend analysis

  // Civil stability factors (Priority 4)
  protests: ProtestState | null;
  strikes: StrikeState | null;
  refugeeInflux: number; // Refugees arriving this turn
}

/**
 * Calculate nation-wide morale from regional morale values
 */
export interface NationalMoraleCalculation {
  weightedAverage: number; // Main morale value
  lowest: number; // Most troubled region
  highest: number; // Most stable region
  volatility: number; // Variance between regions (0-100)
  criticalRegions: string[]; // Territories below 30 morale
}

// ============================================================================
// PRIORITY 4: Civil Stability Mechanics
// ============================================================================

/**
 * Protest state for a territory
 */
export interface ProtestState {
  intensity: number; // 1-10 scale
  startTurn: number;
  duration: number; // Turns active
  causes: ProtestCause[];
  spreading: boolean; // Can spread to adjacent territories
  suppressionAttempts: number; // How many times force was used

  // Effects
  productionPenalty: number; // Percentage reduction (0-100)
  moraleImpact: number; // Additional morale loss per turn
  publicOpinionCost: number; // Cost to suppress with force
}

export type ProtestCause =
  | 'low_morale'
  | 'military_losses'
  | 'economic_hardship'
  | 'war_exhaustion'
  | 'nuclear_strikes'
  | 'occupation'
  | 'refugees'
  | 'policy_discontent';

/**
 * Strike state for a territory
 */
export interface StrikeState {
  type: StrikeType;
  startTurn: number;
  duration: number;
  strikerDemands: StrikeDemand[];

  // Effects
  productionHalted: boolean; // Completely stops production if true
  productionPenalty: number; // Partial penalty if not halted (0-100)
  resolutionCost: number; // Gold cost to meet demands

  // Resolution tracking
  negotiationProgress: number; // 0-100, auto-resolves at 100
  forceSuppression: boolean; // Whether force is being used
}

export type StrikeType =
  | 'general_strike'
  | 'industrial_strike'
  | 'transportation_strike'
  | 'public_sector_strike';

export interface StrikeDemand {
  type: 'wages' | 'peace' | 'reform' | 'resources';
  severity: 'minor' | 'major' | 'critical';
  cost: number; // Gold cost to meet
}

/**
 * Civil war risk calculation
 */
export interface CivilWarRisk {
  riskLevel: number; // 0-100
  turnsAtRisk: number; // Consecutive turns below threshold
  threshold: number; // Risk level that triggers civil war (default 80)
  contributingFactors: CivilWarFactor[];

  // Potential breakaway faction
  breakawayFaction: {
    name: string;
    territories: string[]; // Territories that would secede
    militaryStrength: number; // Percentage of nation's military
  } | null;
}

export interface CivilWarFactor {
  type: 'low_morale' | 'low_approval' | 'protests' | 'strikes' | 'regional_disparity';
  contribution: number; // Risk points (0-100)
  description: string;
}

/**
 * Migration and refugee system
 */
export interface MigrationFlow {
  sourceTerritoryId: string | null; // null if international
  destinationTerritoryId: string;
  sourceNationId: string | null;
  destinationNationId: string;
  populationMigrating: number;
  reason: MigrationReason;
  turn: number;
}

export type MigrationReason =
  | 'low_morale'
  | 'war'
  | 'nuclear_devastation'
  | 'economic_opportunity'
  | 'persecution'
  | 'civil_war';

// ============================================================================
// PRIORITY 5: Media & Propaganda Warfare
// ============================================================================

/**
 * Media campaign targeting a nation or region
 */
export interface MediaCampaign {
  id: string;
  sourceNationId: string;
  targetNationId: string;
  targetTerritoryId: string | null; // null = nation-wide

  type: MediaCampaignType;
  intensity: number; // 1-10 scale, costs intel per turn
  turnsActive: number;
  turnsRemaining: number;

  // Effects
  effects: {
    publicOpinionDelta: number; // Change per turn
    moraleBoost?: number; // For own nation
    moralePenalty?: number; // For target
    detectionRisk: number; // 0-100, chance of exposure
  };

  // Status
  exposed: boolean; // If detected by target
  exposedTurn: number | null;
}

export type MediaCampaignType =
  | 'propaganda' // Boost own morale, reduce enemy opinion
  | 'counter_propaganda' // Cancel enemy campaigns
  | 'censorship' // Suppress bad news
  | 'disinformation' // Spread false narratives
  | 'truth_campaign'; // Expose enemy lies (high risk/reward)

/**
 * Media power rating for a nation
 */
export interface MediaPower {
  nationId: string;
  power: number; // 0-100 base rating

  // Modifiers
  researchBonus: number; // From tech
  propagandaBonus: number; // From policies
  censorship: boolean; // Active censorship reduces enemy campaigns

  // Active campaigns
  activeCampaigns: string[]; // MediaCampaign IDs
  maxConcurrentCampaigns: number; // Based on power level
}

/**
 * Media event outcomes
 */
export interface MediaEvent {
  type: MediaEventType;
  nationId: string;
  turn: number;
  severity: 'minor' | 'major' | 'critical';

  effects: {
    approvalDelta?: number;
    moraleDelta?: number;
    opinionDelta?: number;
    goldCost?: number;
  };
}

export type MediaEventType =
  | 'media_scandal' // Leak damages reputation
  | 'propaganda_success' // Campaign boosts morale
  | 'exposed_lies' // Caught in disinformation
  | 'media_blackout' // Censorship activated
  | 'international_attention'; // Global media coverage

// ============================================================================
// PRIORITY 6: Domestic Political Factions
// ============================================================================

/**
 * Political faction within a nation
 */
export interface PoliticalFaction {
  id: string;
  nationId: string;
  name: string;
  type: FactionType;

  // Power and influence
  influence: number; // 0-100, percentage of political power
  satisfaction: number; // 0-100, happiness with current leadership

  // Ideology and preferences
  agenda: FactionAgenda;
  loyalTerritories: string[]; // Territories with strong support

  // State
  inCoalition: boolean; // Part of ruling coalition
  demands: FactionDemand[];
  threatLevel: number; // 0-100, likelihood of coup/rebellion
}

export type FactionType =
  | 'military' // Armed forces leadership
  | 'civilian' // Democratic/civilian government
  | 'hardliner' // Hawks, expansionists
  | 'reformer' // Peace party, moderates
  | 'nationalist' // Ethnic/nationalist movement
  | 'communist' // Communist party (Cold War era)
  | 'religious' // Religious fundamentalists
  | 'technocrat'; // Economic/technical experts

/**
 * Faction agenda and preferences
 */
export interface FactionAgenda {
  priorities: FactionPriority[];
  redLines: string[]; // Actions that will trigger revolt
  preferredPolicies: string[]; // Policy IDs they support
  opposedPolicies: string[]; // Policy IDs they oppose

  // Diplomatic preferences
  preferredAllies: string[]; // Nations they want alliance with
  enemies: string[]; // Nations they oppose
}

export interface FactionPriority {
  type: 'military_expansion' | 'economic_growth' | 'peace' | 'nuclear_program' | 'democracy' | 'authoritarianism';
  weight: number; // 1-10 importance
}

/**
 * Faction demand or ultimatum
 */
export interface FactionDemand {
  id: string;
  factionId: string;
  type: FactionDemandType;
  severity: 'request' | 'demand' | 'ultimatum';

  description: string;
  deadline: number; // Turn number
  consequences: FactionConsequence;

  // Requirements
  requirements: {
    policyChange?: string;
    resourceAllocation?: { production?: number; gold?: number };
    diplomaticAction?: string;
    militaryAction?: string;
  };
}

export type FactionDemandType =
  | 'policy_change'
  | 'increased_funding'
  | 'peace_treaty'
  | 'declare_war'
  | 'end_alliance'
  | 'nuclear_strike'
  | 'reform'
  | 'crackdown';

export interface FactionConsequence {
  satisfactionDelta: number; // If demand met
  influenceDelta: number; // Change in faction power

  // If demand refused
  refusalPenalty: {
    satisfactionLoss: number;
    coupRisk: number; // Immediate coup chance (0-100)
    defectionRisk: number; // Chance faction leaves coalition
  };
}

/**
 * Coup attempt state
 */
export interface CoupAttempt {
  turn: number;
  instigatorFactionId: string;
  supportingFactions: string[];
  opposingFactions: string[];

  successChance: number; // 0-100
  militaryLoyalty: number; // 0-100, how much military supports govt

  // Outcomes
  resolved: boolean;
  successful: boolean | null;
  casualties: number; // Military losses
  newLeader: string | null; // If successful
}

// ============================================================================
// PRIORITY 7: International Pressure System
// ============================================================================

/**
 * UN/International Council resolution
 */
export interface InternationalResolution {
  id: string;
  type: ResolutionType;
  targetNationId: string;
  sponsors: string[]; // Nations that proposed it
  turn: number;

  // Voting
  votesFor: string[];
  votesAgainst: string[];
  abstentions: string[];
  passed: boolean;

  // Effects
  effects: ResolutionEffects;
  duration: number; // Turns active, -1 = permanent
  turnsRemaining: number;
}

export type ResolutionType =
  | 'condemnation' // Diplomatic censure
  | 'peacekeeping' // Deploy observers
  | 'sanctions' // Economic sanctions
  | 'arms_embargo' // Military restrictions
  | 'no_fly_zone' // Military intervention threat
  | 'humanitarian_aid' // Support for struggling nation
  | 'recognition' // Recognize new government;

export interface ResolutionEffects {
  // Diplomatic
  diplomaticIsolation?: number; // Relationship penalty with all nations
  legitimacy?: number; // Domestic approval impact

  // Economic
  tradePenalty?: number; // Production reduction
  goldPerTurn?: number; // Ongoing cost/benefit

  // Military
  militaryRestriction?: {
    buildPenalty: number; // Cost increase for units
    recruitmentPenalty: number; // Slower recruitment
    embargoActive: boolean; // Cannot build certain units
  };

  // Benefits (for aid recipients)
  productionBonus?: number;
  stabilityBonus?: number; // Morale/approval boost
}

/**
 * Sanctions package against a nation
 */
export interface SanctionPackage {
  id: string;
  targetNationId: string;
  imposingNations: string[]; // Nations enforcing sanctions

  type: SanctionType[];
  severity: number; // 1-10 scale

  turn: number;
  duration: number;
  turnsRemaining: number;

  effects: SanctionEffects;

  // Enforcement
  compliance: number; // 0-100, how well enforced
  bypassAttempts: number; // Target's evasion attempts
}

export type SanctionType =
  | 'trade' // Reduce production/gold
  | 'financial' // Freeze assets, reduce gold income
  | 'military' // Arms embargo
  | 'diplomatic' // Isolation from negotiations
  | 'technology' // Research penalty
  | 'travel'; // Diplomatic penalty

export interface SanctionEffects {
  productionPenalty: number; // Percentage reduction
  goldPenalty: number; // Gold per turn loss
  researchPenalty: number; // Research speed reduction
  diplomaticPenalty: number; // Relationship with all nations
  moraleImpact: number; // Domestic morale effect

  // Can worsen over time
  escalationRate: number; // Penalties increase if maintained
}

/**
 * International aid package
 */
export interface AidPackage {
  id: string;
  recipientNationId: string;
  donors: string[]; // Nations providing aid

  type: AidType[];
  turn: number;
  duration: number;
  turnsRemaining: number;

  // Requirements
  conditions: AidCondition[];
  conditionsMet: boolean;

  // Benefits
  benefits: {
    productionBonus?: number;
    goldPerTurn?: number;
    stabilityBonus?: number; // Morale/approval
    researchBonus?: number;
    militarySupport?: number; // Free units
  };
}

export type AidType =
  | 'economic' // Production/gold boost
  | 'humanitarian' // Morale/stability boost
  | 'military' // Military aid
  | 'technical' // Research boost
  | 'reconstruction'; // Repair radiation/damage

export interface AidCondition {
  type: 'democracy' | 'peace' | 'reform' | 'disarmament' | 'alliance';
  description: string;
  met: boolean;

  // Penalties if violated
  violationPenalty: {
    aidSuspended: boolean;
    relationshipPenalty: number;
    reputationLoss: number;
  };
}

/**
 * International pressure tracking for a nation
 */
export interface InternationalPressure {
  nationId: string;

  // Overall standing
  legitimacy: number; // 0-100, international recognition
  isolationLevel: number; // 0-100, how isolated diplomatically

  // Active measures
  activeResolutions: string[]; // InternationalResolution IDs
  activeSanctions: string[]; // SanctionPackage IDs
  activeAid: string[]; // AidPackage IDs

  // Reputation tracking
  warCrimes: number; // Count of atrocities
  nuclearStrikes: number; // Count of nuclear attacks
  treatyViolations: number; // Broken agreements
  humanRights: number; // 0-100 rating

  // Effects
  totalDiplomaticPenalty: number; // Sum of all penalties
  totalEconomicPenalty: number; // Production reduction
  totalStabilityImpact: number; // Domestic morale effect
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate nation-wide morale from regional values
 */
export function calculateNationalMorale(
  regionalMorale: RegionalMorale[],
  territories: Array<{ id: string; strategicValue: number }>
): NationalMoraleCalculation {
  if (regionalMorale.length === 0) {
    return {
      weightedAverage: 50,
      lowest: 50,
      highest: 50,
      volatility: 0,
      criticalRegions: [],
    };
  }

  // Weight by strategic value
  let totalWeight = 0;
  let weightedSum = 0;
  let lowest = 100;
  let highest = 0;
  const criticalRegions: string[] = [];

  regionalMorale.forEach((rm) => {
    const territory = territories.find((t) => t.id === rm.territoryId);
    const weight = territory?.strategicValue || 1;

    weightedSum += rm.morale * weight;
    totalWeight += weight;

    if (rm.morale < lowest) lowest = rm.morale;
    if (rm.morale > highest) highest = rm.morale;
    if (rm.morale < 30) criticalRegions.push(rm.territoryId);
  });

  const weightedAverage = totalWeight > 0 ? weightedSum / totalWeight : 50;

  // Calculate volatility (standard deviation)
  const variance =
    regionalMorale.reduce((sum, rm) => {
      const diff = rm.morale - weightedAverage;
      return sum + diff * diff;
    }, 0) / regionalMorale.length;

  const volatility = Math.min(100, Math.sqrt(variance));

  return {
    weightedAverage: Math.round(weightedAverage),
    lowest: Math.round(lowest),
    highest: Math.round(highest),
    volatility: Math.round(volatility),
    criticalRegions,
  };
}

/**
 * Determine if a protest should spread to an adjacent territory
 */
export function shouldProtestSpread(
  sourceProtest: ProtestState,
  targetMorale: number,
  adjacencyCount: number
): boolean {
  // Base spread chance based on intensity
  const baseChance = sourceProtest.intensity * 8; // 8-80% range

  // Higher chance if target is also unhappy
  const moraleModifier = targetMorale < 50 ? (50 - targetMorale) / 2 : 0;

  // Reduced chance if many neighbors (spread dilutes)
  const adjacencyPenalty = Math.max(0, (adjacencyCount - 1) * 5);

  const spreadChance = baseChance + moraleModifier - adjacencyPenalty;

  return Math.random() * 100 < spreadChance;
}

/**
 * Calculate civil war risk from multiple factors
 */
export function calculateCivilWarRisk(
  morale: number,
  publicOpinion: number,
  cabinetApproval: number,
  protests: number, // Count of active protests
  strikes: number, // Count of active strikes
  turnsAtRisk: number
): CivilWarRisk {
  const factors: CivilWarFactor[] = [];
  let totalRisk = 0;

  // Low morale contribution
  if (morale < 30) {
    const moraleRisk = (30 - morale) * 2;
    factors.push({
      type: 'low_morale',
      contribution: moraleRisk,
      description: `National morale critically low (${morale})`,
    });
    totalRisk += moraleRisk;
  }

  // Low approval contribution
  if (cabinetApproval < 25) {
    const approvalRisk = (25 - cabinetApproval) * 2.5;
    factors.push({
      type: 'low_approval',
      contribution: approvalRisk,
      description: `Cabinet approval critically low (${cabinetApproval})`,
    });
    totalRisk += approvalRisk;
  }

  // Protest contribution
  if (protests > 0) {
    const protestRisk = Math.min(30, protests * 10);
    factors.push({
      type: 'protests',
      contribution: protestRisk,
      description: `${protests} active protest(s) destabilizing regions`,
    });
    totalRisk += protestRisk;
  }

  // Strike contribution
  if (strikes > 0) {
    const strikeRisk = Math.min(20, strikes * 8);
    factors.push({
      type: 'strikes',
      contribution: strikeRisk,
      description: `${strikes} active strike(s) crippling economy`,
    });
    totalRisk += strikeRisk;
  }

  // Duration multiplier (risk increases the longer instability persists)
  const durationMultiplier = 1 + turnsAtRisk * 0.1;
  totalRisk = Math.min(100, totalRisk * durationMultiplier);

  return {
    riskLevel: Math.round(totalRisk),
    turnsAtRisk,
    threshold: 80, // Default threshold
    contributingFactors: factors,
    breakawayFaction: null, // Populated if risk > 80
  };
}
