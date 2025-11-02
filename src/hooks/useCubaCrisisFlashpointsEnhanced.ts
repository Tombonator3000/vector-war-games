/**
 * Enhanced Cuban Missile Crisis Flashpoints
 *
 * Integrates Phase 1-3 Diplomacy Systems:
 * - Trust and Favors
 * - Promises (public and private)
 * - Grievances and Claims
 * - Diplomatic Currency (DIP) spending
 * - International Council resolutions
 * - Diplomatic Incidents
 * - Multi-party dynamics (Cuba, Turkey, NATO, etc.)
 */

import type { FlashpointEvent, FlashpointOption } from './useFlashpoints';
import type { DiplomaticPromise, PromiseTerms, PromiseType } from '@/types/trustAndFavors';
import type { Grievance, Claim, GrievanceType, GrievanceSeverity } from '@/types/grievancesAndClaims';
import type { DIPCosts } from '@/types/diplomacyPhase3';
import type { Nation } from '@/types/game';
import {
  modifyTrust,
  modifyFavors,
  createPromise as createDiplomaticPromise,
} from '@/lib/trustAndFavorsUtils';
import { modifyRelationship } from '@/lib/relationshipUtils';
import {
  createGrievance as registerGrievance,
  resolveGrievance as resolveNationGrievance,
} from '@/lib/grievancesAndClaimsUtils';
import { earnDIP, spendDIP, getDIP } from '@/lib/diplomaticCurrencyUtils';

type EnhancedGameState = {
  nations?: Nation[];
  playerNationId?: string;
  playerId?: string;
  playerNation?: Nation;
  player?: Nation;
  getPlayerNationId?: () => string | undefined;
  turn?: number;
  currentTurn?: number;
  state?: { turn?: number };
  timeline?: { turn?: number };
  nationsById?: Record<string, Nation>;
  [key: string]: unknown;
};

type ExtendedPromiseTerms = PromiseTerms & {
  description?: string;
  isPublic?: boolean;
};

// ============================================================================
// ENHANCED FLASHPOINT OPTIONS WITH DIPLOMACY INTEGRATION
// ============================================================================

/**
 * Extended flashpoint option with diplomacy costs and effects
 */
export interface EnhancedFlashpointOption extends FlashpointOption {
  /** Diplomatic costs */
  costs?: {
    dip?: number; // Diplomatic Influence Points
    favor?: number; // Favor points with target nation
    trust?: number; // Minimum trust required
    councilVote?: boolean; // Requires council vote/approval
  };

  /** Diplomatic effects on success */
  diplomaticEffects?: {
    trustChange?: Record<string, number>; // NationID -> trust delta
    favorChange?: Record<string, number>; // NationID -> favor delta
    relationshipChange?: Record<string, number>; // NationID -> relationship delta
    createPromise?: Partial<DiplomaticPromise>; // Create new promise
    resolveGrievance?: string[]; // Grievance IDs to resolve
    createGrievance?: Partial<Grievance>; // Create new grievance
    createClaim?: Partial<Claim>; // Create new claim
    allianceImpact?: Record<string, number>; // Alliance level changes
    councilLegitimacy?: number; // Change to council legitimacy
    dipReward?: number; // DIP earned
  };

  /** Diplomatic effects on failure */
  diplomaticFailureEffects?: {
    trustChange?: Record<string, number>;
    favorChange?: Record<string, number>;
    relationshipChange?: Record<string, number>;
    createGrievance?: Partial<Grievance>;
    breakPromise?: string[]; // Promise IDs broken
    allianceImpact?: Record<string, number>;
    dipLoss?: number;
  };

  /** Multi-party considerations */
  thirdPartyReactions?: {
    nationId: string;
    support: boolean; // Does this nation support this choice?
    impact: number; // -100 to +100 relationship impact
    narrative?: string; // Reaction narrative
  }[];
}

// ============================================================================
// TURN 1: EXCOMM BRIEFING - ENHANCED
// ============================================================================

