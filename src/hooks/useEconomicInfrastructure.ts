/**
 * Economic Infrastructure Development Hook
 *
 * Manages economic buildings and zones that boost trade, production, and resources.
 * Includes trade ports, refineries, economic zones, and financial centers.
 */

import { useState, useCallback, useMemo } from 'react';
import type {
  EconomicInfrastructure,
  EconomicInfrastructureType,
  EconomicZone,
  InfrastructureEffect,
} from '../types/economicDepth';
import { INFRASTRUCTURE_COSTS } from '../types/economicDepth';
import type { Nation } from '../types/game';

export function useEconomicInfrastructure(
  nations: Nation[],
  currentTurn: number,
  currentNationId: string
) {
  const [infrastructure, setInfrastructure] = useState<EconomicInfrastructure[]>([]);
  const [economicZones, setEconomicZones] = useState<EconomicZone[]>([]);

  // ============================================================================
  // INFRASTRUCTURE CONSTRUCTION
  // ============================================================================

  const buildInfrastructure = useCallback(
    (
      nationId: string,
      territoryId: string,
      type: EconomicInfrastructureType
    ): EconomicInfrastructure | null => {
      const costs = INFRASTRUCTURE_COSTS[type];
      if (!costs) return null;

      const effects = getInfrastructureEffects(type, 1);

      const building: EconomicInfrastructure = {
        id: `infrastructure_${Date.now()}_${Math.random()}`,
        nationId,
        territoryId,
        type,
        name: formatInfrastructureName(type),
        level: 1,
        effects,
        capacity: costs.baseCapacity,
        currentUsage: 0,
        constructionCost: costs.baseCost,
        maintenanceCost: costs.baseMaintenanceCost,
        upgradeCost: Math.ceil(costs.baseCost * 1.5),
        upgradeTime: Math.ceil(costs.constructionTime * 0.8),
        status: 'under_construction',
        constructionProgress: 0,
        damagePenalty: 0,
        totalRevenue: 0,
        turnsOperating: 0,
        createdTurn: currentTurn,
      };

      setInfrastructure((prev) => [...prev, building]);
      return building;
    },
    [currentTurn]
  );

  const upgradeInfrastructure = useCallback((buildingId: string) => {
    setInfrastructure((prev) =>
      prev.map((building) => {
        if (building.id === buildingId && building.level < 5) {
          const newLevel = building.level + 1;
          const newEffects = getInfrastructureEffects(building.type, newLevel);

          return {
            ...building,
            level: newLevel,
            effects: newEffects,
            capacity: Math.ceil(building.capacity * 1.4),
            maintenanceCost: Math.ceil(building.maintenanceCost * 1.3),
            upgradeCost: Math.ceil(building.upgradeCost * 1.6),
            status: 'under_construction' as const,
            constructionProgress: 0,
          };
        }
        return building;
      })
    );
  }, []);

  const completeConstruction = useCallback((buildingId: string) => {
    setInfrastructure((prev) =>
      prev.map((building) =>
        building.id === buildingId
          ? {
              ...building,
              status: 'operational' as const,
              constructionProgress: 100,
            }
          : building
      )
    );
  }, []);

  const damageInfrastructure = useCallback(
    (buildingId: string, damagePercent: number) => {
      setInfrastructure((prev) =>
        prev.map((building) => {
          if (building.id === buildingId) {
            const newDamage = Math.min(
              1.0,
              building.damagePenalty + damagePercent / 100
            );
            return {
              ...building,
              damagePenalty: newDamage,
              status:
                newDamage >= 1.0
                  ? ('destroyed' as const)
                  : newDamage > 0.5
                  ? ('damaged' as const)
                  : building.status,
            };
          }
          return building;
        })
      );
    },
    []
  );

  const repairInfrastructure = useCallback((buildingId: string) => {
    setInfrastructure((prev) =>
      prev.map((building) =>
        building.id === buildingId
          ? {
              ...building,
              damagePenalty: 0,
              status: 'operational' as const,
            }
          : building
      )
    );
  }, []);

  const destroyInfrastructure = useCallback((buildingId: string) => {
    setInfrastructure((prev) =>
      prev.map((building) =>
        building.id === buildingId
          ? { ...building, status: 'destroyed' as const, damagePenalty: 1.0 }
          : building
      )
    );
  }, []);

  // ============================================================================
  // ECONOMIC ZONES
  // ============================================================================

  const createEconomicZone = useCallback(
    (
      nationId: string,
      name: string,
      territoryIds: string[]
    ): EconomicZone => {
      const zone: EconomicZone = {
        id: `economic_zone_${Date.now()}_${Math.random()}`,
        nationId,
        name,
        territoryIds,
        productionBonus: 0.15, // +15% production
        tradeBonus: 0.1, // +10% trade efficiency
        resourceBonus: {},
        minInfrastructure: 3, // Each territory needs level 3
        minConnectivity: 0.7, // 70% connectivity required
        isActive: false,
        turnsActive: 0,
        totalInvestment: 0,
      };

      setEconomicZones((prev) => [...prev, zone]);
      return zone;
    },
    []
  );

  const activateEconomicZone = useCallback((zoneId: string) => {
    setEconomicZones((prev) =>
      prev.map((zone) =>
        zone.id === zoneId ? { ...zone, isActive: true } : zone
      )
    );
  }, []);

  const deactivateEconomicZone = useCallback((zoneId: string) => {
    setEconomicZones((prev) =>
      prev.map((zone) =>
        zone.id === zoneId ? { ...zone, isActive: false, turnsActive: 0 } : zone
      )
    );
  }, []);

  const upgradeEconomicZone = useCallback((zoneId: string, investment: number) => {
    setEconomicZones((prev) =>
      prev.map((zone) => {
        if (zone.id === zoneId) {
          const newInvestment = zone.totalInvestment + investment;
          const bonusMultiplier = Math.floor(newInvestment / 500) * 0.05; // +5% per 500 invested

          return {
            ...zone,
            totalInvestment: newInvestment,
            productionBonus: 0.15 + bonusMultiplier,
            tradeBonus: 0.1 + bonusMultiplier * 0.5,
          };
        }
        return zone;
      })
    );
  }, []);

  // ============================================================================
  // TURN PROCESSING
  // ============================================================================

  const processInfrastructureTurn = useCallback(() => {
    // Update construction progress
    setInfrastructure((prev) =>
      prev.map((building) => {
        if (building.status === 'under_construction') {
          const progressIncrement = 100 / building.upgradeTime;
          const newProgress = Math.min(
            100,
            building.constructionProgress + progressIncrement
          );

          return {
            ...building,
            constructionProgress: newProgress,
            status:
              newProgress >= 100
                ? ('operational' as const)
                : building.status,
          };
        }

        // Generate revenue for operational buildings
        if (building.status === 'operational') {
          const effectiveness = 1 - building.damagePenalty;
          const revenue = calculateBuildingRevenue(building) * effectiveness;

          return {
            ...building,
            totalRevenue: building.totalRevenue + revenue,
            turnsOperating: building.turnsOperating + 1,
          };
        }

        return building;
      })
    );

    // Update economic zones
    setEconomicZones((prev) =>
      prev.map((zone) =>
        zone.isActive
          ? { ...zone, turnsActive: zone.turnsActive + 1 }
          : zone
      )
    );
  }, []);

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  function getInfrastructureEffects(
    type: EconomicInfrastructureType,
    level: number
  ): InfrastructureEffect[] {
    const baseAmount = level;

    switch (type) {
      case 'trade_port':
        return [
          { type: 'trade_capacity', amount: 5 * level },
          { type: 'trade_efficiency', amount: 0.05 * level },
        ];

      case 'trade_hub':
        return [
          { type: 'trade_capacity', amount: 8 * level },
          { type: 'trade_efficiency', amount: 0.08 * level },
        ];

      case 'refinery_complex':
        return [
          { type: 'refinery_capacity', amount: 4 * level },
          { type: 'production_boost', amount: 10 * level },
        ];

      case 'economic_zone':
        return [
          { type: 'production_boost', amount: 20 * level },
          { type: 'gold_generation', amount: 15 * level },
        ];

      case 'stock_exchange':
        return [
          { type: 'gold_generation', amount: 25 * level },
          { type: 'market_access', amount: 0.1 * level },
        ];

      case 'industrial_park':
        return [
          { type: 'production_boost', amount: 25 * level },
          { type: 'refinery_capacity', amount: 2 * level },
        ];

      case 'logistics_center':
        return [
          { type: 'trade_efficiency', amount: 0.15 * level },
          { type: 'trade_capacity', amount: 10 * level },
        ];

      case 'customs_office':
        return [
          { type: 'tariff_revenue', amount: 0.05 * level },
          { type: 'gold_generation', amount: 10 * level },
        ];

      case 'commodity_exchange':
        return [
          { type: 'market_access', amount: 0.15 * level },
          { type: 'gold_generation', amount: 20 * level },
        ];

      default:
        return [];
    }
  }

  function formatInfrastructureName(type: EconomicInfrastructureType): string {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  function calculateBuildingRevenue(building: EconomicInfrastructure): number {
    let revenue = 0;

    building.effects.forEach((effect) => {
      if (effect.type === 'gold_generation') {
        revenue += effect.amount;
      }
      if (effect.type === 'tariff_revenue') {
        // Tariff revenue would be calculated based on trade volume
        revenue += effect.amount * 100; // Simplified
      }
    });

    return revenue;
  }

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const nationInfrastructureStats = useMemo(() => {
    const stats = new Map<
      string,
      {
        totalBuildings: number;
        operationalBuildings: number;
        totalCapacity: Partial<Record<InfrastructureEffect['type'], number>>;
        totalRevenue: number;
        maintenanceCosts: number;
        infrastructureValue: number;
      }
    >();

    nations.forEach((nation) => {
      const nationBuildings = infrastructure.filter(
        (b) => b.nationId === nation.id
      );

      const operationalBuildings = nationBuildings.filter(
        (b) => b.status === 'operational'
      );

      const totalCapacity: Partial<Record<InfrastructureEffect['type'], number>> = {};
      let totalRevenue = 0;
      let maintenanceCosts = 0;
      let infrastructureValue = 0;

      nationBuildings.forEach((building) => {
        building.effects.forEach((effect) => {
          totalCapacity[effect.type] =
            (totalCapacity[effect.type] || 0) + effect.amount;
        });

        totalRevenue += building.totalRevenue;
        maintenanceCosts += building.maintenanceCost;
        infrastructureValue += building.constructionCost * building.level;
      });

      stats.set(nation.id, {
        totalBuildings: nationBuildings.length,
        operationalBuildings: operationalBuildings.length,
        totalCapacity,
        totalRevenue,
        maintenanceCosts,
        infrastructureValue,
      });
    });

    return stats;
  }, [infrastructure, nations]);

  const infrastructureScore = useMemo(() => {
    const scores = new Map<string, number>();

    nationInfrastructureStats.forEach((stats, nationId) => {
      let score = 0;

      // Score based on number and quality of buildings
      score += stats.operationalBuildings * 10;
      score += stats.infrastructureValue * 0.01;

      // Bonus for economic zones
      const nationZones = economicZones.filter(
        (z) => z.nationId === nationId && z.isActive
      );
      score += nationZones.length * 50;

      // Penalty for high maintenance costs
      score -= stats.maintenanceCosts * 0.5;

      scores.set(nationId, Math.max(0, Math.floor(score)));
    });

    return scores;
  }, [nationInfrastructureStats, economicZones]);

  return {
    // State
    infrastructure,
    economicZones,

    // Infrastructure Management
    buildInfrastructure,
    upgradeInfrastructure,
    completeConstruction,
    damageInfrastructure,
    repairInfrastructure,
    destroyInfrastructure,

    // Economic Zones
    createEconomicZone,
    activateEconomicZone,
    deactivateEconomicZone,
    upgradeEconomicZone,

    // Turn Processing
    processInfrastructureTurn,

    // Computed
    nationInfrastructureStats,
    infrastructureScore,
  };
}
