import type { EnhancedTradeSystem, NationId } from "@/types/economicDepth";

interface EnhancedTradePanelProps {
  system: EnhancedTradeSystem;
  focusNationId?: NationId;
}

export function EnhancedTradePanel({ system, focusNationId }: EnhancedTradePanelProps) {
  return (
    <section className="rounded-lg border border-cyan-700 bg-slate-900/60 p-4 text-slate-100 shadow-lg">
      <header className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-cyan-300">Trade Network</h2>
          <p className="text-xs text-slate-400">Efficiency driven by protected routes and active agreements.</p>
        </div>
        <div className="text-right text-xs">
          <p>
            Capacity <span className="font-semibold text-cyan-200">{system.statistics.totalCapacity.toFixed(1)}</span>
          </p>
          <p>
            Avg. Efficiency <span className="font-semibold text-cyan-200">{(system.statistics.averageEfficiency * 100).toFixed(0)}%</span>
          </p>
        </div>
      </header>

      {focusNationId && (
        <p className="mb-4 text-sm text-slate-300">
          Focus nation maintains {system.routes.filter((route) => route.origin === focusNationId || route.destination === focusNationId).length} routes.
        </p>
      )}

      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-cyan-200">Active Routes</h3>
          {system.routes.length === 0 ? (
            <p className="text-xs text-slate-400">No routes established yet.</p>
          ) : (
            <ul className="mt-2 space-y-2 text-xs">
              {system.routes.map((route) => (
                <li
                  key={route.id}
                  className="rounded border border-slate-700 bg-slate-900/80 p-2"
                >
                  <div className="flex justify-between">
                    <span className="font-semibold text-cyan-300">
                      {route.origin} → {route.destination}
                    </span>
                    <span>{route.capacity.toFixed(1)} units</span>
                  </div>
                  <div className="mt-1 flex justify-between text-slate-400">
                    <span>Efficiency {(route.efficiency * 100).toFixed(0)}%</span>
                    <span>Disruption {(route.disruptionRisk * 100).toFixed(0)}%</span>
                  </div>
                  <div className="mt-1 text-slate-400">
                    Protection Naval {(route.protection.naval * 100).toFixed(0)}% · Air {(route.protection.air * 100).toFixed(0)}%
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-cyan-200">Trade Agreements</h3>
          {system.agreements.length === 0 ? (
            <p className="text-xs text-slate-400">No active agreements.</p>
          ) : (
            <ul className="mt-2 space-y-2 text-xs">
              {system.agreements.map((agreement) => (
                <li key={agreement.id} className="rounded border border-slate-700 bg-slate-900/80 p-2">
                  <p className="font-semibold text-cyan-300">{agreement.participants.join(" · ")}</p>
                  <p className="text-slate-400">{agreement.terms}</p>
                  <p className="text-slate-500">{agreement.turnsRemaining} turns remaining</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-cyan-200">Sanctions</h3>
          {system.sanctions.length === 0 ? (
            <p className="text-xs text-slate-400">No sanctions currently imposed.</p>
          ) : (
            <ul className="mt-2 space-y-2 text-xs">
              {system.sanctions.map((sanction) => (
                <li key={sanction.id} className="rounded border border-slate-700 bg-slate-900/80 p-2">
                  <p className="font-semibold text-rose-300">{sanction.target}</p>
                  <p className="text-slate-400">{sanction.restrictions}</p>
                  <p className="text-slate-500">Severity {(sanction.severity * 100).toFixed(0)}%</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
