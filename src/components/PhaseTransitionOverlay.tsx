import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface PhaseTransitionOverlayProps {
  phase: 'PLAYER' | 'AI' | 'RESOLUTION' | 'PRODUCTION';
  isTransitioning: boolean;
  overlayMessage?: string | null;
}

export function PhaseTransitionOverlay({ phase, isTransitioning, overlayMessage }: PhaseTransitionOverlayProps) {
  const hasOverlayMessage = Boolean(overlayMessage);

  const shouldShow =
    (isTransitioning && (phase === 'AI' || phase === 'RESOLUTION' || phase === 'PRODUCTION')) || hasOverlayMessage;

  const getMessage = () => {
    switch (phase) {
      case 'AI':
        return {
          title: 'AI NATIONS ACTING',
          subtitle: 'Processing rival strategies...',
          color: 'from-red-500 to-orange-500',
        };
      case 'RESOLUTION':
        return {
          title: 'RESOLVING TURN',
          subtitle: 'Calculating combat outcomes...',
          color: 'from-yellow-500 to-orange-500',
        };
      case 'PRODUCTION':
        return {
          title: 'PRODUCTION PHASE',
          subtitle: 'Generating resources...',
          color: 'from-green-500 to-cyan-500',
        };
      case 'PLAYER':
        return {
          title: 'PLAYER TURN',
          subtitle: 'Coordinate strategic orders...',
          color: 'from-cyan-500 to-blue-500',
        };
      default:
        return {
          title: 'PROCESSING',
          subtitle: 'Please wait...',
          color: 'from-cyan-500 to-blue-500',
        };
    }
  };

  const message = getMessage();

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9998] pointer-events-none"
        >
          {/* Corner card */}
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20 }}
            transition={{ type: 'spring', damping: 20 }}
            className="pointer-events-none fixed top-6 right-6 z-10"
          >
            <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-cyan-500/60 rounded-lg shadow-2xl shadow-cyan-500/20 p-6 min-w-[320px]">
              {/* Animated gradient bar */}
              <div className="mb-6 h-1 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full bg-gradient-to-r ${message.color}`}
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    ease: 'linear',
                  }}
                />
              </div>

              {/* Content */}
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />

                <div className="text-center">
                  <h2 className="text-2xl font-bold text-cyan-100 uppercase tracking-wider mb-2">
                    {message.title}
                  </h2>
                  <p className="text-sm text-cyan-300/70 font-mono">
                    {message.subtitle}
                  </p>
                  {hasOverlayMessage && (
                    <p className="mt-3 text-base font-semibold uppercase tracking-[0.4em] text-cyan-100">
                      {overlayMessage}
                    </p>
                  )}
                </div>

                {/* Pulsing dots */}
                <div className="flex gap-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-cyan-400 rounded-full"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.5,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
