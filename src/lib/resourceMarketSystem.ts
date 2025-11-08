/**
 * Resource Market Fluctuation System
 *
 * Dynamic pricing and market events affecting resource values
 */

import type { GameState, Nation } from '@/types/game';
import type { StrategyResourceType } from '@/types/territorialResources';
import type { SeededRandom } from './seededRandom';

/**
 * Resource market state
 */
export interface ResourceMarket {
  prices: Record<StrategyResourceType, number>;     // Current market prices
  basePrices: Record<StrategyResourceType, number>; // Base reference prices
  volatility: number;                               // Market volatility (0-1)
  trend: Record<StrategyResourceType, number>;      // Price trend (-1 to 1)
  history: MarketHistoryEntry[];                    // Price history
  activeEvent?: MarketEvent;                        // Current market event
  eventDuration: number;                            // Turns remaining for event
}

/**
 * Market history entry
 */
export interface MarketHistoryEntry {
  turn: number;
  prices: Record<StrategyResourceType, number>;
}

/**
 * Market event affecting resource prices
 */
export interface MarketEvent {
  id: string;
  name: string;
  description: string;
  duration: number;
  priceModifiers: Partial<Record<StrategyResourceType, number>>;  // Multipliers
  globalModifier?: number;                                         // Applies to all resources
  volatilityChange?: number;                                       // Change in market volatility
}

/**
 * Market event types
 */
export const MARKET_EVENTS: MarketEvent[] = [
  {
    id: 'oil_boom',
    name: 'Oil Boom',
    description: 'New oil reserves discovered! Oil prices plummet.',
    duration: 5,
    priceModifiers: { oil: 0.6 },
  },
  {
    id: 'oil_crisis',
    name: 'Oil Crisis',
    description: 'Major oil producer disrupted. Prices surge!',
    duration: 4,
    priceModifiers: { oil: 2.5 },
    volatilityChange: 0.3,
  },
  {
    id: 'rare_earth_monopoly',
    name: 'Rare Earth Monopoly',
    description: 'Dominant producer restricts rare earth exports.',
    duration: 6,
    priceModifiers: { rare_earths: 3.0 },
  },
  {
    id: 'food_shortage',
    name: 'Global Famine',
    description: 'Crop failures worldwide. Food prices skyrocket!',
    duration: 5,
    priceModifiers: { food: 2.8 },
    volatilityChange: 0.4,
  },
  {
    id: 'uranium_glut',
    name: 'Uranium Oversupply',
    description: 'Multiple new uranium mines flood the market.',
    duration: 4,
    priceModifiers: { uranium: 0.5 },
  },
  {
    id: 'tech_breakthrough',
    name: 'Technology Breakthrough',
    description: 'Synthetic alternatives reduce demand for rare earths.',
    duration: 6,
    priceModifiers: { rare_earths: 0.4 },
  },
  {
    id: 'market_crash',
    name: 'Market Crash',
    description: 'Global economic panic. All resource prices collapse!',
    duration: 3,
    globalModifier: 0.5,
    volatilityChange: 0.5,
  },
  {
    id: 'wartime_economy',
    name: 'Wartime Economy',
    description: 'Conflict drives demand for all strategic resources.',
    duration: 7,
    globalModifier: 1.8,
    volatilityChange: 0.3,
  },
  {
    id: 'agricultural_revolution',
    name: 'Agricultural Revolution',
    description: 'GMO crops increase global food supply dramatically.',
    duration: 8,
    priceModifiers: { food: 0.3 },
  },
  {
    id: 'nuclear_renaissance',
    name: 'Nuclear Renaissance',
    description: 'Global nuclear power expansion drives uranium demand.',
    duration: 6,
    priceModifiers: { uranium: 2.2 },
  },
];

/**
 * Initialize resource market
 */
export function initializeResourceMarket(): ResourceMarket {
  const basePrices: Record<StrategyResourceType, number> = {
    oil: 10,
    uranium: 20,
    rare_earths: 15,
    food: 8,
  };

  return {
    prices: { ...basePrices },
    basePrices: { ...basePrices },
    volatility: 0.2,  // 20% base volatility
    trend: { oil: 0, uranium: 0, rare_earths: 0, food: 0 },
    history: [],
    eventDuration: 0,
  };
}

/**
 * Update market prices each turn
 */
