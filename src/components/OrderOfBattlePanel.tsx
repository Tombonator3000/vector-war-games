import { memo, useMemo } from 'react';
import { AlertTriangle, MapPin, Shield, Swords, Waves } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  ArmyGroupPriority,
  ArmyGroupSummary,
  ArmyGroupPosture,
  FrontlineStatus,
  FrontlineSupplyState,
} from '@/types/militaryTemplates';

interface OrderOfBattlePanelProps {
  groups: ArmyGroupSummary[];
  className?: string;
}

type PanelStatus = 'normal' | 'warning' | 'critical';

const STATUS_BADGE: Record<PanelStatus, string> = {
  normal: 'bg-cyan-500/10 text-cyan-200 border-cyan-500/40',
  warning: 'bg-amber-500/10 text-amber-200 border-amber-400/60',
  critical: 'bg-red-600/15 text-red-200 border-red-500/70',
};

function readinessClass(value: number): string {
  if (value < 35) return 'bg-red-500/80';
  if (value < 60) return 'bg-amber-400/80';
  return 'bg-cyan-400/80';
}

function supplyClass(value: number): string {
  if (value < 35) return 'bg-red-500/80';
  if (value < 60) return 'bg-amber-400/80';
  return 'bg-emerald-400/80';
}

function formatPosture(posture: ArmyGroupPosture): string {
  switch (posture) {
    case 'offensive':
      return 'Offensiv';
    case 'defensive':
      return 'Defensiv';
    case 'reserve':
      return 'Reserve';
    case 'support':
      return 'Støtte';
    default:
      return posture;
  }
}

function formatPriority(priority: ArmyGroupPriority): string {
  switch (priority) {
    case 'critical':
      return 'Kritisk';
    case 'high':
      return 'Høy';
    case 'standard':
      return 'Normal';
    case 'low':
      return 'Lav';
    default:
      return priority;
  }
}

function formatFrontlineStatus(status: FrontlineStatus): string {
  switch (status) {
    case 'breakthrough':
      return 'Gjennombrudd';
    case 'pressured':
      return 'Presset';
    case 'stalled':
      return 'Stanset';
    case 'stable':
    default:
      return 'Stabil';
  }
}

function formatSupplyState(state: FrontlineSupplyState): string {
  switch (state) {
    case 'critical':
      return 'Kritisk forsyning';
    case 'strained':
      return 'Anstrengt forsyning';
    case 'secure':
    default:
      return 'Sikker forsyning';
  }
}

function getFrontlinePanelStatus(status: FrontlineStatus, supply: FrontlineSupplyState): PanelStatus {
  if (status === 'breakthrough' || supply === 'critical') {
    return 'critical';
  }
  if (status === 'pressured' || supply === 'strained') {
    return 'warning';
  }
  return 'normal';
}

function getGroupPanelStatus(summary: ArmyGroupSummary): PanelStatus {
  const frontlineSeverity = summary.frontlines.map((frontline) =>
    getFrontlinePanelStatus(frontline.status, frontline.supplyState)
  );

  if (
    summary.readiness < 35 ||
    summary.supplyLevel < 35 ||
    frontlineSeverity.some((severity) => severity === 'critical')
  ) {
    return 'critical';
  }

  if (
    summary.readiness < 55 ||
    summary.supplyLevel < 55 ||
    frontlineSeverity.some((severity) => severity === 'warning')
  ) {
    return 'warning';
  }

  return 'normal';
}

function percentageLabel(value: number): string {
  return `${Math.round(value)}%`;
}

