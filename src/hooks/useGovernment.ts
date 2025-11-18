import { useCallback, useEffect, useState, useRef } from 'react';
import {
  type GovernmentState,
  type GovernmentType,
  type GovernmentBonuses,
  type GovernmentTransition,
  type CoupAttempt,
  GOVERNMENT_BONUSES,
  calculateCoupRisk,
  shouldHoldElection,
  getElectionInterval,
  calculateSuccessionClarity,
  isAuthoritarian,
} from '@/types/government';
import { useRNG } from '@/contexts/RNGContext';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Reference to a nation for government calculations
 */
export interface GovernmentNationRef {
  id: string;
  name: string;
  isPlayer: boolean;
  morale: number;
  publicOpinion: number;
  cabinetApproval: number;
  instability?: number;
  electionTimer: number;
  missiles: number;
  bombers?: number;
  submarines?: number;
  governmentState?: GovernmentState;
}

/**
 * Options for useGovernment hook
 */
export interface UseGovernmentOptions {
  currentTurn: number;
  getNations: () => GovernmentNationRef[];
  onGovernmentSync?: (nationId: string, state: GovernmentState) => void;
  onGovernmentTransition?: (nationId: string, transition: GovernmentTransition) => void;
  onAddNewsItem?: (category: 'governance' | 'crisis' | 'diplomatic', text: string, priority: 'routine' | 'important' | 'critical') => void;
  nationsVersion?: number;
}

/**
 * Default government state for initialization
 */
const DEFAULT_GOVERNMENT_STATE: GovernmentState = {
  currentGovernment: 'democracy',
  governmentStability: 70,
  legitimacy: 65,
  governmentSupport: {
    democracy: 40,
    constitutional_monarchy: 15,
    dictatorship: 10,
    military_junta: 5,
    one_party_state: 10,
    absolute_monarchy: 8,
    technocracy: 8,
    theocracy: 4,
  },
  cameByForce: false,
  coupRisk: 15,
  successionClarity: 100,
  turnsInPower: 0,
};

/**
 * Initialize government state from nation data
 */
function initializeGovernmentState(nation: GovernmentNationRef): GovernmentState {
  if (nation.governmentState) {
    return { ...nation.governmentState };
  }

  // Default to democracy for new nations
  return {
    ...DEFAULT_GOVERNMENT_STATE,
    governmentStability: nation.morale ?? 70,
    legitimacy: nation.publicOpinion ?? 65,
  };
}

/**
 * Calculate military strength for coup risk assessment
 */
function calculateMilitaryStrength(nation: GovernmentNationRef): number {
  const missiles = nation.missiles ?? 0;
  const bombers = nation.bombers ?? 0;
  const submarines = nation.submarines ?? 0;

  // Rough estimate of military strength (0-100)
  const totalUnits = missiles + bombers * 1.5 + submarines * 2;
  return Math.min(100, totalUnits * 2);
}

export interface UseGovernmentReturn {
  governmentStates: Record<string, GovernmentState>;
  getGovernmentBonuses: (nationId: string) => GovernmentBonuses;
  attemptCoup: (nationId: string, targetGovernment: GovernmentType) => CoupAttempt | null;
  transitionGovernment: (nationId: string, newGovernment: GovernmentType, transitionType: GovernmentTransition['transitionType']) => void;
  getElectionInterval: (nationId: string) => number;
}

/**
 * Hook for managing government systems across all nations
 */
