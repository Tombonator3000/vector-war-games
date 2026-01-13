/**
 * Satellite Renderer
 *
 * Handles rendering of satellites, satellite orbits, and satellite signals.
 * Extracted from canvasDrawingFunctions.ts for better modularity.
 */

import type { SatelliteOrbit } from '@/types/game';
import type {
  SignalSatellite,
  SignalTransmission,
  GroundStation as SignalGroundStation,
  SignalInterference,
} from '@/types/satelliteSignal';
import {
  drawIcon,
  type CanvasDrawingDependencies,
  SATELLITE_ORBIT_RADIUS,
  SATELLITE_ORBIT_TTL_MS,
  SATELLITE_ORBIT_SPEED,
  SATELLITE_ICON_BASE_SCALE,
} from './types';

// ============================================================================
// Satellite Orbit Rendering
// ============================================================================

export function drawSatellites(nowMs: number, deps: CanvasDrawingDependencies) {
  const { ctx, S, nations, projectLocal, currentMapStyle, PlayerManager, satelliteIcon } = deps;
  if (!ctx) {
    return;
  }

  const orbits = S.satelliteOrbits ?? [];
  if (orbits.length === 0) {
    return;
  }

  const activeOrbits: SatelliteOrbit[] = [];
  const player = PlayerManager.get();
  const isFlatTexture = currentMapStyle === 'flat-realistic';

  orbits.forEach((orbit) => {
    const targetNation = nations.find((nation) => nation.id === orbit.targetId);
    if (!targetNation) {
      return;
    }

    // Always get owner from nations array to ensure fresh satellite data
    const owner = nations.find((nation) => nation.id === orbit.ownerId) ?? null;
    if (!owner) {
      return;
    }

    const ttlExpired = nowMs - orbit.startedAt > orbit.ttl;
    const hasCoverage =
      owner.satellites?.[orbit.targetId] !== undefined &&
      S.turn < owner.satellites[orbit.targetId];

    if (ttlExpired || !hasCoverage) {
      return;
    }

    activeOrbits.push(orbit);

    const { x: targetX, y: targetY, visible } = projectLocal(targetNation.lon, targetNation.lat);
    if (!visible || !Number.isFinite(targetX) || !Number.isFinite(targetY)) {
      return;
    }

    const elapsed = nowMs - orbit.startedAt;
    const angle = orbit.phaseOffset + SATELLITE_ORBIT_SPEED * elapsed * orbit.direction;
    const satelliteX = targetX + Math.cos(angle) * SATELLITE_ORBIT_RADIUS;
    const satelliteY = targetY + Math.sin(angle) * SATELLITE_ORBIT_RADIUS;

    const isPlayerOwned = player?.id === owner.id;
    const orbitColor = isPlayerOwned ? 'rgba(120,220,255,0.65)' : 'rgba(255,140,120,0.75)';
    const highlightColor = isPlayerOwned ? 'rgba(90,200,255,1)' : 'rgba(255,140,140,1)';

    // Pulse highlight directly over the target nation so the opponent is clearly marked
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineWidth = 2.25;
    const pulse = 0.55 + 0.45 * Math.sin(nowMs / 420 + orbit.phaseOffset * 0.8);
    ctx.strokeStyle = highlightColor.replace('1)', `${0.35 + pulse * 0.4})`);
    ctx.beginPath();
    ctx.arc(targetX, targetY, 18 + pulse * 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    if (isFlatTexture) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const gradient = ctx.createRadialGradient(targetX, targetY, 0, targetX, targetY, 22);
      gradient.addColorStop(0, highlightColor.replace('1)', '0.45)'));
      gradient.addColorStop(1, highlightColor.replace('1)', '0)'));
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(targetX, targetY, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw orbit path with enhanced visibility
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = orbitColor;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.arc(targetX, targetY, SATELLITE_ORBIT_RADIUS, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Draw motion trail behind satellite
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 1; i <= 5; i++) {
      const trailAngle = angle - i * 0.15 * orbit.direction;
      const trailX = targetX + Math.cos(trailAngle) * SATELLITE_ORBIT_RADIUS;
      const trailY = targetY + Math.sin(trailAngle) * SATELLITE_ORBIT_RADIUS;
      const trailAlpha = 0.3 * (1 - i / 6);
      ctx.globalAlpha = trailAlpha;
      ctx.fillStyle = 'rgba(100,200,255,0.8)';
      ctx.beginPath();
      ctx.arc(trailX, trailY, 4 - i * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Draw enhanced glow effect around satellite
    ctx.save();
    const glowPulse = 0.6 + 0.4 * Math.sin(nowMs / 320 + orbit.phaseOffset);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = glowPulse * 0.7;
    ctx.fillStyle = isPlayerOwned ? 'rgba(100,200,255,1)' : 'rgba(255,150,150,1)';
    ctx.beginPath();
    ctx.arc(satelliteX, satelliteY, 10 + glowPulse * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw the satellite icon asset to keep styling consistent with other units
    drawIcon(
      satelliteIcon,
      satelliteX,
      satelliteY,
      angle + Math.PI / 2,
      SATELLITE_ICON_BASE_SCALE,
      { alpha: 0.95 },
      deps
    );

    // Draw satellite label
    ctx.save();
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = isPlayerOwned ? 'rgba(210,235,255,0.95)' : 'rgba(255,200,200,0.95)';
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.lineWidth = 3;
    const label = isPlayerOwned ? '🛰️ SAT' : '🛰️ ENEMY';
    ctx.strokeText(label, satelliteX + 12, satelliteY - 8);
    ctx.fillText(label, satelliteX + 12, satelliteY - 8);
    ctx.restore();
  });

  S.satelliteOrbits = activeOrbits;
}

export function registerSatelliteOrbit(
  ownerId: string,
  targetId: string,
  deps: CanvasDrawingDependencies
) {
  const { S } = deps;
  const now = Date.now();
  S.satelliteOrbits = S.satelliteOrbits ?? [];

  const existing = S.satelliteOrbits.find(
    (orbit) => orbit.ownerId === ownerId && orbit.targetId === targetId
  );
  if (existing) {
    existing.startedAt = now;
    existing.ttl = SATELLITE_ORBIT_TTL_MS;
    existing.phaseOffset = Math.random() * Math.PI * 2;
    existing.direction = Math.random() < 0.5 ? 1 : -1;
    return;
  }

  S.satelliteOrbits.push({
    ownerId,
    targetId,
    startedAt: now,
    ttl: SATELLITE_ORBIT_TTL_MS,
    phaseOffset: Math.random() * Math.PI * 2,
    direction: Math.random() < 0.5 ? 1 : -1,
  });
}

// ============================================================================
// Satellite Signal Rendering
// ============================================================================

/**
 * Draw satellite signal transmissions and ground stations
 * Visualizes signal paths as animated waves from satellites to ground receivers
 */
export function drawSatelliteSignals(nowMs: number, deps: CanvasDrawingDependencies) {
  const { ctx, projectLocal } = deps;
  if (!ctx) return;

  // Get satellite signal state from window (set by useSatelliteSignals hook)
  const signalState = (window as any).__satelliteSignalState;
  if (!signalState) return;

  const { satellites, groundStations, activeTransmissions, interferenceZones } = signalState;

  // Draw interference zones
  interferenceZones.forEach((zone: SignalInterference) => {
    const { x, y, visible } = projectLocal(zone.lon, zone.lat);
    if (!visible || !Number.isFinite(x) || !Number.isFinite(y)) return;

    const elapsed = nowMs - zone.startedAt;
    const remaining = zone.duration - elapsed;
    if (remaining <= 0) return;

    const fadeOut = Math.min(1, remaining / 2000);
    const pulse = 0.6 + 0.4 * Math.sin(nowMs / 300);
    const radius = zone.radius * 3 * (1 + 0.1 * pulse);

    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = zone.intensity * 0.4 * fadeOut * pulse;

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, 'rgba(255,50,50,0.8)');
    gradient.addColorStop(0.5, 'rgba(255,100,50,0.4)');
    gradient.addColorStop(1, 'rgba(255,150,50,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Interference label
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 0.8 * fadeOut;
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = 'rgba(255,100,100,0.9)';
    ctx.textAlign = 'center';
    ctx.fillText(`⚠ ${zone.type.toUpperCase()}`, x, y - radius - 8);
    ctx.restore();
  });

  // Draw ground stations
  groundStations.forEach((station: SignalGroundStation) => {
    const { x, y, visible } = projectLocal(station.lon, station.lat);
    if (!visible || !Number.isFinite(x) || !Number.isFinite(y)) return;

    const hasActiveSignal = station.receivedSignals.some((s: { active: boolean }) => s.active);
    const pulse = 0.7 + 0.3 * Math.sin(nowMs / 400);

    ctx.save();

    // Ground station base
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = station.operational
      ? hasActiveSignal
        ? 'rgba(80,200,120,0.9)'
        : 'rgba(200,180,80,0.8)'
      : 'rgba(150,80,80,0.7)';
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();

    // Antenna dish visualization
    ctx.strokeStyle = station.operational ? 'rgba(150,220,255,0.8)' : 'rgba(100,100,100,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y - 4, 8, Math.PI * 0.8, Math.PI * 0.2, true);
    ctx.stroke();

    // Receiving pulse animation when active
    if (hasActiveSignal && station.operational) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.3 + 0.3 * pulse;
      ctx.strokeStyle = 'rgba(100,200,255,0.8)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        const ringRadius = 10 + i * 6 + ((nowMs / 100 + i * 10) % 18);
        ctx.globalAlpha = 0.4 * (1 - (ringRadius - 10) / 28);
        ctx.beginPath();
        ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Station label
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 0.9;
    ctx.font = 'bold 8px monospace';
    ctx.fillStyle = 'rgba(200,220,255,0.9)';
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.lineWidth = 2;
    ctx.textAlign = 'center';
    const label = `📡 ${station.name.slice(0, 12)}`;
    ctx.strokeText(label, x, y + 18);
    ctx.fillText(label, x, y + 18);

    // Signal strength indicator
    if (hasActiveSignal) {
      const avgQuality =
        station.receivedSignals
          .filter((s: { active: boolean }) => s.active)
          .reduce((sum: number, s: { quality: number }) => sum + s.quality, 0) /
        station.receivedSignals.filter((s: { active: boolean }) => s.active).length;

      const barWidth = 24;
      const barHeight = 3;
      const barX = x - barWidth / 2;
      const barY = y + 22;

      ctx.fillStyle = 'rgba(40,40,40,0.8)';
      ctx.fillRect(barX, barY, barWidth, barHeight);

      const qualityColor =
        avgQuality >= 80
          ? 'rgba(80,200,120,0.9)'
          : avgQuality >= 60
            ? 'rgba(100,180,220,0.9)'
            : avgQuality >= 40
              ? 'rgba(200,180,80,0.9)'
              : avgQuality >= 20
                ? 'rgba(220,140,60,0.9)'
                : 'rgba(200,80,80,0.9)';
      ctx.fillStyle = qualityColor;
      ctx.fillRect(barX, barY, (barWidth * avgQuality) / 100, barHeight);
    }

    ctx.restore();
  });

  // Draw satellites with signal capability indicator
  satellites.forEach((sat: SignalSatellite) => {
    const { x, y, visible } = projectLocal(sat.currentPosition.lon, sat.currentPosition.lat);
    if (!visible || !Number.isFinite(x) || !Number.isFinite(y)) return;

    const pulse = 0.7 + 0.3 * Math.sin(nowMs / 350 + sat.currentPosition.lon * 0.1);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // Satellite glow
    ctx.globalAlpha = 0.4 * pulse;
    const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, 20);
    glowGradient.addColorStop(0, 'rgba(100,200,255,0.8)');
    glowGradient.addColorStop(1, 'rgba(100,200,255,0)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();

    // Satellite body
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = sat.operational ? 'rgba(180,220,255,1)' : 'rgba(100,100,100,0.7)';
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();

    // Solar panels
    ctx.fillStyle = sat.operational ? 'rgba(100,150,200,0.9)' : 'rgba(80,80,80,0.6)';
    ctx.fillRect(x - 12, y - 2, 8, 4);
    ctx.fillRect(x + 4, y - 2, 8, 4);

    // Type indicator
    const typeColors: Record<string, string> = {
      communication: 'rgba(100,200,255,0.9)',
      reconnaissance: 'rgba(255,200,100,0.9)',
      navigation: 'rgba(100,255,150,0.9)',
      weather: 'rgba(200,150,255,0.9)',
    };
    ctx.fillStyle = typeColors[sat.type] || 'rgba(200,200,200,0.9)';
    ctx.beginPath();
    ctx.arc(x, y - 8, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  });

  // Draw active signal transmissions
  activeTransmissions.forEach((tx: SignalTransmission) => {
    const sat = satellites.find((s: SignalSatellite) => s.id === tx.satelliteId);
    if (!sat) return;

    const { x: satX, y: satY, visible: satVisible } = projectLocal(
      sat.currentPosition.lon,
      sat.currentPosition.lat
    );
    if (!satVisible) return;

    // Draw signal beams to each target ground station
    tx.targetStationIds.forEach((stationId: string) => {
      const station = groundStations.find((s: SignalGroundStation) => s.id === stationId);
      if (!station) return;

      const { x: gsX, y: gsY, visible: gsVisible } = projectLocal(station.lon, station.lat);
      if (!gsVisible) return;

      const dx = gsX - satX;
      const dy = gsY - satY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1) return;

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      // Signal beam with wave effect
      const waveCount = Math.floor(dist / 20);
      const waveProgress = (nowMs / 500) % 1;

      for (let i = 0; i < waveCount; i++) {
        const t = ((i / waveCount) + waveProgress) % 1;
        const waveX = satX + dx * t;
        const waveY = satY + dy * t;
        const alpha = Math.sin(t * Math.PI) * 0.6 * (1 - tx.progress);

        ctx.globalAlpha = alpha;
        ctx.fillStyle = 'rgba(100,200,255,0.9)';
        ctx.beginPath();
        ctx.arc(waveX, waveY, 2 + Math.sin(t * Math.PI) * 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Main signal line
      ctx.globalAlpha = 0.4 * (1 - tx.progress);
      ctx.strokeStyle = 'rgba(100,200,255,0.7)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 8]);
      ctx.lineDashOffset = -nowMs / 50;
      ctx.beginPath();
      ctx.moveTo(satX, satY);
      ctx.lineTo(gsX, gsY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Signal front wave
      const frontT = tx.progress;
      const frontX = satX + dx * frontT;
      const frontY = satY + dy * frontT;
      const frontPulse = 0.6 + 0.4 * Math.sin(tx.wavePhase);

      ctx.globalAlpha = 0.8 * (1 - tx.progress) * frontPulse;
      ctx.fillStyle = 'rgba(150,220,255,1)';
      ctx.beginPath();
      ctx.arc(frontX, frontY, 4 + frontPulse * 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  });
}
