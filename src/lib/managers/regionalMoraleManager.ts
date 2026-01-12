/**
 * Regional Morale Manager
 *
 * Modular system for managing morale at the territory level.
 * Handles morale updates, diffusion, and effects on gameplay.
 *
 * Phase 3 - Priority 1
 */

import type {
  RegionalMorale,
  NationalMoraleCalculation,
  ProtestState,
  StrikeState,
} from '@/types/regionalMorale';

/**
 * Manager class for regional morale system
 */
export class RegionalMoraleManager {
  private morale: Map<string, RegionalMorale>;
  private currentTurn: number;

  constructor(currentTurn: number = 0) {
    this.morale = new Map();
    this.currentTurn = currentTurn;
  }

  /**
   * Initialize morale for a territory
   */
  initializeTerritory(
    territoryId: string,
    initialMorale: number = 60,
    turn: number = 0
  ): RegionalMorale {
    const morale: RegionalMorale = {
      territoryId,
      morale: Math.max(0, Math.min(100, initialMorale)),
      lastEventTurn: turn,
      lastMoraleChange: 0,
      historicalMorale: [initialMorale],
      protests: null,
      strikes: null,
      refugeeInflux: 0,
    };

    this.morale.set(territoryId, morale);
    return morale;
  }

  /**
   * Get morale for a territory
   */
  getMorale(territoryId: string): RegionalMorale | undefined {
    return this.morale.get(territoryId);
  }

  /**
   * Get all morale values
   */
  getAllMorale(): RegionalMorale[] {
    return Array.from(this.morale.values());
  }

  /**
   * Update morale for a territory
   */
  updateMorale(
    territoryId: string,
    delta: number,
    reason?: string
  ): RegionalMorale | null {
    const current = this.morale.get(territoryId);
    if (!current) return null;

    const newMorale = Math.max(0, Math.min(100, current.morale + delta));
    const change = newMorale - current.morale;

    // Update historical morale (keep last 5 turns)
    const historical = [...current.historicalMorale, newMorale];
    if (historical.length > 5) {
      historical.shift();
    }

    const updated: RegionalMorale = {
      ...current,
      morale: newMorale,
      lastMoraleChange: change,
      lastEventTurn: this.currentTurn,
      historicalMorale: historical,
    };

    this.morale.set(territoryId, updated);
    return updated;
  }

  /**
   * Set morale directly
   */
  setMorale(territoryId: string, value: number): RegionalMorale | null {
    const current = this.morale.get(territoryId);
    if (!current) return null;

    const newMorale = Math.max(0, Math.min(100, value));
    const change = newMorale - current.morale;

    const updated: RegionalMorale = {
      ...current,
      morale: newMorale,
      lastMoraleChange: change,
      lastEventTurn: this.currentTurn,
    };

    this.morale.set(territoryId, updated);
    return updated;
  }

  /**
   * Calculate national morale from regional values
   */
  calculateNationalMorale(
    territories: Array<{ id: string; strategicValue: number }>
  ): NationalMoraleCalculation {
    const regionalValues = this.getAllMorale();

    if (regionalValues.length === 0) {
      return {
        weightedAverage: 50,
        lowest: 50,
        highest: 50,
        volatility: 0,
        criticalRegions: [],
      };
    }

    // Weight by strategic value
    let totalWeight = 0;
    let weightedSum = 0;
    let lowest = 100;
    let highest = 0;
    const criticalRegions: string[] = [];

    regionalValues.forEach((rm) => {
      const territory = territories.find((t) => t.id === rm.territoryId);
      const weight = territory?.strategicValue || 1;

      weightedSum += rm.morale * weight;
      totalWeight += weight;

      if (rm.morale < lowest) lowest = rm.morale;
      if (rm.morale > highest) highest = rm.morale;
      if (rm.morale < 30) criticalRegions.push(rm.territoryId);
    });

    const weightedAverage = totalWeight > 0 ? weightedSum / totalWeight : 50;

    // Calculate volatility (standard deviation)
    const variance =
      regionalValues.reduce((sum, rm) => {
        const diff = rm.morale - weightedAverage;
        return sum + diff * diff;
      }, 0) / regionalValues.length;

    const volatility = Math.min(100, Math.sqrt(variance));

    return {
      weightedAverage: Math.round(weightedAverage),
      lowest: Math.round(lowest),
      highest: Math.round(highest),
      volatility: Math.round(volatility),
      criticalRegions,
    };
  }

  /**
   * Apply morale decay/recovery over time
   */
  applyNaturalChange(
    territoryId: string,
    targetMorale: number = 60,
    recoveryRate: number = 0.5
  ): RegionalMorale | null {
    const current = this.morale.get(territoryId);
    if (!current) return null;

    // Move toward target morale gradually
    const difference = targetMorale - current.morale;
    const change = difference * recoveryRate;

    return this.updateMorale(territoryId, change, 'natural_recovery');
  }

  /**
   * Apply effects from protests
   */
  applyProtestEffects(territoryId: string, protest: ProtestState): RegionalMorale | null {
    const current = this.morale.get(territoryId);
    if (!current) return null;

    // Protests reduce morale
    const moralePenalty = -protest.moraleImpact;

    const updated = {
      ...current,
      protests: protest,
    };

    this.morale.set(territoryId, updated);
    return this.updateMorale(territoryId, moralePenalty, 'protest_effect');
  }

