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
      // Only scroll if element is significantly off-screen
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const isOffScreen = rect.top < 80 || rect.bottom > viewportHeight - 80;

      if (isOffScreen) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
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
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Estimate card dimensions (max-w-md = 448px)
    const cardWidth = 448;
    const cardHeight = 250; // Approximate height

    let top = 0;
    let left = 0;
    let transform = '';

    switch (currentStep.position) {
      case 'top':
        top = rect.top - padding;
        left = rect.left + rect.width / 2;
        transform = 'translate(-50%, -100%)';

        // Check if card would go off top
        if (top - cardHeight < padding) {
          // Switch to bottom position
          top = rect.bottom + padding;
          transform = 'translate(-50%, 0)';
        }
        break;
      case 'bottom':
        top = rect.bottom + padding;
        left = rect.left + rect.width / 2;
        transform = 'translate(-50%, 0)';

        // Check if card would go off bottom
        if (top + cardHeight > viewportHeight - padding) {
          // Switch to top position
          top = rect.top - padding;
          transform = 'translate(-50%, -100%)';
        }
        break;
      case 'left':
        top = rect.top + rect.height / 2;
        left = rect.left - padding;
        transform = 'translate(-100%, -50%)';

        // Check if card would go off left
        if (left - cardWidth < padding) {
          // Switch to right position
          left = rect.right + padding;
          transform = 'translate(0, -50%)';
        }
        break;
      case 'right':
        top = rect.top + rect.height / 2;
        left = rect.right + padding;
        transform = 'translate(0, -50%)';

        // Check if card would go off right
        if (left + cardWidth > viewportWidth - padding) {
          // Switch to left position
          left = rect.left - padding;
          transform = 'translate(-100%, -50%)';
        }
        break;
      default:
        return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }

    // Final boundary checks to clamp position within viewport
    if (transform === 'translate(-50%, -50%)') {
      // Center vertical alignment
      top = Math.max(cardHeight / 2 + padding, Math.min(viewportHeight - cardHeight / 2 - padding, top));
    } else if (transform === 'translate(-50%, 0)' || transform === 'translate(-50%, -100%)') {
      // Horizontal centering - ensure it doesn't go off sides
      const halfCardWidth = cardWidth / 2;
      left = Math.max(halfCardWidth + padding, Math.min(viewportWidth - halfCardWidth - padding, left));
    } else if (transform === 'translate(0, -50%)' || transform === 'translate(-100%, -50%)') {
      // Vertical centering - ensure it doesn't go off top/bottom
      const halfCardHeight = cardHeight / 2;
      top = Math.max(halfCardHeight + padding, Math.min(viewportHeight - halfCardHeight - padding, top));
    }

    return { top: `${top}px`, left: `${left}px`, transform };
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
          <Card className="p-6 max-w-md max-h-[80vh] overflow-y-auto bg-gradient-to-br from-cyan-950/95 to-black/95 backdrop-blur-xl border-2 border-cyan-500/60 shadow-2xl shadow-cyan-500/20">
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
