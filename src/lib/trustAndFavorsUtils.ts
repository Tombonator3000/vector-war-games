/**
 * Trust and Favors Management Utilities
 *
 * Provides functions for managing trust, favors, and diplomatic promises
 * between nations in the game.
 */

import type { Nation } from '@/types/game';
import type {
  TrustRecord,
  TrustEvent,
  FavorBalance,
  FavorEvent,
  DiplomaticPromise,
  PromiseType,
  PromiseTerms,
} from '@/types/trustAndFavors';
import {
  DEFAULT_TRUST,
  clampTrust,
  clampFavors,
  getTrust,
  getFavors,
  calculateTrustDecay,
} from '@/types/trustAndFavors';

const MAX_TRUST_HISTORY = 20;
const MAX_FAVOR_HISTORY = 20;

/**
 * Initialize trust records for a nation with all other nations
 */
export function initializeTrustRecords(nation: Nation, allNationIds: string[]): Nation {
  const trustRecords: Record<string, TrustRecord> = nation.trustRecords ?? {};

  for (const nationId of allNationIds) {
    if (nationId !== nation.id && !trustRecords[nationId]) {
      trustRecords[nationId] = {
        value: DEFAULT_TRUST,
        lastUpdated: 0,
        history: [],
      };
    }
  }

  return {
    ...nation,
    trustRecords,
  };
}

/**
 * Initialize favor balances for a nation with all other nations
 */
export function initializeFavorBalances(nation: Nation, allNationIds: string[]): Nation {
  const favorBalances: Record<string, FavorBalance> = nation.favorBalances ?? {};

  for (const nationId of allNationIds) {
    if (nationId !== nation.id && !favorBalances[nationId]) {
      favorBalances[nationId] = {
        value: 0,
        lastUpdated: 0,
        history: [],
      };
    }
  }

  return {
    ...nation,
    favorBalances,
  };
}

/**
 * Modify trust between two nations
 * @param nation - The nation whose trust to modify
 * @param targetNationId - The ID of the other nation
 * @param delta - Change in trust
 * @param reason - Reason for the change
 * @param currentTurn - Current game turn
 * @returns Updated nation
 */
export function modifyTrust(
  nation: Nation,
  targetNationId: string,
  delta: number,
  reason: string,
  currentTurn: number
): Nation {
  if (nation.id === targetNationId || delta === 0) return nation;

  const trustRecords = nation.trustRecords ?? {};
  const record = trustRecords[targetNationId] ?? {
    value: DEFAULT_TRUST,
    lastUpdated: currentTurn,
    history: [],
  };

  const newValue = clampTrust(record.value + delta);
  const event: TrustEvent = {
    turn: currentTurn,
    delta,
    reason,
    newValue,
  };

  const updatedHistory = [...record.history, event].slice(-MAX_TRUST_HISTORY);

  return {
    ...nation,
    trustRecords: {
      ...trustRecords,
      [targetNationId]: {
        value: newValue,
        lastUpdated: currentTurn,
        history: updatedHistory,
      },
    },
  };
}

/**
 * Modify favor balance between two nations
 * @param nation - The nation whose favors to modify
 * @param targetNationId - The ID of the other nation
 * @param delta - Change in favors (positive = they owe you, negative = you owe them)
 * @param reason - Reason for the change
 * @param currentTurn - Current game turn
 * @returns Updated nation
 */
export function modifyFavors(
  nation: Nation,
  targetNationId: string,
  delta: number,
  reason: string,
  currentTurn: number
): Nation {
  if (nation.id === targetNationId || delta === 0) return nation;

  const favorBalances = nation.favorBalances ?? {};
  const balance = favorBalances[targetNationId] ?? {
    value: 0,
    lastUpdated: currentTurn,
    history: [],
  };

  const newValue = clampFavors(balance.value + delta);
  const event: FavorEvent = {
    turn: currentTurn,
    delta,
    reason,
    newValue,
  };

  const updatedHistory = [...balance.history, event].slice(-MAX_FAVOR_HISTORY);

  return {
    ...nation,
    favorBalances: {
      ...favorBalances,
      [targetNationId]: {
        value: newValue,
        lastUpdated: currentTurn,
        history: updatedHistory,
      },
    },
  };
}

