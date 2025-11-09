/**
 * Casus Belli Utilities
 *
 * Functions for creating, validating, and managing Casus Belli (reasons for war).
 * Integrates with grievances, claims, threat levels, and diplomatic systems.
 */

import { v4 as uuidv4 } from 'uuid';
import type { Nation } from '../types/game';
import type {
  CasusBelli,
  CasusBelliType,
  CasusBelliValidity,
  WarValidation,
  JustificationFactors,
} from '../types/casusBelli';
import {
  WAR_JUSTIFICATION_THRESHOLDS,
  UNJUSTIFIED_WAR_PENALTIES,
} from '../types/casusBelli';
import type { Grievance, Claim } from '../types/grievancesAndClaims';
import type { CouncilResolution } from '../types/diplomacyPhase3';
import {
  getTotalGrievanceWeight,
  getClaimWarJustification,
  getClaimPublicSupport,
} from './grievancesAndClaimsUtils';

/**
 * Calculate justification factors for war between two nations
 */
export function calculateJustificationFactors(
  attacker: Nation,
  defender: Nation,
  grievances: Grievance[],
  claims: Claim[],
  councilResolution?: CouncilResolution
): JustificationFactors {
  // Filter grievances and claims relevant to this war
  const relevantGrievances = grievances.filter(
    (g) => g.againstNationId === defender.id && !g.resolved
  );
  const relevantClaims = claims.filter(
    (c) => c.onNationId === defender.id && !c.renounced
  );

  // Calculate each factor
  const claimJustification = getClaimWarJustification(attacker, defender.id);

  // Grievances: major/severe grievances provide justification
  const grievanceJustification = Math.min(
    50,
    getTotalGrievanceWeight(attacker, defender.id) * 5 // Weight * 5 = justification
  );

  // Threat level: high threat = preemptive strike justification
  const threatLevel = Math.min(
    30,
    ((defender.threats?.[attacker.id] || 0) / 100) * 30
  );

  // Ideological conflict: opposing ideologies provide justification
  let ideologicalConflict = 0;
  if (attacker.ideologyState && defender.ideologyState) {
    // Use ideology support as proxy for alignment difference
    const attackerDem = attacker.ideologyState.ideologicalSupport?.democracy || 0;
    const defenderDem = defender.ideologyState.ideologicalSupport?.democracy || 0;
    const ideologyDiff = Math.abs(attackerDem - defenderDem);
    ideologicalConflict = Math.min(20, ideologyDiff / 5);
  }

  // Council authorization: strong justification if sanctioned
  const councilAuthorization =
    councilResolution && councilResolution.status === 'passed' ? 40 : 0;

  // Leader ability: handled separately when CB is created
  const leaderAbility = 0;

  // Ally defense: checked separately when defensive pact triggers
  const allyDefense = 0;

  // Public opinion: based on claims
  const avgPublicSupport = getClaimPublicSupport(attacker, defender.id);
  const publicOpinion = (avgPublicSupport - 50) / 2.5; // -20 to +20

  const totalJustification =
    claimJustification +
    grievanceJustification +
    threatLevel +
    ideologicalConflict +
    councilAuthorization +
    leaderAbility +
    allyDefense +
    publicOpinion;

  return {
    claimJustification,
    grievanceJustification,
    threatLevel,
    ideologicalConflict,
    councilAuthorization,
    leaderAbility,
    allyDefense,
    publicOpinion,
    totalJustification: Math.max(0, Math.min(100, totalJustification)),
  };
}

/**
 * Create a Casus Belli
 */
export function createCasusBelli(
  type: CasusBelliType,
  attackerNationId: string,
  defenderNationId: string,
  justification: number,
  description: string,
  currentTurn: number,
  options?: {
    claimIds?: string[];
    grievanceIds?: string[];
    councilResolutionId?: string;
    leaderAbilityId?: string;
    expiresIn?: number;
    publicSupport?: number;
  }
): CasusBelli {
  const id = uuidv4();

  return {
    id,
    type,
    againstNationId: defenderNationId,
    justification: Math.max(0, Math.min(100, justification)),
    description,
    createdTurn: currentTurn,
    expiresAt: options?.expiresIn
      ? currentTurn + options.expiresIn
      : undefined,
    claimIds: options?.claimIds,
    grievanceIds: options?.grievanceIds,
    councilResolutionId: options?.councilResolutionId,
    leaderAbilityId: options?.leaderAbilityId,
    used: false,
    publicSupport: options?.publicSupport || 50,
  };
}

