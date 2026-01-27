/**
 * Game Phase Handler Functions
 *
 * Functions for handling game phases: launch, resolution, and production.
 * Extracted from Index.tsx as part of refactoring effort.
 *
 * Note: These functions still depend on some global state but are extracted
 * for better organization. Future refactoring can further decouple them.
 */

import type { Nation, GameState } from '@/types/game';
import type { ProjectedPoint } from '@/lib/renderingUtils';
import { calculateMoraleProductionMultiplier } from '@/hooks/useGovernance';
import { getCityMaintenanceCosts } from '@/lib/gameUtils';
import {
  calculatePublicOpinion,
  runElection,
  applyElectionConsequences,
  modifyOpinionFromAction,
  buildPublicOpinionAggregates,
  type ElectionResult,
} from '@/lib/electionSystem';
import { applyTrustDecay } from '@/lib/trustAndFavorsUtils';
import { updateGrievancesAndClaimsPerTurn } from '@/lib/grievancesAndClaimsUtils';
import { updateAlliancesPerTurn } from '@/lib/specializedAlliancesUtils';
import { updatePhase2PerTurn } from '@/lib/diplomacyPhase2Integration';
import { applyDIPIncome, updateDIPIncome } from '@/lib/diplomaticCurrencyUtils';
import { applyIdeologyBonusesForProduction } from '@/lib/ideologyIntegration';
import { applyGovernmentBonusesForProduction } from '@/lib/governmentIntegration';
import { updateDoctrineIncidentSystem } from '@/lib/doctrineIncidentSystem';
import { updateFalloutImpacts } from '@/lib/falloutEffects';
import {
  processNationResources,
  processResourceTrades,
  initializeResourceStockpile,
  assignTerritoryResources,
  addStrategicResource,
} from '@/lib/territorialResourcesSystem';
import type { PolicyEffects } from '@/types/policy';
import type { TerritoryState } from '@/hooks/useConventionalWarfare';
import {
  initializeResourceMarket,
  updateResourceMarket
} from '@/lib/resourceMarketSystem';
import {
  processResourceDepletion,
  DEFAULT_DEPLETION_CONFIG
} from '@/lib/resourceDepletionSystem';
import { validateLaunch } from '@/lib/launchValidation';
import { applyLaunchStateChanges, handleLaunchSideEffects } from '@/lib/launchEffects';
import {
  createIntelligenceAgency,
  progressIntelOperation,
  calculateAgencyReputation,
} from '@/lib/intelligenceAgencyUtils';
import type { SeededRandom } from '@/lib/seededRandom';

// Types for dependencies that will be injected
export interface LaunchDependencies {
  S: GameState;
  nations: Nation[];
  log: (msg: string, type?: string) => void;
  toast: (options: any) => void;
  AudioSys: any;
  DoomsdayClock: any;
  WARHEAD_YIELD_TO_ID: Map<number, string>;
  RESEARCH_LOOKUP: Record<string, any>;
  PlayerManager: any;
  projectLocal: (lon: number, lat: number) => ProjectedPoint;
}

export interface ResolutionPhaseDependencies {
  S: GameState;
  nations: Nation[];
  log: (msg: string, type?: string) => void;
  projectLocal: (lon: number, lat: number) => ProjectedPoint;
  explode: (
    x: number,
    y: number,
    target: Nation,
    yieldMT: number,
    attacker?: Nation | null,
    deliveryMethod?: 'missile' | 'bomber' | 'submarine'
  ) => void;
  advanceResearch: (nation: Nation, phase: 'PRODUCTION' | 'RESOLUTION') => void;
  advanceCityConstruction: (nation: Nation, phase: 'PRODUCTION' | 'RESOLUTION') => void;
}

export interface ProductionPhaseDependencies {
  S: GameState;
  nations: Nation[];
  log: (msg: string, type?: string) => void;
  advanceResearch: (nation: Nation, phase: 'PRODUCTION' | 'RESOLUTION') => void;
  advanceCityConstruction: (nation: Nation, phase: 'PRODUCTION' | 'RESOLUTION') => void;
  leaders: any[];
  PlayerManager: any;
  conventionalState?: any;  // Optional: conventional warfare state with territories
  rng: SeededRandom;
  policyEffects?: PolicyEffects;
  policyNationId?: string;
  onGameOver?: (payload: { victory: boolean; message: string; cause?: string }) => void;
}

/**
 * Launch a nuclear missile from one nation to another
 */
export function launch(
  from: Nation,
  to: Nation,
  yieldMT: number,
  deps: LaunchDependencies
): boolean {
  // Defensive check: ensure deps object is defined
  if (!deps) {
    console.error('[Launch Handler] Dependencies object is undefined');
    return false;
  }

  const { S, log, toast, AudioSys, DoomsdayClock, WARHEAD_YIELD_TO_ID, RESEARCH_LOOKUP } = deps;

  // Defensive check: ensure game state is available
  if (!S) {
    console.error('[Launch Handler] Game state (S) is undefined');
    if (toast) {
      toast({
        title: 'System error',
        description: 'Game state not available. Please refresh the page.'
      });
    }
    return false;
  }

  // Validate launch preconditions
  const validationResult = validateLaunch({
    from,
    to,
    yieldMT,
    defcon: S.defcon,
    warheadYieldToId: WARHEAD_YIELD_TO_ID,
    researchLookup: RESEARCH_LOOKUP,
  });

  // Handle validation failure
  if (!validationResult.valid) {
    if (validationResult.errorMessage) {
      log(validationResult.errorMessage, validationResult.errorType || 'warning');
    }
    if (validationResult.requiresToast && validationResult.toastConfig) {
      toast(validationResult.toastConfig);
    }
    return false;
  }

  // Apply state changes
  applyLaunchStateChanges(from, to, yieldMT, S);

  // Handle side effects
  handleLaunchSideEffects({
    from,
    to,
    yieldMT,
    gameState: S,
    log,
    toast,
    AudioSys,
    DoomsdayClock,
  });

  return true;
}

