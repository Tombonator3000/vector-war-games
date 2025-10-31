/**
 * Rendering Utility Functions
 *
 * Coordinate projection and conversion utilities for the game canvas.
 * Extracted from Index.tsx as part of refactoring effort.
 */

import type { PickerFn, ProjectorFn } from '@/components/GlobeScene';

export interface Camera {
  x: number;
  y: number;
  zoom: number;
  targetZoom: number;
}

export interface ProjectionContext {
  W: number;
  H: number;
  cam: Camera;
  globeProjector: ProjectorFn | null;
  globePicker: PickerFn | null;
}

/**
 * Project longitude/latitude coordinates to screen coordinates
 */
export function project(
  lon: number,
  lat: number,
  context: ProjectionContext
): [number, number] {
  const { W, H, cam, globeProjector } = context;

  if (globeProjector) {
    const { x, y } = globeProjector(lon, lat);
    return [x, y];
  }

  const x = ((lon + 180) / 360) * W * cam.zoom + cam.x;
  const y = ((90 - lat) / 180) * H * cam.zoom + cam.y;
  return [x, y];
}

/**
 * Convert screen coordinates to longitude/latitude
 */
export function toLonLat(
  x: number,
  y: number,
  context: ProjectionContext
): [number, number] {
  const { W, H, cam, globePicker } = context;

  if (globePicker) {
    const hit = globePicker(x, y);
    if (hit) {
      return [hit.lon, hit.lat];
    }
  }

  // Account for camera transformation
  const adjustedX = (x - cam.x) / cam.zoom;
  const adjustedY = (y - cam.y) / cam.zoom;
  const lon = (adjustedX / W) * 360 - 180;
  const lat = 90 - (adjustedY / H) * 180;
  return [lon, lat];
}

/**
 * Political color palette for nation rendering
 */
export const POLITICAL_COLOR_PALETTE = [
  '#f94144',
  '#f3722c',
  '#f9c74f',
  '#90be6d',
  '#43aa8b',
  '#577590',
  '#f9844a',
  '#ffafcc'
];

/**
 * Get political fill color for a nation by index
 */
export function getPoliticalFill(index: number): string {
  return POLITICAL_COLOR_PALETTE[index % POLITICAL_COLOR_PALETTE.length];
}

/**
 * Resolve a public asset path for the application
 */
export function resolvePublicAssetPath(assetPath: string): string {
  const base = import.meta.env.BASE_URL ?? '/';
  const trimmedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const trimmedAsset = assetPath.startsWith('/') ? assetPath.slice(1) : assetPath;
  return `${trimmedBase}/${trimmedAsset}`;
}
