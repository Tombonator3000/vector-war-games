import * as THREE from 'three';
import { EARTH_RADIUS, MORPHING_FLAT_WIDTH, MORPHING_FLAT_HEIGHT, SURFACE_SEGMENTS } from '@/constants/globe.constants';

export function clampUnit(value: number, fallback = 0): number {
  return Number.isFinite(value) ? THREE.MathUtils.clamp(value, 0, 1) : fallback;
}

export function normalizeLongitude(lon: number): number {
  if (!Number.isFinite(lon)) return 0;
  const wrapped = ((lon + 180) % 360 + 360) % 360 - 180;
  return wrapped === -180 && lon > 0 ? 180 : wrapped;
}

export function getMorphedPosition(
  lon: number, lat: number, morphFactor: number, radius = EARTH_RADIUS,
  target = new THREE.Vector3(),
): THREE.Vector3 {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lon);
  const factor = clampUnit(morphFactor);
  const globeScale = 1 - factor;
  const snap = (value: number) => Math.abs(value) < 1e-12 ? 0 : value;
  return target.set(
    snap(-radius * Math.sin(phi) * Math.cos(theta) * globeScale + lon / 360 * MORPHING_FLAT_WIDTH * factor),
    snap(radius * Math.cos(phi) * globeScale + lat / 180 * MORPHING_FLAT_HEIGHT * factor),
    snap(radius * Math.sin(phi) * Math.sin(theta) * globeScale + (radius - EARTH_RADIUS) * factor),
  );
}

export function getMorphedNormal(lon: number, lat: number, factor: number, target = new THREE.Vector3()): THREE.Vector3 {
  getMorphedPosition(lon, lat, 0, 1, target);
  target.multiplyScalar(1 - clampUnit(factor));
  target.z += clampUnit(factor);
  return target.normalize();
}

export function lonLatFromUv(uv: { x: number; y: number }): { lon: number; lat: number } {
  return { lon: normalizeLongitude(uv.x * 360 - 180), lat: THREE.MathUtils.clamp(uv.y * 180 - 90, -90, 90) };
}

/** Keep the CPU surface identical to the vertex shader so raycasting hits the visible map. */
export function updateMorphedGeometry(geometry: THREE.BufferGeometry, factor: number): void {
  const uv = geometry.getAttribute('uv');
  const position = geometry.getAttribute('position');
  const target = new THREE.Vector3();
  for (let i = 0; i < uv.count; i += 1) {
    getMorphedPosition(uv.getX(i) * 360 - 180, uv.getY(i) * 180 - 90, factor, EARTH_RADIUS, target);
    position.setXYZ(i, target.x, target.y, target.z);
  }
  position.needsUpdate = true;
}

export function createMorphedGeometry(factor: number): THREE.PlaneGeometry {
  const geometry = new THREE.PlaneGeometry(1, 1, SURFACE_SEGMENTS.width, SURFACE_SEGMENTS.height);
  updateMorphedGeometry(geometry, factor);
  // A fixed bound covers every intermediate shape without recomputing it each frame.
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), Math.hypot(MORPHING_FLAT_WIDTH / 2, MORPHING_FLAT_HEIGHT / 2));
  return geometry;
}

export function easeMorph(t: number): number {
  const progress = clampUnit(t);
  return progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
}

/** Shared visibility for city lights, nation labels, and targeting overlays. */
export function isProjectedPointVisible(point: THREE.Vector3, normal: THREE.Vector3, cameraToSurface: THREE.Vector3): boolean {
  return Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z)
    && Math.abs(point.x) <= 1 && Math.abs(point.y) <= 1 && point.z >= -1 && point.z <= 1
    && normal.dot(cameraToSurface) > 0;
}

/** Fit the full 2:1 world map on desktop and portrait displays. */
export function getFlatMapCameraDistance(fovDegrees: number, aspect: number): number {
  const verticalFov = THREE.MathUtils.degToRad(fovDegrees);
  const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : 1;
  return Math.max(MORPHING_FLAT_HEIGHT / 2, MORPHING_FLAT_WIDTH / (2 * safeAspect))
    / Math.tan(verticalFov / 2) * 1.08;
}
