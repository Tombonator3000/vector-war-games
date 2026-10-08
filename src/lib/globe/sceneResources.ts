import * as THREE from 'three';
import type { MissileTrajectoryInstance } from '@/lib/missileTrajectories';
import { MATERIAL_TEXTURE_KEYS } from '@/constants/globe.constants';
import { getMorphedPosition } from './geometry';

export function latLonToVector3(lon: number, lat: number, radius: number, target?: THREE.Vector3): THREE.Vector3 {
  return getMorphedPosition(lon, lat, 0, radius, target);
}

export function resolveCssRendererSize(
  renderer: (THREE.WebGLRenderer & { domElement?: HTMLCanvasElement | null }) | undefined,
  size: { width: number; height: number },
) {
  const pixelRatio = renderer && typeof renderer.getPixelRatio === 'function' ? renderer.getPixelRatio() : 1;
  const domElement = renderer?.domElement ?? null;

  const fallbackWidth = pixelRatio > 0 ? size.width / pixelRatio : size.width;
  const fallbackHeight = pixelRatio > 0 ? size.height / pixelRatio : size.height;

  const width = Math.max(1, domElement?.clientWidth ?? fallbackWidth ?? 1);
  const height = Math.max(1, domElement?.clientHeight ?? fallbackHeight ?? 1);

  return { width, height };
}

export function disposeMaterial(material?: THREE.Material | THREE.Material[]) {
  if (!material) return;

  if (Array.isArray(material)) {
    material.forEach(disposeMaterial);
    return;
  }

  MATERIAL_TEXTURE_KEYS.forEach(key => {
    const value = (material as unknown as Record<string, unknown>)[key];
    if (value instanceof THREE.Texture) {
      value.dispose();
    }
  });

  material.dispose();
}

export function disposeObject(object?: THREE.Object3D | null) {
  if (!object) return;

  object.traverse(child => {
    if (child instanceof THREE.Mesh || child instanceof THREE.Line || child instanceof THREE.Points) {
      const geometry = (child as THREE.Mesh).geometry;
      if (geometry instanceof THREE.BufferGeometry) {
        geometry.dispose();
      }
    }

    if (
      child instanceof THREE.Mesh ||
      child instanceof THREE.Line ||
      child instanceof THREE.Points ||
      child instanceof THREE.Sprite
    ) {
      disposeMaterial((child as { material?: THREE.Material | THREE.Material[] }).material);
    }
  });
}

export function disposeMissileInstance(instance?: MissileTrajectoryInstance | null) {
  if (!instance) return;
  disposeObject(instance.line);
  if (instance.trail) {
    disposeObject(instance.trail);
  }
}

export function disposeExplosionGroup(group?: THREE.Group | null) {
  if (!group) return;
  disposeObject(group);
}

