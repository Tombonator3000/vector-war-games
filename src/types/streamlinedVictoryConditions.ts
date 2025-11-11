/**
 * STREAMLINED VICTORY CONDITIONS
 *
 * Clear, achievable victory paths reduced from 6 to 4.
 * Each path has well-defined, trackable conditions.
 */

import type { Nation } from './game';
import type { GameState } from '../state/GameStateManager';

export interface VictoryPathDefinition {
  type: 'diplomatic' | 'domination' | 'economic' | 'survival';
  name: string;
  description: string;
  conditions: VictoryConditionCheck[];
  icon: string;
  color: string;
}

export interface VictoryConditionCheck {
  id: string;
  description: string;
  check: (player: Nation, nations: Nation[], gameState: GameState) => boolean;
  getProgress: (player: Nation, nations: Nation[], gameState: GameState) => {
    current: number;
    required: number;
    unit: string;
  };
}

/**
 * Victory path definitions
 */
export const VICTORY_PATHS: VictoryPathDefinition[] = [
  {
    type: 'diplomatic',
    name: 'Elder Council',
    description: 'Unite 60% of cults through unholy pacts and maintain reality stability',
    icon: '🤝',
    color: 'text-blue-500',
    conditions: [
      {
        id: 'alliance-ratio',
        description: 'Bound by dark pacts with 60% of living cults',
        check: (player, nations) => {
          const livingNations = nations.filter((n) => !n.eliminated && !n.isPlayer);
          if (livingNations.length === 0) return false;
          const alliedNations = livingNations.filter((n) =>
            player.alliances?.includes(n.id)
          );
          return alliedNations.length / livingNations.length >= 0.6;
        },
        getProgress: (player, nations) => {
          const livingNations = nations.filter((n) => !n.eliminated && !n.isPlayer);
          const alliedNations = livingNations.filter((n) =>
            player.alliances?.includes(n.id)
          );
          return {
            current: alliedNations.length,
            required: Math.ceil(livingNations.length * 0.6),
            unit: 'cults',
          };
        },
      },
      {
        id: 'peace-duration',
        description: 'Maintain Veil Thinning or better for 5 consecutive turns',
        check: (player, nations, gameState) => {
          const peaceTurns = gameState.diplomacy?.peaceTurns || 0;
          return peaceTurns >= 5 && gameState.defcon >= 4;
        },
        getProgress: (player, nations, gameState) => {
          const peaceTurns = gameState.diplomacy?.peaceTurns || 0;
          return {
            current: gameState.defcon >= 4 ? peaceTurns : 0,
            required: 5,
            unit: 'turns',
          };
        },
      },
    ],
  },
  {
    type: 'domination',
    name: 'Cosmic Supremacy',
    description: 'Annihilate all rival cults',
    icon: '💀',
    color: 'text-red-500',
    conditions: [
      {
        id: 'eliminate-all',
        description: 'All rival cults destroyed',
        check: (player, nations) => {
          const livingEnemies = nations.filter((n) => !n.eliminated && !n.isPlayer);
          return livingEnemies.length === 0;
        },
        getProgress: (player, nations) => {
          const totalEnemies = nations.filter((n) => !n.isPlayer).length;
          const eliminatedEnemies = nations.filter((n) => n.eliminated && !n.isPlayer).length;
          return {
            current: eliminatedEnemies,
            required: totalEnemies,
            unit: 'cults destroyed',
          };
        },
      },
    ],
  },
  {
    type: 'economic',
    name: 'Essence Dominion',
    description: 'Control 10 corrupted domains and maintain 200 essence per turn',
    icon: '💰',
    color: 'text-yellow-500',
    conditions: [
      {
        id: 'city-count',
        description: 'Control 10 or more corrupted domains',
        check: (player) => {
          return (player.cities || 0) >= 10;
        },
        getProgress: (player) => {
          return {
            current: player.cities || 0,
            required: 10,
            unit: 'domains',
          };
        },
      },
      {
        id: 'production-capacity',
        description: 'Generate 200+ essence per turn',
        check: (player) => {
          return player.production >= 200;
        },
        getProgress: (player) => {
          return {
            current: Math.floor(player.production),
            required: 200,
            unit: 'essence/turn',
          };
        },
      },
    ],
  },
  {
    type: 'survival',
    name: 'Awakening',
    description: 'Complete the summoning ritual in 50 turns with 50M+ cultists',
    icon: '🛡️',
    color: 'text-green-500',
    conditions: [
      {
        id: 'turn-count',
        description: 'Complete the ritual by turn 50',
        check: (player, nations, gameState) => {
          return gameState.turn >= 50;
        },
        getProgress: (player, nations, gameState) => {
          return {
            current: gameState.turn,
            required: 50,
            unit: 'turns',
          };
        },
      },
      {
        id: 'population-threshold',
        description: 'Maintain 50M+ devoted cultists',
        check: (player) => {
          return player.population >= 50;
        },
        getProgress: (player) => {
          return {
            current: Math.floor(player.population),
            required: 50,
            unit: 'million',
          };
        },
      },
    ],
  },
];

/**
 * Check if player has achieved victory
 */
export function checkVictory(
  player: Nation,
  nations: Nation[],
  gameState: GameState
): { achieved: boolean; type: VictoryType | null; progress: Record<string, number> } {
  const progress: Record<string, number> = {};

  for (const path of VICTORY_PATHS) {
    const allConditionsMet = path.conditions.every((condition) =>
      condition.check(player, nations, gameState)
    );

    // Calculate overall progress for this path (0-100)
    const conditionProgress = path.conditions.map((condition) => {
      const prog = condition.getProgress(player, nations, gameState);
      return Math.min(100, (prog.current / prog.required) * 100);
    });
    const avgProgress = conditionProgress.reduce((a, b) => a + b, 0) / conditionProgress.length;
    progress[path.type] = avgProgress;

    if (allConditionsMet) {
      return {
        achieved: true,
        type: path.type,
        progress,
      };
    }
  }

  return {
    achieved: false,
    type: null,
    progress,
  };
}

/**
 * Get victory progress for UI display
 */
export function getVictoryProgress(
  player: Nation,
  nations: Nation[],
  gameState: GameState
) {
  return VICTORY_PATHS.map((path) => {
    const conditions = path.conditions.map((condition) => {
      const progress = condition.getProgress(player, nations, gameState);
      const isMet = condition.check(player, nations, gameState);
      return {
        id: condition.id,
        description: condition.description,
        current: progress.current,
        required: progress.required,
        unit: progress.unit,
        isMet,
      };
    });

    const overallProgress =
      conditions.reduce((sum, c) => sum + Math.min(100, (c.current / c.required) * 100), 0) /
      conditions.length;

    return {
      type: path.type,
      name: path.name,
      description: path.description,
      icon: path.icon,
      color: path.color,
      progress: Math.floor(overallProgress),
      conditions,
    };
  });
}

export type VictoryType = 'diplomatic' | 'domination' | 'economic' | 'survival';
