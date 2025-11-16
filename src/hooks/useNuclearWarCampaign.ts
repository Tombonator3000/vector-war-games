/**
 * Nuclear War Campaign Hook
 *
 * Manages the Nuclear War "Last Man Standing" campaign mode with dark humor,
 * achievement tracking, and nuclear supremacy scoring.
 */

import { useCallback } from 'react';
import type { GameState, Nation } from '@/types/game';
import type {
  NuclearWarCampaignState,
  NuclearWarNationState,
  NuclearWarAchievement,
} from '@/types/nuclearWarCampaign';
import {
  NUCLEAR_WAR_ACHIEVEMENTS,
  PROPAGANDA_SLOGANS,
  LAST_WORDS,
  VICTORY_ANNOUNCEMENTS,
} from '@/types/nuclearWarCampaign';
import { initializeNuclearWarHands } from '@/lib/nuclearWarCardSystem';

interface UseNuclearWarCampaignProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  addNewsItem?: (
    category: 'military' | 'crisis' | 'media',
    text: string,
    priority: 'critical' | 'urgent' | 'high' | 'alert'
  ) => void;
}

interface NukeStrikeEvent {
  attackerId: string;
  targetId: string;
  casualties: number;
  citiesDestroyed: number;
  warheadsUsed: number;
}

