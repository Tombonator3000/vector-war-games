/**
 * Major Decision Moments
 * Inspired by Stellaris' Megastructures and Civ's key moments
 */

export type MajorDecisionType =
  | 'nuclear_treaty'
  | 'space_race'
  | 'world_summit'
  | 'economic_union'
  | 'military_alliance_network'
  | 'global_pandemic_response';

export interface MajorDecisionOption {
  id: string;
  title: string;
  description: string;
  requirements?: {
    minInfluence?: number;
    minAlliances?: number;
    minProduction?: number;
    minTerritories?: number;
  };
  effects: {
    immediate: string[];
    longTerm: string[];
  };
  costs?: {
    production?: number;
    uranium?: number;
    intel?: number;
    influence?: number;
  };
  voteWeight?: number; // For voting decisions
}

export interface MajorDecision {
  type: MajorDecisionType;
  title: string;
  description: string;
  triggerTurn: number;
  isVoting: boolean; // If true, all nations vote
  options: MajorDecisionOption[];
  icon: string;
  category: 'diplomatic' | 'military' | 'economic' | 'technological';
}

export interface MajorDecisionResult {
  decisionType: MajorDecisionType;
  chosenOption: string;
  playerChoice: string;
  aiVotes?: Record<string, string>; // nationId -> optionId
  outcome: string;
  effects: string[];
}

