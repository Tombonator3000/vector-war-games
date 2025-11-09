/**
 * Diplomatic Espionage System Helpers
 * Functions to execute and manage espionage operations
 */

import type { Nation, GameState } from '@/types/game';
import type {
  EspionageOperation,
  EspionageTargetType,
  EspionageHistory,
  RevealedAgenda,
  RevealedNegotiation,
  RevealedMilitaryPlan,
  RevealedResources,
} from '@/types/diplomaticEspionage';
import {
  ESPIONAGE_COSTS,
  ESPIONAGE_DETECTION_RISKS,
  ESPIONAGE_CAUGHT_PENALTY,
  calculateDetectionRisk,
  rollDetection,
} from '@/types/diplomaticEspionage';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize espionage history for a nation
 */
export function initializeEspionageHistory(): EspionageHistory {
  return {
    operations: [],
    detectedOperations: 0,
    successfulOperations: 0,
    revealedAgendas: [],
    revealedNegotiations: [],
  };
}

// ============================================================================
// ESPIONAGE OPERATIONS
// ============================================================================

/**
 * Execute an espionage operation
 */
export function executeEspionageOperation(
  spy: Nation,
  target: Nation,
  targetType: EspionageTargetType,
  turn: number,
  gameState: GameState
): {
  success: boolean;
  detected: boolean;
  operation: EspionageOperation;
  revealedInfo: unknown;
  message: string;
} {
  const intelCost = ESPIONAGE_COSTS[targetType];
  const baseRisk = ESPIONAGE_DETECTION_RISKS[targetType];

  // Calculate actual detection risk
  const targetCyberDefense = target.cyber?.defense || 0;
  const spyIntelBonus = spy.intel / 100; // Intel provides bonus
  const relationship = spy.relationships?.[target.id] || 0;

  const detectionRisk = calculateDetectionRisk(
    baseRisk,
    targetCyberDefense,
    spyIntelBonus,
    relationship
  );

  // Roll for detection
  const wasDetected = rollDetection(detectionRisk);

  // Gather intelligence based on type
  let revealedInfo: unknown = null;
  let success = false;
  let message = '';

  if (!wasDetected) {
    // Successful espionage
    success = true;

    switch (targetType) {
      case 'hidden-agendas':
        revealedInfo = revealHiddenAgendas(target, turn);
        message = `Successfully revealed ${target.name}'s hidden agendas!`;
        break;

      case 'ongoing-negotiations':
        revealedInfo = revealOngoingNegotiations(target, gameState, turn);
        message = `Discovered ${target.name}'s ongoing diplomatic negotiations!`;
        break;

      case 'military-plans':
        revealedInfo = revealMilitaryPlans(target, gameState);
        message = `Uncovered ${target.name}'s military plans!`;
        break;

      case 'resource-stockpiles':
        revealedInfo = revealResourceStockpiles(target);
        message = `Obtained intelligence on ${target.name}'s resource stockpiles!`;
        break;

      case 'research-progress':
        revealedInfo = revealResearchProgress(target);
        message = `Discovered ${target.name}'s current research projects!`;
        break;

      case 'alliance-intentions':
        revealedInfo = revealAllianceIntentions(target, gameState);
        message = `Learned about ${target.name}'s alliance-seeking behavior!`;
        break;
    }
  } else {
    // Detected!
    message = `DETECTED! ${target.name} caught you spying and is furious!`;
  }

  const operation: EspionageOperation = {
    id: uuidv4(),
    targetType,
    targetNation: target.id,
    executedTurn: turn,
    intelCost,
    detectionRisk,
    wasDetected,
    revealedInformation: revealedInfo,
  };

  return {
    success,
    detected: wasDetected,
    operation,
    revealedInfo,
    message,
  };
}

// ============================================================================
// INTELLIGENCE GATHERING FUNCTIONS
// ============================================================================

/**
 * Reveal hidden agendas
 */
function revealHiddenAgendas(target: Nation, turn: number): RevealedAgenda[] {
  const revealedAgendas: RevealedAgenda[] = [];

  if (target.agendas) {
    for (const agenda of target.agendas) {
      if (agenda.type === 'hidden' && !agenda.isRevealed) {
        revealedAgendas.push({
          agendaId: agenda.id,
          agendaName: agenda.name,
          description: agenda.description,
          revealedTurn: turn,
          revealMethod: 'espionage',
        });
      }
    }
  }

  return revealedAgendas;
}

/**
 * Reveal ongoing negotiations
 */
