/**
 * POP SYSTEM MANAGER
 * Core logic for managing population groups, assimilation, and productivity
 */

import type { PopGroup, SkillLevel } from '../types/popSystem';

/**
 * Cultural family groupings for assimilation bonuses
 */
const CULTURAL_FAMILIES: Record<string, string[]> = {
  western: ['USA', 'United States', 'UK', 'United Kingdom', 'France', 'Germany', 'Canada', 'Australia'],
  eastern: ['China', 'Japan', 'South Korea', 'Taiwan'],
  slavic: ['Russia', 'Ukraine', 'Poland', 'Belarus'],
  latin: ['Brazil', 'Mexico', 'Argentina', 'Spain'],
  middleEastern: ['Iran', 'Saudi Arabia', 'Turkey', 'Egypt'],
  southAsian: ['India', 'Pakistan', 'Bangladesh'],
};

export class PopSystemManager {
  /**
   * Calculate total population from pop groups
   */
  static getTotalPopulation(popGroups: PopGroup[]): number {
    return popGroups.reduce((sum, pop) => sum + pop.size, 0);
  }

  /**
   * Calculate average loyalty across all pops (weighted by size)
   */
  static getAverageLoyalty(popGroups: PopGroup[]): number {
    if (popGroups.length === 0) return 100;
    const totalPop = this.getTotalPopulation(popGroups);
    if (totalPop === 0) return 100;

    const weightedLoyalty = popGroups.reduce(
      (sum, pop) => sum + (pop.loyalty * pop.size),
      0
    );
    return weightedLoyalty / totalPop;
  }

  /**
   * Calculate average assimilation across all pops (weighted by size)
   */
  static getAverageAssimilation(popGroups: PopGroup[]): number {
    if (popGroups.length === 0) return 100;
    const totalPop = this.getTotalPopulation(popGroups);
    if (totalPop === 0) return 100;

    const weightedAssimilation = popGroups.reduce(
      (sum, pop) => sum + (pop.assimilation * pop.size),
      0
    );
    return weightedAssimilation / totalPop;
  }

  /**
   * Calculate average happiness across all pops (weighted by size)
   */
  static getAverageHappiness(popGroups: PopGroup[]): number {
    if (popGroups.length === 0) return 75;
    const totalPop = this.getTotalPopulation(popGroups);
    if (totalPop === 0) return 75;

    const weightedHappiness = popGroups.reduce(
      (sum, pop) => sum + (pop.happiness * pop.size),
      0
    );
    return weightedHappiness / totalPop;
  }

  /**
   * Calculate productivity modifier based on pop composition
   * Returns a multiplier (0.5 to 2.0)
   */
  static getProductivityModifier(popGroups: PopGroup[]): number {
    if (popGroups.length === 0) return 1.0;

    const totalPop = this.getTotalPopulation(popGroups);
    if (totalPop === 0) return 1.0;

    let totalProductivity = 0;

    for (const pop of popGroups) {
      const loyaltyFactor = pop.loyalty / 100;
      const happinessFactor = pop.happiness / 100;
      const skillMultiplier =
        pop.skills === 'high' ? 1.5 :
        pop.skills === 'medium' ? 1.0 :
        0.7;

      const popWeight = pop.size / totalPop;
      const popProductivity = loyaltyFactor * happinessFactor * skillMultiplier;

      totalProductivity += popProductivity * popWeight;
    }

    return Math.max(0.5, Math.min(2.0, totalProductivity));
  }

  /**
   * Process assimilation for all pop groups
   */
  static processAssimilation(
    popGroups: PopGroup[],
    baseAssimilationRate: number,
    nationalCulture: string
  ): void {
    for (const pop of popGroups) {
      if (pop.assimilation >= 100) {
        pop.yearsSinceArrival += 1;
        continue;
      }

      let assimilationGain = baseAssimilationRate;

      // Bonus if origin culture is similar
      if (this.areCulturesSimilar(pop.culture, nationalCulture)) {
        assimilationGain += 2;
      }

      // Time-based bonus (longer residence = faster assimilation)
      assimilationGain += Math.min(pop.yearsSinceArrival * 0.5, 5);

      // High-skill pops assimilate faster
      if (pop.skills === 'high') {
        assimilationGain *= 1.2;
      }

      // Apply assimilation
      pop.assimilation = Math.min(100, pop.assimilation + assimilationGain);

      // Loyalty increases with assimilation
      if (pop.assimilation > pop.loyalty) {
        pop.loyalty += (pop.assimilation - pop.loyalty) * 0.1;
        pop.loyalty = Math.min(100, pop.loyalty);
      }

      // Happiness slowly increases as they integrate
      if (pop.assimilation > 50) {
        pop.happiness += 0.5;
        pop.happiness = Math.min(100, pop.happiness);
      }

      pop.yearsSinceArrival += 1;
    }
  }

