/**
 * Strike System Manager
 *
 * Modular system for managing labor strikes and their economic impact.
 * Handles strike creation, escalation, resolution, and production effects.
 *
 * Phase 3 - Priority 2
 */

import type {
  StrikeState,
  StrikeType,
  StrikeDemand,
} from '@/types/regionalMorale';

/**
 * Configuration for strike mechanics
 */
export interface StrikeConfig {
  /** Base chance for strike to start (0-100) */
  baseSpawnChance: number;
  /** Morale threshold below which strikes can spawn */
  moraleThreshold: number;
  /** Minimum demands (gold cost) */
  minDemandCost: number;
  /** Maximum demands (gold cost) */
  maxDemandCost: number;
  /** Turns of negotiation before auto-resolution */
  autoResolveTurns: number;
}

export const DEFAULT_STRIKE_CONFIG: StrikeConfig = {
  baseSpawnChance: 10,
  moraleThreshold: 35,
  minDemandCost: 200,
  maxDemandCost: 800,
  autoResolveTurns: 10,
};

/**
 * Manager class for strike system
 */
export class StrikeSystemManager {
  private strikes: Map<string, StrikeState>;
  private currentTurn: number;
  private config: StrikeConfig;

  constructor(config: StrikeConfig = DEFAULT_STRIKE_CONFIG, currentTurn: number = 0) {
    this.strikes = new Map();
    this.currentTurn = currentTurn;
    this.config = config;
  }

  /**
   * Check if a strike should spawn in a territory
   */
  shouldSpawnStrike(
    morale: number,
    productionValue: number,
    hasProtest: boolean
  ): boolean {
    if (morale >= this.config.moraleThreshold) return false;

    // Calculate spawn chance based on morale
    const moraleFactor = (this.config.moraleThreshold - morale) / this.config.moraleThreshold;
    let spawnChance = this.config.baseSpawnChance * (1 + moraleFactor);

    // Protests increase strike chance
    if (hasProtest) spawnChance *= 1.5;

    // High production regions more likely to strike (more workers)
    const productionFactor = Math.min(1.5, productionValue / 500);
    spawnChance *= productionFactor;

    return Math.random() * 100 < Math.min(60, spawnChance);
  }

  /**
   * Determine strike type based on nation characteristics
   */
  determineStrikeType(
    isIndustrial: boolean,
    hasTransportation: boolean,
    isCapital: boolean
  ): StrikeType {
    if (isCapital) return 'public_sector_strike'; // Government workers
    if (hasTransportation) return 'transportation_strike';
    if (isIndustrial) return 'industrial_strike';
    return 'general_strike';
  }

  /**
   * Generate strike demands based on type and conditions
   */
  generateDemands(
    strikeType: StrikeType,
    morale: number,
    productionValue: number
  ): StrikeDemand[] {
    const demands: StrikeDemand[] = [];

    // Always demand wages
    const wagesSeverity = morale < 20 ? 'critical' : morale < 30 ? 'major' : 'minor';
    const wagesCost = Math.round(productionValue * 0.3 + Math.random() * 100);
    demands.push({ type: 'wages', severity: wagesSeverity, cost: wagesCost });

    // Peace demands if morale very low
    if (morale < 25) {
      demands.push({ type: 'peace', severity: 'major', cost: 0 }); // Political demand
    }

    // Reform demands for public sector
    if (strikeType === 'public_sector_strike') {
      const reformCost = Math.round(productionValue * 0.2);
      demands.push({ type: 'reform', severity: 'minor', cost: reformCost });
    }

    // Resource demands for general strikes
    if (strikeType === 'general_strike' && morale < 30) {
      const resourceCost = Math.round(productionValue * 0.15);
      demands.push({ type: 'resources', severity: 'minor', cost: resourceCost });
    }

    return demands;
  }

