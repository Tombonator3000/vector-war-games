import type { GovernanceMetrics } from '@/hooks/useGovernance';

interface MoraleHeatmapOverlayProps {
  nations: Array<{ id: string; name: string; isPlayer?: boolean }>;
  metrics: Record<string, GovernanceMetrics>;
}

export function MoraleHeatmapOverlay({ nations, metrics }: MoraleHeatmapOverlayProps) {
  if (nations.length === 0) return null;

  return (
    <div className="pointer-events-none fixed left-6 top-24 z-30 w-64 space-y-2 rounded-lg border border-cyan-500/30 bg-black/80 p-4 shadow-xl">
      <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">
        Morale Outlook
      </h3>
      <div className="space-y-2">
        {nations.map((nation) => {
          const snapshot = metrics[nation.id];
          const morale = snapshot?.morale ?? 0;
          const gradient = getMoraleColor(morale);
          return (
            <div key={nation.id} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs text-cyan-200/90">
                <span className={`font-semibold ${nation.isPlayer ? 'text-emerald-300' : ''}`}>{nation.name}</span>
                <span className="font-mono">{Math.round(morale)}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded bg-slate-800">
                <div className="h-full" style={{ width: `${clamp(morale, 0, 100)}%`, background: gradient }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getMoraleColor(value: number) {
  if (value >= 80) return 'linear-gradient(90deg, #34d399 0%, #22d3ee 100%)';
  if (value >= 60) return 'linear-gradient(90deg, #38bdf8 0%, #818cf8 100%)';
  if (value >= 40) return 'linear-gradient(90deg, #f59e0b 0%, #f97316 100%)';
  return 'linear-gradient(90deg, #f87171 0%, #ef4444 100%)';
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
