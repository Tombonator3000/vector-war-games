import { Fragment } from 'react';
import { Skull, Globe2, Activity, AlertTriangle } from 'lucide-react';
import type { CasualtySummaryPayload, NationImpactSummary } from '@/lib/pandemic/casualtyAlertEvaluator';

interface CasualtyImpactSummaryProps {
  summary: CasualtySummaryPayload;
}

const formatCompactNumber = (value: number) => {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toLocaleString();
};

const formatFullNumber = (value: number) => value.toLocaleString();

const renderNationImpactRow = (nation: NationImpactSummary, index: number) => (
  <div
    key={nation.nationId}
    className="flex flex-wrap items-center justify-between gap-2 rounded border border-cyan-500/30 bg-slate-900/40 p-3"
  >
    <div className="flex items-center gap-3">
      <span className="text-xs font-mono uppercase tracking-widest text-cyan-300/70">#{index + 1}</span>
      <span className="text-base font-semibold text-cyan-100">{nation.nationName}</span>
    </div>
    <div className="flex flex-wrap items-center gap-4 text-xs text-cyan-200/80">
      <span className="flex items-center gap-1">
        <Skull className="h-4 w-4 text-red-400" />
        <span>Total: {formatFullNumber(nation.totalDeaths)}</span>
      </span>
      {nation.turnDeaths > 0 ? (
        <span className="flex items-center gap-1">
          <Activity className="h-4 w-4 text-amber-400" />
          <span>Last turn: {formatFullNumber(nation.turnDeaths)}</span>
        </span>
      ) : null}
    </div>
  </div>
);

export function CasualtyImpactSummary({ summary }: CasualtyImpactSummaryProps) {
  const { type, threshold, totalCasualties, pandemicCasualties, plagueCasualties, turn, focusNation, hardestHit } = summary;
  const title =
    type === 'global'
      ? `Combined fatalities have exceeded ${formatFullNumber(threshold)}.`
      : `${focusNation?.nationName ?? 'Unknown nation'} suffered ${formatFullNumber(focusNation?.turnDeaths ?? 0)} deaths this turn.`;

  const subheading =
    type === 'global'
      ? 'Escalating biohazard detected across multiple theatres.'
      : 'Localized collapse event detected — humanitarian systems overwhelmed.';

  return (
    <div className="space-y-6 text-cyan-100">
      <header className="space-y-2 rounded border border-cyan-500/40 bg-slate-900/60 p-5 shadow-lg shadow-cyan-500/10">
        <div className="flex items-center gap-3 text-sm uppercase tracking-[0.35em] text-cyan-300/80">
          <Globe2 className="h-5 w-5 text-cyan-300" />
          <span>Turn {turn}</span>
        </div>
        <h2 className="text-2xl font-bold text-cyan-200">{title}</h2>
        <p className="text-sm text-cyan-200/80">{subheading}</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded border border-red-500/50 bg-red-950/40 p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-red-300/80">
            <Skull className="h-4 w-4 text-red-300" />
            <span>Global casualties</span>
          </div>
          <div className="mt-2 text-3xl font-bold text-red-200">{formatFullNumber(totalCasualties)}</div>
          <div className="text-xs text-red-200/70">Threshold crossed: {formatFullNumber(threshold)}</div>
        </div>

        <div className="rounded border border-amber-500/40 bg-amber-900/30 p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-amber-300/90">
            <AlertTriangle className="h-4 w-4 text-amber-300" />
            <span>Active outbreak impact</span>
          </div>
          <div className="mt-2 text-2xl font-semibold text-amber-100">{formatCompactNumber(pandemicCasualties)}</div>
          <div className="text-xs text-amber-200/70">Pandemic casualties to date</div>
        </div>

        <div className="rounded border border-emerald-500/40 bg-emerald-900/30 p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-emerald-300/90">
            <Activity className="h-4 w-4 text-emerald-300" />
            <span>Bioforge aftermath</span>
          </div>
          <div className="mt-2 text-2xl font-semibold text-emerald-100">{formatCompactNumber(plagueCasualties)}</div>
          <div className="text-xs text-emerald-200/70">Bio-weapon casualties to date</div>
        </div>
      </section>

      {focusNation ? (
        <section className="space-y-3 rounded border border-cyan-500/30 bg-slate-900/40 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300/80">Hot zone focus</h3>
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-cyan-100/90">
            <div className="flex items-center gap-2">
              <Skull className="h-5 w-5 text-red-300" />
              <span className="text-lg font-semibold text-cyan-100">{focusNation.nationName}</span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1 text-red-200">
                <AlertTriangle className="h-4 w-4" />
                Turn losses: {formatFullNumber(focusNation.turnDeaths)}
              </span>
              <span className="flex items-center gap-1 text-cyan-200/80">
                Total to date: {formatFullNumber(focusNation.totalDeaths)}
              </span>
            </div>
          </div>
        </section>
      ) : null}

      {hardestHit.length > 0 ? (
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300/80">Hardest-hit regions</h3>
          <div className="space-y-2">
            {hardestHit.map((nation, index) => (
              <Fragment key={nation.nationId}>{renderNationImpactRow(nation, index)}</Fragment>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
