import { useMemo } from 'react';
import { Users } from 'lucide-react';
import { Color } from 'three';
import type { Feature, FeatureCollection, MultiPolygon, Polygon, Position } from 'geojson';
import type { MapModeOverlayData, ProjectorFn } from '@/components/GlobeScene';

const flowFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const MIGRATION_INBOUND_START = new Color('#0ea5e9'); // Cyan-blue
const MIGRATION_INBOUND_END = new Color('#34d399'); // Emerald
const MIGRATION_OUTBOUND_START = new Color('#f97316'); // Orange
const MIGRATION_OUTBOUND_END = new Color('#dc2626'); // Red

const ZERO_COLOR = new Color('#94a3b8');

type MigrationOverlay = NonNullable<MapModeOverlayData['migration']>;
type CountryFeature = Feature<Polygon | MultiPolygon>;
type FeatureLookup = Map<string, CountryFeature>;

type ProjectedPoint2D = { x: number; y: number };

type BoundingBox = { minX: number; minY: number; maxX: number; maxY: number };

type TerritoryFill = {
  id: string;
  name: string;
  net: number;
  inflow: number;
  outflow: number;
  attraction: number;
  pressure: number;
  intensity: number;
  color: string;
  strokeColor: string;
  fillOpacity: number;
  labelPosition: ProjectedPoint2D | null;
  bounds: BoundingBox;
  paths: string[];
};

type MigrationFallbackPoint = {
  id: string;
  name: string;
  centerX: number;
  centerY: number;
  net: number;
  inflow: number;
  outflow: number;
  attraction: number;
  pressure: number;
  color: string;
  strokeColor: string;
  baseRadius: number;
  glowRadius: number;
  fillOpacity: number;
};

interface MigrationFlowOverlayProps {
  nations: Array<{ id: string; name: string; lon: number; lat: number }>;
  canvasWidth: number;
  canvasHeight: number;
  visible: boolean;
  migration: MigrationOverlay;
  projector?: ProjectorFn | null;
  projectorRevision?: number;
  countryFeatureLookup?: FeatureLookup | null;
  worldCountryFeatures?: FeatureCollection<Polygon | MultiPolygon> | null;
}

function normalizeKey(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const raw = String(value).trim();
  if (!raw) {
    return null;
  }
  const normalized = raw.toLowerCase().replace(/[^a-z0-9]+/g, '');
  return normalized || null;
}

function registerFeatureKey(map: FeatureLookup, feature: CountryFeature, value: unknown) {
  const key = normalizeKey(value);
  if (!key || map.has(key)) {
    return;
  }
  map.set(key, feature);
}

function buildFeatureLookupFromCollection(
  collection: FeatureCollection<Polygon | MultiPolygon> | null | undefined,
): FeatureLookup | null {
  if (!collection || !Array.isArray(collection.features)) {
    return null;
  }
  const lookup = new Map<string, CountryFeature>();
  for (const feature of collection.features as CountryFeature[]) {
    if (!feature) {
      continue;
    }
    registerFeatureKey(lookup, feature, feature.id);
    const properties = feature.properties as Record<string, unknown> | undefined;
    if (!properties) {
      continue;
    }
    for (const value of Object.values(properties)) {
      registerFeatureKey(lookup, feature, value);
    }
  }
  return lookup.size > 0 ? lookup : null;
}

function findFeatureForNation(
  nationId: string,
  nationName: string,
  lookup: FeatureLookup | null,
): CountryFeature | null {
  if (!lookup?.size) {
    return null;
  }
  const candidates: Array<string | null> = [
    nationId,
    nationName,
    nationId ? `superstate:${nationId}` : null,
    nationName ? `superstate:${nationName}` : null,
  ];

  for (const candidate of candidates) {
    const key = normalizeKey(candidate);
    if (key && lookup.has(key)) {
      return lookup.get(key)!;
    }
  }
  return null;
}

function mergeBounds(current: BoundingBox | null, incoming: BoundingBox): BoundingBox {
  if (!current) {
    return { ...incoming };
  }
  return {
    minX: Math.min(current.minX, incoming.minX),
    minY: Math.min(current.minY, incoming.minY),
    maxX: Math.max(current.maxX, incoming.maxX),
    maxY: Math.max(current.maxY, incoming.maxY),
  };
}

