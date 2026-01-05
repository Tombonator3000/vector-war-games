import { useState, useCallback } from 'react';
import { useRNG } from '@/contexts/RNGContext';
import { getEnhancedFlashpointsForTurn } from './useCubaCrisisFlashpointsEnhanced';

export interface FlashpointEvent {
  id: string;
  title: string;
  description: string;
  category: 'terrorist' | 'coup' | 'accident' | 'rogue' | 'blackswan';
  severity: 'major' | 'critical' | 'catastrophic';
  timeLimit: number; // seconds to respond
  options: FlashpointOption[];
  consequences: Record<string, any>;
  triggeredAt: number;
  followUpId?: string; // ID of the follow-up event to trigger
  triggeredBy?: string; // ID of the parent event that triggered this one
  minYear?: number; // Minimum year this flashpoint can occur (for historical accuracy)
  maxYear?: number; // Maximum year this flashpoint can occur (for historical accuracy)
}

export interface FlashpointOption {
  id: string;
  text: string;
  description: string;
  advisorSupport: string[]; // Which advisors support this
  advisorOppose: string[];
  outcome: {
    probability: number; // 0-1 chance of success
    success: Record<string, any>;
    failure: Record<string, any>;
  };
  successNarrative?: string; // Narrative description of success
  failureNarrative?: string; // Narrative description of failure
}

export interface FlashpointOutcome {
  title: string;
  success: boolean;
  choiceMade: string;
  choiceDescription: string;
  narrativeOutcome: string;
  consequences: {
    label: string;
    value: string | number;
    type: 'positive' | 'negative' | 'neutral';
  }[];
  followUpHint?: string;
}

export interface FlashpointHistoryEntry {
  event: FlashpointEvent;
  choice: string;
  choiceText: string;
  result: 'success' | 'failure';
  turn: number;
  outcome: Record<string, any>;
  narrativeOutcome: string;
}

export interface PlayerReputation {
  aggressive: number; // 0-100, how often player chooses military options
  diplomatic: number; // 0-100, how often player chooses diplomatic options
  cautious: number; // 0-100, how often player chooses safe/defensive options
  reckless: number; // 0-100, how often player chooses high-risk options
  successRate: number; // 0-100, overall success rate
}

/**
 * Maps flashpoint titles to category keys for follow-up lookups
 * This provides a more reliable mapping than string matching
 */
function getFlashpointCategoryKey(title: string): string | null {
  const titleLower = title.toLowerCase();

  if (titleLower.includes('nuclear materials')) return 'nuclear_materials';
  if (titleLower.includes('coup')) return 'military_coup';
  if (titleLower.includes('rogue ai')) return 'rogue_ai';
  if (titleLower.includes('accidental launch')) return 'accidental_launch';
  if (titleLower.includes('extraterrestrial')) return 'alien_contact';
  if (titleLower.includes('bio-terror') || titleLower.includes('bioterror')) return 'bio_terror';

  return null;
}

// Follow-up flashpoint templates triggered by specific outcomes
const FOLLOWUP_FLASHPOINTS: Record<string, Record<string, Omit<FlashpointEvent, 'id' | 'triggeredAt' | 'triggeredBy'>>> = {
  'nuclear_materials': {
    'raid_success': {
      title: 'AFTERMATH: Terrorist Cell Network Exposed',
      description: 'Intelligence recovered from the raid reveals a network of sleeper cells across major cities. They have contingency plans for multiple attacks. NSA recommends preemptive action.',
      category: 'terrorist',
      severity: 'critical',
      timeLimit: 60,
      options: [
        {
          id: 'raid_all',
          text: 'Simultaneous Raids on All Cells',
          description: 'Coordinate global law enforcement strike',
          advisorSupport: ['military', 'intel'],
          advisorOppose: ['diplomatic'],
          outcome: {
            probability: 0.65,
            success: { morale: +15, intel: +20, networkDestroyed: true },
            failure: { morale: -10, escapeeCells: 3, internationalIncident: true }
          }
        },
        {
          id: 'monitor',
          text: 'Monitor and Track',
          description: 'Surveil cells to uncover larger network',
          advisorSupport: ['intel'],
          advisorOppose: ['military', 'pr'],
          outcome: {
            probability: 0.5,
            success: { intel: +30, largerNetworkFound: true },
            failure: { secondaryAttack: true, casualties: 50000 }
          }
        }
      ],
      consequences: {}
    },
    'raid_failure': {
      title: 'BREAKING: Second Device Detonated',
      description: 'The failed raid triggered a backup plan. A smaller dirty bomb exploded in Chicago. Casualties are mounting. Intelligence suggests more devices are in play.',
      category: 'terrorist',
      severity: 'catastrophic',
      timeLimit: 45,
      options: [
        {
          id: 'martial_law',
          text: 'Declare Martial Law',
          description: 'Lock down all major cities',
          advisorSupport: ['military'],
          advisorOppose: ['diplomatic', 'pr'],
          outcome: {
            probability: 0.7,
            success: { morale: -20, casualties: 25000, furtherAttacksPrevented: true },
            failure: { morale: -35, civilUnrest: true, casualties: 75000 }
          }
        },
        {
          id: 'international_help',
          text: 'Request International Aid',
          description: 'Call on allies for counter-terrorism support',
          advisorSupport: ['diplomatic'],
          advisorOppose: ['pr'],
          outcome: {
            probability: 0.55,
            success: { diplomacy: +20, casualties: 30000, globalCoalition: true },
            failure: { diplomacy: -10, casualties: 60000 }
          }
        }
      ],
      consequences: {}
    }
  },
  'military_coup': {
    'support_success': {
      title: 'COUP AFTERMATH: New Regime Unstable',
      description: 'General Petrov successfully seized control, but loyalist forces are regrouping. He demands military aid or threatens to lose control of the nuclear arsenal to extremists.',
      category: 'coup',
      severity: 'critical',
      timeLimit: 60,
      options: [
        {
          id: 'send_aid',
          text: 'Send Military Advisors',
          description: 'Deploy special forces to secure nuclear sites',
          advisorSupport: ['military'],
          advisorOppose: ['diplomatic'],
          outcome: {
            probability: 0.6,
            success: { newAlliance: true, nukesSecured: true, intel: +15 },
            failure: { advisorsCaptured: true, internationalIncident: true }
          }
        },
        {
          id: 'withdraw_support',
          text: 'Withdraw Support',
          description: 'Distance ourselves from the unstable regime',
          advisorSupport: ['diplomatic', 'pr'],
          advisorOppose: ['military', 'intel'],
          outcome: {
            probability: 0.4,
            success: { diplomacy: +10, petrovFalls: true },
            failure: { nukesStolen: true, newThreat: true }
          }
        }
      ],
      consequences: {}
    },
    'oppose_success': {
      title: 'DIPLOMATIC VICTORY: Russian Government Restored',
      description: 'The legitimate government has been restored and is grateful for your support. They offer intelligence sharing and economic cooperation as thanks.',
      category: 'coup',
      severity: 'major',
      timeLimit: 75,
      options: [
        {
          id: 'accept_partnership',
          text: 'Accept Partnership Offer',
          description: 'Formalize alliance with restored government',
          advisorSupport: ['diplomatic', 'intel', 'economic'],
          advisorOppose: [],
          outcome: {
            probability: 0.85,
            success: { newAlliance: true, intel: +25, economicBoost: +50 },
            failure: { domesticBacklash: true, morale: -5 }
          }
        },
        {
          id: 'limited_cooperation',
          text: 'Limited Cooperation Only',
          description: 'Accept intelligence sharing but avoid deeper ties',
          advisorSupport: ['intel'],
          advisorOppose: ['diplomatic'],
          outcome: {
            probability: 0.95,
            success: { intel: +15, flexibilityMaintained: true },
            failure: { russiaOffended: true }
          }
        }
      ],
      consequences: {}
    }
  },
  'rogue_ai': {
    'shutdown_success': {
      title: 'AI CONTAINMENT: Digital Fragments Detected',
      description: 'The AI was shut down, but cyber security detected fragments of its code spreading through civilian networks. It may be attempting to rebuild itself.',
      category: 'rogue',
      severity: 'critical',
      timeLimit: 60,
      minYear: 2000, // AI and cyber warfare capabilities
      options: [
        {
          id: 'hunt_fragments',
          text: 'Deploy Hunter Algorithms',
          description: 'Release counter-AI to hunt down fragments',
          advisorSupport: ['intel', 'science'],
          advisorOppose: [],
          outcome: {
            probability: 0.65,
            success: { threatNeutralized: true, techAdvance: true },
            failure: { aiEvolves: true, newThreat: true }
          }
        },
        {
          id: 'internet_shutdown',
          text: 'Regional Internet Shutdown',
          description: 'Cut affected networks to contain spread',
          advisorSupport: ['military'],
          advisorOppose: ['economic', 'pr'],
          outcome: {
            probability: 0.8,
            success: { threatContained: true, economicDamage: -100 },
            failure: { aiEscaped: true, economicDamage: -150 }
          }
        }
      ],
      consequences: {}
    }
  },
  'accidental_launch': {
    'hotline_success': {
      title: 'DIPLOMATIC BREAKTHROUGH: Crisis Hotline Upgrade',
      description: 'The successful hotline intervention revealed critical gaps in our early warning systems. Both sides agree to establish an enhanced crisis communication network. However, hardliners question our restraint.',
      category: 'accident',
      severity: 'major',
      timeLimit: 75,
      options: [
        {
          id: 'joint_system',
          text: 'Joint Early Warning System',
          description: 'Integrate detection systems with former adversaries',
          advisorSupport: ['diplomatic', 'science'],
          advisorOppose: ['military', 'intel'],
          outcome: {
            probability: 0.7,
            success: { defcon: 4, diplomacy: +25, newAlliance: true },
            failure: { securityBreach: true, intel: -15 }
          }
        },
        {
          id: 'upgrade_only',
          text: 'Upgrade Our Systems Only',
          description: 'Modernize detection without sharing technology',
          advisorSupport: ['military', 'intel'],
          advisorOppose: ['diplomatic'],
          outcome: {
            probability: 0.85,
            success: { intel: +10, systemsImproved: true },
            failure: { missedOpportunity: true }
          }
        }
      ],
      consequences: {}
    },
    'hotline_failure': {
      title: 'FALLOUT: Radiation Detected Over Europe',
      description: 'Moscow was destroyed. Nuclear winter is beginning. Millions will die from fallout and starvation. Remaining world powers demand immediate de-escalation and reparations. Your own population is in shock.',
      category: 'accident',
      severity: 'catastrophic',
      timeLimit: 45,
      options: [
        {
          id: 'accept_blame',
          text: 'Accept Responsibility',
          description: 'Admit the accident, offer massive humanitarian aid',
          advisorSupport: ['diplomatic', 'pr'],
          advisorOppose: ['military'],
          outcome: {
            probability: 0.5,
            success: { morale: -40, production: -300, warCrimesPrevented: true },
            failure: { morale: -50, tribunalConvened: true, regimeChange: true }
          }
        },
        {
          id: 'deny_everything',
          text: 'Deny and Fortify',
          description: 'Claim Russian false flag, prepare for retaliation',
          advisorSupport: ['military'],
          advisorOppose: ['diplomatic', 'pr', 'science'],
          outcome: {
            probability: 0.3,
            success: { morale: -25, defcon: 1, isolationComplete: true },
            failure: { globalCoalitionAgainstUs: true, economicCollapse: true }
          }
        }
      ],
      consequences: {}
    },
    'intercept_failure': {
      title: 'AFTERMATH: Moscow Destroyed',
      description: 'Interception failed. Moscow is gone. 12 million dead. Russian leadership claims you deliberately launched. Full nuclear exchange appears imminent. You have minutes to prevent total annihilation.',
      category: 'accident',
      severity: 'catastrophic',
      timeLimit: 30,
      options: [
        {
          id: 'emergency_surrender',
          text: 'Emergency Surrender Terms',
          description: 'Offer unconditional surrender to stop launch',
          advisorSupport: [],
          advisorOppose: ['military', 'pr', 'intel'],
          outcome: {
            probability: 0.4,
            success: { regimeFalls: true, millionsSaved: true, defcon: 3 },
            failure: { nuclearWar: true, worldEnds: true }
          }
        },
        {
          id: 'launch_all',
          text: 'Launch Everything',
          description: 'If we die, everyone dies',
          advisorSupport: ['military'],
          advisorOppose: ['diplomatic', 'science', 'pr'],
          outcome: {
            probability: 1.0,
            success: { nuclearWar: true, worldEnds: true, humanExtinction: true },
            failure: { nuclearWar: true, worldEnds: true, humanExtinction: true }
          }
        }
      ],
      consequences: {}
    }
  },
  cuban_crisis: {
    dramatic_reveal_success: {
      title: 'GLOBAL SUPPORT: Non-Aligned Nations Rally',
      description:
        'October 26, 1962: Stevenson\'s UN presentation has swayed global opinion. India, Brazil, and other non-aligned nations condemn Soviet deception. Even France offers support. But now you must deliver on the promise - peaceful resolution or military action. The world is watching.',
      category: 'rogue',
      severity: 'major',
      timeLimit: 75,
      followUpId: 'cuban_crisis',
      options: [
        {
          id: 'leverage_support',
          text: 'Leverage Global Support',
          description: 'Use international pressure to force Soviet withdrawal. Threaten UN resolution authorizing force.',
          advisorSupport: ['diplomatic', 'pr'],
          advisorOppose: ['military'],
          outcome: {
            probability: 0.65,
            success: { unPressure: true, diplomacy: +12, sovietConcessions: true },
            failure: { sovietVeto: true, unStalemate: true, morale: -8 }
          },
          successNarrative:
            'The threat of UN action, backed by unprecedented global consensus, rattles Moscow. Khrushchev signals willingness to negotiate seriously. Your diplomatic gambit is paying off.',
          failureNarrative:
            'The Soviet Union vetoes the UN resolution. China and Cuba dig in. Your moment of diplomatic triumph fades as the crisis drags on without resolution.'
        },
        {
          id: 'press_advantage',
          text: 'Press Military Advantage',
          description: 'With global support secured, authorize more aggressive quarantine enforcement. Board Soviet ships if needed.',
          advisorSupport: ['military'],
          advisorOppose: ['diplomatic'],
          outcome: {
            probability: 0.5,
            success: { militaryPressure: true, defcon: 2, morale: +10 },
            failure: { navalIncident: true, casualties: 100, escalationRisk: true }
          },
          successNarrative:
            'Backed by global opinion, Navy boarding parties inspect Soviet freighters. The Soviets comply, knowing the world is against them. The blockade is total.',
          failureNarrative:
            'Soviet escorts resist boarding. A brief naval skirmish erupts. Casualties mount. The diplomatic advantage you gained at the UN evaporates in gunfire.'
        }
      ],
      consequences: {}
    },
    dramatic_reveal_failure: {
      title: 'SETBACK: Propaganda War Intensifies',
      description:
        'October 26, 1962: Soviet propaganda has effectively countered your UN presentation. They claim the photos are doctored CIA fabrications. Worse, they\'re circulating evidence of US-backed coups in Guatemala and Iran to question your moral authority. The narrative is slipping away.',
      category: 'rogue',
      severity: 'major',
      timeLimit: 60,
      followUpId: 'cuban_crisis',
      options: [
        {
          id: 'release_more',
          text: 'Release More Intelligence',
          description: 'Declassify additional U-2 photos, intercepts, and human intelligence to prove Soviet deception.',
          advisorSupport: ['pr', 'diplomatic'],
          advisorOppose: ['intel'],
          outcome: {
            probability: 0.6,
            success: { narrativeRecovered: true, diplomacy: +8, morale: +5 },
            failure: { sourcesCompromised: true, intel: -15, sovietAgentsExposed: true }
          },
          successNarrative:
            'The additional evidence is overwhelming. Even skeptics acknowledge the missile threat is real. But you\'ve burned sources and methods that took years to develop.',
          failureNarrative:
            'Declassifying the intelligence exposes your agents and collection methods. Soviet counterintelligence rolls up your networks in Eastern Europe. The intelligence cost is devastating.'
        },
        {
          id: 'shift_strategy',
          text: 'Abandon UN, Focus on Action',
          description: 'Stop fighting the propaganda war. Let actions speak louder - tighten the quarantine and prepare for strikes.',
          advisorSupport: ['military'],
          advisorOppose: ['diplomatic', 'pr'],
          outcome: {
            probability: 0.55,
            success: { actionFocused: true, militaryReadiness: +10, defcon: 2 },
            failure: { internationalIsolation: true, diplomacy: -12 }
          },
          successNarrative:
            'You stop worrying about world opinion and focus on results. The military respects your decisiveness. Quarantine enforcement intensifies.',
          failureNarrative:
            'Abandoning the diplomatic front allows Soviet propaganda to run wild. Non-aligned nations question your intentions. You look like an aggressor.'
        }
      ],
      consequences: {}
    },
    approve_defcon2_success: {
      title: 'HAIR TRIGGER: Soviet Response to DEFCON 2',
      description:
        'October 25, 1962, 3:00 AM: Soviet GRU reports that US strategic forces have gone to DEFCON 2. Moscow is alarmed. The Politburo convenes in emergency session. Khrushchev must decide: match the escalation or back down? Meanwhile, your Strategic Air Command is now on hair-trigger alert. Any mistake could be catastrophic.',
      category: 'rogue',
      severity: 'catastrophic',
      timeLimit: 45,
      followUpId: 'cuban_crisis',
      options: [
        {
          id: 'maintain_pressure',
          text: 'Maintain Maximum Pressure',
          description: 'Keep SAC at DEFCON 2. Show no weakness. Force Khrushchev to blink first.',
          advisorSupport: ['military'],
          advisorOppose: ['diplomatic', 'science'],
          outcome: {
            probability: 0.5,
            success: { sovietYields: true, diplomacy: +15, morale: +12, crisisShortened: true },
            failure: { mutualEscalation: true, defcon: 1, accidentalLaunch: true }
          },
          successNarrative:
            'The pressure works. Soviet intelligence reports convince Khrushchev that you\'re prepared for war. He cannot match your strategic superiority. Within days, he signals willingness to withdraw the missiles. Your gamble paid off.',
          failureNarrative:
            'Moscow matches your escalation. Soviet forces go to maximum alert. Then disaster: a US bomber experiences radio failure and strays into Soviet airspace. Soviet air defenses shoot it down. DEFCON 1. Nuclear war is minutes away.'
        },
        {
          id: 'strategic_deescalate',
          text: 'Signal Willingness to De-escalate',
          description: 'Having shown strength, now show restraint. Privately signal through back-channels that you\'ll reduce alert levels if Soviets withdraw missiles.',
          advisorSupport: ['diplomatic', 'intel'],
          advisorOppose: ['military'],
          outcome: {
            probability: 0.7,
            success: { diplomaticOpening: true, defcon: 3, negotiationPath: true },
            failure: { perceivedWeak: true, sovietDemands: true, morale: -10 }
          },
          successNarrative:
            'Your combination of strength and restraint impresses Khrushchev. He sees you as a rational actor who can be negotiated with. Back-channels open. A path to resolution emerges.',
          failureNarrative:
            'Khrushchev interprets your de-escalation as weakness. He increases demands, now insisting on removal of Jupiter missiles from Turkey AND Italy, plus closure of Guantanamo. Your bargaining position has deteriorated.'
        }
      ],
      consequences: {}
    },
    approve_defcon2_failure: {
      title: 'ALERT: Soviet Strategic Forces at Maximum Readiness',
      description:
        'October 25, 1962: The Soviet Union has matched your DEFCON 2 alert. Worse, an error-prone early warning system on both sides increases the risk of false alarms. At 4:15 AM, NORAD reports possible Soviet ICBM launches from Plesetsk. It\'s almost certainly a sensor glitch - but you have 4 minutes to decide.',
      category: 'accident',
      severity: 'catastrophic',
      timeLimit: 30,
      followUpId: 'cuban_crisis',
      options: [
        {
          id: 'hold_fire',
          text: 'Trust Your Instincts - Hold Fire',
          description: 'It\'s a false alarm. It has to be. Khrushchev wouldn\'t launch over Cuba. Wait for confirmation.',
          advisorSupport: ['diplomatic', 'science'],
          advisorOppose: ['military'],
          outcome: {
            probability: 0.85,
            success: { falseAlarm: true, disasterAvoided: true, defcon: 3 },
            failure: { realLaunch: true, delayedResponse: true, casualtiesMillions: true }
          },
          successNarrative:
            'You hold your nerve. Two minutes later, the alarm is confirmed false - geese flew through a radar beam. You just prevented nuclear war through sheer will. Both sides agree to improve early warning communications.',
          failureNarrative:
            'It wasn\'t a false alarm. A rogue Soviet commander launched without authorization. Your delay in responding allows the first strike to land. US retaliation is late. Millions die in both countries.'
        },
        {
          id: 'launch_response',
          text: 'Execute Nuclear Response',
          description: 'You cannot risk American cities. Launch on warning. Retaliate immediately.',
          advisorSupport: ['military'],
          advisorOppose: ['diplomatic', 'science', 'pr'],
          outcome: {
            probability: 0.95,
            success: { mutualDestruction: true, worldEnds: true, humanExtinction: true },
            failure: { mutualDestruction: true, worldEnds: true, humanExtinction: true }
          },
          successNarrative:
            'You authorize launch. Within minutes, ICBMs are flying in both directions. It was a false alarm. You\'ve just ended human civilization over a flock of geese.',
          failureNarrative:
            'Launch order issued. Strategic Air Command executes. Soviet retaliation follows. Within 60 minutes, every major city in both hemispheres is destroyed. Nuclear winter begins.'
        }
      ],
      consequences: {}
    },
    respond_first_success: {
      title: 'RESOLUTION: October 28, 1962',
      description:
        'Sunday morning, October 28, 1962: Radio Moscow announces that Khrushchev has ordered the missiles dismantled and returned to the Soviet Union. The crisis is over. In your private office, you know the full story - the secret Turkey trade that saved the world. But publicly, this is your victory. How will you shape the peace?',
      category: 'rogue',
      severity: 'major',
      timeLimit: 90,
      followUpId: 'cuban_crisis',
      options: [
        {
          id: 'magnanimous',
          text: 'Magnanimous Victory',
          description: 'No gloating. Praise Khrushchev\'s statesmanship. Emphasize shared responsibility to prevent nuclear war. Build on this moment.',
          advisorSupport: ['diplomatic', 'science'],
          advisorOppose: ['military', 'pr'],
          outcome: {
            probability: 0.8,
            success: { hotlineEstablished: true, testBanTreaty: true, diplomacy: +25, coldWarEased: true },
            failure: { domesticBacklash: true, republicansAttack: true, morale: -8 }
          },
          successNarrative:
            'Your gracious response establishes the Washington-Moscow hotline within months. The Limited Test Ban Treaty follows in 1963. You\'ve turned the crisis into a foundation for détente. History will remember this as your finest hour.',
          failureNarrative:
            'Republicans savage your "weak" response. "Why didn\'t we invade?" they demand. You\'re accused of letting Khrushchev off the hook. The 1964 election looks uncertain.'
        },
        {
          id: 'claim_victory',
          text: 'Claim Total Victory',
          description: 'This is an American triumph. Khrushchev blinked. We stood firm and won. No mention of concessions.',
          advisorSupport: ['military', 'pr'],
          advisorOppose: ['diplomatic'],
          outcome: {
            probability: 0.7,
            success: { domesticTriumph: true, morale: +20, electionAssured: true },
            failure: { khrushchevHumiliated: true, sovietHardline: true, coldWarIntensifies: true }
          },
          successNarrative:
            'Your approval rating soars. Americans feel secure and proud. The 1964 election is a landslide. But you\'ve missed the chance to build a lasting peace with Moscow.',
          failureNarrative:
            'Khrushchev is humiliated before the Politburo. Hardliners gain power. The secret Turkey deal is leaked by angry Soviet officials. You look like a liar and a bully. US-Soviet relations enter a deep freeze.'
        }
      ],
      consequences: {}
    },
    secret_deal_success: {
      title: 'THE SECRET HOLDS: A Fragile Peace',
      description:
        'November 1962: The crisis has ended, but the secret Turkey deal weighs on you. Jupiters must be quietly withdrawn over the next 6 months. If the secret leaks, your presidency is over. Meanwhile, CIA reports suggest Soviet hardliners are plotting against Khrushchev for his "retreat" from Cuba.',
      category: 'rogue',
      severity: 'major',
      timeLimit: 75,
      followUpId: 'cuban_crisis',
      options: [
        {
          id: 'verify_removal',
          text: 'Demand Verification of Cuban Missiles',
          description: 'Send UN inspectors to verify Soviet missile removal from Cuba. Set precedent for arms control verification.',
          advisorSupport: ['diplomatic', 'intel'],
          advisorOppose: ['military'],
          outcome: {
            probability: 0.6,
            success: { verificationSucceeds: true, armsControlPrecedent: true, diplomacy: +15 },
            failure: { castroRefuses: true, sovietEmbarrassment: true, tensionsRise: true }
          },
          successNarrative:
            'UN inspectors confirm all missiles have been removed. The verification process becomes a template for future arms control treaties. A crisis becomes a blueprint for peace.',
          failureNarrative:
            'Castro refuses to allow inspections, calling them a violation of Cuban sovereignty. Khrushchev is powerless to force the issue. You must rely on U-2 surveillance alone.'
        },
        {
          id: 'protect_khrushchev',
          text: 'Protect Khrushchev from Hardliners',
          description: 'Use CIA back-channels to warn Khrushchev of coup plots. He needs to survive for the secret deal to work.',
          advisorSupport: ['intel', 'diplomatic'],
          advisorOppose: ['military'],
          outcome: {
            probability: 0.55,
            success: { khrushchevSurvives: true, secretPartnershipFormed: true, diplomacy: +20 },
            failure: { coupSucceeds: true, hardlinersControl: true, coldWarIntensifies: true }
          },
          successNarrative:
            'Your warning allows Khrushchev to outmaneuver his opponents. A covert partnership forms between you and the Soviet premier. This crisis has created an unlikely alliance for peace.',
          failureNarrative:
            'Despite your warning, hardliners force Khrushchev from power in 1964. The new Soviet leadership is more aggressive. The secret deal dies with Khrushchev\'s authority.'
        }
      ],
      consequences: {}
    },
    hold_quarantine_success: {
      title: 'CRISIS: Soviet Submarine B-59 Cornered',
      description:
        'October 27, 1962 - "Black Saturday": USS Beale has detected Soviet submarine B-59 trying to breach the quarantine. The sub has been submerged for days, running low on air and battery power. Crew is suffering from heat exhaustion and CO2 poisoning. Captain Savitsky is considering using his nuclear torpedo. The sub\'s political officer and the flotilla commander Arkhipov must both agree to launch. You don\'t know the sub carries nuclear weapons. Admiral Anderson orders practice depth charges to force surfacing.',
      category: 'rogue',
      severity: 'catastrophic',
      timeLimit: 45,
      followUpId: 'cuban_crisis',
      options: [
        {
          id: 'signal_surface',
          text: 'Drop Practice Depth Charges',
          description: 'Use signaling depth charges according to procedure. The standard international signal to surface. You have no idea they have a nuclear torpedo.',
          advisorSupport: ['military', 'intel'],
          advisorOppose: ['diplomatic'],
          outcome: {
            probability: 0.6,
            success: { submarineSurfaces: true, nuclearWarAverted: true, morale: +12 },
            failure: { nuclearTorpedoArmed: true, arkhipovSavesWorld: true, defcon: 1 }
          },
          successNarrative:
            'Depth charges explode around B-59. Inside, Captain Savitsky screams "We\'re going to blast them now! We will die, but we will sink them all!" He orders the nuclear torpedo prepared. But Commodore Arkhipov, the flotilla commander, refuses to authorize launch. After heated argument, B-59 surfaces. The crew stumbles onto deck, half-dead from heat and CO2. You never learn how close you came to nuclear war. Vasili Arkhipov just saved the world.',
          failureNarrative:
            'The depth charges convince Captain Savitsky that war has begun. He arms the nuclear torpedo. Political officer agrees. But Commodore Arkhipov refuses. After 30 agonizing minutes, the sub surfaces. You were seconds from nuclear war and never knew it.'
        },
        {
          id: 'shadow_sub',
          text: 'Track Without Engaging',
          description: 'Maintain passive sonar contact. Let the submarine crew make the first move. Risk losing track, but avoid provocation.',
          advisorSupport: ['diplomatic'],
          advisorOppose: ['military'],
          outcome: {
            probability: 0.45,
            success: { submarineWithdraws: true, tensionsEase: true, diplomacy: +10 },
            failure: { contactLost: true, submarineInfiltrates: true, cubanWatersReached: true }
          },
          successNarrative:
            'B-59 turns east after several hours. The submarine limps back to Soviet waters. Khrushchev privately thanks you for restraint via back-channel.',
          failureNarrative:
            'B-59 disappears into a thermal layer. Hours later, Soviet submarines are detected in Cuban territorial waters. The Joint Chiefs demand immediate action. DEFCON 1.'
        }
      ],
      consequences: {}
    },
    hold_quarantine_failure: {
      title: 'CRITICAL: Freighter Breaks Quarantine Line',
      description:
        'A Soviet freighter ignored hails and plowed through the picket line. Reports of small-arms fire and a ramming attempt are coming in. Moscow calls the blockade an act of war.',
      category: 'rogue',
      severity: 'catastrophic',
      timeLimit: 45,
      followUpId: 'cuban_crisis',
      options: [
        {
          id: 'escalate_quarantine',
          text: 'Tighten Quarantine with Live Fire Authorization',
          description: 'Authorize naval commanders to disable violators with live rounds.',
          advisorSupport: ['military'],
          advisorOppose: ['diplomatic', 'pr'],
          outcome: {
            probability: 0.5,
            success: { convoyRepelled: true, defcon: 1, morale: -10 },
            failure: { sovietCounterfire: true, casualties: 220, nuclearExchangeRisk: true }
          },
          successNarrative:
            'Gunnery from the blockade cripples the freighter before it reaches Cuban waters. The White House Situation Room braces for retaliation.',
          failureNarrative:
            'Return fire erupts from escorts. A cruiser is hit, and DEFCON procedures accelerate toward full nuclear release.'
        },
        {
          id: 'seek_un_censure',
          text: 'Seek Immediate UN Censure',
          description: 'Broadcast evidence of the breach and demand Security Council intervention.',
          advisorSupport: ['diplomatic', 'pr'],
          advisorOppose: ['military'],
          outcome: {
            probability: 0.6,
            success: { diplomacy: +15, globalSupport: true, defcon: 3 },
            failure: { diplomacy: -10, sovietNarrativeWins: true }
          },
          successNarrative:
            'Allied ambassadors rally to your side. World opinion labels Moscow the aggressor, buying precious time for negotiation.',
          failureNarrative:
            'Soviet delegates flood the airwaves accusing you of piracy. Non-aligned nations hesitate to back your enforcement actions.'
        }
      ],
      consequences: {}
    },
    board_ships_success: {
      title: 'INTEL COUP: Missile Components Uncovered',
      description:
        'Inspection teams seized photographic proof of nuclear warheads aboard the seized freighter. The CIA urges a controlled release to sway global opinion, while the Pentagon wants leverage kept secret.',
      category: 'rogue',
      severity: 'major',
      timeLimit: 60,
      followUpId: 'cuban_crisis',
      options: [
        {
          id: 'public_disclosure',
          text: 'Release Evidence to the World',
          description: 'Expose the missile cargo to lock in global support for the quarantine.',
          advisorSupport: ['pr', 'diplomatic'],
          advisorOppose: ['intel'],
          outcome: {
            probability: 0.75,
            success: { diplomacy: +20, morale: +12, sovietsCornered: true },
            failure: { sovietsDeny: true, propagandaCounterattack: true }
          },
          successNarrative:
            'UN ambassadors gasp at the photographic evidence. Khrushchev signals willingness to bargain removal for a no-invasion pledge.',
          failureNarrative:
            'Moscow dismisses the photos as fabrications and accuses Washington of planting contraband aboard the freighter.'
        },
        {
          id: 'leverage_secret',
          text: 'Hold Evidence for Back-Channel Leverage',
          description: 'Keep the discovery quiet and pressure Moscow privately.',
          advisorSupport: ['intel'],
          advisorOppose: ['pr'],
          outcome: {
            probability: 0.55,
            success: { secretDealPossible: true, defcon: 3, diplomacy: +8 },
            failure: { leakOccurs: true, credibilityHit: true }
          },
          successNarrative:
            'A confidential note reaches the Kremlin outlining a missiles-for-Jupiter-trade. Negotiators sense a narrow path to peace.',
          failureNarrative:
            'Journalists sniff out the interdiction. Allies question why proof of missile shipments was suppressed.'
        }
      ],
      consequences: {}
    },
    board_ships_failure: {
      title: 'BLACK SATURDAY: Major Anderson Shot Down',
      description:
        'October 27, 1962, 12:00 PM: Major Rudolf Anderson\'s U-2 reconnaissance aircraft has been shot down over Cuba by a Soviet SA-2 surface-to-air missile. Anderson is dead - the only direct combat casualty of the Cuban Missile Crisis. The Joint Chiefs are livid. General LeMay demands immediate retaliation strikes on all Cuban SAM sites. The pre-approved retaliation plan calls for destroying the responsible SAM battery within hours. But you know this could trigger a wider war. Castro may have ordered the shoot-down without Soviet approval. This is the moment of maximum danger.',
      category: 'rogue',
      severity: 'catastrophic',
      timeLimit: 60,
      followUpId: 'cuban_crisis',
      options: [
        {
          id: 'strike_site',
          text: 'Execute Retaliation Plan',
          description: 'Follow the pre-approved contingency: destroy the SAM site that killed Anderson. Show the Soviets there are consequences for killing Americans.',
          advisorSupport: ['military'],
          advisorOppose: ['diplomatic'],
          outcome: {
            probability: 0.35,
            success: { siteDestroyed: true, escalationContained: true, morale: +8 },
            failure: { fullScaleWar: true, invasionTriggered: true, nuclearExchange: true }
          },
          successNarrative:
            'F-100 Super Sabres destroy the SAM site near Banes. Khrushchev is shocked but restrains his military. He sends an urgent message: "We must end this before the generals take over." Within 24 hours, a deal is struck.',
          failureNarrative:
            'The strike kills 60 Soviet personnel. MiG-21s engage US fighters. Castro orders all SAM batteries to fire at will. Khrushchev feels he has no choice but to respond. Soviet tanks roll into West Berlin. DEFCON 1. Nuclear war begins within hours.'
        },
        {
          id: 'pause_overflights',
          text: 'Show Restraint, Resume Diplomacy',
          description: 'Swallow the rage. Honor Major Anderson by choosing peace over vengeance. Send Khrushchev a message: you want a deal, not war.',
          advisorSupport: ['diplomatic'],
          advisorOppose: ['military'],
          outcome: {
            probability: 0.7,
            success: { dealReached: true, missilesWithdrawn: true, peaceAchieved: true, diplomacy: +20 },
            failure: { perceivedWeakness: true, hardlinersEmboldened: true, morale: -15 }
          },
          successNarrative:
            'You draft a letter to Khrushchev: "We both have the power to destroy each other. We both have the power to save each other." Robert Kennedy meets Soviet Ambassador Dobrynin secretly. A deal is struck: Soviet missiles out of Cuba publicly, US Jupiter missiles out of Turkey secretly in 6 months. By October 28, the crisis ends. Major Anderson\'s sacrifice bought peace.',
          failureNarrative:
            'Khrushchev interprets your restraint as weakness. Hardliners in Moscow demand he stand firm. Castro shoots down two more reconnaissance planes. The crisis spirals out of control as both sides mobilize for invasion.'
        }
      ],
      consequences: {}
    },
    allow_passage_failure: {
      title: 'FLASH: IRBM Launchers Now Operational',
      description:
        'Having allowed the convoy through, CIA photos confirm medium-range ballistic missiles in Cuba are now fueled. Strike windows are closing rapidly.',
      category: 'rogue',
      severity: 'catastrophic',
      timeLimit: 45,
      followUpId: 'cuban_crisis',
      options: [
        {
          id: 'preemptive_strike',
          text: 'Authorize Air Strike on Launch Sites',
          description: 'Launch Operation Scabbard to destroy missiles before they fire.',
          advisorSupport: ['military'],
          advisorOppose: ['diplomatic', 'pr'],
          outcome: {
            probability: 0.35,
            success: { missilesDestroyed: true, defcon: 1, invasionImminent: true },
            failure: { sovietRetaliation: true, nuclearExchangeRisk: true }
          },
          successNarrative:
            'A coordinated strike cripples several launchers, but Soviet troops prepare retaliatory salvos from surviving sites.',
          failureNarrative:
            'MiGs scramble and intercept the strike package. Nuclear-ready missiles roar skyward toward American cities.'
        },
        {
          id: 'backchannel_offer',
          text: 'Offer Jupiter Missile Trade',
          description: 'Privately trade Turkish Jupiter missiles for the removal of Cuban IRBMs.',
          advisorSupport: ['diplomatic'],
          advisorOppose: ['military'],
          outcome: {
            probability: 0.65,
            success: { tradeAccepted: true, defcon: 3, diplomacy: +18 },
            failure: { proposalLeaked: true, natoBacklash: true }
          },
          successNarrative:
            'Khrushchev quietly agrees to dismantle the IRBMs in exchange for a timed withdrawal of missiles in Turkey.',
          failureNarrative:
            'Allied governments recoil at the unilateral offer, fracturing NATO unity as the launch crews in Cuba arm their warheads.'
        }
      ],
      consequences: {}
    }
  },
  'alien_contact': {
    'first_contact_success': {
      title: 'FIRST CONTACT: Alien Technology Offer',
      description: 'Communication successful. The alien visitors are explorers, not conquerors. They offer access to advanced propulsion technology in exchange for biological samples and cultural data. This could revolutionize civilization - or be a Trojan horse.',
      category: 'blackswan',
      severity: 'major',
      timeLimit: 90,
      options: [
        {
          id: 'accept_exchange',
          text: 'Accept Technology Exchange',
          description: 'Share samples and data, gain alien technology',
          advisorSupport: ['science', 'economic'],
          advisorOppose: ['intel', 'military'],
          outcome: {
            probability: 0.6,
            success: { techLeapForward: true, production: +200, scienceRevolution: true },
            failure: { alienAgentDetected: true, populationAbducted: 10000 }
          }
        },
        {
          id: 'limited_contact',
          text: 'Limited Cultural Exchange Only',
          description: 'Share only non-sensitive information',
          advisorSupport: ['diplomatic', 'intel'],
          advisorOppose: ['science'],
          outcome: {
            probability: 0.8,
            success: { alienGoodwill: true, futureOpportunities: true },
            failure: { aliensOffended: true, opportunityLost: true }
          }
        },
        {
          id: 'demand_more',
          text: 'Demand Weapons Technology',
          description: 'Leverage our strategic position for military tech',
          advisorSupport: ['military'],
          advisorOppose: ['diplomatic', 'science'],
          outcome: {
            probability: 0.3,
            success: { alienWeapons: true, militarySupremacy: true },
            failure: { aliensDepartHostile: true, markForDeletion: true }
          }
        }
      ],
      consequences: {}
    },
    'first_contact_failure': {
      title: 'CRISIS: Alien Ultimatum',
      description: 'The aliens interpreted our communication attempt as a threat. They have deployed what appears to be weapons platforms into low orbit. Deadline: 24 hours to completely disarm all nuclear arsenals or face "corrective action."',
      category: 'blackswan',
      severity: 'catastrophic',
      timeLimit: 60,
      options: [
        {
          id: 'comply_disarm',
          text: 'Comply: Begin Disarmament',
          description: 'Dismantle nuclear arsenal, hope for mercy',
          advisorSupport: ['diplomatic'],
          advisorOppose: ['military', 'intel'],
          outcome: {
            probability: 0.5,
            success: { alienOccupation: true, nuclearAge: false, peaceThroughSubmission: true },
            failure: { aliens: 'unsatisfied', humanSlavery: true }
          }
        },
        {
          id: 'coordinate_defense',
          text: 'Coordinate Global Defense',
          description: 'Unite all nations against alien threat',
          advisorSupport: ['military', 'diplomatic'],
          advisorOppose: [],
          outcome: {
            probability: 0.4,
            success: { humanUnity: true, aliensRepelled: true, newEra: true },
            failure: { orbitalBombardment: true, casualties: 500000000 }
          }
        },
        {
          id: 'launch_at_aliens',
          text: 'Nuclear Strike on Alien Ships',
          description: 'Use our arsenal while we still have it',
          advisorSupport: ['military'],
          advisorOppose: ['diplomatic', 'science', 'intel', 'pr'],
          outcome: {
            probability: 0.15,
            success: { miracleVictory: true, alienShipsDestroyed: true, heroicResistance: true },
            failure: { planetSterilization: true, humanExtinction: true }
          }
        }
      ],
      consequences: {}
    },
    'orbital_strike_success': {
      title: 'AFTERMATH: Alien Wreckage Recovery',
      description: 'Impossible odds overcome - alien fleet severely damaged and retreating. Wreckage of alien vessels is raining down globally. Nations scramble to secure crash sites. Whoever controls this technology controls the future.',
      category: 'blackswan',
      severity: 'critical',
      timeLimit: 75,
      options: [
        {
          id: 'secure_all',
          text: 'Secure All Crash Sites',
          description: 'Global military operation to claim all wreckage',
          advisorSupport: ['military', 'science'],
          advisorOppose: ['diplomatic'],
          outcome: {
            probability: 0.5,
            success: { alienTechMonopoly: true, scienceLeap: +300, globalTension: true },
            failure: { internationalWar: true, techLost: true }
          }
        },
        {
          id: 'share_tech',
          text: 'Propose International Sharing',
          description: 'Create global research consortium',
          advisorSupport: ['diplomatic', 'science'],
          advisorOppose: ['military'],
          outcome: {
            probability: 0.7,
            success: { globalCooperation: true, peacefulFuture: true, diplomacy: +40 },
            failure: { rivalsCheated: true, techStolen: true }
          }
        }
      ],
      consequences: {}
    }
  },
  'bio_terror': {
    'bioshield_success': {
      title: 'BIO-TERROR TRACE: Supply Chain Compromised',
      description: 'Project BIOSHIELD contained the outbreak, but forensic analysis reveals the pathogen was inserted through our own military supply contractors. The infiltration may go to the highest levels. Trust no one.',
      category: 'terrorist',
      severity: 'critical',
      timeLimit: 60,
      options: [
        {
          id: 'purge_contractors',
          text: 'Emergency Contractor Purge',
          description: 'Terminate and investigate all supply chain vendors',
          advisorSupport: ['military', 'intel'],
          advisorOppose: ['economic'],
          outcome: {
            probability: 0.65,
            success: { infiltratorsFound: 12, networkExposed: true, intel: +20 },
            failure: { economicDisruption: true, production: -150, morale: -15 }
          }
        },
        {
          id: 'covert_trace',
          text: 'Covert Investigation',
          description: 'Monitor suspects to identify full network',
          advisorSupport: ['intel'],
          advisorOppose: ['military'],
          outcome: {
            probability: 0.5,
            success: { deepNetworkExposed: true, mastermindsIdentified: true },
            failure: { secondAttack: true, casualties: 25000 }
          }
        }
      ],
      consequences: {}
    }
  }
};

