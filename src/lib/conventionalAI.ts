import type { TerritoryState } from '@/hooks/useConventionalWarfare';

export interface AIDecision {
  type: 'attack' | 'move' | 'reinforce' | 'pass';
  fromTerritoryId?: string;
  toTerritoryId?: string;
  armies?: number;
  reason: string;
}

/**
 * AI Strategy for Risk-style conventional warfare
 *
 * Strategy priorities:
 * 1. Capture weak neighbors (high reward, low risk)
 * 2. Complete regions for bonuses
 * 3. Fortify borders against strong enemies
 * 4. Avoid risky attacks (less than 2:1 advantage)
 */

interface RegionInfo {
  name: string;
  territoryIds: string[];
  bonus: number;
}

const REGIONS: RegionInfo[] = [
  { name: 'Western Hemisphere', territoryIds: ['north_america'], bonus: 2 },
  { name: 'Atlantic', territoryIds: ['atlantic_corridor'], bonus: 1 },
  { name: 'Europe & Siberia', territoryIds: ['eastern_bloc'], bonus: 3 },
  { name: 'Pacific', territoryIds: ['indo_pacific'], bonus: 2 },
  { name: 'South Atlantic', territoryIds: ['southern_front'], bonus: 2 },
  { name: 'Africa & Middle East', territoryIds: ['equatorial_belt', 'proxy_middle_east'], bonus: 3 },
  { name: 'Arctic', territoryIds: ['arctic_circle'], bonus: 1 },
];

// ============================================================================
// Helper Types & Interfaces
// ============================================================================

/**
 * Modifiers applied based on AI personality type
 */
interface PersonalityModifiers {
  aggressionMultiplier: number;
  riskTolerance: number;
  baseScoreBonus: number;
}

// ============================================================================
// Helper Functions for evaluateAttack
// ============================================================================

/**
 * Get personality-based modifiers for attack evaluation
 *
 * Returns multipliers and bonuses that affect how the AI evaluates attacks:
 * - aggressionMultiplier: Scales power ratio bonuses (higher = more aggressive)
 * - riskTolerance: Minimum power ratio AI wants (lower = more willing to take risks)
 * - baseScoreBonus: Flat bonus/penalty to attack score
 *
 * @param personality - AI personality type (aggressive, defensive, chaotic, etc.)
 * @returns Personality modifiers object
 */
function getPersonalityModifiers(personality?: string): PersonalityModifiers {
  const PERSONALITY_CONFIGS: Record<string, PersonalityModifiers> = {
    aggressive: {
      aggressionMultiplier: 1.5,
      riskTolerance: 1.3, // Willing to attack at 1.3:1 ratio
      baseScoreBonus: 30,
    },
    defensive: {
      aggressionMultiplier: 0.7,
      riskTolerance: 2.5, // Only attacks at 2.5:1 ratio
      baseScoreBonus: -20,
    },
    chaotic: {
      aggressionMultiplier: 1.3,
      riskTolerance: 1.0, // Will even take even fights
      baseScoreBonus: 15,
    },
    isolationist: {
      aggressionMultiplier: 0.5,
      riskTolerance: 3.0, // Very cautious
      baseScoreBonus: -30,
    },
    trickster: {
      aggressionMultiplier: 1.1,
      riskTolerance: 1.8,
      baseScoreBonus: 0,
    },
    balanced: {
      aggressionMultiplier: 1.0,
      riskTolerance: 2.0,
      baseScoreBonus: 0,
    },
  };

  return PERSONALITY_CONFIGS[personality || 'balanced'] || PERSONALITY_CONFIGS.balanced;
}

/**
 * Calculate attack score based on power ratio
 *
 * Evaluates how favorable the attacker-to-defender army ratio is:
 * - 3:1 or better: Overwhelming force (high score)
 * - 2:1 to 3:1: Strong advantage (medium score)
 * - 1.5:1 to 2:1: Slight advantage (low score)
 * - Below 1.5:1: Too risky (negative score)
 *
 * Scores are multiplied by aggressionMultiplier to reflect personality.
 *
 * @param powerRatio - Ratio of attacker armies to defender armies
 * @param aggressionMultiplier - Personality-based multiplier
 * @returns Object with score and reason
 */
