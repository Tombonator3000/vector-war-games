/**
 * AI Bio-Warfare Integration
 * Provides easy integration points for AI bio-warfare into the main game loop
 */

import type { Nation } from '@/types/game';
import type { BioLabFacility } from '@/types/bioLab';
import { BIO_LAB_TIERS } from '@/types/bioLab';
import type { PlagueState, EvolutionNodeId } from '@/types/biowarfare';
import { ALL_EVOLUTION_NODES } from '@/lib/evolutionData';
import {
  shouldBuildBioLab,
  selectPlague,
  determineStrategy,
  selectEvolutionNode,
  selectDeploymentTargets,
  shouldDeploy,
  type AIBioStrategy,
} from './aiBioWarfare';

/**
 * Initialize bio-warfare state for a nation (call once at game start or nation creation)
 */
export function initializeAINationBioWarfare(nation: Nation, difficulty: string): void {
  if (nation.isPlayer) return;

  // Initialize empty bioLab state
  if (!nation.bioLab) {
    nation.bioLab = {
      tier: 0,
      active: false,
      underConstruction: false,
      constructionProgress: 0,
      constructionTarget: 0,
      targetTier: 0,
      productionInvested: 0,
      uraniumInvested: 0,
      suspicionLevel: 0,
      knownByNations: [],
      lastIntelAttempt: 0,
      researchSpeed: 1.0,
      sabotaged: false,
      sabotageTurnsRemaining: 0,
    };
  }

  // Determine AI strategy
  if (!nation.bioStrategy) {
    nation.bioStrategy = determineStrategy(difficulty, nation.id);
  }

  // Initialize empty plague state (will be populated when plague selected)
  if (!nation.plagueState) {
    nation.plagueState = {
      selectedPlagueType: null,
      plagueStarted: false,
      dnaPoints: 15,
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
    };
  }
}

/**
 * Process AI bio-warfare decisions for a single turn
 * Call this during AI turn processing for each AI nation
 */
