/**
 * Integrated Bio-Warfare System
 * Combines pandemic mechanics with evolution tree and lab construction
 */

import { useCallback } from 'react';
import { usePandemic } from './usePandemic';
import { useEvolutionTree } from './useEvolutionTree';
import { useBioLab } from './useBioLab';
import type { PandemicTurnContext, PandemicTurnEffect } from './usePandemic';
import type { NewsItem } from '@/components/NewsTicker';
import type { PlagueState } from '@/types/biowarfare';
import { getPlagueTypeById } from '@/lib/evolutionData';

type AddNewsItem = (category: NewsItem['category'], text: string, priority: NewsItem['priority']) => void;

/**
 * Main hook that combines pandemic spread with evolution tree and lab construction
 */
export function useBioWarfare(addNewsItem: AddNewsItem) {
  const pandemic = usePandemic(addNewsItem);
  const evolution = useEvolutionTree(addNewsItem);
  const bioLab = useBioLab(addNewsItem);

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

    // Advance lab construction if under construction
    const constructionResult = bioLab.advanceConstruction();
    if (constructionResult.completed && constructionResult.newTier) {
      addNewsItem('science', `Bio Laboratory upgraded to Tier ${constructionResult.newTier}`, 'important');
    }

    // Only process if plague is active
    if (!evolution.plagueState.plagueStarted || !pandemic.pandemicState.active) {
      return null;
    }

    // Calculate modifiers from evolution
    const modifiers = calculateSpreadModifiers(evolution.plagueState);

    // Bio-weapon: Auto-increasing lethality (evolve random lethal symptom every 5 turns)
    if (plagueType?.autoIncreasingLethality && context.turn % 5 === 0) {
      // Force-evolve a random lethal symptom if available
      const lethalSymptoms = ['total-organ-failure', 'hemorrhagic-shock', 'necrosis', 'cytokine-storm', 'systemic-infection', 'liquefaction'];
      const availableLethal = lethalSymptoms.filter(
        (id) => !evolution.plagueState.unlockedNodes.has(id as any)
      );
      if (availableLethal.length > 0) {
        const randomSymptom = availableLethal[Math.floor(Math.random() * availableLethal.length)];
        evolution.evolveNode({ nodeId: randomSymptom as any, forced: true });
        addNewsItem('crisis', `Bio-weapon unstable mutation: ${randomSymptom} evolved automatically`, 'urgent');
      }
    }

    // Virus: Random mutations
    if (plagueType?.id === 'virus' && Math.random() < plagueType.naturalMutationRate) {
      evolution.triggerRandomMutation();
    }

    // Prion: Random late-game lethal symptom mutation
    if (plagueType?.id === 'prion' && pandemic.pandemicState.globalInfection > 40 && Math.random() < 0.15) {
      const lethalSymptoms = ['necrosis', 'paralysis', 'coma', 'total-organ-failure'];
      const availableSymptoms = lethalSymptoms.filter(
        (id) => !evolution.plagueState.unlockedNodes.has(id as any)
      );
      if (availableSymptoms.length > 0) {
        const randomSymptom = availableSymptoms[Math.floor(Math.random() * availableSymptoms.length)];
        evolution.evolveNode({ nodeId: randomSymptom as any, forced: true });
        addNewsItem('science', `Prion cascade: ${randomSymptom} manifested`, 'important');
      }
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
      const deathDNA = Math.floor(enhancedEffect.populationLoss / 100000);
      if (deathDNA > 0) {
        dnaGained += deathDNA;
        addNewsItem('science', `Casualties yield ${deathDNA} DNA from pathogen samples`, 'normal');
      }
    }

    // DNA from infection spread (every 10% global infection = 1 DNA)
    const infectionMilestone = Math.floor(pandemic.pandemicState.globalInfection / 10);
    const previousMilestone = Math.floor((pandemic.pandemicState.globalInfection - 5) / 10);
    if (infectionMilestone > previousMilestone) {
      dnaGained += 2;
      addNewsItem('science', `Infection milestone reached: +2 DNA`, 'important');
    }

    // DNA from active outbreaks (1 DNA per active outbreak region)
    if (pandemic.pandemicState.outbreaks.length > 0) {
      dnaGained += pandemic.pandemicState.outbreaks.length;
    }

    // Award DNA
    if (dnaGained > 0) {
      evolution.addDNAPoints({
        reason: 'milestone',
        amount: dnaGained,
      });
    }

    // Update cure progress (slowed by evolution)
    let cureIncrease = 1.5 * modifiers.cureSpeedMultiplier;

    // Nano-virus: Cure progresses faster
    if (plagueType?.id === 'nano-virus') {
      cureIncrease *= 1.5;
    }

    // Parasite/Prion: Cure starts later (detection delay)
    if (plagueType?.id === 'parasite' && pandemic.pandemicState.globalInfection < 30) {
      cureIncrease = 0; // No cure until 30% infected
    }
    if (plagueType?.id === 'prion' && pandemic.pandemicState.globalInfection < 40) {
      cureIncrease = 0; // No cure until 40% infected
    }

    evolution.updateCureProgress(cureIncrease);

    // Check if cure completed
    if (evolution.plagueState.cureProgress >= 100) {
      addNewsItem('crisis', 'CURE DEPLOYED - Pathogen neutralization in progress', 'critical');
      // TODO: Trigger cure deployment effects
    }

    return enhancedEffect;
  }, [pandemic, evolution, bioLab, calculateSpreadModifiers, addNewsItem]);

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

    // Lab state
    labFacility: bioLab.labFacility,

    // Pandemic actions (original)
    applyCountermeasure: pandemic.applyCountermeasure,

    // Evolution actions
    selectPlagueType: evolution.selectPlagueType,
    evolveNode: evolution.evolveNode,
    devolveNode: evolution.devolveNode,
    addDNAPoints: evolution.addDNAPoints,

    // Lab actions
    startLabConstruction: bioLab.startConstruction,
    cancelLabConstruction: bioLab.cancelConstruction,
    getConstructionOptions: bioLab.getConstructionOptions,
    isPlagueTypeUnlocked: bioLab.isPlagueTypeUnlocked,

    // Combined actions
    triggerBioWarfare,
    advanceBioWarfareTurn,
    onCountryInfected,

    // Utilities
    availableNodes: evolution.availableNodes,
    calculateSpreadModifiers,
  };
}
