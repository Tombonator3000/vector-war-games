/**
 * World Map Rendering Functions
 *
 * Functions for rendering the world map, nations, and geographic features.
 * Extracted from Index.tsx as part of refactoring effort.
 */

import type { MapMode, MapModeOverlayData, MapVisualStyle } from '@/components/GlobeScene';
import type { ProjectedPoint } from '@/lib/renderingUtils';
import type { Nation, GameState } from '@/types/game';
import { MathUtils } from 'three';
import {
  computeDiplomaticColor,
  computeIntelColor,
  computeResourceColor,
  computeUnrestColor,
  colorToRgba,
} from '@/lib/mapColorUtils';

export interface ThemePalette {
  mapOutline: string;
  grid: string;
  radar: string;
  ocean: string;
  cloud: string;
  mapFill: string;
  mapFillWireframe?: string;
}

export interface WorldRenderContext {
  ctx: CanvasRenderingContext2D | null;
  worldCountries: unknown;
  W: number;
  H: number;
  cam: { x: number; y: number; zoom: number; targetZoom: number };
  currentTheme: string;
  themePalette: ThemePalette;
  flatRealisticDayTexture: HTMLImageElement | null;
  flatRealisticNightTexture: HTMLImageElement | null;
  flatRealisticBlend: number;
  THEME_SETTINGS: Record<string, ThemePalette>;
  projectLocal: (lon: number, lat: number) => ProjectedPoint;
  preloadFlatRealisticTexture: (isDay: boolean) => void;
  mapMode?: MapMode;
  modeData?: MapModeOverlayData | null;
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
  projectLocal: (lon: number, lat: number) => ProjectedPoint
): void {
  let started = false;
  for (const coord of coords) {
    const { x, y, visible } = projectLocal(coord[0], coord[1]);
    if (!visible || Number.isNaN(x) || Number.isNaN(y)) {
      started = false;
      continue;
    }
    if (!started) {
      ctx.moveTo(x, y);
      started = true;
    } else {
      ctx.lineTo(x, y);
    }
  }
}

