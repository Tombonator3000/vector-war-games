/**
 * Spy Diplomatic Integration
 *
 * Handles diplomatic consequences when spies are caught:
 * - Creates grievances
 * - Applies trust penalties
 * - Updates relationships
 * - Handles diplomatic reputation damage
 */

import type { Nation, GameState } from '@/types/game';
import type { SpyAgent, SpyMission, SpyIncident, SpyIncidentResolution } from '@/types/spySystem';
import type { Grievance } from '@/types/grievancesAndClaims';
import { GrievanceDefinitions } from '@/types/grievancesAndClaims';
import { DEFAULT_TRUST, clampTrust } from '@/types/trustAndFavors';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// GRIEVANCE CREATION
// ============================================================================

/**
 * Create espionage grievance when spy is caught
 */
export function createEspionageGrievance(
  targetNation: Nation,
  spyNation: Nation,
  incident: SpyIncident,
  turn: number
): Grievance {
  const baseGrievance = GrievanceDefinitions['espionage-caught'];

  // Adjust severity based on mission type and evidence
  let severity: 'minor' | 'moderate' | 'major' | 'severe' = baseGrievance.defaultSeverity;
  let relationshipPenalty = baseGrievance.relationshipPenalty;
  let trustPenalty = baseGrievance.trustPenalty;
  let expiresIn = baseGrievance.defaultExpiry;

  // Mission type affects severity
  if (incident.missionType === 'assassination') {
    severity = 'severe';
    relationshipPenalty = -45;
    trustPenalty = -50;
    expiresIn = 60;
  } else if (incident.missionType === 'sabotage-military' || incident.missionType === 'sabotage-production') {
    severity = 'major';
    relationshipPenalty = -25;
    trustPenalty = -30;
    expiresIn = 40;
  } else if (incident.missionType === 'rig-election' || incident.missionType === 'sow-dissent') {
    severity = 'major';
    relationshipPenalty = -20;
    trustPenalty = -25;
    expiresIn = 35;
  } else if (incident.missionType === 'steal-tech') {
    severity = 'moderate';
    relationshipPenalty = -15;
    trustPenalty = -18;
    expiresIn = 25;
  }

  // Evidence quality affects penalties
  if (incident.evidenceQuality === 'conclusive') {
    relationshipPenalty = Math.floor(relationshipPenalty * 1.3);
    trustPenalty = Math.floor(trustPenalty * 1.3);
  } else if (incident.evidenceQuality === 'weak') {
    relationshipPenalty = Math.floor(relationshipPenalty * 0.7);
    trustPenalty = Math.floor(trustPenalty * 0.7);
  }

  // Public incidents are worse
  if (incident.publicized) {
    relationshipPenalty = Math.floor(relationshipPenalty * 1.2);
  }

  const grievance: Grievance = {
    id: uuidv4(),
    type: 'espionage-caught',
    severity,
    againstNationId: spyNation.id,
    description: `Caught ${spyNation.name} conducting ${incident.missionType} operations`,
    createdTurn: turn,
    expiresIn,
    relationshipPenalty,
    trustPenalty,
    resolved: false,
  };

  return grievance;
}

/**
 * Add grievance to nation
 */
export function addGrievanceToNation(
  nation: Nation,
  grievance: Grievance
): Nation {
  const updated = { ...nation };

  if (!updated.grievances) {
    updated.grievances = [];
  }

  updated.grievances = [...updated.grievances, grievance];

  return updated;
}

// ============================================================================
// RELATIONSHIP PENALTIES
// ============================================================================

/**
 * Apply relationship penalty for caught spy
 */
export function applySpyRelationshipPenalty(
  targetNation: Nation,
  spyNation: Nation,
  resolution: SpyIncidentResolution,
  turn: number
): Nation {
  const updated = { ...targetNation };

  if (!updated.relationships) {
    updated.relationships = {};
  }

  const currentRelationship = updated.relationships[spyNation.id] || 0;
  const newRelationship = Math.max(-100, currentRelationship + resolution.relationshipPenalty);

  updated.relationships[spyNation.id] = newRelationship;

  // Add to relationship history
  if (!updated.relationshipHistory) {
    updated.relationshipHistory = [];
  }

  updated.relationshipHistory = [
    ...updated.relationshipHistory,
    {
      turn,
      withNation: spyNation.id,
      delta: resolution.relationshipPenalty,
      reason: 'Spy caught conducting espionage',
      newValue: newRelationship,
    },
  ].slice(-100); // Keep last 100 events

  return updated;
}

