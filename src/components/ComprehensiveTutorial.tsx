/**
 * ComprehensiveTutorial Component
 *
 * Detailed, interactive tutorial system covering all game mechanics.
 * Progressive learning with practical examples and practice tasks.
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ChevronLeft, ChevronRight, X, Target, Shield, Zap, Users, Radio, Factory,
  Rocket, Bomb, Skull, AlertTriangle, Satellite, Network, Biohazard,
  Trophy, Vote, Sword, Eye, BookOpen, CheckCircle2, Circle, PlayCircle
} from 'lucide-react';

interface TutorialSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  unlockTurn: number;
  lessons: TutorialLesson[];
}

interface TutorialLesson {
  id: string;
  title: string;
  content: string;
  keyPoints: string[];
  practiceTask?: string;
  warningTips?: string[];
  proTips?: string[];
}

// Comprehensive tutorial sections
const TUTORIAL_SECTIONS: TutorialSection[] = [
  // SECTION 1: BASICS
  {
    id: 'basics',
    title: 'Basic Mechanics',
    icon: <Target className="h-5 w-5" />,
    description: 'Learn basic game mechanics and controls',
    unlockTurn: 1,
    lessons: [
      {
        id: 'welcome',
        title: 'Welcome to Vector War Games',
        content: 'You are the commander of a superpower in the nuclear age of the Cold War. Your goal is to survive and dominate through military might, diplomacy, or economic strength. The game proceeds in turns where you and AI opponents take actions, followed by resolution and resource production.',
        keyPoints: [
          'Each turn consists of: Player phase → AI phase → Resolution → Production',
          'You have a limited number of actions per turn',
          'Plan carefully - AI opponents react to your actions',
          'The game has progressive phases with new features that unlock'
        ],
        practiceTask: 'Complete your first turn by observing the UI and available buttons',
        proTips: [
          'Save often - the game can be unpredictable',
          'Use the pause function (ESC) to plan',
          'Read all messages carefully - they provide important information'
        ]
      },
      {
        id: 'resources',
        title: 'Resource System',
        content: 'Three main resources drive your nation: Production (yellow), Uranium (green), and Intel (blue). Each resource has specific uses and regenerates each turn.',
        keyPoints: [
          'PRODUCTION: Build missiles, bombers, defenses, and conventional forces',
          'URANIUM: Required to create nuclear warheads (10MT to 200MT)',
          'INTEL: Research, espionage, satellites, and cyber operations',
          'Resources accumulate if not used',
          'Production rate depends on nation capacity and events'
        ],
        practiceTask: 'Observe the resource panel at the top of the screen. Try using some resources and see how they regenerate next turn.',
        warningTips: [
          'Don\'t spend ALL on one resource - balance usage',
          'Certain events can reduce resource production',
          'Nuclear attacks can destroy production capacity'
        ],
        proTips: [
          'Save resources for emergencies',
          'Counterintelligence research increases Intel production',
          'Captured cities increase Production'
        ]
      },
      {
        id: 'defcon',
        title: 'DEFCON System',
        content: 'DEFCON (Defense Condition) measures war readiness from 5 (peace) to 1 (nuclear war). This system affects which weapons you can deploy and how other nations react.',
        keyPoints: [
          'DEFCON 5: Peace - normal production, full diplomacy available',
          'DEFCON 4: Increased readiness - surveillance and espionage activated',
          'DEFCON 3: High alert - diplomatic penalties begin',
          'DEFCON 2: War imminent - strategic weapons unlocked',
          'DEFCON 1: Nuclear war - all weapons available, diplomacy impossible'
        ],
        practiceTask: 'Observe the DEFCON indicator. Note how it changes based on actions.',
        warningTips: [
          'Lower DEFCON = worse relations with other nations',
          'Diplomatic victory requires DEFCON ≥4 for 4+ turns',
          'DEFCON 1 means total war - expect massive casualties'
        ],
        proTips: [
          'Monitor other nations\' DEFCON levels',
          'Use diplomacy to raise DEFCON',
          'DEFCON 2 required to deploy heaviest weapons'
        ]
      },
      {
        id: 'turn-structure',
        title: 'Turn Structure and Timing',
        content: 'Understanding how each turn works is critical for success. Timing of actions and understanding the sequence gives you strategic advantage.',
        keyPoints: [
          'PLAYER PHASE: Take your actions (build, attack, research, diplomacy)',
          'AI PHASE: AI nations take their actions',
          'RESOLUTION: Attacks resolve, damage calculated, effects applied',
          'PRODUCTION: Resources regenerate, effects decay'
        ],
        practiceTask: 'Carefully observe each phase in one complete turn. Note timing and sequence.',
        warningTips: [
          'AI can react to your actions in the same turn',
          'Certain actions take multiple turns to complete',
          'Always plan at least 3-5 turns ahead'
        ],
        proTips: [
          'Use "END TURN" only when you\'re completely sure',
          'Check all systems before confirming',
          'Coordinate multiple actions for maximum effect'
        ]
      },
      {
        id: 'map-modes',
        title: 'Map Modes & Operational Overlays',
        content: 'The MapModeBar under the top bar lets you switch between strategic map layers: Standard, Diplomatic, Intelligence, Resources, and Unrest. Each mode combines the same aesthetic map style with different data sets, allowing you to analyze the world from multiple angles without opening extra panels.',
        keyPoints: [
          'Alt + 1–5 switches directly between map modes (Standard, Diplomatic, Intelligence, Resources, Unrest)',
          'Diplomatic mode color-codes nations by relation to your government; Intelligence shows surveillance and reconnaissance levels',
          'Unrest mode activates Political Stability Overlay with morale, opinion, and instability from the governance system',
          'Map mode is independent of visual style – you can display resource mode in both Realistic and Night styles without losing data'
        ],
        practiceTask: 'Hold Alt and press 1-5 in sequence to scan all modes. Note how diplomacy, intel, and governance values change on the map.',
        warningTips: [
          'Diplomatic mode is based on last-known relations data – use intelligence to keep information fresh',
          'Intelligence overlay only reveals areas you actually have coverage on; black zones require satellites or espionage'
        ],
        proTips: [
          'Combine Resource mode with night style to see city lights against industrial clusters',
          'Use Unrest mode after governance decisions to confirm morale and opinion are moving in the right direction'
        ]
      }
    ]
  },

  // SECTION 2: NUCLEAR WARFARE
  {
    id: 'nuclear',
    title: 'Nuclear Weapons and Strategic Warfare',
    icon: <Skull className="h-5 w-5" />,
    description: 'Learn about ICBMs, bombers, warheads, and nuclear strategy',
    unlockTurn: 1,
    lessons: [
      {
        id: 'icbms',
        title: 'ICBMs - Intercontinental Ballistic Missiles',
        content: 'ICBMs are your primary attack weapons. They can reach any target on Earth and deliver nuclear warheads with enormous force.',
        keyPoints: [
          'Cost: 30 Production + Uranium (depending on warhead)',
          'Range: Global - can reach any target',
          'Speed: Fast - hits same turn',
          'Can be intercepted: Enemy missile defense can stop missiles',
          'Warheads: 10MT, 20MT, 50MT, 100MT, 200MT (requires research)'
        ],
        practiceTask: 'Build your first ICBM with a 10MT warhead. Observe costs and deployment process.',
        warningTips: [
          'ICBMs CANNOT be recalled after launch',
          'Expect retaliation - build defenses first',
          'Larger warheads = more Uranium cost',
          'Missile defense can stop 70-90% of attacks'
        ],
        proTips: [
          'Coordinate multiple ICBMs to overwhelm defenses',
          'Target enemy bases to reduce retaliation capability',
          '200MT "Planet Cracker" can destroy multiple targets'
        ]
      },
      {
        id: 'bombers',
        title: 'Strategic Bombers',
        content: 'Bombers are slower than missiles but offer flexibility - they can be recalled and reused.',
        keyPoints: [
          'Cost: 40 Production + Uranium for warhead',
          'Speed: Slow - 2-3 turns to target',
          'Can be recalled: Before target is reached',
          'Reusable: If they survive they can return and be reused',
          'Can be intercepted: By air defense and fighters'
        ],
        practiceTask: 'Deploy one bomber. Observe how it moves toward the target over multiple turns.',
        warningTips: [
          'Takes multiple turns to reach target - enemy can prepare',
          'Air defense can shoot down bombers',
          'Must return to base to be reused'
        ],
        proTips: [
          'Use bombers for diplomatic situations where you can recall them',
          'Coordinate with missile attacks to overwhelm defenses',
          'Bombers can carry the heaviest warheads'
        ]
      },
      {
        id: 'warheads',
        title: 'Nuclear Warheads and Destructive Power',
        content: 'Warheads determine the destructive power of your weapons. From 10MT basic warheads to 200MT "Planet Crackers".',
        keyPoints: [
          '10MT: 5 Uranium - Basic, available from start',
          '20MT: 10 Uranium - Double power, moderate cost',
          '50MT: 25 Uranium - Powerful, requires research',
          '100MT: 50 Uranium - Strategic, requires advanced research',
          '200MT: 100 Uranium - "Planet Cracker", can destroy multiple targets'
        ],
        practiceTask: 'Compare costs for different warheads. Plan which ones to use early vs late in the game.',
        warningTips: [
          'Larger warheads use MUCH more Uranium',
          '200MT requires extensive research',
          'Excessive power can be wasted on small targets'
        ],
        proTips: [
          'Start with 10-20MT for cost-effectiveness',
          'Research 50MT around mid-game',
          '200MT is best for eliminating multiple threats simultaneously'
        ]
      },
      {
        id: 'submarines',
        title: 'Nuclear Submarines - Hidden Second-Strike',
        content: 'Submarines provide a hidden second-strike capability. They are harder to detect and intercept.',
        keyPoints: [
          'Cost: 60 Production + Uranium for warheads',
          'Detection chance: Only 30% (vs 90% for ICBMs)',
          'Interception rate: Significantly reduced',
          'Can carry multiple warheads',
          'Unlocked: Requires research (available around turn 15)'
        ],
        practiceTask: 'When available, build a nuclear submarine and compare its capabilities with ICBMs.',
        warningTips: [
          'More expensive than ICBMs',
          'Requires research to unlock',
          'Can still be detected and intercepted (just lower chance)'
        ],
        proTips: [
          'Submarines are best insurance against first-strike',
          'Combine with land-based systems for total deterrence',
          'Invest in submarines for survival strategies'
        ]
      }
    ]
  },

  // SECTION 3: DEFENSE SYSTEMS
  {
    id: 'defense',
    title: 'Defense Systems',
    icon: <Shield className="h-5 w-5" />,
    description: 'Learn about missile defense, Orbital Defense, and survival',
    unlockTurn: 1,
    lessons: [
      {
        id: 'missile-defense',
        title: 'Missile Defense',
        content: 'Missile defense is critical for survival. Each system can intercept one incoming attack.',
        keyPoints: [
          'Cost: 25 Production per unit',
          'Interception rate: 70-90% depending on technology',
          'Consumed when used: Must be rebuilt after interception',
          'Intercepts both missiles and bombers',
          'Can be improved through research'
        ],
        practiceTask: 'Build 3-5 missile defense systems. Calculate how many you need to survive an attack.',
        warningTips: [
          'Defenses are consumed when they intercept attacks',
          'Not 100% reliable - build extras',
          'Massive attacks can overwhelm defenses'
        ],
        proTips: [
          'Build defenses EARLY - you will be attacked',
          'Calculate: (number of enemy weapons × 1.5) = defenses you need',
          'Combine with Orbital Defense for best protection'
        ]
      },
      {
        id: 'orbital-defense',
        title: 'Orbital Defense Grid',
        content: 'The ultimate defense system. Satellite-based, permanent protection that is not consumed.',
        keyPoints: [
          'Cost: 200 Production + 100 Intel (one-time)',
          'Interception rate: 85% permanent',
          'NOT consumed when used',
          'Protects against all types of attacks',
          'Requires advanced research (available around turn 20)'
        ],
        practiceTask: 'Plan when to invest in Orbital Defense. Calculate the payback period.',
        warningTips: [
          'Very expensive - requires long-term planning',
          'Requires extensive research first',
          'Not 100% - combine with other defenses'
        ],
        proTips: [
          'Prioritize this research in mid-game',
          'Investment pays off after 3-5 turns',
          'Combine with conventional defense for near-invincibility'
        ]
      },
      {
        id: 'bunkers',
        title: 'Population Defense and Bunkers',
        content: 'Protect your civilian population from nuclear explosions and radiation.',
        keyPoints: [
          'Bunker construction: Reduces civilian casualties',
          'Evacuation plans: Provides extra time during attacks',
          'Pollution control: Reduces long-term effects',
          'Medical preparedness: Treats radiation victims'
        ],
        practiceTask: 'Observe the population panel. Plan protection measures.',
        warningTips: [
          'Population losses can lead to regime change',
          '50M population required for survival victory',
          'Radiation has long-term effects'
        ],
        proTips: [
          'Build bunkers early in the game',
          'Evacuation plans must be in place before war',
          'Combine with medical research'
        ]
      }
    ]
  },

  // SECTION 4: RESEARCH & TECHNOLOGY
  {
    id: 'research',
    title: 'Research and Technology',
    icon: <Radio className="h-5 w-5" />,
    description: 'Learn to research advanced weapons and technologies',
    unlockTurn: 6,
    lessons: [
      {
        id: 'research-basics',
        title: 'Basic Research Mechanics',
        content: 'Research uses Intel resources over multiple turns to unlock new technologies.',
        keyPoints: [
          'Click the RESEARCH button to open the research menu',
          'Each technology costs Intel and takes multiple turns',
          'Only one research at a time',
          'Some technologies require prerequisite research',
          'Research cannot be canceled once started'
        ],
        practiceTask: 'Open the Research menu. Explore the tech tree and plan your research path.',
        warningTips: [
          'Research ties up Intel resources',
          'Plan carefully - you cannot cancel',
          'Some technologies take 6-8 turns'
        ],
        proTips: [
          'Plan entire research path from the start',
          'Prioritize based on your strategy',
          'Counterintelligence early increases Intel production'
        ]
      },
      {
        id: 'research-priority',
        title: 'Research Priorities',
        content: 'Choose research based on your strategy and opponent threats.',
        keyPoints: [
          'Offensive strategy: 50MT → 100MT → 200MT warheads',
          'Defensive strategy: Missile Defense → Orbital Defense',
          'Economic strategy: Production improvements → Trade technology',
          'Diplomatic strategy: Propaganda → Cultural influence',
          'Balanced: Combine defense and offense'
        ],
        practiceTask: 'Choose your strategy and plan the first 5 researches.',
        warningTips: [
          'Don\'t neglect defense even with offensive strategy',
          'Certain technologies require others first',
          'Enemies will research too - keep pace'
        ],
        proTips: [
          '50MT around turn 6-8 is good timing',
          'Orbital Defense around turn 20 is critical',
          'Counterintelligence first increases total Intel'
        ]
      }
    ]
  },

  // SECTION 5: DIPLOMACY
  {
    id: 'diplomacy',
    title: 'Diplomacy and Alliances',
    icon: <Users className="h-5 w-5" />,
    description: 'Learn to form alliances and use diplomacy effectively',
    unlockTurn: 1,
    lessons: [
      {
        id: 'diplomacy-basics',
        title: 'Basic Diplomacy',
        content: 'Diplomacy allows you to negotiate with other nations without resorting to weapons.',
        keyPoints: [
          'Open the Diplomacy menu to view relations',
          'Each nation has a relationship with you (-100 to +100)',
          'Positive actions increase relations',
          'Negative actions (attacks, threats) reduce relations',
          'Certain actions require minimum relationship level'
        ],
        practiceTask: 'Open the Diplomacy menu. Observe relations and available actions.',
        warningTips: [
          'Breaking agreements severely penalizes relations (-50)',
          'Low DEFCON makes diplomacy harder',
          'AI remembers your actions permanently'
        ],
        proTips: [
          'Build relations early, before you need them',
          'Small favors build trust over time',
          'Monitor relations between other nations'
        ]
      },
      {
        id: 'alliances',
        title: 'Alliances and Treaties',
        content: 'Form alliances for mutual protection and cooperation.',
        keyPoints: [
          'Military alliance: Mutual defense against attacks',
          'Economic alliance: Resource sharing and trade bonuses',
          'Research alliance: Shared technology development',
          'Allies defend each other automatically',
          'Diplomatic victory requires 60% of nations in alliances'
        ],
        practiceTask: 'Form your first alliance with a neutral or friendly nation.',
        warningTips: [
          'Breaking alliance = massive relations penalty',
          'Allies can drag you into wars',
          'Monitor allies\' actions'
        ],
        proTips: [
          'Form alliances with nations near your enemies',
          'Specialized alliances provide unique bonuses',
          'Three strong alliances better than five weak ones'
        ]
      },
      {
        id: 'trust-favors',
        title: 'Trust and Favor System',
        content: 'Relations are governed by trust (0-100) and favors (debt/credit).',
        keyPoints: [
          'Trust: 0-100 scale, affects diplomacy success rate',
          'Favors: Debt/credit system between nations',
          'Request favor: Get resources or help (increases debt)',
          'Fulfill favor: Help ally (increases trust)',
          'High trust = easier negotiations'
        ],
        practiceTask: 'Observe the Trust & Favors panel. Identify who trusts you.',
        warningTips: [
          'Don\'t request too many favors - it reduces trust',
          'Fulfill favors quickly to build good relations',
          'Breaking favor agreements destroys relations'
        ],
        proTips: [
          'Do small favors early to build trust',
          'High trust gives better trade terms',
          'Use favor system to isolate enemies'
        ]
      }
    ]
  },

  // SECTION 6: CONVENTIONAL WARFARE
  {
    id: 'conventional',
    title: 'Conventional Warfare',
    icon: <Sword className="h-5 w-5" />,
    description: 'Learn about armies, navies, and territorial conquest',
    unlockTurn: 11,
    lessons: [
      {
        id: 'conventional-basics',
        title: 'Introduction to Conventional Warfare',
        content: 'From turn 11 you can build conventional forces to conquer territories without nuclear weapons.',
        keyPoints: [
          'ARMIES: Land-based forces for conquest',
          'NAVIES: Naval power for maritime control',
          'AIR FORCES: Air superiority and support',
          'Conquest: Take control of cities and territories',
          'Garrisons: Retain conquered territory'
        ],
        practiceTask: 'Build your first army. Observe costs and deployment options.',
        warningTips: [
          'Conventional forces are vulnerable to nuclear weapons',
          'Conquest without garrisons leads to reconquest',
          'Air superiority is critical for success'
        ],
        proTips: [
          'Combine conventional and nuclear weapons',
          'Conquer resource-rich cities first',
          'Establish supply lines'
        ]
      },
      {
        id: 'territory-control',
        title: 'Territorial Control and Occupation',
        content: 'Conquer and administer cities for resources and victory conditions.',
        keyPoints: [
          'Each city provides resources and population',
          'Conquest requires armies and possibly air support',
          'Garrisons hold conquered land',
          'Occupation requires administration',
          '10+ cities required for economic victory'
        ],
        practiceTask: 'Plan which cities to conquer. Prioritize based on resources.',
        warningTips: [
          'Occupation lowers morale in conquered population',
          'Rebellion can occur without garrisons',
          'Overextension can weaken home defense'
        ],
        proTips: [
          'Prioritize strategically important cities',
          'Coastal cities provide port access',
          'Border cities facilitate further expansion'
        ]
      }
    ]
  },

  // SECTION 7: CYBER WARFARE
  {
    id: 'cyber',
    title: 'Cyber Warfare',
    icon: <Network className="h-5 w-5" />,
    description: 'Learn about hacking, sabotage, and digital attacks',
    unlockTurn: 11,
    lessons: [
      {
        id: 'cyber-basics',
        title: 'Introduction to Cyber Operations',
        content: 'Cyber attacks are cheaper than military attacks and can weaken enemies without direct violence.',
        keyPoints: [
          'INTRUSION: Steal data and secrets',
          'SABOTAGE: Destroy infrastructure and production',
          'FALSE-FLAG: Blame other nations',
          'Detection: 40-70% chance of being detected',
          'Attribution: Enemies can trace attacks back'
        ],
        practiceTask: 'Perform your first cyber intrusion. Observe result and detection risk.',
        warningTips: [
          'Detection reduces relations',
          'False-flag can fail and expose you',
          'Enemies can retaliate with cyber attacks'
        ],
        proTips: [
          'Invest in cyber defense to protect yourself',
          'Use false-flag to start wars between others',
          'Cyber sabotage before military attack weakens enemy'
        ]
      }
    ]
  },

  // SECTION 8: BIO-WARFARE
  {
    id: 'bio',
    title: 'Biological Warfare',
    icon: <Biohazard className="h-5 w-5" />,
    description: 'Learn about biological weapons and pandemic mechanics',
    unlockTurn: 26,
    lessons: [
      {
        id: 'bio-basics',
        title: 'Introduction to Bio-Warfare',
        content: 'From turn 26 you can develop biological weapons in Plague Inc. style. Develop pathogens and deploy against enemies.',
        keyPoints: [
          '7 plague types: Bacteria, Virus, Fungus, Parasite, Prion, Nano-virus, Bio-weapon',
          'DNA Points: Currency for evolution',
          'Transmission: How the pathogen spreads',
          'Symptoms: Effects on infected',
          'Deployment: Multi-nation deployment with attribution'
        ],
        practiceTask: 'Open Bio-Warfare Lab. Explore plague types and evolution tree.',
        warningTips: [
          'Bio-weapons can spread uncontrollably',
          'Too deadly symptoms early draws attention',
          'Cure development can neutralize your weapon'
        ],
        proTips: [
          'Start with Bacteria - easiest to use',
          'Evolve transmission first for spreading',
          'Wait with deadly symptoms until broad infection',
          'Use false-flag deployment to hide responsibility'
        ]
      },
      {
        id: 'evolution-tree',
        title: 'Evolution Tree and DNA Points',
        content: 'Use DNA Points to develop your biological weapon.',
        keyPoints: [
          'TRANSMISSION: Air, water, blood, insect, bird, rodent',
          'SYMPTOMS: Mild to deadly severity',
          'ABILITIES: Resistance, genetic hardening',
          'DNA Points earned through infection',
          'Evolutions cannot be refunded'
        ],
        practiceTask: 'Plan your first evolution sequence. Balance spreading and lethality.',
        warningTips: [
          'DNA Points are limited - use wisely',
          'Evolutions increase cost',
          'Total lethality stops spreading'
        ],
        proTips: [
          'Prioritize transmission early (3-4 evolutions)',
          'Abilities protect against countermeasures',
          'Combine bio-weapons with conventional warfare'
        ]
      }
    ]
  },

  // SECTION 9: INTELLIGENCE
  {
    id: 'intelligence',
    title: 'Intelligence and Espionage',
    icon: <Eye className="h-5 w-5" />,
    description: 'Learn about surveillance, satellites, and espionage',
    unlockTurn: 1,
    lessons: [
      {
        id: 'intel-basics',
        title: 'Basic Intelligence',
        content: 'Intelligence provides you with information about enemy plans and capacity.',
        keyPoints: [
          'SURVEILLANCE: One-time espionage on one nation',
          'SATELLITES: Permanent surveillance',
          'SABOTAGE: Reduce enemy production',
          'COUNTERINTEL: Protect against enemy espionage',
          'Cost: 20-80 Intel per operation'
        ],
        practiceTask: 'Surveil your biggest threat. Analyze the information you receive.',
        warningTips: [
          'Surveillance is one-time - satellites are permanent',
          'Counterintel reduces enemy success rate',
          'Certain nations have better espionage'
        ],
        proTips: [
          'Deploy satellites early over biggest threats',
          'Surveil before major offensive operations',
          'Counterintel research also increases Intel production'
        ]
      }
    ]
  },

  // SECTION 10: VICTORY CONDITIONS
  {
    id: 'victory',
    title: 'Victory Conditions',
    icon: <Trophy className="h-5 w-5" />,
    description: 'Learn about all six victory conditions',
    unlockTurn: 1,
    lessons: [
      {
        id: 'victory-overview',
        title: 'Victory Conditions Overview',
        content: 'There are 6 different ways to win the game. Choose your strategy early.',
        keyPoints: [
          '1. DIPLOMATIC: 60% alliances, DEFCON ≥4, 120+ influence (turn 10+)',
          '2. DOMINATION: Eliminate all enemies (anytime)',
          '3. ECONOMIC: 10+ cities, 4+ trade routes, +50 resources/turn (turn 11+)',
          '4. DEMOGRAPHIC: 60% global population, <30 instability (turn 15+)',
          '5. SURVIVAL: Survive 50 turns, 50M+ population',
          '6. CULTURAL: Propaganda technology, convert enemies (turn 26+)'
        ],
        practiceTask: 'Choose your primary and secondary victory strategy. Plan the path there.',
        warningTips: [
          'Some victories require specific turns (earliest)',
          'Enemies will actively work against your victory strategy',
          'Always have a backup plan'
        ],
        proTips: [
          'Diplomatic victory is fastest (turn 10+)',
          'Survival is easiest but takes longest',
          'Combine strategies for flexibility'
        ]
      },
      {
        id: 'victory-diplomatic',
        title: 'Diplomatic Victory - Detailed Guide',
        content: 'Win through alliances and diplomacy without war.',
        keyPoints: [
          'REQUIREMENTS: Alliances with 60% of nations',
          'Maintain DEFCON ≥4 for minimum 4 turns',
          'Achieve 120+ global influence',
          'Earliest: Turn 10',
          'Bonus: No military casualties'
        ],
        practiceTask: 'Open the Victory Progress panel. Track progress toward diplomatic victory.',
        warningTips: [
          'Aggressive actions lower DEFCON',
          'Breaking agreements destroys diplomacy permanently',
          'AI can break alliances if provoked'
        ],
        proTips: [
          'Form alliances from turn 1',
          'Small favors early build trust',
          'Protect allies from aggression',
          'Avoid conflicts entirely - focus on diplomacy'
        ]
      }
    ]
  },

  // SECTION 11: GOVERNANCE
  {
    id: 'governance',
    title: 'Governance and Morale',
    icon: <Vote className="h-5 w-5" />,
    description: 'Learn to manage population and morale',
    unlockTurn: 1,
    lessons: [
      {
        id: 'governance-basics',
        title: 'Population Satisfaction and Morale',
        content: 'Your population reacts to your actions. Low morale can lead to regime change.',
        keyPoints: [
          'Morale: 0-100 scale',
          'Affected by: Military casualties, economic success, threats',
          'Low morale (<30): Risk of regime change',
          'Elections: Every 12 turns (>40% approval required)',
          'Game over: If you lose election or regime change'
        ],
        practiceTask: 'Observe the morale panel. Identify what affects morale.',
        warningTips: [
          'Massive casualties drastically lower morale',
          'Regime change = game over',
          'Lost elections = game over'
        ],
        proTips: [
          'Keep morale above 50 for stability',
          'Actively defend the population',
          'Diplomatic victories increase morale'
        ]
      }
    ]
  }
];

export function ComprehensiveTutorial({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [currentSection, setCurrentSection] = useState(0);
  const [currentLesson, setCurrentLesson] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

  const section = TUTORIAL_SECTIONS[currentSection];
  const lesson = section?.lessons[currentLesson];

  const totalLessons = TUTORIAL_SECTIONS.reduce((sum, s) => sum + s.lessons.length, 0);
  const completedCount = completedLessons.size;
  const progressPercent = (completedCount / totalLessons) * 100;

  const handleNext = () => {
    if (lesson && !completedLessons.has(lesson.id)) {
      setCompletedLessons(prev => new Set(prev).add(lesson.id));
    }

    if (currentLesson < section.lessons.length - 1) {
      setCurrentLesson(currentLesson + 1);
    } else if (currentSection < TUTORIAL_SECTIONS.length - 1) {
      setCurrentSection(currentSection + 1);
      setCurrentLesson(0);
    }
  };

  const handlePrevious = () => {
    if (currentLesson > 0) {
      setCurrentLesson(currentLesson - 1);
    } else if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
      setCurrentLesson(TUTORIAL_SECTIONS[currentSection - 1].lessons.length - 1);
    }
  };

  const handleSectionSelect = (sectionIndex: number) => {
    setCurrentSection(sectionIndex);
    setCurrentLesson(0);
  };

  const handleMarkComplete = () => {
    if (lesson) {
      setCompletedLessons(prev => new Set(prev).add(lesson.id));
    }
  };

  const isFirstLesson = currentSection === 0 && currentLesson === 0;
  const isLastLesson = currentSection === TUTORIAL_SECTIONS.length - 1 &&
                       currentLesson === section.lessons.length - 1;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden">
        <div className="flex flex-col h-[90vh]">
          {/* Header */}
          <DialogHeader className="p-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BookOpen className="h-6 w-6 text-primary" />
                <div>
                  <DialogTitle className="text-2xl">Complete Tutorial</DialogTitle>
                  <DialogDescription className="mt-1">
                    Learn all game mechanics step by step
                  </DialogDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-muted-foreground">
                  {completedCount} / {totalLessons} lessons completed
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <Progress value={progressPercent} className="h-2" />
            </div>
          </DialogHeader>

          {/* Content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar - Sections */}
            <div className="w-64 border-r overflow-y-auto">
              <div className="p-4 space-y-2">
                {TUTORIAL_SECTIONS.map((sec, idx) => {
                  const sectionCompleted = sec.lessons.every(l => completedLessons.has(l.id));
                  const sectionProgress = sec.lessons.filter(l => completedLessons.has(l.id)).length;
                  const isActive = idx === currentSection;

                  return (
                    <button
                      key={sec.id}
                      onClick={() => handleSectionSelect(idx)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        isActive ? 'bg-accent border-primary' : 'hover:bg-accent/50'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="text-primary mt-0.5">{sec.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm">{sec.title}</h4>
                            {sectionCompleted && (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {sec.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Progress
                              value={(sectionProgress / sec.lessons.length) * 100}
                              className="h-1"
                            />
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {sectionProgress}/{sec.lessons.length}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs mt-2">
                            Turn {sec.unlockTurn}+
                          </Badge>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main content - Lesson */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <ScrollArea className="flex-1 p-6">
                {lesson && (
                  <div className="max-w-3xl space-y-6">
                    {/* Lesson header */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">
                          Lesson {currentLesson + 1} of {section.lessons.length}
                        </Badge>
                        {completedLessons.has(lesson.id) ? (
                          <Badge className="bg-green-500">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleMarkComplete}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Mark as complete
                          </Button>
                        )}
                      </div>
                      <h2 className="text-3xl font-bold">{lesson.title}</h2>
                    </div>

                    {/* Lesson content */}
                    <div className="prose prose-sm max-w-none">
                      <p className="text-base leading-relaxed">{lesson.content}</p>
                    </div>

                    {/* Key points */}
                    <div className="bg-muted p-4 rounded-lg">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        Key Points
                      </h3>
                      <ul className="space-y-2">
                        {lesson.keyPoints.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <span className="text-primary mt-1">▸</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Practice task */}
                    {lesson.practiceTask && (
                      <div className="border-l-4 border-primary bg-primary/5 p-4 rounded-r-lg">
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                          <PlayCircle className="h-4 w-4 text-primary" />
                          Practice Task
                        </h3>
                        <p className="text-sm">{lesson.practiceTask}</p>
                      </div>
                    )}

                    {/* Warning tips */}
                    {lesson.warningTips && lesson.warningTips.length > 0 && (
                      <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg">
                        <h3 className="font-semibold mb-3 flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
                          <AlertTriangle className="h-4 w-4" />
                          Important Warnings
                        </h3>
                        <ul className="space-y-2">
                          {lesson.warningTips.map((tip, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <span className="text-yellow-600 dark:text-yellow-500 mt-1">⚠</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Pro tips */}
                    {lesson.proTips && lesson.proTips.length > 0 && (
                      <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg">
                        <h3 className="font-semibold mb-3 flex items-center gap-2 text-blue-600 dark:text-blue-500">
                          <Zap className="h-4 w-4" />
                          Pro Tips
                        </h3>
                        <ul className="space-y-2">
                          {lesson.proTips.map((tip, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <span className="text-blue-600 dark:text-blue-500 mt-1">💡</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              {/* Navigation footer */}
              <div className="border-t p-4 flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={isFirstLesson}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                <div className="text-sm text-muted-foreground">
                  Section {currentSection + 1} / {TUTORIAL_SECTIONS.length}
                </div>

                {isLastLesson ? (
                  <Button onClick={onClose}>
                    Complete Tutorial
                  </Button>
                ) : (
                  <Button onClick={handleNext}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