export function updateResourceMarket(
  market: ResourceMarket,
  gameState: GameState,
  nations: Nation[],
  turn: number,
  rng: SeededRandom
): ResourceMarket {
  const updatedMarket = { ...market };

  // Record current prices in history (keep last 20 turns)
  updatedMarket.history = [
    ...market.history.slice(-19),
    { turn, prices: { ...market.prices } },
  ];

  // Check if market event should end
  if (updatedMarket.activeEvent && updatedMarket.eventDuration > 0) {
    updatedMarket.eventDuration--;
    if (updatedMarket.eventDuration === 0) {
      // Event ended
      updatedMarket.activeEvent = undefined;
      updatedMarket.volatility = Math.max(0.1, updatedMarket.volatility - 0.2);
    }
  }

  // Random chance for new market event (10% per turn if no active event)
  if (!updatedMarket.activeEvent && rng.next() < 0.10) {
    const event = rng.choice(MARKET_EVENTS);
    updatedMarket.activeEvent = event;
    updatedMarket.eventDuration = event.duration;
    if (event.volatilityChange) {
      updatedMarket.volatility = Math.min(1, updatedMarket.volatility + event.volatilityChange);
    }
  }

  // Calculate supply and demand factors
  const supplyDemand = calculateSupplyDemandFactors(nations, gameState);

  // Update prices for each resource
  (['oil', 'uranium', 'rare_earths', 'food'] as StrategyResourceType[]).forEach(resource => {
    let newPrice = market.prices[resource];

    // Apply supply/demand pressure
    const demandFactor = supplyDemand[resource];
    newPrice *= (1 + demandFactor * 0.1); // ±10% based on demand

    // Apply market volatility (random fluctuation)
    const randomChange = (rng.next() - 0.5) * 2 * market.volatility;
    newPrice *= (1 + randomChange * 0.15);

    // Apply trend momentum
    const trendInfluence = market.trend[resource] * 0.05;
    newPrice *= (1 + trendInfluence);

    // Apply market event modifiers
    if (updatedMarket.activeEvent) {
      if (updatedMarket.activeEvent.globalModifier) {
        newPrice *= updatedMarket.activeEvent.globalModifier;
      }
      if (updatedMarket.activeEvent.priceModifiers[resource]) {
        newPrice *= updatedMarket.activeEvent.priceModifiers[resource]!;
      }
    }

    // Clamp prices to reasonable bounds (20% to 500% of base)
    newPrice = Math.max(
      market.basePrices[resource] * 0.2,
      Math.min(market.basePrices[resource] * 5.0, newPrice)
    );

    updatedMarket.prices[resource] = newPrice;

    // Update trend based on price movement
    const priceChange = (newPrice - market.prices[resource]) / market.prices[resource];
    updatedMarket.trend[resource] = Math.max(-1, Math.min(1, priceChange * 5));
  });

  return updatedMarket;
}

/**
 * Calculate supply and demand factors based on game state
 */
function calculateSupplyDemandFactors(
  nations: Nation[],
  gameState: GameState
): Record<StrategyResourceType, number> {
  const factors: Record<StrategyResourceType, number> = {
    oil: 0,
    uranium: 0,
    rare_earths: 0,
    food: 0,
  };

  // Count total armies (oil demand)
  let totalArmies = 0;
  if (gameState.conventionalState?.territories) {
    Object.values(gameState.conventionalState.territories).forEach((t: any) => {
      totalArmies += t.armies || 0;
    });
  }
  factors.oil = Math.min(1, totalArmies / 100); // High demand if many armies

  // Count nuclear weapons (uranium demand)
  let totalWarheads = 0;
  nations.forEach(n => {
    if (n.warheads) {
      totalWarheads += Object.values(n.warheads).reduce((sum, count) => sum + count, 0);
    }
  });
  factors.uranium = Math.min(1, totalWarheads / 50);

  // Count research projects (rare earths demand)
  let activeResearch = nations.filter(n => n.researchQueue).length;
  factors.rare_earths = Math.min(1, activeResearch / 5);

  // Count population (food demand)
  let totalPopulation = nations.reduce((sum, n) => sum + n.population, 0);
  factors.food = Math.min(1, totalPopulation / 5000);

  return factors;
}

/**
 * Get resource trade price based on market
 */
export function getResourceTradePrice(
  resource: StrategyResourceType,
  amount: number,
  market: ResourceMarket
): number {
  const pricePerUnit = market.prices[resource];
  return Math.ceil(pricePerUnit * amount);
}

/**
 * Get market trend indicator
 */
export function getMarketTrendIndicator(trend: number): string {
  if (trend > 0.3) return '📈 Strong Uptrend';
  if (trend > 0.1) return '↗️ Rising';
  if (trend < -0.3) return '📉 Strong Downtrend';
  if (trend < -0.1) return '↘️ Falling';
  return '➡️ Stable';
}

/**
 * Get price change percentage from last turn
 */
export function getPriceChangePercent(
  resource: StrategyResourceType,
  market: ResourceMarket
): number {
  if (market.history.length < 2) return 0;

  const current = market.prices[resource];
  const previous = market.history[market.history.length - 1].prices[resource];

  return ((current - previous) / previous) * 100;
}
