/**
 * Regional Political Events
 *
 * Events that target specific regions/territories, including regional unrest,
 * protests, strikes, and local political crises.
 */

import type { RegionalMorale, ProtestCause, StrikeType } from '../../types/regionalMorale';

export interface RegionalPoliticalEvent {
  id: string;
  title: string;
  description: string;
  severity: 'minor' | 'serious' | 'critical';
  targetType: 'single_territory' | 'multiple_territories' | 'nation_wide';

  // Trigger conditions
  conditions: {
    territoryMoraleBelow?: number;
    territoryMoraleAbove?: number;
    hasActiveProtest?: boolean;
    hasActiveStrike?: boolean;
    neighboringUnrest?: boolean; // Adjacent territory has unrest
    recentMilitaryLoss?: boolean;
    nuclearStrike?: boolean;
    minTurn?: number;
  };

  cooldownTurns: number;

  // Event options
  options: RegionalEventOption[];

  // Auto-resolve for AI
  autoResolve?: RegionalEventOutcome;
}

export interface RegionalEventOption {
  id: string;
  label: string;
  description: string;
  cost?: {
    gold?: number;
    production?: number;
    intel?: number;
    publicOpinion?: number;
    cabinetApproval?: number;
  };

  // Possible outcomes with probabilities
  outcomes: {
    probability: number;
    outcome: RegionalEventOutcome;
  }[];
}

export interface RegionalEventOutcome {
  description: string;

  // Territory-level effects
  territoryEffects: {
    moraleDelta?: number;
    startProtest?: { causes: ProtestCause[]; intensity: number };
    startStrike?: { type: StrikeType; severity: 'minor' | 'major' | 'critical' };
    endProtest?: boolean;
    endStrike?: boolean;
    spreadToNeighbors?: boolean;
  };

  // Nation-level effects
  nationEffects?: {
    publicOpinionDelta?: number;
    cabinetApprovalDelta?: number;
    nationalMoraleDelta?: number;
    goldDelta?: number;
    productionDelta?: number;
  };

  // Narrative
  newsHeadline?: string;
}

