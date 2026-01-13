/**
 * Weapon Renderer
 *
 * Handles rendering of nuclear weapons: missiles, bombers, and submarines.
 * Extracted from canvasDrawingFunctions.ts for better modularity.
 */

import type { Nation } from '@/types/game';
import { calculateMissileInterceptChance } from '@/lib/missileDefense';
import { calculateBomberInterceptChance, getMirvSplitChance } from '@/lib/research';
import {
  drawIcon,
  type CanvasDrawingDependencies,
  MISSILE_ICON_BASE_SCALE,
  BOMBER_ICON_BASE_SCALE,
  SUBMARINE_ICON_BASE_SCALE,
} from './types';

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

// ============================================================================
// Bomber Rendering
// ============================================================================

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

// ============================================================================
// Submarine Rendering
// ============================================================================

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
