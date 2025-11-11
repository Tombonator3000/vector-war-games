/**
 * Military Templates Data
 *
 * Pre-defined unit components and default templates for division designer.
 */

import {
  UnitComponent,
  UnitComponentData,
  MilitaryTemplate,
  TemplateSize,
} from '../types/militaryTemplates';

/**
 * Unit component database
 */
export const UNIT_COMPONENTS: Record<UnitComponent, UnitComponentData> = {
  infantry_battalion: {
    type: 'infantry_battalion',
    name: 'Infantry Battalion',
    description: 'Standard infantry unit, good for defense and occupation',
    icon: '🪖',
    manpower: 1000,
    production: 50,
    softAttack: 15,
    hardAttack: 2,
    airAttack: 1,
    defense: 30,
    breakthrough: 10,
    armor: 0,
    piercing: 5,
    organization: 60,
    recovery: 10,
    reconnaissance: 2,
    suppression: 10,
    supplyUse: 10,
    speed: 4,
    reliability: 90,
    combatWidth: 2,
  },
  mechanized_battalion: {
    type: 'mechanized_battalion',
    name: 'Mechanized Battalion',
    description: 'Mobile infantry in armored vehicles, fast and well-protected',
    icon: '🚛',
    manpower: 800,
    production: 120,
    softAttack: 20,
    hardAttack: 8,
    airAttack: 3,
    defense: 40,
    breakthrough: 25,
    armor: 15,
    piercing: 20,
    organization: 50,
    recovery: 12,
    reconnaissance: 5,
    suppression: 8,
    supplyUse: 20,
    speed: 8,
    reliability: 85,
    combatWidth: 2,
  },
  armor_battalion: {
    type: 'armor_battalion',
    name: 'Armor Battalion',
    description: 'Heavy tanks, devastating breakthrough capability',
    icon: '🛡️',
    manpower: 500,
    production: 200,
    softAttack: 10,
    hardAttack: 50,
    airAttack: 0,
    defense: 30,
    breakthrough: 60,
    armor: 80,
    piercing: 60,
    organization: 30,
    recovery: 8,
    reconnaissance: 3,
    suppression: 3,
    supplyUse: 40,
    speed: 6,
    reliability: 75,
    combatWidth: 2,
  },
  artillery_battalion: {
    type: 'artillery_battalion',
    name: 'Artillery Battalion',
    description: 'Long-range fire support, excellent soft attack',
    icon: '🎯',
    manpower: 600,
    production: 100,
    softAttack: 50,
    hardAttack: 5,
    airAttack: 0,
    defense: 10,
    breakthrough: 5,
    armor: 0,
    piercing: 10,
    organization: 40,
    recovery: 8,
    reconnaissance: 1,
    suppression: 5,
    supplyUse: 25,
    speed: 3,
    reliability: 80,
    combatWidth: 3,
  },
  anti_air_battalion: {
    type: 'anti_air_battalion',
    name: 'Anti-Air Battalion',
    description: 'Protects against air attacks',
    icon: '🎆',
    manpower: 400,
    production: 80,
    softAttack: 5,
    hardAttack: 2,
    airAttack: 50,
    defense: 15,
    breakthrough: 5,
    armor: 0,
    piercing: 15,
    organization: 40,
    recovery: 10,
    reconnaissance: 1,
    suppression: 3,
    supplyUse: 15,
    speed: 4,
    reliability: 85,
    combatWidth: 1,
  },
  anti_tank_battalion: {
    type: 'anti_tank_battalion',
    name: 'Anti-Tank Battalion',
    description: 'Specialized in destroying armored units',
    icon: '💥',
    manpower: 400,
    production: 90,
    softAttack: 5,
    hardAttack: 40,
    airAttack: 0,
    defense: 20,
    breakthrough: 10,
    armor: 5,
    piercing: 70,
    organization: 40,
    recovery: 10,
    reconnaissance: 2,
    suppression: 3,
    supplyUse: 15,
    speed: 4,
    reliability: 85,
    combatWidth: 1,
  },
  reconnaissance_company: {
    type: 'reconnaissance_company',
    name: 'Reconnaissance Company',
    description: 'Provides intelligence and scouting',
    icon: '🔭',
    manpower: 200,
    production: 40,
    softAttack: 2,
    hardAttack: 1,
    airAttack: 0,
    defense: 5,
    breakthrough: 3,
    armor: 0,
    piercing: 5,
    organization: 20,
    recovery: 15,
    reconnaissance: 20,
    suppression: 2,
    supplyUse: 8,
    speed: 10,
    reliability: 90,
    combatWidth: 0,
  },
  engineer_company: {
    type: 'engineer_company',
    name: 'Engineer Company',
    description: 'Improves mobility and reduces terrain penalties',
    icon: '🔧',
    manpower: 200,
    production: 50,
    softAttack: 5,
    hardAttack: 2,
    airAttack: 0,
    defense: 15,
    breakthrough: 5,
    armor: 0,
    piercing: 5,
    organization: 20,
    recovery: 12,
    reconnaissance: 3,
    suppression: 5,
    supplyUse: 10,
    speed: 4,
    reliability: 95,
    combatWidth: 0,
  },
  signal_company: {
    type: 'signal_company',
    name: 'Signal Company',
    description: 'Improves coordination and command',
    icon: '📡',
    manpower: 150,
    production: 30,
    softAttack: 1,
    hardAttack: 0,
    airAttack: 0,
    defense: 5,
    breakthrough: 2,
    armor: 0,
    piercing: 0,
    organization: 30,
    recovery: 15,
    reconnaissance: 10,
    suppression: 2,
    supplyUse: 5,
    speed: 4,
    reliability: 95,
    combatWidth: 0,
  },
  logistics_company: {
    type: 'logistics_company',
    name: 'Logistics Company',
    description: 'Reduces supply consumption',
    icon: '📦',
    manpower: 150,
    production: 40,
    softAttack: 1,
    hardAttack: 0,
    airAttack: 0,
    defense: 5,
    breakthrough: 2,
    armor: 0,
    piercing: 0,
    organization: 20,
    recovery: 10,
    reconnaissance: 2,
    suppression: 2,
    supplyUse: -15, // Reduces overall supply use!
    speed: 4,
    reliability: 95,
    combatWidth: 0,
  },
  military_police_company: {
    type: 'military_police_company',
    name: 'Military Police Company',
    description: 'Improves suppression and occupation control',
    icon: '👮',
    manpower: 200,
    production: 30,
    softAttack: 5,
    hardAttack: 1,
    airAttack: 0,
    defense: 10,
    breakthrough: 3,
    armor: 0,
    piercing: 2,
    organization: 25,
    recovery: 10,
    reconnaissance: 5,
    suppression: 30,
    supplyUse: 8,
    speed: 4,
    reliability: 90,
    combatWidth: 0,
  },
};

