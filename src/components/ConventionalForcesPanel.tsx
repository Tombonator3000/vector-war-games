import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  ConventionalUnitState,
  ConventionalUnitTemplate,
  TerritoryState,
  NationConventionalProfile,
} from '@/hooks/useConventionalWarfare';

interface ConventionalForcesPanelProps {
  templates: ConventionalUnitTemplate[];
  units: ConventionalUnitState[];
  territories: TerritoryState[];
  profile: NationConventionalProfile;
  onTrain: (templateId: string) => void;
  onDeploy: (unitId: string, territoryId: string) => void;
  researchUnlocks?: Record<string, boolean>;
}

export function ConventionalForcesPanel({
  templates,
  units,
  territories,
  profile,
  onTrain,
  onDeploy,
  researchUnlocks,
}: ConventionalForcesPanelProps) {
  const [deploymentChoices, setDeploymentChoices] = useState<Record<string, string>>({});

  const availableTerritories = useMemo(
    () => [...territories].sort((a, b) => a.name.localeCompare(b.name)),
    [territories],
  );
  const reserves = useMemo(() => units.filter(unit => unit.status === 'reserve'), [units]);
  const deployed = useMemo(() => units.filter(unit => unit.status === 'deployed'), [units]);

  const handleDeploy = (unitId: string) => {
    const territoryId = deploymentChoices[unitId] ?? availableTerritories[0]?.id;
    if (!territoryId) {
      return;
    }
    onDeploy(unitId, territoryId);
  };

  return (
    <div className="grid gap-6">
      <section className="rounded border border-cyan-500/40 bg-black/50 p-4 shadow-lg shadow-cyan-500/10">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.35em] text-cyan-400">Force Readiness</p>
            <h3 className="text-lg font-semibold text-cyan-200">{Math.round(profile.readiness)}%</h3>
          </div>
          <div className="text-right">
            <p className="text-xs font-mono uppercase tracking-[0.35em] text-cyan-400">Reserve Pool</p>
            <h3 className="text-lg font-semibold text-cyan-200">{profile.reserve} units</h3>
          </div>
        </header>

        <div className="grid gap-3 md:grid-cols-3">
          {templates.map(template => {
            const unlocked = !template.requiresResearch || !!researchUnlocks?.[template.requiresResearch];
            return (
              <div
                key={template.id}
                className="rounded border border-cyan-500/30 bg-black/60 p-3 transition hover:border-cyan-300/60"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-cyan-200">{template.name}</h4>
                  <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wide text-cyan-300">
                    {template.type}
                  </span>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-cyan-300/80">{template.description}</p>
                <dl className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] font-mono text-cyan-300/90">
                  <div>
                    <dt className="uppercase tracking-widest text-cyan-400/90">Attack</dt>
                    <dd>{template.attack}</dd>
                  </div>
                  <div>
                    <dt className="uppercase tracking-widest text-cyan-400/90">Defense</dt>
                    <dd>{template.defense}</dd>
                  </div>
                  <div>
                    <dt className="uppercase tracking-widest text-cyan-400/90">Support</dt>
                    <dd>{template.support}</dd>
                  </div>
                  <div>
                    <dt className="uppercase tracking-widest text-cyan-400/90">Readiness</dt>
                    <dd>-{template.readinessImpact}</dd>
                  </div>
                </dl>
                {template.requiresResearch && !unlocked && (
                  <p className="mt-2 text-[10px] font-mono uppercase tracking-[0.3em] text-amber-300/80">
                    Requires {template.requiresResearch.replace(/_/g, ' ').toUpperCase()}
                  </p>
                )}
                <Button
                  onClick={() => onTrain(template.id)}
                  className="mt-4 w-full bg-cyan-500 text-black hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-cyan-500/30 disabled:text-cyan-200/50"
                  disabled={!unlocked}
                >
                  Queue {template.type.toUpperCase()}
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded border border-cyan-500/30 bg-black/60 p-4">
          <header className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold tracking-[0.3em] text-cyan-300">Reserve Units</h3>
            <span className="text-[11px] font-mono text-cyan-300/80">{reserves.length} ready</span>
          </header>
          <div className="space-y-3">
            {reserves.length === 0 && (
              <p className="text-[11px] text-cyan-300/70">No units staged in reserve. Train additional formations to expand options.</p>
            )}
            {reserves.map(unit => (
              <div
                key={unit.id}
                className="rounded border border-cyan-500/20 bg-black/40 p-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-cyan-200">{unit.label}</p>
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-cyan-400/80">{unit.templateId}</p>
                  </div>
                  <span className="text-xs font-mono text-cyan-300/80">{Math.round(unit.readiness)}% ready</span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-[11px]">
                  <label htmlFor={`deploy-${unit.id}`} className="text-cyan-300/80">
                    Deploy to
                  </label>
                  <select
                    id={`deploy-${unit.id}`}
                    className="flex-1 rounded border border-cyan-500/40 bg-black/80 px-2 py-1 text-cyan-200"
                    value={deploymentChoices[unit.id] ?? ''}
                    onChange={event =>
                      setDeploymentChoices(prev => ({
                        ...prev,
                        [unit.id]: event.target.value,
                      }))
                    }
                  >
                    <option value="" disabled>
                      Select territory
                    </option>
                    {availableTerritories.map(territory => (
                      <option key={territory.id} value={territory.id}>
                        {territory.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeploy(unit.id)}
                    className="border-cyan-500/50 text-cyan-200 hover:bg-cyan-500/10"
                  >
                    Deploy
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded border border-cyan-500/30 bg-black/60 p-4">
          <header className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold tracking-[0.3em] text-cyan-300">Deployed Units</h3>
            <span className="text-[11px] font-mono text-cyan-300/80">{deployed.length} active</span>
          </header>
          <div className="space-y-3">
            {deployed.length === 0 && (
              <p className="text-[11px] text-cyan-300/70">No formations deployed to the field. Deploy units to contest territories and defend borders.</p>
            )}
            {deployed.map(unit => (
              <div key={unit.id} className="rounded border border-cyan-500/20 bg-black/40 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-cyan-200">{unit.label}</p>
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-cyan-400/80">{unit.templateId}</p>
                  </div>
                  <span className="text-xs font-mono text-cyan-300/80">{Math.round(unit.readiness)}% readiness</span>
                </div>
                <p className="mt-2 text-[11px] text-cyan-300/80">
                  Stationed in{' '}
                  {availableTerritories.find(territory => territory.id === unit.locationId)?.name ?? 'unknown theatre'}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