function revealOngoingNegotiations(
  target: Nation,
  gameState: GameState,
  turn: number
): RevealedNegotiation[] {
  // This is simulated - in real implementation, would check actual negotiation state
  const negotiations: RevealedNegotiation[] = [];

  // Check if target has active negotiations (if the property exists)
  // For now, return empty array as activeNegotiations may not be implemented
  if (false) {
    for (const negotiation of []) {
      if (true) {
        negotiations.push({
          withNation:
            negotiation.initiatorId === target.id
              ? negotiation.recipientId
              : negotiation.initiatorId,
          proposalType: 'active-negotiation',
          offeredItems: ['[CLASSIFIED]'], // Would include actual items
          requestedItems: ['[CLASSIFIED]'],
          likelihood: 50, // Would calculate actual likelihood
          turn,
        });
      }
    }
  }

  return negotiations;
}

/**
 * Reveal military plans
 */
function revealMilitaryPlans(target: Nation, gameState: GameState): RevealedMilitaryPlan {
  // Analyze target's military posture to infer plans
  const plan: RevealedMilitaryPlan = {
    targetNation: null,
    plannedAction: 'none',
    estimatedTurn: 0,
    confidence: 'low',
  };

  // Check for highest threat level
  if (target.threats) {
    const threats = Object.entries(target.threats);
    if (threats.length > 0) {
      const highestThreat = threats.sort((a, b) => b[1] - a[1])[0];
      if (highestThreat[1] > 50) {
        plan.targetNation = highestThreat[0];
        plan.plannedAction = target.missiles > 5 ? 'missile-strike' : 'cyber-attack';
        plan.estimatedTurn = gameState.turn + Math.floor(Math.random() * 5) + 1;
        plan.confidence = highestThreat[1] > 80 ? 'high' : 'medium';
      }
    }
  }

  return plan;
}

/**
 * Reveal resource stockpiles
 */
function revealResourceStockpiles(target: Nation): RevealedResources {
  return {
    production: target.production,
    uranium: target.uranium,
    intel: target.intel,
    missiles: target.missiles,
    warheads: { ...target.warheads },
  };
}

/**
 * Reveal research progress
 */
function revealResearchProgress(target: Nation): {
  currentResearch: string | null;
  turnsRemaining: number;
  completedResearch: string[];
} {
  return {
    currentResearch: target.researchQueue?.projectId || null,
    turnsRemaining: target.researchQueue?.turnsRemaining || 0,
    completedResearch: target.researched
      ? Object.keys(target.researched).filter((key) => target.researched![key])
      : [],
  };
}

/**
 * Reveal alliance intentions
 */
function revealAllianceIntentions(
  target: Nation,
  gameState: GameState
): {
  seekingAlliance: boolean;
  preferredPartners: string[];
  willingnessToAlly: number;
} {
  // Analyze relationships to infer alliance intentions
  const relationships = target.relationships || {};
  const preferredPartners: string[] = [];

  for (const [nationId, relationship] of Object.entries(relationships)) {
    if (relationship > 40 && !target.alliances?.includes(nationId)) {
      preferredPartners.push(nationId);
    }
  }

  return {
    seekingAlliance: preferredPartners.length > 0,
    preferredPartners,
    willingnessToAlly: preferredPartners.length > 0 ? 70 : 30,
  };
}

// ============================================================================
// ESPIONAGE HISTORY MANAGEMENT
// ============================================================================

/**
 * Add operation to history
 */
export function addOperationToHistory(
  history: EspionageHistory,
  operation: EspionageOperation,
  revealedAgendas?: RevealedAgenda[],
  revealedNegotiations?: RevealedNegotiation[]
): EspionageHistory {
  const updated: EspionageHistory = {
    ...history,
    operations: [operation, ...history.operations].slice(0, 50), // Keep last 50
    detectedOperations: operation.wasDetected
      ? history.detectedOperations + 1
      : history.detectedOperations,
    successfulOperations: !operation.wasDetected
      ? history.successfulOperations + 1
      : history.successfulOperations,
  };

  if (revealedAgendas) {
    updated.revealedAgendas = [...history.revealedAgendas, ...revealedAgendas];
  }

  if (revealedNegotiations) {
    updated.revealedNegotiations = [...history.revealedNegotiations, ...revealedNegotiations];
  }

  return updated;
}

/**
 * Check if player can afford espionage operation
 */
export function canAffordEspionage(spy: Nation, targetType: EspionageTargetType): boolean {
  const cost = ESPIONAGE_COSTS[targetType];
  return spy.intel >= cost;
}

/**
 * Get espionage success rate (inverse of detection risk)
 */
export function getEspionageSuccessRate(
  spy: Nation,
  target: Nation,
  targetType: EspionageTargetType
): number {
  const baseRisk = ESPIONAGE_DETECTION_RISKS[targetType];
  const targetCyberDefense = target.cyber?.defense || 0;
  const spyIntelBonus = spy.intel / 100;
  const relationship = spy.relationships?.[target.id] || 0;

  const detectionRisk = calculateDetectionRisk(
    baseRisk,
    targetCyberDefense,
    spyIntelBonus,
    relationship
  );

  return Math.round(100 - detectionRisk);
}
