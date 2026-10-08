import type { LocalGameState, DiplomacyState } from './gameState.types';
import { getDefaultScenario } from '@/types/scenario';

export function createDefaultDiplomacyState(): DiplomacyState {
  return {
    peaceTurns: 0,
    lastEvaluatedTurn: 0,
    allianceRatio: 0,
    influenceScore: 0,
    nearVictoryNotified: false,
    victoryAnnounced: false,
  };
}

/** Each new game owns fresh arrays, nested state, and scenario configuration. */
export function createInitialGameState(): LocalGameState {
  return {
    turn: 1,
    defcon: 5,
    phase: 'PLAYER',
    actionsRemaining: 1,
    paused: false,
    gameOver: false,
    selectedLeader: null,
    selectedDoctrine: null,
    scenario: structuredClone(getDefaultScenario()),
    missiles: [],
    bombers: [],
    submarines: [],
    explosions: [],
    particles: [],
    radiationZones: [],
    empEffects: [],
    rings: [],
    refugeeCamps: [],
    falloutMarks: [],
    falloutEffects: {},
    satelliteOrbits: [],
    screenShake: 0,
    overlay: null,
    fx: 1,
    nuclearWinterLevel: 0,
    globalRadiation: 0,
    events: false,
    diplomacy: createDefaultDiplomacyState(),
    conventional: {
      templates: {},
      units: {},
      territories: {},
      logs: [],
      reinforcementPools: {},
    },
    conventionalMovements: [],
    conventionalUnits: [],
    casusBelliState: {
      allWars: [],
      warHistory: [],
    },
    statistics: {
      nukesLaunched: 0,
      nukesReceived: 0,
      enemiesDestroyed: 0,
      nonPandemicCasualties: 0,
    },
    showEndGameScreen: false,
    endGameStatistics: undefined,
    pendingEndGameReveal: undefined,
    endGameRevealRequiresConfirmation: false,
    territoryResources: undefined,
    resourceTrades: [],
    resourceMarket: undefined,
    depletionWarnings: [],
    greatOldOnes: undefined,
    diplomacyPhase3: undefined,
    multiPartyDiplomacy: undefined,
    doctrineIncidentState: undefined,
    doctrineShiftState: undefined,
    advancedPropaganda: undefined,
    victoryProgressNotifications: undefined,
    nations: [],
  };
}