function projectRing(
  ring: Position[],
  projectPoint: (lon: number, lat: number) => ProjectedPoint2D | null,
): { path: string; bounds: BoundingBox } | null {
  const points: ProjectedPoint2D[] = [];
  for (const coordinate of ring) {
    if (!Array.isArray(coordinate) || coordinate.length < 2) {
      continue;
    }
    const [lonRaw, latRaw] = coordinate;
    const lon = Number(lonRaw);
    const lat = Number(latRaw);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
      continue;
    }
    const point = projectPoint(lon, lat);
    if (!point) {
      continue;
    }
    points.push(point);
  }

  if (!points.length) {
    return null;
  }

  const commands: string[] = [];
  let minX = points[0].x;
  let minY = points[0].y;
  let maxX = points[0].x;
  let maxY = points[0].y;

  points.forEach((point, index) => {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
    commands.push(`${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`);
  });

  commands.push('Z');

  return {
    path: commands.join(' '),
    bounds: { minX, minY, maxX, maxY },
  };
}

function projectFeatureGeometry(
  feature: CountryFeature,
  projectPoint: (lon: number, lat: number) => ProjectedPoint2D | null,
): { paths: string[]; bounds: BoundingBox } | null {
  const geometry = feature.geometry;
  if (!geometry) {
    return null;
  }

  const polygons =
    geometry.type === 'Polygon'
      ? [geometry.coordinates]
      : geometry.type === 'MultiPolygon'
        ? geometry.coordinates
        : [];

  if (!polygons.length) {
    return null;
  }

  const paths: string[] = [];
  let bounds: BoundingBox | null = null;

  for (const rings of polygons) {
    if (!Array.isArray(rings) || !rings.length) {
      continue;
    }

    const outer = projectRing(rings[0], projectPoint);
    if (!outer) {
      continue;
    }

    paths.push(outer.path);
    bounds = mergeBounds(bounds, outer.bounds);

    for (let i = 1; i < rings.length; i += 1) {
      const hole = projectRing(rings[i], projectPoint);
      if (!hole) {
        continue;
      }
      paths.push(hole.path);
      bounds = mergeBounds(bounds, hole.bounds);
    }
  }

  if (!paths.length || !bounds) {
    return null;
  }

  return { paths, bounds };
}

function computeMigrationColor(netValue: number, maxMagnitude: number): { fill: string; stroke: string } {
  if (!Number.isFinite(netValue)) {
    return { fill: ZERO_COLOR.getStyle(), stroke: ZERO_COLOR.getStyle() };
  }

  const magnitude = Math.abs(netValue);
  const denom = Math.max(maxMagnitude, 1e-3);
  const t = Math.min(1, magnitude / denom);

  if (netValue > 0) {
    const fill = MIGRATION_INBOUND_START.clone().lerp(MIGRATION_INBOUND_END, t).getStyle();
    const stroke = MIGRATION_INBOUND_END.clone().lerp(MIGRATION_INBOUND_START, 0.3).getStyle();
    return { fill, stroke };
  }

  if (netValue < 0) {
    const fill = MIGRATION_OUTBOUND_START.clone().lerp(MIGRATION_OUTBOUND_END, t).getStyle();
    const stroke = MIGRATION_OUTBOUND_END.clone().lerp(MIGRATION_OUTBOUND_START, 0.25).getStyle();
    return { fill, stroke };
  }

  const neutral = ZERO_COLOR.getStyle();
  return { fill: neutral, stroke: neutral };
}

function formatFlow(value: number): string {
  if (!Number.isFinite(value)) {
    return '0';
  }
  const formatted = flowFormatter.format(Math.abs(value));
  return `${value >= 0 ? '' : '-'}${formatted}M`;
}

function formatNet(value: number): string {
  if (!Number.isFinite(value) || Math.abs(value) < 0.05) {
    return '±0M';
  }
  const formatted = flowFormatter.format(Math.abs(value));
  return `${value >= 0 ? '+' : '−'}${formatted}M`;
}

