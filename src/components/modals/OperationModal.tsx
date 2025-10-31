/**
 * OperationModal Component
 *
 * Modal for displaying and executing covert operations.
 * Extracted from Index.tsx as part of refactoring effort.
 */

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import type { Nation } from '@/types/game';

// Types
type LocalNation = Nation & {
  conventional?: any;
  controlledTerritories?: string[];
};

type OperationTargetFilter = (nation: Nation, player: Nation) => boolean;

export interface OperationAction {
  id: string;
  title: string;
  subtitle: string;
  description?: string;
  costText?: string;
  requiresTarget?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  targetFilter?: OperationTargetFilter;
}

export interface OperationModalProps {
  actions: OperationAction[];
  player: LocalNation;
  targetableNations: LocalNation[];
  onExecute: (action: OperationAction, target?: LocalNation) => boolean;
  onClose: () => void;
  accent?: 'fuchsia' | 'cyan' | 'violet' | 'emerald' | 'amber';
}

const ACCENT_STYLES: Record<NonNullable<OperationModalProps['accent']>, {
  border: string;
  hover: string;
  heading: string;
  text: string;
  muted: string;
  button: string;
}> = {
  fuchsia: {
    border: 'border-fuchsia-500/60',
    hover: 'hover:border-fuchsia-300 hover:bg-fuchsia-500/10',
    heading: 'text-fuchsia-300',
    text: 'text-fuchsia-200',
    muted: 'text-fuchsia-200/70',
    button: 'bg-fuchsia-500 text-black hover:bg-fuchsia-400'
  },
  cyan: {
    border: 'border-cyan-500/60',
    hover: 'hover:border-cyan-300 hover:bg-cyan-500/10',
    heading: 'text-cyan-300',
    text: 'text-cyan-200',
    muted: 'text-cyan-200/70',
    button: 'bg-cyan-500 text-black hover:bg-cyan-400'
  },
  violet: {
    border: 'border-violet-500/60',
    hover: 'hover:border-violet-300 hover:bg-violet-500/10',
    heading: 'text-violet-300',
    text: 'text-violet-200',
    muted: 'text-violet-200/70',
    button: 'bg-violet-500 text-black hover:bg-violet-400'
  },
  emerald: {
    border: 'border-emerald-500/60',
    hover: 'hover:border-emerald-300 hover:bg-emerald-500/10',
    heading: 'text-emerald-300',
    text: 'text-emerald-200',
    muted: 'text-emerald-200/70',
    button: 'bg-emerald-500 text-black hover:bg-emerald-400'
  },
  amber: {
    border: 'border-amber-500/60',
    hover: 'hover:border-amber-300 hover:bg-amber-500/10',
    heading: 'text-amber-300',
    text: 'text-amber-200',
    muted: 'text-amber-200/70',
    button: 'bg-amber-500 text-black hover:bg-amber-400'
  }
};

export function OperationModal({ actions, player, targetableNations, onExecute, onClose, accent = 'fuchsia' }: OperationModalProps) {
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const accentStyles = ACCENT_STYLES[accent];

  const pendingAction = useMemo(() => actions.find(action => action.id === pendingActionId) || null, [actions, pendingActionId]);

  const availableTargets = useMemo(() => {
    if (!pendingAction || !pendingAction.requiresTarget) return [] as LocalNation[];
    const filter = pendingAction.targetFilter;
    return targetableNations.filter(nation => (filter ? filter(nation, player) : true));
  }, [pendingAction, targetableNations, player]);

  const handleActionClick = (action: OperationAction) => {
    if (action.disabled) {
      if (action.disabledReason) {
        toast({ title: 'Unavailable', description: action.disabledReason });
      }
      return;
    }

    if (action.requiresTarget) {
      setPendingActionId(action.id);
      return;
    }

    const success = onExecute(action);
    if (success) {
      onClose();
    }
  };

  const handleTargetClick = (target: Nation) => {
    if (!pendingAction) return;
    const success = onExecute(pendingAction, target);
    if (success) {
      setPendingActionId(null);
      onClose();
    }
  };

  if (pendingAction && pendingAction.requiresTarget) {
    return (
      <div className="space-y-4">
        <div className={`text-xs uppercase tracking-widest ${accentStyles.heading}`}>
          Select target for {pendingAction.title}
        </div>
        <div className="grid gap-3">
          {availableTargets.length === 0 ? (
            <div className={`rounded border ${accentStyles.border} bg-black/50 px-4 py-3 text-sm ${accentStyles.muted}`}>
              No valid targets available.
            </div>
          ) : (
            availableTargets.map(target => (
              <button
                key={target.id}
                type="button"
                onClick={() => handleTargetClick(target)}
                className={`rounded border ${accentStyles.border} bg-black/60 px-4 py-3 text-left transition ${accentStyles.hover}`}
              >
                <div className={`flex items-center justify-between text-sm font-semibold ${accentStyles.text}`}>
                  <span>{target.name}</span>
                  <span>{Math.floor(target.population)}M</span>
                </div>
                <div className={`mt-1 text-xs ${accentStyles.muted}`}>
                  DEF {target.defense} • MISS {target.missiles} • INSTAB {Math.floor(target.instability || 0)}
                </div>
              </button>
            ))
          )}
        </div>
        <div className="flex flex-wrap justify-between gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setPendingActionId(null)}
            className="border border-cyan-500/60 bg-transparent text-cyan-200 hover:bg-cyan-500/10"
          >
            Back
          </Button>
          <Button type="button" onClick={onClose} className={accentStyles.button}>
            Close [ESC]
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={`text-xs uppercase tracking-widest ${accentStyles.heading}`}>Operations</div>
      <div className="grid gap-3 sm:grid-cols-2">
        {actions.map(action => (
          <button
            key={action.id}
            type="button"
            onClick={() => handleActionClick(action)}
            className={`rounded border ${accentStyles.border} bg-black/60 px-4 py-3 text-left transition ${accentStyles.hover} ${action.disabled ? 'cursor-not-allowed opacity-40' : ''}`}
            aria-disabled={action.disabled}
          >
            <div className={`text-sm font-semibold ${accentStyles.text}`}>{action.title}</div>
            <div className={`text-xs uppercase tracking-wide ${accentStyles.heading}`}>{action.subtitle}</div>
            {action.costText ? (
              <div className={`mt-2 text-xs ${accentStyles.muted}`}>{action.costText}</div>
            ) : null}
            {action.description ? (
              <p className={`mt-2 text-xs leading-relaxed ${accentStyles.muted}`}>{action.description}</p>
            ) : null}
            {action.disabled && action.disabledReason ? (
              <p className="mt-2 text-xs text-yellow-300/80">{action.disabledReason}</p>
            ) : null}
          </button>
        ))}
      </div>
      <div className="flex justify-end">
        <Button type="button" onClick={onClose} className={accentStyles.button}>
          Close [ESC]
        </Button>
      </div>
    </div>
  );
}