  /**
   * Create a new strike in a territory
   */
  createStrike(
    territoryId: string,
    type: StrikeType,
    demands: StrikeDemand[]
  ): StrikeState {
    // Calculate total cost
    const totalCost = demands.reduce((sum, d) => sum + d.cost, 0);

    // Calculate production effects based on strike type
    let productionHalted = false;
    let productionPenalty = 0;

    switch (type) {
      case 'general_strike':
        productionHalted = true; // Complete halt
        break;
      case 'industrial_strike':
        productionPenalty = 70; // 70% penalty
        break;
      case 'transportation_strike':
        productionPenalty = 50; // 50% penalty
        break;
      case 'public_sector_strike':
        productionPenalty = 30; // 30% penalty
        break;
    }

    const strike: StrikeState = {
      type,
      startTurn: this.currentTurn,
      duration: 0,
      strikerDemands: demands,
      productionHalted,
      productionPenalty,
      resolutionCost: totalCost,
      negotiationProgress: 0,
      forceSuppression: false,
    };

    this.strikes.set(territoryId, strike);
    return strike;
  }

  /**
   * Get strike for a territory
   */
  getStrike(territoryId: string): StrikeState | undefined {
    return this.strikes.get(territoryId);
  }

  /**
   * Get all active strikes
   */
  getAllStrikes(): Map<string, StrikeState> {
    return new Map(this.strikes);
  }

  /**
   * Update strike duration
   */
  updateStrike(territoryId: string): StrikeState | null {
    const strike = this.strikes.get(territoryId);
    if (!strike) return null;

    const updated: StrikeState = {
      ...strike,
      duration: strike.duration + 1,
    };

    // Demands increase over time (5% per turn)
    if (updated.duration > 2) {
      const escalation = 1 + (updated.duration - 2) * 0.05;
      updated.resolutionCost = Math.round(strike.resolutionCost * escalation);
    }

    this.strikes.set(territoryId, updated);
    return updated;
  }

  /**
   * Negotiate with strikers (progress toward resolution)
   */
  negotiate(
    territoryId: string,
    goldOffered: number
  ): {
    success: boolean;
    progressGained: number;
    remainingCost: number;
    strikeEnded: boolean;
  } {
    const strike = this.strikes.get(territoryId);
    if (!strike) {
      return {
        success: false,
        progressGained: 0,
        remainingCost: 0,
        strikeEnded: false,
      };
    }

    // Calculate progress from offer
    const progressGained = Math.min(
      100 - strike.negotiationProgress,
      (goldOffered / strike.resolutionCost) * 100
    );

    const newProgress = strike.negotiationProgress + progressGained;
    const remainingCost = Math.round(strike.resolutionCost * (1 - newProgress / 100));

    // Check if resolved
    if (newProgress >= 100 || goldOffered >= strike.resolutionCost) {
      this.strikes.delete(territoryId);
      return {
        success: true,
        progressGained,
        remainingCost: 0,
        strikeEnded: true,
      };
    }

    // Update progress
    const updated: StrikeState = {
      ...strike,
      negotiationProgress: newProgress,
    };

    this.strikes.set(territoryId, updated);

    return {
      success: true,
      progressGained,
      remainingCost,
      strikeEnded: false,
    };
  }

  /**
   * Attempt to suppress strike with force
   */
  suppressStrike(
    territoryId: string,
    forceLevel: number // 1-10
  ): {
    success: boolean;
    strikeEnded: boolean;
    moralePenalty: number;
    approvalPenalty: number;
    casualties: number;
  } {
    const strike = this.strikes.get(territoryId);
    if (!strike) {
      return {
        success: false,
        strikeEnded: false,
        moralePenalty: 0,
        approvalPenalty: 0,
        casualties: 0,
      };
    }

    // Force has chance to end strike immediately
    const successChance = forceLevel * 8 + Math.random() * 20; // 8-100% range
    const success = Math.random() * 100 < successChance;

    // But there are severe penalties
    const moralePenalty = forceLevel * 3; // -3 to -30
    const approvalPenalty = forceLevel * 4; // -4 to -40
    const casualties = forceLevel * 2 + Math.floor(Math.random() * 10); // 2-30 casualties

    if (success) {
      this.strikes.delete(territoryId);
    } else {
      // Failed suppression makes things worse
      const updated: StrikeState = {
        ...strike,
        forceSuppression: true,
        resolutionCost: Math.round(strike.resolutionCost * 1.5), // Demands increase 50%
      };
      this.strikes.set(territoryId, updated);
    }

    return {
      success,
      strikeEnded: success,
      moralePenalty,
      approvalPenalty,
      casualties,
    };
  }

