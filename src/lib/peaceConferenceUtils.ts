/**
 * Peace Conference Utilities
 *
 * Handles multi-party peace conferences for resolving wars through negotiation.
 * Conferences allow belligerents and mediators to propose and vote on peace terms.
 */

import type { Nation } from '@/types/game';
import type {
  PeaceConference,
  ConferenceParticipant,
  ConferenceAgendaItem,
  PeaceProposal,
  PeaceTerm,
  PeaceTreaty,
  TreatyViolation,
} from '@/types/diplomacyPhase3';
import { generateId } from './idGenerator';

/**
 * Create a new peace conference
 */
export function createPeaceConference(
  convenedBy: string,
  currentTurn: number,
  warIds: string[],
  maxRounds: number = 10
): PeaceConference {
  return {
    id: generateId(),
    name: `Peace Conference ${currentTurn}`,
    convenedBy,
    convenedTurn: currentTurn,
    participants: [],
    warIds,
    agenda: [],
    proposals: [],
    status: 'assembling',
    round: 0,
    maxRounds,
    deadlineTurn: currentTurn + maxRounds,
  };
}

/**
 * Add participant to conference
 */
export function addParticipant(
  conference: PeaceConference,
  nationId: string,
  role: ConferenceParticipant['role'],
  primaryObjectives: string[] = [],
  acceptableOutcomes: string[] = [],
  redLines: string[] = []
): PeaceConference {
  // Check if already participating
  if (conference.participants.some((p) => p.nationId === nationId)) {
    return conference;
  }

  const votingPower = role === 'mediator' ? 1.5 : role === 'guarantor' ? 1.2 : 1.0;

  const participant: ConferenceParticipant = {
    nationId,
    role,
    votingPower,
    primaryObjectives,
    acceptableOutcomes,
    redLines,
    attended: true,
    walkoutRisk: 0,
  };

  return {
    ...conference,
    participants: [...conference.participants, participant],
  };
}

/**
 * Remove participant (walkout)
 */
export function removeParticipant(
  conference: PeaceConference,
  nationId: string
): PeaceConference {
  const updatedParticipants = conference.participants.map((p) =>
    p.nationId === nationId ? { ...p, attended: false } : p
  );

  // Check if critical participants left (belligerents)
  const belligerentsPresent = updatedParticipants.filter(
    (p) => p.role === 'belligerent' && p.attended
  );

  const newStatus = belligerentsPresent.length < 2 ? 'collapsed' : conference.status;

  return {
    ...conference,
    participants: updatedParticipants,
    status: newStatus,
  };
}

/**
 * Add agenda item to conference
 */
export function addAgendaItem(
  conference: PeaceConference,
  topic: string,
  description: string,
  proposedBy: string,
  priority: ConferenceAgendaItem['priority'] = 'important'
): PeaceConference {
  const item: ConferenceAgendaItem = {
    id: generateId(),
    topic,
    description,
    priority,
    proposedBy,
    status: 'pending',
  };

  return {
    ...conference,
    agenda: [...conference.agenda, item],
  };
}

/**
 * Update agenda item status
 */
export function updateAgendaItemStatus(
  conference: PeaceConference,
  itemId: string,
  status: ConferenceAgendaItem['status']
): PeaceConference {
  const updatedAgenda = conference.agenda.map((item) =>
    item.id === itemId ? { ...item, status } : item
  );

  return {
    ...conference,
    agenda: updatedAgenda,
  };
}

/**
 * Create a peace proposal
 */
export function createProposal(
  conference: PeaceConference,
  proposedBy: string,
  terms: PeaceTerm[]
): PeaceConference {
  const proposal: PeaceProposal = {
    id: generateId(),
    proposedBy,
    proposedRound: conference.round,
    terms,
    supporters: [proposedBy], // Proposer automatically supports
    opponents: [],
    abstainers: [],
    status: 'draft',
  };

  return {
    ...conference,
    proposals: [...conference.proposals, proposal],
  };
}

/**
 * Support a proposal
 */
export function supportProposal(
  conference: PeaceConference,
  proposalId: string,
  nationId: string
): PeaceConference {
  const updatedProposals = conference.proposals.map((p) => {
    if (p.id !== proposalId) return p;

    // Remove from opponents/abstainers if present
    const opponents = p.opponents.filter((id) => id !== nationId);
    const abstainers = p.abstainers.filter((id) => id !== nationId);
    const supporters = p.supporters.includes(nationId)
      ? p.supporters
      : [...p.supporters, nationId];

    return { ...p, supporters, opponents, abstainers };
  });

  return {
    ...conference,
    proposals: updatedProposals,
  };
}

/**
 * Oppose a proposal
 */
export function opposeProposal(
  conference: PeaceConference,
  proposalId: string,
  nationId: string
): PeaceConference {
  const updatedProposals = conference.proposals.map((p) => {
    if (p.id !== proposalId) return p;

    // Remove from supporters/abstainers if present
    const supporters = p.supporters.filter((id) => id !== nationId);
    const abstainers = p.abstainers.filter((id) => id !== nationId);
    const opponents = p.opponents.includes(nationId)
      ? p.opponents
      : [...p.opponents, nationId];

    return { ...p, supporters, opponents, abstainers };
  });

  return {
    ...conference,
    proposals: updatedProposals,
  };
}

