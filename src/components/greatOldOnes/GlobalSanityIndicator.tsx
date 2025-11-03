/**
 * Global Sanity Indicator - Compact top bar component
 * Displays global average sanity level inline with DEFCON and other stats
 */

import React from 'react';
import { Brain, AlertTriangle } from 'lucide-react';
import type { GreatOldOnesState } from '@/types/greatOldOnes';
import { getGlobalSanityAverage, getCrisisRegions } from '@/lib/sanityHeatMap';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface GlobalSanityIndicatorProps {
  state: GreatOldOnesState;
}

function getSanityColor(sanity: number): string {
  if (sanity >= 70) return 'text-green-400';
  if (sanity >= 50) return 'text-yellow-400';
  if (sanity >= 30) return 'text-orange-400';
  return 'text-red-400';
}

function getSanityDescription(sanity: number): string {
  if (sanity >= 80) return 'Humanity remains largely sane and functional.';
  if (sanity >= 60) return 'Increasing reports of mental illness.';
  if (sanity >= 40) return 'Widespread psychological distress.';
  if (sanity >= 20) return 'Mass psychosis spreading.';
  return 'Societal collapse imminent. Madness reigns.';
}

export const GlobalSanityIndicator: React.FC<GlobalSanityIndicatorProps> = ({ state }) => {
  const globalSanity = getGlobalSanityAverage(state);
  const crisisRegions = getCrisisRegions(state);
  const sanityColor = getSanityColor(globalSanity);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 px-3 py-1 bg-pink-500/10 border border-pink-500/30 rounded cursor-help">
            <Brain className="w-4 h-4 text-pink-400" />
            <span className="text-cyan-400 text-sm">SANITY</span>
            <span className={`${sanityColor} font-bold text-2xl`}>{globalSanity}%</span>
            {crisisRegions.length > 0 && (
              <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs bg-slate-900 border-slate-700">
          <div className="space-y-2">
            <p className="text-xs text-slate-300">{getSanityDescription(globalSanity)}</p>
            {crisisRegions.length > 0 && (
              <div className="text-xs">
                <span className="text-red-400 font-semibold">
                  {crisisRegions.length} Region{crisisRegions.length > 1 ? 's' : ''} in Crisis:
                </span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {crisisRegions.map(region => (
                    <span key={region.regionId} className="text-red-300">
                      {region.regionName}
                    </span>
                  )).reduce((prev: React.ReactNode[], curr, idx) =>
                    idx === 0 ? [curr] : [...prev, ', ', curr], [] as React.ReactNode[]
                  )}
                </div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
