/**
 * Research Technology Tree Data
 * All research projects organized by category for React Flow visualization
 */

import type { Nation } from '@/types/game';

export type ResearchCategory =
  | 'nuclear'
  | 'cyber'
  | 'conventional'
  | 'economy'
  | 'culture'
  | 'space'
  | 'intelligence'
  | 'defense'
  | 'delivery';

export type ResourceCost = Partial<Record<'production' | 'intel' | 'uranium', number>>;

export interface ResearchNode {
  id: string;
  name: string;
  description: string;
  category: ResearchCategory;
  turns: number;
  cost: ResourceCost;
  yield?: number;
  prerequisites?: string[];
  onComplete?: (nation: Nation) => void;
}

// Helper function placeholder for cyber research unlocks
declare function applyCyberResearchUnlock(nation: Nation, unlockType: string): void;

// ==================== NUCLEAR ARSENAL TREE ====================
// Warhead progression + delivery systems
export const NUCLEAR_RESEARCH: ResearchNode[] = [
  {
    id: 'warhead_20',
    name: 'Improved Fission Packages',
    description: 'Unlocks reliable 20MT warheads for tactical and strategic use.',
    category: 'nuclear',
    turns: 2,
    cost: { production: 20, intel: 5 },
    yield: 20
  },
  {
    id: 'warhead_40',
    name: 'Boosted Fission Assembly',
    description: 'Doubles your fission output and enables 40MT warheads.',
    category: 'nuclear',
    turns: 3,
    cost: { production: 30, intel: 10 },
    yield: 40,
    prerequisites: ['warhead_20']
  },
  {
    id: 'warhead_50',
    name: 'Thermonuclear Staging',
    description: 'Perfect layered staging to field 50MT strategic devices.',
    category: 'nuclear',
    turns: 4,
    cost: { production: 40, intel: 15 },
    yield: 50,
    prerequisites: ['warhead_40']
  },
  {
    id: 'warhead_100',
    name: 'Titan-Class Weaponization',
    description: 'Authorize titanic 100MT warheads for deterrence.',
    category: 'nuclear',
    turns: 5,
    cost: { production: 60, intel: 25 },
    yield: 100,
    prerequisites: ['warhead_50']
  },
  {
    id: 'warhead_200',
    name: 'Planet Cracker Initiative',
    description: 'Unlock 200MT devices capable of ending civilizations.',
    category: 'nuclear',
    turns: 6,
    cost: { production: 80, intel: 35 },
    yield: 200,
    prerequisites: ['warhead_100']
  },
  {
    id: 'delivery_mirv',
    name: 'MIRV Deployment Doctrine',
    description: 'Retrofit ICBMs with multiple reentry vehicles for overwhelming barrages.',
    category: 'delivery',
    turns: 5,
    cost: { production: 60, intel: 45 },
    prerequisites: ['warhead_50'],
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.mirv = true;
    }
  },
  {
    id: 'delivery_stealth',
    name: 'Strategic Stealth Airframes',
    description: 'Radar-absorbent coatings and ECM suites halve bomber interception odds.',
    category: 'delivery',
    turns: 4,
    cost: { production: 45, intel: 35 },
    prerequisites: ['counterintel'],
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.stealth = true;
    }
  },
  {
    id: 'defense_grid',
    name: 'Orbital Defense Grid',
    description: 'Integrate lasers and interceptors for +2 permanent defense.',
    category: 'defense',
    turns: 4,
    cost: { production: 45, intel: 20 },
    onComplete: nation => {
      nation.defense += 2;
    }
  },
];

