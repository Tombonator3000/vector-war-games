/**
 * Protest System Manager
 *
 * Modular system for managing protests and civil unrest.
 * Handles protest creation, spreading, suppression, and resolution.
 *
 * Phase 3 - Priority 2
 */

import type {
  ProtestState,
  ProtestCause,
  RegionalMorale,
} from '@/types/regionalMorale';
import { shouldProtestSpread } from '@/types/regionalMorale';

/**
 * Configuration for protest mechanics
 */
export interface ProtestConfig {
  /** Base chance for protest to start (0-100) */
  baseSpawnChance: number;
  /** Morale threshold below which protests can spawn */
  moraleThreshold: number;
  /** Minimum intensity for new protests */
  minIntensity: number;
  /** Maximum intensity for new protests */
  maxIntensity: number;
  /** Turns before a protest can spread */
  spreadCooldown: number;
}

export const DEFAULT_PROTEST_CONFIG: ProtestConfig = {
  baseSpawnChance: 15,
  moraleThreshold: 40,
  minIntensity: 2,
  maxIntensity: 6,
  spreadCooldown: 2,
};

/**
 * Manager class for protest system
 */
export class ProtestSystemManager {
  private protests: Map<string, ProtestState>;
  private currentTurn: number;
  private config: ProtestConfig;

  constructor(config: ProtestConfig = DEFAULT_PROTEST_CONFIG, currentTurn: number = 0) {
    this.protests = new Map();
    this.currentTurn = currentTurn;
    this.config = config;
  }

  /**
   * Check if a protest should spawn in a territory
   */
  shouldSpawnProtest(morale: number, existingFactors: ProtestCause[]): boolean {
    if (morale >= this.config.moraleThreshold) return false;

    // Calculate spawn chance based on morale
    const moraleFactor = (this.config.moraleThreshold - morale) / this.config.moraleThreshold;
    const spawnChance = this.config.baseSpawnChance * (1 + moraleFactor);

    // Additional factors increase chance
    const factorBonus = existingFactors.length * 5;

    const totalChance = Math.min(80, spawnChance + factorBonus);

    return Math.random() * 100 < totalChance;
  }

  /**
   * Create a new protest in a territory
   */
  createProtest(
    territoryId: string,
    causes: ProtestCause[],
    initialIntensity?: number
  ): ProtestState {
    const intensity =
      initialIntensity ||
      Math.floor(
        Math.random() * (this.config.maxIntensity - this.config.minIntensity + 1) +
          this.config.minIntensity
      );

    // Calculate effects based on intensity
    const productionPenalty = intensity * 5; // 5-30% penalty
    const moraleImpact = intensity * 0.5; // -0.5 to -3 per turn
    const publicOpinionCost = intensity * 8; // Cost to suppress with force

    const protest: ProtestState = {
      intensity,
      startTurn: this.currentTurn,
      duration: 0,
      causes,
      spreading: intensity >= 6, // High intensity protests spread
      suppressionAttempts: 0,
      productionPenalty,
      moraleImpact,
      publicOpinionCost,
    };

    this.protests.set(territoryId, protest);
    return protest;
  }

  /**
   * Get protest for a territory
   */
  getProtest(territoryId: string): ProtestState | undefined {
    return this.protests.get(territoryId);
  }

  /**
   * Get all active protests
   */
  getAllProtests(): Map<string, ProtestState> {
    return new Map(this.protests);
  }

  /**
   * Update protest duration and intensity
   */
  updateProtest(territoryId: string, intensityChange: number = 0): ProtestState | null {
    const protest = this.protests.get(territoryId);
    if (!protest) return null;

    const newIntensity = Math.max(1, Math.min(10, protest.intensity + intensityChange));
    const newDuration = protest.duration + 1;

    // Update spreading status
    const canSpread = newIntensity >= 6 && newDuration >= this.config.spreadCooldown;

    // Recalculate effects
    const productionPenalty = newIntensity * 5;
    const moraleImpact = newIntensity * 0.5;
    const publicOpinionCost = newIntensity * 8;

    const updated: ProtestState = {
      ...protest,
      intensity: newIntensity,
      duration: newDuration,
      spreading: canSpread,
      productionPenalty,
      moraleImpact,
      publicOpinionCost,
    };

    this.protests.set(territoryId, updated);
    return updated;
  }

