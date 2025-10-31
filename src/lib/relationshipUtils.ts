/**
 * Relationship Management Utilities
 *
 * Provides utilities for managing nation-to-nation relationships in the game.
 * Relationships range from -100 (extreme hostility) to +100 (close alliance).
 *
 * Relationship Scale:
 * - -100 to -75: Mortal Enemies
 * - -74 to -50: Hostile
 * - -49 to -25: Unfriendly
 * - -24 to +24: Neutral
 * - +25 to +49: Friendly
 * - +50 to +74: Close Allies
 * - +75 to +100: Strategic Partners
 */

import type { Nation, RelationshipEvent } from '@/types/game';

const MIN_RELATIONSHIP = -100;
const MAX_RELATIONSHIP = 100;
const DEFAULT_RELATIONSHIP = 0;
const MAX_HISTORY_ENTRIES = 50; // Limit history to prevent memory bloat

/**
 * Clamp relationship value to valid range (-100 to +100)
 */
export function clampRelationship(value: number): number {
  return Math.max(MIN_RELATIONSHIP, Math.min(MAX_RELATIONSHIP, value));
}

/**
 * Get relationship score between this nation and another nation
 * @param nation - The nation whose relationships we're checking
 * @param targetNationId - The ID of the nation to check relationship with
 * @returns Relationship score (-100 to +100), defaults to 0 if not set
 */
export function getRelationship(nation: Nation, targetNationId: string): number {
  if (!nation.relationships) {
    return DEFAULT_RELATIONSHIP;
  }
  const relationship = nation.relationships[targetNationId];
  if (typeof relationship !== 'number') {
    return DEFAULT_RELATIONSHIP;
  }
  return clampRelationship(relationship);
}

/**
 * Modify relationship between this nation and another nation
 * Records the change in relationship history
 * @param nation - The nation whose relationship to modify
 * @param targetNationId - The ID of the nation to modify relationship with
 * @param delta - The change in relationship (-100 to +100)
 * @param reason - Description of why the relationship changed
 * @param currentTurn - The current turn number
 * @returns Updated nation object
 */
export function modifyRelationship(
  nation: Nation,
  targetNationId: string,
  delta: number,
  reason: string,
  currentTurn: number
): Nation {
  // Skip self-relationships
  if (nation.id === targetNationId) {
    return nation;
  }

  // Initialize relationships if not exists
  const relationships = nation.relationships ?? {};
  const currentRelationship = relationships[targetNationId] ?? DEFAULT_RELATIONSHIP;
  const newRelationship = clampRelationship(currentRelationship + delta);

  // Only record change if there is an actual change
  if (newRelationship === currentRelationship) {
    return nation;
  }

  // Update relationship
  const updatedRelationships = {
    ...relationships,
    [targetNationId]: newRelationship,
  };

  // Record history
  const history = nation.relationshipHistory ?? [];
  const event: RelationshipEvent = {
    turn: currentTurn,
    withNation: targetNationId,
    delta,
    reason,
    newValue: newRelationship,
  };

  // Add to history and limit size
  const updatedHistory = [...history, event].slice(-MAX_HISTORY_ENTRIES);

  return {
    ...nation,
    relationships: updatedRelationships,
    relationshipHistory: updatedHistory,
  };
}

/**
 * Initialize relationships for a nation with all other nations
 * Sets default relationship (0) for all nations except self
 * @param nation - The nation to initialize relationships for
 * @param allNationIds - Array of all nation IDs in the game
 * @returns Updated nation object
 */
export function initializeRelationships(nation: Nation, allNationIds: string[]): Nation {
  const relationships: Record<string, number> = nation.relationships ?? {};

  // Set default relationship for all nations (except self) if not already set
  for (const nationId of allNationIds) {
    if (nationId !== nation.id && typeof relationships[nationId] !== 'number') {
      relationships[nationId] = DEFAULT_RELATIONSHIP;
    }
  }

  return {
    ...nation,
    relationships,
    relationshipHistory: nation.relationshipHistory ?? [],
  };
}

/**
 * Get descriptive category for a relationship value
 * @param value - Relationship value (-100 to +100)
 * @returns Descriptive category
 */
export function getRelationshipCategory(value: number): string {
  if (value <= -75) return 'Mortal Enemies';
  if (value <= -50) return 'Hostile';
  if (value <= -25) return 'Unfriendly';
  if (value <= 24) return 'Neutral';
  if (value <= 49) return 'Friendly';
  if (value <= 74) return 'Close Allies';
  return 'Strategic Partners';
}

/**
 * Get relationship modifier for game mechanics
 * Converts relationship score to a multiplier (0.5 to 1.5)
 * Used for trade, diplomacy success chance, etc.
 * @param value - Relationship value (-100 to +100)
 * @returns Multiplier (0.5 at -100, 1.0 at 0, 1.5 at +100)
 */
