import { Check, Lock, AlertTriangle, Beaker, Shield, Skull, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import type { BioLabFacility, BioLabConstructionOption } from '@/types/bioLab';
import { getBioLabTierDefinition } from '@/types/bioLab';

interface BioLabConstructionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labFacility: BioLabFacility;
  constructionOptions: BioLabConstructionOption[];
  playerProduction: number;
  playerUranium: number;
  onStartConstruction: (tier: number) => void;
  onCancelConstruction: () => void;
}

const TIER_ICONS = {
  1: Beaker,
  2: Shield,
  3: FlaskConical,
  4: Skull,
};

const TIER_COLORS = {
  1: 'cyan',
  2: 'blue',
  3: 'purple',
  4: 'red',
};

export function BioLabConstruction({
  open,
  onOpenChange,
  labFacility,
  constructionOptions,
  playerProduction,
  playerUranium,
  onStartConstruction,
  onCancelConstruction,
}: BioLabConstructionProps) {
  const currentTierDef = getBioLabTierDefinition(labFacility.tier);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-black/95 border-cyan-500/40 text-cyan-200 font-mono">
        <DialogHeader>
          <DialogTitle className="text-cyan-300 uppercase tracking-[0.3em] text-lg flex items-center gap-3">
            <Beaker className="h-6 w-6" />
            BIO LABORATORY CONSTRUCTION
          </DialogTitle>
          <DialogDescription className="text-cyan-400/80 text-xs">
            Develop biological research and warfare capabilities through progressive lab upgrades
          </DialogDescription>
        </DialogHeader>

        {/* Current Lab Status */}
        <div className="border border-cyan-500/30 rounded-lg p-4 bg-cyan-500/5 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm uppercase tracking-wide text-cyan-300">Current Facility</h3>
            <div className="text-xs text-cyan-400/70">
              Available: {playerProduction} production, {playerUranium} uranium
            </div>
          </div>

          {labFacility.tier === 0 ? (
            <p className="text-xs text-cyan-400/80">
              No bio laboratory constructed. Begin with Tier 1 to unlock disease tracking capabilities.
            </p>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base font-semibold text-cyan-200">{currentTierDef.name}</span>
                <Check className="h-4 w-4 text-green-400" />
              </div>
              <p className="text-xs text-cyan-400/80 mb-2">{currentTierDef.description}</p>
              <div className="flex flex-wrap gap-2">
                {currentTierDef.unlocks.map((unlock, idx) => (
                  <div
                    key={idx}
                    className="text-[10px] px-2 py-1 rounded bg-green-500/20 border border-green-400/40 text-green-300"
                  >
                    {unlock}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Construction Progress */}
          {labFacility.underConstruction && (
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-400/40 rounded">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase text-yellow-300 tracking-wide">
                  Constructing: {getBioLabTierDefinition(labFacility.targetTier).name}
                </span>
                <span className="text-xs text-yellow-400">
                  {labFacility.constructionProgress} / {labFacility.constructionTarget} turns
                </span>
              </div>
              <Progress
                value={(labFacility.constructionProgress / labFacility.constructionTarget) * 100}
                className="h-2 mb-2"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={onCancelConstruction}
                  className="text-xs"
                >
                  Cancel (50% refund)
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Available Upgrades */}
        <div className="space-y-3">
          <h3 className="text-sm uppercase tracking-wide text-cyan-300 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Available Upgrades
          </h3>

          {constructionOptions.map((option) => {
            const Icon = TIER_ICONS[option.tier] || Beaker;
            const color = TIER_COLORS[option.tier] || 'cyan';
            const def = option.definition;

            const isCurrentlyBuilding = labFacility.underConstruction && labFacility.targetTier === option.tier;

            return (
              <div
                key={option.tier}
                className={`
                  border rounded-lg p-4 transition-all
                  ${
                    option.available
                      ? `border-${color}-500/40 bg-${color}-500/5 hover:border-${color}-400/60`
                      : 'border-gray-600/30 bg-gray-800/20 opacity-60'
                  }
                  ${isCurrentlyBuilding ? 'ring-2 ring-yellow-400/60' : ''}
                `}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Icon className={`h-6 w-6 text-${color}-400`} />
                    <div>
                      <h4 className="text-base font-semibold text-cyan-200 uppercase tracking-wide">
                        TIER {option.tier}: {def.name}
                      </h4>
                      <p className="text-[10px] text-cyan-400/70 mt-0.5">
                        {def.tier >= 3 && '⚠️ CLASSIFIED FACILITY'}
                      </p>
                    </div>
                  </div>

                  {/* Status Icon */}
                  <div>
                    {labFacility.tier >= option.tier ? (
                      <Check className="h-5 w-5 text-green-400" />
                    ) : !option.hasPrerequisites ? (
                      <Lock className="h-5 w-5 text-red-400" />
                    ) : null}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-cyan-300/80 mb-3 leading-relaxed">{def.description}</p>

                {/* Costs */}
                <div className="flex items-center gap-4 mb-3 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400/70">Production:</span>
                    <span
                      className={
                        option.canAfford || playerProduction >= def.productionCost
                          ? 'text-green-300 font-semibold'
                          : 'text-red-300 font-semibold'
                      }
                    >
                      {def.productionCost}
                    </span>
                  </div>
                  {def.uraniumCost > 0 && (
                    <>
                      <div className="text-cyan-400/40">|</div>
                      <div className="flex items-center gap-2">
                        <span className="text-cyan-400/70">Uranium:</span>
                        <span
                          className={
                            option.canAfford || playerUranium >= def.uraniumCost
                              ? 'text-green-300 font-semibold'
                              : 'text-red-300 font-semibold'
                          }
                        >
                          {def.uraniumCost}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="text-cyan-400/40">|</div>
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400/70">Time:</span>
                    <span className="text-cyan-300 font-semibold">{def.constructionTurns} turns</span>
                  </div>
                </div>

                {/* Unlocks */}
                <div className="mb-3">
                  <div className="text-[10px] uppercase text-cyan-400/70 mb-2 tracking-wide">Unlocks:</div>
                  <div className="flex flex-wrap gap-2">
                    {def.unlocks.map((unlock, idx) => (
                      <div
                        key={idx}
                        className={`text-[10px] px-2 py-1 rounded bg-${color}-500/20 border border-${color}-400/40 text-${color}-300`}
                      >
                        {unlock}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bonuses */}
                {(def.researchSpeedBonus > 1.0 || def.evolutionCostReduction > 0) && (
                  <div className="mb-3 p-2 bg-green-500/10 border border-green-400/30 rounded">
                    <div className="text-[10px] uppercase text-green-400/70 mb-1 tracking-wide">Bonuses:</div>
                    <div className="text-[11px] text-green-300 space-y-0.5">
                      {def.researchSpeedBonus > 1.0 && (
                        <div>+ {((def.researchSpeedBonus - 1) * 100).toFixed(0)}% vaccine research speed</div>
                      )}
                      {def.evolutionCostReduction > 0 && (
                        <div>- {def.evolutionCostReduction}% evolution DNA costs</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div className="flex items-center justify-between">
                  {!option.available && option.reason && (
                    <div className="text-[11px] text-red-300/80 italic">{option.reason}</div>
                  )}
                  <div className="flex-1"></div>
                  <Button
                    onClick={() => onStartConstruction(option.tier)}
                    disabled={!option.available}
                    className={`
                      ${option.available ? `bg-${color}-500 hover:bg-${color}-400 text-black` : ''}
                    `}
                  >
                    {labFacility.tier >= option.tier
                      ? 'Constructed'
                      : isCurrentlyBuilding
                        ? 'Under Construction'
                        : 'Begin Construction'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