  /**
   * Attempt to suppress a protest with force
   */
  suppressProtest(
    territoryId: string,
    forceLevel: number // 1-10
  ): {
    success: boolean;
    intensityReduction: number;
    publicOpinionCost: number;
    protestEnded: boolean;
  } {
    const protest = this.protests.get(territoryId);
    if (!protest) {
      return {
        success: false,
        intensityReduction: 0,
        publicOpinionCost: 0,
        protestEnded: false,
      };
    }

    // Higher force is more effective but costs more
    const effectiveness = forceLevel * 0.8 + Math.random() * 2;
    const intensityReduction = Math.min(protest.intensity, Math.floor(effectiveness));

    // Public opinion cost increases with force and suppression attempts
    const attemptMultiplier = 1 + protest.suppressionAttempts * 0.3;
    const publicOpinionCost = Math.round(
      protest.publicOpinionCost * (forceLevel / 5) * attemptMultiplier
    );

    // Update protest
    const newIntensity = protest.intensity - intensityReduction;

    if (newIntensity <= 0) {
      // Protest ended
      this.protests.delete(territoryId);
      return {
        success: true,
        intensityReduction,
        publicOpinionCost,
        protestEnded: true,
      };
    }

    // Protest continues with reduced intensity
    const updated: ProtestState = {
      ...protest,
      intensity: newIntensity,
      suppressionAttempts: protest.suppressionAttempts + 1,
      productionPenalty: newIntensity * 5,
      moraleImpact: newIntensity * 0.5,
    };

    this.protests.set(territoryId, updated);

    return {
      success: true,
      intensityReduction,
      publicOpinionCost,
      protestEnded: false,
    };
  }

  /**
   * Negotiate with protesters
   */
  negotiateProtest(
    territoryId: string,
    goldOffer: number,
    productionOffer: number
  ): {
    success: boolean;
    intensityReduction: number;
    demandsRequired: number;
    protestEnded: boolean;
  } {
    const protest = this.protests.get(territoryId);
    if (!protest) {
      return {
        success: false,
        intensityReduction: 0,
        demandsRequired: 0,
        protestEnded: false,
      };
    }

    // Calculate demands based on intensity and causes
    const baseDemand = protest.intensity * 100; // 200-1000 gold equivalent
    const demandsRequired = Math.round(baseDemand * (1 + protest.causes.length * 0.2));

    const totalOffer = goldOffer + productionOffer * 2; // Production worth 2x gold

    // Check if offer is sufficient
    if (totalOffer < demandsRequired * 0.5) {
      // Insulting offer, protest intensifies
      this.updateProtest(territoryId, 1);
      return {
        success: false,
        intensityReduction: -1,
        demandsRequired,
        protestEnded: false,
      };
    }

    // Calculate reduction based on offer
    const offerRatio = Math.min(1, totalOffer / demandsRequired);
    const intensityReduction = Math.floor(protest.intensity * offerRatio);

    const newIntensity = protest.intensity - intensityReduction;

    if (newIntensity <= 0 || totalOffer >= demandsRequired) {
      // Demands met, protest ends
      this.protests.delete(territoryId);
      return {
        success: true,
        intensityReduction,
        demandsRequired,
        protestEnded: true,
      };
    }

    // Partial resolution
    const updated: ProtestState = {
      ...protest,
      intensity: newIntensity,
      productionPenalty: newIntensity * 5,
      moraleImpact: newIntensity * 0.5,
    };

    this.protests.set(territoryId, updated);

    return {
      success: true,
      intensityReduction,
      demandsRequired,
      protestEnded: false,
    };
  }

  /**
   * Natural de-escalation of protest (if morale improves)
   */
  attemptNaturalResolution(
    territoryId: string,
    currentMorale: number
  ): { resolved: boolean; intensityReduction: number } {
    const protest = this.protests.get(territoryId);
    if (!protest) return { resolved: false, intensityReduction: 0 };

    // High morale can naturally resolve protests
    if (currentMorale > 60) {
      const resolutionChance = (currentMorale - 60) * 2; // 0-80% chance

      if (Math.random() * 100 < resolutionChance) {
        const reduction = Math.max(1, Math.floor(protest.intensity * 0.5));

        if (protest.intensity - reduction <= 0) {
          this.protests.delete(territoryId);
          return { resolved: true, intensityReduction: reduction };
        }

        this.updateProtest(territoryId, -reduction);
        return { resolved: false, intensityReduction: reduction };
      }
    }

    return { resolved: false, intensityReduction: 0 };
  }

