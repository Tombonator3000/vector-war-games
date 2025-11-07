import { describe, expect, it } from 'vitest';
import * as THREE from 'three';

import { createMissileTrajectory, updateMissileAnimation } from '../missileTrajectories';

const latLonToVector3 = (lon: number, lat: number, radius: number): THREE.Vector3 => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
};

describe('missileTrajectories', () => {
  it('keeps the final point visible when the trajectory completes', () => {
    const instance = createMissileTrajectory(
      {
        id: 'unit-test',
        from: { lon: 0, lat: 0 },
        to: { lon: 15, lat: 10 },
        duration: 5,
        type: 'ballistic'
      },
      latLonToVector3,
      1
    );

    const lineMaterialVersionBefore =
      instance.line.material instanceof THREE.LineBasicMaterial ? instance.line.material.version : undefined;
    const trailMaterialVersionBefore =
      instance.trail?.material instanceof THREE.LineBasicMaterial ? instance.trail.material.version : undefined;

    instance.startTime = 0;

    updateMissileAnimation(instance, instance.duration);

    const finalPoint = instance.allPoints[instance.allPoints.length - 1];

    const linePositions = instance.line.geometry.getAttribute('position');
    const lineTerminal = new THREE.Vector3(
      linePositions.getX(linePositions.count - 1),
      linePositions.getY(linePositions.count - 1),
      linePositions.getZ(linePositions.count - 1)
    );

    expect(lineTerminal.distanceTo(finalPoint)).toBeLessThan(1e-6);
    expect(instance.markerPosition.distanceTo(finalPoint)).toBeLessThan(1e-6);

    if (instance.trail) {
      const trailPositions = instance.trail.geometry.getAttribute('position');
      const trailTerminal = new THREE.Vector3(
        trailPositions.getX(trailPositions.count - 1),
        trailPositions.getY(trailPositions.count - 1),
        trailPositions.getZ(trailPositions.count - 1)
      );

      expect(trailTerminal.distanceTo(finalPoint)).toBeLessThan(1e-6);
      expect(instance.trail.material instanceof THREE.LineBasicMaterial).toBe(true);
      if (instance.trail.material instanceof THREE.LineBasicMaterial && trailMaterialVersionBefore !== undefined) {
        expect(instance.trail.material.version).toBeGreaterThan(trailMaterialVersionBefore);
      }
    }

    expect(instance.line.material instanceof THREE.LineBasicMaterial).toBe(true);
    if (instance.line.material instanceof THREE.LineBasicMaterial && lineMaterialVersionBefore !== undefined) {
      expect(instance.line.material.version).toBeGreaterThan(lineMaterialVersionBefore);
      expect(instance.line.material.opacity).toBeGreaterThan(0);
    }
  });
});
