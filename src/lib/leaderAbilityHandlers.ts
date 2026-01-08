/**
 * Leader Ability System Handlers
 *
 * Extracted from Index.tsx (Session 5)
 * Handles leader ability activation and effects
 */

import type { Nation } from '@/types/game';
import type { GameState } from '@/types/game';
import PlayerManager from '@/state/PlayerManager';
import GameStateManager from '@/state/GameStateManager';
import { activateLeaderAbility } from '@/lib/leaderAbilityIntegration';
import { mapAbilityCategoryToNewsCategory } from '@/lib/leaderDoctrineHandlers';

/**
 * Dependencies required for handleUseLeaderAbility
 */
export interface LeaderAbilityDeps {
  /** Toast notification function */
  toast: (payload: { title: string; description: string; variant?: 'destructive' }) => void;
  /** Game state reference */
  gameState: GameState;
  /** Nations array reference */
  nations: Nation[];
  /** Log message function */
  log: (message: string, tone?: string) => void;
  /** Add news item function */
  addNewsItem: (category: string, message: string, priority?: string) => void;
  /** Update display function */
  updateDisplay: () => void;
}

/**
 * Handle leader ability activation
 *
 * Activates doctrine-specific leader abilities (MAD, First Strike, Peaceful Coexistence, etc.)
 *
 * @param targetId - Optional target nation ID for abilities that require a target
 * @param deps - Dependency injection object
 */
export function handleUseLeaderAbility(
  targetId: string | undefined,
  deps: LeaderAbilityDeps
): void {
  const player = PlayerManager.get();
  if (!player?.leaderAbilityState) {
    deps.toast({
      title: 'Leader ability unavailable',
      description: 'Your leader does not have an activatable ability.',
      variant: 'destructive',
    });
    return;
  }

  const { ability } = player.leaderAbilityState;
  const abilityName = ability.name;
  const abilityCategory = ability.category;
  const result = activateLeaderAbility(player, deps.gameState, targetId);

  if (result.success) {
    deps.toast({
      title: `${abilityName} activated`,
      description: result.message,
    });
    deps.log(`${player.name} activates ${abilityName}: ${result.message}`, 'success');
    const newsCategory = mapAbilityCategoryToNewsCategory(abilityCategory);
    deps.addNewsItem(newsCategory, `${player.name} activates ${abilityName}`, 'important');
    result.effects.forEach(effect => {
      deps.addNewsItem(newsCategory, effect, 'important');
    });
  } else {
    deps.toast({
      title: 'Unable to activate ability',
      description: result.message,
      variant: 'destructive',
    });
    deps.log(`Leader ability failed: ${result.message}`, 'warning');
  }

  GameStateManager.setNations([...deps.nations]);
  PlayerManager.setNations([...deps.nations]);
  deps.updateDisplay();
}
