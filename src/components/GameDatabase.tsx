/**
 * GameDatabase Component
 *
 * Comprehensive game reference database covering all game mechanics, systems, and features.
 * Accessible from the Options menu for easy reference during gameplay.
 */

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen, Target, Zap, Shield, Radio, Factory, Users,
  AlertTriangle, Sword, Skull, Biohazard, Network,
  Trophy, Vote, Globe, Flame, Eye, Search, X,
  Rocket, Bomb, ShieldAlert, Satellite, Lock, Unlock,
  ChevronLeft, Sparkles, ListTree
} from 'lucide-react';

interface DatabaseEntry {
  id: string;
  title: string;
  category: string;
  icon: React.ReactNode;
  summary: string;
  details: string;
  mechanics?: string[];
  tips?: string[];
  unlockTurn?: number;
  relatedTopics?: string[];
}

// Comprehensive database of all game mechanics
const DATABASE_ENTRIES: DatabaseEntry[] = [
  // BASIC MECHANICS
  {
    id: 'resources',
    title: 'Resource System',
    category: 'basics',
    icon: <Factory className="h-5 w-5" />,
    summary: 'Three main resources power your nation: Production, Uranium, and Intel.',
    details: 'Resources regenerate each turn based on your nation\'s production capacity. Production is used to build military equipment, Uranium to create nuclear warheads, and Intel for research and espionage.',
    mechanics: [
      'Production: 50-200 per turn depending on nation',
      'Uranium: 10-50 per turn, necessary for warheads',
      'Intel: 20-100 per turn, used for research and operations',
      'Resources accumulate if not used',
      'Certain events can reduce resource production'
    ],
    tips: [
      'Balance resource spending - don\'t spend everything on one weapon type',
      'Save resources for emergencies',
      'Research technologies that increase resource production'
    ]
  },
  {
    id: 'defcon',
    title: 'DEFCON System',
    category: 'basics',
    icon: <AlertTriangle className="h-5 w-5" />,
    summary: 'DEFCON (Defense Condition) measures war readiness from 5 (peace) to 1 (nuclear war).',
    details: 'DEFCON level affects which weapons you can deploy, how other nations react, and victory conditions. Aggressive actions lower DEFCON, while diplomacy can raise it.',
    mechanics: [
      'DEFCON 5: Peace - normal production, full diplomacy',
      'DEFCON 4: Increased readiness - surveillance activated',
      'DEFCON 3: High readiness - diplomatic penalties',
      'DEFCON 2: War imminent - strategic weapons unlocked',
      'DEFCON 1: Nuclear war - all weapons available'
    ],
    tips: [
      'Keep DEFCON high for diplomatic victory',
      'DEFCON 2 required to deploy heaviest weapons',
      'Monitor other nations\' DEFCON levels',
      'Each DEFCON level has unique consequences'
    ],
    relatedTopics: ['diplomacy', 'victory-diplomatic']
  },
  {
    id: 'turn-structure',
    title: 'Turn Structure',
    category: 'basics',
    icon: <Target className="h-5 w-5" />,
    summary: 'Each turn consists of four phases: Player, AI, Resolution, and Production.',
    details: 'The game progresses in structured turns where each nation gets an opportunity to act, followed by resolution of all actions and regeneration of resources.',
    mechanics: [
      'PLAYER phase: You take your actions (build, attack, research, etc.)',
      'AI phase: All AI nations take their actions',
      'RESOLUTION phase: Attacks are resolved, damage calculated, effects applied',
      'PRODUCTION phase: Resources regenerate, effects decay'
    ],
    tips: [
      'Plan actions before confirming the turn',
      'AI can react to your actions',
      'Certain actions take multiple turns to complete'
    ]
  },
  {
    id: 'strategic-ledger',
    title: 'Strategic Ledger',
    category: 'basics',
    icon: <ListTree className="h-5 w-5" />,
    summary: 'Tabular macro overview of all nations, with resources, military strength, and diplomatic ties in one screen.',
    details: 'The Ledger tab in CivilizationInfoPanel combines all available intelligence in a sortable and filterable layout. Click on a row to retrieve the same detailed card as the Enemy Nations tab, or use the Shift + L hotkey to jump directly to the overview when the panel is open.',
    mechanics: [
      'Shows all known nations with real-time values for production, uranium, intel, and military strength',
      'Filter chips isolate allies, enemies, neutral states, or the top 5 military powers',
      'Column headers can be clicked to sort ascending/descending, and the setting persists until the panel closes',
      'Row clicks unlock detailed intelligence cards without leaving the ledger',
      'Shift + L functions as a hotkey to open the ledger tab when CivilizationInfoPanel is already active'
    ],
    tips: [
      'Use the ledger before offensives to check if opponents match your strength or resources',
      'Filter on "Top 5 strength" to quickly identify who can threaten you in the short term',
      'Keep an eye on the relations column to react to diplomatic shifts without switching to the diplomacy tab'
    ]
  },
  {
    id: 'map-modes',
    title: 'Map Modes & Overlays',
    category: 'basics',
    icon: <Globe className="h-5 w-5" />,
    summary: 'MapModeBar below the top bar switches between visual operation layers for diplomacy, intelligence, resources, and unrest.',
    details: 'Map modes combine functional overlays with selected aesthetics. MapModeBar (or hotkeys Alt + 1–5) toggles between Standard, Diplomatic, Intelligence, Resources, and Unrest. Data is pulled from diplomacy, intelligence, and governance systems in real-time, and works on both the Three.js globe and Cesium view.',
    mechanics: [
      'Alt + 1: Standard – classic map with markers, DEFCON grid, and crystal-clear day/night aesthetics',
      'Alt + 2: Diplomatic – territories color-coded by relationship to your government, with quick friend/foe overview',
      'Alt + 3: Intelligence – shows surveillance coverage, reconnaissance level, and satellite network status',
      'Alt + 4: Resources – highlights strategic reserves, production hubs, and market pressure',
      'Alt + 5: Unrest – activates Political Stability Overlay and marks morale, opinion, and instability per nation'
    ],
    tips: [
      'Map modes can be combined with any visual style (Realistic, Night, Vector, etc.) without losing data overlays',
      'Hold Alt and press numbers in sequence for quick scanning of global situations',
      'Unrest mode updates when governance metrics change – use it after political decisions to see effect immediately'
    ],
    relatedTopics: ['diplomacy', 'intel-operations', 'governance']
  },

  // NUCLEAR WARFARE
  {
    id: 'icbms',
    title: 'ICBMs (Intercontinental Ballistic Missiles)',
    category: 'nuclear',
    icon: <Rocket className="h-5 w-5" />,
    summary: 'Long-range nuclear missiles that can reach any target globally.',
    details: 'ICBMs are your primary offensive weapons. They can be equipped with warheads from 10MT to 200MT. Larger warheads deal more damage but cost more Uranium.',
    mechanics: [
      'Cost: 30 Production + Uranium (depending on warhead)',
      'Range: Global',
      'Speed: Fast (hits same turn)',
      'Can be intercepted by missile defense',
      'Warheads: 10MT, 20MT, 50MT, 100MT, 200MT'
    ],
    tips: [
      'Build missile defense before attacking - expect retaliation',
      'Larger warheads = more destruction = more Uranium',
      'ICBMs cannot be recalled after launch',
      '200MT "Planet Cracker" requires advanced research'
    ],
    relatedTopics: ['warheads', 'missile-defense', 'research-nuclear']
  },
  {
    id: 'bombers',
    title: 'Strategic Bombers',
    category: 'nuclear',
    icon: <Bomb className="h-5 w-5" />,
    summary: 'Nuclear weapon-carrying aircraft that can return to base.',
    details: 'Bombers are slower than missiles but can be recalled and reused. They can also carry heavy warheads.',
    mechanics: [
      'Cost: 40 Production + Uranium for warhead',
      'Speed: Slow (2-3 turns to target)',
      'Can be recalled before reaching target',
      'Can be intercepted by air defense',
      'Can be reused if they survive'
    ],
    tips: [
      'Use bombers for flexibility',
      'Recall if enemy surrenders',
      'Bombers can be coordinated with missile attacks',
      'Defend against enemy air defense'
    ],
    relatedTopics: ['icbms', 'air-defense', 'warheads']
  },
  {
    id: 'warheads',
    title: 'Nuclear Warheads',
    category: 'nuclear',
    icon: <Skull className="h-5 w-5" />,
    summary: 'Nuclear charges from 10MT to 200MT that are mounted on weapons.',
    details: 'Warheads determine a weapon\'s destructive power. Larger warheads require more Uranium and advanced research.',
    mechanics: [
      '10MT: 5 Uranium - Basic warhead',
      '20MT: 10 Uranium - Enhanced destruction',
      '50MT: 25 Uranium - Powerful warhead (requires research)',
      '100MT: 50 Uranium - Strategic warhead (requires research)',
      '200MT: 100 Uranium - "Planet Cracker" (requires advanced research)'
    ],
    tips: [
      'Start with 10-20MT warheads',
      'Research your way up to larger warheads',
      '200MT can destroy multiple targets simultaneously',
      'Balance power against cost'
    ],
    relatedTopics: ['research-nuclear', 'icbms', 'bombers'],
    unlockTurn: 1
  },
  {
    id: 'missile-defense',
    title: 'Missile Defense',
    category: 'nuclear',
    icon: <ShieldAlert className="h-5 w-5" />,
    summary: 'Defense systems that intercept incoming missiles and bombers.',
    details: 'Missile defense is critical for survival. Each defense system can intercept one attack per turn.',
    mechanics: [
      'Cost: 25 Production per unit',
      'Intercept rate: 70-90% depending on technology',
      'Can intercept missiles and bombers',
      'Consumed on use (must be rebuilt)',
      'Orbital Defense Grid provides permanent defense'
    ],
    tips: [
      'Build defense early - you will be attacked',
      'Calculate how much defense you need',
      'Orbital Defense Grid is best long-term investment',
      'Defense also protects against enemy retaliation'
    ],
    relatedTopics: ['orbital-defense', 'research-defense', 'icbms']
  },
  {
    id: 'submarines',
    title: 'Nuclear Submarines',
    category: 'nuclear',
    icon: <Target className="h-5 w-5" />,
    summary: 'Submarines equipped with nuclear missiles, harder to detect and intercept.',
    details: 'Nuclear submarines provide a hidden second-strike capability. They are harder to detect and intercept than land-based missiles.',
    mechanics: [
      'Cost: 60 Production + Uranium for warhead',
      'Detection chance: 30% (vs 90% for ICBMs)',
      'Intercept rate: Reduced',
      'Can carry multiple warheads',
      'Requires research to unlock'
    ],
    tips: [
      'Submarines are best insurance against first strike',
      'Harder for enemy to defend against',
      'Invest in submarines for survival strategy',
      'Combine with land-based systems'
    ],
    relatedTopics: ['icbms', 'research-nuclear'],
    unlockTurn: 15
  },

  // DEFENSE SYSTEMS
  {
    id: 'orbital-defense',
    title: 'Orbital Defense Grid',
    category: 'defense',
    icon: <Satellite className="h-5 w-5" />,
    summary: 'Satellite-based defense system that provides permanent protection.',
    details: 'The ultimate defense system. Once built, it provides permanent missile interception without being consumed.',
    mechanics: [
      'Cost: 200 Production, 100 Intel (one-time)',
      'Intercept rate: 85% permanent',
      'Not consumed on use',
      'Protects against all types of attacks',
      'Requires advanced research'
    ],
    tips: [
      'Prioritize this research in mid-game',
      'Investment pays off over time',
      'Combine with conventional defense',
      'Protects against both missiles and bombers'
    ],
    relatedTopics: ['missile-defense', 'research-defense'],
    unlockTurn: 20
  },
  {
    id: 'force-fields',
    title: 'Force Field Technology',
    category: 'defense',
    icon: <Shield className="h-5 w-5" />,
    summary: 'Advanced energy shield that can block nuclear explosions.',
    details: 'The most advanced defense technology. Force fields can partially absorb nuclear explosions.',
    mechanics: [
      'Cost: 300 Production, 150 Intel',
      'Damage absorption: 50%',
      'Works against all types of attacks',
      'Permanent once built',
      'Requires very advanced research'
    ],
    tips: [
      'Late-game technology',
      'Combine with Orbital Defense',
      'Can make you nearly invulnerable',
      'Prioritize if planning long war'
    ],
    relatedTopics: ['orbital-defense', 'research-defense'],
    unlockTurn: 30
  },

  // RESEARCH & TECHNOLOGY
  {
    id: 'research-system',
    title: 'Research System',
    category: 'research',
    icon: <Radio className="h-5 w-5" />,
    summary: 'Unlock advanced weapons, defenses, and abilities through research.',
    details: 'Research uses Intel resources over multiple turns to unlock new technologies. Some technologies require prerequisite research.',
    mechanics: [
      'Cost: Varies (50-300 Intel)',
      'Duration: 2-8 turns',
      'Can only research one thing at a time',
      'Some technologies have prerequisites',
      'Research cannot be canceled'
    ],
    tips: [
      'Plan your research path early',
      'Prioritize based on your strategy',
      'Counterintelligence increases Intel production',
      'Don\'t neglect defense research'
    ],
    relatedTopics: ['research-nuclear', 'research-defense', 'research-cyber'],
    unlockTurn: 6
  },
  {
    id: 'research-nuclear',
    title: 'Nuclear Weapons Research',
    category: 'research',
    icon: <Skull className="h-5 w-5" />,
    summary: 'Research larger and more effective nuclear weapons.',
    details: 'Nuclear weapons research unlocks larger warheads, improved accuracy, and specialized weapon systems.',
    mechanics: [
      '50MT Warhead (100 Intel, 3 turns)',
      '100MT Warhead (150 Intel, 4 turns, requires 50MT)',
      '200MT Planet Cracker (250 Intel, 6 turns, requires 100MT)',
      'Improved rocket engines (80 Intel, 2 turns)',
      'Submarine technology (120 Intel, 4 turns)'
    ],
    tips: [
      'Start with 50MT research around turn 6-8',
      '200MT is game-changing - prioritize in mid-game',
      'Submarines provide second-strike capability'
    ],
    relatedTopics: ['research-system', 'warheads', 'submarines'],
    unlockTurn: 6
  },
  {
    id: 'research-defense',
    title: 'Defense Research',
    category: 'research',
    icon: <Shield className="h-5 w-5" />,
    summary: 'Improve defense systems and survivability.',
    details: 'Defense research increases missile intercept rate, unlocks Orbital Defense, and provides protection against attacks.',
    mechanics: [
      'Improved Missile Defense (80 Intel, 2 turns)',
      'Orbital Defense Grid (200 Intel, 5 turns)',
      'Force Field technology (300 Intel, 7 turns, requires Orbital Defense)',
      'Bunker construction (60 Intel, 2 turns)'
    ],
    tips: [
      'Defense research is as important as offense',
      'Prioritize Orbital Defense Grid early',
      'Force Fields are ultimate defense'
    ],
    relatedTopics: ['research-system', 'orbital-defense', 'force-fields'],
    unlockTurn: 6
  },
  {
    id: 'research-cyber',
    title: 'Cyber Research',
    category: 'research',
    icon: <Network className="h-5 w-5" />,
    summary: 'Unlock cyber attacks and digital defense.',
    details: 'Cyber research provides access to hacking, sabotage, and digital defense.',
    mechanics: [
      'Basic Cyber Ops (100 Intel, 3 turns) - Unlocks cyber attacks',
      'Advanced Firewalls (120 Intel, 3 turns)',
      'AI Defense Systems (180 Intel, 4 turns)',
      'Cyber Superweapons (250 Intel, 6 turns)'
    ],
    tips: [
      'Cyber attacks are cheaper than military attacks',
      'Can sabotage enemy production',
      'Defend against enemy cyber attacks'
    ],
    relatedTopics: ['research-system', 'cyber-warfare'],
    unlockTurn: 11
  },

  // DIPLOMACY
  {
    id: 'diplomacy',
    title: 'Diplomacy System',
    category: 'diplomacy',
    icon: <Users className="h-5 w-5" />,
    summary: 'Use diplomacy to form alliances, treaties, and peaceful coexistence.',
    details: 'Diplomacy allows you to negotiate with other nations, form alliances, enter treaties, and influence global relations.',
    mechanics: [
      'Peace proposals: Temporary ceasefire',
      'Alliances: Military cooperation',
      'Non-aggression pacts: Mutual protection',
      'Economic aid: Resource sharing',
      'Sanctions: Economic penalties',
      'Capitulation demands: Force surrender'
    ],
    tips: [
      'Build trust over time',
      'Don\'t break promises - it reduces trust permanently',
      'Alliances can win the game',
      'Monitor other nations\' relationships'
    ],
    relatedTopics: ['victory-diplomatic', 'trust-system', 'alliances'],
    unlockTurn: 1
  },
  {
    id: 'trust-system',
    title: 'Trust and Favors',
    category: 'diplomacy',
    icon: <Users className="h-5 w-5" />,
    summary: 'Relations between nations are measured in trust (0-100) and favors (debt/credit).',
    details: 'Each nation has a trust level with other nations. High trust makes diplomacy easier, low trust makes it harder.',
    mechanics: [
      'Trust: 0-100 scale per nation',
      'Positive actions increase trust',
      'Negative actions reduce trust',
      'Favors: Debt/credit system',
      'Ask for favors to get help',
      'Fulfill favors to build trust'
    ],
    tips: [
      'High trust = easier diplomacy',
      'Don\'t break promises - trust drops drastically',
      'Do favors to build alliances',
      'Monitor who owes whom'
    ],
    relatedTopics: ['diplomacy', 'alliances'],
    unlockTurn: 16
  },
  {
    id: 'alliances',
    title: 'Alliances',
    category: 'diplomacy',
    icon: <Users className="h-5 w-5" />,
    summary: 'Form military, economic, or research alliances with other nations.',
    details: 'Alliances provide bonuses and protection. Specialized alliances provide unique advantages.',
    mechanics: [
      'Military alliance: Mutual defense',
      'Economic alliance: Resource sharing',
      'Research alliance: Shared technology',
      'Alliance members defend each other',
      'Breaking alliance severely penalizes trust'
    ],
    tips: [
      'Form alliances early for diplomatic victory',
      'Specialized alliances provide unique bonuses',
      'Protect allies - they protect you',
      'Required for diplomatic victory (60% of nations)'
    ],
    relatedTopics: ['diplomacy', 'trust-system', 'victory-diplomatic'],
    unlockTurn: 10
  },

  // CONVENTIONAL WARFARE
  {
    id: 'conventional-warfare',
    title: 'Conventional Warfare',
    category: 'conventional',
    icon: <Sword className="h-5 w-5" />,
    summary: 'Non-nuclear warfare with armies, navies, and air forces to conquer territories.',
    details: 'From turn 11, you can build conventional military units and conquer territories. The game uses 8 global territories organized Risk-style with neighbor mechanics. You start with one territory (North America) and can expand by attacking neighboring lands with armies.',
    mechanics: [
      'Three unit types: Armored Corps (army), Carrier Strike Group (navy), Expeditionary Air Wing (air)',
      'Units are deployed as "armies" to territories',
      'Armored Corps: 12 prod + 5 oil = 5 armies (Attack: 7, Defense: 5)',
      'Carrier Strike Group: 16 prod + 2 uranium + 6 oil = 4 armies (Attack: 6, Defense: 8, naval screening bonus)',
      'Expeditionary Air Wing: 14 prod + 4 intel + 4 oil + 2 rare earths = 3 armies (Attack: 8, Defense: 4, air superiority bonus)',
      'Border Conflict: Attack neighboring lands with strength-based combat resolution',
      'Conquest: Eliminate all defender\'s armies to take the territory',
      'Army Movement: Move armies between your own adjacent territories'
    ],
    tips: [
      'Attack neutral territories first (arctic_circle, atlantic_corridor)',
      'Requires 2:1 army advantage for safe victory',
      'Always leave at least 1 army in source territory',
      'Air units amplify strike strength when concentrated',
      'Naval groups increase defensive staying power',
      'Conquered territories provide production bonus and strategic resources',
      'Combine conventional and nuclear weapons for maximum effect'
    ],
    relatedTopics: ['military-units', 'territory-control', 'combat-system', 'reinforcements', 'victory-economic'],
    unlockTurn: 11
  },
  {
    id: 'territory-control',
    title: 'Territory Control',
    category: 'conventional',
    icon: <Globe className="h-5 w-5" />,
    summary: 'Conquer and control territories by eliminating the defender\'s armies.',
    details: 'The game has 8 global territories in Risk-style. Each territory has armies, neighbors, strategic value, and production bonus. You conquer territories by attacking neighbors and surpassing their combat strength. Conquered territories provide production bonus, strategic resources, and reinforcements each turn.',
    mechanics: [
      '8 territories: north_america, eastern_bloc, indo_pacific, southern_front, equatorial_belt, proxy_middle_east, arctic_circle, atlantic_corridor',
      'Neighbors: Only adjacent territories can be attacked',
      'Armies: Numerical strength in each territory (from units)',
      'Production Bonus: +2-4 production per turn from controlled territories',
      'Strategic Value: 2-5 (affects AI priorities)',
      'Conquest: Eliminate all defender\'s armies in Border Conflict',
      'Ownership change: Conquered territories switch controllingNationId',
      'Diplomatic consequences: -25 relation with defender, -15 with allies'
    ],
    tips: [
      'Start with neutral territories (arctic_circle, atlantic_corridor)',
      'Check neighbor map before attacking',
      'Prioritize territories with high production bonus',
      'Complete regions for region bonuses (+2-3 armies per turn)',
      'Keep at least 1 army in each territory for defense',
      'Conquest lowers your Readiness by 8 (victory) or 15 (defeat)',
      'Plan conquest route for continent bonus'
    ],
    relatedTopics: ['conventional-warfare', 'combat-system', 'reinforcements', 'strategic-resources-territories', 'victory-economic'],
    unlockTurn: 11
  },
  {
    id: 'military-units',
    title: 'Military Units',
    category: 'conventional',
    icon: <Sword className="h-5 w-5" />,
    summary: 'Three types of conventional units: Armored Corps, Carrier Strike Groups, and Expeditionary Air Wings.',
    details: 'Military units are deployed as "armies" to territories. Each unit type has unique cost, army strength, and combat bonuses. Units require strategic resources (oil, uranium, rare earths) in addition to production.',
    mechanics: [
      'ARMORED CORPS (army): 12 prod + 5 oil → 5 armies',
      '  Attack: 7, Defense: 5',
      '  Standard land-based force',
      'CARRIER STRIKE GROUP (navy): 16 prod + 2 uranium + 6 oil → 4 armies',
      '  Attack: 6, Defense: 8',
      '  Bonus: Fleet screens add defensive strength when grouped',
      '  Strength in sea territories',
      'EXPEDITIONARY AIR WING (air): 14 prod + 4 intel + 4 oil + 2 rare earths → 3 armies',
      '  Attack: 8, Defense: 4',
      '  Bonus: Air superiority adds strike strength scaling with wings',
      '  Highest attack value',
      'Unit Composition: Armies count proportional unit type',
      'Strategic Resources: Requires oil, uranium, rare earths from territories'
    ],
    tips: [
      'Armored Corps = best cost/army ratio (5 armies)',
      'Air Wings = best attack value (Attack 8 + bonus)',
      'Carrier Groups = best defense (Defense 8 + bonus)',
      'Combine unit types for balanced strength',
      'Air Wings provide strike strength bonuses in combat',
      'Navy provides defensive strength bonuses in combat',
      'Require strategic resources - conquer resource territories first'
    ],
    relatedTopics: ['conventional-warfare', 'combat-system', 'strategic-resources-territories'],
    unlockTurn: 11
  },
  {
    id: 'combat-system',
    title: 'Combat System (Strength-Based)',
    category: 'conventional',
    icon: <Target className="h-5 w-5" />,
    summary: 'Border Conflicts resolve through deterministic strength comparisons.',
    details: 'When you attack a neighboring land, both sides compute combat strength from armies, deployed templates, and supply multipliers. Outcomes are determined by the strength margin rather than random dice rolls.',
    mechanics: [
      'STRENGTH BUILDUP:',
      '  Base strength = armies × 10 with modifiers from unit templates, readiness, and supply.',
      '  Air units raise attacker strength; naval groups reinforce defensive strength.',
      'OUTCOMES:',
      '  Attacker breakthrough: Attacker strength ≥ 125% of defender strength.',
      '  Defender hold: Defender strength ≥ 120% of attacker strength.',
      '  Stalemate: Strengths within ±20% trigger mutual attrition without territory change.',
      'LOSSES:',
      '  Casualties scale with opposing strength and supply posture.',
      '  Victors keep surviving armies in the contested territory.',
      'SUPPLY MODIFIERS:',
      '  Territory supply multipliers directly scale final strength values.',
    ],
    tips: [
      'Aim for at least a 25% strength edge before attacking.',
      'Stack air power to spike offensive strength.',
      'Maintain naval coverage to harden defensive positions.',
      'Check supply multipliers—poor logistics can flip outcomes.',
      'Stalemates still drain armies; rotate formations if parity persists.',
      'Readiness losses vary by outcome (lighter on victories).'
    ],
    relatedTopics: ['conventional-warfare', 'military-units', 'territory-control'],
    unlockTurn: 11
  },
  {
    id: 'reinforcements',
    title: 'Reinforcement System',
    category: 'conventional',
    icon: <Shield className="h-5 w-5" />,
    summary: 'Receive free armies each turn based on number of territories you control.',
    details: 'Like Risk mechanics: You receive reinforcements based on territory count divided by 3, plus region bonuses if you control entire regions. Reinforcements can be placed in any controlled territory.',
    mechanics: [
      'CALCULATION:',
      '  Base reinforcements = Math.max(3, territories / 3)',
      '  Minimum = 3 armies even with 1 territory',
      '  Example: 6 territories = Math.max(3, 6/3) = 3 armies',
      'REGION BONUSES (if controlling all territories in region):',
      '  Western Hemisphere: +2 armies',
      '  Europe & Siberia: +3 armies',
      '  Pacific: +2 armies',
      '  Atlantic: +1 army',
      '  Arctic: +1 army',
      'PLACEMENT:',
      '  Choose which territory armies are placed in',
      '  Can be distributed across multiple territories',
      '  Strengthens defense or prepares attack'
    ],
    tips: [
      'Prioritize completing regions for bonuses',
      'Place reinforcements strategically (border areas)',
      'More territories = more armies per turn',
      '3 territories = 3 armies, 6 territories = 3 armies (same!)',
      '9 territories = 4 armies (breakpoint)',
      'Region bonuses provide significant advantage',
      'Combine with produced units for rapid expansion'
    ],
    relatedTopics: ['territory-control', 'conventional-warfare'],
    unlockTurn: 11
  },
  {
    id: 'strategic-resources-territories',
    title: 'Strategic Resources from Territories',
    category: 'conventional',
    icon: <Factory className="h-5 w-5" />,
    summary: 'Territories provide production bonus and strategic resources (oil, uranium, rare earths, intel).',
    details: 'Controlled territories generate resources each turn. Production bonus increases your production rate. Strategic resources (oil, uranium, rare earths, intel) are required to build advanced military units. Conquering resource-rich territories is critical for military development.',
    mechanics: [
      'PRODUCTION BONUS: +2-4 production per turn from each territory',
      'STRATEGIC RESOURCES per territory:',
      '  Oil: Required for Armored Corps (5) and Carrier Groups (6)',
      '  Uranium: Required for Carrier Groups (2)',
      '  Rare Earths: Required for Air Wings (2)',
      '  Intel: Required for Air Wings (4)',
      'RESOURCE ACCUMULATION:',
      '  Resources accumulate each turn',
      '  Can be stored for future units',
      '  Missing resource = cannot build unit',
      'CONQUEST EFFECT:',
      '  Immediate access to territory\'s resources',
      '  Increased production capacity',
      '  Can lock enemies out of critical resources'
    ],
    tips: [
      'Identify which territories have which resources',
      'Prioritize oil territories early (required for most units)',
      'Rare earths and intel required for Air Wings - conquer these for air dominance',
      'Control resource chokepoints to block enemies',
      'Production bonus accumulates - more territories = more production',
      'Strategic resources provide military flexibility',
      'Loss of resource territory can cripple military production'
    ],
    relatedTopics: ['territory-control', 'military-units', 'conventional-warfare'],
    unlockTurn: 11
  },

  // CYBER WARFARE
  {
    id: 'cyber-warfare',
    title: 'Cyber Warfare',
    category: 'cyber',
    icon: <Network className="h-5 w-5" />,
    summary: 'Digital attacks to steal data, sabotage infrastructure, and mislead enemies.',
    details: 'From turn 11, you can conduct cyber attacks. These are cheaper than military attacks but have their own risks.',
    mechanics: [
      'Intrusion: Steal data and secrets',
      'Sabotage: Destroy infrastructure',
      'False-flag: Blame other nations',
      'Detection: 40-70% chance of being detected',
      'Attribution: Enemies can trace attacks back'
    ],
    tips: [
      'Cyber attacks are cheaper than military attacks',
      'False-flag can start wars between others',
      'Invest in cyber defense',
      'Combine with conventional warfare'
    ],
    relatedTopics: ['research-cyber', 'intelligence'],
    unlockTurn: 11
  },

  // BIO-WARFARE
  {
    id: 'bio-warfare',
    title: 'Biological Warfare',
    category: 'bio',
    icon: <Biohazard className="h-5 w-5" />,
    summary: 'Develop and deploy biological weapons to destroy enemy nations.',
    details: 'From turn 26, you can research biological weapons in Plague Inc. style. Develop pathogens, evolve symptoms, and deploy against enemies.',
    mechanics: [
      'Plague types: Bacteria, Virus, Fungus, Parasite, Prion, Nano-virus, Bio-weapon',
      'DNA Points: Currency to buy evolutions',
      'Transmission: Air, water, blood, insect, bird, rodent',
      'Symptoms: Mild to lethal severity',
      'Abilities: Resistance, genetic hardening',
      'Deployment: Multi-nation deployment with attribution'
    ],
    tips: [
      'Start with Bacteria - easiest to use',
      'Evolve transmission early for spread',
      'Avoid lethal symptoms early - it draws attention',
      'False-flag deployment can hide your role',
      'Combine with conventional and nuclear weapons'
    ],
    relatedTopics: ['plague-types', 'evolution-tree', 'dna-points'],
    unlockTurn: 26
  },
  {
    id: 'plague-types',
    title: 'Plague Types',
    category: 'bio',
    icon: <Biohazard className="h-5 w-5" />,
    summary: 'Seven types of biological weapons, each with unique properties.',
    details: 'Each plague type has its own strengths, weaknesses, and evolution patterns.',
    mechanics: [
      'Bacteria: Balanced, easy to use, good for beginners',
      'Virus: Rapid mutation, harder to control',
      'Fungus: Slow spread, but difficult to cure',
      'Parasite: Subtle, harder to detect',
      'Prion: Extreme slowness, nearly impossible to cure',
      'Nano-virus: Fast but unstable, requires constant evolution',
      'Bio-weapon: Most lethal, but draws massive attention'
    ],
    tips: [
      'Start with Bacteria to learn the system',
      'Virus is best for rapid elimination',
      'Prion is best for stealth approach',
      'Bio-weapon for total annihilation'
    ],
    relatedTopics: ['bio-warfare', 'evolution-tree'],
    unlockTurn: 26
  },
  {
    id: 'evolution-tree',
    title: 'Evolution Tree',
    category: 'bio',
    icon: <Radio className="h-5 w-5" />,
    summary: 'Develop your biological weapons with transmission, symptoms, and abilities.',
    details: 'Use DNA Points to buy evolutions in three categories: Transmission, Symptoms, and Abilities.',
    mechanics: [
      'Transmission: How the pathogen spreads (air, water, insect, etc.)',
      'Symptoms: Effects on infected (mild to lethal)',
      'Abilities: Resistance and defensive capabilities',
      'DNA Points: Earned by infection and spread',
      'Evolution cost: Increases with each level'
    ],
    tips: [
      'Prioritize transmission early',
      'Wait for lethal symptoms until widespread',
      'Abilities protect against countermeasures',
      'Balance spread and lethality'
    ],
    relatedTopics: ['bio-warfare', 'dna-points', 'plague-types'],
    unlockTurn: 26
  },
  {
    id: 'dna-points',
    title: 'DNA Points',
    category: 'bio',
    icon: <Target className="h-5 w-5" />,
    summary: 'Currency to buy evolutions in biological weapons.',
    details: 'DNA Points are earned by infecting people, spreading the pathogen, and reaching milestones.',
    mechanics: [
      'Earn: 1-5 DNA per infection',
      'Bonus: First infection in new country',
      'Milestones: 100, 1000, 10000 infections',
      'Cost: Evolutions cost 5-50 DNA',
      'Cannot be refunded - choose wisely'
    ],
    tips: [
      'Spread to many countries for bonuses',
      'Save DNA for critical evolutions',
      'Evolve transmission early for more DNA',
      'Plan your evolution path'
    ],
    relatedTopics: ['bio-warfare', 'evolution-tree'],
    unlockTurn: 26
  },

  // PANDEMIC SYSTEM
  {
    id: 'pandemic',
    title: 'Pandemic System',
    category: 'pandemic',
    icon: <Biohazard className="h-5 w-5" />,
    summary: 'Global diseases can spread naturally or as weapons.',
    details: 'Pandemics can occur naturally or as a result of bio-weapons. They affect population, production, and stability.',
    mechanics: [
      'Natural pandemics: Random spread',
      'Weaponized pandemics: Deliberate deployment',
      'Spread: Country to country based on trade and travel',
      'Mutation: Diseases can mutate',
      'Countermeasures: Vaccines, quarantines, research'
    ],
    tips: [
      'Pandemics can destroy enemy economy',
      'Protect your own population with countermeasures',
      'Natural pandemics are unpredictable',
      'Vaccine research takes time - start early'
    ],
    relatedTopics: ['bio-warfare', 'governance'],
    unlockTurn: 20
  },

  // GOVERNANCE
  {
    id: 'governance',
    title: 'Governance and Morale',
    category: 'governance',
    icon: <Vote className="h-5 w-5" />,
    summary: 'Manage your nation through elections, opinion, and stability.',
    details: 'Your population reacts to your actions. Low morale can lead to regime change and game over.',
    mechanics: [
      'Morale: 0-100 population satisfaction',
      'Elections: Every 12 turns',
      'Cabinet approval: Government support',
      'Regime change: If morale < 30',
      'Immigration: Affected by living conditions'
    ],
    tips: [
      'Keep morale above 50 for stability',
      'Aggressive actions lower morale',
      'Defend population to increase morale',
      'Elections can remove you from power'
    ],
    relatedTopics: ['elections', 'stability'],
    unlockTurn: 1
  },
  {
    id: 'elections',
    title: 'Elections',
    category: 'governance',
    icon: <Vote className="h-5 w-5" />,
    summary: 'Democratic nations hold elections every 12 turns.',
    details: 'If your popularity is too low, you can lose the election and game over.',
    mechanics: [
      'Frequency: Every 12 turns',
      'Threshold: >40% approval to win',
      'Affected by: Morale, military losses, economic success',
      'Consequence: Loss = game over',
      'Avoidance: High morale and success'
    ],
    tips: [
      'Monitor approval ratings',
      'Avoid major losses before elections',
      'Diplomatic victories increase popularity',
      'Protect the population'
    ],
    relatedTopics: ['governance', 'stability'],
    unlockTurn: 12
  },

  // INTELLIGENCE
  {
    id: 'intelligence',
    title: 'Intelligence and Espionage',
    category: 'intelligence',
    icon: <Eye className="h-5 w-5" />,
    summary: 'Monitor enemies, sabotage production, and steal secrets.',
    details: 'Intel operations give you information about enemy plans and can weaken their capacity.',
    mechanics: [
      'Surveillance: Reveal enemy plans',
      'Satellites: Permanent surveillance',
      'Sabotage: Reduce enemy production',
      'Counterintelligence: Protect against espionage',
      'Cost: 20-80 Intel per operation'
    ],
    tips: [
      'Monitor biggest threat',
      'Satellites provide continuous info',
      'Sabotage before major attacks',
      'Counterintelligence protects you'
    ],
    relatedTopics: ['satellites', 'cyber-warfare'],
    unlockTurn: 1
  },
  {
    id: 'satellites',
    title: 'Spy Satellites',
    category: 'intelligence',
    icon: <Satellite className="h-5 w-5" />,
    summary: 'Satellites provide permanent surveillance of enemy nations.',
    details: 'When a satellite is in orbit, you get continuous information about the target nation.',
    mechanics: [
      'Cost: 40 Intel',
      'Surveillance: Permanent until satellite is destroyed',
      'Information: Military strength, resources, plans',
      'Can be destroyed: Enemy can shoot down satellites',
      'Multiple deployment: Monitor multiple nations'
    ],
    tips: [
      'Deploy satellites early',
      'Monitor biggest threats',
      'Replace if destroyed',
      'Combine with other intel operations'
    ],
    relatedTopics: ['intelligence', 'research-system'],
    unlockTurn: 8
  },

  // VICTORY CONDITIONS - STREAMLINED (4 PATHS)
  {
    id: 'victory-diplomatic',
    title: 'Diplomatic Victory',
    category: 'victory',
    icon: <Trophy className="h-5 w-5" />,
    summary: 'Win through diplomacy and peace.',
    details: 'Form alliances with 60% of living nations and maintain peace for 5 turns.',
    mechanics: [
      'Requires: Allied with 60% of living nations',
      'DEFCON: ≥4 for 5+ consecutive turns',
      'Earliest: Turn 5',
      'Bonus: Peaceful victory without military losses'
    ],
    tips: [
      'Form alliances early and often',
      'Avoid aggression - keep DEFCON high',
      'Build trust with all nations',
      'Most peaceful victory path'
    ],
    relatedTopics: ['diplomacy', 'alliances', 'trust-system'],
    unlockTurn: 1
  },
  {
    id: 'victory-domination',
    title: 'Total Domination',
    category: 'victory',
    icon: <Skull className="h-5 w-5" />,
    summary: 'Eliminate all rival nations.',
    details: 'Defeat all enemies through military power - nuclear weapons, conventional forces, or bio-weapons.',
    mechanics: [
      'Requires: Elimination of all enemies',
      'Methods: Nuclear weapons, conventional warfare, bio-weapons',
      'No time limit',
      'Hardest: High risk of retaliation',
      'Consequence: Massive casualties'
    ],
    tips: [
      'Build strong defense first',
      'Eliminate weakest enemies first',
      'Combine attack methods',
      'Expect massive retaliatory attacks'
    ],
    relatedTopics: ['icbms', 'conventional-warfare', 'bio-warfare'],
    unlockTurn: 1
  },
  {
    id: 'victory-economic',
    title: 'Economic Victory',
    category: 'victory',
    icon: <Factory className="h-5 w-5" />,
    summary: 'Dominate globally through economic power.',
    details: 'Control 10+ cities and maintain 200+ production per turn.',
    mechanics: [
      'Requires: Control over 10+ cities',
      'Production: ≥200 per turn',
      'Earliest: Turn 10',
      'Bonus: Can be achieved with or without war'
    ],
    tips: [
      'Use conventional forces for conquest',
      'Prioritize city conquest',
      'Build factories for production',
      'Protect your economic interests'
    ],
    relatedTopics: ['conventional-warfare', 'territory-control'],
    unlockTurn: 1
  },
  {
    id: 'victory-survival',
    title: 'Survival Victory',
    category: 'victory',
    icon: <Shield className="h-5 w-5" />,
    summary: 'Survive 50 turns with 50M+ population.',
    details: 'Simplest victory condition - just survive and protect the population.',
    mechanics: [
      'Requires: Survive until turn 50',
      'Population: ≥50 million',
      'No other requirements',
      'Bonus: Can be achieved passively'
    ],
    tips: [
      'Focus on defense',
      'Avoid conflicts when possible',
      'Protect the population',
      'Build bunkers and defense systems'
    ],
    relatedTopics: ['missile-defense', 'governance'],
    unlockTurn: 1
  },

  // GREAT OLD ONES (BONUS CAMPAIGN)
  {
    id: 'great-old-ones',
    title: 'Great Old Ones Campaign',
    category: 'special',
    icon: <Eye className="h-5 w-5" />,
    summary: 'Alternative campaign with Lovecraftian horror theme.',
    details: 'Play as a cult trying to bring back the Great Old Ones. Completely different gameplay with unique mechanics.',
    mechanics: [
      'Three doctrines: Domination, Corruption, Convergence',
      'Sanity harvesting: Harvest madness from the population',
      'Veil integrity: How well you hide yourself',
      'Ritual sites: Designate locations for rituals',
      'Investigator spawning: Opponents that must be handled',
      'Summoning: Call forth entities and monsters'
    ],
    tips: [
      'Completely different experience from main campaign',
      'Focus on stealth and subversion',
      'Balance Veil integrity - don\'t get detected',
      'Each doctrine has unique playstyle'
    ],
    relatedTopics: [],
    unlockTurn: 1
  },

  {
    id: 'strategic-outliner',
    title: 'Strategic Outliner & Macro Commands',
    category: 'strategy',
    icon: <Sparkles className="h-5 w-5" />,
    summary: 'Neon panel that groups production, diplomacy, and crisis alerts in real-time.',
    details:
      'The Outliner provides a compressed overview of the nation\'s macro-level status: military readiness, resource pools, DEFCON, ' +
      'ongoing governance events, and global crises. The panel blinks at critical events and mirrors cooperative macro-locks ' +
      'so you know which actions are blocked.',
    mechanics: [
      'Toggle with O – Shift+O opens and focuses the panel immediately.',
      'Production & Military shows readiness, available MACROS (BUILD/RESEARCH), and latest battle log.',
      'Diplomacy & Governance tracks DEFCON, morale/opinion, government crises, and status of DIPLOMACY/CULTURE macros.',
      'Intelligence & Crisis highlights active flashpoints, pandemic progress, and whether INTEL/BIO macros are ready.',
      'Critical cards pulse red to signal high-priority action.',
    ],
    tips: [
      'Use Shift+O when news blinks to jump directly to the panel.',
      'Coordinate with Approval Queue if a macro is locked – the outliner shows which roles are holding back.',
      'Watch resource entries: low production combined with red readiness card means you should rest or reinforce.',
    ],
    relatedTopics: ['defcon', 'resources', 'governance'],
  },

  // ADVANCED TIPS
  {
    id: 'advanced-strategy',
    title: 'Advanced Strategy',
    category: 'strategy',
    icon: <Target className="h-5 w-5" />,
    summary: 'Advanced tips for experienced players.',
    details: 'Mastery tips to dominate the game.',
    mechanics: [
      'Action economy: Maximize actions per turn',
      'Timing: When to attack and when to wait',
      'Diplomacy chains: Influence multiple nations simultaneously',
      'False-flag ops: Get enemies to fight each other',
      'Resource management: Optimal resource usage',
      'Tech timing: When to research what'
    ],
    tips: [
      'Combine multiple attack types simultaneously',
      'Use false-flag cyber attacks to start wars',
      'Build defense before attacking',
      'Plan 5-10 turns ahead',
      'Combine diplomatic and military strategies'
    ],
    relatedTopics: [],
    unlockTurn: 1
  }
];

