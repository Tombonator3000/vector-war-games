import type { ResourceRefinementSystem } from "@/types/economicDepth";

interface ResourceRefinementPanelProps {
  system: ResourceRefinementSystem;
}

export function ResourceRefinementPanel({ system }: ResourceRefinementPanelProps) {
  return (
    <section className="rounded-lg border border-emerald-700 bg-slate-900/60 p-4 text-slate-100 shadow-lg">
      <header className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-emerald-300">Resource Refinement</h2>
          <p className="text-xs text-slate-400">Turn-by-turn conversion of raw resources into strategic assets.</p>
        </div>
        <div className="text-right text-xs">
          <p>
            Total Output <span className="font-semibold text-emerald-200">{system.totalOutput.toFixed(1)}</span>
          </p>
          <p>
            Active Refineries <span className="font-semibold text-emerald-200">{system.refineries.length}</span>
          </p>
        </div>
      </header>

      <div className="space-y-3 text-xs">
        <div>
          <h3 className="text-sm font-semibold text-emerald-200">Refineries</h3>
          {system.refineries.length === 0 ? (
            <p className="text-slate-400">No refineries constructed yet.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {system.refineries.map((refinery) => (
                <li key={refinery.id} className="rounded border border-slate-700 bg-slate-900/80 p-2">
                  <div className="flex justify-between">
                    <span className="font-semibold text-emerald-300">{refinery.type.toUpperCase()}</span>
                    <span>Lvl {refinery.level}</span>
                  </div>
                  <div className="mt-1 text-slate-400">
                    Efficiency {(refinery.efficiency * 100).toFixed(0)}% · Progress {refinery.progress.toFixed(0)}%
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-emerald-200">Active Orders</h3>
          {system.orders.length === 0 ? (
            <p className="text-slate-400">No refinement orders in queue.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {system.orders.map((order) => (
                <li key={order.id} className="rounded border border-slate-700 bg-slate-900/80 p-2">
                  <p className="font-semibold text-emerald-300">{order.refineryId}</p>
                  <p className="text-slate-400">Turns remaining {order.turnsRemaining}</p>
                  <p className="text-slate-500">Output {order.outputProduced.toFixed(1)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-emerald-200">Strategic Bonuses</h3>
          <ul className="mt-2 space-y-2">
            {system.bonuses.map((bonus) => (
              <li key={bonus.id} className="rounded border border-slate-700 bg-slate-900/80 p-2 text-slate-300">
                {bonus.description} ({(bonus.value * 100).toFixed(0)}%)
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
