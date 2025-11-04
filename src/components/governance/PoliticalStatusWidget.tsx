import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Shield } from 'lucide-react';
import type { GovernanceMetrics } from '@/hooks/useGovernance';
import { Button } from '@/components/ui/button';

interface PoliticalStatusWidgetProps {
  metrics: GovernanceMetrics;
  nationName: string;
  instability: number;
  onOpenDetails?: () => void;
}

export function PoliticalStatusWidget({ 
  metrics, 
  nationName, 
  instability,
  onOpenDetails 
}: PoliticalStatusWidgetProps) {
  const stabilityLevel = getStabilityLevel(metrics.morale, metrics.publicOpinion, instability);
  const stabilityColor = getStabilityColor(stabilityLevel);
  const stabilityIcon = getStabilityIcon(stabilityLevel);

  return (
    <Card className="bg-slate-950/90 border-cyan-500/30 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {stabilityIcon}
          <h3 className="text-sm font-semibold text-cyan-300">{nationName} Political Status</h3>
        </div>
        <Badge 
          variant="outline" 
          className={`${stabilityColor} border-current`}
        >
          {stabilityLevel}
        </Badge>
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

      {onOpenDetails && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full mt-2 text-cyan-300 hover:bg-cyan-500/10"
          onClick={onOpenDetails}
        >
          View Details
        </Button>
      )}

      {stabilityLevel === 'CRISIS' && (
        <div className="mt-2 p-2 bg-red-900/20 border border-red-500/30 rounded text-xs text-red-300">
          <AlertTriangle className="inline h-3 w-3 mr-1" />
          Critical instability! Regime change imminent!
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
