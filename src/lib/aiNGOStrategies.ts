/**
 * AI NGO Strategies
 * Provides AI nations with the ability to use NGO operations as strategic weapons
 */

import type { Nation } from '../types/game';
import type { NGOOperationType } from '../types/ngoSystem';
import {
  launchNGOOperation,
  upgradeNGOInfrastructure,
} from './ngoTurnProcessor';
import { NGO_OPERATION_TEMPLATES } from './ngoOperationsData';

/**
 * AI NGO Strategy Types
 * Different strategic approaches to using NGOs
 */
export type AINGOStrategy =
  | 'AGGRESSIVE_DESTABILIZATION'  // Max instability, mass immigration
  | 'COVERT_SUBVERSION'           // Stealth operations, border assistance
  | 'ECONOMIC_WARFARE'            // Brain drain, skilled worker theft
  | 'CULTURAL_DOMINANCE'          // Cultural exchange programs
  | 'OPPORTUNISTIC'               // Target weak nations
  | 'DEFENSIVE';                  // Minimal NGO use

/**
 * Map AI personalities to NGO strategies
 */
export function getAINGOStrategy(personality: string): AINGOStrategy {
  switch (personality) {
    case 'aggressive':
      return 'AGGRESSIVE_DESTABILIZATION';
    case 'trickster':
      return 'COVERT_SUBVERSION';
    case 'defensive':
      return 'DEFENSIVE';
    case 'balanced':
    default:
      return 'OPPORTUNISTIC';
  }
}

/**
 * Score a potential target for NGO operations
 */
function scoreNGOTarget(
  aiNation: Nation,
  target: Nation,
  nations: Nation[],
  strategy: AINGOStrategy
): number {
  let score = 0;

  // Base score: Don't target self or eliminated nations
  if (target.id === aiNation.id || target.eliminated) {
    return -1000;
  }

  // Don't target allies (treaty check)
  if (aiNation.treaties?.[target.id]?.allianceTurns) {
    return -1000;
  }

  // Don't target nations with truce
  if (aiNation.treaties?.[target.id]?.truceTurns) {
    return -500;
  }

  // Threat level: prioritize enemies
  const threatLevel = aiNation.threats?.[target.id] || 0;
  score += threatLevel * 2; // High threat = high priority

  // Population size: more population = more impact
  score += Math.min(target.population * 0.5, 50);

  // Existing instability: easier to destabilize unstable nations
  const targetInstability = target.instability || 0;
  score += targetInstability * 0.8;

  // Immigration policy: open borders = easier to exploit
  if (target.immigrationPolicy === 'open_borders') {
    score += 30;
  } else if (target.immigrationPolicy === 'humanitarian') {
    score += 20;
  } else if (target.immigrationPolicy === 'closed_borders') {
    score -= 20; // Harder to exploit
  }

  // Power ratio: prefer attacking stronger nations if aggressive
  const powerRatio = target.population / Math.max(aiNation.population, 1);
  if (strategy === 'AGGRESSIVE_DESTABILIZATION') {
    score += powerRatio * 15; // Target powerful nations
  } else if (strategy === 'OPPORTUNISTIC') {
    score += (1 - powerRatio) * 20; // Target weaker nations
  }

  // Relations: worse relations = higher priority
  const relations = aiNation.relations?.[target.id] || 0;
  score += Math.max(0, (50 - relations) * 0.5);

  // Strategy-specific bonuses
  switch (strategy) {
    case 'AGGRESSIVE_DESTABILIZATION':
      // Prefer highly populated, stable nations to cause maximum chaos
      if (targetInstability < 30 && target.population > 50) {
        score += 40;
      }
      break;

    case 'COVERT_SUBVERSION':
      // Prefer low-intel nations (easier to hide operations)
      if ((target.intel || 0) < 30) {
        score += 25;
      }
      break;

    case 'ECONOMIC_WARFARE':
      // Prefer technologically advanced nations (brain drain value)
      const targetTech = Object.keys(target.researched || {}).length;
      score += targetTech * 2;
      break;

    case 'CULTURAL_DOMINANCE':
      // Prefer culturally weak nations
      if ((target.publicOpinion || 50) < 40) {
        score += 20;
      }
      break;

    case 'OPPORTUNISTIC':
      // Prefer unstable, weak nations
      if (targetInstability > 50 && target.population < aiNation.population) {
        score += 35;
      }
      break;
  }

  return score;
}

/**
 * Select best NGO operation type for strategy
 */