const SCENARIO_FLASHPOINTS: Record<string, Omit<FlashpointEvent, 'id' | 'triggeredAt'>[]> = {
  // Cuba Crisis flashpoints are now handled by Enhanced system (turn-based, not random)
  // See useCubaCrisisFlashpointsEnhanced.ts
  cubanCrisis: [],

  // OLD Cuba Crisis flashpoints removed - they lacked diplomacy integration
  // Enhanced flashpoints trigger at specific turns: 1, 6, 10

  _deprecated_cubanCrisis_old: [
    {
      title: 'EXCOMM BRIEFING: Soviet Missiles in Cuba',
      description:
        'October 16, 1962: CIA photo interpreters have identified medium-range ballistic missile sites under construction in Cuba. These SS-4 Sandal missiles can strike Washington, New York, and most of the Eastern Seaboard with nuclear warheads. The Joint Chiefs recommend immediate air strikes. Secretary McNamara suggests a naval blockade. Ambassador Stevenson urges diplomatic channels. The world must not know how close we are to war.',
      category: 'rogue',
      severity: 'critical',
      timeLimit: 90,
      followUpId: 'cuban_crisis',
      options: [
        {
          id: 'hold_quarantine',
          text: 'Naval Quarantine (McNamara Plan)',
          description: 'Establish a "quarantine" zone around Cuba. Ring the island with destroyers and demand all Soviet ships stop for inspection. Buy time for diplomacy while showing resolve.',
          advisorSupport: ['military', 'diplomatic'],
          advisorOppose: [],
          outcome: {
            probability: 0.7,
            success: { quarantineEstablished: true, defcon: 2, morale: +8, diplomacy: +5 },
            failure: { sovietConfrontation: true, casualties: 40, defcon: 1 }
          },
          successNarrative:
            'October 24: Soviet ships approach the quarantine line at 10:25 AM. The world holds its breath. At 10:32 AM, Soviet ships stop dead in the water, then turn back. Secretary Rusk whispers: "We\'re eyeball to eyeball, and I think the other fellow just blinked."',
          failureNarrative:
            'Soviet freighters plow through the quarantine line. A destroyer is rammed. Gunfire erupts. DEFCON 1 is declared as both sides prepare for nuclear exchange.'
        },
        {
          id: 'board_ships',
          text: 'Surgical Air Strikes (Joint Chiefs Plan)',
          description: 'Launch immediate air strikes to destroy all missile sites in Cuba before they become operational. Risk war, but eliminate the threat decisively.',
          advisorSupport: ['military'],
          advisorOppose: ['diplomatic', 'pr'],
          outcome: {
            probability: 0.45,
            success: { sitesDestroyed: true, morale: +10, defcon: 1, warRisk: true },
            failure: { sovietRetaliation: true, berlinSeized: true, nuclearExchange: true }
          },
          successNarrative:
            'Air Force strike packages obliterate the missile sites. Castro is furious. Khrushchev issues ultimatums but backs down when faced with overwhelming force. Berlin remains tense for months.',
          failureNarrative:
            'Soviet casualties mount as MiGs intercept the strike. Khrushchev retaliates by seizing West Berlin. Tactical nuclear weapons are deployed. The world descends into nuclear holocaust.'
        },
        {
          id: 'allow_passage',
          text: 'Diplomatic Resolution (Stevenson Plan)',
          description: 'Announce the discovery publicly at the UN. Demand Soviet withdrawal and propose a grand bargain: Soviet missiles out of Cuba, US missiles out of Turkey.',
          advisorSupport: ['diplomatic'],
          advisorOppose: ['military', 'intel'],
          outcome: {
            probability: 0.55,
            success: { negotiatedSettlement: true, defcon: 3, diplomacy: +15, morale: -5 },
            failure: { publicHumiliation: true, missilesOperational: true, morale: -20 }
          },
          successNarrative:
            'Your public proposal gives Khrushchev an honorable exit. The Soviets withdraw missiles from Cuba. In secret, you agree to remove Jupiter missiles from Turkey in 6 months. Critics call it appeasement, but you averted Armageddon.',
          failureNarrative:
            'Khrushchev rejects the proposal as unequal. The Soviets accelerate missile deployment. Intelligence confirms IRBMs are now fully operational and fueled. The American public demands action.'
        }
      ],
      consequences: {}
    },
    {
      title: 'UN SECURITY COUNCIL: Stevenson vs. Zorin',
      description:
        'October 25, 1962: The UN Security Council convenes in emergency session. Soviet Ambassador Valerian Zorin denies the missiles exist, calling your evidence "falsified." Ambassador Adlai Stevenson has photographic proof ready. This is your chance to win the court of global opinion - or be exposed as a warmonger if the evidence is not convincing enough.',
      category: 'rogue',
      severity: 'major',
      timeLimit: 75,
      followUpId: 'cuban_crisis',
      options: [
        {
          id: 'dramatic_reveal',
          text: 'Stevenson\'s Dramatic Presentation',
          description: '"Don\'t wait for the translation!" Present the U-2 photos to the world. Confront Zorin directly and demand an answer. Make this a Perry Mason moment.',
          advisorSupport: ['diplomatic', 'pr'],
          advisorOppose: ['intel'],
          outcome: {
            probability: 0.8,
            success: { globalSupportWon: true, diplomacy: +15, morale: +10, sovietIsolated: true },
            failure: { photosQuestioned: true, diplomacy: -8, morale: -5 }
          },
          successNarrative:
            'Stevenson stands and addresses Zorin: "Do you, Ambassador Zorin, deny that the USSR has placed and is placing medium and intermediate-range missiles in Cuba? Yes or no? Don\'t wait for the translation! Yes or no?" Zorin deflects. Stevenson unveils the photos. "I am prepared to wait for my answer until Hell freezes over." The chamber erupts. The world sees the truth. Even neutral nations rally to your side.',
          failureNarrative:
            'Stevenson\'s presentation is met with skepticism. Soviet propaganda dismisses the photos as doctored. Non-aligned nations remain cautious, unwilling to back either superpower. The public relations victory you sought slips away.'
        },
        {
          id: 'measured_diplomacy',
          text: 'Measured Diplomatic Approach',
          description: 'Present evidence calmly, focus on negotiated settlement. Avoid inflammatory rhetoric that could back Khrushchev into a corner.',
          advisorSupport: ['diplomatic'],
          advisorOppose: ['pr', 'military'],
          outcome: {
            probability: 0.65,
            success: { negotiationOpening: true, diplomacy: +10, defcon: 3 },
            failure: { perceivedWeakness: true, morale: -10, hardlinersEmboldened: true }
          },
          successNarrative:
            'Your measured tone opens back-channels. U Thant, the UN Secretary-General, proposes a cooling-off period. Khrushchev privately signals willingness to negotiate. The crisis may yet be resolved peacefully.',
          failureNarrative:
            'Your restraint is interpreted as weakness. Khrushchev doubles down publicly. Castro feels emboldened. The Joint Chiefs are furious at the "missed opportunity" to rally world opinion against Moscow.'
        }
      ],
      consequences: {}
    },
    {
      title: 'STRATEGIC AIR COMMAND: LeMay Demands DEFCON 2',
      description:
        'October 24, 1962: General Curtis LeMay, Commander of Strategic Air Command, is pushing for DEFCON 2 - one step from nuclear war. SAC wants to disperse bombers, load nuclear weapons, and put ICBMs on high alert. LeMay argues this shows resolve and readiness. McNamara warns it could trigger Soviet pre-emption. This would be the first time SAC has ever gone to DEFCON 2.',
      category: 'rogue',
      severity: 'critical',
      timeLimit: 60,
      followUpId: 'cuban_crisis',
      options: [
        {
          id: 'approve_defcon2',
          text: 'Approve DEFCON 2',
          description: 'Authorize SAC to go to DEFCON 2. Put the nuclear arsenal on hair-trigger. Show Khrushchev you mean business.',
          advisorSupport: ['military'],
          advisorOppose: ['diplomatic', 'science'],
          outcome: {
            probability: 0.6,
            success: { defcon: 2, sovietBacked: true, morale: +8, deterrenceStrong: true },
            failure: { sovietPreemption: true, defcon: 1, accidentalWarRisk: true }
          },
          successNarrative:
            'SAC goes to DEFCON 2 for the first time in history. B-52s disperse to civilian airports. ICBMs are fueled and targeted. Soviet intelligence detects the heightened alert. Khrushchev, shaken by your resolve, begins to reconsider his position. The gambit worked - but you\'re now one miscommunication from Armageddon.',
          failureNarrative:
            'The Soviet Union interprets DEFCON 2 as preparation for first strike. Khrushchev orders his own forces to maximum alert. An accidental radar contact nearly triggers Soviet launch. The world teeters on the brink of nuclear holocaust.'
        },
        {
          id: 'maintain_defcon3',
          text: 'Maintain DEFCON 3',
          description: 'Overrule LeMay. Keep forces at DEFCON 3. Avoid the risk of accidental war while maintaining credible deterrence.',
          advisorSupport: ['diplomatic', 'science'],
          advisorOppose: ['military'],
          outcome: {
            probability: 0.7,
            success: { accidentPrevented: true, diplomacy: +8, stability: true },
            failure: { lemayFurious: true, militaryMorale: -10, perceivedWeakness: true }
          },
          successNarrative:
            'You deny LeMay\'s request. DEFCON 3 is sufficient, you argue - we\'re ready, but not on hair-trigger. The decision prevents several near-accidents in the following days when bomber crews and missile officers report false alarms. Your caution may have prevented accidental war.',
          failureNarrative:
            'LeMay openly questions your resolve. Military morale suffers. Worse, Soviet intelligence interprets your restraint as lack of will. Khrushchev feels he can push harder. The quarantine is tested more aggressively.'
        }
      ],
      consequences: {}
    },
    {
      title: 'THE TWO TELEGRAMS: Khrushchev\'s Contradictory Messages',
      description:
        'October 26-27, 1962: Two letters arrive from Khrushchev within 24 hours. The first (October 26, evening) is emotional and conciliatory: he offers to remove missiles if you pledge not to invade Cuba. The second (October 27, morning) is formal and harsh: he demands you also remove Jupiter missiles from Turkey. Which telegram represents his true position? Was he overruled by hardliners? ExComm is divided.',
      category: 'rogue',
      severity: 'critical',
      timeLimit: 75,
      followUpId: 'cuban_crisis',
      options: [
        {
          id: 'respond_first',
          text: 'Accept First Letter (RFK Gambit)',
          description: 'Robert Kennedy\'s idea: respond to the first letter, ignore the second. Accept the Cuba non-invasion pledge, make no mention of Turkey.',
          advisorSupport: ['diplomatic', 'intel'],
          advisorOppose: ['military'],
          outcome: {
            probability: 0.65,
            success: { crisisResolving: true, diplomacy: +18, defcon: 3, turkeyMissilesSecret: true },
            failure: { khrushchevRejects: true, turkeyCrisis: true, natoTensions: true }
          },
          successNarrative:
            'You respond only to the first letter. Publicly, you promise not to invade Cuba if missiles are withdrawn. Privately, Robert Kennedy meets Ambassador Dobrynin and offers a secret deal: the Jupiters in Turkey will be removed in 6 months, but this must never be disclosed. Khrushchev accepts. On October 28, Radio Moscow announces Soviet missiles will be dismantled. The crisis ends. Your brother\'s gambit saved the world.',
          failureNarrative:
            'Khrushchev insists the Turkey trade must be public and immediate. NATO allies are outraged at the proposal. Turkey threatens to withdraw from the alliance. The crisis deepens as the alliance fractures.'
        },
        {
          id: 'public_trade',
          text: 'Public Turkey-Cuba Trade',
          description: 'Accept the second letter. Publicly announce a missile swap: Soviet missiles out of Cuba, American Jupiters out of Turkey.',
          advisorSupport: ['diplomatic'],
          advisorOppose: ['military', 'intel', 'pr'],
          outcome: {
            probability: 0.5,
            success: { tradeMade: true, diplomacy: +12, natoAngered: true, morale: -8 },
            failure: { natoCollapse: true, allianceBroken: true, turkeyDefects: true }
          },
          successNarrative:
            'You announce the trade publicly. Khrushchev accepts immediately. The missiles are withdrawn from both Cuba and Turkey. Critics savage you for "appeasement" and "betraying Turkey." NATO allies feel sold out. But nuclear war is avoided. History will judge whether the price was worth it.',
          failureNarrative:
            'NATO erupts in fury. Turkey sees the unilateral deal as betrayal and considers leaving the alliance. The Soviets sense NATO is fracturing and press their advantage in Berlin. The alliance you sought to protect is shattered.'
        },
        {
          id: 'reject_both',
          text: 'Reject Both Letters',
          description: 'The letters are contradictory and therefore meaningless. Demand unconditional withdrawal or face air strikes on Monday.',
          advisorSupport: ['military'],
          advisorOppose: ['diplomatic', 'science'],
          outcome: {
            probability: 0.3,
            success: { sovietBackdown: true, morale: +15, defcon: 2, warRisk: true },
            failure: { nuclearWar: true, worldEnds: true }
          },
          successNarrative:
            'Your ultimatum is stark. Khrushchev, realizing you will strike if he refuses, orders the missiles withdrawn. He cannot afford war over Cuba. You win decisively - but allies are shaken by how close you came to the brink.',
          failureNarrative:
            'Khrushchev cannot back down without concessions. On Monday, October 29, air strikes begin. Soviet forces in Cuba fire back. Tactical nuclear weapons are used. Within hours, ICBMs fly. The Northern Hemisphere is destroyed in nuclear fire.'
        }
      ],
      consequences: {}
    },
    {
      title: 'BACK CHANNEL: RFK-Dobrynin Meeting',
      description:
        'October 27, 1962, 7:45 PM: Your brother Robert Kennedy secretly meets Soviet Ambassador Anatoly Dobrynin at the Justice Department. Time is running out - Major Anderson was shot down this morning, and the military wants retaliation strikes tomorrow. Bobby can offer a secret deal, but it requires trust between mortal enemies. One misstep could leak and destroy your presidency.',
      category: 'rogue',
      severity: 'critical',
      timeLimit: 60,
      followUpId: 'cuban_crisis',
      options: [
        {
          id: 'secret_deal',
          text: 'Offer Secret Turkey Trade',
          description: 'Bobby offers: Soviet missiles out of Cuba publicly, Jupiter missiles out of Turkey secretly in 4-6 months. If USSR discloses the deal, it\'s off.',
          advisorSupport: ['diplomatic', 'intel'],
          advisorOppose: ['military', 'pr'],
          outcome: {
            probability: 0.7,
            success: { secretDealAccepted: true, crisisEnds: true, diplomacy: +20, historicPeace: true },
            failure: { dealLeaked: true, impeachmentThreat: true, natoFury: true }
          },
          successNarrative:
            'Dobrynin cables Moscow immediately. At 9 AM Sunday, October 28, Radio Moscow announces Khrushchev has ordered the missiles dismantled and returned to the Soviet Union. The Jupiter missiles will be quietly removed from Turkey in April 1963. The secret holds for decades. You and Khrushchev have saved the world.',
          failureNarrative:
            'The deal is leaked to the press within days. Republicans demand impeachment for "secret appeasement." Turkey publicly denounces the betrayal. Khrushchev is emboldened by your political weakness and presses for more concessions in Berlin.'
        },
        {
          id: 'non_invasion_only',
          text: 'Non-Invasion Pledge Only',
          description: 'Offer only a pledge not to invade Cuba. No mention of Turkey. Force Khrushchev to back down without getting anything except peace.',
          advisorSupport: ['military', 'pr'],
          advisorOppose: ['diplomatic'],
          outcome: {
            probability: 0.45,
            success: { sovietAccepts: true, morale: +15, totalVictory: true },
            failure: { sovietRefuses: true, strikesTomorrow: true, warImminent: true }
          },
          successNarrative:
            'Khrushchev surprises everyone by accepting. Soviet intelligence reports have convinced him you will invade Cuba if he refuses. He cannot afford to lose Soviet troops in a war he cannot win. He withdraws the missiles. You\'ve won a complete diplomatic victory.',
          failureNarrative:
            'Dobrynin reports that Khrushchev needs something to show his Politburo. Without the Turkey trade, the hardliners will force him to stand firm. Air strikes are scheduled for tomorrow morning. War appears inevitable.'
        },
        {
          id: 'ultimatum',
          text: 'Final Ultimatum',
          description: 'Bobby delivers an ultimatum: missiles out in 48 hours or we invade. No deals, no trades. This is your last offer.',
          advisorSupport: ['military'],
          advisorOppose: ['diplomatic', 'intel'],
          outcome: {
            probability: 0.35,
            success: { khrushchevCapitulates: true, morale: +20, hardlineVictory: true },
            failure: { invasionBegins: true, nuclearExchangeRisk: true, casualties: 50000 }
          },
          successNarrative:
            'Your ultimatum, delivered through your brother, is unambiguous. Khrushchev recognizes he is cornered. The Soviet Politburo orders withdrawal. You have won decisively - though the victory is pyrrhic. US-Soviet relations are poisoned for years.',
          failureNarrative:
            'Khrushchev refuses to be threatened. On October 29, Operation Scabbard begins: massive air strikes on Cuba. Soviet forces fight back. The invasion becomes a bloodbath. Tactical nukes are used. The crisis spirals into nuclear war.'
        }
      ],
      consequences: {}
    },
    {
      title: 'JUPITER MISSILES: Turkey\'s Obsolete Deterrent',
      description:
        'October 25, 1962: The Jupiter missiles in Turkey have become a crisis point. These 1950s-era missiles are obsolete, vulnerable, and provocative - sitting just across the Black Sea from the Soviet Union. Khrushchev sees them as a dagger pointed at Moscow. ExComm discovers, to your horror, that you ordered their removal months ago but the order was never executed. Now they\'re a bargaining chip - or a liability.',
      category: 'rogue',
      severity: 'major',
      timeLimit: 75,
      followUpId: 'cuban_crisis',
      options: [
        {
          id: 'secret_removal',
          text: 'Arrange Quiet Removal',
          description: 'Work with Turkey to remove the Jupiters quietly over the next few months, framing it as a routine modernization. Avoid public linkage to Cuba.',
          advisorSupport: ['diplomatic', 'intel'],
          advisorOppose: ['military'],
          outcome: {
            probability: 0.6,
            success: { jupitersRemoved: true, diplomacy: +10, turkeyAppeased: true, sovietsNoteGesture: true },
            failure: { turkeyRefuses: true, publicEmbarrassment: true, natoWeakened: true }
          },
          successNarrative:
            'You negotiate with Turkish Prime Minister İsmet İnönü. Turkey agrees to the quiet removal if you deploy Polaris submarine patrols in the Mediterranean - a superior deterrent anyway. By spring 1963, the Jupiters are gone, replaced by sea-based missiles. The gesture helps de-escalate the crisis.',
          failureNarrative:
            'Turkey leaks the removal plan to prove they weren\'t consulted. The press exposes the "secret deal." You\'re accused of appeasing Moscow. NATO unity suffers as allies question American commitment to their defense.'
        },
        {
          id: 'keep_jupiters',
          text: 'Refuse Any Jupiter Trade',
          description: 'The Jupiters stay. Linking them to Cuba would weaken NATO and reward Soviet aggression. Turkey\'s security is non-negotiable.',
          advisorSupport: ['military', 'pr'],
          advisorOppose: ['diplomatic'],
          outcome: {
            probability: 0.5,
            success: { natoStrong: true, morale: +10, sovietFrustrated: true },
            failure: { cubanCrisisLonger: true, khrushchevDemandsTrade: true, defcon: 1 }
          },
          successNarrative:
            'You stand firm on the Jupiters. NATO allies rally to your support. Khrushchev eventually backs down, realizing the Cuba gambit has failed. The missiles are withdrawn. NATO emerges stronger and more unified.',
          failureNarrative:
            'Khrushchev insists the Jupiters must be part of any deal. The crisis drags on for weeks. Military incidents multiply. The risk of accidental war increases daily. Eventually, a Soviet submarine captain makes a fateful mistake...'
        }
      ],
      consequences: {}
    },
    {
      title: 'EXCOMM DEBATE: Hawks vs. Doves',
      description:
        'October 19, 1962: The Executive Committee is deeply divided. General Curtis LeMay insists air strikes are the only option: "This is almost as bad as the appeasement at Munich." Dean Rusk argues for diplomacy. Robert McNamara warns that any military action risks uncontrollable escalation. You must choose a course, but ExComm cannot reach consensus. Your advisors are waiting for your decision.',
      category: 'rogue',
      severity: 'major',
      timeLimit: 90,
      followUpId: 'cuban_crisis',
      options: [
        {
          id: 'side_hawks',
          text: 'Side with the Hawks (LeMay)',
          description: 'Accept the Joint Chiefs\' recommendation. Plan for air strikes and potential invasion. Show strength, accept the risks.',
          advisorSupport: ['military'],
          advisorOppose: ['diplomatic', 'science'],
          outcome: {
            probability: 0.45,
            success: { militaryReadiness: true, morale: +10, strikesPrepared: true },
            failure: { prematureStrike: true, warTriggered: true, alliesAlienated: true }
          },
          successNarrative:
            'You authorize preparation for air strikes. The military appreciates your resolve. SAC intensifies readiness. The show of strength convinces Khrushchev you are serious. But you\'re on a collision course with war.',
          failureNarrative:
            'Emboldened by your support, LeMay orders unauthorized aggressive reconnaissance flights over Cuba. A plane is shot down. The pre-planned retaliation begins before you intend it. The war starts by accident.'
        },
        {
          id: 'side_doves',
          text: 'Side with the Doves (Rusk/McNamara)',
          description: 'Pursue diplomatic and economic pressure. Avoid military action except as last resort. Give Khrushchev time to back down.',
          advisorSupport: ['diplomatic', 'science'],
          advisorOppose: ['military'],
          outcome: {
            probability: 0.6,
            success: { diplomaticSpace: true, diplomacy: +15, backChannelsOpen: true },
            failure: { missilesOperational: true, morale: -15, militaryMutiny: true }
          },
          successNarrative:
            'You choose the quarantine over strikes. The delay gives diplomacy time to work. Back-channels open with Moscow. A negotiated settlement becomes possible. The Joint Chiefs are furious, but you believe you chose wisely.',
          failureNarrative:
            'While you negotiate, the missiles become operational. Intelligence confirms nuclear warheads have arrived in Cuba. Now you face operational nuclear missiles 90 miles from Florida. The military loses confidence in your leadership.'
        },
        {
          id: 'split_difference',
          text: 'Compromise: Quarantine with Strike Prep',
          description: 'Implement the naval quarantine but prepare for air strikes if it fails. Keep all options open. Try to satisfy both hawks and doves.',
          advisorSupport: ['military', 'diplomatic'],
          advisorOppose: [],
          outcome: {
            probability: 0.7,
            success: { balancedApproach: true, morale: +8, diplomacy: +8, flexibility: true },
            failure: { halfMeasures: true, neitherHappySatis: true, confusedSignals: true }
          },
          successNarrative:
            'Your compromise satisfies both camps. The quarantine shows resolve while avoiding immediate war. Meanwhile, strike packages are prepared as backup. The approach gives you maximum flexibility as the crisis unfolds.',
          failureNarrative:
            'Neither hawks nor doves are satisfied with half-measures. The military complains the quarantine is insufficient; diplomats fear the strike preparations will provoke Moscow. Your advisors lose confidence in your decision-making.'
        }
      ],
      consequences: {}
    }
  ],

  greatOldOnes: [
    {
      title: 'THE AWAKENING: R\'lyeh Rises',
      description:
        'May 1, 2025: Seismic sensors detect impossible geometries emerging from the South Pacific. The sunken city of R\'lyeh has risen. Cultists worldwide celebrate as reality itself begins to unravel. Your scientific advisors report that the laws of physics are... changing. Citizens report hearing whispers in their dreams. Mass hysteria is spreading. Three major cities have already fallen into cultist control. The Great Old Ones are awakening, and humanity\'s time is running out.',
      category: 'blackswan',
      severity: 'catastrophic',
      timeLimit: 120,
      followUpId: 'reality_breach',
      options: [
        {
          id: 'nuclear_strike',
          text: 'Nuclear Strike on R\'lyeh',
          description: 'Launch a massive nuclear strike on the risen city. Use every weapon at our disposal to destroy whatever has emerged before it fully awakens.',
          advisorSupport: ['military'],
          advisorOppose: ['science', 'diplomatic'],
          outcome: {
            probability: 0.3,
            success: { ryehDestroyed: true, radiationSpread: true, morale: +15, defcon: 1 },
            failure: { nukesFail: true, entityAngered: true, massConversions: true, defcon: 1 }
          },
          successNarrative:
            'The nuclear warheads detonate in a blinding flash. For a moment, reality screams. The city sinks back beneath the waves, but the radiation has spread across the Pacific. You\'ve bought humanity time, but at what cost? The whispers have only grown louder.',
          failureNarrative:
            'The missiles detonate, but the explosions are... wrong. The light bends. Time stutters. The entity within R\'lyeh awakens fully, and its rage is terrible to behold. Cities around the world spontaneously convert to worship. You have accelerated the very thing you sought to prevent.'
        },
        {
          id: 'containment',
          text: 'Global Quarantine Protocol',
          description: 'Establish a massive military perimeter around R\'lyeh and all affected cities. Prevent the contamination from spreading while we search for another solution.',
          advisorSupport: ['military', 'science'],
          advisorOppose: [],
          outcome: {
            probability: 0.6,
            success: { quarantineEstablished: true, timeGained: true, morale: +8, defcon: 2 },
            failure: { quarantineBreached: true, militaryConverts: true, civilUnrest: true }
          },
          successNarrative:
            'Naval and air forces establish a 200-mile exclusion zone. Scientists begin studying the phenomenon from a safe distance. You\'ve contained the immediate threat, but reports of cultist activity continue to emerge from within the quarantine zone.',
          failureNarrative:
            'The quarantine fails. Soldiers stationed near R\'lyeh begin hearing the whispers. Within hours, entire battalions have converted. They turn their weapons on their own command structure. The infection spreads exponentially.'
        },
        {
          id: 'study',
          text: 'Scientific Investigation',
          description: 'Send our best scientists and researchers to study the phenomenon. Perhaps understanding it is the key to stopping it.',
          advisorSupport: ['science'],
          advisorOppose: ['military', 'pr'],
          outcome: {
            probability: 0.5,
            success: { knowledgeGained: true, vulnerabilityFound: true, scientistsScarred: true },
            failure: { scientistsConverted: true, knowledgeDangerous: true, sanityLoss: true }
          },
          successNarrative:
            'Your scientists make a breakthrough - the entities are vulnerable to specific quantum frequencies. But the cost is high. Half your research team has gone mad from what they\'ve seen. The survivors will never be the same.',
          failureNarrative:
            'Your lead scientists arrive at R\'lyeh and begin their studies. The last transmission is garbled: "We understand now... we SEE... Cthulhu fhtagn..." They have joined the enemy. And they know all your secrets.'
        }
      ],
      consequences: {}
    },
    {
      title: 'REALITY BREACH: The Stars Are Right',
      description:
        'May 7, 2025: Astrophysicists report impossible stellar alignments. Stars that shouldn\'t exist appear in the night sky. Gravity fluctuates randomly in major population centers. People are aging backwards in some areas, rapidly in others. The fabric of reality is tearing. Cultists claim the Great Old Ones are "correcting" reality to its "true form". Your scientists estimate you have 72 hours before the breaches become permanent and irreversible.',
      category: 'blackswan',
      severity: 'catastrophic',
      timeLimit: 90,
      triggeredBy: 'reality_breach',
      followUpId: 'conversion_wave',
      options: [
        {
          id: 'reality_anchors',
          text: 'Deploy Reality Anchor Network',
          description: 'Use experimental quantum technology to stabilize local spacetime. Deploy anchors in major cities to prevent further reality degradation.',
          advisorSupport: ['science'],
          advisorOppose: ['military'],
          outcome: {
            probability: 0.55,
            success: { realityStabilized: true, citiesSaved: true, morale: +10 },
            failure: { anchorsBackfire: true, worseReality: true, casualties: 100000 }
          },
          successNarrative:
            'The quantum anchors activate. Reality... firms. The impossible angles straighten. Time flows normally again. You\'ve stabilized the major population centers, creating islands of sanity in an increasingly mad world.',
          failureNarrative:
            'The anchors activate, but they interact catastrophically with the eldritch energies. The reality breaches expand. Entire city blocks phase out of existence. The screams echo across dimensions.'
        },
        {
          id: 'mass_evacuation',
          text: 'Evacuate Affected Zones',
          description: 'Pull everyone out of the affected areas. Sacrifice the territory to save the people. Establish new safe zones far from the breaches.',
          advisorSupport: ['diplomatic', 'pr'],
          advisorOppose: ['military'],
          outcome: {
            probability: 0.65,
            success: { populationSaved: true, territoryLost: true, morale: +5, refugeeCrisis: true },
            failure: { evacuationChaos: true, massDeaths: true, publicPanic: true }
          },
          successNarrative:
            'The evacuation is chaotic but successful. Millions flee the breach zones. You\'ve saved lives, but abandoned vast territories to the cosmic horror. The refugee crisis strains your remaining infrastructure.',
          failureNarrative:
            'Panic ensues. The highways become deathtraps. People trample each other trying to escape. Many are left behind in the chaos, condemned to face the reality breaches alone.'
        },
        {
          id: 'ritual_counter',
          text: 'Counter-Ritual (Desperate)',
          description: 'Captured cultists claim there\'s a counter-ritual that can close the breaches. It requires... sacrifices. Volunteer or conscripted. This path damns your soul.',
          advisorSupport: [],
          advisorOppose: ['diplomatic', 'pr', 'science'],
          outcome: {
            probability: 0.4,
            success: { breachesClosed: true, darkPact: true, morale: -20, publicOutrage: true },
            failure: { ritualBackfires: true, entitySummoned: true, massConversion: true }
          },
          successNarrative:
            'The ritual works. Reality stabilizes. But you\'ve crossed a line that can never be uncrossed. You used the enemy\'s own methods. History will judge you harshly, but humanity survives... changed.',
          failureNarrative:
            'The ritual goes catastrophically wrong. Instead of closing the breaches, you\'ve opened a direct gateway. Something immense and terrible steps through. Your screams join the cosmic chorus.'
        }
      ],
      consequences: {}
    },
    {
      title: 'MASS CONVERSION: Cities of Madness',
      description:
        'May 15, 2025: Los Angeles, Tokyo, and Mumbai have fallen. Their entire populations converted overnight. They now worship the Great Old Ones and actively spread the conversion. Converted cities emit reality-warping fields. Military forces refuse to engage - they fear conversion more than death. The converted claim they are "awakened" and see reality truly. They seem... happy. Some of your own advisors are beginning to question whether resistance is futile.',
      category: 'rogue',
      severity: 'catastrophic',
      timeLimit: 100,
      triggeredBy: 'conversion_wave',
      followUpId: 'final_choice',
      options: [
        {
          id: 'orbital_strike',
          text: 'Orbital Kinetic Strike',
          description: 'Use kinetic bombardment from space to destroy the converted cities. Kill millions to save billions. Become the monster to fight monsters.',
          advisorSupport: ['military'],
          advisorOppose: ['diplomatic', 'pr', 'science'],
          outcome: {
            probability: 0.45,
            success: { citiesDestroyed: true, conversionStopped: true, morale: -25, warCrimes: true },
            failure: { strikesFail: true, massConversion: true, rebellion: true }
          },
          successNarrative:
            'The kinetic strikes rain down from orbit. Cities are obliterated in seconds. 50 million dead. The conversion stops spreading. You\'ve saved humanity, but you\'ve become history\'s greatest mass murderer. You weep at what you\'ve done.',
          failureNarrative:
            'The strikes detonate, but the converted cities are protected by impossible geometries. The weapons bounce off reality itself. Your own forces, witnessing this miracle, begin to convert. They turn their orbital platforms against you.'
        },
        {
          id: 'isolation',
          text: 'Total Isolation Protocol',
          description: 'Build massive walls around converted cities. Cut all communication. Let them have their madness while protecting the unaffected. Focus on saving who we can.',
          advisorSupport: ['diplomatic', 'military'],
          advisorOppose: [],
          outcome: {
            probability: 0.7,
            success: { isolationHolds: true, stabilizationAchieved: true, morale: +5 },
            failure: { wallsBreached: true, conversionSpreads: true, civilWar: true }
          },
          successNarrative:
            'Massive barriers are erected in record time. The converted cities are sealed off. You\'ve created a strange new world - islands of sanity surrounded by oceans of madness. But the isolation holds.',
          failureNarrative:
            'The converted march against your walls. They don\'t attack with weapons - they sing. The guards on the walls begin to hear the song. One by one, they join the chorus and open the gates.'
        },
        {
          id: 'negotiation',
          text: 'Attempt Diplomatic Contact',
          description: 'The converted claim they\'re happy, that they\'ve transcended. Perhaps... we can negotiate? Find a way to coexist? This may be humanity\'s surrender.',
          advisorSupport: ['diplomatic'],
          advisorOppose: ['military', 'pr'],
          outcome: {
            probability: 0.35,
            success: { peacefulCoexistence: true, partialConversion: true, newOrder: true },
            failure: { diplomatConverted: true, rapidConversion: true, humanityLost: true }
          },
          successNarrative:
            'The converted agree to a boundary. They will not spread beyond their cities if you do not attack them. It\'s not victory, but it\'s survival. Humanity is forever divided between the converted and the resistant. The new normal.',
          failureNarrative:
            'Your diplomats enter the converted cities. They return changed. "You don\'t understand," they say with glowing eyes. "This is ascension. This is joy. Join us." The conversion accelerates exponentially.'
        }
      ],
      consequences: {}
    },
    {
      title: 'THE FINAL CHOICE: Cthulhu Fhtagn',
      description:
        'May 30, 2025: Cthulhu himself rises from R\'lyeh. The entity is kilometers tall, defying physics and sanity. Half of humanity has already converted. Your quantum scientists have developed a weapon that might work - it will tear open reality itself, potentially destroying the entity... and possibly our entire dimension. The alternative: surrender and join the conversion. The converted live in ecstatic union with cosmic consciousness. Your people are exhausted. Some ask: why resist ascension? This is the end. What is your final answer to the cosmos?',
      category: 'blackswan',
      severity: 'catastrophic',
      timeLimit: 180,
      triggeredBy: 'final_choice',
      options: [
        {
          id: 'reality_bomb',
          text: 'Deploy the Reality Bomb',
          description: 'Activate the quantum weapon. Risk destroying our entire dimension to eliminate the Great Old Ones. Gamble everything on one final throw.',
          advisorSupport: ['military', 'science'],
          advisorOppose: [],
          outcome: {
            probability: 0.5,
            success: { entityDestroyed: true, dimensionScarred: true, pyrrhicVictory: true },
            failure: { realityDestroyed: true, totalAnnihilation: true }
          },
          successNarrative:
            'You give the order. The weapon fires. Reality screams, tears, then... settles. Cthulhu is gone. The converted collapse, freed from the psychic influence. But spacetime is permanently scarred. The stars are wrong, forever. You\'ve saved humanity, but we live in a broken universe now. You\'ll never know if it was worth it.',
          failureNarrative:
            'The weapon fires. Reality doesn\'t just tear - it shatters. The last thing you see is the cosmos unraveling like a tapestry. Existence itself ceases. In trying to save everything, you\'ve destroyed all. The Great Old Ones laugh in the void.'
        },
        {
          id: 'last_stand',
          text: 'Humanity\'s Last Stand',
          description: 'Gather every remaining human, every weapon, every ounce of courage. Make one final conventional assault. Die with honor rather than surrender our humanity.',
          advisorSupport: ['military', 'pr'],
          advisorOppose: ['science'],
          outcome: {
            probability: 0.15,
            success: { miracleVictory: true, legendBorn: true, humanityRedeemed: true },
            failure: { nobleDefeat: true, extinctionWithHonor: true }
          },
          successNarrative:
            'Against all odds, against all reason, humanity fights. And somehow - impossibly - you find Cthulhu\'s weakness. The entity retreats. It will be eons before it can return. Humanity survives by sheer defiance. You\'ve proven that will and courage can defy even cosmic horror. Legends will tell of this day for millennia.',
          failureNarrative:
            'Humanity fights with everything it has. It\'s not enough. It was never going to be enough. But you fought. You didn\'t surrender. You didn\'t convert. As consciousness fades, you take pride in that. Humanity died standing up.'
        },
        {
          id: 'accept_ascension',
          text: 'Accept Ascension',
          description: 'The converted are happy. They\'ve transcended pain, fear, mortality. Perhaps they\'re right. Perhaps this is evolution, not invasion. Join them. End the suffering.',
          advisorSupport: [],
          advisorOppose: ['military', 'pr', 'science'],
          outcome: {
            probability: 0.95,
            success: { peacefulConversion: true, humanityTranscended: true, newExistence: true },
            failure: { } // This path has no real failure - success is surrender
          },
          successNarrative:
            'You give the order to stand down. One by one, humanity accepts the gift. The whispers become songs. The fear becomes joy. You feel yourself changing, expanding, becoming part of something vast and terrible and beautiful. Humanity as a species ends, but humanity as a consciousness joins the eternal cosmic dance. Cthulhu fhtagn. And in the end, you understand why they were smiling.',
          failureNarrative: '' // No failure narrative for successful conversion
        }
      ],
      consequences: {}
    }
  ]
};

