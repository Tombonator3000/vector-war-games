import { useState, useEffect } from 'react';
import { FlaskConical, Biohazard, AlertTriangle, Target, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { PlagueTypeSelector } from '@/components/PlagueTypeSelector';
import { DeploymentTargetSelector } from '@/components/DeploymentTargetSelector';
import { BioforgeEliminationOverview } from '@/components/BioforgeEliminationOverview';
import { DNAPointsDisplay } from '@/components/DNAPointsDisplay';
import { EvolutionTreeFlow } from '@/components/EvolutionTreeFlow';
import type { PlagueState } from '@/types/biowarfare';
import type { BioLabTier } from '@/types/bioLab';
import { getPlagueTypeById } from '@/lib/evolutionData';
import { getBioLabTierDefinition } from '@/types/bioLab';

const VACCINE_NODE_IDS = [
  'vaccine-prototyping',
  'vaccine-field-trials',
  'vaccine-mass-production',
] as const;

const RADIATION_NODE_IDS = [
  'radiation-shielding-1',
  'radiation-shielding-2',
] as const;

interface BioWarfareLabProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plagueState: PlagueState;
  enabled: boolean;
  labTier: BioLabTier;
  availableNations: Array<{ id: string; name: string; intelligence: number }>;
  playerActions: number;
  playerIntel: number;
  onSelectPlagueType: (plagueTypeId: string) => void;
  onEvolveNode: (nodeId: string) => void;
  onDevolveNode: (nodeId: string) => void;
  onDeployBioWeapon: (selections: Array<{
    nationId: string;
    nationName: string;
    deploymentMethod: string;
    useFalseFlag: boolean;
    falseFlagNationId: string | null;
  }>) => void;
}

