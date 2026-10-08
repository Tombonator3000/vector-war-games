import type { GameState, Nation } from '@/types/game';
import type { ResolutionPhaseDependencies } from '@/types/gamePhase.types';
import type { ProjectedPoint } from '@/lib/renderingUtils';
import { THREAT_CONFIG, NUCLEAR_WINTER_CONFIG } from '@/constants/gamePhase.constants';
import { updateDoctrineIncidentSystem } from '@/lib/doctrineIncidentSystem';
import { updateFalloutImpacts } from '@/lib/falloutEffects';

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

function processMissileImpacts(
  S: GameState,
  projectLocal: (lon: number, lat: number) => ProjectedPoint,
  explode: ResolutionPhaseDependencies['explode']
): number {
  let impactCount = 0;

  for (const missile of S.missiles) {
    if (missile.t >= 1 && !missile.hasExploded) {
      // Visibility controls rendering, never whether a strike applies damage.
      const { x, y } = projectLocal(missile.toLon, missile.toLat);

      missile.hasExploded = true;
      explode(x, y, missile.target, missile.yield, missile.from || null, 'missile');
      impactCount++;
    }
  }

  // Clear completed missiles
  S.missiles = S.missiles.filter(m => !m.hasExploded);

  return impactCount;
}

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

export function resolutionPhase(deps: ResolutionPhaseDependencies): void {
  // Defensive check: ensure deps object is defined
  if (!deps) {
    console.error('[Resolution Phase] Dependencies object is undefined');
    return;
  }

  const { S, nations, log, projectLocal, explode } = deps;

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

  // Queued research and construction advance once per turn, in production.

  log?.('=== RESOLUTION PHASE COMPLETE ===', 'success');

  // 6. Process nuclear winter effects
  processNuclearWinterEffects(S, nations, log);

  // 7. Update doctrine incident system
  processDoctrineIncidents(S, nations, log);
}
