/**
 * AI Bio-Warfare Decision Making
 * Handles AI lab construction, plague selection, evolution, and deployment
 */

import type { Nation } from '@/types/game';
import type { BioLabTier, BioLabFacility } from '@/types/bioLab';
import type { PlagueTypeId, PlagueState, EvolutionNodeId } from '@/types/biowarfare';
import type { DeploymentMethodId } from '@/types/bioDeployment';
import { BIO_LAB_TIERS, canAffordLabTier } from '@/types/bioLab';
import { PLAGUE_TYPES, ALL_EVOLUTION_NODES } from '@/lib/evolutionData';
import { DEPLOYMENT_METHODS } from '@/types/bioDeployment';

export type AIBioStrategy = 'stealth' | 'lethal' | 'balanced';

/**
 * Determine if AI should build or upgrade bio lab
 */
export function shouldBuildBioLab(
  nation: Nation,
  currentTurn: number,
  difficulty: string
): { build: boolean; targetTier?: BioLabTier } {
  const lab = nation.bioLab;

  // Don't build if already constructing
  if (lab && lab.underConstruction) {
    return { build: false };
  }

  const currentTier = lab?.tier || 0;

  // Difficulty affects how aggressively AI builds labs
  const aggressionMap: Record<string, number> = {
    easy: 0.3,
    medium: 0.5,
    hard: 0.7,
    expert: 0.9,
  };

  const aggression = aggressionMap[difficulty] || 0.5;

  // Early game: Build tier 1-2 (defensive/research)
  if (currentTurn < 10 && currentTier < 2) {
    const targetTier = (currentTier + 1) as BioLabTier;
    if (canAffordLabTier(targetTier, nation.production, nation.uranium)) {
      return { build: Math.random() < aggression, targetTier };
    }
  }

  // Mid game: Build BioForge (tier 3) if have resources
  if (currentTurn >= 10 && currentTurn < 25 && currentTier < 3) {
    const targetTier = Math.min(3, currentTier + 1) as BioLabTier;
    if (canAffordLabTier(targetTier, nation.production, nation.uranium)) {
      return { build: Math.random() < aggression * 1.2, targetTier };
    }
  }

  // Late game: Build tier 4 if rich and aggressive
  if (currentTurn >= 25 && currentTier === 3 && nation.production > 200 && nation.uranium > 100) {
    if (canAffordLabTier(4, nation.production, nation.uranium)) {
      return { build: Math.random() < aggression * 0.8, targetTier: 4 };
    }
  }

  return { build: false };
}

/**
 * Select initial plague type based on AI strategy and lab tier
 */
export function selectPlague(
  labTier: BioLabTier,
  strategy: AIBioStrategy,
  difficulty: string
): PlagueTypeId | null {
  if (labTier < 3) return null; // Need BioForge

  // Tier 3: Basic plagues only
  const basicPlagues: PlagueTypeId[] = ['bacteria', 'virus', 'fungus'];

  // Tier 4: Advanced plagues available
  const advancedPlagues: PlagueTypeId[] = ['parasite', 'prion', 'nano-virus', 'bio-weapon'];

  const availablePlagues = labTier >= 4
    ? [...basicPlagues, ...advancedPlagues]
    : basicPlagues;

  // Strategy-based selection
  if (strategy === 'stealth') {
    // Prefer harder-to-detect plagues
    const stealthPicks = availablePlagues.filter(id =>
      ['parasite', 'prion', 'fungus'].includes(id)
    );
    if (stealthPicks.length > 0) {
      return stealthPicks[Math.floor(Math.random() * stealthPicks.length)];
    }
  } else if (strategy === 'lethal') {
    // Prefer high-damage plagues
    const lethalPicks = availablePlagues.filter(id =>
      ['bio-weapon', 'virus', 'bacteria'].includes(id)
    );
    if (lethalPicks.length > 0) {
      return lethalPicks[Math.floor(Math.random() * lethalPicks.length)];
    }
  }

  // Balanced or fallback: choose randomly from available
  return availablePlagues[Math.floor(Math.random() * availablePlagues.length)];
}

/**
 * Determine AI strategy based on difficulty and personality
 */
export function determineStrategy(difficulty: string, nationId: string): AIBioStrategy {
  // Use nation ID hash for consistent strategy per nation
  const hash = nationId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const strategies: AIBioStrategy[] = ['stealth', 'lethal', 'balanced'];

  // Harder difficulty = more likely to choose aggressive strategies
  if (difficulty === 'expert' || difficulty === 'hard') {
    // 40% lethal, 30% stealth, 30% balanced
    const rand = hash % 10;
    if (rand < 4) return 'lethal';
    if (rand < 7) return 'stealth';
    return 'balanced';
  }

  // Medium/Easy: more balanced distribution
  return strategies[hash % 3];
}

/**
 * Select next evolution node based on strategy
 */
