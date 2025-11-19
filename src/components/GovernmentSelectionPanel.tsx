/**
 * GovernmentSelectionPanel Component
 *
 * Allows players to view and select different government types unlocked through research.
 * Switching governments has a stability cost and cooldown period.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, CheckCircle, Lock, Shield, TrendingUp, Users, Zap, X } from 'lucide-react';
import type { GovernmentType, GovernmentState } from '@/types/government';
import { GOVERNMENT_INFO, GOVERNMENT_BONUSES } from '@/types/government';
import { cn } from '@/lib/utils';

interface GovernmentSelectionPanelProps {
  /** Current government state */
  currentGovernmentState: GovernmentState;
  /** Unlocked government types through research */
  unlockedGovernments: GovernmentType[];
  /** Nation name for display */
  nationName: string;
  /** Current turn number */
  currentTurn: number;
  /** Last turn when government was changed */
  lastGovernmentChangeTurn?: number;
  /** Callback when government is selected */
  onSelectGovernment: (governmentType: GovernmentType) => void;
  /** Callback to close panel */
  onClose: () => void;
}

const TRANSITION_COOLDOWN = 10; // Turns between government changes
const BASE_STABILITY_COST = 15; // Base stability penalty for changing government

export function GovernmentSelectionPanel({
  currentGovernmentState,
  unlockedGovernments,
  nationName,
  currentTurn,
  lastGovernmentChangeTurn,
  onSelectGovernment,
  onClose,
}: GovernmentSelectionPanelProps) {
  const [selectedGov, setSelectedGov] = useState<GovernmentType | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const currentGov = currentGovernmentState.currentGovernment;
  const turnsUntilCanChange = lastGovernmentChangeTurn
    ? Math.max(0, TRANSITION_COOLDOWN - (currentTurn - lastGovernmentChangeTurn))
    : 0;
  const canChangeGovernment = turnsUntilCanChange === 0 && currentGovernmentState.governmentStability >= 30;

  const handleSelectGovernment = (govType: GovernmentType) => {
    if (govType === currentGov) return;
    if (!canChangeGovernment) return;

    setSelectedGov(govType);
    setShowConfirmDialog(true);
  };

  const handleConfirmChange = () => {
    if (selectedGov) {
      onSelectGovernment(selectedGov);
      setShowConfirmDialog(false);
      setSelectedGov(null);
      onClose();
    }
  };

  const formatBonus = (value: number, type: 'multiplier' | 'percent' | 'flat' = 'flat') => {
    if (type === 'multiplier') {
      const percent = ((value - 1) * 100).toFixed(0);
      return value >= 1 ? `+${percent}%` : `${percent}%`;
    }
    if (type === 'percent') {
      return value > 0 ? `+${value}%` : `${value}%`;
    }
    return value > 0 ? `+${value}` : `${value}`;
  };

  const getKeyBonuses = (bonuses: typeof GOVERNMENT_BONUSES[GovernmentType]) => [
    {
      icon: TrendingUp,
      label: 'Production',
      value: formatBonus(bonuses.productionMultiplier, 'multiplier'),
      positive: bonuses.productionMultiplier >= 1,
    },
    {
      icon: Zap,
      label: 'Research',
      value: formatBonus(bonuses.researchMultiplier, 'multiplier'),
      positive: bonuses.researchMultiplier >= 1,
    },
    {
      icon: Shield,
      label: 'Stability',
      value: formatBonus(bonuses.baseStabilityModifier),
      positive: bonuses.baseStabilityModifier >= 0,
    },
    {
      icon: Users,
      label: 'Recruitment',
      value: formatBonus(bonuses.recruitmentMultiplier, 'multiplier'),
      positive: bonuses.recruitmentMultiplier >= 1,
    },
  ];

  // Get all available government types (8 total)
  const allGovernments: GovernmentType[] = [
    'democracy',
    'constitutional_monarchy',
    'absolute_monarchy',
    'technocracy',
    'one_party_state',
    'dictatorship',
    'military_junta',
    'theocracy',
  ];

  return (
    <>
      <Card className="w-full max-w-5xl mx-auto bg-slate-950/98 border-cyan-500/40 max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b border-cyan-500/30 bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-cyan-100 flex items-center gap-3">
                <span className="text-3xl">🏛️</span>
                Government Selection
              </CardTitle>
              <CardDescription className="text-cyan-300/70 mt-1">
                Choose a government type for {nationName}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-cyan-300 hover:text-cyan-100"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Status Bar */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-cyan-300/90">Current Government</span>
              <Badge className="bg-cyan-500/20 text-cyan-100 border-cyan-500/40">
                {GOVERNMENT_INFO[currentGov].name}
              </Badge>
            </div>

            {turnsUntilCanChange > 0 && (
              <div className="rounded-lg bg-orange-500/10 border border-orange-500/30 p-3">
                <div className="flex items-center gap-2 text-orange-300">
                  <AlertTriangle className="h-4 w-4" />
                  <p className="text-sm">
                    Government transition cooldown: {turnsUntilCanChange} turn{turnsUntilCanChange !== 1 ? 's' : ''} remaining
                  </p>
                </div>
              </div>
            )}

            {!canChangeGovernment && currentGovernmentState.governmentStability < 30 && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3">
                <div className="flex items-center gap-2 text-red-300">
                  <AlertTriangle className="h-4 w-4" />
                  <p className="text-sm">
                    Government too unstable to change (stability &lt; 30%)
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allGovernments.map((govType) => {
              const govInfo = GOVERNMENT_INFO[govType];
              const bonuses = GOVERNMENT_BONUSES[govType];
              const isUnlocked = unlockedGovernments.includes(govType);
              const isCurrent = govType === currentGov;
              const keyBonuses = getKeyBonuses(bonuses);

              return (
                <Card
                  key={govType}
                  className={cn(
                    'relative cursor-pointer transition-all duration-200',
                    isCurrent && 'border-2 border-green-500/60 bg-green-500/5',
                    !isCurrent && isUnlocked && canChangeGovernment && 'hover:border-cyan-500/60 hover:bg-cyan-500/5',
                    !isUnlocked && 'opacity-50 cursor-not-allowed',
                    !canChangeGovernment && !isCurrent && 'cursor-not-allowed opacity-75'
                  )}
                  onClick={() => isUnlocked && !isCurrent ? handleSelectGovernment(govType) : null}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{govInfo.icon}</span>
                        <div>
                          <CardTitle className="text-lg text-cyan-100 flex items-center gap-2">
                            {govInfo.name}
                            {isCurrent && (
                              <Badge className="bg-green-500/20 text-green-300 border-green-500/40 text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Current
                              </Badge>
                            )}
                          </CardTitle>
                        </div>
                      </div>
                      {!isUnlocked && (
                        <Lock className="h-5 w-5 text-red-400" />
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <p className="text-xs text-cyan-300/80">{govInfo.description}</p>

                    {!isUnlocked && (
                      <div className="rounded bg-red-500/10 border border-red-500/30 p-2">
                        <p className="text-xs text-red-300">
                          🔒 Research required to unlock
                        </p>
                      </div>
                    )}

                    {isUnlocked && (
                      <>
                        <Separator className="bg-cyan-500/20" />

                        <div className="grid grid-cols-2 gap-2">
                          {keyBonuses.map((bonus, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-1.5 rounded bg-slate-900/50 p-2 border border-cyan-500/10"
                            >
                              <bonus.icon className="h-3 w-3 text-cyan-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-cyan-300/70">{bonus.label}</p>
                                <p
                                  className={cn(
                                    'text-xs font-semibold',
                                    bonus.positive ? 'text-green-400' : 'text-red-400'
                                  )}
                                >
                                  {bonus.value}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Election Info */}
                        <div className="text-[10px] text-cyan-300/70">
                          {govInfo.electionInfo}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-6 rounded-lg bg-cyan-500/10 border border-cyan-500/30 p-4">
            <h4 className="text-sm font-semibold text-cyan-100 mb-2">💡 How Government Selection Works</h4>
            <ul className="space-y-1 text-xs text-cyan-300/80">
              <li>• Research civics technologies to unlock new government types</li>
              <li>• Changing government costs {BASE_STABILITY_COST}% stability and requires {TRANSITION_COOLDOWN} turn cooldown</li>
              <li>• Cannot change government if stability is below 30%</li>
              <li>• Each government type provides unique bonuses and playstyles</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="bg-slate-950 border-cyan-500/40">
          <DialogHeader>
            <DialogTitle className="text-cyan-100">Confirm Government Change</DialogTitle>
            <DialogDescription className="text-cyan-300/70">
              This action will change your government and incur penalties
            </DialogDescription>
          </DialogHeader>

          {selectedGov && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-cyan-500/30">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{GOVERNMENT_INFO[currentGov].icon}</span>
                  <span className="text-cyan-100">{GOVERNMENT_INFO[currentGov].name}</span>
                </div>
                <span className="text-cyan-400">→</span>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{GOVERNMENT_INFO[selectedGov].icon}</span>
                  <span className="text-cyan-100">{GOVERNMENT_INFO[selectedGov].name}</span>
                </div>
              </div>

              <div className="rounded-lg bg-orange-500/10 border border-orange-500/30 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-400 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1 text-sm text-orange-300">
                    <p className="font-semibold">Transition Costs:</p>
                    <ul className="space-y-0.5 text-xs">
                      <li>• Stability: -{BASE_STABILITY_COST}%</li>
                      <li>• Cooldown: {TRANSITION_COOLDOWN} turns</li>
                      <li>• Transition time: 1 turn</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              className="border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmChange}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              Confirm Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
