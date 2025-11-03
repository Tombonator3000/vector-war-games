/**
 * CULTURAL WARFARE MANAGER
 * Multi-turn propaganda campaigns and cultural operations
 */

import type { Nation } from '../types/game';
import type {
  PropagandaCampaign,
  PropagandaCampaignType,
  OperationOutcome,
} from '../types/culturalWarfare';
import { PopSystemManager } from './popSystemManager';

export class CulturalWarfareManager {
  /**
   * Start a propaganda campaign
   */
  static startPropagandaCampaign(
    sourceNation: Nation,
    targetNationId: string,
    type: PropagandaCampaignType,
    investment: number
  ): PropagandaCampaign {
    const duration = this.calculateCampaignDuration(type, investment);
    const effectiveness = this.calculateEffectiveness(type, investment);

    const campaign: PropagandaCampaign = {
      id: `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sourceNation: sourceNation.id,
      targetNation: targetNationId,
      type,
      investment,
      turnsRemaining: duration,
      totalDuration: duration,
      effectiveness,
      discovered: false,
      counterMeasures: 0,
      startedAt: 0, // Will be set by caller
    };

    return campaign;
  }

  /**
   * Calculate campaign duration based on type and investment
   */
  static calculateCampaignDuration(
    type: PropagandaCampaignType,
    investment: number
  ): number {
    const baseDuration = {
      subversion: 5,
      attraction: 4,
      demoralization: 3,
      conversion: 6,
    };

    // Higher investment = faster campaign
    const speedup = Math.floor(investment / 15);
    return Math.max(2, baseDuration[type] - speedup);
  }

  /**
   * Calculate effectiveness (success chance)
   */
  static calculateEffectiveness(
    type: PropagandaCampaignType,
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
   * Check if campaign is discovered this turn
   */
  static checkDiscovery(
    campaign: PropagandaCampaign,
    targetNation: Nation
  ): boolean {
    if (campaign.discovered) return true;

    const baseDiscoveryChance = 0.1;
    const intelBonus = (targetNation.intel || 0) / 200; // Max +0.5
    const cyberBonus = (targetNation.cyber?.detection || 0) / 200; // Max +0.5
    const hasCounterIntel = targetNation.researched?.cyber_intrusion_detection ? 0.2 : 0;

    const totalChance = baseDiscoveryChance + intelBonus + cyberBonus + hasCounterIntel;

    return Math.random() < totalChance;
  }

  /**
   * Process active campaigns (called each turn)
   */
  static processCampaigns(
    nation: Nation,
    allNations: Nation[],
    currentTurn: number
  ): OperationOutcome[] {
    if (!nation.propagandaCampaigns) {
      nation.propagandaCampaigns = [];
    }

    const outcomes: OperationOutcome[] = [];

    // Process each campaign
    for (let i = nation.propagandaCampaigns.length - 1; i >= 0; i--) {
      const campaign = nation.propagandaCampaigns[i];
      const target = allNations.find(n => n.id === campaign.targetNation);

      if (!target) {
        // Target eliminated, cancel campaign
        nation.propagandaCampaigns.splice(i, 1);
        continue;
      }

      // Check for discovery
      if (!campaign.discovered && this.checkDiscovery(campaign, target)) {
        campaign.discovered = true;
        outcomes.push({
          success: false,
          effect: `${target.name} discovered your ${campaign.type} campaign!`,
          diplomaticPenalty: -30,
        });

        // Damage diplomatic relations
        if (target.relationships && nation.id) {
          target.relationships[nation.id] = (target.relationships[nation.id] || 0) - 30;
        }
      }

      // Decrement turns
      campaign.turnsRemaining -= 1;

      // Execute campaign if completed
      if (campaign.turnsRemaining <= 0) {
        const outcome = this.executeCampaign(campaign, nation, target);
        outcomes.push(outcome);

        // Remove completed campaign
        nation.propagandaCampaigns.splice(i, 1);
      }
    }

    return outcomes;
  }

  /**
   * Execute campaign when duration reaches 0
   */
  static executeCampaign(
    campaign: PropagandaCampaign,
    attacker: Nation,
    target: Nation
  ): OperationOutcome {
    // Roll for success
    const roll = Math.random();
    const successThreshold = campaign.effectiveness - (campaign.counterMeasures / 100);

    // Discovery heavily impacts success
    if (campaign.discovered) {
      return {
        success: false,
        effect: `Campaign failed - target was prepared for the ${campaign.type} operation`,
      };
    }

    if (roll > successThreshold) {
      return {
        success: false,
        effect: `${campaign.type} campaign failed to achieve objectives`,
      };
    }

    // Apply effects based on type
    switch (campaign.type) {
      case 'subversion': {
        const instabilityDamage = 15 + Math.random() * 10;
        target.instability = (target.instability || 0) + instabilityDamage;
        return {
          success: true,
          effect: `${target.name} destabilized (+${instabilityDamage.toFixed(1)} instability)`,
          stabilityDamage: instabilityDamage,
        };
      }

      case 'attraction': {
        // Convert 5-10% of target's least loyal pop
        if (target.popGroups && target.popGroups.length > 0) {
          const leastLoyal = PopSystemManager.getLeastLoyalPop(target.popGroups);
          if (leastLoyal && leastLoyal.size > 0) {
            const conversionRate = 0.05 + Math.random() * 0.05;
            const convertSize = Math.max(1, Math.floor(leastLoyal.size * conversionRate));

            leastLoyal.size -= convertSize;

            // If pop becomes empty, remove it
            if (leastLoyal.size <= 0) {
              const index = target.popGroups.indexOf(leastLoyal);
              if (index > -1) {
                target.popGroups.splice(index, 1);
              }
            }

            // Add to attacker
            if (!attacker.popGroups) {
              attacker.popGroups = PopSystemManager.initializePopGroups(
                attacker.population,
                attacker.name,
                attacker.culturalIdentity || attacker.name
              );
            }

            const newPop = PopSystemManager.createImmigrantPop(
              convertSize,
              leastLoyal.origin,
              leastLoyal.culture,
              leastLoyal.skills
            );
            attacker.popGroups.push(newPop);

            // Update legacy population numbers
            target.population = Math.max(0, target.population - convertSize);
            attacker.population += convertSize;

            return {
              success: true,
              effect: `Attracted ${convertSize}M population from ${target.name}`,
              populationConverted: convertSize,
            };
          }
        }

        // Fallback if no pops
        const converted = Math.floor(target.population * 0.05);
        target.population = Math.max(0, target.population - converted);
        attacker.population += converted;
        return {
          success: true,
          effect: `Attracted ${converted}M population from ${target.name}`,
          populationConverted: converted,
        };
      }

      case 'demoralization': {
        // Reduce all pop happiness
        if (target.popGroups) {
          PopSystemManager.reducePopHappiness(target.popGroups, 20);
        }
        return {
          success: true,
          effect: `${target.name}'s population demoralized (-20 happiness)`,
        };
      }