const CATEGORIES = [
  { id: 'basics', label: 'Basics', icon: <Target className="h-4 w-4" /> },
  { id: 'nuclear', label: 'Nuclear Weapons', icon: <Skull className="h-4 w-4" /> },
  { id: 'defense', label: 'Defense', icon: <Shield className="h-4 w-4" /> },
  { id: 'research', label: 'Research', icon: <Radio className="h-4 w-4" /> },
  { id: 'diplomacy', label: 'Diplomacy', icon: <Users className="h-4 w-4" /> },
  { id: 'conventional', label: 'Conventional Warfare', icon: <Sword className="h-4 w-4" /> },
  { id: 'cyber', label: 'Cyber Warfare', icon: <Network className="h-4 w-4" /> },
  { id: 'bio', label: 'Bio-Warfare', icon: <Biohazard className="h-4 w-4" /> },
  { id: 'pandemic', label: 'Pandemics', icon: <Biohazard className="h-4 w-4" /> },
  { id: 'governance', label: 'Governance', icon: <Vote className="h-4 w-4" /> },
  { id: 'intelligence', label: 'Intelligence', icon: <Eye className="h-4 w-4" /> },
  { id: 'victory', label: 'Victory Conditions', icon: <Trophy className="h-4 w-4" /> },
  { id: 'special', label: 'Special Modes', icon: <Flame className="h-4 w-4" /> },
  { id: 'strategy', label: 'Strategy', icon: <Target className="h-4 w-4" /> },
];

