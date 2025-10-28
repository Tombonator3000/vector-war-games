import { useState, useEffect } from 'react';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target?: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  allowSkip?: boolean;
}

export function useTutorial(tutorialKey: string, steps: TutorialStep[]) {
  const [showTutorial, setShowTutorial] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const hasCompleted = localStorage.getItem(`tutorial_${tutorialKey}`);
    if (!hasCompleted) {
      setShowTutorial(true);
    } else {
      setCompleted(true);
    }
  }, [tutorialKey]);

  const handleComplete = () => {
    localStorage.setItem(`tutorial_${tutorialKey}`, 'true');
    setShowTutorial(false);
    setCompleted(true);
  };

  const handleSkip = () => {
    localStorage.setItem(`tutorial_${tutorialKey}`, 'skipped');
    setShowTutorial(false);
  };

  const reset = () => {
    localStorage.removeItem(`tutorial_${tutorialKey}`);
    setShowTutorial(true);
    setCompleted(false);
  };

  return {
    showTutorial,
    completed,
    handleComplete,
    handleSkip,
    reset,
  };
}
