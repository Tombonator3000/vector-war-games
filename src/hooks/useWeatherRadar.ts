/**
 * useWeatherRadar - Hook for fetching weather radar data and generating cloud regions
 *
 * Uses RainViewer API (free, no API key required) to get global weather radar composites.
 * The radar data is processed into cloud-like regions that can be rendered on the globe.
 *
 * Reference: https://www.rainviewer.com/api.html
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

export interface CloudRegion {
  /** Unique identifier for this cloud region */
  id: string;
  /** Center latitude */
  latitude: number;
  /** Center longitude */
  longitude: number;
  /** Approximate radius in degrees (for clustering) */
  radius: number;
  /** Intensity/density of the cloud (0-1) */
  intensity: number;
  /** Cloud type based on radar characteristics */
  type: 'light' | 'moderate' | 'heavy' | 'storm';
  /** Altitude offset multiplier for 3D rendering */
  altitudeScale: number;
}

export interface WeatherRadarState {
  /** Generated cloud regions from radar data */
  clouds: CloudRegion[];
  /** Raw radar tile URLs for direct rendering */
  radarTiles: string[];
  /** Timestamp of the radar data */
  timestamp: number | null;
  /** Whether data is currently being fetched */
  loading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Whether the cloud layer is enabled */
  enabled: boolean;
}

interface RainViewerFrame {
  time: number;
  path: string;
}

interface RainViewerResponse {
  version: string;
  generated: number;
  host: string;
  radar: {
    past: RainViewerFrame[];
    nowcast?: RainViewerFrame[];
  };
  satellite?: {
    infrared: RainViewerFrame[];
  };
}

// Cache duration: 10 minutes (radar updates every ~10 min)
const CACHE_DURATION_MS = 10 * 60 * 1000;

// Local storage keys
const WEATHER_CACHE_KEY = 'norad_weather_cache';
const WEATHER_ENABLED_KEY = 'norad_weather_enabled';

// RainViewer API endpoints
const RAINVIEWER_API = 'https://api.rainviewer.com/public/weather-maps.json';

// Sample cloud data for fallback (simulates realistic global cloud coverage)
const SAMPLE_CLOUD_DATA: CloudRegion[] = [
  // North Atlantic storm systems
  { id: 'cloud-1', latitude: 55.0, longitude: -30.0, radius: 8, intensity: 0.7, type: 'heavy', altitudeScale: 1.2 },
  { id: 'cloud-2', latitude: 52.0, longitude: -25.0, radius: 6, intensity: 0.5, type: 'moderate', altitudeScale: 1.0 },
  { id: 'cloud-3', latitude: 48.0, longitude: -35.0, radius: 5, intensity: 0.4, type: 'light', altitudeScale: 0.8 },
  // European weather
  { id: 'cloud-4', latitude: 50.0, longitude: 5.0, radius: 7, intensity: 0.6, type: 'moderate', altitudeScale: 1.1 },
  { id: 'cloud-5', latitude: 55.0, longitude: 10.0, radius: 4, intensity: 0.3, type: 'light', altitudeScale: 0.7 },
  { id: 'cloud-6', latitude: 45.0, longitude: 15.0, radius: 5, intensity: 0.5, type: 'moderate', altitudeScale: 0.9 },
  // Pacific systems
  { id: 'cloud-7', latitude: 35.0, longitude: -140.0, radius: 10, intensity: 0.8, type: 'storm', altitudeScale: 1.4 },
  { id: 'cloud-8', latitude: 40.0, longitude: -135.0, radius: 6, intensity: 0.5, type: 'moderate', altitudeScale: 1.0 },
  { id: 'cloud-9', latitude: 30.0, longitude: -145.0, radius: 5, intensity: 0.4, type: 'light', altitudeScale: 0.8 },
  // Tropical convergence zone
  { id: 'cloud-10', latitude: 5.0, longitude: -80.0, radius: 8, intensity: 0.7, type: 'heavy', altitudeScale: 1.3 },
  { id: 'cloud-11', latitude: -2.0, longitude: 25.0, radius: 9, intensity: 0.8, type: 'storm', altitudeScale: 1.5 },
  { id: 'cloud-12', latitude: 3.0, longitude: 105.0, radius: 7, intensity: 0.6, type: 'heavy', altitudeScale: 1.2 },
  // Asian monsoon
  { id: 'cloud-13', latitude: 20.0, longitude: 85.0, radius: 10, intensity: 0.9, type: 'storm', altitudeScale: 1.6 },
  { id: 'cloud-14', latitude: 25.0, longitude: 120.0, radius: 8, intensity: 0.7, type: 'heavy', altitudeScale: 1.3 },
  { id: 'cloud-15', latitude: 30.0, longitude: 130.0, radius: 6, intensity: 0.5, type: 'moderate', altitudeScale: 1.0 },
  // Southern hemisphere
  { id: 'cloud-16', latitude: -40.0, longitude: 150.0, radius: 7, intensity: 0.6, type: 'moderate', altitudeScale: 1.1 },
  { id: 'cloud-17', latitude: -35.0, longitude: -60.0, radius: 6, intensity: 0.5, type: 'moderate', altitudeScale: 0.9 },
  { id: 'cloud-18', latitude: -45.0, longitude: 0.0, radius: 8, intensity: 0.6, type: 'heavy', altitudeScale: 1.2 },
  // US weather
  { id: 'cloud-19', latitude: 42.0, longitude: -90.0, radius: 7, intensity: 0.6, type: 'moderate', altitudeScale: 1.0 },
  { id: 'cloud-20', latitude: 35.0, longitude: -100.0, radius: 5, intensity: 0.4, type: 'light', altitudeScale: 0.8 },
  { id: 'cloud-21', latitude: 45.0, longitude: -120.0, radius: 6, intensity: 0.5, type: 'moderate', altitudeScale: 0.9 },
  // Additional scattered clouds for coverage
  { id: 'cloud-22', latitude: 60.0, longitude: 30.0, radius: 5, intensity: 0.4, type: 'light', altitudeScale: 0.7 },
  { id: 'cloud-23', latitude: -20.0, longitude: 130.0, radius: 4, intensity: 0.3, type: 'light', altitudeScale: 0.6 },
  { id: 'cloud-24', latitude: 10.0, longitude: -60.0, radius: 6, intensity: 0.5, type: 'moderate', altitudeScale: 0.9 },
  { id: 'cloud-25', latitude: -10.0, longitude: -70.0, radius: 7, intensity: 0.6, type: 'heavy', altitudeScale: 1.1 },
];

