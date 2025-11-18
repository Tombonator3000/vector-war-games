import { motion, AnimatePresence } from 'framer-motion';
import type { StrengthExchangeLog } from '@/hooks/useConventionalWarfare';

interface StrengthExchangePanelProps {
  exchanges: StrengthExchangeLog[];
  attackerName: string;
  defenderName: string;
  visible?: boolean;
}

export function StrengthExchangePanel({
  exchanges,
  attackerName,
  defenderName,
  visible = true,
}: StrengthExchangePanelProps) {
  if (!visible || exchanges.length === 0) return null;

  const totalAttackerLosses = exchanges.reduce((sum, exchange) => sum + exchange.attackerLosses, 0);
  const totalDefenderLosses = exchanges.reduce((sum, exchange) => sum + exchange.defenderLosses, 0);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        className="grid gap-4 p-4 rounded-lg bg-black/60 border border-cyan-500/30"
      >
        <div className="grid grid-cols-3 gap-3 text-center text-xs uppercase tracking-widest text-cyan-300">
          <div>
            <p className="font-mono text-cyan-400">Rounds</p>
            <p className="text-2xl font-bold text-cyan-100">{exchanges.length}</p>
          </div>
          <div className="border-l border-r border-cyan-500/30 px-2">
            <p className="font-mono text-red-300">{attackerName}</p>
            <p className="text-2xl font-bold text-red-200">-{totalAttackerLosses}</p>
          </div>
          <div>
            <p className="font-mono text-blue-300">{defenderName}</p>
            <p className="text-2xl font-bold text-blue-200">-{totalDefenderLosses}</p>
          </div>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {exchanges.map((exchange) => (
            <div
              key={exchange.round}
              className="relative rounded-lg border border-cyan-500/20 bg-slate-900/50 p-3"
            >
              <div className="absolute -left-2 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/30 text-xs font-bold text-cyan-100">
                {exchange.round}
              </div>
              <div className="pl-6 text-xs text-slate-200 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-cyan-200">Strength Exchange</p>
                  <p className="text-slate-400">
                    {attackerName}: {exchange.attackerStrength.toFixed(1)} • {defenderName}:{' '}
                    {exchange.defenderStrength.toFixed(1)}
                  </p>
                </div>
                <div className="text-right text-slate-300">
                  <p className="text-red-300">-{exchange.attackerLosses} attacker</p>
                  <p className="text-blue-300">-{exchange.defenderLosses} defender</p>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-400 pl-6">
                <div className="rounded bg-red-500/10 px-2 py-1 border border-red-500/30">
                  Remaining: {exchange.attackerRemaining}
                </div>
                <div className="rounded bg-blue-500/10 px-2 py-1 border border-blue-500/30 text-right">
                  Remaining: {exchange.defenderRemaining}
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

interface BattleStrengthSummaryProps {
  exchanges: StrengthExchangeLog[];
  attackerName: string;
  defenderName: string;
}

export function BattleStrengthSummary({ exchanges, attackerName, defenderName }: BattleStrengthSummaryProps) {
  if (exchanges.length === 0) return null;

  return (
    <div className="space-y-4">
      <StrengthExchangePanel
        exchanges={exchanges}
        attackerName={attackerName}
        defenderName={defenderName}
      />
    </div>
  );
}
