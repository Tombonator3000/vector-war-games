import { useState, useEffect, useMemo } from 'react';
import {
  GameEra,
  GameFeature,
  ERA_DEFINITIONS,
  FEATURE_UNLOCK_INFO,
  FeatureUnlockInfo,
} from '@/types/era';

export interface UseGameEraReturn {
  currentEra: GameEra;
  isFeatureUnlocked: (feature: GameFeature) => boolean;
  getNextEra: () => { era: GameEra; turnsUntil: number } | null;
  getLockedFeatures: () => FeatureUnlockInfo[];
  getNewlyUnlockedFeatures: () => FeatureUnlockInfo[];
  getEraDescription: () => string;
  getEraProgress: () => number; // 0-100
}

interface UseGameEraProps {
  currentTurn: number;
  onEraChange?: (newEra: GameEra, oldEra: GameEra) => void;
}

export function useGameEra({ currentTurn, onEraChange }: UseGameEraProps): UseGameEraReturn {
  const [previousEra, setPreviousEra] = useState<GameEra>('early');

  // Determine current era based on turn
  const currentEra = useMemo((): GameEra => {
    if (currentTurn >= ERA_DEFINITIONS.late.startTurn) return 'late';
    if (currentTurn >= ERA_DEFINITIONS.mid.startTurn) return 'mid';
    return 'early';
  }, [currentTurn]);

  // Trigger era change callback
  useEffect(() => {
    if (currentEra !== previousEra && onEraChange) {
      onEraChange(currentEra, previousEra);
      setPreviousEra(currentEra);
    }
  }, [currentEra, previousEra, onEraChange]);

  // Check if a feature is unlocked in current era
  const isFeatureUnlocked = (feature: GameFeature): boolean => {
    const eraDefinition = ERA_DEFINITIONS[currentEra];
    return eraDefinition.unlockedFeatures.includes(feature);
  };

  // Get next era information
  const getNextEra = (): { era: GameEra; turnsUntil: number } | null => {
    if (currentEra === 'early') {
      return {
        era: 'mid',
        turnsUntil: ERA_DEFINITIONS.mid.startTurn - currentTurn,
      };
    }
    if (currentEra === 'mid') {
      return {
        era: 'late',
        turnsUntil: ERA_DEFINITIONS.late.startTurn - currentTurn,
      };
    }
    return null; // Already in final era
  };

  // Get all features that are still locked
  const getLockedFeatures = (): FeatureUnlockInfo[] => {
    const allFeatures = Object.keys(FEATURE_UNLOCK_INFO) as GameFeature[];
    return allFeatures
      .filter((feature) => !isFeatureUnlocked(feature))
      .map((feature) => FEATURE_UNLOCK_INFO[feature])
      .sort((a, b) => a.unlockTurn - b.unlockTurn);
  };

  // Get features that were just unlocked (within last 2 turns)
  const getNewlyUnlockedFeatures = (): FeatureUnlockInfo[] => {
    const currentEraFeatures = ERA_DEFINITIONS[currentEra].unlockedFeatures;
    const previousEraFeatures =
      currentEra === 'mid'
        ? ERA_DEFINITIONS.early.unlockedFeatures
        : currentEra === 'late'
        ? ERA_DEFINITIONS.mid.unlockedFeatures
        : [];

    // Features that are in current era but not in previous era
    const newFeatures = currentEraFeatures.filter(
      (feature) => !previousEraFeatures.includes(feature)
    );

    // Only show if we just transitioned (within 2 turns of era start)
    const eraStartTurn = ERA_DEFINITIONS[currentEra].startTurn;
    if (currentTurn - eraStartTurn <= 1) {
      return newFeatures.map((feature) => FEATURE_UNLOCK_INFO[feature]);
    }

    return [];
  };

  // Get current era description
  const getEraDescription = (): string => {
    return ERA_DEFINITIONS[currentEra].description;
  };

  // Get progress through current era (0-100)
  const getEraProgress = (): number => {
    const eraDef = ERA_DEFINITIONS[currentEra];
    if (currentEra === 'late') return 100; // Final era has no end

    const eraLength = eraDef.endTurn - eraDef.startTurn + 1;
    const turnsIntoEra = currentTurn - eraDef.startTurn + 1;
    return Math.min(100, Math.round((turnsIntoEra / eraLength) * 100));
  };

  return {
    currentEra,
    isFeatureUnlocked,
    getNextEra,
    getLockedFeatures,
    getNewlyUnlockedFeatures,
    getEraDescription,
    getEraProgress,
  };
}
