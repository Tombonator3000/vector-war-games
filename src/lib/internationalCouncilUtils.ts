/**
 * International Council Utilities
 *
 * Handles the International Council system including:
 * - Council membership and elections
 * - Resolutions and voting
 * - Sanctions, embargos, and other council actions
 */

import type { Nation, GameState } from '@/types/game';
import type {
  InternationalCouncil,
  CouncilResolution,
  CouncilVote,
  ElectedMember,
  ResolutionType,
  ResolutionParameters,
  VotingResults,
  CouncilMembershipType,
} from '@/types/diplomacyPhase3';
import { generateId } from './idGenerator';

/**
 * Initialize the International Council
 */
export function initializeInternationalCouncil(
  currentTurn: number,
  permanentMembers: string[] = []
): InternationalCouncil {
  return {
    foundedTurn: currentTurn,
    permanentMembers,
    electedMembers: [],
    observers: [],
    activeResolutions: [],
    passedResolutions: [],
    failedResolutions: [],
    activeVotes: [],
    nextMeetingTurn: currentTurn + 5,
    meetingFrequency: 5, // Meeting every 5 turns
    legitimacy: 50, // Start at neutral legitimacy
  };
}

/**
 * Add permanent member to council
 */
export function addPermanentMember(
  council: InternationalCouncil,
  nationId: string
): InternationalCouncil {
  if (council.permanentMembers.includes(nationId)) {
    return council;
  }

  return {
    ...council,
    permanentMembers: [...council.permanentMembers, nationId],
  };
}

/**
 * Elect a member to the council
 */
export function electCouncilMember(
  council: InternationalCouncil,
  nationId: string,
  currentTurn: number,
  termLength: number = 20
): InternationalCouncil {
  // Check if already permanent or elected member
  if (
    council.permanentMembers.includes(nationId) ||
    council.electedMembers.some((m) => m.nationId === nationId)
  ) {
    return council;
  }

  const newMember: ElectedMember = {
    nationId,
    electedTurn: currentTurn,
    termLength,
    expiryTurn: currentTurn + termLength,
  };

  return {
    ...council,
    electedMembers: [...council.electedMembers, newMember],
  };
}

/**
 * Remove expired council members
 */
export function removeExpiredMembers(
  council: InternationalCouncil,
  currentTurn: number
): InternationalCouncil {
  const activeMembers = council.electedMembers.filter(
    (member) => member.expiryTurn > currentTurn
  );

  return {
    ...council,
    electedMembers: activeMembers,
  };
}

/**
 * Add observer to council
 */
export function addObserver(
  council: InternationalCouncil,
  nationId: string
): InternationalCouncil {
  if (council.observers.includes(nationId)) {
    return council;
  }

  return {
    ...council,
    observers: [...council.observers, nationId],
  };
}

/**
 * Get nation's council membership type
 */
export function getCouncilMembership(
  council: InternationalCouncil | null,
  nationId: string
): CouncilMembershipType {
  if (!council) return 'none';

  if (council.permanentMembers.includes(nationId)) {
    return 'permanent';
  }

  if (council.electedMembers.some((m) => m.nationId === nationId)) {
    return 'elected';
  }

  if (council.observers.includes(nationId)) {
    return 'observer';
  }

  return 'none';
}

/**
 * Check if nation can vote on resolutions
 */
export function canVote(council: InternationalCouncil, nationId: string): boolean {
  return (
    council.permanentMembers.includes(nationId) ||
    council.electedMembers.some((m) => m.nationId === nationId) ||
    council.observers.includes(nationId)
  );
}

/**
 * Check if nation has veto power
 */
export function hasVetoPower(council: InternationalCouncil, nationId: string): boolean {
  return council.permanentMembers.includes(nationId);
}

/**
 * Create a new resolution
 */
export function createResolution(
  council: InternationalCouncil,
  type: ResolutionType,
  title: string,
  description: string,
  proposedBy: string,
  currentTurn: number,
  parameters: ResolutionParameters,
  targetNationId?: string,
  targetRegion?: string
): { council: InternationalCouncil; resolution: CouncilResolution } {
  const resolution: CouncilResolution = {
    id: generateId(),
    type,
    title,
    description,
    proposedBy,
    proposedTurn: currentTurn,
    targetNationId,
    targetRegion,
    parameters,
    status: 'proposed',
    effectiveness: 50, // Base effectiveness
    compliance: {},
  };

  return {
    council: {
      ...council,
      activeResolutions: [...council.activeResolutions, resolution],
    },
    resolution,
  };
}

/**
 * Start voting on a resolution
 */
