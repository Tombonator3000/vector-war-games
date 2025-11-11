import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  DollarSign,
} from 'lucide-react';
import type { ActionConsequences, Consequence } from '@/types/consequences';

interface ActionConsequencePreviewProps {
  consequences: ActionConsequences;
  onConfirm: () => void;
  onCancel: () => void;
  isVisible: boolean;
}

export function ActionConsequencePreview({
  consequences,
  onConfirm,
  onCancel,
  isVisible,
}: ActionConsequencePreviewProps) {
  if (!isVisible) return null;

  const severityIcons = {
    positive: <CheckCircle2 className="w-4 h-4 text-green-400" />,
    neutral: <Minus className="w-4 h-4 text-gray-400" />,
    negative: <AlertCircle className="w-4 h-4 text-orange-400" />,
    critical: <XCircle className="w-4 h-4 text-red-400" />,
  };

  const severityColors = {
    positive: 'text-green-400',
    neutral: 'text-gray-400',
    negative: 'text-orange-400',
    critical: 'text-red-400',
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Consequence Card */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative z-10 max-w-2xl w-full"
      >
        <Card className="bg-gradient-to-br from-cyan-950/95 to-black/95 backdrop-blur-xl border-2 border-cyan-500/60 shadow-2xl">
          <ScrollArea className="max-h-[80vh]">
            <div className="p-6">
              {/* Header */}
              <div className="mb-6">
                <Badge variant="outline" className="mb-3 border-cyan-500/50 text-cyan-300 text-xs">
                  ACTION PREVIEW
                </Badge>
                <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-wider">
                  {consequences.actionTitle}
                </h2>
                <p className="text-cyan-200/80">{consequences.actionDescription}</p>
                {consequences.targetName && (
                  <p className="text-sm text-cyan-400 mt-1">
                    🎯 Target: <span className="font-semibold">{consequences.targetName}</span>
                  </p>
                )}
              </div>

              {/* Success Probability */}
              {consequences.successProbability !== undefined && (
                <div className="mb-6 bg-black/40 border border-cyan-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm font-semibold text-cyan-300">
                        Success Probability
                      </span>
                    </div>
                    <span
                      className={`text-lg font-bold font-mono ${
                        consequences.successProbability >= 70
                          ? 'text-green-400'
                          : consequences.successProbability >= 40
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }`}
                    >
                      {consequences.successProbability}%
                    </span>
                  </div>
                  <Progress value={consequences.successProbability} className="h-2 mb-1" />
                  {consequences.successDescription && (
                    <p className="text-xs text-cyan-300/70">{consequences.successDescription}</p>
                  )}
                </div>
              )}

              {/* Blocked Reasons */}
              {consequences.blockedReasons && consequences.blockedReasons.length > 0 && (
                <div className="mb-6 space-y-2">
                  {consequences.blockedReasons.map((reason, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 text-sm text-red-400 bg-red-900/20 border border-red-500/30 rounded p-3"
                    >
                      <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <span className="font-semibold">{reason}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Warnings */}
              {consequences.warnings && consequences.warnings.length > 0 && (
                <div className="mb-6 space-y-2">
                  {consequences.warnings.map((warning, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 text-sm text-yellow-400 bg-yellow-900/20 border border-yellow-500/30 rounded p-3"
                    >
                      <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <span>{warning}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Costs */}
              {consequences.costs && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-cyan-300 mb-3 uppercase tracking-wide flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Resource Costs
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {consequences.costs.production && (
                      <Badge
                        variant="outline"
                        className="border-cyan-500/50 text-cyan-300 bg-cyan-900/20"
                      >
                        🏭 {consequences.costs.production} Production
                      </Badge>
                    )}
                    {consequences.costs.uranium && (
                      <Badge
                        variant="outline"
                        className="border-green-500/50 text-green-300 bg-green-900/20"
                      >
                        ⚛️ {consequences.costs.uranium} Uranium
                      </Badge>
                    )}
                    {consequences.costs.intel && (
                      <Badge
                        variant="outline"
                        className="border-purple-500/50 text-purple-300 bg-purple-900/20"
                      >
                        🔍 {consequences.costs.intel} Intel
                      </Badge>
                    )}
                    {consequences.costs.actions && (
                      <Badge
                        variant="outline"
                        className="border-yellow-500/50 text-yellow-300 bg-yellow-900/20"
                      >
                        ⚡ {consequences.costs.actions} Action{consequences.costs.actions > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Immediate Consequences */}
              {consequences.immediate.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-cyan-300 mb-3 uppercase tracking-wide">
                    Immediate Effects
                  </h3>
                  <div className="space-y-2">
                    {consequences.immediate.map((consequence, idx) => (
                      <ConsequenceItem key={idx} consequence={consequence} severityIcons={severityIcons} severityColors={severityColors} />
                    ))}
                  </div>
                </div>
              )}

              {/* Long-term Consequences */}
              {consequences.longTerm.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-cyan-300 mb-3 uppercase tracking-wide">
                    Long-term Effects
                  </h3>
                  <div className="space-y-2">
                    {consequences.longTerm.map((consequence, idx) => (
                      <ConsequenceItem key={idx} consequence={consequence} severityIcons={severityIcons} severityColors={severityColors} />
                    ))}
                  </div>
                </div>
              )}

              {/* Risks */}
              {consequences.risks.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-orange-300 mb-3 uppercase tracking-wide flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Potential Risks
                  </h3>
                  <div className="space-y-2">
                    {consequences.risks.map((risk, idx) => (
                      <ConsequenceItem key={idx} consequence={risk} severityIcons={severityIcons} severityColors={severityColors} />
                    ))}
                  </div>
                </div>
              )}

              {/* DEFCON Change */}
              {consequences.defconChange && consequences.defconChange.from !== consequences.defconChange.to && (
                <div className="mb-6 bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-red-300">DEFCON Level</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold font-mono text-yellow-400">
                        {consequences.defconChange.from}
                      </span>
                      <TrendingDown className="w-4 h-4 text-red-400" />
                      <span className="text-lg font-bold font-mono text-red-400">
                        {consequences.defconChange.to}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-red-400 mt-1">Escalation toward nuclear war</p>
                </div>
              )}

              {/* Relationship Changes */}
              {consequences.relationshipChanges && consequences.relationshipChanges.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-cyan-300 mb-3 uppercase tracking-wide">
                    International Relations Impact
                  </h3>
                  <div className="space-y-2">
                    {consequences.relationshipChanges.map((change, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-black/40 rounded p-2"
                      >
                        <span className="text-sm text-gray-300">{change.nation}</span>
                        <div className="flex items-center gap-2">
                          {change.change > 0 ? (
                            <TrendingUp className="w-4 h-4 text-green-400" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-400" />
                          )}
                          <span
                            className={`text-sm font-semibold font-mono ${
                              change.change > 0 ? 'text-green-400' : 'text-red-400'
                            }`}
                          >
                            {change.change > 0 ? '+' : ''}
                            {change.change}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Victory Impact */}
              {consequences.victoryImpact && (
                <div className="mb-6 bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🏆</span>
                    <div>
                      <p className="text-sm font-semibold text-purple-300">
                        {consequences.victoryImpact.victoryType}
                      </p>
                      <p className="text-xs text-purple-400">{consequences.victoryImpact.impact}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 mt-8">
                <Button
                  onClick={onCancel}
                  variant="outline"
                  className="flex-1 border-cyan-500/50 text-cyan-300 hover:bg-cyan-900/20"
                >
                  Cancel
                </Button>
                <Button
                  onClick={onConfirm}
                  disabled={consequences.blockedReasons && consequences.blockedReasons.length > 0}
                  className={`flex-1 font-bold disabled:opacity-50 disabled:cursor-not-allowed ${
                    consequences.blockedReasons && consequences.blockedReasons.length > 0
                      ? 'bg-gray-500 text-gray-300'
                      : consequences.actionTitle.toLowerCase().includes('launch') ||
                        consequences.actionTitle.toLowerCase().includes('nuclear') ||
                        consequences.actionTitle.toLowerCase().includes('missile')
                      ? 'bg-red-600 text-white hover:bg-red-500 border-2 border-red-400 shadow-lg shadow-red-500/50 uppercase text-lg'
                      : 'bg-cyan-500 text-black hover:bg-cyan-400'
                  }`}
                >
                  {consequences.blockedReasons && consequences.blockedReasons.length > 0
                    ? 'Action Blocked'
                    : consequences.actionTitle.toLowerCase().includes('launch') ||
                      consequences.actionTitle.toLowerCase().includes('nuclear') ||
                      consequences.actionTitle.toLowerCase().includes('missile')
                    ? '🚀 LAUNCH'
                    : 'Confirm Action'}
                </Button>
              </div>
            </div>
          </ScrollArea>
        </Card>
      </motion.div>
    </div>
  );
}

interface ConsequenceItemProps {
  consequence: Consequence;
  severityIcons: Record<string, React.ReactNode>;
  severityColors: Record<string, string>;
}

function ConsequenceItem({ consequence, severityIcons, severityColors }: ConsequenceItemProps) {
  return (
    <div className="flex items-start gap-3 bg-black/40 border border-white/10 rounded p-3">
      <div className="flex-shrink-0 mt-0.5">
        {consequence.icon ? (
          <span className="text-lg">{consequence.icon}</span>
        ) : (
          severityIcons[consequence.severity]
        )}
      </div>
      <div className="flex-1">
        <p className={`text-sm ${severityColors[consequence.severity]}`}>
          {consequence.description}
        </p>
        {consequence.probability !== undefined && (
          <p className="text-xs text-gray-500 mt-1">
            Probability: {consequence.probability}%
          </p>
        )}
      </div>
    </div>
  );
}
