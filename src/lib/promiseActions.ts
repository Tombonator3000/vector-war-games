/**
 * Promise Actions
 *
 * Functions for creating and managing diplomatic promises between nations
 */

import type { Nation } from '@/types/game';
import type { PromiseType, PromiseTerms } from '@/types/trustAndFavors';
import {
  createPromise,
  fulfillPromise,
  breakPromise,
  getActivePromises,
  hasPromise,
  modifyTrust,
} from './trustAndFavorsUtils';
import { modifyRelationship } from './relationshipUtils';

/**
 * Create a "no-attack" promise
 * @param fromNation - Nation making the promise
 * @param toNationId - Nation receiving the promise
 * @param duration - Duration in turns
 * @param currentTurn - Current game turn
 * @returns Updated nation with promise
 */
export function promiseNoAttack(
  fromNation: Nation,
  toNationId: string,
  duration: number,
  currentTurn: number
): Nation {
  const terms: PromiseTerms = {
    duration,
    trustReward: 10,
    trustPenalty: 20,
    relationshipPenalty: -25,
  };

  return createPromise(fromNation, toNationId, 'no-attack', terms, currentTurn);
}

/**
 * Create a "help-if-attacked" promise
 * @param fromNation - Nation making the promise
 * @param toNationId - Nation receiving the promise
 * @param duration - Duration in turns
 * @param currentTurn - Current game turn
 * @returns Updated nation with promise
 */
export function promiseDefenseSupport(
  fromNation: Nation,
  toNationId: string,
  duration: number,
  currentTurn: number
): Nation {
  const terms: PromiseTerms = {
    duration,
    trustReward: 8,
    trustPenalty: 25,
    relationshipPenalty: -30,
  };

  return createPromise(fromNation, toNationId, 'help-if-attacked', terms, currentTurn);
}

/**
 * Create a "no-ally-with" promise
 * @param fromNation - Nation making the promise
 * @param toNationId - Nation receiving the promise
 * @param forbiddenAllyId - Nation they promise not to ally with
 * @param duration - Duration in turns
 * @param currentTurn - Current game turn
 * @returns Updated nation with promise
 */
export function promiseNoAllyWith(
  fromNation: Nation,
  toNationId: string,
  forbiddenAllyId: string,
  duration: number,
  currentTurn: number
): Nation {
  const terms: PromiseTerms = {
    duration,
    targetNationId: forbiddenAllyId,
    trustReward: 5,
    trustPenalty: 15,
    relationshipPenalty: -20,
  };

  return createPromise(fromNation, toNationId, 'no-ally-with', terms, currentTurn);
}

/**
 * Create a "no-nuclear-weapons" promise (global)
 * @param fromNation - Nation making the promise
 * @param toNationId - Nation receiving the promise (or 'global' for all)
 * @param duration - Duration in turns
 * @param currentTurn - Current game turn
 * @returns Updated nation with promise
 */
export function promiseNoNukes(
  fromNation: Nation,
  toNationId: string,
  duration: number,
  currentTurn: number
): Nation {
  const terms: PromiseTerms = {
    duration,
    global: true,
    trustReward: 15,
    trustPenalty: 40,
    relationshipPenalty: -50,
  };

  return createPromise(fromNation, toNationId, 'no-nuclear-weapons', terms, currentTurn);
}

/**
 * Create a "neutral-mediator" promise
 * @param fromNation - Nation making the promise
 * @param toNationId - Nation receiving the promise
 * @param duration - Duration in turns
 * @param currentTurn - Current game turn
 * @returns Updated nation with promise
 */
export function promiseNeutrality(
  fromNation: Nation,
  toNationId: string,
  duration: number,
  currentTurn: number
): Nation {
  const terms: PromiseTerms = {
    duration,
    global: true,
    trustReward: 12,
    trustPenalty: 30,
    relationshipPenalty: -35,
  };

  return createPromise(fromNation, toNationId, 'neutral-mediator', terms, currentTurn);
}

/**
 * Check if an attack would break a "no-attack" promise
 * @param attacker - Nation planning to attack
 * @param defenderId - Nation being attacked
 * @param currentTurn - Current game turn
 * @returns Promise that would be broken, or null
 */
