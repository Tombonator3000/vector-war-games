/**
 * Resource Refinement System Hook
 *
 * Manages refineries that convert raw resources into refined materials.
 * Refined resources provide strategic bonuses and enable advanced gameplay.
 */

import { useState, useCallback, useMemo } from 'react';
import type {
  Refinery,
  RefineryType,
  RefinedResourceStockpile,
  RefinedResourceType,
  RefinementBonus,
} from '../types/economicDepth';
import { REFINERY_RECIPES, REFINED_RESOURCE_BONUSES } from '../types/economicDepth';
import type { Nation } from '../types/game';
import type { ResourceStockpile } from '../types/territorialResources';

export function useResourceRefinement(
  nations: Nation[],
  currentTurn: number,
  currentNationId: string
) {
  const [refineries, setRefineries] = useState<Refinery[]>([]);
  const [refinedStockpiles, setRefinedStockpiles] = useState<
    Map<string, RefinedResourceStockpile>
  >(new Map());

  // Initialize refined stockpiles for all nations
  const initializeStockpiles = useCallback(() => {
    const stockpiles = new Map<string, RefinedResourceStockpile>();
    nations.forEach((nation) => {
      stockpiles.set(nation.id, {
        fuel: 0,
        enriched_uranium: 0,
        advanced_materials: 0,
        steel: 0,
        electronics: 0,
        processed_food: 0,
      });
    });
    setRefinedStockpiles(stockpiles);
  }, [nations]);

  // ============================================================================
  // REFINERY MANAGEMENT
  // ============================================================================

  const buildRefinery = useCallback(
    (
      nationId: string,
      territoryId: string,
      type: RefineryType
    ): Refinery | null => {
      const recipe = REFINERY_RECIPES[type];
      if (!recipe) return null;

      const refinery: Refinery = {
        id: `refinery_${Date.now()}_${Math.random()}`,
        nationId,
        territoryId,
        type,
        level: 1,
        maxThroughput: 10, // Base throughput
        currentThroughput: 0,
        efficiency: 0.5, // Starts at 50%
        inputResources: recipe.inputs,
        outputResource: recipe.output.resource,
        outputAmount: recipe.output.amount,
        conversionRatio: 1.0,
        isActive: true,
        isPaused: false,
        maintenanceCost: 10,
        upgradeCost: 50,
        upgradeTime: 3,
        totalResourcesRefined: 0,
        turnsOperating: 0,
        createdTurn: currentTurn,
      };

      setRefineries((prev) => [...prev, refinery]);
      return refinery;
    },
    [currentTurn]
  );

  const upgradeRefinery = useCallback((refineryId: string) => {
    setRefineries((prev) =>
      prev.map((refinery) => {
        if (refinery.id === refineryId && refinery.level < 5) {
          return {
            ...refinery,
            level: refinery.level + 1,
            maxThroughput: Math.floor(refinery.maxThroughput * 1.5),
            efficiency: Math.min(1.0, refinery.efficiency + 0.1),
            maintenanceCost: Math.ceil(refinery.maintenanceCost * 1.3),
            upgradeCost: Math.ceil(refinery.upgradeCost * 1.8),
          };
        }
        return refinery;
      })
    );
  }, []);

  const toggleRefinery = useCallback((refineryId: string, pause: boolean) => {
    setRefineries((prev) =>
      prev.map((refinery) =>
        refinery.id === refineryId ? { ...refinery, isPaused: pause } : refinery
      )
    );
  }, []);

  const destroyRefinery = useCallback((refineryId: string) => {
    setRefineries((prev) => prev.filter((r) => r.id !== refineryId));
  }, []);

  // ============================================================================
  // REFINEMENT PROCESSING
  // ============================================================================

  const canRefine = useCallback(
    (
      refinery: Refinery,
      nationStockpile: Partial<ResourceStockpile> & { iron?: number; coal?: number }
    ): boolean => {
      if (!refinery.isActive || refinery.isPaused) return false;

      // Check if nation has input resources
      for (const [resource, amount] of Object.entries(refinery.inputResources)) {
        const available = nationStockpile[resource as keyof typeof nationStockpile] || 0;
        if (available < amount) {
          return false;
        }
      }

      return true;
    },
    []
  );

  const processRefinement = useCallback(
    (
      refinery: Refinery,
      nationStockpile: Partial<ResourceStockpile> & { iron?: number; coal?: number }
    ): {
      success: boolean;
      resourcesConsumed: Record<string, number>;
      resourcesProduced: { resource: RefinedResourceType; amount: number };
    } => {
      if (!canRefine(refinery, nationStockpile)) {
        return {
          success: false,
          resourcesConsumed: {},
          resourcesProduced: { resource: refinery.outputResource, amount: 0 },
        };
      }

      const consumed: Record<string, number> = {};

      // Consume input resources
      for (const [resource, amount] of Object.entries(refinery.inputResources)) {
        consumed[resource] = amount;
      }

      // Calculate output based on efficiency
      const baseOutput = refinery.outputAmount;
      const actualOutput = Math.floor(
        baseOutput * refinery.efficiency * refinery.conversionRatio
      );

      return {
        success: true,
        resourcesConsumed: consumed,
        resourcesProduced: {
          resource: refinery.outputResource,
          amount: actualOutput,
        },
      };
    },
    [canRefine]
  );

  const processAllRefineries = useCallback(
    (
      nationStockpiles: Map<string, Partial<ResourceStockpile> & { iron?: number; coal?: number }>
    ): Map<string, RefinedResourceStockpile> => {
      const newRefinedStockpiles = new Map(refinedStockpiles);

      setRefineries((prev) =>
        prev.map((refinery) => {
          const nationStockpile = nationStockpiles.get(refinery.nationId);
          if (!nationStockpile) return refinery;

          const result = processRefinement(refinery, nationStockpile);

          if (result.success) {
            // Update refined stockpile
            const refinedStockpile =
              newRefinedStockpiles.get(refinery.nationId) ||
              ({
                fuel: 0,
                enriched_uranium: 0,
                advanced_materials: 0,
                steel: 0,
                electronics: 0,
                processed_food: 0,
              } as RefinedResourceStockpile);

            refinedStockpile[result.resourcesProduced.resource] +=
              result.resourcesProduced.amount;

            newRefinedStockpiles.set(refinery.nationId, refinedStockpile);

            // Update refinery stats
            return {
              ...refinery,
              totalResourcesRefined:
                refinery.totalResourcesRefined + result.resourcesProduced.amount,
              turnsOperating: refinery.turnsOperating + 1,
              efficiency: Math.min(1.0, refinery.efficiency + 0.02), // Efficiency improves over time
            };
          }

          return refinery;
        })
      );

      setRefinedStockpiles(newRefinedStockpiles);
      return newRefinedStockpiles;
    },
    [refinedStockpiles, processRefinement]
  );

  // ============================================================================
  // REFINED RESOURCE USAGE
  // ============================================================================

  const consumeRefinedResource = useCallback(
    (
      nationId: string,
      resource: RefinedResourceType,
      amount: number
    ): boolean => {
      const stockpile = refinedStockpiles.get(nationId);
      if (!stockpile || stockpile[resource] < amount) {
        return false;
      }

      const newStockpiles = new Map(refinedStockpiles);
      const newStockpile = { ...stockpile };
      newStockpile[resource] -= amount;
      newStockpiles.set(nationId, newStockpile);
      setRefinedStockpiles(newStockpiles);

      return true;
    },
    [refinedStockpiles]
  );

  const getRefinementBonus = useCallback(
    (nationId: string, resource: RefinedResourceType): RefinementBonus | null => {
      const stockpile = refinedStockpiles.get(nationId);
      if (!stockpile || stockpile[resource] <= 0) {
        return null;
      }

      return REFINED_RESOURCE_BONUSES[resource];
    },
    [refinedStockpiles]
  );

  const getActiveRefinementBonuses = useCallback(
    (nationId: string): RefinementBonus[] => {
      const stockpile = refinedStockpiles.get(nationId);
      if (!stockpile) return [];

      const bonuses: RefinementBonus[] = [];

      (Object.keys(stockpile) as RefinedResourceType[]).forEach((resource) => {
        if (stockpile[resource] > 0) {
          bonuses.push(REFINED_RESOURCE_BONUSES[resource]);
        }
      });

      return bonuses;
    },
    [refinedStockpiles]
  );

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const nationRefineryStats = useMemo(() => {
    const stats = new Map<
      string,
      {
        totalRefineries: number;
        activeRefineries: number;
        totalOutput: Partial<Record<RefinedResourceType, number>>;
        totalThroughput: number;
        averageEfficiency: number;
      }
    >();

    nations.forEach((nation) => {
      const nationRefineries = refineries.filter(
        (r) => r.nationId === nation.id
      );

      const activeRefineries = nationRefineries.filter(
        (r) => r.isActive && !r.isPaused
      );

      const totalOutput: Partial<Record<RefinedResourceType, number>> = {};
      let totalThroughput = 0;
      let totalEfficiency = 0;

      activeRefineries.forEach((refinery) => {
        totalOutput[refinery.outputResource] =
          (totalOutput[refinery.outputResource] || 0) + refinery.outputAmount;
        totalThroughput += refinery.maxThroughput;
        totalEfficiency += refinery.efficiency;
      });

      stats.set(nation.id, {
        totalRefineries: nationRefineries.length,
        activeRefineries: activeRefineries.length,
        totalOutput,
        totalThroughput,
        averageEfficiency:
          activeRefineries.length > 0
            ? totalEfficiency / activeRefineries.length
            : 0,
      });
    });

    return stats;
  }, [refineries, nations]);

  const refineryProductionScore = useMemo(() => {
    const scores = new Map<string, number>();

    nationRefineryStats.forEach((stats, nationId) => {
      const stockpile = refinedStockpiles.get(nationId);
      if (!stockpile) {
        scores.set(nationId, 0);
        return;
      }

      let score = 0;

      // Score based on diversity and quantity of refined resources
      (Object.keys(stockpile) as RefinedResourceType[]).forEach((resource) => {
        score += stockpile[resource] * 0.1; // 0.1 point per refined resource
      });

      // Bonus for active refineries
      score += stats.activeRefineries * 10;

      // Bonus for high efficiency
      score += stats.averageEfficiency * 20;

      scores.set(nationId, Math.floor(score));
    });

    return scores;
  }, [nationRefineryStats, refinedStockpiles]);

  return {
    // State
    refineries,
    refinedStockpiles,

    // Initialization
    initializeStockpiles,

    // Refinery Management
    buildRefinery,
    upgradeRefinery,
    toggleRefinery,
    destroyRefinery,

    // Refinement Processing
    canRefine,
    processRefinement,
    processAllRefineries,

    // Resource Usage
    consumeRefinedResource,
    getRefinementBonus,
    getActiveRefinementBonuses,

    // Computed
    nationRefineryStats,
    refineryProductionScore,
  };
}
