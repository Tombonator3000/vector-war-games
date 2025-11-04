import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Trophy,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Target,
  ArrowRight,
} from 'lucide-react';
import type {
  VictoryAnalysis,
  VictoryCondition,
  VictoryMilestone,
  VictoryPath,
} from '@/types/victory';

interface VictoryPathsSectionProps extends VictoryAnalysis {
  currentTurn: number;
}

const colorClasses: Record<
  string,
  { bg: string; text: string; border: string; progress: string }
> = {
  blue: {
    bg: 'bg-blue-900/20',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    progress: 'bg-blue-500',
  },
  red: {
    bg: 'bg-red-900/20',
    text: 'text-red-400',
    border: 'border-red-500/30',
    progress: 'bg-red-500',
  },
  green: {
    bg: 'bg-green-900/20',
    text: 'text-green-400',
    border: 'border-green-500/30',
    progress: 'bg-green-500',
  },
  purple: {
    bg: 'bg-purple-900/20',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    progress: 'bg-purple-500',
  },
  yellow: {
    bg: 'bg-yellow-900/20',
    text: 'text-yellow-400',
    border: 'border-yellow-500/30',
    progress: 'bg-yellow-500',
  },
  gray: {
    bg: 'bg-gray-900/20',
    text: 'text-gray-400',
    border: 'border-gray-500/30',
    progress: 'bg-gray-500',
  },
};

