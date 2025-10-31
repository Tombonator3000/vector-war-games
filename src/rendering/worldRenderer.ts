/**
 * World Map Rendering Functions
 *
 * Functions for rendering the world map, nations, and geographic features.
 * Extracted from Index.tsx as part of refactoring effort.
 */

import type { MapStyle } from '@/components/GlobeScene';
import type { Nation } from '@/types/game';

export interface WorldRenderContext {
  ctx: CanvasRenderingContext2D | null;
  worldCountries: any;
  W: number;
  H: number;
  cam: { x: number; y: number; zoom: number; targetZoom: number };
  currentTheme: string;
  flatRealisticTexture: HTMLImageElement | null;
  flatRealisticTexturePromise: Promise<HTMLImageElement> | null;
  THEME_SETTINGS: Record<string, any>;
  projectLocal: (lon: number, lat: number) => [number, number];
  preloadFlatRealisticTexture: () => void;
  getPoliticalFill: (index: number) => string;
}

export interface NationRenderContext extends WorldRenderContext {
  nations: Nation[];
  S: any; // GameState
  selectedTargetRefId: string | null;
}

/**
 * Draw a path on the world map
 */
export function drawWorldPath(
  coords: number[][],
  ctx: CanvasRenderingContext2D,
  projectLocal: (lon: number, lat: number) => [number, number]
): void {
  coords.forEach((coord, i) => {
    const [x, y] = projectLocal(coord[0], coord[1]);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
}

/**
 * Render the world map with various visual styles
 */
export function drawWorld(style: MapStyle, context: WorldRenderContext): void {
  const {
    ctx,
    worldCountries,
    W,
    H,
    cam,
    currentTheme,
    flatRealisticTexture,
    flatRealisticTexturePromise,
    THEME_SETTINGS,
    projectLocal,
    preloadFlatRealisticTexture,
    getPoliticalFill,
  } = context;

  if (!ctx) return;

  const palette = THEME_SETTINGS[currentTheme];

  const isPolitical = style === 'political';
  const isNight = style === 'night';
  const isWireframe = style === 'wireframe';
  const isFlatRealistic = style === 'flat-realistic';

  if (isFlatRealistic) {
    if (!flatRealisticTexture && !flatRealisticTexturePromise) {
      void preloadFlatRealisticTexture();
    }
    if (flatRealisticTexture) {
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(flatRealisticTexture, cam.x, cam.y, W * cam.zoom, H * cam.zoom);
      ctx.restore();
    }
  }

  if (worldCountries) {
    ctx.save();
    ctx.lineWidth = isWireframe ? 1.5 : 1;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    worldCountries.features.forEach((feature: any, index: number) => {
      ctx.beginPath();
      const coords = feature.geometry.coordinates;

      if (feature.geometry.type === 'Polygon') {
        drawWorldPath(coords[0], ctx, projectLocal);
      } else if (feature.geometry.type === 'MultiPolygon') {
        coords.forEach((poly: any) => drawWorldPath(poly[0], ctx, projectLocal));
      }

      if (isPolitical) {
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = getPoliticalFill(index);
        ctx.fill();
        ctx.restore();
      }

      if (isNight) {
        ctx.strokeStyle = 'rgba(170,210,255,0.35)';
      } else if (isWireframe) {
        ctx.strokeStyle = 'rgba(80,240,255,0.75)';
      } else if (isPolitical) {
        ctx.strokeStyle = 'rgba(40,40,40,0.5)';
      } else if (isFlatRealistic) {
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      } else {
        ctx.strokeStyle = palette.mapOutline;
      }

      ctx.stroke();
    });

    ctx.restore();
  }

  const shouldDrawGrid = style !== 'realistic' && style !== 'night';
  if (shouldDrawGrid) {
    ctx.save();
    if (isWireframe) {
      ctx.strokeStyle = 'rgba(80,240,255,0.35)';
      ctx.lineWidth = 0.7;
    } else if (isPolitical) {
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 0.5;
    } else {
      ctx.strokeStyle = palette.grid;
      ctx.lineWidth = 0.5;
    }

    for (let lon = -180; lon <= 180; lon += 30) {
      ctx.beginPath();
      for (let lat = -90; lat <= 90; lat += 5) {
        const [x, y] = projectLocal(lon, lat);
        if (lat === -90) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    for (let lat = -90; lat <= 90; lat += 30) {
      ctx.beginPath();
      for (let lon = -180; lon <= 180; lon += 5) {
        const [x, y] = projectLocal(lon, lat);
        if (lon === -180) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  if (style !== 'wireframe') {
    const scanY = (Date.now() / 30) % H;
    if (isNight) {
      ctx.fillStyle = 'rgba(80,160,255,0.08)';
    } else if (isPolitical) {
      ctx.fillStyle = 'rgba(255,200,120,0.12)';
    } else {
      ctx.fillStyle = palette.radar;
    }
    ctx.fillRect(0, scanY, W, 2);
  }
}

/**
 * Render nation markers, labels, and cities
 */
export function drawNations(style: MapStyle, context: NationRenderContext): void {
  const { ctx, nations, S, cam, projectLocal, selectedTargetRefId } = context;

  if (!ctx || nations.length === 0) return;

  const isWireframeStyle = style === 'wireframe';
  const isNightStyle = style === 'night';
  const isPoliticalStyle = style === 'political';

  nations.forEach(n => {
    if (n.population <= 0) return;

    const [x, y] = projectLocal(n.lon, n.lat);
    if (isNaN(x) || isNaN(y)) return;

    const isSelectedTarget = selectedTargetRefId === n.id;
    if (isSelectedTarget) {
      const pulse = (Math.sin(Date.now() / 200) + 1) / 2;
      const baseRadius = 42;
      const radius = baseRadius + pulse * 10;

      ctx.save();
      const targetColor = isWireframeStyle ? '#4ef6ff' : (n.color || '#ff6666');
      ctx.strokeStyle = targetColor;
      ctx.globalAlpha = isWireframeStyle ? 0.9 : 0.85;
      ctx.lineWidth = isWireframeStyle ? 1.5 : 2;
      ctx.setLineDash(isWireframeStyle ? [4, 6] : [6, 6]);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = isWireframeStyle ? 0.35 : 0.4;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(x, y, radius + 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Nation marker (triangle)
    ctx.save();
    ctx.strokeStyle = n.color;
    ctx.lineWidth = isWireframeStyle ? 1.5 : 2;
    if (isWireframeStyle) {
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(x, y - 18);
      ctx.lineTo(x - 14, y + 14);
      ctx.lineTo(x + 14, y + 14);
      ctx.closePath();
      ctx.stroke();
    } else {
      ctx.fillStyle = n.color;
      ctx.shadowColor = isNightStyle ? '#ffe066' : n.color;
      ctx.shadowBlur = isNightStyle ? 25 : 20;
      ctx.beginPath();
      ctx.moveTo(x, y - 20);
      ctx.lineTo(x - 15, y + 12);
      ctx.lineTo(x + 15, y + 12);
      ctx.closePath();
      ctx.stroke();
      ctx.globalAlpha = isPoliticalStyle ? 0.4 : 0.3;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // Draw city squares around nation
    const cityCount = n.cities || 1;
    if (cityCount > 1) {
      ctx.save();
      for (let i = 1; i < cityCount; i++) {
        const angle = (i / (cityCount - 1)) * Math.PI * 2;
        const radius = 35 + (i % 3) * 8;
        const cx = x + Math.cos(angle) * radius;
        const cy = y + Math.sin(angle) * radius;

        if (isWireframeStyle) {
          ctx.strokeStyle = n.color;
          ctx.globalAlpha = 0.6;
          ctx.strokeRect(cx - 5, cy - 5, 10, 10);
        } else {
          ctx.fillStyle = n.color;
          ctx.globalAlpha = isNightStyle ? 0.5 : 0.3;
          ctx.fillRect(cx - 6, cy - 6, 12, 12);
        }
      }
      ctx.restore();
    }

    // Nation labels
    const displayName = n.isPlayer
      ? (S.playerName || S.selectedLeader || 'PLAYER')
      : (n.leader || n.name);
    const nationName = n.name;

    const z = Math.max(0.9, Math.min(1.6, cam.zoom));
    const pad = 4 * z;

    ctx.save();
    ctx.textAlign = 'center';

    ctx.font = `bold ${Math.round(12 * z)}px monospace`;
    const w1 = ctx.measureText(displayName).width;

    ctx.font = `${Math.round(11 * z)}px monospace`;
    const w2 = ctx.measureText(nationName).width;

    const bw = Math.max(w1, w2) + pad * 2;
    const bh = (12 * z + 12 * z) + pad * 2;
    const lx = x;
    const lyTop = (y - 36 * z) - (bh - (12 * z));

    const frameFill = isWireframeStyle
      ? 'rgba(0,0,0,0.7)'
      : isNightStyle
        ? 'rgba(0,0,0,0.6)'
        : 'rgba(0,0,0,0.45)';
    ctx.fillStyle = frameFill;
    ctx.fillRect(lx - bw / 2, lyTop, bw, bh);

    ctx.globalAlpha = isWireframeStyle ? 0.65 : 0.4;
    ctx.strokeStyle = isWireframeStyle ? '#4ef6ff' : n.color;
    ctx.strokeRect(lx - bw / 2, lyTop, bw, bh);
    ctx.globalAlpha = 1;

    ctx.font = `bold ${Math.round(12 * z)}px monospace`;
    ctx.fillStyle = isWireframeStyle ? '#4ef6ff' : n.color;
    ctx.shadowColor = isNightStyle ? '#ffe066' : n.color;
    ctx.shadowBlur = isNightStyle ? 10 : 6;
    ctx.fillText(displayName, lx, lyTop + pad + 12 * z);
    ctx.shadowBlur = 0;

    ctx.font = `${Math.round(11 * z)}px monospace`;
    ctx.fillStyle = isPoliticalStyle ? '#ffecd1' : '#ffffff';
    ctx.fillText(nationName, lx, lyTop + pad + 12 * z + 12 * z);

    ctx.restore();

    // Population display
    ctx.save();
    ctx.fillStyle = isWireframeStyle ? '#4ef6ff' : isPoliticalStyle ? '#ffd166' : '#00ff00';
    ctx.font = `${Math.round(10 * z)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.floor(n.population)}M`, x, y + 30 * z);
    ctx.restore();
  });
}
