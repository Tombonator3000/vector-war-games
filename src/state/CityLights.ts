/**
 * CityLights State Manager
 *
 * Manages the city lights visualization system.
 * Extracted from Index.tsx to support modularization.
 *
 * Note: The rendering logic remains in Index.tsx due to canvas context dependencies.
 * This module provides state management for the city light data.
 */

export interface City {
  lat: number;
  lon: number;
  brightness: number;
}

/**
 * CityLights singleton for managing city light state
 */
export const CityLights = {
  cities: [] as City[],

  /**
   * Add a new city light to the map
   * @param lat - Latitude coordinate
   * @param lon - Longitude coordinate
   * @param brightness - Light brightness (0-1)
   */
  addCity(lat: number, lon: number, brightness: number): void {
    this.cities.push({ lat, lon, brightness });
  },

  /**
   * Remove cities within a radius (e.g., from nuclear blast)
   * @param x - X coordinate on canvas
   * @param y - Y coordinate on canvas
   * @param radius - Destruction radius
   * @param projectFn - Function to project lat/lon to x/y coordinates
   * @returns Number of cities destroyed
   */
  destroyNear(
    x: number,
    y: number,
    radius: number,
    projectFn: (lon: number, lat: number) => { x: number; y: number }
  ): number {
    let destroyed = 0;
    this.cities = this.cities.filter(city => {
      const { x: cx, y: cy } = projectFn(city.lon, city.lat);
      const dist = Math.hypot(cx - x, cy - y);
      if (dist < radius) {
        destroyed++;
        return false;
      }
      return true;
    });
    return destroyed;
  },

  /**
   * Clear all city lights
   */
  clear(): void {
    this.cities = [];
  },

  /**
   * Get all cities
   * @returns Array of city light data
   */
  getCities(): City[] {
    return this.cities;
  },

  /**
   * Set cities directly (useful for initialization)
   * @param cities - Array of city data
   */
  setCities(cities: City[]): void {
    this.cities = cities;
  },
};
