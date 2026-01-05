/**
 * AI Casus Belli Decision Making
 *
 * AI logic for deciding when to declare war, when to seek peace,
 * and how to use the Casus Belli system strategically.
 */

import type { Nation, GameState } from '../types/game';
import type { CasusBelli, WarState, PeaceOffer } from '../types/casusBelli';
import type { Grievance, Claim } from '../types/grievancesAndClaims';
import {
  getBestCasusBelli,
  validateWarDeclaration,
  generateAutomaticCasusBelli,
} from './casusBelliUtils';
import { shouldSeekPeace, getWarSummary } from './warDeclarationUtils';
import {
  generateAIPeaceOffer,
  evaluatePeaceOffer,
} from './peaceTermsUtils';
import { getWarDeclarationSummary } from './casusBelliIntegration';

function toGrievanceArray(grievances: Nation['grievances']): Grievance[] {
  return Array.isArray(grievances) ? grievances : [];
}

function toClaimArray(claims: Nation['claims']): Claim[] {
  return Array.isArray(claims) ? claims : [];
}

/**
 * AI personality traits affecting war decisions
 */
export interface AIWarPersonality {
  aggression: number; // 0-100, how eager to declare war
  patience: number; // 0-100, willingness to wait for good CB
  opportunism: number; // 0-100, likelihood of exploiting weaknesses
  honorBound: number; // 0-100, respects Casus Belli requirements
  expansionist: number; // 0-100, desires territorial conquest
}

/**
 * Get AI personality from nation
 */
export function getAIWarPersonality(nation: Nation): AIWarPersonality {
  // Map AI personalities to war behavior
  const personalityMap: Record<string, AIWarPersonality> = {
    aggressive: {
      aggression: 80,
      patience: 30,
      opportunism: 70,
      honorBound: 40,
      expansionist: 85,
    },
    defensive: {
      aggression: 30,
      patience: 70,
      opportunism: 40,
      honorBound: 80,
      expansionist: 40,
    },
    diplomatic: {
      aggression: 40,
      patience: 80,
      opportunism: 50,
      honorBound: 90,
      expansionist: 50,
    },
    opportunistic: {
      aggression: 60,
      patience: 50,
      opportunism: 95,
      honorBound: 50,
      expansionist: 70,
    },
    expansionist: {
      aggression: 75,
      patience: 40,
      opportunism: 80,
      honorBound: 50,
      expansionist: 95,
    },
    isolationist: {
      aggression: 20,
      patience: 90,
      opportunism: 30,
      honorBound: 70,
      expansionist: 20,
    },
  };

  return (
    personalityMap[nation.aiPersonality || 'diplomatic'] ||
    personalityMap.diplomatic
  );
}

// ============================================================================
// Helper Functions for War Declaration Evaluation
// ============================================================================

/**
 * Result of a war factor evaluation
 */
interface FactorEvaluation {
  score: number;
  reasons: string[];
}

/**
 * Evaluates Casus Belli availability and quality
 */
function evaluateCasusBelli(
  aiNation: Nation,
  targetNation: Nation,
  currentTurn: number,
  personality: AIWarPersonality
): {
  score: number;
  reasons: string[];
  bestCB?: CasusBelli;
  earlyReturn?: { shouldDeclare: boolean; confidence: number };
} {
  const reasons: string[] = [];
  let score = 0;

  const grievances = toGrievanceArray(aiNation.grievances);
  const claims = toClaimArray(aiNation.claims);
  const casusBelli = Array.isArray(aiNation.casusBelli)
    ? aiNation.casusBelli
    : [];

  const bestCB = getBestCasusBelli(
    aiNation,
    targetNation,
    casusBelli,
    currentTurn
  );

  if (!bestCB) {
    // Generate potential CBs to see if we should build them
    const potentialCBs = generateAutomaticCasusBelli(
      aiNation,
      targetNation,
      grievances,
      claims,
      currentTurn
    );

    if (potentialCBs.length > 0) {
      reasons.push(
        `Could generate Casus Belli: ${potentialCBs[0].type} (${potentialCBs[0].justification})`
      );

      // Low honor-bound nations might declare war anyway
      if (personality.honorBound < 40 && personality.aggression > 70) {
        score = 30;
        reasons.push('Aggressive personality might ignore CB requirements');
      }
    } else {
      reasons.push('No Casus Belli available');
      return {
        score: 0,
        reasons,
        earlyReturn: { shouldDeclare: false, confidence: 0 },
      };
    }
  } else {
    reasons.push(
      `Best Casus Belli: ${bestCB.type} (justification: ${bestCB.justification})`
    );
    score += bestCB.justification / 2; // 0-50 points
  }

  return { score, reasons, bestCB };
}

