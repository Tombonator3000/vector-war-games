/**
 * Territory polygon rendering for Three.js
 * Ported from Cesium implementation as part of Phase 2 deprecation plan
 */

import * as THREE from 'three';
import type { Polygon, MultiPolygon } from 'geojson';

export interface TerritoryPolygon {
  id: string;
  name: string;
  geometry: Polygon | MultiPolygon;
  color?: string;
}

/**
 * Convert lat/lon coordinates to 3D vector position
 */
type LatLonToVector3Fn = (lon: number, lat: number, radius: number) => THREE.Vector3;

/**
 * Create THREE.Line for territory boundaries
 * Renders the outline of a territory polygon on the globe
 */
export function createTerritoryBoundary(
  coordinates: number[][],
  latLonToVector3: LatLonToVector3Fn,
  radius: number,
  color: string = '#ffffff',
  opacity: number = 0.6
): THREE.Line {
  const points: THREE.Vector3[] = [];

  // Convert each coordinate to 3D position with validation
  coordinates.forEach((coord) => {
    // Validate coordinate is an array with at least 2 numbers
    if (!Array.isArray(coord) || coord.length < 2) return;
    const [lon, lat] = coord;
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) return;
    points.push(latLonToVector3(lon, lat, radius + 0.01));
  });

  // Close the loop by adding first point at the end
  if (points.length > 0) {
    points.push(points[0].clone());
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: new THREE.Color(color),
    linewidth: 2,
    transparent: true,
    opacity
  });

  return new THREE.Line(geometry, material);
}

/**
 * Create multiple boundary lines for a territory polygon
 * Handles both Polygon and MultiPolygon geometries
 */
export function createTerritoryBoundaries(
  polygon: TerritoryPolygon,
  latLonToVector3: LatLonToVector3Fn,
  radius: number,
  color?: string
): THREE.Group {
  const group = new THREE.Group();
  const lineColor = color || polygon.color || '#4a90e2';

  if (polygon.geometry.type === 'Polygon') {
    // Single polygon - render each ring (outer + holes)
    polygon.geometry.coordinates.forEach((ring, index) => {
      const line = createTerritoryBoundary(
        ring,
        latLonToVector3,
        radius,
        lineColor,
        index === 0 ? 0.8 : 0.4 // Outer ring more opaque than holes
      );
      group.add(line);
    });
  } else if (polygon.geometry.type === 'MultiPolygon') {
    // Multiple polygons - render each one
    polygon.geometry.coordinates.forEach(polygonCoords => {
      polygonCoords.forEach((ring, index) => {
        const line = createTerritoryBoundary(
          ring,
          latLonToVector3,
          radius,
          lineColor,
          index === 0 ? 0.8 : 0.4
        );
        group.add(line);
      });
    });
  }

  group.name = `territory-${polygon.id}`;
  return group;
}

/**
 * Load territory data from existing Cesium format
 */
export async function loadTerritoryData(): Promise<TerritoryPolygon[]> {
  // Import existing Cesium territory boundaries
  const { TERRITORY_BOUNDARIES } = await import('@/utils/cesiumTerritoryData');

  return Object.entries(TERRITORY_BOUNDARIES)
    .filter(([_, data]) => {
      // Validate data has required fields
      if (!data || typeof data !== 'object') return false;
      if (!data.type || !data.coordinates) return false;
      if (!Array.isArray(data.coordinates)) return false;
      return true;
    })
    .map(([id, data]) => {
      // Convert from simplified format to GeoJSON Polygon with validation
      let coordinates: number[][][] = [];

      if (data.type === 'polygon') {
        const coords = data.coordinates as number[][][];
        // Validate polygon coordinates structure
        if (Array.isArray(coords) && coords.length > 0 && Array.isArray(coords[0])) {
          coordinates = coords;
        }
      } else if (data.type === 'multipolygon') {
        const multiCoords = data.coordinates as number[][][][];
        // Extract first polygon from multipolygon with validation
        if (Array.isArray(multiCoords) && multiCoords.length > 0 && Array.isArray(multiCoords[0])) {
          coordinates = multiCoords[0];
        }
      }

      // Ensure we have valid coordinates
      if (coordinates.length === 0) {
        coordinates = [[]]; // Empty polygon as fallback
      }

      const geometry: Polygon = {
        type: 'Polygon',
        coordinates
      };

      return {
        id,
        name: data.name || id,
        geometry,
        color: '#4a90e2' // Default strategic territory color
      };
    });
}

