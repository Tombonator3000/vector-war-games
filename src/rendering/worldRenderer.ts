/**
 * World Map Rendering Functions
 *
 * Functions for rendering the world map, nations, and geographic features.
 * Extracted from Index.tsx as part of refactoring effort.
 */

import type { MapVisualStyle } from '@/components/GlobeScene';
import type { Nation, GameState } from '@/types/game';

export interface WorldRenderContext {
  ctx: CanvasRenderingContext2D | null;
  worldCountries: unknown;
  W: number;
  H: number;
  cam: { x: number; y: number; zoom: number; targetZoom: number };
  currentTheme: string;
  flatRealisticTexture: HTMLImageElement | null;
  flatRealisticTexturePromise: Promise<HTMLImageElement> | null;
  flatNightlightsTexture: HTMLImageElement | null;
  flatNightlightsTexturePromise: Promise<HTMLImageElement> | null;
  THEME_SETTINGS: Record<string, unknown>;
  projectLocal: (lon: number, lat: number) => [number, number];
  preloadFlatRealisticTexture: () => void;
  preloadFlatNightlightsTexture: () => void;
  getPoliticalFill: (index: number) => string;
}

export interface NationRenderContext extends WorldRenderContext {
  nations: Nation[];
  S: GameState;
  selectedTargetRefId: string | null;
}

