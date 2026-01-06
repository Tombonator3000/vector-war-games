/**
 * Culture Operations Handlers
 *
 * Extracted from Index.tsx (Session 5)
 * Handles cultural warfare operations including meme waves, cancel campaigns,
 * deepfakes, cultural victory, and eco propaganda
 */

import type { Nation } from '@/types/core';
import { PlayerManager } from '@/lib/managers/player';

/**
 * Operation action definition
 */
export interface OperationAction {
  id: string;
  title: string;
  subtitle: string;
  costText: string;
  requiresTarget?: boolean;
  disabled: boolean;
  disabledReason: string;
  targetFilter?: (nation: Nation) => boolean;
}

/**
 * Dependencies required for handleCulture
 */
export interface CultureHandlerDeps {
  /** Request approval from AI advisor */
  requestApproval: (action: string, payload: { description: string }) => Promise<boolean>;
  /** Play sound effect */
  playSFX: (sound: string) => void;
  /** Get build context (returns player nation if valid) */
  getBuildContext: (context: string) => Nation | undefined;
  /** Toast notification function */
  toast: (payload: { title: string; description: string }) => void;
  /** Log message function */
  log: (message: string, tone?: string) => void;
  /** Update display function */
  updateDisplay: () => void;
  /** Consume action function */
  consumeAction: () => void;
  /** End game function */
  endGame: (playerWon: boolean, reason: string) => void;
  /** Open modal function */
  openModal: (title: string, content: React.ReactNode) => void;
  /** Close modal function */
  closeModal: () => void;
  /** List of targetable nations */
  targetableNations: Nation[];
  /** Nations array reference */
  nations: Nation[];
}

/**
 * Create culture operation actions
 */
function createCultureActions(player: Nation): OperationAction[] {
  return [
    {
      id: 'meme',
      title: 'MEME WAVE',
      subtitle: 'Steal 5M pop, +8 instability',
      costText: 'Cost: 2 INTEL',
      requiresTarget: true,
      disabled: (player.intel || 0) < 2,
      disabledReason: 'Requires 2 INTEL to flood the networks.',
      targetFilter: nation => nation.population > 1,
    },
    {
      id: 'cancel',
      title: 'CANCEL CAMPAIGN',
      subtitle: 'Agitate regime supporters',
      costText: 'Cost: 3 INTEL',
      requiresTarget: true,
      disabled: (player.intel || 0) < 3,
      disabledReason: 'Requires 3 INTEL to fuel the outrage machine.',
    },
    {
      id: 'deepfake',
      title: 'DEEPFAKE OPS',
      subtitle: 'Target defense -2',
      costText: 'Cost: 5 INTEL',
      requiresTarget: true,
      disabled: (player.intel || 0) < 5,
      disabledReason: 'Requires 5 INTEL to produce convincing deepfakes.',
    },
    {
      id: 'victory',
      title: 'PROPAGANDA VICTORY',
      subtitle: 'Win via cultural dominance',
      costText: 'Requires 50 INTEL and majority influence',
      disabled: (player.intel || 0) < 50,
      disabledReason: 'Requires 50 INTEL to attempt cultural victory.',
    },
    {
      id: 'eco',
      title: 'ECO PROPAGANDA',
      subtitle: 'Force nuclear phase-out',
      costText: 'Cost: 30 PROD, 150 INTEL',
      requiresTarget: true,
      disabled: (player.intel || 0) < 150 || (player.production || 0) < 30,
      disabledReason: 'Requires 150 INTEL and 30 PRODUCTION to sway global opinion.',
    }
  ];
}

/**
 * Execute culture operation action
 *
 * @param action - The operation action to execute
 * @param target - Optional target nation
 * @param deps - Dependency injection object
 * @returns True if action succeeded
 */