// ==================== CYBER WARFARE TREE ====================
export const CYBER_RESEARCH: ResearchNode[] = [
  {
    id: 'cyber_firewalls',
    name: 'Adaptive Quantum Firewalls',
    description: 'Boost cyber readiness regeneration and baseline intrusion resistance.',
    category: 'cyber',
    turns: 3,
    cost: { production: 28, intel: 22 },
    onComplete: nation => {
      window.__applyCyberResearchUnlock?.(nation, 'firewalls');
    }
  },
  {
    id: 'cyber_ids',
    name: 'Intrusion Pattern Analysis',
    description: 'Advanced anomaly detection enables attribution and false-flag countermeasures.',
    category: 'cyber',
    turns: 4,
    cost: { production: 32, intel: 30 },
    prerequisites: ['cyber_firewalls'],
    onComplete: nation => {
      window.__applyCyberResearchUnlock?.(nation, 'intrusion_detection');
    }
  },
  {
    id: 'cyber_advanced_offense',
    name: 'Advanced Offensive Algorithms',
    description: 'AI-driven attack optimization reduces intrusion costs and increases success rates.',
    category: 'cyber',
    turns: 4,
    cost: { production: 35, intel: 30 },
    prerequisites: ['cyber_ids'],
    onComplete: nation => {
      window.__applyCyberResearchUnlock?.(nation, 'advanced_offense');
    }
  },
  {
    id: 'cyber_stealth',
    name: 'Stealth Protocols',
    description: 'Advanced obfuscation techniques reduce detection chance on all cyber operations.',
    category: 'cyber',
    turns: 3,
    cost: { production: 30, intel: 35 },
    prerequisites: ['cyber_ids'],
    onComplete: nation => {
      window.__applyCyberResearchUnlock?.(nation, 'stealth_protocols');
    }
  },
  {
    id: 'cyber_attribution_obfuscation',
    name: 'Attribution Obfuscation',
    description: 'False flag operations and proxy networks confuse enemy attribution efforts.',
    category: 'cyber',
    turns: 4,
    cost: { production: 40, intel: 40 },
    prerequisites: ['cyber_ids'],
    onComplete: nation => {
      window.__applyCyberResearchUnlock?.(nation, 'attribution_obfuscation');
    }
  },
  {
    id: 'cyber_ai_defense',
    name: 'AI-Driven Cyber Defenses',
    description: 'Autonomous defense systems automatically counter-attack intruders.',
    category: 'cyber',
    turns: 5,
    cost: { production: 50, intel: 45 },
    prerequisites: ['cyber_firewalls'],
    onComplete: nation => {
      window.__applyCyberResearchUnlock?.(nation, 'ai_defense');
    }
  },
  {
    id: 'cyber_superweapon',
    name: 'Cyber Superweapon',
    description: 'Devastating one-time cyber attack capable of crippling enemy infrastructure for 3 turns.',
    category: 'cyber',
    turns: 6,
    cost: { production: 80, intel: 60, uranium: 20 },
    prerequisites: ['cyber_advanced_offense', 'cyber_attribution_obfuscation'],
    onComplete: nation => {
      window.__applyCyberResearchUnlock?.(nation, 'cyber_superweapon');
    }
  },
];

