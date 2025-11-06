import type { EconomicInfrastructureSystem } from "@/types/economicDepth";

interface EconomicInfrastructurePanelProps {
  system: EconomicInfrastructureSystem;
}

export function EconomicInfrastructurePanel({ system }: EconomicInfrastructurePanelProps) {
  return (
    <section className="rounded-lg border border-amber-700 bg-slate-900/60 p-4 text-slate-100 shadow-lg">
      <header className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-amber-300">Infrastructure</h2>
          <p className="text-xs text-slate-400">Construction projects shaping long-term economic potential.</p>
        </div>
        <div className="text-right text-xs">
          <p>
            Avg. Level <span className="font-semibold text-amber-200">{system.statistics.averageLevel.toFixed(1)}</span>
          </p>
          <p>
            Damaged <span className="font-semibold text-amber-200">{system.statistics.damagedStructures}</span>
          </p>
        </div>
      </header>

      <div className="space-y-3 text-xs">
        <div>
          <h3 className="text-sm font-semibold text-amber-200">Projects</h3>
          {system.projects.length === 0 ? (
            <p className="text-slate-400">No infrastructure queued.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {system.projects.map((project) => (
                <li key={project.id} className="rounded border border-slate-700 bg-slate-900/80 p-2">
                  <div className="flex justify-between">
                    <span className="font-semibold text-amber-300">{project.type}</span>
                    <span>Lvl {project.level}</span>
                  </div>
                  <p className="text-slate-400">Progress {project.progress}/{project.turnsRequired}</p>
                  {project.isDamaged && <p className="text-rose-300">Damaged - repair required</p>}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-amber-200">Economic Zones</h3>
          {system.zones.length === 0 ? (
            <p className="text-slate-400">No active zones.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {system.zones.map((zone) => (
                <li key={zone.id} className="rounded border border-slate-700 bg-slate-900/80 p-2">
                  <div className="flex justify-between">
                    <span className="font-semibold text-amber-300">{zone.name}</span>
                    <span>Bonus {(zone.bonus * 100).toFixed(0)}%</span>
                  </div>
                  <p className="text-slate-400">Territories {zone.territories.join(", ")}</p>
                  <p className="text-slate-500">Maintenance {zone.maintenanceCost.toFixed(1)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
