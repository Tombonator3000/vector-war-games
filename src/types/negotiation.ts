/**
 * Interactive Negotiation System Types
 * Extends the basic diplomacy system with multi-item negotiations,
 * counter-offers, AI proactive diplomacy, and leader personality agendas.
 *
 * Inspired by Civilization's negotiation system while building on
 * Vector War Games' existing trust/favor/grievance mechanics.
 */

import type { Nation, GameState } from './game';
import type { Grievance } from './grievancesAndClaims';
import type { SpecializedAlliance } from './specializedAlliances';

// ============================================================================
// Negotiable Items
// ============================================================================

/**
 * Types of items that can be offered or requested in a negotiation
 */
export type NegotiableItemType =
  | 'gold'                    // Lump sum of gold
  | 'intel'                   // Intelligence points
  | 'production'              // Production points
  | 'alliance'                // Alliance agreement (specialized or basic)
  | 'treaty'                  // Treaty (truce, non-aggression, etc.)
  | 'promise'                 // Diplomatic promise
  | 'favor-exchange'          // Exchange of favors
  | 'sanction-lift'           // Lift economic sanctions
  | 'join-war'                // Join war against target
  | 'share-tech'              // Share specific technology
  | 'open-borders'            // Open borders agreement
  | 'grievance-apology'       // Apologize for specific grievance
  | 'resource-share'          // Share resources over time
  | 'military-support'        // Provide military assistance
  | 'trade-agreement';        // Ongoing trade agreement

/**
 * A single negotiable item that can be part of a deal
 */
export interface NegotiableItem {
  type: NegotiableItemType;
  amount?: number;              // For resources (gold, intel, production)
  duration?: number;            // For time-limited agreements (in turns)
  targetId?: string;            // For join-war (target nation), share-tech (recipient)
  subtype?: string;             // Alliance type, treaty type, promise type, etc.
  grievanceId?: string;         // For grievance-apology
  techId?: string;              // For share-tech
  metadata?: Record<string, any>; // Additional context-specific data
  description?: string;         // Human-readable description
}

// ============================================================================
// Negotiation State
// ============================================================================

/**
 * Status of a negotiation
 */
export type NegotiationStatus =
  | 'active'      // Currently being negotiated
  | 'accepted'    // Deal accepted and applied
  | 'rejected'    // Deal rejected
  | 'expired'     // Negotiation expired without resolution
  | 'withdrawn';  // Initiator withdrew the offer

/**
 * Complete state of an ongoing negotiation
 */
export interface NegotiationState {
  id: string;                           // Unique negotiation ID
  initiatorId: string;                  // Nation that started negotiation
  respondentId: string;                 // Nation responding to negotiation
  offerItems: NegotiableItem[];         // Items initiator offers
  requestItems: NegotiableItem[];       // Items initiator requests
  currentRound: number;                 // Current round of negotiation
  maxRounds: number;                    // Maximum rounds before expiration
  status: NegotiationStatus;            // Current status
  aiEvaluation?: AIEvaluation;          // AI's evaluation (if respondent is AI)
  history: NegotiationRound[];          // History of negotiation rounds
  createdTurn: number;                  // Turn when negotiation started
  expiresAtTurn?: number;               // Turn when negotiation expires
  purpose?: NegotiationPurpose;         // Purpose if AI-initiated
}

/**
 * A single round in the negotiation history
 */
export interface NegotiationRound {
  round: number;                        // Round number
  offerItems: NegotiableItem[];         // Items offered this round
  requestItems: NegotiableItem[];       // Items requested this round
  response: NegotiationResponse;        // Response type
  feedback?: string;                    // AI feedback message
  evaluation?: AIEvaluation;            // AI evaluation for this round
  timestamp: number;                    // Turn when round occurred
}

/**
 * Type of response to a negotiation round
 */
export type NegotiationResponse =
  | 'pending'         // Awaiting response
  | 'counter-offer'   // AI made counter-offer
  | 'accepted'        // Deal accepted
  | 'rejected';       // Deal rejected

// ============================================================================
// AI Evaluation
// ============================================================================

/**
 * AI's evaluation of a negotiation deal
 */
