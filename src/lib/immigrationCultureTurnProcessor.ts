/**
 * IMMIGRATION & CULTURE TURN PROCESSOR
 * Processes pop systems, cultural influence, and campaigns each turn
 */

import type { Nation, GameState } from '../types/game';
import { PopSystemManager } from './popSystemManager';
import { CulturalInfluenceManager } from './culturalInfluenceManager';
import { CulturalWarfareManager } from './culturalWarfareManager';
import { IMMIGRATION_POLICIES, applyImmigrationPolicyEffects } from '../types/streamlinedCulture';

/**
 * Initialize nation with pop system (one-time migration from old system)
 */
export function initializeNationPopSystem(nation: Nation): void {
  // Skip if already initialized
  if (nation.popGroups && nation.popGroups.length > 0) return;

  // Initialize cultural identity
  if (!nation.culturalIdentity) {
    nation.culturalIdentity = nation.name;
  }

  // Initialize cultural power based on nation size and intel
  if (nation.culturalPower === undefined) {
    nation.culturalPower = 50 + Math.floor(nation.intel / 10) + Math.floor(nation.population / 10);
    nation.culturalPower = Math.min(100, nation.culturalPower);
  }

  // Initialize assimilation rate
  if (nation.assimilationRate === undefined) {
    nation.assimilationRate = 5; // Base 5 per turn
  }

  // Initialize immigration policy (default to selective for most, closed for isolationist)
  if (!nation.currentImmigrationPolicy) {
    if (nation.bordersClosedTurns && nation.bordersClosedTurns > 0) {
      nation.currentImmigrationPolicy = 'closed_borders';
    } else {
      nation.currentImmigrationPolicy = 'selective';
    }
  }

  // Migrate old policy names to new format
  if (nation.currentImmigrationPolicy === 'closed' as any) {
    nation.currentImmigrationPolicy = 'closed_borders';
  } else if (nation.currentImmigrationPolicy === 'restricted' as any) {
    nation.currentImmigrationPolicy = 'selective';
  } else if (nation.currentImmigrationPolicy === 'open' as any) {
    nation.currentImmigrationPolicy = 'open_borders';
  }

  // Create initial pop groups from existing population
  nation.popGroups = PopSystemManager.initializePopGroups(
    nation.population,
    nation.name,
    nation.culturalIdentity
  );

  // Initialize empty arrays
  if (!nation.culturalInfluences) {
    nation.culturalInfluences = [];
  }
  if (!nation.propagandaCampaigns) {
    nation.propagandaCampaigns = [];
  }
  if (!nation.culturalWonders) {
    nation.culturalWonders = [];
  }
  if (!nation.activeCulturalDefenses) {
    nation.activeCulturalDefenses = [];
  }
}

/**
 * Process immigration and culture systems for all nations (called each turn)
 */
export function processImmigrationAndCultureTurn(
  nations: Nation[],
  gameState: GameState
): void {
  // Initialize any nations that don't have pop systems yet
  for (const nation of nations) {
    if (!nation.eliminated) {
      initializeNationPopSystem(nation);
    }
  }

  // Process each nation
  for (const nation of nations) {
    if (nation.eliminated) continue;

    // 1. Process immigration based on current policy
    processImmigrationPolicy(nation, nations);

    // 2. Process pop assimilation
    if (nation.popGroups) {
      const assimilationRate = calculateTotalAssimilationRate(nation);
      PopSystemManager.processAssimilation(
        nation.popGroups,
        assimilationRate,
        nation.culturalIdentity || nation.name
      );
    }

    // 3. Update cultural influences
    CulturalInfluenceManager.updateCulturalInfluences(
      nation,
      nations,
      gameState.turn
    );

    // 4. Process propaganda campaigns
    const campaignOutcomes = CulturalWarfareManager.processCampaigns(
      nation,
      nations,
      gameState.turn
    );

    // Log campaign outcomes (could trigger UI notifications)
    for (const outcome of campaignOutcomes) {
      if (nation.isPlayer || outcome.success) {
        console.log(`[${nation.name}] ${outcome.effect}`);
      }
    }

    // 5. Process cultural wonders under construction
    if (nation.culturalWonders) {
      for (const wonder of nation.culturalWonders) {
        if (!wonder.completed && wonder.turnsRemaining !== undefined) {
          wonder.turnsRemaining -= 1;
          if (wonder.turnsRemaining <= 0) {
            wonder.completed = true;
            console.log(`[${nation.name}] Completed ${wonder.name}!`);
          }
        }
      }
    }

    // 6. Apply productivity modifiers from pops
    if (nation.popGroups) {
      const productivityModifier = PopSystemManager.getProductivityModifier(nation.popGroups);

      // Apply to production
      if (nation.productionMultiplier) {
        nation.productionMultiplier *= productivityModifier;
      } else {
        nation.productionMultiplier = productivityModifier;
      }

      // Add instability from unhappy/disloyal pops
      const popInstability = PopSystemManager.getInstabilityFromPops(nation.popGroups);
      nation.instability = (nation.instability || 0) + popInstability * 0.1; // Scale down impact
    }

    // 7. Update population number (for backward compatibility)
    if (nation.popGroups) {
      nation.population = PopSystemManager.getTotalPopulation(nation.popGroups);
    }
  }
}