// ============================================================================
// Resolution Phase Helper Functions
// ============================================================================

/** Threat calculation thresholds */
const THREAT_CONFIG = {
  MISSILE_THRESHOLD: 10,
  WARHEAD_THRESHOLD: 15,
  ARSENAL_THREAT_INCREMENT: 1,
  PLAYER_THREAT_INCREMENT: 2,
  DECAY_RATE: 0.5,
  MAX_THREAT: 100,
} as const;

/**
 * Update threat levels between nations based on arsenals and player status.
 * Each nation evaluates other nations as threats based on their military capability.
 */
function updateThreatLevels(nations: Nation[]): void {
  for (const attacker of nations) {
    if (attacker.population <= 0) continue;

    attacker.threats = attacker.threats || {};

    for (const target of nations) {
      if (target.id === attacker.id || target.population <= 0) continue;

      const currentThreat = attacker.threats[target.id] || 0;
      let threatDelta = 0;

      // Increase threat if target has large arsenal
      const targetMissiles = target.missiles || 0;
      const targetWarheads = Object.values(target.warheads || {}).reduce(
        (sum, count) => sum + (count || 0),
        0
      );

      if (targetMissiles > THREAT_CONFIG.MISSILE_THRESHOLD ||
          targetWarheads > THREAT_CONFIG.WARHEAD_THRESHOLD) {
        threatDelta += THREAT_CONFIG.ARSENAL_THREAT_INCREMENT;
      }

      // Player is always considered a threat
      if (target.isPlayer) {
        threatDelta += THREAT_CONFIG.PLAYER_THREAT_INCREMENT;
      }

      // Apply threat change and decay
      const newThreat = currentThreat + threatDelta - THREAT_CONFIG.DECAY_RATE;
      attacker.threats[target.id] = Math.max(0, Math.min(THREAT_CONFIG.MAX_THREAT, newThreat));
    }
  }
}

/**
 * Process missile impacts - explode missiles that have reached their targets.
 * Returns the count of missiles that impacted.
 */
function processMissileImpacts(
  S: GameState,
  projectLocal: (lon: number, lat: number) => ProjectedPoint,
  explode: ResolutionPhaseDependencies['explode']
): number {
  let impactCount = 0;

  for (const missile of S.missiles) {
    if (missile.t >= 1 && !missile.hasExploded) {
      const { x, y, visible } = projectLocal(missile.toLon, missile.toLat);
      if (!visible) continue;

      missile.hasExploded = true;
      explode(x, y, missile.target, missile.yield, missile.from || null, 'missile');
      impactCount++;
    }
  }

  // Clear completed missiles
  S.missiles = S.missiles.filter((m: any) => m.t < 1);

  return impactCount;
}

/**
 * Process radiation zones - apply decay and damage to nations within range.
 */
function processRadiationZones(
  S: GameState,
  nations: Nation[],
  projectLocal: (lon: number, lat: number) => ProjectedPoint
): void {
  const radiationMitigation = typeof window !== 'undefined'
    ? window.__bioDefenseStats?.radiationMitigation ?? 0
    : 0;

  for (const zone of S.radiationZones) {
    // Decay radiation intensity
    zone.intensity *= 0.95;

    // Apply damage to nations within zone - project zone coordinates
    const zoneProjected = projectLocal(zone.lon, zone.lat);

    for (const nation of nations) {
      const { x, y } = projectLocal(nation.lon, nation.lat);
      const distance = Math.hypot(x - zoneProjected.x, y - zoneProjected.y);

      if (distance < zone.radius) {
        const baseDamage = zone.intensity * 3;
        const mitigatedDamage = baseDamage * (1 - radiationMitigation);
        nation.population = Math.max(0, nation.population - mitigatedDamage);
      }
    }
  }
}

/** Nuclear winter severity thresholds and effects */
const NUCLEAR_WINTER_CONFIG = {
  MAX_SEVERITY: 0.5,
  SEVERITY_DIVISOR: 10,
  POPULATION_LOSS_RATE: 0.05,
  ALERT_THRESHOLD: 5,
  DECAY_RATE: 0.95,
} as const;

/**
 * Process nuclear winter effects - apply global population and production penalties.
 */
function processNuclearWinterEffects(
  S: GameState,
  nations: Nation[],
  log: (msg: string, type?: string) => void
): void {
  if (!S.nuclearWinterLevel || S.nuclearWinterLevel <= 0) return;

  const winterSeverity = Math.min(
    S.nuclearWinterLevel / NUCLEAR_WINTER_CONFIG.SEVERITY_DIVISOR,
    NUCLEAR_WINTER_CONFIG.MAX_SEVERITY
  );

  for (const nation of nations) {
    // Population loss
    const popLoss = Math.floor(
      (nation.population || 0) * winterSeverity * NUCLEAR_WINTER_CONFIG.POPULATION_LOSS_RATE
    );
    if (popLoss > 0) {
      nation.population = Math.max(0, (nation.population || 0) - popLoss);
    }

    // Production penalty
    if (typeof nation.production === 'number') {
      nation.production = Math.max(0, Math.floor(nation.production * (1 - winterSeverity)));
    }
  }

  // Alert and overlay for severe nuclear winter
  if (S.nuclearWinterLevel > NUCLEAR_WINTER_CONFIG.ALERT_THRESHOLD) {
    log(`☢️ NUCLEAR WINTER! Global population declining!`, 'alert');
    S.overlay = { text: 'NUCLEAR WINTER', ttl: 2000 };
  }

  // Decay nuclear winter level
  S.nuclearWinterLevel *= NUCLEAR_WINTER_CONFIG.DECAY_RATE;
}