      case 'conversion': {
        // Convert cultural power
        const culturalGain = 10 + Math.random() * 15;
        attacker.culturalPower = (attacker.culturalPower || 0) + culturalGain;
        target.culturalPower = Math.max(0, (target.culturalPower || 0) - culturalGain);

        return {
          success: true,
          effect: `Cultural influence increased by ${culturalGain.toFixed(1)}`,
          culturalInfluenceGain: culturalGain,
        };
      }

      default:
        return {
          success: false,
          effect: 'Unknown campaign type',
        };
    }
  }

  /**
   * Add counter-measures to enemy campaigns (defensive action)
   */
  static addCounterMeasures(
    targetNation: Nation,
    campaignId: string,
    strength: number
  ): boolean {
    if (!targetNation.propagandaCampaigns) return false;

    // Find campaigns targeting this nation
    const campaign = targetNation.propagandaCampaigns.find(c => c.id === campaignId);
    if (!campaign) return false;

    campaign.counterMeasures = Math.min(100, campaign.counterMeasures + strength);
    return true;
  }

  /**
   * Find all campaigns targeting a nation
   */
  static findCampaignsTargeting(
    targetNationId: string,
    allNations: Nation[]
  ): Array<{ campaign: PropagandaCampaign; source: Nation }> {
    const results: Array<{ campaign: PropagandaCampaign; source: Nation }> = [];

    for (const nation of allNations) {
      if (!nation.propagandaCampaigns) continue;

      for (const campaign of nation.propagandaCampaigns) {
        if (campaign.targetNation === targetNationId) {
          results.push({ campaign, source: nation });
        }
      }
    }

    return results;
  }

  /**
   * Cancel a campaign (forfeit investment)
   */
  static cancelCampaign(nation: Nation, campaignId: string): boolean {
    if (!nation.propagandaCampaigns) return false;

    const index = nation.propagandaCampaigns.findIndex(c => c.id === campaignId);
    if (index === -1) return false;

    nation.propagandaCampaigns.splice(index, 1);
    return true;
  }
}
