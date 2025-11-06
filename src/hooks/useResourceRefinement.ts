import { useCallback, useMemo, useState } from "react";
import type {
  RefinementBonus,
  RefinementOrder,
  Refinery,
  RefineryConversionRate,
  RefineryType,
  ResourceRefinementSystem,
  UseResourceRefinementParams,
} from "@/types/economicDepth";

const BASE_CONVERSION: Record<RefineryType, RefineryConversionRate> = {
  oil: {
    input: ["oil"],
    output: "fuel",
    baseYield: 5,
    bonusDescription: "+15% military effectiveness",
  },
  uranium: {
    input: ["uranium"],
    output: "enrichedUranium",
    baseYield: 2,
    bonusDescription: "+25% nuclear damage",
  },
  rareEarths: {
    input: ["rareEarths"],
    output: "advancedMaterials",
    baseYield: 3,
    bonusDescription: "+20% research speed",
  },
  steel: {
    input: ["iron", "coal"],
    output: "steel",
    baseYield: 4,
    bonusDescription: "+15% production",
  },
  electronics: {
    input: ["rareEarths", "steel"],
    output: "electronics",
    baseYield: 3,
    bonusDescription: "+30% cyber attack",
  },
  food: {
    input: ["food"],
    output: "processedFood",
    baseYield: 6,
    bonusDescription: "+10 morale",
  },
};

const BASE_BONUSES: RefinementBonus[] = [
  { id: "fuel", description: "+15% military effectiveness", value: 0.15 },
  { id: "enrichedUranium", description: "+25% nuclear damage", value: 0.25 },
  { id: "advancedMaterials", description: "+20% research speed", value: 0.2 },
  { id: "steel", description: "+15% production", value: 0.15 },
  { id: "electronics", description: "+30% cyber attack", value: 0.3 },
  { id: "processedFood", description: "+10 morale", value: 0.1 },
];

export function useResourceRefinement(
  params: UseResourceRefinementParams,
): ResourceRefinementSystem {
  const {
    initialRefineries = [],
    initialOrders = [],
    conversionRates = {},
  } = params;

  const [refineries, setRefineries] = useState<Refinery[]>(initialRefineries);
  const [orders, setOrders] = useState<RefinementOrder[]>(initialOrders);
  const [completedOutput, setCompletedOutput] = useState(0);

  const mergedConversionRates = useMemo(() => {
    return {
      ...BASE_CONVERSION,
      ...conversionRates,
    } as Record<RefineryType, RefineryConversionRate>;
  }, [conversionRates]);

  const totalOutput = useMemo(
    () =>
      orders.reduce(
        (total, order) => total + order.outputProduced,
        completedOutput,
      ),
    [completedOutput, orders],
  );

  const addRefinery = useCallback((refinery: Refinery) => {
    setRefineries((current) => {
      if (current.some((existing) => existing.id === refinery.id)) {
        return current.map((existing) =>
          existing.id === refinery.id ? { ...existing, ...refinery } : existing,
        );
      }
      return [...current, refinery];
    });
  }, []);

  const upgradeRefinery = useCallback((refineryId: string) => {
    setRefineries((current) =>
      current.map((refinery) =>
        refinery.id === refineryId
          ? {
              ...refinery,
              level: Math.min(5, refinery.level + 1),
              efficiency: Math.min(1, refinery.efficiency + 0.1),
            }
          : refinery,
      ),
    );
  }, []);

  const repairRefinery = useCallback((refineryId: string) => {
    setRefineries((current) =>
      current.map((refinery) =>
        refinery.id === refineryId
          ? {
              ...refinery,
              progress: Math.min(refinery.level * 100, refinery.progress + 20),
              efficiency: Math.min(1, refinery.efficiency + 0.05),
            }
          : refinery,
      ),
    );
  }, []);

  const scheduleOrder = useCallback((order: RefinementOrder) => {
    setOrders((current) => {
      if (current.some((existing) => existing.id === order.id)) {
        return current.map((existing) =>
          existing.id === order.id ? { ...existing, ...order } : existing,
        );
      }
      return [...current, order];
    });
  }, []);

  const cancelOrder = useCallback((orderId: string) => {
    setOrders((current) => current.filter((order) => order.id !== orderId));
  }, []);

  const processTurn = useCallback(() => {
    setOrders((current) => {
      let newlyCompletedOutput = 0;

      const processedOrders = current
        .map((order) => {
          const refineryType =
            refineries.find((refinery) => refinery.id === order.refineryId)?.type ??
            "oil";

          const updatedOrder: RefinementOrder = {
            ...order,
            turnsRemaining: Math.max(0, order.turnsRemaining - 1),
            outputProduced:
              order.outputProduced +
              mergedConversionRates[refineryType].baseYield,
          };

          if (updatedOrder.turnsRemaining === 0) {
            newlyCompletedOutput += updatedOrder.outputProduced;
          }

          return updatedOrder;
        })
        .filter((order) => order.turnsRemaining > 0);

      if (newlyCompletedOutput > 0) {
        setCompletedOutput((currentCompleted) => currentCompleted + newlyCompletedOutput);
      }

      return processedOrders;
    });

    setRefineries((current) =>
      current.map((refinery) => ({
        ...refinery,
        efficiency: Math.min(1, refinery.efficiency + 0.02),
        progress: Math.min(refinery.level * 100, refinery.progress + 10),
      })),
    );
  }, [mergedConversionRates, refineries]);

  return {
    refineries,
    orders,
    conversionRates: mergedConversionRates,
    bonuses: BASE_BONUSES,
    totalOutput,
    addRefinery,
    upgradeRefinery,
    scheduleOrder,
    cancelOrder,
    processTurn,
    repairRefinery,
  };
}