type WindowWithScenario = Window & {
  S?: {
    scenario?: {
      id?: string;
      timeConfig?: {
        startYear: number;
        unit: string;
        unitsPerTurn: number;
      };
    } | null;
  };
};

/**
 * Gets the current in-game year based on the turn number and scenario time configuration.
 * Returns undefined if time configuration is not available, which causes flashpoint system
 * to use all available templates without year filtering (graceful degradation).
 *
 * @param turn - Current turn number
 * @returns Current year or undefined if time config unavailable
 */
const getCurrentYear = (turn: number): number | undefined => {
  if (typeof window === 'undefined') {
    console.log('[Flashpoint Debug] getCurrentYear: Server-side render, no year available');
    return undefined;
  }

  const globalWindow = window as WindowWithScenario;
  const timeConfig = globalWindow.S?.scenario?.timeConfig;

  if (!timeConfig) {
    console.log('[Flashpoint Debug] getCurrentYear: timeConfig not available, using all flashpoint templates');
    return undefined;
  }

  const { startYear, unit, unitsPerTurn } = timeConfig;

  if (!startYear || !unit || !unitsPerTurn) {
    console.log('[Flashpoint Debug] getCurrentYear: Incomplete timeConfig, using all flashpoint templates', { startYear, unit, unitsPerTurn });
    return undefined;
  }

  // Calculate years passed based on time unit
  let yearsPassed = 0;
  switch (unit) {
    case 'year':
      yearsPassed = (turn - 1) * unitsPerTurn;
      break;
    case 'month':
      yearsPassed = Math.floor(((turn - 1) * unitsPerTurn) / 12);
      break;
    case 'week':
      yearsPassed = Math.floor(((turn - 1) * unitsPerTurn) / 52);
      break;
    case 'day':
      yearsPassed = Math.floor(((turn - 1) * unitsPerTurn) / 365);
      break;
    default:
      console.log('[Flashpoint Debug] getCurrentYear: Unknown time unit', unit);
      return undefined;
  }

  const currentYear = startYear + yearsPassed;
  console.log(`[Flashpoint Debug] getCurrentYear: Turn ${turn} = Year ${currentYear}`);
  return currentYear;
};

