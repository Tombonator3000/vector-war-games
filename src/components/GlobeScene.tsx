import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, Suspense } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import * as THREE from 'three';

import type { FeatureCollection, Polygon, MultiPolygon } from 'geojson';

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
  onNationClick?: (nationId: string) => void;
  onProjectorReady?: (projector: ProjectorFn) => void;
  onPickerReady?: (picker: PickerFn) => void;
}

interface SceneRegistration {
  camera: THREE.PerspectiveCamera;
  size: { width: number; height: number };
  earth: THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial> | null;
}

type ForwardedCanvas = HTMLCanvasElement | null;

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
    coords.forEach(([lon, lat], index) => {
      const x = ((lon + 180) / 360) * canvas.width;
      const y = ((90 - lat) / 180) * canvas.height;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
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
        drawRing(geometry.coordinates[0] as number[][]);
      } else if (geometry.type === 'MultiPolygon') {
        for (const polygon of geometry.coordinates) {
          drawRing(polygon[0] as number[][]);
        }
      }
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
          <mesh key={light.id} position={position.toArray() as [number, number, number]}>
            <sphereGeometry args={[0.032, 8, 8]} />
            <meshBasicMaterial 
              color={color} 
              transparent
              opacity={light.brightness}
              toneMapped={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function EarthWithTextures({
  earthRef,
  vectorTexture,
}: {
  earthRef: React.RefObject<THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>>;
  vectorTexture: THREE.Texture | null;
}) {
  const textureUrls = useMemo(() => {
    const baseUrl = import.meta.env.BASE_URL;
    const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    return [
      `${normalizedBase}textures/earth_day.jpg`,
      `${normalizedBase}textures/earth_normal.jpg`,
      `${normalizedBase}textures/earth_specular.jpg`,
    ];
  }, []);

  // Use React Three Fiber's useLoader for proper texture loading with Suspense
  const [dayMap, normalMap, specularMap] = useLoader(
    THREE.TextureLoader,
    textureUrls,
    (loader) => {
      // Success callback
      console.log('Earth textures loaded successfully');
    },
    (error) => {
      // Error callback
      console.error('Failed to load Earth textures:', error);
    }
  );

  // Configure textures for optimal quality
  useEffect(() => {
    if (dayMap) {
      dayMap.colorSpace = THREE.SRGBColorSpace;
      dayMap.anisotropy = 16; // Improve texture quality at angles
    }
    if (normalMap) {
      normalMap.anisotropy = 16;
    }
    if (specularMap) {
      specularMap.colorSpace = THREE.SRGBColorSpace;
      specularMap.anisotropy = 16;
    }
  }, [dayMap, normalMap, specularMap]);

  return (
    <mesh ref={earthRef} castShadow receiveShadow>
      <sphereGeometry args={[EARTH_RADIUS, 128, 128]} />
      <meshPhongMaterial
        map={dayMap}
        normalMap={normalMap}
        specularMap={specularMap}
        shininess={25}
        normalScale={new THREE.Vector2(1.2, 1.2)}
        emissive={new THREE.Color('#001122')}
        emissiveIntensity={0.1}
      />
    </mesh>
  );
}

function SceneContent({
  cam,
  texture,
  nations,
  onNationClick,
  register,
}: {
  cam: GlobeSceneProps['cam'];
  texture: THREE.Texture | null;
  nations: GlobeSceneProps['nations'];
  onNationClick?: GlobeSceneProps['onNationClick'];
  register: (registration: SceneRegistration) => void;
}) {
  const { camera, size } = useThree();
  const earthRef = useRef<THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>>(null);

  useEffect(() => {
    register({
      camera: camera as THREE.PerspectiveCamera,
      size,
      earth: earthRef.current,
    });
  }, [camera, register, size]);

  useFrame(() => {
    const earth = earthRef.current;
    if (!earth) return;

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

    earth.rotation.y = THREE.MathUtils.degToRad(centerLon + 180);
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[6, 4, 3]} intensity={1.2} castShadow />
      <directionalLight position={[-5, -3, -6]} intensity={0.4} color={new THREE.Color('#0af')} />
      <Suspense fallback={null}>
        <EarthWithTextures earthRef={earthRef} vectorTexture={texture} />
      </Suspense>
      <CityLights nations={nations} />
      <group>
        {nations.map(nation => {
          if (Number.isNaN(nation.lon) || Number.isNaN(nation.lat)) return null;
          const position = latLonToVector3(nation.lon, nation.lat, EARTH_RADIUS + MARKER_OFFSET);
          const markerColor = nation.isPlayer ? '#7cff6b' : nation.color || '#ff6b6b';
          return (
            <mesh
              key={nation.id}
              position={position.toArray() as [number, number, number]}
              onClick={(event) => {
                event.stopPropagation();
                onNationClick?.(nation.id);
              }}
            >
              <sphereGeometry args={[0.06, 16, 16]} />
              <meshStandardMaterial color={markerColor} emissive={markerColor} emissiveIntensity={0.6} />
            </mesh>
          );
        })}
      </group>
    </>
  );
}

export const GlobeScene = forwardRef<ForwardedCanvas, GlobeSceneProps>(function GlobeScene(
  { cam, nations, worldCountries, onNationClick, onProjectorReady, onPickerReady }: GlobeSceneProps,
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sizeRef = useRef<{ width: number; height: number }>({ width: 1, height: 1 });
  const earthMeshRef = useRef<THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial> | null>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const pointerVec = useRef(new THREE.Vector2());

  const texture = useMemo(() => {
    if (typeof document === 'undefined') return null;
    return buildAtlasTexture(worldCountries);
  }, [worldCountries]);

  const updateProjector = useCallback(() => {
    if (!onProjectorReady) return;
    const projector: ProjectorFn = (lon, lat) => {
      const camera = cameraRef.current;
      const size = sizeRef.current;
      if (!camera || !size) {
        return {
          x: ((lon + 180) / 360) * size.width,
          y: ((90 - lat) / 180) * size.height,
          visible: true,
        };
      }
      const vector = latLonToVector3(lon, lat, EARTH_RADIUS + MARKER_OFFSET * 0.5);
      vector.project(camera);
      return {
        x: (vector.x * 0.5 + 0.5) * size.width,
        y: (-vector.y * 0.5 + 0.5) * size.height,
        visible: vector.z < 1,
      };
    };
    onProjectorReady(projector);
  }, [onProjectorReady]);

  const updatePicker = useCallback(() => {
    if (!onPickerReady) return;
    const picker: PickerFn = (pointerX, pointerY) => {
      const camera = cameraRef.current;
      const earth = earthMeshRef.current;
      const container = containerRef.current;
      if (!camera || !earth || !container) return null;

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
  }, [onPickerReady]);

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
          onNationClick={onNationClick}
          register={handleRegister}
        />
      </Canvas>
      <canvas ref={overlayRef} className="globe-scene__overlay" />
    </div>
  );
});

export default GlobeScene;
