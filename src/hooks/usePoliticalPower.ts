/**
 * Political Power Hook
 *
 * Manages political power generation, spending, and national decisions.
 */

import { useState, useCallback, useEffect } from 'react';
import {
  PoliticalPowerState,
  NationalDecision,
  DecisionLog,
  AdvisorTemplate,
  AdvisorBonus,
  PPModifier,
  AvailableDecision,
} from '../types/politicalPower';
import { getDecision, getAvailableAdvisors } from '../data/nationalDecisions';

interface UsePoliticalPowerOptions {
  currentTurn: number;
  nations: Array<{ id: string; name: string; ideology?: string }>;
}

export function usePoliticalPower({ currentTurn, nations }: UsePoliticalPowerOptions) {
  const [powerStates, setPowerStates] = useState<Map<string, PoliticalPowerState>>(new Map());
  const [decisionLog, setDecisionLog] = useState<DecisionLog[]>([]);
  const [activeAdvisors, setActiveAdvisors] = useState<Map<string, AdvisorTemplate[]>>(new Map());
  const [decisionCooldowns, setDecisionCooldowns] = useState<
    Map<string, Map<string, number>>
  >(new Map());

  /**
   * Initialize political power for all nations
   */
  const initializePoliticalPower = useCallback(() => {
    const newStates = new Map<string, PoliticalPowerState>();
    const newCooldowns = new Map<string, Map<string, number>>();

    nations.forEach((nation) => {
      // Get ideology bonus
      let ideologyBonus = 0;
      if (nation.ideology === 'democracy') ideologyBonus = 1;
      else if (nation.ideology === 'authoritarianism') ideologyBonus = 2;
      else if (nation.ideology === 'technocracy') ideologyBonus = 1;

      const baseGeneration = 2;
      const generationRate = baseGeneration + ideologyBonus;

      newStates.set(nation.id, {
        nationId: nation.id,
        currentPP: 50, // Starting PP
        maxPP: 300,
        generationRate,
        baseGeneration,
        leaderBonus: 0,
        ideologyBonus,
        advisorBonuses: [],
        temporaryModifiers: [],
        lastTurnGeneration: generationRate,
        totalGenerated: 50,
        totalSpent: 0,
      });

      newCooldowns.set(nation.id, new Map());
    });

    setPowerStates(newStates);
    setDecisionCooldowns(newCooldowns);
  }, [nations]);

  /**
   * Get political power state for a nation
   */
  const getPowerState = useCallback(
    (nationId: string): PoliticalPowerState | undefined => {
      return powerStates.get(nationId);
    },
    [powerStates]
  );

  /**
   * Generate political power for all nations (called each turn)
   */
  const generatePoliticalPower = useCallback(() => {
    setPowerStates((prev) => {
      const newStates = new Map(prev);

      nations.forEach((nation) => {
        const state = newStates.get(nation.id);
        if (!state) return;

        // Calculate generation rate with all bonuses
        let generationRate = state.baseGeneration + state.ideologyBonus + state.leaderBonus;

        // Add advisor bonuses
        state.advisorBonuses.forEach((bonus) => {
          if (bonus.bonusType === 'pp_generation') {
            generationRate += bonus.value;
          }
        });

        // Add temporary modifiers
        state.temporaryModifiers.forEach((modifier) => {
          if (modifier.modifierType === 'generation') {
            generationRate += modifier.value;
          }
        });

        // Generate PP (cap at max)
        const newPP = Math.min(state.maxPP, state.currentPP + generationRate);

        // Update temporary modifiers (reduce duration)
        const updatedModifiers = state.temporaryModifiers
          .map((mod) => ({
            ...mod,
            duration: mod.duration > 0 ? mod.duration - 1 : mod.duration,
          }))
          .filter((mod) => mod.duration !== 0); // Remove expired modifiers

        newStates.set(nation.id, {
          ...state,
          currentPP: newPP,
          generationRate,
          lastTurnGeneration: generationRate,
          totalGenerated: state.totalGenerated + generationRate,
          temporaryModifiers: updatedModifiers,
        });
      });

      return newStates;
    });

    // Update decision cooldowns
    setDecisionCooldowns((prev) => {
      const newCooldowns = new Map(prev);

      nations.forEach((nation) => {
        const nationCooldowns = newCooldowns.get(nation.id);
        if (!nationCooldowns) return;

        const updatedCooldowns = new Map(nationCooldowns);
        nationCooldowns.forEach((turnsRemaining, decisionId) => {
          if (turnsRemaining > 0) {
            updatedCooldowns.set(decisionId, turnsRemaining - 1);
            return;
          }

          if (turnsRemaining === 0) {
            updatedCooldowns.delete(decisionId);
          }
          // Permanent cooldowns (negative values) remain untouched to preserve one-time decisions
        });

        newCooldowns.set(nation.id, updatedCooldowns);
      });

      return newCooldowns;
    });
  }, [nations]);

  /**
   * Spend political power on a decision
   */
  const spendPoliticalPower = useCallback(
    (
      nationId: string,
      decisionId: string
    ): { success: boolean; message: string; effects?: any } => {
      const state = powerStates.get(nationId);
      if (!state) {
        return { success: false, message: 'Nation not found' };
      }

      const decision = getDecision(decisionId);
      if (!decision) {
        return { success: false, message: 'Decision not found' };
      }

      // Check if on cooldown
      const nationCooldowns = decisionCooldowns.get(nationId);
      if (nationCooldowns?.has(decisionId)) {
        const turnsRemaining = nationCooldowns.get(decisionId)!;
        return {
          success: false,
          message: `Decision on cooldown for ${turnsRemaining} more turns`,
        };
      }

      // Check if can afford
      if (state.currentPP < decision.ppCost) {
        return {
          success: false,
          message: `Not enough political power (need ${decision.ppCost}, have ${state.currentPP})`,
        };
      }

      // Spend PP
      setPowerStates((prev) => {
        const newStates = new Map(prev);
        const updatedState = { ...newStates.get(nationId)! };
        updatedState.currentPP -= decision.ppCost;
        updatedState.totalSpent += decision.ppCost;
        newStates.set(nationId, updatedState);
        return newStates;
      });

      // Set cooldown
      if (decision.cooldownTurns && decision.cooldownTurns > 0) {
        setDecisionCooldowns((prev) => {
          const newCooldowns = new Map(prev);
          const nationCooldowns = newCooldowns.get(nationId) || new Map();
          nationCooldowns.set(decisionId, decision.cooldownTurns!);
          newCooldowns.set(nationId, nationCooldowns);
          return newCooldowns;
        });
      }

      // Log decision
      const log: DecisionLog = {
        nationId,
        decisionId,
        decisionName: decision.name,
        ppSpent: decision.ppCost,
        turnExecuted: currentTurn,
        effects: decision.effects,
      };
      setDecisionLog((prev) => [...prev, log]);

      return {
        success: true,
        message: `${decision.name} executed successfully!`,
        effects: decision.effects,
      };
    },
    [powerStates, decisionCooldowns, currentTurn]
  );

  /**
   * Hire a political advisor
   */
  const hireAdvisor = useCallback(
    (nationId: string, advisor: AdvisorTemplate): { success: boolean; message: string } => {
      const state = powerStates.get(nationId);
      if (!state) {
        return { success: false, message: 'Nation not found' };
      }

      // Check if can afford
      if (state.currentPP < advisor.hireCost) {
        return {
          success: false,
          message: `Not enough political power (need ${advisor.hireCost}, have ${state.currentPP})`,
        };
      }

      // Check if already hired
      const nationAdvisors = activeAdvisors.get(nationId) || [];
      if (nationAdvisors.some((a) => a.id === advisor.id)) {
        return { success: false, message: 'Advisor already hired' };
      }

      // Spend PP
      setPowerStates((prev) => {
        const newStates = new Map(prev);
        const updatedState = { ...newStates.get(nationId)! };
        updatedState.currentPP -= advisor.hireCost;
        updatedState.totalSpent += advisor.hireCost;

        // Add advisor bonuses
        advisor.bonuses.forEach((bonus) => {
          const advisorBonus: AdvisorBonus = {
            ...bonus,
            hiredTurn: currentTurn,
          };

          if (bonus.bonusType === 'pp_generation') {
            updatedState.advisorBonuses.push(advisorBonus);
          } else if (bonus.bonusType === 'pp_max') {
            updatedState.maxPP += bonus.value;
            updatedState.advisorBonuses.push(advisorBonus);
          }
        });

        newStates.set(nationId, updatedState);
        return newStates;
      });

      // Add advisor to active list
      setActiveAdvisors((prev) => {
        const newAdvisors = new Map(prev);
        const nationAdvisors = newAdvisors.get(nationId) || [];
        newAdvisors.set(nationId, [...nationAdvisors, advisor]);
        return newAdvisors;
      });

      return {
        success: true,
        message: `${advisor.name} hired as ${advisor.title}!`,
      };
    },
    [powerStates, activeAdvisors, currentTurn]
  );

  /**
   * Add a temporary PP modifier (from focus, event, etc.)
   */
  const addPPModifier = useCallback((nationId: string, modifier: PPModifier) => {
    setPowerStates((prev) => {
      const newStates = new Map(prev);
      const state = newStates.get(nationId);
      if (!state) return prev;

      const updatedState = { ...state };

      // Apply max PP modifier immediately
      if (modifier.modifierType === 'max') {
        updatedState.maxPP += modifier.value;
      }

      updatedState.temporaryModifiers.push(modifier);
      newStates.set(nationId, updatedState);
      return newStates;
    });
  }, []);

  /**
   * Get available decisions for a nation
   */
  const getAvailableDecisions = useCallback(
    (
      nationId: string,
      allDecisions: NationalDecision[],
      gameState?: any
    ): AvailableDecision[] => {
      const state = powerStates.get(nationId);
      if (!state) return [];

      const nationCooldowns = decisionCooldowns.get(nationId) || new Map();

      return allDecisions.map((decision) => {
        const canAfford = state.currentPP >= decision.ppCost;
        const onCooldown = nationCooldowns.has(decision.id);
        const missingRequirements: string[] = [];

        // Check requirements (simplified, would need full game state)
        let meetsRequirements = true;
        decision.requirements.forEach((req) => {
          if (req.type === 'min_turn' && currentTurn < req.value) {
            meetsRequirements = false;
            missingRequirements.push(req.description);
          }
          // Add more requirement checks as needed
        });

        return {
          ...decision,
          canAfford,
          meetsRequirements,
          onCooldown,
          missingRequirements,
        };
      });
    },
    [powerStates, decisionCooldowns, currentTurn]
  );

  /**
   * Get decision history for a nation
   */
  const getDecisionHistory = useCallback(
    (nationId: string, lastNTurns?: number): DecisionLog[] => {
      let logs = decisionLog.filter((log) => log.nationId === nationId);

      if (lastNTurns) {
        logs = logs.filter((log) => currentTurn - log.turnExecuted <= lastNTurns);
      }

      return logs;
    },
    [decisionLog, currentTurn]
  );

  /**
   * Get active advisors for a nation
   */
  const getActiveAdvisors = useCallback(
    (nationId: string): AdvisorTemplate[] => {
      return activeAdvisors.get(nationId) || [];
    },
    [activeAdvisors]
  );

  /**
   * Get cooldown remaining for a decision
   */
  const getCooldownRemaining = useCallback(
    (nationId: string, decisionId: string): number => {
      const nationCooldowns = decisionCooldowns.get(nationId);
      return nationCooldowns?.get(decisionId) || 0;
    },
    [decisionCooldowns]
  );

  // Initialize on mount
  useEffect(() => {
    if (powerStates.size === 0) {
      initializePoliticalPower();
    }
  }, [initializePoliticalPower, powerStates.size]);

  return {
    // State
    powerStates,
    decisionLog,
    activeAdvisors,

    // Queries
    getPowerState,
    getAvailableDecisions,
    getDecisionHistory,
    getActiveAdvisors,
    getCooldownRemaining,

    // Mutations
    spendPoliticalPower,
    hireAdvisor,
    addPPModifier,

    // Turn processing
    generatePoliticalPower,

    // Initialization
    initializePoliticalPower,
  };
}
