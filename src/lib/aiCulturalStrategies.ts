/**
 * AI CULTURAL STRATEGIES
 * Strategic personalities and decision-making for immigration & culture warfare
 */

import type { Nation, GameState } from '../types/game';
import type { PropagandaCampaignType } from '../types/culturalWarfare';
import type { ImmigrationPolicyType } from '../types/popSystem';
import { CulturalWarfareManager } from './culturalWarfareManager';
import { CulturalInfluenceManager } from './culturalInfluenceManager';
import { PopSystemManager } from './popSystemManager';
import { executeAdvancedPropagandaStrategy } from './aiAdvancedPropagandaStrategies';

export type CulturalStrategyType =
  | 'hegemonic_assimilation'    // Aggressive cultural expansion
  | 'defensive_preservation'     // Protect cultural identity
  | 'opportunistic_brain_drain'  // Target high-skill pops
  | 'diplomatic_soft_power'      // Cultural exchange focus
  | 'isolationist';              // Minimal engagement

export interface CulturalStrategy {
  name: CulturalStrategyType;
  priority: number;
  selectImmigrationPolicy: (nation: Nation, gameState: { nations: Nation[] }) => ImmigrationPolicyType;
  evaluateTarget: (nation: Nation, target: Nation, gameState: { nations: Nation[] }) => number;
  decideCampaign: (nation: Nation, targets: Nation[]) => { target: Nation; type: PropagandaCampaignType; investment: number } | null;
}

/**
 * Hegemonic Assimilation Strategy
 * Focuses on cultural domination and population attraction
 */
const HEGEMONIC_ASSIMILATION: CulturalStrategy = {
  name: 'hegemonic_assimilation',
  priority: 90,

  selectImmigrationPolicy(nation, gameState) {
    const culturalPower = nation.culturalPower || 0;
    const instability = nation.instability || 0;

    // High cultural power + stable = open borders
    if (culturalPower > 70 && instability < 30) {
      return 'cultural_exchange';
    }

    // Medium power = selective
    if (culturalPower > 40) {
      return 'selective';
    }

    // Low power = brain drain to build up
    return 'brain_drain_ops';
  },

  evaluateTarget(nation, target, gameState) {
    let score = 0;

    // Prefer weak cultural power
    const targetCulturalPower = target.culturalPower || 0;
    if (targetCulturalPower < 40) score += 30;

    // Prefer neighbors
    if (CulturalInfluenceManager['areNeighbors'](nation, target)) {
      score += 20;
    }

    // Prefer large population
    const targetPop = target.popGroups
      ? PopSystemManager.getTotalPopulation(target.popGroups)
      : target.population;
    if (targetPop > 50) score += 15;

    // Avoid allies
    if (nation.treaties?.[target.id]?.alliance) {
      score -= 50;
    }

    return score;
  },

  decideCampaign(nation, targets) {
    // Only if we have enough intel and cultural power
    if (nation.intel < 30 || (nation.culturalPower || 0) < 50) {
      return null;
    }

    // Find best target
    const scored = targets
      .filter(t => !t.eliminated && t.id !== nation.id)
      .map(t => ({
        target: t,
        score: this.evaluateTarget(nation, t, { nations: targets }),
      }))
      .sort((a, b) => b.score - a.score);

    if (scored.length === 0 || scored[0].score < 20) {
      return null;
    }

    const target = scored[0].target;
    const type: PropagandaCampaignType = 'conversion'; // Focus on cultural dominance
    const investment = Math.min(20, Math.floor(nation.intel / 3));

    return { target, type, investment };
  },
};

/**
 * Defensive Preservation Strategy
 * Protects cultural identity and resists foreign influence
 */
