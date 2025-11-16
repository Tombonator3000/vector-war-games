/**
 * Nuclear War Campaign Integration
 *
 * Helper functions to integrate the Nuclear War campaign mode into the main game loop.
 * Handles initialization, turn processing, victory checking, and event generation.
 */

import type { GameState, Nation } from '@/types/game';
import type {
  NuclearWarCampaignState,
  NuclearWarNationState,
} from '@/types/nuclearWarCampaign';
import {
  PROPAGANDA_SLOGANS,
  LAST_WORDS,
  NUCLEAR_WAR_ACHIEVEMENTS,
  VICTORY_ANNOUNCEMENTS,
} from '@/types/nuclearWarCampaign';
import { initializeNuclearWarHands } from './nuclearWarCardSystem';

/**
 * Check if the current scenario is Nuclear War campaign
 */
export function isNuclearWarCampaign(gameState: GameState): boolean {
  return gameState.scenario?.id === 'nuclearWar';
}

/**
 * Initialize Nuclear War campaign state when game starts
 */
export function initializeNuclearWarCampaign(
  gameState: GameState
): NuclearWarCampaignState | null {
  if (!isNuclearWarCampaign(gameState)) {
    return null;
  }

  const nationStates: Record<string, NuclearWarNationState> = {};

  gameState.nations.forEach((nation) => {
    const totalWarheads = Object.values(nation.warheads).reduce((a, b) => a + b, 0);
    nationStates[nation.id] = {
      nationId: nation.id,
      stats: {
        nukesLaunched: 0,
        nukesLanded: 0,
        casualtiesCaused: 0,
        citiesDestroyed: 0,
        nationsEliminated: [],
        peakWarheadCount: totalWarheads,
        retaliationsSurvived: 0,
        overkillScore: 0,
      },
      achievements: [],
      supremacyScore: 0,
      isEliminated: false,
      propagandaSlogans: [getRandomPropaganda()],
    };
  });

  // Initialize card game system
  const { hands, deck, discardPile } = initializeNuclearWarHands(gameState);

  return {
    isActive: true,
    round: 1,
    globalNukesLaunched: 0,
    globalCasualties: 0,
    nationsRemaining: gameState.nations.length,
    nationStates,
    globalAchievements: [],
    leaderboard: gameState.nations.map((n, i) => ({
      nationId: n.id,
      score: 0,
      rank: i + 1,
    })),
    doomsdayClock: 0,
    eventsTriggered: [],
    hands,
    deck,
    discardPile,
    populationDeck: [],
    phases: {
      currentPhase: 'STOCKPILE',
      actionsRemaining: {},
      simultaneousLaunches: [],
    },
  };
}

/**
 * Process Nuclear War campaign at end of turn
 */
