import { useEffect, useCallback, useRef } from 'react';
import type {
  OppositionState,
  OppositionAction,
  OppositionPlatform,
} from '@/types/opposition';
import {
  calculateOppositionActivity,
  determineOppositionPlatform,
} from '@/types/opposition';
import { useRNG } from '@/contexts/RNGContext';

interface GovernanceMetrics {
  morale: number;
  publicOpinion: number;
  cabinetApproval: number;
  electionTimer: number;
}

interface NationRef {
  id: string;
  name: string;
  isPlayer: boolean;
  morale: number;
  publicOpinion: number;
  cabinetApproval: number;
  electionTimer: number;
  instability?: number;
  oppositionState?: OppositionState;
  treaties?: Record<string, any>;
}

interface UseOppositionOptions {
  currentTurn: number;
  getNations: () => NationRef[];
  metrics: Record<string, GovernanceMetrics>;
  onUpdateOpposition?: (nationId: string, oppositionState: OppositionState) => void;
  onAddNewsItem?: (category: string, text: string, priority: string) => void;
}

const DEFAULT_OPPOSITION: OppositionState = {
  strength: 30,
  platform: 'populist',
  recentActions: [],
  lastActiveTurn: 0,
  mobilizing: false,
};

/**
 * Hook for managing opposition state and activity
 */
export function useOpposition({
  currentTurn,
  getNations,
  metrics,
  onUpdateOpposition,
  onAddNewsItem,
}: UseOppositionOptions) {
  const { rng } = useRNG();
  const lastProcessedTurnRef = useRef<number | null>(null);

  /**
   * Initialize opposition state for a nation if not present
   */
  const initializeOpposition = useCallback(
    (nation: NationRef): OppositionState => {
      if (nation.oppositionState) {
        return nation.oppositionState;
      }

      // Determine initial platform based on nation state
      const isAtWar = nation.treaties
        ? Object.values(nation.treaties).some((treaty: any) => !treaty.alliance && treaty.truceTurns === undefined)
        : false;
      const allianceCount = nation.treaties
        ? Object.values(nation.treaties).filter((treaty: any) => treaty.alliance).length
        : 0;

      const platform = determineOppositionPlatform(nation.morale, isAtWar, allianceCount);

      return {
        ...DEFAULT_OPPOSITION,
        platform,
        strength: 100 - nation.publicOpinion, // Opposition stronger when opinion is low
      };
    },
    [],
  );

  /**
   * Update opposition strength and activity each turn
   */
  const updateOpposition = useCallback(
    (nation: NationRef, oppositionState: OppositionState): OppositionState => {
      const nationMetrics = metrics[nation.id];
      if (!nationMetrics) {
        return oppositionState;
      }

      // Calculate new opposition strength based on government performance
      const activityLevel = calculateOppositionActivity(
        nationMetrics.publicOpinion,
        nationMetrics.cabinetApproval,
        nationMetrics.morale,
        nation.instability ?? 0,
      );

      // Opposition strength drifts towards activity level
      const strengthDrift = (activityLevel - oppositionState.strength) * 0.15;
      const newStrength = Math.max(0, Math.min(100, oppositionState.strength + strengthDrift));

      // Check if opposition should mobilize for election
      const mobilizing =
        nationMetrics.electionTimer <= 3 &&
        (newStrength > 60 || nationMetrics.publicOpinion < 40);

      // Update platform based on current situation
      const isAtWar = nation.treaties
        ? Object.values(nation.treaties).some((treaty: any) => !treaty.alliance && treaty.truceTurns === undefined)
        : false;
      const allianceCount = nation.treaties
        ? Object.values(nation.treaties).filter((treaty: any) => treaty.alliance).length
        : 0;

      const newPlatform = determineOppositionPlatform(
        nationMetrics.morale,
        isAtWar,
        allianceCount,
      );

      return {
        ...oppositionState,
        strength: newStrength,
        platform: newPlatform,
        lastActiveTurn: currentTurn,
        mobilizing,
      };
    },
    [currentTurn, metrics],
  );

  /**
   * Attempt to trigger an opposition action
   */
  const attemptOppositionAction = useCallback(
    (nation: NationRef, oppositionState: OppositionState): OppositionAction | null => {
      // Only attempt actions periodically and when opposition is strong enough
      if (oppositionState.strength < 40) {
        return null;
      }

      // Chance of action based on strength
      const actionChance = (oppositionState.strength - 40) / 60; // 0 at 40, 1.0 at 100
      if (rng.next() > actionChance * 0.3) {
        // 30% max chance per turn
        return null;
      }

      const nationMetrics = metrics[nation.id];
      if (!nationMetrics) {
        return null;
      }

      // Select action type based on situation
      let actionType: OppositionAction['type'] = 'promise_reform';
      let description = '';
      const effects: OppositionAction['effects'] = {};

      if (nationMetrics.cabinetApproval < 35 && oppositionState.strength > 65) {
        actionType = 'no_confidence';
        description = `Opposition calls for no-confidence vote in ${nation.name}!`;
        effects.cabinetApproval = -8;
        effects.instability = 6;
      } else if (nationMetrics.morale < 45) {
        actionType = 'leak';
        description = `Opposition leaks military setbacks in ${nation.name}.`;
        effects.morale = -5;
        effects.publicOpinion = -4;
        effects.cabinetApproval = -6;
      } else if (nationMetrics.publicOpinion < 50) {
        actionType = 'promise_reform';
        description = `Opposition promises sweeping reforms in ${nation.name}.`;
        effects.publicOpinion = -6;
      } else if (oppositionState.mobilizing) {
        actionType = 'protest';
        description = `Opposition stages protests ahead of ${nation.name} election.`;
        effects.publicOpinion = -8;
        effects.instability = 5;
      } else {
        actionType = 'scandal';
        description = `Opposition manufactures scandal in ${nation.name}.`;
        effects.cabinetApproval = -7;
        effects.publicOpinion = -3;
      }

      return {
        id: `${actionType}_${currentTurn}_${nation.id}`,
        type: actionType,
        turn: currentTurn,
        effects,
        description,
      };
    },
    [currentTurn, metrics, rng],
  );

  /**
   * Main effect: Update opposition state each turn
   */
  useEffect(() => {
    if (lastProcessedTurnRef.current === currentTurn) {
      return;
    }

    lastProcessedTurnRef.current = currentTurn;

    const nations = getNations();
    nations.forEach((nation) => {
      // Initialize if needed
      const currentOpposition = nation.oppositionState ?? initializeOpposition(nation);

      // Update opposition strength and status
      const updatedOpposition = updateOpposition(nation, currentOpposition);

      // Attempt opposition action (with low probability)
      const action = attemptOppositionAction(nation, updatedOpposition);

      let finalOpposition = updatedOpposition;
      if (action) {
        // Add action to recent actions (keep last 5)
        finalOpposition = {
          ...updatedOpposition,
          recentActions: [action, ...updatedOpposition.recentActions].slice(0, 5),
        };

        // Notify about action
        if (nation.isPlayer) {
          onAddNewsItem?.('governance', action.description, 'important');
        } else {
          onAddNewsItem?.('governance', action.description, 'routine');
        }
      }

      // Sync back to game state
      if (onUpdateOpposition) {
        onUpdateOpposition(nation.id, finalOpposition);
      }
    });
  }, [
    currentTurn,
    getNations,
    initializeOpposition,
    updateOpposition,
    attemptOppositionAction,
    onUpdateOpposition,
    onAddNewsItem,
  ]);

  return {
    initializeOpposition,
  };
}
