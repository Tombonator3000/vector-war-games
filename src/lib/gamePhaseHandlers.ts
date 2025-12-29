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
  const { S, log, toast, AudioSys, DoomsdayClock, WARHEAD_YIELD_TO_ID, RESEARCH_LOOKUP, PlayerManager } = deps;

  if (from.treaties?.[to.id]?.truceTurns > 0) {
    log(`Cannot attack ${to.name} - truce active!`, 'warning');
    return false;
  }

  const allianceActive = Boolean(
    from.treaties?.[to.id]?.alliance ||
    to.treaties?.[from.id]?.alliance ||
    from.alliances?.includes(to.id) ||
    to.alliances?.includes(from.id)
  );

  if (allianceActive) {
    const allianceMessage = `Cannot attack ${to.name} - alliance active!`;
    log(allianceMessage, 'warning');
    if (from.isPlayer) {
      toast({
        title: 'Alliance prevents strike',
        description: allianceMessage,
      });
    }
    return false;
  }

  if (yieldMT > 50 && S.defcon > 1) {
    log(`Strategic weapons require DEFCON 1`, 'warning');
    return false;
  }

  if (yieldMT <= 50 && S.defcon > 2) {
    log(`Tactical nukes require DEFCON 2 or lower`, 'warning');
    return false;
  }

  if (!from.warheads?.[yieldMT] || from.warheads[yieldMT] <= 0) {
    log('No warheads of that yield!', 'warning');
    return false;
  }

  const requiredResearchId = WARHEAD_YIELD_TO_ID.get(yieldMT);
  if (requiredResearchId && !from.researched?.[requiredResearchId]) {
    const projectName = RESEARCH_LOOKUP[requiredResearchId]?.name || `${yieldMT}MT program`;
    if (from.isPlayer) {
      toast({ title: 'Technology unavailable', description: `Research ${projectName} before deploying this warhead.` });
    } else {
      log(`${from.name} lacks the ${projectName} technology and aborts the launch.`, 'warning');
    }
    return false;
  }

  if (from.missiles <= 0) {
    log('No missiles available!', 'warning');
    return false;
  }

  from.warheads[yieldMT]--;
  if (from.warheads[yieldMT] <= 0) {
    delete from.warheads[yieldMT];
  }
  from.missiles--;

  // Add random offset to spread impacts across the country (±3 degrees)
  const lonOffset = (Math.random() - 0.5) * 6;
  const latOffset = (Math.random() - 0.5) * 6;

  S.missiles.push({
    from,
    to,
    t: 0,
    fromLon: from.lon,
    fromLat: from.lat,
    toLon: to.lon + lonOffset,
    toLat: to.lat + latOffset,
    yield: yieldMT,
    target: to,
    color: from.color
  });

  log(`${from.name} → ${to.name}: LAUNCH ${yieldMT}MT`);
  AudioSys.playSFX('launch');
  DoomsdayClock.tick(0.3);

  // Mark as aggressive action
  from.lastAggressiveAction = S.turn;

  // Track statistics - removed (not part of core GameState)
  if (from.isPlayer) {

    // Update public opinion (nuclear launches are unpopular)
    if (S.scenario?.electionConfig) {
      modifyOpinionFromAction(from, 'LAUNCH_MISSILE', true, S.scenario.electionConfig);
    }
  }

  // Toast feedback for player launches
  if (from.isPlayer) {
    toast({
      title: '🚀 Missile Launched',
      description: `${yieldMT}MT warhead inbound to ${to.name}. -1 missile, -1 warhead.`,
      variant: 'destructive',
    });
  }

  // Generate news for launch
  if (window.__gameAddNewsItem) {
    const priority = yieldMT > 50 ? 'critical' : 'urgent';
    window.__gameAddNewsItem(
      'military',
      `${from.name} launches ${yieldMT}MT warhead at ${to.name}`,
      priority
    );
  }

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

    // Apply damage to nations within zone
    for (const nation of nations) {
      const { x, y } = projectLocal(nation.lon, nation.lat);
      const distance = Math.hypot(x - zone.x, y - zone.y);

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
  const { S, nations, log, projectLocal, explode, advanceResearch, advanceCityConstruction } = deps;

  log('=== RESOLUTION PHASE ===', 'success');

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

  log('=== RESOLUTION PHASE COMPLETE ===', 'success');

  // 6. Process nuclear winter effects
  processNuclearWinterEffects(S, nations, log);

  // 7. Update doctrine incident system
  processDoctrineIncidents(S, nations, log);
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

  // Initialize territorial resources system if needed
  if (!S.territoryResources && conventionalState?.territories) {
    S.territoryResources = assignTerritoryResources(conventionalState.territories);
    S.resourceTrades = [];
    S.resourceMarket = initializeResourceMarket();
    S.depletionWarnings = [];
    log('Territorial Resources System initialized', 'success');
  }

  // Initialize resource stockpiles for all nations
  nations.forEach(n => {
    if (n.population > 0 && !n.resourceStockpile) {
      initializeResourceStockpile(n);
    }
  });

  // Apply ideology bonuses to all nations BEFORE resource generation
  applyIdeologyBonusesForProduction(nations);

  // Apply government bonuses to all nations BEFORE resource generation
  applyGovernmentBonusesForProduction(nations);

  const policyEffectsByNation =
    policyNationId && policyEffects
      ? { [policyNationId]: policyEffects }
      : {};

  if (typeof window !== 'undefined') {
    (window as any).__policyEffectsByNation = policyEffectsByNation;
  }

  // OPTIMIZED: Single loop for base production calculations
  nations.forEach(n => {
    if (n.population <= 0) return;

    // Base production - balanced for all nations
    const baseProduction = Math.floor(n.population * 0.20);
    const baseProd = baseProduction + (n.cities || 1) * 20;
    const baseUranium = Math.floor(n.population * 0.025) + (n.cities || 1) * 4;
    const baseIntel = Math.floor(n.population * 0.04) + (n.cities || 1) * 3;

    // Apply green shift debuff if active
    let prodMult = 1;
    let uranMult = 1;
    const hungerPenalty = Math.min(0.50, (n.falloutHunger ?? 0) / 100);
    if (hungerPenalty > 0) {
      prodMult *= 1 - hungerPenalty;
      if (player && n === player && hungerPenalty > 0.5) {
        log(`${n.name} agricultural collapse: fallout starvation cripples output`, 'warning');
      }
    }

    const sicknessPenalty = Math.min(0.40, (n.radiationSickness ?? 0) / 130);
    if (sicknessPenalty > 0) {
      const penaltyFactor = 1 - sicknessPenalty;
      prodMult *= penaltyFactor;
      uranMult *= Math.max(0.1, penaltyFactor - 0.1 * sicknessPenalty);
    }

    if (n.refugeeFlow && n.refugeeFlow > 0) {
      const laborLoss = Math.min(0.4, n.refugeeFlow / Math.max(1, n.population + n.refugeeFlow));
      prodMult *= 1 - laborLoss;
    }
    if (n.greenShiftTurns && n.greenShiftTurns > 0) {
      prodMult = 0.7;
      uranMult = 0.5;
      n.greenShiftTurns--;
      if (player && n === player) {
        log('Eco movement reduces nuclear production', 'warning');
      }
    }

    if (n.environmentPenaltyTurns && n.environmentPenaltyTurns > 0) {
      prodMult *= 0.7;
      uranMult *= 0.7;
      n.environmentPenaltyTurns--;
      if (n.environmentPenaltyTurns === 0 && n.isPlayer) {
        log('Environmental treaty penalties have expired.', 'success');
      }
    }

    // Apply economy tech bonuses and policy effects
    const economyProdMult = n.productionMultiplier || 1.0;
    const economyUraniumBonus = n.uraniumPerTurn || 0;

    const moraleMultiplier = calculateMoraleProductionMultiplier(n.morale ?? 0);
    const isPolicyNation = policyNationId === n.id;
    const policyProductionModifier =
      isPolicyNation && policyEffects?.productionModifier ? policyEffects.productionModifier : 1;

    n.recruitmentPolicyModifier = isPolicyNation ? policyEffects?.militaryRecruitmentModifier ?? 1 : 1;
    n.defensePolicyBonus = isPolicyNation ? policyEffects?.defenseBonus ?? 0 : 0;
    n.missileAccuracyBonus = isPolicyNation ? policyEffects?.missileAccuracyBonus ?? 0 : 0;
    n.intelSuccessBonus = isPolicyNation ? policyEffects?.espionageSuccessBonus ?? 0 : 0;
    n.counterIntelBonus = isPolicyNation ? policyEffects?.counterIntelBonus ?? 0 : 0;

    const productionGain = Math.floor(
      baseProd * prodMult * economyProdMult * moraleMultiplier * policyProductionModifier
    );
    n.production += productionGain;
    const uraniumGain = Math.floor(baseUranium * uranMult * moraleMultiplier * policyProductionModifier) + economyUraniumBonus;
    addStrategicResource(n, 'uranium', uraniumGain);
    n.intel += Math.floor(baseIntel * moraleMultiplier * policyProductionModifier);

    // Instability effects
    if (n.instability && n.instability > 50) {
      const unrest = Math.floor(n.instability / 10);
      n.population = Math.max(0, n.population - unrest);
      n.production = Math.max(0, n.production - unrest);
      if (n.instability > 100) {
        log(`${n.name} suffers civil war! Major losses!`, 'alert');
        n.population *= 0.8;
        n.instability = 50;
      }
    }

    // Decay instability slowly
    if (n.instability) {
      n.instability = Math.max(0, n.instability - 2);
    }

    // Border closure effects
    if (n.bordersClosedTurns && n.bordersClosedTurns > 0) {
      n.bordersClosedTurns--;
    }

    if (n.researched?.counterintel) {
      const intelBonus = Math.ceil(baseIntel * 0.2);
      n.intel += intelBonus;
    }
  });

  // Process territorial resources generation and consumption
  if (S.territoryResources && conventionalState?.territories) {
    // OPTIMIZED: Use for..of instead of forEach for better performance
    const territoriesByNation: Record<string, TerritoryState[]> = {};
    const territoryEntries = Object.values(conventionalState?.territories || {});
    for (let i = 0; i < territoryEntries.length; i++) {
      const territory = territoryEntries[i] as TerritoryState;
      const controllerId = territory.controllingNationId;
      if (!controllerId) continue;
      if (!territoriesByNation[controllerId]) {
        territoriesByNation[controllerId] = [];
      }
      territoriesByNation[controllerId].push(territory);
    }

    // Update resource market with dynamic pricing
    if (S.resourceMarket) {
      S.resourceMarket = updateResourceMarket(S.resourceMarket, S, nations, S.turn, deps.rng);

      // Log market events for player
      if (player && S.resourceMarket.activeEvent && S.resourceMarket.eventDuration === S.resourceMarket.activeEvent.duration) {
        // Event just started
        log(`📊 Market Event: ${S.resourceMarket.activeEvent.name} - ${S.resourceMarket.activeEvent.description}`, 'alert');
      }
    }

    // Process resource depletion
    const nationsById = new Map<string, Nation>(nations.map(n => [n.id, n]));

    const depletionResult = processResourceDepletion(
      S.territoryResources,
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

      playerWarnings.forEach(warning => {
        if (warning.severity === 'depleted') {
          log(`💀 ${warning.resource.toUpperCase()} DEPLETED in ${warning.territoryName}!`, 'alert');
        } else if (warning.severity === 'critical') {
          log(`⚠️ ${warning.resource.toUpperCase()} critical in ${warning.territoryName} (${Math.round(warning.remainingPercent)}% remaining)`, 'warning');
        }
      });
    }

    // First process any active trades
    if (S.resourceTrades) {
      S.resourceTrades = processResourceTrades(
        S.resourceTrades,
        nations,
        S.turn,
        S.resourceMarket
      );
    }

    // Then process each nation's resources
    nations.forEach(n => {
      if (n.population <= 0) return;

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
        if (result.shortages.length > 0) {
          result.shortages.forEach(shortage => {
            log(`⚠️ ${shortage.resource.toUpperCase()} SHORTAGE! (${Math.round(shortage.severity * 100)}%)`, 'warning');
          });
        }
      }

      // Store generation for UI display
      n.resourceGeneration = result.generation;
    });

    // Apply city maintenance costs
    nations.forEach(n => {
      if (n.population <= 0) return;
      if (!n.cities || n.cities < 1) return;

      const maintenanceCosts = getCityMaintenanceCosts(n);
      if (!n.resourceStockpile) return;

      let totalShortage = 0;

      // Deduct maintenance costs
      Object.entries(maintenanceCosts).forEach(([resource, amount]) => {
        const available = n.resourceStockpile![resource as keyof typeof n.resourceStockpile] || 0;
        const deficit = Math.max(0, amount - available);

        if (deficit > 0) {
          totalShortage += deficit / amount; // Normalize shortage
          n.resourceStockpile![resource as keyof typeof n.resourceStockpile] = 0;
        } else {
          n.resourceStockpile![resource as keyof typeof n.resourceStockpile] = available - amount;
        }
      });

      // Apply penalties for maintenance shortages
      if (totalShortage > 0) {
        const moraleImpact = Math.floor(totalShortage * 10);
        n.morale = Math.max(0, (n.morale || 100) - moraleImpact);

        if (player && n === player) {
          log(`⚠️ City maintenance shortages! Morale -${moraleImpact}`, 'warning');
        }
      }
    });
  }

  nations.forEach(n => {
    if (n.coverOpsTurns && n.coverOpsTurns > 0) {
      n.coverOpsTurns = Math.max(0, n.coverOpsTurns - 1);
    }

    if (n.deepRecon) {
      Object.keys(n.deepRecon).forEach(targetId => {
        const remaining = Math.max(0, (n.deepRecon![targetId] || 0) - 1);
        if (remaining <= 0) {
          delete n.deepRecon![targetId];
        } else {
          n.deepRecon![targetId] = remaining;
        }
      });
    }

    if (n.sanctionedBy) {
      Object.keys(n.sanctionedBy).forEach(id => {
        const remaining = Math.max(0, (n.sanctionedBy?.[id] || 0) - 1);
        if (remaining <= 0) {
          if (n.sanctionedBy) {
            delete n.sanctionedBy[id];
          }
        } else if (n.sanctionedBy) {
          n.sanctionedBy[id] = remaining;
        }
      });

      if (n.sanctionedBy && Object.keys(n.sanctionedBy).length === 0) {
        delete n.sanctionedBy;
        n.sanctioned = false;
        delete n.sanctionTurns;
        log(`Sanctions on ${n.name} expired.`, 'success');
      } else if (n.sanctionedBy) {
        n.sanctioned = true;
        n.sanctionTurns = Object.values(n.sanctionedBy).reduce((total, turns) => total + turns, 0);
      }
    } else if (n.sanctionTurns && n.sanctionTurns > 0) {
      n.sanctionTurns--;
      if (n.sanctionTurns <= 0) {
        n.sanctioned = false;
        delete n.sanctionTurns;
        log(`Sanctions on ${n.name} expired.`, 'success');
      }
    }

    if (n.treaties) {
      Object.values(n.treaties).forEach(treaty => {
        if (treaty && typeof treaty.truceTurns === 'number' && treaty.truceTurns > 0) {
          treaty.truceTurns = Math.max(0, treaty.truceTurns - 1);
          if (treaty.truceTurns === 0) {
            delete treaty.truceTurns;
          }
        }
      });
    }

    n.migrantsLastTurn = n.migrantsThisTurn || 0;
    n.migrantsThisTurn = 0;
  });

  // Handle Elections
  if (S.scenario?.electionConfig.enabled) {
    const electionConfig = S.scenario.electionConfig;
    const publicOpinionAggregates = buildPublicOpinionAggregates(nations, electionConfig);

    nations.forEach(n => {
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
    });
  }

  // Update Diplomacy Phase 1-3 systems per turn
  const peaceTurns = S.diplomacy?.peaceTurns ?? 0;

  nations.forEach((n, index) => {
    if (n.population <= 0) return;

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
  });

  nations.forEach(n => advanceResearch(n, 'PRODUCTION'));
  nations.forEach(n => advanceCityConstruction(n, 'PRODUCTION'));

  // ============================================================================
  // Hearts of Iron Integration: Process Phase 2-4 Systems
  // ============================================================================

  // Phase 4: Intelligence Agency Operations
  nations.forEach(n => {
    if (n.population <= 0) return;

    // Note: Intelligence agency functionality moved to intelligence property
    // Legacy code removed - intelligence operations handled elsewhere
  });

  // Phase 3: Economic Depth (Trade, Refinement, Infrastructure)
  if (typeof window !== 'undefined' && (window as any).economicDepthApi) {
    try {
      const economicDepthApi = (window as any).economicDepthApi;

      // Build stockpile map for resource refinement
      const nationStockpiles = new Map<string, any>();
      nations.forEach(n => {
        if (n.resourceStockpile) {
          nationStockpiles.set(n.id, n.resourceStockpile);
        }
      });

      // Process economic turn (trade, refinement, infrastructure)
      economicDepthApi.processEconomicTurn(nationStockpiles);

      // Apply refined resource bonuses to nations
      if (economicDepthApi.nationRefineryStats) {
        nations.forEach(n => {
          const refineryStats = economicDepthApi.nationRefineryStats.get(n.id);
          if (refineryStats && refineryStats.totalOutput) {
            // Apply refined resource bonuses to production
            const steelBonus = (refineryStats.totalOutput.steel || 0) * 0.1; // 10% production bonus per steel
            const electronicsBonus = (refineryStats.totalOutput.electronics || 0) * 0.05; // 5% intel bonus per electronics

            if (steelBonus > 0) {
              n.production = Math.floor((n.production || 0) + steelBonus);
            }
            if (electronicsBonus > 0) {
              n.intel = Math.floor((n.intel || 0) + electronicsBonus);
            }
          }
        });
      }

      log('✅ Economic depth systems processed', 'success');
    } catch (error) {
      console.error('[Production Phase] Error processing economic depth:', error);
    }
  }

  // Phase 2: Military Templates - Process unit maintenance
  if (typeof window !== 'undefined' && (window as any).militaryTemplatesApi) {
    try {
      const militaryTemplatesApi = (window as any).militaryTemplatesApi;
      militaryTemplatesApi.processTurnMaintenance();
      log('✅ Military templates maintenance processed', 'success');
    } catch (error) {
      console.error('[Production Phase] Error processing military templates:', error);
    }
  }

  // Phase 2: Supply System - Process supply distribution and attrition
  if (typeof window !== 'undefined' && (window as any).supplySystemApi) {
    try {
      const supplySystemApi = (window as any).supplySystemApi;

      // Update supply demand from conventional units
      if (conventionalState?.territories) {
        Object.values(conventionalState.territories).forEach((territory: any) => {
          if (territory && territory.garrisonsPresent) {
            const supplyDemand = territory.garrisonsPresent.length * 50; // Each unit needs 50 supply
            supplySystemApi.updateSupplyDemand(territory.id, supplyDemand);
          }
        });
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

  if (typeof window !== 'undefined') {
    const warSupportApi = (window as any).warSupportApi;
    if (warSupportApi?.processTurnWarSupport) {
      try {
        warSupportApi.processTurnWarSupport();
        log('✅ War support and stability processed', 'success');
      } catch (error) {
        console.error('[Production Phase] Error processing war support:', error);
      }
    }

    const politicalFactionsApi = (window as any).politicalFactionsApi;
    if (politicalFactionsApi?.processTurnUpdates) {
      try {
        politicalFactionsApi.processTurnUpdates();
        log('✅ Political factions updated', 'success');
      } catch (error) {
        console.error('[Production Phase] Error processing political factions:', error);
      }
    }

    const regionalMoraleApi = (window as any).regionalMoraleApi;
    if (regionalMoraleApi?.processTurnUpdates) {
      try {
        regionalMoraleApi.processTurnUpdates();
        log('✅ Regional morale advanced', 'success');
      } catch (error) {
        console.error('[Production Phase] Error processing regional morale:', error);
      }
    }

    const mediaWarfareApi = (window as any).mediaWarfareApi;
    if (mediaWarfareApi?.processTurnUpdates) {
      try {
        mediaWarfareApi.processTurnUpdates();
        log('✅ Media warfare campaigns resolved', 'success');
      } catch (error) {
        console.error('[Production Phase] Error processing media warfare:', error);
      }
    }

    const productionQueueApi = (window as any).productionQueueApi;
    if (productionQueueApi?.processTurnProduction) {
      try {
        const completions = productionQueueApi.processTurnProduction();
        if (Array.isArray(completions) && completions.length > 0) {
          log(`✅ ${completions.length} production projects advanced`, 'success');
        } else {
          log('✅ Production queues updated', 'success');
        }
      } catch (error) {
        console.error('[Production Phase] Error processing production queues:', error);
      }
    }

    const resourceRefinementApi = (window as any).resourceRefinementApi;
    if (resourceRefinementApi?.processTurn) {
      try {
        resourceRefinementApi.processTurn();
        log('✅ Resource refinement progressed', 'success');
      } catch (error) {
        console.error('[Production Phase] Error processing resource refinement:', error);
      }
    }
  }
}
