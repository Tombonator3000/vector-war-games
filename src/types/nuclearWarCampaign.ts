/**
 * Nuclear War Campaign Mode Types
 *
 * A humorous last-man-standing nuclear warfare campaign inspired by the
 * Nuclear War card game. Start at DEFCON 2, nuke everything, be the last survivor.
 *
 * Features dark humor, ridiculous achievements, and absurd statistics tracking.
 */

export interface NuclearWarAchievement {
  id: string;
  name: string;
  description: string;
  unlockedTurn?: number;
  icon: string;
}

export interface NukeStatistics {
  /** Total nukes launched by this nation */
  nukesLaunched: number;
  /** Total nukes that hit their targets */
  nukesLanded: number;
  /** Total population eliminated by nukes */
  casualtiesCaused: number;
  /** Total cities destroyed */
  citiesDestroyed: number;
  /** Nations eliminated (reduced to 0 population) */
  nationsEliminated: string[];
  /** Warheads stockpiled (highest count reached) */
  peakWarheadCount: number;
  /** Number of retaliatory strikes survived */
  retaliationsSurvived: number;
  /** Overkill score (excess damage beyond needed) */
  overkillScore: number;
}

export interface NuclearWarNationState {
  /** Nation ID */
  nationId: string;
  /** Statistics for this nation */
  stats: NukeStatistics;
  /** Achievements unlocked */
  achievements: NuclearWarAchievement[];
  /** Nuclear Supremacy Score (main scoring metric) */
  supremacyScore: number;
  /** Is this nation eliminated? */
  isEliminated: boolean;
  /** Turn when eliminated (if applicable) */
  eliminatedOnTurn?: number;
  /** Last words when eliminated */
  lastWords?: string;
  /** Propaganda slogans collected */
  propagandaSlogans: string[];
}

export type NuclearWarPhase = 
  | 'STOCKPILE'    // Draw warhead cards, build arsenal
  | 'TARGETING'    // Choose targets and delivery systems
  | 'LAUNCH'       // Simultaneous attacks
  | 'RETALIATION'  // Automatic retaliation
  | 'FALLOUT'      // Calculate damage and casualties
  | 'AFTERMATH';   // Check victory, update scores

export interface WarheadCard {
  id: string;
  name: string;
  megatons: number; // 5, 10, 15, 25, 50, 100 MT
  icon: string;
  description: string;
}

export interface DeliverySystem {
  id: string;
  type: 'ICBM' | 'Bomber' | 'Submarine' | 'Cruise';
  name: string;
  reliability: number; // 0.7-0.95 (hit probability)
  speed: 'Slow' | 'Medium' | 'Fast';
  interceptable: boolean;
  icon: string;
}

export interface SecretCard {
  id: string;
  name: string;
  type: 'Defense' | 'Counterattack' | 'Sabotage';
  description: string;
  usageLimit: 'once' | 'permanent';
  used: boolean;
}

export interface SpecialEventCard {
  id: string;
  name: string;
  type: 'Propaganda' | 'Mistake' | 'Peace' | 'Escalation' | 'Defense';
  effect: string;
  humorText: string;
  icon: string;
}

export interface NuclearWarHandState {
  nationId: string;
  warheadCards: WarheadCard[];
  deliverySystems: DeliverySystem[];
  populationCards: number; // Visible population cards
  secrets: SecretCard[];
}

export interface NuclearWarTurnPhases {
  currentPhase: NuclearWarPhase;
  actionsRemaining: Record<string, number>;
  simultaneousLaunches: Array<{
    attackerId: string;
    targetId: string;
    cards: WarheadCard[];
    deliverySystem: DeliverySystem;
  }>;
}