/**
 * Apply trust penalty for caught spy
 */
export function applySpyTrustPenalty(
  targetNation: Nation,
  spyNation: Nation,
  resolution: SpyIncidentResolution,
  turn: number
): Nation {
  const updated = { ...targetNation };

  if (!updated.trustRecords) {
    updated.trustRecords = {};
  }

  const existingRecord = updated.trustRecords[spyNation.id];
  const currentTrust = existingRecord?.value ?? DEFAULT_TRUST;
  const newTrust = clampTrust(currentTrust + resolution.trustPenalty);

  const history = [
    ...(existingRecord?.history || []),
    {
      turn,
      delta: resolution.trustPenalty,
      reason: 'Spy caught - trust shattered',
      newValue: newTrust,
    },
  ].slice(-20);

  updated.trustRecords[spyNation.id] = {
    value: newTrust,
    lastUpdated: turn,
    history,
  };

  return updated;
}

// ============================================================================
// DIPLOMATIC REPUTATION
// ============================================================================

/**
 * Apply diplomatic reputation penalty for caught spy
 * This affects relationships with ALL nations
 */
export function applyDiplomaticReputationPenalty(
  spyNation: Nation,
  resolution: SpyIncidentResolution,
  gameState: GameState,
  incident: SpyIncident
): {
  updatedSpyNation: Nation;
  affectedNations: Nation[];
} {
  const updated = { ...spyNation };
  const affectedNations: Nation[] = [];

  // Only apply global reputation damage if incident was publicized
  if (!incident.publicized) {
    return { updatedSpyNation: updated, affectedNations };
  }

  // Apply reputation penalty to diplomatic reputation system
  // This is a simplified version - would integrate with full diplomatic reputation system
  const reputationPenalty = resolution.reputationPenalty;

  // All other nations lose some trust/relationship with the spy nation
  for (const nation of gameState.nations) {
    if (nation.id === spyNation.id || nation.id === incident.targetNationId || nation.eliminated) {
      continue;
    }

    const nationCopy = { ...nation };

    // Small relationship penalty with all other nations
    if (!nationCopy.relationships) {
      nationCopy.relationships = {};
    }

    const currentRel = nationCopy.relationships[spyNation.id] || 0;
    const penaltyAmount = Math.floor(reputationPenalty * 0.5); // Half of the reputation penalty
    nationCopy.relationships[spyNation.id] = Math.max(-100, currentRel + penaltyAmount);

    // Small trust penalty too
    if (nationCopy.trustRecords && nationCopy.trustRecords[spyNation.id]) {
      const existingRecord = nationCopy.trustRecords[spyNation.id];
      const currentTrust = existingRecord.value;
      const trustPenaltyAmount = Math.floor(reputationPenalty * 0.3);
      nationCopy.trustRecords[spyNation.id] = {
        value: clampTrust(currentTrust + trustPenaltyAmount),
        lastUpdated: gameState.turn,
        history: [...(existingRecord.history || [])],
      };
    }

    affectedNations.push(nationCopy);
  }

  return { updatedSpyNation: updated, affectedNations };
}

// ============================================================================
// COMPREHENSIVE PENALTY APPLICATION
// ============================================================================

/**
 * Apply all diplomatic consequences for caught spy
 */
