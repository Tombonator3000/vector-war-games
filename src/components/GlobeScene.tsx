import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useReducer,
  useRef,
  Suspense,
  useState,
} from 'react';
import type { MutableRefObject } from 'react';
import { Canvas, useFrame, useThree, useLoader, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

import type { FeatureCollection, Polygon, MultiPolygon } from 'geojson';
import {
  computeDiplomaticColor,
  computeIntelColor,
  computePandemicColor,
  computeResourceColor,
  computeUnrestColor,
} from '@/lib/mapColorUtils';
import type { FalloutMark, RadiationZone } from '@/types/game';
import type { PandemicStage } from '@/hooks/usePandemic';
import {
  loadTerritoryData,
  createTerritoryBoundaries,
  type TerritoryPolygon,
} from '@/lib/territoryPolygons';
import {
  createMissileTrajectory,
  updateMissileAnimation,
  createExplosion,
  animateExplosion,
  type MissileTrajectory,
  type MissileTrajectoryInstance,
} from '@/lib/missileTrajectories';
import {
  createUnitBillboard,
  disposeUnitVisualization,
  type Unit,
  type UnitVisualization,
} from '@/lib/unitModels';
import { resolvePublicAssetPath } from '@/lib/renderingUtils';
import { TerritoryMarkers } from '@/components/TerritoryMarkers';
import type { TerritoryState } from '@/hooks/useConventionalWarfare';
import { MorphingGlobe, getMorphedPosition, MORPHING_FLAT_WIDTH, MORPHING_FLAT_HEIGHT, type MorphingGlobeHandle } from '@/components/MorphingGlobe';

const EARTH_RADIUS = 1.8;
const MARKER_OFFSET = 0.06;
const MAX_CITY_LIGHT_INSTANCES = 4500;
const CITY_LIGHT_CORE_BASE_RADIUS = 0.035;
const CITY_LIGHT_GLOW_SCALE = 1.6;
const CITY_LIGHT_MIN_SCALE = 0.8;
const CITY_LIGHT_MAX_SCALE = 1.35;
const CITY_LIGHT_ALTITUDE = EARTH_RADIUS + 0.012;
const WHITE_COLOR = new THREE.Color('#ffffff');
const FALLBACK_CITY_COLOR = new THREE.Color('#ffdd00');
const FLAT_PLANE_Z = -0.02;

// Debug flag for overlay canvas
const DEBUG_OVERLAY = false;

const NOOP_PROJECTOR: ProjectorFn = () => ({ x: 0, y: 0, visible: false });
const NOOP_PICKER: PickerFn = () => null;

export type ProjectorFn = (lon: number, lat: number) => { x: number; y: number; visible: boolean };
export type PickerFn = (x: number, y: number) => { lon: number; lat: number } | null;

export type MapVisualStyle = 'realistic' | 'wireframe' | 'flat-realistic' | 'morphing';

export const MAP_VISUAL_STYLES: MapVisualStyle[] = ['realistic', 'wireframe', 'flat-realistic', 'morphing'];

export type MapMode =
  | 'standard'
  | 'diplomatic'
  | 'intel'
  | 'resources'
  | 'unrest'
  | 'pandemic'
  | 'radiation'
  | 'migration';

export const MAP_MODES: MapMode[] = [
  'standard',
  'diplomatic',
  'intel',
  'resources',
  'unrest',
  'pandemic',
  'radiation',
  'migration',
];

export interface MapStyle {
  visual: MapVisualStyle;
  mode: MapMode;
}

export interface MapModeOverlayData {
  playerId: string | null;
  relationships: Record<string, number>;
  intelLevels: Record<string, number>;
  resourceTotals: Record<string, number>;
  unrest: Record<string, { morale: number; publicOpinion: number; instability: number }>;
  pandemic?: {
    infections: Record<string, number>;
    heat: Record<string, number>;
    casualties: Record<string, number>;
    detections: Record<string, boolean>;
    stage: PandemicStage;
    globalInfection: number;
    globalCasualties: number;
    vaccineProgress: number;
  };
  migration?: {
    inflow: Record<string, number>;
    outflow: Record<string, number>;
    net: Record<string, number>;
    policyRate: Record<string, number>;
    bonusMultiplier: Record<string, number>;
    attraction: Record<string, number>;
    pressure: Record<string, number>;
  };
  radiation?: RadiationOverlayPayload;
}

export interface RadiationOverlayPayload {
  exposures: Record<string, number>;
  sickness: Record<string, number>;
  refugeePressure: Record<string, number>;
  falloutMarks: Array<
    Pick<FalloutMark, 'id' | 'lon' | 'lat' | 'intensity' | 'alertLevel' | 'nationId'>
  >;
  radiationZones: Array<Pick<RadiationZone, 'id' | 'lon' | 'lat' | 'intensity' | 'radius' | 'nationId'>>;
  globalRadiation: number;
}

export const DEFAULT_MAP_STYLE: MapStyle = { visual: 'flat-realistic', mode: 'standard' };

/**
 * Handle interface for imperative GlobeScene methods
 * Exposed via ref for controlling missiles, explosions, and other effects
 */
export interface GlobeSceneHandle {
  overlayCanvas: HTMLCanvasElement | null;
  projectLonLat: ProjectorFn;
  pickLonLat: PickerFn;
  fireMissile: (
    from: { lon: number; lat: number },
    to: { lon: number; lat: number },
    options?: { color?: string; type?: 'ballistic' | 'cruise' | 'orbital' }
  ) => string;
  addExplosion: (lon: number, lat: number, radiusKm?: number) => void;
  clearMissiles: () => void;
  clearExplosions: () => void;
  /** Toggle between globe and flat map with smooth morphing animation */
  toggleMorphView: () => void;
  /** Morph to globe view */
  morphToGlobe: (duration?: number) => void;
  /** Morph to flat map view */
  morphToFlat: (duration?: number) => void;
  /** Get current morph factor (0 = globe, 1 = flat) */
  getMorphFactor: () => number;
}

export interface GlobeSceneProps {
  cam: { x: number; y: number; zoom: number };
  nations: Array<{
    id: string;
    lon: number;
    lat: number;
    color?: string;
    isPlayer?: boolean;
    population?: number;
    cities?: number;
  }>;
  worldCountries?: FeatureCollection<Polygon | MultiPolygon> | null;
  territories?: TerritoryPolygon[];
  territoryStates?: TerritoryState[];
  playerId?: string | null;
  units?: Unit[];
  showTerritories?: boolean;
  showTerritoryMarkers?: boolean;
  showUnits?: boolean;
  onNationClick?: (nationId: string) => void;
  onTerritoryClick?: (territoryId: string) => void;
  onUnitClick?: (unitId: string) => void;
  onProjectorReady?: (projector: ProjectorFn) => void;
  onProjectorUpdate?: (projector: ProjectorFn, revision: number) => void;
  onPickerReady?: (picker: PickerFn) => void;
  mapStyle?: MapStyle;
  modeData?: MapModeOverlayData;
  flatMapVariant?: boolean | string | null;
}

interface SceneRegistration {
  camera: THREE.PerspectiveCamera;
  size: { width: number; height: number };
  earth: THREE.Mesh | null;
  clock: THREE.Clock;
  projectPosition?: (lon: number, lat: number, radius: number) => THREE.Vector3;
}

function latLonToVector3(lon: number, lat: number, radius: number) {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lon + 180);

  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

function normalizeLon(lon: number) {
  let result = lon;
  while (result < -180) result += 360;
  while (result > 180) result -= 360;
  return result;
}

function clampColorIntensity(color: THREE.Color) {
  color.r = Math.min(color.r, 1);
  color.g = Math.min(color.g, 1);
  color.b = Math.min(color.b, 1);
  return color;
}

function resolveCssRendererSize(
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

const MATERIAL_TEXTURE_KEYS = [
  'map',
  'alphaMap',
  'aoMap',
  'envMap',
  'lightMap',
  'bumpMap',
  'normalMap',
  'displacementMap',
  'roughnessMap',
  'metalnessMap',
  'emissiveMap',
  'specularMap',
  'gradientMap',
] as const;

function disposeMaterial(material?: THREE.Material | THREE.Material[]) {
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

function disposeObject(object?: THREE.Object3D | null) {
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

function disposeMissileInstance(instance?: MissileTrajectoryInstance | null) {
  if (!instance) return;
  disposeObject(instance.line);
  if (instance.trail) {
    disposeObject(instance.trail);
  }
}

function disposeExplosionGroup(group?: THREE.Group | null) {
  if (!group) return;
  disposeObject(group);
}

function collectWireframeSegments(
  collection?: FeatureCollection<Polygon | MultiPolygon> | null,
): Float32Array | null {
  if (!collection?.features?.length) {
    return null;
  }

  const segments: number[] = [];

  const pushSegment = (start: readonly [number, number], end: readonly [number, number]) => {
    const [startLon, startLat] = start;
    const [endLon, endLat] = end;

    if (!Number.isFinite(startLon) || !Number.isFinite(startLat)) {
      return;
    }
    if (!Number.isFinite(endLon) || !Number.isFinite(endLat)) {
      return;
    }

    const startU = THREE.MathUtils.clamp((startLon + 180) / 360, 0, 1);
    const startV = THREE.MathUtils.clamp((90 - startLat) / 180, 0, 1);
    const endU = THREE.MathUtils.clamp((endLon + 180) / 360, 0, 1);
    const endV = THREE.MathUtils.clamp((90 - endLat) / 180, 0, 1);

    segments.push(startU, startV, endU, endV);
  };

  const appendRing = (ring: readonly number[][]) => {
    if (!ring || ring.length < 2) {
      return;
    }

    for (let i = 1; i < ring.length; i += 1) {
      pushSegment(ring[i - 1] as [number, number], ring[i] as [number, number]);
    }

    const first = ring[0] as [number, number];
    const last = ring[ring.length - 1] as [number, number];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      pushSegment(last, first);
    }
  };

  const appendPolygon = (polygon: Polygon['coordinates']) => {
    polygon.forEach(ring => appendRing(ring));
  };

  for (const feature of collection.features) {
    if (!feature) continue;
    const geometry = feature.geometry;
    if (!geometry) continue;

    if (geometry.type === 'Polygon') {
      appendPolygon(geometry.coordinates);
    } else if (geometry.type === 'MultiPolygon') {
      geometry.coordinates.forEach(polygon => appendPolygon(polygon));
    }
  }

  if (!segments.length) {
    return null;
  }

  return new Float32Array(segments);
}

interface CityLightInstance {
  position: THREE.Vector3;
  innerColor: THREE.Color;
  outerColor: THREE.Color;
  brightness: number;
}

function CityLights({ nations }: { nations: GlobeSceneProps['nations'] }) {
  const innerMeshRef = useRef<THREE.InstancedMesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>>(null);
  const glowMeshRef = useRef<THREE.InstancedMesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>>(null);

  const baseGeometry = useMemo(() => new THREE.SphereGeometry(1, 8, 8), []);
  const coreMaterial = useMemo(() => {
    const material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.95, toneMapped: false });
    material.vertexColors = true;
    return material;
  }, []);
  const glowMaterial = useMemo(() => {
    const material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.25, toneMapped: false });
    material.vertexColors = true;
    return material;
  }, []);

  useEffect(() => {
    return () => {
      baseGeometry.dispose();
      coreMaterial.dispose();
      glowMaterial.dispose();
    };
  }, [baseGeometry, coreMaterial, glowMaterial]);

  const cityLights = useMemo(() => {
    if (!nations.length) {
      return [] as CityLightInstance[];
    }

    const desiredLights = nations.map(nation => {
      const population = nation.population || 0;
      const cities = nation.cities || 1;

      const baseMinimum = 800;
      const populationBonus = Math.floor(population * 8);
      const cityBonus = cities * 150;
      const cityCount = Math.max(baseMinimum, populationBonus + cityBonus);
      const healthFactor = Math.max(0.15, Math.min(1, population / 100));

      return { nation, cityCount, healthFactor };
    });

    const totalDesired = desiredLights.reduce((total, entry) => total + entry.cityCount, 0);
    if (totalDesired === 0) {
      return [] as CityLightInstance[];
    }

    const scale = Math.min(1, MAX_CITY_LIGHT_INSTANCES / totalDesired);

    const allocations = desiredLights.map(entry => {
      const scaled = entry.cityCount * scale;
      const baseCount = Math.floor(scaled);
      const fraction = scaled - baseCount;
      return { ...entry, allocated: baseCount, fraction };
    });

    const allocatedTotal = allocations.reduce((total, entry) => total + entry.allocated, 0);
    let remainder = Math.max(0, Math.min(MAX_CITY_LIGHT_INSTANCES - allocatedTotal, MAX_CITY_LIGHT_INSTANCES));

    const prioritized = [...allocations].sort((a, b) => b.fraction - a.fraction);
    for (const entry of prioritized) {
      if (remainder <= 0) break;
      entry.allocated += 1;
      remainder -= 1;
    }

    const lights: CityLightInstance[] = [];
    allocations.forEach(entry => {
      const { nation, allocated, healthFactor } = entry;
      if (allocated <= 0) return;

      const baseColor = nation.color ? new THREE.Color(nation.color) : FALLBACK_CITY_COLOR.clone();

      for (let i = 0; i < allocated; i++) {
        const clusterRadius = 6 + Math.random() * 4;
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.pow(Math.random(), 0.7) * clusterRadius;

        const lat = nation.lat + Math.sin(angle) * dist;
        const lon = nation.lon + Math.cos(angle) * dist;
        const brightness = (0.9 + Math.random() * 0.1) * healthFactor;

        const intensity = THREE.MathUtils.clamp(brightness, 0.15, 1);
        const innerColor = clampColorIntensity(baseColor.clone().multiplyScalar(THREE.MathUtils.lerp(0.55, 1, intensity)));
        const outerColor = clampColorIntensity(
          baseColor
            .clone()
            .lerp(WHITE_COLOR, 0.35)
            .multiplyScalar(THREE.MathUtils.lerp(0.2, 0.45, intensity)),
        );

        lights.push({
          position: latLonToVector3(lon, lat, CITY_LIGHT_ALTITUDE),
          innerColor,
          outerColor,
          brightness: intensity,
        });
      }
    });

    return lights;
  }, [nations]);

  useEffect(() => {
    const innerMesh = innerMeshRef.current;
    const glowMesh = glowMeshRef.current;

    if (!innerMesh || !glowMesh) {
      return;
    }

    const dummy = new THREE.Object3D();

    innerMesh.count = cityLights.length;
    glowMesh.count = cityLights.length;

    cityLights.forEach((light, index) => {
      dummy.position.copy(light.position);

      const scale = CITY_LIGHT_CORE_BASE_RADIUS * THREE.MathUtils.lerp(CITY_LIGHT_MIN_SCALE, CITY_LIGHT_MAX_SCALE, light.brightness);
      const glowScale = scale * CITY_LIGHT_GLOW_SCALE;

      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      innerMesh.setMatrixAt(index, dummy.matrix);
      innerMesh.setColorAt(index, light.innerColor);

      dummy.scale.setScalar(glowScale);
      dummy.updateMatrix();
      glowMesh.setMatrixAt(index, dummy.matrix);
      glowMesh.setColorAt(index, light.outerColor);
    });

    innerMesh.instanceMatrix.needsUpdate = true;
    glowMesh.instanceMatrix.needsUpdate = true;

    if (innerMesh.instanceColor) {
      innerMesh.instanceColor.needsUpdate = true;
    }
    if (glowMesh.instanceColor) {
      glowMesh.instanceColor.needsUpdate = true;
    }
  }, [cityLights]);

  return (
    <group>
      <instancedMesh
        ref={innerMeshRef}
        args={[baseGeometry, coreMaterial, MAX_CITY_LIGHT_INSTANCES]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={glowMeshRef}
        args={[baseGeometry, glowMaterial, MAX_CITY_LIGHT_INSTANCES]}
        frustumCulled={false}
      />
    </group>
  );
}