export function MigrationFlowOverlay({
  nations,
  canvasWidth,
  canvasHeight,
  visible,
  migration,
  projector,
  projectorRevision,
  countryFeatureLookup,
  worldCountryFeatures,
}: MigrationFlowOverlayProps) {
  const geometryLookup = useMemo<FeatureLookup | null>(() => {
    if (countryFeatureLookup && countryFeatureLookup.size > 0) {
      return countryFeatureLookup;
    }
    return buildFeatureLookupFromCollection(worldCountryFeatures);
  }, [countryFeatureLookup, worldCountryFeatures]);

  const { territories, fallbackPoints } = useMemo(() => {
    if (!visible) {
      return { territories: [] as TerritoryFill[], fallbackPoints: [] as MigrationFallbackPoint[] };
    }

    let maxNetMagnitude = 0;
    let maxFlowMagnitude = 0;

    nations.forEach(nation => {
      const netValue = Math.abs(Number(migration.net[nation.id] ?? 0));
      if (Number.isFinite(netValue)) {
        maxNetMagnitude = Math.max(maxNetMagnitude, netValue);
      }
      const flowValue = Math.max(
        Math.abs(Number(migration.inflow[nation.id] ?? 0)),
        Math.abs(Number(migration.outflow[nation.id] ?? 0)),
      );
      if (Number.isFinite(flowValue)) {
        maxFlowMagnitude = Math.max(maxFlowMagnitude, flowValue);
      }
    });

    if (maxNetMagnitude <= 0 && maxFlowMagnitude <= 0) {
      return { territories: [] as TerritoryFill[], fallbackPoints: [] as MigrationFallbackPoint[] };
    }

    const projectPoint = (lon: number, lat: number): ProjectedPoint2D | null => {
      if (projector) {
        const projected = projector(lon, lat);
        if (!projected.visible) {
          return null;
        }
        return { x: projected.x, y: projected.y };
      }
      const x = ((lon + 180) / 360) * canvasWidth;
      const y = ((90 - lat) / 180) * canvasHeight;
      return { x, y };
    };

    const territories: TerritoryFill[] = [];
    const fallbackPoints: MigrationFallbackPoint[] = [];

    nations.forEach(nation => {
      const inflow = Number(migration.inflow[nation.id] ?? 0);
      const outflow = Number(migration.outflow[nation.id] ?? 0);
      const net = Number(migration.net[nation.id] ?? inflow - outflow);
      const attraction = Math.max(0, Math.min(100, migration.attraction[nation.id] ?? 0));
      const pressure = Math.max(0, Math.min(100, migration.pressure[nation.id] ?? 0));

      if (
        !Number.isFinite(inflow) &&
        !Number.isFinite(outflow) &&
        (!Number.isFinite(net) || Math.abs(net) < 0.01)
      ) {
        return;
      }

      const intensity = maxFlowMagnitude > 0
        ? Math.min(1, Math.max(Math.abs(inflow), Math.abs(outflow)) / maxFlowMagnitude)
        : Math.min(1, Math.abs(net) / Math.max(maxNetMagnitude, 1));

      const colorBasis = maxNetMagnitude > 0 ? net : inflow - outflow;
      const { fill: color, stroke: strokeColor } = computeMigrationColor(
        colorBasis,
        maxNetMagnitude > 0 ? maxNetMagnitude : Math.max(maxFlowMagnitude, 1),
      );
      const fillOpacity = 0.2 + intensity * 0.5;

      const center = projectPoint(nation.lon, nation.lat);
      // Territory fills are disabled due to projection issues when viewing the globe.
      // Points on the back of the globe are skipped, causing polygons to render incorrectly
      // as large rectangles or diagonal lines instead of proper country boundaries.
      // We now always use fallback point markers instead.
      if (center) {
        const baseRadius = 8 + intensity * 24;
        const glowRadius = baseRadius * 1.65;
        fallbackPoints.push({
          id: nation.id,
          name: nation.name,
          centerX: center.x,
          centerY: center.y,
          net,
          inflow,
          outflow,
          attraction,
          pressure,
          color,
          strokeColor,
          baseRadius,
          glowRadius,
          fillOpacity,
        });
      }
    });

    return { territories, fallbackPoints };
  }, [
    canvasWidth,
    canvasHeight,
    geometryLookup,
    migration.attraction,
    migration.inflow,
    migration.net,
    migration.outflow,
    migration.pressure,
    nations,
    projector,
    projectorRevision,
    visible,
  ]);

  if (!visible) {
    return null;
  }

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={canvasWidth}
      height={canvasHeight}
      style={{ zIndex: 15 }}
    >
      {/* Territory fills are disabled - using fallback points only */}

      {fallbackPoints.map(point => (
        <g key={point.id}>
          <circle
            cx={point.centerX}
            cy={point.centerY}
            r={point.glowRadius}
            fill={point.color}
            opacity={point.fillOpacity * 0.35}
          />
          <circle
            cx={point.centerX}
            cy={point.centerY}
            r={point.baseRadius}
            fill={point.color}
            opacity={point.fillOpacity}
            stroke={point.strokeColor}
            strokeWidth={1}
            strokeOpacity={0.6}
          />
          <g transform={`translate(${point.centerX}, ${point.centerY - point.baseRadius - 6})`}>
            <rect
              x={-62}
              y={-28}
              width={124}
              height={54}
              rx={6}
              fill="rgba(15,23,42,0.78)"
              stroke={point.strokeColor}
              strokeOpacity={0.55}
            />
            <text
              x={0}
              y={-10}
              textAnchor="middle"
              className="text-xs font-semibold fill-cyan-100"
              style={{ fontSize: '11px' }}
            >
              {point.name}
            </text>
            <text
              x={0}
              y={4}
              textAnchor="middle"
              className="text-[10px] fill-cyan-200"
              style={{ fontSize: '10px' }}
            >
              Net {formatNet(point.net)}
            </text>
            <text
              x={0}
              y={18}
              textAnchor="middle"
              className="text-[10px] fill-cyan-200"
              style={{ fontSize: '10px' }}
            >
              In {formatFlow(point.inflow)} | Out {formatFlow(point.outflow)}
            </text>
            <text
              x={0}
              y={32}
              textAnchor="middle"
              className="text-[10px] fill-cyan-300"
              style={{ fontSize: '10px' }}
            >
              Attr {Math.round(point.attraction)}% • Pressure {Math.round(point.pressure)}%
            </text>
          </g>
        </g>
      ))}

      <Legend canvasWidth={canvasWidth} />
    </svg>
  );
}

