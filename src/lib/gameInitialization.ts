/**
 * Game Initialization Handlers
 * Extracted from Index.tsx to reduce file size and improve maintainability
 *
 * This module handles:
 * - Nation initialization (standard and Cuban Crisis scenarios)
 * - Resource state bootstrapping
 * - Game state reset
 * - Relationship initialization
 * - Game system initialization
 */

import type { LocalNation } from '@/state';
import type { DoctrineKey } from '@/types/doctrineIncidents';
import { GameStateManager, PlayerManager, createDefaultDiplomacyState } from '@/state';
import {
  createDefaultNationConventionalProfile,
  createDefaultConventionalState,
  type NationConventionalProfile
} from '@/hooks/useConventionalWarfare';
import { createDefaultNationCyberProfile } from '@/hooks/useCyberWarfare';
import { initializeSpyNetwork } from '@/lib/spyNetworkUtils';
import { initializeResourceStockpile } from '@/lib/territorialResourcesSystem';
import { initializeAllAINations } from '@/lib/aiBioWarfareIntegration';
import { initializeGameTrustAndFavors } from '@/lib/trustAndFavorsUtils';
import { initializeGrievancesAndClaims } from '@/lib/grievancesAndClaimsUtils';
import { initializeSpecializedAlliances } from '@/lib/specializedAlliancesUtils';
import { initializeNationPopSystem } from '@/lib/immigrationCultureTurnProcessor';
import { initializeIdeologySystem } from '@/lib/ideologyIntegration';
import { initializeGovernmentSystem } from '@/lib/governmentIntegration';
import { initializeDIP } from '@/lib/diplomaticCurrencyUtils';
import { initializeNationAgendas } from '@/lib/agendaSystem';
import { updateCasusBelliForAllNations } from '@/lib/casusBelliIntegration';
import { initializeDiplomacyPhase3State } from '@/types/diplomacyPhase3';
import { Storage } from '@/lib/gameUtilityFunctions';
import { clampDefenseValue } from '@/lib/nuclearDamage';
import { leaders } from '@/data/leaders';

/**
 * Dependencies injected from Index.tsx
 */
export interface GameInitializationDependencies {
  log: (message: string, type?: string) => void;
  updateDisplay: () => void;
  applyLeaderBonuses: (nation: LocalNation, leaderName: string) => void;
  applyDoctrineEffects: (nation: LocalNation, doctrineKey?: DoctrineKey) => void;
  initializeNationLeaderAbility: (nation: LocalNation) => void;
}

/**
 * Configuration for a Cuban Crisis nation
 */
export interface CrisisNationConfig {
  id: string;
  name: string;
  leader: string;
  aiPersonality: 'balanced' | 'aggressive';
  lon: number;
  lat: number;
  color: string;
  population: number;
  missiles: number;
  bombers: number;
  submarines: number;
  defense: number;
  instability: number;
  baseStats: {
    morale: number;
    publicOpinion: number;
    cabinetApproval: number;
  };
  playerStats: {
    morale: number;
    publicOpinion: number;
    cabinetApproval: number;
    intel: number;
  };
  production: number;
  uranium: number;
  baseIntel: number;
  cities: number;
  warheads: { [yield: number]: number };
  researched: { [key: string]: boolean };
  conventionalProfile: 'navy' | 'army' | 'air';
}

/**
 * Bootstraps nation resource state with initial stockpile
 */
export function bootstrapNationResourceState(nation: LocalNation) {
  initializeResourceStockpile(nation);
  nation.resourceGeneration = {
    oil: 0,
    uranium: 0,
    rare_earths: 0,
    food: 0,
  };
}

/**
 * Creates a Cuban Crisis nation with standardized initialization
 */