export function checkAttackBreaksPromise(
  attacker: Nation,
  defenderId: string,
  currentTurn: number
): { promiseId: string; toNationId: string } | null {
  const promises = getActivePromises(attacker, defenderId);
  const noAttackPromise = promises.find((p) => p.type === 'no-attack');

  if (noAttackPromise && noAttackPromise.expiresTurn > currentTurn) {
    return {
      promiseId: noAttackPromise.id,
      toNationId: noAttackPromise.toNationId,
    };
  }

  return null;
}

/**
 * Check if using nuclear weapons would break a promise
 * @param nation - Nation planning to use nukes
 * @param currentTurn - Current game turn
 * @returns Array of promises that would be broken
 */
export function checkNukeBreaksPromises(
  nation: Nation,
  currentTurn: number
): Array<{ promiseId: string; toNationId: string }> {
  if (!nation.diplomaticPromises) return [];

  const brokenPromises: Array<{ promiseId: string; toNationId: string }> = [];

  for (const promise of nation.diplomaticPromises) {
    if (
      promise.type === 'no-nuclear-weapons' &&
      !promise.broken &&
      !promise.fulfilled &&
      promise.expiresTurn > currentTurn
    ) {
      brokenPromises.push({
        promiseId: promise.id,
        toNationId: promise.toNationId,
      });
    }
  }

  return brokenPromises;
}

/**
 * Check if forming an alliance would break a promise
 * @param nation - Nation planning to ally
 * @param newAllyId - Nation they want to ally with
 * @param currentTurn - Current game turn
 * @returns Array of promises that would be broken
 */
export function checkAllianceBreaksPromises(
  nation: Nation,
  newAllyId: string,
  currentTurn: number
): Array<{ promiseId: string; toNationId: string }> {
  if (!nation.diplomaticPromises) return [];

  const brokenPromises: Array<{ promiseId: string; toNationId: string }> = [];

  for (const promise of nation.diplomaticPromises) {
    if (
      promise.type === 'no-ally-with' &&
      promise.terms.targetNationId === newAllyId &&
      !promise.broken &&
      !promise.fulfilled &&
      promise.expiresTurn > currentTurn
    ) {
      brokenPromises.push({
        promiseId: promise.id,
        toNationId: promise.toNationId,
      });
    }
  }

  return brokenPromises;
}

/**
 * Check if declaring war would break a "neutral-mediator" promise
 * @param nation - Nation planning to declare war
 * @param currentTurn - Current game turn
 * @returns Array of promises that would be broken
 */
export function checkWarBreaksPromises(
  nation: Nation,
  currentTurn: number
): Array<{ promiseId: string; toNationId: string }> {
  if (!nation.diplomaticPromises) return [];

  const brokenPromises: Array<{ promiseId: string; toNationId: string }> = [];

  for (const promise of nation.diplomaticPromises) {
    if (
      promise.type === 'neutral-mediator' &&
      !promise.broken &&
      !promise.fulfilled &&
      promise.expiresTurn > currentTurn
    ) {
      brokenPromises.push({
        promiseId: promise.id,
        toNationId: promise.toNationId,
      });
    }
  }

  return brokenPromises;
}

/**
 * Handle breaking multiple promises
 * @param nation - Nation breaking promises
 * @param brokenPromises - Array of promise info to break
 * @param currentTurn - Current game turn
 * @param allNations - All nations (to apply relationship penalties)
 * @returns Updated nation and nations affected
 */