export function processNuclearWarTurnEnd(
  gameState: GameState,
  addNewsItem?: (category: string, text: string, priority: string) => void
): GameState {
  if (!gameState.nuclearWarCampaign?.isActive) {
    return gameState;
  }

  const campaign = { ...gameState.nuclearWarCampaign };
  const updatedNations = [...gameState.nations];

  // Check for eliminated nations
  updatedNations.forEach((nation, index) => {
    const nationState = campaign.nationStates[nation.id];
    if (!nationState) return;

    // Check if nation should be eliminated
    if (nation.population <= 0 && !nationState.isEliminated) {
      const eliminatedState = {
        ...nationState,
        isEliminated: true,
        eliminatedOnTurn: gameState.turn,
        lastWords: getRandomLastWords(),
      };
      campaign.nationStates[nation.id] = eliminatedState;
      campaign.nationsRemaining--;

      // Mark nation as eliminated in game state
      updatedNations[index] = { ...nation, eliminated: true };

      addNewsItem?.(
        'crisis',
        `☠️ ${nation.name} has been ELIMINATED! "${eliminatedState.lastWords}"`,
        'critical'
      );
    }

    // Update peak warhead count
    const currentWarheads = Object.values(nation.warheads).reduce((a, b) => a + b, 0);
    if (currentWarheads > nationState.stats.peakWarheadCount) {
      campaign.nationStates[nation.id] = {
        ...nationState,
        stats: {
          ...nationState.stats,
          peakWarheadCount: currentWarheads,
        },
      };

      // Nuclear Hoarder achievement
      if (
        currentWarheads >= 100 &&
        !nationState.achievements.some((a) => a.id === 'nuclearHoarder')
      ) {
        const hoarderAchievement = {
          ...NUCLEAR_WAR_ACHIEVEMENTS.nuclearHoarder,
          unlockedTurn: gameState.turn,
        };
        campaign.nationStates[nation.id].achievements = [
          ...campaign.nationStates[nation.id].achievements,
          hoarderAchievement,
        ];
        addNewsItem?.(
          'media',
          `🗄️ ${nation.name} unlocked: Nuclear Hoarder!`,
          'high'
        );
      }
    }
  });

  // Random propaganda
  if (Math.random() < 0.3) {
    const propaganda = getRandomPropaganda();
    campaign.currentPropaganda = propaganda;
    addNewsItem?.('media', `📢 "${propaganda}"`, 'alert');
  }

  // Doomsday clock warnings
  if (campaign.doomsdayClock >= 75 && !campaign.eventsTriggered.includes('doomsday75')) {
    campaign.eventsTriggered = [...campaign.eventsTriggered, 'doomsday75'];
    addNewsItem?.(
      'crisis',
      '⏰ DOOMSDAY CLOCK: 75% - The end is nigh!',
      'critical'
    );
  } else if (campaign.doomsdayClock >= 50 && !campaign.eventsTriggered.includes('doomsday50')) {
    campaign.eventsTriggered = [...campaign.eventsTriggered, 'doomsday50'];
    addNewsItem?.(
      'crisis',
      '⏰ DOOMSDAY CLOCK: 50% - Halfway to oblivion!',
      'urgent'
    );
  } else if (campaign.doomsdayClock >= 25 && !campaign.eventsTriggered.includes('doomsday25')) {
    campaign.eventsTriggered = [...campaign.eventsTriggered, 'doomsday25'];
    addNewsItem?.(
      'environment',
      '⏰ DOOMSDAY CLOCK: 25% - Things are heating up!',
      'high'
    );
  }

  // Check for victory (last man standing)
  if (campaign.nationsRemaining === 1 && !campaign.winner) {
    const winner = Object.values(campaign.nationStates).find((s) => !s.isEliminated);
    if (winner) {
      campaign.winner = winner.nationId;
      const lastStandingAchievement = {
        ...NUCLEAR_WAR_ACHIEVEMENTS.lastManStanding,
        unlockedTurn: gameState.turn,
      };
      winner.achievements = [...winner.achievements, lastStandingAchievement];
      campaign.nationStates[winner.nationId] = winner;

      const winnerNation = updatedNations.find((n) => n.id === winner.nationId);
      const announcement =
        VICTORY_ANNOUNCEMENTS.lastSurvivor[
          Math.floor(Math.random() * VICTORY_ANNOUNCEMENTS.lastSurvivor.length)
        ];

      addNewsItem?.(
        'crisis',
        `🏆 ${winnerNation?.name || 'Winner'} WINS! ${announcement}`,
        'critical'
      );

      campaign.finalStats = {
        totalNukesLaunched: campaign.globalNukesLaunched,
        totalCasualties: campaign.globalCasualties,
        nationsEliminated: Object.values(campaign.nationStates).filter((s) => s.isEliminated)
          .length,
        turnsPlayed: gameState.turn,
        mostDestructiveNation: findMostDestructiveNation(campaign.nationStates, updatedNations),
        luckyNation: winner.nationId,
      };
    }
  }

  // Check for pyrrhic victory (winner has <10% population)
  if (campaign.winner) {
    const winnerNation = updatedNations.find((n) => n.id === campaign.winner);
    const winnerState = campaign.nationStates[campaign.winner];
    if (winnerNation && winnerState) {
      const originalPop = 100000000; // Assume 100M starting population
      const currentPopRatio = winnerNation.population / originalPop;
      if (
        currentPopRatio < 0.1 &&
        !winnerState.achievements.some((a) => a.id === 'pyrrhicVictor')
      ) {
        const pyrrhicAchievement = {
          ...NUCLEAR_WAR_ACHIEVEMENTS.pyrrhicVictor,
          unlockedTurn: gameState.turn,
        };
        winnerState.achievements = [...winnerState.achievements, pyrrhicAchievement];
        campaign.nationStates[campaign.winner] = winnerState;
        addNewsItem?.(
          'media',
          `💔 ${winnerNation.name} unlocked: Pyrrhic Victor - Won with ruins!`,
          'high'
        );
      }
    }
  }

  // Update leaderboard
  campaign.leaderboard = updateLeaderboard(campaign.nationStates);

  return {
    ...gameState,
    nations: updatedNations,
    nuclearWarCampaign: campaign,
  };
}

/**
 * Record a nuclear strike event in the campaign
 */
