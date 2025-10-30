import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import type { MajorDecision, MajorDecisionOption } from '@/types/majorDecision';

interface MajorDecisionModalProps {
  decision: MajorDecision;
  playerResources: {
    production: number;
    uranium: number;
    intel: number;
    influence: number;
    alliances: number;
    territories: number;
  };
  onChoose: (optionId: string) => void;
  isVisible: boolean;
  timeRemaining?: number; // Seconds
}

export function MajorDecisionModal({
  decision,
  playerResources,
  onChoose,
  isVisible,
  timeRemaining,
}: MajorDecisionModalProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  if (!isVisible) return null;

  const categoryColors = {
    diplomatic: 'from-blue-900/95 to-cyan-900/95 border-blue-500',
    military: 'from-red-900/95 to-orange-900/95 border-red-500',
    economic: 'from-green-900/95 to-emerald-900/95 border-green-500',
    technological: 'from-purple-900/95 to-violet-900/95 border-purple-500',
  };

  const categoryIcons = {
    diplomatic: '🤝',
    military: '⚔️',
    economic: '💰',
    technological: '🚀',
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/85 backdrop-blur-sm"
      />

      {/* Decision Card */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative z-10 max-w-4xl w-full"
      >
        <Card
          className={`bg-gradient-to-br ${categoryColors[decision.category]} backdrop-blur-xl border-2 shadow-2xl`}
        >
          <ScrollArea className="max-h-[85vh]">
            <div className="p-6">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <Badge
                    variant="outline"
                    className="border-white/50 text-white text-xs uppercase"
                  >
                    {categoryIcons[decision.category]} {decision.category}
                  </Badge>
                  {timeRemaining !== undefined && (
                    <div className="flex items-center gap-2 px-3 py-1 rounded bg-yellow-900/30 border border-yellow-500/50">
                      <Clock className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm font-mono text-yellow-400">
                        {Math.floor(timeRemaining / 60)}:
                        {String(timeRemaining % 60).padStart(2, '0')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-4">
                  <span className="text-6xl">{decision.icon}</span>
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-white mb-2 uppercase tracking-wider">
                      {decision.title}
                    </h2>
                    <p className="text-white/80 text-lg">{decision.description}</p>
                  </div>
                </div>

                {decision.isVoting && (
                  <div className="mt-4 p-3 rounded bg-blue-900/30 border border-blue-500/50">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-400" />
                      <p className="text-sm text-blue-300">
                        <strong>Global Vote:</strong> All nations will vote. Majority
                        decides outcome.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="space-y-4 mb-6">
                {decision.options.map((option) => (
                  <DecisionOptionCard
                    key={option.id}
                    option={option}
                    playerResources={playerResources}
                    isSelected={selectedOption === option.id}
                    onSelect={() => setSelectedOption(option.id)}
                  />
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={() => onChoose('defer')}
                  variant="outline"
                  className="flex-1 border-white/30 text-white hover:bg-white/10"
                >
                  Decide Later
                </Button>
                <Button
                  onClick={() => selectedOption && onChoose(selectedOption)}
                  disabled={!selectedOption}
                  className="flex-1 bg-white text-black hover:bg-white/90 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Choice
                </Button>
              </div>
            </div>
          </ScrollArea>
        </Card>
      </motion.div>
    </div>
  );
}

interface DecisionOptionCardProps {
  option: MajorDecisionOption;
  playerResources: {
    production: number;
    uranium: number;
    intel: number;
    influence: number;
    alliances: number;
    territories: number;
  };
  isSelected: boolean;
  onSelect: () => void;
}

function DecisionOptionCard({
  option,
  playerResources,
  isSelected,
  onSelect,
}: DecisionOptionCardProps) {
  // Check if requirements are met
  const requirementsMet =
    !option.requirements ||
    Object.entries(option.requirements).every(([key, value]) => {
      const resourceKey = key.replace('min', '').toLowerCase();
      return playerResources[resourceKey] >= value;
    });

  // Check if costs are affordable
  const canAfford =
    !option.costs ||
    Object.entries(option.costs).every(([key, value]) => {
      return playerResources[key] >= value;
    });

  const isAvailable = requirementsMet && canAfford;

  return (
    <div
      onClick={() => isAvailable && onSelect()}
      className={`p-4 rounded-lg border-2 transition cursor-pointer ${
        isSelected
          ? 'border-cyan-400 bg-cyan-900/30'
          : isAvailable
          ? 'border-white/30 bg-black/40 hover:border-white/50 hover:bg-black/60'
          : 'border-red-500/30 bg-red-900/10 opacity-60 cursor-not-allowed'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-1">{option.title}</h3>
          <p className="text-sm text-white/70">{option.description}</p>
        </div>
        {isSelected && <CheckCircle2 className="w-6 h-6 text-cyan-400 flex-shrink-0" />}
      </div>

      {/* Requirements */}
      {option.requirements && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-white/60 mb-2 uppercase">
            Requirements
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(option.requirements).map(([key, value]) => {
              const resourceKey = key.replace('min', '').toLowerCase();
              const current = playerResources[resourceKey];
              const met = current >= value;

              return (
                <Badge
                  key={key}
                  variant="outline"
                  className={`text-xs ${
                    met
                      ? 'border-green-500/50 text-green-400'
                      : 'border-red-500/50 text-red-400'
                  }`}
                >
                  {met ? '✓' : '✗'} {key.replace('min', '')}: {current}/{value}
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Costs */}
      {option.costs && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-white/60 mb-2 uppercase">Costs</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(option.costs).map(([key, value]) => {
              const current = playerResources[key];
              const canAfford = current >= value;

              return (
                <Badge
                  key={key}
                  variant="outline"
                  className={`text-xs ${
                    canAfford
                      ? 'border-yellow-500/50 text-yellow-400'
                      : 'border-red-500/50 text-red-400'
                  }`}
                >
                  {key === 'production' && '🏭'}
                  {key === 'uranium' && '⚛️'}
                  {key === 'intel' && '🔍'}
                  {key === 'influence' && '📊'} {value} {key}
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Effects */}
      <div className="space-y-2">
        {/* Immediate */}
        {option.effects.immediate.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-green-300 mb-1 uppercase flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Immediate Effects
            </p>
            <div className="space-y-1">
              {option.effects.immediate.map((effect, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span className="text-white/80">{effect}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Long-term */}
        {option.effects.longTerm.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-blue-300 mb-1 uppercase flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />
              Long-term Effects
            </p>
            <div className="space-y-1">
              {option.effects.longTerm.map((effect, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span className="text-white/80">{effect}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Unavailable warning */}
      {!isAvailable && (
        <div className="mt-3 flex items-start gap-2 text-xs text-red-400 bg-red-900/20 rounded p-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            {!requirementsMet
              ? 'Requirements not met'
              : 'Insufficient resources'}
          </span>
        </div>
      )}
    </div>
  );
}