/**
 * Create Casus Belli from territorial claims
 */
export function createCasusBelliFromClaims(
  attacker: Nation,
  defender: Nation,
  claims: Claim[],
  currentTurn: number
): CasusBelli {
  const relevantClaims = claims.filter(
    (c) => c.onNationId === defender.id && !c.renounced
  );

  const totalJustification = getClaimWarJustification(attacker, defender.id);
  const avgPublicSupport = getClaimPublicSupport(attacker, defender.id);

  const claimTypes = relevantClaims.map((c) => c.type).join(', ');

  return createCasusBelli(
    'territorial-claim',
    attacker.id,
    defender.id,
    totalJustification,
    `Territorial claims based on ${claimTypes} grounds`,
    currentTurn,
    {
      claimIds: relevantClaims.map((c) => c.id),
      publicSupport: avgPublicSupport,
    }
  );
}

/**
 * Create Casus Belli from grievances
 */
export function createCasusBelliFromGrievances(
  attacker: Nation,
  defender: Nation,
  grievances: Grievance[],
  currentTurn: number
): CasusBelli {
  const relevantGrievances = grievances.filter(
    (g) => g.againstNationId === defender.id && !g.resolved
  );

  const totalWeight = getTotalGrievanceWeight(attacker, defender.id);
  const justification = Math.min(50, totalWeight * 5);

  const grievanceTypes = [
    ...new Set(relevantGrievances.map((g) => g.type)),
  ].join(', ');

  // Public support varies by grievance severity
  const avgSeverity =
    relevantGrievances.reduce((sum, g) => {
      const severityMap = { minor: 1, moderate: 2, major: 3, severe: 4 };
      return sum + severityMap[g.severity];
    }, 0) / relevantGrievances.length;
  const publicSupport = 40 + avgSeverity * 10; // 50-80%

  return createCasusBelli(
    'grievance-retribution',
    attacker.id,
    defender.id,
    justification,
    `Retaliation for grievances: ${grievanceTypes}`,
    currentTurn,
    {
      grievanceIds: relevantGrievances.map((g) => g.id),
      publicSupport,
    }
  );
}

/**
 * Create Casus Belli for preemptive strike
 */
export function createPreemptiveStrikeCB(
  attacker: Nation,
  defender: Nation,
  currentTurn: number
): CasusBelli {
  const threatLevel = defender.threats?.[attacker.id] || 0;
  const justification = Math.min(30, (threatLevel / 100) * 40);

  const publicSupport = Math.min(70, 30 + threatLevel / 2);

  return createCasusBelli(
    'preemptive-strike',
    attacker.id,
    defender.id,
    justification,
    `Preemptive strike against growing threat (threat level: ${threatLevel.toFixed(0)})`,
    currentTurn,
    {
      publicSupport,
      expiresIn: 10, // Expires in 10 turns
    }
  );
}

/**
 * Create Casus Belli for defending an ally
 */
export function createDefensivePactCB(
  defender: Nation,
  aggressor: Nation,
  allyId: string,
  currentTurn: number
): CasusBelli {
  return createCasusBelli(
    'defensive-pact',
    defender.id,
    aggressor.id,
    40, // Strong justification
    `Defensive pact activation: defending ally ${allyId}`,
    currentTurn,
    {
      publicSupport: 75,
      expiresIn: 20, // Valid for duration of defensive war
    }
  );
}

/**
 * Create Casus Belli for liberation war
 */
export function createLiberationWarCB(
  liberator: Nation,
  occupier: Nation,
  targetTerritoryIds: string[],
  currentTurn: number
): CasusBelli {
  const justification = 35; // Good justification for liberation

  return createCasusBelli(
    'liberation-war',
    liberator.id,
    occupier.id,
    justification,
    `Liberation of occupied territories`,
    currentTurn,
    {
      publicSupport: 70,
    }
  );
}

/**
 * Create Casus Belli for holy/ideological war
 */
