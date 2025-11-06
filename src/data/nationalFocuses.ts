/**
 * National Focus Trees Data
 *
 * Defines focus trees for all nations with branching strategic paths.
 */

import { NationalFocus, FocusPath } from '../types/nationalFocus';

/**
 * Common focuses available to all nations
 */
export const COMMON_FOCUSES: NationalFocus[] = [
  // ==========================================
  // DIPLOMATIC PATH (Column 0)
  // ==========================================

  {
    id: 'diplomatic_outreach',
    name: 'Diplomatic Outreach',
    description: 'Expand diplomatic relations. +10 influence, +1 diplomacy/turn.',
    icon: '🤝',
    column: 0,
    row: 0,
    prerequisites: [],
    mutuallyExclusive: [],
    ppCost: 35,
    completionTime: 5,
    effects: [
      {
        type: 'diplomatic_bonus',
        statChanges: {
          influenceBonus: 10,
          diplomacyPerTurn: 1,
        },
        message: 'Diplomatic outreach successful! Gained influence and diplomacy.',
      },
    ],
  },

  {
    id: 'alliance_network',
    name: 'Alliance Network',
    description: 'Build network of alliances. +15 influence, alliance forming easier.',
    icon: '🌐',
    column: 0,
    row: 1,
    prerequisites: ['diplomatic_outreach'],
    mutuallyExclusive: ['isolationism'],
    ppCost: 50,
    completionTime: 7,
    effects: [
      {
        type: 'diplomatic_bonus',
        statChanges: {
          influenceBonus: 15,
        },
        message: 'Alliance network established! Forming alliances is now easier.',
      },
    ],
  },

  {
    id: 'united_nations_founding',
    name: 'United Nations Founding',
    description: 'Found international organization. Enables diplomatic victory path.',
    icon: '🏛️',
    column: 0,
    row: 2,
    prerequisites: ['alliance_network'],
    mutuallyExclusive: [],
    ppCost: 100,
    completionTime: 10,
    eraRequirement: 15,
    effects: [
      {
        type: 'unlock',
        unlocks: {
          victoryPaths: ['diplomatic_victory'],
        },
        message: 'United Nations founded! Diplomatic victory path unlocked.',
      },
    ],
  },

  {
    id: 'isolationism',
    name: 'Isolationism',
    description: 'Focus on national interests. +20% production, cannot form alliances.',
    icon: '🏴',
    column: 0,
    row: 1,
    prerequisites: ['diplomatic_outreach'],
    mutuallyExclusive: ['alliance_network'],
    ppCost: 50,
    completionTime: 6,
    effects: [
      {
        type: 'production_bonus',
        statChanges: {
          productionMultiplier: 1.2,
        },
        message: 'Isolationist policy adopted! Production increased.',
      },
    ],
  },

  // ==========================================
  // ECONOMIC PATH (Column 1)
  // ==========================================

  {
    id: 'industrial_expansion',
    name: 'Industrial Expansion',
    description: 'Expand industrial base. +2 production lines, +15% production.',
    icon: '🏭',
    column: 1,
    row: 0,
    prerequisites: [],
    mutuallyExclusive: [],
    ppCost: 35,
    completionTime: 5,
    effects: [
      {
        type: 'production_bonus',
        statChanges: {
          productionLines: 2,
          productionMultiplier: 1.15,
        },
        message: 'Industrial expansion complete! Production capacity increased.',
      },
    ],
  },

  {
    id: 'research_investment',
    name: 'Research Investment',
    description: 'Invest in science. +20% research speed, unlock research labs.',
    icon: '🔬',
    column: 1,
    row: 1,
    prerequisites: ['industrial_expansion'],
    mutuallyExclusive: [],
    ppCost: 50,
    completionTime: 7,
    effects: [
      {
        type: 'research_bonus',
        statChanges: {
          researchMultiplier: 1.2,
        },
        unlocks: {
          buildings: ['research_lab'],
        },
        message: 'Research investment approved! Research speed increased.',
      },
    ],
  },

  {
    id: 'trade_network',
    name: 'Trade Network',
    description: 'Establish trade routes. +20 gold/turn, enable trade system.',
    icon: '💰',
    column: 1,
    row: 2,
    prerequisites: ['research_investment'],
    mutuallyExclusive: [],
    ppCost: 75,
    completionTime: 8,
    effects: [
      {
        type: 'resource_bonus',
        statChanges: {
          goldPerTurn: 20,
        },
        message: 'Trade network established! Gold income increased.',
      },
    ],
  },

  {
    id: 'economic_superpower',
    name: 'Economic Superpower',
    description: 'Become economic leader. +25% production, +3 PP/turn.',
    icon: '💎',
    column: 1,
    row: 3,
    prerequisites: ['trade_network'],
    mutuallyExclusive: [],
    ppCost: 100,
    completionTime: 10,
    eraRequirement: 20,
    effects: [
      {
        type: 'production_bonus',
        statChanges: {
          productionMultiplier: 1.25,
          ppPerTurn: 3,
        },
        message: 'Economic superpower achieved! Massive bonuses gained.',
      },
    ],
  },

  // ==========================================
  // INTELLIGENCE PATH (Column 2)
  // ==========================================

  {
    id: 'intelligence_agency',
    name: 'Intelligence Agency',
    description: 'Found intelligence agency. +10 intel/turn, unlock spy operations.',
    icon: '🕵️',
    column: 2,
    row: 0,
    prerequisites: [],
    mutuallyExclusive: [],
    ppCost: 35,
    completionTime: 5,
    effects: [
      {
        type: 'resource_bonus',
        statChanges: {
          intelPerTurn: 10,
        },
        unlocks: {
          buildings: ['intel_facility'],
        },
        message: 'Intelligence agency founded! Intel generation increased.',
      },
    ],
  },

  {
    id: 'cyber_warfare_division',
    name: 'Cyber Warfare Division',
    description: 'Establish cyber warfare unit. +20 cyber attack/defense.',
    icon: '💻',
    column: 2,
    row: 1,
    prerequisites: ['intelligence_agency'],
    mutuallyExclusive: [],
    ppCost: 50,
    completionTime: 7,
    eraRequirement: 11,
    effects: [
      {
        type: 'unlock',
        unlocks: {
          buildings: ['cyber_center'],
        },
        message: 'Cyber warfare division established! Cyber capabilities enhanced.',
      },
    ],
  },

  {
    id: 'satellite_network',
    name: 'Satellite Network',
    description: 'Deploy spy satellites. Reveal enemy territories, +20 intel/turn.',
    icon: '🛰️',
    column: 2,
    row: 2,
    prerequisites: ['cyber_warfare_division'],
    mutuallyExclusive: [],
    ppCost: 75,
    completionTime: 8,
    eraRequirement: 11,
    effects: [
      {
        type: 'resource_bonus',
        statChanges: {
          intelPerTurn: 20,
        },
        unlocks: {
          buildings: ['satellite'],
        },
        message: 'Satellite network deployed! Intelligence capabilities enhanced.',
      },
    ],
  },

  {
    id: 'total_information_awareness',
    name: 'Total Information Awareness',
    description: 'Achieve intelligence supremacy. See all enemy actions, +40 intel/turn.',
    icon: '👁️',
    column: 2,
    row: 3,
    prerequisites: ['satellite_network'],
    mutuallyExclusive: [],
    ppCost: 100,
    completionTime: 10,
    eraRequirement: 25,
    effects: [
      {
        type: 'resource_bonus',
        statChanges: {
          intelPerTurn: 40,
        },
        message: 'Total information awareness achieved! All enemy actions revealed.',
      },
    ],
  },

  // ==========================================
  // MILITARY PATH (Column 3)
  // ==========================================

  {
    id: 'nuclear_doctrine',
    name: 'Nuclear Doctrine',
    description: 'Develop nuclear strategy. +2 missile capacity, +15% missile damage.',
    icon: '☢️',
    column: 3,
    row: 0,
    prerequisites: [],
    mutuallyExclusive: [],
    ppCost: 35,
    completionTime: 5,
    effects: [
      {
        type: 'military_bonus',
        statChanges: {
          missileCapacity: 2,
        },
        message: 'Nuclear doctrine developed! Missile capacity increased.',
      },
    ],
  },

  {
    id: 'expanded_arsenal',
    name: 'Expanded Arsenal',
    description: 'Expand military production. +3 production lines (military only).',
    icon: '🚀',
    column: 3,
    row: 1,
    prerequisites: ['nuclear_doctrine'],
    mutuallyExclusive: [],
    ppCost: 50,
    completionTime: 7,
    effects: [
      {
        type: 'production_bonus',
        statChanges: {
          productionLines: 3,
        },
        message: 'Arsenal expanded! More production lines available.',
      },
    ],
  },

  {
    id: 'first_strike_capability',
    name: 'First Strike Capability',
    description: 'Develop first strike doctrine. -25% missile build time.',
    icon: '⚡',
    column: 3,
    row: 2,
    prerequisites: ['expanded_arsenal'],
    mutuallyExclusive: ['defensive_posture'],
    ppCost: 75,
    completionTime: 8,
    effects: [
      {
        type: 'military_bonus',
        message: 'First strike capability achieved! Missile production faster.',
      },
    ],
  },

  {
    id: 'defensive_posture',
    name: 'Defensive Posture',
    description: 'Focus on defense. +50% ABM effectiveness, -25% nuke damage taken.',
    icon: '🛡️',
    column: 3,
    row: 2,
    prerequisites: ['expanded_arsenal'],
    mutuallyExclusive: ['first_strike_capability'],
    ppCost: 75,
    completionTime: 8,
    effects: [
      {
        type: 'military_bonus',
        message: 'Defensive posture adopted! Defense capabilities enhanced.',
      },
    ],
  },

  {
    id: 'total_war_mobilization',
    name: 'Total War Mobilization',
    description: 'Full war economy. +30% military production.',
    icon: '⚔️',
    column: 3,
    row: 3,
    prerequisites: ['first_strike_capability', 'defensive_posture'],
    mutuallyExclusive: [],
    ppCost: 100,
    completionTime: 10,
    eraRequirement: 15,
    effects: [
      {
        type: 'production_bonus',
        statChanges: {
          productionMultiplier: 1.3,
        },
        message: 'Total war mobilization! Military production massively increased.',
      },
    ],
  },
];