/**
 * Process immigration for a nation based on their current policy
 * Now uses strategic warfare-oriented immigration system
 */
function processImmigrationPolicy(nation: Nation, allNations: Nation[]): void {
  const policyType = nation.currentImmigrationPolicy;
  if (!policyType) return;

  const policy = IMMIGRATION_POLICIES[policyType];
  if (!policy) return;

  // Apply all policy effects using the streamlined system
  const effects = applyImmigrationPolicyEffects(nation, policyType);

  // Deduct costs
  nation.intel = Math.max(0, nation.intel - effects.intelCost);
  if (effects.productionCost > 0) {
    nation.production = Math.max(0, nation.production - effects.productionCost);
  }

  // Apply production bonus from economic growth
  if (effects.productionBonus !== 0) {
    nation.production = Math.max(0, nation.production + effects.productionBonus);
  }

  // Apply instability change
  if (effects.instabilityChange !== 0) {
    nation.instability = Math.max(0, (nation.instability || 0) + effects.instabilityChange);
  }

  // Apply population gain
  if (effects.populationGain > 0) {
    // populationGain is already in millions, no conversion needed
    const immigrationAmount = Math.round(effects.populationGain);

    // Determine skill distribution based on policy
    let skillLevel: import('../types/popSystem').SkillLevel = 'medium';
    if (policyType === 'selective' || policyType === 'brain_drain_ops') {
      skillLevel = 'high';
    } else if (policyType === 'humanitarian') {
      skillLevel = 'low';
    } else if (policyType === 'open_borders') {
      // Mixed - randomize
      const rand = Math.random();
      skillLevel = rand < 0.2 ? 'high' : rand < 0.6 ? 'medium' : 'low';
    }

    // Create new immigrant pop
    if (nation.popGroups) {
      const newPop = PopSystemManager.createImmigrantPop(
        immigrationAmount,
        'Mixed Origins',
        'Mixed',
        skillLevel
      );
      nation.popGroups.push(newPop);
    }

    // Track for legacy system (converted to individual count for backwards compatibility)
    const actualPopulationCount = Math.round(immigrationAmount * 1000000);
    nation.migrantsThisTurn = (nation.migrantsThisTurn || 0) + actualPopulationCount;
    nation.migrantsTotal = (nation.migrantsTotal || 0) + actualPopulationCount;
  }

  // Apply diplomatic impact to all other nations
  if (policy.diplomaticImpact !== 0) {
    for (const otherNation of allNations) {
      if (otherNation.id === nation.id || otherNation.eliminated) continue;

      // Initialize relationships if needed
      if (!otherNation.relationships) {
        otherNation.relationships = {};
      }

      // Apply diplomatic modifier (scaled by 0.5 for balance)
      const currentRelationship = otherNation.relationships[nation.id] || 0;
      otherNation.relationships[nation.id] = Math.max(
        -100,
        Math.min(100, currentRelationship + policy.diplomaticImpact * 0.5)
      );
    }
  }

  // Brain Drain Operations - actively damage specific nations
  if (policyType === 'brain_drain_ops') {
    // Target the weakest or most vulnerable nations
    const targetNations = allNations
      .filter(n => !n.eliminated && n.id !== nation.id)
      .sort((a, b) => (a.instability || 0) - (b.instability || 0))
      .slice(0, 2); // Target top 2 unstable nations

    for (const target of targetNations) {
      // Steal small amount of population (brain drain)
      const stolenPop = Math.floor(target.population * 0.002); // 0.2% of population
      if (stolenPop > 0 && target.population > stolenPop) {
        target.population -= stolenPop;

        // Add to attacker as high-skill immigrant
        if (nation.popGroups) {
          const brainDrainPop = PopSystemManager.createImmigrantPop(
            stolenPop,
            target.name,
            target.culturalIdentity || target.name,
            'high'
          );
          nation.popGroups.push(brainDrainPop);
        }

        // Damage relationship significantly
        if (target.relationships) {
          target.relationships[nation.id] = Math.max(
            -100,
            (target.relationships[nation.id] || 0) - 10
          );
        }
      }
    }
  }
}

/**
 * Calculate total assimilation rate including bonuses
 */
function calculateTotalAssimilationRate(nation: Nation): number {
  let rate = nation.assimilationRate || 5;

  // Bonuses from research
  if (nation.researched?.culture_influence) {
    rate += 2;
  }

  // Bonuses from cultural wonders
  if (nation.culturalWonders) {
    for (const wonder of nation.culturalWonders) {
      if (wonder.completed) {
        rate += wonder.effects.assimilationRateBonus / 10; // Scale down
      }
    }
  }

  return rate;
}

/**
 * Check victory conditions related to culture/population
 */
export function checkCulturalVictoryConditions(
  nation: Nation,
  allNations: Nation[]
): {
  culturalVictory: boolean;
  demographicVictory: boolean;
  demographicProgress?: ReturnType<typeof CulturalInfluenceManager.checkDemographicVictory>;
} {
  const culturalVictory = CulturalInfluenceManager.checkCulturalVictory(
    nation,
    allNations
  );

  const demographicProgress = CulturalInfluenceManager.checkDemographicVictory(
    nation,
    allNations
  );

  return {
    culturalVictory,
    demographicVictory: demographicProgress.achieved,
    demographicProgress,
  };
}