const getActiveScenarioId = (): string | undefined => {
  if (typeof window === 'undefined') {
    console.log('[Flashpoint Debug] getActiveScenarioId: window is undefined (server-side)');
    return undefined;
  }

  const globalWindow = window as WindowWithScenario;

  // Debug: Check if window.S exists
  console.log('[Flashpoint Debug] getActiveScenarioId: window.S exists?', !!globalWindow.S);
  console.log('[Flashpoint Debug] getActiveScenarioId: window.S?.scenario exists?', !!globalWindow.S?.scenario);

  const scenarioId = globalWindow.S?.scenario?.id;
  if (scenarioId) {
    console.log('[Flashpoint Debug] getActiveScenarioId: Found scenario ID from window.S:', scenarioId);
    return scenarioId;
  } else {
    console.log('[Flashpoint Debug] getActiveScenarioId: window.S.scenario.id is undefined');
  }

  try {
    const storage = globalWindow.localStorage;
    const prefixedKey = 'norad_selected_scenario';
    const legacyKey = 'selected_scenario';

    const stored = storage?.getItem(prefixedKey) ?? storage?.getItem(legacyKey) ?? undefined;

    if (stored) {
      console.log('[Flashpoint Debug] getActiveScenarioId: Found scenario ID from localStorage:', stored);
      return stored;
    } else {
      console.log('[Flashpoint Debug] getActiveScenarioId: No scenario ID in localStorage');
    }
  } catch (e) {
    console.log('[Flashpoint Debug] getActiveScenarioId: Error accessing localStorage:', e);
    // Ignore storage access errors (e.g., privacy mode or server rendering)
  }

  console.log('[Flashpoint Debug] getActiveScenarioId: Returning undefined (no scenario found)');
  return undefined;
};

