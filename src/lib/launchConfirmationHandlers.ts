/**
 * Launch Confirmation Handlers
 *
 * Extracted from Index.tsx (Session 5)
 * Handles final launch validation and execution for nuclear strikes
 */

import type { Nation } from '@/types/core';
import type { GameState } from '@/types/game';
import type { ActionConsequences, ConsequenceCalculationContext } from '@/types/consequences';
import type { PendingLaunchState } from '@/lib/attackHandlers';
import PlayerManager from '@/state/PlayerManager';
import GameStateManager from '@/state/GameStateManager';
import { calculateActionConsequences } from '@/lib/consequenceCalculator';
import { launch } from '@/lib/gamePhaseHandlers';
import { launchBomber, launchSubmarine } from '@/lib/nuclearLaunchHandlers';
import DoomsdayClock from '@/state/DoomsdayClock';

/**
 * Delivery method type
 */
export type DeliveryMethod = 'missile' | 'bomber' | 'submarine';

/**
 * Dependencies required for confirmPendingLaunch
 */
export interface LaunchConfirmationDeps {
  /** Pending launch state */
  pendingLaunch: PendingLaunchState | null;
  /** Selected warhead yield */
  selectedWarheadYield: number | null;
  /** Selected delivery method */
  selectedDeliveryMethod: DeliveryMethod | null;
  /** Toast notification function */
  toast: (payload: { title: string; description: string; variant?: 'destructive' }) => void;
  /** Reset launch control state */
  resetLaunchControl: () => void;
  /** Game state reference */
  gameState: GameState;
  /** Log message function */
  log: (message: string, tone?: string) => void;
  /** Trigger consequence alerts */
  triggerConsequenceAlerts: (consequences: ActionConsequences) => void;
  /** Consume action function */
  consumeAction: () => void;
  /** Queue consequence preview */
  queueConsequencePreview: (consequences: ActionConsequences, callback: () => void) => boolean;
  /** Set consequence preview state */
  setConsequencePreview: (consequences: ActionConsequences | null) => void;
  /** Set consequence callback */
  setConsequenceCallback: (callback: (() => void) | null) => void;
  /** Play sound effect */
  playSFX: (sound: string) => void;
}

/**
 * Confirm and execute pending nuclear launch
 *
 * Performs final validation and executes nuclear strike with selected warhead yield
 * and delivery method (ICBM, bomber, or submarine)
 *
 * @param deps - Dependency injection object
 */
export function confirmPendingLaunch(deps: LaunchConfirmationDeps): void {
  if (!deps.pendingLaunch || deps.selectedWarheadYield === null || !deps.selectedDeliveryMethod) {
    return;
  }

  const player = PlayerManager.get();
  if (!player) {
    deps.resetLaunchControl();
    return;
  }

  const selectedWarhead = deps.pendingLaunch.warheads.find(
    warhead => warhead.yield === deps.selectedWarheadYield
  );
  if (!selectedWarhead) {
    deps.toast({ title: 'Warhead unavailable', description: 'Select a valid warhead yield before launching.' });
    return;
  }

  if (deps.gameState.defcon > selectedWarhead.requiredDefcon) {
    deps.toast({
      title: 'DEFCON restriction',
      description: `Lower DEFCON to ${selectedWarhead.requiredDefcon} or less to deploy a ${deps.selectedWarheadYield}MT warhead.`,
    });
    return;
  }

  const availableWarheads = player.warheads?.[deps.selectedWarheadYield] ?? 0;
  if (availableWarheads <= 0) {
    deps.toast({ title: 'Warhead unavailable', description: 'Selected warhead is no longer ready for launch.' });
    deps.resetLaunchControl();
    return;
  }

  const missileCount = player.missiles || 0;
  const bomberCount = player.bombers || 0;
  const submarineCount = player.submarines || 0;

  if (deps.selectedDeliveryMethod === 'missile' && missileCount <= 0) {
    deps.toast({ title: 'No ICBMs ready', description: 'Select another delivery platform or build additional missiles.' });
    return;
  }

  if (deps.selectedDeliveryMethod === 'bomber' && bomberCount <= 0) {
    deps.toast({ title: 'No bombers ready', description: 'Select another delivery platform or build additional bombers.' });
    return;
  }

  if (deps.selectedDeliveryMethod === 'submarine' && submarineCount <= 0) {
    deps.toast({ title: 'No submarines ready', description: 'Select another delivery platform or build additional submarines.' });
    return;
  }

  const context: ConsequenceCalculationContext = {
    playerNation: player as Nation,
    targetNation: deps.pendingLaunch.target as Nation,
    allNations: GameStateManager.getNations(),
    currentDefcon: deps.gameState.defcon,
    currentTurn: deps.gameState.turn,
    gameState: deps.gameState as GameState,
  };

  const consequences = calculateActionConsequences('launch_missile', context, {
    warheadYield: deps.selectedWarheadYield,
    deliveryMethod: deps.selectedDeliveryMethod,
  });

  if (!consequences) {
    deps.toast({ title: 'Unable to analyze strike', description: 'Consequence system failed to respond.', variant: 'destructive' });
    return;
  }

  const executeLaunch = () => {
    let launchSucceeded = false;

    if (deps.selectedDeliveryMethod === 'missile') {
      launchSucceeded = launch(player, deps.pendingLaunch!.target, deps.selectedWarheadYield!);
    } else {
      player.warheads = player.warheads || {};
      const remaining = (player.warheads[deps.selectedWarheadYield!] || 0) - 1;
      if (remaining <= 0) {
        delete player.warheads[deps.selectedWarheadYield!];
      } else {
        player.warheads[deps.selectedWarheadYield!] = remaining;
      }

      if (deps.selectedDeliveryMethod === 'bomber') {
        player.bombers = Math.max(0, bomberCount - 1);
        launchSucceeded = launchBomber(player, deps.pendingLaunch!.target, { yield: deps.selectedWarheadYield! });
        if (launchSucceeded) {
          deps.log(`${player.name} dispatches bomber strike (${deps.selectedWarheadYield}MT) toward ${deps.pendingLaunch!.target.name}`);
          DoomsdayClock.tick(0.3);
          deps.playSFX('launch');
        }
      } else if (deps.selectedDeliveryMethod === 'submarine') {
        player.submarines = Math.max(0, submarineCount - 1);
        launchSucceeded = launchSubmarine(player, deps.pendingLaunch!.target, deps.selectedWarheadYield!);
        if (launchSucceeded) {
          deps.log(`${player.name} launches submarine strike (${deps.selectedWarheadYield}MT) toward ${deps.pendingLaunch!.target.name}`);
          DoomsdayClock.tick(0.3);
        }
      }
    }

    if (launchSucceeded) {
      deps.triggerConsequenceAlerts(consequences);
      deps.consumeAction();
      deps.resetLaunchControl();
    }
  };

  if (!deps.queueConsequencePreview(consequences, executeLaunch)) {
    deps.setConsequencePreview(consequences);
    deps.setConsequenceCallback(() => executeLaunch);
  }
}