function Atmosphere() {
  const atmosphereVertexShader = `
    varying vec3 vNormal;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const atmosphereFragmentShader = `
    varying vec3 vNormal;
    void main() {
      float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
      gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
    }
  `;

  return (
    <mesh scale={1.12}>
      <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
      <shaderMaterial
        vertexShader={atmosphereVertexShader}
        fragmentShader={atmosphereFragmentShader}
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide}
        transparent
      />
    </mesh>
  );
}

function EarthRealistic({
  earthRef,
}: {
  earthRef: MutableRefObject<THREE.Mesh | null>;
}) {
  const textureUrls = useMemo(() => {
    const base = (import.meta.env.BASE_URL ?? '/').replace(/\/?$/, '/');
    return [
      `${base}textures/earth_topo_bathy.jpg`,
      `${base}textures/earth_normal.jpg`,
      `${base}textures/earth_specular.jpg`,
    ];
  }, []);

  const [dayMap, normalMap, specularMap] = useLoader(THREE.TextureLoader, textureUrls);

  useEffect(() => {
    [dayMap, normalMap, specularMap].forEach(texture => {
      if (texture) {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 16;
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.needsUpdate = true;
      }
    });
  }, [dayMap, normalMap, specularMap]);

  return (
    <group>
      <mesh ref={earthRef} castShadow receiveShadow>
        <sphereGeometry args={[EARTH_RADIUS, 128, 128]} />
        <meshPhongMaterial
          map={dayMap}
          normalMap={normalMap}
          specularMap={specularMap}
          shininess={30}
          normalScale={new THREE.Vector2(1.5, 1.5)}
          emissive={new THREE.Color('#000814')}
          emissiveIntensity={0.15}
        />
      </mesh>
      <Atmosphere />
    </group>
  );
}

function EarthWireframe({
  earthRef,
  worldCountries,
  cam,
}: {
  earthRef: MutableRefObject<THREE.Mesh | null>;
  worldCountries?: FeatureCollection<Polygon | MultiPolygon> | null;
  cam: GlobeSceneProps['cam'];
}) {
  const meshRef = earthRef as MutableRefObject<
    THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> | null
  >;
  const groupRef = useRef<THREE.Group>(null);
  const { camera, size, gl } = useThree();
  const cameraWorldPosition = useRef(new THREE.Vector3());
  const planeWorldPosition = useRef(new THREE.Vector3());
  const unprojectTargetRef = useRef(new THREE.Vector3());
  const directionRef = useRef(new THREE.Vector3());
  const baseCoordinatesRef = useRef<Float32Array | null>(null);
  const linePositionsRef = useRef<Float32Array | null>(null);
  const lineGeometryRef = useRef<THREE.BufferGeometry | null>(null);
  const lineMaterialRef = useRef<THREE.LineBasicMaterial | null>(null);
  const lineSegmentsRef = useRef<THREE.LineSegments | null>(null);
  const prevCamRef = useRef({ x: cam.x, y: cam.y, zoom: cam.zoom });

  const cssDimensions = useMemo(
    () =>
      resolveCssRendererSize(
        gl as (THREE.WebGLRenderer & { domElement?: HTMLCanvasElement | null }) | undefined,
        { width: size.width, height: size.height },
      ),
    [gl, size.height, size.width],
  );

  const cssWidth = cssDimensions.width;
  const cssHeight = cssDimensions.height;

  const normalizedSegments = useMemo(
    () => collectWireframeSegments(worldCountries),
    [worldCountries],
  );

  const disposeLineResources = useCallback(() => {
    const currentLines = lineSegmentsRef.current;
    if (currentLines) {
      groupRef.current?.remove(currentLines);
      lineSegmentsRef.current = null;
    }

    if (lineGeometryRef.current) {
      lineGeometryRef.current.dispose();
      lineGeometryRef.current = null;
    }

    if (lineMaterialRef.current) {
      lineMaterialRef.current.dispose();
      lineMaterialRef.current = null;
    }

    linePositionsRef.current = null;
  }, []);

  const updatePlaneScale = useCallback(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const perspective = camera as THREE.PerspectiveCamera;
    if (!perspective.isPerspectiveCamera) return;

    perspective.getWorldPosition(cameraWorldPosition.current);
    mesh.getWorldPosition(planeWorldPosition.current);

    const distance = cameraWorldPosition.current.distanceTo(planeWorldPosition.current);
    if (distance === 0) return;

    const verticalFov = THREE.MathUtils.degToRad(perspective.fov);
    const viewportHeight = 2 * Math.tan(verticalFov / 2) * distance;
    const aspect = size.height === 0 ? perspective.aspect : size.width / size.height;
    const viewportWidth = viewportHeight * aspect;

    if (!Number.isFinite(viewportWidth) || !Number.isFinite(viewportHeight)) {
      return;
    }

    const overscan = 1.08;
    mesh.scale.set(viewportWidth * overscan, viewportHeight * overscan, 1);
  }, [camera, size.height, size.width]);

  const updateLinePositions = useCallback(() => {
    const base = baseCoordinatesRef.current;
    const positions = linePositionsRef.current;
    const geometry = lineGeometryRef.current;
    const lines = lineSegmentsRef.current;
    if (!base || !positions || !geometry || !lines) {
      return;
    }

    const perspective = camera as THREE.PerspectiveCamera;
    if (!perspective.isPerspectiveCamera) return;

    perspective.getWorldPosition(cameraWorldPosition.current);
    const cameraPosition = cameraWorldPosition.current;

    const width = cssWidth || 1;
    const height = cssHeight || 1;

    for (let i = 0, v = 0; i < base.length; i += 2, v += 3) {
      const baseX = base[i] * width;
      const baseY = base[i + 1] * height;

      const screenX = baseX * cam.zoom + cam.x;
      const screenY = baseY * cam.zoom + cam.y;

      const ndcX = (screenX / width) * 2 - 1;
      const ndcY = -(screenY / height) * 2 + 1;

      const target = unprojectTargetRef.current.set(ndcX, ndcY, 0.5).unproject(perspective);
      const direction = directionRef.current.copy(target).sub(cameraPosition);
      const dirZ = direction.z;

      let x = target.x;
      let y = target.y;

      if (dirZ !== 0) {
        const distance = (FLAT_PLANE_Z - cameraPosition.z) / dirZ;
        x = cameraPosition.x + direction.x * distance;
        y = cameraPosition.y + direction.y * distance;
      }

      positions[v] = x;
      positions[v + 1] = y;
      positions[v + 2] = FLAT_PLANE_Z;
    }

    geometry.attributes.position.needsUpdate = true;
  }, [cam.x, cam.y, cam.zoom, camera, cssHeight, cssWidth]);

  useEffect(() => {
    disposeLineResources();
    baseCoordinatesRef.current = normalizedSegments ?? null;

    if (!normalizedSegments || normalizedSegments.length === 0) {
      return;
    }

    const vertexCount = normalizedSegments.length / 2;
    const positions = new Float32Array(vertexCount * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.LineBasicMaterial({
      color: new THREE.Color('#2ef1ff'),
      transparent: true,
      opacity: 0.82,
      toneMapped: false,
    });
    material.depthWrite = false;
    material.depthTest = false;

    const lines = new THREE.LineSegments(geometry, material);
    lines.frustumCulled = false;
    lines.renderOrder = -14;

    linePositionsRef.current = positions;
    lineGeometryRef.current = geometry;
    lineMaterialRef.current = material;
    lineSegmentsRef.current = lines;

    groupRef.current?.add(lines);

    updateLinePositions();

    return () => {
      disposeLineResources();
    };
  }, [normalizedSegments, disposeLineResources, updateLinePositions]);

  useEffect(() => {
    prevCamRef.current = { x: cam.x, y: cam.y, zoom: cam.zoom };
    updatePlaneScale();
    updateLinePositions();
  }, [cam.x, cam.y, cam.zoom, updateLinePositions, updatePlaneScale]);

  useEffect(() => {
    updatePlaneScale();
    updateLinePositions();
  }, [cssWidth, cssHeight, updatePlaneScale, updateLinePositions]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (mesh) {
      mesh.quaternion.copy(camera.quaternion);
      updatePlaneScale();
    }

    const lines = lineSegmentsRef.current;
    if (lines) {
      lines.quaternion.copy(camera.quaternion);
    }

    const previous = prevCamRef.current;
    if (previous.x !== cam.x || previous.y !== cam.y || previous.zoom !== cam.zoom) {
      prevCamRef.current = { x: cam.x, y: cam.y, zoom: cam.zoom };
      updateLinePositions();
    }
  });

  return (
    <group ref={groupRef} renderOrder={-15}>
      <mesh ref={meshRef} position={[0, 0, FLAT_PLANE_Z]} frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={0.08}
          toneMapped={false}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function FlatEarthBackdrop({
  cam,
  flatMapVariant,
}: {
  cam: GlobeSceneProps['cam'];
  flatMapVariant?: boolean | string | null;
}) {
  const meshRef = useRef<THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>>(null);
  const cameraWorldPosition = useRef(new THREE.Vector3());
  const planeWorldPosition = useRef(new THREE.Vector3());
  const { camera, size, gl } = useThree();

  const cssDimensions = useMemo(
    () =>
      resolveCssRendererSize(
        gl as (THREE.WebGLRenderer & { domElement?: HTMLCanvasElement | null }) | undefined,
        { width: size.width, height: size.height },
      ),
    [gl, size.height, size.width],
  );

  const cssWidth = cssDimensions.width;
  const cssHeight = cssDimensions.height;

  const variantKey = useMemo(() => {
    if (typeof flatMapVariant === 'boolean') {
      return flatMapVariant ? 'day' : 'night';
    }

    if (typeof flatMapVariant === 'string') {
      const trimmed = flatMapVariant.trim();
      const normalized = trimmed.toLowerCase();
      if (normalized === 'day' || normalized === 'night') {
        return normalized;
      }
      return trimmed;
    }

    return 'day';
  }, [flatMapVariant]);

  const textureUrl = useMemo(() => {
    if (!variantKey) {
      return resolvePublicAssetPath('textures/earth_day_flat.jpg');
    }

    if (variantKey === 'day' || variantKey === 'night') {
      return resolvePublicAssetPath(`textures/earth_${variantKey}_flat.jpg`);
    }

    if (/^https?:\/\//i.test(variantKey)) {
      return variantKey;
    }

    return resolvePublicAssetPath(variantKey);
  }, [variantKey]);
  const [satelliteTexture, setSatelliteTexture] = useState<THREE.Texture | null>(null);
  const satelliteTextureRef = useRef<THREE.Texture | null>(null);

  const gradientTexture = useMemo(() => {
    if (typeof document === 'undefined') {
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    if (!context) {
      return null;
    }

    const gradient = context.createRadialGradient(256, 256, 48, 256, 256, 256);
    gradient.addColorStop(0, '#10243e');
    gradient.addColorStop(1, '#020617');
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.strokeStyle = 'rgba(12, 74, 110, 0.45)';
    context.lineWidth = 2;
    for (let ring = 1; ring <= 4; ring += 1) {
      const radius = (canvas.width / 2) * (ring / 4);
      context.beginPath();
      context.arc(canvas.width / 2, canvas.height / 2, radius, 0, Math.PI * 2);
      context.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }, []);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    let isMounted = true;

    const disposeCurrentTexture = () => {
      satelliteTextureRef.current?.dispose();
      satelliteTextureRef.current = null;
    };

    disposeCurrentTexture();
    setSatelliteTexture(null);

    if (!textureUrl) {
      return () => {
        isMounted = false;
        disposeCurrentTexture();
      };
    }

    loader.load(
      textureUrl,
      loadedTexture => {
        if (!isMounted) {
          loadedTexture.dispose();
          return;
        }

        loadedTexture.colorSpace = THREE.SRGBColorSpace;
        loadedTexture.generateMipmaps = true;
        loadedTexture.minFilter = THREE.LinearMipmapLinearFilter;
        loadedTexture.magFilter = THREE.LinearFilter;
        loadedTexture.needsUpdate = true;

        disposeCurrentTexture();
        satelliteTextureRef.current = loadedTexture;
        setSatelliteTexture(loadedTexture);
      },
      undefined,
      () => {
        if (!isMounted) {
          return;
        }

        disposeCurrentTexture();
        setSatelliteTexture(null);
      }
    );

    return () => {
      isMounted = false;
      disposeCurrentTexture();
    };
  }, [textureUrl]);

  useEffect(() => {
    return () => {
      gradientTexture?.dispose();
    };
  }, [gradientTexture]);

  const applyTexturePanZoom = useCallback(
    (texture: THREE.Texture | null) => {
      if (!texture) return;

      const width = cssWidth || 1;
      const height = cssHeight || 1;
      const safeZoom = cam.zoom <= 0 ? 0.0001 : cam.zoom;
      const inverseZoom = 1 / safeZoom;

      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.repeat.set(inverseZoom, inverseZoom);

      const offsetX = -((cam.x / width) * inverseZoom);
      const offsetY = -((cam.y / height) * inverseZoom);
      texture.offset.set(offsetX, offsetY);
    },
    [cam.x, cam.y, cam.zoom, cssHeight, cssWidth],
  );

  const syncActiveTexture = useCallback(() => {
    if (!meshRef.current) return;
    const material = meshRef.current.material;
    if (!material) return;

    const meshMaterial = Array.isArray(material) ? material[0] : material;
    if (!meshMaterial || !(meshMaterial instanceof THREE.MeshBasicMaterial)) {
      return;
    }

    const activeTexture = meshMaterial.map ?? null;
    applyTexturePanZoom(activeTexture);
  }, [applyTexturePanZoom]);

  useEffect(() => {
    syncActiveTexture();
  }, [gradientTexture, satelliteTexture, syncActiveTexture]);

  const updateBackdropScale = useCallback(() => {
    if (!meshRef.current) return;

    const perspective = camera as THREE.PerspectiveCamera;
    if (!perspective.isPerspectiveCamera) return;

    perspective.getWorldPosition(cameraWorldPosition.current);
    meshRef.current.getWorldPosition(planeWorldPosition.current);

    const distance = cameraWorldPosition.current.distanceTo(planeWorldPosition.current);
    if (distance === 0) return;

    const verticalFov = THREE.MathUtils.degToRad(perspective.fov);
    const viewportHeight = 2 * Math.tan(verticalFov / 2) * distance;
    const aspect = size.height === 0 ? perspective.aspect : size.width / size.height;
    const viewportWidth = viewportHeight * aspect;

    if (!Number.isFinite(viewportWidth) || !Number.isFinite(viewportHeight)) {
      return;
    }

    const overscan = 1.12;
    meshRef.current.scale.set(viewportWidth * overscan, viewportHeight * overscan, 1);
  }, [camera, size.height, size.width]);

  useEffect(() => {
    updateBackdropScale();
    syncActiveTexture();
  }, [syncActiveTexture, updateBackdropScale]);

  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.quaternion.copy(camera.quaternion);
    updateBackdropScale();
    syncActiveTexture();
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -0.02]} renderOrder={-20} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={satelliteTexture ?? gradientTexture}
        color={satelliteTexture || gradientTexture ? undefined : '#071426'}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function SceneContent({
  cam,
  nations,
  territories = [],
  territoryStates = [],
  playerId = null,
  units = [],
  showTerritories = false,
  showTerritoryMarkers = false,
  showUnits = false,
  onNationClick,
  onTerritoryClick,
  onUnitClick,
  register,
  mapStyle = DEFAULT_MAP_STYLE,
  modeData,
  missilesRef,
  explosionsRef,
  flatMapVariant,
  worldCountries,
  onCameraPoseUpdate,
  onMorphingGlobeReady,
}: {
  cam: GlobeSceneProps['cam'];
  nations: GlobeSceneProps['nations'];
  territories?: TerritoryPolygon[];
  territoryStates?: TerritoryState[];
  playerId?: string | null;
  units?: Unit[];
  showTerritories?: boolean;
  showTerritoryMarkers?: boolean;
  showUnits?: boolean;
  onNationClick?: GlobeSceneProps['onNationClick'];
  onTerritoryClick?: GlobeSceneProps['onTerritoryClick'];
  onUnitClick?: GlobeSceneProps['onUnitClick'];
  register: (registration: SceneRegistration) => void;
  mapStyle?: MapStyle;
  modeData?: MapModeOverlayData;
  missilesRef: MutableRefObject<Map<string, MissileTrajectoryInstance>>;
  explosionsRef: MutableRefObject<Map<string, { group: THREE.Group; startTime: number }>>;
  flatMapVariant?: GlobeSceneProps['flatMapVariant'];
  worldCountries?: GlobeSceneProps['worldCountries'];
  onCameraPoseUpdate?: (camera: THREE.PerspectiveCamera) => void;
  onMorphingGlobeReady?: (handle: MorphingGlobeHandle | null) => void;
}) {
  const { camera, size, clock, gl } = useThree();
  const earthRef = useRef<THREE.Mesh | null>(null);
  const morphingGlobeRef = useRef<MorphingGlobeHandle>(null);
  const visualStyle = mapStyle?.visual ?? 'realistic';
  const currentMode = mapStyle?.mode ?? 'standard';
  const isFlat = visualStyle === 'flat-realistic' || visualStyle === 'wireframe';
  const isMorphing = visualStyle === 'morphing';
  const cameraPoseUpdateRef = useRef<typeof onCameraPoseUpdate>();
  const [morphFactor, setMorphFactorState] = useState(0);

  useEffect(() => {
    cameraPoseUpdateRef.current = onCameraPoseUpdate;
  }, [onCameraPoseUpdate]);

  // Notify parent when morphing globe ref is available
  useEffect(() => {
    if (isMorphing) {
      onMorphingGlobeReady?.(morphingGlobeRef.current);
    } else {
      onMorphingGlobeReady?.(null);
    }
  }, [isMorphing, onMorphingGlobeReady]);

  // Track morph factor for updating marker positions during transition
  useEffect(() => {
    if (!isMorphing) {
      setMorphFactorState(0);
      return;
    }

    const interval = setInterval(() => {
      const factor = morphingGlobeRef.current?.getMorphFactor() ?? 0;
      setMorphFactorState(factor);
    }, 16); // ~60fps update

    return () => clearInterval(interval);
  }, [isMorphing]);

  const cssDimensions = useMemo(
    () =>
      resolveCssRendererSize(
        gl as (THREE.WebGLRenderer & { domElement?: HTMLCanvasElement | null }) | undefined,
        { width: size.width, height: size.height },
      ),
    [gl, size.height, size.width],
  );

  const cssWidth = cssDimensions.width;
  const cssHeight = cssDimensions.height;

  const computeFlatPosition = useCallback(
    (lon: number, lat: number, altitude: number = 0) => {
      if (!isFlat) {
        return latLonToVector3(lon, lat, EARTH_RADIUS + altitude);
      }

      const perspective = camera as THREE.PerspectiveCamera;
      if (!perspective || !(perspective as THREE.PerspectiveCamera).isPerspectiveCamera) {
        return latLonToVector3(lon, lat, EARTH_RADIUS + altitude);
      }

      const safeWidth = cssWidth || 1;
      const safeHeight = cssHeight || 1;

      const baseX = ((lon + 180) / 360) * safeWidth;
      const baseY = ((90 - lat) / 180) * safeHeight;

      const screenX = baseX * cam.zoom + cam.x;
      const screenY = baseY * cam.zoom + cam.y;

      const ndcX = (screenX / safeWidth) * 2 - 1;
      const ndcY = -(screenY / safeHeight) * 2 + 1;

      const worldPosition = new THREE.Vector3(ndcX, ndcY, 0.5).unproject(perspective);

      const cameraPosition = perspective.position instanceof THREE.Vector3
        ? perspective.position.clone()
        : new THREE.Vector3(
            (perspective.position as unknown as { x?: number; y?: number; z?: number }).x ?? 0,
            (perspective.position as unknown as { x?: number; y?: number; z?: number }).y ?? 0,
            (perspective.position as unknown as { x?: number; y?: number; z?: number }).z ?? EARTH_RADIUS + 3,
          );

      const direction = worldPosition.clone().sub(cameraPosition).normalize();
      const planeZ = FLAT_PLANE_Z + altitude;

      if (direction.z === 0) {
        return new THREE.Vector3(worldPosition.x, worldPosition.y, planeZ);
      }

      const distance = (planeZ - cameraPosition.z) / direction.z;
      if (!Number.isFinite(distance) || distance <= 0) {
        return new THREE.Vector3(worldPosition.x, worldPosition.y, planeZ);
      }

      return cameraPosition.add(direction.multiplyScalar(distance));
    },
    [camera, cam.x, cam.y, cam.zoom, cssHeight, cssWidth, isFlat],
  );

  const latLonToSceneVector = useCallback(
    (lon: number, lat: number, radius: number) => {
      // For morphing mode, interpolate between globe and flat positions
      if (isMorphing) {
        return getMorphedPosition(lon, lat, morphFactor, radius);
      }
      if (!isFlat) {
        return latLonToVector3(lon, lat, radius);
      }
      const altitude = radius - EARTH_RADIUS;
      return computeFlatPosition(lon, lat, altitude);
    },
    [computeFlatPosition, isFlat, isMorphing, morphFactor],
  );

  // Territory boundaries state
  const [territoryGroups, setTerritoryGroups] = useState<THREE.Group[]>([]);

  // Unit visualizations state
  const [unitVisualizations, setUnitVisualizations] = useState<UnitVisualization[]>([]);

  const maxIntelLevel = useMemo(() => {
    if (!modeData) return 1;
    const values = Object.values(modeData.intelLevels ?? {});
    return values.length ? Math.max(1, ...values.map(value => (Number.isFinite(value) ? value : 0))) : 1;
  }, [modeData]);

  const maxResourceTotal = useMemo(() => {
    if (!modeData) return 1;
    const values = Object.values(modeData.resourceTotals ?? {});
    return values.length ? Math.max(1, ...values.map(value => (Number.isFinite(value) ? value : 0))) : 1;
  }, [modeData]);

  const maxPandemicInfection = useMemo(() => {
    if (!modeData?.pandemic) return 1;
    const values = Object.values(modeData.pandemic.infections ?? {});
    return values.length ? Math.max(1, ...values.map(value => (Number.isFinite(value) ? value : 0))) : 1;
  }, [modeData]);

  // Color computation functions now imported from @/lib/mapColorUtils
  // This eliminates duplication with worldRenderer.ts

  useEffect(() => {
    register({
      camera: camera as THREE.PerspectiveCamera,
      size: { width: cssWidth, height: cssHeight },
      earth: isFlat ? null : earthRef.current,
      clock,
      projectPosition: latLonToSceneVector,
    });
  }, [camera, register, cssHeight, cssWidth, isFlat, clock, latLonToSceneVector]);

  // Load and render territory boundaries
  useEffect(() => {
    if (!showTerritories || territories.length === 0) {
      setTerritoryGroups(prevGroups => {
        prevGroups.forEach(group => disposeObject(group));
        return [];
      });
      return;
    }

    const groups = territories.map(territory =>
      createTerritoryBoundaries(territory, latLonToSceneVector, EARTH_RADIUS)
    );

    setTerritoryGroups(prevGroups => {
      prevGroups.forEach(group => disposeObject(group));
      return groups;
    });

    return () => {
      groups.forEach(group => disposeObject(group));
    };
  }, [territories, showTerritories, latLonToSceneVector]);

  // Load and render units
  useEffect(() => {
    if (!showUnits || units.length === 0) {
      setUnitVisualizations(prevVisualizations => {
        prevVisualizations.forEach(viz => disposeUnitVisualization(viz));
        return [];
      });
      return;
    }

    const visualizations = units.map(unit =>
      createUnitBillboard(unit, latLonToSceneVector, EARTH_RADIUS)
    );

    setUnitVisualizations(prevVisualizations => {
      prevVisualizations.forEach(viz => disposeUnitVisualization(viz));
      return visualizations;
    });

    return () => {
      visualizations.forEach(viz => disposeUnitVisualization(viz));
    };
  }, [units, showUnits, latLonToSceneVector]);

  useEffect(() => {
    if (!isFlat) {
      return;
    }

    const perspective = camera as THREE.PerspectiveCamera;
    perspective.position.set(0, 0, EARTH_RADIUS + 3);
    perspective.lookAt(0, 0, 0);
    perspective.updateProjectionMatrix();
  }, [camera, isFlat]);

  useFrame(() => {
    // Only apply cam-based camera positioning for realistic (non-morphing) 3D mode
    // Morphing mode uses OrbitControls for camera, so we skip this to allow free rotation/pan
    if (!isFlat && !isMorphing) {
      const { width, height } = size;
      const centerLon = ((width / 2 - cam.x) / (width * cam.zoom)) * 360 - 180;
      const centerLat = 90 - ((height / 2 - cam.y) / (height * cam.zoom)) * 180;

      const centerDir = latLonToVector3(centerLon, centerLat, 1).normalize();
      const minDistance = EARTH_RADIUS + 1.3;
      const maxDistance = EARTH_RADIUS + 3.4;
      const zoomT = THREE.MathUtils.clamp((cam.zoom - 0.5) / (3 - 0.5), 0, 1);
      const targetDistance = THREE.MathUtils.lerp(maxDistance, minDistance, zoomT);

      const desired = centerDir.clone().multiplyScalar(targetDistance);
      (camera as THREE.PerspectiveCamera).position.lerp(desired, 0.12);
      (camera as THREE.PerspectiveCamera).lookAt(0, 0, 0);
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    }

    const currentTime = clock.getElapsedTime();
    let missilesRemoved = false;
    missilesRef.current.forEach((missile, id) => {
      updateMissileAnimation(missile, currentTime);
      // Remove completed missiles after fade out
      if (missile.isComplete && currentTime - missile.startTime > missile.duration + 1.0) {
        missilesRef.current.delete(id);
        disposeMissileInstance(missile);
        missilesRemoved = true;
      }
    });

    // Animate explosions
    let explosionsRemoved = false;
    explosionsRef.current.forEach((explosion, id) => {
      const elapsed = currentTime - explosion.startTime;
      const isComplete = animateExplosion(explosion.group, elapsed, 2.0);
      if (isComplete) {
        explosionsRef.current.delete(id);
        disposeExplosionGroup(explosion.group);
        explosionsRemoved = true;
      }
    });

    if (missilesRemoved || explosionsRemoved) {
      // Request render if needed
    }

    if (camera instanceof THREE.PerspectiveCamera) {
      cameraPoseUpdateRef.current?.(camera);
    }
  });

  const renderEarth = () => {
    const fallback = (
      <mesh ref={earthRef}>
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <meshStandardMaterial color="#0a1929" />
      </mesh>
    );

    switch (visualStyle) {
      case 'realistic':
        return (
          <Suspense fallback={fallback}>
            <EarthRealistic earthRef={earthRef} />
          </Suspense>
        );
      case 'wireframe':
        return (
          <EarthWireframe earthRef={earthRef} worldCountries={worldCountries} cam={cam} />
        );
      case 'flat-realistic':
        return <FlatEarthBackdrop cam={cam} flatMapVariant={flatMapVariant} />;
      case 'morphing':
        return (
          <Suspense fallback={fallback}>
            <MorphingGlobe
              ref={morphingGlobeRef}
              initialView="globe"
              animationDuration={1.2}
              textureVariant={flatMapVariant === false ? 'night' : 'day'}
            />
          </Suspense>
        );
      default:
        return fallback;
    }
  };

  return (
    <>
      {!isFlat && !isMorphing && (
        <>
          <ambientLight intensity={0.5} />
          <directionalLight position={[6, 4, 3]} intensity={1.5} castShadow />
          <directionalLight position={[-5, -3, -6]} intensity={0.5} color={new THREE.Color('#0af')} />
        </>
      )}
      {renderEarth()}
      {visualStyle === 'realistic' && <CityLights nations={nations} />}
      <group>
        {nations.map(nation => {
            if (Number.isNaN(nation.lon) || Number.isNaN(nation.lat)) return null;
            const position = latLonToSceneVector(nation.lon, nation.lat, EARTH_RADIUS + MARKER_OFFSET);
            const overlayKey = nation.id;
            let overlayColor: string | null = null;
            let overlayScale = 0.28;
            let overlayOpacity = 0.35;

            const pandemicData = modeData?.pandemic;
            const infectionValue = pandemicData?.infections?.[overlayKey] ?? 0;
            const normalizedPandemic = infectionValue > 0 ? infectionValue / (maxPandemicInfection || 1) : 0;
            const heatValue = pandemicData?.heat?.[overlayKey] ?? 0;
            const normalizedHeat = heatValue > 0 ? THREE.MathUtils.clamp(heatValue / 100, 0, 1) : normalizedPandemic;

            if (modeData && currentMode !== 'standard') {
              switch (currentMode) {
                case 'diplomatic': {
                  if (modeData.playerId && modeData.playerId !== overlayKey) {
                    const score = modeData.relationships?.[overlayKey] ?? 0;
                    overlayColor = computeDiplomaticColor(score);
                    overlayScale = 0.22 + Math.abs(score) / 500;
                    overlayOpacity = 0.4;
                  }
                  break;
                }
                case 'intel': {
                  const intelValue = modeData.intelLevels?.[overlayKey] ?? 0;
                  if (intelValue > 0) {
                    const normalized = intelValue / (maxIntelLevel || 1);
                    overlayColor = computeIntelColor(normalized);
                    overlayScale = 0.18 + normalized * 0.35;
                    overlayOpacity = 0.45;
                  }
                  break;
                }
                case 'resources': {
                  const total = modeData.resourceTotals?.[overlayKey] ?? 0;
                  if (total > 0) {
                    const normalized = total / (maxResourceTotal || 1);
                    overlayColor = computeResourceColor(normalized);
                    overlayScale = 0.2 + normalized * 0.4;
                    overlayOpacity = 0.42;
                  }
                  break;
                }
                case 'unrest': {
                  const unrestMetrics = modeData.unrest?.[overlayKey];
                  if (unrestMetrics) {
                    const stability = (unrestMetrics.morale + unrestMetrics.publicOpinion) / 2 - unrestMetrics.instability * 0.35;
                    overlayColor = computeUnrestColor(stability);
                    overlayScale = 0.24 + THREE.MathUtils.clamp((70 - stability) / 200, 0, 0.3);
                    overlayOpacity = stability < 55 ? 0.5 : 0.35;
                  }
                  break;
                }
                case 'pandemic': {
                  if (normalizedPandemic > 0) {
                    overlayColor = computePandemicColor(normalizedPandemic);
                    overlayScale = 0.22 + normalizedPandemic * 0.55;
                    overlayOpacity = 0.28 + normalizedHeat * 0.5;
                  }
                  break;
                }
                default:
                  break;
              }
            }

            const baseColor = nation.color || '#ff6b6b';
            const pandemicColor = currentMode === 'pandemic' && normalizedPandemic > 0
              ? computePandemicColor(normalizedPandemic)
              : null;
            const markerColor =
              nation.isPlayer
                ? '#7cff6b'
                : pandemicColor
                  ? pandemicColor
                  : currentMode !== 'standard' && overlayColor
                    ? overlayColor
                    : baseColor;

            return (
              <group key={nation.id}>
                <mesh
                  position={position.toArray() as [number, number, number]}
                  onClick={(event: ThreeEvent<PointerEvent>) => {
                    event.stopPropagation();
                    onNationClick?.(nation.id);
                  }}
                >
                  <sphereGeometry args={[0.06, 16, 16]} />
                  <meshStandardMaterial color={markerColor} emissive={markerColor} emissiveIntensity={0.6} />
                </mesh>
                {overlayColor && currentMode !== 'standard' && (
                  <mesh
                    position={position.toArray() as [number, number, number]}
                    scale={[overlayScale, overlayScale, overlayScale]}
                  >
                    <sphereGeometry args={[0.12, 24, 24]} />
                    <meshBasicMaterial color={overlayColor} transparent opacity={overlayOpacity} />
                  </mesh>
                )}
              </group>
            );
          })}

        {/* Territory boundaries */}
        {territoryGroups.map((group, i) => (
          <primitive key={`territory-${i}`} object={group} />
        ))}

        {/* Unit visualizations */}
        {unitVisualizations.map(viz => (
          <primitive
            key={`unit-${viz.id}`}
            object={viz.mesh}
            onClick={(event: ThreeEvent<PointerEvent>) => {
              event.stopPropagation();
              onUnitClick?.(viz.id);
            }}
          />
        ))}

        {/* Territory markers with troop counts */}
        {showTerritoryMarkers && territoryStates.length > 0 && (
          <TerritoryMarkers
            territories={territoryStates}
            playerId={playerId}
            latLonToVector={latLonToSceneVector}
            earthRadius={EARTH_RADIUS}
            showLabels={true}
          />
        )}

        {/* Active missile trajectories */}
        {Array.from(missilesRef.current.values()).map(missile => (
          <group key={`missile-${missile.id}`}>
            <primitive object={missile.line} />
            {missile.trail && <primitive object={missile.trail} />}
          </group>
        ))}

        {/* Explosions */}
        {Array.from(explosionsRef.current.values()).map((explosion, i) => (
          <primitive key={`explosion-${i}`} object={explosion.group} />
        ))}
      </group>

      {/* OrbitControls for 3D modes (realistic, morphing) - disabled for flat modes */}
      {!isFlat && (
        <OrbitControls
          enableRotate={!isMorphing || morphFactor < 0.8}
          enableZoom={true}
          enablePan={isMorphing && morphFactor > 0.5}
          minDistance={EARTH_RADIUS + 1.3}
          maxDistance={EARTH_RADIUS + 5}
          mouseButtons={{
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN,
          }}
          touches={{
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN,
          }}
          rotateSpeed={0.8}
          zoomSpeed={1.0}
          panSpeed={0.8}
        />
      )}
    </>
  );
}

export const GlobeScene = forwardRef<GlobeSceneHandle, GlobeSceneProps>(function GlobeScene(
  {
    cam,
    nations,
    worldCountries,
    territories,
    territoryStates,
    playerId,
    units,
    showTerritories = false,
    showTerritoryMarkers = false,
    showUnits = false,
    onNationClick,
    onTerritoryClick,
    onUnitClick,
    onProjectorReady,
    onProjectorUpdate,
    onPickerReady,
    mapStyle = DEFAULT_MAP_STYLE,
    modeData,
    flatMapVariant,
  }: GlobeSceneProps,
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sizeRef = useRef<{ width: number; height: number }>({ width: 1, height: 1 });
  const earthMeshRef = useRef<THREE.Mesh | null>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const pointerVec = useRef(new THREE.Vector2());
  const projectorRef = useRef<ProjectorFn>(NOOP_PROJECTOR);
  const projectorRevisionRef = useRef(0);
  const pickerRef = useRef<PickerFn>(NOOP_PICKER);
  const positionProjectorRef = useRef<(lon: number, lat: number, radius: number) => THREE.Vector3>(
    (lon, lat, radius) => latLonToVector3(lon, lat, radius),
  );
  const lastCameraQuaternionRef = useRef(new THREE.Quaternion());
  const lastCameraPositionRef = useRef(new THREE.Vector3());
  const lastCameraZoomRef = useRef(0);
  const hasCameraPoseRef = useRef(false);
  const visualStyle = mapStyle?.visual ?? DEFAULT_MAP_STYLE.visual;
  const [, triggerRender] = useReducer((value: number) => value + 1, 0);
  const isMountedRef = useRef(true);

  // Refs for missiles and explosions (for imperative API)
  const missilesRef = useRef<Map<string, MissileTrajectoryInstance>>(new Map());
  const explosionsRef = useRef<Map<string, { group: THREE.Group; startTime: number }>>(new Map());
  const missileIdCounterRef = useRef(0);
  const explosionIdCounterRef = useRef(0);
  const clockRef = useRef<THREE.Clock | null>(null);
  const morphingGlobeHandleRef = useRef<MorphingGlobeHandle | null>(null);

  const emitInitialProjector = useCallback(
    (projector: ProjectorFn) => {
      if (onProjectorReady) {
        onProjectorReady(projector);
      }
      if (onProjectorUpdate) {
        onProjectorUpdate(projector, projectorRevisionRef.current);
      }
    },
    [onProjectorReady, onProjectorUpdate],
  );

  const incrementProjectorRevision = useCallback(() => {
    projectorRevisionRef.current += 1;
    const projector = projectorRef.current;
    if (onProjectorUpdate) {
      onProjectorUpdate(projector, projectorRevisionRef.current);
    } else if (onProjectorReady) {
      onProjectorReady(projector);
    }
  }, [onProjectorReady, onProjectorUpdate]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const requestRender = useCallback(() => {
    if (isMountedRef.current) {
      triggerRender();
    }
  }, [triggerRender]);

  const getElapsedTime = useCallback(() => {
    const clock = clockRef.current;
    if (clock) {
      return clock.getElapsedTime();
    }
    if (typeof performance !== 'undefined') {
      return performance.now() / 1000;
    }
    return 0;
  }, []);

  useEffect(() => {
    const missiles = missilesRef.current;
    const explosions = explosionsRef.current;

    return () => {
      missiles.forEach(instance => disposeMissileInstance(instance));
      missiles.clear();

      explosions.forEach(entry => disposeExplosionGroup(entry.group));
      explosions.clear();
    };
  }, []);

  const updateProjector = useCallback(() => {
    const cameraWorldPosition = new THREE.Vector3();
    const surfaceNormal = new THREE.Vector3();
    const cameraToSurface = new THREE.Vector3();
    const projectedVector = new THREE.Vector3();

    const projector: ProjectorFn = (lon, lat) => {
      const size = sizeRef.current;
      const overlay = overlayRef.current;
      const isFlat = visualStyle === 'flat-realistic' || visualStyle === 'wireframe';
      const isMorphing = visualStyle === 'morphing';

      // Get the devicePixelRatio to account for high-DPI scaling
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

      const overlayWidth = overlay && overlay.width > 0 ? overlay.width / dpr : undefined;
      const overlayHeight = overlay && overlay.height > 0 ? overlay.height / dpr : undefined;
      const width = overlayWidth ?? size?.width ?? 1;
      const height = overlayHeight ?? size?.height ?? 1;

      const baseX = ((lon + 180) / 360) * width;
      const baseY = ((90 - lat) / 180) * height;

      if (isFlat) {
        return {
          x: baseX * cam.zoom + cam.x,
          y: baseY * cam.zoom + cam.y,
          visible: true,
        };
      }

      const camera = cameraRef.current;
      if (!camera) {
        return {
          x: baseX,
          y: baseY,
          visible: true,
        };
      }

      // For morphing mode, use morphed position based on current morph factor
      let worldVector: THREE.Vector3;
      if (isMorphing) {
        const morphFactor = morphingGlobeHandleRef.current?.getMorphFactor() ?? 0;
        worldVector = getMorphedPosition(lon, lat, morphFactor, EARTH_RADIUS + MARKER_OFFSET * 0.5);
      } else {
        worldVector = latLonToVector3(lon, lat, EARTH_RADIUS + MARKER_OFFSET * 0.5);
      }

      camera.getWorldPosition(cameraWorldPosition);
      surfaceNormal.copy(worldVector).normalize();
      cameraToSurface.subVectors(cameraWorldPosition, worldVector);

      // For morphing mode with high morph factor (flat view), always consider visible
      const morphFactor = isMorphing ? (morphingGlobeHandleRef.current?.getMorphFactor() ?? 0) : 0;
      const facingCamera = morphFactor > 0.5 ? true : cameraToSurface.dot(surfaceNormal) > 0;

      projectedVector.copy(worldVector).project(camera);
      const isVisible = facingCamera && projectedVector.z < 1;

      return {
        x: (projectedVector.x * 0.5 + 0.5) * width,
        y: (-projectedVector.y * 0.5 + 0.5) * height,
        visible: isVisible,
      };
    };
    projectorRef.current = projector;
    projectorRevisionRef.current = 0;
    emitInitialProjector(projector);
  }, [cam.x, cam.y, cam.zoom, visualStyle, emitInitialProjector]);

  const updatePicker = useCallback(() => {
    const picker: PickerFn = (pointerX, pointerY) => {
      const container = containerRef.current;
      const overlay = overlayRef.current;
      if (!container) return null;

      const isFlat = visualStyle === 'flat-realistic' || visualStyle === 'wireframe';
      const isMorphing = visualStyle === 'morphing';

      if (isFlat) {
        const rect = overlay?.getBoundingClientRect() ?? container.getBoundingClientRect();
        const size = sizeRef.current;

        // Get the devicePixelRatio to account for high-DPI scaling
        const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

        const overlayWidth = overlay && overlay.width > 0 ? overlay.width / dpr : undefined;
        const overlayHeight = overlay && overlay.height > 0 ? overlay.height / dpr : undefined;
        const width = overlayWidth ?? size?.width ?? (rect.width || 1);
        const height = overlayHeight ?? size?.height ?? (rect.height || 1);
        const adjustedX = (pointerX - cam.x) / cam.zoom;
        const adjustedY = (pointerY - cam.y) / cam.zoom;
        const lon = normalizeLon((adjustedX / width) * 360 - 180);
        const lat = THREE.MathUtils.clamp(90 - (adjustedY / height) * 180, -90, 90);
        return { lon, lat };
      }

      const camera = cameraRef.current;
      const earth = earthMeshRef.current;
      if (!camera || !earth) return null;

      const rect = container.getBoundingClientRect();
      pointerVec.current.set(
        (pointerX / rect.width) * 2 - 1,
        -(pointerY / rect.height) * 2 + 1,
      );

      raycasterRef.current.setFromCamera(pointerVec.current, camera);
      const intersections = raycasterRef.current.intersectObject(earth, false);
      if (!intersections.length) {
        return null;
      }

      const point = intersections[0].point.clone();

      // For morphing mode, handle both sphere and flat coordinate systems
      if (isMorphing) {
        const morphFactor = morphingGlobeHandleRef.current?.getMorphFactor() ?? 0;

        // Calculate coordinates from sphere (for low morph factor)
        const normalizedPoint = point.clone().normalize();
        const sphereLat = THREE.MathUtils.radToDeg(Math.asin(normalizedPoint.y));
        const sphereTheta = Math.atan2(normalizedPoint.z, -normalizedPoint.x);
        const sphereLon = normalizeLon(THREE.MathUtils.radToDeg(sphereTheta) - 180);

        // Calculate coordinates from flat plane (for high morph factor)
        // Flat position formula: x = (u - 0.5) * FLAT_WIDTH, y = (v - 0.5) * FLAT_HEIGHT
        // Where u = (lon + 180) / 360, v = (90 - lat) / 180
        const u = point.x / MORPHING_FLAT_WIDTH + 0.5;
        const v = point.y / MORPHING_FLAT_HEIGHT + 0.5;
        const flatLon = normalizeLon(u * 360 - 180);
        const flatLat = THREE.MathUtils.clamp(90 - v * 180, -90, 90);

        // Interpolate between sphere and flat coordinates based on morph factor
        const lon = THREE.MathUtils.lerp(sphereLon, flatLon, morphFactor);
        const lat = THREE.MathUtils.lerp(sphereLat, flatLat, morphFactor);

        return { lon, lat };
      }

      // Standard sphere picking for realistic mode
      const normalizedPoint = point.normalize();
      const lat = THREE.MathUtils.radToDeg(Math.asin(normalizedPoint.y));
      const theta = Math.atan2(normalizedPoint.z, -normalizedPoint.x);
      const lon = normalizeLon(THREE.MathUtils.radToDeg(theta) - 180);
      return { lon, lat };
    };
    pickerRef.current = picker;
    if (onPickerReady) {
      onPickerReady(picker);
    }
  }, [cam.x, cam.y, cam.zoom, visualStyle, onPickerReady]);

  const handleRegister = useCallback(
    ({ camera, size, earth, clock, projectPosition }: SceneRegistration) => {
      cameraRef.current = camera;
      sizeRef.current = size;
      earthMeshRef.current = earth;
      clockRef.current = clock;
      positionProjectorRef.current = projectPosition
        ? projectPosition
        : (lon, lat, radius) => latLonToVector3(lon, lat, radius);
      if (camera) {
        lastCameraQuaternionRef.current.copy(camera.quaternion);
        lastCameraPositionRef.current.copy(camera.position);
        lastCameraZoomRef.current = camera.zoom;
        hasCameraPoseRef.current = true;
      }
      updateProjector();
      updatePicker();
    },
    [updatePicker, updateProjector],
  );

  const handleCameraPoseUpdate = useCallback(
    (camera: THREE.PerspectiveCamera) => {
      if (!camera) {
        return;
      }

      if (!hasCameraPoseRef.current) {
        lastCameraQuaternionRef.current.copy(camera.quaternion);
        lastCameraPositionRef.current.copy(camera.position);
        lastCameraZoomRef.current = camera.zoom;
        hasCameraPoseRef.current = true;
        return;
      }

      const previousQuaternion = lastCameraQuaternionRef.current;
      const previousPosition = lastCameraPositionRef.current;
      const quaternionDelta = 1 - Math.abs(camera.quaternion.dot(previousQuaternion));
      const positionDelta = previousPosition.distanceToSquared(camera.position);
      const zoomDelta = Math.abs(camera.zoom - lastCameraZoomRef.current);

      if (quaternionDelta > 1e-5 || positionDelta > 1e-6 || zoomDelta > 1e-6) {
        previousQuaternion.copy(camera.quaternion);
        previousPosition.copy(camera.position);
        lastCameraZoomRef.current = camera.zoom;
        incrementProjectorRevision();
      }
    },
    [incrementProjectorRevision],
  );

  useEffect(() => {
    updateProjector();
  }, [updateProjector, cam]);

  useEffect(() => {
    updatePicker();
  }, [updatePicker, cam]);

  // Imperative methods for controlling missiles and explosions
  const fireMissile = useCallback(
    (
      from: { lon: number; lat: number },
      to: { lon: number; lat: number },
      options?: { color?: string; type?: 'ballistic' | 'cruise' | 'orbital' }
    ): string => {
      const id = `missile-${++missileIdCounterRef.current}`;
      const trajectory: MissileTrajectory = {
        id,
        from,
        to,
        duration: 5.0, // Default 5 seconds
        color: options?.color || '#ff0000',
        type: options?.type || 'ballistic'
      };

      const projector = positionProjectorRef.current;
      const instance = createMissileTrajectory(trajectory, projector, EARTH_RADIUS);
      instance.startTime = getElapsedTime();
      missilesRef.current.set(id, instance);
      requestRender();

      return id;
    },
    [getElapsedTime, requestRender],
  );

  const addExplosion = useCallback(
    (
      lon: number,
      lat: number,
      radiusKm: number = 50,
    ): void => {
      const projector = positionProjectorRef.current;
      const position = projector(lon, lat, EARTH_RADIUS + 0.01);
      const explosion = createExplosion(position, radiusKm);
      const id = `explosion-${++explosionIdCounterRef.current}`;

      explosionsRef.current.set(id, {
        group: explosion,
        startTime: getElapsedTime(),
      });
      requestRender();
    },
    [getElapsedTime, requestRender],
  );

  const clearMissiles = useCallback(() => {
    missilesRef.current.forEach(instance => disposeMissileInstance(instance));
    missilesRef.current.clear();
    requestRender();
  }, [requestRender]);

  const clearExplosions = useCallback(() => {
    explosionsRef.current.forEach(entry => disposeExplosionGroup(entry.group));
    explosionsRef.current.clear();
    requestRender();
  }, [requestRender]);

  const projectLonLat = useCallback<ProjectorFn>((lon, lat) => projectorRef.current(lon, lat), []);
  const pickLonLat = useCallback<PickerFn>((x, y) => pickerRef.current(x, y), []);

  const handleMorphingGlobeReady = useCallback((handle: MorphingGlobeHandle | null) => {
    morphingGlobeHandleRef.current = handle;
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      get overlayCanvas() {
        return overlayRef.current;
      },
      projectLonLat,
      pickLonLat,
      fireMissile,
      addExplosion,
      clearMissiles,
      clearExplosions,
      toggleMorphView: () => {
        morphingGlobeHandleRef.current?.toggle();
      },
      morphToGlobe: (duration?: number) => {
        morphingGlobeHandleRef.current?.morphToGlobe(duration);
      },
      morphToFlat: (duration?: number) => {
        morphingGlobeHandleRef.current?.morphToFlat(duration);
      },
      getMorphFactor: () => {
        return morphingGlobeHandleRef.current?.getMorphFactor() ?? 0;
      },
    }),
    [projectLonLat, pickLonLat, fireMissile, addExplosion, clearMissiles, clearExplosions],
  );

  // For 3D modes (realistic, morphing), let Three.js canvas handle pointer events via OrbitControls
  // For flat modes (flat-realistic, wireframe), use overlay canvas for custom pan/zoom
  const is3DMode = visualStyle === 'realistic' || visualStyle === 'morphing';

  return (
    <div ref={containerRef} className="globe-scene" style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas
        className="globe-scene__webgl"
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, EARTH_RADIUS + 3], fov: 40, near: 0.1, far: 100 }}
        shadows
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: is3DMode ? 10 : 0 }}
      >
        <SceneContent
          cam={cam}
          nations={nations}
          territories={territories}
          territoryStates={territoryStates}
          playerId={playerId}
          units={units}
          showTerritories={showTerritories}
          showTerritoryMarkers={showTerritoryMarkers}
          showUnits={showUnits}
          onNationClick={onNationClick}
          onTerritoryClick={onTerritoryClick}
          onUnitClick={onUnitClick}
          register={handleRegister}
          mapStyle={mapStyle}
          modeData={modeData}
          missilesRef={missilesRef}
          explosionsRef={explosionsRef}
          flatMapVariant={flatMapVariant}
          worldCountries={worldCountries}
          onCameraPoseUpdate={handleCameraPoseUpdate}
          onMorphingGlobeReady={handleMorphingGlobeReady}
        />
      </Canvas>
      <canvas
        ref={overlayRef}
        className="globe-scene__overlay"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: is3DMode ? 'none' : 'auto',
          zIndex: is3DMode ? 0 : 10,
          ...(DEBUG_OVERLAY ? { border: '2px solid red' } : {})
        }}
      />
    </div>
  );
});

export default GlobeScene;

// Re-export morphing utilities for external use
export { getMorphedPosition, type MorphingGlobeHandle } from '@/components/MorphingGlobe';
