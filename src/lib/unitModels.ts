/**
 * 3D unit model loading and rendering for Three.js
 * Ported from Cesium implementation as part of Phase 2 deprecation plan
 *
 * Supports both 3D GLTF models and billboard sprites for performance
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export interface Unit {
  id: string;
  lon: number;
  lat: number;
  type: string;
  model?: string;
  color?: string;
  scale?: number;
}

export interface UnitVisualization {
  id: string;
  mesh: THREE.Object3D;
  position: THREE.Vector3;
  type: 'model' | 'billboard';
}

/**
 * Convert lat/lon coordinates to 3D vector position
 */
type LatLonToVector3Fn = (lon: number, lat: number, radius: number) => THREE.Vector3;

/**
 * GLTF loader instance (singleton)
 */
const gltfLoader = new GLTFLoader();

/**
 * Model cache to avoid loading same model multiple times
 * Limited to prevent unbounded memory growth
 */
const MAX_CACHE_SIZE = 50;
const modelCache = new Map<string, THREE.Group>();
const cacheAccessOrder: string[] = [];

/**
 * Helper function to dispose a THREE.Group and all its children
 */
function disposeModel(model: THREE.Group): void {
  model.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => mat.dispose());
        } else {
          child.material.dispose();
        }
      }
    }
  });
}

/**
 * Update LRU cache access order
 */
function touchCacheEntry(path: string): void {
  const index = cacheAccessOrder.indexOf(path);
  if (index > -1) {
    cacheAccessOrder.splice(index, 1);
  }
  cacheAccessOrder.push(path);
}

/**
 * Evict least recently used model from cache if over limit
 */
function evictLRUIfNeeded(): void {
  while (modelCache.size >= MAX_CACHE_SIZE && cacheAccessOrder.length > 0) {
    const oldestPath = cacheAccessOrder.shift();
    if (oldestPath) {
      const model = modelCache.get(oldestPath);
      if (model) {
        disposeModel(model);
        modelCache.delete(oldestPath);
      }
    }
  }
}

/**
 * Unit type to model path mapping
 */
export const UNIT_MODEL_PATHS: Record<string, {
  path: string;
  scale: number;
  heightOffset: number;
  rotationY?: number;
}> = {
  'tank': {
    path: '/models/units/tank.glb',
    scale: 0.03,
    heightOffset: 0.02,
  },
  'armored_corps': {
    path: '/models/units/tank.glb',
    scale: 0.03,
    heightOffset: 0.02,
  },
  'aircraft': {
    path: '/models/units/aircraft.glb',
    scale: 0.04,
    heightOffset: 0.1,
  },
  'air_wing': {
    path: '/models/units/aircraft.glb',
    scale: 0.04,
    heightOffset: 0.1,
  },
  'ship': {
    path: '/models/units/ship.glb',
    scale: 0.035,
    heightOffset: 0.01,
  },
  'carrier_fleet': {
    path: '/models/units/carrier.glb',
    scale: 0.05,
    heightOffset: 0.01,
  },
  'submarine': {
    path: '/models/units/submarine.glb',
    scale: 0.03,
    heightOffset: 0.005,
  },
  'missile_site': {
    path: '/models/units/missile.glb',
    scale: 0.025,
    heightOffset: 0.02,
  }
};

/**
 * Load a 3D GLTF model for a unit type
 */
export async function loadUnitModel(unitType: string): Promise<THREE.Group> {
  const modelInfo = UNIT_MODEL_PATHS[unitType];
  if (!modelInfo) {
    throw new Error(`No model configured for unit type: ${unitType}`);
  }

  // Check cache first
  if (modelCache.has(modelInfo.path)) {
    touchCacheEntry(modelInfo.path);
    return modelCache.get(modelInfo.path)!.clone();
  }

  try {
    // Evict LRU entries if cache is full
    evictLRUIfNeeded();

    const gltf = await gltfLoader.loadAsync(modelInfo.path);
    modelCache.set(modelInfo.path, gltf.scene);
    touchCacheEntry(modelInfo.path);
    return gltf.scene.clone();
  } catch (error) {
    console.warn(`Failed to load model for ${unitType}:`, error);
    // Return fallback geometric shape
    return createFallbackModel(unitType);
  }
}

/**
 * Create fallback geometric model if GLTF loading fails
 */
