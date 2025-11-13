/**
 * Cuba Crisis Peace Conference Wrapper
 *
 * This module adapts the legacy Cuban Missile Crisis peace conference data
 * into the unified multi-party diplomacy engine. It reconstructs the old
 * resolution payloads (alliances, concessions, scoring) as modern
 * `MultiPartyAgreement` objects and exposes helpers so the diplomacy
 * engine can apply their effects using the new relationship structures.
 */

import { generateId } from '@/lib/idGenerator';
import { updateRelationship } from '@/lib/unifiedDiplomacyMigration';
import type { GameState, Nation } from '@/types/game';
import type {
  AgreementCondition,
  AgreementVote,
  MultiPartyAgreement,
  MultiPartyTerms,
  NationBenefit,
  NationObligation,
  ObligationType,
} from '@/types/multiPartyDiplomacy';
import {
  initializeMultiPartyDiplomacyState,
} from '@/types/multiPartyDiplomacy';
import { clampTrust, DEFAULT_TRUST } from '@/types/trustAndFavors';
import type { TrustRecord } from '@/types/trustAndFavors';

/** Legacy participant information */
interface LegacyParticipant {
  id: string;
  role: 'superpower' | 'mediator' | 'stakeholder' | 'alliance';
  votingPower: number;
  alignment: 'us' | 'ussr' | 'neutral';
}

/** Legacy alliance change description */
export interface LegacyAllianceChange {
  members: [string, string];
  kind: 'formal-alliance' | 'non-aggression' | 'security-guarantee';
  relationshipBoost: number;
  reason: string;
}

/** Legacy concession description */
export interface LegacyConcession {
  from: string;
  to: string;
  obligation: ObligationType;
  description: string;
  value?: number;
  relationshipImpact: number;
  trustImpact?: number;
}

/** Relationship adjustments that were part of the legacy scoring */
interface LegacyRelationshipAdjustment {
  source: string;
  target: string;
  delta: number;
  reason: string;
}

/** Legacy resolution scoring metadata */
export interface LegacyResolutionScoring {
  defconDelta?: number;
  relationshipAdjustments?: LegacyRelationshipAdjustment[];
}

/** Metadata stored on the modern agreement for scenario-specific effects */
export interface CubaConferenceMetadata {
  scenario: 'cuba-crisis';
  conferenceId: string;
  resolutionId: string;
  alliances?: LegacyAllianceChange[];
  concessions?: LegacyConcession[];
  scoring?: LegacyResolutionScoring;
}

interface LegacyResolution {
  id: string;
  title: string;
  description: string;
  initiatorId: string;
  majorityThreshold: number; // Percentage (0-1) of participants required
  votingWindow: number; // Turns before vote resolves
  alliances?: LegacyAllianceChange[];
  concessions?: LegacyConcession[];
  scoring?: LegacyResolutionScoring;
}

interface LegacyConference {
  id: string;
  title: string;
  convenedBy: string;
  participants: LegacyParticipant[];
  resolutions: LegacyResolution[];
}

/**
 * Static snapshot of the original Cuban Missile Crisis peace conference data.
 * The structure mirrors the data shape used by the legacy diplomacy system.
 */