/**
 * Update doctrine incident system for the player nation.
 */
function processDoctrineIncidents(
  S: GameState,
  nations: Nation[],
  log: (msg: string, type?: string) => void
): void {
  const playerNation = nations.find(n => n.isPlayer);
  if (!playerNation || !S.doctrineIncidentState) return;

  try {
    S.doctrineIncidentState = updateDoctrineIncidentSystem(
      S,
      playerNation,
      S.doctrineIncidentState,
      nations
    );

    if (S.doctrineIncidentState.activeIncident) {
      log('⚠️ Doctrine incident requires your attention!', 'alert');
    }
  } catch (err) {
    console.error('[Doctrine System] Error updating incidents:', err);
  }
}

// ============================================================================
// Main Resolution Phase Function
// ============================================================================

/**
 * Process resolution phase - handle missile impacts, radiation, and threats.
 *
 * This phase handles:
 * 1. Threat level updates between nations
 * 2. Missile impact processing
 * 3. Fallout and radiation effects
 * 4. Research and construction advancement
 * 5. Nuclear winter effects
 * 6. Doctrine incident system
 */
export function resolutionPhase(deps: ResolutionPhaseDependencies): void {
  // Defensive check: ensure deps object is defined
  if (!deps) {
    console.error('[Resolution Phase] Dependencies object is undefined');
    return;
  }

  const { S, nations, log, projectLocal, explode, advanceResearch, advanceCityConstruction } = deps;

  // Defensive check: ensure game state is available
  if (!S) {
    console.error('[Resolution Phase] Game state (S) is undefined');
    return;
  }

  // Defensive check: ensure nations array is available
  if (!nations || !Array.isArray(nations)) {
    console.error('[Resolution Phase] Nations array is undefined or not an array');
    return;
  }

  log?.('=== RESOLUTION PHASE ===', 'success');

  // 1. Update threat levels between nations
  updateThreatLevels(nations);

  // 2. Process missile impacts
  processMissileImpacts(S, projectLocal, explode);

  // 3. Update fallout impacts for each nation based on lingering radiation
  updateFalloutImpacts(S, nations, projectLocal, log);

  // 4. Process radiation zones
  processRadiationZones(S, nations, projectLocal);

  // 5. Advance research and city construction
  for (const nation of nations) {
    advanceResearch(nation, 'RESOLUTION');
    advanceCityConstruction(nation, 'RESOLUTION');
  }

  log?.('=== RESOLUTION PHASE COMPLETE ===', 'success');

  // 6. Process nuclear winter effects
  processNuclearWinterEffects(S, nations, log);

  // 7. Update doctrine incident system
  processDoctrineIncidents(S, nations, log);
}

// ============================================================================
// Production Phase Configuration Constants
// ============================================================================

/** Production calculation multipliers and thresholds */
const PRODUCTION_CONFIG = {
  /** Population multiplier for base production */
  POPULATION_PROD_MULT: 0.20,
  /** Production bonus per city */
  CITY_PROD_BONUS: 20,
  /** Population multiplier for uranium generation */
  POPULATION_URANIUM_MULT: 0.025,
  /** Uranium bonus per city */
  CITY_URANIUM_BONUS: 4,
  /** Population multiplier for intel generation */
  POPULATION_INTEL_MULT: 0.04,
  /** Intel bonus per city */
  CITY_INTEL_BONUS: 3,
  /** Counterintel research bonus multiplier */
  COUNTERINTEL_BONUS_MULT: 0.2,
} as const;

/** Penalty thresholds for various debuffs */
const PENALTY_CONFIG = {
  /** Maximum hunger penalty (50%) */
  MAX_HUNGER_PENALTY: 0.50,
  /** Hunger divisor for penalty calculation */
  HUNGER_DIVISOR: 100,
  /** Hunger threshold for logging agricultural collapse */
  HUNGER_LOG_THRESHOLD: 0.5,
  /** Maximum sickness penalty (40%) */
  MAX_SICKNESS_PENALTY: 0.40,
  /** Sickness divisor for penalty calculation */
  SICKNESS_DIVISOR: 130,
  /** Minimum uranium multiplier after sickness penalty */
  MIN_URANIUM_MULT_SICKNESS: 0.1,
  /** Sickness uranium reduction factor */
  SICKNESS_URANIUM_FACTOR: 0.1,
  /** Maximum labor loss from refugees (40%) */
  MAX_REFUGEE_LABOR_LOSS: 0.4,
  /** Green shift production multiplier */
  GREEN_SHIFT_PROD_MULT: 0.7,
  /** Green shift uranium multiplier */
  GREEN_SHIFT_URANIUM_MULT: 0.5,
  /** Environment penalty multiplier */
  ENVIRONMENT_PENALTY_MULT: 0.7,
} as const;

/** Instability thresholds and effects */
const INSTABILITY_CONFIG = {
  /** Threshold for instability effects to kick in */
  EFFECT_THRESHOLD: 50,
  /** Divisor for calculating unrest from instability */
  UNREST_DIVISOR: 10,
  /** Threshold for civil war */
  CIVIL_WAR_THRESHOLD: 100,
  /** Population multiplier after civil war */
  CIVIL_WAR_POP_MULT: 0.8,
  /** Instability reset value after civil war */
  CIVIL_WAR_INSTABILITY_RESET: 50,
  /** Per-turn instability decay */
  DECAY_PER_TURN: 2,
} as const;

