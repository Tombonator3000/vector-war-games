import { useState, useCallback } from 'react';

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
  }
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
        }
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
        }
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
        }
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

export function useFlashpoints() {
  const [activeFlashpoint, setActiveFlashpoint] = useState<FlashpointEvent | null>(null);
  const [flashpointHistory, setFlashpointHistory] = useState<Array<{ event: FlashpointEvent; choice: string; result: 'success' | 'failure' }>>([]);
  const [pendingFollowUps, setPendingFollowUps] = useState<Array<{ parentId: string; category: string; outcome: string; triggerAtTurn: number }>>([]);

  const triggerRandomFlashpoint = useCallback((turn: number, defcon: number) => {
    // Check for pending follow-ups first
    const followUp = pendingFollowUps.find(f => f.triggerAtTurn <= turn);
    if (followUp) {
      const followUpTemplate = FOLLOWUP_FLASHPOINTS[followUp.category]?.[followUp.outcome];
      if (followUpTemplate) {
        const flashpoint: FlashpointEvent = {
          ...followUpTemplate,
          id: `flashpoint_followup_${Date.now()}`,
          triggeredAt: Date.now(),
          triggeredBy: followUp.parentId
        };
        setPendingFollowUps(prev => prev.filter(f => f !== followUp));
        setActiveFlashpoint(flashpoint);
        return flashpoint;
      }
    }

    const probability = calculateFlashpointProbability(turn, defcon);

    if (Math.random() < probability) {
      const template = FLASHPOINT_TEMPLATES[Math.floor(Math.random() * FLASHPOINT_TEMPLATES.length)];
      const flashpoint: FlashpointEvent = {
        ...template,
        id: `flashpoint_${Date.now()}`,
        triggeredAt: Date.now()
      };
      setActiveFlashpoint(flashpoint);
      return flashpoint;
    }
    return null;
  }, [pendingFollowUps]);

  const resolveFlashpoint = useCallback((optionId: string, flashpoint: FlashpointEvent, currentTurn: number): { success: boolean; outcome: Record<string, any>; dnaAwarded?: number } => {
    const option = flashpoint.options.find(opt => opt.id === optionId);
    if (!option) return { success: false, outcome: {} };

    const success = Math.random() < option.outcome.probability;
    const outcome = success ? option.outcome.success : option.outcome.failure;

    setFlashpointHistory(prev => [...prev, { event: flashpoint, choice: optionId, result: success ? 'success' : 'failure' }]);
    setActiveFlashpoint(null);

    // Schedule follow-up flashpoints based on outcome
    const followUpKey = `${optionId}_${success ? 'success' : 'failure'}`;
    const categoryKey = flashpoint.title.includes('Nuclear Materials') ? 'nuclear_materials' :
                        flashpoint.title.includes('COUP') ? 'military_coup' :
                        flashpoint.title.includes('ROGUE AI') ? 'rogue_ai' : null;

    if (categoryKey && FOLLOWUP_FLASHPOINTS[categoryKey]?.[followUpKey]) {
      setPendingFollowUps(prev => [...prev, {
        parentId: flashpoint.id,
        category: categoryKey,
        outcome: followUpKey,
        triggerAtTurn: currentTurn + Math.floor(Math.random() * 3) + 2 // 2-4 turns later
      }]);
    }

    // Award DNA points based on flashpoint outcomes (if bio-warfare related or successful intel)
    let dnaAwarded = 0;
    if (flashpoint.category === 'blackswan' && flashpoint.title.includes('BIO-TERROR')) {
      dnaAwarded = success ? 3 : 1; // More DNA for successful handling
    } else if (success && outcome.intel && outcome.intel > 0) {
      dnaAwarded = Math.floor(outcome.intel / 10); // 1 DNA per 10 intel gained
    }

    return { success, outcome, dnaAwarded };
  }, []);

  const dismissFlashpoint = useCallback(() => {
    setActiveFlashpoint(null);
  }, []);

  return {
    activeFlashpoint,
    flashpointHistory,
    triggerRandomFlashpoint,
    resolveFlashpoint,
    dismissFlashpoint,
    pendingFollowUps
  };
}
