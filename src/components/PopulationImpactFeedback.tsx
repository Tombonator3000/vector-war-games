import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PopulationImpact {
  id: string;
  casualties: number;
  targetName: string;
  timestamp: number;
}

interface PopulationImpactFeedbackProps {
  impacts: PopulationImpact[];
  onImpactComplete: (id: string) => void;
}

export function PopulationImpactFeedback({ impacts, onImpactComplete }: PopulationImpactFeedbackProps) {
  return (
    <div className="fixed top-20 right-4 z-50 pointer-events-none space-y-2">
      <AnimatePresence>
        {impacts.map((impact) => (
          <ImpactNotification
            key={impact.id}
            impact={impact}
            onComplete={() => onImpactComplete(impact.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ImpactNotification({ impact, onComplete }: { impact: PopulationImpact; onComplete: () => void }) {
  const [displayNumber, setDisplayNumber] = useState(impact.casualties);

  useEffect(() => {
    // Animate the number counting down from casualties to 0
    const duration = 2000; // 2 seconds
    const steps = 30;
    const stepDuration = duration / steps;
    const decrement = impact.casualties / steps;
    
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayNumber(0);
        clearInterval(interval);
      } else {
        setDisplayNumber(Math.round(impact.casualties - (decrement * currentStep)));
      }
    }, stepDuration);

    // Auto-dismiss after 3 seconds
    const timeout = setTimeout(onComplete, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [impact.casualties, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.8 }}
      className="bg-destructive/90 border border-destructive-foreground/20 rounded-lg p-4 backdrop-blur-sm shadow-lg min-w-[280px]"
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-destructive-foreground/10 flex items-center justify-center">
            <motion.span
              className="text-2xl"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              ☢️
            </motion.span>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-destructive-foreground mb-1">
            Nuclear Strike - {impact.targetName}
          </p>
          <div className="flex items-baseline gap-2">
            <motion.span
              key={displayNumber}
              initial={{ scale: 1.2, color: 'rgb(255, 100, 100)' }}
              animate={{ scale: 1, color: 'rgb(255, 255, 255)' }}
              className="text-2xl font-bold text-destructive-foreground tabular-nums"
            >
              -{displayNumber.toLocaleString()}
            </motion.span>
            <span className="text-xs text-destructive-foreground/70">casualties</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
