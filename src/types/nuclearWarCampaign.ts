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
}

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