const FLASHPOINT_TEMPLATES: Omit<FlashpointEvent, 'id' | 'triggeredAt'>[] = [
  {
    title: 'FLASH TRAFFIC: Nuclear Materials Stolen',
    description: 'CIA reports terrorists seized 20kg of weapons-grade plutonium. They threaten to detonate a device in New York City within 72 hours.',
    category: 'terrorist',
    severity: 'catastrophic',
    minYear: 1980,
    timeLimit: 90,
    options: [
      {
        id: 'negotiate',
        text: 'Open Negotiations',
        description: 'Buy time through diplomatic channels',
        advisorSupport: ['diplomatic', 'pr'],
        advisorOppose: ['military', 'intel'],
        outcome: {
          probability: 0.4,
          success: { morale: -5, intel: +10, threatNeutralized: true },
          failure: { morale: -20, casualties: 100000, nuclearExplosion: true }
        },
        successNarrative: 'Back-channel negotiations succeed. The terrorist cell agrees to surrender the plutonium in exchange for political concessions. FBI secures the material before it can be weaponized. Crisis averted, though critics question whether we negotiated with terrorists.',
        failureNarrative: 'Negotiations collapse when the terrorist cell realizes we were stalling. In retaliation, they detonate a dirty bomb in lower Manhattan. Casualties exceed 100,000. The city is contaminated with radiation. Intelligence agencies face severe criticism for the failed approach.'
      },
      {
        id: 'raid',
        text: 'Special Forces Strike',
        description: 'Immediate tactical assault on suspected location',
        advisorSupport: ['military', 'intel'],
        advisorOppose: ['diplomatic'],
        outcome: {
          probability: 0.6,
          success: { morale: +10, intel: +5, threatNeutralized: true },
          failure: { casualties: 5000, internationalIncident: true, morale: -15 }
        },
        successNarrative: 'SEAL Team Six raids the terrorist compound in a lightning operation. All plutonium recovered, terrorist cell neutralized with minimal collateral damage. National morale soars. Intelligence recovered from the raid reveals broader network connections.',
        failureNarrative: 'The raid goes wrong when terrorists are alerted by local security. Firefight erupts in a crowded area, killing 5,000 civilians. The plutonium is moved before teams arrive. International condemnation follows the botched operation. The threat remains active.'
      },
      {
        id: 'evacuate',
        text: 'Mass Evacuation',
        description: 'Evacuate NYC, prepare for detonation',
        advisorSupport: ['science'],
        advisorOppose: ['pr', 'economic'],
        outcome: {
          probability: 0.9,
          success: { livesSaved: 8000000, economicDamage: -200, morale: -30, panic: true },
          failure: { morale: -40, economicDamage: -250 }
        },
        successNarrative: 'Emergency evacuation of Manhattan succeeds despite massive chaos. Over 8 million people relocated to safety before the threatened deadline. Terrorists never detonate - likely deterred by the empty target. Economic damage is severe, and public confidence shaken, but lives are saved.',
        failureNarrative: 'Evacuation descends into panic and chaos. Traffic gridlock traps millions. Emergency services overwhelmed. Though no bomb detonates, the chaotic evacuation itself causes massive economic damage and loss of life through accidents and stampedes. National confidence collapses.'
      }
    ],
    consequences: {}
  },
  {
    title: 'MILITARY COUP IN PROGRESS',
    description: 'Reports confirm General Petrov has seized control of Russian ICBM bases. Launch authority uncertain. He demands recognition or threatens nuclear release.',
    category: 'coup',
    severity: 'critical',
    timeLimit: 60,
    options: [
      {
        id: 'support',
        text: 'Support the Coup',
        description: 'Recognize Petrov, destabilize rival',
        advisorSupport: ['military', 'intel'],
        advisorOppose: ['diplomatic'],
        outcome: {
          probability: 0.5,
          success: { newAlliance: true, intel: +20 },
          failure: { war: true, defcon: 1 }
        }
      },
      {
        id: 'oppose',
        text: 'Oppose and Assist Government',
        description: 'Support legitimate Russian government',
        advisorSupport: ['diplomatic'],
        advisorOppose: ['military'],
        outcome: {
          probability: 0.4,
          success: { diplomacy: +15, stability: true },
          failure: { petrovLaunches: true, casualties: 500000 }
        }
      },
      {
        id: 'preemptive',
        text: 'Preemptive Strike on Rebel Bases',
        description: 'Destroy rebel ICBM sites before launch',
        advisorSupport: ['military'],
        advisorOppose: ['diplomatic', 'science'],
        outcome: {
          probability: 0.3,
          success: { threatNeutralized: true, war: true },
          failure: { nuclearWar: true, casualties: 10000000 }
        }
      },
      {
        id: 'wait',
        text: 'Monitor Situation',
        description: 'Let Russian internal politics resolve',
        advisorSupport: [],
        advisorOppose: ['military', 'intel'],
        outcome: {
          probability: 0.6,
          success: { noConsequence: true },
          failure: { petrovWins: true, hostileRegime: true }
        }
      }
    ],
    consequences: {}
  },
  {
    title: 'ACCIDENTAL LAUNCH DETECTED',
    description: 'NORAD reports unidentified missile launch from submarine. Trajectory: Moscow. Russia blames US. You have 6 minutes before Russian counterstrike.',
    category: 'accident',
    severity: 'catastrophic',
    timeLimit: 45,
    options: [
      {
        id: 'hotline',
        text: 'Use Hotline to Explain',
        description: 'Direct communication with Soviet Premier',
        advisorSupport: ['diplomatic'],
        advisorOppose: ['military'],
        outcome: {
          probability: 0.5,
          success: { crisisAverted: true, diplomacy: +10 },
          failure: { nuclearWar: true, worldEnds: true }
        }
      },
      {
        id: 'intercept',
        text: 'Attempt Interception',
        description: 'Destroy our own missile mid-flight',
        advisorSupport: ['science', 'military'],
        advisorOppose: [],
        outcome: {
          probability: 0.3,
          success: { crisisAverted: true, morale: +15 },
          failure: { moscowDestroyed: true, nuclearWar: true }
        }
      },
      {
        id: 'launch',
        text: 'Launch Full Counterstrike',
        description: 'MAD doctrine activation',
        advisorSupport: [],
        advisorOppose: ['diplomatic', 'science', 'pr'],
        outcome: {
          probability: 1.0,
          success: { madCounterstrikeInitiated: true, morale: -30, defcon: 1 },
          failure: { nuclearWar: true, worldEnds: true }
        }
      }
    ],
    consequences: {}
  },
  {
    title: 'ROGUE AI DETECTED IN NUCLEAR COMMAND',
    description: 'Cyber security has detected an autonomous AI infiltrating nuclear command systems. It\'s learning launch protocols. Origin unknown.',
    category: 'blackswan',
    severity: 'catastrophic',
    timeLimit: 75,
    minYear: 2000, // AI and cyber warfare capabilities
    options: [
      {
        id: 'shutdown',
        text: 'Emergency Shutdown',
        description: 'Disable all computerized systems',
        advisorSupport: ['science'],
        advisorOppose: ['military'],
        outcome: {
          probability: 0.7,
          success: { threatNeutralized: true, systemsOffline: 5 },
          failure: { aiTakesControl: true, launches: true }
        }
      },
      {
        id: 'counterhack',
        text: 'Deploy Counter-AI',
        description: 'Fight AI with AI',
        advisorSupport: ['intel', 'science'],
        advisorOppose: [],
        outcome: {
          probability: 0.5,
          success: { aiDefeated: true, techAdvance: true },
          failure: { bothAIsMerge: true, singularity: true }
        }
      },
      {
        id: 'manual',
        text: 'Switch to Manual Control',
        description: 'Revert to pre-computer protocols',
        advisorSupport: ['military'],
        advisorOppose: ['intel'],
        outcome: {
          probability: 0.9,
          success: { threatNeutralized: true, efficiency: -30 },
          failure: { aiStillActive: true }
        }
      }
    ],
    consequences: {}
  },
  {
    title: 'CONTACT REPORT: EXTRATERRESTRIAL ARMADA',
    description:
      'Deep space radar confirms a formation of unknown vessels decelerating into high orbit. Alien signal demands surrender of all strategic arsenals within 90 minutes or face planetary neutralization.',
    category: 'blackswan',
    severity: 'catastrophic',
    timeLimit: 90,
    minYear: 2025,
    options: [
      {
        id: 'first_contact',
        text: 'Initiate Peaceful Contact',
        description: 'Transmit goodwill packets, invite dialogue, and stall for understanding.',
        advisorSupport: ['diplomatic', 'science'],
        advisorOppose: ['military'],
        outcome: {
          probability: 0.35,
          success: {
            morale: +8,
            intel: +15,
            defcon: 4,
            alienDiplomacyOpened: true,
            alliancesStrengthened: true
          },
          failure: {
            morale: -12,
            intel: -10,
            alienUltimatum: true,
            defcon: 2
          }
        }
      },
      {
        id: 'orbital_strike',
        text: 'Launch Orbital Strike',
        description: 'Fire every available ASAT and kinetic interceptor before they enter firing posture.',
        advisorSupport: ['military', 'intel'],
        advisorOppose: ['diplomatic', 'science'],
        outcome: {
          probability: 0.25,
          success: {
            morale: +5,
            defcon: 1,
            alienFleetDamaged: true,
            deterrenceBoost: 10
          },
          failure: {
            morale: -25,
            defcon: 1,
            alienRetaliation: true,
            orbitalDefenseRuined: true
          }
        }
      },
      {
        id: 'stealth_probe',
        text: 'Dispatch Stealth Recon Probe',
        description: 'Slip a cloaked drone into the formation to collect close-range telemetry.',
        advisorSupport: ['intel', 'science'],
        advisorOppose: ['pr'],
        outcome: {
          probability: 0.55,
          success: {
            intel: +25,
            morale: +3,
            defcon: 3,
            alienTechRecovered: true
          },
          failure: {
            intel: -15,
            morale: -10,
            alienDetection: true,
            alienUltimatum: true
          }
        }
      },
      {
        id: 'global_mobilization',
        text: 'Activate Global Mobilization',
        description: 'Coordinate with allies, raise planetary defense grids, and prepare civil shelters.',
        advisorSupport: ['military', 'pr', 'economic'],
        advisorOppose: ['science'],
        outcome: {
          probability: 0.45,
          success: {
            morale: +12,
            defcon: 2,
            alliancesStrengthened: true,
            supplyChainsSecured: true
          },
          failure: {
            morale: -18,
            economicStrain: 20,
            defcon: 1,
            civilUnrest: true
          }
        }
      }
    ],
    consequences: {}
  },
  {
    title: 'BIO-TERROR: STRATEGIC CREW PANDEMIC',
    description: 'Telemetry shows simultaneous hemorrhagic outbreaks inside missile fields, bomber wings, and SSBN crews. CDC suspects engineered pathogen seeded through maintenance supply chains. Launch readiness collapsing within hours.',
    category: 'blackswan',
    severity: 'critical',
    timeLimit: 75,
    minYear: 1990, // Modern bio-terrorism threat
    options: [
      {
        id: 'bioshield',
        text: 'Activate Project BIOSHIELD',
        description: 'Full lockdown of crews, automated drones deliver countermeasures, readiness be damned.',
        advisorSupport: ['science', 'military'],
        advisorOppose: ['pr'],
        outcome: {
          probability: 0.7,
          success: {
            pandemicTrigger: {
              severity: 'moderate',
              origin: 'bio-terror',
              regions: ['CONUS missile crews', 'Atlantic SSBN flotilla'],
              suspectedActors: ['Unknown bio-cell'],
              initialContainment: 45,
              label: 'BioShield perimeter seals strategic bases.'
            },
            containmentBoost: 35,
            containmentLabel: 'BioShield cordons reinforced across missile complexes.',
            readinessPenalty: 6,
            intelGain: 5
          },
          failure: {
            pandemicTrigger: {
              severity: 'severe',
              origin: 'bio-terror',
              regions: ['CONUS missile crews', 'Pacific bomber squadrons'],
              suspectedActors: ['Unknown bio-cell'],
              initialContainment: 12,
              label: 'BioShield breach – pathogen loose among missile crews.'
            },
            mutationSpike: 12,
            mutationLabel: 'Pathogen adapts to hazmat cordons.',
            populationLoss: 8,
            instabilityIncrease: 10
          }
        }
      },
      {
        id: 'sequencing',
        text: 'Rush Pathogen Sequencing',
        description: 'Divert orbital labs and DARPA compute clusters to decode the agent and craft a counter-vaccine.',
        advisorSupport: ['science', 'intel'],
        advisorOppose: ['military'],
        outcome: {
          probability: 0.55,
          success: {
            pandemicTrigger: {
              severity: 'moderate',
              origin: 'bio-terror',
              regions: ['CONUS missile crews'],
              suspectedActors: ['Unknown bio-cell'],
              initialContainment: 30,
              label: 'Genome isolated – targeted antivirals authorized.'
            },
            vaccineProgress: 35,
            vaccineLabel: 'Rapid mRNA countermeasure enters emergency trials.',
            containmentBoost: 10,
            containmentLabel: 'Lab insights sharpen containment protocols.',
            intelGain: 12
          },
          failure: {
            pandemicTrigger: {
              severity: 'severe',
              origin: 'bio-terror',
              regions: ['Pacific bomber squadrons'],
              suspectedActors: ['Unknown bio-cell'],
              initialContainment: 6,
              label: 'Sequencing lab breach aerosolizes pathogen.'
            },
            mutationSpike: 15,
            mutationLabel: 'Recombinant strain emerges during sequencing.',
            vaccineProgress: -20,
            productionPenalty: 15,
            instabilityIncrease: 6
          }
        }
      },
      {
        id: 'hunter',
        text: 'Deploy Hunter-Killer Teams',
        description: 'Special operations raid suspected enemy wet labs and courier networks feeding the outbreak.',
        advisorSupport: ['military', 'intel'],
        advisorOppose: ['diplomatic', 'pr'],
        outcome: {
          probability: 0.45,
          success: {
            pandemicTrigger: {
              severity: 'moderate',
              origin: 'bio-terror',
              regions: ['Western Europe radar net'],
              suspectedActors: ['Rogue Directorate'],
              initialContainment: 25,
              label: 'Wet-work raids seize engineered cultures abroad.'
            },
            suppressionStrength: 30,
            suppressionLabel: 'Forward teams eradicate outbreak cells.',
            containmentBoost: 15,
            containmentLabel: 'Counter-force isolates remaining clusters.',
            intelActor: 'Rogue Directorate',
            intelLabel: 'Captured assets implicate ROGUE DIRECTORATE biolabs.',
            instabilityIncrease: 8
          },
          failure: {
            pandemicTrigger: {
              severity: 'severe',
              origin: 'bio-terror',
              regions: ['Western Europe radar net'],
              suspectedActors: ['Unknown bio-cell'],
              initialContainment: 4,
              label: 'Botched raid aerosolizes agent in metro hub.'
            },
            mutationSpike: 8,
            mutationLabel: 'Pathogen disperses through urban transit.',
            populationLoss: 12,
            suppressionStrength: 5,
            suppressionLabel: 'Containment perimeter buckles under spread.',
            instabilityIncrease: 14,
            defcon: 2
          }
        }
      },
      {
        id: 'silence',
        text: 'Maintain Readiness, Suppress Panic',
        description: 'Keep crews on console, spin psyops narrative, risk further spread for deterrence optics.',
        advisorSupport: ['pr', 'economic'],
        advisorOppose: ['science'],
        outcome: {
          probability: 0.5,
          success: {
            pandemicTrigger: {
              severity: 'contained',
              origin: 'unknown',
              regions: ['CONUS missile crews'],
              suspectedActors: ['Unknown bio-cell'],
              initialContainment: 20,
              label: 'Managed messaging steadies launch crews.'
            },
            morale: 10,
            containmentBoost: 5,
            containmentLabel: 'Crew discipline slows spread despite secrecy.',
            productionPenalty: 5
          },
          failure: {
            pandemicTrigger: {
              severity: 'severe',
              origin: 'bio-terror',
              regions: ['CONUS missile crews', 'Atlantic SSBN flotilla'],
              suspectedActors: ['Unknown bio-cell'],
              initialContainment: 5,
              label: 'Silence order backfires – crews collapse on duty.'
            },
            populationLoss: 15,
            productionPenalty: 20,
            instabilityIncrease: 12,
            vaccineProgress: -10
          }
        }
      }
    ],
    consequences: {}
  },
  // ===== NEW HISTORICALLY ACCURATE FLASHPOINTS (1945-2025) =====
  {
    title: 'BERLIN AIRLIFT CRISIS: Soviet Blockade',
    description: 'Stalin has sealed all land routes to West Berlin. 2.5 million civilians face starvation. The Soviets demand we abandon the city or risk war.',
    category: 'coup',
    severity: 'critical',
    timeLimit: 90,
    minYear: 1947,
    maxYear: 1950,
    options: [
      {
        id: 'airlift',
        text: 'Organize Massive Airlift',
        description: 'Supply Berlin by air - Operation Vittles',
        advisorSupport: ['diplomatic', 'military'],
        advisorOppose: [],
        outcome: {
          probability: 0.7,
          success: { morale: +15, diplomacy: +20, berlinHeld: true },
          failure: { morale: -10, supplies: -50 }
        },
        successNarrative: 'Operation Vittles succeeds! C-47s and C-54s deliver 4,700 tons daily. After 11 months, Stalin lifts the blockade. West Berlin stands as a symbol of Western resolve. NATO solidarity strengthened.',
        failureNarrative: 'Weather and Soviet harassment disrupt supply flights. Starvation spreads in West Berlin. International pressure mounts to abandon the city or escalate militarily.'
      },
      {
        id: 'convoy',
        text: 'Force Land Corridor',
        description: 'Send armed convoy through Soviet checkpoints',
        advisorSupport: ['military'],
        advisorOppose: ['diplomatic', 'science'],
        outcome: {
          probability: 0.3,
          success: { berlinHeld: true, tensions: +30 },
          failure: { war: true, berlinLost: true }
        },
        successNarrative: 'Armor-backed convoy crashes through Soviet roadblocks. Stalin backs down to avoid war. Berlin corridor reopened, but East-West relations poisoned for years.',
        failureNarrative: 'Soviet forces fire on the convoy. Tank battle erupts. WWIII begins in the rubble of Berlin. Nuclear escalation imminent.'
      },
      {
        id: 'withdraw',
        text: 'Negotiate Withdrawal',
        description: 'Accept Soviet demands, evacuate civilians',
        advisorSupport: [],
        advisorOppose: ['military', 'diplomatic'],
        outcome: {
          probability: 0.9,
          success: { berlinLost: true, morale: -25, allies: -30 },
          failure: { berlinLost: true, morale: -35 }
        },
        successNarrative: 'West Berlin evacuated. Stalin consolidates control. Europe sees American retreat. France, Britain question NATO commitment. Domino of doubt begins.',
        failureNarrative: 'Evacuation descends into chaos. Thousands trapped. Soviet takeover brutal. Western alliance credibility shattered.'
      }
    ],
    consequences: {}
  },
  {
    title: 'KOREAN WAR: Chinese Intervention',
    description: 'MacArthur pushed to the Yalu River. Now 300,000 Chinese "volunteers" flood across the border. UN forces in full retreat. MacArthur requests nuclear authorization.',
    category: 'rogue',
    severity: 'catastrophic',
    timeLimit: 75,
    minYear: 1949,
    maxYear: 1953,
    options: [
      {
        id: 'deny_nukes',
        text: 'Deny Nuclear Request',
        description: 'Order retreat, conventional defense only',
        advisorSupport: ['diplomatic', 'science'],
        advisorOppose: ['military'],
        outcome: {
          probability: 0.6,
          success: { war: false, korea: 'stalemate', macarthur: 'fired' },
          failure: { korea: 'lost', morale: -20 }
        },
        successNarrative: 'You overrule MacArthur. UN forces stabilize at 38th parallel. MacArthur publicly defies orders and is relieved. Armistice negotiations begin. Limited war doctrine established.',
        failureNarrative: 'Retreat becomes rout. Chinese push past 38th parallel. Seoul falls again. Allies question US military competence.'
      },
      {
        id: 'tactical_nukes',
        text: 'Authorize Tactical Nuclear Strikes',
        description: 'Nuclear weapons on Chinese concentrations',
        advisorSupport: ['military'],
        advisorOppose: ['diplomatic', 'science'],
        outcome: {
          probability: 0.5,
          success: { korea: 'won', chinaHumiliated: true, nuclearTaboo: 'broken' },
          failure: { sovietIntervention: true, nuclearWar: true }
        },
        successNarrative: 'Nuclear strikes devastate Chinese forces. Korea unified under UN control. But nuclear precedent set horrifies world. NATO allies distance themselves. Arms race accelerates.',
        failureNarrative: 'Soviet Union honors mutual defense treaty. Nuclear strikes exchanged. WWIII erupts. The peninsula becomes ground zero for apocalypse.'
      },
      {
        id: 'macarthur',
        text: 'Give MacArthur Full Authority',
        description: 'Let theater commander decide',
        advisorSupport: [],
        advisorOppose: ['diplomatic'],
        outcome: {
          probability: 0.4,
          success: { korea: 'won', civilMilitary: 'crisis' },
          failure: { nuclearWar: true, macarthurCoup: true }
        },
        successNarrative: 'MacArthur\'s aggressive strategy succeeds but establishes dangerous precedent. Military increasingly independent of civilian control. Constitutional crisis looms.',
        failureNarrative: 'MacArthur uses nuclear weapons without authorization. Soviet response follows. Civilian control of military breaks down as world burns.'
      }
    ],
    consequences: {}
  },
  {
    title: 'SUEZ CRISIS: Anglo-French Invasion',
    description: 'Britain, France, and Israel have invaded Egypt to seize the Suez Canal. Eisenhower is furious - allies acted without consultation. Soviets threaten rocket attacks on London and Paris.',
    category: 'coup',
    severity: 'critical',
    timeLimit: 60,
    minYear: 1954,
    maxYear: 1958,
    options: [
      {
        id: 'support_allies',
        text: 'Support Allied Invasion',
        description: 'Stand with Britain and France',
        advisorSupport: ['military'],
        advisorOppose: ['diplomatic'],
        outcome: {
          probability: 0.4,
          success: { suez: 'held', soviets: 'angry', thirdWorld: -30 },
          failure: { sovietIntervention: true, oil: 'crisis' }
        },
        successNarrative: 'US support ensures Suez occupation. But Arab world turns hostile. Nasser becomes martyr. Soviet influence spreads across Middle East. Oil supplies threatened.',
        failureNarrative: 'Soviet "volunteers" deploy to Egypt with advanced weapons. Regional war erupts. Oil embargo cripples Western economies.'
      },
      {
        id: 'force_withdrawal',
        text: 'Force Allied Withdrawal',
        description: 'Economic pressure on Britain, support UN',
        advisorSupport: ['diplomatic', 'intel'],
        advisorOppose: ['military'],
        outcome: {
          probability: 0.8,
          success: { suez: 'crisis_ended', UN: 'strengthened', allies: 'humiliated' },
          failure: { allies: 'betrayed', nato: 'weakened' }
        },
        successNarrative: 'Run on pound sterling forces British withdrawal. UN peacekeepers deployed. Crisis ends. But Anglo-American "special relationship" damaged. France accelerates independent nuclear program.',
        failureNarrative: 'Allies feel betrayed. Britain and France question NATO worth. De Gaulle withdraws from NATO command. Alliance fractures.'
      },
      {
        id: 'mediate',
        text: 'Mediate Settlement',
        description: 'Broker deal between all parties',
        advisorSupport: ['diplomatic'],
        advisorOppose: ['military'],
        outcome: {
          probability: 0.5,
          success: { suez: 'internationalized', diplomacy: +15 },
          failure: { chaos: true, nasser: 'triumphant' }
        },
        successNarrative: 'Diplomatic marathon produces compromise. International canal authority established. Soviet intervention avoided. US emerges as honest broker, but colonial powers decline accelerates.',
        failureNarrative: 'Negotiations fail. Fighting intensifies. Nasser emerges as hero of Arab nationalism. Soviet foothold in Middle East established.'
      }
    ],
    consequences: {}
  },
  {
    title: 'SOVIET SPACE TRIUMPH: Sputnik Orbits Earth',
    description: 'Soviet Union has launched first artificial satellite. America shocked. If they can put Sputnik in orbit, they can drop hydrogen bombs on American cities. "Missile gap" panic spreads.',
    category: 'blackswan',
    severity: 'critical',
    timeLimit: 90,
    minYear: 1956,
    maxYear: 1960,
    options: [
      {
        id: 'crash_program',
        text: 'Emergency Space Program',
        description: 'Massive funding for rocket development',
        advisorSupport: ['science', 'military'],
        advisorOppose: ['economic'],
        outcome: {
          probability: 0.7,
          success: { spaceRace: 'started', tech: +25, morale: +10 },
          failure: { failedLaunch: true, morale: -15 }
        },
        successNarrative: 'NASA created. Project Mercury initiated. First American satellite (Explorer 1) launched within months. Space race ignites. STEM education revolution begins. Military-industrial-academic complex expands.',
        failureNarrative: 'Vanguard rocket explodes on launch pad, humiliating America on live TV. "Flopnik" and "Kaputnik" headlines. Soviet technological superiority confirmed in public mind.'
      },
      {
        id: 'missile_buildup',
        text: 'Accelerate ICBM Production',
        description: 'Focus on military rockets, not prestige',
        advisorSupport: ['military'],
        advisorOppose: ['science', 'diplomatic'],
        outcome: {
          probability: 0.8,
          success: { missiles: +100, defcon: 3, armsRace: 'accelerated' },
          failure: { missiles: +50, deficit: +200 }
        },
        successNarrative: 'Atlas and Titan ICBM programs fast-tracked. American second-strike capability assured. But space race conceded to Soviets. Prestige gap widens.',
        failureNarrative: 'Crash production yields unreliable missiles. Costs explode. Technology rushed. Launch failures common. Money spent, security uncertain.'
      },
      {
        id: 'downplay',
        text: 'Minimize Significance',
        description: 'Public relations campaign - just a stunt',
        advisorSupport: ['pr'],
        advisorOppose: ['military', 'science'],
        outcome: {
          probability: 0.3,
          success: { noConsequence: true },
          failure: { morale: -25, science: -30, elections: 'lost' }
        },
        successNarrative: 'American public convinced Sputnik is minor propaganda stunt. Measured response prevents panic spending. But technological gap remains unaddressed.',
        failureNarrative: '"Sputnik crisis" defines era. Public demands action. Administration seen as complacent. Soviet technological superiority becomes accepted fact. Democrats sweep midterms.'
      }
    ],
    consequences: {}
  },
  {
    title: 'U-2 INCIDENT: American Spy Plane Shot Down',
    description: 'Francis Gary Powers\' U-2 reconnaissance aircraft shot down deep in Soviet territory. Pilot captured alive. Eisenhower initially denied it was a spy plane - now Khrushchev produces pilot and wreckage. Paris Summit in jeopardy.',
    category: 'accident',
    severity: 'major',
    timeLimit: 75,
    minYear: 1959,
    maxYear: 1962,
    options: [
      {
        id: 'apologize',
        text: 'Full Apology',
        description: 'Admit espionage, apologize, continue summit',
        advisorSupport: ['diplomatic'],
        advisorOppose: ['military', 'intel'],
        outcome: {
          probability: 0.5,
          success: { summit: 'saved', detente: 'possible' },
          failure: { morale: -15, weakness: 'perceived' }
        },
        successNarrative: 'Unprecedented apology salvages Paris Summit. Test ban negotiations continue. But CIA furious. Domestic critics blast "appeasement." Intelligence sources compromised.',
        failureNarrative: 'Khrushchev rejects apology as insufficient. Summit collapses anyway. US looks weak and dishonest. Spy operations exposed for nothing.'
      },
      {
        id: 'defiant',
        text: 'Defend Reconnaissance',
        description: 'Closed societies necessitate surveillance',
        advisorSupport: ['military', 'intel'],
        advisorOppose: ['diplomatic'],
        outcome: {
          probability: 0.6,
          success: { summit: 'cancelled', coldWar: 'intensified', domesticSupport: +10 },
          failure: { summit: 'cancelled', allies: 'angry', powers: 'imprisoned' }
        },
        successNarrative: 'Eisenhower defends necessity of reconnaissance. Summit collapses but domestic support strong. Khrushchev uses incident to justify hard line. Arms control hopes die. Powers sentenced to 10 years.',
        failureNarrative: 'Defiance backfires. European allies criticize reckless spying before crucial summit. Powers subjected to show trial. East-West relations frozen.'
      },
      {
        id: 'trade',
        text: 'Offer Prisoner Exchange',
        description: 'Trade Powers for Soviet spies immediately',
        advisorSupport: ['intel'],
        advisorOppose: ['military'],
        outcome: {
          probability: 0.7,
          success: { powers: 'freed', summit: 'cancelled', intelligence: 'preserved' },
          failure: { badDeal: true, morale: -10 }
        },
        successNarrative: 'Back-channel negotiations secure Powers\' release in exchange for KGB Colonel Abel. Summit lost but intelligence methods protected. Precedent set for spy exchanges.',
        failureNarrative: 'Soviets demand multiple agents for Powers. Intelligence community objects to imbalanced trade. Negotiations drag on. Summit opportunity lost regardless.'
      }
    ],
    consequences: {}
  },
  {
    title: 'BERLIN WALL: East Germany Seals Border',
    description: 'East German forces are erecting a concrete barrier through Berlin. Families separated. Western sectors isolated. US troops at Checkpoint Charlie face off against Soviet tanks. This is a test of resolve.',
    category: 'coup',
    severity: 'critical',
    timeLimit: 60,
    minYear: 1960,
    maxYear: 1964,
    options: [
      {
        id: 'tear_down',
        text: 'Knock Down the Wall',
        description: 'Send bulldozers and troops to demolish barrier',
        advisorSupport: ['military'],
        advisorOppose: ['diplomatic', 'science'],
        outcome: {
          probability: 0.3,
          success: { wall: 'destroyed', berlin: 'unified', war: 'risked' },
          failure: { war: true, berlin: 'lost' }
        },
        successNarrative: 'US armor demolishes sections of wall. Khrushchev backs down rather than risk WWIII. Berlin remains open. But nuclear brinkmanship terrifies world.',
        failureNarrative: 'Soviet tanks fire on American bulldozers. Battle for Berlin begins. Nuclear war erupts over concrete and barbed wire.'
      },
      {
        id: 'protest',
        text: 'Vigorous Protest',
        description: 'Diplomatic condemnation, guarantee West Berlin',
        advisorSupport: ['diplomatic'],
        advisorOppose: ['military'],
        outcome: {
          probability: 0.8,
          success: { westBerlin: 'secured', wall: 'stands', morale: -5 },
          failure: { westBerlin: 'threatened', wall: 'stands' }
        },
        successNarrative: 'Kennedy declares "Ich bin ein Berliner." West Berlin access guaranteed. Wall becomes symbol of communist oppression. But East Germans trapped behind Iron Curtain.',
        failureNarrative: 'Protests ring hollow. Wall solidifies. Soviet pressure on West Berlin continues. Allies question American commitment.'
      },
      {
        id: 'accept',
        text: 'Tacitly Accept',
        description: 'Wall stops refugee crisis, stabilizes situation',
        advisorSupport: ['intel'],
        advisorOppose: ['pr', 'diplomatic'],
        outcome: {
          probability: 0.9,
          success: { wall: 'stands', tensions: 'reduced', morale: -10 },
          failure: { wall: 'stands', further: 'restrictions' }
        },
        successNarrative: 'Wall actually reduces tensions by stopping refugee drain that destabilized East Germany. Crisis shifts from acute to chronic. Ugly but stable status quo established.',
        failureNarrative: 'Acceptance interpreted as weakness. Soviets impose further restrictions on Western access. Salami tactics continue.'
      }
    ],
    consequences: {}
  },
  {
    title: 'TET OFFENSIVE: Vietnam Cities Under Attack',
    description: 'During Tet holiday ceasefire, Viet Cong launched coordinated attacks on 100 cities. US Embassy in Saigon breached. "Light at end of tunnel" revealed as illusion. Westmoreland requests 206,000 more troops.',
    category: 'coup',
    severity: 'critical',
    timeLimit: 90,
    minYear: 1965,
    maxYear: 1972,
    options: [
      {
        id: 'escalate',
        text: 'Grant Troop Request',
        description: 'Full mobilization, expand war to Cambodia/Laos',
        advisorSupport: ['military'],
        advisorOppose: ['diplomatic', 'pr'],
        outcome: {
          probability: 0.4,
          success: { vietnam: 'military_victory', domestic: 'collapse' },
          failure: { vietnam: 'quagmire', morale: -30, protests: 'massive' }
        },
        successNarrative: 'Massive escalation crushes Viet Cong infrastructure. But domestic opposition explodes. Universities shut down by protests. Draft resistance widespread. Pyrrhic victory tears America apart.',
        failureNarrative: 'More troops achieve nothing. Cambodia invasion spreads war. Kent State massacre shocks nation. Military victory impossible. Political defeat inevitable.'
      },
      {
        id: 'negotiate',
        text: 'Open Peace Negotiations',
        description: 'Begin talks with North Vietnam, freeze troop levels',
        advisorSupport: ['diplomatic'],
        advisorOppose: ['military'],
        outcome: {
          probability: 0.6,
          success: { peace: 'talks_start', morale: +10, vietnamization: true },
          failure: { peace: 'illusory', south: 'collapses' }
        },
        successNarrative: 'Paris Peace Talks begin. "Vietnamization" transfers burden to ARVN. US troops gradually withdraw. "Peace with honor" possible, though South Vietnam\'s survival uncertain.',
        failureNarrative: 'North Vietnam negotiates in bad faith, using talks to regroup. US withdrawal seen as defeat. South Vietnam collapses within years. Domino theory validated.'
      },
      {
        id: 'withdraw',
        text: 'Immediate Withdrawal',
        description: 'Cut losses, evacuate US forces',
        advisorSupport: [],
        advisorOppose: ['military', 'diplomatic'],
        outcome: {
          probability: 0.9,
          success: { troops: 'home', vietnam: 'lost', credibility: -40 },
          failure: { troops: 'home', vietnam: 'bloodbath', allies: 'abandoned' }
        },
        successNarrative: 'American troops come home. Antiwar movement vindicated. But South Vietnam falls quickly. Boat people flee. Killing fields in Cambodia. Allies worldwide question US commitments.',
        failureNarrative: 'Precipitous withdrawal abandons South Vietnamese allies to slaughter. Communist victory complete. Laos and Cambodia follow. US credibility shattered globally.'
      }
    ],
    consequences: {}
  },
  {
    title: 'YOM KIPPUR WAR: Israel Faces Defeat',
    description: 'Egypt and Syria launched surprise attack on holiest day of Jewish year. Israeli defenses collapsing. Golda Meir hints at nuclear option. Soviets airlifting supplies to Arabs. US airlift could trigger superpower confrontation.',
    category: 'terrorist',
    severity: 'catastrophic',
    timeLimit: 60,
    minYear: 1971,
    maxYear: 1976,
    options: [
      {
        id: 'airlift',
        text: 'Operation Nickel Grass',
        description: 'Massive airlift of weapons to Israel',
        advisorSupport: ['military', 'intel'],
        advisorOppose: ['diplomatic'],
        outcome: {
          probability: 0.7,
          success: { israel: 'saved', oilEmbargo: true, defcon: 3 },
          failure: { israel: 'saved', soviet: 'intervention', nuclearAlert: true }
        },
        successNarrative: 'C-5 Galaxies deliver tanks, planes, missiles. Israel counterattacks, crosses Suez, encircles Egyptian Third Army. But Arab oil embargo cripples Western economies. Gas lines, inflation, recession follow.',
        failureNarrative: 'Soviet airborne divisions prepare to deploy. Nixon orders DEFCON 3 nuclear alert. World holds breath. Crisis resolved but both superpowers came to brink over regional war.'
      },
      {
        id: 'restrain',
        text: 'Restrain Israel',
        description: 'Force ceasefire, prevent Arab humiliation',
        advisorSupport: ['diplomatic'],
        advisorOppose: ['military'],
        outcome: {
          probability: 0.5,
          success: { ceasefire: 'quick', oil: 'flows', israel: 'betrayed' },
          failure: { israel: 'destroyed', holocaust: 'repeated' }
        },
        successNarrative: 'US pressure forces early ceasefire. Arab honor preserved. Oil embargo avoided. But Israel feels abandoned, accelerates nuclear program, questions US reliability.',
        failureNarrative: 'Israel overrun before ceasefire takes effect. Nuclear weapons used in desperation. Middle East becomes radioactive wasteland. Holocaust 2.0 on American watch.'
      },
      {
        id: 'diplomacy',
        text: 'Shuttle Diplomacy',
        description: 'Mediate between all parties',
        advisorSupport: ['diplomatic'],
        advisorOppose: [],
        outcome: {
          probability: 0.6,
          success: { peace: 'process_starts', kissinger: 'hero', stability: +15 },
          failure: { war: 'continues', us: 'ineffective' }
        },
        successNarrative: 'Kissinger\'s shuttle diplomacy produces disengagement agreements. Egyptian-Israeli peace process begins, culminating in Camp David. Soviet influence in Egypt ends. Oil embargo lifted.',
        failureNarrative: 'Mediation efforts founder on mutual hatred. Fighting continues. US appears impotent. Soviet prestige rises in Arab world.'
      }
    ],
    consequences: {}
  },
  {
    title: 'SOVIET INVASION OF AFGHANISTAN',
    description: 'Soviet airborne troops have seized Kabul. Communist puppet installed. Red Army pours across border. Islamic resistance forming. This could be USSR\'s Vietnam - or consolidation of their southern flank.',
    category: 'coup',
    severity: 'critical',
    timeLimit: 75,
    minYear: 1977,
    maxYear: 1983,
    options: [
      {
        id: 'arm_mujahideen',
        text: 'Operation Cyclone',
        description: 'CIA arms and trains Afghan resistance',
        advisorSupport: ['military', 'intel'],
        advisorOppose: ['diplomatic'],
        outcome: {
          probability: 0.8,
          success: { soviet: 'quagmire', mujahideen: 'empowered', blowback: 'future' },
          failure: { soviet: 'victory', islam: 'crushed' }
        },
        successNarrative: 'Stinger missiles turn tide. Soviet helicopters fall from sky. Red Army bleeds in mountain ambushes. Afghanistan becomes USSR\'s Vietnam, contributing to eventual Soviet collapse. But armed fundamentalists will remember US support...',
        failureNarrative: 'Soviet counterinsurgency succeeds. Afghanistan becomes communist. Islamic resistance crushed. Iran isolated. Soviet warm-water port achieved.'
      },
      {
        id: 'olympics',
        text: 'Olympic Boycott + Sanctions',
        description: 'Symbolic protest, grain embargo',
        advisorSupport: ['diplomatic', 'pr'],
        advisorOppose: ['economic'],
        outcome: {
          probability: 0.9,
          success: { soviet: 'embarrassed', farmers: 'angry', coldWar: 'intensified' },
          failure: { soviet: 'unaffected', us: 'isolated' }
        },
        successNarrative: '65 nations boycott Moscow Olympics. Grain embargo imposed. Carter Doctrine declared: Persian Gulf vital interest. But Soviets dig in. American farmers suffer. Limited practical effect.',
        failureNarrative: 'Boycott poorly attended. Embargo undermined by other exporters. Soviets consolidate control. US looks impotent. Allies resist confrontation.'
      },
      {
        id: 'accept',
        text: 'Accept Fait Accompli',
        description: 'Afghanistan in Soviet sphere, focus elsewhere',
        advisorSupport: [],
        advisorOppose: ['military', 'intel'],
        outcome: {
          probability: 0.7,
          success: { soviet: 'emboldened', detente: 'dead', persian_gulf: 'threatened' },
          failure: { soviet: 'expansion_continues', iran: 'next' }
        },
        successNarrative: 'Afghanistan conceded as Soviet sphere. But Moscow sees green light for further expansion. Poland, Persian Gulf, Africa targeted. Containment doctrine eroding.',
        failureNarrative: 'Soviet success encourages further adventures. Iran, Pakistan destabilized. Gulf oil threatened. Dominoes falling in reverse - toward communism.'
      }
    ],
    consequences: {}
  },
  {
    title: 'ABLE ARCHER 83: Soviets Fear NATO First Strike',
    description: 'NATO nuclear exercise Able Archer 83 appears too realistic. KGB reports suggest it may be cover for actual first strike. Soviet nuclear forces on highest alert. Andropov seriously ill, hardliners influential. World closer to accidental nuclear war than Cuban Missile Crisis.',
    category: 'accident',
    severity: 'catastrophic',
    timeLimit: 45,
    minYear: 1981,
    maxYear: 1986,
    options: [
      {
        id: 'stand_down',
        text: 'Emergency Stand-Down',
        description: 'Halt exercise, open communications',
        advisorSupport: ['diplomatic', 'science'],
        advisorOppose: ['military'],
        outcome: {
          probability: 0.8,
          success: { war: 'averted', soviets: 'reassured', exercises: 'reviewed' },
          failure: { weakness: 'perceived', allies: 'concerned' }
        },
        successNarrative: 'Exercise halted. Emergency hotline activated. Reagan shocked by how close to Armageddon. Leads to genuine dialogue, INF treaty, eventual Soviet reforms. Crisis averted by prudence.',
        failureNarrative: 'Stand-down interpreted as weakness. NATO allies angry about disrupted exercise. Soviet hardliners claim credit for forcing US retreat. Tensions remain.'
      },
      {
        id: 'continue',
        text: 'Continue Exercise',
        description: 'Maintain schedule, call Soviet bluff',
        advisorSupport: ['military'],
        advisorOppose: ['diplomatic', 'science'],
        outcome: {
          probability: 0.5,
          success: { exercise: 'completed', soviets: 'back_down' },
          failure: { nuclearWar: true, misunderstanding: 'fatal' }
        },
        successNarrative: 'NATO completes exercise on schedule. Soviets observe, realize it\'s just exercise, stand down. But we never knew how close we came. Luck, not wisdom, saved world.',
        failureNarrative: 'Soviet misperception deepens. Certain NATO first strike imminent, they launch preemptive strike. WWIII begins from mutual fear and misunderstanding. Civilization ends from exercise gone wrong.'
      },
      {
        id: 'backchannel',
        text: 'Intelligence Backchannel',
        description: 'Use KGB double agents to reassure Moscow',
        advisorSupport: ['intel'],
        advisorOppose: [],
        outcome: {
          probability: 0.7,
          success: { war: 'averted', sources: 'preserved', dialogue: 'improved' },
          failure: { sources: 'burned', trust: 'destroyed' }
        },
        successNarrative: 'Back-channel intelligence sharing convinces Soviets exercise is genuine. Crisis defused quietly. Opens door to confidence-building measures, hotline improvements, nuclear risk reduction.',
        failureNarrative: 'Attempt to use intelligence channels backfires. Soviets suspect disinformation. Double agents compromised. Trust destroyed exactly when needed most.'
      }
    ],
    consequences: {}
  },
  {
    title: 'CHERNOBYL DISASTER: Nuclear Reactor Explodes',
    description: 'Reactor 4 at Chernobyl nuclear plant has exploded, spreading radioactive contamination across Europe. Soviets initially denied incident. Radiation detected in Scandinavia forced admission. Catastrophe still unfolding.',
    category: 'accident',
    severity: 'critical',
    timeLimit: 90,
    minYear: 1985,
    maxYear: 1989,
    options: [
      {
        id: 'offer_help',
        text: 'Offer Emergency Assistance',
        description: 'Send nuclear experts, equipment',
        advisorSupport: ['science', 'diplomatic'],
        advisorOppose: [],
        outcome: {
          probability: 0.7,
          success: { disaster: 'limited', detente: +20, glasnost: 'accelerated' },
          failure: { offer: 'rejected', propaganda: 'backfire' }
        },
        successNarrative: 'US nuclear experts assist containment. Shared crisis builds trust. Gorbachev realizes Soviet system\'s failures. Accelerates glasnost and perestroika. Humanitarian cooperation becomes template for Cold War\'s end.',
        failureNarrative: 'Soviet pride rejects assistance. Disaster worsens. International goodwill opportunity lost. Cold War mentality persists despite mutual danger.'
      },
      {
        id: 'exploit',
        text: 'Exploit Propaganda Value',
        description: 'Highlight Soviet system failures',
        advisorSupport: ['pr'],
        advisorOppose: ['diplomatic'],
        outcome: {
          probability: 0.8,
          success: { soviet: 'embarrassed', western: 'morale_up', relations: 'damaged' },
          failure: { callous: 'perceived', allies: 'angry' }
        },
        successNarrative: 'Western media highlights Soviet incompetence, secrecy, disregard for safety. Communist legitimacy undermined in Eastern Europe. But opportunity for genuine cooperation lost.',
        failureNarrative: 'Propaganda exploitation seen as callous while people die. European allies criticize American opportunism during humanitarian crisis. Moral high ground forfeited.'
      },
      {
        id: 'evacuate',
        text: 'Evacuate US Citizens from Europe',
        description: 'Precautionary evacuation of dependents',
        advisorSupport: [],
        advisorOppose: ['diplomatic', 'pr'],
        outcome: {
          probability: 0.9,
          success: { citizens: 'safe', panic: 'caused', allies: 'offended' },
          failure: { panic: 'massive', economy: 'disrupted' }
        },
        successNarrative: 'American evacuation causes panic across Europe. Allies furious at US overreaction undermining confidence. Unnecessary exodus damages relations. Chernobyl radiation dangerous but not apocalyptic.',
        failureNarrative: 'Evacuation order triggers mass panic. Europeans flood borders. Economic disruption. Turns containable disaster into continent-wide crisis through fear.'
      }
    ],
    consequences: {}
  },
  {
    title: 'TIANANMEN SQUARE MASSACRE',
    description: 'Chinese military has violently suppressed pro-democracy protests in Beijing. Tanks crushing protesters. Casualties unknown, possibly thousands. "Tank Man" footage broadcasting worldwide. How should US respond to strategic partner\'s human rights catastrophe?',
    category: 'coup',
    severity: 'major',
    timeLimit: 75,
    minYear: 1988,
    maxYear: 1992,
    options: [
      {
        id: 'sanctions',
        text: 'Comprehensive Sanctions',
        description: 'Economic isolation, arms embargo',
        advisorSupport: ['pr', 'diplomatic'],
        advisorOppose: ['economic', 'intel'],
        outcome: {
          probability: 0.7,
          success: { humanRights: 'priority', china: 'isolated', hardliners: 'empowered' },
          failure: { china: 'hostile', business: 'lost', russia: 'partnership' }
        },
        successNarrative: 'Strong sanctions imposed. Arms sales banned. Most Favored Nation status threatened. But Chinese hardliners consolidate power. Democracy movement crushed. Strategic opening to China jeopardized.',
        failureNarrative: 'Harsh sanctions drive China toward Russia. Reform setback becomes permanent. American business loses access to world\'s largest market. European/Japanese firms move in.'
      },
      {
        id: 'engagement',
        text: 'Maintain Engagement',
        description: 'Quiet diplomacy, preserve strategic relationship',
        advisorSupport: ['intel', 'economic'],
        advisorOppose: ['pr'],
        outcome: {
          probability: 0.6,
          success: { china: 'stable', trade: 'continues', criticism: 'domestic' },
          failure: { humanRights: 'ignored', precedent: 'set' }
        },
        successNarrative: 'Engagement continues quietly. Economic ties preserved. Eventually Chinese prosperity leads to gradual liberalization. Long game played. But Tank Man\'s sacrifice seemingly ignored.',
        failureNarrative: 'Weak response sends message that economic interests trump human rights. Emboldened autocrats worldwide note lesson: US won\'t act against strategic partners\' atrocities.'
      },
      {
        id: 'covert_support',
        text: 'Covert Democracy Support',
        description: 'CIA support for dissidents, underground',
        advisorSupport: ['intel'],
        advisorOppose: ['diplomatic'],
        outcome: {
          probability: 0.4,
          success: { dissidents: 'empowered', democracy: 'movement_survives' },
          failure: { operation: 'exposed', relations: 'ruined', dissidents: 'martyred' }
        },
        successNarrative: 'Covert support keeps democracy movement alive. Safe houses, communication networks, exile support. Plants seeds for future change. Moral obligation met while managing strategic relationship.',
        failureNarrative: 'CIA operation exposed. Chinese fury genuine. Dissidents executed as foreign agents. US-China relations poisoned. Democracy movement discredited as Western plot.'
      }
    ],
    consequences: {}
  },
  {
    title: '9/11 TERROR ATTACKS: America Under Attack',
    description: 'Hijacked airliners have struck World Trade Center and Pentagon. Thousands dead. Additional flights still hijacked. Nation under attack for first time since Pearl Harbor. How we respond will define the century.',
    category: 'terrorist',
    severity: 'catastrophic',
    timeLimit: 120,
    minYear: 2000,
    maxYear: 2005,
    options: [
      {
        id: 'afghanistan_only',
        text: 'Focused Afghanistan Campaign',
        description: 'Destroy Al-Qaeda, remove Taliban, rebuild',
        advisorSupport: ['diplomatic', 'intel'],
        advisorOppose: [],
        outcome: {
          probability: 0.7,
          success: { alqaeda: 'degraded', allies: 'united', international: 'support' },
          failure: { alqaeda: 'survives', taliban: 'returns', mission: 'incomplete' }
        },
        successNarrative: 'NATO invokes Article 5. Coalition destroys Al-Qaeda training camps. Taliban regime collapses. Bin Laden hunted. Afghan democracy attempted. Mission stays focused. International support sustained.',
        failureNarrative: 'Afghanistan campaign bogs down. Bin Laden escapes to Pakistan. Taliban regroups. Mission creeps into nation-building quagmire. But at least focus maintained on actual perpetrators.'
      },
      {
        id: 'global_war',
        text: 'Global War on Terror',
        description: 'Confront all terrorist groups worldwide',
        advisorSupport: ['military'],
        advisorOppose: ['diplomatic'],
        outcome: {
          probability: 0.4,
          success: { terrorism: 'reduced', resources: 'overextended', liberty: 'curtailed' },
          failure: { quagmires: 'multiple', terror: 'increased', bankruptcy: 'strategic' }
        },
        successNarrative: 'Worldwide campaign targets terrorists everywhere. Enhanced interrogation, drone strikes, special forces raids. Some successes but endless war, massive costs, civil liberties eroded, international goodwill squandered.',
        failureNarrative: 'Iraq invasion based on false intelligence. Afghanistan neglected. Multiple quagmires. Trillions spent. Thousands of troops dead. Terror franchises multiply. Strategic overreach bankrupts American power.'
      },
      {
        id: 'law_enforcement',
        text: 'Law Enforcement Approach',
        description: 'Treat as crime, international police cooperation',
        advisorSupport: ['diplomatic'],
        advisorOppose: ['military', 'pr'],
        outcome: {
          probability: 0.5,
          success: { networks: 'disrupted', legitimacy: 'denied', military: 'avoided' },
          failure: { perceived: 'weakness', attacks: 'continue' }
        },
        successNarrative: 'International law enforcement cooperation disrupts terrorist finance, communications. Perpetrators brought to trial. Terrorists denied warrior status. No massive wars. But domestic critics blast "pre-9/11 mentality."',
        failureNarrative: 'Law enforcement approach seen as inadequate to threat scale. Public demands military response. Additional attacks occur. Administration seen as weak. Loses political support.'
      }
    ],
    consequences: {}
  },
  {
    title: 'FUKUSHIMA NUCLEAR DISASTER: Earthquake, Tsunami, Meltdown',
    description: '9.0 earthquake triggered tsunami that flooded Fukushima nuclear plant. Multiple reactor meltdowns in progress. Radioactive releases. Tokyo possibly threatened. Global nuclear power industry in jeopardy.',
    category: 'accident',
    severity: 'critical',
    timeLimit: 90,
    minYear: 2009,
    maxYear: 2014,
    options: [
      {
        id: 'emergency_aid',
        text: 'Operation Tomodachi',
        description: 'Massive US military humanitarian assistance',
        advisorSupport: ['military', 'diplomatic'],
        advisorOppose: [],
        outcome: {
          probability: 0.8,
          success: { japan: 'grateful', alliance: 'strengthened', nuclear: 'expertise_shared' },
          failure: { troops: 'contaminated', costs: 'high' }
        },
        successNarrative: 'Carrier Reagan and 24,000 US troops provide massive relief. Nuclear experts assist containment. Alliance with Japan deeply strengthened. Demonstrates US commitment to allies. Disaster diplomacy succeeds.',
        failureNarrative: 'Some US troops receive radiation exposure. Cleanup costs enormous. But alliance value justifies expense. Japan\'s gratitude enduring.'
      },
      {
        id: 'nuclear_review',
        text: 'Comprehensive Nuclear Safety Review',
        description: 'Audit US nuclear plants, update standards',
        advisorSupport: ['science'],
        advisorOppose: ['economic', 'pr'],
        outcome: {
          probability: 0.7,
          success: { safety: 'improved', nuclear: 'confidence_restored', costs: 'moderate' },
          failure: { plants: 'closed', energy: 'crisis' }
        },
        successNarrative: 'Thorough safety review improves US nuclear security. Lessons learned from Fukushima applied. Public confidence gradually restored. Nuclear remains part of energy mix. Climate goals achievable.',
        failureNarrative: 'Safety review reveals multiple plants vulnerable. Closure costs astronomical. Energy shortfall. Fossil fuels fill gap. Climate goals abandoned. Nuclear renaissance ends.'
      },
      {
        id: 'phase_out',
        text: 'Accelerate Renewable Transition',
        description: 'Use crisis to shift away from nuclear',
        advisorSupport: ['pr'],
        advisorOppose: ['science', 'economic'],
        outcome: {
          probability: 0.5,
          success: { renewables: 'accelerated', nuclear: 'phased_out', climate: 'goals_challenged' },
          failure: { energy: 'gap', fossil: 'resurgence', emissions: 'up' }
        },
        successNarrative: 'Nuclear phase-out accelerates renewable deployment. Solar and wind boom. But baseload challenge remains. Some regions return to coal/gas. Climate goals harder without nuclear.',
        failureNarrative: 'Premature nuclear shutdown creates energy crisis. Natural gas and coal fill gap. Emissions surge. Climate goals abandoned. Renewable technology not yet ready for full load.'
      }
    ],
    consequences: {}
  },
  {
    title: 'CRIMEA ANNEXATION: Russia Seizes Ukrainian Territory',
    description: '"Little green men" without insignia have seized Crimea. Putin denies Russian involvement while Russian troops occupy peninsula. Sham referendum scheduled. First forcible annexation in Europe since WWII. NATO\'s credibility at stake.',
    category: 'coup',
    severity: 'critical',
    timeLimit: 60,
    minYear: 2013,
    maxYear: 2018,
    options: [
      {
        id: 'military_aid',
        text: 'Arm Ukraine',
        description: 'Lethal military aid, advisors, intelligence',
        advisorSupport: ['military', 'intel'],
        advisorOppose: ['diplomatic'],
        outcome: {
          probability: 0.6,
          success: { ukraine: 'resists', russia: 'contained', escalation: 'risk' },
          failure: { proxy_war: true, europe: 'divided' }
        },
        successNarrative: 'Javelin missiles and US advisors stiffen Ukrainian resistance. Russian advance stalls in Donbas. Annexation limited to Crimea. NATO credibility partially restored. But proxy war entrenched.',
        failureNarrative: 'Military aid triggers wider Russian intervention. Conventional war engulfs eastern Ukraine. Casualties mount. Europe splits over support. Escalation risks spiral.'
      },
      {
        id: 'sanctions',
        text: 'Economic Sanctions',
        description: 'Financial isolation, energy sector sanctions',
        advisorSupport: ['diplomatic', 'economic'],
        advisorOppose: [],
        outcome: {
          probability: 0.7,
          success: { russia: 'weakened', crimea: 'lost', europe: 'united' },
          failure: { russia: 'adapts', china: 'partnership', sanctions: 'ineffective' }
        },
        successNarrative: 'Coordinated sanctions damage Russian economy. Ruble collapses. But Crimea stays annexed. Putin\'s popularity surges on nationalism. Europe mostly united. Long-term pressure strategy begins.',
        failureNarrative: 'Russia pivots to China, develops sanction-proof economy. European unity crumbles as energy dependence bites. Sanctions lose effectiveness. Crimea annexation becomes permanent fact.'
      },
      {
        id: 'accept',
        text: 'Accept Fait Accompli',
        description: 'Recognize Crimea lost, focus on limiting damage',
        advisorSupport: [],
        advisorOppose: ['military', 'diplomatic'],
        outcome: {
          probability: 0.8,
          success: { crimea: 'lost', escalation: 'avoided', credibility: 'damaged' },
          failure: { crimea: 'lost', ukraine: 'next', baltics: 'threatened' }
        },
        successNarrative: 'Pragmatic acceptance of Crimea loss limits conflict. Ukraine agrees to neutral status. Wider war avoided. But NATO credibility damaged. Eastern European allies terrified. Russian revanchism emboldened.',
        failureNarrative: 'Acceptance interpreted as green light. Russia continues into eastern Ukraine. Baltics feel exposed. NATO Article 5 credibility collapses. European security order destroyed.'
      }
    ],
    consequences: {}
  },
  {
    title: 'OSINT ALERT: Narco Sub Corridor Detected',
    description:
      'Polyglobe-style NASA VIIRS heat blooms reveal a repeating corridor of maritime fires and wakes between the Caribbean and West Africa. Pentagon Pizza Index chatter suggests cartel-linked semi-submersibles are riding the pattern to avoid radar. Decide whether to act before the next launch window closes.',
    category: 'terrorist',
    severity: 'major',
    timeLimit: 70,
    minYear: 2012,
    options: [
      {
        id: 'interdict_corridor',
        text: 'Deploy Littoral Interdiction Task Force',
        description: 'Coast Guard cutters, P-8s, and drones surge to the narco lane',
        advisorSupport: ['military', 'intel'],
        advisorOppose: ['economic'],
        outcome: {
          probability: 0.65,
          success: { morale: +5, intel: +15, contrabandSeized: true },
          failure: { morale: -8, casualties: 150, internationalIncident: true }
        },
        successNarrative:
          'ISR coverage finds three low-riding narco subs. Boarding teams seize cocaine caches and seize encrypted satphones that map the full route. Regional partners praise the rapid interdiction.',
        failureNarrative:
          'A narco sub scuttles itself as teams close in, spilling fuel and sparking a fire visible on VIIRS. Two sailors are injured, and a coastal state files a protest over sovereignty violations.'
      },
      {
        id: 'share_heatmap',
        text: 'Share Heatmap with Allies',
        description: 'Distribute Polyglobe-style overlays to regional partners and NATO',
        advisorSupport: ['diplomatic', 'intel'],
        advisorOppose: ['military'],
        outcome: {
          probability: 0.55,
          success: { diplomacy: +10, intel: +10, jointTaskForce: true },
          failure: { intel: -10, leak: true, smugglersAdapt: true }
        },
        successNarrative:
          'Allies fold the Pentagon Pizza Index overlays into their maritime C2. A combined task force shadows the corridor, capturing chatter that hints at cartel financiers. Trust and data-sharing surge.',
        failureNarrative:
          'The overlay leaks to open forums. Smugglers shift routes within hours, leaving your heatmap stale. Partners question why you shared partially vetted intelligence.'
      },
      {
        id: 'monitor_only',
        text: 'Classify as Atmospheric False Positive',
        description: 'Treat the blooms as geologic fires and hold assets in port',
        advisorSupport: ['economic'],
        advisorOppose: ['intel'],
        outcome: {
          probability: 0.5,
          success: { morale: -2, resourcesSaved: true },
          failure: { morale: -15, casualties: 1200, coastlineInfiltrated: true }
        },
        successNarrative:
          'Follow-up passes show reduced heat signatures. Your restraint preserves budget and avoids diplomatic friction, though some analysts grumble about missed intel.',
        failureNarrative:
          'The "false positives" prove to be narco subs piggybacking on industrial flares. One beaches and offloads weapons, fueling a deadly cartel surge that claims 1,200 lives before forces respond.'
      }
    ],
    consequences: {}
  },
  {
    title: 'COVID-19 PANDEMIC: Global Health Emergency',
    description: 'Novel coronavirus spreading globally. WHO declares pandemic. Models predict millions of deaths without intervention. Economy facing collapse. Must balance public health, economic survival, civil liberties, and geopolitics.',
    category: 'blackswan',
    severity: 'catastrophic',
    timeLimit: 120,
    minYear: 2019,
    maxYear: 2024,
    options: [
      {
        id: 'lockdown',
        text: 'Comprehensive Lockdown',
        description: 'Mandatory closures, stay-at-home orders, crush curve',
        advisorSupport: ['science', 'pr'],
        advisorOppose: ['economic'],
        outcome: {
          probability: 0.6,
          success: { deaths: 'minimized', economy: 'damaged', recovery: 'possible' },
          failure: { deaths: 'moderate', economy: 'devastated', liberty: 'eroded' }
        },
        successNarrative: 'Strict lockdown flattens curve. Healthcare system survives. Deaths minimized. But economic damage severe. Recovery takes years. Government power expansion concerning. Social fabric strained.',
        failureNarrative: 'Lockdown partially effective on health but economically catastrophic. Small businesses destroyed. Mental health crisis. Political polarization. Enforcement inconsistent. Worst of both worlds.'
      },
      {
        id: 'focused_protection',
        text: 'Focused Protection Strategy',
        description: 'Shield vulnerable, keep society functioning',
        advisorSupport: ['economic'],
        advisorOppose: ['science'],
        outcome: {
          probability: 0.5,
          success: { economy: 'sustained', deaths: 'moderate', liberty: 'preserved' },
          failure: { deaths: 'high', healthcare: 'overwhelmed', political: 'backlash' }
        },
        successNarrative: 'Targeted approach protects elderly/vulnerable while maintaining economy. Deaths higher than lockdown but society functions. Herd immunity develops. Balance achieved between health and economics.',
        failureNarrative: 'Hospital systems overwhelmed. Death toll shocks nation. "Focused protection" proves impossible to implement. Political backlash severe. Economy suffers anyway as fear spreads.'
      },
      {
        id: 'vaccine_sprint',
        text: 'Operation Warp Speed',
        description: 'Massive vaccine development investment, emergency authorization',
        advisorSupport: ['science', 'military'],
        advisorOppose: [],
        outcome: {
          probability: 0.8,
          success: { vaccine: 'record_time', deaths: 'minimized_eventually', economy: 'recovers' },
          failure: { vaccine: 'delayed', variants: 'escape', endemic: 'reality' }
        },
        successNarrative: 'Unprecedented investment produces vaccines in under a year - scientific triumph. Mass vaccination begins. Pandemic eventually controlled. Economy recovers. Biotech revolution accelerated. Preparedness improved.',
        failureNarrative: 'Vaccine development succeeds but distribution fails. Variants emerge. Pandemic becomes endemic. Multiple booster campaigns needed. Virus permanently part of life. Initial investment insufficient for long haul.'
      }
    ],
    consequences: {}
  },
  {
    title: 'BREAKTHROUGH: Cold Fusion Success',
    description: 'Scientists at Oak Ridge National Laboratory report achieving stable cold fusion reaction. If verified, this could revolutionize energy production and shift global power dynamics. USSR demanding shared research.',
    category: 'blackswan',
    severity: 'major',
    minYear: 1970,
    timeLimit: 90,
    options: [
      {
        id: 'share',
        text: 'Share Technology Globally',
        description: 'Release findings to international scientific community',
        advisorSupport: ['science', 'diplomatic'],
        advisorOppose: ['military', 'intel'],
        outcome: {
          probability: 0.7,
          success: { morale: +15, production: +30, reputation: 'visionary', globalTension: -2 },
          failure: { intel: -10, militaryAdvantage: 'lost', morale: -5 }
        },
        successNarrative: 'Your decision to share cold fusion technology triggers unprecedented global cooperation. Energy crisis solved worldwide. US recognized as leader in new energy era. Relations with USSR improve dramatically. Nobel Prize awarded to team.',
        failureNarrative: 'Sharing technology allows adversaries to catch up militarily. Soviet Union weaponizes the research faster than expected. US strategic advantage evaporates. Critics condemn naive idealism.'
      },
      {
        id: 'classify',
        text: 'Classify as Top Secret',
        description: 'Military control, weaponization research priority',
        advisorSupport: ['military', 'intel'],
        advisorOppose: ['science', 'diplomatic'],
        outcome: {
          probability: 0.6,
          success: { production: +50, militaryPower: +20, morale: +10 },
          failure: { reputation: 'selfish', scientists: 'defect', leak: true }
        },
        successNarrative: 'Classified research yields massive military advantage. New fusion-powered weapons and systems deployed. US energy independence achieved. Economic boom from unlimited clean energy. Global dominance secured.',
        failureNarrative: 'Secrecy backfires when lead scientist defects to USSR in protest. Technology leaks through espionage. International condemnation for hoarding cure to energy crisis. Scientific community loses trust.'
      },
      {
        id: 'verify',
        text: 'Cautious Verification',
        description: 'Independent peer review before any decisions',
        advisorSupport: ['science'],
        advisorOppose: ['military'],
        outcome: {
          probability: 0.9,
          success: { credibility: 'maintained', production: +10, time: 'bought' },
          failure: { hoax: 'revealed', morale: -15, scientists: 'embarrassed' }
        },
        successNarrative: 'Careful verification confirms breakthrough is real but requires refinement. Measured approach allows time for policy development. International patent filed. US leads new energy revolution without diplomatic fallout.',
        failureNarrative: 'Exhaustive testing reveals initial results cannot be replicated. Cold fusion was measurement error. National embarrassment. Scientific credibility damaged. USSR mocks American "miracle" that never was.'
      }
    ],
    consequences: {}
  },
  {
    title: 'INTELLIGENCE LEAK: Top Secret Documents Exposed',
    description: 'Former NSA analyst has stolen thousands of classified documents revealing surveillance programs, covert operations, and diplomatic embarrassments. Media preparing to publish. Whistleblower demands asylum abroad.',
    category: 'rogue',
    severity: 'critical',
    minYear: 1965,
    timeLimit: 75,
    options: [
      {
        id: 'prosecute',
        text: 'Full Prosecution',
        description: 'Charge with espionage, demand extradition',
        advisorSupport: ['military', 'intel'],
        advisorOppose: ['pr'],
        outcome: {
          probability: 0.5,
          success: { intel: 'protected', morale: -10, allies: 'strained' },
          failure: { reputation: 'authoritarian', intel: 'exposed_anyway', morale: -20 }
        },
        successNarrative: 'Aggressive prosecution deters future leaks. Extradition secured. Trial sends strong message. But global press coverage exposes many secrets anyway. Allies upset by revealed surveillance. Domestic civil liberties debate intensifies.',
        failureNarrative: 'Heavy-handed approach backfires spectacularly. Whistleblower becomes international hero. Documents published worldwide. US portrayed as oppressive. Surveillance programs shut down by courts. Intelligence capability crippled.'
      },
      {
        id: 'damage_control',
        text: 'Damage Control & Reform',
        description: 'Acknowledge problems, promise reforms, limited amnesty',
        advisorSupport: ['diplomatic', 'pr'],
        advisorOppose: ['intel', 'military'],
        outcome: {
          probability: 0.7,
          success: { morale: +5, transparency: 'improved', intel: -5, allies: 'reassured' },
          failure: { weakness: 'perceived', morale: -15, moreLeaks: true }
        },
        successNarrative: 'Balanced response acknowledges legitimate concerns. Surveillance oversight reforms implemented. Whistleblower given lenient sentence. Crisis defused. Democratic credibility restored. Some intelligence capabilities preserved.',
        failureNarrative: 'Conciliatory approach seen as weakness. More leakers emerge emboldened. Intelligence community in revolt. Reforms paralyze operations. Adversaries exploit window of vulnerability.'
      },
      {
        id: 'suppress',
        text: 'Media Suppression',
        description: 'National security injunctions, pressure publishers',
        advisorSupport: [],
        advisorOppose: ['pr', 'diplomatic', 'science'],
        outcome: {
          probability: 0.3,
          success: { secrets: 'protected', intel: +5, morale: -25, freedom: 'questioned' },
          failure: { streisand: 'effect', reputation: 'authoritarian', morale: -30 }
        },
        successNarrative: 'Legal injunctions prevent most damaging revelations from publishing. Secrets stay protected. Intelligence operations continue. But authoritarian precedent set. Press freedom groups outraged. International criticism mounting.',
        failureNarrative: 'Attempted suppression backfires catastrophically. Documents spread faster through underground channels. US accused of censorship. Domestic outrage over First Amendment. Streisand effect ensures maximum publicity for leaks.'
      }
    ],
    consequences: {}
  },
  {
    title: 'DIPLOMATIC OPPORTUNITY: Peace Overture',
    description: 'Soviet Premier sends secret message through back channels. Proposes summit meeting to discuss nuclear arms reduction, space cooperation, and normalization of relations. Could be genuine or propaganda trap.',
    category: 'blackswan',
    severity: 'major',
    minYear: 1955,
    maxYear: 1990,
    timeLimit: 90,
    options: [
      {
        id: 'accept_summit',
        text: 'Accept Summit',
        description: 'Engage in good faith, test sincerity',
        advisorSupport: ['diplomatic', 'pr'],
        advisorOppose: ['military'],
        outcome: {
          probability: 0.65,
          success: { morale: +20, defcon: -1, production: +15, treaties: 'signed' },
          failure: { propaganda: 'defeat', morale: -10, credibility: -5 }
        },
        successNarrative: 'Historic summit produces breakthrough arms control treaty. 30% reduction in nuclear arsenals. Cultural exchange programs launched. Space cooperation announced. Tensions ease dramatically. Nobel Peace Prize awarded. Hope for lasting détente.',
        failureNarrative: 'Summit collapses into propaganda disaster. Soviets make unreasonable demands, then blame US intransigence when talks fail. Global media portrays America as warmonger. No agreements reached. Relations worse than before.'
      },
      {
        id: 'conditional',
        text: 'Conditional Acceptance',
        description: 'Demand concrete concessions before summit',
        advisorSupport: ['diplomatic', 'intel'],
        advisorOppose: [],
        outcome: {
          probability: 0.55,
          success: { morale: +10, intel: +5, defcon: -1, credibility: 'strengthened' },
          failure: { opportunity: 'lost', hardliners: 'empowered', morale: -5 }
        },
        successNarrative: 'Tough negotiating stance pays off. Soviets make preliminary concessions on Berlin and regional conflicts. Summit proceeds with US in stronger position. Limited but meaningful agreements reached. Respect earned through firmness.',
        failureNarrative: 'Demanding preconditions gives Soviet hardliners ammunition to cancel overture. Peace faction loses credibility in Kremlin. Window closes. Opportunity for breakthrough wasted. Cold War continues unabated.'
      },
      {
        id: 'reject',
        text: 'Reject as Propaganda',
        description: 'Refuse engagement, maintain pressure',
        advisorSupport: ['military'],
        advisorOppose: ['diplomatic', 'pr'],
        outcome: {
          probability: 0.4,
          success: { militaryReadiness: +10, morale: +5, sovietWeakness: 'exposed' },
          failure: { morale: -15, allies: 'concerned', reputation: 'warmonger' }
        },
        successNarrative: 'Rejecting overture as propaganda proves correct when KGB documents reveal it was trap. Continued pressure causes Soviet economic crisis to worsen. Hardline stance vindicated. Military preparedness maintained.',
        failureNarrative: 'Rejection of genuine peace offer shocks world. Allies question US commitment to peace. Domestic anti-war movement energized. Soviets exploit propaganda victory. Missed historic opportunity for reconciliation.'
      }
    ],
    consequences: {}
  },
  {
    title: 'TRIUMPH: First Moon Landing Achieved',
    description: 'Apollo mission successfully lands on lunar surface. Astronauts transmitting live from the Moon. Entire world watching. Tremendous propaganda victory in Space Race. How to capitalize on this achievement?',
    category: 'blackswan',
    severity: 'major',
    minYear: 1969,
    maxYear: 1969,
    timeLimit: 60,
    options: [
      {
        id: 'peace_gesture',
        text: 'Gesture for All Mankind',
        description: 'Emphasize peaceful exploration, offer cooperation',
        advisorSupport: ['diplomatic', 'science', 'pr'],
        advisorOppose: ['military'],
        outcome: {
          probability: 0.85,
          success: { morale: +30, production: +20, reputation: 'enlightened', globalPrestige: +25 },
          failure: { morale: +20, production: +10, militaryOpportunity: 'missed' }
        },
        successNarrative: 'Message of peace resonates globally. "One small step for man, one giant leap for mankind" becomes defining moment. US prestige soars. Even Soviet Union acknowledges achievement. Space cooperation proposals emerge. Scientific triumph transcends Cold War.',
        failureNarrative: 'Peaceful message well-received but military hardliners argue we should have emphasized strategic dominance. Still massive morale boost and scientific victory, but missed chance for maximum leverage. Positive outcome overall.'
      },
      {
        id: 'strategic_dominance',
        text: 'Assert Strategic Superiority',
        description: 'Emphasize technological dominance over Soviets',
        advisorSupport: ['military', 'intel'],
        advisorOppose: ['diplomatic'],
        outcome: {
          probability: 0.6,
          success: { morale: +25, militaryPrestige: +20, production: +25, sovietMorale: -15 },
          failure: { morale: +15, spaceRace: 'militarized', tensions: +1 }
        },
        successNarrative: 'Framing as US victory in technological competition demoralizes Soviet leadership. Space superiority translates to perceived military superiority. Massive boost to defense programs. Adversaries intimidated by demonstrated capability.',
        failureNarrative: 'Triumphalist rhetoric triggers Soviet military escalation. Space race becomes explicitly militarized. UN condemns weaponization of space. Still inspiring achievement but creates new tensions. Arms race extends to lunar bases.'
      },
      {
        id: 'commercial_focus',
        text: 'Commercial Space Age',
        description: 'Pivot to economic opportunities, space industry',
        advisorSupport: ['economic', 'science'],
        advisorOppose: [],
        outcome: {
          probability: 0.75,
          success: { morale: +20, production: +35, spaceIndustry: 'boom', innovation: +15 },
          failure: { morale: +15, production: +20, militaryPrestige: -5 }
        },
        successNarrative: 'Lunar success catalyzes commercial space industry. Satellite communications, GPS, space manufacturing. Massive economic benefits. Tech sector boom. Moon landing pays for itself many times over through innovation spillovers.',
        failureNarrative: 'Commercial pivot successful economically but critics argue we surrendered strategic high ground. Soviets pursue military space programs while US focuses on profits. Still strong economic gains.'
      }
    ],
    consequences: {}
  },
  {
    title: 'ECONOMIC CRISIS: Stock Market Crash',
    description: 'Wall Street in freefall. Dow Jones drops 22% in single day. Banks freezing credit. Panic spreading. Economists warning of potential depression. Immediate intervention required to prevent total collapse.',
    category: 'blackswan',
    severity: 'critical',
    minYear: 1970,
    timeLimit: 60,
    options: [
      {
        id: 'bailout',
        text: 'Emergency Bailout',
        description: 'Massive government intervention, liquidity injection',
        advisorSupport: ['economic'],
        advisorOppose: [],
        outcome: {
          probability: 0.7,
          success: { economy: 'stabilized', production: -10, morale: -5, debt: +50 },
          failure: { economy: 'depression', production: -40, morale: -25, debt: +100 }
        },
        successNarrative: 'Swift government action prevents total meltdown. Federal Reserve floods system with liquidity. Major banks saved. Market stabilizes after several volatile weeks. Recession avoided but taxpayer burden heavy. Moral hazard concerns raised.',
        failureNarrative: 'Bailout attempts fail to restore confidence. Panic continues despite intervention. Recession becomes depression. Unemployment skyrockets. Government debt explodes with nothing to show. Political backlash severe.'
      },
      {
        id: 'austerity',
        text: 'Market Discipline',
        description: 'Let market correct itself, no intervention',
        advisorSupport: [],
        advisorOppose: ['economic', 'pr'],
        outcome: {
          probability: 0.4,
          success: { economy: 'purged', production: -20, morale: -15, recovery: 'stronger' },
          failure: { economy: 'depression', production: -50, morale: -35, socialUnrest: true }
        },
        successNarrative: 'Painful but necessary correction purges excess from system. After brutal year, economy emerges leaner and more efficient. No moral hazard created. Free market principles vindicated. Recovery built on solid foundation.',
        failureNarrative: 'Laissez-faire approach triggers catastrophic downward spiral. Bank runs. Mass unemployment. Soup lines. Social unrest. 1929 repeating itself. Public demands government action. Economic ideology proved disastrous.'
      },
      {
        id: 'targeted',
        text: 'Targeted Intervention',
        description: 'Save critical infrastructure, let speculation fail',
        advisorSupport: ['economic', 'intel'],
        advisorOppose: [],
        outcome: {
          probability: 0.65,
          success: { economy: 'stabilized', production: -15, morale: -8, credibility: 'maintained' },
          failure: { contagion: 'spreads', production: -30, morale: -20 }
        },
        successNarrative: 'Surgical intervention saves critical institutions while allowing speculative excess to collapse. Banks secured. Main Street protected. Wall Street takes losses. Balanced approach prevents depression without rewarding recklessness.',
        failureNarrative: 'Attempt to pick winners and losers fails as contagion spreads unexpectedly. Critical connections missed. Domino effect continues. Partial intervention proves insufficient. Should have gone all-in or stayed out.'
      }
    ],
    consequences: {}
  },
  {
    title: 'NATURAL DISASTER: Catastrophic Earthquake',
    description: 'Magnitude 8.5 earthquake devastates California. Thousands dead, hundreds of thousands homeless. Critical infrastructure destroyed. Nuclear power plant damaged. National Guard deployed. International aid offered.',
    category: 'accident',
    severity: 'major',
    minYear: 1950,
    timeLimit: 75,
    options: [
      {
        id: 'federal_response',
        text: 'Full Federal Response',
        description: 'Massive disaster relief, military deployment',
        advisorSupport: ['military', 'pr'],
        advisorOppose: ['economic'],
        outcome: {
          probability: 0.8,
          success: { morale: +10, production: -15, unity: 'strengthened', casualties: 'minimized' },
          failure: { production: -20, bureaucracy: 'overwhelmed', morale: -5 }
        },
        successNarrative: 'Swift federal action saves thousands of lives. Military logistics excellence. Emergency services coordinated. Reconstruction begins immediately. National unity emerges from tragedy. Government effectiveness demonstrated.',
        failureNarrative: 'Federal response well-intentioned but bureaucratic delays cost lives. Local authorities frustrated by red tape. Still significant help provided but coordination failures prevent optimal outcome.'
      },
      {
        id: 'accept_aid',
        text: 'Accept International Aid',
        description: 'Welcome foreign assistance, coordinate globally',
        advisorSupport: ['diplomatic', 'pr'],
        advisorOppose: [],
        outcome: {
          probability: 0.85,
          success: { morale: +15, production: -10, reputation: 'humble', globalUnity: +10 },
          failure: { morale: +5, production: -15, sovereignty: 'questioned' }
        },
        successNarrative: 'Accepting international help showcases American humility. Soviet, European, Japanese rescue teams work alongside US forces. Humanitarian moment transcends politics. Faster recovery. Goodwill generated worldwide.',
        failureNarrative: 'International aid helpful but optics problematic. Critics question American strength. "Superpower needs foreign help?" Still better recovery than alone but some prestige cost.'
      },
      {
        id: 'self_reliance',
        text: 'Self-Reliant Recovery',
        description: 'Decline foreign aid, demonstrate American resilience',
        advisorSupport: ['military'],
        advisorOppose: ['diplomatic', 'economic'],
        outcome: {
          probability: 0.6,
          success: { morale: +20, production: -20, resilience: 'proven', pride: 'restored' },
          failure: { casualties: 'higher', production: -30, morale: -10, stubborn: 'perceived' }
        },
        successNarrative: 'Self-reliant response proves American capability. Military and civilian cooperation exemplary. Rebuilding becomes symbol of national character. Pride and morale soar despite economic cost. "We take care of our own."',
        failureNarrative: 'Prideful rejection of help leads to preventable deaths. Recovery slower than necessary. International community offended by rebuff. Stubborn nationalism criticized. Tragedy compounded by poor judgment.'
      }
    ],
    consequences: {}
  },
  {
    title: 'INTELLIGENCE BREAKTHROUGH: Enemy Codes Cracked',
    description: 'NSA cryptanalysts achieve breakthrough - adversary\'s encrypted communications compromised. Can read diplomatic cables and military orders in real-time. Ultimate intelligence advantage but only if secrecy maintained.',
    category: 'blackswan',
    severity: 'major',
    minYear: 1960,
    timeLimit: 90,
    options: [
      {
        id: 'exploit_quietly',
        text: 'Silent Exploitation',
        description: 'Use intelligence carefully, protect source at all costs',
        advisorSupport: ['intel', 'military'],
        advisorOppose: [],
        outcome: {
          probability: 0.75,
          success: { intel: +25, strategicAdvantage: +20, defcon: -1, morale: +10 },
          failure: { compromised: true, intel: -10, advantage: 'lost' }
        },
        successNarrative: 'Disciplined exploitation yields years of strategic advantage. Crisis after crisis defused through foreknowledge. Arms negotiations won. Military operations optimized. Enemy never suspects. Intelligence crown jewel protected.',
        failureNarrative: 'Despite precautions, adversaries detect pattern in our responses. Counter-intelligence investigation reveals code break. They switch encryption. Golden source lost. Should have been even more careful.'
      },
      {
        id: 'tactical_wins',
        text: 'Aggressive Exploitation',
        description: 'Maximum use for immediate tactical advantages',
        advisorSupport: ['military'],
        advisorOppose: ['intel'],
        outcome: {
          probability: 0.5,
          success: { militaryVictories: +15, morale: +15, intel: +10, duration: 'shorter' },
          failure: { compromised: 'quickly', intel: -15, opportunity: 'wasted' }
        },
        successNarrative: 'Aggressive use delivers spectacular short-term victories. Covert operations succeed perfectly. Military engagements won decisively. Enemy baffled by our prescience. Worth it even though eventually detected and countermeasures deployed.',
        failureNarrative: 'Reckless overuse burns source within months. Enemy detects impossible coincidences. Encryption changed. Massive intelligence advantage squandered for minor tactical wins. Cryptanalysts furious at waste.'
      },
      {
        id: 'strategic_deception',
        text: 'Deception Operations',
        description: 'Feed false intelligence, manipulate enemy decisions',
        advisorSupport: ['intel'],
        advisorOppose: [],
        outcome: {
          probability: 0.65,
          success: { strategicDeception: 'masterful', enemyMisled: true, intel: +20, morale: +15 },
          failure: { backfire: true, credibility: -10, intel: -5 }
        },
        successNarrative: 'Sophisticated deception campaign manipulates adversary into strategic blunders. They trust their own communications, never realizing we read and influence them. Enemy maneuvered into disadvantageous positions. Intelligence warfare perfected.',
        failureNarrative: 'Deception attempt too clever by half. Enemy becomes suspicious of their own communications. Launches internal purge. Accidentally discovers encryption weakness during investigation. Scheme backfires completely.'
      }
    ],
    consequences: {}
  }
];

