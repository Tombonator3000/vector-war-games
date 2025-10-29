import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { calculateMoraleRecruitmentModifier } from './useGovernance';

export type ForceType = 'army' | 'navy' | 'air';

export interface ResourceCost {
  production?: number;
  intel?: number;
  uranium?: number;
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
}

export interface TerritoryState {
  id: string;
  name: string;
  region: string;
  type: 'land' | 'sea';
  controllingNationId: string | null;
  contestedBy: string[];
  strategicValue: number;
  productionBonus: number;
  instabilityModifier: number;
  conflictRisk: number;
  neighbors: string[];
}

export interface EngagementLogEntry {
  id: string;
  turn: number;
  territoryId: string;
  type: 'border' | 'proxy';
  outcome: 'attacker' | 'defender' | 'stalemate';
  summary: string;
  casualties: Record<string, number>;
  instabilityDelta: Record<string, number>;
  productionDelta: Record<string, number>;
}

export interface NationConventionalProfile {
  readiness: number;
  reserve: number;
  focus: ForceType;
  deployedUnits: string[];
}

export interface ConventionalState {
  templates: Record<string, ConventionalUnitTemplate>;
  units: Record<string, ConventionalUnitState>;
  territories: Record<string, TerritoryState>;
  logs: EngagementLogEntry[];
}

export interface ConventionalNationRef {
  id: string;
  name: string;
  production: number;
  instability?: number;
  conventional?: NationConventionalProfile;
  controlledTerritories?: string[];
  morale?: number;
}

interface UseConventionalWarfareOptions {
  initialState?: ConventionalState;
  currentTurn: number;
  getNation: (id: string) => ConventionalNationRef | undefined;
  onStateChange?: (state: ConventionalState) => void;
  onConsumeAction?: () => void;
  onUpdateDisplay?: () => void;
}

const UNIT_TEMPLATES: ConventionalUnitTemplate[] = [
  {
    id: 'armored_corps',
    type: 'army',
    name: 'Armored Corps',
    description: 'Mechanised ground formation built around heavy armor spearheads.',
    attack: 7,
    defense: 5,
    support: 2,
    cost: { production: 12 },
    readinessImpact: 6,
  },
  {
    id: 'carrier_fleet',
    type: 'navy',
    name: 'Carrier Strike Group',
    description: 'Blue-water naval group with integrated air and missile coverage.',
    attack: 6,
    defense: 8,
    support: 3,
    cost: { production: 16, uranium: 2 },
    readinessImpact: 8,
  },
  {
    id: 'air_wing',
    type: 'air',
    name: 'Expeditionary Air Wing',
    description: 'Long-range tactical aviation with SEAD and strike capability.',
    attack: 8,
    defense: 4,
    support: 3,
    cost: { production: 14, intel: 4 },
    readinessImpact: 7,
  },
];

const DEFAULT_TERRITORIES: Array<Omit<TerritoryState, 'contestedBy'> & { defaultOwner?: string }> = [
  {
    id: 'north_america',
    name: 'North American Theater',
    region: 'Western Hemisphere',
    type: 'land',
    controllingNationId: 'player',
    strategicValue: 5,
    productionBonus: 4,
    instabilityModifier: -8,
    conflictRisk: 10,
    neighbors: ['atlantic_corridor', 'arctic_circle'],
    defaultOwner: 'player',
  },
  {
    id: 'atlantic_corridor',
    name: 'North Atlantic Sea Lanes',
    region: 'Atlantic',
    type: 'sea',
    controllingNationId: 'player',
    strategicValue: 3,
    productionBonus: 2,
    instabilityModifier: -3,
    conflictRisk: 18,
    neighbors: ['north_america', 'eastern_bloc', 'arctic_circle'],
    defaultOwner: 'player',
  },
  {
    id: 'eastern_bloc',
    name: 'Eurasian Frontier',
    region: 'Europe & Siberia',
    type: 'land',
    controllingNationId: 'ai_0',
    strategicValue: 5,
    productionBonus: 3,
    instabilityModifier: -4,
    conflictRisk: 22,
    neighbors: ['atlantic_corridor', 'indo_pacific', 'arctic_circle'],
    defaultOwner: 'ai_0',
  },
  {
    id: 'indo_pacific',
    name: 'Indo-Pacific Rim',
    region: 'Pacific',
    type: 'sea',
    controllingNationId: 'ai_1',
    strategicValue: 4,
    productionBonus: 3,
    instabilityModifier: -2,
    conflictRisk: 20,
    neighbors: ['eastern_bloc', 'southern_front'],
    defaultOwner: 'ai_1',
  },
  {
    id: 'southern_front',
    name: 'Southern Hemisphere Coalition',
    region: 'South Atlantic',
    type: 'land',
    controllingNationId: 'ai_2',
    strategicValue: 3,
    productionBonus: 2,
    instabilityModifier: -1,
    conflictRisk: 14,
    neighbors: ['indo_pacific', 'equatorial_belt'],
    defaultOwner: 'ai_2',
  },
  {
    id: 'equatorial_belt',
    name: 'Equatorial Resource Belt',
    region: 'Africa & Middle East',
    type: 'land',
    controllingNationId: 'ai_3',
    strategicValue: 4,
    productionBonus: 4,
    instabilityModifier: -6,
    conflictRisk: 24,
    neighbors: ['southern_front', 'atlantic_corridor'],
    defaultOwner: 'ai_3',
  },
  {
    id: 'proxy_middle_east',
    name: 'Proxy Battleground: Middle East',
    region: 'Middle East',
    type: 'land',
    controllingNationId: null,
    strategicValue: 4,
    productionBonus: 1,
    instabilityModifier: 8,
    conflictRisk: 28,
    neighbors: ['equatorial_belt', 'eastern_bloc'],
  },
  {
    id: 'arctic_circle',
    name: 'Arctic Surveillance Zone',
    region: 'Arctic',
    type: 'sea',
    controllingNationId: null,
    strategicValue: 2,
    productionBonus: 1,
    instabilityModifier: 5,
    conflictRisk: 12,
    neighbors: ['north_america', 'atlantic_corridor', 'eastern_bloc'],
  },
];

