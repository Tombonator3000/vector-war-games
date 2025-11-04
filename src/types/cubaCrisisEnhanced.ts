/**
 * Enhanced Cuban Missile Crisis Scenario Configuration
 *
 * This configuration integrates:
 * - Phase 1: Trust, Favors, Promises
 * - Phase 2: Grievances, Claims, Specialized Alliances
 * - Phase 3: DIP Currency, International Council, Incidents, Peace Conferences, Espionage
 *
 * Historical Context: October 16-28, 1962
 * "Thirteen Days that brought the world to the brink of nuclear war"
 */

import type { ScenarioConfig } from './scenario';
import type { TrustRecord, FavorBalance, DiplomaticPromise } from './trustAndFavors';
import type { Grievance, Claim, GrievanceType, ClaimType } from './grievancesAndClaims';
import type { SpecializedAlliance, AllianceType } from './specializedAlliances';
import type {
  DiplomaticInfluence,
  CouncilMembershipType,
  InternationalCouncil,
  DiplomaticIncident,
  IncidentType,
  DIPEarning,
} from './diplomacyPhase3';

// ============================================================================
// ENHANCED SCENARIO CONFIGURATION
// ============================================================================

/**
 * Extended scenario config with initial diplomatic state
 */
export interface EnhancedScenarioConfig extends ScenarioConfig {
  /** Initial diplomatic configurations for nations */
  initialDiplomaticState?: InitialDiplomaticState;

  /** Special scenario rules and mechanics */
  specialRules?: CubaCrisisRules;

  /** Pre-configured incidents and events */
  scheduledIncidents?: ScheduledIncident[];

  /** Victory conditions specific to scenario */
  victoryConditions?: VictoryCondition[];
}

/**
 * Initial diplomatic state for all nations in scenario
 */
export interface InitialDiplomaticState {
  /** Pre-set trust levels between nations */
  trustLevels: Record<string, Record<string, number>>; // NationA ID -> NationB ID -> Trust (0-100)

  /** Pre-set favor balances */
  favorBalances: Record<string, Record<string, number>>; // NationA ID -> NationB ID -> Favors (-100 to +100)

  /** Existing grievances at scenario start */
  grievances: Record<string, Grievance[]>; // Nation ID -> List of grievances

  /** Existing claims at scenario start */
  claims: Record<string, Claim[]>; // Nation ID -> List of claims

  /** Existing alliances with types */
  specializedAlliances: Record<string, SpecializedAlliance[]>; // Nation ID -> Alliances

  /** Initial DIP for each nation */
  diplomaticInfluence: Record<string, Partial<DiplomaticInfluence>>; // Nation ID -> DIP state

  /** Council membership status */
  councilMembership: Record<string, CouncilMembershipType>; // Nation ID -> Membership type

  /** Initial relationship scores */
  relationships: Record<string, Record<string, number>>; // NationA -> NationB -> Relationship (-100 to +100)
}

/**
 * Special rules for Cuba Crisis scenario
 */
export interface CubaCrisisRules {
  /** Enable back-channel communication (private letters) */
  backChannelEnabled: boolean;
  backChannelDIPCost: number;

  /** Enable UN Security Council emergency sessions */
  emergencySessionsEnabled: boolean;
  emergencySessionInterval: number; // Turns between sessions

  /** Enable Castro independence factor */
  cubanAutonomy: {
    enabled: boolean;
    trustThreshold: number; // Below this trust, Cuba can act independently
    escalationProbability: number; // Chance Cuba escalates without USSR approval
  };

  /** Enable historical accuracy scoring */
  historicalAccuracyTracking: boolean;

  /** Escalation mechanics */
  escalation: {
    enabled: boolean;
    u2ShootdownTurn: number; // Which turn the U-2 is shot down
    submarineEncounterTurn: number; // Which turn submarine incident occurs
    automaticIncidents: boolean; // If false, incidents are player-triggered
  };

  /** Superpower bonuses */
  superpowerBonuses: {
    usDIPBonus: number; // Extra DIP per turn
    ussrDIPBonus: number; // Extra DIP per turn
    vetoReduction: number; // Reduced DIP cost for veto
  };

  /** Secret diplomacy */
  secretDiplomacy: {
    enabled: boolean;
    turkeyMissilesSecret: boolean; // Jupiter missile deal can be kept private
    privatePromisesEnabled: boolean; // Promises can be public or private
  };

  /** Multi-party dynamics */
  activeThirdParties: string[]; // Nation IDs: Cuba, Turkey, UN, etc.
  thirdPartyInfluence: number; // 0-100, how much third parties affect outcome
}

/**
 * Pre-scheduled incident for historical accuracy
 */
