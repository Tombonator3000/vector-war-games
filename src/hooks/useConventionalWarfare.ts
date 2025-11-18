import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { calculateMoraleRecruitmentModifier } from './useGovernance';
import { useRNG } from '@/contexts/RNGContext';
import { safeDivide, safeClamp } from '@/lib/safeMath';
import type { MilitaryTemplate } from '@/types/militaryTemplates';
import type { UseMilitaryTemplatesApi } from './useMilitaryTemplates';
import type { UseSupplySystemApi } from './useSupplySystem';
import type { Territory as SupplyTerritory } from '@/types/supplySystem';
import type { Treaty } from '@/types/game';
import {
  initializeResourceStockpile,
  spendStrategicResource,
} from '@/lib/territorialResourcesSystem';

export type ForceType = 'army' | 'navy' | 'air' | 'drone';

export interface ResourceCost {
  production?: number;
  intel?: number;
  uranium?: number;
  oil?: number;           // New: Oil requirement for military units
  rare_earths?: number;   // New: Rare earths for advanced units
}

export interface ConventionalUnitTemplate {
  id: string;
  type: ForceType;
  name: string;
  description: string;
  attack: number;
  defense: number;
  support: number;
  cost: ResourceCost;
  readinessImpact: number;
  requiresResearch?: string;
  armiesValue?: number;
}

export interface ConventionalUnitState {
  id: string;
  templateId: string;
  ownerId: string;
  label: string;
  readiness: number;
  experience: number;
  locationId: string | null;
  status: 'reserve' | 'deployed';
  armiesValue?: number;
}

export interface TerritoryState {
  id: string;
  name: string;
  region: string;
  type: 'land' | 'sea';
  anchorLat: number;
  anchorLon: number;
  controllingNationId: string | null;
  contestedBy: string[];
  strategicValue: number;
  productionBonus: number;
  instabilityModifier: number;
  conflictRisk: number;
  neighbors: string[];
  armies: number; // Total armies stationed (Risk-style)
  unitComposition: { // Track unit types for combat bonuses
    army: number;
    navy: number;
    air: number;
    drone: number;
  };
}

export interface StrengthExchangeLog {
  round: number;
  attackerStrength: number;
  defenderStrength: number;
  attackerLosses: number;
  defenderLosses: number;
  attackerRemaining: number;
  defenderRemaining: number;
}

export interface EngagementLogEntry {
  id: string;
  turn: number;
  territoryId: string;
  type: 'border' | 'proxy' | 'movement';
  outcome: 'attacker' | 'defender' | 'stalemate';
  summary: string;
  casualties: Record<string, number>;
  instabilityDelta: Record<string, number>;
  productionDelta: Record<string, number>;
  strengthExchanges?: StrengthExchangeLog[]; // Track each combat exchange in battle
  // Nation IDs involved in the engagement
  attackerNationId?: string;
  defenderNationId?: string;
  // Casualty counts for display
  attackerCasualties?: number;
  defenderCasualties?: number;
  // Number of combat rounds
  rounds?: number;
}

export interface NationConventionalProfile {
  readiness: number;
  reserve: number;
  professionalism: number;
  tradition: number;
  focus: ForceType;
  deployedUnits: string[];
}

export interface ReinforcementPool {
  turn: number;
  remaining: number;
}

export interface ConventionalState {
  templates: Record<string, ConventionalUnitTemplate>;
  units: Record<string, ConventionalUnitState>;
  territories: Record<string, TerritoryState>;
  logs: EngagementLogEntry[];
  reinforcementPools?: Record<string, ReinforcementPool>;
}

export interface ConventionalNationRef {
  id: string;
  name: string;
  production: number;
  intel?: number;
  uranium?: number;
  instability?: number;
  conventional?: NationConventionalProfile;
  controlledTerritories?: string[];
  morale?: number;
  researched?: Record<string, boolean>;
  unitAttackBonus?: number;
  unitDefenseBonus?: number;
  combinedArmsBonus?: number;
  relationships?: Record<string, number>;
  alliances?: string[];
  treaties?: Record<string, Treaty>;
  resourceStockpile?: {  // New: Resource stockpile for checking oil/rare earth availability
    oil: number;
    uranium: number;
    rare_earths: number;
    food: number;
  };
}

interface UseConventionalWarfareOptions {
  initialState?: ConventionalState;
  currentTurn: number;
  getNation: (id: string) => ConventionalNationRef | undefined;
  onStateChange?: (state: ConventionalState) => void;
  onConsumeAction?: () => void;
  onUpdateDisplay?: () => void;
  onDefconChange?: (delta: number) => void;
  onRelationshipChange?: (
    nationId1: string,
    nationId2: string,
    delta: number,
    reason: string,
    currentTurn: number
  ) => void;
  militaryTemplatesApi?: Pick<UseMilitaryTemplatesApi, 'getTemplate' | 'getTemplateStats'>;
  supplySystemApi?: Pick<UseSupplySystemApi, 'getTerritorySupply'>;
}

// Unit to armies conversion (Risk-style)
const UNIT_ARMIES: Record<ForceType, number> = {
  army: 5,  // Armored Corps = 5 armies
  navy: 4,  // Carrier Strike Group = 4 armies
  air: 3,   // Air Wing = 3 armies
  drone: 2, // Drone units = 2-4 armies (varies by type)
};

// Combat bonuses for unit types
const UNIT_COMBAT_BONUS: Record<ForceType, { attack: number; defense: number }> = {
  army: { attack: 0, defense: 0 },   // Standard
  navy: { attack: 0, defense: 1 },   // +1 to defense dice
  air: { attack: 1, defense: 0 },    // +1 to attack dice
  drone: { attack: 1, defense: 0 },  // +1 to attack dice (precision strikes)
};

const UNIT_TEMPLATES: ConventionalUnitTemplate[] = [
  {
    id: 'armored_corps',
    type: 'army',
    name: 'Armored Corps',
    description: 'Mechanised ground formation. Deploys 5 armies. Requires Oil.',
    attack: 7,
    defense: 5,
    support: 2,
    cost: { production: 12, oil: 5 },  // Now requires oil!
    readinessImpact: 6,
    requiresResearch: 'conventional_armored_doctrine',
  },
  {
    id: 'carrier_fleet',
    type: 'navy',
    name: 'Carrier Strike Group',
    description: 'Blue-water naval group. Deploys 4 armies with +1 defense dice bonus. Requires Oil and Uranium.',
    attack: 6,
    defense: 8,
    support: 3,
    cost: { production: 16, uranium: 2, oil: 6 },  // Requires oil!
    readinessImpact: 8,
    requiresResearch: 'conventional_carrier_battlegroups',
  },
  {
    id: 'air_wing',
    type: 'air',
    name: 'Expeditionary Air Wing',
    description: 'Long-range tactical aviation. Deploys 3 armies with +1 attack dice bonus. Requires Oil and Rare Earths.',
    attack: 8,
    defense: 4,
    support: 3,
    cost: { production: 14, intel: 4, oil: 4, rare_earths: 2 },  // Requires oil and rare earths!
    readinessImpact: 7,
    requiresResearch: 'conventional_expeditionary_airframes',
  },
  // ==================== DRONE UNITS ====================
  {
    id: 'recon_drone',
    type: 'drone',
    name: 'Reconnaissance Drone Squadron',
    description: 'Unmanned reconnaissance platforms. Deploys 2 armies with excellent support capabilities. Low cost alternative for intelligence gathering.',
    attack: 2,
    defense: 2,
    support: 5,
    cost: { production: 8, intel: 3, rare_earths: 2, oil: 1 },
    readinessImpact: 3,
    requiresResearch: 'conventional_uav_reconnaissance',
    armiesValue: 2,
  },
  {
    id: 'combat_drone',
    type: 'drone',
    name: 'Combat Drone Wing',
    description: 'Armed autonomous drones for precision strikes. Deploys 3 armies with good attack and +1 attack dice bonus. Vulnerable but cost-effective.',
    attack: 7,
    defense: 3,
    support: 2,
    cost: { production: 13, intel: 6, rare_earths: 5, oil: 3 },
    readinessImpact: 5,
    requiresResearch: 'conventional_combat_drones',
    armiesValue: 3,
  },
  {
    id: 'drone_swarm',
    type: 'drone',
    name: 'Autonomous Drone Swarm',
    description: 'AI-coordinated swarm platform. Deploys 4 armies with devastating attack power and swarm tactics. High rare earth requirement.',
    attack: 10,
    defense: 4,
    support: 1,
    cost: { production: 19, intel: 10, rare_earths: 10, oil: 5 },
    readinessImpact: 6,
    requiresResearch: 'conventional_drone_swarms',
    armiesValue: 4,
  },
];

