/**
 * Supply System Hook
 *
 * Manages supply sources, distribution, and logistics for military units.
 */

import { useState, useCallback, useEffect } from 'react';
import {
  SupplySource,
  Territory,
  SupplyRoute,
  SupplyState,
  SupplyDeficit,
  SupplyNetwork,
  SupplySourceType,
  InfrastructureProject,
  AttritionEffect,
  InfrastructureLevel,
  StationedUnitSummary,
} from '../types/supplySystem';

interface UseSupplySystemOptions {
  currentTurn: number;
  nations: Array<{ id: string; name: string; territories: string[] }>;
}

export function useSupplySystem({ currentTurn, nations }: UseSupplySystemOptions) {
  const [sources, setSources] = useState<Map<string, SupplySource>>(new Map());
  const [territories, setTerritories] = useState<Map<string, Territory>>(new Map());
  const [routes, setRoutes] = useState<Map<string, SupplyRoute>>(new Map());
  const [infrastructureProjects, setInfrastructureProjects] = useState<InfrastructureProject[]>([]);
  const [attritionEffects, setAttritionEffects] = useState<AttritionEffect[]>([]);

  /**
   * Initialize supply system for all nations
   */
  const initializeSupplySystem = useCallback(() => {
    const newSources = new Map<string, SupplySource>();
    const newTerritories = new Map<string, Territory>();

    nations.forEach((nation) => {
      // Create capital supply source
      if (nation.territories.length > 0) {
        const capitalId = nation.territories[0];
        const capitalSource: SupplySource = {
          id: `${nation.id}-capital-source`,
          nationId: nation.id,
          type: 'capital',
          territoryId: capitalId,
          baseSupply: 1000,
          bonusSupply: 0,
          totalSupply: 1000,
          supplyUsed: 0,
          supplyAvailable: 1000,
          supplyRange: 10,
          isActive: true,
          isDamaged: false,
          damageLevel: 0,
          level: 3,
          upgradeProgress: 0,
        };
        newSources.set(capitalSource.id, capitalSource);

        // Initialize territories
        nation.territories.forEach((territoryId, index) => {
          const territory: Territory = {
            id: territoryId,
            controllingNationId: nation.id,
            infrastructureLevel: index === 0 ? 5 : 3, // Capital has better infrastructure
            hasPort: false,
            hasAirbase: false,
            hasDepot: index === 0, // Capital has depot
            supplyCapacity: (index === 0 ? 5 : 3) * 100, // Based on infrastructure
            supplyDemand: 0,
            currentSupply: 0,
            supplyStatus: 'adequate',
            connectedSupplySources: index === 0 ? [capitalSource.id] : [],
            supplyDistance: index,
            attritionLevel: 0,
            stationedUnits: [],
          };
          newTerritories.set(territoryId, territory);
        });
      }
    });

    setSources(newSources);
    setTerritories(newTerritories);
  }, [nations]);

  /**
   * Get supply network status for a nation
   */
  const getSupplyNetwork = useCallback(
    (nationId: string): SupplyNetwork => {
      const nationSources = Array.from(sources.values()).filter((s) => s.nationId === nationId);
      const nationTerritories = Array.from(territories.values()).filter((t) => t.controllingNationId === nationId);

      const totalSupplyCapacity = nationSources.reduce((sum, s) => sum + s.totalSupply, 0);
      const totalSupplyDemand = nationTerritories.reduce((sum, t) => sum + t.supplyDemand, 0);

      // Calculate deficits
      const deficits: SupplyDeficit[] = nationTerritories
        .filter((t) => t.supplyDemand > t.currentSupply)
        .map((t) => ({
          nationId,
          territoryId: t.id,
          territoryName: t.id,
          unitsAffected: Math.floor(t.supplyDemand / 50), // Estimate
          supplyShortage: t.supplyDemand - t.currentSupply,
          attritionPerTurn: calculateAttrition(t),
          recommendedAction: getSupplyRecommendation(t),
        }));

      // Calculate efficiency
      const efficiency = totalSupplyDemand > 0 ? Math.min(100, (totalSupplyCapacity / totalSupplyDemand) * 100) : 100;

      return {
        nationId,
        totalSupplyCapacity,
        totalSupplyDemand,
        supplyBalance: totalSupplyCapacity - totalSupplyDemand,
        supplySources: nationSources,
        deficits,
        efficiency,
      };
    },
    [sources, territories]
  );

  /**
   * Create a new supply source (depot, port, airbase)
   */
  const createSupplySource = useCallback(
    (
      nationId: string,
      type: SupplySourceType,
      territoryId: string
    ): { success: boolean; message: string; sourceId?: string } => {
      const territory = territories.get(territoryId);
      if (!territory) {
        return { success: false, message: 'Territory not found' };
      }

      if (territory.controllingNationId !== nationId) {
        return { success: false, message: 'Territory not controlled by nation' };
      }

      // Check if already has this type of source
      if (type === 'depot' && territory.hasDepot) {
        return { success: false, message: 'Territory already has a depot' };
      }
      if (type === 'port' && territory.hasPort) {
        return { success: false, message: 'Territory already has a port' };
      }
      if (type === 'airbase' && territory.hasAirbase) {
        return { success: false, message: 'Territory already has an airbase' };
      }

      const baseSupplyByType: Record<SupplySourceType, number> = {
        capital: 1000,
        depot: 500,
        port: 400,
        airbase: 300,
      };

      const newSource: SupplySource = {
        id: `${nationId}-${type}-${territoryId}`,
        nationId,
        type,
        territoryId,
        baseSupply: baseSupplyByType[type],
        bonusSupply: 0,
        totalSupply: baseSupplyByType[type],
        supplyUsed: 0,
        supplyAvailable: baseSupplyByType[type],
        supplyRange: type === 'airbase' ? 15 : type === 'port' ? 8 : 5,
        isActive: true,
        isDamaged: false,
        damageLevel: 0,
        level: 1,
        upgradeProgress: 0,
      };

      setSources((prev) => {
        const newSources = new Map(prev);
        newSources.set(newSource.id, newSource);
        return newSources;
      });

      // Update territory
      setTerritories((prev) => {
        const newTerritories = new Map(prev);
        const updatedTerritory = { ...territory };
        if (type === 'depot') updatedTerritory.hasDepot = true;
        if (type === 'port') updatedTerritory.hasPort = true;
        if (type === 'airbase') updatedTerritory.hasAirbase = true;
        newTerritories.set(territoryId, updatedTerritory);
        return newTerritories;
      });

      return {
        success: true,
        message: `${type} created successfully`,
        sourceId: newSource.id,
      };
    },
    [territories]
  );

  /**
   * Upgrade infrastructure in a territory
   */
  const upgradeInfrastructure = useCallback(
    (
      nationId: string,
      territoryId: string,
      targetLevel: InfrastructureLevel
    ): { success: boolean; message: string } => {
      const territory = territories.get(territoryId);
      if (!territory) {
        return { success: false, message: 'Territory not found' };
      }

      if (territory.controllingNationId !== nationId) {
        return { success: false, message: 'Territory not controlled by nation' };
      }

      if (targetLevel <= territory.infrastructureLevel) {
        return { success: false, message: 'Target level must be higher than current level' };
      }

      if (targetLevel > 10) {
        return { success: false, message: 'Maximum infrastructure level is 10' };
      }

      const costPerLevel = 100;
      const turnsPerLevel = 3;
      const levelDiff = targetLevel - territory.infrastructureLevel;

      const project: InfrastructureProject = {
        id: `infra-${territoryId}-${Date.now()}`,
        territoryId,
        nationId,
        type: 'infrastructure',
        progress: 0,
        turnsRemaining: levelDiff * turnsPerLevel,
        productionCost: levelDiff * costPerLevel,
        currentLevel: territory.infrastructureLevel,
        targetLevel,
      };

      setInfrastructureProjects((prev) => [...prev, project]);

      return { success: true, message: `Infrastructure upgrade started` };
    },
    [territories]
  );

  /**
   * Update territory supply demand (from stationed units)
   */
  const updateSupplyDemand = useCallback(
    (territoryId: string, demand: number, stationedUnits?: StationedUnitSummary[]) => {
      setTerritories((prev) => {
        const newTerritories = new Map(prev);
        const territory = newTerritories.get(territoryId);

        if (!territory) return prev;

        const updatedTerritory = {
          ...territory,
          supplyDemand: demand,
          stationedUnits: stationedUnits ?? territory.stationedUnits,
        };

        // Update supply status
        const supplyRatio = updatedTerritory.currentSupply / Math.max(1, demand);
        if (supplyRatio >= 1.2) updatedTerritory.supplyStatus = 'oversupplied';
        else if (supplyRatio >= 0.8) updatedTerritory.supplyStatus = 'adequate';
        else if (supplyRatio >= 0.5) updatedTerritory.supplyStatus = 'low';
        else if (supplyRatio > 0) updatedTerritory.supplyStatus = 'critical';
        else updatedTerritory.supplyStatus = 'none';

        newTerritories.set(territoryId, updatedTerritory);
        return newTerritories;
      });
    },
    []
  );

  /**
   * Process supply distribution each turn
   */
  const processTurnSupply = useCallback(() => {
    // Calculate supply flow from sources to territories
    const newAttritionEffects: AttritionEffect[] = [];
    const previousAttritionByUnit = new Map(
      attritionEffects.map((effect) => [`${effect.unitId}:${effect.territoryId}`, effect.totalTurnsInAttrition])
    );

    setTerritories((prev) => {
      const newTerritories = new Map(prev);

      // Reset current supply
      for (const [id, territory] of newTerritories) {
        const resetTerritory = {
          ...territory,
          currentSupply: 0,
          connectedSupplySources: [],
        };
        newTerritories.set(id, resetTerritory);
      }

      // Distribute supply from each source
      for (const [sourceId, source] of sources) {
        if (!source.isActive) continue;

        const sourceTerritory = newTerritories.get(source.territoryId);
        if (!sourceTerritory) continue;

        // Supply flows to nearby territories
        for (const [territoryId, territory] of newTerritories) {
          if (territory.controllingNationId !== source.nationId) continue;

          // Calculate distance (simplified - would use actual pathfinding)
          const distance = Math.abs(
            parseInt(source.territoryId) - parseInt(territoryId)
          ) || 1;

          if (distance <= source.supplyRange) {
            // Supply diminishes with distance and infrastructure
            const efficiency = Math.max(0.3, 1 - (distance / source.supplyRange) * 0.5);
            const infraBonus = territory.infrastructureLevel / 10;
            const supplyAmount = source.totalSupply * efficiency * (0.5 + infraBonus * 0.5) / source.supplyRange;

            territory.currentSupply += supplyAmount;
            territory.connectedSupplySources.push(sourceId);
          }
        }
      }

      // Calculate attrition for undersupplied territories
      for (const [territoryId, territory] of newTerritories) {
        if (territory.supplyDemand > territory.currentSupply) {
          const shortage = territory.supplyDemand - territory.currentSupply;
          const attrition = Math.min(10, (shortage / territory.supplyDemand) * 5);
          territory.attritionLevel = attrition;

          // Log attrition (would be used to damage units)
          if (attrition > 1) {
            if (territory.stationedUnits.length > 0) {
              territory.stationedUnits.forEach((unit) => {
                const key = `${unit.id}:${territoryId}`;
                const previousTurns = previousAttritionByUnit.get(key) ?? 0;

                newAttritionEffects.push({
                  unitId: unit.id,
                  unitName: unit.name || `Unit ${unit.id}`,
                  territoryId,
                  attritionType: 'supply',
                  damagePerTurn: attrition,
                  organizationLoss: attrition * 2,
                  totalTurnsInAttrition: previousTurns + 1,
                });

                previousAttritionByUnit.set(key, previousTurns + 1);
              });
            } else {
              const fallbackKey = `territory:${territoryId}`;
              const previousTurns = previousAttritionByUnit.get(fallbackKey) ?? 0;

              newAttritionEffects.push({
                unitId: `${territoryId}-unknown`,
                unitName: `Units in ${territoryId}`,
                territoryId,
                attritionType: 'supply',
                damagePerTurn: attrition,
                organizationLoss: attrition * 2,
                totalTurnsInAttrition: previousTurns + 1,
              });

              previousAttritionByUnit.set(fallbackKey, previousTurns + 1);
            }
          }
        } else {
          territory.attritionLevel = 0;
        }
      }

      return newTerritories;
    });

    // Process infrastructure projects
    setInfrastructureProjects((prev) =>
      prev
        .map((project) => {
          const updated = { ...project };
          updated.turnsRemaining--;
          updated.progress = ((project.turnsRemaining - updated.turnsRemaining) / project.turnsRemaining) * 100;

          // Complete project
          if (updated.turnsRemaining <= 0 && project.type === 'infrastructure' && project.targetLevel) {
            setTerritories((territoryMap) => {
              const newTerritories = new Map(territoryMap);
              const territory = newTerritories.get(project.territoryId);
              if (territory) {
                territory.infrastructureLevel = project.targetLevel!;
                territory.supplyCapacity = project.targetLevel * 100;
                newTerritories.set(project.territoryId, { ...territory });
              }
              return newTerritories;
            });
          }

          return updated;
        })
        .filter((p) => p.turnsRemaining > 0)
    );

    setAttritionEffects(newAttritionEffects);
  }, [attritionEffects, sources]);

  /**
   * Get territory supply status
   */
  const getTerritorySupply = useCallback(
    (territoryId: string): Territory | undefined => {
      return territories.get(territoryId);
    },
    [territories]
  );

  /**
   * Get attrition effects
   */
  const getAttritionEffects = useCallback((): AttritionEffect[] => {
    return attritionEffects;
  }, [attritionEffects]);

  /**
   * Damage a supply source (from combat or sabotage)
   */
  const damageSupplySource = useCallback((sourceId: string, damageAmount: number) => {
    setSources((prev) => {
      const newSources = new Map(prev);
      const source = newSources.get(sourceId);

      if (!source) return prev;

      const updated = { ...source };
      updated.damageLevel = Math.min(100, updated.damageLevel + damageAmount);
      updated.isDamaged = updated.damageLevel > 0;

      // Reduce capacity based on damage
      const damageMultiplier = 1 - updated.damageLevel / 100;
      updated.totalSupply = Math.floor(updated.baseSupply * damageMultiplier);
      updated.supplyAvailable = updated.totalSupply;

      // Deactivate if heavily damaged
      if (updated.damageLevel >= 80) {
        updated.isActive = false;
      }

      newSources.set(sourceId, updated);
      return newSources;
    });
  }, []);

  /**
   * Repair a supply source
   */
  const repairSupplySource = useCallback((sourceId: string, repairAmount: number) => {
    setSources((prev) => {
      const newSources = new Map(prev);
      const source = newSources.get(sourceId);

      if (!source) return prev;

      const updated = { ...source };
      updated.damageLevel = Math.max(0, updated.damageLevel - repairAmount);
      updated.isDamaged = updated.damageLevel > 0;

      // Restore capacity
      const damageMultiplier = 1 - updated.damageLevel / 100;
      updated.totalSupply = Math.floor(updated.baseSupply * damageMultiplier);
      updated.supplyAvailable = updated.totalSupply;

      // Reactivate if repaired enough
      if (updated.damageLevel < 80) {
        updated.isActive = true;
      }

      newSources.set(sourceId, updated);
      return newSources;
    });
  }, []);

  // Helper functions
  const calculateAttrition = (territory: Territory): number => {
    if (territory.supplyDemand === 0) return 0;
    const shortage = Math.max(0, territory.supplyDemand - territory.currentSupply);
    return Math.min(10, (shortage / territory.supplyDemand) * 5);
  };

  const getSupplyRecommendation = (territory: Territory): string => {
    if (territory.supplyDemand > territory.currentSupply * 2) {
      return 'Critical: Build depot or reduce unit count';
    } else if (territory.infrastructureLevel < 5) {
      return 'Upgrade infrastructure to improve supply flow';
    } else if (!territory.hasDepot) {
      return 'Build supply depot';
    }
    return 'Optimize supply routes';
  };

  // Initialize on mount
  useEffect(() => {
    if (sources.size === 0) {
      initializeSupplySystem();
    }
  }, [initializeSupplySystem, sources.size]);

  return {
    // State
    sources,
    territories,
    routes,
    infrastructureProjects,
    attritionEffects,

    // Queries
    getSupplyNetwork,
    getTerritorySupply,
    getAttritionEffects,

    // Mutations
    createSupplySource,
    upgradeInfrastructure,
    updateSupplyDemand,
    damageSupplySource,
    repairSupplySource,

    // Turn processing
    processTurnSupply,

    // Initialization
    initializeSupplySystem,
  };
}

export type UseSupplySystemApi = ReturnType<typeof useSupplySystem>;
