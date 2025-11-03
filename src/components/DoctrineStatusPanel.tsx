/**
 * Doctrine Status Panel Component
 *
 * Displays current doctrine, shift warnings, and compatibility with other nations.
 * Shows player how their actions are affecting their doctrine alignment.
 */

import { Info, TrendingUp, AlertTriangle } from 'lucide-react';
import type { DoctrineKey } from '@/types/doctrineIncidents';
import type { DoctrineShiftState } from '@/types/doctrineIncidents';
import { getDoctrineShiftSummary } from '@/lib/doctrineIncidentSystem';
import { getDoctrineCompatibilityModifier, getDoctrineRelationshipDescription } from '@/lib/doctrineDiplomacyUtils';
import type { Nation } from '@/types/game';

export interface DoctrineStatusPanelProps {
  playerNation: Nation;
  allNations: Nation[];
  shiftState?: DoctrineShiftState;
  onShowDetails?: () => void;
  className?: string;
}

export function DoctrineStatusPanel({
  playerNation,
  allNations,
  shiftState,
  onShowDetails,
  className,
}: DoctrineStatusPanelProps) {
  const currentDoctrine = playerNation.doctrine as DoctrineKey;

  if (!currentDoctrine) {
    return null;
  }

  const doctrineNames: Record<DoctrineKey, string> = {
    mad: 'Mutual Assured Destruction',
    defense: 'Strategic Defense',
    firstStrike: 'First Strike',
    detente: 'Détente',
  };

  const doctrineColors: Record<DoctrineKey, string> = {
    mad: 'text-red-400 border-red-400/50',
    defense: 'text-blue-400 border-blue-400/50',
    firstStrike: 'text-orange-400 border-orange-400/50',
    detente: 'text-green-400 border-green-400/50',
  };

  // Calculate shift summary if available
  const shiftSummary = shiftState ? getDoctrineShiftSummary(shiftState) : null;

  // Get other nations' doctrines and compatibility
  const otherNations = allNations.filter((n) => n.id !== playerNation.id && n.doctrine);
  const compatibilityData = otherNations.map((nation) => {
    const modifier = getDoctrineCompatibilityModifier(
      currentDoctrine,
      nation.doctrine as DoctrineKey
    );
    return {
      nation,
      modifier,
      description: getDoctrineRelationshipDescription(
        currentDoctrine,
        nation.doctrine as DoctrineKey
      ),
    };
  });

  return (
    <div className={`bg-card border border-gray-800 rounded-lg p-4 space-y-4 ${className ?? ''}`}>
      {/* Current Doctrine */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-mono font-bold text-gray-400 uppercase tracking-wide">
            Current Doctrine
          </h3>
          {onShowDetails && (
            <button
              onClick={onShowDetails}
              className="text-xs font-mono text-cyan hover:text-neon-cyan transition-colors"
            >
              <Info className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className={`text-lg font-mono font-bold ${doctrineColors[currentDoctrine]}`}>
          {doctrineNames[currentDoctrine]}
        </div>
      </div>

      {/* Shift Warning */}
      {shiftSummary && shiftSummary.closestAlternative && shiftSummary.isWarning && (
        <div
          className={`border-2 rounded-lg p-3 ${
            shiftSummary.isCritical
              ? 'border-red-500 bg-red-500/10'
              : 'border-yellow-500 bg-yellow-500/10'
          }`}
        >
          <div className="flex items-start gap-2">
            {shiftSummary.isCritical ? (
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
            ) : (
              <TrendingUp className="w-5 h-5 text-yellow-400 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="font-mono font-bold text-sm mb-1">
                {shiftSummary.isCritical ? 'DOCTRINE SHIFT IMMINENT' : 'DOCTRINE DRIFT DETECTED'}
              </div>
              <div className="text-xs font-mono text-gray-300">
                Your actions are shifting toward{' '}
                <span className={doctrineColors[shiftSummary.closestAlternative]}>
                  {doctrineNames[shiftSummary.closestAlternative]}
                </span>
              </div>
              <div className="mt-2 bg-black/40 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    shiftSummary.isCritical ? 'bg-red-500' : 'bg-yellow-500'
                  }`}
                  style={{ width: `${shiftSummary.progressToShift}%` }}
                />
              </div>
              <div className="text-xs font-mono text-gray-400 mt-1">
                {Math.round(shiftSummary.progressToShift)}% to shift
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compatibility with Other Nations */}
      {compatibilityData.length > 0 && (
        <div>
          <h4 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wide mb-2">
            Doctrine Compatibility
          </h4>
          <div className="space-y-2">
            {compatibilityData.slice(0, 3).map(({ nation, modifier }) => {
              const isPositive = modifier > 5;
              const isNegative = modifier < -5;

              return (
                <div
                  key={nation.id}
                  className="flex items-center justify-between text-xs font-mono"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: nation.color }}
                    />
                    <span className="text-gray-300">{nation.name}</span>
                    <span className="text-gray-500 text-[10px]">
                      ({(nation.doctrine as string).toUpperCase()})
                    </span>
                  </div>
                  <div
                    className={`font-bold ${
                      isPositive
                        ? 'text-green-400'
                        : isNegative
                        ? 'text-red-400'
                        : 'text-gray-400'
                    }`}
                  >
                    {modifier > 0 ? '+' : ''}
                    {modifier}
                  </div>
                </div>
              );
            })}
            {compatibilityData.length > 3 && (
              <div className="text-xs font-mono text-gray-500 text-center">
                +{compatibilityData.length - 3} more nations
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Actions (if shift state available) */}
      {shiftState && shiftState.recentActions.length > 0 && (
        <div>
          <h4 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wide mb-2">
            Recent Actions
          </h4>
          <div className="space-y-1">
            {shiftState.recentActions.slice(-3).reverse().map((action, idx) => (
              <div key={idx} className="text-xs font-mono text-gray-400 flex items-center gap-2">
                <span className="text-gray-600">Turn {action.turn}:</span>
                <span
                  className={`${doctrineColors[action.shiftEffect.toward]} text-[10px]`}
                >
                  +{action.shiftEffect.amount} {action.shiftEffect.toward.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
