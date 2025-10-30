/**
 * Economic Gameplay Depth
 * Trade routes, market prices, resource scarcity
 */

export type ResourceType = 'production' | 'uranium' | 'intel';

export type EconomicEventType =
  | 'economic_boom'
  | 'recession'
  | 'resource_shortage'
  | 'market_crash'
  | 'trade_disruption'
  | 'technological_breakthrough';

export interface TradeRoute {
  id: string;
  fromNationId: string;
  toNationId: string;
  resource: ResourceType;
  amountPerTurn: number;
  establishedTurn: number;
  maintenanceCost: number;
  active: boolean;
}

export interface ResourceMarket {
  prices: Record<ResourceType, number>; // Current price per unit
  priceHistory: Array<{
    turn: number;
    prices: Record<ResourceType, number>;
  }>;
  volatility: number; // 0-100, how much prices fluctuate
}

export interface EconomicEvent {
  type: EconomicEventType;
  title: string;
  description: string;
  duration: number; // Turns
  effects: {
    productionModifier?: number; // Percentage (-50 to +50)
    uraniumModifier?: number;
    intelModifier?: number;
    priceImpact?: Partial<Record<ResourceType, number>>; // Price multiplier
  };
  icon: string;
}

export interface TradeProposal {
  id: string;
  fromNationId: string;
  toNationId: string;
  offering: Partial<Record<ResourceType, number>>;
  requesting: Partial<Record<ResourceType, number>>;
  turnProposed: number;
  status: 'pending' | 'accepted' | 'rejected';
}

// Base market prices
export const BASE_MARKET_PRICES: Record<ResourceType, number> = {
  production: 1, // 1 credit per production
  uranium: 3, // 3 credits per uranium (scarce)
  intel: 2, // 2 credits per intel
};

// Economic events that can occur
export const ECONOMIC_EVENTS: Record<EconomicEventType, EconomicEvent> = {
  economic_boom: {
    type: 'economic_boom',
    title: 'Economic Boom',
    description: 'Global economy thrives, production increases',
    duration: 5,
    effects: {
      productionModifier: 20,
      priceImpact: {
        production: 0.8, // Prices drop due to abundance
      },
    },
    icon: '📈',
  },
  recession: {
    type: 'recession',
    title: 'Economic Recession',
    description: 'Global downturn reduces production capacity',
    duration: 4,
    effects: {
      productionModifier: -20,
      priceImpact: {
        production: 1.3, // Prices rise due to scarcity
      },
    },
    icon: '📉',
  },
  resource_shortage: {
    type: 'resource_shortage',
    title: 'Uranium Shortage',
    description: 'Global uranium reserves depleting',
    duration: 6,
    effects: {
      uraniumModifier: -30,
      priceImpact: {
        uranium: 2.0, // Prices double
      },
    },
    icon: '⚛️',
  },
  market_crash: {
    type: 'market_crash',
    title: 'Market Crash',
    description: 'Financial crisis affects all resources',
    duration: 3,
    effects: {
      productionModifier: -15,
      uraniumModifier: -15,
      intelModifier: -15,
      priceImpact: {
        production: 1.2,
        uranium: 1.2,
        intel: 1.2,
      },
    },
    icon: '💥',
  },
  trade_disruption: {
    type: 'trade_disruption',
    title: 'Trade Route Disruption',
    description: 'Global trade networks damaged',
    duration: 4,
    effects: {
      productionModifier: -10,
      priceImpact: {
        production: 1.4,
        uranium: 1.3,
        intel: 1.2,
      },
    },
    icon: '🚢',
  },
  technological_breakthrough: {
    type: 'technological_breakthrough',
    title: 'Technological Breakthrough',
    description: 'Research efficiency increases dramatically',
    duration: 5,
    effects: {
      intelModifier: 30,
      priceImpact: {
        intel: 0.7,
      },
    },
    icon: '🔬',
  },
};

/**
 * Calculate market price with modifiers
 */