export function applyAllSpyConsequences(
  spyNation: Nation,
  targetNation: Nation,
  incident: SpyIncident,
  resolution: SpyIncidentResolution,
  gameState: GameState,
  turn: number
): {
  updatedSpyNation: Nation;
  updatedTargetNation: Nation;
  updatedOtherNations: Nation[];
  messages: string[];
} {
  const messages: string[] = [];

  // Create and add grievance to target nation
  const grievance = createEspionageGrievance(targetNation, spyNation, incident, turn);
  let updatedTargetNation = addGrievanceToNation(targetNation, grievance);

  messages.push(`${targetNation.name} has a ${grievance.severity} grievance against ${spyNation.name}`);

  // Apply relationship penalty
  updatedTargetNation = applySpyRelationshipPenalty(
    updatedTargetNation,
    spyNation,
    resolution,
    turn
  );

  messages.push(
    `Relationship with ${targetNation.name}: ${resolution.relationshipPenalty} (now ${updatedTargetNation.relationships?.[spyNation.id] || 0})`
  );

  // Apply trust penalty
  updatedTargetNation = applySpyTrustPenalty(
    updatedTargetNation,
    spyNation,
    resolution,
    turn
  );

  const newTrust = updatedTargetNation.trustRecords?.[spyNation.id]?.value ?? DEFAULT_TRUST;
  messages.push(`Trust with ${targetNation.name}: ${resolution.trustPenalty} (now ${newTrust})`);

  // Apply diplomatic reputation penalty (affects all nations)
  const reputationResult = applyDiplomaticReputationPenalty(
    spyNation,
    resolution,
    gameState,
    incident
  );

  let updatedSpyNation = reputationResult.updatedSpyNation;
  const updatedOtherNations = reputationResult.affectedNations;

  if (incident.publicized && updatedOtherNations.length > 0) {
    messages.push(
      `Global diplomatic reputation damaged - ${updatedOtherNations.length} nations now view you with suspicion`
    );
  }

  // Check if compensation needs to be paid
  if (resolution.compensationPaid && resolution.compensationPaid > 0) {
    if (updatedSpyNation.diplomaticInfluence) {
      updatedSpyNation = {
        ...updatedSpyNation,
        diplomaticInfluence: {
          ...updatedSpyNation.diplomaticInfluence,
          dipCurrency: Math.max(
            0,
            (updatedSpyNation.diplomaticInfluence.dipCurrency || 0) - resolution.compensationPaid
          ),
        },
      };

      messages.push(`Paid ${resolution.compensationPaid} DIP as compensation`);
    }
  }

  // Check if council sanctions were applied
  if (resolution.councilSanctions) {
    messages.push(`⚠️ International Council imposed sanctions for espionage violations!`);
    // Council sanctions would be handled separately in council system
  }

  return {
    updatedSpyNation,
    updatedTargetNation,
    updatedOtherNations,
    messages,
  };
}

// ============================================================================
// FALSE FLAG OPERATIONS
// ============================================================================

/**
 * Apply false flag operation effects to frame another nation
 */
export function applyFalseFlagDiplomacy(
  targetNation: Nation,
  framedNation: Nation,
  spyNation: Nation,
  turn: number,
  gameState: GameState
): {
  updatedTargetNation: Nation;
  updatedFramedNation: Nation;
  messages: string[];
} {
  const messages: string[] = [];
  let updatedTargetNation = { ...targetNation };
  const updatedFramedNation = { ...framedNation };

  // Target nation blames framed nation
  if (!updatedTargetNation.relationships) {
    updatedTargetNation.relationships = {};
  }

  const currentRel = updatedTargetNation.relationships[framedNation.id] || 0;
  const penalty = -20;
  updatedTargetNation.relationships[framedNation.id] = Math.max(-100, currentRel + penalty);

  messages.push(
    `${targetNation.name} blames ${framedNation.name} for the attack (relationship: ${penalty})`
  );

  // Add relationship history
  if (!updatedTargetNation.relationshipHistory) {
    updatedTargetNation.relationshipHistory = [];
  }

  updatedTargetNation.relationshipHistory = [
    ...updatedTargetNation.relationshipHistory,
    {
      turn,
      withNation: framedNation.id,
      delta: penalty,
      reason: 'Blamed for covert operation',
      newValue: updatedTargetNation.relationships[framedNation.id],
    },
  ].slice(-100);

  // Apply trust penalty
  if (updatedTargetNation.trustRecords && updatedTargetNation.trustRecords[framedNation.id]) {
    const existingRecord = updatedTargetNation.trustRecords[framedNation.id];
    const currentTrust = existingRecord.value;
    const trustPenalty = -15;

    updatedTargetNation.trustRecords[framedNation.id] = {
      value: clampTrust(currentTrust + trustPenalty),
      lastUpdated: turn,
      history: [...(existingRecord.history || [])],
    };

    messages.push(`Trust between ${targetNation.name} and ${framedNation.name} decreased`);
  }

  // Increase threat level
  if (!updatedTargetNation.threats) {
    updatedTargetNation.threats = {};
  }

  updatedTargetNation.threats[framedNation.id] =
    (updatedTargetNation.threats[framedNation.id] || 0) + 15;

  messages.push(`${targetNation.name} views ${framedNation.name} as a greater threat`);

  return {
    updatedTargetNation,
    updatedFramedNation,
    messages,
  };
}

