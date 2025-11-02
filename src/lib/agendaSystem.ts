/**
 * Agenda System
 *
 * Functions for assigning, checking, and revealing leader agendas.
 * Agendas are personality traits that affect AI diplomatic decisions.
 */

import type { Nation, GameState } from '@/types/game';
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
 * AI Personality to Agenda Bias Mapping
 * Higher weight = more likely to be selected for that personality
 */
const PERSONALITY_AGENDA_BIAS: Record<string, Record<string, number>> = {
  aggressive: {
    // Primary agendas
    'warmonger-hater': 0.5, // Ironic but possible
    'military-superiority': 2.5,
    'ideological-purist': 1.5,
    'anti-nuclear': 0.3,
    'peacemonger': 0.2,
    // Hidden agendas
    'expansionist': 2.5,
    'militarist': 2.0,
    'resource-hungry': 1.5,
    'opportunist': 1.5,
  },
  defensive: {
    // Primary agendas
    'loyal-friend': 2.0,
    'peacemonger': 1.8,
    'anti-nuclear': 1.5,
    'warmonger-hater': 1.5,
    'military-superiority': 0.5,
    // Hidden agendas
    'diplomat': 2.0,
    'trade-partner': 1.5,
    'cultural-preservationist': 1.5,
  },
  balanced: {
    // All agendas have equal weight (1.0) for balanced
  },
  chaotic: {
    // Chaotic favors extremes - either very high or very low for most agendas
    'warmonger-hater': 1.5,
    'ideological-purist': 0.5,
    'isolationist': 1.5,
    'peacemonger': 0.3,
    'opportunist': 2.5,
    'tech-enthusiast': 1.5,
  },
  trickster: {
    // Trickster personality
    'opportunist': 3.0,
    'diplomat': 1.8,
    'ideological-purist': 0.3,
    'loyal-friend': 0.5,
    'expansionist': 1.5,
  },
};

/**
 * Weighted random selection based on AI personality
 */
function selectAgendaWithBias(
  agendas: Agenda[],
  personality: string,
  rng: () => number = Math.random
): Agenda {
  const bias = PERSONALITY_AGENDA_BIAS[personality] || {};

  // Calculate weights for each agenda
  const weights = agendas.map(agenda => bias[agenda.id] || 1.0);
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  // Weighted random selection
  let random = rng() * totalWeight;
  for (let i = 0; i < agendas.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return agendas[i];
    }
  }

  // Fallback (should never happen)
  return agendas[agendas.length - 1];
}

/**
 * Predefined agendas for specific leaders (historical/special characters)
 */
interface PredefinedAgendas {
  primary?: string;
  hidden?: string;
}

const LEADER_PREDEFINED_AGENDAS: Record<string, PredefinedAgendas> = {
  // Cuban Crisis Historical Leaders
  'John F. Kennedy': {
    primary: 'peacemonger',
    hidden: 'diplomat',
  },
  'Nikita Khrushchev': {
    primary: 'military-superiority',
    hidden: 'expansionist',
  },
  'Fidel Castro': {
    primary: 'ideological-purist',
    hidden: 'militarist',
  },
  // Lovecraftian Leaders
  'Cthulhu': {
    primary: 'warmonger-hater', // Ironically hates war among lesser beings
    hidden: 'cultural-preservationist', // Preserves ancient ways
  },
  'Azathoth': {
    primary: 'ideological-purist', // Chaos as ideology
    hidden: 'opportunist', // Chaotic opportunism
  },
  'Nyarlathotep': {
    primary: 'isolationist', // Manipulates from shadows
    hidden: 'opportunist', // Master manipulator
  },
  'Hastur': {
    primary: 'peacemonger', // The Unspeakable wants silence
    hidden: 'cultural-preservationist',
  },
  'Shub-Niggurath': {
    primary: 'resource-guardian', // Mother of life forms
    hidden: 'expansionist', // The Black Goat spreads
  },
  'Yog-Sothoth': {
    primary: 'anti-nuclear', // Knows the consequences
    hidden: 'tech-enthusiast', // Gate and the Key
  },
};

