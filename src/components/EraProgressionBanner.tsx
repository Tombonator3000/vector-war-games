import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { ChevronDown, ChevronUp, Clock, Lock, Sparkles } from 'lucide-react';
import type { UseGameEraReturn } from '@/hooks/useGameEra';
import type { GameFeature } from '@/types/era';

interface EraProgressionBannerProps {
  era: UseGameEraReturn;
  currentTurn: number;
  className?: string;
}

export function EraProgressionBanner({ era, currentTurn, className = '' }: EraProgressionBannerProps) {
  const [collapsed, setCollapsed] = useState(false);
  const nextEra = era.getNextEra();
  const lockedFeatures = useMemo(() => era.getLockedFeatures().slice(0, 4), [era]);
  const eraProgress = era.getEraProgress();

  const renderUnlockRow = (feature: { feature: GameFeature; name: string; description: string; unlockTurn: number }) => {
    const turnsUntil = Math.max(0, feature.unlockTurn - currentTurn);
    return (
      <div
        key={feature.feature}
        className="flex items-start gap-2 rounded border border-cyan-500/20 bg-cyan-950/30 p-2"
      >
        <Lock className="h-4 w-4 text-cyan-300 mt-0.5" />
        <div className="flex-1">
          <p className="text-xs font-semibold text-cyan-100">{feature.name}</p>
          <p className="text-[11px] text-cyan-200/80">{feature.description}</p>
          <p className="text-[10px] text-yellow-300 mt-1">
            🔒 Unlocks at Turn {feature.unlockTurn} ({turnsUntil} turn{turnsUntil === 1 ? '' : 's'} away)
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className={`w-full sm:w-[420px] ${className}`}>
      <Card className="border-cyan-500/40 bg-slate-950/80 shadow-xl shadow-cyan-500/10">
        <div
          className="flex items-center justify-between px-4 py-3 cursor-pointer"
          onClick={() => setCollapsed((prev) => !prev)}
        >
          <div className="flex items-center gap-3">
            <Sparkles className="h-4 w-4 text-cyan-300" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Era Progression</p>
              <p className="text-sm font-semibold text-white">{era.currentEra === 'early' ? 'Cold War Tension' : era.eraDefinitions[era.currentEra].name}</p>
            </div>
          </div>
          <Badge variant="outline" className="border-cyan-500/40 text-cyan-200 bg-cyan-900/30">
            Turn {currentTurn}
          </Badge>
          {collapsed ? (
            <ChevronDown className="h-4 w-4 text-cyan-300" />
          ) : (
            <ChevronUp className="h-4 w-4 text-cyan-300" />
          )}
        </div>

        {!collapsed && (
          <div className="px-4 pb-4 space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-cyan-200">
                <span>Era momentum</span>
                {nextEra ? (
                  <span className="flex items-center gap-1 text-[11px] text-cyan-100">
                    <Clock className="h-3 w-3" />
                    {nextEra.turnsUntil} turn{nextEra.turnsUntil === 1 ? '' : 's'} until {nextEra.era}
                  </span>
                ) : (
                  <span className="text-[11px] text-green-300">All systems unlocked</span>
                )}
              </div>
              <Progress value={eraProgress} className="h-2" />
              <p className="text-[11px] text-cyan-100/80">{era.getEraDescription()}</p>
            </div>

            {lockedFeatures.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-200/70">Upcoming unlocks</p>
                <div className="space-y-2">
                  {lockedFeatures.map(renderUnlockRow)}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