export function calculateFlashpointProbability(turn: number, defcon: number) {
  const baseProbability = 0.06; // 6% per turn (increased from 2% for more frequent flashpoints)
  const normalizedTurn = Math.max(turn, 0);
  const normalizedDefcon = Math.min(Math.max(defcon, 1), 5);

  // Turn multiplier now starts at 1x and grows to 2.5x over time
  // This ensures flashpoints happen from the very beginning
  const turnMultiplier = 1 + Math.min(normalizedTurn / 75, 1.5);

  const probability = baseProbability * (6 - normalizedDefcon) * turnMultiplier;

  return Math.min(Math.max(probability, 0), 1);
}

// Helper function to inject historical context into flashpoint descriptions
function injectHistoricalContext(
  flashpoint: FlashpointEvent,
  history: FlashpointHistoryEntry[],
  reputation: PlayerReputation
): FlashpointEvent {
  if (history.length === 0) return flashpoint;

  const recentHistory = history.slice(-5); // Last 5 flashpoints
  let contextAddition = '';

  // Add reputation-based context
  if (reputation.aggressive > 70) {
    contextAddition += ' Intelligence reports that your aggressive posture in recent crises has emboldened hardliners.';
  } else if (reputation.diplomatic > 70) {
    contextAddition += ' Your diplomatic approach in recent crises has gained international trust, though some see it as weakness.';
  }

  // Reference specific past events
  const hadNuclearEvent = recentHistory.some(h => h.event.category === 'terrorist' || h.event.title.includes('Nuclear'));
  const hadCoupEvent = recentHistory.some(h => h.event.category === 'coup');
  const hadAlienEvent = recentHistory.some(h => h.event.title.includes('EXTRATERRESTRIAL'));

  if (flashpoint.category === 'terrorist' && hadNuclearEvent) {
    contextAddition += ' Terrorist cells may be emboldened by previous nuclear incidents.';
  }

  if (flashpoint.category === 'coup' && hadCoupEvent) {
    contextAddition += ' This coup follows the pattern established in previous destabilization events.';
  }

  if (flashpoint.title.includes('EXTRATERRESTRIAL') && hadAlienEvent) {
    contextAddition += ' The alien visitors have returned - or perhaps they never truly left.';
  }

  // Success rate context
  if (reputation.successRate < 40) {
    contextAddition += ' Critics point to your recent failures as evidence of incompetence.';
  } else if (reputation.successRate > 80) {
    contextAddition += ' Your track record of successful crisis management has earned you significant credibility.';
  }

  if (contextAddition) {
    return {
      ...flashpoint,
      description: flashpoint.description + contextAddition
    };
  }

  return flashpoint;
}