// ============================================================================
// Production Phase Helper Functions
// ============================================================================

/**
 * Initialize territorial resources system if needed
 */
function initializeTerritorialResourcesSystem(
  S: GameState,
  conventionalState: any,
  log: (msg: string, type?: string) => void
): void {
  if (!S.territoryResources && conventionalState?.territories) {
    S.territoryResources = assignTerritoryResources(conventionalState.territories);
    S.resourceTrades = [];
    S.resourceMarket = initializeResourceMarket();
    S.depletionWarnings = [];
    log('Territorial Resources System initialized', 'success');
  }
}

/**
 * Initialize resource stockpiles for all nations that need them
 */
function initializeNationStockpiles(nations: Nation[]): void {
  for (const n of nations) {
    if (n.population > 0 && !n.resourceStockpile) {
      initializeResourceStockpile(n);
    }
  }
}

/**
 * Calculate production multipliers based on nation state (penalties/bonuses)
 */
function calculateProductionMultipliers(
  n: Nation,
  player: Nation | null,
  log: (msg: string, type?: string) => void
): { prodMult: number; uranMult: number } {
  let prodMult = 1;
  let uranMult = 1;

  // Fallout hunger penalty
  const hungerPenalty = Math.min(PENALTY_CONFIG.MAX_HUNGER_PENALTY, (n.falloutHunger ?? 0) / PENALTY_CONFIG.HUNGER_DIVISOR);
  if (hungerPenalty > 0) {
    prodMult *= 1 - hungerPenalty;
    if (player && n === player && hungerPenalty > PENALTY_CONFIG.HUNGER_LOG_THRESHOLD) {
      log(`${n.name} agricultural collapse: fallout starvation cripples output`, 'warning');
    }
  }

  // Radiation sickness penalty
  const sicknessPenalty = Math.min(PENALTY_CONFIG.MAX_SICKNESS_PENALTY, (n.radiationSickness ?? 0) / PENALTY_CONFIG.SICKNESS_DIVISOR);
  if (sicknessPenalty > 0) {
    const penaltyFactor = 1 - sicknessPenalty;
    prodMult *= penaltyFactor;
    uranMult *= Math.max(PENALTY_CONFIG.MIN_URANIUM_MULT_SICKNESS, penaltyFactor - PENALTY_CONFIG.SICKNESS_URANIUM_FACTOR * sicknessPenalty);
  }

  // Refugee flow labor loss
  if (n.refugeeFlow && n.refugeeFlow > 0) {
    const laborLoss = Math.min(PENALTY_CONFIG.MAX_REFUGEE_LABOR_LOSS, n.refugeeFlow / Math.max(1, n.population + n.refugeeFlow));
    prodMult *= 1 - laborLoss;
  }

  // Green shift debuff
  if (n.greenShiftTurns && n.greenShiftTurns > 0) {
    prodMult *= PENALTY_CONFIG.GREEN_SHIFT_PROD_MULT;
    uranMult *= PENALTY_CONFIG.GREEN_SHIFT_URANIUM_MULT;
    n.greenShiftTurns--;
    if (player && n === player) {
      log('Eco movement reduces nuclear production', 'warning');
    }
  }

  // Environment penalty
  if (n.environmentPenaltyTurns && n.environmentPenaltyTurns > 0) {
    prodMult *= PENALTY_CONFIG.ENVIRONMENT_PENALTY_MULT;
    uranMult *= PENALTY_CONFIG.ENVIRONMENT_PENALTY_MULT;
    n.environmentPenaltyTurns--;
    if (n.environmentPenaltyTurns === 0 && n.isPlayer) {
      log('Environmental treaty penalties have expired.', 'success');
    }
  }

  return { prodMult, uranMult };
}

/**
 * Apply policy effects to a nation
 */
function applyPolicyEffectsToNation(
  n: Nation,
  policyNationId: string | undefined,
  policyEffects: PolicyEffects | undefined
): { isPolicyNation: boolean; policyProductionModifier: number } {
  const isPolicyNation = policyNationId === n.id;
  const policyProductionModifier =
    isPolicyNation && policyEffects?.productionModifier ? policyEffects.productionModifier : 1;

  n.recruitmentPolicyModifier = isPolicyNation ? policyEffects?.militaryRecruitmentModifier ?? 1 : 1;
  n.defensePolicyBonus = isPolicyNation ? policyEffects?.defenseBonus ?? 0 : 0;
  n.missileAccuracyBonus = isPolicyNation ? policyEffects?.missileAccuracyBonus ?? 0 : 0;
  n.intelSuccessBonus = isPolicyNation ? policyEffects?.espionageSuccessBonus ?? 0 : 0;
  n.counterIntelBonus = isPolicyNation ? policyEffects?.counterIntelBonus ?? 0 : 0;

  return { isPolicyNation, policyProductionModifier };
}

/**
 * Process instability effects for a nation
 */
