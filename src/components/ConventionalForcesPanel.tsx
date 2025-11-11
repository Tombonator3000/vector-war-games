import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  ConventionalUnitTemplate,
  TerritoryState,
  NationConventionalProfile,
} from '@/hooks/useConventionalWarfare';
import { Shield, Zap, Users } from 'lucide-react';

interface ConventionalForcesPanelProps {
  templates: ConventionalUnitTemplate[];
  territories: TerritoryState[];
  profile: NationConventionalProfile;
  onTrain: (templateId: string, territoryId?: string) => void;
  researchUnlocks?: Record<string, boolean>;
  playerPopulation?: number;
  availableReinforcements?: number;
  playerId: string;
}

export function ConventionalForcesPanel({
  templates,
  territories,
  profile,
  onTrain,
  researchUnlocks,
  playerPopulation,
  availableReinforcements,
  playerId,
}: ConventionalForcesPanelProps) {
  const [selectedTerritory, setSelectedTerritory] = useState<string>('');

  const playerTerritories = useMemo(
    () => territories.filter((t) => t.controllingNationId === playerId),
    [territories, playerId],
  );

  const totalArmies = useMemo(
    () => playerTerritories.reduce((sum, t) => sum + t.armies, 0),
    [playerTerritories],
  );

  const totalUnitComposition = useMemo(() => {
    return playerTerritories.reduce(
      (acc, t) => ({
        army: acc.army + t.unitComposition.army,
        navy: acc.navy + t.unitComposition.navy,
        air: acc.air + t.unitComposition.air,
      }),
      { army: 0, navy: 0, air: 0 },
    );
  }, [playerTerritories]);

  return (
    <div className="grid gap-6">
      {/* Overview Panel */}
      <section className="rounded border border-cyan-500/40 bg-black/50 p-4 shadow-lg shadow-cyan-500/10">
        <header className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="text-center">
            <p className="text-xs font-mono uppercase tracking-[0.35em] text-cyan-400">Force Readiness</p>
            <h3 className="text-2xl font-semibold text-cyan-200">{Math.round(profile.readiness)}%</h3>
          </div>
          <div className="text-center">
            <p className="text-xs font-mono uppercase tracking-[0.35em] text-cyan-400">Total Armies</p>
            <h3 className="text-2xl font-semibold text-cyan-200">{totalArmies}</h3>
          </div>
          <div className="text-center">
            <p className="text-xs font-mono uppercase tracking-[0.35em] text-cyan-400">Territories</p>
            <h3 className="text-2xl font-semibold text-cyan-200">{playerTerritories.length}</h3>
          </div>
          <div className="text-center">
            <p className="text-xs font-mono uppercase tracking-[0.35em] text-cyan-400">Population</p>
            <h3 className="text-2xl font-semibold text-cyan-200">
              {playerPopulation ? `${Math.floor(playerPopulation)}M` : 'N/A'}
            </h3>
          </div>
        </header>

        {/* Unit Composition */}
        <div className="rounded border border-cyan-500/20 bg-black/40 p-3">
          <p className="mb-2 text-xs font-mono uppercase tracking-widest text-cyan-400">Force Composition</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded bg-green-500/10 p-2">
              <Users className="mx-auto h-5 w-5 text-green-400" />
              <p className="mt-1 text-lg font-bold text-green-300">{totalUnitComposition.army}</p>
              <p className="text-[10px] uppercase tracking-wide text-green-400/80">Ground Forces</p>
            </div>
            <div className="rounded bg-blue-500/10 p-2">
              <Shield className="mx-auto h-5 w-5 text-blue-400" />
              <p className="mt-1 text-lg font-bold text-blue-300">{totalUnitComposition.navy}</p>
              <p className="text-[10px] uppercase tracking-wide text-blue-400/80">Naval Forces</p>
            </div>
            <div className="rounded bg-purple-500/10 p-2">
              <Zap className="mx-auto h-5 w-5 text-purple-400" />
              <p className="mt-1 text-lg font-bold text-purple-300">{totalUnitComposition.air}</p>
              <p className="text-[10px] uppercase tracking-wide text-purple-400/80">Air Forces</p>
            </div>
          </div>
        </div>

        {availableReinforcements !== undefined && availableReinforcements > 0 && (
          <div className="mt-3 rounded-lg border-2 border-green-500/50 bg-green-500/10 p-3 text-center">
            <p className="text-sm font-mono uppercase tracking-widest text-green-300">
              🎖️ Reinforcements Available
            </p>
            <p className="mt-1 text-3xl font-bold text-green-200">{availableReinforcements}</p>
            <p className="mt-1 text-xs text-green-300/80">
              Go to Territory Map to deploy reinforcements
            </p>
          </div>
        )}
      </section>

      {/* Training Panel */}
      <section className="rounded border border-cyan-500/40 bg-black/50 p-4 shadow-lg shadow-cyan-500/10">
        <h3 className="mb-4 text-lg font-semibold tracking-wide text-cyan-300">Train New Units</h3>

        {/* Territory Selector */}
        <div className="mb-4">
          <label htmlFor="deploy-territory" className="block text-xs font-mono uppercase tracking-widest text-cyan-400">
            Deploy to Territory
          </label>
          <select
            id="deploy-territory"
            className="mt-1 w-full rounded border border-cyan-500/40 bg-black/80 px-3 py-2 text-sm text-cyan-200"
            value={selectedTerritory}
            onChange={(e) => setSelectedTerritory(e.target.value)}
          >
            <option value="">Auto-select (nearest)</option>
            {playerTerritories.map((territory) => (
              <option key={territory.id} value={territory.id}>
                {territory.name} ({territory.armies} armies)
              </option>
            ))}
          </select>
        </div>

        {/* Unit Templates */}
        <div className="grid gap-3 md:grid-cols-3">
          {templates.map((template) => {
            const unlocked = !template.requiresResearch || !!researchUnlocks?.[template.requiresResearch];
            const armiesPerUnit = template.type === 'army' ? 5 : template.type === 'navy' ? 4 : 3;

            return (
              <div
                key={template.id}
                className={`rounded border p-3 transition ${
                  unlocked
                    ? 'border-cyan-500/30 bg-black/60 hover:border-cyan-300/60'
                    : 'border-gray-500/20 bg-black/30 opacity-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-cyan-200">{template.name}</h4>
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-mono uppercase tracking-wide ${
                      template.type === 'army'
                        ? 'bg-green-500/20 text-green-300'
                        : template.type === 'navy'
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'bg-purple-500/20 text-purple-300'
                    }`}
                  >
                    {template.type}
                  </span>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-cyan-300/80">{template.description}</p>

                {/* Armies per unit */}
                <div className="mt-3 rounded bg-cyan-500/10 p-2 text-center">
                  <p className="text-xs uppercase tracking-widest text-cyan-400">Deploys</p>
                  <p className="text-2xl font-bold text-cyan-200">{armiesPerUnit}</p>
                  <p className="text-[10px] text-cyan-300/80">armies</p>
                </div>

                {/* Cost */}
                <div className="mt-2 text-[10px] font-mono text-cyan-300/90">
                  <p className="uppercase tracking-widest text-cyan-400">Cost:</p>
                  {template.cost.production && <p>Production: {template.cost.production}</p>}
                  {template.cost.intel && <p>Intel: {template.cost.intel}</p>}
                  {template.cost.uranium && <p>Uranium: {template.cost.uranium}</p>}
                </div>

                {/* Combat bonuses */}
                <div className="mt-2 text-[10px] font-mono text-cyan-300/70">
                  {template.type === 'air' && <p>✈️ Air superiority boosts strike strength</p>}
                  {template.type === 'navy' && <p>⚓ Fleet screens bolster defensive strength</p>}
                  {template.type === 'army' && <p>🎖️ Balanced combined-arms baseline</p>}
                </div>

                {template.requiresResearch && !unlocked && (
                  <p className="mt-2 text-[10px] font-mono uppercase tracking-[0.3em] text-amber-300/80">
                    Requires {template.requiresResearch.replace(/_/g, ' ')}
                  </p>
                )}
                <Button
                  onClick={() => onTrain(template.id, selectedTerritory || undefined)}
                  className="mt-4 w-full bg-cyan-500 text-black hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-cyan-500/30 disabled:text-cyan-200/50"
                  disabled={!unlocked}
                >
                  Train {template.type.toUpperCase()}
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Territory Status */}
      <section className="rounded border border-cyan-500/40 bg-black/50 p-4 shadow-lg shadow-cyan-500/10">
        <h3 className="mb-4 text-lg font-semibold tracking-wide text-cyan-300">Territory Status</h3>
        <div className="space-y-2">
          {playerTerritories.map((territory) => (
            <div
              key={territory.id}
              className="flex items-center justify-between rounded border border-cyan-500/20 bg-black/40 p-3"
            >
              <div>
                <p className="text-sm font-semibold text-cyan-200">{territory.name}</p>
                <p className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">{territory.region}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right text-xs font-mono text-cyan-300/80">
                  <p>
                    <span className="font-bold text-cyan-200">{territory.armies}</span> armies
                  </p>
                  <p className="text-[10px]">
                    {territory.unitComposition.army > 0 && `A:${territory.unitComposition.army} `}
                    {territory.unitComposition.navy > 0 && `N:${territory.unitComposition.navy} `}
                    {territory.unitComposition.air > 0 && `F:${territory.unitComposition.air}`}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {playerTerritories.length === 0 && (
            <p className="text-center text-sm text-cyan-300/70">No territories under your control</p>
          )}
        </div>
      </section>
    </div>
  );
}
