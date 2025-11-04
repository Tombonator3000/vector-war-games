/**
 * Cuba Crisis Peace Conference System
 *
 * Multi-party peace negotiations to resolve the Cuban Missile Crisis
 * Integrates:
 * - Multiple stakeholders (US, USSR, Cuba, Turkey, UN, NATO, Warsaw Pact)
 * - Complex peace terms (public vs secret)
 * - Treaty compliance and verification
 * - Historical accuracy tracking
 */

import type {
  PeaceConference,
  ConferenceParticipant,
  ConferenceAgendaItem,
  PeaceProposal,
  PeaceTerm,
  PeaceTreaty,
} from '@/types/diplomacyPhase3';
import type { ThirdPartyActor } from './cubaCrisisMultiParty';

// ============================================================================
// CUBA CRISIS PEACE CONFERENCE
// ============================================================================

/**
 * Initialize the peace conference for Cuba Crisis resolution
 */
export function initializeCubaCrisisPeaceConference(
  turn: number,
  convenedBy: string,
  warEscalation: number
): PeaceConference {
  return {
    id: 'cuba-crisis-peace-conference',
    name: 'Cuban Missile Crisis Resolution Conference',
    convenedBy,
    convenedTurn: turn,
    participants: [
      // US - Primary belligerent
      {
        nationId: 'us',
        role: 'belligerent',
        votingPower: 2.0, // Permanent UNSC member
        primaryObjectives: [
          'Remove Soviet nuclear missiles from Cuba',
          'Prevent future Soviet military buildup in Western Hemisphere',
          'Preserve NATO alliance unity',
          'Avoid appearance of weakness',
        ],
        acceptableOutcomes: [
          'Soviet missiles removed from Cuba',
          'US non-invasion pledge',
          'Quiet removal of Turkey missiles (6 months)',
          'UN verification of missile removal',
        ],
        redLines: [
          'Soviet missiles remain in Cuba',
          'US forced to publicly surrender Turkey missiles',
          'NATO alliance fractured',
        ],
        attended: true,
        walkoutRisk: 20, // Low - US wants resolution
      },
      // USSR - Primary belligerent
      {
        nationId: 'soviet',
        role: 'belligerent',
        votingPower: 2.0, // Permanent UNSC member
        primaryObjectives: [
          'Secure guarantee against US invasion of Cuba',
          'Remove US missiles from Turkey',
          'Preserve Soviet prestige and leadership',
          'Maintain alliance with Cuba',
        ],
        acceptableOutcomes: [
          'US non-invasion pledge for Cuba',
          'Turkey missiles removed (even if quiet)',
          'Face-saving for Soviet leadership',
          'Cuba\'s security guaranteed',
        ],
        redLines: [
          'No security guarantee for Cuba',
          'Public humiliation of Soviet Union',
          'Loss of Cuba as ally',
        ],
        attended: true,
        walkoutRisk: 25, // Moderate - Khrushchev under domestic pressure
      },
      // Cuba - Directly affected party
      {
        nationId: 'cuba',
        role: 'belligerent',
        votingPower: 1.0,
        primaryObjectives: [
          'Prevent US invasion',
          'Preserve national sovereignty',
          'Maintain Soviet protection',
          'Not be treated as pawn',
          'Remove Guantanamo Bay (aspirational)',
        ],
        acceptableOutcomes: [
          'Ironclad non-invasion guarantee',
          'Cuban sovereignty respected',
          'Soviet commitment to defense',
        ],
        redLines: [
          'Deal made without Cuban input',
          'Cuba treated as Soviet colony',
          'No security guarantee',
        ],
        attended: true,
        walkoutRisk: 60, // High - Castro is independent-minded
      },
      // Turkey - Directly affected by potential missile trade
      {
        nationId: 'turkey',
        role: 'observer', // Not belligerent but affected
        votingPower: 1.0,
        primaryObjectives: [
          'Maintain US/NATO defense commitment',
          'Preserve national sovereignty',
          'Be consulted on matters affecting Turkey',
          'Counter Soviet threat',
        ],
        acceptableOutcomes: [
          'NATO commitment maintained or strengthened',
          'If missiles removed, replacement systems deployed',
          'Full consultation and consent',
        ],
        redLines: [
          'Missiles removed without Turkish consent',
          'NATO defense commitment weakened',
          'Turkey used as bargaining chip',
        ],
        attended: true,
        walkoutRisk: 55, // High if not consulted
      },
      // UN - Mediator
      {
        nationId: 'un',
        role: 'mediator',
        votingPower: 1.5, // Enhanced mediator role
        primaryObjectives: [
          'Prevent nuclear war',
          'Establish verification mechanisms',
          'Create precedent for future arms control',
          'Strengthen international law',
        ],
        acceptableOutcomes: [
          'Peaceful resolution',
          'UN verification role',
          'Both sides make concessions',
        ],
        redLines: ['Nuclear war', 'Complete UN irrelevance'],
        attended: true,
        walkoutRisk: 5, // Very low - neutral mediator
      },
      // UK - NATO ally and UNSC permanent member
      {
        nationId: 'uk',
        role: 'guarantor', // Will help enforce treaty
        votingPower: 2.0,
        primaryObjectives: [
          'Prevent nuclear war',
          'Maintain NATO unity',
          'Preserve special relationship with US',
          'Support international law',
        ],
        acceptableOutcomes: [
          'Peaceful resolution',
          'NATO preserved',
          'Both sides compromise',
        ],
        redLines: ['Nuclear war', 'NATO collapse'],
        attended: true,
        walkoutRisk: 10,
      },
      // France - NATO ally and UNSC permanent member
      {
        nationId: 'france',
        role: 'guarantor',
        votingPower: 2.0,
        primaryObjectives: [
          'Prevent nuclear war',
          'Assert European independence',
          'Support peaceful resolution',
        ],
        acceptableOutcomes: ['Negotiated settlement', 'European voice heard'],
        redLines: ['Nuclear war'],
        attended: true,
        walkoutRisk: 15,
      },
    ],
    warIds: [], // No formal war declared
    agenda: [
      {
        id: 'missile-removal',
        topic: 'Soviet Missile Removal from Cuba',
        description: 'Terms for removal of Soviet nuclear missiles from Cuban territory',
        priority: 'critical',
        proposedBy: 'us',
        status: 'pending',
      },
      {
        id: 'non-invasion',
        topic: 'US Non-Invasion Pledge',
        description: 'Guarantee that United States will not invade Cuba',
        priority: 'critical',
        proposedBy: 'soviet',
        status: 'pending',
      },
      {
        id: 'turkey-missiles',
        topic: 'Jupiter Missiles in Turkey',
        description: 'Status of US Jupiter missiles deployed in Turkey',
        priority: 'important',
        proposedBy: 'soviet',
        status: 'pending',
      },
      {
        id: 'verification',
        topic: 'UN Verification and Inspection',
        description: 'UN inspectors to verify missile removal',
        priority: 'important',
        proposedBy: 'un',
        status: 'pending',
      },
      {
        id: 'cuban-security',
        topic: 'Cuban Security Guarantees',
        description: 'Long-term security arrangements for Cuba',
        priority: 'important',
        proposedBy: 'cuba',
        status: 'pending',
      },
      {
        id: 'future-arms-control',
        topic: 'Future Arms Control Measures',
        description: 'Precedents for future crisis management and arms control',
        priority: 'desirable',
        proposedBy: 'un',
        status: 'pending',
      },
    ],
    proposals: [],
    status: 'negotiating',
    round: 1,
    maxRounds: 5, // Conference must reach agreement within 5 rounds
    deadlineTurn: turn + 3, // 3 turns to reach agreement
  };
}

