/**
 * Diplomatic Currency Utilities
 *
 * Handles Diplomatic Influence Points (DIP) - a tradeable currency earned through
 * diplomatic actions and spent on advanced diplomatic operations.
 */

import type { Nation } from '@/types/game';
import type {
  DiplomaticInfluence,
  DIPTransaction,
  DIPEarning,
  DIPCosts,
} from '@/types/diplomacyPhase3';
import { initializeNationDiplomaticInfluence } from '@/types/diplomacyPhase3';

/**
 * Get nation's DIP balance
 */
export function getDIP(nation: Nation): number {
  if (!nation.diplomaticInfluence) {
    return 0;
  }
  return nation.diplomaticInfluence.points;
}

/**
 * Get nation's DIP capacity
 */
export function getDIPCapacity(nation: Nation): number {
  if (!nation.diplomaticInfluence) {
    return 200; // Default capacity
  }
  return nation.diplomaticInfluence.capacity;
}

/**
 * Initialize diplomatic influence for a nation
 */
export function initializeDIP(nation: Nation): Nation {
  return {
    ...nation,
    diplomaticInfluence: initializeNationDiplomaticInfluence(),
  };
}

/**
 * Modify DIP balance
 */
export function modifyDIP(
  nation: Nation,
  delta: number,
  reason: string,
  currentTurn: number,
  withNationId?: string
): Nation {
  if (!nation.diplomaticInfluence) {
    nation = initializeDIP(nation);
  }

  const influence = nation.diplomaticInfluence!;
  const oldBalance = influence.points;
  const newBalance = Math.max(0, Math.min(influence.capacity, oldBalance + delta));

  const transaction: DIPTransaction = {
    turn: currentTurn,
    delta,
    reason,
    withNationId,
    newBalance,
  };

  return {
    ...nation,
    diplomaticInfluence: {
      ...influence,
      points: newBalance,
      history: [...influence.history, transaction].slice(-20), // Keep last 20 transactions
    },
  };
}

/**
 * Earn DIP from various sources
 */
export function earnDIP(
  nation: Nation,
  amount: number,
  reason: string,
  currentTurn: number,
  withNationId?: string
): Nation {
  return modifyDIP(nation, amount, reason, currentTurn, withNationId);
}

/**
 * Spend DIP on actions
 * Returns null if nation doesn't have enough DIP
 */
export function spendDIP(
  nation: Nation,
  cost: number,
  reason: string,
  currentTurn: number,
  withNationId?: string
): Nation | null {
  const currentDIP = getDIP(nation);

  if (currentDIP < cost) {
    return null; // Not enough DIP
  }

  return modifyDIP(nation, -cost, reason, currentTurn, withNationId);
}

/**
 * Check if nation has enough DIP for an action
 */
export function hasEnoughDIP(nation: Nation, cost: number): boolean {
  return getDIP(nation) >= cost;
}

/**
 * Calculate DIP income for next turn
 */
export function calculateDIPIncome(
  nation: Nation,
  allNations: Nation[],
  currentTurn: number
): number {
  let income = 5; // Base income

  // Check for high-level alliances
  const highLevelAlliances = nation.specializedAlliances?.filter(
    (alliance) => alliance.level >= 3
  ) || [];
  income += highLevelAlliances.length * 2;

  // Check for council membership
  if (nation.councilMembership === 'permanent' || nation.councilMembership === 'elected') {
    income += 10;
  }

  // Check for peace years (5+ consecutive turns without declaring war)
  // This would need to be tracked in game state, for now we'll skip

  return income;
}

/**
 * Update DIP income for a nation
 */
export function updateDIPIncome(
  nation: Nation,
  allNations: Nation[],
  currentTurn: number
): Nation {
  if (!nation.diplomaticInfluence) {
    nation = initializeDIP(nation);
  }

  const baseIncome = 5;
  const highLevelAlliances = nation.specializedAlliances?.filter(
    (alliance) => alliance.level >= 3
  ) || [];
  const fromAlliances = highLevelAlliances.length * 2;

  const fromCouncilSeat =
    nation.councilMembership === 'permanent' || nation.councilMembership === 'elected'
      ? 10
      : 0;

  const total = baseIncome + fromAlliances + fromCouncilSeat;

  return {
    ...nation,
    diplomaticInfluence: {
      ...nation.diplomaticInfluence!,
      perTurnIncome: {
        baseIncome,
        fromAlliances,
        fromCouncilSeat,
        fromMediation: 0, // Updated separately when mediation occurs
        fromPeaceYears: 0, // Would need tracking in game state
        total,
      },
    },
  };
}

