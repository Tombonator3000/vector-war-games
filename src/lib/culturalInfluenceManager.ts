/**
 * CULTURAL INFLUENCE MANAGER
 * Handles cultural influence zones, spreading, and cultural victory
 */

import type { Nation } from '../types/game';
import type { CulturalInfluence } from '../types/culturalWarfare';
import { PopSystemManager } from './popSystemManager';

export class CulturalInfluenceManager {
  /**
   * Calculate cultural influence growth between two nations
   */
  static calculateInfluenceGrowth(
    source: Nation,
    target: Nation,
    areAllies: boolean,
    areNeighbors: boolean
  ): number {
    let growth = 0;

    // Base growth from cultural power
    const culturalPower = source.culturalPower || 0;
    growth += culturalPower / 20;

    // Intel bonus (information control)
    growth += source.intel / 50;

    // Population mass (larger nations have more influence)
    const sourcePop = source.popGroups
      ? PopSystemManager.getTotalPopulation(source.popGroups)
      : source.population;
    growth += sourcePop / 100;

    // Alliance bonus (cultural exchange)
    if (areAllies) {
      growth += 5;
    }

    // Geographic bonus (neighbors have more influence)
    if (areNeighbors) {
      growth += 2;
    }

    // Research bonuses
    if (source.researched?.culture_social_media) {
      growth *= 1.25;
    }
    if (source.researched?.culture_influence) {
      growth *= 1.15;
    }
    if (source.researched?.culture_soft_power) {
      growth *= 1.10;
    }

    // Cultural wonder bonuses
    if (source.culturalWonders) {
      for (const wonder of source.culturalWonders) {
        if (wonder.completed) {
          growth += wonder.effects.culturalPowerBonus * 0.1;
        }
      }
    }

    // Resistance from target's cultural power
    const targetCulturalPower = target.culturalPower || 0;
    const resistance = targetCulturalPower / 50;
    growth = Math.max(0, growth - resistance);

    return growth;
  }

  /**
   * Apply cultural influence to target nation's pops
   */
  static applyCulturalInfluence(
    influence: CulturalInfluence,
    targetPops: import('../types/popSystem').PopGroup[],
    sourceCulture: string
  ): void {
    const influenceFactor = influence.strength / 100;

    for (const pop of targetPops) {
      if (pop.culture !== sourceCulture) {
        // Reduce loyalty to current nation
        const loyaltyReduction = influenceFactor * 2;
        pop.loyalty = Math.max(0, pop.loyalty - loyaltyReduction);

        // Cultural confusion reduces happiness
        if (influence.strength > 50) {
          pop.happiness = Math.max(0, pop.happiness - influenceFactor);
        }
      } else {
        // Strengthen loyalty of pops with source culture
        const loyaltyBoost = influenceFactor * 1.5;
        pop.loyalty = Math.min(100, pop.loyalty + loyaltyBoost);
      }
    }
  }

  /**
   * Update all cultural influences for a nation (per turn)
   */
  static updateCulturalInfluences(
    nation: Nation,
    allNations: Nation[],
    currentTurn: number
  ): void {
    if (!nation.culturalInfluences) {
      nation.culturalInfluences = [];
    }

    for (const influence of nation.culturalInfluences) {
      // Find target nation
      const target = allNations.find(n => n.id === influence.targetNation);
      if (!target) continue;

      // Calculate if they're allies or neighbors
      const areAllies = nation.treaties?.[target.id]?.alliance || false;
      const areNeighbors = this.areNeighbors(nation, target);

      // Calculate growth
      const growth = this.calculateInfluenceGrowth(nation, target, areAllies, areNeighbors);
      influence.growthRate = growth;

      // Apply growth to strength
      influence.strength = Math.min(100, influence.strength + growth);

      // Update modifiers
      influence.modifiers = [];
      if (areAllies) influence.modifiers.push('alliance');
      if (areNeighbors) influence.modifiers.push('geographic');
      if (nation.researched?.culture_social_media) influence.modifiers.push('social_media');

      influence.lastUpdated = currentTurn;

      // Apply influence to target's pops
      if (target.popGroups) {
        this.applyCulturalInfluence(
          influence,
          target.popGroups,
          nation.culturalIdentity || nation.name
        );
      }
    }
  }