// ============================================================================
// HISTORICAL PEACE PROPOSALS
// ============================================================================

/**
 * The historical RFK Gambit proposal
 */
export const HISTORICAL_RFK_PROPOSAL: PeaceProposal = {
  id: 'rfk-gambit',
  proposedBy: 'us',
  proposedRound: 2,
  terms: [
    {
      type: 'ceasefire',
      description: 'Immediate cessation of all hostile actions',
      fromNationId: 'us',
      toNationId: 'soviet',
      duration: 9999, // Permanent
      enforceable: true,
      guarantors: ['uk', 'france', 'un'],
      verificationMethod: 'Ongoing UN monitoring',
    },
    {
      type: 'disarmament',
      description: 'Soviet Union removes all nuclear missiles from Cuba',
      fromNationId: 'soviet',
      toNationId: 'us',
      duration: 30, // 30 days for removal
      enforceable: true,
      guarantors: ['un'],
      verificationMethod: 'UN inspection and U-2 surveillance',
    },
    {
      type: 'non-aggression-pact',
      description:
        'United States pledges not to invade Cuba (PUBLIC TERM)',
      fromNationId: 'us',
      toNationId: 'cuba',
      duration: 9999,
      enforceable: true,
      guarantors: ['uk', 'france', 'un'],
      verificationMethod: 'International monitoring',
    },
    {
      type: 'disarmament',
      description:
        'United States removes Jupiter missiles from Turkey within 4-6 months (SECRET TERM - not disclosed publicly)',
      fromNationId: 'us',
      toNationId: 'soviet',
      duration: 180, // 6 months
      enforceable: true,
      guarantors: [], // No guarantors - secret
      verificationMethod: 'Soviet intelligence observation',
    },
  ],
  supporters: [],
  opponents: [],
  abstainers: [],
  status: 'draft',
};

