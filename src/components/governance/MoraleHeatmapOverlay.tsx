import type { GovernanceMetrics } from '@/hooks/useGovernance';
import { motion } from 'framer-motion';
import { Smile, Meh, Frown, AlertTriangle } from 'lucide-react';

interface MoraleHeatmapOverlayProps {
  nations: Array<{ id: string; name: string; isPlayer?: boolean }>;
  metrics: Record<string, GovernanceMetrics>;
}

export function MoraleHeatmapOverlay({ nations, metrics }: MoraleHeatmapOverlayProps) {
  if (nations.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="pointer-events-none fixed left-6 top-24 z-30 w-64 space-y-2 rounded-lg border border-cyan-500/30 bg-black/85 backdrop-blur-sm p-4 shadow-xl shadow-cyan-500/10"
    >
      <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300 flex items-center gap-2">
        <span className="inline-block w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
        Morale Outlook
      </h3>
      <div className="space-y-3">
        {nations.map((nation) => {
          const snapshot = metrics[nation.id];
          const morale = snapshot?.morale ?? 0;
          const gradient = getMoraleColor(morale);
          const MoraleIcon = getMoraleIcon(morale);
          const moraleLabel = getMoraleLabel(morale);

          return (
            <motion.div
              key={nation.id}
              className="flex flex-col gap-1.5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <MoraleIcon className={`w-3.5 h-3.5 ${getMoraleIconColor(morale)}`} />
                  <span className={`font-semibold ${nation.isPlayer ? 'text-emerald-300' : 'text-cyan-200/90'}`}>
                    {nation.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] uppercase tracking-wider ${getMoraleTextColor(morale)}`}>
                    {moraleLabel}
                  </span>
                  <span className="font-mono text-cyan-100">{Math.round(morale)}%</span>
                </div>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800/50 border border-slate-700/50">
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
      <div className="mt-3 pt-3 border-t border-cyan-500/20">
        <p className="text-[10px] text-cyan-400/60 text-center">
          Population sentiment indicator
        </p>
      </div>
    </motion.div>
  );
}

function getMoraleColor(value: number) {
  if (value >= 80) return 'linear-gradient(90deg, #34d399 0%, #22d3ee 100%)';
  if (value >= 60) return 'linear-gradient(90deg, #38bdf8 0%, #818cf8 100%)';
  if (value >= 40) return 'linear-gradient(90deg, #f59e0b 0%, #f97316 100%)';
  return 'linear-gradient(90deg, #f87171 0%, #ef4444 100%)';
}

function getMoraleIcon(value: number) {
  if (value >= 80) return Smile;
  if (value >= 60) return Meh;
  if (value >= 40) return Frown;
  return AlertTriangle;
}

function getMoraleIconColor(value: number) {
  if (value >= 80) return 'text-emerald-400';
  if (value >= 60) return 'text-sky-400';
  if (value >= 40) return 'text-amber-400';
  return 'text-red-400';
}

function getMoraleLabel(value: number) {
  if (value >= 80) return 'High';
  if (value >= 60) return 'Good';
  if (value >= 40) return 'Low';
  return 'Critical';
}

function getMoraleTextColor(value: number) {
  if (value >= 80) return 'text-emerald-400';
  if (value >= 60) return 'text-sky-400';
  if (value >= 40) return 'text-amber-400';
  return 'text-red-400';
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