export function VictoryPathsSection({
  paths,
  closestVictory,
  turnsUntilClosestVictory,
  recommendedPath,
  warnings,
  currentTurn,
}: VictoryPathsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  const sortedPaths = [...paths].sort((a, b) => b.progress - a.progress);
  const topPath = sortedPaths[0];

  return (
    <div className="bg-black/40 border border-cyan-500/30 rounded-xl shadow-lg shadow-cyan-500/10 overflow-hidden">
      <div
        className="p-4 cursor-pointer hover:bg-cyan-900/10 transition"
        onClick={() => setIsExpanded((prev) => !prev)}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Trophy
              className={`w-5 h-5 ${
                topPath?.progress && topPath.progress >= 70
                  ? 'text-yellow-400 animate-pulse'
                  : 'text-cyan-400'
              }`}
            />
            <div>
              <h3 className="text-sm font-bold text-cyan-100 uppercase tracking-wider">
                Victory Paths
              </h3>
              <p className="text-[10px] text-cyan-200/70 uppercase tracking-[0.4em]">
                Turn {currentTurn}
              </p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-cyan-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-cyan-400" />
          )}
        </div>

        {!isExpanded && (
          <div className="space-y-2">
            {topPath ? (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-cyan-200">{topPath.icon} {topPath.name}</span>
                  <span className={`font-mono font-bold ${colorClasses[topPath.color]?.text || 'text-cyan-200'}`}>
                    {Math.round(topPath.progress)}%
                  </span>
                </div>
                <Progress value={topPath.progress} className="h-2" />
                {turnsUntilClosestVictory !== null && turnsUntilClosestVictory < 10 && (
                  <p className="text-[10px] text-yellow-400 animate-pulse">
                    ⚡ ~{turnsUntilClosestVictory} turns to victory!
                  </p>
                )}
              </>
            ) : (
              <div className="text-xs text-gray-400">
                <p>Multiple victory paths available</p>
                <p className="text-[10px] text-gray-500 mt-1">
                  Click to expand and view progress
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="victory-paths-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-cyan-500/20"
          >
            <div className="p-4 space-y-4">
              {warnings.length > 0 && (
                <div className="space-y-1">
                  {warnings.map((warning, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 text-xs text-yellow-400 bg-yellow-900/20 border border-yellow-500/30 rounded p-2"
                    >
                      <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      <span>{warning}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid gap-2 text-xs text-gray-300 sm:grid-cols-2">
                <div className="bg-gray-900/40 border border-cyan-500/20 rounded p-3">
                  <p className="uppercase tracking-wide text-[10px] text-cyan-200/70">Closest Victory</p>
                  <p className="text-sm font-semibold text-cyan-100 mt-1">
                    {closestVictory ? humanizeVictoryType(closestVictory) : 'No active path'}
                  </p>
                  {turnsUntilClosestVictory !== null && (
                    <p className="text-[10px] text-yellow-300 mt-1">
                      Estimated {turnsUntilClosestVictory} turn{turnsUntilClosestVictory === 1 ? '' : 's'}
                    </p>
                  )}
                </div>
                <div className="bg-gray-900/40 border border-cyan-500/20 rounded p-3">
                  <p className="uppercase tracking-wide text-[10px] text-cyan-200/70">Recommended Focus</p>
                  <p className="text-sm font-semibold text-cyan-100 mt-1">
                    {recommendedPath ? humanizeVictoryType(recommendedPath) : 'Build momentum to unlock tips'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {sortedPaths.length > 0 ? (
                  sortedPaths.map((path) => (
                    <VictoryPathCard
                      key={path.type}
                      path={path}
                      isRecommended={path.type === recommendedPath}
                      isSelected={selectedPath === path.type}
                      onSelect={() =>
                        setSelectedPath((current) =>
                          current === path.type ? null : path.type
                        )
                      }
                      colorClasses={colorClasses[path.color] || colorClasses.gray}
                    />
                  ))
                ) : (
                  <div className="text-center text-xs text-gray-400 py-4">
                    <p>No victory paths available yet</p>
                    <p className="text-[10px] text-gray-500 mt-1">
                      Victory tracking will activate as the game progresses
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function VictoryPathCard({
  path,
  isRecommended,
  isSelected,
  onSelect,
  colorClasses,
}: {
  path: VictoryPath;
  isRecommended: boolean;
  isSelected: boolean;
  onSelect: () => void;
  colorClasses: { bg: string; text: string; border: string; progress: string };
}) {
  return (
    <div
      className={`border rounded-lg overflow-hidden transition ${colorClasses.border} ${
        isSelected ? colorClasses.bg : 'bg-gray-900/20'
      }`}
    >
      <div
        className="p-3 cursor-pointer hover:bg-white/5 transition"
        onClick={onSelect}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{path.icon}</span>
              <h4 className={`text-sm font-semibold ${colorClasses.text}`}>
                {path.name}
              </h4>
              {isRecommended && (
                <Badge
                  variant="outline"
                  className="text-[10px] border-yellow-500/50 text-yellow-400"
                >
                  RECOMMENDED
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-400">{path.description}</p>
          </div>
          <div className="text-right ml-2">
            <span className={`text-lg font-bold font-mono ${colorClasses.text}`}>
              {Math.round(path.progress)}%
            </span>
          </div>
        </div>

        <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${path.progress}%` }}
            className={`h-full ${colorClasses.progress} ${
              path.progress >= 90 ? 'animate-pulse' : ''
            }`}
          />
        </div>

        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {path.isBlocked && (
            <Badge
              variant="outline"
              className="text-[10px] border-red-500/50 text-red-400"
            >
              🔒 BLOCKED
            </Badge>
          )}
          {path.estimatedTurnsToVictory !== null &&
            path.estimatedTurnsToVictory <= 5 && (
              <Badge
                variant="outline"
                className="text-[10px] border-yellow-500/50 text-yellow-400 animate-pulse"
              >
                ⚡ {path.estimatedTurnsToVictory} turns
              </Badge>
            )}
        </div>
      </div>

      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-700/50"
          >
            <div className="p-3 space-y-3">
              {path.blockReason && (
                <div className="flex items-start gap-2 text-xs text-red-400 bg-red-900/20 rounded p-2">
                  <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  <span>{path.blockReason}</span>
                </div>
              )}

              <div>
                <h5 className="text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wide">
                  Conditions
                </h5>
                <div className="space-y-2">
                  {path.conditions.map((condition) => (
                    <ConditionItem key={condition.id} condition={condition} />
                  ))}
                </div>
              </div>

              {path.nextMilestones.length > 0 && (
                <div>
                  <h5 className="text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wide">
                    Next Steps
                  </h5>
                  <div className="space-y-2">
                    {path.nextMilestones.map((milestone, idx) => (
                      <MilestoneItem key={idx} milestone={milestone} />
                    ))}
                  </div>
                </div>
              )}

              {path.estimatedTurnsToVictory !== null && (
                <div className="text-xs text-center text-gray-400 pt-2 border-t border-gray-700/50">
                  <Target className="w-3 h-3 inline mr-1" />
                  Estimated: {path.estimatedTurnsToVictory} turn
                  {path.estimatedTurnsToVictory !== 1 ? 's' : ''} to victory
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ConditionItem({ condition }: { condition: VictoryCondition }) {
  return (
    <div className="flex items-start gap-2 text-xs">
      {condition.isMet ? (
        <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
      ) : (
        <Circle className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
      )}
      <div className="flex-1">
        <p className={condition.isMet ? 'text-green-400' : 'text-gray-300'}>
          {condition.description}
        </p>
        <p
          className={`text-[10px] mt-0.5 font-mono ${
            condition.isMet ? 'text-green-500' : 'text-gray-500'
          }`}
        >
          {condition.current}/{condition.required} {condition.unit || ''}
        </p>
      </div>
    </div>
  );
}

function MilestoneItem({ milestone }: { milestone: VictoryMilestone }) {
  const priorityColors = {
    critical: 'border-red-500/30 bg-red-900/10 text-red-300',
    important: 'border-yellow-500/30 bg-yellow-900/10 text-yellow-300',
    optional: 'border-gray-500/30 bg-gray-900/10 text-gray-300',
  } as const;

  return (
    <div className={`border rounded p-2 ${priorityColors[milestone.priority]}`}>
      <p className="text-xs font-semibold mb-1">{milestone.description}</p>
      {milestone.actionHint && (
        <p className="text-[10px] text-gray-400 flex items-center gap-1">
          <ArrowRight className="w-3 h-3" />
          {milestone.actionHint}
        </p>
      )}
    </div>
  );
}

function humanizeVictoryType(type: VictoryPath['type']) {
  switch (type) {
    case 'diplomatic':
      return 'Diplomatic Victory';
    case 'domination':
      return 'Domination Victory';
    case 'economic':
      return 'Economic Victory';
    case 'survival':
      return 'Survival Victory';
    default:
      return 'Unknown Victory';
  }
}