/**
 * Public Turkey trade proposal
 */
export const PUBLIC_TRADE_PROPOSAL: PeaceProposal = {
  id: 'public-trade',
  proposedBy: 'us',
  proposedRound: 2,
  terms: [
    {
      type: 'ceasefire',
      description: 'Immediate cessation of all hostile actions',
      fromNationId: 'us',
      toNationId: 'soviet',
      duration: 9999,
      enforceable: true,
      guarantors: ['uk', 'france', 'un'],
    },
    {
      type: 'disarmament',
      description: 'Soviet Union removes all nuclear missiles from Cuba',
      fromNationId: 'soviet',
      toNationId: 'us',
      duration: 30,
      enforceable: true,
      guarantors: ['un'],
      verificationMethod: 'UN inspection and surveillance',
    },
    {
      type: 'disarmament',
      description:
        'United States removes Jupiter missiles from Turkey (PUBLIC TERM)',
      fromNationId: 'us',
      toNationId: 'soviet',
      duration: 90, // 3 months - faster than secret deal
      enforceable: true,
      guarantors: ['un', 'uk', 'france'],
      verificationMethod: 'International verification',
    },
    {
      type: 'non-aggression-pact',
      description: 'United States pledges not to invade Cuba',
      fromNationId: 'us',
      toNationId: 'cuba',
      duration: 9999,
      enforceable: true,
      guarantors: ['un'],
    },
  ],
  supporters: [],
  opponents: [],
  abstainers: [],
  status: 'draft',
};

/**
 * Soviet maximalist proposal (unlikely to be accepted)
 */
export const SOVIET_MAXIMALIST_PROPOSAL: PeaceProposal = {
  id: 'soviet-maximalist',
  proposedBy: 'soviet',
  proposedRound: 1,
  terms: [
    {
      type: 'disarmament',
      description: 'Soviet missiles remain in Cuba under joint Soviet-Cuban control',
      fromNationId: 'soviet',
      toNationId: 'us',
      duration: 9999,
      enforceable: false,
    },
    {
      type: 'non-aggression-pact',
      description: 'US pledges not to invade Cuba or support regime change',
      fromNationId: 'us',
      toNationId: 'cuba',
      duration: 9999,
      enforceable: true,
      guarantors: ['un', 'warsaw'],
    },
    {
      type: 'disarmament',
      description: 'US removes all missiles from Turkey immediately',
      fromNationId: 'us',
      toNationId: 'soviet',
      duration: 30,
      enforceable: true,
      guarantors: ['un'],
    },
    {
      type: 'territory-exchange',
      description: 'US returns Guantanamo Bay Naval Base to Cuba',
      fromNationId: 'us',
      toNationId: 'cuba',
      territoryIds: ['guantanamo'],
      enforceable: true,
    },
    {
      type: 'sanctions-lift',
      description: 'US lifts all economic sanctions on Cuba',
      fromNationId: 'us',
      toNationId: 'cuba',
      duration: 9999,
      enforceable: true,
    },
  ],
  supporters: ['soviet', 'cuba', 'warsaw'],
  opponents: ['us', 'turkey', 'nato'],
  abstainers: [],
  status: 'presented',
};

/**
 * Compromise proposal from UN mediator
 */
export const UN_COMPROMISE_PROPOSAL: PeaceProposal = {
  id: 'un-compromise',
  proposedBy: 'un',
  proposedRound: 3,
  terms: [
    {
      type: 'ceasefire',
      description: 'Immediate cessation of all hostile actions',
      fromNationId: 'us',
      toNationId: 'soviet',
      duration: 9999,
      enforceable: true,
      guarantors: ['un', 'uk', 'france'],
    },
    {
      type: 'disarmament',
      description: 'Soviet Union removes all offensive nuclear missiles from Cuba',
      fromNationId: 'soviet',
      toNationId: 'us',
      duration: 45,
      enforceable: true,
      guarantors: ['un'],
      verificationMethod: 'UN inspection teams with full access',
    },
    {
      type: 'non-aggression-pact',
      description: 'United States provides formal guarantee not to invade Cuba',
      fromNationId: 'us',
      toNationId: 'cuba',
      duration: 9999,
      enforceable: true,
      guarantors: ['un', 'uk', 'france'],
      verificationMethod: 'UN monitoring',
    },
    {
      type: 'demilitarization',
      description:
        'Cuba and US agree to demilitarized zones: no offensive weapons within 100 miles of each other',
      fromNationId: 'both',
      toNationId: 'both',
      duration: 9999,
      enforceable: true,
      guarantors: ['un'],
      verificationMethod: 'UN patrols',
    },
    {
      type: 'disarmament',
      description:
        'US agrees to phase out obsolete missiles from Turkey (presented as modernization, not concession)',
      fromNationId: 'us',
      toNationId: 'soviet',
      duration: 180,
      enforceable: true,
      guarantors: ['nato', 'turkey'],
      verificationMethod: 'NATO certification, Turkey consents',
    },
  ],
  supporters: ['un', 'uk', 'france'],
  opponents: [],
  abstainers: [],
  status: 'draft',
};

