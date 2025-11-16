/**
 * Nuclear War Card System
 * 
 * Handles card drawing, shuffling, and hand management for the Nuclear War campaign.
 */

import type { GameState } from '@/types/game';
import type { 
  WarheadCard, 
  NuclearWarHandState, 
  DeliverySystem,
  SecretCard,
  SpecialEventCard 
} from '@/types/nuclearWarCampaign';
import { 
  WARHEAD_CARDS, 
  DELIVERY_SYSTEMS, 
  SECRET_CARDS,
  SPECIAL_EVENTS 
} from '@/types/nuclearWarCampaign';

/**
 * Fisher-Yates shuffle algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Create a full deck of warhead cards
 */
export function createWarheadDeck(): WarheadCard[] {
  const deck: WarheadCard[] = [];
  
  // Add multiple copies of each warhead type
  WARHEAD_CARDS.forEach(card => {
    // Distribution: more smaller warheads, fewer massive ones
    const copies = card.megatons <= 15 ? 8 : card.megatons <= 25 ? 6 : card.megatons <= 50 ? 4 : 2;
    for (let i = 0; i < copies; i++) {
      deck.push({ ...card, id: `${card.id}_${i}` });
    }
  });
  
  return shuffleArray(deck);
}

/**
 * Draw warhead cards from deck
 */
export function drawWarheadCards(
  deck: WarheadCard[],
  discardPile: WarheadCard[],
  count: number
): { cards: WarheadCard[]; newDeck: WarheadCard[]; newDiscard: WarheadCard[] } {
  let currentDeck = [...deck];
  let currentDiscard = [...discardPile];
  const drawnCards: WarheadCard[] = [];

  for (let i = 0; i < count; i++) {
    // If deck is empty, shuffle discard pile back into deck
    if (currentDeck.length === 0) {
      if (currentDiscard.length === 0) break; // No cards left at all
      currentDeck = shuffleArray(currentDiscard);
      currentDiscard = [];
    }

    const card = currentDeck.pop();
    if (card) drawnCards.push(card);
  }

  return {
    cards: drawnCards,
    newDeck: currentDeck,
    newDiscard: currentDiscard,
  };
}

/**
 * Initialize hands for all nations
 */
export function initializeNuclearWarHands(gameState: GameState): {
  hands: Record<string, NuclearWarHandState>;
  deck: WarheadCard[];
  discardPile: WarheadCard[];
} {
  const hands: Record<string, NuclearWarHandState> = {};
  let deck = createWarheadDeck();
  const discardPile: WarheadCard[] = [];

  // Each nation starts with 5 warhead cards
  gameState.nations.forEach(nation => {
    const result = drawWarheadCards(deck, discardPile, 5);
    deck = result.newDeck;
    
    // Randomly assign 0-2 secret cards
    const secretCount = Math.floor(Math.random() * 3);
    const secrets = shuffleArray(SECRET_CARDS)
      .slice(0, secretCount)
      .map(s => ({ ...s, used: false }));

    hands[nation.id] = {
      nationId: nation.id,
      warheadCards: result.cards,
      deliverySystems: [...DELIVERY_SYSTEMS],
      populationCards: Math.floor(nation.population / 1000000), // 1M per card
      secrets,
    };
  });

  return { hands, deck, discardPile };
}

/**
 * Stockpile phase - all nations draw 3 cards
 */
export function stockpilePhase(
  gameState: GameState,
  addNewsItem?: (category: string, text: string, priority: string) => void
): GameState {
  const campaign = gameState.nuclearWarCampaign;
  if (!campaign) return gameState;

  let deck = [...campaign.deck];
  let discardPile = [...campaign.discardPile];
  const hands = { ...campaign.hands };

  gameState.nations.forEach(nation => {
    if (nation.eliminated) return;

    const result = drawWarheadCards(deck, discardPile, 3);
    deck = result.newDeck;
    discardPile = result.newDiscard;

    if (hands[nation.id]) {
      hands[nation.id] = {
        ...hands[nation.id],
        warheadCards: [...hands[nation.id].warheadCards, ...result.cards],
      };
    }
  });

  addNewsItem?.('military', '🎴 STOCKPILE PHASE: All nations draw 3 warhead cards', 'high');

  return {
    ...gameState,
    nuclearWarCampaign: {
      ...campaign,
      deck,
      discardPile,
      hands,
      phases: {
        ...campaign.phases,
        currentPhase: 'TARGETING',
      },
    },
  };
}

/**
 * Trigger random special event (10% chance)
 */
export function triggerSpecialEvent(
  gameState: GameState,
  addNewsItem?: (category: string, text: string, priority: string) => void
): GameState {
  if (Math.random() > 0.10) return gameState;

  const campaign = gameState.nuclearWarCampaign;
  if (!campaign) return gameState;

  const event = SPECIAL_EVENTS[Math.floor(Math.random() * SPECIAL_EVENTS.length)];
  
  addNewsItem?.(
    'crisis',
    `${event.icon} SPECIAL EVENT: ${event.name} - ${event.humorText}`,
    'critical'
  );

  let updatedState = gameState;

  // Apply event effects
  switch (event.type) {
    case 'Propaganda':
      // All nations draw 2 extra cards
      updatedState = applyPropagandaEvent(gameState, addNewsItem);
      break;
    case 'Escalation':
      // Double all damage this turn (handled in damage calculation)
      break;
    default:
      break;
  }

  return {
    ...updatedState,
    nuclearWarCampaign: {
      ...updatedState.nuclearWarCampaign!,
      currentEvent: event,
      eventsTriggered: [...(campaign.eventsTriggered || []), event.id],
    },
  };
}

/**
 * Apply propaganda event - all nations draw 2 extra cards
 */
function applyPropagandaEvent(
  gameState: GameState,
  addNewsItem?: (category: string, text: string, priority: string) => void
): GameState {
  const campaign = gameState.nuclearWarCampaign;
  if (!campaign) return gameState;

  let deck = [...campaign.deck];
  let discardPile = [...campaign.discardPile];
  const hands = { ...campaign.hands };

  gameState.nations.forEach(nation => {
    if (nation.eliminated) return;

    const result = drawWarheadCards(deck, discardPile, 2);
    deck = result.newDeck;
    discardPile = result.newDiscard;

    if (hands[nation.id]) {
      hands[nation.id] = {
        ...hands[nation.id],
        warheadCards: [...hands[nation.id].warheadCards, ...result.cards],
      };
    }
  });

  return {
    ...gameState,
    nuclearWarCampaign: {
      ...campaign,
      deck,
      discardPile,
      hands,
    },
  };
}

/**
 * Check for card-based achievements
 */
export function checkCardAchievements(
  gameState: GameState,
  nationId: string
): string[] {
  const campaign = gameState.nuclearWarCampaign;
  if (!campaign) return [];

  const hand = campaign.hands[nationId];
  if (!hand) return [];

  const achievements: string[] = [];

  // Card Shark - 10+ warhead cards
  if (hand.warheadCards.length >= 10) {
    achievements.push('cardShark');
  }

  // Full House - all 6 warhead types
  const uniqueTypes = new Set(hand.warheadCards.map(c => c.megatons));
  if (uniqueTypes.size >= 6) {
    achievements.push('fullHouse');
  }

  return achievements;
}
