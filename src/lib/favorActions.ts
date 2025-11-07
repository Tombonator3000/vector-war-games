/**
 * Favor Actions
 *
 * Functions for earning and spending favors in specific diplomatic contexts
 */

import type { Nation } from '@/types/game';
import { FavorEarning, FavorCosts, getFavors } from '@/types/trustAndFavors';
import { modifyFavors, spendFavors, modifyTrust } from './trustAndFavorsUtils';
import { modifyRelationship } from './relationshipUtils';

/**
 * Award favors for helping in a war
 * @param helper - Nation that helped
 * @param recipient - Nation that received help
 * @param warContribution - Percentage of war effort (0-100)
 * @param currentTurn - Current game turn
 * @returns Updated nations [helper, recipient]
 */
export function awardWarFavors(
  helper: Nation,
  recipient: Nation,
  warContribution: number,
  currentTurn: number
): [Nation, Nation] {
  let favorAmount: number;

  if (warContribution >= 50) {
    favorAmount = FavorEarning.WAR_PARTICIPATION_HIGH;
  } else if (warContribution >= 20) {
    favorAmount = FavorEarning.WAR_PARTICIPATION_MEDIUM;
  } else {
    favorAmount = FavorEarning.WAR_PARTICIPATION_LOW;
  }

  // Helper earns favors from recipient
  const updatedHelper = modifyFavors(
    helper,
    recipient.id,
    favorAmount,
    `Helped in war (${warContribution}% contribution)`,
    currentTurn
  );

  // Recipient owes favors to helper (negative balance from their perspective)
  const updatedRecipient = modifyFavors(
    recipient,
    helper.id,
    -favorAmount,
    `Received war assistance (${warContribution}% contribution)`,
    currentTurn
  );

  return [updatedHelper, updatedRecipient];
}

/**
 * Award favors for sending economic aid
 * @param sender - Nation sending aid
 * @param receiver - Nation receiving aid
 * @param currentTurn - Current game turn
 * @returns Updated nations [sender, receiver]
 */
export function awardAidFavors(
  sender: Nation,
  receiver: Nation,
  currentTurn: number
): [Nation, Nation] {
  const updatedSender = modifyFavors(
    sender,
    receiver.id,
    FavorEarning.SEND_AID,
    'Sent economic aid',
    currentTurn
  );

  const updatedReceiver = modifyFavors(
    receiver,
    sender.id,
    -FavorEarning.SEND_AID,
    'Received economic aid',
    currentTurn
  );

  return [updatedSender, updatedReceiver];
}

/**
 * Award favors for sharing intelligence
 * @param sharer - Nation sharing intel
 * @param recipient - Nation receiving intel
 * @param currentTurn - Current game turn
 * @returns Updated nations [sharer, recipient]
 */
export function awardIntelFavors(
  sharer: Nation,
  recipient: Nation,
  currentTurn: number
): [Nation, Nation] {
  const updatedSharer = modifyFavors(
    sharer,
    recipient.id,
    FavorEarning.SHARE_INTEL,
    'Shared intelligence',
    currentTurn
  );

  const updatedRecipient = modifyFavors(
    recipient,
    sharer.id,
    -FavorEarning.SHARE_INTEL,
    'Received intelligence',
    currentTurn
  );

  return [updatedSharer, updatedRecipient];
}

/**
 * Award favors for giving territory in peace deal
 * @param giver - Nation giving territory
 * @param receiver - Nation receiving territory
 * @param currentTurn - Current game turn
 * @returns Updated nations [giver, receiver]
 */
export function awardTerritoryFavors(
  giver: Nation,
  receiver: Nation,
  currentTurn: number
): [Nation, Nation] {
  const updatedGiver = modifyFavors(
    giver,
    receiver.id,
    FavorEarning.GIVE_TERRITORY,
    'Gave territory in peace deal',
    currentTurn
  );

  const updatedReceiver = modifyFavors(
    receiver,
    giver.id,
    -FavorEarning.GIVE_TERRITORY,
    'Received territory',
    currentTurn
  );

  return [updatedGiver, updatedReceiver];
}

