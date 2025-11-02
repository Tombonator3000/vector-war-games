/**
 * Diplomacy Phase 3 Types - Advanced Diplomacy Systems
 *
 * This module defines types for:
 * 1. Diplomatic Currency - Tradeable influence points
 * 2. International Council - Global voting and resolutions
 * 3. Dynamic Incidents - Random diplomatic events and crises
 * 4. Peace Conferences - Multi-party peace negotiations
 * 5. Advanced Espionage - Covert operations affecting diplomacy
 */

import type { Nation } from './game';

// ============================================================================
// DIPLOMATIC CURRENCY SYSTEM
// ============================================================================

/**
 * Diplomatic Influence Points (DIP)
 * A tradeable currency earned through diplomatic actions
 */
export interface DiplomaticInfluence {
  /** Current DIP balance */
  points: number;

  /** Maximum DIP that can be held */
  capacity: number;

  /** DIP earned per turn from various sources */
  perTurnIncome: DIPIncome;

  /** History of DIP transactions */
  history: DIPTransaction[];
}

export interface DIPIncome {
  baseIncome: number;          // Base 5 DIP/turn for all nations
  fromAlliances: number;        // 2 DIP per high-level alliance
  fromCouncilSeat: number;      // 10 DIP/turn if council member
  fromMediation: number;        // Variable based on mediations
  fromPeaceYears: number;       // 1 DIP per 5 consecutive peace turns
  total: number;
}

export interface DIPTransaction {
  turn: number;
  delta: number;
  reason: string;
  withNationId?: string;
  newBalance: number;
}

/** Ways to earn DIP */
export const DIPEarning = {
  BASE_PER_TURN: 7,  // Increased from 5 to make early-game diplomacy more accessible (FASE 3.3)
  HIGH_LEVEL_ALLIANCE: 2,       // Per alliance at level 3+
  COUNCIL_MEMBER: 10,
  SUCCESSFUL_MEDIATION: 15,
  BROKER_PEACE: 20,
  FIVE_PEACE_TURNS: 1,          // Per 5 turns of peace
  RESOLVE_INCIDENT: 10,
  HOST_PEACE_CONFERENCE: 25,
  SUCCESSFUL_COUNCIL_RESOLUTION: 15,
} as const;

/** Ways to spend DIP */
export const DIPCosts = {
  CALL_COUNCIL_VOTE: 30,
  PROPOSE_RESOLUTION: 20,
  VETO_RESOLUTION: 50,          // If you have veto power
  CALL_PEACE_CONFERENCE: 40,
  JOIN_PEACE_CONFERENCE: 10,
  TRADE_FOR_FAVOR: 15,          // Convert 15 DIP to 5 favors with a nation
  INFLUENCE_VOTE: 25,           // Sway undecided voters
  ISSUE_SANCTION: 20,
  LIFT_SANCTION: 15,
  DIPLOMATIC_IMMUNITY: 35,      // Temporary protection from one hostile action
  EMERGENCY_MEDIATION: 30,
} as const;

// ============================================================================
// INTERNATIONAL COUNCIL SYSTEM
// ============================================================================

/** Council membership status */
export type CouncilMembershipType =
  | 'permanent'    // Permanent member with veto power
  | 'elected'      // Elected rotating member
  | 'observer'     // Observer status only
  | 'none';        // Not a member

export interface InternationalCouncil {
  /** Founded turn */
  foundedTurn: number;

  /** Council members */
  permanentMembers: string[];   // Nation IDs with veto power
  electedMembers: ElectedMember[];
  observers: string[];          // Nation IDs

  /** Active resolutions */
  activeResolutions: CouncilResolution[];

  /** Resolution history */
  passedResolutions: CouncilResolution[];
  failedResolutions: CouncilResolution[];

  /** Pending votes */
  activeVotes: CouncilVote[];

  /** Council meetings schedule */
  nextMeetingTurn: number;
  meetingFrequency: number;     // Meetings every X turns

  /** Council reputation by nation */
  legitimacy: number;           // 0-100, affects resolution effectiveness
}

export interface ElectedMember {
  nationId: string;
  electedTurn: number;
  termLength: number;           // Usually 20 turns
  expiryTurn: number;
}

