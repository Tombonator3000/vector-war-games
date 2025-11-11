/**
 * Production Queue System Types
 *
 * Hearts of Iron IV-inspired production management system.
 * Players queue up production orders that take multiple turns to complete.
 */

export type ProductionItemType =
  | 'icbm'
  | 'slbm'
  | 'army'
  | 'air_wing'
  | 'naval_fleet'
  | 'abm_system'
  | 'radar_station'
  | 'bunker'
  | 'factory'
  | 'research_lab'
  | 'intel_facility'
  | 'nuclear_submarine'
  | 'satellite'
  | 'bio_facility'
  | 'cyber_center';

export type ProductionCategory = 'military' | 'infrastructure' | 'special';

export interface ResourceCosts {
  production: number; // Base production cost
  uranium?: number;
  intel?: number;
}

export interface ProductionItem {
  id: string;
  type: ProductionItemType;
  name: string;
  description: string;
  category: ProductionCategory;
  icon: string;

  // Costs
  totalCost: number; // Total production points needed
  resourceCosts: ResourceCosts;

  // Progress
  progress: number; // 0-100%
  turnsToComplete: number; // Original estimated turns
  turnsRemaining: number; // Turns left

  // Metadata
  startedTurn: number;
  priorityLevel: number; // 1-5, affects resource allocation
}

export interface ProductionLine {
  id: string;
  nationId: string;
  lineNumber: number; // 1-15
  currentItem: ProductionItem | null;
  efficiency: number; // 50-100%, ramps up over time
  isActive: boolean;
  isPaused: boolean;
}

export interface ProductionQueue {
  nationId: string;
  lines: ProductionLine[];
  maxLines: number; // Default 5, max 15
  queuedItems: ProductionItem[]; // Items waiting for free line
}

export interface ProductionCapacity {
  nationId: string;
  baseProduction: number; // From territories
  bonusProduction: number; // From focuses, decisions
  totalProduction: number; // Base + bonus
  productionUsed: number; // Currently allocated
  productionAvailable: number; // Remaining this turn
}

export interface ProductionTemplate {
  type: ProductionItemType;
  name: string;
  description: string;
  category: ProductionCategory;
  icon: string;
  baseTurnsToComplete: number;
  resourceCosts: ResourceCosts;

  // Requirements
  requiresResearch?: string[]; // Tech IDs
  requiresFocus?: string[]; // Focus IDs
  requiresBuilding?: string[]; // Building type IDs
  minTurn?: number; // Era requirement

  // Unlocks
  unlocks?: string; // What this produces (building type, unit type, etc.)

  // Effects on completion
  onComplete?: (nationId: string) => ProductionCompletionEffect;
}

export interface ProductionCompletionEffect {
  type:
    | 'add_unit'
    | 'add_building'
    | 'add_capacity'
    | 'unlock_tech'
    | 'grant_bonus'
    | 'trigger_event';
  payload: any;
  message: string;
}

export interface ProductionState {
  queues: Map<string, ProductionQueue>; // nationId -> queue
  capacities: Map<string, ProductionCapacity>; // nationId -> capacity
  completedItems: ProductionCompletionLog[];
}

export interface ProductionCompletionLog {
  nationId: string;
  itemType: ProductionItemType;
  itemName: string;
  completedTurn: number;
  effect: ProductionCompletionEffect;
}

// Helper type for production allocation
export interface ProductionAllocation {
  lineId: string;
  itemId: string;
  allocatedProduction: number;
  efficiency: number;
  progressThisTurn: number; // Percentage
}