export const ENHANCED_EXCOMM_BRIEFING: FlashpointEvent = {
  id: 'excomm-enhanced-1',
  title: 'EXCOMM BRIEFING: Soviet Missiles in Cuba',
  description:
    'October 16, 1962: CIA photo interpreters have identified medium-range ballistic missile sites under construction in Cuba. These SS-4 Sandal missiles can strike Washington, New York, and most of the Eastern Seaboard with nuclear warheads. The Joint Chiefs recommend immediate air strikes. Secretary McNamara suggests a naval blockade. Ambassador Stevenson urges diplomatic channels. The world must not know how close we are to war.\n\n💰 DIP Available: Check your diplomatic influence points\n🤝 Current USSR Trust: 25 (Untrustworthy)\n⚖️ Existing Grievance: Soviet missile deployment in Cuba',
  category: 'rogue',
  severity: 'critical',
  timeLimit: 90,
  triggeredAt: Date.now(),
  options: [
    {
      id: 'naval_quarantine',
      text: 'Naval Quarantine (McNamara Plan) [20 DIP]',
      description:
        'Establish a "quarantine" zone around Cuba. Ring the island with destroyers. Buy time for diplomacy while showing resolve. Costs 20 DIP for international coordination.',
      advisorSupport: ['military', 'diplomatic'],
      advisorOppose: [],
      outcome: {
        probability: 0.7,
        success: {
          quarantineEstablished: true,
          defcon: 2,
          morale: +8,
          diplomacy: +5,
        },
        failure: {
          sovietShipsBreakthrough: true,
          defcon: 1,
          morale: -15,
        },
      },
      successNarrative:
        'The quarantine line holds. Soviet freighters stop dead in the water. Khrushchev blinks - for now. You\'ve bought time. Your trust with USSR increases slightly for showing restraint instead of attacking. NATO allies support your measured response.',
      failureNarrative:
        'Soviet freighters plow through the quarantine line. A destroyer is rammed. Gunfire erupts. DEFCON 1 is declared as both sides prepare for nuclear exchange. Trust with USSR collapses.',
      // ENHANCED DIPLOMACY INTEGRATION
      costs: {
        dip: 20, // Costs DIP to coordinate international response
        councilVote: false,
      },
      diplomaticEffects: {
        trustChange: {
          soviet: 5, // Shows restraint vs immediate attack
          uk: 8,
          france: 6,
          turkey: 5,
        },
        favorChange: {
          uk: 2, // NATO allies appreciate consultation
          turkey: 2,
        },
        relationshipChange: {
          soviet: -10, // Still hostile action, but not attack
          cuba: -15, // Cuba sees this as aggression
        },
        dipReward: 15, // Gain DIP for successful crisis management
        councilLegitimacy: 5, // Strengthens UN if you're working within international norms
      },
      diplomaticFailureEffects: {
        trustChange: {
          soviet: -15,
          uk: -5,
          nato: -8,
        },
        relationshipChange: {
          soviet: -30,
          cuba: -25,
        },
        createGrievance: {
          type: 'surprise-attack',
          severity: 'severe',
          againstNationId: 'us',
          description: 'US naval forces attacked Soviet ships in international waters',
        },
        dipLoss: 20,
      },
      thirdPartyReactions: [
        {
          nationId: 'uk',
          support: true,
          impact: 8,
          narrative: 'Prime Minister Macmillan publicly supports the quarantine as a measured response.',
        },
        {
          nationId: 'france',
          support: true,
          impact: 6,
          narrative: 'De Gaulle approves: "It is exactly what I would have done."',
        },
        {
          nationId: 'turkey',
          support: true,
          impact: 5,
          narrative: 'Turkey stands ready to support NATO action.',
        },
        {
          nationId: 'cuba',
          support: false,
          impact: -15,
          narrative: 'Castro denounces the "illegal blockade" as an act of war.',
        },
      ],
    } as EnhancedFlashpointOption,
    {
      id: 'surgical_strikes',
      text: 'Surgical Air Strikes (Joint Chiefs Plan) [BREAKS PROMISE]',
      description:
        'Launch immediate air strikes to destroy all missile sites in Cuba before they become operational. Risk war, but eliminate the threat decisively. WARNING: Violates your implicit non-invasion understanding with neutral nations.',
      advisorSupport: ['military'],
      advisorOppose: ['diplomatic', 'pr'],
      outcome: {
        probability: 0.45,
        success: {
          sitesDestroyed: true,
          morale: +10,
          defcon: 1,
          warRisk: true,
        },
        failure: {
          sovietCasualties: true,
          nuclearRetaliation: true,
          berlinSeized: true,
        },
      },
      successNarrative:
        'The strikes destroy missile sites but kill Soviet personnel. Khrushchev is enraged. Trust collapses to zero. You\'ve gained a tactical victory but may have started World War III.',
      failureNarrative:
        'Soviet casualties mount as MiGs intercept the strike. Khrushchev retaliates by seizing West Berlin. Tactical nuclear weapons are deployed. The world descends into nuclear holocaust.',
      costs: {
        dip: 0, // No diplomacy involved - pure military action
        councilVote: false,
      },
      diplomaticEffects: {
        trustChange: {
          soviet: -40, // Massive trust loss for surprise attack
          uk: -15, // Allies shocked by unilateral action
          france: -12,
          turkey: -8,
        },
        relationshipChange: {
          soviet: -50,
          cuba: -60,
          warsaw: -45,
        },
        createGrievance: {
          type: 'surprise-attack',
          severity: 'severe',
          againstNationId: 'us',
          description: 'Unprovoked air strike on Soviet forces in Cuba',
        },
        allianceImpact: {
          nato: -10, // NATO alliance strained by unilateral action
        },
        councilLegitimacy: -20, // Massive loss for bypassing international system
        dipReward: 0,
      },
      diplomaticFailureEffects: {
        trustChange: {
          soviet: -50,
          cuba: -50,
          uk: -25,
          france: -20,
        },
        relationshipChange: {
          soviet: -80,
          cuba: -80,
        },
        createGrievance: {
          type: 'war-crimes',
          severity: 'severe',
          againstNationId: 'us',
          description: 'First strike with massive casualties, leading to nuclear war',
        },
        allianceImpact: {
          nato: -25,
        },
        dipLoss: 30,
      },
      thirdPartyReactions: [
        {
          nationId: 'uk',
          support: false,
          impact: -15,
          narrative: 'Macmillan is privately furious: "You didn\'t even consult us!"',
        },
        {
          nationId: 'france',
          support: false,
          impact: -12,
          narrative: 'De Gaulle condemns the "cowboy diplomacy."',
        },
        {
          nationId: 'turkey',
          support: true,
          impact: 3,
          narrative: 'Turkey supports strong action but fears Soviet retaliation.',
        },
        {
          nationId: 'cuba',
          support: false,
          impact: -60,
          narrative: 'Castro vows eternal resistance. "Bay of Pigs was nothing compared to this!"',
        },
      ],
    } as EnhancedFlashpointOption,
    {
      id: 'diplomatic_resolution',
      text: 'Diplomatic Resolution (Stevenson Plan) [30 DIP + Council Vote]',
      description:
        'Announce discovery at UN Security Council. Demand Soviet withdrawal and propose grand bargain: Soviet missiles out of Cuba, US missiles out of Turkey. Costs 30 DIP to call emergency session. Requires council vote.',
      advisorSupport: ['diplomatic'],
      advisorOppose: ['military', 'intel'],
      outcome: {
        probability: 0.55,
        success: {
          negotiatedSettlement: true,
          defcon: 3,
          diplomacy: +15,
          morale: -5,
        },
        failure: {
          publicHumiliation: true,
          missilesOperational: true,
          morale: -20,
        },
      },
      successNarrative:
        'Your public proposal gives Khrushchev an honorable exit. The Soviets agree to withdraw missiles from Cuba in exchange for your public promise to remove Jupiter missiles from Turkey. Trust increases significantly. Critics call it appeasement, but you averted Armageddon.',
      failureNarrative:
        'The Soviet Union vetoes the resolution. Khrushchev rejects the proposal as unequal. The Soviets accelerate missile deployment. Your public gambit has failed, and you\'ve lost diplomatic capital.',
      costs: {
        dip: 30, // DIPCosts.CALL_COUNCIL_VOTE
        councilVote: true, // Requires UN Security Council vote
        trust: 20, // Need minimum trust for negotiation
      },
      diplomaticEffects: {
        trustChange: {
          soviet: 15, // Offering honorable solution
          uk: 5,
          france: 8,
          turkey: -10, // Turkey upset about public missile trade
        },
        favorChange: {
          soviet: 5, // Offering compromise
          turkey: -5, // Using Turkey as bargaining chip
        },
        relationshipChange: {
          soviet: 20,
          cuba: 10,
          turkey: -15,
        },
        createPromise: {
          type: 'no-attack',
          toNationId: 'soviet',
          description: 'Remove Jupiter missiles from Turkey within 6 months',
          isPublic: true, // Public promise
          turnsToFulfill: 180, // 6 months in days
          trustValueIfKept: 20,
          trustPenaltyIfBroken: 35,
        },
        resolveGrievance: ['usa-missile-deployment', 'ussr-turkey-missiles'],
        dipReward: 25, // DIPEarning.HOST_PEACE_CONFERENCE
        councilLegitimacy: 15,
      },
      diplomaticFailureEffects: {
        trustChange: {
          soviet: -10,
          turkey: -5,
        },
        relationshipChange: {
          soviet: -15,
          turkey: -10,
        },
        dipLoss: 30, // Still spent the DIP even though it failed
        councilLegitimacy: -10,
      },
      thirdPartyReactions: [
        {
          nationId: 'uk',
          support: true,
          impact: 10,
          narrative:
            'Macmillan supports the diplomatic approach. "This is statesmanship at its finest."',
        },
        {
          nationId: 'turkey',
          support: false,
          impact: -15,
          narrative:
            'Turkish government is blindsided by public offer to remove their missiles. "We were not consulted!"',
        },
        {
          nationId: 'france',
          support: true,
          impact: 8,
          narrative: 'De Gaulle approves of working through the UN, despite his usual skepticism.',
        },
      ],
    } as EnhancedFlashpointOption,
  ],
  consequences: {},
};

