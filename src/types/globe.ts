import type { MutableRefObject } from 'react';
import type * as THREE from 'three';
import type { FeatureCollection, Polygon, MultiPolygon } from 'geojson';
import type { FalloutMark, RadiationZone } from '@/types/game';
import type { PandemicStage } from '@/hooks/usePandemic';
import type { TerritoryPolygon } from '@/lib/territoryPolygons';
import type { TerritoryState } from '@/hooks/useConventionalWarfare';
import type { Unit } from '@/lib/unitModels';
import type { MissileTrajectoryInstance } from '@/lib/missileTrajectories';
import type { MorphingGlobeHandle } from '@/components/MorphingGlobe';
import type { CloudRegion } from '@/hooks/useWeatherRadar';

export type ProjectorFn = (lon: number, lat: number) => { x: number; y: number; visible: boolean };
export type PickerFn = (x: number, y: number) => { lon: number; lat: number } | null;

/**
 * @deprecated MapVisualStyle is deprecated. The system now uses a unified MorphingGlobe.
 * Keep for backwards compatibility but internally only 'morphing' is used.
 */
export type MapVisualStyle = 'realistic' | 'wireframe' | 'flat-realistic' | 'morphing';



/**
 * Unified map style - no longer uses multiple visual styles.
 * Globe/flat is controlled by morph factor, vector overlay is a separate toggle.
 */


export type MapMode =
  | 'standard'
  | 'diplomatic'
  | 'intel'
  | 'resources'
  | 'unrest'
  | 'pandemic'
  | 'radiation'
  | 'migration';



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
  /** Toggle vector overlay (country borders) visibility */
  setVectorOverlay: (visible: boolean) => void;
  /** Get vector overlay visibility */
  getVectorOverlay: () => boolean;
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
  /** @deprecated Use morphing globe with toggle instead */
  mapStyle?: MapStyle;
  modeData?: MapModeOverlayData;
  flatMapVariant?: boolean | string | null;
  /** Blend factor between day (0) and night (1) textures for smooth transitions */
  dayNightBlend?: number;
  /** Show vector overlay (country borders) on the map */
  showVectorOverlay?: boolean;
  /** Vector overlay color (default: cyan) */
  vectorColor?: string;
  /** Vector overlay opacity (0-1, default: 0.7) */
  vectorOpacity?: number;
  /** Vector-only mode: hide earth texture and show only vector borders (for WARGAMES theme) */
  vectorOnlyMode?: boolean;
  /** Weather cloud regions to display */
  weatherClouds?: CloudRegion[];
  /** Whether to show weather clouds */
  showWeatherClouds?: boolean;
  /** Weather cloud opacity (0-1) */
  weatherCloudOpacity?: number;
  /** Whether to show cloud shadows */
  showCloudShadows?: boolean;
}

export interface SceneRegistration {
  camera: THREE.PerspectiveCamera;
  size: { width: number; height: number };
  earth: THREE.Mesh | null;
  clock: THREE.Clock;
  projectPosition?: (lon: number, lat: number, radius: number) => THREE.Vector3;
}


export interface SceneContentProps extends GlobeSceneProps {
  register: (registration: SceneRegistration) => void;
  missilesRef: MutableRefObject<Map<string, MissileTrajectoryInstance>>;
  explosionsRef: MutableRefObject<Map<string, { group: THREE.Group; startTime: number }>>;
  onCameraPoseUpdate?: (camera: THREE.PerspectiveCamera) => void;
  onMorphingGlobeReady?: (handle: MorphingGlobeHandle | null) => void;
  onMorphProgress?: (factor: number) => void;
}
