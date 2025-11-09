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
import * as THREE from 'three';

import type { FeatureCollection, Polygon, MultiPolygon } from 'geojson';
import {
  computeDiplomaticColor,
  computeIntelColor,
  computeResourceColor,
  computeUnrestColor,
} from '@/lib/mapColorUtils';
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
  type Unit,
  type UnitVisualization,
} from '@/lib/unitModels';
import { resolvePublicAssetPath } from '@/lib/renderingUtils';

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

export type MapVisualStyle = 'realistic' | 'wireframe' | 'flat-realistic';

export const MAP_VISUAL_STYLES: MapVisualStyle[] = ['realistic', 'wireframe', 'flat-realistic'];

export type MapMode = 'standard' | 'diplomatic' | 'intel' | 'resources' | 'unrest';

export const MAP_MODES: MapMode[] = ['standard', 'diplomatic', 'intel', 'resources', 'unrest'];

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
  units?: Unit[];
  showTerritories?: boolean;
  showUnits?: boolean;
  onNationClick?: (nationId: string) => void;
  onTerritoryClick?: (territoryId: string) => void;
  onUnitClick?: (unitId: string) => void;
  onProjectorReady?: (projector: ProjectorFn) => void;
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

function createWireframeFallbackTexture(): THREE.Texture {
  if (typeof document !== 'undefined') {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#020912';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = 'rgba(94, 255, 255, 0.35)';
        ctx.lineWidth = 1;

        const meridianStep = canvas.width / 24;
        for (let x = 0; x <= canvas.width; x += meridianStep) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }

        const parallelStep = canvas.height / 12;
        for (let y = 0; y <= canvas.height; y += parallelStep) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }

        ctx.strokeStyle = 'rgba(94, 255, 255, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 4;
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.needsUpdate = true;
        return texture;
      }
    } catch {
      // Ignore canvas fallback failures and create a data texture instead.
    }
  }

  const size = 8;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const stride = (y * size + x) * 4;
      const isMajorLine = x === 0 || y === 0;
      const isMinorLine = x % 4 === 0 || y % 4 === 0 || x === size - 1 || y === size - 1;
      const [r, g, b] = isMajorLine
        ? [94, 255, 255]
        : isMinorLine
          ? [24, 128, 160]
          : [2, 9, 18];
      data[stride] = r;
      data[stride + 1] = g;
      data[stride + 2] = b;
      data[stride + 3] = 255;
    }
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(64, 32);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
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
  vectorTexture,
  cam,
}: {
  earthRef: MutableRefObject<THREE.Mesh | null>;
  vectorTexture: THREE.Texture | null;
  cam: GlobeSceneProps['cam'];
}) {
  const meshRef = earthRef as MutableRefObject<
    THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> | null
  >;
  const { camera, size, gl } = useThree();
  const cameraWorldPosition = useRef(new THREE.Vector3());
  const planeWorldPosition = useRef(new THREE.Vector3());

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

  const syncTexturePanZoom = useCallback(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const material = mesh.material;
    if (!material || Array.isArray(material) || !(material instanceof THREE.MeshBasicMaterial)) {
      return;
    }

    applyTexturePanZoom(material.map ?? null);
  }, [applyTexturePanZoom]);

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

  useEffect(() => {
    updatePlaneScale();
    syncTexturePanZoom();
  }, [syncTexturePanZoom, updatePlaneScale, vectorTexture]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.quaternion.copy(camera.quaternion);
    updatePlaneScale();
    syncTexturePanZoom();
  });

  return (
    <mesh ref={meshRef} position={[0, 0, FLAT_PLANE_Z]} renderOrder={-15} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={vectorTexture ?? undefined}
        color={vectorTexture ? undefined : '#061021'}
        transparent
        opacity={vectorTexture ? 1 : 0.98}
        toneMapped={false}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
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
  vectorTexture,
  nations,
  territories = [],
  units = [],
  showTerritories = false,
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
}: {
  cam: GlobeSceneProps['cam'];
  vectorTexture: THREE.Texture | null;
  nations: GlobeSceneProps['nations'];
  territories?: TerritoryPolygon[];
  units?: Unit[];
  showTerritories?: boolean;
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
}) {
  const { camera, size, clock, gl } = useThree();
  const earthRef = useRef<THREE.Mesh | null>(null);
  const visualStyle = mapStyle?.visual ?? 'realistic';
  const currentMode = mapStyle?.mode ?? 'standard';
  const isFlat = visualStyle === 'flat-realistic' || visualStyle === 'wireframe';

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
      if (!isFlat) {
        return latLonToVector3(lon, lat, radius);
      }
      const altitude = radius - EARTH_RADIUS;
      return computeFlatPosition(lon, lat, altitude);
    },
    [computeFlatPosition, isFlat],
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
        prevVisualizations.forEach(viz => disposeObject(viz.mesh));
        return [];
      });
      return;
    }

    const visualizations = units.map(unit =>
      createUnitBillboard(unit, latLonToSceneVector, EARTH_RADIUS)
    );

    setUnitVisualizations(prevVisualizations => {
      prevVisualizations.forEach(viz => disposeObject(viz.mesh));
      return visualizations;
    });

    return () => {
      visualizations.forEach(viz => disposeObject(viz.mesh));
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
    if (!isFlat) {
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
        return <EarthWireframe earthRef={earthRef} vectorTexture={vectorTexture} cam={cam} />;
      case 'flat-realistic':
        return <FlatEarthBackdrop cam={cam} flatMapVariant={flatMapVariant} />;
      default:
        return fallback;
    }
  };

  return (
    <>
      {!isFlat && (
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
                default:
                  break;
              }
            }

            const baseColor = nation.color || '#ff6b6b';
            const markerColor =
              nation.isPlayer
                ? '#7cff6b'
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
    </>
  );
}

