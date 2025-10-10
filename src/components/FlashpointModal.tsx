import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FlashpointEvent } from '@/hooks/useFlashpoints';
import { AlertTriangle, Clock, Shield, Target, Users, Brain } from 'lucide-react';

interface FlashpointModalProps {
  flashpoint: FlashpointEvent;
  onResolve: (optionId: string) => void;
  onTimeout?: () => void;
}

const SEVERITY_CONFIG = {
  major: {
    color: 'border-yellow-500/60 bg-yellow-900/20',
    icon: AlertTriangle,
    label: 'MAJOR CRISIS'
  },
  critical: {
    color: 'border-orange-500/60 bg-orange-900/20',
    icon: Target,
    label: 'CRITICAL THREAT'
  },
  catastrophic: {
    color: 'border-red-500/60 bg-red-900/20',
    icon: Shield,
    label: 'CATASTROPHIC EVENT'
  }
};

const ADVISOR_ICONS: Record<string, any> = {
  military: Shield,
  diplomatic: Users,
  science: Brain,
  intel: Target,
  economic: Target,
  pr: Users
};

export function FlashpointModal({ flashpoint, onResolve, onTimeout }: FlashpointModalProps) {
  const [timeRemaining, setTimeRemaining] = useState(flashpoint.timeLimit);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          if (onTimeout) onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onTimeout]);

  const severity = SEVERITY_CONFIG[flashpoint.severity];
  const SeverityIcon = severity.icon;
  
  const urgencyColor = timeRemaining <= 10 ? 'text-red-400' : timeRemaining <= 30 ? 'text-orange-400' : 'text-yellow-400';

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className={`max-w-3xl border-2 ${severity.color} backdrop-blur-sm`}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SeverityIcon className="h-8 w-8 text-red-400 animate-pulse" />
              <div>
                <DialogTitle className="text-2xl font-bold text-red-300 uppercase tracking-wider">
                  {flashpoint.title}
                </DialogTitle>
                <div className="text-xs text-red-400/80 uppercase tracking-widest mt-1">
                  {severity.label}
                </div>
              </div>
            </div>
            <div className={`flex items-center gap-2 ${urgencyColor} font-mono text-2xl font-bold`}>
              <Clock className="h-6 w-6" />
              {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
            </div>
          </div>
        </DialogHeader>

        <DialogDescription className="text-base text-gray-200 leading-relaxed py-4 border-y border-white/10">
          {flashpoint.description}
        </DialogDescription>

        <div className="space-y-3 py-4">
          <div className="text-xs uppercase tracking-widest text-cyan-400 font-semibold mb-3">
            Select Response:
          </div>
          {flashpoint.options.map(option => {
            const isSelected = selectedOption === option.id;
            const successRate = Math.round(option.outcome.probability * 100);
            
            return (
              <button
                key={option.id}
                onClick={() => setSelectedOption(option.id)}
                className={`w-full text-left rounded-lg border-2 p-4 transition-all ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-500/20 shadow-lg shadow-cyan-500/50'
                    : 'border-white/20 bg-black/40 hover:border-white/40 hover:bg-white/5'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-lg font-semibold text-white">{option.text}</div>
                    <div className="text-sm text-gray-300 mt-1">{option.description}</div>
                    
                    <div className="flex gap-4 mt-3 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-green-400">Success Rate:</span>
                        <span className="text-white font-mono">{successRate}%</span>
                      </div>
                      
                      {option.advisorSupport.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-cyan-400">Support:</span>
                          <div className="flex gap-1">
                            {option.advisorSupport.map(advisor => {
                              const Icon = ADVISOR_ICONS[advisor] || Users;
                              return (
                                <Icon key={advisor} className="h-3 w-3 text-cyan-300" title={advisor} />
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      {option.advisorOppose.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-red-400">Oppose:</span>
                          <div className="flex gap-1">
                            {option.advisorOppose.map(advisor => {
                              const Icon = ADVISOR_ICONS[advisor] || Users;
                              return (
                                <Icon key={advisor} className="h-3 w-3 text-red-300" title={advisor} />
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-white/10">
          <div className="text-xs text-gray-400 italic">
            Decision will be recorded in permanent history
          </div>
          <Button
            onClick={() => selectedOption && onResolve(selectedOption)}
            disabled={!selectedOption || timeRemaining === 0}
            className="bg-red-600 hover:bg-red-500 text-white font-bold px-8 py-2 text-lg disabled:opacity-50"
          >
            {timeRemaining === 0 ? 'TIME EXPIRED' : 'EXECUTE DECISION'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
