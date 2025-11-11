import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TrendingDown, TrendingUp, AlertTriangle, Shield } from 'lucide-react';
import type { DefconChangeEvent } from '@/types/game';

interface DefconChangeModalProps {
  event: DefconChangeEvent;
  onClose: () => void;
}

export function DefconChangeModal({ event, onClose }: DefconChangeModalProps) {
  const isEscalation = event.category === 'escalation';
  const Icon = isEscalation ? TrendingDown : TrendingUp;
  const iconColor = isEscalation ? 'text-red-400' : 'text-green-400';
  const borderColor = isEscalation ? 'border-red-500/60 bg-red-900/20' : 'border-green-500/60 bg-green-900/20';
  const titleColor = isEscalation ? 'text-red-400' : 'text-green-400';
  const title = isEscalation ? 'DEFCON ESCALATION' : 'DEFCON DE-ESCALATION';

  const getDefconColor = (defcon: number) => {
    if (defcon === 1) return 'text-red-500';
    if (defcon === 2) return 'text-orange-500';
    if (defcon === 3) return 'text-yellow-500';
    if (defcon === 4) return 'text-blue-400';
    return 'text-green-400';
  };

  const getDefconLabel = (defcon: number) => {
    const labels: Record<number, string> = {
      1: 'NUCLEAR WAR',
      2: 'FAST PACE',
      3: 'ROUND HOUSE',
      4: 'DOUBLE TAKE',
      5: 'FADE OUT'
    };
    return labels[defcon] || 'UNKNOWN';
  };

  const getTriggerDescription = () => {
    const triggers: Record<string, string> = {
      'player': 'Your Actions',
      'ai': 'AI Nation Activity',
      'event': 'Global Event',
      'system': 'System Update'
    };
    return triggers[event.triggeredBy] || 'Unknown Source';
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className={`max-w-2xl border-2 ${borderColor} backdrop-blur-sm`}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Icon className={`h-8 w-8 ${iconColor}`} />
            <div>
              <DialogTitle className={`text-2xl font-bold ${titleColor} uppercase tracking-wider`}>
                {title}
              </DialogTitle>
              <div className="text-sm text-gray-400 mt-1">
                Turn {event.turn}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* DEFCON Change Display */}
          <div className={`border ${isEscalation ? 'border-red-500/30 bg-red-900/20' : 'border-green-500/30 bg-green-900/20'} rounded-lg p-4`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-widest text-gray-400 font-semibold">
                Alert Level Change:
              </span>
            </div>
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <div className={`text-4xl font-bold font-mono ${getDefconColor(event.previousDefcon)}`}>
                  {event.previousDefcon}
                </div>
                <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider">
                  {getDefconLabel(event.previousDefcon)}
                </div>
              </div>
              <Icon className={`h-8 w-8 ${iconColor}`} />
              <div className="text-center">
                <div className={`text-4xl font-bold font-mono ${getDefconColor(event.newDefcon)}`}>
                  {event.newDefcon}
                </div>
                <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider">
                  {getDefconLabel(event.newDefcon)}
                </div>
              </div>
            </div>
          </div>

          {/* Reason Explanation */}
          <div className="border border-white/20 rounded-lg p-4 bg-black/40">
            <div className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-2">
              Situation Report:
            </div>
            <div className="text-base text-gray-200 leading-relaxed">
              {event.reason}
            </div>
          </div>

          {/* Trigger Source */}
          <div className="border border-cyan-500/30 rounded-lg p-4 bg-cyan-900/10">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-cyan-400" />
              <span className="text-xs uppercase tracking-widest text-cyan-400 font-semibold">
                Triggered By:
              </span>
              <span className="text-sm text-white font-semibold">
                {getTriggerDescription()}
              </span>
            </div>
          </div>

          {/* Warning for critical levels */}
          {event.newDefcon <= 2 && (
            <div className="border border-amber-500/30 rounded-lg p-4 bg-amber-900/10">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                <div className="text-xs uppercase tracking-widest text-amber-400 font-semibold">
                  Critical Warning:
                </div>
              </div>
              <div className="text-sm text-amber-200">
                {event.newDefcon === 1
                  ? 'Nuclear war is imminent. All military forces are authorized to engage.'
                  : 'Situation critical. Armed forces ready. Further escalation may be imminent.'}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-white/10">
          <Button
            onClick={onClose}
            className={`${isEscalation ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'} text-white font-bold px-8 py-2`}
          >
            ACKNOWLEDGE
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
