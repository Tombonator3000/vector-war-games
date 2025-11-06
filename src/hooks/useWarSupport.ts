/**
 * War Support & Stability Hook
 *
 * Manages public opinion, national stability, and their effects on gameplay.
 */

import { useState, useCallback, useEffect } from 'react';
import {
  WarSupportState,
  WarSupportLevel,
  StabilityLevel,
  WarSupportModifier,
  StabilityModifier,
  WarSupportEffects,
  StabilityEffects,
  WarSupportAction,
  WarSupportHistory,
  NationalCrisis,
} from '../types/warSupport';

interface UseWarSupportOptions {
  currentTurn: number;
  nations: Array<{ id: string; name: string; ideology?: string }>;
}

export function useWarSupport({ currentTurn, nations }: UseWarSupportOptions) {
  const [warSupportStates, setWarSupportStates] = useState<Map<string, WarSupportState>>(new Map());
  const [history, setHistory] = useState<WarSupportHistory[]>([]);
  const [crises, setCrises] = useState<NationalCrisis[]>([]);

  /**
   * Initialize war support and stability for all nations
   */
  const initializeWarSupport = useCallback(() => {
    const newStates = new Map<string, WarSupportState>();

    nations.forEach((nation) => {
      const initialState: WarSupportState = {
        nationId: nation.id,
        warSupport: 50,
        warSupportLevel: 'willing',
        baseWarSupport: 50,
        ideologyModifier: 0,
        leaderModifier: 0,
        warSupportModifiers: [],
        warStatusModifier: 0,
        stability: 50,
        stabilityLevel: 'stable',
        baseStability: 50,
        politicalModifier: 0,
        economicModifier: 0,
        stabilityModifiers: [],
        occupationPenalty: 0,
        warSupportTrend: 'stable',
        stabilityTrend: 'stable',
        warSupportChangePerTurn: 0,
        stabilityChangePerTurn: 0,
      };

      newStates.set(nation.id, initialState);

      // Add to history
      setHistory((prev) => [
        ...prev,
        {
          nationId: nation.id,
          turn: currentTurn,
          warSupport: 50,
          stability: 50,
          majorEvents: [],
        },
      ]);
    });

    setWarSupportStates(newStates);
  }, [nations, currentTurn]);

  /**
   * Get war support state for a nation
   */
  const getWarSupportState = useCallback(
    (nationId: string): WarSupportState | undefined => {
      return warSupportStates.get(nationId);
    },
    [warSupportStates]
  );

  /**
   * Calculate war support level from value
   */
  const calculateWarSupportLevel = (value: number): WarSupportLevel => {
    if (value >= 80) return 'fanatic';
    if (value >= 60) return 'eager';
    if (value >= 40) return 'willing';
    if (value >= 20) return 'reluctant';
    return 'pacifist';
  };

  /**
   * Calculate stability level from value
   */
  const calculateStabilityLevel = (value: number): StabilityLevel => {
    if (value >= 80) return 'unshakeable';
    if (value >= 60) return 'very_stable';
    if (value >= 40) return 'stable';
    if (value >= 20) return 'unstable';
    return 'crisis';
  };

  /**
   * Add a war support modifier
   */
  const addWarSupportModifier = useCallback(
    (
      nationId: string,
      name: string,
      description: string,
      amount: number,
      duration: number,
      source: WarSupportModifier['source']
    ) => {
      setWarSupportStates((prev) => {
        const newStates = new Map(prev);
        const state = newStates.get(nationId);

        if (!state) return prev;

        const modifier: WarSupportModifier = {
          id: `ws-${nationId}-${Date.now()}`,
          name,
          description,
          amount,
          duration,
          source,
          appliedTurn: currentTurn,
        };

        const updatedState = {
          ...state,
          warSupportModifiers: [...state.warSupportModifiers, modifier],
        };

        updatedState.warSupport = Math.max(0, Math.min(100, state.warSupport + amount));
        updatedState.warSupportLevel = calculateWarSupportLevel(updatedState.warSupport);

        newStates.set(nationId, updatedState);
        return newStates;
      });
    },
    [currentTurn]
  );

  /**
   * Add a stability modifier
   */
  const addStabilityModifier = useCallback(
    (
      nationId: string,
      name: string,
      description: string,
      amount: number,
      duration: number,
      source: StabilityModifier['source']
    ) => {
      setWarSupportStates((prev) => {
        const newStates = new Map(prev);
        const state = newStates.get(nationId);

        if (!state) return prev;

        const modifier: StabilityModifier = {
          id: `stab-${nationId}-${Date.now()}`,
          name,
          description,
          amount,
          duration,
          source,
          appliedTurn: currentTurn,
        };

        const updatedState = {
          ...state,
          stabilityModifiers: [...state.stabilityModifiers, modifier],
        };

        updatedState.stability = Math.max(0, Math.min(100, state.stability + amount));
        updatedState.stabilityLevel = calculateStabilityLevel(updatedState.stability);

        newStates.set(nationId, updatedState);
        return newStates;
      });
    },
    [currentTurn]
  );

  /**
   * Execute a war support action
   */
  const executeWarSupportAction = useCallback(
    (
      nationId: string,
      action: WarSupportAction
    ): { success: boolean; message: string } => {
      const state = warSupportStates.get(nationId);
      if (!state) {
        return { success: false, message: 'Nation not found' };
      }

      // Check requirements
      if (action.minWarSupport && state.warSupport < action.minWarSupport) {
        return { success: false, message: 'Insufficient war support' };
      }
      if (action.minStability && state.stability < action.minStability) {
        return { success: false, message: 'Insufficient stability' };
      }

      // Check cooldown
      if (action.lastUsedTurn && currentTurn - action.lastUsedTurn < action.cooldownTurns) {
        return { success: false, message: 'Action on cooldown' };
      }

      // Apply effects
      addWarSupportModifier(
        nationId,
        action.name,
        action.description,
        action.warSupportChange,
        action.duration,
        action.category === 'propaganda' ? 'decision' : 'event'
      );

      if (action.stabilityChange !== 0) {
        addStabilityModifier(
          nationId,
          action.name,
          action.description,
          action.stabilityChange,
          action.duration,
          'decision'
        );
      }

      return { success: true, message: `${action.name} executed successfully` };
    },
    [warSupportStates, currentTurn, addWarSupportModifier, addStabilityModifier]
  );

  /**
   * Calculate war support effects on gameplay
   */
  const calculateWarSupportEffects = useCallback((nationId: string): WarSupportEffects => {
    const state = warSupportStates.get(nationId);
    if (!state) {
      // Return default effects
      return {
        recruitmentSpeed: 1.0,
        divisionRecovery: 1.0,
        surrenderLimit: 50,
        warGoalCost: 1.0,
        commandPowerGain: 1.0,
        joinFactionWillingness: 0,
        peaceConferencePower: 0,
        conscriptionLaw: 'limited',
      };
    }

    // Calculate multipliers based on war support level
    const wsValue = state.warSupport;
    const recruitmentSpeed = 0.5 + (wsValue / 100) * 1.0; // 0.5x to 1.5x
    const divisionRecovery = 0.5 + (wsValue / 100) * 1.0; // 0.5x to 1.5x
    const surrenderLimit = 20 + (wsValue / 100) * 60; // 20% to 80%
    const warGoalCost = 2.0 - (wsValue / 100) * 1.5; // 2.0x to 0.5x
    const commandPowerGain = 0.5 + (wsValue / 100) * 1.0; // 0.5x to 1.5x

    // Conscription law availability
    let conscriptionLaw: 'volunteer' | 'limited' | 'extensive' | 'total' = 'volunteer';
    if (wsValue >= 60) conscriptionLaw = 'total';
    else if (wsValue >= 40) conscriptionLaw = 'extensive';
    else if (wsValue >= 20) conscriptionLaw = 'limited';

    return {
      recruitmentSpeed,
      divisionRecovery,
      surrenderLimit,
      warGoalCost,
      commandPowerGain,
      joinFactionWillingness: wsValue - 50,
      peaceConferencePower: wsValue - 50,
      conscriptionLaw,
    };
  }, [warSupportStates]);

  /**
   * Calculate stability effects on gameplay
   */
  const calculateStabilityEffects = useCallback((nationId: string): StabilityEffects => {
    const state = warSupportStates.get(nationId);
    if (!state) {
      return {
        productionEfficiency: 1.0,
        factoryOutput: 1.0,
        constructionSpeed: 1.0,
        politicalPowerGain: 1.0,
        focusCompletionSpeed: 1.0,
        decisionCost: 1.0,
        resistanceActivity: 1.0,
        complianceGain: 1.0,
        riskOfCoup: false,
        riskOfCivilWar: false,
      };
    }

    const stabValue = state.stability;
    const productionEfficiency = 0.5 + (stabValue / 100) * 0.8; // 0.5x to 1.3x
    const factoryOutput = 0.5 + (stabValue / 100) * 0.7; // 0.5x to 1.2x
    const constructionSpeed = 0.5 + (stabValue / 100) * 0.7; // 0.5x to 1.2x
    const politicalPowerGain = 0.5 + (stabValue / 100) * 1.0; // 0.5x to 1.5x
    const focusCompletionSpeed = 0.7 + (stabValue / 100) * 0.6; // 0.7x to 1.3x
    const decisionCost = 2.0 - (stabValue / 100) * 1.5; // 2.0x to 0.5x

    return {
      productionEfficiency,
      factoryOutput,
      constructionSpeed,
      politicalPowerGain,
      focusCompletionSpeed,
      decisionCost,
      resistanceActivity: 2.0 - (stabValue / 100) * 1.5,
      complianceGain: 0.5 + (stabValue / 100) * 1.5,
      riskOfCoup: stabValue < 20,
      riskOfCivilWar: stabValue < 10,
    };
  }, [warSupportStates]);

  /**
   * Process turn updates (decay modifiers, check for crises)
   */
  const processTurnWarSupport = useCallback(() => {
    setWarSupportStates((prev) => {
      const newStates = new Map(prev);

      for (const [nationId, state] of newStates) {
        const updated = { ...state };

        // Decay temporary modifiers
        const updatedWarSupportModifiers = state.warSupportModifiers
          .map((mod) => ({ ...mod, duration: mod.duration > 0 ? mod.duration - 1 : mod.duration }))
          .filter((mod) => mod.duration !== 0);

        const updatedStabilityModifiers = state.stabilityModifiers
          .map((mod) => ({ ...mod, duration: mod.duration > 0 ? mod.duration - 1 : mod.duration }))
          .filter((mod) => mod.duration !== 0);

        updated.warSupportModifiers = updatedWarSupportModifiers;
        updated.stabilityModifiers = updatedStabilityModifiers;

        // Calculate total war support
        const wsModifierSum = updatedWarSupportModifiers.reduce((sum, m) => sum + m.amount, 0);

        updated.warSupport = Math.max(
          0,
          Math.min(
            100,
            updated.baseWarSupport +
              updated.ideologyModifier +
              updated.leaderModifier +
              updated.warStatusModifier +
              wsModifierSum
          )
        );
        updated.warSupportLevel = calculateWarSupportLevel(updated.warSupport);

        // Calculate total stability
        const stabModifierSum = updatedStabilityModifiers.reduce((sum, m) => sum + m.amount, 0);

        updated.stability = Math.max(
          0,
          Math.min(
            100,
            updated.baseStability +
              updated.politicalModifier +
              updated.economicModifier -
              updated.occupationPenalty +
              stabModifierSum
          )
        );
        updated.stabilityLevel = calculateStabilityLevel(updated.stability);

        // Calculate trends
        const prevHistory = history.find((h) => h.nationId === nationId && h.turn === currentTurn - 1);
        if (prevHistory) {
          updated.warSupportChangePerTurn = updated.warSupport - prevHistory.warSupport;
          updated.stabilityChangePerTurn = updated.stability - prevHistory.stability;

          if (updated.warSupportChangePerTurn > 1) updated.warSupportTrend = 'increasing';
          else if (updated.warSupportChangePerTurn < -1) updated.warSupportTrend = 'decreasing';
          else updated.warSupportTrend = 'stable';

          if (updated.stabilityChangePerTurn > 1) updated.stabilityTrend = 'increasing';
          else if (updated.stabilityChangePerTurn < -1) updated.stabilityTrend = 'decreasing';
          else updated.stabilityTrend = 'stable';
        }

        // Check for crises
        if (updated.stability < 20 && !crises.some((c) => c.nationId === nationId && !c.resolved)) {
          const crisis: NationalCrisis = {
            id: `crisis-${nationId}-${currentTurn}`,
            nationId,
            type: updated.stability < 10 ? 'coup' : 'government_collapse',
            trigger: 'low_stability',
            turn: currentTurn,
            effects: {
              productionLoss: 30,
              allianceBroken: false,
            },
            resolved: false,
          };
          setCrises((prev) => [...prev, crisis]);
        }

        newStates.set(nationId, updated);

        // Add to history
        setHistory((prev) => [
          ...prev,
          {
            nationId,
            turn: currentTurn,
            warSupport: updated.warSupport,
            stability: updated.stability,
            majorEvents: [],
          },
        ]);
      }

      return newStates;
    });
  }, [history, currentTurn, crises]);

  /**
   * Handle war-related events
   */
  const handleWarEvent = useCallback(
    (
      nationId: string,
      eventType: 'war_declared' | 'war_won' | 'war_lost' | 'territory_captured' | 'territory_lost' | 'nuclear_strike_launched' | 'nuclear_strike_received',
      magnitude: number = 10
    ) => {
      const effects: Record<typeof eventType, { ws: number; stab: number; name: string }> = {
        war_declared: { ws: -5, stab: -5, name: 'War Declared' },
        war_won: { ws: 20, stab: 10, name: 'Victory!' },
        war_lost: { ws: -30, stab: -20, name: 'Defeat' },
        territory_captured: { ws: 5, stab: 2, name: 'Territory Captured' },
        territory_lost: { ws: -10, stab: -5, name: 'Territory Lost' },
        nuclear_strike_launched: { ws: -15, stab: -10, name: 'Nuclear Strike Launched' },
        nuclear_strike_received: { ws: -25, stab: -30, name: 'Nuclear Strike Received!' },
      };

      const effect = effects[eventType];
      const scaledWS = (effect.ws * magnitude) / 10;
      const scaledStab = (effect.stab * magnitude) / 10;

      addWarSupportModifier(nationId, effect.name, `${eventType} event`, scaledWS, 5, 'combat');
      addStabilityModifier(nationId, effect.name, `${eventType} event`, scaledStab, 5, 'event');
    },
    [addWarSupportModifier, addStabilityModifier]
  );

  /**
   * Get history for a nation
   */
  const getHistory = useCallback(
    (nationId: string, turns: number = 10): WarSupportHistory[] => {
      return history
        .filter((h) => h.nationId === nationId)
        .slice(-turns);
    },
    [history]
  );

  /**
   * Get active crises
   */
  const getActiveCrises = useCallback(
    (nationId?: string): NationalCrisis[] => {
      return crises.filter((c) => !c.resolved && (!nationId || c.nationId === nationId));
    },
    [crises]
  );

  /**
   * Resolve a crisis
   */
  const resolveCrisis = useCallback(
    (crisisId: string, method: 'suppressed' | 'compromised' | 'overthrown') => {
      setCrises((prev) =>
        prev.map((c) =>
          c.id === crisisId
            ? { ...c, resolved: true, resolutionTurn: currentTurn, resolutionMethod: method }
            : c
        )
      );
    },
    [currentTurn]
  );

  // Initialize on mount
  useEffect(() => {
    if (warSupportStates.size === 0) {
      initializeWarSupport();
    }
  }, [initializeWarSupport, warSupportStates.size]);

  return {
    // State
    warSupportStates,
    history,
    crises,

    // Queries
    getWarSupportState,
    calculateWarSupportEffects,
    calculateStabilityEffects,
    getHistory,
    getActiveCrises,

    // Mutations
    addWarSupportModifier,
    addStabilityModifier,
    executeWarSupportAction,
    handleWarEvent,
    resolveCrisis,

    // Turn processing
    processTurnWarSupport,

    // Initialization
    initializeWarSupport,
  };
}
