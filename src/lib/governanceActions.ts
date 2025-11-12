/**
 * Governance Actions
 * Player actions that influence public opinion, morale, and elections
 */

import type { GovernanceDelta } from './events/politicalEvents';

export interface GovernanceActionCost {
  production?: number;
  intel?: number;
  uranium?: number;
  actionPoints?: number;
}

export interface GovernanceActionOutcome {
  success: boolean;
  description: string;
  effects: GovernanceDelta;
}

export interface GovernanceAction {
  id: string;
  name: string;
  description: string;
  cost: GovernanceActionCost;
  cooldownTurns: number;
  requirements?: {
    minTurnsBeforeElection?: number;
    maxTurnsBeforeElection?: number;
    minPublicOpinion?: number;
    maxPublicOpinion?: number;
  };
}

/**
 * Available governance actions
 */
export const governanceActions: GovernanceAction[] = [
  {
    id: 'campaign_rally',
    name: 'Campaign Rally',
    description: 'Hold a major public rally to boost support. High visibility but risks scandal.',
    cost: {
      production: 5,
      actionPoints: 1,
    },
    cooldownTurns: 3,
    requirements: {
      maxTurnsBeforeElection: 5, // Can only do this close to election
    },
  },
  {
    id: 'war_address',
    name: 'Emergency War Powers Address',
    description: 'Address the nation about security threats. Effective during conflict.',
    cost: {
      actionPoints: 1,
    },
    cooldownTurns: 4,
  },
  {
    id: 'diplomatic_victory_publicity',
    name: 'Publicize Diplomatic Victory',
    description: 'Launch PR campaign highlighting recent diplomatic achievements.',
    cost: {
      intel: 3,
      actionPoints: 1,
    },
    cooldownTurns: 5,
  },
  {
    id: 'infrastructure_announcement',
    name: 'Major Infrastructure Announcement',
    description: 'Announce large infrastructure project to boost economic confidence.',
    cost: {
      production: 10,
      actionPoints: 1,
    },
    cooldownTurns: 6,
  },
];

/**
 * Check if a governance action can be performed
 */
export function canPerformGovernanceAction(
  action: GovernanceAction,
  nation: {
    production: number;
    intel: number;
    uranium: number;
    electionTimer: number;
    publicOpinion: number;
  },
  actionCooldowns: Record<string, number>,
  currentTurn: number,
  actionsRemaining: number
): { canPerform: boolean; reason?: string } {
  // Check action points
  if (actionsRemaining < (action.cost.actionPoints ?? 0)) {
    return { canPerform: false, reason: 'Not enough actions remaining' };
  }

  // Check cooldown
  const lastUsedTurn = actionCooldowns[action.id];
  if (lastUsedTurn !== undefined && currentTurn - lastUsedTurn < action.cooldownTurns) {
    const turnsRemaining = action.cooldownTurns - (currentTurn - lastUsedTurn);
    return { canPerform: false, reason: `On cooldown (${turnsRemaining} turns)` };
  }

  // Check resource costs
  if (action.cost.production && nation.production < action.cost.production) {
    return { canPerform: false, reason: 'Insufficient production' };
  }
  if (action.cost.intel && nation.intel < action.cost.intel) {
    return { canPerform: false, reason: 'Insufficient intel' };
  }
  if (action.cost.uranium && nation.uranium < action.cost.uranium) {
    return { canPerform: false, reason: 'Insufficient uranium' };
  }

  // Check requirements
  if (action.requirements) {
    const req = action.requirements;

    if (req.minTurnsBeforeElection !== undefined && nation.electionTimer < req.minTurnsBeforeElection) {
      return { canPerform: false, reason: 'Too close to election' };
    }

    if (req.maxTurnsBeforeElection !== undefined && nation.electionTimer > req.maxTurnsBeforeElection) {
      return { canPerform: false, reason: 'Too far from election' };
    }

    if (req.minPublicOpinion !== undefined && nation.publicOpinion < req.minPublicOpinion) {
      return { canPerform: false, reason: 'Public opinion too low' };
    }

    if (req.maxPublicOpinion !== undefined && nation.publicOpinion > req.maxPublicOpinion) {
      return { canPerform: false, reason: 'Public opinion too high' };
    }
  }

  return { canPerform: true };
}

