/**
 * GameStateManager
 *
 * Centralized game state management system.
 * Provides a clean interface for accessing and modifying the global game state.
 *
 * Phase 6 Refactoring: Extracted from Index.tsx
 */

import type {
  ConventionalWarfareDelta,
  FalloutMark,
  Missile,
  Bomber,
  Submarine,
  Explosion,
  Particle,
  RadiationZone,
  DiplomacyState,
} from '@/types/game';
import type { ConventionalState } from '@/hooks/useConventionalWarfare';
import type { ScenarioConfig } from '@/types/scenario';
import type { GreatOldOnesState } from '@/types/greatOldOnes';
import type { LocalGameState, LocalNation } from './gameState.types';
import { createDefaultDiplomacyState, createInitialGameState } from './initialGameState';
import { normalizeGameState } from './gameStateSnapshot';

export type { GameState, LocalGameState, LocalNation, DiplomacyState } from './gameState.types';
export { createDefaultDiplomacyState } from './initialGameState';

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
  private static _state: LocalGameState = createInitialGameState();

  /**
   * Nations array
   */
  private static _nations: LocalNation[] = [];

  /**
   * Conventional warfare deltas
   */
  private static _conventionalDeltas: ConventionalWarfareDelta[] = [];

  private static _sessionVersion = 0;

  /** Identifies the current game so async callbacks can reject an old session. */
  static getSessionVersion(): number {
    return this._sessionVersion;
  }

  static getState(): LocalGameState {
    this._state.nations = this._nations;
    return this._state;
  }

  static setState(state: Partial<LocalGameState>): void {
    const targetState = this._state;
    const nextState = normalizeGameState(state);
    this._nations = nextState.nations;

    // Remove properties that no longer exist on the incoming state while
    // preserving the original object reference used by legacy consumers.
    Object.keys(targetState).forEach((key) => {
      if (!(key in nextState)) {
        Reflect.deleteProperty(targetState, key);
      }
    });

    Object.assign(targetState, nextState);
    targetState.nations = this._nations;
  }

  static getNations(): LocalNation[] {
    return this._nations;
  }

  static setNations(nations: LocalNation[]): void {
    this._nations = nations;
    this._state.nations = nations;
  }

  static getNation(nationId: string): LocalNation | undefined {
    return this._nations.find((nation) => nation.id === nationId);
  }

  /**
   * Updates a single nation with a partial payload or updater function
   */
  static updateNation(
    nationId: string,
    updates: Partial<LocalNation> | ((nation: LocalNation) => LocalNation)
  ): LocalNation | undefined {
    const index = this._nations.findIndex((nation) => nation.id === nationId);
    if (index === -1) {
      return undefined;
    }

    const current = this._nations[index];
    const next =
      typeof updates === 'function'
        ? updates(current)
        : { ...current, ...updates };

    this._nations[index] = next;
    this._state.nations = this._nations;
    return next;
  }

  /**
   * Applies a batch of nation updates in a single pass
   */
  static updateNations(updates: Map<string, Partial<LocalNation>>): LocalNation[] {
    if (updates.size === 0) {
      return this._nations;
    }

    const updated = this._nations.map((nation) => {
      const patch = updates.get(nation.id);
      return patch ? { ...nation, ...patch } : nation;
    });

    this._nations = updated;
    this._state.nations = this._nations;
    return this._nations;
  }

  static getConventionalDeltas(): ConventionalWarfareDelta[] {
    return this._conventionalDeltas;
  }

  static setConventionalDeltas(deltas: ConventionalWarfareDelta[]): void {
    this._conventionalDeltas = deltas;
  }

  // ============================================
  // GAME PHASE AND TURN MANAGEMENT
  // ============================================

  static getTurn(): number {
    return this._state.turn;
  }

  static setTurn(turn: number): void {
    this._state.turn = turn;
  }

  /**
   * Advances to the next turn
   */
  static nextTurn(): void {
    this._state.turn++;
  }

  static getPhase(): 'PLAYER' | 'AI' | 'RESOLUTION' | 'PRODUCTION' {
    return this._state.phase;
  }

  static setPhase(phase: 'PLAYER' | 'AI' | 'RESOLUTION' | 'PRODUCTION'): void {
    this._state.phase = phase;
  }

  static getDefcon(): number {
    return this._state.defcon;
  }

  static setDefcon(defcon: number): void {
    this._state.defcon = Math.max(1, Math.min(5, defcon));
  }

  static getDefconHistory(): import('@/types/game').DefconChangeEvent[] {
    return this._state.defconHistory || [];
  }

  static addDefconChangeEvent(event: import('@/types/game').DefconChangeEvent): void {
    if (!this._state.defconHistory) {
      this._state.defconHistory = [];
    }
    this._state.defconHistory.push(event);
  }

  static getActionsRemaining(): number {
    return this._state.actionsRemaining;
  }

  static setActionsRemaining(actions: number): void {
    this._state.actionsRemaining = actions;
  }

  static consumeAction(): void {
    this._state.actionsRemaining = Math.max(0, this._state.actionsRemaining - 1);
  }

  // ============================================
  // GAME STATE FLAGS
  // ============================================

  static isPaused(): boolean {
    return this._state.paused;
  }

  static setPaused(paused: boolean): void {
    this._state.paused = paused;
  }

  static isGameOver(): boolean {
    return this._state.gameOver;
  }

  static setGameOver(gameOver: boolean): void {
    this._state.gameOver = gameOver;
  }

  // ============================================
  // LEADER AND DOCTRINE
  // ============================================

  static getSelectedLeader(): string | null {
    return this._state.selectedLeader;
  }

  static setSelectedLeader(leader: string | null): void {
    this._state.selectedLeader = leader;
  }

  static getSelectedDoctrine(): string | null {
    return this._state.selectedDoctrine;
  }

  static setSelectedDoctrine(doctrine: string | null): void {
    this._state.selectedDoctrine = doctrine;
  }

  // ============================================
  // WEAPONS AND UNITS
  // ============================================

  static getMissiles(): Missile[] {
    return this._state.missiles;
  }

  static addMissile(missile: Missile): void {
    this._state.missiles.push(missile);
  }

  static getBombers(): Bomber[] {
    return this._state.bombers;
  }

  static addBomber(bomber: Bomber): void {
    this._state.bombers.push(bomber);
  }

  static getSubmarines(): Submarine[] {
    return this._state.submarines || [];
  }

  static addSubmarine(submarine: Submarine): void {
    if (!this._state.submarines) {
      this._state.submarines = [];
    }
    this._state.submarines.push(submarine);
  }

  // ============================================
  // VISUAL EFFECTS
  // ============================================

  static getExplosions(): Explosion[] {
    return this._state.explosions;
  }

  static addExplosion(explosion: Explosion): void {
    this._state.explosions.push(explosion);
  }

  static getParticles(): Particle[] {
    return this._state.particles;
  }

  static getScreenShake(): number {
    return this._state.screenShake;
  }

  static setScreenShake(intensity: number): void {
    this._state.screenShake = intensity;
  }

  static addScreenShake(amount: number): void {
    this._state.screenShake += amount;
  }

  // ============================================
  // ENVIRONMENTAL EFFECTS
  // ============================================

  static getNuclearWinterLevel(): number {
    return this._state.nuclearWinterLevel || 0;
  }

  static setNuclearWinterLevel(level: number): void {
    this._state.nuclearWinterLevel = level;
  }

  static getGlobalRadiation(): number {
    return this._state.globalRadiation || 0;
  }

  static setGlobalRadiation(level: number): void {
    this._state.globalRadiation = level;
  }

  static getRadiationZones(): RadiationZone[] {
    return this._state.radiationZones;
  }

  static getFalloutMarks(): FalloutMark[] {
    return this._state.falloutMarks;
  }

  // ============================================
  // STATISTICS
  // ============================================

  static getStatistics() {
    if (!this._state.statistics) {
      this._state.statistics = {
        nukesLaunched: 0,
        nukesReceived: 0,
        enemiesDestroyed: 0,
        nonPandemicCasualties: 0,
      };
    }
    return this._state.statistics;
  }

  static incrementNukesLaunched(count = 1): void {
    const stats = this.getStatistics();
    stats.nukesLaunched += count;
  }

  static incrementNukesReceived(count = 1): void {
    const stats = this.getStatistics();
    stats.nukesReceived += count;
  }

  static incrementEnemiesDestroyed(count = 1): void {
    const stats = this.getStatistics();
    stats.enemiesDestroyed += count;
  }

  static addNonPandemicCasualties(count: number): void {
    if (count <= 0) {
      return;
    }

    const stats = this.getStatistics();
    stats.nonPandemicCasualties += count;
  }

  // ============================================
  // DIPLOMACY
  // ============================================

  static getDiplomacy(): DiplomacyState {
    if (!this._state.diplomacy) {
      this._state.diplomacy = createDefaultDiplomacyState();
    }
    return this._state.diplomacy;
  }

  static setDiplomacy(diplomacy: DiplomacyState): void {
    this._state.diplomacy = diplomacy;
  }

  // ============================================
  // CONVENTIONAL WARFARE
  // ============================================

  static getConventional(): ConventionalState | undefined {
    return this._state.conventional;
  }

  static setConventional(conventional: ConventionalState): void {
    this._state.conventional = conventional;
  }

  // ============================================
  // SCENARIO
  // ============================================

  static getScenario(): ScenarioConfig | undefined {
    return this._state.scenario;
  }

  static setScenario(scenario: ScenarioConfig): void {
    this._state.scenario = structuredClone(scenario);
  }

  // ============================================
  // GREAT OLD ONES
  // ============================================

  static getGreatOldOnes(): GreatOldOnesState | undefined {
    return this._state.greatOldOnes;
  }

  static setGreatOldOnes(greatOldOnes: GreatOldOnesState | undefined): void {
    this._state.greatOldOnes = greatOldOnes;
  }

  // ============================================
  // SPY NETWORK MANAGEMENT
  // ============================================

  static getSpyNetwork(nationId: string) {
    const nation = this.getNation(nationId);
    return nation?.spyNetwork || null;
  }

  /**
   * Updates a nation's spy network
   */
  static updateSpyNetwork(nationId: string, spyNetwork: LocalNation['spyNetwork']): void {
    this.updateNation(nationId, { spyNetwork });
  }

  static getActiveSpyMissions(nationId: string) {
    const network = this.getSpyNetwork(nationId);
    return network?.activeMissions || [];
  }

  static getSpies(nationId: string) {
    const network = this.getSpyNetwork(nationId);
    return network?.spies || [];
  }

  // ============================================
  // INITIALIZATION AND RESET
  // ============================================

  /**
   * Resets the game state to initial values
   */
  static reset(): void {
    this.setState(createInitialGameState());
    this._conventionalDeltas = [];
    this._sessionVersion++;
  }

  /**
   * Initializes state with a scenario
   */
  static initializeWithScenario(scenario: ScenarioConfig): void {
    this.reset();
    this.setScenario(scenario);
    this.setDefcon(scenario.startingDefcon);
    this._state.actionsRemaining = this._state.defcon >= 4 ? 1 : this._state.defcon >= 2 ? 2 : 3;
  }
}

export default GameStateManager;