/**
 * Assign a primary and hidden agenda to an AI nation
 * Should be called during game initialization
 *
 * Now supports:
 * - Predefined agendas for specific leaders
 * - Personality-based bias for random selection
 * - Fallback to pure random if no bias exists
 */
export function assignAgendas(
  nation: Nation,
  rng: () => number = Math.random
): Nation {
  const primaryAgendas = getPrimaryAgendas();
  const hiddenAgendas = getHiddenAgendas();
  const personality = nation.ai || 'balanced';
  const leaderName = nation.leader;

  let primary: Agenda;
  let hidden: Agenda;

  // Check for predefined agendas
  const predefined = leaderName ? LEADER_PREDEFINED_AGENDAS[leaderName] : undefined;

  if (predefined?.primary) {
    // Use predefined primary agenda
    const predefinedPrimary = getAgendaById(predefined.primary);
    primary = predefinedPrimary
      ? { ...predefinedPrimary, isRevealed: true }
      : { ...selectAgendaWithBias(primaryAgendas, personality, rng), isRevealed: true };
  } else {
    // Use personality-biased selection
    primary = { ...selectAgendaWithBias(primaryAgendas, personality, rng), isRevealed: true };
  }

  // Pick hidden agenda (different from primary)
  const availableHidden = hiddenAgendas.filter(a => a.id !== primary.id);

  if (predefined?.hidden) {
    // Use predefined hidden agenda
    const predefinedHidden = getAgendaById(predefined.hidden);
    hidden = predefinedHidden && predefinedHidden.id !== primary.id
      ? { ...predefinedHidden, isRevealed: false }
      : { ...selectAgendaWithBias(availableHidden, personality, rng), isRevealed: false };
  } else {
    // Use personality-biased selection
    hidden = { ...selectAgendaWithBias(availableHidden, personality, rng), isRevealed: false };
  }

  // Store agendas in nation's data
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
  gameState: GameState
): Agenda[] {
  const agendas: Agenda[] = aiNation.agendas || [];
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
  gameState: GameState
): number {
  const agendas: Agenda[] = aiNation.agendas || [];
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
  gameState: GameState
): number {
  const agendas: Agenda[] = aiNation.agendas || [];
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
  gameState: GameState
): string[] {
  const agendas: Agenda[] = aiNation.agendas || [];
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
  const firstContactTurn = aiNation.firstContactTurn?.[playerNation.id] || currentTurn;
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
  if (aiNation.hasEmbassyWith?.[playerNation.id]) {
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

  const agendas: Agenda[] = aiNation.agendas || [];
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
  return nation.agendas || [];
}

/**
 * Get only revealed agendas for a nation
 */
export function getRevealedAgendas(nation: Nation): Agenda[] {
  const agendas: Agenda[] = nation.agendas || [];
  return agendas.filter(a => a.isRevealed);
}

/**
 * Get primary agenda for a nation
 */
export function getPrimaryAgenda(nation: Nation): Agenda | null {
  const agendas: Agenda[] = nation.agendas || [];
  return agendas.find(a => a.type === 'primary') || null;
}

/**
 * Get hidden agenda for a nation (may not be revealed to player)
 */
export function getHiddenAgenda(nation: Nation): Agenda | null {
  const agendas: Agenda[] = nation.agendas || [];
  return agendas.find(a => a.type === 'hidden') || null;
}

/**
 * Check if a nation has a specific agenda
 */
export function hasAgenda(nation: Nation, agendaId: string): boolean {
  const agendas: Agenda[] = nation.agendas || [];
  return agendas.some(a => a.id === agendaId);
}

/**
 * Check if a specific agenda is revealed to the player
 */
export function isAgendaRevealed(nation: Nation, agendaId: string): boolean {
  const agendas: Agenda[] = nation.agendas || [];
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
  gameState: GameState
): number {
  const agendas: Agenda[] = aiNation.agendas || [];
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
