/**
 * Enhanced Peace Conference Utilities (HoI4-inspired)
 *
 * Implements war contribution tracking and warscore-based peace demands
 */

import type { Nation } from '@/types/game';
import type {
  EnhancedPeaceConference,
  PeaceConferenceParticipant,
  WarContribution,
  PeaceDemand,
  PeaceDemandType,
  PeaceDemandDetails,
  PeaceTreaty,
  ConferenceStatus,
} from '@/types/heartsOfIronPhase4';
import { generateId } from './idGenerator';

/**
 * Create an enhanced peace conference
 */
export function createEnhancedPeaceConference(
  convenedBy: string,
  currentTurn: number,
  warIds: string[],
  maxRounds: number = 10
): EnhancedPeaceConference {
  return {
    id: generateId(),
    name: `Peace Conference ${currentTurn}`,
    convenedBy,
    convenedTurn: currentTurn,

    warIds,

    participants: [],
    warscorePool: {},

    currentRound: 0,
    maxRounds,

    demands: [],
    demandHistory: [],

    status: 'assembling',
  };
}

/**
 * Add participant with war contribution
 */
export function addConferenceParticipant(
  conference: EnhancedPeaceConference,
  nationId: string,
  side: PeaceConferenceParticipant['side'],
  contribution: WarContribution
): EnhancedPeaceConference {
  // Check if already participating
  if (conference.participants.some(p => p.nationId === nationId)) {
    return conference;
  }

  // Calculate warscore from contribution
  const warscore = calculateWarscoreFromContribution(contribution, side);

  const participant: PeaceConferenceParticipant = {
    nationId,
    side,
    warContribution: contribution,
    totalWarscore: warscore,
    remainingWarscore: warscore,
    primaryObjectives: [],
    redLines: [],
    votingPower: side === 'mediator' ? 1.5 : side === 'guarantor' ? 1.2 : 1.0,
    walkoutRisk: 0,
    attended: true,
  };

  return {
    ...conference,
    participants: [...conference.participants, participant],
    warscorePool: {
      ...conference.warscorePool,
      [nationId]: warscore,
    },
  };
}

/**
 * Calculate warscore from war contribution
 */
export function calculateWarscoreFromContribution(
  contribution: WarContribution,
  side: PeaceConferenceParticipant['side']
): number {
  if (side === 'defeated') {
    return 0; // Defeated nations don't get warscore
  }

  let score = 0;

  // Military actions (60% of score)
  score += contribution.territoriesCaptured * 20;
  score += contribution.enemyCasualtiesInflicted / 1000; // 1000 casualties = 1 point
  score += contribution.battlesWon * 15;

  // Support actions (20% of score)
  score += contribution.lendLeaseProvided / 100; // 100 resources = 1 point
  score += contribution.allianceSupport * 5;

  // Time investment (20% of score)
  score += contribution.turnsInWar * 2;

  // Penalties for losses
  score -= contribution.territoriesLost * 10;
  score -= contribution.casualtiesSuffered / 2000; // Fewer penalty for casualties

  // Mediators and guarantors get bonus score
  if (side === 'mediator') {
    score *= 1.3;
  } else if (side === 'guarantor') {
    score *= 1.15;
  }

  return Math.max(10, Math.floor(score)); // Minimum 10 warscore
}

/**
 * Calculate war contribution for a nation
 */
export function calculateWarContribution(
  nationId: string,
  warId: string,
  warStartTurn: number,
  currentTurn: number,
  gameState: any // Would need full game state for this
): WarContribution {
  // This is a placeholder - actual implementation would need to:
  // 1. Track battles and their outcomes
  // 2. Track territory changes
  // 3. Track lend-lease agreements
  // 4. Track casualties

  return {
    territoriesCaptured: 0,
    enemyCasualtiesInflicted: 0,
    battlesWon: 0,
    lendLeaseProvided: 0,
    allianceSupport: 0,
    turnsInWar: currentTurn - warStartTurn,
    territoriesLost: 0,
    casualtiesSuffered: 0,
    contributionScore: 0,
  };
}

/**
 * Create a peace demand
 */