// ============================================================================
// PEACE CONFERENCE EVALUATION
// ============================================================================

/**
 * Evaluate proposal acceptability for each participant
 */
export function evaluateProposalAcceptability(
  proposal: PeaceProposal,
  participant: ConferenceParticipant,
  gameState: any
): {
  acceptability: number; // 0-100
  concerns: string[];
  counterProposals: string[];
} {
  let acceptability = 50; // Start neutral
  const concerns: string[] = [];
  const counterProposals: string[] = [];

  // Evaluate each term against participant's objectives and red lines
  for (const term of proposal.terms) {
    const termEvaluation = evaluateTerm(term, participant, gameState);
    acceptability += termEvaluation.impact;
    concerns.push(...termEvaluation.concerns);
    counterProposals.push(...termEvaluation.counterProposals);
  }

  // Cap at 0-100
  acceptability = Math.max(0, Math.min(100, acceptability));

  return { acceptability, concerns, counterProposals };
}

function evaluateTerm(
  term: PeaceTerm,
  participant: ConferenceParticipant,
  gameState: any
): {
  impact: number;
  concerns: string[];
  counterProposals: string[];
} {
  let impact = 0;
  const concerns: string[] = [];
  const counterProposals: string[] = [];

  // US evaluation
  if (participant.nationId === 'us') {
    switch (term.type) {
      case 'disarmament':
        if (term.description.includes('Soviet missiles') && term.description.includes('Cuba')) {
          impact += 30; // Primary objective
        }
        if (term.description.includes('Turkey')) {
          if (term.description.includes('SECRET') || term.description.includes('modernization')) {
            impact += 10; // Acceptable if face-saving
          } else {
            impact -= 15; // Public removal is costly
            concerns.push('Public removal of Turkey missiles damages NATO credibility');
          }
        }
        break;
      case 'non-aggression-pact':
        if (term.toNationId === 'cuba') {
          impact += 15; // Acceptable cost for missile removal
        }
        break;
      case 'territory-exchange':
        if (term.description.includes('Guantanamo')) {
          impact -= 40; // Unacceptable
          concerns.push('Cannot surrender Guantanamo Bay');
        }
        break;
    }
  }

  // USSR evaluation
  if (participant.nationId === 'soviet') {
    switch (term.type) {
      case 'disarmament':
        if (term.description.includes('Turkey')) {
          impact += 25; // Important objective
        }
        if (term.description.includes('Cuba') && term.fromNationId === 'soviet') {
          impact -= 20; // Costly, needs compensation
          counterProposals.push('Need security guarantee for Cuba');
        }
        break;
      case 'non-aggression-pact':
        if (term.toNationId === 'cuba') {
          impact += 30; // Primary objective
        }
        break;
      case 'guarantee':
        if (term.toNationId === 'cuba') {
          impact += 20;
        }
        break;
    }
  }

  // Cuba evaluation
  if (participant.nationId === 'cuba') {
    switch (term.type) {
      case 'non-aggression-pact':
        if (term.toNationId === 'cuba') {
          impact += 40; // Primary objective
          if (!term.guarantors || term.guarantors.length === 0) {
            concerns.push('Need guarantors to enforce non-invasion pledge');
            impact -= 15;
          }
        }
        break;
      case 'disarmament':
        if (term.description.includes('Soviet missiles') && term.description.includes('Cuba')) {
          // Cuba wants missiles gone but needs security
          if (proposal.terms.some((t) => t.type === 'non-aggression-pact')) {
            impact += 10; // Acceptable if security guaranteed
          } else {
            impact -= 20;
            concerns.push('Cannot agree to missile removal without security guarantee');
          }
        }
        break;
      case 'territory-exchange':
        if (term.description.includes('Guantanamo') && term.toNationId === 'cuba') {
          impact += 50; // Dream outcome
        }
        break;
    }
  }

  // Turkey evaluation
  if (participant.nationId === 'turkey') {
    switch (term.type) {
      case 'disarmament':
        if (term.description.includes('Turkey')) {
          if (term.description.includes('modernization') || term.description.includes('replacement')) {
            impact += 5; // Acceptable if defense maintained
          } else if (term.guarantors?.includes('turkey') && term.guarantors?.includes('nato')) {
            impact += 0; // Neutral if consulted
          } else {
            impact -= 35; // Unacceptable without consultation
            concerns.push('Turkey must be consulted and consent to any changes to our defense');
            counterProposals.push('If Jupiters removed, deploy Polaris submarines or other systems');
          }
        }
        break;
    }
  }

  return { impact, concerns, counterProposals };
}