export function recordNuclearStrike(
  gameState: GameState,
  attackerId: string,
  targetId: string,
  casualties: number,
  citiesDestroyed: number,
  warheadsUsed: number,
  addNewsItem?: (category: string, text: string, priority: string) => void
): GameState {
  if (!gameState.nuclearWarCampaign?.isActive) {
    return gameState;
  }

  const campaign = { ...gameState.nuclearWarCampaign };
  const attackerState = { ...campaign.nationStates[attackerId] };
  const targetState = { ...campaign.nationStates[targetId] };

  if (!attackerState || !targetState) {
    return gameState;
  }

  // Update attacker stats
  attackerState.stats = {
    ...attackerState.stats,
    nukesLaunched: attackerState.stats.nukesLaunched + warheadsUsed,
    nukesLanded: attackerState.stats.nukesLanded + warheadsUsed,
    casualtiesCaused: attackerState.stats.casualtiesCaused + casualties,
    citiesDestroyed: attackerState.stats.citiesDestroyed + citiesDestroyed,
  };

  // Update target survived retaliation
  if (!targetState.isEliminated) {
    targetState.stats.retaliationsSurvived++;
  }

  // Calculate supremacy score
  attackerState.supremacyScore = calculateSupremacyScore(attackerState.stats);

  // Check for achievements
  const newAchievements = checkStrikeAchievements(
    attackerState,
    casualties,
    citiesDestroyed,
    campaign.globalNukesLaunched,
    gameState.turn
  );
  attackerState.achievements = [...attackerState.achievements, ...newAchievements];

  // Add propaganda on big hits
  if (casualties > 1000000 || citiesDestroyed > 0) {
    const newSlogan = getRandomPropaganda();
    attackerState.propagandaSlogans = [...attackerState.propagandaSlogans, newSlogan];

    const attackerNation = gameState.nations.find((n) => n.id === attackerId);
    addNewsItem?.(
      'media',
      `📢 ${attackerNation?.name || 'Attacker'}: "${newSlogan}"`,
      'alert'
    );
  }

  // Update global stats
  campaign.globalNukesLaunched += warheadsUsed;
  campaign.globalCasualties += casualties;
  campaign.doomsdayClock = Math.min(100, campaign.doomsdayClock + warheadsUsed * 2);

  campaign.nationStates = {
    ...campaign.nationStates,
    [attackerId]: attackerState,
    [targetId]: targetState,
  };

  // Update leaderboard
  campaign.leaderboard = updateLeaderboard(campaign.nationStates);

  // News for the strike
  const attackerName = gameState.nations.find((n) => n.id === attackerId)?.name || 'Unknown';
  const targetName = gameState.nations.find((n) => n.id === targetId)?.name || 'Unknown';

  addNewsItem?.(
    'military',
    `💥 ${attackerName} nukes ${targetName}! ${formatNumber(casualties)} dead!`,
    'critical'
  );

  if (citiesDestroyed > 0) {
    addNewsItem?.(
      'crisis',
      `🏚️ ${citiesDestroyed} cities vaporized!`,
      'urgent'
    );
  }

  // Announce achievements
  newAchievements.forEach((achievement) => {
    addNewsItem?.(
      'media',
      `🏆 ${attackerName}: ${achievement.icon} ${achievement.name}!`,
      'high'
    );
  });

  return {
    ...gameState,
    nuclearWarCampaign: campaign,
  };
}

/**
 * Check if victory condition is met for Nuclear War campaign
 */
export function checkNuclearWarVictory(gameState: GameState): {
  isVictory: boolean;
  winnerId?: string;
  message?: string;
} {
  if (!gameState.nuclearWarCampaign?.isActive) {
    return { isVictory: false };
  }

  const campaign = gameState.nuclearWarCampaign;

  if (campaign.winner) {
    const winnerNation = gameState.nations.find((n) => n.id === campaign.winner);
    const isPlayerWinner = winnerNation?.isPlayer || false;

    return {
      isVictory: isPlayerWinner,
      winnerId: campaign.winner,
      message: isPlayerWinner
        ? `NUCLEAR SUPREMACY! You are the last nation standing!`
        : `DEFEAT! ${winnerNation?.name || 'AI'} has eliminated all opposition!`,
    };
  }

  // Check if player is eliminated
  const playerNation = gameState.nations.find((n) => n.isPlayer);
  if (playerNation) {
    const playerState = campaign.nationStates[playerNation.id];
    if (playerState?.isEliminated) {
      return {
        isVictory: false,
        message: `GAME OVER! Your nation has been eliminated! Last words: "${playerState.lastWords}"`,
      };
    }
  }

  return { isVictory: false };
}