export function createCubanCrisisNation(
  config: CrisisNationConfig,
  isPlayer: boolean,
  selectedDoctrine: DoctrineKey | undefined,
  deps: GameInitializationDependencies
): LocalNation {
  const nation: LocalNation = {
    id: isPlayer ? 'player' : config.id,
    isPlayer,
    name: config.name,
    leader: config.leader,
    leaderName: config.leader,
    aiPersonality: config.aiPersonality,
    ai: config.aiPersonality,
    lon: config.lon,
    lat: config.lat,
    color: config.color,
    population: config.population,
    missiles: config.missiles,
    bombers: config.bombers,
    submarines: config.submarines,
    defense: config.defense,
    instability: config.instability,
    morale: isPlayer ? config.playerStats.morale : config.baseStats.morale,
    publicOpinion: isPlayer ? config.playerStats.publicOpinion : config.baseStats.publicOpinion,
    electionTimer: 0,
    cabinetApproval: isPlayer ? config.playerStats.cabinetApproval : config.baseStats.cabinetApproval,
    production: config.production,
    uranium: config.uranium,
    intel: isPlayer ? config.playerStats.intel : config.baseIntel,
    cities: config.cities,
    warheads: config.warheads,
    researched: config.researched,
    researchQueue: null,
    treaties: {},
    threats: {},
    migrantsThisTurn: 0,
    migrantsTotal: 0,
    conventional: createDefaultNationConventionalProfile(config.conventionalProfile),
    controlledTerritories: [],
    cyber: createDefaultNationCyberProfile(),
    casusBelli: [],
    activeWars: [],
    peaceOffers: [],
    spyNetwork: initializeSpyNetwork(),
  };

  // Apply player-specific configuration
  if (isPlayer) {
    deps.applyDoctrineEffects(nation, selectedDoctrine);
  }

  // Apply leader bonuses and initialize abilities
  deps.applyLeaderBonuses(nation, config.leader);
  deps.initializeNationLeaderAbility(nation);
  bootstrapNationResourceState(nation);

  return nation;
}

/**
 * Initializes historical relationships for Cuban Crisis scenario
 */
export function initializeCrisisRelationships(
  usa: LocalNation,
  ussr: LocalNation,
  cuba: LocalNation
): void {
  // Initialize threat levels (historically accurate tensions)
  usa.threats = {
    [ussr.id]: 75,  // High Cold War tensions
    [cuba.id]: 90,  // Very high threat from Cuba
  };
  ussr.threats = {
    [usa.id]: 70,   // High Cold War tensions
    [cuba.id]: 0,   // Cuba is allied
  };
  cuba.threats = {
    [usa.id]: 95,   // Extreme threat from USA
    [ussr.id]: 0,   // USSR is allied
  };

  // Set up USSR-Cuba alliance
  ussr.alliances = [cuba.id];
  cuba.alliances = [ussr.id];

  // Initialize diplomatic relationships
  usa.relationships = {
    [ussr.id]: -80,  // Hostile superpower rivalry
    [cuba.id]: -95,  // Extreme hostility
  };
  ussr.relationships = {
    [usa.id]: -80,   // Hostile superpower rivalry
    [cuba.id]: 85,   // Strong alliance
  };
  cuba.relationships = {
    [usa.id]: -95,   // Extreme hostility
    [ussr.id]: 85,   // Strong alliance
  };
}

/**
 * Initializes all game systems for Cuban Crisis scenario
 */
