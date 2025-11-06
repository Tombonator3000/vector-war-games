import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, X, Target, Shield, Zap, Users, Radio, Factory, Radar } from 'lucide-react';

interface TutorialStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  tips: string[];
}

const tutorialSteps: TutorialStep[] = [
  {
    title: 'Velkommen til NORAD Command',
    description: 'Du er kommandør for en supermakt i atomtidsalderen. Ditt mål er å overleve og dominere gjennom strategi, diplomati og militær makt.',
    icon: <Target className="h-12 w-12" />,
    tips: [
      'Følg DEFCON-nivået - jo lavere, jo nærmere krig',
      'Hver runde har ulike faser: Spiller → AI → Oppgjør',
      'Ressurser er nøkkelen til suksess'
    ]
  },
  {
    title: 'Ressurser og Produksjon',
    description: 'Tre hovedressurser driver din nasjon: Produksjon (bygge våpen), Uran (lage stridshoder) og Intel (spionasje og forskning).',
    icon: <Factory className="h-12 w-12" />,
    tips: [
      'Produksjon: Bygg raketter, bomber og forsvar',
      'Uran: Nødvendig for atomstridshoder',
      'Intel: Forskning og spionasjeoppdrag',
      'Ressurser regenereres hver runde'
    ]
  },
  {
    title: 'Militær Styrke',
    description: 'Ditt arsenal består av raketter, bombefly og forsvarsssystemer. Strategisk plassering og timing er kritisk.',
    icon: <Zap className="h-12 w-12" />,
    tips: [
      'Raketter: Langtrekkende angrep, men kan avskjæres',
      'Bombefly: Trege men kraftige, kan returnere',
      'Forsvar: Avskjærer fiendtlige angrep',
      'Stridshoder: Fra 10MT til 200MT - større = mer ødeleggelse'
    ]
  },
  {
    title: 'Forskning og Teknologi',
    description: 'Forsk frem mektigere våpen og forsvarsssystemer. Hver teknologi tar flere runder å fullføre.',
    icon: <Radio className="h-12 w-12" />,
    tips: [
      'Start med små stridshoder (10-20MT)',
      'Forsk deg opp til 200MT "Planet Cracker"',
      'Orbital Defense Grid gir permanent forsvar',
      'Counterintelligence øker intel-produksjon'
    ]
  },
  {
    title: 'Diplomati og Strategi',
    description: 'Ikke alle konflikter løses med atomvåpen. Bruk diplomati, spionasje og allianser for å få overtaket.',
    icon: <Users className="h-12 w-12" />,
    tips: [
      'Overvåk fiendtlige nasjoner',
      'Bygg allianser gjennom traktater',
      'Sabotér fiendtlig produksjon',
      'Vær obs på DEFCON - lav = høy spenning'
    ]
  },
  {
    title: 'Strategisk Outliner',
    description: 'Det neonfargede panelet ved kommandolinjen viser pågående kriser og gir snarveier til makro-handlinger.',
    icon: <Radar className="h-12 w-12" />,
    tips: [
      'Trykk ALT+O for å vise eller skjule outlineren under spillets gang',
      'SHIFT + ALT + O komprimerer panelet til en kort situasjonsrapport',
      'Makro-knappene åpner Intel Ops, Policy Board, Strike Planner og Bio Lab direkte',
      'Blinkende varsler markerer kritiske pandemier eller frontlinjer som krever respons'
    ]
  },
  {
    title: 'Vinn Spillet',
    description: 'Utkonkurrér motstanderne ved å kombinere militær makt, teknologi og strategi. Overlev nukleær vinter og eliminér trusler.',
    icon: <Shield className="h-12 w-12" />,
    tips: [
      'Beskytt din sivilbefolkning',
      'Eliminer fiender før de blir for sterke',
      'Balanser angrep og forsvar',
      'Vær forberedt på gjengjeldelseslag'
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
            <Badge variant="outline">Steg {currentStep + 1} av {tutorialSteps.length}</Badge>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm uppercase tracking-wide opacity-70">Viktige tips</h4>
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
            Forrige
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
              Neste
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleClose}>
              Start Spillet
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
