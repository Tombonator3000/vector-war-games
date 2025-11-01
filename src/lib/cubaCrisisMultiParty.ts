/**
 * Multi-Party Dynamics for Enhanced Cuba Crisis
 *
 * Implements active third parties beyond US-USSR:
 * - Cuba (Castro's independence)
 * - Turkey (NATO ally with own interests)
 * - NATO (alliance bloc)
 * - Warsaw Pact (Soviet alliance)
 * - UN / Non-Aligned Movement
 *
 * These parties can:
 * - React to player decisions
 * - Make independent moves
 * - Escalate or de-escalate the crisis
 * - Influence final outcome
 */

import type { Nation } from '@/types/game';
import type { DiplomaticIncident, IncidentType } from '@/types/diplomacyPhase3';
import type { Grievance, Claim } from '@/types/grievancesAndClaims';

// ============================================================================
// THIRD PARTY ACTOR TYPES
// ============================================================================

/**
 * Third party actor that can influence the crisis
 */
export interface ThirdPartyActor {
  id: string;
  name: string;
  type: 'nation' | 'alliance' | 'organization';
  leader?: string;

  /** Current stance toward crisis */
  stance: ThirdPartyStance;

  /** Autonomy level - how independently they act */
  autonomy: number; // 0-100

  /** Influence over crisis outcome */
  influence: number; // 0-100

  /** Relationships with major powers */
  relationships: {
    us: number; // -100 to +100
    ussr: number;
  };

  /** Trust with major powers */
  trust: {
    us: number; // 0-100
    ussr: number;
  };

  /** Possible actions this actor can take */
  possibleActions: ThirdPartyAction[];

  /** Current objectives */
  objectives: string[];

  /** Red lines that trigger escalation */
  redLines: RedLine[];

  /** Historical context */
  background: string;
}

export type ThirdPartyStance =
  | 'strongly-pro-us'
  | 'pro-us'
  | 'neutral-lean-us'
  | 'neutral'
  | 'neutral-lean-ussr'
  | 'pro-ussr'
  | 'strongly-pro-ussr'
  | 'independent'
  | 'mediator';

/**
 * Action a third party can take
 */
export interface ThirdPartyAction {
  id: string;
  name: string;
  description: string;
  type: 'diplomatic' | 'military' | 'economic' | 'public-opinion';

  /** Probability this action is taken */
  probability: number; // 0-100

  /** Conditions that must be met */
  conditions: ActionCondition[];

  /** Effects if action is taken */
  effects: ThirdPartyActionEffects;

  /** Can be vetoed by alliance leader? */
  requiresApproval?: boolean;
  approvalFrom?: string; // Nation ID
}

export interface ActionCondition {
  type: 'trust-threshold' | 'relationship-threshold' | 'defcon-level' | 'turn-number' | 'event-occurred' | 'escalation-level';
  threshold?: number;
  comparison: 'greater' | 'less' | 'equal';
  target?: string;
}

export interface ThirdPartyActionEffects {
  /** Impact on relationships */
  relationshipChanges: Record<string, number>;

  /** Impact on trust */
  trustChanges: Record<string, number>;

  /** Impact on crisis escalation */
  escalationChange: number; // -50 to +50

  /** Impact on DEFCON */
  defconChange?: number;

  /** Create incident? */
  createIncident?: Partial<DiplomaticIncident>;

  /** Create grievance? */
  createGrievance?: Partial<Grievance>;

  /** Narrative description */
  narrative: string;

  /** Follow-up options for player */
  playerOptions?: {
    id: string;
    text: string;
    diplomaticEffect: any;
  }[];
}

/**
 * Red line that triggers reaction
 */
export interface RedLine {
  id: string;
  description: string;
  condition: ActionCondition;
  reaction: ThirdPartyAction;
  severity: 'minor' | 'major' | 'critical';
}

// ============================================================================
// CUBA - CASTRO'S INDEPENDENCE
// ============================================================================