/** Types of council resolutions */
export type ResolutionType =
  | 'sanction'              // Economic sanctions on a nation
  | 'embargo'               // Full trade embargo
  | 'peacekeeping'          // Deploy peacekeepers to region
  | 'no-fly-zone'           // Restrict military in region
  | 'arms-limitation'       // Limit weapon development
  | 'humanitarian-aid'      // Coordinate aid to suffering nation
  | 'condemn-action'        // Formal condemnation
  | 'recognize-claim'       // Recognize territorial claim as legitimate
  | 'ceasefire'             // Demand ceasefire in ongoing war
  | 'nuclear-ban'           // Ban nuclear weapons usage
  | 'environmental'         // Environmental protection measures
  | 'expand-council';       // Add new permanent/elected members

export interface CouncilResolution {
  id: string;
  type: ResolutionType;
  title: string;
  description: string;

  /** Who proposed it */
  proposedBy: string;           // Nation ID
  proposedTurn: number;

  /** Target of the resolution (if applicable) */
  targetNationId?: string;
  targetRegion?: string;

  /** Resolution parameters */
  parameters: ResolutionParameters;

  /** Voting results */
  votingResults?: VotingResults;

  /** Status */
  status: 'proposed' | 'voting' | 'passed' | 'failed' | 'vetoed' | 'implemented' | 'expired';

  /** If passed, when does it expire? */
  expiryTurn?: number;

  /** Effectiveness if implemented */
  effectiveness: number;        // 0-100

  /** Compliance by nations */
  compliance: Record<string, number>; // Nation ID -> compliance level (0-100)
}

export interface ResolutionParameters {
  duration?: number;            // How long the resolution lasts
  severity?: number;            // How strict the measure is
  targetIds?: string[];         // Multiple targets if needed
  conditions?: string[];        // Conditions for resolution to end
  rewards?: string[];           // Rewards for compliance
  penalties?: string[];         // Penalties for non-compliance
}

export interface VotingResults {
  votesFor: string[];           // Nation IDs
  votesAgainst: string[];       // Nation IDs
  abstentions: string[];        // Nation IDs
  vetoes: string[];             // Nation IDs that vetoed
  passed: boolean;
  finalizedTurn: number;
}

export interface CouncilVote {
  resolutionId: string;
  startTurn: number;
  endTurn: number;
  currentVotes: VotingResults;
  notYetVoted: string[];        // Nation IDs that haven't voted
}

/** Council voting power modifiers */
export const CouncilVotingPower = {
  PERMANENT_MEMBER: 2.0,        // 2x voting weight
  ELECTED_MEMBER: 1.5,          // 1.5x voting weight
  OBSERVER: 1.0,                // Normal voting weight
  HIGH_LEGITIMACY_BONUS: 0.2,   // If nation has high legitimacy globally
} as const;

// ============================================================================
// DYNAMIC INCIDENTS SYSTEM
// ============================================================================

/** Types of diplomatic incidents */
export type IncidentType =
  | 'border-skirmish'       // Small military conflict on border
  | 'spy-caught'            // Espionage discovered
  | 'diplomatic-insult'     // Public insult or humiliation
  | 'trade-dispute'         // Economic disagreement
  | 'refugee-crisis'        // Mass migration causing tension
  | 'territory-dispute'     // Competing claims
  | 'assassination-attempt' // Failed assassination of leader
  | 'cyberattack'           // Major cyber incident
  | 'environmental-damage'  // Pollution/disaster affecting neighbor
  | 'cultural-offense'      // Cultural/religious incident
  | 'arms-buildup'          // Threatening military buildup
  | 'false-flag'            // Suspected false flag operation
  | 'hostage-crisis'        // Citizens held hostage
  | 'maritime-incident'     // Naval confrontation
  | 'airspace-violation';   // Aircraft intrusion

export interface DiplomaticIncident {
  id: string;
  type: IncidentType;
  title: string;
  description: string;

  /** Nations involved */
  primaryNationId: string;      // Nation that caused/initiated incident
  targetNationId: string;       // Nation that was affected
  involvedNations: string[];    // Other affected parties

  /** When it occurred */
  occurredTurn: number;