export interface AIEvaluation {
  offerValue: number;                   // Total value of items offered to AI
  requestValue: number;                 // Total value of items AI must give
  netValue: number;                     // offerValue - requestValue (+ = good for AI)
  relationshipModifier: number;         // Modifier based on relationship
  trustModifier: number;                // Modifier based on trust
  favorModifier: number;                // Modifier based on favors
  personalityBonus: number;             // Personality-specific modifier
  agendaModifier: number;               // Modifier based on agendas
  strategicValue: number;               // Context-dependent strategic value
  grievancePenalty: number;             // Penalty for active grievances
  randomFactor: number;                 // Random variation
  finalScore: number;                   // Final evaluation score
  acceptanceProbability: number;        // Chance of acceptance (0-100%)
  feedback: string;                     // AI feedback message
  counterOffer?: CounterOffer;          // Counter-offer if applicable
  rejectionReasons?: string[];          // Specific reasons for rejection
}

/**
 * AI-generated counter-offer
 */
export interface CounterOffer {
  offerItems: NegotiableItem[];         // Modified offer
  requestItems: NegotiableItem[];       // Modified request
  explanation: string;                  // Explanation of changes
  changes: CounterOfferChange[];        // List of specific changes made
}

/**
 * A specific change made in a counter-offer
 */
export interface CounterOfferChange {
  type: 'add' | 'remove' | 'modify';
  side: 'offer' | 'request';
  item: NegotiableItem;
  reason: string;
}

// ============================================================================
// Leader Contact & Personality
// ============================================================================

/**
 * State for the Leader Contact interface
 */
export interface LeaderContactState {
  leaderId: string;                     // ID of the leader/nation
  playerNationId: string;               // Player's nation ID
  mood: LeaderMood;                     // Current mood towards player
  visibleInfo: VisibleLeaderInfo;       // Information visible to player
  availableActions: DiplomaticAction[]; // Actions player can take
  activeNegotiation?: NegotiationState; // Active negotiation if any
}

/**
 * Leader's mood based on relationship level
 */
export type LeaderMood =
  | 'hostile'      // Relationship < -50
  | 'unfriendly'   // Relationship -50 to -25
  | 'cautious'     // Relationship -24 to 0
  | 'neutral'      // Relationship 0 to 24
  | 'friendly'     // Relationship 25 to 49
  | 'cordial'      // Relationship 50 to 74
  | 'allied';      // Relationship 75+

/**
 * Information about a leader visible to the player
 */
export interface VisibleLeaderInfo {
  name: string;                         // Leader name
  nation: string;                       // Nation name
  personality: string;                  // AI personality type
  knownAgendas: Agenda[];               // Revealed agendas
  relationship: number;                 // Relationship score (-100 to +100)
  trust: number;                        // Trust level (0-100)
  favors: number;                       // Favor balance (-100 to +100)
  activeAlliances: SpecializedAlliance[]; // Active alliances
  activeTreaties: string[];             // Active treaty types
  grievances: Grievance[];              // Active grievances
  recentActions: DiplomaticEvent[];     // Recent diplomatic events
  firstContactTurn?: number;            // When first contact was made
}

/**
 * Leader agenda (personality trait)
 */
export interface Agenda {
  id: string;                           // Unique agenda ID
  type: 'primary' | 'hidden' | 'situational'; // Agenda type
  name: string;                         // Display name
  description: string;                  // Description of the agenda
  isRevealed: boolean;                  // Whether player knows about it
  modifiers: AgendaModifier[];          // Relationship modifiers
  checkCondition?: (player: Nation, ai: Nation, gameState: GameState) => boolean;
}

/**
 * Relationship modifier based on agenda
 */
export interface AgendaModifier {
  condition: string;                    // Description of condition
  effect: number;                       // Relationship modifier
  description: string;                  // Player-visible description
  evaluationBonus?: number;             // Bonus to negotiation evaluation
}

/**
 * Diplomatic event (for history timeline)
 */
export interface DiplomaticEvent {
  turn: number;                         // Turn when event occurred
  type: DiplomaticEventType;            // Type of event
  description: string;                  // Event description
  relationshipChange?: number;          // Change in relationship
  trustChange?: number;                 // Change in trust
  favorChange?: number;                 // Change in favors
}

/**
 * Types of diplomatic events
 */