/**
 * Evaluates military strength comparison
 */
function evaluateMilitaryStrength(
  aiNation: Nation,
  targetNation: Nation
): FactorEvaluation {
  const myMilitary =
    aiNation.missiles * 10 +
    (aiNation.bombers || 0) * 5 +
    (aiNation.submarines || 0) * 8;
  const theirMilitary =
    targetNation.missiles * 10 +
    (targetNation.bombers || 0) * 5 +
    (targetNation.submarines || 0) * 8;
  const militaryRatio = myMilitary / (theirMilitary || 1);

  if (militaryRatio > 1.5) {
    return {
      score: 20,
      reasons: [`Strong military advantage (${militaryRatio.toFixed(1)}x)`],
    };
  } else if (militaryRatio < 0.7) {
    return {
      score: -30,
      reasons: [`Military disadvantage (${militaryRatio.toFixed(1)}x)`],
    };
  }

  return { score: 0, reasons: [] };
}

/**
 * Evaluates relationship and threat factors
 */
function evaluateRelationshipAndThreat(
  aiNation: Nation,
  targetNation: Nation
): FactorEvaluation {
  const reasons: string[] = [];
  let score = 0;

  // Relationship factor
  const relationship = aiNation.relationships?.[targetNation.id] || 0;
  if (relationship < -50) {
    score += 15;
    reasons.push(`Hostile relationship (${relationship})`);
  } else if (relationship > 0) {
    score -= 20;
    reasons.push(`Positive relationship (${relationship})`);
  }

  // Threat level factor
  const threatLevel = aiNation.threats?.[targetNation.id] || 0;
  if (threatLevel > 60) {
    score += 20;
    reasons.push(`High threat level (${threatLevel})`);
  }

  return { score, reasons };
}

/**
 * Evaluates personality-based confidence modifiers
 */
function evaluatePersonalityFactors(
  personality: AIWarPersonality,
  validation: ReturnType<typeof validateWarDeclaration>
): FactorEvaluation {
  const reasons: string[] = [];
  let score = 0;

  // Aggression and opportunism
  score += (personality.aggression - 50) / 2; // -25 to +25
  score += (personality.opportunism - 50) / 4; // -12.5 to +12.5

  // Honor-bound check
  if (validation.validity !== 'valid' && personality.honorBound > 60) {
    score -= 40;
    reasons.push(
      `Insufficient justification (honorBound: ${personality.honorBound})`
    );
  }

  return { score, reasons };
}

/**
 * Evaluates alliance balance between nations
 */
function evaluateAllianceBalance(
  aiNation: Nation,
  targetNation: Nation,
  allNations: Nation[]
): FactorEvaluation {
  const theirAllies = allNations.filter((n) =>
    targetNation.alliances?.includes(n.id)
  );
  const myAllies = allNations.filter((n) => aiNation.alliances?.includes(n.id));

  if (theirAllies.length > myAllies.length) {
    return {
      score: -15,
      reasons: [
        `Target has more allies (${theirAllies.length} vs ${myAllies.length})`,
      ],
    };
  } else if (myAllies.length > theirAllies.length) {
    return {
      score: 10,
      reasons: ['We have alliance advantage'],
    };
  }

  return { score: 0, reasons: [] };
}

/**
 * Evaluates economic readiness for war
 */
function evaluateEconomicStrength(aiNation: Nation): FactorEvaluation {
  if (aiNation.production < 30) {
    return {
      score: -20,
      reasons: [`Weak economy (production: ${aiNation.production})`],
    };
  }
  return { score: 0, reasons: [] };
}