export const MAJOR_DECISIONS: Record<MajorDecisionType, MajorDecision> = {
  nuclear_treaty: {
    type: 'nuclear_treaty',
    title: 'Nuclear Proliferation Treaty',
    description:
      'The world debates limiting nuclear weapons. Your vote will shape the future of warfare.',
    triggerTurn: 15,
    isVoting: true,
    icon: '☢️',
    category: 'diplomatic',
    options: [
      {
        id: 'support_treaty',
        title: 'Support Treaty',
        description: 'Ban all nuclear weapons development',
        voteWeight: 1,
        effects: {
          immediate: [
            'Nuclear weapons banned globally',
            'Cannot build new missiles or bombers',
            'Diplomatic victory requirements reduced by 20%',
          ],
          longTerm: [
            'Focus shifts to conventional warfare',
            'Global tension decreases (DEFCON +1)',
            'Economic growth increases (+10% Production)',
          ],
        },
      },
      {
        id: 'oppose_treaty',
        title: 'Oppose Treaty',
        description: 'Continue arms race',
        voteWeight: 1,
        effects: {
          immediate: [
            'Treaty fails - arms race continues',
            'Missile costs reduced by 20%',
            'Diplomatic victory blocked for 10 turns',
          ],
          longTerm: [
            'Military escalation accelerates',
            'DEFCON decreases faster',
            'Research speed +15% for nuclear tech',
          ],
        },
      },
      {
        id: 'abstain',
        title: 'Abstain',
        description: 'Remain neutral',
        voteWeight: 0,
        effects: {
          immediate: ['No immediate impact'],
          longTerm: ['Relations unchanged with all nations'],
        },
      },
    ],
  },

  space_race: {
    type: 'space_race',
    title: 'The Space Race',
    description:
      'Launch a satellite network to gain strategic superiority. First nation to complete gains massive advantage.',
    triggerTurn: 25,
    isVoting: false,
    icon: '🛰️',
    category: 'technological',
    options: [
      {
        id: 'invest_heavily',
        title: 'Full Investment',
        description: 'Dedicate maximum resources to win the space race',
        requirements: {
          minProduction: 150,
        },
        costs: {
          production: 200,
          uranium: 50,
          intel: 50,
        },
        effects: {
          immediate: [
            'Begin satellite network construction (4 turns)',
            'Production reduced by 50 for duration',
          ],
          longTerm: [
            'Reveal all enemy positions permanently',
            '+30 Intel per turn',
            'Can deploy orbital strikes',
            'Prestige: +50 Global Influence',
          ],
        },
      },
      {
        id: 'moderate_investment',
        title: 'Measured Approach',
        description: 'Participate but conserve resources',
        requirements: {
          minProduction: 100,
        },
        costs: {
          production: 100,
          uranium: 25,
        },
        effects: {
          immediate: ['Begin satellite program (6 turns)'],
          longTerm: ['Partial intel advantage', '+15 Intel per turn'],
        },
      },
      {
        id: 'decline',
        title: 'Decline Participation',
        description: 'Focus resources elsewhere',
        effects: {
          immediate: ['No satellite program'],
          longTerm: [
            'Other nations may gain intel advantage',
            'Save resources for other priorities',
          ],
        },
      },
    ],
  },

  world_summit: {
    type: 'world_summit',
    title: 'World Summit',
    description:
      'Propose forming a United Nations. Requires majority support from all nations.',
    triggerTurn: 35,
    isVoting: true,
    icon: '🏛️',
    category: 'diplomatic',
    options: [
      {
        id: 'propose_un',
        title: 'Propose United Nations',
        description: 'Form international governing body',
        requirements: {
          minAlliances: 4,
          minInfluence: 100,
        },
        voteWeight: 2, // Proposer gets double weight
        costs: {
          production: 100,
          influence: 50,
        },
        effects: {
          immediate: [
            'UN formation vote begins',
            'If passes: Diplomatic victory 30% easier',
            'If fails: DEFCON -1, lose 20 influence',
          ],
          longTerm: [
            'UN mediates conflicts',
            'Global treaties easier to negotiate',
            'Economic cooperation bonuses',
          ],
        },
      },
      {
        id: 'oppose_un',
        title: 'Oppose Formation',
        description: 'Maintain national sovereignty',
        voteWeight: 1,
        effects: {
          immediate: [
            'UN vote fails',
            'Nationalist boost: +10% Production',
            'Isolationist nations become allies',
          ],
          longTerm: [
            'Continue unilateral actions',
            'No diplomatic restrictions',
            'Relations with some nations worsen',
          ],
        },
      },
      {
        id: 'conditional_support',
        title: 'Conditional Support',
        description: 'Support with conditions',
        voteWeight: 0.5,
        effects: {
          immediate: ['Half vote toward UN formation'],
          longTerm: ['Maintain flexibility', 'Minor diplomatic bonuses'],
        },
      },
    ],
  },

  economic_union: {
    type: 'economic_union',
    title: 'Global Economic Union',
    description: 'Form trade bloc for massive economic benefits',
    triggerTurn: 30,
    isVoting: false,
    icon: '💰',
    category: 'economic',
    options: [
      {
        id: 'found_union',
        title: 'Found Union',
        description: 'Lead the economic bloc',
        requirements: {
          minAlliances: 3,
          minProduction: 120,
        },
        costs: {
          production: 150,
        },
        effects: {
          immediate: [
            'Form trade bloc with allies',
            '+20% Production from trade',
          ],
          longTerm: [
            'All member nations gain +15% Production',
            'Shared technology research',
            'Economic victory 25% easier',
          ],
        },
      },
      {
        id: 'join_union',
        title: 'Join Existing Union',
        description: 'Join if another nation forms one',
        costs: {
          production: 50,
        },
        effects: {
          immediate: ['Gain trade benefits'],
          longTerm: ['+10% Production', 'Technology sharing'],
        },
      },
      {
        id: 'economic_isolationism',
        title: 'Economic Isolationism',
        description: 'Remain independent',
        effects: {
          immediate: ['No trade dependencies'],
          longTerm: [
            'Control own economy',
            'Slower growth but more stable',
          ],
        },
      },
    ],
  },

  military_alliance_network: {
    type: 'military_alliance_network',
    title: 'Global Military Alliance',
    description: 'Form NATO-style collective defense pact',
    triggerTurn: 20,
    isVoting: false,
    icon: '🛡️',
    category: 'military',
    options: [
      {
        id: 'form_nato',
        title: 'Form Alliance Network',
        description: 'Create collective defense organization',
        requirements: {
          minAlliances: 3,
        },
        costs: {
          production: 100,
        },
        effects: {
          immediate: [
            'All allies automatically defend each other',
            'Shared military intelligence',
          ],
          longTerm: [
            'Attack on one is attack on all',
            '+20% Defense for all members',
            'Coordinated military operations',
          ],
        },
      },
      {
        id: 'bilateral_defense',
        title: 'Bilateral Agreements',
        description: 'Maintain individual defense pacts',
        effects: {
          immediate: ['Current alliances unchanged'],
          longTerm: ['More flexibility', 'No automatic war declarations'],
        },
      },
      {
        id: 'non_alignment',
        title: 'Non-Aligned Movement',
        description: 'Avoid military blocs entirely',
        effects: {
          immediate: ['Neutral status'],
          longTerm: [
            'Cannot be dragged into wars',
            'Limited military cooperation',
          ],
        },
      },
    ],
  },

  global_pandemic_response: {
    type: 'global_pandemic_response',
    title: 'Global Pandemic Response',
    description: 'Coordinate international response to disease outbreak',
    triggerTurn: 18,
    isVoting: true,
    icon: '🏥',
    category: 'diplomatic',
    options: [
      {
        id: 'full_cooperation',
        title: 'Full Cooperation',
        description: 'Share research and resources',
        voteWeight: 1,
        costs: {
          production: 50,
          intel: 30,
        },
        effects: {
          immediate: [
            'Vaccine development 50% faster',
            'All nations share medical research',
          ],
          longTerm: [
            'Pandemic contained faster',
            'Improved global relations (+10 all)',
            'Healthcare infrastructure bonus',
          ],
        },
      },
      {
        id: 'limited_cooperation',
        title: 'Limited Cooperation',
        description: 'Help allies only',
        costs: {
          production: 25,
        },
        effects: {
          immediate: ['Share research with allies'],
          longTerm: ['Allies protected', 'Others left vulnerable'],
        },
      },
      {
        id: 'nationalistic_response',
        title: 'Nationalist Response',
        description: 'Protect own nation first',
        effects: {
          immediate: [
            'Close borders',
            'Vaccine research for own use only',
          ],
          longTerm: [
            'Own population protected faster',
            'Global relations worsen (-15 all)',
            'Pandemic spreads globally',
          ],
        },
      },
    ],
  },
};

