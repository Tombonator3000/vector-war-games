/**
 * Doctrine Incident Data
 *
 * Defines all available doctrine incidents that can occur during gameplay.
 * Each incident challenges the player's doctrine commitment.
 */

import type { DoctrineIncident } from '@/types/doctrineIncidents';

export const DOCTRINE_INCIDENTS: DoctrineIncident[] = [
  // ==========================================
  // MAD (Mutual Assured Destruction) Incidents
  // ==========================================
  {
    id: 'mad_false_alarm',
    doctrineType: 'mad',
    title: 'FALSE ALARM AT EARLY WARNING STATION',
    description:
      'NORAD reports massive incoming strike detected. Launch on Warning protocol is active. ' +
      'However, technical officer suggests possible radar malfunction. Launch window: 4 minutes.',
    severity: 'critical',
    baseChance: 5,
    repeatable: false,
    urgency: 'critical',
    iconType: 'crisis',
    conditions: {
      minTurn: 5,
      hasResearch: ['early_warning'],
    },
    choices: [
      {
        id: 'launch_anyway',
        text: 'LAUNCH IMMEDIATE RETALIATION - Stand by doctrine',
        doctrineAlignment: 'mad',
        consequences: {
          newsEvent: {
            category: 'military',
            headline: 'Nuclear Launch Authorized on Radar Warning',
            priority: 'critical',
          },
          deterrenceChange: 20,
          globalRelationshipChange: -30,
          instabilityDelta: 25,
          moraleDelta: -15,
          followUpIncident: 'mad_false_alarm_aftermath',
        },
      },
      {
        id: 'stand_down',
        text: 'STAND DOWN - Investigate anomaly first',
        doctrineAlignment: 'defense',
        consequences: {
          deterrenceChange: -15,
          moraleDelta: 5,
          newsEvent: {
            category: 'military',
            headline: 'Command Stands Down During False Alarm',
            priority: 'high',
          },
          doctrineShift: {
            toward: 'defense',
            amount: 15,
          },
        },
      },
      {
        id: 'alert_allies',
        text: 'ALERT ALLIES - Coordinate response before launching',
        doctrineAlignment: 'detente',
        consequences: {
          intelCost: 20,
          deterrenceChange: -5,
          newsEvent: {
            category: 'diplomatic',
            headline: 'Allied Coordination Prevents Hasty Launch',
            priority: 'high',
          },
          doctrineShift: {
            toward: 'detente',
            amount: 10,
          },
        },
      },
    ],
  },

  {
    id: 'mad_ally_umbrella_request',
    doctrineType: 'mad',
    title: 'ALLY REQUESTS NUCLEAR UMBRELLA',
    description:
      'Allied nation requests extension of nuclear deterrence umbrella. ' +
      'Accepting means automatic retaliation if they are attacked, potentially dragging you into war.',
    severity: 'major',
    baseChance: 8,
    repeatable: true,
    urgency: 'medium',
    iconType: 'decision',
    conditions: {
      minTurn: 10,
      requiresAllies: true,
    },
    choices: [
      {
        id: 'extend_umbrella',
        text: 'EXTEND UMBRELLA - Strengthen alliance with mutual deterrence',
        doctrineAlignment: 'mad',
        consequences: {
          relationshipChanges: { ally: 25 },
          deterrenceChange: 10,
          newsEvent: {
            category: 'diplomatic',
            headline: 'Nuclear Umbrella Extended to Allied Nation',
            priority: 'high',
          },
          productionCost: 5,
        },
      },
      {
        id: 'refuse_umbrella',
        text: 'REFUSE - Maintain strategic independence',
        doctrineAlignment: 'firstStrike',
        consequences: {
          relationshipChanges: { ally: -20 },
          newsEvent: {
            category: 'diplomatic',
            headline: 'Ally Request for Protection Denied',
            priority: 'medium',
          },
        },
      },
      {
        id: 'negotiate_terms',
        text: 'NEGOTIATE TERMS - Conditional protection agreement',
        doctrineAlignment: 'detente',
        consequences: {
          intelCost: 15,
          relationshipChanges: { ally: 10 },
          deterrenceChange: 5,
          doctrineShift: {
            toward: 'detente',
            amount: 8,
          },
        },
      },
    ],
  },

  {
    id: 'mad_arsenal_aging',
    doctrineType: 'mad',
    title: 'AGING ARSENAL RELIABILITY CONCERNS',
    description:
      'Intelligence reports suggest 30% of missile force may have reliability issues due to aging components. ' +
      'Massive retaliation doctrine requires credible threat. Modernization needed.',
    severity: 'major',
    baseChance: 6,
    repeatable: false,
    urgency: 'high',
    iconType: 'warning',
    conditions: {
      minTurn: 20,
      minMissiles: 10,
    },
    choices: [
      {
        id: 'emergency_modernization',
        text: 'EMERGENCY MODERNIZATION - Spend heavily to maintain credibility',
        doctrineAlignment: 'mad',
        consequences: {
          productionCost: 40,
          goldCost: 30,
          deterrenceChange: 15,
          newsEvent: {
            category: 'military',
            headline: 'Massive Nuclear Modernization Program Announced',
            priority: 'high',
          },
        },
      },
      {
        id: 'accept_risk',
        text: 'ACCEPT RISK - Maintain current force, hope enemies believe bluff',
        doctrineAlignment: 'neutral',
        consequences: {
          deterrenceChange: -20,
          instabilityDelta: 10,
          newsEvent: {
            category: 'military',
            headline: 'Aging Nuclear Arsenal Raises Questions',
            priority: 'medium',
          },
        },
      },
      {
        id: 'shift_to_quality',
        text: 'SHIFT TO QUALITY - Reduce arsenal size, focus on reliability',
        doctrineAlignment: 'defense',
        consequences: {
          missileDelta: -3,
          productionCost: 20,
          deterrenceChange: 5,
          doctrineShift: {
            toward: 'defense',
            amount: 12,
          },
        },
      },
    ],
  },

  // ==========================================
  // DEFENSE (Strategic Defense) Incidents
  // ==========================================
  {
    id: 'defense_abm_test_failure',
    doctrineType: 'defense',
    title: 'ABM TEST FAILS PUBLICLY',
    description:
      'Live-fire ABM test fails spectacularly on international television. ' +
      'Missile defense credibility damaged. Adversaries may see opportunity.',
    severity: 'major',
    baseChance: 7,
    repeatable: true,
    urgency: 'high',
    iconType: 'crisis',
    conditions: {
      minTurn: 8,
      minDefense: 3,
    },
    choices: [
      {
        id: 'cover_up',
        text: 'COVER UP - Classify results, claim success',
        doctrineAlignment: 'neutral',
        consequences: {
          intelCost: 25,
          deterrenceChange: -5,
          newsEvent: {
            category: 'military',
            headline: 'Defense Test Results Classified',
            priority: 'medium',
          },
          instabilityDelta: 5,
        },
      },
      {
        id: 'acknowledge_failure',
        text: 'ACKNOWLEDGE FAILURE - Commit to fixing issues publicly',
        doctrineAlignment: 'defense',
        consequences: {
          deterrenceChange: -15,
          globalRelationshipChange: 5,
          productionCost: 30,
          newsEvent: {
            category: 'military',
            headline: 'Leadership Admits Defense Test Failure, Vows Improvement',
            priority: 'high',
          },
          moraleDelta: 10,
        },
      },
      {
        id: 'blame_sabotage',
        text: 'BLAME SABOTAGE - Launch investigation into enemy interference',
        doctrineAlignment: 'firstStrike',
        consequences: {
          intelCost: 30,
          globalRelationshipChange: -10,
          newsEvent: {
            category: 'political',
            headline: 'Enemy Sabotage Blamed for Defense Failure',
            priority: 'high',
          },
          doctrineShift: {
            toward: 'firstStrike',
            amount: 10,
          },
        },
      },
    ],
  },

  {
    id: 'defense_budget_crisis',
    doctrineType: 'defense',
    title: 'BUDGET CRISIS: DEFENSE VS OFFENSE',
    description:
      'Economic downturn forces military budget cuts. Choose: maintain defensive systems or offensive capability. ' +
      'Cabinet divided.',
    severity: 'major',
    baseChance: 10,
    repeatable: true,
    urgency: 'medium',
    iconType: 'decision',
    conditions: {
      minTurn: 12,
    },
    choices: [
      {
        id: 'cut_offense',
        text: 'CUT OFFENSIVE FORCES - Maintain defense doctrine',
        doctrineAlignment: 'defense',
        consequences: {
          missileDelta: -2,
          moraleDelta: -5,
          newsEvent: {
            category: 'political',
            headline: 'Military Restructures Toward Defensive Posture',
            priority: 'medium',
          },
        },
      },
      {
        id: 'cut_defense',
        text: 'CUT DEFENSIVE SYSTEMS - Shift toward offensive deterrence',
        doctrineAlignment: 'mad',
        consequences: {
          defenseDelta: -2,
          deterrenceChange: 5,
          doctrineShift: {
            toward: 'mad',
            amount: 15,
          },
          newsEvent: {
            category: 'political',
            headline: 'Defense Cuts Signal Shift in Military Strategy',
            priority: 'medium',
          },
        },
      },
      {
        id: 'emergency_funding',
        text: 'EMERGENCY FUNDING - Maintain both, accept economic pain',
        doctrineAlignment: 'neutral',
        consequences: {
          productionCost: 25,
          goldCost: 20,
          instabilityDelta: 8,
          moraleDelta: -10,
          newsEvent: {
            category: 'economic',
            headline: 'Emergency Military Funding Strains Economy',
            priority: 'high',
          },
        },
      },
    ],
  },

  {
    id: 'defense_tech_breakthrough',
    doctrineType: 'defense',
    title: 'ABM TECHNOLOGY BREAKTHROUGH',
    description:
      'Scientists achieve major breakthrough in missile interception. ' +
      'Sharing with allies could create defensive coalition. Keeping secret maintains advantage.',
    severity: 'major',
    baseChance: 5,
    repeatable: false,
    urgency: 'medium',
    iconType: 'opportunity',
    conditions: {
      minTurn: 15,
      minDefense: 5,
      requiresAllies: true,
    },
    choices: [
      {
        id: 'share_technology',
        text: 'SHARE WITH ALLIES - Build defensive coalition',
        doctrineAlignment: 'defense',
        consequences: {
          relationshipChanges: { ally: 30 },
          globalRelationshipChange: 10,
          newsEvent: {
            category: 'diplomatic',
            headline: 'Revolutionary Defense Technology Shared with Allies',
            priority: 'critical',
          },
          deterrenceChange: 20,
        },
      },
      {
        id: 'keep_secret',
        text: 'KEEP SECRET - Maintain technological superiority',
        doctrineAlignment: 'firstStrike',
        consequences: {
          defenseDelta: 3,
          relationshipChanges: { ally: -10 },
          newsEvent: {
            category: 'military',
            headline: 'New Defense Capabilities Demonstrated',
            priority: 'high',
          },
          doctrineShift: {
            toward: 'firstStrike',
            amount: 8,
          },
        },
      },
      {
        id: 'sell_technology',
        text: 'SELL TECHNOLOGY - Profit from innovation',
        doctrineAlignment: 'detente',
        consequences: {
          goldCost: -50, // negative cost = gain
          globalRelationshipChange: -5,
          newsEvent: {
            category: 'economic',
            headline: 'Defense Technology Commercialized',
            priority: 'medium',
          },
          doctrineShift: {
            toward: 'detente',
            amount: 5,
          },
        },
      },
    ],
  },

  // ==========================================
  // FIRST STRIKE Incidents
  // ==========================================
  {
    id: 'firstStrike_intel_warning',
    doctrineType: 'firstStrike',
    title: 'INTELLIGENCE: ENEMY PREPARING STRIKE',
    description:
      'CIA reports enemy missile silos showing increased activity. ' +
      'Pattern suggests they may be preparing first strike. Window for preemption closing.',
    severity: 'critical',
    baseChance: 8,
    repeatable: true,
    urgency: 'critical',
    iconType: 'crisis',
    conditions: {
      minTurn: 10,
      requiresEnemies: true,
    },
    choices: [
      {
        id: 'launch_preemptive',
        text: 'LAUNCH PREEMPTIVE STRIKE - Eliminate threat now',
        doctrineAlignment: 'firstStrike',
        consequences: {
          triggerWar: true,
          newsEvent: {
            category: 'military',
            headline: 'Preemptive Nuclear Strike Launched',
            priority: 'critical',
          },
          globalRelationshipChange: -40,
          deterrenceChange: 30,
          moraleDelta: -20,
        },
      },
      {
        id: 'wait_confirmation',
        text: 'WAIT FOR CONFIRMATION - Gather more intelligence',
        doctrineAlignment: 'defense',
        consequences: {
          intelCost: 25,
          newsEvent: {
            category: 'military',
            headline: 'Forces on High Alert Pending Intelligence',
            priority: 'high',
          },
          doctrineShift: {
            toward: 'defense',
            amount: 12,
          },
          followUpIncident: 'firstStrike_intel_followup',
        },
      },
      {
        id: 'diplomatic_warning',
        text: 'ISSUE DIPLOMATIC WARNING - Deter through communication',
        doctrineAlignment: 'detente',
        consequences: {
          intelCost: 15,
          relationshipChanges: { enemy: 5 },
          newsEvent: {
            category: 'diplomatic',
            headline: 'Diplomatic Channels Used to Defuse Crisis',
            priority: 'high',
          },
          doctrineShift: {
            toward: 'detente',
            amount: 15,
          },
        },
      },
    ],
  },

  {
    id: 'firstStrike_general_advocates',
    doctrineType: 'firstStrike',
    title: 'GENERAL ADVOCATES IMMEDIATE ATTACK',
    description:
      'Your military chief of staff argues that strategic situation favors immediate strike. ' +
      '"We may never have a better opportunity. Waiting is weakness."',
    severity: 'major',
    baseChance: 12,
    repeatable: true,
    urgency: 'high',
    iconType: 'decision',
    conditions: {
      minTurn: 8,
      requiresEnemies: true,
    },
    choices: [
      {
        id: 'approve_strike',
        text: 'APPROVE STRIKE - Seize the opportunity',
        doctrineAlignment: 'firstStrike',
        consequences: {
          triggerWar: true,
          moraleDelta: 10,
          newsEvent: {
            category: 'military',
            headline: 'Surprise Military Action Authorized',
            priority: 'critical',
          },
          globalRelationshipChange: -35,
        },
      },
      {
        id: 'refuse_general',
        text: 'REFUSE - Maintain current posture',
        doctrineAlignment: 'defense',
        consequences: {
          moraleDelta: -15,
          instabilityDelta: 10,
          newsEvent: {
            category: 'political',
            headline: 'Military Leadership Frustrated with Restraint',
            priority: 'medium',
          },
          doctrineShift: {
            toward: 'defense',
            amount: 10,
          },
        },
      },
      {
        id: 'dismiss_general',
        text: 'DISMISS GENERAL - Remove warmonger from command',
        doctrineAlignment: 'detente',
        consequences: {
          moraleDelta: -20,
          instabilityDelta: 15,
          newsEvent: {
            category: 'political',
            headline: 'Military Chief of Staff Dismissed',
            priority: 'high',
          },
          doctrineShift: {
            toward: 'detente',
            amount: 20,
          },
        },
      },
    ],
  },

  {
    id: 'firstStrike_ethics_debate',
    doctrineType: 'firstStrike',
    title: 'PUBLIC ETHICS DEBATE ON FIRST STRIKE',
    description:
      'Religious and academic leaders condemn first strike doctrine as immoral. ' +
      'Public opinion turning against preemptive nuclear policy. Cabinet divided.',
    severity: 'major',
    baseChance: 10,
    repeatable: false,
    urgency: 'medium',
    iconType: 'warning',
    conditions: {
      minTurn: 15,
    },
    choices: [
      {
        id: 'defend_doctrine',
        text: 'DEFEND DOCTRINE - Explain strategic necessity',
        doctrineAlignment: 'firstStrike',
        consequences: {
          moraleDelta: -10,
          instabilityDelta: 8,
          newsEvent: {
            category: 'political',
            headline: 'Leadership Defends Preemptive Strike Policy',
            priority: 'high',
          },
          deterrenceChange: 10,
        },
      },
      {
        id: 'soften_rhetoric',
        text: 'SOFTEN RHETORIC - Emphasize defensive aspects',
        doctrineAlignment: 'defense',
        consequences: {
          moraleDelta: 5,
          deterrenceChange: -10,
          newsEvent: {
            category: 'political',
            headline: 'Policy Adjustments Made Amid Public Pressure',
            priority: 'medium',
          },
          doctrineShift: {
            toward: 'defense',
            amount: 15,
          },
        },
      },
      {
        id: 'change_doctrine',
        text: 'CHANGE DOCTRINE - Announce shift away from first strike',
        doctrineAlignment: 'detente',
        consequences: {
          moraleDelta: 20,
          deterrenceChange: -25,
          newsEvent: {
            category: 'political',
            headline: 'Major Policy Shift: First Strike Doctrine Abandoned',
            priority: 'critical',
          },
          doctrineShift: {
            toward: 'detente',
            amount: 50,
          },
        },
      },
    ],
  },

  // ==========================================
  // DÉTENTE Incidents
  // ==========================================
  {
    id: 'detente_hardliners_revolt',
    doctrineType: 'detente',
    title: 'HARDLINERS DEMAND TOUGHER STANCE',
    description:
      'Military and intelligence factions demand more aggressive posture. ' +
      '"Détente is weakness. Enemies are exploiting our goodwill." Coup rumors circulating.',
    severity: 'critical',
    baseChance: 12,
    repeatable: true,
    urgency: 'high',
    iconType: 'crisis',
    conditions: {
      minTurn: 10,
    },
    choices: [
      {
        id: 'maintain_course',
        text: 'MAINTAIN COURSE - Stand firm on peaceful policy',
        doctrineAlignment: 'detente',
        consequences: {
          instabilityDelta: 15,
          moraleDelta: -10,
          newsEvent: {
            category: 'political',
            headline: 'Leadership Resists Calls for Escalation',
            priority: 'high',
          },
          deterrenceChange: -10,
        },
      },
      {
        id: 'compromise_stance',
        text: 'COMPROMISE - Adopt more assertive posture',
        doctrineAlignment: 'mad',
        consequences: {
          instabilityDelta: 5,
          deterrenceChange: 10,
          newsEvent: {
            category: 'political',
            headline: 'Policy Shifts Toward More Assertive Stance',
            priority: 'medium',
          },
          doctrineShift: {
            toward: 'mad',
            amount: 15,
          },
        },
      },
      {
        id: 'purge_hardliners',
        text: 'PURGE HARDLINERS - Remove dissenters from power',
        doctrineAlignment: 'detente',
        consequences: {
          instabilityDelta: 25,
          moraleDelta: -20,
          newsEvent: {
            category: 'political',
            headline: 'Mass Dismissals in Military and Intelligence',
            priority: 'critical',
          },
          deterrenceChange: -15,
          followUpIncident: 'detente_purge_aftermath',
        },
      },
    ],
  },

  {
    id: 'detente_enemy_cheating',
    doctrineType: 'detente',
    title: 'ENEMY CAUGHT CHEATING ON TREATY',
    description:
      'Satellite reconnaissance confirms adversary is violating arms limitation treaty. ' +
      'Secret missile sites under construction. Allies demand response.',
    severity: 'critical',
    baseChance: 15,
    repeatable: true,
    urgency: 'critical',
    iconType: 'crisis',
    conditions: {
      minTurn: 12,
      requiresEnemies: true,
    },
    choices: [
      {
        id: 'expose_publicly',
        text: 'EXPOSE PUBLICLY - End détente, rally international support',
        doctrineAlignment: 'mad',
        consequences: {
          breakTreaties: true,
          globalRelationshipChange: 10,
          relationshipChanges: { enemy: -40 },
          newsEvent: {
            category: 'diplomatic',
            headline: 'Enemy Treaty Violations Exposed to World',
            priority: 'critical',
          },
          doctrineShift: {
            toward: 'mad',
            amount: 25,
          },
        },
      },
      {
        id: 'quietly_renegotiate',
        text: 'QUIET RENEGOTIATION - Maintain peace, adjust terms',
        doctrineAlignment: 'detente',
        consequences: {
          intelCost: 30,
          relationshipChanges: { enemy: -10 },
          newsEvent: {
            category: 'diplomatic',
            headline: 'Treaty Terms Quietly Adjusted',
            priority: 'medium',
          },
          deterrenceChange: -15,
          moraleDelta: -10,
        },
      },
      {
        id: 'match_violation',
        text: 'MATCH VIOLATION - Build secret sites in response',
        doctrineAlignment: 'firstStrike',
        consequences: {
          productionCost: 40,
          missileDelta: 2,
          newsEvent: {
            category: 'military',
            headline: 'Expanded Military Construction Detected',
            priority: 'high',
          },
          doctrineShift: {
            toward: 'firstStrike',
            amount: 20,
          },
        },
      },
    ],
  },

  {
    id: 'detente_peace_dividend',
    doctrineType: 'detente',
    title: 'PEACE DIVIDEND OPPORTUNITY',
    description:
      'Extended period of peace allows major reduction in military spending. ' +
      'Funds could be redirected to economy, science, or social programs.',
    severity: 'major',
    baseChance: 8,
    repeatable: false,
    urgency: 'low',
    iconType: 'opportunity',
    conditions: {
      minTurn: 20,
      requiresPeace: true,
    },
    choices: [
      {
        id: 'reduce_arsenal',
        text: 'REDUCE ARSENAL - Convert military to civilian economy',
        doctrineAlignment: 'detente',
        consequences: {
          missileDelta: -3,
          goldCost: -40, // gain resources
          productionCost: -20,
          moraleDelta: 20,
          newsEvent: {
            category: 'economic',
            headline: 'Major Disarmament Initiative Boosts Economy',
            priority: 'critical',
          },
          globalRelationshipChange: 20,
        },
      },
      {
        id: 'maintain_readiness',
        text: 'MAINTAIN READINESS - Peace is temporary',
        doctrineAlignment: 'defense',
        consequences: {
          moraleDelta: -5,
          newsEvent: {
            category: 'political',
            headline: 'Military Spending Maintained Despite Peace',
            priority: 'medium',
          },
          doctrineShift: {
            toward: 'defense',
            amount: 10,
          },
        },
      },
      {
        id: 'modernize_quietly',
        text: 'MODERNIZE QUIETLY - Use peace to build advantage',
        doctrineAlignment: 'firstStrike',
        consequences: {
          productionCost: 30,
          gainTech: 'mirv', // example tech
          newsEvent: {
            category: 'military',
            headline: 'Quiet Military Modernization Underway',
            priority: 'medium',
          },
          deterrenceChange: 15,
          doctrineShift: {
            toward: 'firstStrike',
            amount: 15,
          },
        },
      },
    ],
  },
];

/**
 * Get all incidents available for a specific doctrine
 */
export function getIncidentsForDoctrine(doctrine: string): DoctrineIncident[] {
  return DOCTRINE_INCIDENTS.filter((inc) => inc.doctrineType === doctrine);
}

/**
 * Get a specific incident by ID
 */
export function getIncidentById(id: string): DoctrineIncident | undefined {
  return DOCTRINE_INCIDENTS.find((inc) => inc.id === id);
}