type TemplateCombatProfile = {
  attack: number;
  defense: number;
  support: number;
};

type TerritoryCombatSnapshot = TemplateCombatProfile & { supplyModifier: number };

const convertHoIStatsToProfile = (stats: MilitaryTemplate['stats']): TemplateCombatProfile => {
  const offense = (stats.softAttack + stats.hardAttack) / 20 + stats.breakthrough / 30 + stats.reconnaissance / 40;
  const defence = stats.defense / 20 + stats.armor / 40 + stats.piercing / 30 + stats.recovery / 40;
  const support = stats.organization / 50 + stats.suppression / 40;
  return {
    attack: offense,
    defense: defence,
    support,
  };
};

const profileFromTemplate = (template: ConventionalUnitTemplate): TemplateCombatProfile => ({
  attack: template.attack + template.support * 0.5,
  defense: template.defense + template.support * 0.5,
  support: template.support,
});

const SUPPLY_STATUS_MODIFIERS: Record<SupplyTerritory['supplyStatus'], number> = {
  oversupplied: 1.15,
  adequate: 1,
  low: 0.85,
  critical: 0.6,
  none: 0.4,
};

const DEFAULT_TERRITORIES: Array<Omit<TerritoryState, 'contestedBy'> & { defaultOwner?: string }> = [
  {
    id: 'north_america',
    name: 'North American Theater',
    region: 'Western Hemisphere',
    type: 'land',
    anchorLat: 50,
    anchorLon: -100,
    controllingNationId: 'player',
    strategicValue: 5,
    productionBonus: 4,
    instabilityModifier: -8,
    conflictRisk: 10,
    neighbors: ['atlantic_corridor', 'arctic_circle'],
    armies: 5,
    unitComposition: { army: 5, navy: 0, air: 0, drone: 0 },
    defaultOwner: 'player',
  },
  {
    id: 'atlantic_corridor',
    name: 'North Atlantic Sea Lanes',
    region: 'Atlantic',
    type: 'sea',
    anchorLat: 45,
    anchorLon: -35,
    controllingNationId: 'player',
    strategicValue: 3,
    productionBonus: 2,
    instabilityModifier: -3,
    conflictRisk: 18,
    neighbors: ['north_america', 'eastern_bloc', 'arctic_circle'],
    armies: 0,
    unitComposition: { army: 0, navy: 0, air: 0, drone: 0 },
    defaultOwner: 'player',
  },
  {
    id: 'eastern_bloc',
    name: 'Eurasian Frontier',
    region: 'Europe & Siberia',
    type: 'land',
    anchorLat: 55,
    anchorLon: 45,
    controllingNationId: 'ai_0',
    strategicValue: 5,
    productionBonus: 3,
    instabilityModifier: -4,
    conflictRisk: 22,
    neighbors: ['atlantic_corridor', 'indo_pacific', 'arctic_circle'],
    armies: 5,
    unitComposition: { army: 5, navy: 0, air: 0, drone: 0 },
    defaultOwner: 'ai_0',
  },
  {
    id: 'indo_pacific',
    name: 'Indo-Pacific Rim',
    region: 'Pacific',
    type: 'sea',
    anchorLat: 8,
    anchorLon: 130,
    controllingNationId: 'ai_1',
    strategicValue: 4,
    productionBonus: 3,
    instabilityModifier: -2,
    conflictRisk: 20,
    neighbors: ['eastern_bloc', 'southern_front'],
    armies: 3,
    unitComposition: { army: 0, navy: 0, air: 3, drone: 0 },
    defaultOwner: 'ai_1',
  },
  {
    id: 'southern_front',
    name: 'Southern Hemisphere Coalition',
    region: 'South Atlantic',
    type: 'land',
    anchorLat: -25,
    anchorLon: -15,
    controllingNationId: 'ai_2',
    strategicValue: 3,
    productionBonus: 2,
    instabilityModifier: -1,
    conflictRisk: 14,
    neighbors: ['indo_pacific', 'equatorial_belt'],
    armies: 4,
    unitComposition: { army: 0, navy: 4, air: 0, drone: 0 },
    defaultOwner: 'ai_2',
  },
  {
    id: 'equatorial_belt',
    name: 'Equatorial Resource Belt',
    region: 'Africa & Middle East',
    type: 'land',
    anchorLat: 5,
    anchorLon: 20,
    controllingNationId: 'ai_3',
    strategicValue: 4,
    productionBonus: 4,
    instabilityModifier: -6,
    conflictRisk: 24,
    neighbors: ['southern_front', 'atlantic_corridor'],
    armies: 5,
    unitComposition: { army: 5, navy: 0, air: 0, drone: 0 },
    defaultOwner: 'ai_3',
  },
  {
    id: 'proxy_middle_east',
    name: 'Proxy Battleground: Middle East',
    region: 'Middle East',
    type: 'land',
    anchorLat: 30,
    anchorLon: 45,
    controllingNationId: null,
    strategicValue: 4,
    productionBonus: 1,
    instabilityModifier: 8,
    conflictRisk: 28,
    neighbors: ['equatorial_belt', 'eastern_bloc'],
    armies: 0,
    unitComposition: { army: 0, navy: 0, air: 0, drone: 0 },
  },
  {
    id: 'arctic_circle',
    name: 'Arctic Surveillance Zone',
    region: 'Arctic',
    type: 'sea',
    anchorLat: 75,
    anchorLon: -10,
    controllingNationId: null,
    strategicValue: 2,
    productionBonus: 1,
    instabilityModifier: 5,
    conflictRisk: 12,
    neighbors: ['north_america', 'atlantic_corridor', 'eastern_bloc'],
    armies: 0,
    unitComposition: { army: 0, navy: 0, air: 0, drone: 0 },
  },
];

const templateLookup = UNIT_TEMPLATES.reduce<Record<string, ConventionalUnitTemplate>>((acc, template) => {
  acc[template.id] = template;
  return acc;
}, {});

