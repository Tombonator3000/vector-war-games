/**
 * Resource Stockpile Display Component
 *
 * Displays the nation's strategic resource stockpiles (Oil, Uranium, Rare Earths, Food)
 */

import React from 'react';
import type { Nation } from '@/types/game';
import { RESOURCE_INFO, type StrategyResourceType } from '@/types/territorialResources';

interface ResourceStockpileDisplayProps {
  nation: Nation;
  compact?: boolean;
}

export function ResourceStockpileDisplay({ nation, compact = false }: ResourceStockpileDisplayProps) {
  if (!nation.resourceStockpile) {
    return null;
  }

  const resources: StrategyResourceType[] = ['oil', 'uranium', 'rare_earths', 'food'];

  if (compact) {
    return (
      <div className="flex gap-2 text-xs">
        {resources.map((resource) => {
          const info = RESOURCE_INFO[resource];
          const amount = nation.resourceStockpile![resource];
          const generation = nation.resourceGeneration?.[resource] || 0;

          return (
            <div key={resource} className="flex items-center gap-1" title={info.description}>
              <span>{info.icon}</span>
              <span className="font-mono font-semibold">{Math.floor(amount)}</span>
              {generation !== 0 && (
                <span className={`text-xs ${generation > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {generation > 0 ? '+' : ''}{generation}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold text-amber-300">Strategic Resources</div>
      {resources.map((resource) => {
        const info = RESOURCE_INFO[resource];
        const amount = nation.resourceStockpile![resource];
        const generation = nation.resourceGeneration?.[resource] || 0;
        const maxCapacity = getResourceCap(resource);
        const percentage = Math.min(100, (amount / maxCapacity) * 100);

        return (
          <div key={resource} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <span>{info.icon}</span>
                <span className="font-semibold">{info.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono">{Math.floor(amount)} / {maxCapacity}</span>
                {generation !== 0 && (
                  <span className={`font-mono ${generation > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ({generation > 0 ? '+' : ''}{generation}/turn)
                  </span>
                )}
              </div>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: info.color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getResourceCap(resource: StrategyResourceType): number {
  const RESOURCE_CAPS = {
    oil: 500,
    uranium: 300,
    rare_earths: 400,
    food: 600,
  };
  return RESOURCE_CAPS[resource];
}

/**
 * Simple resource icon display (for buttons, tooltips, etc.)
 */
export function ResourceIcon({ resource, amount }: { resource: StrategyResourceType; amount?: number }) {
  const info = RESOURCE_INFO[resource];

  return (
    <span className="inline-flex items-center gap-1" title={info.description}>
      <span>{info.icon}</span>
      {amount !== undefined && <span className="font-mono text-xs">{amount}</span>}
    </span>
  );
}

/**
 * Resource cost display (for unit/tech requirements)
 */
export function ResourceCostDisplay({ cost }: { cost: Partial<Record<StrategyResourceType | 'production' | 'intel', number>> }) {
  const entries = Object.entries(cost).filter(([_, amount]) => amount && amount > 0);

  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 text-xs">
      {entries.map(([resource, amount]) => {
        if (resource === 'production') {
          return (
            <span key={resource} className="flex items-center gap-1">
              <span>🏭</span>
              <span className="font-mono">{amount}</span>
            </span>
          );
        }
        if (resource === 'intel') {
          return (
            <span key={resource} className="flex items-center gap-1">
              <span>🔍</span>
              <span className="font-mono">{amount}</span>
            </span>
          );
        }
        const info = RESOURCE_INFO[resource as StrategyResourceType];
        if (!info) return null;

        return (
          <span key={resource} className="flex items-center gap-1" title={info.description}>
            <span>{info.icon}</span>
            <span className="font-mono">{amount}</span>
          </span>
        );
      })}
    </div>
  );
}
