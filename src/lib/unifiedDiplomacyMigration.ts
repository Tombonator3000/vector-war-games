/**
 * UNIFIED DIPLOMACY MIGRATION
 *
 * Converts old diplomacy systems (Trust/Favors, Grievances, DIP currency)
 * to the unified relationship system (-100 to +100)
 */

import type { Nation } from '@/types/game';
import { clampRelationship, NEUTRAL_RELATIONSHIP } from '@/types/unifiedDiplomacy';

/**
 * Migrate existing diplomacy data to unified relationship score
 */
export function migrateToUnifiedRelationship(nation: Nation, targetId: string): number {
  // If already migrated, return existing relationship
  if (nation.relationships?.[targetId] !== undefined) {
    return nation.relationships[targetId];
  }

  let relationship = NEUTRAL_RELATIONSHIP;

  // Phase 1: Trust (0-100)
  const trust = nation.trustRecords?.[targetId]?.score ?? 50; // Default to neutral
  // Convert trust to relationship: trust 0 = -100, trust 50 = 0, trust 100 = +100
  relationship += (trust - 50) * 2;

  // Phase 1: Favors (-100 to +100)
  const favors = nation.favorBalances?.[targetId]?.balance ?? 0;
  relationship += favors / 2; // Halve favor impact

  // Phase 2: Grievances (each grievance = -10 relationship)
  const grievances = nation.grievances?.filter(g => g.againstNationId === targetId) ?? [];
  const grievancePenalty = grievances.reduce((acc, g) => {
    // Severity modifier: minor = -5, major = -10, severe = -15
    const severityPenalty = g.severity === 'minor' ? -5 : g.severity === 'major' ? -10 : -15;
    return acc + severityPenalty;
  }, 0);
  relationship += grievancePenalty;

  // Phase 3: Diplomatic Influence (bonus for high influence)
  const influence = nation.diplomaticInfluence?.currentDIP ?? 0;
  if (influence > 50) {
    relationship += Math.min(10, Math.floor((influence - 50) / 10)); // Max +10
  }

  // Alliance bonus
  if (nation.alliances?.includes(targetId)) {
    relationship = Math.max(relationship, 60); // Allied nations should be at least +60
  }

  return clampRelationship(relationship);
}

/**
 * Migrate all relationships for a nation
 */
export function migrateNationRelationships(nation: Nation, allNations: Nation[]): Record<string, number> {
  const relationships: Record<string, number> = { ...(nation.relationships || {}) };

  for (const otherNation of allNations) {
    if (otherNation.id === nation.id || otherNation.eliminated) {
      continue;
    }

    // Only migrate if not already present
    if (relationships[otherNation.id] === undefined) {
      relationships[otherNation.id] = migrateToUnifiedRelationship(nation, otherNation.id);
    }
  }

  return relationships;
}

/**
 * Migrate entire game state
 */
export function migrateGameDiplomacy(nations: Nation[]): Nation[] {
  return nations.map(nation => {
    if (nation.eliminated) {
      return nation;
    }

    const migratedRelationships = migrateNationRelationships(nation, nations);

    return {
      ...nation,
      relationships: migratedRelationships,
    };
  });
}

/**
 * Get relationship between two nations (with migration fallback)
 */
export function getRelationship(nationA: Nation, nationBId: string, allNations?: Nation[]): number {
  // Check if already migrated
  if (nationA.relationships?.[nationBId] !== undefined) {
    return nationA.relationships[nationBId];
  }

  // Fallback to migration
  return migrateToUnifiedRelationship(nationA, nationBId);
}

/**
 * Update relationship between two nations (bidirectional)
 */
export function updateRelationship(
  nationA: Nation,
  nationB: Nation,
  delta: number,
  reason: string,
  turn: number
): { nationA: Nation; nationB: Nation } {
  // Initialize relationships if not present
  if (!nationA.relationships) {
    nationA.relationships = {};
  }
  if (!nationB.relationships) {
    nationB.relationships = {};
  }

  // Apply delta
  const currentA = nationA.relationships[nationB.id] ?? NEUTRAL_RELATIONSHIP;
  const currentB = nationB.relationships[nationA.id] ?? NEUTRAL_RELATIONSHIP;

  const newA = clampRelationship(currentA + delta);
  const newB = clampRelationship(currentB + delta);

  // Update relationships
  const updatedA = {
    ...nationA,
    relationships: {
      ...nationA.relationships,
      [nationB.id]: newA,
    },
    relationshipHistory: [
      ...(nationA.relationshipHistory || []),
      {
        turn,
        targetNationId: nationB.id,
        delta,
        newValue: newA,
        reason,
      },
    ],
  };

  const updatedB = {
    ...nationB,
    relationships: {
      ...nationB.relationships,
      [nationA.id]: newB,
    },
    relationshipHistory: [
      ...(nationB.relationshipHistory || []),
      {
        turn,
        targetNationId: nationA.id,
        delta,
        newValue: newB,
        reason,
      },
    ],
  };

  return { nationA: updatedA, nationB: updatedB };
}
