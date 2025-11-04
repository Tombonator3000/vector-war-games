/**
 * Political Factions System Hook
 *
 * Manages domestic political factions, coalition dynamics, demands,
 * and coup mechanics. Priority 6 implementation.
 */

import { useState, useCallback, useMemo } from 'react';
import type {
  PoliticalFaction,
  FactionType,
  FactionAgenda,
  FactionDemand,
  FactionDemandType,
  CoupAttempt,
  FactionPriority,
} from '../types/regionalMorale';

export interface UsePoliticalFactionsOptions {
  currentTurn: number;
  onFactionDemand?: (nationId: string, demand: FactionDemand) => void;
  onCoupAttempt?: (nationId: string, coup: CoupAttempt) => void;
  onCoalitionShift?: (nationId: string, factionId: string, joined: boolean) => void;
}

export function usePoliticalFactions(options: UsePoliticalFactionsOptions) {
  const { currentTurn, onFactionDemand, onCoupAttempt, onCoalitionShift } = options;

  const [factions, setFactions] = useState<Map<string, PoliticalFaction>>(new Map());
  const [coups, setCoups] = useState<Map<string, CoupAttempt>>(new Map());
  const [demandIdCounter, setDemandIdCounter] = useState(0);

  /**
   * Initialize factions for a nation
   */
  const initializeFactions = useCallback(
    (
      nationId: string,
      nationName: string,
      era: 'cold_war' | 'modern' = 'cold_war'
    ): PoliticalFaction[] => {
      const newFactions = generateFactionsForNation(nationId, nationName, era);

      setFactions((prev) => {
        const updated = new Map(prev);
        newFactions.forEach((faction) => {
          updated.set(faction.id, faction);
        });
        return updated;
      });

      return newFactions;
    },
    []
  );

  /**
   * Get all factions for a nation
   */
  const getFactionsForNation = useCallback(
    (nationId: string): PoliticalFaction[] => {
      const result: PoliticalFaction[] = [];
      factions.forEach((faction) => {
        if (faction.nationId === nationId) {
          result.push(faction);
        }
      });
      return result;
    },
    [factions]
  );

  /**
   * Get a specific faction by ID
   */
  const getFaction = useCallback(
    (factionId: string): PoliticalFaction | undefined => {
      return factions.get(factionId);
    },
    [factions]
  );

  /**
   * Update faction satisfaction
   */
  const updateFactionSatisfaction = useCallback(
    (factionId: string, delta: number, reason?: string) => {
      setFactions((prev) => {
        const updated = new Map(prev);
        const faction = updated.get(factionId);

        if (faction) {
          const newSatisfaction = Math.max(0, Math.min(100, faction.satisfaction + delta));
          const newThreatLevel = calculateThreatLevel(newSatisfaction, faction.influence, faction.type);

          updated.set(factionId, {
            ...faction,
            satisfaction: newSatisfaction,
            threatLevel: newThreatLevel,
          });
        }

        return updated;
      });
    },
    []
  );

  /**
   * Update faction influence
   */
  const updateFactionInfluence = useCallback(
    (factionId: string, delta: number) => {
      setFactions((prev) => {
        const updated = new Map(prev);
        const faction = updated.get(factionId);

        if (faction) {
          const newInfluence = Math.max(0, Math.min(100, faction.influence + delta));
          const newThreatLevel = calculateThreatLevel(faction.satisfaction, newInfluence, faction.type);

          updated.set(factionId, {
            ...faction,
            influence: newInfluence,
            threatLevel: newThreatLevel,
          });
        }

        return updated;
      });
    },
    []
  );

  /**
   * Add a faction to the ruling coalition
   */
  const addToCoalition = useCallback(
    (factionId: string) => {
      setFactions((prev) => {
        const updated = new Map(prev);
        const faction = updated.get(factionId);

        if (faction && !faction.inCoalition) {
          updated.set(factionId, {
            ...faction,
            inCoalition: true,
            satisfaction: Math.min(100, faction.satisfaction + 15),
          });

          if (onCoalitionShift) {
            onCoalitionShift(faction.nationId, factionId, true);
          }
        }

        return updated;
      });
    },
    [onCoalitionShift]
  );

  /**
   * Remove a faction from the ruling coalition
   */
  const removeFromCoalition = useCallback(
    (factionId: string) => {
      setFactions((prev) => {
        const updated = new Map(prev);
        const faction = updated.get(factionId);

        if (faction && faction.inCoalition) {
          updated.set(factionId, {
            ...faction,
            inCoalition: false,
            satisfaction: Math.max(0, faction.satisfaction - 20),
          });

          if (onCoalitionShift) {
            onCoalitionShift(faction.nationId, factionId, false);
          }
        }

        return updated;
      });
    },
    [onCoalitionShift]
  );

  /**
   * Create a faction demand
   */
  const createFactionDemand = useCallback(
    (
      factionId: string,
      demandType: FactionDemandType,
      severity: 'request' | 'demand' | 'ultimatum',
      deadline: number
    ): FactionDemand | null => {
      const faction = factions.get(factionId);
      if (!faction) return null;

      const demand: FactionDemand = {
        id: `demand_${demandIdCounter}`,
        factionId,
        type: demandType,
        severity,
        description: generateDemandDescription(faction, demandType, severity),
        deadline,
        consequences: {
          satisfactionDelta: severity === 'ultimatum' ? 20 : severity === 'demand' ? 10 : 5,
          influenceDelta: severity === 'ultimatum' ? 10 : severity === 'demand' ? 5 : 2,
          refusalPenalty: {
            satisfactionLoss: severity === 'ultimatum' ? 40 : severity === 'demand' ? 25 : 15,
            coupRisk: severity === 'ultimatum' && faction.type === 'military' ? 50 :
                      severity === 'ultimatum' ? 25 : 0,
            defectionRisk: severity === 'ultimatum' ? 80 : severity === 'demand' ? 50 : 20,
          },
        },
        requirements: generateDemandRequirements(demandType, faction),
      };

      setFactions((prev) => {
        const updated = new Map(prev);
        const current = updated.get(factionId);

        if (current) {
          updated.set(factionId, {
            ...current,
            demands: [...current.demands, demand],
          });
        }

        return updated;
      });

      setDemandIdCounter((prev) => prev + 1);

      if (onFactionDemand) {
        onFactionDemand(faction.nationId, demand);
      }

      return demand;
    },
    [factions, demandIdCounter, onFactionDemand]
  );

  /**
   * Accept a faction demand
   */
  const acceptDemand = useCallback(
    (demandId: string): { success: boolean; cost: number } => {
      let cost = 0;

      setFactions((prev) => {
        const updated = new Map(prev);

        // Find the faction with this demand
        updated.forEach((faction, id) => {
          const demandIndex = faction.demands.findIndex((d) => d.id === demandId);

          if (demandIndex !== -1) {
            const demand = faction.demands[demandIndex];

            // Apply benefits
            const newSatisfaction = Math.min(100, faction.satisfaction + demand.consequences.satisfactionDelta);
            const newInfluence = Math.min(100, faction.influence + demand.consequences.influenceDelta);

            // Calculate cost
            if (demand.requirements.resourceAllocation) {
              cost = demand.requirements.resourceAllocation.gold || 0;
            }

            // Remove the demand
            const newDemands = faction.demands.filter((d) => d.id !== demandId);

            updated.set(id, {
              ...faction,
              satisfaction: newSatisfaction,
              influence: newInfluence,
              demands: newDemands,
            });
          }
        });

        return updated;
      });

      return { success: true, cost };
    },
    []
  );

  /**
   * Refuse a faction demand
   */
  const refuseDemand = useCallback(
    (demandId: string): { coupTriggered: boolean; factionDefected: boolean } => {
      let coupTriggered = false;
      let factionDefected = false;

      setFactions((prev) => {
        const updated = new Map(prev);

        updated.forEach((faction, id) => {
          const demandIndex = faction.demands.findIndex((d) => d.id === demandId);

          if (demandIndex !== -1) {
            const demand = faction.demands[demandIndex];
            const penalty = demand.consequences.refusalPenalty;

            // Apply penalties
            const newSatisfaction = Math.max(0, faction.satisfaction - penalty.satisfactionLoss);

            // Check for coup
            if (Math.random() * 100 < penalty.coupRisk) {
              coupTriggered = true;
              // Coup logic handled separately
            }

            // Check for defection
            if (Math.random() * 100 < penalty.defectionRisk && faction.inCoalition) {
              factionDefected = true;
              faction.inCoalition = false;
            }

            // Remove the demand
            const newDemands = faction.demands.filter((d) => d.id !== demandId);

            updated.set(id, {
              ...faction,
              satisfaction: newSatisfaction,
              demands: newDemands,
              inCoalition: factionDefected ? false : faction.inCoalition,
            });
          }
        });

        return updated;
      });

      return { coupTriggered, factionDefected };
    },
    []
  );

  /**
   * Attempt a coup
   */
  const attemptCoup = useCallback(
    (nationId: string, instigatorFactionId: string): CoupAttempt => {
      const instigator = factions.get(instigatorFactionId);
      if (!instigator) {
        throw new Error('Instigator faction not found');
      }

      const nationFactions = getFactionsForNation(nationId);

      // Determine which factions support/oppose
      const supporting: string[] = [];
      const opposing: string[] = [];

      nationFactions.forEach((f) => {
        if (f.id === instigatorFactionId) {
          supporting.push(f.id);
        } else if (f.satisfaction < 30 || f.threatLevel > 60) {
          supporting.push(f.id);
        } else if (f.inCoalition) {
          opposing.push(f.id);
        } else {
          // Neutral factions might join either side
          if (Math.random() < 0.4) supporting.push(f.id);
          else opposing.push(f.id);
        }
      });

      // Calculate success chance
      const supportingInfluence = supporting.reduce((sum, id) => {
        const f = factions.get(id);
        return sum + (f?.influence || 0);
      }, 0);

      const opposingInfluence = opposing.reduce((sum, id) => {
        const f = factions.get(id);
        return sum + (f?.influence || 0);
      }, 0);

      const militaryFaction = nationFactions.find((f) => f.type === 'military');
      const militaryLoyalty = militaryFaction
        ? militaryFaction.satisfaction
        : 50;

      let successChance = (supportingInfluence / (supportingInfluence + opposingInfluence)) * 100;

      // Military loyalty heavily influences outcome
      if (instigator.type === 'military') {
        successChance += 30;
      } else {
        successChance -= (militaryLoyalty - 50) / 2;
      }

      successChance = Math.max(10, Math.min(90, successChance));

      const coup: CoupAttempt = {
        turn: currentTurn,
        instigatorFactionId,
        supportingFactions: supporting,
        opposingFactions: opposing,
        successChance: Math.round(successChance),
        militaryLoyalty,
        resolved: false,
        successful: null,
        casualties: 0,
        newLeader: null,
      };

      setCoups((prev) => {
        const updated = new Map(prev);
        updated.set(nationId, coup);
        return updated;
      });

      if (onCoupAttempt) {
        onCoupAttempt(nationId, coup);
      }

      return coup;
    },
    [factions, getFactionsForNation, currentTurn, onCoupAttempt]
  );

  /**
   * Resolve a coup attempt
   */
  const resolveCoup = useCallback(
    (nationId: string): { successful: boolean; casualties: number; newLeader: string | null } => {
      const coup = coups.get(nationId);
      if (!coup || coup.resolved) {
        return { successful: false, casualties: 0, newLeader: null };
      }

      const successful = Math.random() * 100 < coup.successChance;
      const casualties = Math.floor(Math.random() * 20) + 10; // 10-30% military losses

      let newLeader: string | null = null;
      if (successful) {
        const instigator = factions.get(coup.instigatorFactionId);
        if (instigator) {
          newLeader = `${instigator.type.charAt(0).toUpperCase() + instigator.type.slice(1)} Leader`;
        }
      }

      setCoups((prev) => {
        const updated = new Map(prev);
        updated.set(nationId, {
          ...coup,
          resolved: true,
          successful,
          casualties,
          newLeader,
        });
        return updated;
      });

      // Update faction dynamics after coup
      setFactions((prev) => {
        const updated = new Map(prev);

        if (successful) {
          // Supporting factions gain power
          coup.supportingFactions.forEach((id) => {
            const faction = updated.get(id);
            if (faction) {
              updated.set(id, {
                ...faction,
                influence: Math.min(100, faction.influence + 20),
                satisfaction: Math.min(100, faction.satisfaction + 30),
                inCoalition: true,
              });
            }
          });

          // Opposing factions lose power
          coup.opposingFactions.forEach((id) => {
            const faction = updated.get(id);
            if (faction) {
              updated.set(id, {
                ...faction,
                influence: Math.max(0, faction.influence - 30),
                satisfaction: Math.max(0, faction.satisfaction - 40),
                inCoalition: false,
              });
            }
          });
        } else {
          // Failed coup - instigators punished
          coup.supportingFactions.forEach((id) => {
            const faction = updated.get(id);
            if (faction) {
              updated.set(id, {
                ...faction,
                influence: Math.max(0, faction.influence - 40),
                satisfaction: Math.max(0, faction.satisfaction - 50),
                inCoalition: false,
              });
            }
          });

          // Loyalists rewarded
          coup.opposingFactions.forEach((id) => {
            const faction = updated.get(id);
            if (faction) {
              updated.set(id, {
                ...faction,
                influence: Math.min(100, faction.influence + 15),
                satisfaction: Math.min(100, faction.satisfaction + 20),
              });
            }
          });
        }

        return updated;
      });

      return { successful, casualties, newLeader };
    },
    [coups]
  );

  /**
   * Calculate coalition support percentage
   */
  const getCoalitionSupport = useCallback(
    (nationId: string): number => {
      const nationFactions = getFactionsForNation(nationId);
      const coalitionFactions = nationFactions.filter((f) => f.inCoalition);

      const totalInfluence = coalitionFactions.reduce((sum, f) => sum + f.influence, 0);
      return Math.round(totalInfluence);
    },
    [getFactionsForNation]
  );

  /**
   * Get average faction satisfaction
   */
  const getAverageSatisfaction = useCallback(
    (nationId: string): number => {
      const nationFactions = getFactionsForNation(nationId);

      if (nationFactions.length === 0) return 50;

      const totalSatisfaction = nationFactions.reduce((sum, f) => sum + f.satisfaction, 0);
      return Math.round(totalSatisfaction / nationFactions.length);
    },
    [getFactionsForNation]
  );

  /**
   * Process turn updates for factions
   */
  const processTurnUpdates = useCallback(() => {
    setFactions((prev) => {
      const updated = new Map(prev);

      updated.forEach((faction, id) => {
        let satisfactionDelta = 0;

        // Coalition members slowly gain satisfaction
        if (faction.inCoalition) {
          satisfactionDelta += 1;
        } else {
          satisfactionDelta -= 0.5;
        }

        // Check for expired demands
        const activeDemands = faction.demands.filter((d) => d.deadline >= currentTurn);
        const expiredDemands = faction.demands.filter((d) => d.deadline < currentTurn);

        // Apply penalties for expired demands
        expiredDemands.forEach((demand) => {
          satisfactionDelta -= demand.consequences.refusalPenalty.satisfactionLoss / 2;
        });

        const newSatisfaction = Math.max(0, Math.min(100, faction.satisfaction + satisfactionDelta));
        const newThreatLevel = calculateThreatLevel(newSatisfaction, faction.influence, faction.type);

        // Generate new demands if dissatisfied
        if (newSatisfaction < 40 && faction.demands.length === 0 && Math.random() < 0.2) {
          // This will be handled externally by calling createFactionDemand
        }

        updated.set(id, {
          ...faction,
          satisfaction: newSatisfaction,
          threatLevel: newThreatLevel,
          demands: activeDemands,
        });
      });

      return updated;
    });
  }, [currentTurn]);

  return {
    // State
    factions: Array.from(factions.values()),
    coups: Array.from(coups.values()),

    // Initialization
    initializeFactions,

    // Faction queries
    getFactionsForNation,
    getFaction,

    // Faction management
    updateFactionSatisfaction,
    updateFactionInfluence,
    addToCoalition,
    removeFromCoalition,

    // Demands
    createFactionDemand,
    acceptDemand,
    refuseDemand,

    // Coups
    attemptCoup,
    resolveCoup,

    // Calculations
    getCoalitionSupport,
    getAverageSatisfaction,

    // Turn processing
    processTurnUpdates,
  };
}

