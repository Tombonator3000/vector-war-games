/**
 * GameStateManager
 *
 * Centralized game state management system.
 * Provides a clean interface for accessing and modifying the global game state.
 *
 * Phase 6 Refactoring: Extracted from Index.tsx
 */

import type {
  Nation,
  ConventionalWarfareDelta,
  SatelliteOrbit,
  FalloutMark,
  Missile,
  Bomber,
  Submarine,
  Explosion,
  Particle,
  RadiationZone,
  EMPEffect,
  Ring,
  RefugeeCamp
} from '@/types/game';
import type { ConventionalState, NationConventionalProfile } from '@/hooks/useConventionalWarfare';
import type { ScenarioConfig } from '@/types/scenario';
import { getDefaultScenario } from '@/types/scenario';
import { createDefaultConventionalState } from '@/hooks/useConventionalWarfare';
import type { GreatOldOnesState } from '@/types/greatOldOnes';

/**
 * Diplomacy state tracking
 */
export interface DiplomacyState {
  peaceTurns: number;
  lastEvaluatedTurn: number;
  allianceRatio: number;
  influenceScore: number;
  nearVictoryNotified: boolean;
  victoryAnnounced: boolean;
}

/**
 * Core game state interface
 */
export interface GameState {
  turn: number;
  defcon: number;
  phase: 'PLAYER' | 'AI' | 'RESOLUTION' | 'PRODUCTION';
  actionsRemaining: number;
  paused: boolean;
  gameOver: boolean;
  selectedLeader: string | null;
  selectedDoctrine: string | null;
  playerName?: string;
  difficulty?: string;
  missiles: Missile[];
  bombers: Bomber[];
  submarines?: Submarine[];
  explosions: Explosion[];
  particles: Particle[];
  radiationZones: RadiationZone[];
  empEffects: EMPEffect[];
  rings: Ring[];
  refugeeCamps?: RefugeeCamp[];
  screenShake: number;
  overlay?: { text: string; ttl: number } | null;
  fx?: number;
  nuclearWinterLevel?: number;
  globalRadiation?: number;
  events?: boolean;
  diplomacy?: DiplomacyState;
  conventional?: ConventionalState;
  conventionalMovements?: unknown[];
  conventionalUnits?: unknown[];
  satelliteOrbits: SatelliteOrbit[];
  falloutMarks: FalloutMark[];
  statistics?: {
    nukesLaunched: number;
    nukesReceived: number;
    enemiesDestroyed: number;
  };
  showEndGameScreen?: boolean;
  endGameStatistics?: unknown;
  scenario?: ScenarioConfig;
  greatOldOnes?: GreatOldOnesState;
  victoryProgressNotifications?: {
    economic: boolean;
    demographic: boolean;
    cultural: boolean;
    survival: boolean;
    domination: boolean;
  };
}

/**
 * Local game state (includes conventional warfare)
 */
export type LocalGameState = GameState & {
  conventional?: ConventionalState;
};

/**
 * Local nation type (extends Nation with additional properties)
 */
export type LocalNation = Nation & {
  conventional?: NationConventionalProfile;
  controlledTerritories?: string[];
};

/**
 * Helper function to create default diplomacy state
 */
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

/**
 * GameStateManager class
 *
 * Manages the global game state (S object) and provides a clean API
 * for state access and modification.
 */
class GameStateManager {
  /**
   * The global game state
   * Exposed for backward compatibility with existing code
   */
  private static _state: LocalGameState = {
    turn: 1,
    defcon: 5,
    phase: 'PLAYER',
    actionsRemaining: 1,
    paused: false,
    gameOver: false,
    selectedLeader: null,
    selectedDoctrine: null,
    scenario: getDefaultScenario(),
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
    satelliteOrbits: [],
    screenShake: 0,
    fx: 1,
    nuclearWinterLevel: 0,
    globalRadiation: 0,
    diplomacy: createDefaultDiplomacyState(),
    conventional: createDefaultConventionalState(),
    conventionalMovements: [],
    conventionalUnits: [],
    statistics: {
      nukesLaunched: 0,
      nukesReceived: 0,
      enemiesDestroyed: 0,
    },
    showEndGameScreen: false,
  };

  /**
   * Nations array
   */
  private static _nations: LocalNation[] = [];

  /**
   * Conventional warfare deltas
   */
  private static _conventionalDeltas: ConventionalWarfareDelta[] = [];

  /**
   * Gets the raw state object (for backward compatibility)
   */
  static getState(): LocalGameState {
    return this._state;
  }

  /**
   * Sets the entire state object (use with caution)
   */
  static setState(state: LocalGameState): void {
    this._state = state;
  }

  /**
   * Gets the nations array
   */
  static getNations(): LocalNation[] {
    return this._nations;
  }