function calculatePowerRatioScore(
  powerRatio: number,
  aggressionMultiplier: number,
): { score: number; reason: string } {
  if (powerRatio >= 3) {
    return {
      score: 100 * aggressionMultiplier,
      reason: 'overwhelming force',
    };
  } else if (powerRatio >= 2) {
    return {
      score: 50 * aggressionMultiplier,
      reason: 'strong advantage',
    };
  } else if (powerRatio >= 1.5) {
    return {
      score: 20 * aggressionMultiplier,
      reason: 'slight advantage',
    };
  } else {
    return {
      score: -50 / aggressionMultiplier,
      reason: 'too risky',
    };
  }
}

/**
 * Evaluate strategic value of capturing a territory
 *
 * Considers multiple factors that make a territory valuable:
 * - Strategic value: Inherent importance (geographic, political)
 * - Production bonus: Economic/military production capacity
 * - Region completion: Bonus for completing a full region
 * - Control status: Uncontrolled territories are easier to capture
 * - Conflict risk: High-risk territories are less attractive unless strong
 *
 * @param territory - Target territory to evaluate
 * @param powerRatio - Attacker-to-defender army ratio
 * @param aiId - ID of the attacking AI nation
 * @param territories - All territories in the game
 * @returns Object with total score and list of reasons
 */
function evaluateStrategicValue(
  territory: TerritoryState,
  powerRatio: number,
  aiId: string,
  territories: Record<string, TerritoryState>,
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // Strategic value of target
  score += territory.strategicValue * 10;
  if (territory.strategicValue >= 4) {
    reasons.push('high strategic value');
  }

  // Production bonus
  score += territory.productionBonus * 5;
  if (territory.productionBonus >= 3) {
    reasons.push('valuable production');
  }

  // Check if capturing would complete a region
  const completesRegion = wouldCompleteRegion(territory.id, aiId, territories);
  if (completesRegion) {
    score += 80;
    reasons.push(`completes ${completesRegion.name} (+${completesRegion.bonus} bonus)`);
  }

  // Prefer attacking uncontrolled territories (easier)
  if (!territory.controllingNationId) {
    score += 30;
    reasons.push('uncontrolled territory');
  }

  // Avoid high conflict risk territories unless we're strong
  if (territory.conflictRisk > 20 && powerRatio < 2.5) {
    score -= 20;
    reasons.push('high conflict risk');
  }

  return { score, reasons };
}

// ============================================================================
// Main Attack Evaluation Function
// ============================================================================

/**
 * Evaluate if attacking a territory is a good idea
 *
 * Orchestrates multiple evaluation factors:
 * 1. Personality-based modifiers (aggression, risk tolerance)
 * 2. Army availability check
 * 3. Power ratio evaluation
 * 4. Strategic value assessment
 *
 * @param fromTerritory - Attacking territory
 * @param toTerritory - Target territory
 * @param aiId - ID of the attacking AI nation
 * @param territories - All territories in the game
 * @param personality - AI personality type
 * @returns Score and reasoning for the attack
 */
function evaluateAttack(
  fromTerritory: TerritoryState,
  toTerritory: TerritoryState,
  aiId: string,
  territories: Record<string, TerritoryState>,
  personality?: string,
): { score: number; reason: string } {
  let score = 0;
  const reasons: string[] = [];

  // Get personality-based modifiers
  const modifiers = getPersonalityModifiers(personality);
  score += modifiers.baseScoreBonus;

  // Must have enough armies to attack (leave at least 1 behind)
  const availableArmies = fromTerritory.armies - 1;
  if (availableArmies < 1) {
    return { score: -1000, reason: 'Not enough armies' };
  }

  // Calculate power ratio
  const powerRatio = availableArmies / Math.max(1, toTerritory.armies);

  // Check if attack meets personality's risk tolerance
  if (powerRatio < modifiers.riskTolerance && personality) {
    score -= 40;
    reasons.push('below risk tolerance');
  }

  // Evaluate power ratio advantage
  const powerRatioEval = calculatePowerRatioScore(powerRatio, modifiers.aggressionMultiplier);
  score += powerRatioEval.score;
  reasons.push(powerRatioEval.reason);

  // Evaluate strategic value of the target
  const strategicEval = evaluateStrategicValue(toTerritory, powerRatio, aiId, territories);
  score += strategicEval.score;
  reasons.push(...strategicEval.reasons);

  return { score, reason: reasons.join(', ') };
}