  /**
   * Remove protest from territory
   */
  removeProtest(territoryId: string): RegionalMorale | null {
    const current = this.morale.get(territoryId);
    if (!current) return null;

    const updated = {
      ...current,
      protests: null,
    };

    this.morale.set(territoryId, updated);
    return updated;
  }

  /**
   * Apply effects from strikes
   */
  applyStrikeEffects(territoryId: string, strike: StrikeState): RegionalMorale | null {
    const current = this.morale.get(territoryId);
    if (!current) return null;

    const updated = {
      ...current,
      strikes: strike,
    };

    this.morale.set(territoryId, updated);
    return updated;
  }

  /**
   * Remove strike from territory
   */
  removeStrike(territoryId: string): RegionalMorale | null {
    const current = this.morale.get(territoryId);
    if (!current) return null;

    const updated = {
      ...current,
      strikes: null,
    };

    this.morale.set(territoryId, updated);
    return updated;
  }

  /**
   * Apply refugee influx effects
   */
  applyRefugeeInflux(
    territoryId: string,
    refugeeCount: number
  ): RegionalMorale | null {
    const current = this.morale.get(territoryId);
    if (!current) return null;

    // Large refugee influx reduces morale temporarily
    const moralePenalty = -Math.min(10, refugeeCount / 100);

    const updated = {
      ...current,
      refugeeInflux: refugeeCount,
    };

    this.morale.set(territoryId, updated);
    return this.updateMorale(territoryId, moralePenalty, 'refugee_influx');
  }

  /**
   * Get territories with critical morale (below threshold)
   */
  getCriticalTerritories(threshold: number = 30): RegionalMorale[] {
    return Array.from(this.morale.values()).filter((m) => m.morale < threshold);
  }

  /**
   * Get territories with active protests
   */
  getTerritoriesWithProtests(): RegionalMorale[] {
    return Array.from(this.morale.values()).filter((m) => m.protests !== null);
  }

  /**
   * Get territories with active strikes
   */
  getTerritoriesWithStrikes(): RegionalMorale[] {
    return Array.from(this.morale.values()).filter((m) => m.strikes !== null);
  }

  /**
   * Get morale trend for a territory (positive = improving, negative = declining)
   */
  getMoraleTrend(territoryId: string): number {
    const current = this.morale.get(territoryId);
    if (!current || current.historicalMorale.length < 2) return 0;

    const history = current.historicalMorale;
    const recent = history.slice(-3); // Last 3 turns

    if (recent.length < 2) return 0;

    // Calculate average change
    let totalChange = 0;
    for (let i = 1; i < recent.length; i++) {
      totalChange += recent[i] - recent[i - 1];
    }

    return totalChange / (recent.length - 1);
  }

  /**
   * Check if territory is unstable (multiple negative factors)
   */
  isUnstable(territoryId: string): boolean {
    const current = this.morale.get(territoryId);
    if (!current) return false;

    let instabilityFactors = 0;

    if (current.morale < 40) instabilityFactors++;
    if (current.protests !== null) instabilityFactors++;
    if (current.strikes !== null) instabilityFactors++;
    if (this.getMoraleTrend(territoryId) < -2) instabilityFactors++;

    return instabilityFactors >= 2;
  }

  /**
   * Update turn counter
   */
  advanceTurn(): void {
    this.currentTurn++;
  }

  /**
   * Reset all morale to default
   */
  reset(): void {
    this.morale.clear();
    this.currentTurn = 0;
  }

  /**
   * Export state for serialization
   */
  exportState(): RegionalMorale[] {
    return this.getAllMorale();
  }

  /**
   * Import state from serialization
   */
  importState(state: RegionalMorale[], turn: number): void {
    this.morale.clear();
    this.currentTurn = turn;

    state.forEach((morale) => {
      this.morale.set(morale.territoryId, morale);
    });
  }
}

/**
 * Factory function to create a Regional Morale Manager
 */
export function createRegionalMoraleManager(currentTurn: number = 0): RegionalMoraleManager {
  return new RegionalMoraleManager(currentTurn);
}

/**
 * Helper: Initialize morale for all territories in a nation
 */
export function initializeNationMorale(
  manager: RegionalMoraleManager,
  territories: Array<{ id: string; isConquered?: boolean }>,
  baselineMorale: number = 60,
  turn: number = 0
): void {
  territories.forEach((territory) => {
    // Conquered territories start with lower morale
    const initialMorale = territory.isConquered
      ? Math.max(20, baselineMorale - 30)
      : baselineMorale;

    manager.initializeTerritory(territory.id, initialMorale, turn);
  });
}

/**
 * Helper: Calculate production modifier from morale
 */
export function calculateMoraleProductionModifier(morale: number): number {
  // 0-100 morale -> 0.7x to 1.25x production
  // Formula: 0.7 + (morale / 100) * 0.55
  return 0.7 + (morale / 100) * 0.55;
}

/**
 * Helper: Calculate recruitment modifier from morale
 */
export function calculateMoraleRecruitmentModifier(morale: number): number {
  // 0-100 morale -> 0.75x to 1.2x recruitment
  // Formula: 0.75 + (morale / 100) * 0.45
  return 0.75 + (morale / 100) * 0.45;
}
