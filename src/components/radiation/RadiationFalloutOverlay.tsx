import { useMemo } from 'react';
import { Radiation } from 'lucide-react';
import type { Feature, FeatureCollection, MultiPolygon, Polygon, Position } from 'geojson';
import type { MapModeOverlayData, ProjectorFn } from '@/components/GlobeScene';

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

type RadiationOverlay = NonNullable<MapModeOverlayData['radiation']>;
type CountryFeature = Feature<Polygon | MultiPolygon>;
type FeatureLookup = Map<string, CountryFeature>;

type ProjectedPoint2D = { x: number; y: number };

type RadiationTerritoryFill = {
  id: string;
  name: string;
  exposure: number;
  normalized: number;
  sickness: number;
  refugee: number;
  color: string;
  stroke: string;
  paths: string[];
  labelPosition: ProjectedPoint2D | null;
};

type RadiationFallbackPoint = {
  id: string;
  name: string;
  centerX: number;
  centerY: number;
  normalized: number;
  color: string;
  stroke: string;
  baseRadius: number;
};

type RadiationZoneGlow = {
  id: string;
  x: number;
  y: number;
  radius: number;
  intensity: number;
};

type FalloutMarkerPoint = {
  id: string;
  x: number;
  y: number;
  intensity: number;
  alertLevel: RadiationOverlay['falloutMarks'][number]['alertLevel'];
};

