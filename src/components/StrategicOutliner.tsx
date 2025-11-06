import { forwardRef, memo, useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StrategicOutlinerStatus = 'normal' | 'warning' | 'critical';

export interface StrategicOutlinerItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  icon: ReactNode;
  status?: StrategicOutlinerStatus;
  meta?: string;
}

export interface StrategicOutlinerGroup {
  id: string;
  title: string;
  items: StrategicOutlinerItem[];
  accentColor?: string;
}

interface StrategicOutlinerProps {
  groups: StrategicOutlinerGroup[];
  collapsed?: boolean;
  onToggleCollapse: () => void;
  hotkeys?: {
    toggle?: string;
    focus?: string;
  };
  attentionPulse?: number;
  className?: string;
}

const STATUS_STYLES: Record<StrategicOutlinerStatus, string> = {
  normal: 'border-cyan-500/20 bg-slate-900/60 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.18)]',
  warning: 'border-amber-400/50 bg-amber-500/10 text-amber-200 shadow-[0_0_16px_rgba(251,191,36,0.3)]',
  critical: 'border-red-500/70 bg-red-600/10 text-red-200 shadow-[0_0_20px_rgba(248,113,113,0.45)] animate-[pulse_1.4s_ease-in-out_infinite]',
};

const StrategicOutlinerComponent = forwardRef<HTMLDivElement, StrategicOutlinerProps>(function StrategicOutlinerComponent(
  {
    groups,
    collapsed = false,
    onToggleCollapse,
    hotkeys,
    attentionPulse,
    className,
  },
  ref,
) {
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [pulseActive, setPulseActive] = useState(false);

  useEffect(() => {
    setCollapsedGroups((previous) => {
      const next: Record<string, boolean> = {};
      groups.forEach((group) => {
        next[group.id] = previous[group.id] ?? false;
      });
      return next;
    });
  }, [groups]);

  useEffect(() => {
    if (!attentionPulse) {
      return;
    }
    setPulseActive(true);
    const timeout = window.setTimeout(() => setPulseActive(false), 900);
    return () => window.clearTimeout(timeout);
  }, [attentionPulse]);

  const visibleGroups = useMemo(
    () => groups.filter((group) => group.items.length > 0),
    [groups],
  );

  const toggleGroup = useCallback((groupId: string) => {
    setCollapsedGroups((previous) => ({
      ...previous,
      [groupId]: !previous[groupId],
    }));
  }, []);

  const hotkeyHints = useMemo(() => {
    if (!hotkeys) {
      return null;
    }
    const hints: string[] = [];
    if (hotkeys.toggle) {
      hints.push(`Toggle (${hotkeys.toggle})`);
    }
    if (hotkeys.focus) {
      hints.push(`Fokus (${hotkeys.focus})`);
    }
    if (hints.length === 0) {
      return null;
    }
    return (
      <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-[0.35em] text-cyan-300/70">
        {hints.map((hint) => (
          <span
            key={hint}
            className="rounded border border-cyan-500/40 bg-cyan-500/10 px-2 py-0.5 text-cyan-200/80"
          >
            {hint}
          </span>
        ))}
      </div>
    );
  }, [hotkeys]);

  return (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border border-cyan-500/40 bg-slate-950/85 backdrop-blur-xl shadow-[0_0_30px_rgba(34,211,238,0.25)] transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70',
        pulseActive && 'ring-2 ring-cyan-400/70',
        className,
      )}
    >
      <div className="flex items-start justify-between border-b border-cyan-500/20 px-4 py-3">
        <div className="flex items-center gap-2 text-cyan-200">
          <Sparkles className="h-4 w-4 text-cyan-300" aria-hidden="true" />
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-[0.45em] text-cyan-200/90">
              Strategic Outliner
            </span>
            <span className="text-[11px] text-cyan-200/60">Makro-overblikk</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {hotkeyHints}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex items-center gap-1 rounded border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[11px] uppercase tracking-[0.3em] text-cyan-200 transition hover:bg-cyan-500/20"
            aria-label={collapsed ? 'Expand strategic outliner' : 'Collapse strategic outliner'}
          >
            {collapsed ? 'Show' : 'Hide'}
            <ChevronDown
              className={cn('h-3 w-3 transition-transform', collapsed && '-rotate-90')}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {!collapsed ? (
        <div className="space-y-3 p-4">
          {visibleGroups.length === 0 ? (
            <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4 text-center text-sm text-cyan-200/80">
              Ingen aktive makro-hendelser. Overvåker etterretning, produksjon og diplomati.
            </div>
          ) : (
            visibleGroups.map((group) => {
              const isCollapsed = collapsedGroups[group.id] ?? false;
              return (
                <div key={group.id} className="rounded-lg border border-cyan-500/20 bg-slate-900/60">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left"
                    aria-expanded={!isCollapsed}
                  >
                    <span
                      className={cn(
                        'text-[11px] font-semibold uppercase tracking-[0.4em]',
                        group.accentColor ?? 'text-cyan-200',
                      )}
                    >
                      {group.title}
                    </span>
                    <ChevronRight
                      className={cn('h-3.5 w-3.5 text-cyan-400 transition-transform', !isCollapsed && 'rotate-90')}
                      aria-hidden="true"
                    />
                  </button>
                  {!isCollapsed ? (
                    <div className="space-y-2 border-t border-cyan-500/10 px-3 py-3">
                      {group.items.map((item) => {
                        const status: StrategicOutlinerStatus = item.status ?? 'normal';
                        return (
                          <div
                            key={item.id}
                            className={cn(
                              'flex items-start gap-3 rounded-lg border px-3 py-2 transition-colors',
                              STATUS_STYLES[status],
                            )}
                          >
                            <div className="mt-0.5 text-cyan-200" aria-hidden="true">
                              {item.icon}
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-semibold leading-tight">
                                  {item.title}
                                </span>
                                <span
                                  className={cn(
                                    'text-[10px] font-mono uppercase tracking-[0.35em]',
                                    status === 'critical'
                                      ? 'text-red-200'
                                      : status === 'warning'
                                        ? 'text-amber-200'
                                        : 'text-cyan-200/70',
                                  )}
                                >
                                  {status === 'critical'
                                    ? 'Kritisk'
                                    : status === 'warning'
                                      ? 'Varsel'
                                      : 'Stabil'}
                                </span>
                              </div>
                              {item.subtitle ? (
                                <p className="text-xs text-cyan-100/80">{item.subtitle}</p>
                              ) : null}
                              {item.description ? (
                                <p className="text-[11px] text-cyan-100/60">{item.description}</p>
                              ) : null}
                              {item.meta ? (
                                <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-200/60">
                                  {item.meta}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
});

export const StrategicOutliner = memo(StrategicOutlinerComponent);

export type { StrategicOutlinerProps };
