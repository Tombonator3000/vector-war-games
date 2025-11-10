import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Skull,
  TrendingUp,
  TrendingDown,
  Award,
  Shield,
  Target,
  Zap
} from 'lucide-react';

export interface SpyMissionResultData {
  // Core outcome
  success: boolean;
  discovered: boolean;
  spyCaught: boolean;
  spyEliminated: boolean;
  coverBlown: boolean;

  // Context
  spyName: string;
  missionType: string;
  targetNation: string;
  narrative: string;

  // Rewards
  rewards?: {
    intel?: number;
    production?: number;
    technology?: string;
    effectMessages: string[];
  };

  // Consequences
  consequences?: {
    label: string;
    value: string | number;
    type: 'positive' | 'negative' | 'neutral';
  }[];

  // Discovery details
  discoveryDetails?: {
    howDiscovered: string;
    captureMethod?: string;
    spyFate?: 'executed' | 'imprisoned' | 'exchanged' | 'turned' | 'escaped';
    diplomaticConsequences?: string[];
  };
}

interface SpyMissionResultModalProps {
  result: SpyMissionResultData;
  onClose: () => void;
}

export function SpyMissionResultModal({ result, onClose }: SpyMissionResultModalProps) {
  // Determine primary status
  const getPrimaryStatus = () => {
    if (result.spyEliminated) return 'eliminated';
    if (result.spyCaught) return 'captured';
    if (result.discovered) return 'discovered';
    if (result.success) return 'success';
    return 'failed';
  };

  const status = getPrimaryStatus();

  // Status configurations
  const statusConfig = {
    success: {
      icon: CheckCircle2,
      color: 'text-green-400',
      border: 'border-green-500/60 bg-green-900/20',
      label: 'MISSION SUCCESSFUL',
    },
    failed: {
      icon: XCircle,
      color: 'text-yellow-400',
      border: 'border-yellow-500/60 bg-yellow-900/20',
      label: 'MISSION FAILED',
    },
    discovered: {
      icon: Eye,
      color: 'text-orange-400',
      border: 'border-orange-500/60 bg-orange-900/20',
      label: 'COVER COMPROMISED',
    },
    captured: {
      icon: AlertTriangle,
      color: 'text-red-400',
      border: 'border-red-500/60 bg-red-900/20',
      label: 'AGENT CAPTURED',
    },
    eliminated: {
      icon: Skull,
      color: 'text-red-600',
      border: 'border-red-600/60 bg-red-950/40',
      label: 'AGENT ELIMINATED',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className={`max-w-3xl border-2 ${config.border} backdrop-blur-sm max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Icon className={`h-8 w-8 ${config.color}`} />
            <div>
              <DialogTitle className={`text-2xl font-bold ${config.color} uppercase tracking-wider`}>
                {config.label}
              </DialogTitle>
              <div className="text-sm text-gray-400 mt-1">
                Operation: {result.missionType.replace(/-/g, ' ').toUpperCase()}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Agent Info */}
          <div className="border border-cyan-500/30 rounded-lg p-4 bg-cyan-900/10">
            <div className="text-xs uppercase tracking-widest text-cyan-400 font-semibold mb-2">
              Agent Information:
            </div>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-lg font-semibold text-white">{result.spyName}</div>
                <div className="text-sm text-gray-300">Target: {result.targetNation}</div>
              </div>
              <div className="text-right">
                {result.coverBlown && (
                  <div className="text-xs text-red-400 font-semibold flex items-center gap-1">
                    <EyeOff className="h-3 w-3" />
                    COVER BLOWN
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mission Narrative */}
          <div className="border border-white/20 rounded-lg p-4 bg-black/40">
            <div className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-2 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Situation Report:
            </div>
            <div className="text-base text-gray-200 leading-relaxed">
              {result.narrative}
            </div>
          </div>

          {/* Discovery Details */}
          {result.discovered && result.discoveryDetails && (
            <div className="border border-red-500/30 rounded-lg p-4 bg-red-900/10">
              <div className="text-xs uppercase tracking-widest text-red-400 font-semibold mb-3 flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Discovery Report:
              </div>
              <div className="space-y-2 text-sm text-gray-200">
                <div>
                  <span className="text-gray-400">Method: </span>
                  {result.discoveryDetails.howDiscovered}
                </div>
                {result.spyCaught && result.discoveryDetails.captureMethod && (
                  <div>
                    <span className="text-gray-400">Capture: </span>
                    {result.discoveryDetails.captureMethod}
                  </div>
                )}
                {result.discoveryDetails.spyFate && (
                  <div>
                    <span className="text-gray-400">Status: </span>
                    <span className="font-semibold text-red-300 uppercase">
                      {result.discoveryDetails.spyFate}
                    </span>
                  </div>
                )}
                {result.discoveryDetails.diplomaticConsequences && result.discoveryDetails.diplomaticConsequences.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-red-500/20">
                    <div className="text-xs uppercase text-red-400 mb-2">Diplomatic Fallout:</div>
                    {result.discoveryDetails.diplomaticConsequences.map((consequence, idx) => (
                      <div key={idx} className="text-sm text-red-200 flex items-start gap-2">
                        <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span>{consequence}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mission Rewards */}
          {result.success && result.rewards && (
            <div className="border border-green-500/30 rounded-lg p-4 bg-green-900/10">
              <div className="text-xs uppercase tracking-widest text-green-400 font-semibold mb-3 flex items-center gap-2">
                <Award className="h-4 w-4" />
                Mission Rewards:
              </div>
              <div className="space-y-2">
                {result.rewards.intel !== undefined && result.rewards.intel > 0 && (
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-400" />
                    <span className="text-sm text-gray-300">Intelligence Gained:</span>
                    <span className="text-sm font-semibold text-blue-400">
                      +{result.rewards.intel}
                    </span>
                  </div>
                )}
                {result.rewards.production !== undefined && result.rewards.production > 0 && (
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-400" />
                    <span className="text-sm text-gray-300">Production Gained:</span>
                    <span className="text-sm font-semibold text-green-400">
                      +{result.rewards.production}
                    </span>
                  </div>
                )}
                {result.rewards.technology && (
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-purple-400" />
                    <span className="text-sm text-gray-300">Technology Acquired:</span>
                    <span className="text-sm font-semibold text-purple-400">
                      {result.rewards.technology}
                    </span>
                  </div>
                )}
                {result.rewards.effectMessages.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-green-500/20">
                    <div className="text-xs uppercase text-green-400 mb-2">Mission Effects:</div>
                    {result.rewards.effectMessages.map((msg, idx) => (
                      <div key={idx} className="text-sm text-green-200 flex items-start gap-2">
                        <CheckCircle2 className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span>{msg}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Consequences */}
          {result.consequences && result.consequences.length > 0 && (
            <div className="border border-white/20 rounded-lg p-4 bg-black/40">
              <div className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-3">
                Consequences:
              </div>
              <div className="space-y-2">
                {result.consequences.map((consequence, index) => {
                  const ConsequenceIcon = consequence.type === 'positive' ? TrendingUp :
                               consequence.type === 'negative' ? TrendingDown :
                               AlertTriangle;
                  const color = consequence.type === 'positive' ? 'text-green-400' :
                                consequence.type === 'negative' ? 'text-red-400' :
                                'text-yellow-400';

                  return (
                    <div key={index} className="flex items-center gap-2">
                      <ConsequenceIcon className={`h-4 w-4 ${color}`} />
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

          {/* Additional Context for Failure */}
          {!result.success && !result.discovered && (
            <div className="border border-yellow-500/30 rounded-lg p-4 bg-yellow-900/10">
              <div className="text-xs uppercase tracking-widest text-yellow-400 font-semibold mb-2">
                Analysis:
              </div>
              <div className="text-sm text-yellow-200">
                The mission did not achieve its objectives. The agent has returned safely but without completing the operation.
                This could be due to unexpected security measures, timing issues, or other operational challenges.
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-white/10">
          <Button
            onClick={onClose}
            className={`${
              status === 'eliminated' || status === 'captured'
                ? 'bg-red-600 hover:bg-red-500'
                : 'bg-cyan-600 hover:bg-cyan-500'
            } text-white font-bold px-8 py-2`}
          >
            ACKNOWLEDGE
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
