import { memo, useMemo } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ChevronDown,
  ChevronUp,
  X,
  Factory,
  Handshake,
  Radar,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type StrategicOutlinerSeverity = 'info' | 'warning' | 'critical';

export interface StrategicOutlinerItem {
  id: string;
  label: string;
  value?: string;
  detail?: string;
  icon?: LucideIcon;
  severity?: StrategicOutlinerSeverity;
  onSelect?: () => void;
}

export interface StrategicOutlinerGroup {
  id: string;
  title: string;
  icon: LucideIcon;
  accent?: string;
  items: StrategicOutlinerItem[];
}

export interface StrategicMacroAction {
  id: string;
  label: string;
  icon: LucideIcon;
  onExecute: () => void;
  hint?: string;
}

interface StrategicOutlinerProps {
  groups: StrategicOutlinerGroup[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onRequestClose?: () => void;
  keyboardHint?: string;
  macroActions?: StrategicMacroAction[];
  className?: string;
}

const severityStyles: Record<StrategicOutlinerSeverity, string> = {
  info: 'border-cyan-500/30 bg-slate-900/70 text-cyan-100',
  warning: 'border-amber-400/40 bg-amber-500/15 text-amber-100 shadow-[0_0_12px_rgba(251,191,36,0.25)]',
  critical: 'border-rose-500/60 bg-rose-500/20 text-rose-50 shadow-[0_0_18px_rgba(244,63,94,0.45)] animate-pulse',
};

const headerIcons: Record<string, LucideIcon> = {
  production: Factory,
  diplomacy: Handshake,
  intelligence: Radar,
};

export const StrategicOutliner = memo(function StrategicOutliner({
  groups,
  isCollapsed = false,
  onToggleCollapse,
  onRequestClose,
  keyboardHint,
  macroActions = [],
  className,
}: StrategicOutlinerProps) {
  const visibleGroups = useMemo(
    () => groups.filter((group) => group.items.length > 0),
    [groups],
  );

  const collapsedSummary = useMemo(() => {
    if (visibleGroups.length === 0) {
      return 'Ingen aktive varsler';
    }
    return visibleGroups
      .map((group) => `${group.title}: ${group.items.length}`)
      .join(' • ');
  }, [visibleGroups]);

  return (
    <div
      className={cn(
        'rounded-xl border border-cyan-500/40 bg-gradient-to-br from-slate-950/90 via-slate-900/85 to-slate-900/80 text-cyan-100 shadow-[0_0_30px_rgba(56,189,248,0.25)] backdrop-blur-md',
        'transition-all duration-200',
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-cyan-500/30 bg-black/40 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-mono uppercase tracking-[0.3em] text-cyan-300">
          <Sparkles className="h-4 w-4" />
          Strategic Outliner
        </div>
        <div className="flex items-center gap-2">
          {keyboardHint ? (
            <span className="text-[10px] font-mono text-cyan-300/70">{keyboardHint}</span>
          ) : null}
          {onToggleCollapse ? (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-cyan-500/40 bg-slate-900/60 text-cyan-200 hover:border-cyan-300 hover:text-cyan-50"
              aria-label={isCollapsed ? 'Expand outliner' : 'Collapse outliner'}
            >
              {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </button>
          ) : null}
          {onRequestClose ? (
            <button
              type="button"
              onClick={onRequestClose}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-cyan-500/40 bg-slate-900/60 text-cyan-200 hover:border-rose-400 hover:text-rose-200"
              aria-label="Hide strategic outliner"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      {isCollapsed ? (
        <div className="px-4 py-3 text-xs text-cyan-200/80">{collapsedSummary}</div>
      ) : (
        <>
          <div className="divide-y divide-cyan-500/20">
            {visibleGroups.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-cyan-200/70">
                Ingen aktive operasjoner eller varsler – hold øye med flashpoints og etterretning.
              </div>
            ) : (
              visibleGroups.map((group) => {
                const HeaderIcon = group.icon ?? headerIcons[group.id] ?? Handshake;
                return (
                  <section key={group.id} className="px-4 py-3">
                    <header className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-cyan-500/40 bg-slate-900/70">
                          <HeaderIcon className="h-4 w-4 text-cyan-300" />
                        </div>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-cyan-200">
                          {group.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-cyan-300/70">{group.items.length} aktiv</span>
                    </header>
                    <ul className="space-y-2">
                      {group.items.map((item) => {
                        const ItemIcon = item.icon;
                        const severity = item.severity ?? 'info';
                        const content = (
                          <div
                            className={cn(
                              'group relative flex w-full items-start gap-3 rounded-lg border px-3 py-2 text-left transition-colors',
                              severityStyles[severity],
                              item.onSelect
                                ? 'cursor-pointer hover:border-cyan-200/70 hover:shadow-[0_0_18px_rgba(125,211,252,0.35)]'
                                : 'cursor-default',
                            )}
                          >
                            <div className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full border border-cyan-400/50 bg-slate-950/50">
                              {ItemIcon ? (
                                <ItemIcon className="h-3.5 w-3.5 text-cyan-200" />
                              ) : (
                                <AlertTriangle className="h-3.5 w-3.5 text-cyan-200" />
                              )}
                            </div>
                            <div className="flex-1 text-xs">
                              <div className="flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-[0.25em]">
                                <span>{item.label}</span>
                                {item.value ? (
                                  <span className="text-cyan-100/90">{item.value}</span>
                                ) : null}
                              </div>
                              {item.detail ? (
                                <p className="mt-1 text-[11px] leading-relaxed text-cyan-100/80">
                                  {item.detail}
                                </p>
                              ) : null}
                            </div>
                            {severity === 'critical' ? (
                              <span className="absolute right-3 top-3 inline-flex h-2 w-2 animate-ping rounded-full bg-rose-400" />
                            ) : null}
                          </div>
                        );

                        return (
                          <li key={item.id}>
                            {item.onSelect ? (
                              <button type="button" className="w-full" onClick={item.onSelect}>
                                {content}
                              </button>
                            ) : (
                              content
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              })
            )}
          </div>

          {macroActions.length > 0 ? (
            <div className="border-t border-cyan-500/20 bg-slate-950/70 px-4 py-3">
              <div className="mb-2 text-[10px] font-mono uppercase tracking-[0.35em] text-cyan-300/80">
                Macro Commands
              </div>
              <div className="grid grid-cols-2 gap-2">
                {macroActions.map((action) => {
                  const ActionIcon = action.icon;
                  return (
                    <button
                      key={action.id}
                      type="button"
                      onClick={action.onExecute}
                      className="flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-slate-900/70 px-3 py-2 text-left text-[11px] uppercase tracking-[0.25em] text-cyan-200 transition hover:border-cyan-200 hover:text-cyan-50"
                    >
                      <ActionIcon className="h-4 w-4 text-cyan-300" />
                      <span className="flex-1">{action.label}</span>
                      {action.hint ? (
                        <span className="text-[9px] font-mono text-cyan-300/60">{action.hint}</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
});

StrategicOutliner.displayName = 'StrategicOutliner';
