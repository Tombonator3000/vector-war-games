import { useMemo } from 'react';
import { Biohazard } from 'lucide-react';
import type { Feature, FeatureCollection, MultiPolygon, Polygon, Position } from 'geojson';
import type { MapModeOverlayData, ProjectorFn } from '@/components/GlobeScene';
import { computePandemicColor } from '@/lib/mapColorUtils';

const casualtyFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

type PandemicOverlay = NonNullable<MapModeOverlayData['pandemic']>;
type CountryFeature = Feature<Polygon | MultiPolygon>;
type FeatureLookup = Map<string, CountryFeature>;

interface PandemicSpreadOverlayProps {
  nations: Array<{
    id: string;
    name: string;
    lon: number;
    lat: number;
  }>;
  canvasWidth: number;
  canvasHeight: number;
  visible: boolean;
  pandemic: PandemicOverlay;
  projector?: ProjectorFn | null;
  projectorRevision?: number;
  countryFeatureLookup?: FeatureLookup | null;
  worldCountryFeatures?: FeatureCollection<Polygon | MultiPolygon> | null;
}

interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

interface ProjectedPoint2D {
  x: number;
  y: number;
}

interface TerritoryFill {
  id: string;
  name: string;
  infection: number;
  fillRatio: number;
  normalized: number;
  casualties: number;
  color: string;
  isDetected: boolean;
  clipId: string;
  gradientId: string;
  bounds: BoundingBox;
  paths: string[];
  labelPosition: ProjectedPoint2D | null;
}

interface PandemicFallbackPoint {
  id: string;
  name: string;
  centerX: number;
  centerY: number;
  infection: number;
  fillRatio: number;
  casualties: number;
  color: string;
  isDetected: boolean;
  baseRadius: number;
  glowRadius: number;
}