// ============================================================================
// TURN 6: UN SECURITY COUNCIL SHOWDOWN - ENHANCED
// ============================================================================

export const ENHANCED_UN_CONFRONTATION: FlashpointEvent = {
  id: 'un-confrontation-enhanced',
  title: 'UN Security Council Showdown: "Don\'t Wait for the Translation!"',
  description:
    'October 25, 1962: The Security Council has convened. Soviet Ambassador Valerian Zorin denies the missiles exist. You have the U-2 photos. This is your moment to turn global opinion.\n\n💰 DIP Cost: 15 (Influence Vote)\n🤝 Current USSR Trust: Variable\n🌍 Council Legitimacy Impact: High',
  category: 'rogue',
  severity: 'critical',
  timeLimit: 75,
  triggeredAt: Date.now(),
  options: [
    {
      id: 'dramatic_presentation',
      text: 'Dramatic Photo Presentation [15 DIP]',
      description:
        'Stevenson confronts Zorin directly: "Yes or no? Don\'t wait for the translation!" Unveil the U-2 photos dramatically. Spend 15 DIP to influence undecided nations.',
      advisorSupport: ['diplomatic', 'pr', 'intel'],
      advisorOppose: [],
      outcome: {
        probability: 0.8,
        success: {
          globalSupportWon: true,
          diplomacy: +15,
          morale: +10,
          sovietIsolated: true,
        },
        failure: {
          photosQuestioned: true,
          diplomacy: -8,
          morale: -5,
        },
      },
      successNarrative:
        'Stevenson\'s performance is masterful. "I am prepared to wait for my answer until Hell freezes over." The chamber erupts. The world sees the truth. Even neutral nations rally to your side. USSR\'s council legitimacy plummets.',
      failureNarrative:
        'Soviet propaganda dismisses the photos as doctored. Non-aligned nations remain cautious. The public relations victory you sought slips away.',
      costs: {
        dip: 15, // DIPCosts.INFLUENCE_VOTE (25 reduced for this scenario)
        councilVote: false,
      },
      diplomaticEffects: {
        trustChange: {
          soviet: -5, // Public humiliation
          uk: 10,
          france: 8,
        },
        relationshipChange: {
          soviet: -20, // Public confrontation
          cuba: -15,
        },
        councilLegitimacy: 20, // Massive boost for exposing lies
        dipReward: 20, // Successful diplomatic victory
      },
      diplomaticFailureEffects: {
        trustChange: {
          uk: -5,
          france: -3,
        },
        dipLoss: 15,
        councilLegitimacy: -8,
      },
      thirdPartyReactions: [
        {
          nationId: 'uk',
          support: true,
          impact: 10,
          narrative: 'UK delegation applauds Stevenson\'s performance.',
        },
        {
          nationId: 'france',
          support: true,
          impact: 8,
          narrative: 'France backs the photographic evidence.',
        },
        {
          nationId: 'cuba',
          support: false,
          impact: -15,
          narrative: 'Cuban delegation walks out in protest.',
        },
      ],
    } as EnhancedFlashpointOption,
    {
      id: 'measured_diplomacy',
      text: 'Measured Diplomatic Approach [5 DIP]',
      description:
        'Present evidence calmly without theatrics. Focus on building quiet coalition. Lower cost (5 DIP) but less dramatic impact.',
      advisorSupport: ['diplomatic'],
      advisorOppose: ['pr'],
      outcome: {
        probability: 0.6,
        success: {
          quietSupport: true,
          diplomacy: +10,
          coalitionBuilding: true,
        },
        failure: {
          momentLost: true,
          diplomacy: -5,
        },
      },
      successNarrative:
        'Your measured approach builds a solid coalition. While not as dramatic, you secure commitments from key non-aligned nations. USSR trust doesn\'t suffer as much from public humiliation.',
      failureNarrative: 'Without drama, the moment passes. The media focuses elsewhere. Opportunity lost.',
      costs: {
        dip: 5,
        councilVote: false,
      },
      diplomaticEffects: {
        trustChange: {
          soviet: 2, // Less public humiliation = less trust damage
          uk: 5,
          france: 5,
        },
        relationshipChange: {
          soviet: -8, // Still accusation, but less hostile
        },
        councilLegitimacy: 10,
        dipReward: 10,
      },
      diplomaticFailureEffects: {
        dipLoss: 5,
        councilLegitimacy: -3,
      },
      thirdPartyReactions: [
        {
          nationId: 'uk',
          support: true,
          impact: 5,
          narrative: 'UK appreciates the professional approach.',
        },
        {
          nationId: 'soviet',
          support: false,
          impact: -8,
          narrative: 'USSR still denies allegations but less aggressively attacked.',
        },
      ],
    } as EnhancedFlashpointOption,
    {
      id: 'call_for_resolution',
      text: 'Call for Resolution Vote [30 DIP + Probable USSR Veto]',
      description:
        'Push for an immediate Security Council resolution demanding missile removal. Costs 30 DIP. USSR will likely veto, but forces them to take public stance.',
      advisorSupport: ['diplomatic', 'pr'],
      advisorOppose: ['intel'],
      outcome: {
        probability: 0.4,
        success: {
          resolutionPasses: true,
          diplomacy: +20,
          sovietVetoes: false, // Rare success if they don't veto
        },
        failure: {
          sovietVeto: true,
          unStalemate: true,
          morale: -8,
        },
      },
      successNarrative:
        'Miraculously, the USSR abstains rather than veto. The resolution passes with overwhelming support. This is a diplomatic earthquake. Khrushchev is now under immense pressure.',
      failureNarrative:
        'The Soviet Union vetoes the resolution. The UN is stalemated. Your moment of diplomatic triumph fades.',
      costs: {
        dip: 30, // DIPCosts.CALL_COUNCIL_VOTE
        councilVote: true,
      },
      diplomaticEffects: {
        trustChange: {
          soviet: -15, // Forcing their hand
        },
        relationshipChange: {
          soviet: -25,
        },
        councilLegitimacy: 15, // Shows UN can act
        dipReward: 25, // If successful
      },
      diplomaticFailureEffects: {
        trustChange: {
          soviet: -10,
        },
        dipLoss: 30,
        councilLegitimacy: -5, // Shows UN is ineffective
      },
      thirdPartyReactions: [
        {
          nationId: 'uk',
          support: true,
          impact: 8,
          narrative: 'UK votes in favor of the resolution.',
        },
        {
          nationId: 'france',
          support: true,
          impact: 8,
          narrative: 'France supports the resolution.',
        },
        {
          nationId: 'soviet',
          support: false,
          impact: -25,
          narrative: 'USSR casts veto, blocking the resolution.',
        },
      ],
    } as EnhancedFlashpointOption,
  ],
  consequences: {},
};