export function useNuclearWarCampaign({
  gameState,
  setGameState,
  addNewsItem,
}: UseNuclearWarCampaignProps) {
  /**
   * Initialize Nuclear War campaign state
   */
  const initializeCampaign = useCallback(() => {
    if (gameState.scenario?.id !== 'nuclearWar') return;

    const nationStates: Record<string, NuclearWarNationState> = {};

    gameState.nations.forEach((nation) => {
      nationStates[nation.id] = {
        nationId: nation.id,
        stats: {
          nukesLaunched: 0,
          nukesLanded: 0,
          casualtiesCaused: 0,
          citiesDestroyed: 0,
          nationsEliminated: [],
          peakWarheadCount: Object.values(nation.warheads).reduce((a, b) => a + b, 0),
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

    const campaignState: NuclearWarCampaignState = {
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

    setGameState((prev) => ({
      ...prev,
      nuclearWarCampaign: campaignState,
    }));

    addNewsItem?.('crisis', '☢️ DEFCON 2 ALERT: Nuclear War Campaign begins! Last nation standing wins!', 'critical');
    addNewsItem?.('media', `📢 Propaganda: ${getRandomPropaganda()}`, 'high');
  }, [gameState.scenario?.id, gameState.nations, setGameState, addNewsItem]);

  /**
   * Record a nuclear strike event
   */
  const recordNukeStrike = useCallback(
    (event: NukeStrikeEvent) => {
      if (!gameState.nuclearWarCampaign?.isActive) return;

      setGameState((prev) => {
        if (!prev.nuclearWarCampaign) return prev;

        const campaign = { ...prev.nuclearWarCampaign };
        const attackerState = { ...campaign.nationStates[event.attackerId] };
        const targetState = { ...campaign.nationStates[event.targetId] };

        // Update attacker stats
        attackerState.stats = {
          ...attackerState.stats,
          nukesLaunched: attackerState.stats.nukesLaunched + event.warheadsUsed,
          nukesLanded: attackerState.stats.nukesLanded + event.warheadsUsed,
          casualtiesCaused: attackerState.stats.casualtiesCaused + event.casualties,
          citiesDestroyed: attackerState.stats.citiesDestroyed + event.citiesDestroyed,
        };

        // Update target stats (survived retaliation)
        if (!targetState.isEliminated) {
          targetState.stats.retaliationsSurvived++;
        }

        // Calculate supremacy score
        attackerState.supremacyScore = calculateSupremacyScore(attackerState.stats);

        // Check for achievements
        const newAchievements = checkAchievements(
          attackerState,
          event,
          campaign.globalNukesLaunched,
          prev.turn
        );
        attackerState.achievements = [...attackerState.achievements, ...newAchievements];

        // Add propaganda slogan on significant events
        if (event.casualties > 1000000 || event.citiesDestroyed > 0) {
          const newSlogan = getRandomPropaganda();
          attackerState.propagandaSlogans = [...attackerState.propagandaSlogans, newSlogan];
          addNewsItem?.('media', `📢 ${prev.nations.find(n => n.id === event.attackerId)?.name}: "${newSlogan}"`, 'alert');
        }

        // Update global stats
        campaign.globalNukesLaunched += event.warheadsUsed;
        campaign.globalCasualties += event.casualties;
        campaign.doomsdayClock = Math.min(100, campaign.doomsdayClock + event.warheadsUsed * 2);

        campaign.nationStates = {
          ...campaign.nationStates,
          [event.attackerId]: attackerState,
          [event.targetId]: targetState,
        };

        // Update leaderboard
        campaign.leaderboard = updateLeaderboard(campaign.nationStates);

        // News items for the strike
        const attackerName = prev.nations.find((n) => n.id === event.attackerId)?.name || 'Unknown';
        const targetName = prev.nations.find((n) => n.id === event.targetId)?.name || 'Unknown';

        addNewsItem?.(
          'military',
          `💥 ${attackerName} launches ${event.warheadsUsed} nukes at ${targetName}! ${formatCasualties(event.casualties)} casualties!`,
          'critical'
        );

        if (event.citiesDestroyed > 0) {
          addNewsItem?.(
            'crisis',
            `🏚️ ${event.citiesDestroyed} cities reduced to radioactive rubble!`,
            'urgent'
          );
        }

        // Announce achievements
        newAchievements.forEach((achievement) => {
          addNewsItem?.(
            'media',
            `🏆 ${attackerName} unlocked: ${achievement.icon} ${achievement.name} - ${achievement.description}`,
            'high'
          );
        });

        return { ...prev, nuclearWarCampaign: campaign };
      });
    },
    [gameState.nuclearWarCampaign?.isActive, setGameState, addNewsItem]
  );

  /**
   * Eliminate a nation (population reaches 0)
   */
  const eliminateNation = useCallback(
    (eliminatedId: string, eliminatorId?: string) => {
      if (!gameState.nuclearWarCampaign?.isActive) return;

      setGameState((prev) => {
        if (!prev.nuclearWarCampaign) return prev;

        const campaign = { ...prev.nuclearWarCampaign };
        const eliminatedState = { ...campaign.nationStates[eliminatedId] };

        eliminatedState.isEliminated = true;
        eliminatedState.eliminatedOnTurn = prev.turn;
        eliminatedState.lastWords = getRandomLastWords();

        campaign.nationsRemaining--;

        // Credit the eliminator
        if (eliminatorId) {
          const eliminatorState = { ...campaign.nationStates[eliminatorId] };
          eliminatorState.stats.nationsEliminated = [
            ...eliminatorState.stats.nationsEliminated,
            eliminatedId,
          ];
          eliminatorState.supremacyScore = calculateSupremacyScore(eliminatorState.stats);

          // Glass Parking Lot achievement
          const glassAchievement = {
            ...NUCLEAR_WAR_ACHIEVEMENTS.glassParking,
            unlockedTurn: prev.turn,
          };
          eliminatorState.achievements = [...eliminatorState.achievements, glassAchievement];

          campaign.nationStates[eliminatorId] = eliminatorState;
        }

        campaign.nationStates[eliminatedId] = eliminatedState;
        campaign.leaderboard = updateLeaderboard(campaign.nationStates);

        const eliminatedName = prev.nations.find((n) => n.id === eliminatedId)?.name || 'Unknown';
        const eliminatorName = eliminatorId
          ? prev.nations.find((n) => n.id === eliminatorId)?.name
          : 'Natural causes';

        addNewsItem?.(
          'crisis',
          `☠️ ${eliminatedName} has been ELIMINATED! Last words: "${eliminatedState.lastWords}"`,
          'critical'
        );

        if (eliminatorId) {
          addNewsItem?.(
            'military',
            `🅿️ ${eliminatorName} turned ${eliminatedName} into a glass parking lot!`,
            'urgent'
          );
        }

        // Check for victory
        if (campaign.nationsRemaining === 1) {
          const winner = Object.values(campaign.nationStates).find((s) => !s.isEliminated);
          if (winner) {
            campaign.winner = winner.nationId;
            const lastStandingAchievement = {
              ...NUCLEAR_WAR_ACHIEVEMENTS.lastManStanding,
              unlockedTurn: prev.turn,
            };
            winner.achievements = [...winner.achievements, lastStandingAchievement];
            campaign.nationStates[winner.nationId] = winner;

            const winnerName = prev.nations.find((n) => n.id === winner.nationId)?.name || 'Unknown';
            const announcement =
              VICTORY_ANNOUNCEMENTS.lastSurvivor[
                Math.floor(Math.random() * VICTORY_ANNOUNCEMENTS.lastSurvivor.length)
              ];

            addNewsItem?.('crisis', `🏆 ${winnerName} WINS! ${announcement}`, 'critical');

            campaign.finalStats = {
              totalNukesLaunched: campaign.globalNukesLaunched,
              totalCasualties: campaign.globalCasualties,
              nationsEliminated: Object.values(campaign.nationStates).filter((s) => s.isEliminated)
                .length,
              turnsPlayed: prev.turn,
              mostDestructiveNation: findMostDestructive(campaign.nationStates, prev.nations),
              luckyNation: winner.nationId,
            };
          }
        }

        return { ...prev, nuclearWarCampaign: campaign };
      });
    },
    [gameState.nuclearWarCampaign?.isActive, setGameState, addNewsItem]
  );

  /**
   * Update peak warhead count for a nation
   */
  const updateWarheadCount = useCallback(
    (nationId: string, currentCount: number) => {
      if (!gameState.nuclearWarCampaign?.isActive) return;

      setGameState((prev) => {
        if (!prev.nuclearWarCampaign) return prev;

        const campaign = { ...prev.nuclearWarCampaign };
        const nationState = { ...campaign.nationStates[nationId] };

        if (currentCount > nationState.stats.peakWarheadCount) {
          nationState.stats.peakWarheadCount = currentCount;

          // Nuclear Hoarder achievement
          if (currentCount >= 100 && !nationState.achievements.some((a) => a.id === 'nuclearHoarder')) {
            const hoarderAchievement = {
              ...NUCLEAR_WAR_ACHIEVEMENTS.nuclearHoarder,
              unlockedTurn: prev.turn,
            };
            nationState.achievements = [...nationState.achievements, hoarderAchievement];

            const nationName = prev.nations.find((n) => n.id === nationId)?.name || 'Unknown';
            addNewsItem?.(
              'media',
              `🗄️ ${nationName} unlocked: Nuclear Hoarder - 100+ warheads stockpiled!`,
              'high'
            );
          }
        }

        campaign.nationStates[nationId] = nationState;

        return { ...prev, nuclearWarCampaign: campaign };
      });
    },
    [gameState.nuclearWarCampaign?.isActive, setGameState, addNewsItem]
  );

  /**
   * Process end of turn for Nuclear War campaign
   */
  const processTurnEnd = useCallback(() => {
    if (!gameState.nuclearWarCampaign?.isActive) return;

    setGameState((prev) => {
      if (!prev.nuclearWarCampaign) return prev;

      const campaign = { ...prev.nuclearWarCampaign };

      // Random propaganda each turn
      if (Math.random() < 0.3) {
        const propaganda = getRandomPropaganda();
        campaign.currentPropaganda = propaganda;
        addNewsItem?.('media', `📢 Propaganda of the day: "${propaganda}"`, 'alert');
      }

      // Doomsday clock warning
      if (campaign.doomsdayClock >= 75 && !campaign.eventsTriggered.includes('doomsday75')) {
        campaign.eventsTriggered = [...campaign.eventsTriggered, 'doomsday75'];
        addNewsItem?.(
          'crisis',
          '⏰ DOOMSDAY CLOCK: 75% - Earth is becoming uninhabitable!',
          'critical'
        );
      } else if (campaign.doomsdayClock >= 50 && !campaign.eventsTriggered.includes('doomsday50')) {
        campaign.eventsTriggered = [...campaign.eventsTriggered, 'doomsday50'];
        addNewsItem?.(
          'crisis',
          '⏰ DOOMSDAY CLOCK: 50% - Nuclear winter approaching!',
          'urgent'
        );
      }

      // Check for eliminated nations (population = 0)
      prev.nations.forEach((nation) => {
        if (
          nation.population <= 0 &&
          !campaign.nationStates[nation.id]?.isEliminated
        ) {
          // Will be handled by eliminateNation call
        }
      });

      return { ...prev, nuclearWarCampaign: campaign };
    });
  }, [gameState.nuclearWarCampaign?.isActive, setGameState, addNewsItem]);

  /**
   * Get current leaderboard
   */
  const getLeaderboard = useCallback(() => {
    if (!gameState.nuclearWarCampaign) return [];

    return gameState.nuclearWarCampaign.leaderboard.map((entry) => {
      const nation = gameState.nations.find((n) => n.id === entry.nationId);
      const nationState = gameState.nuclearWarCampaign!.nationStates[entry.nationId];

      return {
        rank: entry.rank,
        nationId: entry.nationId,
        nationName: nation?.name || 'Unknown',
        score: entry.score,
        nukesLaunched: nationState?.stats.nukesLaunched || 0,
        casualties: nationState?.stats.casualtiesCaused || 0,
        nationsEliminated: nationState?.stats.nationsEliminated.length || 0,
        isEliminated: nationState?.isEliminated || false,
        achievements: nationState?.achievements.length || 0,
      };
    });
  }, [gameState.nuclearWarCampaign, gameState.nations]);

  /**
   * Check if campaign is won
   */
  const isVictory = useCallback(() => {
    return !!gameState.nuclearWarCampaign?.winner;
  }, [gameState.nuclearWarCampaign?.winner]);

  return {
    initializeCampaign,
    recordNukeStrike,
    eliminateNation,
    updateWarheadCount,
    processTurnEnd,
    getLeaderboard,
    isVictory,
    campaignState: gameState.nuclearWarCampaign,
  };
}

// Helper functions

function getRandomPropaganda(): string {
  return PROPAGANDA_SLOGANS[Math.floor(Math.random() * PROPAGANDA_SLOGANS.length)];
}

function getRandomLastWords(): string {
  return LAST_WORDS[Math.floor(Math.random() * LAST_WORDS.length)];
}

function formatCasualties(count: number): string {
  if (count >= 1000000000) return `${(count / 1000000000).toFixed(1)}B`;
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

function calculateSupremacyScore(stats: NuclearWarNationState['stats']): number {
  return (
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

function checkAchievements(
  nationState: NuclearWarNationState,
  event: NukeStrikeEvent,
  globalNukesBeforeStrike: number,
  turn: number
): NuclearWarAchievement[] {
  const newAchievements: NuclearWarAchievement[] = [];
  const existingIds = nationState.achievements.map((a) => a.id);

  // First Blood
  if (globalNukesBeforeStrike === 0 && !existingIds.includes('firstBlood')) {
    newAchievements.push({ ...NUCLEAR_WAR_ACHIEVEMENTS.firstBlood, unlockedTurn: turn });
  }

  // Mass Destruction
  if (event.casualties > 10000000 && !existingIds.includes('massDestruction')) {
    newAchievements.push({ ...NUCLEAR_WAR_ACHIEVEMENTS.massDestruction, unlockedTurn: turn });
  }

  // City Buster
  if (event.citiesDestroyed >= 3 && !existingIds.includes('cityBuster')) {
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

function findMostDestructive(
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
