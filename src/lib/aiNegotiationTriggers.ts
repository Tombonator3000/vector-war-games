/**
 * AI Negotiation Triggers
 *
 * Determines when AI nations should proactively initiate negotiations
 * with the player or other AI nations based on various game conditions.
 */

import type { Nation } from '@/types/game';
import type { NegotiationPurpose, NegotiationUrgency } from '@/types/negotiation';
import { getRelationship } from './relationshipUtils';
import { getTrust } from '@/types/trustAndFavors';
import { checkAgendaViolations } from './agendaSystem';
import { GrievanceSeverityWeights } from '@/types/grievancesAndClaims';

// ============================================================================
// Constants
// ============================================================================

/**
 * Minimum turns between AI-initiated negotiations to prevent spam
 */
const MIN_TURNS_BETWEEN_NEGOTIATIONS = 5;

/**
 * Maximum AI-initiated negotiations per game turn (across all AI nations)
 */
const MAX_NEGOTIATIONS_PER_TURN = 2;

/**
 * Tracking when AI last initiated negotiations
 */
const lastNegotiationTurn: Record<string, number> = {};

// ============================================================================
// Trigger Result Interface
// ============================================================================

export interface TriggerResult {
  shouldTrigger: boolean;
  purpose: NegotiationPurpose;
  urgency: NegotiationUrgency;
  priority: number; // Higher = more important (0-100)
  context: {
    reason: string;
    targetNation?: string;
    resourceType?: string;
    grievanceId?: string;
    threatLevel?: number;
    [key: string]: any;
  };
}

// ============================================================================
// Individual Trigger Functions
// ============================================================================

/**
 * Threat Trigger: AI seeks help when facing a powerful enemy
 * ENHANCED: Personality affects willingness to ask for help
 */
export function checkThreatTrigger(
  aiNation: Nation,
  targetNation: Nation,
  allNations: Nation[],
  currentTurn: number
): TriggerResult {
  const result: TriggerResult = {
    shouldTrigger: false,
    purpose: 'request-help',
    urgency: 'low',
    priority: 0,
    context: { reason: '' },
  };

  // Find nations that pose a threat to the AI
  const threats = aiNation.threats || {};
  const maxThreat = Math.max(...Object.values(threats));

  // ENHANCED: Personality affects threat threshold
  const aiType = aiNation.aiPersonality || 'balanced';
  let threatThreshold = 50;

  switch (aiType) {
    case 'defensive':
      threatThreshold = 40; // Seeks help earlier
      break;
    case 'aggressive':
      threatThreshold = 70; // Reluctant to ask for help
      break;
    case 'isolationist':
      threatThreshold = 90; // Almost never asks for help
      break;
    case 'balanced':
      threatThreshold = 50;
      break;
    case 'trickster':
      threatThreshold = 45; // Quick to seek allies against threats
      break;
    case 'chaotic':
      threatThreshold = 60;
      break;
  }

  if (maxThreat < threatThreshold) {
    return result; // Not threatened enough
  }

  // Find the biggest threat
  const biggestThreatId = Object.entries(threats)
    .sort((a, b) => b[1] - a[1])[0]?.[0];

  if (!biggestThreatId) {
    return result;
  }

  const biggestThreat = allNations.find(n => n.id === biggestThreatId);
  if (!biggestThreat) {
    return result;
  }

  // Only seek help from nations that are:
  // 1. Not the threat itself
  // 2. Have decent relationship (>-20)
  // 3. Are militarily capable
  if (targetNation.id === biggestThreatId) {
    return result;
  }

  const relationship = getRelationship(aiNation, targetNation.id);
  if (relationship < -20) {
    return result; // Too hostile
  }

  const targetPower = (targetNation.missiles || 0) + (targetNation.bombers || 0) + (targetNation.submarines || 0);
  const threatPower = (biggestThreat.missiles || 0) + (biggestThreat.bombers || 0) + (biggestThreat.submarines || 0);

  if (targetPower < threatPower * 0.5) {
    return result; // Target too weak to help
  }

  // Calculate urgency based on threat level
  let urgency: NegotiationUrgency = 'medium';
  if (maxThreat > 80) urgency = 'critical';
  else if (maxThreat > 65) urgency = 'high';

  result.shouldTrigger = true;
  result.urgency = urgency;
  result.priority = Math.min(100, maxThreat + 20);
  result.context = {
    reason: getThreatRequestMessage(aiType, biggestThreat.name),
    targetNation: biggestThreatId,
    threatLevel: maxThreat,
  };

  return result;
}