// ============================================================================
// SOW DISSENT EFFECTS
// ============================================================================

/**
 * Apply sow dissent diplomatic effects
 */
export function applySowDissentDiplomacy(
  targetNation: Nation,
  affectedNations: string[],
  gameState: GameState,
  turn: number
): {
  updatedTargetNation: Nation;
  messages: string[];
} {
  const messages: string[] = [];
  let updatedTargetNation = { ...targetNation };

  if (!updatedTargetNation.trustRecords) {
    updatedTargetNation.trustRecords = {};
  }

  // Reduce trust with specified nations
  for (const nationId of affectedNations) {
    const nation = gameState.nations.find((n) => n.id === nationId);
    if (!nation) continue;

    const existingRecord = updatedTargetNation.trustRecords[nationId];
    const currentTrust = existingRecord?.value ?? DEFAULT_TRUST;
    const penalty = -10;
    const newTrust = clampTrust(currentTrust + penalty);

    updatedTargetNation.trustRecords[nationId] = {
      value: newTrust,
      lastUpdated: turn,
      history: [
        ...(existingRecord?.history || []),
        {
          turn,
          delta: penalty,
          reason: 'Propaganda campaign',
          newValue: newTrust,
        },
      ].slice(-20),
    };

    messages.push(`Trust between ${targetNation.name} and ${nation.name} decreased by ${Math.abs(penalty)}`);
  }

  return {
    updatedTargetNation,
    messages,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate total diplomatic damage from spy incidents
 */
export function calculateTotalDiplomaticDamage(nation: Nation): {
  totalGrievances: number;
  espionageGrievances: number;
  averageRelationship: number;
  averageTrust: number;
} {
  const grievances = nation.grievances || [];
  const espionageGrievances = grievances.filter(
    (g) => g.type === 'espionage-caught' && !g.resolved
  );

  const relationships = nation.relationships || {};
  const relationshipValues = Object.values(relationships);
  const averageRelationship =
    relationshipValues.length > 0
      ? relationshipValues.reduce((sum, val) => sum + val, 0) / relationshipValues.length
      : 0;

  const trustRecords = nation.trustRecords || {};
  const trustValues = Object.values(trustRecords).map((record) => record.value);
  const averageTrust =
    trustValues.length > 0
      ? trustValues.reduce((sum, val) => sum + val, 0) / trustValues.length
      : 50;

  return {
    totalGrievances: grievances.length,
    espionageGrievances: espionageGrievances.length,
    averageRelationship,
    averageTrust,
  };
}

/**
 * Check if spy incident should trigger war
 */
export function shouldSpyIncidentTriggerWar(
  targetNation: Nation,
  spyNation: Nation,
  incident: SpyIncident
): boolean {
  // Assassination or severe sabotage might trigger war
  if (incident.missionType === 'assassination') {
    return Math.random() < 0.4; // 40% chance
  }

  if (incident.missionType === 'sabotage-military') {
    const relationship = targetNation.relationships?.[spyNation.id] || 0;
    if (relationship < -50) {
      return Math.random() < 0.3; // 30% chance if relations already bad
    }
  }

  return false;
}

/**
 * Get diplomatic incident message for UI
 */
export function getSpyIncidentDiplomaticMessage(
  incident: SpyIncident,
  targetNation: Nation,
  spyNation: Nation
): string {
  const missionNames: Record<string, string> = {
    'steal-tech': 'technology theft',
    'sabotage-production': 'industrial sabotage',
    'sabotage-military': 'military sabotage',
    'rig-election': 'election interference',
    'sow-dissent': 'propaganda operations',
    'assassination': 'assassination attempt',
    'gather-intel': 'intelligence gathering',
    'propaganda': 'propaganda campaign',
  };

  const missionName = missionNames[incident.missionType] || incident.missionType;

  if (incident.publicized) {
    return `🚨 INTERNATIONAL INCIDENT: ${targetNation.name} publicly accused ${spyNation.name} of ${missionName}. Evidence: ${incident.evidenceQuality}.`;
  } else {
    return `🔒 CLASSIFIED: ${targetNation.name} privately confronted ${spyNation.name} about ${missionName}.`;
  }
}
