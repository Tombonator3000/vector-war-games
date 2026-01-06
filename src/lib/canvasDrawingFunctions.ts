/**
 * Canvas Drawing Functions
 *
 * Extracted from Index.tsx to reduce file size and improve maintainability.
 * Handles all canvas-based rendering for missiles, bombers, submarines, satellites,
 * conventional forces, particles, fallout, and special effects.
 */

import type { Nation, GameState, SatelliteOrbit, FalloutMark, RadiationZone } from '@/types/game';
import type { ProjectedPoint } from '@/lib/renderingUtils';
import type { ForceType } from '@/hooks/useConventionalWarfare';
import type {
  SignalSatellite,
  SignalTransmission,
  GroundStation as SignalGroundStation,
  SignalInterference,
} from '@/types/satelliteSignal';
import type { VIIRSFirePoint } from '@/hooks/useVIIRS';
import { getFireColor, getFireRadius } from '@/hooks/useVIIRS';
import { easeInOutQuad } from '@/lib/gameUtilityFunctions';
import { getFalloutSeverityLevel } from '@/lib/falloutEffects';
import { calculateMissileInterceptChance } from '@/lib/missileDefense';
import { calculateBomberInterceptChance, getMirvSplitChance } from '@/lib/research';
import { getNationById } from '@/lib/nationUtils';

// ============================================================================
// Type Definitions
// ============================================================================

type CanvasIcon = HTMLImageElement | null;

type DrawIconOptions = {
  alpha?: number;
};

type DeliveryMethod = 'missile' | 'bomber' | 'submarine';

type ConventionalUnitMarker = {
  id: string;
  lon: number;
  lat: number;
  ownerId: string;
  forceType: ForceType;
  icon?: CanvasIcon;
};

type ConventionalMovementMarker = {
  id: string;
  startLon: number;
  startLat: number;
  endLon: number;
  endLat: number;
  ownerId: string;
  forceType: ForceType;
  progress: number;
  speed: number;
  icon?: CanvasIcon;
};

type OverlayTone = 'info' | 'warning' | 'catastrophe';

// ============================================================================
// Constants
// ============================================================================

const SATELLITE_ORBIT_RADIUS = 34;
const SATELLITE_ORBIT_TTL_MS = 3600000; // 1 hour
const SATELLITE_ORBIT_SPEED = (Math.PI * 2) / 12000;
const MAX_FALLOUT_MARKS = 36;
const FALLOUT_GROWTH_RATE = 1.1; // units per second
const FALLOUT_DECAY_DELAY_MS = 12000;
const FALLOUT_DECAY_RATE = 0.04; // intensity per second once decay begins
const MISSILE_ICON_BASE_SCALE = 0.14;
const BOMBER_ICON_BASE_SCALE = 0.18;
const SUBMARINE_ICON_BASE_SCALE = 0.2;
const RADIATION_ICON_BASE_SCALE = 0.16;
const SATELLITE_ICON_BASE_SCALE = 0.18;

// ============================================================================
// Dependencies Interface
// ============================================================================

export interface CanvasDrawingDependencies {
  // Core state
  S: GameState;
  nations: Nation[];

  // Canvas context and camera
  ctx: CanvasRenderingContext2D | null;
  cam: { x: number; y: number; zoom: number; targetZoom: number };
  W: number;
  H: number;

  // Projection functions
  projectLocal: (lon: number, lat: number) => ProjectedPoint;
  toLonLatLocal: (x: number, y: number) => [number, number];

  // Icon assets
  missileIcon: CanvasIcon;
  bomberIcon: CanvasIcon;
  submarineIcon: CanvasIcon;
  satelliteIcon: CanvasIcon;
  radiationIcon: CanvasIcon;
  conventionalIconLookup: Record<ForceType, CanvasIcon>;

  // Conventional force icon base scales
  CONVENTIONAL_ICON_BASE_SCALE: Record<ForceType, number>;

  // Game systems
  AudioSys: any;
  CityLights: any;
  PlayerManager: any;
  toast: (options: any) => void;
  log: (msg: string, type?: string) => void;

  // Game functions
  explode: (
    x: number,
    y: number,
    target: Nation,
    yieldMT: number,
    attacker: Nation | null,
    deliveryMethod: DeliveryMethod
  ) => void;
  launch: (from: Nation, to: Nation, yieldMT: number) => boolean;
  handleDefconChange: (
    delta: number,
    reason: string,
    source: string,
    callbacks: any
  ) => void;
  updateDisplay: () => void;

  // State variables
  currentMapStyle: string;
  policySystemRef: any;
  lastFxTimestamp: number | null;
  setLastFxTimestamp: (timestamp: number | null) => void;
}

// ============================================================================
// Helper Function: drawIcon
// ============================================================================