export function startVoting(
  council: InternationalCouncil,
  resolutionId: string,
  currentTurn: number,
  votingDuration: number = 3
): InternationalCouncil {
  const resolution = council.activeResolutions.find((r) => r.id === resolutionId);
  if (!resolution || resolution.status !== 'proposed') {
    return council;
  }

  // Get all voters (permanent + elected + observers)
  const allVoters = [
    ...council.permanentMembers,
    ...council.electedMembers.map((m) => m.nationId),
    ...council.observers,
  ];

  const vote: CouncilVote = {
    resolutionId,
    startTurn: currentTurn,
    endTurn: currentTurn + votingDuration,
    currentVotes: {
      votesFor: [],
      votesAgainst: [],
      abstentions: [],
      vetoes: [],
      passed: false,
      finalizedTurn: 0,
    },
    notYetVoted: allVoters,
  };

  const updatedResolutions = council.activeResolutions.map((r) =>
    r.id === resolutionId ? { ...r, status: 'voting' as const } : r
  );

  return {
    ...council,
    activeResolutions: updatedResolutions,
    activeVotes: [...council.activeVotes, vote],
  };
}

/**
 * Cast a vote on a resolution
 */
export function castVote(
  council: InternationalCouncil,
  resolutionId: string,
  nationId: string,
  vote: 'for' | 'against' | 'abstain' | 'veto'
): InternationalCouncil {
  const activeVote = council.activeVotes.find((v) => v.resolutionId === resolutionId);
  if (!activeVote || !activeVote.notYetVoted.includes(nationId)) {
    return council;
  }

  // Check if veto is valid (only permanent members can veto)
  if (vote === 'veto' && !hasVetoPower(council, nationId)) {
    return council;
  }

  const updatedVotes = council.activeVotes.map((v) => {
    if (v.resolutionId !== resolutionId) return v;

    const newCurrentVotes = { ...v.currentVotes };

    switch (vote) {
      case 'for':
        newCurrentVotes.votesFor = [...newCurrentVotes.votesFor, nationId];
        break;
      case 'against':
        newCurrentVotes.votesAgainst = [...newCurrentVotes.votesAgainst, nationId];
        break;
      case 'abstain':
        newCurrentVotes.abstentions = [...newCurrentVotes.abstentions, nationId];
        break;
      case 'veto':
        newCurrentVotes.vetoes = [...newCurrentVotes.vetoes, nationId];
        break;
    }

    return {
      ...v,
      currentVotes: newCurrentVotes,
      notYetVoted: v.notYetVoted.filter((id) => id !== nationId),
    };
  });

  return {
    ...council,
    activeVotes: updatedVotes,
  };
}

/**
 * Finalize voting on a resolution
 */
export function finalizeVoting(
  council: InternationalCouncil,
  resolutionId: string,
  currentTurn: number
): InternationalCouncil {
  const vote = council.activeVotes.find((v) => v.resolutionId === resolutionId);
  const resolution = council.activeResolutions.find((r) => r.id === resolutionId);

  if (!vote || !resolution) {
    return council;
  }

  // Check if vetoed
  const vetoed = vote.currentVotes.vetoes.length > 0;

  // Calculate if passed (simple majority of votes for vs against, excluding abstentions)
  const votesFor = vote.currentVotes.votesFor.length;
  const votesAgainst = vote.currentVotes.votesAgainst.length;
  const passed = !vetoed && votesFor > votesAgainst;

  const finalizedResults: VotingResults = {
    ...vote.currentVotes,
    passed,
    finalizedTurn: currentTurn,
  };

  const updatedResolution: CouncilResolution = {
    ...resolution,
    votingResults: finalizedResults,
    status: vetoed ? 'vetoed' : passed ? 'passed' : 'failed',
    expiryTurn:
      passed && resolution.parameters.duration
        ? currentTurn + resolution.parameters.duration
        : undefined,
  };

  // Move resolution to appropriate history
  const activeResolutions = council.activeResolutions.filter(
    (r) => r.id !== resolutionId
  );

  const passedResolutions = passed
    ? [...council.passedResolutions, updatedResolution]
    : council.passedResolutions;

  const failedResolutions =
    !passed
      ? [...council.failedResolutions, updatedResolution]
      : council.failedResolutions;

  // Remove vote
  const activeVotes = council.activeVotes.filter((v) => v.resolutionId !== resolutionId);

  // Update legitimacy based on voting participation
  const totalVoters =
    votesFor + votesAgainst + vote.currentVotes.abstentions.length;
  const eligibleVoters =
    council.permanentMembers.length +
    council.electedMembers.length +
    council.observers.length;
  const participationRate = eligibleVoters > 0 ? totalVoters / eligibleVoters : 0;

  const legitimacyChange = participationRate > 0.7 ? 1 : -1;

  return {
    ...council,
    activeResolutions: passed ? [...activeResolutions, updatedResolution] : activeResolutions,
    passedResolutions,
    failedResolutions,
    activeVotes,
    legitimacy: Math.max(0, Math.min(100, council.legitimacy + legitimacyChange)),
  };
}

