import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useEconomicInfrastructure,
} from "@/hooks/useEconomicInfrastructure";
import { useEnhancedTradeSystem } from "@/hooks/useEnhancedTradeSystem";
import { useResourceRefinement } from "@/hooks/useResourceRefinement";
import type {
  EconomicDepthSnapshot,
  EconomicDepthSystem,
  NationId,
  UseEconomicDepthParams,
} from "@/types/economicDepth";

export function useEconomicDepth(params: UseEconomicDepthParams): EconomicDepthSystem {
  const { currentTurn, focusNationId: initialFocusNationId, tradeParams, refinementParams, infrastructureParams } = params;

  const [focusNationId, setFocusNationId] = useState<NationId | undefined>(initialFocusNationId);
  const [lastProcessedTurn, setLastProcessedTurn] = useState<number>(currentTurn);

  useEffect(() => {
    setLastProcessedTurn(currentTurn);
  }, [currentTurn]);

  useEffect(() => {
    setFocusNationId(initialFocusNationId);
  }, [initialFocusNationId]);

  const trade = useEnhancedTradeSystem(
    tradeParams ?? {
      nations: params.nations,
    },
  );

  const refinement = useResourceRefinement(
    refinementParams ?? {
      nations: params.nations,
    },
  );

  const infrastructure = useEconomicInfrastructure(
    infrastructureParams ?? {
      nations: params.nations,
    },
  );

  const snapshot = useMemo<EconomicDepthSnapshot>(() => {
    const economicPower =
      trade.statistics.totalCapacity * 0.3 +
      refinement.totalOutput * 0.4 +
      infrastructure.statistics.averageLevel * 10 -
      infrastructure.statistics.totalMaintenance;

    return {
      trade: trade.statistics,
      refinement: {
        totalOutput: refinement.totalOutput,
        activeRefineries: refinement.refineries.length,
        bonuses: refinement.bonuses,
      },
      infrastructure: infrastructure.statistics,
      economicPower,
    };
  }, [infrastructure.statistics, refinement.bonuses, refinement.refineries.length, refinement.totalOutput, trade.statistics]);

  const processEconomicTurn = useCallback(() => {
    trade.processTurn();
    refinement.processTurn();
    infrastructure.progressConstruction();
    setLastProcessedTurn((turn) => turn + 1);
  }, [infrastructure, refinement, trade]);

  const calculateEconomicPower = useCallback(() => snapshot.economicPower, [snapshot.economicPower]);

  const getEconomicRecommendations = useCallback(
    (nationId: NationId) => {
      const recommendations: string[] = [];

      if (trade.statistics.averageEfficiency < 0.7) {
        recommendations.push("Increase trade protection to improve efficiency");
      }

      if (refinement.refineries.filter((refinery) => refinery.owner === nationId).length < 2) {
        recommendations.push("Construct additional refineries to boost refined output");
      }

      if (infrastructure.statistics.damagedStructures > 0) {
        recommendations.push("Repair damaged infrastructure to restore bonuses");
      }

      if (recommendations.length === 0) {
        recommendations.push("Maintain current strategy; economic performance is stable");
      }

      return recommendations;
    },
    [infrastructure.statistics.damagedStructures, refinement.refineries, trade.statistics.averageEfficiency],
  );

  return {
    trade,
    refinement,
    infrastructure,
    snapshot: {
      ...snapshot,
      economicPower: snapshot.economicPower,
    },
    focusNationId,
    lastProcessedTurn,
    processEconomicTurn,
    calculateEconomicPower,
    getEconomicRecommendations,
    setFocusNationId,
  };
}