export type DiplomaticEventType =
  | 'alliance-formed'
  | 'alliance-broken'
  | 'treaty-signed'
  | 'treaty-broken'
  | 'promise-made'
  | 'promise-kept'
  | 'promise-broken'
  | 'aid-sent'
  | 'aid-received'
  | 'grievance-created'
  | 'grievance-resolved'
  | 'war-declared'
  | 'peace-signed'
  | 'negotiation-successful'
  | 'negotiation-failed'
  | 'contact-established';

/**
 * Diplomatic action available in Leader Contact interface
 */
export interface DiplomaticAction {
  id: string;                           // Action ID
  label: string;                        // Display label
  type: DiplomaticActionType;           // Type of action
  enabled: boolean;                     // Whether action is available
  disabledReason?: string;              // Reason if disabled
  cost?: ResourceCost;                  // Cost to perform action
}

/**
 * Types of diplomatic actions
 */
export type DiplomaticActionType =
  | 'propose-deal'      // Start new negotiation
  | 'make-request'      // Make simple request (uses favors)
  | 'discuss'           // Discuss relationship
  | 'accuse'            // Confront about grievance
  | 'apologize'         // Apologize for action
  | 'view-history';     // View interaction history

/**
 * Resource cost for an action
 */
export interface ResourceCost {
  gold?: number;
  intel?: number;
  production?: number;
  favors?: number;
  diplomaticInfluence?: number;
}

// ============================================================================
// AI Proactive Diplomacy
// ============================================================================

/**
 * AI-initiated negotiation
 */
export interface AIInitiatedNegotiation {
  aiNationId: string;                   // AI nation initiating
  targetNationId: string;               // Target nation (usually player)
  purpose: NegotiationPurpose;          // Purpose of negotiation
  proposedDeal: NegotiationState;       // Proposed negotiation
  message: string;                      // Diplomatic message
  urgency: NegotiationUrgency;          // How urgent/important
  expiresAtTurn: number;                // When offer expires
  createdTurn: number;                  // When offer was made
}

/**
 * Purpose of an AI-initiated negotiation
 */
export type NegotiationPurpose =
  | 'request-help'          // AI needs player assistance
  | 'offer-alliance'        // AI sees mutual benefit in alliance
  | 'reconciliation'        // AI wants to repair relationship
  | 'demand-compensation'   // AI wants payback for grievance
  | 'warning'               // AI gives ultimatum about behavior
  | 'peace-offer'           // AI wants to end war
  | 'trade-opportunity'     // AI has resources to trade
  | 'mutual-defense'        // AI proposes mutual defense pact
  | 'joint-venture';        // AI proposes cooperation

/**
 * Urgency level of AI negotiation
 */
export type NegotiationUrgency =
  | 'low'       // Can wait, no rush
  | 'medium'    // Should respond soon
  | 'high'      // Urgent, respond quickly
  | 'critical'; // Extremely urgent, immediate response needed

// ============================================================================
// Validation & Utility Types
// ============================================================================

/**
 * Result of negotiation validation
 */
export interface ValidationResult {
  valid: boolean;                       // Whether negotiation is valid
  reason?: string;                      // Reason if invalid
  errors?: ValidationError[];           // Specific validation errors
}

/**
 * A specific validation error
 */
export interface ValidationError {
  field: string;                        // Field that failed validation
  message: string;                      // Error message
  severity: 'error' | 'warning';        // Severity level
}

/**
 * Item value calculation context
 */
export interface ItemValueContext {
  evaluatorNation: Nation;              // Nation evaluating the item
  otherNation: Nation;                  // Other party in negotiation
  allNations: Nation[];                 // All nations in game
  currentTurn: number;                  // Current game turn
  relationship: number;                 // Relationship between parties
  trust: number;                        // Trust level
  threats: Record<string, number>;      // Threat levels
  gameState: GameState;                 // Full game state
}

/**
 * Configuration for counter-offer generation
 */
export interface CounterOfferConfig {
  maxChanges: number;                   // Maximum changes to make
  preferAddToRequest: boolean;          // Prefer asking for more vs offering less
  aggressiveness: number;               // How aggressive counter-offer is (0-1)
  mustImprove: boolean;                 // Counter must improve deal for AI
}

// ============================================================================
// Exports
// ============================================================================

export type {
  // Re-export commonly used types from other modules
  Nation,
  Grievance,
  SpecializedAlliance,
};
