/**
 * IMMIGRATION POLICIES DATA
 * Strategic immigration policy options with trade-offs
 */

import type { ImmigrationPolicy, ImmigrationPolicyType } from '../types/popSystem';

export const IMMIGRATION_POLICIES: Record<ImmigrationPolicyType, ImmigrationPolicy> = {
  closed_borders: {
    type: 'closed_borders',
    stabilityModifier: 10,        // +10% stability
    economicGrowth: -5,           // -5% economic growth
    diplomaticImpact: -10,        // -10 reputation
    culturalAssimilationRate: 0,
    immigrationRate: 0,           // No immigration
    intelCostPerTurn: 5,          // Border enforcement cost
    description: 'No immigration allowed. Increases stability but reduces economic growth and hurts diplomatic reputation.',
  },

  selective: {
    type: 'selective',
    stabilityModifier: 5,         // +5% stability (controlled flow)
    economicGrowth: 15,           // +15% economic boost (high-skill workers)
    diplomaticImpact: 0,
    culturalAssimilationRate: 10, // Easier to integrate skilled workers
    immigrationRate: 2,           // 2M per turn (high-skill only)
    intelCostPerTurn: 10,         // Expensive screening process
    description: 'Accept only highly-skilled immigrants. Expensive but provides strong economic benefits.',
  },

  humanitarian: {
    type: 'humanitarian',
    stabilityModifier: -10,       // -10% stability (strain on services)
    economicGrowth: 0,
    diplomaticImpact: 20,         // +20 reputation (moral leadership)
    culturalAssimilationRate: 5,
    immigrationRate: 6,           // 6M per turn (mostly refugees)
    intelCostPerTurn: 15,         // Refugee processing costs
    productionCostPerTurn: 10,    // Housing and services
    description: 'Accept refugees and those in need. Strains stability but greatly improves diplomatic standing.',
  },

  open_borders: {
    type: 'open_borders',
    stabilityModifier: -20,       // -20% stability (rapid demographic change)
    economicGrowth: 10,           // +10% growth (large labor force)
    diplomaticImpact: 5,
    culturalAssimilationRate: 3,  // Overwhelmed integration systems
    immigrationRate: 10,          // 10M per turn (all skill levels)
    intelCostPerTurn: 2,          // Minimal bureaucracy
    description: 'Maximum immigration with minimal restrictions. Rapid population growth but high instability.',
  },

  cultural_exchange: {
    type: 'cultural_exchange',
    stabilityModifier: 0,
    economicGrowth: 5,
    diplomaticImpact: 15,         // +15 reputation (cultural openness)
    culturalAssimilationRate: 15, // Mutual cultural adaptation
    immigrationRate: 4,           // 4M per turn (balanced)
    intelCostPerTurn: 12,
    description: 'Balanced cultural exchange programs. Promotes mutual understanding and diplomatic ties.',
  },

  brain_drain_ops: {
    type: 'brain_drain_ops',
    stabilityModifier: -5,        // Some social disruption
    economicGrowth: 20,           // +20% boost from elite talent
    diplomaticImpact: -15,        // -15 reputation (aggressive poaching)
    culturalAssimilationRate: 12,
    immigrationRate: 3,           // 3M per turn (all high-skill)
    intelCostPerTurn: 25,         // Very expensive recruitment campaigns
    description: 'Aggressively recruit top talent from other nations. Powerful economic benefits but damages relations.',
  },
};

/**
 * Get policy display name
 */
export function getImmigrationPolicyName(type: ImmigrationPolicyType): string {
  const names: Record<ImmigrationPolicyType, string> = {
    closed_borders: 'Closed Borders',
    selective: 'Selective Immigration',
    humanitarian: 'Humanitarian Policy',
    open_borders: 'Open Borders',
    cultural_exchange: 'Cultural Exchange',
    brain_drain_ops: 'Brain Drain Operations',
  };
  return names[type];
}

/**
 * Get policy effectiveness summary
 */
export function getPolicyEffectivenessSummary(policy: ImmigrationPolicy): string {
  const parts: string[] = [];

  if (policy.stabilityModifier > 0) {
    parts.push(`+${policy.stabilityModifier}% stability`);
  } else if (policy.stabilityModifier < 0) {
    parts.push(`${policy.stabilityModifier}% stability`);
  }

  if (policy.economicGrowth > 0) {
    parts.push(`+${policy.economicGrowth}% economy`);
  } else if (policy.economicGrowth < 0) {
    parts.push(`${policy.economicGrowth}% economy`);
  }

  if (policy.diplomaticImpact > 0) {
    parts.push(`+${policy.diplomaticImpact} reputation`);
  } else if (policy.diplomaticImpact < 0) {
    parts.push(`${policy.diplomaticImpact} reputation`);
  }

  parts.push(`${policy.immigrationRate}M/turn`);

  return parts.join(', ');
}