export const CUBA_ACTOR: ThirdPartyActor = {
  id: 'cuba',
  name: 'Republic of Cuba',
  type: 'nation',
  leader: 'Fidel Castro',
  stance: 'strongly-pro-ussr',
  autonomy: 65, // Castro is independent-minded despite Soviet alliance
  influence: 40, // Significant influence - crisis is on Cuban soil
  relationships: {
    us: -85,
    ussr: 50, // Allied but wary of being pawn
  },
  trust: {
    us: 10, // Post-Bay of Pigs
    ussr: 60, // Reliable but worried Soviets will abandon Cuba
  },
  possibleActions: [
    {
      id: 'castro-escalate-independence',
      name: 'Castro Acts Independently',
      description:
        'Castro orders Cuban forces to take aggressive action without Soviet approval. Shoots down reconnaissance planes or attacks Guantanamo Bay.',
      type: 'military',
      probability: 25, // Base 25% if conditions met
      conditions: [
        {
          type: 'trust-threshold',
          threshold: 45,
          comparison: 'less',
          target: 'ussr',
        },
        {
          type: 'escalation-level',
          threshold: 60,
          comparison: 'greater',
        },
      ],
      effects: {
        relationshipChanges: {
          us: -20,
          ussr: -15, // Soviets upset by unauthorized action
        },
        trustChanges: {
          ussr: -10,
        },
        escalationChange: 25,
        defconChange: -1, // Moves toward war
        createIncident: {
          type: 'border-skirmish' as IncidentType,
          title: 'Cuban Forces Attack Without Soviet Authorization',
          description:
            'Fidel Castro, feeling cornered and fearing Soviet betrayal, orders Cuban forces to take matters into their own hands. This unauthorized escalation shocks Moscow and threatens Soviet control of the situation.',
          severity: 'severe',
          relationshipImpact: -20,
          trustImpact: -15,
          escalationLevel: 75,
        },
        narrative:
          '⚠️ CASTRO ACTS ALONE: Fidel Castro has ordered Cuban forces to open fire without Soviet approval! Khrushchev is furious - he\'s losing control of his ally. The crisis has spun out of anyone\'s control.',
      },
      requiresApproval: false, // Castro acts independently
    },
    {
      id: 'castro-demand-guarantees',
      name: 'Castro Demands Security Guarantees',
      description:
        'Castro insists on concrete security guarantees from USSR before allowing missile removal. Complicates Soviet-US negotiations.',
      type: 'diplomatic',
      probability: 50,
      conditions: [
        {
          type: 'turn-number',
          threshold: 8,
          comparison: 'greater',
        },
      ],
      effects: {
        relationshipChanges: {
          ussr: -5,
        },
        escalationChange: 5,
        narrative:
          '🇨🇺 Castro\'s Statement: "We will not be pawns in a superpower game. Cuba demands ironclad guarantees before any missiles are moved." This complicates Khrushchev\'s negotiations.',
      },
    },
    {
      id: 'castro-refuse-inspections',
      name: 'Castro Refuses UN Inspections',
      description:
        'Castro refuses to allow UN inspectors to verify missile removal, citing national sovereignty. Undermines any deal reached.',
      type: 'diplomatic',
      probability: 60,
      conditions: [
        {
          type: 'event-occurred',
          target: 'negotiated-settlement',
          comparison: 'equal',
        },
      ],
      effects: {
        relationshipChanges: {
          us: -15,
          ussr: -10, // Embarrasses Soviets
        },
        trustChanges: {
          us: -12,
        },
        escalationChange: 10,
        narrative:
          '🇨🇺 Castro\'s Defiance: "Cuba is not a Soviet colony. We will not allow foreign inspectors to violate our sovereignty!" The deal you negotiated is now unverifiable.',
        playerOptions: [
          {
            id: 'accept-no-inspections',
            text: 'Accept No Inspections (Trust U-2 surveillance)',
            diplomaticEffect: {
              trust: { ussr: 5 },
              relationship: { cuba: 10 },
            },
          },
          {
            id: 'demand-inspections',
            text: 'Demand Inspections (Pressure USSR)',
            diplomaticEffect: {
              trust: { ussr: -5 },
              relationship: { soviet: -8 },
            },
          },
        ],
      },
    },
  ],
  objectives: [
    'Preserve Cuban sovereignty',
    'Prevent US invasion',
    'Maintain Soviet protection',
    'Avoid becoming Soviet puppet',
    'Remove Guantanamo Bay (opportunistic)',
  ],
  redLines: [
    {
      id: 'cuba-invasion',
      description: 'US invades Cuba',
      condition: {
        type: 'event-occurred',
        target: 'us-invasion',
        comparison: 'equal',
      },
      reaction: {
        id: 'cuba-all-out-defense',
        name: 'All-Out Defense',
        description: 'Cuba fights to the death, calls on USSR to honor defense pact',
        type: 'military',
        probability: 100,
        conditions: [],
        effects: {
          relationshipChanges: { us: -100 },
          trustChanges: {},
          escalationChange: 50,
          narrative: '🇨🇺 Cuban forces resist fiercely. Castro calls on USSR to honor the defense pact!',
        },
      },
      severity: 'critical',
    },
    {
      id: 'cuba-abandoned',
      description: 'USSR withdraws missiles without consulting Cuba',
      condition: {
        type: 'trust-threshold',
        threshold: 40,
        comparison: 'less',
        target: 'ussr',
      },
      reaction: {
        id: 'cuba-pivot',
        name: 'Cuba Seeks Independence',
        description: 'Feeling betrayed, Castro pursues independent foreign policy',
        type: 'diplomatic',
        probability: 80,
        conditions: [],
        effects: {
          relationshipChanges: { ussr: -25 },
          trustChanges: { ussr: -30 },
          escalationChange: -10, // Reduces crisis but strains alliance
          narrative:
            '🇨🇺 Castro: "The Soviets have used us as pawns. Cuba will forge its own path!" Soviet-Cuban relations are damaged for years.',
        },
      },
      severity: 'major',
    },
  ],
  background:
    'Fidel Castro took power in 1959, overthrowing the US-backed Batista regime. After the failed Bay of Pigs invasion (1961), he turned to the Soviet Union for protection. Castro is fiercely independent and fears being treated as a Soviet puppet.',
};

