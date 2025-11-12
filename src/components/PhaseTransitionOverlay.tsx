import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Flame, Info, Loader2, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

type OverlayTone = 'info' | 'warning' | 'catastrophe';

interface OverlayPayload {
  text: string;
  tone?: OverlayTone;
  expiresAt?: number;
}

interface PhaseTransitionOverlayProps {
  phase: 'PLAYER' | 'AI' | 'RESOLUTION' | 'PRODUCTION';
  isTransitioning: boolean;
  defcon: number;
  overlay?: OverlayPayload | null;
}

const overlayToneStyles: Record<OverlayTone, { container: string; accent: string; label: string; Icon: LucideIcon }> = {
  info: {
    container: 'bg-sky-950/40 border-sky-500/40 text-sky-100',
    accent: 'text-sky-300',
    label: 'System Notice',
    Icon: Info,
  },
  warning: {
    container: 'bg-amber-950/40 border-amber-500/40 text-amber-100',
    accent: 'text-amber-300',
    label: 'Critical Warning',
    Icon: AlertTriangle,
  },
  catastrophe: {
    container: 'bg-red-950/50 border-red-500/50 text-red-100',
    accent: 'text-red-300',
    label: 'Catastrophic Event',
    Icon: Flame,
  },
};

const defconStyles: Record<number, {
  background: string;
  border: string;
  glow: string;
  barGradient: string;
  loaderColor: string;
  titleColor: string;
  subtitleColor: string;
  dotColor: string;
}> = {
  5: {
    background: 'from-cyan-900/80 via-slate-950/90 to-black',
    border: 'border-cyan-400/60',
    glow: 'shadow-cyan-500/25',
    barGradient: 'from-cyan-400 via-sky-400 to-blue-500',
    loaderColor: 'text-cyan-300',
    titleColor: 'text-cyan-100',
    subtitleColor: 'text-cyan-300/70',
    dotColor: 'bg-cyan-400',
  },
  4: {
    background: 'from-emerald-900/80 via-slate-950/90 to-black',
    border: 'border-emerald-400/60',
    glow: 'shadow-emerald-500/25',
    barGradient: 'from-emerald-400 via-teal-400 to-cyan-500',
    loaderColor: 'text-emerald-300',
    titleColor: 'text-emerald-100',
    subtitleColor: 'text-emerald-200/70',
    dotColor: 'bg-emerald-400',
  },
  3: {
    background: 'from-amber-900/80 via-stone-950/90 to-black',
    border: 'border-amber-400/60',
    glow: 'shadow-amber-500/25',
    barGradient: 'from-amber-400 via-yellow-500 to-orange-500',
    loaderColor: 'text-amber-300',
    titleColor: 'text-amber-100',
    subtitleColor: 'text-amber-200/70',
    dotColor: 'bg-amber-400',
  },
  2: {
    background: 'from-orange-950/85 via-stone-950/90 to-black',
    border: 'border-orange-400/60',
    glow: 'shadow-orange-500/25',
    barGradient: 'from-orange-400 via-red-400 to-red-500',
    loaderColor: 'text-orange-200',
    titleColor: 'text-orange-100',
    subtitleColor: 'text-orange-200/70',
    dotColor: 'bg-orange-400',
  },
  1: {
    background: 'from-rose-950/85 via-red-950/90 to-black',
    border: 'border-red-400/70',
    glow: 'shadow-red-500/30',
    barGradient: 'from-rose-500 via-red-500 to-orange-500',
    loaderColor: 'text-red-200',
    titleColor: 'text-red-100',
    subtitleColor: 'text-red-200/70',
    dotColor: 'bg-red-400',
  },
};

export function PhaseTransitionOverlay({ phase, isTransitioning, defcon, overlay }: PhaseTransitionOverlayProps) {
  const shouldShow = isTransitioning && (phase === 'AI' || phase === 'RESOLUTION' || phase === 'PRODUCTION');

  const normalizedDefcon = Math.min(Math.max(Math.round(defcon), 1), 5);
  const palette = defconStyles[normalizedDefcon] ?? defconStyles[5];

  const getMessage = () => {
    switch (phase) {
      case 'AI':
        return {
          title: 'AI NATIONS ACTING',
          subtitle: 'Processing rival strategies...',
        };
      case 'RESOLUTION':
        return {
          title: 'RESOLVING TURN',
          subtitle: 'Calculating combat outcomes...',
        };
      case 'PRODUCTION':
        return {
          title: 'PRODUCTION PHASE',
          subtitle: 'Generating resources...',
        };
      case 'PLAYER':
        return {
          title: 'PLAYER TURN',
          subtitle: 'Coordinate strategic orders...',
        };
      default:
        return {
          title: 'PROCESSING',
          subtitle: 'Please wait...',
        };
    }
  };

  const message = getMessage();
  const overlayTone = overlay?.tone ?? 'info';
  const overlayStyles = overlay ? overlayToneStyles[overlayTone] ?? overlayToneStyles.info : null;

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
            <div
              className={cn(
                'bg-gradient-to-br border-2 rounded-lg shadow-2xl p-6 min-w-[320px]',
                palette.background,
                palette.border,
                palette.glow,
              )}
            >
              {/* Animated gradient bar */}
              <div className="mb-6 h-1 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className={cn('h-full bg-gradient-to-r', palette.barGradient)}
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
                <Loader2 className={cn('w-12 h-12 animate-spin', palette.loaderColor)} />

                <div className="text-center">
                  <h2 className={cn('text-2xl font-bold uppercase tracking-wider mb-2', palette.titleColor)}>
                    {message.title}
                  </h2>
                  <p className={cn('text-sm font-mono', palette.subtitleColor)}>
                    {message.subtitle}
                  </p>
                </div>

                {overlay && overlayStyles && overlay.text && (
                  <div
                    className={cn(
                      'w-full rounded-lg border px-4 py-3 text-left backdrop-blur-sm transition-all duration-150',
                      overlayStyles.container,
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-black/30 p-2 shadow-inner shadow-black/40">
                        <overlayStyles.Icon className={cn('h-4 w-4', overlayStyles.accent)} />
                      </div>
                      <div className="flex flex-1 flex-col gap-1">
                        <span className={cn('text-xs font-semibold uppercase tracking-[0.35em] opacity-80', overlayStyles.accent)}>
                          {overlayStyles.label}
                        </span>
                        <p className="text-sm font-medium leading-snug text-white/90">
                          {overlay.text}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pulsing dots */}
                <div className="flex gap-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className={cn('w-2 h-2 rounded-full', palette.dotColor)}
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