// ============================================================================
// TURN 10-11: TWO TELEGRAMS CRISIS - ENHANCED
// ============================================================================

export const ENHANCED_TWO_TELEGRAMS: FlashpointEvent = {
  id: 'two-telegrams-enhanced',
  title: 'THE TWO TELEGRAMS: Khrushchev\'s Contradictory Messages',
  description:
    'October 26-27, 1962: Two letters arrive from Khrushchev within 24 hours. The first is emotional and conciliatory: remove missiles if you pledge not to invade Cuba. The second is formal and harsh: demands you also remove Jupiter missiles from Turkey. Which represents his true position?\n\n💰 RFK Back-Channel: 20 DIP for private letter\n🤝 Trust Required: 30+ for secret deal\n🇹🇷 Turkey Reaction: Will impact NATO alliance',
  category: 'rogue',
  severity: 'critical',
  timeLimit: 75,
  triggeredAt: Date.now(),
  options: [
    {
      id: 'rfk_gambit',
      text: 'Accept First Letter (RFK Gambit) [20 DIP Private Letter]',
      description:
        'Robert Kennedy\'s idea: respond to first letter, ignore second. Make SECRET promise to remove Turkey missiles later. Costs 20 DIP for back-channel. Requires 30+ trust with USSR.',
      advisorSupport: ['diplomatic', 'intel'],
      advisorOppose: ['military'],
      outcome: {
        probability: 0.65,
        success: {
          crisisResolving: true,
          diplomacy: +18,
          defcon: 3,
          turkeyMissilesSecret: true,
        },
        failure: {
          khrushchevRejects: true,
          turkeyCrisis: true,
          natoTensions: true,
        },
      },
      successNarrative:
        'Bobby meets Dobrynin secretly. The deal: Public non-invasion pledge, secret Turkey removal in 6 months. Khrushchev accepts. On October 28, Radio Moscow announces withdrawal. The RFK Gambit saved the world. You create a PRIVATE promise.',
      failureNarrative:
        'Khrushchev insists the Turkey trade must be public. NATO allies are outraged. The crisis deepens as the alliance fractures.',
      costs: {
        dip: 20, // Back-channel communication cost
        trust: 30, // Minimum trust required for secret negotiation
        councilVote: false,
      },
      diplomaticEffects: {
        trustChange: {
          soviet: 25, // Huge trust gain for finding honorable solution
          turkey: 0, // They don't know yet (secret)
        },
        favorChange: {
          soviet: 10, // USSR owes you for saving face
        },
        relationshipChange: {
          soviet: 35,
          cuba: 15, // Castro relieved invasion is off
        },
        createPromise: {
          type: 'no-attack',
          toNationId: 'soviet',
          description: 'Publicly promise not to invade Cuba',
          isPublic: true,
          turnsToFulfill: 9999, // Indefinite promise
          trustValueIfKept: 30,
          trustPenaltyIfBroken: 50,
        },
        // SECRET PROMISE - separate
        dipReward: 30, // Huge reward for ending crisis
        resolveGrievance: ['usa-missile-deployment', 'cuba-bay-of-pigs', 'ussr-turkey-missiles'],
      },
      diplomaticFailureEffects: {
        trustChange: {
          soviet: -15,
          turkey: -20, // Secret leaks
        },
        relationshipChange: {
          soviet: -20,
          turkey: -30,
        },
        createGrievance: {
          type: 'betrayed-ally',
          severity: 'severe',
          againstNationId: 'turkey',
          description: 'Secret deal to remove Turkish missiles without consultation',
        },
        allianceImpact: {
          nato: -15,
        },
        dipLoss: 20,
      },
      thirdPartyReactions: [
        {
          nationId: 'uk',
          support: true,
          impact: 10,
          narrative: 'UK privately approves the elegant solution.',
        },
        {
          nationId: 'turkey',
          support: true, // They don't know about secret yet
          impact: 5,
          narrative: 'Turkey relieved the crisis is ending.',
        },
        {
          nationId: 'cuba',
          support: true,
          impact: 15,
          narrative: 'Castro grudgingly accepts the outcome.',
        },
      ],
    } as EnhancedFlashpointOption,
    {
      id: 'public_trade',
      text: 'Public Turkey-Cuba Trade [0 DIP but NATO Damaged]',
      description:
        'Accept the second letter. Publicly announce missile swap. No DIP cost, but damages NATO alliance and Turkish trust. Creates public promise.',
      advisorSupport: ['diplomatic'],
      advisorOppose: ['military', 'intel', 'pr'],
      outcome: {
        probability: 0.5,
        success: {
          tradeMade: true,
          diplomacy: +12,
          natoAngered: true,
          morale: -8,
        },
        failure: {
          natoCollapse: true,
          allianceBroken: true,
          turkeyDefects: true,
        },
      },
      successNarrative:
        'You announce the trade publicly. Khrushchev accepts immediately. Missiles withdrawn from both locations. Critics savage you for "appeasement." NATO allies feel sold out. But nuclear war is avoided.',
      failureNarrative:
        'NATO erupts in fury. Turkey sees this as betrayal and considers leaving the alliance. The Soviets sense NATO is fracturing and press their advantage in Berlin.',
      costs: {
        dip: 0, // No diplomatic negotiation needed - just announcement
        councilVote: false,
      },
      diplomaticEffects: {
        trustChange: {
          soviet: 20,
          turkey: -30, // Massive trust loss for public betrayal
          uk: -10,
          france: -8,
        },
        favorChange: {
          soviet: 15,
          turkey: -20,
        },
        relationshipChange: {
          soviet: 30,
          turkey: -40,
          nato: -25,
        },
        createPromise: {
          type: 'no-attack',
          toNationId: 'soviet',
          description: 'Remove missiles from both Cuba and Turkey',
          isPublic: true,
          turnsToFulfill: 180,
          trustValueIfKept: 25,
          trustPenaltyIfBroken: 40,
        },
        createGrievance: {
          type: 'betrayed-ally',
          severity: 'severe',
          againstNationId: 'turkey',
          description: 'Public betrayal - missiles removed without consultation',
        },
        allianceImpact: {
          nato: -20,
        },
        dipReward: 15,
        resolveGrievance: ['usa-missile-deployment', 'ussr-turkey-missiles'],
      },
      diplomaticFailureEffects: {
        trustChange: {
          turkey: -40,
          uk: -20,
          france: -15,
        },
        allianceImpact: {
          nato: -35, // NATO severely damaged
        },
        createGrievance: {
          type: 'broken-treaty',
          severity: 'severe',
          againstNationId: 'nato',
          description: 'Unilateral action violates NATO consultation requirements',
        },
      },
      thirdPartyReactions: [
        {
          nationId: 'turkey',
          support: false,
          impact: -40,
          narrative: 'Turkey furiously denounces the betrayal. Alliance in crisis.',
        },
        {
          nationId: 'uk',
          support: false,
          impact: -15,
          narrative: 'UK government expresses "deep concern" over unilateral action.',
        },
        {
          nationId: 'soviet',
          support: true,
          impact: 30,
          narrative: 'USSR celebrates diplomatic victory.',
        },
      ],
    } as EnhancedFlashpointOption,
    {
      id: 'reject_both',
      text: 'Reject Both Letters [Ultimatum - No DIP Cost]',
      description:
        'Refuse both proposals. Demand unconditional withdrawal or face military action. High risk, high reward. No diplomacy involved.',
      advisorSupport: ['military', 'pr'],
      advisorOppose: ['diplomatic', 'intel'],
      outcome: {
        probability: 0.3,
        success: {
          sovietBackdown: true,
          morale: +15,
          defcon: 2,
          warRisk: true,
        },
        failure: {
          nuclearWar: true,
          worldEnds: true,
        },
      },
      successNarrative:
        'Your ultimatum is stark. Khrushchev, realizing you will strike, orders withdrawal without getting anything. You win decisively - but allies are shaken by how close you came to the brink. Trust with USSR is destroyed.',
      failureNarrative:
        'Khrushchev cannot back down without concessions. Air strikes begin Monday. Soviet forces fire back. Tactical nukes used. Within hours, ICBMs fly. Northern Hemisphere destroyed.',
      costs: {
        dip: 0,
        councilVote: false,
      },
      diplomaticEffects: {
        trustChange: {
          soviet: -30, // Destroyed by ultimatum
          uk: -10, // Scared by brinkmanship
          france: -8,
        },
        relationshipChange: {
          soviet: -40,
          cuba: -50,
        },
        createGrievance: {
          type: 'surprise-attack',
          severity: 'severe',
          againstNationId: 'soviet',
          description: 'Ultimatum threatening unprovoked attack',
        },
        dipReward: 0,
        councilLegitimacy: -15, // Bypassed diplomacy entirely
      },
      diplomaticFailureEffects: {
        trustChange: {
          soviet: -50,
          uk: -20,
          france: -18,
        },
        relationshipChange: {
          soviet: -80,
        },
        createGrievance: {
          type: 'war-crimes',
          severity: 'severe',
          againstNationId: 'all',
          description: 'Started nuclear war',
        },
      },
      thirdPartyReactions: [
        {
          nationId: 'uk',
          support: false,
          impact: -15,
          narrative: 'UK urges restraint, fears you\'re gambling with civilization.',
        },
        {
          nationId: 'france',
          support: false,
          impact: -12,
          narrative: 'France warns against "madness."',
        },
      ],
    } as EnhancedFlashpointOption,
  ],
  consequences: {},
};