  /** Severity and impact */
  severity: 'minor' | 'moderate' | 'serious' | 'severe' | 'catastrophic';
  relationshipImpact: number;   // -50 to +10 (usually negative)
  trustImpact: number;          // -30 to 0

  /** Can it be resolved? */
  resolvable: boolean;
  resolutionOptions: IncidentResolution[];

  /** Status */
  status: 'active' | 'escalating' | 'de-escalating' | 'resolved' | 'led-to-war';

  /** If escalating, countdown to war */
  escalationLevel: number;      // 0-100, war at 100
  escalationRate: number;       // How fast it escalates per turn

  /** Resolution deadline */
  deadlineTurn?: number;

  /** Consequences if unresolved */
  consequences: string[];
}

export interface IncidentResolution {
  id: string;
  type: 'apologize' | 'compensate' | 'concede' | 'negotiate' | 'threaten' | 'ignore' | 'mediation';
  name: string;
  description: string;

  /** Costs */
  dipCost?: number;
  favorCost?: number;
  economicCost?: number;        // Production points
  territoryCost?: string[];     // Territory IDs

  /** Effects if chosen */
  relationshipChange: number;
  trustChange: number;
  escalationChange: number;     // Reduces or increases escalation

  /** Likelihood other nation accepts */
  acceptanceChance: number;     // 0-100

  /** Requirements */
  requiresCouncilApproval?: boolean;
  minimumTrust?: number;
  minimumDIP?: number;
}

/** Incident probability modifiers */
export const IncidentProbability = {
  BASE_CHANCE_PER_TURN: 5,      // 5% base chance each turn
  LOW_RELATIONSHIP_MULTIPLIER: 2.0,    // 2x more likely with bad relations
  BORDER_ADJACENCY_MULTIPLIER: 1.5,    // 1.5x more likely with neighbors
  ACTIVE_GRIEVANCE_MULTIPLIER: 1.3,    // 1.3x more likely if grievances exist
  LOW_TRUST_MULTIPLIER: 1.4,           // 1.4x more likely with low trust
} as const;

// ============================================================================
// PEACE CONFERENCE SYSTEM
// ============================================================================

/** Multi-party peace negotiations */
export interface PeaceConference {
  id: string;
  name: string;

  /** Who called the conference */
  convenedBy: string;           // Nation ID or 'council'
  convenedTurn: number;

  /** Participants */
  participants: ConferenceParticipant[];

  /** What war(s) is this about? */
  warIds: string[];             // Reference to wars being resolved

  /** Agenda items */
  agenda: ConferenceAgendaItem[];

  /** Proposals on the table */
  proposals: PeaceProposal[];

  /** Status */
  status: 'assembling' | 'negotiating' | 'voting' | 'concluded' | 'collapsed';

  /** Conference progress */
  round: number;
  maxRounds: number;            // Conference ends after this many rounds

  /** Final agreement if reached */
  finalAgreement?: PeaceTreaty;

  /** Deadline */
  deadlineTurn: number;
}

export interface ConferenceParticipant {
  nationId: string;
  role: 'belligerent' | 'mediator' | 'observer' | 'guarantor';
  votingPower: number;          // Based on role and influence

  /** Participant's objectives */
  primaryObjectives: string[];
  acceptableOutcomes: string[];
  redLines: string[];           // Deal-breakers

  /** Participation */
  attended: boolean;
  walkoutRisk: number;          // 0-100, chance they leave
}

export interface ConferenceAgendaItem {
  id: string;
  topic: string;
  description: string;
  priority: 'critical' | 'important' | 'desirable' | 'optional';
  proposedBy: string;           // Nation ID
  status: 'pending' | 'discussing' | 'agreed' | 'rejected' | 'deferred';
}

export interface PeaceProposal {
  id: string;
  proposedBy: string;           // Nation ID
  proposedRound: number;

  /** Proposal terms */
  terms: PeaceTerm[];

  /** Support */
  supporters: string[];         // Nation IDs
  opponents: string[];          // Nation IDs
  abstainers: string[];         // Nation IDs

  /** Status */
  status: 'draft' | 'presented' | 'voting' | 'accepted' | 'rejected' | 'amended';

  /** If amended, link to original/new version */
  amendedFrom?: string;
  amendedTo?: string;
}