export function getRelationshipModifier(value: number): number {
  const clamped = clampRelationship(value);
  // Map -100 to +100 into 0.5 to 1.5
  return 1.0 + (clamped / 200);
}

/**
 * Get color indicator for relationship display
 * @param value - Relationship value (-100 to +100)
 * @returns Color string (Tailwind classes)
 */
export function getRelationshipColor(value: number): string {
  if (value <= -50) return 'text-red-500';
  if (value <= -25) return 'text-orange-500';
  if (value <= 24) return 'text-gray-400';
  if (value <= 49) return 'text-green-400';
  return 'text-green-500';
}

/**
 * Check if two nations can form an alliance based on relationship
 * @param relationship - Current relationship value
 * @returns True if relationship is high enough for alliance
 */
export function canFormAlliance(relationship: number): boolean {
  return relationship >= 25; // Must be at least "Friendly"
}

/**
 * Check if relationship makes a nation likely to accept diplomatic proposals
 * @param relationship - Current relationship value
 * @returns True if relationship is positive enough
 */
export function isLikelyToAcceptProposal(relationship: number): boolean {
  return relationship >= 0; // Must be at least neutral
}

/**
 * Calculate relationship decay per turn (relationships naturally drift toward neutral)
 * @param currentRelationship - Current relationship value
 * @returns Delta to apply per turn
 */
export function calculateRelationshipDecay(currentRelationship: number): number {
  // Relationships naturally decay toward neutral (0) over time
  if (currentRelationship > 0) {
    return -Math.max(1, Math.floor(currentRelationship / 50)); // Positive decays toward 0
  } else if (currentRelationship < 0) {
    return Math.max(1, Math.floor(-currentRelationship / 50)); // Negative decays toward 0
  }
  return 0;
}

/**
 * Get relationship changes for common game actions
 * Returns standard delta values for different actions
 */
export const RelationshipDeltas = {
  // Positive actions
  FORM_ALLIANCE: 20,
  TRADE_AGREEMENT: 10,
  SHARE_INTEL: 8,
  SEND_AID: 5,
  ACCEPT_REFUGEES: 3,

  // Negative actions
  DECLARE_WAR: -30,
  NUCLEAR_STRIKE: -50,
  CYBER_ATTACK: -15,
  BREAK_ALLIANCE: -25,
  SANCTION: -10,
  SPY_CAUGHT: -8,
  CLOSE_BORDERS: -5,

  // Neutral/Context dependent
  END_WAR: 15,
  PEACE_TREATY: 10,
  NON_AGGRESSION_PACT: 5,
} as const;

/**
 * Get all nations sorted by relationship with a given nation
 * @param nation - The nation to check relationships from
 * @param allNations - All nations in the game
 * @returns Array of nations sorted by relationship (highest first)
 */
export function getNationsSortedByRelationship(
  nation: Nation,
  allNations: Nation[]
): Array<{ nation: Nation; relationship: number }> {
  return allNations
    .filter((n) => n.id !== nation.id && !n.eliminated)
    .map((n) => ({
      nation: n,
      relationship: getRelationship(nation, n.id),
    }))
    .sort((a, b) => b.relationship - a.relationship);
}

/**
 * Get recent relationship changes for a nation
 * @param nation - The nation to check
 * @param turns - Number of turns to look back (default: 5)
 * @returns Array of recent relationship events
 */
export function getRecentRelationshipChanges(
  nation: Nation,
  turns: number = 5
): RelationshipEvent[] {
  if (!nation.relationshipHistory) {
    return [];
  }
  const currentTurn = nation.relationshipHistory[nation.relationshipHistory.length - 1]?.turn ?? 0;
  const cutoffTurn = currentTurn - turns;

  return nation.relationshipHistory.filter((event) => event.turn >= cutoffTurn);
}

/**
 * Initialize relationships for all nations in a game
 * Should be called when starting a new game
 * @param nations - Array of all nations in the game
 * @returns Array of nations with initialized relationships
 */
export function initializeGameRelationships(nations: Nation[]): Nation[] {
  const nationIds = nations.map((n) => n.id);
  return nations.map((nation) => initializeRelationships(nation, nationIds));
}

/**
 * Set initial relationships based on alliances
 * Call this after initializing relationships to set friendly values for allies
 * @param nations - Array of nations with initialized relationships
 * @returns Array of nations with alliance-based relationships
 */
export function setInitialAllianceRelationships(nations: Nation[]): Nation[] {
  return nations.map((nation) => {
    const relationships = { ...nation.relationships };

    // Set positive relationships for allies
    nation.alliances?.forEach((allyId) => {
      if (relationships[allyId] !== undefined) {
        relationships[allyId] = 50; // Friendly starting relationship
      }
    });

    return {
      ...nation,
      relationships,
    };
  });
}
