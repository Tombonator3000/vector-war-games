/**
 * Phase 3: Economic Depth Types
 *
 * Hearts of Iron IV-inspired economic systems:
 * - Enhanced Trade System (Import/Export)
 * - Resource Refinement (Convert raw materials)
 * - Infrastructure Development (Economic buildings)
 */

import type { StrategyResourceType } from './territorialResources';
import type { ProductionItemType } from './production';

// ============================================================================
// ENHANCED TRADE SYSTEM
// ============================================================================

export type TradeAgreementType =
  | 'bilateral'      // Two-nation trade
  | 'multilateral'   // Multiple nations
  | 'trade_bloc'     // Regional trade agreement
  | 'embargo';       // Trade restrictions

export type TradeRouteStatus =
  | 'active'
  | 'disrupted'      // Combat or events affecting route
  | 'embargoed'      // Political restrictions
  | 'suspended';     // Temporarily halted

export interface TradeAgreement {
  id: string;
  name: string;
  type: TradeAgreementType;
  participantIds: string[];  // Nation IDs

  // Terms
  duration: number;           // Turns remaining
  totalDuration: number;      // Original duration
  createdTurn: number;

  // Trade terms
  resourceExchanges: TradeExchange[];
  tariffs: Partial<Record<StrategyResourceType, number>>;  // Percentage

  // Benefits
  tradeEfficiencyBonus: number;  // 0-0.3 (up to 30% reduction in costs)
  diplomaticBonus: number;        // +influence between members

  // Status
  status: 'proposed' | 'active' | 'expired' | 'cancelled';
  canRenegotiate: boolean;
  nextRenegotiationTurn?: number;
}

export interface TradeExchange {
  fromNationId: string;
  toNationId: string;
  resource: StrategyResourceType;
  amountPerTurn: number;

  // Payment
  pricePerUnit?: number;        // In production credits
  barterResource?: StrategyResourceType;  // Alternative to payment
  barterAmount?: number;
}

export interface EnhancedTradeRoute {
  id: string;
  agreementId: string;
  fromNationId: string;
  toNationId: string;

  // Route details
  resourceType: StrategyResourceType;
  amountPerTurn: number;
  routePath: string[];          // Territory IDs the route passes through

  // Costs & efficiency
  maintenanceCost: number;      // Per turn cost
  efficiency: number;           // 0-1, affected by infrastructure
  vulnerabilityScore: number;   // 0-100, chance of disruption

  // Status
  status: TradeRouteStatus;
  turnsDisrupted: number;
  lastDisruptionReason?: string;

  // Protection
  navalProtection: number;      // Naval units assigned
  airCover: number;             // Air units assigned

  // Stats
  totalResourcesTransferred: number;
  totalProfitGenerated: number;
  createdTurn: number;
}

export interface TradeHub {
  territoryId: string;
  nationId: string;
  level: number;                // 1-5

  // Benefits
  tradeEfficiencyBonus: number; // Reduces route maintenance
  routeCapacity: number;        // Max routes through this hub
  activeRoutes: string[];       // Route IDs

  // Costs
  maintenanceCost: number;
  upgradeCost: number;
}

export interface TradeProposal {
  id: string;
  proposerId: string;
  targetNationId: string;

  // Offer
  offering: Partial<Record<StrategyResourceType, number>>;
  requesting: Partial<Record<StrategyResourceType, number>>;
  duration: number;
  pricePerTurn?: number;

  // Status
  status: 'pending' | 'accepted' | 'rejected' | 'countered';
  counterOffer?: {
    offering: Partial<Record<StrategyResourceType, number>>;
    requesting: Partial<Record<StrategyResourceType, number>>;
    pricePerTurn?: number;
  };

  // Metadata
  proposedTurn: number;
  expiresAtTurn: number;
  rejectionReason?: string;
}

export interface EconomicSanction {
  id: string;
  issuingNationId: string;
  targetNationId: string;

  // Sanction details
  type: 'trade_embargo' | 'resource_restriction' | 'financial_sanctions' | 'full_embargo';
  restrictedResources: StrategyResourceType[];

  // Effects
  tradeReduction: number;       // Percentage reduction (0-100)
  productionPenalty: number;    // Target's production penalty
  diplomaticCost: number;       // Cost to maintain

  // Status
  duration: number;
  startedTurn: number;
  canBeLifted: boolean;

