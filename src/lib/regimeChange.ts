/**
 * Regime Change System
 *
 * Inspired by Hearts of Iron 4, Civilization 6, and Stellaris political upheaval mechanics.
 *
 * - AI nations with high instability and low approval can undergo regime changes
 * - New AI personality and leader assigned during upheaval
 * - Partial reset of governance metrics (unstable transition period)
 * - Military assets lost during transition
 * - News events announce regime changes to all players
 */

export type AIPersonality = 'balanced' | 'aggressive' | 'defensive' | 'trickster' | 'chaotic' | 'isolationist';

export interface RegimeChangeResult {
  occurred: boolean;
  oldPersonality?: AIPersonality;
  newPersonality?: AIPersonality;
  oldLeader?: string;
  newLeader?: string;
  militaryLosses?: number; // Percentage of military lost (0-1)
  newMetrics?: {
    morale: number;
    publicOpinion: number;
    cabinetApproval: number;
    instability: number;
    electionTimer: number;
  };
}

const AI_PERSONALITIES: AIPersonality[] = ['balanced', 'aggressive', 'defensive', 'trickster', 'chaotic', 'isolationist'];

// Leader name pools for generating new leaders during regime changes
const LEADER_TITLES = [
  'Premier', 'Chancellor', 'President', 'General', 'Commander', 'Director', 'Chairman',
  'Minister', 'Marshal', 'Leader', 'Chief', 'Governor', 'Commissar'
];

const LEADER_SURNAMES = [
  'Volkov', 'Zhang', 'Anderson', 'Silva', 'Ivanov', 'Kim', 'Petrov', 'Chen', 'Smith',
  'Rodriguez', 'Müller', 'Tanaka', 'Kowalski', 'O\'Brien', 'Novak', 'Hassan', 'Okafor',
  'Fernandez', 'Gupta', 'Berg', 'Sato', 'Wright', 'Martinez', 'Leblanc', 'Rossi',
  'Papadopoulos', 'Johansson', 'Ali', 'Nguyen', 'Dubois', 'Andersen', 'Wagner'
];

function generateNewLeaderName(): string {
  const title = LEADER_TITLES[Math.floor(Math.random() * LEADER_TITLES.length)];
  const surname = LEADER_SURNAMES[Math.floor(Math.random() * LEADER_SURNAMES.length)];
  return `${title} ${surname}`;
}

function selectNewPersonality(oldPersonality: AIPersonality): AIPersonality {
  // Filter out the old personality to ensure change
  const available = AI_PERSONALITIES.filter(p => p !== oldPersonality);
  return available[Math.floor(Math.random() * available.length)];
}

/**
 * Calculate the probability of regime change occurring
 *
 * Inspired by Hearts of Iron 4's civil war mechanics and Civilization's loyalty rebellion
 */
export function calculateRegimeChangeProbability(
  instability: number,
  publicOpinion: number,
  morale: number,
  cabinetApproval: number,
  failedElectionRecently: boolean = false
): number {
  let baseProbability = 0;

  // Critical instability threshold (like Civ 6 loyalty reaching 0)
  if (instability >= 90) {
    baseProbability = 0.50; // 50% chance per turn at extreme instability
  } else if (instability >= 75) {
    baseProbability = 0.25; // 25% chance at high instability
  } else if (instability >= 60) {
    baseProbability = 0.10; // 10% chance at moderate instability
  } else {
    return 0; // Below 60 instability, no regime change possible
  }

  // Increase probability if governance metrics are critically low
  if (publicOpinion < 30 || morale < 30) {
    baseProbability += 0.15; // Add 15% if populace is extremely dissatisfied
  }

  if (cabinetApproval < 25) {
    baseProbability += 0.10; // Add 10% if government legitimacy collapsed
  }

  // Recent failed election during crisis triggers higher chance (HoI4 style)
  if (failedElectionRecently && instability >= 60) {
    baseProbability += 0.20; // Add 20% if election failed during crisis
  }

  // Cap at 90% (some chance of surviving even worst crisis)
  return Math.min(0.90, baseProbability);
}

/**
 * Determine if a regime change should occur this turn
 */
export function shouldRegimeChangeOccur(
  instability: number,
  publicOpinion: number,
  morale: number,
  cabinetApproval: number,
  failedElectionRecently: boolean = false
): boolean {
  const probability = calculateRegimeChangeProbability(
    instability,
    publicOpinion,
    morale,
    cabinetApproval,
    failedElectionRecently
  );

  if (probability === 0) return false;

  return Math.random() < probability;
}

