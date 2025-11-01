import { useState, useCallback } from 'react';
import { useRNG } from '@/contexts/RNGContext';

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
  cubanCrisis: [
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
    } | null;
  };
};

const getActiveScenarioId = (): string | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const globalWindow = window as WindowWithScenario;
  const scenarioId = globalWindow.S?.scenario?.id;
  if (scenarioId) {
    return scenarioId;
  }

  try {
    const stored = globalWindow.localStorage?.getItem('selected_scenario');
    if (stored) {
      return stored;
    }
  } catch {
    // Ignore storage access errors (e.g., privacy mode or server rendering)
  }

  return undefined;
};

const FLASHPOINT_TEMPLATES: Omit<FlashpointEvent, 'id' | 'triggeredAt'>[] = [
  {
    title: 'FLASH TRAFFIC: Nuclear Materials Stolen',
    description: 'CIA reports terrorists seized 20kg of weapons-grade plutonium. They threaten to detonate a device in New York City within 72 hours.',
    category: 'terrorist',
    severity: 'catastrophic',
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
          success: { nuclearWar: true, worldEnds: true },
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
  if (outcome.war) {
    narrative += 'This action has triggered a state of war. ';
  }

  return narrative || (success ? 'The situation has been resolved favorably.' : 'The situation has deteriorated.');
}

// Helper function to format consequences for display
function formatConsequences(outcome: Record<string, any>): Array<{ label: string; value: string | number; type: 'positive' | 'negative' | 'neutral' }> {
  const consequences: Array<{ label: string; value: string | number; type: 'positive' | 'negative' | 'neutral' }> = [];

  if (typeof outcome.morale === 'number') {
    consequences.push({
      label: 'Morale',
      value: outcome.morale > 0 ? `+${outcome.morale}` : `${outcome.morale}`,
      type: outcome.morale > 0 ? 'positive' : 'negative'
    });
  }

  if (typeof outcome.intel === 'number') {
    consequences.push({
      label: 'Intelligence',
      value: outcome.intel > 0 ? `+${outcome.intel}` : `${outcome.intel}`,
      type: outcome.intel > 0 ? 'positive' : 'negative'
    });
  }

  if (typeof outcome.production === 'number') {
    consequences.push({
      label: 'Production',
      value: outcome.production > 0 ? `+${outcome.production}` : `${outcome.production}`,
      type: outcome.production > 0 ? 'positive' : 'negative'
    });
  }

  if (outcome.casualties) {
    consequences.push({
      label: 'Casualties',
      value: outcome.casualties.toLocaleString(),
      type: 'negative'
    });
  }

  if (outcome.defcon) {
    consequences.push({
      label: 'DEFCON',
      value: outcome.defcon,
      type: outcome.defcon < 3 ? 'negative' : 'neutral'
    });
  }

  if (outcome.threatNeutralized) {
    consequences.push({
      label: 'Status',
      value: 'Threat Neutralized',
      type: 'positive'
    });
  }

  if (outcome.newAlliance) {
    consequences.push({
      label: 'Diplomacy',
      value: 'New Alliance Formed',
      type: 'positive'
    });
  }

  if (outcome.war) {
    consequences.push({
      label: 'War Status',
      value: 'War Declared',
      type: 'negative'
    });
  }

  if (outcome.nuclearExplosion) {
    consequences.push({
      label: 'Critical Event',
      value: 'Nuclear Detonation',
      type: 'negative'
    });
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

  const triggerRandomFlashpoint = useCallback((turn: number, defcon: number) => {
    // Check for pending follow-ups first (priority over random flashpoints)
    if (pendingFollowUps.length > 0) {
      console.log(`Checking ${pendingFollowUps.length} pending follow-ups for turn ${turn}`);
    }

    const followUp = pendingFollowUps.find(f => f.triggerAtTurn <= turn);
    if (followUp) {
      console.log(`Triggering follow-up: ${followUp.category}/${followUp.outcome} (scheduled for turn ${followUp.triggerAtTurn}, current turn ${turn})`);

      const followUpTemplate = FOLLOWUP_FLASHPOINTS[followUp.category]?.[followUp.outcome];
      if (followUpTemplate) {
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
      } else {
        // Template not found - log warning but still remove from queue to prevent infinite retries
        console.warn(`Follow-up template not found for category: ${followUp.category}, outcome: ${followUp.outcome}. Removing from queue.`);
        setPendingFollowUps(prev => prev.filter(f => f !== followUp));
      }
    }

    const probability = calculateFlashpointProbability(turn, defcon);

    if (rng.next() < probability) {
      const scenarioId = getActiveScenarioId();
      const scenarioTemplates = scenarioId ? SCENARIO_FLASHPOINTS[scenarioId] : undefined;
      const templatePool = scenarioTemplates && scenarioTemplates.length > 0 ? scenarioTemplates : FLASHPOINT_TEMPLATES;
      const template = rng.choice(templatePool);
      const baseFlashpoint: FlashpointEvent = {
        ...template,
        id: `flashpoint_${Date.now()}`,
        triggeredAt: Date.now()
      };

      // Inject historical context into new flashpoints
      const flashpoint = injectHistoricalContext(baseFlashpoint, flashpointHistory, playerReputation);

      setActiveFlashpoint(flashpoint);
      return flashpoint;
    }
    return null;
  }, [pendingFollowUps, flashpointHistory, playerReputation, rng]);

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
    setPlayerReputation(prev => {
      const totalChoices = flashpointHistory.length + 1;
      const successCount = flashpointHistory.filter(h => h.result === 'success').length + (success ? 1 : 0);

      const reputationUpdate = { ...prev };

      // Update aggressive score (military options)
      if (option.advisorSupport.includes('military')) {
        reputationUpdate.aggressive = Math.min(100, prev.aggressive + 2);
      }

      // Update diplomatic score
      if (option.advisorSupport.includes('diplomatic')) {
        reputationUpdate.diplomatic = Math.min(100, prev.diplomatic + 2);
      }

      // Update cautious score (high probability options)
      if (option.outcome.probability >= 0.7) {
        reputationUpdate.cautious = Math.min(100, prev.cautious + 2);
      }

      // Update reckless score (low probability options)
      if (option.outcome.probability <= 0.4) {
        reputationUpdate.reckless = Math.min(100, prev.reckless + 2);
      }

      // Update overall success rate
      reputationUpdate.successRate = Math.round((successCount / totalChoices) * 100);

      return reputationUpdate;
    });

    // Determine follow-up hint using helper function for more reliable mapping
    const followUpKey = `${optionId}_${success ? 'success' : 'failure'}`;
    const categoryKey = flashpoint.followUpId ??
                        getFlashpointCategoryKey(flashpoint.title) ??
                        (flashpoint.title.includes('Nuclear Materials') ? 'nuclear_materials' :
                        flashpoint.title.includes('COUP') ? 'military_coup' :
                        flashpoint.title.includes('ROGUE AI') ? 'rogue_ai' :
                        flashpoint.title.includes('ACCIDENTAL LAUNCH') ? 'accidental_launch' :
                        flashpoint.title.includes('EXTRATERRESTRIAL') ? 'alien_contact' :
                        flashpoint.title.includes('BIO-TERROR') ? 'bio_terror' : null);

    let followUpHint: string | undefined;
    if (categoryKey && FOLLOWUP_FLASHPOINTS[categoryKey]?.[followUpKey]) {
      followUpHint = 'Intelligence suggests this situation may have further developments. Remain vigilant.';

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
    } else if (categoryKey) {
      // Category key found but no matching follow-up template
      console.log(`No follow-up template found for ${categoryKey}/${followUpKey}`);
    }

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

    // Award DNA points based on flashpoint outcomes (if bio-warfare related or successful intel)
    let dnaAwarded = 0;
    if (flashpoint.category === 'blackswan' && flashpoint.title.includes('BIO-TERROR')) {
      dnaAwarded = success ? 3 : 1; // More DNA for successful handling
    } else if (success && outcome.intel && outcome.intel > 0) {
      dnaAwarded = Math.floor(outcome.intel / 10); // 1 DNA per 10 intel gained
    }

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
