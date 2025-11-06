/**
 * Supply System Panel
 *
 * UI for visualizing and managing supply networks and logistics.
 */

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { SupplyNetwork, SupplySource, Territory, SupplyDeficit } from '@/types/supplySystem';
import { Package, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Truck } from 'lucide-react';

interface SupplySystemPanelProps {
  supplyNetwork: SupplyNetwork;
  territories: Territory[];
  onCreateSupplySource: (territoryId: string, type: 'depot' | 'port' | 'airbase') => void;
  onUpgradeInfrastructure: (territoryId: string) => void;
}

export function SupplySystemPanel({
  supplyNetwork,
  territories,
  onCreateSupplySource,
  onUpgradeInfrastructure,
}: SupplySystemPanelProps) {
  const supplyStatus = useMemo(() => {
    const balance = supplyNetwork.supplyBalance;
    if (balance > 200) return { status: 'excellent', color: 'green', icon: CheckCircle };
    if (balance > 0) return { status: 'adequate', color: 'cyan', icon: CheckCircle };
    if (balance > -100) return { status: 'strained', color: 'yellow', icon: AlertTriangle };
    return { status: 'critical', color: 'red', icon: AlertTriangle };
  }, [supplyNetwork.supplyBalance]);

  const criticalDeficits = useMemo(
    () => supplyNetwork.deficits.filter((d) => d.supplyShortage > 50),
    [supplyNetwork.deficits]
  );

  const StatusIcon = supplyStatus.icon;

  return (
    <div className="grid gap-6">
      {/* Overview */}
      <section className="rounded border border-cyan-500/40 bg-black/50 p-4 shadow-lg shadow-cyan-500/10">
        <div className="mb-4 grid grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-xs font-mono uppercase tracking-[0.35em] text-cyan-400">Supply Capacity</p>
            <h3 className="text-2xl font-semibold text-cyan-200">{supplyNetwork.totalSupplyCapacity}</h3>
          </div>
          <div className="text-center">
            <p className="text-xs font-mono uppercase tracking-[0.35em] text-cyan-400">Supply Demand</p>
            <h3 className="text-2xl font-semibold text-cyan-200">{supplyNetwork.totalSupplyDemand}</h3>
          </div>
          <div className="text-center">
            <p className="text-xs font-mono uppercase tracking-[0.35em] text-cyan-400">Balance</p>
            <h3 className={`text-2xl font-semibold text-${supplyStatus.color}-200`}>
              {supplyNetwork.supplyBalance > 0 ? '+' : ''}
              {supplyNetwork.supplyBalance}
            </h3>
          </div>
          <div className="text-center">
            <p className="text-xs font-mono uppercase tracking-[0.35em] text-cyan-400">Efficiency</p>
            <h3 className="text-2xl font-semibold text-cyan-200">{Math.round(supplyNetwork.efficiency)}%</h3>
          </div>
        </div>

        {/* Status Indicator */}
        <div
          className={`rounded border-2 border-${supplyStatus.color}-500/50 bg-${supplyStatus.color}-500/10 p-3 text-center`}
        >
          <div className="flex items-center justify-center gap-2">
            <StatusIcon className={`h-5 w-5 text-${supplyStatus.color}-400`} />
            <p className={`text-sm font-mono uppercase tracking-widest text-${supplyStatus.color}-300`}>
              Supply Network: {supplyStatus.status.toUpperCase()}
            </p>
          </div>
          {supplyNetwork.supplyBalance < 0 && (
            <p className="mt-2 text-xs text-red-300/80">
              Warning: Supply shortage of {Math.abs(supplyNetwork.supplyBalance)} units
            </p>
          )}
        </div>
      </section>

      {/* Supply Sources */}
      <section className="rounded border border-cyan-500/40 bg-black/50 p-4 shadow-lg shadow-cyan-500/10">
        <h3 className="mb-4 text-lg font-semibold tracking-wide text-cyan-300">
          Supply Sources ({supplyNetwork.supplySources.length})
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          {supplyNetwork.supplySources.map((source) => (
            <div
              key={source.id}
              className={`rounded border p-3 ${
                source.isDamaged
                  ? 'border-red-500/30 bg-red-500/10'
                  : 'border-cyan-500/30 bg-black/60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-cyan-200">
                    {source.type === 'capital' && '🏛️'}
                    {source.type === 'depot' && '📦'}
                    {source.type === 'port' && '⚓'}
                    {source.type === 'airbase' && '✈️'}
                    {' '}{source.type.toUpperCase()}
                  </h4>
                  <p className="text-xs text-cyan-400/80">Territory: {source.territoryId}</p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    source.isActive ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-400'
                  }`}
                >
                  {source.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-cyan-400">Capacity:</span>
                  <span className="text-cyan-200">{source.totalSupply}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-400">Range:</span>
                  <span className="text-cyan-200">{source.supplyRange} territories</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-400">Level:</span>
                  <span className="text-cyan-200">{source.level} / 5</span>
                </div>
                {source.isDamaged && (
                  <div className="flex justify-between">
                    <span className="text-red-400">Damage:</span>
                    <span className="text-red-200">{source.damageLevel}%</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Supply Deficits */}
      {supplyNetwork.deficits.length > 0 && (
        <section className="rounded border border-red-500/40 bg-black/50 p-4 shadow-lg shadow-red-500/10">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold tracking-wide text-red-300">
            <AlertTriangle className="h-5 w-5" />
            Supply Deficits ({supplyNetwork.deficits.length})
          </h3>
          <div className="grid gap-3">
            {supplyNetwork.deficits.map((deficit, idx) => (
              <div
                key={idx}
                className="rounded border border-red-500/30 bg-red-500/10 p-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-red-200">{deficit.territoryName}</h4>
                    <p className="text-xs text-red-400/80">
                      {deficit.unitsAffected} units affected
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-red-500/30 text-red-200">
                    -{deficit.supplyShortage}
                  </span>
                </div>
                <div className="mt-2 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-red-400">Attrition:</span>
                    <span className="text-red-200">{deficit.attritionPerTurn.toFixed(1)}% / turn</span>
                  </div>
                  <p className="text-red-300/80 italic">{deficit.recommendedAction}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Territories */}
      <section className="rounded border border-cyan-500/40 bg-black/50 p-4 shadow-lg shadow-cyan-500/10">
        <h3 className="mb-4 text-lg font-semibold tracking-wide text-cyan-300">
          Territory Logistics ({territories.length})
        </h3>
        <div className="grid gap-3">
          {territories.slice(0, 10).map((territory) => {
            const statusColors = {
              oversupplied: 'green',
              adequate: 'cyan',
              low: 'yellow',
              critical: 'red',
              none: 'gray',
            };
            const statusColor = statusColors[territory.supplyStatus];

            return (
              <div
                key={territory.id}
                className="rounded border border-cyan-500/30 bg-black/60 p-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-cyan-200">Territory {territory.id}</h4>
                    <div className="mt-1 flex gap-4 text-xs">
                      <span className="text-cyan-400">
                        Infrastructure: <span className="text-cyan-200">{territory.infrastructureLevel}/10</span>
                      </span>
                      <span className={`text-${statusColor}-400`}>
                        Status: <span className={`text-${statusColor}-200`}>{territory.supplyStatus}</span>
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-cyan-400">Supply</p>
                    <p className={`text-sm font-semibold text-${statusColor}-300`}>
                      {Math.round(territory.currentSupply)} / {territory.supplyDemand}
                    </p>
                  </div>
                </div>

                <div className="mt-2 flex gap-2 text-xs">
                  {territory.hasDepot && (
                    <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-300">📦 Depot</span>
                  )}
                  {territory.hasPort && (
                    <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-300">⚓ Port</span>
                  )}
                  {territory.hasAirbase && (
                    <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-300">✈️ Airbase</span>
                  )}
                </div>

                {territory.attritionLevel > 0 && (
                  <div className="mt-2 rounded bg-red-500/20 p-2 text-xs text-red-300">
                    ⚠️ Attrition: {territory.attritionLevel.toFixed(1)}% per turn
                  </div>
                )}

                <div className="mt-2 grid grid-cols-2 gap-2">
                  {!territory.hasDepot && (
                    <Button
                      onClick={() => onCreateSupplySource(territory.id, 'depot')}
                      size="sm"
                      className="bg-blue-600/50 hover:bg-blue-500/50 text-xs"
                    >
                      Build Depot
                    </Button>
                  )}
                  {territory.infrastructureLevel < 10 && (
                    <Button
                      onClick={() => onUpgradeInfrastructure(territory.id)}
                      size="sm"
                      className="bg-green-600/50 hover:bg-green-500/50 text-xs"
                    >
                      Upgrade Infra
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {territories.length > 10 && (
          <p className="mt-3 text-center text-xs text-cyan-400/60">
            Showing 10 of {territories.length} territories
          </p>
        )}
      </section>
    </div>
  );
}
