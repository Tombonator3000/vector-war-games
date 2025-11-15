import { useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { ScenarioConfig } from '@/types/scenario';

interface ScenarioSelectionPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scenarios: ScenarioConfig[];
  selectedScenarioId: string;
  onSelect: (scenarioId: string) => void;
}

export function ScenarioSelectionPanel({
  open,
  onOpenChange,
  scenarios,
  selectedScenarioId,
  onSelect,
}: ScenarioSelectionPanelProps) {
  const featuredScenarioId = 'cubanCrisis';
  const nuclearWarScenarioId = 'nuclearWar';

  const orderedScenarios = useMemo(() => {
    const cubanCrisisIndex = scenarios.findIndex(scenario => scenario.id === featuredScenarioId);
    if (cubanCrisisIndex === -1) {
      return scenarios;
    }

    const list = [...scenarios];
    const [featured] = list.splice(cubanCrisisIndex, 1);
    return [featured, ...list];
  }, [scenarios]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-slate-950/95 border border-cyan-500/40 text-cyan-100 shadow-[0_0_45px_rgba(34,211,238,0.35)]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-mono uppercase tracking-[0.35em] text-neon-green">
            Select Scenario
          </DialogTitle>
          <DialogDescription className="text-cyan-300/80">
            Choose your theater of operations. Cuban Missile Crisis is highlighted as the high-tension flashpoint scenario.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {orderedScenarios.map(scenario => {
              const isSelected = scenario.id === selectedScenarioId;
              const isFeatured = scenario.id === featuredScenarioId;
              const isNuclearWar = scenario.id === nuclearWarScenarioId;

              return (
                <button
                  key={scenario.id}
                  type="button"
                  onClick={() => onSelect(scenario.id)}
                  className={cn(
                    'w-full rounded-lg border px-5 py-4 text-left transition-all duration-200',
                    'bg-slate-900/70 hover:bg-slate-900/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400',
                    isSelected
                      ? 'border-neon-green/70 shadow-[0_0_25px_rgba(74,222,128,0.4)]'
                      : isNuclearWar
                      ? 'border-orange-500/50 hover:border-orange-400/70'
                      : 'border-cyan-500/30 hover:border-cyan-300/70',
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <p className="font-mono text-lg uppercase tracking-[0.25em] text-neon-green">
                          {scenario.name}
                        </p>
                        {isFeatured && (
                          <Badge
                            variant="outline"
                            className="border-red-500/60 bg-red-500/10 text-[0.65rem] uppercase tracking-[0.3em] text-red-300"
                          >
                            High Tension
                          </Badge>
                        )}
                        {isNuclearWar && (
                          <Badge
                            variant="outline"
                            className="border-orange-500/60 bg-orange-500/10 text-[0.65rem] uppercase tracking-[0.3em] text-orange-300"
                          >
                            ☢️ Last Man Standing
                          </Badge>
                        )}
                        {isSelected && (
                          <Badge
                            variant="outline"
                            className="border-neon-green/70 bg-neon-green/10 text-[0.65rem] uppercase tracking-[0.3em] text-neon-green"
                          >
                            Selected
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed text-cyan-200/90">{scenario.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 text-xs font-mono text-cyan-300/90">
                      <div>
                        Time Step:{' '}
                        <span className="text-neon-green">
                          {scenario.timeConfig.unitsPerTurn} {scenario.timeConfig.unit}
                          {scenario.timeConfig.unitsPerTurn > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div>
                        Start:{' '}
                        <span className="text-neon-green">
                          {scenario.timeConfig.startMonth
                            ? `${scenario.timeConfig.startMonth.toString().padStart(2, '0')}/${scenario.timeConfig.startYear}`
                            : scenario.timeConfig.startYear}
                        </span>
                      </div>
                      <div>
                        Starting DEFCON: <span className="text-neon-green">{scenario.startingDefcon}</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default ScenarioSelectionPanel;