// ============================================================================
// TURKEY - NATO ALLY WITH OWN INTERESTS
// ============================================================================

export const TURKEY_ACTOR: ThirdPartyActor = {
  id: 'turkey',
  name: 'Republic of Turkey',
  type: 'nation',
  leader: 'İsmet İnönü',
  stance: 'strongly-pro-us',
  autonomy: 50, // NATO ally but has own interests
  influence: 35, // Important because of Jupiter missiles
  relationships: {
    us: 70,
    ussr: -55, // Historic adversary
  },
  trust: {
    us: 75,
    ussr: 20,
  },
  possibleActions: [
    {
      id: 'turkey-refuse-removal',
      name: 'Turkey Refuses Missile Removal',
      description:
        'Turkish government refuses to allow removal of Jupiter missiles, seeing them as vital defense against USSR.',
      type: 'diplomatic',
      probability: 40,
      conditions: [
        {
          type: 'event-occurred',
          target: 'public-turkey-trade',
          comparison: 'equal',
        },
      ],
      effects: {
        relationshipChanges: {
          us: -20, // Complicates US diplomacy
          ussr: -10,
        },
        trustChanges: {
          us: -15,
        },
        escalationChange: 15,
        narrative:
          '🇹🇷 Turkish Statement: "The Jupiter missiles are Turkey\'s sovereign defense. We will not allow them to be bargaining chips in superpower negotiations. NATO must protect its members, not sell them out."',
        playerOptions: [
          {
            id: 'pressure-turkey',
            text: 'Pressure Turkey to Comply',
            diplomaticEffect: {
              trust: { turkey: -20 },
              relationship: { turkey: -25 },
              allianceLevel: { nato: -10 },
            },
          },
          {
            id: 'respect-turkey',
            text: 'Respect Turkish Sovereignty',
            diplomaticEffect: {
              trust: { turkey: 10 },
              escalation: 15, // Crisis continues
            },
          },
        ],
      },
    },
    {
      id: 'turkey-demand-consultation',
      name: 'Turkey Demands NATO Consultation',
      description:
        'Turkey invokes NATO consultation procedures, demanding voice in any deal involving Turkish territory.',
      type: 'diplomatic',
      probability: 70,
      conditions: [
        {
          type: 'turn-number',
          threshold: 6,
          comparison: 'greater',
        },
      ],
      effects: {
        relationshipChanges: {
          us: -5,
        },
        escalationChange: 5,
        narrative:
          '🇹🇷 Turkey Invokes Article 4: Turkish government formally requests NATO consultation under Article 4. Any deal involving Turkish missiles must be discussed with all NATO members. This slows negotiations.',
      },
    },
    {
      id: 'turkey-offer-alternative',
      name: 'Turkey Offers Alternative Basing',
      description:
        'Turkey offers to host different weapons systems if Jupiters are removed, preserving NATO commitment.',
      type: 'diplomatic',
      probability: 30,
      conditions: [
        {
          type: 'trust-threshold',
          threshold: 65,
          comparison: 'greater',
          target: 'us',
        },
      ],
      effects: {
        relationshipChanges: {
          us: 10,
          ussr: -5, // Worried about replacement systems
        },
        trustChanges: {
          us: 8,
        },
        escalationChange: -8,
        narrative:
          '🇹🇷 Turkish Proposal: "If Jupiter missiles must go, Turkey will host Polaris submarine access instead. NATO commitment to our defense must remain ironclad."',
      },
    },
  ],
  objectives: [
    'Maintain US/NATO protection',
    'Preserve national sovereignty',
    'Counter Soviet threat',
    'Avoid being bargaining chip',
    'Ensure consultation on defense matters',
  ],
  redLines: [
    {
      id: 'turkey-betrayed',
      description: 'US publicly trades away Turkish missiles without consultation',
      condition: {
        type: 'event-occurred',
        target: 'public-trade-no-consultation',
        comparison: 'equal',
      },
      reaction: {
        id: 'turkey-nato-crisis',
        name: 'Turkey Threatens NATO Withdrawal',
        description:
          'Feeling betrayed, Turkey threatens to leave NATO and pursue independent foreign policy',
        type: 'diplomatic',
        probability: 90,
        conditions: [],
        effects: {
          relationshipChanges: { us: -40 },
          trustChanges: { us: -35 },
          escalationChange: 10,
          createGrievance: {
            type: 'betrayed-ally',
            severity: 'severe',
            description: 'US traded Turkish missiles without consultation - NATO alliance betrayed',
          },
          narrative:
            '🇹🇷 TURKISH FURY: "We trusted NATO to protect us, not sell us out! Turkey will reconsider its alliance commitments." The Turkish parliament debates leaving NATO. Your alliance is in crisis.',
        },
      },
      severity: 'critical',
    },
  ],
  background:
    'Turkey joined NATO in 1952 as a bulwark against Soviet expansion. Jupiter missiles were deployed in 1961. Turkey has a long history of conflict with Russia/USSR and sees NATO membership as vital security guarantee.',
};

