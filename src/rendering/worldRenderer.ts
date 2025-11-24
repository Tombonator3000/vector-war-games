/**
 * World Map Rendering Functions
 *
 * Functions for rendering the world map, nations, and geographic features.
 * Extracted from Index.tsx as part of refactoring effort.
 */

import type { Feature, MultiPolygon, Polygon } from 'geojson';
import type { MapMode, MapModeOverlayData, MapVisualStyle } from '@/components/GlobeScene';
import type { ProjectedPoint } from '@/lib/renderingUtils';
import type { Nation, GameState } from '@/types/game';
import { MathUtils } from 'three';
import {
  computeDiplomaticColor,
  computeIntelColor,
  computePandemicColor,
  computeResourceColor,
  computeUnrestColor,
  colorToRgba,
} from '@/lib/mapColorUtils';

type PolygonFeature = Feature<Polygon | MultiPolygon> & { properties?: { name?: string } };

const featureLabelAnchorCache = new WeakMap<object, { lon: number; lat: number }>();

function computeRingCentroid(ring: number[][]): { lon: number; lat: number; area: number } | null {
  if (!Array.isArray(ring) || ring.length < 3) {
    return null;
  }

  let twiceArea = 0;
  let centroidX = 0;
  let centroidY = 0;

  for (let i = 0; i < ring.length; i += 1) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    if (!Number.isFinite(x1) || !Number.isFinite(y1) || !Number.isFinite(x2) || !Number.isFinite(y2)) {
      continue;
    }
    const cross = x1 * y2 - x2 * y1;
    twiceArea += cross;
    centroidX += (x1 + x2) * cross;
    centroidY += (y1 + y2) * cross;
  }

  if (Math.abs(twiceArea) < 1e-9) {
    const validPoints = ring.filter(point => Number.isFinite(point?.[0]) && Number.isFinite(point?.[1]));
    if (!validPoints.length) {
      return null;
    }
    const sum = validPoints.reduce(
      (acc, [lon, lat]) => {
        return { lon: acc.lon + lon, lat: acc.lat + lat };
      },
      { lon: 0, lat: 0 }
    );
    const count = validPoints.length;
    return { lon: sum.lon / count, lat: sum.lat / count, area: 0 };
  }

  const area = twiceArea / 2;
  const lon = centroidX / (3 * twiceArea);
  const lat = centroidY / (3 * twiceArea);
  return { lon, lat, area };
}

function computePolygonCentroid(polygon: number[][][]): { lon: number; lat: number; area: number } | null {
  if (!Array.isArray(polygon) || polygon.length === 0) {
    return null;
  }

  let areaSum = 0;
  let lonSum = 0;
  let latSum = 0;

  for (const ring of polygon) {
    const ringCentroid = computeRingCentroid(ring);
    if (!ringCentroid) continue;
    lonSum += ringCentroid.lon * ringCentroid.area;
    latSum += ringCentroid.lat * ringCentroid.area;
    areaSum += ringCentroid.area;
  }

  if (Math.abs(areaSum) < 1e-9) {
    return null;
  }

  return { lon: lonSum / areaSum, lat: latSum / areaSum, area: areaSum };
}

function computePolygonAverage(polygon: number[][][]): { lon: number; lat: number } | null {
  if (!Array.isArray(polygon) || polygon.length === 0) {
    return null;
  }
  const points = polygon[0];
  if (!Array.isArray(points) || points.length === 0) {
    return null;
  }

  const validPoints = points.filter(point => Number.isFinite(point?.[0]) && Number.isFinite(point?.[1]));
  if (!validPoints.length) {
    return null;
  }

  const sum = validPoints.reduce(
    (acc, [lon, lat]) => ({ lon: acc.lon + lon, lat: acc.lat + lat }),
    { lon: 0, lat: 0 }
  );

  return { lon: sum.lon / validPoints.length, lat: sum.lat / validPoints.length };
}

