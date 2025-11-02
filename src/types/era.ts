/**
 * Game Era System - Progressive Complexity Unlocking
 *
 * Inspired by Civilization's Era progression
 * Unlocks features gradually to reduce early-game complexity
 */

export type GameEra = 'early' | 'mid' | 'late';

export interface EraDefinition {
  id: GameEra;
  name: string;
  startTurn: number;
  endTurn: number;
  description: string;
  unlockedFeatures: GameFeature[];
}

export type GameFeature =
  | 'nuclear_missiles'
  | 'nuclear_bombers'
  | 'defense_systems'
  | 'basic_diplomacy'
  | 'basic_research'
  | 'conventional_warfare'
  | 'territory_control'
  | 'cyber_warfare'
  | 'advanced_diplomacy'
  | 'bio_warfare'
  | 'bio_lab'
  | 'submarines'
  | 'satellites'
  | 'space_weapons'
  | 'ai_systems'
  | 'economic_warfare'
  | 'quantum_computing'
  | 'propaganda_victory'
  | 'advanced_research';

export interface FeatureUnlockInfo {
  feature: GameFeature;
  name: string;
  description: string;
  unlockTurn: number;
  category: 'military' | 'diplomacy' | 'technology' | 'victory';
  icon?: string;
}

export const ERA_DEFINITIONS: Record<GameEra, EraDefinition> = {
  early: {
    id: 'early',
    name: 'Cold War Tension',
    startTurn: 1,
    endTurn: 10,
    description: 'Learn the basics: nuclear deterrence and defense',
    unlockedFeatures: [
      'nuclear_missiles',
      'nuclear_bombers',
      'defense_systems',
      'basic_diplomacy',
      'basic_research',
    ],
  },
  mid: {
    id: 'mid',
    name: 'Escalation Era',
    startTurn: 11,
    endTurn: 25,
    description: 'Multi-domain warfare: conventional, cyber, and territory',
    unlockedFeatures: [
      'nuclear_missiles',
      'nuclear_bombers',
      'defense_systems',
      'basic_diplomacy',
      'basic_research',
      'conventional_warfare',
      'territory_control',
      'cyber_warfare',
      'advanced_diplomacy',
      'satellites',
    ],
  },
  late: {
    id: 'late',
    name: 'Total War',
    startTurn: 26,
    endTurn: 999,
    description: 'All systems operational: bio-weapons and victory paths',
    unlockedFeatures: [
      'nuclear_missiles',
      'nuclear_bombers',
      'defense_systems',
      'basic_diplomacy',
      'basic_research',
      'conventional_warfare',
      'territory_control',
      'cyber_warfare',
      'advanced_diplomacy',
      'bio_warfare',
      'bio_lab',
      'submarines',
      'satellites',
      'propaganda_victory',
      'advanced_research',
    ],
  },
};

export const FEATURE_UNLOCK_INFO: Record<GameFeature, FeatureUnlockInfo> = {
  nuclear_missiles: {
    feature: 'nuclear_missiles',
    name: 'Nuclear Missiles',
    description: 'Launch ICBMs at enemy nations',
    unlockTurn: 1,
    category: 'military',
    icon: '🚀',
  },
  nuclear_bombers: {
    feature: 'nuclear_bombers',
    name: 'Nuclear Bombers',
    description: 'Deploy strategic bombers with nuclear payloads',
    unlockTurn: 1,
    category: 'military',
    icon: '✈️',
  },
  defense_systems: {
    feature: 'defense_systems',
    name: 'Defense Systems',
    description: 'Build missile defense to protect your nation',
    unlockTurn: 1,
    category: 'military',
    icon: '🛡️',
  },
  basic_diplomacy: {
    feature: 'basic_diplomacy',
    name: 'Basic Diplomacy',
    description: 'Form alliances and negotiate peace',
    unlockTurn: 1,
    category: 'diplomacy',
    icon: '🤝',
  },
  basic_research: {
    feature: 'basic_research',
    name: 'Basic Research',
    description: 'Unlock nuclear and defense technologies',
    unlockTurn: 1,
    category: 'technology',
    icon: '🔬',
  },
  conventional_warfare: {
    feature: 'conventional_warfare',
    name: 'Conventional Warfare',
    description: 'Deploy armies, navies, and air forces',
    unlockTurn: 11,
    category: 'military',
    icon: '⚔️',
  },
  territory_control: {
    feature: 'territory_control',
    name: 'Territory Control',
    description: 'Capture and hold strategic territories',
    unlockTurn: 11,
    category: 'military',
    icon: '🗺️',
  },
  cyber_warfare: {
    feature: 'cyber_warfare',
    name: 'Cyber Warfare',
    description: 'Hack enemy systems and protect your networks',
    unlockTurn: 11,
    category: 'military',
    icon: '💻',
  },
  advanced_diplomacy: {
    feature: 'advanced_diplomacy',
    name: 'Advanced Diplomacy',
    description: 'Economic aid, ultimatums, and complex negotiations',
    unlockTurn: 11,
    category: 'diplomacy',
    icon: '🏛️',
  },
  bio_warfare: {
    feature: 'bio_warfare',
    name: 'Biological Warfare',
    description: 'Develop and deploy bio-weapons',
    unlockTurn: 26,
    category: 'military',
    icon: '🦠',
  },
  bio_lab: {
    feature: 'bio_lab',
    name: 'Bio-Lab Construction',
    description: 'Build research facilities for bio-weapons',
    unlockTurn: 26,
    category: 'technology',
    icon: '🧬',
  },
  submarines: {
    feature: 'submarines',
    name: 'Nuclear Submarines',
    description: 'Deploy stealth submarine nuclear platforms',
    unlockTurn: 26,
    category: 'military',
    icon: '🔱',
  },
  satellites: {
    feature: 'satellites',
    name: 'Satellite Network',
    description: 'Space-based reconnaissance and weapons',
    unlockTurn: 11,
    category: 'technology',
    icon: '🛰️',
  },
  space_weapons: {
    feature: 'space_weapons',
    name: 'Orbital Weapons',
    description: 'Deploy kinetic rods and laser platforms from orbit',
    unlockTurn: 28,
    category: 'military',
    icon: '🌌',
  },
  ai_systems: {
    feature: 'ai_systems',
    name: 'Autonomous Command AIs',
    description: 'Coordinate global defenses with advanced machine intelligence',
    unlockTurn: 30,
    category: 'technology',
    icon: '🤖',
  },
  economic_warfare: {
    feature: 'economic_warfare',
    name: 'Economic Warfare',
    description: 'Unleash sanctions, market disruption, and resource embargoes',
    unlockTurn: 24,
    category: 'diplomacy',
    icon: '💹',
  },
  quantum_computing: {
    feature: 'quantum_computing',
    name: 'Quantum Computing',
    description: 'Crack encryption and accelerate research with quantum cores',
    unlockTurn: 32,
    category: 'technology',
    icon: '⚛️',
  },
  propaganda_victory: {
    feature: 'propaganda_victory',
    name: 'Propaganda Victory',
    description: 'Win through cultural influence',
    unlockTurn: 26,
    category: 'victory',
    icon: '📻',
  },
  advanced_research: {
    feature: 'advanced_research',
    name: 'Advanced Research',
    description: 'Unlock end-game technologies',
    unlockTurn: 26,
    category: 'technology',
    icon: '🔭',
  },
};
