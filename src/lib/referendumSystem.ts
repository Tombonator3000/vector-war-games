/**
 * Referendum System
 * Allows players to call referendums on important decisions
 */

import type { GovernanceDelta } from './events/politicalEvents';

export type ReferendumType =
  | 'continue_war'             // Should we continue the war?
  | 'nuclear_authorization'    // Authorize nuclear weapons program?
  | 'join_alliance'            // Join an international alliance?
  | 'emergency_powers'         // Grant emergency powers to government?
  | 'peace_treaty'             // Accept peace terms?
  | 'constitutional_reform';   // Reform the constitution?

export interface ReferendumOption {
  id: 'yes' | 'no';
  label: string;
  description: string;
  predictedSupport: number; // Predicted % voting for this option (0-100)
}

export interface ReferendumDefinition {
  id: string;
  type: ReferendumType;
  question: string;
  description: string;
  yesOption: Omit<ReferendumOption, 'id' | 'predictedSupport'>;
  noOption: Omit<ReferendumOption, 'id' | 'predictedSupport'>;
  cost: {
    intel?: number;
    production?: number;
    actionPoints?: number;
  };
  cooldownTurns: number;
  requirements?: {
    minTurn?: number;
    isAtWar?: boolean;
    minPublicOpinion?: number;
    maxPublicOpinion?: number;
    minMorale?: number;
  };
}

export interface ReferendumResult {
  outcome: 'yes' | 'no';
  yesVotes: number; // Percentage (0-100)
  noVotes: number; // Percentage (0-100)
  turnout: number; // Percentage (0-100)
  effects: GovernanceDelta;
  description: string;
}

/**
 * Available referendum types
 */
export const referendumDefinitions: Record<ReferendumType, ReferendumDefinition> = {
  continue_war: {
    id: 'continue_war',
    type: 'continue_war',
    question: 'Should we continue the war?',
    description: 'A national referendum on whether to continue military operations or seek peace.',
    yesOption: {
      label: 'Continue the War',
      description: 'Prosecute the war to total victory. No negotiations with the enemy.',
    },
    noOption: {
      label: 'Seek Peace',
      description: 'Begin peace negotiations immediately. End hostilities.',
    },
    cost: {
      production: 8,
      actionPoints: 1,
    },
    cooldownTurns: 12,
    requirements: {
      isAtWar: true,
      minTurn: 8,
    },
  },

  nuclear_authorization: {
    id: 'nuclear_authorization',
    type: 'nuclear_authorization',
    question: 'Should we authorize a nuclear weapons program?',
    description: 'A public vote on whether to develop nuclear weapons capabilities.',
    yesOption: {
      label: 'Authorize Nuclear Program',
      description: 'Develop nuclear weapons for national security.',
    },
    noOption: {
      label: 'Remain Non-Nuclear',
      description: 'Reject nuclear weapons and remain non-nuclear state.',
    },
    cost: {
      production: 12,
      intel: 5,
      actionPoints: 1,
    },
    cooldownTurns: 20,
    requirements: {
      minTurn: 5,
    },
  },

  join_alliance: {
    id: 'join_alliance',
    type: 'join_alliance',
    question: 'Should we join the international alliance?',
    description: 'A referendum on whether to join a major international alliance.',
    yesOption: {
      label: 'Join Alliance',
      description: 'Join the alliance and commit to mutual defense.',
    },
    noOption: {
      label: 'Stay Independent',
      description: 'Maintain independence and non-alignment.',
    },
    cost: {
      intel: 6,
      production: 5,
      actionPoints: 1,
    },
    cooldownTurns: 15,
    requirements: {
      minTurn: 3,
    },
  },

  emergency_powers: {
    id: 'emergency_powers',
    type: 'emergency_powers',
    question: 'Should the government be granted emergency powers?',
    description: 'A referendum on granting the government extraordinary executive powers.',
    yesOption: {
      label: 'Grant Emergency Powers',
      description: 'Allow government to act decisively in crisis.',
    },
    noOption: {
      label: 'Reject Emergency Powers',
      description: 'Maintain normal constitutional checks and balances.',
    },
    cost: {
      production: 6,
      actionPoints: 1,
    },
    cooldownTurns: 10,
    requirements: {
      maxPublicOpinion: 50, // Can only call when in trouble
    },
  },

  peace_treaty: {
    id: 'peace_treaty',
    type: 'peace_treaty',
    question: 'Should we accept the peace treaty?',
    description: 'A national vote on whether to accept proposed peace terms.',
    yesOption: {
      label: 'Accept Peace Terms',
      description: 'Accept the treaty and end the war.',
    },
    noOption: {
      label: 'Reject Peace Terms',
      description: 'Continue fighting for better terms.',
    },
    cost: {
      production: 5,
      actionPoints: 1,
    },
    cooldownTurns: 8,
    requirements: {
      isAtWar: true,
      minTurn: 6,
    },
  },

  constitutional_reform: {
    id: 'constitutional_reform',
    type: 'constitutional_reform',
    question: 'Should we reform the constitution?',
    description: 'A referendum on major constitutional changes to government structure.',
    yesOption: {
      label: 'Reform Constitution',
      description: 'Modernize government structure and powers.',
    },
    noOption: {
      label: 'Keep Current Constitution',
      description: 'Maintain existing constitutional framework.',
    },
    cost: {
      production: 10,
      intel: 4,
      actionPoints: 1,
    },
    cooldownTurns: 16,
    requirements: {
      minTurn: 10,
    },
  },
};

