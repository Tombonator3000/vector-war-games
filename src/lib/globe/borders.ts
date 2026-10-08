import * as THREE from 'three';
import type { FeatureCollection, Polygon, MultiPolygon } from 'geojson';

/**
 * Convert GeoJSON FeatureCollection to line segment UV coordinates
 * Returns Float32Array of UV pairs (u1, v1, u2, v2, ...)
 */
export function collectBorderSegments(
  collection?: FeatureCollection<Polygon | MultiPolygon> | null,
): Float32Array | null {
  if (!collection?.features?.length) {
    return null;
  }

  const segments: number[] = [];

  const pushSegment = (start: readonly [number, number], end: readonly [number, number]) => {
    const [startLon, startLat] = start;
    const [endLon, endLat] = end;

    if (!Number.isFinite(startLon) || !Number.isFinite(startLat)) return;
    if (!Number.isFinite(endLon) || !Number.isFinite(endLat)) return;

    // Convert lon/lat to UV coordinates (0-1 range)
    // With flipY=true: V=0 at south pole (lat=-90), V=1 at north pole (lat=+90)
    const startU = THREE.MathUtils.clamp((startLon + 180) / 360, 0, 1);
    const startV = THREE.MathUtils.clamp((startLat + 90) / 180, 0, 1);
    const endU = THREE.MathUtils.clamp((endLon + 180) / 360, 0, 1);
    const endV = THREE.MathUtils.clamp((endLat + 90) / 180, 0, 1);

    // Do not draw a line across the entire flat map when a border crosses the date line.
    if (Math.abs(endU - startU) > 0.5) {
      const wrappedEndU = endU + (endU < startU ? 1 : -1);
      const seam = wrappedEndU > 1 ? 1 : 0;
      const t = (seam - startU) / (wrappedEndU - startU);
      const seamV = startV + (endV - startV) * t;
      segments.push(startU, startV, seam, seamV, 1 - seam, seamV, endU, endV);
      return;
    }
    segments.push(startU, startV, endU, endV);
  };

  const appendRing = (ring: readonly number[][]) => {
    if (!ring || ring.length < 2) return;

    for (let i = 1; i < ring.length; i += 1) {
      pushSegment(ring[i - 1] as [number, number], ring[i] as [number, number]);
    }

    const first = ring[0] as [number, number];
    const last = ring[ring.length - 1] as [number, number];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      pushSegment(last, first);
    }
  };

  const appendPolygon = (polygon: Polygon['coordinates']) => {
    polygon.forEach(ring => appendRing(ring));
  };

  for (const feature of collection.features) {
    if (!feature) continue;
    const geometry = feature.geometry;
    if (!geometry) continue;

    if (geometry.type === 'Polygon') {
      appendPolygon(geometry.coordinates);
    } else if (geometry.type === 'MultiPolygon') {
      geometry.coordinates.forEach(polygon => appendPolygon(polygon));
    }
  }

  if (!segments.length) {
    return null;
  }

  return new Float32Array(segments);
}

/**
 * Create vector overlay line geometry from UV segments
 */
export function createVectorOverlayGeometry(uvSegments: Float32Array): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();

  // Each segment has 4 values (u1, v1, u2, v2), creating 2 vertices
  const vertexCount = uvSegments.length / 2;
  const positions = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);

  // Fill in positions (will be overridden by vertex shader, but needed for buffer)
  // and UV coordinates for the shader
  for (let i = 0; i < uvSegments.length; i += 2) {
    const vertexIndex = i / 2;
    const u = uvSegments[i];
    const v = uvSegments[i + 1];

    // Set UV for shader
    uvs[i] = u;
    uvs[i + 1] = v;

    // Placeholder positions (will be computed in shader)
    positions[vertexIndex * 3] = 0;
    positions[vertexIndex * 3 + 1] = 0;
    positions[vertexIndex * 3 + 2] = 0;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('uv2', new THREE.BufferAttribute(uvs, 2));

  return geometry;
}