export function BioWarfareLab({
  open,
  onOpenChange,
  plagueState,
  enabled,
  labTier,
  availableNations,
  playerActions,
  playerIntel,
  onSelectPlagueType,
  onEvolveNode,
  onDevolveNode,
  onDeployBioWeapon,
}: BioWarfareLabProps) {
  const [showPlagueSelector, setShowPlagueSelector] = useState(false);
  const [showDeploymentSelector, setShowDeploymentSelector] = useState(false);
  const [showEliminationOverview, setShowEliminationOverview] = useState(false);

  // Auto-open plague selector when lab opens and no plague selected
  useEffect(() => {
    if (open && !plagueState.plagueStarted && labTier >= 3) {
      setShowPlagueSelector(true);
    }
  }, [open, plagueState.plagueStarted, labTier]);

  if (!enabled) {
    return null;
  }

  const plagueType = plagueState.selectedPlagueType
    ? getPlagueTypeById(plagueState.selectedPlagueType)
    : null;

  const handleSelectPlague = (plagueTypeId: string) => {
    onSelectPlagueType(plagueTypeId);
    toast({
      title: 'Pathogen Selected',
      description: `${getPlagueTypeById(plagueTypeId)?.name} initialized in BioForge chambers`,
    });
  };

  const handleEvolve = (nodeId: string) => {
    onEvolveNode(nodeId);
  };

  const handleDevolve = (nodeId: string) => {
    onDevolveNode(nodeId);
  };

  const currentLabDef = getBioLabTierDefinition(labTier);
  const canUseBioForge = labTier >= 3;

  const vaccineUnlocks = VACCINE_NODE_IDS.filter((id) => plagueState.unlockedNodes.has(id)).length;
  const radiationUnlocks = RADIATION_NODE_IDS.filter((id) => plagueState.unlockedNodes.has(id)).length;
  const vaccineProgressPercent = Math.round((vaccineUnlocks / VACCINE_NODE_IDS.length) * 100);
  const radiationProgressPercent = Math.round((radiationUnlocks / RADIATION_NODE_IDS.length) * 100);
  const vaccineBoost = plagueState.calculatedStats.vaccineAcceleration;
  const radiationMitigation = Math.round(plagueState.calculatedStats.radiationMitigation * 100);

  // Create nation name map for overview
  const nationNames = new Map(
    availableNations.map(nation => [nation.id, nation.name])
  );

  const handleDeployment = (selections: Array<{
    nationId: string;
    nationName: string;
    deploymentMethod: string;
    useFalseFlag: boolean;
    falseFlagNationId: string | null;
  }>) => {
    onDeployBioWeapon(selections);
    toast({
      title: 'Bio-Weapon Deployed',
      description: `Pathogen deployed to ${selections.length} target${selections.length !== 1 ? 's' : ''}`,
    });
  };

  return (
    <>
      {/* Plague Type Selector Dialog */}
      <PlagueTypeSelector
        open={showPlagueSelector}
        onOpenChange={setShowPlagueSelector}
        onSelect={handleSelectPlague}
        labTier={labTier}
      />

      {/* Deployment Target Selector */}
      <DeploymentTargetSelector
        open={showDeploymentSelector}
        onOpenChange={setShowDeploymentSelector}
        availableNations={availableNations}
        playerDNA={plagueState.dnaPoints}
        playerActions={playerActions}
        playerIntel={playerIntel}
        onConfirmDeployment={handleDeployment}
      />

      {/* Elimination Overview */}
      <BioforgeEliminationOverview
        open={showEliminationOverview}
        onOpenChange={setShowEliminationOverview}
        plagueState={plagueState}
        nationNames={nationNames}
      />

      {/* Main BioForge Lab Dialog */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] w-[1400px] max-h-[90vh] bg-black/95 border-cyan-500/40 text-cyan-200 font-mono p-0">
          <DialogHeader className="px-6 py-4 border-b border-cyan-500/30 bg-black/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FlaskConical className="h-6 w-6 text-emerald-400" />
                <div>
                  <DialogTitle className="text-cyan-300 uppercase tracking-[0.3em] text-sm">
                    BIOFORGE LAB - {currentLabDef.name}
                  </DialogTitle>
                  {plagueType && (
                    <p className="text-[10px] text-cyan-400/80 uppercase tracking-wide mt-1">
                      Active Pathogen: {plagueType.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* DNA Points Display */}
                <DNAPointsDisplay dnaPoints={plagueState.dnaPoints} />

                {/* Stats Summary */}
                {plagueState.plagueStarted && (
                  <div className="flex gap-3 text-[10px]">
                    <div className="text-center px-3 py-2 bg-cyan-500/10 border border-cyan-400/40 rounded">
                      <div className="text-cyan-400/70 uppercase tracking-wide mb-1">Infectivity</div>
                      <div className="text-cyan-300 font-bold text-base">
                        {plagueState.calculatedStats.totalInfectivity}
                      </div>
                    </div>
                    <div className="text-center px-3 py-2 bg-orange-500/10 border border-orange-400/40 rounded">
                      <div className="text-orange-400/70 uppercase tracking-wide mb-1">Severity</div>
                      <div className="text-orange-300 font-bold text-base">
                        {plagueState.calculatedStats.totalSeverity}
                      </div>
                    </div>
                    <div className="text-center px-3 py-2 bg-red-500/10 border border-red-400/40 rounded">
                      <div className="text-red-400/70 uppercase tracking-wide mb-1">Lethality</div>
                      <div className="text-red-300 font-bold text-base">
                        {plagueState.calculatedStats.totalLethality}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="p-6">
            {/* Warning if lab tier too low */}
            {!canUseBioForge ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-6">
                <AlertTriangle className="h-20 w-20 text-yellow-500/60" />
                <div className="text-center space-y-2">
                  <h3 className="text-xl uppercase tracking-wide text-yellow-300">
                    BioForge Facility Required
                  </h3>
                  <p className="text-sm text-cyan-400/80 max-w-md">
                    Offensive bio-weapon development requires a BioForge Facility (Tier 3).
                    Current laboratory: {currentLabDef.name} (Tier {labTier})
                  </p>
                  <p className="text-xs text-gray-400 max-w-md mt-4">
                    Construct higher-tier bio laboratories to unlock pathogen development capabilities.
                  </p>
                </div>
              </div>
            ) : !plagueState.plagueStarted ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-6">
                <Biohazard className="h-20 w-20 text-cyan-500/40" />
                <div className="text-center space-y-2">
                  <h3 className="text-xl uppercase tracking-wide text-cyan-300">
                    BioForge Chambers Idle
                  </h3>
                  <p className="text-sm text-cyan-400/80 max-w-md">
                    Select a pathogen type to initialize bio-weapon development protocols.
                    Each pathogen has unique characteristics and strategic requirements.
                  </p>
                </div>
                <Button
                  size="lg"
                  onClick={() => setShowPlagueSelector(true)}
                  className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold uppercase tracking-wide"
                >
                  Select Pathogen Type
                </Button>
              </div>
            ) : (
              /* Show evolution tree if plague is selected */
              <div className="space-y-4">
                {/* Plague Info Bar */}
                <div className="flex items-center justify-between p-4 bg-cyan-500/5 border border-cyan-500/30 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="text-sm">
                      <span className="text-cyan-400/70 uppercase tracking-wide">Pathogen:</span>{' '}
                      <span className="text-cyan-200 font-semibold">{plagueType?.name}</span>
                    </div>
                    <div className="text-xs text-cyan-400/60">|</div>
                    <div className="text-sm">
                      <span className="text-cyan-400/70 uppercase tracking-wide">Difficulty:</span>{' '}
                      <span className="text-yellow-300 uppercase text-xs">{plagueType?.difficulty}</span>
                    </div>
                    <div className="text-xs text-cyan-400/60">|</div>
                    <div className="text-sm">
                      <span className="text-cyan-400/70 uppercase tracking-wide">Countries Infected:</span>{' '}
                      <span className="text-emerald-300 font-bold">{plagueState.countriesInfected.length}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {plagueState.countryInfections.size > 0 && (
                      <Button
                        size="sm"
                        onClick={() => setShowEliminationOverview(true)}
                        className="bg-orange-500 hover:bg-orange-400 text-black font-semibold text-xs"
                      >
                        <BarChart3 className="h-3 w-3 mr-1" />
                        Impact Report
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => setShowDeploymentSelector(true)}
                      className="bg-red-500 hover:bg-red-400 text-black font-semibold text-xs"
                    >
                      <Target className="h-3 w-3 mr-1" />
                      Deploy
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowPlagueSelector(true)}
                      className="border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 text-xs"
                    >
                      Change Pathogen
                    </Button>
                  </div>
                </div>

                {/* Special Mechanic Alert */}
                {plagueType && (
                  <div className="p-3 bg-yellow-500/10 border border-yellow-400/40 rounded text-[11px] text-yellow-300">
                    <strong className="uppercase tracking-wide">Special Mechanic:</strong> {plagueType.specialMechanic}
                  </div>
                )}

                {/* Defense Research Progress */}
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-400/40 rounded-lg">
                    <div className="flex items-center justify-between text-xs uppercase tracking-wide text-emerald-200">
                      <span>Vaccine Initiative</span>
                      <span>
                        {vaccineUnlocks}/{VACCINE_NODE_IDS.length}
                      </span>
                    </div>
                    <div className="mt-2 h-2 w-full bg-emerald-500/20 rounded">
                      <div
                        className="h-2 bg-emerald-400 rounded"
                        style={{ width: `${vaccineProgressPercent}%` }}
                      />
                    </div>
                    <p className="mt-3 text-[11px] text-emerald-100/80">
                      Cumulative surge capacity: <span className="font-semibold">+{vaccineBoost}%</span> vaccine progress when activated.
                    </p>
                  </div>

                  <div className="p-4 bg-lime-500/10 border border-lime-400/40 rounded-lg">
                    <div className="flex items-center justify-between text-xs uppercase tracking-wide text-lime-200">
                      <span>Radiation Shielding</span>
                      <span>
                        {radiationUnlocks}/{RADIATION_NODE_IDS.length}
                      </span>
                    </div>
                    <div className="mt-2 h-2 w-full bg-lime-500/20 rounded">
                      <div
                        className="h-2 bg-lime-300 rounded"
                        style={{ width: `${radiationProgressPercent}%` }}
                      />
                    </div>
                    <p className="mt-3 text-[11px] text-lime-100/80">
                      Current fallout mitigation: <span className="font-semibold">{radiationMitigation}%</span> damage reduction in resolution phase.
                    </p>
                  </div>
                </div>

                {/* Evolution Tree Flow */}
                <EvolutionTreeFlow
                  plagueState={plagueState}
                  onEvolve={handleEvolve}
                  onDevolve={handleDevolve}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
