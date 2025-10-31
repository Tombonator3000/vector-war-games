import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Zap, Skull } from 'lucide-react';
import { GameEra, FeatureUnlockInfo } from '@/types/era';

interface EraTransitionOverlayProps {
  isVisible: boolean;
  newEra: GameEra;
  eraName: string;
  eraDescription: string;
  unlockedFeatures: FeatureUnlockInfo[];
  onDismiss: () => void;
}

const ERA_ICONS: Record<GameEra, React.ReactNode> = {
  early: <Zap className="w-16 h-16 text-cyan-400" />,
  mid: <Sparkles className="w-16 h-16 text-yellow-400" />,
  late: <Skull className="w-16 h-16 text-red-400" />,
};

const ERA_COLORS: Record<GameEra, string> = {
  early: 'from-cyan-900/95 to-blue-900/95 border-cyan-500',
  mid: 'from-yellow-900/95 to-orange-900/95 border-yellow-500',
  late: 'from-red-900/95 to-purple-900/95 border-red-500',
};

export function EraTransitionOverlay({
  isVisible,
  newEra,
  eraName,
  eraDescription,
  unlockedFeatures,
  onDismiss,
}: EraTransitionOverlayProps) {
  if (!isVisible) return null;

  const categoryIcons: Record<string, string> = {
    military: '⚔️',
    diplomacy: '🤝',
    technology: '🔬',
    victory: '🏆',
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onDismiss}
        />

        {/* Era Card */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="relative z-10 max-w-2xl w-full"
        >
          <Card
            className={`bg-gradient-to-br ${ERA_COLORS[newEra]} backdrop-blur-xl border-2 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden`}
          >
            <div className="p-6 sm:p-8 overflow-y-auto flex flex-col gap-6">
              {/* Header */}
              <div className="flex flex-col items-center gap-4 text-center">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: 'spring', damping: 10 }}
                >
                  {ERA_ICONS[newEra]}
                </motion.div>

                <Badge
                  variant="outline"
                  className="mb-3 border-white/50 text-white text-xs uppercase tracking-wider"
                >
                  New Era Unlocked
                </Badge>

                <h2 className="text-3xl sm:text-4xl font-bold text-white text-center uppercase tracking-wider">
                  {eraName}
                </h2>

                <p className="text-white/80 text-base sm:text-lg">{eraDescription}</p>
              </div>

              {/* Unlocked Features */}
              {unlockedFeatures.length > 0 && (
                <div className="flex flex-col gap-4">
                  <h3 className="text-white font-semibold text-center text-lg uppercase tracking-wide">
                    🎉 Systems Now Available
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {unlockedFeatures.map((feature, index) => (
                      <motion.div
                        key={feature.feature}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className="bg-black/40 border border-white/20 rounded-lg p-3"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl flex-shrink-0">
                            {feature.icon || categoryIcons[feature.category]}
                          </span>
                          <div className="flex-1">
                            <h4 className="text-white font-semibold text-sm">
                              {feature.name}
                            </h4>
                            <p className="text-white/70 text-xs">{feature.description}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dismiss Button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex justify-center"
              >
                <Button
                  onClick={onDismiss}
                  size="lg"
                  autoFocus
                  className="bg-white text-black hover:bg-white/90 font-bold uppercase tracking-wider px-8 w-full sm:w-auto"
                >
                  Continue
                </Button>
              </motion.div>
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
