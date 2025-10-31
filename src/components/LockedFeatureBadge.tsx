import { Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { GameFeature, FEATURE_UNLOCK_INFO, type FeatureUnlockInfo } from '@/types/era';

interface LockedFeatureBadgeProps {
  feature: GameFeature;
  currentTurn: number;
  compact?: boolean;
  className?: string;
  featureUnlocks?: Record<GameFeature, FeatureUnlockInfo>;
}

export function LockedFeatureBadge({
  feature,
  currentTurn,
  compact = false,
  className = '',
  featureUnlocks,
}: LockedFeatureBadgeProps) {
  const unlockMap = featureUnlocks ?? FEATURE_UNLOCK_INFO;
  const featureInfo = unlockMap[feature] ?? FEATURE_UNLOCK_INFO[feature];
  const isUnavailable = !Number.isFinite(featureInfo.unlockTurn);
  const turnsUntilUnlock = isUnavailable
    ? Infinity
    : Math.max(0, featureInfo.unlockTurn - currentTurn);

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className={`border-red-500/50 text-red-400 bg-red-950/30 ${className}`}
            >
              <Lock className="w-3 h-3 mr-1" />
              {isUnavailable ? 'Scenario Locked' : `Turn ${featureInfo.unlockTurn}`}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <p className="font-semibold">{featureInfo.name}</p>
              <p className="text-xs text-muted-foreground">{featureInfo.description}</p>
              {isUnavailable ? (
                <p className="text-xs mt-1 text-red-400">Unavailable in this scenario</p>
              ) : (
                <p className="text-xs mt-1 text-yellow-400">
                  Unlocks in {turnsUntilUnlock} turn{turnsUntilUnlock !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded border border-red-500/30 bg-red-950/20 ${className}`}
    >
      <Lock className="w-4 h-4 text-red-400 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-red-300">{featureInfo.name}</p>
        {isUnavailable ? (
          <p className="text-xs text-red-400/80">Unavailable in this scenario</p>
        ) : (
          <p className="text-xs text-red-400/80">
            Unlocks at Turn {featureInfo.unlockTurn} ({turnsUntilUnlock} turn
            {turnsUntilUnlock !== 1 ? 's' : ''})
          </p>
        )}
      </div>
    </div>
  );
}

// Wrapper component to disable buttons and show locked state
interface LockedFeatureWrapperProps {
  isLocked: boolean;
  feature: GameFeature;
  currentTurn: number;
  children: React.ReactNode;
  className?: string;
  featureUnlocks?: Record<GameFeature, FeatureUnlockInfo>;
}

export function LockedFeatureWrapper({
  isLocked,
  feature,
  currentTurn,
  children,
  className = '',
  featureUnlocks,
}: LockedFeatureWrapperProps) {
  const unlockMap = featureUnlocks ?? FEATURE_UNLOCK_INFO;
  const featureInfo = unlockMap[feature] ?? FEATURE_UNLOCK_INFO[feature];
  const isUnavailable = !Number.isFinite(featureInfo.unlockTurn);
  const turnsUntilUnlock = isUnavailable
    ? Infinity
    : Math.max(0, featureInfo.unlockTurn - currentTurn);

  if (!isLocked) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`relative ${className}`}>
            <div className="opacity-40 pointer-events-none">{children}</div>
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded backdrop-blur-sm">
              <div className="text-center">
                <Lock className="w-6 h-6 text-red-400 mx-auto mb-1" />
                <p className="text-xs text-red-300 font-semibold">
                  {isUnavailable ? 'Scenario Locked' : `Turn ${featureInfo.unlockTurn}`}
                </p>
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-semibold flex items-center gap-1">
              <Lock className="w-3 h-3" />
              {featureInfo.name} Locked
            </p>
            <p className="text-xs text-muted-foreground mt-1">{featureInfo.description}</p>
            {isUnavailable ? (
              <p className="text-xs mt-2 text-red-400 font-semibold">Unavailable in this scenario</p>
            ) : (
              <p className="text-xs mt-2 text-yellow-400 font-semibold">
                🔓 Unlocks in {turnsUntilUnlock} turn{turnsUntilUnlock !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