/**
 * Check if capturing a territory would complete a region
 */
function wouldCompleteRegion(
  targetTerritoryId: string,
  aiId: string,
  territories: Record<string, TerritoryState>,
): RegionInfo | null {
  // Find regions that contain this territory
  for (const region of REGIONS) {
    if (!region.territoryIds.includes(targetTerritoryId)) continue;

    // Check if we would control all territories in this region after capturing
    const wouldControlAll = region.territoryIds.every(tid => {
      if (tid === targetTerritoryId) return true; // We're capturing this one
      const territory = territories[tid];
      return territory?.controllingNationId === aiId;
    });

    if (wouldControlAll) {
      return region;
    }
  }

  return null;
}

/**
 * Find the best attack for an AI nation
 */
export function findBestAttack(
  aiId: string,
  territories: Record<string, TerritoryState>,
  personality?: string,
): AIDecision | null {
  let bestAttack: AIDecision | null = null;
  let bestScore = -Infinity;

  const aiTerritories = Object.values(territories).filter(
    t => t.controllingNationId === aiId
  );

  // Evaluate all possible attacks
  for (const fromTerritory of aiTerritories) {
    // Must have armies to attack
    if (fromTerritory.armies <= 1) continue;

    // Check each neighbor
    for (const neighborId of fromTerritory.neighbors) {
      const toTerritory = territories[neighborId];
      if (!toTerritory) continue;

      // Don't attack our own territories
      if (toTerritory.controllingNationId === aiId) continue;

      // Evaluate this attack
      const evaluation = evaluateAttack(fromTerritory, toTerritory, aiId, territories, personality);

      if (evaluation.score > bestScore && evaluation.score > 0) {
        bestScore = evaluation.score;

        // Calculate how many armies to use
        // Use enough for 2:1 advantage, but leave some behind
        const targetArmies = Math.min(
          fromTerritory.armies - 1,
          Math.ceil(toTerritory.armies * 2)
        );

        bestAttack = {
          type: 'attack',
          fromTerritoryId: fromTerritory.id,
          toTerritoryId: toTerritory.id,
          armies: Math.max(1, targetArmies),
          reason: `Attack ${toTerritory.name}: ${evaluation.reason} (score: ${evaluation.score})`,
        };
      }
    }
  }

  return bestAttack;
}

/**
 * Find the best move to consolidate forces
 */
export function findBestMove(
  aiId: string,
  territories: Record<string, TerritoryState>,
): AIDecision | null {
  const aiTerritories = Object.values(territories).filter(
    t => t.controllingNationId === aiId
  );

  // Find border territories (adjacent to enemy)
  const borderTerritories = aiTerritories.filter(territory => {
    return territory.neighbors.some(neighborId => {
      const neighbor = territories[neighborId];
      return neighbor && neighbor.controllingNationId !== aiId;
    });
  });

  // Find interior territories with excess armies
  const interiorTerritories = aiTerritories
    .filter(t => !borderTerritories.includes(t))
    .filter(t => t.armies > 2); // Has excess armies

  if (interiorTerritories.length === 0 || borderTerritories.length === 0) {
    return null;
  }

  // Find weakest border territory
  const weakestBorder = borderTerritories.reduce((min, t) =>
    t.armies < min.armies ? t : min
  );

  // Find interior territory with most excess armies that can reach border
  let bestSource: TerritoryState | null = null;
  let bestArmies = 0;

  for (const interior of interiorTerritories) {
    const canReachBorder = canReachTerritory(
      interior.id,
      weakestBorder.id,
      territories,
      aiId
    );

    if (canReachBorder && interior.armies - 1 > bestArmies) {
      bestSource = interior;
      bestArmies = interior.armies - 1;
    }
  }

  if (!bestSource) return null;

  // Find the path and move to first step
  const path = findPath(bestSource.id, weakestBorder.id, territories, aiId);
  if (!path || path.length < 2) return null;

  return {
    type: 'move',
    fromTerritoryId: path[0],
    toTerritoryId: path[1],
    armies: Math.floor(bestArmies / 2), // Move half
    reason: `Consolidate ${Math.floor(bestArmies / 2)} armies to border at ${weakestBorder.name}`,
  };
}