/**
 * Spend favors from another nation
 * @param nation - The nation spending favors
 * @param targetNationId - The nation who owes favors
 * @param cost - Number of favors to spend
 * @param reason - Reason for spending
 * @param currentTurn - Current game turn
 * @returns Updated nation or null if insufficient favors
 */
export function spendFavors(
  nation: Nation,
  targetNationId: string,
  cost: number,
  reason: string,
  currentTurn: number
): Nation | null {
  const currentFavors = getFavors(nation, targetNationId);
  if (currentFavors < cost) return null;

  return modifyFavors(nation, targetNationId, -cost, reason, currentTurn);
}

/**
 * Apply automatic trust decay toward neutral (50) for all nations
 * @param nation - The nation to apply decay to
 * @param currentTurn - Current game turn
 * @returns Updated nation
 */
export function applyTrustDecay(nation: Nation, currentTurn: number): Nation {
  if (!nation.trustRecords) return nation;

  const trustRecords = { ...nation.trustRecords };
  let modified = false;

  for (const targetId in trustRecords) {
    const record = trustRecords[targetId];
    const decay = calculateTrustDecay(record.value);

    if (decay !== 0) {
      const newValue = clampTrust(record.value + decay);
      if (newValue !== record.value) {
        trustRecords[targetId] = {
          ...record,
          value: newValue,
          lastUpdated: currentTurn,
        };
        modified = true;
      }
    }
  }

  return modified ? { ...nation, trustRecords } : nation;
}

/**
 * Create a diplomatic promise
 * @param fromNation - Nation making the promise
 * @param toNationId - Nation receiving the promise
 * @param type - Type of promise
 * @param terms - Terms of the promise
 * @param currentTurn - Current game turn
 * @returns Updated nation with new promise
 */
export function createPromise(
  fromNation: Nation,
  toNationId: string,
  type: PromiseType,
  terms: PromiseTerms,
  currentTurn: number
): Nation {
  const promise: DiplomaticPromise = {
    id: `${fromNation.id}-${toNationId}-${type}-${currentTurn}`,
    type,
    fromNationId: fromNation.id,
    toNationId,
    createdTurn: currentTurn,
    expiresTurn: currentTurn + (terms.duration ?? 10),
    fulfilled: false,
    broken: false,
    terms,
  };

  const promises = fromNation.diplomaticPromises ?? [];
  return {
    ...fromNation,
    diplomaticPromises: [...promises, promise],
  };
}

/**
 * Mark a promise as fulfilled
 * @param nation - Nation who made the promise
 * @param promiseId - ID of the promise
 * @param currentTurn - Current game turn
 * @returns Updated nation with trust bonus applied
 */
export function fulfillPromise(
  nation: Nation,
  promiseId: string,
  currentTurn: number
): Nation {
  if (!nation.diplomaticPromises) return nation;

  const promises = nation.diplomaticPromises.map((p) =>
    p.id === promiseId ? { ...p, fulfilled: true } : p
  );

  const promise = nation.diplomaticPromises.find((p) => p.id === promiseId);
  if (!promise) return { ...nation, diplomaticPromises: promises };

  // Apply trust reward if specified
  if (promise.terms.trustReward) {
    return modifyTrust(
      { ...nation, diplomaticPromises: promises },
      promise.toNationId,
      promise.terms.trustReward,
      `Fulfilled promise: ${promise.type}`,
      currentTurn
    );
  }

  return { ...nation, diplomaticPromises: promises };
}

/**
 * Mark a promise as broken and apply penalties
 * @param nation - Nation who broke the promise
 * @param promiseId - ID of the promise
 * @param currentTurn - Current game turn
 * @returns Updated nation with penalties applied
 */