/**
 * Helper function to get unit component data
 */
export function getUnitComponentData(type: UnitComponent): UnitComponentData | undefined {
  return UNIT_COMPONENTS[type];
}

/**
 * Calculate total stats for a template
 */
export function calculateTemplateStats(
  mainComponents: UnitComponent[],
  supportComponents: UnitComponent[]
): MilitaryTemplate['stats'] {
  const allComponents = [...mainComponents, ...supportComponents];

  let stats: MilitaryTemplate['stats'] = {
    totalManpower: 0,
    totalProduction: 0,
    softAttack: 0,
    hardAttack: 0,
    airAttack: 0,
    defense: 0,
    breakthrough: 0,
    armor: 0,
    piercing: 0,
    organization: 0,
    recovery: 0,
    reconnaissance: 0,
    suppression: 0,
    supplyUse: 0,
    speed: 999, // Will take minimum
    reliability: 0,
    combatWidth: 0,
  };

  allComponents.forEach((comp) => {
    const data = getUnitComponentData(comp);
    if (!data) return;

    stats.totalManpower += data.manpower;
    stats.totalProduction += data.production;
    stats.softAttack += data.softAttack;
    stats.hardAttack += data.hardAttack;
    stats.airAttack += data.airAttack;
    stats.defense += data.defense;
    stats.breakthrough += data.breakthrough;
    stats.armor += data.armor;
    stats.piercing += data.piercing;
    stats.organization += data.organization;
    stats.recovery += data.recovery;
    stats.reconnaissance += data.reconnaissance;
    stats.suppression += data.suppression;
    stats.supplyUse += data.supplyUse;
    stats.speed = Math.min(stats.speed, data.speed); // Slowest unit determines speed
    stats.reliability += data.reliability;
    stats.combatWidth += data.combatWidth;
  });

  // Average reliability
  if (allComponents.length > 0) {
    stats.reliability = Math.floor(stats.reliability / allComponents.length);
  }

  return stats;
}

