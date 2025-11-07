import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, Suspense, useState } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
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

const EARTH_RADIUS = 1.8;
const MARKER_OFFSET = 0.06;

export type ProjectorFn = (lon: number, lat: number) => { x: number; y: number; visible: boolean };
export type PickerFn = (x: number, y: number) => { lon: number; lat: number } | null;

export interface CityLight {
  id: string;
  lon: number;
  lat: number;
  brightness: number;
  nationId: string;
}

export type MapVisualStyle =
  | 'realistic'
  | 'wireframe'
  | 'night'
  | 'political'
  | 'flat'
  | 'flat-realistic'
  | 'nightlights'
  | 'flat-nightlights'
  | 'topo';

export const MAP_VISUAL_STYLES: MapVisualStyle[] = [
  'realistic',
  'wireframe',
  'night',
  'political',
  'flat',
  'flat-realistic',
  'nightlights',
  'flat-nightlights',
  'topo',
];

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

export const DEFAULT_MAP_STYLE: MapStyle = { visual: 'realistic', mode: 'standard' };

/**
 * Handle interface for imperative GlobeScene methods
 * Exposed via ref for controlling missiles, explosions, and other effects
 */
export interface GlobeSceneHandle {
  projectLonLat: ProjectorFn;
  pickLonLat: PickerFn;
  fireMissile: (from: { lon: number; lat: number }, to: { lon: number; lat: number }, options?: { color?: string; type?: 'ballistic' | 'cruise' | 'orbital' }) => string;
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
}

interface SceneRegistration {
  camera: THREE.PerspectiveCamera;
  size: { width: number; height: number };
  earth: THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial> | null;
}

type ForwardedCanvas = HTMLCanvasElement | null;

type WorldFeature = FeatureCollection<Polygon | MultiPolygon>['features'][number];

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

