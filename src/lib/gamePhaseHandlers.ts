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
import { calculateMoraleProductionMultiplier } from '@/hooks/useGovernance';
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
import { calculateDIPIncome } from '@/lib/diplomaticCurrencyUtils';

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
  projectLocal: (lon: number, lat: number) => [number, number];
}

export interface ResolutionPhaseDependencies {
  S: GameState;
  nations: Nation[];
  log: (msg: string, type?: string) => void;
  projectLocal: (lon: number, lat: number) => [number, number];
  explode: (x: number, y: number, target: Nation, yieldMT: number) => void;
  advanceResearch: (nation: Nation, phase: 'PRODUCTION' | 'RESOLUTION') => void;
}

export interface ProductionPhaseDependencies {
  S: GameState;
  nations: Nation[];
  log: (msg: string, type?: string) => void;
  advanceResearch: (nation: Nation, phase: 'PRODUCTION' | 'RESOLUTION') => void;
  leaders: any[];
  PlayerManager: any;
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

  S.missiles.push({
    from,
    to,
    t: 0,
    fromLon: from.lon,
    fromLat: from.lat,
    toLon: to.lon,
    toLat: to.lat,
    yield: yieldMT,
    target: to,
    color: from.color
  });

  log(`${from.name} → ${to.name}: LAUNCH ${yieldMT}MT`);
  AudioSys.playSFX('launch');
  DoomsdayClock.tick(0.3);

  // Track statistics
  if (from.isPlayer) {
    if (!S.statistics) S.statistics = { nukesLaunched: 0, nukesReceived: 0, enemiesDestroyed: 0 };
    S.statistics.nukesLaunched++;

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
  const { S, nations, log, projectLocal, explode, advanceResearch } = deps;

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
    if (missile.t >= 1) {
      explode(
        projectLocal(missile.toLon, missile.toLat)[0],
        projectLocal(missile.toLon, missile.toLat)[1],
        missile.target,
        missile.yield
      );
    }
  });

  // Clear completed missiles
  S.missiles = S.missiles.filter((m: any) => m.t < 1);

  const radiationMitigation = typeof window !== 'undefined'
    ? window.__bioDefenseStats?.radiationMitigation ?? 0
    : 0;

  // Process radiation zones
  S.radiationZones.forEach((zone: any) => {
    zone.intensity *= 0.95;

    nations.forEach(n => {
      const [x, y] = projectLocal(n.lon, n.lat);
      const dist = Math.hypot(x - zone.x, y - zone.y);
      if (dist < zone.radius) {
        const damage = zone.intensity * 3;
        const mitigatedDamage = damage * (1 - radiationMitigation);
        n.population = Math.max(0, n.population - mitigatedDamage);
      }
    });
  });

  nations.forEach(n => advanceResearch(n, 'RESOLUTION'));

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
      const { updateDoctrineIncidentSystem } = require('@/lib/doctrineIncidentSystem');
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
  const { S, nations, log, advanceResearch, leaders, PlayerManager } = deps;

  log('=== PRODUCTION PHASE ===', 'success');

  nations.forEach(n => {
    if (n.population <= 0) return;

    // Base production - balanced for all nations
    const baseProduction = Math.floor(n.population * 0.12);
    const baseProd = baseProduction + (n.cities || 1) * 12;
    const baseUranium = Math.floor(n.population * 0.025) + (n.cities || 1) * 4;
    const baseIntel = Math.floor(n.population * 0.04) + (n.cities || 1) * 3;

    // Apply green shift debuff if active
    let prodMult = 1;
    let uranMult = 1;
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
    n.uranium += Math.floor(baseUranium * uranMult * moraleMultiplier) + economyUraniumBonus;
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
  nations.forEach(n => {
    if (n.population <= 0) return;

    // Phase 1: Apply trust decay and update favors
    applyTrustDecay(n, S.turn);

    // Phase 2: Update grievances, claims, and specialized alliances
    updateGrievancesAndClaimsPerTurn(n, S.turn);
    updatePhase2PerTurn(n, S.turn);

    // Update specialized alliances for all nations
    updateAlliancesPerTurn(n, S.turn, nations);

    // Phase 3: Update DIP income
    if (n.diplomaticInfluence) {
      const income = calculateDIPIncome(n, nations, S.turn);
      n.diplomaticInfluence.points = Math.min(
        n.diplomaticInfluence.capacity,
        n.diplomaticInfluence.points + income
      );
      n.diplomaticInfluence.perTurnIncome.total = income;
    }
  });

  nations.forEach(n => advanceResearch(n, 'PRODUCTION'));
}