function processInstabilityEffects(
  n: Nation,
  log: (msg: string, type?: string) => void
): void {
  if (n.instability && n.instability > INSTABILITY_CONFIG.EFFECT_THRESHOLD) {
    const unrest = Math.floor(n.instability / INSTABILITY_CONFIG.UNREST_DIVISOR);
    n.population = Math.max(0, n.population - unrest);
    n.production = Math.max(0, n.production - unrest);
    if (n.instability > INSTABILITY_CONFIG.CIVIL_WAR_THRESHOLD) {
      log(`${n.name} suffers civil war! Major losses!`, 'alert');
      n.population *= INSTABILITY_CONFIG.CIVIL_WAR_POP_MULT;
      n.instability = INSTABILITY_CONFIG.CIVIL_WAR_INSTABILITY_RESET;
    }
  }

  // Decay instability slowly
  if (n.instability) {
    n.instability = Math.max(0, n.instability - INSTABILITY_CONFIG.DECAY_PER_TURN);
  }
}

/**
 * Calculate and apply base production for a single nation
 */
function calculateNationBaseProduction(
  n: Nation,
  player: Nation | null,
  policyNationId: string | undefined,
  policyEffects: PolicyEffects | undefined,
  log: (msg: string, type?: string) => void
): void {
  if (n.population <= 0) return;

  // Calculate base values
  const baseProduction = Math.floor(n.population * PRODUCTION_CONFIG.POPULATION_PROD_MULT);
  const baseProd = baseProduction + (n.cities || 1) * PRODUCTION_CONFIG.CITY_PROD_BONUS;
  const baseUranium = Math.floor(n.population * PRODUCTION_CONFIG.POPULATION_URANIUM_MULT) + (n.cities || 1) * PRODUCTION_CONFIG.CITY_URANIUM_BONUS;
  const baseIntel = Math.floor(n.population * PRODUCTION_CONFIG.POPULATION_INTEL_MULT) + (n.cities || 1) * PRODUCTION_CONFIG.CITY_INTEL_BONUS;

  // Calculate multipliers from penalties/bonuses
  const { prodMult, uranMult } = calculateProductionMultipliers(n, player, log);

  // Apply economy tech bonuses
  const economyProdMult = n.productionMultiplier || 1.0;
  const economyUraniumBonus = n.uraniumPerTurn || 0;
  const moraleMultiplier = calculateMoraleProductionMultiplier(n.morale ?? 0);

  // Apply policy effects
  const { policyProductionModifier } = applyPolicyEffectsToNation(n, policyNationId, policyEffects);

  // Calculate final production values
  const productionGain = Math.floor(
    baseProd * prodMult * economyProdMult * moraleMultiplier * policyProductionModifier
  );
  n.production += productionGain;

  const uraniumGain = Math.floor(baseUranium * uranMult * moraleMultiplier * policyProductionModifier) + economyUraniumBonus;
  addStrategicResource(n, 'uranium', uraniumGain);

  n.intel += Math.floor(baseIntel * moraleMultiplier * policyProductionModifier);

  // Process instability effects
  processInstabilityEffects(n, log);

  // Border closure countdown
  if (n.bordersClosedTurns && n.bordersClosedTurns > 0) {
    n.bordersClosedTurns--;
  }

  // Counterintel research bonus
  if (n.researched?.counterintel) {
    const intelBonus = Math.ceil(baseIntel * PRODUCTION_CONFIG.COUNTERINTEL_BONUS_MULT);
    n.intel += intelBonus;
  }
}

/**
 * Process production calculations for all nations
 */
function processNationProductions(
  nations: Nation[],
  player: Nation | null,
  policyNationId: string | undefined,
  policyEffects: PolicyEffects | undefined,
  log: (msg: string, type?: string) => void
): void {
  for (const n of nations) {
    calculateNationBaseProduction(n, player, policyNationId, policyEffects, log);
  }
}

/**
 * Build a map of territories grouped by controlling nation
 */
function buildTerritoriesByNation(
  territories: Record<string, TerritoryState>
): Record<string, TerritoryState[]> {
  const territoriesByNation: Record<string, TerritoryState[]> = {};
  const territoryEntries = Object.values(territories);

  for (const territory of territoryEntries) {
    const controllerId = territory.controllingNationId;
    if (!controllerId) continue;
    if (!territoriesByNation[controllerId]) {
      territoriesByNation[controllerId] = [];
    }
    territoriesByNation[controllerId].push(territory);
  }

  return territoriesByNation;
}

/**
 * Process resource market updates and log events
 */
function processResourceMarketUpdates(
  S: GameState,
  nations: Nation[],
  player: Nation | null,
  rng: SeededRandom,
  log: (msg: string, type?: string) => void
): void {
  if (!S.resourceMarket) return;

  S.resourceMarket = updateResourceMarket(S.resourceMarket, S, nations, S.turn, rng);

  // Log market events for player
  if (player && S.resourceMarket.activeEvent &&
      S.resourceMarket.eventDuration === S.resourceMarket.activeEvent.duration) {
    log(`📊 Market Event: ${S.resourceMarket.activeEvent.name} - ${S.resourceMarket.activeEvent.description}`, 'alert');
  }
}

/**
 * Process resource depletion and warn player about critical resources
 */
function processDepletionAndWarnings(
  S: GameState,
  nations: Nation[],
  conventionalState: any,
  player: Nation | null,
  log: (msg: string, type?: string) => void
): void {
  const nationsById = new Map<string, Nation>(nations.map(n => [n.id, n]));

  const depletionResult = processResourceDepletion(
    S.territoryResources!,
    conventionalState?.territories || {},
    nations,
    DEFAULT_DEPLETION_CONFIG,
    nationsById
  );
  S.territoryResources = depletionResult.territoryResources;
  S.depletionWarnings = depletionResult.warnings;

  // Warn player about critical depletion
  if (player && conventionalState?.territories) {
    const playerWarnings = depletionResult.warnings.filter(w => {
      const territory = conventionalState.territories[w.territoryId];
      return territory?.controllingNationId === player.id;
    });

    for (const warning of playerWarnings) {
      if (warning.severity === 'depleted') {
        log(`💀 ${warning.resource.toUpperCase()} DEPLETED in ${warning.territoryName}!`, 'alert');
      } else if (warning.severity === 'critical') {
        log(`⚠️ ${warning.resource.toUpperCase()} critical in ${warning.territoryName} (${Math.round(warning.remainingPercent)}% remaining)`, 'warning');
      }
    }
  }
}

