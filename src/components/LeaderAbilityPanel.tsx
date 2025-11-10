/**
 * Leader Ability Panel Component - FASE 3.2
 *
 * Displays the player's leader ability and allows activation.
 * Shows cooldown, uses remaining, and requirements.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { Nation } from '@/types/game';
import type { LeaderAbilityState } from '@/types/leaderAbilities';
import { canUseAbility } from '@/types/leaderAbilities';
import { Zap, Clock, Target, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';

interface LeaderAbilityPanelProps {
  nation: Nation;
  abilityState: LeaderAbilityState;
  allNations: Nation[];
  currentTurn: number;
  onUseAbility: (targetId?: string) => void;
  className?: string;
}

/**
 * Leader Ability Panel Component
 */
export function LeaderAbilityPanel({
  nation,
  abilityState,
  allNations,
  currentTurn,
  onUseAbility,
  className,
}: LeaderAbilityPanelProps) {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedTargetId, setSelectedTargetId] = useState<string | undefined>(undefined);

  const { ability } = abilityState;
  const { canUse, reason } = canUseAbility(
    ability,
    nation,
    { nations: allNations, turn: currentTurn } as any,
    selectedTargetId,
  );
  const canActivate =
    canUse ||
    (ability.targetType === 'single-nation' && reason === 'Must select a target nation');

  // Get available targets
  const availableTargets = allNations.filter(n => n.id !== nation.id && !n.eliminated);

  // Handle use ability click
  const handleUseClick = () => {
    if (ability.targetType === 'single-nation') {
      setConfirmDialogOpen(true);
    } else {
      // No target needed, confirm directly
      setConfirmDialogOpen(true);
    }
  };

  // Confirm ability use
  const handleConfirmUse = () => {
    onUseAbility(selectedTargetId);
    setConfirmDialogOpen(false);
    setSelectedTargetId(undefined);
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'diplomatic':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/50';
      case 'military':
        return 'text-red-400 bg-red-500/20 border-red-500/50';
      case 'economic':
        return 'text-green-400 bg-green-500/20 border-green-500/50';
      case 'intelligence':
        return 'text-purple-400 bg-purple-500/20 border-purple-500/50';
      case 'special':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/50';
    }
  };

  // Get uses color
  const getUsesColor = () => {
    const percentage = (ability.usesRemaining / ability.maxUses) * 100;
    if (percentage > 50) return 'text-green-400';
    if (percentage > 0) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <>
      <Card className={cn('border-2', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-400" />
              Leader Ability
            </CardTitle>
            <Badge variant="outline" className={cn('text-xs', getCategoryColor(ability.category))}>
              {ability.category}
            </Badge>
          </div>
          <CardDescription className="text-base font-semibold flex items-center gap-2">
            <span className="text-2xl">{ability.icon}</span>
            {ability.name}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Description */}
          <p className="text-sm text-muted-foreground">{ability.description}</p>

          {/* Status */}
          <div className="space-y-2">
            {/* Uses Remaining */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-4 w-4" />
                Uses Remaining
              </span>
              <span className={cn('font-bold', getUsesColor())}>
                {ability.usesRemaining} / {ability.maxUses}
              </span>
            </div>
            <Progress
              value={(ability.usesRemaining / ability.maxUses) * 100}
              className="h-2"
            />

            {/* Cooldown */}
            {ability.currentCooldown > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Cooldown
                </span>
                <span className="font-medium text-orange-400">
                  {ability.currentCooldown} turns
                </span>
              </div>
            )}

            {/* Target Type */}
            {ability.targetType !== 'self' && ability.targetType !== 'global' && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  Target
                </span>
                <span className="font-medium">
                  {ability.targetType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </span>
              </div>
            )}
          </div>

          {/* Requirements */}
          {ability.requirements && ability.requirements.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Requirements:</p>
              {ability.requirements.map((req, i) => (
                <div key={i} className="text-xs text-muted-foreground pl-2">
                  • {req.description}
                </div>
              ))}
            </div>
          )}

          {/* Status Message */}
          {!canUse && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                {reason}
              </AlertDescription>
            </Alert>
          )}

          {canUse && ability.usesRemaining > 0 && (
            <Alert className="py-2 bg-green-500/10 border-green-500/50">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-xs text-green-400">
                Ready to use!
              </AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter>
          <Button
            onClick={handleUseClick}
            disabled={!canActivate}
            className="w-full"
            variant={canActivate ? 'default' : 'secondary'}
          >
            <Zap className="h-4 w-4 mr-2" />
            Activate Ability
          </Button>
        </CardFooter>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{ability.icon}</span>
              Activate {ability.name}?
            </DialogTitle>
            <DialogDescription>
              {ability.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Target Selection */}
            {ability.targetType === 'single-nation' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Target Nation:</label>
                <Select value={selectedTargetId} onValueChange={setSelectedTargetId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a target..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTargets.map(target => (
                      <SelectItem key={target.id} value={target.id}>
                        {target.name} ({target.leader})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Warning */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This ability has <strong>{ability.usesRemaining}</strong> use
                {ability.usesRemaining !== 1 ? 's' : ''} remaining
                {ability.cooldownTurns > 0 && (
                  <> and will have a <strong>{ability.cooldownTurns}-turn</strong> cooldown</>
                )}.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmUse}
              disabled={ability.targetType === 'single-nation' && !selectedTargetId}
            >
              <Zap className="h-4 w-4 mr-2" />
              Activate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