function executeCultureAction(
  action: OperationAction,
  target: Nation | undefined,
  deps: CultureHandlerDeps
): boolean {
  const commander = PlayerManager.get();
  if (!commander) {
    deps.toast({ title: 'No command authority', description: 'Player nation could not be located.' });
    return false;
  }

  switch (action.id) {
    case 'meme':
      if (!target) return false;
      if ((commander.intel || 0) < 2) {
        deps.toast({ title: 'Insufficient intel', description: 'You need 2 INTEL to unleash the meme wave.' });
        return false;
      }
      commander.intel -= 2;
      {
        const stolen = Math.min(5, Math.max(1, Math.floor(target.population)));
        target.population = Math.max(0, target.population - stolen);
        commander.population += stolen;
        commander.migrantsThisTurn = (commander.migrantsThisTurn || 0) + stolen;
        commander.migrantsTotal = (commander.migrantsTotal || 0) + stolen;
        target.instability = (target.instability || 0) + 8;
        deps.log(`Meme wave steals ${stolen}M population from ${target.name}.`);
      }
      deps.updateDisplay();
      deps.consumeAction();
      return true;

    case 'cancel':
      if (!target) return false;
      if ((commander.intel || 0) < 3) {
        deps.toast({ title: 'Insufficient intel', description: 'You need 3 INTEL to sustain a cancel campaign.' });
        return false;
      }
      commander.intel -= 3;
      target.instability = (target.instability || 0) + 4;
      deps.log(`Cancel campaign inflames unrest in ${target.name}.`);
      deps.updateDisplay();
      deps.consumeAction();
      return true;

    case 'deepfake':
      if (!target) return false;
      if ((commander.intel || 0) < 5) {
        deps.toast({ title: 'Insufficient intel', description: 'You need 5 INTEL to produce deepfakes.' });
        return false;
      }
      commander.intel -= 5;
      target.defense = Math.max(0, target.defense - 2);
      deps.log(`Deepfake operation undermines ${target.name}'s defenses.`);
      deps.updateDisplay();
      deps.consumeAction();
      return true;

    case 'victory': {
      if ((commander.intel || 0) < 50) {
        deps.toast({ title: 'Insufficient intel', description: 'You need 50 INTEL to attempt a cultural victory.' });
        return false;
      }
      const totalIntel = deps.nations.reduce((sum, nation) => sum + (nation.intel || 0), 0);
      if (totalIntel <= 0) {
        deps.toast({ title: 'Insufficient data', description: 'No global intel footprint detected yet.' });
        return false;
      }
      const share = (commander.intel || 0) / totalIntel;
      if (share <= 0.5) {
        deps.toast({ title: 'Influence too low', description: 'Control more than half of the world\'s culture to win.' });
        return false;
      }
      commander.intel -= 50;
      deps.consumeAction();
      deps.endGame(true, 'CULTURAL VICTORY - Minds conquered without firing a shot!');
      return true;
    }

    case 'eco':
      if (!target) return false;
      if ((commander.intel || 0) < 150 || (commander.production || 0) < 30) {
        deps.toast({ title: 'Insufficient resources', description: 'You need 150 INTEL and 30 PRODUCTION to launch eco propaganda.' });
        return false;
      }
      commander.intel -= 150;
      commander.production = Math.max(0, (commander.production || 0) - 30);
      target.greenShiftTurns = (target.greenShiftTurns || 0) + 5;
      deps.log(`Eco propaganda forces ${target.name} to wind down nuclear production.`);
      deps.updateDisplay();
      deps.consumeAction();
      return true;
  }

  return false;
}

/**
 * Handle culture warfare operations
 *
 * Opens modal for cultural operations (meme waves, cancel campaigns, deepfakes, cultural victory, eco propaganda)
 *
 * @param deps - Dependency injection object
 * @param OperationModal - The OperationModal component
 */
export async function handleCulture(
  deps: CultureHandlerDeps,
  OperationModal: React.ComponentType<{
    actions: OperationAction[];
    player: Nation;
    targetableNations: Nation[];
    onExecute: (action: OperationAction, target?: Nation) => boolean;
    onClose: () => void;
    accent: string;
  }>
): Promise<void> {
  const approved = await deps.requestApproval('CULTURE', { description: 'Cultural operations briefing' });
  if (!approved) return;
  deps.playSFX('click');
  const player = deps.getBuildContext('Culture');
  if (!player) return;

  const cultureActions = createCultureActions(player);

  const executeAction = (action: OperationAction, target?: Nation) => {
    return executeCultureAction(action, target, deps);
  };

  deps.openModal(
    'CULTURE WARFARE',
    // @ts-expect-error - React component type mismatch
    <OperationModal
      actions={cultureActions}
      player={player}
      targetableNations={deps.targetableNations}
      onExecute={executeAction}
      onClose={deps.closeModal}
      accent="violet"
    />
  );
}