/**
 * Get personality-appropriate threat request message
 */
function getThreatRequestMessage(aiType: string, threatName: string): string {
  switch (aiType) {
    case 'defensive':
      return `${threatName} poses a grave threat to our security. We must stand together against this danger.`;
    case 'aggressive':
      return `${threatName} challenges us both. Together we can crush them decisively.`;
    case 'balanced':
      return `We face a serious threat from ${threatName}. Your help would be invaluable.`;
    case 'isolationist':
      return `I rarely ask for assistance, but ${threatName} threatens our very existence. Will you help?`;
    case 'trickster':
      return `${threatName} grows too powerful. Perhaps we could... arrange their downfall? Mutually beneficial, of course.`;
    case 'chaotic':
      return `${threatName} is being VERY rude! Let's teach them a lesson together! Or separately! Or maybe just confuse them!`;
    default:
      return `We face a serious threat from ${threatName}. Your help would be invaluable.`;
  }
}

/**
 * Resource Surplus Trigger: AI offers trade when it has excess resources
 */
export function checkResourceSurplusTrigger(
  aiNation: Nation,
  targetNation: Nation,
  allNations: Nation[],
  currentTurn: number
): TriggerResult {
  const result: TriggerResult = {
    shouldTrigger: false,
    purpose: 'trade-opportunity',
    urgency: 'low',
    priority: 0,
    context: { reason: '' },
  };

  const relationship = getRelationship(aiNation, targetNation.id);
  if (relationship < 0) {
    return result; // Only trade with friendly nations
  }

  // Check for resource surplus
  const hasGoldSurplus = (aiNation.production || 0) > 150;
  const hasIntelSurplus = (aiNation.intel || 0) > 80;
  const hasUraniumSurplus = (aiNation.uranium || 0) > 100;

  if (!hasGoldSurplus && !hasIntelSurplus && !hasUraniumSurplus) {
    return result;
  }

  // Determine what we have and what they might need
  let resourceType = '';
  if (hasGoldSurplus && (targetNation.production || 0) < 100) {
    resourceType = 'gold';
  } else if (hasIntelSurplus && (targetNation.intel || 0) < 50) {
    resourceType = 'intel';
  } else if (hasUraniumSurplus && (targetNation.uranium || 0) < 50) {
    resourceType = 'uranium';
  }

  if (!resourceType) {
    return result; // They don't need what we have
  }

  result.shouldTrigger = true;
  result.urgency = 'low';
  result.priority = 30 + relationship * 0.3;
  result.context = {
    reason: `We have surplus ${resourceType} and thought you might be interested in a trade.`,
    resourceType,
  };

  return result;
}

/**
 * Reconciliation Trigger: AI seeks to repair damaged relationship
 * ENHANCED: More sophisticated personality-based decision making
 */
