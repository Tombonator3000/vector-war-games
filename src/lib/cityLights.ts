import type { City, CityNation } from '@/types/cityLights';
import { clampUnit, normalizeLongitude } from '@/lib/globe/geometry';

export function getVisibleCityCount(nation: CityNation): number {
  if (nation.population <= 0 || nation.eliminated || !Number.isFinite(nation.lat) || !Number.isFinite(nation.lon)) return 0;
  const count = nation.cities ?? 1;
  return Number.isFinite(count) ? Math.max(0, Math.min(20, Math.floor(count))) : 0;
}

/** Gameplay city clusters use the nation's map anchor; these are not named real-world cities. */
export function createCityLight(nation: CityNation, index: number): City {
  const angle = index * 2.399963229728653;
  const distance = index === 0 ? 0 : 0.45 * Math.sqrt(index);
  return {
    nationId: nation.id, index,
    lat: Math.max(-89.9, Math.min(89.9, nation.lat + Math.sin(angle) * distance)),
    lon: normalizeLongitude(nation.lon + Math.cos(angle) * distance),
    brightness: 0.85,
  };
}

export function normalizeCity(city: City): City | null {
  if (!Number.isFinite(city.lat) || !Number.isFinite(city.lon) || Math.abs(city.lat) > 90) return null;
  return { ...city, lon: normalizeLongitude(city.lon), brightness: clampUnit(city.brightness) };
}