const LEGACY_CUBA_CONFERENCE: LegacyConference = {
  id: 'cuba-1962-emergency-peace-conference',
  title: 'Emergency Peace Conference on Cuba',
  convenedBy: 'un',
  participants: [
    { id: 'us', role: 'superpower', votingPower: 1.2, alignment: 'us' },
    { id: 'soviet', role: 'superpower', votingPower: 1.2, alignment: 'ussr' },
    { id: 'cuba', role: 'stakeholder', votingPower: 0.8, alignment: 'ussr' },
    { id: 'turkey', role: 'stakeholder', votingPower: 0.6, alignment: 'us' },
    { id: 'nato', role: 'alliance', votingPower: 0.5, alignment: 'us' },
    { id: 'warsaw', role: 'alliance', votingPower: 0.5, alignment: 'ussr' },
    { id: 'un', role: 'mediator', votingPower: 1.0, alignment: 'neutral' },
  ],
  resolutions: [
    {
      id: 'dual-withdrawal',
      title: 'Dual Missile Withdrawal & Non-Invasion Guarantees',
      description:
        'Both superpowers dismantle forward-deployed missiles (US in Turkey, USSR in Cuba). The US pledges not to invade Cuba and the UN oversees compliance.',
      initiatorId: 'un',
      majorityThreshold: 0.6,
      votingWindow: 2,
      alliances: [
        {
          members: ['us', 'turkey'],
          kind: 'formal-alliance',
          relationshipBoost: 12,
          reason: 'Joint security planning following Jupiter missile withdrawal',
        },
        {
          members: ['us', 'cuba'],
          kind: 'non-aggression',
          relationshipBoost: 25,
          reason: 'US guarantees no invasion of Cuba',
        },
      ],
      concessions: [
        {
          from: 'soviet',
          to: 'us',
          obligation: 'military-support',
          description: 'Dismantle and remove offensive missile platforms from Cuba under UN verification.',
          relationshipImpact: 18,
          trustImpact: 6,
        },
        {
          from: 'us',
          to: 'soviet',
          obligation: 'military-support',
          description: 'Secret withdrawal of Jupiter missiles from Turkey within five months.',
          relationshipImpact: 14,
          trustImpact: 5,
        },
        {
          from: 'us',
          to: 'cuba',
          obligation: 'no-aggression',
          description: 'Formal non-invasion pledge toward Cuba backed by Organization of American States.',
          relationshipImpact: 28,
          trustImpact: 10,
        },
        {
          from: 'soviet',
          to: 'turkey',
          obligation: 'no-aggression',
          description: 'Assurance that Warsaw Pact forces will not escalate tensions in Turkey after US missile withdrawal.',
          relationshipImpact: 10,
        },
      ],
      scoring: {
        defconDelta: 1,
        relationshipAdjustments: [
          {
            source: 'un',
            target: 'us',
            delta: 8,
            reason: 'UN mediation builds goodwill with the United States.',
          },
          {
            source: 'un',
            target: 'soviet',
            delta: 8,
            reason: 'UN mediation builds goodwill with the Soviet Union.',
          },
        ],
      },
    },
    {
      id: 'cuban-inspections',
      title: 'On-Site Cuban Inspections & Security Guarantees',
      description:
        'UN teams gain access to Cuban missile sites while Cuba receives development aid and Soviet security guarantees.',
      initiatorId: 'un',
      majorityThreshold: 0.55,
      votingWindow: 3,
      alliances: [
        {
          members: ['cuba', 'un'],
          kind: 'security-guarantee',
          relationshipBoost: 16,
          reason: 'UN peacekeepers stationed in Cuba reassure Havana of international protection.',
        },
      ],
      concessions: [
        {
          from: 'cuba',
          to: 'un',
          obligation: 'share-intel',
          description: 'Cuba allows international inspectors to verify dismantled missile sites.',
          relationshipImpact: 12,
        },
        {
          from: 'soviet',
          to: 'cuba',
          obligation: 'military-support',
          description: 'Soviet Union provides rapid response forces if Cuba is attacked during inspections.',
          relationshipImpact: 9,
        },
        {
          from: 'us',
          to: 'un',
          obligation: 'share-intel',
          description: 'US intelligence shares surveillance data with the UN to confirm compliance.',
          relationshipImpact: 10,
        },
      ],
      scoring: {
        defconDelta: 0,
        relationshipAdjustments: [
          {
            source: 'cuba',
            target: 'un',
            delta: 10,
            reason: 'Inspection regime builds trust between Cuba and the UN.',
          },
        ],
      },
    },
  ],
};

