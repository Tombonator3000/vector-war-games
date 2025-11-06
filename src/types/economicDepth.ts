import type { Dispatch, SetStateAction } from "react";

export type NationId = string;

export interface NationSummary {
  id: NationId;
  name: string;
  economicScore?: number;
}

export interface TradeGood {
  id: string;
  name: string;
  category: "raw" | "refined" | "manufactured";
}

export interface TradeAgreement {
  id: string;
  participants: NationId[];
  terms: string;
  duration: number;
  turnsRemaining: number;
  efficiencyModifier: number;
}

export interface TradeRoute {
  id: string;
  origin: NationId;
  destination: NationId;
  goodId: string;
  capacity: number;
  efficiency: number;
  disruptionRisk: number;
  protection: {
    naval: number;
    air: number;
  };
}

export interface TradeProposal {
  id: string;
  proposer: NationId;
  recipients: NationId[];
  goodId: string;
  capacity: number;
  turns: number;
  acceptanceChance: number;
  message?: string;
}

export interface EconomicSanction {
  id: string;
  target: NationId;
  imposingNations: NationId[];
  restrictions: string;
  severity: number;
  turnsRemaining?: number;
}

export interface TradeStatistics {
  totalCapacity: number;
  averageEfficiency: number;
  disruptedRoutes: number;
  activeAgreements: number;
  sanctions: number;
}

export interface Refinery {
  id: string;
  owner: NationId;
  type: RefineryType;
  level: number;
  progress: number;
  efficiency: number;
  inputStockpile: number;
  outputStockpile: number;
  turnsUntilCompletion?: number;
}

export type RefineryType =
  | "oil"
  | "uranium"
  | "rareEarths"
  | "steel"
  | "electronics"
  | "food";

export interface RefineryConversionRate {
  input: string[];
  output: string;
  baseYield: number;
  bonusDescription: string;
}

export interface RefinementOrder {
  id: string;
  refineryId: string;
  turnsRequired: number;
  turnsRemaining: number;
  inputConsumed: number;
  outputProduced: number;
}

export interface RefinementBonus {
  id: string;
  description: string;
  value: number;
}

export interface BuildingProject {
  id: string;
  owner: NationId;
  type: EconomicBuildingType;
  level: number;
  progress: number;
  turnsRequired: number;
  durability: number;
  isDamaged: boolean;
}

export type EconomicBuildingType =
  | "tradePort"
  | "tradeHub"
  | "logisticsCenter"
  | "refineryComplex"
  | "industrialPark"
  | "stockExchange"
  | "commodityExchange"
  | "customsOffice"
  | "economicZone";

export interface EconomicZone {
  id: string;
  name: string;
  territories: string[];
  owner: NationId;
  bonus: number;
  maintenanceCost: number;
}

export interface InfrastructureStatistics {
  averageLevel: number;
  damagedStructures: number;
  totalMaintenance: number;
  activeZones: number;
}

export interface EconomicDepthSnapshot {
  trade: TradeStatistics;
  refinement: {
    totalOutput: number;
    activeRefineries: number;
    bonuses: RefinementBonus[];
  };
  infrastructure: InfrastructureStatistics;
  economicPower: number;
}

export interface UseEnhancedTradeSystemParams {
  nations: NationSummary[];
  initialRoutes?: TradeRoute[];
  initialAgreements?: TradeAgreement[];
  initialSanctions?: EconomicSanction[];
  goods?: TradeGood[];
}

export interface EnhancedTradeSystem {
  routes: TradeRoute[];
  agreements: TradeAgreement[];
  proposals: TradeProposal[];
  sanctions: EconomicSanction[];
  goods: TradeGood[];
  statistics: TradeStatistics;
  proposeTrade: (proposal: TradeProposal) => void;
  withdrawProposal: (proposalId: string) => void;
  finalizeTrade: (proposalId: string, route: TradeRoute, agreement: TradeAgreement) => void;
  updateRouteEfficiency: (routeId: string, efficiency: number) => void;
  protectRoute: (routeId: string, naval: number, air: number) => void;
  disruptRoute: (routeId: string, disruption: number) => void;
  imposeSanction: (sanction: EconomicSanction) => void;
  liftSanction: (sanctionId: string) => void;
  processTurn: () => void;
}

export interface UseResourceRefinementParams {
  nations: NationSummary[];
  initialRefineries?: Refinery[];
  initialOrders?: RefinementOrder[];
  conversionRates?: Partial<Record<RefineryType, RefineryConversionRate>>;
}

export interface ResourceRefinementSystem {
  refineries: Refinery[];
  orders: RefinementOrder[];
  conversionRates: Record<RefineryType, RefineryConversionRate>;
  bonuses: RefinementBonus[];
  totalOutput: number;
  addRefinery: (refinery: Refinery) => void;
  upgradeRefinery: (refineryId: string) => void;
  scheduleOrder: (order: RefinementOrder) => void;
  cancelOrder: (orderId: string) => void;
  processTurn: () => void;
  repairRefinery: (refineryId: string) => void;
}

export interface UseEconomicInfrastructureParams {
  nations: NationSummary[];
  initialProjects?: BuildingProject[];
  initialZones?: EconomicZone[];
}

export interface EconomicInfrastructureSystem {
  projects: BuildingProject[];
  zones: EconomicZone[];
  statistics: InfrastructureStatistics;
  queueProject: (project: BuildingProject) => void;
  progressConstruction: () => void;
  repairProject: (projectId: string) => void;
  createZone: (zone: EconomicZone) => void;
  disbandZone: (zoneId: string) => void;
}

export interface UseEconomicDepthParams {
  nations: NationSummary[];
  currentTurn: number;
  focusNationId?: NationId;
  tradeParams?: UseEnhancedTradeSystemParams;
  refinementParams?: UseResourceRefinementParams;
  infrastructureParams?: UseEconomicInfrastructureParams;
}

export interface EconomicDepthSystem {
  trade: EnhancedTradeSystem;
  refinement: ResourceRefinementSystem;
  infrastructure: EconomicInfrastructureSystem;
  snapshot: EconomicDepthSnapshot;
  focusNationId?: NationId;
  lastProcessedTurn: number;
  processEconomicTurn: () => void;
  calculateEconomicPower: () => number;
  getEconomicRecommendations: (nationId: NationId) => string[];
  setFocusNationId: Dispatch<SetStateAction<NationId | undefined>>;
}