export function checkReconciliationTrigger(
  aiNation: Nation,
  targetNation: Nation,
  allNations: Nation[],
  currentTurn: number
): TriggerResult {
  const result: TriggerResult = {
    shouldTrigger: false,
    purpose: 'reconciliation',
    urgency: 'low',
    priority: 0,
    context: { reason: '' },
  };

  const relationship = getRelationship(aiNation, targetNation.id);
  const trust = getTrust(aiNation, targetNation.id);

  // Only reconcile if relationship is negative but not extremely hostile
  if (relationship >= 0 || relationship < -60) {
    return result;
  }

  // Check if we have grievances against them or they against us
  const ourGrievances = (aiNation.grievances || []).filter(
    g => g.againstNationId === targetNation.id
  );
  const theirGrievances = (targetNation.grievances || []).filter(
    g => g.againstNationId === aiNation.id
  );

  const totalGrievances = ourGrievances.length + theirGrievances.length;

  if (totalGrievances === 0) {
    return result; // No grievances to reconcile
  }

  // More likely to reconcile if trust is still decent
  if (trust < 30) {
    return result; // Trust too low
  }

  // ENHANCED: Personality-based reconciliation likelihood
  const aiType = aiNation.ai || 'balanced';
  let personalityBonus = 0;
  let shouldAttempt = true;

  switch (aiType) {
    case 'defensive':
      personalityBonus = 25; // Very likely to reconcile
      break;
    case 'balanced':
      personalityBonus = 10; // Moderately likely
      break;
    case 'aggressive':
      personalityBonus = -15; // Less likely, prefers confrontation
      shouldAttempt = relationship > -40; // Only if not too hostile
      break;
    case 'isolationist':
      personalityBonus = 15; // Prefer peace over conflict
      break;
    case 'trickster':
      personalityBonus = 5; // May reconcile for strategic advantage
      break;
    case 'chaotic':
      personalityBonus = Math.random() > 0.5 ? 20 : -20; // Unpredictable
      break;
  }

  if (!shouldAttempt) {
    return result;
  }

  result.shouldTrigger = true;
  result.urgency = 'medium';
  result.priority = 40 + personalityBonus + (trust * 0.3);
  result.context = {
    reason: getReconciliationMessage(aiType),
    grievanceCount: totalGrievances,
  };

  return result;
}

/**
 * Get personality-appropriate reconciliation message
 */
function getReconciliationMessage(aiType: string): string {
  switch (aiType) {
    case 'defensive':
      return 'Our conflicts serve neither of us. Let us find peace and mutual security.';
    case 'aggressive':
      return 'You have proven resilient. Perhaps there is value in cooperation over conflict.';
    case 'balanced':
      return 'Our recent conflicts have damaged our relationship. Perhaps we can find common ground.';
    case 'isolationist':
      return 'I wish to end our hostilities and return to peaceful coexistence.';
    case 'trickster':
      return 'Our past quarrels are... unfortunate. Shall we explore more profitable arrangements?';
    case 'chaotic':
      return 'Why fight when we could be friends? Or enemies who pretend to be friends? Either way!';
    default:
      return 'Our recent conflicts have damaged our relationship. Perhaps we can find common ground.';
  }
}

/**
 * Compensation Demand Trigger: AI demands compensation for grievances
 * ENHANCED: Personality affects likelihood and tone of demands
 */
export function checkCompensationDemandTrigger(
  aiNation: Nation,
  targetNation: Nation,
  allNations: Nation[],
  currentTurn: number
): TriggerResult {
  const result: TriggerResult = {
    shouldTrigger: false,
    purpose: 'demand-compensation',
    urgency: 'medium',
    priority: 0,
    context: { reason: '' },
  };

  // Check for recent grievances (within last 10 turns)
  const recentGrievances = (aiNation.grievances || []).filter(
    g => g.againstNationId === targetNation.id &&
         currentTurn - g.createdTurn <= 10
  );

  if (recentGrievances.length === 0) {
    return result;
  }

  // Calculate severity of grievances
  const totalSeverity = recentGrievances.reduce((sum, g) => sum + GrievanceSeverityWeights[g.severity], 0);

  if (totalSeverity < 3) {
    return result; // Grievances not severe enough
  }

  // ENHANCED: Personality affects likelihood and priority
  const aiType = aiNation.ai || 'balanced';
  let personalityBonus = 0;
  let shouldDemand = true;

  switch (aiType) {
    case 'aggressive':
      personalityBonus = 35; // Very likely to demand
      break;
    case 'balanced':
      personalityBonus = 10;
      break;
    case 'defensive':
      personalityBonus = -10; // Less confrontational
      shouldDemand = totalSeverity > 5; // Only for serious grievances
      break;
    case 'isolationist':
      personalityBonus = -20; // Avoids confrontation
      shouldDemand = totalSeverity > 8;
      break;
    case 'trickster':
      personalityBonus = 20; // Sees opportunity in grievances
      break;
    case 'chaotic':
      personalityBonus = Math.random() > 0.3 ? 25 : -10; // Unpredictable
      break;
  }

  if (!shouldDemand) {
    return result;
  }

  // Calculate urgency based on severity
  let urgency: NegotiationUrgency = 'medium';
  if (totalSeverity > 10) urgency = 'high';

  result.shouldTrigger = true;
  result.urgency = urgency;
  result.priority = 50 + personalityBonus + (totalSeverity * 5);
  result.context = {
    reason: getCompensationMessage(aiType, totalSeverity),
    grievanceId: recentGrievances[0].id,
    grievanceCount: recentGrievances.length,
    totalSeverity,
  };

  return result;
}