export interface NuclearWarCampaignState {
  /** Campaign active */
  isActive: boolean;
  /** Current round (escalation phase) */
  round: number;
  /** Total nukes launched globally */
  globalNukesLaunched: number;
  /** Global body count */
  globalCasualties: number;
  /** Nations remaining (not eliminated) */
  nationsRemaining: number;
  /** Per-nation tracking */
  nationStates: Record<string, NuclearWarNationState>;
  /** Global achievements unlocked */
  globalAchievements: NuclearWarAchievement[];
  /** Leaderboard (sorted by supremacy score) */
  leaderboard: Array<{ nationId: string; score: number; rank: number }>;
  /** Current propaganda message */
  currentPropaganda?: string;
  /** Doomsday clock (0-100, 100 = total annihilation) */
  doomsdayClock: number;
  /** Special events triggered */
  eventsTriggered: string[];
  /** Winner (if game ended) */
  winner?: string;
  /** Final statistics summary */
  finalStats?: {
    totalNukesLaunched: number;
    totalCasualties: number;
    nationsEliminated: number;
    turnsPlayed: number;
    mostDestructiveNation: string;
    luckyNation: string;
  };
  /** Card game mechanics */
  hands: Record<string, NuclearWarHandState>;
  deck: WarheadCard[];
  discardPile: WarheadCard[];
  populationDeck: number[];
  /** Game phases */
  phases: NuclearWarTurnPhases;
  /** Current special event */
  currentEvent?: SpecialEventCard;
}

/**
 * Warhead Card Definitions
 */
export const WARHEAD_CARDS: WarheadCard[] = [
  { id: 'w5', name: '5 Megaton', megatons: 5, icon: '💣', description: 'A gentle nudge' },
  { id: 'w10', name: '10 Megaton', megatons: 10, icon: '💥', description: 'City buster' },
  { id: 'w15', name: '15 Megaton', megatons: 15, icon: '☢️', description: 'Metropolitan destroyer' },
  { id: 'w25', name: '25 Megaton', megatons: 25, icon: '🔥', description: 'Regional annihilator' },
  { id: 'w50', name: '50 Megaton', megatons: 50, icon: '💀', description: 'Tsar Bomba lite' },
  { id: 'w100', name: '100 Megaton', megatons: 100, icon: '☠️', description: 'Civilization ender' },
];

/**
 * Delivery System Definitions
 */
export const DELIVERY_SYSTEMS: DeliverySystem[] = [
  { id: 'icbm', type: 'ICBM', name: 'ICBM', reliability: 0.90, speed: 'Fast', interceptable: true, icon: '🚀' },
  { id: 'bomber', type: 'Bomber', name: 'Strategic Bomber', reliability: 0.75, speed: 'Slow', interceptable: true, icon: '✈️' },
  { id: 'submarine', type: 'Submarine', name: 'SLBM', reliability: 0.95, speed: 'Medium', interceptable: false, icon: '🚢' },
  { id: 'cruise', type: 'Cruise', name: 'Cruise Missile', reliability: 0.80, speed: 'Medium', interceptable: true, icon: '🎯' },
];

/**
 * Secret Card Definitions
 */
export const SECRET_CARDS: SecretCard[] = [
  {
    id: 'antimissile',
    name: 'Anti-Missile System',
    type: 'Defense',
    description: 'Intercept one incoming attack completely',
    usageLimit: 'once',
    used: false
  },
  {
    id: 'spynetwork',
    name: 'Spy Network',
    type: 'Sabotage',
    description: 'See opponent hand and steal one warhead',
    usageLimit: 'once',
    used: false
  },
  {
    id: 'doomsday',
    name: 'Doomsday Device',
    type: 'Counterattack',
    description: 'If eliminated, launch all remaining warheads at all survivors',
    usageLimit: 'permanent',
    used: false
  },
];

/**
 * Special Event Card Definitions
 */