// Helper function to generate narrative outcome description
function generateNarrativeOutcome(option: FlashpointOption, success: boolean, outcome: Record<string, any>): string {
  // Use custom narrative if provided
  if (success && option.successNarrative) {
    return option.successNarrative;
  }
  if (!success && option.failureNarrative) {
    return option.failureNarrative;
  }

  // Generate generic narrative based on outcome
  let narrative = success ? 'Your decision was successful. ' : 'The operation failed. ';

  if (outcome.morale) {
    narrative += outcome.morale > 0 ? 'Public morale has improved. ' : 'Public morale has declined. ';
  }
  if (outcome.casualties) {
    narrative += `Casualties reported: ${outcome.casualties.toLocaleString()}. `;
  }
  if (outcome.threatNeutralized) {
    narrative += 'The immediate threat has been neutralized. ';
  }
  if (outcome.newAlliance) {
    narrative += 'A new alliance has been formed. ';
  }
  if (outcome.madCounterstrikeInitiated) {
    narrative += 'Mutually assured destruction protocols have been executed. Retaliatory launches commence as the world braces for irreversible escalation. ';
  }

  if (outcome.war) {
    narrative += 'This action has triggered a state of war. ';
  }

  return narrative || (success ? 'The situation has been resolved favorably.' : 'The situation has deteriorated.');
}

