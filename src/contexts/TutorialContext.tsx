import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

export type TutorialStage =
  | 'welcome'
  | 'first-launch'
  | 'defcon-intro'
  | 'research-intro'
  | 'intel-intro'
  | 'victory-paths'
  | 'completed';

interface TutorialStep {
  stage: TutorialStage;
  title: string;
  description: string;
  highlightElement?: string; // CSS selector for highlighting
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  minTurn?: number; // Minimum turn to show this step
  maxTurn?: number; // Maximum turn to show this step
  condition?: () => boolean; // Custom condition
}

interface TutorialContextType {
  currentStage: TutorialStage;
  tutorialEnabled: boolean;
  currentStep: TutorialStep | null;
  showOverlay: boolean;
  progressDisclosure: {
    showResearch: boolean;
    showIntel: boolean;
    showCulture: boolean;
    showDiplomacy: boolean;
    showPandemic: boolean;
  };
  advanceStage: (stage: TutorialStage) => void;
  skipTutorial: () => void;
  enableTutorial: () => void;
  updateTurn: (turn: number) => void;
  dismissCurrentStep: () => void;
}

const TutorialContext = createContext<TutorialContextType | null>(null);

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    stage: 'welcome',
    title: 'Welcome to NORAD VECTOR',
    description: 'Command your nation through the Cold War. Build missiles, manage resources, and pursue victory through military, economic, or cultural dominance.',
    position: 'center',
    minTurn: 1,
    maxTurn: 1,
  },
  {
    stage: 'first-launch',
    title: 'Strategic Production',
    description: 'Build your first ICBM. Click the BUILD button to open the production menu. Missiles are your primary weapon.',
    highlightElement: '[data-tutorial="build-button"]',
    position: 'left',
    minTurn: 1,
    maxTurn: 3,
  },
  {
    stage: 'defcon-intro',
    title: 'DEFCON System',
    description: 'DEFCON controls what weapons you can deploy. DEFCON 5 is peace, DEFCON 1 is nuclear war. Strategic weapons require DEFCON 1. Monitor this carefully.',
    highlightElement: '#defcon',
    position: 'bottom',
    minTurn: 2,
    maxTurn: 5,
  },
  {
    stage: 'research-intro',
    title: 'Research & Technology',
    description: 'Unlock advanced weapons and capabilities through research. Larger warheads, better defenses, and strategic advantages await.',
    highlightElement: '[data-tutorial="research-button"]',
    position: 'left',
    minTurn: 6,
    maxTurn: 10,
  },
  {
    stage: 'intel-intro',
    title: 'Intelligence Operations',
    description: 'Deploy satellites, sabotage enemies, and gather intelligence. Information is power in the Cold War.',
    highlightElement: '[data-tutorial="intel-button"]',
    position: 'left',
    minTurn: 11,
    maxTurn: 15,
  },
  {
    stage: 'victory-paths',
    title: 'Victory Conditions',
    description: 'Win through Military (eliminate rivals), Economic (build 12+ cities), or Cultural (spread your influence) victory. Choose your path wisely.',
    position: 'center',
    minTurn: 16,
  },
];

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [currentStage, setCurrentStage] = useState<TutorialStage>('welcome');
  const [tutorialEnabled, setTutorialEnabled] = useState(true);
  const [currentTurn, setCurrentTurn] = useState(1);
  const [dismissedSteps, setDismissedSteps] = useState<Set<TutorialStage>>(new Set());

  // Load tutorial state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('tutorial_state');
    if (saved) {
      try {
        const state = JSON.parse(saved);
        if (state.completed) {
          setCurrentStage('completed');
          setTutorialEnabled(false);
        } else if (state.stage) {
          setCurrentStage(state.stage);
        }
      } catch (e) {
        console.error('Failed to load tutorial state', e);
      }
    }
  }, []);

  // Progressive disclosure based on turn
  const progressDisclosure = {
    showResearch: currentTurn >= 6 || currentStage === 'completed',
    showIntel: currentTurn >= 11 || currentStage === 'completed',
    showCulture: currentTurn >= 16 || currentStage === 'completed',
    showDiplomacy: true, // Always show diplomacy - it's a core game mechanic
    showPandemic: currentTurn >= 20 || currentStage === 'completed',
  };

  // Get current step based on stage and turn
  const currentStep = tutorialEnabled && currentStage !== 'completed'
    ? TUTORIAL_STEPS.find(step => {
        if (dismissedSteps.has(step.stage)) return false;
        if (step.stage !== currentStage) return false;
        if (step.minTurn && currentTurn < step.minTurn) return false;
        if (step.maxTurn && currentTurn > step.maxTurn) return false;
        if (step.condition && !step.condition()) return false;
        return true;
      }) || null
    : null;

  const advanceStage = useCallback((stage: TutorialStage) => {
    setCurrentStage(stage);
    if (stage === 'completed') {
      localStorage.setItem('tutorial_state', JSON.stringify({ completed: true }));
      setTutorialEnabled(false);
    } else {
      localStorage.setItem('tutorial_state', JSON.stringify({ stage, completed: false }));
    }
  }, []);

  const skipTutorial = useCallback(() => {
    setCurrentStage('completed');
    setTutorialEnabled(false);
    localStorage.setItem('tutorial_state', JSON.stringify({ completed: true, skipped: true }));
  }, []);

  const enableTutorial = useCallback(() => {
    setTutorialEnabled(true);
    setCurrentStage('welcome');
    setDismissedSteps(new Set());
    localStorage.removeItem('tutorial_state');
  }, []);

  const updateTurn = useCallback((turn: number) => {
    setCurrentTurn(turn);

    // Auto-advance stages based on turn
    if (tutorialEnabled && currentStage !== 'completed') {
      if (turn >= 6 && currentStage === 'first-launch') {
        advanceStage('research-intro');
      } else if (turn >= 11 && currentStage === 'research-intro') {
        advanceStage('intel-intro');
      } else if (turn >= 16 && currentStage === 'intel-intro') {
        advanceStage('victory-paths');
      }
    }
  }, [tutorialEnabled, currentStage, advanceStage]);

  const dismissCurrentStep = useCallback(() => {
    if (currentStep) {
      setDismissedSteps(prev => new Set(prev).add(currentStep.stage));

      // Advance to next stage
      const stageOrder: TutorialStage[] = ['welcome', 'first-launch', 'defcon-intro', 'research-intro', 'intel-intro', 'victory-paths', 'completed'];
      const currentIndex = stageOrder.indexOf(currentStage);
      if (currentIndex >= 0 && currentIndex < stageOrder.length - 1) {
        const nextStage = stageOrder[currentIndex + 1];
        advanceStage(nextStage);
      } else {
        advanceStage('completed');
      }
    }
  }, [currentStep, currentStage, advanceStage]);

  return (
    <TutorialContext.Provider
      value={{
        currentStage,
        tutorialEnabled,
        currentStep,
        showOverlay: !!currentStep,
        progressDisclosure,
        advanceStage,
        skipTutorial,
        enableTutorial,
        updateTurn,
        dismissCurrentStep,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorialContext() {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorialContext must be used within TutorialProvider');
  }
  return context;
}
