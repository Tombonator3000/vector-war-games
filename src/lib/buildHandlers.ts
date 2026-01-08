/**
 * Build and Production Handlers
 * Extracted from Index.tsx - Session 4 refactoring
 *
 * Handles all build and production actions:
 * - Missiles, bombers, defenses, cities, warheads
 * - Build context validation
 * - Research modal handling
 */

import { toast } from '@/components/ui/use-toast';
import { PlayerManager } from '@/state';
import {
  canAfford,
  pay,
  getCityCost,
  getCityBuildTime,
} from '@/lib/gameUtils';
import {
  clampDefenseValue,
  MAX_DEFENSE_LEVEL,
} from '@/lib/nuclearDamage';
import {
  COSTS,
  RESEARCH_LOOKUP,
  WARHEAD_YIELD_TO_ID,
} from '@/lib/gameConstants';
import type { GameState, Nation } from '@/types/game';
import type { ReactNode } from 'react';

// ============================================================
// DEPENDENCY INJECTION TYPES
// ============================================================

export interface BuildHandlerDependencies {
  S: GameState;
  isGameStarted: boolean;
  AudioSys: {
    playSFX: (sound: string) => void;
  };
  log: (message: string, level?: string) => void;
  updateDisplay: () => void;
  consumeAction: () => void;
  closeModal: () => void;
  openModal: (title: string, content: ReactNode) => void;
  requestApproval: (action: string, options?: { description?: string }) => Promise<boolean>;
  setCivInfoDefaultTab: (tab: string) => void;
  setCivInfoPanelOpen: (open: boolean) => void;
}

export interface HandleBuildDeps extends BuildHandlerDependencies {
  renderBuildModal: () => ReactNode;
}

// ============================================================
// BUILD CONTEXT VALIDATION
// ============================================================

export function getBuildContextExtracted(
  actionLabel: string,
  deps: BuildHandlerDependencies
): Nation | null {
  const { S, isGameStarted } = deps;

  if (!isGameStarted) {
    toast({ title: 'Simulation inactive', description: 'Start the scenario before issuing build orders.' });
    return null;
  }

  if (S.gameOver) {
    toast({ title: 'Conflict resolved', description: 'Further production orders are unnecessary.' });
    return null;
  }

  const player = PlayerManager.get();
  if (!player) {
    toast({ title: 'No command authority', description: 'Unable to locate the player nation.' });
    return null;
  }

  if (S.phase !== 'PLAYER') {
    toast({ title: 'Out of phase', description: `${actionLabel} orders can only be issued during the player phase.` });
    return null;
  }

  if (S.actionsRemaining <= 0) {
    toast({
      title: 'No actions remaining',
      description: 'End the turn or adjust DEFCON to regain command capacity.',
    });
    return null;
  }

  return player;
}

// ============================================================
// BUILD ACTIONS
// ============================================================

export function buildMissileExtracted(deps: BuildHandlerDependencies): void {
  const { AudioSys, log, updateDisplay, consumeAction, closeModal } = deps;

  const player = getBuildContextExtracted('Build', deps);
  if (!player) return;

  if (!canAfford(player, COSTS.missile)) {
    toast({ title: 'Insufficient production', description: 'You need 8 production to assemble an ICBM.' });
    return;
  }

  pay(player, COSTS.missile);
  player.missiles = (player.missiles || 0) + 1;

  AudioSys.playSFX('build');
  log(`${player.name} builds a missile`);
  toast({
    title: '🚀 ICBM Constructed',
    description: `Strategic arsenal increased to ${player.missiles} missiles.`,
  });
  updateDisplay();
  consumeAction();
  closeModal();
}

export function buildBomberExtracted(deps: BuildHandlerDependencies): void {
  const { AudioSys, log, updateDisplay, consumeAction, closeModal } = deps;

  const player = getBuildContextExtracted('Build', deps);
  if (!player) return;

  if (!canAfford(player, COSTS.bomber)) {
    toast({ title: 'Insufficient production', description: 'Strategic bombers cost 20 production to deploy.' });
    return;
  }

  pay(player, COSTS.bomber);
  player.bombers = (player.bombers || 0) + 1;

  AudioSys.playSFX('build');
  log(`${player.name} commissions a strategic bomber`);
  toast({
    title: '✈️ Bomber Wing Deployed',
    description: `Strategic bomber fleet expanded to ${player.bombers} wings.`,
  });
  updateDisplay();
  consumeAction();
  closeModal();
}