/**
 * Process each nation's resource generation from territories
 */
function processNationTerritorialResources(
  nations: Nation[],
  territoriesByNation: Record<string, TerritoryState[]>,
  S: GameState,
  player: Nation | null,
  log: (msg: string, type?: string) => void
): void {
  for (const n of nations) {
    if (n.population <= 0) continue;

    const controlledTerritories = territoriesByNation[n.id] ?? [];
    const result = processNationResources(
      n,
      controlledTerritories,
      S.territoryResources!,
      S.resourceTrades || [],
      S.turn
    );

    // Log resource changes for player
    if (player && n === player && result.generation) {
      const gen = result.generation;
      if (gen.oil > 0 || gen.uranium > 0 || gen.rare_earths > 0 || gen.food > 0) {
        log(
          `Resources: +${gen.oil} Oil, +${gen.uranium} Uranium, +${gen.rare_earths} Rare Earths, +${gen.food} Food`,
          'success'
        );
      }

      // Warn about shortages
      for (const shortage of result.shortages) {
        log(`⚠️ ${shortage.resource.toUpperCase()} SHORTAGE! (${Math.round(shortage.severity * 100)}%)`, 'warning');
      }
    }

    // Store generation for UI display
    n.resourceGeneration = result.generation;
  }
}

/**
 * Apply city maintenance costs and penalties
 */
function applyCityMaintenanceCosts(
  nations: Nation[],
  player: Nation | null,
  log: (msg: string, type?: string) => void
): void {
  for (const n of nations) {
    if (n.population <= 0) continue;
    if (!n.cities || n.cities < 1) continue;
    if (!n.resourceStockpile) continue;

    const maintenanceCosts = getCityMaintenanceCosts(n);
    let totalShortage = 0;

    // Deduct maintenance costs
    for (const [resource, amount] of Object.entries(maintenanceCosts)) {
      const available = n.resourceStockpile[resource as keyof typeof n.resourceStockpile] || 0;
      const deficit = Math.max(0, amount - available);

      if (deficit > 0) {
        totalShortage += deficit / amount;
        n.resourceStockpile[resource as keyof typeof n.resourceStockpile] = 0;
      } else {
        n.resourceStockpile[resource as keyof typeof n.resourceStockpile] = available - amount;
      }
    }

    // Apply penalties for maintenance shortages
    if (totalShortage > 0) {
      const moraleImpact = Math.floor(totalShortage * 10);
      n.morale = Math.max(0, (n.morale || 100) - moraleImpact);

      if (player && n === player) {
        log(`⚠️ City maintenance shortages! Morale -${moraleImpact}`, 'warning');
      }
    }
  }
}

/**
 * Process all territorial resource systems (market, depletion, trades, maintenance)
 */
function processTerritorialResourceSystems(
  S: GameState,
  nations: Nation[],
  conventionalState: any,
  player: Nation | null,
  rng: SeededRandom,
  log: (msg: string, type?: string) => void
): void {
  if (!S.territoryResources || !conventionalState?.territories) return;

  // Build territory lookup by nation
  const territoriesByNation = buildTerritoriesByNation(conventionalState.territories);

  // Update resource market
  processResourceMarketUpdates(S, nations, player, rng, log);

  // Process resource depletion
  processDepletionAndWarnings(S, nations, conventionalState, player, log);

  // Process active trades
  if (S.resourceTrades) {
    S.resourceTrades = processResourceTrades(
      S.resourceTrades,
      nations,
      S.turn,
      S.resourceMarket
    );
  }

  // Process each nation's resources
  processNationTerritorialResources(nations, territoriesByNation, S, player, log);

  // Apply city maintenance costs
  applyCityMaintenanceCosts(nations, player, log);
}

/**
 * Process timer decays for a single nation (coverOps, deepRecon, sanctions, treaties, migrants)
 */
function processNationTimerDecays(
  n: Nation,
  log: (msg: string, type?: string) => void
): void {
  // Cover ops countdown
  if (n.coverOpsTurns && n.coverOpsTurns > 0) {
    n.coverOpsTurns = Math.max(0, n.coverOpsTurns - 1);
  }

  // Deep recon countdown
  if (n.deepRecon) {
    for (const targetId of Object.keys(n.deepRecon)) {
      const remaining = Math.max(0, (n.deepRecon[targetId] || 0) - 1);
      if (remaining <= 0) {
        delete n.deepRecon[targetId];
      } else {
        n.deepRecon[targetId] = remaining;
      }
    }
  }

  // Sanctions countdown (new format with sanctionedBy)
  if (n.sanctionedBy) {
    for (const id of Object.keys(n.sanctionedBy)) {
      const remaining = Math.max(0, (n.sanctionedBy[id] || 0) - 1);
      if (remaining <= 0) {
        delete n.sanctionedBy[id];
      } else {
        n.sanctionedBy[id] = remaining;
      }
    }

    if (Object.keys(n.sanctionedBy).length === 0) {
      delete n.sanctionedBy;
      n.sanctioned = false;
      delete n.sanctionTurns;
      log(`Sanctions on ${n.name} expired.`, 'success');
    } else {
      n.sanctioned = true;
      n.sanctionTurns = Object.values(n.sanctionedBy).reduce((total, turns) => total + turns, 0);
    }
  } else if (n.sanctionTurns && n.sanctionTurns > 0) {
    // Legacy sanctions format
    n.sanctionTurns--;
    if (n.sanctionTurns <= 0) {
      n.sanctioned = false;
      delete n.sanctionTurns;
      log(`Sanctions on ${n.name} expired.`, 'success');
    }
  }

  // Treaty truce countdown
  if (n.treaties) {
    for (const treaty of Object.values(n.treaties)) {
      if (treaty && typeof treaty.truceTurns === 'number' && treaty.truceTurns > 0) {
        treaty.truceTurns = Math.max(0, treaty.truceTurns - 1);
        if (treaty.truceTurns === 0) {
          delete treaty.truceTurns;
        }
      }
    }
  }

  // Migrant tracking
  n.migrantsLastTurn = n.migrantsThisTurn || 0;
  n.migrantsThisTurn = 0;
}

