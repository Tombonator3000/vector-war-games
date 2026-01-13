/**
 * Conventional Force Renderer
 *
 * Handles rendering of conventional military forces (tanks, aircraft, naval units, etc.)
 * Extracted from canvasDrawingFunctions.ts for better modularity.
 */

import { getNationById } from '@/lib/nationUtils';
import { easeInOutQuad } from '@/lib/gameUtilityFunctions';
import {
  drawIcon,
  type CanvasDrawingDependencies,
  type ConventionalUnitMarker,
  type ConventionalMovementMarker,
} from './types';

/**
 * Renders conventional military forces including stationary units and units in movement
 */
export function drawConventionalForces(deps: CanvasDrawingDependencies) {
  const { ctx, S, nations, projectLocal, conventionalIconLookup, CONVENTIONAL_ICON_BASE_SCALE } =
    deps;
  if (!ctx) return;

  const movements = S.conventionalMovements ?? [];
  const nextMovements: ConventionalMovementMarker[] = [];

  // Draw movement paths and animated units
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

    // Draw movement path
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

    // Update position and render unit
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

  // Draw stationary units
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
