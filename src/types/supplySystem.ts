/**
 * Supply System Types
 *
 * Hearts of Iron IV-inspired logistics and supply management.
 * Units require supply to operate effectively, supply flows from depots through infrastructure.
 */

export type SupplySourceType = 'capital' | 'depot' | 'port' | 'airbase';

export type InfrastructureLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface SupplySource {
  id: string;
  nationId: string;
  type: SupplySourceType;
  territoryId: string;

  // Supply capacity
  baseSupply: number;
  bonusSupply: number;
  totalSupply: number;

  // Distribution
  supplyUsed: number;
  supplyAvailable: number;
  supplyRange: number; // How many territories away supply can reach

  // Status
  isActive: boolean;
  isDamaged: boolean;
  damageLevel: number; // 0-100%, reduces capacity

  // Upgrades
  level: number; // 1-5, increases capacity
  upgradeProgress: number; // If being upgraded
}

export interface Territory {
  id: string;
  controllingNationId: string | null;

  // Infrastructure
  infrastructureLevel: InfrastructureLevel; // Affects supply flow
  hasPort: boolean;
  hasAirbase: boolean;
  hasDepot: boolean;

  // Supply state
  supplyCapacity: number; // Based on infrastructure
  supplyDemand: number; // From stationed units
  currentSupply: number; // Available supply
  supplyStatus: 'oversupplied' | 'adequate' | 'low' | 'critical' | 'none';

  // Supply sources
  connectedSupplySources: string[]; // IDs of supply sources reaching here
  supplyDistance: number; // Distance to nearest supply source

  // Attrition
  attritionLevel: number; // 0-100%, damage to units without supply
  stationedUnits: StationedUnitSummary[]; // Units currently drawing supply
}

export interface StationedUnitSummary {
  id: string;
  name: string;
}

export interface SupplyRoute {
  id: string;
  nationId: string;
  fromSourceId: string;
  toTerritoryId: string;

  // Route quality
  distance: number; // Number of territories
  infrastructureQuality: number; // Average infrastructure along route
  efficiency: number; // 0-100%, how much supply reaches destination

  // Status
  isOpen: boolean; // Can be blocked by enemy action
  isContested: boolean; // Enemy units along route
  blockingNationId?: string; // Nation blocking the route

  // Flow
  supplyFlowing: number; // Amount of supply using this route
}

export interface SupplyState {
  sources: Map<string, SupplySource>; // sourceId -> source
  territories: Map<string, Territory>; // territoryId -> territory
  routes: Map<string, SupplyRoute>; // routeId -> route

  // Global modifiers
  globalSupplyModifier: number; // From focuses, decisions
  winterPenalty: number; // Seasonal supply penalties
  overseasSupplyPenalty: number; // Penalty for cross-water supply
}

export interface SupplyDeficit {
  nationId: string;
  territoryId: string;
  territoryName: string;
  unitsAffected: number;
  supplyShortage: number; // Amount under demand
  attritionPerTurn: number; // Damage units take
  recommendedAction: string;
}

export interface SupplyNetwork {
  nationId: string;
  totalSupplyCapacity: number;
  totalSupplyDemand: number;
  supplyBalance: number; // Capacity - demand
  supplySources: SupplySource[];
  deficits: SupplyDeficit[];
  efficiency: number; // 0-100%, overall network efficiency
}

// Infrastructure construction
export interface InfrastructureProject {
  id: string;
  territoryId: string;
  nationId: string;
  type: 'infrastructure' | 'depot' | 'port' | 'airbase';

  // Progress
  progress: number; // 0-100%
  turnsRemaining: number;
  productionCost: number;

  // Effects
  currentLevel?: InfrastructureLevel;
  targetLevel?: InfrastructureLevel;
}

// Attrition effects
export interface AttritionEffect {
  unitId: string;
  unitName: string;
  territoryId: string;
  attritionType: 'supply' | 'weather' | 'terrain';
  damagePerTurn: number; // 0-10% per turn
  organizationLoss: number; // 0-20% per turn
  totalTurnsInAttrition: number;
}