/**
 * Default templates for nations
 */
export const DEFAULT_TEMPLATES: Omit<
  MilitaryTemplate,
  'id' | 'nationId' | 'createdTurn' | 'unitsDeployed'
>[] = [
  {
    name: 'Standard Infantry Division',
    description: 'Balanced infantry division for general purpose combat',
    icon: '🪖',
    size: 'division',
    mainComponents: [
      'infantry_battalion',
      'infantry_battalion',
      'infantry_battalion',
      'infantry_battalion',
      'infantry_battalion',
      'artillery_battalion',
      'artillery_battalion',
    ],
    supportComponents: ['engineer_company', 'reconnaissance_company', 'signal_company'],
    stats: calculateTemplateStats(
      [
        'infantry_battalion',
        'infantry_battalion',
        'infantry_battalion',
        'infantry_battalion',
        'infantry_battalion',
        'artillery_battalion',
        'artillery_battalion',
      ],
      ['engineer_company', 'reconnaissance_company', 'signal_company']
    ),
    isActive: true,
    isDefault: true,
  },
  {
    name: 'Armored Division',
    description: 'Heavy armored force for breakthrough operations',
    icon: '🛡️',
    size: 'division',
    mainComponents: [
      'armor_battalion',
      'armor_battalion',
      'armor_battalion',
      'mechanized_battalion',
      'mechanized_battalion',
      'artillery_battalion',
    ],
    supportComponents: ['engineer_company', 'reconnaissance_company', 'logistics_company'],
    stats: calculateTemplateStats(
      [
        'armor_battalion',
        'armor_battalion',
        'armor_battalion',
        'mechanized_battalion',
        'mechanized_battalion',
        'artillery_battalion',
      ],
      ['engineer_company', 'reconnaissance_company', 'logistics_company']
    ),
    isActive: true,
    isDefault: true,
  },
  {
    name: 'Garrison Division',
    description: 'Light division optimized for occupation and suppression',
    icon: '👮',
    size: 'brigade',
    mainComponents: [
      'infantry_battalion',
      'infantry_battalion',
      'infantry_battalion',
      'anti_air_battalion',
    ],
    supportComponents: ['military_police_company', 'reconnaissance_company'],
    stats: calculateTemplateStats(
      ['infantry_battalion', 'infantry_battalion', 'infantry_battalion', 'anti_air_battalion'],
      ['military_police_company', 'reconnaissance_company']
    ),
    isActive: true,
    isDefault: true,
  },
  {
    name: 'Mobile Strike Force',
    description: 'Fast-moving mechanized force for rapid operations',
    icon: '🚛',
    size: 'division',
    mainComponents: [
      'mechanized_battalion',
      'mechanized_battalion',
      'mechanized_battalion',
      'mechanized_battalion',
      'armor_battalion',
      'armor_battalion',
    ],
    supportComponents: ['reconnaissance_company', 'signal_company', 'logistics_company'],
    stats: calculateTemplateStats(
      [
        'mechanized_battalion',
        'mechanized_battalion',
        'mechanized_battalion',
        'mechanized_battalion',
        'armor_battalion',
        'armor_battalion',
      ],
      ['reconnaissance_company', 'signal_company', 'logistics_company']
    ),
    isActive: true,
    isDefault: true,
  },
];