function getTerritoryBonuses(
  territory: TerritoryState,
): { attack: number; defense: number; support: number } {
  let attackBonus = 0;
  let defenseBonus = 0;
  let supportBonus = 0;

  // Air units provide sustained strike pressure
  if (territory.unitComposition.air >= 2) {
    attackBonus += Math.floor(territory.unitComposition.air / 2) * (UNIT_COMBAT_BONUS.air.attack + 0.5);
    supportBonus += Math.floor(territory.unitComposition.air / 3) * 0.5;
  }

  // Naval formations bolster area denial and integrated air defense
  if (territory.unitComposition.navy >= 2) {
    defenseBonus += Math.floor(territory.unitComposition.navy / 2) * (UNIT_COMBAT_BONUS.navy.defense + 0.5);
    supportBonus += Math.floor(territory.unitComposition.navy / 3) * 0.5;
  }

  // Drone swarms add precision strike value and ISR
  if (territory.unitComposition.drone >= 2) {
    attackBonus += Math.floor(territory.unitComposition.drone / 2) * (UNIT_COMBAT_BONUS.drone.attack + 0.25);
    supportBonus += Math.floor(territory.unitComposition.drone / 2) * 0.75;
  }

  return { attack: attackBonus, defense: defenseBonus, support: supportBonus };
}

// Region definitions for reinforcement bonuses (like Risk continents)
const REGIONS = {
  'Western Hemisphere': ['north_america'],
  'Atlantic': ['atlantic_corridor'],
  'Europe & Siberia': ['eastern_bloc'],
  'Pacific': ['indo_pacific'],
  'South Atlantic': ['southern_front'],
  'Africa & Middle East': ['equatorial_belt', 'proxy_middle_east'],
  'Arctic': ['arctic_circle'],
};

const REGION_BONUSES: Record<string, number> = {
  'Western Hemisphere': 2,
  'Atlantic': 1,
  'Europe & Siberia': 3,
  'Pacific': 2,
  'South Atlantic': 2,
  'Africa & Middle East': 3,
  'Arctic': 1,
};

// Calculate reinforcements (Risk-style)
export function calculateReinforcements(
  nationId: string,
  territories: Record<string, TerritoryState>
): number {
  const controlledTerritories = Object.values(territories).filter(
    t => t.controllingNationId === nationId
  );

  // Base reinforcements: territories / 3 (minimum 3)
  const baseReinforcements = Math.max(3, Math.floor(controlledTerritories.length / 3));

  // Region bonuses: bonus for controlling all territories in a region
  let regionBonus = 0;
  Object.entries(REGIONS).forEach(([regionName, territoryIds]) => {
    const controlsAll = territoryIds.every(tid => {
      const territory = territories[tid];
      return territory && territory.controllingNationId === nationId;
    });
    if (controlsAll) {
      regionBonus += REGION_BONUSES[regionName] || 0;
    }
  });

  return baseReinforcements + regionBonus;
}

const computeUnitAttack = (unit: ConventionalUnitState, nation?: ConventionalNationRef): number => {
  const template = templateLookup[unit.templateId];
  if (!template) return 0;
  const readinessFactor = unit.readiness / 100;
  const experienceBonus = 1 + unit.experience * 0.05;
  const baseAttack = template.attack * readinessFactor * experienceBonus + template.support;

  // Apply tech bonuses from Force Modernization
  const techBonus = nation?.unitAttackBonus || 0;
  return baseAttack + techBonus;
};

export const territoryAnchors = DEFAULT_TERRITORIES.reduce<Record<string, { lon: number; lat: number }>>((acc, territory) => {
  acc[territory.id] = { lon: territory.anchorLon, lat: territory.anchorLat };
  return acc;
}, {});

const computeUnitDefense = (unit: ConventionalUnitState, nation?: ConventionalNationRef): number => {
  const template = templateLookup[unit.templateId];
  if (!template) return 0;
  const readinessFactor = unit.readiness / 100;
  const experienceBonus = 1 + unit.experience * 0.05;
  const baseDefense = template.defense * readinessFactor * experienceBonus + template.support * 0.5;

  // Apply tech bonuses from Force Modernization
  const techBonus = nation?.unitDefenseBonus || 0;
  return baseDefense + techBonus;
};

// Deprecated: Use safeClamp from safeMath instead
const clamp = safeClamp;

export function createDefaultConventionalState(
  nations: Array<{ id: string; isPlayer?: boolean }> = [],
): ConventionalState {
  const territories = DEFAULT_TERRITORIES.reduce<Record<string, TerritoryState>>((acc, territory) => {
    acc[territory.id] = { ...territory, contestedBy: [] };
    return acc;
  }, {});

  const units: Record<string, ConventionalUnitState> = {};

  nations.forEach((nation) => {
    const baseTemplateId = nation.isPlayer ? 'armored_corps' : 'armored_corps';
    const template = templateLookup[baseTemplateId];
    if (!template) return;
    const unitId = `${nation.id}_${baseTemplateId}_1`;
    units[unitId] = {
      id: unitId,
      templateId: baseTemplateId,
      ownerId: nation.id,
      label: nation.isPlayer ? '1st Armored Division' : `${nation.id.toUpperCase()} Vanguard`,
      readiness: nation.isPlayer ? 85 : 75,
      experience: nation.isPlayer ? 1 : 0,
      locationId: DEFAULT_TERRITORIES.find((territory) => territory.defaultOwner === nation.id)?.id ?? null,
      status: 'reserve',
      armiesValue: UNIT_ARMIES[template.type],
    };
  });

  return {
    templates: { ...templateLookup },
    units,
    territories,
    logs: [],
    reinforcementPools: {},
  };
}

const createEngagementLog = (
  state: ConventionalState,
  entry: Omit<EngagementLogEntry, 'id'>,
  rng: { next: () => number },
): ConventionalState => {
  const logEntry: EngagementLogEntry = {
    ...entry,
    id: `engagement_${Date.now()}_${rng.next().toString(36).slice(2, 8)}`,
  };

  return {
    ...state,
    logs: [...state.logs.slice(-24), logEntry],
  };
};

export function createDefaultNationConventionalProfile(focus: ForceType = 'army'): NationConventionalProfile {
  return {
    readiness: 75,
    reserve: 2,
    professionalism: 55,
    tradition: 55,
    focus,
    deployedUnits: [],
  };
}

