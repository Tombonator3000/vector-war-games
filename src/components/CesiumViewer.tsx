import { useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import {
  Viewer,
  Ion,
  IonImageryProvider,
  OpenStreetMapImageryProvider,
  createWorldTerrainAsync,
  Cartesian3,
  Color,
  Math as CesiumMath,
  Entity,
  defined,
  Cartographic,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  JulianDate,
  PolylineGlowMaterialProperty,
  ColorMaterialProperty,
  CallbackProperty,
  PolygonHierarchy,
  HeightReference,
  SampledPositionProperty,
  VelocityOrientationProperty,
  BillboardGraphics,
  ModelGraphics,
  PointGraphics,
  ImageryProvider,
  ImageryLayer,
  TerrainProvider,
  Ellipsoid,
  Transforms,
  Cartesian2,
  Matrix4,
  Quaternion,
  HeadingPitchRoll,
  ClockRange,
  ClockStep,
  TimeIntervalCollection,
  TimeInterval,
  SingleTileImageryProvider,
  Rectangle,
  GridImageryProvider,
  ArcGisMapServerImageryProvider,
} from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import type { MapStyle } from '@/components/GlobeScene';
import type { TerritoryState, ConventionalUnitState } from '@/hooks/useConventionalWarfare';
import type { Nation } from '@/types/game';
import {
  getTerritoryPolygonHierarchy,
  getTerritoryCenter,
  generateWeatherPatterns,
  UNIT_3D_MODELS,
  SATELLITE_ORBITS,
  calculateSatellitePosition,
  type SatelliteOrbit,
} from '@/utils/cesiumTerritoryData';

const ionAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN ?? '';
Ion.defaultAccessToken = ionAccessToken;
const hasIonAccess = ionAccessToken.length > 0;

const resolvePublicAssetPath = (assetPath: string) => {
  const base = import.meta.env.BASE_URL ?? '/';
  const trimmedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const trimmedAsset = assetPath.startsWith('/') ? assetPath.slice(1) : assetPath;

  if (!trimmedBase) {
    return `/${trimmedAsset}`;
  }

  return `${trimmedBase}/${trimmedAsset}`;
};

export interface CesiumViewerProps {
  territories?: TerritoryState[];
  units?: ConventionalUnitState[];
  nations?: Nation[];
  onTerritoryClick?: (territoryId: string) => void;
  onUnitClick?: (unitId: string) => void;
  enableDayNight?: boolean;
  showInfections?: boolean;
  infectionData?: Record<string, number>; // countryId -> infection percentage
  className?: string;
  mapStyle?: MapStyle;
  // Phase 2 & 3 features
  enableTerrain?: boolean; // 3D terrain elevation
  enable3DModels?: boolean; // Use 3D models for units instead of points
  enableWeather?: boolean; // Show weather/cloud overlays
  enableSatellites?: boolean; // Show satellite orbital views
  enableParticleEffects?: boolean; // Advanced particle effects for explosions
  animateUnits?: boolean; // Smooth unit movement animations
}

export interface CesiumViewerHandle {
  flyTo: (lon: number, lat: number, height?: number) => void;
  addMissileTrajectory: (from: { lon: number; lat: number }, to: { lon: number; lat: number }, animated?: boolean) => void;
  addExplosion: (lon: number, lat: number, radiusKm?: number, useParticles?: boolean) => void;
  highlightTerritory: (territoryId: string) => void;
  moveUnit: (unitId: string, fromLon: number, fromLat: number, toLon: number, toLat: number, durationSeconds?: number) => void;
  focusSatellite: (satelliteId: string) => void;
  addWeatherEvent: (lon: number, lat: number, type: 'storm' | 'clouds', intensity: number) => void;
}

const CesiumViewer = forwardRef<CesiumViewerHandle, CesiumViewerProps>(({
  territories = [],
  units = [],
  nations = [],
  onTerritoryClick,
  onUnitClick,
  enableDayNight = true,
  showInfections = false,
  infectionData = {},
  className = '',
  mapStyle = 'realistic',
  enableTerrain = true,
  enable3DModels = true,
  enableWeather = true,
  enableSatellites = true,
  enableParticleEffects = true,
  animateUnits = true,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const entitiesRef = useRef<Map<string, Entity>>(new Map());
  const handlerRef = useRef<ScreenSpaceEventHandler | null>(null);
  const animationFrameRef = useRef<number>();
  const enableDayNightRef = useRef(enableDayNight);
  const territoryClickRef = useRef(onTerritoryClick);
  const unitClickRef = useRef(onUnitClick);
  const baseLayerRef = useRef<ImageryLayer | null>(null);
  const nightLayerRef = useRef<ImageryLayer | null>(null);
  const gridLayerRef = useRef<ImageryLayer | null>(null);
  const politicalLayerRef = useRef<ImageryLayer | null>(null);
  const flatRealisticLayerRef = useRef<ImageryLayer | null>(null);
  const cameraChangeCallbackRef = useRef<(() => void) | null>(null);
  const cameraHeightHelperRef = useRef<(() => number) | null>(null);

  const getCameraHeight = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer) {
      return Number.POSITIVE_INFINITY;
    }

    const camera = viewer.camera;
    const ellipsoid = viewer.scene.globe?.ellipsoid ?? Ellipsoid.WGS84;
    const cartographic = Cartographic.fromCartesian(camera.position, ellipsoid);

    if (cartographic) {
      return cartographic.height;
    }

    return Cartesian3.magnitude(camera.position);
  }, []);

  cameraHeightHelperRef.current = getCameraHeight;

  const detachCameraChangeListener = useCallback(() => {
    const viewer = viewerRef.current;
    const callback = cameraChangeCallbackRef.current;

    if (viewer && callback) {
      viewer.camera.changed.removeEventListener(callback);
    }

    cameraChangeCallbackRef.current = null;
  }, []);

  const applyDayNightSettings = useCallback((viewer: Viewer, enabled: boolean) => {
    viewer.scene.globe.enableLighting = enabled;
    viewer.clock.shouldAnimate = enabled;
    viewer.clock.multiplier = enabled ? 100 : 1;
    if (!enabled) {
      viewer.clock.currentTime = JulianDate.now();
    }
  }, []);

  const applyMapStyle = useCallback((style: MapStyle) => {
    const viewer = viewerRef.current;
    if (!viewer) {
      return;
    }

    const imageryLayers = viewer.imageryLayers;
    const controller = viewer.scene.screenSpaceCameraController;
    const isFlatRealisticStyle = style === 'flat-realistic';
    const FLAT_REALISTIC_TRANSLATE_THRESHOLD = 4_500_000;

    detachCameraChangeListener();
    controller.enableTranslate = true;

    let baseLayer = baseLayerRef.current;
    if (!baseLayer && imageryLayers.length > 0) {
      baseLayer = imageryLayers.get(0) ?? null;
      baseLayerRef.current = baseLayer;
    }

    const nightLayer = nightLayerRef.current ?? null;

    const removeLayer = (layerRef: { current: ImageryLayer | null }) => {
      if (layerRef.current) {
        imageryLayers.remove(layerRef.current, false);
        layerRef.current = null;
      }
    };

    removeLayer(gridLayerRef);
    removeLayer(politicalLayerRef);
    if (style !== 'flat-realistic') {
      removeLayer(flatRealisticLayerRef);
    }

    if (baseLayer) {
      baseLayer.show = true;
      baseLayer.alpha = 1;
      baseLayer.brightness = 1;
      baseLayer.contrast = 1;
      baseLayer.saturation = 1;
      baseLayer.gamma = 1;
    }

    if (nightLayer) {
      nightLayer.show = true;
      nightLayer.alpha = 0.25;
      nightLayer.brightness = 1.2;
    }

    const isFlatProjection = style === 'flat' || style === 'flat-realistic';
    if (isFlatProjection) {
      viewer.scene.morphTo2D(0);
      viewer.camera.setView({ destination: Rectangle.fromDegrees(-180, -90, 180, 90) });
      applyDayNightSettings(viewer, false);
    } else {
      viewer.scene.morphTo3D(0);
      const shouldEnableLighting = style === 'night' ? true : enableDayNightRef.current;
      applyDayNightSettings(viewer, shouldEnableLighting);
    }

    switch (style) {
      case 'wireframe': {
        if (baseLayer) {
          baseLayer.alpha = 0.65;
          baseLayer.brightness = 0.55;
          baseLayer.contrast = 1.4;
          baseLayer.saturation = 0;
        }

        const gridLayer = imageryLayers.addImageryProvider(
          new GridImageryProvider({
            color: Color.fromAlpha(Color.CYAN, 0.35),
            glowColor: Color.fromAlpha(Color.CYAN, 0.15),
            cells: 32,
          })
        );
        gridLayer.alpha = 0.7;
        gridLayerRef.current = gridLayer;

        if (nightLayer) {
          nightLayer.alpha = 0.1;
        }
        break;
      }
      case 'night': {
        if (baseLayer) {
          baseLayer.brightness = 0.35;
          baseLayer.contrast = 1.05;
          baseLayer.saturation = 0.85;
        }

        if (nightLayer) {
          nightLayer.alpha = 0.7;
          nightLayer.brightness = 1.8;
        }
        break;
      }
      case 'political': {
        if (baseLayer) {
          baseLayer.brightness = 1.05;
          baseLayer.contrast = 1.2;
          baseLayer.saturation = 1.25;
        }

        const politicalLayer = imageryLayers.addImageryProvider(
          new ArcGisMapServerImageryProvider({} as any)
        );
        politicalLayer.alpha = 0.6;
        politicalLayer.brightness = 1.1;
        politicalLayerRef.current = politicalLayer;

        if (nightLayer) {
          nightLayer.alpha = 0.15;
        }
        break;
      }
      case 'flat': {
        if (baseLayer) {
          baseLayer.brightness = 1.1;
          baseLayer.contrast = 1.1;
          baseLayer.saturation = 0.9;
        }

        if (nightLayer) {
          nightLayer.show = false;
        }

        const gridLayer = imageryLayers.addImageryProvider(
          new GridImageryProvider({
            color: Color.fromAlpha(Color.CYAN, 0.25),
            glowColor: Color.fromAlpha(Color.CYAN, 0.1),
            cells: 36,
          })
        );
        gridLayer.alpha = 0.5;
        gridLayerRef.current = gridLayer;
        break;
      }
      case 'flat-realistic': {
        if (nightLayer) {
          nightLayer.show = false;
        }

        if (baseLayer) {
          baseLayer.show = false;
        }

        let flatLayer = flatRealisticLayerRef.current;
        if (!flatLayer) {
          flatLayer = imageryLayers.addImageryProvider(
            new SingleTileImageryProvider({
              url: resolvePublicAssetPath('textures/earth_day.jpg'),
              rectangle: Rectangle.fromDegrees(-180, -90, 180, 90),
            }),
            0
          );
          flatRealisticLayerRef.current = flatLayer;
        }

        flatLayer.show = true;
        flatLayer.alpha = 1;
        flatLayer.brightness = 1.08;
        flatLayer.contrast = 1.1;

        const gridLayer = imageryLayers.addImageryProvider(
          new GridImageryProvider({
            color: Color.fromAlpha(Color.CYAN, 0.22),
            glowColor: Color.fromAlpha(Color.CYAN, 0.12),
            cells: 36,
          })
        );
        gridLayer.alpha = 0.55;
        gridLayerRef.current = gridLayer;

        const updateTranslateState = () => {
          const helper = cameraHeightHelperRef.current;
          const height = helper ? helper() : Number.POSITIVE_INFINITY;
          const shouldEnableTranslate = height <= FLAT_REALISTIC_TRANSLATE_THRESHOLD;

          if (controller.enableTranslate !== shouldEnableTranslate) {
            controller.enableTranslate = shouldEnableTranslate;
            viewer.scene.requestRender();
          }
        };

        cameraChangeCallbackRef.current = updateTranslateState;
        viewer.camera.changed.addEventListener(updateTranslateState);
        updateTranslateState();
        break;
      }
      default: {
        if (nightLayer) {
          nightLayer.alpha = 0.25;
          nightLayer.brightness = 1.2;
        }
        break;
      }
    }

    if (!isFlatRealisticStyle) {
      controller.enableTranslate = true;
    }

    viewer.scene.requestRender();
  }, [applyDayNightSettings, detachCameraChangeListener]);

  // Initialize Cesium Viewer
  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    const initViewer = async () => {
      try {
        let imageryProvider: ImageryProvider | undefined;
        if (hasIonAccess) {
          try {
            imageryProvider = await IonImageryProvider.fromAssetId(2);
          } catch (error) {
            console.warn('Failed to load Cesium Ion imagery. Falling back to OpenStreetMap.', error);
          }
        }

        if (!imageryProvider) {
          imageryProvider = new OpenStreetMapImageryProvider({
            url: 'https://a.tile.openstreetmap.org/',
          });
        }

        let terrainProvider: TerrainProvider | undefined;
        if (enableTerrain && hasIonAccess) {
          try {
            terrainProvider = await createWorldTerrainAsync();
          } catch (error) {
            console.warn('Failed to load Cesium Ion terrain. Continuing with ellipsoid terrain.', error);
          }
        }

        const viewer = new Viewer(containerRef.current!, {
          baseLayerPicker: false,
          geocoder: false,
          homeButton: false,
          sceneModePicker: false,
          navigationHelpButton: false,
          animation: false,
          timeline: false,
          fullscreenButton: false,
          vrButton: false,
          infoBox: false,
          selectionIndicator: false,
          imageryProvider: imageryProvider,
          ...(terrainProvider ? { terrain: { provider: terrainProvider } } : {}),
        } as any);

        viewerRef.current = viewer;

        applyDayNightSettings(viewer, enableDayNightRef.current);
        viewer.scene.globe.showGroundAtmosphere = true;
        viewer.scene.skyAtmosphere.show = true;

        const nightTextureUrl = resolvePublicAssetPath('textures/earth_specular.jpg');
        const nightLayer = viewer.imageryLayers.addImageryProvider(
          new SingleTileImageryProvider({
            url: nightTextureUrl,
            rectangle: Rectangle.fromDegrees(-180, -90, 180, 90),
          })
        );
        nightLayer.alpha = 0.25;
        nightLayer.brightness = 1.2;
        nightLayerRef.current = nightLayer;

        if (viewer.imageryLayers.length > 0) {
          baseLayerRef.current = viewer.imageryLayers.get(0) ?? null;
        }

        // Set camera to orbital view
        viewer.camera.setView({
          destination: Cartesian3.fromDegrees(0, 30, 20000000),
          orientation: {
            heading: 0,
            pitch: CesiumMath.toRadians(-90),
            roll: 0,
          },
        });

        // Enable lighting for day/night cycle
        if (enableDayNight) {
          viewer.scene.globe.enableLighting = true;
          viewer.clock.currentTime = JulianDate.now();
          // Animate the clock for realistic day/night progression
          viewer.clock.shouldAnimate = true;
          viewer.clock.multiplier = 100; // Speed up time
        }

        // Configure globe appearance
        viewer.scene.globe.show = true;
        viewer.scene.globe.baseColor = Color.fromCssColorString('#0a1628');
        viewer.scene.backgroundColor = Color.BLACK;
        viewer.scene.skyBox.show = true;

        // Enable depth testing when terrain meshes are available for accurate 3D intersections.
        viewer.scene.globe.depthTestAgainstTerrain = Boolean(terrainProvider);

        // Setup click handler
        const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
        handlerRef.current = handler;

        handler.setInputAction((movement: any) => {
          const pickedObject = viewer.scene.pick(movement.position);
          if (defined(pickedObject) && pickedObject.id) {
            const entity = pickedObject.id as Entity;
            if (entity.name?.startsWith('territory-')) {
              const territoryId = entity.name.replace('territory-', '');
              territoryClickRef.current?.(territoryId);
            } else if (entity.name?.startsWith('unit-')) {
              const unitId = entity.name.replace('unit-', '');
              unitClickRef.current?.(unitId);
            }
          }
        }, ScreenSpaceEventType.LEFT_CLICK);

        applyMapStyle(mapStyle);

      } catch (error) {
        console.error('Failed to initialize Cesium viewer:', error);
      }
    };

    initViewer();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (handlerRef.current) {
        handlerRef.current.destroy();
      }
      detachCameraChangeListener();
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [applyDayNightSettings, applyMapStyle, detachCameraChangeListener, enableDayNight, enableTerrain, mapStyle]);

  useEffect(() => {
    enableDayNightRef.current = enableDayNight;
    const viewer = viewerRef.current;
    if (!viewer) return;

    applyDayNightSettings(viewer, enableDayNight);
  }, [enableDayNight, applyDayNightSettings]);

  useEffect(() => {
    territoryClickRef.current = onTerritoryClick;
  }, [onTerritoryClick]);

  useEffect(() => {
    unitClickRef.current = onUnitClick;
  }, [onUnitClick]);

  useEffect(() => {
    applyMapStyle(mapStyle);
  }, [mapStyle, applyMapStyle]);


  // Render territories with GeoJSON boundaries (Phase 2 improvement)
  useEffect(() => {
    if (!viewerRef.current) return;

    const viewer = viewerRef.current;

    // Clear old territory entities
    entitiesRef.current.forEach((entity, key) => {
      if (key.startsWith('territory-')) {
        viewer.entities.remove(entity);
        entitiesRef.current.delete(key);
      }
    });

    // Add new territory entities with GeoJSON polygon boundaries
    territories.forEach(territory => {
      const nation = nations.find(n => n.id === territory.controllingNationId);
      const color = nation ? Color.fromCssColorString(nation.color) : Color.GRAY;

      // Try to get GeoJSON boundary, fallback to circular region
      const polygonCoords = getTerritoryPolygonHierarchy(territory.id);
      const labelPosition = getTerritoryCenter(territory.id);

      const entityConfig: any = {
        name: `territory-${territory.id}`,
        description: `
          <div style="padding: 10px;">
            <h3>${territory.name}</h3>
            <p><strong>Owner:</strong> ${nation?.name || 'Uncontrolled'}</p>
            <p><strong>Strategic Value:</strong> ${territory.strategicValue}</p>
            <p><strong>Production Bonus:</strong> +${territory.productionBonus}</p>
            <p><strong>Conflict Risk:</strong> ${territory.conflictRisk}%</p>
          </div>
        `,
      };

      if (polygonCoords && polygonCoords.length > 0) {
        // Use GeoJSON polygon boundary
        entityConfig.polygon = {
          hierarchy: new PolygonHierarchy(
            Cartesian3.fromDegreesArray(polygonCoords)
          ),
          material: color.withAlpha(0.4),
          outline: true,
          outlineColor: Color.WHITE.withAlpha(0.8),
          outlineWidth: 2,
          height: 0,
          extrudedHeight: 0,
        };
        entityConfig.position = labelPosition
          ? Cartesian3.fromDegrees(labelPosition.lon, labelPosition.lat, 0)
          : Cartesian3.fromDegrees(territory.anchorLon, territory.anchorLat, 0);
      } else {
        // Fallback to circular region
        entityConfig.position = Cartesian3.fromDegrees(territory.anchorLon, territory.anchorLat, 0);
        entityConfig.ellipse = {
          semiMinorAxis: 800000,
          semiMajorAxis: 800000,
          material: color.withAlpha(0.4),
          outline: true,
          outlineColor: Color.WHITE.withAlpha(0.8),
          outlineWidth: 2,
          height: 0,
        };
      }

      // Add label
      entityConfig.label = {
        text: territory.name,
        font: '14px monospace',
        fillColor: Color.WHITE,
        outlineColor: Color.BLACK,
        outlineWidth: 2,
        style: 1, // FILL_AND_OUTLINE
        pixelOffset: new Cartesian2(0, -50),
        showBackground: true,
        backgroundColor: Color.BLACK.withAlpha(0.7),
        backgroundPadding: new Cartesian2(8, 4),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      };

      const entity = viewer.entities.add(entityConfig);
      entitiesRef.current.set(`territory-${territory.id}`, entity);
    });
  }, [territories, nations]);

  // Render territory connections (neighbor borders)
  useEffect(() => {
    if (!viewerRef.current || !territories || territories.length === 0) return;

    const viewer = viewerRef.current;

    // Clear old connection entities
    entitiesRef.current.forEach((entity, key) => {
      if (key.startsWith('connection-')) {
        viewer.entities.remove(entity);
        entitiesRef.current.delete(key);
      }
    });

    // Create connections between neighboring territories
    const processedPairs = new Set<string>();

    territories.forEach(territory => {
      const fromCenter = getTerritoryCenter(territory.id);
      if (!fromCenter) return;

      territory.neighbors.forEach(neighborId => {
        // Create a unique key for this connection (sorted to avoid duplicates)
        const pairKey = [territory.id, neighborId].sort().join('-');
        if (processedPairs.has(pairKey)) return;
        processedPairs.add(pairKey);

        const neighbor = territories.find(t => t.id === neighborId);
        if (!neighbor) return;

        const toCenter = getTerritoryCenter(neighborId);
        if (!toCenter) return;

        // Determine line color based on ownership
        let lineColor: Color;
        let lineWidth: number;
        let glowPower: number;

        const fromNation = nations.find(n => n.id === territory.controllingNationId);
        const toNation = nations.find(n => n.id === neighbor.controllingNationId);

        if (territory.controllingNationId === neighbor.controllingNationId) {
          // Same owner - friendly connection (green)
          lineColor = Color.GREEN.withAlpha(0.4);
          lineWidth = 2;
          glowPower = 0.1;
        } else if (territory.controllingNationId && neighbor.controllingNationId) {
          // Different owners - hostile border (red)
          lineColor = Color.RED.withAlpha(0.6);
          lineWidth = 4;
          glowPower = 0.25;
        } else {
          // One or both uncontrolled - neutral (yellow)
          lineColor = Color.YELLOW.withAlpha(0.3);
          lineWidth = 2;
          glowPower = 0.1;
        }

        // Create polyline connecting the two territories
        const connectionEntity = viewer.entities.add({
          name: `connection-${pairKey}`,
          polyline: {
            positions: [
              Cartesian3.fromDegrees(fromCenter.lon, fromCenter.lat, 10000),
              Cartesian3.fromDegrees(toCenter.lon, toCenter.lat, 10000),
            ],
            width: lineWidth,
            material: new PolylineGlowMaterialProperty({
              glowPower: glowPower,
              taperPower: 0.5,
              color: lineColor,
            }),
            clampToGround: false,
          },
          description: `
            <div style="padding: 10px;">
              <h4>Territory Connection</h4>
              <p><strong>From:</strong> ${territory.name} (${fromNation?.name || 'Uncontrolled'})</p>
              <p><strong>To:</strong> ${neighbor.name} (${toNation?.name || 'Uncontrolled'})</p>
              <p><strong>Status:</strong> ${
                territory.controllingNationId === neighbor.controllingNationId
                  ? 'Friendly Territory'
                  : territory.controllingNationId && neighbor.controllingNationId
                  ? 'Hostile Border'
                  : 'Neutral Border'
              }</p>
            </div>
          `,
        });

        entitiesRef.current.set(`connection-${pairKey}`, connectionEntity);
      });
    });
  }, [territories, nations]);

  // Render military units with 3D models (Phase 2 improvement)
  useEffect(() => {
    if (!viewerRef.current) return;

    const viewer = viewerRef.current;

    // Clear old unit entities
    entitiesRef.current.forEach((entity, key) => {
      if (key.startsWith('unit-')) {
        viewer.entities.remove(entity);
        entitiesRef.current.delete(key);
      }
    });

    // Add new unit entities
    units.forEach(unit => {
      if (!unit.locationId) return;

      const territory = territories.find(t => t.id === unit.locationId);
      if (!territory) return;

      const nation = nations.find(n => n.id === unit.ownerId);
      const color = nation ? Color.fromCssColorString(nation.color) : Color.WHITE;

      // Offset units slightly from territory center for better visibility
      const offset = Math.random() * 200000 - 100000;

      // Different symbols and models for different unit types
      let symbol = '🎖️';
      let heightOffset = 50000;
      let modelConfig = UNIT_3D_MODELS.armored_corps;

      switch (unit.templateId) {
        case 'armored_corps':
          symbol = '🛡️';
          heightOffset = 0;
          modelConfig = UNIT_3D_MODELS.armored_corps;
          break;
        case 'carrier_fleet':
          symbol = '⚓';
          heightOffset = 0;
          modelConfig = UNIT_3D_MODELS.carrier_fleet;
          break;
        case 'air_wing':
          symbol = '✈️';
          heightOffset = 100000;
          modelConfig = UNIT_3D_MODELS.air_wing;
          break;
      }

      const position = Cartesian3.fromDegrees(
        territory.anchorLon + offset / 100000,
        territory.anchorLat + offset / 100000,
        heightOffset
      );

      const entityConfig: any = {
        name: `unit-${unit.id}`,
        position: position,
        label: {
          text: `${symbol} ${unit.label}`,
          font: '12px monospace',
          fillColor: Color.WHITE,
          outlineColor: Color.BLACK,
          outlineWidth: 2,
          style: 1, // FILL_AND_OUTLINE
          pixelOffset: new Cartesian2(0, -20),
          showBackground: true,
          backgroundColor: color.withAlpha(0.8),
          backgroundPadding: new Cartesian2(6, 3),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        description: `
          <div style="padding: 10px;">
            <h3>${unit.label}</h3>
            <p><strong>Owner:</strong> ${nation?.name || 'Unknown'}</p>
            <p><strong>Location:</strong> ${territory.name}</p>
            <p><strong>Readiness:</strong> ${unit.readiness}%</p>
            <p><strong>Experience:</strong> ${unit.experience}</p>
            <p><strong>Status:</strong> ${unit.status}</p>
          </div>
        `,
      };

      // Use 3D models if enabled and available, otherwise use enhanced point/billboard
      if (enable3DModels) {
        // For now, use billboards with colored icons since actual GLTF models need to be provided
        // In production, you would load actual 3D models: entityConfig.model = { uri: modelConfig.url, ... }
        entityConfig.billboard = {
          image: createColoredCircleDataUri(color),
          scale: 1.5,
          verticalOrigin: 1, // BOTTOM
          heightReference: HeightReference.NONE,
        };
        entityConfig.point = {
          pixelSize: 16,
          color: color,
          outlineColor: Color.WHITE,
          outlineWidth: 3,
        };
      } else {
        // Fallback to point visualization
        entityConfig.point = {
          pixelSize: 12,
          color: color,
          outlineColor: Color.WHITE,
          outlineWidth: 2,
        };
      }

      const entity = viewer.entities.add(entityConfig);
      entitiesRef.current.set(`unit-${unit.id}`, entity);
    });
  }, [units, territories, nations, enable3DModels, enableTerrain]);

  // Render infection heatmaps
  useEffect(() => {
    if (!viewerRef.current || !showInfections) return;

    const viewer = viewerRef.current;

    // Clear old infection overlays
    entitiesRef.current.forEach((entity, key) => {
      if (key.startsWith('infection-')) {
        viewer.entities.remove(entity);
        entitiesRef.current.delete(key);
      }
    });

    // Add infection overlays for territories
    Object.entries(infectionData).forEach(([territoryId, infectionLevel]) => {
      const territory = territories.find(t => t.id === territoryId);
      if (!territory || infectionLevel <= 0) return;

      const entity = viewer.entities.add({
        name: `infection-${territoryId}`,
        position: Cartesian3.fromDegrees(territory.anchorLon, territory.anchorLat, 10000),
        ellipse: {
          semiMinorAxis: 850000,
          semiMajorAxis: 850000,
          material: new ColorMaterialProperty(
            new CallbackProperty(() => {
              // Pulsing red effect
              const time = Date.now() / 1000;
              const pulse = (Math.sin(time * 2) + 1) / 2; // 0 to 1
              const alpha = (infectionLevel / 100) * 0.6 * (0.7 + pulse * 0.3);
              return Color.RED.withAlpha(alpha);
            }, false)
          ),
          height: 10000,
        },
      });

      entitiesRef.current.set(`infection-${territoryId}`, entity);
    });
  }, [showInfections, infectionData, territories]);

  // Weather overlay visualization (Phase 2 feature)
  useEffect(() => {
    if (!viewerRef.current || !enableWeather) return;

    const viewer = viewerRef.current;

    const updateWeather = () => {
      // Clear old weather entities
      entitiesRef.current.forEach((entity, key) => {
        if (key.startsWith('weather-')) {
          viewer.entities.remove(entity);
          entitiesRef.current.delete(key);
        }
      });

      // Generate and render weather patterns
      const patterns = generateWeatherPatterns();
      patterns.forEach((pattern, index) => {
        const color = pattern.type === 'storm'
          ? Color.GRAY.withAlpha(0.7 * pattern.intensity)
          : Color.WHITE.withAlpha(0.3 * pattern.intensity);

        const entity = viewer.entities.add({
          name: `weather-${index}`,
          position: Cartesian3.fromDegrees(pattern.lon, pattern.lat, 50000),
          ellipse: {
            semiMinorAxis: pattern.radius * 1000,
            semiMajorAxis: pattern.radius * 1000,
            material: new ColorMaterialProperty(
              new CallbackProperty(() => {
                const time = Date.now() / 2000;
                const pulse = (Math.sin(time + index) + 1) / 2;
                return color.withAlpha(color.alpha * (0.6 + pulse * 0.4));
              }, false)
            ),
            height: 50000,
          },
        });

        entitiesRef.current.set(`weather-${index}`, entity);
      });
    };

    updateWeather();
    // Update weather every 10 seconds
    const weatherInterval = setInterval(updateWeather, 10000);

    return () => clearInterval(weatherInterval);
  }, [enableWeather]);

  // Satellite orbital visualization (Phase 3 feature)
  useEffect(() => {
    if (!viewerRef.current || !enableSatellites) return;

    const viewer = viewerRef.current;

    // Clear old satellite entities
    entitiesRef.current.forEach((entity, key) => {
      if (key.startsWith('satellite-')) {
        viewer.entities.remove(entity);
        entitiesRef.current.delete(key);
      }
    });

    // Add satellite orbits and entities
    SATELLITE_ORBITS.forEach(satellite => {
      const color = Color.fromCssColorString(satellite.color);

      // Create orbital path
      const pathPositions: Cartesian3[] = [];
      for (let i = 0; i <= 360; i += 5) {
        const angle = CesiumMath.toRadians(i);
        const lat = Math.sin(angle) * satellite.inclination;
        const lon = (angle * 180 / Math.PI) % 360 - 180;
        pathPositions.push(Cartesian3.fromDegrees(lon, lat, satellite.altitude * 1000));
      }

      // Orbital path polyline
      const orbitEntity = viewer.entities.add({
        name: `satellite-orbit-${satellite.id}`,
        polyline: {
          positions: pathPositions,
          width: 1,
          material: color.withAlpha(0.5),
        },
      });
      entitiesRef.current.set(`satellite-orbit-${satellite.id}`, orbitEntity);

      // Animated satellite position
      const satelliteEntity = viewer.entities.add({
        name: `satellite-${satellite.id}`,
        position: new CallbackProperty(() => {
          const now = JulianDate.toDate(viewer.clock.currentTime);
          const timeOffset = now.getTime() / 1000;
          const pos = calculateSatellitePosition(satellite, timeOffset);
          return Cartesian3.fromDegrees(pos.lon, pos.lat, pos.height);
        }, false) as any,
        point: {
          pixelSize: 8,
          color: color,
          outlineColor: Color.WHITE,
          outlineWidth: 2,
        },
        label: {
          text: satellite.name,
          font: '10px monospace',
          fillColor: Color.WHITE,
          outlineColor: Color.BLACK,
          outlineWidth: 1,
          style: 1,
          pixelOffset: new Cartesian2(0, -15),
          showBackground: true,
          backgroundColor: color.withAlpha(0.7),
          backgroundPadding: new Cartesian2(4, 2),
        },
        description: `
          <div style="padding: 10px;">
            <h3>${satellite.name}</h3>
            <p><strong>Altitude:</strong> ${satellite.altitude} km</p>
            <p><strong>Inclination:</strong> ${satellite.inclination}°</p>
            <p><strong>Period:</strong> ${satellite.period} min</p>
          </div>
        `,
      });

      entitiesRef.current.set(`satellite-${satellite.id}`, satelliteEntity);
    });
  }, [enableSatellites]);

  // Expose methods via ref (Phase 2 & 3 enhanced API)
  useImperativeHandle(ref, () => ({
    flyTo: (lon: number, lat: number, height = 5000000) => {
      if (!viewerRef.current) return;
      viewerRef.current.camera.flyTo({
        destination: Cartesian3.fromDegrees(lon, lat, height),
        duration: 2,
      });
    },

    addMissileTrajectory: (from, to, animated = true) => {
      if (!viewerRef.current) return;

      const viewer = viewerRef.current;
      const positions = calculateBallisticArc(from, to, 100);

      if (animated) {
        // Phase 3: Animated missile with moving projectile
        const startTime = JulianDate.now();
        const stopTime = JulianDate.addSeconds(startTime, 5, new JulianDate());

        const positionProperty = new SampledPositionProperty();
        positions.forEach((pos, index) => {
          const time = JulianDate.addSeconds(startTime, (index / positions.length) * 5, new JulianDate());
          positionProperty.addSample(time, pos);
        });

        const missile = viewer.entities.add({
          name: `missile-${Date.now()}`,
          availability: new TimeIntervalCollection([
            new TimeInterval({ start: startTime, stop: stopTime })
          ]),
          position: positionProperty,
          orientation: new VelocityOrientationProperty(positionProperty),
          point: {
            pixelSize: 8,
            color: Color.YELLOW,
            outlineColor: Color.RED,
            outlineWidth: 2,
          },
          path: {
            resolution: 1,
            material: new PolylineGlowMaterialProperty({
              glowPower: 0.3,
              color: Color.YELLOW,
            }),
            width: 3,
            leadTime: 0,
            trailTime: 2,
          },
        });

        // Remove after animation completes
        setTimeout(() => {
          viewer.entities.remove(missile);
        }, 6000);
      } else {
        // Static trajectory line
        const missile = viewer.entities.add({
          name: `missile-${Date.now()}`,
          polyline: {
            positions: positions,
            width: 3,
            material: new PolylineGlowMaterialProperty({
              glowPower: 0.3,
              color: Color.YELLOW,
            }),
          },
        });

        setTimeout(() => {
          viewer.entities.remove(missile);
        }, 5000);
      }
    },

    addExplosion: (lon, lat, radiusKm = 50, useParticles = enableParticleEffects) => {
      if (!viewerRef.current) return;

      const viewer = viewerRef.current;
      const position = Cartesian3.fromDegrees(lon, lat, 0);

      // Play nuclear explosion sound effect
      import('@/utils/audioManager').then(({ audioManager }) => {
        // Play main explosion sound
        audioManager.play('nuclear-explosion', 0.7);
        
        // Play shockwave sound with slight delay
        setTimeout(() => {
          audioManager.play('explosion-shockwave', 0.5);
        }, 300);
      }).catch(err => console.warn('Failed to load audio manager:', err));

      if (useParticles) {
        // Phase 2: Advanced particle effect explosion
        const particles: Entity[] = [];
        const particleCount = 30;

        for (let i = 0; i < particleCount; i++) {
          const angle = (i / particleCount) * Math.PI * 2;
          const distance = radiusKm * 1000 * (0.5 + Math.random() * 0.5);

          const endPosition = Cartesian3.fromDegrees(
            lon + (Math.cos(angle) * distance) / 111000,
            lat + (Math.sin(angle) * distance) / 111000,
            Math.random() * 50000
          );

          const startTime = JulianDate.now();
          const positionProperty = new SampledPositionProperty();
          positionProperty.addSample(startTime, position);
          positionProperty.addSample(
            JulianDate.addSeconds(startTime, 1 + Math.random(), new JulianDate()),
            endPosition
          );

          const particle = viewer.entities.add({
            name: `explosion-particle-${Date.now()}-${i}`,
            position: positionProperty,
            point: {
              pixelSize: 4 + Math.random() * 6,
              color: new CallbackProperty(() => {
                const elapsed = JulianDate.secondsDifference(JulianDate.now(), startTime);
                const alpha = Math.max(0, 1 - elapsed / 1.5);
                const colors = [Color.YELLOW, Color.ORANGE, Color.RED];
                const colorIndex = Math.floor(Math.random() * colors.length);
                return colors[colorIndex].withAlpha(alpha);
              }, false),
            },
          });

          particles.push(particle);
        }

        // Central blast
        const blast = viewer.entities.add({
          name: `explosion-blast-${Date.now()}`,
          position: position,
          ellipse: {
            semiMinorAxis: new CallbackProperty(() => {
              const t = (Date.now() % 2000) / 2000;
              return radiusKm * 1000 * (1 + t * 2);
            }, false),
            semiMajorAxis: new CallbackProperty(() => {
              const t = (Date.now() % 2000) / 2000;
              return radiusKm * 1000 * (1 + t * 2);
            }, false),
            material: new CallbackProperty(() => {
              const t = (Date.now() % 2000) / 2000;
              return Color.ORANGE.withAlpha(0.8 * (1 - t));
            }, false) as any,
            height: 0,
          },
          point: {
            pixelSize: 30,
            color: Color.WHITE,
          },
        });

        // Cleanup after 2 seconds
        setTimeout(() => {
          particles.forEach(p => viewer.entities.remove(p));
          viewer.entities.remove(blast);
        }, 2000);
      } else {
        // Simple explosion
        const explosion = viewer.entities.add({
          name: `explosion-${Date.now()}`,
          position: position,
          ellipse: {
            semiMinorAxis: radiusKm * 1000,
            semiMajorAxis: radiusKm * 1000,
            material: Color.ORANGE.withAlpha(0.7),
            height: 0,
          },
          point: {
            pixelSize: 20,
            color: Color.RED,
            outlineColor: Color.WHITE,
            outlineWidth: 2,
          },
        });

        setTimeout(() => {
          viewer.entities.remove(explosion);
        }, 3000);
      }
    },

    highlightTerritory: (territoryId: string) => {
      const entity = entitiesRef.current.get(`territory-${territoryId}`);
      if (entity && viewerRef.current) {
        viewerRef.current.selectedEntity = entity;
      }
    },

    moveUnit: (unitId: string, fromLon: number, fromLat: number, toLon: number, toLat: number, durationSeconds = 5) => {
      if (!viewerRef.current) return;

      const viewer = viewerRef.current;
      const entity = entitiesRef.current.get(`unit-${unitId}`);
      if (!entity) return;

      const startTime = JulianDate.now();
      const stopTime = JulianDate.addSeconds(startTime, durationSeconds, new JulianDate());

      const positionProperty = new SampledPositionProperty();
      positionProperty.addSample(startTime, Cartesian3.fromDegrees(fromLon, fromLat, 0));
      positionProperty.addSample(stopTime, Cartesian3.fromDegrees(toLon, toLat, 0));

      entity.position = positionProperty;

      // Add movement trail
      const trail = viewer.entities.add({
        name: `unit-trail-${Date.now()}`,
        polyline: {
          positions: new CallbackProperty(() => {
            const now = viewer.clock.currentTime;
            const pos = entity.position?.getValue(now);
            if (!pos) return [];
            return [
              Cartesian3.fromDegrees(fromLon, fromLat, 0),
              pos,
            ];
          }, false),
          width: 2,
          material: Color.CYAN.withAlpha(0.5),
        },
      });

      setTimeout(() => {
        viewer.entities.remove(trail);
      }, (durationSeconds + 1) * 1000);
    },

    focusSatellite: (satelliteId: string) => {
      if (!viewerRef.current) return;

      const entity = entitiesRef.current.get(`satellite-${satelliteId}`);
      if (entity && viewerRef.current) {
        viewerRef.current.trackedEntity = entity;
        // Zoom to satellite orbital view
        setTimeout(() => {
          if (viewerRef.current) {
            viewerRef.current.trackedEntity = undefined;
          }
        }, 10000);
      }
    },

    addWeatherEvent: (lon: number, lat: number, type: 'storm' | 'clouds', intensity: number) => {
      if (!viewerRef.current) return;

      const viewer = viewerRef.current;
      const color = type === 'storm'
        ? Color.GRAY.withAlpha(0.7 * intensity)
        : Color.WHITE.withAlpha(0.4 * intensity);

      const weather = viewer.entities.add({
        name: `weather-event-${Date.now()}`,
        position: Cartesian3.fromDegrees(lon, lat, 50000),
        ellipse: {
          semiMinorAxis: 400000,
          semiMajorAxis: 400000,
          material: new ColorMaterialProperty(
            new CallbackProperty(() => {
              const time = Date.now() / 2000;
              const pulse = (Math.sin(time) + 1) / 2;
              return color.withAlpha(color.alpha * (0.6 + pulse * 0.4));
            }, false)
          ),
          height: 50000,
        },
      });

      // Remove after 30 seconds
      setTimeout(() => {
        viewer.entities.remove(weather);
      }, 30000);
    },
  }));

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    />
  );
});