// ============================================================================
// NATO ALLIANCE BLOC
// ============================================================================

export const NATO_ACTOR: ThirdPartyActor = {
  id: 'nato',
  name: 'North Atlantic Treaty Organization',
  type: 'alliance',
  leader: 'Secretary General Dirk Stikker',
  stance: 'strongly-pro-us',
  autonomy: 45, // Members have varying autonomy
  influence: 60, // Major alliance
  relationships: {
    us: 80, // US is alliance leader
    ussr: -70,
  },
  trust: {
    us: 75,
    ussr: 15,
  },
  possibleActions: [
    {
      id: 'nato-support-quarantine',
      name: 'NATO Endorses Quarantine',
      description: 'NATO council formally endorses US quarantine, providing legitimacy and coordination.',
      type: 'diplomatic',
      probability: 80,
      conditions: [
        {
          type: 'event-occurred',
          target: 'quarantine-established',
          comparison: 'equal',
        },
      ],
      effects: {
        relationshipChanges: {
          us: 5,
        },
        trustChanges: {
          us: 5,
        },
        escalationChange: -5,
        narrative:
          '🛡️ NATO Council: "The alliance stands united. All NATO members support the quarantine of Cuba. This is collective defense in action."',
      },
    },
    {
      id: 'nato-consultation-demanded',
      name: 'NATO Demands Consultation',
      description:
        'NATO members demand full consultation before any deal involving alliance territory or weapons.',
      type: 'diplomatic',
      probability: 70,
      conditions: [
        {
          type: 'turn-number',
          threshold: 5,
          comparison: 'greater',
        },
      ],
      effects: {
        relationshipChanges: {
          us: -8,
        },
        escalationChange: 5,
        narrative:
          '🛡️ NATO Secretary General: "Article 4 consultations are mandatory. Any deal involving NATO deployments must be discussed with all member states. The US cannot act unilaterally."',
      },
    },
    {
      id: 'nato-mobilization',
      name: 'NATO Mobilizes Forces',
      description: 'NATO puts forces on high alert in Europe, preparing for possible Soviet move on Berlin.',
      type: 'military',
      probability: 60,
      conditions: [
        {
          type: 'defcon-level',
          threshold: 2,
          comparison: 'less',
        },
      ],
      effects: {
        relationshipChanges: {
          ussr: -10,
        },
        escalationChange: 10,
        narrative:
          '🛡️ NATO Alert: NATO forces across Europe move to high readiness. Armored divisions in West Germany deploy to border positions. The Soviets respond by mobilizing Warsaw Pact forces. Tension in Europe soars.',
      },
    },
  ],
  objectives: [
    'Maintain alliance unity',
    'Support US leadership',
    'Protect member states',
    'Ensure consultation protocols',
    'Deter Soviet aggression',
  ],
  redLines: [
    {
      id: 'nato-unilateral-action',
      description: 'US takes unilateral action affecting NATO without consultation',
      condition: {
        type: 'event-occurred',
        target: 'unilateral-nato-decision',
        comparison: 'equal',
      },
      reaction: {
        id: 'nato-fracture',
        name: 'NATO Unity Fractures',
        description: 'Alliance members question US leadership and consider independent policies',
        type: 'diplomatic',
        probability: 80,
        conditions: [],
        effects: {
          relationshipChanges: { us: -20 },
          trustChanges: { us: -25 },
          escalationChange: 5,
          narrative:
            '🛡️ NATO Crisis: European allies are furious at US unilateralism. France threatens to leave NATO military command. The alliance you sought to protect is fracturing.',
        },
      },
      severity: 'critical',
    },
  ],
  background:
    'NATO was founded in 1949 as a collective defense against Soviet expansion. By 1962, it includes 15 members. The alliance operates on consensus, with member consultation being a fundamental principle.',
};

