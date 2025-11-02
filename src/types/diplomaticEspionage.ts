/**
 * Diplomatic Espionage System - Phase 4
 * Use Intel to uncover hidden information about other nations
 */

export type EspionageTargetType =
  | 'hidden-agendas'      // Reveal hidden agendas (costs 30 Intel)
  | 'ongoing-negotiations' // See AI's negotiations with others (costs 25 Intel)
  | 'military-plans'      // Reveal military plans and targets (costs 35 Intel)
  | 'resource-stockpiles' // See exact resource counts (costs 20 Intel)
  | 'research-progress'   // See current research projects (costs 25 Intel)
  | 'alliance-intentions'; // See AI's alliance-seeking behavior (costs 20 Intel)

export interface EspionageOperation {
  id: string;
  targetType: EspionageTargetType;
  targetNation: string;
  executedTurn: number;
  intelCost: number;
  detectionRisk: number; // 0-100, chance of being caught
  wasDetected: boolean;
  revealedInformation: unknown; // Type depends on targetType
}

export interface RevealedAgenda {
  agendaId: string;
  agendaName: string;
  description: string;
  revealedTurn: number;
  revealMethod: 'espionage' | 'natural' | 'event';
}

export interface RevealedNegotiation {
  withNation: string;
  proposalType: string;
  offeredItems: string[];
  requestedItems: string[];
  likelihood: number; // AI's evaluation score
  turn: number;
}

export interface RevealedMilitaryPlan {
  targetNation: string | null;
  plannedAction: 'missile-strike' | 'invasion' | 'cyber-attack' | 'none';
  estimatedTurn: number;
  confidence: 'low' | 'medium' | 'high';
}

export interface RevealedResources {
  production: number;
  uranium: number;
  intel: number;
  missiles: number;
  warheads: Record<number, number>;
}

export interface EspionageHistory {
  operations: EspionageOperation[];
  detectedOperations: number; // How many times caught
  successfulOperations: number;
  revealedAgendas: RevealedAgenda[];
  revealedNegotiations: RevealedNegotiation[];
}

/**
 * Intel costs for each espionage type
 */
export const ESPIONAGE_COSTS: Record<EspionageTargetType, number> = {
  'hidden-agendas': 30,
  'ongoing-negotiations': 25,
  'military-plans': 35,
  'resource-stockpiles': 20,
  'research-progress': 25,
  'alliance-intentions': 20,
};

/**
 * Base detection risk for each espionage type (before modifiers)
 */
export const ESPIONAGE_DETECTION_RISKS: Record<EspionageTargetType, number> = {
  'hidden-agendas': 25, // Relatively low risk
  'ongoing-negotiations': 30, // Medium risk
  'military-plans': 45, // High risk - military secrets well-guarded
  'resource-stockpiles': 20, // Low risk - easier to observe
  'research-progress': 35, // Medium-high risk
  'alliance-intentions': 25, // Low-medium risk
};

/**
 * Relationship penalty if caught spying
 */
export const ESPIONAGE_CAUGHT_PENALTY = -20;

/**
 * Calculate detection risk with modifiers
 */
export function calculateDetectionRisk(
  baseRisk: number,
  targetCyberDefense: number,
  spyIntelBonus: number,
  relationship: number
): number {
  let risk = baseRisk;

  // Target's cyber defense increases risk
  risk += targetCyberDefense * 0.3;

  // Spy's intel capabilities reduce risk
  risk -= spyIntelBonus * 0.2;

  // Good relationships slightly reduce suspicion
  if (relationship > 50) {
    risk -= 5;
  } else if (relationship < -50) {
    risk += 5; // They're watching you closely
  }

  return Math.max(5, Math.min(95, risk)); // Clamp between 5-95%
}

/**
 * Check if espionage operation is detected
 */
export function rollDetection(detectionRisk: number): boolean {
  return Math.random() * 100 < detectionRisk;
}