export function selectEvolutionNode(
  plagueState: PlagueState,
  strategy: AIBioStrategy,
  availableDNA: number
): EvolutionNodeId | null {
  // Get nodes AI can afford and unlock
  const affordableNodes = ALL_EVOLUTION_NODES.filter(node => {
    if (plagueState.unlockedNodes.has(node.id)) return false;
    if (node.dnaCost > availableDNA) return false;

    // Check prerequisites
    if (node.requires) {
      for (const reqId of node.requires) {
        if (!plagueState.unlockedNodes.has(reqId)) return false;
      }
    }

    // Check conflicts
    if (node.conflicts) {
      for (const conflictId of node.conflicts) {
        if (plagueState.unlockedNodes.has(conflictId)) return false;
      }
    }

    return true;
  });

  if (affordableNodes.length === 0) return null;

  // Filter by strategy
  let priorityNodes = affordableNodes;

  if (strategy === 'stealth') {
    // Prioritize transmission and low-severity symptoms
    priorityNodes = affordableNodes.filter(n =>
      n.category === 'transmission' ||
      (n.category === 'symptom' && (n.effects.severity || 0) <= 3) ||
      (n.category === 'ability' && n.effects.cureResistance)
    );
  } else if (strategy === 'lethal') {
    // Prioritize high lethality and severity
    priorityNodes = affordableNodes.filter(n =>
      (n.category === 'symptom' && ((n.effects.lethality || 0) > 5 || (n.effects.severity || 0) > 5)) ||
      (n.category === 'transmission' && (n.effects.infectivity || 0) > 3)
    );
  } else {
    // Balanced: prioritize transmission early, symptoms mid, abilities late
    const totalNodes = plagueState.unlockedNodes.size;
    if (totalNodes < 5) {
      priorityNodes = affordableNodes.filter(n => n.category === 'transmission');
    } else if (totalNodes < 10) {
      priorityNodes = affordableNodes.filter(n => n.category === 'symptom');
    } else {
      priorityNodes = affordableNodes.filter(n => n.category === 'ability');
    }
  }

  // If no priority nodes, use all affordable
  if (priorityNodes.length === 0) {
    priorityNodes = affordableNodes;
  }

  // Pick random from priority nodes
  return priorityNodes[Math.floor(Math.random() * priorityNodes.length)].id;
}

/**
 * Select deployment targets for AI
 */
export function selectDeploymentTargets(
  aiNation: Nation,
  allNations: Nation[],
  strategy: AIBioStrategy,
  difficulty: string
): Array<{
  nationId: string;
  nationName: string;
  deploymentMethod: DeploymentMethodId;
  useFalseFlag: boolean;
  falseFlagNationId: string | null;
}> | null {
  // Filter to valid targets (not self, not eliminated)
  const potentialTargets = allNations.filter(n =>
    n.id !== aiNation.id && !n.isPlayer && n.population > 0
  );

  if (potentialTargets.length === 0) return null;

  // Difficulty affects target count
  const targetCount = difficulty === 'expert' ? 2 : 1;

  // Select targets (prefer high population or enemies)
  const targets = potentialTargets
    .sort((a, b) => {
      const aThreat = aiNation.threats?.[a.id] || 0;
      const bThreat = aiNation.threats?.[b.id] || 0;
      return bThreat - aThreat + (b.population - a.population) * 0.0001;
    })
    .slice(0, targetCount);

  // Choose deployment method based on strategy
  let methodId: DeploymentMethodId = 'covert';

  if (strategy === 'stealth') {
    methodId = 'covert'; // Low detection
  } else if (strategy === 'lethal') {
    methodId = 'airport'; // Fast spread
  } else {
    methodId = Math.random() < 0.5 ? 'covert' : 'airport';
  }

  // Hard/Expert difficulty may use false flags
  const useFalseFlag = (difficulty === 'hard' || difficulty === 'expert') && Math.random() < 0.4;

  return targets.map(target => {
    let falseFlagNationId = null;

    if (useFalseFlag) {
      // Blame another nation (not self, not target)
      const scapegoats = allNations.filter(n =>
        n.id !== aiNation.id && n.id !== target.id && n.population > 0
      );
      if (scapegoats.length > 0) {
        falseFlagNationId = scapegoats[Math.floor(Math.random() * scapegoats.length)].id;
      }
    }

    return {
      nationId: target.id,
      nationName: target.name,
      deploymentMethod: methodId,
      useFalseFlag: useFalseFlag && !!falseFlagNationId,
      falseFlagNationId,
    };
  });
}

/**
 * Determine if AI should deploy bio-weapon
 */
export function shouldDeploy(
  nation: Nation,
  currentTurn: number,
  difficulty: string
): boolean {
  const lab = nation.bioLab;
  const plagueState = nation.plagueState;

  // Need tier 3+ lab and plague selected
  if (!lab || lab.tier < 3 || !plagueState || !plagueState.plagueStarted) {
    return false;
  }

  // Don't deploy if already deployed
  if (plagueState.deploymentHistory && plagueState.deploymentHistory.length > 0) {
    return false;
  }

  // Need sufficient DNA and evolution (at least 3 nodes unlocked)
  if (plagueState.dnaPoints < 10 || plagueState.unlockedNodes.size < 3) {
    return false;
  }

  // Difficulty affects deployment timing
  const deploymentTurnMap: Record<string, number> = {
    easy: 20,
    medium: 15,
    hard: 12,
    expert: 10,
  };

  const deploymentTurn = deploymentTurnMap[difficulty] || 15;

  if (currentTurn < deploymentTurn) {
    return false;
  }

  // Random chance (more aggressive on higher difficulty)
  const chanceMap: Record<string, number> = {
    easy: 0.1,
    medium: 0.2,
    hard: 0.3,
    expert: 0.4,
  };

  return Math.random() < (chanceMap[difficulty] || 0.2);
}
