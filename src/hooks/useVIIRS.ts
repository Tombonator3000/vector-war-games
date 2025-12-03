/**
 * useVIIRS - Hook for fetching and managing NASA FIRMS VIIRS fire detection data
 *
 * Fetches near real-time active fire data from NASA's Fire Information for Resource
 * Management System (FIRMS). Data comes from VIIRS sensors on Suomi NPP, NOAA-20,
 * and NOAA-21 satellites.
 *
 * Reference: https://firms.modaps.eosdis.nasa.gov/api/
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface VIIRSFirePoint {
  /** Latitude of fire detection */
  latitude: number;
  /** Longitude of fire detection */
  longitude: number;
  /** Brightness temperature (Kelvin) - higher = more intense */
  brightness: number;
  /** Fire Radiative Power (MW) - energy output of the fire */
  frp: number;
  /** Acquisition date (YYYY-MM-DD) */
  acq_date: string;
  /** Acquisition time (HHMM) */
  acq_time: string;
  /** Satellite source: 'N' = Suomi NPP, 'N20' = NOAA-20, 'N21' = NOAA-21 */
  satellite: string;
  /** Confidence level: 'l' = low, 'n' = nominal, 'h' = high */
  confidence: 'l' | 'n' | 'h';
  /** Day or night acquisition: 'D' or 'N' */
  daynight: 'D' | 'N';
}

export interface VIIRSState {
  /** Array of active fire detections */
  fires: VIIRSFirePoint[];
  /** Whether data is currently being fetched */
  loading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Timestamp of last successful fetch */
  lastUpdated: number | null;
  /** Whether the VIIRS layer is enabled */
  enabled: boolean;
}

// Cache duration: 15 minutes (fires don't change that fast)
const CACHE_DURATION_MS = 15 * 60 * 1000;

// Local storage key for caching
const VIIRS_CACHE_KEY = 'norad_viirs_cache';
const VIIRS_ENABLED_KEY = 'norad_viirs_enabled';

// NASA FIRMS provides a demo key for limited usage
// For production, register at: https://firms.modaps.eosdis.nasa.gov/api/map_key/
const FIRMS_MAP_KEY = 'DEMO_KEY';

// Fallback sample data for when API is unavailable
const SAMPLE_FIRE_DATA: VIIRSFirePoint[] = [
  // Amazon fires
  { latitude: -3.4653, longitude: -62.2159, brightness: 330, frp: 25.5, acq_date: '2024-01-15', acq_time: '0530', satellite: 'N20', confidence: 'h', daynight: 'N' },
  { latitude: -8.7612, longitude: -63.9039, brightness: 315, frp: 18.2, acq_date: '2024-01-15', acq_time: '0530', satellite: 'N20', confidence: 'n', daynight: 'N' },
  { latitude: -10.9234, longitude: -61.5421, brightness: 340, frp: 32.1, acq_date: '2024-01-15', acq_time: '0530', satellite: 'N', confidence: 'h', daynight: 'N' },
  // African fires
  { latitude: -15.4167, longitude: 28.2833, brightness: 320, frp: 22.3, acq_date: '2024-01-15', acq_time: '1230', satellite: 'N20', confidence: 'h', daynight: 'D' },
  { latitude: -12.8456, longitude: 28.7891, brightness: 310, frp: 15.7, acq_date: '2024-01-15', acq_time: '1230', satellite: 'N', confidence: 'n', daynight: 'D' },
  { latitude: -8.2341, longitude: 25.1234, brightness: 325, frp: 28.9, acq_date: '2024-01-15', acq_time: '1230', satellite: 'N21', confidence: 'h', daynight: 'D' },
  { latitude: 12.3456, longitude: 2.3456, brightness: 305, frp: 12.4, acq_date: '2024-01-15', acq_time: '1230', satellite: 'N20', confidence: 'n', daynight: 'D' },
  // Southeast Asian fires
  { latitude: -2.5489, longitude: 111.4521, brightness: 335, frp: 29.8, acq_date: '2024-01-15', acq_time: '0630', satellite: 'N20', confidence: 'h', daynight: 'N' },
  { latitude: 18.7654, longitude: 98.9876, brightness: 318, frp: 21.1, acq_date: '2024-01-15', acq_time: '0630', satellite: 'N', confidence: 'h', daynight: 'D' },
  // Australian fires
  { latitude: -33.8688, longitude: 151.2093, brightness: 315, frp: 19.5, acq_date: '2024-01-15', acq_time: '0200', satellite: 'N20', confidence: 'n', daynight: 'N' },
  { latitude: -37.8136, longitude: 144.9631, brightness: 322, frp: 24.7, acq_date: '2024-01-15', acq_time: '0200', satellite: 'N21', confidence: 'h', daynight: 'N' },
  // Siberian fires
  { latitude: 62.0339, longitude: 129.7331, brightness: 312, frp: 17.8, acq_date: '2024-01-15', acq_time: '0430', satellite: 'N', confidence: 'n', daynight: 'N' },
  { latitude: 58.5234, longitude: 125.1234, brightness: 328, frp: 26.3, acq_date: '2024-01-15', acq_time: '0430', satellite: 'N20', confidence: 'h', daynight: 'N' },
  // California wildfires
  { latitude: 34.0522, longitude: -118.2437, brightness: 342, frp: 35.2, acq_date: '2024-01-15', acq_time: '0830', satellite: 'N20', confidence: 'h', daynight: 'D' },
  { latitude: 37.7749, longitude: -122.4194, brightness: 308, frp: 14.6, acq_date: '2024-01-15', acq_time: '0830', satellite: 'N', confidence: 'l', daynight: 'D' },
  // Mediterranean fires
  { latitude: 38.7223, longitude: 23.1256, brightness: 319, frp: 20.9, acq_date: '2024-01-15', acq_time: '1100', satellite: 'N21', confidence: 'h', daynight: 'D' },
  { latitude: 41.9028, longitude: 12.4964, brightness: 305, frp: 11.2, acq_date: '2024-01-15', acq_time: '1100', satellite: 'N20', confidence: 'n', daynight: 'D' },
  // Middle East gas flares (often detected as fires)
  { latitude: 29.3117, longitude: 47.4818, brightness: 380, frp: 85.3, acq_date: '2024-01-15', acq_time: '1400', satellite: 'N', confidence: 'h', daynight: 'D' },
  { latitude: 26.0667, longitude: 50.5577, brightness: 375, frp: 78.9, acq_date: '2024-01-15', acq_time: '1400', satellite: 'N20', confidence: 'h', daynight: 'D' },
  // Canadian wildfires
  { latitude: 53.5461, longitude: -113.4938, brightness: 325, frp: 27.4, acq_date: '2024-01-15', acq_time: '0700', satellite: 'N20', confidence: 'h', daynight: 'D' },
  { latitude: 49.2827, longitude: -123.1207, brightness: 310, frp: 16.8, acq_date: '2024-01-15', acq_time: '0700', satellite: 'N21', confidence: 'n', daynight: 'D' },
];

