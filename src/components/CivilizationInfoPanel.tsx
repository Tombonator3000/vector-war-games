import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { X, TrendingUp, Users, Award, Shield, Zap, Radio, Plane, Anchor, Target, Beaker, Heart, Factory, Flag, Smile, Meh, Frown, AlertTriangle, Trophy, Skull, Building2, Sparkles, Calendar, ThumbsUp, FlaskConical, BookOpen, Table } from 'lucide-react';
import { GameDatabase } from './GameDatabase';
import { Nation } from '../types/game';
import type { GovernanceMetrics } from '@/hooks/useGovernance';
import type { VictoryAnalysis } from '@/types/victory';
import type { BioLabFacility, BioLabTier } from '@/types/bioLab';
import { VictoryPathsSection } from './VictoryPathsSection';
import { ResearchTreeFlow } from './ResearchTreeFlow';
import { UnifiedDiplomacyPanel } from './UnifiedDiplomacyPanel';
import { motion } from 'framer-motion';
import { DoctrineStatusPanel } from './DoctrineStatusPanel';
import type { DoctrineShiftState } from '@/types/doctrineIncidents';
import { ResourceStockpileDisplay } from './ResourceStockpileDisplay';
import { ResourceMarketPanel, MarketStatusBadge } from './ResourceMarketPanel';
import { LedgerTable } from './LedgerTable';
import { RESOURCE_INFO } from '@/types/territorialResources';
import type { ResourceMarket } from '@/lib/resourceMarketSystem';
import type { DepletionWarning } from '@/lib/resourceDepletionSystem';

interface CivilizationInfoPanelProps {
  nations: Nation[];
  isOpen: boolean;
  onClose: () => void;
  currentTurn: number;
  governanceMetrics?: Record<string, GovernanceMetrics>;
  victoryAnalysis: VictoryAnalysis;
  onStartResearch?: (nodeId: string) => void;
  onCancelResearch?: (nodeId: string) => void;
  bioLabFacility?: BioLabFacility;
  onStartBioLabConstruction?: (tier: BioLabTier) => void;
  onCancelBioLabConstruction?: () => void;
  defaultTab?: TabType;
  doctrineShiftState?: DoctrineShiftState;
  resourceMarket?: ResourceMarket;
  depletionWarnings?: DepletionWarning[];
  onOpenFullDiplomacy?: () => void;
}

type TabType = 'own-status' | 'ledger' | 'diplomacy' | 'research';

