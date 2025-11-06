import { useMemo, useState } from "react";
import { EnhancedTradePanel } from "@/components/EnhancedTradePanel";
import { EconomicInfrastructurePanel } from "@/components/EconomicInfrastructurePanel";
import { ResourceRefinementPanel } from "@/components/ResourceRefinementPanel";
import { useEconomicDepth } from "@/hooks/useEconomicDepth";
import type { EconomicDepthSystem, UseEconomicDepthParams } from "@/types/economicDepth";

interface EconomicDashboardProps extends UseEconomicDepthParams {
  title?: string;
  className?: string;
}

const tabs = ["overview", "trade", "refinement", "infrastructure"] as const;

type DashboardTab = (typeof tabs)[number];

function OverviewPanel({ system }: { system: EconomicDepthSystem }) {
  const recommendations = useMemo(() => {
    if (!system.focusNationId) {
      return [];
    }

    return system.getEconomicRecommendations(system.focusNationId);
  }, [system.focusNationId, system.getEconomicRecommendations]);

  return (
    <section className="rounded-lg border border-cyan-700/60 bg-slate-900/60 p-4 text-slate-100 shadow-lg">
      <header className="mb-3">
        <h2 className="text-lg font-semibold text-cyan-300">Economic Overview</h2>
        <p className="text-xs text-slate-400">Snapshot of the current turn's economic health.</p>
      </header>
      <dl className="grid grid-cols-2 gap-3 text-xs">
        <div className="rounded border border-slate-700 bg-slate-900/80 p-3">
          <dt className="text-cyan-200">Economic Power</dt>
          <dd className="text-lg font-semibold text-cyan-100">{system.snapshot.economicPower.toFixed(1)}</dd>
        </div>
        <div className="rounded border border-slate-700 bg-slate-900/80 p-3">
          <dt className="text-cyan-200">Trade Capacity</dt>
          <dd className="text-lg font-semibold text-cyan-100">{system.snapshot.trade.totalCapacity.toFixed(1)}</dd>
        </div>
        <div className="rounded border border-slate-700 bg-slate-900/80 p-3">
          <dt className="text-emerald-200">Refined Output</dt>
          <dd className="text-lg font-semibold text-emerald-100">{system.snapshot.refinement.totalOutput.toFixed(1)}</dd>
        </div>
        <div className="rounded border border-slate-700 bg-slate-900/80 p-3">
          <dt className="text-amber-200">Infrastructure Level</dt>
          <dd className="text-lg font-semibold text-amber-100">{system.snapshot.infrastructure.averageLevel.toFixed(1)}</dd>
        </div>
      </dl>

      {system.focusNationId && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-cyan-200">Advisor Recommendations</h3>
          <ul className="mt-2 space-y-2 text-xs">
            {recommendations.map((recommendation, index) => (
              <li key={index} className="rounded border border-slate-700 bg-slate-900/80 p-2 text-slate-300">
                {recommendation}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export function EconomicDashboard({ title = "Economic Depth", className, ...params }: EconomicDashboardProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const system = useEconomicDepth(params);

  return (
    <div className={className}>
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-cyan-200">{title}</h1>
          <p className="text-xs text-slate-400">Turn {system.lastProcessedTurn} • Focus nation: {system.focusNationId ?? "Unassigned"}</p>
        </div>
        <nav className="flex gap-2 text-xs">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded px-3 py-1 font-semibold uppercase tracking-wide transition-colors ${
                activeTab === tab ? "bg-cyan-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {activeTab === "overview" && <OverviewPanel system={system} />}
        {activeTab === "trade" && <EnhancedTradePanel system={system.trade} focusNationId={system.focusNationId} />}
        {activeTab === "refinement" && <ResourceRefinementPanel system={system.refinement} />}
        {activeTab === "infrastructure" && <EconomicInfrastructurePanel system={system.infrastructure} />}
        {activeTab === "overview" && (
          <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-xs text-slate-300 shadow-lg">
            <h3 className="text-sm font-semibold text-cyan-200">Systems Summary</h3>
            <p className="mt-2">
              Trade routes contribute {Math.round(system.snapshot.trade.averageEfficiency * 100)}% average efficiency across {system.trade.routes.length} lanes.
            </p>
            <p className="mt-2">
              Refinement output totals {system.snapshot.refinement.totalOutput.toFixed(1)} units with {system.refinement.refineries.length} refineries in operation.
            </p>
            <p className="mt-2">
              Infrastructure averages level {system.snapshot.infrastructure.averageLevel.toFixed(1)} with {system.snapshot.infrastructure.activeZones} economic zones supplying bonuses.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