const DEFENSIVE_PRESERVATION: CulturalStrategy = {
  name: 'defensive_preservation',
  priority: 80,

  selectImmigrationPolicy(nation, gameState) {
    const instability = nation.instability || 0;
    const avgLoyalty = nation.popGroups
      ? PopSystemManager.getAverageLoyalty(nation.popGroups)
      : 100;

    // High instability or low loyalty = close borders
    if (instability > 40 || avgLoyalty < 60) {
      return 'closed_borders';
    }

    // Medium instability = selective
    if (instability > 25) {
      return 'selective';
    }

    // Otherwise cultural exchange for soft power
    return 'cultural_exchange';
  },

  evaluateTarget(nation, target, gameState) {
    let score = 0;

    // Identify threats (nations with campaigns against us)
    const campaigns = CulturalWarfareManager.findCampaignsTargeting(nation.id, gameState.nations);
    const isThreat = campaigns.some(c => c.source.id === target.id);

    if (isThreat) {
      score += 50; // High priority to counter threats
    }

    return score;
  },

  decideCampaign(nation, targets) {
    // Only defensive counter-campaigns
    const campaigns = CulturalWarfareManager.findCampaignsTargeting(nation.id, targets);

    if (campaigns.length === 0) {
      return null;
    }

    // Counter the most dangerous campaign source
    const mostDangerous = campaigns
      .filter(c => !c.campaign.discovered)
      .sort((a, b) => b.campaign.investment - a.campaign.investment)[0];

    if (!mostDangerous) return null;

    const target = mostDangerous.source;
    const type: PropagandaCampaignType = 'demoralization';
    const investment = Math.min(15, Math.floor(nation.intel / 4));

    return { target, type, investment };
  },
};

/**
 * Opportunistic Brain Drain Strategy
 * Targets high-skill populations from unstable nations
 */
const OPPORTUNISTIC_BRAIN_DRAIN: CulturalStrategy = {
  name: 'opportunistic_brain_drain',
  priority: 70,

  selectImmigrationPolicy(nation, gameState) {
    // Always brain drain ops if we can afford it
    if (nation.intel > 50) {
      return 'brain_drain_ops';
    }

    // Otherwise selective
    return 'selective';
  },

  evaluateTarget(nation, target, gameState) {
    let score = 0;

    // Prefer unstable nations (easier to attract their talent)
    const instability = target.instability || 0;
    if (instability > 50) score += 40;
    else if (instability > 30) score += 20;

    // Prefer nations with high-skill pops
    if (target.popGroups) {
      const skillDist = PopSystemManager.getSkillDistribution(target.popGroups);
      score += skillDist.high; // Add percentage of high-skill pops
    }

    // Avoid allies
    if (nation.treaties?.[target.id]?.alliance) {
      score -= 40;
    }

    return score;
  },

  decideCampaign(nation, targets) {
    if (nation.intel < 25) return null;

    // Find best target for brain drain
    const scored = targets
      .filter(t => !t.eliminated && t.id !== nation.id)
      .map(t => ({
        target: t,
        score: this.evaluateTarget(nation, t, { nations: targets }),
      }))
      .sort((a, b) => b.score - a.score);

    if (scored.length === 0 || scored[0].score < 15) {
      return null;
    }

    const target = scored[0].target;
    const type: PropagandaCampaignType = 'attraction';
    const investment = Math.min(25, Math.floor(nation.intel / 3));

    return { target, type, investment };
  },
};

/**
 * Diplomatic Soft Power Strategy
 * Focuses on cultural exchange and peaceful influence
 */
const DIPLOMATIC_SOFT_POWER: CulturalStrategy = {
  name: 'diplomatic_soft_power',
  priority: 75,

  selectImmigrationPolicy(nation, gameState) {
    // Always cultural exchange
    return 'cultural_exchange';
  },

  evaluateTarget(nation, target, gameState) {
    let score = 0;

    // Prefer allies and friendly nations
    if (nation.treaties?.[target.id]?.alliance) {
      score += 30;
    }

    const relationship = nation.relationships?.[target.id] || 0;
    if (relationship > 50) score += 20;

    return score;
  },

  decideCampaign(nation, targets) {
    // Only peaceful cultural export campaigns
    if (nation.intel < 20 || (nation.culturalPower || 0) < 40) {
      return null;
    }

    // Target allies to strengthen bonds
    const allies = targets.filter(t =>
      !t.eliminated &&
      t.id !== nation.id &&
      nation.treaties?.[t.id]?.alliance
    );

    if (allies.length === 0) return null;

    const target = allies[Math.floor(Math.random() * allies.length)];
    const type: PropagandaCampaignType = 'conversion'; // Peaceful cultural spread
    const investment = Math.min(15, Math.floor(nation.intel / 5));

    return { target, type, investment };
  },
};

