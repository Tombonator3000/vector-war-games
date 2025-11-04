import { useMemo, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { TerritoryState } from '@/hooks/useConventionalWarfare';
import { Swords, ArrowRight, Shield, Users } from 'lucide-react';

interface TerritoryMapPanelProps {
  territories: TerritoryState[];
  playerId: string;
  onAttack: (fromTerritoryId: string, toTerritoryId: string, armies: number) => void;
  onMove: (fromTerritoryId: string, toTerritoryId: string, armies: number) => void;
  onProxyEngagement: (territoryId: string, opposingId: string) => void;
  availableReinforcements?: number;
  onPlaceReinforcements?: (territoryId: string, count: number) => void;
}

export function TerritoryMapPanel({
  territories,
  playerId,
  onAttack,
  onMove,
  onProxyEngagement,
  availableReinforcements,
  onPlaceReinforcements,
}: TerritoryMapPanelProps) {
  const [selectedSourceTerritory, setSelectedSourceTerritory] = useState<string | null>(null);
  const [armyCount, setArmyCount] = useState<number>(1);

  const sortedTerritories = useMemo(
    () => [...territories].sort((a, b) => a.name.localeCompare(b.name)),
    [territories],
  );

  const playerTerritories = useMemo(
    () => sortedTerritories.filter(t => t.controllingNationId === playerId),
    [sortedTerritories, playerId]
  );

  const enemyTerritories = useMemo(
    () => sortedTerritories.filter(t => t.controllingNationId && t.controllingNationId !== playerId),
    [sortedTerritories, playerId]
  );

  const neutralTerritories = useMemo(
    () => sortedTerritories.filter(t => !t.controllingNationId),
    [sortedTerritories]
  );

  const sourceTerritory = selectedSourceTerritory
    ? territories.find(t => t.id === selectedSourceTerritory)
    : null;

  const handleAttack = (targetId: string) => {
    if (!sourceTerritory) return;
    onAttack(sourceTerritory.id, targetId, armyCount);
    setSelectedSourceTerritory(null);
    setArmyCount(1);
  };

  const handleMove = (targetId: string) => {
    if (!sourceTerritory) return;
    onMove(sourceTerritory.id, targetId, armyCount);
    setSelectedSourceTerritory(null);
    setArmyCount(1);
  };

  const renderTerritory = (territory: TerritoryState, isPlayerOwned: boolean) => {
    const ownerLabel = territory.controllingNationId ?? 'Uncontrolled';
    const isSelected = selectedSourceTerritory === territory.id;
    const canBeTarget = sourceTerritory && sourceTerritory.neighbors.includes(territory.id);

    // Determine unit composition display
    const { army, navy, air } = territory.unitComposition;
    const hasMultipleTypes = [army > 0, navy > 0, air > 0].filter(Boolean).length > 1;

    return (
      <div
        key={territory.id}
        className={`rounded border p-4 shadow-md transition-all ${
          isSelected
            ? 'border-yellow-400 bg-yellow-500/10 shadow-yellow-500/20'
            : canBeTarget
            ? 'border-red-400 bg-red-500/10 shadow-red-500/20'
            : isPlayerOwned
            ? 'border-cyan-500/50 bg-black/50 shadow-cyan-500/10'
            : 'border-red-500/30 bg-black/50 shadow-red-500/10'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.3em] text-cyan-400">{territory.region}</p>
            <h3 className="text-base font-semibold text-cyan-200">{territory.name}</h3>
            <p className={`mt-1 text-xs font-mono ${isPlayerOwned ? 'text-cyan-300' : 'text-red-300'}`}>
              {ownerLabel}
            </p>
          </div>

          {/* Army Count - BIG and prominent */}
          <div className="flex flex-col items-center gap-1">
            <div className={`flex h-16 w-16 items-center justify-center rounded-full border-2 ${
              isPlayerOwned ? 'border-cyan-400 bg-cyan-500/20' : 'border-red-400 bg-red-500/20'
            }`}>
              <div className="text-center">
                <Users className={`mx-auto h-5 w-5 ${isPlayerOwned ? 'text-cyan-300' : 'text-red-300'}`} />
                <span className={`text-2xl font-bold ${isPlayerOwned ? 'text-cyan-200' : 'text-red-200'}`}>
                  {territory.armies}
                </span>
              </div>
            </div>
            {hasMultipleTypes && (
              <div className="flex gap-1 text-[9px] font-mono">
                {army > 0 && <span className="rounded bg-green-500/20 px-1 text-green-300">A:{army}</span>}
                {navy > 0 && <span className="rounded bg-blue-500/20 px-1 text-blue-300">N:{navy}</span>}
                {air > 0 && <span className="rounded bg-purple-500/20 px-1 text-purple-300">F:{air}</span>}
              </div>
            )}
          </div>
        </div>

        {/* Territory Stats */}
        <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] font-mono text-cyan-300/80">
          <div>Strategic Value: {territory.strategicValue}</div>
          <div>Conflict Risk: {territory.conflictRisk}</div>
          <div>Production: +{territory.productionBonus}</div>
          <div>Type: {territory.type === 'sea' ? '🌊 Naval' : '🏔️ Land'}</div>
        </div>

        {/* Actions */}
        <div className="mt-3 flex flex-wrap gap-2">
          {isPlayerOwned && !isSelected && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 border-cyan-500/50 text-cyan-200 hover:bg-cyan-500/20"
                onClick={() => {
                  setSelectedSourceTerritory(territory.id);
                  setArmyCount(Math.min(1, territory.armies - 1));
                }}
                disabled={territory.armies <= 1}
              >
                <Swords className="mr-1 h-3 w-3" />
                Select to Attack/Move
              </Button>
              {availableReinforcements && availableReinforcements > 0 && onPlaceReinforcements && (
                <Button
                  size="sm"
                  className="border-green-500/50 bg-green-500/20 text-green-200 hover:bg-green-500/30"
                  onClick={() => {
                    const count = Math.min(availableReinforcements, 3);
                    onPlaceReinforcements(territory.id, count);
                  }}
                >
                  +{Math.min(availableReinforcements, 3)} Reinforcements
                </Button>
              )}
            </>
          )}

          {isSelected && (
            <div className="w-full space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-xs text-cyan-300">Armies:</label>
                <input
                  type="number"
                  min={1}
                  max={territory.armies - 1}
                  value={armyCount}
                  onChange={(e) => setArmyCount(Math.max(1, Math.min(territory.armies - 1, parseInt(e.target.value) || 1)))}
                  className="w-16 rounded border border-cyan-500/50 bg-black/60 px-2 py-1 text-sm text-cyan-200"
                />
                <span className="text-xs text-cyan-400">/ {territory.armies - 1} max</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full border-yellow-500/50 text-yellow-200 hover:bg-yellow-500/20"
                onClick={() => {
                  setSelectedSourceTerritory(null);
                  setArmyCount(1);
                }}
              >
                Cancel Selection
              </Button>
            </div>
          )}

          {canBeTarget && !isPlayerOwned && (
            <Button
              size="sm"
              className="flex-1 border-red-500/50 bg-red-500/30 text-red-200 hover:bg-red-500/40"
              onClick={() => handleAttack(territory.id)}
            >
              <Swords className="mr-1 h-3 w-3" />
              Attack with {armyCount} {armyCount === 1 ? 'army' : 'armies'}
            </Button>
          )}

          {canBeTarget && isPlayerOwned && (
            <Button
              size="sm"
              className="flex-1 border-cyan-500/50 bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/30"
              onClick={() => handleMove(territory.id)}
            >
              <ArrowRight className="mr-1 h-3 w-3" />
              Move {armyCount} {armyCount === 1 ? 'army' : 'armies'}
            </Button>
          )}

          {!isPlayerOwned && !canBeTarget && territory.controllingNationId && (
            <Button
              size="sm"
              variant="outline"
              className="flex-1 border-purple-500/50 text-purple-200 hover:bg-purple-500/20"
              onClick={() => onProxyEngagement(territory.id, territory.controllingNationId!)}
            >
              <Shield className="mr-1 h-3 w-3" />
              Proxy Ops
            </Button>
          )}
        </div>
      </div>
    );
  };

  const handleMovementComplete = useCallback((movementId: string) => {
    // Movement completed
  }, []);

  const handleTerritoryClick = (territoryId: string) => {
    if (selectedSourceTerritory && sourceTerritory) {
      // We have a source selected - check if this is a valid target
      const isNeighbor = sourceTerritory.neighbors.includes(territoryId);
      if (!isNeighbor) {
        // Not a neighbor - just select this territory instead
        setSelectedSourceTerritory(territoryId);
        const newTerritory = territories.find(t => t.id === territoryId);
        if (newTerritory) {
          setArmyCount(Math.min(1, newTerritory.armies - 1));
        }
        return;
      }

      const targetTerritory = territories.find(t => t.id === territoryId);
      if (!targetTerritory) return;

      // This is a valid neighbor - execute action
      if (targetTerritory.controllingNationId !== playerId) {
        // Attack enemy/neutral territory
        onAttack(sourceTerritory.id, territoryId, armyCount);
      } else {
        // Move to own territory
        onMove(sourceTerritory.id, territoryId, armyCount);
      }
      setSelectedSourceTerritory(null);
      setArmyCount(1);
    } else {
      // No source selected - select this territory
      const territory = territories.find(t => t.id === territoryId);
      if (territory && territory.controllingNationId === playerId && territory.armies > 1) {
        setSelectedSourceTerritory(territoryId);
        setArmyCount(Math.min(1, territory.armies - 1));
      }
    }
  };

  return (
    <div className="space-y-6">
      {availableReinforcements !== undefined && availableReinforcements > 0 && (
        <div className="rounded-lg border-2 border-green-500/50 bg-green-500/10 p-4 text-center">
          <p className="text-sm font-mono uppercase tracking-widest text-green-300">
            Reinforcements Available
          </p>
          <p className="mt-1 text-3xl font-bold text-green-200">{availableReinforcements}</p>
          <p className="mt-1 text-xs text-green-300/80">
            Click any of your territories to deploy reinforcements
          </p>
        </div>
      )}

      {selectedSourceTerritory && sourceTerritory && (
        <div className="rounded-lg border-2 border-yellow-500/50 bg-yellow-500/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-yellow-200">
                📍 Selected: {sourceTerritory.name} ({sourceTerritory.armies} armies)
              </p>
              <p className="mt-1 text-xs text-yellow-300/80">
                Click a neighboring territory to attack or move armies
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-yellow-300">Armies:</label>
              <input
                type="number"
                min={1}
                max={sourceTerritory.armies - 1}
                value={armyCount}
                onChange={(e) => setArmyCount(Math.max(1, Math.min(sourceTerritory.armies - 1, parseInt(e.target.value) || 1)))}
                className="w-16 rounded border border-yellow-500/50 bg-black/60 px-2 py-1 text-sm text-yellow-200"
              />
              <span className="text-xs text-yellow-400">/ {sourceTerritory.armies - 1}</span>
            </div>
          </div>
        </div>
      )}

      {/* View Mode Toggle */}
      <div className="space-y-6">

          {/* Your Territories */}
          <section>
            <h3 className="mb-3 text-lg font-semibold tracking-wide text-cyan-300">
              Your Territories ({playerTerritories.length})
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {playerTerritories.map(territory => renderTerritory(territory, true))}
            </div>
          </section>

          {/* Enemy Territories */}
          {enemyTerritories.length > 0 && (
            <section>
              <h3 className="mb-3 text-lg font-semibold tracking-wide text-red-300">
                Enemy Territories ({enemyTerritories.length})
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {enemyTerritories.map(territory => renderTerritory(territory, false))}
              </div>
            </section>
          )}

          {/* Neutral Territories */}
          {neutralTerritories.length > 0 && (
            <section>
              <h3 className="mb-3 text-lg font-semibold tracking-wide text-gray-300">
                Neutral Territories ({neutralTerritories.length})
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {neutralTerritories.map(territory => renderTerritory(territory, false))}
              </div>
            </section>
          )}
        </div>
    </div>
  );
}
