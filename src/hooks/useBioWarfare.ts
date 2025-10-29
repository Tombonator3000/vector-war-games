/**
 * Integrated Bio-Warfare System
 * Combines pandemic mechanics with evolution tree
 */

import { useCallback } from 'react';
import { usePandemic } from './usePandemic';
import { useEvolutionTree } from './useEvolutionTree';
import type { PandemicTurnContext, PandemicTurnEffect } from './usePandemic';
import type { NewsItem } from '@/components/NewsTicker';
import type { PlagueState } from '@/types/biowarfare';
import { getPlagueTypeById } from '@/lib/evolutionData';

type AddNewsItem = (category: NewsItem['category'], text: string, priority: NewsItem['priority']) => void;

/**
 * Main hook that combines pandemic spread with evolution tree
 */
export function useBioWarfare(addNewsItem: AddNewsItem) {
  const pandemic = usePandemic(addNewsItem);
  const evolution = useEvolutionTree(addNewsItem);

  /**
   * Calculate spread modifiers based on evolution stats
   */
  const calculateSpreadModifiers = useCallback((plagueState: PlagueState) => {
    const stats = plagueState.calculatedStats;
    const plagueType = plagueState.selectedPlagueType ? getPlagueTypeById(plagueState.selectedPlagueType) : null;

    // Base modifiers
    let spreadMultiplier = 1.0;
    let lethalityMultiplier = 1.0;
    let detectionMultiplier = 1.0;
    let cureSpeedMultiplier = 1.0;

    // Infectivity affects spread rate (0-50+ range)
    // Every 5 points = +25% spread
    spreadMultiplier += (stats.totalInfectivity / 5) * 0.25;

    // Lethality affects death rate (0-50+ range)
    // Every 5 points = +50% lethality
    lethalityMultiplier += (stats.totalLethality / 5) * 0.5;

    // Severity affects detection (high severity = easier to detect)
    // Every 5 points = +10% detection
    detectionMultiplier += (stats.totalSeverity / 5) * 0.1;

    // But also severity can slow cure if it overwhelms healthcare
    if (stats.totalSeverity > 30) {
      cureSpeedMultiplier *= 0.8; // Healthcare overwhelmed
    }

    // Cure resistance slows cure research
    // Every 5 points = -15% cure speed
    cureSpeedMultiplier *= Math.max(0.1, 1 - (stats.cureResistance / 5) * 0.15);

    // Plague type specific modifiers
    if (plagueType) {
      if (plagueType.id === 'fungus') {
        // Fungus spreads very slowly without abilities
        spreadMultiplier *= 0.4;
      } else if (plagueType.id === 'virus') {
        // Virus spreads faster
        spreadMultiplier *= 1.2;
      } else if (plagueType.id === 'parasite') {
        // Parasite harder to detect
        detectionMultiplier *= 0.5;
      } else if (plagueType.id === 'prion') {
        // Prion very hard to detect
        detectionMultiplier *= 0.3;
        // But very lethal late game
        if (stats.totalLethality > 10) {
          lethalityMultiplier *= 1.5;
        }
      } else if (plagueType.id === 'bio-weapon') {
        // Bio-weapon has increasing lethality over time
        // This will be handled in turn advancement
      }
    }

    return {
      spreadMultiplier: Math.max(0.1, spreadMultiplier),
      lethalityMultiplier: Math.max(0.1, lethalityMultiplier),
      detectionMultiplier: Math.max(0.1, detectionMultiplier),
      cureSpeedMultiplier: Math.max(0.1, cureSpeedMultiplier),
    };
  }, []);

  /**
   * Advance turn with evolution-enhanced mechanics
   */
  const advanceBioWarfareTurn = useCallback((context: PandemicTurnContext): PandemicTurnEffect | null => {
    const plagueType = evolution.plagueState.selectedPlagueType ? getPlagueTypeById(evolution.plagueState.selectedPlagueType) : null;

    // Only process if plague is active
    if (!evolution.plagueState.plagueStarted || !pandemic.pandemicState.active) {
      return null;
    }

    // Calculate modifiers from evolution
    const modifiers = calculateSpreadModifiers(evolution.plagueState);

    // Bio-weapon: Auto-increasing lethality
    if (plagueType?.autoIncreasingLethality) {
      const lethalityIncrease = 0.5 + (context.turn * 0.1); // Increases each turn
      // This will affect the base pandemic lethality
    }

    // Virus: Random mutations
    if (plagueType?.id === 'virus' && Math.random() < plagueType.naturalMutationRate) {
      evolution.triggerRandomMutation();
    }

    // Advance pandemic with modifiers
    const baseEffect = pandemic.advancePandemicTurn(context);

    if (!baseEffect) return null;

    // Apply evolution modifiers to effects
    const enhancedEffect: PandemicTurnEffect = {
      ...baseEffect,
      populationLoss: Math.floor((baseEffect.populationLoss || 0) * modifiers.lethalityMultiplier),
      productionPenalty: baseEffect.productionPenalty,
      instabilityIncrease: baseEffect.instabilityIncrease,
      actionsPenalty: baseEffect.actionsPenalty,
    };

    // Award DNA based on effects
    let dnaGained = 0;

    // DNA from deaths (1 DNA per 100k deaths)
    if (enhancedEffect.populationLoss && enhancedEffect.populationLoss > 0) {
      dnaGained += Math.floor(enhancedEffect.populationLoss / 100000);
    }

    // DNA from spread (if infection increasing)
    if (pandemic.pandemicState.globalInfection > 0) {
      dnaGained += Math.floor(pandemic.pandemicState.globalInfection / 20);
    }

    // Award DNA
    if (dnaGained > 0) {
      evolution.addDNAPoints({
        reason: 'milestone',
        amount: dnaGained,
        message: `Bio-warfare advancement: +${dnaGained} DNA`,
      });
    }

    // Update cure progress (slowed by evolution)
    const cureIncrease = 1.5 * modifiers.cureSpeedMultiplier;
    evolution.updateCureProgress(cureIncrease);

    return enhancedEffect;
  }, [pandemic, evolution, calculateSpreadModifiers]);

  /**
   * Trigger pandemic with evolution consideration
   */
  const triggerBioWarfare = useCallback((payload: any) => {
    // Check if plague is selected
    if (!evolution.plagueState.plagueStarted) {
      addNewsItem('crisis', 'BioForge chambers offline - select pathogen type first', 'urgent');
      return;
    }

    const plagueType = evolution.plagueState.selectedPlagueType ? getPlagueTypeById(evolution.plagueState.selectedPlagueType) : null;

    // Modify payload based on evolution stats
    const modifiers = calculateSpreadModifiers(evolution.plagueState);

    const enhancedPayload = {
      ...payload,
      // Boost initial infection based on evolution
      initialInfection: (payload.initialInfection || 12) * modifiers.spreadMultiplier,
      // Reduce containment based on stealth
      initialContainment: (payload.initialContainment || 40) * modifiers.detectionMultiplier,
    };

    // Start cure immediately for nano-virus
    if (plagueType?.startWithCure) {
      evolution.updateCureProgress(10);
      addNewsItem('crisis', 'Nano-virus detected - global cure research initiated immediately', 'critical');
    }

    pandemic.triggerPandemic(enhancedPayload);
  }, [pandemic, evolution, calculateSpreadModifiers, addNewsItem]);

  /**
   * Handle country infection (award DNA)
   */
  const onCountryInfected = useCallback((countryId: string) => {
    if (!evolution.plagueState.plagueStarted) return;

    evolution.infectCountry(countryId);
  }, [evolution]);

  return {
    // Pandemic state
    pandemicState: pandemic.pandemicState,

    // Evolution state
    plagueState: evolution.plagueState,

    // Pandemic actions (original)
    applyCountermeasure: pandemic.applyCountermeasure,

    // Evolution actions
    selectPlagueType: evolution.selectPlagueType,
    evolveNode: evolution.evolveNode,
    devolveNode: evolution.devolveNode,
    addDNAPoints: evolution.addDNAPoints,

    // Combined actions
    triggerBioWarfare,
    advanceBioWarfareTurn,
    onCountryInfected,

    // Utilities
    availableNodes: evolution.availableNodes,
    calculateSpreadModifiers,
  };
}
