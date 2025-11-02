/**
 * Agenda System
 *
 * Functions for assigning, checking, and revealing leader agendas.
 * Agendas are personality traits that affect AI diplomatic decisions.
 */

import type { Nation } from '@/types/game';
import type { Agenda } from '@/types/negotiation';
import {
  getPrimaryAgendas,
  getHiddenAgendas,
  getAgendaById,
} from './agendaDefinitions';
import { getRelationship } from './relationshipUtils';
import { getTrust } from '@/types/trustAndFavors';

// ============================================================================
// Agenda Assignment
// ============================================================================

/**
 * Assign a primary and hidden agenda to an AI nation
 * Should be called during game initialization
 */
export function assignAgendas(
  nation: Nation,
  rng: () => number = Math.random
): Nation {
  const primaryAgendas = getPrimaryAgendas();
  const hiddenAgendas = getHiddenAgendas();

  // Pick random primary agenda
  const primaryIndex = Math.floor(rng() * primaryAgendas.length);
  const primary = { ...primaryAgendas[primaryIndex], isRevealed: true };

  // Pick random hidden agenda (different from primary if possible)
  const availableHidden = hiddenAgendas.filter(a => a.id !== primary.id);
  const hiddenIndex = Math.floor(rng() * availableHidden.length);
  const hidden = { ...availableHidden[hiddenIndex], isRevealed: false };

  // Store agendas in nation's data
  // We'll add agendas to a new field for now
  return {
    ...nation,
    // @ts-ignore - agendas field may not exist in Nation type yet
    agendas: [primary, hidden],
  };
}

/**
 * Initialize agendas for all AI nations
 */
export function initializeNationAgendas(
  nations: Nation[],
  playerNationId: string,
  rng: () => number = Math.random
): Nation[] {
  return nations.map(nation => {
    // Skip player nation
    if (nation.id === playerNationId) {
      return nation;
    }

    // Assign agendas to AI nations
    return assignAgendas(nation, rng);
  });
}

// ============================================================================
// Agenda Checking
// ============================================================================

/**
 * Check which agendas are being violated by the player
 */
export function checkAgendaViolations(
  playerNation: Nation,
  aiNation: Nation,
  gameState: any
): Agenda[] {
  const agendas: Agenda[] = (aiNation as any).agendas || [];
  const violations: Agenda[] = [];

  for (const agenda of agendas) {
    // Only check revealed agendas for violations
    if (!agenda.isRevealed) continue;

    if (agenda.checkCondition && agenda.checkCondition(playerNation, aiNation, gameState)) {
      // Check if this is a negative modifier
      const hasNegativeModifier = agenda.modifiers.some(m => m.effect < 0);
      if (hasNegativeModifier) {
        violations.push(agenda);
      }
    }
  }

  return violations;
}

/**
 * Calculate total relationship modifier from all agendas
 */
export function calculateAgendaModifier(
  playerNation: Nation,
  aiNation: Nation,
  gameState: any
): number {
  const agendas: Agenda[] = (aiNation as any).agendas || [];
  let totalModifier = 0;

  for (const agenda of agendas) {
    if (agenda.checkCondition && agenda.checkCondition(playerNation, aiNation, gameState)) {
      // Sum up all matching modifiers
      for (const modifier of agenda.modifiers) {
        totalModifier += modifier.effect;
      }
    }
  }

  return totalModifier;
}

/**
 * Calculate agenda bonus/penalty for negotiation evaluation
 */
export function calculateAgendaNegotiationBonus(
  playerNation: Nation,
  aiNation: Nation,
  gameState: any
): number {
  const agendas: Agenda[] = (aiNation as any).agendas || [];
  let totalBonus = 0;

  for (const agenda of agendas) {
    if (agenda.checkCondition && agenda.checkCondition(playerNation, aiNation, gameState)) {
      // Sum up evaluation bonuses
      for (const modifier of agenda.modifiers) {
        totalBonus += modifier.evaluationBonus || 0;
      }
    }
  }

  return totalBonus;
}

/**
 * Get feedback about agenda violations or approvals
 */
export function getAgendaFeedback(
  playerNation: Nation,
  aiNation: Nation,
  gameState: any
): string[] {
  const agendas: Agenda[] = (aiNation as any).agendas || [];
  const feedback: string[] = [];

  for (const agenda of agendas) {
    // Only give feedback for revealed agendas
    if (!agenda.isRevealed) continue;

    if (agenda.checkCondition && agenda.checkCondition(playerNation, aiNation, gameState)) {
      // Find matching modifiers
      for (const modifier of agenda.modifiers) {
        feedback.push(modifier.description);
      }
    }
  }

  return feedback;
}

// ============================================================================
// Agenda Revelation
// ============================================================================

/**
 * Check if a hidden agenda should be revealed to the player
 */
