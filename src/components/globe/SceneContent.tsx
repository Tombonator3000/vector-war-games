import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { SceneContentProps } from '@/types/globe';
import { EARTH_RADIUS } from '@/constants/globe.constants';
import { EMPTY_TERRITORIES, EMPTY_TERRITORY_STATES, EMPTY_UNITS, EMPTY_WEATHER_CLOUDS } from '@/constants/globeScene.constants';
import { DEFAULT_MAP_STYLE } from '@/constants/map.constants';
import { createTerritoryBoundaries } from '@/lib/territoryPolygons';
import { animateExplosion, updateMissileAnimation, updateMissileTrajectoryPositions } from '@/lib/missileTrajectories';
import { createUnitBillboard, disposeUnitVisualization, type UnitVisualization } from '@/lib/unitModels';
import { getMorphedPosition, getFlatMapCameraDistance } from '@/lib/globe/geometry';
import { disposeObject, disposeMissileInstance, disposeExplosionGroup, resolveCssRendererSize } from '@/lib/globe/sceneResources';
import { MorphingGlobe, type MorphingGlobeHandle } from '@/components/MorphingGlobe';
import { WeatherClouds } from '@/components/WeatherClouds';
import { TerritoryMarkers } from '@/components/TerritoryMarkers';
import { Atmosphere } from './Atmosphere';