function resolveOverlayFillColor(
  mapMode: MapMode | undefined,
  modeData: MapModeOverlayData | null | undefined
): string | null {
  if (!mapMode || mapMode === 'standard' || !modeData) {
    return null;
  }

  switch (mapMode) {
    case 'diplomatic': {
      const values = Object.values(modeData.relationships ?? {}).filter(value => Number.isFinite(value));
      if (!values.length) return null;
      const average = values.reduce((sum, value) => sum + value, 0) / values.length;
      return colorToRgba(computeDiplomaticColor(average), 0.28);
    }
    case 'intel': {
      const values = Object.values(modeData.intelLevels ?? {}).filter(value => Number.isFinite(value));
      if (!values.length) return null;
      const max = Math.max(0, ...values);
      if (max <= 0) return null;
      const normalized = values.reduce((sum, value) => sum + value, 0) / (values.length * max);
      return colorToRgba(computeIntelColor(normalized), 0.28);
    }
    case 'resources': {
      const values = Object.values(modeData.resourceTotals ?? {}).filter(value => Number.isFinite(value));
      if (!values.length) return null;
      const max = Math.max(0, ...values);
      if (max <= 0) return null;
      const normalized = values.reduce((sum, value) => sum + value, 0) / (values.length * max);
      return colorToRgba(computeResourceColor(normalized), 0.28);
    }
    case 'unrest': {
      const stabilityValues = Object.values(modeData.unrest ?? {})
        .map(metrics => {
          const morale = typeof metrics?.morale === 'number' ? metrics.morale : 0;
          const opinion = typeof metrics?.publicOpinion === 'number' ? metrics.publicOpinion : 0;
          const instability = typeof metrics?.instability === 'number' ? metrics.instability : 0;
          return (morale + opinion) / 2 - instability * 0.35;
        })
        .filter(value => Number.isFinite(value));
      if (!stabilityValues.length) return null;
      const average = stabilityValues.reduce((sum, value) => sum + value, 0) / stabilityValues.length;
      return colorToRgba(computeUnrestColor(average), 0.3);
    }
    default:
      return null;
  }
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
    themePalette,
    flatRealisticDayTexture,
    flatRealisticNightTexture,
    flatRealisticBlend,
    THEME_SETTINGS,
    projectLocal,
    preloadFlatRealisticTexture,
    mapMode,
    modeData,
  } = context;

  if (!ctx) return;

  const palette = themePalette ?? THEME_SETTINGS[currentTheme];

  const isWireframe = style === 'wireframe';
  const isFlatRealistic = style === 'flat-realistic';

  if (isFlatRealistic) {
    if (!flatRealisticDayTexture) {
      void preloadFlatRealisticTexture(true);
    }
    if (!flatRealisticNightTexture) {
      void preloadFlatRealisticTexture(false);
    }

    const hasDayTexture = Boolean(flatRealisticDayTexture);
    const hasNightTexture = Boolean(flatRealisticNightTexture);

    if (hasDayTexture || hasNightTexture) {
      const baseTexture = hasDayTexture ? flatRealisticDayTexture! : flatRealisticNightTexture!;
      const overlayTexture = hasDayTexture ? flatRealisticNightTexture : null;
      const blend = MathUtils.clamp(flatRealisticBlend, 0, 1);

      ctx.save();
      ctx.imageSmoothingEnabled = true;

      const drawTexture = (texture: HTMLImageElement, alpha = 1) => {
        if (alpha <= 0) return;
        const sourceWidth = texture.naturalWidth || texture.width || W;
        const sourceHeight = texture.naturalHeight || texture.height || H;
        const destWidth = W * cam.zoom;
        const destHeight = H * cam.zoom;
        if (alpha < 1) {
          ctx.globalAlpha = alpha;
        }
        ctx.drawImage(
          texture,
          0,
          0,
          sourceWidth,
          sourceHeight,
          cam.x,
          cam.y,
          destWidth,
          destHeight
        );
        if (alpha < 1) {
          ctx.globalAlpha = 1;
        }
      };

      drawTexture(baseTexture);

      if (overlayTexture && blend > 0) {
        drawTexture(overlayTexture, blend);
      } else if (!hasDayTexture && hasNightTexture) {
        // Already drew night texture as base; nothing else to overlay.
      }

      ctx.restore();
    }
  }

  if (worldCountries) {
    ctx.save();
    ctx.lineWidth = isWireframe ? 1.5 : 1;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const overlayFill = !isWireframe && isFlatRealistic ? resolveOverlayFillColor(mapMode, modeData ?? null) : null;
    const baseFill = palette.mapFill;

    (worldCountries as { features: { geometry: { type: string; coordinates: number[][][] } }[] }).features.forEach((feature, index: number) => {
      ctx.beginPath();
      const coords = feature.geometry.coordinates;

      if (feature.geometry.type === 'Polygon') {
        drawWorldPath(coords[0], ctx, projectLocal);
      } else if (feature.geometry.type === 'MultiPolygon') {
        coords.forEach((poly: number[][]) => drawWorldPath(poly[0], ctx, projectLocal));
      }
      if (isWireframe) {
        ctx.strokeStyle = 'rgba(80,240,255,0.75)';
      } else if (isFlatRealistic) {
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      } else {
        ctx.strokeStyle = palette.mapOutline;
      }

      if (!isWireframe && baseFill) {
        ctx.fillStyle = overlayFill ?? baseFill;
        ctx.fill('evenodd');
      }

      ctx.stroke();
    });

    ctx.restore();
  }

  const shouldDrawGrid = style !== 'realistic';
  if (shouldDrawGrid) {
    ctx.save();
    if (isWireframe) {
      ctx.strokeStyle = 'rgba(80,240,255,0.35)';
      ctx.lineWidth = 0.7;
    } else {
      ctx.strokeStyle = palette.grid;
      ctx.lineWidth = 0.5;
    }

    for (let lon = -180; lon <= 180; lon += 30) {
      ctx.beginPath();
      let started = false;
      for (let lat = -90; lat <= 90; lat += 5) {
        const { x, y, visible } = projectLocal(lon, lat);
        if (!visible || Number.isNaN(x) || Number.isNaN(y)) {
          started = false;
          continue;
        }
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      if (started) {
        ctx.stroke();
      }
    }

    for (let lat = -90; lat <= 90; lat += 30) {
      ctx.beginPath();
      let started = false;
      for (let lon = -180; lon <= 180; lon += 5) {
        const { x, y, visible } = projectLocal(lon, lat);
        if (!visible || Number.isNaN(x) || Number.isNaN(y)) {
          started = false;
          continue;
        }
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      if (started) {
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  if (style !== 'wireframe') {
    const scanY = (Date.now() / 30) % H;
    ctx.fillStyle = palette.radar;
    ctx.fillRect(0, scanY, W, 2);
  }
}

/**
 * Render nation markers, labels, and cities
 */
export function drawNations(style: MapVisualStyle, context: NationRenderContext): void {
  const {
    ctx,
    nations,
    S,
    cam,
    projectLocal,
    selectedTargetRefId,
    mapMode,
    modeData,
  } = context;

  if (!ctx || nations.length === 0) return;

  const isWireframeStyle = style === 'wireframe';
  const isFlatStyle = style === 'flat-realistic';

  const currentMode = mapMode ?? 'standard';
  const overlayEnabled = isFlatStyle && modeData && currentMode !== 'standard';
  const isPoliticalStyle = !isWireframeStyle && currentMode !== 'standard';

  const intelValues = modeData ? Object.values(modeData.intelLevels ?? {}) : [];
  const resourceValues = modeData ? Object.values(modeData.resourceTotals ?? {}) : [];

  const maxIntelLevel = intelValues.length
    ? Math.max(1, ...intelValues.map(value => (Number.isFinite(value) ? Number(value) : 0)))
    : 1;
  const maxResourceTotal = resourceValues.length
    ? Math.max(1, ...resourceValues.map(value => (Number.isFinite(value) ? Number(value) : 0)))
    : 1;

  nations.forEach(n => {
    if (n.population <= 0) return;

    const { x, y, visible } = projectLocal(n.lon, n.lat);
    if (!visible || Number.isNaN(x) || Number.isNaN(y)) return;

    if (overlayEnabled) {
      const overlayKey = n.id;
      let overlayColor: string | null = null;
      let overlayScale = 0;
      let overlayOpacity = 0;

      switch (currentMode) {
        case 'diplomatic': {
          if (modeData?.playerId && modeData.playerId !== overlayKey) {
            const score = modeData.relationships?.[overlayKey] ?? 0;
            overlayColor = computeDiplomaticColor(score);
            overlayScale = 0.22 + Math.abs(score) / 500;
            overlayOpacity = 0.4;
          }
          break;
        }
        case 'intel': {
          const intelValue = modeData?.intelLevels?.[overlayKey] ?? 0;
          if (intelValue > 0) {
            const normalized = intelValue / (maxIntelLevel || 1);
            overlayColor = computeIntelColor(normalized);
            overlayScale = 0.18 + normalized * 0.35;
            overlayOpacity = 0.45;
          }
          break;
        }
        case 'resources': {
          const total = modeData?.resourceTotals?.[overlayKey] ?? 0;
          if (total > 0) {
            const normalized = total / (maxResourceTotal || 1);
            overlayColor = computeResourceColor(normalized);
            overlayScale = 0.2 + normalized * 0.4;
            overlayOpacity = 0.42;
          }
          break;
        }
        case 'unrest': {
          const unrestMetrics = modeData?.unrest?.[overlayKey];
          if (unrestMetrics) {
            const stability = (unrestMetrics.morale + unrestMetrics.publicOpinion) / 2 - unrestMetrics.instability * 0.35;
            overlayColor = computeUnrestColor(stability);
            overlayScale = 0.24 + MathUtils.clamp((70 - stability) / 200, 0, 0.3);
            overlayOpacity = stability < 55 ? 0.5 : 0.35;
          }
          break;
        }
        default:
          break;
      }

      if (overlayColor && overlayScale > 0) {
        const overlayRadius = overlayScale * 180;
        const innerRadius = Math.max(overlayRadius * 0.35, 1);
        const gradient = ctx.createRadialGradient(x, y, innerRadius, x, y, overlayRadius);
        gradient.addColorStop(0, colorToRgba(overlayColor, overlayOpacity));
        gradient.addColorStop(0.7, colorToRgba(overlayColor, overlayOpacity * 0.4));
        gradient.addColorStop(1, colorToRgba(overlayColor, 0));

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, overlayRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

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
      ctx.shadowColor = n.color;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.moveTo(x, y - 20);
      ctx.lineTo(x - 15, y + 12);
      ctx.lineTo(x + 15, y + 12);
      ctx.closePath();
      ctx.stroke();
      ctx.globalAlpha = 0.3;
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
          ctx.globalAlpha = 0.3;
          ctx.fillRect(cx - 6, cy - 6, 12, 12);
        }
      }
      ctx.restore();
    }

    const z = Math.max(0.9, Math.min(1.6, cam.zoom));
    const pad = 4 * z;

    // FIXED: Always show labels regardless of zoom level
    // Previous threshold of 0.9 was causing labels to be invisible at default zoom
    const labelVisibilityThreshold = 0.3;
    const labelFadeRange = 0.15;
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
      ctx.shadowColor = n.color;
      ctx.shadowBlur = 6;
      ctx.fillText(displayName, lx, lyTop + pad + 12 * z);
      ctx.shadowBlur = 0;

      ctx.font = `${Math.round(11 * z)}px monospace`;
      const nationLabelColor = (() => {
        switch (style) {
          case 'wireframe':
            return '#4ef6ff';
          case 'flat-realistic':
            return isPoliticalStyle ? '#ffecd1' : '#ffffff';
          case 'realistic':
          default:
            return '#ffffff';
        }
      })();
      ctx.fillStyle = nationLabelColor;
      ctx.fillText(nationName, lx, lyTop + pad + 12 * z + 12 * z);
      ctx.restore();

      ctx.restore();

      // Population display
      ctx.save();
      ctx.globalAlpha = labelVisibility;
      const populationFillColor = (() => {
        switch (style) {
          case 'wireframe':
            return '#4ef6ff';
          case 'flat-realistic':
            return isPoliticalStyle ? '#ffd166' : '#00ff00';
          case 'realistic':
          default:
            return '#00ff00';
        }
      })();
      ctx.fillStyle = populationFillColor;
      ctx.font = `${Math.round(10 * z)}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.floor(n.population)}M`, x, y + 30 * z);
      ctx.restore();
    }
  });
}

// Color computation functions now imported from @/lib/mapColorUtils
// This eliminates duplication with GlobeScene.tsx

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
    const { x, y, visible } = projectLocal(territory.anchorLon, territory.anchorLat);
    if (!visible || Number.isNaN(x) || Number.isNaN(y)) return;

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
