/**
 * Fallout Renderer
 *
 * Handles rendering of nuclear fallout zones with growth, decay, and severity indicators.
 * Extracted from canvasDrawingFunctions.ts for better modularity.
 */

import type { Nation, FalloutMark } from '@/types/game';
import type { ProjectedPoint } from '@/lib/renderingUtils';
import { getFalloutSeverityLevel } from '@/lib/falloutEffects';
import {
  drawIcon,
  type CanvasDrawingDependencies,
  MAX_FALLOUT_MARKS,
  FALLOUT_GROWTH_RATE,
  FALLOUT_DECAY_DELAY_MS,
  FALLOUT_DECAY_RATE,
  RADIATION_ICON_BASE_SCALE,
} from './types';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Finds the nearest nation to a canvas position within a given radius.
 */
function getNearestNationName(
  x: number,
  y: number,
  radius: number,
  nations: Nation[],
  projectLocal: (lon: number, lat: number) => ProjectedPoint
): string | null {
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
}

/**
 * Updates the radius, intensity, and decay for a single fallout mark.
 * Returns the updated mark with new state values.
 */
function updateFalloutMarkState(
  mark: FalloutMark,
  deltaSeconds: number,
  now: number
): FalloutMark {
  const next: FalloutMark = { ...mark };

  // Calculate growth factor
  const growthFactor = Math.min(1, next.growthRate * deltaSeconds);

  // Grow radius towards target
  if (next.radius < next.targetRadius) {
    const radiusDelta = (next.targetRadius - next.radius) * growthFactor;
    next.radius = Math.min(next.targetRadius, next.radius + radiusDelta);
  }

  // Grow intensity towards target
  if (next.intensity < next.targetIntensity) {
    const intensityDelta = (next.targetIntensity - next.intensity) * (growthFactor * 0.8);
    next.intensity = Math.min(next.targetIntensity, next.intensity + intensityDelta);
  }

  // Apply decay after delay period
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
  return next;
}

/**
 * Renders the graphics for a single fallout mark including gradient, stroke, label, and icon.
 */
function renderFalloutMarkGraphics(
  ctx: CanvasRenderingContext2D,
  mark: FalloutMark,
  px: number,
  py: number,
  severityLevel: 'none' | 'moderate' | 'severe' | 'deadly',
  deps: CanvasDrawingDependencies
): void {
  const { radiationIcon } = deps;

  // Draw radial gradient
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = Math.min(0.85, mark.intensity + 0.05);
  const gradient = ctx.createRadialGradient(
    px,
    py,
    Math.max(4, mark.radius * 0.25),
    px,
    py,
    mark.radius
  );
  gradient.addColorStop(0, 'rgba(120,255,180,0.75)');
  gradient.addColorStop(0.45, 'rgba(60,200,120,0.35)');
  gradient.addColorStop(1, 'rgba(10,80,30,0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(px, py, mark.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Draw severity indicator (stroke and label)
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

    // Draw dashed circle
    ctx.save();
    ctx.globalAlpha = Math.min(0.9, mark.intensity + 0.2);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = Math.max(1.5, Math.min(4, mark.radius * 0.08));
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(px, py, mark.radius * 1.08, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Draw label text
    ctx.save();
    ctx.globalAlpha = Math.min(0.95, mark.intensity + 0.25);
    ctx.fillStyle = strokeColor;
    ctx.font = `600 ${Math.max(12, Math.min(22, mark.radius * 0.55))}px var(--font-sans, 'Orbitron', sans-serif)`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(label, px, py - mark.radius - 8);
    ctx.restore();
  }

  // Draw radiation icon
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
      alpha: Math.min(0.9, mark.intensity + 0.15),
    },
    deps
  );
}

/**
 * Checks if an alert should be sent for a deadly fallout zone and sends toast + news notifications.
 */
function handleFalloutAlert(
  mark: FalloutMark,
  px: number,
  py: number,
  severityLevel: 'none' | 'moderate' | 'severe' | 'deadly',
  previousAlertLevel: 'none' | 'moderate' | 'severe' | 'deadly',
  deps: CanvasDrawingDependencies
): void {
  const { toast, nations, projectLocal } = deps;

  if (severityLevel === 'deadly' && previousAlertLevel !== 'deadly') {
    const impactedNation = getNearestNationName(px, py, mark.radius * 1.4, nations, projectLocal);
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

/**
 * Limits the fallout marks array to MAX_FALLOUT_MARKS by removing oldest entries.
 */
function limitFalloutMarks(marks: FalloutMark[]): FalloutMark[] {
  if (marks.length > MAX_FALLOUT_MARKS) {
    const limited = [...marks];
    limited
      .sort((a, b) => a.lastStrikeAt - b.lastStrikeAt)
      .splice(0, limited.length - MAX_FALLOUT_MARKS);
    return limited;
  }
  return marks;
}

// ============================================================================
// Exported Functions
// ============================================================================

/**
 * Main function to update and render all fallout marks.
 * Coordinates state updates, rendering, and alerts for each fallout zone.
 */
export function drawFalloutMarks(deltaMs: number, deps: CanvasDrawingDependencies) {
  const { ctx, S, projectLocal, currentMapStyle } = deps;
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

  for (const mark of S.falloutMarks) {
    const previousAlertLevel = mark.alertLevel ?? 'none';

    // Update mark state (growth and decay)
    const next = updateFalloutMarkState(mark, deltaSeconds, now);

    // Project to canvas coordinates and check visibility
    const { x: px, y: py, visible } = projectLocal(next.lon, next.lat);
    if (!visible) {
      continue;
    }
    next.canvasX = px;
    next.canvasY = py;

    // Skip marks with negligible intensity
    if (next.intensity <= 0.015) {
      continue;
    }

    // Calculate severity level
    const severityLevel = getFalloutSeverityLevel(next.intensity);
    next.alertLevel = severityLevel;

    updatedMarks.push(next);

    // Render graphics
    renderFalloutMarkGraphics(ctx, next, px, py, severityLevel, deps);

    // Handle alerts for deadly fallout
    handleFalloutAlert(next, px, py, severityLevel, previousAlertLevel, deps);
  }

  // Limit array size and update state
  S.falloutMarks = limitFalloutMarks(updatedMarks);
}

/**
 * Creates or updates a fallout mark at the specified location.
 * Merges with nearby fallout marks if they are close enough.
 */
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