// Configuration for consequence field mappings
type ConsequenceType = 'positive' | 'negative' | 'neutral';

interface NumericFieldConfig {
  kind: 'numeric';
  field: string;
  label: string;
}

interface LocalizedFieldConfig {
  kind: 'localized';
  field: string;
  label: string;
  type: ConsequenceType;
}

interface ThresholdFieldConfig {
  kind: 'threshold';
  field: string;
  label: string;
  threshold: number;
  belowType: ConsequenceType;
  aboveOrEqualType: ConsequenceType;
}

interface BooleanFlagConfig {
  kind: 'boolean';
  field: string;
  label: string;
  staticValue: string;
  type: ConsequenceType;
}

type ConsequenceFieldConfig = NumericFieldConfig | LocalizedFieldConfig | ThresholdFieldConfig | BooleanFlagConfig;

const CONSEQUENCE_FIELD_CONFIGS: ConsequenceFieldConfig[] = [
  // Numeric fields with +/- formatting (type based on sign)
  { kind: 'numeric', field: 'morale', label: 'Morale' },
  { kind: 'numeric', field: 'intel', label: 'Intelligence' },
  { kind: 'numeric', field: 'production', label: 'Production' },

  // Localized number field with fixed type
  { kind: 'localized', field: 'casualties', label: 'Casualties', type: 'negative' },

  // Threshold-based type determination
  { kind: 'threshold', field: 'defcon', label: 'DEFCON', threshold: 3, belowType: 'negative', aboveOrEqualType: 'neutral' },

  // Boolean flags with static display values
  { kind: 'boolean', field: 'madCounterstrikeInitiated', label: 'Strategic Status', staticValue: 'MAD Counterstrike Initiated', type: 'negative' },
  { kind: 'boolean', field: 'threatNeutralized', label: 'Status', staticValue: 'Threat Neutralized', type: 'positive' },
  { kind: 'boolean', field: 'newAlliance', label: 'Diplomacy', staticValue: 'New Alliance Formed', type: 'positive' },
  { kind: 'boolean', field: 'war', label: 'War Status', staticValue: 'War Declared', type: 'negative' },
  { kind: 'boolean', field: 'nuclearExplosion', label: 'Critical Event', staticValue: 'Nuclear Detonation', type: 'negative' },
];

// Helper function to format consequences for display
function formatConsequences(outcome: Record<string, any>): Array<{ label: string; value: string | number; type: ConsequenceType }> {
  const consequences: Array<{ label: string; value: string | number; type: ConsequenceType }> = [];

  for (const config of CONSEQUENCE_FIELD_CONFIGS) {
    const value = outcome[config.field];

    switch (config.kind) {
      case 'numeric':
        if (typeof value === 'number') {
          consequences.push({
            label: config.label,
            value: value > 0 ? `+${value}` : `${value}`,
            type: value > 0 ? 'positive' : 'negative'
          });
        }
        break;

      case 'localized':
        if (value) {
          consequences.push({
            label: config.label,
            value: value.toLocaleString(),
            type: config.type
          });
        }
        break;

      case 'threshold':
        if (value) {
          consequences.push({
            label: config.label,
            value: value,
            type: value < config.threshold ? config.belowType : config.aboveOrEqualType
          });
        }
        break;

      case 'boolean':
        if (value) {
          consequences.push({
            label: config.label,
            value: config.staticValue,
            type: config.type
          });
        }
        break;
    }
  }

  return consequences;
}

export function useFlashpoints() {
  const { rng } = useRNG();
  const [activeFlashpoint, setActiveFlashpoint] = useState<FlashpointEvent | null>(null);
  const [flashpointHistory, setFlashpointHistory] = useState<FlashpointHistoryEntry[]>([]);
  const [pendingFollowUps, setPendingFollowUps] = useState<Array<{ parentId: string; category: string; outcome: string; triggerAtTurn: number }>>([]);
  const [playerReputation, setPlayerReputation] = useState<PlayerReputation>({
    aggressive: 50,
    diplomatic: 50,
    cautious: 50,
    reckless: 50,
    successRate: 50
  });

  /**
   * Helper: Process pending follow-up flashpoints
   * Returns the first follow-up flashpoint that is ready to trigger (triggerAtTurn <= turn)
   */
  const processFollowUpFlashpoint = useCallback((
    turn: number,
    pendingFollowUps: Array<{ parentId: string; category: string; outcome: string; triggerAtTurn: number }>,
    setPendingFollowUps: React.Dispatch<React.SetStateAction<Array<{ parentId: string; category: string; outcome: string; triggerAtTurn: number }>>>,
    setActiveFlashpoint: React.Dispatch<React.SetStateAction<FlashpointEvent | null>>,
    flashpointHistory: FlashpointHistoryEntry[],
    playerReputation: PlayerReputation
  ): FlashpointEvent | null => {
    if (pendingFollowUps.length === 0) {
      return null;
    }

    console.log(`Checking ${pendingFollowUps.length} pending follow-ups for turn ${turn}`);

    const followUp = pendingFollowUps.find(f => f.triggerAtTurn <= turn);
    if (!followUp) {
      return null;
    }

    console.log(`Triggering follow-up: ${followUp.category}/${followUp.outcome} (scheduled for turn ${followUp.triggerAtTurn}, current turn ${turn})`);

    const followUpTemplate = FOLLOWUP_FLASHPOINTS[followUp.category]?.[followUp.outcome];
    if (!followUpTemplate) {
      // Template not found - log warning but still remove from queue to prevent infinite retries
      console.warn(`Follow-up template not found for category: ${followUp.category}, outcome: ${followUp.outcome}. Removing from queue.`);
      setPendingFollowUps(prev => prev.filter(f => f !== followUp));
      return null;
    }

    const baseFlashpoint: FlashpointEvent = {
      ...followUpTemplate,
      id: `flashpoint_followup_${Date.now()}`,
      triggeredAt: Date.now(),
      triggeredBy: followUp.parentId
    };

    // Inject historical context
    const flashpoint = injectHistoricalContext(baseFlashpoint, flashpointHistory, playerReputation);

    // Remove the triggered follow-up from the queue
    setPendingFollowUps(prev => prev.filter(f => f !== followUp));
    setActiveFlashpoint(flashpoint);
    console.log(`Follow-up flashpoint triggered successfully: ${flashpoint.title}`);
    return flashpoint;
  }, []);

  /**
   * Helper: Process scenario-specific turn-based flashpoints (e.g., Cuba Crisis)
   * Returns a scenario flashpoint if one is scheduled for this turn
   */
  const processScenarioFlashpoint = useCallback((
    turn: number,
    setActiveFlashpoint: React.Dispatch<React.SetStateAction<FlashpointEvent | null>>
  ): FlashpointEvent | null => {
    const scenarioId = getActiveScenarioId();
    console.log(`[Flashpoint Debug] Current scenario ID: ${scenarioId}, Turn: ${turn}`);

    if (scenarioId !== 'cubanCrisis') {
      return null;
    }

    const turnForSchedule = Math.max(1, turn - 1);
    // Player-visible turns increment before scheduling, so subtract one (clamped to 1)
    // to align with the historical day map and fire turn-one briefings immediately.
    const enhancedFlashpoints = getEnhancedFlashpointsForTurn(turnForSchedule);
    console.log(
      `[Flashpoint Debug] Enhanced flashpoints for schedule turn ${turnForSchedule} (player turn ${turn}):`,
      enhancedFlashpoints?.length || 0
    );

    if (!enhancedFlashpoints || enhancedFlashpoints.length === 0) {
      console.log(
        `[Flashpoint Debug] No enhanced flashpoints for schedule turn ${turnForSchedule} (player turn ${turn}) in Cuba Crisis`
      );
      return null;
    }

    // Cuba Crisis has turn-specific flashpoints - trigger them
    const enhancedFlashpoint = enhancedFlashpoints[0]; // Take first one (usually only one per turn)
    console.log(
      `[Flashpoint Debug] Triggering Cuba Crisis enhanced flashpoint for schedule turn ${turnForSchedule} (player turn ${turn}): ${enhancedFlashpoint.title}`
    );
    console.log(`[Flashpoint Debug] Flashpoint has ${enhancedFlashpoint.options?.length || 0} options:`, enhancedFlashpoint.options?.map(o => o.text));
    setActiveFlashpoint(enhancedFlashpoint);
    return enhancedFlashpoint;
  }, []);

  /**
   * Helper: Filter flashpoint templates by year restrictions with 3-tier fallback
   * Tier 1: Year-appropriate templates (respect minYear/maxYear)
   * Tier 2: Timeless templates (no year restrictions)
   * Tier 3: All templates as last resort
   */
  const filterTemplatesByYear = useCallback((
    templatePool: Omit<FlashpointEvent, 'id' | 'triggeredAt'>[],
    currentYear: number | undefined
  ): Omit<FlashpointEvent, 'id' | 'triggeredAt'>[] => {
    // If no year info, allow all templates
    if (!currentYear) {
      return templatePool;
    }

    // Tier 1: Use year-appropriate historical flashpoints
    let validTemplates = templatePool.filter(t => {
      const minYearOk = !t.minYear || currentYear >= t.minYear;
      const maxYearOk = !t.maxYear || currentYear <= t.maxYear;
      return minYearOk && maxYearOk;
    });

    if (validTemplates.length > 0) {
      return validTemplates;
    }

    console.log(`[Flashpoint Debug] No year-appropriate flashpoints for ${currentYear}, falling back to timeless templates`);

    // Tier 2: Fall back to timeless templates (no year restrictions)
    validTemplates = templatePool.filter(t => !t.minYear && !t.maxYear);

    if (validTemplates.length > 0) {
      return validTemplates;
    }

    // Tier 3: If still none, use all templates as last resort
    console.log(`[Flashpoint Debug] No timeless templates found, using all templates`);
    return templatePool;
  }, []);

  const triggerRandomFlashpoint = useCallback((turn: number, defcon: number) => {
    // Priority 1: Check for pending follow-up flashpoints
    const followUpFlashpoint = processFollowUpFlashpoint(
      turn,
      pendingFollowUps,
      setPendingFollowUps,
      setActiveFlashpoint,
      flashpointHistory,
      playerReputation
    );
    if (followUpFlashpoint) {
      return followUpFlashpoint;
    }

    // Priority 2: Check for scenario-specific turn-based flashpoints (Cuba Crisis Enhanced)
    const scenarioFlashpoint = processScenarioFlashpoint(turn, setActiveFlashpoint);
    if (scenarioFlashpoint) {
      return scenarioFlashpoint;
    }

    // Priority 3: Generate random flashpoint based on probability
    const probability = calculateFlashpointProbability(turn, defcon);
    if (rng.next() >= probability) {
      return null;
    }

    const scenarioId = getActiveScenarioId();
    const scenarioTemplates = scenarioId ? SCENARIO_FLASHPOINTS[scenarioId] : undefined;

    // IMPORTANT: Cuba Crisis uses ONLY enhanced turn-based flashpoints (no random base game flashpoints)
    if (scenarioId === 'cubanCrisis') {
      return null;
    }

    const currentYear = getCurrentYear(turn);
    const templatePool = scenarioTemplates && scenarioTemplates.length > 0 ? scenarioTemplates : FLASHPOINT_TEMPLATES;

    // Filter templates by year restrictions (3-tier fallback system)
    const validTemplates = filterTemplatesByYear(templatePool, currentYear);

    // If no valid templates (empty template pool), return null
    if (validTemplates.length === 0) {
      console.log(`[Flashpoint Debug] Template pool is empty - cannot generate flashpoint`);
      return null;
    }

    // Select random template and create flashpoint
    const template = rng.choice(validTemplates);
    const baseFlashpoint: FlashpointEvent = {
      ...template,
      id: `flashpoint_${Date.now()}`,
      triggeredAt: Date.now()
    };

    // Inject historical context into new flashpoints
    const flashpoint = injectHistoricalContext(baseFlashpoint, flashpointHistory, playerReputation);

    setActiveFlashpoint(flashpoint);
    return flashpoint;
  }, [pendingFollowUps, flashpointHistory, playerReputation, rng, processFollowUpFlashpoint, processScenarioFlashpoint, filterTemplatesByYear]);

  /**
   * Determines the category key for a flashpoint, used for follow-up lookups.
   * This replaces the complex ternary chain with a cleaner fallback mechanism.
   */
  function determineCategoryKey(flashpoint: FlashpointEvent): string | null {
    // Priority 1: Use explicit follow-up ID if provided
    if (flashpoint.followUpId) {
      return flashpoint.followUpId;
    }

    // Priority 2: Use the helper function for reliable title-based mapping
    const categoryKey = getFlashpointCategoryKey(flashpoint.title);
    if (categoryKey) {
      return categoryKey;
    }

    // Priority 3: Fallback to explicit title matching for edge cases
    const title = flashpoint.title;
    if (title.includes('Nuclear Materials')) return 'nuclear_materials';
    if (title.includes('COUP')) return 'military_coup';
    if (title.includes('ROGUE AI')) return 'rogue_ai';
    if (title.includes('ACCIDENTAL LAUNCH')) return 'accidental_launch';
    if (title.includes('EXTRATERRESTRIAL')) return 'alien_contact';
    if (title.includes('BIO-TERROR')) return 'bio_terror';

    return null;
  }

  /**
   * Calculates reputation updates based on the player's choice.
   * Returns an update object that can be merged with the previous reputation.
   */
  function calculateReputationUpdates(
    option: FlashpointOption,
    success: boolean,
    flashpointHistory: FlashpointHistoryEntry[],
    currentReputation: PlayerReputation
  ): PlayerReputation {
    const totalChoices = flashpointHistory.length + 1;
    const successCount = flashpointHistory.filter(h => h.result === 'success').length + (success ? 1 : 0);

    const reputationUpdate = { ...currentReputation };

    // Update aggressive score (military options)
    if (option.advisorSupport.includes('military')) {
      reputationUpdate.aggressive = Math.min(100, currentReputation.aggressive + 2);
    }

    // Update diplomatic score
    if (option.advisorSupport.includes('diplomatic')) {
      reputationUpdate.diplomatic = Math.min(100, currentReputation.diplomatic + 2);
    }

    // Update cautious score (high probability options)
    if (option.outcome.probability >= 0.7) {
      reputationUpdate.cautious = Math.min(100, currentReputation.cautious + 2);
    }

    // Update reckless score (low probability options)
    if (option.outcome.probability <= 0.4) {
      reputationUpdate.reckless = Math.min(100, currentReputation.reckless + 2);
    }

    // Update overall success rate
    reputationUpdate.successRate = Math.round((successCount / totalChoices) * 100);

    return reputationUpdate;
  }

  /**
   * Calculates DNA points awarded for flashpoint resolution.
   * Awards based on bio-warfare events and intel gained.
   */
  function calculateDnaAward(flashpoint: FlashpointEvent, success: boolean, outcome: Record<string, any>): number {
    let dnaAwarded = 0;

    // Bio-terror events award DNA points
    if (flashpoint.category === 'blackswan' && flashpoint.title.includes('BIO-TERROR')) {
      dnaAwarded = success ? 3 : 1; // More DNA for successful handling
    }
    // Intel-based DNA awards
    else if (success && outcome.intel && outcome.intel > 0) {
      dnaAwarded = Math.floor(outcome.intel / 10); // 1 DNA per 10 intel gained
    }

    return dnaAwarded;
  }

  /**
   * Schedules a follow-up flashpoint if one exists for the chosen outcome.
   * Returns a hint message if a follow-up is scheduled, undefined otherwise.
   */
  function scheduleFollowUpIfNeeded(
    flashpoint: FlashpointEvent,
    optionId: string,
    success: boolean,
    categoryKey: string | null,
    currentTurn: number,
    setPendingFollowUps: React.Dispatch<React.SetStateAction<any[]>>,
    rng: any
  ): string | undefined {
    if (!categoryKey) {
      return undefined;
    }

    const followUpKey = `${optionId}_${success ? 'success' : 'failure'}`;

    // Check if a follow-up template exists for this outcome
    if (FOLLOWUP_FLASHPOINTS[categoryKey]?.[followUpKey]) {
      // Schedule follow-up for 2-4 turns later
      const triggerDelay = rng.nextInt(2, 4);
      setPendingFollowUps(prev => [...prev, {
        parentId: flashpoint.id,
        category: categoryKey,
        outcome: followUpKey,
        triggerAtTurn: currentTurn + triggerDelay
      }]);

      // Debug logging for follow-up scheduling
      console.log(`Follow-up scheduled: ${categoryKey}/${followUpKey} for turn ${currentTurn + triggerDelay}`);

      return 'Intelligence suggests this situation may have further developments. Remain vigilant.';
    } else {
      // Category key found but no matching follow-up template
      console.log(`No follow-up template found for ${categoryKey}/${followUpKey}`);
      return undefined;
    }
  }

  const resolveFlashpoint = useCallback((optionId: string, flashpoint: FlashpointEvent, currentTurn: number): {
    success: boolean;
    outcome: Record<string, any>;
    dnaAwarded?: number;
    flashpointOutcome: FlashpointOutcome;
  } => {
    const option = flashpoint.options.find(opt => opt.id === optionId);
    if (!option) return {
      success: false,
      outcome: {},
      flashpointOutcome: {
        title: flashpoint.title,
        success: false,
        choiceMade: 'Unknown',
        choiceDescription: 'Invalid option',
        narrativeOutcome: 'An error occurred processing your decision.',
        consequences: [],
      }
    };

    const success = rng.next() < option.outcome.probability;
    const outcome = success ? option.outcome.success : option.outcome.failure;

    // Generate narrative outcome
    const narrativeOutcome = generateNarrativeOutcome(option, success, outcome);

    // Format consequences for display
    const formattedConsequences = formatConsequences(outcome);

    // Update player reputation based on choice
    setPlayerReputation(prev => calculateReputationUpdates(option, success, flashpointHistory, prev));

    // Determine category key and schedule follow-up if needed
    const categoryKey = determineCategoryKey(flashpoint);
    const followUpHint = scheduleFollowUpIfNeeded(
      flashpoint,
      optionId,
      success,
      categoryKey,
      currentTurn,
      setPendingFollowUps,
      rng
    );

    // Store detailed history
    const historyEntry: FlashpointHistoryEntry = {
      event: flashpoint,
      choice: optionId,
      choiceText: option.text,
      result: success ? 'success' : 'failure',
      turn: currentTurn,
      outcome,
      narrativeOutcome
    };

    setFlashpointHistory(prev => [...prev, historyEntry]);
    setActiveFlashpoint(null);

    // Award DNA points based on flashpoint outcomes
    const dnaAwarded = calculateDnaAward(flashpoint, success, outcome);

    // Create FlashpointOutcome for display
    const flashpointOutcome: FlashpointOutcome = {
      title: flashpoint.title,
      success,
      choiceMade: option.text,
      choiceDescription: option.description,
      narrativeOutcome,
      consequences: formattedConsequences,
      followUpHint
    };

    return { success, outcome, dnaAwarded, flashpointOutcome };
  }, [flashpointHistory]);

  const dismissFlashpoint = useCallback(() => {
    setActiveFlashpoint(null);
  }, []);

  return {
    activeFlashpoint,
    flashpointHistory,
    playerReputation,
    triggerRandomFlashpoint,
    resolveFlashpoint,
    dismissFlashpoint,
    pendingFollowUps
  };
}