// ==================== CONVENTIONAL WARFARE TREE ====================
export const CONVENTIONAL_RESEARCH: ResearchNode[] = [
  {
    id: 'conventional_armored_doctrine',
    name: 'Armored Maneuver Doctrine',
    description: 'Codify combined-arms tactics to unlock modern armored corps formations.',
    category: 'conventional',
    turns: 3,
    cost: { production: 28, intel: 12 },
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.conventional_armored_doctrine = true;
    }
  },
  {
    id: 'conventional_carrier_battlegroups',
    name: 'Carrier Battlegroup Logistics',
    description: 'Fund carrier aviation, underway replenishment, and escort integration.',
    category: 'conventional',
    turns: 4,
    cost: { production: 36, intel: 16, uranium: 4 },
    prerequisites: ['conventional_armored_doctrine'],
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.conventional_carrier_battlegroups = true;
    }
  },
  {
    id: 'conventional_expeditionary_airframes',
    name: 'Expeditionary Airframes',
    description: 'Deploy forward-operating squadrons with aerial refuelling and SEAD packages.',
    category: 'conventional',
    turns: 4,
    cost: { production: 34, intel: 22 },
    prerequisites: ['conventional_armored_doctrine'],
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.conventional_expeditionary_airframes = true;
    }
  },
  {
    id: 'conventional_combined_arms',
    name: 'Combined Arms Doctrine',
    description: 'Coordinated multi-domain operations grant +10% attack when multiple unit types are deployed.',
    category: 'conventional',
    turns: 3,
    cost: { production: 30, intel: 20 },
    prerequisites: ['conventional_armored_doctrine'],
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.conventional_combined_arms = true;
      nation.combinedArmsBonus = 0.10;
    }
  },
  {
    id: 'conventional_advanced_logistics',
    name: 'Advanced Logistics',
    description: 'Streamlined supply chains increase readiness regeneration by +1 per turn for all units.',
    category: 'conventional',
    turns: 3,
    cost: { production: 35, intel: 15 },
    prerequisites: ['conventional_armored_doctrine'],
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.conventional_advanced_logistics = true;
      nation.readinessRegen = (nation.readinessRegen || 0) + 1;
    }
  },
  {
    id: 'conventional_electronic_warfare',
    name: 'Electronic Warfare Suite',
    description: 'Advanced ECM/ECCM systems reduce enemy detection by 20% in controlled territories.',
    category: 'conventional',
    turns: 4,
    cost: { production: 40, intel: 35 },
    prerequisites: ['conventional_carrier_battlegroups', 'conventional_expeditionary_airframes'],
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.conventional_electronic_warfare = true;
      nation.detectionReduction = (nation.detectionReduction || 0) + 0.20;
    }
  },
  {
    id: 'conventional_force_modernization',
    name: 'Force Modernization',
    description: 'Comprehensive upgrade program permanently enhances all existing units (+1 attack, +1 defense).',
    category: 'conventional',
    turns: 5,
    cost: { production: 60, intel: 30 },
    prerequisites: ['conventional_combined_arms', 'conventional_advanced_logistics'],
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.conventional_force_modernization = true;
      nation.unitAttackBonus = (nation.unitAttackBonus || 0) + 1;
      nation.unitDefenseBonus = (nation.unitDefenseBonus || 0) + 1;
    }
  },
];

// ==================== ECONOMY/PRODUCTION TREE ====================
export const ECONOMY_RESEARCH: ResearchNode[] = [
  {
    id: 'economy_automation',
    name: 'Industrial Automation',
    description: 'Automated factories increase production efficiency by 15%.',
    category: 'economy',
    turns: 2,
    cost: { production: 20 },
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.economy_automation = true;
      nation.productionMultiplier = (nation.productionMultiplier || 1.0) * 1.15;
    }
  },
  {
    id: 'economy_extraction',
    name: 'Advanced Resource Extraction',
    description: 'Deep mining and advanced refining increase uranium output by +1 per turn.',
    category: 'economy',
    turns: 3,
    cost: { production: 30, intel: 10 },
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.economy_extraction = true;
      nation.uraniumPerTurn = (nation.uraniumPerTurn || 0) + 1;
    }
  },
  {
    id: 'economy_efficiency',
    name: 'Economic Efficiency',
    description: 'Streamlined production reduces all construction costs by 10%.',
    category: 'economy',
    turns: 3,
    cost: { production: 25, intel: 15 },
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.economy_efficiency = true;
      nation.buildCostReduction = (nation.buildCostReduction || 0) + 0.1;
    }
  },
  {
    id: 'economy_mobilization',
    name: 'Total Mobilization',
    description: 'War economy maximizes output (+20% production) but increases domestic tension (+5% instability).',
    category: 'economy',
    turns: 4,
    cost: { production: 40, intel: 20 },
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.economy_mobilization = true;
      nation.productionMultiplier = (nation.productionMultiplier || 1.0) * 1.20;
      nation.instability = (nation.instability || 0) + 5;
    }
  },
  {
    id: 'economy_stockpiling',
    name: 'Resource Stockpiling',
    description: 'Strategic reserves increase maximum resource capacity by 50 for all resources.',
    category: 'economy',
    turns: 2,
    cost: { production: 15 },
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.economy_stockpiling = true;
      nation.maxProduction = (nation.maxProduction || 1000) + 50;
      nation.maxIntel = (nation.maxIntel || 500) + 50;
      nation.maxUranium = (nation.maxUranium || 200) + 50;
    }
  },
];

