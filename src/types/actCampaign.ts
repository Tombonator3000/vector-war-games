/**
 * Act-based Campaign System Types
 * Structures the Great Old Ones campaign into three escalating acts
 */

import type { Doctrine } from './greatOldOnes';

// ============================================================================
// ACT STRUCTURE
// ============================================================================

export type ActNumber = 1 | 2 | 3;

export interface ActDefinition {
  actNumber: ActNumber;
  name: string;
  description: string;

  /** Requirements to unlock this act */
  unlockConditions: ActUnlockConditions;

  /** Authored story missions for this act */
  storyMissions: StoryMission[];

  /** Number of procedural missions to generate */
  proceduralMissionCount: number;

  /** Key story beats that occur during this act */
  storyBeats: StoryBeat[];

  /** Branching finale missions (one per doctrine) */
  finaleOptions?: Record<Doctrine, StoryMission>;
}

// ============================================================================
// UNLOCK CONDITIONS
// ============================================================================

export interface ActUnlockConditions {
  /** Must complete previous act */
  previousActComplete: boolean;

  /** Minimum corruption index (0-100) */
  minCorruption?: number;

  /** Minimum number of regions with corruption > threshold */
  minCorruptedRegions?: {
    count: number;
    corruptionThreshold: number;
  };

  /** Eldritch power accumulated for X consecutive turns */
  eldritchPowerStreak?: {
    minPower: number;
    consecutiveTurns: number;
  };

  /** Council vote required */
  requiresCouncilVote?: boolean;

  /** Dynamic campaign events (investigator alliance, rival cult, etc.) */
  requiresDynamicEvent?: DynamicEventType[];

  /** Order crisis that must be resolved */
  requiresCrisisResolution?: boolean;
}

export type DynamicEventType =
  | 'investigator_alliance'
  | 'rival_cult_emergence'
  | 'public_manifestation'
  | 'government_crackdown'
  | 'internal_schism';

// ============================================================================
// STORY MISSIONS
// ============================================================================

export interface StoryMission {
  id: string;
  name: string;
  description: string;
  category: 'establishment' | 'escalation' | 'flashpoint' | 'finale';

  /** Which act this belongs to */
  actNumber: ActNumber;

  /** Objectives to complete */
  objectives: MissionObjective[];

  /** Narrative text/dialogue */
  narrative: {
    intro: string;
    success: string;
    failure: string;
  };

  /** Rewards for completion */
  rewards: MissionRewards;

  /** Does this mission branch based on player choice? */
  branches?: MissionBranch[];

  /** Prerequisites before this mission appears */
  prerequisites?: {
    missionsCompleted?: string[];
    minCorruption?: number;
    minSanityFragments?: number;
    doctrineRequired?: Doctrine;
  };
}

export interface MissionObjective {
  id: string;
  description: string;
  type: 'harvest' | 'ritual' | 'infiltration' | 'summoning' | 'corruption' | 'choice';

  /** Target values */
  target?: {
    sanityFragments?: number;
    eldritchPower?: number;
    corruptionIncrease?: number;
    regionId?: string;
    entityTier?: string;
  };

  /** Is this objective complete? */
  completed: boolean;
}

export interface MissionRewards {
  sanityFragments?: number;
  eldritchPower?: number;
  corruptionBonus?: number;
  councilUnityChange?: number;
  veilChange?: number;

  /** Unlock new mechanics */
  unlockedMechanics?: string[];

  /** Unique cultist or entity */
  uniqueReward?: {
    type: 'cultist' | 'entity' | 'artifact';
    name: string;
    description: string;
  };
}

export interface MissionBranch {
  id: string;
  choiceText: string;
  description: string;

  /** Consequences of this choice */
  consequences: {
    corruptionChange?: number;
    veilChange?: number;
    councilUnityChange?: number;
    doctrineAffinity?: Doctrine;
    narrativeFlag?: string; // Tracked for future reference
  };

  /** Next mission unlocked by this choice */
  nextMissionId?: string;
}