/**
 * Decide where to place reinforcements
 */
export function placeReinforcements(
  aiId: string,
  territories: Record<string, TerritoryState>,
  reinforcements: number,
): AIDecision[] {
  const decisions: AIDecision[] = [];
  const aiTerritories = Object.values(territories).filter(
    t => t.controllingNationId === aiId
  );

  if (aiTerritories.length === 0) return decisions;

  // Strategy 1: Reinforce territories that can complete a region
  const nearCompleteRegions = findNearCompleteRegions(aiId, territories);
  for (const info of nearCompleteRegions) {
    if (reinforcements <= 0) break;

    // Find the missing territory's neighbors we control
    const controlledNeighbors = aiTerritories.filter(t =>
      info.missingTerritory?.neighbors.includes(t.id)
    );

    if (controlledNeighbors.length > 0) {
      // Reinforce the strongest adjacent territory
      const best = controlledNeighbors.reduce((max, t) =>
        t.armies > max.armies ? t : max
      );

      const amount = Math.min(5, reinforcements);
      decisions.push({
        type: 'reinforce',
        toTerritoryId: best.id,
        armies: amount,
        reason: `Build up for ${info.region.name} completion (+${info.region.bonus} bonus)`,
      });
      reinforcements -= amount;
    }
  }

  // Strategy 2: Reinforce border territories under threat
  const borderTerritories = aiTerritories
    .filter(territory => {
      return territory.neighbors.some(neighborId => {
        const neighbor = territories[neighborId];
        return neighbor &&
               neighbor.controllingNationId !== aiId &&
               neighbor.armies >= territory.armies; // Enemy is strong
      });
    })
    .sort((a, b) => {
      // Sort by most threatened (enemy has most advantage)
      const aThreat = Math.max(...a.neighbors.map(nid => {
        const n = territories[nid];
        return n && n.controllingNationId !== aiId ? n.armies - a.armies : 0;
      }));
      const bThreat = Math.max(...b.neighbors.map(nid => {
        const n = territories[nid];
        return n && n.controllingNationId !== aiId ? n.armies - b.armies : 0;
      }));
      return bThreat - aThreat;
    });

  for (const territory of borderTerritories) {
    if (reinforcements <= 0) break;

    const amount = Math.min(3, reinforcements);
    decisions.push({
      type: 'reinforce',
      toTerritoryId: territory.id,
      armies: amount,
      reason: `Fortify border at ${territory.name}`,
    });
    reinforcements -= amount;
  }

  // Strategy 3: Distribute remaining to strategic territories
  while (reinforcements > 0 && aiTerritories.length > 0) {
    const strategic = aiTerritories
      .filter(t => t.strategicValue >= 3)
      .sort((a, b) => b.strategicValue - a.strategicValue);

    const target = strategic[0] || aiTerritories[0];
    const amount = Math.min(3, reinforcements);

    decisions.push({
      type: 'reinforce',
      toTerritoryId: target.id,
      armies: amount,
      reason: `Strengthen strategic position at ${target.name}`,
    });
    reinforcements -= amount;
  }

  return decisions;
}

/**
 * Check if a path exists between two territories through owned territories
 */
