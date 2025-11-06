/**
 * Leader Profile Dialog
 *
 * Combines leader biography details with the leader ability panel
 * in a single dialog for quick reference from the governance HUD.
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LeaderAbilityPanel } from '@/components/LeaderAbilityPanel';
import { getLeaderBiography } from '@/data/leaderBiographies';
import type { LeaderAbilityState } from '@/types/leaderAbilities';
import type { Nation } from '@/types/game';
import { getLeaderImage } from '@/lib/leaderImages';

interface LeaderProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nation?: Nation;
  abilityState?: LeaderAbilityState;
  allNations: Nation[];
  currentTurn: number;
  onUseAbility: (targetId?: string) => void;
}

export function LeaderProfileDialog({
  open,
  onOpenChange,
  nation,
  abilityState,
  allNations,
  currentTurn,
  onUseAbility,
}: LeaderProfileDialogProps) {
  const leaderName = nation?.leaderName || nation?.leader;
  const biography = leaderName ? getLeaderBiography(leaderName) : null;
  const portraitUrl = leaderName ? getLeaderImage(leaderName) : undefined;

  if (!nation || !abilityState) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl border border-cyan-500/40 bg-gradient-to-br from-slate-950/95 to-slate-900/95 text-cyan-100">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl font-bold text-cyan-300 flex items-center gap-3">
            <Avatar className="h-12 w-12 border border-cyan-500/40 shadow-md bg-slate-900">
              {portraitUrl ? (
                <AvatarImage src={portraitUrl} alt={leaderName ?? 'Leader portrait'} className="object-cover" />
              ) : null}
              <AvatarFallback className="bg-cyan-500/20 text-cyan-100 font-semibold uppercase">
                {leaderName ? getInitials(leaderName) : '?' }
              </AvatarFallback>
            </Avatar>
            <span className="flex flex-col">
              <span>{leaderName ?? 'Unknown Leader'}</span>
              <span className="text-xs font-medium text-cyan-200/70">{nation.name}</span>
            </span>
          </DialogTitle>
          <DialogDescription className="text-sm text-cyan-200/70">
            Review your leader's biography, strategic doctrine, and signature ability.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
          <ScrollArea className="max-h-[60vh] pr-2">
            <div className="space-y-4">
              {biography ? (
                <>
                  <div className="space-y-2">
                    <h3 className="text-base font-semibold text-cyan-200">{biography.title}</h3>
                    <p className="text-sm leading-relaxed text-cyan-100/80 whitespace-pre-line">
                      {biography.biography}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="outline" className="border-cyan-500/40 text-cyan-200">
                      Playstyle: {capitalize(biography.playstyle)}
                    </Badge>
                    <Badge variant="outline" className="border-cyan-500/40 text-cyan-200">
                      Difficulty: {capitalize(biography.difficulty)}
                    </Badge>
                    {biography.recommendedDoctrine && (
                      <Badge variant="outline" className="border-cyan-500/40 text-cyan-200">
                        Doctrine: {biography.recommendedDoctrine}
                      </Badge>
                    )}
                  </div>

                  {biography.strategyTips.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-cyan-200 mb-2">Strategy Tips</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-cyan-100/80">
                        {biography.strategyTips.map((tip, index) => (
                          <li key={index}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-cyan-200/70">
                  No biography data available for this leader yet.
                </p>
              )}
            </div>
          </ScrollArea>

          <div className="space-y-3">
            <LeaderAbilityPanel
              nation={nation}
              abilityState={abilityState}
              allNations={allNations}
              currentTurn={currentTurn}
              onUseAbility={onUseAbility}
              className="bg-slate-900/80 border-cyan-500/30 shadow-lg"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
}

function capitalize<T extends string>(value: T): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
