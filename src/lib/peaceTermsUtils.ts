/**
 * Peace Terms Utilities
 *
 * Functions for negotiating peace, creating peace offers, and resolving wars.
 * Integrates war scores, war goals, and diplomatic considerations.
 */

import { v4 as uuidv4 } from 'uuid';
import type { Nation } from '../types/game';
import type {
  PeaceOffer,
  PeaceTerms,
  WarState,
  WarGoal,
  TerritoryChange,
  ResourceReparations,
  MilitaryLimitations,
} from '../types/casusBelli';
import type { Grievance, Claim } from '../types/grievancesAndClaims';
import { canEnforceWarGoals } from './warDeclarationUtils';
import { resolveGrievance, renounceClaim } from './grievancesAndClaimsUtils';

/**
 * Create a peace offer
 */
export function createPeaceOffer(
  fromNation: Nation,
  toNation: Nation,
  warState: WarState,
  terms: PeaceTerms,
  currentTurn: number,
  message?: string
): PeaceOffer {
  const id = uuidv4();

  return {
    id,
    fromNationId: fromNation.id,
    toNationId: toNation.id,
    warId: warState.id,
    terms,
    createdTurn: currentTurn,
    expiresAt: currentTurn + 5, // Offer expires in 5 turns
    message,
  };
}

/**
 * Create white peace terms (status quo ante bellum)
 */
export function createWhitePeaceTerms(): PeaceTerms {
  return {
    type: 'white-peace',
    treatyDuration: 10, // 10-turn truce
  };
}

/**
 * Create peace terms based on war score and war goals
 */
export function createPeaceTermsFromWarGoals(
  warState: WarState,
  enforceAll: boolean = false
): PeaceTerms {
  const { achievableGoals, unachievableGoals } = canEnforceWarGoals(warState);

  // If no goals can be enforced, white peace
  if (achievableGoals.length === 0 && !enforceAll) {
    return createWhitePeaceTerms();
  }

  const goalsToEnforce = enforceAll ? warState.warGoals : achievableGoals;

  const territoryChanges: TerritoryChange[] = [];
  let reparations: ResourceReparations | undefined;
  let militaryLimitations: MilitaryLimitations | undefined;
  let ideologyChange: string | undefined;
  const additionalTerms: string[] = [];

  for (const goal of goalsToEnforce) {
    switch (goal.type) {
      case 'annex-territory':
        if (goal.parameters.territoryIds) {
          for (const territoryId of goal.parameters.territoryIds) {
            territoryChanges.push({
              territoryId,
              fromNationId: goal.targetNationId,
              toNationId: warState.attackerNationId,
            });
          }
        }
        break;

      case 'liberate-territory':
        if (goal.parameters.territoryIds) {
          for (const territoryId of goal.parameters.territoryIds) {
            territoryChanges.push({
              territoryId,
              fromNationId: goal.targetNationId,
              toNationId: warState.attackerNationId, // Or original owner
            });
          }
        }
        break;

      case 'reparations':
        if (goal.parameters.resourceAmount) {
          reparations = {
            ...goal.parameters.resourceAmount,
            duration: goal.parameters.duration || 10,
            perTurn: true,
          };
        }
        break;

      case 'disarmament':
        militaryLimitations = {
          maxMilitarySize: goal.parameters.militaryReduction || 50,
          duration: goal.parameters.duration || 20,
        };
        break;

      case 'enforce-ideology':
        ideologyChange = goal.parameters.ideologyType;
        break;

      case 'demilitarize-zone':
        if (goal.parameters.demilitarizedTerritories) {
          militaryLimitations = {
            ...militaryLimitations,
            demilitarizedZones: goal.parameters.demilitarizedTerritories,
            duration: goal.parameters.duration || 30,
          };
        }
        break;

      case 'regime-change':
        additionalTerms.push('Regime change enforced');
        break;

      case 'humiliate':
        additionalTerms.push('Public humiliation and prestige loss');
        break;

      case 'vassal':
        additionalTerms.push('Vassal status imposed');
        break;

      case 'annex-all':
        additionalTerms.push('Total annexation');
        break;
    }
  }

  // Determine peace type
  let peaceType: PeaceTerms['type'] = 'conditional-peace';
  if (warState.attackerWarScore >= 90 || enforceAll) {
    peaceType = 'unconditional-surrender';
  }

  return {
    type: peaceType,
    territoryChanges: territoryChanges.length > 0 ? territoryChanges : undefined,
    reparations,
    militaryLimitations,
    ideologyChange,
    additionalTerms: additionalTerms.length > 0 ? additionalTerms : undefined,
    treatyDuration: 15, // 15-turn forced peace
  };
}

/**
 * Evaluate peace offer acceptance
 */
