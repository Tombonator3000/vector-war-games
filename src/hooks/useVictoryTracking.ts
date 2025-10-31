import { useMemo } from 'react';
import type { Nation } from '@/types/game';
import type {
  VictoryAnalysis,
  VictoryPath,
  VictoryCondition,
  VictoryMilestone,
  VictoryType,
} from '@/types/victory';
import { safePercentage, safeDivide } from '@/lib/safeMath';

interface UseVictoryTrackingProps {
  nations: Nation[];
  playerName: string;
  currentTurn: number;
  defcon: number;
  diplomacyState?: {
    peaceTurns: number;
    allianceRatio: number;
    influenceScore: number;
  };
}

export function useVictoryTracking({
  nations,
  playerName,
  currentTurn,
  defcon,
  diplomacyState,
}: UseVictoryTrackingProps): VictoryAnalysis {
  return useMemo(() => {
    const playerNation = nations.find((n) => n.name === playerName);
    if (!playerNation) {
      return createEmptyAnalysis();
    }

    const aliveNations = nations.filter((n) => n.population > 0);
    const totalNations = aliveNations.length;
    const aliveEnemies = aliveNations.filter((n) => n.name !== playerName);

    // Calculate each victory path
    const diplomaticPath = calculateDiplomaticVictory(
      playerNation,
      aliveNations,
      defcon,
      diplomacyState
    );
    const dominationPath = calculateDominationVictory(playerNation, aliveEnemies, nations);
    const economicPath = calculateEconomicVictory(playerNation);
    const demographicPath = calculateDemographicVictory(playerNation, nations);
    const survivalPath = calculateSurvivalVictory(playerNation, currentTurn);
    const culturalPath = calculateCulturalVictory(playerNation, aliveNations);

    const paths = [
      diplomaticPath,
      dominationPath,
      economicPath,
      demographicPath,
      survivalPath,
      culturalPath,
    ];

    // Find closest victory
    const sortedPaths = [...paths].sort((a, b) => b.progress - a.progress);
    const closestPath = sortedPaths[0];
    const closestVictory = closestPath.progress > 0 ? closestPath.type : null;

    // Find recommended path (highest progress that's not blocked)
    const viablePaths = paths.filter((p) => !p.isBlocked && p.progress > 0);
    const recommendedPath =
      viablePaths.length > 0
        ? viablePaths.sort((a, b) => b.progress - a.progress)[0].type
        : null;

    // Generate warnings
    const warnings: string[] = [];
    if (defcon <= 2 && diplomaticPath.progress > 50) {
      warnings.push('Low DEFCON blocks Diplomatic Victory - restore peace!');
    }
    if (aliveEnemies.length === 0 && dominationPath.progress < 100) {
      warnings.push('No enemies left but victory not achieved - check conditions');
    }

    return {
      paths,
      closestVictory,
      turnsUntilClosestVictory: closestPath.estimatedTurnsToVictory,
      recommendedPath,
      warnings,
    };
  }, [nations, playerName, currentTurn, defcon, diplomacyState]);
}

function calculateDiplomaticVictory(
  player: Nation,
  allNations: Nation[],
  defcon: number,
  diplomacyState?: {
    peaceTurns: number;
    allianceRatio: number;
    influenceScore: number;
  }
): VictoryPath {
  const totalNations = allNations.length - 1; // Exclude player
  const requiredAlliances = Math.ceil(totalNations * 0.6); // 60% of nations
  const currentAlliances = player.alliances?.length || 0;
  const requiredPeaceTurns = 4;
  const peaceTurns = diplomacyState?.peaceTurns || 0;
  const requiredInfluence = 120;
  const currentInfluence = diplomacyState?.influenceScore || 0;

  const conditions: VictoryCondition[] = [
    {
      id: 'alliances',
      description: 'Form alliances with 60% of nations',
      current: currentAlliances,
      required: requiredAlliances,
      isMet: currentAlliances >= requiredAlliances,
      unit: 'nations',
    },
    {
      id: 'peace',
      description: 'Maintain peace (DEFCON ≥4) for consecutive turns',
      current: peaceTurns,
      required: requiredPeaceTurns,
      isMet: peaceTurns >= requiredPeaceTurns,
      unit: 'turns',
    },
    {
      id: 'influence',
      description: 'Achieve global influence score',
      current: currentInfluence,
      required: requiredInfluence,
      isMet: currentInfluence >= requiredInfluence,
      unit: 'points',
    },
  ];

  const progress = calculateOverallProgress(conditions);
  const isBlocked = defcon <= 2;

  const milestones: VictoryMilestone[] = [];
  if (!conditions[0].isMet) {
    milestones.push({
      description: `Form ${requiredAlliances - currentAlliances} more alliance${
        requiredAlliances - currentAlliances !== 1 ? 's' : ''
      }`,
      actionHint: 'Diplomacy → Propose Alliance',
      priority: 'critical',
    });
  }
  if (!conditions[1].isMet) {
    milestones.push({
      description: `Maintain DEFCON ≥4 for ${requiredPeaceTurns - peaceTurns} more turn${
        requiredPeaceTurns - peaceTurns !== 1 ? 's' : ''
      }`,
      actionHint: 'Avoid aggressive actions',
      priority: 'critical',
    });
  }
  if (!conditions[2].isMet) {
    milestones.push({
      description: `Gain ${requiredInfluence - currentInfluence} more influence`,
      actionHint: 'Form alliances and avoid war',
      priority: 'important',
    });
  }

  return {
    type: 'diplomatic',
    name: 'Diplomatic Victory',
    icon: '🤝',
    description: 'Unite nations through alliances and peace',
    progress,
    conditions,
    nextMilestones: milestones,
    estimatedTurnsToVictory: isBlocked ? null : estimateTurnsToVictory(conditions, 2),
    isBlocked,
    blockReason: isBlocked ? 'DEFCON too low - restore peace first' : undefined,
    color: 'blue',
  };
}

