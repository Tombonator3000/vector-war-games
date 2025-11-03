/**
 * AI UNIFIED DIPLOMACY
 *
 * Simplified AI diplomacy logic using unified relationship system
 * Replaces complex trust/favor/grievance calculations with simple relationship scores
 */

import type { Nation } from '@/types/game';
import type { ProposalType, DiplomaticProposal } from '@/types/unifiedDiplomacy';
import {
  getRelationshipCategory,
  canFormAlliance,
  RELATIONSHIP_ALLIED,
  RELATIONSHIP_FRIENDLY,
  RELATIONSHIP_NEUTRAL,
  RELATIONSHIP_UNFRIENDLY,
  RELATIONSHIP_HOSTILE,
  RelationshipDeltas,
  getAcceptanceModifier,
} from '@/types/unifiedDiplomacy';
import { getRelationship, updateRelationship } from '@/lib/unifiedDiplomacyMigration';

/**
 * AI evaluates whether to accept a diplomatic proposal
 */
export function evaluateProposal(
  aiNation: Nation,
  proposer: Nation,
  proposalType: ProposalType,
  allNations: Nation[],
  currentTurn: number
): { accept: boolean; reason: string } {
  const relationship = getRelationship(aiNation, proposer.id, allNations);
  const acceptanceModifier = getAcceptanceModifier(relationship);

  switch (proposalType) {
    case 'alliance': {
      // Requires friendly relationship
      if (relationship < RELATIONSHIP_ALLIED) {
        return {
          accept: false,
          reason: `Our relationship (${relationship}) is not strong enough for an alliance. We need at least ${RELATIONSHIP_ALLIED}.`,
        };
      }

      // Check if proposer has enemies that AI is allied with
      const proposerEnemies = allNations.filter(n =>
        !n.eliminated &&
        n.id !== proposer.id &&
        getRelationship(proposer, n.id, allNations) < RELATIONSHIP_UNFRIENDLY
      );

      const conflictingAlliances = proposerEnemies.filter(enemy =>
        aiNation.alliances?.includes(enemy.id)
      );

      if (conflictingAlliances.length > 0) {
        return {
          accept: false,
          reason: `You are hostile toward our allies (${conflictingAlliances.map(n => n.name).join(', ')}).`,
        };
      }

      return {
        accept: true,
        reason: 'Our strong relationship and mutual interests make this alliance beneficial.',
      };
    }

    case 'truce': {
      // More lenient than alliance
      const baseChance = 0.5;
      const relationshipBonus = relationship / 100; // -1.0 to +1.0
      const acceptChance = baseChance + relationshipBonus;

      // Higher chance if AI is weak
      const isWeak = aiNation.missiles < 10 || aiNation.cities.length <= 2;
      const weaknessBonus = isWeak ? 0.3 : 0;

      const finalChance = Math.min(0.95, Math.max(0.05, acceptChance + weaknessBonus));

      if (Math.random() < finalChance) {
        return {
          accept: true,
          reason: isWeak
            ? 'We need time to rebuild our strength.'
            : 'A temporary peace serves our interests.',
        };
      }

      return {
        accept: false,
        reason: 'We see no strategic benefit to a truce at this time.',
      };
    }

    case 'aid': {
      // Almost always accept aid (free resources)
      if (relationship > RELATIONSHIP_HOSTILE) {
        return {
          accept: true,
          reason: 'We gratefully accept your generous assistance.',
        };
      }

      return {
        accept: false,
        reason: 'We do not trust your intentions.',
      };
    }

    case 'peace': {
      // Similar to truce
      const isLosingWar = aiNation.cities.length <= 2 || aiNation.missiles < 5;

      if (isLosingWar || relationship > RELATIONSHIP_UNFRIENDLY) {
        return {
          accept: true,
          reason: isLosingWar
            ? 'Continued conflict is not in our interest.'
            : 'We are willing to end hostilities.',
        };
      }

      if (Math.random() < 0.3) {
        return {
          accept: true,
          reason: 'We will consider peace.',
        };
      }

      return {
        accept: false,
        reason: 'The time for peace has not yet come.',
      };
    }

    case 'joint-war': {
      // Requires allied status
      if (!aiNation.alliances?.includes(proposer.id)) {
        return {
          accept: false,
          reason: 'We only enter joint wars with our allies.',
        };
      }

      return {
        accept: true,
        reason: 'We will honor our alliance and join you in this conflict.',
      };
    }

    default:
      return { accept: false, reason: 'Unknown proposal type.' };
  }
}