export function evaluatePeaceOffer(
  evaluatingNation: Nation,
  offeringNation: Nation,
  warState: WarState,
  peaceOffer: PeaceOffer,
  currentTurn: number
): {
  shouldAccept: boolean;
  acceptanceScore: number;
  reasons: string[];
} {
  const reasons: string[] = [];
  let acceptanceScore = 0;

  const isAttacker = warState.attackerNationId === evaluatingNation.id;
  const myWarScore = isAttacker
    ? warState.attackerWarScore
    : warState.defenderWarScore;
  const enemyWarScore = isAttacker
    ? warState.defenderWarScore
    : warState.attackerWarScore;

  // Factor 1: War score differential
  const scoreDiff = myWarScore - enemyWarScore;
  if (scoreDiff < -30) {
    acceptanceScore += 40;
    reasons.push('Losing the war badly');
  } else if (scoreDiff < -10) {
    acceptanceScore += 20;
    reasons.push('Behind in war score');
  } else if (scoreDiff > 30) {
    acceptanceScore -= 30;
    reasons.push('Winning decisively');
  }

  // Factor 2: War duration
  const warDuration = currentTurn - warState.startTurn;
  if (warDuration > 20) {
    acceptanceScore += 15;
    reasons.push('War has dragged on too long');
  }

  // Factor 3: Peace terms evaluation
  if (peaceOffer.terms.type === 'white-peace') {
    acceptanceScore += 20;
    reasons.push('White peace is acceptable');
  } else if (peaceOffer.terms.type === 'unconditional-surrender') {
    if (myWarScore < 20) {
      acceptanceScore += 30;
      reasons.push('Unconditional surrender inevitable');
    } else {
      acceptanceScore -= 40;
      reasons.push('Unconditional surrender too harsh');
    }
  }

  // Factor 4: Territorial losses
  if (peaceOffer.terms.territoryChanges) {
    const losingTerritory = peaceOffer.terms.territoryChanges.some(
      (tc) => tc.fromNationId === evaluatingNation.id
    );
    if (losingTerritory) {
      acceptanceScore -= 25;
      reasons.push('Would lose territory');
    }
  }

  // Factor 5: Reparations
  if (
    peaceOffer.terms.reparations &&
    evaluatingNation.id === warState.defenderNationId
  ) {
    const totalRep =
      (peaceOffer.terms.reparations.production || 0) +
      (peaceOffer.terms.reparations.intel || 0) +
      (peaceOffer.terms.reparations.research || 0);
    if (totalRep > 100) {
      acceptanceScore -= 20;
      reasons.push('Reparations are excessive');
    } else {
      acceptanceScore -= 10;
      reasons.push('Reparations are manageable');
    }
  }

  // Factor 6: Military limitations
  if (peaceOffer.terms.militaryLimitations) {
    acceptanceScore -= 15;
    reasons.push('Military limitations imposed');
  }

  // Factor 7: Relationship
  const relationship = evaluatingNation.relationships?.[offeringNation.id] || 0;
  if (relationship > 50) {
    acceptanceScore += 15;
    reasons.push('Good relationship with peace offerer');
  } else if (relationship < -50) {
    acceptanceScore -= 10;
    reasons.push('Hostile relationship makes peace difficult');
  }

  // Factor 8: Economic state
  if (evaluatingNation.resources.production < 50) {
    acceptanceScore += 20;
    reasons.push('Economy is strained');
  }

  // Factor 9: AI personality (simplified)
  // Aggressive nations are less likely to accept peace
  // This would integrate with AI personality system if available

  const shouldAccept = acceptanceScore >= 30;

  return {
    shouldAccept,
    acceptanceScore,
    reasons,
  };
}

/**
 * Apply peace terms to nations
 */
export function applyPeaceTerms(
  attacker: Nation,
  defender: Nation,
  warState: WarState,
  peaceTerms: PeaceTerms,
  grievances: Grievance[],
  claims: Claim[]
): {
  updatedAttacker: Partial<Nation>;
  updatedDefender: Partial<Nation>;
  resolvedGrievances: Grievance[];
  renouncedClaims: Claim[];
  newTreaties: Record<string, any>;
} {
  const updatedAttacker: Partial<Nation> = {
    id: attacker.id,
    relationships: { ...attacker.relationships },
    treaties: { ...attacker.treaties },
  };

  const updatedDefender: Partial<Nation> = {
    id: defender.id,
    relationships: { ...defender.relationships },
    treaties: { ...defender.treaties },
  };

  // Apply territory changes
  if (peaceTerms.territoryChanges) {
    // Territory changes would be handled by the main game state manager
    // Here we just track the intent
  }

  // Apply reparations
  if (peaceTerms.reparations) {
    // Reparations would be tracked in a separate system
    // This would create a debt obligation
  }

  // Apply military limitations
  if (peaceTerms.militaryLimitations) {
    // Military limitations would be enforced by game rules
  }

  // Resolve grievances mentioned in peace terms
  const resolvedGrievances: Grievance[] = [];
  if (peaceTerms.grievancesResolved) {
    for (const grievanceId of peaceTerms.grievancesResolved) {
      const grievance = grievances.find((g) => g.id === grievanceId);
      if (grievance) {
        resolvedGrievances.push(resolveGrievance(grievance));
      }
    }
  }

  // Renounce claims mentioned in peace terms
  const renouncedClaims: Claim[] = [];
  if (peaceTerms.claimsRenounced) {
    for (const claimId of peaceTerms.claimsRenounced) {
      const claim = claims.find((c) => c.id === claimId);
      if (claim) {
        renouncedClaims.push(renounceClaim(claim));
      }
    }
  }

  // Create peace treaty
  const peaceTreaty = {
    truceTurns: peaceTerms.treatyDuration || 10,
    alliance: false,
    peaceTerms: peaceTerms,
  };

  updatedAttacker.treaties![defender.id] = peaceTreaty;
  updatedDefender.treaties![attacker.id] = peaceTreaty;

  // Improve relationships slightly (war is over)
  updatedAttacker.relationships![defender.id] =
    (attacker.relationships?.[defender.id] || -50) + 10;
  updatedDefender.relationships![attacker.id] =
    (defender.relationships?.[attacker.id] || -50) + 10;

  return {
    updatedAttacker,
    updatedDefender,
    resolvedGrievances,
    renouncedClaims,
    newTreaties: {
      [attacker.id]: { [defender.id]: peaceTreaty },
      [defender.id]: { [attacker.id]: peaceTreaty },
    },
  };
}