  /**
   * Sets the nations array
   */
  static setNations(nations: LocalNation[]): void {
    this._nations = nations;
  }

  /**
   * Gets the conventional deltas array
   */
  static getConventionalDeltas(): ConventionalWarfareDelta[] {
    return this._conventionalDeltas;
  }

  /**
   * Sets the conventional deltas array
   */
  static setConventionalDeltas(deltas: ConventionalWarfareDelta[]): void {
    this._conventionalDeltas = deltas;
  }

  // ============================================
  // GAME PHASE AND TURN MANAGEMENT
  // ============================================

  /**
   * Gets the current turn number
   */
  static getTurn(): number {
    return this._state.turn;
  }

  /**
   * Sets the turn number
   */
  static setTurn(turn: number): void {
    this._state.turn = turn;
  }

  /**
   * Advances to the next turn
   */
  static nextTurn(): void {
    this._state.turn++;
  }

  /**
   * Gets the current game phase
   */
  static getPhase(): 'PLAYER' | 'AI' | 'RESOLUTION' | 'PRODUCTION' {
    return this._state.phase;
  }

  /**
   * Sets the game phase
   */
  static setPhase(phase: 'PLAYER' | 'AI' | 'RESOLUTION' | 'PRODUCTION'): void {
    this._state.phase = phase;
  }

  /**
   * Gets the DEFCON level
   */
  static getDefcon(): number {
    return this._state.defcon;
  }

  /**
   * Sets the DEFCON level
   */
  static setDefcon(defcon: number): void {
    this._state.defcon = Math.max(1, Math.min(5, defcon));
  }

  /**
   * Gets actions remaining
   */
  static getActionsRemaining(): number {
    return this._state.actionsRemaining;
  }

  /**
   * Sets actions remaining
   */
  static setActionsRemaining(actions: number): void {
    this._state.actionsRemaining = actions;
  }

  /**
   * Decrements actions remaining
   */
  static consumeAction(): void {
    this._state.actionsRemaining = Math.max(0, this._state.actionsRemaining - 1);
  }

  // ============================================
  // GAME STATE FLAGS
  // ============================================

  /**
   * Checks if the game is paused
   */
  static isPaused(): boolean {
    return this._state.paused;
  }

  /**
   * Sets the paused state
   */
  static setPaused(paused: boolean): void {
    this._state.paused = paused;
  }

  /**
   * Checks if the game is over
   */
  static isGameOver(): boolean {
    return this._state.gameOver;
  }

  /**
   * Sets the game over state
   */
  static setGameOver(gameOver: boolean): void {
    this._state.gameOver = gameOver;
  }

  // ============================================
  // LEADER AND DOCTRINE
  // ============================================

  /**
   * Gets the selected leader
   */
  static getSelectedLeader(): string | null {
    return this._state.selectedLeader;
  }

  /**
   * Sets the selected leader
   */
  static setSelectedLeader(leader: string | null): void {
    this._state.selectedLeader = leader;
  }

  /**
   * Gets the selected doctrine
   */
  static getSelectedDoctrine(): string | null {
    return this._state.selectedDoctrine;
  }

  /**
   * Sets the selected doctrine
   */
  static setSelectedDoctrine(doctrine: string | null): void {
    this._state.selectedDoctrine = doctrine;
  }

  // ============================================
  // WEAPONS AND UNITS
  // ============================================

  /**
   * Gets all missiles
   */
  static getMissiles(): Missile[] {
    return this._state.missiles;
  }

  /**
   * Adds a missile
   */
  static addMissile(missile: Missile): void {
    this._state.missiles.push(missile);
  }

  /**
   * Gets all bombers
   */
  static getBombers(): Bomber[] {
    return this._state.bombers;
  }

  /**
   * Adds a bomber
   */
  static addBomber(bomber: Bomber): void {
    this._state.bombers.push(bomber);
  }

  /**
   * Gets all submarines
   */
  static getSubmarines(): Submarine[] {
    return this._state.submarines || [];
  }

  /**
   * Adds a submarine
   */
  static addSubmarine(submarine: Submarine): void {
    if (!this._state.submarines) {
      this._state.submarines = [];
    }
    this._state.submarines.push(submarine);
  }

  // ============================================
  // VISUAL EFFECTS
  // ============================================

  /**
   * Gets all explosions
   */
  static getExplosions(): Explosion[] {
    return this._state.explosions;
  }

  /**
   * Adds an explosion
   */
  static addExplosion(explosion: Explosion): void {
    this._state.explosions.push(explosion);
  }

  /**
   * Gets all particles
   */
  static getParticles(): Particle[] {
    return this._state.particles;
  }

  /**
   * Gets screen shake intensity
   */
  static getScreenShake(): number {
    return this._state.screenShake;
  }

  /**
   * Sets screen shake intensity
   */
  static setScreenShake(intensity: number): void {
    this._state.screenShake = intensity;
  }

