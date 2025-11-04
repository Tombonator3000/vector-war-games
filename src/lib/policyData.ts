// @ts-nocheck
import type { Policy } from '@/types/policy';

/**
 * Policy Database
 * 
 * Comprehensive collection of strategic policies players can enact.
 * Organized by category and tier for progressive gameplay.
 */

export const policies: Policy[] = [
  // ==================== ECONOMIC POLICIES ====================
  {
    id: 'total_war_economy',
    name: 'Total War Economy',
    category: 'economic',
    tier: 1,
    description: 'Convert civilian industry to military production. Massive production boost at cost of public approval.',
    flavorText: 'Every factory becomes a forge of war.',
    prerequisites: [],
    enactmentCost: { gold: 500, production: 200 },
    maintenanceCost: { approvalPerTurn: -2 },
    effects: {
      productionModifier: 1.25,
      publicOpinionModifier: -1,
      description: '+25% production, -1 public opinion/turn'
    },
    conflictsWith: ['peace_dividend'],
    synergiesWith: ['military_industrial_complex'],
    synergyBonus: {
      productionModifier: 1.35,
      description: 'Additional +10% production from synergy'
    },
    canRepeal: true,
    repealCost: { gold: 200 }
  },
  {
    id: 'peace_dividend',
    name: 'Peace Dividend',
    category: 'economic',
    tier: 1,
    description: 'Redirect military spending to civilian economy. Reduces military effectiveness but improves morale.',
    flavorText: 'Swords into plowshares.',
    prerequisites: [],
    enactmentCost: { gold: 300 },
    maintenanceCost: undefined,
    effects: {
      productionModifier: 1.15,
      moraleModifier: 2,
      militaryRecruitmentModifier: 0.85,
      description: '+15% production, +2 morale/turn, -15% military recruitment'
    },
    conflictsWith: ['total_war_economy', 'military_industrial_complex'],
    synergiesWith: ['welfare_state'],
    synergyBonus: {
      moraleModifier: 3,
      description: '+1 additional morale/turn'
    },
    canRepeal: true,
    repealCost: { gold: 150 }
  },
  {
    id: 'austerity_measures',
    name: 'Austerity Measures',
    category: 'economic',
    tier: 1,
    description: 'Severe budget cuts to balance books. Reduces costs but tanks public opinion.',
    flavorText: 'Tighten belts, weather the storm.',
    prerequisites: [],
    enactmentCost: { gold: 100 },
    maintenanceCost: { approvalPerTurn: -3 },
    effects: {
      goldPerTurn: 150,
      publicOpinionModifier: -2,
      moraleModifier: -1,
      description: '+150 gold/turn, -2 opinion/turn, -1 morale/turn'
    },
    conflictsWith: ['welfare_state', 'massive_stimulus'],
    synergiesWith: [],
    canRepeal: true,
    repealCost: { gold: 50 }
  },
  {
    id: 'massive_stimulus',
    name: 'Massive Stimulus',
    category: 'economic',
    tier: 2,
    description: 'Flood economy with government spending. Boosts everything but drains treasury.',
    flavorText: 'Print money, make it rain.',
    prerequisites: [
      { type: 'turn', value: 10, description: 'Available from turn 10' }
    ],
    enactmentCost: { gold: 800 },
    maintenanceCost: { gold: 100 },
    effects: {
      productionModifier: 1.20,
      moraleModifier: 2,
      publicOpinionModifier: 1,
      description: '+20% production, +2 morale/turn, +1 opinion/turn, -100 gold/turn'
    },
    conflictsWith: ['austerity_measures'],
    synergiesWith: ['welfare_state'],
    synergyBonus: {
      moraleModifier: 3,
      description: '+1 additional morale/turn'
    },
    canRepeal: true,
    repealCost: { gold: 300 }
  },

  // ==================== MILITARY POLICIES ====================
  {
    id: 'conscription',
    name: 'Universal Conscription',
    category: 'military',
    tier: 1,
    description: 'Mandatory military service for all citizens. Massive recruitment boost, morale penalty.',
    flavorText: 'Your nation needs you!',
    prerequisites: [],
    enactmentCost: { production: 300 },
    maintenanceCost: { moralePerTurn: -2 },
    effects: {
      militaryRecruitmentModifier: 1.40,
      moraleModifier: -1,
      publicOpinionModifier: -1,
      description: '+40% recruitment, -1 morale/turn, -1 opinion/turn'
    },
    conflictsWith: ['volunteer_force'],
    synergiesWith: ['total_war_economy'],
    synergyBonus: {
      militaryRecruitmentModifier: 1.50,
      description: '+10% additional recruitment'
    },
    canRepeal: true,
    repealCost: { gold: 400 }
  },
  {
    id: 'volunteer_force',
    name: 'Professional Volunteer Force',
    category: 'military',
    tier: 1,
    description: 'Elite professional military. Higher quality but smaller numbers.',
    flavorText: 'Quality over quantity.',
    prerequisites: [],
    enactmentCost: { gold: 500 },
    maintenanceCost: { gold: 80 },
    effects: {
      militaryRecruitmentModifier: 0.80,
      defenseBonus: 15,
      moraleModifier: 1,
      description: '-20% recruitment, +15% defense, +1 morale/turn, -80 gold/turn'
    },
    conflictsWith: ['conscription'],
    synergiesWith: ['peace_dividend'],
    canRepeal: true,
    repealCost: { gold: 200 }
  },
  {
    id: 'military_industrial_complex',
    name: 'Military-Industrial Complex',
    category: 'military',
    tier: 2,
    description: 'Deep integration of military and industry. Production and military bonuses, corruption risk.',
    flavorText: 'War is good for business.',
    prerequisites: [
      { type: 'turn', value: 15, description: 'Available from turn 15' }
    ],
    enactmentCost: { gold: 1000, production: 400 },
    maintenanceCost: { approvalPerTurn: -1 },
    effects: {
      productionModifier: 1.20,
      militaryRecruitmentModifier: 1.15,
      uraniumPerTurn: 10,
      instabilityModifier: 2,
      description: '+20% production, +15% recruitment, +10 uranium/turn, +2 instability/turn'
    },
    conflictsWith: ['peace_dividend'],
    synergiesWith: ['total_war_economy'],
    synergyBonus: {
      productionModifier: 1.35,
      description: '+15% additional production'
    },
    canRepeal: true,
    repealCost: { gold: 500, production: 200 }
  },

  // ==================== SOCIAL POLICIES ====================
  {
    id: 'welfare_state',
    name: 'Welfare State',
    category: 'social',
    tier: 1,
    description: 'Comprehensive social safety net. Boosts morale and approval, costs gold.',
    flavorText: 'Cradle to grave care.',
    prerequisites: [],
    enactmentCost: { gold: 600 },
    maintenanceCost: { gold: 100 },
    effects: {
      moraleModifier: 3,
      publicOpinionModifier: 2,
      cabinetApprovalModifier: 1,
      description: '+3 morale/turn, +2 opinion/turn, +1 approval/turn, -100 gold/turn'
    },
    conflictsWith: ['austerity_measures'],
    synergiesWith: ['peace_dividend', 'massive_stimulus'],
    synergyBonus: {
      moraleModifier: 4,
      description: '+1 additional morale/turn'
    },
    canRepeal: true,
    repealCost: { gold: 300 }
  },
  {
    id: 'propaganda_ministry',
    name: 'Ministry of Truth',
    category: 'social',
    tier: 1,
    description: 'State propaganda apparatus. Control narrative, manipulate opinion, risk backlash.',
    flavorText: 'War is peace. Freedom is slavery.',
    prerequisites: [],
    enactmentCost: { gold: 400, intel: 200 },
    maintenanceCost: { intel: 30 },
    effects: {
      publicOpinionModifier: 2,
      counterIntelBonus: 10,
      instabilityModifier: 1,
      description: '+2 opinion/turn, +10% counter-intel, +1 instability/turn, -30 intel/turn'
    },
    conflictsWith: ['free_press'],
    synergiesWith: ['surveillance_state'],
    synergyBonus: {
      publicOpinionModifier: 3,
      counterIntelBonus: 15,
      description: '+1 opinion/turn, +5% counter-intel'
    },
    canRepeal: true,
    repealCost: { gold: 200 }
  },
  {
    id: 'free_press',
    name: 'Free Press Protections',
    category: 'social',
    tier: 1,
    description: 'Protect independent media. Improves approval and diplomatic standing, limits control.',
    flavorText: 'Truth shall set you free.',
    prerequisites: [],
    enactmentCost: { gold: 300 },
    maintenanceCost: undefined,
    effects: {
      cabinetApprovalModifier: 2,
      diplomaticInfluenceModifier: 1.10,
      publicOpinionModifier: 1,
      description: '+2 approval/turn, +10% diplomatic influence, +1 opinion/turn'
    },
    conflictsWith: ['propaganda_ministry', 'surveillance_state'],
    synergiesWith: ['welfare_state'],
    canRepeal: true,
    repealCost: { gold: 150 }
  },
  {
    id: 'surveillance_state',
    name: 'Total Surveillance State',
    category: 'social',
    tier: 2,
    description: 'Monitor everything. Massive intel boost, crushing approval penalty.',
    flavorText: 'Big Brother is watching.',
    prerequisites: [
      { type: 'turn', value: 12, description: 'Available from turn 12' }
    ],
    enactmentCost: { gold: 800, intel: 400 },
    maintenanceCost: { approvalPerTurn: -3, intel: 50 },
    effects: {
      intelPerTurn: 100,
      espionageSuccessBonus: 25,
      counterIntelBonus: 30,
      publicOpinionModifier: -2,
      cabinetApprovalModifier: -2,
      description: '+100 intel/turn, +25% espionage, +30% counter-intel, -2 opinion/turn, -2 approval/turn, -50 intel/turn'
    },
    conflictsWith: ['free_press'],
    synergiesWith: ['propaganda_ministry'],
    synergyBonus: {
      counterIntelBonus: 40,
      description: '+10% additional counter-intel'
    },
    canRepeal: true,
    repealCost: { gold: 400, intel: 200 }
  },

  // ==================== FOREIGN POLICIES ====================
  {
    id: 'open_diplomacy',
    name: 'Open Diplomacy',
    category: 'foreign',
    tier: 1,
    description: 'Transparent diplomatic relations. Improves trust and influence, limits covert ops.',
    flavorText: 'Speak softly, carry a big stick.',
    prerequisites: [],
    enactmentCost: { gold: 400 },
    maintenanceCost: undefined,
    effects: {
      diplomaticInfluenceModifier: 1.25,
      relationshipDecayModifier: 0.75,
      espionageSuccessBonus: -15,
      description: '+25% diplomatic influence, -25% relationship decay, -15% espionage success'
    },
    conflictsWith: ['shadow_diplomacy'],
    synergiesWith: ['free_press'],
    synergyBonus: {
      diplomaticInfluenceModifier: 1.35,
      description: '+10% additional diplomatic influence'
    },
    canRepeal: true,
    repealCost: { gold: 200 }
  },
  {
    id: 'shadow_diplomacy',
    name: 'Shadow Diplomacy',
    category: 'foreign',
    tier: 1,
    description: 'Backroom deals and covert influence. Espionage bonus, trust penalty.',
    flavorText: 'What happens in the shadows...',
    prerequisites: [],
    enactmentCost: { gold: 500, intel: 300 },
    maintenanceCost: { intel: 40 },
    effects: {
      espionageSuccessBonus: 25,
      intelPerTurn: 50,
      diplomaticInfluenceModifier: 0.90,
      description: '+25% espionage, +50 intel/turn, -10% diplomatic influence, -40 intel/turn'
    },
    conflictsWith: ['open_diplomacy'],
    synergiesWith: ['surveillance_state'],
    canRepeal: true,
    repealCost: { gold: 250, intel: 150 }
  },
  {
    id: 'isolationism',
    name: 'Fortress Isolation',
    category: 'foreign',
    tier: 2,
    description: 'Withdraw from world affairs. Self-sufficiency bonus, diplomatic penalties.',
    flavorText: 'Walls keep the world out.',
    prerequisites: [
      { type: 'turn', value: 8, description: 'Available from turn 8' }
    ],
    enactmentCost: { gold: 600, production: 300 },
    maintenanceCost: undefined,
    effects: {
      defenseBonus: 20,
      productionModifier: 1.10,
      diplomaticInfluenceModifier: 0.50,
      relationshipDecayModifier: 1.50,
      description: '+20% defense, +10% production, -50% diplomatic influence, +50% relationship decay'
    },
    conflictsWith: ['interventionism'],
    synergiesWith: ['volunteer_force'],
    canRepeal: true,
    repealCost: { gold: 300 }
  },
  {
    id: 'interventionism',
    name: 'Active Interventionism',
    category: 'foreign',
    tier: 2,
    description: 'Project power globally. Diplomatic and intel bonuses, high costs.',
    flavorText: 'World police reporting for duty.',
    prerequisites: [
      { type: 'turn', value: 10, description: 'Available from turn 10' }
    ],
    enactmentCost: { gold: 1000, production: 400 },
    maintenanceCost: { gold: 120, production: 50 },
    effects: {
      diplomaticInfluenceModifier: 1.40,
      espionageSuccessBonus: 15,
      intelPerTurn: 80,
      moraleModifier: -1,
      description: '+40% diplomatic influence, +15% espionage, +80 intel/turn, -1 morale/turn, -120 gold/turn, -50 production/turn'
    },
    conflictsWith: ['isolationism'],
    synergiesWith: ['open_diplomacy'],
    synergyBonus: {
      diplomaticInfluenceModifier: 1.50,
      description: '+10% additional diplomatic influence'
    },
    canRepeal: true,
    repealCost: { gold: 500, production: 200 }
  }
];

