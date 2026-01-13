/**
 * Effects Renderer
 *
 * Handles rendering of visual effects: particles, explosions, screen shake,
 * radiation zones, EMP effects, overlays, and nuclear winter.
 * Extracted from canvasDrawingFunctions.ts for better modularity.
 */

import type { RadiationZone } from '@/types/game';
import type { CanvasDrawingDependencies, OverlayTone } from './types';
import { drawFalloutMarks } from './falloutRenderer';

/**
 * Renders particle effects (smoke, sparks, mushroom clouds, blast particles)
 */
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

/**
 * Main effects rendering function. Handles all visual effects including:
 * - Screen shake
 * - Fallout marks
 * - Explosion rings
 * - Radiation zones
 * - EMP effects
 * - Overlay text
 * - Nuclear winter overlay
 */
export function drawFX(deps: CanvasDrawingDependencies) {
  const { ctx, S, W, H, projectLocal, toLonLatLocal, lastFxTimestamp, setLastFxTimestamp, currentMapStyle } = deps;
  if (!ctx) return;

  const now = Date.now();
  const deltaMs = lastFxTimestamp === null ? 16 : Math.max(1, now - lastFxTimestamp);
  setLastFxTimestamp(now);

  // Apply screen shake effect
  if (S.screenShake && S.screenShake > 0) {
    const shakeX = (Math.random() - 0.5) * S.screenShake;
    const shakeY = (Math.random() - 0.5) * S.screenShake;
    ctx.save();
    ctx.translate(shakeX, shakeY);
    S.screenShake *= 0.9;
  }

  // Draw fallout marks (only in flat-realistic map mode)
  if (currentMapStyle === 'flat-realistic') {
    drawFalloutMarks(deltaMs, deps);
  }

  // Render explosion rings and visual effects
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

  // Render radiation zones
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

  // Render EMP effects
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

  // Render overlay text
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

  // Restore from screen shake
  if (S.screenShake) {
    ctx.restore();
  }

  // Render nuclear winter overlay
  if (S.nuclearWinterLevel && S.nuclearWinterLevel > 1) {
    ctx.save();
    ctx.fillStyle = `rgba(50,50,50,${Math.min(S.nuclearWinterLevel / 20, 0.4)})`;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}