interface CachedData {
  clouds: CloudRegion[];
  radarTiles: string[];
  timestamp: number;
  cachedAt: number;
}

function loadCachedData(): CachedData | null {
  try {
    const cached = localStorage.getItem(WEATHER_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as CachedData;
      if (Date.now() - parsed.cachedAt < CACHE_DURATION_MS) {
        return parsed;
      }
    }
  } catch {
    // Cache read failed
  }
  return null;
}

function saveCachedData(data: Omit<CachedData, 'cachedAt'>): void {
  try {
    const cacheData: CachedData = {
      ...data,
      cachedAt: Date.now(),
    };
    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(cacheData));
  } catch {
    // Cache write failed
  }
}

function loadEnabledState(): boolean {
  try {
    const stored = localStorage.getItem(WEATHER_ENABLED_KEY);
    return stored === 'true';
  } catch {
    return false;
  }
}

function saveEnabledState(enabled: boolean): void {
  try {
    localStorage.setItem(WEATHER_ENABLED_KEY, String(enabled));
  } catch {
    // Storage failed
  }
}

/**
 * Generate cloud regions from radar metadata
 * Since RainViewer returns tile URLs, we generate synthetic cloud positions
 * based on typical global weather patterns when no pixel data is available.
 */
function generateCloudRegions(timestamp: number): CloudRegion[] {
  // Use timestamp as seed for pseudo-random but consistent cloud positions
  const seed = timestamp % 1000000;
  const random = (n: number) => {
    const x = Math.sin(seed + n) * 10000;
    return x - Math.floor(x);
  };

  const clouds: CloudRegion[] = [];

  // Generate clouds based on typical global weather patterns
  // ITCZ (Intertropical Convergence Zone) - heavy tropical clouds
  for (let i = 0; i < 15; i++) {
    const lon = -180 + random(i * 7) * 360;
    const lat = -5 + random(i * 11) * 10;
    clouds.push({
      id: `itcz-${i}`,
      latitude: lat,
      longitude: lon,
      radius: 5 + random(i * 3) * 8,
      intensity: 0.5 + random(i * 13) * 0.4,
      type: random(i * 17) > 0.6 ? 'storm' : 'heavy',
      altitudeScale: 1.0 + random(i * 19) * 0.5,
    });
  }

  // Mid-latitude storm tracks (40-60 degrees)
  for (let i = 0; i < 20; i++) {
    const hemisphere = random(i) > 0.5 ? 1 : -1;
    const lon = -180 + random(i * 23) * 360;
    const lat = hemisphere * (40 + random(i * 29) * 20);
    clouds.push({
      id: `midlat-${i}`,
      latitude: lat,
      longitude: lon,
      radius: 4 + random(i * 31) * 7,
      intensity: 0.3 + random(i * 37) * 0.5,
      type: random(i * 41) > 0.7 ? 'heavy' : 'moderate',
      altitudeScale: 0.8 + random(i * 43) * 0.4,
    });
  }

  // Subtropical high pressure zones - scattered light clouds
  for (let i = 0; i < 10; i++) {
    const hemisphere = random(i * 47) > 0.5 ? 1 : -1;
    const lon = -180 + random(i * 53) * 360;
    const lat = hemisphere * (25 + random(i * 59) * 10);
    clouds.push({
      id: `subtropical-${i}`,
      latitude: lat,
      longitude: lon,
      radius: 3 + random(i * 61) * 4,
      intensity: 0.2 + random(i * 67) * 0.3,
      type: 'light',
      altitudeScale: 0.5 + random(i * 71) * 0.3,
    });
  }

  // Polar fronts
  for (let i = 0; i < 8; i++) {
    const hemisphere = random(i * 73) > 0.5 ? 1 : -1;
    const lon = -180 + random(i * 79) * 360;
    const lat = hemisphere * (60 + random(i * 83) * 15);
    clouds.push({
      id: `polar-${i}`,
      latitude: lat,
      longitude: lon,
      radius: 5 + random(i * 89) * 6,
      intensity: 0.4 + random(i * 97) * 0.4,
      type: random(i * 101) > 0.5 ? 'moderate' : 'heavy',
      altitudeScale: 0.7 + random(i * 103) * 0.5,
    });
  }

  return clouds;
}

