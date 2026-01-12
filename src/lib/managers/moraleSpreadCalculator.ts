/**
 * Morale Spread Calculator
 *
 * Pure functions for calculating how morale diffuses between adjacent territories.
 * Implements contagion mechanics where high/low morale spreads to neighbors.
 *
 * Phase 3 - Priority 1
 */

import type { RegionalMorale } from '@/types/regionalMorale';

/**
 * Configuration for morale spread mechanics
 */
export interface MoraleSpreadConfig {
  /** Base diffusion rate (0-1) */
  diffusionRate: number;
  /** Multiplier for extreme morale (very high or very low) */
  extremeMultiplier: number;
  /** Threshold for "high" morale */
  highMoraleThreshold: number;
  /** Threshold for "low" morale */
  lowMoraleThreshold: number;
  /** Maximum morale change per turn from diffusion */
  maxChangePerTurn: number;
}

/**
 * Default configuration
 */
export const DEFAULT_MORALE_SPREAD_CONFIG: MoraleSpreadConfig = {
  diffusionRate: 0.15, // 15% of difference spreads
  extremeMultiplier: 1.5, // Extreme morale spreads 50% faster
  highMoraleThreshold: 75,
  lowMoraleThreshold: 25,
  maxChangePerTurn: 5,
};

/**
 * Adjacency information for a territory
 */
export interface TerritoryAdjacency {
  territoryId: string;
  adjacentTerritories: string[];
  isCapital?: boolean;
  isBorder?: boolean; // Borders enemy nation
}

/**
 * Calculate morale change for a territory based on adjacent territories
 */
export function calculateMoraleSpread(
  territory: RegionalMorale,
  adjacentMorale: RegionalMorale[],
  config: MoraleSpreadConfig = DEFAULT_MORALE_SPREAD_CONFIG
): number {
  if (adjacentMorale.length === 0) return 0;

  // Calculate average adjacent morale
  const avgAdjacentMorale =
    adjacentMorale.reduce((sum, m) => sum + m.morale, 0) / adjacentMorale.length;

  // Calculate difference
  const difference = avgAdjacentMorale - territory.morale;

  // Base spread amount
  let spread = difference * config.diffusionRate;

  // Extreme morale spreads faster (both high and low)
  if (
    avgAdjacentMorale > config.highMoraleThreshold ||
    avgAdjacentMorale < config.lowMoraleThreshold
  ) {
    spread *= config.extremeMultiplier;
  }

  // Cap maximum change
  spread = Math.max(-config.maxChangePerTurn, Math.min(config.maxChangePerTurn, spread));

  return spread;
}

/**
 * Calculate morale spread for all territories in a nation
 */
export function calculateMoraleSpreadForNation(
  morale: RegionalMorale[],
  adjacencies: TerritoryAdjacency[],
  config: MoraleSpreadConfig = DEFAULT_MORALE_SPREAD_CONFIG
): Map<string, number> {
  const changes = new Map<string, number>();
  const moraleMap = new Map<string, RegionalMorale>();

  // Build lookup map
  morale.forEach((m) => moraleMap.set(m.territoryId, m));

  // Calculate spread for each territory
  adjacencies.forEach((adj) => {
    const territory = moraleMap.get(adj.territoryId);
    if (!territory) return;

    // Get adjacent morale values
    const adjacentMorale = adj.adjacentTerritories
      .map((id) => moraleMap.get(id))
      .filter((m): m is RegionalMorale => m !== undefined);

    // Calculate spread
    const change = calculateMoraleSpread(territory, adjacentMorale, config);
    changes.set(adj.territoryId, change);
  });

  return changes;
}

/**
 * Calculate morale effect from bordering unstable territory
 */
export function calculateBorderInstabilityEffect(
  territory: RegionalMorale,
  borderTerritories: RegionalMorale[],
  borderNationMorale: number[]
): number {
  let instabilityPenalty = 0;

  // Check own unstable border territories
  borderTerritories.forEach((border) => {
    if (border.morale < 30) {
      instabilityPenalty -= 0.5; // -0.5 per unstable border territory
    }
  });

  // Check neighboring nation morale
  borderNationMorale.forEach((neighborMorale) => {
    if (neighborMorale < 25) {
      instabilityPenalty -= 1; // -1 per very unstable neighbor nation
    } else if (neighborMorale < 40) {
      instabilityPenalty -= 0.5; // -0.5 per unstable neighbor nation
    }
  });

  return Math.max(-5, instabilityPenalty); // Cap at -5 per turn
}

/**
 * Calculate morale boost from successful military victory
 */
export function calculateVictoryMoraleBoost(
  isCapital: boolean,
  victorySeverity: 'minor' | 'major' | 'decisive',
  distanceFromVictory: number // How many territories away
): number {
  let baseBoost = 0;

  switch (victorySeverity) {
    case 'decisive':
      baseBoost = 15;
      break;
    case 'major':
      baseBoost = 10;
      break;
    case 'minor':
      baseBoost = 5;
      break;
  }

  // Capital gets full boost
  if (isCapital) return baseBoost;

  // Other territories get reduced boost based on distance
  const distanceDecay = Math.max(0.2, 1 - distanceFromVictory * 0.15);
  return Math.round(baseBoost * distanceDecay);
}

/**
 * Calculate morale penalty from military defeat
 */
