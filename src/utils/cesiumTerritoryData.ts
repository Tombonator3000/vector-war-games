/**
 * GeoJSON territory boundaries and helper functions for Cesium visualization
 * This file provides simplified geographic boundaries for strategic theater zones
 */

export interface TerritoryBoundary {
  id: string;
  name: string;
  type: 'polygon' | 'multipolygon';
  coordinates: number[][][] | number[][][][];
}

/**
 * Simplified GeoJSON-style coordinates for strategic theater boundaries
 * Format: [longitude, latitude] pairs forming polygons
 */
export const TERRITORY_BOUNDARIES: Record<string, TerritoryBoundary> = {
  north_america: {
    id: 'north_america',
    name: 'North American Theater',
    type: 'polygon',
    // Simplified North America boundary
    coordinates: [[
      [-170, 72], [-130, 72], [-70, 72], [-60, 50], [-70, 30],
      [-95, 25], [-115, 32], [-125, 50], [-170, 60], [-170, 72]
    ]]
  },

  atlantic_corridor: {
    id: 'atlantic_corridor',
    name: 'North Atlantic Sea Lanes',
    type: 'polygon',
    // Strategic maritime corridor
    coordinates: [[
      [-70, 60], [-50, 65], [-10, 65], [-5, 50], [-20, 35],
      [-45, 30], [-60, 35], [-70, 50], [-70, 60]
    ]]
  },

  eastern_bloc: {
    id: 'eastern_bloc',
    name: 'Eurasian Frontier',
    type: 'polygon',
    // Eastern Europe and Russia
    coordinates: [[
      [20, 70], [180, 70], [180, 40], [140, 35], [80, 35],
      [60, 40], [30, 45], [20, 50], [20, 70]
    ]]
  },

  indo_pacific: {
    id: 'indo_pacific',
    name: 'Indo-Pacific Rim',
    type: 'polygon',
    // Pacific Ocean strategic zone
    coordinates: [[
      [90, 30], [140, 45], [160, 40], [170, 10], [150, -10],
      [120, -30], [100, -10], [90, 5], [90, 30]
    ]]
  },

  southern_front: {
    id: 'southern_front',
    name: 'Southern Hemisphere Coalition',
    type: 'polygon',
    // South America and South Atlantic
    coordinates: [[
      [-75, 10], [-35, 5], [-30, -35], [-40, -55], [-70, -55],
      [-75, -20], [-80, 0], [-75, 10]
    ]]
  },

  equatorial_belt: {
    id: 'equatorial_belt',
    name: 'Equatorial Resource Belt',
    type: 'polygon',
    // Africa and Middle East resource zones
    coordinates: [[
      [-15, 35], [50, 35], [50, 15], [40, -35], [20, -35],
      [10, -10], [-15, 5], [-15, 35]
    ]]
  },

  proxy_middle_east: {
    id: 'proxy_middle_east',
    name: 'Proxy Battleground: Middle East',
    type: 'polygon',
    // Middle East conflict zone
    coordinates: [[
      [35, 42], [60, 42], [65, 38], [60, 25], [50, 15],
      [35, 15], [30, 25], [35, 42]
    ]]
  },

  arctic_circle: {
    id: 'arctic_circle',
    name: 'Arctic Surveillance Zone',
    type: 'polygon',
    // Arctic Ocean
    coordinates: [[
      [-180, 90], [180, 90], [180, 66], [150, 66], [100, 70],
      [50, 70], [0, 70], [-50, 70], [-100, 70], [-150, 66],
      [-180, 66], [-180, 90]
    ]]
  }
};

/**
 * Convert simplified boundary to Cesium polygon hierarchy
 */
export function getTerritoryPolygonHierarchy(territoryId: string): number[] | null {
  const boundary = TERRITORY_BOUNDARIES[territoryId];
  if (!boundary) return null;

  // Flatten coordinates for Cesium (expects flat array of lon, lat, lon, lat, ...)
  const coords = boundary.type === 'polygon'
    ? boundary.coordinates[0] as number[][]
    : (boundary.coordinates[0] as number[][][])[0];

  return coords.flat();
}