export function handleBrokenPromises(
  nation: Nation,
  brokenPromises: Array<{ promiseId: string; toNationId: string }>,
  currentTurn: number,
  allNations: Nation[]
): { updatedNation: Nation; affectedNations: Nation[] } {
  let updatedNation = nation;
  const affectedNations: Nation[] = [];

  for (const { promiseId, toNationId } of brokenPromises) {
    // Break the promise
    updatedNation = breakPromise(updatedNation, promiseId, currentTurn);

    // Find the promise to get penalty details
    const promise = nation.diplomaticPromises?.find((p) => p.id === promiseId);
    if (!promise) continue;

    // Apply relationship penalty to target nation
    const targetNation = allNations.find((n) => n.id === toNationId);
    if (targetNation) {
      let updatedTarget = targetNation;

      if (promise.terms.trustPenalty) {
        updatedTarget = modifyTrust(
          updatedTarget,
          nation.id,
          -promise.terms.trustPenalty,
          `Broke promise: ${promise.type}`,
          currentTurn
        );
      }

      if (promise.terms.relationshipPenalty) {
        updatedTarget = modifyRelationship(
          updatedTarget,
          nation.id,
          promise.terms.relationshipPenalty,
          `Broke promise: ${promise.type}`,
          currentTurn
        );
      }

      if (updatedTarget !== targetNation) {
        affectedNations.push(updatedTarget);
      }
    }

    // If global promise, apply penalty to all nations
    if (promise.terms.global) {
      for (const other of allNations) {
        if (other.id === nation.id) continue;
        if (targetNation && other.id === targetNation.id) continue;

        let updatedOther = other;

        if (promise.terms.trustPenalty) {
          updatedOther = modifyTrust(
            updatedOther,
            nation.id,
            -promise.terms.trustPenalty,
            `Broke global promise: ${promise.type}`,
            currentTurn
          );
        }

        const penaltyMagnitude = Math.abs(promise.terms.relationshipPenalty ?? 0);
        if (penaltyMagnitude > 0) {
          const globalPenalty = -Math.floor(penaltyMagnitude / 2); // Half penalty for others
          updatedOther = modifyRelationship(
            updatedOther,
            nation.id,
            globalPenalty,
            `Broke global promise: ${promise.type}`,
            currentTurn
          );
        }

        if (updatedOther !== other) {
          affectedNations.push(updatedOther);
        }
      }
    }
  }

  return { updatedNation, affectedNations };
}

/**
 * Get all promises from one nation
 * @param nation - Nation to check
 * @returns Object with categorized promises
 */
export function getAllPromisesSummary(nation: Nation): {
  active: number;
  fulfilled: number;
  broken: number;
  byType: Record<PromiseType, number>;
} {
  const summary = {
    active: 0,
    fulfilled: 0,
    broken: 0,
    byType: {} as Record<PromiseType, number>,
  };

  if (!nation.diplomaticPromises) return summary;

  for (const promise of nation.diplomaticPromises) {
    if (promise.broken) {
      summary.broken++;
    } else if (promise.fulfilled) {
      summary.fulfilled++;
    } else {
      summary.active++;
    }

    summary.byType[promise.type] = (summary.byType[promise.type] || 0) + 1;
  }

  return summary;
}

/**
 * Check if nation can be trusted based on promise history
 * @param nation - Nation to evaluate
 * @returns Trust score based on promise keeping (0-100)
 */
export function getPromiseTrustworthiness(nation: Nation): number {
  if (!nation.diplomaticPromises || nation.diplomaticPromises.length === 0) {
    return 50; // Neutral if no history
  }

  const total = nation.diplomaticPromises.length;
  const fulfilled = nation.diplomaticPromises.filter((p) => p.fulfilled).length;
  const broken = nation.diplomaticPromises.filter((p) => p.broken).length;

  // Calculate score: fulfilled = +1, broken = -2, active = 0
  const score = fulfilled - broken * 2;
  const maxPossibleScore = total;
  const minPossibleScore = -total * 2;

  // Normalize to 0-100 scale
  const normalized =
    ((score - minPossibleScore) / (maxPossibleScore - minPossibleScore)) * 100;

  return Math.round(normalized);
}

/**
 * Suggest promises that would improve relationship
 * @param fromNation - Nation considering making promises
 * @param toNation - Nation to make promises to
 * @param currentTurn - Current game turn
 * @returns Array of suggested promise types
 */
export function suggestPromises(
  fromNation: Nation,
  toNation: Nation,
  currentTurn: number
): Array<{ type: PromiseType; reason: string; duration: number }> {
  const suggestions: Array<{ type: PromiseType; reason: string; duration: number }> =
    [];

  // Don't suggest if already has this promise active
  const activePromises = getActivePromises(fromNation, toNation.id);
  const activeTypes = new Set(activePromises.map((p) => p.type));

  // Suggest based on relationship and context
  const relationship = fromNation.relationships?.[toNation.id] ?? 0;

  if (!activeTypes.has('no-attack') && relationship < 25) {
    suggestions.push({
      type: 'no-attack',
      reason: 'Build trust with peaceful intentions',
      duration: 10,
    });
  }

  if (!activeTypes.has('help-if-attacked') && relationship >= 25) {
    suggestions.push({
      type: 'help-if-attacked',
      reason: 'Strengthen alliance with defense commitment',
      duration: 15,
    });
  }

  if (!activeTypes.has('no-nuclear-weapons')) {
    suggestions.push({
      type: 'no-nuclear-weapons',
      reason: 'Improve global standing',
      duration: 20,
    });
  }

  return suggestions;
}
