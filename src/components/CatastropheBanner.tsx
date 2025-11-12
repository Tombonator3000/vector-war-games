import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Flame, Info } from 'lucide-react';

type OverlayTone = 'info' | 'warning' | 'catastrophe';

interface CatastropheBannerProps {
  message: string;
  tone?: OverlayTone;
  expiresAt: number;
}

const toneStyles: Record<OverlayTone, { container: string; accent: string; icon: ReactElement; label: string }> = {
  info: {
    container: 'bg-sky-950/80 border-sky-500/60 text-sky-100 shadow-sky-500/20',
    accent: 'from-sky-500 via-cyan-400 to-blue-500',
    icon: <Info className="h-5 w-5" />,
    label: 'System Notice',
  },
  warning: {
    container: 'bg-amber-950/80 border-amber-500/60 text-amber-100 shadow-amber-500/20',
    accent: 'from-amber-500 via-orange-500 to-yellow-400',
    icon: <AlertTriangle className="h-5 w-5" />,
    label: 'Critical Warning',
  },
  catastrophe: {
    container: 'bg-red-950/85 border-red-500/70 text-red-100 shadow-red-500/30',
    accent: 'from-red-500 via-rose-500 to-orange-500',
    icon: <Flame className="h-5 w-5" />,
    label: 'Catastrophic Event',
  },
};

export function CatastropheBanner({ message, tone = 'warning', expiresAt }: CatastropheBannerProps) {
  const styles = toneStyles[tone];
  const [tick, setTick] = useState(() => Date.now());
  const [initialDuration, setInitialDuration] = useState(() => Math.max(expiresAt - Date.now(), 0));

  useEffect(() => {
    if (expiresAt <= Date.now()) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setTick(Date.now());
    }, 150);

    return () => {
      window.clearInterval(interval);
    };
  }, [expiresAt]);

  useEffect(() => {
    setInitialDuration(Math.max(expiresAt - Date.now(), 0));
    setTick(Date.now());
  }, [expiresAt]);

  const progress = useMemo(() => {
    if (initialDuration <= 0) {
      return 0;
    }

    const remaining = Math.max(expiresAt - tick, 0);
    return (remaining / initialDuration) * 100;
  }, [expiresAt, initialDuration, tick]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          key={expiresAt}
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
          className="pointer-events-none fixed top-6 left-1/2 z-[9999] w-full max-w-3xl -translate-x-1/2 px-4"
        >
          <div
            className={`relative overflow-hidden rounded-xl border backdrop-blur-lg shadow-2xl ${styles.container}`}
            role="status"
            aria-live="assertive"
          >
            <div className="absolute inset-x-0 top-0 h-1 overflow-hidden">
              <motion.div
                key={expiresAt}
                className={`h-full bg-gradient-to-r ${styles.accent}`}
                initial={{ width: '100%' }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: 'linear', duration: 0.15 }}
              />
            </div>

            <div className="flex items-center gap-3 px-5 py-4">
              <div className="pointer-events-none rounded-full bg-black/30 p-2 text-current shadow-inner shadow-black/40">
                {styles.icon}
              </div>
              <div className="flex flex-1 flex-col">
                <span className="text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
                  {styles.label}
                </span>
                <p className="font-semibold leading-snug text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.35)]">
                  {message}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
