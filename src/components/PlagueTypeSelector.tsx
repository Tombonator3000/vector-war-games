import { Lock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { PlagueType, PlagueTypeId } from '@/types/biowarfare';
import type { BioLabTier } from '@/types/bioLab';
import { PLAGUE_TYPES } from '@/lib/evolutionData';

interface PlagueTypeSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (plagueTypeId: string) => void;
  labTier: BioLabTier;
  unlockedPlagueTypes: ReadonlySet<PlagueTypeId>;
}

const DIFFICULTY_COLORS = {
  beginner: 'text-green-400',
  intermediate: 'text-yellow-400',
  advanced: 'text-orange-400',
  expert: 'text-red-400',
};

const DIFFICULTY_LABELS = {
  beginner: 'BEGINNER',
  intermediate: 'INTERMEDIATE',
  advanced: 'ADVANCED',
  expert: 'EXPERT',
};

export function PlagueTypeSelector({
  open,
  onOpenChange,
  onSelect,
  labTier,
  unlockedPlagueTypes,
}: PlagueTypeSelectorProps) {
  // Check if plague type is unlocked by lab tier
  const isPlagueTypeAvailable = (plagueTypeId: string): { available: boolean; reason?: string } => {
    if (labTier < 3) {
      return { available: false, reason: 'Requires BioForge Facility (Tier 3)' };
    }

    const basicPlagues = ['bacteria', 'virus', 'fungus'];
    if (basicPlagues.includes(plagueTypeId)) {
      return { available: true };
    }

    const advancedPlagues = ['parasite', 'prion', 'nano-virus', 'bio-weapon'];
    if (advancedPlagues.includes(plagueTypeId)) {
      if (labTier < 4) {
        return { available: false, reason: 'Requires Genetic Engineering Complex (Tier 4)' };
      }
      return { available: true };
    }

    return { available: false, reason: 'Unknown plague type' };
  };

  const handleSelect = (plagueType: PlagueType) => {
    if (!unlockedPlagueTypes.has(plagueType.id)) return;

    const availability = isPlagueTypeAvailable(plagueType.id);
    if (!availability.available) return;

    onSelect(plagueType.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-black/95 border-cyan-500/40 text-cyan-200 font-mono">
        <DialogHeader>
          <DialogTitle className="text-cyan-300 uppercase tracking-[0.3em] text-lg">
            SELECT PATHOGEN TYPE
          </DialogTitle>
          <DialogDescription className="text-cyan-400/80 text-xs">
            Choose your bio-weapon configuration. Each pathogen has unique mechanics and strategic requirements.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          {PLAGUE_TYPES.map((plagueType) => {
            const availability = isPlagueTypeAvailable(plagueType.id);
            const isUnlocked = unlockedPlagueTypes.has(plagueType.id);
            const isSelectable = isUnlocked && availability.available;

            return (
              <div
                key={plagueType.id}
                className={`
                  relative border rounded-lg p-4 transition-all
                  ${isSelectable
                    ? 'border-cyan-500/30 bg-cyan-500/5 hover:border-cyan-400/60 hover:bg-cyan-500/10 cursor-pointer'
                    : 'border-gray-600/30 bg-gray-800/20 opacity-60 cursor-not-allowed'
                  }
                `}
                onClick={() => handleSelect(plagueType)}
              >
                {/* Lock icon for locked plagues */}
                {(!isUnlocked || !availability.available) && (
                  <div className="absolute top-2 right-2">
                    <Lock className="h-4 w-4 text-gray-500" />
                  </div>
                )}

              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-cyan-200 uppercase tracking-wide text-sm font-semibold">
                  {plagueType.name}
                </h3>
                <span className={`text-[10px] uppercase tracking-wider ${DIFFICULTY_COLORS[plagueType.difficulty]}`}>
                  {DIFFICULTY_LABELS[plagueType.difficulty]}
                </span>
              </div>

              {/* Description */}
              <p className="text-[11px] text-cyan-300/80 mb-3 leading-relaxed">
                {plagueType.description}
              </p>

              {/* Special mechanic */}
              <div className="flex items-start gap-2 mb-3 p-2 rounded bg-black/40 border border-cyan-500/20">
                <AlertTriangle className="h-3 w-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                <p className="text-[10px] text-yellow-300/90 leading-relaxed">
                  {plagueType.specialMechanic}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <div className="text-center">
                  <div className="text-cyan-400/70 uppercase tracking-wide mb-1">Trans</div>
                  <div className={`font-semibold ${plagueType.baseTransmission >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {plagueType.baseTransmission >= 0 ? '+' : ''}{plagueType.baseTransmission}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-cyan-400/70 uppercase tracking-wide mb-1">Sev</div>
                  <div className={`font-semibold ${plagueType.baseSeverity >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {plagueType.baseSeverity >= 0 ? '+' : ''}{plagueType.baseSeverity}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-cyan-400/70 uppercase tracking-wide mb-1">Lethal</div>
                  <div className={`font-semibold ${plagueType.baseLethality >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {plagueType.baseLethality >= 0 ? '+' : ''}{plagueType.baseLethality}
                  </div>
                </div>
              </div>

              {/* Unlock requirement */}
              {!isUnlocked && plagueType.unlockRequirement && (
                <div className="mt-3 pt-3 border-t border-gray-600/30">
                  <p className="text-[9px] text-gray-400 uppercase tracking-wide">
                    🔒 {plagueType.unlockRequirement}
                  </p>
                </div>
              )}

              {/* Lab tier requirement */}
              {!availability.available && availability.reason && (
                <div className="mt-3 pt-3 border-t border-gray-600/30">
                  <p className="text-[9px] text-yellow-400 uppercase tracking-wide">
                    🔬 {availability.reason}
                  </p>
                </div>
              )}
            </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-cyan-300 hover:bg-cyan-500/10"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