// Helper functions

function calculateThreatLevel(satisfaction: number, influence: number, type: FactionType): number {
  let threat = (100 - satisfaction) * 0.6; // Low satisfaction = high threat

  // Military factions are more dangerous when dissatisfied
  if (type === 'military') {
    threat *= 1.5;
  } else if (type === 'reformer') {
    threat *= 0.7; // Reformers less likely to use force
  }

  // High influence factions are more threatening
  threat *= 1 + influence / 200;

  return Math.round(Math.min(100, threat));
}

function generateFactionsForNation(
  nationId: string,
  nationName: string,
  era: 'cold_war' | 'modern'
): PoliticalFaction[] {
  const factions: PoliticalFaction[] = [];

  // Military faction (always present)
  factions.push({
    id: `${nationId}_military`,
    nationId,
    name: 'Armed Forces',
    type: 'military',
    influence: 30,
    satisfaction: 60,
    agenda: {
      priorities: [
        { type: 'military_expansion', weight: 9 },
        { type: 'nuclear_program', weight: 7 },
      ],
      redLines: ['disarmament', 'military_cuts'],
      preferredPolicies: ['universal_conscription', 'military_industrial_complex'],
      opposedPolicies: ['peace_dividend'],
      preferredAllies: [],
      enemies: [],
    },
    loyalTerritories: [],
    inCoalition: true,
    demands: [],
    threatLevel: 25,
  });

  // Civilian government faction
  factions.push({
    id: `${nationId}_civilian`,
    nationId,
    name: 'Civilian Government',
    type: 'civilian',
    influence: 25,
    satisfaction: 70,
    agenda: {
      priorities: [
        { type: 'democracy', weight: 8 },
        { type: 'economic_growth', weight: 7 },
      ],
      redLines: ['military_coup', 'martial_law'],
      preferredPolicies: ['welfare_state', 'free_press_protections'],
      opposedPolicies: ['total_surveillance_state', 'ministry_of_truth'],
      preferredAllies: [],
      enemies: [],
    },
    loyalTerritories: [],
    inCoalition: true,
    demands: [],
    threatLevel: 10,
  });

  // Hardliners
  factions.push({
    id: `${nationId}_hardliner`,
    nationId,
    name: 'Hardliners',
    type: 'hardliner',
    influence: 20,
    satisfaction: 50,
    agenda: {
      priorities: [
        { type: 'military_expansion', weight: 10 },
        { type: 'authoritarianism', weight: 8 },
      ],
      redLines: ['peace_treaty', 'disarmament', 'democratic_reform'],
      preferredPolicies: ['total_war_economy', 'nuclear_first_strike'],
      opposedPolicies: ['peace_dividend', 'open_diplomacy'],
      preferredAllies: [],
      enemies: [],
    },
    loyalTerritories: [],
    inCoalition: false,
    demands: [],
    threatLevel: 40,
  });

  // Reformers/Peace party
  factions.push({
    id: `${nationId}_reformer`,
    nationId,
    name: 'Reformers',
    type: 'reformer',
    influence: 15,
    satisfaction: 55,
    agenda: {
      priorities: [
        { type: 'peace', weight: 9 },
        { type: 'democracy', weight: 7 },
        { type: 'economic_growth', weight: 6 },
      ],
      redLines: ['nuclear_first_use', 'civilian_massacres'],
      preferredPolicies: ['peace_dividend', 'open_diplomacy'],
      opposedPolicies: ['total_war_economy', 'nuclear_first_strike'],
      preferredAllies: [],
      enemies: [],
    },
    loyalTerritories: [],
    inCoalition: false,
    demands: [],
    threatLevel: 15,
  });

  // Technocrats
  factions.push({
    id: `${nationId}_technocrat`,
    nationId,
    name: 'Technocrats',
    type: 'technocrat',
    influence: 10,
    satisfaction: 65,
    agenda: {
      priorities: [
        { type: 'economic_growth', weight: 10 },
        { type: 'nuclear_program', weight: 5 },
      ],
      redLines: ['economic_collapse'],
      preferredPolicies: ['massive_stimulus', 'military_industrial_complex'],
      opposedPolicies: ['austerity_measures'],
      preferredAllies: [],
      enemies: [],
    },
    loyalTerritories: [],
    inCoalition: true,
    demands: [],
    threatLevel: 5,
  });

  return factions;
}

