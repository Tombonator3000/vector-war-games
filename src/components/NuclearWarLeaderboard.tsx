/**
 * Nuclear War Campaign Leaderboard Component
 *
 * Displays the Nuclear Supremacy leaderboard with dark humor statistics
 * and achievements for the "Last Man Standing" campaign mode.
 */

import { useMemo } from 'react';
import type { NuclearWarCampaignState } from '@/types/nuclearWarCampaign';
import type { Nation } from '@/types/game';

interface NuclearWarLeaderboardProps {
  campaignState: NuclearWarCampaignState;
  nations: Nation[];
  playerNationId?: string;
}

export function NuclearWarLeaderboard({
  campaignState,
  nations,
  playerNationId,
}: NuclearWarLeaderboardProps) {
  const leaderboardData = useMemo(() => {
    return campaignState.leaderboard.map((entry) => {
      const nation = nations.find((n) => n.id === entry.nationId);
      const nationState = campaignState.nationStates[entry.nationId];

      return {
        rank: entry.rank,
        nationId: entry.nationId,
        nationName: nation?.name || 'Unknown',
        color: nation?.color || '#888',
        score: Math.round(entry.score),
        nukesLaunched: nationState?.stats.nukesLaunched || 0,
        casualties: nationState?.stats.casualtiesCaused || 0,
        citiesDestroyed: nationState?.stats.citiesDestroyed || 0,
        nationsEliminated: nationState?.stats.nationsEliminated.length || 0,
        isEliminated: nationState?.isEliminated || false,
        achievements: nationState?.achievements || [],
        isPlayer: entry.nationId === playerNationId,
      };
    });
  }, [campaignState, nations, playerNationId]);

  const eliminatedNations = useMemo(() => {
    return Object.values(campaignState.nationStates)
      .filter((s) => s.isEliminated)
      .map((s) => {
        const nation = nations.find((n) => n.id === s.nationId);
        return {
          name: nation?.name || 'Unknown',
          turn: s.eliminatedOnTurn || 0,
          lastWords: s.lastWords || '',
        };
      })
      .sort((a, b) => b.turn - a.turn);
  }, [campaignState.nationStates, nations]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="bg-gray-900 border border-red-900 rounded-lg p-4 text-white">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-red-500 flex items-center gap-2">
          <span>☢️</span>
          NUCLEAR SUPREMACY LEADERBOARD
          <span>☢️</span>
        </h2>
        <div className="text-sm text-gray-400">
          Nations Remaining: <span className="text-yellow-500 font-bold">{campaignState.nationsRemaining}</span>
        </div>
      </div>

      {/* Doomsday Clock */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Doomsday Clock</span>
          <span>{campaignState.doomsdayClock}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${
              campaignState.doomsdayClock >= 75
                ? 'bg-red-600'
                : campaignState.doomsdayClock >= 50
                ? 'bg-orange-500'
                : campaignState.doomsdayClock >= 25
                ? 'bg-yellow-500'
                : 'bg-green-500'
            }`}
            style={{ width: `${campaignState.doomsdayClock}%` }}
          />
        </div>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-2 gap-2 mb-4 text-center">
        <div className="bg-gray-800 rounded p-2">
          <div className="text-2xl font-bold text-orange-500">
            {campaignState.globalNukesLaunched}
          </div>
          <div className="text-xs text-gray-400">Nukes Launched</div>
        </div>
        <div className="bg-gray-800 rounded p-2">
          <div className="text-2xl font-bold text-red-500">
            {formatNumber(campaignState.globalCasualties)}
          </div>
          <div className="text-xs text-gray-400">Global Casualties</div>
        </div>
      </div>

      {/* Current Propaganda */}
      {campaignState.currentPropaganda && (
        <div className="bg-gray-800 border border-yellow-600 rounded p-2 mb-4 text-center">
          <div className="text-xs text-yellow-500 mb-1">📢 PROPAGANDA OF THE DAY</div>
          <div className="text-sm italic text-yellow-300">"{campaignState.currentPropaganda}"</div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-gray-700">
              <th className="text-left py-2">#</th>
              <th className="text-left py-2">Nation</th>
              <th className="text-right py-2">Score</th>
              <th className="text-right py-2">🚀</th>
              <th className="text-right py-2">💀</th>
              <th className="text-right py-2">🏚️</th>
              <th className="text-right py-2">☠️</th>
              <th className="text-center py-2">🏆</th>
            </tr>
          </thead>
          <tbody>
            {leaderboardData.map((entry) => (
              <tr
                key={entry.nationId}
                className={`border-b border-gray-800 ${
                  entry.isPlayer ? 'bg-blue-900/30' : ''
                } ${entry.isEliminated ? 'opacity-50 line-through' : ''}`}
              >
                <td className="py-2">
                  <span
                    className={`font-bold ${
                      entry.rank === 1
                        ? 'text-yellow-500'
                        : entry.rank === 2
                        ? 'text-gray-400'
                        : entry.rank === 3
                        ? 'text-orange-600'
                        : 'text-gray-500'
                    }`}
                  >
                    {entry.rank}
                  </span>
                </td>
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className={entry.isPlayer ? 'font-bold text-blue-300' : ''}>
                      {entry.nationName}
                    </span>
                  </div>
                </td>
                <td className="text-right py-2 font-mono text-green-400">
                  {entry.score.toLocaleString()}
                </td>
                <td className="text-right py-2 text-orange-400">{entry.nukesLaunched}</td>
                <td className="text-right py-2 text-red-400">{formatNumber(entry.casualties)}</td>
                <td className="text-right py-2 text-yellow-400">{entry.citiesDestroyed}</td>
                <td className="text-right py-2 text-purple-400">{entry.nationsEliminated}</td>
                <td className="text-center py-2">{entry.achievements.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-2 text-xs text-gray-500 flex flex-wrap gap-3">
        <span>🚀 Nukes</span>
        <span>💀 Casualties</span>
        <span>🏚️ Cities</span>
        <span>☠️ Nations</span>
        <span>🏆 Achievements</span>
      </div>

      {/* Eliminated Nations */}
      {eliminatedNations.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-bold text-gray-400 mb-2">☠️ FALLEN NATIONS</h3>
          <div className="space-y-2">
            {eliminatedNations.map((nation) => (
              <div key={nation.name} className="bg-gray-800 rounded p-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-red-400 font-bold">{nation.name}</span>
                  <span className="text-gray-500">Turn {nation.turn}</span>
                </div>
                <div className="text-gray-400 italic mt-1">"{nation.lastWords}"</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Victory Screen */}
      {campaignState.winner && (
        <div className="mt-4 bg-yellow-900/50 border border-yellow-500 rounded p-4 text-center">
          <div className="text-2xl font-bold text-yellow-500 mb-2">🏆 NUCLEAR WAR CHAMPION 🏆</div>
          <div className="text-xl text-white">
            {nations.find((n) => n.id === campaignState.winner)?.name}
          </div>
          {campaignState.finalStats && (
            <div className="mt-3 text-sm text-gray-300 space-y-1">
              <div>Total Nukes Launched: {campaignState.finalStats.totalNukesLaunched}</div>
              <div>Total Casualties: {formatNumber(campaignState.finalStats.totalCasualties)}</div>
              <div>Nations Eliminated: {campaignState.finalStats.nationsEliminated}</div>
              <div>Turns Played: {campaignState.finalStats.turnsPlayed}</div>
              <div>Most Destructive: {campaignState.finalStats.mostDestructiveNation}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
