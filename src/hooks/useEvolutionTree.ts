import { useState, useCallback, useMemo } from 'react';
import type {
  PlagueState,
  EvolutionNodeId,
  EvolveNodePayload,
  DevolveNodePayload,
  DNAGainEvent,
  PlagueTypeId,
} from '@/types/biowarfare';
import {
  ALL_EVOLUTION_NODES,
  getNodeById,
  canUnlockNode,
  getPlagueTypeById,
  PLAGUE_TYPES,
} from '@/lib/evolutionData';
import type { NewsItem } from '@/components/NewsTicker';

type AddNewsItem = (category: NewsItem['category'], text: string, priority: NewsItem['priority']) => void;

const INITIAL_DNA_POINTS = 15;
const DEVOLVE_REFUND_PERCENTAGE = 0.5; // 50% refund

const INITIAL_PLAGUE_STATE: PlagueState = {
  selectedPlagueType: null,
  plagueStarted: false,
  dnaPoints: INITIAL_DNA_POINTS,
  unlockedNodes: new Set(),
  activeTransmissions: [],
  activeSymptoms: [],
  activeAbilities: [],
  calculatedStats: {
    totalInfectivity: 0,
    totalSeverity: 0,
    totalLethality: 0,
    cureResistance: 0,
    coldResistance: 0,
    heatResistance: 0,
    drugResistance: 0,
    geneticHardening: 0,
  },
  countriesInfected: [],
  deploymentHistory: [],
  countryInfections: new Map(),
  globalSuspicionLevel: 0,
  nationsKnowingTruth: [],
  attributionAttempts: 0,
  cureProgress: 0,
  cureActive: false,
  completedPlagues: [],
  totalKills: 0,
  maxInfectionReached: 0,
};