export function SceneContent({
  cam,
  nations,
  territories = EMPTY_TERRITORIES,
  territoryStates = EMPTY_TERRITORY_STATES,
  playerId = null,
  units = EMPTY_UNITS,
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
  dayNightBlend,
  worldCountries,
  onCameraPoseUpdate,
  onMorphingGlobeReady,
  onMorphProgress,
  showVectorOverlay = false,
  vectorColor = '#2ef1ff',
  vectorOpacity = 0.7,
  vectorOnlyMode = false,
  weatherClouds = EMPTY_WEATHER_CLOUDS,
  showWeatherClouds = false,
  weatherCloudOpacity = 0.8,
  showCloudShadows = true,
}: SceneContentProps) {
  const { camera, size, clock, gl } = useThree();
  const earthRef = useRef<THREE.Mesh | null>(null);
  const morphingGlobeRef = useRef<MorphingGlobeHandle>(null);
  // Map mode overlays are handled by dedicated SVG components (e.g. PoliticalStabilityOverlay)
  // The 3D scene only renders the base map and nation markers
  const cameraPoseUpdateRef = useRef<typeof onCameraPoseUpdate>();
  const [morphFactor, setMorphFactorState] = useState(0);
  const prevMorphFactorRef = useRef(morphFactor);
  const isFlat = morphFactor > 0.5; // Considered "flat" when morph factor is above 0.5

  useEffect(() => {
    cameraPoseUpdateRef.current = onCameraPoseUpdate;
  }, [onCameraPoseUpdate]);

  // Handle morph progress updates from MorphingGlobe
  const handleMorphProgressInternal = useCallback((factor: number) => {
    setMorphFactorState(factor);
    onMorphProgress?.(factor);
  }, [onMorphProgress]);

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
  const flatCameraDistance = getFlatMapCameraDistance((camera as THREE.PerspectiveCamera).fov, cssWidth / cssHeight);

  const latLonToSceneVector = useCallback(
    (lon: number, lat: number, radius: number) => getMorphedPosition(lon, lat, morphFactor, radius),
    [morphFactor],
  );

  const handleSurfaceReady = useCallback((earth: THREE.Mesh) => {
    register({
      camera: camera as THREE.PerspectiveCamera,
      size: { width: cssWidth, height: cssHeight },
      earth, clock, projectPosition: latLonToSceneVector,
    });
    onMorphingGlobeReady?.(morphingGlobeRef.current);
  }, [camera, clock, cssWidth, cssHeight, register, onMorphingGlobeReady, latLonToSceneVector]);

  // Territory boundaries state
  const [territoryGroups, setTerritoryGroups] = useState<THREE.Group[]>([]);

  // Unit visualizations state
  const [unitVisualizations, setUnitVisualizations] = useState<UnitVisualization[]>([]);

  // Note: Map mode overlays (diplomatic, intel, resources, unrest, pandemic, radiation, migration)
  // are now handled by dedicated SVG overlay components rather than 3D spherical overlays.
  // This provides better territory-based visualization that matches the map boundaries.

  useEffect(() => {
    register({
      camera: camera as THREE.PerspectiveCamera,
      size: { width: cssWidth, height: cssHeight },
      earth: earthRef.current,
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
    perspective.position.set(0, 0, flatCameraDistance);
    perspective.lookAt(0, 0, 0);
    perspective.updateProjectionMatrix();
  }, [camera, isFlat, flatCameraDistance]);

  useFrame(() => {
    const currentTime = clock.getElapsedTime();

    // Update missile positions when morphFactor changes (2D/3D view transition)
    if (morphFactor !== prevMorphFactorRef.current) {
      prevMorphFactorRef.current = morphFactor;
      missilesRef.current.forEach((missile) => {
        updateMissileTrajectoryPositions(missile, latLonToSceneVector, EARTH_RADIUS);
      });
    }

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

  // Determine if night mode based on flatMapVariant prop
  const isNightMode = flatMapVariant === false || flatMapVariant === 'night';

  // Unified map rendering - always uses MorphingGlobe
  const renderEarth = () => {
    const fallback = (
      <mesh ref={earthRef}>
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <meshStandardMaterial color="#0a1929" />
      </mesh>
    );

    return (
      <Suspense fallback={fallback}>
        <MorphingGlobe
          ref={morphingGlobeRef}
          initialView="globe"
          meshRef={earthRef}
          onSurfaceReady={handleSurfaceReady}
          animationDuration={1.2}
          textureVariant={isNightMode ? 'night' : 'day'}
          dayNightBlend={dayNightBlend}
          onMorphProgress={handleMorphProgressInternal}
          worldCountries={worldCountries}
          showVectorOverlay={showVectorOverlay}
          vectorColor={vectorColor}
          vectorOpacity={vectorOpacity}
          vectorOnlyMode={vectorOnlyMode}
        />
        {/* Atmosphere - fades out as we transition to flat */}
        <Atmosphere morphFactor={morphFactor} />
        {/* Weather clouds - rendered above atmosphere with shadows */}
        {showWeatherClouds && weatherClouds.length > 0 && (
          <WeatherClouds
            clouds={weatherClouds}
            morphFactor={morphFactor}
            opacity={weatherCloudOpacity}
            showShadows={showCloudShadows}
          />
        )}
      </Suspense>
    );
  };

  // Determine if we're in "flat" mode based on morph factor
  const isEffectivelyFlat = morphFactor > 0.7;

  return (
    <>
      {/* MorphingGlobe handles its own lighting, no additional lights needed */}
      {renderEarth()}
      <group>
        {/* Nation capital markers removed - caused black circle artifacts behind labels.
            Click handling is now done via HTML overlays instead of 3D meshes. */}

        {/* Territory boundaries - only render if vector overlay is disabled to avoid duplication */}
        {!showVectorOverlay && territoryGroups.map((group, i) => (
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

      {/* OrbitControls - behavior adapts based on morph factor */}
      <OrbitControls
        enableRotate={morphFactor < 0.7}
        enableZoom={true}
        enablePan={morphFactor > 0.3}
        minDistance={EARTH_RADIUS + 1.3}
        maxDistance={Math.max(EARTH_RADIUS + 5, flatCameraDistance * 1.2)}
        mouseButtons={{
          LEFT: isEffectivelyFlat ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN,
        }}
        touches={{
          ONE: isEffectivelyFlat ? THREE.TOUCH.PAN : THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN,
        }}
        rotateSpeed={0.8}
        zoomSpeed={1.0}
        panSpeed={0.8}
      />
    </>
  );
}