export const SPECIAL_EVENTS: SpecialEventCard[] = [
  {
    id: 'propaganda',
    name: 'Propaganda!',
    type: 'Propaganda',
    effect: 'All nations draw 2 extra warhead cards',
    humorText: 'The military-industrial complex thanks you for your business!',
    icon: '📢'
  },
  {
    id: 'mistake',
    name: 'Oops!',
    type: 'Mistake',
    effect: 'Your missiles launch at a random target',
    humorText: 'Sorry, Bob from accounting pressed the wrong button',
    icon: '🤦'
  },
  {
    id: 'peace',
    name: 'Peace Conference',
    type: 'Peace',
    effect: 'No attacks this turn... just kidding, mandatory double attacks!',
    humorText: 'Peace was never an option',
    icon: '🕊️'
  },
  {
    id: 'finale',
    name: 'The Final Epidemic',
    type: 'Escalation',
    effect: 'Population loss doubled for everyone',
    humorText: 'Turns out nuclear winter has side effects',
    icon: '🦠'
  },
];

/**
 * Pre-defined achievements for Nuclear War campaign
 */
export const NUCLEAR_WAR_ACHIEVEMENTS: Record<string, Omit<NuclearWarAchievement, 'unlockedTurn'>> = {
  firstBlood: {
    id: 'firstBlood',
    name: 'First Blood',
    description: 'Launch the first nuclear strike of the campaign',
    icon: '🎯',
  },
  massDestruction: {
    id: 'massDestruction',
    name: 'Mass Destruction',
    description: 'Eliminate over 10 million people in a single strike',
    icon: '💀',
  },
  cityBuster: {
    id: 'cityBuster',
    name: 'City Buster',
    description: 'Destroy 3 cities in one turn',
    icon: '🏚️',
  },
  overkillKing: {
    id: 'overkillKing',
    name: 'Overkill King',
    description: 'Use 5x more warheads than needed to eliminate a target',
    icon: '👑',
  },
  cockroachSurvivor: {
    id: 'cockroachSurvivor',
    name: 'Cockroach Survivor',
    description: 'Survive 5 retaliatory nuclear strikes',
    icon: '🪳',
  },
  nuclearHoarder: {
    id: 'nuclearHoarder',
    name: 'Nuclear Hoarder',
    description: 'Stockpile over 100 warheads',
    icon: '🗄️',
  },
  peaceWasNeverAnOption: {
    id: 'peaceWasNeverAnOption',
    name: 'Peace Was Never An Option',
    description: 'Launch nukes 3 turns in a row',
    icon: '🕊️',
  },
  lastManStanding: {
    id: 'lastManStanding',
    name: 'Last Man Standing',
    description: 'Be the only surviving nation',
    icon: '🏆',
  },
  mutuallyAssuredDestruction: {
    id: 'mutuallyAssuredDestruction',
    name: 'Mutually Assured Destruction',
    description: 'Eliminate a nation that eliminated you',
    icon: '🤝',
  },
  pyrrhicVictor: {
    id: 'pyrrhicVictor',
    name: 'Pyrrhic Victor',
    description: 'Win with less than 10% of original population',
    icon: '💔',
  },
  propagandaMaster: {
    id: 'propagandaMaster',
    name: 'Propaganda Master',
    description: 'Collect 10 different propaganda slogans',
    icon: '📢',
  },
  glassParking: {
    id: 'glassParking',
    name: 'Glass Parking Lot',
    description: 'Turn an entire nation into radioactive wasteland',
    icon: '🅿️',
  },
  nuclearSpree: {
    id: 'nuclearSpree',
    name: 'Nuclear Spree',
    description: 'Launch 10 nukes in a single game',
    icon: '🚀',
  },
  genocideEnthusiast: {
    id: 'genocideEnthusiast',
    name: 'Population Reduction Expert',
    description: 'Eliminate over 100 million people total',
    icon: '📉',
  },
  triggerHappy: {
    id: 'triggerHappy',
    name: 'Trigger Happy',
    description: 'Launch a nuke before turn 3',
    icon: '⚡',
  },
  cardShark: {
    id: 'cardShark',
    name: 'Card Shark',
    description: 'Hold 10+ warhead cards simultaneously',
    icon: '🦈',
  },
  fullHouse: {
    id: 'fullHouse',
    name: 'Full House',
    description: 'Have all 6 warhead types in hand at once',
    icon: '🏠',
  },
  chainSmokingCrater: {
    id: 'chainSmokingCrater',
    name: 'Chain Smoker',
    description: 'Trigger a 5+ nation chain reaction',
    icon: '⛓️',
  },
  secretAgent: {
    id: 'secretAgent',
    name: 'Secret Agent',
    description: 'Use all 3 secret cards in one game',
    icon: '🕵️',
  },
};

