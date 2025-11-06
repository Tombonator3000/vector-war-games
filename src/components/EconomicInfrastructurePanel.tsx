/**
 * Economic Infrastructure Panel
 *
 * Displays economic buildings, zones, and infrastructure development.
 * Part of Phase 3: Economic Depth implementation.
 */

import React, { useState } from 'react';
import type {
  EconomicInfrastructure,
  EconomicZone,
} from '@/types/economicDepth';
import { INFRASTRUCTURE_COSTS } from '@/types/economicDepth';
import type { Nation } from '@/types/game';
import {
  Building2,
  TrendingUp,
  DollarSign,
  MapPin,
  Wrench,
  AlertTriangle,
  CheckCircle,
  Zap,
  Network,
} from 'lucide-react';

interface EconomicInfrastructurePanelProps {
  currentNation: Nation;
  infrastructure: EconomicInfrastructure[];
  economicZones: EconomicZone[];
  onBuildInfrastructure?: () => void;
  onUpgradeInfrastructure?: (buildingId: string) => void;
  onRepairInfrastructure?: (buildingId: string) => void;
  onCreateEconomicZone?: () => void;
  compact?: boolean;
}

export function EconomicInfrastructurePanel({
  currentNation,
  infrastructure,
  economicZones,
  onBuildInfrastructure,
  onUpgradeInfrastructure,
  onRepairInfrastructure,
  onCreateEconomicZone,
  compact = false,
}: EconomicInfrastructurePanelProps) {
  const [activeTab, setActiveTab] = useState<'buildings' | 'zones'>('buildings');

  // Filter for current nation
  const myInfrastructure = infrastructure.filter(
    (i) => i.nationId === currentNation.id
  );
  const myZones = economicZones.filter((z) => z.nationId === currentNation.id);

  const operationalBuildings = myInfrastructure.filter(
    (i) => i.status === 'operational'
  );
  const underConstruction = myInfrastructure.filter(
    (i) => i.status === 'under_construction'
  );
  const damaged = myInfrastructure.filter((i) => i.status === 'damaged');

  // Calculate totals
  const totalRevenue = myInfrastructure.reduce(
    (sum, i) => sum + i.totalRevenue,
    0
  );
  const totalMaintenance = myInfrastructure.reduce(
    (sum, i) => sum + i.maintenanceCost,
    0
  );
  const totalValue = myInfrastructure.reduce(
    (sum, i) => sum + i.constructionCost * i.level,
    0
  );

  const activeZones = myZones.filter((z) => z.isActive);

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold">Buildings</span>
          <span className="text-green-400">
            {operationalBuildings.length}/{myInfrastructure.length}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold">Revenue</span>
          <span className="text-blue-400">{totalRevenue}/turn</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold">Zones</span>
          <span className="text-purple-400">{activeZones.length}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Infrastructure Statistics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold mb-1">
            <Building2 className="w-4 h-4" />
            <span>Operational</span>
          </div>
          <div className="text-xl font-bold">
            {operationalBuildings.length}/{myInfrastructure.length}
          </div>
        </div>

        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2 text-green-400 text-xs font-semibold mb-1">
            <DollarSign className="w-4 h-4" />
            <span>Revenue</span>
          </div>
          <div className="text-xl font-bold">{totalRevenue}/turn</div>
        </div>

        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold mb-1">
            <MapPin className="w-4 h-4" />
            <span>Zones</span>
          </div>
          <div className="text-xl font-bold">{activeZones.length}</div>
        </div>
      </div>

      {/* Warnings */}
      {(underConstruction.length > 0 || damaged.length > 0) && (
        <div className="space-y-2">
          {underConstruction.length > 0 && (
            <div className="bg-blue-500/20 border border-blue-500/60 rounded-lg p-2 flex items-center gap-2 text-xs">
              <Wrench className="w-4 h-4 text-blue-400" />
              <span>
                {underConstruction.length} building
                {underConstruction.length > 1 ? 's' : ''} under construction
              </span>
            </div>
          )}

          {damaged.length > 0 && (
            <div className="bg-amber-500/20 border border-amber-500/60 rounded-lg p-2 flex items-center gap-2 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>
                {damaged.length} damaged building
                {damaged.length > 1 ? 's' : ''} need repair
              </span>
            </div>
          )}
        </div>
      )}

      {/* Net Revenue */}
      <div
        className={`rounded-lg p-3 border ${
          totalRevenue - totalMaintenance >= 0
            ? 'bg-green-500/10 border-green-500/30'
            : 'bg-red-500/10 border-red-500/30'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400">Net Economic Output</div>
            <div className="text-sm mt-1">
              <span className="text-green-400">{totalRevenue}</span>
              <span className="text-gray-500"> - </span>
              <span className="text-red-400">{totalMaintenance}</span>
              <span className="text-gray-500"> = </span>
              <span
                className={`font-bold ${
                  totalRevenue - totalMaintenance >= 0
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}
              >
                {totalRevenue - totalMaintenance}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-600/50">
        {[
          { id: 'buildings', label: 'Buildings', count: myInfrastructure.length },
          { id: 'zones', label: 'Economic Zones', count: myZones.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === tab.id
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.label} {tab.count > 0 && `(${tab.count})`}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {activeTab === 'buildings' && (
          <>
            <div className="flex justify-end mb-2">
              {onBuildInfrastructure && (
                <button
                  onClick={onBuildInfrastructure}
                  className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded text-xs"
                >
                  + Build Infrastructure
                </button>
              )}
            </div>

            {myInfrastructure.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                No infrastructure built
                <div className="text-xs mt-2">
                  Build economic infrastructure to boost production and trade
                </div>
              </div>
            ) : (
              myInfrastructure.map((building) => (
                <InfrastructureCard
                  key={building.id}
                  building={building}
                  onUpgrade={onUpgradeInfrastructure}
                  onRepair={onRepairInfrastructure}
                />
              ))
            )}
          </>
        )}

        {activeTab === 'zones' && (
          <>
            <div className="flex justify-end mb-2">
              {onCreateEconomicZone && (
                <button
                  onClick={onCreateEconomicZone}
                  className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 rounded text-xs"
                >
                  + Create Economic Zone
                </button>
              )}
            </div>

            {myZones.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                No economic zones created
                <div className="text-xs mt-2">
                  Create economic zones to boost multiple territories
                </div>
              </div>
            ) : (
              myZones.map((zone) => <EconomicZoneCard key={zone.id} zone={zone} />)
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function InfrastructureCard({
  building,
  onUpgrade,
  onRepair,
}: {
  building: EconomicInfrastructure;
  onUpgrade?: (buildingId: string) => void;
  onRepair?: (buildingId: string) => void;
}) {
  const statusColors = {
    operational: 'green',
    under_construction: 'blue',
    damaged: 'amber',
    destroyed: 'red',
  };

  const statusIcons = {
    operational: CheckCircle,
    under_construction: Wrench,
    damaged: AlertTriangle,
    destroyed: AlertTriangle,
  };

  const StatusIcon = statusIcons[building.status];
  const statusColor = statusColors[building.status];

  return (
    <div
      className={`border rounded-lg p-3 bg-${statusColor}-500/10 border-${statusColor}-500/30`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4" />
            <span className="font-semibold text-sm">{building.name}</span>
            <span className="text-xs text-gray-400">Lv. {building.level}</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400">
            <StatusIcon className={`w-3 h-3 text-${statusColor}-400`} />
            <span className="capitalize">{building.status.replace(/_/g, ' ')}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar for Construction */}
      {building.status === 'under_construction' && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-400">Construction Progress</span>
            <span>{building.constructionProgress.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${building.constructionProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Effects */}
      <div className="mb-2">
        <div className="text-xs text-gray-400 mb-1">Effects:</div>
        <div className="space-y-1">
          {building.effects.map((effect, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <Zap className="w-3 h-3 text-amber-400" />
              <span className="capitalize">
                {effect.type.replace(/_/g, ' ')}:{' '}
                <span className="text-green-400">
                  +{effect.amount}
                  {effect.type.includes('efficiency') || effect.type.includes('access') ? '%' : ''}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 text-xs mb-2 pt-2 border-t border-gray-600/30">
        <div>
          <div className="text-gray-400">Capacity</div>
          <div className="font-semibold">
            {building.currentUsage}/{building.capacity}
          </div>
        </div>
        <div>
          <div className="text-gray-400">Revenue</div>
          <div className="font-semibold text-green-400">
            {building.totalRevenue}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-600/30">
        <div className="text-gray-400">
          Maintenance: <span className="text-amber-400">{building.maintenanceCost}/turn</span>
        </div>

        <div className="flex gap-2">
          {building.status === 'damaged' && onRepair && (
            <button
              onClick={() => onRepair(building.id)}
              className="px-2 py-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded"
            >
              Repair
            </button>
          )}

          {building.status === 'operational' && onUpgrade && building.level < 5 && (
            <button
              onClick={() => onUpgrade(building.id)}
              className="px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded"
            >
              Upgrade ({building.upgradeCost})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function EconomicZoneCard({ zone }: { zone: EconomicZone }) {
  return (
    <div
      className={`border rounded-lg p-3 ${
        zone.isActive
          ? 'bg-purple-500/10 border-purple-500/30'
          : 'bg-gray-800/50 border-gray-600/30'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Network className="w-4 h-4 text-purple-400" />
            <span className="font-semibold text-sm">{zone.name}</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {zone.isActive ? (
              <span className="text-green-400">● Active</span>
            ) : (
              <span className="text-gray-400">○ Inactive</span>
            )}
            <span className="text-gray-400">
              {zone.territoryIds.length} territories
            </span>
          </div>
        </div>
      </div>

      {/* Bonuses */}
      <div className="space-y-1 text-xs mb-2">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Production Bonus</span>
          <span className="text-green-400">
            +{(zone.productionBonus * 100).toFixed(0)}%
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Trade Bonus</span>
          <span className="text-blue-400">
            +{(zone.tradeBonus * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-600/30">
        <div>
          <span className="text-gray-400">Investment: </span>
          <span className="text-amber-400">{zone.totalInvestment}</span>
        </div>
        {zone.isActive && (
          <div>
            <span className="text-gray-400">Active: </span>
            <span>{zone.turnsActive} turns</span>
          </div>
        )}
      </div>
    </div>
  );
}