const templateLookup = UNIT_TEMPLATES.reduce<Record<string, ConventionalUnitTemplate>>((acc, template) => {
  acc[template.id] = template;
  return acc;
}, {});

const computeUnitAttack = (unit: ConventionalUnitState): number => {
  const template = templateLookup[unit.templateId];
  if (!template) return 0;
  const readinessFactor = unit.readiness / 100;
  const experienceBonus = 1 + unit.experience * 0.05;
  return template.attack * readinessFactor * experienceBonus + template.support;
};

const computeUnitDefense = (unit: ConventionalUnitState): number => {
  const template = templateLookup[unit.templateId];
  if (!template) return 0;
  const readinessFactor = unit.readiness / 100;
  const experienceBonus = 1 + unit.experience * 0.05;
  return template.defense * readinessFactor * experienceBonus + template.support * 0.5;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function createDefaultConventionalState(nations: Array<{ id: string; isPlayer?: boolean }> = []): ConventionalState {
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
    };
  });

  return {
    templates: { ...templateLookup },
    units,
    territories,
    logs: [],
  };
}

const createEngagementLog = (
  state: ConventionalState,
  entry: Omit<EngagementLogEntry, 'id'>,
): ConventionalState => {
  const logEntry: EngagementLogEntry = {
    ...entry,
    id: `engagement_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
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
}: UseConventionalWarfareOptions) {
  const [state, setState] = useState<ConventionalState>(() => initialState ?? createDefaultConventionalState());
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
    setState(initialState);
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

  const territories = useMemo(() => state.territories, [state.territories]);

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
      if ((cost.intel ?? 0) > (nation as any).intel) {
        return false;
      }
      if ((cost.uranium ?? 0) > (nation as any).uranium) {
        return false;
      }
      nation.production -= cost.production ?? 0;
      if (typeof (nation as any).intel === 'number') {
        (nation as any).intel = Math.max(0, (nation as any).intel - (cost.intel ?? 0));
      }
      if (typeof (nation as any).uranium === 'number') {
        (nation as any).uranium = Math.max(0, (nation as any).uranium - (cost.uranium ?? 0));
      }
      return true;
    },
    [getNation],
  );

  const trainUnit = useCallback(
    (nationId: string, templateId: string) => {
      const template = templates[templateId];
      if (!template) {
        return { success: false, reason: 'Unknown unit template' } as const;
      }
      if (!spendResources(nationId, template.cost)) {
        return { success: false, reason: 'Insufficient resources' } as const;
      }

      const moraleModifier = calculateMoraleRecruitmentModifier(getNation(nationId)?.morale ?? 50);
      const profile = getNation(nationId)?.conventional ?? createDefaultNationConventionalProfile();
      const readinessGain = Math.max(1, Math.round(5 * moraleModifier));
      const unitId = `${nationId}_${templateId}_${Date.now().toString(36)}`;

      syncState((prev) => ({
        ...prev,
        units: {
          ...prev.units,
          [unitId]: {
            id: unitId,
            templateId,
            ownerId: nationId,
            label: `${profile.focus.toUpperCase()} ${profile.deployedUnits.length + 1}`,
            readiness: clamp(profile.readiness + readinessGain, 10, 100),
            experience: 0,
            locationId: null,
            status: 'reserve',
          },
        },
      }));

      const nation = getNation(nationId);
      if (nation) {
        const nationProfile = nation.conventional ?? createDefaultNationConventionalProfile(profile.focus);
        nation.conventional = {
          ...nationProfile,
          reserve: nationProfile.reserve + 1,
          readiness: clamp(nationProfile.readiness + readinessGain * 0.5, 10, 100),
        };
      }

      onUpdateDisplay?.();
      onConsumeAction?.();
      return { success: true, unitId } as const;
    },
    [getNation, onConsumeAction, onUpdateDisplay, spendResources, syncState, templates],
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

  const resolveBorderConflict = useCallback(
    (territoryId: string, attackerId: string, defenderId: string) => {
      const territory = territories[territoryId];
      if (!territory) {
        return { success: false, reason: 'Unknown territory' } as const;
      }

      const attackerUnits = (unitsByNation[attackerId] || []).filter(
        (unit) => unit.locationId === territoryId && unit.status === 'deployed',
      );
      const defenderUnits = (unitsByNation[defenderId] || []).filter(
        (unit) => unit.locationId === territoryId && unit.status === 'deployed',
      );

      const attackerPower = attackerUnits.reduce((total, unit) => total + computeUnitAttack(unit), 0);
      const defenderPower = defenderUnits.reduce((total, unit) => total + computeUnitDefense(unit), 0);

      const readinessEdge = (getNation(attackerId)?.conventional?.readiness ?? 60) -
        (getNation(defenderId)?.conventional?.readiness ?? 60);
      const readinessModifier = readinessEdge / 200;

      const baseOdds = attackerPower / Math.max(attackerPower + defenderPower, 1);
      const tensionModifier = territory.conflictRisk / 200;
      const odds = clamp(baseOdds + readinessModifier + tensionModifier - 0.1, 0.15, 0.85);

      const roll = Math.random();
      const attackerVictory = roll < odds;
      const outcome: EngagementLogEntry['outcome'] = attackerVictory ? 'attacker' : 'defender';

      const casualties: Record<string, number> = {};
      const instabilityDelta: Record<string, number> = {};
      const productionDelta: Record<string, number> = {};

      casualties[attackerId] = Math.round((defenderPower || 4) * (attackerVictory ? 0.5 : 0.9));
      casualties[defenderId] = Math.round((attackerPower || 4) * (attackerVictory ? 0.9 : 0.4));

      if (attackerVictory) {
        updateTerritoryControl(territoryId, attackerId);
        instabilityDelta[attackerId] = -territory.instabilityModifier;
        instabilityDelta[defenderId] = territory.instabilityModifier;
        productionDelta[attackerId] = territory.productionBonus;
        productionDelta[defenderId] = -territory.productionBonus;
      } else {
        adjustNationInstability(attackerId, territory.instabilityModifier / 2);
        instabilityDelta[attackerId] = territory.instabilityModifier / 2;
      }

      const attackerNation = getNation(attackerId);
      if (attackerNation) {
        const profile = attackerNation.conventional ?? createDefaultNationConventionalProfile();
        attackerNation.conventional = {
          ...profile,
          readiness: clamp(profile.readiness - (attackerVictory ? 6 : 12), 20, 100),
        };
      }
      const defenderNation = getNation(defenderId);
      if (defenderNation) {
        const profile = defenderNation.conventional ?? createDefaultNationConventionalProfile();
        defenderNation.conventional = {
          ...profile,
          readiness: clamp(profile.readiness - (attackerVictory ? 14 : 7), 20, 100),
        };
      }

      syncState((prev) => {
        const updatedUnits = { ...prev.units };
        [...attackerUnits, ...defenderUnits].forEach((unit) => {
          const current = updatedUnits[unit.id];
          if (!current) return;
          const fatigue = unit.ownerId === attackerId
            ? (attackerVictory ? 12 : 18)
            : (attackerVictory ? 22 : 10);
          updatedUnits[unit.id] = {
            ...current,
            readiness: clamp(current.readiness - fatigue, 10, 100),
            experience: current.experience + (attackerVictory === (unit.ownerId === attackerId) ? 1 : 0),
          };
        });

        const nextState = {
          ...prev,
          units: updatedUnits,
        };

        return createEngagementLog(nextState, {
          turn: currentTurn,
          territoryId,
          type: 'border',
          outcome,
          summary: attackerVictory
            ? `${attackerId} seizes ${territory.name}`
            : `${defenderId} holds ${territory.name}`,
          casualties,
          instabilityDelta,
          productionDelta,
        });
      });

      onUpdateDisplay?.();
      onConsumeAction?.();
      return { success: true, attackerVictory, odds } as const;
    },
    [
      adjustNationInstability,
      currentTurn,
      getNation,
      onConsumeAction,
      onUpdateDisplay,
      syncState,
      territories,
      unitsByNation,
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

      const proxyOdds = clamp(0.45 + (sponsorReadiness - opposingReadiness) / 200, 0.2, 0.8);
      const roll = Math.random();
      const sponsorSuccess = roll < proxyOdds;

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
        }),
      );

      onUpdateDisplay?.();
      onConsumeAction?.();
      return { success: true, sponsorSuccess, odds: proxyOdds } as const;
    },
    [
      adjustNationInstability,
      adjustNationProduction,
      currentTurn,
      getNation,
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

  return {
    state,
    templates,
    territories,
    units: state.units,
    logs: state.logs,
    trainUnit,
    deployUnit,
    resolveBorderConflict,
    resolveProxyEngagement,
    getUnitsForNation,
    getTerritoriesForNation,
  };
}