export function initializeCrisisGameSystems(nations: LocalNation[], difficulty: string): void {
  // Get game state
  const S = GameStateManager.getState();

  // Initialize conventional warfare state
  const conventionalState = createDefaultConventionalState(
    nations.map(nation => ({ id: nation.id, isPlayer: nation.isPlayer }))
  );
  S.conventional = conventionalState;

  // Sync conventional state with nations
  nations.forEach(nation => {
    const profile = nation.conventional ?? createDefaultNationConventionalProfile();
    const units = Object.values(conventionalState.units).filter(unit => unit.ownerId === nation.id);
    nation.conventional = {
      ...profile,
      reserve: units.filter(unit => unit.status === 'reserve').length,
      deployedUnits: units.filter(unit => unit.status === 'deployed').map(unit => unit.id),
      readiness: profile.readiness,
    };
    nation.controlledTerritories = Object.values(conventionalState.territories)
      .filter(territory => territory.controllingNationId === nation.id)
      .map(territory => territory.id);
  });

  // Initialize AI bio-warfare capabilities (minimal for 1962)
  initializeAllAINations(nations, difficulty);

  // Initialize Diplomacy Phase 1-3 systems
  let diplomacyReadyNations = initializeGameTrustAndFavors(nations);
  diplomacyReadyNations = initializeGrievancesAndClaims(diplomacyReadyNations);
  diplomacyReadyNations = initializeSpecializedAlliances(diplomacyReadyNations);

  nations.length = 0;
  nations.push(...diplomacyReadyNations);

  // Initialize immigration & culture systems
  nations.forEach(nation => {
    if (!nation.eliminated) {
      initializeNationPopSystem(nation);
    }
  });

  // Initialize ideology, government, and DIP systems
  initializeIdeologySystem(nations);
  initializeGovernmentSystem(nations);
  nations.forEach((nation, index) => {
    nations[index] = initializeDIP(nation);
  });

  // Initialize Agenda System (Phase 4)
  const playerNation = nations.find(n => n.isPlayer);
  if (playerNation) {
    const agendaReadyNations = initializeNationAgendas(nations, playerNation.id, Math.random);
    nations.length = 0;
    nations.push(...agendaReadyNations);

    // Initialize firstContactTurn for all AI nations
    nations.forEach(nation => {
      if (!nation.isPlayer) {
        nation.firstContactTurn = nation.firstContactTurn || {};
        nation.firstContactTurn[playerNation.id] = S.turn || 1;
      }
    });

    GameStateManager.setNations(nations);
    PlayerManager.setNations(nations);

    // Log agendas for debugging
    console.log('=== LEADER AGENDAS ASSIGNED (Cuban Crisis) ===');
    nations.forEach(nation => {
      if (!nation.isPlayer && (nation as any).agendas) {
        const agendas = (nation as any).agendas;
        const primary = agendas.find((a: any) => a.type === 'primary');
        const hidden = agendas.find((a: any) => a.type === 'hidden');
        console.log(`${nation.name} (${nation.leader}):`);
        console.log(`  Primary: ${primary?.name} (visible)`);
        console.log(`  Hidden: ${hidden?.name} (concealed)`);
      }
    });
  }
}

/**
 * Finalizes Cuban Crisis game state after all nations and systems are initialized
 */
export function finalizeCrisisGameState(
  nations: LocalNation[],
  playerLeaderName: string,
  deps: GameInitializationDependencies
): void {
  const S = GameStateManager.getState();

  // Log scenario start
  deps.log('=== CUBAN MISSILE CRISIS - OCTOBER 1962 ===', 'critical');
  deps.log(`Leader: ${playerLeaderName}`, 'success');
  deps.log(`Doctrine: ${S.selectedDoctrine}`, 'success');
  deps.log('The world stands on the brink of nuclear war...', 'warning');

  // Set initial game state
  S.turn = 1;
  S.phase = 'PLAYER';
  S.paused = false;
  S.gameOver = false;
  S.diplomacy = createDefaultDiplomacyState();
  S.actionsRemaining = 2; // Crisis demands quick decisions

  // Initialize casus belli system
  const casusReadyNations = updateCasusBelliForAllNations(nations, S.turn) as LocalNation[];
  nations.length = 0;
  nations.push(...casusReadyNations);
  GameStateManager.setNations(casusReadyNations);
  PlayerManager.setNations(casusReadyNations);
  S.casusBelliState = { allWars: [], warHistory: [] };

  // Initialize Phase 3 state
  // @ts-expect-error - Legacy Phase 3 diplomacy
  if (!S.diplomacyPhase3) {
    // @ts-expect-error - Legacy Phase 3 diplomacy
    S.diplomacyPhase3 = initializeDiplomacyPhase3State(S.turn);
  }

  deps.updateDisplay();
}

/**
 * Initializes nations and game state for Cuban Missile Crisis scenario (October 1962)
 */