export function useWeatherRadar() {
  const [state, setState] = useState<WeatherRadarState>(() => {
    const cached = loadCachedData();
    return {
      clouds: cached?.clouds ?? [],
      radarTiles: cached?.radarTiles ?? [],
      timestamp: cached?.timestamp ?? null,
      loading: false,
      error: null,
      enabled: loadEnabledState(),
    };
  });

  const fetchingRef = useRef(false);

  const fetchWeatherData = useCallback(async (forceRefresh = false) => {
    if (fetchingRef.current) return;

    // Check cache first
    if (!forceRefresh) {
      const cached = loadCachedData();
      if (cached) {
        setState(prev => ({
          ...prev,
          clouds: cached.clouds,
          radarTiles: cached.radarTiles,
          timestamp: cached.timestamp,
          loading: false,
          error: null,
        }));
        return;
      }
    }

    fetchingRef.current = true;
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(RAINVIEWER_API);

      if (!response.ok) {
        throw new Error(`RainViewer API returned ${response.status}`);
      }

      const data: RainViewerResponse = await response.json();

      // Get the most recent radar frame
      const latestFrame = data.radar.past[data.radar.past.length - 1];
      const timestamp = latestFrame?.time ?? Date.now() / 1000;

      // Generate radar tile URLs for different zoom levels
      // RainViewer tiles: {host}{path}/{size}/{z}/{x}/{y}/{color}/{options}.png
      const radarTiles = latestFrame
        ? [`${data.host}${latestFrame.path}/256/{z}/{x}/{y}/2/1_1.png`]
        : [];

      // Generate cloud regions based on the timestamp
      const clouds = generateCloudRegions(timestamp);

      saveCachedData({ clouds, radarTiles, timestamp });

      setState(prev => ({
        ...prev,
        clouds,
        radarTiles,
        timestamp,
        loading: false,
        error: null,
      }));
    } catch (error) {
      console.warn('Weather radar fetch failed, using sample data:', error);

      // Use sample data as fallback
      setState(prev => ({
        ...prev,
        clouds: SAMPLE_CLOUD_DATA,
        radarTiles: [],
        timestamp: Date.now() / 1000,
        loading: false,
        error: 'Using sample data (API unavailable)',
      }));
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    saveEnabledState(enabled);
    setState(prev => ({ ...prev, enabled }));

    if (enabled && state.clouds.length === 0) {
      fetchWeatherData();
    }
  }, [fetchWeatherData, state.clouds.length]);

  const toggle = useCallback(() => {
    setEnabled(!state.enabled);
  }, [setEnabled, state.enabled]);

  // Fetch data when enabled and no data
  useEffect(() => {
    if (state.enabled && state.clouds.length === 0 && !state.loading) {
      fetchWeatherData();
    }
  }, [state.enabled, state.clouds.length, state.loading, fetchWeatherData]);

  // Expose to window for debugging
  useEffect(() => {
    (window as any).__weatherRadarState = state;
    (window as any).__weatherRadarFetch = fetchWeatherData;
    (window as any).__weatherRadarToggle = toggle;

    return () => {
      delete (window as any).__weatherRadarState;
      delete (window as any).__weatherRadarFetch;
      delete (window as any).__weatherRadarToggle;
    };
  }, [state, fetchWeatherData, toggle]);

  return {
    ...state,
    fetchWeatherData,
    setEnabled,
    toggle,
  };
}

/**
 * Get cloud color based on type/intensity
 */
export function getCloudColor(type: CloudRegion['type'], intensity: number): string {
  const alpha = 0.4 + intensity * 0.4;

  switch (type) {
    case 'storm':
      return `rgba(80, 80, 100, ${alpha})`;
    case 'heavy':
      return `rgba(140, 140, 160, ${alpha})`;
    case 'moderate':
      return `rgba(180, 180, 200, ${alpha})`;
    case 'light':
    default:
      return `rgba(220, 220, 240, ${alpha})`;
  }
}

/**
 * Get shadow color for clouds (darker, offset version)
 */
export function getCloudShadowColor(type: CloudRegion['type'], intensity: number): string {
  const alpha = 0.15 + intensity * 0.2;

  switch (type) {
    case 'storm':
      return `rgba(20, 20, 40, ${alpha})`;
    case 'heavy':
      return `rgba(30, 30, 50, ${alpha})`;
    case 'moderate':
      return `rgba(40, 40, 60, ${alpha})`;
    case 'light':
    default:
      return `rgba(50, 50, 70, ${alpha})`;
  }
}

export default useWeatherRadar;