export function createHolyWarCB(
  attacker: Nation,
  defender: Nation,
  currentTurn: number
): CasusBelli {
  let ideologyDiff = 0;
  if (attacker.ideologyState && defender.ideologyState) {
    const attackerDem = attacker.ideologyState.ideologicalSupport?.democracy || 0;
    const defenderDem = defender.ideologyState.ideologicalSupport?.democracy || 0;
    ideologyDiff = Math.abs(attackerDem - defenderDem);
  }

  const justification = Math.min(30, ideologyDiff / 3);
  const publicSupport = attacker.ideologyState?.ideologyStability
    ? 50 + attacker.ideologyState.ideologyStability / 2
    : 50;

  return createCasusBelli(
    'holy-war',
    attacker.id,
    defender.id,
    justification,
    `Ideological conflict: ${attacker.ideologyState?.currentIdeology || 'unknown'} vs ${defender.ideologyState?.currentIdeology || 'unknown'}`,
    currentTurn,
    {
      publicSupport,
    }
  );
}

/**
 * Create Casus Belli from council resolution
 */
export function createCouncilAuthorizedCB(
  attacker: Nation,
  target: Nation,
  resolution: CouncilResolution,
  currentTurn: number
): CasusBelli {
  return createCasusBelli(
    'council-authorized',
    attacker.id,
    target.id,
    80, // Very strong justification
    `Council-authorized action: ${resolution.title}`,
    currentTurn,
    {
      councilResolutionId: resolution.id,
      publicSupport: 65,
    }
  );
}

/**
 * Validate if a nation can declare war
 */
export function validateWarDeclaration(
  attacker: Nation,
  defender: Nation,
  grievances: Grievance[],
  claims: Claim[],
  availableCasusBelli: CasusBelli[],
  councilResolution?: CouncilResolution,
  currentTurn?: number
): WarValidation {
  const reasons: string[] = [];
  const blockers: string[] = [];

  // Check for existing truces
  const treaty = attacker.treaties?.[defender.id];
  if (treaty?.truceTurns && treaty.truceTurns > 0) {
    blockers.push(
      `Active truce with ${defender.name} (${treaty.truceTurns} turns remaining)`
    );
  }

  // Check for existing alliances
  if (attacker.alliances?.includes(defender.id)) {
    blockers.push(`Cannot declare war on ally ${defender.name}`);
  }

  // Calculate justification
  const factors = calculateJustificationFactors(
    attacker,
    defender,
    grievances,
    claims,
    councilResolution
  );

  // Check existing Casus Belli
  const validCBs = availableCasusBelli.filter(
    (cb) => cb.againstNationId === defender.id && !cb.used
  );

  // Filter out expired CBs
  const activeValidCBs = validCBs.filter(
    (cb) => !cb.expiresAt || cb.expiresAt > (currentTurn || 0)
  );

  // Best CB determines validity
  const bestCB = activeValidCBs.reduce(
    (best, cb) => (cb.justification > best.justification ? cb : best),
    { justification: 0 } as CasusBelli
  );

  const justificationScore = Math.max(
    factors.totalJustification,
    bestCB.justification
  );

  // Determine validity
  let validity: CasusBelliValidity = 'invalid';
  let diplomaticPenalty = -40;
  let trustPenalty = -30;

  if (justificationScore >= WAR_JUSTIFICATION_THRESHOLDS.VALID) {
    validity = 'valid';
    diplomaticPenalty = 0;
    trustPenalty = 0;
    reasons.push(
      `Valid Casus Belli (justification: ${justificationScore.toFixed(0)})`
    );
  } else if (justificationScore >= WAR_JUSTIFICATION_THRESHOLDS.WEAK) {
    validity = 'weak';
    diplomaticPenalty = -15;
    trustPenalty = -10;
    reasons.push(
      `Weak Casus Belli (justification: ${justificationScore.toFixed(0)})`
    );
    reasons.push('Will incur moderate diplomatic penalties');
  } else {
    reasons.push(
      `Insufficient justification (${justificationScore.toFixed(0)} < ${WAR_JUSTIFICATION_THRESHOLDS.WEAK})`
    );
    reasons.push('Will incur severe diplomatic penalties');
  }

  // Add justification breakdown
  if (factors.claimJustification > 0) {
    reasons.push(`Territorial claims: +${factors.claimJustification.toFixed(0)}`);
  }
  if (factors.grievanceJustification > 0) {
    reasons.push(`Grievances: +${factors.grievanceJustification.toFixed(0)}`);
  }
  if (factors.threatLevel > 0) {
    reasons.push(`Threat level: +${factors.threatLevel.toFixed(0)}`);
  }
  if (factors.ideologicalConflict > 0) {
    reasons.push(`Ideological conflict: +${factors.ideologicalConflict.toFixed(0)}`);
  }
  if (factors.councilAuthorization > 0) {
    reasons.push(`Council authorization: +${factors.councilAuthorization.toFixed(0)}`);
  }

  const publicSupportModifier = factors.publicOpinion;

  return {
    canDeclareWar: blockers.length === 0,
    validity,
    justificationScore,
    diplomaticPenalty,
    trustPenalty,
    publicSupportModifier,
    reasons,
    availableCasusBelli: activeValidCBs,
    blockers: blockers.length > 0 ? blockers : undefined,
  };
}