/**
 * Calculate predicted support for referendum options
 */
export function calculateReferendumSupport(
  referendumType: ReferendumType,
  nation: {
    morale: number;
    publicOpinion: number;
    cabinetApproval: number;
    instability?: number;
  },
  isAtWar: boolean = false
): { yesSupport: number; noSupport: number } {
  let yesSupport = 50; // Base 50-50

  switch (referendumType) {
    case 'continue_war':
      // Support for war correlates with morale and opinion
      yesSupport = 30 + (nation.morale * 0.4) + (nation.publicOpinion * 0.3);
      break;

    case 'nuclear_authorization':
      // Fear and insecurity increase support
      const threatLevel = 100 - (nation.morale + nation.publicOpinion) / 2;
      yesSupport = 35 + (threatLevel * 0.4);
      break;

    case 'join_alliance':
      // Depends on public opinion and perception of threat
      yesSupport = 40 + (nation.publicOpinion * 0.3) + (isAtWar ? 20 : 0);
      break;

    case 'emergency_powers':
      // Crisis situations increase support, but low approval decreases it
      const crisisLevel = (nation.instability || 0) + (100 - nation.morale);
      yesSupport = 25 + (crisisLevel * 0.25) + (nation.cabinetApproval * 0.2);
      break;

    case 'peace_treaty':
      // War exhaustion increases support for peace
      yesSupport = 20 + ((100 - nation.morale) * 0.6) + (nation.publicOpinion * 0.2);
      break;

    case 'constitutional_reform':
      // Reform support depends on dissatisfaction with current system
      const dissatisfaction = (100 - nation.publicOpinion) + (100 - nation.cabinetApproval);
      yesSupport = 30 + (dissatisfaction * 0.2);
      break;
  }

  // Add randomness (±10%)
  const randomness = (Math.random() - 0.5) * 20;
  yesSupport = Math.max(0, Math.min(100, yesSupport + randomness));
  const noSupport = 100 - yesSupport;

  return { yesSupport, noSupport };
}

/**
 * Execute a referendum
 */