/**
 * Generate AI peace offer based on war state
 */
export function generateAIPeaceOffer(
  offeringNation: Nation,
  targetNation: Nation,
  warState: WarState,
  currentTurn: number
): PeaceOffer {
  const isAttacker = warState.attackerNationId === offeringNation.id;
  const myWarScore = isAttacker
    ? warState.attackerWarScore
    : warState.defenderWarScore;
  const enemyWarScore = isAttacker
    ? warState.defenderWarScore
    : warState.attackerWarScore;

  let terms: PeaceTerms;

  if (myWarScore < enemyWarScore - 30) {
    // Losing badly, offer white peace or accept terms
    terms = createWhitePeaceTerms();
  } else if (myWarScore > enemyWarScore + 30) {
    // Winning decisively, demand favorable terms
    terms = createPeaceTermsFromWarGoals(warState, false);
  } else {
    // Close war, offer white peace
    terms = createWhitePeaceTerms();
  }

  return createPeaceOffer(
    offeringNation,
    targetNation,
    warState,
    terms,
    currentTurn,
    `Peace offer from ${offeringNation.name}`
  );
}

/**
 * Create peace terms with specific grievance/claim resolutions
 */
export function createNegotiatedPeaceTerms(
  warState: WarState,
  options: {
    resolveGrievanceIds?: string[];
    renounceClaimIds?: string[];
    payReparations?: ResourceReparations;
    cededTerritories?: TerritoryChange[];
    treatyDuration?: number;
  }
): PeaceTerms {
  return {
    type: 'conditional-peace',
    territoryChanges: options.cededTerritories,
    reparations: options.payReparations,
    grievancesResolved: options.resolveGrievanceIds,
    claimsRenounced: options.renounceClaimIds,
    treatyDuration: options.treatyDuration || 15,
  };
}

/**
 * Check if peace offer has expired
 */
export function isPeaceOfferExpired(
  peaceOffer: PeaceOffer,
  currentTurn: number
): boolean {
  return currentTurn >= peaceOffer.expiresAt;
}

/**
 * Calculate relationship improvement from peace treaty
 */
export function calculatePeaceRelationshipBonus(
  peaceTerms: PeaceTerms,
  warDuration: number
): number {
  let bonus = 10; // Base peace bonus

  // White peace gives bigger relationship improvement
  if (peaceTerms.type === 'white-peace') {
    bonus += 10;
  }

  // Longer wars = bigger bonus from ending it
  if (warDuration > 15) {
    bonus += 10;
  }

  // Harsh terms reduce relationship improvement
  if (peaceTerms.type === 'unconditional-surrender') {
    bonus -= 10;
  }

  if (peaceTerms.militaryLimitations) {
    bonus -= 5;
  }

  return Math.max(0, bonus);
}

/**
 * Get peace enforcement difficulty
 */
export function getPeaceEnforcementDifficulty(
  peaceTerms: PeaceTerms
): 'easy' | 'moderate' | 'hard' {
  let difficultyScore = 0;

  if (peaceTerms.type === 'unconditional-surrender') {
    difficultyScore += 3;
  }

  if (peaceTerms.territoryChanges && peaceTerms.territoryChanges.length > 0) {
    difficultyScore += 2;
  }

  if (peaceTerms.reparations) {
    difficultyScore += 1;
  }

  if (peaceTerms.militaryLimitations) {
    difficultyScore += 2;
  }

  if (peaceTerms.ideologyChange) {
    difficultyScore += 3;
  }

  if (difficultyScore <= 2) return 'easy';
  if (difficultyScore <= 5) return 'moderate';
  return 'hard';
}