interface CachedData {
  fires: VIIRSFirePoint[];
  timestamp: number;
}

function loadCachedData(): CachedData | null {
  try {
    const cached = localStorage.getItem(VIIRS_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as CachedData;
      if (Date.now() - parsed.timestamp < CACHE_DURATION_MS) {
        return parsed;
      }
    }
  } catch {
    // Cache read failed, continue without cache
  }
  return null;
}

function saveCachedData(fires: VIIRSFirePoint[]): void {
  try {
    const data: CachedData = {
      fires,
      timestamp: Date.now(),
    };
    localStorage.setItem(VIIRS_CACHE_KEY, JSON.stringify(data));
  } catch {
    // Cache write failed, continue without caching
  }
}

function loadEnabledState(): boolean {
  try {
    const stored = localStorage.getItem(VIIRS_ENABLED_KEY);
    return stored === 'true';
  } catch {
    return false;
  }
}

function saveEnabledState(enabled: boolean): void {
  try {
    localStorage.setItem(VIIRS_ENABLED_KEY, String(enabled));
  } catch {
    // Storage failed, continue
  }
}

/**
 * Parse CSV response from NASA FIRMS API
 */
function parseVIIRSCSV(csv: string): VIIRSFirePoint[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const latIdx = headers.indexOf('latitude');
  const lonIdx = headers.indexOf('longitude');
  const brightIdx = headers.indexOf('bright_ti4') !== -1 ? headers.indexOf('bright_ti4') : headers.indexOf('brightness');
  const frpIdx = headers.indexOf('frp');
  const dateIdx = headers.indexOf('acq_date');
  const timeIdx = headers.indexOf('acq_time');
  const satIdx = headers.indexOf('satellite');
  const confIdx = headers.indexOf('confidence');
  const dayNightIdx = headers.indexOf('daynight');

  const fires: VIIRSFirePoint[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length < headers.length) continue;

    const lat = parseFloat(values[latIdx]);
    const lon = parseFloat(values[lonIdx]);
    const brightness = parseFloat(values[brightIdx]) || 300;
    const frp = parseFloat(values[frpIdx]) || 0;

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

    fires.push({
      latitude: lat,
      longitude: lon,
      brightness,
      frp,
      acq_date: values[dateIdx] || '',
      acq_time: values[timeIdx] || '',
      satellite: values[satIdx] || 'N20',
      confidence: (values[confIdx]?.toLowerCase() as 'l' | 'n' | 'h') || 'n',
      daynight: (values[dayNightIdx]?.toUpperCase() as 'D' | 'N') || 'D',
    });
  }

  return fires;
}