export const getPolicyById = (id: string): Policy | undefined => {
  return policies.find(p => p.id === id);
};

export const getPoliciesByCategory = (category: PolicyCategory): Policy[] => {
  return policies.filter(p => p.category === category);
};

export const getPoliciesByTier = (tier: 1 | 2 | 3): Policy[] => {
  return policies.filter(p => p.tier === tier);
};

export const checkPolicyConflict = (policyId: string, activePolicyIds: string[]): string | null => {
  const policy = getPolicyById(policyId);
  if (!policy) return null;
  
  for (const activeId of activePolicyIds) {
    if (policy.conflictsWith.includes(activeId)) {
      const conflictingPolicy = getPolicyById(activeId);
      return conflictingPolicy?.name || activeId;
    }
  }
  
  return null;
};

export const calculatePolicySynergies = (activePolicyIds: string[]): Map<string, PolicyEffects> => {
  const synergies = new Map<string, PolicyEffects>();
  
  for (const policyId of activePolicyIds) {
    const policy = getPolicyById(policyId);
    if (!policy || !policy.synergyBonus) continue;
    
    const hasSynergy = policy.synergiesWith.some(synergyId => activePolicyIds.includes(synergyId));
    if (hasSynergy) {
      synergies.set(policyId, policy.synergyBonus);
    }
  }
  
  return synergies;
};