export const GlobeScene = forwardRef<GlobeSceneHandle, GlobeSceneProps>(function GlobeScene(
  {
    cam,
    nations,
    worldCountries: _worldCountries,
    territories,
    units,
    showTerritories = false,
    showUnits = false,
    onNationClick,
    onTerritoryClick,
    onUnitClick,
    onProjectorReady,
    onPickerReady,
    mapStyle = DEFAULT_MAP_STYLE,
    modeData,
    flatMapVariant,
  }: GlobeSceneProps,
  ref,
) {
  void _worldCountries;
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sizeRef = useRef<{ width: number; height: number }>({ width: 1, height: 1 });
  const earthMeshRef = useRef<THREE.Mesh | null>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const pointerVec = useRef(new THREE.Vector2());
  const projectorRef = useRef<ProjectorFn>(NOOP_PROJECTOR);
  const pickerRef = useRef<PickerFn>(NOOP_PICKER);
  const positionProjectorRef = useRef<(lon: number, lat: number, radius: number) => THREE.Vector3>(
    (lon, lat, radius) => latLonToVector3(lon, lat, radius),
  );
  const visualStyle = mapStyle?.visual ?? DEFAULT_MAP_STYLE.visual;
  const [, triggerRender] = useReducer((value: number) => value + 1, 0);
  const isMountedRef = useRef(true);

  // Refs for missiles and explosions (for imperative API)
  const missilesRef = useRef<Map<string, MissileTrajectoryInstance>>(new Map());
  const explosionsRef = useRef<Map<string, { group: THREE.Group; startTime: number }>>(new Map());
  const missileIdCounterRef = useRef(0);
  const explosionIdCounterRef = useRef(0);
  const clockRef = useRef<THREE.Clock | null>(null);

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

  const wireframeTextureUrl = useMemo(
    () => resolvePublicAssetPath('textures/earth_wireframe.svg'),
    [],
  );
  const [vectorTexture, setVectorTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    let disposed = false;
    let activeTexture: THREE.Texture | null = null;
    const loader = new THREE.TextureLoader();

    setVectorTexture(null);

    const handleTextureReady = (texture: THREE.Texture) => {
      if (disposed) {
        texture.dispose();
        return;
      }

      texture.colorSpace = THREE.SRGBColorSpace;
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = 8;
      texture.needsUpdate = true;

      activeTexture = texture;
      setVectorTexture(texture);
    };

    const handleError = (error?: unknown) => {
      if (error) {
        console.warn('Failed to load earth wireframe texture', error);
      }
      const fallback = createWireframeFallbackTexture();
      if (disposed) {
        fallback.dispose();
        return;
      }
      activeTexture = fallback;
      setVectorTexture(fallback);
    };

    loader.load(wireframeTextureUrl, handleTextureReady, undefined, handleError);

    return () => {
      disposed = true;
      if (activeTexture) {
        activeTexture.dispose();
      }
    };
  }, [wireframeTextureUrl]);

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
    const projector: ProjectorFn = (lon, lat) => {
      const size = sizeRef.current;
      const overlay = overlayRef.current;
      const isFlat = visualStyle === 'flat-realistic' || visualStyle === 'wireframe';

      const overlayWidth = overlay && overlay.width > 0 ? overlay.width : undefined;
      const overlayHeight = overlay && overlay.height > 0 ? overlay.height : undefined;
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

      const vector = latLonToVector3(lon, lat, EARTH_RADIUS + MARKER_OFFSET * 0.5);
      vector.project(camera);
      return {
        x: (vector.x * 0.5 + 0.5) * width,
        y: (-vector.y * 0.5 + 0.5) * height,
        visible: vector.z < 1,
      };
    };
    projectorRef.current = projector;
    if (onProjectorReady) {
      onProjectorReady(projector);
    }
  }, [cam.x, cam.y, cam.zoom, visualStyle, onProjectorReady]);

  const updatePicker = useCallback(() => {
    const picker: PickerFn = (pointerX, pointerY) => {
      const container = containerRef.current;
      const overlay = overlayRef.current;
      if (!container) return null;

      const isFlat = visualStyle === 'flat-realistic' || visualStyle === 'wireframe';
      if (isFlat) {
        const rect = overlay?.getBoundingClientRect() ?? container.getBoundingClientRect();
        const size = sizeRef.current;
        const overlayWidth = overlay && overlay.width > 0 ? overlay.width : undefined;
        const overlayHeight = overlay && overlay.height > 0 ? overlay.height : undefined;
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

      const point = intersections[0].point.clone().normalize();
      const lat = THREE.MathUtils.radToDeg(Math.asin(point.y));
      const theta = Math.atan2(point.z, -point.x);
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
      updateProjector();
      updatePicker();
    },
    [updatePicker, updateProjector],
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
    }),
    [projectLonLat, pickLonLat, fireMissile, addExplosion, clearMissiles, clearExplosions],
  );

  return (
    <div ref={containerRef} className="globe-scene" style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas
        className="globe-scene__webgl"
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, EARTH_RADIUS + 3], fov: 40, near: 0.1, far: 100 }}
        shadows
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      >
        <SceneContent
          cam={cam}
          vectorTexture={vectorTexture}
          nations={nations}
          territories={territories}
          units={units}
          showTerritories={showTerritories}
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
          pointerEvents: 'none',
          zIndex: 1,
          ...(DEBUG_OVERLAY ? { border: '2px solid red' } : {})
        }} 
      />
    </div>
  );
});

export default GlobeScene;
