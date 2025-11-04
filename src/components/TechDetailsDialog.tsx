import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, Lock, Clock, Factory, Brain, ShieldAlert, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ResearchNode } from '@/lib/researchData';
import { CATEGORY_COLORS } from '@/lib/researchData';

interface TechDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tech: ResearchNode & {
    researched: boolean;
    canResearch: boolean;
    canAfford: boolean;
    isResearching: boolean;
    researchProgress?: number;
    playerProduction: number;
    playerIntel: number;
    playerUranium: number;
  } | null;
  onStartResearch?: () => void;
  onCancelResearch?: () => void;
}

export function TechDetailsDialog({
  isOpen,
  onClose,
  tech,
  onStartResearch,
  onCancelResearch,
}: TechDetailsDialogProps) {
  if (!tech) return null;

  const colors = {
    border: CATEGORY_COLORS[tech.category],
    bg: `${CATEGORY_COLORS[tech.category]}1A`,
    text: CATEGORY_COLORS[tech.category],
  };

  const isAvailable = tech.canResearch && tech.canAfford && !tech.researched && !tech.isResearching;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gray-900 border-2" style={{ borderColor: colors.border }}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ background: colors.bg, borderColor: colors.border }}
            >
              {tech.category === 'nuclear' && <ShieldAlert className="w-6 h-6" style={{ color: colors.text }} />}
              {tech.category === 'cyber' && <Brain className="w-6 h-6" style={{ color: colors.text }} />}
              {tech.category === 'conventional' && <Factory className="w-6 h-6" style={{ color: colors.text }} />}
              {tech.category === 'space' && <Zap className="w-6 h-6" style={{ color: colors.text }} />}
            </div>
            <span style={{ color: colors.text }}>{tech.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            {tech.researched ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-500/50 rounded text-green-400">
                <Check className="w-4 h-4" />
                <span className="font-medium">RESEARCHED</span>
              </div>
            ) : tech.isResearching ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 border border-amber-500/50 rounded text-amber-400">
                <Clock className="w-4 h-4 animate-spin" />
                <span className="font-medium">RESEARCHING...</span>
              </div>
            ) : !tech.canResearch ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-500/20 border border-gray-500/50 rounded text-gray-400">
                <Lock className="w-4 h-4" />
                <span className="font-medium">LOCKED</span>
              </div>
            ) : null}
          </div>

          {/* Description */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Description</h3>
            <p className="text-white leading-relaxed">{tech.description}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Research Time */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Research Time</h3>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-cyan-400" />
                <span className="text-2xl font-bold text-cyan-300">{tech.turns}</span>
                <span className="text-gray-400">{tech.turns === 1 ? 'turn' : 'turns'}</span>
              </div>
            </div>

            {/* Category */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Category</h3>
              <div 
                className="inline-block px-3 py-1 rounded font-semibold uppercase text-sm"
                style={{ background: colors.bg, color: colors.text, borderColor: colors.border }}
              >
                {tech.category}
              </div>
            </div>
          </div>

          {/* Costs */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">Resource Cost</h3>
            <div className="flex flex-wrap gap-3">
              {tech.cost.production && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded border ${
                  tech.playerProduction >= tech.cost.production
                    ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                    : 'border-red-500/40 bg-red-500/15 text-red-300'
                }`}>
                  <Factory className="w-4 h-4" />
                  <span className="font-bold">{tech.cost.production}</span>
                  <span className="text-sm">Production</span>
                </div>
              )}
              {tech.cost.intel && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded border ${
                  tech.playerIntel >= tech.cost.intel
                    ? 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300'
                    : 'border-red-500/40 bg-red-500/15 text-red-300'
                }`}>
                  <Brain className="w-4 h-4" />
                  <span className="font-bold">{tech.cost.intel}</span>
                  <span className="text-sm">Intel</span>
                </div>
              )}
              {tech.cost.uranium && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded border ${
                  tech.playerUranium >= tech.cost.uranium
                    ? 'border-green-500/40 bg-green-500/15 text-green-300'
                    : 'border-red-500/40 bg-red-500/15 text-red-300'
                }`}>
                  <ShieldAlert className="w-4 h-4" />
                  <span className="font-bold">{tech.cost.uranium}</span>
                  <span className="text-sm">Uranium</span>
                </div>
              )}
            </div>
          </div>

          {/* Research Progress */}
          {tech.isResearching && tech.researchProgress !== undefined && (
            <div className="bg-gray-800/50 rounded-lg p-4 border border-amber-500/50">
              <h3 className="text-sm font-semibold text-amber-400 uppercase mb-3">Research Progress</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white">Progress</span>
                  <span className="text-amber-300 font-bold">
                    {Math.round((tech.researchProgress / tech.turns) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                    style={{ width: `${(tech.researchProgress / tech.turns) * 100}%` }}
                  />
                </div>
                <div className="text-sm text-gray-400">
                  Turn {tech.researchProgress} of {tech.turns}
                </div>
              </div>
            </div>
          )}

          {/* Yield Info */}
          {tech.yield && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Zap className="w-6 h-6 text-red-400" />
                <div>
                  <div className="text-red-400 font-bold text-lg">{tech.yield} MT Warhead</div>
                  <div className="text-sm text-gray-400">Nuclear weapon yield</div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {tech.researched ? (
              <Button disabled className="flex-1 bg-green-500/20 text-green-400">
                <Check className="w-4 h-4 mr-2" />
                Already Researched
              </Button>
            ) : tech.isResearching ? (
              <>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={onClose}
                >
                  Close
                </Button>
                <Button 
                  variant="destructive"
                  onClick={onCancelResearch}
                  className="flex-1"
                >
                  Cancel Research
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={onClose}
                >
                  Close
                </Button>
                <Button
                  onClick={onStartResearch}
                  disabled={!isAvailable}
                  className="flex-1"
                  style={{
                    background: isAvailable
                      ? `linear-gradient(135deg, ${colors.border} 0%, ${colors.border}CC 100%)`
                      : undefined,
                  }}
                >
                  {!tech.canResearch
                    ? 'Prerequisites Not Met'
                    : !tech.canAfford
                      ? 'Insufficient Resources'
                      : 'Start Research'}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
