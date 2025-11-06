/**
 * National Decisions Data
 *
 * Defines all national decisions that can be taken with political power.
 */

import { NationalDecision, AdvisorTemplate } from '../types/politicalPower';

export const NATIONAL_DECISIONS: Record<string, NationalDecision> = {
  // ==========================================
  // ECONOMY DECISIONS
  // ==========================================

  mobilize_economy: {
    id: 'mobilize_economy',
    name: 'Mobilize Economy',
    description: 'Redirect civilian industry to military production. +20% production for 10 turns.',
    category: 'economy',
    icon: '🏭',
    ppCost: 100,
    requirements: [
      {
        type: 'min_turn',
        value: 5,
        description: 'Must be turn 5 or later',
      },
    ],
    effects: [
      {
        type: 'production_boost',
        multipliers: {
          productionMultiplier: 1.2,
        },
        duration: 10,
        message: 'Economy mobilized! +20% production for 10 turns.',
      },
    ],
    cooldownTurns: 15,
  },

  emergency_funding: {
    id: 'emergency_funding',
    name: 'Emergency Funding',
    description: 'Request emergency budget allocation. Gain 500 gold immediately.',
    category: 'economy',
    icon: '💰',
    ppCost: 75,
    requirements: [],
    effects: [
      {
        type: 'gold_boost',
        statChanges: {
          gold: 500,
        },
        message: 'Emergency funding approved! Gained 500 gold.',
      },
    ],
    cooldownTurns: 12,
  },

  economic_stimulus: {
    id: 'economic_stimulus',
    name: 'Economic Stimulus',
    description: 'Stimulate the economy with government spending. +15% production for 8 turns.',
    category: 'economy',
    icon: '📈',
    ppCost: 80,
    requirements: [
      {
        type: 'at_peace',
        value: true,
        description: 'Must be at peace',
      },
    ],
    effects: [
      {
        type: 'production_boost',
        multipliers: {
          productionMultiplier: 1.15,
        },
        duration: 8,
        message: 'Economic stimulus enacted! +15% production for 8 turns.',
      },
    ],
    cooldownTurns: 10,
  },

  // ==========================================
  // MILITARY DECISIONS
  // ==========================================

  war_propaganda: {
    id: 'war_propaganda',
    name: 'War Propaganda',
    description: 'Launch propaganda campaign to boost national morale. +15 morale.',
    category: 'military',
    icon: '📢',
    ppCost: 50,
    requirements: [],
    effects: [
      {
        type: 'morale_boost',
        statChanges: {
          morale: 15,
        },
        message: 'War propaganda launched! Morale increased by 15.',
      },
    ],
    cooldownTurns: 8,
  },

  military_expansion: {
    id: 'military_expansion',
    name: 'Military Expansion',
    description: 'Expand military capabilities. +25% military production for 12 turns.',
    category: 'military',
    icon: '⚔️',
    ppCost: 120,
    requirements: [
      {
        type: 'min_turn',
        value: 10,
        description: 'Must be turn 10 or later',
      },
    ],
    effects: [
      {
        type: 'military_boost',
        multipliers: {
          militaryMultiplier: 1.25,
        },
        duration: 12,
        message: 'Military expansion authorized! +25% military production for 12 turns.',
      },
    ],
    cooldownTurns: 15,
  },

  emergency_conscription: {
    id: 'emergency_conscription',
    name: 'Emergency Conscription',
    description: 'Draft citizens into military service. Gain 2 army units immediately.',
    category: 'military',
    icon: '🪖',
    ppCost: 100,
    requirements: [
      {
        type: 'at_war',
        value: true,
        description: 'Must be at war',
      },
      {
        type: 'min_turn',
        value: 11,
        description: 'Conventional warfare era required',
      },
    ],
    effects: [
      {
        type: 'unlock_action',
        message: 'Emergency conscription enacted! 2 army units drafted.',
      },
    ],
    cooldownTurns: 20,
  },

  // ==========================================
  // DIPLOMACY DECISIONS
  // ==========================================

  diplomatic_push: {
    id: 'diplomatic_push',
    name: 'Diplomatic Push',
    description: 'Launch major diplomatic initiative. +25 influence globally.',
    category: 'diplomacy',
    icon: '🤝',
    ppCost: 75,
    requirements: [],
    effects: [
      {
        type: 'influence_boost',
        statChanges: {
          influence: 25,
        },
        message: 'Diplomatic push successful! Gained 25 influence.',
      },
    ],
    cooldownTurns: 10,
  },

  peace_conference: {
    id: 'peace_conference',
    name: 'Peace Conference',
    description: 'Host international peace summit. +15 influence, +2 diplomacy points per turn for 8 turns.',
    category: 'diplomacy',
    icon: '🕊️',
    ppCost: 90,
    requirements: [
      {
        type: 'at_peace',
        value: true,
        description: 'Must be at peace',
      },
      {
        type: 'min_turn',
        value: 8,
        description: 'Must be turn 8 or later',
      },
    ],
    effects: [
      {
        type: 'diplomacy_boost',
        statChanges: {
          influence: 15,
          diplomacy: 2,
        },
        duration: 8,
        message: 'Peace conference hosted! +15 influence, +2 diplomacy/turn for 8 turns.',
      },
    ],
    cooldownTurns: 15,
  },

  foreign_aid_program: {
    id: 'foreign_aid_program',
    name: 'Foreign Aid Program',
    description: 'Provide aid to other nations. +30 influence, improved relations with all nations.',
    category: 'diplomacy',
    icon: '🎁',
    ppCost: 100,
    requirements: [
      {
        type: 'min_gold',
        value: 300,
        description: 'Must have at least 300 gold',
      },
    ],
    effects: [
      {
        type: 'influence_boost',
        statChanges: {
          influence: 30,
        },
        message: 'Foreign aid program launched! +30 influence, improved relations.',
      },
    ],
    cooldownTurns: 12,
  },

  // ==========================================
  // RESEARCH DECISIONS
  // ==========================================

  research_grant: {
    id: 'research_grant',
    name: 'Research Grant',
    description: 'Fund scientific research programs. +30% research speed for 8 turns.',
    category: 'research',
    icon: '🔬',
    ppCost: 60,
    requirements: [],
    effects: [
      {
        type: 'research_boost',
        multipliers: {
          researchMultiplier: 1.3,
        },
        duration: 8,
        message: 'Research grant approved! +30% research speed for 8 turns.',
      },
    ],
    cooldownTurns: 10,
  },

  manhattan_project: {
    id: 'manhattan_project',
    name: 'Manhattan Project II',
    description: 'Launch massive nuclear research program. +50% research speed, -25% nuke costs.',
    category: 'research',
    icon: '☢️',
    ppCost: 150,
    requirements: [
      {
        type: 'min_turn',
        value: 15,
        description: 'Must be turn 15 or later',
      },
    ],
    effects: [
      {
        type: 'permanent_buff',
        multipliers: {
          researchMultiplier: 1.5,
        },
        duration: -1,
        message: 'Manhattan Project II launched! Permanent research and nuclear bonuses.',
      },
    ],
    cooldownTurns: -1, // Can only be used once
  },

  // ==========================================
  // DOMESTIC DECISIONS
  // ==========================================

  emergency_powers: {
    id: 'emergency_powers',
    name: 'Emergency Powers',
    description: 'Seize emergency powers. Take actions without faction approval for 5 turns.',
    category: 'domestic',
    icon: '⚡',
    ppCost: 150,
    requirements: [
      {
        type: 'min_turn',
        value: 10,
        description: 'Must be turn 10 or later',
      },
    ],
    effects: [
      {
        type: 'temporary_buff',
        duration: 5,
        message: 'Emergency powers enacted! Bypass faction approval for 5 turns.',
      },
    ],
    cooldownTurns: 25,
  },

  infrastructure_investment: {
    id: 'infrastructure_investment',
    name: 'Infrastructure Investment',
    description: 'Invest in national infrastructure. +1 production line, +10% production permanently.',
    category: 'domestic',
    icon: '🏗️',
    ppCost: 125,
    requirements: [
      {
        type: 'min_turn',
        value: 8,
        description: 'Must be turn 8 or later',
      },
    ],
    effects: [
      {
        type: 'permanent_buff',
        multipliers: {
          productionMultiplier: 1.1,
        },
        duration: -1,
        message: 'Infrastructure investment completed! +1 production line, +10% production.',
      },
    ],
    cooldownTurns: 20,
  },

  // ==========================================
  // INTELLIGENCE DECISIONS
  // ==========================================

  intelligence_operation: {
    id: 'intelligence_operation',
    name: 'Intelligence Operation',
    description: 'Launch covert intelligence operation. +30 intel immediately.',
    category: 'domestic',
    icon: '🕵️',
    ppCost: 50,
    requirements: [],
    effects: [
      {
        type: 'intel_boost',
        statChanges: {
          intel: 30,
        },
        message: 'Intelligence operation successful! Gained 30 intel.',
      },
    ],
    cooldownTurns: 6,
  },

  counterintelligence_sweep: {
    id: 'counterintelligence_sweep',
    name: 'Counterintelligence Sweep',
    description: 'Root out enemy spies. +15 intel per turn for 10 turns.',
    category: 'domestic',
    icon: '🛡️',
    ppCost: 80,
    requirements: [
      {
        type: 'min_turn',
        value: 11,
        description: 'Must be turn 11 or later',
      },
    ],
    effects: [
      {
        type: 'intel_boost',
        statChanges: {
          intel: 15,
        },
        duration: 10,
        message: 'Counterintelligence sweep initiated! +15 intel/turn for 10 turns.',
      },
    ],
    cooldownTurns: 15,
  },

  // ==========================================
  // WAR DECISIONS
  // ==========================================

  total_war: {
    id: 'total_war',
    name: 'Total War',
    description: 'Declare total war mobilization. +30% all military production, +10 morale.',
    category: 'war',
    icon: '⚔️',
    ppCost: 175,
    requirements: [
      {
        type: 'at_war',
        value: true,
        description: 'Must be at war',
      },
      {
        type: 'min_turn',
        value: 15,
        description: 'Must be turn 15 or later',
      },
    ],
    effects: [
      {
        type: 'military_boost',
        multipliers: {
          militaryMultiplier: 1.3,
        },
        statChanges: {
          morale: 10,
        },
        duration: 15,
        message: 'Total war declared! +30% military production, +10 morale for 15 turns.',
      },
    ],
    cooldownTurns: -1, // Can only be used once
  },
};