export function computeFeatureLabelAnchor(feature: PolygonFeature | null | undefined): { lon: number; lat: number } | null {
  if (!feature || typeof feature !== 'object') {
    return null;
  }

  const { geometry } = feature;
  if (!geometry) {
    return null;
  }

  const accumulator = { lon: 0, lat: 0, weight: 0 };

  const accumulate = (polygon: number[][][]) => {
    const centroid = computePolygonCentroid(polygon);
    if (centroid && Number.isFinite(centroid.lon) && Number.isFinite(centroid.lat) && Math.abs(centroid.area) > 0) {
      const weight = Math.abs(centroid.area);
      accumulator.lon += centroid.lon * weight;
      accumulator.lat += centroid.lat * weight;
      accumulator.weight += weight;
      return;
    }
    const fallback = computePolygonAverage(polygon);
    if (fallback) {
      accumulator.lon += fallback.lon;
      accumulator.lat += fallback.lat;
      accumulator.weight += 1;
    }
  };

  if (geometry.type === 'Polygon') {
    accumulate(geometry.coordinates);
  } else if (geometry.type === 'MultiPolygon') {
    for (const polygon of geometry.coordinates) {
      accumulate(polygon);
    }
  } else {
    return null;
  }

  if (accumulator.weight <= 0) {
    return null;
  }

  return { lon: accumulator.lon / accumulator.weight, lat: accumulator.lat / accumulator.weight };
}

function getFeatureLabelAnchor(feature: PolygonFeature): { lon: number; lat: number } | null {
  const cached = featureLabelAnchorCache.get(feature as object);
  if (cached) {
    return cached;
  }

  const computed = computeFeatureLabelAnchor(feature);
  if (computed) {
    featureLabelAnchorCache.set(feature as object, computed);
  }
  return computed;
}

