/**
 * Integrated Bio-Warfare System
 * Combines pandemic mechanics with evolution tree and lab construction
 */

import { useCallback } from 'react';
import { usePandemic } from './usePandemic';
import { useEvolutionTree } from './useEvolutionTree';
import { useBioLab } from './useBioLab';
import { useRNG } from '@/contexts/RNGContext';
import type { PandemicTurnContext, PandemicTurnEffect } from './usePandemic';
import type { NewsItem } from '@/components/NewsTicker';
import type { PlagueState } from '@/types/biowarfare';
import { getPlagueTypeById } from '@/lib/evolutionData';

type AddNewsItem = (category: NewsItem['category'], text: string, priority: NewsItem['priority']) => void;

/**
 * Main hook that combines pandemic spread with evolution tree and lab construction
 */
export function useBioWarfare(addNewsItem: AddNewsItem) {
  const { rng } = useRNG();
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
  const advanceBioWarfareTurn = useCallback(
    (context: PandemicTurnContext, nations: any[] = []): PandemicTurnEffect | null => {
      const resolvedNations = Array.isArray(nations) ? nations : [];

      const plagueType = evolution.plagueState.selectedPlagueType ? getPlagueTypeById(evolution.plagueState.selectedPlagueType) : null;

      // Advance lab construction if under construction
      const constructionResult = bioLab.advanceConstruction();
      if (constructionResult.completed && constructionResult.newTier) {
        addNewsItem('science', `Bio Laboratory upgraded to Tier ${constructionResult.newTier}`, 'important');

        // Award DNA for lab tier upgrade
        const tierDNA = constructionResult.newTier * 5; // 5, 10, 15, 20 DNA for tiers 1-4
        evolution.addDNAPoints({
          reason: 'milestone',
          amount: tierDNA,
          message: `Lab Tier ${constructionResult.newTier} unlocked: +${tierDNA} DNA from research breakthrough`,
        });
      }

      // Advance per-country infections if using targeted deployment
      if (evolution.plagueState.countryInfections.size > 0) {
        evolution.advanceCountryInfections(context.turn, resolvedNations);
      }

      // Only process legacy global pandemic if plague is active
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
          const randomSymptom = rng.choice(availableLethal);
          evolution.evolveNode({ nodeId: randomSymptom as any, forced: true });
          addNewsItem('crisis', `Bio-weapon unstable mutation: ${randomSymptom} evolved automatically`, 'urgent');
        }
      }

    // Virus: Random mutations
    if (plagueType?.id === 'virus' && rng.nextBool(plagueType.naturalMutationRate)) {
      evolution.triggerRandomMutation();
    }

    // Prion: Random late-game lethal symptom mutation
    if (plagueType?.id === 'prion' && pandemic.pandemicState.globalInfection > 40 && rng.nextBool(0.15)) {
      const lethalSymptoms = ['necrosis', 'paralysis', 'coma', 'total-organ-failure'];
      const availableSymptoms = lethalSymptoms.filter(
        (id) => !evolution.plagueState.unlockedNodes.has(id as any)
      );
      if (availableSymptoms.length > 0) {
        const randomSymptom = rng.choice(availableSymptoms);
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
        addNewsItem('science', `Casualties yield ${deathDNA} DNA from pathogen samples`, 'routine');
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

    // Passive DNA generation based on lab tier (only if plague is active)
    const labTier = bioLab.labFacility.tier;
    if (labTier > 0 && evolution.plagueState.plagueStarted) {
      const passiveDNA = Math.floor(labTier / 2); // 0, 0, 1, 2 DNA per turn for tiers 1-4
      if (passiveDNA > 0) {
        dnaGained += passiveDNA;
      }
    }

    // Award DNA
    if (dnaGained > 0) {
      evolution.addDNAPoints({
        reason: 'milestone',
        amount: dnaGained,
      });
    }

    // Update plague completion stats
    const deathsThisTurn = enhancedEffect?.populationLoss || 0;
    const nationsInfected = evolution.plagueState.countryInfections.size;
    evolution.updatePlagueStats(
      pandemic.pandemicState.globalInfection,
      deathsThisTurn,
      nationsInfected
    );

    // Check for plague completion and unlock next types
    evolution.checkPlagueCompletion();

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
    if (evolution.plagueState.cureProgress >= 100 && !evolution.plagueState.cureActive) {
      addNewsItem('crisis', 'CURE DEPLOYED - Pathogen neutralization in progress', 'critical');

      // Activate cure deployment
      evolution.activateCure();
    }

    // Apply cure deployment effects if cure is active
    if (evolution.plagueState.cureActive) {
      const labTier = bioLab.labFacility.tier;
      const cureProgress = evolution.plagueState.cureProgress;
      const stats = evolution.plagueState.calculatedStats;

      // Calculate cure effectiveness (0-100%)
      // Based on: lab tier, cure progress, and cure resistance
      const labBonus = labTier * 15; // Tier 1=15%, Tier 2=30%, Tier 3=45%, Tier 4=60%
      const progressBonus = Math.min(cureProgress - 100, 50) * 0.5; // Up to +25% for overcure
      const resistancePenalty = stats.cureResistance * 1.5; // -1.5% per resistance point
      const cureEffectiveness = Math.max(10, Math.min(100, labBonus + progressBonus - resistancePenalty));

      // Apply cure effects to reduce infection and lethality
      const infectionReduction = (cureEffectiveness * 0.01) * 2.5; // 0.25-2.5 per turn
      const lethalityReduction = (cureEffectiveness * 0.005) * 1.0; // 0.05-0.5 per turn

      // Reduce global infection
      if (pandemic.pandemicState.globalInfection > 0) {
        pandemic.applyCountermeasure({
          type: 'vaccine',
          value: infectionReduction,
          label: `Cure distribution reduces infection by ${infectionReduction.toFixed(1)}%`,
        });
      }

      // Reduce lethality by modifying pandemic state if it has a method for it
      // Note: This is a simplified approach - in production you'd want a dedicated method
      if (enhancedEffect && pandemic.pandemicState.lethality > 0) {
        enhancedEffect.populationLoss = Math.max(0, (enhancedEffect.populationLoss || 0) * (1 - cureEffectiveness * 0.01));
      }

      // Add news update every 5 turns
      if (context.turn % 5 === 0 && pandemic.pandemicState.globalInfection > 5) {
        addNewsItem('science', `Cure deployment ${cureEffectiveness.toFixed(0)}% effective - infection declining`, 'important');
      }

      // Check if pandemic is effectively neutralized
      if (pandemic.pandemicState.globalInfection < 2 && pandemic.pandemicState.lethality < 0.05) {
        addNewsItem('science', 'Pandemic effectively neutralized by cure deployment', 'critical');
      }
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
    activateCure: evolution.activateCure,

    // Lab actions
    startLabConstruction: bioLab.startConstruction,
    cancelLabConstruction: bioLab.cancelConstruction,
    getConstructionOptions: bioLab.getConstructionOptions,
    isPlagueTypeUnlocked: bioLab.isPlagueTypeUnlocked,

    // Deployment actions (new targeted system)
    deployBioWeapon: evolution.deployBioWeapon,

    // Combined actions
    triggerBioWarfare,
    advanceBioWarfareTurn,
    onCountryInfected,

    // Utilities
    availableNodes: evolution.availableNodes,
    calculateSpreadModifiers,
  };
}
