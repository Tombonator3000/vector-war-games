import { useState, useCallback, useMemo } from 'react';
import type {
  PlagueState,
  EvolutionNodeId,
  TransmissionId,
  SymptomId,
  AbilityId,
  EvolveNodePayload,
  DevolveNodePayload,
  DNAGainEvent,
  PlagueTypeId,
} from '@/types/biowarfare';
import type { DeploymentMethodId } from '@/types/bioDeployment';
import {
  ALL_EVOLUTION_NODES,
  getNodeById,
  canUnlockNode,
  getPlagueTypeById,
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
    vaccineAcceleration: 0,
    radiationMitigation: 0,
  },
  countriesInfected: [],
  deploymentHistory: [],
  countryInfections: new Map(),
  globalSuspicionLevel: 0,
  nationsKnowingTruth: [],
  attributionAttempts: 0,
  cureProgress: 0,
  cureActive: false,
  unlockedPlagueTypes: new Set(['bacteria', 'virus'] as PlagueTypeId[]), // Bacteria and Virus unlocked by default
  completedPlagues: new Set(),
  plagueCompletionStats: {
    totalKills: 0,
    peakInfection: 0,
    nationsInfected: 0,
  },
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

    // Check if plague type is unlocked (runtime check against plague state)
    setPlagueState((prev) => {
      if (!prev.unlockedPlagueTypes.has(plagueTypeId)) {
        addNewsItem('crisis', `${plagueType.name} not yet unlocked - complete prerequisite campaigns`, 'important');
        return prev;
      }

      addNewsItem(
        'science',
        `BioForge initialized ${plagueType.name} pathogen - ${plagueType.specialMechanic}`,
        'important'
      );

      return {
        ...prev,
        selectedPlagueType: plagueTypeId,
        plagueStarted: true,
        cureActive: plagueType.startWithCure,
        // Reset completion stats for new plague run
        plagueCompletionStats: {
          totalKills: 0,
          peakInfection: 0,
          nationsInfected: 0,
        },
      };
    });

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
      vaccineAcceleration: 0,
      radiationMitigation: 0,
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

      if (node.defenseEffects?.vaccineProgress) {
        stats.vaccineAcceleration += node.defenseEffects.vaccineProgress * effectMultiplier;
      }
      if (node.defenseEffects?.radiationMitigation) {
        stats.radiationMitigation = Math.min(
          1,
          stats.radiationMitigation + node.defenseEffects.radiationMitigation * effectMultiplier
        );
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
        } else if (node.category === 'ability' || node.category === 'defense') {
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

      // Categorize the node - type assertions are safe because category determines the union type
      const newTransmissions = node.category === 'transmission'
        ? [...prev.activeTransmissions, nodeId as TransmissionId]
        : prev.activeTransmissions;
      const newSymptoms = node.category === 'symptom'
        ? [...prev.activeSymptoms, nodeId as SymptomId]
        : prev.activeSymptoms;
      const newAbilities = node.category === 'ability'
        ? [...prev.activeAbilities, nodeId as AbilityId]
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
      addNewsItem('science', newsMessage, success ? 'important' : 'routine');
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
        } else if (node.category === 'ability' || node.category === 'defense') {
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
      addNewsItem('science', newsMessage, success ? 'routine' : 'routine');
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
      addNewsItem('science', event.message, 'routine');
    }
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
    deploymentMethod: DeploymentMethodId;
    useFalseFlag: boolean;
    falseFlagNationId: string | null;
  }>, currentTurn: number) => {
    setPlagueState((prev) => {
      const newDeployments = deployments.map(d => ({
        nationId: d.nationId,
        deploymentMethod: d.deploymentMethod,
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

  // Activate cure deployment
  const activateCure = useCallback(() => {
    setPlagueState((prev) => ({
      ...prev,
      cureActive: true,
    }));
  }, []);

  // Update plague completion stats
  const updatePlagueStats = useCallback((globalInfection: number, deaths: number, nationsInfected: number) => {
    setPlagueState((prev) => {
      const updated = {
        ...prev,
        plagueCompletionStats: {
          totalKills: prev.plagueCompletionStats.totalKills + deaths,
          peakInfection: Math.max(prev.plagueCompletionStats.peakInfection, globalInfection),
          nationsInfected: Math.max(prev.plagueCompletionStats.nationsInfected, nationsInfected),
        },
      };
      return updated;
    });
  }, []);

  // Check for plague completion and unlock next type
  const checkPlagueCompletion = useCallback(() => {
    setPlagueState((prev) => {
      if (!prev.selectedPlagueType || !prev.plagueStarted) return prev;
      if (prev.completedPlagues.has(prev.selectedPlagueType)) return prev;

      const stats = prev.plagueCompletionStats;

      // Completion criteria: 50%+ peak infection OR 1000+ total kills
      const hasCompletedPlague = stats.peakInfection >= 50 || stats.totalKills >= 1000;

      if (!hasCompletedPlague) return prev;

      // Mark current plague as completed
      const newCompletedPlagues = new Set(prev.completedPlagues);
      newCompletedPlagues.add(prev.selectedPlagueType);

      // Determine next plague to unlock based on completion tree
      const unlockedTypes = new Set(prev.unlockedPlagueTypes);
      let newlyUnlockedType: PlagueTypeId | null = null;

      const unlockMap: Record<PlagueTypeId, PlagueTypeId> = {
        'bacteria': 'fungus',
        'virus': 'parasite',
        'fungus': 'parasite', // Alternative path
        'parasite': 'prion',
        'prion': 'nano-virus',
        'nano-virus': 'bio-weapon',
        'bio-weapon': 'bio-weapon', // Final type
      };

      const nextType = unlockMap[prev.selectedPlagueType];
      if (nextType && !unlockedTypes.has(nextType)) {
        unlockedTypes.add(nextType);
        newlyUnlockedType = nextType;
      }

      if (newlyUnlockedType) {
        const nextPlagueType = getPlagueTypeById(newlyUnlockedType);
        if (nextPlagueType) {
          addNewsItem(
            'science',
            `🧬 PLAGUE MASTERY: ${nextPlagueType.name} pathogen unlocked! (${stats.peakInfection.toFixed(0)}% infection, ${stats.totalKills} kills)`,
            'critical'
          );
        }
      }

      return {
        ...prev,
        completedPlagues: newCompletedPlagues,
        unlockedPlagueTypes: unlockedTypes,
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
    activateCure,
    updatePlagueStats,
    checkPlagueCompletion,
    infectCountry,
    deployBioWeapon,
    advanceCountryInfections,
    availableNodes,
  };
}