function calculateDominationVictory(
  player: Nation,
  aliveEnemies: Nation[],
  allNations: Nation[]
): VictoryPath {
  // Calculate total initial enemies (all nations except player, including eliminated)
  const totalInitialEnemies = allNations.filter((n) => n.name !== player.name).length;
  const enemiesDestroyed = totalInitialEnemies - aliveEnemies.length;

  const conditions: VictoryCondition[] = [
    {
      id: 'eliminate_all',
      description: 'Eliminate all rival nations',
      current: enemiesDestroyed,
      required: totalInitialEnemies,
      isMet: aliveEnemies.length === 0,
      unit: 'nations',
    },
  ];

  const progress = aliveEnemies.length === 0 ? 100 : safePercentage(enemiesDestroyed, totalInitialEnemies, 0);

  const milestones: VictoryMilestone[] = [];
  if (aliveEnemies.length > 0) {
    milestones.push({
      description: `Destroy ${aliveEnemies.length} remaining nation${
        aliveEnemies.length !== 1 ? 's' : ''
      }`,
      actionHint: 'Launch nuclear weapons or conventional assault',
      priority: 'critical',
    });
    if (player.missiles < 10) {
      milestones.push({
        description: 'Build more missiles for offensive capability',
        actionHint: 'Production → Build Missiles',
        priority: 'important',
      });
    }
  }

  return {
    type: 'domination',
    name: 'Total Domination',
    icon: '☢️',
    description: 'Destroy all rival nations through force',
    progress,
    conditions,
    nextMilestones: milestones,
    estimatedTurnsToVictory: aliveEnemies.length > 0 ? aliveEnemies.length * 3 : 0,
    isBlocked: false,
    color: 'red',
  };
}

function calculateEconomicVictory(player: Nation): VictoryPath {
  const requiredCities = 10;
  const currentCities = player.cities || 0;

  const conditions: VictoryCondition[] = [
    {
      id: 'cities',
      description: 'Control 10+ cities through territorial expansion',
      current: currentCities,
      required: requiredCities,
      isMet: currentCities >= requiredCities,
      unit: 'cities',
    },
  ];

  const progress = Math.min(100, safePercentage(currentCities, requiredCities, 0));

  const milestones: VictoryMilestone[] = [];
  if (!conditions[0].isMet) {
    const citiesNeeded = requiredCities - currentCities;
    milestones.push({
      description: `Build ${citiesNeeded} more city${citiesNeeded !== 1 ? 'ies' : ''}`,
      actionHint: 'Production → Build City (150 Production each)',
      priority: 'critical',
    });
    milestones.push({
      description: 'Control territories to build cities',
      actionHint: 'Territory Map → Capture territories',
      priority: 'important',
    });
  }

  return {
    type: 'economic',
    name: 'Economic Victory',
    icon: '🏭',
    description: 'Build industrial empire through cities',
    progress,
    conditions,
    nextMilestones: milestones,
    estimatedTurnsToVictory: conditions[0].isMet ? 0 : (requiredCities - currentCities) * 4,
    isBlocked: false,
    color: 'green',
  };
}

function calculateDemographicVictory(player: Nation, allNations: Nation[]): VictoryPath {
  const totalPopulation = allNations.reduce((sum, n) => sum + n.population, 0);
  const playerPopulation = player.population;
  const populationPercent = safePercentage(playerPopulation, totalPopulation, 0);
  const requiredPercent = 60;
  const currentInstability = player.instability || 0;
  const maxInstability = 30;

  const conditions: VictoryCondition[] = [
    {
      id: 'population',
      description: 'Control 60% of world population',
      current: Math.round(populationPercent),
      required: requiredPercent,
      isMet: populationPercent >= requiredPercent,
      unit: '%',
    },
    {
      id: 'stability',
      description: 'Maintain low instability (<30)',
      current: currentInstability,
      required: maxInstability,
      isMet: currentInstability < maxInstability,
      unit: 'points',
    },
  ];

  const progress = calculateOverallProgress(conditions);

  const milestones: VictoryMilestone[] = [];
  if (!conditions[0].isMet) {
    milestones.push({
      description: `Increase population control to ${requiredPercent}%`,
      actionHint: 'Accept refugees, conquer populated territories',
      priority: 'critical',
    });
  }
  if (!conditions[1].isMet) {
    milestones.push({
      description: 'Reduce instability through governance',
      actionHint: 'Improve morale and public opinion',
      priority: 'important',
    });
  }

  return {
    type: 'demographic',
    name: 'Demographic Victory',
    icon: '👥',
    description: 'Control majority of world population',
    progress,
    conditions,
    nextMilestones: milestones,
    estimatedTurnsToVictory: estimateTurnsToVictory(conditions, 8),
    isBlocked: false,
    color: 'purple',
  };
}

