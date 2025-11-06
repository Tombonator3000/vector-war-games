/**
 * National Focus Hook
 *
 * Manages national focus trees, activation, and completion.
 */

import { useState, useCallback, useEffect } from 'react';
import {
  FocusTreeState,
  NationalFocus,
  FocusCompletionLog,
  AvailableFocus,
} from '../types/nationalFocus';
import { getFocusesForNation, getFocus } from '../data/nationalFocuses';

interface UseNationalFocusOptions {
  currentTurn: number;
  nations: Array<{ id: string; name: string }>;
}

export function useNationalFocus({ currentTurn, nations }: UseNationalFocusOptions) {
  const [focusStates, setFocusStates] = useState<Map<string, FocusTreeState>>(new Map());
  const [completionLog, setCompletionLog] = useState<FocusCompletionLog[]>([]);

  /**
   * Initialize focus trees for all nations
   */
  const initializeFocusTrees = useCallback(() => {
    const newStates = new Map<string, FocusTreeState>();

    nations.forEach((nation) => {
      newStates.set(nation.id, {
        nationId: nation.id,
        activeFocus: null,
        activeFocusProgress: 0,
        activeFocusTurnsRemaining: 0,
        completedFocuses: [],
        lockedFocuses: [],
        availableFocuses: [],
      });
    });

    setFocusStates(newStates);
  }, [nations]);

  /**
   * Get focus tree state for a nation
   */
  const getFocusState = useCallback(
    (nationId: string): FocusTreeState | undefined => {
      return focusStates.get(nationId);
    },
    [focusStates]
  );

  /**
   * Start a national focus
   */
  const startFocus = useCallback(
    (nationId: string, focusId: string): { success: boolean; message: string } => {
      const state = focusStates.get(nationId);
      if (!state) {
        return { success: false, message: 'Nation not found' };
      }

      // Check if already active
      if (state.activeFocus) {
        return { success: false, message: 'Another focus is already in progress' };
      }

      // Get focus
      const focus = getFocus(focusId, nationId);
      if (!focus) {
        return { success: false, message: 'Focus not found' };
      }

      // Check if locked
      if (state.lockedFocuses.includes(focusId)) {
        return { success: false, message: 'Focus is locked by previous choice' };
      }

      // Check if already completed
      if (state.completedFocuses.includes(focusId)) {
        return { success: false, message: 'Focus already completed' };
      }

      // Check prerequisites
      const missingPrereqs = focus.prerequisites.filter(
        (prereq) => !state.completedFocuses.includes(prereq)
      );
      if (missingPrereqs.length > 0) {
        return {
          success: false,
          message: `Missing prerequisites: ${missingPrereqs.join(', ')}`,
        };
      }

      // Check era requirement
      if (focus.eraRequirement && currentTurn < focus.eraRequirement) {
        return {
          success: false,
          message: `Requires turn ${focus.eraRequirement} or later`,
        };
      }

      // Start focus
      setFocusStates((prev) => {
        const newStates = new Map(prev);
        const updatedState = { ...newStates.get(nationId)! };

        updatedState.activeFocus = focusId;
        updatedState.activeFocusProgress = 0;
        updatedState.activeFocusTurnsRemaining = focus.completionTime;

        newStates.set(nationId, updatedState);
        return newStates;
      });

      return { success: true, message: `Started focus: ${focus.name}` };
    },
    [focusStates, currentTurn]
  );

  /**
   * Cancel active focus
   */
  const cancelFocus = useCallback(
    (nationId: string): { success: boolean; message: string } => {
      const state = focusStates.get(nationId);
      if (!state || !state.activeFocus) {
        return { success: false, message: 'No active focus to cancel' };
      }

      setFocusStates((prev) => {
        const newStates = new Map(prev);
        const updatedState = { ...newStates.get(nationId)! };

        updatedState.activeFocus = null;
        updatedState.activeFocusProgress = 0;
        updatedState.activeFocusTurnsRemaining = 0;

        newStates.set(nationId, updatedState);
        return newStates;
      });

      return { success: true, message: 'Focus cancelled (progress lost)' };
    },
    [focusStates]
  );

  /**
   * Process focus progress for all nations (called each turn)
   */
  const processTurnFocusProgress = useCallback(() => {
    const newCompletions: FocusCompletionLog[] = [];

    setFocusStates((prev) => {
      const newStates = new Map(prev);

      nations.forEach((nation) => {
        const state = newStates.get(nation.id);
        if (!state || !state.activeFocus) return;

        const focus = getFocus(state.activeFocus, nation.id);
        if (!focus) return;

        // Update progress
        const progressPerTurn = 100 / focus.completionTime;
        const updatedState = { ...state };
        updatedState.activeFocusProgress = Math.min(
          100,
          updatedState.activeFocusProgress + progressPerTurn
        );
        updatedState.activeFocusTurnsRemaining = Math.max(
          0,
          updatedState.activeFocusTurnsRemaining - 1
        );

        // Check if completed
        if (
          updatedState.activeFocusProgress >= 100 ||
          updatedState.activeFocusTurnsRemaining === 0
        ) {
          // Mark as completed
          updatedState.completedFocuses.push(state.activeFocus);

          // Lock mutually exclusive focuses
          focus.mutuallyExclusive.forEach((exclusiveId) => {
            if (!updatedState.lockedFocuses.includes(exclusiveId)) {
              updatedState.lockedFocuses.push(exclusiveId);
            }
          });

          // Log completion
          newCompletions.push({
            nationId: nation.id,
            focusId: state.activeFocus,
            focusName: focus.name,
            completedTurn: currentTurn,
            effects: focus.effects,
          });

          // Clear active focus
          updatedState.activeFocus = null;
          updatedState.activeFocusProgress = 0;
          updatedState.activeFocusTurnsRemaining = 0;
        }

        newStates.set(nation.id, updatedState);
      });

      return newStates;
    });

    // Add new completions to log
    if (newCompletions.length > 0) {
      setCompletionLog((prev) => [...prev, ...newCompletions]);
    }

    return newCompletions;
  }, [nations, currentTurn]);

  /**
   * Get available focuses for a nation
   */
  const getAvailableFocuses = useCallback(
    (nationId: string): AvailableFocus[] => {
      const state = focusStates.get(nationId);
      if (!state) return [];

      const allFocuses = getFocusesForNation(nationId);

      return allFocuses.map((focus) => {
        const isCompleted = state.completedFocuses.includes(focus.id);
        const isLocked = state.lockedFocuses.includes(focus.id);
        const isActive = state.activeFocus === focus.id;

        // Check prerequisites
        const missingPrerequisites = focus.prerequisites.filter(
          (prereq) => !state.completedFocuses.includes(prereq)
        );

        // Check if can start
        const meetsPrereqs = missingPrerequisites.length === 0;
        const meetsEra = !focus.eraRequirement || currentTurn >= focus.eraRequirement;
        const notLocked = !isLocked;
        const notCompleted = !isCompleted;
        const noActiveFocus = !state.activeFocus || isActive;

        const canStart = meetsPrereqs && meetsEra && notLocked && notCompleted && noActiveFocus;

        return {
          ...focus,
          canStart,
          missingPrerequisites: missingPrerequisites.map(
            (id) => getFocus(id, nationId)?.name || id
          ),
          isLocked,
          isCompleted,
          isActive,
        };
      });
    },
    [focusStates, currentTurn]
  );

  /**
   * Get completed focuses for a nation
   */
  const getCompletedFocuses = useCallback(
    (nationId: string): NationalFocus[] => {
      const state = focusStates.get(nationId);
      if (!state) return [];

      return state.completedFocuses
        .map((focusId) => getFocus(focusId, nationId))
        .filter((focus): focus is NationalFocus => focus !== undefined);
    },
    [focusStates]
  );

  /**
   * Get active focus for a nation
   */
  const getActiveFocus = useCallback(
    (
      nationId: string
    ): { focus: NationalFocus; progress: number; turnsRemaining: number } | null => {
      const state = focusStates.get(nationId);
      if (!state || !state.activeFocus) return null;

      const focus = getFocus(state.activeFocus, nationId);
      if (!focus) return null;

      return {
        focus,
        progress: state.activeFocusProgress,
        turnsRemaining: state.activeFocusTurnsRemaining,
      };
    },
    [focusStates]
  );

  /**
   * Get focus completion history
   */
  const getCompletionHistory = useCallback(
    (nationId: string, lastNTurns?: number): FocusCompletionLog[] => {
      let logs = completionLog.filter((log) => log.nationId === nationId);

      if (lastNTurns) {
        logs = logs.filter((log) => currentTurn - log.completedTurn <= lastNTurns);
      }

      return logs;
    },
    [completionLog, currentTurn]
  );

  /**
   * Check if a focus is available to start
   */
  const isFocusAvailable = useCallback(
    (nationId: string, focusId: string): boolean => {
      const availableFocuses = getAvailableFocuses(nationId);
      const focus = availableFocuses.find((f) => f.id === focusId);
      return focus?.canStart || false;
    },
    [getAvailableFocuses]
  );

  /**
   * Get all focuses by path for a nation
   */
  const getFocusesByPath = useCallback(
    (nationId: string): Record<string, NationalFocus[]> => {
      const allFocuses = getFocusesForNation(nationId);

      const paths: Record<string, NationalFocus[]> = {
        diplomatic: [],
        economic: [],
        intelligence: [],
        military: [],
        special: [],
      };

      allFocuses.forEach((focus) => {
        switch (focus.column) {
          case 0:
            paths.diplomatic.push(focus);
            break;
          case 1:
            paths.economic.push(focus);
            break;
          case 2:
            paths.intelligence.push(focus);
            break;
          case 3:
            paths.military.push(focus);
            break;
          case 4:
            paths.special.push(focus);
            break;
        }
      });

      // Sort by row
      Object.keys(paths).forEach((path) => {
        paths[path].sort((a, b) => a.row - b.row);
      });

      return paths;
    },
    []
  );

  // Initialize on mount
  useEffect(() => {
    if (focusStates.size === 0) {
      initializeFocusTrees();
    }
  }, [initializeFocusTrees, focusStates.size]);

  return {
    // State
    focusStates,
    completionLog,

    // Queries
    getFocusState,
    getAvailableFocuses,
    getCompletedFocuses,
    getActiveFocus,
    getCompletionHistory,
    isFocusAvailable,
    getFocusesByPath,

    // Mutations
    startFocus,
    cancelFocus,

    // Turn processing
    processTurnFocusProgress,

    // Initialization
    initializeFocusTrees,
  };
}