  /**
   * Pay all demands immediately
   */
  payDemands(
    territoryId: string
  ): {
    success: boolean;
    totalCost: number;
    moraleBoost: number;
  } {
    const strike = this.strikes.get(territoryId);
    if (!strike) {
      return {
        success: false,
        totalCost: 0,
        moraleBoost: 0,
      };
    }

    const totalCost = strike.resolutionCost;

    // Meeting demands boosts morale
    const moraleBoost = strike.forceSuppression ? 5 : 10; // Lower if previously suppressed

    this.strikes.delete(territoryId);

    return {
      success: true,
      totalCost,
      moraleBoost,
    };
  }

  /**
   * Wait out the strike (no action)
   */
  waitOut(
    territoryId: string
  ): {
    escalated: boolean;
    costIncrease: number;
    productionPenalty: number;
  } {
    const strike = this.strikes.get(territoryId);
    if (!strike) {
      return {
        escalated: false,
        costIncrease: 0,
        productionPenalty: 0,
      };
    }

    // Strike escalates over time
    const escalationChance = Math.min(50, strike.duration * 8);
    const escalated = Math.random() * 100 < escalationChance;

    let costIncrease = 0;
    if (escalated) {
      costIncrease = Math.round(strike.resolutionCost * 0.15);
      const updated: StrikeState = {
        ...strike,
        resolutionCost: strike.resolutionCost + costIncrease,
        productionPenalty: Math.min(90, strike.productionPenalty + 10),
      };
      this.strikes.set(territoryId, updated);
    }

    return {
      escalated,
      costIncrease,
      productionPenalty: strike.productionPenalty,
    };
  }

  /**
   * Process all strikes for one turn
   */
  processTurn(): void {
    const toResolve: string[] = [];

    this.strikes.forEach((strike, territoryId) => {
      // Update duration
      this.updateStrike(territoryId);

      // Auto-resolve if negotiation progressed significantly
      if (strike.negotiationProgress >= 100) {
        toResolve.push(territoryId);
      }

      // Auto-resolve after many turns
      if (strike.duration >= this.config.autoResolveTurns) {
        toResolve.push(territoryId);
      }
    });

    // Remove auto-resolved strikes
    toResolve.forEach((id) => this.strikes.delete(id));

    this.currentTurn++;
  }

  /**
   * Get strike statistics
   */
  getStatistics(): {
    totalStrikes: number;
    productionHalted: number;
    totalProductionPenalty: number;
    totalResolutionCost: number;
    averageDuration: number;
  } {
    let haltedCount = 0;
    let totalPenalty = 0;
    let totalCost = 0;
    let totalDuration = 0;

    this.strikes.forEach((strike) => {
      if (strike.productionHalted) haltedCount++;
      totalPenalty += strike.productionPenalty;
      totalCost += strike.resolutionCost;
      totalDuration += strike.duration;
    });

    const count = this.strikes.size;

    return {
      totalStrikes: count,
      productionHalted: haltedCount,
      totalProductionPenalty: totalPenalty,
      totalResolutionCost: totalCost,
      averageDuration: count > 0 ? totalDuration / count : 0,
    };
  }

  /**
   * Remove a strike (for external resolution)
   */
  removeStrike(territoryId: string): boolean {
    return this.strikes.delete(territoryId);
  }

  /**
   * Clear all strikes
   */
  reset(): void {
    this.strikes.clear();
  }

  /**
   * Export state for serialization
   */
  exportState(): Map<string, StrikeState> {
    return new Map(this.strikes);
  }

  /**
   * Import state from serialization
   */
  importState(state: Map<string, StrikeState>, turn: number): void {
    this.strikes = new Map(state);
    this.currentTurn = turn;
  }
}

/**
 * Factory function to create a Strike System Manager
 */
export function createStrikeSystemManager(
  config: StrikeConfig = DEFAULT_STRIKE_CONFIG,
  currentTurn: number = 0
): StrikeSystemManager {
  return new StrikeSystemManager(config, currentTurn);
}

/**
 * Helper: Calculate total production penalty from strikes
 */
export function calculateTotalStrikeProductionPenalty(
  strikes: Map<string, StrikeState>,
  territoryProductions: Map<string, number>
): number {
  let totalPenalty = 0;

  strikes.forEach((strike, territoryId) => {
    const production = territoryProductions.get(territoryId) || 0;

    if (strike.productionHalted) {
      totalPenalty += production; // Full production lost
    } else {
      totalPenalty += (production * strike.productionPenalty) / 100;
    }
  });

  return Math.round(totalPenalty);
}