// Regional event definitions
export const REGIONAL_POLITICAL_EVENTS: RegionalPoliticalEvent[] = [
  {
    id: 'regional_protest_outbreak',
    title: 'Regional Protest Movement',
    description: 'Growing discontent in {territory} has sparked mass protests demanding change.',
    severity: 'serious',
    targetType: 'single_territory',
    conditions: {
      territoryMoraleBelow: 45,
      hasActiveProtest: false,
    },
    cooldownTurns: 4,
    options: [
      {
        id: 'negotiate',
        label: 'Negotiate with Protesters',
        description: 'Send representatives to address their grievances peacefully.',
        cost: { gold: 30, publicOpinion: -2 },
        outcomes: [
          {
            probability: 65,
            outcome: {
              description: 'Negotiations succeed. Protesters disperse peacefully.',
              territoryEffects: {
                moraleDelta: 10,
              },
              nationEffects: {
                publicOpinionDelta: 5,
              },
              newsHeadline: 'Government Reaches Accord with Protesters in {territory}',
            },
          },
          {
            probability: 35,
            outcome: {
              description: 'Talks break down. Protests intensify.',
              territoryEffects: {
                moraleDelta: -5,
                startProtest: { causes: ['low_morale', 'policy_discontent'], intensity: 5 },
              },
              nationEffects: {
                publicOpinionDelta: -3,
              },
              newsHeadline: 'Negotiations Fail as Protests Escalate in {territory}',
            },
          },
        ],
      },
      {
        id: 'suppress_force',
        label: 'Suppress with Force',
        description: 'Deploy security forces to disperse the crowds.',
        cost: { publicOpinion: -8, cabinetApproval: -5 },
        outcomes: [
          {
            probability: 50,
            outcome: {
              description: 'Protests violently suppressed. Order restored, but at great cost.',
              territoryEffects: {
                moraleDelta: -15,
              },
              nationEffects: {
                publicOpinionDelta: -12,
                cabinetApprovalDelta: -8,
              },
              newsHeadline: 'Violent Crackdown in {territory} Draws International Condemnation',
            },
          },
          {
            probability: 50,
            outcome: {
              description: 'Suppression backfires. Protests spread to neighboring regions.',
              territoryEffects: {
                moraleDelta: -20,
                startProtest: { causes: ['low_morale'], intensity: 7 },
                spreadToNeighbors: true,
              },
              nationEffects: {
                publicOpinionDelta: -15,
                nationalMoraleDelta: -5,
              },
              newsHeadline: 'Brutal Crackdown Sparks Nationwide Unrest',
            },
          },
        ],
      },
      {
        id: 'concessions',
        label: 'Make Concessions',
        description: 'Grant protesters key demands to restore peace.',
        cost: { gold: 50, production: 20 },
        outcomes: [
          {
            probability: 85,
            outcome: {
              description: 'Concessions accepted. Protests end peacefully.',
              territoryEffects: {
                moraleDelta: 20,
              },
              nationEffects: {
                publicOpinionDelta: 8,
                cabinetApprovalDelta: -3,
              },
              newsHeadline: 'Government Makes Historic Concessions to End {territory} Crisis',
            },
          },
          {
            probability: 15,
            outcome: {
              description: 'Concessions seen as weakness. Protesters demand more.',
              territoryEffects: {
                moraleDelta: 5,
                startProtest: { causes: ['policy_discontent'], intensity: 4 },
              },
              nationEffects: {
                publicOpinionDelta: 2,
                cabinetApprovalDelta: -8,
              },
              newsHeadline: 'Protesters Reject Government Concessions, Demand More Reforms',
            },
          },
        ],
      },
      {
        id: 'ignore',
        label: 'Ignore the Protests',
        description: 'Let them tire themselves out without intervention.',
        cost: {},
        outcomes: [
          {
            probability: 30,
            outcome: {
              description: 'Protests fizzle out on their own.',
              territoryEffects: {
                moraleDelta: -3,
              },
              newsHeadline: 'Protest Movement in {territory} Loses Momentum',
            },
          },
          {
            probability: 70,
            outcome: {
              description: 'Ignored protesters grow angrier and more organized.',
              territoryEffects: {
                moraleDelta: -10,
                startProtest: { causes: ['low_morale', 'policy_discontent'], intensity: 6 },
                spreadToNeighbors: true,
              },
              nationEffects: {
                publicOpinionDelta: -8,
              },
              newsHeadline: 'Government Inaction Fuels Growing Protest Movement',
            },
          },
        ],
      },
    ],
    autoResolve: {
      description: 'Local authorities attempt negotiations.',
      territoryEffects: {
        moraleDelta: -5,
      },
      nationEffects: {
        publicOpinionDelta: -3,
      },
    },
  },

  {
    id: 'industrial_strike',
    title: 'Workers Strike',
    description: 'Industrial workers in {territory} have walked off the job, demanding better conditions.',
    severity: 'serious',
    targetType: 'single_territory',
    conditions: {
      territoryMoraleBelow: 50,
      hasActiveStrike: false,
    },
    cooldownTurns: 5,
    options: [
      {
        id: 'meet_demands',
        label: 'Meet Worker Demands',
        description: 'Pay the cost to satisfy strikers immediately.',
        cost: { gold: 60 },
        outcomes: [
          {
            probability: 100,
            outcome: {
              description: 'Workers return to their posts satisfied.',
              territoryEffects: {
                moraleDelta: 15,
                endStrike: true,
              },
              nationEffects: {
                publicOpinionDelta: 5,
              },
              newsHeadline: 'Government Settles Strike in {territory}, Production Resumes',
            },
          },
        ],
      },
      {
        id: 'negotiate_strike',
        label: 'Negotiate Settlement',
        description: 'Work toward a compromise with the strikers.',
        cost: { gold: 20 },
        outcomes: [
          {
            probability: 60,
            outcome: {
              description: 'Partial agreement reached. Strike continues at reduced intensity.',
              territoryEffects: {
                moraleDelta: 5,
                startStrike: { type: 'industrial_strike', severity: 'minor' },
              },
              newsHeadline: 'Partial Deal Reduces Strike Impact in {territory}',
            },
          },
          {
            probability: 40,
            outcome: {
              description: 'Negotiations stall. Strike drags on.',
              territoryEffects: {
                moraleDelta: -3,
                startStrike: { type: 'industrial_strike', severity: 'major' },
              },
              newsHeadline: 'Strike Negotiations Collapse in {territory}',
            },
          },
        ],
      },
      {
        id: 'break_strike',
        label: 'Break the Strike',
        description: 'Use force to end the strike and arrest ringleaders.',
        cost: { publicOpinion: -10 },
        outcomes: [
          {
            probability: 45,
            outcome: {
              description: 'Strike broken. Workers return under duress.',
              territoryEffects: {
                moraleDelta: -12,
                endStrike: true,
              },
              nationEffects: {
                publicOpinionDelta: -15,
                cabinetApprovalDelta: -5,
              },
              newsHeadline: 'Security Forces Break Strike in {territory}, Arrests Made',
            },
          },
          {
            probability: 55,
            outcome: {
              description: 'Workers resist. Strike becomes general strike.',
              territoryEffects: {
                moraleDelta: -20,
                startStrike: { type: 'general_strike', severity: 'critical' },
                spreadToNeighbors: true,
              },
              nationEffects: {
                publicOpinionDelta: -20,
                nationalMoraleDelta: -8,
              },
              newsHeadline: 'Crackdown Backfires: General Strike Paralyzes {territory}',
            },
          },
        ],
      },
      {
        id: 'wait_out',
        label: 'Wait It Out',
        description: 'Do nothing and hope the strike resolves itself.',
        cost: {},
        outcomes: [
          {
            probability: 25,
            outcome: {
              description: 'Strike eventually fizzles out.',
              territoryEffects: {
                moraleDelta: -5,
                endStrike: true,
              },
              newsHeadline: 'Strike in {territory} Ends Without Resolution',
            },
          },
          {
            probability: 75,
            outcome: {
              description: 'Strike continues indefinitely, crippling production.',
              territoryEffects: {
                moraleDelta: -8,
                startStrike: { type: 'industrial_strike', severity: 'major' },
              },
              nationEffects: {
                productionDelta: -30,
              },
              newsHeadline: 'Ongoing Strike in {territory} Devastates Economy',
            },
          },
        ],
      },
    ],
    autoResolve: {
      description: 'Strike continues with minimal intervention.',
      territoryEffects: {
        moraleDelta: -5,
        startStrike: { type: 'industrial_strike', severity: 'major' },
      },
      nationEffects: {
        productionDelta: -15,
      },
    },
  },

  {
    id: 'regional_independence_movement',
    title: 'Independence Movement',
    description: 'A growing separatist movement in {territory} demands autonomy or independence.',
    severity: 'critical',
    targetType: 'single_territory',
    conditions: {
      territoryMoraleBelow: 30,
      minTurn: 10,
    },
    cooldownTurns: 10,
    options: [
      {
        id: 'grant_autonomy',
        label: 'Grant Regional Autonomy',
        description: 'Allow {territory} self-governance while remaining part of the nation.',
        cost: { production: 30, intel: 10 },
        outcomes: [
          {
            probability: 75,
            outcome: {
              description: 'Autonomy satisfies the separatists. Crisis averted.',
              territoryEffects: {
                moraleDelta: 30,
              },
              nationEffects: {
                publicOpinionDelta: 8,
                cabinetApprovalDelta: -10,
              },
              newsHeadline: 'Historic Autonomy Deal Ends {territory} Crisis',
            },
          },
          {
            probability: 25,
            outcome: {
              description: 'Separatists see this as weakness and push for full independence.',
              territoryEffects: {
                moraleDelta: 10,
                startProtest: { causes: ['occupation'], intensity: 8 },
              },
              nationEffects: {
                cabinetApprovalDelta: -15,
              },
              newsHeadline: 'Autonomy Not Enough: {territory} Demands Full Independence',
            },
          },
        ],
      },
      {
        id: 'military_occupation',
        label: 'Military Occupation',
        description: 'Deploy military forces to crush the independence movement.',
        cost: { publicOpinion: -20, cabinetApproval: -10 },
        outcomes: [
          {
            probability: 40,
            outcome: {
              description: 'Occupation succeeds but creates resentment for generations.',
              territoryEffects: {
                moraleDelta: -25,
              },
              nationEffects: {
                publicOpinionDelta: -25,
                nationalMoraleDelta: -10,
              },
              newsHeadline: 'Military Occupation Quells {territory} Uprising',
            },
          },
          {
            probability: 60,
            outcome: {
              description: 'Occupation sparks armed resistance and potential civil war.',
              territoryEffects: {
                moraleDelta: -35,
                startProtest: { causes: ['occupation', 'war_exhaustion'], intensity: 10 },
                spreadToNeighbors: true,
              },
              nationEffects: {
                publicOpinionDelta: -30,
                nationalMoraleDelta: -15,
              },
              newsHeadline: 'Civil War Looms as {territory} Resists Occupation',
            },
          },
        ],
      },
      {
        id: 'economic_incentives',
        label: 'Economic Incentives',
        description: 'Invest heavily in {territory} to improve living standards.',
        cost: { gold: 100, production: 50 },
        outcomes: [
          {
            probability: 70,
            outcome: {
              description: 'Economic development reduces support for independence.',
              territoryEffects: {
                moraleDelta: 25,
              },
              nationEffects: {
                publicOpinionDelta: 12,
              },
              newsHeadline: 'Massive Investment in {territory} Eases Tensions',
            },
          },
          {
            probability: 30,
            outcome: {
              description: 'Separatists reject what they see as a bribe.',
              territoryEffects: {
                moraleDelta: 5,
              },
              nationEffects: {
                publicOpinionDelta: -5,
              },
              newsHeadline: '{territory} Separatists Reject Economic Package',
            },
          },
        ],
      },
      {
        id: 'referendum',
        label: 'Allow Referendum',
        description: 'Let the people of {territory} vote on their future.',
        cost: { intel: 20 },
        outcomes: [
          {
            probability: 35,
            outcome: {
              description: 'Referendum votes to remain. Crisis resolved democratically.',
              territoryEffects: {
                moraleDelta: 20,
              },
              nationEffects: {
                publicOpinionDelta: 15,
              },
              newsHeadline: '{territory} Votes to Remain in Historic Referendum',
            },
          },
          {
            probability: 65,
            outcome: {
              description: 'Referendum votes for independence. Territory is lost.',
              territoryEffects: {
                moraleDelta: -50, // Territory effectively lost
              },
              nationEffects: {
                publicOpinionDelta: -10,
                cabinetApprovalDelta: -20,
                productionDelta: -40,
              },
              newsHeadline: '{territory} Votes for Independence, Nation Divided',
            },
          },
        ],
      },
    ],
    autoResolve: {
      description: 'Central government applies economic pressure.',
      territoryEffects: {
        moraleDelta: -10,
      },
      nationEffects: {
        publicOpinionDelta: -5,
      },
    },
  },

  {
    id: 'refugee_influx',
    title: 'Refugee Crisis',
    description: 'Thousands of refugees from neighboring conflicts flood into {territory}.',
    severity: 'serious',
    targetType: 'single_territory',
    conditions: {
      neighboringUnrest: true,
    },
    cooldownTurns: 3,
    options: [
      {
        id: 'accept_refugees',
        label: 'Accept All Refugees',
        description: 'Provide humanitarian aid and integrate refugees.',
        cost: { gold: 40, production: 20 },
        outcomes: [
          {
            probability: 60,
            outcome: {
              description: 'Refugees integrate successfully, adding to population.',
              territoryEffects: {
                moraleDelta: 5,
              },
              nationEffects: {
                publicOpinionDelta: 10,
              },
              newsHeadline: '{territory} Praised for Humanitarian Response to Refugee Crisis',
            },
          },
          {
            probability: 40,
            outcome: {
              description: 'Refugee influx strains local resources, causing tensions.',
              territoryEffects: {
                moraleDelta: -8,
                startProtest: { causes: ['refugees'], intensity: 4 },
              },
              nationEffects: {
                publicOpinionDelta: -5,
              },
              newsHeadline: 'Refugee Crisis Overwhelms {territory} Services',
            },
          },
        ],
      },
      {
        id: 'close_borders',
        label: 'Close Borders',
        description: 'Seal the border and turn refugees away.',
        cost: { publicOpinion: -12 },
        outcomes: [
          {
            probability: 100,
            outcome: {
              description: 'Borders closed. Refugee crisis averted but at moral cost.',
              territoryEffects: {
                moraleDelta: -5,
              },
              nationEffects: {
                publicOpinionDelta: -15,
              },
              newsHeadline: '{territory} Closes Borders to Refugees, Drawing Criticism',
            },
          },
        ],
      },
      {
        id: 'refugee_camps',
        label: 'Establish Refugee Camps',
        description: 'Set up temporary camps while seeking permanent solutions.',
        cost: { gold: 25, intel: 5 },
        outcomes: [
          {
            probability: 80,
            outcome: {
              description: 'Camps provide temporary solution while maintaining order.',
              territoryEffects: {
                moraleDelta: 2,
              },
              nationEffects: {
                publicOpinionDelta: 3,
              },
              newsHeadline: '{territory} Establishes Refugee Camps for Displaced Persons',
            },
          },
          {
            probability: 20,
            outcome: {
              description: 'Camps become overcrowded and unsanitary.',
              territoryEffects: {
                moraleDelta: -5,
              },
              nationEffects: {
                publicOpinionDelta: -8,
              },
              newsHeadline: 'Conditions Deteriorate in {territory} Refugee Camps',
            },
          },
        ],
      },
    ],
    autoResolve: {
      description: 'Limited refugee acceptance with minimal support.',
      territoryEffects: {
        moraleDelta: -3,
      },
      nationEffects: {
        publicOpinionDelta: -2,
      },
    },
  },

  {
    id: 'post_nuclear_unrest',
    title: 'Post-Nuclear Strike Chaos',
    description: 'Survivors in {territory} riot against the government that failed to protect them.',
    severity: 'critical',
    targetType: 'single_territory',
    conditions: {
      nuclearStrike: true,
      territoryMoraleBelow: 40,
    },
    cooldownTurns: 8,
    options: [
      {
        id: 'emergency_aid',
        label: 'Emergency Disaster Relief',
        description: 'Deploy all available resources to help survivors.',
        cost: { gold: 80, production: 60 },
        outcomes: [
          {
            probability: 70,
            outcome: {
              description: 'Massive relief effort prevents total collapse.',
              territoryEffects: {
                moraleDelta: 15,
              },
              nationEffects: {
                publicOpinionDelta: 10,
              },
              newsHeadline: 'Government Launches Massive Relief Effort in Devastated {territory}',
            },
          },
          {
            probability: 30,
            outcome: {
              description: 'Relief efforts are too little, too late.',
              territoryEffects: {
                moraleDelta: 5,
                startProtest: { causes: ['nuclear_strikes'], intensity: 9 },
              },
              nationEffects: {
                publicOpinionDelta: -5,
              },
              newsHeadline: 'Inadequate Relief Fuels Anger in {territory}',
            },
          },
        ],
      },
      {
        id: 'martial_law',
        label: 'Declare Martial Law',
        description: 'Impose military control to maintain order.',
        cost: { publicOpinion: -15 },
        outcomes: [
          {
            probability: 55,
            outcome: {
              description: 'Martial law restores order but alienates survivors.',
              territoryEffects: {
                moraleDelta: -10,
              },
              nationEffects: {
                publicOpinionDelta: -20,
                cabinetApprovalDelta: -10,
              },
              newsHeadline: 'Martial Law Declared in {territory} After Nuclear Attack',
            },
          },
          {
            probability: 45,
            outcome: {
              description: 'Martial law sparks armed resistance.',
              territoryEffects: {
                moraleDelta: -25,
                startProtest: { causes: ['nuclear_strikes', 'occupation'], intensity: 10 },
              },
              nationEffects: {
                publicOpinionDelta: -25,
                nationalMoraleDelta: -12,
              },
              newsHeadline: 'Martial Law Triggers Armed Uprising in {territory}',
            },
          },
        ],
      },
      {
        id: 'evacuate',
        label: 'Mass Evacuation',
        description: 'Evacuate all survivors to safer regions.',
        cost: { gold: 50, production: 30 },
        outcomes: [
          {
            probability: 80,
            outcome: {
              description: 'Evacuation saves lives and prevents further casualties.',
              territoryEffects: {
                moraleDelta: 10,
              },
              nationEffects: {
                publicOpinionDelta: 8,
              },
              newsHeadline: 'Successful Evacuation of {territory} Survivors',
            },
          },
          {
            probability: 20,
            outcome: {
              description: 'Evacuation is chaotic and disorganized.',
              territoryEffects: {
                moraleDelta: -5,
              },
              nationEffects: {
                publicOpinionDelta: -3,
              },
              newsHeadline: 'Chaotic Evacuation of {territory} Results in Further Casualties',
            },
          },
        ],
      },
    ],
    autoResolve: {
      description: 'Limited government response to nuclear devastation.',
      territoryEffects: {
        moraleDelta: -15,
        startProtest: { causes: ['nuclear_strikes'], intensity: 7 },
      },
      nationEffects: {
        publicOpinionDelta: -10,
        nationalMoraleDelta: -5,
      },
    },
  },
];

