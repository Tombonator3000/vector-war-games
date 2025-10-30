import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, ArrowRight } from 'lucide-react';
import { useTutorialContext } from '@/contexts/TutorialContext';

export function TutorialOverlay() {
  const { currentStep, tutorialEnabled, dismissCurrentStep, skipTutorial } = useTutorialContext();
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!currentStep?.highlightElement || !tutorialEnabled) {
      setTargetElement(null);
      return;
    }

    const element = document.querySelector(currentStep.highlightElement) as HTMLElement;
    setTargetElement(element);

    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentStep, tutorialEnabled]);

  if (!tutorialEnabled || !currentStep) {
    return null;
  }

  const getPosition = () => {
    if (!targetElement) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }

    const rect = targetElement.getBoundingClientRect();
    const padding = 20;

    switch (currentStep.position) {
      case 'top':
        return { top: `${rect.top - padding}px`, left: `${rect.left + rect.width / 2}px`, transform: 'translate(-50%, -100%)' };
      case 'bottom':
        return { top: `${rect.bottom + padding}px`, left: `${rect.left + rect.width / 2}px`, transform: 'translate(-50%, 0)' };
      case 'left':
        return { top: `${rect.top + rect.height / 2}px`, left: `${rect.left - padding}px`, transform: 'translate(-100%, -50%)' };
      case 'right':
        return { top: `${rect.top + rect.height / 2}px`, left: `${rect.right + padding}px`, transform: 'translate(0, -50%)' };
      default:
        return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] pointer-events-none">
        {/* Dark overlay with spotlight effect */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 pointer-events-auto"
          onClick={dismissCurrentStep}
        />

        {/* Highlight border around target element */}
        {targetElement && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute border-2 border-cyan-400 rounded animate-pulse shadow-[0_0_20px_rgba(34,211,238,0.6)] pointer-events-none"
            style={{
              top: `${targetElement.getBoundingClientRect().top - 4}px`,
              left: `${targetElement.getBoundingClientRect().left - 4}px`,
              width: `${targetElement.getBoundingClientRect().width + 8}px`,
              height: `${targetElement.getBoundingClientRect().height + 8}px`,
            }}
          />
        )}

        {/* Tutorial card */}
        <motion.div
          key={currentStep.stage}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="absolute pointer-events-auto"
          style={getPosition()}
        >
          <Card className="p-6 max-w-md bg-gradient-to-br from-cyan-950/95 to-black/95 backdrop-blur-xl border-2 border-cyan-500/60 shadow-2xl shadow-cyan-500/20">
            <div className="flex items-start justify-between mb-4">
              <Badge variant="outline" className="text-xs border-cyan-500/50 text-cyan-300">
                Tutorial
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={skipTutorial}
                className="h-6 w-6 -mt-2 -mr-2 text-cyan-400 hover:text-cyan-300"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <h3 className="text-xl font-bold mb-2 text-cyan-100 uppercase tracking-wider">
              {currentStep.title}
            </h3>
            <p className="text-sm text-cyan-200/80 mb-6 leading-relaxed">
              {currentStep.description}
            </p>

            <div className="flex items-center justify-between gap-2">
              <button
                onClick={skipTutorial}
                className="text-xs text-cyan-400/70 hover:text-cyan-400 transition"
              >
                Skip Tutorial
              </button>

              <Button
                size="sm"
                onClick={dismissCurrentStep}
                className="bg-cyan-500 text-black hover:bg-cyan-400 flex items-center gap-2"
              >
                Next
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
