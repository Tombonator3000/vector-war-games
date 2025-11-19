/**
 * AI Government Selection System
 *
 * Handles AI decision-making for researching civics technologies
 * and selecting government types based on their strategic situation.
 */

import type { Nation } from '@/types/game';
import type { GovernmentType } from '@/types/government';
import { GOVERNMENT_BONUSES, GOVERNMENT_INFO } from '@/types/government';
import {
  canChangeGovernment,
  transitionGovernment,
  isGovernmentUnlocked,
} from './governmentSwitching';

/**
 * Evaluate if AI should prioritize civics research
 * Returns a priority score (0-1) where higher = more important
 */
export function evaluateCivicsResearchPriority(
  nation: Nation,
  aiPersonality: string | undefined,
  currentTurn: number
): number {
  let priority = 0.15; // Base priority

  // Increase priority if nation has high research capability (technocracy might be good)
  const productionMultiplier = nation.productionMultiplier || 1.0;
  if (productionMultiplier >= 1.1) {
    priority += 0.1; // Already good at production, consider technocracy
  }

  // Increase priority for aggressive nations (military junta, dictatorship)
  if (aiPersonality === 'aggressive') {
    priority += 0.15;
  }

  // Increase priority for defensive nations (constitutional monarchy, absolute monarchy)
  if (aiPersonality === 'defensive') {
    priority += 0.12;
  }

  // Increase priority if current government is not optimal
  const currentGov = nation.governmentState?.currentGovernment;
  if (currentGov === 'democracy') {
    // Democracy is default, AI might want to explore other options
    priority += 0.08;
  }

  // Increase priority if stability is high (can afford transition)
  const stability = nation.governmentState?.governmentStability || 50;
  if (stability >= 70) {
    priority += 0.1;
  }

  // Later in game, governments become more important
  if (currentTurn > 20) {
    priority += 0.05;
  }

  return Math.min(1.0, priority);
}

/**
 * Select best government type for AI based on their situation and personality
 */
export function selectOptimalGovernmentForAI(
  nation: Nation,
  aiPersonality: string | undefined,
  nations: Nation[]
): GovernmentType | null {
  if (!nation.governmentState) return null;

  const currentGov = nation.governmentState.currentGovernment;
  const unlockedGovs = nation.unlockedGovernments || ['democracy'];

  // Filter to only unlocked governments
  const availableGovs = unlockedGovs.filter((gov) => gov !== currentGov);

  if (availableGovs.length === 0) return null;

  // Score each government based on AI personality and situation
  interface GovernmentScore {
    gov: GovernmentType;
    score: number;
  }

  const scores: GovernmentScore[] = availableGovs.map((gov) => {
    let score = 0;
    const bonuses = GOVERNMENT_BONUSES[gov];

    // Personality-based scoring
    switch (aiPersonality) {
      case 'aggressive':
        // Prefer military-focused governments
        score += bonuses.recruitmentMultiplier * 20;
        score += bonuses.militaryCostReduction * 50;
        if (gov === 'military_junta' || gov === 'dictatorship') score += 30;
        break;

      case 'defensive':
        // Prefer stable governments with good defense
        score += bonuses.baseStabilityModifier * 2;
        score += bonuses.coupResistance * 0.3;
        if (gov === 'constitutional_monarchy' || gov === 'absolute_monarchy') score += 25;
        break;

      case 'balanced':
        // Prefer balanced governments
        score += bonuses.productionMultiplier * 20;
        score += bonuses.researchMultiplier * 20;
        score += bonuses.baseStabilityModifier;
        if (gov === 'technocracy' || gov === 'one_party_state') score += 20;
        break;

      case 'trickster':
        // Prefer intel-focused governments
        score += bonuses.intelBonus * 2;
        score += bonuses.propagandaEffectiveness * 15;
        if (gov === 'dictatorship' || gov === 'one_party_state') score += 20;
        break;

      case 'isolationist':
        // Prefer stable, self-sufficient governments
        score += bonuses.baseStabilityModifier * 2;
        score += bonuses.productionMultiplier * 15;
        if (gov === 'absolute_monarchy' || gov === 'technocracy') score += 25;
        break;

      default:
        // Default: balanced approach
        score += bonuses.productionMultiplier * 15;
        score += bonuses.researchMultiplier * 15;
        score += bonuses.baseStabilityModifier;
        break;
    }

    // Situational scoring
    const isAtWar = nations.some(
      (other) =>
        other !== nation &&
        !other.eliminated &&
        !nation.treaties?.[other.id]?.truceTurns &&
        (nation.threats?.[other.id] || 0) > 50
    );

    if (isAtWar) {
      // During war, prefer military-focused governments
      score += bonuses.recruitmentMultiplier * 15;
      score += bonuses.militaryCostReduction * 30;
    }

    // If low stability, prefer stable governments
    const stability = nation.governmentState?.governmentStability || 50;
    if (stability < 50) {
      score += bonuses.baseStabilityModifier * 3;
      score += bonuses.coupResistance * 0.5;
    }

    // If high production, consider technocracy
    const production = nation.production || 0;
    if (production > 100 && gov === 'technocracy') {
      score += 25;
    }

    return { gov, score };
  });

  // Sort by score and return best option
  scores.sort((a, b) => b.score - a.score);

  // Only change if score improvement is significant (>15 points)
  if (scores.length > 0 && scores[0].score > 15) {
    return scores[0].gov;
  }

  return null;
}

/**
 * AI decision to change government
 * Called during AI turn processing
 */
export function aiConsiderGovernmentChange(
  nation: Nation,
  currentTurn: number,
  nations: Nation[],
  logFn?: (message: string) => void
): boolean {
  if (!nation.governmentState || !nation.aiPersonality) return false;

  // Check if can change government
  const canChange = canChangeGovernment(nation, currentTurn);
  if (!canChange.allowed) return false;

  // Only consider changing occasionally (15% chance per turn)
  if (Math.random() > 0.15) return false;

  // Select optimal government
  const optimalGov = selectOptimalGovernmentForAI(nation, nation.aiPersonality, nations);

  if (!optimalGov) return false;

  // Attempt transition
  const result = transitionGovernment(nation, optimalGov, currentTurn);

  if (result.success && result.newGovernmentState) {
    // Apply the transition
    nation.governmentState = result.newGovernmentState;

    if (logFn) {
      logFn(
        `${nation.name} transitions to ${GOVERNMENT_INFO[optimalGov].name} (${GOVERNMENT_INFO[optimalGov].icon})`
      );
    }

    return true;
  }

  return false;
}

/**
 * Get AI research priority adjustment for civics techs
 * Used in AI research selection to weight civics vs other research
 */
export function getAICivicsResearchWeight(
  nation: Nation,
  aiPersonality: string | undefined
): number {
  let weight = 1.0; // Default weight

  // Increase weight based on personality
  switch (aiPersonality) {
    case 'aggressive':
      // Aggressive AI wants military junta, dictatorship
      const unlockedGovs = nation.unlockedGovernments || ['democracy'];
      if (!unlockedGovs.includes('military_junta')) {
        weight = 1.4; // High priority to unlock military governments
      }
      break;

    case 'defensive':
      if (!isGovernmentUnlocked(nation, 'constitutional_monarchy')) {
        weight = 1.3;
      }
      break;

    case 'balanced':
      if (!isGovernmentUnlocked(nation, 'technocracy')) {
        weight = 1.2;
      }
      break;

    default:
      weight = 1.1;
      break;
  }

  return weight;
}
