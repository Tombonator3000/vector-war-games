import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { AlertTriangle, ChevronDown, ChevronUp, Target, Trophy } from 'lucide-react';
import type { VictoryAnalysis, VictoryPath } from '@/types/victory';
import { victoryColorClasses } from './VictoryProgressSummary';

interface VictoryDashboardProps {
  analysis: VictoryAnalysis;
  currentTurn: number;
  defcon: number;
  className?: string;
}

export function VictoryDashboard({ analysis, currentTurn, defcon, className = '' }: VictoryDashboardProps) {
  const [collapsed, setCollapsed] = useState(false);
  const sortedPaths = useMemo(
    () => [...analysis.paths].sort((a, b) => b.progress - a.progress),
    [analysis.paths]
  );

  return (
    <div className={`w-full sm:w-[360px] ${className}`}>
      <Card className="border-cyan-500/40 bg-slate-950/85 shadow-lg shadow-cyan-500/10">
        <div
          className="flex items-center justify-between px-4 py-3 cursor-pointer"
          onClick={() => setCollapsed((prev) => !prev)}
        >
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-400" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Victory Dashboard</p>
              <p className="text-sm font-semibold text-white">Turn {currentTurn} · DEFCON {defcon}</p>
            </div>
          </div>
          {collapsed ? (
            <ChevronDown className="h-4 w-4 text-cyan-300" />
          ) : (
            <ChevronUp className="h-4 w-4 text-cyan-300" />
          )}
        </div>

        {!collapsed && (
          <div className="px-4 pb-4 space-y-3">
            {analysis.warnings.length > 0 && (
              <div className="space-y-1">
                {analysis.warnings.map((warning, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 rounded border border-yellow-500/40 bg-yellow-900/20 p-2 text-xs text-yellow-200"
                  >
                    <AlertTriangle className="h-3 w-3 mt-0.5" />
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            )}

            {sortedPaths.map((path) => (
              <VictoryDashboardRow key={path.type} path={path} />
            ))}

            {sortedPaths.length === 0 && (
              <p className="text-xs text-cyan-100/70">Victory tracking will light up as the campaign progresses.</p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

function VictoryDashboardRow({ path }: { path: VictoryPath }) {
  const color = victoryColorClasses[path.color] || victoryColorClasses.gray;
  const nextStep = path.nextMilestones[0];

  return (
    <div className={`rounded border ${color.border} bg-slate-900/40 p-3 space-y-2`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <span className="text-lg">{path.icon}</span>
          <div>
            <p className={`text-sm font-semibold ${color.text}`}>{path.name}</p>
            <p className="text-[11px] text-cyan-100/70">{path.description}</p>
          </div>
        </div>
        <Badge variant="outline" className={`${color.border} ${color.text} text-[10px]`}>
          {Math.round(path.progress)}%
        </Badge>
      </div>

      <Progress value={path.progress} className="h-2" />

      {path.isBlocked && path.blockReason && (
        <div className="flex items-start gap-2 rounded border border-red-500/40 bg-red-900/20 p-2 text-xs text-red-200">
          <AlertTriangle className="h-3 w-3 mt-0.5" />
          <span>{path.blockReason}</span>
        </div>
      )}

      {nextStep && (
        <div className="flex items-start gap-2 rounded border border-cyan-500/30 bg-cyan-900/10 p-2">
          <Target className="h-4 w-4 text-cyan-300 mt-0.5" />
          <div className="text-xs text-cyan-50">
            <p className="font-semibold">Next step: {nextStep.description}</p>
            {nextStep.actionHint && (
              <p className="text-[11px] text-cyan-100/70">{nextStep.actionHint}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