function computeProjectedFeatureSize(
  feature: PolygonFeature,
  projectLocal: (lon: number, lat: number) => ProjectedPoint
): number {
  const geometry = feature.geometry;
  if (!geometry) {
    return 0;
  }

  const updateBounds = (ring: number[][], bounds: { minX: number; maxX: number; minY: number; maxY: number }) => {
    for (const coord of ring) {
      if (!Array.isArray(coord) || coord.length < 2) continue;
      const { x, y, visible } = projectLocal(coord[0], coord[1]);
      if (!visible || Number.isNaN(x) || Number.isNaN(y)) continue;
      bounds.minX = Math.min(bounds.minX, x);
      bounds.maxX = Math.max(bounds.maxX, x);
      bounds.minY = Math.min(bounds.minY, y);
      bounds.maxY = Math.max(bounds.maxY, y);
    }
  };

  const bounds = { minX: Number.POSITIVE_INFINITY, maxX: Number.NEGATIVE_INFINITY, minY: Number.POSITIVE_INFINITY, maxY: Number.NEGATIVE_INFINITY };

  const processPolygon = (polygon: number[][][]) => {
    if (!Array.isArray(polygon) || polygon.length === 0) return;
    updateBounds(polygon[0], bounds);
  };

  if (geometry.type === 'Polygon') {
    processPolygon(geometry.coordinates);
  } else if (geometry.type === 'MultiPolygon') {
    for (const polygon of geometry.coordinates) {
      processPolygon(polygon);
    }
  }

  if (!Number.isFinite(bounds.minX) || !Number.isFinite(bounds.maxX) || !Number.isFinite(bounds.minY) || !Number.isFinite(bounds.maxY)) {
    return 0;
  }

  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  return Math.max(width, height);
}

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
    case 'pandemic': {
      const infections = Object.values(modeData.pandemic?.infections ?? {})
        .filter(value => Number.isFinite(value))
        .map(value => Number(value));
      if (!infections.length) return null;
      const max = Math.max(0, ...infections);
      if (max <= 0) return null;
      const normalized = infections.reduce((sum, value) => sum + value, 0) / (infections.length * max || 1);
      return colorToRgba(computePandemicColor(normalized || 0), 0.26);
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

  // In wireframe mode, don't draw on 2D overlay - the 3D wireframe handles visualization
  if (isWireframe) {
    return;
  }

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

      // Draw world borders using topojson after texture
      const drawWorldBorders = () => {
        if (!worldCountries || typeof worldCountries !== 'object') return;
        
        ctx.save();
        // High-contrast neon-style borders for flat realistic map
        ctx.strokeStyle = 'rgba(120, 255, 180, 0.75)';
        ctx.lineWidth = 1.4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        const features = (worldCountries as any).features;
        if (!Array.isArray(features)) return;
        
        for (const feature of features) {
          if (!feature.geometry) continue;
          
          const drawGeometry = (geometry: any) => {
            if (geometry.type === 'Polygon') {
              for (const ring of geometry.coordinates) {
                ctx.beginPath();
                drawWorldPath(ring, ctx, projectLocal);
                ctx.stroke();
              }
            } else if (geometry.type === 'MultiPolygon') {
              for (const polygon of geometry.coordinates) {
                for (const ring of polygon) {
                  ctx.beginPath();
                  drawWorldPath(ring, ctx, projectLocal);
                  ctx.stroke();
                }
              }
            }
          };
          
          if (feature.geometry.type === 'GeometryCollection') {
            for (const geom of feature.geometry.geometries) {
              drawGeometry(geom);
            }
          } else {
            drawGeometry(feature.geometry);
          }
        }
        
        ctx.restore();
      };

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

      // Draw country borders on top of the texture
      drawWorldBorders();

      ctx.restore();
      
      // Return early - we don't want to draw landmasses over the texture
      return;
    }
  }

  if (worldCountries) {
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineWidth = isWireframe ? 1.5 : (isFlatRealistic ? 1.5 : 1);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const overlayFill = !isWireframe && isFlatRealistic ? resolveOverlayFillColor(mapMode, modeData ?? null) : null;
    const baseFill = palette.mapFill;

    const features = ((worldCountries as { features?: PolygonFeature[] })?.features ?? []) as PolygonFeature[];

    features.forEach(feature => {
      ctx.beginPath();
      const geometry = feature.geometry as Polygon | MultiPolygon | undefined;
      if (!geometry) return;

      if (geometry.type === 'Polygon') {
        const coords = geometry.coordinates;
        drawWorldPath(coords[0], ctx, projectLocal);
      } else if (geometry.type === 'MultiPolygon') {
        geometry.coordinates.forEach(poly => {
          if (Array.isArray(poly) && poly[0]) {
            drawWorldPath(poly[0], ctx, projectLocal);
          }
        });
      }
      if (isWireframe) {
        ctx.strokeStyle = 'rgba(80,240,255,0.75)';
      } else if (isFlatRealistic) {
        // Strong, glowing-style borders for flat realistic texture
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.strokeStyle = 'rgba(120, 255, 180, 0.9)';
        ctx.lineWidth = 1.6;
      } else {
        ctx.strokeStyle = palette.mapOutline;
      }

      if (!isWireframe && baseFill) {
        ctx.fillStyle = overlayFill ?? baseFill;
        ctx.fill('evenodd');
      }

      ctx.stroke();
    });

    const MIN_LABEL_ZOOM = 1.1;
    const MIN_FEATURE_SIZE_PX = 28;
    const SMALL_FEATURE_ZOOM = 2.05;

    if (!isWireframe && cam.zoom >= MIN_LABEL_ZOOM && features.length > 0) {
      ctx.save();
      const fontSize = Math.min(26, 12 + (cam.zoom - 1) * 5);
      ctx.font = `600 ${fontSize}px "Rajdhani", "Segoe UI", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2.5;
      ctx.lineWidth = Math.max(2, fontSize * 0.18);

      const baseLabelColor = style === 'flat-realistic' ? 'rgba(244, 250, 255, 0.92)' : (palette.mapOutline || 'rgba(200, 240, 255, 0.9)');
      const outlineColor = style === 'flat-realistic' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(6, 14, 24, 0.6)';

      ctx.fillStyle = baseLabelColor;
      ctx.strokeStyle = outlineColor;

      for (const feature of features) {
        if (!feature?.geometry || (feature.geometry.type !== 'Polygon' && feature.geometry.type !== 'MultiPolygon')) {
          continue;
        }
        const name = feature.properties?.name;
        if (!name) continue;

        const anchor = getFeatureLabelAnchor(feature);
        if (!anchor) continue;

        const projectedSize = computeProjectedFeatureSize(feature, projectLocal);
        if (projectedSize <= 0) {
          continue;
        }
        if (projectedSize < MIN_FEATURE_SIZE_PX && cam.zoom < SMALL_FEATURE_ZOOM) {
          continue;
        }

        const { x, y, visible } = projectLocal(anchor.lon, anchor.lat);
        if (!visible || Number.isNaN(x) || Number.isNaN(y)) {
          continue;
        }

        ctx.save();
        ctx.translate(x, y);
        ctx.strokeText(name, 0, 0);
        ctx.fillText(name, 0, 0);
        ctx.restore();
      }

      ctx.restore();
    }

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
  const pandemicValues = modeData?.pandemic ? Object.values(modeData.pandemic.infections ?? {}) : [];

  const maxIntelLevel = intelValues.length
    ? Math.max(1, ...intelValues.map(value => (Number.isFinite(value) ? Number(value) : 0)))
    : 1;
  const maxResourceTotal = resourceValues.length
    ? Math.max(1, ...resourceValues.map(value => (Number.isFinite(value) ? Number(value) : 0)))
    : 1;
  const maxPandemicInfection = pandemicValues.length
    ? Math.max(1, ...pandemicValues.map(value => (Number.isFinite(value) ? Number(value) : 0)))
    : 1;

  nations.forEach(n => {
    if (n.population <= 0) return;

    const { x, y, visible } = projectLocal(n.lon, n.lat);
    if (!visible || Number.isNaN(x) || Number.isNaN(y)) return;

    let overlayColor: string | null = null;
    let overlayScale = 0;
    let overlayOpacity = 0;
    let normalizedPandemicForMarker = 0;

    // Modes with dedicated SVG overlay components should not draw on canvas to avoid layer stacking
    const modesWithSVGOverlays = ['unrest', 'pandemic', 'radiation', 'migration'];
    const shouldDrawCanvasOverlay = overlayEnabled && !modesWithSVGOverlays.includes(currentMode);

    if (shouldDrawCanvasOverlay) {
      const overlayKey = n.id;
      const pandemicData = modeData?.pandemic;
      const pandemicInfection = pandemicData?.infections?.[overlayKey] ?? 0;
      const normalizedPandemic = pandemicInfection > 0 ? pandemicInfection / (maxPandemicInfection || 1) : 0;
      const heatValue = pandemicData?.heat?.[overlayKey] ?? pandemicInfection;
      const normalizedHeat = heatValue > 0 ? Math.min(1, Math.max(0, heatValue / 100)) : normalizedPandemic;
      normalizedPandemicForMarker = normalizedPandemic;

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

    const baseColor = typeof n.color === 'string' ? n.color : '#ff6b6b';
    // Only apply overlay colors to markers if using canvas overlays (not SVG overlays)
    const pandemicMarkerColor = currentMode === 'pandemic' && !n.isPlayer && normalizedPandemicForMarker > 0 && shouldDrawCanvasOverlay
      ? computePandemicColor(normalizedPandemicForMarker)
      : null;
    let markerColor = baseColor;
    if (n.isPlayer) {
      markerColor = '#7cff6b';
    } else if (pandemicMarkerColor) {
      markerColor = pandemicMarkerColor;
    } else if (currentMode !== 'standard' && shouldDrawCanvasOverlay && overlayColor) {
      markerColor = overlayColor;
    }

    const isSelectedTarget = selectedTargetRefId === n.id;
    if (isSelectedTarget) {
      const pulse = (Math.sin(Date.now() / 200) + 1) / 2;
      const baseRadius = 42;
      const radius = baseRadius + pulse * 10;

      ctx.save();
      const targetColor = isWireframeStyle ? '#4ef6ff' : markerColor;
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
    ctx.strokeStyle = markerColor;
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
      ctx.fillStyle = markerColor;
      ctx.shadowColor = markerColor;
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
          ctx.strokeStyle = markerColor;
          ctx.globalAlpha = 0.6;
          ctx.strokeRect(cx - 5, cy - 5, 10, 10);
        } else {
          ctx.fillStyle = markerColor;
          ctx.globalAlpha = 0.3;
          ctx.fillRect(cx - 6, cy - 6, 12, 12);
        }
      }
      ctx.restore();
    }

    const z = Math.max(0.9, Math.min(1.6, cam.zoom));
    const pad = 4 * z;

    // Fade nation labels in once we zoom past the style-specific clarity threshold
    const labelVisibilityThreshold = style === 'flat-realistic' ? 0.4 : 0.5;
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
        : 'rgba(0,0,0,0.45)';

      ctx.save();
      ctx.globalAlpha = labelVisibility;
      ctx.fillStyle = frameFill;
      ctx.fillRect(lx - bw / 2, lyTop, bw, bh);
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = labelVisibility * (isWireframeStyle ? 0.65 : 0.4);
      ctx.strokeStyle = isWireframeStyle ? '#4ef6ff' : markerColor;
      ctx.strokeRect(lx - bw / 2, lyTop, bw, bh);
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = labelVisibility;
      ctx.font = `bold ${Math.round(12 * z)}px monospace`;
      ctx.fillStyle = isWireframeStyle ? '#4ef6ff' : markerColor;
      ctx.shadowColor = markerColor;
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
            if (currentMode === 'pandemic' && !n.isPlayer && normalizedPandemicForMarker > 0) {
              return 'rgba(248, 113, 113, 0.9)';
            }
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