export function buildDefenseExtracted(deps: BuildHandlerDependencies): void {
  const { AudioSys, log, updateDisplay, consumeAction, closeModal } = deps;

  const player = getBuildContextExtracted('Defense upgrade', deps);
  if (!player) return;

  const currentDefense = player.defense ?? 0;

  if (!player.researched?.defense_grid) {
    const projectName = RESEARCH_LOOKUP.defense_grid?.name ?? 'Orbital Defense Grid';
    toast({
      title: 'Defense network offline',
      description: `Complete the ${projectName} research to authorize orbital defense upgrades.`,
    });
    return;
  }

  if (currentDefense >= MAX_DEFENSE_LEVEL) {
    toast({
      title: 'Defense grid at capacity',
      description: `Your ABM network is already at the maximum rating of ${MAX_DEFENSE_LEVEL}.`,
    });
    return;
  }

  if (!canAfford(player, COSTS.defense)) {
    toast({ title: 'Insufficient production', description: 'Defense upgrades require 15 production.' });
    return;
  }

  pay(player, COSTS.defense);
  player.defense = clampDefenseValue(currentDefense + 2);
  const defenseGain = Math.max(0, (player.defense ?? 0) - currentDefense);
  const defenseGainDisplay = defenseGain >= 1
    ? Math.round(defenseGain).toString()
    : defenseGain.toFixed(1).replace(/\.0$/, '');

  AudioSys.playSFX('build');
  log(`${player.name} reinforces continental defense (+${defenseGainDisplay})`);
  toast({
    title: '🛡️ Defense System Upgraded',
    description: `ABM network strength increased to ${player.defense}.`,
  });
  updateDisplay();
  consumeAction();
  closeModal();
}

export function buildCityExtracted(deps: BuildHandlerDependencies): void {
  const { AudioSys, log, updateDisplay, consumeAction, closeModal } = deps;

  const player = getBuildContextExtracted('Infrastructure', deps);
  if (!player) return;

  // Check if already constructing a city
  if (player.cityConstructionQueue) {
    toast({
      title: 'Construction in Progress',
      description: `A city is already under construction (${player.cityConstructionQueue.turnsRemaining} turns remaining).`
    });
    return;
  }

  const cityCost = getCityCost(player);
  if (!canAfford(player, cityCost)) {
    const costText = Object.entries(cityCost)
      .map(([resource, amount]) => `${amount} ${resource.toUpperCase().replace('_', ' ')}`)
      .join(' & ');
    toast({ title: 'Insufficient resources', description: `Constructing a new city requires ${costText}.` });
    return;
  }

  pay(player, cityCost);

  const buildTime = getCityBuildTime(player);
  player.cityConstructionQueue = {
    turnsRemaining: buildTime,
    totalTurns: buildTime,
  };

  const nextCityNumber = (player.cities || 1) + 1;
  AudioSys.playSFX('build');
  log(`${player.name} begins construction of city #${nextCityNumber} (${buildTime} turns)`);
  toast({
    title: '🏗️ City Construction Started',
    description: `Construction of city #${nextCityNumber} will complete in ${buildTime} turns.`,
  });
  updateDisplay();
  consumeAction();
  closeModal();
}

export function buildWarheadExtracted(yieldMT: number, deps: BuildHandlerDependencies): void {
  const { AudioSys, log, updateDisplay, consumeAction, closeModal } = deps;

  const player = getBuildContextExtracted('Warhead production', deps);
  if (!player) return;

  const researchId = WARHEAD_YIELD_TO_ID.get(yieldMT);
  if (researchId && !player.researched?.[researchId]) {
    const projectName = RESEARCH_LOOKUP[researchId]?.name || `${yieldMT}MT program`;
    toast({ title: 'Technology unavailable', description: `Research ${projectName} before producing this warhead.` });
    return;
  }

  const costKey = `warhead_${yieldMT}` as keyof typeof COSTS;
  const cost = COSTS[costKey];
  if (!cost) {
    toast({ title: 'Unknown cost', description: `No cost data for ${yieldMT}MT warheads.` });
    return;
  }

  if (!canAfford(player, cost)) {
    const requirements = Object.entries(cost)
      .map(([resource, amount]) => `${amount} ${resource.toUpperCase()}`)
      .join(' & ');
    toast({ title: 'Insufficient resources', description: `Producing this warhead requires ${requirements}.` });
    return;
  }

  pay(player, cost);
  player.warheads = player.warheads || {};
  player.warheads[yieldMT] = (player.warheads[yieldMT] || 0) + 1;

  AudioSys.playSFX('build');
  log(`${player.name} assembles a ${yieldMT}MT warhead`);
  toast({
    title: '☢️ Warhead Assembled',
    description: `${yieldMT}MT warhead added. Stockpile: ${player.warheads[yieldMT]} units.`,
  });
  updateDisplay();
  consumeAction();
  closeModal();
}

// ============================================================
// MODAL HANDLERS
// ============================================================

export async function handleBuildExtracted(deps: HandleBuildDeps): Promise<void> {
  const { AudioSys, openModal, renderBuildModal, requestApproval } = deps;

  const approved = await requestApproval('BUILD', { description: 'Strategic production request' });
  if (!approved) return;
  AudioSys.playSFX('click');
  openModal('STRATEGIC PRODUCTION', renderBuildModal());
}

export async function handleResearchExtracted(deps: BuildHandlerDependencies): Promise<void> {
  const { AudioSys, requestApproval, setCivInfoDefaultTab, setCivInfoPanelOpen } = deps;

  const approved = await requestApproval('RESEARCH', { description: 'Research directive access' });
  if (!approved) return;
  AudioSys.playSFX('click');
  setCivInfoDefaultTab('research');
  setCivInfoPanelOpen(true);
}
