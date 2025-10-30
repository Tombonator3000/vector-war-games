import React, { useState } from 'react';
import { X, TrendingUp, Users, Award, Shield, Zap, Radio, Plane, Anchor, Target, Beaker, Heart, Factory, Flag, Smile, Meh, Frown, AlertTriangle, Trophy, Skull, Building2, Sparkles } from 'lucide-react';
import { Nation } from '../types/game';
import type { GovernanceMetrics } from '@/hooks/useGovernance';
import { motion } from 'framer-motion';

interface CivilizationInfoPanelProps {
  nations: Nation[];
  isOpen: boolean;
  onClose: () => void;
  currentTurn: number;
  governanceMetrics?: Record<string, GovernanceMetrics>;
}

type TabType = 'own-status' | 'enemy-status' | 'diplomacy';

export const CivilizationInfoPanel: React.FC<CivilizationInfoPanelProps> = ({
  nations,
  isOpen,
  onClose,
  currentTurn,
  governanceMetrics = {}
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('own-status');

  if (!isOpen) return null;

  const player = nations.find(n => n?.isPlayer);
  const enemies = nations.filter(n => n && !n.isPlayer && n.population > 0);

  if (!player) return null;

  // Calculate win condition progress
  const totalNations = nations.filter(n => n).length;
  const enemiesEliminated = nations.filter(n => n && !n.isPlayer && n.population <= 0).length;
  const militaryProgress = totalNations > 1 ? (enemiesEliminated / (totalNations - 1)) * 100 : 0;
  const economicProgress = Math.min(100, (player.cities / 12) * 100);
  const culturalProgress = Math.min(100, ((player as any).culture || 0));

  // Calculate total military power
  const calculateMilitaryPower = (nation: Nation): number => {
    const missileValue = nation.missiles * 10;
    const bomberValue = nation.bombers * 8;
    const submarineValue = nation.submarines * 12;
    const defenseValue = nation.defense * 5;
    const warheadCount = Object.values(nation.warheads || {}).reduce((sum, count) => sum + count, 0);
    const warheadValue = warheadCount * 15;
    return missileValue + bomberValue + submarineValue + defenseValue + warheadValue;
  };

  const renderResourceBar = (current: number, max: number, color: string) => (
    <div className="w-full bg-gray-700 rounded h-2 overflow-hidden">
      <div
        className={`h-full ${color} transition-all duration-300`}
        style={{ width: `${Math.min(100, (current / max) * 100)}%` }}
      />
    </div>
  );

  const renderProgressBar = (progress: number, color: string) => (
    <div className="w-full bg-gray-700 rounded h-3 overflow-hidden">
      <div
        className={`h-full ${color} transition-all duration-300`}
        style={{ width: `${Math.min(100, progress)}%` }}
      />
    </div>
  );

  // Helper functions for morale display
  const getMoraleColor = (value: number) => {
    if (value >= 80) return 'linear-gradient(90deg, #34d399 0%, #22d3ee 100%)';
    if (value >= 60) return 'linear-gradient(90deg, #38bdf8 0%, #818cf8 100%)';
    if (value >= 40) return 'linear-gradient(90deg, #f59e0b 0%, #f97316 100%)';
    return 'linear-gradient(90deg, #f87171 0%, #ef4444 100%)';
  };

  const getMoraleIcon = (value: number) => {
    if (value >= 80) return Smile;
    if (value >= 60) return Meh;
    if (value >= 40) return Frown;
    return AlertTriangle;
  };

  const getMoraleIconColor = (value: number) => {
    if (value >= 80) return 'text-emerald-400';
    if (value >= 60) return 'text-sky-400';
    if (value >= 40) return 'text-amber-400';
    return 'text-red-400';
  };

  const getMoraleLabel = (value: number) => {
    if (value >= 80) return 'High';
    if (value >= 60) return 'Good';
    if (value >= 40) return 'Low';
    return 'Critical';
  };

  const clamp = (value: number, min: number, max: number) => {
    return Math.min(max, Math.max(min, value));
  };

  const renderOwnStatus = () => (
    <div className="space-y-6">
      {/* Resources Section */}
      <div>
        <h3 className="text-lg font-bold text-yellow-400 mb-3 flex items-center gap-2">
          <Factory className="w-5 h-5" />
          Resources
        </h3>
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-gray-800/50 p-3 rounded">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-300 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                Production
              </span>
              <span className="text-white font-bold">{Math.floor(player.production)}</span>
            </div>
            {renderResourceBar(player.production, 1000, 'bg-yellow-500')}
          </div>

          <div className="bg-gray-800/50 p-3 rounded">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-300 flex items-center gap-2">
                <Radio className="w-4 h-4 text-green-500" />
                Uranium
              </span>
              <span className="text-white font-bold">{Math.floor(player.uranium)}</span>
            </div>
            {renderResourceBar(player.uranium, 500, 'bg-green-500')}
          </div>

          <div className="bg-gray-800/50 p-3 rounded">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-300 flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-500" />
                Intel
              </span>
              <span className="text-white font-bold">{Math.floor(player.intel)}</span>
            </div>
            {renderResourceBar(player.intel, 500, 'bg-blue-500')}
          </div>
        </div>
      </div>

      {/* Military Strength */}
      <div>
        <h3 className="text-lg font-bold text-red-400 mb-3 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Military Forces
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-800/50 p-3 rounded">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-red-400" />
              <span className="text-sm text-gray-300">Missiles</span>
            </div>
            <span className="text-white font-bold text-xl">{player.missiles}</span>
          </div>

          <div className="bg-gray-800/50 p-3 rounded">
            <div className="flex items-center gap-2 mb-1">
              <Plane className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-300">Bombers</span>
            </div>
            <span className="text-white font-bold text-xl">{player.bombers}</span>
          </div>

          <div className="bg-gray-800/50 p-3 rounded">
            <div className="flex items-center gap-2 mb-1">
              <Anchor className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-gray-300">Submarines</span>
            </div>
            <span className="text-white font-bold text-xl">{player.submarines}</span>
          </div>

          <div className="bg-gray-800/50 p-3 rounded">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-300">Defense</span>
            </div>
            <span className="text-white font-bold text-xl">{player.defense}</span>
          </div>
        </div>

        <div className="mt-3 bg-gray-800/50 p-3 rounded">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-300">Total Warheads</span>
            <span className="text-white font-bold">
              {Object.values(player.warheads || {}).reduce((sum, count) => sum + count, 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Victory Progress - Enhanced */}
      <div>
        <h3 className="text-lg font-bold text-cyan-400 mb-3 flex items-center gap-2">
          <Trophy className={`w-5 h-5 ${Math.max(militaryProgress, economicProgress, culturalProgress) >= 70 ? 'text-yellow-400 animate-pulse' : 'text-cyan-400'}`} />
          Victory Progress
        </h3>
        <div className="bg-gray-800/50 p-4 rounded-lg border border-cyan-500/30">
          <div className="space-y-4">
            {/* Military Victory */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Skull className="w-4 h-4 text-red-400" />
                  <span className="text-sm font-mono text-cyan-200">Military</span>
                  {militaryProgress === Math.max(militaryProgress, economicProgress, culturalProgress) && militaryProgress >= 50 && (
                    <span className="text-[10px] text-yellow-400 font-bold animate-pulse">
                      LEADING
                    </span>
                  )}
                </div>
                <span className="text-sm font-mono text-cyan-300 font-bold">
                  {Math.round(militaryProgress)}%
                </span>
              </div>
              <div className="relative h-3 bg-gray-900 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${militaryProgress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={`h-full bg-red-500 ${militaryProgress >= 90 ? 'animate-pulse' : ''}`}
                />
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Eliminated {enemiesEliminated} / {totalNations - 1} nations
              </div>
            </div>

            {/* Economic Victory */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-mono text-cyan-200">Economic</span>
                  {economicProgress === Math.max(militaryProgress, economicProgress, culturalProgress) && economicProgress >= 50 && (
                    <span className="text-[10px] text-yellow-400 font-bold animate-pulse">
                      LEADING
                    </span>
                  )}
                </div>
                <span className="text-sm font-mono text-cyan-300 font-bold">
                  {Math.round(economicProgress)}%
                </span>
              </div>
              <div className="relative h-3 bg-gray-900 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${economicProgress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={`h-full bg-green-500 ${economicProgress >= 90 ? 'animate-pulse' : ''}`}
                />
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Control {player.cities} / 12 cities
              </div>
            </div>

            {/* Cultural Victory */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-mono text-cyan-200">Cultural</span>
                  {culturalProgress === Math.max(militaryProgress, economicProgress, culturalProgress) && culturalProgress >= 50 && (
                    <span className="text-[10px] text-yellow-400 font-bold animate-pulse">
                      LEADING
                    </span>
                  )}
                </div>
                <span className="text-sm font-mono text-cyan-300 font-bold">
                  {Math.round(culturalProgress)}%
                </span>
              </div>
              <div className="relative h-3 bg-gray-900 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${culturalProgress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={`h-full bg-purple-500 ${culturalProgress >= 90 ? 'animate-pulse' : ''}`}
                />
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Cultural influence: {(player as any).culture || 0} / 100
              </div>
            </div>
          </div>

          {/* Victory warning */}
          {Math.max(militaryProgress, economicProgress, culturalProgress) >= 70 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded"
            >
              <p className="text-xs text-yellow-200 text-center font-mono">
                ⚠️ Victory approaching! Press your advantage!
              </p>
            </motion.div>
          )}

          <p className="mt-3 text-[10px] text-cyan-400/60 text-center">
            First to 100% wins
          </p>
        </div>
      </div>

      {/* Morale Outlook - All Nations */}
      <div>
        <h3 className="text-lg font-bold text-cyan-300 mb-3 flex items-center gap-2">
          <Heart className="w-5 h-5" />
          Morale Outlook
        </h3>
        <div className="bg-gray-800/50 p-4 rounded-lg border border-cyan-500/30">
          <div className="space-y-3">
            {nations.map((nation) => {
              const snapshot = governanceMetrics[nation.id];
              const morale = snapshot?.morale ?? nation.morale ?? 0;
              const gradient = getMoraleColor(morale);
              const MoraleIcon = getMoraleIcon(morale);
              const moraleLabel = getMoraleLabel(morale);
              const iconColor = getMoraleIconColor(morale);

              return (
                <motion.div
                  key={nation.id}
                  className="flex flex-col gap-1.5"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <MoraleIcon className={`w-4 h-4 ${iconColor}`} />
                      <span className={`font-semibold ${nation.isPlayer ? 'text-emerald-300' : 'text-cyan-200/90'}`}>
                        {nation.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] uppercase tracking-wider font-bold ${iconColor}`}>
                        {moraleLabel}
                      </span>
                      <span className="font-mono text-cyan-100 font-bold">{Math.round(morale)}%</span>
                    </div>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-900/50 border border-slate-700/50">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: gradient }}
                      initial={{ width: 0 }}
                      animate={{ width: `${clamp(morale, 0, 100)}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-cyan-500/20">
            <p className="text-[10px] text-cyan-400/60 text-center">
              Population sentiment indicator
            </p>
          </div>
        </div>
      </div>

      {/* Nation Stats */}
      <div>
        <h3 className="text-lg font-bold text-green-400 mb-3 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Nation Statistics
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-800/50 p-3 rounded">
            <div className="text-sm text-gray-300 mb-1">Population</div>
            <span className="text-white font-bold text-lg">
              {(player.population / 1000000).toFixed(1)}M
            </span>
          </div>

          <div className="bg-gray-800/50 p-3 rounded">
            <div className="text-sm text-gray-300 mb-1">Cities</div>
            <span className="text-white font-bold text-lg">{player.cities}</span>
          </div>

          <div className="bg-gray-800/50 p-3 rounded">
            <div className="text-sm text-gray-300 mb-1 flex items-center gap-1">
              <Heart className="w-3 h-3" />
              Morale
            </div>
            <span className="text-white font-bold text-lg">{player.morale.toFixed(0)}%</span>
          </div>

          <div className="bg-gray-800/50 p-3 rounded">
            <div className="text-sm text-gray-300 mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Public Opinion
            </div>
            <span className="text-white font-bold text-lg">{player.publicOpinion.toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* Research Progress */}
      <div>
        <h3 className="text-lg font-bold text-cyan-400 mb-3 flex items-center gap-2">
          <Beaker className="w-5 h-5" />
          Research & Development
        </h3>
        <div className="bg-gray-800/50 p-3 rounded">
          <div className="text-sm text-gray-300 mb-2">Completed Projects</div>
          <div className="text-white font-bold text-lg mb-3">
            {Object.keys(player.researched || {}).filter(k => player.researched[k]).length}
          </div>

          {player.researchQueue && player.researchQueue.length > 0 && (
            <div className="border-t border-gray-700 pt-3 mt-3">
              <div className="text-sm text-gray-300 mb-2">Current Research</div>
              {player.researchQueue.map((item, idx) => (
                <div key={idx} className="mb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">{item.projectId}</span>
                    <span className="text-white">{item.turnsRemaining} turns</span>
                  </div>
                  {renderProgressBar(
                    ((item.totalTurns - item.turnsRemaining) / item.totalTurns) * 100,
                    'bg-cyan-500'
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderEnemyStatus = () => (
    <div className="space-y-4">
      <div className="text-sm text-gray-400 mb-4">
        Monitoring {enemies.length} active nation{enemies.length !== 1 ? 's' : ''}
      </div>

      {enemies.map((enemy) => {
        const militaryPower = calculateMilitaryPower(enemy);
        const playerMilitaryPower = calculateMilitaryPower(player);
        const powerRatio = playerMilitaryPower > 0
          ? (militaryPower / playerMilitaryPower) * 100
          : 100;

        const hasAlliance = player.treaties?.[enemy.id]?.alliance;
        const hasTruce = (player.treaties?.[enemy.id]?.truceTurns || 0) > 0;
        const truceTurnsLeft = player.treaties?.[enemy.id]?.truceTurns || 0;

        // Calculate enemy win condition progress
        const enemyEliminatedCount = nations.filter(n =>
          n && n.id !== enemy.id && !n.isPlayer && n.population <= 0
        ).length;
        const enemyMilitaryProgress = totalNations > 1
          ? (enemyEliminatedCount / (totalNations - 1)) * 100
          : 0;
        const enemyEconomicProgress = Math.min(100, (enemy.cities / 12) * 100);
        const enemyCulturalProgress = Math.min(100, ((enemy as any).culture || 0));

        const maxProgress = Math.max(
          enemyMilitaryProgress,
          enemyEconomicProgress,
          enemyCulturalProgress
        );

        return (
          <div
            key={enemy.id}
            className="bg-gray-800/70 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
          >
            {/* Nation Header */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: enemy.color }}
                  />
                  <h4 className="text-white font-bold">{enemy.name}</h4>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Led by {enemy.leader} • {enemy.doctrine}
                </div>
              </div>

              <div className="text-right">
                {hasAlliance && (
                  <div className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                    Allied
                  </div>
                )}
                {hasTruce && !hasAlliance && (
                  <div className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                    Truce ({truceTurnsLeft} turns)
                  </div>
                )}
                {!hasAlliance && !hasTruce && (
                  <div className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
                    Hostile
                  </div>
                )}
              </div>
            </div>

            {/* Military Comparison */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Military Power vs You</span>
                <span className={powerRatio > 120 ? 'text-red-400' : powerRatio < 80 ? 'text-green-400' : 'text-yellow-400'}>
                  {powerRatio.toFixed(0)}%
                </span>
              </div>
              {renderProgressBar(
                Math.min(100, powerRatio),
                powerRatio > 120 ? 'bg-red-500' : powerRatio < 80 ? 'bg-green-500' : 'bg-yellow-500'
              )}
            </div>

            {/* Resources Grid */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              <div className="bg-gray-900/50 p-2 rounded text-center">
                <Target className="w-3 h-3 text-red-400 mx-auto mb-1" />
                <div className="text-xs text-gray-400">Missiles</div>
                <div className="text-white font-bold text-sm">{enemy.missiles}</div>
              </div>

              <div className="bg-gray-900/50 p-2 rounded text-center">
                <Plane className="w-3 h-3 text-blue-400 mx-auto mb-1" />
                <div className="text-xs text-gray-400">Bombers</div>
                <div className="text-white font-bold text-sm">{enemy.bombers}</div>
              </div>

              <div className="bg-gray-900/50 p-2 rounded text-center">
                <Anchor className="w-3 h-3 text-cyan-400 mx-auto mb-1" />
                <div className="text-xs text-gray-400">Subs</div>
                <div className="text-white font-bold text-sm">{enemy.submarines}</div>
              </div>

              <div className="bg-gray-900/50 p-2 rounded text-center">
                <Shield className="w-3 h-3 text-green-400 mx-auto mb-1" />
                <div className="text-xs text-gray-400">Defense</div>
                <div className="text-white font-bold text-sm">{enemy.defense}</div>
              </div>
            </div>

            {/* Victory Progress */}
            <div className="border-t border-gray-700 pt-3">
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>Closest to Victory</span>
                <span className={maxProgress > 70 ? 'text-red-400 font-bold' : 'text-gray-300'}>
                  {maxProgress.toFixed(1)}%
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="text-xs text-gray-500 w-16">Military</div>
                  <div className="flex-1">
                    {renderProgressBar(enemyMilitaryProgress, 'bg-red-500')}
                  </div>
                  <div className="text-xs text-gray-400 w-12 text-right">
                    {enemyMilitaryProgress.toFixed(0)}%
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-gray-500 w-16">Economic</div>
                  <div className="flex-1">
                    {renderProgressBar(enemyEconomicProgress, 'bg-yellow-500')}
                  </div>
                  <div className="text-xs text-gray-400 w-12 text-right">
                    {enemyEconomicProgress.toFixed(0)}%
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-gray-500 w-16">Cultural</div>
                  <div className="flex-1">
                    {renderProgressBar(enemyCulturalProgress, 'bg-purple-500')}
                  </div>
                  <div className="text-xs text-gray-400 w-12 text-right">
                    {enemyCulturalProgress.toFixed(0)}%
                  </div>
                </div>
              </div>

              {maxProgress > 70 && (
                <div className="mt-2 text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded text-center">
                  Warning: Close to victory!
                </div>
              )}
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-700">
              <div className="text-center">
                <div className="text-xs text-gray-500">Population</div>
                <div className="text-white text-sm font-bold">
                  {(enemy.population / 1000000).toFixed(1)}M
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500">Cities</div>
                <div className="text-white text-sm font-bold">{enemy.cities}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500">Morale</div>
                <div className="text-white text-sm font-bold">
                  {enemy.morale.toFixed(0)}%
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderDiplomacy = () => {
    const allRelations = enemies.map(enemy => {
      const hasAlliance = player.treaties?.[enemy.id]?.alliance;
      const hasTruce = (player.treaties?.[enemy.id]?.truceTurns || 0) > 0;
      const truceTurnsLeft = player.treaties?.[enemy.id]?.truceTurns || 0;
      const isSanctioned = enemy.sanctioned?.includes(player.id);
      const playerSanctionsEnemy = player.sanctioned?.includes(enemy.id);

      return {
        nation: enemy,
        hasAlliance,
        hasTruce,
        truceTurnsLeft,
        isSanctioned,
        playerSanctionsEnemy,
        relation: hasAlliance ? 'allied' : hasTruce ? 'truce' : 'hostile'
      };
    });

    const allies = allRelations.filter(r => r.hasAlliance);
    const neutral = allRelations.filter(r => r.hasTruce && !r.hasAlliance);
    const hostile = allRelations.filter(r => !r.hasTruce && !r.hasAlliance);

    return (
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-500/20 border border-green-500/30 rounded p-3 text-center">
            <div className="text-2xl font-bold text-green-400">{allies.length}</div>
            <div className="text-xs text-green-300">Allied</div>
          </div>
          <div className="bg-blue-500/20 border border-blue-500/30 rounded p-3 text-center">
            <div className="text-2xl font-bold text-blue-400">{neutral.length}</div>
            <div className="text-xs text-blue-300">Neutral</div>
          </div>
          <div className="bg-red-500/20 border border-red-500/30 rounded p-3 text-center">
            <div className="text-2xl font-bold text-red-400">{hostile.length}</div>
            <div className="text-xs text-red-300">Hostile</div>
          </div>
        </div>

        {/* Allies */}
        {allies.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-green-400 mb-2 flex items-center gap-2">
              <Flag className="w-4 h-4" />
              Allied Nations
            </h3>
            <div className="space-y-2">
              {allies.map(({ nation, isSanctioned, playerSanctionsEnemy }) => (
                <div key={nation.id} className="bg-gray-800/50 border border-green-500/30 rounded p-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: nation.color }} />
                      <span className="text-white font-medium">{nation.name}</span>
                    </div>
                    <div className="text-xs text-gray-400">{nation.leader}</div>
                  </div>
                  {(isSanctioned || playerSanctionsEnemy) && (
                    <div className="mt-2 text-xs text-yellow-400">
                      {isSanctioned && '⚠ They sanctioned you • '}
                      {playerSanctionsEnemy && '⚠ You sanctioned them'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Neutral */}
        {neutral.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-blue-400 mb-2">Neutral Relations (Truce)</h3>
            <div className="space-y-2">
              {neutral.map(({ nation, truceTurnsLeft, isSanctioned, playerSanctionsEnemy }) => (
                <div key={nation.id} className="bg-gray-800/50 border border-blue-500/30 rounded p-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: nation.color }} />
                      <span className="text-white font-medium">{nation.name}</span>
                    </div>
                    <div className="text-xs text-blue-400">
                      Truce expires in {truceTurnsLeft} turns
                    </div>
                  </div>
                  {(isSanctioned || playerSanctionsEnemy) && (
                    <div className="mt-2 text-xs text-yellow-400">
                      {isSanctioned && '⚠ They sanctioned you • '}
                      {playerSanctionsEnemy && '⚠ You sanctioned them'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hostile */}
        {hostile.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-red-400 mb-2">Hostile Nations</h3>
            <div className="space-y-2">
              {hostile.map(({ nation, isSanctioned, playerSanctionsEnemy }) => (
                <div key={nation.id} className="bg-gray-800/50 border border-red-500/30 rounded p-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: nation.color }} />
                      <span className="text-white font-medium">{nation.name}</span>
                    </div>
                    <div className="text-xs text-red-400">At War</div>
                  </div>
                  {(isSanctioned || playerSanctionsEnemy) && (
                    <div className="mt-2 text-xs text-yellow-400">
                      {isSanctioned && '⚠ They sanctioned you • '}
                      {playerSanctionsEnemy && '⚠ You sanctioned them'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-gray-900 border-2 border-yellow-600 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-900 to-yellow-700 p-4 flex justify-between items-center rounded-t-lg">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Civilization Status Report
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-red-400 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 bg-gray-800">
          <button
            onClick={() => setActiveTab('own-status')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'own-status'
                ? 'bg-gray-900 text-yellow-400 border-b-2 border-yellow-400'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Shield className="w-4 h-4" />
              Your Empire
            </div>
          </button>
          <button
            onClick={() => setActiveTab('enemy-status')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'enemy-status'
                ? 'bg-gray-900 text-yellow-400 border-b-2 border-yellow-400'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Users className="w-4 h-4" />
              Enemy Nations
            </div>
          </button>
          <button
            onClick={() => setActiveTab('diplomacy')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'diplomacy'
                ? 'bg-gray-900 text-yellow-400 border-b-2 border-yellow-400'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Flag className="w-4 h-4" />
              Diplomacy
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'own-status' && renderOwnStatus()}
          {activeTab === 'enemy-status' && renderEnemyStatus()}
          {activeTab === 'diplomacy' && renderDiplomacy()}
        </div>

        {/* Footer */}
        <div className="bg-gray-800 p-3 rounded-b-lg border-t border-gray-700">
          <div className="text-center text-xs text-gray-400">
            Turn {currentTurn} • Press 'I' to toggle this panel
          </div>
        </div>
      </div>
    </div>
  );
};