/**
 * Process all nation timer decays
 */
function processAllNationTimerDecays(
  nations: Nation[],
  log: (msg: string, type?: string) => void
): void {
  for (const n of nations) {
    processNationTimerDecays(n, log);
  }
}

/**
 * Process election system for all nations
 */
function processElectionSystem(
  S: GameState,
  nations: Nation[],
  leaders: any[],
  onGameOver: ((payload: { victory: boolean; message: string; cause?: string }) => void) | undefined,
  log: (msg: string, type?: string) => void
): void {
  if (!S.scenario?.electionConfig.enabled) return;

  const electionConfig = S.scenario.electionConfig;
  const publicOpinionAggregates = buildPublicOpinionAggregates(nations, electionConfig);

  for (const n of nations) {
    // Update public opinion based on current state
    n.publicOpinion = calculatePublicOpinion(n, electionConfig, publicOpinionAggregates[n.id]);

    // Decrease election timer
    if (n.electionTimer > 0) {
      n.electionTimer--;
    }

    // Check if it's election time
    if (n.electionTimer === 0 && electionConfig.interval > 0) {
      const result = runElection(n, electionConfig, publicOpinionAggregates);

      const electionLog = applyElectionConsequences(
        n,
        result,
        S.scenario.electionConfig,
        leaders
      );

      log(`${n.name}: ${electionLog.message}`, result.winner === 'incumbent' ? 'success' : 'alert');

      if (electionLog.gameOver && n.isPlayer) {
        if (onGameOver) {
          onGameOver({ victory: false, message: electionLog.message, cause: 'election' });
        } else {
          S.gameOver = true;
        }
        S.overlay = { text: 'VOTED OUT - GAME OVER', ttl: 5000 };
      }

      // Reset election timer
      n.electionTimer = S.scenario.electionConfig.interval;
    }
  }
}

/**
 * Update diplomacy phase 1-3 systems for all nations
 */
function updateDiplomacyPhaseSystems(
  S: GameState,
  nations: Nation[],
  policyNationId: string | undefined,
  policyEffects: PolicyEffects | undefined
): void {
  const peaceTurns = S.diplomacy?.peaceTurns ?? 0;

  for (let index = 0; index < nations.length; index++) {
    const n = nations[index];
    if (n.population <= 0) continue;

    // Phase 1: Apply trust decay and update favors
    const trustDecayModifier =
      n.id === policyNationId && policyEffects?.relationshipDecayModifier
        ? policyEffects.relationshipDecayModifier
        : 1;

    let updatedNation = applyTrustDecay(n, S.turn, trustDecayModifier);
    nations[index] = updatedNation;

    // Phase 2: Update grievances, claims, and specialized alliances
    updateGrievancesAndClaimsPerTurn(updatedNation, S.turn);
    updatePhase2PerTurn(updatedNation, S.turn);

    // Update specialized alliances for all nations
    updateAlliancesPerTurn(updatedNation, S.turn, nations);

    // Phase 3: Update DIP income
    if (updatedNation.diplomaticInfluence) {
      const withUpdatedIncome = updateDIPIncome(updatedNation, nations, S.turn, peaceTurns);
      updatedNation = applyDIPIncome(withUpdatedIncome, S.turn);
      nations[index] = updatedNation;
    }
  }
}

/**
 * Safely call a window API method with error handling
 */
function safeCallWindowApi(
  apiName: string,
  methodName: string,
  log: (msg: string, type?: string) => void,
  successMessage: string
): void {
  if (typeof window === 'undefined') return;

  const api = (window as any)[apiName];
  if (!api?.[methodName]) return;

  try {
    api[methodName]();
    log(successMessage, 'success');
  } catch (error) {
    console.error(`[Production Phase] Error processing ${apiName}:`, error);
  }
}

/**
 * Process economic depth systems (trade, refinement, infrastructure)
 */
function processEconomicDepthSystems(
  nations: Nation[],
  log: (msg: string, type?: string) => void
): void {
  if (typeof window === 'undefined') return;

  const economicDepthApi = (window as any).economicDepthApi;
  if (!economicDepthApi) return;

  try {
    // Build stockpile map for resource refinement
    const nationStockpiles = new Map<string, any>();
    for (const n of nations) {
      if (n.resourceStockpile) {
        nationStockpiles.set(n.id, n.resourceStockpile);
      }
    }

    // Process economic turn (trade, refinement, infrastructure)
    economicDepthApi.processEconomicTurn(nationStockpiles);

    // Apply refined resource bonuses to nations
    if (economicDepthApi.nationRefineryStats) {
      for (const n of nations) {
        const refineryStats = economicDepthApi.nationRefineryStats.get(n.id);
        if (refineryStats?.totalOutput) {
          const steelBonus = (refineryStats.totalOutput.steel || 0) * 0.1;
          const electronicsBonus = (refineryStats.totalOutput.electronics || 0) * 0.05;

          if (steelBonus > 0) {
            n.production = Math.floor((n.production || 0) + steelBonus);
          }
          if (electronicsBonus > 0) {
            n.intel = Math.floor((n.intel || 0) + electronicsBonus);
          }
        }
      }
    }

    log('✅ Economic depth systems processed', 'success');
  } catch (error) {
    console.error('[Production Phase] Error processing economic depth:', error);
  }
}