/**
 * Abstain from a proposal
 */
export function abstainProposal(
  conference: PeaceConference,
  proposalId: string,
  nationId: string
): PeaceConference {
  const updatedProposals = conference.proposals.map((p) => {
    if (p.id !== proposalId) return p;

    // Remove from supporters/opponents if present
    const supporters = p.supporters.filter((id) => id !== nationId);
    const opponents = p.opponents.filter((id) => id !== nationId);
    const abstainers = p.abstainers.includes(nationId)
      ? p.abstainers
      : [...p.abstainers, nationId];

    return { ...p, supporters, opponents, abstainers };
  });

  return {
    ...conference,
    proposals: updatedProposals,
  };
}

/**
 * Vote on a proposal (weighted by participant voting power)
 */
export function voteOnProposal(
  conference: PeaceConference,
  proposalId: string
): { passed: boolean; supportWeight: number; opposeWeight: number } {
  const proposal = conference.proposals.find((p) => p.id === proposalId);
  if (!proposal) {
    return { passed: false, supportWeight: 0, opposeWeight: 0 };
  }

  // Calculate weighted votes
  let supportWeight = 0;
  let opposeWeight = 0;

  for (const participant of conference.participants) {
    if (!participant.attended) continue;

    if (proposal.supporters.includes(participant.nationId)) {
      supportWeight += participant.votingPower;
    } else if (proposal.opponents.includes(participant.nationId)) {
      opposeWeight += participant.votingPower;
    }
  }

  const passed = supportWeight > opposeWeight;

  return { passed, supportWeight, opposeWeight };
}

/**
 * Finalize proposal voting
 */
export function finalizeProposal(
  conference: PeaceConference,
  proposalId: string
): PeaceConference {
  const voteResult = voteOnProposal(conference, proposalId);

  const updatedProposals = conference.proposals.map((p) => {
    if (p.id !== proposalId) return p;

    return {
      ...p,
      status: voteResult.passed ? ('accepted' as const) : ('rejected' as const),
    };
  });

  return {
    ...conference,
    proposals: updatedProposals,
  };
}

/**
 * Amend a proposal (create new version)
 */
export function amendProposal(
  conference: PeaceConference,
  originalProposalId: string,
  proposedBy: string,
  newTerms: PeaceTerm[]
): PeaceConference {
  const newProposal: PeaceProposal = {
    id: generateId(),
    proposedBy,
    proposedRound: conference.round,
    terms: newTerms,
    supporters: [proposedBy],
    opponents: [],
    abstainers: [],
    status: 'draft',
    amendedFrom: originalProposalId,
  };

  const updatedProposals = conference.proposals.map((p) =>
    p.id === originalProposalId
      ? { ...p, status: 'amended' as const, amendedTo: newProposal.id }
      : p
  );

  return {
    ...conference,
    proposals: [...updatedProposals, newProposal],
  };
}

/**
 * Advance conference to next round
 */
export function advanceRound(conference: PeaceConference): PeaceConference {
  const newRound = conference.round + 1;

  // Check if conference should conclude
  if (newRound >= conference.maxRounds) {
    return {
      ...conference,
      status: 'concluded',
      round: newRound,
    };
  }

  return {
    ...conference,
    round: newRound,
    status: 'negotiating',
  };
}

/**
 * Create a peace treaty from accepted proposal
 */
export function createTreatyFromProposal(
  conference: PeaceConference,
  proposalId: string,
  currentTurn: number,
  duration: number = 50
): PeaceTreaty | null {
  const proposal = conference.proposals.find((p) => p.id === proposalId);
  if (!proposal || proposal.status !== 'accepted') {
    return null;
  }

  const signatories = proposal.supporters;
  const guarantors = conference.participants
    .filter((p) => p.role === 'guarantor')
    .map((p) => p.nationId);

  const treaty: PeaceTreaty = {
    id: generateId(),
    conferenceId: conference.id,
    name: `${conference.name} Peace Treaty`,
    signedTurn: currentTurn,
    signatories,
    guarantors,
    terms: proposal.terms,
    duration,
    expiryTurn: currentTurn + duration,
    compliance: {},
    violations: [],
    status: 'active',
  };

  // Initialize compliance for all signatories
  for (const signatory of signatories) {
    treaty.compliance[signatory] = 100;
  }

  return treaty;
}

/**
 * Conclude conference with treaty
 */
export function concludeConference(
  conference: PeaceConference,
  treaty: PeaceTreaty
): PeaceConference {
  return {
    ...conference,
    status: 'concluded',
    finalAgreement: treaty,
  };
}

/**
 * Update walkout risk for a participant
 */
export function updateWalkoutRisk(
  conference: PeaceConference,
  nationId: string,
  delta: number
): PeaceConference {
  const updatedParticipants = conference.participants.map((p) => {
    if (p.nationId !== nationId) return p;

    return {
      ...p,
      walkoutRisk: Math.max(0, Math.min(100, p.walkoutRisk + delta)),
    };
  });

  return {
    ...conference,
    participants: updatedParticipants,
  };
}