/**
 * Check and finalize expired votes
 */
export function processExpiredVotes(
  council: InternationalCouncil,
  currentTurn: number
): InternationalCouncil {
  let updatedCouncil = council;

  const expiredVotes = council.activeVotes.filter((v) => v.endTurn <= currentTurn);

  for (const vote of expiredVotes) {
    updatedCouncil = finalizeVoting(updatedCouncil, vote.resolutionId, currentTurn);
  }

  return updatedCouncil;
}

/**
 * Update resolution compliance
 */
export function updateCompliance(
  council: InternationalCouncil,
  resolutionId: string,
  nationId: string,
  complianceLevel: number
): InternationalCouncil {
  const updatedResolutions = council.activeResolutions.map((r) => {
    if (r.id !== resolutionId) return r;

    return {
      ...r,
      compliance: {
        ...r.compliance,
        [nationId]: Math.max(0, Math.min(100, complianceLevel)),
      },
    };
  });

  return {
    ...council,
    activeResolutions: updatedResolutions,
  };
}

/**
 * Get active resolutions affecting a nation
 */
export function getActiveResolutionsForNation(
  council: InternationalCouncil,
  nationId: string
): CouncilResolution[] {
  return council.activeResolutions.filter(
    (r) =>
      r.status === 'passed' &&
      (r.targetNationId === nationId ||
        (!r.targetNationId && r.type === 'nuclear-ban') ||
        (!r.targetNationId && r.type === 'environmental'))
  );
}

/**
 * Check if nation is sanctioned by council
 */
export function isNationSanctioned(
  council: InternationalCouncil,
  nationId: string
): boolean {
  return council.activeResolutions.some(
    (r) =>
      r.status === 'passed' &&
      (r.type === 'sanction' || r.type === 'embargo') &&
      r.targetNationId === nationId
  );
}

/**
 * Get voting power of a nation
 */
export function getVotingPower(council: InternationalCouncil, nationId: string): number {
  if (council.permanentMembers.includes(nationId)) {
    return 2.0; // Permanent members have 2x voting weight
  }

  if (council.electedMembers.some((m) => m.nationId === nationId)) {
    return 1.5; // Elected members have 1.5x voting weight
  }

  if (council.observers.includes(nationId)) {
    return 1.0; // Observers have normal weight
  }

  return 0; // Non-members can't vote
}

/**
 * Calculate resolution effectiveness based on compliance
 */
export function calculateResolutionEffectiveness(
  resolution: CouncilResolution,
  allNations: Nation[]
): number {
  const complianceValues = Object.values(resolution.compliance);

  if (complianceValues.length === 0) {
    return resolution.effectiveness;
  }

  const averageCompliance =
    complianceValues.reduce((sum, c) => sum + c, 0) / complianceValues.length;

  // Effectiveness is based on average compliance
  return Math.round(resolution.effectiveness * (averageCompliance / 100));
}

/**
 * Schedule next council meeting
 */
export function scheduleNextMeeting(
  council: InternationalCouncil,
  currentTurn: number
): InternationalCouncil {
  return {
    ...council,
    nextMeetingTurn: currentTurn + council.meetingFrequency,
  };
}

/**
 * Modify council legitimacy
 */
export function modifyLegitimacy(
  council: InternationalCouncil,
  delta: number,
  reason: string
): InternationalCouncil {
  return {
    ...council,
    legitimacy: Math.max(0, Math.min(100, council.legitimacy + delta)),
  };
}

/**
 * Get council legitimacy category
 */
export function getLegitimacyCategory(legitimacy: number): string {
  if (legitimacy >= 80) return 'Highly Legitimate';
  if (legitimacy >= 60) return 'Legitimate';
  if (legitimacy >= 40) return 'Moderately Legitimate';
  if (legitimacy >= 20) return 'Weak Legitimacy';
  return 'No Legitimacy';
}

/**
 * Get council legitimacy color for UI
 */
export function getLegitimacyColor(legitimacy: number): string {
  if (legitimacy >= 80) return 'text-green-500';
  if (legitimacy >= 60) return 'text-green-400';
  if (legitimacy >= 40) return 'text-yellow-400';
  if (legitimacy >= 20) return 'text-orange-400';
  return 'text-red-500';
}
