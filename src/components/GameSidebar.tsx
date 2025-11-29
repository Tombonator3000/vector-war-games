import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  Lock,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react';
import type { VictoryAnalysis, VictoryPath } from '@/types/victory';
import type { UseGameEraReturn } from '@/hooks/useGameEra';
import type { GameFeature } from '@/types/era';
import { victoryColorClasses } from './VictoryProgressSummary';

type TabType = 'victory' | 'era';

interface GameSidebarProps {
  victoryAnalysis: VictoryAnalysis;
  era: UseGameEraReturn;
  currentTurn: number;
  defcon: number;
  className?: string;
}

export function GameSidebar({
  victoryAnalysis,
  era,
  currentTurn,
  defcon,
  className = '',
}: GameSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('victory');

  const sortedPaths = useMemo(
    () => [...victoryAnalysis.paths].sort((a, b) => b.progress - a.progress),
    [victoryAnalysis.paths]
  );

  const lockedFeatures = useMemo(() => era.getLockedFeatures().slice(0, 4), [era]);
  const nextEra = era.getNextEra();
  const eraProgress = era.getEraProgress();

  return (
    <div className={`w-[320px] ${className}`}>
      <Card className="border-cyan-500/30 bg-slate-950/90 backdrop-blur-sm shadow-lg shadow-cyan-500/5 overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center justify-between px-3 py-2 cursor-pointer border-b border-cyan-500/20"
          onClick={() => setCollapsed((prev) => !prev)}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-cyan-100">Turn {currentTurn}</span>
            <span className="text-cyan-500/50">·</span>
            <span className="text-xs text-red-400 font-medium">DEFCON {defcon}</span>
          </div>
          {collapsed ? (
            <ChevronDown className="h-3.5 w-3.5 text-cyan-400" />
          ) : (
            <ChevronUp className="h-3.5 w-3.5 text-cyan-400" />
          )}
        </div>

        {!collapsed && (
          <>
            {/* Tab Buttons */}
            <div className="flex border-b border-cyan-500/20">
              <button
                onClick={() => setActiveTab('victory')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
                  activeTab === 'victory'
                    ? 'text-yellow-400 bg-yellow-500/10 border-b-2 border-yellow-400'
                    : 'text-cyan-200/70 hover:text-cyan-100 hover:bg-cyan-500/5'
                }`}
              >
                <Trophy className="h-3.5 w-3.5" />
                Victory
              </button>
              <button
                onClick={() => setActiveTab('era')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
                  activeTab === 'era'
                    ? 'text-cyan-300 bg-cyan-500/10 border-b-2 border-cyan-400'
                    : 'text-cyan-200/70 hover:text-cyan-100 hover:bg-cyan-500/5'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Era
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-3 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-cyan-500/20">
              {activeTab === 'victory' ? (
                <VictoryTabContent
                  paths={sortedPaths}
                  warnings={victoryAnalysis.warnings}
                />
              ) : (
                <EraTabContent
                  era={era}
                  lockedFeatures={lockedFeatures}
                  nextEra={nextEra}
                  eraProgress={eraProgress}
                  currentTurn={currentTurn}
                />
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

function VictoryTabContent({
  paths,
  warnings,
}: {
  paths: VictoryPath[];
  warnings: string[];
}) {
  return (
    <div className="space-y-2">
      {warnings.length > 0 && (
        <div className="space-y-1 mb-3">
          {warnings.map((warning, idx) => (
            <div
              key={idx}
              className="flex items-start gap-1.5 rounded bg-yellow-900/30 border border-yellow-500/30 px-2 py-1.5 text-[11px] text-yellow-200"
            >
              <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}

      {paths.map((path) => (
        <VictoryPathRow key={path.type} path={path} />
      ))}

      {paths.length === 0 && (
        <p className="text-[11px] text-cyan-200/60 text-center py-2">
          Victory tracking will activate as the campaign progresses.
        </p>
      )}
    </div>
  );
}

function VictoryPathRow({ path }: { path: VictoryPath }) {
  const [expanded, setExpanded] = useState(false);
  const color = victoryColorClasses[path.color] || victoryColorClasses.gray;
  const nextStep = path.nextMilestones[0];

  return (
    <div
      className={`rounded border ${color.border} bg-slate-900/50 overflow-hidden transition-all`}
    >
      <div
        className="flex items-center gap-2 p-2 cursor-pointer hover:bg-slate-800/30"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-base">{path.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className={`text-xs font-medium ${color.text} truncate`}>{path.name}</p>
            <span className={`text-[10px] font-medium ${color.text}`}>
              {Math.round(path.progress)}%
            </span>
          </div>
          <Progress value={path.progress} className="h-1 mt-1" />
        </div>
        {(nextStep || path.isBlocked) && (
          <ChevronDown
            className={`h-3 w-3 text-cyan-400 transition-transform ${
              expanded ? 'rotate-180' : ''
            }`}
          />
        )}
      </div>

      {expanded && (
        <div className="px-2 pb-2 space-y-1.5">
          <p className="text-[10px] text-cyan-200/70 pl-6">{path.description}</p>

          {path.isBlocked && path.blockReason && (
            <div className="flex items-start gap-1.5 rounded bg-red-900/30 border border-red-500/30 px-2 py-1 text-[10px] text-red-200 ml-6">
              <AlertTriangle className="h-2.5 w-2.5 mt-0.5 flex-shrink-0" />
              <span>{path.blockReason}</span>
            </div>
          )}

          {nextStep && (
            <div className="flex items-start gap-1.5 rounded bg-cyan-900/20 border border-cyan-500/20 px-2 py-1.5 ml-6">
              <Target className="h-3 w-3 text-cyan-400 mt-0.5 flex-shrink-0" />
              <div className="text-[10px] text-cyan-100">
                <span className="font-medium">Next:</span> {nextStep.description}
                {nextStep.actionHint && (
                  <p className="text-cyan-200/60 mt-0.5">{nextStep.actionHint}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EraTabContent({
  era,
  lockedFeatures,
  nextEra,
  eraProgress,
  currentTurn,
}: {
  era: UseGameEraReturn;
  lockedFeatures: { feature: GameFeature; name: string; description: string; unlockTurn: number }[];
  nextEra: { era: string; turnsUntil: number } | null;
  eraProgress: number;
  currentTurn: number;
}) {
  const eraName =
    era.currentEra === 'early'
      ? 'Cold War Tension'
      : era.eraDefinitions[era.currentEra].name;

  return (
    <div className="space-y-3">
      {/* Current Era */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-cyan-100">{eraName}</p>
          {nextEra && (
            <span className="flex items-center gap-1 text-[10px] text-cyan-300/70">
              <Clock className="h-2.5 w-2.5" />
              {nextEra.turnsUntil} turns until {nextEra.era}
            </span>
          )}
        </div>
        <Progress value={eraProgress} className="h-1.5" />
        <p className="text-[10px] text-cyan-200/60">{era.getEraDescription()}</p>
      </div>

      {/* Upcoming Unlocks */}
      {lockedFeatures.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-wider text-cyan-300/50 font-medium">
            Upcoming Unlocks
          </p>
          {lockedFeatures.map((feature) => {
            const turnsUntil = Math.max(0, feature.unlockTurn - currentTurn);
            return (
              <div
                key={feature.feature}
                className="flex items-start gap-2 rounded bg-slate-900/50 border border-cyan-500/15 p-2"
              >
                <Lock className="h-3 w-3 text-cyan-400/70 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-cyan-100 truncate">
                    {feature.name}
                  </p>
                  <p className="text-[10px] text-cyan-200/50 line-clamp-1">
                    {feature.description}
                  </p>
                  <Badge
                    variant="outline"
                    className="mt-1 h-4 px-1.5 text-[9px] border-yellow-500/30 text-yellow-400/80 bg-yellow-500/10"
                  >
                    Turn {feature.unlockTurn} ({turnsUntil} away)
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {lockedFeatures.length === 0 && (
        <div className="text-center py-2">
          <span className="text-[11px] text-green-400/80">All systems unlocked</span>
        </div>
      )}
    </div>
  );
}