function canReachTerritory(
  fromId: string,
  toId: string,
  territories: Record<string, TerritoryState>,
  ownerId: string,
): boolean {
  const visited = new Set<string>();
  const queue = [fromId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (currentId === toId) return true;
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const current = territories[currentId];
    if (!current || current.controllingNationId !== ownerId) continue;

    for (const neighborId of current.neighbors) {
      const neighbor = territories[neighborId];
      if (neighbor && neighbor.controllingNationId === ownerId && !visited.has(neighborId)) {
        queue.push(neighborId);
      }
    }
  }

  return false;
}

/**
 * Find shortest path between territories through owned territories
 */
function findPath(
  fromId: string,
  toId: string,
  territories: Record<string, TerritoryState>,
  ownerId: string,
): string[] | null {
  const visited = new Set<string>();
  const queue: Array<{ id: string; path: string[] }> = [{ id: fromId, path: [fromId] }];

  while (queue.length > 0) {
    const { id: currentId, path } = queue.shift()!;
    if (currentId === toId) return path;
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const current = territories[currentId];
    if (!current || current.controllingNationId !== ownerId) continue;

    for (const neighborId of current.neighbors) {
      const neighbor = territories[neighborId];
      if (neighbor && neighbor.controllingNationId === ownerId && !visited.has(neighborId)) {
        queue.push({ id: neighborId, path: [...path, neighborId] });
      }
    }
  }

  return null;
}

/**
 * Find regions that are close to completion
 */
function findNearCompleteRegions(
  aiId: string,
  territories: Record<string, TerritoryState>,
): Array<{ region: RegionInfo; missingTerritory: TerritoryState | null }> {
  const nearComplete: Array<{ region: RegionInfo; missingTerritory: TerritoryState | null }> = [];

  for (const region of REGIONS) {
    const controlled = region.territoryIds.filter(tid => {
      const territory = territories[tid];
      return territory && territory.controllingNationId === aiId;
    });

    // If we control all but one territory in the region
    if (controlled.length === region.territoryIds.length - 1) {
      const missingId = region.territoryIds.find(tid => {
        const territory = territories[tid];
        return !territory || territory.controllingNationId !== aiId;
      });

      const missingTerritory = missingId ? territories[missingId] : null;
      nearComplete.push({ region, missingTerritory });
    }
  }

  return nearComplete;
}

/**
 * Make a full AI turn decision
 */
export function makeAITurn(
  aiId: string,
  territories: Record<string, TerritoryState>,
  reinforcements: number,
): {
  reinforcements: AIDecision[];
  attacks: AIDecision[];
  moves: AIDecision[];
} {
  const result = {
    reinforcements: [] as AIDecision[],
    attacks: [] as AIDecision[],
    moves: [] as AIDecision[],
  };

  // Phase 1: Place reinforcements
  if (reinforcements > 0) {
    result.reinforcements = placeReinforcements(aiId, territories, reinforcements);
  }

  // Phase 2: Execute attacks (up to 3 attacks per turn)
  for (let i = 0; i < 3; i++) {
    const attack = findBestAttack(aiId, territories);
    if (!attack) break;
    result.attacks.push(attack);

    // Simulate the attack succeeding (for planning purposes)
    // In reality, this would be resolved by the game engine
    const fromTerritory = territories[attack.fromTerritoryId!];
    const toTerritory = territories[attack.toTerritoryId!];
    if (fromTerritory && toTerritory) {
      // Assume we win if we have 2:1 advantage
      if (fromTerritory.armies >= toTerritory.armies * 2) {
        toTerritory.controllingNationId = aiId;
        toTerritory.armies = Math.floor(fromTerritory.armies * 0.6); // Lose some in battle
        fromTerritory.armies = Math.ceil(fromTerritory.armies * 0.4);
      } else {
        break; // Don't continue attacking if we don't have clear advantage
      }
    }
  }

  // Phase 3: Consolidate forces (1-2 moves)
  for (let i = 0; i < 2; i++) {
    const move = findBestMove(aiId, territories);
    if (!move) break;
    result.moves.push(move);
  }

  return result;
}
