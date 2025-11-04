/**
 * Multi-Party Diplomacy Integration - FASE 3.4
 *
 * Integrates multi-party diplomacy with the main game loop.
 * Handles agreement proposals, voting, and enforcement.
 */

import type { Nation, GameState } from '@/types/game';
import type {
  MultiPartyAgreement,
  MultiPartyAgreementType,
  MultiPartyDiplomacyState,
  MultiPartyTerms,
  NationObligation,
  NationBenefit,
} from '@/types/multiPartyDiplomacy';
import {
  createMultiPartyAgreement,
  castVote,
  checkAgreementStatus,
  calculateAIVoteProbability,
  initializeMultiPartyDiplomacyState,
} from '@/types/multiPartyDiplomacy';

/**
 * Initialize multi-party diplomacy state in game state
 */
export function initializeMultiPartyDiplomacy(gameState: GameState): void {
  if (!gameState.multiPartyDiplomacy) {
    gameState.multiPartyDiplomacy = initializeMultiPartyDiplomacyState();
  }
}

/**
 * Propose a multi-party agreement
 */
export function proposeMultiPartyAgreement(
  type: MultiPartyAgreementType,
  initiatorNation: Nation,
  participantIds: string[],
  gameState: GameState,
  targetIds?: string[]
): MultiPartyAgreement {
  // Create default terms based on type
  const terms = createDefaultTerms(type, initiatorNation, participantIds, gameState, targetIds);

  // Create the agreement
  const agreement = createMultiPartyAgreement(
    type,
    initiatorNation.id,
    participantIds,
    terms,
    gameState.turn
  );

  // Add to game state
  if (!gameState.multiPartyDiplomacy) {
    initializeMultiPartyDiplomacy(gameState);
  }
  gameState.multiPartyDiplomacy!.pendingProposals.push(agreement);

  // Auto-vote yes for initiator
  const votedAgreement = castVote(agreement, initiatorNation.id, 'yes', gameState.turn);

  // Update in state
  const index = gameState.multiPartyDiplomacy!.pendingProposals.findIndex(a => a.id === agreement.id);
  if (index >= 0) {
    gameState.multiPartyDiplomacy!.pendingProposals[index] = votedAgreement;
  }

  return votedAgreement;
}

/**
 * Cast a vote on an agreement
 */
export function voteOnAgreement(
  agreementId: string,
  nationId: string,
  vote: 'yes' | 'no' | 'abstain',
  gameState: GameState
): boolean {
  if (!gameState.multiPartyDiplomacy) return false;

  const agreement = gameState.multiPartyDiplomacy.pendingProposals.find(a => a.id === agreementId);
  if (!agreement) return false;

  // Cast vote
  const votedAgreement = castVote(agreement, nationId, vote, gameState.turn);

  // Update in state
  const index = gameState.multiPartyDiplomacy.pendingProposals.findIndex(a => a.id === agreementId);
  if (index >= 0) {
    gameState.multiPartyDiplomacy.pendingProposals[index] = votedAgreement;
  }

  return true;
}

/**
 * Process AI votes on pending agreements
 */
export function processAIVotes(gameState: GameState): void {
  if (!gameState.multiPartyDiplomacy) return;

  for (const agreement of gameState.multiPartyDiplomacy.pendingProposals) {
    if (agreement.status === 'proposed' || agreement.status === 'voting') {
      // Check each AI participant that hasn't voted
      for (const participantId of agreement.participantIds) {
        if (!agreement.votes[participantId]) {
          const nation = gameState.nations.find(n => n.id === participantId);
          if (nation && !nation.isPlayer) {
            // Calculate vote probability
            const probability = calculateAIVoteProbability(agreement, nation, gameState);

            // Decide vote (slightly weighted towards yes if probability > 50%)
            const roll = Math.random();
            let vote: 'yes' | 'no' | 'abstain';

            if (roll < probability) {
              vote = 'yes';
            } else if (roll < probability + 0.3) {
              vote = 'abstain';
            } else {
              vote = 'no';
            }

            // Cast vote
            voteOnAgreement(agreement.id, participantId, vote, gameState);
          }
        }
      }
    }
  }
}

/**
 * Update multi-party agreements each turn
 */
