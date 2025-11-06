import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LeaderAbilityPanel } from '@/components/LeaderAbilityPanel';
import { getLeaderBiography } from '@/data/leaderBiographies';
import type { LeaderAbilityState } from '@/types/leaderAbilities';
import type { Nation } from '@/types/game';
import { getLeaderImage } from '@/lib/leaderImages';
import { cn } from '@/lib/utils';
import type { StrategicOutlinerGroup } from '@/components/StrategicOutliner';
import { StrategicOutliner } from '@/components/StrategicOutliner';
import type { GovernanceMetrics } from '@/hooks/useGovernance';
import { PoliticalStatusWidget } from '@/components/governance/PoliticalStatusWidget';

interface LeaderOverviewPanelProps {
  nation: Nation;
  abilityState: LeaderAbilityState;
  allNations: Nation[];
  currentTurn: number;
  onUseAbility: (targetId?: string) => void;
  governanceMetrics: GovernanceMetrics;
  instability: number;
  onOpenGovernanceDetails?: () => void;
  onOpenPolicyPanel?: () => void;
  strategicOutlinerGroups: StrategicOutlinerGroup[];
  isOutlinerCollapsed?: boolean;
  onOutlinerToggle: () => void;
  strategicOutlinerHotkeys?: {
    toggle?: string;
    focus?: string;
  };
  outlinerAttentionTick?: number;
  strategicOutlinerRef?: React.Ref<HTMLDivElement>;
  className?: string;
}

export function LeaderOverviewPanel({
  nation,
  abilityState,
  allNations,
  currentTurn,
  onUseAbility,
  governanceMetrics,
  instability,
  onOpenGovernanceDetails,
  onOpenPolicyPanel,
  strategicOutlinerGroups,
  isOutlinerCollapsed = false,
  onOutlinerToggle,
  strategicOutlinerHotkeys,
  outlinerAttentionTick,
  strategicOutlinerRef,
  className,
}: LeaderOverviewPanelProps) {
  const leaderName = nation.leaderName || nation.leader;
  const biography = leaderName ? getLeaderBiography(leaderName) : null;
  const portraitUrl = leaderName ? getLeaderImage(leaderName) : undefined;

  return (
    <div
      className={cn(
        'w-full rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-slate-950/95 to-slate-900/95 text-cyan-100 shadow-2xl',
        'p-6',
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-6 border-b border-cyan-500/20 pb-6">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar className="h-16 w-16 border border-cyan-500/40 shadow-lg bg-slate-900">
            {portraitUrl ? (
              <AvatarImage src={portraitUrl} alt={leaderName ?? 'Leader portrait'} className="object-cover" />
            ) : null}
            <AvatarFallback className="bg-cyan-500/20 text-cyan-100 font-semibold uppercase text-lg">
              {leaderName ? getInitials(leaderName) : '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="text-2xl font-bold text-cyan-300 leading-tight truncate">
              {leaderName ?? 'Unknown Leader'}
            </h2>
            <span className="text-sm font-medium text-cyan-200/70 truncate">{nation.name}</span>
            <span className="text-xs text-cyan-200/60">
              Review strategic doctrine, leadership capabilities, and governance posture.
            </span>
          </div>
        </div>

        <div className="grid gap-3 text-xs sm:grid-cols-2">
          <div className="rounded border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-cyan-200">
            <div className="text-[10px] uppercase tracking-[0.35em] text-cyan-200/70">Current Turn</div>
            <div className="text-lg font-semibold text-cyan-100">{currentTurn}</div>
          </div>
          <div className="rounded border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-cyan-200">
            <div className="text-[10px] uppercase tracking-[0.35em] text-cyan-200/70">Instability</div>
            <div className="text-lg font-semibold text-cyan-100">{Math.round(instability)}%</div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <ScrollArea className="max-h-[60vh] pr-4">
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

        <div className="flex flex-col gap-4">
          <PoliticalStatusWidget
            metrics={governanceMetrics}
            nationName={nation.name}
            instability={instability}
            onOpenDetails={onOpenGovernanceDetails}
            onOpenPolicyPanel={onOpenPolicyPanel}
            leaderName={leaderName}
            showLeaderButton={false}
          />

          <LeaderAbilityPanel
            nation={nation}
            abilityState={abilityState}
            allNations={allNations}
            currentTurn={currentTurn}
            onUseAbility={onUseAbility}
            className="bg-slate-900/80 border-cyan-500/30 shadow-lg"
          />

          <StrategicOutliner
            ref={strategicOutlinerRef}
            groups={strategicOutlinerGroups}
            collapsed={isOutlinerCollapsed}
            onToggleCollapse={onOutlinerToggle}
            hotkeys={strategicOutlinerHotkeys}
            attentionPulse={outlinerAttentionTick}
            className="bg-slate-950/85"
          />
        </div>
      </div>
    </div>
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
