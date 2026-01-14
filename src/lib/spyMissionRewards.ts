/**
 * Spy Mission Rewards Generator
 *
 * Calculates and generates rewards for successful spy missions based on mission type.
 * Extracted from spyNetworkUtils.ts for improved modularity and maintainability.
 */

import type { Nation, GameState } from '@/types/game';
import type { SpyMissionType, MissionReward } from '@/types/spySystem';

/**
 * Generate mission rewards based on mission type
 *
 * @param missionType - Type of spy mission completed
 * @param target - Nation that was targeted by the mission
 * @param spyNation - Nation that conducted the mission
 * @param gameState - Current game state for contextual rewards
 * @returns MissionReward object containing various reward types
 */
export function generateMissionRewards(
  missionType: SpyMissionType,
  target: Nation,
  spyNation: Nation,
  gameState: GameState
): MissionReward {
  const rewards: MissionReward = {};

  switch (missionType) {
    case 'steal-tech':
      // Steal random research from target
      if (target.researched) {
        const completedResearch = Object.keys(target.researched).filter(
          (key) => target.researched![key] && !spyNation.researched?.[key]
        );
        if (completedResearch.length > 0) {
          const stolen = completedResearch[Math.floor(Math.random() * completedResearch.length)];
          rewards.techStolen = stolen;
        }
      }
      rewards.intelGained = 30;
      break;

    case 'sabotage-production':
      rewards.productionDamage = Math.floor(target.production * 0.3);
      break;

    case 'sabotage-military':
      rewards.otherEffects = ['Destroyed military equipment', 'Reduced readiness'];
      break;

    case 'rig-election':
      rewards.moraleImpact = -15;
      rewards.otherEffects = ['Election results influenced', 'Political instability'];
      break;

    case 'sow-dissent':
      // Reduce trust with other nations
      const trustImpact: Record<string, number> = {};
      const nations = gameState.nations.filter((n) => n.id !== target.id && !n.eliminated);
      nations.slice(0, 2).forEach((nation) => {
        trustImpact[nation.id] = -10;
      });
      rewards.trustImpact = trustImpact;
      break;

    case 'assassination':
      rewards.leaderAssassinated = true;
      rewards.otherEffects = ['Leader assassinated', 'Political chaos', 'Emergency elections'];
      break;

    case 'gather-intel':
      rewards.intelGained = 40;
      rewards.otherEffects = ['Valuable intelligence gathered'];
      break;

    case 'propaganda':
      rewards.moraleImpact = -10;
      break;

    case 'recruit-asset':
      rewards.otherEffects = ['Local asset recruited', 'Future operations easier'];
      break;

    case 'cyber-assist':
      rewards.otherEffects = ['Cyber defenses weakened'];
      break;

    case 'false-flag':
      rewards.otherEffects = ['False flag operation successful', 'Another nation implicated'];
      break;

    case 'exfiltrate':
      rewards.intelGained = 25;
      rewards.otherEffects = ['Asset exfiltrated successfully'];
      break;

    case 'counter-intel':
      rewards.otherEffects = ['Counter-intelligence operation successful'];
      break;
  }

  return rewards;
}
