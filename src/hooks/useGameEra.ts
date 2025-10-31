import { useState, useEffect, useMemo } from 'react';
import {
  GameEra,
  GameFeature,
  ERA_DEFINITIONS as BASE_ERA_DEFINITIONS,
  FEATURE_UNLOCK_INFO as BASE_FEATURE_UNLOCK_INFO,
  FeatureUnlockInfo,
  EraDefinition,
} from '@/types/era';
import type { ScenarioConfig } from '@/types/scenario';

export interface UseGameEraReturn {
  currentEra: GameEra;
  isFeatureUnlocked: (feature: GameFeature) => boolean;
  getNextEra: () => { era: GameEra; turnsUntil: number } | null;
  getLockedFeatures: () => FeatureUnlockInfo[];
  getNewlyUnlockedFeatures: () => FeatureUnlockInfo[];
  getEraDescription: () => string;
  getEraProgress: () => number; // 0-100
  eraDefinitions: Record<GameEra, EraDefinition>;
  featureUnlockInfo: Record<GameFeature, FeatureUnlockInfo>;
}

interface UseGameEraProps {
  currentTurn: number;
  scenario?: ScenarioConfig | null;
  onEraChange?: (
    newEra: GameEra,
    oldEra: GameEra,
    eraDefinitions: Record<GameEra, EraDefinition>,
  ) => void;
}

const ERA_ORDER: GameEra[] = ['early', 'mid', 'late'];

export function useGameEra({
  currentTurn,
  scenario = null,
  onEraChange,
}: UseGameEraProps): UseGameEraReturn {
  const { eraDefinitions, featureUnlockInfo, allowedFeatures } = useMemo(() => {
    const overrides = scenario?.eraOverrides;

    const derivedDefinitions = ERA_ORDER.reduce((acc, era) => {
      const base = BASE_ERA_DEFINITIONS[era];
      const override = overrides?.[era];
      acc[era] = {
        ...base,
        startTurn: override?.startTurn ?? base.startTurn,
        endTurn: override?.endTurn ?? base.endTurn,
        unlockedFeatures: override?.unlockedFeatures
          ? [...override.unlockedFeatures]
          : [...base.unlockedFeatures],
      };
      return acc;
    }, {} as Record<GameEra, EraDefinition>);

    const permittedFeatures = new Set<GameFeature>();
    ERA_ORDER.forEach((era) => {
      derivedDefinitions[era].unlockedFeatures.forEach((feature) => {
        permittedFeatures.add(feature);
      });
    });

    const earliestUnlockByFeature = ERA_ORDER.reduce((acc, era) => {
      const { startTurn, unlockedFeatures } = derivedDefinitions[era];
      unlockedFeatures.forEach((feature) => {
        const existing = acc[feature];
        acc[feature] = typeof existing === 'number' ? Math.min(existing, startTurn) : startTurn;
      });
      return acc;
    }, {} as Partial<Record<GameFeature, number>>);

    const derivedFeatureUnlockInfo = Object.keys(BASE_FEATURE_UNLOCK_INFO).reduce(
      (acc, key) => {
        const feature = key as GameFeature;
        const baseInfo = BASE_FEATURE_UNLOCK_INFO[feature];
        const unlockTurn = earliestUnlockByFeature[feature];
        acc[feature] = {
          ...baseInfo,
          unlockTurn:
            unlockTurn !== undefined
              ? unlockTurn
              : permittedFeatures.has(feature)
              ? baseInfo.unlockTurn
              : Number.POSITIVE_INFINITY,
        };
        return acc;
      },
      {} as Record<GameFeature, FeatureUnlockInfo>,
    );

    return { eraDefinitions: derivedDefinitions, featureUnlockInfo: derivedFeatureUnlockInfo, allowedFeatures: permittedFeatures };
  }, [scenario]);

  const [previousEra, setPreviousEra] = useState<GameEra>('early');

  // Determine current era based on turn
  const currentEra = useMemo((): GameEra => {
    if (currentTurn >= eraDefinitions.late.startTurn) return 'late';
    if (currentTurn >= eraDefinitions.mid.startTurn) return 'mid';
    return 'early';
  }, [currentTurn, eraDefinitions]);

  // Trigger era change callback
  useEffect(() => {
    if (currentEra !== previousEra && onEraChange) {
      onEraChange(currentEra, previousEra, eraDefinitions);
      setPreviousEra(currentEra);
    }
  }, [currentEra, previousEra, onEraChange, eraDefinitions]);

  // Check if a feature is unlocked in current era
  const isFeatureUnlocked = (feature: GameFeature): boolean => {
    const eraDefinition = eraDefinitions[currentEra];
    return eraDefinition.unlockedFeatures.includes(feature);
  };

  // Get next era information
  const getNextEra = (): { era: GameEra; turnsUntil: number } | null => {
    if (currentEra === 'early') {
      return {
        era: 'mid',
        turnsUntil: eraDefinitions.mid.startTurn - currentTurn,
      };
    }
    if (currentEra === 'mid') {
      return {
        era: 'late',
        turnsUntil: eraDefinitions.late.startTurn - currentTurn,
      };
    }
    return null; // Already in final era
  };

  // Get all features that are still locked
  const getLockedFeatures = (): FeatureUnlockInfo[] => {
    return Array.from(allowedFeatures)
      .filter((feature) => !isFeatureUnlocked(feature))
      .map((feature) => featureUnlockInfo[feature])
      .filter((info) => Number.isFinite(info.unlockTurn))
      .sort((a, b) => a.unlockTurn - b.unlockTurn);
  };

  // Get features that were just unlocked (within last 2 turns)
  const getNewlyUnlockedFeatures = (): FeatureUnlockInfo[] => {
    const currentEraFeatures = eraDefinitions[currentEra].unlockedFeatures;
    const previousEraFeatures =
      currentEra === 'mid'
        ? eraDefinitions.early.unlockedFeatures
        : currentEra === 'late'
        ? eraDefinitions.mid.unlockedFeatures
        : [];

    // Features that are in current era but not in previous era
    const newFeatures = currentEraFeatures.filter(
      (feature) => !previousEraFeatures.includes(feature)
    );

    // Only show if we just transitioned (within 2 turns of era start)
    const eraStartTurn = eraDefinitions[currentEra].startTurn;
    if (currentTurn - eraStartTurn <= 1) {
      return newFeatures.map((feature) => featureUnlockInfo[feature]);
    }

    return [];
  };

  // Get current era description
  const getEraDescription = (): string => {
    return eraDefinitions[currentEra].description;
  };

  // Get progress through current era (0-100)
  const getEraProgress = (): number => {
    const eraDef = eraDefinitions[currentEra];
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
    eraDefinitions,
    featureUnlockInfo,
  };
}