// ============================================================================
// WARSAW PACT ALLIANCE BLOC
// ============================================================================

export const WARSAW_PACT_ACTOR: ThirdPartyActor = {
  id: 'warsaw',
  name: 'Warsaw Pact',
  type: 'alliance',
  leader: 'Soviet Union (Dominant)',
  stance: 'strongly-pro-ussr',
  autonomy: 25, // USSR dominated
  influence: 50,
  relationships: {
    us: -75,
    ussr: 70,
  },
  trust: {
    us: 10,
    ussr: 55, // Some members resent Soviet dominance
  },
  possibleActions: [
    {
      id: 'warsaw-pact-mobilization',
      name: 'Warsaw Pact Mobilizes',
      description: 'Warsaw Pact forces mobilize in Eastern Europe, preparing for possible NATO aggression.',
      type: 'military',
      probability: 70,
      conditions: [
        {
          type: 'defcon-level',
          threshold: 2,
          comparison: 'less',
        },
      ],
      effects: {
        relationshipChanges: {
          us: -10,
        },
        escalationChange: 10,
        narrative:
          '⚔️ Warsaw Pact: Soviet allies mobilize across Eastern Europe. East German forces move to the Berlin Wall. Polish divisions deploy westward. The Cold War turns hot in Europe.',
      },
    },
    {
      id: 'warsaw-pact-support',
      name: 'Warsaw Pact Endorses Soviet Position',
      description: 'Warsaw Pact nations formally endorse Soviet actions in Cuba.',
      type: 'diplomatic',
      probability: 90,
      conditions: [
        {
          type: 'turn-number',
          threshold: 3,
          comparison: 'greater',
        },
      ],
      effects: {
        relationshipChanges: {
          ussr: 5,
        },
        escalationChange: 2,
        narrative:
          '⚔️ Warsaw Pact Declaration: "The socialist nations stand with Cuba and the Soviet Union against imperialist aggression. Cuba has the right to defend itself."',
      },
    },
  ],
  objectives: [
    'Support Soviet leadership',
    'Defend socialist bloc',
    'Counter NATO',
    'Prevent Western aggression',
  ],
  redLines: [
    {
      id: 'warsaw-attack',
      description: 'NATO attacks Warsaw Pact forces',
      condition: {
        type: 'event-occurred',
        target: 'nato-attack',
        comparison: 'equal',
      },
      reaction: {
        id: 'warsaw-counterattack',
        name: 'Warsaw Pact Counterattack',
        description: 'Full Warsaw Pact military response',
        type: 'military',
        probability: 100,
        conditions: [],
        effects: {
          relationshipChanges: { us: -50 },
          trustChanges: {},
          escalationChange: 50,
          narrative: '⚔️ Warsaw Pact forces launch counterattack! World War III has begun.',
        },
      },
      severity: 'critical',
    },
  ],
  background:
    'The Warsaw Pact was founded in 1955 as a response to NATO and West German rearmament. It is dominated by the Soviet Union, with member states having limited autonomy.',
};

// ============================================================================
// MULTI-PARTY SYSTEM MANAGER
// ============================================================================

/**
 * All third party actors in the crisis
 */
