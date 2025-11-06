/**
 * War Support & Stability Dashboard
 *
 * UI for managing public opinion, stability, and national morale.
 */

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  WarSupportState,
  WarSupportAction,
  StabilityEffects,
  WarSupportEffects,
  NationalCrisis,
  WarSupportModifier,
  StabilityModifier,
} from '@/types/warSupport';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Users, Shield } from 'lucide-react';

interface WarSupportDashboardProps {
  warSupportState: WarSupportState;
  availableActions: WarSupportAction[];
  warSupportEffects: WarSupportEffects;
  stabilityEffects: StabilityEffects;
  activeCrises: NationalCrisis[];
  currentPP: number;
  onExecuteAction: (actionId: string) => void;
  onResolveCrisis: (crisisId: string) => void;
}

export function WarSupportDashboard({
  warSupportState,
  availableActions,
  warSupportEffects,
  stabilityEffects,
  activeCrises,
  currentPP,
  onExecuteAction,
  onResolveCrisis,
}: WarSupportDashboardProps) {
  type ActiveModifier = (WarSupportModifier | StabilityModifier) & {
    scope: 'War Support' | 'Stability';
  };

  const warSupportColor = useMemo(() => {
    if (warSupportState.warSupport >= 80) return 'green';
    if (warSupportState.warSupport >= 60) return 'cyan';
    if (warSupportState.warSupport >= 40) return 'yellow';
    if (warSupportState.warSupport >= 20) return 'orange';
    return 'red';
  }, [warSupportState.warSupport]);

  const stabilityColor = useMemo(() => {
    if (warSupportState.stability >= 80) return 'green';
    if (warSupportState.stability >= 60) return 'cyan';
    if (warSupportState.stability >= 40) return 'yellow';
    if (warSupportState.stability >= 20) return 'orange';
    return 'red';
  }, [warSupportState.stability]);

  const activeModifiers = useMemo(() => {
    const warSupport: ActiveModifier[] = warSupportState.warSupportModifiers.map((modifier) => ({
      ...modifier,
      scope: 'War Support' as const,
    }));

    const stability: ActiveModifier[] = warSupportState.stabilityModifiers.map((modifier) => ({
      ...modifier,
      scope: 'Stability' as const,
    }));

    return [...warSupport, ...stability].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
  }, [warSupportState.stabilityModifiers, warSupportState.warSupportModifiers]);

  const getTrendIcon = (trend: 'increasing' | 'stable' | 'decreasing') => {
    if (trend === 'increasing') return <TrendingUp className="h-4 w-4 text-green-400" />;
    if (trend === 'decreasing') return <TrendingDown className="h-4 w-4 text-red-400" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  return (
    <div className="grid gap-6">
      {/* Overview */}
      <section className="rounded border border-cyan-500/40 bg-black/50 p-4 shadow-lg shadow-cyan-500/10">
        <div className="mb-4 grid grid-cols-2 gap-4">
          {/* War Support */}
          <div className="rounded border border-cyan-500/20 bg-black/40 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-cyan-400" />
                <p className="text-xs font-mono uppercase tracking-[0.35em] text-cyan-400">War Support</p>
              </div>
              {getTrendIcon(warSupportState.warSupportTrend)}
            </div>
            <h3 className={`text-3xl font-semibold text-${warSupportColor}-300 mb-1`}>
              {Math.round(warSupportState.warSupport)}%
            </h3>
            <p className="text-xs text-cyan-400/80">{warSupportState.warSupportLevel.toUpperCase()}</p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-700">
              <div
                className={`h-full transition-all bg-${warSupportColor}-500`}
                style={{ width: `${warSupportState.warSupport}%` }}
              />
            </div>
            {warSupportState.warSupportChangePerTurn !== 0 && (
              <p className={`mt-2 text-xs ${warSupportState.warSupportChangePerTurn > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {warSupportState.warSupportChangePerTurn > 0 ? '+' : ''}
                {warSupportState.warSupportChangePerTurn.toFixed(1)} per turn
              </p>
            )}
          </div>

          {/* Stability */}
          <div className="rounded border border-cyan-500/20 bg-black/40 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-cyan-400" />
                <p className="text-xs font-mono uppercase tracking-[0.35em] text-cyan-400">Stability</p>
              </div>
              {getTrendIcon(warSupportState.stabilityTrend)}
            </div>
            <h3 className={`text-3xl font-semibold text-${stabilityColor}-300 mb-1`}>
              {Math.round(warSupportState.stability)}%
            </h3>
            <p className="text-xs text-cyan-400/80">{warSupportState.stabilityLevel.toUpperCase()}</p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-700">
              <div
                className={`h-full transition-all bg-${stabilityColor}-500`}
                style={{ width: `${warSupportState.stability}%` }}
              />
            </div>
            {warSupportState.stabilityChangePerTurn !== 0 && (
              <p className={`mt-2 text-xs ${warSupportState.stabilityChangePerTurn > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {warSupportState.stabilityChangePerTurn > 0 ? '+' : ''}
                {warSupportState.stabilityChangePerTurn.toFixed(1)} per turn
              </p>
            )}
          </div>
        </div>

        {/* Crisis Warning */}
        {activeCrises.length > 0 && (
          <div className="rounded-lg border-2 border-red-500/50 bg-red-500/10 p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <p className="text-sm font-mono uppercase tracking-widest text-red-300">
                {activeCrises.length} Active {activeCrises.length === 1 ? 'Crisis' : 'Crises'}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Effects */}
      <section className="rounded border border-cyan-500/40 bg-black/50 p-4 shadow-lg shadow-cyan-500/10">
        <h3 className="mb-4 text-lg font-semibold tracking-wide text-cyan-300">Current Effects</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {/* War Support Effects */}
          <div className="rounded border border-cyan-500/20 bg-black/40 p-3">
            <p className="mb-3 text-xs font-mono uppercase tracking-widest text-cyan-400">War Support Effects</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-cyan-400">Recruitment Speed:</span>
                <span className={warSupportEffects.recruitmentSpeed >= 1 ? 'text-green-300' : 'text-red-300'}>
                  {(warSupportEffects.recruitmentSpeed * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyan-400">Division Recovery:</span>
                <span className={warSupportEffects.divisionRecovery >= 1 ? 'text-green-300' : 'text-red-300'}>
                  {(warSupportEffects.divisionRecovery * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyan-400">Surrender Limit:</span>
                <span className="text-cyan-200">{warSupportEffects.surrenderLimit.toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyan-400">War Goal Cost:</span>
                <span className={warSupportEffects.warGoalCost <= 1 ? 'text-green-300' : 'text-red-300'}>
                  {(warSupportEffects.warGoalCost * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyan-400">Conscription Law:</span>
                <span className="text-cyan-200">{warSupportEffects.conscriptionLaw}</span>
              </div>
            </div>
          </div>

          {/* Stability Effects */}
          <div className="rounded border border-cyan-500/20 bg-black/40 p-3">
            <p className="mb-3 text-xs font-mono uppercase tracking-widest text-cyan-400">Stability Effects</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-cyan-400">Production Efficiency:</span>
                <span className={stabilityEffects.productionEfficiency >= 1 ? 'text-green-300' : 'text-red-300'}>
                  {(stabilityEffects.productionEfficiency * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyan-400">Factory Output:</span>
                <span className={stabilityEffects.factoryOutput >= 1 ? 'text-green-300' : 'text-red-300'}>
                  {(stabilityEffects.factoryOutput * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyan-400">Political Power Gain:</span>
                <span className={stabilityEffects.politicalPowerGain >= 1 ? 'text-green-300' : 'text-red-300'}>
                  {(stabilityEffects.politicalPowerGain * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyan-400">Focus Speed:</span>
                <span className={stabilityEffects.focusCompletionSpeed >= 1 ? 'text-green-300' : 'text-red-300'}>
                  {(stabilityEffects.focusCompletionSpeed * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-cyan-400">Crisis Risk:</span>
                {stabilityEffects.riskOfCoup || stabilityEffects.riskOfCivilWar ? (
                  <span className="flex items-center gap-1 text-red-300">
                    <AlertTriangle className="h-3 w-3" />
                    HIGH
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-green-300">
                    <CheckCircle className="h-3 w-3" />
                    LOW
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Active Crises */}
      {activeCrises.length > 0 && (
        <section className="rounded border border-red-500/40 bg-black/50 p-4 shadow-lg shadow-red-500/10">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold tracking-wide text-red-300">
            <AlertTriangle className="h-5 w-5" />
            National Crises
          </h3>
          <div className="grid gap-3">
            {activeCrises.map((crisis) => (
              <div
                key={crisis.id}
                className="rounded border border-red-500/30 bg-red-500/10 p-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-red-200">{crisis.type.toUpperCase().replace('_', ' ')}</h4>
                    <p className="text-xs text-red-400/80">
                      Triggered by: {crisis.trigger.replace('_', ' ')}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-red-500/30 text-red-200">
                    Turn {crisis.turn}
                  </span>
                </div>
                <div className="mt-3 space-y-1 text-xs text-red-300">
                  {crisis.effects.leaderChange && <p>• Leader may be overthrown</p>}
                  {crisis.effects.ideologyChange && <p>• Ideology may change</p>}
                  {crisis.effects.territoryLoss && <p>• Risk of losing {crisis.effects.territoryLoss}% of territories</p>}
                  {crisis.effects.productionLoss && <p>• Production reduced by {crisis.effects.productionLoss}%</p>}
                  {crisis.effects.allianceBroken && <p>• Alliances may be broken</p>}
                </div>
                <Button
                  onClick={() => onResolveCrisis(crisis.id)}
                  size="sm"
                  className="mt-3 w-full bg-red-600 hover:bg-red-500"
                >
                  Attempt Resolution
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Available Actions */}
      <section className="rounded border border-cyan-500/40 bg-black/50 p-4 shadow-lg shadow-cyan-500/10">
        <h3 className="mb-4 text-lg font-semibold tracking-wide text-cyan-300">
          Available Actions ({availableActions.length})
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          {availableActions.slice(0, 8).map((action) => {
            const canAfford = currentPP >= action.ppCost;
            const categoryColor = {
              propaganda: 'purple',
              policy: 'blue',
              economic: 'green',
              military: 'red',
            }[action.category];

            return (
              <div
                key={action.id}
                className={`rounded border p-3 ${
                  canAfford
                    ? 'border-cyan-500/30 bg-black/60 hover:border-cyan-300/60'
                    : 'border-gray-500/20 bg-black/30 opacity-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-cyan-200">{action.name}</h4>
                    <p className="text-xs text-cyan-400/80 mt-1">{action.description}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded bg-${categoryColor}-500/20 text-${categoryColor}-300`}>
                    {action.category}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-cyan-400">Cost:</span>
                    <span className="ml-1 text-cyan-200">{action.ppCost} PP</span>
                  </div>
                  <div>
                    <span className="text-cyan-400">Duration:</span>
                    <span className="ml-1 text-cyan-200">
                      {action.duration === -1 ? 'Permanent' : `${action.duration} turns`}
                    </span>
                  </div>
                  {action.warSupportChange !== 0 && (
                    <div>
                      <span className="text-cyan-400">War Support:</span>
                      <span className={`ml-1 ${action.warSupportChange > 0 ? 'text-green-300' : 'text-red-300'}`}>
                        {action.warSupportChange > 0 ? '+' : ''}
                        {action.warSupportChange}
                      </span>
                    </div>
                  )}
                  {action.stabilityChange !== 0 && (
                    <div>
                      <span className="text-cyan-400">Stability:</span>
                      <span className={`ml-1 ${action.stabilityChange > 0 ? 'text-green-300' : 'text-red-300'}`}>
                        {action.stabilityChange > 0 ? '+' : ''}
                        {action.stabilityChange}
                      </span>
                    </div>
                  )}
                </div>
                <Button
                  onClick={() => onExecuteAction(action.id)}
                  disabled={!canAfford}
                  size="sm"
                  className="mt-3 w-full bg-cyan-600 hover:bg-cyan-500"
                >
                  Execute ({action.ppCost} PP)
                </Button>
              </div>
            );
          })}
        </div>
        {availableActions.length > 8 && (
          <p className="mt-3 text-center text-xs text-cyan-400/60">
            Showing 8 of {availableActions.length} actions
          </p>
        )}
      </section>

      {/* Active Modifiers */}
      {activeModifiers.length > 0 && (
        <section className="rounded border border-cyan-500/40 bg-black/50 p-4 shadow-lg shadow-cyan-500/10">
          <h3 className="mb-4 text-lg font-semibold tracking-wide text-cyan-300">Active Modifiers</h3>
          <div className="grid gap-2">
            {activeModifiers.slice(0, 5).map((modifier) => (
              <div
                key={modifier.id}
                className="flex items-center justify-between rounded border border-cyan-500/20 bg-black/40 p-2 text-xs"
              >
                <div>
                  <span className="font-semibold text-cyan-200">{modifier.name}</span>
                  <span className="ml-2 text-cyan-400/60">{modifier.description}</span>
                  <span className="ml-3 rounded bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-300">
                    {modifier.scope}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={modifier.amount > 0 ? 'text-green-300' : 'text-red-300'}>
                    {modifier.amount > 0 ? '+' : ''}
                    {modifier.amount}
                  </span>
                  <span className="text-cyan-400/60">
                    {modifier.duration === -1 ? '∞' : `${modifier.duration}t`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