/**
 * Get applicable regional events for a territory
 */
export function getApplicableRegionalEvents(
  territory: {
    id: string;
    morale: number;
    hasProtest: boolean;
    hasStrike: boolean;
  },
  context: {
    turn: number;
    neighboringUnrest: boolean;
    recentNuclearStrike: boolean;
    recentMilitaryLoss: boolean;
  },
  lastEventTurn: number
): RegionalPoliticalEvent[] {
  return REGIONAL_POLITICAL_EVENTS.filter((event) => {
    // Check cooldown
    if (context.turn - lastEventTurn < event.cooldownTurns) {
      return false;
    }

    const conditions = event.conditions;

    // Check all conditions
    if (conditions.territoryMoraleBelow !== undefined) {
      if (territory.morale >= conditions.territoryMoraleBelow) return false;
    }

    if (conditions.territoryMoraleAbove !== undefined) {
      if (territory.morale <= conditions.territoryMoraleAbove) return false;
    }

    if (conditions.hasActiveProtest !== undefined) {
      if (territory.hasProtest !== conditions.hasActiveProtest) return false;
    }

    if (conditions.hasActiveStrike !== undefined) {
      if (territory.hasStrike !== conditions.hasActiveStrike) return false;
    }

    if (conditions.neighboringUnrest !== undefined) {
      if (context.neighboringUnrest !== conditions.neighboringUnrest) return false;
    }

    if (conditions.nuclearStrike !== undefined) {
      if (context.recentNuclearStrike !== conditions.nuclearStrike) return false;
    }

    if (conditions.recentMilitaryLoss !== undefined) {
      if (context.recentMilitaryLoss !== conditions.recentMilitaryLoss) return false;
    }

    if (conditions.minTurn !== undefined) {
      if (context.turn < conditions.minTurn) return false;
    }

    return true;
  });
}