/**
 * Get center point of a territory for labeling
 */
export function getTerritoryCenter(territoryId: string): { lon: number; lat: number } | null {
  const boundary = TERRITORY_BOUNDARIES[territoryId];
  if (!boundary) return null;

  const coords = boundary.type === 'polygon'
    ? boundary.coordinates[0] as number[][]
    : (boundary.coordinates[0] as number[][][])[0];

  // Calculate centroid
  let lon = 0, lat = 0;
  coords.forEach(([lng, lt]) => {
    lon += lng;
    lat += lt;
  });

  return {
    lon: lon / coords.length,
    lat: lat / coords.length
  };
}

/**
 * Weather patterns for cloud overlay visualization
 */
export interface WeatherPattern {
  lat: number;
  lon: number;
  radius: number; // in km
  intensity: number; // 0-1
  type: 'storm' | 'clouds' | 'clear';
}

/**
 * Generate dynamic weather patterns (placeholder for real weather API)
 */
export function generateWeatherPatterns(): WeatherPattern[] {
  const time = Date.now() / 10000;
  return [
    {
      lat: 40 + Math.sin(time * 0.1) * 10,
      lon: -100 + Math.cos(time * 0.1) * 15,
      radius: 500,
      intensity: 0.6 + Math.sin(time * 0.2) * 0.3,
      type: 'clouds'
    },
    {
      lat: 55,
      lon: 30 + Math.sin(time * 0.15) * 20,
      radius: 800,
      intensity: 0.8,
      type: 'storm'
    },
    {
      lat: -20,
      lon: -40 + Math.cos(time * 0.12) * 10,
      radius: 600,
      intensity: 0.5,
      type: 'clouds'
    }
  ];
}

/**
 * 3D Model URLs for military units
 * In production, these would be actual GLTF model URLs
 */
export const UNIT_3D_MODELS = {
  armored_corps: {
    url: '/models/tank.glb', // Placeholder - would be actual model
    scale: 100000,
    heightOffset: 0
  },
  carrier_fleet: {
    url: '/models/carrier.glb', // Placeholder - would be actual model
    scale: 200000,
    heightOffset: 0
  },
  air_wing: {
    url: '/models/fighter.glb', // Placeholder - would be actual model
    scale: 50000,
    heightOffset: 100000
  }
};

/**
 * Satellite orbital parameters for visualization
 */
export interface SatelliteOrbit {
  id: string;
  name: string;
  altitude: number; // km above surface
  inclination: number; // degrees
  period: number; // orbital period in minutes
  color: string;
}

export const SATELLITE_ORBITS: SatelliteOrbit[] = [
  {
    id: 'recon_1',
    name: 'Recon Satellite Alpha',
    altitude: 600,
    inclination: 98,
    period: 96,
    color: '#00ff00'
  },
  {
    id: 'recon_2',
    name: 'Recon Satellite Beta',
    altitude: 800,
    inclination: 65,
    period: 102,
    color: '#00ffff'
  },
  {
    id: 'early_warning',
    name: 'Early Warning Sat',
    altitude: 35786, // GEO
    inclination: 0,
    period: 1436,
    color: '#ffff00'
  }
];

/**
 * Calculate satellite position at given time
 */
export function calculateSatellitePosition(
  satellite: SatelliteOrbit,
  timeOffset: number // seconds since epoch
): { lon: number; lat: number; height: number } {
  const orbitalProgress = (timeOffset / (satellite.period * 60)) % 1;
  const angle = orbitalProgress * 2 * Math.PI;

  return {
    lon: (angle * 180 / Math.PI) % 360 - 180,
    lat: Math.sin(angle) * satellite.inclination,
    height: satellite.altitude * 1000 // convert to meters
  };
}