/**
 * Type guard to verify that agreement metadata belongs to this scenario.
 */
export function isCubaConferenceMetadata(metadata: unknown): metadata is CubaConferenceMetadata {
  return !!metadata && typeof metadata === 'object' && (metadata as CubaConferenceMetadata).scenario === 'cuba-crisis';
}

/**
 * Translate the legacy conference into multi-party agreements and register
 * them on the supplied game state. Returns the generated agreements for
 * convenience/testing.
 */
export function seedCubaCrisisPeaceConference(
  gameState: GameState,
  conference: LegacyConference = LEGACY_CUBA_CONFERENCE
): MultiPartyAgreement[] {
  if (!gameState.multiPartyDiplomacy) {
    gameState.multiPartyDiplomacy = initializeMultiPartyDiplomacyState();
  }

  const participantIds = conference.participants
    .map(participant => participant.id)
    .filter(id => gameState.nations.some(nation => nation.id === id));

  const agreements = conference.resolutions.map(resolution =>
    convertResolutionToAgreement(resolution, participantIds, gameState.turn, conference.id)
  );

  gameState.multiPartyDiplomacy!.pendingProposals.push(...agreements);

  return agreements;
}

function convertResolutionToAgreement(
  resolution: LegacyResolution,
  participantIds: string[],
  currentTurn: number,
  conferenceId: string
): MultiPartyAgreement {
  const obligations = buildObligations(resolution);
  const benefits = buildBenefits(resolution);

  const terms: MultiPartyTerms = {
    duration: 12, // Peace treaties typically last a year in-game time
    obligations,
    benefits,
    penalties: [
      {
        type: 'relationship-drop',
        value: 25,
        description: 'Breaking the peace accords reignites the Cuban crisis.',
        applyToAll: true,
      },
    ],
    conditions: buildConditions(resolution),
  };

  const requiredVotes = Math.max(1, Math.ceil(participantIds.length * resolution.majorityThreshold));
  const metadata: CubaConferenceMetadata = {
    scenario: 'cuba-crisis',
    conferenceId,
    resolutionId: resolution.id,
    alliances: resolution.alliances,
    concessions: resolution.concessions,
    scoring: resolution.scoring,
  };

  const agreement: MultiPartyAgreement = {
    id: generateId('cuba-peace'),
    type: 'peace-treaty',
    title: resolution.title,
    description: resolution.description,
    participantIds,
    initiatorId: resolution.initiatorId,
    status: 'proposed',
    votes: {} as Record<string, AgreementVote>,
    createdTurn: currentTurn,
    votingDeadline: currentTurn + Math.max(1, resolution.votingWindow),
    requiredVotes,
    terms,
    metadata,
  };

  return agreement;
}

function buildObligations(resolution: LegacyResolution): NationObligation[] {
  const obligations: NationObligation[] = [];

  if (resolution.concessions) {
    for (const concession of resolution.concessions) {
      obligations.push({
        nationId: concession.from,
        type: concession.obligation,
        value: concession.value,
        description: concession.description,
      });
    }
  }

  if (resolution.alliances) {
    for (const alliance of resolution.alliances) {
      const [memberA, memberB] = alliance.members;
      const description = alliance.reason;

      if (alliance.kind === 'formal-alliance' || alliance.kind === 'security-guarantee') {
        obligations.push({
          nationId: memberA,
          type: 'defend-member',
          description,
        });
        obligations.push({
          nationId: memberB,
          type: 'defend-member',
          description,
        });
      }

      if (alliance.kind === 'non-aggression') {
        obligations.push({
          nationId: memberA,
          type: 'no-aggression',
          description,
        });
        obligations.push({
          nationId: memberB,
          type: 'no-aggression',
          description,
        });
      }
    }
  }

  return obligations;
}

