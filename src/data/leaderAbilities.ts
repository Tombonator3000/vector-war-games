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
  // COLD WAR ERA LEADERS (HISTORICAL EXPANSION)
  // ============================================================================

  'Ronald Reagan': {
    id: 'reagan_star_wars',
    name: '🛡️ Star Wars Initiative',
    description: 'Deploy Strategic Defense Initiative: gain complete missile immunity for 3 turns and boost morale by +40.',
    icon: '🛡️',
    maxUses: 1,
    usesRemaining: 1,
    cooldownTurns: 0,
    currentCooldown: 0,
    lastUsedTurn: null,
    effect: {
      type: 'missile-shield',
      duration: 3,
      value: 40,
    },
    targetType: 'self',
    category: 'military',
    requirements: [
      {
        type: 'min-turn',
        value: 5,
        description: 'SDI requires advanced technology (turn 5+)',
      },
    ],
  },

  'Mikhail Gorbachev': {
    id: 'gorbachev_glasnost',
    name: '🕊️ Glasnost & Perestroika',
    description: 'Launch sweeping reforms: +40 relations with all nations, boost production by +75% for 4 turns, and enable arms treaties.',
    icon: '🕊️',
    maxUses: 1,
    usesRemaining: 1,
    cooldownTurns: 0,
    currentCooldown: 0,
    lastUsedTurn: null,
    effect: {
      type: 'boost-relationships',
      value: 40,
      metadata: { productionBoost: 75, duration: 4 },
    },
    targetType: 'all-nations',
    category: 'diplomatic',
    requirements: [],
  },

  'Margaret Thatcher': {
    id: 'thatcher_iron_resolve',
    name: '⚔️ Iron Lady\'s Resolve',
    description: 'Demonstrate unwavering strength: +100% defense for 3 turns, boost public morale by +50, and deter aggression.',
    icon: '⚔️',
    maxUses: 1,
    usesRemaining: 1,
    cooldownTurns: 0,
    currentCooldown: 0,
    lastUsedTurn: null,
    effect: {
      type: 'tactical-advantage',
      duration: 3,
      value: 100,
    },
    targetType: 'self',
    category: 'military',
    requirements: [],
  },

  'Mao Zedong': {
    id: 'mao_peoples_war',
    name: '🔴 People\'s War',
    description: 'Mobilize the masses: gain 5 free missiles, +80 morale, and +150% production for 3 turns through collective action.',
    icon: '🔴',
    maxUses: 1,
    usesRemaining: 1,
    cooldownTurns: 0,
    currentCooldown: 0,
    lastUsedTurn: null,
    effect: {
      type: 'rapid-mobilization',
      duration: 3,
      value: 150,
      metadata: { freeMissiles: 5 },
    },
    targetType: 'self',
    category: 'military',
    requirements: [],
  },

  'Charles de Gaulle': {
    id: 'degaulle_force_de_frappe',
    name: '⚛️ Force de Frappe',
    description: 'Deploy independent nuclear deterrent: gain +3 ICBMs and +50% missile effectiveness permanently.',
    icon: '⚛️',
    maxUses: 1,
    usesRemaining: 1,
    cooldownTurns: 0,
    currentCooldown: 0,
    lastUsedTurn: null,
    effect: {
      type: 'emergency-funding',
      value: 3,
      metadata: { missileBonus: true },
    },
    targetType: 'self',
    category: 'military',
    requirements: [
      {
        type: 'min-turn',
        value: 6,
        description: 'French nuclear program requires development time',
      },
    ],
  },

  'Indira Gandhi': {
    id: 'gandhi_non_aligned',
    name: '⚖️ Non-Aligned Leadership',
    description: 'Lead the Non-Aligned Movement: +30 relations with all nations and gain strategic independence bonuses.',
    icon: '⚖️',
    maxUses: 2,
    usesRemaining: 2,
    cooldownTurns: 8,
    currentCooldown: 0,
    lastUsedTurn: null,
    effect: {
      type: 'boost-relationships',
      value: 30,
    },
    targetType: 'all-nations',
    category: 'diplomatic',
    requirements: [],
  },

  'Leonid Brezhnev': {
    id: 'brezhnev_doctrine',
    name: '🔨 Brezhnev Doctrine',
    description: 'Assert Soviet dominance: launch devastating strike with +110% effectiveness and intimidate nearby nations.',
    icon: '🔨',
    maxUses: 1,
    usesRemaining: 1,
    cooldownTurns: 0,
    currentCooldown: 0,
    lastUsedTurn: null,
    effect: {
      type: 'first-strike',
      duration: 1,
      value: 110,
    },
    targetType: 'single-nation',
    category: 'military',
    requirements: [],
  },

  'Richard Nixon': {
    id: 'nixon_détente',
    name: '🤝 Détente Diplomacy',
    description: 'Open diplomatic channels: +35 relations globally, enable arms control treaties, and surprise rivals with new alliances.',
    icon: '🤝',
    maxUses: 1,
    usesRemaining: 1,
    cooldownTurns: 0,
    currentCooldown: 0,
    lastUsedTurn: null,
    effect: {
      type: 'boost-relationships',
      value: 35,
    },
    targetType: 'all-nations',
    category: 'diplomatic',
    requirements: [],
  },

  'Jimmy Carter': {
    id: 'carter_human_rights',
    name: '📜 Human Rights Initiative',
    description: 'Champion global rights: +25 relations with all nations, boost morale by +60, and enable peace negotiations.',
    icon: '📜',
    maxUses: 2,
    usesRemaining: 2,
    cooldownTurns: 7,
    currentCooldown: 0,
    lastUsedTurn: null,
    effect: {
      type: 'boost-relationships',
      value: 25,
      metadata: { moraleBoost: 60 },
    },
    targetType: 'all-nations',
    category: 'diplomatic',
    requirements: [
      {
        type: 'at-peace',
        value: 1,
        description: 'Human rights focus requires peaceful conditions',
      },
    ],
  },

  'Dwight D. Eisenhower': {
    id: 'eisenhower_new_look',
    name: '☢️ New Look Doctrine',
    description: 'Implement cost-effective deterrence: reduce military costs by 40% for 5 turns while maintaining nuclear superiority.',
    icon: '☢️',
    maxUses: 1,
    usesRemaining: 1,
    cooldownTurns: 0,
    currentCooldown: 0,
    lastUsedTurn: null,
    effect: {
      type: 'tactical-advantage',
      duration: 5,
      value: 40,
    },
    targetType: 'self',
    category: 'economic',
    requirements: [],
  },

  'Lyndon B. Johnson': {
    id: 'johnson_great_society',
    name: '🏛️ Great Society',
    description: 'Massive domestic investment: +120% production for 4 turns and +50 morale through social programs.',
    icon: '🏛️',
    maxUses: 1,
    usesRemaining: 1,
    cooldownTurns: 0,
    currentCooldown: 0,
    lastUsedTurn: null,
    effect: {
      type: 'economic-boom',
      duration: 4,
      value: 120,
    },
    targetType: 'self',
    category: 'economic',
    requirements: [],
  },

  'Gerald Ford': {
    id: 'ford_steady_hand',
    name: '🛡️ Steady Leadership',
    description: 'Maintain stability: +30 morale, improve defenses by +60% for 3 turns, and avoid rash decisions.',
    icon: '🛡️',
    maxUses: 1,
    usesRemaining: 1,
    cooldownTurns: 0,
    currentCooldown: 0,
    lastUsedTurn: null,
    effect: {
      type: 'tactical-advantage',
      duration: 3,
      value: 60,
    },
    targetType: 'self',
    category: 'military',
    requirements: [],
  },

  'Winston Churchill': {
    id: 'churchill_bulldog_defense',
    name: '🛡️ Britain Stands Alone',
    description: 'Activate integrated air defense network granting complete missile immunity for 2 turns and rallying morale.',
    icon: '🛡️',
    maxUses: 1,
    usesRemaining: 1,
    cooldownTurns: 0,
    currentCooldown: 0,
    lastUsedTurn: null,
    effect: {
      type: 'missile-shield',
      duration: 2,
    },
    targetType: 'self',
    category: 'military',
    requirements: [
      {
        type: 'min-turn',
        value: 4,
        description: 'Requires early warning networks to be established (turn 4+)',
      },
    ],
  },

  'Harry S. Truman': {
    id: 'truman_containment_airlift',
    name: '✈️ Berlin Airlift',
    description: 'Mobilize a rapid logistics surge: gain 2 free missiles, +50 morale, and -25% unit costs for 4 turns.',
    icon: '✈️',
    maxUses: 1,
    usesRemaining: 1,
    cooldownTurns: 0,
    currentCooldown: 0,
    lastUsedTurn: null,
    effect: {
      type: 'rapid-mobilization',
      duration: 4,
      value: 25,
      metadata: { freeMissiles: 2 },
    },
    targetType: 'self',
    category: 'military',
    requirements: [],
  },

  'Joseph Stalin': {
    id: 'stalin_iron_fist',
    name: '🔨 Red Army Surge',
    description: 'Launch an overwhelming first strike with +120% effectiveness and -50% enemy defense for the opening blow.',
    icon: '🔨',
    maxUses: 1,
    usesRemaining: 1,
    cooldownTurns: 0,
    currentCooldown: 0,
    lastUsedTurn: null,
    effect: {
      type: 'first-strike',
      duration: 1,
      value: 120,
      metadata: { defensePenalty: 0.5 },
    },
    targetType: 'single-nation',
    category: 'military',
    requirements: [],
  },

  'Pierre Trudeau': {
    id: 'trudeau_peacekeeping',
    name: '🕊️ Peacekeeping Mandate',
    description: 'Deploy UN peacekeepers: improve relations with all nations by +25 and secure alliances with friendly states.',
    icon: '🕊️',
    maxUses: 1,
    usesRemaining: 1,
    cooldownTurns: 0,
    currentCooldown: 0,
    lastUsedTurn: null,
    effect: {
      type: 'boost-relationships',
      value: 25,
    },
    targetType: 'all-nations',
    category: 'diplomatic',
    requirements: [
      {
        type: 'at-peace',
        value: 1,
        description: 'Cannot be at war while dispatching peacekeepers',
      },
    ],
  },

  'Zhou Enlai': {
    id: 'zhou_bandung_initiative',
    name: '🤝 Bandung Initiative',
    description: 'Lead a conference of the non-aligned: +20 relations globally and easier alliance formation for 2 attempts.',
    icon: '🤝',
    maxUses: 2,
    usesRemaining: 2,
    cooldownTurns: 8,
    currentCooldown: 0,
    lastUsedTurn: null,
    effect: {
      type: 'boost-relationships',
      value: 20,
    },
    targetType: 'all-nations',
    category: 'diplomatic',
    requirements: [
      {
        type: 'min-turn',
        value: 6,
        description: 'Requires diplomatic groundwork (turn 6+)',
      },
    ],
  },

  'Deng Xiaoping': {
    id: 'deng_reform_and_opening',
    name: '📈 Reform and Opening',
    description: 'Trigger sweeping market reforms: +150% production for 4 turns and accelerate modernization programs.',
    icon: '📈',
    maxUses: 1,
    usesRemaining: 1,
    cooldownTurns: 0,
    currentCooldown: 0,
    lastUsedTurn: null,
    effect: {
      type: 'economic-boom',
      duration: 4,
      value: 150,
    },
    targetType: 'self',
    category: 'economic',
    requirements: [
      {
        type: 'min-turn',
        value: 8,
        description: 'Reforms require mid-game setup (turn 8+)',
      },
    ],
  },

  'Ho Chi Minh': {
    id: 'ho_jungle_networks',
    name: '🌲 Jungle Networks',
    description: 'Unleash coordinated propaganda and guerrilla operations: target loses 40 morale and global trust.',
    icon: '🌲',
    maxUses: 2,
    usesRemaining: 2,
    cooldownTurns: 7,
    currentCooldown: 0,
    lastUsedTurn: null,
    effect: {
      type: 'propaganda-wave',
      value: 40,
    },
    targetType: 'single-nation',
    category: 'intelligence',
    requirements: [
      {
        type: 'at-war',
        value: 1,
        description: 'Requires active conflict to mobilize guerrillas',
      },
    ],
  },

  'Josip Broz Tito': {
    id: 'tito_non_aligned_pact',
    name: '⚖️ Non-Aligned Charter',
    description: 'Broker a non-aligned summit: +20 relations with all nations and temporary immunity from alliance pressure.',
    icon: '⚖️',
    maxUses: 2,
    usesRemaining: 2,
    cooldownTurns: 6,
    currentCooldown: 0,
    lastUsedTurn: null,
    effect: {
      type: 'boost-relationships',
      value: 20,
    },
    targetType: 'all-nations',
    category: 'diplomatic',
    requirements: [],
  },

  'Gamal Abdel Nasser': {
    id: 'nasser_suez_crisis',
    name: '🚢 Nationalize the Canal',
    description: 'Seize strategic assets from a rival: steal up to 75 Intel and 100 Production while destabilizing their alliances.',
    icon: '🚢',
    maxUses: 1,
    usesRemaining: 1,
    cooldownTurns: 0,
    currentCooldown: 0,
    lastUsedTurn: null,
    effect: {
      type: 'steal-resources',
      value: 100,
      metadata: { intelSteal: 75, productionSteal: 100 },
    },
    targetType: 'single-nation',
    category: 'economic',
    requirements: [
      {
        type: 'min-turn',
        value: 5,
        description: 'Canal nationalization requires buildup (turn 5+)',
      },
    ],
  },

  'Jawaharlal Nehru': {
    id: 'nehru_five_year_plan',
    name: '🏛️ Five-Year Plan',
    description: 'Implement nationwide development drive: +100% production for 3 turns and stabilize domestic support.',
    icon: '🏛️',
    maxUses: 1,
    usesRemaining: 1,
    cooldownTurns: 0,
    currentCooldown: 0,
    lastUsedTurn: null,
    effect: {
      type: 'economic-boom',
      duration: 3,
      value: 100,
    },
    targetType: 'self',
    category: 'economic',
    requirements: [],
  },

  'Konrad Adenauer': {
    id: 'adenauer_wirtschaftswunder',
    name: '💶 Wirtschaftswunder',
    description: 'Kickstart the economic miracle: +125% production for 4 turns and attract foreign investment.',
    icon: '💶',
    maxUses: 1,
    usesRemaining: 1,
    cooldownTurns: 0,
    currentCooldown: 0,
    lastUsedTurn: null,
    effect: {
      type: 'economic-boom',
      duration: 4,
      value: 125,
    },
    targetType: 'self',
    category: 'economic',
    requirements: [],
  },

  'Willy Brandt': {
    id: 'brandt_ostpolitik',
    name: '🌉 Ostpolitik',
    description: 'Open Eastern channels: +35 relations with all nations and immediate alliance checks with neighbors.',
    icon: '🌉',
    maxUses: 1,
    usesRemaining: 1,
    cooldownTurns: 0,
    currentCooldown: 0,
    lastUsedTurn: null,
    effect: {
      type: 'boost-relationships',
      value: 35,
    },
    targetType: 'all-nations',
    category: 'diplomatic',
    requirements: [
      {
        type: 'at-peace',
        value: 1,
        description: 'Dialogue requires peace-time conditions',
      },
    ],
  },

  'Helmut Kohl': {
    id: 'kohl_reunification',
    name: '🕯️ Peaceful Revolution',
    description: 'Freeze hostilities for 3 turns while reunification is secured, improving relations with former adversaries.',
    icon: '🕯️',
    maxUses: 1,
    usesRemaining: 1,
    cooldownTurns: 0,
    currentCooldown: 0,
    lastUsedTurn: null,
    effect: {
      type: 'force-peace',
      duration: 3,
    },
    targetType: 'all-enemies',
    category: 'diplomatic',
    requirements: [
      {
        type: 'min-turn',
        value: 10,
        description: 'Requires late-Cold War conditions (turn 10+)',
      },
    ],
  },

  'François Mitterrand': {
    id: 'mitterrand_grand_projects',
    name: '🏗️ Grand Projects',
    description: 'Launch ambitious modernization drive: +120% production for 3 turns and unlock key strategic technologies.',
    icon: '🏗️',
    maxUses: 1,
    usesRemaining: 1,
    cooldownTurns: 0,
    currentCooldown: 0,
    lastUsedTurn: null,
    effect: {
      type: 'economic-boom',
      duration: 3,
      value: 120,
      metadata: { unlockAllTech: true },
    },
    targetType: 'self',
    category: 'economic',
    requirements: [],
  },

  'Sukarno': {
    id: 'sukarno_guided_democracy',
    name: '🔥 Guided Democracy',
    description: 'Flood target with revolutionary propaganda: -35 relationship from all nations toward them and destabilize rule.',
    icon: '🔥',
    maxUses: 2,
    usesRemaining: 2,
    cooldownTurns: 6,
    currentCooldown: 0,
    lastUsedTurn: null,
    effect: {
      type: 'propaganda-wave',
      value: 35,
    },
    targetType: 'single-nation',
    category: 'intelligence',
    requirements: [
      {
        type: 'min-turn',
        value: 5,
        description: 'Requires regional tensions to peak (turn 5+)',
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