/**
 * Create filled polygon mesh for territory visualization
 * This creates a semi-transparent filled area on the globe
 */
export function createTerritoryFill(
  coordinates: number[][],
  latLonToVector3: LatLonToVector3Fn,
  radius: number,
  color: string = '#4a90e2',
  opacity: number = 0.2
): THREE.Mesh | null {
  if (coordinates.length < 3) return null;

  const vertices: number[] = [];
  const indices: number[] = [];

  // Convert coordinates to 3D vertices with validation
  const positions = coordinates
    .filter(coord => {
      if (!Array.isArray(coord) || coord.length < 2) return false;
      return Number.isFinite(coord[0]) && Number.isFinite(coord[1]);
    })
    .map(([lon, lat]) =>
      latLonToVector3(lon, lat, radius + 0.005)
    );

  if (positions.length < 3) return null;

  // Simple fan triangulation from first vertex
  positions.forEach((pos, i) => {
    vertices.push(pos.x, pos.y, pos.z);
    if (i > 1) {
      indices.push(0, i - 1, i);
    }
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  return new THREE.Mesh(geometry, material);
}

/**
 * Calculate center point of a territory for labeling
 */
export function getTerritoryCenter(coordinates: number[][]): { lon: number; lat: number } {
  let lon = 0;
  let lat = 0;
  let validCount = 0;

  coordinates.forEach((coord) => {
    // Validate coordinate
    if (!Array.isArray(coord) || coord.length < 2) return;
    const [lng, lt] = coord;
    if (!Number.isFinite(lng) || !Number.isFinite(lt)) return;

    lon += lng;
    lat += lt;
    validCount++;
  });

  // Return center or fallback to 0,0 if no valid coordinates
  if (validCount === 0) {
    return { lon: 0, lat: 0 };
  }

  return {
    lon: lon / validCount,
    lat: lat / validCount
  };
}

/**
 * Create complete territory visualization with both fill and outline
 */
export function createTerritoryVisualization(
  polygon: TerritoryPolygon,
  latLonToVector3: LatLonToVector3Fn,
  radius: number,
  options?: {
    showFill?: boolean;
    showOutline?: boolean;
    fillColor?: string;
    outlineColor?: string;
    fillOpacity?: number;
    outlineOpacity?: number;
  }
): THREE.Group {
  const {
    showFill = false,
    showOutline = true,
    fillColor,
    outlineColor,
    fillOpacity = 0.2,
    outlineOpacity = 0.6
  } = options || {};

  const group = new THREE.Group();

  if (polygon.geometry.type === 'Polygon') {
    // Add fill if requested
    if (showFill && polygon.geometry.coordinates[0]) {
      const fill = createTerritoryFill(
        polygon.geometry.coordinates[0],
        latLonToVector3,
        radius,
        fillColor || polygon.color || '#4a90e2',
        fillOpacity
      );
      if (fill) group.add(fill);
    }

    // Add outline
    if (showOutline) {
      const boundaries = createTerritoryBoundaries(
        polygon,
        latLonToVector3,
        radius,
        outlineColor
      );
      group.add(boundaries);
    }
  } else if (polygon.geometry.type === 'MultiPolygon') {
    // Handle MultiPolygon
    polygon.geometry.coordinates.forEach(polygonCoords => {
      if (showFill && polygonCoords[0]) {
        const fill = createTerritoryFill(
          polygonCoords[0],
          latLonToVector3,
          radius,
          fillColor || polygon.color || '#4a90e2',
          fillOpacity
        );
        if (fill) group.add(fill);
      }
    });

    if (showOutline) {
      const boundaries = createTerritoryBoundaries(
        polygon,
        latLonToVector3,
        radius,
        outlineColor
      );
      group.add(boundaries);
    }
  }

  group.name = `territory-viz-${polygon.id}`;
  return group;
}
