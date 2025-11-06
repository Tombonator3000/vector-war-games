/**
 * Economic Depth Master Hook (Phase 3)
 *
 * Combines Trade System, Resource Refinement, and Infrastructure Development
 * into a unified economic gameplay system inspired by Hearts of Iron IV.
 */

import { useCallback, useMemo } from 'react';
import { useEnhancedTradeSystem } from './useEnhancedTradeSystem';
import { useResourceRefinement } from './useResourceRefinement';
import { useEconomicInfrastructure } from './useEconomicInfrastructure';
import type { Nation } from '../types/game';
import type { EconomicPower, EconomicDepthState } from '../types/economicDepth';
import type { ResourceStockpile } from '../types/territorialResources';

export function useEconomicDepth(
  nations: Nation[],
  currentTurn: number,
  currentNationId: string
) {
  // Initialize sub-systems
  const tradeSystem = useEnhancedTradeSystem(nations, currentTurn, currentNationId);
  const refinementSystem = useResourceRefinement(nations, currentTurn, currentNationId);
  const infrastructureSystem = useEconomicInfrastructure(nations, currentTurn, currentNationId);

  // ============================================================================
  // UNIFIED TURN PROCESSING
  // ============================================================================

  const processEconomicTurn = useCallback(
    (nationStockpiles: Map<string, Partial<ResourceStockpile> & { iron?: number; coal?: number }>) => {
      // 1. Process trade routes (resources transferred)
      tradeSystem.processTradeTurn();

      // 2. Process refineries (convert resources)
      refinementSystem.processAllRefineries(nationStockpiles);

      // 3. Process infrastructure (generate revenue, complete construction)
      infrastructureSystem.processInfrastructureTurn();
    },
    [tradeSystem, refinementSystem, infrastructureSystem]
  );

  // ============================================================================
  // ECONOMIC POWER CALCULATION
  // ============================================================================

  const calculateEconomicPower = useCallback((): Map<string, EconomicPower> => {
    const economicPowers = new Map<string, EconomicPower>();

    nations.forEach((nation) => {
      // Trade score
      const tradeStats = tradeSystem.nationTradeStats.get(nation.id);
      const tradeScore = tradeStats
        ? tradeStats.activeRoutes * 10 +
          tradeStats.tradePartners.size * 20 +
          Math.floor(tradeStats.tradeBalance * 0.1)
        : 0;

      // Refinement score
      const refinementScore = refinementSystem.refineryProductionScore.get(nation.id) || 0;

      // Infrastructure score
      const infrastructureScore = infrastructureSystem.infrastructureScore.get(nation.id) || 0;

      // Total economic score
      const totalScore = tradeScore + refinementScore + infrastructureScore;

      // Calculate metrics
      const tradeVolume = tradeStats
        ? tradeStats.totalExports + tradeStats.totalImports
        : 0;

      const refineryStats = refinementSystem.nationRefineryStats.get(nation.id);
      const refineryOutput = refineryStats
        ? Object.values(refineryStats.totalOutput).reduce((sum, val) => sum + val, 0)
        : 0;

      const infraStats = infrastructureSystem.nationInfrastructureStats.get(nation.id);
      const infrastructureValue = infraStats ? infraStats.infrastructureValue : 0;

      economicPowers.set(nation.id, {
        nationId: nation.id,
        tradeScore,
        refinementScore,
        infrastructureScore,
        totalScore,
        globalRank: 0, // Will be set after sorting
        regionalRank: 0,
        tradeVolume,
        refineryOutput,
        infrastructureValue,
        goldReserves: nation.gold || 0,
        economicVictoryProgress: calculateEconomicVictoryProgress(
          tradeStats,
          refineryStats,
          infraStats
        ),
      });
    });

    // Calculate rankings
    const sortedNations = Array.from(economicPowers.values()).sort(
      (a, b) => b.totalScore - a.totalScore
    );

    sortedNations.forEach((power, index) => {
      const updated = economicPowers.get(power.nationId)!;
      updated.globalRank = index + 1;
      economicPowers.set(power.nationId, updated);
    });

    return economicPowers;
  }, [nations, tradeSystem, refinementSystem, infrastructureSystem]);

  function calculateEconomicVictoryProgress(
    tradeStats: any,
    refineryStats: any,
    infraStats: any
  ): number {
    let progress = 0;

    // Trade routes (15 required) - 25% of victory
    const tradeRoutes = tradeStats?.activeRoutes || 0;
    progress += Math.min(25, (tradeRoutes / 15) * 25);

    // Trade volume (500 required) - 20% of victory
    const tradeVolume = tradeStats
      ? tradeStats.totalExports + tradeStats.totalImports
      : 0;
    progress += Math.min(20, (tradeVolume / 500) * 20);

    // Refineries (10 required) - 20% of victory
    const refineries = refineryStats?.totalRefineries || 0;
    progress += Math.min(20, (refineries / 10) * 20);

    // Infrastructure (20 buildings required) - 20% of victory
    const infrastructure = infraStats?.operationalBuildings || 0;
    progress += Math.min(20, (infrastructure / 20) * 20);

    // Gold reserves (5000 required) - 15% of victory
    const gold = infraStats?.totalRevenue || 0;
    progress += Math.min(15, (gold / 5000) * 15);

    return Math.floor(progress);
  }

  // ============================================================================
  // UNIFIED STATE
  // ============================================================================

  const economicDepthState: EconomicDepthState = useMemo(
    () => ({
      // Trade
      tradeAgreements: tradeSystem.tradeAgreements,
      tradeRoutes: tradeSystem.tradeRoutes,
      tradeHubs: tradeSystem.tradeHubs,
      tradeProposals: tradeSystem.tradeProposals,
      economicSanctions: tradeSystem.economicSanctions,

      // Refinement
      refineries: refinementSystem.refineries,
      refinedStockpiles: refinementSystem.refinedStockpiles,

      // Infrastructure
      economicInfrastructure: infrastructureSystem.infrastructure,
      economicZones: infrastructureSystem.economicZones,

      // Scoring
      economicPower: calculateEconomicPower(),

      // Events (placeholder for future implementation)
      activeEconomicCrises: [],
      crisisHistory: [],
    }),
    [
      tradeSystem,
      refinementSystem,
      infrastructureSystem,
      calculateEconomicPower,
    ]
  );

  // ============================================================================
  // ECONOMIC RECOMMENDATIONS (AI Helper)
  // ============================================================================

  const getEconomicRecommendations = useCallback(
    (nationId: string): string[] => {
      const recommendations: string[] = [];

      const tradeStats = tradeSystem.nationTradeStats.get(nationId);
      const refineryStats = refinementSystem.nationRefineryStats.get(nationId);
      const infraStats = infrastructureSystem.nationInfrastructureStats.get(nationId);

      // Trade recommendations
      if (!tradeStats || tradeStats.activeRoutes < 3) {
        recommendations.push(
          'Establish more trade routes to boost economic growth'
        );
      }

      if (tradeStats && tradeStats.tradeBalance < -50) {
        recommendations.push(
          'Trade deficit detected - consider exporting more resources'
        );
      }

      // Refinement recommendations
      if (!refineryStats || refineryStats.totalRefineries === 0) {
        recommendations.push(
          'Build refineries to convert raw resources into valuable materials'
        );
      }

      if (refineryStats && refineryStats.averageEfficiency < 0.7) {
        recommendations.push(
          'Upgrade refineries to improve efficiency and output'
        );
      }

      // Infrastructure recommendations
      if (!infraStats || infraStats.totalBuildings < 5) {
        recommendations.push(
          'Invest in economic infrastructure to boost production and trade'
        );
      }

      if (infraStats && infraStats.maintenanceCosts > infraStats.totalRevenue) {
        recommendations.push(
          'Infrastructure maintenance costs exceed revenue - optimize or shut down unprofitable buildings'
        );
      }

      return recommendations;
    },
    [tradeSystem, refinementSystem, infrastructureSystem]
  );

  // ============================================================================
  // RETURN INTERFACE
  // ============================================================================

  return {
    // Complete state
    state: economicDepthState,

    // Sub-systems (full access to all functionality)
    trade: tradeSystem,
    refinement: refinementSystem,
    infrastructure: infrastructureSystem,

    // Unified processing
    processEconomicTurn,

    // Economic power & scoring
    calculateEconomicPower,
    getEconomicRecommendations,

    // Quick stats
    globalTradeVolume: tradeSystem.globalTradeVolume,
    nationTradeStats: tradeSystem.nationTradeStats,
    nationRefineryStats: refinementSystem.nationRefineryStats,
    nationInfrastructureStats: infrastructureSystem.nationInfrastructureStats,
  };
}
