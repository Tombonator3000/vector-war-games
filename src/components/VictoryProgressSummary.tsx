import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VictoryPath } from '@/types/victory';

export const victoryColorClasses: Record<string, {
  bg: string;
  text: string;
  border: string;
  progress: string;
}> = {
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

const DEFAULT_COLOR = victoryColorClasses.gray;

interface VictoryProgressSummaryProps {
  paths: VictoryPath[];
  className?: string;
}

export function VictoryProgressSummary({ paths, className }: VictoryProgressSummaryProps) {
  if (!paths.length) {
    return (
      <div
        className={cn(
          'bg-gray-900/40 border border-cyan-500/20 rounded-lg p-4 text-center text-xs text-gray-400',
          className,
        )}
      >
        <p>No victory progress tracked yet.</p>
        <p className="text-[10px] text-gray-500 mt-1">Advance the campaign to reveal victory standings.</p>
      </div>
    );
  }

  const sortedPaths = [...paths].sort((a, b) => b.progress - a.progress);
  const leadingPath = sortedPaths[0];

  return (
    <div className={cn('bg-gray-900/40 border border-cyan-500/20 rounded-lg p-4', className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <div>
            <h4 className="text-sm font-semibold text-cyan-100 uppercase tracking-wider">Victory Progress</h4>
            {leadingPath && (
              <p className="text-[10px] text-cyan-200/70 uppercase tracking-[0.35em]">
                Leading: {leadingPath.icon} {leadingPath.name}
              </p>
            )}
          </div>
        </div>
        <span className="text-xs font-mono text-cyan-300">
          First faction to reach 100% claims victory
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {sortedPaths.map((path) => {
          const palette = victoryColorClasses[path.color] || DEFAULT_COLOR;
          const progressValue = Math.min(Math.max(path.progress, 0), 100);

          return (
            <div
              key={path.type}
              className={cn(
                'rounded-lg border bg-black/40 p-3 shadow-inner shadow-black/20 transition',
                palette.border,
                palette.bg,
              )}
            >
              <div className="flex items-center justify-between text-xs">
                <span className={cn('flex items-center gap-2 font-semibold uppercase tracking-wide', palette.text)}>
                  <span className="text-base leading-none">{path.icon}</span>
                  {path.name}
                </span>
                <span className={cn('font-mono font-bold', palette.text)}>
                  {Math.round(progressValue)}%
                </span>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-slate-900/80">
                <div
                  className={cn('h-full rounded-full transition-all duration-300 ease-out', palette.progress)}
                  style={{ width: `${progressValue}%` }}
                />
              </div>
              {path.estimatedTurnsToVictory !== null && (
                <p className="mt-2 text-[10px] text-cyan-200/60 font-mono">
                  ≈ {path.estimatedTurnsToVictory} turn{path.estimatedTurnsToVictory === 1 ? '' : 's'} remaining
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
