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

      let reputationUpdate = { ...prev };

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