function buildBenefits(resolution: LegacyResolution): NationBenefit[] {
  const benefits: NationBenefit[] = [];

  if (!resolution.alliances) {
    return benefits;
  }

  for (const alliance of resolution.alliances) {
    const [memberA, memberB] = alliance.members;
    const description = alliance.reason;
    const benefitType: NationBenefit['type'] =
      alliance.kind === 'non-aggression' ? 'diplomatic-support' : 'military-protection';

    benefits.push({
      nationId: memberA,
      type: benefitType,
      description,
    });
    benefits.push({
      nationId: memberB,
      type: benefitType,
      description,
    });
  }

  return benefits;
}

function buildConditions(resolution: LegacyResolution): AgreementCondition[] | undefined {
  if (!resolution.concessions || resolution.concessions.length === 0) {
    return undefined;
  }

  return resolution.concessions.map(concession => ({
    type: 'peace-maintained',
    value: 0,
    description: `Ensure ${concession.description}`,
  }));
}

/**
 * Apply the outcome of a passed Cuban peace conference agreement. This is
 * invoked by the multi-party diplomacy engine once voting completes.
 */
export function applyCubaPeaceConferenceOutcome(
  agreement: MultiPartyAgreement,
  gameState: GameState
): void {
  if (!isCubaConferenceMetadata(agreement.metadata)) {
    return;
  }

  const metadata = agreement.metadata;

  if (metadata.alliances) {
    for (const alliance of metadata.alliances) {
      applyAllianceChange(alliance, gameState, agreement);
    }
  }

  if (metadata.concessions) {
    for (const concession of metadata.concessions) {
      applyConcession(concession, gameState, agreement);
    }
  }

  if (metadata.scoring) {
    applyResolutionScoring(metadata.scoring, gameState, agreement);
  }
}

function applyAllianceChange(
  change: LegacyAllianceChange,
  gameState: GameState,
  agreement: MultiPartyAgreement
): void {
  const [aId, bId] = change.members;
  const nationA = findNation(gameState, aId);
  const nationB = findNation(gameState, bId);

  if (!nationA || !nationB) {
    return;
  }

  const reason = `${change.reason} (Peace Conference: ${agreement.title})`;
  const { nationA: updatedA, nationB: updatedB } = updateRelationship(
    nationA,
    nationB,
    change.relationshipBoost,
    reason,
    gameState.turn
  );

  const treatyPatchA = buildTreatyPatch(updatedA, bId, change);
  const treatyPatchB = buildTreatyPatch(updatedB, aId, change);

  commitNationUpdate(gameState, treatyPatchA);
  commitNationUpdate(gameState, treatyPatchB);
}

function applyConcession(
  concession: LegacyConcession,
  gameState: GameState,
  agreement: MultiPartyAgreement
): void {
  const fromNation = findNation(gameState, concession.from);
  const toNation = findNation(gameState, concession.to);

  if (!fromNation || !toNation) {
    return;
  }

  const reason = `${concession.description} (Peace Conference: ${agreement.title})`;
  const { nationA: updatedFrom, nationB: updatedTo } = updateRelationship(
    fromNation,
    toNation,
    concession.relationshipImpact,
    reason,
    gameState.turn
  );

  const providerWithTreaty = attachConcessionTreaty(
    updatedFrom,
    toNation.id,
    concession,
    'provider'
  );
  const recipientWithTreaty = attachConcessionTreaty(
    updatedTo,
    fromNation.id,
    concession,
    'recipient'
  );
  const recipientFinal = applyTrustImpact(
    recipientWithTreaty,
    fromNation.id,
    concession,
    gameState
  );

  commitNationUpdate(gameState, providerWithTreaty);
  commitNationUpdate(gameState, recipientFinal);
}