// ==================== CULTURE/DIPLOMACY TREE ====================
export const CULTURE_RESEARCH: ResearchNode[] = [
  {
    id: 'culture_social_media',
    name: 'Social Media Dominance',
    description: 'Global social networks amplify cultural influence, reducing culture bomb cost by 25%.',
    category: 'culture',
    turns: 2,
    cost: { production: 20, intel: 20 },
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.culture_social_media = true;
      nation.cultureBombCostReduction = (nation.cultureBombCostReduction || 0) + 0.25;
    }
  },
  {
    id: 'culture_influence',
    name: 'Global Influence Network',
    description: 'Diplomatic channels enable more simultaneous treaties (+1 treaty slot).',
    category: 'culture',
    turns: 3,
    cost: { production: 30, intel: 30 },
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.culture_influence = true;
      nation.maxTreaties = (nation.maxTreaties || 3) + 1;
    }
  },
  {
    id: 'culture_soft_power',
    name: 'Soft Power Projection',
    description: 'Cultural appeal attracts skilled immigrants (+20% immigration success).',
    category: 'culture',
    turns: 4,
    cost: { production: 35, intel: 35 },
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.culture_soft_power = true;
      nation.immigrationBonus = (nation.immigrationBonus || 1.0) * 1.20;
    }
  },
  {
    id: 'culture_hegemony',
    name: 'Cultural Hegemony',
    description: 'Total cultural dominance converts stolen population 50% faster.',
    category: 'culture',
    turns: 5,
    cost: { production: 50, intel: 50 },
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.culture_hegemony = true;
      nation.stolenPopConversionRate = (nation.stolenPopConversionRate || 1.0) * 1.50;
    }
  },
  {
    id: 'culture_immunity',
    name: 'Diplomatic Immunity',
    description: 'Ironclad treaties cannot be broken by AI for 5 turns after signing.',
    category: 'culture',
    turns: 3,
    cost: { production: 25, intel: 40 },
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.culture_immunity = true;
      nation.treatyLockDuration = 5;
    }
  },
  {
    id: 'culture_bomb',
    name: 'Culture Bomb',
    description: 'Massive propaganda campaign to flip enemy city loyalty.',
    category: 'culture',
    turns: 4,
    cost: { production: 40, intel: 45 },
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.culture_bomb = true;
    }
  },
];

// ==================== SPACE/SATELLITE TREE ====================
export const SPACE_RESEARCH: ResearchNode[] = [
  {
    id: 'space_satellite_network',
    name: 'Advanced Satellite Network',
    description: 'Expanded orbital infrastructure provides +1 additional satellite deployment slot.',
    category: 'space',
    turns: 3,
    cost: { production: 35, intel: 25 },
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.space_satellite_network = true;
      nation.maxSatellites = (nation.maxSatellites || 3) + 1;
    }
  },
  {
    id: 'space_recon_optics',
    name: 'Enhanced Recon Optics',
    description: 'Advanced imaging sensors increase satellite intelligence gathering by 50%.',
    category: 'space',
    turns: 3,
    cost: { production: 30, intel: 30 },
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.space_recon_optics = true;
      nation.satelliteIntelBonus = (nation.satelliteIntelBonus || 1.0) * 1.50;
    }
  },
  {
    id: 'space_asat_weapons',
    name: 'Anti-Satellite Weapons',
    description: 'Ground-based and orbital ASAT systems enable destruction of enemy satellites.',
    category: 'space',
    turns: 4,
    cost: { production: 45, intel: 35, uranium: 10 },
    prerequisites: ['space_satellite_network'],
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.space_asat_weapons = true;
      nation.hasASATCapability = true;
    }
  },
  {
    id: 'space_weapon_platform',
    name: 'Space Weapon Platform',
    description: 'Orbital strike capability delivers precision kinetic bombardment (1 use per game).',
    category: 'space',
    turns: 5,
    cost: { production: 60, intel: 40, uranium: 20 },
    prerequisites: ['space_asat_weapons'],
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.space_weapon_platform = true;
      nation.orbitalStrikesAvailable = (nation.orbitalStrikesAvailable || 0) + 1;
    }
  },
  {
    id: 'space_gps_warfare',
    name: 'GPS Warfare',
    description: 'Satellite navigation disruption reduces enemy missile accuracy by 20%.',
    category: 'space',
    turns: 3,
    cost: { production: 40, intel: 35 },
    prerequisites: ['space_satellite_network'],
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.space_gps_warfare = true;
      nation.enemyMissileAccuracyReduction = (nation.enemyMissileAccuracyReduction || 0) + 0.20;
    }
  },
];