export interface PeaceTerm {
  type: 'ceasefire' | 'territory-exchange' | 'reparations' | 'disarmament' |
        'demilitarization' | 'guarantee' | 'prisoner-exchange' | 'border-adjustment' |
        'sanctions-lift' | 'alliance-dissolution' | 'non-aggression-pact';

  description: string;

  /** Who gives/receives */
  fromNationId?: string;
  toNationId?: string;

  /** Specifics */
  territoryIds?: string[];
  economicValue?: number;
  duration?: number;

  /** Verification */
  enforceable: boolean;
  guarantors?: string[];        // Nations that guarantee this term
  verificationMethod?: string;
}

export interface PeaceTreaty {
  id: string;
  conferenceId: string;

  /** Treaty details */
  name: string;
  signedTurn: number;
  signatories: string[];        // Nation IDs
  guarantors: string[];         // Nation IDs that guarantee enforcement

  /** Terms agreed upon */
  terms: PeaceTerm[];

  /** Treaty duration */
  duration: number;             // Turns until expires
  expiryTurn: number;

  /** Compliance tracking */
  compliance: Record<string, number>; // Nation ID -> compliance (0-100)

  /** Violations */
  violations: TreatyViolation[];

  /** Status */
  status: 'active' | 'fulfilled' | 'violated' | 'expired' | 'nullified';
}

export interface TreatyViolation {
  violatorId: string;
  termViolated: number;         // Index in terms array
  violationTurn: number;
  description: string;
  severity: 'minor' | 'moderate' | 'major' | 'complete-breach';
}

// ============================================================================
// ADVANCED ESPIONAGE SYSTEM
// ============================================================================

/** Covert operations affecting diplomacy */
export type CovertOperationType =
  | 'false-flag-attack'     // Frame another nation for attack
  | 'smear-campaign'        // Damage nation's reputation
  | 'sabotage-talks'        // Disrupt peace negotiations
  | 'influence-election'    // Affect democratic process
  | 'fabricate-evidence'    // Create false intelligence
  | 'character-assassination' // Target specific leader
  | 'diplomatic-theft'      // Steal diplomatic communications
  | 'bribe-officials'       // Corrupt foreign diplomats
  | 'create-incident'       // Manufacture diplomatic crisis
  | 'leak-classified'       // Expose secrets to public
  | 'coup-support'          // Back regime change
  | 'propaganda-campaign';  // Mass disinformation

export interface CovertOperation {
  id: string;
  type: CovertOperationType;
  name: string;
  description: string;

  /** Who is running it */
  operatorId: string;           // Nation conducting operation

  /** Target */
  targetNationId: string;
  secondaryTargets?: string[];  // Other affected nations

  /** Operation details */
  plannedTurn: number;
  executionTurn: number;

  /** Resource requirements */
  intelCost: number;
  dipCost: number;
  economicCost: number;

  /** Success factors */
  baseDifficulty: number;       // 0-100
  detectionRisk: number;        // 0-100, chance of being caught
  blowbackRisk: number;         // 0-100, chance of backfiring

  /** Execution */
  status: 'planning' | 'active' | 'succeeded' | 'failed' | 'exposed' | 'aborted';

  /** If successful */
  effects: CovertOperationEffect[];

  /** If exposed */
  exposedTurn?: number;
  exposedBy?: string;           // Nation that exposed it
  evidence: number;             // 0-100, how much proof exists
}

export interface CovertOperationEffect {
  type: 'relationship' | 'trust' | 'incident' | 'grievance' | 'public-opinion' |
        'instability' | 'reputation' | 'alliance-strain' | 'council-vote';

  targetNationId: string;
  value: number;
  duration?: number;            // If temporary effect
  description: string;
}

/** Espionage detection and counterintelligence */
export interface CounterIntelligence {
  nationId: string;

  /** Detection capabilities */
  detectionLevel: number;       // 0-100, ability to detect operations

  /** Active investigations */
  activeInvestigations: Investigation[];

  /** Known operations */
  exposedOperations: string[];  // CovertOperation IDs

  /** Counterintelligence assets */
  assets: number;               // Points to spend on detection/countermeasures
}

