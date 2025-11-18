import React from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Trophy, Skull, Target, Users, Building2, Rocket, Shield, TrendingUp, Clock, Medal, Award } from 'lucide-react';

interface GameStatistics {
  playerName: string;
  leader: string;
  doctrine: string;
  turns: number;
  finalScore: number;
  victory: boolean;
  victoryMessage: string;

  // Nation statistics
  finalPopulation: number;
  finalProduction: number;
  finalCities: number;
  finalMissiles: number;
  finalBombers: number;
  finalSubmarines: number;
  finalDefense: number;
  finalUranium: number;
  finalIntel: number;

  // Governance
  finalMorale: number;
  finalPublicOpinion: number;
  finalCabinetApproval: number;

  // Military actions
  nukesLaunched: number;
  nukesReceived: number;
  enemiesDestroyed: number;

  // Diplomacy
  alliances: number;
  wars: number;

  // Game state
  finalDefcon: number;
  doomsdayMinutes: number;

  timestamp: string;
}

interface HighscoreEntry {
  name: string;
  doctrine: string;
  score: number;
  turns: number;
  date: string;
}

interface EndGameScreenProps {
  statistics: GameStatistics;
  highscores: HighscoreEntry[];
  onRestart: () => void;
  onMainMenu: () => void;
}

