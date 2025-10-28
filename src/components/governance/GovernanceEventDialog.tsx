import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { GovernanceEventState, GovernanceMetrics } from '@/hooks/useGovernance';

interface GovernanceEventDialogProps {
  open: boolean;
  event: GovernanceEventState | null;
  metrics: GovernanceMetrics | undefined;
  onSelect: (optionId: string) => void;
  onDismiss: () => void;
}

export function GovernanceEventDialog({ open, event, metrics, onSelect, onDismiss }: GovernanceEventDialogProps) {
  if (!event) return null;

  const { definition } = event;

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!value) onDismiss(); }}>
      <DialogContent className="bg-slate-950 border border-cyan-500/40 text-cyan-100 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold tracking-wide text-cyan-300">
            {definition.title}
          </DialogTitle>
          <DialogDescription className="text-cyan-200/70">
            {definition.summary}
          </DialogDescription>
        </DialogHeader>

        {metrics && (
          <div className="grid grid-cols-2 gap-3 rounded border border-cyan-500/20 bg-black/40 p-3 text-sm">
            <div className="flex flex-col">
              <span className="text-cyan-400/80">Morale</span>
              <span className="text-emerald-300 text-lg font-mono">{Math.round(metrics.morale)}%</span>
            </div>
            <div className="flex flex-col">
              <span className="text-cyan-400/80">Public Opinion</span>
              <span className="text-emerald-300 text-lg font-mono">{Math.round(metrics.publicOpinion)}%</span>
            </div>
            <div className="flex flex-col">
              <span className="text-cyan-400/80">Cabinet Approval</span>
              <span className="text-emerald-300 text-lg font-mono">{Math.round(metrics.cabinetApproval)}%</span>
            </div>
            <div className="flex flex-col">
              <span className="text-cyan-400/80">Election Countdown</span>
              <span className="text-emerald-300 text-lg font-mono">{metrics.electionTimer} turns</span>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {definition.options.map((option) => (
            <div key={option.id} className="rounded border border-cyan-500/10 bg-slate-900/80 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-base font-semibold text-cyan-200">{option.label}</h4>
                  <p className="text-sm text-cyan-100/70">{option.description}</p>
                </div>
                <Button variant="outline" className="border-cyan-500/60 text-cyan-200 hover:bg-cyan-500/10" onClick={() => onSelect(option.id)}>
                  Execute
                </Button>
              </div>
              <ul className="mt-3 space-y-2 text-xs text-cyan-100/60">
                {option.outcomes.map((outcome) => (
                  <li key={outcome.id} className="rounded border border-cyan-500/10 bg-black/30 p-2">
                    <span className="block font-semibold text-cyan-300/90">
                      {typeof outcome.chance === 'number' ? `${Math.round(outcome.chance * 100)}%` : ''}
                      {typeof outcome.chance === 'number' ? ' chance · ' : ''}
                      {outcome.description}
                    </span>
                    <span className="block text-cyan-200/70">
                      {summariseEffects(outcome.effects)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="ghost" className="text-cyan-300 hover:bg-cyan-500/10" onClick={onDismiss}>
            Postpone
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function summariseEffects(effects: Record<string, number | undefined>): string {
  const entries = Object.entries(effects)
    .filter(([, value]) => typeof value === 'number' && value !== 0)
    .map(([key, value]) => {
      const delta = value ?? 0;
      const label = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (char) => char.toUpperCase());
      const sign = delta > 0 ? '+' : '';
      return `${label} ${sign}${delta}`;
    });

  return entries.length ? entries.join(' · ') : 'No material change';
}