// ==========================================
// POLITICAL ADVISORS
// ==========================================

export const POLITICAL_ADVISORS: Record<string, AdvisorTemplate> = {
  economic_advisor: {
    id: 'economic_advisor',
    name: 'Dr. Margaret Chen',
    title: 'Economic Advisor',
    description: 'Expert economist who improves production efficiency.',
    portrait: '👩‍💼',
    hireCost: 150,
    bonuses: [
      {
        id: 'economic_advisor_bonus',
        advisorName: 'Dr. Margaret Chen',
        bonusType: 'pp_generation',
        value: 1,
        hiredTurn: 0,
      },
    ],
  },

  military_strategist: {
    id: 'military_strategist',
    name: 'General Marcus Stone',
    title: 'Military Strategist',
    description: 'Veteran general who reduces military decision costs.',
    portrait: '👨‍✈️',
    hireCost: 180,
    bonuses: [
      {
        id: 'military_strategist_bonus',
        advisorName: 'General Marcus Stone',
        bonusType: 'decision_cost_reduction',
        value: 15, // 15% cost reduction on military decisions
        hiredTurn: 0,
      },
    ],
  },

  diplomatic_envoy: {
    id: 'diplomatic_envoy',
    name: 'Ambassador Liu Wei',
    title: 'Diplomatic Envoy',
    description: 'Skilled diplomat who improves international relations.',
    portrait: '🧑‍💼',
    hireCost: 160,
    bonuses: [
      {
        id: 'diplomatic_envoy_bonus',
        advisorName: 'Ambassador Liu Wei',
        bonusType: 'pp_generation',
        value: 1,
        hiredTurn: 0,
      },
    ],
  },

  intelligence_director: {
    id: 'intelligence_director',
    name: 'Director Sarah Kozlov',
    title: 'Intelligence Director',
    description: 'Expert spymaster who enhances intelligence operations.',
    portrait: '🕵️‍♀️',
    hireCost: 200,
    bonuses: [
      {
        id: 'intelligence_director_bonus',
        advisorName: 'Director Sarah Kozlov',
        bonusType: 'pp_max',
        value: 50,
        hiredTurn: 0,
      },
    ],
    minTurn: 11,
  },

  propaganda_minister: {
    id: 'propaganda_minister',
    name: 'Minister Viktor Petrov',
    title: 'Propaganda Minister',
    description: 'Master of public relations and media manipulation.',
    portrait: '📻',
    hireCost: 170,
    bonuses: [
      {
        id: 'propaganda_minister_bonus',
        advisorName: 'Minister Viktor Petrov',
        bonusType: 'pp_generation',
        value: 1,
        hiredTurn: 0,
      },
    ],
  },
};

/**
 * Get decision by ID
 */
export function getDecision(decisionId: string): NationalDecision | undefined {
  return NATIONAL_DECISIONS[decisionId];
}

/**
 * Get all decisions by category
 */
export function getDecisionsByCategory(category: string): NationalDecision[] {
  return Object.values(NATIONAL_DECISIONS).filter((decision) => decision.category === category);
}

/**
 * Get advisor by ID
 */
export function getAdvisor(advisorId: string): AdvisorTemplate | undefined {
  return POLITICAL_ADVISORS[advisorId];
}

/**
 * Get available advisors for a nation
 */
export function getAvailableAdvisors(
  currentTurn: number,
  ideology?: string
): AdvisorTemplate[] {
  return Object.values(POLITICAL_ADVISORS).filter((advisor) => {
    if (advisor.minTurn && currentTurn < advisor.minTurn) {
      return false;
    }
    if (advisor.requiredIdeology && ideology !== advisor.requiredIdeology) {
      return false;
    }
    return true;
  });
}
