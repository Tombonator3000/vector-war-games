/**
 * Specialized Alliance Types - Phase 2 Diplomacy Enhancement
 *
 * Extends the alliance system to support different types of alliances,
 * each with unique benefits and obligations.
 */

import type { Nation } from './game';

// ============================================================================
// ALLIANCE TYPES
// ============================================================================

/**
 * Types of specialized alliances
 */
export type AllianceType =
  | 'military'    // Military pact: Joint operations, offensive coordination
  | 'defensive'   // Defensive pact: Mutual defense only
  | 'economic'    // Economic alliance: Trade benefits, resource sharing
  | 'research';   // Research alliance: Technology sharing, faster research

/**
 * A specialized alliance between two nations
 */
export interface SpecializedAlliance {
  id: string;
  type: AllianceType;
  nation1Id: string;
  nation2Id: string;
  createdTurn: number;
  active: boolean;
  level: number;           // Alliance level (1-5) increases over time
  cooperation: number;     // Cooperation score (0-100) affects benefits
  obligations: AllianceObligation[];
  benefits: AllianceBenefit[];
}

/**
 * Obligations that come with an alliance
 */
export interface AllianceObligation {
  type: string;
  description: string;
  mandatory: boolean;      // If false, refusing has smaller penalty
  violationPenalty: {
    trust: number;
    relationship: number;
    cooperation: number;
  };
}

/**
 * Benefits provided by an alliance
 */
export interface AllianceBenefit {
  type: string;
  description: string;
  value: number;           // Numeric benefit value
  active: boolean;         // Can be temporarily disabled
}

// ============================================================================
// ALLIANCE CONFIGURATIONS
// ============================================================================

/**
 * Military Alliance Configuration
 */
export const MilitaryAllianceConfig = {
  name: 'Military Alliance',
  description: 'Offensive and defensive military cooperation',
  color: 'text-red-500',
  icon: '⚔️',

  obligations: [
    {
      type: 'joint-offense',
      description: 'Must join offensive wars when called',
      mandatory: true,
      violationPenalty: { trust: -30, relationship: -35, cooperation: -25 },
    },
    {
      type: 'mutual-defense',
      description: 'Must defend ally when attacked',
      mandatory: true,
      violationPenalty: { trust: -40, relationship: -40, cooperation: -30 },
    },
    {
      type: 'coordinate-operations',
      description: 'Share military intelligence and coordinate operations',
      mandatory: false,
      violationPenalty: { trust: -5, relationship: -5, cooperation: -10 },
    },
  ],

  benefits: {
    level1: [
      { type: 'unit-bonus', description: '+5% unit attack when fighting together', value: 0.05 },
      { type: 'intel-share', description: 'Automatic intel sharing on enemies', value: 1 },
    ],
    level2: [
      { type: 'unit-bonus', description: '+10% unit attack when fighting together', value: 0.10 },
      { type: 'combined-arms', description: '+10% combined arms bonus', value: 0.10 },
    ],
    level3: [
      { type: 'unit-bonus', description: '+15% unit attack when fighting together', value: 0.15 },
      { type: 'coordinated-strike', description: 'Can launch coordinated nuclear strikes', value: 1 },
    ],
    level4: [
      { type: 'unit-bonus', description: '+20% unit attack when fighting together', value: 0.20 },
      { type: 'shared-bases', description: 'Access to ally military bases', value: 1 },
    ],
    level5: [
      { type: 'unit-bonus', description: '+25% unit attack when fighting together', value: 0.25 },
      { type: 'joint-command', description: 'Unified military command structure', value: 1 },
    ],
  },
};

/**
 * Defensive Alliance Configuration
 */
