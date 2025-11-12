/**
 * STREAMLINED CULTURE LOGIC
 *
 * Game logic for simplified culture system
 * Replaces complex PopGroups management with simple propaganda/wonders/immigration
 */

import type { Nation } from '@/types/game';
import type { PropagandaType, CulturalWonderType, ImmigrationPolicy, SimplifiedPropagandaCampaign } from '@/types/streamlinedCulture';
import {
  PROPAGANDA_DEFINITIONS,
  CULTURAL_WONDERS,
  IMMIGRATION_POLICIES,
  calculateImmigrationBonus,
  executePropagandaCampaign,
  buildCulturalWonder,
  getCulturalWonderBonuses,
} from '@/types/streamlinedCulture';
import { updateRelationship } from '@/lib/unifiedDiplomacyMigration';

/**
 * Launch propaganda campaign
 */
export function launchPropagandaCampaign(
  launcher: Nation,
  target: Nation,
  type: PropagandaType,
  currentTurn: number,
  allNations: Nation[]
): {
  launcher: Nation;
  target: Nation;
  campaign: SimplifiedPropagandaCampaign;
  success: boolean;
  discovered: boolean;
  message: string;
} {
  const campaignDef = PROPAGANDA_DEFINITIONS[type];

  // Check if launcher can afford
  if (launcher.intel < campaignDef.intelCost) {
    return {
      launcher,
      target,
      campaign: null as any,
      success: false,
      discovered: false,
      message: 'Insufficient intel',
    };
  }

  // Deduct cost
  let updatedLauncher: Nation = {
    ...launcher,
    intel: launcher.intel - campaignDef.intelCost,
    propagandaCampaigns: Array.isArray(launcher.propagandaCampaigns)
      ? [...launcher.propagandaCampaigns]
      : [],
  };

  // Execute campaign effects
  const result = executePropagandaCampaign(updatedLauncher, target, type);

  // Create campaign record
  const campaign: SimplifiedPropagandaCampaign = {
    id: `propaganda-${currentTurn}-${launcher.id}-${target.id}-${type}`,
    launcherId: launcher.id,
    targetId: target.id,
    type,
    startTurn: currentTurn,
    duration: campaignDef.duration,
    turnsRemaining: campaignDef.duration,
    intelInvested: campaignDef.intelCost,
    discovered: result.discovered,
    discoveredOnTurn: result.discovered ? currentTurn : undefined,
  };

  // Update relationship if discovered
  let updatedTarget = target;
  if (result.discovered) {
    const { nationA: targetAfterRelationship, nationB: launcherAfterRelationship } = updateRelationship(
      target,
      updatedLauncher,
      -15,
      `Propaganda campaign discovered`,
      currentTurn
    );
    updatedTarget = targetAfterRelationship;
    updatedLauncher = launcherAfterRelationship;
  }

  const launcherCampaigns = Array.isArray(updatedLauncher.propagandaCampaigns)
    ? updatedLauncher.propagandaCampaigns
    : [];

  const launcherWithCampaigns: Nation = {
    ...updatedLauncher,
    propagandaCampaigns: [...launcherCampaigns, campaign],
  };

  const message = result.discovered
    ? `${campaignDef.name} launched against ${target.name} but was DISCOVERED! Effects: ${result.effects.join(', ')}`
    : `${campaignDef.name} successfully launched against ${target.name}. Effects: ${result.effects.join(', ')}`;

  return {
    launcher: launcherWithCampaigns,
    target: updatedTarget,
    campaign,
    success: true,
    discovered: result.discovered,
    message,
  };
}

/**
 * Build cultural wonder
 */
export function buildWonder(
  nation: Nation,
  wonderType: CulturalWonderType,
  currentTurn: number
): {
  nation: Nation;
  success: boolean;
  message: string;
} {
  const wonder = CULTURAL_WONDERS[wonderType];

  // Check if already built
  if (nation.culturalWonders?.some((w: any) => w.type === wonderType)) {
    return {
      nation,
      success: false,
      message: `${wonder.name} already built`,
    };
  }

  // Check costs
  if (nation.production < wonder.buildCost.production) {
    return {
      nation,
      success: false,
      message: `Insufficient production (need ${wonder.buildCost.production})`,
    };
  }

  if (nation.intel < wonder.buildCost.intel) {
    return {
      nation,
      success: false,
      message: `Insufficient intel (need ${wonder.buildCost.intel})`,
    };
  }

  // Build wonder
  const updatedNation = {
    ...nation,
    production: nation.production - wonder.buildCost.production,
    intel: nation.intel - wonder.buildCost.intel,
    culturalWonders: [
      ...(nation.culturalWonders || []),
      {
        type: wonderType,
        name: wonder.name,
        builtTurn: currentTurn,
      },
    ],
  };

  return {
    nation: updatedNation,
    success: true,
    message: `${wonder.name} completed! Bonuses: +${wonder.productionBonus} Production, +${wonder.intelBonus} Intel, +${wonder.culturalPowerBonus} Cultural Power`,
  };
}

