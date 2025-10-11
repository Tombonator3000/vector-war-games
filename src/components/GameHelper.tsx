import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle, Target, Zap, Shield, Radio, Factory, Users, AlertTriangle } from 'lucide-react';

interface HelpTopic {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: string;
  tips: string[];
}

const helpTopics: HelpTopic[] = [
  {
    id: 'resources',
    title: 'Ressurser',
    icon: <Factory className="h-5 w-5" />,
    content: 'Produksjon, Uran og Intel er dine hovedressurser. Bruk dem klokt for å bygge din militærmakt.',
    tips: [
      'Produksjon brukes til raketter, bomber og forsvar',
      'Uran er nødvendig for atomstridshoder',
      'Intel brukes til forskning og spionasje',
      'Ressurser regenereres automatisk hver runde'
    ]
  },
  {
    id: 'combat',
    title: 'Kamp og Våpen',
    icon: <Zap className="h-5 w-5" />,
    content: 'Ditt arsenal inkluderer raketter, bombefly og forsvarsssystemer. Hver har sine styrker og svakheter.',
    tips: [
      'Raketter er raske men kan avskjæres',
      'Bombefly er saktere men kan returnere til base',
      'Forsvarsssystemer avskjærer innkommende angrep',
      'Større stridshoder gjør mer skade men koster mer uran'
    ]
  },
  {
    id: 'research',
    title: 'Forskning',
    icon: <Radio className="h-5 w-5" />,
    content: 'Forsk frem avanserte våpen og forsvarsssystemer. Prioriter basert på din strategi.',
    tips: [
      'Forskning tar flere runder å fullføre',
      'Noen teknologier krever forutgående forskning',
      'Større stridshoder gir mer ødeleggelseskraft',
      'Defense Grid gir permanent forsvarbonus'
    ]
  },
  {
    id: 'diplomacy',
    title: 'Diplomati',
    icon: <Users className="h-5 w-5" />,
    content: 'Bruk diplomati for å få strategiske fordeler uten å ty til våpen.',
    tips: [
      'Overvåk fiendtlige nasjoner for å avsløre deres planer',
      'Inngå traktater for å sikre fred eller allianser',
      'Sabotasje kan svekke motstandere',
      'Pass på internasjonale relasjoner'
    ]
  },
  {
    id: 'defcon',
    title: 'DEFCON System',
    icon: <AlertTriangle className="h-5 w-5" />,
    content: 'DEFCON-nivået indikerer krigsberedskap. DEFCON 5 er fred, DEFCON 1 er krig.',
    tips: [
      'DEFCON 5: Normal tid - full produksjon',
      'DEFCON 4: Økt beredskap - overvåk fiender',
      'DEFCON 3: Høy beredskap - forbered forsvar',
      'DEFCON 2: Krigstilstand nær - klar til angrep',
      'DEFCON 1: Nukleær krig - alle våpen aktivert'
    ]
  },
  {
    id: 'strategy',
    title: 'Vinnerstrategi',
    icon: <Target className="h-5 w-5" />,
    content: 'Balanser militær styrke, forskning og diplomati for å dominere.',
    tips: [
      'Beskytt din befolkning med forsvarssystemer',
      'Forsk tidlig for å få teknologisk forsprang',
      'Ikke angrip før du har nok forsvar',
      'Overvåk fiender og svar på trusler',
      'Nukleær vinter kan ødelegge alle - vær forsiktig'
    ]
  }
];

interface GameHelperProps {
  triggerButton?: boolean;
}

export function GameHelper({ triggerButton = true }: GameHelperProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {triggerButton && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => setOpen(true)}
          className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full shadow-lg"
          title="Hjelp"
        >
          <HelpCircle className="h-6 w-6" />
        </Button>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-2xl flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Spillguide
            </SheetTitle>
            <SheetDescription>
              Rask tilgang til viktige spillmekanikker og strategier
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6">
            <Accordion type="single" collapsible className="w-full">
              {helpTopics.map((topic) => (
                <AccordionItem key={topic.id} value={topic.id}>
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-2">
                      <div className="text-primary">{topic.icon}</div>
                      <span className="font-semibold">{topic.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pl-7">
                      <p className="text-sm text-muted-foreground">{topic.content}</p>
                      <div className="space-y-1.5">
                        {topic.tips.map((tip, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm">
                            <span className="text-primary mt-0.5">•</span>
                            <span>{tip}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <div className="mt-6 p-4 rounded-lg bg-muted">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Hurtigtips
            </h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Trykk ESC for å pause spillet</li>
              <li>• Klikk på nasjoner for å se deres status</li>
              <li>• Overvåk DEFCON-nivået øverst</li>
              <li>• Lagre ofte - spillet kan være uforutsigbart!</li>
            </ul>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
