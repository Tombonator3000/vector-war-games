import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, Skull, Building2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface VictoryProgressPanelProps {
  militaryProgress: number; // 0-100
  economicProgress: number; // 0-100
  culturalProgress: number; // 0-100
  isVisible: boolean;
}

export function VictoryProgressPanel({
  militaryProgress,
  economicProgress,
  culturalProgress,
  isVisible,
}: VictoryProgressPanelProps) {
  if (!isVisible) return null;

  const progressItems = [
    {
      icon: Skull,
      label: 'Military',
      progress: militaryProgress,
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
      progressColor: 'bg-red-500',
    },
    {
      icon: Building2,
      label: 'Economic',
      progress: economicProgress,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      progressColor: 'bg-green-500',
    },
    {
      icon: Sparkles,
      label: 'Cultural',
      progress: culturalProgress,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      progressColor: 'bg-purple-500',
    },
  ];

  const maxProgress = Math.max(militaryProgress, economicProgress, culturalProgress);
  const isCloseToVictory = maxProgress >= 70;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-24 right-6 z-30 w-72"
    >
      <Card className="bg-black/90 border-cyan-500/60 shadow-xl shadow-cyan-500/20">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            <Trophy className={`w-5 h-5 ${isCloseToVictory ? 'text-yellow-400 animate-pulse' : 'text-cyan-400'}`} />
            <h3 className="text-sm font-bold text-cyan-100 uppercase tracking-wider">
              Victory Progress
            </h3>
          </div>

          {/* Progress bars */}
          <div className="space-y-4">
            {progressItems.map((item) => {
              const Icon = item.icon;
              const isLeading = item.progress === maxProgress && item.progress > 0;

              return (
                <div key={item.label}>
                  {/* Label */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${item.color}`} />
                      <span className="text-xs font-mono text-cyan-200">
                        {item.label}
                      </span>
                      {isLeading && maxProgress >= 50 && (
                        <span className="text-[10px] text-yellow-400 font-bold animate-pulse">
                          LEADING
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono text-cyan-300 font-bold">
                      {Math.round(item.progress)}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.progress}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className={`h-full ${item.progressColor} ${
                        item.progress >= 90 ? 'animate-pulse' : ''
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Victory warning */}
          {isCloseToVictory && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded"
            >
              <p className="text-xs text-yellow-200 text-center font-mono">
                ⚠️ Victory approaching! Press your advantage!
              </p>
            </motion.div>
          )}

          {/* Info text */}
          <p className="mt-3 text-[10px] text-cyan-400/60 text-center">
            First to 100% wins
          </p>
        </div>
      </Card>
    </motion.div>
  );
}