/**
 * Evaluates expansionist ideology bonus
 */
function evaluateExpansionistBonus(
  personality: AIWarPersonality,
  bestCB?: CasusBelli
): FactorEvaluation {
  if (personality.expansionist > 70 && bestCB?.type === 'territorial-claim') {
    return {
      score: 15,
      reasons: ['Expansionist ideology supports territorial claims'],
    };
  }
  return { score: 0, reasons: [] };
}

/**
 * Evaluates penalty for ongoing wars
 */
function evaluateActiveWars(aiNation: Nation): FactorEvaluation {
  const activeWarsCount = aiNation.activeWars?.length || 0;
  if (activeWarsCount > 0) {
    return {
      score: -25 * activeWarsCount,
      reasons: [`Already fighting ${activeWarsCount} war(s)`],
    };
  }
  return { score: 0, reasons: [] };
}

// ============================================================================
// Main War Declaration Function
// ============================================================================

/**
 * AI evaluates whether to declare war
 *
 * Refactored to use helper functions for each evaluation factor.
 * Each factor is independently testable and clearly documented.
 */
export function aiShouldDeclareWar(
  aiNation: Nation,
  targetNation: Nation,
  allNations: Nation[],
  currentTurn: number
): {
  shouldDeclare: boolean;
  confidence: number; // 0-100
  bestCasusBelli?: CasusBelli;
  reasoning: string[];
} {
  const personality = getAIWarPersonality(aiNation);
  const reasoning: string[] = [];
  let confidence = 0;

  // Step 1: Evaluate Casus Belli
  const cbEval = evaluateCasusBelli(aiNation, targetNation, currentTurn, personality);
  confidence += cbEval.score;
  reasoning.push(...cbEval.reasons);

  // Early return if no CB available
  if (cbEval.earlyReturn) {
    return { ...cbEval.earlyReturn, reasoning };
  }

  // Step 2: Validate war declaration
  const grievances = toGrievanceArray(aiNation.grievances);
  const claims = toClaimArray(aiNation.claims);
  const casusBelli = Array.isArray(aiNation.casusBelli)
    ? aiNation.casusBelli
    : [];

  const validation = validateWarDeclaration(
    aiNation,
    targetNation,
    grievances,
    claims,
    casusBelli,
    undefined,
    currentTurn
  );

  if (!validation.canDeclareWar) {
    reasoning.push(`Cannot declare war: ${validation.blockers?.join(', ')}`);
    return {
      shouldDeclare: false,
      confidence: 0,
      bestCasusBelli: cbEval.bestCB,
      reasoning,
    };
  }

  // Step 3: Evaluate military strength
  const militaryEval = evaluateMilitaryStrength(aiNation, targetNation);
  confidence += militaryEval.score;
  reasoning.push(...militaryEval.reasons);

  // Step 4: Evaluate relationship and threat
  const relationshipEval = evaluateRelationshipAndThreat(aiNation, targetNation);
  confidence += relationshipEval.score;
  reasoning.push(...relationshipEval.reasons);

  // Step 5: Evaluate personality factors
  const personalityEval = evaluatePersonalityFactors(personality, validation);
  confidence += personalityEval.score;
  reasoning.push(...personalityEval.reasons);

  // Step 6: Evaluate alliance balance
  const allianceEval = evaluateAllianceBalance(aiNation, targetNation, allNations);
  confidence += allianceEval.score;
  reasoning.push(...allianceEval.reasons);

  // Step 7: Evaluate economic strength
  const economicEval = evaluateEconomicStrength(aiNation);
  confidence += economicEval.score;
  reasoning.push(...economicEval.reasons);

  // Step 8: Evaluate expansionist bonus
  const expansionistEval = evaluateExpansionistBonus(personality, cbEval.bestCB);
  confidence += expansionistEval.score;
  reasoning.push(...expansionistEval.reasons);

  // Step 9: Evaluate active wars penalty
  const activeWarsEval = evaluateActiveWars(aiNation);
  confidence += activeWarsEval.score;
  reasoning.push(...activeWarsEval.reasons);

  // Step 10: Final decision
  const threshold = 60 - personality.aggression / 3; // 27-60
  const shouldDeclare = confidence >= threshold;

  reasoning.push(
    `Final confidence: ${confidence.toFixed(0)} (threshold: ${threshold.toFixed(0)})`
  );

  return {
    shouldDeclare,
    confidence: Math.max(0, Math.min(100, confidence)),
    bestCasusBelli: cbEval.bestCB,
    reasoning,
  };
}