function generateDemandDescription(
  faction: PoliticalFaction,
  demandType: FactionDemandType,
  severity: 'request' | 'demand' | 'ultimatum'
): string {
  const prefix = severity === 'ultimatum' ? 'ULTIMATUM:' : severity === 'demand' ? 'DEMAND:' : 'REQUEST:';

  const descriptions: Record<FactionDemandType, string> = {
    policy_change: `${prefix} ${faction.name} ${severity === 'ultimatum' ? 'demands' : 'requests'} immediate policy changes`,
    increased_funding: `${prefix} ${faction.name} ${severity === 'ultimatum' ? 'demands' : 'requests'} increased resource allocation`,
    peace_treaty: `${prefix} ${faction.name} ${severity === 'ultimatum' ? 'demands' : 'requests'} immediate peace negotiations`,
    declare_war: `${prefix} ${faction.name} ${severity === 'ultimatum' ? 'demands' : 'requests'} military action`,
    end_alliance: `${prefix} ${faction.name} ${severity === 'ultimatum' ? 'demands' : 'requests'} termination of alliance`,
    nuclear_strike: `${prefix} ${faction.name} ${severity === 'ultimatum' ? 'demands' : 'requests'} nuclear weapons deployment`,
    reform: `${prefix} ${faction.name} ${severity === 'ultimatum' ? 'demands' : 'requests'} political reforms`,
    crackdown: `${prefix} ${faction.name} ${severity === 'ultimatum' ? 'demands' : 'requests'} forceful suppression of dissent`,
  };

  return descriptions[demandType];
}

function generateDemandRequirements(
  demandType: FactionDemandType,
  faction: PoliticalFaction
): FactionDemand['requirements'] {
  const baseCost = faction.influence * 10;

  switch (demandType) {
    case 'increased_funding':
      return {
        resourceAllocation: {
          gold: Math.round(baseCost * 2),
          production: Math.round(baseCost),
        },
      };

    case 'policy_change':
      return {
        policyChange: faction.agenda.preferredPolicies[0] || 'any',
      };

    default:
      return {};
  }
}