export function updateMultiPartyAgreementsPerTurn(gameState: GameState): void {
  if (!gameState.multiPartyDiplomacy) return;

  const diplomacy = gameState.multiPartyDiplomacy;

  // Process pending agreements
  const stillPending: MultiPartyAgreement[] = [];

  for (const agreement of diplomacy.pendingProposals) {
    // Check status
    const updatedAgreement = checkAgreementStatus(agreement, gameState.turn);

    if (updatedAgreement.status === 'passed') {
      // Move to active agreements
      diplomacy.agreements.push(updatedAgreement);

      // Apply agreement effects
      applyAgreementEffects(updatedAgreement, gameState);
    } else if (updatedAgreement.status === 'failed' || updatedAgreement.status === 'expired') {
      // Remove from pending (agreement failed)
      continue;
    } else {
      // Still pending
      stillPending.push(updatedAgreement);
    }
  }

  diplomacy.pendingProposals = stillPending;

  // Update active agreements
  for (const agreement of diplomacy.agreements) {
    if (agreement.status === 'passed') {
      // Apply ongoing effects
      applyOngoingAgreementEffects(agreement, gameState);

      // Check if agreement should expire
      if (agreement.terms.duration) {
        const elapsedTurns = gameState.turn - agreement.createdTurn;
        if (elapsedTurns >= agreement.terms.duration) {
          agreement.status = 'completed';
        }
      }
    }
  }

  // Remove completed agreements
  diplomacy.agreements = diplomacy.agreements.filter(a => a.status !== 'completed');
}

/**
 * Apply initial agreement effects
 */
function applyAgreementEffects(agreement: MultiPartyAgreement, gameState: GameState): void {
  switch (agreement.type) {
    case 'multi-lateral-alliance':
      // Form alliances between all participants
      for (let i = 0; i < agreement.participantIds.length; i++) {
        for (let j = i + 1; j < agreement.participantIds.length; j++) {
          const nation1 = gameState.nations.find(n => n.id === agreement.participantIds[i]);
          const nation2 = gameState.nations.find(n => n.id === agreement.participantIds[j]);

          if (nation1 && nation2) {
            if (!nation1.treaties) nation1.treaties = {};
            if (!nation2.treaties) nation2.treaties = {};

            nation1.treaties[nation2.id] = { alliance: true };
            nation2.treaties[nation1.id] = { alliance: true };

            // Boost relationships
            if (!nation1.relationship) nation1.relationship = {};
            if (!nation2.relationship) nation2.relationship = {};

            nation1.relationship[nation2.id] = Math.min(100, (nation1.relationship[nation2.id] || 0) + 30);
            nation2.relationship[nation1.id] = Math.min(100, (nation2.relationship[nation1.id] || 0) + 30);
          }
        }
      }
      break;

    case 'joint-war-declaration':
      // All participants declare war on targets
      if (agreement.terms.targetNationIds) {
        for (const participantId of agreement.participantIds) {
          for (const targetId of agreement.terms.targetNationIds) {
            const participant = gameState.nations.find(n => n.id === participantId);
            const target = gameState.nations.find(n => n.id === targetId);

            if (participant && target) {
              // Set hostile relationship
              if (!participant.relationship) participant.relationship = {};
              if (!target.relationship) target.relationship = {};

              participant.relationship[targetId] = -100;
              target.relationship[participantId] = -100;

              // Remove any treaties
              if (participant.treaties) {
                delete participant.treaties[targetId];
              }
              if (target.treaties) {
                delete target.treaties[participantId];
              }
            }
          }
        }
      }
      break;

    case 'non-aggression-bloc':
      // Establish non-aggression pacts
      for (let i = 0; i < agreement.participantIds.length; i++) {
        for (let j = i + 1; j < agreement.participantIds.length; j++) {
          const nation1 = gameState.nations.find(n => n.id === agreement.participantIds[i]);
          const nation2 = gameState.nations.find(n => n.id === agreement.participantIds[j]);

          if (nation1 && nation2) {
            if (!nation1.treaties) nation1.treaties = {};
            if (!nation2.treaties) nation2.treaties = {};

            nation1.treaties[nation2.id] = { nonAggression: true };
            nation2.treaties[nation1.id] = { nonAggression: true };

            // Slight relationship boost
            if (!nation1.relationship) nation1.relationship = {};
            if (!nation2.relationship) nation2.relationship = {};

            nation1.relationship[nation2.id] = Math.min(100, (nation1.relationship[nation2.id] || 0) + 15);
            nation2.relationship[nation1.id] = Math.min(100, (nation2.relationship[nation1.id] || 0) + 15);
          }
        }
      }
      break;

    case 'trade-agreement':
      // Grant production/resource bonuses
      for (const participantId of agreement.participantIds) {
        const nation = gameState.nations.find(n => n.id === participantId);
        if (nation) {
          nation.production = Math.floor(nation.production * 1.15);
          nation.gold = (nation.gold || 0) + 50;
        }
      }
      break;

    case 'joint-embargo':
      // Apply sanctions to targets
      if (agreement.terms.targetNationIds) {
        for (const targetId of agreement.terms.targetNationIds) {
          const target = gameState.nations.find(n => n.id === targetId);
          if (target) {
            target.sanctioned = true;
            target.sanctionTurns = agreement.terms.duration || 10;
            target.production = Math.floor(target.production * 0.7);
          }
        }
      }
      break;
  }
}

