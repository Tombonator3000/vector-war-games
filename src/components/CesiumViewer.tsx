import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  Viewer,
  Ion,
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
} from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import type { TerritoryState, ConventionalUnitState } from '@/hooks/useConventionalWarfare';
import type { Nation } from '@/types/game';

// Disable Cesium Ion (use free base imagery instead)
Ion.defaultAccessToken = '';

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
}

export interface CesiumViewerHandle {
  flyTo: (lon: number, lat: number, height?: number) => void;
  addMissileTrajectory: (from: { lon: number; lat: number }, to: { lon: number; lat: number }) => void;
  addExplosion: (lon: number, lat: number, radiusKm?: number) => void;
  highlightTerritory: (territoryId: string) => void;
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
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const entitiesRef = useRef<Map<string, Entity>>(new Map());
  const handlerRef = useRef<ScreenSpaceEventHandler | null>(null);
  const territoryClickRef = useRef<CesiumViewerProps['onTerritoryClick']>(onTerritoryClick);
  const unitClickRef = useRef<CesiumViewerProps['onUnitClick']>(onUnitClick);

  useEffect(() => {
    territoryClickRef.current = onTerritoryClick;
  }, [onTerritoryClick]);

  useEffect(() => {
    unitClickRef.current = onUnitClick;
  }, [onUnitClick]);

  // Initialize Cesium Viewer
  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    const initViewer = async () => {
      try {
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
          imageryProvider: false, // We'll use natural earth color
        });

        viewerRef.current = viewer;

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
        }

        // Configure globe appearance
        viewer.scene.globe.baseColor = Color.fromCssColorString('#0a1628');
        viewer.scene.backgroundColor = Color.BLACK;
        viewer.scene.skyBox.show = true;

        // Enable depth testing for proper 3D rendering
        viewer.scene.globe.depthTestAgainstTerrain = false;

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

      } catch (error) {
        console.error('Failed to initialize Cesium viewer:', error);
      }
    };

    initViewer();

    return () => {
      if (handlerRef.current) {
        handlerRef.current.destroy();
      }
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!viewerRef.current) return;

    viewerRef.current.scene.globe.enableLighting = enableDayNight;
    if (enableDayNight) {
      viewerRef.current.clock.currentTime = JulianDate.now();
    }
  }, [enableDayNight]);

  // Render territories
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

    // Add new territory entities
    territories.forEach(territory => {
      const nation = nations.find(n => n.id === territory.controllingNationId);
      const color = nation ? Color.fromCssColorString(nation.color) : Color.GRAY;

      // Create a circular region for each territory (simplified)
      // In production, you'd load actual GeoJSON boundaries
      const entity = viewer.entities.add({
        name: `territory-${territory.id}`,
        position: Cartesian3.fromDegrees(territory.anchorLon, territory.anchorLat, 0),
        ellipse: {
          semiMinorAxis: 800000, // ~800km radius
          semiMajorAxis: 800000,
          material: color.withAlpha(0.4),
          outline: true,
          outlineColor: Color.WHITE.withAlpha(0.8),
          outlineWidth: 2,
          height: 0,
        },
        label: {
          text: territory.name,
          font: '14px monospace',
          fillColor: Color.WHITE,
          outlineColor: Color.BLACK,
          outlineWidth: 2,
          style: 1, // FILL_AND_OUTLINE
          pixelOffset: new Cartesian3(0, -50, 0),
          showBackground: true,
          backgroundColor: Color.BLACK.withAlpha(0.7),
          backgroundPadding: new Cartesian3(8, 4, 0),
        },
        description: `
          <div style="padding: 10px;">
            <h3>${territory.name}</h3>
            <p><strong>Owner:</strong> ${nation?.name || 'Uncontrolled'}</p>
            <p><strong>Strategic Value:</strong> ${territory.strategicValue}</p>
            <p><strong>Production Bonus:</strong> +${territory.productionBonus}</p>
            <p><strong>Conflict Risk:</strong> ${territory.conflictRisk}%</p>
          </div>
        `,
      });

      entitiesRef.current.set(`territory-${territory.id}`, entity);
    });
  }, [territories, nations]);

  // Render military units
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

      // Offset units slightly from territory center
      const offset = Math.random() * 200000 - 100000;

      // Different symbols for different unit types
      let symbol = '🎖️';
      let heightOffset = 50000;

      switch (unit.templateId) {
        case 'armored_corps':
          symbol = '🛡️';
          heightOffset = 0;
          break;
        case 'carrier_fleet':
          symbol = '⚓';
          heightOffset = 0;
          break;
        case 'air_wing':
          symbol = '✈️';
          heightOffset = 100000;
          break;
      }

      const entity = viewer.entities.add({
        name: `unit-${unit.id}`,
        position: Cartesian3.fromDegrees(
          territory.anchorLon + offset / 100000,
          territory.anchorLat + offset / 100000,
          heightOffset
        ),
        point: {
          pixelSize: 12,
          color: color,
          outlineColor: Color.WHITE,
          outlineWidth: 2,
        },
        label: {
          text: `${symbol} ${unit.label}`,
          font: '12px monospace',
          fillColor: Color.WHITE,
          outlineColor: Color.BLACK,
          outlineWidth: 2,
          style: 1, // FILL_AND_OUTLINE
          pixelOffset: new Cartesian3(0, -20, 0),
          showBackground: true,
          backgroundColor: color.withAlpha(0.8),
          backgroundPadding: new Cartesian3(6, 3, 0),
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
      });

      entitiesRef.current.set(`unit-${unit.id}`, entity);
    });
  }, [units, territories, nations]);

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

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    flyTo: (lon: number, lat: number, height = 5000000) => {
      if (!viewerRef.current) return;
      viewerRef.current.camera.flyTo({
        destination: Cartesian3.fromDegrees(lon, lat, height),
        duration: 2,
      });
    },

    addMissileTrajectory: (from, to) => {
      if (!viewerRef.current) return;

      const viewer = viewerRef.current;
      const positions = calculateBallisticArc(from, to, 50);

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

      // Remove after 5 seconds
      setTimeout(() => {
        viewer.entities.remove(missile);
      }, 5000);
    },

    addExplosion: (lon, lat, radiusKm = 50) => {
      if (!viewerRef.current) return;

      const viewer = viewerRef.current;
      const explosion = viewer.entities.add({
        name: `explosion-${Date.now()}`,
        position: Cartesian3.fromDegrees(lon, lat, 0),
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

      // Fade out and remove
      setTimeout(() => {
        viewer.entities.remove(explosion);
      }, 3000);
    },

    highlightTerritory: (territoryId: string) => {
      const entity = entitiesRef.current.get(`territory-${territoryId}`);
      if (entity && viewerRef.current) {
        viewerRef.current.selectedEntity = entity;
      }
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
