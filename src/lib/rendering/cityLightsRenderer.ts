import type { City } from '@/types/cityLights';
import type { ProjectedPoint } from '@/lib/renderingUtils';
import { clampUnit } from '@/lib/globe/geometry';

/** Small fixed-size lights stay aligned with the map and do not become billboard circles. */
export function drawCityLights(
  context: CanvasRenderingContext2D, cities: readonly City[],
  project: (lon: number, lat: number) => ProjectedPoint, nightBlend = 0, nowMs = Date.now(),
): void {
  if (!cities.length) return;
  const night = clampUnit(nightBlend);
  context.save();
  context.globalCompositeOperation = 'source-over';
  context.shadowColor = '#ffe5a0';
  context.shadowBlur = night * 3;
  for (const city of cities) {
    const point = project(city.lon, city.lat);
    if (!point.visible || !Number.isFinite(point.x) || !Number.isFinite(point.y)) continue;
    const flicker = 0.92 + Math.sin(nowMs * 0.003 + city.lon + city.lat) * 0.08;
    context.globalAlpha = clampUnit(city.brightness) * flicker * (0.45 + night * 0.55);
    context.fillStyle = '#ffdf86';
    context.fillRect(point.x - 1, point.y - 1, 2, 2);
  }
  context.restore();
}