// ==================== INTELLIGENCE OPERATIONS TREE ====================
export const INTELLIGENCE_RESEARCH: ResearchNode[] = [
  {
    id: 'counterintel',
    name: 'Counterintelligence Suite',
    description: 'Deploy signals and HUMINT analysis to boost intel yields.',
    category: 'intelligence',
    turns: 3,
    cost: { production: 25, intel: 25 }
  },
  {
    id: 'intelligence_deep_cover',
    name: 'Deep Cover Operations',
    description: 'Sleeper agents and NOC operatives reduce sabotage detection by 30%.',
    category: 'intelligence',
    turns: 3,
    cost: { production: 25, intel: 30 },
    prerequisites: ['counterintel'],
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.intelligence_deep_cover = true;
      nation.sabotageDetectionReduction = (nation.sabotageDetectionReduction || 0) + 0.30;
    }
  },
  {
    id: 'intelligence_propaganda',
    name: 'Propaganda Mastery',
    description: 'Psyops and memetic warfare increase meme wave effectiveness by 50%.',
    category: 'intelligence',
    turns: 3,
    cost: { production: 20, intel: 25 },
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.intelligence_propaganda = true;
      nation.memeWaveEffectiveness = (nation.memeWaveEffectiveness || 1.0) * 1.50;
    }
  },
  {
    id: 'intelligence_sigint',
    name: 'Signals Intelligence',
    description: 'NSA-tier SIGINT automatically reveals enemy research projects.',
    category: 'intelligence',
    turns: 4,
    cost: { production: 30, intel: 40 },
    prerequisites: ['counterintel'],
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.intelligence_sigint = true;
      nation.autoRevealEnemyResearch = true;
    }
  },
  {
    id: 'intelligence_covert_action',
    name: 'Covert Action Programs',
    description: 'CIA-style regime destabilization: +15% enemy instability per turn when activated.',
    category: 'intelligence',
    turns: 5,
    cost: { production: 50, intel: 50 },
    prerequisites: ['intelligence_deep_cover', 'intelligence_sigint'],
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.intelligence_covert_action = true;
      nation.hasRegimeDestabilization = true;
    }
  },
];

// ==================== BIO-LAB INFRASTRUCTURE TREE ====================
// Linear tier progression (handled separately via BioLab system)
export interface BioLabNode {
  id: string;
  tier: 0 | 1 | 2 | 3 | 4;
  name: string;
  description: string;
  cost: ResourceCost;
  constructionTurns: number;
  prerequisites: string[];
  unlocks: string[];
}