/**
 * Apply ongoing agreement effects each turn
 */
function applyOngoingAgreementEffects(agreement: MultiPartyAgreement, gameState: GameState): void {
  // Apply obligations and benefits
  for (const obligation of agreement.terms.obligations) {
    if (obligation.turnFrequency) {
      const elapsedTurns = gameState.turn - agreement.createdTurn;
      if (elapsedTurns % obligation.turnFrequency === 0) {
        applyObligation(obligation, gameState);
      }
    }
  }

  for (const benefit of agreement.terms.benefits) {
    if (benefit.turnFrequency) {
      const elapsedTurns = gameState.turn - agreement.createdTurn;
      if (elapsedTurns % benefit.turnFrequency === 0) {
        applyBenefit(benefit, gameState);
      }
    }
  }
}

/**
 * Apply a nation obligation
 */
function applyObligation(obligation: NationObligation, gameState: GameState): void {
  const nation = gameState.nations.find(n => n.id === obligation.nationId);
  if (!nation) return;

  switch (obligation.type) {
    case 'resource-tribute':
      if (obligation.value) {
        nation.production = Math.max(0, nation.production - obligation.value);
      }
      break;

    case 'share-intel':
      if (obligation.value) {
        nation.intel = Math.max(0, nation.intel - obligation.value);
      }
      break;

    // Other obligation types would be handled here
  }
}

/**
 * Apply a nation benefit
 */
function applyBenefit(benefit: NationBenefit, gameState: GameState): void {
  const nation = gameState.nations.find(n => n.id === benefit.nationId);
  if (!nation) return;

  switch (benefit.type) {
    case 'resource-sharing':
      if (benefit.value) {
        nation.production += benefit.value;
      }
      break;

    case 'trade-bonus':
      if (benefit.value) {
        nation.gold = (nation.gold || 0) + benefit.value;
      }
      break;

    // Other benefit types would be handled here
  }
}

/**
 * Create default terms for an agreement type
 */
function createDefaultTerms(
  type: MultiPartyAgreementType,
  initiator: Nation,
  participantIds: string[],
  gameState: GameState,
  targetIds?: string[]
): MultiPartyTerms {
  const obligations: NationObligation[] = [];
  const benefits: NationBenefit[] = [];

  switch (type) {
    case 'multi-lateral-alliance':
      // All members must defend each other
      for (const id of participantIds) {
        obligations.push({
          nationId: id,
          type: 'defend-member',
          description: 'Must defend alliance members if attacked',
        });

        benefits.push({
          nationId: id,
          type: 'military-protection',
          description: 'Protected by all alliance members',
        });
      }
      return {
        duration: 20,
        obligations,
        benefits,
        penalties: [
          {
            type: 'relationship-drop',
            value: 50,
            description: 'Betraying the alliance damages reputation',
            applyToAll: true,
          },
        ],
      };

    case 'joint-war-declaration':
      return {
        targetNationIds: targetIds,
        obligations: participantIds.map(id => ({
          nationId: id,
          type: 'military-support',
          description: 'Must actively participate in war effort',
        })),
        benefits: participantIds.map(id => ({
          nationId: id,
          type: 'military-protection',
          description: 'Coordinated military support',
        })),
        penalties: [
          {
            type: 'expulsion',
            value: 1,
            description: 'Expelled from coalition if not participating',
            applyToAll: false,
          },
        ],
      };

    case 'non-aggression-bloc':
      return {
        duration: 15,
        obligations: participantIds.map(id => ({
          nationId: id,
          type: 'no-aggression',
          description: 'Cannot attack other bloc members',
        })),
        benefits: participantIds.map(id => ({
          nationId: id,
          type: 'diplomatic-support',
          description: 'Improved relations with bloc members',
        })),
        penalties: [
          {
            type: 'relationship-drop',
            value: 40,
            description: 'Breaking non-aggression severely damages trust',
            applyToAll: true,
          },
        ],
      };

    case 'trade-agreement':
      return {
        duration: 12,
        obligations: [],
        benefits: participantIds.map(id => ({
          nationId: id,
          type: 'trade-bonus',
          value: 10,
          turnFrequency: 1,
          description: 'Receive trade bonuses each turn',
        })),
        penalties: [],
      };

    case 'joint-embargo':
      return {
        targetNationIds: targetIds,
        duration: 10,
        obligations: participantIds.map(id => ({
          nationId: id,
          type: 'embargo-target',
          description: 'Must maintain embargo on target',
        })),
        benefits: [],
        penalties: [
          {
            type: 'reputation-damage',
            value: 20,
            description: 'Breaking embargo damages credibility',
            applyToAll: true,
          },
        ],
      };

    default:
      return {
        obligations: [],
        benefits: [],
        penalties: [],
      };
  }
}
