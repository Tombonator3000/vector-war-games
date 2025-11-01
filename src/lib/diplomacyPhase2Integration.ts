/**
 * Diplomacy Phase 2 Integration
 *
 * Integrates grievances, claims, and specialized alliances into actual gameplay.
 * This module hooks Phase 2 features into game events and AI actions.
 */

import type { Nation } from '@/types/game';
import type {
  GrievanceType,
  ClaimType,
  ClaimStrength,
  GrievanceSeverity,
} from '@/types/grievancesAndClaims';
import type { AllianceType } from '@/types/specializedAlliances';
import {
  createGrievance,
  createClaim,
  ageClaims,
  getActiveGrievances,
  resolveGrievance,
} from '@/lib/grievancesAndClaimsUtils';
import {
  createSpecializedAlliance,
  modifyCooperation,
  updateAllianceLevel,
  getMilitaryAllianceBonus,
  getProductionBonus,
  getResearchSpeedBonus
} from '@/lib/specializedAlliancesUtils';
import { ensureTreatyRecord } from '@/lib/nationUtils';
import { modifyTrust, modifyFavors } from '@/lib/trustAndFavorsUtils';
import { modifyRelationship } from '@/lib/relationshipUtils';

// ============================================================================
// GRIEVANCE TRIGGERS
// ============================================================================

/**
 * Create grievance when a nation breaks a treaty
 */
export function onTreatyBroken(
  victim: Nation,
  perpetrator: Nation,
  wasAlliance: boolean,
  currentTurn: number
): void {
  if (!victim.grievances) victim.grievances = [];

  const grievanceType: GrievanceType = wasAlliance ? 'betrayed-ally' : 'broken-treaty';
  const updated = createGrievance(victim, perpetrator.id, grievanceType, currentTurn);
  victim.grievances = updated.grievances || [];
}

/**
 * Create grievance when a nation is attacked without warning
 */
export function onSurpriseAttack(
  victim: Nation,
  attacker: Nation,
  currentTurn: number
): void {
  if (!victim.grievances) victim.grievances = [];

  // Check if there was a treaty in place
  const treaty = victim.treaties?.[attacker.id];
  const hadTreaty = !!(treaty?.truceTurns || treaty?.alliance);

  const updated = createGrievance(
    victim,
    attacker.id,
    hadTreaty ? 'surprise-attack' : 'surprise-attack',
    currentTurn
  );
  victim.grievances = updated.grievances || [];
}

/**
 * Create grievance when massive civilian casualties occur (nukes, bioweapons)
 */
export function onCivilianCasualties(
  victim: Nation,
  attacker: Nation,
  casualties: number,
  currentTurn: number
): void {
  if (!victim.grievances) victim.grievances = [];

  // Only create grievance for significant casualties (e.g., >10% of population)
  const casualtyRate = casualties / Math.max(victim.population || 1, 1);
  if (casualtyRate < 0.1) return;

  const updated = createGrievance(
    victim,
    attacker.id,
    'civilian-casualties',
    currentTurn,
    `Suffered ${Math.round(casualtyRate * 100)}% population loss from ${attacker.name}'s attack`
  );
  victim.grievances = updated.grievances || [];
}

/**
 * Create grievance when territory is seized
 */
export function onTerritorySiezed(
  victim: Nation,
  perpetrator: Nation,
  currentTurn: number
): void {
  if (!victim.grievances) victim.grievances = [];

  const updated = createGrievance(
    victim,
    perpetrator.id,
    'territorial-seizure',
    currentTurn
  );
  victim.grievances = updated.grievances || [];
}

/**
 * Create grievance when espionage is detected
 */
export function onEspionageDetected(
  victim: Nation,
  spy: Nation,
  currentTurn: number
): void {
  if (!victim.grievances) victim.grievances = [];

  const updated = createGrievance(
    victim,
    spy.id,
    'espionage-caught',
    currentTurn
  );
  victim.grievances = updated.grievances || [];
}

/**
 * Create grievance when sanctions harm a nation
 */
export function onSanctionHarm(
  victim: Nation,
  sanctioner: Nation,
  currentTurn: number
): void {
  if (!victim.grievances) victim.grievances = [];

  const updated = createGrievance(
    victim,
    sanctioner.id,
    'sanction-harm',
    currentTurn,
    undefined,
    'minor' // Sanctions are typically minor grievances
  );
  victim.grievances = updated.grievances || [];
}

// ============================================================================
// DIPLOMATIC GESTURES & GRIEVANCE RESOLUTION
// ============================================================================

/**
 * Resolve outstanding grievances through a formal apology.
 * Applies trust/relationship recovery for both parties.
 */