export function createPeaceDemand(
  conference: EnhancedPeaceConference,
  demandingNation: string,
  demandType: PeaceDemandType,
  target: string,
  details: PeaceDemandDetails,
  justification: string
): { conference: EnhancedPeaceConference; demand: PeaceDemand | null } {
  const participant = conference.participants.find(p => p.nationId === demandingNation);
  if (!participant) {
    return { conference, demand: null };
  }

  // Calculate warscore cost
  const cost = calculateDemandCost(demandType, details);

  // Check if participant has enough warscore
  if (participant.remainingWarscore < cost) {
    return { conference, demand: null };
  }

  const demand: PeaceDemand = {
    id: generateId(),
    demandingNation,
    demandType,
    target,
    warscoreCost: cost,
    details,
    supporters: [demandingNation],
    opponents: [],
    status: 'proposed',
    justification,
  };

  // Deduct warscore
  const updatedParticipants = conference.participants.map(p =>
    p.nationId === demandingNation
      ? { ...p, remainingWarscore: p.remainingWarscore - cost }
      : p
  );

  const updatedConference: EnhancedPeaceConference = {
    ...conference,
    participants: updatedParticipants,
    demands: [...conference.demands, demand],
    demandHistory: [...conference.demandHistory, demand],
  };

  return { conference: updatedConference, demand };
}

/**
 * Calculate warscore cost for a demand
 */
function calculateDemandCost(type: PeaceDemandType, details: PeaceDemandDetails): number {
  const baseCosts: Record<PeaceDemandType, number> = {
    annex_territory: 50,
    puppet_state: 75,
    disarmament: 30,
    reparations: 25,
    regime_change: 60,
    demilitarized_zone: 20,
    return_territory: 10,
    war_crimes_trial: 40,
    technology_transfer: 35,
    base_rights: 15,
  };

  let cost = baseCosts[type];

  // Adjust based on details
  if (type === 'annex_territory' && details.territoryIds) {
    cost += details.territoryIds.length * 20; // Each territory adds cost
  }

  if (type === 'reparations' && details.reparations) {
    const totalValue =
      (details.reparations.production || 0) +
      (details.reparations.uranium || 0) * 2 +
      (details.reparations.gold || 0);
    cost += Math.floor(totalValue / 100); // Every 100 resources = 1 warscore
  }

  if (type === 'puppet_state') {
    cost = 100; // Puppeting is expensive
  }

  return cost;
}

/**
 * Support a demand
 */
export function supportDemand(
  conference: EnhancedPeaceConference,
  demandId: string,
  nationId: string
): EnhancedPeaceConference {
  const updatedDemands = conference.demands.map(d => {
    if (d.id !== demandId) return d;

    // Remove from opponents if present
    const opponents = d.opponents.filter(id => id !== nationId);
    const supporters = d.supporters.includes(nationId) ? d.supporters : [...d.supporters, nationId];

    return { ...d, supporters, opponents };
  });

  return {
    ...conference,
    demands: updatedDemands,
  };
}

/**
 * Oppose a demand
 */
export function opposeDemand(
  conference: EnhancedPeaceConference,
  demandId: string,
  nationId: string
): EnhancedPeaceConference {
  const updatedDemands = conference.demands.map(d => {
    if (d.id !== demandId) return d;

    // Remove from supporters if present
    const supporters = d.supporters.filter(id => id !== nationId);
    const opponents = d.opponents.includes(nationId) ? d.opponents : [...d.opponents, nationId];

    // Check if red lines crossed
    const participant = conference.participants.find(p => p.nationId === nationId);
    if (participant && checkRedLinesCrossed(d, participant)) {
      return { ...d, supporters, opponents, status: 'contested' as const };
    }

    return { ...d, supporters, opponents };
  });

  return {
    ...conference,
    demands: updatedDemands,
  };
}

/**
 * Check if demand crosses red lines
 */