  /**
   * Adds screen shake
   */
  static addScreenShake(amount: number): void {
    this._state.screenShake += amount;
  }

  // ============================================
  // ENVIRONMENTAL EFFECTS
  // ============================================

  /**
   * Gets nuclear winter level
   */
  static getNuclearWinterLevel(): number {
    return this._state.nuclearWinterLevel || 0;
  }

  /**
   * Sets nuclear winter level
   */
  static setNuclearWinterLevel(level: number): void {
    this._state.nuclearWinterLevel = level;
  }

  /**
   * Gets global radiation level
   */
  static getGlobalRadiation(): number {
    return this._state.globalRadiation || 0;
  }

  /**
   * Sets global radiation level
   */
  static setGlobalRadiation(level: number): void {
    this._state.globalRadiation = level;
  }

  /**
   * Gets radiation zones
   */
  static getRadiationZones(): any[] {
    return this._state.radiationZones;
  }

  /**
   * Gets fallout marks
   */
  static getFalloutMarks(): FalloutMark[] {
    return this._state.falloutMarks;
  }

  // ============================================
  // STATISTICS
  // ============================================

  /**
   * Gets game statistics
   */
  static getStatistics() {
    if (!this._state.statistics) {
      this._state.statistics = {
        nukesLaunched: 0,
        nukesReceived: 0,
        enemiesDestroyed: 0,
      };
    }
    return this._state.statistics;
  }

  /**
   * Increments nukes launched
   */
  static incrementNukesLaunched(count = 1): void {
    const stats = this.getStatistics();
    stats.nukesLaunched += count;
  }

  /**
   * Increments nukes received
   */
  static incrementNukesReceived(count = 1): void {
    const stats = this.getStatistics();
    stats.nukesReceived += count;
  }

  /**
   * Increments enemies destroyed
   */
  static incrementEnemiesDestroyed(count = 1): void {
    const stats = this.getStatistics();
    stats.enemiesDestroyed += count;
  }

  // ============================================
  // DIPLOMACY
  // ============================================

  /**
   * Gets diplomacy state
   */
  static getDiplomacy(): DiplomacyState {
    if (!this._state.diplomacy) {
      this._state.diplomacy = createDefaultDiplomacyState();
    }
    return this._state.diplomacy;
  }

  /**
   * Sets diplomacy state
   */
  static setDiplomacy(diplomacy: DiplomacyState): void {
    this._state.diplomacy = diplomacy;
  }

  // ============================================
  // CONVENTIONAL WARFARE
  // ============================================

  /**
   * Gets conventional warfare state
   */
  static getConventional(): ConventionalState | undefined {
    return this._state.conventional;
  }

  /**
   * Sets conventional warfare state
   */
  static setConventional(conventional: ConventionalState): void {
    this._state.conventional = conventional;
  }

  // ============================================
  // SCENARIO
  // ============================================

  /**
   * Gets the current scenario
   */
  static getScenario(): ScenarioConfig | undefined {
    return this._state.scenario;
  }

  /**
   * Sets the scenario
   */
  static setScenario(scenario: ScenarioConfig): void {
    this._state.scenario = scenario;
  }

  // ============================================
  // GREAT OLD ONES
  // ============================================

  /**
   * Gets the Great Old Ones state
   */
  static getGreatOldOnes(): GreatOldOnesState | undefined {
    return this._state.greatOldOnes;
  }

  /**
   * Sets the Great Old Ones state
   */
  static setGreatOldOnes(greatOldOnes: GreatOldOnesState | undefined): void {
    this._state.greatOldOnes = greatOldOnes;
  }

  // ============================================
  // INITIALIZATION AND RESET
  // ============================================

  /**
   * Resets the game state to initial values
   */
  static reset(): void {
    this._state = {
      turn: 1,
      defcon: 5,
      phase: 'PLAYER',
      actionsRemaining: 1,
      paused: false,
      gameOver: false,
      selectedLeader: null,
      selectedDoctrine: null,
      scenario: getDefaultScenario(),
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
      satelliteOrbits: [],
      screenShake: 0,
      fx: 1,
      nuclearWinterLevel: 0,
      globalRadiation: 0,
      diplomacy: createDefaultDiplomacyState(),
      conventional: createDefaultConventionalState(),
      conventionalMovements: [],
      conventionalUnits: [],
      statistics: {
        nukesLaunched: 0,
        nukesReceived: 0,
        enemiesDestroyed: 0,
      },
      showEndGameScreen: false,
    };
    this._nations = [];
    this._conventionalDeltas = [];
  }

  /**
   * Initializes state with a scenario
   */
  static initializeWithScenario(scenario: ScenarioConfig): void {
    this.reset();
    this._state.scenario = scenario;
  }
}

export default GameStateManager;