export function useConventionalWarfare({
  initialState,
  currentTurn,
  getNation,
  onStateChange,
  onConsumeAction,
  onUpdateDisplay,
  onDefconChange,
  onRelationshipChange,
  militaryTemplatesApi,
  supplySystemApi,
}: UseConventionalWarfareOptions) {
  const { rng } = useRNG();
  const [state, setState] = useState<ConventionalState>(() => {
    const baseState = initialState ?? createDefaultConventionalState();
    return {
      ...baseState,
      reinforcementPools: baseState.reinforcementPools ?? {},
    };
  });
  const initialisedRef = useRef(false);

  const syncState = useCallback(
    (updater: (prev: ConventionalState) => ConventionalState) => {
      setState((prev) => {
        const next = updater(prev);
        onStateChange?.(next);
        return next;
      });
    },
    [onStateChange],
  );

  useEffect(() => {
    if (!initialState) return;
    setState({ ...initialState, reinforcementPools: initialState.reinforcementPools ?? {} });
    initialisedRef.current = true;
  }, [initialState]);

  const templates = useMemo(() => state.templates, [state.templates]);

  const unitsByNation = useMemo(() => {
    return Object.values(state.units).reduce<Record<string, ConventionalUnitState[]>>((acc, unit) => {
      if (!acc[unit.ownerId]) {
        acc[unit.ownerId] = [];
      }
      acc[unit.ownerId].push(unit);
      return acc;
    }, {});
  }, [state.units]);

  const convertMilitaryTemplate = useCallback(
    (nationId: string, templateId: string): ConventionalUnitTemplate | null => {
      if (!militaryTemplatesApi) {
        return null;
      }

      const stats = militaryTemplatesApi.getTemplateStats?.(nationId, templateId);
      if (!stats) {
        return null;
      }

      const baseTemplate = militaryTemplatesApi.getTemplate?.(nationId, templateId);
      const profile = convertHoIStatsToProfile(stats);
      const armiesValue = Math.max(3, Math.round((stats.totalManpower || 4500) / 1500));
      const readinessImpact = Math.max(3, Math.round((stats.organization || 200) / 80));

      return {
        id: templateId,
        type: 'army',
        name: baseTemplate?.name ?? 'Field Division',
        description: baseTemplate?.description ?? 'Imported military template',
        attack: Number(profile.attack.toFixed(2)),
        defense: Number(profile.defense.toFixed(2)),
        support: Number(profile.support.toFixed(2)),
        cost: {
          production: Math.max(10, Math.round((stats.totalProduction || 300) / 30)),
        },
        readinessImpact,
        armiesValue,
      };
    },
    [militaryTemplatesApi],
  );

  const getTemplateProfile = useCallback(
    (ownerId: string, templateId: string): TemplateCombatProfile => {
      const militaryStats = militaryTemplatesApi?.getTemplateStats?.(ownerId, templateId);
      if (militaryStats) {
        return convertHoIStatsToProfile(militaryStats);
      }

      const templateFromState = templates[templateId];
      if (templateFromState) {
        return profileFromTemplate(templateFromState);
      }

      const fallback = templateLookup[templateId];
      if (fallback) {
        return profileFromTemplate(fallback);
      }

      return { attack: 0, defense: 0, support: 0 };
    },
    [militaryTemplatesApi, templates],
  );

  const getSupplyModifier = useCallback(
    (territoryId: string | null, ownerId: string | null) => {
      if (!territoryId || !ownerId) {
        return 1;
      }

      const supplyInfo = supplySystemApi?.getTerritorySupply?.(territoryId);
      if (!supplyInfo) {
        return 1;
      }

      if (supplyInfo.controllingNationId && supplyInfo.controllingNationId !== ownerId) {
        return 0.75;
      }

      const statusModifier = SUPPLY_STATUS_MODIFIERS[supplyInfo.supplyStatus] ?? 1;
      const ratio = supplyInfo.supplyDemand > 0
        ? safeClamp(supplyInfo.currentSupply / Math.max(1, supplyInfo.supplyDemand), 0.35, 1.25)
        : 1;

      const combined = statusModifier * ratio;
      return Number.isFinite(combined) ? Number(combined.toFixed(2)) : 1;
    },
    [supplySystemApi],
  );

  const computeTerritoryCombatProfile = useCallback(
    (territory: TerritoryState, ownerId: string | null): TerritoryCombatSnapshot => {
      if (!ownerId) {
        return {
          attack: 0,
          defense: 0,
          support: 0,
          supplyModifier: 1,
        };
      }

      const territoryUnits = Object.values(state.units).filter(
        (unit) => unit.locationId === territory.id && unit.status === 'deployed' && unit.ownerId === ownerId,
      );

      let aggregateAttack = 0;
      let aggregateDefense = 0;
      let aggregateSupport = 0;

      if (territoryUnits.length > 0) {
        territoryUnits.forEach((unit) => {
          const profile = getTemplateProfile(unit.ownerId, unit.templateId);
          const readinessFactor = unit.readiness / 100;
          const experienceBonus = 1 + unit.experience * 0.05;
          const modifier = readinessFactor * experienceBonus;
          aggregateAttack += profile.attack * modifier;
          aggregateDefense += profile.defense * modifier;
          aggregateSupport += profile.support * modifier;
        });
      } else {
        const totalArmies = Math.max(1, territory.armies);
        const baseProfile = profileFromTemplate(templateLookup.armored_corps);
        const armyShare = territory.unitComposition.army / totalArmies;
        const navyShare = territory.unitComposition.navy / totalArmies;
        const airShare = territory.unitComposition.air / totalArmies;
        const droneShare = territory.unitComposition.drone / totalArmies;
        aggregateAttack =
          baseProfile.attack * armyShare +
          baseProfile.attack * 0.9 * navyShare +
          baseProfile.attack * 1.1 * airShare +
          baseProfile.attack * 1.15 * droneShare; // Drones have slightly higher attack
        aggregateDefense =
          baseProfile.defense * armyShare +
          baseProfile.defense * 1.1 * navyShare +
          baseProfile.defense * 0.9 * airShare +
          baseProfile.defense * 0.7 * droneShare; // Drones are more vulnerable
        aggregateSupport = baseProfile.support;
      }

      const supplyModifier = getSupplyModifier(territory.id, ownerId);

      return {
        attack: aggregateAttack * supplyModifier,
        defense: aggregateDefense * supplyModifier,
        support: aggregateSupport * supplyModifier,
        supplyModifier,
      };
    },
    [getSupplyModifier, getTemplateProfile, state.units],
  );

  const calculateCombinedArmsBonus = useCallback(
    (value: number) => Number(safeClamp(value * 0.12, 0, 8).toFixed(2)),
    [],
  );

  const territories = useMemo(() => state.territories, [state.territories]);

  useEffect(() => {
    syncState((prev) => {
      const trackedNationIds = new Set<string>(Object.keys(prev.reinforcementPools ?? {}));

      Object.values(prev.territories).forEach((territory) => {
        if (territory.controllingNationId) {
          trackedNationIds.add(territory.controllingNationId);
        }
      });

      let changed = false;
      const nextPools: Record<string, ReinforcementPool> = { ...(prev.reinforcementPools ?? {}) };

      trackedNationIds.forEach((nationId) => {
        const calculated = calculateReinforcements(nationId, prev.territories);
        const pool = nextPools[nationId];
        const needsReset = !pool || pool.turn !== currentTurn;
        const remaining = needsReset ? calculated : Math.min(pool.remaining, calculated);

        if (!pool || pool.turn !== currentTurn || remaining !== pool.remaining) {
          nextPools[nationId] = { turn: currentTurn, remaining };
          changed = true;
        }
      });

      return changed ? { ...prev, reinforcementPools: nextPools } : prev;
    });
  }, [currentTurn, syncState, territories]);

  const adjustNationProduction = useCallback(
    (nationId: string, delta: number) => {
      const nation = getNation(nationId);
      if (!nation) return;
      nation.production = Math.max(0, Math.round((nation.production ?? 0) + delta));
    },
    [getNation],
  );

  const adjustNationInstability = useCallback(
    (nationId: string, delta: number) => {
      const nation = getNation(nationId);
      if (!nation) return;
      nation.instability = clamp((nation.instability ?? 0) + delta, 0, 100);
    },
    [getNation],
  );

  const updateTerritoryControl = useCallback(
    (territoryId: string, nextOwnerId: string | null) => {
      syncState((prev) => {
        const territory = prev.territories[territoryId];
        if (!territory) return prev;
        const previousOwner = territory.controllingNationId;
        const updatedTerritory: TerritoryState = {
          ...territory,
          controllingNationId: nextOwnerId,
          contestedBy: [],
        };

        const nextTerritories: Record<string, TerritoryState> = {
          ...prev.territories,
          [territoryId]: updatedTerritory,
        };

        if (previousOwner && previousOwner !== nextOwnerId) {
          adjustNationProduction(previousOwner, -territory.productionBonus);
          adjustNationInstability(previousOwner, territory.instabilityModifier / 2);
          const prevNation = getNation(previousOwner);
          if (prevNation) {
            prevNation.controlledTerritories = (prevNation.controlledTerritories || []).filter((id) => id !== territoryId);
          }
        }

        if (nextOwnerId) {
          adjustNationProduction(nextOwnerId, territory.productionBonus);
          adjustNationInstability(nextOwnerId, -territory.instabilityModifier);
          const nextNation = getNation(nextOwnerId);
          if (nextNation) {
            const set = new Set(nextNation.controlledTerritories || []);
            set.add(territoryId);
            nextNation.controlledTerritories = Array.from(set);
          }
        }

        return {
          ...prev,
          territories: nextTerritories,
        };
      });
    },
    [adjustNationInstability, adjustNationProduction, getNation, syncState],
  );

  const spendResources = useCallback(
    (nationId: string, cost: ResourceCost) => {
      const nation = getNation(nationId);
      if (!nation) return false;
      if ((cost.production ?? 0) > nation.production) {
        return false;
      }
      if ((cost.intel ?? 0) > (nation.intel ?? 0)) {
        return false;
      }
      initializeResourceStockpile(nation);
      const stockpile = nation.resourceStockpile!;
      if ((cost.uranium ?? 0) > (stockpile.uranium || 0)) {
        return false;
      }
      // Check strategic resources
      if (cost.oil && (stockpile.oil || 0) < cost.oil) {
        return false;
      }
      if (cost.rare_earths && (stockpile.rare_earths || 0) < cost.rare_earths) {
        return false;
      }

      nation.production -= cost.production ?? 0;
      if (typeof nation.intel === 'number') {
        nation.intel = Math.max(0, nation.intel - (cost.intel ?? 0));
      }
      if (cost.uranium) {
        spendStrategicResource(nation, 'uranium', cost.uranium);
      }

      // Deduct strategic resources
      if (cost.oil) {
        spendStrategicResource(nation, 'oil', cost.oil);
      }
      if (cost.rare_earths) {
        spendStrategicResource(nation, 'rare_earths', cost.rare_earths);
      }

      return true;
    },
    [getNation],
  );

  const trainUnit = useCallback(
    (nationId: string, templateId: string, territoryId?: string) => {
      let template = templates[templateId] ?? templateLookup[templateId];
      let templateToPersist: ConventionalUnitTemplate | null = null;

      if (!template) {
        const converted = convertMilitaryTemplate(nationId, templateId);
        if (converted) {
          template = converted;
          templateToPersist = converted;
        }
      }

      if (!template) {
        return { success: false, reason: 'Unknown unit template' } as const;
      }

      const nation = getNation(nationId);
      if (!nation) {
        return { success: false, reason: 'Unknown nation' } as const;
      }

      if (template.requiresResearch && !nation.researched?.[template.requiresResearch]) {
        return {
          success: false,
          reason: 'Requires research unlock',
          requiresResearchId: template.requiresResearch,
        } as const;
      }

      if (!spendResources(nationId, template.cost)) {
        return { success: false, reason: 'Insufficient resources' } as const;
      }

      // Find a default territory for this nation if none specified
      let targetTerritoryId = territoryId;
      if (!targetTerritoryId) {
        const controlledTerritories = Object.values(territories).filter(
          t => t.controllingNationId === nationId
        );
        if (controlledTerritories.length === 0) {
          return { success: false, reason: 'No controlled territories to deploy to' } as const;
        }
        // Prefer land for army, sea for navy
        const preferredType = template.type === 'navy' ? 'sea' : 'land';
        const preferred = controlledTerritories.find(t => t.type === preferredType);
        targetTerritoryId = (preferred || controlledTerritories[0]).id;
      }

      const territory = territories[targetTerritoryId];
      if (!territory || territory.controllingNationId !== nationId) {
        return { success: false, reason: 'Must deploy to controlled territory' } as const;
      }

      const armiesToAdd = template.armiesValue ?? UNIT_ARMIES[template.type];
      const newUnitId = `${nationId}_${templateId}_${Date.now().toString(36)}`;
      const territoryKey = targetTerritoryId as string;
      const initialReadiness = clamp(
        (nation.conventional?.readiness ?? 70) - template.readinessImpact * 0.5,
        35,
        95,
      );

      const newUnit: ConventionalUnitState = {
        id: newUnitId,
        templateId,
        ownerId: nationId,
        label: template.name,
        readiness: initialReadiness,
        experience: 0,
        locationId: targetTerritoryId,
        status: 'deployed',
        armiesValue: armiesToAdd,
      };

      const territoryName = territory.name;

      syncState((prev) => {
        const nextTemplates = templateToPersist && !prev.templates[templateId]
          ? {
              ...prev.templates,
              [templateId]: templateToPersist,
            }
          : prev.templates;

        const previousTerritory = prev.territories[territoryKey];
        const updatedTerritory = {
          ...previousTerritory,
          armies: previousTerritory.armies + armiesToAdd,
          unitComposition: {
            ...previousTerritory.unitComposition,
            [template.type]: previousTerritory.unitComposition[template.type] + armiesToAdd,
          },
        };

        return {
          ...prev,
          templates: nextTemplates,
          territories: {
            ...prev.territories,
            [territoryKey]: updatedTerritory,
          },
          units: {
            ...prev.units,
            [newUnitId]: newUnit,
          },
        };
      });

      const profile = nation.conventional ?? createDefaultNationConventionalProfile();
      const moraleModifier = calculateMoraleRecruitmentModifier(nation.morale ?? 50);
      const trainingIntensity = template.readinessImpact;
      const professionalismGain = Math.max(2, Math.round(trainingIntensity * Math.max(0.75, moraleModifier)));
      const readinessPenalty = Math.max(3, Math.round(trainingIntensity * 0.9));
      const traditionLoss = Math.max(1, Math.round(trainingIntensity * 0.5));
      const reservePenalty = Math.max(0.5, (armiesToAdd ?? UNIT_ARMIES[template.type]) / 6);
      const deployedUnits = new Set(profile.deployedUnits);
      deployedUnits.add(newUnitId);
      nation.conventional = {
        ...profile,
        readiness: clamp(profile.readiness - readinessPenalty, 10, 100),
        reserve: Number(Math.max(0, profile.reserve - reservePenalty).toFixed(2)),
        professionalism: clamp(profile.professionalism + professionalismGain, 0, 100),
        tradition: clamp(profile.tradition - traditionLoss, 0, 100),
        deployedUnits: Array.from(deployedUnits),
      };

      onUpdateDisplay?.();
      onConsumeAction?.();
      return { success: true, territorySummary: `+${armiesToAdd} armies to ${territoryName}` } as const;
    },
    [
      convertMilitaryTemplate,
      getNation,
      onConsumeAction,
      onUpdateDisplay,
      spendResources,
      syncState,
      templates,
      territories,
    ],
  );

  const deployUnit = useCallback(
    (unitId: string, territoryId: string) => {
      const territory = territories[territoryId];
      if (!territory) {
        return { success: false, reason: 'Unknown territory' } as const;
      }
      const unit = state.units[unitId];
      if (!unit) {
        return { success: false, reason: 'Unknown unit' } as const;
      }
      const wasReserve = unit.status === 'reserve';

      syncState((prev) => ({
        ...prev,
        units: {
          ...prev.units,
          [unitId]: {
            ...prev.units[unitId],
            locationId: territoryId,
            status: 'deployed',
          },
        },
      }));

      const nation = getNation(unit.ownerId);
      if (nation) {
        const profile = nation.conventional ?? createDefaultNationConventionalProfile();
        const set = new Set(profile.deployedUnits);
        set.add(unitId);
        nation.conventional = {
          ...profile,
          reserve: wasReserve ? Math.max(0, profile.reserve - 1) : profile.reserve,
          deployedUnits: Array.from(set),
        };
      }

      onUpdateDisplay?.();
      onConsumeAction?.();
      return { success: true } as const;
    },
    [getNation, onConsumeAction, onUpdateDisplay, state.units, syncState, territories],
  );

  // Move armies between territories (Risk-style)
  const moveArmies = useCallback(
    (fromTerritoryId: string, toTerritoryId: string, count: number) => {
      const fromTerritory = territories[fromTerritoryId];
      const toTerritory = territories[toTerritoryId];

      if (!fromTerritory || !toTerritory) {
        return { success: false, reason: 'Unknown territory' } as const;
      }

      // Must control both territories
      if (fromTerritory.controllingNationId !== toTerritory.controllingNationId) {
        return { success: false, reason: 'Can only move armies between your own territories' } as const;
      }

      // Must be neighbors
      if (!fromTerritory.neighbors.includes(toTerritoryId)) {
        return { success: false, reason: 'Territories must be adjacent' } as const;
      }

      // Must leave at least 1 army in source
      if (fromTerritory.armies - count < 1) {
        return { success: false, reason: 'Must leave at least 1 army in territory' } as const;
      }

      if (count < 1) {
        return { success: false, reason: 'Must move at least 1 army' } as const;
      }

      // Move armies proportionally by unit composition
      const fromComposition = fromTerritory.unitComposition;
      const totalArmies = fromTerritory.armies;
      const proportions = {
        army: fromComposition.army / totalArmies,
        navy: fromComposition.navy / totalArmies,
        air: fromComposition.air / totalArmies,
        drone: fromComposition.drone / totalArmies,
      };

      const attackerNationId = fromTerritory.controllingNationId ?? undefined;
      const defenderNationId = toTerritory.controllingNationId ?? undefined;

      syncState((prev) => {
        const updatedFrom = { ...prev.territories[fromTerritoryId] };
        const updatedTo = { ...prev.territories[toTerritoryId] };

        updatedFrom.armies -= count;
        updatedTo.armies += count;

        // Proportionally move unit types
        const movedComposition = {
          army: Math.round(count * proportions.army),
          navy: Math.round(count * proportions.navy),
          air: Math.round(count * proportions.air),
          drone: Math.round(count * proportions.drone),
        };

        updatedFrom.unitComposition = {
          army: Math.max(0, updatedFrom.unitComposition.army - movedComposition.army),
          navy: Math.max(0, updatedFrom.unitComposition.navy - movedComposition.navy),
          air: Math.max(0, updatedFrom.unitComposition.air - movedComposition.air),
          drone: Math.max(0, updatedFrom.unitComposition.drone - movedComposition.drone),
        };

        updatedTo.unitComposition = {
          army: updatedTo.unitComposition.army + movedComposition.army,
          navy: updatedTo.unitComposition.navy + movedComposition.navy,
          air: updatedTo.unitComposition.air + movedComposition.air,
          drone: updatedTo.unitComposition.drone + movedComposition.drone,
        };

        return createEngagementLog({
          ...prev,
          territories: {
            ...prev.territories,
            [fromTerritoryId]: updatedFrom,
            [toTerritoryId]: updatedTo,
          },
        }, {
          turn: currentTurn,
          territoryId: toTerritoryId,
          type: 'movement',
          outcome: 'stalemate',
          summary: `Moved ${count} armies from ${fromTerritory.name} to ${toTerritory.name}`,
          attackerNationId,
          defenderNationId,
          attackerCasualties: 0,
          defenderCasualties: 0,
          rounds: 0,
          casualties: {
            ...(attackerNationId ? { [attackerNationId]: 0 } : {}),
            ...(defenderNationId && defenderNationId !== attackerNationId
              ? { [defenderNationId]: 0 }
              : {}),
          },
          instabilityDelta: {},
          productionDelta: {},
        }, rng);
      });

      onUpdateDisplay?.();
      onConsumeAction?.();
      return { success: true } as const;
    },
    [currentTurn, onConsumeAction, onUpdateDisplay, rng, syncState, territories],
  );

  const resolveBorderConflict = useCallback(
    (fromTerritoryId: string, toTerritoryId: string, attackingArmies: number) => {
      const fromTerritory = territories[fromTerritoryId];
      const toTerritory = territories[toTerritoryId];

      if (!fromTerritory || !toTerritory) {
        return { success: false, reason: 'Unknown territory' } as const;
      }

      const attackerId = fromTerritory.controllingNationId;
      const defenderId = toTerritory.controllingNationId;

      if (!attackerId) {
        return { success: false, reason: 'No attacker controlling source territory' } as const;
      }

      if (!defenderId) {
        // Uncontested territory - just move armies
        return moveArmies(fromTerritoryId, toTerritoryId, attackingArmies);
      }

      // Must be neighbors
      if (!fromTerritory.neighbors.includes(toTerritoryId)) {
        return { success: false, reason: 'Territories must be adjacent' } as const;
      }

      // Must have enough armies
      if (attackingArmies > fromTerritory.armies - 1) {
        return { success: false, reason: 'Must leave at least 1 army in source territory' } as const;
      }

      if (attackingArmies < 1) {
        return { success: false, reason: 'Must attack with at least 1 army' } as const;
      }

      const attackerNation = getNation(attackerId);
      const defenderNation = getNation(defenderId);

      const attackerTreaty = attackerNation?.treaties?.[defenderId];
      const defenderTreaty = defenderNation?.treaties?.[attackerId];
      const attackerAlliances = attackerNation?.alliances ?? [];
      const defenderAlliances = defenderNation?.alliances ?? [];

      const isTruceActive = (treaty?: Treaty | null): boolean => {
        if (!treaty) {
          return false;
        }
        const { truceTurns } = treaty as { truceTurns?: unknown };
        if (typeof truceTurns === 'number' && truceTurns > 0) {
          return true;
        }
        const { truceExpiryTurn } = treaty as { truceExpiryTurn?: unknown };
        if (typeof truceExpiryTurn === 'number' && truceExpiryTurn > currentTurn) {
          return true;
        }
        return false;
      };

      const truceActive = isTruceActive(attackerTreaty) || isTruceActive(defenderTreaty);
      if (truceActive) {
        return {
          success: false,
          reason: 'An active truce prevents launching a conventional assault on this nation.',
        } as const;
      }

      const alliedPartners = Boolean(
        attackerTreaty?.alliance ||
          defenderTreaty?.alliance ||
          attackerAlliances.includes(defenderId) ||
          defenderAlliances.includes(attackerId),
      );

      if (alliedPartners) {
        return {
          success: false,
          reason: 'Allied nations cannot be targeted with conventional assaults.',
        } as const;
      }

      // DEFCON Impact: Major military action lowers DEFCON (increases threat)
      // Territory strategic value determines how much it affects global tension
      const defconImpact = Math.min(2, Math.ceil(toTerritory.strategicValue / 3));
      onDefconChange?.(-defconImpact); // Lower DEFCON (1 = max threat)

      // Diplomatic Relations Impact
      const TERRITORIAL_ATTACK_PENALTY = -25;
      onRelationshipChange?.(
        attackerId,
        defenderId,
        TERRITORIAL_ATTACK_PENALTY,
        'Conventional warfare territorial assault',
        currentTurn
      );

      // Allies of defender get upset
      defenderNation?.alliances?.forEach(allyId => {
        if (allyId !== attackerId) {
          onRelationshipChange?.(
            attackerId,
            allyId,
            -15,
            `Failure to honour alliance with ${defenderNation?.name ?? 'ally'}`,
            currentTurn
          );
        }
      });

      // Get unit composition bonuses and template-driven combat strength
      const attackBonuses = getTerritoryBonuses(fromTerritory);
      const defenseBonuses = getTerritoryBonuses(toTerritory);
      const attackerCombat = computeTerritoryCombatProfile(fromTerritory, attackerId);
      const defenderCombat = computeTerritoryCombatProfile(toTerritory, defenderId);

      const attackerBaseStrength =
        attackerCombat.attack + attackerCombat.support + attackBonuses.attack + attackBonuses.support;
      const defenderBaseStrength =
        defenderCombat.defense + defenderCombat.support + defenseBonuses.defense + defenseBonuses.support;

      const attackerCombinedBonus = calculateCombinedArmsBonus(attackerBaseStrength + attackingArmies);
      const defenderCombinedBonus = calculateCombinedArmsBonus(defenderBaseStrength + toTerritory.armies);

      // Resolve combat using deterministic strength exchanges capped per round
      let remainingAttackers = attackingArmies;
      let remainingDefenders = toTerritory.armies;
      const strengthExchanges: StrengthExchangeLog[] = [];
      const maxRounds = 20; // Prevent infinite loops
      const MAX_CASUALTY_RATE = 0.38;
      const MIN_CASUALTY_RATE = 0.06;

      for (let round = 0; round < maxRounds && remainingAttackers > 0 && remainingDefenders > 0; round++) {
        const attackerStrength = attackerBaseStrength + attackerCombinedBonus + remainingAttackers;
        const defenderStrength = defenderBaseStrength + defenderCombinedBonus + remainingDefenders;
        const ratio = safeDivide(attackerStrength, defenderStrength);

        const attackerLossRate = safeClamp(0.2 / Math.max(0.5, ratio), MIN_CASUALTY_RATE, MAX_CASUALTY_RATE);
        const defenderLossRate = safeClamp(0.2 * Math.max(0.5, ratio), MIN_CASUALTY_RATE, MAX_CASUALTY_RATE);

        const attackerLosses = Math.max(
          1,
          Math.min(remainingAttackers, Math.round(remainingAttackers * attackerLossRate)),
        );
        const defenderLosses = Math.max(
          1,
          Math.min(remainingDefenders, Math.round(remainingDefenders * defenderLossRate)),
        );

        remainingAttackers -= attackerLosses;
        remainingDefenders -= defenderLosses;

        strengthExchanges.push({
          round: round + 1,
          attackerStrength: Number(attackerStrength.toFixed(2)),
          defenderStrength: Number(defenderStrength.toFixed(2)),
          attackerLosses,
          defenderLosses,
          attackerRemaining: remainingAttackers,
          defenderRemaining: remainingDefenders,
        });
      }

      const initialAttackerStrength = attackerBaseStrength + attackerCombinedBonus + attackingArmies;
      const initialDefenderStrength = defenderBaseStrength + defenderCombinedBonus + toTerritory.armies;
      const strengthRatio = Number(safeDivide(initialAttackerStrength, initialDefenderStrength).toFixed(2));
      const attackerVictory = remainingDefenders === 0;
      const attackerLosses = attackingArmies - remainingAttackers;
      const defenderLosses = toTerritory.armies - remainingDefenders;

      const casualties: Record<string, number> = {
        [attackerId]: attackerLosses,
        [defenderId]: defenderLosses,
      };

      const instabilityDelta: Record<string, number> = {};
      const productionDelta: Record<string, number> = {};

      // Update territories and conquest
      syncState((prev) => {
        const updatedTerritories = { ...prev.territories };

        if (attackerVictory) {
          // Attacker conquers territory
          updatedTerritories[toTerritoryId] = {
            ...toTerritory,
            controllingNationId: attackerId,
            armies: remainingAttackers,
            unitComposition: fromTerritory.unitComposition, // Inherit attacking composition
          };

          // Remove armies from source
          updatedTerritories[fromTerritoryId] = {
            ...fromTerritory,
            armies: fromTerritory.armies - attackingArmies,
          };

          // Update production and instability
          adjustNationProduction(attackerId, toTerritory.productionBonus);
          adjustNationProduction(defenderId, -toTerritory.productionBonus);
          adjustNationInstability(attackerId, -toTerritory.instabilityModifier);
          adjustNationInstability(defenderId, toTerritory.instabilityModifier);

          instabilityDelta[attackerId] = -toTerritory.instabilityModifier;
          instabilityDelta[defenderId] = toTerritory.instabilityModifier;
          productionDelta[attackerId] = toTerritory.productionBonus;
          productionDelta[defenderId] = -toTerritory.productionBonus;

          // Update territory control lists
          updateTerritoryControl(toTerritoryId, attackerId);
        } else {
          // Defender holds
          updatedTerritories[toTerritoryId] = {
            ...toTerritory,
            armies: remainingDefenders,
          };

          // Remove casualties from source
          updatedTerritories[fromTerritoryId] = {
            ...fromTerritory,
            armies: fromTerritory.armies - attackerLosses,
          };

          adjustNationInstability(attackerId, toTerritory.instabilityModifier / 2);
          instabilityDelta[attackerId] = toTerritory.instabilityModifier / 2;
        }

        return createEngagementLog({
          ...prev,
          territories: updatedTerritories,
        }, {
          turn: currentTurn,
          territoryId: toTerritoryId,
          type: 'border',
          outcome: attackerVictory ? 'attacker' : 'defender',
          summary: attackerVictory
            ? `${attackerNation?.name || attackerId} overruns ${toTerritory.name} after ${strengthExchanges.length} rounds (ratio ${strengthRatio.toFixed(2)}:1)`
            : `${defenderNation?.name || defenderId} holds ${toTerritory.name} after ${strengthExchanges.length} rounds (ratio ${strengthRatio.toFixed(2)}:1)`,
          attackerNationId: attackerId,
          defenderNationId: defenderId,
          attackerCasualties: attackerLosses,
          defenderCasualties: defenderLosses,
          rounds: strengthExchanges.length,
          casualties,
          instabilityDelta,
          productionDelta,
          strengthExchanges,
        }, rng);
      });

      // Update readiness
      if (attackerNation) {
        const profile = attackerNation.conventional ?? createDefaultNationConventionalProfile();
        attackerNation.conventional = {
          ...profile,
          readiness: clamp(profile.readiness - (attackerVictory ? 8 : 15), 20, 100),
        };
      }
      if (defenderNation) {
        const profile = defenderNation.conventional ?? createDefaultNationConventionalProfile();
        defenderNation.conventional = {
          ...profile,
          readiness: clamp(profile.readiness - (attackerVictory ? 18 : 10), 20, 100),
        };
      }

      onUpdateDisplay?.();
      onConsumeAction?.();
      return {
        success: true,
        attackerVictory,
        strengthExchanges,
        attackerLosses,
        defenderLosses,
        attackerCombatPower: Number((attackerCombat.attack + attackerCombat.support).toFixed(2)),
        defenderCombatPower: Number((defenderCombat.defense + defenderCombat.support).toFixed(2)),
        supply: {
          attacker: attackerCombat.supplyModifier,
          defender: defenderCombat.supplyModifier,
        },
      } as const;
    },
    [
      adjustNationInstability,
      adjustNationProduction,
      currentTurn,
      getNation,
      computeTerritoryCombatProfile,
      calculateCombinedArmsBonus,
      moveArmies,
      onConsumeAction,
      onUpdateDisplay,
      rng,
      syncState,
      territories,
      updateTerritoryControl,
    ],
  );

  const resolveProxyEngagement = useCallback(
    (territoryId: string, sponsorId: string, opposingId: string) => {
      const territory = territories[territoryId];
      if (!territory) {
        return { success: false, reason: 'Unknown territory' } as const;
      }
      const sponsorReadiness = getNation(sponsorId)?.conventional?.readiness ?? 60;
      const opposingReadiness = getNation(opposingId)?.conventional?.readiness ?? 60;
      const sponsorSupply = getSupplyModifier(territoryId, sponsorId);
      const opposingSupply = getSupplyModifier(territoryId, opposingId);

      const proxyOdds = clamp(0.45 + (sponsorReadiness - opposingReadiness) / 200, 0.2, 0.8);
      const supplyRatio = safeClamp(sponsorSupply / Math.max(0.35, opposingSupply), 0.5, 1.5);
      const adjustedOdds = clamp(proxyOdds * supplyRatio, 0.1, 0.9);
      const roll = rng.next();
      const sponsorSuccess = roll < adjustedOdds;

      const instabilitySwing = sponsorSuccess ? -territory.instabilityModifier / 2 : territory.instabilityModifier / 3;
      adjustNationInstability(sponsorId, instabilitySwing);
      adjustNationInstability(opposingId, -instabilitySwing);

      const productionChange = sponsorSuccess ? territory.productionBonus / 2 : -territory.productionBonus / 2;
      adjustNationProduction(sponsorId, productionChange);
      adjustNationProduction(opposingId, -productionChange);

      const sponsorNation = getNation(sponsorId);
      if (sponsorNation) {
        const profile = sponsorNation.conventional ?? createDefaultNationConventionalProfile();
        sponsorNation.conventional = {
          ...profile,
          readiness: clamp(profile.readiness - (sponsorSuccess ? 4 : 6), 20, 100),
        };
      }
      const opposingNation = getNation(opposingId);
      if (opposingNation) {
        const profile = opposingNation.conventional ?? createDefaultNationConventionalProfile();
        opposingNation.conventional = {
          ...profile,
          readiness: clamp(profile.readiness - (sponsorSuccess ? 8 : 4), 20, 100),
        };
      }

      syncState((prev) =>
        createEngagementLog(prev, {
          turn: currentTurn,
          territoryId,
          type: 'proxy',
          outcome: sponsorSuccess ? 'attacker' : 'defender',
          summary: sponsorSuccess
            ? `${sponsorId} proxy gains in ${territory.name}`
            : `${opposingId} repels proxy in ${territory.name}`,
          attackerNationId: sponsorId,
          defenderNationId: opposingId,
          attackerCasualties: sponsorSuccess ? 5 : 12,
          defenderCasualties: sponsorSuccess ? 12 : 6,
          rounds: 1,
          casualties: {
            [sponsorId]: sponsorSuccess ? 5 : 12,
            [opposingId]: sponsorSuccess ? 12 : 6,
          },
          instabilityDelta: {
            [sponsorId]: instabilitySwing,
            [opposingId]: -instabilitySwing,
          },
          productionDelta: {
            [sponsorId]: productionChange,
            [opposingId]: -productionChange,
          },
        }, rng),
      );

      onUpdateDisplay?.();
      onConsumeAction?.();
      return {
        success: true,
        sponsorSuccess,
        odds: adjustedOdds,
        supply: {
          sponsor: sponsorSupply,
          opposing: opposingSupply,
        },
      } as const;
    },
    [
      adjustNationInstability,
      adjustNationProduction,
      currentTurn,
      getNation,
      getSupplyModifier,
      onConsumeAction,
      onUpdateDisplay,
      syncState,
      territories,
    ],
  );

  const getUnitsForNation = useCallback(
    (nationId: string) => unitsByNation[nationId] ?? [],
    [unitsByNation],
  );

  const getTerritoriesForNation = useCallback(
    (nationId: string) =>
      Object.values(territories).filter((territory) => territory.controllingNationId === nationId),
    [territories],
  );

  const getReinforcementPool = useCallback(
    (nationId: string) => {
      const calculated = calculateReinforcements(nationId, territories);
      const pool = state.reinforcementPools?.[nationId];

      if (pool?.turn === currentTurn) {
        return Math.min(pool.remaining, calculated);
      }

      return calculated;
    },
    [currentTurn, state.reinforcementPools, territories],
  );

  const placeReinforcements = useCallback(
    (nationId: string, territoryId: string, count: number) => {
      const territory = territories[territoryId];
      if (!territory) {
        return { success: false, reason: 'Unknown territory' } as const;
      }

      if (territory.controllingNationId !== nationId) {
        return { success: false, reason: 'Can only reinforce your own territories' } as const;
      }

      if (count < 1) {
        return { success: false, reason: 'Must place at least 1 army' } as const;
      }

      const available = getReinforcementPool(nationId);
      if (available <= 0) {
        return { success: false, reason: 'No reinforcements remaining this turn' } as const;
      }

      if (count > available) {
        return {
          success: false,
          reason: `Only ${available} reinforcements remain this turn`,
        } as const;
      }

      syncState((prev) => ({
        ...prev,
        territories: {
          ...prev.territories,
          [territoryId]: {
            ...prev.territories[territoryId],
            armies: prev.territories[territoryId].armies + count,
            // Reinforcements default to army type
            unitComposition: {
              ...prev.territories[territoryId].unitComposition,
              army: prev.territories[territoryId].unitComposition.army + count,
            },
          },
        },
        reinforcementPools: {
          ...(prev.reinforcementPools ?? {}),
          [nationId]: {
            turn: currentTurn,
            remaining: (() => {
              const calculated = calculateReinforcements(nationId, prev.territories);
              const pool = prev.reinforcementPools?.[nationId];
              const baseRemaining = !pool || pool.turn !== currentTurn
                ? calculated
                : Math.min(pool.remaining, calculated);
              return Math.max(0, baseRemaining - count);
            })(),
          },
        },
      }));

      const nation = getNation(nationId);
      if (nation) {
        const profile = nation.conventional ?? createDefaultNationConventionalProfile();
        const mobilizationIntensity = Math.max(1, Math.round(count));
        const readinessBoost = Math.max(2, Math.round(mobilizationIntensity * 1.5));
        const professionalismPenalty = Math.max(1, Math.round(mobilizationIntensity * 0.8));
        const traditionBoost = Math.max(1, Math.round(mobilizationIntensity));
        nation.conventional = {
          ...profile,
          readiness: clamp(profile.readiness + readinessBoost, 10, 100),
          reserve: Number((profile.reserve + mobilizationIntensity * 0.75).toFixed(2)),
          professionalism: clamp(profile.professionalism - professionalismPenalty, 0, 100),
          tradition: clamp(profile.tradition + traditionBoost, 0, 100),
        };
      }

      onUpdateDisplay?.();
      return { success: true } as const;
    },
    [currentTurn, getNation, getReinforcementPool, onUpdateDisplay, syncState, territories],
  );

  const getReinforcements = useCallback((nationId: string) => getReinforcementPool(nationId), [getReinforcementPool]);

  return {
    state,
    templates,
    territories,
    units: state.units,
    logs: state.logs,
    trainUnit,
    deployUnit,
    moveArmies,
    resolveBorderConflict,
    resolveProxyEngagement,
    getUnitsForNation,
    getTerritoriesForNation,
    placeReinforcements,
    getReinforcements,
  };
}