function drawIcon(
  icon: CanvasIcon,
  x: number,
  y: number,
  angle: number,
  baseScale: number,
  options: DrawIconOptions | undefined,
  deps: CanvasDrawingDependencies
) {
  const { ctx, cam } = deps;
  if (!ctx || !icon || !icon.complete || icon.naturalWidth === 0 || icon.naturalHeight === 0) {
    return;
  }

  ctx.save();

  if (options?.alpha !== undefined) {
    ctx.globalAlpha *= options.alpha;
  }

  ctx.translate(x, y);
  ctx.rotate(angle);

  const zoomScale = Math.max(0.7, Math.min(1.5, cam.zoom));
  const width = icon.naturalWidth || icon.width || 1;
  const height = icon.naturalHeight || icon.height || 1;
  const scale = baseScale * zoomScale;
  const drawWidth = width * scale;
  const drawHeight = height * scale;

  ctx.drawImage(icon, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  ctx.restore();
}

// ============================================================================
// Exported Functions
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

/**
 * Draw NASA VIIRS fire detection points on the map
 * Renders heat blooms from satellite thermal detection
 */
export function drawVIIRSFires(nowMs: number, deps: CanvasDrawingDependencies) {
  const { ctx, projectLocal } = deps;
  if (!ctx) return;

  // Get VIIRS state from window (set by useVIIRS hook)
  const viirsState = (window as any).__viirsState;
  if (!viirsState?.enabled || !viirsState?.fires?.length) {
    return;
  }

  const fires: VIIRSFirePoint[] = viirsState.fires;
  const pulse = 0.7 + 0.3 * Math.sin(nowMs / 300);

  ctx.save();

  for (const fire of fires) {
    const { x, y, visible } = projectLocal(fire.longitude, fire.latitude);
    if (!visible || !Number.isFinite(x) || !Number.isFinite(y)) {
      continue;
    }

    const baseRadius = getFireRadius(fire.frp);
    const radius = baseRadius * (0.85 + 0.15 * pulse);
    const color = getFireColor(fire.brightness, fire.confidence);

    // Outer glow (heat bloom effect)
    ctx.globalCompositeOperation = 'lighter';
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 3);
    gradient.addColorStop(0, color.replace(/[\d.]+\)$/, `${0.6 * pulse})`));
    gradient.addColorStop(0.4, color.replace(/[\d.]+\)$/, `${0.3 * pulse})`));
    gradient.addColorStop(1, 'rgba(255,100,0,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius * 3, 0, Math.PI * 2);
    ctx.fill();

    // Core fire point
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Bright center
    ctx.fillStyle = `rgba(255,255,200,${0.8 * pulse})`;
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

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

// ============================================================================
// Missile Rendering - Helper Functions
// ============================================================================

/**
 * Calculates the current position and heading of a missile along its quadratic trajectory.
 * Uses Bezier curve math to interpolate between start and target with an arc.
 */
function calculateMissileTrajectoryPoint(
  missile: any,
  startX: number,
  startY: number,
  targetX: number,
  targetY: number
): { x: number; y: number; heading: number; controlX: number; controlY: number } {
  const t = missile.t;
  const u = 1 - t;

  // Control point creates the arc (150px above midpoint)
  const controlX = (startX + targetX) / 2;
  const controlY = (startY + targetY) / 2 - 150;

  // Quadratic Bezier curve: B(t) = (1-t)²P₀ + 2(1-t)tP₁ + t²P₂
  const x = u * u * startX + 2 * u * t * controlX + t * t * targetX;
  const y = u * u * startY + 2 * u * t * controlY + t * t * targetY;

  // Calculate heading from velocity vector (derivative of position)
  const derivativeX = 2 * u * (controlX - startX) + 2 * t * (targetX - controlX);
  const derivativeY = 2 * u * (controlY - startY) + 2 * t * (targetY - controlY);
  const heading = Math.atan2(derivativeY, derivativeX);

  return { x, y, heading, controlX, controlY };
}

/**
 * Renders the visual elements of a missile (trajectory path and icon).
 */
function renderMissileVisuals(
  missile: any,
  startX: number,
  startY: number,
  targetX: number,
  targetY: number,
  trajectoryPoint: { x: number; y: number; heading: number; controlX: number; controlY: number },
  deps: CanvasDrawingDependencies
): void {
  const { ctx, missileIcon } = deps;
  if (!ctx) return;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  // Draw trajectory path with animated dashing
  ctx.strokeStyle = missile.color || 'rgba(255,0,255,0.9)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.lineDashOffset = -(Date.now() / 60) % 100;
  ctx.shadowColor = typeof ctx.strokeStyle === 'string' ? ctx.strokeStyle : '#ff00ff';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.quadraticCurveTo(trajectoryPoint.controlX, trajectoryPoint.controlY, targetX, targetY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw missile glow and icon at current position
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.arc(trajectoryPoint.x, trajectoryPoint.y, 5, 0, Math.PI * 2);
  ctx.fill();
  drawIcon(
    missileIcon,
    trajectoryPoint.x,
    trajectoryPoint.y,
    trajectoryPoint.heading,
    MISSILE_ICON_BASE_SCALE,
    undefined,
    deps
  );
  ctx.restore();
}

/**
 * Handles MIRV (Multiple Independently targetable Reentry Vehicle) splitting.
 * Spawns additional warheads with spread pattern if MIRV is triggered.
 * Returns true if MIRV split occurred (missile should not explode yet).
 */
function handleMirvSplitting(missile: any, deps: CanvasDrawingDependencies): boolean {
  const { S, log } = deps;
  // Only check for MIRV on first impact (not already split warheads)
  const mirvChance = getMirvSplitChance(missile.from, !!missile.isMirv);

  if (mirvChance > 0 && Math.random() < mirvChance) {
    log(`MIRV ACTIVATED! Multiple warheads deployed`, 'warning');

    const splitYield = Math.floor(missile.yield / 3);

    // Spawn 2 additional warheads with staggered timing
    for (let j = 0; j < 2; j++) {
      setTimeout(() => {
        // Larger spread for MIRV warheads (±8 degrees)
        const offsetLon = missile.toLon + (Math.random() - 0.5) * 16;
        const offsetLat = missile.toLat + (Math.random() - 0.5) * 16;

        S.missiles.push({
          from: missile.from,
          to: missile.target,
          t: 0,
          fromLon: missile.fromLon,
          fromLat: missile.fromLat,
          toLon: offsetLon,
          toLat: offsetLat,
          yield: splitYield,
          target: missile.target,
          color: '#ffff00',
          isMirv: true,
        });
      }, j * 200);
    }

    return true; // MIRV activated
  }

  return false; // No MIRV split
}

/**
 * Checks if missile should be intercepted by target nation or allies.
 * Handles interception logic including defense calculations and ally support.
 * Returns true if missile was intercepted and should be removed.
 */
function checkAndHandleInterception(
  missile: any,
  missileIndex: number,
  targetX: number,
  targetY: number,
  deps: CanvasDrawingDependencies
): boolean {
  const { S, nations, log, policySystemRef } = deps;
  // Only check once when missile is at 95% completion
  if (missile.t < 0.95 || missile.interceptChecked) {
    return false;
  }

  missile.interceptChecked = true;

  // Helper to get policy-based defense bonus
  const getPolicyDefenseBonus = (nation: Nation) => {
    if (nation.isPlayer && policySystemRef?.totalEffects?.defenseBonus) {
      return policySystemRef.totalEffects.defenseBonus;
    }
    return nation.defensePolicyBonus ?? 0;
  };

  // Calculate combined defense from target and allies
  const allies = nations.filter(
    (n) => n.treaties?.[missile.target.id]?.alliance && n.defense > 0
  );
  const alliedDefenses = allies.map(
    (ally) => (ally.defense || 0) + getPolicyDefenseBonus(ally)
  );
  const { totalChance, allyChances } = calculateMissileInterceptChance(
    (missile.target.defense || 0) + getPolicyDefenseBonus(missile.target),
    alliedDefenses
  );

  // Log ally support attempts
  allies.forEach((ally, index) => {
    const allyChance = allyChances[index] ?? 0;
    if (allyChance > 0 && Math.random() < allyChance) {
      log(`${ally.name} helps defend ${missile.target.name}!`, 'success');
    }
  });

  // Check if interception succeeds
  if (Math.random() < totalChance) {
    S.missiles.splice(missileIndex, 1);
    log(`Missile intercepted! Defense successful`, 'success');
    S.rings.push({
      x: targetX,
      y: targetY,
      r: 1,
      max: 40,
      speed: 3,
      alpha: 1,
      type: 'intercept',
    });
    return true; // Intercepted
  }

  return false; // Not intercepted
}

// ============================================================================
// Missile Rendering - Main Function
// ============================================================================

/**
 * Main missile rendering loop. Handles trajectory visualization, MIRV splitting,
 * interception checks, and impact explosions.
 *
 * Refactored for clarity: Complex logic extracted into focused helper functions.
 */
export function drawMissiles(deps: CanvasDrawingDependencies) {
  const { ctx, S, projectLocal, explode } = deps;
  if (!ctx) return;

  // Iterate backwards to safely remove missiles during iteration
  for (let i = S.missiles.length - 1; i >= 0; i--) {
    const missile = S.missiles[i];
    missile.t = Math.min(1, missile.t + 0.016);

    // Step 1: Check if missile is visible on screen
    const startProjection = projectLocal(missile.fromLon, missile.fromLat);
    const targetProjection = projectLocal(missile.toLon, missile.toLat);
    if (!startProjection.visible || !targetProjection.visible) {
      continue;
    }
    const { x: startX, y: startY } = startProjection;
    const { x: targetX, y: targetY } = targetProjection;

    // Step 2: Calculate trajectory and render visuals
    const trajectoryPoint = calculateMissileTrajectoryPoint(
      missile,
      startX,
      startY,
      targetX,
      targetY
    );
    renderMissileVisuals(missile, startX, startY, targetX, targetY, trajectoryPoint, deps);

    // Step 3: Show incoming warning near impact
    if (!missile._tele && missile.t > 0.8) {
      missile._tele = true;
      S.rings.push({
        x: targetX,
        y: targetY,
        r: 2,
        max: 60 * (S.fx || 1),
        speed: 3,
        alpha: 1,
        type: 'incoming',
        txt: 'INCOMING',
      });
    }

    // Step 4: Handle impact phase (MIRV, interception, explosion)
    if (missile.t >= 1 && !missile.hasExploded) {
      // Priority 1: Check for MIRV splitting (spawns additional warheads)
      const mirvActivated = handleMirvSplitting(missile, deps);

      // Priority 2: Check for interception (may remove missile)
      const wasIntercepted = checkAndHandleInterception(missile, i, targetX, targetY, deps);
      if (wasIntercepted) {
        continue; // Missile removed, skip to next
      }

      // Priority 3: Explode missile at target (unless MIRV already split it)
      if (!mirvActivated) {
        missile.hasExploded = true;
        explode(
          targetX,
          targetY,
          missile.target,
          missile.yield,
          missile.from || null,
          missile.isSubmarine ? 'submarine' : 'missile'
        );
        S.missiles.splice(i, 1);
      }
    }
  }
}

export function drawBombers(deps: CanvasDrawingDependencies) {
  const { ctx, S, AudioSys, log, explode, bomberIcon } = deps;
  if (!ctx) return;

  S.bombers.forEach((bomber: any, i: number) => {
    bomber.t += 0.016 / 3;

    // Detection at midpoint
    if (bomber.t > 0.5 && !bomber.detected && bomber.to) {
      bomber.detected = true;
      log(`⚠️ BOMBER DETECTED approaching ${bomber.to.name}!`, 'warning');

      // Intercept chance
      const interceptChance = calculateBomberInterceptChance(bomber.to.defense, bomber.from);

      if (Math.random() < interceptChance) {
        log(`✓ Bomber intercepted by ${bomber.to.name}!`, 'success');
        S.bombers.splice(i, 1);
        AudioSys.playSFX('explosion');
        return;
      }
    }

    const x = bomber.sx + (bomber.tx - bomber.sx) * bomber.t;
    const y = bomber.sy + (bomber.ty - bomber.sy) * bomber.t;

    const dx = bomber.tx - bomber.sx;
    const dy = bomber.ty - bomber.sy;
    const angle = Math.atan2(dy, dx);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(255,255,160,0.3)';
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawIcon(bomberIcon, x, y, angle, BOMBER_ICON_BASE_SCALE, undefined, deps);

    if (bomber.t >= 1.0) {
      explode(bomber.tx, bomber.ty, bomber.to, bomber.payload.yield, bomber.from || null, 'bomber');
      S.bombers.splice(i, 1);
    }
  });
}

export function drawSubmarines(deps: CanvasDrawingDependencies) {
  const { ctx, S, log, submarineIcon } = deps;
  if (!ctx) return;

  S.submarines = S.submarines || [];
  S.submarines.forEach((sub: any, i: number) => {
    const targetX = typeof sub.targetX === 'number' ? sub.targetX : sub.x;
    const targetY = typeof sub.targetY === 'number' ? sub.targetY : sub.y;
    const angle = Math.atan2(targetY - sub.y, targetX - sub.x);

    if (sub.phase === 0) {
      // Surfacing
      sub.phaseProgress = Math.min(1, (sub.phaseProgress || 0) + 0.03);
      const p = sub.phaseProgress;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = `rgba(100,200,255,${1 - p})`;
      ctx.beginPath();
      ctx.arc(sub.x, sub.y, 30 * p, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      drawIcon(
        submarineIcon,
        sub.x,
        sub.y + (1 - p) * 10,
        angle,
        SUBMARINE_ICON_BASE_SCALE,
        { alpha: p },
        deps
      );
      if (p >= 1) {
        sub.phase = 1;
        // Launch missile with random offset to spread impacts
        const lonOffset = (Math.random() - 0.5) * 6;
        const latOffset = (Math.random() - 0.5) * 6;

        const missile = {
          from: sub.from || null,
          to: sub.target,
          t: 0.5,
          fromLon: 0,
          fromLat: 0,
          toLon: sub.target.lon + lonOffset,
          toLat: sub.target.lat + latOffset,
          yield: sub.yield,
          target: sub.target,
          color: '#00ffff',
          isSubmarine: true,
        };
        S.missiles.push(missile);
        log(`SUBMARINE LAUNCH! Missile away!`, 'alert');
      }
    } else if (sub.phase === 1) {
      sub.phase = 2;
    } else if (sub.phase === 2) {
      sub.diveProgress = (sub.diveProgress || 0) + 0.02;
      const diveAlpha = Math.max(0, 1 - sub.diveProgress);
      drawIcon(
        submarineIcon,
        sub.x,
        sub.y + sub.diveProgress * 10,
        angle,
        SUBMARINE_ICON_BASE_SCALE,
        { alpha: diveAlpha },
        deps
      );
      if (sub.diveProgress >= 1) {
        S.submarines.splice(i, 1);
      }
    }
  });
}

export function drawConventionalForces(deps: CanvasDrawingDependencies) {
  const { ctx, S, nations, projectLocal, conventionalIconLookup, CONVENTIONAL_ICON_BASE_SCALE } =
    deps;
  if (!ctx) return;

  const movements = S.conventionalMovements ?? [];
  const nextMovements: ConventionalMovementMarker[] = [];

  movements.forEach((movement) => {
    const m = movement as ConventionalMovementMarker;
    const startProjection = projectLocal(m.startLon, m.startLat);
    const endProjection = projectLocal(m.endLon, m.endLat);
    if (!startProjection.visible || !endProjection.visible) {
      return;
    }
    const { x: sx, y: sy } = startProjection;
    const { x: ex, y: ey } = endProjection;
    const dx = ex - sx;
    const dy = ey - sy;
    const distance = Math.hypot(dx, dy);
    const nation = getNationById(nations, m.ownerId);
    const color = nation?.color ?? '#38bdf8';

    if (distance > 4) {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.restore();
    }

    m.progress = Math.min(1, m.progress + m.speed);
    const eased = easeInOutQuad(m.progress);
    const x = sx + dx * eased;
    const y = sy + dy * eased;
    const angle = Math.atan2(dy, dx);

    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawIcon(
      m.icon ?? conventionalIconLookup[m.forceType],
      x,
      y,
      angle,
      CONVENTIONAL_ICON_BASE_SCALE[m.forceType],
      { alpha: 0.95 },
      deps
    );

    if (m.progress < 1) {
      nextMovements.push(m);
    }
  });

  S.conventionalMovements = nextMovements;

  const unitMarkers = S.conventionalUnits ?? [];
  unitMarkers.forEach((marker) => {
    const m = marker as ConventionalUnitMarker;
    const { x, y, visible } = projectLocal(m.lon, m.lat);
    if (!visible) {
      return;
    }
    const nation = getNationById(nations, m.ownerId);
    const color = nation?.color ?? '#22d3ee';

    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = 'rgba(8,15,32,0.78)';
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.restore();

    drawIcon(
      m.icon ?? conventionalIconLookup[m.forceType],
      x,
      y,
      0,
      CONVENTIONAL_ICON_BASE_SCALE[m.forceType],
      undefined,
      deps
    );
  });
}

export function drawParticles(deps: CanvasDrawingDependencies) {
  const { ctx, S } = deps;
  if (!ctx) return;

  S.particles = S.particles.filter((p: any) => {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 16;
    p.vx *= 0.98;
    p.vy *= 0.98;

    if (p.life <= 0) return false;

    const a = p.life / p.max;

    ctx.save();
    if (p.type === 'smoke') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = a * 0.6;
      ctx.fillStyle = `rgba(180,180,180,${a * 0.6})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'spark') {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = a;
      const g = 150 + Math.floor(Math.random() * 80);
      ctx.fillStyle = `rgba(255,${g},50,${a * 0.9})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'mushroom-stem') {
      // Rising column of the mushroom cloud
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = a * 0.8;
      const sz = 4 + (1 - a) * 3;
      ctx.fillStyle = `rgba(255,120,60,${a * 0.8})`;
      ctx.fillRect(p.x - sz / 2, p.y - sz / 2, sz, sz);
    } else if (p.type === 'mushroom-cap') {
      // Mushroom cloud cap
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = a * 0.7;
      const sz = 5 + (1 - a) * 4;
      ctx.fillStyle = `rgba(200,100,50,${a * 0.7})`;
      ctx.shadowColor = 'rgba(255,100,30,0.5)';
      ctx.shadowBlur = 8;
      ctx.fillRect(p.x - sz / 2, p.y - sz / 2, sz, sz);
    } else if (p.type === 'blast') {
      // Ground blast particles
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = a * 0.9;
      ctx.fillStyle = `rgba(255,180,80,${a * 0.9})`;
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    } else {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = a;
      ctx.fillStyle = `rgba(255,255,100,${a * 0.9})`;
      ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
    }
    ctx.restore();

    return true;
  });
}

export function drawFalloutMarks(deltaMs: number, deps: CanvasDrawingDependencies) {
  const { ctx, S, nations, projectLocal, currentMapStyle, toast, radiationIcon } = deps;
  if (!ctx || currentMapStyle !== 'flat-realistic') {
    return;
  }

  if (!Array.isArray(S.falloutMarks)) {
    S.falloutMarks = [];
    return;
  }

  const now = Date.now();
  const deltaSeconds = Math.max(0.016, deltaMs / 1000);
  const updatedMarks: FalloutMark[] = [];
  const getNearestNationName = (x: number, y: number, radius: number): string | null => {
    let best: { name: string; dist: number } | null = null;
    nations.forEach((nation) => {
      if (nation.population <= 0) return;
      const { x: nx, y: ny } = projectLocal(nation.lon, nation.lat);
      const dist = Math.hypot(nx - x, ny - y);
      if (dist <= radius && (!best || dist < best.dist)) {
        best = { name: nation.name, dist };
      }
    });
    return best?.name ?? null;
  };

  for (const mark of S.falloutMarks) {
    const next: FalloutMark = { ...mark };
    const previousAlertLevel = mark.alertLevel ?? 'none';

    const growthFactor = Math.min(1, next.growthRate * deltaSeconds);
    if (next.radius < next.targetRadius) {
      const radiusDelta = (next.targetRadius - next.radius) * growthFactor;
      next.radius = Math.min(next.targetRadius, next.radius + radiusDelta);
    }

    if (next.intensity < next.targetIntensity) {
      const intensityDelta = (next.targetIntensity - next.intensity) * (growthFactor * 0.8);
      next.intensity = Math.min(next.targetIntensity, next.intensity + intensityDelta);
    }

    if (now - next.lastStrikeAt > next.decayDelayMs) {
      const decayAmount = next.decayRate * deltaSeconds;
      next.intensity = Math.max(0, next.intensity - decayAmount);
      next.targetIntensity = Math.max(0, next.targetIntensity - decayAmount * 0.5);
      const shrink = next.targetRadius * decayAmount * 0.2;
      if (next.radius > next.targetRadius * 0.6) {
        next.radius = Math.max(next.targetRadius * 0.6, next.radius - shrink);
      }
    }

    next.updatedAt = now;
    const { x: px, y: py, visible } = projectLocal(next.lon, next.lat);
    if (!visible) {
      continue;
    }
    next.canvasX = px;
    next.canvasY = py;

    if (next.intensity <= 0.015) {
      continue;
    }

    const severityLevel = getFalloutSeverityLevel(next.intensity);
    next.alertLevel = severityLevel;

    updatedMarks.push(next);

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = Math.min(0.85, next.intensity + 0.05);
    const gradient = ctx.createRadialGradient(
      px,
      py,
      Math.max(4, next.radius * 0.25),
      px,
      py,
      next.radius
    );
    gradient.addColorStop(0, 'rgba(120,255,180,0.75)');
    gradient.addColorStop(0.45, 'rgba(60,200,120,0.35)');
    gradient.addColorStop(1, 'rgba(10,80,30,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(px, py, next.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (severityLevel !== 'none') {
      const strokeColor =
        severityLevel === 'deadly'
          ? 'rgba(248,113,113,0.8)'
          : severityLevel === 'severe'
            ? 'rgba(250,204,21,0.75)'
            : 'rgba(56,189,248,0.6)';
      const label =
        severityLevel === 'deadly'
          ? '☢️ DEADLY FALLOUT'
          : severityLevel === 'severe'
            ? '⚠️ SEVERE FALLOUT'
            : '☢️ FALLOUT ZONE';

      ctx.save();
      ctx.globalAlpha = Math.min(0.9, next.intensity + 0.2);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = Math.max(1.5, Math.min(4, next.radius * 0.08));
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.arc(px, py, next.radius * 1.08, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = Math.min(0.95, next.intensity + 0.25);
      ctx.fillStyle = strokeColor;
      ctx.font = `600 ${Math.max(12, Math.min(22, next.radius * 0.55))}px var(--font-sans, 'Orbitron', sans-serif)`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(label, px, py - next.radius - 8);
      ctx.restore();
    }

    const iconScale =
      severityLevel === 'deadly'
        ? RADIATION_ICON_BASE_SCALE * 1.4
        : severityLevel === 'severe'
          ? RADIATION_ICON_BASE_SCALE * 1.2
          : RADIATION_ICON_BASE_SCALE;
    drawIcon(
      radiationIcon,
      px,
      py,
      0,
      iconScale,
      {
        alpha: Math.min(0.9, next.intensity + 0.15),
      },
      deps
    );

    if (severityLevel === 'deadly' && previousAlertLevel !== 'deadly') {
      const impactedNation = getNearestNationName(px, py, next.radius * 1.4);
      const description = impactedNation
        ? `${impactedNation} reports lethal fallout. Immediate evacuation required.`
        : 'A fallout zone has intensified to lethal levels.';
      toast({
        title: '☢️ Deadly Fallout Detected',
        description,
        variant: 'destructive',
      });
      if (typeof window !== 'undefined' && (window as any).__gameAddNewsItem) {
        (window as any).__gameAddNewsItem(
          'environment',
          impactedNation
            ? `${impactedNation} overwhelmed by deadly fallout levels!`
            : 'Deadly fallout detected over irradiated wasteland!',
          'critical'
        );
      }
    }
  }

  if (updatedMarks.length > MAX_FALLOUT_MARKS) {
    updatedMarks
      .sort((a, b) => a.lastStrikeAt - b.lastStrikeAt)
      .splice(0, updatedMarks.length - MAX_FALLOUT_MARKS);
  }

  S.falloutMarks = updatedMarks;
}

export function upsertFalloutMark(
  x: number,
  y: number,
  lon: number,
  lat: number,
  yieldMT: number,
  targetNationId: string | null | undefined,
  deps: CanvasDrawingDependencies
) {
  const { S } = deps;
  if (!Array.isArray(S.falloutMarks)) {
    S.falloutMarks = [];
  }

  const now = Date.now();
  const intensityBoost = Math.min(1, 0.25 + yieldMT / 160);
  const baseRadius = Math.max(24, Math.sqrt(Math.max(1, yieldMT)) * 12);
  const growthRate = FALLOUT_GROWTH_RATE * (0.8 + Math.sqrt(Math.max(1, yieldMT)) * 0.02);
  const decayDelay = Math.max(FALLOUT_DECAY_DELAY_MS, 8000 + yieldMT * 180);
  const decayRate = FALLOUT_DECAY_RATE * (0.6 + Math.sqrt(Math.max(1, yieldMT)) * 0.015);
  const mergeThreshold = Math.max(baseRadius * 0.6, 30);

  let targetMark: FalloutMark | undefined;
  for (const mark of S.falloutMarks) {
    const dist = Math.hypot(mark.canvasX - x, mark.canvasY - y);
    if (dist <= Math.max(mergeThreshold, mark.radius * 0.8)) {
      targetMark = mark;
      break;
    }
  }

  if (targetMark) {
    targetMark.lon = (targetMark.lon + lon) / 2;
    targetMark.lat = (targetMark.lat + lat) / 2;
    targetMark.canvasX = x;
    targetMark.canvasY = y;
    targetMark.targetRadius = Math.max(targetMark.targetRadius, baseRadius * 1.1);
    targetMark.radius = Math.min(
      targetMark.targetRadius,
      targetMark.radius + baseRadius * 0.15
    );
    targetMark.targetIntensity = Math.min(1, targetMark.targetIntensity + intensityBoost * 0.7);
    targetMark.intensity = Math.min(1, targetMark.intensity + intensityBoost * 0.35);
    targetMark.lastStrikeAt = now;
    targetMark.updatedAt = now;
    targetMark.growthRate = Math.max(targetMark.growthRate, growthRate);
    targetMark.decayDelayMs = Math.max(targetMark.decayDelayMs, decayDelay);
    targetMark.decayRate = Math.max(targetMark.decayRate, decayRate);
    if (!targetMark.nationId && targetNationId) {
      targetMark.nationId = targetNationId;
    }
  } else {
    const newMark: FalloutMark = {
      id: `fallout_${now}_${Math.random().toString(36).slice(2, 8)}`,
      lon,
      lat,
      canvasX: x,
      canvasY: y,
      radius: Math.max(18, baseRadius * 0.45),
      targetRadius: baseRadius,
      intensity: Math.min(1, intensityBoost * 0.6),
      targetIntensity: intensityBoost,
      createdAt: now,
      updatedAt: now,
      lastStrikeAt: now,
      growthRate,
      decayDelayMs: decayDelay,
      decayRate,
      alertLevel: 'none',
      nationId: targetNationId ?? null,
    };
    S.falloutMarks.push(newMark);
  }

  if (S.falloutMarks.length > MAX_FALLOUT_MARKS) {
    S.falloutMarks
      .sort((a, b) => a.lastStrikeAt - b.lastStrikeAt)
      .splice(0, S.falloutMarks.length - MAX_FALLOUT_MARKS);
  }
}

export function drawFX(deps: CanvasDrawingDependencies) {
  const { ctx, S, W, H, projectLocal, toLonLatLocal, lastFxTimestamp, setLastFxTimestamp, currentMapStyle } = deps;
  if (!ctx) return;

  const now = Date.now();
  const deltaMs = lastFxTimestamp === null ? 16 : Math.max(1, now - lastFxTimestamp);
  setLastFxTimestamp(now);

  if (S.screenShake && S.screenShake > 0) {
    const shakeX = (Math.random() - 0.5) * S.screenShake;
    const shakeY = (Math.random() - 0.5) * S.screenShake;
    ctx.save();
    ctx.translate(shakeX, shakeY);
    S.screenShake *= 0.9;
  }

  if (currentMapStyle === 'flat-realistic') {
    drawFalloutMarks(deltaMs, deps);
  }

  // Rings and explosions
  S.rings = S.rings || [];
  S.rings.forEach((b: any, i: number) => {
    b.r += b.speed || 2;
    const a = (1 - b.r / b.max) * (b.alpha || 1);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    let col = `rgba(255,121,198,${a})`;
    if (b.type === 'shock') col = `rgba(255,170,90,${a})`;
    if (b.type === 'heat') col = `rgba(255,120,60,${a})`;
    if (b.type === 'incoming') col = `rgba(255,255,255,${a})`;
    if (b.type === 'afterglow') col = `rgba(255,255,200,${a})`;
    if (b.type === 'sonar') col = `rgba(100,255,255,${a})`;
    if (b.type === 'flash') col = `rgba(255,255,255,${a})`;
    if (b.type === 'plasma') col = `rgba(255,70,180,${a})`;
    ctx.strokeStyle = col;
    ctx.lineWidth = b.type === 'flash' ? 4 : 3;
    let rx = typeof b.x === 'number' ? b.x : 0;
    let ry = typeof b.y === 'number' ? b.y : 0;
    if (b.lon !== undefined && b.lat !== undefined) {
      const projected = projectLocal(b.lon, b.lat);
      rx = projected.x;
      ry = projected.y;
    }
    ctx.beginPath();
    ctx.arc(rx, ry, b.r, 0, Math.PI * 2);
    ctx.stroke();
    if (b.txt) {
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(b.txt, rx, ry - 12);
    }
    ctx.restore();
    if (b.r >= b.max) S.rings.splice(i, 1);
  });

  // Radiation zones
  if (!Array.isArray(S.radiationZones)) {
    S.radiationZones = [];
  }

  const nextRadiationZones: RadiationZone[] = [];
  const radiationNow = Date.now();

  S.radiationZones.forEach(
    (entry: RadiationZone | (RadiationZone & { x?: number; y?: number })) => {
      const zone = { ...entry } as RadiationZone & { x?: number; y?: number };
      const normalizedIntensity = Number.isFinite(zone.intensity)
        ? Math.max(0, zone.intensity)
        : 0;

      if (normalizedIntensity < 0.01) {
        return;
      }

      let lon = Number.isFinite(zone.lon) ? zone.lon : undefined;
      let lat = Number.isFinite(zone.lat) ? zone.lat : undefined;

      if (
        (!Number.isFinite(lon) || !Number.isFinite(lat)) &&
        Number.isFinite(zone.x) &&
        Number.isFinite(zone.y)
      ) {
        const [computedLon, computedLat] = toLonLatLocal(zone.x!, zone.y!);
        if (Number.isFinite(computedLon) && Number.isFinite(computedLat)) {
          lon = computedLon;
          lat = computedLat;
        }
      }

      const projection =
        Number.isFinite(lon) && Number.isFinite(lat)
          ? projectLocal(lon!, lat!)
          : {
              x: Number.isFinite(zone.canvasX)
                ? zone.canvasX!
                : Number.isFinite(zone.x)
                  ? zone.x!
                  : 0,
              y: Number.isFinite(zone.canvasY)
                ? zone.canvasY!
                : Number.isFinite(zone.y)
                  ? zone.y!
                  : 0,
              visible: true,
            };

      const radius = Math.max(12, zone.radius ?? 0);

      if (projection.visible) {
        const pulse = Math.sin(radiationNow / 500) * 0.2 + 0.8;
        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        const grad = ctx.createRadialGradient(
          projection.x,
          projection.y,
          0,
          projection.x,
          projection.y,
          radius
        );
        grad.addColorStop(
          0,
          `rgba(168,255,80,${Math.min(1, normalizedIntensity + 0.1) * 0.35 * pulse})`
        );
        grad.addColorStop(0.6, `rgba(80,255,160,${normalizedIntensity * 0.18 * pulse})`);
        grad.addColorStop(1, 'rgba(30,110,60,0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(projection.x, projection.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      nextRadiationZones.push({
        ...zone,
        lon: Number.isFinite(lon) ? lon! : zone.lon,
        lat: Number.isFinite(lat) ? lat! : zone.lat,
        intensity: normalizedIntensity,
        radius,
        updatedAt: radiationNow,
        canvasX: projection.x,
        canvasY: projection.y,
      });
    }
  );

  S.radiationZones = nextRadiationZones;

  // EMP effects
  S.empEffects.forEach((emp: any, i: number) => {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const g = ctx.createRadialGradient(emp.x, emp.y, 0, emp.x, emp.y, emp.radius);
    g.addColorStop(0, `rgba(100,200,255,${(emp.duration / 30) * 0.3})`);
    g.addColorStop(1, 'rgba(100,200,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(emp.x, emp.y, emp.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    emp.duration--;
    if (emp.duration <= 0) {
      S.empEffects.splice(i, 1);
      return;
    }

    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    const arcs = 5;
    for (let j = 0; j < arcs; j++) {
      const angle = ((Date.now() / 100 + (j * Math.PI * 2) / arcs) % (Math.PI * 2));
      const x2 = emp.x + Math.cos(angle) * emp.radius;
      const y2 = emp.y + Math.sin(angle) * emp.radius;

      ctx.strokeStyle = `rgba(100,200,255,${emp.duration / 30})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(emp.x, emp.y);

      const segments = 8;
      for (let k = 1; k <= segments; k++) {
        const t = k / segments;
        const mx = emp.x + (x2 - emp.x) * t + (Math.random() - 0.5) * 20;
        const my = emp.y + (y2 - emp.y) * t + (Math.random() - 0.5) * 20;
        ctx.lineTo(mx, my);
      }
      ctx.stroke();
    }

    ctx.restore();
  });

  // Overlay text
  if (S.overlay && S.overlay.ttl > 0) {
    S.overlay.ttl -= 16;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 28px monospace';
    const tone = S.overlay.tone || 'warning';
    const fillMap: Record<OverlayTone, string> = {
      info: 'rgba(200,240,255,0.9)',
      warning: 'rgba(255,255,255,0.9)',
      catastrophe: 'rgba(255,120,120,0.95)',
    };
    const strokeMap: Record<OverlayTone, string> = {
      info: 'rgba(0,40,60,0.6)',
      warning: 'rgba(0,0,0,0.6)',
      catastrophe: 'rgba(30,0,0,0.7)',
    };
    ctx.fillStyle = fillMap[tone];
    ctx.strokeStyle = strokeMap[tone];
    ctx.lineWidth = 4;
    ctx.strokeText(S.overlay.text, W / 2, H / 2);
    ctx.fillText(S.overlay.text, W / 2, H / 2);
    ctx.restore();
    if (S.overlay.ttl <= 0) S.overlay = null;
  }

  if (S.screenShake) {
    ctx.restore();
  }

  // Nuclear winter overlay
  if (S.nuclearWinterLevel && S.nuclearWinterLevel > 1) {
    ctx.save();
    ctx.fillStyle = `rgba(50,50,50,${Math.min(S.nuclearWinterLevel / 20, 0.4)})`;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}