function createFallbackModel(unitType: string): THREE.Group {
  const group = new THREE.Group();

  let geometry: THREE.BufferGeometry;
  let color: number;

  // Different shapes for different unit types
  switch (unitType) {
    case 'aircraft':
    case 'air_wing':
      geometry = new THREE.ConeGeometry(0.02, 0.05, 4);
      color = 0x00aaff;
      break;
    case 'ship':
    case 'carrier_fleet':
      geometry = new THREE.BoxGeometry(0.04, 0.01, 0.02);
      color = 0x0066cc;
      break;
    case 'submarine':
      geometry = new THREE.CapsuleGeometry(0.01, 0.04, 4, 8);
      color = 0x003366;
      break;
    case 'missile_site':
      geometry = new THREE.CylinderGeometry(0.01, 0.01, 0.06, 8);
      color = 0xff0000;
      break;
    case 'tank':
    case 'armored_corps':
    default:
      geometry = new THREE.BoxGeometry(0.03, 0.02, 0.02);
      color = 0x00ff00;
      break;
  }

  const material = new THREE.MeshStandardMaterial({ color });
  const mesh = new THREE.Mesh(geometry, material);
  group.add(mesh);

  return group;
}

/**
 * Canvas pool for reusing canvas elements (prevents memory leaks)
 */
const canvasPool: HTMLCanvasElement[] = [];
const MAX_CANVAS_POOL_SIZE = 100;

/**
 * Get a canvas from pool or create new one
 */
function getCanvas(): HTMLCanvasElement {
  const canvas = canvasPool.pop();
  if (canvas) {
    // Clear the canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    return canvas;
  }
  const newCanvas = document.createElement('canvas');
  newCanvas.width = 64;
  newCanvas.height = 64;
  return newCanvas;
}

/**
 * Return canvas to pool for reuse
 */
function returnCanvas(canvas: HTMLCanvasElement): void {
  if (canvasPool.length < MAX_CANVAS_POOL_SIZE) {
    canvasPool.push(canvas);
  }
}

/**
 * Create billboard sprite for a unit (2D icon in 3D space)
 * More performant than 3D models for large numbers of units
 * Uses canvas pooling to prevent memory leaks
 */
export function createUnitBillboard(
  unit: Unit,
  latLonToVector3: LatLonToVector3Fn,
  radius: number
): UnitVisualization {
  const position = latLonToVector3(unit.lon, unit.lat, radius + 0.05);

  // Get canvas from pool
  const canvas = getCanvas();
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Draw unit icon
    ctx.fillStyle = unit.color || '#00ff00';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;

    // Different icons for different unit types
    switch (unit.type) {
      case 'aircraft':
      case 'air_wing':
        // Triangle pointing up
        ctx.beginPath();
        ctx.moveTo(32, 10);
        ctx.lineTo(50, 54);
        ctx.lineTo(14, 54);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
      case 'ship':
      case 'carrier_fleet':
        // Pentagon (ship shape)
        ctx.beginPath();
        ctx.moveTo(32, 20);
        ctx.lineTo(50, 35);
        ctx.lineTo(45, 54);
        ctx.lineTo(19, 54);
        ctx.lineTo(14, 35);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
      case 'tank':
      case 'armored_corps':
      default:
        // Square
        ctx.fillRect(16, 16, 32, 32);
        ctx.strokeRect(16, 16, 32, 32);
        break;
    }
  }

  // Create sprite from canvas
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.1, 0.1, 1);
  sprite.position.copy(position);
  sprite.name = `unit-billboard-${unit.id}`;

  // Store canvas reference for cleanup
  (sprite as { userData: { canvas: HTMLCanvasElement } }).userData = { canvas };

  return {
    id: unit.id,
    mesh: sprite,
    position,
    type: 'billboard'
  };
}

/**
 * Dispose a unit visualization and return canvas to pool
 */
export function disposeUnitVisualization(viz: UnitVisualization): void {
  if (viz.type === 'billboard' && viz.mesh instanceof THREE.Sprite) {
    const sprite = viz.mesh;
    const canvas = (sprite as { userData?: { canvas?: HTMLCanvasElement } }).userData?.canvas;

    // Dispose material and texture
    if (sprite.material instanceof THREE.SpriteMaterial) {
      if (sprite.material.map) {
        sprite.material.map.dispose();
      }
      sprite.material.dispose();
    }

    // Return canvas to pool
    if (canvas instanceof HTMLCanvasElement) {
      returnCanvas(canvas);
    }
  } else if (viz.type === 'model') {
    // Dispose 3D model
    disposeModel(viz.mesh as THREE.Group);
  }
}

/**
 * Create 3D model visualization for a unit
 */