export interface TerritoryRenderContext extends WorldRenderContext {
  territories: Array<{
    id: string;
    name: string;
    anchorLon: number;
    anchorLat: number;
    armies: number;
    controllingNationId: string | null;
    unitComposition: { army: number; navy: number; air: number };
    strategicValue: number;
  }>;
  playerId: string;
  selectedTerritoryId: string | null;
  hoveredTerritoryId: string | null;
  onTerritoryClick?: (territoryId: string) => void;
  draggingTerritoryId?: string | null;
  dragTargetTerritoryId?: string | null;
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
export function drawWorld(style: MapVisualStyle, context: WorldRenderContext): void {
  const {
    ctx,
    worldCountries,
    W,
    H,
    cam,
    currentTheme,
    flatRealisticTexture,
    flatRealisticTexturePromise,
    flatNightlightsTexture,
    flatNightlightsTexturePromise,
    THEME_SETTINGS,
    projectLocal,
    preloadFlatRealisticTexture,
    preloadFlatNightlightsTexture,
    getPoliticalFill,
  } = context;

  if (!ctx) return;

  const palette = THEME_SETTINGS[currentTheme];

  const isPolitical = style === 'political';
  const isNight = style === 'night';
  const isWireframe = style === 'wireframe';
  const isFlatRealistic = style === 'flat-realistic';
  const isFlatNightlights = style === 'flat-nightlights';

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

  if (isFlatNightlights) {
    if (!flatNightlightsTexture && !flatNightlightsTexturePromise) {
      void preloadFlatNightlightsTexture();
    }
    if (flatNightlightsTexture) {
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(flatNightlightsTexture, cam.x, cam.y, W * cam.zoom, H * cam.zoom);
      ctx.restore();
    }
  }

  if (worldCountries) {
    ctx.save();
    ctx.lineWidth = isWireframe ? 1.5 : 1;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    (worldCountries as { features: { geometry: { type: string; coordinates: number[][][] } }[] }).features.forEach((feature, index: number) => {
      ctx.beginPath();
      const coords = feature.geometry.coordinates;

      if (feature.geometry.type === 'Polygon') {
        drawWorldPath(coords[0], ctx, projectLocal);
      } else if (feature.geometry.type === 'MultiPolygon') {
        coords.forEach((poly: number[][]) => drawWorldPath(poly[0], ctx, projectLocal));
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
      } else if (isFlatNightlights) {
        ctx.strokeStyle = 'rgba(160,205,255,0.45)';
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
    } else if (isFlatNightlights) {
      ctx.strokeStyle = 'rgba(120,180,255,0.35)';
      ctx.lineWidth = 0.6;
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
    } else if (isFlatNightlights) {
      ctx.fillStyle = 'rgba(90,170,255,0.1)';
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
export function drawNations(style: MapVisualStyle, context: NationRenderContext): void {
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

    const z = Math.max(0.9, Math.min(1.6, cam.zoom));
    const pad = 4 * z;

    const labelVisibilityThreshold = 1.2;
    const labelFadeRange = 0.2;
    const fadeStart = labelVisibilityThreshold - labelFadeRange;
    const labelVisibility = cam.zoom <= fadeStart
      ? 0
      : Math.min(1, (cam.zoom - fadeStart) / labelFadeRange);

    if (labelVisibility > 0) {
      // Nation labels
      const displayName = n.isPlayer
        ? (S.playerName || S.selectedLeader || 'PLAYER')
        : (n.leader || n.name);
      const nationName = n.name;

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

      ctx.save();
      ctx.globalAlpha = labelVisibility;
      ctx.fillStyle = frameFill;
      ctx.fillRect(lx - bw / 2, lyTop, bw, bh);
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = labelVisibility * (isWireframeStyle ? 0.65 : 0.4);
      ctx.strokeStyle = isWireframeStyle ? '#4ef6ff' : n.color;
      ctx.strokeRect(lx - bw / 2, lyTop, bw, bh);
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = labelVisibility;
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

      ctx.restore();

      // Population display
      ctx.save();
      ctx.globalAlpha = labelVisibility;
      ctx.fillStyle = isWireframeStyle ? '#4ef6ff' : isPoliticalStyle ? '#ffd166' : '#00ff00';
      ctx.font = `${Math.round(10 * z)}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.floor(n.population)}M`, x, y + 30 * z);
      ctx.restore();
    }
  });
}

/**
 * Render territory markers with army counts (Risk-style)
 * Exported for use in main game renderer
 */
export function drawTerritories(context: TerritoryRenderContext): void {
  const {
    ctx,
    territories,
    playerId,
    selectedTerritoryId,
    hoveredTerritoryId,
    projectLocal,
    cam,
    draggingTerritoryId = null,
    dragTargetTerritoryId = null,
  } = context;

  if (!ctx || territories.length === 0) return;

  const z = Math.max(0.8, Math.min(1.8, cam.zoom));

  territories.forEach(territory => {
    const [x, y] = projectLocal(territory.anchorLon, territory.anchorLat);
    if (isNaN(x) || isNaN(y)) return;

    const isPlayerOwned = territory.controllingNationId === playerId;
    const isSelected = territory.id === selectedTerritoryId;
    const isHovered = territory.id === hoveredTerritoryId;
    const isDraggingSource = territory.id === draggingTerritoryId;
    const isDragTarget = territory.id === dragTargetTerritoryId;

    const baseColor = isPlayerOwned ? '#22d3ee' : (territory.controllingNationId ? '#f87171' : '#9ca3af');
    const glowColor = isSelected || isDragTarget ? '#fbbf24' : baseColor;

    // Selection ring
    if (isSelected) {
      const pulse = (Math.sin(Date.now() / 300) + 1) / 2;
      const ringRadius = 30 * z + pulse * 8;
      
      ctx.save();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2 * z;
      ctx.globalAlpha = 0.6 + pulse * 0.3;
      ctx.beginPath();
      ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (isDraggingSource) {
      ctx.save();
      ctx.setLineDash([4 * z, 4 * z]);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5 * z;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(x, y, 24 * z, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (isHovered || isDragTarget) {
      ctx.save();
      ctx.strokeStyle = isDragTarget ? '#facc15' : '#67e8f9';
      ctx.lineWidth = isDragTarget ? 3 * z : 2.2 * z;
      ctx.globalAlpha = isDragTarget ? 0.9 : 0.6;
      ctx.beginPath();
      ctx.arc(x, y, 24 * z, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Army count circle
    const circleRadius = 18 * z;
    ctx.save();

    const baseFill = isPlayerOwned ? 'rgba(34, 211, 238, 0.3)' : 'rgba(248, 113, 113, 0.3)';
    ctx.fillStyle = isDragTarget
      ? 'rgba(250, 204, 21, 0.35)'
      : isHovered
      ? 'rgba(103, 232, 249, 0.28)'
      : baseFill;
    ctx.beginPath();
    ctx.arc(x, y, circleRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = baseColor;
    ctx.lineWidth = 2 * z;
    ctx.beginPath();
    ctx.arc(x, y, circleRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.shadowColor = glowColor;
    ctx.shadowBlur = isSelected || isHovered || isDragTarget ? 22 : 10;
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 1.5 * z;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(x, y, circleRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();

    // Army count number
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${Math.round(20 * z)}px monospace`;
    ctx.fillStyle = isPlayerOwned ? '#e0f2fe' : '#fee2e2';
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 6;
    ctx.fillText(territory.armies.toString(), x, y);
    ctx.restore();

    // Territory name
    const nameY = y + circleRadius + 12 * z;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = `${Math.round(9 * z)}px monospace`;
    
    const nameWidth = ctx.measureText(territory.name).width + 8 * z;
    const nameHeight = 14 * z;
    ctx.fillStyle = isPlayerOwned ? 'rgba(23, 37, 84, 0.9)' : 'rgba(69, 10, 10, 0.9)';
    ctx.fillRect(x - nameWidth / 2, nameY - 10 * z, nameWidth, nameHeight);
    
    ctx.fillStyle = isPlayerOwned ? '#67e8f9' : '#fca5a5';
    ctx.fillText(territory.name, x, nameY - 3 * z);
    ctx.restore();

    // Strategic value
    if (territory.strategicValue > 3) {
      ctx.save();
      ctx.font = `${Math.round(14 * z)}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('⭐', x, y - circleRadius - 8 * z);
      ctx.restore();
    }
  });
}