  /**
   * Create or update cultural influence between two nations
   */
  static establishInfluence(
    source: Nation,
    targetId: string,
    initialStrength: number = 10
  ): void {
    if (!source.culturalInfluences) {
      source.culturalInfluences = [];
    }

    // Check if influence already exists
    const existing = source.culturalInfluences.find(
      inf => inf.targetNation === targetId
    );

    if (existing) {
      existing.strength = Math.min(100, existing.strength + initialStrength);
    } else {
      source.culturalInfluences.push({
        sourceNation: source.id,
        targetNation: targetId,
        strength: initialStrength,
        growthRate: 0,
        modifiers: [],
      });
    }
  }

  /**
   * Check if cultural victory is achieved
   */
  static checkCulturalVictory(
    nation: Nation,
    allNations: Nation[]
  ): boolean {
    // Must have >100 cultural power
    const culturalPower = nation.culturalPower || 0;
    if (culturalPower < 100) return false;

    // Must have dominant influence in >50% of nations
    const influences = nation.culturalInfluences || [];
    const dominantInfluences = influences.filter(inf => inf.strength > 70);

    const otherNations = allNations.filter(n => n.id !== nation.id && !n.eliminated);
    const requiredInfluences = Math.ceil(otherNations.length / 2);

    return dominantInfluences.length >= requiredInfluences;
  }

  /**
   * Check if demographic victory is achieved
   */
  static checkDemographicVictory(
    nation: Nation,
    allNations: Nation[]
  ): {
    achieved: boolean;
    requirements: {
      populationShare: { met: boolean; value: number; required: number };
      allies: { met: boolean; value: number; required: number };
      stability: { met: boolean; value: number; required: number };
      culturalInfluence: { met: boolean; value: number; required: number };
      avgLoyalty: { met: boolean; value: number; required: number };
    };
  } {
    const totalWorldPop = allNations.reduce((sum, n) => {
      if (n.popGroups) {
        return sum + PopSystemManager.getTotalPopulation(n.popGroups);
      }
      return sum + n.population;
    }, 0);

    const nationPop = nation.popGroups
      ? PopSystemManager.getTotalPopulation(nation.popGroups)
      : nation.population;

    const populationShare = (nationPop / totalWorldPop) * 100;

    const allies = allNations.filter(n =>
      n.id !== nation.id && nation.treaties?.[n.id]?.alliance
    );

    const instability = nation.instability || 0;

    const strongInfluences = (nation.culturalInfluences || [])
      .filter(inf => inf.strength > 40);

    const avgLoyalty = nation.popGroups
      ? PopSystemManager.getAverageLoyalty(nation.popGroups)
      : 100;

    const requirements = {
      populationShare: {
        met: populationShare > 60,
        value: populationShare,
        required: 60,
      },
      allies: {
        met: allies.length >= 3,
        value: allies.length,
        required: 3,
      },
      stability: {
        met: instability < 25,
        value: instability,
        required: 25,
      },
      culturalInfluence: {
        met: strongInfluences.length >= 5,
        value: strongInfluences.length,
        required: 5,
      },
      avgLoyalty: {
        met: avgLoyalty > 70,
        value: avgLoyalty,
        required: 70,
      },
    };

    const achieved = Object.values(requirements).every(req => req.met);

    return { achieved, requirements };
  }

  /**
   * Simple neighbor check (can be enhanced with actual geographic data)
   */
  private static areNeighbors(nation1: Nation, nation2: Nation): boolean {
    // Simple distance check based on lon/lat
    const dx = nation1.lon - nation2.lon;
    const dy = nation1.lat - nation2.lat;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Consider neighbors if within ~500 units
    return distance < 500;
  }
}
