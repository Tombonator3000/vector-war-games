import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { EARTH_RADIUS, MORPHING_FLAT_WIDTH, MORPHING_FLAT_HEIGHT } from '@/constants/globe.constants';
import { createMorphedGeometry, getMorphedPosition, getMorphedNormal, updateMorphedGeometry, lonLatFromUv, isProjectedPointVisible, getFlatMapCameraDistance } from '../geometry';

describe('shared map surface', () => {
  it('keeps the globe normal outward and raises flat markers above the surface', () => {
    const surface = getMorphedPosition(90, 0, 0);
    expect(surface.z).toBeCloseTo(EARTH_RADIUS);
    expect(getMorphedNormal(90, 0, 0).dot(surface)).toBeGreaterThan(0);
    expect(getMorphedPosition(90, 0, 1, EARTH_RADIUS + 0.03).z).toBeCloseTo(0.03);
    expect(getMorphedPosition(180, 90, 1).x).toBeCloseTo(MORPHING_FLAT_WIDTH / 2);
    expect(getMorphedPosition(180, 90, 1).y).toBeCloseTo(MORPHING_FLAT_HEIGHT / 2);
  });

  it.each([0, 0.35, 0.7, 1])('picks geographic coordinates from the visible surface at morph %s', factor => {
    const geometry = createMorphedGeometry(0);
    updateMorphedGeometry(geometry, factor);
    const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ side: THREE.FrontSide }));
    mesh.updateMatrixWorld();
    const camera = new THREE.PerspectiveCamera(60, 2, 0.1, 100);
    camera.position.set(0, 0, 8);
    camera.updateMatrixWorld();
    const raycaster = new THREE.Raycaster();
    for (const [lon, lat] of [[60, 20], [90, 0], [120, -20]]) {
      const point = getMorphedPosition(lon, lat, factor).project(camera);
      raycaster.setFromCamera(new THREE.Vector2(point.x, point.y), camera);
      const hit = raycaster.intersectObject(mesh)[0];
      expect(hit?.uv, 'Hit at lon=' + lon + ', lat=' + lat).toBeDefined();
      const picked = lonLatFromUv(hit.uv!);
      expect(Math.abs(picked.lon - lon)).toBeLessThan(0.15);
      expect(Math.abs(picked.lat - lat)).toBeLessThan(0.15);
    }
    mesh.material.dispose();
    geometry.dispose();
  });

  it('fits the full map on portrait screens', () => {
    const aspect = 390 / 844;
    const distance = getFlatMapCameraDistance(40, aspect);
    const visibleWidth = 2 * distance * Math.tan(THREE.MathUtils.degToRad(20)) * aspect;
    expect(visibleWidth).toBeGreaterThan(MORPHING_FLAT_WIDTH);
  });

  it('rejects back-facing, clipped and non-finite markers', () => {
    const front = new THREE.Vector3(0, 0, 1);
    const direction = new THREE.Vector3(0, 0, 4);
    expect(isProjectedPointVisible(new THREE.Vector3(0, 0, 0), front, direction)).toBe(true);
    expect(isProjectedPointVisible(new THREE.Vector3(0, 0, 0), front.clone().negate(), direction)).toBe(false);
    for (const point of [new THREE.Vector3(2, 0, 0), new THREE.Vector3(0, 0, -2), new THREE.Vector3(NaN, 0, 0)]) {
      expect(isProjectedPointVisible(point, front, direction)).toBe(false);
    }
  });
});