/**
 * Determine if a major decision should trigger this turn
 */
export function shouldTriggerMajorDecision(
  currentTurn: number,
  completedDecisions: MajorDecisionType[]
): MajorDecision | null {
  for (const decision of Object.values(MAJOR_DECISIONS)) {
    if (
      decision.triggerTurn === currentTurn &&
      !completedDecisions.includes(decision.type)
    ) {
      return decision;
    }
  }
  return null;
}

/**
 * Simulate AI nation voting on a decision
 */
export function simulateAIVote(
  decision: MajorDecision,
  aiPersonality: string,
  relationWithPlayer: number
): string {
  // Personalities affect voting
  const options = decision.options.filter((opt) => opt.voteWeight !== undefined);

  if (options.length === 0) {
    return decision.options[0].id;
  }

  // Aggressive personalities oppose peace treaties
  if (decision.type === 'nuclear_treaty' && aiPersonality === 'aggressive') {
    return 'oppose_treaty';
  }

  // Defensive personalities support cooperation
  if (aiPersonality === 'defensive' && decision.options[0].id.includes('support')) {
    return decision.options[0].id;
  }

  // Influenced by relations with player
  if (relationWithPlayer > 50) {
    // Support player's likely choice
    return decision.options[0].id;
  }

  // Random weighted choice
  const weights = options.map((opt) => opt.voteWeight || 0);
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < options.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return options[i].id;
    }
  }

  return options[0].id;
}