/**
 * Process supply system and attrition
 */
function processSupplySystem(
  conventionalState: any,
  log: (msg: string, type?: string) => void
): void {
  if (typeof window === 'undefined') return;

  const supplySystemApi = (window as any).supplySystemApi;
  if (!supplySystemApi) return;

  try {
    // Update supply demand from conventional units
    if (conventionalState?.territories) {
      for (const territory of Object.values(conventionalState.territories) as any[]) {
        if (territory?.garrisonsPresent) {
          const supplyDemand = territory.garrisonsPresent.length * 50;
          supplySystemApi.updateSupplyDemand(territory.id, supplyDemand);
        }
      }
    }

    // Process supply distribution
    supplySystemApi.processTurnSupply();

    // Apply attrition to under-supplied units
    const attritionEffects = supplySystemApi.getAttritionEffects();
    if (attritionEffects.length > 0) {
      log(`⚠️ ${attritionEffects.length} units suffering from supply attrition`, 'warning');
    }

    log('✅ Supply system and attrition processed', 'success');
  } catch (error) {
    console.error('[Production Phase] Error processing supply system:', error);
  }
}

/**
 * Process all external window API integrations
 */
function processExternalIntegrationAPIs(
  nations: Nation[],
  conventionalState: any,
  log: (msg: string, type?: string) => void
): void {
  if (typeof window === 'undefined') return;

  // Economic depth systems
  processEconomicDepthSystems(nations, log);

  // Military templates maintenance
  safeCallWindowApi('militaryTemplatesApi', 'processTurnMaintenance', log,
    '✅ Military templates maintenance processed');

  // Supply system
  processSupplySystem(conventionalState, log);

  // War support and stability
  safeCallWindowApi('warSupportApi', 'processTurnWarSupport', log,
    '✅ War support and stability processed');

  // Political factions
  safeCallWindowApi('politicalFactionsApi', 'processTurnUpdates', log,
    '✅ Political factions updated');

  // Regional morale
  safeCallWindowApi('regionalMoraleApi', 'processTurnUpdates', log,
    '✅ Regional morale advanced');

  // Media warfare
  safeCallWindowApi('mediaWarfareApi', 'processTurnUpdates', log,
    '✅ Media warfare campaigns resolved');

  // Production queues
  if ((window as any).productionQueueApi?.processTurnProduction) {
    try {
      const completions = (window as any).productionQueueApi.processTurnProduction();
      if (Array.isArray(completions) && completions.length > 0) {
        log(`✅ ${completions.length} production projects advanced`, 'success');
      } else {
        log('✅ Production queues updated', 'success');
      }
    } catch (error) {
      console.error('[Production Phase] Error processing production queues:', error);
    }
  }

  // Resource refinement
  safeCallWindowApi('resourceRefinementApi', 'processTurn', log,
    '✅ Resource refinement progressed');
}

/**
 * Process production phase - generate resources, handle timers, elections
 */
export function productionPhase(deps: ProductionPhaseDependencies): void {
  const {
    S,
    nations,
    log,
    advanceResearch,
    advanceCityConstruction,
    leaders,
    PlayerManager,
    conventionalState,
    onGameOver,
    policyEffects,
    policyNationId,
  } = deps;

  const player = PlayerManager?.get?.() ?? null;

  log('=== PRODUCTION PHASE ===', 'success');

  // 1. Initialize territorial resources system if needed
  initializeTerritorialResourcesSystem(S, conventionalState, log);

  // 2. Initialize resource stockpiles for all nations
  initializeNationStockpiles(nations);

  // 3. Apply ideology and government bonuses BEFORE resource generation
  applyIdeologyBonusesForProduction(nations);
  applyGovernmentBonusesForProduction(nations);

  // 4. Store policy effects for global access
  const policyEffectsByNation =
    policyNationId && policyEffects
      ? { [policyNationId]: policyEffects }
      : {};

  if (typeof window !== 'undefined') {
    (window as any).__policyEffectsByNation = policyEffectsByNation;
  }

  // 5. Calculate base production for all nations
  processNationProductions(nations, player, policyNationId, policyEffects, log);

  // 6. Process territorial resource systems (market, depletion, trades, maintenance)
  processTerritorialResourceSystems(S, nations, conventionalState, player, deps.rng, log);

  // 7. Process timer decays for all nations
  processAllNationTimerDecays(nations, log);

  // 8. Handle elections
  processElectionSystem(S, nations, leaders, onGameOver, log);

  // 9. Update diplomacy phase 1-3 systems
  updateDiplomacyPhaseSystems(S, nations, policyNationId, policyEffects);

  // 10. Advance research and city construction
  for (const n of nations) {
    advanceResearch(n, 'PRODUCTION');
    advanceCityConstruction(n, 'PRODUCTION');
  }

  // 11. Process external integration APIs (Hearts of Iron systems)
  processExternalIntegrationAPIs(nations, conventionalState, log);
}