export function resolveGrievancesWithApology(
  apologizer: Nation,
  victim: Nation,
  currentTurn: number
): { apologizer: Nation; victim: Nation; resolvedGrievanceCount: number } {
  const activeGrievances = getActiveGrievancesSafe(victim, apologizer.id);

  let updatedVictim = victim;
  let resolvedCount = 0;

  for (const grievance of activeGrievances) {
    updatedVictim = resolveGrievance(updatedVictim, grievance.id, currentTurn);
    resolvedCount += 1;
  }

  let updatedApologizer = apologizer;

  if (resolvedCount > 0) {
    updatedApologizer = modifyTrust(
      updatedApologizer,
      victim.id,
      4,
      'Issued formal apology',
      currentTurn
    );
    updatedApologizer = modifyRelationship(
      updatedApologizer,
      victim.id,
      6,
      'Issued formal apology',
      currentTurn
    );
    updatedVictim = modifyRelationship(
      updatedVictim,
      apologizer.id,
      6,
      'Accepted formal apology',
      currentTurn
    );
  } else {
    // Even without active grievances, an apology builds a bit of goodwill.
    updatedApologizer = modifyRelationship(
      updatedApologizer,
      victim.id,
      2,
      'Extended goodwill apology',
      currentTurn
    );
    updatedVictim = modifyRelationship(
      updatedVictim,
      apologizer.id,
      2,
      'Received goodwill apology',
      currentTurn
    );
  }

  return {
    apologizer: updatedApologizer,
    victim: updatedVictim,
    resolvedGrievanceCount: resolvedCount,
  };
}

/**
 * Resolve grievances via reparations. Increases favors owed by the recipient
 * and produces stronger relationship recovery proportional to severity.
 */
export function resolveGrievancesWithReparations(
  payer: Nation,
  recipient: Nation,
  currentTurn: number,
  severity: GrievanceSeverity = 'moderate'
): {
  payer: Nation;
  recipient: Nation;
  resolvedGrievanceCount: number;
} {
  const activeGrievances = getActiveGrievancesSafe(recipient, payer.id);

  let updatedRecipient = recipient;
  let resolvedCount = 0;

  for (const grievance of activeGrievances) {
    updatedRecipient = resolveGrievance(updatedRecipient, grievance.id, currentTurn);
    resolvedCount += 1;
  }

  const severityTrustBonus = severity === 'severe' ? 10 : severity === 'major' ? 8 : severity === 'minor' ? 4 : 6;
  const severityRelationshipBonus = severity === 'severe' ? 14 : severity === 'major' ? 10 : severity === 'minor' ? 5 : 8;

  let updatedPayer = modifyTrust(
    payer,
    recipient.id,
    severityTrustBonus,
    'Provided reparations',
    currentTurn
  );

  updatedPayer = modifyRelationship(
    updatedPayer,
    recipient.id,
    Math.round(severityRelationshipBonus / 2),
    'Provided reparations',
    currentTurn
  );

  updatedRecipient = modifyRelationship(
    updatedRecipient,
    payer.id,
    severityRelationshipBonus,
    'Accepted reparations',
    currentTurn
  );

  // Reparations create a modest favor the recipient owes back over time.
  updatedPayer = modifyFavors(
    updatedPayer,
    recipient.id,
    3,
    'Extended reparations package',
    currentTurn
  );
  updatedRecipient = modifyFavors(
    updatedRecipient,
    payer.id,
    -3,
    'Accepted reparations package',
    currentTurn
  );

  return {
    payer: updatedPayer,
    recipient: updatedRecipient,
    resolvedGrievanceCount: resolvedCount,
  };
}

function getActiveGrievancesSafe(nation: Nation, againstNationId: string) {
  return getActiveGrievances(nation, againstNationId);
}

// ============================================================================
// CLAIMS TRIGGERS
// ============================================================================

/**
 * Create a territorial claim
 */
export function createTerritorialClaim(
  claimant: Nation,
  targetNationId: string,
  claimType: ClaimType,
  strength: ClaimStrength,
  currentTurn: number,
  reason?: string
): void {
  if (!claimant.claims) claimant.claims = [];

  const updated = createClaim(
    claimant,
    targetNationId,
    claimType,
    strength,
    currentTurn,
    reason
  );
  claimant.claims = updated.claims || [];
}

/**
 * Automatically create claims when certain events occur
 */
export function onTerritoryLost(
  loser: Nation,
  conqueror: Nation,
  currentTurn: number
): void {
  if (!loser.claims) loser.claims = [];

  // Create a "liberation" claim to retake lost territory
  const updated = createClaim(
    loser,
    conqueror.id,
    'liberation',
    'moderate',
    currentTurn,
    `Reclaim territory seized by ${conqueror.name}`
  );
  loser.claims = updated.claims || [];
}

/**
 * Update claims each turn (age them)
 */