function checkRedLinesCrossed(
  demand: PeaceDemand,
  participant: PeaceConferenceParticipant
): boolean {
  for (const redLine of participant.redLines) {
    if (
      (redLine.includes('territory') && demand.demandType === 'annex_territory') ||
      (redLine.includes('regime') && demand.demandType === 'regime_change') ||
      (redLine.includes('puppet') && demand.demandType === 'puppet_state')
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Vote on a demand
 */
export function voteOnDemand(
  conference: EnhancedPeaceConference,
  demandId: string
): { passed: boolean; supportWeight: number; opposeWeight: number } {
  const demand = conference.demands.find(d => d.id === demandId);
  if (!demand) {
    return { passed: false, supportWeight: 0, opposeWeight: 0 };
  }

  let supportWeight = 0;
  let opposeWeight = 0;

  for (const participant of conference.participants) {
    if (!participant.attended) continue;

    if (demand.supporters.includes(participant.nationId)) {
      supportWeight += participant.votingPower;
    } else if (demand.opponents.includes(participant.nationId)) {
      opposeWeight += participant.votingPower;
    }
  }

  const passed = supportWeight > opposeWeight;

  return { passed, supportWeight, opposeWeight };
}

/**
 * Finalize demand voting
 */
export function finalizeDemand(
  conference: EnhancedPeaceConference,
  demandId: string
): EnhancedPeaceConference {
  const voteResult = voteOnDemand(conference, demandId);

  const updatedDemands = conference.demands.map(d => {
    if (d.id !== demandId) return d;

    return {
      ...d,
      status: voteResult.passed ? ('accepted' as const) : ('rejected' as const),
    };
  });

  return {
    ...conference,
    demands: updatedDemands,
  };
}

/**
 * Advance conference to next round
 */
export function advanceConferenceRound(
  conference: EnhancedPeaceConference
): EnhancedPeaceConference {
  const newRound = conference.currentRound + 1;

  // Check if conference should conclude
  if (newRound >= conference.maxRounds) {
    return {
      ...conference,
      status: 'concluded',
      currentRound: newRound,
    };
  }

  // Check for deadlock (no accepted demands and high opposition)
  const acceptedDemands = conference.demands.filter(d => d.status === 'accepted').length;
  const contestedDemands = conference.demands.filter(d => d.status === 'contested').length;

  if (acceptedDemands === 0 && contestedDemands > 3 && newRound > 5) {
    return {
      ...conference,
      status: 'deadlocked',
      currentRound: newRound,
    };
  }

  return {
    ...conference,
    currentRound: newRound,
    status: 'negotiating',
  };
}

/**
 * Create peace treaty from accepted demands
 */
export function createPeaceTreatyFromDemands(
  conference: EnhancedPeaceConference,
  currentTurn: number,
  duration: number = 50
): PeaceTreaty | null {
  const acceptedDemands = conference.demands.filter(d => d.status === 'accepted');

  if (acceptedDemands.length === 0) {
    return null; // No accepted demands
  }

  const signatories = Array.from(
    new Set([
      ...acceptedDemands.flatMap(d => d.supporters),
      ...conference.participants
        .filter(p => p.side === 'victor' || p.side === 'defeated')
        .map(p => p.nationId),
    ])
  );

  const guarantors = conference.participants
    .filter(p => p.side === 'guarantor')
    .map(p => p.nationId);

  const treaty: PeaceTreaty = {
    id: generateId(),
    conferenceId: conference.id,
    name: `${conference.name} Treaty`,
    signedTurn: currentTurn,

    signatories,
    guarantors,

    terms: acceptedDemands,

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
export function concludeConferenceWithTreaty(
  conference: EnhancedPeaceConference,
  treaty: PeaceTreaty
): EnhancedPeaceConference {
  return {
    ...conference,
    status: 'concluded',
    finalTreaty: treaty,
  };
}

/**
 * Update participant walkout risk
 */
export function updateWalkoutRisk(
  conference: EnhancedPeaceConference,
  nationId: string,
  delta: number
): EnhancedPeaceConference {
  const updatedParticipants = conference.participants.map(p => {
    if (p.nationId !== nationId) return p;

    const newRisk = Math.max(0, Math.min(100, p.walkoutRisk + delta));

    // Check if walkout occurs
    if (newRisk >= 90 && Math.random() > 0.5) {
      return { ...p, walkoutRisk: 100, attended: false };
    }

    return { ...p, walkoutRisk: newRisk };
  });

  // Check if critical participants left
  const victimsPresent = updatedParticipants.filter(
    p => p.side === 'victor' && p.attended
  ).length;

  const defeatedPresent = updatedParticipants.filter(
    p => p.side === 'defeated' && p.attended
  ).length;

  const newStatus = victimsPresent === 0 || defeatedPresent === 0 ? 'collapsed' : conference.status;

  return {
    ...conference,
    participants: updatedParticipants,
    status: newStatus,
  };
}

/**
 * Get conference progress percentage
 */
export function getConferenceProgress(conference: EnhancedPeaceConference): number {
  return (conference.currentRound / conference.maxRounds) * 100;
}

/**
 * Calculate conference success probability
 */
export function calculateConferenceSuccessProbability(
  conference: EnhancedPeaceConference
): number {
  let probability = 50; // Base 50%

  // More participants = harder
  const participantCount = conference.participants.filter(p => p.attended).length;
  probability -= participantCount * 3;

  // High walkout risk reduces success
  const avgWalkoutRisk =
    conference.participants.reduce((sum, p) => sum + p.walkoutRisk, 0) /
    conference.participants.length;
  probability -= avgWalkoutRisk / 2;

  // Mediators help
  const mediatorCount = conference.participants.filter(p => p.side === 'mediator').length;
  probability += mediatorCount * 15;

  // Accepted demands increase success
  const acceptedCount = conference.demands.filter(d => d.status === 'accepted').length;
  probability += acceptedCount * 10;

  // Contested demands reduce success
  const contestedCount = conference.demands.filter(d => d.status === 'contested').length;
  probability -= contestedCount * 8;

  return Math.max(0, Math.min(100, probability));
}

/**
 * Get remaining warscore for nation
 */
export function getRemainingWarscore(
  conference: EnhancedPeaceConference,
  nationId: string
): number {
  const participant = conference.participants.find(p => p.nationId === nationId);
  return participant?.remainingWarscore || 0;
}

/**
 * Get all demands by a nation
 */
export function getDemandsByNation(
  conference: EnhancedPeaceConference,
  nationId: string
): PeaceDemand[] {
  return conference.demands.filter(d => d.demandingNation === nationId);
}

/**
 * Check if demand is affordable
 */
export function canAffordDemand(
  conference: EnhancedPeaceConference,
  nationId: string,
  demandType: PeaceDemandType,
  details: PeaceDemandDetails
): { canAfford: boolean; cost: number; remaining: number } {
  const participant = conference.participants.find(p => p.nationId === nationId);
  if (!participant) {
    return { canAfford: false, cost: 0, remaining: 0 };
  }

  const cost = calculateDemandCost(demandType, details);
  const canAfford = participant.remainingWarscore >= cost;

  return {
    canAfford,
    cost,
    remaining: participant.remainingWarscore,
  };
}

/**
 * Get conference status description
 */
export function getConferenceStatusDescription(status: ConferenceStatus): string {
  switch (status) {
    case 'assembling':
      return 'Assembling participants and calculating war contributions';
    case 'negotiating':
      return 'Nations are negotiating peace terms';
    case 'voting':
      return 'Voting on proposed peace terms';
    case 'concluded':
      return 'Conference successfully concluded with treaty';
    case 'collapsed':
      return 'Conference collapsed - critical participants walked out';
    case 'deadlocked':
      return 'Conference deadlocked - no agreement possible';
  }
}

/**
 * Get demand type description
 */
export function getDemandTypeDescription(type: PeaceDemandType): string {
  const descriptions: Record<PeaceDemandType, string> = {
    annex_territory: 'Annex Territory',
    puppet_state: 'Create Puppet State',
    disarmament: 'Force Disarmament',
    reparations: 'Demand Reparations',
    regime_change: 'Force Regime Change',
    demilitarized_zone: 'Create Demilitarized Zone',
    return_territory: 'Return Territory',
    war_crimes_trial: 'War Crimes Trial',
    technology_transfer: 'Technology Transfer',
    base_rights: 'Military Base Rights',
  };

  return descriptions[type];
}
