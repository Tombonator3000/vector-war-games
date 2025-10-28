import { Fragment } from 'react';
import { FlaskConical, Gauge, Ghost, Skull } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { PANDEMIC_TRAITS, type PandemicState, type PandemicTraitKey } from '@/hooks/usePandemic';
import { toast } from '@/components/ui/use-toast';

interface BioWarfareLabProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: PandemicState;
  enabled: boolean;
  onUpgrade: (trait: PandemicTraitKey) => boolean;
  onDowngrade: (trait: PandemicTraitKey) => boolean;
  onDeploy: () => boolean;
  onReset: () => boolean;
}

const traitIconMap: Record<PandemicTraitKey, JSX.Element> = {
  transmission: <Gauge className="h-4 w-4" />,
  stealth: <Ghost className="h-4 w-4" />,
  lethality: <Skull className="h-4 w-4" />
};

const traitFlavor: Record<PandemicTraitKey, string> = {
  transmission: 'Vector Amplification',
  stealth: 'Bio-Clandestine Suite',
  lethality: 'Terminal Actuators'
};

export function BioWarfareLab({ open, onOpenChange, state, enabled, onUpgrade, onDowngrade, onDeploy, onReset }: BioWarfareLabProps) {
  if (!enabled || !open) {
    return null;
  }

  const handleUpgrade = (trait: PandemicTraitKey) => {
    const success = onUpgrade(trait);
    if (!success) {
      toast({
        title: 'Insufficient BioForge credits',
        description: 'Acquire additional lab resources before unlocking this module.',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Trait module unlocked',
        description: `${traitFlavor[trait]} calibrated for deployment.`
      });
    }
  };

  const handleDowngrade = (trait: PandemicTraitKey) => {
    const success = onDowngrade(trait);
    if (!success) {
      toast({
        title: 'No modules to roll back',
        description: 'Current loadout already at baseline configuration.'
      });
    } else {
      toast({
        title: 'Trait module reclaimed',
        description: `Redeployed scientists recovered resources from ${traitFlavor[trait].toLowerCase()}.`,
        variant: 'default'
      });
    }
  };

  const handleDeploy = () => {
    const success = onDeploy();
    toast({
      title: success ? 'Loadout deployed' : 'Loadout unchanged',
      description: success
        ? 'BioForge complexes routing engineered pathogen traits to strike packages.'
        : 'Current deployments already match staged modules.'
    });
  };

  const handleReset = () => {
    const success = onReset();
    toast({
      title: success ? 'Loadout cleared' : 'No modules to clear',
      description: success
        ? 'All research nodes returned to idle. Resources refunded to BioForge reserves.'
        : 'Trait loadout already at baseline.'
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-[26rem] max-w-[90vw] bg-black/90 border border-cyan-500/40 text-cyan-200 font-mono p-0 shadow-lg shadow-cyan-900/20"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-500/30 bg-black/80">
          <div className="flex items-center gap-2 uppercase tracking-[0.35em] text-[10px] text-cyan-300">
            <FlaskConical className="h-4 w-4 text-emerald-400" />
            BIOFORGE LAB
          </div>
          <div className="text-[11px] text-cyan-200/80">
            Credits: <span className="text-emerald-300">{state.labResources}</span>
          </div>
        </div>

        <div className="px-4 py-3 space-y-3 max-h-[calc(100vh-14rem)] overflow-y-auto">
          {PANDEMIC_TRAITS.map(trait => {
            const stagedLevel = state.traitLoadout[trait.key];
            const activeLevel = state.activeTraits[trait.key];
            const nextCost = trait.costs[stagedLevel] ?? null;
            const canUpgrade = stagedLevel < trait.maxLevel && (nextCost ?? 0) <= state.labResources;
            const canDowngrade = stagedLevel > 0;
            const upgradeLabel = nextCost ? `Unlock (${nextCost})` : 'Maxed';
            return (
              <div
                key={trait.key}
                className="rounded border border-cyan-500/20 bg-cyan-500/5 p-3 space-y-2"
              >
                <div className="flex items-center justify-between text-[11px] text-cyan-200">
                  <div className="flex items-center gap-2 uppercase tracking-wide">
                    <span className="text-cyan-300">{traitIconMap[trait.key]}</span>
                    {trait.label}
                  </div>
                  <div className="text-[10px] text-cyan-400/80">
                    Staged: <span className="text-emerald-300">{stagedLevel}</span>{' '}
                    | Active: <span className="text-orange-300">{activeLevel}</span>
                  </div>
                </div>
                <div className="text-[10px] text-cyan-300/80 leading-relaxed">
                  {trait.description}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] uppercase text-cyan-400/70">
                    {Array.from({ length: trait.maxLevel }).map((_, index) => (
                      <Fragment key={index}>
                        <div
                          className={`h-2 w-8 rounded ${index < stagedLevel ? 'bg-emerald-400' : 'bg-cyan-500/20'}`}
                        />
                      </Fragment>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!canDowngrade}
                      onClick={() => handleDowngrade(trait.key)}
                      className="border-cyan-500/40 text-cyan-200 hover:bg-cyan-500/10"
                    >
                      Reclaim
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      disabled={!canUpgrade}
                      onClick={() => handleUpgrade(trait.key)}
                      className="bg-emerald-500/80 hover:bg-emerald-400 text-black"
                    >
                      {upgradeLabel}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-cyan-500/20 bg-black/75">
          <div className="text-[10px] text-cyan-300/80">
            Deploy to synchronize staged modules with active outbreaks.
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleReset}
              className="text-cyan-300 hover:bg-cyan-500/10"
            >
              Reset
            </Button>
            <Button
              size="sm"
              onClick={handleDeploy}
              className="bg-cyan-500 hover:bg-cyan-400 text-black"
            >
              Deploy
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