const FEATURE_PROPERTY_KEYS = [
  'name',
  'NAME',
  'name_long',
  'NAME_LONG',
  'formal_en',
  'FORMAL_EN',
  'admin',
  'ADMIN',
  'sovereignt',
  'SOVEREIGNT',
  'abbrev',
  'ABBREV',
  'postal',
  'POSTAL',
  'iso_a3',
  'ISO_A3',
  'iso_a2',
  'ISO_A2',
  'adm0_a3',
  'ADM0_A3',
  'gu_a3',
  'GU_A3',
  'wb_a3',
  'WB_A3',
  'brk_a3',
  'BRK_A3',
] as const;

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
    for (const key of FEATURE_PROPERTY_KEYS) {
      if (Object.prototype.hasOwnProperty.call(properties, key)) {
        registerFeatureKey(lookup, feature, properties[key]);
      }
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
  const projectedPoints: ProjectedPoint2D[] = [];
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
    projectedPoints.push(point);
  }
  if (projectedPoints.length < 3) {
    return null;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const commands: string[] = [];

  projectedPoints.forEach((point, index) => {
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

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function createUniqueDomId(prefix: string, value: string, suffix: string): string {
  const sanitized = value.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'nation';
  const hash = hashString(value).toString(36);
  return `${prefix}-${sanitized}-${hash}-${suffix}`;
}

export function PandemicSpreadOverlay({
  nations,
  canvasWidth,
  canvasHeight,
  projector,
  projectorRevision,
  visible,
  pandemic,
  countryFeatureLookup,
  worldCountryFeatures,
}: PandemicSpreadOverlayProps) {
  const geometryLookup = useMemo<FeatureLookup | null>(() => {
    if (countryFeatureLookup && countryFeatureLookup.size > 0) {
      return countryFeatureLookup;
    }
    return buildFeatureLookupFromCollection(worldCountryFeatures);
  }, [countryFeatureLookup, worldCountryFeatures]);

  const { territories, fallbackPoints } = useMemo(() => {
    if (!visible) {
      return { territories: [] as TerritoryFill[], fallbackPoints: [] as PandemicFallbackPoint[] };
    }

    const infectionValues = Object.values(pandemic.infections ?? {})
      .filter(value => Number.isFinite(value))
      .map(value => Number(value));
    const maxInfection = infectionValues.length ? Math.max(...infectionValues, 1) : 0;

    if (maxInfection <= 0) {
      return { territories: [], fallbackPoints: [] };
    }

    const projectPoint = (lon: number, lat: number): ProjectedPoint2D | null => {
      if (projector) {
        const { x, y, visible: isVisible } = projector(lon, lat);
        if (!isVisible) {
          return null;
        }
        return { x, y };
      }
      const x = ((lon + 180) / 360) * canvasWidth;
      const y = ((90 - lat) / 180) * canvasHeight;
      return { x, y };
    };

    const territories: TerritoryFill[] = [];
    const fallbackPoints: PandemicFallbackPoint[] = [];

    nations.forEach(nation => {
      const infectionRaw = Number(pandemic.infections?.[nation.id] ?? 0);
      if (!Number.isFinite(infectionRaw) || infectionRaw <= 0) {
        return;
      }

      const normalized = maxInfection > 0 ? Math.max(0, infectionRaw) / maxInfection : 0;
      const fillRatio = Math.max(0, Math.min(1, infectionRaw / 100));
      const casualties = Number(pandemic.casualties?.[nation.id] ?? 0);
      const color = computePandemicColor(normalized);
      const isDetected = Boolean(pandemic.detections?.[nation.id]);
      const center = projectPoint(nation.lon, nation.lat);

      const feature = geometryLookup ? findFeatureForNation(nation.id, nation.name, geometryLookup) : null;
      let renderedViaGeometry = false;

      if (feature) {
        const projected = projectFeatureGeometry(feature, projectPoint);
        if (projected) {
          territories.push({
            id: nation.id,
            name: nation.name,
            infection: infectionRaw,
            fillRatio,
            normalized,
            casualties,
            color,
            isDetected,
            clipId: createUniqueDomId('pandemic', nation.id, 'clip'),
            gradientId: createUniqueDomId('pandemic', nation.id, 'gradient'),
            bounds: projected.bounds,
            paths: projected.paths,
            labelPosition: center,
          });
          renderedViaGeometry = true;
        }
      }

      if (!renderedViaGeometry && center) {
        const baseRadius = 8 + fillRatio * 22;
        const glowRadius = baseRadius * 1.7;
        fallbackPoints.push({
          id: nation.id,
          name: nation.name,
          centerX: center.x,
          centerY: center.y,
          infection: infectionRaw,
          fillRatio,
          casualties,
          color,
          isDetected,
          baseRadius,
          glowRadius,
        });
      }
    });
    return { territories, fallbackPoints };
  }, [
    canvasWidth,
    canvasHeight,
    geometryLookup,
    nations,
    pandemic,
    projector,
    projectorRevision,
    visible,
  ]);

  if (!visible) return null;

  const stageLabel = pandemic.stage?.toUpperCase?.() ?? 'UNKNOWN';
  const globalInfection = Math.max(0, Math.min(100, pandemic.globalInfection ?? 0));
  const vaccineProgress = Math.max(0, Math.min(100, pandemic.vaccineProgress ?? 0));
  const globalCasualties = pandemic.globalCasualties ?? 0;

  return (
    <svg className="absolute inset-0 pointer-events-none" width={canvasWidth} height={canvasHeight} style={{ zIndex: 6 }}>
      {territories.length > 0 && (
        <defs>
          {territories.map(territory => (
            <clipPath key={territory.clipId} id={territory.clipId} clipPathUnits="userSpaceOnUse">
              {territory.paths.map((path, index) => (
                <path key={`${territory.clipId}-path-${index}`} d={path} fillRule="evenodd" />
              ))}
            </clipPath>
          ))}
          {territories.map(territory => (
            <linearGradient
              key={territory.gradientId}
              id={territory.gradientId}
              x1="0"
              x2="0"
              y1={territory.bounds.maxY}
              y2={territory.bounds.minY}
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor={territory.color} stopOpacity={0.9} />
              <stop offset="100%" stopColor={territory.color} stopOpacity={0.35} />
            </linearGradient>
          ))}
        </defs>
      )}

      {territories.map(territory => {
        const casualtyLabel =
          territory.casualties > 0 ? casualtyFormatter.format(Math.max(0, territory.casualties)) : null;
        const width = Math.max(1, territory.bounds.maxX - territory.bounds.minX);
        const height = Math.max(1, territory.bounds.maxY - territory.bounds.minY);
        const fillHeight = Math.max(0, Math.min(height, height * territory.fillRatio));
        const rectY = territory.bounds.maxY - fillHeight;
        const labelX =
          territory.labelPosition?.x ?? territory.bounds.minX + (territory.bounds.maxX - territory.bounds.minX) / 2;
        const labelY =
          territory.labelPosition?.y ?? territory.bounds.minY + (territory.bounds.maxY - territory.bounds.minY) / 2;
        const labelOffset = Math.max(16, Math.min(32, height * 0.25));
        const strokeColor = territory.isDetected ? 'rgba(248, 113, 113, 0.85)' : 'rgba(248, 113, 113, 0.4)';

        return (
          <g key={territory.id}>
            <g clipPath={`url(#${territory.clipId})`}>
              <rect
                x={territory.bounds.minX}
                y={territory.bounds.minY}
                width={width}
                height={height}
                fill={territory.color}
                opacity={0.18}
              />
              <rect
                x={territory.bounds.minX}
                y={rectY}
                width={width}
                height={fillHeight}
                fill={`url(#${territory.gradientId})`}
                style={{ mixBlendMode: 'screen', transition: 'all 0.6s ease-out' }}
              />
            </g>
            {territory.paths.map((path, index) => (
              <path
                key={`${territory.id}-outline-${index}`}
                d={path}
                fill="none"
                stroke={strokeColor}
                strokeWidth={territory.isDetected ? 1.8 : 1.2}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                fillRule="evenodd"
              />
            ))}
            <text
              x={labelX}
              y={labelY - (labelOffset + 6)}
              textAnchor="middle"
              className="text-[11px] font-semibold fill-rose-100"
              style={{ fontSize: '11px' }}
            >
              {territory.name}
            </text>
            <text
              x={labelX}
              y={labelY + labelOffset}
              textAnchor="middle"
              className="text-[10px] font-mono fill-rose-200"
              style={{ fontSize: '10px' }}
            >
              {infectionLabel(territory.infection)}
            </text>
            {casualtyLabel ? (
              <text
                x={labelX}
                y={labelY + labelOffset + 16}
                textAnchor="middle"
                className="text-[10px] font-mono fill-rose-300"
                style={{ fontSize: '10px' }}
              >
                {`Casualties: ${casualtyLabel}`}
              </text>
            ) : null}
            {territory.isDetected ? (
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                className="text-[12px] font-bold fill-yellow-200"
                style={{ fontSize: '12px' }}
              >
                ☣
              </text>
            ) : null}
          </g>
        );
      })}

      {fallbackPoints.map(point => {
        const casualtyLabel =
          point.casualties > 0 ? casualtyFormatter.format(Math.max(0, point.casualties)) : null;

        return (
          <g key={point.id}>
            <circle
              cx={point.centerX}
              cy={point.centerY}
              r={point.glowRadius}
              fill={point.color}
              opacity={0.18 + point.fillRatio * 0.2}
              className="animate-ping"
              style={{ animationDuration: `${Math.max(1.4, 3.2 - point.fillRatio * 1.6)}s` }}
            />
            <circle cx={point.centerX} cy={point.centerY} r={point.baseRadius} fill={point.color} opacity={0.65} />
            <text
              x={point.centerX}
              y={point.centerY - (point.baseRadius + 18)}
              textAnchor="middle"
              className="text-[11px] font-semibold fill-rose-100"
              style={{ fontSize: '11px' }}
            >
              {point.name}
            </text>
            <text
              x={point.centerX}
              y={point.centerY + point.baseRadius + 16}
              textAnchor="middle"
              className="text-[10px] font-mono fill-rose-200"
              style={{ fontSize: '10px' }}
            >
              {infectionLabel(point.infection)}
            </text>
            {casualtyLabel ? (
              <text
                x={point.centerX}
                y={point.centerY + point.baseRadius + 30}
                textAnchor="middle"
                className="text-[10px] font-mono fill-rose-300"
                style={{ fontSize: '10px' }}
              >
                {`Casualties: ${casualtyLabel}`}
              </text>
            ) : null}
            {point.isDetected ? (
              <circle
                cx={point.centerX}
                cy={point.centerY}
                r={point.baseRadius + 10}
                fill="none"
                stroke="rgba(248, 113, 113, 0.85)"
                strokeWidth={2}
                strokeDasharray="6 4"
              />
            ) : null}
          </g>
        );
      })}

      <g transform={`translate(${canvasWidth - 220}, 20)`}>
        <rect
          x={0}
          y={0}
          width={200}
          height={130}
          fill="rgba(15, 23, 42, 0.92)"
          stroke="rgba(248, 113, 113, 0.45)"
          strokeWidth={1}
          rx={6}
        />
        <g transform="translate(14, 18)">
          <Biohazard className="h-4 w-4 text-rose-300" />
        </g>
        <text x={40} y={24} className="text-[12px] font-semibold fill-rose-200" style={{ fontSize: '12px' }}>
          Pandemic Status
        </text>
        <text x={16} y={50} className="text-[11px] font-mono fill-rose-100" style={{ fontSize: '11px' }}>
          {`Stage: ${stageLabel}`}
        </text>
        <text x={16} y={68} className="text-[11px] font-mono fill-rose-100" style={{ fontSize: '11px' }}>
          {`Global Infection: ${globalInfection.toFixed(1)}%`}
        </text>
        <text x={16} y={86} className="text-[11px] font-mono fill-rose-100" style={{ fontSize: '11px' }}>
          {`Casualties: ${casualtyFormatter.format(globalCasualties)}`}
        </text>
        <text x={16} y={104} className="text-[11px] font-mono fill-rose-100" style={{ fontSize: '11px' }}>
          {`Vaccine Progress: ${vaccineProgress.toFixed(1)}%`}
        </text>
        <g transform="translate(16, 112)">
          <circle cx={6} cy={10} r={6} fill="rgba(248, 113, 113, 0.5)" />
          <text x={20} y={14} className="text-[10px] fill-rose-100" style={{ fontSize: '10px' }}>
            Detected bio-weapon signature
          </text>
        </g>
      </g>
    </svg>
  );
}

function infectionLabel(value: number): string {
  if (!Number.isFinite(value)) return '0%';
  if (value >= 100) return '100%';
  if (value >= 10) return `${value.toFixed(0)}%`;
  return `${value.toFixed(1)}%`;
}

export default PandemicSpreadOverlay;
