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
  type ElectionResult,
} from '@/lib/electionSystem';
import { applyTrustDecay } from '@/lib/trustAndFavorsUtils';
import { updateGrievancesAndClaimsPerTurn } from '@/lib/grievancesAndClaimsUtils';
import { updateAlliancesPerTurn } from '@/lib/specializedAlliancesUtils';
import { updatePhase2PerTurn } from '@/lib/diplomacyPhase2Integration';
import { applyDIPIncome, updateDIPIncome } from '@/lib/diplomaticCurrencyUtils';
import { applyIdeologyBonusesForProduction } from '@/lib/ideologyIntegration';
import { updateDoctrineIncidentSystem } from '@/lib/doctrineIncidentSystem';
import { updateFalloutImpacts } from '@/lib/falloutEffects';
import {
  processNationResources,
  processResourceTrades,
  initializeResourceStockpile,
  assignTerritoryResources,
  addStrategicResource,
} from '@/lib/territorialResourcesSystem';
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

/**
 * Process resolution phase - handle missile impacts, radiation, and threats
 */
export function resolutionPhase(deps: ResolutionPhaseDependencies): void {
  const { S, nations, log, projectLocal, explode, advanceResearch, advanceCityConstruction } = deps;

  log('=== RESOLUTION PHASE ===', 'success');

  // Update threat levels based on actions
  nations.forEach(attacker => {
    if (attacker.population <= 0) return;

    nations.forEach(target => {
      if (target.id === attacker.id || target.population <= 0) return;

      // Initialize threats object if needed
      attacker.threats = attacker.threats || {};

      // Increase threat if target has attacked us or has large arsenal
      const targetMissiles = target.missiles || 0;
      const targetWarheads = Object.values(target.warheads || {}).reduce((sum, count) => sum + (count || 0), 0);

      if (targetMissiles > 10 || targetWarheads > 15) {
        attacker.threats[target.id] = Math.min(100, (attacker.threats[target.id] || 0) + 1);
      }

      // Player is always considered a threat
      if (target.isPlayer) {
        attacker.threats[target.id] = Math.min(100, (attacker.threats[target.id] || 0) + 2);
      }

      // Decay old threats
      if (attacker.threats[target.id]) {
        attacker.threats[target.id] = Math.max(0, attacker.threats[target.id] - 0.5);
      }
    });
  });

  // Missile impacts and effects
  S.missiles.forEach((missile: any) => {
    if (missile.t >= 1 && !missile.hasExploded) {
      const { x, y, visible } = projectLocal(missile.toLon, missile.toLat);
      if (!visible) {
        return;
      }
      missile.hasExploded = true;
      explode(x, y, missile.target, missile.yield, missile.from || null, 'missile');
    }
  });

  // Clear completed missiles
  S.missiles = S.missiles.filter((m: any) => m.t < 1);

  // Update fallout impacts for each nation based on lingering radiation
  updateFalloutImpacts(S, nations, projectLocal, log);

  const radiationMitigation = typeof window !== 'undefined'
    ? window.__bioDefenseStats?.radiationMitigation ?? 0
    : 0;

  // Process radiation zones
  S.radiationZones.forEach((zone: any) => {
    zone.intensity *= 0.95;

    nations.forEach(n => {
      const { x, y } = projectLocal(n.lon, n.lat);
      const dist = Math.hypot(x - zone.x, y - zone.y);
      if (dist < zone.radius) {
        const damage = zone.intensity * 3;
        const mitigatedDamage = damage * (1 - radiationMitigation);
        n.population = Math.max(0, n.population - mitigatedDamage);
      }
    });
  });

  nations.forEach(n => advanceResearch(n, 'RESOLUTION'));
  nations.forEach(n => advanceCityConstruction(n, 'RESOLUTION'));

  log('=== RESOLUTION PHASE COMPLETE ===', 'success');

  // Nuclear winter effects
  if (S.nuclearWinterLevel && S.nuclearWinterLevel > 0) {
    const winterSeverity = Math.min(S.nuclearWinterLevel / 10, 0.5);
    nations.forEach(n => {
      const popLoss = Math.floor((n.population || 0) * winterSeverity * 0.05);
      if (popLoss > 0) n.population = Math.max(0, (n.population || 0) - popLoss);
      if (typeof n.production === 'number') {
        n.production = Math.max(0, Math.floor(n.production * (1 - winterSeverity)));
      }
    });

    if (S.nuclearWinterLevel > 5) {
      log(`☢️ NUCLEAR WINTER! Global population declining!`, 'alert');
      S.overlay = { text: 'NUCLEAR WINTER', ttl: 2000 };
    }
    S.nuclearWinterLevel *= 0.95;
  }

  // Update Doctrine Incident System (only for player)
  const playerNation = nations.find(n => n.isPlayer);
  if (playerNation && S.doctrineIncidentState) {
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
}

/**
 * Process production phase - generate resources, handle timers, elections
 */
export function productionPhase(deps: ProductionPhaseDependencies): void {
  const { S, nations, log, advanceResearch, advanceCityConstruction, leaders, PlayerManager, conventionalState } = deps;

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
      if (n === PlayerManager.get() && hungerPenalty > 0.5) {
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
      if (n === PlayerManager.get()) {
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

    // Apply economy tech bonuses
    const economyProdMult = n.productionMultiplier || 1.0;
    const economyUraniumBonus = n.uraniumPerTurn || 0;

    const moraleMultiplier = calculateMoraleProductionMultiplier(n.morale ?? 0);
    n.production += Math.floor(baseProd * prodMult * economyProdMult * moraleMultiplier);
    const uraniumGain = Math.floor(baseUranium * uranMult * moraleMultiplier) + economyUraniumBonus;
    addStrategicResource(n, 'uranium', uraniumGain);
    n.intel += Math.floor(baseIntel * moraleMultiplier);

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
    const territoriesByNation: Record<string, TerritoryState[]> = {};
    Object.values(conventionalState.territories).forEach(territory => {
      const controllerId = territory.controllingNationId;
      if (!controllerId) return;
      if (!territoriesByNation[controllerId]) {
        territoriesByNation[controllerId] = [];
      }
      territoriesByNation[controllerId].push(territory);
    });

    // Update resource market with dynamic pricing
    if (S.resourceMarket) {
      S.resourceMarket = updateResourceMarket(S.resourceMarket, S, nations, S.turn, deps.rng);

      // Log market events for player
      const player = PlayerManager.get();
      if (player && S.resourceMarket.activeEvent && S.resourceMarket.eventDuration === S.resourceMarket.activeEvent.duration) {
        // Event just started
        log(`📊 Market Event: ${S.resourceMarket.activeEvent.name} - ${S.resourceMarket.activeEvent.description}`, 'alert');
      }
    }

    // Process resource depletion
    const depletionResult = processResourceDepletion(
      S.territoryResources,
      conventionalState.territories,
      nations,
      DEFAULT_DEPLETION_CONFIG
    );
    S.territoryResources = depletionResult.territoryResources;
    S.depletionWarnings = depletionResult.warnings;

    // Warn player about critical depletion
    const player = PlayerManager.get();
    if (player) {
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
      if (n === PlayerManager.get() && result.generation) {
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

        if (n === PlayerManager.get()) {
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
    nations.forEach(n => {
      // Update public opinion based on current state
      n.publicOpinion = calculatePublicOpinion(n, nations, S.scenario!.electionConfig);

      // Decrease election timer
      if (n.electionTimer > 0) {
        n.electionTimer--;
      }

      // Check if it's election time
      if (n.electionTimer === 0 && S.scenario?.electionConfig.interval > 0) {
        const result = runElection(n, nations, S.scenario.electionConfig);

        const electionLog = applyElectionConsequences(
          n,
          result,
          S.scenario.electionConfig,
          leaders
        );

        log(`${n.name}: ${electionLog.message}`, result.winner === 'incumbent' ? 'success' : 'alert');

        if (electionLog.gameOver && n.isPlayer) {
          S.gameOver = true;
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
    let updatedNation = applyTrustDecay(n, S.turn);
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
}