export function initCubanCrisisNations(
  playerLeaderName: string,
  playerLeaderConfig: any,
  selectedDoctrine: DoctrineKey | undefined,
  nations: LocalNation[],
  deps: GameInitializationDependencies
) {
  const player = PlayerManager.get();

  // Determine which historical leader the player chose
  const isKennedy = playerLeaderName === 'John F. Kennedy';
  const isKhrushchev = playerLeaderName === 'Nikita Khrushchev';
  const isCastro = playerLeaderName === 'Fidel Castro';

  // Create USA with historically superior nuclear arsenal
  const usaConfig: CrisisNationConfig = {
    id: 'usa',
    name: 'United States',
    leader: 'John F. Kennedy',
    aiPersonality: 'balanced',
    lon: -95,
    lat: 39,
    color: '#0047AB',
    population: 186, // 1962 US population in millions
    missiles: 25,    // USA had significant ICBM advantage
    bombers: 15,     // Strategic Air Command was strong
    submarines: 5,   // Polaris submarines
    defense: 8,      // NORAD and early warning systems
    instability: 0,
    baseStats: { morale: 65, publicOpinion: 60, cabinetApproval: 55 },
    playerStats: { morale: 72, publicOpinion: 68, cabinetApproval: 64, intel: 15 },
    production: 40,  // Strong industrial base
    uranium: 30,     // Large stockpile
    baseIntel: 10,
    cities: 2,
    warheads: { 20: 15, 50: 10, 100: 5 }, // Varied arsenal
    researched: { warhead_20: true, warhead_50: true, warhead_100: true },
    conventionalProfile: 'navy',
  };

  // Create USSR with historical buildup but fewer missiles
  const ussrConfig: CrisisNationConfig = {
    id: 'ussr',
    name: 'Soviet Union',
    leader: 'Nikita Khrushchev',
    aiPersonality: 'aggressive',
    lon: 37,
    lat: 55,
    color: '#CC0000',
    population: 220, // 1962 USSR population in millions
    missiles: 10,    // USSR had fewer ICBMs (missile gap was a myth)
    bombers: 12,     // Strong bomber force
    submarines: 4,   // Growing submarine fleet
    defense: 10,     // Extensive air defense network
    instability: 5,
    baseStats: { morale: 68, publicOpinion: 60, cabinetApproval: 55 },
    playerStats: { morale: 70, publicOpinion: 65, cabinetApproval: 60, intel: 15 },
    production: 35,  // Strong but less efficient than US
    uranium: 25,
    baseIntel: 12,
    cities: 2,
    warheads: { 20: 8, 50: 12, 100: 8 }, // Emphasis on larger warheads
    researched: { warhead_20: true, warhead_50: true, warhead_100: true },
    conventionalProfile: 'army',
  };

  // Create Cuba as revolutionary state with Soviet support
  const cubaConfig: CrisisNationConfig = {
    id: 'cuba',
    name: 'Cuba',
    leader: 'Fidel Castro',
    aiPersonality: 'aggressive',
    lon: -80,
    lat: 22,
    color: '#CE1126',
    population: 7,  // 1962 Cuba population in millions
    missiles: 0,    // No ICBMs, but hosted Soviet IRBMs
    bombers: 1,     // Limited air force
    submarines: 0,  // No submarines
    defense: 5,     // Soviet SAM batteries
    instability: 10,
    baseStats: { morale: 80, publicOpinion: 75, cabinetApproval: 70 },
    playerStats: { morale: 75, publicOpinion: 70, cabinetApproval: 65, intel: 12 },
    production: 8,  // Small economy
    uranium: 2,     // Minimal resources
    baseIntel: 8,
    cities: 1,
    warheads: { 10: 2 }, // Soviet-supplied tactical nukes
    researched: {},
    conventionalProfile: 'army',
  };

  // Create the three nations
  const usaNation = createCubanCrisisNation(usaConfig, isKennedy, selectedDoctrine, deps);
  const ussrNation = createCubanCrisisNation(ussrConfig, isKhrushchev, selectedDoctrine, deps);
  const cubaNation = createCubanCrisisNation(cubaConfig, isCastro, selectedDoctrine, deps);

  // Add nations to global array
  nations.push(usaNation, ussrNation, cubaNation);

  // Initialize historical relationships
  initializeCrisisRelationships(usaNation, ussrNation, cubaNation);

  // Initialize all game systems
  const S = GameStateManager.getState();
  const difficulty = S.difficulty || 'medium';
  initializeCrisisGameSystems(nations, difficulty);

  // Finalize game state
  finalizeCrisisGameState(nations, playerLeaderName, deps);
}