export function useGovernment({
  currentTurn,
  getNations,
  onGovernmentSync,
  onGovernmentTransition,
  onAddNewsItem,
  nationsVersion = 0,
}: UseGovernmentOptions): UseGovernmentReturn {
  const { rng } = useRNG();

  const [governmentStates, setGovernmentStates] = useState<Record<string, GovernmentState>>(() => {
    const initial: Record<string, GovernmentState> = {};
    getNations().forEach((nation) => {
      initial[nation.id] = initializeGovernmentState(nation);
    });
    return initial;
  });

  const lastProcessedTurnRef = useRef<number | null>(null);
  const lastProcessedVersionRef = useRef<number | null>(null);

  /**
   * Sync a nation's government state
   */
  const syncGovernmentState = useCallback(
    (nationId: string, updater: (current: GovernmentState) => GovernmentState) => {
      setGovernmentStates((prev) => {
        const current = prev[nationId] ?? { ...DEFAULT_GOVERNMENT_STATE };
        const next = updater(current);
        onGovernmentSync?.(nationId, next);
        return { ...prev, [nationId]: next };
      });
    },
    [onGovernmentSync]
  );

  /**
   * Get government bonuses for a nation
   */
  const getGovernmentBonuses = useCallback(
    (nationId: string): GovernmentBonuses => {
      const state = governmentStates[nationId];
      if (!state) {
        return GOVERNMENT_BONUSES.democracy;
      }
      return GOVERNMENT_BONUSES[state.currentGovernment];
    },
    [governmentStates]
  );

  /**
   * Get election interval for a nation
   */
  const getElectionIntervalForNation = useCallback(
    (nationId: string): number => {
      const state = governmentStates[nationId];
      if (!state) {
        return 12;
      }
      return getElectionInterval(state.currentGovernment);
    },
    [governmentStates]
  );

  /**
   * Attempt a coup in a nation
   */
  const attemptCoup = useCallback(
    (nationId: string, targetGovernment: GovernmentType): CoupAttempt | null => {
      const nation = getNations().find((n) => n.id === nationId);
      const state = governmentStates[nationId];

      if (!nation || !state) {
        return null;
      }

      const coupStrength = state.coupRisk + rng.next() * 30;
      const governmentResistance = state.governmentStability + state.legitimacy / 2;

      const succeeded = coupStrength > governmentResistance;

      const coupAttempt: CoupAttempt = {
        turn: currentTurn,
        faction: 'Military Officers', // Could be randomized or specified
        targetGovernment,
        strength: coupStrength,
        succeeded,
        casualties: Math.floor(rng.next() * 10000),
      };

      if (succeeded) {
        // Coup succeeded - transition government
        transitionGovernment(nationId, targetGovernment, 'coup');

        onAddNewsItem?.(
          'crisis',
          `Coup succeeds in ${nation.name}! ${targetGovernment} government takes power.`,
          'critical'
        );
      } else {
        // Coup failed - increase stability but reduce coup risk temporarily
        syncGovernmentState(nationId, (current) => ({
          ...current,
          governmentStability: Math.min(100, current.governmentStability + 10),
          coupRisk: Math.max(0, current.coupRisk - 20),
        }));

        onAddNewsItem?.(
          'governance',
          `Coup attempt fails in ${nation.name}. Government consolidates power.`,
          'important'
        );
      }

      return coupAttempt;
    },
    [currentTurn, getNations, governmentStates, onAddNewsItem, rng, syncGovernmentState]
  );

  /**
   * Transition to a new government type
   */
  const transitionGovernment = useCallback(
    (
      nationId: string,
      newGovernment: GovernmentType,
      transitionType: GovernmentTransition['transitionType']
    ) => {
      const nation = getNations().find((n) => n.id === nationId);
      const state = governmentStates[nationId];

      if (!nation || !state) {
        return;
      }

      const peaceful = ['election', 'reform', 'inheritance'].includes(transitionType);
      const stabilityCost = peaceful ? 10 : 30;

      const transition: GovernmentTransition = {
        turn: currentTurn,
        fromGovernment: state.currentGovernment,
        toGovernment: newGovernment,
        transitionType,
        peaceful,
        stabilityCost,
        description: `${nation.name} transitions from ${state.currentGovernment} to ${newGovernment} via ${transitionType}`,
      };

      syncGovernmentState(nationId, (current) => ({
        ...current,
        currentGovernment: newGovernment,
        governmentStability: Math.max(0, current.governmentStability - stabilityCost),
        legitimacy: peaceful ? current.legitimacy : Math.max(30, current.legitimacy - 20),
        lastGovernmentChangeTurn: currentTurn,
        cameByForce: !peaceful,
        turnsInPower: 0,
        coupRisk: peaceful ? current.coupRisk : Math.min(100, current.coupRisk + 30),
      }));

      onGovernmentTransition?.(nationId, transition);

      if (nation.isPlayer) {
        onAddNewsItem?.(
          'governance',
          transition.description,
          peaceful ? 'important' : 'critical'
        );
      }
    },
    [currentTurn, getNations, governmentStates, onAddNewsItem, onGovernmentTransition, syncGovernmentState]
  );

  /**
   * Update government states each turn
   */
  useEffect(() => {
    const turnChanged = lastProcessedTurnRef.current !== currentTurn;
    const versionChanged = lastProcessedVersionRef.current !== nationsVersion;

    if (!turnChanged && !versionChanged) {
      return;
    }

    lastProcessedTurnRef.current = currentTurn;
    lastProcessedVersionRef.current = nationsVersion;

    const nations = getNations();

    nations.forEach((nation) => {
      const current = governmentStates[nation.id];

      // Initialize new nations
      if (!current) {
        const initialState = initializeGovernmentState(nation);
        syncGovernmentState(nation.id, () => initialState);
        return;
      }

      // Skip updates on turn 0 and 1
      if (currentTurn <= 1) {
        return;
      }

      // Only update on turn changes, not version changes
      if (!turnChanged) {
        return;
      }

      // Calculate new values
      const bonuses = GOVERNMENT_BONUSES[current.currentGovernment];

      // Stability drifts towards base modifier
      const targetStability = 70 + bonuses.baseStabilityModifier;
      const stabilityDrift = (targetStability - current.governmentStability) * 0.05;
      const moraleEffect = (nation.morale - 50) * 0.1;
      const newStability = clamp(
        current.governmentStability + stabilityDrift + moraleEffect,
        0,
        100
      );

      // Legitimacy affected by public opinion and time in power
      const opinionEffect = (nation.publicOpinion - 50) * 0.08;
      const timeBonus = current.turnsInPower > 20 ? 5 : current.turnsInPower * 0.25;
      const newLegitimacy = clamp(
        current.legitimacy + opinionEffect + (current.cameByForce ? -0.5 : 0.3) + timeBonus * 0.1,
        0,
        100
      );

      // Calculate coup risk
      const militaryStrength = calculateMilitaryStrength(nation);
      const newCoupRisk = calculateCoupRisk(
        current.currentGovernment,
        newStability,
        newLegitimacy,
        nation.morale,
        militaryStrength
      );

      // Calculate succession clarity
      const newSuccessionClarity = calculateSuccessionClarity(
        current.currentGovernment,
        current.turnsInPower,
        newLegitimacy
      );

      // Update government support based on performance
      const newSupport = { ...current.governmentSupport };

      // Current government gains support if performing well
      if (nation.morale > 70 && nation.publicOpinion > 70) {
        newSupport[current.currentGovernment] = Math.min(
          100,
          newSupport[current.currentGovernment] + 1
        );
      } else if (nation.morale < 40 || nation.publicOpinion < 40) {
        // Loses support if performing poorly
        newSupport[current.currentGovernment] = Math.max(
          0,
          newSupport[current.currentGovernment] - 1
        );

        // Other government types gain support
        const alternatives: GovernmentType[] = current.currentGovernment === 'democracy'
          ? ['dictatorship', 'military_junta', 'one_party_state']
          : ['democracy', 'constitutional_monarchy'];

        alternatives.forEach((alt) => {
          newSupport[alt] = Math.min(100, newSupport[alt] + 0.5);
        });
      }

      // Check for automatic coup attempts in non-player nations
      if (!nation.isPlayer && newCoupRisk > 80 && rng.next() > 0.7) {
        // AI nation has high coup risk - might experience coup
        const targetGov: GovernmentType = isAuthoritarian(current.currentGovernment)
          ? 'democracy'
          : 'military_junta';

        attemptCoup(nation.id, targetGov);
        return; // Coup attempt handles state update
      }

      // Update state
      syncGovernmentState(nation.id, () => ({
        ...current,
        governmentStability: newStability,
        legitimacy: newLegitimacy,
        coupRisk: newCoupRisk,
        successionClarity: newSuccessionClarity,
        governmentSupport: newSupport,
        turnsInPower: current.turnsInPower + 1,
      }));
    });
  }, [currentTurn, getNations, nationsVersion, governmentStates, syncGovernmentState, rng, attemptCoup]);

  return {
    governmentStates,
    getGovernmentBonuses,
    attemptCoup,
    transitionGovernment,
    getElectionInterval: getElectionIntervalForNation,
  };
}