interface LegendProps {
  canvasWidth: number;
}

function Legend({ canvasWidth }: LegendProps) {
  const width = 190;
  const height = 110;
  const margin = 20;

  return (
    <g transform={`translate(${canvasWidth - width - margin}, ${margin})`}>
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        rx={8}
        fill="rgba(8, 15, 30, 0.85)"
        stroke="rgba(34, 211, 238, 0.35)"
      />
      <g transform="translate(12, 16)">
        <Users className="h-4 w-4 text-cyan-300" />
        <text
          x={26}
          y={4}
          className="text-xs font-semibold fill-cyan-200"
          style={{ fontSize: '12px' }}
        >
          Migration Flows
        </text>
      </g>
      <LegendRow y={40} color={MIGRATION_INBOUND_END.getStyle()} label="Inbound migration (net gain)" />
      <LegendRow y={60} color={MIGRATION_OUTBOUND_END.getStyle()} label="Outbound refugees (net loss)" />
      <LegendRow y={80} color={ZERO_COLOR.getStyle()} label="Balanced / neutral flow" />
      <text
        x={12}
        y={height - 12}
        className="text-[10px] fill-cyan-300"
        style={{ fontSize: '10px' }}
      >
        Attr = attraction capacity • Pressure = refugee strain
      </text>
    </g>
  );
}

interface LegendRowProps {
  y: number;
  color: string;
  label: string;
}

function LegendRow({ y, color, label }: LegendRowProps) {
  return (
    <g transform={`translate(12, ${y})`}>
      <rect x={0} y={-8} width={18} height={18} rx={4} fill={color} opacity={0.7} />
      <text
        x={28}
        y={5}
        className="text-[11px] fill-cyan-100"
        style={{ fontSize: '11px' }}
      >
        {label}
      </text>
    </g>
  );
}
