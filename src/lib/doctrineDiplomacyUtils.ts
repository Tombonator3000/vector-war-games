/**
 * Doctrine Diplomacy Integration Utilities
 *
 * Handles how military doctrines affect diplomatic relationships,
 * proposal acceptance rates, and unlock special diplomatic options.
 */

import type { Nation } from '@/types/game';
import type { DoctrineKey } from '@/types/doctrineIncidents';
import {
  DOCTRINE_COMPATIBILITY,
  type DoctrineProposalConfig,
  type DoctrineProposalType,
} from '@/types/doctrineDiplomacy';

/**
 * Calculate relationship modifier based on doctrine compatibility
 */
export function getDoctrineCompatibilityModifier(
  doctrine1: DoctrineKey,
  doctrine2: DoctrineKey
): number {
  return DOCTRINE_COMPATIBILITY[doctrine1]?.[doctrine2] || 0;
}

/**
 * Calculate how doctrine affects diplomatic proposal acceptance
 */
export function getDoctrineDiplomacyModifier(
  proposerNation: Nation,
  targetNation: Nation,
  proposalType: string
): {
  modifier: number;
  reason: string;
} {
  const proposerDoctrine = proposerNation.doctrine as DoctrineKey;
  const targetDoctrine = targetNation.doctrine as DoctrineKey;

  if (!proposerDoctrine || !targetDoctrine) {
    return { modifier: 0, reason: '' };
  }

  const compatibility = getDoctrineCompatibilityModifier(proposerDoctrine, targetDoctrine);

  // Base compatibility affects all proposals
  let modifier = compatibility;
  let reason = '';

  // Specific proposal type modifiers
  switch (proposalType) {
    case 'alliance':
      // Alliances work best with compatible doctrines
      modifier *= 1.5;
      if (compatibility > 10) {
        reason = 'Shared strategic outlook makes alliance attractive';
      } else if (compatibility < -10) {
        reason = 'Conflicting military doctrines hinder alliance';
      }
      break;

    case 'truce':
    case 'peace-offer':
      // Peace is more acceptable between Détente nations
      if (proposerDoctrine === 'detente') {
        modifier += 10;
        reason = 'Détente doctrine favors peaceful resolution';
      }
      if (targetDoctrine === 'detente') {
        modifier += 10;
        reason = 'Target appreciates peaceful approach';
      }
      if (proposerDoctrine === 'firstStrike' || targetDoctrine === 'firstStrike') {
        modifier -= 15;
        reason = 'First Strike doctrine creates distrust';
      }
      break;

    case 'non-aggression':
      // NAPs work better with defensive doctrines
      if (proposerDoctrine === 'defense' || targetDoctrine === 'defense') {
        modifier += 8;
        reason = 'Defensive postures favor non-aggression';
      }
      break;

    case 'joint-war':
      // Joint wars favor aggressive doctrines
      if (proposerDoctrine === 'firstStrike' || proposerDoctrine === 'mad') {
        modifier += 10;
        reason = 'Aggressive doctrine supports joint military action';
      }
      if (targetDoctrine === 'detente') {
        modifier -= 20;
        reason = 'Détente doctrine opposes military adventures';
      }
      break;

    case 'aid-request':
      // Détente nations more likely to give/receive aid
      if (targetDoctrine === 'detente') {
        modifier += 12;
        reason = 'Cooperative doctrine favors mutual assistance';
      }
      if (targetDoctrine === 'firstStrike') {
        modifier -= 10;
        reason = 'Self-interested doctrine limits generosity';
      }
      break;

    case 'demand-surrender':
      // First Strike and MAD nations more intimidating
      if (proposerDoctrine === 'firstStrike' || proposerDoctrine === 'mad') {
        modifier += 15;
        reason = 'Aggressive doctrine lends credibility to threats';
      }
      if (proposerDoctrine === 'detente') {
        modifier -= 20;
        reason = 'Peaceful reputation undermines threats';
      }
      break;

    default:
      reason = compatibility > 0 ? 'Compatible doctrines' : 'Incompatible doctrines';
  }

  return { modifier: Math.round(modifier), reason };
}