/**
 * Expire old Casus Belli
 */
export function expireCasusBelli(
  casusBelliList: CasusBelli[],
  currentTurn: number
): CasusBelli[] {
  return casusBelliList.filter((cb) => {
    if (cb.used) return false; // Remove used CBs
    if (cb.expiresAt && cb.expiresAt <= currentTurn) return false; // Remove expired
    return true;
  });
}

/**
 * Mark Casus Belli as used
 */
export function useCasusBelli(casusBelli: CasusBelli): CasusBelli {
  return {
    ...casusBelli,
    used: true,
  };
}

/**
 * Get all available Casus Belli for a nation against another
 */
export function getAvailableCasusBelli(
  attacker: Nation,
  defender: Nation,
  allCasusBelli: CasusBelli[],
  currentTurn: number
): CasusBelli[] {
  return allCasusBelli.filter((cb) => {
    // Must be against the defender
    if (cb.againstNationId !== defender.id) return false;

    // Must not be used
    if (cb.used) return false;

    // Must not be expired
    if (cb.expiresAt && cb.expiresAt <= currentTurn) return false;

    return true;
  });
}

/**
 * Get best available Casus Belli
 */
export function getBestCasusBelli(
  attacker: Nation,
  defender: Nation,
  allCasusBelli: CasusBelli[],
  currentTurn: number
): CasusBelli | null {
  const available = getAvailableCasusBelli(
    attacker,
    defender,
    allCasusBelli,
    currentTurn
  );

  if (available.length === 0) return null;

  return available.reduce((best, cb) =>
    cb.justification > best.justification ? cb : best
  );
}

/**
 * Generate automatic Casus Belli based on game state
 */
export function generateAutomaticCasusBelli(
  attacker: Nation,
  defender: Nation,
  grievances: Grievance[],
  claims: Claim[],
  currentTurn: number
): CasusBelli[] {
  const newCBs: CasusBelli[] = [];

  // From claims
  const relevantClaims = claims.filter(
    (c) => c.onNationId === defender.id && !c.renounced
  );
  if (relevantClaims.length > 0) {
    newCBs.push(
      createCasusBelliFromClaims(attacker, defender, claims, currentTurn)
    );
  }

  // From grievances
  const relevantGrievances = grievances.filter(
    (g) => g.againstNationId === defender.id && !g.resolved
  );
  const severeGrievances = relevantGrievances.filter(
    (g) => g.severity === 'major' || g.severity === 'severe'
  );
  if (severeGrievances.length > 0) {
    newCBs.push(
      createCasusBelliFromGrievances(
        attacker,
        defender,
        grievances,
        currentTurn
      )
    );
  }

  // From threat level
  const threatLevel = defender.threats?.[attacker.id] || 0;
  if (threatLevel >= 60) {
    newCBs.push(createPreemptiveStrikeCB(attacker, defender, currentTurn));
  }

  // From ideology
  if (attacker.ideologyState && defender.ideologyState) {
    const attackerDem = attacker.ideologyState.ideologicalSupport?.democracy || 0;
    const defenderDem = defender.ideologyState.ideologicalSupport?.democracy || 0;
    const ideologyDiff = Math.abs(attackerDem - defenderDem);
    if (ideologyDiff >= 40 && attacker.ideologyState.ideologyStability > 60) {
      newCBs.push(createHolyWarCB(attacker, defender, currentTurn));
    }
  }

  return newCBs;
}