export function calculateMarketPrice(
  resource: ResourceType,
  basePrice: number,
  activeEvents: EconomicEvent[]
): number {
  let price = basePrice;

  // Apply event modifiers
  activeEvents.forEach((event) => {
    if (event.effects.priceImpact?.[resource]) {
      price *= event.effects.priceImpact[resource];
    }
  });

  // Add some volatility (±10%)
  const volatility = 0.9 + Math.random() * 0.2;
  price *= volatility;

  return Math.round(price * 10) / 10; // Round to 1 decimal
}

/**
 * Simulate market price fluctuation
 */
export function simulateMarketFluctuation(
  currentPrices: Record<ResourceType, number>,
  activeEvents: EconomicEvent[]
): Record<ResourceType, number> {
  const newPrices: Record<ResourceType, number> = { ...currentPrices };

  Object.keys(newPrices).forEach((resource) => {
    const resourceType = resource as ResourceType;

    // Natural price drift (±5% per turn)
    const drift = 0.95 + Math.random() * 0.1;
    newPrices[resourceType] *= drift;

    // Apply event impacts
    activeEvents.forEach((event) => {
      if (event.effects.priceImpact?.[resourceType]) {
        newPrices[resourceType] *= event.effects.priceImpact[resourceType];
      }
    });

    // Keep prices within reasonable bounds (50%-200% of base)
    const basePrice = BASE_MARKET_PRICES[resourceType];
    newPrices[resourceType] = Math.max(
      basePrice * 0.5,
      Math.min(basePrice * 2.0, newPrices[resourceType])
    );

    // Round to 1 decimal
    newPrices[resourceType] = Math.round(newPrices[resourceType] * 10) / 10;
  });

  return newPrices;
}

/**
 * Calculate trade route value
 */
export function calculateTradeRouteValue(
  resource: ResourceType,
  amountPerTurn: number,
  marketPrice: number
): number {
  return amountPerTurn * marketPrice;
}

/**
 * Determine if an economic event should trigger
 */
export function shouldTriggerEconomicEvent(
  currentTurn: number,
  lastEventTurn: number,
  activeEvents: EconomicEvent[]
): EconomicEvent | null {
  // Don't trigger if too many active events
  if (activeEvents.length >= 2) {
    return null;
  }

  // Don't trigger events too frequently (minimum 5 turn gap)
  if (currentTurn - lastEventTurn < 5) {
    return null;
  }

  // 15% chance per turn after minimum gap
  if (Math.random() > 0.15) {
    return null;
  }

  // Select random event
  const events = Object.values(ECONOMIC_EVENTS);
  return events[Math.floor(Math.random() * events.length)];
}

/**
 * Calculate economic victory requirements with trade bonuses
 */
export function calculateEconomicVictoryProgress(
  cities: number,
  tradeRoutes: TradeRoute[],
  resourceBalance: number // Positive if gaining more than spending
): {
  progress: number;
  requirements: {
    cities: { current: number; required: number; met: boolean };
    tradeRoutes: { current: number; required: number; met: boolean };
    balance: { current: number; required: number; met: boolean };
  };
} {
  const requiredCities = 10;
  const requiredTradeRoutes = 4;
  const requiredBalance = 50; // Must be gaining 50+ resources/turn

  const citiesMet = cities >= requiredCities;
  const tradeRoutesMet = tradeRoutes.length >= requiredTradeRoutes;
  const balanceMet = resourceBalance >= requiredBalance;

  const progress =
    ((citiesMet ? 1 : cities / requiredCities) +
      (tradeRoutesMet ? 1 : tradeRoutes.length / requiredTradeRoutes) +
      (balanceMet ? 1 : Math.max(0, resourceBalance / requiredBalance))) /
    3;

  return {
    progress: Math.round(progress * 100),
    requirements: {
      cities: {
        current: cities,
        required: requiredCities,
        met: citiesMet,
      },
      tradeRoutes: {
        current: tradeRoutes.length,
        required: requiredTradeRoutes,
        met: tradeRoutesMet,
      },
      balance: {
        current: resourceBalance,
        required: requiredBalance,
        met: balanceMet,
      },
    },
  };
}
