import React from 'react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Trophy, Skull, Rocket, Medal, Award, Star, Newspaper, Globe, Swords, ShieldCheck, Users, Building2, Factory, Atom, Brain, Heart, ThumbsUp, Briefcase, Bomb, Target, Handshake, AlertTriangle } from 'lucide-react';

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

  // Format the date like a newspaper
  const gameDate = new Date(statistics.timestamp);
  const formattedDate = gameDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Generate a dramatic subheadline based on game outcome
  const getSubheadline = () => {
    if (isVictory) {
      if (statistics.enemiesDestroyed > 3) {
        return "Total Domination Achieved Through Superior Firepower";
      } else if (statistics.alliances >= 3) {
        return "Diplomatic Mastery Secures Lasting Peace";
      } else if (statistics.nukesLaunched === 0) {
        return "Peace Prevails Without Nuclear Escalation";
      } else {
        return "Strategic Excellence Leads Nation to Glory";
      }
    } else {
      if (statistics.nukesReceived > 5) {
        return "Nuclear Holocaust Devastates Nation";
      } else if (statistics.finalPopulation < 10) {
        return "Population Decimated in Catastrophic Conflict";
      } else if (statistics.finalDefcon === 1) {
        return "Doomsday Clock Strikes Midnight";
      } else {
        return "Nation Falls After Prolonged Conflict";
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden">
      {/* Background - Victory: Golden rays, Defeat: Dark storm */}
      <div className={`absolute inset-0 ${
        isVictory
          ? 'bg-gradient-to-b from-amber-900 via-yellow-950 to-stone-900'
          : 'bg-gradient-to-b from-stone-950 via-red-950 to-black'
      }`}>
        {/* Animated background elements */}
        {isVictory ? (
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute top-20 right-1/4 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl animate-pulse delay-300" />
          </div>
        ) : (
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-900/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-red-800/20 rounded-full blur-3xl animate-pulse delay-500" />
          </div>
        )}
      </div>

      {/* Newspaper Container */}
      <div className="relative w-full max-w-5xl h-[90vh] flex flex-col bg-amber-50 shadow-2xl border-4 border-stone-800 overflow-hidden">
        {/* Newspaper texture overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuOCIgbnVtT2N0YXZlcz0iNCIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZSkiIG9wYWNpdHk9IjAuMDUiLz48L3N2Zz4=')] pointer-events-none" />

        <ScrollArea className="flex-1">
          <div className="p-6 md:p-8">
            {/* Newspaper Masthead */}
            <div className="text-center border-b-4 border-double border-stone-800 pb-4 mb-4">
              <div className="flex items-center justify-center gap-2 text-stone-600 text-sm mb-1">
                <Newspaper className="w-4 h-4" />
                <span className="tracking-widest uppercase">Special Edition</span>
                <Globe className="w-4 h-4" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-stone-900 tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
                THE WAR CHRONICLE
              </h1>
              <div className="flex items-center justify-between text-xs text-stone-600 mt-2 border-t border-stone-300 pt-2">
                <span>{formattedDate}</span>
                <span className="font-semibold">FINAL EDITION</span>
                <span>Turn {statistics.turns}</span>
              </div>
            </div>

            {/* Main Headline Banner */}
            <div className={`relative text-center py-6 mb-6 border-4 ${
              isVictory
                ? 'bg-gradient-to-r from-green-100 via-emerald-50 to-green-100 border-green-800'
                : 'bg-gradient-to-r from-red-100 via-red-50 to-red-100 border-red-800'
            }`}>
              {/* Corner decorations */}
              <div className={`absolute top-2 left-2 ${isVictory ? 'text-green-700' : 'text-red-700'}`}>
                {isVictory ? <Star className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
              </div>
              <div className={`absolute top-2 right-2 ${isVictory ? 'text-green-700' : 'text-red-700'}`}>
                {isVictory ? <Star className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
              </div>

              {/* Victory/Defeat Icon */}
              <div className="flex items-center justify-center mb-3">
                {isVictory ? (
                  <div className="relative">
                    <Trophy className="w-16 h-16 text-yellow-600 drop-shadow-lg" />
                    <div className="absolute -inset-2 bg-yellow-400/30 rounded-full blur-xl animate-pulse -z-10" />
                  </div>
                ) : (
                  <div className="relative">
                    <Skull className="w-16 h-16 text-red-700 drop-shadow-lg" />
                    <div className="absolute -inset-2 bg-red-500/30 rounded-full blur-xl animate-pulse -z-10" />
                  </div>
                )}
              </div>

              {/* Main headline */}
              <h2 className={`text-5xl md:text-7xl font-black tracking-tighter mb-2 ${
                isVictory ? 'text-green-900' : 'text-red-900'
              }`} style={{ fontFamily: 'Georgia, serif' }}>
                {isVictory ? 'VICTORY!' : 'DEFEAT'}
              </h2>

              {/* Subheadline */}
              <p className={`text-lg md:text-xl font-semibold ${
                isVictory ? 'text-green-800' : 'text-red-800'
              }`} style={{ fontFamily: 'Georgia, serif' }}>
                {getSubheadline()}
              </p>

              {/* Leader attribution */}
              <p className="text-stone-600 mt-3 text-sm">
                Under the leadership of <span className="font-bold text-stone-800">{statistics.leader}</span> of <span className="font-bold text-stone-800">{statistics.playerName}</span>
              </p>

              {/* New Highscore Banner */}
              {isNewHighscore && (
                <div className="mt-4 inline-flex items-center gap-2 bg-yellow-400 text-yellow-900 px-4 py-2 rounded-sm border-2 border-yellow-600 animate-bounce">
                  <Award className="w-5 h-5" />
                  <span className="font-black text-lg">NEW RECORD - RANK #{highscoreRank}!</span>
                  <Award className="w-5 h-5" />
                </div>
              )}
            </div>

            {/* Victory Message */}
            <div className="text-center mb-6 px-4">
              <p className="text-xl md:text-2xl text-stone-700 italic" style={{ fontFamily: 'Georgia, serif' }}>
                "{statistics.victoryMessage}"
              </p>
            </div>

            {/* Score Banner */}
            <div className="bg-stone-800 text-amber-50 p-4 mb-6 flex items-center justify-center gap-8 flex-wrap">
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider text-stone-400">Final Score</p>
                <p className="text-4xl font-black text-yellow-400">{statistics.finalScore.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider text-stone-400">Turns Survived</p>
                <p className="text-4xl font-black text-amber-300">{statistics.turns}</p>
              </div>
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider text-stone-400">Doctrine</p>
                <p className="text-2xl font-bold text-amber-200">{statistics.doctrine}</p>
              </div>
            </div>

            {/* Newspaper Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {/* Nation Status Article */}
              <article className="border border-stone-300 p-4 bg-white/50">
                <h3 className="font-black text-lg text-stone-900 border-b-2 border-stone-800 pb-1 mb-3 flex items-center gap-2" style={{ fontFamily: 'Georgia, serif' }}>
                  <Globe className="w-5 h-5" />
                  Nation Status
                </h3>
                <div className="space-y-2 text-sm">
                  <StatRow icon={<Users className="w-4 h-4" />} label="Population" value={`${statistics.finalPopulation.toLocaleString()}M`} />
                  <StatRow icon={<Building2 className="w-4 h-4" />} label="Cities" value={statistics.finalCities.toString()} />
                  <StatRow icon={<Factory className="w-4 h-4" />} label="Production" value={`${statistics.finalProduction}/turn`} />
                  <StatRow icon={<Atom className="w-4 h-4" />} label="Uranium Reserves" value={statistics.finalUranium.toString()} />
                  <StatRow icon={<Brain className="w-4 h-4" />} label="Intelligence" value={statistics.finalIntel.toString()} />
                  <div className={`flex items-center justify-between p-2 rounded ${
                    statistics.finalDefcon >= 4 ? 'bg-green-100' : statistics.finalDefcon >= 3 ? 'bg-yellow-100' : 'bg-red-100'
                  }`}>
                    <span className="flex items-center gap-1 font-medium">
                      <AlertTriangle className="w-4 h-4" />
                      DEFCON Level
                    </span>
                    <span className={`font-black text-lg ${
                      statistics.finalDefcon >= 4 ? 'text-green-700' : statistics.finalDefcon >= 3 ? 'text-yellow-700' : 'text-red-700'
                    }`}>{statistics.finalDefcon}</span>
                  </div>
                </div>
              </article>

              {/* Military Arsenal Article */}
              <article className="border border-stone-300 p-4 bg-white/50">
                <h3 className="font-black text-lg text-stone-900 border-b-2 border-stone-800 pb-1 mb-3 flex items-center gap-2" style={{ fontFamily: 'Georgia, serif' }}>
                  <Swords className="w-5 h-5" />
                  Military Arsenal
                </h3>
                <div className="space-y-2 text-sm">
                  <StatRow icon={<Rocket className="w-4 h-4 text-red-600" />} label="ICBMs" value={statistics.finalMissiles.toString()} highlight={statistics.finalMissiles > 10} />
                  <StatRow icon={<Rocket className="w-4 h-4 text-orange-600" />} label="Strategic Bombers" value={statistics.finalBombers.toString()} />
                  <StatRow icon={<Rocket className="w-4 h-4 text-blue-600" />} label="Nuclear Submarines" value={statistics.finalSubmarines.toString()} />
                  <StatRow icon={<ShieldCheck className="w-4 h-4 text-green-600" />} label="Defense Systems" value={statistics.finalDefense.toString()} />
                </div>
                <div className="mt-3 pt-3 border-t border-stone-300">
                  <p className="text-xs text-stone-500 italic">
                    Total nuclear capability: {statistics.finalMissiles + statistics.finalBombers + statistics.finalSubmarines} delivery systems
                  </p>
                </div>
              </article>

              {/* Public Opinion Article */}
              <article className="border border-stone-300 p-4 bg-white/50">
                <h3 className="font-black text-lg text-stone-900 border-b-2 border-stone-800 pb-1 mb-3 flex items-center gap-2" style={{ fontFamily: 'Georgia, serif' }}>
                  <Users className="w-5 h-5" />
                  Public Sentiment
                </h3>
                <div className="space-y-3">
                  <MeterRow icon={<Heart className="w-4 h-4" />} label="National Morale" value={statistics.finalMorale} />
                  <MeterRow icon={<ThumbsUp className="w-4 h-4" />} label="Public Opinion" value={statistics.finalPublicOpinion} />
                  <MeterRow icon={<Briefcase className="w-4 h-4" />} label="Cabinet Approval" value={statistics.finalCabinetApproval} />
                </div>
              </article>

              {/* Combat Report Article */}
              <article className="border border-stone-300 p-4 bg-white/50">
                <h3 className="font-black text-lg text-stone-900 border-b-2 border-stone-800 pb-1 mb-3 flex items-center gap-2" style={{ fontFamily: 'Georgia, serif' }}>
                  <Bomb className="w-5 h-5" />
                  Combat Report
                </h3>
                <div className="space-y-2 text-sm">
                  <div className={`p-2 rounded ${statistics.nukesLaunched > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                    <StatRow icon={<Rocket className="w-4 h-4 text-red-600" />} label="Nukes Launched" value={statistics.nukesLaunched.toString()} />
                  </div>
                  <div className={`p-2 rounded ${statistics.nukesReceived > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                    <StatRow icon={<Target className="w-4 h-4 text-orange-600" />} label="Nukes Received" value={statistics.nukesReceived.toString()} />
                  </div>
                  <StatRow icon={<Skull className="w-4 h-4 text-stone-600" />} label="Enemies Destroyed" value={statistics.enemiesDestroyed.toString()} />
                </div>
                {statistics.nukesLaunched === 0 && statistics.nukesReceived === 0 && (
                  <p className="mt-3 text-xs text-green-700 font-semibold italic">
                    "A rare achievement - peace without nuclear devastation"
                  </p>
                )}
              </article>

              {/* Diplomacy Article */}
              <article className="border border-stone-300 p-4 bg-white/50">
                <h3 className="font-black text-lg text-stone-900 border-b-2 border-stone-800 pb-1 mb-3 flex items-center gap-2" style={{ fontFamily: 'Georgia, serif' }}>
                  <Handshake className="w-5 h-5" />
                  Diplomatic Relations
                </h3>
                <div className="space-y-2 text-sm">
                  <div className={`p-3 rounded text-center ${statistics.alliances > 0 ? 'bg-green-100' : 'bg-stone-100'}`}>
                    <p className="text-xs text-stone-500 uppercase">Allied Nations</p>
                    <p className={`text-3xl font-black ${statistics.alliances > 0 ? 'text-green-700' : 'text-stone-400'}`}>
                      {statistics.alliances}
                    </p>
                  </div>
                  <div className={`p-3 rounded text-center ${statistics.wars > 0 ? 'bg-red-100' : 'bg-stone-100'}`}>
                    <p className="text-xs text-stone-500 uppercase">Active Wars</p>
                    <p className={`text-3xl font-black ${statistics.wars > 0 ? 'text-red-700' : 'text-stone-400'}`}>
                      {statistics.wars}
                    </p>
                  </div>
                </div>
              </article>

              {/* Hall of Fame Article */}
              <article className="border border-stone-300 p-4 bg-white/50">
                <h3 className="font-black text-lg text-stone-900 border-b-2 border-stone-800 pb-1 mb-3 flex items-center gap-2" style={{ fontFamily: 'Georgia, serif' }}>
                  <Medal className="w-5 h-5 text-yellow-600" />
                  Hall of Fame
                </h3>
                <div className="space-y-1.5 text-sm max-h-48 overflow-y-auto">
                  {highscores.length === 0 ? (
                    <p className="text-stone-500 text-center py-4 italic">No records yet - be the first!</p>
                  ) : (
                    highscores.slice(0, 5).map((hs, index) => {
                      const isCurrentGame = hs.score === statistics.finalScore &&
                        hs.turns === statistics.turns &&
                        hs.date === statistics.timestamp;
                      return (
                        <div
                          key={index}
                          className={`flex items-center gap-2 p-1.5 rounded ${
                            isCurrentGame ? 'bg-yellow-100 ring-2 ring-yellow-400' :
                            index === 0 ? 'bg-yellow-50' :
                            index === 1 ? 'bg-stone-100' :
                            index === 2 ? 'bg-orange-50' : ''
                          }`}
                        >
                          <span className={`font-black w-6 text-center ${
                            index === 0 ? 'text-yellow-600' :
                            index === 1 ? 'text-stone-500' :
                            index === 2 ? 'text-orange-600' :
                            'text-stone-400'
                          }`}>
                            {index + 1}.
                          </span>
                          <span className="flex-1 truncate font-medium text-stone-800">{hs.name}</span>
                          <span className="font-bold text-yellow-700">{hs.score.toLocaleString()}</span>
                        </div>
                      );
                    })
                  )}
                </div>
                {highscores.length > 5 && (
                  <p className="text-xs text-stone-500 mt-2 text-center">
                    +{highscores.length - 5} more entries
                  </p>
                )}
              </article>
            </div>

            {/* Footer Quote */}
            <div className="text-center border-t-2 border-stone-300 pt-4 mb-4">
              <p className="text-sm text-stone-600 italic" style={{ fontFamily: 'Georgia, serif' }}>
                {isVictory
                  ? '"In the end, it is not the years in your life that count. It is the life in your years."'
                  : '"The only thing we learn from history is that we learn nothing from history."'}
              </p>
            </div>
          </div>
        </ScrollArea>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4 p-4 bg-stone-800 border-t-4 border-stone-900">
          <Button
            onClick={onRestart}
            className={`px-6 py-3 text-lg font-bold ${
              isVictory
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            }`}
          >
            <Rocket className="w-5 h-5 mr-2" />
            Play Again
          </Button>
          <Button
            onClick={onMainMenu}
            variant="outline"
            className="px-6 py-3 text-lg font-bold bg-amber-50 text-stone-800 border-stone-600 hover:bg-amber-100"
          >
            Main Menu
          </Button>
        </div>
      </div>
    </div>
  );
};

// Helper component for stat rows
const StatRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}> = ({ icon, label, value, highlight }) => (
  <div className={`flex items-center justify-between ${highlight ? 'font-semibold' : ''}`}>
    <span className="flex items-center gap-2 text-stone-700">
      {icon}
      {label}
    </span>
    <span className="font-bold text-stone-900">{value}</span>
  </div>
);

// Helper component for percentage meters
const MeterRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number;
}> = ({ icon, label, value }) => {
  const getColor = (val: number) => {
    if (val >= 70) return 'bg-green-500';
    if (val >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTextColor = (val: number) => {
    if (val >= 70) return 'text-green-700';
    if (val >= 40) return 'text-yellow-700';
    return 'text-red-700';
  };

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="flex items-center gap-1 text-stone-700">
          {icon}
          {label}
        </span>
        <span className={`font-bold ${getTextColor(value)}`}>{value}%</span>
      </div>
      <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor(value)} transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
};