export interface Investigation {
  id: string;
  targetNationId: string;       // Suspected operator
  focusArea: CovertOperationType | 'general';

  progress: number;             // 0-100
  evidenceGathered: number;     // 0-100

  startedTurn: number;
  estimatedCompletion: number;

  /** If completed */
  findings?: InvestigationFindings;
}

export interface InvestigationFindings {
  operationsDiscovered: string[]; // CovertOperation IDs
  certainty: number;            // 0-100, how sure are we
  evidence: string[];           // Evidence descriptions
  recommendedResponse: string[];
}

/** Espionage costs and effects */
export const EspionageCosts = {
  FALSE_FLAG_ATTACK: { intel: 50, dip: 40, economic: 20 },
  SMEAR_CAMPAIGN: { intel: 30, dip: 25, economic: 15 },
  SABOTAGE_TALKS: { intel: 40, dip: 30, economic: 10 },
  INFLUENCE_ELECTION: { intel: 60, dip: 35, economic: 25 },
  FABRICATE_EVIDENCE: { intel: 45, dip: 20, economic: 15 },
  CHARACTER_ASSASSINATION: { intel: 35, dip: 30, economic: 10 },
  DIPLOMATIC_THEFT: { intel: 40, dip: 15, economic: 5 },
  BRIBE_OFFICIALS: { intel: 25, dip: 20, economic: 30 },
  CREATE_INCIDENT: { intel: 35, dip: 25, economic: 15 },
  LEAK_CLASSIFIED: { intel: 30, dip: 10, economic: 5 },
  COUP_SUPPORT: { intel: 80, dip: 50, economic: 40 },
  PROPAGANDA_CAMPAIGN: { intel: 40, dip: 30, economic: 20 },
} as const;

// ============================================================================
// PHASE 3 COMPLETE STATE
// ============================================================================

/** Complete Phase 3 diplomacy state */
export interface DiplomacyPhase3State {
  /** Diplomatic currency system */
  diplomaticInfluence: Record<string, DiplomaticInfluence>; // Nation ID -> DIP state

  /** International Council */
  internationalCouncil: InternationalCouncil | null;

  /** Active incidents */
  activeIncidents: DiplomaticIncident[];

  /** Incident history */
  resolvedIncidents: DiplomaticIncident[];

  /** Active peace conferences */
  peacePeaceConferences: PeaceConference[];

  /** Concluded conferences */
  concludedConferences: PeaceConference[];

  /** Active peace treaties from conferences */
  peaceTreaties: PeaceTreaty[];

  /** Covert operations */
  covertOperations: CovertOperation[];

  /** Counter-intelligence */
  counterIntelligence: Record<string, CounterIntelligence>; // Nation ID -> CI state

  /** System activation */
  phase3Enabled: boolean;
  activatedTurn: number;
}

/**
 * Initialize Phase 3 diplomacy state
 */
export function initializeDiplomacyPhase3State(currentTurn: number = 0): DiplomacyPhase3State {
  return {
    diplomaticInfluence: {},
    internationalCouncil: null,
    activeIncidents: [],
    resolvedIncidents: [],
    peacePeaceConferences: [],
    concludedConferences: [],
    peaceTreaties: [],
    covertOperations: [],
    counterIntelligence: {},
    phase3Enabled: false,
    activatedTurn: currentTurn,
  };
}

/**
 * Initialize diplomatic influence for a nation
 */
export function initializeNationDiplomaticInfluence(): DiplomaticInfluence {
  return {
    points: 75,  // Starting DIP (increased from 50 to enable early-game diplomacy - FASE 3.3)
    capacity: 200,
    perTurnIncome: {
      baseIncome: DIPEarning.BASE_PER_TURN,
      fromAlliances: 0,
      fromCouncilSeat: 0,
      fromMediation: 0,
      fromPeaceYears: 0,
      total: DIPEarning.BASE_PER_TURN,
    },
    history: [],
  };
}

/**
 * Initialize counter-intelligence for a nation
 */
export function initializeCounterIntelligence(nationId: string): CounterIntelligence {
  return {
    nationId,
    detectionLevel: 30,  // Base detection
    activeInvestigations: [],
    exposedOperations: [],
    assets: 10,  // Starting CI assets
  };
}