/**
 * Check if a nation can propose doctrine-specific diplomacy
 */
export function canProposeDoctrineDiplomacy(
  nation: Nation,
  proposalType: DoctrineProposalType,
  config: DoctrineProposalConfig
): {
  canPropose: boolean;
  reason?: string;
} {
  const doctrine = nation.doctrine as DoctrineKey;

  // Check doctrine requirement
  const requiredDoctrines = Array.isArray(config.requiredDoctrine)
    ? config.requiredDoctrine
    : [config.requiredDoctrine];

  if (!requiredDoctrines.includes(doctrine)) {
    return {
      canPropose: false,
      reason: `Requires ${requiredDoctrines.join(' or ')} doctrine`,
    };
  }

  // Check resource costs
  if (config.costs.intelCost && (nation.intel || 0) < config.costs.intelCost) {
    return {
      canPropose: false,
      reason: `Requires ${config.costs.intelCost} intelligence`,
    };
  }

  if (config.costs.goldCost && (nation.gold || 0) < config.costs.goldCost) {
    return {
      canPropose: false,
      reason: `Requires ${config.costs.goldCost} gold`,
    };
  }

  if (config.costs.productionCost && (nation.production || 0) < config.costs.productionCost) {
    return {
      canPropose: false,
      reason: `Requires ${config.costs.productionCost} production`,
    };
  }

  // Check research requirements
  if (config.requirements?.hasResearch) {
    const missingResearch = config.requirements.hasResearch.find(
      (researchId) => !nation.researched?.[researchId]
    );
    if (missingResearch) {
      return {
        canPropose: false,
        reason: `Requires research: ${missingResearch}`,
      };
    }
  }

  return { canPropose: true };
}

/**
 * Get all available doctrine-specific proposals for a nation
 */
export function getAvailableDoctrineProposals(
  nation: Nation,
  allConfigs: DoctrineProposalConfig[]
): DoctrineProposalConfig[] {
  return allConfigs.filter((config) => {
    const check = canProposeDoctrineDiplomacy(nation, config.id, config);
    return check.canPropose;
  });
}

/**
 * Calculate acceptance chance for doctrine-specific proposal
 */
export function calculateDoctrineProposalAcceptance(
  proposerNation: Nation,
  targetNation: Nation,
  config: DoctrineProposalConfig,
  baseRelationship: number
): {
  acceptanceChance: number;
  modifiers: Array<{ reason: string; value: number }>;
} {
  const modifiers: Array<{ reason: string; value: number }> = [];
  let totalModifier = config.baseAcceptanceModifier;

  modifiers.push({
    reason: 'Base proposal modifier',
    value: config.baseAcceptanceModifier,
  });

  // Doctrine compatibility
  const proposerDoctrine = proposerNation.doctrine as DoctrineKey;
  const targetDoctrine = targetNation.doctrine as DoctrineKey;

  if (proposerDoctrine && targetDoctrine) {
    const compatibility = getDoctrineCompatibilityModifier(proposerDoctrine, targetDoctrine);
    if (compatibility !== 0) {
      modifiers.push({
        reason: `Doctrine compatibility (${proposerDoctrine} + ${targetDoctrine})`,
        value: compatibility,
      });
      totalModifier += compatibility;
    }

    // Check target doctrine preference
    if (config.targetDoctrinePreference?.includes(targetDoctrine)) {
      modifiers.push({
        reason: 'Target doctrine favors this proposal',
        value: 15,
      });
      totalModifier += 15;
    }
  }

  // Relationship bonus
  const relationshipBonus = Math.floor(baseRelationship / 10);
  if (relationshipBonus !== 0) {
    modifiers.push({
      reason: 'Current relationship',
      value: relationshipBonus,
    });
    totalModifier += relationshipBonus;
  }

  // At war penalty
  const atWarWith = Object.values(proposerNation.threats || {}).some((threat) => threat > 50);
  if (atWarWith && config.requirements?.notAtWar) {
    modifiers.push({
      reason: 'Currently at war (proposal invalid)',
      value: -100,
    });
    totalModifier -= 100;
  }

  // Calculate final acceptance chance (0-100)
  const acceptanceChance = Math.max(0, Math.min(100, 50 + totalModifier));

  return {
    acceptanceChance,
    modifiers,
  };
}