/**
 * Get personality-appropriate compensation demand message
 */
function getCompensationMessage(aiType: string, severity: number): string {
  switch (aiType) {
    case 'aggressive':
      return severity > 8
        ? 'Your transgressions against us will not be forgotten. Pay the price or face our wrath.'
        : 'You have wronged us. Compensation is not optional.';
    case 'balanced':
      return 'Your recent actions against us demand compensation. Let us resolve this fairly.';
    case 'defensive':
      return 'Your actions have harmed our people. We request reparations to restore balance.';
    case 'trickster':
      return 'Such unfortunate... incidents. Surely you wish to make amends? I have calculated the exact price of your forgiveness.';
    case 'chaotic':
      return 'You broke the rules! Or maybe there were no rules? Either way, COMPENSATION! Now! Or later! Your choice! Not really!';
    default:
      return 'Your recent actions against us demand compensation.';
  }
}

/**
 * Mutual Benefit Trigger: AI proposes alliance when strategically beneficial
 */
export function checkMutualBenefitTrigger(
  aiNation: Nation,
  targetNation: Nation,
  allNations: Nation[],
  currentTurn: number
): TriggerResult {
  const result: TriggerResult = {
    shouldTrigger: false,
    purpose: 'offer-alliance',
    urgency: 'medium',
    priority: 0,
    context: { reason: '' },
  };

  const relationship = getRelationship(aiNation, targetNation.id);
  const trust = getTrust(aiNation, targetNation.id);

  // Need good relationship and trust for alliance
  if (relationship < 25 || trust < 50) {
    return result;
  }

  // Check if already allied
  const isAllied = (aiNation.alliances || []).includes(targetNation.id);
  if (isAllied) {
    return result;
  }

  // Check for common enemies
  const ourThreats = aiNation.threats || {};
  const theirThreats = targetNation.threats || {};

  const commonThreats = Object.keys(ourThreats).filter(
    threatId => theirThreats[threatId] &&
                ourThreats[threatId] > 30 &&
                theirThreats[threatId] > 30
  );

  if (commonThreats.length === 0) {
    return result; // No common enemies
  }

  // Defensive AIs are more likely to seek alliances
  const personalityBonus = aiNation.aiPersonality === 'defensive' ? 25 : 0;

  result.shouldTrigger = true;
  result.urgency = 'medium';
  result.priority = 60 + personalityBonus + (relationship * 0.5);
  result.context = {
    reason: `We share common interests and threats. An alliance would benefit us both.`,
    commonThreats,
  };

  return result;
}

/**
 * Warning Trigger: AI issues warning about player behavior
 */