interface RadiationFalloutOverlayProps {
  nations: Array<{
    id: string;
    name: string;
    lon: number;
    lat: number;
  }>;
  canvasWidth: number;
  canvasHeight: number;
  visible: boolean;
  radiation: RadiationOverlay;
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

function mergeBounds(
  current: { minX: number; minY: number; maxX: number; maxY: number } | null,
  incoming: { minX: number; minY: number; maxX: number; maxY: number },
) {
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
): { path: string; bounds: { minX: number; minY: number; maxX: number; maxY: number } } | null {
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
): { paths: string[]; bounds: { minX: number; minY: number; maxX: number; maxY: number } } | null {
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
  let bounds: { minX: number; minY: number; maxX: number; maxY: number } | null = null;

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

function getRadiationColor(normalized: number) {
  const n = Math.max(0, Math.min(1, normalized));
  if (n >= 0.85) {
    return { fill: 'rgba(248,113,113,0.7)', stroke: '#ef4444' };
  }
  if (n >= 0.65) {
    return { fill: 'rgba(251,146,60,0.68)', stroke: '#f97316' };
  }
  if (n >= 0.45) {
    return { fill: 'rgba(250,204,21,0.62)', stroke: '#facc15' };
  }
  if (n >= 0.25) {
    return { fill: 'rgba(56,189,248,0.55)', stroke: '#38bdf8' };
  }
  return { fill: 'rgba(134,239,172,0.5)', stroke: '#4ade80' };
}

export function RadiationFalloutOverlay({
  nations,
  canvasWidth,
  canvasHeight,
  visible,
  radiation,
  projector,
  projectorRevision,
  countryFeatureLookup,
  worldCountryFeatures,
}: RadiationFalloutOverlayProps) {
  const geometryLookup = useMemo<FeatureLookup | null>(() => {
    if (countryFeatureLookup && countryFeatureLookup.size > 0) {
      return countryFeatureLookup;
    }
    return buildFeatureLookupFromCollection(worldCountryFeatures);
  }, [countryFeatureLookup, worldCountryFeatures]);

  const { territories, fallbackPoints, zoneGlows, falloutMarkers } = useMemo(() => {
    if (!visible) {
      return {
        territories: [] as RadiationTerritoryFill[],
        fallbackPoints: [] as RadiationFallbackPoint[],
        zoneGlows: [] as RadiationZoneGlow[],
        falloutMarkers: [] as FalloutMarkerPoint[],
      };
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

    const territories: RadiationTerritoryFill[] = [];
    const fallbackPoints: RadiationFallbackPoint[] = [];
    const zoneGlows: RadiationZoneGlow[] = [];
    const falloutMarkers: FalloutMarkerPoint[] = [];

    nations.forEach(nation => {
      const exposureScore = Math.max(
        Number(radiation.exposures?.[nation.id] ?? 0),
        Number(radiation.sickness?.[nation.id] ?? 0),
        Number(radiation.refugeePressure?.[nation.id] ?? 0) * 0.8,
      );
      if (exposureScore <= 0) {
        return;
      }

      const normalized = Math.max(0, Math.min(1, exposureScore / 100));
      const color = getRadiationColor(normalized);
      const center = projectPoint(nation.lon, nation.lat);

      // Territory fills are disabled due to projection issues when viewing the globe.
      // Points on the back of the globe are skipped, causing polygons to render incorrectly
      // as large rectangles or diagonal lines instead of proper country boundaries.
      // We now always use fallback point markers instead.
      if (center) {
        const baseRadius = 14 + normalized * 26;
        fallbackPoints.push({
          id: nation.id,
          name: nation.name,
          centerX: center.x,
          centerY: center.y,
          normalized,
          color: color.fill,
          stroke: color.stroke,
          baseRadius,
        });
      }
    });

    radiation.radiationZones.forEach(zone => {
      if (!Number.isFinite(zone.lon) || !Number.isFinite(zone.lat)) {
        return;
      }
      const projected = projectPoint(zone.lon, zone.lat);
      if (!projected) {
        return;
      }
      const radius = Math.max(8, Number(zone.radius ?? 0));
      const intensity = Math.max(0, Math.min(1, Number(zone.intensity ?? 0)));
      zoneGlows.push({
        id: zone.id,
        x: projected.x,
        y: projected.y,
        radius,
        intensity,
      });
    });

    radiation.falloutMarks.forEach(mark => {
      if (!Number.isFinite(mark.lon) || !Number.isFinite(mark.lat)) {
        return;
      }
      const projected = projectPoint(mark.lon, mark.lat);
      if (!projected) {
        return;
      }
      const intensity = Math.max(0, Math.min(1, Number(mark.intensity ?? 0)));
      falloutMarkers.push({
        id: mark.id,
        x: projected.x,
        y: projected.y,
        intensity,
        alertLevel: mark.alertLevel ?? 'none',
      });
    });

    return { territories, fallbackPoints, zoneGlows, falloutMarkers };
  }, [
    visible,
    nations,
    radiation.exposures,
    radiation.sickness,
    radiation.refugeePressure,
    radiation.falloutMarks,
    radiation.radiationZones,
    geometryLookup,
    projector,
    projectorRevision,
    canvasWidth,
    canvasHeight,
  ]);

  if (
    !visible ||
    (!fallbackPoints.length && !zoneGlows.length && !falloutMarkers.length)
  ) {
    return null;
  }

  return (
    <svg
      className="pointer-events-none absolute inset-0"
      style={{ zIndex: 15 }}
      width={canvasWidth}
      height={canvasHeight}
      viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
      aria-hidden="true"
    >
      <g className="pointer-events-none">
        {zoneGlows.map(zone => (
          <g key={zone.id} opacity={Math.max(0.25, zone.intensity)}>
            <circle
              cx={zone.x}
              cy={zone.y}
              r={zone.radius * 1.4}
              fill={`rgba(74,222,128,${zone.intensity * 0.12})`}
            />
            <circle
              cx={zone.x}
              cy={zone.y}
              r={zone.radius}
              fill={`rgba(250,204,21,${zone.intensity * 0.22})`}
            />
          </g>
        ))}
      </g>

      {/* Territory fills are disabled - using fallback points only */}

      <g className="pointer-events-none">
        {fallbackPoints.map(point => (
          <g key={point.id} opacity={Math.max(0.35, point.normalized)}>
            <circle
              cx={point.centerX}
              cy={point.centerY}
              r={point.baseRadius * 1.35}
              fill={`rgba(74,222,128,${point.normalized * 0.2})`}
            />
            <circle
              cx={point.centerX}
              cy={point.centerY}
              r={point.baseRadius}
              fill={point.color}
              stroke={point.stroke}
              strokeWidth={1.4}
              strokeOpacity={0.75}
            >
              <title>{`${point.name}: ${Math.round(point.normalized * 100)}% fallout exposure`}</title>
            </circle>
            <text
              x={point.centerX}
              y={point.centerY + point.baseRadius + 10}
              textAnchor="middle"
              fontSize={10}
              fontWeight={600}
              fill="rgba(226,232,240,0.85)"
              stroke="rgba(15,23,42,0.8)"
              strokeWidth={0.6}
              paintOrder="stroke"
            >
              {`${Math.round(point.normalized * 100)}%`}
            </text>
          </g>
        ))}
      </g>

      <g className="pointer-events-none">
        {falloutMarkers.map(marker => (
          <g
            key={marker.id}
            transform={`translate(${marker.x - 8}, ${marker.y - 8})`}
            opacity={Math.max(0.4, marker.intensity + 0.2)}
          >
            <Radiation
              width={16}
              height={16}
              strokeWidth={1.4}
              stroke={marker.alertLevel === 'deadly' ? '#ef4444' : marker.alertLevel === 'severe' ? '#f97316' : '#facc15'}
              fill="none"
            />
          </g>
        ))}
      </g>
    </svg>
  );
}

RadiationFalloutOverlay.displayName = 'RadiationFalloutOverlay';

export default RadiationFalloutOverlay;