export function executeReferendum(
  referendumType: ReferendumType,
  nation: {
    morale: number;
    publicOpinion: number;
    cabinetApproval: number;
    instability?: number;
  },
  isAtWar: boolean = false,
  rng: { next: () => number } = { next: Math.random }
): ReferendumResult {
  const support = calculateReferendumSupport(referendumType, nation, isAtWar);

  // Calculate turnout based on importance and stability
  const baseImportance = isAtWar ? 75 : 60;
  const stabilityFactor = (100 - (nation.instability || 0)) * 0.1;
  const turnout = Math.max(40, Math.min(90, baseImportance + stabilityFactor + (rng.next() - 0.5) * 20));

  // Determine outcome
  const roll = rng.next() * 100;
  const outcome: 'yes' | 'no' = roll < support.yesSupport ? 'yes' : 'no';

  // Apply effects based on outcome
  let effects: GovernanceDelta = {};
  let description = '';

  switch (referendumType) {
    case 'continue_war':
      if (outcome === 'yes') {
        effects = { morale: 10, publicOpinion: 5, cabinetApproval: 8, instability: -5 };
        description = 'The people have spoken! The war continues with renewed mandate.';
      } else {
        effects = { morale: -15, publicOpinion: -10, instability: 20 };
        description = 'Peace vote passes! The war must end, but government legitimacy is questioned.';
      }
      break;

    case 'nuclear_authorization':
      if (outcome === 'yes') {
        effects = { morale: 5, publicOpinion: -8, instability: 8 };
        description = 'Nuclear program authorized. International condemnation expected.';
      } else {
        effects = { morale: -5, publicOpinion: 10, instability: -5 };
        description = 'Nuclear program rejected. Nation commits to non-proliferation.';
      }
      break;

    case 'join_alliance':
      if (outcome === 'yes') {
        effects = { morale: 8, publicOpinion: 12, cabinetApproval: 6 };
        description = 'Alliance referendum passes! Integration process begins.';
      } else {
        effects = { morale: 3, publicOpinion: -5 };
        description = 'Alliance rejected. The nation remains independent.';
      }
      break;

    case 'emergency_powers':
      if (outcome === 'yes') {
        effects = { morale: -5, publicOpinion: -10, cabinetApproval: 15, instability: -15 };
        description = 'Emergency powers granted! Government can act decisively.';
      } else {
        effects = { morale: 5, publicOpinion: 8, cabinetApproval: -12, instability: 5 };
        description = 'Emergency powers rejected. Constitutional order preserved.';
      }
      break;

    case 'peace_treaty':
      if (outcome === 'yes') {
        effects = { morale: 15, publicOpinion: 12, instability: -20 };
        description = 'Peace treaty accepted! The war is over.';
      } else {
        effects = { morale: -8, publicOpinion: -6, instability: 10 };
        description = 'Peace treaty rejected. The war continues.';
      }
      break;

    case 'constitutional_reform':
      if (outcome === 'yes') {
        effects = { morale: 6, publicOpinion: 10, cabinetApproval: 8, instability: 5 };
        description = 'Constitutional reform approved! Government structure will change.';
      } else {
        effects = { morale: -4, publicOpinion: -5, instability: 3 };
        description = 'Reform rejected. Constitution remains unchanged.';
      }
      break;
  }

  return {
    outcome,
    yesVotes: support.yesSupport,
    noVotes: support.noSupport,
    turnout,
    effects,
    description,
  };
}

/**
 * Check if referendum can be called
 */
export function canCallReferendum(
  referendumType: ReferendumType,
  nation: {
    morale: number;
    publicOpinion: number;
    production: number;
    intel: number;
  },
  currentTurn: number,
  isAtWar: boolean,
  referendumCooldowns: Record<string, number>,
  actionsRemaining: number
): { canCall: boolean; reason?: string } {
  const def = referendumDefinitions[referendumType];

  // Check action points
  if (actionsRemaining < (def.cost.actionPoints ?? 0)) {
    return { canCall: false, reason: 'Not enough actions remaining' };
  }

  // Check cooldown
  const lastUsedTurn = referendumCooldowns[referendumType];
  if (lastUsedTurn !== undefined && currentTurn - lastUsedTurn < def.cooldownTurns) {
    const turnsRemaining = def.cooldownTurns - (currentTurn - lastUsedTurn);
    return { canCall: false, reason: `On cooldown (${turnsRemaining} turns)` };
  }

  // Check resource costs
  if (def.cost.production && nation.production < def.cost.production) {
    return { canCall: false, reason: 'Insufficient production' };
  }
  if (def.cost.intel && nation.intel < def.cost.intel) {
    return { canCall: false, reason: 'Insufficient intel' };
  }

  // Check requirements
  if (def.requirements) {
    const req = def.requirements;

    if (req.minTurn !== undefined && currentTurn < req.minTurn) {
      return { canCall: false, reason: `Too early (wait ${req.minTurn - currentTurn} turns)` };
    }

    if (req.isAtWar !== undefined && req.isAtWar !== isAtWar) {
      return { canCall: false, reason: req.isAtWar ? 'Can only call during war' : 'Can only call during peace' };
    }

    if (req.minPublicOpinion !== undefined && nation.publicOpinion < req.minPublicOpinion) {
      return { canCall: false, reason: 'Public opinion too low' };
    }

    if (req.maxPublicOpinion !== undefined && nation.publicOpinion > req.maxPublicOpinion) {
      return { canCall: false, reason: 'Public opinion too high' };
    }

    if (req.minMorale !== undefined && nation.morale < req.minMorale) {
      return { canCall: false, reason: 'Morale too low' };
    }
  }

  return { canCall: true };
}
