/**
 * Enhanced Trade System Hook
 *
 * Manages international trade agreements, trade routes, and economic sanctions.
 * Inspired by Hearts of Iron IV trade mechanics.
 */

import { useState, useCallback, useMemo } from 'react';
import type {
  TradeAgreement,
  EnhancedTradeRoute,
  TradeHub,
  TradeProposal,
  EconomicSanction,
  TradeAgreementType,
  TradeRouteStatus,
  TradeExchange,
} from '../types/economicDepth';
import type { Nation } from '../types/game';
import type { StrategyResourceType } from '../types/territorialResources';

export function useEnhancedTradeSystem(
  nations: Nation[],
  currentTurn: number,
  currentNationId: string
) {
  const [tradeAgreements, setTradeAgreements] = useState<TradeAgreement[]>([]);
  const [tradeRoutes, setTradeRoutes] = useState<EnhancedTradeRoute[]>([]);
  const [tradeHubs, setTradeHubs] = useState<TradeHub[]>([]);
  const [tradeProposals, setTradeProposals] = useState<TradeProposal[]>([]);
  const [economicSanctions, setEconomicSanctions] = useState<EconomicSanction[]>([]);

  // ============================================================================
  // TRADE AGREEMENTS
  // ============================================================================

  const proposeTradeAgreement = useCallback(
    (
      participantIds: string[],
      type: TradeAgreementType,
      exchanges: TradeExchange[],
      duration: number
    ): TradeAgreement => {
      const agreement: TradeAgreement = {
        id: `trade_agreement_${Date.now()}_${Math.random()}`,
        name: `Trade Agreement ${currentTurn}`,
        type,
        participantIds,
        duration,
        totalDuration: duration,
        createdTurn: currentTurn,
        resourceExchanges: exchanges,
        tariffs: {},
        tradeEfficiencyBonus: 0.1, // 10% efficiency bonus
        diplomaticBonus: 5,
        status: 'proposed',
        canRenegotiate: true,
      };

      setTradeAgreements((prev) => [...prev, agreement]);
      return agreement;
    },
    [currentTurn]
  );

  const acceptTradeAgreement = useCallback((agreementId: string) => {
    setTradeAgreements((prev) =>
      prev.map((agreement) =>
        agreement.id === agreementId
          ? { ...agreement, status: 'active' as const }
          : agreement
      )
    );

    // Create trade routes for each exchange
    const agreement = tradeAgreements.find((a) => a.id === agreementId);
    if (agreement) {
      agreement.resourceExchanges.forEach((exchange) => {
        createTradeRoute(
          agreementId,
          exchange.fromNationId,
          exchange.toNationId,
          exchange.resource,
          exchange.amountPerTurn
        );
      });
    }
  }, [tradeAgreements]);

  const cancelTradeAgreement = useCallback((agreementId: string) => {
    setTradeAgreements((prev) =>
      prev.map((agreement) =>
        agreement.id === agreementId
          ? { ...agreement, status: 'cancelled' as const }
          : agreement
      )
    );

    // Deactivate associated trade routes
    setTradeRoutes((prev) =>
      prev.map((route) =>
        route.agreementId === agreementId
          ? { ...route, status: 'suspended' as TradeRouteStatus }
          : route
      )
    );
  }, []);

  // ============================================================================
  // TRADE ROUTES
  // ============================================================================

  const createTradeRoute = useCallback(
    (
      agreementId: string,
      fromNationId: string,
      toNationId: string,
      resourceType: StrategyResourceType,
      amountPerTurn: number
    ): EnhancedTradeRoute => {
      const route: EnhancedTradeRoute = {
        id: `trade_route_${Date.now()}_${Math.random()}`,
        agreementId,
        fromNationId,
        toNationId,
        resourceType,
        amountPerTurn,
        routePath: [], // Would calculate based on territories
        maintenanceCost: Math.ceil(amountPerTurn * 0.1), // 10% of amount
        efficiency: 1.0,
        vulnerabilityScore: 20, // Base 20% vulnerability
        status: 'active',
        turnsDisrupted: 0,
        navalProtection: 0,
        airCover: 0,
        totalResourcesTransferred: 0,
        totalProfitGenerated: 0,
        createdTurn: currentTurn,
      };

      setTradeRoutes((prev) => [...prev, route]);
      return route;
    },
    [currentTurn]
  );

  const disruptTradeRoute = useCallback(
    (routeId: string, reason: string, duration: number = 3) => {
      setTradeRoutes((prev) =>
        prev.map((route) =>
          route.id === routeId
            ? {
                ...route,
                status: 'disrupted' as TradeRouteStatus,
                turnsDisrupted: duration,
                lastDisruptionReason: reason,
              }
            : route
        )
      );
    },
    []
  );

  const assignRouteProtection = useCallback(
    (routeId: string, navalUnits: number, airUnits: number) => {
      setTradeRoutes((prev) =>
        prev.map((route) =>
          route.id === routeId
            ? {
                ...route,
                navalProtection: navalUnits,
                airCover: airUnits,
                vulnerabilityScore: Math.max(
                  5,
                  route.vulnerabilityScore - navalUnits * 5 - airUnits * 3
                ),
              }
            : route
        )
      );
    },
    []
  );

  // ============================================================================
  // TRADE HUBS
  // ============================================================================

  const buildTradeHub = useCallback(
    (territoryId: string, nationId: string): TradeHub => {
      const hub: TradeHub = {
        territoryId,
        nationId,
        level: 1,
        tradeEfficiencyBonus: 0.1,
        routeCapacity: 5,
        activeRoutes: [],
        maintenanceCost: 15,
        upgradeCost: 100,
      };

      setTradeHubs((prev) => [...prev, hub]);
      return hub;
    },
    []
  );

  const upgradeTradeHub = useCallback((territoryId: string) => {
    setTradeHubs((prev) =>
      prev.map((hub) =>
        hub.territoryId === territoryId && hub.level < 5
          ? {
              ...hub,
              level: hub.level + 1,
              tradeEfficiencyBonus: hub.tradeEfficiencyBonus + 0.05,
              routeCapacity: hub.routeCapacity + 3,
              maintenanceCost: Math.ceil(hub.maintenanceCost * 1.2),
              upgradeCost: Math.ceil(hub.upgradeCost * 1.5),
            }
          : hub
      )
    );
  }, []);

  // ============================================================================
  // TRADE PROPOSALS
  // ============================================================================

  const createTradeProposal = useCallback(
    (
      targetNationId: string,
      offering: Partial<Record<StrategyResourceType, number>>,
      requesting: Partial<Record<StrategyResourceType, number>>,
      duration: number,
      pricePerTurn?: number
    ): TradeProposal => {
      const proposal: TradeProposal = {
        id: `trade_proposal_${Date.now()}_${Math.random()}`,
        proposerId: currentNationId,
        targetNationId,
        offering,
        requesting,
        duration,
        pricePerTurn,
        status: 'pending',
        proposedTurn: currentTurn,
        expiresAtTurn: currentTurn + 5, // Expires in 5 turns
      };

      setTradeProposals((prev) => [...prev, proposal]);
      return proposal;
    },
    [currentNationId, currentTurn]
  );

  const acceptTradeProposal = useCallback((proposalId: string) => {
    const proposal = tradeProposals.find((p) => p.id === proposalId);
    if (!proposal) return;

    setTradeProposals((prev) =>
      prev.map((p) =>
        p.id === proposalId ? { ...p, status: 'accepted' as const } : p
      )
    );

    // Create bilateral trade agreement
    const exchanges: TradeExchange[] = [];

    Object.entries(proposal.offering).forEach(([resource, amount]) => {
      exchanges.push({
        fromNationId: proposal.proposerId,
        toNationId: proposal.targetNationId,
        resource: resource as StrategyResourceType,
        amountPerTurn: amount,
        pricePerUnit: proposal.pricePerTurn,
      });
    });

    Object.entries(proposal.requesting).forEach(([resource, amount]) => {
      exchanges.push({
        fromNationId: proposal.targetNationId,
        toNationId: proposal.proposerId,
        resource: resource as StrategyResourceType,
        amountPerTurn: amount,
      });
    });

    proposeTradeAgreement(
      [proposal.proposerId, proposal.targetNationId],
      'bilateral',
      exchanges,
      proposal.duration
    );
  }, [tradeProposals, proposeTradeAgreement]);

  const rejectTradeProposal = useCallback(
    (proposalId: string, reason?: string) => {
      setTradeProposals((prev) =>
        prev.map((p) =>
          p.id === proposalId
            ? { ...p, status: 'rejected' as const, rejectionReason: reason }
            : p
        )
      );
    },
    []
  );

  // ============================================================================
  // ECONOMIC SANCTIONS
  // ============================================================================

  const imposeSanction = useCallback(
    (
      targetNationId: string,
      type: EconomicSanction['type'],
      restrictedResources: StrategyResourceType[],
      duration: number
    ): EconomicSanction => {
      const sanction: EconomicSanction = {
        id: `sanction_${Date.now()}_${Math.random()}`,
        issuingNationId: currentNationId,
        targetNationId,
        type,
        restrictedResources,
        tradeReduction: type === 'full_embargo' ? 100 : 50,
        productionPenalty: type === 'full_embargo' ? 0.2 : 0.1,
        diplomaticCost: 25,
        duration,
        startedTurn: currentTurn,
        canBeLifted: true,
        supportingNations: [],
        internationalSupport: 0,
      };

      setEconomicSanctions((prev) => [...prev, sanction]);

      // Disrupt trade routes with target
      tradeRoutes.forEach((route) => {
        if (
          route.toNationId === targetNationId ||
          route.fromNationId === targetNationId
        ) {
          disruptTradeRoute(
            route.id,
            `Economic sanctions from ${currentNationId}`,
            duration
          );
        }
      });

      return sanction;
    },
    [currentNationId, currentTurn, tradeRoutes, disruptTradeRoute]
  );

  const liftSanction = useCallback((sanctionId: string) => {
    setEconomicSanctions((prev) => prev.filter((s) => s.id !== sanctionId));
  }, []);

  const joinSanction = useCallback(
    (sanctionId: string, supportingNationId: string) => {
      setEconomicSanctions((prev) =>
        prev.map((sanction) =>
          sanction.id === sanctionId
            ? {
                ...sanction,
                supportingNations: [
                  ...sanction.supportingNations,
                  supportingNationId,
                ],
                internationalSupport:
                  sanction.internationalSupport +
                  Math.min(20, 100 / nations.length),
              }
            : sanction
        )
      );
    },
    [nations.length]
  );

  // ============================================================================
  // TURN PROCESSING
  // ============================================================================

  const processTradeTurn = useCallback(() => {
    // Process active trade routes
    setTradeRoutes((prev) =>
      prev.map((route) => {
        if (route.status !== 'active') {
          // Decrement disruption timer
          if (route.turnsDisrupted > 0) {
            return {
              ...route,
              turnsDisrupted: route.turnsDisrupted - 1,
              status:
                route.turnsDisrupted <= 1
                  ? ('active' as TradeRouteStatus)
                  : route.status,
            };
          }
          return route;
        }

        // Calculate resources transferred
        const transferred = Math.floor(route.amountPerTurn * route.efficiency);

        return {
          ...route,
          totalResourcesTransferred:
            route.totalResourcesTransferred + transferred,
        };
      })
    );

    // Process trade agreements duration
    setTradeAgreements((prev) =>
      prev.map((agreement) => {
        if (agreement.status === 'active') {
          const newDuration = agreement.duration - 1;
          return {
            ...agreement,
            duration: newDuration,
            status: newDuration <= 0 ? ('expired' as const) : agreement.status,
          };
        }
        return agreement;
      })
    );

    // Process economic sanctions
    setEconomicSanctions((prev) =>
      prev
        .map((sanction) => ({
          ...sanction,
          duration: sanction.duration - 1,
        }))
        .filter((sanction) => sanction.duration > 0)
    );

    // Expire old proposals
    setTradeProposals((prev) =>
      prev.filter((proposal) => proposal.expiresAtTurn > currentTurn)
    );
  }, [currentTurn]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const nationTradeStats = useMemo(() => {
    const stats = new Map<
      string,
      {
        totalExports: number;
        totalImports: number;
        tradeBalance: number;
        activeRoutes: number;
        tradePartners: Set<string>;
      }
    >();

    nations.forEach((nation) => {
      stats.set(nation.id, {
        totalExports: 0,
        totalImports: 0,
        tradeBalance: 0,
        activeRoutes: 0,
        tradePartners: new Set(),
      });
    });

    tradeRoutes.forEach((route) => {
      if (route.status === 'active') {
        const fromStats = stats.get(route.fromNationId);
        const toStats = stats.get(route.toNationId);

        if (fromStats) {
          fromStats.totalExports += route.amountPerTurn;
          fromStats.activeRoutes += 1;
          fromStats.tradePartners.add(route.toNationId);
        }

        if (toStats) {
          toStats.totalImports += route.amountPerTurn;
          toStats.tradePartners.add(route.fromNationId);
        }
      }
    });

    stats.forEach((stat) => {
      stat.tradeBalance = stat.totalExports - stat.totalImports;
    });

    return stats;
  }, [tradeRoutes, nations]);

  const globalTradeVolume = useMemo(() => {
    return tradeRoutes
      .filter((route) => route.status === 'active')
      .reduce((sum, route) => sum + route.amountPerTurn, 0);
  }, [tradeRoutes]);

  return {
    // State
    tradeAgreements,
    tradeRoutes,
    tradeHubs,
    tradeProposals,
    economicSanctions,

    // Trade Agreements
    proposeTradeAgreement,
    acceptTradeAgreement,
    cancelTradeAgreement,

    // Trade Routes
    createTradeRoute,
    disruptTradeRoute,
    assignRouteProtection,

    // Trade Hubs
    buildTradeHub,
    upgradeTradeHub,

    // Trade Proposals
    createTradeProposal,
    acceptTradeProposal,
    rejectTradeProposal,

    // Economic Sanctions
    imposeSanction,
    liftSanction,
    joinSanction,

    // Turn Processing
    processTradeTurn,

    // Computed
    nationTradeStats,
    globalTradeVolume,
  };
}