  /**
   * Attempt to spread protest to adjacent territory
   */
  attemptSpread(
    sourceTerritoryId: string,
    targetTerritoryId: string,
    targetMorale: number,
    adjacencyCount: number
  ): { spread: boolean; newProtest: ProtestState | null } {
    const sourceProtest = this.protests.get(sourceTerritoryId);
    if (!sourceProtest || !sourceProtest.spreading) {
      return { spread: false, newProtest: null };
    }

    // Check if target already has protest
    if (this.protests.has(targetTerritoryId)) {
      return { spread: false, newProtest: null };
    }

    // Use spread logic from types
    const shouldSpread = shouldProtestSpread(sourceProtest, targetMorale, adjacencyCount);

    if (shouldSpread) {
      // Create new protest with reduced intensity
      const newIntensity = Math.max(2, Math.floor(sourceProtest.intensity * 0.7));
      const newProtest = this.createProtest(
        targetTerritoryId,
        [...sourceProtest.causes],
        newIntensity
      );

      return { spread: true, newProtest };
    }

    return { spread: false, newProtest: null };
  }

  /**
   * Process all protests for one turn
   */
  processTurn(): void {
    const updates: Array<{ territoryId: string; intensityChange: number }> = [];

    // Update duration for all protests
    this.protests.forEach((protest, territoryId) => {
      // Protests gradually intensify if not addressed
      if (protest.duration > 3 && protest.suppressionAttempts === 0) {
        const escalationChance = Math.min(40, protest.duration * 5);
        if (Math.random() * 100 < escalationChance) {
          updates.push({ territoryId, intensityChange: 1 });
        }
      }
    });

    // Apply updates
    updates.forEach(({ territoryId, intensityChange }) => {
      this.updateProtest(territoryId, intensityChange);
    });

    this.currentTurn++;
  }

  /**
   * Remove a protest (for external resolution)
   */
  removeProtest(territoryId: string): boolean {
    return this.protests.delete(territoryId);
  }

  /**
   * Get territories with protests spreading
   */
  getSpreadingProtests(): Array<{ territoryId: string; protest: ProtestState }> {
    const spreading: Array<{ territoryId: string; protest: ProtestState }> = [];

    this.protests.forEach((protest, territoryId) => {
      if (protest.spreading) {
        spreading.push({ territoryId, protest });
      }
    });

    return spreading;
  }

  /**
   * Get protest statistics
   */
  getStatistics(): {
    totalProtests: number;
    averageIntensity: number;
    spreadingProtests: number;
    totalProductionPenalty: number;
  } {
    let totalIntensity = 0;
    let spreadingCount = 0;
    let totalPenalty = 0;

    this.protests.forEach((protest) => {
      totalIntensity += protest.intensity;
      if (protest.spreading) spreadingCount++;
      totalPenalty += protest.productionPenalty;
    });

    const count = this.protests.size;

    return {
      totalProtests: count,
      averageIntensity: count > 0 ? totalIntensity / count : 0,
      spreadingProtests: spreadingCount,
      totalProductionPenalty: totalPenalty,
    };
  }

  /**
   * Clear all protests
   */
  reset(): void {
    this.protests.clear();
  }

  /**
   * Export state for serialization
   */
  exportState(): Map<string, ProtestState> {
    return new Map(this.protests);
  }

  /**
   * Import state from serialization
   */
  importState(state: Map<string, ProtestState>, turn: number): void {
    this.protests = new Map(state);
    this.currentTurn = turn;
  }
}

/**
 * Factory function to create a Protest System Manager
 */
export function createProtestSystemManager(
  config: ProtestConfig = DEFAULT_PROTEST_CONFIG,
  currentTurn: number = 0
): ProtestSystemManager {
  return new ProtestSystemManager(config, currentTurn);
}

/**
 * Helper: Determine protest causes from nation state
 */
export function determineProtestCauses(
  morale: number,
  recentMilitaryLosses: boolean,
  economicHardship: boolean,
  atWar: boolean,
  nuclearStrike: boolean,
  isOccupied: boolean,
  refugeeInflux: boolean,
  unpopularPolicy: boolean
): ProtestCause[] {
  const causes: ProtestCause[] = [];

  if (morale < 30) causes.push('low_morale');
  if (recentMilitaryLosses) causes.push('military_losses');
  if (economicHardship) causes.push('economic_hardship');
  if (atWar) causes.push('war_exhaustion');
  if (nuclearStrike) causes.push('nuclear_strikes');
  if (isOccupied) causes.push('occupation');
  if (refugeeInflux) causes.push('refugees');
  if (unpopularPolicy) causes.push('policy_discontent');

  return causes;
}
