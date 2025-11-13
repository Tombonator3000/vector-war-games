import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Shield } from 'lucide-react';
import type { GovernanceMetrics } from '@/hooks/useGovernance';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getLeaderImage } from '@/lib/leaderImages';
import { cn } from '@/lib/utils';

interface PoliticalStatusWidgetProps {
  metrics: GovernanceMetrics;
  nationName: string;
  instability: number;
  onOpenDetails?: () => void;
  onOpenPolicyPanel?: () => void;
  onOpenNationalFocus?: () => void;
  leaderName?: string;
  onOpenLeaderOverview?: () => void;
  showLeaderButton?: boolean;
}

export function PoliticalStatusWidget({
  metrics,
  nationName,
  instability,
  onOpenDetails,
  onOpenPolicyPanel,
  onOpenNationalFocus,
  leaderName,
  onOpenLeaderOverview,
  showLeaderButton = true,
}: PoliticalStatusWidgetProps) {
  const stabilityLevel = getStabilityLevel(metrics.morale, metrics.publicOpinion, instability);
  const stabilityColor = getStabilityColor(stabilityLevel);
  const stabilityIcon = getStabilityIcon(stabilityLevel);

  const crisisReasons = getCrisisReasons(metrics.morale, metrics.publicOpinion, instability);
  const recoveryActions = getRecoveryActions(metrics.morale, metrics.publicOpinion, metrics.cabinetApproval);

  const leaderImage = leaderName ? getLeaderImage(leaderName) : undefined;
  const leaderInitials = leaderName ? getInitials(leaderName) : '?';
  const shouldRenderLeaderButton = showLeaderButton && leaderName && onOpenLeaderOverview;

  return (
    <Card className="bg-slate-950/90 border-cyan-500/30 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {stabilityIcon}
          <h3 className="text-sm font-semibold text-cyan-300">{nationName} Political Status</h3>
        </div>
        <div className="flex items-center gap-2">
          {shouldRenderLeaderButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenLeaderOverview}
              className="h-9 w-9 rounded-full border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors"
              aria-label={`View ${leaderName} profile`}
            >
              <Avatar className={cn('h-8 w-8 border border-cyan-400/40 shadow-inner', leaderImage ? 'bg-slate-900' : 'bg-cyan-500/20')}>
                {leaderImage ? (
                  <AvatarImage src={leaderImage} alt={leaderName} className="object-cover" />
                ) : null}
                <AvatarFallback className="text-[0.6rem] uppercase tracking-wide text-cyan-100 bg-cyan-500/20">
                  {leaderInitials}
                </AvatarFallback>
              </Avatar>
            </Button>
          )}
          <Badge
            variant="outline"
            className={`${stabilityColor} border-current`}
          >
            {stabilityLevel}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <MetricDisplay
          label="Morale"
          value={metrics.morale}
          previousValue={metrics.morale}
        />
        <MetricDisplay
          label="Public Opinion"
          value={metrics.publicOpinion}
          previousValue={metrics.publicOpinion}
        />
        <MetricDisplay
          label="Cabinet Approval"
          value={metrics.cabinetApproval}
          previousValue={metrics.cabinetApproval}
        />
        <div className="flex flex-col">
          <span className="text-cyan-400/70">Next Election</span>
          <span className="text-cyan-100 font-mono font-semibold">
            {metrics.electionTimer} turns
          </span>
        </div>
      </div>

      {(onOpenDetails || onOpenNationalFocus) && (
        <div className="mt-2 grid gap-2">
          {onOpenDetails && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-cyan-300 hover:bg-cyan-500/10"
              onClick={onOpenDetails}
            >
              View Details
            </Button>
          )}
          {onOpenNationalFocus && (
            <Button
              variant="outline"
              size="sm"
              className="w-full border-cyan-500/60 text-cyan-200 hover:bg-cyan-500/20"
              onClick={onOpenNationalFocus}
            >
              Open National Focus
            </Button>
          )}
        </div>
      )}

      {stabilityLevel === 'CRISIS' && (
        <div className="mt-2 space-y-2">
          <div className="p-2 bg-red-900/20 border border-red-500/30 rounded text-xs text-red-300">
            <div className="flex items-start gap-1 mb-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 animate-pulse" />
              <div>
                <div className="font-bold mb-1">CRITICAL POLITICAL CRISIS!</div>
                <div className="text-red-200 mb-2">{crisisReasons}</div>
                {(metrics.publicOpinion < 20 || metrics.morale < 15) && (
                  <div className="font-bold text-red-100 mb-1 animate-pulse">
                    ⚠️ GAME OVER IMMINENT! Act now!
                  </div>
                )}
              </div>
            </div>
            <div className="border-t border-red-500/20 pt-2 mt-2">
              <div className="font-semibold mb-1 text-red-200">Recovery Actions:</div>
              <ul className="list-disc list-inside space-y-0.5 text-red-300 mb-2">
                {recoveryActions.map((action, i) => (
                  <li key={i}>{action}</li>
                ))}
              </ul>
              {(onOpenPolicyPanel || onOpenNationalFocus) && (
                <div className="grid gap-2">
                  {onOpenPolicyPanel && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-red-300 border-red-500/50 hover:bg-red-500/20 text-xs"
                      onClick={onOpenPolicyPanel}
                    >
                      Open Policy Panel to Enact Reforms
                    </Button>
                  )}
                  {onOpenNationalFocus && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-cyan-500/60 text-cyan-200 hover:bg-cyan-500/20"
                      onClick={onOpenNationalFocus}
                    >
                      Review National Focus Options
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

interface MetricDisplayProps {
  label: string;
  value: number;
  previousValue: number;
}

function MetricDisplay({ label, value, previousValue }: MetricDisplayProps) {
  const trend = value > previousValue ? 'up' : value < previousValue ? 'down' : 'stable';
  const trendIcon = getTrendIcon(trend);
  const color = getMetricColor(value);

  return (
    <div className="flex flex-col">
      <span className="text-cyan-400/70">{label}</span>
      <div className="flex items-center gap-1">
        <span className={`font-mono font-semibold ${color}`}>
          {Math.round(value)}%
        </span>
        {trendIcon}
      </div>
    </div>
  );
}

function getStabilityLevel(morale: number, publicOpinion: number, instability: number): string {
  const isCrisis = morale < 30 || publicOpinion < 30 || instability > 75;
  const isUnstable = morale < 50 || publicOpinion < 45 || instability > 55;

  if (isCrisis) return 'CRISIS';
  if (isUnstable) return 'UNSTABLE';
  return 'STABLE';
}

function getStabilityColor(level: string): string {
  switch (level) {
    case 'STABLE': return 'text-emerald-400';
    case 'UNSTABLE': return 'text-yellow-400';
    case 'CRISIS': return 'text-red-400';
    default: return 'text-cyan-400';
  }
}

function getStabilityIcon(level: string) {
  const className = "h-4 w-4";
  switch (level) {
    case 'STABLE':
      return <Shield className={`${className} text-emerald-400`} />;
    case 'UNSTABLE':
      return <AlertTriangle className={`${className} text-yellow-400`} />;
    case 'CRISIS':
      return <AlertTriangle className={`${className} text-red-400 animate-pulse`} />;
    default:
      return <Shield className={`${className} text-cyan-400`} />;
  }
}

function getTrendIcon(trend: 'up' | 'down' | 'stable') {
  const className = "h-3 w-3";
  switch (trend) {
    case 'up':
      return <TrendingUp className={`${className} text-emerald-400`} />;
    case 'down':
      return <TrendingDown className={`${className} text-red-400`} />;
    case 'stable':
      return <Minus className={`${className} text-cyan-400`} />;
  }
}

function getMetricColor(value: number): string {
  if (value >= 70) return 'text-emerald-300';
  if (value >= 50) return 'text-cyan-100';
  if (value >= 30) return 'text-yellow-300';
  return 'text-red-300';
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
}

function getCrisisReasons(morale: number, publicOpinion: number, instability: number): string {
  const reasons: string[] = [];

  if (publicOpinion < 30) {
    if (publicOpinion < 20) {
      reasons.push(`Public Opinion critically low (${Math.round(publicOpinion)}%)`);
    } else {
      reasons.push(`Public Opinion very low (${Math.round(publicOpinion)}%)`);
    }
  }

  if (morale < 30) {
    if (morale < 15) {
      reasons.push(`Morale critically low (${Math.round(morale)}%)`);
    } else {
      reasons.push(`Morale very low (${Math.round(morale)}%)`);
    }
  }

  if (instability > 75) {
    reasons.push(`Instability extremely high (${Math.round(instability)}%)`);
  }

  if (reasons.length === 0) {
    return 'Multiple factors creating instability';
  }

  return reasons.join(', ');
}

function getRecoveryActions(morale: number, publicOpinion: number, cabinetApproval: number): string[] {
  const actions: string[] = [];

  // Most critical issue first
  if (publicOpinion < 25) {
    actions.push('Enact Welfare State policy (+2 opinion/turn)');
    actions.push('Enact Propaganda Ministry (+2 opinion/turn)');
    actions.push('Wait for Mass Uprising event and negotiate with opposition');
  } else if (publicOpinion < 35) {
    actions.push('Enact Free Press or Welfare State policies');
    actions.push('Handle political events carefully');
  }

  if (morale < 25) {
    actions.push('Enact Welfare State (+3 morale/turn)');
    actions.push('Launch Cultural Resilience program (event option)');
  } else if (morale < 35) {
    actions.push('Consider Peace Dividend or Massive Stimulus policies');
  }

  if (cabinetApproval < 35) {
    actions.push('Purge corrupt cabinet members (event option)');
    actions.push('Enact Free Press policy (+2 approval/turn)');
  }

  // General advice
  if (actions.length === 0) {
    actions.push('Reduce instability through policy reforms');
    actions.push('Wait for political events and choose carefully');
  }

  // Always include reminder about events
  if (publicOpinion < 35 || morale < 35) {
    actions.push('Political events will trigger - choose wisely!');
  }

  return actions;
}
