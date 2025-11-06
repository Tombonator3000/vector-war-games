import { useCallback, useMemo, useState } from "react";
import type {
  EconomicSanction,
  EnhancedTradeSystem,
  TradeAgreement,
  TradeProposal,
  TradeRoute,
  TradeStatistics,
  TradeGood,
  UseEnhancedTradeSystemParams,
} from "@/types/economicDepth";

const DEFAULT_GOODS: TradeGood[] = [
  { id: "oil", name: "Crude Oil", category: "raw" },
  { id: "fuel", name: "Refined Fuel", category: "refined" },
  { id: "steel", name: "Steel", category: "manufactured" },
  { id: "electronics", name: "Electronics", category: "manufactured" },
  { id: "food", name: "Processed Food", category: "refined" },
];

export function useEnhancedTradeSystem(
  params: UseEnhancedTradeSystemParams,
): EnhancedTradeSystem {
  const {
    initialRoutes = [],
    initialAgreements = [],
    initialSanctions = [],
    goods = DEFAULT_GOODS,
  } = params;

  const [routes, setRoutes] = useState<TradeRoute[]>(initialRoutes);
  const [agreements, setAgreements] = useState<TradeAgreement[]>(initialAgreements);
  const [proposals, setProposals] = useState<TradeProposal[]>([]);
  const [sanctions, setSanctions] = useState<EconomicSanction[]>(initialSanctions);

  const statistics = useMemo<TradeStatistics>(() => {
    if (routes.length === 0) {
      return {
        totalCapacity: 0,
        averageEfficiency: 0,
        disruptedRoutes: 0,
        activeAgreements: agreements.length,
        sanctions: sanctions.length,
      };
    }

    const totalCapacity = routes.reduce((sum, route) => sum + route.capacity, 0);
    const averageEfficiency =
      routes.reduce((sum, route) => sum + route.efficiency, 0) / routes.length;
    const disruptedRoutes = routes.filter((route) => route.disruptionRisk > 0.5).length;

    return {
      totalCapacity,
      averageEfficiency,
      disruptedRoutes,
      activeAgreements: agreements.length,
      sanctions: sanctions.length,
    };
  }, [agreements.length, routes, sanctions.length]);

  const proposeTrade = useCallback((proposal: TradeProposal) => {
    setProposals((current) => {
      if (current.some((existing) => existing.id === proposal.id)) {
        return current.map((existing) =>
          existing.id === proposal.id ? { ...existing, ...proposal } : existing,
        );
      }
      return [...current, proposal];
    });
  }, []);

  const withdrawProposal = useCallback((proposalId: string) => {
    setProposals((current) => current.filter((proposal) => proposal.id !== proposalId));
  }, []);

  const finalizeTrade = useCallback(
    (proposalId: string, route: TradeRoute, agreement: TradeAgreement) => {
      setProposals((current) => current.filter((proposal) => proposal.id !== proposalId));
      setRoutes((current) => {
        if (current.some((existing) => existing.id === route.id)) {
          return current.map((existing) =>
            existing.id === route.id ? { ...existing, ...route } : existing,
          );
        }
        return [...current, route];
      });
      setAgreements((current) => {
        if (current.some((existing) => existing.id === agreement.id)) {
          return current.map((existing) =>
            existing.id === agreement.id ? { ...existing, ...agreement } : existing,
          );
        }
        return [...current, agreement];
      });
    },
    [],
  );

  const updateRouteEfficiency = useCallback((routeId: string, efficiency: number) => {
    setRoutes((current) =>
      current.map((route) =>
        route.id === routeId
          ? { ...route, efficiency: Math.min(1, Math.max(0, efficiency)) }
          : route,
      ),
    );
  }, []);

  const protectRoute = useCallback((routeId: string, naval: number, air: number) => {
    setRoutes((current) =>
      current.map((route) =>
        route.id === routeId
          ? {
              ...route,
              protection: {
                naval: Math.min(1, Math.max(0, naval)),
                air: Math.min(1, Math.max(0, air)),
              },
              disruptionRisk: Math.max(0, route.disruptionRisk - (naval + air) / 4),
            }
          : route,
      ),
    );
  }, []);

  const disruptRoute = useCallback((routeId: string, disruption: number) => {
    setRoutes((current) =>
      current.map((route) =>
        route.id === routeId
          ? {
              ...route,
              disruptionRisk: Math.min(1, Math.max(0, disruption)),
              efficiency: Math.max(0, route.efficiency - disruption * 0.2),
            }
          : route,
      ),
    );
  }, []);

  const imposeSanction = useCallback((sanction: EconomicSanction) => {
    setSanctions((current) => {
      if (current.some((existing) => existing.id === sanction.id)) {
        return current.map((existing) =>
          existing.id === sanction.id ? { ...existing, ...sanction } : existing,
        );
      }
      return [...current, sanction];
    });
  }, []);

  const liftSanction = useCallback((sanctionId: string) => {
    setSanctions((current) => current.filter((sanction) => sanction.id !== sanctionId));
  }, []);

  const processTurn = useCallback(() => {
    setRoutes((current) =>
      current.map((route) => ({
        ...route,
        disruptionRisk: Math.max(0, route.disruptionRisk - 0.05),
        efficiency: Math.min(1, route.efficiency + 0.02),
      })),
    );

    setAgreements((current) =>
      current
        .map((agreement) => ({
          ...agreement,
          turnsRemaining: Math.max(0, agreement.turnsRemaining - 1),
        }))
        .filter((agreement) => agreement.turnsRemaining > 0),
    );

    setSanctions((current) =>
      current
        .map((sanction) =>
          sanction.turnsRemaining === undefined
            ? sanction
            : {
                ...sanction,
                turnsRemaining: Math.max(0, sanction.turnsRemaining - 1),
              },
        )
        .filter((sanction) => sanction.turnsRemaining === undefined || sanction.turnsRemaining > 0),
    );
  }, []);

  return {
    routes,
    agreements,
    proposals,
    sanctions,
    goods,
    statistics,
    proposeTrade,
    withdrawProposal,
    finalizeTrade,
    updateRouteEfficiency,
    protectRoute,
    disruptRoute,
    imposeSanction,
    liftSanction,
    processTurn,
  };
}
