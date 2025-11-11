import { AnimatePresence, motion } from 'framer-motion';
import type { BorderConflictSuccessPayload } from '@/hooks/useConventionalWarfare';

interface BattleResultDisplayProps {
  report: BorderConflictSuccessPayload;
  attackerName: string;
  defenderName: string;
}

const outcomeStyles: Record<BorderConflictSuccessPayload['outcome'], { label: string; color: string; border: string }> = {
  attacker: {
    label: 'Attacker breakthrough',
    color: 'text-red-300 bg-red-500/15',
    border: 'border-red-400/40',
  },
  defender: {
    label: 'Defender holds',
    color: 'text-blue-300 bg-blue-500/15',
    border: 'border-blue-400/40',
  },
  stalemate: {
    label: 'Stalemate',
    color: 'text-yellow-200 bg-yellow-500/20',
    border: 'border-yellow-400/40',
  },
};

function formatStrength(value: number): string {
  return value.toFixed(0);
}

export function BattleResultDisplay({ report, attackerName, defenderName }: BattleResultDisplayProps) {
  const totalStrength = report.attackerStrength + report.defenderStrength;
  const attackerShare = totalStrength > 0 ? (report.attackerStrength / totalStrength) * 100 : 50;
  const defenderShare = 100 - attackerShare;
  const { label, color, border } = outcomeStyles[report.outcome];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="grid gap-4 rounded-xl border border-cyan-500/30 bg-black/60 p-4"
      >
        <div className={`flex items-center justify-between rounded-lg border ${border} px-3 py-2 ${color}`}>
          <span className="text-xs font-mono uppercase tracking-[0.3em] text-cyan-200/80">Battle Outcome</span>
          <span className="text-sm font-semibold">{label}</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4">
            <p className="text-xs font-mono uppercase tracking-widest text-red-200/70">{attackerName} (Attacker)</p>
            <p className="mt-2 text-3xl font-bold text-red-200">{formatStrength(report.attackerStrength)}</p>
            <p className="text-xs text-red-200/70">strength score</p>
            <p className="mt-3 text-xs text-red-200/70">
              {report.attackerCommitted} committed • {report.attackerRemaining} remaining • {report.attackerLosses} losses
            </p>
          </div>
          <div className="rounded-lg border border-blue-500/40 bg-blue-500/10 p-4">
            <p className="text-xs font-mono uppercase tracking-widest text-blue-200/70">{defenderName} (Defender)</p>
            <p className="mt-2 text-3xl font-bold text-blue-200">{formatStrength(report.defenderStrength)}</p>
            <p className="text-xs text-blue-200/70">strength score</p>
            <p className="mt-3 text-xs text-blue-200/70">
              {report.defenderCommitted} stationed • {report.defenderRemaining} remaining • {report.defenderLosses} losses
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-widest text-cyan-300/80">
            <span>Strength comparison</span>
            <span>Ratio {report.strengthRatio.toFixed(2)} • Margin {report.strengthMargin.toFixed(0)}</span>
          </div>
          <div className="h-4 overflow-hidden rounded-full border border-cyan-500/30 bg-slate-900/70">
            <div className="flex h-full w-full">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${attackerShare}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                className="h-full bg-gradient-to-r from-red-500/80 to-red-400/80"
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${defenderShare}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 20, delay: 0.1 }}
                className="h-full bg-gradient-to-r from-blue-500/80 to-blue-400/80"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-cyan-500/30 bg-slate-900/50 p-3 text-xs text-cyan-200/80">
            <p className="font-semibold uppercase tracking-widest text-cyan-300">Losses</p>
            <p className="mt-2 flex items-center justify-between">
              <span>{attackerName}</span>
              <span className="font-mono text-red-300">-{report.attackerLosses}</span>
            </p>
            <p className="mt-1 flex items-center justify-between">
              <span>{defenderName}</span>
              <span className="font-mono text-blue-300">-{report.defenderLosses}</span>
            </p>
          </div>
          <div className="rounded-lg border border-cyan-500/30 bg-slate-900/50 p-3 text-xs text-cyan-200/80">
            <p className="font-semibold uppercase tracking-widest text-cyan-300">Supply posture</p>
            <p className="mt-2 flex items-center justify-between">
              <span>{attackerName}</span>
              <span className="font-mono text-red-200">×{report.supply.attacker.toFixed(2)}</span>
            </p>
            <p className="mt-1 flex items-center justify-between">
              <span>{defenderName}</span>
              <span className="font-mono text-blue-200">×{report.supply.defender.toFixed(2)}</span>
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export type BattleResultDisplayReport = BorderConflictSuccessPayload;