/**
 * AI evaluates whether to accept a peace offer
 */
export function aiShouldAcceptPeace(
  aiNation: Nation,
  offeringNation: Nation,
  warState: WarState,
  peaceOffer: PeaceOffer,
  currentTurn: number
): {
  shouldAccept: boolean;
  counterOffer?: PeaceOffer;
  reasoning: string[];
} {
  const personality = getAIWarPersonality(aiNation);
  const reasoning: string[] = [];

  // Evaluate peace offer
  const evaluation = evaluatePeaceOffer(
    aiNation,
    offeringNation,
    warState,
    peaceOffer,
    currentTurn
  );

  reasoning.push(...evaluation.reasons);

  // Check war exhaustion
  const shouldSeek = shouldSeekPeace(aiNation, warState, currentTurn);
  if (shouldSeek) {
    reasoning.push('War exhaustion is high - peace is attractive');
    evaluation.acceptanceScore += 20;
  }

  // Personality adjustments
  if (personality.honorBound > 70) {
    // Honor-bound nations more likely to accept fair peace
    if (peaceOffer.terms.type === 'white-peace') {
      evaluation.acceptanceScore += 15;
      reasoning.push('Honor-bound personality accepts white peace');
    }
  }

  if (personality.aggression > 70) {
    // Aggressive nations demand more
    evaluation.acceptanceScore -= 20;
    reasoning.push('Aggressive personality demands better terms');
  }

  // War score check
  const warSummary = getWarSummary(warState);
  if (
    warSummary.leadingSide === 'attacker' &&
    warState.attackerNationId === aiNation.id
  ) {
    evaluation.acceptanceScore -= 15;
    reasoning.push('Winning the war - can demand more');
  } else if (
    warSummary.leadingSide === 'defender' &&
    warState.defenderNationId === aiNation.id
  ) {
    evaluation.acceptanceScore -= 15;
    reasoning.push('Defending successfully - can hold out');
  }

  const shouldAccept = evaluation.acceptanceScore >= 30;

  // Generate counter-offer if rejecting but close
  let counterOffer: PeaceOffer | undefined;
  if (!shouldAccept && evaluation.acceptanceScore > 10) {
    counterOffer = generateAIPeaceOffer(
      aiNation,
      offeringNation,
      warState,
      currentTurn
    );
    reasoning.push('Generating counter-offer');
  }

  return {
    shouldAccept,
    counterOffer,
    reasoning,
  };
}

/**
 * AI evaluates whether to offer peace
 */
export function aiShouldOfferPeace(
  aiNation: Nation,
  enemyNation: Nation,
  warState: WarState,
  currentTurn: number
): {
  shouldOffer: boolean;
  peaceOffer?: PeaceOffer;
  reasoning: string[];
} {
  const personality = getAIWarPersonality(aiNation);
  const reasoning: string[] = [];

  // Check if we should seek peace
  const shouldSeek = shouldSeekPeace(aiNation, warState, currentTurn);

  if (shouldSeek) {
    reasoning.push('War exhaustion suggests seeking peace');

    const peaceOffer = generateAIPeaceOffer(
      aiNation,
      enemyNation,
      warState,
      currentTurn
    );

    return {
      shouldOffer: true,
      peaceOffer,
      reasoning,
    };
  }

  // Check war progress
  const warSummary = getWarSummary(warState);
  const isAttacker = warState.attackerNationId === aiNation.id;
  const myScore = isAttacker
    ? warState.attackerWarScore
    : warState.defenderWarScore;
  const enemyScore = isAttacker
    ? warState.defenderWarScore
    : warState.attackerWarScore;

  // Offer peace if winning decisively
  if (myScore > enemyScore + 40 && warSummary.canEndWithVictory) {
    reasoning.push('Winning decisively - offer favorable peace terms');

    const peaceOffer = generateAIPeaceOffer(
      aiNation,
      enemyNation,
      warState,
      currentTurn
    );

    return {
      shouldOffer: true,
      peaceOffer,
      reasoning,
    };
  }

  // Diplomatic personalities offer peace more readily
  if (personality.honorBound > 70 && Math.abs(myScore - enemyScore) < 20) {
    reasoning.push('Diplomatic personality seeks peace in stalemate');

    const peaceOffer = generateAIPeaceOffer(
      aiNation,
      enemyNation,
      warState,
      currentTurn
    );

    return {
      shouldOffer: true,
      peaceOffer,
      reasoning,
    };
  }

  reasoning.push('Not offering peace at this time');
  return {
    shouldOffer: false,
    reasoning,
  };
}

