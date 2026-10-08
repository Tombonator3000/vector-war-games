import type { City, CityNation } from '@/types/cityLights';
import { createCityLight, getVisibleCityCount, normalizeCity } from '@/lib/cityLights';
export type { City } from '@/types/cityLights';

type ProjectCity = (lon: number, lat: number) => { x: number; y: number; visible?: boolean };

/** Shared visual state. Destruction only darkens lights; gameplay losses are resolved by combat. */
export const CityLights = {
  cities: [] as City[],
  counts: new Map<string, number>(),

  generate(nations: readonly CityNation[]): void {
    this.clear();
    this.syncNations(nations);
  },

  syncNations(nations: readonly CityNation[]): void {
    const activeIds = new Set(nations.map(nation => nation.id));
    this.cities = this.cities.filter(city => !city.nationId || activeIds.has(city.nationId));
    for (const id of this.counts.keys()) {
      if (!activeIds.has(id)) this.counts.delete(id);
    }
    for (const nation of nations) {
      const count = getVisibleCityCount(nation);
      const previous = this.counts.get(nation.id) ?? 0;
      if (count < previous) {
        this.cities = this.cities.filter(city => city.nationId !== nation.id || (city.index ?? 0) < count);
      }
      for (let index = previous; index < count; index += 1) {
        this.cities.push(createCityLight(nation, index));
      }
      this.counts.set(nation.id, count);
    }
  },

  addCity(lat: number, lon: number, brightness: number): void {
    const city = normalizeCity({ lat, lon, brightness });
    if (city) this.cities.push(city);
  },

  destroyNear(x: number, y: number, radius: number, projectFn: ProjectCity): number {
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(radius) || radius <= 0) return 0;
    const before = this.cities.length;
    this.cities = this.cities.filter(city => {
      const point = projectFn(city.lon, city.lat);
      return point.visible === false || !Number.isFinite(point.x) || !Number.isFinite(point.y)
        || Math.hypot(point.x - x, point.y - y) >= radius;
    });
    return before - this.cities.length;
  },

  clear(): void {
    this.cities = [];
    this.counts.clear();
  },

  getCities(): City[] {
    return this.cities.map(city => ({ ...city }));
  },

  setCities(cities: readonly City[]): void {
    this.clear();
    this.cities = cities.map(normalizeCity).filter((city): city is City => city !== null);
  },
};