  /**
   * Create a new pop group from immigration
   */
  static createImmigrantPop(
    size: number,
    origin: string,
    originCulture: string,
    skills: SkillLevel = 'medium'
  ): PopGroup {
    // Determine initial loyalty based on skill level
    const baseLoyalty = skills === 'high' ? 40 : skills === 'medium' ? 35 : 30;
    const loyaltyVariation = Math.random() * 15;

    return {
      id: `pop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      size,
      origin,
      loyalty: baseLoyalty + loyaltyVariation,
      culture: originCulture,
      skills,
      assimilation: 10 + Math.random() * 10, // 10-20 initial
      happiness: 60 + Math.random() * 20,    // 60-80 (hopeful immigrants)
      yearsSinceArrival: 0,
    };
  }

  /**
   * Check if cultures are similar (for assimilation bonuses)
   */
  static areCulturesSimilar(culture1: string, culture2: string): boolean {
    // Same culture = similar
    if (culture1 === culture2) return true;

    // Check cultural families
    for (const family of Object.values(CULTURAL_FAMILIES)) {
      const culture1InFamily = family.some(c =>
        c.toLowerCase() === culture1.toLowerCase() ||
        culture1.toLowerCase().includes(c.toLowerCase())
      );
      const culture2InFamily = family.some(c =>
        c.toLowerCase() === culture2.toLowerCase() ||
        culture2.toLowerCase().includes(c.toLowerCase())
      );

      if (culture1InFamily && culture2InFamily) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate instability from pop discontent
   */
  static getInstabilityFromPops(popGroups: PopGroup[]): number {
    if (popGroups.length === 0) return 0;

    let instability = 0;
    const totalPop = this.getTotalPopulation(popGroups);
    if (totalPop === 0) return 0;

    for (const pop of popGroups) {
      const popWeight = pop.size / totalPop;

      // Low loyalty = high instability
      const loyaltyInstability = (100 - pop.loyalty) * popWeight * 0.3;

      // Low happiness = instability
      const happinessInstability = (100 - pop.happiness) * popWeight * 0.2;

      // Poor assimilation = instability
      const assimilationInstability = (100 - pop.assimilation) * popWeight * 0.1;

      instability += loyaltyInstability + happinessInstability + assimilationInstability;
    }

    return Math.max(0, instability);
  }

  /**
   * Get skill distribution percentages
   */
  static getSkillDistribution(popGroups: PopGroup[]): {
    high: number;
    medium: number;
    low: number;
  } {
    if (popGroups.length === 0) {
      return { high: 0, medium: 0, low: 0 };
    }

    const totalPop = this.getTotalPopulation(popGroups);
    if (totalPop === 0) {
      return { high: 0, medium: 0, low: 0 };
    }

    const highSkill = popGroups
      .filter(p => p.skills === 'high')
      .reduce((sum, p) => sum + p.size, 0);
    const mediumSkill = popGroups
      .filter(p => p.skills === 'medium')
      .reduce((sum, p) => sum + p.size, 0);
    const lowSkill = popGroups
      .filter(p => p.skills === 'low')
      .reduce((sum, p) => sum + p.size, 0);

    return {
      high: (highSkill / totalPop) * 100,
      medium: (mediumSkill / totalPop) * 100,
      low: (lowSkill / totalPop) * 100,
    };
  }

  /**
   * Get the least loyal pop group
   */
  static getLeastLoyalPop(popGroups: PopGroup[]): PopGroup | null {
    if (popGroups.length === 0) return null;
    return popGroups.reduce((least, pop) =>
      pop.loyalty < least.loyalty ? pop : least
    );
  }

  /**
   * Reduce pop happiness (from propaganda, crisis, etc.)
   */
  static reducePopHappiness(popGroups: PopGroup[], amount: number): void {
    for (const pop of popGroups) {
      pop.happiness = Math.max(0, pop.happiness - amount);
    }
  }

  /**
   * Reduce pop loyalty (from cultural attacks)
   */
  static reducePopLoyalty(popGroups: PopGroup[], amount: number, targetCulture?: string): void {
    for (const pop of popGroups) {
      // If targeting specific culture, only affect those pops
      if (targetCulture && pop.culture !== targetCulture) continue;

      pop.loyalty = Math.max(0, pop.loyalty - amount);
    }
  }

  /**
   * Boost pop loyalty (from policies, incentives)
   */
  static boostPopLoyalty(popGroups: PopGroup[], amount: number): void {
    for (const pop of popGroups) {
      pop.loyalty = Math.min(100, pop.loyalty + amount);
    }
  }

  /**
   * Initialize pop groups for a nation (migration from simple population number)
   */
  static initializePopGroups(
    population: number,
    nationName: string,
    culture: string
  ): PopGroup[] {
    // Create a native pop representing the existing population
    return [{
      id: `pop_native_${nationName}_${Date.now()}`,
      size: population,
      origin: nationName,
      loyalty: 80 + Math.random() * 20, // 80-100 for natives
      culture: culture,
      skills: 'medium' as SkillLevel,
      assimilation: 100, // Natives are fully assimilated
      happiness: 70 + Math.random() * 20, // 70-90
      yearsSinceArrival: 999, // Been here forever
    }];
  }
}