interface GameDatabaseProps {
  open: boolean;
  onClose: () => void;
  currentTurn?: number;
}

export function GameDatabase({ open, onClose, currentTurn = 1 }: GameDatabaseProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedEntry, setSelectedEntry] = useState<DatabaseEntry | null>(null);

  // Filter entries based on search and category
  const filteredEntries = DATABASE_ENTRIES.filter(entry => {
    const matchesSearch = searchQuery === '' ||
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.details.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || entry.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Group entries by category
  const entriesByCategory = filteredEntries.reduce((acc, entry) => {
    if (!acc[entry.category]) {
      acc[entry.category] = [];
    }
    acc[entry.category].push(entry);
    return acc;
  }, {} as Record<string, DatabaseEntry[]>);

  const handleEntryClick = (entry: DatabaseEntry) => {
    setSelectedEntry(entry);
  };

  const handleBackToList = () => {
    setSelectedEntry(null);
  };

  // Check if entry is locked
  const isLocked = (entry: DatabaseEntry) => {
    return entry.unlockTurn !== undefined && currentTurn < entry.unlockTurn;
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto p-0">
        {!selectedEntry ? (
          // List view
          <div className="flex flex-col h-full">
            <SheetHeader className="p-6 pb-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-6 w-6 text-primary" />
                  <div>
                    <SheetTitle className="text-2xl">Game Database</SheetTitle>
                    <SheetDescription className="mt-1">
                      Complete reference for all game mechanics and systems
                    </SheetDescription>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Search */}
              <div className="mt-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search for mechanics, weapons, strategies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </SheetHeader>

            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="flex-1 flex flex-col">
              <div className="border-b px-6 overflow-x-auto">
                <TabsList className="inline-flex w-auto gap-2 bg-transparent p-0 h-auto">
                  <TabsTrigger
                    value="all"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                  >
                    All
                  </TabsTrigger>
                  {CATEGORIES.map(cat => (
                    <TabsTrigger
                      key={cat.id}
                      value={cat.id}
                      className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none whitespace-nowrap"
                    >
                      <span className="mr-2">{cat.icon}</span>
                      {cat.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {selectedCategory === 'all' ? (
                  // Show all categories
                  <div className="space-y-6">
                    {CATEGORIES.filter(cat => entriesByCategory[cat.id]?.length > 0).map(cat => (
                      <div key={cat.id}>
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          {cat.icon}
                          {cat.label}
                        </h3>
                        <div className="grid gap-3">
                          {entriesByCategory[cat.id].map(entry => (
                            <button
                              key={entry.id}
                              onClick={() => handleEntryClick(entry)}
                              className="text-left p-4 rounded-lg border border-border hover:bg-accent transition-colors group"
                              disabled={isLocked(entry)}
                            >
                              <div className="flex items-start gap-3">
                                <div className="text-primary mt-0.5">
                                  {isLocked(entry) ? <Lock className="h-5 w-5" /> : entry.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold group-hover:text-primary transition-colors">
                                      {entry.title}
                                    </h4>
                                    {isLocked(entry) && (
                                      <Badge variant="outline" className="text-xs">
                                        Unlocks turn {entry.unlockTurn}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {isLocked(entry) ? 'This feature is not unlocked yet.' : entry.summary}
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    {filteredEntries.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No results found</p>
                        <p className="text-sm mt-1">Try a different search or category</p>
                      </div>
                    )}
                  </div>
                ) : (
                  // Show single category
                  <div className="grid gap-3">
                    {filteredEntries.map(entry => (
                      <button
                        key={entry.id}
                        onClick={() => handleEntryClick(entry)}
                        className="text-left p-4 rounded-lg border border-border hover:bg-accent transition-colors group"
                        disabled={isLocked(entry)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-primary mt-0.5">
                            {isLocked(entry) ? <Lock className="h-5 w-5" /> : entry.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold group-hover:text-primary transition-colors">
                                {entry.title}
                              </h4>
                              {isLocked(entry) && (
                                <Badge variant="outline" className="text-xs">
                                  Unlocks turn {entry.unlockTurn}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {isLocked(entry) ? 'This feature is not unlocked yet.' : entry.summary}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                    {filteredEntries.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No entries in this category</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Tabs>
          </div>
        ) : (
          // Detail view
          <div className="flex flex-col h-full">
            <SheetHeader className="p-6 pb-4 border-b">
              <div className="flex items-start gap-4">
                <Button variant="ghost" size="icon" onClick={handleBackToList}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-primary">
                      {isLocked(selectedEntry) ? <Lock className="h-6 w-6" /> : selectedEntry.icon}
                    </div>
                    <SheetTitle className="text-2xl">{selectedEntry.title}</SheetTitle>
                  </div>
                  {isLocked(selectedEntry) && (
                    <Badge variant="outline" className="mb-2">
                      <Lock className="h-3 w-3 mr-1" />
                      Unlocks turn {selectedEntry.unlockTurn}
                    </Badge>
                  )}
                  <SheetDescription>{selectedEntry.summary}</SheetDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {!isLocked(selectedEntry) ? (
                <>
                  {/* Details */}
                  <div>
                    <h3 className="font-semibold text-sm uppercase tracking-wide opacity-70 mb-2">
                      Details
                    </h3>
                    <p className="text-sm leading-relaxed">{selectedEntry.details}</p>
                  </div>

                  {/* Mechanics */}
                  {selectedEntry.mechanics && selectedEntry.mechanics.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-sm uppercase tracking-wide opacity-70 mb-2">
                        Mechanics
                      </h3>
                      <ul className="space-y-2">
                        {selectedEntry.mechanics.map((mechanic, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <span className="text-primary mt-1">▸</span>
                            <span>{mechanic}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Tips */}
                  {selectedEntry.tips && selectedEntry.tips.length > 0 && (
                    <div className="bg-muted p-4 rounded-lg">
                      <h3 className="font-semibold text-sm uppercase tracking-wide flex items-center gap-2 mb-3">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        Strategic Tips
                      </h3>
                      <ul className="space-y-2">
                        {selectedEntry.tips.map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <span className="text-primary mt-1">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Related Topics */}
                  {selectedEntry.relatedTopics && selectedEntry.relatedTopics.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-sm uppercase tracking-wide opacity-70 mb-2">
                        Related Topics
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedEntry.relatedTopics.map(topicId => {
                          const relatedEntry = DATABASE_ENTRIES.find(e => e.id === topicId);
                          if (!relatedEntry) return null;
                          return (
                            <Button
                              key={topicId}
                              variant="outline"
                              size="sm"
                              onClick={() => handleEntryClick(relatedEntry)}
                              className="gap-2"
                              disabled={isLocked(relatedEntry)}
                            >
                              {isLocked(relatedEntry) ? (
                                <Lock className="h-3 w-3" />
                              ) : (
                                relatedEntry.icon
                              )}
                              {relatedEntry.title}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Lock className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold mb-2">Feature Locked</p>
                  <p>This feature unlocks in turn {selectedEntry.unlockTurn}.</p>
                  <p className="text-sm mt-1">Current turn: {currentTurn}</p>
                </div>
              )}
            </div>

            <div className="border-t p-4">
              <Button variant="outline" onClick={handleBackToList} className="w-full">
                Back to overview
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