function applyResolutionScoring(
  scoring: LegacyResolutionScoring,
  gameState: GameState,
  agreement: MultiPartyAgreement
): void {
  if (typeof scoring.defconDelta === 'number' && !Number.isNaN(scoring.defconDelta)) {
    gameState.defcon = Math.min(5, Math.max(1, gameState.defcon + scoring.defconDelta));
  }

  if (scoring.relationshipAdjustments) {
    for (const adjustment of scoring.relationshipAdjustments) {
      const source = findNation(gameState, adjustment.source);
      const target = findNation(gameState, adjustment.target);

      if (!source || !target) {
        continue;
      }

      const { nationA, nationB } = updateRelationship(
        source,
        target,
        adjustment.delta,
        `${adjustment.reason} (Peace Conference: ${agreement.title})`,
        gameState.turn
      );

      commitNationUpdate(gameState, nationA);
      commitNationUpdate(gameState, nationB);
    }
  }
}

function findNation(gameState: GameState, id: string): Nation | undefined {
  return gameState.nations.find(nation => nation.id === id);
}

function commitNationUpdate(gameState: GameState, nation: Nation): void {
  const index = gameState.nations.findIndex(n => n.id === nation.id);
  if (index >= 0) {
    gameState.nations[index] = nation;
  }
}

function buildTreatyPatch(nation: Nation, partnerId: string, change: LegacyAllianceChange): Nation {
  const treaties = { ...(nation.treaties || {}) };
  const partnerTreaty = { ...(treaties[partnerId] || {}) } as Record<string, unknown>;

  if (change.kind === 'formal-alliance') {
    partnerTreaty.alliance = true;
  }

  if (change.kind === 'non-aggression') {
    partnerTreaty.nonAggression = true;
  }

  if (change.kind === 'security-guarantee') {
    partnerTreaty.securityGuarantee = true;
  }

  return {
    ...nation,
    treaties: {
      ...treaties,
      [partnerId]: partnerTreaty,
    },
  };
}

function attachConcessionTreaty(
  nation: Nation,
  partnerId: string,
  concession: LegacyConcession,
  direction: 'provider' | 'recipient'
): Nation {
  const treaties = { ...(nation.treaties || {}) };
  const partnerTreaty = { ...(treaties[partnerId] || {}) } as Record<string, unknown>;

  switch (concession.obligation) {
    case 'no-aggression':
      partnerTreaty.nonAggression = true;
      break;
    case 'military-support':
      if (direction === 'provider') {
        partnerTreaty.securityGuarantee = true;
      } else {
        partnerTreaty.guaranteedBy = concession.from;
      }
      break;
    case 'share-intel':
      partnerTreaty.intelSharing = true;
      break;
    case 'resource-tribute':
      if (direction === 'provider') {
        partnerTreaty.economicAssistance = true;
      } else {
        partnerTreaty.receivesAid = true;
      }
      break;
    case 'defend-member':
      partnerTreaty.defensePledge = true;
      break;
    case 'vote-alignment':
      partnerTreaty.voteAlignment = true;
      break;
    case 'embargo-target':
      partnerTreaty.embargo = true;
      break;
  }

  return {
    ...nation,
    treaties: {
      ...treaties,
      [partnerId]: partnerTreaty,
    },
  };
}

function applyTrustImpact(
  nation: Nation,
  partnerId: string,
  concession: LegacyConcession,
  gameState: GameState
): Nation {
  if (!concession.trustImpact) {
    return nation;
  }

  const existingRecord = nation.trustRecords?.[partnerId] as TrustRecord | undefined;
  const currentTrust = existingRecord?.value ?? DEFAULT_TRUST;
  const newTrust = clampTrust(currentTrust + concession.trustImpact);

  const history = [
    ...(existingRecord?.history || []).slice(-10),
    {
      turn: gameState.turn,
      delta: concession.trustImpact,
      reason: `${concession.description} (Peace Conference)`,
      newValue: newTrust,
    },
  ];

  return {
    ...nation,
    trustRecords: {
      ...(nation.trustRecords || {}),
      [partnerId]: {
        value: newTrust,
        lastUpdated: gameState.turn,
        history,
      } as TrustRecord,
    },
  };
}