export function breakPromise(
  nation: Nation,
  promiseId: string,
  currentTurn: number
): Nation {
  if (!nation.diplomaticPromises) return nation;

  const promise = nation.diplomaticPromises.find((p) => p.id === promiseId);
  if (!promise || promise.broken) return nation;

  const promises = nation.diplomaticPromises.map((p) =>
    p.id === promiseId ? { ...p, broken: true } : p
  );

  let updatedNation = { ...nation, diplomaticPromises: promises };

  // Apply trust penalty if specified
  if (promise.terms.trustPenalty) {
    updatedNation = modifyTrust(
      updatedNation,
      promise.toNationId,
      -promise.terms.trustPenalty,
      `Broke promise: ${promise.type}`,
      currentTurn
    );
  }

  return updatedNation;
}

/**
 * Check if a promise is being violated
 * @param promise - The promise to check
 * @param nation - The nation who made the promise
 * @param allNations - All nations in the game
 * @returns True if promise is violated
 */
export function isPromiseViolated(
  promise: DiplomaticPromise,
  nation: Nation,
  allNations: Nation[]
): boolean {
  if (promise.fulfilled || promise.broken) return false;

  switch (promise.type) {
    case 'no-attack':
      // Check if nation attacked the target
      // This would need to be checked when attacks happen
      return false;

    case 'no-ally-with':
      // Check if nation formed alliance with forbidden nation
      if (promise.terms.targetNationId) {
        return nation.alliances?.includes(promise.terms.targetNationId) ?? false;
      }
      return false;

    case 'no-nuclear-weapons':
      // Check if nation used nuclear weapons (this turn)
      // Would need to be checked when nukes are launched
      return false;

    default:
      return false;
  }
}

/**
 * Clean up expired promises
 * @param nation - Nation to clean up promises for
 * @param currentTurn - Current game turn
 * @returns Updated nation with expired promises removed
 */
export function cleanupExpiredPromises(nation: Nation, currentTurn: number): Nation {
  if (!nation.diplomaticPromises) return nation;

  const promises = nation.diplomaticPromises.filter(
    (p) => p.expiresTurn > currentTurn || p.broken
  );

  return { ...nation, diplomaticPromises: promises };
}

/**
 * Get active promises from a nation to a specific target
 * @param nation - Nation who made the promises
 * @param targetNationId - Target nation ID
 * @returns Array of active promises
 */
export function getActivePromises(
  nation: Nation,
  targetNationId: string
): DiplomaticPromise[] {
  if (!nation.diplomaticPromises) return [];

  return nation.diplomaticPromises.filter(
    (p) => p.toNationId === targetNationId && !p.fulfilled && !p.broken
  );
}

/**
 * Check if a nation has made a specific type of promise to another
 * @param nation - Nation to check
 * @param targetNationId - Target nation ID
 * @param promiseType - Type of promise to check for
 * @returns True if such a promise exists
 */
export function hasPromise(
  nation: Nation,
  targetNationId: string,
  promiseType: PromiseType
): boolean {
  const promises = getActivePromises(nation, targetNationId);
  return promises.some((p) => p.type === promiseType);
}

/**
 * Initialize all trust and favor systems for game start
 * @param nations - All nations in the game
 * @returns Nations with initialized trust and favor systems
 */
export function initializeGameTrustAndFavors(nations: Nation[]): Nation[] {
  const nationIds = nations.map((n) => n.id);
  return nations.map((nation) => {
    let updated = initializeTrustRecords(nation, nationIds);
    updated = initializeFavorBalances(updated, nationIds);
    return updated;
  });
}

/**
 * Get trust modifier for diplomatic proposals
 * Combines trust and relationship for total modifier
 */
export function getCombinedDiplomacyModifier(
  nation: Nation,
  targetNationId: string
): number {
  const trust = getTrust(nation, targetNationId);
  const relationship = nation.relationships?.[targetNationId] ?? 0;

  // Trust contributes 0.5-1.5x multiplier
  const trustMod = 0.5 + trust / 100;

  // Relationship contributes -0.5 to +0.5 additive bonus
  const relationshipMod = relationship / 200;

  return trustMod + relationshipMod;
}
