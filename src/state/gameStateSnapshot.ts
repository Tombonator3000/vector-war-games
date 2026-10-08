import type { LocalGameState } from './gameState.types';
import { createInitialGameState } from './initialGameState';

function validInteger(value: number | undefined, fallback: number, minimum: number, maximum = Infinity): number {
  return Number.isFinite(value)
    ? Math.min(maximum, Math.max(minimum, Math.trunc(value!)))
    : fallback;
}

function arrayOrEmpty<T>(value: T[] | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

/**
 * Restore required fields missing from older or partial snapshots.
 * This preserves references for the legacy live-state API; remote snapshots
 * must go through cloneGameStateSnapshot before entering the mutable runtime.
 */
export function normalizeGameState(state: Partial<LocalGameState>): LocalGameState {
  const defaults = createInitialGameState();
  const normalized = { ...defaults, ...state };
  return {
    ...normalized,
    turn: validInteger(state.turn, defaults.turn, 1),
    defcon: validInteger(state.defcon, defaults.defcon, 1, 5),
    actionsRemaining: validInteger(state.actionsRemaining, defaults.actionsRemaining, 0),
    phase: ['PLAYER', 'AI', 'RESOLUTION', 'PRODUCTION'].includes(state.phase ?? '')
      ? state.phase!
      : defaults.phase,
    paused: typeof state.paused === 'boolean' ? state.paused : defaults.paused,
    gameOver: typeof state.gameOver === 'boolean' ? state.gameOver : defaults.gameOver,
    selectedLeader: typeof state.selectedLeader === 'string' ? state.selectedLeader : null,
    selectedDoctrine: typeof state.selectedDoctrine === 'string' ? state.selectedDoctrine : null,
    scenario: state.scenario ?? defaults.scenario,
    screenShake: Number.isFinite(state.screenShake) ? Math.max(0, state.screenShake!) : 0,
    nations: arrayOrEmpty(state.nations),
    missiles: arrayOrEmpty(state.missiles),
    bombers: arrayOrEmpty(state.bombers),
    submarines: arrayOrEmpty(state.submarines),
    explosions: arrayOrEmpty(state.explosions),
    particles: arrayOrEmpty(state.particles),
    radiationZones: arrayOrEmpty(state.radiationZones),
    empEffects: arrayOrEmpty(state.empEffects),
    rings: arrayOrEmpty(state.rings),
    refugeeCamps: arrayOrEmpty(state.refugeeCamps),
    falloutMarks: arrayOrEmpty(state.falloutMarks),
    satelliteOrbits: arrayOrEmpty(state.satelliteOrbits),
    falloutEffects: state.falloutEffects ?? {},
    diplomacy: { ...defaults.diplomacy!, ...state.diplomacy },
    statistics: {
      nukesLaunched: state.statistics?.nukesLaunched ?? 0,
      nukesReceived: state.statistics?.nukesReceived ?? 0,
      enemiesDestroyed: state.statistics?.enemiesDestroyed ?? 0,
      nonPandemicCasualties: state.statistics?.nonPandemicCasualties ?? 0,
    },
  };
}

/** Clone the complete graph so nested nation and campaign state cannot leak. */
export function cloneGameStateSnapshot(state: Partial<LocalGameState>): LocalGameState {
  return structuredClone(normalizeGameState(state));
}

