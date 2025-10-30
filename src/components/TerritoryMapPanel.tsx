import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ConventionalUnitState, TerritoryState } from '@/hooks/useConventionalWarfare';

interface TerritoryMapPanelProps {
  territories: TerritoryState[];
  units: ConventionalUnitState[];
  playerId: string;
  onBorderConflict: (territoryId: string, defenderId: string) => void;
  onProxyEngagement: (territoryId: string, opposingId: string) => void;
  playerPopulation?: number;
}

export function TerritoryMapPanel({
  territories,
  units,
  playerId,
  onBorderConflict,
  onProxyEngagement,
  playerPopulation,
}: TerritoryMapPanelProps) {
  const unitsByTerritory = useMemo(() => {
    return units.reduce<Record<string, ConventionalUnitState[]>>((acc, unit) => {
      if (!unit.locationId) return acc;
      if (!acc[unit.locationId]) {
        acc[unit.locationId] = [];
      }
      acc[unit.locationId].push(unit);
      return acc;
    }, {});
  }, [units]);

  const sortedTerritories = useMemo(
    () => [...territories].sort((a, b) => a.name.localeCompare(b.name)),
    [territories],
  );

  return (
    <div className="space-y-3">
      {playerPopulation !== undefined && (
        <div className="mb-3 rounded border border-cyan-500/30 bg-black/40 p-3 text-center">
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-cyan-400">National Population</p>
          <h3 className="text-lg font-semibold text-cyan-200">{Math.floor(playerPopulation)}M Citizens</h3>
        </div>
      )}
      {sortedTerritories.map(territory => {
        const stationed = unitsByTerritory[territory.id] ?? [];
        const playerPresence = stationed.filter(unit => unit.ownerId === playerId).length;
        const opponentPresence = stationed.length - playerPresence;
        const isPlayerOwned = territory.controllingNationId === playerId;
        const ownerLabel = territory.controllingNationId ?? 'Uncontrolled';

        return (
          <div
            key={territory.id}
            className="rounded border border-cyan-500/30 bg-black/50 p-4 shadow-md shadow-cyan-500/10"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-mono uppercase tracking-[0.3em] text-cyan-400">{territory.region}</p>
                <h3 className="text-base font-semibold text-cyan-200">{territory.name}</h3>
              </div>
              <div className="text-right text-[11px] font-mono text-cyan-300/80">
                <p>Control: {ownerLabel}</p>
                <p>Strategic Value: {territory.strategicValue}</p>
                <p>Conflict Risk: {territory.conflictRisk}</p>
              </div>
            </div>

            <div className="mt-3 grid gap-4 md:grid-cols-3">
              <div className="rounded border border-cyan-500/20 bg-black/40 p-3 text-[11px] text-cyan-300/80">
                <p>Production Bonus: +{territory.productionBonus}</p>
                <p>Instability Modifier: {territory.instabilityModifier >= 0 ? '+' : ''}{territory.instabilityModifier}</p>
                <p>Neighbors: {territory.neighbors.join(', ') || 'None'}</p>
              </div>
              <div className="rounded border border-cyan-500/20 bg-black/40 p-3 text-[11px] text-cyan-300/80">
                <p>Player Units: {playerPresence}</p>
                <p>Opposition Units: {Math.max(opponentPresence, 0)}</p>
                <p>Total Forces: {stationed.length}</p>
              </div>
              <div className="flex items-center justify-end gap-2">
                {!isPlayerOwned && territory.controllingNationId && (
                  <Button
                    size="sm"
                    className="border-cyan-500/40 bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/30"
                    onClick={() => onBorderConflict(territory.id, territory.controllingNationId!)}
                  >
                    Border Conflict
                  </Button>
                )}
                {!isPlayerOwned && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-cyan-500/40 text-cyan-200 hover:bg-cyan-500/10"
                    onClick={() => onProxyEngagement(territory.id, territory.controllingNationId ?? 'independent')}
                  >
                    Proxy Engagement
                  </Button>
                )}
                {isPlayerOwned && (
                  <span className="text-[11px] font-mono text-cyan-300/80">
                    Controlled by command. Maintain readiness to deter incursions.
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