export interface ScheduledIncident {
  turn: number;
  incident: Partial<DiplomaticIncident>;
  triggerCondition?: 'automatic' | 'escalation-threshold' | 'player-choice';
  escalationThreshold?: number; // If trigger is escalation-threshold
}

/**
 * Victory conditions for scenario
 */
export interface VictoryCondition {
  id: string;
  type: 'diplomatic' | 'military' | 'propaganda' | 'historical' | 'survival';
  name: string;
  description: string;
  requirements: VictoryRequirement[];
  historicalAccuracy?: number; // 0-100, how close to actual history
}

export interface VictoryRequirement {
  type: 'trust' | 'grievances' | 'treaty' | 'council-resolution' | 'no-war' | 'time-limit' | 'promises-kept';
  description: string;
  threshold?: number;
  targetNationId?: string;
}

// ============================================================================
// CUBA CRISIS MAJOR ACTORS
// ============================================================================

/**
 * Nation IDs for key actors
 */
export const CubaCrisisActors = {
  USA: 'us',
  USSR: 'soviet',
  CUBA: 'cuba',
  TURKEY: 'turkey',
  UK: 'uk',
  FRANCE: 'france',
  CHINA: 'china',
  UN: 'un', // Treated as mediator/observer
  NATO: 'nato', // Alliance bloc
  WARSAW_PACT: 'warsaw', // Alliance bloc
} as const;

// ============================================================================
// ENHANCED CUBA CRISIS SCENARIO
// ============================================================================

/**
 * The enhanced Cuban Missile Crisis scenario with full diplomacy integration
 */
