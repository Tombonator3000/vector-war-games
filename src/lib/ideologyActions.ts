/**
 * Ideology Actions
 *
 * Player actions related to the ideology system
 */

import type { Nation, GameState } from '../types/game';
import type { IdeologyType } from '../types/ideology';
import { startIdeologicalPressure, changeIdeology } from './ideologyManager';

/**
 * Player action: Spread ideology to target nation
 */
export function spreadIdeologyAction(
  playerNation: Nation,
  targetNation: Nation,
  gameState: GameState,
  log: (msg: string, type?: string) => void
): boolean {
  if (!playerNation.ideologyState) {
    log('No ideology system initialized', 'error');
    return false;
  }

  // Intel cost for spreading ideology
  const intelCost = 30;

  if (playerNation.intel < intelCost) {
    log(`Not enough intel! Need ${intelCost}, have ${playerNation.intel}`, 'error');
    return false;
  }

  // Start ideological pressure
  const pressure = startIdeologicalPressure(playerNation, targetNation, intelCost);

  if (pressure) {
    log(
      `Spreading ${playerNation.ideologyState.currentIdeology} ideology to ${targetNation.name} (Cost: ${intelCost} intel)`,
      'info'
    );
    return true;
  } else {
    log('Failed to spread ideology', 'error');
    return false;
  }
}

/**
 * Player action: Change nation's ideology
 */
export function changeIdeologyAction(
  playerNation: Nation,
  newIdeology: IdeologyType,
  gameState: GameState,
  log: (msg: string, type?: string) => void
): boolean {
  if (!playerNation.ideologyState) {
    log('No ideology system initialized', 'error');
    return false;
  }

  // Cost for changing ideology
  const intelCost = 50;
  const goldCost = 100;

  if (playerNation.intel < intelCost) {
    log(`Not enough intel! Need ${intelCost}, have ${playerNation.intel}`, 'error');
    return false;
  }

  if ((playerNation.gold || 0) < goldCost) {
    log(`Not enough gold! Need ${goldCost}, have ${playerNation.gold || 0}`, 'error');
    return false;
  }

  // Deduct costs
  playerNation.intel -= intelCost;
  playerNation.gold = (playerNation.gold || 0) - goldCost;

  // Change ideology
  const event = changeIdeology(playerNation, newIdeology, gameState.turn);

  if (event) {
    log(event.description, 'success');
    return true;
  } else {
    log('Failed to change ideology', 'error');
    return false;
  }
}

/**
 * Get intel cost for spreading ideology
 */
export function getSpreadIdeologyCost(): number {
  return 30;
}

/**
 * Get costs for changing ideology
 */
export function getChangeIdeologyCost(): { intel: number; gold: number } {
  return { intel: 50, gold: 100 };
}