export const CivilizationInfoPanel: React.FC<CivilizationInfoPanelProps> = ({
  nations,
  isOpen,
  onClose,
  currentTurn,
  governanceMetrics = {},
  victoryAnalysis,
  onStartResearch,
  onCancelResearch,
  bioLabFacility,
  onStartBioLabConstruction,
  onCancelBioLabConstruction,
  defaultTab = 'own-status',
  doctrineShiftState,
  resourceMarket,
  depletionWarnings,
  onOpenFullDiplomacy,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);
  const [selectedNationId, setSelectedNationId] = useState<string | null>(null);
  const [showNukaPedia, setShowNukaPedia] = useState(false);

  // Reset to default tab when panel opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  const player = useMemo(() => nations.find(n => n?.isPlayer) ?? null, [nations]);
  const nonPlayerNations = useMemo(
    () => nations.filter(n => n && !n.isPlayer),
    [nations]
  );
  const enemies = useMemo(
    () => nonPlayerNations.filter(n => n.population > 0),
    [nonPlayerNations]
  );

  useEffect(() => {
    if (!isOpen) {
      setSelectedNationId(null);
      return;
    }

    const selectedExists = selectedNationId
      ? nations.some(nation => nation.id === selectedNationId)
      : false;

    if (!selectedExists) {
      const fallback = enemies[0] ?? nonPlayerNations[0] ?? player;
      setSelectedNationId(fallback ? fallback.id : null);
    }
  }, [isOpen, enemies, nonPlayerNations, player, nations, selectedNationId]);

  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleShortcut = (event: KeyboardEvent) => {
      // Shift + L = Strategic Ledger
      if (event.key.toLowerCase() === 'l' && event.shiftKey) {
        event.preventDefault();
        setActiveTab('ledger');
      }
      // Shift + R = Research
      else if (event.key.toLowerCase() === 'r' && event.shiftKey) {
        event.preventDefault();
        setActiveTab('research');
      }
      // Shift + E = Your Empire
      else if (event.key.toLowerCase() === 'e' && event.shiftKey) {
        event.preventDefault();
        setActiveTab('own-status');
      }
      // Shift + D = Diplomacy
      else if (event.key.toLowerCase() === 'd' && event.shiftKey) {
        event.preventDefault();
        setActiveTab('diplomacy');
      }
      // Shift + ? = Show keyboard shortcuts
      else if (event.key === '?' && event.shiftKey) {
        event.preventDefault();
        setShowShortcutsHelp(!showShortcutsHelp);
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [isOpen, showShortcutsHelp]);

  const selectedNation = useMemo(
    () => (selectedNationId ? nations.find(n => n.id === selectedNationId) ?? null : null),
    [nations, selectedNationId]
  );

  const handleLedgerSelect = useCallback((nationId: string) => {
    setSelectedNationId(nationId);
  }, []);

  const calculateMilitaryPower = useCallback((nation: Nation): number => {
    const missileValue = nation.missiles * 10;
    const bomberValue = nation.bombers * 8;
    const submarineValue = nation.submarines * 12;
    const defenseValue = nation.defense * 5;
    const warheadCount = Object.values(nation.warheads || {}).reduce((sum, count) => sum + count, 0);
    const warheadValue = warheadCount * 15;
    return missileValue + bomberValue + submarineValue + defenseValue + warheadValue;
  }, []);

  const playerMilitaryPower = useMemo(
    () => player ? calculateMilitaryPower(player) : 0,
    [calculateMilitaryPower, player]
  );

  if (!isOpen) return null;
  if (!player) return null;

  // Victory progress now handled by VictoryPathsSection using streamlined victory conditions

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

  const renderOwnStatus = () => {
    const severityStyles = {
      warning: {
        container: 'bg-amber-500/10 border-amber-500/40',
        label: 'Warning',
        text: 'text-amber-200',
      },
      critical: {
        container: 'bg-red-500/10 border-red-500/60',
        label: 'Critical',
        text: 'text-red-200',
      },
      depleted: {
        container: 'bg-red-900/40 border-red-500/70',
        label: 'Depleted',
        text: 'text-red-200',
      },
    } as const;
    const playerWarnings = depletionWarnings ?? [];

    return (
      <div className="space-y-6">
        <VictoryPathsSection
          {...victoryAnalysis}
          currentTurn={currentTurn}
        />

        {player.doctrine && (
          <div>
            <h3 className="text-lg font-bold text-cyan-400 mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Doctrine Status
            </h3>
            <div className="bg-gray-800/50 border border-cyan-500/30 rounded-lg p-4">
              <DoctrineStatusPanel
                playerNation={player}
                allNations={nations}
                shiftState={doctrineShiftState}
                className="bg-transparent border-0 p-0"
              />
            </div>
          </div>
        )}

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

        {/* Strategic Resources Section */}
        {player.resourceStockpile && (
          <div>
            <h3 className="text-lg font-bold text-amber-300 mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Strategic Resources
            </h3>
            <div className="bg-gray-800/50 p-4 rounded-lg border border-amber-500/30">
              <ResourceStockpileDisplay nation={player} />
            </div>
          </div>
        )}

        {resourceMarket && (
          <div>
            <h3 className="text-lg font-bold text-cyan-300 mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Global Resource Market
            </h3>
            <div className="bg-gray-800/50 p-4 rounded-lg border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-cyan-200/80">
                <span>Live Pricing</span>
                <MarketStatusBadge market={resourceMarket} />
              </div>
              <ResourceMarketPanel market={resourceMarket} />
            </div>
          </div>
        )}

        {playerWarnings.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-red-300 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Resource Depletion Alerts
            </h3>
            <div className="space-y-2">
              {playerWarnings.map(warning => {
                const info = RESOURCE_INFO[warning.resource];
                const style = severityStyles[warning.severity];
                const isDepleted = warning.severity === 'depleted';
                const Icon = isDepleted ? Skull : AlertTriangle;

                return (
                  <div
                    key={`${warning.territoryId}-${warning.resource}`}
                    className={`border rounded-lg p-3 flex items-start gap-3 ${style.container}`}
                  >
                    <Icon className={`w-4 h-4 mt-0.5 ${style.text}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm font-semibold">
                        <span className="flex items-center gap-2">
                          <span>{info.icon}</span>
                          <span>{info.name}</span>
                        </span>
                        <span className={`text-xs uppercase tracking-[0.25em] font-bold ${style.text}`}>
                          {style.label}
                        </span>
                      </div>
                      <div className="text-xs text-gray-300/90 mt-1">
                        {warning.territoryName}
                      </div>
                      {!isDepleted && (
                        <div className="text-xs text-gray-400 mt-1">
                          {warning.remainingPercent.toFixed(0)}% capacity remaining
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      {/* Election Countdown */}
      {governanceMetrics['player'] && (
        <div>
          <h3 className="text-lg font-bold text-cyan-400 mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Election Countdown
          </h3>
          <div className={`p-4 rounded-lg border ${
            governanceMetrics['player'].electionTimer <= 2
              ? 'bg-red-500/10 border-red-500/60'
              : governanceMetrics['player'].electionTimer <= 5
              ? 'bg-amber-400/10 border-amber-400/60'
              : 'bg-cyan-500/10 border-cyan-500/40'
          }`}>
            <div className="mb-4">
              <div className="text-xs uppercase tracking-[0.3em] text-cyan-200/80 mb-2">
                Next Election
              </div>
              <div className="text-3xl font-mono text-cyan-100 font-bold">
                {governanceMetrics['player'].electionTimer} turns
              </div>
              {governanceMetrics['player'].electionTimer <= 2 && (
                <div className="mt-2 bg-black/40 px-2 py-1 inline-block rounded">
                  <span className="text-xs uppercase tracking-[0.2em] text-red-300 font-bold">
                    Mandate At Risk
                  </span>
                </div>
              )}
              {governanceMetrics['player'].electionTimer > 2 && governanceMetrics['player'].electionTimer <= 5 && (
                <div className="mt-2 bg-black/40 px-2 py-1 inline-block rounded">
                  <span className="text-xs uppercase tracking-[0.2em] text-amber-300 font-bold">
                    Campaign Sprint
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-800/50 p-3 rounded">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-gray-300">Public Opinion</span>
                </div>
                <span className="text-white font-bold text-xl">
                  {Math.round(governanceMetrics['player'].publicOpinion)}%
                </span>
              </div>

              <div className="bg-gray-800/50 p-3 rounded">
                <div className="flex items-center gap-2 mb-1">
                  <ThumbsUp className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-gray-300">Cabinet Approval</span>
                </div>
                <span className="text-white font-bold text-xl">
                  {Math.round(governanceMetrics['player'].cabinetApproval)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Victory Progress section removed - now handled by VictoryPathsSection above */}

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
            <span className="text-white font-bold text-lg">{(player.publicOpinion ?? 50).toFixed(0)}%</span>
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
            {Object.keys(player.researched || {}).filter(k => player.researched?.[k]).length}
          </div>

          {player.researchQueue && (
            <div className="border-t border-gray-700 pt-3 mt-3">
              <div className="text-sm text-gray-300 mb-2">Current Research</div>
              <div className="mb-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">{player.researchQueue.projectId}</span>
                  <span className="text-white">{player.researchQueue.turnsRemaining} turns</span>
                </div>
                {renderProgressBar(
                    ((player.researchQueue.totalTurns - player.researchQueue.turnsRemaining) / player.researchQueue.totalTurns) * 100,
                    'bg-cyan-500'
                  )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  };

  const renderEnemyStatus = (selectedEnemy: Nation | null) => {
    if (!selectedEnemy) {
      return (
        <div className="flex h-full min-h-[240px] items-center justify-center rounded-lg border border-dashed border-gray-700 bg-gray-900/40 p-6 text-center text-sm text-gray-400">
          Select a nation in the ledger to load intelligence details.
        </div>
      );
    }

    const hasSatelliteCoverage = Boolean(player.satellites?.[selectedEnemy.id]);
    const hasDeepRecon = Boolean(player.deepRecon?.[selectedEnemy.id]);
    const hasIntelCoverage = hasSatelliteCoverage || hasDeepRecon;

    const enemyMilitaryPower = calculateMilitaryPower(selectedEnemy);
    const powerRatio = playerMilitaryPower > 0
      ? (enemyMilitaryPower / playerMilitaryPower) * 100
      : 100;

    const hasAlliance = player.treaties?.[selectedEnemy.id]?.alliance;
    const hasTruce = (player.treaties?.[selectedEnemy.id]?.truceTurns || 0) > 0;
    const truceTurnsLeft = player.treaties?.[selectedEnemy.id]?.truceTurns || 0;

    const totalNations = nonPlayerNations.length;
    const enemyEliminatedCount = nonPlayerNations.filter(
      nation => nation.id !== selectedEnemy.id && (nation.population ?? 0) <= 0
    ).length;
    const enemyDominationProgress = totalNations > 0
      ? (enemyEliminatedCount / totalNations) * 100
      : 0;
    const enemyEconomicProgress = Math.min(100, ((selectedEnemy.cities || 0) / 10) * 100);
    const enemySurvivalProgress = Math.min(
      100,
      ((currentTurn / 50) * 50) + ((selectedEnemy.population >= 50 ? 1 : (selectedEnemy.population / 50)) * 50)
    );

    const maxProgress = Math.max(
      enemyDominationProgress,
      enemyEconomicProgress,
      enemySurvivalProgress
    );

    return (
      <div className="space-y-4">
        <div className="text-sm text-gray-400 mb-2">
          Monitoring {enemies.length} active nation{enemies.length !== 1 ? 's' : ''}
        </div>

        <div className="bg-gray-800/70 border border-gray-700 rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: selectedEnemy.color }}
                />
                <h4 className="text-white font-bold">{selectedEnemy.name}</h4>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Led by {selectedEnemy.leader} • {selectedEnemy.doctrine}
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

          {!hasIntelCoverage ? (
            <div className="bg-gray-900/70 border border-yellow-500/30 rounded p-6 text-center">
              <Target className="w-12 h-12 text-yellow-400 mx-auto mb-3 opacity-50" />
              <div className="text-yellow-400 font-bold mb-2">Intelligence Required</div>
              <div className="text-gray-400 text-sm mb-3">
                Deploy satellites or conduct deep reconnaissance to gather intelligence on this nation
              </div>
              <div className="text-xs text-gray-500">
                Use the Intel panel to unlock detailed military and economic data
              </div>
            </div>
          ) : (
            <>
              <div className="mb-3 bg-blue-500/10 border border-blue-500/30 rounded p-2">
                <div className="flex items-center justify-center gap-2 text-xs text-blue-300">
                  <Target className="w-3 h-3" />
                  <span>
                    {hasSatelliteCoverage && 'Satellite Coverage Active'}
                    {hasDeepRecon && hasSatelliteCoverage && ' + '}
                    {hasDeepRecon && 'Deep Reconnaissance Active'}
                  </span>
                </div>
              </div>

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

              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="bg-gray-900/50 p-2 rounded text-center">
                  <Target className="w-3 h-3 text-red-400 mx-auto mb-1" />
                  <div className="text-xs text-gray-400">Missiles</div>
                  <div className="text-white font-bold text-sm">{selectedEnemy.missiles}</div>
                </div>

                <div className="bg-gray-900/50 p-2 rounded text-center">
                  <Plane className="w-3 h-3 text-blue-400 mx-auto mb-1" />
                  <div className="text-xs text-gray-400">Bombers</div>
                  <div className="text-white font-bold text-sm">{selectedEnemy.bombers}</div>
                </div>

                <div className="bg-gray-900/50 p-2 rounded text-center">
                  <Anchor className="w-3 h-3 text-cyan-400 mx-auto mb-1" />
                  <div className="text-xs text-gray-400">Subs</div>
                  <div className="text-white font-bold text-sm">{selectedEnemy.submarines}</div>
                </div>

                <div className="bg-gray-900/50 p-2 rounded text-center">
                  <Shield className="w-3 h-3 text-green-400 mx-auto mb-1" />
                  <div className="text-xs text-gray-400">Defense</div>
                  <div className="text-white font-bold text-sm">{selectedEnemy.defense}</div>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-3">
                <div className="flex justify-between text-xs text-gray-400 mb-2">
                  <span>Closest to Victory</span>
                  <span className={maxProgress > 70 ? 'text-red-400 font-bold' : 'text-gray-300'}>
                    {maxProgress.toFixed(1)}%
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-gray-500 w-16">Domination</div>
                    <div className="flex-1">
                      {renderProgressBar(enemyDominationProgress, 'bg-red-500')}
                    </div>
                    <div className="text-xs text-gray-400 w-12 text-right">
                      {enemyDominationProgress.toFixed(0)}%
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
                    <div className="text-xs text-gray-500 w-16">Survival</div>
                    <div className="flex-1">
                      {renderProgressBar(enemySurvivalProgress, 'bg-green-500')}
                    </div>
                    <div className="text-xs text-gray-400 w-12 text-right">
                      {enemySurvivalProgress.toFixed(0)}%
                    </div>
                  </div>
                </div>

                {maxProgress > 70 && (
                  <div className="mt-2 text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded text-center">
                    Warning: Close to victory!
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-700">
                <div className="text-center">
                  <div className="text-xs text-gray-500">Population</div>
                  <div className="text-white text-sm font-bold">
                    {(selectedEnemy.population / 1000000).toFixed(1)}M
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500">Cities</div>
                  <div className="text-white text-sm font-bold">{selectedEnemy.cities}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500">Morale</div>
                  <div className="text-white text-sm font-bold">
                    {selectedEnemy.morale.toFixed(0)}%
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderLedger = () => (
    <div className="space-y-6">
      <div className="text-sm text-gray-400">
        Compare global production, military power, and diplomatic alignments at a glance. Click any row to view the full
        intelligence dossier below.
      </div>

      {/* Full-width Ledger Table */}
      <LedgerTable
        nations={nations}
        player={player}
        selectedNationId={selectedNationId}
        onSelectNation={handleLedgerSelect}
        calculateMilitaryPower={calculateMilitaryPower}
        playerMilitaryPower={playerMilitaryPower}
      />

      {/* Selected Nation Intelligence Dossier */}
      {selectedNation && (
        <div>
          <h3 className="text-lg font-bold text-yellow-400 mb-3 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Intelligence Dossier
          </h3>
          {renderEnemyStatus(selectedNation)}
        </div>
      )}

      {/* Victory Race - All Nations */}
      <div>
        <h3 className="text-lg font-bold text-amber-300 mb-3 flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Victory Race
        </h3>
        <div className="bg-gray-800/50 p-4 rounded-lg border border-amber-500/30">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 px-2 text-gray-400 font-semibold">Nation</th>
                  <th className="text-center py-2 px-2 text-red-400 font-semibold">Domination</th>
                  <th className="text-center py-2 px-2 text-yellow-400 font-semibold">Economic</th>
                  <th className="text-center py-2 px-2 text-green-400 font-semibold">Survival</th>
                  <th className="text-center py-2 px-2 text-purple-400 font-semibold">Closest</th>
                </tr>
              </thead>
              <tbody>
                {nations
                  .filter(nation => nation.population > 0)
                  .map((nation) => {
                    const totalNations = nonPlayerNations.length;
                    const eliminatedCount = nonPlayerNations.filter(
                      n => n.id !== nation.id && (n.population ?? 0) <= 0
                    ).length;
                    const dominationProgress = totalNations > 0 ? (eliminatedCount / totalNations) * 100 : 0;
                    const economicProgress = Math.min(100, ((nation.cities || 0) / 10) * 100);
                    const survivalProgress = Math.min(
                      100,
                      ((currentTurn / 50) * 50) + ((nation.population >= 50 ? 1 : (nation.population / 50)) * 50)
                    );
                    const maxProgress = Math.max(dominationProgress, economicProgress, survivalProgress);

                    let closestPath = 'Domination';
                    if (economicProgress >= dominationProgress && economicProgress >= survivalProgress) {
                      closestPath = 'Economic';
                    } else if (survivalProgress >= dominationProgress && survivalProgress >= economicProgress) {
                      closestPath = 'Survival';
                    }

                    return (
                      <tr
                        key={nation.id}
                        className={`border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors ${
                          maxProgress > 80 ? 'bg-red-500/10' : maxProgress > 60 ? 'bg-amber-500/10' : ''
                        }`}
                      >
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: nation.color }}
                            />
                            <span className={`font-semibold ${nation.isPlayer ? 'text-emerald-300' : 'text-gray-200'}`}>
                              {nation.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <span className={dominationProgress > 70 ? 'text-red-300 font-bold' : 'text-gray-400'}>
                            {dominationProgress.toFixed(0)}%
                          </span>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <span className={economicProgress > 70 ? 'text-yellow-300 font-bold' : 'text-gray-400'}>
                            {economicProgress.toFixed(0)}%
                          </span>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <span className={survivalProgress > 70 ? 'text-green-300 font-bold' : 'text-gray-400'}>
                            {survivalProgress.toFixed(0)}%
                          </span>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <div className="flex flex-col items-center">
                            <span className={`font-bold ${
                              maxProgress > 80 ? 'text-red-300' :
                              maxProgress > 60 ? 'text-amber-300' :
                              'text-gray-400'
                            }`}>
                              {maxProgress.toFixed(0)}%
                            </span>
                            <span className="text-[9px] text-gray-500">{closestPath}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
          <div className="mt-4 pt-3 border-t border-amber-500/20">
            <p className="text-[10px] text-amber-400/60 text-center">
              Real-time victory progress tracking • Highlighted rows indicate imminent victory threat
            </p>
          </div>
        </div>
      </div>

      {/* Morale Outlook - All Nations */}
      <div>
        <h3 className="text-lg font-bold text-cyan-300 mb-3 flex items-center gap-2">
          <Heart className="w-5 h-5" />
          Global Morale Outlook
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
              Population sentiment indicator across all nations
            </p>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500 text-center">
        Tip: Press Shift + L to jump straight to this ledger.
      </div>
    </div>
  );

  const renderDiplomacy = () => (
    <div className="space-y-4">
      <UnifiedDiplomacyPanel
        player={player}
        nations={nations}
      />
      {onOpenFullDiplomacy && (
        <button
          onClick={onOpenFullDiplomacy}
          className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Open Full Diplomacy Screen
        </button>
      )}
    </div>
  );

  const renderResearch = () => {
    if (!player) return null;

    const currentResearch = player.researchQueue
      ? {
          projectId: player.researchQueue.projectId,
          progress: player.researchQueue.totalTurns - player.researchQueue.turnsRemaining,
        }
      : undefined;

    return (
      <div className="space-y-6">
        {/* Research Trees */}
        {onStartResearch && (
          <div>
            <ResearchTreeFlow
              nation={player}
              onStartResearch={onStartResearch}
              onCancelResearch={onCancelResearch}
              currentResearch={currentResearch}
              bioLabFacility={bioLabFacility}
              onStartBioLabConstruction={onStartBioLabConstruction}
              onCancelBioLabConstruction={onCancelBioLabConstruction}
            />
          </div>
        )}

        {/* Research Stats Summary */}
        <div className="bg-gray-800/50 border border-cyan-500/30 rounded-lg p-4">
          <h4 className="text-sm font-bold text-cyan-300 mb-3">Research Statistics</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-900/50 p-3 rounded">
              <div className="text-xs text-gray-400 mb-1">Projects Completed</div>
              <div className="text-xl font-bold text-cyan-300">
                {Object.keys(player.researched || {}).filter(k => player.researched?.[k]).length}
              </div>
            </div>
            {currentResearch && (
              <div className="bg-gray-900/50 p-3 rounded">
                <div className="text-xs text-gray-400 mb-1">Current Project</div>
                <div className="text-sm font-bold text-amber-300">{currentResearch.projectId}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {player.researchQueue?.turnsRemaining} turns remaining
                </div>
              </div>
            )}
            {bioLabFacility && bioLabFacility.tier > 0 && (
              <div className="bg-gray-900/50 p-3 rounded">
                <div className="text-xs text-gray-400 mb-1">Bio-Lab Tier</div>
                <div className="text-xl font-bold text-purple-300">
                  Tier {bioLabFacility.tier}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
        <div className="bg-gray-900 border-2 border-yellow-600 rounded-lg shadow-2xl w-full h-full flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-900 to-yellow-700 p-4 flex justify-between items-center rounded-t-lg">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              Status Report
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowNukaPedia(true)}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded transition-colors font-medium"
              >
                <BookOpen className="w-5 h-5" />
                NukaPedia
              </button>
              <button
                onClick={onClose}
                className="text-white hover:text-red-400 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
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
            onClick={() => setActiveTab('research')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'research'
                ? 'bg-gray-900 text-yellow-400 border-b-2 border-yellow-400'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <FlaskConical className="w-4 h-4" />
              Research
            </div>
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'ledger'
                ? 'bg-gray-900 text-yellow-400 border-b-2 border-yellow-400'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Target className="w-4 h-4" />
              Strategic Ledger
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
          {activeTab === 'research' && renderResearch()}
          {activeTab === 'ledger' && renderLedger()}
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

    <GameDatabase
      open={showNukaPedia}
      onClose={() => setShowNukaPedia(false)}
      currentTurn={currentTurn}
    />

    {/* Keyboard Shortcuts Help Overlay */}
    {showShortcutsHelp && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
        <div className="bg-gray-900 border-2 border-cyan-500 rounded-lg shadow-2xl w-full max-w-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-cyan-300 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Keyboard Shortcuts
            </h3>
            <button
              onClick={() => setShowShortcutsHelp(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-300">Your Empire</span>
              <kbd className="px-3 py-1 bg-gray-800 border border-cyan-500/50 rounded text-cyan-300 font-mono text-sm">
                Shift + E
              </kbd>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-300">Research</span>
              <kbd className="px-3 py-1 bg-gray-800 border border-cyan-500/50 rounded text-cyan-300 font-mono text-sm">
                Shift + R
              </kbd>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-300">Strategic Ledger</span>
              <kbd className="px-3 py-1 bg-gray-800 border border-cyan-500/50 rounded text-cyan-300 font-mono text-sm">
                Shift + L
              </kbd>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-300">Diplomacy</span>
              <kbd className="px-3 py-1 bg-gray-800 border border-cyan-500/50 rounded text-cyan-300 font-mono text-sm">
                Shift + D
              </kbd>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-300">Toggle Panel</span>
              <kbd className="px-3 py-1 bg-gray-800 border border-cyan-500/50 rounded text-cyan-300 font-mono text-sm">
                I
              </kbd>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-300">Show Shortcuts</span>
              <kbd className="px-3 py-1 bg-gray-800 border border-cyan-500/50 rounded text-cyan-300 font-mono text-sm">
                Shift + ?
              </kbd>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-700 text-center text-xs text-gray-400">
            Press any key or click outside to close
          </div>
        </div>
      </div>
    )}
  </>
  );
};
