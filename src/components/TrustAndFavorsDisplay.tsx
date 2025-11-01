/**
 * Trust and Favors Display Component
 *
 * Shows trust level, favor balance, and active promises between nations
 */

import React from 'react';
import { Heart, Scale, FileText, TrendingUp, TrendingDown } from 'lucide-react';
import { Nation } from '@/types/game';
import {
  getTrust,
  getFavors,
  getTrustCategory,
  getTrustColor
} from '@/types/trustAndFavors';
import { getActivePromises } from '@/lib/trustAndFavorsUtils';
import { getAllPromisesSummary } from '@/lib/promiseActions';

interface TrustAndFavorsDisplayProps {
  nation: Nation;
  targetNation: Nation;
  compact?: boolean;
}

export function TrustAndFavorsDisplay({
  nation,
  targetNation,
  compact = false
}: TrustAndFavorsDisplayProps) {
  const trust = getTrust(nation, targetNation.id);
  const favors = getFavors(nation, targetNation.id);
  const trustCategory = getTrustCategory(trust);
  const trustColor = getTrustColor(trust);
  const activePromises = getActivePromises(nation, targetNation.id);
  const promiseSummary = getAllPromisesSummary(nation);

  if (compact) {
    return (
      <div className="flex items-center gap-4 text-xs">
        {/* Trust indicator */}
        <div className="flex items-center gap-1">
          <Heart className={`w-3 h-3 ${trustColor}`} />
          <span className={trustColor}>{trust}</span>
        </div>

        {/* Favor indicator */}
        <div className="flex items-center gap-1">
          <Scale className={`w-3 h-3 ${favors >= 0 ? 'text-green-400' : 'text-orange-400'}`} />
          <span className={favors >= 0 ? 'text-green-400' : 'text-orange-400'}>
            {favors > 0 ? '+' : ''}{favors}
          </span>
        </div>

        {/* Active promises indicator */}
        {activePromises.length > 0 && (
          <div className="flex items-center gap-1">
            <FileText className="w-3 h-3 text-blue-400" />
            <span className="text-blue-400">{activePromises.length}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3 bg-black/30 rounded border border-gray-700">
      {/* Trust Section */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className={`w-4 h-4 ${trustColor}`} />
            <span className="text-sm font-semibold text-gray-300">Trust</span>
          </div>
          <span className={`text-sm font-bold ${trustColor}`}>
            {trust}/100
          </span>
        </div>

        {/* Trust bar */}
        <div className="w-full h-2 bg-gray-800 rounded overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              trust >= 80 ? 'bg-green-500' :
              trust >= 60 ? 'bg-green-400' :
              trust >= 40 ? 'bg-gray-400' :
              trust >= 20 ? 'bg-orange-400' :
              'bg-red-500'
            }`}
            style={{ width: `${trust}%` }}
          />
        </div>

        <p className="text-xs text-gray-400">{trustCategory}</p>
      </div>

      {/* Favors Section */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-semibold text-gray-300">Favors</span>
          </div>
          <div className="flex items-center gap-1">
            {favors > 0 ? (
              <TrendingUp className="w-3 h-3 text-green-400" />
            ) : favors < 0 ? (
              <TrendingDown className="w-3 h-3 text-orange-400" />
            ) : null}
            <span className={`text-sm font-bold ${
              favors > 0 ? 'text-green-400' :
              favors < 0 ? 'text-orange-400' :
              'text-gray-400'
            }`}>
              {favors > 0 ? '+' : ''}{favors}
            </span>
          </div>
        </div>

        <p className="text-xs text-gray-400">
          {favors > 0
            ? `${targetNation.name} owes you ${favors} favor${favors !== 1 ? 's' : ''}`
            : favors < 0
            ? `You owe ${targetNation.name} ${Math.abs(favors)} favor${favors !== -1 ? 's' : ''}`
            : 'No outstanding favors'}
        </p>

        {favors > 0 && (
          <p className="text-xs text-green-400/70 italic">
            Can be spent on diplomatic requests
          </p>
        )}
      </div>

      {/* Promises Section */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-gray-300">Promises</span>
          </div>
          <span className="text-sm text-gray-400">
            {activePromises.length} active
          </span>
        </div>

        {activePromises.length > 0 ? (
          <div className="space-y-1">
            {activePromises.map((promise) => (
              <div
                key={promise.id}
                className="text-xs text-gray-400 bg-blue-900/20 px-2 py-1 rounded"
              >
                <span className="text-blue-300 font-medium">
                  {formatPromiseType(promise.type)}
                </span>
                <span className="text-gray-500 ml-2">
                  ({promise.expiresTurn - promise.createdTurn} turns remaining)
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500 italic">No active promises</p>
        )}

        {/* Promise history summary */}
        {(promiseSummary.fulfilled > 0 || promiseSummary.broken > 0) && (
          <div className="text-xs text-gray-500 flex gap-3 pt-1">
            {promiseSummary.fulfilled > 0 && (
              <span className="text-green-400">
                ✓ {promiseSummary.fulfilled} kept
              </span>
            )}
            {promiseSummary.broken > 0 && (
              <span className="text-red-400">
                ✗ {promiseSummary.broken} broken
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Format promise type for display
 */
function formatPromiseType(type: string): string {
  const typeMap: Record<string, string> = {
    'no-attack': 'No Attack',
    'help-if-attacked': 'Defensive Support',
    'no-ally-with': 'No Alliance',
    'support-council': 'Council Support',
    'no-nuclear-weapons': 'Nuclear Disarmament',
    'neutral-mediator': 'Neutral Mediator'
  };

  return typeMap[type] || type;
}

/**
 * Compact inline display for use in smaller contexts
 */
export function TrustAndFavorsInline({
  nation,
  targetNation
}: Omit<TrustAndFavorsDisplayProps, 'compact'>) {
  return <TrustAndFavorsDisplay nation={nation} targetNation={targetNation} compact />;
}