export function shouldRevealHiddenAgenda(
  playerNation: Nation,
  aiNation: Nation,
  currentTurn: number
): boolean {
  const relationship = getRelationship(aiNation, playerNation.id);
  const trust = getTrust(aiNation, playerNation.id);

  // Get first contact turn (if tracked)
  const firstContactTurn = (aiNation as any).firstContactTurn?.[playerNation.id] || currentTurn;
  const turnsKnown = currentTurn - firstContactTurn;

  // Revelation conditions:

  // 1. High relationship + good trust + time
  if (relationship > 25 && trust > 60 && turnsKnown > 10) {
    return true;
  }

  // 2. Very long contact (even if neutral)
  if (turnsKnown > 30) {
    return true;
  }

  // 3. Embassy established (future feature)
  if ((aiNation as any).hasEmbassyWith?.[playerNation.id]) {
    return true;
  }

  // 4. Alliance exists for sufficient time
  if (aiNation.alliances?.includes(playerNation.id) && turnsKnown > 15) {
    return true;
  }

  return false;
}

/**
 * Reveal a hidden agenda if conditions are met
 */
export function revealHiddenAgenda(
  playerNation: Nation,
  aiNation: Nation,
  currentTurn: number
): { nation: Nation; revealed: Agenda | null } {
  if (!shouldRevealHiddenAgenda(playerNation, aiNation, currentTurn)) {
    return { nation: aiNation, revealed: null };
  }

  const agendas: Agenda[] = (aiNation as any).agendas || [];
  const hiddenAgenda = agendas.find(a => !a.isRevealed);

  if (!hiddenAgenda) {
    return { nation: aiNation, revealed: null };
  }

  // Reveal the agenda
  const updatedAgendas = agendas.map(a =>
    a.id === hiddenAgenda.id ? { ...a, isRevealed: true } : a
  );

  return {
    nation: {
      ...aiNation,
      // @ts-ignore
      agendas: updatedAgendas,
    },
    revealed: hiddenAgenda,
  };
}

/**
 * Process agenda revelations for all AI nations
 * Returns updated nations array and list of newly revealed agendas
 */
export function processAgendaRevelations(
  nations: Nation[],
  playerNation: Nation,
  currentTurn: number
): {
  nations: Nation[];
  revelations: Array<{ nationId: string; agenda: Agenda }>;
} {
  const revelations: Array<{ nationId: string; agenda: Agenda }> = [];

  const updatedNations = nations.map(nation => {
    if (nation.id === playerNation.id) {
      return nation;
    }

    const result = revealHiddenAgenda(playerNation, nation, currentTurn);

    if (result.revealed) {
      revelations.push({
        nationId: nation.id,
        agenda: result.revealed,
      });
    }

    return result.nation;
  });

  return { nations: updatedNations, revelations };
}

// ============================================================================
// Agenda Queries
// ============================================================================

/**
 * Get all agendas for a nation
 */
export function getNationAgendas(nation: Nation): Agenda[] {
  return (nation as any).agendas || [];
}

/**
 * Get only revealed agendas for a nation
 */
export function getRevealedAgendas(nation: Nation): Agenda[] {
  const agendas: Agenda[] = (nation as any).agendas || [];
  return agendas.filter(a => a.isRevealed);
}

/**
 * Get primary agenda for a nation
 */
export function getPrimaryAgenda(nation: Nation): Agenda | null {
  const agendas: Agenda[] = (nation as any).agendas || [];
  return agendas.find(a => a.type === 'primary') || null;
}

/**
 * Get hidden agenda for a nation (may not be revealed to player)
 */
export function getHiddenAgenda(nation: Nation): Agenda | null {
  const agendas: Agenda[] = (nation as any).agendas || [];
  return agendas.find(a => a.type === 'hidden') || null;
}

/**
 * Check if a nation has a specific agenda
 */
export function hasAgenda(nation: Nation, agendaId: string): boolean {
  const agendas: Agenda[] = (nation as any).agendas || [];
  return agendas.some(a => a.id === agendaId);
}

/**
 * Check if a specific agenda is revealed to the player
 */
export function isAgendaRevealed(nation: Nation, agendaId: string): boolean {
  const agendas: Agenda[] = (nation as any).agendas || [];
  const agenda = agendas.find(a => a.id === agendaId);
  return agenda?.isRevealed || false;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get a human-readable description of a nation's agendas
 */
export function getAgendaDescription(nation: Nation, revealedOnly: boolean = true): string {
  const agendas = revealedOnly ? getRevealedAgendas(nation) : getNationAgendas(nation);

  if (agendas.length === 0) {
    return 'No known agendas';
  }

  return agendas
    .map(a => `${a.name}: ${a.description}`)
    .join('\n');
}

/**
 * Calculate overall agenda compatibility between player and AI
 * Returns a score from -100 (very incompatible) to +100 (very compatible)
 */
export function calculateAgendaCompatibility(
  playerNation: Nation,
  aiNation: Nation,
  gameState: any
): number {
  const agendas: Agenda[] = (aiNation as any).agendas || [];
  let compatibility = 0;
  let count = 0;

  for (const agenda of agendas) {
    if (agenda.checkCondition && agenda.checkCondition(playerNation, aiNation, gameState)) {
      for (const modifier of agenda.modifiers) {
        compatibility += modifier.effect;
        count++;
      }
    }
  }

  // Normalize to -100 to +100 range
  if (count === 0) return 0;
  return Math.max(-100, Math.min(100, compatibility));
}