// ============================================================================
// STORY BEATS
// ============================================================================

export interface StoryBeat {
  id: string;
  name: string;
  description: string;

  /** When does this beat trigger? */
  trigger: StoryBeatTrigger;

  /** Narrative content */
  narrative: {
    title: string;
    body: string;
    choices?: StoryBeatChoice[];
  };

  /** Mechanical effects */
  effects?: {
    corruptionChange?: number;
    veilChange?: number;
    councilUnityChange?: number;
    spawnInvestigators?: number;
    spawnRivalCult?: boolean;
  };

  /** Has this beat been triggered? */
  triggered: boolean;
}

export interface StoryBeatTrigger {
  type: 'mission_complete' | 'turn_threshold' | 'resource_threshold' | 'event';

  /** Specific conditions */
  conditions: {
    missionId?: string;
    turn?: number;
    corruption?: number;
    veilIntegrity?: number;
    entityAwakened?: boolean;
  };
}

export interface StoryBeatChoice {
  id: string;
  text: string;

  /** Effects of this choice */
  effects: {
    corruptionChange?: number;
    councilUnityChange?: number;
    veilChange?: number;
    doctrineAffinity?: Doctrine;
  };
}

// ============================================================================
// COUNCIL VOTING
// ============================================================================

export interface ActProgressionVote {
  actNumber: ActNumber;

  /** Vote state */
  status: 'pending' | 'passed' | 'failed';

  /** Council member votes */
  votes: {
    priestId: string;
    vote: 'for' | 'against' | 'abstain';
    reason?: string;
  }[];

  /** Vote requirements */
  requirements: {
    unanimousRequired: boolean;
    majorityRequired?: number; // e.g., 2/3 = 0.67
    minCouncilUnity?: number;
  };

  /** Can use emergency override? */
  emergencyOverrideAvailable: boolean;

  /** Cost to use emergency override */
  overrideCost?: {
    eldritchPower: number;
    councilUnityLoss: number;
  };
}

// ============================================================================
// CAMPAIGN STATE TRACKING
// ============================================================================

export interface ActCampaignState {
  /** Current act */
  currentAct: ActNumber;

  /** Completed story missions by ID */
  completedStoryMissions: string[];

  /** Completed procedural missions count per act */
  proceduralMissionsCompleted: Record<ActNumber, number>;

  /** Active story mission (only one at a time) */
  activeStoryMission: StoryMission | null;

  /** Act unlock status */
  actStatus: {
    [key in ActNumber]: {
      unlocked: boolean;
      conditionsMet: boolean;
      voteStatus: 'not_required' | 'pending' | 'passed' | 'failed';
    };
  };

  /** Triggered story beats */
  triggeredStoryBeats: string[];

  /** Narrative flags for branching */
  narrativeFlags: string[];

  /** Council votes */
  pendingVotes: ActProgressionVote[];

  /** Eldritch power streak tracking for unlock */
  eldritchPowerStreak: {
    currentStreak: number;
    lastTurnPower: number;
  };

  /** Dynamic events triggered */
  triggeredEvents: DynamicEventType[];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if all conditions for act unlock are met
 */
export function checkActUnlockConditions(
  conditions: ActUnlockConditions,
  state: any // Would be GreatOldOnesState + ActCampaignState
): boolean {
  // Implementation will check each condition
  return false; // Placeholder
}

/**
 * Calculate council vote outcome
 */
export function calculateVoteOutcome(vote: ActProgressionVote): 'passed' | 'failed' {
  const totalVotes = vote.votes.length;
  const votesFor = vote.votes.filter(v => v.vote === 'for').length;

  if (vote.requirements.unanimousRequired && votesFor === totalVotes) {
    return 'passed';
  }

  if (vote.requirements.majorityRequired) {
    const majority = votesFor / totalVotes;
    return majority >= vote.requirements.majorityRequired ? 'passed' : 'failed';
  }

  return 'failed';
}
