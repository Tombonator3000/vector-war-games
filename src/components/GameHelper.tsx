import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle, Target, Zap, Shield, Radio, Factory, Users, AlertTriangle, RotateCcw, GraduationCap } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

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
    title: 'Resources',
    icon: <Factory className="h-5 w-5" />,
    content: 'Production, Uranium and Intelligence are your main resources. Use them wisely to build your military power.',
    tips: [
      'Production is used for missiles, bombers and defense',
      'Uranium is necessary for nuclear warheads',
      'Intelligence is used for research and espionage',
      'Resources regenerate automatically each round'
    ]
  },
  {
    id: 'combat',
    title: 'Combat and Weapons',
    icon: <Zap className="h-5 w-5" />,
    content: 'Your arsenal includes missiles, bombers and defense systems. Each has its strengths and weaknesses.',
    tips: [
      'Missiles are fast but can be intercepted',
      'Bombers are slower but can return to base',
      'Defense systems intercept incoming attacks',
      'Larger warheads do more damage but cost more uranium'
    ]
  },
  {
    id: 'research',
    title: 'Research',
    icon: <Radio className="h-5 w-5" />,
    content: 'Research advanced weapons and defense systems. Prioritize based on your strategy.',
    tips: [
      'Research takes multiple rounds to complete',
      'Some technologies require previous research',
      'Larger warheads provide more destructive power',
      'Defense Grid provides permanent defense bonus'
    ]
  },
  {
    id: 'diplomacy',
    title: 'Diplomacy',
    icon: <Users className="h-5 w-5" />,
    content: 'Use diplomacy to gain strategic advantages without resorting to weapons.',
    tips: [
      'Monitor hostile nations to reveal their plans',
      'Negotiate treaties to secure peace or alliances',
      'Sabotage can weaken opponents',
      'Watch international relations'
    ]
  },
  {
    id: 'defcon',
    title: 'DEFCON System',
    icon: <AlertTriangle className="h-5 w-5" />,
    content: 'The DEFCON level indicates combat readiness. DEFCON 5 is peace, DEFCON 1 is war.',
    tips: [
      'DEFCON 5: Peacetime - full production',
      'DEFCON 4: Increased readiness - monitor enemies',
      'DEFCON 3: High alert - prepare defense',
      'DEFCON 2: War imminent - ready to attack',
      'DEFCON 1: Nuclear war - all weapons active',
      'Council antagonism can deliberately lower DEFCON when you need wartime readiness'
    ]
  },
  {
    id: 'strategy',
    title: 'Winning Strategy',
    icon: <Target className="h-5 w-5" />,
    content: 'Balance military strength, research and diplomacy to dominate.',
    tips: [
      'Protect your population with defense systems',
      'Research early to gain a technological advantage',
      'Do not attack until you have sufficient defense',
      'Monitor enemies and respond to threats',
      'Nuclear winter can destroy everyone - be careful'
    ]
  }
];

interface GameHelperProps {
  triggerButton?: boolean;
  triggerButtonClassName?: string;
  onRestartModalTutorial?: () => void;
  onRestartInteractiveTutorial?: () => void;
}

export function GameHelper({
  triggerButton = true,
  triggerButtonClassName = 'fixed bottom-4 left-4 z-50 h-12 w-12 rounded-full shadow-lg',
  onRestartModalTutorial,
  onRestartInteractiveTutorial
}: GameHelperProps) {
  const [open, setOpen] = useState(false);

  const handleRestartModal = () => {
    if (onRestartModalTutorial) {
      onRestartModalTutorial();
      setOpen(false);
    }
  };

  const handleRestartInteractive = () => {
    if (onRestartInteractiveTutorial) {
      onRestartInteractiveTutorial();
      setOpen(false);
    }
  };

  return (
    <>
      {triggerButton && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => setOpen(true)}
          className={triggerButtonClassName}
          title="Help"
        >
          <HelpCircle className="h-6 w-6" />
        </Button>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-2xl flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Game Guide
            </SheetTitle>
            <SheetDescription>
              Quick access to important game mechanics and strategies
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

          {(onRestartModalTutorial || onRestartInteractiveTutorial) && (
            <>
              <Separator className="my-6" />
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  Tutorial Options
                </h4>
                <p className="text-sm text-muted-foreground">
                  Restart the guides to learn the game mechanics again
                </p>
                <div className="space-y-2">
                  {onRestartModalTutorial && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={handleRestartModal}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restart introductory tutorial
                    </Button>
                  )}
                  {onRestartInteractiveTutorial && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={handleRestartInteractive}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restart interactive guide
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="mt-6 p-4 rounded-lg bg-muted">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Quick Tips
            </h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Press ESC to pause the game</li>
              <li>• Click on nations to see their status</li>
              <li>• Monitor the DEFCON level at the top</li>
              <li>• Save often - the game can be unpredictable!</li>
            </ul>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