export function checkWarningTrigger(
  aiNation: Nation,
  targetNation: Nation,
  allNations: Nation[],
  currentTurn: number
): TriggerResult {
  const result: TriggerResult = {
    shouldTrigger: false,
    purpose: 'warning',
    urgency: 'high',
    priority: 0,
    context: { reason: '' },
  };

  // Check if target is behaving aggressively or violating norms
  const recentGrievances = (aiNation.grievances || []).filter(
    g => g.againstNationId === targetNation.id &&
         currentTurn - g.createdTurn <= 3 // Very recent
  );

  // Check for agenda violations (Phase 4)
  const agendaViolations = checkAgendaViolations(
    targetNation,
    aiNation,
    { nations: allNations, turn: currentTurn } as any
  );

  // Trigger if either grievances or agenda violations exist
  if (recentGrievances.length === 0 && agendaViolations.length === 0) {
    return result;
  }

  const relationship = getRelationship(aiNation, targetNation.id);

  // Only warn if relationship is not already extremely hostile
  if (relationship < -70) {
    return result; // Past the point of warnings
  }

  // Check severity of recent actions
  const hasSevereGrievance = recentGrievances.some(g => g.severity === 'major' || g.severity === 'severe');
  const hasSevereAgendaViolation = agendaViolations.length > 0;

  if (!hasSevereGrievance && !hasSevereAgendaViolation) {
    return result;
  }

  // Aggressive AIs more likely to issue warnings
  const personalityBonus = aiNation.aiPersonality === 'aggressive' ? 20 : 0;

  result.shouldTrigger = true;
  result.urgency = 'high';
  result.priority = 70 + personalityBonus;

  // Create context with appropriate reason
  if (hasSevereAgendaViolation) {
    const primaryViolation = agendaViolations[0];
    const violationDetail = primaryViolation.modifiers[0]?.description;
    const reason = violationDetail
      ? `Your actions violate my ${primaryViolation.agenda.name} values. ${violationDetail} Change your behavior or face consequences.`
      : `Your actions violate my ${primaryViolation.agenda.name} values. Change your behavior or face consequences.`;

    result.context = {
      reason,
      agendaId: primaryViolation.agenda.id,
    };
  } else {
    result.context = {
      reason: `Your recent actions are unacceptable. Change your behavior or face consequences.`,
      grievanceId: recentGrievances[0].id,
    };
  }

  return result;
}

// ============================================================================
// Main Trigger Check Function
// ============================================================================

/**
 * Check all triggers for a given AI-target pair and return the highest priority one
 */
export function checkAllTriggers(
  aiNation: Nation,
  targetNation: Nation,
  allNations: Nation[],
  currentTurn: number,
  globalNegotiationCount: number
): TriggerResult | null {
  // Throttle: Check if AI initiated negotiation too recently
  const lastTurn = lastNegotiationTurn[aiNation.id] || 0;
  if (currentTurn - lastTurn < MIN_TURNS_BETWEEN_NEGOTIATIONS) {
    return null; // Too soon
  }

  // Check global limit
  if (globalNegotiationCount >= MAX_NEGOTIATIONS_PER_TURN) {
    return null; // Too many negotiations this turn
  }

  // Run all trigger checks
  const triggers = [
    checkWarningTrigger(aiNation, targetNation, allNations, currentTurn),
    checkThreatTrigger(aiNation, targetNation, allNations, currentTurn),
    checkCompensationDemandTrigger(aiNation, targetNation, allNations, currentTurn),
    checkMutualBenefitTrigger(aiNation, targetNation, allNations, currentTurn),
    checkReconciliationTrigger(aiNation, targetNation, allNations, currentTurn),
    checkResourceSurplusTrigger(aiNation, targetNation, allNations, currentTurn),
  ];

  // Filter to only triggered results
  const activeTriggers = triggers.filter(t => t.shouldTrigger);

  if (activeTriggers.length === 0) {
    return null;
  }

  // Sort by priority and return highest
  activeTriggers.sort((a, b) => b.priority - a.priority);
  const selectedTrigger = activeTriggers[0];

  // Update last negotiation turn
  lastNegotiationTurn[aiNation.id] = currentTurn;

  return selectedTrigger;
}

/**
 * Reset trigger tracking (useful for testing or new game)
 */
export function resetTriggerTracking(): void {
  Object.keys(lastNegotiationTurn).forEach(key => {
    delete lastNegotiationTurn[key];
  });
}

/**
 * Get when AI last initiated negotiation (for debugging)
 */
export function getLastNegotiationTurn(aiNationId: string): number {
  return lastNegotiationTurn[aiNationId] || 0;
}
