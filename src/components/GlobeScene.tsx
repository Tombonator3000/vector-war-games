import { forwardRef, useCallback, useEffect, useImperativeHandle, useReducer, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import type { GlobeSceneHandle, GlobeSceneProps, SceneRegistration, ProjectorFn, PickerFn } from '@/types/globe';
import type { MorphingGlobeHandle } from '@/components/MorphingGlobe';
import { EARTH_RADIUS } from '@/constants/globe.constants';
import { EMPTY_WEATHER_CLOUDS } from '@/constants/globeScene.constants';
import { DEFAULT_MAP_STYLE } from '@/constants/map.constants';
import { getMorphedPosition, getMorphedNormal, lonLatFromUv, isProjectedPointVisible } from '@/lib/globe/geometry';
import { latLonToVector3, disposeMissileInstance, disposeExplosionGroup } from '@/lib/globe/sceneResources';
import { createMissileTrajectory, createExplosion, type MissileTrajectory, type MissileTrajectoryInstance } from '@/lib/missileTrajectories';
import { SceneContent } from './globe/SceneContent';

export type {
  ProjectorFn, PickerFn, MapVisualStyle, MapMode, MapStyle, MapModeOverlayData,
  RadiationOverlayPayload, GlobeSceneHandle, GlobeSceneProps,
} from '@/types/globe';
export { MAP_VISUAL_STYLES, UNIFIED_MAP_STYLE, MAP_MODES, DEFAULT_MAP_STYLE } from '@/constants/map.constants';

const DEBUG_OVERLAY = false;
const NOOP_PROJECTOR: ProjectorFn = () => ({ x: 0, y: 0, visible: false });
const NOOP_PICKER: PickerFn = () => null;

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
    dayNightBlend,
    showVectorOverlay = false,
    vectorColor = '#2ef1ff',
    vectorOpacity = 0.7,
    vectorOnlyMode = false,
    weatherClouds = EMPTY_WEATHER_CLOUDS,
    showWeatherClouds = false,
    weatherCloudOpacity = 0.8,
    showCloudShadows = true,
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
    isMountedRef.current = true;
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

      // Projection uses CSS pixels; the canvas backing buffer may have a capped DPR.
      const width = overlay?.clientWidth || size?.width || 1;
      const height = overlay?.clientHeight || size?.height || 1;
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
        return { x: 0, y: 0, visible: false };
      }

      const camera = cameraRef.current;
      if (!camera) {
        const baseX = ((lon + 180) / 360) * width;
        const baseY = ((90 - lat) / 180) * height;
        return {
          x: baseX,
          y: baseY,
          visible: true,
        };
      }

      // Unified morphing mode - use morphed position based on current morph factor
      const morphFactor = morphingGlobeHandleRef.current?.getMorphFactor() ?? 0;
      const worldVector = getMorphedPosition(lon, lat, morphFactor, EARTH_RADIUS);

      camera.getWorldPosition(cameraWorldPosition);
      getMorphedNormal(lon, lat, morphFactor, surfaceNormal);
      cameraToSurface.subVectors(cameraWorldPosition, worldVector);

      projectedVector.copy(worldVector).project(camera);
      const isVisible = isProjectedPointVisible(projectedVector, surfaceNormal, cameraToSurface);

      return {
        x: (projectedVector.x * 0.5 + 0.5) * width,
        y: (-projectedVector.y * 0.5 + 0.5) * height,
        visible: isVisible,
      };
    };
    projectorRef.current = projector;
    projectorRevisionRef.current += 1;
    emitInitialProjector(projector);
  }, [cam.x, cam.y, cam.zoom, emitInitialProjector]);

  const updatePicker = useCallback(() => {
    const picker: PickerFn = (pointerX, pointerY) => {
      const container = containerRef.current;
      if (!container) return null;

      const camera = cameraRef.current;
      const earth = earthMeshRef.current;
      if (!camera || !earth) return null;

      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0 || pointerX < 0 || pointerY < 0
        || pointerX > rect.width || pointerY > rect.height) return null;
      pointerVec.current.set(
        (pointerX / rect.width) * 2 - 1,
        -(pointerY / rect.height) * 2 + 1,
      );

      raycasterRef.current.setFromCamera(pointerVec.current, camera);
      const intersections = raycasterRef.current.intersectObject(earth, false);
      if (!intersections.length) {
        return null;
      }

      // Barycentric UV interpolation works on the globe, flat map, and every
      // intermediate shape. CPU geometry is kept in sync with the shader.
      const uv = intersections[0].uv;
      return uv ? lonLatFromUv(uv) : null;
    };
    pickerRef.current = picker;
    if (onPickerReady) {
      onPickerReady(picker);
    }
  }, [cam.x, cam.y, cam.zoom, onPickerReady]);

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
      setVectorOverlay: (visible: boolean) => {
        morphingGlobeHandleRef.current?.setVectorOverlay(visible);
      },
      getVectorOverlay: () => {
        return morphingGlobeHandleRef.current?.getVectorOverlay() ?? false;
      },
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
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10 }}
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
          dayNightBlend={dayNightBlend}
          worldCountries={worldCountries}
          onCameraPoseUpdate={handleCameraPoseUpdate}
          onMorphingGlobeReady={handleMorphingGlobeReady}
          showVectorOverlay={showVectorOverlay}
          vectorColor={vectorColor}
          vectorOpacity={vectorOpacity}
          vectorOnlyMode={vectorOnlyMode}
          weatherClouds={weatherClouds}
          showWeatherClouds={showWeatherClouds}
          weatherCloudOpacity={weatherCloudOpacity}
          showCloudShadows={showCloudShadows}
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
          // Unified morphing mode - always let Three.js handle interactions
          pointerEvents: 'none',
          // Overlay must be above WebGL canvas (zIndex: 10) to show missiles, explosions, trails
          zIndex: 20,
          ...(DEBUG_OVERLAY ? { border: '2px solid red' } : {})
        }}
      />
    </div>
  );
});

export default GlobeScene;

// Re-export morphing utilities for external use
export { getMorphedPosition, type MorphingGlobeHandle } from '@/components/MorphingGlobe';
