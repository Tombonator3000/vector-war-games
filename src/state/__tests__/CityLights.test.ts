import { beforeEach, describe, expect, it } from 'vitest';
import { CityLights } from '../CityLights';
import type { CityNation } from '@/types/cityLights';

const nation = (cities = 1): CityNation => ({ id: 'player', lon: 179.9, lat: 20, population: 100, cities });
beforeEach(() => CityLights.clear());

describe('gameplay city lights', () => {
  it('generates stable clusters and reflects player construction without duplication', () => {
    CityLights.generate([nation()]);
    const initial = CityLights.getCities();
    expect(initial).toHaveLength(1);
    expect(initial[0]).toMatchObject({ lat: 20, nationId: 'player' });
    expect(initial[0].lon).toBeCloseTo(179.9);
    CityLights.syncNations([nation(3)]);
    CityLights.syncNations([nation(3)]);
    expect(CityLights.getCities()).toHaveLength(3);
    expect(CityLights.getCities()[0]).toEqual(initial[0]);
    expect(CityLights.getCities().every(city => Math.abs(city.lon) <= 180 && Math.abs(city.lat) <= 90)).toBe(true);
  });

  it('does not destroy cities on the hidden hemisphere or relight destroyed cities every frame', () => {
    CityLights.generate([nation(2)]);
    const destroyed = CityLights.destroyNear(10, 10, 5, lon => ({ x: 10, y: 10, visible: lon > 179.8 }));
    expect(destroyed).toBe(1);
    CityLights.syncNations([nation(2)]);
    expect(CityLights.getCities()).toHaveLength(1);
  });

  it('clears previous sessions and removes eliminated nations and legitimate zero cities', () => {
    CityLights.generate([nation(3)]);
    CityLights.syncNations([nation(0)]);
    expect(CityLights.getCities()).toHaveLength(0);
    CityLights.generate([nation(2)]);
    CityLights.syncNations([{ ...nation(2), eliminated: true }]);
    expect(CityLights.getCities()).toHaveLength(0);
    CityLights.generate([nation(1)]);
    CityLights.syncNations([]);
    expect(CityLights.getCities()).toHaveLength(0);
  });

  it('protects input and output snapshots and ignores invalid coordinates', () => {
    const input = [{ lat: 0, lon: 0, brightness: 5 }];
    CityLights.setCities(input);
    input[0].lat = 30;
    const output = CityLights.getCities();
    output[0].lat = 40;
    expect(CityLights.getCities()[0]).toEqual({ lat: 0, lon: 0, brightness: 1 });
    CityLights.addCity(NaN, 0, 1);
    expect(CityLights.getCities()).toHaveLength(1);
  });
});
