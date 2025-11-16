/**
 * Nuclear War Automatic Retaliation System
 * 
 * Handles automatic retaliation mechanics and chain reactions for the Nuclear War campaign.
 * Survivors MUST retaliate if they have warheads, creating cascading MAD scenarios.
 */

import type { GameState } from '@/types/game';
import type { WarheadCard, DeliverySystem } from '@/types/nuclearWarCampaign';
import { DELIVERY_SYSTEMS } from '@/types/nuclearWarCampaign';

export interface RetaliationEvent {
  attackerId: string;
  targetId: string;
  retaliationCards: WarheadCard[];
  deliverySystem: DeliverySystem;
  chainReaction: boolean;
  casualties: number;
  hitSuccessful: boolean;
}

export interface ChainReactionResult {
  retaliations: RetaliationEvent[];
  affectedNations: string[];
  totalCasualties: number;
  chainDepth: number;
}

/**
 * Trigger automatic retaliation from a nation that was attacked
 */
export function triggerAutomaticRetaliation(
  gameState: GameState,
  attackerId: string,
  targetId: string,
  addNewsItem?: (category: string, text: string, priority: string) => void
): RetaliationEvent | null {
  const campaign = gameState.nuclearWarCampaign;
  if (!campaign?.isActive) return null;

  const targetHand = campaign.hands[targetId];
  const targetNation = gameState.nations.find(n => n.id === targetId);
  
  if (!targetHand || !targetNation || targetNation.eliminated) return null;

  // Target MUST retaliate if they have warheads
  if (targetHand.warheadCards.length === 0) {
    addNewsItem?.(
      'military',
      `${targetNation.name} cannot retaliate - out of warheads!`,
      'high'
    );
    return null;
  }

  // Select a random warhead from hand
  const randomIndex = Math.floor(Math.random() * targetHand.warheadCards.length);
  const warheadCard = targetHand.warheadCards[randomIndex];

  // Select random delivery system
  const deliverySystem = DELIVERY_SYSTEMS[Math.floor(Math.random() * DELIVERY_SYSTEMS.length)];

  // 30% chance for "spin the bottle" - wrong target
  const spinTheBottle = Math.random() < 0.30;
  let actualTargetId = attackerId;
  
  if (spinTheBottle) {
    const aliveNations = gameState.nations.filter(n => !n.eliminated && n.id !== targetId);
    if (aliveNations.length > 0) {
      actualTargetId = aliveNations[Math.floor(Math.random() * aliveNations.length)].id;
      addNewsItem?.(
        'crisis',
        `🎲 SPIN THE BOTTLE! ${targetNation.name}'s retaliation went ROGUE and hit ${aliveNations.find(n => n.id === actualTargetId)?.name}!`,
        'critical'
      );
    }
  }

  // Calculate hit success based on reliability
  const hitSuccessful = Math.random() < deliverySystem.reliability;
  
  // Calculate casualties (simplified)
  const targetPopulation = gameState.nations.find(n => n.id === actualTargetId)?.population || 0;
  const casualties = hitSuccessful 
    ? Math.floor(warheadCard.megatons * 100000 * (0.8 + Math.random() * 0.4))
    : 0;

  // 20% chance for chain reaction
  const chainReaction = Math.random() < 0.20;

  const retaliation: RetaliationEvent = {
    attackerId: targetId,
    targetId: actualTargetId,
    retaliationCards: [warheadCard],
    deliverySystem,
    chainReaction,
    casualties,
    hitSuccessful,
  };

  if (chainReaction) {
    addNewsItem?.(
      'crisis',
      `⚠️ CHAIN REACTION! ${targetNation.name}'s retaliation triggered escalation!`,
      'critical'
    );
  }

  return retaliation;
}

/**
 * Process a full chain reaction cascade
 */
export function processChainReaction(
  gameState: GameState,
  initialAttackerId: string,
  initialTargetId: string,
  maxDepth: number = 5,
  addNewsItem?: (category: string, text: string, priority: string) => void
): ChainReactionResult {
  const retaliations: RetaliationEvent[] = [];
  const affectedNations = new Set<string>([initialAttackerId, initialTargetId]);
  let totalCasualties = 0;
  let currentDepth = 0;

  // Track who has already retaliated to prevent infinite loops
  const hasRetaliated = new Set<string>();
  let pendingRetaliations: Array<{attacker: string; target: string}> = [
    { attacker: initialAttackerId, target: initialTargetId }
  ];

  while (pendingRetaliations.length > 0 && currentDepth < maxDepth) {
    const nextRound: Array<{attacker: string; target: string}> = [];
    
    for (const { attacker, target } of pendingRetaliations) {
      if (hasRetaliated.has(target)) continue;
      
      const retaliation = triggerAutomaticRetaliation(
        gameState,
        attacker,
        target,
        addNewsItem
      );

      if (retaliation) {
        retaliations.push(retaliation);
        affectedNations.add(retaliation.attackerId);
        affectedNations.add(retaliation.targetId);
        totalCasualties += retaliation.casualties;
        hasRetaliated.add(target);

        // If chain reaction triggered, add to next round
        if (retaliation.chainReaction && currentDepth < maxDepth - 1) {
          nextRound.push({
            attacker: retaliation.attackerId,
            target: retaliation.targetId
          });
        }
      }
    }

    pendingRetaliations = nextRound;
    currentDepth++;
  }

  if (retaliations.length >= 3) {
    addNewsItem?.(
      'crisis',
      `⛓️ MASSIVE CHAIN REACTION! ${retaliations.length} retaliatory strikes across ${affectedNations.size} nations!`,
      'critical'
    );
  }

  return {
    retaliations,
    affectedNations: Array.from(affectedNations),
    totalCasualties,
    chainDepth: currentDepth,
  };
}

/**
 * Apply retaliation damage to game state
 */
export function applyRetaliationDamage(
  gameState: GameState,
  retaliation: RetaliationEvent
): GameState {
  if (!retaliation.hitSuccessful) return gameState;

  const updatedNations = gameState.nations.map(nation => {
    if (nation.id === retaliation.targetId) {
      return {
        ...nation,
        population: Math.max(0, nation.population - retaliation.casualties),
      };
    }
    return nation;
  });

  return {
    ...gameState,
    nations: updatedNations,
  };
}

/**
 * Remove used warhead card from nation's hand
 */
export function removeWarheadFromHand(
  gameState: GameState,
  nationId: string,
  warheadCard: WarheadCard
): GameState {
  const campaign = gameState.nuclearWarCampaign;
  if (!campaign) return gameState;

  const hand = campaign.hands[nationId];
  if (!hand) return gameState;

  return {
    ...gameState,
    nuclearWarCampaign: {
      ...campaign,
      hands: {
        ...campaign.hands,
        [nationId]: {
          ...hand,
          warheadCards: hand.warheadCards.filter(c => c.id !== warheadCard.id),
        },
      },
      discardPile: [...campaign.discardPile, warheadCard],
    },
  };
}
