import { useMemo } from 'react';
import type { Nation } from '@/types/game';
import type {
  VictoryAnalysis,
  VictoryPath,
  VictoryCondition,
  VictoryMilestone,
  VictoryType,
} from '@/types/victory';
import { getVictoryProgress, checkVictory, VICTORY_PATHS } from '@/types/streamlinedVictoryConditions';
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

    // Create a simplified gameState for victory checking
    const gameState = {
      turn: currentTurn,
      defcon,
      diplomacy: diplomacyState,
    };

    // Use streamlined victory system (4 paths: diplomatic, domination, economic, survival)
    const victoryCheck = checkVictory(playerNation, nations, gameState as any);
    const progressData = getVictoryProgress(playerNation, nations, gameState as any);

    // Convert streamlined data to VictoryPath format
    const paths: VictoryPath[] = progressData.map((pathData) => {
      const conditions: VictoryCondition[] = pathData.conditions.map((cond) => ({
        id: cond.id,
        description: cond.description,
        current: cond.current,
        required: cond.required,
        isMet: cond.isMet,
        unit: cond.unit,
      }));

      const milestones: VictoryMilestone[] = [];

      // Generate milestones based on unmet conditions
      conditions.forEach((cond) => {
        if (!cond.isMet) {
          milestones.push({
            description: cond.description,
            priority: 'critical',
          });
        }
      });

      // Estimate turns to victory
      const unmetConditions = conditions.filter(c => !c.isMet).length;
      const estimatedTurns = unmetConditions === 0 ? 0 : unmetConditions * 3;

      return {
        type: pathData.type,
        name: pathData.name,
        icon: pathData.icon,
        description: pathData.description,
        progress: pathData.progress,
        conditions,
        nextMilestones: milestones,
        estimatedTurnsToVictory: estimatedTurns > 0 ? estimatedTurns : 0,
        isBlocked: false,
        color: pathData.color.replace('text-', '').replace('-500', ''),
      };
    });

    // Find closest victory
    const sortedPaths = [...paths].sort((a, b) => b.progress - a.progress);
    const closestPath = sortedPaths[0];
    const closestVictory = closestPath && closestPath.progress > 0 ? closestPath.type : null;

    // Find recommended path (highest progress that's not blocked)
    const viablePaths = paths.filter((p) => !p.isBlocked && p.progress > 0);
    const recommendedPath =
      viablePaths.length > 0
        ? viablePaths.sort((a, b) => b.progress - a.progress)[0].type
        : null;

    // Generate warnings
    const warnings: string[] = [];
    const diplomaticPath = paths.find(p => p.type === 'diplomatic');
    if (defcon <= 2 && diplomaticPath && diplomaticPath.progress > 50) {
      warnings.push('Low DEFCON blocks Diplomatic Victory - restore peace!');
    }

    const aliveEnemies = nations.filter((n) => !n.eliminated && !n.isPlayer && n.name !== playerName);
    const dominationPath = paths.find(p => p.type === 'domination');
    if (aliveEnemies.length === 0 && dominationPath && dominationPath.progress < 100) {
      warnings.push('No enemies left but victory not achieved - check conditions');
    }

    return {
      paths,
      closestVictory,
      turnsUntilClosestVictory: closestPath?.estimatedTurnsToVictory || null,
      recommendedPath,
      warnings,
    };
  }, [nations, playerName, currentTurn, defcon, diplomacyState]);
}

// Helper function
function createEmptyAnalysis(): VictoryAnalysis {
  return {
    paths: [],
    closestVictory: null,
    turnsUntilClosestVictory: null,
    recommendedPath: null,
    warnings: [],
  };
}