function buildAtlasTexture(worldCountries?: FeatureCollection<Polygon | MultiPolygon> | null) {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return null;
  }

  ctx.fillStyle = '#020912';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const drawRing = (coords: number[][]) => {
    if (!coords.length) return;
    coords.forEach(([lon, lat], index) => {
      const x = ((lon + 180) / 360) * canvas.width;
      const y = ((90 - lat) / 180) * canvas.height;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.closePath();
  };

  const featureFillCache = new Map<string, string>();

  const getFeatureId = (feature: WorldFeature) => {
    const { properties, id } = feature;
    return (
      (typeof id === 'string' && id) ||
      (properties &&
        ((properties as Record<string, unknown>).name as string | undefined ||
          (properties as Record<string, unknown>).NAME as string | undefined ||
          (properties as Record<string, unknown>).ADMIN as string | undefined)) ||
      'feature'
    );
  };

  const getFillColor = (feature: WorldFeature) => {
    const key = getFeatureId(feature);
    if (featureFillCache.has(key)) {
      return featureFillCache.get(key)!;
    }

    let hash = 0;
    for (let i = 0; i < key.length; i += 1) {
      hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    }

    const hue = hash % 360;
    const saturation = 50 + (hash % 30);
    const lightness = 35 + ((hash >> 3) % 20);
    const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    featureFillCache.set(key, color);
    return color;
  };

  if (worldCountries && worldCountries.features?.length) {
    ctx.strokeStyle = 'rgba(94, 255, 255, 0.8)';
    ctx.lineWidth = 1.2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    for (const feature of worldCountries.features) {
      const geometry = feature.geometry;
      if (!geometry) continue;

      ctx.beginPath();
      if (geometry.type === 'Polygon') {
        for (const ring of geometry.coordinates) {
          drawRing(ring as number[][]);
        }
      } else if (geometry.type === 'MultiPolygon') {
        for (const polygon of geometry.coordinates) {
          for (const ring of polygon) {
            drawRing(ring as number[][]);
          }
        }
      }

      ctx.fillStyle = getFillColor(feature);
      ctx.fill('evenodd');
      ctx.stroke();
    }
  } else {
    ctx.strokeStyle = 'rgba(94, 255, 255, 0.55)';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
  }

  ctx.strokeStyle = 'rgba(55, 200, 255, 0.25)';
  ctx.lineWidth = 0.8;
  for (let lon = -180; lon <= 180; lon += 30) {
    ctx.beginPath();
    for (let lat = -90; lat <= 90; lat += 5) {
      const x = ((lon + 180) / 360) * canvas.width;
      const y = ((90 - lat) / 180) * canvas.height;
      if (lat === -90) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  for (let lat = -90; lat <= 90; lat += 30) {
    ctx.beginPath();
    for (let lon = -180; lon <= 180; lon += 5) {
      const x = ((lon + 180) / 360) * canvas.width;
      const y = ((90 - lat) / 180) * canvas.height;
      if (lon === -180) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function CityLights({ nations }: { nations: GlobeSceneProps['nations'] }) {
  const cityLights = useMemo(() => {
    const lights: CityLight[] = [];
    nations.forEach(nation => {
      const population = nation.population || 0;
      const cities = nation.cities || 1;
      
      // Realistic satellite map lighting - thousands of lights like real cities
      const baseMinimum = 800; // Every nation starts with 800+ lights (like real satellite maps)
      const populationBonus = Math.floor(population * 8); // 8 lights per population point
      const cityBonus = cities * 150; // 150 lights per city infrastructure
      const cityCount = Math.max(baseMinimum, populationBonus + cityBonus);
      
      // Health factor: war damage reduces lights dramatically
      const healthFactor = Math.max(0.15, Math.min(1, population / 100));
      
      for (let i = 0; i < cityCount; i++) {
        // Dense clustering like real cities - multiple bright zones
        const clusterRadius = 6 + Math.random() * 4;
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.pow(Math.random(), 0.7) * clusterRadius; // Denser in center
        
        const brightness = (0.9 + Math.random() * 0.1) * healthFactor;
        
        lights.push({
          id: `${nation.id}-city-${i}`,
          lat: nation.lat + Math.sin(angle) * dist,
          lon: nation.lon + Math.cos(angle) * dist,
          brightness,
          nationId: nation.id,
        });
      }
    });
    return lights;
  }, [nations]);

  return (
    <group>
      {cityLights.map(light => {
        const position = latLonToVector3(light.lon, light.lat, EARTH_RADIUS + 0.012);
        const nation = nations.find(n => n.id === light.nationId);
        const color = nation?.color || '#ffdd00';

        return (
          <group key={light.id} position={position.toArray() as [number, number, number]}>
            {/* Main bright core */}
            <mesh>
              <sphereGeometry args={[0.035, 8, 8]} />
              <meshBasicMaterial
                color={color}
                transparent
                opacity={light.brightness * 0.95}
                toneMapped={false}
              />
            </mesh>
            {/* Outer glow for bloom effect */}
            <mesh>
              <sphereGeometry args={[0.055, 8, 8]} />
              <meshBasicMaterial
                color={color}
                transparent
                opacity={light.brightness * 0.25}
                toneMapped={false}
              />
            </mesh>
          </group>
        );
      })}
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
  earthRef: React.RefObject<THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>>;
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
}: {
  earthRef: React.RefObject<THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>>;
  vectorTexture: THREE.Texture | null;
}) {
  return (
    <mesh ref={earthRef}>
      <sphereGeometry args={[EARTH_RADIUS, 128, 128]} />
      <meshBasicMaterial 
        map={vectorTexture} 
        color="#0a1929"
        transparent
        opacity={0.95}
      />
    </mesh>
  );
}

function EarthNight({
  earthRef,
}: {
  earthRef: React.RefObject<THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>>;
}) {
  return (
    <mesh ref={earthRef}>
      <sphereGeometry args={[EARTH_RADIUS, 128, 128]} />
      <meshBasicMaterial 
        color="#020912"
        transparent
        opacity={0.98}
      />
    </mesh>
  );
}

function EarthNightlights({
  earthRef,
}: {
  earthRef: React.RefObject<THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>>;
}) {
  const textureUrl = useMemo(() => {
    const base = (import.meta.env.BASE_URL ?? '/').replace(/\/?$/, '/');
    return `${base}textures/earth_nightlights.jpg`;
  }, []);

  const nightlightsMap = useLoader(THREE.TextureLoader, textureUrl);

  useEffect(() => {
    if (nightlightsMap) {
      nightlightsMap.colorSpace = THREE.SRGBColorSpace;
      nightlightsMap.anisotropy = 16;
      nightlightsMap.generateMipmaps = true;
      nightlightsMap.minFilter = THREE.LinearMipmapLinearFilter;
      nightlightsMap.magFilter = THREE.LinearFilter;
      nightlightsMap.needsUpdate = true;
    }
  }, [nightlightsMap]);

  return (
    <group>
      <mesh ref={earthRef}>
        <sphereGeometry args={[EARTH_RADIUS, 128, 128]} />
        <meshBasicMaterial
          map={nightlightsMap}
          color="#ffffff"
          transparent
          opacity={1}
        />
      </mesh>
      <Atmosphere />
    </group>
  );
}

function EarthTopo({
  earthRef,
}: {
  earthRef: React.RefObject<THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>>;
}) {
  const textureUrl = useMemo(() => {
    const base = (import.meta.env.BASE_URL ?? '/').replace(/\/?$/, '/');
    return `${base}textures/earth_topo_bathy.jpg`;
  }, []);

  const topoMap = useLoader(THREE.TextureLoader, textureUrl);

  useEffect(() => {
    if (topoMap) {
      topoMap.colorSpace = THREE.SRGBColorSpace;
      topoMap.anisotropy = 16;
      topoMap.generateMipmaps = true;
      topoMap.minFilter = THREE.LinearMipmapLinearFilter;
      topoMap.magFilter = THREE.LinearFilter;
      topoMap.needsUpdate = true;
    }
  }, [topoMap]);

  return (
    <group>
      <mesh ref={earthRef} castShadow receiveShadow>
        <sphereGeometry args={[EARTH_RADIUS, 128, 128]} />
        <meshStandardMaterial
          map={topoMap}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      <Atmosphere />
    </group>
  );
}

function EarthPolitical({
  earthRef,
  vectorTexture,
}: {
  earthRef: React.RefObject<THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>>;
  vectorTexture: THREE.Texture | null;
}) {
  return (
    <mesh ref={earthRef}>
      <sphereGeometry args={[EARTH_RADIUS, 128, 128]} />
      <meshStandardMaterial
        map={vectorTexture}
        color="#ffffff"
        emissive={new THREE.Color('#070b12')}
        emissiveIntensity={0.35}
        roughness={0.9}
        metalness={0.05}
        transparent
        opacity={0.96}
      />
    </mesh>
  );
}

function SceneContent({
  cam,
  texture,
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
}: {
  cam: GlobeSceneProps['cam'];
  texture: THREE.Texture | null;
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
  missilesRef: React.MutableRefObject<Map<string, MissileTrajectoryInstance>>;
  explosionsRef: React.MutableRefObject<Map<string, { group: THREE.Group; startTime: number }>>;
}) {
  const { camera, size, clock } = useThree();
  const earthRef = useRef<THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>>(null);
  const visualStyle = mapStyle?.visual ?? 'realistic';
  const currentMode = mapStyle?.mode ?? 'standard';
  const isFlat = visualStyle === 'flat' || visualStyle === 'flat-realistic' || visualStyle === 'flat-nightlights';

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
      size,
      earth: isFlat ? null : earthRef.current,
    });
  }, [camera, register, size, isFlat]);

  // Load and render territory boundaries
  useEffect(() => {
    if (!showTerritories || isFlat || territories.length === 0) {
      setTerritoryGroups([]);
      return;
    }

    const groups = territories.map(territory =>
      createTerritoryBoundaries(territory, latLonToVector3, EARTH_RADIUS)
    );
    setTerritoryGroups(groups);
  }, [territories, showTerritories, isFlat]);

  // Load and render units
  useEffect(() => {
    if (!showUnits || isFlat || units.length === 0) {
      setUnitVisualizations([]);
      return;
    }

    const visualizations = units.map(unit =>
      createUnitBillboard(unit, latLonToVector3, EARTH_RADIUS)
    );
    setUnitVisualizations(visualizations);
  }, [units, showUnits, isFlat]);

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
    if (isFlat) {
      return;
    }

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

    // Animate missiles
    const currentTime = clock.getElapsedTime();
    missilesRef.current.forEach((missile, id) => {
      updateMissileAnimation(missile, currentTime);
      // Remove completed missiles after fade out
      if (missile.isComplete && currentTime - missile.startTime > missile.duration + 1.0) {
        missilesRef.current.delete(id);
      }
    });

    // Animate explosions
    explosionsRef.current.forEach((explosion, id) => {
      const elapsed = currentTime - explosion.startTime;
      const isComplete = animateExplosion(explosion.group, elapsed, 2.0);
      if (isComplete) {
        explosionsRef.current.delete(id);
      }
    });
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
        return <EarthWireframe earthRef={earthRef} vectorTexture={texture} />;
      case 'night':
        return <EarthNight earthRef={earthRef} />;
      case 'nightlights':
        return (
          <Suspense fallback={fallback}>
            <EarthNightlights earthRef={earthRef} />
          </Suspense>
        );
      case 'topo':
        return (
          <Suspense fallback={fallback}>
            <EarthTopo earthRef={earthRef} />
          </Suspense>
        );
      case 'political':
        return <EarthPolitical earthRef={earthRef} vectorTexture={texture} />;
      case 'flat':
      case 'flat-realistic':
      case 'flat-nightlights':
        return null;
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
      {(visualStyle === 'night' || visualStyle === 'realistic') && <CityLights nations={nations} />}
      {!isFlat && (
        <group>
          {nations.map(nation => {
            if (Number.isNaN(nation.lon) || Number.isNaN(nation.lat)) return null;
            const position = latLonToVector3(nation.lon, nation.lat, EARTH_RADIUS + MARKER_OFFSET);
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
                  onClick={(event) => {
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
              onClick={(event: any) => {
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
      )}
    </>
  );
}

export const GlobeScene = forwardRef<ForwardedCanvas, GlobeSceneProps>(function GlobeScene(
  {
    cam,
    nations,
    worldCountries,
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
  }: GlobeSceneProps,
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sizeRef = useRef<{ width: number; height: number }>({ width: 1, height: 1 });
  const earthMeshRef = useRef<THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial> | null>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const pointerVec = useRef(new THREE.Vector2());
  const visualStyle = mapStyle?.visual ?? DEFAULT_MAP_STYLE.visual;

  // Refs for missiles and explosions (for imperative API)
  const missilesRef = useRef<Map<string, MissileTrajectoryInstance>>(new Map());
  const explosionsRef = useRef<Map<string, { group: THREE.Group; startTime: number }>>(new Map());
  const missileIdCounterRef = useRef(0);
  const explosionIdCounterRef = useRef(0);
  const clockRef = useRef<THREE.Clock | null>(null);

  const texture = useMemo(() => {
    if (typeof document === 'undefined') return null;
    return buildAtlasTexture(worldCountries);
  }, [worldCountries]);

  const updateProjector = useCallback(() => {
    if (!onProjectorReady) return;
    const projector: ProjectorFn = (lon, lat) => {
      const size = sizeRef.current;
      const overlay = overlayRef.current;
      const isFlat =
        visualStyle === 'flat' || visualStyle === 'flat-realistic' || visualStyle === 'flat-nightlights';

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
    onProjectorReady(projector);
  }, [cam.x, cam.y, cam.zoom, visualStyle, onProjectorReady]);

  const updatePicker = useCallback(() => {
    if (!onPickerReady) return;
    const picker: PickerFn = (pointerX, pointerY) => {
      const container = containerRef.current;
      const overlay = overlayRef.current;
      if (!container) return null;

      const isFlat =
        visualStyle === 'flat' || visualStyle === 'flat-realistic' || visualStyle === 'flat-nightlights';
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
    onPickerReady(picker);
  }, [cam.x, cam.y, cam.zoom, visualStyle, onPickerReady]);

  const handleRegister = useCallback(
    ({ camera, size, earth }: SceneRegistration) => {
      cameraRef.current = camera;
      sizeRef.current = size;
      earthMeshRef.current = earth;
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
  const fireMissile = useCallback((
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

    const instance = createMissileTrajectory(trajectory, latLonToVector3, EARTH_RADIUS);
    instance.startTime = clockRef.current?.getElapsedTime() || 0;
    missilesRef.current.set(id, instance);

    return id;
  }, []);

  const addExplosion = useCallback((
    lon: number,
    lat: number,
    radiusKm: number = 50
  ): void => {
    const position = latLonToVector3(lon, lat, EARTH_RADIUS + 0.01);
    const explosion = createExplosion(position, radiusKm);
    const id = `explosion-${++explosionIdCounterRef.current}`;

    explosionsRef.current.set(id, {
      group: explosion,
      startTime: clockRef.current?.getElapsedTime() || 0
    });
  }, []);

  const clearMissiles = useCallback(() => {
    missilesRef.current.clear();
  }, []);

  const clearExplosions = useCallback(() => {
    explosionsRef.current.clear();
  }, []);

  // Store clock ref for missile timing
  useEffect(() => {
    const canvas = containerRef.current?.querySelector('canvas');
    if (canvas) {
      // Clock will be available from Three.js context
      clockRef.current = new THREE.Clock();
    }
  }, []);

  useImperativeHandle(ref, () => overlayRef.current); // forward overlay canvas element

  return (
    <div ref={containerRef} className="globe-scene">
      <Canvas
        className="globe-scene__webgl"
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, EARTH_RADIUS + 3], fov: 40, near: 0.1, far: 100 }}
        shadows
      >
        <SceneContent
          cam={cam}
          texture={texture}
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
        />
      </Canvas>
      <canvas ref={overlayRef} className="globe-scene__overlay" />
    </div>
  );
});

export default GlobeScene;