/**
 * Get campaign statistics for display
 */
export function getCampaignStats(gameState: GameState) {
  if (!gameState.nuclearWarCampaign) {
    return null;
  }

  const campaign = gameState.nuclearWarCampaign;

  return {
    globalNukesLaunched: campaign.globalNukesLaunched,
    globalCasualties: campaign.globalCasualties,
    nationsRemaining: campaign.nationsRemaining,
    doomsdayClock: campaign.doomsdayClock,
    leaderboard: campaign.leaderboard,
    currentPropaganda: campaign.currentPropaganda,
    isVictory: !!campaign.winner,
    winner: campaign.winner,
    finalStats: campaign.finalStats,
  };
}

// Helper functions

function getRandomPropaganda(): string {
  return PROPAGANDA_SLOGANS[Math.floor(Math.random() * PROPAGANDA_SLOGANS.length)];
}

function getRandomLastWords(): string {
  return LAST_WORDS[Math.floor(Math.random() * LAST_WORDS.length)];
}

function formatNumber(num: number): string {
  if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function calculateSupremacyScore(stats: NuclearWarNationState['stats']): number {
  return Math.round(
    stats.nukesLaunched * 10 +
      stats.casualtiesCaused / 100000 +
      stats.citiesDestroyed * 50 +
      stats.nationsEliminated.length * 500 +
      stats.overkillScore * 5
  );
}

function updateLeaderboard(
  nationStates: Record<string, NuclearWarNationState>
): Array<{ nationId: string; score: number; rank: number }> {
  const entries = Object.values(nationStates)
    .filter((s) => !s.isEliminated)
    .map((s) => ({
      nationId: s.nationId,
      score: s.supremacyScore,
      rank: 0,
    }))
    .sort((a, b) => b.score - a.score);

  entries.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  return entries;
}

function checkStrikeAchievements(
  nationState: NuclearWarNationState,
  casualties: number,
  citiesDestroyed: number,
  globalNukesBeforeStrike: number,
  turn: number
) {
  const newAchievements: typeof nationState.achievements = [];
  const existingIds = nationState.achievements.map((a) => a.id);

  // First Blood
  if (globalNukesBeforeStrike === 0 && !existingIds.includes('firstBlood')) {
    newAchievements.push({ ...NUCLEAR_WAR_ACHIEVEMENTS.firstBlood, unlockedTurn: turn });
  }

  // Mass Destruction
  if (casualties > 10000000 && !existingIds.includes('massDestruction')) {
    newAchievements.push({ ...NUCLEAR_WAR_ACHIEVEMENTS.massDestruction, unlockedTurn: turn });
  }

  // City Buster
  if (citiesDestroyed >= 3 && !existingIds.includes('cityBuster')) {
    newAchievements.push({ ...NUCLEAR_WAR_ACHIEVEMENTS.cityBuster, unlockedTurn: turn });
  }

  // Trigger Happy
  if (turn <= 3 && !existingIds.includes('triggerHappy')) {
    newAchievements.push({ ...NUCLEAR_WAR_ACHIEVEMENTS.triggerHappy, unlockedTurn: turn });
  }

  // Nuclear Spree
  if (nationState.stats.nukesLaunched >= 10 && !existingIds.includes('nuclearSpree')) {
    newAchievements.push({ ...NUCLEAR_WAR_ACHIEVEMENTS.nuclearSpree, unlockedTurn: turn });
  }

  // Genocide Enthusiast
  if (nationState.stats.casualtiesCaused >= 100000000 && !existingIds.includes('genocideEnthusiast')) {
    newAchievements.push({ ...NUCLEAR_WAR_ACHIEVEMENTS.genocideEnthusiast, unlockedTurn: turn });
  }

  // Cockroach Survivor
  if (
    nationState.stats.retaliationsSurvived >= 5 &&
    !existingIds.includes('cockroachSurvivor')
  ) {
    newAchievements.push({ ...NUCLEAR_WAR_ACHIEVEMENTS.cockroachSurvivor, unlockedTurn: turn });
  }

  return newAchievements;
}

function findMostDestructiveNation(
  nationStates: Record<string, NuclearWarNationState>,
  nations: Nation[]
): string {
  let maxCasualties = 0;
  let mostDestructive = '';

  Object.values(nationStates).forEach((state) => {
    if (state.stats.casualtiesCaused > maxCasualties) {
      maxCasualties = state.stats.casualtiesCaused;
      mostDestructive = state.nationId;
    }
  });

  return nations.find((n) => n.id === mostDestructive)?.name || mostDestructive;
}
