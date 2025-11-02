/**
 * Leader Ability Definitions - FASE 3.2
 *
 * Defines the unique activatable ability for each of the 18 leaders.
 * Each ability can be used 1-2 times per game and has strategic impact.
 */

import type { LeaderAbility, LeaderAbilityEffect } from '@/types/leaderAbilities';

/**
 * All leader abilities by leader name
 */
export const LEADER_ABILITIES: Record<string, LeaderAbility> = {
  // ============================================================================
  // HISTORICAL CUBAN CRISIS LEADERS
  // ============================================================================

  'John F. Kennedy': {
    id: 'jfk_crisis_resolution',
    name: '🕊️ Crisis Resolution',
    description: 'Force an immediate end to war and establish 3-turn truce with all hostile nations. Cannot be broken during this period.',
    icon: '🕊️',
    maxUses: 1,
    usesRemaining: 1,
    cooldownTurns: 0,
    currentCooldown: 0,
    lastUsedTurn: null,
    effect: {
      type: 'force-peace',
      duration: 3,
      value: 0,
    },
    targetType: 'all-enemies',
    category: 'diplomatic',
    requirements: [
      {
        type: 'at-war',
        value: 1,
        description: 'Must be at war with at least one nation',
      },
    ],
  },

  'Nikita Khrushchev': {
    id: 'khrushchev_iron_curtain',
    name: '⚔️ Iron Curtain Strike',
    description: 'Launch a devastating first strike with +100% missile effectiveness and -50% enemy defense for this attack only.',
    icon: '⚔️',
    maxUses: 1,
    usesRemaining: 1,
    cooldownTurns: 0,
    currentCooldown: 0,
    lastUsedTurn: null,
    effect: {
      type: 'first-strike',
      duration: 1,
      value: 100,
    },
    targetType: 'single-nation',
    category: 'military',
    requirements: [],
  },

  'Fidel Castro': {
    id: 'castro_revolutionary_fervor',
    name: '🔥 Revolutionary Uprising',
    description: 'Inspire massive morale boost (+50) and gain 3 free missiles. All production costs reduced by 30% for 5 turns.',
    icon: '🔥',
    maxUses: 2,
    usesRemaining: 2,
    cooldownTurns: 10,
    currentCooldown: 0,
    lastUsedTurn: null,
    effect: {
      type: 'rapid-mobilization',
      duration: 5,
      value: 30,
    },
    targetType: 'self',
    category: 'military',
    requirements: [],
  },

  // ============================================================================
  // LOVECRAFTIAN GREAT OLD ONES
  // ============================================================================

  'Cthulhu': {
    id: 'cthulhu_awakening',
    name: '🌊 R\'lyeh Awakening',
    description: 'Summon a Great Old One avatar that devastates a target nation, reducing their population by 50% and causing massive instability.',
    icon: '🌊',
    maxUses: 1,
    usesRemaining: 1,
    cooldownTurns: 0,
    currentCooldown: 0,
    lastUsedTurn: null,
    effect: {
      type: 'summon-entity',
      value: 50,
    },
    targetType: 'single-nation',
    category: 'special',
    requirements: [
      {
        type: 'min-turn',
        value: 15,
        description: 'Available after turn 15',
      },
    ],
  },

  'Azathoth': {
    id: 'azathoth_chaos_storm',
    name: '🌀 Chaos Storm',
    description: 'Unleash pure chaos: Randomize all nation stats by ±30%, shuffle alliances, and create unpredictable global effects.',
    icon: '🌀',
    maxUses: 2,
    usesRemaining: 2,
    cooldownTurns: 12,
    currentCooldown: 0,
    lastUsedTurn: null,
    effect: {
      type: 'reality-warp',
      value: 30,
    },
    targetType: 'global',
    category: 'special',
    requirements: [],
  },

  'Nyarlathotep': {
    id: 'nyarlathotep_false_flag',
    name: '🎭 Master Deceiver',
    description: 'Frame another nation for a devastating attack, causing them to lose 40 relationship with all nations and become isolated.',
    icon: '🎭',
    maxUses: 2,
    usesRemaining: 2,
    cooldownTurns: 8,
    currentCooldown: 0,
    lastUsedTurn: null,
    effect: {
      type: 'false-flag',
      value: 40,
    },
    targetType: 'single-nation',
    category: 'intelligence',
    requirements: [],
  },

  'Hastur': {
    id: 'hastur_yellow_sign',
    name: '🌫️ The Yellow Sign',
    description: 'Mark a target nation with the Yellow Sign, causing gradual conversion of their population (20% per turn for 4 turns).',
    icon: '🌫️',
    maxUses: 1,
    usesRemaining: 1,
    cooldownTurns: 0,
    currentCooldown: 0,
    lastUsedTurn: null,
    effect: {
      type: 'corruption-surge',
      duration: 4,
      value: 20,
    },
    targetType: 'single-nation',
    category: 'special',
    requirements: [],
  },

  'Shub-Niggurath': {
    id: 'shub_niggurath_spawn',
    name: '🐐 Dark Young Swarm',
    description: 'Spawn 5 Dark Young entities that terrorize all enemy nations, reducing their defense by 40% for 3 turns.',
    icon: '🐐',
    maxUses: 2,
    usesRemaining: 2,
    cooldownTurns: 10,
    currentCooldown: 0,
    lastUsedTurn: null,
    effect: {
      type: 'summon-entity',
      duration: 3,
      value: 40,
    },
    targetType: 'all-enemies',
    category: 'special',
    requirements: [],
  },

  'Yog-Sothoth': {
    id: 'yog_sothoth_temporal_shift',
    name: '🔮 Temporal Manipulation',
    description: 'Take an extra turn immediately. You can perform all actions twice this turn.',
    icon: '🔮',
    maxUses: 1,
    usesRemaining: 1,
    cooldownTurns: 0,
    currentCooldown: 0,
    lastUsedTurn: null,
    effect: {
      type: 'reality-warp',
      value: 1,
      metadata: { extraTurn: true },
    },
    targetType: 'self',
    category: 'special',
    requirements: [
      {
        type: 'min-turn',
        value: 10,
        description: 'Available after turn 10',
      },
    ],
  },

  // ============================================================================
  // PARODY LEADERS
  // ============================================================================

  'Ronnie Raygun': {
    id: 'raygun_star_wars',
    name: '🛡️ Star Wars Defense',
    description: 'Activate space-based missile defense system. Complete immunity to all missile attacks for 3 turns.',
    icon: '🛡️',
    maxUses: 1,
    usesRemaining: 1,
    cooldownTurns: 0,
    currentCooldown: 0,
    lastUsedTurn: null,
    effect: {
      type: 'missile-shield',
      duration: 3,
      value: 100,
    },
    targetType: 'self',
    category: 'military',
    requirements: [
      {
        type: 'min-turn',
        value: 8,
        description: 'SDI must be deployed first (turn 8+)',
      },
    ],
  },

  'Tricky Dick': {
    id: 'nixon_watergate_op',
    name: '🕵️ Covert Operation',
    description: 'Conduct massive espionage campaign: Reveal all enemy research, steal 100 Intel and 50 Production from target.',
    icon: '🕵️',
    maxUses: 2,
    usesRemaining: 2,
    cooldownTurns: 7,
    currentCooldown: 0,
    lastUsedTurn: null,
    effect: {
      type: 'steal-resources',
      value: 100,
      metadata: { intelSteal: 100, productionSteal: 50 },
    },
    targetType: 'single-nation',
    category: 'intelligence',
    requirements: [],
  },

  'Jimi Farmer': {
    id: 'farmer_peace_dividend',
    name: '☮️ Peace Summit',
    description: 'Host international peace conference: Boost relationship with all nations by +30 and form instant alliances with friendly nations.',
    icon: '☮️',
    maxUses: 1,
    usesRemaining: 1,
    cooldownTurns: 0,
    currentCooldown: 0,
    lastUsedTurn: null,
    effect: {
      type: 'boost-relationships',
      value: 30,
    },
    targetType: 'all-nations',
    category: 'diplomatic',
    requirements: [
      {
        type: 'at-peace',
        value: 1,
        description: 'Cannot be at war with any nation',
      },
    ],
  },

  'E. Musk Rat': {
    id: 'musk_innovation_surge',
    name: '🚀 Innovation Breakthrough',
    description: 'Unlock all remaining technologies instantly and gain +200% production for 3 turns.',
    icon: '🚀',
    maxUses: 1,
    usesRemaining: 1,
    cooldownTurns: 0,
    currentCooldown: 0,
    lastUsedTurn: null,
    effect: {
      type: 'economic-boom',
      duration: 3,
      value: 200,
    },
    targetType: 'self',
    category: 'economic',
    requirements: [
      {
        type: 'min-turn',
        value: 12,
        description: 'Available in mid-game',
      },
    ],
  },

  'Donnie Trumpf': {
    id: 'trumpf_twitter_storm',
    name: '💬 Twitter Storm',
    description: 'Unleash devastating propaganda wave: -50 relationship from all nations to target, target loses 40 morale.',
    icon: '💬',
    maxUses: 2,
    usesRemaining: 2,
    cooldownTurns: 6,
    currentCooldown: 0,
    lastUsedTurn: null,
    effect: {
      type: 'propaganda-wave',
      value: 50,
    },
    targetType: 'single-nation',
    category: 'intelligence',
    requirements: [],
  },

  'Atom Hus-Bomb': {
    id: 'husbomb_nuclear_fury',
    name: '☢️ Nuclear Armageddon',
    description: 'Launch 10 missiles simultaneously at up to 3 targets with +50% yield. No defensive countermeasures possible.',
    icon: '☢️',
    maxUses: 1,
    usesRemaining: 1,
    cooldownTurns: 0,
    currentCooldown: 0,
    lastUsedTurn: null,
    effect: {
      type: 'first-strike',
      value: 50,
      metadata: { missiles: 10, targets: 3 },
    },
    targetType: 'all-enemies',
    category: 'military',
    requirements: [
      {
        type: 'min-turn',
        value: 10,
        description: 'Nuclear stockpile must be ready',
      },
    ],
  },

  'Krazy Re-Entry': {
    id: 'reentry_wild_card',
    name: '🎪 Wild Card',
    description: 'Completely random effect: Could be massively beneficial, catastrophic, or bizarre. High risk, high reward!',
    icon: '🎪',
    maxUses: 2,
    usesRemaining: 2,
    cooldownTurns: 5,
    currentCooldown: 0,
    lastUsedTurn: null,
    effect: {
      type: 'reality-warp',
      value: 0,
      metadata: { random: true },
    },
    targetType: 'global',
    category: 'special',
    requirements: [],
  },

  'Odd\'n Wild Card': {
    id: 'wildcard_gambit',
    name: '🃏 Ultimate Gambit',
    description: 'Bet everything on a coin flip: Win = double all resources and +50 to all relationships. Lose = halve all resources.',
    icon: '🃏',
    maxUses: 1,
    usesRemaining: 1,
    cooldownTurns: 0,
    currentCooldown: 0,
    lastUsedTurn: null,
    effect: {
      type: 'reality-warp',
      value: 0,
      metadata: { coinFlip: true },
    },
    targetType: 'self',
    category: 'special',
    requirements: [],
  },

  'Oil-Stain Lint-Off': {
    id: 'lintoff_oligarch_power',
    name: '💼 Oligarch Network',
    description: 'Activate oligarch network: Steal 200 production from all nations, gain 300 gold, and corrupt 2 enemy officials.',
    icon: '💼',
    maxUses: 1,
    usesRemaining: 1,
    cooldownTurns: 0,
    currentCooldown: 0,
    lastUsedTurn: null,
    effect: {
      type: 'steal-resources',
      value: 200,
      metadata: { goldGain: 300, corruption: 2 },
    },
    targetType: 'all-nations',
    category: 'economic',
    requirements: [],
  },

  'Ruin Annihilator': {
    id: 'annihilator_scorched_earth',
    name: '💀 Total Annihilation',
    description: 'Embrace the apocalypse: Deal 200% damage to all enemies, but lose 30% of own population. No turning back.',
    icon: '💀',
    maxUses: 1,
    usesRemaining: 1,
    cooldownTurns: 0,
    currentCooldown: 0,
    lastUsedTurn: null,
    effect: {
      type: 'first-strike',
      value: 200,
      metadata: { selfDamage: 30 },
    },
    targetType: 'all-enemies',
    category: 'military',
    requirements: [
      {
        type: 'min-turn',
        value: 15,
        description: 'Only in late game when all hope is lost',
      },
    ],
  },
};

/**
 * Get ability for a leader
 */
export function getLeaderAbility(leaderName: string): LeaderAbility | null {
  return LEADER_ABILITIES[leaderName] || null;
}

/**
 * Get all ability names for dropdown/selection
 */
export function getAllLeaderAbilityNames(): string[] {
  return Object.keys(LEADER_ABILITIES);
}

/**
 * Check if a leader has an activatable ability
 */
export function hasActivatableAbility(leaderName: string): boolean {
  return leaderName in LEADER_ABILITIES;
}