/**
 * Execute a regime change for an AI nation
 *
 * Returns new governance metrics and military losses (like HoI4 civil war division split)
 */
export function executeRegimeChange(
  currentPersonality: AIPersonality,
  currentLeader: string,
  instability: number
): RegimeChangeResult {
  const newPersonality = selectNewPersonality(currentPersonality);
  const newLeader = generateNewLeaderName();

  // Military losses during transition (worse with higher instability)
  // Range: 10-30% of military assets lost
  const baseLoss = 0.10;
  const instabilityBonus = (instability / 100) * 0.20;
  const militaryLosses = Math.min(0.30, baseLoss + instabilityBonus);

  // Post-revolution metrics (inspired by HoI4's post-civil war stability)
  // Nation starts in unstable state even after regime change
  const newMetrics = {
    morale: 40 + Math.floor(Math.random() * 20), // 40-60 (recovering)
    publicOpinion: 35 + Math.floor(Math.random() * 20), // 35-55 (mixed feelings)
    cabinetApproval: 30 + Math.floor(Math.random() * 20), // 30-50 (weak legitimacy)
    instability: 30 + Math.floor(Math.random() * 20), // 30-50 (still elevated)
    electionTimer: 8 + Math.floor(Math.random() * 5), // 8-12 turns until next election
  };

  return {
    occurred: true,
    oldPersonality: currentPersonality,
    newPersonality,
    oldLeader: currentLeader,
    newLeader,
    militaryLosses,
    newMetrics,
  };
}

/**
 * Generate news text for regime change events
 */
export function generateRegimeChangeNews(
  nationName: string,
  result: RegimeChangeResult
): { text: string; priority: 'critical' | 'urgent' } {
  const templates = [
    `BREAKING: ${nationName} undergoes dramatic regime change! ${result.oldLeader} overthrown, ${result.newLeader} seizes power.`,
    `${nationName} in turmoil: ${result.newLeader} emerges as new leader following violent uprising that toppled ${result.oldLeader}.`,
    `Political earthquake in ${nationName}! ${result.oldLeader}'s government collapses, ${result.newLeader} installed.`,
    `${nationName} revolution: ${result.oldLeader} regime falls after mass protests. ${result.newLeader} assumes control.`,
    `Coup in ${nationName}! ${result.oldLeader} ousted in military takeover. ${result.newLeader} now in charge.`,
  ];

  const text = templates[Math.floor(Math.random() * templates.length)];

  return {
    text,
    priority: 'critical',
  };
}

/**
 * Check if player should face game-over due to political collapse
 *
 * Inspired by Total War and Paradox games where losing legitimacy = game over
 */
export function checkPoliticalGameOver(
  publicOpinion: number,
  cabinetApproval: number,
  morale: number
): { gameOver: boolean; reason?: string } {
  // Immediate game over: Government coup/impeachment
  if (publicOpinion < 20 && cabinetApproval < 25) {
    return {
      gameOver: true,
      reason: 'POLITICAL COLLAPSE - Your government has been overthrown in a coup. The people have lost all faith in your leadership.',
    };
  }

  // Immediate game over: Societal breakdown
  if (morale < 15) {
    return {
      gameOver: true,
      reason: 'SOCIETAL BREAKDOWN - Complete loss of public morale. Your nation descends into anarchy and ceases to function.',
    };
  }

  return { gameOver: false };
}

/**
 * Generate warning messages as player approaches political game-over thresholds
 */
export function generatePoliticalWarnings(
  publicOpinion: number,
  cabinetApproval: number,
  morale: number
): Array<{ text: string; priority: 'urgent' | 'critical' }> {
  const warnings: Array<{ text: string; priority: 'urgent' | 'critical' }> = [];

  // Critical warnings (very close to game over)
  if (publicOpinion < 25 && cabinetApproval < 30) {
    warnings.push({
      text: 'CRITICAL: Coup plotters gaining strength! Government legitimacy collapsing!',
      priority: 'critical',
    });
  }

  if (morale < 20) {
    warnings.push({
      text: 'CRITICAL: Mass riots spreading! Social order breaking down!',
      priority: 'critical',
    });
  }

  // Urgent warnings (getting dangerous)
  if (publicOpinion < 30 && cabinetApproval < 35) {
    warnings.push({
      text: 'URGENT: Political crisis deepening. Opposition calling for regime change.',
      priority: 'urgent',
    });
  }

  if (morale < 30) {
    warnings.push({
      text: 'URGENT: Widespread unrest. Military loyalty questionable.',
      priority: 'urgent',
    });
  }

  return warnings;
}
