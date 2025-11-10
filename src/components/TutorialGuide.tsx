import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, X, Target, Shield, Zap, Users, Radio, Factory } from 'lucide-react';

interface TutorialStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  tips: string[];
}

const tutorialSteps: TutorialStep[] = [
  {
    title: 'Welcome to NORAD Command',
    description: 'You are the commander of a superpower in the atomic age. Your goal is to survive and dominate through strategy, diplomacy, and military power.',
    icon: <Target className="h-12 w-12" />,
    tips: [
      'Follow the DEFCON level - the lower, the closer to war',
      'Each round has different phases: Player → AI → Resolution',
      'Resources are the key to success'
    ]
  },
  {
    title: 'Resources and Production',
    description: 'Three main resources drive your nation: Production (build weapons), Uranium (create warheads), and Intel (espionage and research).',
    icon: <Factory className="h-12 w-12" />,
    tips: [
      'Production: Build missiles, bombers, and defense',
      'Uranium: Necessary for nuclear warheads',
      'Intel: Research and espionage missions',
      'Resources regenerate each round'
    ]
  },
  {
    title: 'Military Power',
    description: 'Your arsenal consists of missiles, bombers, and defense systems. Strategic placement and timing are critical.',
    icon: <Zap className="h-12 w-12" />,
    tips: [
      'Missiles: Long-range attacks, but can be intercepted',
      'Bombers: Slow but powerful, can return',
      'Defense: Intercepts enemy attacks',
      'Warheads: From 10MT to 200MT - larger = more destruction'
    ]
  },
  {
    title: 'Research and Technology',
    description: 'Research more powerful weapons and defense systems. Each technology takes several rounds to complete.',
    icon: <Radio className="h-12 w-12" />,
    tips: [
      'Start with small warheads (10-20MT)',
      'Research up to 200MT "Planet Cracker"',
      'Orbital Defense Grid provides permanent defense',
      'Counterintelligence increases intel production'
    ]
  },
  {
    title: 'Diplomacy and Strategy',
    description: 'Not all conflicts are resolved with nuclear weapons. Use diplomacy, espionage, and alliances to gain the upper hand.',
    icon: <Users className="h-12 w-12" />,
    tips: [
      'Monitor hostile nations',
      'Build alliances through treaties',
      'Sabotage enemy production',
      'Watch DEFCON - low = high tension'
    ]
  },
  {
    title: 'Win the Game',
    description: 'Outcompete opponents by combining military power, technology, and strategy. Survive nuclear winter and eliminate threats.',
    icon: <Shield className="h-12 w-12" />,
    tips: [
      'Protect your civilian population',
      'Eliminate enemies before they become too strong',
      'Balance offense and defense',
      'Be prepared for retaliatory strikes'
    ]
  }
];

interface TutorialGuideProps {
  open: boolean;
  onClose: () => void;
}

export function TutorialGuide({ open, onClose }: TutorialGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    onClose();
  };

  const step = tutorialSteps[currentStep];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl flex items-center gap-3">
              <div className="text-primary">{step?.icon}</div>
              {step?.title}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="text-base mt-2">
            {step?.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline">Step {currentStep + 1} of {tutorialSteps.length}</Badge>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm uppercase tracking-wide opacity-70">Important Tips</h4>
            <ul className="space-y-2">
              {step?.tips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-1">▸</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-1">
            {tutorialSteps.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 w-2 rounded-full transition-all ${
                  idx === currentStep ? 'bg-primary w-6' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {currentStep < tutorialSteps.length - 1 ? (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleClose}>
              Start Game
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
