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

  if (maxThreat < 50) {
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
    reason: `We face a serious threat from ${biggestThreat.name}. Your help would be invaluable.`,
    targetNation: biggestThreatId,
    threatLevel: maxThreat,
  };

  return result;
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

  // Calculate priority based on how much we want to reconcile
  // Defensive AIs are more likely to reconcile
  const personalityBonus = aiNation.ai === 'defensive' ? 20 : 0;

  result.shouldTrigger = true;
  result.urgency = 'medium';
  result.priority = 40 + personalityBonus + (trust * 0.3);
  result.context = {
    reason: 'Our recent conflicts have damaged our relationship. Perhaps we can find common ground.',
    grievanceCount: totalGrievances,
  };

  return result;
}

/**
 * Compensation Demand Trigger: AI demands compensation for grievances
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

  // More likely to demand compensation if aggressive
  const personalityBonus = aiNation.ai === 'aggressive' ? 30 : 0;

  // Calculate urgency based on severity
  let urgency: NegotiationUrgency = 'medium';
  if (totalSeverity > 10) urgency = 'high';

  result.shouldTrigger = true;
  result.urgency = urgency;
  result.priority = 50 + personalityBonus + (totalSeverity * 5);
  result.context = {
    reason: `Your recent actions against us demand compensation.`,
    grievanceId: recentGrievances[0].id,
    grievanceCount: recentGrievances.length,
    totalSeverity,
  };

  return result;
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
  const personalityBonus = aiNation.ai === 'defensive' ? 25 : 0;

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
  const personalityBonus = aiNation.ai === 'aggressive' ? 20 : 0;

  result.shouldTrigger = true;
  result.urgency = 'high';
  result.priority = 70 + personalityBonus;

  // Create context with appropriate reason
  if (hasSevereAgendaViolation) {
    result.context = {
      reason: `Your actions violate my ${agendaViolations[0].name} values. Change your behavior or face consequences.`,
      agendaId: agendaViolations[0].id,
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