export const DefensiveAllianceConfig = {
  name: 'Defensive Alliance',
  description: 'Mutual defense only, no offensive obligations',
  color: 'text-blue-500',
  icon: '🛡️',

  obligations: [
    {
      type: 'mutual-defense',
      description: 'Must defend ally when attacked',
      mandatory: true,
      violationPenalty: { trust: -35, relationship: -30, cooperation: -25 },
    },
    {
      type: 'no-aggression',
      description: 'Cannot attack each other',
      mandatory: true,
      violationPenalty: { trust: -50, relationship: -50, cooperation: -50 },
    },
  ],

  benefits: {
    level1: [
      { type: 'defense-bonus', description: '+10% unit defense when defending together', value: 0.10 },
      { type: 'warning-system', description: 'Early warning of incoming attacks', value: 1 },
    ],
    level2: [
      { type: 'defense-bonus', description: '+15% unit defense when defending together', value: 0.15 },
      { type: 'missile-defense', description: '+5% missile interception rate', value: 0.05 },
    ],
    level3: [
      { type: 'defense-bonus', description: '+20% unit defense when defending together', value: 0.20 },
      { type: 'rapid-response', description: 'Faster ally reinforcement', value: 1 },
    ],
    level4: [
      { type: 'defense-bonus', description: '+25% unit defense when defending together', value: 0.25 },
      { type: 'shared-radar', description: '+10% missile interception rate', value: 0.10 },
    ],
    level5: [
      { type: 'defense-bonus', description: '+30% unit defense when defending together', value: 0.30 },
      { type: 'integrated-defense', description: 'Unified air defense network', value: 1 },
    ],
  },
};

/**
 * Economic Alliance Configuration
 */
export const EconomicAllianceConfig = {
  name: 'Economic Alliance',
  description: 'Trade benefits and resource sharing',
  color: 'text-green-500',
  icon: '💰',

  obligations: [
    {
      type: 'trade-preference',
      description: 'Must prioritize trade with ally',
      mandatory: false,
      violationPenalty: { trust: -5, relationship: -5, cooperation: -15 },
    },
    {
      type: 'no-sanctions',
      description: 'Cannot impose sanctions on ally',
      mandatory: true,
      violationPenalty: { trust: -25, relationship: -30, cooperation: -30 },
    },
    {
      type: 'resource-sharing',
      description: 'Share critical resources during shortage',
      mandatory: false,
      violationPenalty: { trust: -10, relationship: -15, cooperation: -20 },
    },
  ],

  benefits: {
    level1: [
      { type: 'production-bonus', description: '+5% production from trade', value: 0.05 },
      { type: 'uranium-trade', description: 'Can trade uranium freely', value: 1 },
    ],
    level2: [
      { type: 'production-bonus', description: '+10% production from trade', value: 0.10 },
      { type: 'resource-pool', description: 'Share 5% of resources each turn', value: 0.05 },
    ],
    level3: [
      { type: 'production-bonus', description: '+15% production from trade', value: 0.15 },
      { type: 'economic-aid', description: 'Automatic aid during economic crisis', value: 1 },
    ],
    level4: [
      { type: 'production-bonus', description: '+20% production from trade', value: 0.20 },
      { type: 'resource-pool', description: 'Share 10% of resources each turn', value: 0.10 },
    ],
    level5: [
      { type: 'production-bonus', description: '+25% production from trade', value: 0.25 },
      { type: 'common-market', description: 'Unified economic zone (major bonuses)', value: 1 },
    ],
  },
};

/**
 * Research Alliance Configuration
 */