/**
 * AI prioritizes targets for war
 */
export function aiPrioritizeWarTargets(
  aiNation: Nation,
  allNations: Nation[],
  currentTurn: number
): Array<{
  target: Nation;
  priority: number;
  reasoning: string[];
}> {
  const personality = getAIWarPersonality(aiNation);
  const targets: Array<{
    target: Nation;
    priority: number;
    reasoning: string[];
  }> = [];

  for (const target of allNations) {
    if (target.id === aiNation.id) continue;
    if (target.eliminated) continue;
    if (aiNation.alliances?.includes(target.id)) continue;

    const reasoning: string[] = [];
    let priority = 0;

    // Check for Casus Belli
    const bestCB = getBestCasusBelli(
      aiNation,
      target,
      aiNation.casusBelli || [],
      currentTurn
    );

    if (bestCB) {
      priority += bestCB.justification / 2;
      reasoning.push(`Has Casus Belli: ${bestCB.type} (${bestCB.justification})`);
    }

    // Relationship
    const relationship = aiNation.relationships?.[target.id] || 0;
    if (relationship < -50) {
      priority += 30;
      reasoning.push(`Hostile relationship: ${relationship}`);
    } else if (relationship > 50) {
      priority -= 40;
      reasoning.push(`Friendly relationship: ${relationship}`);
    }

    // Threat level
    const threatLevel = aiNation.threats?.[target.id] || 0;
    if (threatLevel > 60) {
      priority += 25;
      reasoning.push(`High threat: ${threatLevel}`);
    }

    // Military strength
    const myMilitary =
      aiNation.missiles * 10 +
      (aiNation.bombers || 0) * 5 +
      (aiNation.submarines || 0) * 8;
    const theirMilitary =
      target.missiles * 10 +
      (target.bombers || 0) * 5 +
      (target.submarines || 0) * 8;
    const militaryRatio = myMilitary / (theirMilitary || 1);

    if (militaryRatio > 1.5) {
      priority += 20;
      reasoning.push(`Military advantage: ${militaryRatio.toFixed(1)}x`);
    } else if (militaryRatio < 0.8) {
      priority -= 20;
      reasoning.push(`Military disadvantage: ${militaryRatio.toFixed(1)}x`);
    }

    // Grievances
    const grievances = aiNation.grievances?.filter(
      (g) => g.againstNationId === target.id && !g.resolved
    );
    if (grievances && grievances.length > 0) {
      priority += 15;
      reasoning.push(`Has ${grievances.length} grievance(s)`);
    }

    // Claims
    const claims = aiNation.claims?.filter(
      (c) => c.onNationId === target.id && !c.renounced
    );
    if (claims && claims.length > 0) {
      priority += 20;
      reasoning.push(`Has ${claims.length} territorial claim(s)`);
    }

    // Personality factors
    if (personality.expansionist > 70) {
      priority += 10;
      reasoning.push('Expansionist personality');
    }

    targets.push({
      target,
      priority: Math.max(0, priority),
      reasoning,
    });
  }

  // Sort by priority
  return targets.sort((a, b) => b.priority - a.priority);
}