CesiumViewer.displayName = 'CesiumViewer';

export default CesiumViewer;

// Helper function to calculate ballistic arc
function calculateBallisticArc(
  from: { lon: number; lat: number },
  to: { lon: number; lat: number },
  segments: number
): Cartesian3[] {
  const start = Cartesian3.fromDegrees(from.lon, from.lat, 0);
  const end = Cartesian3.fromDegrees(to.lon, to.lat, 0);
  const distance = Cartesian3.distance(start, end);
  const peakHeight = distance * 0.3; // 30% of distance for realistic arc

  const positions: Cartesian3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const height = Math.sin(t * Math.PI) * peakHeight;

    const interpolated = Cartesian3.lerp(start, end, t, new Cartesian3());
    const cartographic = Cartographic.fromCartesian(interpolated);

    positions.push(
      Cartesian3.fromRadians(
        cartographic.longitude,
        cartographic.latitude,
        height
      )
    );
  }
  return positions;
}

// Helper function to create colored circle data URI for billboards
function createColoredCircleDataUri(color: Color): string {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');

  if (!ctx) return '';

  // Draw circle with color
  ctx.beginPath();
  ctx.arc(16, 16, 14, 0, Math.PI * 2);
  ctx.fillStyle = color.toCssColorString();
  ctx.fill();

  // Add white border
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.stroke();

  return canvas.toDataURL();
}