export const BIOLAB_RESEARCH: BioLabNode[] = [
  {
    id: 'biolab_tier_1',
    tier: 1,
    name: 'Biological Research Facility',
    description: 'Basic disease tracking and pandemic response capabilities. Required for vaccine development.',
    cost: { production: 50 },
    constructionTurns: 2,
    prerequisites: [],
    unlocks: ['Disease surveillance', 'Basic vaccine research', 'Pandemic response protocols'],
  },
  {
    id: 'biolab_tier_2',
    tier: 2,
    name: 'Advanced Virology Laboratory',
    description: 'Sophisticated pathogen analysis and vaccine development. Enhanced disease tracking.',
    cost: { production: 150 },
    constructionTurns: 3,
    prerequisites: ['biolab_tier_1'],
    unlocks: ['Pathogen sequencing', 'Accelerated vaccine development', 'International disease monitoring'],
  },
  {
    id: 'biolab_tier_3',
    tier: 3,
    name: 'BioForge Facility',
    description: 'CLASSIFIED: Offensive biological weapon development. Pathogen engineering and evolution tree access.',
    cost: { production: 300, uranium: 50 },
    constructionTurns: 4,
    prerequisites: ['biolab_tier_2'],
    unlocks: ['⚠️ Offensive bio-weapon development', 'Pathogen evolution tree', 'Plague type selection', 'Deployment capabilities'],
  },
  {
    id: 'biolab_tier_4',
    tier: 4,
    name: 'Genetic Engineering Complex',
    description: 'HIGHLY CLASSIFIED: Advanced bio-weapon engineering. Unlock exotic plague types and reduced evolution costs.',
    cost: { production: 500, uranium: 100 },
    constructionTurns: 5,
    prerequisites: ['biolab_tier_3'],
    unlocks: ['Advanced plague types', '25% reduced evolution costs', 'Accelerated mutation research', 'False flag deployment'],
  },
];

// ==================== COMBINED TREES ====================
export const ALL_RESEARCH_NODES: ResearchNode[] = [
  ...NUCLEAR_RESEARCH,
  ...CYBER_RESEARCH,
  ...CONVENTIONAL_RESEARCH,
  ...ECONOMY_RESEARCH,
  ...CULTURE_RESEARCH,
  ...SPACE_RESEARCH,
  ...INTELLIGENCE_RESEARCH,
];

export const RESEARCH_LOOKUP: Record<string, ResearchNode> = ALL_RESEARCH_NODES.reduce(
  (acc, project) => {
    acc[project.id] = project;
    return acc;
  },
  {} as Record<string, ResearchNode>
);

// ==================== CATEGORY METADATA ====================
export const CATEGORY_COLORS: Record<ResearchCategory, string> = {
  nuclear: '#ef4444', // red-500
  cyber: '#06b6d4', // cyan-500
  conventional: '#f97316', // orange-500
  economy: '#eab308', // yellow-500
  culture: '#d946ef', // fuchsia-500
  space: '#8b5cf6', // violet-500
  intelligence: '#a855f7', // purple-500
  defense: '#10b981', // emerald-500
  delivery: '#f59e0b', // amber-500
};

export const CATEGORY_NAMES: Record<ResearchCategory, string> = {
  nuclear: 'NUCLEAR ARSENAL',
  cyber: 'CYBER WARFARE',
  conventional: 'CONVENTIONAL FORCES',
  economy: 'ECONOMY & PRODUCTION',
  culture: 'CULTURE & DIPLOMACY',
  space: 'SPACE PROGRAM',
  intelligence: 'INTELLIGENCE OPS',
  defense: 'DEFENSE SYSTEMS',
  delivery: 'DELIVERY SYSTEMS',
};

// ==================== HELPER FUNCTIONS ====================
export function getResearchNode(id: string): ResearchNode | undefined {
  return RESEARCH_LOOKUP[id];
}

export function getResearchByCategory(category: ResearchCategory): ResearchNode[] {
  return ALL_RESEARCH_NODES.filter(node => node.category === category);
}

export function canResearch(
  nodeId: string,
  researched: Set<string>
): boolean {
  const node = getResearchNode(nodeId);
  if (!node) return false;

  // Check prerequisites
  if (node.prerequisites && node.prerequisites.length > 0) {
    return node.prerequisites.every(prereq => researched.has(prereq));
  }

  return true;
}

export function canAffordResearch(
  nodeId: string,
  production: number,
  intel: number,
  uranium: number
): boolean {
  const node = getResearchNode(nodeId);
  if (!node) return false;

  const { cost } = node;
  return (
    production >= (cost.production || 0) &&
    intel >= (cost.intel || 0) &&
    uranium >= (cost.uranium || 0)
  );
}