/**
 * Execute a governance action and return the outcome
 */
export function executeGovernanceAction(
  actionId: string,
  nation: {
    morale: number;
    publicOpinion: number;
    cabinetApproval: number;
    electionTimer: number;
  },
  treaties?: Record<string, any>,
  rng: { next: () => number } = { next: Math.random }
): GovernanceActionOutcome {
  switch (actionId) {
    case 'campaign_rally':
      return executeCampaignRally(nation, rng);

    case 'war_address':
      return executeWarAddress(nation, treaties, rng);

    case 'diplomatic_victory_publicity':
      return executeDiplomaticVictoryPublicity(nation, rng);

    case 'infrastructure_announcement':
      return executeInfrastructureAnnouncement(nation, rng);

    default:
      return {
        success: false,
        description: 'Unknown action',
        effects: {},
      };
  }
}

/**
 * Campaign Rally action
 */
function executeCampaignRally(
  nation: { publicOpinion: number; cabinetApproval: number },
  rng: { next: () => number }
): GovernanceActionOutcome {
  const roll = rng.next();

  // 75% success rate
  if (roll < 0.75) {
    return {
      success: true,
      description: 'Rally energizes base! Crowds respond enthusiastically to your message.',
      effects: {
        publicOpinion: 8,
        cabinetApproval: 5,
        morale: 6,
      },
    };
  } else {
    return {
      success: false,
      description: 'Rally marred by scandal! Opposition uncovers embarrassing revelations.',
      effects: {
        publicOpinion: -15,
        cabinetApproval: -10,
        instability: 8,
      },
    };
  }
}

/**
 * Emergency War Powers Address
 */
function executeWarAddress(
  nation: { publicOpinion: number; cabinetApproval: number },
  treaties: Record<string, any> | undefined,
  rng: { next: () => number }
): GovernanceActionOutcome {
  // Check if at war
  const isAtWar = treaties
    ? Object.values(treaties).some((treaty: any) => !treaty.alliance && treaty.truceTurns === undefined)
    : false;

  if (isAtWar) {
    return {
      success: true,
      description: 'War address rallies the nation! Citizens unite behind leadership.',
      effects: {
        publicOpinion: 10,
        cabinetApproval: 8,
        morale: 5,
      },
    };
  } else {
    return {
      success: false,
      description: 'Address backfires in peacetime! Accused of fearmongering.',
      effects: {
        publicOpinion: -8,
        cabinetApproval: -5,
      },
    };
  }
}

/**
 * Publicize Diplomatic Victory
 */
function executeDiplomaticVictoryPublicity(
  nation: { publicOpinion: number; cabinetApproval: number },
  rng: { next: () => number }
): GovernanceActionOutcome {
  const roll = rng.next();

  // 80% success rate
  if (roll < 0.8) {
    return {
      success: true,
      description: 'Diplomatic triumph celebrated! Media praises your statecraft.',
      effects: {
        publicOpinion: 12,
        cabinetApproval: 8,
        morale: 4,
      },
    };
  } else {
    return {
      success: false,
      description: 'PR campaign falls flat. Public unmoved by diplomatic minutiae.',
      effects: {
        publicOpinion: -3,
      },
    };
  }
}

/**
 * Infrastructure Announcement
 */
function executeInfrastructureAnnouncement(
  nation: { publicOpinion: number; morale: number },
  rng: { next: () => number }
): GovernanceActionOutcome {
  return {
    success: true,
    description: 'Infrastructure plan unveiled! Economic optimism surges.',
    effects: {
      publicOpinion: 10,
      morale: 8,
      cabinetApproval: 6,
      production: 5, // Future production bonus
    },
  };
}

/**
 * Get governance action by ID
 */
export function getGovernanceActionById(actionId: string): GovernanceAction | undefined {
  return governanceActions.find((a) => a.id === actionId);
}