export function useVIIRS() {
  const [state, setState] = useState<VIIRSState>(() => {
    const cached = loadCachedData();
    return {
      fires: cached?.fires ?? [],
      loading: false,
      error: null,
      lastUpdated: cached?.timestamp ?? null,
      enabled: loadEnabledState(),
    };
  });

  const fetchingRef = useRef(false);

  const fetchFires = useCallback(async (forceRefresh = false) => {
    // Prevent concurrent fetches
    if (fetchingRef.current) return;

    // Check cache first (unless forcing refresh)
    if (!forceRefresh) {
      const cached = loadCachedData();
      if (cached) {
        setState(prev => ({
          ...prev,
          fires: cached.fires,
          lastUpdated: cached.timestamp,
          loading: false,
          error: null,
        }));
        return;
      }
    }

    fetchingRef.current = true;
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Try to fetch from NASA FIRMS API
      // Using VIIRS_NOAA20_NRT for NOAA-20 satellite data, last 24 hours, worldwide
      const apiUrl = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${FIRMS_MAP_KEY}/VIIRS_NOAA20_NRT/world/1`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/csv',
        },
      });

      if (!response.ok) {
        throw new Error(`FIRMS API returned ${response.status}`);
      }

      const csvData = await response.text();
      const fires = parseVIIRSCSV(csvData);

      if (fires.length === 0) {
        throw new Error('No fire data returned from API');
      }

      // Sample the data to avoid performance issues (keep max 500 points)
      const sampledFires = fires.length > 500
        ? fires.filter((_, i) => i % Math.ceil(fires.length / 500) === 0).slice(0, 500)
        : fires;

      saveCachedData(sampledFires);

      setState(prev => ({
        ...prev,
        fires: sampledFires,
        loading: false,
        error: null,
        lastUpdated: Date.now(),
      }));
    } catch (error) {
      console.warn('VIIRS API fetch failed, using sample data:', error);

      // Use sample data as fallback
      setState(prev => ({
        ...prev,
        fires: SAMPLE_FIRE_DATA,
        loading: false,
        error: 'Using sample data (API unavailable)',
        lastUpdated: Date.now(),
      }));
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    saveEnabledState(enabled);
    setState(prev => ({ ...prev, enabled }));

    // Fetch data when enabling if we don't have any
    if (enabled && state.fires.length === 0) {
      fetchFires();
    }
  }, [fetchFires, state.fires.length]);

  const toggle = useCallback(() => {
    setEnabled(!state.enabled);
  }, [setEnabled, state.enabled]);

  // Fetch fires when enabled and no data
  useEffect(() => {
    if (state.enabled && state.fires.length === 0 && !state.loading) {
      fetchFires();
    }
  }, [state.enabled, state.fires.length, state.loading, fetchFires]);

  // Expose state and controls to window for integration with canvas rendering
  useEffect(() => {
    (window as any).__viirsState = state;
    (window as any).__viirsFetch = fetchFires;
    (window as any).__viirsToggle = toggle;

    return () => {
      delete (window as any).__viirsState;
      delete (window as any).__viirsFetch;
      delete (window as any).__viirsToggle;
    };
  }, [state, fetchFires, toggle]);

  return {
    ...state,
    fetchFires,
    setEnabled,
    toggle,
  };
}

/**
 * Get fire intensity color based on brightness temperature
 * Brighter = more intense = more red/white
 */
export function getFireColor(brightness: number, confidence: 'l' | 'n' | 'h'): string {
  // Normalize brightness (typical range 300-400K)
  const intensity = Math.min(1, Math.max(0, (brightness - 300) / 100));

  // Base alpha on confidence
  const alphaBase = confidence === 'h' ? 0.9 : confidence === 'n' ? 0.7 : 0.5;

  // Interpolate from orange to bright yellow/white based on intensity
  const r = 255;
  const g = Math.round(100 + intensity * 155); // 100-255
  const b = Math.round(intensity * 100); // 0-100

  return `rgba(${r},${g},${b},${alphaBase})`;
}

/**
 * Get fire point radius based on FRP (Fire Radiative Power)
 */
export function getFireRadius(frp: number): number {
  // Normalize FRP (typical range 0-100 MW)
  const normalized = Math.min(1, Math.max(0, frp / 50));
  // Base radius 3-8 pixels
  return 3 + normalized * 5;
}

export default useVIIRS;