/**
 * AI decides whether to initiate a diplomatic proposal
 */
export function considerDiplomaticAction(
  aiNation: Nation,
  targetNation: Nation,
  allNations: Nation[],
  currentTurn: number
): { action: ProposalType | null; reason: string } {
  if (targetNation.eliminated) {
    return { action: null, reason: 'Target is eliminated' };
  }

  const relationship = getRelationship(aiNation, targetNation.id, allNations);

  // Consider alliance if relationship is very high
  if (relationship >= RELATIONSHIP_ALLIED && !aiNation.alliances?.includes(targetNation.id)) {
    return {
      action: 'alliance',
      reason: `Excellent relationship (${relationship}) warrants an alliance`,
    };
  }

  // Consider aid if relationship is positive and AI is strong
  const isStrong = aiNation.production > 100;
  if (isStrong && relationship > RELATIONSHIP_NEUTRAL && Math.random() < 0.1) {
    return {
      action: 'aid',
      reason: 'Strengthen relationship through aid',
    };
  }

  // Consider peace if at war and AI is weak
  const isWeak = aiNation.missiles < 10 || aiNation.cities.length <= 2;
  if (isWeak && relationship < RELATIONSHIP_UNFRIENDLY) {
    return {
      action: 'peace',
      reason: 'Need peace to recover',
    };
  }

  return { action: null, reason: 'No diplomatic action needed' };
}

/**
 * Update relationship after a significant event
 */
export function applyRelationshipChange(
  nations: Nation[],
  nationAId: string,
  nationBId: string,
  delta: number,
  reason: string,
  turn: number
): Nation[] {
  const nationA = nations.find(n => n.id === nationAId);
  const nationB = nations.find(n => n.id === nationBId);

  if (!nationA || !nationB) {
    return nations;
  }

  const { nationA: updatedA, nationB: updatedB } = updateRelationship(
    nationA,
    nationB,
    delta,
    reason,
    turn
  );

  return nations.map(n => {
    if (n.id === nationAId) return updatedA;
    if (n.id === nationBId) return updatedB;
    return n;
  });
}

/**
 * Apply relationship decay (toward neutral) for all nations
 */
export function applyRelationshipDecay(nations: Nation[], turn: number): Nation[] {
  return nations.map(nation => {
    if (nation.eliminated || !nation.relationships) {
      return nation;
    }

    const updatedRelationships = { ...nation.relationships };

    for (const [targetId, relationship] of Object.entries(updatedRelationships)) {
      // Don't decay allied relationships
      if (nation.alliances?.includes(targetId)) {
        continue;
      }

      // Decay toward neutral
      if (relationship > RELATIONSHIP_NEUTRAL) {
        updatedRelationships[targetId] = Math.max(
          RELATIONSHIP_NEUTRAL,
          relationship - RelationshipDeltas.DECAY_TOWARD_NEUTRAL
        );
      } else if (relationship < RELATIONSHIP_NEUTRAL) {
        updatedRelationships[targetId] = Math.min(
          RELATIONSHIP_NEUTRAL,
          relationship + RelationshipDeltas.DECAY_TOWARD_NEUTRAL
        );
      }
    }

    return {
      ...nation,
      relationships: updatedRelationships,
    };
  });
}

/**
 * Get all hostile nations (for AI targeting)
 */
export function getHostileNations(nation: Nation, allNations: Nation[]): Nation[] {
  return allNations.filter(n => {
    if (n.eliminated || n.id === nation.id) return false;

    const relationship = getRelationship(nation, n.id, allNations);
    return relationship < RELATIONSHIP_UNFRIENDLY;
  });
}

/**
 * Get all allied nations
 */
export function getAlliedNations(nation: Nation, allNations: Nation[]): Nation[] {
  return allNations.filter(n => {
    if (n.eliminated || n.id === nation.id) return false;

    return nation.alliances?.includes(n.id) || false;
  });
}

/**
 * Check if attack would harm relationship with allies
 */
export function wouldOffendAllies(
  attacker: Nation,
  target: Nation,
  allNations: Nation[]
): { wouldOffend: boolean; allies: string[] } {
  const attackerAllies = getAlliedNations(attacker, allNations);

  const offendedAllies = attackerAllies.filter(ally => {
    const allyRelationshipWithTarget = getRelationship(ally, target.id, allNations);
    return allyRelationshipWithTarget > RELATIONSHIP_NEUTRAL;
  });

  return {
    wouldOffend: offendedAllies.length > 0,
    allies: offendedAllies.map(a => a.name),
  };
}
