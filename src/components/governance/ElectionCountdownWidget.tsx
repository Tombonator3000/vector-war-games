import type { GovernanceMetrics } from '@/hooks/useGovernance';

interface ElectionCountdownWidgetProps {
  metrics: GovernanceMetrics | undefined;
  onRequestFocus?: () => void;
}

export function ElectionCountdownWidget({ metrics, onRequestFocus }: ElectionCountdownWidgetProps) {
  if (!metrics) return null;

  const urgency = getUrgency(metrics.electionTimer);

  return (
    <button
      type="button"
      onClick={onRequestFocus}
      className={`relative flex w-full flex-col rounded border px-4 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
        urgency.border
      } ${urgency.background}`}
    >
      <span className="text-xs uppercase tracking-[0.3em] text-cyan-200/80">Election Countdown</span>
      <span className="mt-1 text-2xl font-mono text-cyan-100">{metrics.electionTimer} turns</span>
      <div className="mt-2 flex items-center gap-4 text-xs text-cyan-100/70">
        <span>Public Opinion: {Math.round(metrics.publicOpinion)}%</span>
        <span>Cabinet Approval: {Math.round(metrics.cabinetApproval)}%</span>
      </div>
      {urgency.message && (
        <span className="mt-2 rounded bg-black/40 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-red-300">
          {urgency.message}
        </span>
      )}
    </button>
  );
}

function getUrgency(turns: number) {
  if (turns <= 2) {
    return {
      border: 'border-red-500/60',
      background: 'bg-red-500/10 hover:bg-red-500/20',
      message: 'Mandate At Risk',
    } as const;
  }
  if (turns <= 5) {
    return {
      border: 'border-amber-400/60',
      background: 'bg-amber-400/10 hover:bg-amber-400/20',
      message: 'Campaign Sprint',
    } as const;
  }
  return {
    border: 'border-cyan-500/40',
    background: 'bg-cyan-500/10 hover:bg-cyan-500/20',
    message: '',
  } as const;
}
