/**
 * Resource Refinement Panel
 *
 * Displays refineries, refined resources, and conversion processes.
 * Part of Phase 3: Economic Depth implementation.
 */

import React from 'react';
import type { Refinery, RefinedResourceStockpile } from '@/types/economicDepth';
import { REFINERY_RECIPES, REFINED_RESOURCE_BONUSES } from '@/types/economicDepth';
import type { Nation } from '@/types/game';
import {
  Factory,
  Zap,
  TrendingUp,
  Pause,
  Play,
  ArrowRight,
  Award,
  BarChart3,
} from 'lucide-react';

interface ResourceRefinementPanelProps {
  currentNation: Nation;
  refineries: Refinery[];
  refinedStockpile: RefinedResourceStockpile;
  onToggleRefinery?: (refineryId: string, pause: boolean) => void;
  onUpgradeRefinery?: (refineryId: string) => void;
  onBuildRefinery?: () => void;
  compact?: boolean;
}

export function ResourceRefinementPanel({
  currentNation,
  refineries,
  refinedStockpile,
  onToggleRefinery,
  onUpgradeRefinery,
  onBuildRefinery,
  compact = false,
}: ResourceRefinementPanelProps) {
  // Filter refineries for current nation
  const myRefineries = refineries.filter((r) => r.nationId === currentNation.id);

  const activeRefineries = myRefineries.filter((r) => r.isActive && !r.isPaused);
  const totalOutput = activeRefineries.reduce((sum, r) => sum + r.outputAmount, 0);
  const averageEfficiency =
    activeRefineries.length > 0
      ? activeRefineries.reduce((sum, r) => sum + r.efficiency, 0) /
        activeRefineries.length
      : 0;

  // Calculate refined resource totals
  const totalRefinedResources = Object.values(refinedStockpile).reduce(
    (sum, val) => sum + val,
    0
  );

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold">Refineries</span>
          <span className="text-green-400">
            {activeRefineries.length}/{myRefineries.length}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold">Output</span>
          <span className="text-blue-400">{totalOutput}/turn</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold">Efficiency</span>
          <span className="text-amber-400">
            {(averageEfficiency * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Refinement Statistics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold mb-1">
            <Factory className="w-4 h-4" />
            <span>Active</span>
          </div>
          <div className="text-xl font-bold">
            {activeRefineries.length}/{myRefineries.length}
          </div>
        </div>

        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2 text-green-400 text-xs font-semibold mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Output</span>
          </div>
          <div className="text-xl font-bold">{totalOutput}/turn</div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold mb-1">
            <Zap className="w-4 h-4" />
            <span>Efficiency</span>
          </div>
          <div className="text-xl font-bold">
            {(averageEfficiency * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Refined Resource Stockpile */}
      <div className="bg-gray-800/50 border border-gray-600/30 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-purple-400" />
          <span className="font-semibold text-sm">Refined Resources</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {Object.entries(refinedStockpile).map(([resource, amount]) => (
            <RefinedResourceCard
              key={resource}
              resource={resource}
              amount={amount}
            />
          ))}
        </div>
      </div>

      {/* Active Refineries */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-sm">Your Refineries</span>
          {onBuildRefinery && (
            <button
              onClick={onBuildRefinery}
              className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded text-xs"
            >
              + Build Refinery
            </button>
          )}
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {myRefineries.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No refineries built
              <div className="text-xs mt-2">
                Build refineries to convert raw resources into valuable materials
              </div>
            </div>
          ) : (
            myRefineries.map((refinery) => (
              <RefineryCard
                key={refinery.id}
                refinery={refinery}
                onToggle={onToggleRefinery}
                onUpgrade={onUpgradeRefinery}
              />
            ))
          )}
        </div>
      </div>

      {/* Active Bonuses */}
      <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <Award className="w-4 h-4 text-purple-400" />
          <span className="font-semibold text-sm">Active Bonuses</span>
        </div>

        <div className="space-y-1">
          {Object.entries(refinedStockpile)
            .filter(([_, amount]) => amount > 0)
            .map(([resource, amount]) => {
              const bonus = REFINED_RESOURCE_BONUSES[resource as keyof typeof refinedStockpile];
              return (
                <div
                  key={resource}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-gray-400 capitalize">
                    {resource.replace(/_/g, ' ')}
                  </span>
                  <span className="text-purple-400">
                    {bonus.bonusType.replace(/_/g, ' ')}: +{bonus.amount}
                    {bonus.bonusType.includes('boost') || bonus.bonusType.includes('speed') || bonus.bonusType.includes('damage') || bonus.bonusType.includes('effectiveness') || bonus.bonusType.includes('attack') ? '%' : ''}
                  </span>
                </div>
              );
            })}

          {Object.values(refinedStockpile).every((amount) => amount === 0) && (
            <div className="text-xs text-gray-400">
              No active bonuses - refine resources to gain benefits
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function RefineryCard({
  refinery,
  onToggle,
  onUpgrade,
}: {
  refinery: Refinery;
  onToggle?: (refineryId: string, pause: boolean) => void;
  onUpgrade?: (refineryId: string) => void;
}) {
  const recipe = REFINERY_RECIPES[refinery.type];
  const inputResources = Object.entries(refinery.inputResources);

  return (
    <div
      className={`border rounded-lg p-3 ${
        refinery.isActive && !refinery.isPaused
          ? 'bg-green-500/10 border-green-500/30'
          : 'bg-gray-800/50 border-gray-600/30'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Factory className="w-4 h-4" />
            <span className="font-semibold text-sm capitalize">
              {refinery.type.replace(/_/g, ' ')}
            </span>
            <span className="text-xs text-gray-400">Lv. {refinery.level}</span>
          </div>

          {/* Conversion Display */}
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1">
              {inputResources.map(([resource, amount], idx) => (
                <React.Fragment key={resource}>
                  {idx > 0 && <span className="text-gray-500">+</span>}
                  <span className="text-amber-400">{amount}</span>
                  <span className="text-gray-400 capitalize">
                    {resource.replace(/_/g, ' ')}
                  </span>
                </React.Fragment>
              ))}
            </div>

            <ArrowRight className="w-3 h-3 text-gray-500" />

            <div className="flex items-center gap-1">
              <span className="text-green-400">{refinery.outputAmount}</span>
              <span className="text-gray-400 capitalize">
                {refinery.outputResource.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        </div>

        {onToggle && (
          <button
            onClick={() => onToggle(refinery.id, !refinery.isPaused)}
            className={`p-1 rounded ${
              refinery.isPaused
                ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400'
                : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400'
            }`}
          >
            {refinery.isPaused ? (
              <Play className="w-4 h-4" />
            ) : (
              <Pause className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-xs mb-2">
        <div>
          <div className="text-gray-400">Efficiency</div>
          <div className="font-semibold">
            {(refinery.efficiency * 100).toFixed(0)}%
          </div>
        </div>
        <div>
          <div className="text-gray-400">Throughput</div>
          <div className="font-semibold">
            {refinery.currentThroughput}/{refinery.maxThroughput}
          </div>
        </div>
        <div>
          <div className="text-gray-400">Total</div>
          <div className="font-semibold">{refinery.totalResourcesRefined}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-600/30">
        <div className="text-gray-400">
          Maintenance: <span className="text-amber-400">{refinery.maintenanceCost}/turn</span>
        </div>

        {onUpgrade && refinery.level < 5 && (
          <button
            onClick={() => onUpgrade(refinery.id)}
            className="px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded"
          >
            Upgrade ({refinery.upgradeCost})
          </button>
        )}
      </div>
    </div>
  );
}

function RefinedResourceCard({
  resource,
  amount,
}: {
  resource: string;
  amount: number;
}) {
  const bonus = REFINED_RESOURCE_BONUSES[resource as keyof typeof REFINED_RESOURCE_BONUSES];

  const icons: Record<string, string> = {
    fuel: '⛽',
    enriched_uranium: '☢️',
    advanced_materials: '🔬',
    steel: '⚙️',
    electronics: '💻',
    processed_food: '🍱',
  };

  return (
    <div className="bg-gray-700/30 rounded p-2">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icons[resource] || '📦'}</span>
        <span className="text-xs font-semibold capitalize">
          {resource.replace(/_/g, ' ')}
        </span>
      </div>
      <div className="text-lg font-bold text-purple-400">{amount}</div>
      {amount > 0 && (
        <div className="text-xs text-gray-400 mt-1">
          +{bonus.amount}
          {bonus.bonusType.includes('boost') || bonus.bonusType.includes('speed') || bonus.bonusType.includes('damage') || bonus.bonusType.includes('effectiveness') || bonus.bonusType.includes('attack') ? '%' : ''}{' '}
          {bonus.bonusType.replace(/_/g, ' ')}
        </div>
      )}
    </div>
  );
}
