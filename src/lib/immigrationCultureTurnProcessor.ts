/**
 * IMMIGRATION & CULTURE TURN PROCESSOR
 * Processes pop systems, cultural influence, and campaigns each turn
 */

import type { Nation, GameState } from '../types/game';
import { PopSystemManager } from './popSystemManager';
import { CulturalInfluenceManager } from './culturalInfluenceManager';
import { CulturalWarfareManager } from './culturalWarfareManager';
import { IMMIGRATION_POLICIES } from './immigrationPoliciesData';

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
 */
function processImmigrationPolicy(nation: Nation, allNations: Nation[]): void {
  const policyType = nation.currentImmigrationPolicy;
  if (!policyType) return;

  const policy = IMMIGRATION_POLICIES[policyType];

  // Deduct policy costs
  nation.intel = Math.max(0, nation.intel - policy.intelCostPerTurn);
  if (policy.productionCostPerTurn) {
    nation.production = Math.max(0, nation.production - policy.productionCostPerTurn);
  }

  // Apply immigration if policy allows it
  if (policy.immigrationRate > 0) {
    const immigrationAmount = policy.immigrationRate;

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

    // Track for legacy system
    nation.migrantsThisTurn = (nation.migrantsThisTurn || 0) + immigrationAmount;
    nation.migrantsTotal = (nation.migrantsTotal || 0) + immigrationAmount;
  }

  // Apply policy modifiers
  if (policy.stabilityModifier) {
    const stabilityChange = -policy.stabilityModifier; // Positive modifier = reduce instability
    nation.instability = Math.max(0, (nation.instability || 0) + stabilityChange);
  }

  // Apply economic growth modifier
  if (policy.economicGrowth && nation.productionMultiplier) {
    nation.productionMultiplier += policy.economicGrowth / 100;
  }

  // Update assimilation rate
  nation.assimilationRate = (nation.assimilationRate || 5) + policy.culturalAssimilationRate;
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
