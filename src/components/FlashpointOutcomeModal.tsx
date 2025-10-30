import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

interface FlashpointOutcome {
  title: string;
  success: boolean;
  choiceMade: string;
  choiceDescription: string;
  narrativeOutcome: string;
  consequences: {
    label: string;
    value: string | number;
    type: 'positive' | 'negative' | 'neutral';
  }[];
  followUpHint?: string;
}

interface FlashpointOutcomeModalProps {
  outcome: FlashpointOutcome;
  onClose: () => void;
}

export function FlashpointOutcomeModal({ outcome, onClose }: FlashpointOutcomeModalProps) {
  const OutcomeIcon = outcome.success ? CheckCircle2 : XCircle;
  const outcomeColor = outcome.success ? 'text-green-400' : 'text-red-400';
  const outcomeBorder = outcome.success ? 'border-green-500/60 bg-green-900/20' : 'border-red-500/60 bg-red-900/20';
  const outcomeLabel = outcome.success ? 'OPERATION SUCCESSFUL' : 'OPERATION FAILED';

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className={`max-w-2xl border-2 ${outcomeBorder} backdrop-blur-sm`}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <OutcomeIcon className={`h-8 w-8 ${outcomeColor}`} />
            <div>
              <DialogTitle className={`text-2xl font-bold ${outcomeColor} uppercase tracking-wider`}>
                {outcomeLabel}
              </DialogTitle>
              <div className="text-sm text-gray-400 mt-1">
                {outcome.title}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Choice Made */}
          <div className="border border-cyan-500/30 rounded-lg p-4 bg-cyan-900/10">
            <div className="text-xs uppercase tracking-widest text-cyan-400 font-semibold mb-2">
              Your Decision:
            </div>
            <div className="text-lg font-semibold text-white">{outcome.choiceMade}</div>
            <div className="text-sm text-gray-300 mt-1">{outcome.choiceDescription}</div>
          </div>

          {/* Narrative Outcome */}
          <div className="border border-white/20 rounded-lg p-4 bg-black/40">
            <div className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-2">
              Situation Report:
            </div>
            <div className="text-base text-gray-200 leading-relaxed">
              {outcome.narrativeOutcome}
            </div>
          </div>

          {/* Consequences */}
          {outcome.consequences.length > 0 && (
            <div className="border border-white/20 rounded-lg p-4 bg-black/40">
              <div className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-3">
                Immediate Consequences:
              </div>
              <div className="space-y-2">
                {outcome.consequences.map((consequence, index) => {
                  const Icon = consequence.type === 'positive' ? TrendingUp :
                               consequence.type === 'negative' ? TrendingDown :
                               AlertTriangle;
                  const color = consequence.type === 'positive' ? 'text-green-400' :
                                consequence.type === 'negative' ? 'text-red-400' :
                                'text-yellow-400';

                  return (
                    <div key={index} className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${color}`} />
                      <span className="text-sm text-gray-300">{consequence.label}:</span>
                      <span className={`text-sm font-semibold ${color}`}>
                        {consequence.value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Follow-up Hint */}
          {outcome.followUpHint && (
            <div className="border border-amber-500/30 rounded-lg p-4 bg-amber-900/10">
              <div className="text-xs uppercase tracking-widest text-amber-400 font-semibold mb-2">
                Intelligence Update:
              </div>
              <div className="text-sm text-amber-200">
                {outcome.followUpHint}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-white/10">
          <Button
            onClick={onClose}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-8 py-2"
          >
            ACKNOWLEDGE
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
