import { useState } from 'react';
import { Target, AlertTriangle, Check, X, Skull } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { DeploymentMethod, DeploymentMethodId } from '@/types/bioDeployment';
import { DEPLOYMENT_METHODS, canAffordDeployment, calculateDetectionChance } from '@/types/bioDeployment';

interface TargetSelection {
  nationId: string;
  nationName: string;
  deploymentMethod: DeploymentMethodId;
  useFalseFlag: boolean;
  falseFlagNationId: string | null;
}

interface DeploymentTargetSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableNations: Array<{ id: string; name: string; intelligence: number }>;
  playerDNA: number;
  playerActions: number;
  onConfirmDeployment: (selections: TargetSelection[]) => void;
}

export function DeploymentTargetSelector({
  open,
  onOpenChange,
  availableNations,
  playerDNA,
  playerActions,
  onConfirmDeployment,
}: DeploymentTargetSelectorProps) {
  const [selectedNations, setSelectedNations] = useState<Set<string>>(new Set());
  const [deploymentMethods, setDeploymentMethods] = useState<Map<string, DeploymentMethodId>>(new Map());
  const [falseFlagEnabled, setFalseFlagEnabled] = useState<Map<string, boolean>>(new Map());
  const [falseFlagTargets, setFalseFlagTargets] = useState<Map<string, string>>(new Map());

  const toggleNation = (nationId: string) => {
    setSelectedNations(prev => {
      const next = new Set(prev);
      if (next.has(nationId)) {
        next.delete(nationId);
        // Clear associated settings
        setDeploymentMethods(m => {
          const nm = new Map(m);
          nm.delete(nationId);
          return nm;
        });
        setFalseFlagEnabled(f => {
          const nf = new Map(f);
          nf.delete(nationId);
          return nf;
        });
        setFalseFlagTargets(t => {
          const nt = new Map(t);
          nt.delete(nationId);
          return nt;
        });
      } else {
        next.add(nationId);
        // Set default deployment method
        if (!deploymentMethods.has(nationId)) {
          setDeploymentMethods(m => new Map(m).set(nationId, 'covert'));
        }
      }
      return next;
    });
  };

  const setMethodForNation = (nationId: string, methodId: DeploymentMethodId) => {
    setDeploymentMethods(m => new Map(m).set(nationId, methodId));
  };

  const toggleFalseFlag = (nationId: string, enabled: boolean) => {
    setFalseFlagEnabled(f => new Map(f).set(nationId, enabled));
    if (!enabled) {
      setFalseFlagTargets(t => {
        const nt = new Map(t);
        nt.delete(nationId);
        return nt;
      });
    }
  };

  const setFalseFlagTarget = (nationId: string, targetId: string) => {
    setFalseFlagTargets(t => new Map(t).set(nationId, targetId));
  };

  // Calculate total costs
  const totalDNACost = Array.from(selectedNations).reduce((total, nationId) => {
    const methodId = deploymentMethods.get(nationId) || 'covert';
    const method = DEPLOYMENT_METHODS.find(m => m.id === methodId);
    return total + (method?.dnaCost || 0);
  }, 0);

  const totalActions = Array.from(selectedNations).reduce((total, nationId) => {
    const methodId = deploymentMethods.get(nationId) || 'covert';
    const method = DEPLOYMENT_METHODS.find(m => m.id === methodId);
    return total + (method?.actionsRequired || 0);
  }, 0);

  const canAfford = playerDNA >= totalDNACost && playerActions >= totalActions;

  const handleConfirm = () => {
    const selections: TargetSelection[] = Array.from(selectedNations).map(nationId => {
      const nation = availableNations.find(n => n.id === nationId);
      return {
        nationId,
        nationName: nation?.name || nationId,
        deploymentMethod: deploymentMethods.get(nationId) || 'covert',
        useFalseFlag: falseFlagEnabled.get(nationId) || false,
        falseFlagNationId: falseFlagTargets.get(nationId) || null,
      };
    });

    onConfirmDeployment(selections);
    onOpenChange(false);

    // Reset state
    setSelectedNations(new Set());
    setDeploymentMethods(new Map());
    setFalseFlagEnabled(new Map());
    setFalseFlagTargets(new Map());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-black/95 border-red-500/40 text-red-200 font-mono">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Skull className="h-6 w-6 text-red-400" />
            <div>
              <DialogTitle className="text-red-300 uppercase tracking-[0.3em] text-sm">
                BIO-WEAPON DEPLOYMENT
              </DialogTitle>
              <DialogDescription className="text-red-400/80 text-xs mt-1">
                Select target nations and deployment parameters
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Resources Display */}
        <div className="flex gap-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-xs">
          <div>
            <span className="text-red-400/70 uppercase">Available DNA:</span>{' '}
            <span className={`font-bold ${playerDNA >= totalDNACost ? 'text-red-300' : 'text-red-500'}`}>
              {playerDNA} / {totalDNACost}
            </span>
          </div>
          <div>
            <span className="text-red-400/70 uppercase">Actions:</span>{' '}
            <span className={`font-bold ${playerActions >= totalActions ? 'text-red-300' : 'text-red-500'}`}>
              {playerActions} / {totalActions}
            </span>
          </div>
          <div>
            <span className="text-red-400/70 uppercase">Targets:</span>{' '}
            <span className="text-red-300 font-bold">{selectedNations.size}</span>
          </div>
        </div>

        {/* Available Nations */}
        <div className="space-y-2">
          <h3 className="text-xs uppercase tracking-wide text-red-400/70 font-semibold">
            Select Target Nations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {availableNations.map(nation => {
              const isSelected = selectedNations.has(nation.id);
              const methodId = deploymentMethods.get(nation.id) || 'covert';
              const method = DEPLOYMENT_METHODS.find(m => m.id === methodId);
              const hasFalseFlag = falseFlagEnabled.get(nation.id) || false;

              return (
                <div
                  key={nation.id}
                  className={`
                    border rounded p-3 transition-all cursor-pointer
                    ${isSelected
                      ? 'border-red-500/60 bg-red-500/10'
                      : 'border-red-500/20 bg-red-500/5 hover:border-red-500/40'
                    }
                  `}
                  onClick={() => toggleNation(nation.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {isSelected ? (
                        <Check className="h-4 w-4 text-red-400" />
                      ) : (
                        <Target className="h-4 w-4 text-red-600/40" />
                      )}
                      <span className="font-semibold text-red-200">{nation.name}</span>
                    </div>
                    <span className="text-[10px] text-red-400/60">
                      Intel: {nation.intelligence}
                    </span>
                  </div>

                  {isSelected && method && (
                    <div className="space-y-2 mt-3 pt-3 border-t border-red-500/20" onClick={e => e.stopPropagation()}>
                      {/* Deployment Method Selection */}
                      <div>
                        <Label className="text-[10px] text-red-400/70 uppercase tracking-wide">
                          Deployment Method
                        </Label>
                        <RadioGroup
                          value={methodId}
                          onValueChange={(v) => setMethodForNation(nation.id, v as DeploymentMethodId)}
                          className="mt-1"
                        >
                          {DEPLOYMENT_METHODS.map(m => {
                            const detectionChance = calculateDetectionChance(m, hasFalseFlag, nation.intelligence);
                            const affordable = canAffordDeployment(m, playerDNA, playerActions);

                            return (
                              <div key={m.id} className="flex items-start gap-2 mb-2">
                                <RadioGroupItem value={m.id} id={`${nation.id}-${m.id}`} disabled={!affordable} />
                                <div className="flex-1">
                                  <label
                                    htmlFor={`${nation.id}-${m.id}`}
                                    className={`text-xs cursor-pointer ${affordable ? 'text-red-200' : 'text-red-600/50'}`}
                                  >
                                    <div className="font-semibold">{m.name}</div>
                                    <div className="text-[10px] text-red-400/60 mt-0.5">
                                      {m.dnaCost} DNA, {m.actionsRequired} Action(s)
                                    </div>
                                    <div className="text-[10px] text-red-400/60">
                                      Detection: {detectionChance.toFixed(0)}% | Spread: {(m.spreadSpeed * 100).toFixed(0)}%
                                    </div>
                                  </label>
                                </div>
                              </div>
                            );
                          })}
                        </RadioGroup>
                      </div>

                      {/* False Flag Option */}
                      {method.supportsFalseFlag && (
                        <div className="pt-2 border-t border-red-500/10">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`${nation.id}-falseFlag`}
                              checked={hasFalseFlag}
                              onCheckedChange={(checked) => toggleFalseFlag(nation.id, !!checked)}
                            />
                            <Label
                              htmlFor={`${nation.id}-falseFlag`}
                              className="text-[10px] text-yellow-400 uppercase tracking-wide cursor-pointer"
                            >
                              False Flag Operation (+{method.falseFlagDetectionPenalty}% detection)
                            </Label>
                          </div>

                          {hasFalseFlag && (
                            <select
                              value={falseFlagTargets.get(nation.id) || ''}
                              onChange={(e) => setFalseFlagTarget(nation.id, e.target.value)}
                              className="mt-2 w-full bg-black/60 border border-yellow-500/30 rounded p-1 text-xs text-yellow-200"
                              onClick={e => e.stopPropagation()}
                            >
                              <option value="">Select scapegoat nation...</option>
                              {availableNations
                                .filter(n => n.id !== nation.id)
                                .map(n => (
                                  <option key={n.id} value={n.id}>{n.name}</option>
                                ))}
                            </select>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-red-500/40 text-red-300 hover:bg-red-500/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedNations.size === 0 || !canAfford}
            className="bg-red-500 text-black hover:bg-red-400 disabled:opacity-50"
          >
            {!canAfford ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Insufficient Resources
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Deploy to {selectedNations.size} Target{selectedNations.size !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