export const ResearchAllianceConfig = {
  name: 'Research Alliance',
  description: 'Technology sharing and collaborative research',
  color: 'text-purple-500',
  icon: '🔬',

  obligations: [
    {
      type: 'tech-sharing',
      description: 'Must share new technologies with ally',
      mandatory: true,
      violationPenalty: { trust: -20, relationship: -25, cooperation: -30 },
    },
    {
      type: 'joint-projects',
      description: 'Participate in joint research projects',
      mandatory: false,
      violationPenalty: { trust: -5, relationship: -5, cooperation: -15 },
    },
    {
      type: 'intel-protection',
      description: 'Protect ally research from espionage',
      mandatory: false,
      violationPenalty: { trust: -10, relationship: -10, cooperation: -10 },
    },
  ],

  benefits: {
    level1: [
      { type: 'research-speed', description: '+10% research speed', value: 0.10 },
      { type: 'tech-visibility', description: 'See ally research progress', value: 1 },
    ],
    level2: [
      { type: 'research-speed', description: '+15% research speed', value: 0.15 },
      { type: 'instant-share', description: 'Instantly share completed research', value: 1 },
    ],
    level3: [
      { type: 'research-speed', description: '+20% research speed', value: 0.20 },
      { type: 'joint-projects', description: 'Can combine research efforts (30% faster)', value: 0.30 },
    ],
    level4: [
      { type: 'research-speed', description: '+25% research speed', value: 0.25 },
      { type: 'espionage-defense', description: '+20% spy defense for both nations', value: 0.20 },
    ],
    level5: [
      { type: 'research-speed', description: '+30% research speed', value: 0.30 },
      { type: 'innovation-hub', description: 'Unlock special joint research projects', value: 1 },
    ],
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get alliance configuration by type
 */
export function getAllianceConfig(type: AllianceType) {
  switch (type) {
    case 'military':
      return MilitaryAllianceConfig;
    case 'defensive':
      return DefensiveAllianceConfig;
    case 'economic':
      return EconomicAllianceConfig;
    case 'research':
      return ResearchAllianceConfig;
  }
}

/**
 * Get benefits for an alliance at a specific level
 */
export function getAllianceBenefits(
  type: AllianceType,
  level: number
): AllianceBenefit[] {
  const config = getAllianceConfig(type);
  const benefits: AllianceBenefit[] = [];

  // Accumulate benefits from all levels up to current level
  for (let i = 1; i <= Math.min(level, 5); i++) {
    const levelKey = `level${i}` as keyof typeof config.benefits;
    const levelBenefits = config.benefits[levelKey];
    if (levelBenefits) {
      levelBenefits.forEach((benefit) => {
        benefits.push({ ...benefit, active: true });
      });
    }
  }

  return benefits;
}

/**
 * Get alliance between two nations
 */
export function getAllianceBetween(
  nation: Nation,
  targetNationId: string
): SpecializedAlliance | null {
  if (!nation.specializedAlliances) return null;

  return (
    nation.specializedAlliances.find(
      (a) =>
        a.active &&
        ((a.nation1Id === nation.id && a.nation2Id === targetNationId) ||
          (a.nation1Id === targetNationId && a.nation2Id === nation.id))
    ) ?? null
  );
}

/**
 * Check if two nations have a specific type of alliance
 */
export function hasAllianceType(
  nation: Nation,
  targetNationId: string,
  type: AllianceType
): boolean {
  const alliance = getAllianceBetween(nation, targetNationId);
  return alliance?.type === type;
}

/**
 * Calculate cooperation decay per turn
 * Cooperation naturally decays if allies don't interact
 */
export function calculateCooperationDecay(
  lastInteractionTurn: number,
  currentTurn: number
): number {
  const turnsSinceInteraction = currentTurn - lastInteractionTurn;
  if (turnsSinceInteraction < 5) return 0;
  return -0.5; // Slow decay after 5 turns of no interaction
}

/**
 * Get total production bonus from economic alliances
 */
export function getEconomicAllianceProductionBonus(nation: Nation): number {
  if (!nation.specializedAlliances) return 0;

  const economicAlliances = nation.specializedAlliances.filter(
    (a) => a.type === 'economic' && a.active
  );

  return economicAlliances.reduce((total, alliance) => {
    const benefits = getAllianceBenefits('economic', alliance.level);
    const productionBenefit = benefits.find((b) => b.type === 'production-bonus');
    return total + (productionBenefit?.value ?? 0);
  }, 0);
}

/**
 * Get total research speed bonus from research alliances
 */
export function getResearchAllianceSpeedBonus(nation: Nation): number {
  if (!nation.specializedAlliances) return 0;

  const researchAlliances = nation.specializedAlliances.filter(
    (a) => a.type === 'research' && a.active
  );

  return researchAlliances.reduce((total, alliance) => {
    const benefits = getAllianceBenefits('research', alliance.level);
    const speedBenefit = benefits.find((b) => b.type === 'research-speed');
    return total + (speedBenefit?.value ?? 0);
  }, 0);
}

/**
 * Get alliance level color for UI
 */
export function getAllianceLevelColor(level: number): string {
  if (level >= 5) return 'text-purple-500';
  if (level >= 4) return 'text-blue-500';
  if (level >= 3) return 'text-green-500';
  if (level >= 2) return 'text-yellow-500';
  return 'text-gray-400';
}

/**
 * Get cooperation color for UI
 */
export function getCooperationColor(cooperation: number): string {
  if (cooperation >= 80) return 'text-green-500';
  if (cooperation >= 60) return 'text-green-400';
  if (cooperation >= 40) return 'text-yellow-400';
  if (cooperation >= 20) return 'text-orange-400';
  return 'text-red-400';
}
