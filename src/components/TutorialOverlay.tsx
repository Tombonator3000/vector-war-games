import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target?: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  allowSkip?: boolean;
}

interface TutorialOverlayProps {
  steps: TutorialStep[];
  onComplete: () => void;
  onSkip: () => void;
}

export function TutorialOverlay({ steps, onComplete, onSkip }: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

  const step = steps[currentStep];

  useEffect(() => {
    if (step.target) {
      const element = document.querySelector(step.target) as HTMLElement;
      setTargetElement(element);
      
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setTargetElement(null);
    }
  }, [step]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getPosition = () => {
    if (!targetElement) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }

    const rect = targetElement.getBoundingClientRect();
    const padding = 20;

    switch (step.position) {
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
        {/* Spotlight effect */}
        {targetElement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 pointer-events-auto"
            style={{
              clipPath: targetElement
                ? `polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${targetElement.getBoundingClientRect().left - 8}px ${targetElement.getBoundingClientRect().top - 8}px, ${targetElement.getBoundingClientRect().left - 8}px ${targetElement.getBoundingClientRect().bottom + 8}px, ${targetElement.getBoundingClientRect().right + 8}px ${targetElement.getBoundingClientRect().bottom + 8}px, ${targetElement.getBoundingClientRect().right + 8}px ${targetElement.getBoundingClientRect().top - 8}px, ${targetElement.getBoundingClientRect().left - 8}px ${targetElement.getBoundingClientRect().top - 8}px)`
                : undefined,
            }}
          />
        )}

        {/* Tutorial card */}
        <motion.div
          key={step.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="absolute pointer-events-auto"
          style={getPosition()}
        >
          <Card className="p-6 max-w-md bg-background/95 backdrop-blur-xl border-primary/20 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <Badge variant="outline" className="text-xs">
                Steg {currentStep + 1} av {steps.length}
              </Badge>
              {step.allowSkip !== false && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onSkip}
                  className="h-6 w-6 -mt-2 -mr-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <h3 className="text-xl font-bold mb-2 text-primary">{step.title}</h3>
            <p className="text-sm text-muted-foreground mb-6">{step.description}</p>

            <div className="flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Forrige
              </Button>

              <div className="flex gap-1">
                {steps.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === currentStep ? 'w-6 bg-primary' : 'w-1.5 bg-muted'
                    }`}
                  />
                ))}
              </div>

              <Button size="sm" onClick={handleNext}>
                {currentStep < steps.length - 1 ? (
                  <>
                    Neste
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                ) : (
                  'Fullfør'
                )}
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