  // Support
  supportingNations: string[];  // Other nations enforcing
  internationalSupport: number; // 0-100, affects effectiveness
}

// ============================================================================
// RESOURCE REFINEMENT SYSTEM
// ============================================================================

export type RefineryType =
  | 'oil_refinery'       // Oil → Fuel (boosts military)
  | 'uranium_enrichment' // Uranium → Enriched Uranium (better nukes)
  | 'rare_earth_processing' // Rare Earths → Advanced Materials (tech boost)
  | 'steel_mill'         // Iron + Coal → Steel (production)
  | 'electronics_factory' // Rare Earths + Steel → Electronics (cyber/tech)
  | 'food_processing';   // Food → Processed Food (longer storage, trade bonus)

export type RefinedResourceType =
  | 'fuel'
  | 'enriched_uranium'
  | 'advanced_materials'
  | 'steel'
  | 'electronics'
  | 'processed_food';

export interface Refinery {
  id: string;
  nationId: string;
  territoryId: string;
  type: RefineryType;
  level: number;               // 1-5

  // Capacity
  maxThroughput: number;       // Max resources per turn
  currentThroughput: number;   // Currently refining
  efficiency: number;          // 0-1, improves with tech

  // Production
  inputResources: Partial<Record<StrategyResourceType | 'iron' | 'coal', number>>;
  outputResource: RefinedResourceType;
  outputAmount: number;        // Per turn
  conversionRatio: number;     // Input:Output ratio

  // Status
  isActive: boolean;
  isPaused: boolean;
  maintenanceCost: number;

  // Upgrades
  upgradeCost: number;
  upgradeTime: number;         // Turns to upgrade

  // Stats
  totalResourcesRefined: number;
  turnsOperating: number;
  createdTurn: number;
}

export interface RefinedResourceStockpile {
  fuel: number;
  enriched_uranium: number;
  advanced_materials: number;
  steel: number;
  electronics: number;
  processed_food: number;
}

export interface RefinementRecipe {
  refineryType: RefineryType;
  inputs: Partial<Record<StrategyResourceType | 'iron' | 'coal', number>>;
  output: {
    resource: RefinedResourceType;
    amount: number;
  };
  conversionTime: number;      // Turns per batch
  efficiencyRequired: number;  // Minimum efficiency (0-1)
}

export interface RefinementBonus {
  resourceType: RefinedResourceType;
  bonusType:
    | 'production_boost'
    | 'military_effectiveness'
    | 'research_speed'
    | 'nuclear_damage'
    | 'cyber_attack'
    | 'morale_boost';
  amount: number;              // Percentage or flat bonus
  duration: number;            // Turns (-1 for permanent)
}

// ============================================================================
// INFRASTRUCTURE DEVELOPMENT
// ============================================================================

export type EconomicInfrastructureType =
  | 'trade_port'          // Enables overseas trade routes
  | 'trade_hub'           // Central trade node
  | 'refinery_complex'    // Houses multiple refineries
  | 'economic_zone'       // Special economic zone (+production)
  | 'stock_exchange'      // Financial center (+gold generation)
  | 'industrial_park'     // Manufacturing cluster (+production efficiency)
  | 'logistics_center'    // Reduces trade route costs
  | 'customs_office'      // Increases tariff revenue
  | 'commodity_exchange'; // Resource market access

export interface EconomicInfrastructure {
  id: string;
  nationId: string;
  territoryId: string;
  type: EconomicInfrastructureType;
  name: string;
  level: number;            // 1-5

  // Effects
  effects: InfrastructureEffect[];

  // Capacity
  capacity: number;         // Generic capacity (routes, refineries, etc.)
  currentUsage: number;

  // Costs
  constructionCost: number; // Initial cost
  maintenanceCost: number;  // Per turn
  upgradeCost: number;      // To next level
  upgradeTime: number;      // Turns to upgrade

  // Status
  status: 'under_construction' | 'operational' | 'damaged' | 'destroyed';
  constructionProgress: number; // 0-100%
  damagePenalty: number;    // 0-1, reduces effectiveness

  // Stats
  totalRevenue: number;     // Total gold/resources generated
  turnsOperating: number;
  createdTurn: number;
}

export interface InfrastructureEffect {
  type:
    | 'trade_capacity'      // +max trade routes
    | 'trade_efficiency'    // Reduce route costs
    | 'refinery_capacity'   // +max refineries
    | 'production_boost'    // +production per turn
    | 'gold_generation'     // +gold per turn
    | 'resource_generation' // +specific resource
    | 'tariff_revenue'      // +gold from trade
    | 'market_access';      // Better prices