/**
 * Nation-specific focuses (United States)
 */
export const USA_FOCUSES: NationalFocus[] = [
  {
    id: 'usa_manhattan_project_ii',
    name: 'Manhattan Project II',
    description: 'Resume nuclear weapons program. -50% nuke costs, +3 missile capacity.',
    icon: '☢️',
    column: 4,
    row: 1,
    prerequisites: ['nuclear_doctrine'],
    mutuallyExclusive: [],
    ppCost: 100,
    completionTime: 10,
    nationSpecific: ['usa'],
    eraRequirement: 15,
    effects: [
      {
        type: 'military_bonus',
        statChanges: {
          missileCapacity: 3,
        },
        message: 'Manhattan Project II launched! Nuclear capabilities greatly enhanced.',
      },
    ],
  },

  {
    id: 'usa_nato_leadership',
    name: 'NATO Leadership',
    description: 'Lead NATO alliance. +30 influence, +10% ally military strength.',
    icon: '🌐',
    column: 4,
    row: 0,
    prerequisites: ['alliance_network'],
    mutuallyExclusive: [],
    ppCost: 75,
    completionTime: 8,
    nationSpecific: ['usa'],
    effects: [
      {
        type: 'diplomatic_bonus',
        statChanges: {
          influenceBonus: 30,
        },
        message: 'NATO leadership secured! Alliance strength increased.',
      },
    ],
  },
];