/**
 * Apply ongoing effects of doctrine-based diplomatic agreements
 */
export function applyDoctrineAgreementEffects(
  nation: Nation,
  agreementType: DoctrineProposalType,
  config: DoctrineProposalConfig
): Nation {
  const updatedNation = { ...nation };

  // Apply military bonuses
  if (config.effects.defenseBonus) {
    updatedNation.defense = (updatedNation.defense || 0) + config.effects.defenseBonus;
  }

  // Apply economic bonuses
  if (config.effects.productionBonus) {
    updatedNation.production = (updatedNation.production || 0) + config.effects.productionBonus;
  }

  if (config.effects.goldBonus) {
    updatedNation.gold = (updatedNation.gold || 0) + config.effects.goldBonus;
  }

  return updatedNation;
}

/**
 * Doctrine-specific proposal configurations
 */
export const DOCTRINE_PROPOSAL_CONFIGS: Record<DoctrineProposalType, DoctrineProposalConfig> = {
  'mutual-deterrence-pact': {
    id: 'mutual-deterrence-pact',
    name: 'Mutual Deterrence Pact',
    description:
      'Both nations agree to maintain large nuclear arsenals as mutual deterrent. ' +
      'Coordinated deterrence strategy increases effectiveness.',
    requiredDoctrine: 'mad',
    targetDoctrinePreference: ['mad', 'defense'],
    effects: {
      relationshipBonus: 15,
      trustBonus: 10,
      deterrenceBonus: 20,
    },
    costs: {
      intelCost: 20,
      productionCost: 10,
    },
    requirements: {
      minRelationship: 20,
      minTurn: 10,
      notAtWar: true,
    },
    duration: 20,
    baseAcceptanceModifier: 10,
  },

  'no-first-use-treaty': {
    id: 'no-first-use-treaty',
    name: 'No First Use Treaty',
    description:
      'Both parties pledge to never be the first to use nuclear weapons. ' +
      'Reduces tension while maintaining deterrent.',
    requiredDoctrine: ['mad', 'defense'],
    targetDoctrinePreference: ['defense', 'detente'],
    effects: {
      relationshipBonus: 20,
      trustBonus: 15,
      firstStrikeReduction: 50,
    },
    costs: {
      intelCost: 15,
    },
    requirements: {
      minRelationship: 15,
      notAtWar: true,
    },
    duration: 'permanent',
    baseAcceptanceModifier: 15,
  },

  'abm-technology-share': {
    id: 'abm-technology-share',
    name: 'ABM Technology Sharing',
    description:
      'Share anti-ballistic missile technology to create defensive coalition. ' +
      'Both nations gain defensive capabilities.',
    requiredDoctrine: 'defense',
    targetDoctrinePreference: ['defense'],
    effects: {
      relationshipBonus: 25,
      trustBonus: 20,
      defenseBonus: 2,
    },
    costs: {
      intelCost: 30,
      productionCost: 20,
    },
    requirements: {
      minRelationship: 30,
      minTrust: 40,
      hasResearch: ['abm'],
    },
    duration: 'permanent',
    baseAcceptanceModifier: 20,
  },

  'joint-early-warning': {
    id: 'joint-early-warning',
    name: 'Joint Early Warning System',
    description:
      'Share early warning radar data to reduce chance of miscalculation. ' +
      'Prevents false alarms from triggering war.',
    requiredDoctrine: 'defense',
    targetDoctrinePreference: ['defense', 'detente'],
    effects: {
      relationshipBonus: 15,
      trustBonus: 25,
      firstStrikeReduction: 40,
    },
    costs: {
      intelCost: 25,
    },
    requirements: {
      minRelationship: 25,
      hasResearch: ['early_warning'],
    },
    duration: 'permanent',
    baseAcceptanceModifier: 18,
  },

  'preemptive-alliance': {
    id: 'preemptive-alliance',
    name: 'Preemptive Strike Alliance',
    description:
      'Coordinate first strike capabilities for maximum effect. ' +
      'Joint preemptive action against mutual threats.',
    requiredDoctrine: 'firstStrike',
    targetDoctrinePreference: ['firstStrike', 'mad'],
    effects: {
      relationshipBonus: 10,
      deterrenceBonus: 30,
      mutualDefense: true,
    },
    costs: {
      intelCost: 35,
      productionCost: 15,
    },
    requirements: {
      minRelationship: 15,
      minTurn: 12,
    },
    duration: 15,
    baseAcceptanceModifier: 5,
  },

  'target-coordination': {
    id: 'target-coordination',
    name: 'Target Coordination Agreement',
    description:
      'Share target lists to avoid redundancy in strike plans. ' +
      'Increases effectiveness of joint military action.',
    requiredDoctrine: 'firstStrike',
    targetDoctrinePreference: ['firstStrike'],
    effects: {
      relationshipBonus: 8,
      trustBonus: 10,
      sharedIntel: true,
    },
    costs: {
      intelCost: 40,
    },
    requirements: {
      minRelationship: 20,
      minTrust: 30,
    },
    duration: 10,
    baseAcceptanceModifier: 8,
  },

  'nuclear-arms-reduction': {
    id: 'nuclear-arms-reduction',
    name: 'Nuclear Arms Reduction Treaty',
    description:
      'Mutually reduce nuclear arsenals to lower tensions. ' +
      'Both parties reduce missiles, gain economic benefits.',
    requiredDoctrine: 'detente',
    targetDoctrinePreference: ['detente', 'defense'],
    effects: {
      relationshipBonus: 30,
      trustBonus: 25,
      productionBonus: 5,
      disarmamentRequired: true,
    },
    costs: {
      intelCost: 20,
    },
    requirements: {
      minRelationship: 40,
      minTrust: 50,
      notAtWar: true,
    },
    duration: 'permanent',
    baseAcceptanceModifier: 25,
  },

  'hotline-agreement': {
    id: 'hotline-agreement',
    name: 'Emergency Hotline Agreement',
    description:
      'Establish direct communication channel between leaders. ' +
      'Prevents miscalculation during crises.',
    requiredDoctrine: 'detente',
    targetDoctrinePreference: ['detente', 'defense', 'mad'],
    effects: {
      relationshipBonus: 10,
      trustBonus: 15,
      firstStrikeReduction: 30,
    },
    costs: {
      intelCost: 10,
    },
    requirements: {
      minRelationship: 15,
      notAtWar: true,
    },
    duration: 'permanent',
    baseAcceptanceModifier: 20,
  },

  'enhanced-non-aggression': {
    id: 'enhanced-non-aggression',
    name: 'Enhanced Non-Aggression Pact',
    description:
      'Comprehensive non-aggression agreement with verification. ' +
      'Stronger than standard pact, includes cultural exchange.',
    requiredDoctrine: 'detente',
    targetDoctrinePreference: ['detente'],
    effects: {
      relationshipBonus: 25,
      trustBonus: 20,
      productionBonus: 3,
    },
    costs: {
      intelCost: 15,
      goldCost: 10,
    },
    requirements: {
      minRelationship: 30,
      notAtWar: true,
    },
    duration: 25,
    baseAcceptanceModifier: 22,
  },
};

/**
 * Get description of how doctrines affect relationship
 */
export function getDoctrineRelationshipDescription(
  doctrine1: DoctrineKey,
  doctrine2: DoctrineKey
): string {
  const modifier = getDoctrineCompatibilityModifier(doctrine1, doctrine2);

  if (modifier > 15) {
    return 'Highly compatible doctrines - strong basis for cooperation';
  } else if (modifier > 5) {
    return 'Compatible doctrines - favorable for diplomacy';
  } else if (modifier > -5) {
    return 'Neutral doctrines - no significant effect';
  } else if (modifier > -15) {
    return 'Incompatible doctrines - complicates diplomacy';
  } else {
    return 'Highly incompatible doctrines - major diplomatic obstacle';
  }
}