/**
 * Award favor for not calling ally to war when eligible
 * @param nation - Nation that didn't call ally
 * @param potentialAlly - Ally that wasn't called
 * @param currentTurn - Current game turn
 * @returns Updated nations [nation, potentialAlly]
 */
export function awardNotCallingToWar(
  nation: Nation,
  potentialAlly: Nation,
  currentTurn: number
): [Nation, Nation] {
  const updatedNation = modifyFavors(
    nation,
    potentialAlly.id,
    FavorEarning.NOT_CALL_TO_WAR,
    'Did not call to war',
    currentTurn
  );

  const updatedAlly = modifyFavors(
    potentialAlly,
    nation.id,
    -FavorEarning.NOT_CALL_TO_WAR,
    'Spared from war call',
    currentTurn
  );

  return [updatedNation, updatedAlly];
}

/**
 * Spend favors to guarantee ally joins war
 * @param caller - Nation calling ally to war
 * @param ally - Nation being called
 * @param currentTurn - Current game turn
 * @returns Updated caller nation or null if insufficient favors
 */
export function spendFavorsForWarCall(
  caller: Nation,
  ally: Nation,
  currentTurn: number
): { caller: Nation; ally: Nation } | null {
  const cost = FavorCosts.CALL_TO_WAR;
  const availableFavors = getFavors(caller, ally.id);

  if (availableFavors < cost) {
    return null;
  }

  const updatedCaller = spendFavors(
    caller,
    ally.id,
    cost,
    'Called to war',
    currentTurn
  );

  if (!updatedCaller) return null;

  const updatedAlly = modifyFavors(
    ally,
    caller.id,
    cost, // Ally's perspective: they were owed favors, now less
    'Called to war',
    currentTurn
  );

  return { caller: updatedCaller, ally: updatedAlly };
}

/**
 * Spend favors to request economic aid
 * @param requester - Nation requesting aid
 * @param provider - Nation providing aid
 * @param currentTurn - Current game turn
 * @returns Updated nations or null if insufficient favors
 */
export function spendFavorsForAid(
  requester: Nation,
  provider: Nation,
  currentTurn: number
): { requester: Nation; provider: Nation } | null {
  const cost = FavorCosts.REQUEST_AID;
  const availableFavors = getFavors(requester, provider.id);

  if (availableFavors < cost) {
    return null;
  }

  const updatedRequester = spendFavors(
    requester,
    provider.id,
    cost,
    'Requested aid',
    currentTurn
  );

  if (!updatedRequester) return null;

  const updatedProvider = modifyFavors(
    provider,
    requester.id,
    cost,
    'Provided aid on request',
    currentTurn
  );

  return { requester: updatedRequester, provider: updatedProvider };
}

/**
 * Spend favors to request military access/passage
 * @param requester - Nation requesting access
 * @param provider - Nation granting access
 * @param currentTurn - Current game turn
 * @returns Updated nations or null if insufficient favors
 */
export function spendFavorsForMilitaryAccess(
  requester: Nation,
  provider: Nation,
  currentTurn: number
): { requester: Nation; provider: Nation } | null {
  const cost = FavorCosts.REQUEST_MILITARY_ACCESS;
  const availableFavors = getFavors(requester, provider.id);

  if (availableFavors < cost) {
    return null;
  }

  const updatedRequester = spendFavors(
    requester,
    provider.id,
    cost,
    'Requested military access',
    currentTurn
  );

  if (!updatedRequester) return null;

  const updatedProvider = modifyFavors(
    provider,
    requester.id,
    cost,
    'Granted military access',
    currentTurn
  );

  return { requester: updatedRequester, provider: updatedProvider };
}

/**
 * Spend favors to increase trust
 * @param spender - Nation spending favors
 * @param target - Nation to increase trust with
 * @param currentTurn - Current game turn
 * @returns Updated spender nation or null if insufficient favors
 */
export function spendFavorsForTrust(
  spender: Nation,
  target: Nation,
  currentTurn: number
): { spender: Nation; target: Nation } | null {
  const cost = FavorCosts.INCREASE_TRUST;
  const availableFavors = getFavors(spender, target.id);

  if (availableFavors < cost) {
    return null;
  }

  let updatedSpender = spendFavors(
    spender,
    target.id,
    cost,
    'Spent favors to build trust',
    currentTurn
  );

  if (!updatedSpender) return null;

  // Apply trust modification
  updatedSpender = modifyTrust(
    updatedSpender,
    target.id,
    5, // +5 trust
    'Favors converted to trust',
    currentTurn
  );

  const updatedTarget = modifyFavors(
    target,
    spender.id,
    cost,
    'Favors honored for trust',
    currentTurn
  );

  return { spender: updatedSpender, target: updatedTarget };
}