/**
 * Isolationist Strategy
 * Minimal immigration, focus on internal development
 */
const ISOLATIONIST: CulturalStrategy = {
  name: 'isolationist',
  priority: 60,

  selectImmigrationPolicy(nation, gameState) {
    return 'closed_borders';
  },

  evaluateTarget(nation, target, gameState) {
    return 0; // Don't target anyone
  },

  decideCampaign(nation, targets) {
    return null; // No campaigns
  },
};

/**
 * All available strategies
 */
export const CULTURAL_STRATEGIES: Record<CulturalStrategyType, CulturalStrategy> = {
  hegemonic_assimilation: HEGEMONIC_ASSIMILATION,
  defensive_preservation: DEFENSIVE_PRESERVATION,
  opportunistic_brain_drain: OPPORTUNISTIC_BRAIN_DRAIN,
  diplomatic_soft_power: DIPLOMATIC_SOFT_POWER,
  isolationist: ISOLATIONIST,
};

/**
 * Select strategy based on AI personality
 */
export function selectCulturalStrategy(nation: Nation): CulturalStrategy {
  const personality = nation.aiPersonality || 'balanced';

  const strategyMap: Record<string, CulturalStrategyType> = {
    aggressive: 'hegemonic_assimilation',
    defensive: 'defensive_preservation',
    trickster: 'opportunistic_brain_drain',
    diplomatic: 'diplomatic_soft_power',
    isolationist: 'isolationist',
    balanced: 'diplomatic_soft_power',
  };

  const strategyType = strategyMap[personality] || 'diplomatic_soft_power';
  return CULTURAL_STRATEGIES[strategyType];
}

/**
 * Execute AI cultural turn
 * @param nation - The AI nation executing its turn
 * @param allNations - All nations in the game
 * @param gameState - Optional game state for advanced propaganda (backwards compatible)
 */
export function executeAICulturalTurn(nation: Nation, allNations: Nation[], gameState?: GameState): void {
  if (nation.isPlayer || nation.eliminated) return;

  const strategy = selectCulturalStrategy(nation);

  // 1. Update immigration policy if needed
  const currentPolicy = nation.currentImmigrationPolicy;
  const recommendedPolicy = strategy.selectImmigrationPolicy(nation, { nations: allNations });

  // Change policy occasionally (not every turn)
  if (currentPolicy !== recommendedPolicy && Math.random() < 0.2) {
    nation.currentImmigrationPolicy = recommendedPolicy;
  }

  // 2. Consider starting a new propaganda campaign
  if (!nation.propagandaCampaigns) {
    nation.propagandaCampaigns = [];
  }

  // Limit to 2 active campaigns max
  if (nation.propagandaCampaigns.length < 2 && Math.random() < 0.15) {
    const decision = strategy.decideCampaign(nation, allNations);

    if (decision) {
      const campaign = CulturalWarfareManager.startPropagandaCampaign(
        nation,
        decision.target.id,
        decision.type,
        decision.investment
      );

      // Deduct intel cost
      nation.intel = Math.max(0, nation.intel - decision.investment);

      nation.propagandaCampaigns.push(campaign);
    }
  }

  // 3. Build cultural wonders if economically strong
  if (
    nation.production > 100 &&
    nation.intel > 60 &&
    (!nation.culturalWonders || nation.culturalWonders.length === 0) &&
    Math.random() < 0.1
  ) {
    // Consider building a wonder
    const wonderType = Math.random() < 0.5 ? 'cultural_academy' : 'world_heritage_sites';
    // This would require importing the wonder creation function
    // For now, just a placeholder
  }

  // 4. Execute advanced propaganda strategies (useful idiots, phobia campaigns, religious weapons)
  if (gameState && gameState.advancedPropaganda) {
    // AI decides on advanced propaganda occasionally (not every turn to limit spam)
    if (Math.random() < 0.3) {
      executeAdvancedPropagandaStrategy(nation, gameState, allNations);
    }
  }
}