/**
 * Nation-specific focuses (USSR/Russia)
 */
export const USSR_FOCUSES: NationalFocus[] = [
  {
    id: 'ussr_sputnik_program',
    name: 'Sputnik Program',
    description: 'Launch satellite program early. Unlock satellites, +30 science.',
    icon: '🛰️',
    column: 4,
    row: 0,
    prerequisites: ['intelligence_agency'],
    mutuallyExclusive: [],
    ppCost: 75,
    completionTime: 8,
    nationSpecific: ['ussr', 'russia'],
    effects: [
      {
        type: 'research_bonus',
        statChanges: {
          researchMultiplier: 1.3,
        },
        unlocks: {
          buildings: ['satellite'],
        },
        message: 'Sputnik program launched! Satellites unlocked early.',
      },
    ],
  },

  {
    id: 'ussr_iron_curtain',
    name: 'Iron Curtain',
    description: 'Establish sphere of influence. +25 influence, bonus in allied territories.',
    icon: '🏴',
    column: 4,
    row: 1,
    prerequisites: ['alliance_network'],
    mutuallyExclusive: [],
    ppCost: 80,
    completionTime: 8,
    nationSpecific: ['ussr', 'russia'],
    effects: [
      {
        type: 'diplomatic_bonus',
        statChanges: {
          influenceBonus: 25,
        },
        message: 'Iron Curtain established! Sphere of influence secured.',
      },
    ],
  },
];