  amount: number;
  resourceType?: StrategyResourceType | RefinedResourceType;
}

export interface EconomicZone {
  id: string;
  nationId: string;
  name: string;
  territoryIds: string[];   // Multiple territories

  // Benefits (for entire zone)
  productionBonus: number;  // Percentage
  tradeBonus: number;       // Percentage
  resourceBonus: Partial<Record<StrategyResourceType, number>>;

  // Requirements
  minInfrastructure: number; // Each territory needs this level
  minConnectivity: number;   // How well connected territories are

  // Status
  isActive: boolean;
  turnsActive: number;
  totalInvestment: number;  // Total cost invested
}

// ============================================================================
// ECONOMIC VICTORY & SCORING
// ============================================================================

export interface EconomicPower {
  nationId: string;

  // Scores
  tradeScore: number;       // Based on trade volume & diversity
  refinementScore: number;  // Refined resources produced
  infrastructureScore: number; // Quality of economic infrastructure
  totalScore: number;

  // Rankings
  globalRank: number;       // 1 = strongest economy
  regionalRank: number;

  // Metrics
  tradeVolume: number;      // Total resources traded per turn
  refineryOutput: number;   // Total refined resources per turn
  infrastructureValue: number; // Total value of infrastructure
  goldReserves: number;

  // Victory progress
  economicVictoryProgress: number; // 0-100%
}

export interface EconomicVictoryRequirement {
  name: string;
  description: string;

  requirements: {
    tradeRoutes?: number;
    tradeVolume?: number;
    refineries?: number;
    infrastructure?: number;
    goldReserves?: number;
    economicZones?: number;
  };

  currentProgress: Partial<{
    tradeRoutes: number;
    tradeVolume: number;
    refineries: number;
    infrastructure: number;
    goldReserves: number;
    economicZones: number;
  }>;

  isCompleted: boolean;
}

// ============================================================================
// ECONOMIC EVENTS & CRISES
// ============================================================================

export type EconomicCrisisType =
  | 'trade_war'           // Nations impose tariffs
  | 'resource_cartel'     // Resource price manipulation
  | 'currency_crisis'     // Gold/credit instability
  | 'supply_shock'        // Major resource shortage
  | 'debt_crisis'         // Nation overextended
  | 'market_speculation'  // Resource price volatility
  | 'infrastructure_collapse'; // Major infrastructure failure

export interface EconomicCrisis {
  id: string;
  type: EconomicCrisisType;
  title: string;
  description: string;

  // Affected nations
  affectedNations: string[];
  epicenter?: string;       // Origin nation

  // Effects
  duration: number;
  effects: {
    tradePenalty?: number;
    productionPenalty?: number;
    resourcePriceMultipliers?: Partial<Record<StrategyResourceType, number>>;
    refineryEfficiency?: number;
    maintenanceCostMultiplier?: number;
  };

  // Resolution
  canBeResolved: boolean;
  resolutionCost?: number;  // Political power or gold
  resolutionActions?: string[]; // Required actions

  // Status
  startedTurn: number;
  turnsRemaining: number;
  severity: number;         // 0-100
}

// ============================================================================
// GAME STATE INTEGRATION
// ============================================================================

export interface EconomicDepthState {
  // Trade
  tradeAgreements: TradeAgreement[];
  tradeRoutes: EnhancedTradeRoute[];
  tradeHubs: TradeHub[];
  tradeProposals: TradeProposal[];
  economicSanctions: EconomicSanction[];

  // Refinement
  refineries: Refinery[];
  refinedStockpiles: Map<string, RefinedResourceStockpile>; // nationId -> stockpile

  // Infrastructure
  economicInfrastructure: EconomicInfrastructure[];
  economicZones: EconomicZone[];

  // Scoring
  economicPower: Map<string, EconomicPower>; // nationId -> power