/**
 * Humorous propaganda slogans for the campaign
 */
export const PROPAGANDA_SLOGANS = [
  'Your radiation is showing!',
  'Duck and cover? More like duck and crispy!',
  'Warning: Side effects may include spontaneous vaporization',
  'Brought to you by: The Committee for Proactive Population Control',
  'Remember: A mushroom cloud a day keeps the enemy away!',
  'Ask not what your country can do for you, ask how many megatons it can deliver!',
  'Better dead than... wait, we\'re all dead.',
  'Join the Nuclear Family - Everyone glows together!',
  'Fallout: It\'s not a bug, it\'s a feature!',
  'Our missiles are bigger than their missiles!',
  'Peace through superior firepower™',
  'Warning: Objects in mushroom cloud are closer than they appear',
  'Nuclear winter is coming - bring a sweater!',
  'Sponsored by: The Survivors Will Envy The Dead Foundation',
  'Democracy delivered at 15,000 mph!',
  'Climate change solved! (With nuclear winter)',
  'Population problem? We have a solution!',
  'Make Earth Glow Again!',
  'Your tax dollars at work (literally)!',
  'Oops! All warheads!',
  'Draw a card, lose a nation!',
  'Collect them all... before they collect you!',
  'It\'s not gambling when everyone loses!',
  'Trade warheads with friends!',
  'Sorry, you have UNO - we have NUKES!',
  'Gotta nuke \'em all!',
  'Full House beats Full Country!',
  'All in! (And everyone\'s out)',
  'Dealer always wins... at mutually assured destruction',
  'High stakes poker, literally!',
];

/**
 * Last words for eliminated nations
 */
export const LAST_WORDS = [
  'Tell my missiles... I loved them...',
  'I should have built more bunkers...',
  'At least I went out with a bang!',
  'Remember me as I was... before the radiation...',
  'My only regret is not launching first...',
  'See you in the fallout shelter in the sky...',
  'I blame the intelligence reports...',
  'Should have invested in more defense systems...',
  'This is NOT what I meant by a balanced budget!',
  'Well, this escalated quickly...',
  'Wait, who launched that?!',
  'This wasn\'t even aimed at us!',
  'Caught in the crossfire... literally',
  'Was ONE nuke not enough?!',
  'You really didn\'t need to use ALL of those...',
  'Okay, we get it. You\'re compensating for something.',
  'I folded! Why am I still losing?!',
  'That\'s not how you play cards!',
  'I had a good hand too...',
  'Should have kept my secrets secret...',
];

/**
 * Victory announcements based on winning condition
 */
export const VICTORY_ANNOUNCEMENTS = {
  lastSurvivor: [
    'CONGRATULATIONS! You\'re the last one standing... in a radioactive wasteland!',
    'VICTORY! You win by the ancient tradition of "everyone else is dead"!',
    'YOU WIN! Population: minimal. Radiation: maximum. Pride: questionable.',
  ],
  mostPopulation: [
    'VICTORY! You have the most people left! They\'re probably irradiated, but still!',
    'WINNER! Your superior bunker technology paid off!',
    'CONGRATULATIONS! You won the "Most Survivors" award! Prize: a ruined planet!',
  ],
  supremacyScore: [
    'SUPREME VICTORY! Your nuclear supremacy is unmatched!',
    'TOTAL DOMINATION! You out-nuked them all!',
    'NUCLEAR CHAMPION! Your kill count is... impressive? Disturbing? Both?',
  ],
};