const OrderOfBattlePanelComponent = ({ groups, className }: OrderOfBattlePanelProps) => {
  const sortedGroups = useMemo(
    () =>
      [...groups].sort((a, b) => {
        const priorityWeight: Record<ArmyGroupPriority, number> = {
          critical: 0,
          high: 1,
          standard: 2,
          low: 3,
        };
        const aWeight = priorityWeight[a.group.priority] ?? 3;
        const bWeight = priorityWeight[b.group.priority] ?? 3;
        if (aWeight !== bWeight) {
          return aWeight - bWeight;
        }
        return b.readiness - a.readiness;
      }),
    [groups]
  );

  return (
    <div
      className={cn(
        'rounded-xl border border-cyan-500/40 bg-slate-950/85 backdrop-blur-xl shadow-[0_0_30px_rgba(34,211,238,0.25)]',
        'flex flex-col',
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-cyan-500/20 px-4 py-3">
        <div className="flex items-center gap-2 text-cyan-200">
          <Swords className="h-4 w-4 text-cyan-300" aria-hidden="true" />
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-[0.45em] text-cyan-200/90">
              Order of Battle
            </span>
            <span className="text-[11px] text-cyan-200/60">Teateroversikt</span>
          </div>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-[0.35em] text-cyan-200/60">
          {groups.length} grupper
        </span>
      </div>

      <div className="space-y-3 p-4">
        {sortedGroups.length === 0 ? (
          <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4 text-sm text-cyan-200/80">
            Ingen armégrupper er organisert ennå. Opprett en gruppe for å følge frontlinjer og forsyning.
          </div>
        ) : (
          sortedGroups.map((summary) => {
            const status = getGroupPanelStatus(summary);
            return (
              <div
                key={summary.group.id}
                className="space-y-3 rounded-lg border border-cyan-500/20 bg-slate-900/60 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-semibold text-cyan-100">
                      <MapPin className="h-3.5 w-3.5 text-cyan-300" aria-hidden="true" />
                      <span>
                        {summary.group.name}
                        <span className="ml-2 text-xs font-normal uppercase tracking-[0.3em] text-cyan-200/60">
                          {summary.group.theater}
                        </span>
                      </span>
                    </div>
                    <p className="text-[11px] text-cyan-200/70">
                      {formatPosture(summary.group.posture)} doktrine • Prioritet {formatPriority(summary.group.priority)}
                    </p>
                    {summary.group.notes ? (
                      <p className="text-[11px] text-cyan-200/60">{summary.group.notes}</p>
                    ) : null}
                  </div>
                  <span
                    className={cn(
                      'rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.35em]',
                      STATUS_BADGE[status],
                    )}
                  >
                    {status === 'critical' ? 'Kritisk' : status === 'warning' ? 'Varsel' : 'Stabil'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] text-cyan-200/70">
                  <div className="space-y-1">
                    <span className="flex items-center gap-2 text-xs font-semibold text-cyan-100">
                      <Shield className="h-3.5 w-3.5 text-cyan-300" aria-hidden="true" />
                      Beredskap {percentageLabel(summary.readiness)}
                    </span>
                    <div className="h-2 w-full rounded-full bg-slate-800">
                      <div
                        className={cn('h-2 rounded-full transition-all', readinessClass(summary.readiness))}
                        style={{ width: `${Math.min(100, Math.max(0, summary.readiness))}%` }}
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="flex items-center gap-2 text-xs font-semibold text-cyan-100">
                      <Waves className="h-3.5 w-3.5 text-cyan-300" aria-hidden="true" />
                      Forsyning {percentageLabel(summary.supplyLevel)}
                    </span>
                    <div className="h-2 w-full rounded-full bg-slate-800">
                      <div
                        className={cn('h-2 rounded-full transition-all', supplyClass(summary.supplyLevel))}
                        style={{ width: `${Math.min(100, Math.max(0, summary.supplyLevel))}%` }}
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-cyan-200/70">
                  <span>{summary.units.length} enheter deployert</span>
                  <span>Frontlinjer: {summary.frontlines.length}</span>
                </div>

                <div className="space-y-2">
                  {summary.frontlines.length === 0 ? (
                    <div className="rounded border border-cyan-500/10 bg-slate-900/70 px-3 py-2 text-[11px] text-cyan-200/60">
                      Ingen frontlinjer tilordnet. Sett mål i teateret.
                    </div>
                  ) : (
                    summary.frontlines.map((frontline) => {
                      const frontlineStatus = getFrontlinePanelStatus(frontline.status, frontline.supplyState);
                      return (
                        <div
                          key={frontline.id}
                          className={cn(
                            'space-y-1 rounded-lg border px-3 py-2',
                            frontlineStatus === 'critical'
                              ? 'border-red-500/60 bg-red-500/10'
                              : frontlineStatus === 'warning'
                                ? 'border-amber-400/60 bg-amber-500/10'
                                : 'border-cyan-500/20 bg-slate-950/60',
                          )}
                        >
                          <div className="flex items-center justify-between gap-3 text-xs font-semibold text-cyan-100">
                            <span className="flex items-center gap-2">
                              <AlertTriangle
                                className={cn(
                                  'h-3.5 w-3.5',
                                  frontlineStatus === 'critical'
                                    ? 'text-red-300'
                                    : frontlineStatus === 'warning'
                                      ? 'text-amber-300'
                                      : 'text-cyan-300',
                                )}
                                aria-hidden="true"
                              />
                              {frontline.name}
                            </span>
                            <span className="text-[10px] uppercase tracking-[0.3em] text-cyan-200/60">
                              {percentageLabel(frontline.readiness)}
                            </span>
                          </div>
                          <p className="text-[11px] text-cyan-200/70">
                            {frontline.axis} • {formatFrontlineStatus(frontline.status)}
                          </p>
                          <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-200/60">
                            {formatSupplyState(frontline.supplyState)}
                            {frontline.contested ? ' • Kamp pågår' : ''}
                          </p>
                          {frontline.objective ? (
                            <p className="text-[11px] text-cyan-200/60">Mål: {frontline.objective}</p>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export const OrderOfBattlePanel = memo(OrderOfBattlePanelComponent);

export type { OrderOfBattlePanelProps };