// ============================================================================
// ADDITIONAL ENHANCED FLASHPOINTS
// ============================================================================

/**
 * Collection of all enhanced Cuba Crisis flashpoints
 */
export const ENHANCED_CUBA_CRISIS_FLASHPOINTS: Record<number, FlashpointEvent[]> = {
  1: [ENHANCED_EXCOMM_BRIEFING],
  6: [ENHANCED_UN_CONFRONTATION],
  10: [ENHANCED_TWO_TELEGRAMS],
  // Additional turns can be added with more enhanced flashpoints
};

/**
 * Get enhanced flashpoints for a specific turn
 */
export function getEnhancedFlashpointsForTurn(turn: number): FlashpointEvent[] {
  return ENHANCED_CUBA_CRISIS_FLASHPOINTS[turn] || [];
}

/**
 * Check if player has sufficient resources for an option
 */
export function canAffordOption(
  option: EnhancedFlashpointOption,
  playerState: {
    dip: number;
    favor: Record<string, number>;
    trust: Record<string, number>;
  }
): { canAfford: boolean; reason?: string } {
  if (!option.costs) {
    return { canAfford: true };
  }

  if (option.costs.dip && playerState.dip < option.costs.dip) {
    return {
      canAfford: false,
      reason: `Insufficient DIP (need ${option.costs.dip}, have ${playerState.dip})`,
    };
  }

  if (option.costs.trust) {
    // Check if player has minimum trust with any relevant nation
    const hasSufficientTrust = Object.values(playerState.trust).some((t) => t >= option.costs!.trust!);
    if (!hasSufficientTrust) {
      return {
        canAfford: false,
        reason: `Insufficient trust (need ${option.costs.trust} with at least one nation)`,
      };
    }
  }

  return { canAfford: true };
}