export function updateAllClaims(nation: Nation, currentTurn: number): void {
  if (!nation.claims) return;

  const updated = ageClaims(nation, currentTurn);
  nation.claims = updated.claims || [];
}

// ============================================================================
// SPECIALIZED ALLIANCES
// ============================================================================

/**
 * Create a specialized alliance between two nations
 */
export function formSpecializedAlliance(
  nation1: Nation,
  nation2: Nation,
  allianceType: AllianceType,
  currentTurn: number
): void {
  // Initialize arrays if needed
  if (!nation1.specializedAlliances) nation1.specializedAlliances = [];
  if (!nation2.specializedAlliances) nation2.specializedAlliances = [];

  // Create alliance (returns both nations with updated alliances)
  const { nation1: updated1, nation2: updated2 } = createSpecializedAlliance(
    nation1,
    nation2,
    allianceType,
    currentTurn
  );

  nation1.specializedAlliances = updated1.specializedAlliances || [];
  nation2.specializedAlliances = updated2.specializedAlliances || [];

  // Also set traditional treaty fields for backward compatibility
  const treaty1 = ensureTreatyRecord(nation1, nation2);
  const treaty2 = ensureTreatyRecord(nation2, nation1);
  treaty1.alliance = true;
  treaty2.alliance = true;
  treaty1.truceTurns = 999;
  treaty2.truceTurns = 999;
}

/**
 * Update alliance cooperation based on actions
 */
export function increaseAllianceCooperation(
  nation: Nation,
  allyId: string,
  amount: number
): void {
  if (!nation.specializedAlliances) return;

  const updated = modifyCooperation(nation, allyId, amount);
  nation.specializedAlliances = updated.specializedAlliances || [];
}

/**
 * Decrease alliance cooperation (e.g., for violations)
 */
export function decreaseAllianceCooperation(
  nation: Nation,
  allyId: string,
  amount: number
): void {
  if (!nation.specializedAlliances) return;

  const updated = modifyCooperation(nation, allyId, -amount);
  nation.specializedAlliances = updated.specializedAlliances || [];
}

/**
 * Check and level up alliances each turn
 */
export function updateAllianceLevels(nation: Nation, currentTurn: number): void {
  if (!nation.specializedAlliances) return;

  let updated = { ...nation };
  for (const alliance of nation.specializedAlliances) {
    // Level up if cooperation is high and enough time has passed
    if (alliance.cooperation >= 80 && currentTurn - alliance.createdTurn >= alliance.level * 5) {
      // Determine partner ID based on which nation this is
      const partnerId = alliance.nation1Id === nation.id ? alliance.nation2Id : alliance.nation1Id;
      updated = updateAllianceLevel(updated, partnerId, currentTurn);
    }
  }
  nation.specializedAlliances = updated.specializedAlliances || [];
}

/**
 * Get bonuses from all active alliances
 */
export function getAllAllianceBonuses(nation: Nation): {
  combatBonus: number;
  defenseBonus: number;
  productionBonus: number;
  researchBonus: number;
} {
  if (!nation.specializedAlliances) {
    return { combatBonus: 0, defenseBonus: 0, productionBonus: 0, researchBonus: 0 };
  }

  const combatBonus = getMilitaryAllianceBonus(nation, 'attack');
  const defenseBonus = getMilitaryAllianceBonus(nation, 'defense');
  const productionBonus = getProductionBonus(nation);
  const researchBonus = getResearchSpeedBonus(nation);

  return { combatBonus, defenseBonus, productionBonus, researchBonus };
}

/**
 * Break an alliance and create appropriate grievances
 */
export function breakSpecializedAlliance(
  nation: Nation,
  allyId: string,
  ally: Nation,
  currentTurn: number
): void {
  if (!nation.specializedAlliances) return;

  // Remove alliance - filter out alliances involving the ally
  nation.specializedAlliances = nation.specializedAlliances.filter(
    a => !(a.nation1Id === allyId || a.nation2Id === allyId)
  );

  if (ally.specializedAlliances) {
    ally.specializedAlliances = ally.specializedAlliances.filter(
      a => !(a.nation1Id === nation.id || a.nation2Id === nation.id)
    );
  }

  // Create grievance for betrayal
  onTreatyBroken(ally, nation, true, currentTurn);
}

// ============================================================================
// TURN UPDATES
// ============================================================================

/**
 * Update all Phase 2 features each turn
 */
export function updatePhase2PerTurn(nation: Nation, currentTurn: number): void {
  // Update claims (they age over time)
  updateAllClaims(nation, currentTurn);

  // Update alliance levels
  updateAllianceLevels(nation, currentTurn);

  // Grievances are handled by grievancesAndClaimsUtils.updateGrievances
}