function selectNGOOperationType(
  strategy: AINGOStrategy,
  aiNation: Nation,
  target: Nation
): NGOOperationType | null {
  const infrastructure = aiNation.ngoState?.ngoInfrastructure || 0;

  switch (strategy) {
    case 'AGGRESSIVE_DESTABILIZATION':
      // Prefer refugee resettlement for maximum impact
      if (
        infrastructure >= 50 &&
        aiNation.gold >= 300 &&
        aiNation.intel >= 50 &&
        aiNation.production >= 40
      ) {
        return 'refugee_resettlement';
      }
      // Fallback to migration advocacy
      if (aiNation.gold >= 180 && aiNation.intel >= 35) {
        return 'migration_advocacy';
      }
      break;

    case 'COVERT_SUBVERSION':
      // Prefer border assistance (covert)
      if (infrastructure >= 40 && aiNation.gold >= 250 && aiNation.intel >= 80) {
        return 'border_assistance';
      }
      // Fallback to humanitarian aid (lower detection)
      if (aiNation.gold >= 150 && aiNation.intel >= 20) {
        return 'humanitarian_aid';
      }
      break;

    case 'ECONOMIC_WARFARE':
      // Prefer migration advocacy (brain drain effect)
      if (aiNation.gold >= 180 && aiNation.intel >= 35) {
        return 'migration_advocacy';
      }
      break;

    case 'CULTURAL_DOMINANCE':
      // Prefer cultural exchange
      if (infrastructure >= 20 && aiNation.gold >= 200 && aiNation.production >= 30) {
        return 'cultural_exchange';
      }
      break;

    case 'OPPORTUNISTIC':
      // Choose best available based on resources
      if (
        infrastructure >= 50 &&
        aiNation.gold >= 300 &&
        aiNation.intel >= 50 &&
        aiNation.production >= 40
      ) {
        return 'refugee_resettlement';
      }
      if (aiNation.gold >= 250 && aiNation.intel >= 80) {
        return 'border_assistance';
      }
      if (aiNation.gold >= 180 && aiNation.intel >= 35) {
        return 'migration_advocacy';
      }
      if (aiNation.gold >= 150 && aiNation.intel >= 20) {
        return 'humanitarian_aid';
      }
      break;

    case 'DEFENSIVE':
      // Minimal NGO use, only humanitarian if very wealthy
      if (aiNation.gold >= 500 && aiNation.intel >= 50) {
        return 'humanitarian_aid';
      }
      break;
  }

  return null;
}

/**
 * Select source nation for NGO operation
 * Prefer nations that are: populated, destabilized, or neutral to AI
 */
function selectSourceNation(
  aiNation: Nation,
  target: Nation,
  nations: Nation[],
  strategy: AINGOStrategy
): Nation | null {
  const validSources = nations.filter(
    (n) =>
      n.id !== aiNation.id &&
      n.id !== target.id &&
      !n.eliminated &&
      n.population > 5
  );

  if (validSources.length === 0) return null;

  // Score each potential source
  const scoredSources = validSources.map((source) => {
    let score = 0;

    // Population: more population = more migrants available
    score += source.population * 2;

    // Instability: unstable sources are easier to extract from
    score += (source.instability || 0) * 1.5;

    // Relations with AI: prefer neutral or friendly sources
    const relations = aiNation.relations?.[source.id] || 0;
    score += relations * 0.3;

    // Immigration policy: open borders = easier to extract
    if (source.immigrationPolicy === 'open_borders') {
      score += 30;
    } else if (source.immigrationPolicy === 'humanitarian') {
      score += 20;
    }

    // Prefer sources that are NOT allied with target
    const sourceTargetAlliance = source.treaties?.[target.id]?.allianceTurns || 0;
    if (sourceTargetAlliance > 0) {
      score -= 50; // Avoid allied sources
    }

    // Economic warfare: prefer advanced sources (brain drain)
    if (strategy === 'ECONOMIC_WARFARE') {
      const techCount = Object.keys(source.researched || {}).length;
      score += techCount * 3;
    }

    return { source, score };
  });

  // Sort by score and return best source
  scoredSources.sort((a, b) => b.score - a.score);
  return scoredSources[0]?.source || null;
}

/**
 * Determine optimal operation duration
 */
function selectOperationDuration(
  operationType: NGOOperationType,
  strategy: AINGOStrategy,
  aiNation: Nation
): number {
  const template = NGO_OPERATION_TEMPLATES[operationType];
  if (!template) return 10;

  const minDuration = template.minDuration || 5;
  const maxDuration = template.maxDuration || 30;

  switch (strategy) {
    case 'AGGRESSIVE_DESTABILIZATION':
      // Max duration for max impact
      return maxDuration;

    case 'COVERT_SUBVERSION':
      // Shorter duration to reduce detection risk
      return Math.min(minDuration + 5, maxDuration);

    case 'ECONOMIC_WARFARE':
      // Medium duration
      return Math.floor((minDuration + maxDuration) / 2);

    case 'OPPORTUNISTIC':
      // Balance cost and impact
      return Math.floor((minDuration + maxDuration) / 2);

    default:
      return minDuration;
  }
}

/**
 * Main AI NGO decision function
 * Returns true if an NGO operation was launched
 */
