/**
 * Attack and Strike Planning Handlers
 * Extracted from Index.tsx (Session 4 Part 2)
 *
 * Manages nuclear strike coordination and launch preparation.
 */

import { toast } from "@/components/ui/use-toast";
import type { Nation } from '@/types';
import type { GameState } from '@/lib/gameState';
import { PlayerManager } from '@/lib/PlayerManager';
import { canPerformAction } from '@/lib/actions';
import { WARHEAD_YIELD_TO_ID } from '@/lib/gameConstants';

export interface PendingLaunchState {
  target: Nation;
  warheads: Array<{ yield: number; count: number; requiredDefcon: 1 | 2 }>;
  deliveryOptions: Array<{ id: string; label: string; count: number }>;
}

export interface AttackHandlerDependencies {
  S: GameState;
  nations: Nation[];
  isGameStarted: boolean;
  isStrikePlannerOpen: boolean;
  selectedTargetId: string | null;
  AudioSys: { playSFX: (sound: string) => void };
  setIsStrikePlannerOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  setSelectedTargetId: (id: string | null) => void;
  setPendingLaunch: (state: PendingLaunchState | null) => void;
  setSelectedWarheadYield: (yield: number | null) => void;
  setSelectedDeliveryMethod: (method: string | null) => void;
  hasActivePeaceTreaty: (player: Nation, target: Nation) => boolean;
}

/**
 * Handles nuclear strike initiation and validates launch conditions
 */
export function handleAttackExtracted(deps: AttackHandlerDependencies): void {
  const {
    S,
    nations,
    isGameStarted,
    isStrikePlannerOpen,
    selectedTargetId,
    AudioSys,
    setIsStrikePlannerOpen,
    setSelectedTargetId,
    setPendingLaunch,
    setSelectedWarheadYield,
    setSelectedDeliveryMethod,
    hasActivePeaceTreaty,
  } = deps;

  AudioSys.playSFX('click');
  setIsStrikePlannerOpen(prev => {
    if (!prev) {
      return true;
    }
    return prev;
  });

  if (!isStrikePlannerOpen) {
    return;
  }

  if (!isGameStarted || S.gameOver) return;

  const player = PlayerManager.get();
  if (!player) return;

  if (S.phase !== 'PLAYER') {
    toast({ title: 'Cannot launch', description: 'Attacks are only available during your phase.' });
    return;
  }

  if (S.actionsRemaining <= 0) {
    toast({ title: 'No actions remaining', description: 'You must end your turn before launching another strike.' });
    return;
  }

  if (!canPerformAction('attack', S.defcon)) {
    toast({ title: 'DEFCON too high', description: 'Escalate to DEFCON 2 or lower before ordering an attack.' });
    return;
  }

  if (!selectedTargetId) {
    toast({ title: 'Select a target', description: 'Choose a target nation from the list before launching.' });
    return;
  }

  const target = nations.find(n => n.id === selectedTargetId && !n.isPlayer);
  if (!target || target.population <= 0) {
    toast({ title: 'Target unavailable', description: 'The selected target is no longer a valid threat.' });
    setSelectedTargetId(null);
    return;
  }

  if (hasActivePeaceTreaty(player, target)) {
    toast({ title: 'Treaty in effect', description: 'An active truce or alliance prevents launching against this nation.' });
    setSelectedTargetId(null);
    return;
  }

  const warheadEntries = Object.entries(player.warheads || {})
    .map(([yieldStr, count]) => ({ yield: Number(yieldStr), count: count as number }))
    .filter(entry => {
      if (entry.count <= 0) return false;
      if (entry.yield <= 10) return true;
      const researchId = WARHEAD_YIELD_TO_ID.get(entry.yield);
      if (!researchId) return true;
      return !!player.researched?.[researchId];
    })
    .map(entry => ({
      ...entry,
      requiredDefcon: (entry.yield > 50 ? 1 : 2) as 1 | 2,
    }))
    .sort((a, b) => b.yield - a.yield);

  if (warheadEntries.length === 0) {
    toast({ title: 'No warheads ready', description: 'Build warheads before attempting to launch.' });
    return;
  }

  const deliverableWarheads = warheadEntries.filter(entry => S.defcon <= entry.requiredDefcon);

  if (deliverableWarheads.length === 0) {
    const minDefcon = Math.min(...warheadEntries.map(entry => entry.requiredDefcon));
    toast({
      title: 'DEFCON restriction',
      description: `Lower DEFCON to ${minDefcon} or less to deploy available warheads.`,
    });
    return;
  }

  const missileCount = player.missiles || 0;
  const bomberCount = player.bombers || 0;
  const submarineCount = player.submarines || 0;

  if (missileCount <= 0 && bomberCount <= 0 && submarineCount <= 0) {
    toast({ title: 'No launch platforms', description: 'Construct missiles, bombers, or submarines before attacking.' });
    return;
  }

  const deliveryOptions: PendingLaunchState['deliveryOptions'] = [
    { id: 'missile', label: 'ICBM', count: missileCount },
    { id: 'bomber', label: 'Strategic Bomber', count: bomberCount },
    { id: 'submarine', label: 'Ballistic Submarine', count: submarineCount },
  ];

  setPendingLaunch({
    target,
    warheads: deliverableWarheads,
    deliveryOptions,
  });
  setSelectedWarheadYield(deliverableWarheads[0]?.yield ?? null);
  const defaultDelivery = deliveryOptions.find(option => option.count > 0)?.id ?? null;
  setSelectedDeliveryMethod(defaultDelivery);
}