/**
 * Apply diplomatic effects from an option result
 */
export function applyDiplomaticEffects(
  option: EnhancedFlashpointOption,
  success: boolean,
  gameState: EnhancedGameState
): EnhancedGameState {
  const effects = success ? option.diplomaticEffects : option.diplomaticFailureEffects;

  if (!effects) return gameState;
  const nations: Nation[] = Array.isArray(gameState?.nations) ? gameState.nations : [];
  if (!nations.length) {
    return gameState;
  }

  const nationMap = new Map<string, Nation>();
  nations.forEach((nation) => {
    nationMap.set(nation.id, nation);
  });

  const getNation = (nationId?: string): Nation | undefined => {
    if (!nationId) return undefined;
    return nationMap.get(nationId);
  };

  const updateNation = (
    nationId: string,
    updater: (nation: Nation) => Nation
  ): Nation | undefined => {
    const existing = nationMap.get(nationId);
    if (!existing) return undefined;
    const updated = updater(existing);
    if (!updated) return existing;

    if (updated !== existing) {
      nationMap.set(nationId, updated);
      const index = nations.findIndex((nation) => nation.id === nationId);
      if (index !== -1) {
        nations[index] = updated;
      }
    }

    return updated;
  };

  const determinePlayerNationId = (): string | undefined => {
    if (typeof gameState?.playerNationId === 'string') return gameState.playerNationId;
    if (typeof gameState?.playerId === 'string') return gameState.playerId;
    if (typeof gameState?.playerNation?.id === 'string') return gameState.playerNation.id;
    if (typeof gameState?.player?.id === 'string') return gameState.player.id;
    if (typeof gameState?.getPlayerNationId === 'function') {
      const derived = gameState.getPlayerNationId();
      if (typeof derived === 'string') return derived;
    }

    const playerFromArray = nations.find((nation) => nation.isPlayer);
    return playerFromArray?.id;
  };

  const extractCurrentTurn = (): number => {
    if (typeof gameState?.turn === 'number') return gameState.turn;
    if (typeof gameState?.currentTurn === 'number') return gameState.currentTurn;
    if (typeof gameState?.state?.turn === 'number') return gameState.state.turn;
    if (typeof gameState?.timeline?.turn === 'number') return gameState.timeline.turn;
    return 0;
  };

  const currentTurn = extractCurrentTurn();
  const playerNationId = determinePlayerNationId();
  const reasonBase = `${option.text} (${success ? 'success' : 'failure'})`;

  // Apply trust adjustments (other nations toward the player)
  if (effects.trustChange && playerNationId) {
    for (const [nationId, delta] of Object.entries(effects.trustChange)) {
      if (!delta) continue;
      updateNation(nationId, (nation) =>
        modifyTrust(nation, playerNationId, delta, reasonBase, currentTurn)
      );
    }
  }

  // Apply favor adjustments (keep bilateral balances in sync)
  if (effects.favorChange && playerNationId) {
    for (const [nationId, delta] of Object.entries(effects.favorChange)) {
      if (!delta) continue;
      updateNation(playerNationId, (nation) =>
        modifyFavors(nation, nationId, delta, reasonBase, currentTurn)
      );
      updateNation(nationId, (nation) =>
        modifyFavors(nation, playerNationId, -delta, reasonBase, currentTurn)
      );
    }
  }

  // Apply relationship changes symmetrically
  if (effects.relationshipChange && playerNationId) {
    for (const [nationId, delta] of Object.entries(effects.relationshipChange)) {
      if (!delta) continue;
      updateNation(playerNationId, (nation) =>
        modifyRelationship(nation, nationId, delta, reasonBase, currentTurn)
      );
      updateNation(nationId, (nation) =>
        modifyRelationship(nation, playerNationId, delta, reasonBase, currentTurn)
      );
    }
  }

  // Create diplomatic promises from the player toward a target nation
  if (effects.createPromise && playerNationId) {
    const promiseEffect = effects.createPromise as Partial<DiplomaticPromise> & {
      turnsToFulfill?: number;
      trustValueIfKept?: number;
      trustPenaltyIfBroken?: number;
      relationshipPenaltyIfBroken?: number;
      description?: string;
      isPublic?: boolean;
    };

    const toNationId = promiseEffect.toNationId ?? Object.keys(effects.relationshipChange ?? {})[0];
    if (toNationId) {
      const promiseTypeMap: Record<string, PromiseType> = {
        military: 'no-attack',
        nuclear: 'no-nuclear-weapons',
        diplomatic: 'neutral-mediator',
      };

      const resolvePromiseType = (value?: string): PromiseType => {
        if (!value) return 'no-attack';
        return promiseTypeMap[value] ?? (value as PromiseType);
      };

      const durationTurns = promiseEffect.turnsToFulfill
        ? Math.max(1, Math.round(promiseEffect.turnsToFulfill))
        : promiseEffect.terms?.duration;

      const terms: PromiseTerms = {
        ...promiseEffect.terms,
        duration: durationTurns,
        trustReward: promiseEffect.trustValueIfKept ?? promiseEffect.terms?.trustReward,
        trustPenalty: promiseEffect.trustPenaltyIfBroken ?? promiseEffect.terms?.trustPenalty,
        relationshipPenalty:
          promiseEffect.relationshipPenaltyIfBroken ?? promiseEffect.terms?.relationshipPenalty,
      };

      const targetNationExists = Boolean(getNation(toNationId));
      if (targetNationExists) {
        const promiseType = resolvePromiseType(promiseEffect.type);
        const updatedPlayer = updateNation(playerNationId, (nation) =>
          createDiplomaticPromise(
            nation,
            toNationId,
            promiseType,
            terms,
            currentTurn
          )
        );

        if (updatedPlayer && (promiseEffect.description || promiseEffect.isPublic !== undefined)) {
          const promises = updatedPlayer.diplomaticPromises ?? [];
          const createdId = `${playerNationId}-${toNationId}-${promiseType}-${currentTurn}`;
          const createdIndex = promises.findIndex((promise) => promise.id === createdId);
          if (createdIndex !== -1) {
            const createdPromise = promises[createdIndex];
            const existingTerms = createdPromise.terms as ExtendedPromiseTerms;
            const enhancedTerms: ExtendedPromiseTerms = {
              ...existingTerms,
              description: promiseEffect.description ?? existingTerms?.description,
              isPublic: promiseEffect.isPublic ?? existingTerms?.isPublic,
              trustReward: terms.trustReward,
              trustPenalty: terms.trustPenalty,
              relationshipPenalty: terms.relationshipPenalty,
            };

            const updatedPromises = [...promises];
            updatedPromises[createdIndex] = {
              ...createdPromise,
              terms: enhancedTerms,
            };

            nationMap.set(playerNationId, {
              ...updatedPlayer,
              diplomaticPromises: updatedPromises,
            });
            const playerIndex = nations.findIndex((nation) => nation.id === playerNationId);
            if (playerIndex !== -1) {
              nations[playerIndex] = nationMap.get(playerNationId)!;
            }
          }
        }
      }
    }
  }

  // Resolve grievances by ID
  if (effects.resolveGrievance?.length) {
    for (const grievanceId of effects.resolveGrievance) {
      if (!grievanceId) continue;
      nationMap.forEach((nation, nationId) => {
        if (nation.grievances?.some((grievance) => grievance.id === grievanceId && !grievance.resolved)) {
          updateNation(nationId, (current) =>
            resolveNationGrievance(current, grievanceId, currentTurn)
          );
        }
      });
    }
  }

  // Create new grievances when specified
  if (effects.createGrievance) {
    const grievanceEffect = effects.createGrievance as Partial<Grievance> & {
      turnsToFulfill?: number;
      trustValueIfKept?: number;
      trustPenaltyIfBroken?: number;
      relationshipPenaltyIfBroken?: number;
    };

    const wrongdoingNationId = grievanceEffect.againstNationId;
    const gatherAffectedNationIds = (): string[] => {
      const impacted = new Set<string>();
      const relationshipEntries = Object.entries(effects.relationshipChange ?? {});
      relationshipEntries
        .filter(([, delta]) => delta < 0)
        .forEach(([nationId]) => impacted.add(nationId));
      const trustEntries = Object.entries(effects.trustChange ?? {});
      trustEntries
        .filter(([, delta]) => delta < 0)
        .forEach(([nationId]) => impacted.add(nationId));
      (option.thirdPartyReactions ?? [])
        .filter((reaction) => reaction.impact < 0)
        .forEach((reaction) => impacted.add(reaction.nationId));
      return Array.from(impacted);
    };

    const complainingNationIds = new Set<string>();

    if (wrongdoingNationId === 'all' && playerNationId) {
      nations
        .filter((nation) => nation.id !== playerNationId)
        .forEach((nation) => complainingNationIds.add(nation.id));
    } else if (wrongdoingNationId === playerNationId) {
      const impacted = gatherAffectedNationIds();
      if (impacted.length) {
        impacted.forEach((nationId) => complainingNationIds.add(nationId));
      } else {
        nationMap.forEach((_, nationId) => {
          if (nationId !== playerNationId) {
            complainingNationIds.add(nationId);
          }
        });
      }
    } else if (wrongdoingNationId && wrongdoingNationId !== 'all') {
      if (playerNationId) {
        complainingNationIds.add(playerNationId);
      }
    }

    const grievanceType = (grievanceEffect.type ?? 'betrayed-ally') as GrievanceType;
    const grievanceSeverity = grievanceEffect.severity as GrievanceSeverity | undefined;
    const targetNationId = wrongdoingNationId === 'all' ? playerNationId : wrongdoingNationId;

    if (targetNationId) {
      complainingNationIds.forEach((nationId) => {
        if (!getNation(nationId)) return;
        updateNation(nationId, (nation) =>
          registerGrievance(
            nation,
            targetNationId,
            grievanceType,
            currentTurn,
            grievanceEffect.description,
            grievanceSeverity
          )
        );
      });
    }
  }

  // Apply DIP rewards or penalties
  if (effects.dipReward && playerNationId) {
    updateNation(playerNationId, (nation) =>
      earnDIP(nation, effects.dipReward!, reasonBase, currentTurn)
    );
  }

  if ('dipLoss' in effects && effects.dipLoss && playerNationId) {
    updateNation(playerNationId, (nation) => {
      const spent = spendDIP(nation, effects.dipLoss!, reasonBase, currentTurn);
      if (spent) return spent;
      const available = getDIP(nation);
      if (!available) return nation;
      return earnDIP(nation, -available, `${reasonBase} (insufficient DIP)`, currentTurn);
    });
  }

  // Keep any cached player references in sync
  if (playerNationId) {
    const updatedPlayer = nationMap.get(playerNationId);
    if (updatedPlayer) {
      if (gameState.playerNation && gameState.playerNation.id === playerNationId) {
        gameState.playerNation = updatedPlayer;
      }
      if (gameState.player && gameState.player.id === playerNationId) {
        gameState.player = updatedPlayer;
      }
    }
  }

  if (gameState.nationsById && typeof gameState.nationsById === 'object') {
    nationMap.forEach((nation, nationId) => {
      gameState.nationsById[nationId] = nation;
    });
  }

  return gameState;
}