/**
 * Nation-specific focuses (China)
 */
export const CHINA_FOCUSES: NationalFocus[] = [
  {
    id: 'china_belt_and_road',
    name: 'Belt and Road Initiative',
    description: 'Massive trade network. +4 trade routes, +30 influence.',
    icon: '🛤️',
    column: 4,
    row: 0,
    prerequisites: ['trade_network'],
    mutuallyExclusive: [],
    ppCost: 85,
    completionTime: 9,
    nationSpecific: ['china'],
    eraRequirement: 10,
    effects: [
      {
        type: 'resource_bonus',
        statChanges: {
          goldPerTurn: 30,
          influenceBonus: 30,
        },
        message: 'Belt and Road Initiative launched! Massive economic benefits.',
      },
    ],
  },

  {
    id: 'china_great_leap_forward',
    name: 'New Great Leap Forward',
    description: 'Industrial revolution. +35% production, +3 production lines.',
    icon: '🏭',
    column: 4,
    row: 1,
    prerequisites: ['industrial_expansion'],
    mutuallyExclusive: [],
    ppCost: 90,
    completionTime: 10,
    nationSpecific: ['china'],
    effects: [
      {
        type: 'production_bonus',
        statChanges: {
          productionMultiplier: 1.35,
          productionLines: 3,
        },
        message: 'New Great Leap Forward! Massive industrial growth.',
      },
    ],
  },
];

/**
 * Get all focuses for a nation
 */
export function getFocusesForNation(nationId: string): NationalFocus[] {
  let focuses = [...COMMON_FOCUSES];

  // Add nation-specific focuses
  if (nationId === 'usa') {
    focuses = [...focuses, ...USA_FOCUSES];
  } else if (nationId === 'ussr' || nationId === 'russia') {
    focuses = [...focuses, ...USSR_FOCUSES];
  } else if (nationId === 'china') {
    focuses = [...focuses, ...CHINA_FOCUSES];
  }

  return focuses;
}

/**
 * Get focus by ID
 */
export function getFocus(focusId: string, nationId?: string): NationalFocus | undefined {
  const allFocuses = nationId ? getFocusesForNation(nationId) : COMMON_FOCUSES;
  return allFocuses.find((focus) => focus.id === focusId);
}

/**
 * Get focuses by path (column)
 */
export function getFocusesByPath(path: FocusPath, nationId?: string): NationalFocus[] {
  const allFocuses = nationId ? getFocusesForNation(nationId) : COMMON_FOCUSES;
  const columnMap: Record<FocusPath, number> = {
    [FocusPath.DIPLOMATIC]: 0,
    [FocusPath.ECONOMIC]: 1,
    [FocusPath.INTELLIGENCE]: 2,
    [FocusPath.MILITARY]: 3,
    [FocusPath.SPECIAL]: 4,
  };

  return allFocuses.filter((focus) => focus.column === columnMap[path]);
}