export function useEvolutionTree(addNewsItem: AddNewsItem) {
  const [plagueState, setPlagueState] = useState<PlagueState>(INITIAL_PLAGUE_STATE);

  // Select plague type (beginning of game)
  const selectPlagueType = useCallback((plagueTypeId: PlagueTypeId) => {
    const plagueType = getPlagueTypeById(plagueTypeId);
    if (!plagueType) {
      addNewsItem('crisis', `Invalid plague type: ${plagueTypeId}`, 'urgent');
      return false;
    }

    if (!plagueType.unlocked) {
      addNewsItem('crisis', `${plagueType.name} not yet unlocked - complete prerequisite campaigns`, 'important');
      return false;
    }

    setPlagueState((prev) => ({
      ...prev,
      selectedPlagueType: plagueTypeId,
      plagueStarted: true,
      cureActive: plagueType.startWithCure,
    }));

    addNewsItem(
      'science',
      `BioForge initialized ${plagueType.name} pathogen - ${plagueType.specialMechanic}`,
      'important'
    );

    return true;
  }, [addNewsItem]);

  // Calculate stats from unlocked nodes
  const recalculateStats = useCallback((
    unlockedNodes: Set<EvolutionNodeId>,
    selectedPlagueTypeId: PlagueTypeId | null
  ) => {
    const stats = {
      totalInfectivity: 0,
      totalSeverity: 0,
      totalLethality: 0,
      cureResistance: 0,
      coldResistance: 0,
      heatResistance: 0,
      drugResistance: 0,
      geneticHardening: 0,
    };

    const plagueType = selectedPlagueTypeId ? getPlagueTypeById(selectedPlagueTypeId) : null;

    unlockedNodes.forEach((nodeId) => {
      const node = getNodeById(nodeId);
      if (!node) return;

      let effectMultiplier = 1.0;

      // Apply plague-type specific modifiers
      if (plagueType && node.plagueTypeModifier) {
        const modifier = node.plagueTypeModifier[plagueType.id];
        if (modifier?.disabled) return; // Skip disabled nodes
        if (modifier?.effectsMultiplier) {
          effectMultiplier = modifier.effectsMultiplier;
        }
      }

      // Add effects
      if (node.effects.infectivity) {
        stats.totalInfectivity += node.effects.infectivity * effectMultiplier;
      }
      if (node.effects.severity) {
        stats.totalSeverity += node.effects.severity * effectMultiplier;
      }
      if (node.effects.lethality) {
        stats.totalLethality += node.effects.lethality * effectMultiplier;
      }
      if (node.effects.cureResistance) {
        stats.cureResistance += node.effects.cureResistance * effectMultiplier;
      }

      // Track specific resistances
      if (nodeId === 'cold-resistance-1') stats.coldResistance = 1;
      if (nodeId === 'cold-resistance-2') stats.coldResistance = 2;
      if (nodeId === 'heat-resistance-1') stats.heatResistance = 1;
      if (nodeId === 'heat-resistance-2') stats.heatResistance = 2;
      if (nodeId === 'drug-resistance-1') stats.drugResistance = 1;
      if (nodeId === 'drug-resistance-2') stats.drugResistance = 2;
      if (nodeId === 'drug-resistance-3') stats.drugResistance = 3;
      if (nodeId === 'genetic-hardening-1') stats.geneticHardening = 1;
      if (nodeId === 'genetic-hardening-2') stats.geneticHardening = 2;
      if (nodeId === 'genetic-hardening-3') stats.geneticHardening = 3;
    });

    // Apply plague type base modifiers
    if (plagueType) {
      stats.totalInfectivity += plagueType.baseTransmission * 2;
      stats.totalSeverity += plagueType.baseSeverity * 2;
      stats.totalLethality += plagueType.baseLethality * 2;
    }

    return stats;
  }, []);

  // Evolve a node (spend DNA)
  const evolveNode = useCallback((payload: EvolveNodePayload) => {
    const { nodeId, forced = false } = payload;

    let success = false;
    let newsMessage: string | null = null;

    setPlagueState((prev) => {
      const node = getNodeById(nodeId);
      if (!node) return prev;

      // Check if already unlocked
      if (prev.unlockedNodes.has(nodeId)) {
        newsMessage = `${node.name} already unlocked`;
        return prev;
      }

      // Check prerequisites
      if (!canUnlockNode(nodeId, prev.unlockedNodes)) {
        newsMessage = `Prerequisites not met for ${node.name}`;
        return prev;
      }

      // Calculate actual cost
      const plagueType = prev.selectedPlagueType ? getPlagueTypeById(prev.selectedPlagueType) : null;
      let actualCost = node.dnaCost;

      if (plagueType && node.plagueTypeModifier) {
        const modifier = node.plagueTypeModifier[plagueType.id];
        if (modifier?.disabled) {
          newsMessage = `${node.name} not available for ${plagueType.name}`;
          return prev;
        }
        if (modifier?.dnaCostMultiplier) {
          actualCost = Math.ceil(actualCost * modifier.dnaCostMultiplier);
        }
      }

      if (plagueType) {
        if (node.category === 'transmission') {
          actualCost = Math.ceil(actualCost * plagueType.transmissionCostMultiplier);
        } else if (node.category === 'symptom') {
          actualCost = Math.ceil(actualCost * plagueType.symptomCostMultiplier);
        } else if (node.category === 'ability') {
          actualCost = Math.ceil(actualCost * plagueType.abilityCostMultiplier);
        }
      }

      // Check DNA points (unless forced mutation)
      if (!forced && prev.dnaPoints < actualCost) {
        newsMessage = `Insufficient DNA points for ${node.name} (need ${actualCost})`;
        return prev;
      }

      // Unlock the node
      const newUnlockedNodes = new Set(prev.unlockedNodes);
      newUnlockedNodes.add(nodeId);

      const newDnaPoints = forced ? prev.dnaPoints : prev.dnaPoints - actualCost;

      // Categorize the node
      const newTransmissions = node.category === 'transmission'
        ? [...prev.activeTransmissions, nodeId as any]
        : prev.activeTransmissions;
      const newSymptoms = node.category === 'symptom'
        ? [...prev.activeSymptoms, nodeId as any]
        : prev.activeSymptoms;
      const newAbilities = node.category === 'ability'
        ? [...prev.activeAbilities, nodeId as any]
        : prev.activeAbilities;

      // Recalculate stats
      const newStats = recalculateStats(newUnlockedNodes, prev.selectedPlagueType);

      success = true;
      newsMessage = forced
        ? `${node.name} mutated spontaneously - ${node.flavor}`
        : `${node.name} evolved - ${node.flavor}`;

      return {
        ...prev,
        dnaPoints: newDnaPoints,
        unlockedNodes: newUnlockedNodes,
        activeTransmissions: newTransmissions,
        activeSymptoms: newSymptoms,
        activeAbilities: newAbilities,
        calculatedStats: newStats,
      };
    });

    if (newsMessage) {
      addNewsItem('science', newsMessage, success ? 'important' : 'normal');
    }

    return success;
  }, [addNewsItem, recalculateStats]);

  // Devolve a node (get DNA refund)
  const devolveNode = useCallback((payload: DevolveNodePayload) => {
    const { nodeId, refund = DEVOLVE_REFUND_PERCENTAGE } = payload;

    let success = false;
    let newsMessage: string | null = null;

    setPlagueState((prev) => {
      const node = getNodeById(nodeId);
      if (!node) return prev;

      // Check if unlocked
      if (!prev.unlockedNodes.has(nodeId)) {
        newsMessage = `${node.name} not unlocked`;
        return prev;
      }

      // Check if other nodes depend on this one
      const dependents = ALL_EVOLUTION_NODES.filter((n) =>
        n.requires?.includes(nodeId) && prev.unlockedNodes.has(n.id)
      );

      if (dependents.length > 0) {
        newsMessage = `Cannot devolve ${node.name} - other traits depend on it`;
        return prev;
      }

      // Calculate refund
      const plagueType = prev.selectedPlagueType ? getPlagueTypeById(prev.selectedPlagueType) : null;
      let actualCost = node.dnaCost;

      if (plagueType) {
        if (node.category === 'transmission') {
          actualCost = Math.ceil(actualCost * plagueType.transmissionCostMultiplier);
        } else if (node.category === 'symptom') {
          actualCost = Math.ceil(actualCost * plagueType.symptomCostMultiplier);
        } else if (node.category === 'ability') {
          actualCost = Math.ceil(actualCost * plagueType.abilityCostMultiplier);
        }
      }

      const refundAmount = Math.floor(actualCost * refund);

      // Remove the node
      const newUnlockedNodes = new Set(prev.unlockedNodes);
      newUnlockedNodes.delete(nodeId);

      const newTransmissions = prev.activeTransmissions.filter((id) => id !== nodeId);
      const newSymptoms = prev.activeSymptoms.filter((id) => id !== nodeId);
      const newAbilities = prev.activeAbilities.filter((id) => id !== nodeId);

      // Recalculate stats
      const newStats = recalculateStats(newUnlockedNodes, prev.selectedPlagueType);

      success = true;
      newsMessage = `${node.name} devolved - reclaimed ${refundAmount} DNA points`;

      return {
        ...prev,
        dnaPoints: prev.dnaPoints + refundAmount,
        unlockedNodes: newUnlockedNodes,
        activeTransmissions: newTransmissions,
        activeSymptoms: newSymptoms,
        activeAbilities: newAbilities,
        calculatedStats: newStats,
      };
    });

    if (newsMessage) {
      addNewsItem('science', newsMessage, success ? 'normal' : 'normal');
    }

    return success;
  }, [addNewsItem, recalculateStats]);

  // Add DNA points (from game events)
  const addDNAPoints = useCallback((event: DNAGainEvent) => {
    setPlagueState((prev) => ({
      ...prev,
      dnaPoints: prev.dnaPoints + event.amount,
    }));

    if (event.message) {
      addNewsItem('science', event.message, 'normal');
    }
  }, [addNewsItem]);

  // Check and unlock plague types based on completion
  const checkPlagueCompletion = useCallback((globalInfection: number, populationLoss: number) => {
    setPlagueState((prev) => {
      if (!prev.selectedPlagueType || !prev.plagueStarted) return prev;

      // Update tracking stats
      const newTotalKills = prev.totalKills + populationLoss;
      const newMaxInfection = Math.max(prev.maxInfectionReached, globalInfection);

      // Check completion criteria: 50%+ infection OR 1000+ kills
      const isCompleted = newMaxInfection >= 50 || newTotalKills >= 1000;

      if (isCompleted && !prev.completedPlagues.includes(prev.selectedPlagueType)) {
        const newCompletedPlagues = [...prev.completedPlagues, prev.selectedPlagueType];

        // Unlock next plague type
        const currentPlague = getPlagueTypeById(prev.selectedPlagueType);
        const nextPlagueToUnlock = PLAGUE_TYPES.find(
          p => !p.unlocked && p.unlockRequirement?.includes(prev.selectedPlagueType)
        );

        if (nextPlagueToUnlock) {
          // Update plague type unlocked status (modify in place for persistence)
          nextPlagueToUnlock.unlocked = true;
          addNewsItem(
            'science',
            `PLAGUE MASTERY: ${currentPlague?.name} campaign complete! ${nextPlagueToUnlock.name} pathogen unlocked.`,
            'critical'
          );
        } else {
          addNewsItem(
            'science',
            `PLAGUE MASTERY: ${currentPlague?.name} campaign complete! (${newMaxInfection.toFixed(1)}% infection, ${newTotalKills} casualties)`,
            'important'
          );
        }

        return {
          ...prev,
          completedPlagues: newCompletedPlagues,
          totalKills: newTotalKills,
          maxInfectionReached: newMaxInfection,
        };
      }

      return {
        ...prev,
        totalKills: newTotalKills,
        maxInfectionReached: newMaxInfection,
      };
    });
  }, [addNewsItem]);

  // Random mutation (for virus mainly)
  const triggerRandomMutation = useCallback(() => {
    setPlagueState((prev) => {
      const plagueType = prev.selectedPlagueType ? getPlagueTypeById(prev.selectedPlagueType) : null;
      if (!plagueType) return prev;

      // Check mutation rate
      if (Math.random() > plagueType.naturalMutationRate) {
        return prev;
      }

      // Find symptoms that could mutate
      const availableSymptoms = ALL_EVOLUTION_NODES.filter(
        (node) =>
          node.category === 'symptom' &&
          !prev.unlockedNodes.has(node.id) &&
          canUnlockNode(node.id, prev.unlockedNodes)
      );

      if (availableSymptoms.length === 0) return prev;

      // Pick random symptom
      const randomSymptom = availableSymptoms[Math.floor(Math.random() * availableSymptoms.length)];

      // Evolve it for free
      evolveNode({ nodeId: randomSymptom.id, forced: true });

      return prev;
    });
  }, [evolveNode]);

  // Update cure progress
  const updateCureProgress = useCallback((delta: number) => {
    setPlagueState((prev) => {
      const newProgress = Math.max(0, Math.min(100, prev.cureProgress + delta));

      if (newProgress >= 100 && prev.cureProgress < 100) {
        addNewsItem('crisis', 'CURE COMPLETE - Pathogen neutralization imminent', 'critical');
      } else if (newProgress >= 75 && prev.cureProgress < 75) {
        addNewsItem('crisis', 'Cure research 75% complete', 'urgent');
      } else if (newProgress >= 50 && prev.cureProgress < 50) {
        addNewsItem('science', 'Cure research 50% complete', 'important');
      }

      return {
        ...prev,
        cureProgress: newProgress,
        // Activate cure when it reaches 100%
        cureActive: newProgress >= 100 ? true : prev.cureActive,
      };
    });
  }, [addNewsItem]);

  // Infect new country (legacy, maintains backward compatibility)
  const infectCountry = useCallback((countryId: string) => {
    setPlagueState((prev) => {
      if (prev.countriesInfected.includes(countryId)) {
        return prev;
      }

      const newCountries = [...prev.countriesInfected, countryId];

      // Award DNA for new country
      const dnaGain = 5 + Math.floor(Math.random() * 3); // 5-7 DNA
      addNewsItem('science', `${countryId} infected - gained ${dnaGain} DNA points`, 'important');

      return {
        ...prev,
        countriesInfected: newCountries,
        dnaPoints: prev.dnaPoints + dnaGain,
      };
    });
  }, [addNewsItem]);

  // Deploy bio-weapon to specific targets (new targeted system)
  const deployBioWeapon = useCallback((deployments: Array<{
    nationId: string;
    nationName: string;
    deploymentMethod: string;
    useFalseFlag: boolean;
    falseFlagNationId: string | null;
  }>, currentTurn: number) => {
    setPlagueState((prev) => {
      const newDeployments = deployments.map(d => ({
        nationId: d.nationId,
        deploymentMethod: d.deploymentMethod as any,
        useFalseFlag: d.useFalseFlag,
        falseFlagNationId: d.falseFlagNationId || undefined,
        deployedTurn: currentTurn,
        infected: true,
        infectionLevel: 0.1, // Start at 0.1%
        deaths: 0,
        detected: false,
      }));

      const newCountryInfections = new Map(prev.countryInfections);

      deployments.forEach((d, idx) => {
        const deployment = newDeployments[idx];

        // Initialize country infection state
        newCountryInfections.set(d.nationId, {
          nationId: d.nationId,
          infected: true,
          infectionLevel: 0.1,
          infectionStartTurn: currentTurn,
          containmentLevel: 40, // Base containment
          healthcareQuality: 50, // Base healthcare
          deaths: 0,
          deathRate: 0,
          detectedBioWeapon: false,
          suspicionLevel: 0,
          spreadMethod: 'initial',
        });

        addNewsItem(
          'crisis',
          `Bio-weapon deployed to ${d.nationName} via ${d.deploymentMethod}`,
          'critical'
        );
      });

      return {
        ...prev,
        deploymentHistory: [...prev.deploymentHistory, ...newDeployments],
        countryInfections: newCountryInfections,
      };
    });
  }, [addNewsItem]);

  // Advance country infections each turn (spread mechanics)
  const advanceCountryInfections = useCallback((currentTurn: number, nations: any[]) => {
    setPlagueState((prev) => {
      const newCountryInfections = new Map(prev.countryInfections);
      let dnaGained = 0;
      let newDetections = 0;

      // Process each infected country
      newCountryInfections.forEach((infection, nationId) => {
        if (!infection.infected) return;

        // Calculate infection spread
        const spreadRate = 0.5 + (prev.calculatedStats.totalInfectivity / 100);
        const containmentPenalty = infection.containmentLevel / 100;
        const effectiveSpread = spreadRate * (1 - containmentPenalty);

        const newInfectionLevel = Math.min(100, infection.infectionLevel + effectiveSpread);

        // Calculate deaths based on lethality
        const lethalityFactor = prev.calculatedStats.totalLethality / 100;
        const population = 100000; // Simplified, could pull from nation data
        const newDeaths = Math.floor(
          infection.infectionLevel * population * lethalityFactor * 0.001
        );

        // Update infection state
        newCountryInfections.set(nationId, {
          ...infection,
          infectionLevel: newInfectionLevel,
          deaths: infection.deaths + newDeaths,
          deathRate: newDeaths,
        });

        // Award DNA from deaths
        if (newDeaths > 0) {
          const deathDNA = Math.floor(newDeaths / 10000); // 1 DNA per 10k deaths
          dnaGained += deathDNA;
        }

        // Check for detection
        if (!infection.detectedBioWeapon && infection.infectionLevel > 10) {
          const detectionChance = Math.min(80, infection.infectionLevel * 2);
          if (Math.random() * 100 < detectionChance) {
            newCountryInfections.set(nationId, {
              ...infection,
              detectedBioWeapon: true,
              detectionTurn: currentTurn,
              suspicionLevel: 50,
            });
            newDetections++;
            addNewsItem(
              'intel',
              `Bio-weapon outbreak detected in ${nationId}`,
              'urgent'
            );
          }
        }
      });

      // Spread to neighboring countries (simplified)
      const infectedNations = Array.from(newCountryInfections.keys());
      if (infectedNations.length > 0 && Math.random() < 0.2) {
        // 20% chance per turn to spread to new nation
        const uninfectedNations = nations.filter(n => !newCountryInfections.has(n.id));

        if (uninfectedNations.length > 0) {
          const target = uninfectedNations[Math.floor(Math.random() * uninfectedNations.length)];
          const sourceNation = infectedNations[Math.floor(Math.random() * infectedNations.length)];

          newCountryInfections.set(target.id, {
            nationId: target.id,
            infected: true,
            infectionLevel: 0.1,
            infectionStartTurn: currentTurn,
            containmentLevel: 40,
            healthcareQuality: 50,
            deaths: 0,
            deathRate: 0,
            detectedBioWeapon: false,
            suspicionLevel: 0,
            spreadFrom: sourceNation,
            spreadMethod: 'air-travel',
          });

          dnaGained += 5; // Bonus for spreading
          addNewsItem('crisis', `Pathogen spread to ${target.name} via air travel`, 'important');
        }
      }

      return {
        ...prev,
        countryInfections: newCountryInfections,
        dnaPoints: prev.dnaPoints + dnaGained,
        globalSuspicionLevel: Math.min(100, prev.globalSuspicionLevel + newDetections * 5),
      };
    });
  }, [addNewsItem]);

  // Get available nodes (can be unlocked now)
  const availableNodes = useMemo(() => {
    return ALL_EVOLUTION_NODES.filter((node) =>
      !plagueState.unlockedNodes.has(node.id) &&
      canUnlockNode(node.id, plagueState.unlockedNodes)
    );
  }, [plagueState.unlockedNodes]);

  return {
    plagueState,
    selectPlagueType,
    evolveNode,
    devolveNode,
    addDNAPoints,
    triggerRandomMutation,
    updateCureProgress,
    checkPlagueCompletion,
    infectCountry,
    deployBioWeapon,
    advanceCountryInfections,
    availableNodes,
  };
}
