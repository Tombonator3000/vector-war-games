/**
 * EXAMPLE IMPLEMENTATION: Enhanced Pop System
 * Dette viser hvordan det nye systemet kan se ut i praksis
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type SkillLevel = 'low' | 'medium' | 'high';
export type ImmigrationPolicyType =
  | 'closed_borders'
  | 'selective'
  | 'humanitarian'
  | 'open_borders'
  | 'cultural_exchange'
  | 'brain_drain_ops';

export interface PopGroup {
  id: string;
  size: number;                 // Millions
  origin: string;               // Which nation they came from
  loyalty: number;              // 0-100, affects productivity and stability
  culture: string;              // Cultural identity
  skills: SkillLevel;           // Education level
  assimilation: number;         // 0-100, how integrated they are
  happiness: number;            // 0-100, affects productivity
  yearsSinceArrival: number;    // Time since immigration
}

export interface CulturalInfluence {
  sourceNation: string;
  targetNation: string;
  strength: number;             // 0-100
  growthRate: number;           // How fast it grows
  modifiers: string[];          // Factors affecting growth
}

export interface ImmigrationPolicy {
  type: ImmigrationPolicyType;
  stabilityModifier: number;
  economicGrowth: number;
  diplomaticImpact: number;
  culturalAssimilationRate: number;
  immigrationRate: number;
  intelCostPerTurn: number;
}

export interface PropagandaCampaign {
  id: string;
  targetNation: string;
  type: 'subversion' | 'attraction' | 'demoralization' | 'conversion';
  investment: number;           // Intel per turn
  duration: number;             // Turns remaining
  effectiveness: number;        // Success chance
  discovered: boolean;          // Has target discovered the campaign?
  counterMeasures: number;      // Target's defense
}

// ============================================================================
// IMMIGRATION POLICIES
// ============================================================================

export const IMMIGRATION_POLICIES: Record<ImmigrationPolicyType, ImmigrationPolicy> = {
  closed_borders: {
    type: 'closed_borders',
    stabilityModifier: 10,      // +10% stability
    economicGrowth: -5,          // -5% economic growth
    diplomaticImpact: -10,       // -10 reputation
    culturalAssimilationRate: 0,
    immigrationRate: 0,
    intelCostPerTurn: 5,         // Border enforcement cost
  },

  selective: {
    type: 'selective',
    stabilityModifier: 5,        // +5% stability (controlled flow)
    economicGrowth: 15,          // +15% economic boost (high-skill workers)
    diplomaticImpact: 0,
    culturalAssimilationRate: 10, // Easier to integrate skilled workers
    immigrationRate: 2,          // 2M per turn
    intelCostPerTurn: 10,        // Expensive screening process
  },

  humanitarian: {
    type: 'humanitarian',
    stabilityModifier: -10,      // -10% stability (strain on services)
    economicGrowth: 0,
    diplomaticImpact: 20,        // +20 reputation (moral leadership)
    culturalAssimilationRate: 5,
    immigrationRate: 6,          // 6M per turn
    intelCostPerTurn: 15,        // Refugee processing costs
  },

  open_borders: {
    type: 'open_borders',
    stabilityModifier: -20,      // -20% stability (rapid demographic change)
    economicGrowth: 10,          // +10% growth (large labor force)
    diplomaticImpact: 5,
    culturalAssimilationRate: 3,  // Overwhelmed integration systems
    immigrationRate: 10,         // 10M per turn
    intelCostPerTurn: 2,         // Minimal bureaucracy
  },

  cultural_exchange: {
    type: 'cultural_exchange',
    stabilityModifier: 0,
    economicGrowth: 5,
    diplomaticImpact: 15,        // +15 reputation (cultural openness)
    culturalAssimilationRate: 15, // Mutual cultural adaptation
    immigrationRate: 4,          // 4M per turn
    intelCostPerTurn: 12,
  },

  brain_drain_ops: {
    type: 'brain_drain_ops',
    stabilityModifier: -5,       // Some social disruption
    economicGrowth: 20,          // +20% boost from elite talent
    diplomaticImpact: -15,       // -15 reputation (aggressive poaching)
    culturalAssimilationRate: 12,
    immigrationRate: 3,          // 3M per turn (but high-skill)
    intelCostPerTurn: 25,        // Very expensive recruitment campaigns
  },
};

// ============================================================================
// POP SYSTEM LOGIC
// ============================================================================

export class PopManager {
  /**
   * Calculate total population from pop groups
   */
  static getTotalPopulation(popGroups: PopGroup[]): number {
    return popGroups.reduce((sum, pop) => sum + pop.size, 0);
  }

  /**
   * Calculate average loyalty across all pops
   */
  static getAverageLoyalty(popGroups: PopGroup[]): number {
    if (popGroups.length === 0) return 100;
    const totalPop = this.getTotalPopulation(popGroups);
    const weightedLoyalty = popGroups.reduce(
      (sum, pop) => sum + (pop.loyalty * pop.size),
      0
    );
    return weightedLoyalty / totalPop;
  }

  /**
   * Calculate productivity modifier based on pop composition
   */
  static getProductivityModifier(popGroups: PopGroup[]): number {
    let modifier = 1.0;

    for (const pop of popGroups) {
      const loyaltyFactor = pop.loyalty / 100;
      const happinessFactor = pop.happiness / 100;
      const skillMultiplier =
        pop.skills === 'high' ? 1.5 :
        pop.skills === 'medium' ? 1.0 :
        0.7;

      const popContribution =
        (pop.size / this.getTotalPopulation(popGroups)) *
        loyaltyFactor *
        happinessFactor *
        skillMultiplier;

      modifier += popContribution - (pop.size / this.getTotalPopulation(popGroups));
    }

    return Math.max(0.5, Math.min(2.0, modifier)); // Clamp between 50% and 200%
  }

  /**
   * Process assimilation for all pop groups
   */
  static processAssimilation(
    popGroups: PopGroup[],
    assimilationRate: number,
    nationalCulture: string
  ): void {
    for (const pop of popGroups) {
      if (pop.assimilation < 100) {
        // Base assimilation
        pop.assimilation += assimilationRate;

        // Bonus if origin culture is similar
        if (this.areCulturesSimilar(pop.culture, nationalCulture)) {
          pop.assimilation += 2;
        }

        // Time-based bonus (longer residence = faster assimilation)
        pop.assimilation += Math.min(pop.yearsSinceArrival * 0.5, 5);

        // Cap at 100
        pop.assimilation = Math.min(100, pop.assimilation);

        // Loyalty increases with assimilation
        if (pop.assimilation > pop.loyalty) {
          pop.loyalty += (pop.assimilation - pop.loyalty) * 0.1;
        }
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
    return {
      id: `pop_${Date.now()}_${Math.random()}`,
      size,
      origin,
      loyalty: 30 + Math.random() * 20, // 30-50 initial loyalty
      culture: originCulture,
      skills,
      assimilation: 10, // Low initial assimilation
      happiness: 60 + Math.random() * 20, // 60-80 (hopeful immigrants)
      yearsSinceArrival: 0,
    };
  }

  /**
   * Check if cultures are similar (for assimilation bonuses)
   */
  static areCulturesSimilar(culture1: string, culture2: string): boolean {
    // Simple implementation - can be expanded with cultural family trees
    const culturalFamilies: Record<string, string[]> = {
      western: ['USA', 'UK', 'France', 'Germany'],
      eastern: ['China', 'Japan', 'Korea'],
      slavic: ['Russia', 'Ukraine', 'Poland'],
      // ... etc
    };

    for (const family of Object.values(culturalFamilies)) {
      if (family.includes(culture1) && family.includes(culture2)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate instability from pop discontent
   */
  static getInstabilityFromPops(popGroups: PopGroup[]): number {
    let instability = 0;
    const totalPop = this.getTotalPopulation(popGroups);

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

    return instability;
  }
}

// ============================================================================
// CULTURAL WARFARE LOGIC
// ============================================================================

export class CulturalWarfareManager {
  /**
   * Start a propaganda campaign
   */
  static startPropagandaCampaign(
    attacker: string,
    target: string,
    type: PropagandaCampaign['type'],
    investment: number
  ): PropagandaCampaign {
    return {
      id: `campaign_${Date.now()}_${Math.random()}`,
      targetNation: target,
      type,
      investment,
      duration: this.calculateCampaignDuration(type, investment),
      effectiveness: this.calculateEffectiveness(type, investment),
      discovered: false,
      counterMeasures: 0,
    };
  }

  /**
   * Calculate campaign duration based on type and investment
   */
  static calculateCampaignDuration(
    type: PropagandaCampaign['type'],
    investment: number
  ): number {
    const baseDuration = {
      subversion: 5,
      attraction: 4,
      demoralization: 3,
      conversion: 6,
    };

    // Higher investment = faster campaign
    const speedup = Math.floor(investment / 10);
    return Math.max(1, baseDuration[type] - speedup);
  }

  /**
   * Calculate effectiveness (success chance)
   */
  static calculateEffectiveness(
    type: PropagandaCampaign['type'],
    investment: number
  ): number {
    const baseChance = {
      subversion: 0.4,
      attraction: 0.6,
      demoralization: 0.5,
      conversion: 0.3,
    };

    // Higher investment = better chance
    const bonus = Math.min(0.3, investment / 100);
    return Math.min(0.95, baseChance[type] + bonus);
  }

  /**
   * Check if campaign is discovered
   */
  static checkDiscovery(
    campaign: PropagandaCampaign,
    targetIntel: number,
    targetCounterIntel: number
  ): boolean {
    if (campaign.discovered) return true;

    const baseDiscoveryChance = 0.1;
    const intelBonus = targetIntel / 200; // Max +0.5
    const counterIntelBonus = targetCounterIntel / 100; // Max +1.0

    const totalChance = baseDiscoveryChance + intelBonus + counterIntelBonus;

    return Math.random() < totalChance;
  }

  /**
   * Execute campaign when duration reaches 0
   */
  static executeCampaign(
    campaign: PropagandaCampaign,
    attacker: { popGroups: PopGroup[]; culturalPower: number },
    target: { popGroups: PopGroup[]; instability: number; culturalPower: number }
  ): { success: boolean; effect: string } {
    // Roll for success
    const roll = Math.random();
    const successThreshold = campaign.effectiveness - (campaign.counterMeasures / 100);

    if (roll > successThreshold) {
      return { success: false, effect: 'Campaign failed to achieve objectives' };
    }

    // Apply effects based on type
    switch (campaign.type) {
      case 'subversion':
        target.instability += 15 + Math.random() * 10;
        return { success: true, effect: 'Target nation destabilized' };

      case 'attraction':
        // Convert 5-10% of target's least loyal pop
        const leastLoyal = target.popGroups.sort((a, b) => a.loyalty - b.loyalty)[0];
        if (leastLoyal) {
          const convertSize = Math.floor(leastLoyal.size * (0.05 + Math.random() * 0.05));
          leastLoyal.size -= convertSize;
          attacker.popGroups.push(
            PopManager.createImmigrantPop(convertSize, leastLoyal.origin, leastLoyal.culture, leastLoyal.skills)
          );
          return { success: true, effect: `${convertSize}M population attracted from target` };
        }
        break;

      case 'demoralization':
        // Reduce all pop happiness
        target.popGroups.forEach(pop => {
          pop.happiness = Math.max(0, pop.happiness - 20);
        });
        return { success: true, effect: 'Target population demoralized' };

      case 'conversion':
        // Convert cultural identity
        const culturalGain = 10 + Math.random() * 15;
        attacker.culturalPower += culturalGain;
        target.culturalPower = Math.max(0, target.culturalPower - culturalGain);
        return { success: true, effect: `Cultural influence increased by ${culturalGain}` };
    }

    return { success: false, effect: 'Unknown campaign type' };
  }
}

// ============================================================================
// CULTURAL INFLUENCE SYSTEM
// ============================================================================

export class CulturalInfluenceManager {
  /**
   * Calculate cultural influence growth between two nations
   */
  static calculateInfluenceGrowth(
    source: {
      intel: number;
      population: number;
      culturalPower: number;
      researched?: Record<string, boolean>;
    },
    target: {
      culturalPower: number;
      popGroups: PopGroup[];
    },
    areAllies: boolean,
    areNeighbors: boolean
  ): number {
    let growth = 0;

    // Base growth from cultural power
    growth += source.culturalPower / 20;

    // Intel bonus
    growth += source.intel / 50;

    // Population mass (larger nations have more influence)
    growth += source.population / 100;

    // Alliance bonus
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

    // Resistance from target's cultural power
    const resistance = target.culturalPower / 50;
    growth = Math.max(0, growth - resistance);

    return growth;
  }

  /**
   * Apply cultural influence to target nation's pops
   */
  static applyCulturalInfluence(
    influence: CulturalInfluence,
    targetPops: PopGroup[],
    sourceCulture: string
  ): void {
    // Influence affects pop loyalty and happiness
    const influenceFactor = influence.strength / 100;

    for (const pop of targetPops) {
      if (pop.culture !== sourceCulture) {
        // Reduce loyalty to current nation
        pop.loyalty = Math.max(0, pop.loyalty - influenceFactor * 2);

        // Cultural confusion reduces happiness
        if (influence.strength > 50) {
          pop.happiness = Math.max(0, pop.happiness - influenceFactor);
        }
      } else {
        // Strengthen loyalty of pops with source culture
        pop.loyalty = Math.min(100, pop.loyalty + influenceFactor);
      }
    }
  }

  /**
   * Check for cultural victory condition
   */
  static checkCulturalVictory(
    nation: {
      culturalPower: number;
      culturalInfluences: CulturalInfluence[];
    },
    allNations: string[]
  ): boolean {
    // Must have >100 cultural power
    if (nation.culturalPower < 100) return false;

    // Must have dominant influence in >50% of nations
    const dominantInfluences = nation.culturalInfluences.filter(
      inf => inf.strength > 70
    );

    return dominantInfluences.length > allNations.length / 2;
  }
}

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

export function exampleUsage() {
  // Create a nation with diverse pop groups
  const nation = {
    id: 'USA',
    name: 'United States',
    culturalIdentity: 'American',
    culturalPower: 75,
    currentPolicy: IMMIGRATION_POLICIES.selective,
    popGroups: [
      {
        id: 'native_1',
        size: 250,
        origin: 'USA',
        loyalty: 85,
        culture: 'American',
        skills: 'medium' as SkillLevel,
        assimilation: 100,
        happiness: 75,
        yearsSinceArrival: 100,
      },
      PopManager.createImmigrantPop(20, 'Mexico', 'Mexican', 'low'),
      PopManager.createImmigrantPop(15, 'China', 'Chinese', 'high'),
      PopManager.createImmigrantPop(10, 'India', 'Indian', 'high'),
    ],
  };

  // Calculate current state
  console.log('Total Population:', PopManager.getTotalPopulation(nation.popGroups));
  console.log('Average Loyalty:', PopManager.getAverageLoyalty(nation.popGroups).toFixed(1));
  console.log('Productivity Modifier:', PopManager.getProductivityModifier(nation.popGroups).toFixed(2));
  console.log('Instability from Pops:', PopManager.getInstabilityFromPops(nation.popGroups).toFixed(1));

  // Process a turn
  PopManager.processAssimilation(nation.popGroups, nation.currentPolicy.culturalAssimilationRate, nation.culturalIdentity);

  console.log('\nAfter 1 turn of assimilation:');
  nation.popGroups.forEach(pop => {
    if (pop.origin !== 'USA') {
      console.log(`- ${pop.origin} pop: Loyalty=${pop.loyalty.toFixed(1)}, Assimilation=${pop.assimilation.toFixed(1)}`);
    }
  });

  // Start a propaganda campaign
  const campaign = CulturalWarfareManager.startPropagandaCampaign(
    'USA',
    'Russia',
    'attraction',
    50 // investment
  );

  console.log('\nPropaganda Campaign Started:');
  console.log(`- Type: ${campaign.type}`);
  console.log(`- Duration: ${campaign.duration} turns`);
  console.log(`- Success chance: ${(campaign.effectiveness * 100).toFixed(0)}%`);
}