export const EndGameScreen: React.FC<EndGameScreenProps> = ({
  statistics,
  highscores,
  onRestart,
  onMainMenu
}) => {
  const isVictory = statistics.victory;

  // Check if this score made it to highscores
  const highscoreRank = highscores.findIndex(hs =>
    hs.score === statistics.finalScore &&
    hs.turns === statistics.turns &&
    hs.date === statistics.timestamp
  ) + 1;

  const isNewHighscore = highscoreRank > 0 && highscoreRank <= 10;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className={`text-center py-8 ${isVictory ? 'bg-gradient-to-b from-green-900/50 to-transparent' : 'bg-gradient-to-b from-red-900/50 to-transparent'}`}>
          <div className="flex items-center justify-center gap-4 mb-4">
            {isVictory ? (
              <Trophy className="w-16 h-16 text-yellow-400 animate-pulse" />
            ) : (
              <Skull className="w-16 h-16 text-red-500 animate-pulse" />
            )}
            <h1 className={`text-6xl font-bold tracking-wider ${isVictory ? 'text-green-400' : 'text-red-400'}`}>
              {isVictory ? 'VICTORY' : 'DEFEAT'}
            </h1>
            {isVictory ? (
              <Trophy className="w-16 h-16 text-yellow-400 animate-pulse" />
            ) : (
              <Skull className="w-16 h-16 text-red-500 animate-pulse" />
            )}
          </div>
          <p className="text-2xl text-gray-300 mb-2">{statistics.victoryMessage}</p>
          <p className="text-xl text-gray-400">{statistics.playerName} - {statistics.leader}</p>

          {isNewHighscore && (
            <div className="mt-4 flex items-center justify-center gap-2 text-yellow-400 animate-bounce">
              <Award className="w-8 h-8" />
              <span className="text-2xl font-bold">NEW HIGHSCORE - Rank #{highscoreRank}!</span>
              <Award className="w-8 h-8" />
            </div>
          )}
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pb-4">
            {/* Main Statistics */}
            <Card className="bg-gray-900/90 border-gray-700 p-6 col-span-1 lg:col-span-2">
              <h2 className="text-2xl font-bold text-blue-400 mb-4 flex items-center gap-2">
                <Target className="w-6 h-6" />
                Game Statistics
              </h2>

              <div className="space-y-4">
                {/* Score & Duration */}
                <div className="bg-gray-800/50 p-4 rounded border border-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Final Score</p>
                      <p className="text-4xl font-bold text-yellow-400">{statistics.finalScore.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Turns Survived</p>
                      <p className="text-4xl font-bold text-blue-400">{statistics.turns}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Doctrine</p>
                      <p className="text-2xl font-bold text-purple-400">{statistics.doctrine}</p>
                    </div>
                  </div>
                </div>

                {/* Nation Stats */}
                <div className="bg-gray-800/50 p-4 rounded border border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">Nation Statistics</h3>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    <StatCard icon={<Users className="w-4 h-4" />} label="Population" value={`${statistics.finalPopulation.toLocaleString()}M`} color="text-green-400" />
                    <StatCard icon={<Building2 className="w-4 h-4" />} label="Cities" value={statistics.finalCities.toString()} color="text-blue-400" />
                    <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Production" value={statistics.finalProduction.toString()} color="text-yellow-400" />
                    <StatCard icon={<Target className="w-4 h-4" />} label="Uranium" value={statistics.finalUranium.toString()} color="text-green-400" />
                    <StatCard icon={<Target className="w-4 h-4" />} label="Intel" value={statistics.finalIntel.toString()} color="text-purple-400" />
                    <StatCard icon={<Clock className="w-4 h-4" />} label="DEFCON" value={statistics.finalDefcon.toString()} color={statistics.finalDefcon >= 4 ? "text-green-400" : statistics.finalDefcon === 3 ? "text-yellow-400" : "text-red-400"} />
                  </div>
                </div>

                {/* Military Arsenal */}
                <div className="bg-gray-800/50 p-4 rounded border border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">Military Arsenal</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard icon={<Rocket className="w-4 h-4" />} label="ICBMs" value={statistics.finalMissiles.toString()} color="text-red-400" />
                    <StatCard icon={<Rocket className="w-4 h-4" />} label="Bombers" value={statistics.finalBombers.toString()} color="text-orange-400" />
                    <StatCard icon={<Rocket className="w-4 h-4" />} label="Submarines" value={statistics.finalSubmarines.toString()} color="text-cyan-400" />
                    <StatCard icon={<Shield className="w-4 h-4" />} label="Defense" value={statistics.finalDefense.toString()} color="text-blue-400" />
                  </div>
                </div>

                {/* Governance */}
                <div className="bg-gray-800/50 p-4 rounded border border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">Governance Metrics</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <StatCard icon={<Users className="w-4 h-4" />} label="Morale" value={`${statistics.finalMorale}%`} color={statistics.finalMorale > 70 ? "text-green-400" : statistics.finalMorale > 40 ? "text-yellow-400" : "text-red-400"} />
                    <StatCard icon={<Users className="w-4 h-4" />} label="Public Opinion" value={`${statistics.finalPublicOpinion}%`} color={statistics.finalPublicOpinion > 70 ? "text-green-400" : statistics.finalPublicOpinion > 40 ? "text-yellow-400" : "text-red-400"} />
                    <StatCard icon={<Users className="w-4 h-4" />} label="Cabinet Approval" value={`${statistics.finalCabinetApproval}%`} color={statistics.finalCabinetApproval > 70 ? "text-green-400" : statistics.finalCabinetApproval > 40 ? "text-yellow-400" : "text-red-400"} />
                  </div>
                </div>

                {/* Combat & Diplomacy */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-800/50 p-4 rounded border border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">Military Actions</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <StatCard icon={<Rocket className="w-4 h-4" />} label="Nukes Launched" value={statistics.nukesLaunched.toString()} color="text-red-400" />
                      <StatCard icon={<Shield className="w-4 h-4" />} label="Nukes Received" value={statistics.nukesReceived.toString()} color="text-orange-400" />
                      <StatCard icon={<Target className="w-4 h-4" />} label="Enemies Destroyed" value={statistics.enemiesDestroyed.toString()} color="text-red-400" />
                    </div>
                  </div>
                  <div className="bg-gray-800/50 p-4 rounded border border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">Diplomacy</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <StatCard icon={<Users className="w-4 h-4" />} label="Alliances" value={statistics.alliances.toString()} color="text-green-400" />
                      <StatCard icon={<Target className="w-4 h-4" />} label="Wars" value={statistics.wars.toString()} color="text-red-400" />
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Highscores */}
            <Card className="bg-gray-900/90 border-gray-700 p-6">
              <h2 className="text-2xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
                <Medal className="w-6 h-6" />
                Hall of Fame
              </h2>

              <div className="space-y-2">
                {highscores.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No highscores yet</p>
                ) : (
                  highscores.map((hs, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded border ${
                        index === 0
                          ? 'bg-yellow-900/30 border-yellow-600'
                          : index === 1
                          ? 'bg-gray-700/30 border-gray-500'
                          : index === 2
                          ? 'bg-orange-900/30 border-orange-600'
                          : 'bg-gray-800/30 border-gray-700'
                      } ${
                        hs.score === statistics.finalScore &&
                        hs.turns === statistics.turns &&
                        hs.date === statistics.timestamp
                          ? 'ring-2 ring-yellow-400 animate-pulse'
                          : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-bold ${
                          index === 0 ? 'text-yellow-400' :
                          index === 1 ? 'text-gray-300' :
                          index === 2 ? 'text-orange-400' :
                          'text-gray-400'
                        }`}>
                          #{index + 1}
                        </span>
                        <span className="text-white font-semibold truncate flex-1">{hs.name}</span>
                        <span className="text-yellow-400 font-bold">{hs.score.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{hs.doctrine}</span>
                        <span>{hs.turns} turns</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(hs.date).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="flex items-center justify-center gap-4 py-6 bg-gray-900/50 border-t border-gray-700">
          <Button
            onClick={onRestart}
            className="px-8 py-6 text-lg bg-green-600 hover:bg-green-700"
          >
            <Rocket className="w-5 h-5 mr-2" />
            Play Again
          </Button>
          <Button
            onClick={onMainMenu}
            variant="outline"
            className="px-8 py-6 text-lg"
          >
            Main Menu
          </Button>
        </div>
      </div>
    </div>
  );
};

// Helper component for stat cards
const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}> = ({ icon, label, value, color }) => (
  <div className="bg-gray-800/30 p-2 rounded border border-gray-700/50 flex flex-col items-center text-center">
    <div className="flex items-center gap-1 mb-1 text-gray-400 text-xs">
      {icon}
      <span className="truncate">{label}</span>
    </div>
    <p className={`text-lg font-bold ${color} leading-tight`}>{value}</p>
  </div>
);