export function calculateDefeatMoralePenalty(
  isCapital: boolean,
  defeatSeverity: 'minor' | 'major' | 'catastrophic',
  territoriesLost: number,
  distanceFromDefeat: number
): number {
  let basePenalty = 0;

  switch (defeatSeverity) {
    case 'catastrophic':
      basePenalty = -20;
      break;
    case 'major':
      basePenalty = -12;
      break;
    case 'minor':
      basePenalty = -6;
      break;
  }

  // Additional penalty per territory lost
  basePenalty -= territoriesLost * 2;

  // Capital hit harder
  if (isCapital) {
    basePenalty *= 1.5;
  } else {
    // Other territories penalized based on distance
    const distanceDecay = Math.max(0.3, 1 - distanceFromDefeat * 0.1);
    basePenalty *= distanceDecay;
  }

  return Math.round(Math.max(-30, basePenalty)); // Cap at -30
}

/**
 * Calculate morale effect from conquered territory
 */
export function calculateConquestMoraleEffect(
  isNewlyConquered: boolean,
  turnsUnderOccupation: number,
  occupierHarshness: number // 0-100, how brutal the occupation
): number {
  if (!isNewlyConquered && turnsUnderOccupation === 0) return 0;

  // Newly conquered territories start very low
  if (isNewlyConquered) {
    return -40;
  }

  // Morale slowly recovers over time under occupation
  const baseRecovery = Math.min(20, turnsUnderOccupation * 0.5);

  // Harsh occupation slows recovery
  const harshnessModifier = (occupierHarshness / 100) * 15;

  return -40 + baseRecovery - harshnessModifier;
}

/**
 * Calculate morale boost from successful peaceful protest resolution
 */
export function calculateProtestResolutionBoost(
  resolutionType: 'negotiated' | 'demands_met' | 'suppressed',
  protestIntensity: number
): number {
  switch (resolutionType) {
    case 'demands_met':
      return protestIntensity * 1.5; // Strong positive boost
    case 'negotiated':
      return protestIntensity * 0.5; // Moderate boost
    case 'suppressed':
      return -protestIntensity * 1.2; // Negative impact from force
    default:
      return 0;
  }
}

/**
 * Calculate morale effect from nuclear strike in region
 */
export function calculateNuclearStrikeMoraleEffect(
  isDirectHit: boolean,
  distanceFromStrike: number, // 0 = direct hit, 1 = adjacent, 2 = two away, etc.
  strikeYield: 'tactical' | 'strategic' | 'massive'
): number {
  let basePenalty = 0;

  switch (strikeYield) {
    case 'massive':
      basePenalty = -50;
      break;
    case 'strategic':
      basePenalty = -35;
      break;
    case 'tactical':
      basePenalty = -20;
      break;
  }

  if (isDirectHit) {
    return basePenalty; // Full devastation
  }

  // Distance decay for fallout/radiation
  const decay = Math.max(0.1, 1 - distanceFromStrike * 0.3);
  return Math.round(basePenalty * decay);
}

/**
 * Calculate refugee impact on destination territory morale
 */
export function calculateRefugeeMoraleImpact(
  refugeeCount: number,
  territoryPopulation: number,
  publicOpinionOnRefugees: number // 0-100
): number {
  // Ratio of refugees to local population
  const refugeeRatio = refugeeCount / territoryPopulation;

  // Base impact depends on ratio (more refugees = more strain)
  let baseImpact = -refugeeRatio * 10;

  // Public opinion modifies impact
  const opinionModifier = (publicOpinionOnRefugees - 50) / 50; // -1 to +1
  baseImpact *= 1 - opinionModifier * 0.5;

  // Small refugee influx can be positive with good opinion
  if (refugeeRatio < 0.02 && publicOpinionOnRefugees > 70) {
    baseImpact = Math.abs(baseImpact) * 0.5; // Flip to positive
  }

  return Math.round(Math.max(-15, Math.min(5, baseImpact)));
}

/**
 * Calculate overall morale stability (0-100)
 * Higher = more stable, less volatile
 */
export function calculateMoraleStability(
  currentMorale: number,
  historicalMorale: number[],
  hasProtests: boolean,
  hasStrikes: boolean
): number {
  let stability = 50; // Base stability

  // Distance from extremes (mid-range morale is more stable)
  const distanceFromExtreme = 50 - Math.abs(50 - currentMorale);
  stability += distanceFromExtreme * 0.4;

  // Historical volatility
  if (historicalMorale.length >= 3) {
    const variance =
      historicalMorale.reduce((sum, m) => {
        const diff = m - currentMorale;
        return sum + diff * diff;
      }, 0) / historicalMorale.length;

    const volatility = Math.sqrt(variance);
    stability -= volatility * 2; // High volatility reduces stability
  }

  // Active unrest reduces stability
  if (hasProtests) stability -= 20;
  if (hasStrikes) stability -= 15;

  return Math.round(Math.max(0, Math.min(100, stability)));
}

/**
 * Predict morale trend for next N turns
 */
export function predictMoraleTrend(
  currentMorale: number,
  historicalMorale: number[],
  adjacentAvgMorale: number,
  config: MoraleSpreadConfig = DEFAULT_MORALE_SPREAD_CONFIG,
  turns: number = 5
): number[] {
  const predictions: number[] = [currentMorale];

  for (let i = 0; i < turns; i++) {
    const lastMorale = predictions[predictions.length - 1];

    // Calculate natural spread effect
    const difference = adjacentAvgMorale - lastMorale;
    let change = difference * config.diffusionRate;

    // Add historical momentum
    if (historicalMorale.length >= 2) {
      const recentTrend =
        historicalMorale[historicalMorale.length - 1] -
        historicalMorale[historicalMorale.length - 2];
      change += recentTrend * 0.3; // 30% of historical trend continues
    }

    // Cap change
    change = Math.max(-config.maxChangePerTurn, Math.min(config.maxChangePerTurn, change));

    const nextMorale = Math.max(0, Math.min(100, lastMorale + change));
    predictions.push(Math.round(nextMorale));
  }

  return predictions;
}