/**
 * Check if participant's red lines are crossed by proposal
 */
export function checkRedLines(
  participant: ConferenceParticipant,
  proposal: PeaceProposal
): boolean {
  // This would need more sophisticated logic based on actual terms
  // For now, simplified version
  for (const term of proposal.terms) {
    for (const redLine of participant.redLines) {
      if (
        term.description.toLowerCase().includes(redLine.toLowerCase()) ||
        redLine === 'any-territory-loss' && term.type === 'territory-exchange'
      ) {
        return true; // Red line crossed
      }
    }
  }

  return false;
}

/**
 * Update treaty compliance
 */
export function updateTreatyCompliance(
  treaty: PeaceTreaty,
  nationId: string,
  complianceLevel: number
): PeaceTreaty {
  return {
    ...treaty,
    compliance: {
      ...treaty.compliance,
      [nationId]: Math.max(0, Math.min(100, complianceLevel)),
    },
  };
}

/**
 * Record treaty violation
 */
export function recordViolation(
  treaty: PeaceTreaty,
  violatorId: string,
  termIndex: number,
  description: string,
  severity: TreatyViolation['severity'],
  currentTurn: number
): PeaceTreaty {
  const violation: TreatyViolation = {
    violatorId,
    termViolated: termIndex,
    violationTurn: currentTurn,
    description,
    severity,
  };

  let newStatus = treaty.status;
  if (severity === 'complete-breach') {
    newStatus = 'violated';
  }

  return {
    ...treaty,
    violations: [...treaty.violations, violation],
    status: newStatus,
  };
}

/**
 * Check if treaty is still valid
 */
export function isTreatyValid(treaty: PeaceTreaty, currentTurn: number): boolean {
  if (treaty.status === 'violated' || treaty.status === 'nullified') {
    return false;
  }

  if (treaty.status === 'expired') {
    return false;
  }

  if (currentTurn >= treaty.expiryTurn) {
    return false;
  }

  return true;
}

/**
 * Update treaty status based on expiry or compliance
 */
export function updateTreatyStatus(
  treaty: PeaceTreaty,
  currentTurn: number
): PeaceTreaty {
  // Check if expired
  if (currentTurn >= treaty.expiryTurn && treaty.status === 'active') {
    return {
      ...treaty,
      status: 'expired',
    };
  }

  // Check if all terms fulfilled
  const allCompliant = Object.values(treaty.compliance).every((c) => c >= 90);
  if (allCompliant && treaty.status === 'active' && currentTurn >= treaty.expiryTurn - 5) {
    return {
      ...treaty,
      status: 'fulfilled',
    };
  }

  return treaty;
}

/**
 * Nullify treaty (cancel it)
 */
export function nullifyTreaty(treaty: PeaceTreaty, reason: string): PeaceTreaty {
  return {
    ...treaty,
    status: 'nullified',
  };
}

/**
 * Get conference progress percentage
 */
export function getConferenceProgress(conference: PeaceConference): number {
  return (conference.round / conference.maxRounds) * 100;
}

/**
 * Get number of proposals accepted
 */
export function getAcceptedProposalsCount(conference: PeaceConference): number {
  return conference.proposals.filter((p) => p.status === 'accepted').length;
}

/**
 * Check if conference is likely to succeed
 */
export function calculateSuccessProbability(conference: PeaceConference): number {
  let probability = 50; // Base 50%

  // More participants = harder to reach agreement
  const participantCount = conference.participants.filter((p) => p.attended).length;
  probability -= participantCount * 5;

  // High walkout risk reduces success chance
  const avgWalkoutRisk =
    conference.participants.reduce((sum, p) => sum + p.walkoutRisk, 0) /
    conference.participants.length;
  probability -= avgWalkoutRisk / 2;

  // Having mediators helps
  const mediatorCount = conference.participants.filter(
    (p) => p.role === 'mediator'
  ).length;
  probability += mediatorCount * 10;

  // Accepted proposals increase success
  const acceptedCount = getAcceptedProposalsCount(conference);
  probability += acceptedCount * 15;

  return Math.max(0, Math.min(100, probability));
}

/**
 * Get conference status description
 */
export function getConferenceStatusDescription(status: PeaceConference['status']): string {
  switch (status) {
    case 'assembling':
      return 'Assembling participants';
    case 'negotiating':
      return 'Active negotiations';
    case 'voting':
      return 'Voting on proposals';
    case 'concluded':
      return 'Conference concluded';
    case 'collapsed':
      return 'Conference collapsed';
  }
}

/**
 * Get conference status color for UI
 */
export function getConferenceStatusColor(status: PeaceConference['status']): string {
  switch (status) {
    case 'assembling':
      return 'text-blue-400';
    case 'negotiating':
      return 'text-yellow-400';
    case 'voting':
      return 'text-orange-400';
    case 'concluded':
      return 'text-green-500';
    case 'collapsed':
      return 'text-red-500';
  }
}