/**
 * Apply immigration policy effects
 */
export function applyImmigrationPolicy(
  nation: Nation,
  policy: ImmigrationPolicy
): Nation {
  const policyDef = IMMIGRATION_POLICIES[policy];
  const immigrationBonus = calculateImmigrationBonus(nation, policy);

  return {
    ...nation,
    population: nation.population + immigrationBonus,
    instability: Math.max(0, Math.min(100, (nation.instability || 0) + policyDef.instabilityModifier)),
    immigrationPolicy: policy,
  };
}

/**
 * Process turn for all propaganda campaigns
 */
export function processPropagandaCampaigns(
  nations: Nation[],
  activeCampaigns: SimplifiedPropagandaCampaign[],
  currentTurn: number
): {
  nations: Nation[];
  campaigns: SimplifiedPropagandaCampaign[];
  messages: string[];
} {
  const messages: string[] = [];
  const updatedCampaigns: SimplifiedPropagandaCampaign[] = [];
  let updatedNations = [...nations];

  for (const campaign of activeCampaigns) {
    if (campaign.turnsRemaining <= 0) {
      messages.push(`Propaganda campaign against ${nations.find(n => n.id === campaign.targetId)?.name} has ended`);
      continue;
    }

    // Decrement turn counter
    const updatedCampaign = {
      ...campaign,
      turnsRemaining: campaign.turnsRemaining - 1,
    };

    // Apply ongoing effects
    const target = updatedNations.find(n => n.id === campaign.targetId);
    const launcher = updatedNations.find(n => n.id === campaign.launcherId);

    if (target && launcher) {
      const campaignDef = PROPAGANDA_DEFINITIONS[campaign.type];

      // Apply effects (simplified - just apply once per turn)
      if (campaignDef.effects.instabilityIncrease) {
        updatedNations = updatedNations.map(n =>
          n.id === target.id
            ? {
                ...n,
                instability: Math.min(100, (n.instability || 0) + campaignDef.effects.instabilityIncrease / campaign.duration),
              }
            : n
        );
      }

      if (campaignDef.effects.moraleReduction) {
        updatedNations = updatedNations.map(n =>
          n.id === target.id
            ? {
                ...n,
                morale: Math.max(0, n.morale - campaignDef.effects.moraleReduction / campaign.duration),
              }
            : n
        );
      }
    }

    if (updatedCampaign.turnsRemaining > 0) {
      updatedCampaigns.push(updatedCampaign);
    }
  }

  return {
    nations: updatedNations,
    campaigns: updatedCampaigns,
    messages,
  };
}

/**
 * Apply cultural wonder bonuses during resource generation
 */
export function applyWonderBonuses(nation: Nation): {
  productionBonus: number;
  intelBonus: number;
} {
  const bonuses = getCulturalWonderBonuses(nation);
  return {
    productionBonus: bonuses.production,
    intelBonus: bonuses.intel,
  };
}

/**
 * Check if nation can afford propaganda campaign
 */
export function canAffordPropaganda(
  nation: Nation,
  type: PropagandaType
): { canAfford: boolean; reason?: string } {
  const campaignDef = PROPAGANDA_DEFINITIONS[type];

  if (nation.intel < campaignDef.intelCost) {
    return {
      canAfford: false,
      reason: `Insufficient intel (need ${campaignDef.intelCost})`,
    };
  }

  return { canAfford: true };
}

/**
 * Check if nation can afford wonder
 */
export function canAffordWonder(
  nation: Nation,
  wonderType: CulturalWonderType
): { canAfford: boolean; reason?: string } {
  const wonder = CULTURAL_WONDERS[wonderType];

  // Check if already built
  if (nation.culturalWonders?.some((w: any) => w.type === wonderType)) {
    return { canAfford: false, reason: 'Already built' };
  }

  if (nation.production < wonder.buildCost.production) {
    return {
      canAfford: false,
      reason: `Insufficient production (need ${wonder.buildCost.production})`,
    };
  }

  if (nation.intel < wonder.buildCost.intel) {
    return {
      canAfford: false,
      reason: `Insufficient intel (need ${wonder.buildCost.intel})`,
    };
  }

  return { canAfford: true };
}

/**
 * Get recommended immigration policy based on nation state
 */
export function getRecommendedImmigrationPolicy(nation: Nation): ImmigrationPolicy {
  const instability = nation.instability || 0;
  const population = nation.population;

  // If high instability, recommend closed borders
  if (instability > 60) {
    return 'closed';
  }

  // If low population and low instability, recommend open borders
  if (population < 50 && instability < 30) {
    return 'open';
  }

  // Default to restricted
  return 'restricted';
}