  // Events
  activeEconomicCrises: EconomicCrisis[];
  crisisHistory: EconomicCrisis[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const REFINERY_RECIPES: Record<RefineryType, RefinementRecipe> = {
  oil_refinery: {
    refineryType: 'oil_refinery',
    inputs: { oil: 10 },
    output: { resource: 'fuel', amount: 8 },
    conversionTime: 1,
    efficiencyRequired: 0.5,
  },
  uranium_enrichment: {
    refineryType: 'uranium_enrichment',
    inputs: { uranium: 5 },
    output: { resource: 'enriched_uranium', amount: 3 },
    conversionTime: 2,
    efficiencyRequired: 0.7,
  },
  rare_earth_processing: {
    refineryType: 'rare_earth_processing',
    inputs: { rare_earths: 8 },
    output: { resource: 'advanced_materials', amount: 6 },
    conversionTime: 1,
    efficiencyRequired: 0.6,
  },
  steel_mill: {
    refineryType: 'steel_mill',
    inputs: { iron: 10, coal: 5 },
    output: { resource: 'steel', amount: 12 },
    conversionTime: 1,
    efficiencyRequired: 0.5,
  },
  electronics_factory: {
    refineryType: 'electronics_factory',
    inputs: { rare_earths: 5, steel: 8 },
    output: { resource: 'electronics', amount: 10 },
    conversionTime: 2,
    efficiencyRequired: 0.8,
  },
  food_processing: {
    refineryType: 'food_processing',
    inputs: { food: 15 },
    output: { resource: 'processed_food', amount: 12 },
    conversionTime: 1,
    efficiencyRequired: 0.4,
  },
};

export const REFINED_RESOURCE_BONUSES: Record<RefinedResourceType, RefinementBonus> = {
  fuel: {
    resourceType: 'fuel',
    bonusType: 'military_effectiveness',
    amount: 15, // +15% combat effectiveness
    duration: -1,
  },
  enriched_uranium: {
    resourceType: 'enriched_uranium',
    bonusType: 'nuclear_damage',
    amount: 25, // +25% nuclear damage
    duration: -1,
  },
  advanced_materials: {
    resourceType: 'advanced_materials',
    bonusType: 'research_speed',
    amount: 20, // +20% research speed
    duration: -1,
  },
  steel: {
    resourceType: 'steel',
    bonusType: 'production_boost',
    amount: 15, // +15% production
    duration: -1,
  },
  electronics: {
    resourceType: 'electronics',
    bonusType: 'cyber_attack',
    amount: 30, // +30% cyber attack
    duration: -1,
  },
  processed_food: {
    resourceType: 'processed_food',
    bonusType: 'morale_boost',
    amount: 10, // +10 morale
    duration: -1,
  },
};

export const INFRASTRUCTURE_COSTS: Record<EconomicInfrastructureType, {
  baseCost: number;
  baseMaintenanceCost: number;
  constructionTime: number;
  baseCapacity: number;
}> = {
  trade_port: {
    baseCost: 150,
    baseMaintenanceCost: 20,
    constructionTime: 8,
    baseCapacity: 5, // 5 trade routes
  },
  trade_hub: {
    baseCost: 100,
    baseMaintenanceCost: 15,
    constructionTime: 5,
    baseCapacity: 8,
  },
  refinery_complex: {
    baseCost: 200,
    baseMaintenanceCost: 25,
    constructionTime: 10,
    baseCapacity: 4, // 4 refineries
  },
  economic_zone: {
    baseCost: 250,
    baseMaintenanceCost: 30,
    constructionTime: 12,
    baseCapacity: 1,
  },
  stock_exchange: {
    baseCost: 180,
    baseMaintenanceCost: 22,
    constructionTime: 7,
    baseCapacity: 1,
  },
  industrial_park: {
    baseCost: 220,
    baseMaintenanceCost: 28,
    constructionTime: 10,
    baseCapacity: 1,
  },
  logistics_center: {
    baseCost: 120,
    baseMaintenanceCost: 18,
    constructionTime: 6,
    baseCapacity: 10, // Affects 10 routes
  },
  customs_office: {
    baseCost: 80,
    baseMaintenanceCost: 12,
    constructionTime: 4,
    baseCapacity: 1,
  },
  commodity_exchange: {
    baseCost: 160,
    baseMaintenanceCost: 20,
    constructionTime: 7,
    baseCapacity: 1,
  },
};

export const ECONOMIC_VICTORY_REQUIREMENTS: EconomicVictoryRequirement = {
  name: 'Economic Dominance',
  description: 'Achieve economic supremacy through trade, refinement, and infrastructure',
  requirements: {
    tradeRoutes: 15,
    tradeVolume: 500,
    refineries: 10,
    infrastructure: 20,
    goldReserves: 5000,
    economicZones: 3,
  },
  currentProgress: {},
  isCompleted: false,
};