export const ENHANCED_CUBAN_CRISIS: EnhancedScenarioConfig = {
  // Base scenario config (from existing scenario.ts)
  id: 'cubanCrisis',
  name: 'Cuban Missile Crisis (1962)',
  description:
    'October 16-28, 1962: Experience the thirteen days that brought the world to the brink of nuclear war. Features historically accurate leaders (JFK, Khrushchev, Castro), real diplomatic flashpoints, multi-party negotiations (Cuba, Turkey, NATO, UN), and authentic Cold War mechanics.',
  timeConfig: {
    unit: 'day',
    unitsPerTurn: 1,
    startYear: 1962,
    startMonth: 10,
    displayFormat: 'DD MMM YYYY',
  },
  electionConfig: {
    interval: 0, // No elections during crisis
    enabled: false,
    minMoraleThreshold: 0,
    minPublicOpinionThreshold: 0,
    actionInfluenceMultiplier: 2.0, // Actions have double impact on opinion
    foreignInfluenceEnabled: true,
    loseElectionConsequence: 'none',
  },
  startingDefcon: 3, // Crisis started at DEFCON 3
  modifiers: {
    timeSpeedMultiplier: 0.5, // Faster paced
  },
  eraOverrides: {
    // All turns have same features - it's a 13-day crisis
    early: {
      endTurn: 13,
      unlockedFeatures: [
        'nuclear_missiles',
        'nuclear_bombers',
        'defense_systems',
        'basic_diplomacy',
        'advanced_diplomacy',
        'basic_research',
        'conventional_warfare',
        'territory_control',
        'submarines',
        'propaganda_victory',
        // Phase 1-3 features
        'trust_system',
        'favor_system',
        'promises',
        'grievances',
        'claims',
        'specialized_alliances',
        'diplomatic_currency',
        'international_council',
        'diplomatic_incidents',
        'peace_conferences',
        'espionage_operations',
      ],
    },
  },

  // ============================================================================
  // INITIAL DIPLOMATIC STATE
  // ============================================================================

  initialDiplomaticState: {
    // Pre-set trust levels (0-100 scale)
    trustLevels: {
      [CubaCrisisActors.USA]: {
        [CubaCrisisActors.USSR]: 25, // Untrustworthy - Cold War tensions
        [CubaCrisisActors.CUBA]: 15, // Treacherous - hostile regime
        [CubaCrisisActors.TURKEY]: 75, // Trusted Partner - NATO ally
        [CubaCrisisActors.UK]: 80, // Trusted Partner - special relationship
        [CubaCrisisActors.FRANCE]: 70, // Reliable - NATO ally but De Gaulle independent
      },
      [CubaCrisisActors.USSR]: {
        [CubaCrisisActors.USA]: 25, // Untrustworthy - Cold War tensions
        [CubaCrisisActors.CUBA]: 60, // Reliable - new ally but unpredictable
        [CubaCrisisActors.TURKEY]: 20, // Untrustworthy - NATO member
        [CubaCrisisActors.CHINA]: 35, // Neutral - Sino-Soviet split beginning
        [CubaCrisisActors.UK]: 28, // Untrustworthy
        [CubaCrisisActors.FRANCE]: 30, // Neutral - De Gaulle more independent
      },
      [CubaCrisisActors.CUBA]: {
        [CubaCrisisActors.USA]: 10, // Treacherous - Bay of Pigs invasion
        [CubaCrisisActors.USSR]: 60, // Reliable - protector but may abandon
        [CubaCrisisActors.TURKEY]: 20,
      },
      [CubaCrisisActors.TURKEY]: {
        [CubaCrisisActors.USA]: 75, // Trusted Partner - NATO ally
        [CubaCrisisActors.USSR]: 20, // Untrustworthy - border threat
        [CubaCrisisActors.UK]: 70,
      },
    },

    // Pre-set favor balances (-100 to +100)
    favorBalances: {
      [CubaCrisisActors.USSR]: {
        [CubaCrisisActors.CUBA]: 15, // USSR owes Cuba for hosting missiles
      },
      [CubaCrisisActors.USA]: {
        [CubaCrisisActors.TURKEY]: 10, // USA owes Turkey for Jupiter missiles
        [CubaCrisisActors.UK]: 5, // Close ally, mutual support
      },
      [CubaCrisisActors.CUBA]: {
        [CubaCrisisActors.USSR]: -15, // Cuba has given favor (hosting missiles)
      },
      [CubaCrisisActors.TURKEY]: {
        [CubaCrisisActors.USA]: -10, // Turkey has given favor (hosting missiles)
      },
    },

    // Existing grievances at scenario start
    grievances: {
      [CubaCrisisActors.CUBA]: [
        {
          id: 'cuba-bay-of-pigs',
          type: 'betrayed-ally' as GrievanceType,
          severity: 'severe',
          againstNationId: CubaCrisisActors.USA,
          description: 'Bay of Pigs invasion attempt (April 1961)',
          createdTurn: -550, // ~18 months before (negative = before scenario start)
          expiresIn: 60,
          relationshipPenalty: -45,
          trustPenalty: -50,
          resolved: false,
        },
        {
          id: 'cuba-economic-embargo',
          type: 'sanction-harm' as GrievanceType,
          severity: 'major',
          againstNationId: CubaCrisisActors.USA,
          description: 'US economic embargo causing severe hardship',
          createdTurn: -700, // ~2 years before
          expiresIn: 50,
          relationshipPenalty: -25,
          trustPenalty: -15,
          resolved: false,
        },
      ],
      [CubaCrisisActors.USA]: [
        {
          id: 'usa-missile-deployment',
          type: 'territorial-seizure' as GrievanceType,
          severity: 'major',
          againstNationId: CubaCrisisActors.USSR,
          description: 'Soviet nuclear missiles deployed in Cuba (September 1962)',
          createdTurn: -30, // ~1 month before
          expiresIn: 50,
          relationshipPenalty: -25,
          trustPenalty: -15,
          resolved: false,
        },
      ],
      [CubaCrisisActors.USSR]: [
        {
          id: 'ussr-berlin-crisis',
          type: 'territorial-seizure' as GrievanceType,
          severity: 'major',
          againstNationId: CubaCrisisActors.USA,
          description: 'Western presence in Berlin and Berlin Wall tensions',
          createdTurn: -400, // ~13 months before (Berlin Wall built Aug 1961)
          expiresIn: 45,
          relationshipPenalty: -20,
          trustPenalty: -12,
          resolved: false,
        },
        {
          id: 'ussr-turkey-missiles',
          type: 'territorial-seizure' as GrievanceType,
          severity: 'major',
          againstNationId: CubaCrisisActors.USA,
          description: 'US Jupiter missiles in Turkey threaten Soviet homeland',
          createdTurn: -600, // ~20 months before (deployed 1961)
          expiresIn: 50,
          relationshipPenalty: -22,
          trustPenalty: -18,
          resolved: false,
        },
      ],
      [CubaCrisisActors.TURKEY]: [
        {
          id: 'turkey-border-pressure',
          type: 'territorial-seizure' as GrievanceType,
          severity: 'moderate',
          againstNationId: CubaCrisisActors.USSR,
          description: 'Soviet military pressure on Turkish border',
          createdTurn: -1000, // Historical Cold War tension
          expiresIn: 30,
          relationshipPenalty: -15,
          trustPenalty: -10,
          resolved: false,
        },
      ],
    },

    // Existing territorial and strategic claims
    claims: {
      [CubaCrisisActors.CUBA]: [
        {
          id: 'cuba-guantanamo-claim',
          type: 'liberation' as ClaimType,
          strength: 'strong',
          onNationId: CubaCrisisActors.USA,
          description: 'Liberation of Guantanamo Bay Naval Base from US occupation',
          createdTurn: -1200, // Since 1959 revolution
          warJustification: 20,
          publicSupport: 85,
          renounced: false,
        },
      ],
      [CubaCrisisActors.USA]: [
        {
          id: 'usa-cuban-regime-change',
          type: 'liberation' as ClaimType,
          strength: 'moderate',
          onNationId: CubaCrisisActors.CUBA,
          description: 'Liberation of Cuba from communist regime',
          createdTurn: -1200, // Since Castro took power
          warJustification: 15,
          publicSupport: 60,
          renounced: false,
        },
      ],
      [CubaCrisisActors.USSR]: [
        {
          id: 'ussr-berlin-claim',
          type: 'historical' as ClaimType,
          strength: 'strong',
          onNationId: CubaCrisisActors.USA, // Indirect claim via West Berlin
          description: 'Historical claim to unified Berlin under Soviet influence',
          createdTurn: -5200, // Post-WWII (1945)
          warJustification: 18,
          publicSupport: 70,
          renounced: false,
        },
      ],
    },

    // Specialized alliances with bonuses
    specializedAlliances: {
      [CubaCrisisActors.USA]: [
        {
          id: 'nato-military-alliance',
          type: 'military' as AllianceType,
          withNationId: CubaCrisisActors.TURKEY,
          level: 4,
          createdTurn: -4000, // NATO founded 1949
          combatBonus: 20,
          defenseBonus: 20,
          productionBonus: 0,
          researchBonus: 0,
          trust: 75,
          active: true,
          terms: [
            'Mutual defense pact - attack on one is attack on all',
            'Must consult before major military actions',
            'Forward deployment of nuclear weapons',
          ],
        },
        {
          id: 'nato-uk-alliance',
          type: 'military' as AllianceType,
          withNationId: CubaCrisisActors.UK,
          level: 5,
          createdTurn: -4000,
          combatBonus: 25,
          defenseBonus: 25,
          productionBonus: 5,
          researchBonus: 10,
          trust: 85,
          active: true,
          terms: [
            'Special Relationship - closest alliance',
            'Intelligence sharing (UKUSA Agreement)',
            'Nuclear cooperation',
          ],
        },
      ],
      [CubaCrisisActors.USSR]: [
        {
          id: 'warsaw-cuba-defensive',
          type: 'defensive' as AllianceType,
          withNationId: CubaCrisisActors.CUBA,
          level: 3,
          createdTurn: -100, // Recent alliance (1962)
          combatBonus: 0,
          defenseBonus: 30,
          productionBonus: 0,
          researchBonus: 0,
          trust: 60,
          active: true,
          terms: [
            'Soviet military protection for Cuba',
            'Nuclear umbrella defense',
            'Can be withdrawn if trust falls below 50',
          ],
        },
      ],
      [CubaCrisisActors.TURKEY]: [
        {
          id: 'turkey-nato-military',
          type: 'military' as AllianceType,
          withNationId: CubaCrisisActors.USA,
          level: 4,
          createdTurn: -3600, // Turkey joined NATO 1952
          combatBonus: 20,
          defenseBonus: 20,
          productionBonus: 0,
          researchBonus: 0,
          trust: 75,
          active: true,
          terms: [
            'NATO mutual defense',
            'Forward deployment of US Jupiter missiles',
            'Strategic border with USSR',
          ],
        },
      ],
      [CubaCrisisActors.CUBA]: [
        {
          id: 'cuba-soviet-defensive',
          type: 'defensive' as AllianceType,
          withNationId: CubaCrisisActors.USSR,
          level: 3,
          createdTurn: -100,
          combatBonus: 0,
          defenseBonus: 30,
          productionBonus: 0,
          researchBonus: 0,
          trust: 60,
          active: true,
          terms: [
            'Host Soviet nuclear missiles',
            'Soviet defense guarantee',
            'Castro retains final authority on Cuban soil',
          ],
        },
      ],
    },

    // Initial Diplomatic Influence Points (DIP)
    diplomaticInfluence: {
      [CubaCrisisActors.USA]: {
        points: 80, // Superpower bonus
        capacity: 250,
        perTurnIncome: {
          baseIncome: DIPEarning.BASE_PER_TURN,
          fromAlliances: 4, // 2 high-level alliances
          fromCouncilSeat: DIPEarning.COUNCIL_MEMBER,
          fromMediation: 0,
          fromPeaceYears: 0,
          total: DIPEarning.BASE_PER_TURN + 4 + DIPEarning.COUNCIL_MEMBER + 3, // +3 superpower bonus
        },
        history: [],
      },
      [CubaCrisisActors.USSR]: {
        points: 80, // Superpower bonus
        capacity: 250,
        perTurnIncome: {
          baseIncome: DIPEarning.BASE_PER_TURN,
          fromAlliances: 2, // 1 high-level alliance
          fromCouncilSeat: DIPEarning.COUNCIL_MEMBER,
          fromMediation: 0,
          fromPeaceYears: 0,
          total: DIPEarning.BASE_PER_TURN + 2 + DIPEarning.COUNCIL_MEMBER + 3, // +3 superpower bonus
        },
        history: [],
      },
      [CubaCrisisActors.CUBA]: {
        points: 40, // Small nation, new to international stage
        capacity: 150,
        perTurnIncome: {
          baseIncome: DIPEarning.BASE_PER_TURN,
          fromAlliances: 2, // 1 high-level alliance
          fromCouncilSeat: 0, // Not a council member
          fromMediation: 0,
          fromPeaceYears: 0,
          total: DIPEarning.BASE_PER_TURN + 2,
        },
        history: [],
      },
      [CubaCrisisActors.TURKEY]: {
        points: 55,
        capacity: 180,
        perTurnIncome: {
          baseIncome: DIPEarning.BASE_PER_TURN,
          fromAlliances: 2,
          fromCouncilSeat: 0,
          fromMediation: 0,
          fromPeaceYears: 0,
          total: DIPEarning.BASE_PER_TURN + 2,
        },
        history: [],
      },
      [CubaCrisisActors.UK]: {
        points: 75,
        capacity: 220,
        perTurnIncome: {
          baseIncome: DIPEarning.BASE_PER_TURN,
          fromAlliances: 2,
          fromCouncilSeat: DIPEarning.COUNCIL_MEMBER,
          fromMediation: 0,
          fromPeaceYears: 0,
          total: DIPEarning.BASE_PER_TURN + 2 + DIPEarning.COUNCIL_MEMBER,
        },
        history: [],
      },
      [CubaCrisisActors.FRANCE]: {
        points: 75,
        capacity: 220,
        perTurnIncome: {
          baseIncome: DIPEarning.BASE_PER_TURN,
          fromAlliances: 0,
          fromCouncilSeat: DIPEarning.COUNCIL_MEMBER,
          fromMediation: 0,
          fromPeaceYears: 0,
          total: DIPEarning.BASE_PER_TURN + DIPEarning.COUNCIL_MEMBER,
        },
        history: [],
      },
      [CubaCrisisActors.CHINA]: {
        points: 65,
        capacity: 200,
        perTurnIncome: {
          baseIncome: DIPEarning.BASE_PER_TURN,
          fromAlliances: 0,
          fromCouncilSeat: DIPEarning.COUNCIL_MEMBER,
          fromMediation: 0,
          fromPeaceYears: 0,
          total: DIPEarning.BASE_PER_TURN + DIPEarning.COUNCIL_MEMBER,
        },
        history: [],
      },
    },

    // UN Security Council membership
    councilMembership: {
      [CubaCrisisActors.USA]: 'permanent',
      [CubaCrisisActors.USSR]: 'permanent',
      [CubaCrisisActors.UK]: 'permanent',
      [CubaCrisisActors.FRANCE]: 'permanent',
      [CubaCrisisActors.CHINA]: 'permanent',
      [CubaCrisisActors.CUBA]: 'observer',
      [CubaCrisisActors.TURKEY]: 'observer',
    },

    // Initial relationship scores (parallel to trust, but broader)
    relationships: {
      [CubaCrisisActors.USA]: {
        [CubaCrisisActors.USSR]: -60,
        [CubaCrisisActors.CUBA]: -80,
        [CubaCrisisActors.TURKEY]: 70,
        [CubaCrisisActors.UK]: 85,
        [CubaCrisisActors.FRANCE]: 60,
      },
      [CubaCrisisActors.USSR]: {
        [CubaCrisisActors.USA]: -60,
        [CubaCrisisActors.CUBA]: 50,
        [CubaCrisisActors.TURKEY]: -55,
        [CubaCrisisActors.CHINA]: -10, // Sino-Soviet split
        [CubaCrisisActors.UK]: -50,
        [CubaCrisisActors.FRANCE]: -30,
      },
      [CubaCrisisActors.CUBA]: {
        [CubaCrisisActors.USA]: -85,
        [CubaCrisisActors.USSR]: 50,
      },
      [CubaCrisisActors.TURKEY]: {
        [CubaCrisisActors.USA]: 70,
        [CubaCrisisActors.USSR]: -55,
      },
    },
  },

  // ============================================================================
  // SPECIAL CRISIS RULES
  // ============================================================================

  specialRules: {
    backChannelEnabled: true,
    backChannelDIPCost: 20,

    emergencySessionsEnabled: true,
    emergencySessionInterval: 3, // UN session every 3 turns

    cubanAutonomy: {
      enabled: true,
      trustThreshold: 45, // If USSR-Cuba trust falls below 45, Castro acts independently
      escalationProbability: 25, // 25% chance Cuba escalates each turn if autonomous
    },

    historicalAccuracyTracking: true,

    escalation: {
      enabled: true,
      u2ShootdownTurn: 12, // Turn 12 (October 27, 1962)
      submarineEncounterTurn: 11, // Turn 11 (October 27, 1962)
      automaticIncidents: false, // Triggered by escalation level
    },

    superpowerBonuses: {
      usDIPBonus: 3,
      ussrDIPBonus: 3,
      vetoReduction: 10, // Veto costs 40 instead of 50
    },

    secretDiplomacy: {
      enabled: true,
      turkeyMissilesSecret: true, // Jupiter missile removal can be secret
      privatePromisesEnabled: true,
    },

    activeThirdParties: [
      CubaCrisisActors.CUBA,
      CubaCrisisActors.TURKEY,
      CubaCrisisActors.UK,
      CubaCrisisActors.FRANCE,
    ],
    thirdPartyInfluence: 40, // Third parties have significant but not decisive influence
  },

  // ============================================================================
  // SCHEDULED HISTORICAL INCIDENTS
  // ============================================================================

  scheduledIncidents: [
    // Turn 1: Discovery of missiles (scenario start)
    {
      turn: 1,
      incident: {
        id: 'excomm-briefing',
        type: 'diplomatic-insult' as IncidentType,
        title: 'EXCOMM Emergency Briefing',
        description:
          'U-2 reconnaissance photos confirm Soviet nuclear missile sites under construction in Cuba. Executive Committee of the National Security Council convenes emergency session.',
        primaryNationId: CubaCrisisActors.USSR,
        targetNationId: CubaCrisisActors.USA,
        involvedNations: [CubaCrisisActors.CUBA],
        severity: 'serious',
        relationshipImpact: -15,
        trustImpact: -20,
        resolvable: true,
        status: 'active',
        escalationLevel: 30,
        escalationRate: 5,
        resolutionOptions: [],
      },
      triggerCondition: 'automatic',
    },

    // Turn 3: Naval quarantine announcement
    {
      turn: 3,
      incident: {
        id: 'naval-quarantine',
        type: 'maritime-incident' as IncidentType,
        title: 'US Naval Quarantine of Cuba',
        description:
          'President Kennedy announces "quarantine" (naval blockade) of Cuba. US Navy establishes 500-mile defensive zone. Soviet ships approaching.',
        primaryNationId: CubaCrisisActors.USA,
        targetNationId: CubaCrisisActors.USSR,
        involvedNations: [CubaCrisisActors.CUBA],
        severity: 'severe',
        relationshipImpact: -20,
        trustImpact: -15,
        resolvable: true,
        status: 'escalating',
        escalationLevel: 50,
        escalationRate: 8,
        resolutionOptions: [],
      },
      triggerCondition: 'automatic',
    },

    // Turn 6: UN Security Council confrontation
    {
      turn: 6,
      incident: {
        id: 'un-confrontation',
        type: 'diplomatic-insult' as IncidentType,
        title: 'UN Security Council Showdown',
        description:
          'US Ambassador Adlai Stevenson confronts Soviet Ambassador Valerian Zorin with U-2 photos. "Don\'t wait for the translation!" Dramatic moment broadcast worldwide.',
        primaryNationId: CubaCrisisActors.USA,
        targetNationId: CubaCrisisActors.USSR,
        involvedNations: [CubaCrisisActors.UK, CubaCrisisActors.FRANCE],
        severity: 'moderate',
        relationshipImpact: -10,
        trustImpact: -5,
        resolvable: true,
        status: 'active',
        escalationLevel: 55,
        escalationRate: 3,
        resolutionOptions: [],
      },
      triggerCondition: 'automatic',
    },

    // Turn 8: Strategic Air Command DEFCON 2
    {
      turn: 8,
      incident: {
        id: 'defcon-2-alert',
        type: 'arms-buildup' as IncidentType,
        title: 'Strategic Air Command DEFCON 2',
        description:
          'General Curtis LeMay orders Strategic Air Command to DEFCON 2 - one step from nuclear war. B-52 bombers with nuclear weapons on continuous airborne alert.',
        primaryNationId: CubaCrisisActors.USA,
        targetNationId: CubaCrisisActors.USSR,
        involvedNations: [],
        severity: 'catastrophic',
        relationshipImpact: -25,
        trustImpact: -20,
        resolvable: true,
        status: 'escalating',
        escalationLevel: 75,
        escalationRate: 10,
        resolutionOptions: [],
      },
      triggerCondition: 'automatic',
    },

    // Turn 11: Submarine B-59 incident
    {
      turn: 11,
      incident: {
        id: 'submarine-b59',
        type: 'maritime-incident' as IncidentType,
        title: 'Soviet Submarine B-59 Depth-Charged',
        description:
          'US Navy destroyers depth-charge Soviet submarine B-59 to force it to surface. Unknown to Americans, sub carries nuclear torpedo. Captain Savitsky orders nuclear weapon armed. Vasili Arkhipov refuses to authorize launch.',
        primaryNationId: CubaCrisisActors.USA,
        targetNationId: CubaCrisisActors.USSR,
        involvedNations: [],
        severity: 'catastrophic',
        relationshipImpact: -35,
        trustImpact: -30,
        resolvable: true,
        status: 'escalating',
        escalationLevel: 90,
        escalationRate: 15,
        resolutionOptions: [],
      },
      triggerCondition: 'escalation-threshold',
      escalationThreshold: 70,
    },

    // Turn 12: U-2 shootdown
    {
      turn: 12,
      incident: {
        id: 'u2-shootdown',
        type: 'border-skirmish' as IncidentType,
        title: 'U-2 Shot Down Over Cuba',
        description:
          'Major Rudolf Anderson\'s U-2 reconnaissance plane shot down over Cuba by SA-2 surface-to-air missile. First American combat casualty of the crisis. Joint Chiefs demand immediate retaliation.',
        primaryNationId: CubaCrisisActors.CUBA, // Castro ordered air defense active
        targetNationId: CubaCrisisActors.USA,
        involvedNations: [CubaCrisisActors.USSR],
        severity: 'catastrophic',
        relationshipImpact: -40,
        trustImpact: -25,
        resolvable: true,
        status: 'escalating',
        escalationLevel: 95,
        escalationRate: 20,
        resolutionOptions: [],
      },
      triggerCondition: 'escalation-threshold',
      escalationThreshold: 80,
    },

    // Turn 10: First Khrushchev letter
    {
      turn: 10,
      incident: {
        id: 'khrushchev-first-letter',
        type: 'diplomatic-insult' as IncidentType,
        title: 'Khrushchev\'s First Letter',
        description:
          'Personal letter from Khrushchev to Kennedy arrives. Emotional and rambling, but offers deal: Remove missiles from Cuba if US pledges not to invade. Appears to be written personally.',
        primaryNationId: CubaCrisisActors.USSR,
        targetNationId: CubaCrisisActors.USA,
        involvedNations: [],
        severity: 'moderate',
        relationshipImpact: 5, // Positive - opening for negotiation
        trustImpact: 3,
        resolvable: true,
        status: 'de-escalating',
        escalationLevel: 70,
        escalationRate: -10,
        resolutionOptions: [],
      },
      triggerCondition: 'automatic',
    },

    // Turn 11: Second Khrushchev letter
    {
      turn: 11,
      incident: {
        id: 'khrushchev-second-letter',
        type: 'trade-dispute' as IncidentType,
        title: 'Khrushchev\'s Second Letter - "Two Telegrams Crisis"',
        description:
          'Second letter from Khrushchev arrives, formal and hardline. Demands removal of Jupiter missiles from Turkey in exchange for Cuba missiles. Contradicts previous letter. Appears written by Soviet foreign ministry. Creates confusion - which offer is real?',
        primaryNationId: CubaCrisisActors.USSR,
        targetNationId: CubaCrisisActors.USA,
        involvedNations: [CubaCrisisActors.TURKEY],
        severity: 'serious',
        relationshipImpact: -10,
        trustImpact: -8,
        resolvable: true,
        status: 'escalating',
        escalationLevel: 80,
        escalationRate: 5,
        resolutionOptions: [],
      },
      triggerCondition: 'automatic',
    },
  ],

  // ============================================================================
  // VICTORY CONDITIONS
  // ============================================================================

  victoryConditions: [
    {
      id: 'diplomatic-victory',
      type: 'diplomatic',
      name: 'Diplomatic Resolution',
      description:
        'Achieve peaceful resolution through diplomatic means without nuclear war or major escalation.',
      requirements: [
        {
          type: 'trust',
          description: 'Achieve 60+ trust with opponent',
          threshold: 60,
          targetNationId: CubaCrisisActors.USSR, // Or USA depending on player
        },
        {
          type: 'grievances',
          description: 'Resolve all severe grievances',
          threshold: 0,
        },
        {
          type: 'no-war',
          description: 'Reach turn 13 without nuclear war',
        },
        {
          type: 'treaty',
          description: 'Sign peace treaty with verification',
        },
      ],
      historicalAccuracy: 95, // Matches real outcome
    },
    {
      id: 'military-victory',
      type: 'military',
      name: 'Nuclear War',
      description: 'Everyone loses. Nuclear war destroys civilization.',
      requirements: [
        {
          type: 'no-war',
          description: 'Fail to prevent nuclear war',
        },
      ],
      historicalAccuracy: 0, // Did not happen
    },
    {
      id: 'propaganda-victory',
      type: 'propaganda',
      name: 'Propaganda Victory',
      description:
        'Win global public opinion war while resolving crisis. Demonstrate superiority of your system.',
      requirements: [
        {
          type: 'council-resolution',
          description: 'Pass UN resolution with 75%+ support',
          threshold: 75,
        },
        {
          type: 'no-war',
          description: 'Resolve crisis peacefully',
        },
      ],
      historicalAccuracy: 60, // Both sides claimed victory
    },
    {
      id: 'historical-victory',
      type: 'historical',
      name: 'Historical Accuracy',
      description:
        'Match the historical outcome: Soviet missiles removed, US no-invasion pledge, secret Turkey missile removal.',
      requirements: [
        {
          type: 'treaty',
          description: 'Public deal: Remove Cuba missiles, no-invasion pledge',
        },
        {
          type: 'treaty',
          description: 'Secret deal: Remove Turkey missiles (not public)',
        },
        {
          type: 'promises-kept',
          description: 'Keep all promises made',
          threshold: 100,
        },
        {
          type: 'time-limit',
          description: 'Resolve by turn 13',
        },
      ],
      historicalAccuracy: 100, // Perfect match
    },
    {
      id: 'survival-victory',
      type: 'survival',
      name: 'Survival',
      description: 'Simply survive the 13 days without triggering nuclear war.',
      requirements: [
        {
          type: 'no-war',
          description: 'Reach turn 13 without nuclear war',
        },
      ],
      historicalAccuracy: 70, // Basic outcome achieved
    },
  ],
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get initial diplomatic state for a specific nation
 */
export function getInitialDiplomaticStateForNation(
  nationId: string,
  state: InitialDiplomaticState
): {
  trustRecords: Record<string, number>;
  favorBalances: Record<string, number>;
  grievances: Grievance[];
  claims: Claim[];
  specializedAlliances: SpecializedAlliance[];
  diplomaticInfluence: Partial<DiplomaticInfluence> | undefined;
  councilMembership: CouncilMembershipType;
  relationships: Record<string, number>;
} {
  return {
    trustRecords: state.trustLevels[nationId] || {},
    favorBalances: state.favorBalances[nationId] || {},
    grievances: state.grievances[nationId] || [],
    claims: state.claims[nationId] || [],
    specializedAlliances: state.specializedAlliances[nationId] || [],
    diplomaticInfluence: state.diplomaticInfluence[nationId],
    councilMembership: state.councilMembership[nationId] || 'none',
    relationships: state.relationships[nationId] || {},
  };
}

/**
 * Get scheduled incidents for a specific turn
 */
export function getScheduledIncidentsForTurn(
  turn: number,
  incidents: ScheduledIncident[],
  currentEscalation: number = 0
): DiplomaticIncident[] {
  return incidents
    .filter((scheduled) => {
      if (scheduled.turn !== turn) return false;

      switch (scheduled.triggerCondition) {
        case 'automatic':
          return true;
        case 'escalation-threshold':
          return currentEscalation >= (scheduled.escalationThreshold || 0);
        case 'player-choice':
          return false; // Requires player trigger
        default:
          return true;
      }
    })
    .map((scheduled) => scheduled.incident as DiplomaticIncident);
}

/**
 * Calculate historical accuracy score
 */
export function calculateHistoricalAccuracy(
  currentState: any // GameState
): number {
  let accuracy = 100;

  // Deduct points for deviation from history
  // - Nuclear war: -100 (instant 0%)
  // - Major wars: -50
  // - Broken historical alliances: -20
  // - Wrong outcome: -30
  // - Timing off: -10 per turn deviation

  // This would be implemented based on actual game state
  return accuracy;
}

/**
 * Check if victory condition is met
 */
export function checkVictoryCondition(
  condition: VictoryCondition,
  currentState: any // GameState
): boolean {
  // Implement victory condition checking logic
  // Would check all requirements in condition.requirements
  return false; // Placeholder
}