export async function createUnit3DModel(
  unit: Unit,
  latLonToVector3: LatLonToVector3Fn,
  radius: number
): Promise<UnitVisualization> {
  const modelInfo = UNIT_MODEL_PATHS[unit.type] || {
    path: '/models/units/default.glb',
    scale: 0.03,
    heightOffset: 0.02
  };

  const position = latLonToVector3(
    unit.lon,
    unit.lat,
    radius + modelInfo.heightOffset
  );

  // Load model
  const model = await loadUnitModel(unit.type);

  // Apply scale
  const scale = unit.scale || modelInfo.scale;
  model.scale.set(scale, scale, scale);

  // Position on globe
  model.position.copy(position);

  // Orient model to face "up" from globe surface
  model.lookAt(position.clone().multiplyScalar(2));
  if (modelInfo.rotationY) {
    model.rotateY(modelInfo.rotationY);
  }

  // Apply unit color if specified
  if (unit.color) {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.material instanceof THREE.MeshStandardMaterial) {
          child.material.color.set(unit.color!);
        }
      }
    });
  }

  model.name = `unit-model-${unit.id}`;

  return {
    id: unit.id,
    mesh: model,
    position,
    type: 'model'
  };
}

/**
 * Create simple marker for unit (fastest rendering option)
 */
export function createUnitMarker(
  unit: Unit,
  latLonToVector3: LatLonToVector3Fn,
  radius: number,
  color?: string
): THREE.Mesh {
  const position = latLonToVector3(unit.lon, unit.lat, radius + 0.03);

  const geometry = new THREE.SphereGeometry(0.02, 8, 8);
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(color || unit.color || '#00ff00'),
    transparent: true,
    opacity: 0.8
  });

  const marker = new THREE.Mesh(geometry, material);
  marker.position.copy(position);
  marker.name = `unit-marker-${unit.id}`;

  // Add selection ring
  const ringGeometry = new THREE.RingGeometry(0.025, 0.03, 16);
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#ffffff'),
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide
  });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.lookAt(position.clone().multiplyScalar(2));
  ring.position.copy(position);
  marker.add(ring);

  return marker;
}

/**
 * Update unit position (for animated movement)
 */
export function updateUnitPosition(
  visualization: UnitVisualization,
  newLon: number,
  newLat: number,
  latLonToVector3: LatLonToVector3Fn,
  radius: number,
  heightOffset: number = 0.03
): void {
  const newPosition = latLonToVector3(newLon, newLat, radius + heightOffset);
  visualization.position.copy(newPosition);
  visualization.mesh.position.copy(newPosition);

  // Update orientation for 3D models
  if (visualization.type === 'model') {
    visualization.mesh.lookAt(newPosition.clone().multiplyScalar(2));
  }
}

/**
 * Create selection highlight for unit
 */
export function createUnitHighlight(
  unit: Unit,
  latLonToVector3: LatLonToVector3Fn,
  radius: number,
  color: string = '#ffff00'
): THREE.Mesh {
  const position = latLonToVector3(unit.lon, unit.lat, radius + 0.025);

  const geometry = new THREE.RingGeometry(0.04, 0.06, 32);
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide
  });

  const highlight = new THREE.Mesh(geometry, material);
  highlight.position.copy(position);
  highlight.lookAt(position.clone().multiplyScalar(2));
  highlight.name = `unit-highlight-${unit.id}`;

  return highlight;
}

/**
 * Animate unit highlight (pulsing effect)
 */
export function animateUnitHighlight(
  highlight: THREE.Mesh,
  time: number
): void {
  const pulse = Math.sin(time * 3) * 0.5 + 0.5;
  const scale = 1 + pulse * 0.3;
  highlight.scale.set(scale, scale, 1);

  if (highlight.material instanceof THREE.MeshBasicMaterial) {
    highlight.material.opacity = 0.4 + pulse * 0.3;
  }
}

/**
 * Batch create unit visualizations
 * Returns array of visualization objects
 */
export async function createUnitVisualizations(
  units: Unit[],
  latLonToVector3: LatLonToVector3Fn,
  radius: number,
  useBillboards: boolean = true
): Promise<UnitVisualization[]> {
  const visualizations: UnitVisualization[] = [];

  for (const unit of units) {
    if (useBillboards) {
      // Use billboards for better performance
      visualizations.push(createUnitBillboard(unit, latLonToVector3, radius));
    } else {
      // Use 3D models for better visuals
      try {
        const viz = await createUnit3DModel(unit, latLonToVector3, radius);
        visualizations.push(viz);
      } catch (error) {
        console.warn(`Failed to create 3D model for unit ${unit.id}, falling back to billboard`);
        visualizations.push(createUnitBillboard(unit, latLonToVector3, radius));
      }
    }
  }

  return visualizations;
}
