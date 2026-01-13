/**
 * Fire Renderer
 *
 * Handles rendering of NASA VIIRS fire detection points.
 * Extracted from canvasDrawingFunctions.ts for better modularity.
 */

import type { VIIRSFirePoint } from '@/hooks/useVIIRS';
import { getFireColor, getFireRadius } from '@/hooks/useVIIRS';
import type { CanvasDrawingDependencies } from './types';

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