export function processAIBioWarfareTurn(
  nation: Nation,
  allNations: Nation[],
  currentTurn: number,
  difficulty: string,
  onLabConstructionStart?: (nationId: string, tier: number) => void,
  onPlagueSelected?: (nationId: string, plagueType: string) => void,
  onNodeEvolved?: (nationId: string, nodeId: EvolutionNodeId) => void,
  onDeployment?: (nationId: string, targets: any[]) => void
): void {
  if (nation.isPlayer) return;

  // Ensure initialized
  if (!nation.bioLab || !nation.plagueState || !nation.bioStrategy) {
    initializeAINationBioWarfare(nation, difficulty);
  }

  const lab = nation.bioLab!;
  const plagueState = nation.plagueState!;
  const strategy = nation.bioStrategy!;

  // 1. Advance lab construction if under construction
  if (lab.underConstruction) {
    lab.constructionProgress++;

    if (lab.constructionProgress >= lab.constructionTarget) {
      // Construction complete!
      lab.tier = lab.targetTier;
      lab.active = true;
      lab.underConstruction = false;
      lab.constructionProgress = 0;
      lab.constructionTarget = 0;
    }
  }

  // 2. Decide if should build/upgrade lab
  if (!lab.underConstruction) {
    const buildDecision = shouldBuildBioLab(nation, currentTurn, difficulty);

    if (buildDecision.build && buildDecision.targetTier) {
      const tier = buildDecision.targetTier;
      const tierDef = BIO_LAB_TIERS[tier];

      // Deduct resources
      nation.production -= tierDef.productionCost;
      nation.uranium -= tierDef.uraniumCost;

      // Start construction
      lab.underConstruction = true;
      lab.constructionProgress = 0;
      lab.constructionTarget = tierDef.constructionTurns;
      lab.targetTier = tier;
      lab.productionInvested = tierDef.productionCost;
      lab.uraniumInvested = tierDef.uraniumCost;

      if (onLabConstructionStart) {
        onLabConstructionStart(nation.id, tier);
      }
    }
  }

  // 3. Select plague type if lab tier 3+ and no plague yet
  if (lab.tier >= 3 && !plagueState.plagueStarted) {
    const plagueTypeId = selectPlague(lab.tier, strategy, difficulty);

    if (plagueTypeId) {
      plagueState.selectedPlagueType = plagueTypeId;
      plagueState.plagueStarted = true;
      plagueState.dnaPoints = 15; // Starting DNA

      if (onPlagueSelected) {
        onPlagueSelected(nation.id, plagueTypeId);
      }
    }
  }

  // 4. Evolve nodes if have plague and DNA
  if (plagueState.plagueStarted && plagueState.dnaPoints >= 3) {
    const nodeToEvolve = selectEvolutionNode(plagueState, strategy, plagueState.dnaPoints);

    if (nodeToEvolve) {
      const node = ALL_EVOLUTION_NODES.find(
        (n: any) => n.id === nodeToEvolve
      );

      if (node) {
        // Deduct DNA
        plagueState.dnaPoints -= node.dnaCost;

        // Add to unlocked nodes
        plagueState.unlockedNodes.add(nodeToEvolve);

        // Update category arrays
        if (node.category === 'transmission') {
          plagueState.activeTransmissions.push(nodeToEvolve as any);
        } else if (node.category === 'symptom') {
          plagueState.activeSymptoms.push(nodeToEvolve as any);
        } else if (node.category === 'ability') {
          plagueState.activeAbilities.push(nodeToEvolve as any);
        }

        // Recalculate stats (simplified)
        plagueState.calculatedStats.totalInfectivity += node.effects.infectivity || 0;
        plagueState.calculatedStats.totalSeverity += node.effects.severity || 0;
        plagueState.calculatedStats.totalLethality += node.effects.lethality || 0;
        plagueState.calculatedStats.cureResistance += node.effects.cureResistance || 0;

        if (onNodeEvolved) {
          onNodeEvolved(nation.id, nodeToEvolve);
        }
      }
    }
  }

  // 5. Deploy bio-weapon if ready
  if (shouldDeploy(nation, currentTurn, difficulty)) {
    const targets = selectDeploymentTargets(nation, allNations, strategy, difficulty);

    if (targets && targets.length > 0) {
      // Mark as deployed
      plagueState.deploymentHistory.push(...targets.map(t => ({
        nationId: t.nationId,
        deploymentMethod: t.deploymentMethod as any,
        useFalseFlag: t.useFalseFlag,
        falseFlagNationId: t.falseFlagNationId || undefined,
        deployedTurn: currentTurn,
        infected: true,
        infectionLevel: 0.1,
        deaths: 0,
        detected: false,
      })));

      // Initialize country infections
      targets.forEach(t => {
        plagueState.countryInfections.set(t.nationId, {
          nationId: t.nationId,
          infected: true,
          infectionLevel: 0.1,
          infectionStartTurn: currentTurn,
          containmentLevel: 40,
          healthcareQuality: 50,
          deaths: 0,
          deathRate: 0,
          detectedBioWeapon: false,
          suspicionLevel: 0,
          spreadMethod: 'initial',
        });
      });

      if (onDeployment) {
        onDeployment(nation.id, targets);
      }
    }
  }
}

/**
 * Initialize bio-warfare for all AI nations at game start
 */
export function initializeAllAINations(nations: Nation[], difficulty: string): void {
  nations.forEach(nation => {
    if (!nation.isPlayer) {
      initializeAINationBioWarfare(nation, difficulty);
    }
  });
}

/**
 * Process bio-warfare for all AI nations in a single turn
 */
export function processAllAINationsBioWarfare(
  nations: Nation[],
  currentTurn: number,
  difficulty: string,
  callbacks?: {
    onLabConstructionStart?: (nationId: string, tier: number) => void;
    onPlagueSelected?: (nationId: string, plagueType: string) => void;
    onNodeEvolved?: (nationId: string, nodeId: EvolutionNodeId) => void;
    onDeployment?: (nationId: string, targets: any[]) => void;
  }
): void {
  nations.forEach(nation => {
    if (!nation.isPlayer) {
      processAIBioWarfareTurn(
        nation,
        nations,
        currentTurn,
        difficulty,
        callbacks?.onLabConstructionStart,
        callbacks?.onPlagueSelected,
        callbacks?.onNodeEvolved,
        callbacks?.onDeployment
      );
    }
  });
}