/**
 * Spend favors to request sanction lift
 * @param requester - Nation requesting sanction lift
 * @param sanctioner - Nation that imposed sanctions
 * @param currentTurn - Current game turn
 * @returns Updated nations or null if insufficient favors
 */
export function spendFavorsForSanctionLift(
  requester: Nation,
  sanctioner: Nation,
  currentTurn: number
): { requester: Nation; sanctioner: Nation } | null {
  const cost = FavorCosts.DEMAND_SANCTION_LIFT;
  const availableFavors = getFavors(requester, sanctioner.id);

  if (availableFavors < cost) {
    return null;
  }

  const updatedRequester = spendFavors(
    requester,
    sanctioner.id,
    cost,
    'Requested sanction lift',
    currentTurn
  );

  if (!updatedRequester) return null;

  const updatedSanctioner = modifyFavors(
    sanctioner,
    requester.id,
    cost,
    'Lifted sanctions',
    currentTurn
  );

  return { requester: updatedRequester, sanctioner: updatedSanctioner };
}

/**
 * Spend favors to request intelligence sharing
 * @param requester - Nation requesting intel
 * @param provider - Nation providing intel
 * @param currentTurn - Current game turn
 * @returns Updated nations or null if insufficient favors
 */
export function spendFavorsForIntelShare(
  requester: Nation,
  provider: Nation,
  currentTurn: number
): { requester: Nation; provider: Nation } | null {
  const cost = FavorCosts.REQUEST_INTEL_SHARE;
  const availableFavors = getFavors(requester, provider.id);

  if (availableFavors < cost) {
    return null;
  }

  const updatedRequester = spendFavors(
    requester,
    provider.id,
    cost,
    'Requested intelligence',
    currentTurn
  );

  if (!updatedRequester) return null;

  const updatedProvider = modifyFavors(
    provider,
    requester.id,
    cost,
    'Shared intelligence',
    currentTurn
  );

  return { requester: updatedRequester, provider: updatedProvider };
}

/**
 * Calculate war contribution for favor awards
 * This is a simplified calculation - you may want to track actual battle contributions
 * @param helper - Nation that helped
 * @param totalEnemyPower - Total enemy military power
 * @returns Estimated contribution percentage (0-100)
 */
export function calculateWarContribution(
  helper: Nation,
  totalEnemyPower: number
): number {
  const helperPower = (helper.missiles || 0) + (helper.bombers || 0) * 2;

  if (totalEnemyPower === 0) return 50; // Default if no enemy power

  const contribution = (helperPower / totalEnemyPower) * 100;
  return Math.min(100, Math.max(0, contribution));
}

/**
 * Check if nation has enough favors for an action
 * @param nation - Nation checking favors
 * @param targetNationId - Nation to spend favors with
 * @param actionType - Type of action to perform
 * @returns True if nation has enough favors
 */
export function hasEnoughFavorsForAction(
  nation: Nation,
  targetNationId: string,
  actionType: keyof typeof FavorCosts
): boolean {
  const required = FavorCosts[actionType];
  const available = getFavors(nation, targetNationId);
  return available >= required;
}

/**
 * Get all favor spending options available to a nation
 * @param nation - Nation to check
 * @param targetNationId - Target nation
 * @returns Array of available actions
 */
export function getAvailableFavorActions(
  nation: Nation,
  targetNationId: string
): Array<{ action: keyof typeof FavorCosts; cost: number }> {
  const available: Array<{ action: keyof typeof FavorCosts; cost: number }> = [];
  const currentFavors = getFavors(nation, targetNationId);

  for (const [action, cost] of Object.entries(FavorCosts)) {
    if (currentFavors >= cost) {
      available.push({ action: action as keyof typeof FavorCosts, cost });
    }
  }

  return available;
}
