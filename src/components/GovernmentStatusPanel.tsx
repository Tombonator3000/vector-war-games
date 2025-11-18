import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Shield, TrendingUp, Users, Zap } from 'lucide-react';
import type { GovernmentState, GovernmentBonuses } from '@/types/government';
import { GOVERNMENT_INFO, GOVERNMENT_BONUSES } from '@/types/government';
import { cn } from '@/lib/utils';

interface GovernmentStatusPanelProps {
  governmentState: GovernmentState;
  nationName: string;
  className?: string;
}

export function GovernmentStatusPanel({
  governmentState,
  nationName,
  className,
}: GovernmentStatusPanelProps) {
  const govInfo = GOVERNMENT_INFO[governmentState.currentGovernment];
  const bonuses = GOVERNMENT_BONUSES[governmentState.currentGovernment];

  // Determine status colors based on values
  const getStabilityColor = (value: number) => {
    if (value >= 70) return 'text-green-400';
    if (value >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getCoupRiskColor = (value: number) => {
    if (value <= 30) return 'text-green-400';
    if (value <= 60) return 'text-yellow-400';
    return 'text-red-400';
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

  // Get key bonuses to highlight
  const keyBonuses = [
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
      label: 'Opposition',
      value: `${Math.round(bonuses.oppositionSuppressionMultiplier * 100)}%`,
      positive: bonuses.oppositionSuppressionMultiplier < 1,
      tooltip: 'Opposition activity level',
    },
  ];

  return (
    <Card className={cn('bg-slate-950/95 border-cyan-500/40', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{govInfo.icon}</span>
            <div>
              <CardTitle className="text-cyan-100">{govInfo.name}</CardTitle>
              <CardDescription className="text-cyan-300/70">
                Government of {nationName}
              </CardDescription>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              'border-cyan-500/40 text-cyan-100',
              governmentState.cameByForce && 'border-red-500/40 text-red-300'
            )}
          >
            {governmentState.cameByForce ? 'By Force' : 'Legitimate'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Government Description */}
        <p className="text-sm text-cyan-300/80">{govInfo.description}</p>

        <Separator className="bg-cyan-500/20" />

        {/* Key Metrics */}
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-cyan-300/90">Government Stability</span>
              <span className={cn('font-semibold', getStabilityColor(governmentState.governmentStability))}>
                {Math.round(governmentState.governmentStability)}%
              </span>
            </div>
            <Progress
              value={governmentState.governmentStability}
              className="h-2 bg-slate-800"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-cyan-300/90">Legitimacy</span>
              <span className={cn('font-semibold', getStabilityColor(governmentState.legitimacy))}>
                {Math.round(governmentState.legitimacy)}%
              </span>
            </div>
            <Progress
              value={governmentState.legitimacy}
              className="h-2 bg-slate-800"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-orange-400" />
                <span className="text-cyan-300/90">Coup Risk</span>
              </div>
              <span className={cn('font-semibold', getCoupRiskColor(governmentState.coupRisk))}>
                {Math.round(governmentState.coupRisk)}%
              </span>
            </div>
            <Progress
              value={governmentState.coupRisk}
              className="h-2 bg-slate-800"
            />
          </div>

          {governmentState.turnsInPower > 0 && (
            <div className="flex items-center justify-between text-sm pt-1">
              <span className="text-cyan-300/70">Time in Power</span>
              <span className="text-cyan-100 font-medium">
                {governmentState.turnsInPower} turns
              </span>
            </div>
          )}
        </div>

        <Separator className="bg-cyan-500/20" />

        {/* Key Bonuses */}
        <div>
          <h4 className="text-sm font-semibold text-cyan-100 mb-3">Government Bonuses</h4>
          <div className="grid grid-cols-2 gap-3">
            {keyBonuses.map((bonus, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-lg bg-slate-900/50 p-2.5 border border-cyan-500/20"
              >
                <bonus.icon className="h-4 w-4 text-cyan-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-cyan-300/70">{bonus.label}</p>
                  <p
                    className={cn(
                      'text-sm font-semibold',
                      bonus.positive ? 'text-green-400' : 'text-red-400'
                    )}
                  >
                    {bonus.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Election Info */}
        {bonuses.electionFrequencyModifier > 0 && (
          <>
            <Separator className="bg-cyan-500/20" />
            <div className="rounded-lg bg-cyan-500/10 border border-cyan-500/30 p-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-cyan-400" />
                <p className="text-sm text-cyan-100">{govInfo.electionInfo}</p>
              </div>
            </div>
          </>
        )}

        {/* Strengths and Weaknesses */}
        <Separator className="bg-cyan-500/20" />

        <div className="space-y-3">
          <div>
            <h5 className="text-xs font-semibold text-green-400 mb-2">Strengths</h5>
            <ul className="space-y-1">
              {govInfo.strengths.map((strength, index) => (
                <li key={index} className="text-xs text-cyan-300/80 flex items-start gap-1.5">
                  <span className="text-green-400 mt-0.5">+</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-semibold text-red-400 mb-2">Weaknesses</h5>
            <ul className="space-y-1">
              {govInfo.weaknesses.map((weakness, index) => (
                <li key={index} className="text-xs text-cyan-300/80 flex items-start gap-1.5">
                  <span className="text-red-400 mt-0.5">-</span>
                  <span>{weakness}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