/**
 * Apply DIP income to nation
 */
export function applyDIPIncome(nation: Nation, currentTurn: number): Nation {
  if (!nation.diplomaticInfluence) {
    nation = initializeDIP(nation);
  }

  const income = nation.diplomaticInfluence!.perTurnIncome.total;
  return earnDIP(nation, income, 'Per-turn income', currentTurn);
}

/**
 * Trade DIP for favors with another nation
 * Costs 15 DIP to gain 5 favors
 */
export function tradeDIPForFavors(
  nation: Nation,
  targetNationId: string,
  currentTurn: number
): { success: boolean; updatedNation: Nation | null } {
  const cost = 15;

  if (!hasEnoughDIP(nation, cost)) {
    return { success: false, updatedNation: null };
  }

  const updatedNation = spendDIP(
    nation,
    cost,
    `Traded DIP for favors with ${targetNationId}`,
    currentTurn,
    targetNationId
  );

  if (!updatedNation) {
    return { success: false, updatedNation: null };
  }

  // The favor addition would be handled in favorActions.ts
  return { success: true, updatedNation };
}

/**
 * Get DIP cost for a specific action
 */
export function getDIPCost(
  action: keyof typeof DIPCosts,
  nation: Nation,
  targetNation?: Nation
): number {
  const baseCost = DIPCosts[action];

  // Could add modifiers based on relationships, trust, etc.
  let modifier = 1.0;

  // High trust reduces costs by 20%
  if (targetNation) {
    const trust = nation.trustRecords?.[targetNation.id]?.value ?? 50;
    if (trust >= 80) {
      modifier *= 0.8;
    } else if (trust <= 20) {
      modifier *= 1.3; // Low trust increases costs
    }
  }

  return Math.ceil(baseCost * modifier);
}

/**
 * Award DIP for completing diplomatic actions
 */
export function awardDIPForAction(
  nation: Nation,
  action: keyof typeof DIPEarning,
  currentTurn: number,
  description?: string
): Nation {
  const amount = DIPEarning[action];
  const reason = description || `Earned for ${action}`;
  return earnDIP(nation, amount, reason, currentTurn);
}

/**
 * Get DIP transaction history
 */
export function getDIPHistory(nation: Nation, limit: number = 10): DIPTransaction[] {
  if (!nation.diplomaticInfluence) {
    return [];
  }
  return nation.diplomaticInfluence.history.slice(-limit);
}

/**
 * Get DIP balance percentage (for UI display)
 */
export function getDIPPercentage(nation: Nation): number {
  const balance = getDIP(nation);
  const capacity = getDIPCapacity(nation);
  return capacity > 0 ? (balance / capacity) * 100 : 0;
}

/**
 * Increase DIP capacity
 */
export function increaseDIPCapacity(
  nation: Nation,
  amount: number,
  reason: string
): Nation {
  if (!nation.diplomaticInfluence) {
    nation = initializeDIP(nation);
  }

  return {
    ...nation,
    diplomaticInfluence: {
      ...nation.diplomaticInfluence!,
      capacity: nation.diplomaticInfluence!.capacity + amount,
    },
  };
}

/**
 * Get DIP color for UI (based on percentage full)
 */
export function getDIPColor(nation: Nation): string {
  const percentage = getDIPPercentage(nation);

  if (percentage >= 80) return 'text-green-500';
  if (percentage >= 50) return 'text-green-400';
  if (percentage >= 30) return 'text-yellow-400';
  if (percentage >= 10) return 'text-orange-400';
  return 'text-red-500';
}

/**
 * Format DIP amount for display
 */
export function formatDIP(amount: number): string {
  return `${amount} DIP`;
}

/**
 * Get DIP status description
 */
export function getDIPStatus(nation: Nation): string {
  const percentage = getDIPPercentage(nation);

  if (percentage >= 80) return 'Abundant Influence';
  if (percentage >= 50) return 'Adequate Influence';
  if (percentage >= 30) return 'Limited Influence';
  if (percentage >= 10) return 'Low Influence';
  return 'Minimal Influence';
}