function calculateSurvivalVictory(player: Nation, currentTurn: number): VictoryPath {
  const requiredTurns = 50;
  const requiredPopulation = 50_000_000;
  const currentPopulation = player.population;

  const conditions: VictoryCondition[] = [
    {
      id: 'turns',
      description: 'Survive 50+ turns',
      current: currentTurn,
      required: requiredTurns,
      isMet: currentTurn >= requiredTurns,
      unit: 'turns',
    },
    {
      id: 'population',
      description: 'Maintain population above 50M',
      current: currentPopulation,
      required: requiredPopulation,
      isMet: currentPopulation >= requiredPopulation,
      unit: 'people',
    },
  ];

  const progress = calculateOverallProgress(conditions);

  const milestones: VictoryMilestone[] = [];
  if (!conditions[0].isMet) {
    milestones.push({
      description: `Survive ${requiredTurns - currentTurn} more turn${
        requiredTurns - currentTurn !== 1 ? 's' : ''
      }`,
      actionHint: 'Focus on defense and survival',
      priority: 'critical',
    });
  }
  if (!conditions[1].isMet) {
    milestones.push({
      description: 'Protect population - build defenses',
      actionHint: 'Production → Build Defense Systems',
      priority: 'critical',
    });
  }

  return {
    type: 'survival',
    name: 'Survival Victory',
    icon: '🛡️',
    description: 'Survive 50 turns with 50M+ population',
    progress,
    conditions,
    nextMilestones: milestones,
    estimatedTurnsToVictory: conditions[0].isMet && conditions[1].isMet ? 0 : requiredTurns - currentTurn,
    isBlocked: false,
    color: 'gray',
  };
}

function calculateCulturalVictory(player: Nation, allNations: Nation[]): VictoryPath {
  // Cultural victory requires special research/tech
  const hasPropagandaTech = false; // TODO: Check actual tech
  const currentInfluence = 0; // TODO: Add propaganda influence tracking

  const conditions: VictoryCondition[] = [
    {
      id: 'propaganda',
      description: 'Research Propaganda Victory technology',
      current: hasPropagandaTech ? 1 : 0,
      required: 1,
      isMet: hasPropagandaTech,
      unit: 'tech',
    },
    {
      id: 'influence',
      description: 'Convert enemy leadership through propaganda',
      current: currentInfluence,
      required: 80,
      isMet: currentInfluence >= 80,
      unit: 'influence',
    },
  ];

  const progress = calculateOverallProgress(conditions);

  const milestones: VictoryMilestone[] = [
    {
      description: 'Research Propaganda Victory technology',
      actionHint: 'Research → Advanced Technologies',
      priority: 'critical',
    },
    {
      description: 'Build cultural influence through diplomacy',
      actionHint: 'Available in Late Game Era (Turn 26+)',
      priority: 'important',
    },
  ];

  return {
    type: 'cultural',
    name: 'Cultural Victory',
    icon: '📻',
    description: 'Win hearts and minds through propaganda',
    progress,
    conditions,
    nextMilestones: milestones,
    estimatedTurnsToVictory: null,
    isBlocked: !hasPropagandaTech,
    blockReason: 'Requires Late Game Era technology',
    color: 'yellow',
  };
}

// Helper functions
function calculateOverallProgress(conditions: VictoryCondition[]): number {
  if (conditions.length === 0) return 0;
  const totalProgress = conditions.reduce((sum, condition) => {
    const conditionProgress = Math.min(100, safePercentage(condition.current, condition.required, 0));
    return sum + conditionProgress;
  }, 0);
  return Math.round(safeDivide(totalProgress, conditions.length, 0));
}

function estimateTurnsToVictory(conditions: VictoryCondition[], avgTurnsPerCondition: number): number | null {
  const unmetConditions = conditions.filter((c) => !c.isMet);
  if (unmetConditions.length === 0) return 0;
  return unmetConditions.length * avgTurnsPerCondition;
}

function createEmptyAnalysis(): VictoryAnalysis {
  return {
    paths: [],
    closestVictory: null,
    turnsUntilClosestVictory: null,
    recommendedPath: null,
    warnings: [],
  };
}