export const ALL_THIRD_PARTIES: ThirdPartyActor[] = [
  CUBA_ACTOR,
  TURKEY_ACTOR,
  NATO_ACTOR,
  WARSAW_PACT_ACTOR,
];

/**
 * Evaluate all third party actions for a given game state
 */
export function evaluateThirdPartyActions(
  gameState: any,
  turn: number
): {
  actor: ThirdPartyActor;
  action: ThirdPartyAction;
}[] {
  const triggeredActions: { actor: ThirdPartyActor; action: ThirdPartyAction }[] = [];

  for (const actor of ALL_THIRD_PARTIES) {
    // Check each possible action
    for (const action of actor.possibleActions) {
      // Check if conditions are met
      const conditionsMet = action.conditions.every((condition) =>
        checkActionCondition(condition, gameState, actor)
      );

      if (conditionsMet) {
        // Roll probability
        const roll = Math.random() * 100;
        if (roll < action.probability) {
          // Adjust probability based on actor's autonomy
          const autonomyAdjusted = action.probability * (actor.autonomy / 100);
          if (roll < autonomyAdjusted) {
            triggeredActions.push({ actor, action });
          }
        }
      }
    }

    // Check red lines
    for (const redLine of actor.redLines) {
      if (checkActionCondition(redLine.condition, gameState, actor)) {
        // Red line crossed - reaction is automatic
        triggeredActions.push({ actor, action: redLine.reaction });
      }
    }
  }

  return triggeredActions;
}

/**
 * Check if an action condition is met
 */
function checkActionCondition(
  condition: ActionCondition,
  gameState: any,
  actor: ThirdPartyActor
): boolean {
  switch (condition.type) {
    case 'trust-threshold':
      const trust = condition.target === 'us' ? actor.trust.us : actor.trust.ussr;
      return compareValue(trust, condition.threshold!, condition.comparison);

    case 'relationship-threshold':
      const rel = condition.target === 'us' ? actor.relationships.us : actor.relationships.ussr;
      return compareValue(rel, condition.threshold!, condition.comparison);

    case 'defcon-level':
      return compareValue(gameState.defcon, condition.threshold!, condition.comparison);

    case 'turn-number':
      return compareValue(gameState.turn, condition.threshold!, condition.comparison);

    case 'escalation-level':
      // Would check escalation level from game state
      return false; // Placeholder

    case 'event-occurred':
      // Would check if specific event has occurred
      return false; // Placeholder

    default:
      return false;
  }
}

function compareValue(value: number, threshold: number, comparison: 'greater' | 'less' | 'equal'): boolean {
  switch (comparison) {
    case 'greater':
      return value > threshold;
    case 'less':
      return value < threshold;
    case 'equal':
      return value === threshold;
  }
}

/**
 * Get actor by ID
 */
export function getThirdPartyActor(id: string): ThirdPartyActor | undefined {
  return ALL_THIRD_PARTIES.find((actor) => actor.id === id);
}

/**
 * Update actor's trust based on player action
 */
export function updateThirdPartyTrust(
  actorId: string,
  target: 'us' | 'ussr',
  delta: number
): void {
  const actor = getThirdPartyActor(actorId);
  if (actor) {
    actor.trust[target] = Math.max(0, Math.min(100, actor.trust[target] + delta));
  }
}

/**
 * Update actor's relationship based on player action
 */
export function updateThirdPartyRelationship(
  actorId: string,
  target: 'us' | 'ussr',
  delta: number
): void {
  const actor = getThirdPartyActor(actorId);
  if (actor) {
    actor.relationships[target] = Math.max(-100, Math.min(100, actor.relationships[target] + delta));
  }
}

/**
 * Calculate third party influence on final outcome
 */
export function calculateThirdPartyInfluence(actors: ThirdPartyActor[]): {
  totalInfluence: number;
  proUS: number;
  proUSSR: number;
  neutral: number;
} {
  let totalInfluence = 0;
  let proUS = 0;
  let proUSSR = 0;
  let neutral = 0;

  for (const actor of actors) {
    totalInfluence += actor.influence;

    if (actor.stance.includes('pro-us')) {
      proUS += actor.influence * (actor.relationships.us / 100);
    } else if (actor.stance.includes('pro-ussr')) {
      proUSSR += actor.influence * (actor.relationships.ussr / 100);
    } else {
      neutral += actor.influence;
    }
  }

  return { totalInfluence, proUS, proUSSR, neutral };
}