/**
 * Completely resets all game state to initial values
 */
export function resetGameState(): void {
  console.log('[Game State] Performing complete game state reset');

  // Reset GameStateManager (includes all core game state)
  GameStateManager.reset();

  // Update module-level references to point to the fresh state
  const S = GameStateManager.getState();
  const nations = GameStateManager.getNations();

  // Reset PlayerManager cache
  PlayerManager.reset();

  // CRITICAL: Clear localStorage items that persist game state between sessions
  // This ensures no state from previous games leaks into new games
  Storage.removeItem('save_snapshot');
  Storage.removeItem('conventional_state');
  console.log('[Game State] Cleared localStorage: save_snapshot, conventional_state');

  // Expose fresh S to window
  if (typeof window !== 'undefined') {
    (window as any).S = S;
    console.log('[Game State] Exposed fresh S to window after reset');
  }

  console.log('[Game State] Game state reset complete');
}

/**
 * Initializes nations for standard (non-Cuban Crisis) scenario
 */
export function initNations(
  nations: LocalNation[],
  deps: GameInitializationDependencies
): void {
  const S = GameStateManager.getState();

  // Prevent re-initialization if game is already running
  if (nations.length > 0 && S.turn > 1) {
    console.warn('Attempted to re-initialize game - blocked');
    return;
  }

  nations.length = 0;
  GameStateManager.setNations(nations);
  PlayerManager.setNations(nations);
  PlayerManager.reset();

  const playerLeaderName = S.selectedLeader || 'PLAYER';
  const playerLeaderConfig = leaders.find(l => l.name === playerLeaderName);
  const selectedDoctrine = (S.selectedDoctrine as DoctrineKey | null) || undefined;

  // Check if we're in Cuban Crisis scenario
  const isCubanCrisis = S.scenario?.id === 'cubanCrisis';

  if (isCubanCrisis) {
    // Historical Cuban Missile Crisis setup
    initCubanCrisisNations(playerLeaderName, playerLeaderConfig, selectedDoctrine, nations, deps);
    return;
  }

  let playerNation: LocalNation = {
    id: 'player',
    isPlayer: true,
    name: 'PLAYER',
    leader: playerLeaderName,
    doctrine: selectedDoctrine,
    lon: -95,
    lat: 39,
    color: playerLeaderConfig?.color || '#00ffff',
    population: 240,
    missiles: 5,
    bombers: 2,
    defense: 3,
    instability: 0,
    morale: 72,
    publicOpinion: 68,
    electionTimer: 12,
    cabinetApproval: 64,
    production: 25,
    uranium: 15,
    intel: 10,
    gold: 1000,
    cities: 1,
    warheads: { 10: 3, 20: 2 },
    researched: { warhead_20: true },
    researchQueue: null,
    treaties: {},
    threats: {},
    migrantsThisTurn: 0,
    migrantsTotal: 0,
    conventional: createDefaultNationConventionalProfile('army'),
    controlledTerritories: [],
    cyber: {
      ...createDefaultNationCyberProfile(),
      readiness: 70,
      offense: 60,
      detection: 38,
    },
    casusBelli: [],
    activeWars: [],
    peaceOffers: [],
    spyNetwork: initializeSpyNetwork(),
  };

  // Apply doctrine bonuses
  deps.applyDoctrineEffects(playerNation, selectedDoctrine);

  // Apply leader-specific bonuses (FASE 2.1)
  deps.applyLeaderBonuses(playerNation, playerLeaderName);
  deps.initializeNationLeaderAbility(playerNation);
  bootstrapNationResourceState(playerNation);

  nations.push(playerNation);

  const aiPositions = [
    { lon: 37, lat: 55, name: 'EURASIA' },
    { lon: 116, lat: 40, name: 'EASTASIA' },
    { lon: -60, lat: -15, name: 'SOUTHAM' },
    { lon: 20, lat: 0, name: 'AFRICA' }
  ];

  const doctrineKeys: DoctrineKey[] = ['mad', 'defense', 'firstStrike', 'detente'];
  const availableLeaders = leaders.filter(l => l.name !== playerLeaderName);
  const shuffledLeaders = (availableLeaders.length ? availableLeaders : leaders)
    .slice()
    .sort(() => Math.random() - 0.5);

  aiPositions.forEach((pos, i) => {
    const leaderConfig = shuffledLeaders[i % shuffledLeaders.length];
    const aiDoctrine = doctrineKeys.length
      ? doctrineKeys[Math.floor(Math.random() * doctrineKeys.length)]
      : undefined;

    // Balanced starting resources - AI gets similar resources to player
    const nation: LocalNation = {
      id: `ai_${i}`,
      isPlayer: false,
      name: pos.name,
      leader: leaderConfig?.name || `AI_${i}`,
      leaderName: leaderConfig?.name || `AI_${i}`, // Explicit leader name for UI display
      aiPersonality: leaderConfig?.ai || 'balanced', // AI personality for UI display
      ai: leaderConfig?.ai || 'balanced',
      doctrine: aiDoctrine,
      lon: pos.lon,
      lat: pos.lat,
      color: leaderConfig?.color || ['#ff0040', '#ff8000', '#40ff00', '#0040ff'][i % 4],
      population: 180 + Math.floor(Math.random() * 50), // Balanced with player (240)
      missiles: 4 + Math.floor(Math.random() * 3), // 4-6 missiles (player has 5)
      bombers: 1 + Math.floor(Math.random() * 2), // 1-2 bombers (player has 2)
      defense: 3 + Math.floor(Math.random() * 2), // 3-4 defense (player has 3)
      instability: Math.floor(Math.random() * 15), // Low initial instability
      morale: 60 + Math.floor(Math.random() * 15),
      publicOpinion: 55 + Math.floor(Math.random() * 20),
      electionTimer: 10 + Math.floor(Math.random() * 6),
      cabinetApproval: 50 + Math.floor(Math.random() * 20),
      production: 20 + Math.floor(Math.random() * 15), // 20-35 production (player has 25)
      uranium: 12 + Math.floor(Math.random() * 8), // 12-20 uranium (player has 15)
      intel: 8 + Math.floor(Math.random() * 8), // 8-16 intel (player has 10)
      gold: 800 + Math.floor(Math.random() * 400), // 800-1200 gold (player has 1000)
      cities: 1,
      warheads: {
        10: 2 + Math.floor(Math.random() * 2), // 2-3 10MT
        20: 1 + Math.floor(Math.random() * 2)  // 1-2 20MT
      },
      researched: { warhead_20: true },
      researchQueue: null,
      treaties: {},
      satellites: {},
      threats: {},
      migrantsThisTurn: 0,
      migrantsTotal: 0,
      conventional: createDefaultNationConventionalProfile(
        i === 1 ? 'navy' : i === 2 ? 'air' : 'army'
      ),
      controlledTerritories: [],
      cyber: {
        ...createDefaultNationCyberProfile(),
        readiness: 55 + Math.floor(Math.random() * 12),
        offense: 52 + Math.floor(Math.random() * 10),
        defense: 48 + Math.floor(Math.random() * 8),
        detection: 30 + Math.floor(Math.random() * 10),
      },
      casusBelli: [],
      activeWars: [],
      peaceOffers: [],
      spyNetwork: initializeSpyNetwork(),
    };

    deps.applyDoctrineEffects(nation, aiDoctrine);

    // Apply leader-specific bonuses to AI nations (FASE 2.1)
    deps.applyLeaderBonuses(nation, leaderConfig?.name || `AI_${i}`);
    deps.initializeNationLeaderAbility(nation);
    bootstrapNationResourceState(nation);

    // Initialize threat tracking for all nations
    nations.forEach(existingNation => {
      if (existingNation.id !== nation.id) {
        nation.threats[existingNation.id] = Math.floor(Math.random() * 5);
        existingNation.threats[nation.id] = Math.floor(Math.random() * 5);
      }
    });

    nations.push(nation);
  });

  const conventionalState = createDefaultConventionalState(
    nations.map(nation => ({ id: nation.id, isPlayer: nation.isPlayer }))
  );
  S.conventional = conventionalState;

  nations.forEach(nation => {
    const profile = nation.conventional ?? createDefaultNationConventionalProfile();
    const units = Object.values(conventionalState.units).filter(unit => unit.ownerId === nation.id);
    nation.conventional = {
      ...profile,
      reserve: units.filter(unit => unit.status === 'reserve').length,
      deployedUnits: units.filter(unit => unit.status === 'deployed').map(unit => unit.id),
      readiness: profile.readiness,
    };
    nation.controlledTerritories = Object.values(conventionalState.territories)
      .filter(territory => territory.controllingNationId === nation.id)
      .map(territory => territory.id);
  });

  // Initialize AI bio-warfare capabilities
  const difficulty = S.difficulty || 'medium';
  initializeAllAINations(nations, difficulty);

  // Initialize Diplomacy Phase 1-3 systems
  let diplomacyReadyNations = initializeGameTrustAndFavors(nations);
  diplomacyReadyNations = initializeGrievancesAndClaims(diplomacyReadyNations);
  diplomacyReadyNations = initializeSpecializedAlliances(diplomacyReadyNations);

  nations.length = 0;
  nations.push(...diplomacyReadyNations);

  // Initialize immigration & culture systems (popGroups, cultural identity, etc.)
  nations.forEach(nation => {
    if (!nation.eliminated) {
      initializeNationPopSystem(nation);
    }
  });

  // Initialize ideology system for all nations
  initializeIdeologySystem(nations);

  // Initialize government system for all nations
  initializeGovernmentSystem(nations);

  // Initialize DIP (Diplomatic Influence Points) for all nations
  nations.forEach((nation, index) => {
    nations[index] = initializeDIP(nation);
  });

  // Initialize Agenda System (Phase 4): Assign unique leader agendas to AI nations
  playerNation = nations.find(n => n.isPlayer) as LocalNation;
  if (playerNation) {
    const agendaReadyNations = initializeNationAgendas(nations, playerNation.id, Math.random);
    nations.length = 0;
    nations.push(...agendaReadyNations);

    // Initialize firstContactTurn for all AI nations (needed for hidden agenda revelation)
    nations.forEach(nation => {
      if (!nation.isPlayer) {
        nation.firstContactTurn = nation.firstContactTurn || {};
        nation.firstContactTurn[playerNation.id] = S.turn || 1;
      }
    });

    GameStateManager.setNations(nations);
    PlayerManager.setNations(nations);

    // Log agendas for debugging
    console.log('=== LEADER AGENDAS ASSIGNED ===');
    nations.forEach(nation => {
      if (!nation.isPlayer && (nation as any).agendas) {
        const agendas = (nation as any).agendas;
        const primary = agendas.find((a: any) => a.type === 'primary');
        const hidden = agendas.find((a: any) => a.type === 'hidden');
        console.log(`${nation.name}:`);
        console.log(`  Primary: ${primary?.name} (visible)`);
        console.log(`  Hidden: ${hidden?.name} (concealed)`);
      }
    });
  }

  deps.log('=== GAME START ===', 'success');
  deps.log(`Leader: ${playerLeaderName}`, 'success');
  deps.log(`Doctrine: ${S.selectedDoctrine}`, 'success');

  S.turn = 1;
  S.phase = 'PLAYER';
  S.paused = false;
  S.gameOver = false;
  S.diplomacy = createDefaultDiplomacyState();
  S.actionsRemaining = S.defcon >= 4 ? 1 : S.defcon >= 2 ? 2 : 3;

  const casusReadyNations = updateCasusBelliForAllNations(nations, S.turn) as LocalNation[];
  nations.length = 0;
  nations.push(...casusReadyNations);
  GameStateManager.setNations(casusReadyNations);
  PlayerManager.setNations(casusReadyNations);
  S.casusBelliState = { allWars: [], warHistory: [] };

  // Initialize Phase 3 state
  // @ts-expect-error - Legacy Phase 3 diplomacy
  if (!S.diplomacyPhase3) {
    // @ts-expect-error - Legacy Phase 3 diplomacy
    S.diplomacyPhase3 = initializeDiplomacyPhase3State(S.turn);
  }

  deps.updateDisplay();
}