export function aiNGOAction(
  aiNation: Nation,
  nations: Nation[],
  currentTurn: number,
  log: (message: string) => void
): boolean {
  // Initialize NGO state if needed
  if (!aiNation.ngoState) {
    aiNation.ngoState = {
      activeOperations: [],
      ngoInfrastructure: 0,
      maxActiveOperations: 2,
      ngoReputation: 50,
      exposedOperations: 0,
      totalMigrantsMoved: 0,
      totalOperationsLaunched: 0,
      successfulOperations: 0,
    };
  }

  const strategy = getAINGOStrategy(aiNation.aiPersonality || aiNation.ai || 'balanced');

  // Check if we should upgrade infrastructure first
  const shouldUpgradeInfrastructure =
    aiNation.ngoState.ngoInfrastructure < 80 &&
    aiNation.gold >= 250 &&
    aiNation.production >= 60 &&
    Math.random() < 0.3; // 30% chance to upgrade

  if (shouldUpgradeInfrastructure) {
    const result = upgradeNGOInfrastructure(aiNation);
    if (result.success) {
      log(`${aiNation.name} expands NGO infrastructure (Level ${aiNation.ngoState.ngoInfrastructure})`);
      return true;
    }
  }

  // Check if we can launch more operations
  const activeOps = aiNation.ngoState.activeOperations.length;
  const maxOps = aiNation.ngoState.maxActiveOperations;

  if (activeOps >= maxOps) {
    return false; // Already at capacity
  }

  // Defensive strategy uses NGOs rarely
  if (strategy === 'DEFENSIVE' && Math.random() > 0.15) {
    return false;
  }

  // Score all potential targets
  const scoredTargets = nations
    .map((target) => ({
      target,
      score: scoreNGOTarget(aiNation, target, nations, strategy),
    }))
    .filter((t) => t.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scoredTargets.length === 0) {
    return false; // No valid targets
  }

  const bestTarget = scoredTargets[0].target;

  // Select operation type
  const operationType = selectNGOOperationType(strategy, aiNation, bestTarget);
  if (!operationType) {
    return false; // Can't afford any operation
  }

  // Select source nation
  const sourceNation = selectSourceNation(aiNation, bestTarget, nations, strategy);
  if (!sourceNation) {
    return false; // No valid source
  }

  // Select duration
  const duration = selectOperationDuration(operationType, strategy, aiNation);

  // Launch the operation
  const result = launchNGOOperation(
    aiNation,
    sourceNation.id,
    bestTarget.id,
    operationType,
    duration,
    currentTurn
  );

  if (result.success) {
    const template = NGO_OPERATION_TEMPLATES[operationType];
    const operationName = template?.name || operationType;

    log(
      `${aiNation.name} launches ${operationName}: ${sourceNation.name} → ${bestTarget.name} (${duration} turns)`
    );

    // Extra detail for covert operations
    if (template?.covert) {
      log(`  [Intelligence] Covert operation detected - high detection risk`);
    }

    return true;
  }

  return false;
}

/**
 * AI infrastructure upgrade decision
 * Called separately to allow upgrading without launching operations
 */
export function aiNGOInfrastructureUpgrade(
  aiNation: Nation,
  log: (message: string) => void
): boolean {
  if (!aiNation.ngoState) {
    aiNation.ngoState = {
      activeOperations: [],
      ngoInfrastructure: 0,
      maxActiveOperations: 2,
      ngoReputation: 50,
      exposedOperations: 0,
      totalMigrantsMoved: 0,
      totalOperationsLaunched: 0,
      successfulOperations: 0,
    };
  }

  const strategy = getAINGOStrategy(aiNation.aiPersonality || aiNation.ai || 'balanced');

  // Defensive strategy rarely upgrades
  if (strategy === 'DEFENSIVE' && aiNation.ngoState.ngoInfrastructure >= 30) {
    return false;
  }

  // Determine target infrastructure level
  let targetLevel = 50;
  switch (strategy) {
    case 'AGGRESSIVE_DESTABILIZATION':
      targetLevel = 100;
      break;
    case 'COVERT_SUBVERSION':
      targetLevel = 80;
      break;
    case 'ECONOMIC_WARFARE':
      targetLevel = 70;
      break;
    case 'OPPORTUNISTIC':
      targetLevel = 60;
      break;
    case 'DEFENSIVE':
      targetLevel = 30;
      break;
  }

  // Only upgrade if below target and have resources
  if (
    aiNation.ngoState.ngoInfrastructure < targetLevel &&
    aiNation.gold >= 220 &&
    aiNation.production >= 55
  ) {
    const result = upgradeNGOInfrastructure(aiNation);
    if (result.success) {
      log(`${aiNation.name} upgrades NGO infrastructure to Level ${aiNation.ngoState.ngoInfrastructure}`);
      return true;
    }
  }

  return false;
}