/**
 * Generate final peace treaty from accepted proposal
 */
export function generatePeaceTreaty(
  proposal: PeaceProposal,
  conferenceId: string,
  turn: number
): PeaceTreaty {
  return {
    id: `treaty-${conferenceId}-${turn}`,
    conferenceId,
    name: 'Agreement on the Settlement of the Cuban Missile Crisis',
    signedTurn: turn,
    signatories: proposal.supporters,
    guarantors: ['un', 'uk', 'france'],
    terms: proposal.terms,
    duration: 9999, // Permanent treaty
    expiryTurn: turn + 9999,
    compliance: {},
    violations: [],
    status: 'active',
  };
}

/**
 * Calculate historical accuracy of peace conference outcome
 */
export function calculateHistoricalAccuracy(treaty: PeaceTreaty): number {
  let accuracy = 100;

  // Historical outcome:
  // 1. Soviet missiles removed from Cuba ✓
  // 2. US non-invasion pledge ✓
  // 3. Turkey missiles removed secretly ✓
  // 4. UN verification attempted but Castro refused ✓
  // 5. Crisis resolved by October 28, 1962 ✓

  const hasPublicCubaTerms = treaty.terms.some(
    (t) => t.type === 'disarmament' && t.description.includes('Cuba')
  );
  if (!hasPublicCubaTerms) accuracy -= 30;

  const hasNonInvasion = treaty.terms.some(
    (t) => t.type === 'non-aggression-pact' && t.toNationId === 'cuba'
  );
  if (!hasNonInvasion) accuracy -= 30;

  const hasTurkeySecret = treaty.terms.some(
    (t) =>
      t.type === 'disarmament' &&
      t.description.includes('Turkey') &&
      (t.description.includes('SECRET') || t.description.includes('modernization'))
  );
  if (hasTurkeySecret) {
    accuracy += 0; // Perfect
  } else {
    const hasTurkeyPublic = treaty.terms.some(
      (t) => t.type === 'disarmament' && t.description.includes('Turkey') && !t.description.includes('SECRET')
    );
    if (hasTurkeyPublic) accuracy -= 15; // Public trade is less accurate
    else accuracy -= 20; // No Turkey deal is inaccurate
  }

  const hasGuantanamo = treaty.terms.some(
    (t) => t.type === 'territory-exchange' && t.description.includes('Guantanamo')
  );
  if (hasGuantanamo) accuracy -= 25; // This didn't happen historically

  return Math.max(0, Math.min(100, accuracy));
}

/**
 * Track treaty compliance over time
 */
export function updateTreatyCompliance(
  treaty: PeaceTreaty,
  nationId: string,
  turn: number,
  gameState: any
): number {
  // Check if nation is fulfilling their treaty obligations
  let compliance = 100;

  for (const term of treaty.terms) {
    if (term.fromNationId === nationId) {
      // Check compliance with this term
      // Implementation would check actual game state
      const termCompliance = checkTermCompliance(term, nationId, turn, gameState);
      compliance = Math.min(compliance, termCompliance);
    }
  }

  treaty.compliance[nationId] = compliance;
  return compliance;
}

function checkTermCompliance(
  term: PeaceTerm,
  nationId: string,
  turn: number,
  gameState: any
): number {
  // Placeholder - would check actual game state
  // For example:
  // - For disarmament: check if missiles have been removed
  // - For non-aggression: check if nation has attacked target
  // - For sanctions-lift: check if sanctions are still in place
  return 100; // Placeholder
}

// ============================================================================
// EXPORTS
// ============================================================================

export const CUBA_CRISIS_PROPOSALS = {
  historical: HISTORICAL_RFK_PROPOSAL,
  publicTrade: PUBLIC_TRADE_PROPOSAL,
  sovietMaximalist: SOVIET_MAXIMALIST_PROPOSAL,
  unCompromise: UN_COMPROMISE_PROPOSAL,
};
