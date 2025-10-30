import { useEffect, useRef, useState, useCallback, useMemo, ReactNode, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { feature } from 'topojson-client';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Factory, Microscope, Satellite, Radio, Users, Handshake, Zap, ArrowRight, Shield, FlaskConical, X } from 'lucide-react';
import { NewsTicker, NewsItem } from '@/components/NewsTicker';
import { PandemicPanel } from '@/components/PandemicPanel';
import { BioWarfareLab } from '@/components/BioWarfareLab';
import { BioLabConstruction } from '@/components/BioLabConstruction';
import { useFlashpoints } from '@/hooks/useFlashpoints';
import {
  usePandemic,
  type PandemicTriggerPayload,
  type PandemicCountermeasurePayload,
  type PandemicTurnContext
} from '@/hooks/usePandemic';
import { useBioWarfare } from '@/hooks/useBioWarfare';
import { initializeAllAINations, processAllAINationsBioWarfare } from '@/lib/aiBioWarfareIntegration';
import { FlashpointModal } from '@/components/FlashpointModal';
import GlobeScene, { PickerFn, ProjectorFn, type MapStyle } from '@/components/GlobeScene';
import { useFogOfWar } from '@/hooks/useFogOfWar';
import {
  useGovernance,
  type GovernanceNationRef,
  type GovernanceMetrics,
  type GovernanceDelta,
  calculateMoraleProductionMultiplier,
  calculateMoraleRecruitmentModifier,
} from '@/hooks/useGovernance';
import { TutorialGuide } from '@/components/TutorialGuide';
import { TutorialOverlay } from '@/components/TutorialOverlay';
import { useTutorial } from '@/hooks/useTutorial';
import { GameHelper } from '@/components/GameHelper';
import { useMultiplayer } from '@/contexts/MultiplayerProvider';
import { useTutorialContext } from '@/contexts/TutorialContext';
import { PhaseTransitionOverlay } from '@/components/PhaseTransitionOverlay';
import { VictoryProgressPanel } from '@/components/VictoryProgressPanel';
import type { Nation, ConventionalWarfareDelta, NationCyberProfile, SatelliteOrbit } from '@/types/game';
import { CoopStatusPanel } from '@/components/coop/CoopStatusPanel';
import { SyncStatusBadge } from '@/components/coop/SyncStatusBadge';
import { ApprovalQueue } from '@/components/coop/ApprovalQueue';
import { ConflictResolutionDialog } from '@/components/coop/ConflictResolutionDialog';
import {
  useConventionalWarfare,
  type ConventionalState,
  type NationConventionalProfile,
  type ForceType,
  createDefaultConventionalState,
  createDefaultNationConventionalProfile,
  territoryAnchors,
} from '@/hooks/useConventionalWarfare';
import { ConventionalForcesPanel } from '@/components/ConventionalForcesPanel';
import { TerritoryMapPanel } from '@/components/TerritoryMapPanel';
import {
  useCyberWarfare,
  createDefaultNationCyberProfile,
  applyCyberResearchUnlock,
} from '@/hooks/useCyberWarfare';
import { GovernanceEventDialog } from '@/components/governance/GovernanceEventDialog';
import { MoraleHeatmapOverlay } from '@/components/governance/MoraleHeatmapOverlay';
import { ElectionCountdownWidget } from '@/components/governance/ElectionCountdownWidget';
import { calculateBomberInterceptChance, getMirvSplitChance } from '@/lib/research';

// Storage wrapper for localStorage
const Storage = {
  getItem: (key: string) => {
    try {
      return localStorage.getItem(`norad_${key}`);
    } catch (e) {
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(`norad_${key}`, value);
    } catch (e) {
      console.warn('Storage failed:', e);
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(`norad_${key}`);
    } catch (e) {
      console.warn('Storage removal failed:', e);
    }
  }
};

// Game State Types - extending imported types with local properties
type LocalNation = Nation & {
  conventional?: NationConventionalProfile;
  controlledTerritories?: string[];
};

type LocalGameState = GameState & {
  conventional?: ConventionalState;
};

interface DiplomacyState {
  peaceTurns: number;
  lastEvaluatedTurn: number;
  allianceRatio: number;
  influenceScore: number;
  nearVictoryNotified: boolean;
  victoryAnnounced: boolean;
}

interface GameState {
  turn: number;
  defcon: number;
  phase: 'PLAYER' | 'AI' | 'RESOLUTION' | 'PRODUCTION';
  actionsRemaining: number;
  paused: boolean;
  gameOver: boolean;
  selectedLeader: string | null;
  selectedDoctrine: string | null;
  playerName?: string;
  difficulty?: string;
  missiles: any[];
  bombers: any[];
  submarines?: any[];
  explosions: any[];
  particles: any[];
  radiationZones: any[];
  empEffects: any[];
  rings: any[];
  refugeeCamps?: any[];
  screenShake: number;
  overlay?: { text: string; ttl: number } | null;
  fx?: number;
  nuclearWinterLevel?: number;
  globalRadiation?: number;
  events?: boolean;
  diplomacy?: DiplomacyState;
  conventional?: ConventionalState;
  conventionalMovements?: ConventionalMovementMarker[];
  conventionalUnits?: ConventionalUnitMarker[];
  satelliteOrbits: SatelliteOrbit[];
}

type ThemeId =
  | 'synthwave'
  | 'retro80s'
  | 'wargames'
  | 'nightmode'
  | 'highcontrast'
  | 'vectorclassic';
type LayoutDensity = 'expanded' | 'compact' | 'minimal';

type LayoutDensityOption = {
  id: LayoutDensity;
  label: string;
  description: string;
};

type DeliveryMethod = 'missile' | 'bomber' | 'submarine';

interface PendingLaunchState {
  target: Nation;
  warheads: { yield: number; count: number; requiredDefcon: 1 | 2 }[];
  deliveryOptions: { id: DeliveryMethod; label: string; count: number }[];
}

const MAP_STYLE_OPTIONS: { value: MapStyle; label: string; description: string }[] = [
  { value: 'realistic', label: 'Realistic', description: 'Satellite imagery with terrain overlays.' },
  { value: 'wireframe', label: 'Wireframe', description: 'Vector borders and topography outlines.' },
  { value: 'night', label: 'Night Lights', description: 'City illumination against a dark globe.' },
  { value: 'political', label: 'Political', description: 'Colored territorial boundaries and claims.' },
  { value: 'flat', label: 'Flat', description: 'Orthographic projection with a 2D world canvas.' },
  {
    value: 'flat-realistic',
    label: 'Flat Realistic',
    description: 'High-resolution satellite texture rendered on the flat map.',
  },
];

type CanvasIcon = HTMLImageElement | null;

type ConventionalUnitMarker = {
  unitId: string;
  ownerId: string;
  lon: number;
  lat: number;
  icon: CanvasIcon;
  forceType: ForceType;
};

type ConventionalMovementMarker = {
  id: string;
  unitId: string;
  ownerId: string;
  forceType: ForceType;
  icon: CanvasIcon;
  startLon: number;
  startLat: number;
  endLon: number;
  endLat: number;
  fromTerritoryId: string | null;
  toTerritoryId: string | null;
  progress: number;
  speed: number;
  createdAt: number;
};

type ConventionalMovementRegistration = {
  unitId: string;
  templateId?: string;
  ownerId: string;
  fromTerritoryId?: string | null;
  toTerritoryId?: string | null;
  fallbackEnd?: { lon: number; lat: number } | null;
};

const CONVENTIONAL_ICON_BASE_SCALE: Record<ForceType, number> = {
  army: 0.22,
  navy: 0.24,
  air: 0.2,
};

const loadIcon = (src: string): CanvasIcon => {
  if (typeof Image === 'undefined') {
    return null;
  }
  const image = new Image();
  image.src = src;
  return image;
};

const missileIcon = loadIcon('/icons/missile.svg');
const bomberIcon = loadIcon('/icons/bomber.svg');
const submarineIcon = loadIcon('/icons/submarine.svg');
const armyIcon = loadIcon('/icons/army.svg');
const navyIcon = loadIcon('/icons/navy.svg');
const airIcon = loadIcon('/icons/air.svg');

const conventionalIconLookup: Record<ForceType, CanvasIcon> = {
  army: armyIcon,
  navy: navyIcon,
  air: airIcon,
};

const MISSILE_ICON_BASE_SCALE = 0.14;
const BOMBER_ICON_BASE_SCALE = 0.18;
const SUBMARINE_ICON_BASE_SCALE = 0.2;
const easeInOutQuad = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const SATELLITE_ORBIT_RADIUS = 34;
const SATELLITE_ORBIT_TTL_MS = 180000;
const SATELLITE_ORBIT_SPEED = (Math.PI * 2) / 12000;

const IntroLogo = () => (
  <svg
    className="intro-screen__logo"
    viewBox="0 0 1200 420"
    role="img"
    aria-labelledby="intro-logo-title intro-logo-desc"
  >
    <title id="intro-logo-title">Vector War Games</title>
    <desc id="intro-logo-desc">
      Neon synthwave wordmark for the Vector War Games simulation.
    </desc>
    <defs>
      <linearGradient id="logo-fill" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#39ff14" />
        <stop offset="35%" stopColor="#00d9ff" />
        <stop offset="70%" stopColor="#ff00ff" />
        <stop offset="100%" stopColor="#39ff14" />
      </linearGradient>
      <linearGradient id="logo-stroke" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="rgba(0, 217, 255, 0.8)" />
        <stop offset="100%" stopColor="rgba(255, 0, 255, 0.8)" />
      </linearGradient>
      <filter id="logo-glow" x="-20%" y="-40%" width="140%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="18" result="blur" />
        <feColorMatrix
          in="blur"
          type="matrix"
          values="0 0 0 0 0  0 0 0 0.75 0  0 0 0 0.9 0  0 0 0 0.35 0"
          result="coloredBlur"
        />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <g filter="url(#logo-glow)" fontFamily="'Share Tech Mono', 'Orbitron', 'Rajdhani', sans-serif" fontWeight="600">
      <text
        x="50%"
        y="35%"
        textAnchor="middle"
        fontSize={128}
        letterSpacing="0.45em"
        fill="url(#logo-fill)"
        stroke="url(#logo-stroke)"
        strokeWidth={6}
        paintOrder="stroke fill"
      >
        VECTOR
      </text>
      <text
        x="50%"
        y="62%"
        textAnchor="middle"
        fontSize={144}
        letterSpacing="0.75em"
        fill="url(#logo-fill)"
        stroke="url(#logo-stroke)"
        strokeWidth={7}
        paintOrder="stroke fill"
      >
        WAR
      </text>
      <text
        x="50%"
        y="88%"
        textAnchor="middle"
        fontSize={128}
        letterSpacing="0.55em"
        fill="url(#logo-fill)"
        stroke="url(#logo-stroke)"
        strokeWidth={6}
        paintOrder="stroke fill"
      >
        GAMES
      </text>
    </g>
  </svg>
);

const DIPLOMATIC_VICTORY_CRITERIA = {
  allianceRatio: 0.6,
  requiredDefcon: 4,
  peaceTurns: 4,
  influenceTarget: 120,
  nearProgressThreshold: 0.8,
  resetNearThreshold: 0.55
};

const layoutDensityOptions: LayoutDensityOption[] = [
  {
    id: 'expanded',
    label: 'Expanded',
    description: 'Full briefing overlay with maximum telemetry panels.',
  },
  {
    id: 'compact',
    label: 'Compact',
    description: 'Slimmed panels that free up more of the strategic map.',
  },
  {
    id: 'minimal',
    label: 'Minimal',
    description: 'Ultralight HUD that keeps essentials while spotlighting the globe.',
  },
];

const layoutDensityOrder: LayoutDensity[] = layoutDensityOptions.map((option) => option.id);

const THEME_SETTINGS: Record<ThemeId, {
  mapOutline: string;
  grid: string;
  radar: string;
  ocean: string;
  cloud: string;
}> = {
  synthwave: {
    mapOutline: 'rgba(143,225,255,0.8)',
    grid: 'rgba(143,225,255,0.25)',
    radar: 'rgba(143,225,255,0.08)',
    ocean: 'rgba(40,100,220,0.6)',
    cloud: 'rgba(255,200,255,0.6)'
  },
  retro80s: {
    mapOutline: 'rgba(0,255,65,0.5)',
    grid: 'rgba(0,255,65,0.2)',
    radar: 'rgba(0,255,65,0.08)',
    ocean: 'rgba(30,70,160,0.65)',
    cloud: 'rgba(255,105,180,0.6)'
  },
  wargames: {
    mapOutline: 'rgba(0,255,0,0.4)',
    grid: 'rgba(0,255,0,0.1)',
    radar: 'rgba(0,255,0,0.05)',
    ocean: 'rgba(0,80,160,0.6)',
    cloud: 'rgba(150,150,150,0.6)'
  },
  nightmode: {
    mapOutline: 'rgba(102,204,255,0.5)',
    grid: 'rgba(102,204,255,0.18)',
    radar: 'rgba(102,204,255,0.07)',
    ocean: 'rgba(15,60,130,0.65)',
    cloud: 'rgba(160,200,240,0.45)'
  },
  highcontrast: {
    mapOutline: 'rgba(255,255,255,0.7)',
    grid: 'rgba(255,255,255,0.25)',
    radar: 'rgba(255,255,255,0.1)',
    ocean: 'rgba(20,80,160,0.7)',
    cloud: 'rgba(255,220,0,0.45)'
  },
  vectorclassic: {
    mapOutline: 'rgba(143,225,255,0.85)',
    grid: 'rgba(143,225,255,0.28)',
    radar: 'rgba(143,225,255,0.1)',
    ocean: 'rgba(10,45,110,0.7)',
    cloud: 'rgba(255,180,220,0.45)'
  }
};

const themeOptions: { id: ThemeId; label: string }[] = [
  { id: 'synthwave', label: 'Synthwave' },
  { id: 'retro80s', label: 'Retro 80s' },
  { id: 'wargames', label: 'WARGAMES' },
  { id: 'nightmode', label: 'Night Mode' },
  { id: 'highcontrast', label: 'High Contrast' },
  { id: 'vectorclassic', label: 'Vector (Classic)' }
];

let currentTheme: ThemeId = 'synthwave';
let currentMapStyle: MapStyle = 'flat-realistic';
let selectedTargetRefId: string | null = null;
let uiUpdateCallback: (() => void) | null = null;
let gameLoopRunning = false; // Prevent multiple game loops

// Global game state
let S: LocalGameState = {
  turn: 1,
  defcon: 5,
  phase: 'PLAYER',
  actionsRemaining: 1,
  paused: false,
  gameOver: false,
  selectedLeader: null,
  selectedDoctrine: null,
  missiles: [],
  bombers: [],
  submarines: [],
  explosions: [],
  particles: [],
  radiationZones: [],
  empEffects: [],
  rings: [],
  refugeeCamps: [],
  satelliteOrbits: [],
  screenShake: 0,
  fx: 1,
  nuclearWinterLevel: 0,
  globalRadiation: 0,
  diplomacy: createDefaultDiplomacyState(),
  conventional: createDefaultConventionalState(),
  conventionalMovements: [],
  conventionalUnits: [],
};

let nations: LocalNation[] = [];
let conventionalDeltas: ConventionalWarfareDelta[] = [];
let suppressMultiplayerBroadcast = false;
let multiplayerPublisher: (() => void) | null = null;

const setMultiplayerPublisher = (publisher: (() => void) | null) => {
  multiplayerPublisher = publisher;
};

const broadcastMultiplayerState = () => {
  if (!suppressMultiplayerBroadcast && multiplayerPublisher) {
    multiplayerPublisher();
  }
};

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let startCanvas: HTMLCanvasElement;
let startCtx: CanvasRenderingContext2D;
let W = 1600, H = 900;
let globeProjector: ProjectorFn | null = null;
let globePicker: PickerFn | null = null;

// Camera system
const cam = { x: 0, y: 0, zoom: 1, targetZoom: 1 };

// World data
let worldData: any = null;
let worldCountries: any = null;

const resolvePublicAssetPath = (assetPath: string) => {
  const base = import.meta.env.BASE_URL ?? '/';
  const trimmedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const trimmedAsset = assetPath.startsWith('/') ? assetPath.slice(1) : assetPath;

  if (!trimmedBase) {
    return `/${trimmedAsset}`;
  }

  return `${trimmedBase}/${trimmedAsset}`;
};

const FLAT_REALISTIC_TEXTURE_URL = resolvePublicAssetPath('textures/earth_day.jpg');
let flatRealisticTexture: HTMLImageElement | null = null;
let flatRealisticTexturePromise: Promise<HTMLImageElement> | null = null;

function preloadFlatRealisticTexture() {
  if (flatRealisticTexture) {
    return Promise.resolve(flatRealisticTexture);
  }

  if (flatRealisticTexturePromise) {
    return flatRealisticTexturePromise;
  }

  if (typeof window === 'undefined' || typeof Image === 'undefined') {
    return Promise.resolve(null);
  }

  flatRealisticTexturePromise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      flatRealisticTexture = image;
      resolve(image);
    };
    image.onerror = (event) => {
      flatRealisticTexturePromise = null;
      reject(
        event instanceof ErrorEvent
          ? event.error ?? new Error('Failed to load flat map texture')
          : new Error('Failed to load flat map texture'),
      );
    };
    image.src = FLAT_REALISTIC_TEXTURE_URL;
  });

  return flatRealisticTexturePromise.catch(error => {
    console.warn('Flat realistic texture failed to load:', error);
    return null;
  });
}

// Leaders configuration
const leaders: { name: string; ai: string; color: string }[] = [
  { name: 'Ronnie Raygun', ai: 'aggressive', color: '#ff5555' },
  { name: 'Tricky Dick', ai: 'defensive', color: '#5599ff' },
  { name: 'Jimi Farmer', ai: 'balanced', color: '#55ff99' },
  { name: 'E. Musk Rat', ai: 'chaotic', color: '#ff55ff' },
  { name: 'Donnie Trumpf', ai: 'aggressive', color: '#ffaa55' },
  { name: 'Atom Hus-Bomb', ai: 'aggressive', color: '#ff3333' },
  { name: 'Krazy Re-Entry', ai: 'chaotic', color: '#cc44ff' },
  { name: 'Odd\'n Wild Card', ai: 'trickster', color: '#44ffcc' },
  { name: 'Oil-Stain Lint-Off', ai: 'balanced', color: '#88ff88' },
  { name: 'Ruin Annihilator', ai: 'aggressive', color: '#ff6600' }
];

// Doctrines configuration
const doctrines = {
  mad: {
    name: 'MUTUAL ASSURED DESTRUCTION',
    desc: 'Total retaliation doctrine',
    effects: '+2 missiles at start, -1 defense'
  },
  defense: {
    name: 'STRATEGIC DEFENSE',
    desc: 'Focus on protection systems',
    effects: '+3 defense at start, -1 missile'
  },
  firstStrike: {
    name: 'FIRST STRIKE',
    desc: 'Preemptive attack capability',
    effects: '+1 100MT warhead'
  },
  detente: {
    name: 'DÉTENTE',
    desc: 'Diplomatic engagement',
    effects: '+10 intel, +2 production, peaceful start'
  }
};

type DoctrineKey = keyof typeof doctrines;

function applyDoctrineEffects(nation: Nation, doctrineKey?: DoctrineKey) {
  if (!doctrineKey) return;

  switch (doctrineKey) {
    case 'mad': {
      nation.missiles = Math.max(0, (nation.missiles || 0) + 2);
      nation.defense = Math.max(0, (nation.defense || 0) - 1);
      break;
    }
    case 'defense': {
      nation.defense = Math.max(0, (nation.defense || 0) + 3);
      nation.missiles = Math.max(0, (nation.missiles || 0) - 1);
      break;
    }
    case 'firstStrike': {
      nation.warheads = nation.warheads || {};
      nation.warheads[100] = (nation.warheads[100] || 0) + 1;
      nation.researched = nation.researched || {};
      nation.researched.warhead_100 = true;
      if ((window as any).__gameAddNewsItem) {
        (window as any).__gameAddNewsItem('military', `${nation.name} adopts First Strike Doctrine`, 'critical');
      }
      break;
    }
    case 'detente': {
      nation.intel = (nation.intel || 0) + 10;
      nation.production = (nation.production || 0) + 2;
      break;
    }
    default:
      break;
  }
}

// Costs configuration
const COSTS = {
  missile: { production: 8 },
  bomber: { production: 20 },
  defense: { production: 15 },
  warhead_10: { uranium: 5 },
  warhead_20: { uranium: 12 },
  warhead_40: { uranium: 18 },
  warhead_50: { uranium: 25 },
  warhead_100: { uranium: 50 },
  warhead_200: { uranium: 90 },
  immigration_skilled: { production: 10, intel: 5 },
  immigration_mass: { production: 5, intel: 2 },
  immigration_refugee: { intel: 15 },
  immigration_brain: { intel: 20 }
};

type ResourceCost = Partial<Record<'production' | 'intel' | 'uranium', number>>;

interface ResearchProject {
  id: string;
  name: string;
  description: string;
  category: 'warhead' | 'defense' | 'intel' | 'delivery' | 'conventional' | 'cyber' | 'economy' | 'culture' | 'space' | 'intelligence';
  turns: number;
  cost: ResourceCost;
  yield?: number;
  prerequisites?: string[];
  onComplete?: (nation: Nation) => void;
}

const RESEARCH_TREE: ResearchProject[] = [
  {
    id: 'warhead_20',
    name: 'Improved Fission Packages',
    description: 'Unlocks reliable 20MT warheads for tactical and strategic use.',
    category: 'warhead',
    turns: 2,
    cost: { production: 20, intel: 5 },
    yield: 20
  },
  {
    id: 'warhead_40',
    name: 'Boosted Fission Assembly',
    description: 'Doubles your fission output and enables 40MT warheads.',
    category: 'warhead',
    turns: 3,
    cost: { production: 30, intel: 10 },
    yield: 40,
    prerequisites: ['warhead_20']
  },
  {
    id: 'warhead_50',
    name: 'Thermonuclear Staging',
    description: 'Perfect layered staging to field 50MT strategic devices.',
    category: 'warhead',
    turns: 4,
    cost: { production: 40, intel: 15 },
    yield: 50,
    prerequisites: ['warhead_40']
  },
  {
    id: 'warhead_100',
    name: 'Titan-Class Weaponization',
    description: 'Authorize titanic 100MT warheads for deterrence.',
    category: 'warhead',
    turns: 5,
    cost: { production: 60, intel: 25 },
    yield: 100,
    prerequisites: ['warhead_50']
  },
  {
    id: 'warhead_200',
    name: 'Planet Cracker Initiative',
    description: 'Unlock 200MT devices capable of ending civilizations.',
    category: 'warhead',
    turns: 6,
    cost: { production: 80, intel: 35 },
    yield: 200,
    prerequisites: ['warhead_100']
  },
  {
    id: 'delivery_mirv',
    name: 'MIRV Deployment Doctrine',
    description: 'Retrofit ICBMs with multiple reentry vehicles for overwhelming barrages.',
    category: 'delivery',
    turns: 5,
    cost: { production: 60, intel: 45 },
    prerequisites: ['warhead_50'],
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.mirv = true;
    }
  },
  {
    id: 'delivery_stealth',
    name: 'Strategic Stealth Airframes',
    description: 'Radar-absorbent coatings and ECM suites halve bomber interception odds.',
    category: 'delivery',
    turns: 4,
    cost: { production: 45, intel: 35 },
    prerequisites: ['counterintel'],
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.stealth = true;
    }
  },
  {
    id: 'defense_grid',
    name: 'Orbital Defense Grid',
    description: 'Integrate lasers and interceptors for +2 permanent defense.',
    category: 'defense',
    turns: 4,
    cost: { production: 45, intel: 20 },
    onComplete: nation => {
      nation.defense += 2;
    }
  },
  {
    id: 'counterintel',
    name: 'Counterintelligence Suite',
    description: 'Deploy signals and HUMINT analysis to boost intel yields.',
    category: 'intel',
    turns: 3,
    cost: { production: 25, intel: 25 }
  },
  {
    id: 'cyber_firewalls',
    name: 'Adaptive Quantum Firewalls',
    description: 'Boost cyber readiness regeneration and baseline intrusion resistance.',
    category: 'intel',
    turns: 3,
    cost: { production: 28, intel: 22 },
    onComplete: nation => {
      applyCyberResearchUnlock(nation, 'firewalls');
    }
  },
  {
    id: 'cyber_ids',
    name: 'Intrusion Pattern Analysis',
    description: 'Advanced anomaly detection enables attribution and false-flag countermeasures.',
    category: 'intel',
    turns: 4,
    cost: { production: 32, intel: 30 },
    prerequisites: ['cyber_firewalls'],
    onComplete: nation => {
      applyCyberResearchUnlock(nation, 'intrusion_detection');
    }
  },
  {
    id: 'cyber_advanced_offense',
    name: 'Advanced Offensive Algorithms',
    description: 'AI-driven attack optimization reduces intrusion costs and increases success rates.',
    category: 'cyber',
    turns: 4,
    cost: { production: 35, intel: 30 },
    prerequisites: ['cyber_ids'],
    onComplete: nation => {
      applyCyberResearchUnlock(nation, 'advanced_offense');
    }
  },
  {
    id: 'cyber_stealth',
    name: 'Stealth Protocols',
    description: 'Advanced obfuscation techniques reduce detection chance on all cyber operations.',
    category: 'cyber',
    turns: 3,
    cost: { production: 30, intel: 35 },
    prerequisites: ['cyber_ids'],
    onComplete: nation => {
      applyCyberResearchUnlock(nation, 'stealth_protocols');
    }
  },
  {
    id: 'cyber_attribution_obfuscation',
    name: 'Attribution Obfuscation',
    description: 'False flag operations and proxy networks confuse enemy attribution efforts.',
    category: 'cyber',
    turns: 4,
    cost: { production: 40, intel: 40 },
    prerequisites: ['cyber_ids'],
    onComplete: nation => {
      applyCyberResearchUnlock(nation, 'attribution_obfuscation');
    }
  },
  {
    id: 'cyber_ai_defense',
    name: 'AI-Driven Cyber Defenses',
    description: 'Autonomous defense systems automatically counter-attack intruders.',
    category: 'cyber',
    turns: 5,
    cost: { production: 50, intel: 45 },
    prerequisites: ['cyber_firewalls'],
    onComplete: nation => {
      applyCyberResearchUnlock(nation, 'ai_defense');
    }
  },
  {
    id: 'cyber_superweapon',
    name: 'Cyber Superweapon',
    description: 'Devastating one-time cyber attack capable of crippling enemy infrastructure for 3 turns.',
    category: 'cyber',
    turns: 6,
    cost: { production: 80, intel: 60, uranium: 20 },
    prerequisites: ['cyber_advanced_offense', 'cyber_attribution_obfuscation'],
    onComplete: nation => {
      applyCyberResearchUnlock(nation, 'cyber_superweapon');
    }
  },
  {
    id: 'conventional_armored_doctrine',
    name: 'Armored Maneuver Doctrine',
    description: 'Codify combined-arms tactics to unlock modern armored corps formations.',
    category: 'conventional',
    turns: 3,
    cost: { production: 28, intel: 12 },
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.conventional_armored_doctrine = true;
    }
  },
  {
    id: 'conventional_carrier_battlegroups',
    name: 'Carrier Battlegroup Logistics',
    description: 'Fund carrier aviation, underway replenishment, and escort integration.',
    category: 'conventional',
    turns: 4,
    cost: { production: 36, intel: 16, uranium: 4 },
    prerequisites: ['conventional_armored_doctrine'],
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.conventional_carrier_battlegroups = true;
    }
  },
  {
    id: 'conventional_expeditionary_airframes',
    name: 'Expeditionary Airframes',
    description: 'Deploy forward-operating squadrons with aerial refuelling and SEAD packages.',
    category: 'conventional',
    turns: 4,
    cost: { production: 34, intel: 22 },
    prerequisites: ['conventional_armored_doctrine'],
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.conventional_expeditionary_airframes = true;
    }
  },
  {
    id: 'conventional_combined_arms',
    name: 'Combined Arms Doctrine',
    description: 'Coordinated multi-domain operations grant +10% attack when multiple unit types are deployed.',
    category: 'conventional',
    turns: 3,
    cost: { production: 30, intel: 20 },
    prerequisites: ['conventional_armored_doctrine'],
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.conventional_combined_arms = true;
      nation.combinedArmsBonus = 0.10;
    }
  },
  {
    id: 'conventional_advanced_logistics',
    name: 'Advanced Logistics',
    description: 'Streamlined supply chains increase readiness regeneration by +1 per turn for all units.',
    category: 'conventional',
    turns: 3,
    cost: { production: 35, intel: 15 },
    prerequisites: ['conventional_armored_doctrine'],
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.conventional_advanced_logistics = true;
      nation.readinessRegen = (nation.readinessRegen || 0) + 1;
    }
  },
  {
    id: 'conventional_electronic_warfare',
    name: 'Electronic Warfare Suite',
    description: 'Advanced ECM/ECCM systems reduce enemy detection by 20% in controlled territories.',
    category: 'conventional',
    turns: 4,
    cost: { production: 40, intel: 35 },
    prerequisites: ['conventional_carrier_battlegroups', 'conventional_expeditionary_airframes'],
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.conventional_electronic_warfare = true;
      nation.detectionReduction = (nation.detectionReduction || 0) + 0.20;
    }
  },
  {
    id: 'conventional_force_modernization',
    name: 'Force Modernization',
    description: 'Comprehensive upgrade program permanently enhances all existing units (+1 attack, +1 defense).',
    category: 'conventional',
    turns: 5,
    cost: { production: 60, intel: 30 },
    prerequisites: ['conventional_combined_arms', 'conventional_advanced_logistics'],
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.conventional_force_modernization = true;
      // Apply permanent upgrades to all units
      nation.unitAttackBonus = (nation.unitAttackBonus || 0) + 1;
      nation.unitDefenseBonus = (nation.unitDefenseBonus || 0) + 1;
    }
  },
  {
    id: 'economy_automation',
    name: 'Industrial Automation',
    description: 'Automated factories increase production efficiency by 15%.',
    category: 'economy',
    turns: 2,
    cost: { production: 20 },
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.economy_automation = true;
      nation.productionMultiplier = (nation.productionMultiplier || 1.0) * 1.15;
    }
  },
  {
    id: 'economy_extraction',
    name: 'Advanced Resource Extraction',
    description: 'Deep mining and advanced refining increase uranium output by +1 per turn.',
    category: 'economy',
    turns: 3,
    cost: { production: 30, intel: 10 },
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.economy_extraction = true;
      nation.uraniumPerTurn = (nation.uraniumPerTurn || 0) + 1;
    }
  },
  {
    id: 'economy_efficiency',
    name: 'Economic Efficiency',
    description: 'Streamlined production reduces all construction costs by 10%.',
    category: 'economy',
    turns: 3,
    cost: { production: 25, intel: 15 },
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.economy_efficiency = true;
      nation.buildCostReduction = (nation.buildCostReduction || 0) + 0.1;
    }
  },
  {
    id: 'economy_mobilization',
    name: 'Total Mobilization',
    description: 'War economy maximizes output (+20% production) but increases domestic tension (+5% instability).',
    category: 'economy',
    turns: 4,
    cost: { production: 40, intel: 20 },
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.economy_mobilization = true;
      nation.productionMultiplier = (nation.productionMultiplier || 1.0) * 1.20;
      nation.instability = (nation.instability || 0) + 5;
    }
  },
  {
    id: 'economy_stockpiling',
    name: 'Resource Stockpiling',
    description: 'Strategic reserves increase maximum resource capacity by 50 for all resources.',
    category: 'economy',
    turns: 2,
    cost: { production: 15 },
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.economy_stockpiling = true;
      nation.maxProduction = (nation.maxProduction || 1000) + 50;
      nation.maxIntel = (nation.maxIntel || 500) + 50;
      nation.maxUranium = (nation.maxUranium || 200) + 50;
    }
  },
  {
    id: 'culture_social_media',
    name: 'Social Media Dominance',
    description: 'Global social networks amplify cultural influence, reducing culture bomb cost by 25%.',
    category: 'culture',
    turns: 2,
    cost: { production: 20, intel: 20 },
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.culture_social_media = true;
      nation.cultureBombCostReduction = (nation.cultureBombCostReduction || 0) + 0.25;
    }
  },
  {
    id: 'culture_influence',
    name: 'Global Influence Network',
    description: 'Diplomatic channels enable more simultaneous treaties (+1 treaty slot).',
    category: 'culture',
    turns: 3,
    cost: { production: 30, intel: 30 },
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.culture_influence = true;
      nation.maxTreaties = (nation.maxTreaties || 3) + 1;
    }
  },
  {
    id: 'culture_soft_power',
    name: 'Soft Power Projection',
    description: 'Cultural appeal attracts skilled immigrants (+20% immigration success).',
    category: 'culture',
    turns: 4,
    cost: { production: 35, intel: 35 },
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.culture_soft_power = true;
      nation.immigrationBonus = (nation.immigrationBonus || 1.0) * 1.20;
    }
  },
  {
    id: 'culture_hegemony',
    name: 'Cultural Hegemony',
    description: 'Total cultural dominance converts stolen population 50% faster.',
    category: 'culture',
    turns: 5,
    cost: { production: 50, intel: 50 },
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.culture_hegemony = true;
      nation.stolenPopConversionRate = (nation.stolenPopConversionRate || 1.0) * 1.50;
    }
  },
  {
    id: 'culture_immunity',
    name: 'Diplomatic Immunity',
    description: 'Ironclad treaties cannot be broken by AI for 5 turns after signing.',
    category: 'culture',
    turns: 3,
    cost: { production: 25, intel: 40 },
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.culture_immunity = true;
      nation.treatyLockDuration = 5;
    }
  },
  {
    id: 'space_satellite_network',
    name: 'Advanced Satellite Network',
    description: 'Expanded orbital infrastructure provides +1 additional satellite deployment slot.',
    category: 'space',
    turns: 3,
    cost: { production: 35, intel: 25 },
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.space_satellite_network = true;
      nation.maxSatellites = (nation.maxSatellites || 3) + 1;
    }
  },
  {
    id: 'space_recon_optics',
    name: 'Enhanced Recon Optics',
    description: 'Advanced imaging sensors increase satellite intelligence gathering by 50%.',
    category: 'space',
    turns: 3,
    cost: { production: 30, intel: 30 },
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.space_recon_optics = true;
      nation.satelliteIntelBonus = (nation.satelliteIntelBonus || 1.0) * 1.50;
    }
  },
  {
    id: 'space_asat_weapons',
    name: 'Anti-Satellite Weapons',
    description: 'Ground-based and orbital ASAT systems enable destruction of enemy satellites.',
    category: 'space',
    turns: 4,
    cost: { production: 45, intel: 35, uranium: 10 },
    prerequisites: ['space_satellite_network'],
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.space_asat_weapons = true;
      nation.hasASATCapability = true;
    }
  },
  {
    id: 'space_weapon_platform',
    name: 'Space Weapon Platform',
    description: 'Orbital strike capability delivers precision kinetic bombardment (1 use per game).',
    category: 'space',
    turns: 5,
    cost: { production: 60, intel: 40, uranium: 20 },
    prerequisites: ['space_asat_weapons'],
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.space_weapon_platform = true;
      nation.orbitalStrikesAvailable = (nation.orbitalStrikesAvailable || 0) + 1;
    }
  },
  {
    id: 'space_gps_warfare',
    name: 'GPS Warfare',
    description: 'Satellite navigation disruption reduces enemy missile accuracy by 20%.',
    category: 'space',
    turns: 3,
    cost: { production: 40, intel: 35 },
    prerequisites: ['space_satellite_network'],
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.space_gps_warfare = true;
      nation.enemyMissileAccuracyReduction = (nation.enemyMissileAccuracyReduction || 0) + 0.20;
    }
  },
  {
    id: 'intelligence_deep_cover',
    name: 'Deep Cover Operations',
    description: 'Sleeper agents and NOC operatives reduce sabotage detection by 30%.',
    category: 'intelligence',
    turns: 3,
    cost: { production: 25, intel: 30 },
    prerequisites: ['counterintel'],
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.intelligence_deep_cover = true;
      nation.sabotageDetectionReduction = (nation.sabotageDetectionReduction || 0) + 0.30;
    }
  },
  {
    id: 'intelligence_propaganda',
    name: 'Propaganda Mastery',
    description: 'Psyops and memetic warfare increase meme wave effectiveness by 50%.',
    category: 'intelligence',
    turns: 3,
    cost: { production: 20, intel: 25 },
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.intelligence_propaganda = true;
      nation.memeWaveEffectiveness = (nation.memeWaveEffectiveness || 1.0) * 1.50;
    }
  },
  {
    id: 'intelligence_sigint',
    name: 'Signals Intelligence',
    description: 'NSA-tier SIGINT automatically reveals enemy research projects.',
    category: 'intelligence',
    turns: 4,
    cost: { production: 30, intel: 40 },
    prerequisites: ['counterintel'],
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.intelligence_sigint = true;
      nation.autoRevealEnemyResearch = true;
    }
  },
  {
    id: 'intelligence_covert_action',
    name: 'Covert Action Programs',
    description: 'CIA-style regime destabilization: +15% enemy instability per turn when activated.',
    category: 'intelligence',
    turns: 5,
    cost: { production: 50, intel: 50 },
    prerequisites: ['intelligence_deep_cover', 'intelligence_sigint'],
    onComplete: nation => {
      nation.researched = nation.researched || {};
      nation.researched.intelligence_covert_action = true;
      nation.hasRegimeDestabilization = true;
    }
  }
];

const RESEARCH_LOOKUP: Record<string, ResearchProject> = RESEARCH_TREE.reduce((acc, project) => {
  acc[project.id] = project;
  return acc;
}, {} as Record<string, ResearchProject>);

const WARHEAD_RESEARCH_IDS = new Set(
  RESEARCH_TREE.filter(project => project.category === 'warhead' && project.yield)
    .map(project => project.id)
);

const WARHEAD_YIELD_TO_ID = new Map<number, string>(
  RESEARCH_TREE.filter(project => project.category === 'warhead' && project.yield)
    .map(project => [project.yield as number, project.id])
);

type ModalContentValue = string | ReactNode | (() => ReactNode);

type OperationTargetFilter = (nation: Nation, player: Nation) => boolean;

interface OperationAction {
  id: string;
  title: string;
  subtitle: string;
  description?: string;
  costText?: string;
  requiresTarget?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  targetFilter?: OperationTargetFilter;
}

interface OperationModalProps {
  actions: OperationAction[];
  player: LocalNation;
  targetableNations: LocalNation[];
  onExecute: (action: OperationAction, target?: LocalNation) => boolean;
  onClose: () => void;
  accent?: 'fuchsia' | 'cyan' | 'violet' | 'emerald' | 'amber';
}

const ACCENT_STYLES: Record<NonNullable<OperationModalProps['accent']>, {
  border: string;
  hover: string;
  heading: string;
  text: string;
  muted: string;
  button: string;
}> = {
  fuchsia: {
    border: 'border-fuchsia-500/60',
    hover: 'hover:border-fuchsia-300 hover:bg-fuchsia-500/10',
    heading: 'text-fuchsia-300',
    text: 'text-fuchsia-200',
    muted: 'text-fuchsia-200/70',
    button: 'bg-fuchsia-500 text-black hover:bg-fuchsia-400'
  },
  cyan: {
    border: 'border-cyan-500/60',
    hover: 'hover:border-cyan-300 hover:bg-cyan-500/10',
    heading: 'text-cyan-300',
    text: 'text-cyan-200',
    muted: 'text-cyan-200/70',
    button: 'bg-cyan-500 text-black hover:bg-cyan-400'
  },
  violet: {
    border: 'border-violet-500/60',
    hover: 'hover:border-violet-300 hover:bg-violet-500/10',
    heading: 'text-violet-300',
    text: 'text-violet-200',
    muted: 'text-violet-200/70',
    button: 'bg-violet-500 text-black hover:bg-violet-400'
  },
  emerald: {
    border: 'border-emerald-500/60',
    hover: 'hover:border-emerald-300 hover:bg-emerald-500/10',
    heading: 'text-emerald-300',
    text: 'text-emerald-200',
    muted: 'text-emerald-200/70',
    button: 'bg-emerald-500 text-black hover:bg-emerald-400'
  },
  amber: {
    border: 'border-amber-500/60',
    hover: 'hover:border-amber-300 hover:bg-amber-500/10',
    heading: 'text-amber-300',
    text: 'text-amber-200',
    muted: 'text-amber-200/70',
    button: 'bg-amber-500 text-black hover:bg-amber-400'
  }
};

function OperationModal({ actions, player, targetableNations, onExecute, onClose, accent = 'fuchsia' }: OperationModalProps) {
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const accentStyles = ACCENT_STYLES[accent];

  const pendingAction = useMemo(() => actions.find(action => action.id === pendingActionId) || null, [actions, pendingActionId]);

  const availableTargets = useMemo(() => {
    if (!pendingAction || !pendingAction.requiresTarget) return [] as LocalNation[];
    const filter = pendingAction.targetFilter;
    return targetableNations.filter(nation => (filter ? filter(nation, player) : true));
  }, [pendingAction, targetableNations, player]);

  const handleActionClick = (action: OperationAction) => {
    if (action.disabled) {
      if (action.disabledReason) {
        toast({ title: 'Unavailable', description: action.disabledReason });
      }
      return;
    }

    if (action.requiresTarget) {
      setPendingActionId(action.id);
      return;
    }

    const success = onExecute(action);
    if (success) {
      onClose();
    }
  };

  const handleTargetClick = (target: Nation) => {
    if (!pendingAction) return;
    const success = onExecute(pendingAction, target);
    if (success) {
      setPendingActionId(null);
      onClose();
    }
  };

  if (pendingAction && pendingAction.requiresTarget) {
    return (
      <div className="space-y-4">
        <div className={`text-xs uppercase tracking-widest ${accentStyles.heading}`}>
          Select target for {pendingAction.title}
        </div>
        <div className="grid gap-3">
          {availableTargets.length === 0 ? (
            <div className={`rounded border ${accentStyles.border} bg-black/50 px-4 py-3 text-sm ${accentStyles.muted}`}>
              No valid targets available.
            </div>
          ) : (
            availableTargets.map(target => (
              <button
                key={target.id}
                type="button"
                onClick={() => handleTargetClick(target)}
                className={`rounded border ${accentStyles.border} bg-black/60 px-4 py-3 text-left transition ${accentStyles.hover}`}
              >
                <div className={`flex items-center justify-between text-sm font-semibold ${accentStyles.text}`}>
                  <span>{target.name}</span>
                  <span>{Math.floor(target.population)}M</span>
                </div>
                <div className={`mt-1 text-xs ${accentStyles.muted}`}>
                  DEF {target.defense} • MISS {target.missiles} • INSTAB {Math.floor(target.instability || 0)}
                </div>
              </button>
            ))
          )}
        </div>
        <div className="flex flex-wrap justify-between gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setPendingActionId(null)}
            className="border border-cyan-500/60 bg-transparent text-cyan-200 hover:bg-cyan-500/10"
          >
            Back
          </Button>
          <Button type="button" onClick={onClose} className={accentStyles.button}>
            Close [ESC]
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={`text-xs uppercase tracking-widest ${accentStyles.heading}`}>Operations</div>
      <div className="grid gap-3 sm:grid-cols-2">
        {actions.map(action => (
          <button
            key={action.id}
            type="button"
            onClick={() => handleActionClick(action)}
            className={`rounded border ${accentStyles.border} bg-black/60 px-4 py-3 text-left transition ${accentStyles.hover} ${action.disabled ? 'cursor-not-allowed opacity-40' : ''}`}
            aria-disabled={action.disabled}
          >
            <div className={`text-sm font-semibold ${accentStyles.text}`}>{action.title}</div>
            <div className={`text-xs uppercase tracking-wide ${accentStyles.heading}`}>{action.subtitle}</div>
            {action.costText ? (
              <div className={`mt-2 text-xs ${accentStyles.muted}`}>{action.costText}</div>
            ) : null}
            {action.description ? (
              <p className={`mt-2 text-xs leading-relaxed ${accentStyles.muted}`}>{action.description}</p>
            ) : null}
            {action.disabled && action.disabledReason ? (
              <p className="mt-2 text-xs text-yellow-300/80">{action.disabledReason}</p>
            ) : null}
          </button>
        ))}
      </div>
      <div className="flex justify-end">
        <Button type="button" onClick={onClose} className={accentStyles.button}>
          Close [ESC]
        </Button>
      </div>
    </div>
  );
}

interface IntelReportContentProps {
  player: LocalNation;
  onClose: () => void;
}

function IntelReportContent({ player, onClose }: IntelReportContentProps) {
  const visibleTargets = useMemo(() => {
    if (!player.satellites) return [] as LocalNation[];
    return nations.filter(nation => {
      if (nation.isPlayer) return false;
      if (!player.satellites?.[nation.id]) return false;
      if (nation.coverOpsTurns && nation.coverOpsTurns > 0) return false;
      return true;
    });
  }, [player]);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {visibleTargets.length === 0 ? (
          <div className="rounded border border-cyan-500/60 bg-black/50 px-4 py-3 text-sm text-cyan-200/70">
            No active surveillance targets available. Deploy satellites to gather intelligence.
          </div>
        ) : (
          visibleTargets.map(nation => {
            const warheads = Object.entries(nation.warheads || {})
              .map(([yieldMT, count]) => `${yieldMT}MT×${count}`)
              .join(' ');
            const deepReconActive = !!player.deepRecon?.[nation.id];
            const cyberProfile = nation.cyber ?? createDefaultNationCyberProfile();

            return (
              <div
                key={nation.id}
                className="rounded border border-cyan-500/60 bg-black/60 px-4 py-3 text-sm text-cyan-100"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-cyan-200">{nation.name}</span>
                  <span className="text-xs text-cyan-300">POP {Math.floor(nation.population)}M</span>
                </div>
                <div className="mt-2 grid gap-1 text-xs text-cyan-200/80">
                  <div>Missiles: {nation.missiles} • Defense: {nation.defense}</div>
                  <div>Warheads: {warheads || '—'}</div>
                  <div>
                    Production: {Math.floor(nation.production || 0)} • Uranium: {Math.floor(nation.uranium || 0)} • Intel: {Math.floor(nation.intel || 0)}
                  </div>
                  <div>
                    Instability: {Math.floor(nation.instability || 0)} • Cities: {nation.cities || 1}
                  </div>
                  <div>
                    Migrants (turn / total): {(nation.migrantsThisTurn || 0)} / {(nation.migrantsTotal || 0)}
                  </div>
                  <div>
                    Cyber readiness: {Math.round(cyberProfile.readiness)}/{cyberProfile.maxReadiness} • Detection: {Math.round(cyberProfile.detection)}%
                  </div>
                  {deepReconActive ? (
                    <>
                      <div>Doctrine: {nation.doctrine || 'Unknown'} • Personality: {nation.ai || 'Unknown'}</div>
                      <div>Tech: {Object.keys(nation.researched || {}).join(', ') || 'None'}</div>
                    </>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="flex justify-end">
        <Button type="button" onClick={onClose} className="bg-cyan-500 text-black hover:bg-cyan-400">
          Close [ESC]
        </Button>
      </div>
    </div>
  );
}

// PlayerManager class
class PlayerManager {
  private static _cached: Nation | null = null;
  
  static get(): Nation | null {
    if (this._cached && nations.includes(this._cached)) {
      return this._cached;
    }
    
    const player = nations.find(n => n?.isPlayer);
    if (player) {
      this._cached = player;
      return player;
    }
    
    return null;
  }
  
  static reset() {
    this._cached = null;
  }
}

// Doomsday Clock
class DoomsdayClock {
  static minutes = 7.0;
  
  static tick(amount = 0.5) {
    this.minutes = Math.max(0, this.minutes - amount);
  }
  
  static improve(amount = 0.5) {
    this.minutes = Math.min(12, this.minutes + amount);
  }
  
  static update() {
    const display = document.getElementById('doomsdayTime');
    if (display) {
      const mins = Math.floor(this.minutes);
      const secs = Math.floor((this.minutes % 1) * 60);
      display.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    }
  }
}

// Audio System
const MUSIC_TRACKS = [
  { id: 'vector-command', title: 'Vector Command Briefing', file: '/Muzak/vector-command.mp3' },
  { id: 'night-operations', title: 'Night Operations', file: '/Muzak/night-operations.mp3' },
  { id: 'diplomatic-channel', title: 'Diplomatic Channel', file: '/Muzak/diplomatic-channel.mp3' },
  { id: 'tactical-escalation', title: 'Tactical Escalation', file: '/Muzak/tactical-escalation.mp3' }
] as const;
type MusicTrack = (typeof MUSIC_TRACKS)[number];
type MusicTrackId = MusicTrack['id'];

const AudioSys = {
  audioContext: null as AudioContext | null,
  musicEnabled: true,
  sfxEnabled: true,
  musicVolume: 0.3,
  musicGainNode: null as GainNode | null,
  musicSource: null as AudioBufferSourceNode | null,
  musicCache: new Map<string, AudioBuffer>(),
  trackPromises: new Map<string, Promise<AudioBuffer>>(),
  preferredTrackId: null as MusicTrackId | null,
  pendingTrackId: null as MusicTrackId | null,
  currentTrackId: null as MusicTrackId | null,
  userInteractionPrimed: false,
  trackListeners: new Set<(trackId: MusicTrackId | null) => void>(),
  audioSupported: true,

  init() {
    if (typeof window === 'undefined') return;
    if (!this.audioSupported) return;
    if (!this.audioContext) {
      try {
        const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextCtor) {
          throw new Error('Web Audio API is not available in this browser');
        }
        this.audioContext = new AudioContextCtor();
      } catch (error) {
        console.warn('Audio context initialization failed; disabling audio features.', error);
        this.audioSupported = false;
        this.sfxEnabled = false;
      }
    }
  },

  ensureMusicGain() {
    if (!this.audioContext) this.init();
    if (!this.audioContext) return null;
    if (!this.musicGainNode) {
      this.musicGainNode = this.audioContext.createGain();
      this.musicGainNode.gain.value = this.musicVolume;
      this.musicGainNode.connect(this.audioContext.destination);
    }
    return this.musicGainNode;
  },

  async resumeContext() {
    if (!this.audioContext) this.init();
    if (!this.audioContext) return;
    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (error) {
        console.warn('Audio context resume failed', error);
      }
    }
  },

  async loadMusicTrack(trackId: MusicTrackId) {
    if (this.musicCache.has(trackId)) {
      return this.musicCache.get(trackId)!;
    }
    if (this.trackPromises.has(trackId)) {
      return this.trackPromises.get(trackId)!;
    }

    const track = MUSIC_TRACKS.find(entry => entry.id === trackId);
    if (!track) {
      throw new Error(`Unknown track ${trackId}`);
    }

    const loadPromise = (async () => {
      try {
        const response = await fetch(track.file);
        if (!response.ok) {
          throw new Error(`Failed to load track: ${response.status} ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        if (!this.audioContext) this.init();
        if (!this.audioContext) throw new Error('Audio context unavailable');
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer.slice(0));
        this.musicCache.set(trackId, audioBuffer);
        return audioBuffer;
      } catch (error) {
        console.warn('Music track load failed', error);
        throw error;
      } finally {
        this.trackPromises.delete(trackId);
      }
    })();

    this.trackPromises.set(trackId, loadPromise);
    return loadPromise;
  },

  pickRandomTrack(excludeId?: MusicTrackId | null) {
    const available = MUSIC_TRACKS.filter(track => track.id !== excludeId);
    if (available.length === 0) {
      return MUSIC_TRACKS[0]?.id ?? null;
    }
    const choice = available[Math.floor(Math.random() * available.length)];
    return choice?.id ?? null;
  },

  async playTrack(trackId: MusicTrackId, { forceRestart = false }: { forceRestart?: boolean } = {}) {
    this.pendingTrackId = trackId;
    if (!this.musicEnabled) {
      return;
    }
    if (!this.audioContext) this.init();
    if (!this.audioContext) {
      return;
    }

    if (!this.userInteractionPrimed) {
      await this.resumeContext();
      if (this.audioContext?.state === 'running') {
        this.userInteractionPrimed = true;
      }
    }

    if (!this.userInteractionPrimed) {
      return;
    }

    if (!forceRestart && this.currentTrackId === trackId && this.musicSource) {
      return;
    }

    try {
      await this.resumeContext();
      const buffer = await this.loadMusicTrack(trackId);
      if (!buffer) return;
      if (!this.musicEnabled || this.pendingTrackId !== trackId) return;

      const gainNode = this.ensureMusicGain();
      if (!gainNode) return;

      this.stopMusic();

      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.loop = this.preferredTrackId !== null;
      source.connect(gainNode);
      source.onended = () => {
        if (!this.preferredTrackId) {
          const next = this.pickRandomTrack(trackId);
          if (next) {
            void this.playTrack(next, { forceRestart: true });
          }
        }
      };
      source.start(0);
      this.musicSource = source;
      this.currentTrackId = trackId;
      this.notifyTrackListeners(trackId);
    } catch (error) {
      console.warn('Music playback failed', error);
    }
  },

  async playPreferredTrack({ forceRestart = false }: { forceRestart?: boolean } = {}) {
    if (!this.musicEnabled) {
      return;
    }
    let trackId = this.preferredTrackId;
    if (!trackId) {
      trackId = this.pickRandomTrack(this.currentTrackId);
    }
    if (!trackId) {
      return;
    }
    await this.playTrack(trackId, { forceRestart });
  },

  stopMusic() {
    if (this.musicSource) {
      this.musicSource.onended = null;
      try {
        this.musicSource.stop();
      } catch (error) {
        console.warn('Stopping music failed', error);
      }
      try {
        this.musicSource.disconnect();
      } catch (error) {
        console.warn('Disconnecting music failed', error);
      }
    }
    this.musicSource = null;
    this.currentTrackId = null;
    this.notifyTrackListeners(null);
  },

  handleUserInteraction() {
    if (this.userInteractionPrimed) {
      return;
    }
    this.userInteractionPrimed = true;
    void this.playPreferredTrack({ forceRestart: true });
  },

  setPreferredTrack(trackId: MusicTrackId | null) {
    this.preferredTrackId = trackId;
    if (!trackId) {
      const next = this.pickRandomTrack(this.currentTrackId);
      if (next) {
        this.pendingTrackId = next;
        void this.playTrack(next, { forceRestart: true });
      }
      return;
    }
    this.pendingTrackId = trackId;
    void this.playTrack(trackId, { forceRestart: true });
  },

  getPreferredTrack() {
    return this.preferredTrackId;
  },

  getCurrentTrack() {
    return this.currentTrackId;
  },

  getTracks() {
    return MUSIC_TRACKS.slice();
  },

  getTrackMetadata(trackId: MusicTrackId) {
    return MUSIC_TRACKS.find(track => track.id === trackId) ?? null;
  },

  notifyTrackListeners(trackId: MusicTrackId | null) {
    this.trackListeners.forEach(listener => {
      try {
        listener(trackId);
      } catch (error) {
        console.warn('Track listener error', error);
      }
    });
  },

  subscribeToTrackChanges(listener: (trackId: MusicTrackId | null) => void) {
    this.trackListeners.add(listener);
    return () => {
      this.trackListeners.delete(listener);
    };
  },

  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (!enabled) {
      this.stopMusic();
    } else {
      void this.playPreferredTrack({ forceRestart: true });
    }
  },

  playNextTrack() {
    if (this.preferredTrackId) {
      void this.playTrack(this.preferredTrackId, { forceRestart: true });
      return;
    }
    const next = this.pickRandomTrack(this.currentTrackId);
    if (next) {
      this.pendingTrackId = next;
      void this.playTrack(next, { forceRestart: true });
    }
  },

  playSFX(type: string) {
    if (!this.sfxEnabled) return;
    if (!this.audioSupported) return;
    if (!this.audioContext) this.init();
    const context = this.audioContext;
    if (!context) return;

    try {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      // Define sound profiles for different events
      let freq = 400;
      let duration = 0.3;
      let volume = 0.1;
      let waveType: OscillatorType = 'sine';

      switch(type) {
        case 'explosion':
          freq = 80;
          duration = 0.5;
          volume = 0.15;
          waveType = 'sawtooth';
          break;
        case 'launch':
          freq = 200;
          duration = 0.4;
          volume = 0.12;
          waveType = 'square';
          break;
        case 'click':
          freq = 600;
          duration = 0.08;
          volume = 0.08;
          waveType = 'sine';
          break;
        case 'success':
          freq = 800;
          duration = 0.15;
          volume = 0.1;
          waveType = 'sine';
          break;
        case 'error':
          freq = 150;
          duration = 0.2;
          volume = 0.12;
          waveType = 'sawtooth';
          break;
        case 'build':
          freq = 500;
          duration = 0.25;
          volume = 0.1;
          waveType = 'triangle';
          break;
        case 'research':
          freq = 700;
          duration = 0.3;
          volume = 0.09;
          waveType = 'sine';
          break;
        case 'intel':
          freq = 900;
          duration = 0.2;
          volume = 0.08;
          waveType = 'sine';
          break;
        case 'defcon':
          freq = 300;
          duration = 0.5;
          volume = 0.15;
          waveType = 'square';
          break;
        case 'endturn':
          freq = 450;
          duration = 0.35;
          volume = 0.11;
          waveType = 'triangle';
          break;
        default:
          freq = 400;
          duration = 0.15;
          volume = 0.08;
      }

      oscillator.type = waveType;
      oscillator.frequency.setValueAtTime(freq, context.currentTime);

      gainNode.gain.setValueAtTime(volume, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + duration);

      oscillator.start();
      oscillator.stop(context.currentTime + duration);
    } catch (error) {
      console.warn('SFX playback failed', error);
    }
  },
  
  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
  },

  toggleSFX() {
    this.sfxEnabled = !this.sfxEnabled;
  },

  setMusicVolume(volume: number) {
    this.musicVolume = volume;
    if (this.musicGainNode && this.audioContext) {
      try {
        this.musicGainNode.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.05);
      } catch (error) {
        this.musicGainNode.gain.value = volume;
      }
    }
  }
};

// Atmosphere effects
const Atmosphere = {
  clouds: [] as any[],
  stars: [] as any[],
  initialized: false,

  init() {
    if (this.initialized) return;
    this.stars = [];
    for (let i = 0; i < 120; i++) {
      this.stars.push({
        x: Math.random() * W,
        y: Math.random() * H * 0.6,
        brightness: Math.random()
      });
    }

    this.clouds = [];
    for (let i = 0; i < 16; i++) {
      this.clouds.push({
        x: Math.random() * W,
        y: Math.random() * H * 0.5,
        sizeX: 160 + Math.random() * 220,
        sizeY: 60 + Math.random() * 90,
        speed: 0.05 + Math.random() * 0.1
      });
    }
    this.initialized = true;
  },
  
  update() {
    this.clouds.forEach(cloud => {
      cloud.x += cloud.speed;
      if (cloud.x - cloud.sizeX > W) {
        cloud.x = -cloud.sizeX;
      }
    });
  },
  
  draw(context: CanvasRenderingContext2D, style: MapStyle) {
    if (!this.initialized) return;

    const palette = THEME_SETTINGS[currentTheme];
    const isNight = style === 'night';
    const isWireframe = style === 'wireframe';

    context.fillStyle = isNight ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.25)';
    const starAlpha = isWireframe ? 0.45 : isNight ? 0.65 : 0.4;
    this.stars.forEach(star => {
      context.globalAlpha = star.brightness * starAlpha;
      context.fillRect(star.x, star.y, 1, 1);
    });
    context.globalAlpha = 1;

    if (isWireframe) {
      return;
    }

    const cloudAlpha = isNight ? 0.05 : style === 'political' ? 0.12 : 0.08;
    this.clouds.forEach(cloud => {
      context.save();
      context.globalAlpha = cloudAlpha;
      if (style === 'political') {
        context.fillStyle = 'rgba(255,180,120,0.45)';
      } else {
        context.fillStyle = palette.cloud;
      }
      context.beginPath();
      context.ellipse(cloud.x, cloud.y, cloud.sizeX, cloud.sizeY, 0, 0, Math.PI * 2);
      context.fill();
      context.restore();
    });
  }
};

// Ocean effects
const Ocean = {
  waves: [] as any[],
  
  init() {
    this.waves = [];
    for (let i = 0; i < 10; i++) {
      this.waves.push({
        y: H * 0.7 + i * 5,
        offset: Math.random() * Math.PI * 2,
        amplitude: 2 + Math.random() * 3
      });
    }
  },
  
  update() {
    // Waves naturally animate via sin functions
  },
  
  draw(context: CanvasRenderingContext2D, style: MapStyle) {
    const time = Date.now() / 1000;
    const palette = THEME_SETTINGS[currentTheme];
    const isWireframe = style === 'wireframe';
    const isNight = style === 'night';

    context.save();
    context.lineWidth = isWireframe ? 1.5 : 1;
    context.globalAlpha = isNight ? 0.18 : isWireframe ? 0.45 : 0.35;
    context.setLineDash(isWireframe ? [10, 6] : []);
    context.strokeStyle = isWireframe ? '#4ef6ff' : palette.ocean;

    this.waves.forEach(wave => {
      context.beginPath();
      for (let x = 0; x < W; x += 5) {
        const y = wave.y + Math.sin((x / 50) + time + wave.offset) * wave.amplitude;
        if (x === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.stroke();
    });
    context.restore();
  }
};

// City Lights system
const CityLights = {
  cities: [] as any[],
  
  generate() {
    this.cities = [];
    nations.forEach(nation => {
      if (nation.population > 0) {
        const cityCount = Math.min(20, Math.floor(nation.population / 10));
        for (let i = 0; i < cityCount; i++) {
          const spread = 15;
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * spread;
          this.cities.push({
            lat: nation.lat + Math.sin(angle) * dist,
            lon: nation.lon + Math.cos(angle) * dist,
            brightness: 0.5 + Math.random() * 0.5
          });
        }
      }
    });
  },
  
  addCity(lat: number, lon: number, brightness: number) {
    this.cities.push({ lat, lon, brightness });
  },
  
  destroyNear(x: number, y: number, radius: number): number {
    let destroyed = 0;
    this.cities = this.cities.filter(city => {
      const [cx, cy] = project(city.lon, city.lat);
      const dist = Math.hypot(cx - x, cy - y);
      if (dist < radius) {
        destroyed++;
        return false;
      }
      return true;
    });
    return destroyed;
  },
  
  draw(context: CanvasRenderingContext2D, style: MapStyle) {
    if (style === 'wireframe') {
      return;
    }

    const time = Date.now();
    this.cities.forEach(city => {
      const [x, y] = project(city.lon, city.lat);

      // Flickering light effect (satellite view)
      const flicker = 0.8 + Math.sin(time * 0.003 + city.lon + city.lat) * 0.2;
      const brightness = city.brightness * flicker;

      // Glow effect
      context.save();
      if (style === 'night') {
        context.shadowColor = 'rgba(255,220,140,0.9)';
        context.shadowBlur = 4;
        context.fillStyle = `rgba(255,210,120,${brightness})`;
      } else if (style === 'political') {
        context.shadowColor = 'rgba(255,200,80,0.75)';
        context.shadowBlur = 3;
        context.fillStyle = `rgba(255,200,80,${brightness * 0.7})`;
      } else {
        context.shadowColor = 'rgba(255,255,150,0.8)';
        context.shadowBlur = 3;
        context.fillStyle = `rgba(255,255,100,${brightness * 0.6})`;
      }
      context.fillRect(x - 0.8, y - 0.8, 1.6, 1.6);
      context.restore();
    });
    context.globalAlpha = 1;
  }
};

// Helper functions
function canAfford(nation: Nation, cost: any): boolean {
  return Object.entries(cost).every(([resource, amount]) => {
    const current = (nation as any)[resource] || 0;
    return current >= (amount as number);
  });
}

function pay(nation: Nation, cost: any) {
  Object.entries(cost).forEach(([resource, amount]) => {
    (nation as any)[resource] -= amount as number;
  });
}

function getCityCost(nation: Nation) {
  const cityCount = nation.cities || 1;
  return { production: 20 + (cityCount - 1) * 5 };
}

function canPerformAction(action: string, defcon: number): boolean {
  if (action === 'attack') return defcon <= 2;
  if (action === 'escalate') return defcon > 1;
  return true;
}

function hasActivePeaceTreaty(player: Nation | null, target: Nation): boolean {
  if (!player) return false;
  const treaty = player.treaties?.[target.id];
  if (!treaty) return false;
  if (treaty.alliance) return true;
  if (typeof treaty.truceTurns === 'number' && treaty.truceTurns > 0) return true;
  return false;
}

function isEligibleEnemyTarget(player: Nation | null, target: Nation): boolean {
  if (target.isPlayer) return false;
  if (target.population <= 0) return false;
  if (hasActivePeaceTreaty(player, target)) return false;
  return true;
}

function getNationById(id: string): Nation | undefined {
  return nations.find(n => n.id === id);
}

function ensureTreatyRecord(self: Nation, other: Nation) {
  self.treaties = self.treaties || {};
  self.treaties[other.id] = self.treaties[other.id] || {};
  return self.treaties[other.id];
}

function adjustThreat(nation: Nation, otherId: string, delta: number) {
  nation.threats = nation.threats || {};
  const next = Math.max(0, Math.min(100, (nation.threats[otherId] || 0) + delta));
  if (next <= 0) {
    delete nation.threats[otherId];
  } else {
    nation.threats[otherId] = next;
  }
}

function aiLogDiplomacy(actor: Nation, message: string) {
  log(`${actor.name} ${message}`);
}

function aiSignMutualTruce(actor: Nation, target: Nation, turns: number, reason?: string) {
  const treaty = ensureTreatyRecord(actor, target);
  const reciprocal = ensureTreatyRecord(target, actor);
  treaty.truceTurns = Math.max(treaty.truceTurns || 0, turns);
  reciprocal.truceTurns = Math.max(reciprocal.truceTurns || 0, turns);
  aiLogDiplomacy(actor, `agrees to a ${turns}-turn truce with ${target.name}${reason ? ` (${reason})` : ''}.`);
  adjustThreat(actor, target.id, -3);
  adjustThreat(target, actor.id, -2);
}

function aiSignNonAggressionPact(actor: Nation, target: Nation): boolean {
  const cost = { intel: 15 };
  if (!canAfford(actor, cost)) return false;
  pay(actor, cost);
  aiSignMutualTruce(actor, target, 5, 'non-aggression pact');
  return true;
}

function aiFormAlliance(actor: Nation, target: Nation): boolean {
  const cost = { production: 10, intel: 40 };
  if (!canAfford(actor, cost)) return false;
  pay(actor, cost);
  const treaty = ensureTreatyRecord(actor, target);
  const reciprocal = ensureTreatyRecord(target, actor);
  treaty.truceTurns = 999;
  reciprocal.truceTurns = 999;
  treaty.alliance = true;
  reciprocal.alliance = true;
  aiLogDiplomacy(actor, `enters an alliance with ${target.name}.`);
  adjustThreat(actor, target.id, -5);
  adjustThreat(target, actor.id, -5);
  return true;
}

function aiSendAid(actor: Nation, target: Nation): boolean {
  const cost = { production: 20 };
  if (!canAfford(actor, cost)) return false;
  pay(actor, cost);
  target.instability = Math.max(0, (target.instability || 0) - 10);
  aiLogDiplomacy(actor, `sends economic aid to ${target.name}, reducing their instability.`);
  adjustThreat(target, actor.id, -2);
  return true;
}

function aiImposeSanctions(actor: Nation, target: Nation): boolean {
  if (target.sanctioned && target.sanctionedBy?.[actor.id]) return false;
  const cost = { intel: 15 };
  if (!canAfford(actor, cost)) return false;
  pay(actor, cost);
  target.sanctioned = true;
  target.sanctionTurns = Math.max(5, (target.sanctionTurns || 0) + 5);
  target.sanctionedBy = target.sanctionedBy || {};
  target.sanctionedBy[actor.id] = (target.sanctionedBy[actor.id] || 0) + 5;
  aiLogDiplomacy(actor, `imposes sanctions on ${target.name}.`);
  adjustThreat(target, actor.id, 3);
  return true;
}

function aiBreakTreaties(actor: Nation, target: Nation, reason?: string): boolean {
  const treaty = ensureTreatyRecord(actor, target);
  const reciprocal = ensureTreatyRecord(target, actor);
  const hadAgreements = !!(treaty.truceTurns || treaty.alliance);
  if (!hadAgreements) return false;
  delete treaty.truceTurns;
  delete reciprocal.truceTurns;
  delete treaty.alliance;
  delete reciprocal.alliance;
  aiLogDiplomacy(actor, `terminates agreements with ${target.name}${reason ? ` (${reason})` : ''}.`);
  adjustThreat(actor, target.id, 6);
  adjustThreat(target, actor.id, 8);
  return true;
}

function aiRespondToSanctions(actor: Nation): boolean {
  if (!actor.sanctioned || !actor.sanctionedBy) return false;
  const sanctioners = Object.keys(actor.sanctionedBy)
    .map(id => getNationById(id))
    .filter((nation): nation is Nation => !!nation && nation.population > 0);

  if (sanctioners.length === 0) return false;

  const prioritized = sanctioners.sort((a, b) => {
    const aThreat = actor.threats?.[a.id] || 0;
    const bThreat = actor.threats?.[b.id] || 0;
    return bThreat - aThreat;
  });

  const topSanctioner = prioritized[0];
  if (!topSanctioner) return false;

  // Try counter-sanctions if affordable and no alliance
  const treaty = actor.treaties?.[topSanctioner.id];
  if ((!treaty || !treaty.alliance) && aiImposeSanctions(actor, topSanctioner)) {
    aiLogDiplomacy(actor, `retaliates against ${topSanctioner.name} for sanctions.`);
    return true;
  }

  // Attempt to de-escalate via truce if counter-sanctions failed
  if (!treaty?.truceTurns) {
    aiSignMutualTruce(actor, topSanctioner, 2, 'attempting to ease sanctions');
    return true;
  }

  return false;
}

function aiHandleTreatyStrain(actor: Nation): boolean {
  if (!actor.treaties) return false;
  const strained = Object.entries(actor.treaties)
    .map(([id, treaty]) => ({ id, treaty, partner: getNationById(id) }))
    .filter(({ treaty, partner }) => partner && (treaty?.truceTurns || treaty?.alliance));

  for (const { id, treaty, partner } of strained) {
    if (!partner) continue;
    const threat = actor.threats?.[id] || 0;
    if (threat > 12) {
      return aiBreakTreaties(actor, partner, 'due to rising hostilities');
    }
    if (treaty?.alliance && partner.sanctionedBy?.[actor.id]) {
      // Alliance member sanctioning us is a breach
      return aiBreakTreaties(actor, partner, 'after alliance breach');
    }
  }

  return false;
}

function aiHandleDiplomaticUrgencies(actor: Nation): boolean {
  if (aiRespondToSanctions(actor)) {
    return true;
  }

  if (aiHandleTreatyStrain(actor)) {
    return true;
  }

  return false;
}

function aiAttemptDiplomacy(actor: Nation): boolean {
  const others = nations.filter(n => n !== actor && n.population > 0);
  if (others.length === 0) return false;

  const sortedByThreat = others
    .map(target => ({ target, threat: actor.threats?.[target.id] || 0 }))
    .sort((a, b) => b.threat - a.threat);

  const highest = sortedByThreat[0];
  if (highest && highest.threat >= 8) {
    const treaty = actor.treaties?.[highest.target.id];
    if (!treaty?.truceTurns) {
      if (highest.threat >= 12 && aiSignNonAggressionPact(actor, highest.target)) {
        return true;
      }
      aiSignMutualTruce(actor, highest.target, 2, 'to diffuse tensions');
      return true;
    }
    if (!treaty?.alliance && highest.threat >= 15 && aiBreakTreaties(actor, highest.target, 'after repeated provocations')) {
      return true;
    }
  }

  // Sanction persistently hostile nations
  const sanctionTarget = sortedByThreat.find(entry => entry.threat >= 10 && !actor.treaties?.[entry.target.id]?.alliance);
  if (sanctionTarget && Math.random() < 0.6 && aiImposeSanctions(actor, sanctionTarget.target)) {
    return true;
  }

  // Support unstable allies or low-threat partners
  const aidCandidate = others
    .filter(target => (actor.treaties?.[target.id]?.alliance || actor.treaties?.[target.id]?.truceTurns) && (target.instability || 0) >= 10)
    .sort((a, b) => (b.instability || 0) - (a.instability || 0))[0];

  if (aidCandidate && aiSendAid(actor, aidCandidate)) {
    return true;
  }

  // Form alliances with trusted nations occasionally
  if (Math.random() < 0.15) {
    const allianceCandidate = others
      .filter(target => {
        const threat = actor.threats?.[target.id] || 0;
        const treaty = actor.treaties?.[target.id];
        return threat <= 2 && !(treaty?.alliance);
      })
      .sort((a, b) => (actor.threats?.[a.id] || 0) - (actor.threats?.[b.id] || 0))[0];

    if (allianceCandidate && aiFormAlliance(actor, allianceCandidate)) {
      return true;
    }
  }

  // Offer truces when moderately threatened
  const moderateThreat = sortedByThreat.find(entry => entry.threat >= 5 && !(actor.treaties?.[entry.target.id]?.truceTurns));
  if (moderateThreat && Math.random() < 0.6) {
    aiSignMutualTruce(actor, moderateThreat.target, 2);
    return true;
  }

  return false;
}

function startResearch(tier: number | string): boolean {
  const player = PlayerManager.get();
  if (!player) return false;

  const projectId = typeof tier === 'number' ? WARHEAD_YIELD_TO_ID.get(tier) || `warhead_${tier}` : tier;
  const project = RESEARCH_LOOKUP[projectId];

  if (!project) {
    toast({ title: 'Unknown research', description: 'The requested project does not exist.' });
    return false;
  }

  if (player.researchQueue) {
    toast({ title: 'Project already running', description: 'You must wait for the current research to complete before starting another.' });
    return false;
  }

  player.researched = player.researched || {};

  if (player.researched[project.id]) {
    toast({ title: 'Already unlocked', description: `${project.name} has already been researched.` });
    return false;
  }

  if (project.prerequisites && project.prerequisites.some(req => !player.researched?.[req])) {
    toast({ title: 'Prerequisites missing', description: 'Research previous tiers before starting this project.' });
    return false;
  }

  if (!canAfford(player, project.cost)) {
    toast({ title: 'Insufficient resources', description: 'You need more production or intel to begin this project.' });
    return false;
  }

  pay(player, project.cost);

  player.researchQueue = {
    projectId: project.id,
    turnsRemaining: project.turns,
    totalTurns: project.turns
  };

  AudioSys.playSFX('research');
  log(`Research initiated: ${project.name}`);
  toast({ 
    title: '🔬 Research Initiated', 
    description: `${project.name} will complete in ${project.turns} turn${project.turns > 1 ? 's' : ''}.`,
  });
  updateDisplay();
  return true;
}

function advanceResearch(nation: Nation, phase: 'PRODUCTION' | 'RESOLUTION') {
  if (!nation.researchQueue || nation.researchQueue.turnsRemaining <= 0) return;

  nation.researchQueue.turnsRemaining = Math.max(0, nation.researchQueue.turnsRemaining - 1);

  if (nation.researchQueue.turnsRemaining > 0) return;

  const project = RESEARCH_LOOKUP[nation.researchQueue.projectId];
  nation.researchQueue = null;

  if (!project) return;

  nation.researched = nation.researched || {};
  nation.researched[project.id] = true;

  if (project.onComplete) {
    project.onComplete(nation);
  }

  const message = `${nation.name} completes ${project.name}!`;
  log(message, 'success');

  if (nation.isPlayer) {
    AudioSys.playSFX('success');
    toast({ 
      title: '✅ Research Complete', 
      description: `${project.name} breakthrough achieved! New capabilities unlocked.`,
    });
    updateDisplay();
  }
}

// Game initialization
function initNations() {
  // Prevent re-initialization if game is already running
  if (nations.length > 0 && S.turn > 1) {
    console.warn('Attempted to re-initialize game - blocked');
    return;
  }
  
  nations = [];
  PlayerManager.reset();
  
  const playerLeaderName = S.selectedLeader || 'PLAYER';
  const playerLeaderConfig = leaders.find(l => l.name === playerLeaderName);
  const selectedDoctrine = (S.selectedDoctrine as DoctrineKey | null) || undefined;
  const playerNation: LocalNation = {
    id: 'player',
    isPlayer: true,
    name: 'PLAYER',
    leader: playerLeaderName,
    doctrine: selectedDoctrine,
    lon: -95,
    lat: 39,
    color: playerLeaderConfig?.color || '#00ffff',
    population: 240,
    missiles: 5,
    bombers: 2,
    defense: 3,
    instability: 0,
    morale: 72,
    publicOpinion: 68,
    electionTimer: 12,
    cabinetApproval: 64,
    production: 25,
    uranium: 15,
    intel: 10,
    cities: 1,
    warheads: { 10: 3, 20: 2 },
    researched: { warhead_20: true },
    researchQueue: null,
    treaties: {},
    threats: {},
    migrantsThisTurn: 0,
    migrantsTotal: 0,
    conventional: createDefaultNationConventionalProfile('army'),
    controlledTerritories: [],
    cyber: {
      ...createDefaultNationCyberProfile(),
      readiness: 70,
      offense: 60,
      detection: 38,
    }
  };

  // Apply doctrine bonuses
  applyDoctrineEffects(playerNation, selectedDoctrine);

  nations.push(playerNation);

  const aiPositions = [
    { lon: 37, lat: 55, name: 'EURASIA' },
    { lon: 116, lat: 40, name: 'EASTASIA' },
    { lon: -60, lat: -15, name: 'SOUTHAM' },
    { lon: 20, lat: 0, name: 'AFRICA' }
  ];

  const doctrineKeys = Object.keys(doctrines) as DoctrineKey[];
  const availableLeaders = leaders.filter(l => l.name !== playerLeaderName);
  const shuffledLeaders = (availableLeaders.length ? availableLeaders : leaders)
    .slice()
    .sort(() => Math.random() - 0.5);

  aiPositions.forEach((pos, i) => {
    const leaderConfig = shuffledLeaders[i % shuffledLeaders.length];
    const aiDoctrine = doctrineKeys.length
      ? doctrineKeys[Math.floor(Math.random() * doctrineKeys.length)]
      : undefined;

    // Balanced starting resources - AI gets similar resources to player
    const nation: LocalNation = {
      id: `ai_${i}`,
      isPlayer: false,
      name: pos.name,
      leader: leaderConfig?.name || `AI_${i}`,
      ai: leaderConfig?.ai || 'balanced',
      doctrine: aiDoctrine,
      lon: pos.lon,
      lat: pos.lat,
      color: leaderConfig?.color || ['#ff0040', '#ff8000', '#40ff00', '#0040ff'][i % 4],
      population: 180 + Math.floor(Math.random() * 50), // Balanced with player (240)
      missiles: 4 + Math.floor(Math.random() * 3), // 4-6 missiles (player has 5)
      bombers: 1 + Math.floor(Math.random() * 2), // 1-2 bombers (player has 2)
      defense: 3 + Math.floor(Math.random() * 2), // 3-4 defense (player has 3)
      instability: Math.floor(Math.random() * 15), // Low initial instability
      morale: 60 + Math.floor(Math.random() * 15),
      publicOpinion: 55 + Math.floor(Math.random() * 20),
      electionTimer: 10 + Math.floor(Math.random() * 6),
      cabinetApproval: 50 + Math.floor(Math.random() * 20),
      production: 20 + Math.floor(Math.random() * 15), // 20-35 production (player has 25)
      uranium: 12 + Math.floor(Math.random() * 8), // 12-20 uranium (player has 15)
      intel: 8 + Math.floor(Math.random() * 8), // 8-16 intel (player has 10)
      cities: 1,
      warheads: { 
        10: 2 + Math.floor(Math.random() * 2), // 2-3 10MT
        20: 1 + Math.floor(Math.random() * 2)  // 1-2 20MT
      },
      researched: { warhead_20: true },
      researchQueue: null,
      treaties: {},
      satellites: {},
      threats: {},
      migrantsThisTurn: 0,
      migrantsTotal: 0,
      conventional: createDefaultNationConventionalProfile(
        i === 1 ? 'navy' : i === 2 ? 'air' : 'army'
      ),
      controlledTerritories: [],
      cyber: {
        ...createDefaultNationCyberProfile(),
        readiness: 55 + Math.floor(Math.random() * 12),
        offense: 52 + Math.floor(Math.random() * 10),
        defense: 48 + Math.floor(Math.random() * 8),
        detection: 30 + Math.floor(Math.random() * 10),
      }
    };

    applyDoctrineEffects(nation, aiDoctrine);
    
    // Initialize threat tracking for all nations
    nations.forEach(existingNation => {
      if (existingNation.id !== nation.id) {
        nation.threats[existingNation.id] = Math.floor(Math.random() * 5);
        existingNation.threats[nation.id] = Math.floor(Math.random() * 5);
      }
    });
    
    nations.push(nation);
  });

  const conventionalState = createDefaultConventionalState(
    nations.map(nation => ({ id: nation.id, isPlayer: nation.isPlayer }))
  );
  S.conventional = conventionalState;

  nations.forEach(nation => {
    const profile = nation.conventional ?? createDefaultNationConventionalProfile();
    const units = Object.values(conventionalState.units).filter(unit => unit.ownerId === nation.id);
    nation.conventional = {
      ...profile,
      reserve: units.filter(unit => unit.status === 'reserve').length,
      deployedUnits: units.filter(unit => unit.status === 'deployed').map(unit => unit.id),
      readiness: profile.readiness,
    };
    nation.controlledTerritories = Object.values(conventionalState.territories)
      .filter(territory => territory.controllingNationId === nation.id)
      .map(territory => territory.id);
  });

  // Initialize AI bio-warfare capabilities
  const difficulty = S.difficulty || 'medium';
  initializeAllAINations(nations, difficulty);

  log('=== GAME START ===', 'success');
  log(`Leader: ${playerLeaderName}`, 'success');
  log(`Doctrine: ${S.selectedDoctrine}`, 'success');

  S.turn = 1;
  S.phase = 'PLAYER';
  S.paused = false;
  S.gameOver = false;
  S.diplomacy = createDefaultDiplomacyState();
  S.actionsRemaining = S.defcon >= 4 ? 1 : S.defcon >= 2 ? 2 : 3;

  updateDisplay();
}

// Banter system - Enhanced to use expanded banter pack
function maybeBanter(nation: Nation, chance: number, pool?: string) {
  if (Math.random() > chance) return;
  
  // Use the expanded banter system if available
  if (typeof window !== 'undefined' && (window as any).banterSay) {
    try {
      // Determine pool based on context if not specified
      if (!pool && nation.ai) {
        pool = nation.ai; // Use AI personality as default pool
      }
      (window as any).banterSay(pool || 'default', nation, 1);
      return;
    } catch (e) {
      // Fallback to basic banter if expanded system fails
    }
  }
  
  // Fallback basic banter messages
  const messages = [
    `${nation.name}: "The world will know our strength!"`,
    `${nation.name}: "This aggression will not stand!"`,
    `${nation.name}: "We are prepared for anything!"`,
    `${nation.name}: "Our resolve is absolute!"`,
    `${nation.name}: "Strategic advantage secured."`,
    `${nation.name}: "Deterrence is our doctrine."`,
  ];
  
  log(messages[Math.floor(Math.random() * messages.length)], 'warning');
}

// Immigration functions
const hasOpenBorders = (nation?: Nation | null) => (nation?.bordersClosedTurns ?? 0) <= 0;

function performImmigration(type: string, target: Nation) {
  const player = PlayerManager.get();
  if (!player || !target) return false;

  if (!hasOpenBorders(target)) {
    const message = `${target.name} has sealed its borders.`;
    log(`Immigration blocked: ${message}`, 'warning');
    toast({ title: 'Borders closed', description: message });
    return false;
  }

  const trackMigrants = (recipient: Nation, amount: number) => {
    if (amount <= 0) return;
    recipient.migrantsThisTurn = (recipient.migrantsThisTurn || 0) + amount;
    recipient.migrantsTotal = (recipient.migrantsTotal || 0) + amount;
  };

  switch (type) {
    case 'skilled':
      if (!canAfford(player, COSTS.immigration_skilled)) break;

      { const amount = Math.max(1, Math.floor(target.population * 0.05));
        if (amount <= 0) break;
        target.population = Math.max(0, target.population - amount);
        player.population += amount;
        target.instability = (target.instability || 0) + 15;
        player.defense = (player.defense || 0) + 1;
        pay(player, COSTS.immigration_skilled);
        trackMigrants(player, amount);
        log(`Skilled immigration: +${amount}M talent from ${target.name}`);
        return true;
      }

    case 'mass':
      if (!canAfford(player, COSTS.immigration_mass)) break;

      { const amount = Math.max(1, Math.floor(target.population * 0.1));
        if (amount <= 0) break;
        target.population = Math.max(0, target.population - amount);
        player.population += amount;
        const instability = 25 + Math.floor(Math.random() * 11);
        target.instability = (target.instability || 0) + instability;
        pay(player, COSTS.immigration_mass);
        trackMigrants(player, amount);
        log(`Mass immigration: ${amount}M resettle from ${target.name} (+${instability} instability)`);
        return true;
      }

    case 'refugee':
      if (!canAfford(player, COSTS.immigration_refugee) || (player.instability || 0) < 50) break;

      { const amount = Math.max(1, Math.floor(target.population * 0.15));
        if (amount <= 0) break;
        target.population = Math.max(0, target.population - amount);
        player.population += amount;
        target.instability = (target.instability || 0) + 40;
        player.instability = Math.max(0, (player.instability || 0) - 20);
        pay(player, COSTS.immigration_refugee);
        trackMigrants(player, amount);
        log(`Refugee wave: ${amount}M flee ${target.name} (your instability -20)`);
        return true;
      }

    case 'brain':
      if (!canAfford(player, COSTS.immigration_brain)) break;

      { const amount = Math.max(1, Math.floor(target.population * 0.03));
        if (amount <= 0) break;
        target.population = Math.max(0, target.population - amount);
        player.population += amount;
        target.instability = (target.instability || 0) + 10;
        pay(player, COSTS.immigration_brain);
        trackMigrants(player, amount);
        log(`Brain drain: +${amount}M skilled workers from ${target.name}`);
        return true;
      }
  }

  return false;
}

// Launch function
function launch(from: Nation, to: Nation, yieldMT: number) {
  if (from.treaties?.[to.id]?.truceTurns > 0) {
    log(`Cannot attack ${to.name} - truce active!`, 'warning');
    return false;
  }
  
  if (yieldMT > 50 && S.defcon > 1) {
    log(`Strategic weapons require DEFCON 1`, 'warning');
    return false;
  }
  
  if (yieldMT <= 50 && S.defcon > 2) {
    log(`Tactical nukes require DEFCON 2 or lower`, 'warning');
    return false;
  }
  
  if (!from.warheads?.[yieldMT] || from.warheads[yieldMT] <= 0) {
    log('No warheads of that yield!', 'warning');
    return false;
  }

  const requiredResearchId = WARHEAD_YIELD_TO_ID.get(yieldMT);
  if (requiredResearchId && !from.researched?.[requiredResearchId]) {
    const projectName = RESEARCH_LOOKUP[requiredResearchId]?.name || `${yieldMT}MT program`;
    if (from.isPlayer) {
      toast({ title: 'Technology unavailable', description: `Research ${projectName} before deploying this warhead.` });
    } else {
      log(`${from.name} lacks the ${projectName} technology and aborts the launch.`, 'warning');
    }
    return false;
  }

  if (from.missiles <= 0) {
    log('No missiles available!', 'warning');
    return false;
  }
  
  from.warheads[yieldMT]--;
  if (from.warheads[yieldMT] <= 0) {
    delete from.warheads[yieldMT];
  }
  from.missiles--;

  S.missiles.push({
    from,
    to,
    t: 0,
    fromLon: from.lon,
    fromLat: from.lat,
    toLon: to.lon,
    toLat: to.lat,
    yield: yieldMT,
    target: to,
    color: from.color
  });

  log(`${from.name} → ${to.name}: LAUNCH ${yieldMT}MT`);
  AudioSys.playSFX('launch');
  DoomsdayClock.tick(0.3);

  // Toast feedback for player launches
  if (from.isPlayer) {
    toast({
      title: '🚀 Missile Launched',
      description: `${yieldMT}MT warhead inbound to ${to.name}. -1 missile, -1 warhead.`,
      variant: 'destructive',
    });
  }
  
  // Generate news for launch
  if ((window as any).__gameAddNewsItem) {
    const priority = yieldMT > 50 ? 'critical' : 'urgent';
    (window as any).__gameAddNewsItem(
      'military',
      `${from.name} launches ${yieldMT}MT warhead at ${to.name}`,
      priority
    );
  }
  
  return true;
}

// Resolution Phase
function resolutionPhase() {
  log('=== RESOLUTION PHASE ===', 'success');
  
  // Update threat levels based on actions
  nations.forEach(attacker => {
    if (attacker.population <= 0) return;
    
    nations.forEach(target => {
      if (target.id === attacker.id || target.population <= 0) return;
      
      // Initialize threats object if needed
      attacker.threats = attacker.threats || {};
      
      // Increase threat if target has attacked us or has large arsenal
      const targetMissiles = target.missiles || 0;
      const targetWarheads = Object.values(target.warheads || {}).reduce((sum, count) => sum + (count || 0), 0);
      
      if (targetMissiles > 10 || targetWarheads > 15) {
        attacker.threats[target.id] = Math.min(100, (attacker.threats[target.id] || 0) + 1);
      }
      
      // Player is always considered a threat
      if (target.isPlayer) {
        attacker.threats[target.id] = Math.min(100, (attacker.threats[target.id] || 0) + 2);
      }
      
      // Decay old threats
      if (attacker.threats[target.id]) {
        attacker.threats[target.id] = Math.max(0, attacker.threats[target.id] - 0.5);
      }
    });
  });
  
  // Missile impacts and effects
  S.missiles.forEach(missile => {
    if (missile.t >= 1) {
      explode(
        project(missile.toLon, missile.toLat)[0],
        project(missile.toLon, missile.toLat)[1],
        missile.target,
        missile.yield
      );
    }
  });
  
  // Clear completed missiles
  S.missiles = S.missiles.filter(m => m.t < 1);
  
  // Process radiation zones
  S.radiationZones.forEach(zone => {
    zone.intensity *= 0.95;

    nations.forEach(n => {
      const [x, y] = project(n.lon, n.lat);
      const dist = Math.hypot(x - zone.x, y - zone.y);
      if (dist < zone.radius) {
        const damage = zone.intensity * 3;
        n.population = Math.max(0, n.population - damage);
      }
    });
  });

  nations.forEach(n => advanceResearch(n, 'RESOLUTION'));

  log('=== RESOLUTION PHASE COMPLETE ===', 'success');
  
  // Nuclear winter effects
  if (S.nuclearWinterLevel && S.nuclearWinterLevel > 0) {
    const winterSeverity = Math.min(S.nuclearWinterLevel / 10, 0.5);
    nations.forEach(n => {
      const popLoss = Math.floor((n.population || 0) * winterSeverity * 0.05);
      if (popLoss > 0) n.population = Math.max(0, (n.population || 0) - popLoss);
      if (typeof n.production === 'number') {
        n.production = Math.max(0, Math.floor(n.production * (1 - winterSeverity)));
      }
    });
    
    if (S.nuclearWinterLevel > 5) {
      log(`☢️ NUCLEAR WINTER! Global population declining!`, 'alert');
      S.overlay = { text: 'NUCLEAR WINTER', ttl: 2000 };
    }
    S.nuclearWinterLevel *= 0.95;
  }
}

// Production Phase
function productionPhase() {
  log('=== PRODUCTION PHASE ===', 'success');
  
  nations.forEach(n => {
    if (n.population <= 0) return;
    
    // Base production - balanced for all nations
    const baseProduction = Math.floor(n.population * 0.12); // Slightly increased
    const baseProd = baseProduction + (n.cities || 1) * 12;
    const baseUranium = Math.floor(n.population * 0.025) + (n.cities || 1) * 4;
    const baseIntel = Math.floor(n.population * 0.04) + (n.cities || 1) * 3;
    
    // Apply green shift debuff if active
    let prodMult = 1;
    let uranMult = 1;
    if (n.greenShiftTurns && n.greenShiftTurns > 0) {
      prodMult = 0.7;
      uranMult = 0.5;
      n.greenShiftTurns--;
      if (n === PlayerManager.get()) {
        log('Eco movement reduces nuclear production', 'warning');
      }
    }

    if (n.environmentPenaltyTurns && n.environmentPenaltyTurns > 0) {
      prodMult *= 0.7;
      uranMult *= 0.7;
      n.environmentPenaltyTurns--;
      if (n.environmentPenaltyTurns === 0 && n.isPlayer) {
        log('Environmental treaty penalties have expired.', 'success');
      }
    }

    // Apply economy tech bonuses
    const economyProdMult = n.productionMultiplier || 1.0;
    const economyUraniumBonus = n.uraniumPerTurn || 0;

    const moraleMultiplier = calculateMoraleProductionMultiplier(n.morale ?? 0);
    n.production += Math.floor(baseProd * prodMult * economyProdMult * moraleMultiplier);
    n.uranium += Math.floor(baseUranium * uranMult * moraleMultiplier) + economyUraniumBonus;
    n.intel += Math.floor(baseIntel * moraleMultiplier);
    
    // Instability effects
    if (n.instability && n.instability > 50) {
      const unrest = Math.floor(n.instability / 10);
      n.population = Math.max(0, n.population - unrest);
      n.production = Math.max(0, n.production - unrest);
      if (n.instability > 100) {
        log(`${n.name} suffers civil war! Major losses!`, 'alert');
        n.population *= 0.8;
        n.instability = 50;
      }
    }
    
    // Decay instability slowly
    if (n.instability) {
      n.instability = Math.max(0, n.instability - 2);
    }
    
    // Border closure effects
    if (n.bordersClosedTurns && n.bordersClosedTurns > 0) {
      n.bordersClosedTurns--;
    }

    if (n.researched?.counterintel) {
      const intelBonus = Math.ceil(baseIntel * 0.2);
      n.intel += intelBonus;
    }
  });

  nations.forEach(n => {
    if (n.coverOpsTurns && n.coverOpsTurns > 0) {
      n.coverOpsTurns = Math.max(0, n.coverOpsTurns - 1);
    }

    if (n.deepRecon) {
      Object.keys(n.deepRecon).forEach(targetId => {
        const remaining = Math.max(0, (n.deepRecon[targetId] || 0) - 1);
        if (remaining <= 0) {
          delete n.deepRecon[targetId];
        } else {
          n.deepRecon[targetId] = remaining;
        }
      });
    }

    if (n.sanctionedBy) {
      Object.keys(n.sanctionedBy).forEach(id => {
        const remaining = Math.max(0, (n.sanctionedBy?.[id] || 0) - 1);
        if (remaining <= 0) {
          if (n.sanctionedBy) {
            delete n.sanctionedBy[id];
          }
        } else if (n.sanctionedBy) {
          n.sanctionedBy[id] = remaining;
        }
      });

      if (n.sanctionedBy && Object.keys(n.sanctionedBy).length === 0) {
        delete n.sanctionedBy;
        n.sanctioned = false;
        delete n.sanctionTurns;
        log(`Sanctions on ${n.name} expired.`, 'success');
      } else if (n.sanctionedBy) {
        n.sanctioned = true;
        n.sanctionTurns = Object.values(n.sanctionedBy).reduce((total, turns) => total + turns, 0);
      }
    } else if (n.sanctionTurns && n.sanctionTurns > 0) {
      n.sanctionTurns--;
      if (n.sanctionTurns <= 0) {
        n.sanctioned = false;
        delete n.sanctionTurns;
        log(`Sanctions on ${n.name} expired.`, 'success');
      }
    }

    if (n.treaties) {
      Object.values(n.treaties).forEach(treaty => {
        if (treaty && typeof treaty.truceTurns === 'number' && treaty.truceTurns > 0) {
          treaty.truceTurns = Math.max(0, treaty.truceTurns - 1);
          if (treaty.truceTurns === 0) {
            delete treaty.truceTurns;
          }
        }
      });
    }

    n.migrantsLastTurn = n.migrantsThisTurn || 0;
    n.migrantsThisTurn = 0;
  });

  nations.forEach(n => advanceResearch(n, 'PRODUCTION'));
}

// World map loading
async function loadWorld() {
  const CACHE_NAME = 'offlineTopo110m';
  
  try {
    const cached = Storage.getItem(CACHE_NAME);
    if (cached) {
      const data = JSON.parse(cached);
      if (data.type === 'Topology' && data.objects) {
        worldData = data;
        worldCountries = feature(data, data.objects.countries || data.objects.land);
        log('World map loaded from cache');
        if (uiUpdateCallback) uiUpdateCallback();
        return;
      } else if (data.type === 'FeatureCollection') {
        worldCountries = data;
        log('World map loaded from cache (GeoJSON)');
        if (uiUpdateCallback) uiUpdateCallback();
        return;
      }
    }
  } catch (e) {
    console.warn('Cache load failed:', e);
  }

  try {
    log('Fetching world map from CDN...');
    const response = await fetch('https://unpkg.com/world-atlas@2/countries-110m.json');
    if (response.ok) {
      const topo = await response.json();
      
      try {
        Storage.setItem(CACHE_NAME, JSON.stringify(topo));
      } catch (e) {
        console.warn('Could not cache map data');
      }
      
      if (topo.objects) {
        worldData = topo;
        worldCountries = feature(topo, topo.objects.countries || topo.objects.land);
        log('World map loaded from CDN');
        if (uiUpdateCallback) uiUpdateCallback();
        return;
      }
    }
  } catch (e) {
    console.warn('CDN fetch failed:', e);
  }

  // Fallback world data
  worldCountries = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { name: "Americas" },
        geometry: {
          type: "Polygon",
          coordinates: [[
            [-170, 70], [-100, 71], [-80, 50], [-75, 25], [-80, 10], [-85, -10],
            [-75, -30], [-70, -55], [-75, -55], [-80, -30], [-85, -10], [-95, 0],
            [-105, 20], [-120, 35], [-130, 40], [-140, 50], [-160, 60], [-170, 70]
          ]]
        }
      },
      {
        type: "Feature",
        properties: { name: "Eurasia" },
        geometry: {
          type: "Polygon",
          coordinates: [[
            [-10, 35], [0, 40], [10, 45], [30, 50], [50, 55], [80, 60], [120, 65],
            [140, 60], [160, 55], [170, 60], [180, 65], [180, 70], [140, 75],
            [80, 75], [20, 70], [-10, 60], [-10, 35]
          ]]
        }
      }
    ]
  };

  log('Using fallback continent outlines');
  if (uiUpdateCallback) uiUpdateCallback();
}

// Drawing functions
function project(lon: number, lat: number): [number, number] {
  if (globeProjector) {
    const { x, y } = globeProjector(lon, lat);
    return [x, y];
  }

  const x = ((lon + 180) / 360) * W * cam.zoom + cam.x;
  const y = ((90 - lat) / 180) * H * cam.zoom + cam.y;
  return [x, y];
}

// Convert screen coordinates to longitude/latitude
function toLonLat(x: number, y: number): [number, number] {
  if (globePicker) {
    const hit = globePicker(x, y);
    if (hit) {
      return [hit.lon, hit.lat];
    }
  }

  // Account for camera transformation
  const adjustedX = (x - cam.x) / cam.zoom;
  const adjustedY = (y - cam.y) / cam.zoom;
  const lon = (adjustedX / W) * 360 - 180;
  const lat = 90 - (adjustedY / H) * 180;
  return [lon, lat];
}

const POLITICAL_COLOR_PALETTE = [
  '#f94144',
  '#f3722c',
  '#f9c74f',
  '#90be6d',
  '#43aa8b',
  '#577590',
  '#f9844a',
  '#ffafcc'
];

function getPoliticalFill(index: number) {
  return POLITICAL_COLOR_PALETTE[index % POLITICAL_COLOR_PALETTE.length];
}

function drawWorld(style: MapStyle) {
  if (!ctx) return;

  const palette = THEME_SETTINGS[currentTheme];

  const isPolitical = style === 'political';
  const isNight = style === 'night';
  const isWireframe = style === 'wireframe';
  const isFlatRealistic = style === 'flat-realistic';

  if (isFlatRealistic) {
    if (!flatRealisticTexture && !flatRealisticTexturePromise) {
      void preloadFlatRealisticTexture();
    }
    if (flatRealisticTexture) {
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(flatRealisticTexture, cam.x, cam.y, W * cam.zoom, H * cam.zoom);
      ctx.restore();
    }
  }

  if (worldCountries) {
    ctx.save();
    ctx.lineWidth = isWireframe ? 1.5 : 1;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    worldCountries.features.forEach((feature: any, index: number) => {
      ctx.beginPath();
      const coords = feature.geometry.coordinates;

      if (feature.geometry.type === 'Polygon') {
        drawWorldPath(coords[0]);
      } else if (feature.geometry.type === 'MultiPolygon') {
        coords.forEach((poly: any) => drawWorldPath(poly[0]));
      }

      if (isPolitical) {
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = getPoliticalFill(index);
        ctx.fill();
        ctx.restore();
      }

      if (isNight) {
        ctx.strokeStyle = 'rgba(170,210,255,0.35)';
      } else if (isWireframe) {
        ctx.strokeStyle = 'rgba(80,240,255,0.75)';
      } else if (isPolitical) {
        ctx.strokeStyle = 'rgba(40,40,40,0.5)';
      } else if (isFlatRealistic) {
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      } else {
        ctx.strokeStyle = palette.mapOutline;
      }

      ctx.stroke();
    });

    ctx.restore();
  }

  const shouldDrawGrid = style !== 'realistic' && style !== 'night';
  if (shouldDrawGrid) {
    ctx.save();
    if (isWireframe) {
      ctx.strokeStyle = 'rgba(80,240,255,0.35)';
      ctx.lineWidth = 0.7;
    } else if (isPolitical) {
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 0.5;
    } else {
      ctx.strokeStyle = palette.grid;
      ctx.lineWidth = 0.5;
    }

    for (let lon = -180; lon <= 180; lon += 30) {
      ctx.beginPath();
      for (let lat = -90; lat <= 90; lat += 5) {
        const [x, y] = project(lon, lat);
        if (lat === -90) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    for (let lat = -90; lat <= 90; lat += 30) {
      ctx.beginPath();
      for (let lon = -180; lon <= 180; lon += 5) {
        const [x, y] = project(lon, lat);
        if (lon === -180) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  if (style !== 'wireframe') {
    const scanY = (Date.now() / 30) % H;
    if (isNight) {
      ctx.fillStyle = 'rgba(80,160,255,0.08)';
    } else if (isPolitical) {
      ctx.fillStyle = 'rgba(255,200,120,0.12)';
    } else {
      ctx.fillStyle = palette.radar;
    }
    ctx.fillRect(0, scanY, W, 2);
  }
}

function drawWorldPath(coords: number[][]) {
  if (!ctx) return;
  coords.forEach((coord, i) => {
    const [x, y] = project(coord[0], coord[1]);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
}

function drawNations(style: MapStyle) {
  if (!ctx || nations.length === 0) return;

  const isWireframeStyle = style === 'wireframe';
  const isNightStyle = style === 'night';
  const isPoliticalStyle = style === 'political';

  nations.forEach(n => {
    if (n.population <= 0) return;

    const [x, y] = project(n.lon, n.lat);
    if (isNaN(x) || isNaN(y)) return;

    const isSelectedTarget = selectedTargetRefId === n.id;
    if (isSelectedTarget) {
      const pulse = (Math.sin(Date.now() / 200) + 1) / 2;
      const baseRadius = 42;
      const radius = baseRadius + pulse * 10;

      ctx.save();
      const targetColor = isWireframeStyle ? '#4ef6ff' : (n.color || '#ff6666');
      ctx.strokeStyle = targetColor;
      ctx.globalAlpha = isWireframeStyle ? 0.9 : 0.85;
      ctx.lineWidth = isWireframeStyle ? 1.5 : 2;
      ctx.setLineDash(isWireframeStyle ? [4, 6] : [6, 6]);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = isWireframeStyle ? 0.35 : 0.4;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(x, y, radius + 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Nation marker (triangle)
    ctx.save();
    ctx.strokeStyle = n.color;
    ctx.lineWidth = isWireframeStyle ? 1.5 : 2;
    if (isWireframeStyle) {
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(x, y - 18);
      ctx.lineTo(x - 14, y + 14);
      ctx.lineTo(x + 14, y + 14);
      ctx.closePath();
      ctx.stroke();
    } else {
      ctx.fillStyle = n.color;
      ctx.shadowColor = isNightStyle ? '#ffe066' : n.color;
      ctx.shadowBlur = isNightStyle ? 25 : 20;
      ctx.beginPath();
      ctx.moveTo(x, y - 20);
      ctx.lineTo(x - 15, y + 12);
      ctx.lineTo(x + 15, y + 12);
      ctx.closePath();
      ctx.stroke();
      ctx.globalAlpha = isPoliticalStyle ? 0.4 : 0.3;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // Draw city squares around nation
    const cityCount = n.cities || 1;
    if (cityCount > 1) {
      ctx.save();
      for (let i = 1; i < cityCount; i++) {
        const angle = (i / (cityCount - 1)) * Math.PI * 2;
        const radius = 35 + (i % 3) * 8;
        const cx = x + Math.cos(angle) * radius;
        const cy = y + Math.sin(angle) * radius;

        if (isWireframeStyle) {
          ctx.strokeStyle = n.color;
          ctx.globalAlpha = 0.6;
          ctx.strokeRect(cx - 5, cy - 5, 10, 10);
        } else {
          ctx.fillStyle = n.color;
          ctx.globalAlpha = isNightStyle ? 0.5 : 0.3;
          ctx.fillRect(cx - 6, cy - 6, 12, 12);
        }
      }
      ctx.restore();
    }

    // Nation labels
    const displayName = n.isPlayer
      ? (S.playerName || S.selectedLeader || 'PLAYER')
      : (n.leader || n.name);
    const nationName = n.name;

    const z = Math.max(0.9, Math.min(1.6, cam.zoom));
    const pad = 4 * z;

    ctx.save();
    ctx.textAlign = 'center';

    ctx.font = `bold ${Math.round(12 * z)}px monospace`;
    const w1 = ctx.measureText(displayName).width;

    ctx.font = `${Math.round(11 * z)}px monospace`;
    const w2 = ctx.measureText(nationName).width;

    const bw = Math.max(w1, w2) + pad * 2;
    const bh = (12 * z + 12 * z) + pad * 2;
    const lx = x;
    const lyTop = (y - 36 * z) - (bh - (12 * z));

    const frameFill = isWireframeStyle
      ? 'rgba(0,0,0,0.7)'
      : isNightStyle
        ? 'rgba(0,0,0,0.6)'
        : 'rgba(0,0,0,0.45)';
    ctx.fillStyle = frameFill;
    ctx.fillRect(lx - bw / 2, lyTop, bw, bh);

    ctx.globalAlpha = isWireframeStyle ? 0.65 : 0.4;
    ctx.strokeStyle = isWireframeStyle ? '#4ef6ff' : n.color;
    ctx.strokeRect(lx - bw / 2, lyTop, bw, bh);
    ctx.globalAlpha = 1;

    ctx.font = `bold ${Math.round(12 * z)}px monospace`;
    ctx.fillStyle = isWireframeStyle ? '#4ef6ff' : n.color;
    ctx.shadowColor = isNightStyle ? '#ffe066' : n.color;
    ctx.shadowBlur = isNightStyle ? 10 : 6;
    ctx.fillText(displayName, lx, lyTop + pad + 12 * z);
    ctx.shadowBlur = 0;

    ctx.font = `${Math.round(11 * z)}px monospace`;
    ctx.fillStyle = isPoliticalStyle ? '#ffecd1' : '#ffffff';
    ctx.fillText(nationName, lx, lyTop + pad + 12 * z + 12 * z);

    ctx.restore();

    // Population display
    ctx.save();
    ctx.fillStyle = isWireframeStyle ? '#4ef6ff' : isPoliticalStyle ? '#ffd166' : '#00ff00';
    ctx.font = `${Math.round(10 * z)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.floor(n.population)}M`, x, y + 30 * z);
    ctx.restore();
  });
}

type DrawIconOptions = {
  alpha?: number;
};

function drawIcon(
  icon: CanvasIcon,
  x: number,
  y: number,
  angle: number,
  baseScale: number,
  options?: DrawIconOptions
) {
  if (!ctx || !icon || !icon.complete || icon.naturalWidth === 0 || icon.naturalHeight === 0) {
    return;
  }

  ctx.save();

  if (options?.alpha !== undefined) {
    ctx.globalAlpha *= options.alpha;
  }

  ctx.translate(x, y);
  ctx.rotate(angle);

  const zoomScale = Math.max(0.7, Math.min(1.5, cam.zoom));
  const width = icon.naturalWidth || icon.width || 1;
  const height = icon.naturalHeight || icon.height || 1;
  const scale = baseScale * zoomScale;
  const drawWidth = width * scale;
  const drawHeight = height * scale;

  ctx.drawImage(icon, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  ctx.restore();
}

function drawSatelliteIcon(x: number, y: number, rotation: number) {
  if (!ctx) {
    return;
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);

  ctx.fillStyle = 'rgba(210,240,255,0.92)';
  ctx.fillRect(-5, -2.5, 10, 5);

  ctx.fillStyle = 'rgba(130,210,255,0.9)';
  ctx.fillRect(-12, -1.5, 5, 3);
  ctx.fillRect(7, -1.5, 5, 3);

  ctx.beginPath();
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.arc(0, 0, 2.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawSatellites(nowMs: number) {
  if (!ctx) {
    return;
  }

  const orbits = S.satelliteOrbits ?? [];
  if (orbits.length === 0) {
    return;
  }

  const activeOrbits: SatelliteOrbit[] = [];
  const player = PlayerManager.get();

  orbits.forEach(orbit => {
    const targetNation = nations.find(nation => nation.id === orbit.targetId);
    if (!targetNation) {
      return;
    }

    const owner =
      player && player.id === orbit.ownerId
        ? player
        : nations.find(nation => nation.id === orbit.ownerId) ?? null;

    const ttlExpired = nowMs - orbit.startedAt > orbit.ttl;
    const hasCoverage = !!owner?.satellites?.[orbit.targetId];

    if (ttlExpired || !hasCoverage) {
      return;
    }

    activeOrbits.push(orbit);

    const [targetX, targetY] = project(targetNation.lon, targetNation.lat);
    if (!Number.isFinite(targetX) || !Number.isFinite(targetY)) {
      return;
    }

    const elapsed = nowMs - orbit.startedAt;
    const angle = orbit.phaseOffset + SATELLITE_ORBIT_SPEED * elapsed * orbit.direction;
    const satelliteX = targetX + Math.cos(angle) * SATELLITE_ORBIT_RADIUS;
    const satelliteY = targetY + Math.sin(angle) * SATELLITE_ORBIT_RADIUS;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(120,220,255,0.45)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(targetX, targetY, SATELLITE_ORBIT_RADIUS, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    const glowPulse = 0.55 + 0.35 * Math.sin(nowMs / 320 + orbit.phaseOffset);
    ctx.globalAlpha = glowPulse * 0.6;
    ctx.fillStyle = 'rgba(100,200,255,1)';
    ctx.beginPath();
    ctx.arc(satelliteX, satelliteY, 6 + glowPulse * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawSatelliteIcon(satelliteX, satelliteY, angle);
  });

  S.satelliteOrbits = activeOrbits;
}

function registerSatelliteOrbit(ownerId: string, targetId: string) {
  const now = Date.now();
  S.satelliteOrbits = S.satelliteOrbits ?? [];

  const existing = S.satelliteOrbits.find(orbit => orbit.ownerId === ownerId && orbit.targetId === targetId);
  if (existing) {
    existing.startedAt = now;
    existing.ttl = SATELLITE_ORBIT_TTL_MS;
    existing.phaseOffset = Math.random() * Math.PI * 2;
    existing.direction = Math.random() < 0.5 ? 1 : -1;
    return;
  }

  S.satelliteOrbits.push({
    ownerId,
    targetId,
    startedAt: now,
    ttl: SATELLITE_ORBIT_TTL_MS,
    phaseOffset: Math.random() * Math.PI * 2,
    direction: Math.random() < 0.5 ? 1 : -1,
  });
}

function drawMissiles() {
  if (!ctx) return;

  S.missiles.forEach((m: any, i: number) => {
    m.t = Math.min(1, m.t + 0.016);
    
    const [sx, sy] = project(m.fromLon, m.fromLat);
    const [tx, ty] = project(m.toLon, m.toLat);
    
    const u = 1 - m.t;
    const cx = (sx + tx) / 2;
    const cy = (sy + ty) / 2 - 150;
    const x = u * u * sx + 2 * u * m.t * cx + m.t * m.t * tx;
    const y = u * u * sy + 2 * u * m.t * cy + m.t * m.t * ty;
    const derivativeX = 2 * u * (cx - sx) + 2 * m.t * (tx - cx);
    const derivativeY = 2 * u * (cy - sy) + 2 * m.t * (ty - cy);
    const heading = Math.atan2(derivativeY, derivativeX);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // Trajectory path
    ctx.strokeStyle = m.color || 'rgba(255,0,255,0.9)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.lineDashOffset = -(Date.now() / 60) % 100;
    ctx.shadowColor = typeof ctx.strokeStyle === 'string' ? ctx.strokeStyle : '#ff00ff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(cx, cy, tx, ty);
    ctx.stroke();
    ctx.setLineDash([]);

    // Missile glow and icon
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    drawIcon(missileIcon, x, y, heading, MISSILE_ICON_BASE_SCALE);
    ctx.restore();
    
    // Incoming warning
    if (!m._tele && m.t > 0.8) {
      m._tele = true;
      S.rings.push({
        x: tx, y: ty, r: 2, max: 60 * (S.fx || 1), 
        speed: 3, alpha: 1, type: 'incoming', txt: 'INCOMING'
      });
    }

    // Impact
    if (m.t >= 1) {
      // MIRV split check
      const mirvChance = getMirvSplitChance(m.from, !!m.isMirv);
      if (mirvChance > 0 && Math.random() < mirvChance) {
        log(`MIRV ACTIVATED! Multiple warheads deployed`, 'warning');
        const splitYield = Math.floor(m.yield / 3);
        for (let j = 0; j < 2; j++) {
          setTimeout(() => {
            const offsetLon = m.toLon + (Math.random() - 0.5) * 5;
            const offsetLat = m.toLat + (Math.random() - 0.5) * 5;
            S.missiles.push({
              from: m.from,
              to: m.target,
              t: 0,
              fromLon: m.fromLon,
              fromLat: m.fromLat,
              toLon: offsetLon,
              toLat: offsetLat,
              yield: splitYield,
              target: m.target,
              color: '#ffff00',
              isMirv: true
            });
          }, j * 200);
        }
      }
      
      // Interception check
      if (m.t >= 0.95 && !m.interceptChecked) {
        m.interceptChecked = true;
        const allies = nations.filter(n => n.treaties?.[m.target.id]?.alliance && n.defense > 0);
        let totalIntercept = (m.target.defense || 0) / 16;
        allies.forEach(ally => {
          const allyIntercept = (ally.defense || 0) / 32;
          totalIntercept += allyIntercept;
          if (Math.random() < allyIntercept) {
            log(`${ally.name} helps defend ${m.target.name}!`, 'success');
          }
        });
        
        if (Math.random() < totalIntercept) {
          S.missiles.splice(i, 1);
          log(`Missile intercepted! Defense successful`, 'success');
          S.rings.push({ x: tx, y: ty, r: 1, max: 40, speed: 3, alpha: 1, type: 'intercept' });
          return;
        }
      }
      
      explode(tx, ty, m.target, m.yield);
      S.missiles.splice(i, 1);
    }
  });
}

function drawBombers() {
  if (!ctx) return;
  
  S.bombers.forEach((bomber: any, i: number) => {
    bomber.t += 0.016 / 3;
    
    // Detection at midpoint
    if (bomber.t > 0.5 && !bomber.detected && bomber.to) {
      bomber.detected = true;
      log(`⚠️ BOMBER DETECTED approaching ${bomber.to.name}!`, 'warning');
      
      // Intercept chance
      const interceptChance = calculateBomberInterceptChance(bomber.to.defense, bomber.from);
      
      if (Math.random() < interceptChance) {
        log(`✓ Bomber intercepted by ${bomber.to.name}!`, 'success');
        S.bombers.splice(i, 1);
        AudioSys.playSFX('explosion');
        return;
      }
    }
    
    const x = bomber.sx + (bomber.tx - bomber.sx) * bomber.t;
    const y = bomber.sy + (bomber.ty - bomber.sy) * bomber.t;
    
    const dx = bomber.tx - bomber.sx;
    const dy = bomber.ty - bomber.sy;
    const angle = Math.atan2(dy, dx);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(255,255,160,0.3)';
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawIcon(bomberIcon, x, y, angle, BOMBER_ICON_BASE_SCALE);

    if (bomber.t >= 1.0) {
      explode(bomber.tx, bomber.ty, bomber.to, bomber.payload.yield);
      S.bombers.splice(i, 1);
    }
  });
}

function drawSubmarines() {
  if (!ctx) return;

  S.submarines = S.submarines || [];
  S.submarines.forEach((sub: any, i: number) => {
    const targetX = typeof sub.targetX === 'number' ? sub.targetX : sub.x;
    const targetY = typeof sub.targetY === 'number' ? sub.targetY : sub.y;
    const angle = Math.atan2(targetY - sub.y, targetX - sub.x);

    if (sub.phase === 0) {
      // Surfacing
      sub.phaseProgress = Math.min(1, (sub.phaseProgress || 0) + 0.03);
      const p = sub.phaseProgress;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = `rgba(100,200,255,${1 - p})`;
      ctx.beginPath();
      ctx.arc(sub.x, sub.y, 30 * p, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      drawIcon(submarineIcon, sub.x, sub.y + (1 - p) * 10, angle, SUBMARINE_ICON_BASE_SCALE, { alpha: p });
      if (p >= 1) {
        sub.phase = 1;
        // Launch missile
        const missile = {
          from: sub.from || null,
          to: sub.target,
          t: 0.5,
          fromLon: 0,
          fromLat: 0,
          toLon: sub.target.lon,
          toLat: sub.target.lat,
          yield: sub.yield,
          target: sub.target,
          color: '#00ffff',
          isSubmarine: true
        };
        S.missiles.push(missile);
        log(`SUBMARINE LAUNCH! Missile away!`, 'alert');
      }
    } else if (sub.phase === 1) {
      sub.phase = 2;
    } else if (sub.phase === 2) {
      sub.diveProgress = (sub.diveProgress || 0) + 0.02;
      const diveAlpha = Math.max(0, 1 - sub.diveProgress);
      drawIcon(submarineIcon, sub.x, sub.y + sub.diveProgress * 10, angle, SUBMARINE_ICON_BASE_SCALE, { alpha: diveAlpha });
      if (sub.diveProgress >= 1) {
        S.submarines.splice(i, 1);
      }
    }
  });
}

function drawConventionalForces() {
  if (!ctx) return;

  const movements = S.conventionalMovements ?? [];
  const nextMovements: ConventionalMovementMarker[] = [];

  movements.forEach((movement) => {
    const [sx, sy] = project(movement.startLon, movement.startLat);
    const [ex, ey] = project(movement.endLon, movement.endLat);
    const dx = ex - sx;
    const dy = ey - sy;
    const distance = Math.hypot(dx, dy);
    const nation = getNationById(movement.ownerId);
    const color = nation?.color ?? '#38bdf8';

    if (distance > 4) {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.restore();
    }

    movement.progress = Math.min(1, movement.progress + movement.speed);
    const eased = easeInOutQuad(movement.progress);
    const x = sx + dx * eased;
    const y = sy + dy * eased;
    const angle = Math.atan2(dy, dx);

    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawIcon(
      movement.icon ?? conventionalIconLookup[movement.forceType],
      x,
      y,
      angle,
      CONVENTIONAL_ICON_BASE_SCALE[movement.forceType],
      { alpha: 0.95 },
    );

    if (movement.progress < 1) {
      nextMovements.push(movement);
    }
  });

  S.conventionalMovements = nextMovements;

  const unitMarkers = S.conventionalUnits ?? [];
  unitMarkers.forEach((marker) => {
    const [x, y] = project(marker.lon, marker.lat);
    const nation = getNationById(marker.ownerId);
    const color = nation?.color ?? '#22d3ee';

    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = 'rgba(8,15,32,0.78)';
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.restore();

    drawIcon(
      marker.icon ?? conventionalIconLookup[marker.forceType],
      x,
      y,
      0,
      CONVENTIONAL_ICON_BASE_SCALE[marker.forceType],
    );
  });
}

function drawParticles() {
  if (!ctx) return;

  S.particles = S.particles.filter((p: any) => {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 16;
    p.vx *= 0.98;
    p.vy *= 0.98;
    
    if (p.life <= 0) return false;
    
    const a = p.life / p.max;
    
    ctx.save();
    if (p.type === 'smoke') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = a * 0.6;
      ctx.fillStyle = `rgba(180,180,180,${a * 0.6})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'spark') {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = a;
      const g = 150 + Math.floor(Math.random() * 80);
      ctx.fillStyle = `rgba(255,${g},50,${a * 0.9})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'mushroom-stem') {
      // Rising column of the mushroom cloud
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = a * 0.8;
      const sz = 4 + (1 - a) * 3;
      ctx.fillStyle = `rgba(255,120,60,${a * 0.8})`;
      ctx.fillRect(p.x - sz / 2, p.y - sz / 2, sz, sz);
    } else if (p.type === 'mushroom-cap') {
      // Mushroom cloud cap
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = a * 0.7;
      const sz = 5 + (1 - a) * 4;
      ctx.fillStyle = `rgba(200,100,50,${a * 0.7})`;
      ctx.shadowColor = 'rgba(255,100,30,0.5)';
      ctx.shadowBlur = 8;
      ctx.fillRect(p.x - sz / 2, p.y - sz / 2, sz, sz);
    } else if (p.type === 'blast') {
      // Ground blast particles
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = a * 0.9;
      ctx.fillStyle = `rgba(255,180,80,${a * 0.9})`;
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    } else {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = a;
      ctx.fillStyle = `rgba(255,255,100,${a * 0.9})`;
      ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
    }
    ctx.restore();

    return true;
  });
}

function drawFX() {
  if (!ctx) return;
  
  if (S.screenShake && S.screenShake > 0) {
    const shakeX = (Math.random() - 0.5) * S.screenShake;
    const shakeY = (Math.random() - 0.5) * S.screenShake;
    ctx.save();
    ctx.translate(shakeX, shakeY);
    S.screenShake *= 0.9;
  }
  
  // Rings and explosions
  S.rings = S.rings || [];
  S.rings.forEach((b: any, i: number) => {
    b.r += b.speed || 2;
    const a = (1 - b.r / b.max) * (b.alpha || 1);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    let col = `rgba(255,121,198,${a})`;
    if (b.type === 'shock') col = `rgba(255,170,90,${a})`;
    if (b.type === 'heat') col = `rgba(255,120,60,${a})`;
    if (b.type === 'incoming') col = `rgba(255,255,255,${a})`;
    if (b.type === 'afterglow') col = `rgba(255,255,200,${a})`;
    if (b.type === 'sonar') col = `rgba(100,255,255,${a})`;
    if (b.type === 'flash') col = `rgba(255,255,255,${a})`;
    if (b.type === 'plasma') col = `rgba(255,70,180,${a})`;
    ctx.strokeStyle = col;
    ctx.lineWidth = b.type === 'flash' ? 4 : 3;
    let rx = typeof b.x === 'number' ? b.x : 0;
    let ry = typeof b.y === 'number' ? b.y : 0;
    if (b.lon !== undefined && b.lat !== undefined) {
      const projected = project(b.lon, b.lat);
      rx = projected[0];
      ry = projected[1];
    }
    ctx.beginPath();
    ctx.arc(rx, ry, b.r, 0, Math.PI * 2);
    ctx.stroke();
    if (b.txt) {
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(b.txt, rx, ry - 12);
    }
    ctx.restore();
    if (b.r >= b.max) S.rings.splice(i, 1);
  });
  
  // Radiation zones
  S.radiationZones.forEach((zone: any, i: number) => {
    if (zone.intensity < 0.01) {
      S.radiationZones.splice(i, 1);
      return;
    }
    
    ctx.save();
    const pulse = Math.sin(Date.now() / 500) * 0.2 + 0.8;
    ctx.globalCompositeOperation = 'screen';
    
    const grad = ctx.createRadialGradient(zone.x, zone.y, 0, zone.x, zone.y, zone.radius);
    grad.addColorStop(0, `rgba(150,255,0,${zone.intensity * 0.3 * pulse})`);
    grad.addColorStop(1, `rgba(255,100,0,0)`);
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
  
  // EMP effects
  S.empEffects.forEach((emp: any, i: number) => {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const g = ctx.createRadialGradient(emp.x, emp.y, 0, emp.x, emp.y, emp.radius);
    g.addColorStop(0, `rgba(100,200,255,${(emp.duration / 30) * 0.3})`);
    g.addColorStop(1, 'rgba(100,200,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(emp.x, emp.y, emp.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    emp.duration--;
    if (emp.duration <= 0) {
      S.empEffects.splice(i, 1);
      return;
    }
    
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    
    const arcs = 5;
    for (let j = 0; j < arcs; j++) {
      const angle = (Date.now() / 100 + j * Math.PI * 2 / arcs) % (Math.PI * 2);
      const x2 = emp.x + Math.cos(angle) * emp.radius;
      const y2 = emp.y + Math.sin(angle) * emp.radius;
      
      ctx.strokeStyle = `rgba(100,200,255,${emp.duration / 30})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(emp.x, emp.y);
      
      const segments = 8;
      for (let k = 1; k <= segments; k++) {
        const t = k / segments;
        const mx = emp.x + (x2 - emp.x) * t + (Math.random() - 0.5) * 20;
        const my = emp.y + (y2 - emp.y) * t + (Math.random() - 0.5) * 20;
        ctx.lineTo(mx, my);
      }
      ctx.stroke();
    }
    
    ctx.restore();
  });
  
  // Overlay text
  if (S.overlay && S.overlay.ttl > 0) {
    S.overlay.ttl -= 16;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 28px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 4;
    ctx.strokeText(S.overlay.text, W / 2, 80);
    ctx.fillText(S.overlay.text, W / 2, 80);
    ctx.restore();
    if (S.overlay.ttl <= 0) S.overlay = null;
  }

  if (S.screenShake) {
    ctx.restore();
  }

  // Nuclear winter overlay
  if (S.nuclearWinterLevel && S.nuclearWinterLevel > 1) {
    ctx.save();
    ctx.fillStyle = `rgba(50,50,50,${Math.min(S.nuclearWinterLevel / 20, 0.4)})`;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}

// Explosion function
function explode(x: number, y: number, target: Nation, yieldMT: number) {
  AudioSys.playSFX('explosion');
  
  const scale = Math.sqrt(yieldMT / 20);
  const particleCount = Math.floor(100 * scale);
  
  const blastRadius = Math.sqrt(yieldMT) * 10;
  const destroyed = CityLights.destroyNear(x, y, blastRadius);
  if (destroyed > 0) {
    log(`💡 ${destroyed} cities went dark`, 'warning');
  }
  
  if (target && !target.isPlayer) {
    maybeBanter(target, 0.7);
  }

  const [elon, elat] = toLonLat(x, y);

  // Create mushroom cloud particles
  const mushroomStemHeight = 20 * scale;
  const mushroomCapRadius = 12 * scale;
  
  // Stem particles (rising column)
  for (let i = 0; i < particleCount * 0.4; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * 3 * scale;
    S.particles.push({
      x: x + Math.cos(a) * r,
      y: y,
      vx: (Math.random() - 0.5) * 0.3 * scale,
      vy: -1.5 - Math.random() * 1.5,
      life: 600 + Math.random() * 400,
      max: 1000,
      type: 'mushroom-stem'
    });
  }
  
  // Cap particles (mushroom top)
  for (let i = 0; i < particleCount * 0.3; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * mushroomCapRadius;
    S.particles.push({
      x: x + Math.cos(a) * r * 0.3,
      y: y - mushroomStemHeight,
      vx: Math.cos(a) * (0.8 + Math.random() * 0.7),
      vy: -0.2 + Math.random() * 0.4,
      life: 800 + Math.random() * 600,
      max: 1400,
      type: 'mushroom-cap'
    });
  }
  
  // Ground blast particles
  for (let i = 0; i < particleCount * 0.3; i++) {
    const a = Math.random() * Math.PI * 2;
    const speed = (2 + Math.random() * 4) * scale;
    S.particles.push({
      x, y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed * 0.3,
      life: 400 + Math.random() * 300,
      max: 700,
      type: 'blast'
    });
  }

  S.rings.push({ lon: elon, lat: elat, r: 3, max: 120 * scale * (S.fx || 1), speed: 2, alpha: 1, type: 'shock' });
  S.rings.push({ lon: elon, lat: elat, r: 1, max: 40 * (S.fx || 1), speed: 1.5, alpha: 0.8, type: 'heat' });
  S.rings.push({ lon: elon, lat: elat, r: 2, max: 80 * scale * (S.fx || 1), speed: 2.5, alpha: 0.9, type: 'flash' });
  S.rings.push({ lon: elon, lat: elat, r: 4, max: 100 * scale * (S.fx || 1), speed: 1.5, alpha: 0.7, type: 'plasma' });

  const sparkCount = Math.floor(50 * scale);
  for (let j = 0; j < sparkCount; j++) {
    const a2 = Math.random() * Math.PI * 2;
    const spd = (0.5 + Math.random() * 2.5) * scale;
    S.particles.push({
      x, y,
      vx: Math.cos(a2) * spd,
      vy: Math.sin(a2) * spd,
      life: 300 + Math.random() * 300,
      max: 600,
      type: 'spark'
    });
  }

  S.radiationZones.push({
    x, y,
    radius: Math.sqrt(yieldMT) * 8,
    intensity: yieldMT / 100
  });

  // Nuclear winter accumulation
  if (yieldMT >= 50) {
    S.nuclearWinterLevel = (S.nuclearWinterLevel || 0) + (yieldMT || 0) / 100;
    S.globalRadiation = (S.globalRadiation || 0) + (yieldMT || 0) / 200;
  }

  if (yieldMT >= 50) {
    // Mushroom smoke
    for (let s = 0; s < 20 * (S.fx || 1); s++) {
      const ang = Math.random() * Math.PI * 2;
      const rad = Math.random() * 8;
      S.particles.push({
        x: x + Math.cos(ang) * rad,
        y: y + Math.sin(ang) * rad,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.6 - Math.random() * 0.4,
        life: 900 + Math.random() * 600,
        max: 1500,
        type: 'smoke'
      });
    }

    S.empEffects.push({
      x, y,
      radius: Math.sqrt(yieldMT) * 15,
      duration: 30
    });
    
    nations.forEach(n => {
      const [nx, ny] = project(n.lon, n.lat);
      const dist = Math.hypot(nx - x, ny - y);
      if (dist < Math.sqrt(yieldMT) * 15) {
        n.defense = Math.max(0, n.defense - 3);
        n.missiles = Math.max(0, n.missiles - 2);
        log(`⚡ EMP disabled ${n.name}'s electronics!`, 'warning');
      }
    });
  }

  S.screenShake = Math.max(S.screenShake || 0, Math.min(20, yieldMT / 5));
  
  if (target) {
    const reduction = Math.max(0, 1 - target.defense * 0.05);
    const damage = yieldMT * reduction;
    target.population = Math.max(0, target.population - damage);
    target.instability = Math.min(100, (target.instability || 0) + yieldMT);
    
    log(`💥 ${yieldMT}MT detonation at ${target.name}! -${Math.floor(damage)}M`, "alert");
    
    if (yieldMT >= 50) {
      DoomsdayClock.tick(0.5);
    }
  }
  
  checkVictory();
}

// Launch submarine
function launchSubmarine(from: Nation, to: Nation, yieldMT: number) {
  const [fx, fy] = project(from.lon, from.lat);
  const [tx, ty] = project(to.lon, to.lat);
  S.submarines = S.submarines || [];
  S.submarines.push({
    x: fx + (Math.random() - 0.5) * 50,
    y: fy + (Math.random() - 0.5) * 50,
    phase: 0, // 0=surfacing,1=launching,2=diving
    targetX: tx,
    targetY: ty,
    yield: yieldMT,
    target: to,
    from
  });
  AudioSys.playSFX('launch');

  if (from.isPlayer) {
    toast({
      title: '🌊 Submarine Launched',
      description: `SLBM strike inbound to ${to.name}. ${yieldMT}MT warhead deployed.`,
      variant: 'destructive',
    });
  }

  return true;
}

// Launch bomber
function launchBomber(from: Nation, to: Nation, payload: any) {
  const [sx, sy] = project(from.lon, from.lat);
  const [tx, ty] = project(to.lon, to.lat);

  S.bombers.push({
    from, to,
    t: 0,
    sx, sy, tx, ty,
    payload
  });

  if (from.isPlayer) {
    toast({
      title: '✈️ Bomber Dispatched',
      description: `Strategic bomber en route to ${to.name}. Payload armed.`,
      variant: 'destructive',
    });
  }

  return true;
}

function createDefaultDiplomacyState(): DiplomacyState {
  return {
    peaceTurns: 0,
    lastEvaluatedTurn: 0,
    allianceRatio: 0,
    influenceScore: 0,
    nearVictoryNotified: false,
    victoryAnnounced: false
  };
}

function ensureDiplomacyState(): DiplomacyState {
  if (!S.diplomacy) {
    S.diplomacy = createDefaultDiplomacyState();
  }
  return S.diplomacy;
}

function evaluateDiplomaticProgress(player: Nation) {
  const diplomacy = ensureDiplomacyState();
  const aliveNations = nations.filter(n => n.population > 0);
  const potentialPartners = Math.max(1, aliveNations.length - 1);
  const allianceCount = aliveNations.filter(n => n !== player && player.treaties?.[n.id]?.alliance).length;
  const allianceRatio = potentialPartners > 0 ? allianceCount / potentialPartners : 0;
  const truceCount = aliveNations.filter(n => n !== player && player.treaties?.[n.id]?.truceTurns).length;

  if (diplomacy.lastEvaluatedTurn !== S.turn) {
    diplomacy.lastEvaluatedTurn = S.turn;
    if (S.defcon >= DIPLOMATIC_VICTORY_CRITERIA.requiredDefcon) {
      diplomacy.peaceTurns += 1;
    } else {
      diplomacy.peaceTurns = 0;
    }
  }

  const influenceScore =
    allianceCount * 25 +
    truceCount * 10 +
    (player.intel || 0) +
    Math.max(0, (player.production || 0) * 0.5) +
    S.defcon * 5;

  diplomacy.allianceRatio = allianceRatio;
  diplomacy.influenceScore = influenceScore;

  const allianceProgress = Math.min(1, allianceRatio / DIPLOMATIC_VICTORY_CRITERIA.allianceRatio);
  const peaceProgress = Math.min(1, diplomacy.peaceTurns / DIPLOMATIC_VICTORY_CRITERIA.peaceTurns);
  const influenceProgress = Math.min(1, influenceScore / DIPLOMATIC_VICTORY_CRITERIA.influenceTarget);
  const overallProgress = (allianceProgress + peaceProgress + influenceProgress) / 3;

  if (overallProgress < DIPLOMATIC_VICTORY_CRITERIA.resetNearThreshold) {
    diplomacy.nearVictoryNotified = false;
  }

  if (
    !diplomacy.nearVictoryNotified &&
    overallProgress >= DIPLOMATIC_VICTORY_CRITERIA.nearProgressThreshold &&
    (allianceProgress < 1 || peaceProgress < 1 || influenceProgress < 1)
  ) {
    diplomacy.nearVictoryNotified = true;
    toast({
      title: 'Diplomatic Momentum',
      description: 'World leaders are rallying behind you. Maintain the peace to secure a diplomatic victory.'
    });
    (window as any).__gameAddNewsItem?.('diplomatic', 'Global coalition forming around your leadership', 'important');
  }

  const victoryAchieved =
    allianceRatio >= DIPLOMATIC_VICTORY_CRITERIA.allianceRatio &&
    diplomacy.peaceTurns >= DIPLOMATIC_VICTORY_CRITERIA.peaceTurns &&
    influenceScore >= DIPLOMATIC_VICTORY_CRITERIA.influenceTarget;

  if (victoryAchieved && !diplomacy.victoryAnnounced) {
    diplomacy.victoryAnnounced = true;
    toast({
      title: 'Diplomatic Victory Achieved',
      description: 'A worldwide alliance recognizes your leadership.'
    });
    (window as any).__gameAddNewsItem?.('diplomatic', 'Diplomatic triumph! A global coalition is declared.', 'critical');
  }

  return {
    victory: victoryAchieved,
    message: victoryAchieved
      ? `DIPLOMATIC VICTORY - Forged alliances with ${allianceCount} nations, preserved peace for ${diplomacy.peaceTurns} turns, and achieved influence score ${Math.floor(
          influenceScore
        )}.`
      : undefined
  };
}

// Victory check
function checkVictory() {
  if (S.gameOver) return;

  const player = PlayerManager.get();
  if (!player) return;

  const alive = nations.filter(n => n.population > 0);
  const totalPop = alive.reduce((sum, n) => sum + n.population, 0);

  const diplomacyResult = evaluateDiplomaticProgress(player);
  if (diplomacyResult.victory && diplomacyResult.message) {
    endGame(true, diplomacyResult.message);
    return;
  }

  if (player.population <= 0) {
    endGame(false, 'Your nation has been destroyed');
    return;
  }
  
  if (DoomsdayClock.minutes <= 0) {
    endGame(false, 'MUTUAL ASSURED DESTRUCTION');
    return;
  }
  
  if (alive.length === 1 && alive[0] === player) {
    endGame(true, 'TOTAL DOMINATION - You are the sole survivor!');
    return;
  }
  
  if ((player.cities || 1) >= 10) {
    endGame(true, 'ECONOMIC VICTORY - Industrial supremacy achieved!');
    return;
  }
  
  if (player.population / totalPop > 0.6 && (player.instability || 0) < 30) {
    endGame(true, 'DEMOGRAPHIC VICTORY - You control the world through immigration!');
    return;
  }
  
  if (S.turn >= 50 && player.population >= 50) {
    const score = S.turn * 10 + player.population * 5 + player.missiles * 20;
    endGame(true, `SURVIVAL VICTORY - Endured 50 turns! Score: ${score}`);
    return;
  }
}

// End game
function endGame(victory: boolean, message: string) {
  S.gameOver = true;
  
  const player = PlayerManager.get();
  const score = S.turn * 10 + (player?.population || 0) * 5;
  
  // Save highscore
  const highscores = JSON.parse(Storage.getItem('highscores') || '[]');
  highscores.push({
    name: S.playerName || S.selectedLeader || 'Player',
    doctrine: S.selectedDoctrine || null,
    score,
    turns: S.turn,
    date: new Date().toISOString()
  });
  highscores.sort((a: any, b: any) => b.score - a.score);
  Storage.setItem('highscores', JSON.stringify(highscores.slice(0, 10)));
  
  if (victory) {
    log('🏆 VICTORY ACHIEVED!', 'success');
    log(`Victory Condition: ${message}`, 'success');
  } else {
    log('DEFEAT!', 'alert');
    log(message, 'alert');
  }
  log(`Final Score: ${Math.floor(score)}`, 'success');
}

// Logging function
function log(msg: string, type: string = 'normal') {
  const logEl = document.getElementById('log');
  if (!logEl) return;
  
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.textContent = `[T${S.turn}] ${msg}`;
  logEl.appendChild(entry);
  logEl.scrollTop = logEl.scrollHeight;
  
  // Keep log size manageable
  if (logEl.children.length > 100) {
    logEl.removeChild(logEl.firstChild!);
  }
}

// AI Turn - Complete strategic decision making
function aiTurn(n: Nation) {
  S.overlay = { text: 'AI: ' + (n.leader || n.name), ttl: 800 };
  if (n.population <= 0) return;
  
  maybeBanter(n, 0.3);
  
  // Determine AI personality modifiers
  let aggressionMod = 0;
  let defenseMod = 0;
  let economicMod = 0;
  let intelMod = 0;
  
  switch (n.ai) {
    case 'aggressive':
      aggressionMod = 0.3;
      defenseMod = -0.1;
      economicMod = 0.0;
      intelMod = 0.1;
      break;
    case 'defensive':
      aggressionMod = -0.2;
      defenseMod = 0.3;
      economicMod = 0.1;
      intelMod = 0.1;
      break;
    case 'balanced':
      aggressionMod = 0.0;
      defenseMod = 0.1;
      economicMod = 0.15;
      intelMod = 0.15;
      break;
    case 'isolationist':
      aggressionMod = -0.3;
      defenseMod = 0.2;
      economicMod = 0.2;
      intelMod = 0.0;
      break;
    case 'trickster':
      aggressionMod = 0.1;
      defenseMod = 0.0;
      economicMod = 0.05;
      intelMod = 0.35;
      break;
    case 'chaotic':
      aggressionMod = 0.2;
      defenseMod = -0.1;
      economicMod = 0.1;
      intelMod = 0.2;
      break;
  }
  
  // Calculate threats and priorities
  const enemies = nations.filter(t => 
    t !== n && 
    t.population > 0 && 
    !n.treaties?.[t.id]?.truceTurns
  );
  
  const player = PlayerManager.get();
  const playerThreat = player ? (n.threats?.[player.id] || 0) : 0;

  // Strategic decision tree
  const r = Math.random();

  if (aiHandleDiplomaticUrgencies(n)) {
    return;
  }

  const diplomacyBias = 0.18 + Math.max(0, defenseMod * 0.5) + (n.ai === 'defensive' ? 0.1 : 0) + (n.ai === 'balanced' ? 0.05 : 0);
  if (Math.random() < diplomacyBias) {
    if (aiAttemptDiplomacy(n)) {
      return;
    }
  }

  // 1. RESEARCH - Advance technology
  if (r < 0.08 + intelMod && !n.researchQueue) {
    const availableResearch = RESEARCH_TREE.filter(project => {
      if (n.researched?.[project.id]) return false;
      if (project.prerequisites?.some(prereq => !n.researched?.[prereq])) return false;
      return canAfford(n, project.cost);
    });
    
    if (availableResearch.length > 0) {
      const project = availableResearch.sort((a, b) => {
        // Prioritize warheads for aggressive AI
        if (a.category === 'warhead' && n.ai === 'aggressive') return -1;
        if (b.category === 'warhead' && n.ai === 'aggressive') return 1;
        // Prioritize defense for defensive AI
        if (a.category === 'defense' && n.ai === 'defensive') return -1;
        if (b.category === 'defense' && n.ai === 'defensive') return 1;
        return 0;
      })[0];
      
      if (canAfford(n, project.cost)) {
        pay(n, project.cost);
        n.researchQueue = { projectId: project.id, turnsRemaining: project.turns, totalTurns: project.turns };
        log(`${n.name} begins research: ${project.name}`);
        return;
      }
    }
  }
  
  // 2. INTELLIGENCE OPERATIONS
  if (r < 0.15 + intelMod && n.intel >= 5) {
    const intelTargets = enemies.filter(t => !n.satellites?.[t.id]);
    
    // Deploy satellite
    if (intelTargets.length > 0 && n.intel >= 5 && Math.random() < 0.6) {
      const target = intelTargets.sort((a, b) => {
        const aThreat = n.threats?.[a.id] || 0;
        const bThreat = n.threats?.[b.id] || 0;
        return bThreat - aThreat;
      })[0];
      
      n.intel -= 5;
      n.satellites = n.satellites || {};
      n.satellites[target.id] = true;
      log(`${n.name} deploys satellite over ${target.name}`);
      registerSatelliteOrbit(n.id, target.id);
      return;
    }
    
    // Sabotage enemy warheads
    if (n.intel >= 10 && Math.random() < 0.3) {
      const sabotageTargets = enemies.filter(t => 
        Object.values(t.warheads || {}).some(count => (count || 0) > 0)
      );
      
      if (sabotageTargets.length > 0) {
        const target = sabotageTargets.sort((a, b) => {
          const aThreat = n.threats?.[a.id] || 0;
          const bThreat = n.threats?.[b.id] || 0;
          return bThreat - aThreat;
        })[0];
        
        const warheadTypes = Object.keys(target.warheads || {}).filter(key => 
          (target.warheads?.[Number(key)] || 0) > 0
        );
        
        if (warheadTypes.length > 0) {
          const type = warheadTypes[Math.floor(Math.random() * warheadTypes.length)];
          const numericType = Number(type);
          if (target.warheads) {
            target.warheads[numericType] = Math.max(0, (target.warheads[numericType] || 0) - 1);
            if (target.warheads[numericType] <= 0) {
              delete target.warheads[numericType];
            }
          }
          n.intel -= 10;
          log(`${n.name} sabotages ${target.name}'s ${type}MT warhead`);
          return;
        }
      }
    }
    
    // Propaganda warfare
    if (n.intel >= 15 && Math.random() < 0.25) {
      const target = enemies[Math.floor(Math.random() * enemies.length)];
      n.intel -= 15;
      target.instability = (target.instability || 0) + 20;
      log(`${n.name} launches propaganda against ${target.name}`);
      return;
    }
  }
  
  // 3. CULTURE WARFARE
  if (r < 0.12 + intelMod && n.intel >= 2) {
    const cultureTargets = enemies.filter(t => t.population > 5);
    
    if (cultureTargets.length > 0 && n.intel >= 20 && Math.random() < 0.15) {
      // Culture bomb
      const target = cultureTargets.sort((a, b) => b.population - a.population)[0];
      const stolen = Math.max(1, Math.floor(target.population * 0.1));
      n.intel -= 20;
      target.population = Math.max(0, target.population - stolen);
      n.population += stolen;
      n.migrantsThisTurn = (n.migrantsThisTurn || 0) + stolen;
      n.migrantsTotal = (n.migrantsTotal || 0) + stolen;
      log(`${n.name} culture bombs ${target.name}, stealing ${stolen}M population`);
      return;
    } else if (n.intel >= 2 && Math.random() < 0.2) {
      // Meme wave
      const target = enemies[Math.floor(Math.random() * enemies.length)];
      const stolen = Math.min(5, Math.max(1, Math.floor(target.population * 0.02)));
      n.intel -= 2;
      target.population = Math.max(0, target.population - stolen);
      n.population += stolen;
      n.migrantsThisTurn = (n.migrantsThisTurn || 0) + stolen;
      n.migrantsTotal = (n.migrantsTotal || 0) + stolen;
      target.instability = (target.instability || 0) + 8;
      log(`${n.name} launches meme wave against ${target.name}`);
      return;
    }
  }
  
  // 4. MILITARY STRIKE - Attack if aggressive and at low DEFCON
  if (r < 0.35 + aggressionMod && S.defcon <= 2 && enemies.length > 0) {
    const target = enemies.sort((a, b) => {
      const compute = (t: Nation) => {
        const threat = n.threats ? (n.threats[t.id] || 0) : 0;
        let score = threat;
        const aiType = n.ai || '';
        if (aiType === 'balanced') score *= 1.0;
        else if (aiType === 'isolationist') score *= 1.5;
        else if (aiType === 'aggressive') score *= 1.2;
        const defWeight = aiType === 'aggressive' ? 0.4 : aiType === 'balanced' ? 0.6 : aiType === 'isolationist' ? 0.8 : 0.5;
        score -= (t.defense || 0) * defWeight;
        if (t.isPlayer) score += 5;
        return score;
      };
      return compute(b) - compute(a);
    })[0];
    
    const availableYields = Object.entries(n.warheads || {})
      .filter(([, count]) => (count || 0) > 0)
      .map(([yieldStr]) => Number(yieldStr))
      .sort((a, b) => b - a);

    const yieldMT = availableYields.find(value =>
      (value <= 50 && S.defcon <= 2) || (value > 50 && S.defcon === 1)
    );

    if (yieldMT !== undefined && n.missiles > 0) {
      const launchSucceeded = launch(n, target, yieldMT);
      if (launchSucceeded) {
        maybeBanter(n, 0.7);
        if (target.isPlayer) {
          maybeBanter(n, 0.5);
        }
        return;
      }
    }
  }
  
  // 5. BUILD MILITARY - Missiles and warheads
  if (r < 0.50 + aggressionMod) {
    // Build advanced warheads if researched
    const warheadYields = [200, 100, 50, 40, 20, 10];
    for (const yieldMT of warheadYields) {
      const researchId = `warhead_${yieldMT}`;
      if (n.researched?.[researchId]) {
        const cost = COSTS[`warhead_${yieldMT}` as keyof typeof COSTS];
        if (cost && canAfford(n, cost)) {
          pay(n, cost);
          n.warheads = n.warheads || {};
          n.warheads[yieldMT] = (n.warheads[yieldMT] || 0) + 1;
          log(`${n.name} builds ${yieldMT}MT warhead`);
          return;
        }
      }
    }
    
    // Build missiles
    if (canAfford(n, COSTS.missile) && n.missiles < 15) {
      pay(n, COSTS.missile);
      n.missiles++;
      log(`${n.name} builds missile`);
      maybeBanter(n, 0.2);
      return;
    }
    
    // Build bombers
    if (canAfford(n, COSTS.bomber) && (n.bombers || 0) < 5 && Math.random() < 0.3) {
      pay(n, COSTS.bomber);
      n.bombers = (n.bombers || 0) + 1;
      log(`${n.name} builds bomber`);
      return;
    }
  }
  
  // 6. BUILD DEFENSE
  if (r < 0.65 + defenseMod) {
    if (canAfford(n, COSTS.defense) && n.defense < 15) {
      pay(n, COSTS.defense);
      n.defense += 2;
      log(`${n.name} upgrades defense`);
      return;
    }
  }
  
  // 7. ECONOMIC EXPANSION
  if (r < 0.80 + economicMod) {
    const maxCities = n.ai === 'isolationist' ? 5 : n.ai === 'balanced' ? 4 : 3;
    if ((n.cities || 1) < maxCities) {
      const cityCost = getCityCost(n);
      if (canAfford(n, cityCost)) {
        pay(n, cityCost);
        n.cities = (n.cities || 1) + 1;
        
        const spread = 6;
        const angle = Math.random() * Math.PI * 2;
        const newLat = n.lat + Math.sin(angle) * spread;
        const newLon = n.lon + Math.cos(angle) * spread;
        CityLights.addCity(newLat, newLon, 1.0);
        
        log(`${n.name} builds city #${n.cities}`);
        maybeBanter(n, 0.3);
        return;
      }
    }
  }
  
  // 8. ESCALATION - Reduce DEFCON
  if (r < 0.90 + aggressionMod) {
    if (S.defcon > 1 && Math.random() < 0.4) {
      S.defcon--;
      AudioSys.playSFX('defcon');
      log(`${n.name} escalates to DEFCON ${S.defcon}`);
      maybeBanter(n, 0.4);
      return;
    }
  }
  
  // 9. DIPLOMACY - Occasionally de-escalate if defensive
  if (n.ai === 'defensive' || n.ai === 'balanced') {
    if (S.defcon < 5 && Math.random() < 0.1) {
      S.defcon++;
      AudioSys.playSFX('defcon');
      log(`${n.name} proposes de-escalation to DEFCON ${S.defcon}`);
      return;
    }
  }

  const cyberOutcome = (window as any).__cyberAiPlan?.(n.id);
  if (cyberOutcome?.executed) {
    updateDisplay();
  }
}

// End turn
function endTurn() {
  if (S.gameOver || S.phase !== 'PLAYER') return;
  
  S.actionsRemaining = 0;
  S.phase = 'AI';
  updateDisplay();
  
  const aiNations = nations.filter(n => !n.isPlayer && n.population > 0);
  const actionsPerAI = S.defcon >= 4 ? 1 : S.defcon >= 2 ? 2 : 3;
  
  let aiActionCount = 0;
  aiNations.forEach(ai => {
    for (let i = 0; i < actionsPerAI; i++) {
      setTimeout(() => aiTurn(ai), 500 * aiActionCount++);
    }
  });
  
  setTimeout(() => {
    S.phase = 'RESOLUTION';
    updateDisplay();
    resolutionPhase();
    
    setTimeout(() => {
      S.phase = 'PRODUCTION';
      productionPhase();
      
      S.turn++;
      S.phase = 'PLAYER';
      S.actionsRemaining = S.defcon >= 4 ? 1 : S.defcon >= 2 ? 2 : 3;

      // Process AI bio-warfare for all AI nations
      const difficulty = S.difficulty || 'medium';
      processAllAINationsBioWarfare(nations, S.turn, difficulty, {
        onLabConstructionStart: (nationId, tier) => {
          const nation = nations.find(n => n.id === nationId);
          if (nation && (window as any).__gameAddNewsItem) {
            (window as any).__gameAddNewsItem('military', `${nation.name} has begun constructing bio-laboratory (Tier ${tier})`, 'alert');
          }
        },
        onPlagueSelected: (nationId, plagueType) => {
          const nation = nations.find(n => n.id === nationId);
          if (nation && (window as any).__gameAddNewsItem) {
            (window as any).__gameAddNewsItem('crisis', `INTELLIGENCE: ${nation.name} has initiated bio-weapon program`, 'critical');
          }
        },
        onNodeEvolved: (nationId, nodeId) => {
          // Silent - too many events otherwise
        },
        onDeployment: (nationId, targets) => {
          const nation = nations.find(n => n.id === nationId);
          if (nation && (window as any).__gameAddNewsItem) {
            (window as any).__gameAddNewsItem('crisis', `ALERT: Bio-weapon deployment detected from ${nation.name}`, 'critical');
          }
        }
      });

      (window as any).__cyberAdvance?.();

      const player = PlayerManager.get();
      const pandemicResult = (window as any).__pandemicAdvance?.({
        turn: S.turn,
        defcon: S.defcon,
        playerPopulation: player?.population ?? 0
      });

      if (pandemicResult && player) {
        if (pandemicResult.populationLoss) {
          player.population = Math.max(0, player.population - pandemicResult.populationLoss);
        }
        if (pandemicResult.productionPenalty) {
          player.production = Math.max(0, (player.production || 0) - pandemicResult.productionPenalty);
        }
        if (pandemicResult.instabilityIncrease) {
          player.instability = Math.max(0, (player.instability || 0) + pandemicResult.instabilityIncrease);
        }
        if (pandemicResult.actionsPenalty) {
          S.actionsRemaining = Math.max(0, S.actionsRemaining - pandemicResult.actionsPenalty);
        }
        if (pandemicResult.intelGain) {
          player.intel = Math.max(0, (player.intel || 0) + pandemicResult.intelGain);
        }
      }

      // Trigger flashpoint check at start of new turn
      if ((window as any).__gameTriggerFlashpoint) {
        const flashpoint = (window as any).__gameTriggerFlashpoint(S.turn, S.defcon);
        if (flashpoint) {
          (window as any).__gameAddNewsItem?.('crisis', `CRITICAL: ${flashpoint.title}`, 'critical');
        }
      }
      
      // Generate routine news
      if ((window as any).__gameAddNewsItem && S.turn % 3 === 0) {
        const newsTemplates = [
          { category: 'diplomatic' as const, text: 'International tensions remain high', priority: 'routine' as const },
          { category: 'intel' as const, text: 'Satellite reconnaissance continues', priority: 'routine' as const },
          { category: 'military' as const, text: 'Military readiness exercises ongoing', priority: 'routine' as const },
        ];
        const randomNews = newsTemplates[Math.floor(Math.random() * newsTemplates.length)];
        (window as any).__gameAddNewsItem(randomNews.category, randomNews.text, randomNews.priority);
      }
      
      updateDisplay();
      checkVictory();
    }, 1500);
  }, aiActionCount * 500 + 500);
}

// Update display
function updateDisplay() {
  const player = PlayerManager.get();
  if (!player) return;
  
  const defconEl = document.getElementById('defcon');
  if (defconEl) defconEl.textContent = S.defcon.toString();
  
  const turnEl = document.getElementById('turn');
  if (turnEl) turnEl.textContent = S.turn.toString();
  
  const maxActions = S.defcon >= 4 ? 1 : S.defcon >= 2 ? 2 : 3;
  const actionsEl = document.getElementById('actionsDisplay');
  if (actionsEl) actionsEl.textContent = `${S.actionsRemaining}/${maxActions}`;
  
  const phaseEl = document.getElementById('phaseBadge');
  if (phaseEl) phaseEl.textContent = S.phase;
  
  const productionEl = document.getElementById('productionDisplay');
  if (productionEl) productionEl.textContent = (player.production || 0).toString();
  
  const uraniumEl = document.getElementById('uraniumDisplay');
  if (uraniumEl) uraniumEl.textContent = (player.uranium || 0).toString();
  
  const intelEl = document.getElementById('intelDisplay');
  if (intelEl) intelEl.textContent = (player.intel || 0).toString();

  const cyberEl = document.getElementById('cyberDisplay');
  if (cyberEl) {
    const readiness = Math.round(player.cyber?.readiness ?? 0);
    const max = Math.round(player.cyber?.maxReadiness ?? 100);
    cyberEl.textContent = `${readiness}/${max}`;
  }
  
  const citiesEl = document.getElementById('citiesDisplay');
  if (citiesEl) citiesEl.textContent = (player.cities || 1).toString();
  
  const popEl = document.getElementById('popDisplay');
  if (popEl) popEl.textContent = Math.floor(player.population).toString();
  
  const leaderEl = document.getElementById('leaderDisplay');
  if (leaderEl) leaderEl.textContent = player.leader;
  
  const doctrineEl = document.getElementById('doctrineDisplay');
  if (doctrineEl) doctrineEl.textContent = (player.doctrine || 'none').toUpperCase();
  
  const missileEl = document.getElementById('missileDisplay');
  if (missileEl) missileEl.textContent = player.missiles.toString();
  
  const bomberEl = document.getElementById('bomberDisplay');
  if (bomberEl) bomberEl.textContent = (player.bombers || 0).toString();
  
  const defenseEl = document.getElementById('defenseDisplay');
  if (defenseEl) defenseEl.textContent = player.defense.toString();
  
  const instabilityEl = document.getElementById('instabilityDisplay');
  if (instabilityEl) instabilityEl.textContent = Math.floor(player.instability || 0).toString();
  
  const warheadText = Object.entries(player.warheads || {})
    .map(([y, c]) => `${y}MT:${c}`)
    .join(' ');
  const warheadEl = document.getElementById('warheadDisplay');
  if (warheadEl) warheadEl.textContent = warheadText || 'NONE';

  updateScoreboard();
  DoomsdayClock.update();

  if (uiUpdateCallback) {
    uiUpdateCallback();
  }

  broadcastMultiplayerState();
}

function updateScoreboard() {
  const scoreList = document.getElementById('scoreList');
  if (!scoreList) return;
  
  scoreList.innerHTML = '';
  const sorted = [...nations].sort((a, b) => b.population - a.population);
  sorted.forEach(n => {
    const entry = document.createElement('div');
    entry.className = 'score-entry';
    entry.innerHTML = `<span style="color:${n.color}">${n.name}</span><span>${Math.floor(n.population)}M</span>`;
    scoreList.appendChild(entry);
  });
}

// Game loop
function gameLoop() {
  if (S.paused || S.gameOver || !ctx) {
    requestAnimationFrame(gameLoop);
    return;
  }

  const nowMs = Date.now();

  ctx.imageSmoothingEnabled = !(currentTheme === 'retro80s' || currentTheme === 'wargames');

  ctx.clearRect(0, 0, W, H);

  Atmosphere.update();
  Atmosphere.draw(ctx, currentMapStyle);

  Ocean.update();
  Ocean.draw(ctx, currentMapStyle);

  cam.zoom += (cam.targetZoom - cam.zoom) * 0.1;

  drawWorld(currentMapStyle);
  CityLights.draw(ctx, currentMapStyle);
  drawNations(currentMapStyle);
  drawSatellites(nowMs);
  drawMissiles();
  drawBombers();
  drawSubmarines();
  drawConventionalForces();
  drawParticles();
  drawFX();
  
  requestAnimationFrame(gameLoop);
}

// Consume action
function consumeAction() {
  S.actionsRemaining--;
  updateDisplay();
  
  if (S.actionsRemaining <= 0) {
    S.overlay = { text: 'NEXT ROUND', ttl: 1000 };
    setTimeout(endTurn, 500);
  }
}

// React Component
export default function NoradVector() {
  const navigate = useNavigate();
  const interfaceRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gamePhase, setGamePhase] = useState('intro');
  const [isGameStarted, setIsGameStarted] = useState(false);
  const hasAutoplayedTurnOneMusicRef = useRef(false);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState<{ title: string; content: ModalContentValue }>({ title: '', content: '' });
  const [selectedLeader, setSelectedLeader] = useState<string | null>(null);
  const [selectedDoctrine, setSelectedDoctrine] = useState<string | null>(null);
  const [pendingLaunch, setPendingLaunch] = useState<PendingLaunchState | null>(null);
  const [selectedWarheadYield, setSelectedWarheadYield] = useState<number | null>(null);
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState<DeliveryMethod | null>(null);
  const [theme, setTheme] = useState<ThemeId>('synthwave');
  const [layoutDensity, setLayoutDensity] = useState<LayoutDensity>(() => {
    const stored = Storage.getItem('layout_density');
    if (stored === 'expanded' || stored === 'compact' || stored === 'minimal') {
      return stored;
    }
    return 'compact';
  });
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [mapStyle, setMapStyle] = useState<MapStyle>(() => {
    const stored = Storage.getItem('map_style');
    if (
      stored === 'realistic' ||
      stored === 'wireframe' ||
      stored === 'night' ||
      stored === 'political' ||
      stored === 'flat' ||
      stored === 'flat-realistic'
    ) {
      return stored;
    }
    return 'flat-realistic';
  });

  // Tutorial and phase transition system
  const tutorialContext = useTutorialContext();
  const [isPhaseTransitioning, setIsPhaseTransitioning] = useState(false);

  useEffect(() => {
    currentMapStyle = mapStyle;
    if (mapStyle === 'flat' || mapStyle === 'flat-realistic') {
      const expectedX = (W - W * cam.zoom) / 2;
      const expectedY = (H - H * cam.zoom) / 2;
      const needsRecentering = Math.abs(cam.x - expectedX) > 0.5 || Math.abs(cam.y - expectedY) > 0.5;
      if (needsRecentering) {
        cam.x = expectedX;
        cam.y = expectedY;
      }
    }
  }, [mapStyle]);
  useEffect(() => {
    void preloadFlatRealisticTexture();
  }, []);
  useEffect(() => {
    if (mapStyle === 'flat-realistic') {
      void preloadFlatRealisticTexture();
    }
  }, [mapStyle]);
  const storedMusicEnabled = Storage.getItem('audio_music_enabled');
  const initialMusicEnabled = storedMusicEnabled === 'true' ? true : storedMusicEnabled === 'false' ? false : AudioSys.musicEnabled;
  const storedSfxEnabled = Storage.getItem('audio_sfx_enabled');
  const initialSfxEnabled = storedSfxEnabled === 'true' ? true : storedSfxEnabled === 'false' ? false : AudioSys.sfxEnabled;
  const storedMusicVolume = Storage.getItem('audio_music_volume');
  const initialMusicVolume = (() => {
    if (storedMusicVolume !== null) {
      const parsed = Number.parseFloat(storedMusicVolume);
      if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 1) {
        return parsed;
      }
    }
    return AudioSys.musicVolume;
  })();
  const storedMusicTrack = Storage.getItem('audio_music_track');
  const initialMusicSelection: string = (() => {
    if (storedMusicTrack === 'random') {
      return 'random';
    }
    if (storedMusicTrack) {
      const metadata = AudioSys.getTrackMetadata(storedMusicTrack as MusicTrackId);
      if (metadata) {
        return metadata.id;
      }
    }
    return AudioSys.getPreferredTrack() ?? 'random';
  })();

  const [musicEnabled, setMusicEnabled] = useState(initialMusicEnabled);
  const [sfxEnabled, setSfxEnabled] = useState(initialSfxEnabled);
  const [musicVolume, setMusicVolume] = useState(initialMusicVolume);
  const [musicSelection, setMusicSelection] = useState<string>(initialMusicSelection);
  const [coopEnabled, setCoopEnabled] = useState(() => {
    const stored = Storage.getItem('option_coop_enabled');
    if (stored === 'true' || stored === 'false') {
      return stored === 'true';
    }
    return false;
  });
  const [activeTrackId, setActiveTrackId] = useState<MusicTrackId | null>(AudioSys.getCurrentTrack());
  useEffect(() => {
    AudioSys.setMusicEnabled(initialMusicEnabled);
    AudioSys.sfxEnabled = initialSfxEnabled;
    AudioSys.setMusicVolume(initialMusicVolume);
    if (initialMusicSelection === 'random') {
      AudioSys.setPreferredTrack(null);
    } else {
      AudioSys.setPreferredTrack(initialMusicSelection as MusicTrackId);
    }
  }, [initialMusicEnabled, initialSfxEnabled, initialMusicVolume, initialMusicSelection]);
  const musicTracks = useMemo(() => AudioSys.getTracks(), []);
  const [pandemicIntegrationEnabled, setPandemicIntegrationEnabled] = useState(() => {
    const stored = Storage.getItem('option_pandemic_integration');
    if (stored === 'true' || stored === 'false') {
      return stored === 'true';
    }
    return true;
  });
  const [bioWarfareEnabled, setBioWarfareEnabled] = useState(() => {
    const stored = Storage.getItem('option_biowarfare_conquest');
    if (stored === 'true' || stored === 'false') {
      return stored === 'true';
    }
    return true;
  });
  const [isBioWarfareOpen, setIsBioWarfareOpen] = useState(false);
  const [isLabConstructionOpen, setIsLabConstructionOpen] = useState(false);
  const [isStrikePlannerOpen, setIsStrikePlannerOpen] = useState(false);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const lastTargetPingIdRef = useRef<string | null>(null);
  const [conventionalState, setConventionalState] = useState<ConventionalState>(() => {
    const stored = Storage.getItem('conventional_state');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ConventionalState;
        return parsed;
      } catch (error) {
        console.warn('Failed to parse conventional state cache', error);
      }
    }
    return S.conventional ?? createDefaultConventionalState(
      nations.map(nation => ({ id: nation.id, isPlayer: nation.isPlayer }))
    );
  });

  const selectedLeaderGlobal = S.selectedLeader;
  const selectedDoctrineGlobal = S.selectedDoctrine;
  const playerNameGlobal = S.playerName;

  useEffect(() => {
    if (isGameStarted) {
      return;
    }

    if (gamePhase !== 'game') {
      return;
    }

    if (!selectedLeaderGlobal || !selectedDoctrineGlobal || !playerNameGlobal) {
      return;
    }

    setIsGameStarted(true);
  }, [gamePhase, isGameStarted, playerNameGlobal, selectedDoctrineGlobal, selectedLeaderGlobal]);

  useEffect(() => {
    if (!isGameStarted) {
      return;
    }

    if (hasAutoplayedTurnOneMusicRef.current) {
      return;
    }

    if (S.turn !== 1) {
      return;
    }

    if (!AudioSys.musicEnabled) {
      return;
    }

    let cancelled = false;

    void (async () => {
      while (!cancelled && AudioSys.musicEnabled && !AudioSys.getCurrentTrack()) {
        await AudioSys.resumeContext();
        await AudioSys.playPreferredTrack();
        if (AudioSys.getCurrentTrack()) {
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 250));
      }

      if (!cancelled && AudioSys.getCurrentTrack()) {
        hasAutoplayedTurnOneMusicRef.current = true;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isGameStarted]);
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') {
        return;
      }
      if (!AudioSys.musicEnabled) {
        return;
      }
      void (async () => {
        await AudioSys.resumeContext();
        await AudioSys.playPreferredTrack({ forceRestart: false });
      })();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    AudioSys.init();
    const audioContext = AudioSys.audioContext;
    const handleStateChange = (event: Event) => {
      const context = event.target as AudioContext | null;
      if (!context) {
        return;
      }
      if (context.state !== 'running') {
        return;
      }
      if (!AudioSys.musicEnabled) {
        return;
      }
      void (async () => {
        await AudioSys.resumeContext();
        await AudioSys.playPreferredTrack({ forceRestart: false });
      })();
    };

    audioContext?.addEventListener('statechange', handleStateChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      audioContext?.removeEventListener('statechange', handleStateChange);
    };
  }, []);
  const [uiTick, setUiTick] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPaused, setIsPaused] = useState(S.paused);
  const [showTutorial, setShowTutorial] = useState(() => {
    const hasSeenTutorial = Storage.getItem('has_seen_tutorial');
    return hasSeenTutorial !== 'true';
  });

  useEffect(() => {
    Storage.setItem('option_coop_enabled', coopEnabled ? 'true' : 'false');
  }, [coopEnabled]);

  const handleCoopToggle = useCallback((enabled: boolean) => {
    setCoopEnabled(enabled);
    toast({
      title: enabled ? 'Co-op approvals enabled' : 'Co-op approvals disabled',
      description: enabled
        ? 'Command approvals and multiplayer sync have been reactivated.'
        : 'Single-commander mode active. Actions will auto-approve until re-enabled.',
    });
  }, []);

  useEffect(() => {
    if (!(pandemicIntegrationEnabled && bioWarfareEnabled)) {
      setIsBioWarfareOpen(false);
    }
  }, [pandemicIntegrationEnabled, bioWarfareEnabled]);
  const bioWarfareAvailable = pandemicIntegrationEnabled && bioWarfareEnabled;
  const handleMapStyleChange = (style: MapStyle) => {
    currentMapStyle = style;
    setMapStyle(style);
    Storage.setItem('map_style', style);
    AudioSys.playSFX('click');
    if (style === 'flat-realistic') {
      void preloadFlatRealisticTexture();
    }
    toast({
      title: 'Map style updated',
      description: `Display mode changed to ${style}`,
    });
  };
  const handleAttackRef = useRef<() => void>(() => {});
  const handleProjectorReady = useCallback((projector: ProjectorFn) => {
    globeProjector = projector;
  }, []);
  const handlePickerReady = useCallback((picker: PickerFn) => {
    globePicker = picker;
  }, []);
  const { ensureAction, registerStateListener, publishState, canExecute } = useMultiplayer();

  const requestApproval = useCallback(
    async (action: Parameters<typeof ensureAction>[0], options?: Parameters<typeof ensureAction>[1]) => {
      if (!coopEnabled) {
        return true;
      }
      return ensureAction(action, options);
    },
    [coopEnabled, ensureAction],
  );

  const broadcastState = useCallback(() => {
    if (!coopEnabled) {
      return;
    }
    publishState({
      gameState: { ...S },
      nations: nations.map(nation => ({ ...nation })),
      conventionalDeltas: conventionalDeltas.map(delta => ({ ...delta })),
    });
  }, [coopEnabled, publishState]);

  useEffect(() => {
    if (!coopEnabled) {
      setMultiplayerPublisher(null);
      return () => setMultiplayerPublisher(null);
    }
    setMultiplayerPublisher(() => broadcastState);
    return () => setMultiplayerPublisher(null);
  }, [broadcastState, coopEnabled]);

  useEffect(() => {
    if (!coopEnabled) {
      return;
    }
    const unsubscribe = registerStateListener(envelope => {
      const { state } = envelope;
      suppressMultiplayerBroadcast = true;
      try {
        if (state.gameState) {
          S = { ...state.gameState };
          if (!Array.isArray(S.satelliteOrbits)) {
            S.satelliteOrbits = [];
          }
        }
        if (state.nations) {
          nations = state.nations.map(nation => ({ ...nation }));
        }
        if (state.conventionalDeltas) {
          conventionalDeltas = state.conventionalDeltas.map(delta => ({ ...delta }));
        }
      } finally {
        suppressMultiplayerBroadcast = false;
      }
      updateDisplay();
    });
    return unsubscribe;
  }, [coopEnabled, registerStateListener]);

  useEffect(() => {
    const unsubscribe = AudioSys.subscribeToTrackChanges(trackId => {
      setActiveTrackId(trackId);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const unlock = () => {
      AudioSys.handleUserInteraction();
    };
    const options: AddEventListenerOptions = { once: true, passive: true };
    window.addEventListener('pointerdown', unlock, options);
    window.addEventListener('keydown', unlock, options);
    window.addEventListener('touchstart', unlock, options);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
  }, []);

  // News ticker and flashpoints
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const { activeFlashpoint, triggerRandomFlashpoint, resolveFlashpoint, dismissFlashpoint } = useFlashpoints();
  const { distortNationIntel, generateFalseIntel } = useFogOfWar();

  const addNewsItem = useCallback((category: NewsItem['category'], text: string, priority: NewsItem['priority']) => {
    const item: NewsItem = {
      id: `news_${Date.now()}_${Math.random()}`,
      text,
      priority,
      category,
      timestamp: Date.now()
    };
    setNewsItems(prev => [...prev, item].slice(-20)); // Keep last 20 items
  }, []);

  const getAllNations = useCallback(() => nations, []);

  // Integrated bio-warfare system (combines pandemic + evolution tree)
  const {
    pandemicState,
    triggerPandemic,
    applyCountermeasure: applyPandemicCountermeasure,
    advancePandemicTurn,
    upgradeTrait: upgradePandemicTrait,
    downgradeTrait: downgradePandemicTrait,
    resetTraits: resetPandemicTraits,
    deployTraits: deployPandemicTraits
  } = usePandemic(addNewsItem);

  const showPandemicPanel = useMemo(() => {
    if (!pandemicIntegrationEnabled) {
      return false;
    }

    if (bioWarfareEnabled && isBioWarfareOpen) {
      return true;
    }

    const {
      active,
      outbreaks,
      globalInfection,
      mutationLevel,
      vaccineProgress,
      casualtyTally,
    } = pandemicState;

    if (active) {
      return true;
    }

    const hasOutbreakActivity = outbreaks.some(
      (outbreak) => outbreak.infection > 0 || outbreak.heat > 0,
    );

    const hasPandemicMomentum =
      globalInfection > 0 ||
      mutationLevel > 0 ||
      vaccineProgress > 0 ||
      casualtyTally > 0;

    return hasOutbreakActivity || hasPandemicMomentum;
  }, [
    pandemicIntegrationEnabled,
    bioWarfareEnabled,
    isBioWarfareOpen,
    pandemicState,
  ]);

  // Evolution tree system for Plague Inc style gameplay
  const {
    plagueState,
    labFacility,
    applyCountermeasure: applyBioWarfareCountermeasure,
    selectPlagueType,
    evolveNode,
    devolveNode,
    addDNAPoints,
    startLabConstruction,
    cancelLabConstruction,
    getConstructionOptions,
    deployBioWeapon,
    triggerBioWarfare,
    advanceBioWarfareTurn,
    onCountryInfected,
    availableNodes,
    calculateSpreadModifiers,
  } = useBioWarfare(addNewsItem);

  const playerNationId =
    PlayerManager.get()?.id ?? nations.find(nation => nation.isPlayer)?.id ?? 'player';

  const conventional = useConventionalWarfare({
    initialState: conventionalState,
    currentTurn: S.turn,
    getNation: getNationById,
    onStateChange: setConventionalState,
    onConsumeAction: consumeAction,
    onUpdateDisplay: updateDisplay,
  });

  const cyber = useCyberWarfare({
    currentTurn: S.turn,
    getNation: getNationById,
    getNations: getAllNations,
    onLog: (message, tone) => log(message, tone),
    onToast: payload => toast(payload),
    onNews: addNewsItem,
    onDefconShift: (delta, reason) => {
      const previous = S.defcon;
      S.defcon = Math.max(1, Math.min(5, S.defcon + delta));
      if (S.defcon !== previous) {
        AudioSys.playSFX('defcon');
        log(reason, delta < 0 ? 'warning' : 'success');
        addNewsItem('intel', reason, delta < 0 ? 'critical' : 'important');
        updateDisplay();
      }
    },
  });

  const {
    getActionAvailability: getCyberActionAvailability,
    launchAttack: launchCyberAttack,
    launchFalseFlag: launchCyberFalseFlag,
    hardenNetworks: hardenCyberNetworks,
    advanceTurn: advanceCyberTurn,
    runAiPlan: runCyberAiPlan,
  } = cyber;

  const getGovernanceNations = useCallback(
    () => nations as unknown as GovernanceNationRef[],
    [],
  );

  const handleGovernanceMetricsSync = useCallback(
    (nationId: string, metrics: GovernanceMetrics) => {
      const nation = getNationById(nationId);
      if (!nation) return;
      nation.morale = metrics.morale;
      nation.publicOpinion = metrics.publicOpinion;
      nation.electionTimer = metrics.electionTimer;
      nation.cabinetApproval = metrics.cabinetApproval;
    },
    [],
  );

  const handleGovernanceDelta = useCallback(
    (nationId: string, delta: GovernanceDelta) => {
      const nation = getNationById(nationId);
      if (!nation) return;
      if (typeof delta.instability === 'number') {
        nation.instability = Math.max(0, (nation.instability || 0) + delta.instability);
      }
      if (typeof delta.production === 'number') {
        nation.production = Math.max(0, nation.production + delta.production);
      }
      if (typeof delta.intel === 'number') {
        nation.intel = Math.max(0, (nation.intel || 0) + delta.intel);
      }
      if (typeof delta.uranium === 'number') {
        nation.uranium = Math.max(0, (nation.uranium || 0) + delta.uranium);
      }
    },
    [],
  );

  const governance = useGovernance({
    currentTurn: S.turn,
    getNations: getGovernanceNations,
    onMetricsSync: handleGovernanceMetricsSync,
    onApplyDelta: handleGovernanceDelta,
    onAddNewsItem: (category, text, priority) => addNewsItem(category, text, priority),
  });

  useEffect(() => {
    const nextState = conventional.state;
    if (!nextState) {
      S.conventionalUnits = [];
      S.conventionalMovements = S.conventionalMovements ?? [];
      return;
    }

    S.conventional = nextState;

    const deployedMarkers: ConventionalUnitMarker[] = [];
    const activeUnitIds = new Set<string>();

    Object.values(nextState.units ?? {}).forEach((unit) => {
      activeUnitIds.add(unit.id);
      if (unit.status !== 'deployed' || !unit.locationId) {
        return;
      }
      const anchor = territoryAnchors[unit.locationId];
      if (!anchor) {
        return;
      }
      const template = nextState.templates[unit.templateId];
      const forceType: ForceType = template?.type ?? 'army';
      deployedMarkers.push({
        unitId: unit.id,
        ownerId: unit.ownerId,
        lon: anchor.lon,
        lat: anchor.lat,
        icon: conventionalIconLookup[forceType],
        forceType,
      });
    });

    S.conventionalUnits = deployedMarkers;

    const filteredMovements = (S.conventionalMovements ?? []).filter((movement) => {
      if (!activeUnitIds.has(movement.unitId)) {
        return false;
      }
      if (movement.toTerritoryId && !territoryAnchors[movement.toTerritoryId]) {
        return false;
      }
      return true;
    });

    S.conventionalMovements = filteredMovements;

    try {
      Storage.setItem('conventional_state', JSON.stringify(nextState));
    } catch (error) {
      console.warn('Failed to persist conventional warfare state', error);
    }
  }, [conventional.state]);

  const {
    units: conventionalUnits,
    territories: conventionalTerritories,
    templates: conventionalTemplatesMap,
    logs: conventionalLogs,
    trainUnit: trainConventionalUnit,
    deployUnit: deployConventionalUnitBase,
    resolveBorderConflict: resolveConventionalBorderConflictBase,
    resolveProxyEngagement: resolveConventionalProxyEngagement,
    getUnitsForNation: getConventionalUnitsForNation,
  } = conventional;

  const getNationAnchor = useCallback((ownerId: string) => {
    let nation = getNationById(ownerId);
    if (!nation && ownerId === 'player') {
      nation = nations.find((entry) => entry.isPlayer) ?? null;
    }
    return nation ? { lon: nation.lon, lat: nation.lat } : null;
  }, []);

  const registerConventionalMovement = useCallback(
    ({
      unitId,
      templateId,
      ownerId,
      fromTerritoryId,
      toTerritoryId,
      fallbackEnd,
    }: ConventionalMovementRegistration) => {
      if (!ownerId) {
        return;
      }

      const template = templateId ? conventionalTemplatesMap[templateId] : undefined;
      const forceType: ForceType = template?.type ?? 'army';

      const targetAnchor =
        (toTerritoryId ? territoryAnchors[toTerritoryId] : undefined) ??
        fallbackEnd ??
        getNationAnchor(ownerId);

      if (!targetAnchor) {
        return;
      }

      const originAnchor =
        (fromTerritoryId ? territoryAnchors[fromTerritoryId] : undefined) ??
        getNationAnchor(ownerId) ??
        targetAnchor;

      const startLon = originAnchor.lon;
      const startLat = originAnchor.lat;
      const endLon = targetAnchor.lon;
      const endLat = targetAnchor.lat;

      if (Math.hypot(endLon - startLon, endLat - startLat) < 0.01) {
        return;
      }

      const movement: ConventionalMovementMarker = {
        id: `${unitId}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
        unitId,
        ownerId,
        forceType,
        icon: conventionalIconLookup[forceType],
        startLon,
        startLat,
        endLon,
        endLat,
        fromTerritoryId: fromTerritoryId ?? null,
        toTerritoryId: toTerritoryId ?? null,
        progress: 0,
        speed: 0.012 + Math.random() * 0.01,
        createdAt: Date.now(),
      };

      const existing = (S.conventionalMovements ?? []).filter((entry) => entry.unitId !== unitId);
      S.conventionalMovements = [...existing, movement];
    },
    [conventionalTemplatesMap, getNationAnchor],
  );

  const deployConventionalUnit = useCallback(
    (unitId: string, territoryId: string) => {
      const currentUnit = conventionalUnits[unitId] ?? conventional.state.units[unitId];
      const fromTerritoryId = currentUnit?.locationId ?? null;
      const ownerId = currentUnit?.ownerId ?? 'player';
      const templateId = currentUnit?.templateId;

      const result = deployConventionalUnitBase(unitId, territoryId);
      if (result.success) {
        registerConventionalMovement({
          unitId,
          templateId,
          ownerId,
          fromTerritoryId,
          toTerritoryId: territoryId,
        });
      }
      return result;
    },
    [conventional.state.units, conventionalUnits, deployConventionalUnitBase, registerConventionalMovement],
  );

  const findStagingTerritory = useCallback(
    (ownerId: string, territoryId: string): string | null => {
      const territory = conventionalTerritories[territoryId];
      if (!territory) {
        return null;
      }
      for (const neighborId of territory.neighbors) {
        const neighbor = conventionalTerritories[neighborId];
        if (neighbor && neighbor.controllingNationId === ownerId) {
          return neighbor.id;
        }
      }
      return null;
    },
    [conventionalTerritories],
  );

  const resolveConventionalBorderConflict = useCallback(
    (territoryId: string, attackerId: string, defenderId: string) => {
      const attackerUnitsBefore = Object.values(conventionalUnits).filter(
        (unit) => unit.ownerId === attackerId && unit.locationId === territoryId && unit.status === 'deployed',
      );
      const defenderUnitsBefore = Object.values(conventionalUnits).filter(
        (unit) => unit.ownerId === defenderId && unit.locationId === territoryId && unit.status === 'deployed',
      );

      const attackerOrigin = findStagingTerritory(attackerId, territoryId);
      const defenderOrigin = findStagingTerritory(defenderId, territoryId);

      const result = resolveConventionalBorderConflictBase(territoryId, attackerId, defenderId);
      if (result.success) {
        const attackerFallback = getNationAnchor(attackerId);
        const defenderFallback = getNationAnchor(defenderId);

        if (result.attackerVictory) {
          attackerUnitsBefore.forEach((unit) => {
            registerConventionalMovement({
              unitId: unit.id,
              templateId: unit.templateId,
              ownerId: unit.ownerId,
              fromTerritoryId: attackerOrigin ?? null,
              toTerritoryId: territoryId,
              fallbackEnd: attackerFallback,
            });
          });

          defenderUnitsBefore.forEach((unit) => {
            registerConventionalMovement({
              unitId: unit.id,
              templateId: unit.templateId,
              ownerId: unit.ownerId,
              fromTerritoryId: territoryId,
              toTerritoryId: defenderOrigin,
              fallbackEnd: defenderFallback,
            });
          });
        } else {
          attackerUnitsBefore.forEach((unit) => {
            registerConventionalMovement({
              unitId: unit.id,
              templateId: unit.templateId,
              ownerId: unit.ownerId,
              fromTerritoryId: territoryId,
              toTerritoryId: attackerOrigin,
              fallbackEnd: attackerFallback,
            });
          });

          defenderUnitsBefore.forEach((unit) => {
            registerConventionalMovement({
              unitId: unit.id,
              templateId: unit.templateId,
              ownerId: unit.ownerId,
              fromTerritoryId: defenderOrigin ?? null,
              toTerritoryId: territoryId,
              fallbackEnd: defenderFallback,
            });
          });
        }
      }

      return result;
    },
    [
      conventionalUnits,
      findStagingTerritory,
      getNationAnchor,
      registerConventionalMovement,
      resolveConventionalBorderConflictBase,
    ],
  );

  useEffect(() => {
    (window as any).__cyberAdvance = advanceCyberTurn;
    (window as any).__cyberAiPlan = runCyberAiPlan;
    return () => {
      delete (window as any).__cyberAdvance;
      delete (window as any).__cyberAiPlan;
    };
  }, [advanceCyberTurn, runCyberAiPlan]);

  const handlePandemicTrigger = useCallback((payload: PandemicTriggerPayload) => {
    if (!pandemicIntegrationEnabled) {
      addNewsItem(
        'science',
        'Pandemic simulations disabled – scenario logged for NORAD audit.',
        'important'
      );
      return;
    }
    if (!bioWarfareEnabled) {
      addNewsItem(
        'diplomatic',
        'Bio-weapon conquest protocols disabled – engineered outbreak denied.',
        'important'
      );
      return;
    }
    triggerBioWarfare(payload);
  }, [pandemicIntegrationEnabled, bioWarfareEnabled, triggerBioWarfare, addNewsItem]);

  const handlePandemicCountermeasure = useCallback((payload: PandemicCountermeasurePayload) => {
    if (!pandemicIntegrationEnabled) return;
    applyPandemicCountermeasure(payload);
  }, [pandemicIntegrationEnabled, applyPandemicCountermeasure]);

  const handlePandemicAdvance = useCallback((context: PandemicTurnContext) => {
    if (!pandemicIntegrationEnabled) return null;
    return advanceBioWarfareTurn(context, nations ?? []);
  }, [pandemicIntegrationEnabled, advanceBioWarfareTurn, nations]);

  // Progressive tutorial system
  const tutorialSteps = [
    {
      id: 'welcome',
      title: 'Velkommen til NORAD Command',
      description: 'Du er kommandør for en supermakt. Målet er å overleve og dominere gjennom strategi, diplomati og militær makt.',
      position: 'center' as const,
      allowSkip: true,
    },
    {
      id: 'defcon',
      title: 'DEFCON Status',
      description: 'DEFCON viser krigsberedskap. Jo lavere tall, jo nærmere atomkrig. Hold et øye med dette!',
      target: '#defcon',
      position: 'bottom' as const,
    },
    {
      id: 'resources',
      title: 'Ressurspanel',
      description: 'Her ser du produksjon, uran og intel. Disse regenereres hver runde og brukes til å bygge og forske.',
      target: '.hud-module:has(#production)',
      position: 'left' as const,
    },
    {
      id: 'build',
      title: 'Byggemeny',
      description: 'Klikk BUILD for å konstruere raketter, bombefly og forsvar. Husk å montere stridshoder!',
      target: 'button:has(.lucide-factory)',
      position: 'top' as const,
    },
    {
      id: 'research',
      title: 'Forskningssystem',
      description: 'Forsk frem kraftigere våpen og forsvarsssystemer. Hver teknologi tar flere runder.',
      target: 'button:has(.lucide-microscope)',
      position: 'top' as const,
    },
    {
      id: 'globe',
      title: 'Globeinteraksjon',
      description: 'Klikk på fiendtlige nasjoner for å se detaljer og utføre handlinger. Satellitter avslører mer info.',
      position: 'center' as const,
    },
  ];

  const { showTutorial: showProgressiveTutorial, handleComplete, handleSkip } = useTutorial('progressive_onboarding', tutorialSteps);

  // Expose functions globally for game loop access
  const addNewsItemRef = useRef(addNewsItem);
  const triggerRandomFlashpointRef = useRef(triggerRandomFlashpoint);
  const triggerPandemicRef = useRef(handlePandemicTrigger);
  const applyPandemicCountermeasureRef = useRef(handlePandemicCountermeasure);
  const advancePandemicTurnRef = useRef(handlePandemicAdvance);
  
  useEffect(() => {
    addNewsItemRef.current = addNewsItem;
    triggerRandomFlashpointRef.current = triggerRandomFlashpoint;
    triggerPandemicRef.current = handlePandemicTrigger;
    applyPandemicCountermeasureRef.current = handlePandemicCountermeasure;
    advancePandemicTurnRef.current = handlePandemicAdvance;

    // Make available globally
    (window as any).__gameAddNewsItem = addNewsItem;
    (window as any).__gameTriggerFlashpoint = triggerRandomFlashpoint;
    (window as any).__pandemicTrigger = (payload: unknown) => triggerPandemicRef.current(payload as any);
    (window as any).__pandemicCountermeasure = (payload: unknown) => applyPandemicCountermeasureRef.current(payload as any);
    (window as any).__pandemicAdvance = (context: unknown) => advancePandemicTurnRef.current(context as any);
  }, [addNewsItem, triggerRandomFlashpoint, handlePandemicTrigger, handlePandemicCountermeasure, handlePandemicAdvance]);

  useEffect(() => {
    Storage.setItem('layout_density', layoutDensity);
  }, [layoutDensity]);

  useEffect(() => {
    Storage.setItem('option_pandemic_integration', pandemicIntegrationEnabled ? 'true' : 'false');
  }, [pandemicIntegrationEnabled]);

  useEffect(() => {
    Storage.setItem('option_biowarfare_conquest', bioWarfareEnabled ? 'true' : 'false');
  }, [bioWarfareEnabled]);

  const activeLayout = useMemo(
    () => layoutDensityOptions.find((option) => option.id === layoutDensity) ?? layoutDensityOptions[0],
    [layoutDensity],
  );

  const cycleLayoutDensity = useCallback(() => {
    const currentIndex = layoutDensityOrder.indexOf(layoutDensity);
    const nextIndex = (currentIndex + 1) % layoutDensityOrder.length;
    const nextDensity = layoutDensityOrder[nextIndex];
    setLayoutDensity(nextDensity);
    const nextLayout = layoutDensityOptions.find((option) => option.id === nextDensity);
    if (nextLayout) {
      toast({ title: `HUD layout: ${nextLayout.label}`, description: nextLayout.description });
    }
  }, [layoutDensity]);

  const handlePauseToggle = useCallback(() => {
    if (S.gameOver) return;
    S.paused = !S.paused;
    setIsPaused(S.paused);
    log(S.paused ? 'Simulation paused.' : 'Simulation resumed.', S.paused ? 'warning' : 'success');
    toast({
      title: S.paused ? 'Simulation paused' : 'Simulation resumed',
      description: S.paused ? 'Time-on-target calculations are frozen.' : 'Command routines restored.',
    });
    if (uiUpdateCallback) {
      uiUpdateCallback();
    }
  }, []);

  const handleSaveSnapshot = useCallback(() => {
    try {
      const payload = {
        timestamp: new Date().toISOString(),
        state: {
          turn: S.turn,
          defcon: S.defcon,
          phase: S.phase,
          actionsRemaining: S.actionsRemaining,
          selectedLeader: S.selectedLeader,
          selectedDoctrine: S.selectedDoctrine,
          doomsdayMinutes: DoomsdayClock.minutes,
          conventional: S.conventional,
        },
      };
      Storage.setItem('save_snapshot', JSON.stringify(payload));
      log('Strategic snapshot saved.', 'success');
      toast({ title: 'Save complete', description: 'Strategic snapshot stored in secure buffers.' });
    } catch (error) {
      console.error('Save failed', error);
      log('Save failed: secure storage unavailable.', 'alert');
      toast({ title: 'Save failed', description: 'Unable to access secure storage.' });
    }
  }, []);

  const resizeCanvas = useCallback(() => {
    const element = canvasRef.current;
    if (!element) return;

    const parent = element.parentElement;
    const rect = parent?.getBoundingClientRect();
    const fallbackWidth = typeof window !== 'undefined' ? window.innerWidth : element.width;
    const fallbackHeight = typeof window !== 'undefined' ? window.innerHeight : element.height;
    const width = Math.floor(rect?.width ?? fallbackWidth);
    const height = Math.floor(rect?.height ?? fallbackHeight);

    if (width <= 0 || height <= 0) {
      return;
    }

    element.style.width = '100%';
    element.style.height = '100%';

    const sizeChanged = element.width !== width || element.height !== height;
    if (sizeChanged) {
      element.width = width;
      element.height = height;
      W = width;
      H = height;
      cam.x = (W - W * cam.zoom) / 2;
      cam.y = (H - H * cam.zoom) / 2;
    } else {
      W = element.width;
      H = element.height;
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    AudioSys.playSFX('click');
    if (typeof document === 'undefined') return;
    const element = interfaceRef.current ?? document.documentElement;

    if (!document.fullscreenElement) {
      if (element.requestFullscreen) {
        void element.requestFullscreen().catch(() => {
          toast({ title: 'Fullscreen blocked', description: 'Browser prevented entering fullscreen mode.' });
        });
      } else {
        toast({ title: 'Fullscreen unsupported', description: 'This browser does not support fullscreen mode.' });
      }
    } else if (document.exitFullscreen) {
      void document.exitFullscreen().catch(() => {
        toast({ title: 'Fullscreen error', description: 'Unable to exit fullscreen mode.' });
      });
    }
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
      resizeCanvas();
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    handleFullscreenChange();

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [resizeCanvas]);

  useEffect(() => {
    if (isGameStarted) {
      resizeCanvas();
    }
  }, [isGameStarted, resizeCanvas]);

  const handleMusicToggle = useCallback((checked: boolean) => {
    AudioSys.setMusicEnabled(checked);
    Storage.setItem('audio_music_enabled', String(checked));
    setMusicEnabled(checked);
  }, []);

  const handleSfxToggle = useCallback((checked: boolean) => {
    AudioSys.sfxEnabled = checked;
    Storage.setItem('audio_sfx_enabled', String(checked));
    setSfxEnabled(checked);
  }, []);

  const handleMusicVolumeChange = useCallback((value: number[]) => {
    const volume = Math.min(1, Math.max(0, value[0] ?? 0));
    AudioSys.setMusicVolume(volume);
    Storage.setItem('audio_music_volume', String(volume));
    setMusicVolume(volume);
  }, []);

  const handleMusicTrackChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setMusicSelection(value);
    if (value === 'random') {
      AudioSys.setPreferredTrack(null);
      Storage.setItem('audio_music_track', 'random');
    } else {
      AudioSys.setPreferredTrack(value as MusicTrackId);
      Storage.setItem('audio_music_track', value);
    }
  }, []);

  const handleNextTrack = useCallback(() => {
    AudioSys.playNextTrack();
  }, []);

  const activeTrackMeta = useMemo(() => (activeTrackId ? AudioSys.getTrackMetadata(activeTrackId) : null), [activeTrackId]);

  const activeTrackMessage = useMemo(() => {
    if (!musicEnabled) {
      return 'Music disabled';
    }
    if (activeTrackMeta) {
      return `Now playing: ${activeTrackMeta.title}`;
    }
    if (!AudioSys.userInteractionPrimed) {
      return 'Awaiting first interaction to start playback';
    }
    if (musicSelection !== 'random') {
      const selected = AudioSys.getTrackMetadata(musicSelection as MusicTrackId);
      if (selected) {
        return `Preparing: ${selected.title}`;
      }
    }
    return 'Preparing soundtrack';
  }, [activeTrackMeta, musicEnabled, musicSelection]);

  useEffect(() => {
    const stored = Storage.getItem('theme');
    if (stored && themeOptions.some(opt => opt.id === stored)) {
      const valid = stored as ThemeId;
      setTheme(valid);
      currentTheme = valid;
    } else {
      currentTheme = 'synthwave';
    }
  }, []);

  useEffect(() => {
    currentTheme = theme;
    const classNames = themeOptions.map(opt => `theme-${opt.id}`);
    if (typeof document !== 'undefined') {
      document.body.classList.remove(...classNames);
      document.body.classList.add(`theme-${theme}`);
    }
    Storage.setItem('theme', theme);
    if (canvasRef.current) {
      canvasRef.current.style.imageRendering = theme === 'retro80s' || theme === 'wargames' ? 'pixelated' : 'auto';
    }
  }, [theme]);

  useEffect(() => {
    uiUpdateCallback = () => setUiTick(prev => prev + 1);
    return () => {
      uiUpdateCallback = null;
    };
  }, []);

  useEffect(() => {
    selectedTargetRefId = selectedTargetId;
  }, [selectedTargetId]);

  useEffect(() => () => {
    globeProjector = null;
    globePicker = null;
  }, []);

  useEffect(() => {
    setIsPaused(S.paused);
  }, [uiTick]);

  useEffect(() => {
    if (!selectedTargetId) return;
    const player = PlayerManager.get();
    const target = nations.find(n => n.id === selectedTargetId);
    if (!target || !isEligibleEnemyTarget(player, target)) {
      setSelectedTargetId(null);
    }
  }, [selectedTargetId, uiTick]);

  useEffect(() => {
    if (!isGameStarted) {
      setSelectedTargetId(null);
    }
  }, [isGameStarted]);

  const targetableNations = useMemo(() => {
    void uiTick;
    return nations
      .filter(n => !n.isPlayer && n.population > 0)
      .sort((a, b) => b.population - a.population);
  }, [uiTick]);

  const attackableNations = useMemo(() => {
    const player = PlayerManager.get();
    return targetableNations.filter(nation => isEligibleEnemyTarget(player, nation));
  }, [targetableNations]);

  const selectedTarget = useMemo(() => {
    if (!selectedTargetId) return null;
    return attackableNations.find(nation => nation.id === selectedTargetId) ?? null;
  }, [attackableNations, selectedTargetId]);

  const handleTargetSelect = useCallback((nationId: string) => {
    AudioSys.playSFX('click');
    setSelectedTargetId(prev => (prev === nationId ? null : nationId));
  }, []);

  useEffect(() => {
    if (!selectedTarget) {
      lastTargetPingIdRef.current = null;
      return;
    }

    if (lastTargetPingIdRef.current === selectedTarget.id) {
      return;
    }

    lastTargetPingIdRef.current = selectedTarget.id;
    S.rings = S.rings || [];
    S.rings.push({
      lon: selectedTarget.lon,
      lat: selectedTarget.lat,
      r: 2,
      max: 90,
      speed: 2.4,
      alpha: 0.85,
      type: 'sonar',
    });
    if (uiUpdateCallback) {
      uiUpdateCallback();
    }
  }, [selectedTarget]);

  const handleAttack = useCallback(() => {
    AudioSys.playSFX('click');
    setIsStrikePlannerOpen(prev => {
      if (!prev) {
        return true;
      }
      return prev;
    });

    if (!isStrikePlannerOpen) {
      return;
    }

    if (!isGameStarted || S.gameOver) return;

    const player = PlayerManager.get();
    if (!player) return;

    if (S.phase !== 'PLAYER') {
      toast({ title: 'Cannot launch', description: 'Attacks are only available during your phase.' });
      return;
    }

    if (S.actionsRemaining <= 0) {
      toast({ title: 'No actions remaining', description: 'You must end your turn before launching another strike.' });
      return;
    }

    if (!canPerformAction('attack', S.defcon)) {
      toast({ title: 'DEFCON too high', description: 'Escalate to DEFCON 2 or lower before ordering an attack.' });
      return;
    }

    if (!selectedTargetId) {
      toast({ title: 'Select a target', description: 'Choose a target nation from the list before launching.' });
      return;
    }

    const target = nations.find(n => n.id === selectedTargetId && !n.isPlayer);
    if (!target || target.population <= 0) {
      toast({ title: 'Target unavailable', description: 'The selected target is no longer a valid threat.' });
      setSelectedTargetId(null);
      return;
    }

    if (hasActivePeaceTreaty(player, target)) {
      toast({ title: 'Treaty in effect', description: 'An active truce or alliance prevents launching against this nation.' });
      setSelectedTargetId(null);
      return;
    }

    const warheadEntries = Object.entries(player.warheads || {})
      .map(([yieldStr, count]) => ({ yield: Number(yieldStr), count: count as number }))
      .filter(entry => {
        if (entry.count <= 0) return false;
        if (entry.yield <= 10) return true;
        const researchId = WARHEAD_YIELD_TO_ID.get(entry.yield);
        if (!researchId) return true;
        return !!player.researched?.[researchId];
      })
      .map(entry => ({
        ...entry,
        requiredDefcon: (entry.yield > 50 ? 1 : 2) as 1 | 2,
      }))
      .sort((a, b) => b.yield - a.yield);

    if (warheadEntries.length === 0) {
      toast({ title: 'No warheads ready', description: 'Build warheads before attempting to launch.' });
      return;
    }

    const deliverableWarheads = warheadEntries.filter(entry => S.defcon <= entry.requiredDefcon);

    if (deliverableWarheads.length === 0) {
      const minDefcon = Math.min(...warheadEntries.map(entry => entry.requiredDefcon));
      toast({
        title: 'DEFCON restriction',
        description: `Lower DEFCON to ${minDefcon} or less to deploy available warheads.`,
      });
      return;
    }

    const missileCount = player.missiles || 0;
    const bomberCount = player.bombers || 0;
    const submarineCount = player.submarines || 0;

    if (missileCount <= 0 && bomberCount <= 0 && submarineCount <= 0) {
      toast({ title: 'No launch platforms', description: 'Construct missiles, bombers, or submarines before attacking.' });
      return;
    }

    const deliveryOptions: PendingLaunchState['deliveryOptions'] = [
      { id: 'missile', label: 'ICBM', count: missileCount },
      { id: 'bomber', label: 'Strategic Bomber', count: bomberCount },
      { id: 'submarine', label: 'Ballistic Submarine', count: submarineCount },
    ];

    setPendingLaunch({
      target,
      warheads: deliverableWarheads,
      deliveryOptions,
    });
    setSelectedWarheadYield(deliverableWarheads[0]?.yield ?? null);
    const defaultDelivery = deliveryOptions.find(option => option.count > 0)?.id ?? null;
    setSelectedDeliveryMethod(defaultDelivery);
  }, [isGameStarted, isStrikePlannerOpen, selectedTargetId]);

  const resetLaunchControl = useCallback(() => {
    setPendingLaunch(null);
    setSelectedWarheadYield(null);
    setSelectedDeliveryMethod(null);
  }, []);

  const confirmPendingLaunch = useCallback(() => {
    if (!pendingLaunch || selectedWarheadYield === null || !selectedDeliveryMethod) {
      return;
    }

    const player = PlayerManager.get();
    if (!player) {
      resetLaunchControl();
      return;
    }

    const selectedWarhead = pendingLaunch.warheads.find(warhead => warhead.yield === selectedWarheadYield);
    if (!selectedWarhead) {
      toast({ title: 'Warhead unavailable', description: 'Select a valid warhead yield before launching.' });
      return;
    }

    if (S.defcon > selectedWarhead.requiredDefcon) {
      toast({
        title: 'DEFCON restriction',
        description: `Lower DEFCON to ${selectedWarhead.requiredDefcon} or less to deploy a ${selectedWarheadYield}MT warhead.`,
      });
      return;
    }

    const availableWarheads = player.warheads?.[selectedWarheadYield] ?? 0;
    if (availableWarheads <= 0) {
      toast({ title: 'Warhead unavailable', description: 'Selected warhead is no longer ready for launch.' });
      resetLaunchControl();
      return;
    }

    const missileCount = player.missiles || 0;
    const bomberCount = player.bombers || 0;
    const submarineCount = player.submarines || 0;

    if (selectedDeliveryMethod === 'missile' && missileCount <= 0) {
      toast({ title: 'No ICBMs ready', description: 'Select another delivery platform or build additional missiles.' });
      return;
    }

    if (selectedDeliveryMethod === 'bomber' && bomberCount <= 0) {
      toast({ title: 'No bombers ready', description: 'Select another delivery platform or build additional bombers.' });
      return;
    }

    if (selectedDeliveryMethod === 'submarine' && submarineCount <= 0) {
      toast({ title: 'No submarines ready', description: 'Select another delivery platform or build additional submarines.' });
      return;
    }

    let launchSucceeded = false;

    if (selectedDeliveryMethod === 'missile') {
      launchSucceeded = launch(player, pendingLaunch.target, selectedWarheadYield);
    } else {
      player.warheads = player.warheads || {};
      const remaining = (player.warheads[selectedWarheadYield] || 0) - 1;
      if (remaining <= 0) {
        delete player.warheads[selectedWarheadYield];
      } else {
        player.warheads[selectedWarheadYield] = remaining;
      }

      if (selectedDeliveryMethod === 'bomber') {
        player.bombers = Math.max(0, bomberCount - 1);
        launchSucceeded = launchBomber(player, pendingLaunch.target, { yield: selectedWarheadYield });
        if (launchSucceeded) {
          log(`${player.name} dispatches bomber strike (${selectedWarheadYield}MT) toward ${pendingLaunch.target.name}`);
          DoomsdayClock.tick(0.3);
          AudioSys.playSFX('launch');
        }
      } else if (selectedDeliveryMethod === 'submarine') {
        player.submarines = Math.max(0, submarineCount - 1);
        launchSucceeded = launchSubmarine(player, pendingLaunch.target, selectedWarheadYield);
        if (launchSucceeded) {
          log(`${player.name} launches submarine strike (${selectedWarheadYield}MT) toward ${pendingLaunch.target.name}`);
          DoomsdayClock.tick(0.3);
        }
      }
    }

    if (launchSucceeded) {
      consumeAction();
      resetLaunchControl();
    }
  }, [pendingLaunch, resetLaunchControl, selectedDeliveryMethod, selectedWarheadYield]);

  const startGame = useCallback((leaderOverride?: string, doctrineOverride?: string) => {
    const leaderToUse = leaderOverride ?? selectedLeader;
    const doctrineToUse = doctrineOverride ?? selectedDoctrine;

    if (!leaderToUse || !doctrineToUse) {
      return;
    }
    S.selectedLeader = leaderToUse;
    S.selectedDoctrine = doctrineToUse;
    S.playerName = leaderToUse;
    setIsGameStarted(true);
  }, [selectedLeader, selectedDoctrine]);

  const openModal = useCallback((title: string, content: ModalContentValue) => {
    setModalContent({ title, content });
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
  }, []);

  const renderMilitaryModal = useCallback((): ReactNode => {
    const player = PlayerManager.get() as LocalNation | null;
    if (!player) {
      return <div className="text-sm text-cyan-200">No player nation data available.</div>;
    }

    const playerUnits = getConventionalUnitsForNation(player.id);
    const territoryList = Object.values(conventionalTerritories);
    const templates = Object.values(conventionalTemplatesMap);
    const recentLogs = [...conventionalLogs].slice(-6).reverse();

    const profile: NationConventionalProfile = {
      ...(player.conventional ?? createDefaultNationConventionalProfile()),
      reserve: playerUnits.filter(unit => unit.status === 'reserve').length,
      deployedUnits: playerUnits.filter(unit => unit.status === 'deployed').map(unit => unit.id),
    };

    const handleTrain = (templateId: string) => {
      const result = trainConventionalUnit(player.id, templateId);
      if (!result.success) {
        let description = 'Requested formation template is unavailable.';
        if (result.reason === 'Insufficient resources') {
          description = 'Production, intel, or uranium shortfall for this formation.';
        } else if (result.reason === 'Requires research unlock') {
          const researchId = 'requiresResearchId' in result ? result.requiresResearchId : undefined;
          const researchName = researchId ? RESEARCH_LOOKUP[researchId]?.name ?? 'required research unlock' : 'required research unlock';
          description = `Complete ${researchName} before queuing this formation.`;
        } else if (result.reason === 'Unknown nation') {
          description = 'Unable to identify the requesting command authority.';
        }

        toast({
          title: 'Unable to queue formation',
          description,
        });
        return;
      }

      const template = conventionalTemplatesMap[templateId];
      toast({ title: 'Formation queued', description: `${template?.name ?? 'New unit'} added to reserves.` });
      addNewsItem('military', `${player.name} mobilises ${template?.name ?? 'new forces'}`, 'important');
    };

    const handleDeployUnit = (unitId: string, territoryId: string) => {
      const result = deployConventionalUnit(unitId, territoryId);
      if (!result.success) {
        toast({ title: 'Deployment failed', description: result.reason ?? 'Unable to deploy selected unit.' });
        return;
      }

      const territory = conventionalTerritories[territoryId];
      toast({
        title: 'Unit deployed',
        description: `${player.name} reinforces ${territory?.name ?? 'forward position'}.`,
      });
      addNewsItem('military', `${player.name} deploys assets to ${territory?.name ?? territoryId}`, 'important');
    };

    const handleBorderConflict = (territoryId: string, defenderId: string) => {
      const territory = conventionalTerritories[territoryId];
      const result = resolveConventionalBorderConflict(territoryId, player.id, defenderId);
      if (!result.success) {
        toast({ title: 'Conflict aborted', description: 'Border offensive could not be executed.' });
        return;
      }

      toast({
        title: result.attackerVictory ? 'Border seized' : 'Advance repelled',
        description: `${territory?.name ?? 'Target region'} engagement odds ${(result.odds * 100).toFixed(0)}%.`,
      });
      addNewsItem(
        'military',
        result.attackerVictory
          ? `${player.name} captures ${territory?.name ?? territoryId}`
          : `${player.name} fails to secure ${territory?.name ?? territoryId}`,
        result.attackerVictory ? 'critical' : 'urgent'
      );
    };

    const handleProxyEngagement = (territoryId: string, opposingId: string) => {
      const territory = conventionalTerritories[territoryId];
      const result = resolveConventionalProxyEngagement(territoryId, player.id, opposingId);
      if (!result.success) {
        toast({ title: 'Proxy engagement failed', description: 'Unable to project forces into this theatre.' });
        return;
      }

      toast({
        title: result.sponsorSuccess ? 'Proxy victory' : 'Proxy setback',
        description: `${territory?.name ?? 'Region'} influence shifted ${(result.odds * 100).toFixed(0)}% odds.`,
      });
      addNewsItem(
        'military',
        result.sponsorSuccess
          ? `${player.name} proxy gains in ${territory?.name ?? territoryId}`
          : `${player.name} proxy loses ground in ${territory?.name ?? territoryId}`,
        result.sponsorSuccess ? 'important' : 'urgent'
      );
    };

    return (
      <div className="space-y-6">
        <ConventionalForcesPanel
          templates={templates}
          units={playerUnits}
          territories={territoryList}
          profile={profile}
          onTrain={handleTrain}
          onDeploy={handleDeployUnit}
          researchUnlocks={player.researched ?? {}}
        />

        <section className="rounded border border-cyan-500/40 bg-black/60 p-4">
          <header className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold tracking-[0.3em] text-cyan-300">Theatre Overview</h3>
            <span className="text-[11px] font-mono text-cyan-300/80">{territoryList.length} theatres monitored</span>
          </header>
          <TerritoryMapPanel
            territories={territoryList}
            units={Object.values(conventionalUnits)}
            playerId={player.id}
            onBorderConflict={handleBorderConflict}
            onProxyEngagement={handleProxyEngagement}
          />
        </section>

        <section className="rounded border border-cyan-500/30 bg-black/60 p-4">
          <header className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold tracking-[0.3em] text-cyan-300">Recent Engagements</h3>
            <span className="text-[11px] font-mono text-cyan-300/80">{recentLogs.length} events</span>
          </header>
          <div className="space-y-2">
            {recentLogs.length === 0 && (
              <p className="text-[11px] text-cyan-300/70">No conventional engagements recorded this campaign.</p>
            )}
            {recentLogs.map(logEntry => (
              <div key={logEntry.id} className="rounded border border-cyan-500/20 bg-black/40 p-3">
                <div className="flex items-center justify-between text-[11px] font-mono text-cyan-300/90">
                  <span>{logEntry.summary}</span>
                  <span>Turn {logEntry.turn}</span>
                </div>
                <div className="mt-1 text-[10px] text-cyan-300/70">
                  Casualties: {Object.entries(logEntry.casualties)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(' • ')}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }, [
    addNewsItem,
    conventionalLogs,
    conventionalTemplatesMap,
    conventionalTerritories,
    conventionalUnits,
    deployConventionalUnit,
    getConventionalUnitsForNation,
    resolveConventionalBorderConflict,
    resolveConventionalProxyEngagement,
    toast,
    trainConventionalUnit,
  ]);

  const handleMilitary = useCallback(() => {
    openModal('CONVENTIONAL COMMAND', renderMilitaryModal);
  }, [openModal, renderMilitaryModal]);

  const renderResearchModal = useCallback((): ReactNode => {
    const player = PlayerManager.get();
    if (!player) {
      return <div className="text-sm text-cyan-200">No nation data available.</div>;
    }

    const activeQueue = player.researchQueue;
    const activeProject = activeQueue ? RESEARCH_LOOKUP[activeQueue.projectId] : null;
    const progress = activeQueue && activeQueue.totalTurns > 0
      ? Math.round(((activeQueue.totalTurns - activeQueue.turnsRemaining) / activeQueue.totalTurns) * 100)
      : 0;

    const categories: { id: ResearchProject['category']; label: string }[] = [
      { id: 'warhead', label: 'Warhead Programs' },
      { id: 'delivery', label: 'Strategic Delivery Systems' },
      { id: 'defense', label: 'Defense Initiatives' },
      { id: 'intel', label: 'Intelligence Operations' },
      { id: 'cyber', label: 'Cyber Warfare' },
      { id: 'conventional', label: 'Conventional Forces' },
      { id: 'economy', label: 'Economic Development' },
      { id: 'culture', label: 'Cultural Influence' },
      { id: 'space', label: 'Space Superiority' },
      { id: 'intelligence', label: 'Covert Operations' },
    ];

    const formatCost = (cost: ResourceCost) => {
      const parts = Object.entries(cost)
        .filter(([, amount]) => (amount || 0) > 0)
        .map(([resource, amount]) => `${amount} ${resource.toUpperCase()}`);
      return parts.length > 0 ? parts.join(' • ') : 'No cost';
    };

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-cyan-300 mb-2">Research Focus</h3>
          {activeProject ? (
            <div className="border border-cyan-600/60 rounded p-4 bg-black/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-cyan-200">{activeProject.name}</span>
                <span className="text-sm text-cyan-300">{progress}%</span>
              </div>
              <p className="text-sm text-cyan-200/70">{activeProject.description}</p>
              <div className="h-2 bg-cyan-900 rounded overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
              <div className="text-xs text-cyan-200/80">
                Turns remaining: {activeQueue.turnsRemaining}/{activeQueue.totalTurns}
              </div>
            </div>
          ) : (
            <div className="text-sm text-cyan-200/80">
              No active project. Select a program below to begin research.
            </div>
          )}
        </div>

        {categories.map(category => {
          const projects = RESEARCH_TREE.filter(project => project.category === category.id);
          if (projects.length === 0) return null;

          return (
            <div key={category.id} className="space-y-3">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-cyan-400">
                {category.label}
              </h4>
              {projects.map(project => {
                const isUnlocked = !!player.researched?.[project.id];
                const prerequisitesMet = (project.prerequisites || []).every(req => player.researched?.[req]);
                const affordable = canAfford(player, project.cost);
                const disabled = isUnlocked || !prerequisitesMet || !!activeQueue || !affordable;

                return (
                  <div key={project.id} className="border border-cyan-700/70 rounded p-4 bg-black/50 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-semibold text-cyan-200">{project.name}</div>
                        <div className="text-xs text-cyan-200/70 uppercase">
                          {project.turns} turns • Cost: {formatCost(project.cost)}
                        </div>
                      </div>
                      {isUnlocked ? (
                        <span className="text-green-400 text-xs font-semibold">UNLOCKED</span>
                      ) : (
                        <Button
                          size="sm"
                          className="bg-cyan-700 hover:bg-cyan-600 text-black"
                          disabled={disabled}
                          onClick={() => startResearch(project.id)}
                        >
                          START
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-cyan-100/80">{project.description}</p>
                    {project.yield ? (
                      <div className="text-xs text-cyan-200/70">
                        Unlocks deployment of {project.yield}MT warheads.
                      </div>
                    ) : null}
                    {project.prerequisites && project.prerequisites.length > 0 ? (
                      <div className="text-xs text-cyan-200/70">
                        Prerequisites:{' '}
                        {project.prerequisites.map(req => {
                          const met = !!player.researched?.[req];
                          const name = RESEARCH_LOOKUP[req]?.name || req;
                          return (
                            <span key={req} className={met ? 'text-green-400' : 'text-red-400'}>
                              {name}
                            </span>
                          );
                        }).reduce((acc, elem, idx, arr) => {
                          acc.push(elem);
                          if (idx < arr.length - 1) acc.push(<span key={`sep-${project.id}-${idx}`}> • </span>);
                          return acc;
                        }, [] as ReactNode[])}
                      </div>
                    ) : null}
                    {!isUnlocked && !prerequisitesMet ? (
                      <div className="text-xs text-yellow-300/80">
                        Complete prerequisite programs first.
                      </div>
                    ) : null}
                    {!isUnlocked && prerequisitesMet && !affordable ? (
                      <div className="text-xs text-yellow-300/80">
                        Additional resources required to begin this project.
                      </div>
                    ) : null}
                    {!isUnlocked && prerequisitesMet && affordable && activeQueue ? (
                      <div className="text-xs text-yellow-300/80">
                        Another project is currently underway.
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          );
        })}
        <div className="flex justify-end pt-2">
          <Button type="button" onClick={closeModal} className="bg-cyan-500 text-black hover:bg-cyan-400">
            Close [ESC]
          </Button>
        </div>
      </div>
    );
  }, [closeModal]);

  const getBuildContext = useCallback((actionLabel: string): Nation | null => {
    if (!isGameStarted) {
      toast({ title: 'Simulation inactive', description: 'Start the scenario before issuing build orders.' });
      return null;
    }

    if (S.gameOver) {
      toast({ title: 'Conflict resolved', description: 'Further production orders are unnecessary.' });
      return null;
    }

    const player = PlayerManager.get();
    if (!player) {
      toast({ title: 'No command authority', description: 'Unable to locate the player nation.' });
      return null;
    }

    if (S.phase !== 'PLAYER') {
      toast({ title: 'Out of phase', description: `${actionLabel} orders can only be issued during the player phase.` });
      return null;
    }

    if (S.actionsRemaining <= 0) {
      toast({
        title: 'No actions remaining',
        description: 'End the turn or adjust DEFCON to regain command capacity.',
      });
      return null;
    }

    return player;
  }, [isGameStarted]);

  const buildMissile = useCallback(() => {
    const player = getBuildContext('Build');
    if (!player) return;

    if (!canAfford(player, COSTS.missile)) {
      toast({ title: 'Insufficient production', description: 'You need 8 production to assemble an ICBM.' });
      return;
    }

    pay(player, COSTS.missile);
    player.missiles = (player.missiles || 0) + 1;

    AudioSys.playSFX('build');
    log(`${player.name} builds a missile`);
    toast({ 
      title: '🚀 ICBM Constructed', 
      description: `Strategic arsenal increased to ${player.missiles} missiles.`,
    });
    updateDisplay();
    consumeAction();
    closeModal();
  }, [closeModal, getBuildContext]);

  const buildBomber = useCallback(() => {
    const player = getBuildContext('Build');
    if (!player) return;

    if (!canAfford(player, COSTS.bomber)) {
      toast({ title: 'Insufficient production', description: 'Strategic bombers cost 20 production to deploy.' });
      return;
    }

    pay(player, COSTS.bomber);
    player.bombers = (player.bombers || 0) + 1;

    AudioSys.playSFX('build');
    log(`${player.name} commissions a strategic bomber`);
    toast({ 
      title: '✈️ Bomber Wing Deployed', 
      description: `Strategic bomber fleet expanded to ${player.bombers} wings.`,
    });
    updateDisplay();
    consumeAction();
    closeModal();
  }, [closeModal, getBuildContext]);

  const buildDefense = useCallback(() => {
    const player = getBuildContext('Defense upgrade');
    if (!player) return;

    if (!canAfford(player, COSTS.defense)) {
      toast({ title: 'Insufficient production', description: 'Defense upgrades require 15 production.' });
      return;
    }

    pay(player, COSTS.defense);
    player.defense = (player.defense || 0) + 2;

    AudioSys.playSFX('build');
    log(`${player.name} reinforces continental defense (+2)`);
    toast({ 
      title: '🛡️ Defense System Upgraded', 
      description: `ABM network strength increased to ${player.defense}.`,
    });
    updateDisplay();
    consumeAction();
    closeModal();
  }, [closeModal, getBuildContext]);

  const buildCity = useCallback(() => {
    const player = getBuildContext('Infrastructure');
    if (!player) return;

    const cityCost = getCityCost(player);
    if (!canAfford(player, cityCost)) {
      const costText = Object.entries(cityCost)
        .map(([resource, amount]) => `${amount} ${resource.toUpperCase()}`)
        .join(' & ');
      toast({ title: 'Insufficient production', description: `Constructing a new city requires ${costText}.` });
      return;
    }

    pay(player, cityCost);
    player.cities = (player.cities || 1) + 1;

    const spread = 6;
    const angle = Math.random() * Math.PI * 2;
    const newLat = player.lat + Math.sin(angle) * spread;
    const newLon = player.lon + Math.cos(angle) * spread;
    CityLights.addCity(newLat, newLon, 1.0);

    AudioSys.playSFX('build');
    log(`${player.name} establishes city #${player.cities}`);
    toast({ 
      title: '🏙️ City Established', 
      description: `Urban center ${player.cities} constructed. Population capacity increased.`,
    });
    updateDisplay();
    consumeAction();
    closeModal();
  }, [closeModal, getBuildContext]);

  const buildWarhead = useCallback((yieldMT: number) => {
    const player = getBuildContext('Warhead production');
    if (!player) return;

    const researchId = WARHEAD_YIELD_TO_ID.get(yieldMT);
    if (researchId && !player.researched?.[researchId]) {
      const projectName = RESEARCH_LOOKUP[researchId]?.name || `${yieldMT}MT program`;
      toast({ title: 'Technology unavailable', description: `Research ${projectName} before producing this warhead.` });
      return;
    }

    const costKey = `warhead_${yieldMT}` as keyof typeof COSTS;
    const cost = COSTS[costKey];
    if (!cost) {
      toast({ title: 'Unknown cost', description: `No cost data for ${yieldMT}MT warheads.` });
      return;
    }

    if (!canAfford(player, cost)) {
      const requirements = Object.entries(cost)
        .map(([resource, amount]) => `${amount} ${resource.toUpperCase()}`)
        .join(' & ');
      toast({ title: 'Insufficient resources', description: `Producing this warhead requires ${requirements}.` });
      return;
    }

    pay(player, cost);
    player.warheads = player.warheads || {};
    player.warheads[yieldMT] = (player.warheads[yieldMT] || 0) + 1;

    AudioSys.playSFX('build');
    log(`${player.name} assembles a ${yieldMT}MT warhead`);
    toast({ 
      title: '☢️ Warhead Assembled', 
      description: `${yieldMT}MT warhead added. Stockpile: ${player.warheads[yieldMT]} units.`,
    });
    updateDisplay();
    consumeAction();
    closeModal();
  }, [closeModal, getBuildContext]);

  const renderBuildModal = useCallback((): ReactNode => {
    const player = PlayerManager.get();
    if (!player) {
      return <div className="text-sm text-cyan-200">No nation data available.</div>;
    }

    const actionAvailable =
      isGameStarted && !S.gameOver && S.phase === 'PLAYER' && S.actionsRemaining > 0;

    let actionMessage: { tone: 'info' | 'warning'; text: string } | null = null;
    if (!isGameStarted) {
      actionMessage = {
        tone: 'warning',
        text: 'Begin the simulation to issue strategic production orders.',
      };
    } else if (S.gameOver) {
      actionMessage = {
        tone: 'warning',
        text: 'The conflict has concluded. Production lines stand down.',
      };
    } else if (S.phase !== 'PLAYER') {
      actionMessage = {
        tone: 'warning',
        text: 'Await the player phase before issuing new build directives.',
      };
    } else if (S.actionsRemaining <= 0) {
      actionMessage = {
        tone: 'warning',
        text: 'Command capacity exhausted. End the turn or adjust DEFCON to regain actions.',
      };
    }

    const formatCost = (cost: ResourceCost) => {
      const parts = Object.entries(cost)
        .filter(([, amount]) => (amount || 0) > 0)
        .map(([resource, amount]) => `${amount} ${resource.toUpperCase()}`);
      return parts.length > 0 ? parts.join(' • ') : 'No cost';
    };

    type PlayerResourceKey = 'production' | 'intel' | 'uranium';

    const resourceGapText = (cost: ResourceCost) => {
      const missing = Object.entries(cost)
        .map(([resource, amount]) => {
          const required = amount || 0;
          const key = resource as PlayerResourceKey;
          const current = player[key] ?? 0;
          const deficit = required - current;
          if (deficit <= 0) return null;
          return `${deficit} ${resource.toUpperCase()}`;
        })
        .filter(Boolean) as string[];
      return missing.length ? `Requires ${missing.join(' & ')}` : null;
    };

    const cityCost = getCityCost(player);
    const nextCityNumber = (player.cities || 1) + 1;

    type BuildOption = {
      key: string;
      label: string;
      description: string;
      cost: ResourceCost;
      onClick: () => void;
      statusLine?: string;
      requirementMessage?: string | null;
    };

    const deliveryOptions: BuildOption[] = [
      {
        key: 'missile',
        label: 'Build Missile',
        description: 'Add an ICBM to your strategic arsenal.',
        cost: COSTS.missile,
        onClick: buildMissile,
        statusLine: `Ready missiles: ${player.missiles || 0}`,
      },
      {
        key: 'bomber',
        label: 'Build Bomber',
        description: 'Deploy a strategic bomber wing for flexible delivery.',
        cost: COSTS.bomber,
        onClick: buildBomber,
        statusLine: `Available bombers: ${player.bombers || 0}`,
      },
      {
        key: 'defense',
        label: 'Upgrade Defense (+2)',
        description: 'Invest in ABM systems to harden your defenses.',
        cost: COSTS.defense,
        onClick: buildDefense,
        statusLine: `Current defense: ${player.defense || 0}`,
      },
    ];

    const infrastructureOptions: BuildOption[] = [
      {
        key: 'city',
        label: `Build City #${nextCityNumber}`,
        description: 'Expand industrial capacity and resource yields.',
        cost: cityCost,
        onClick: buildCity,
        statusLine: `Existing cities: ${player.cities || 1}`,
      },
    ];

    const warheadYields = [10, 20, 40, 50, 100, 200];
    const warheadOptions: BuildOption[] = warheadYields
      .map(yieldMT => {
        const costKey = `warhead_${yieldMT}` as keyof typeof COSTS;
        const cost = COSTS[costKey];
        if (!cost) return null;

        const researchId = WARHEAD_YIELD_TO_ID.get(yieldMT);
        const hasResearch = !researchId || !!player.researched?.[researchId];
        const requirementMessage = hasResearch
          ? null
          : `Research ${RESEARCH_LOOKUP[researchId!]?.name ?? `${yieldMT}MT program`} to unlock.`;

        return {
          key: `warhead-${yieldMT}`,
          label: `Assemble ${yieldMT}MT Warhead`,
          description: `Increase your nuclear stockpile with a ${yieldMT}MT device.`,
          cost,
          onClick: () => buildWarhead(yieldMT),
          statusLine: `Stock: ${player.warheads?.[yieldMT] || 0}`,
          requirementMessage,
        } satisfies BuildOption;
      })
      .filter(Boolean) as BuildOption[];

    const renderOption = (option: BuildOption) => {
      const affordable = canAfford(player, option.cost);
      const requirement = option.requirementMessage || null;
      const disabled = !actionAvailable || !affordable || !!requirement;

      const reasons: string[] = [];
      if (!actionAvailable && actionMessage) {
        reasons.push(actionMessage.text);
      }
      if (requirement) {
        reasons.push(requirement);
      }
      if (!affordable) {
        const gap = resourceGapText(option.cost);
        if (gap) {
          reasons.push(gap);
        }
      }

      const disabledReason = reasons.join(' • ');

      return (
        <div
          key={option.key}
          className="rounded border border-cyan-700/70 bg-black/60 p-4 shadow-[0_0_12px_rgba(0,255,255,0.08)]"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="font-semibold text-cyan-100">{option.label}</div>
              <div className="text-xs text-cyan-200/70 uppercase">Cost: {formatCost(option.cost)}</div>
              <div className="text-xs text-cyan-200/80">{option.description}</div>
              {option.statusLine ? (
                <div className="text-xs text-cyan-200/60">{option.statusLine}</div>
              ) : null}
            </div>
            <Button
              onClick={option.onClick}
              disabled={disabled}
              title={disabledReason || 'Issue production order'}
              className={`px-3 py-2 text-sm font-semibold transition-colors ${
                disabled
                  ? 'bg-cyan-900/40 text-cyan-200/40 cursor-not-allowed'
                  : 'bg-cyan-600 text-black hover:bg-cyan-500'
              }`}
            >
              {disabled ? 'Unavailable' : 'Order' }
            </Button>
          </div>
          {disabledReason ? (
            <div className="mt-3 text-xs text-yellow-300/80">{disabledReason}</div>
          ) : null}
        </div>
      );
    };

    return (
      <div className="space-y-5">
        {actionMessage ? (
          <div
            className={`rounded border p-3 text-xs ${
              actionMessage.tone === 'warning'
                ? 'border-yellow-400/60 bg-yellow-900/10 text-yellow-200'
                : 'border-cyan-400/60 bg-cyan-900/10 text-cyan-200'
            }`}
          >
            {actionMessage.text}
          </div>
        ) : null}

        <div className="space-y-4">
          <div>
            <h3 className="mb-2 text-sm font-semibold tracking-wide text-cyan-300">DELIVERY & DEFENSE</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {deliveryOptions.map(renderOption)}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold tracking-wide text-cyan-300">INFRASTRUCTURE</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {infrastructureOptions.map(renderOption)}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold tracking-wide text-cyan-300">WARHEAD PRODUCTION</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {warheadOptions.map(renderOption)}
            </div>
          </div>
        </div>
      </div>
    );
  }, [buildBomber, buildCity, buildDefense, buildMissile, buildWarhead, isGameStarted]);

  const handleBuild = useCallback(async () => {
    const approved = await requestApproval('BUILD', { description: 'Strategic production request' });
    if (!approved) return;
    AudioSys.playSFX('click');
    openModal('STRATEGIC PRODUCTION', renderBuildModal);
  }, [openModal, renderBuildModal, requestApproval]);

  const handleResearch = useCallback(async () => {
    const approved = await requestApproval('RESEARCH', { description: 'Research directive access' });
    if (!approved) return;
    AudioSys.playSFX('click');
    openModal('RESEARCH DIRECTORATE', renderResearchModal);
  }, [openModal, renderResearchModal, requestApproval]);

  const handleIntel = useCallback(async () => {
    const approved = await requestApproval('INTEL', { description: 'Intelligence operations authorization' });
    if (!approved) return;
    AudioSys.playSFX('click');
    const player = getBuildContext('Intelligence');
    if (!player) return;

    const cyberAttackAvailability = getCyberActionAvailability(player.id, 'intrusion');
    const cyberDefenseAvailability = getCyberActionAvailability(player.id, 'fortify');
    const cyberFalseFlagAvailability = getCyberActionAvailability(player.id, 'false_flag');

    const cyberActions: OperationAction[] = [
      {
        id: 'cyber_attack',
        title: 'CYBER INTRUSION',
        subtitle: 'Drain enemy readiness & intel',
        costText: `Cost: ${cyberAttackAvailability.cost} CYBER`,
        requiresTarget: true,
        disabled: !cyberAttackAvailability.canExecute,
        disabledReason: cyberAttackAvailability.reason,
        targetFilter: (nation, commander) => isEligibleEnemyTarget(commander, nation),
      },
      {
        id: 'cyber_defend',
        title: 'HARDEN NETWORKS',
        subtitle: 'Restore readiness reserves',
        costText: `Cost: ${cyberDefenseAvailability.cost} CYBER`,
        disabled: !cyberDefenseAvailability.canExecute,
        disabledReason: cyberDefenseAvailability.reason,
      },
      {
        id: 'cyber_false_flag',
        title: 'FALSE FLAG BREACH',
        subtitle: 'Frame a rival for aggression',
        costText: `Cost: ${cyberFalseFlagAvailability.cost} CYBER`,
        requiresTarget: true,
        disabled: !cyberFalseFlagAvailability.canExecute,
        disabledReason: cyberFalseFlagAvailability.reason,
        description: 'Stage an intrusion that points forensic evidence toward another rival.',
        targetFilter: (nation, commander) => isEligibleEnemyTarget(commander, nation),
      },
    ];

    const intelActions: OperationAction[] = [
      ...cyberActions,
      {
        id: 'satellite',
        title: 'DEPLOY SATELLITE',
        subtitle: 'Reveal enemy arsenal',
        costText: 'Cost: 5 INTEL',
        requiresTarget: true,
        disabled: (player.intel || 0) < 5,
        disabledReason: 'Requires 5 INTEL to deploy a satellite.',
      },
      ...(player.hasASATCapability ? [{
        id: 'asat_strike' as const,
        title: 'ASAT STRIKE',
        subtitle: 'Destroy enemy satellite',
        costText: 'Cost: 15 INTEL + 5 URANIUM',
        requiresTarget: true,
        disabled: (player.intel || 0) < 15 || (player.uranium || 0) < 5,
        disabledReason: 'Requires 15 INTEL and 5 URANIUM to launch ASAT weapon.',
        targetFilter: (nation: Nation) => nation.satellites && Object.keys(nation.satellites).length > 0,
      }] : []),
      ...(((player.orbitalStrikesAvailable || 0) > 0) ? [{
        id: 'orbital_strike' as const,
        title: 'ORBITAL STRIKE',
        subtitle: `Kinetic bombardment (${player.orbitalStrikesAvailable} left)`,
        costText: 'Cost: 50 INTEL + 30 URANIUM',
        requiresTarget: true,
        disabled: (player.intel || 0) < 50 || (player.uranium || 0) < 30,
        disabledReason: 'Requires 50 INTEL and 30 URANIUM for orbital strike.',
      }] : []),
      {
        id: 'sabotage',
        title: 'SABOTAGE',
        subtitle: 'Destroy enemy warhead',
        costText: 'Cost: 10 INTEL',
        requiresTarget: true,
        disabled: (player.intel || 0) < 10,
        disabledReason: 'Requires 10 INTEL to mount sabotage.',
        targetFilter: nation => Object.values(nation.warheads || {}).some(count => (count || 0) > 0),
      },
      {
        id: 'propaganda',
        title: 'PROPAGANDA',
        subtitle: 'Stoke enemy unrest',
        costText: 'Cost: 15 INTEL',
        requiresTarget: true,
        disabled: (player.intel || 0) < 15,
        disabledReason: 'Requires 15 INTEL to conduct propaganda.',
      },
      {
        id: 'culture_bomb',
        title: 'CULTURE BOMB',
        subtitle: 'Steal 10% population',
        costText: (() => {
          const baseCost = 20;
          const reduction = player.cultureBombCostReduction || 0;
          const actualCost = Math.ceil(baseCost * (1 - reduction));
          return `Cost: ${actualCost} INTEL${reduction > 0 ? ` (-${Math.floor(reduction * 100)}%)` : ''}`;
        })(),
        requiresTarget: true,
        disabled: (() => {
          const baseCost = 20;
          const reduction = player.cultureBombCostReduction || 0;
          const actualCost = Math.ceil(baseCost * (1 - reduction));
          return (player.intel || 0) < actualCost;
        })(),
        disabledReason: (() => {
          const baseCost = 20;
          const reduction = player.cultureBombCostReduction || 0;
          const actualCost = Math.ceil(baseCost * (1 - reduction));
          return `Requires ${actualCost} INTEL to deploy a culture bomb.`;
        })(),
        targetFilter: nation => nation.population > 5,
      },
      {
        id: 'view',
        title: 'VIEW INTELLIGENCE',
        subtitle: 'Review surveillance reports',
        description: 'Displays detailed data for nations under satellite coverage.',
      },
      {
        id: 'deep',
        title: 'DEEP RECON',
        subtitle: 'Reveal tech and doctrine',
        costText: 'Cost: 30 INTEL',
        requiresTarget: true,
        disabled: (player.intel || 0) < 30,
        disabledReason: 'Requires 30 INTEL to run deep reconnaissance.',
      },
      {
        id: 'cover',
        title: 'COVER OPS',
        subtitle: 'Hide your assets for 3 turns',
        costText: 'Cost: 25 INTEL',
        disabled: (player.intel || 0) < 25,
        disabledReason: 'Requires 25 INTEL to mask your forces.',
      }
    ];

    const executeIntelAction = (action: OperationAction, target?: Nation) => {
      const commander = PlayerManager.get();
      if (!commander) {
        toast({ title: 'No command authority', description: 'Player nation could not be located.' });
        return false;
      }

      switch (action.id) {
        case 'cyber_attack': {
          if (!target) return false;
          const outcome = launchCyberAttack(commander.id, target.id);
          if (!outcome.executed) {
            return false;
          }
          updateDisplay();
          consumeAction();
          return true;
        }

        case 'cyber_defend': {
          const outcome = hardenCyberNetworks(commander.id);
          if (!outcome.executed) {
            return false;
          }
          updateDisplay();
          consumeAction();
          return true;
        }

        case 'cyber_false_flag': {
          if (!target) return false;
          const outcome = launchCyberFalseFlag(commander.id, target.id);
          if (!outcome.executed) {
            return false;
          }
          updateDisplay();
          consumeAction();
          return true;
        }

        case 'view':
          openModal('INTELLIGENCE REPORT', <IntelReportContent player={commander} onClose={closeModal} />);
          return false;

        case 'satellite':
          if (!target) return false;
          if ((commander.intel || 0) < 5) {
            toast({ title: 'Insufficient intel', description: 'You need 5 INTEL to deploy a satellite.' });
            return false;
          }
          {
            // Check satellite limit
            const maxSats = commander.maxSatellites || 3;
            const currentSats = Object.keys(commander.satellites || {}).filter(id => commander.satellites?.[id]).length;
            if (currentSats >= maxSats) {
              toast({ title: 'Satellite limit reached', description: `Maximum ${maxSats} satellites deployed. Research Advanced Satellite Network for more slots.` });
              return false;
            }

            commander.intel -= 5;
            commander.satellites = commander.satellites || {};
            commander.satellites[target.id] = true;
            log(`Satellite deployed over ${target.name}`);
            registerSatelliteOrbit(commander.id, target.id);
          }
          updateDisplay();
          consumeAction();
          return true;

        case 'asat_strike':
          if (!target) return false;
          if ((commander.intel || 0) < 15 || (commander.uranium || 0) < 5) {
            toast({ title: 'Insufficient resources', description: 'You need 15 INTEL and 5 URANIUM for ASAT strike.' });
            return false;
          }
          {
            const targetSatellites = Object.keys(target.satellites || {}).filter(id => target.satellites?.[id]);
            if (targetSatellites.length === 0) {
              toast({ title: 'No satellites', description: `${target.name} has no satellites to destroy.` });
              return false;
            }
            // Destroy a random satellite
            const randomSat = targetSatellites[Math.floor(Math.random() * targetSatellites.length)];
            if (target.satellites) {
              delete target.satellites[randomSat];
            }
            commander.intel -= 15;
            commander.uranium -= 5;
            log(`ASAT strike destroys ${target.name}'s satellite!`, 'alert');
            increaseThreat(target, commander.id, 15);
          }
          updateDisplay();
          consumeAction();
          return true;

        case 'orbital_strike':
          if (!target) return false;
          if ((commander.intel || 0) < 50 || (commander.uranium || 0) < 30) {
            toast({ title: 'Insufficient resources', description: 'You need 50 INTEL and 30 URANIUM for orbital strike.' });
            return false;
          }
          if ((commander.orbitalStrikesAvailable || 0) <= 0) {
            toast({ title: 'No strikes available', description: 'No orbital strikes remaining.' });
            return false;
          }
          {
            // Orbital strike: massive damage
            const popLoss = Math.floor(target.population * 0.15);
            const prodLoss = Math.floor((target.production || 0) * 0.20);
            const warheadTypes = Object.keys(target.warheads || {});
            const warheadsDestroyed = Math.min(3, warheadTypes.length);

            target.population = Math.max(0, target.population - popLoss);
            target.production = Math.max(0, (target.production || 0) - prodLoss);

            // Destroy random warheads
            for (let i = 0; i < warheadsDestroyed; i++) {
              if (warheadTypes.length > 0) {
                const idx = Math.floor(Math.random() * warheadTypes.length);
                const type = Number(warheadTypes[idx]);
                if (target.warheads && target.warheads[type]) {
                  target.warheads[type] = Math.max(0, target.warheads[type] - 1);
                  if (target.warheads[type] <= 0) {
                    delete target.warheads[type];
                  }
                }
                warheadTypes.splice(idx, 1);
              }
            }

            commander.intel -= 50;
            commander.uranium -= 30;
            commander.orbitalStrikesAvailable = (commander.orbitalStrikesAvailable || 1) - 1;

            log(`☄️ ORBITAL STRIKE devastates ${target.name}: ${popLoss}M casualties, ${warheadsDestroyed} warheads destroyed!`, 'alert');
            increaseThreat(target, commander.id, 35);
            S.defcon = Math.max(1, S.defcon - 1);
          }
          updateDisplay();
          consumeAction();
          return true;

        case 'sabotage':
          if (!target) return false;
          if ((commander.intel || 0) < 10) {
            toast({ title: 'Insufficient intel', description: 'You need 10 INTEL for sabotage operations.' });
            return false;
          }
          {
            const warheadTypes = Object.keys(target.warheads || {}).filter(key => (target.warheads?.[Number(key)] || target.warheads?.[key as any]) > 0);
            if (warheadTypes.length === 0) {
              toast({ title: 'No targets', description: `${target.name} has no active warheads to sabotage.` });
              return false;
            }
            const type = warheadTypes[Math.floor(Math.random() * warheadTypes.length)];
            const numericType = Number(type);
            if (target.warheads) {
              target.warheads[numericType] = Math.max(0, (target.warheads[numericType] || 0) - 1);
              if (target.warheads[numericType] <= 0) {
                delete target.warheads[numericType];
              }
            }
            commander.intel -= 10;

            // Apply sabotage detection reduction from Deep Cover Operations tech
            const baseDetectionChance = 0.40;
            const detectionReduction = commander.sabotageDetectionReduction || 0;
            const actualDetectionChance = Math.max(0.05, baseDetectionChance - detectionReduction);

            if (Math.random() < actualDetectionChance) {
              log(`Sabotage successful: ${target.name}'s ${type}MT warhead destroyed (DETECTED).`, 'warning');
              increaseThreat(target, commander.id, 20);
            } else {
              log(`Sabotage successful: ${target.name}'s ${type}MT warhead destroyed.`);
            }
          }
          updateDisplay();
          consumeAction();
          return true;

        case 'propaganda':
          if (!target) return false;
          if ((commander.intel || 0) < 15) {
            toast({ title: 'Insufficient intel', description: 'You need 15 INTEL for propaganda operations.' });
            return false;
          }
          {
            commander.intel -= 15;

            // Apply propaganda effectiveness bonus from Propaganda Mastery tech
            const baseInstability = 20;
            const effectiveness = commander.memeWaveEffectiveness || 1.0;
            const actualInstability = Math.floor(baseInstability * effectiveness);

            target.instability = (target.instability || 0) + actualInstability;
            log(`Propaganda campaign spikes instability in ${target.name} (+${actualInstability}).`);
          }
          updateDisplay();
          consumeAction();
          return true;

        case 'culture_bomb':
          if (!target) return false;
          {
            // Apply culture bomb cost reduction from tech
            const baseCost = 20;
            const costReduction = commander.cultureBombCostReduction || 0;
            const actualCost = Math.ceil(baseCost * (1 - costReduction));

            if ((commander.intel || 0) < actualCost) {
              toast({ title: 'Insufficient intel', description: `You need ${actualCost} INTEL for a culture bomb.` });
              return false;
            }

            // Apply stolen pop conversion rate bonus
            const baseStolen = Math.floor(target.population * 0.1);
            const conversionRate = commander.stolenPopConversionRate || 1.0;
            const stolen = Math.max(1, Math.floor(baseStolen * conversionRate));

            commander.intel -= actualCost;
            target.population = Math.max(0, target.population - stolen);
            commander.population += stolen;
            commander.migrantsThisTurn = (commander.migrantsThisTurn || 0) + stolen;
            commander.migrantsTotal = (commander.migrantsTotal || 0) + stolen;
            log(`Culture bomb siphons ${stolen}M population from ${target.name}.`);
          }
          updateDisplay();
          consumeAction();
          return true;

        case 'deep':
          if (!target) return false;
          if ((commander.intel || 0) < 30) {
            toast({ title: 'Insufficient intel', description: 'You need 30 INTEL for deep reconnaissance.' });
            return false;
          }
          commander.intel -= 30;
          commander.satellites = commander.satellites || {};
          commander.satellites[target.id] = true;
          commander.deepRecon = commander.deepRecon || {};
          commander.deepRecon[target.id] = (commander.deepRecon[target.id] || 0) + 3;
          log(`Deep recon initiated over ${target.name}. Detailed intel for 3 turns.`);
          registerSatelliteOrbit(commander.id, target.id);
          updateDisplay();
          consumeAction();
          return true;

        case 'cover':
          if ((commander.intel || 0) < 25) {
            toast({ title: 'Insufficient intel', description: 'You need 25 INTEL to initiate cover operations.' });
            return false;
          }
          commander.intel -= 25;
          commander.coverOpsTurns = (commander.coverOpsTurns || 0) + 3;
          log('Cover operations active: your forces are hidden for 3 turns.');
          updateDisplay();
          consumeAction();
          return true;
      }

      return false;
    };

    openModal(
      'INTELLIGENCE OPS',
      <OperationModal
        actions={intelActions}
        player={player}
        targetableNations={targetableNations}
        onExecute={executeIntelAction}
        onClose={closeModal}
        accent="cyan"
      />
    );
  }, [closeModal, getBuildContext, openModal, targetableNations]);

  const handleBioWarfareLabToggle = useCallback(async () => {
    if (!bioWarfareAvailable) {
      // Auto-enable settings if both are disabled
      if (!pandemicIntegrationEnabled) {
        setPandemicIntegrationEnabled(true);
      }
      if (!bioWarfareEnabled) {
        setBioWarfareEnabled(true);
      }

      toast({
        title: 'BioForge Initialized',
        description: 'Pandemic integration and bio-weapon systems activated. Opening lab...',
        duration: 2000,
      });

      // Open lab after short delay to show the toast
      setTimeout(() => {
        setIsBioWarfareOpen(true);
      }, 500);
      return;
    }

    if (isBioWarfareOpen) {
      setIsBioWarfareOpen(false);
      return;
    }

    const approved = await requestApproval('BIOWARFARE', { description: 'BioForge lab access' });
    if (!approved) return;
    AudioSys.playSFX('click');
    setIsBioWarfareOpen(true);
  }, [bioWarfareAvailable, isBioWarfareOpen, requestApproval, pandemicIntegrationEnabled, bioWarfareEnabled]);

  const handleLabConstructionToggle = useCallback(() => {
    setIsLabConstructionOpen(!isLabConstructionOpen);
  }, [isLabConstructionOpen]);

  const handleStartLabConstruction = useCallback((tier: number) => {
    const player = getNationById(playerNationId);
    if (!player) return;

    const result = startLabConstruction(tier as any, player.production, player.uranium);

    if (result.success) {
      toast({
        title: 'Construction Started',
        description: result.message,
        duration: 3000,
      });
      setIsLabConstructionOpen(false);
    } else {
      toast({
        title: 'Construction Failed',
        description: result.message,
        variant: 'destructive',
        duration: 3000,
      });
    }
  }, [startLabConstruction, playerNationId, getNationById]);

  const handleCancelLabConstruction = useCallback(() => {
    const result = cancelLabConstruction();

    if (result.success) {
      toast({
        title: 'Construction Cancelled',
        description: result.message,
        duration: 3000,
      });
    }
  }, [cancelLabConstruction]);

  const handleDeployBioWeapon = useCallback((selections: Array<{
    nationId: string;
    nationName: string;
    deploymentMethod: string;
    useFalseFlag: boolean;
    falseFlagNationId: string | null;
  }>) => {
    deployBioWeapon(selections, S.turn);
  }, [deployBioWeapon, S.turn]);

  const handleCulture = useCallback(async () => {
    const approved = await requestApproval('CULTURE', { description: 'Cultural operations briefing' });
    if (!approved) return;
    AudioSys.playSFX('click');
    const player = getBuildContext('Culture');
    if (!player) return;

    const cultureActions: OperationAction[] = [
      {
        id: 'meme',
        title: 'MEME WAVE',
        subtitle: 'Steal 5M pop, +8 instability',
        costText: 'Cost: 2 INTEL',
        requiresTarget: true,
        disabled: (player.intel || 0) < 2,
        disabledReason: 'Requires 2 INTEL to flood the networks.',
        targetFilter: nation => nation.population > 1,
      },
      {
        id: 'cancel',
        title: 'CANCEL CAMPAIGN',
        subtitle: 'Agitate regime supporters',
        costText: 'Cost: 3 INTEL',
        requiresTarget: true,
        disabled: (player.intel || 0) < 3,
        disabledReason: 'Requires 3 INTEL to fuel the outrage machine.',
      },
      {
        id: 'deepfake',
        title: 'DEEPFAKE OPS',
        subtitle: 'Target defense -2',
        costText: 'Cost: 5 INTEL',
        requiresTarget: true,
        disabled: (player.intel || 0) < 5,
        disabledReason: 'Requires 5 INTEL to produce convincing deepfakes.',
      },
      {
        id: 'victory',
        title: 'PROPAGANDA VICTORY',
        subtitle: 'Win via cultural dominance',
        costText: 'Requires 50 INTEL and majority influence',
        disabled: (player.intel || 0) < 50,
        disabledReason: 'Requires 50 INTEL to attempt cultural victory.',
      },
      {
        id: 'eco',
        title: 'ECO PROPAGANDA',
        subtitle: 'Force nuclear phase-out',
        costText: 'Cost: 30 PROD, 150 INTEL',
        requiresTarget: true,
        disabled: (player.intel || 0) < 150 || (player.production || 0) < 30,
        disabledReason: 'Requires 150 INTEL and 30 PRODUCTION to sway global opinion.',
      }
    ];

    const executeCultureAction = (action: OperationAction, target?: Nation) => {
      const commander = PlayerManager.get();
      if (!commander) {
        toast({ title: 'No command authority', description: 'Player nation could not be located.' });
        return false;
      }

      switch (action.id) {
        case 'meme':
          if (!target) return false;
          if ((commander.intel || 0) < 2) {
            toast({ title: 'Insufficient intel', description: 'You need 2 INTEL to unleash the meme wave.' });
            return false;
          }
          commander.intel -= 2;
          {
            const stolen = Math.min(5, Math.max(1, Math.floor(target.population)));
            target.population = Math.max(0, target.population - stolen);
            commander.population += stolen;
            commander.migrantsThisTurn = (commander.migrantsThisTurn || 0) + stolen;
            commander.migrantsTotal = (commander.migrantsTotal || 0) + stolen;
            target.instability = (target.instability || 0) + 8;
            log(`Meme wave steals ${stolen}M population from ${target.name}.`);
          }
          updateDisplay();
          consumeAction();
          return true;

        case 'cancel':
          if (!target) return false;
          if ((commander.intel || 0) < 3) {
            toast({ title: 'Insufficient intel', description: 'You need 3 INTEL to sustain a cancel campaign.' });
            return false;
          }
          commander.intel -= 3;
          target.instability = (target.instability || 0) + 4;
          log(`Cancel campaign inflames unrest in ${target.name}.`);
          updateDisplay();
          consumeAction();
          return true;

        case 'deepfake':
          if (!target) return false;
          if ((commander.intel || 0) < 5) {
            toast({ title: 'Insufficient intel', description: 'You need 5 INTEL to produce deepfakes.' });
            return false;
          }
          commander.intel -= 5;
          target.defense = Math.max(0, target.defense - 2);
          log(`Deepfake operation undermines ${target.name}'s defenses.`);
          updateDisplay();
          consumeAction();
          return true;

        case 'victory': {
          if ((commander.intel || 0) < 50) {
            toast({ title: 'Insufficient intel', description: 'You need 50 INTEL to attempt a cultural victory.' });
            return false;
          }
          const totalIntel = nations.reduce((sum, nation) => sum + (nation.intel || 0), 0);
          if (totalIntel <= 0) {
            toast({ title: 'Insufficient data', description: 'No global intel footprint detected yet.' });
            return false;
          }
          const share = (commander.intel || 0) / totalIntel;
          if (share <= 0.5) {
            toast({ title: 'Influence too low', description: 'Control more than half of the world\'s culture to win.' });
            return false;
          }
          commander.intel -= 50;
          consumeAction();
          endGame(true, 'CULTURAL VICTORY - Minds conquered without firing a shot!');
          return true;
        }

        case 'eco':
          if (!target) return false;
          if ((commander.intel || 0) < 150 || (commander.production || 0) < 30) {
            toast({ title: 'Insufficient resources', description: 'You need 150 INTEL and 30 PRODUCTION to launch eco propaganda.' });
            return false;
          }
          commander.intel -= 150;
          commander.production = Math.max(0, (commander.production || 0) - 30);
          target.greenShiftTurns = (target.greenShiftTurns || 0) + 5;
          log(`Eco propaganda forces ${target.name} to wind down nuclear production.`);
          updateDisplay();
          consumeAction();
          return true;
      }

      return false;
    };

    openModal(
      'CULTURE WARFARE',
      <OperationModal
        actions={cultureActions}
        player={player}
        targetableNations={targetableNations}
        onExecute={executeCultureAction}
        onClose={closeModal}
        accent="violet"
      />
    );
  }, [
    closeModal,
    getBuildContext,
    openModal,
    requestApproval,
    targetableNations,
    getCyberActionAvailability,
    launchCyberAttack,
    hardenCyberNetworks,
    launchCyberFalseFlag,
  ]);


  const handleImmigration = useCallback(async () => {
    const approved = await requestApproval('IMMIGRATION', { description: 'Immigration policy adjustment' });
    if (!approved) return;
    AudioSys.playSFX('click');
    const player = getBuildContext('Immigration');
    if (!player) return;

    const immigrationActions: OperationAction[] = [
      {
        id: 'skilled',
        title: 'SKILLED IMMIGRATION',
        subtitle: 'Steal 5% pop, +15 instability',
        costText: 'Cost: 10 PROD, 5 INTEL',
        requiresTarget: true,
        disabled: !canAfford(player, COSTS.immigration_skilled),
        disabledReason: 'Requires 10 PRODUCTION and 5 INTEL.',
        targetFilter: nation => nation.population > 1 && hasOpenBorders(nation),
      },
      {
        id: 'mass',
        title: 'MASS IMMIGRATION',
        subtitle: 'Drain 10% pop, +25-35 instability',
        costText: 'Cost: 5 PROD, 2 INTEL',
        requiresTarget: true,
        disabled: !canAfford(player, COSTS.immigration_mass),
        disabledReason: 'Requires 5 PRODUCTION and 2 INTEL.',
        targetFilter: nation => nation.population > 5 && hasOpenBorders(nation),
      },
      {
        id: 'refugee',
        title: 'REFUGEE WAVE',
        subtitle: 'Dump instability onto target',
        costText: 'Cost: 15 INTEL (requires 50 instability)',
        requiresTarget: true,
        disabled: !canAfford(player, COSTS.immigration_refugee) || (player.instability || 0) < 50,
        disabledReason: 'Requires 15 INTEL and 50+ instability.',
        targetFilter: nation => nation.population > 5 && hasOpenBorders(nation),
      },
      {
        id: 'brain',
        title: 'BRAIN DRAIN',
        subtitle: 'Steal 3% skilled population',
        costText: 'Cost: 20 INTEL',
        requiresTarget: true,
        disabled: !canAfford(player, COSTS.immigration_brain),
        disabledReason: 'Requires 20 INTEL.',
        targetFilter: nation => nation.population > 1 && hasOpenBorders(nation),
      }
    ];

    const executeImmigrationAction = (action: OperationAction, target?: Nation) => {
      if (!target) return false;
      const commander = PlayerManager.get();
      if (!commander) {
        toast({ title: 'No command authority', description: 'Player nation could not be located.' });
        return false;
      }

      const success = performImmigration(action.id, target);
      if (!success) {
        if (!hasOpenBorders(target)) {
          return false;
        }
        toast({ title: 'Operation failed', description: 'Insufficient resources or requirements not met.' });
        return false;
      }

      updateDisplay();
      consumeAction();
      return true;
    };

    openModal(
      'IMMIGRATION OPS',
      <OperationModal
        actions={immigrationActions}
        player={player}
        targetableNations={targetableNations}
        onExecute={executeImmigrationAction}
        onClose={closeModal}
        accent="emerald"
      />
    );
  }, [closeModal, getBuildContext, openModal, requestApproval, targetableNations]);

  const handleDiplomacy = useCallback(async () => {
    const approved = await requestApproval('DIPLOMACY', { description: 'Diplomatic operations request' });
    if (!approved) return;
    AudioSys.playSFX('click');
    const player = getBuildContext('Diplomacy');
    if (!player) return;

    const treatyWith = (nation: Nation) => player.treaties?.[nation.id];

    const diplomacyActions: OperationAction[] = [
      {
        id: 'truce',
        title: 'DECLARE TRUCE',
        subtitle: 'Mutual peace for 2 turns',
        requiresTarget: true,
        disabled: false,
        targetFilter: nation => !(treatyWith(nation)?.truceTurns > 0),
      },
      {
        id: 'trade',
        title: 'TRADE AGREEMENT',
        subtitle: 'Give 10 PROD → Get 5 URANIUM',
        costText: 'Cost: 10 PRODUCTION',
        requiresTarget: true,
        disabled: (player.production || 0) < 10,
        disabledReason: 'Requires 10 PRODUCTION to trade.',
      },
      {
        id: 'un',
        title: 'UN APPEAL',
        subtitle: 'Improve DEFCON by 1',
        costText: 'Cost: 10 INTEL',
        disabled: (player.intel || 0) < 10 || S.defcon >= 5,
        disabledReason: S.defcon >= 5 ? 'DEFCON already at maximum.' : 'Requires 10 INTEL.',
      },
      {
        id: 'alliance',
        title: 'FORM ALLIANCE',
        subtitle: 'Share intel and secure peace',
        costText: 'Cost: 10 PROD, 40 INTEL',
        requiresTarget: true,
        disabled: (player.production || 0) < 10 || (player.intel || 0) < 40,
        disabledReason: 'Requires 10 PRODUCTION and 40 INTEL.',
        targetFilter: nation => !(treatyWith(nation)?.alliance),
      },
      {
        id: 'backstab',
        title: 'BACKSTAB',
        subtitle: 'Break treaties for +1 missile',
        requiresTarget: true,
        disabled: false,
        targetFilter: nation => {
          const treaty = treatyWith(nation);
          return !!(treaty?.truceTurns || treaty?.alliance);
        },
      },
      {
        id: 'borders',
        title: 'CLOSE BORDERS',
        subtitle: 'Block immigration for 2 turns',
        costText: 'Cost: 5 INTEL',
        requiresTarget: true,
        disabled: (player.intel || 0) < 5,
        disabledReason: 'Requires 5 INTEL.',
        targetFilter: nation => !(nation.bordersClosedTurns && nation.bordersClosedTurns > 0),
      },
      {
        id: 'sanction',
        title: 'IMPOSE SANCTIONS',
        subtitle: 'Block target trade for 5 turns',
        costText: 'Cost: 15 INTEL',
        requiresTarget: true,
        disabled: (player.intel || 0) < 15,
        disabledReason: 'Requires 15 INTEL.',
        targetFilter: nation => !nation.sanctioned,
      },
      {
        id: 'pact',
        title: 'NON-AGGRESSION PACT',
        subtitle: 'Five turns of guaranteed peace',
        costText: 'Cost: 15 INTEL',
        requiresTarget: true,
        disabled: (player.intel || 0) < 15,
        disabledReason: 'Requires 15 INTEL.',
        targetFilter: nation => !(treatyWith(nation)?.truceTurns && treatyWith(nation)?.truceTurns > 2),
      },
      {
        id: 'aid',
        title: 'ECONOMIC AID',
        subtitle: 'Reduce instability by 10',
        costText: 'Cost: 20 PRODUCTION',
        requiresTarget: true,
        disabled: (player.production || 0) < 20,
        disabledReason: 'Requires 20 PRODUCTION.',
        targetFilter: nation => (nation.instability || 0) > 0,
      },
      {
        id: 'propaganda',
        title: 'PROPAGANDA',
        subtitle: 'Drain 10 INTEL from target',
        costText: 'Cost: 15 INTEL',
        requiresTarget: true,
        disabled: (player.intel || 0) < 15,
        disabledReason: 'Requires 15 INTEL.',
      },
      {
        id: 'env',
        title: 'ENV TREATY',
        subtitle: 'Reduce production & uranium for 5 turns',
        costText: 'Cost: 15 PROD, 60 INTEL',
        requiresTarget: true,
        disabled: (player.production || 0) < 15 || (player.intel || 0) < 60,
        disabledReason: 'Requires 15 PRODUCTION and 60 INTEL.',
      }
    ];

    const executeDiplomacyAction = (action: OperationAction, target?: Nation) => {
      const commander = PlayerManager.get();
      if (!commander) {
        toast({ title: 'No command authority', description: 'Player nation could not be located.' });
        return false;
      }

      const ensureTreaty = (self: Nation, other: Nation) => {
        self.treaties = self.treaties || {};
        self.treaties[other.id] = self.treaties[other.id] || {};
        return self.treaties[other.id];
      };

      switch (action.id) {
        case 'truce':
          if (!target) return false;
          ensureTreaty(commander, target).truceTurns = 2;
          ensureTreaty(target, commander).truceTurns = 2;
          log(`Truce declared with ${target.name} for 2 turns.`);
          updateDisplay();
          consumeAction();
          return true;

        case 'trade':
          if (!target) return false;
          if ((commander.production || 0) < 10) {
            toast({ title: 'Insufficient production', description: 'You need 10 PRODUCTION to trade.' });
            return false;
          }
          if (commander.sanctioned) {
            toast({ title: 'Trade blocked', description: 'You are currently under sanctions.' });
            return false;
          }
          commander.production = Math.max(0, (commander.production || 0) - 10);
          commander.uranium = (commander.uranium || 0) + 5;
          log(`Trade agreement with ${target.name}: -10 PRODUCTION, +5 URANIUM.`);
          updateDisplay();
          consumeAction();
          return true;

        case 'un':
          if ((commander.intel || 0) < 10) {
            toast({ title: 'Insufficient intel', description: 'You need 10 INTEL for a UN appeal.' });
            return false;
          }
          if (S.defcon >= 5) {
            toast({ title: 'DEFCON stable', description: 'DEFCON is already at maximum stability.' });
            return false;
          }
          commander.intel -= 10;
          S.defcon = Math.min(5, S.defcon + 1);
          AudioSys.playSFX('defcon');
          DoomsdayClock.improve(0.5);
          log(`UN appeal successful: DEFCON improved to ${S.defcon}.`);
          toast({ 
            title: '🕊️ DEFCON Improved', 
            description: `UN Security Council approves de-escalation. DEFCON now at ${S.defcon}.`,
          });
          if ((window as any).__gameAddNewsItem) {
            (window as any).__gameAddNewsItem('diplomatic', `UN Security Council approves de-escalation - DEFCON ${S.defcon}`, 'important');
          }
          updateDisplay();
          consumeAction();
          return true;

        case 'alliance':
          if (!target) return false;
          if ((commander.production || 0) < 10 || (commander.intel || 0) < 40) {
            toast({ title: 'Insufficient resources', description: 'You need 10 PRODUCTION and 40 INTEL to form an alliance.' });
            return false;
          }
          commander.production = Math.max(0, (commander.production || 0) - 10);
          commander.intel -= 40;
          ensureTreaty(commander, target).truceTurns = 999;
          ensureTreaty(commander, target).alliance = true;
          ensureTreaty(target, commander).truceTurns = 999;
          ensureTreaty(target, commander).alliance = true;
          log(`Alliance formed with ${target.name}.`);
          updateDisplay();
          consumeAction();
          return true;

        case 'backstab':
          if (!target) return false;
          {
            const treaty = ensureTreaty(commander, target);
            const targetTreaty = ensureTreaty(target, commander);
            if (!treaty.truceTurns && !treaty.alliance) {
              toast({ title: 'No treaty to break', description: 'You need an active truce or alliance to backstab.' });
              return false;
            }
            delete treaty.truceTurns;
            delete treaty.alliance;
            delete targetTreaty.truceTurns;
            delete targetTreaty.alliance;
          }
          commander.missiles += 1;
          commander.instability = (commander.instability || 0) + 10;
          log(`Backstab! Treaties with ${target.name} are broken. (+1 missile, +10 instability)`);
          updateDisplay();
          consumeAction();
          return true;

        case 'borders':
          if (!target) return false;
          if ((commander.intel || 0) < 5) {
            toast({ title: 'Insufficient intel', description: 'You need 5 INTEL to close borders.' });
            return false;
          }
          commander.intel -= 5;
          target.bordersClosedTurns = Math.max(2, (target.bordersClosedTurns || 0) + 2);
          log(`${target.name}'s borders sealed for 2 turns.`);
          updateDisplay();
          consumeAction();
          return true;

        case 'sanction':
          if (!target) return false;
          if ((commander.intel || 0) < 15) {
            toast({ title: 'Insufficient intel', description: 'You need 15 INTEL to impose sanctions.' });
            return false;
          }
          commander.intel -= 15;
          target.sanctioned = true;
          target.sanctionTurns = (target.sanctionTurns || 0) + 5;
          target.sanctionedBy = target.sanctionedBy || {};
          target.sanctionedBy[commander.id] = (target.sanctionedBy[commander.id] || 0) + 5;
          log(`Sanctions imposed on ${target.name} for 5 turns.`);
          updateDisplay();
          consumeAction();
          return true;

        case 'pact':
          if (!target) return false;
          if ((commander.intel || 0) < 15) {
            toast({ title: 'Insufficient intel', description: 'You need 15 INTEL for a non-aggression pact.' });
            return false;
          }
          commander.intel -= 15;
          ensureTreaty(commander, target).truceTurns = 5;
          ensureTreaty(target, commander).truceTurns = 5;
          log(`Non-aggression pact signed with ${target.name} for 5 turns.`);
          updateDisplay();
          consumeAction();
          return true;

        case 'aid':
          if (!target) return false;
          if ((commander.production || 0) < 20) {
            toast({ title: 'Insufficient production', description: 'You need 20 PRODUCTION to send aid.' });
            return false;
          }
          commander.production = Math.max(0, (commander.production || 0) - 20);
          target.instability = Math.max(0, (target.instability || 0) - 10);
          log(`Economic aid sent to ${target.name}, reducing instability by 10.`);
          updateDisplay();
          consumeAction();
          return true;

        case 'propaganda': {
          if (!target) return false;
          if ((commander.intel || 0) < 15) {
            toast({ title: 'Insufficient intel', description: 'You need 15 INTEL to run propaganda.' });
            return false;
          }
          commander.intel -= 15;
          const drained = Math.min(10, target.intel || 0);
          target.intel = Math.max(0, (target.intel || 0) - drained);
          commander.intel += 5;
          log(`Propaganda drains intel from ${target.name} (target loses ${drained}).`);
          updateDisplay();
          consumeAction();
          return true;
        }

        case 'env':
          if (!target) return false;
          if ((commander.production || 0) < 15 || (commander.intel || 0) < 60) {
            toast({ title: 'Insufficient resources', description: 'You need 15 PRODUCTION and 60 INTEL to enforce an environmental treaty.' });
            return false;
          }
          commander.production = Math.max(0, (commander.production || 0) - 15);
          commander.intel -= 60;
          target.environmentPenaltyTurns = (target.environmentPenaltyTurns || 0) + 5;
          log(`Environmental treaty limits ${target.name}'s nuclear industry for 5 turns.`);
          updateDisplay();
          consumeAction();
          return true;
      }

      return false;
    };

    openModal(
      'DIPLOMACY',
      <OperationModal
        actions={diplomacyActions}
        player={player}
        targetableNations={targetableNations}
        onExecute={executeDiplomacyAction}
        onClose={closeModal}
        accent="fuchsia"
      />
    );
  }, [closeModal, getBuildContext, openModal, requestApproval, targetableNations]);

  useEffect(() => {
    handleAttackRef.current = handleAttack;
  }, [handleAttack]);

  const handleEndTurn = useCallback(() => {
    AudioSys.playSFX('endturn');
    endTurn();
  }, []);

  useEffect(() => {
    if (canvasRef.current && isGameStarted) {
      canvas = canvasRef.current;
      ctx = canvas.getContext('2d')!;

      resizeCanvas();

      const handleWindowResize = () => {
        resizeCanvas();
      };

      if (typeof window !== 'undefined') {
        window.addEventListener('resize', handleWindowResize);
      }

      // Only initialize game systems once
      if (nations.length === 0) {
        // Initialize audio
        AudioSys.init();
        
        // Initialize game systems
        Atmosphere.init();
        Ocean.init();
        
        // Initialize game
        initNations();
        setConventionalState(S.conventional ?? createDefaultConventionalState());
        CityLights.generate();
        
        // Load world map and start game loop only once
        if (!gameLoopRunning) {
          gameLoopRunning = true;
          loadWorld().then(() => {
            requestAnimationFrame(gameLoop);
          });
        }
      }
      
      // Setup mouse and touch controls
      
      // Setup mouse and touch controls
      let isDragging = false;
      let dragButton: number | null = null;
      let dragStart = { x: 0, y: 0 };
      let touching = false;
      let touchStart = { x: 0, y: 0 };
      let zoomedIn = false;

      const clampLatitude = () => {
        const maxLat = 85;
        const minLat = -85;
        const height = H || canvas.height || 0;
        if (!height) return;

        const zoomLevel = Math.max(0.5, Math.min(3, cam.targetZoom));
        const camYForLat = (lat: number) =>
          height / 2 - (height * zoomLevel * (90 - lat)) / 180;

        const northCamY = camYForLat(maxLat);
        const southCamY = camYForLat(minLat);
        const minCamY = Math.min(northCamY, southCamY);
        const maxCamY = Math.max(northCamY, southCamY);
        cam.y = Math.min(Math.max(cam.y, minCamY), maxCamY);
      };

      let activePointerId: number | null = null;

      const handlePointerUp = (e: PointerEvent) => {
        if (canvas && activePointerId !== null && canvas.hasPointerCapture(activePointerId)) {
          canvas.releasePointerCapture(activePointerId);
          activePointerId = null;
        }
        isDragging = false;
        dragButton = null;
        if (activePointerId === e.pointerId) {
          activePointerId = null;
        }
      };

      const handlePointerDown = (e: PointerEvent) => {
        if (e.button !== 0 && e.button !== 2) return;
        isDragging = true;
        dragButton = e.button;
        dragStart = { x: e.clientX, y: e.clientY };
        activePointerId = e.pointerId;
        canvas?.setPointerCapture(e.pointerId);
      };

      const handlePointerMove = (e: PointerEvent) => {
        if (!isDragging) return;
        if (e.buttons === 0) {
          handlePointerUp(e);
          return;
        }

        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        dragStart = { x: e.clientX, y: e.clientY };

        const rotationFactor = 0.85;
        const tiltFactor = 0.75;

        cam.x -= dx * rotationFactor;
        cam.y -= dy * tiltFactor;
        clampLatitude();
      };

      const handlePointerCancel = (e: PointerEvent) => {
        handlePointerUp(e);
      };

      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const focalX = e.clientX - rect.left;
        const focalY = e.clientY - rect.top;
        const [focalLon, focalLat] = toLonLat(focalX, focalY);
        const prevZoom = cam.zoom;
        const [projectedX, projectedY] = project(focalLon, focalLat);

        const zoomIntensity = 0.0015;
        const delta = Math.exp(-e.deltaY * zoomIntensity);
        const newZoom = Math.max(0.5, Math.min(3, cam.targetZoom * delta));
        const zoomScale = prevZoom > 0 ? newZoom / prevZoom : 1;

        cam.targetZoom = newZoom;
        cam.zoom = newZoom;
        cam.x = focalX - (projectedX - cam.x) * zoomScale;
        cam.y = focalY - (projectedY - cam.y) * zoomScale;
        clampLatitude();
      };

      let touchStartTime = 0;
      let lastTouchDistance = 0;
      let initialPinchDistance = 0;
      let initialPinchZoom = 1;

      const getTouchDistance = (touches: TouchList) => {
        if (touches.length < 2) return 0;
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
      };

      const handleTouchStart = (e: TouchEvent) => {
        touchStartTime = Date.now();
        
        if(e.touches.length === 1) {
          touching = true;
          touchStart = {x: e.touches[0].clientX, y: e.touches[0].clientY};
        } else if (e.touches.length === 2) {
          // Start pinch gesture
          e.preventDefault();
          lastTouchDistance = getTouchDistance(e.touches);
          initialPinchDistance = lastTouchDistance;
          initialPinchZoom = cam.targetZoom;
          touching = false;
        }
      };

      const handleTouchMove = (e: TouchEvent) => {
        if (e.touches.length === 2) {
          // Pinch-to-zoom
          e.preventDefault();
          if (!canvas) return;
          const newDistance = getTouchDistance(e.touches);
          if (lastTouchDistance > 0 && initialPinchDistance > 0) {
            const scaleFactor = newDistance / initialPinchDistance;
            const rect = canvas.getBoundingClientRect();
            const midpointX = ((e.touches[0].clientX + e.touches[1].clientX) / 2) - rect.left;
            const midpointY = ((e.touches[0].clientY + e.touches[1].clientY) / 2) - rect.top;
            const [focalLon, focalLat] = toLonLat(midpointX, midpointY);
            const prevZoom = cam.zoom;
            const [projectedX, projectedY] = project(focalLon, focalLat);
            const newZoom = Math.max(0.5, Math.min(3, initialPinchZoom * scaleFactor));
            const zoomScale = prevZoom > 0 ? newZoom / prevZoom : 1;

            cam.targetZoom = newZoom;
            cam.zoom = newZoom;
            cam.x = midpointX - (projectedX - cam.x) * zoomScale;
            cam.y = midpointY - (projectedY - cam.y) * zoomScale;
            lastTouchDistance = newDistance;
            clampLatitude();
          }
        } else if(touching && e.touches.length === 1) {
          // Single finger pan
          e.preventDefault();
          const nx = e.touches[0].clientX, ny = e.touches[0].clientY; 
          const dx = nx - touchStart.x;
          const dy = ny - touchStart.y;
          
          // Only pan if moved more than 5px (prevents accidental pan on tap)
          if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
            const rotationFactor = 0.85;
            const tiltFactor = 0.75;

            cam.x -= dx * rotationFactor;
            cam.y -= dy * tiltFactor;
            clampLatitude();
            touchStart = {x: nx, y: ny};
          }
        }
      };

      const handleTouchEnd = (e: TouchEvent) => { 
        const touchDuration = Date.now() - touchStartTime;
        
        // Handle tap (quick touch < 300ms)
        if (e.changedTouches.length === 1 && touchDuration < 300 && touching) {
          const rect = canvas.getBoundingClientRect();
          const touch = e.changedTouches[0];
          const mx = touch.clientX - rect.left;
          const my = touch.clientY - rect.top;
          
          // Check if tapped on a nation (simulate click for intel)
          if (!S.gameOver) {
            const player = PlayerManager.get();
            if (player && player.satellites) {
              for (const n of nations) {
                if (n.isPlayer) continue;
                if (!player.satellites[n.id]) continue;
                if (n.population <= 0) continue;
                const [nx, ny] = project(n.lon, n.lat);
                const dist = Math.hypot(mx - nx, my - ny);
                
                if (dist < 30) { // Larger hit area for touch
                  let intelHtml = `<div style="margin:8px 0;padding:6px;border:1px solid rgba(124,255,107,.3);">`;
                  intelHtml += `<strong>${n.name}</strong><br>`;
                  intelHtml += `Missiles: ${n.missiles} | Defense: ${n.defense}<br>`;
                  intelHtml += `Warheads: ${Object.entries(n.warheads || {}).map(([k, v]) => `${k}MT×${v}`).join(', ')}<br>`;
                  intelHtml += `Production: ${Math.floor(n.production || 0)} | Uranium: ${Math.floor(n.uranium || 0)} | Intel: ${Math.floor(n.intel || 0)}<br>`;
                  intelHtml += `Migrants (This Turn / Total): ${(n.migrantsThisTurn || 0)} / ${(n.migrantsTotal || 0)}<br>`;
                  intelHtml += `Population: ${Math.floor(n.population)}M | Instability: ${Math.floor(n.instability || 0)}`;
                  intelHtml += `</div>`;
                  openModal(`${n.name} INTEL`, intelHtml);
                  break;
                }
              }
            }
          }
        }
        
        touching = false;
        lastTouchDistance = 0;
        initialPinchDistance = 0;
      };

      // Click handler for satellite intelligence
      const handleClick = (e: MouseEvent) => {
        if (e.button !== 0) return;
        if (isDragging) return;
        if (S.gameOver) return;
        const player = PlayerManager.get();
        if (!player || !player.satellites) return;
        
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        
        for (const n of nations) {
          if (n.isPlayer) continue;
          if (!player.satellites[n.id]) continue;
          if (n.population <= 0) continue;
          const [nx, ny] = project(n.lon, n.lat);
          const dist = Math.hypot(mx - nx, my - ny);
          
          if (dist < 20) {
            let intelHtml = `<div style="margin:8px 0;padding:6px;border:1px solid rgba(124,255,107,.3);">`;
            intelHtml += `<strong>${n.name}</strong><br>`;
            intelHtml += `Missiles: ${n.missiles} | Defense: ${n.defense}<br>`;
            intelHtml += `Warheads: ${Object.entries(n.warheads || {}).map(([k, v]) => `${k}MT×${v}`).join(', ')}<br>`;
            intelHtml += `Production: ${Math.floor(n.production || 0)} | Uranium: ${Math.floor(n.uranium || 0)} | Intel: ${Math.floor(n.intel || 0)}<br>`;
            intelHtml += `Migrants (This Turn / Total): ${(n.migrantsThisTurn || 0)} / ${(n.migrantsTotal || 0)}<br>`;
            intelHtml += `Population: ${Math.floor(n.population)}M | Instability: ${Math.floor(n.instability || 0)}`;
            intelHtml += `</div>`;
            openModal(`${n.name} INTEL`, intelHtml);
            break;
          }
        }
      };

      // Double-click zoom functionality
      const handleDoubleClick = (e: MouseEvent) => {
        if (isDragging) return;
        if (S.gameOver) return;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        
        if (zoomedIn) {
          cam.targetZoom = 1;
          cam.zoom = 1;
          cam.x = (W - W * cam.zoom) / 2;
          cam.y = (H - H * cam.zoom) / 2;
          zoomedIn = false;
          return;
        }
        
        const [lon, lat] = toLonLat(mx, my);
        const newZoom = Math.min(3, cam.targetZoom * 1.5);
        cam.targetZoom = newZoom;
        cam.zoom = newZoom;
        cam.x = W / 2 - ((lon + 180) / 360) * W * newZoom;
        cam.y = H / 2 - ((90 - lat) / 180) * H * newZoom;
        zoomedIn = true;
        
        let nearest = null;
        let minDist = Infinity;
        for (const nn of nations) {
          const d = Math.hypot((nn.lon || 0) - lon, (nn.lat || 0) - lat);
          if (d < minDist) { minDist = d; nearest = nn; }
        }
        
        if (nearest) {
          const lines = [];
          lines.push(`<strong>${nearest.name}</strong>`);
          if (nearest.leader) lines.push(`Leader: ${nearest.leader}`);
          if (nearest.doctrine) lines.push(`Doctrine: ${nearest.doctrine}`);
          lines.push(`Population: ${Math.floor(nearest.population || 0)}M`);
          lines.push(`Cities: ${nearest.cities || 0}`);
          lines.push(`Instability: ${Math.floor(nearest.instability || 0)}`);
          
          const currentPlayer = PlayerManager.get();
          const hasIntelCoverage = currentPlayer && currentPlayer.satellites && currentPlayer.satellites[nearest.id];
          if (hasIntelCoverage && !nearest.isPlayer) {
            // Apply fog of war to enemy nations
            const distorted = distortNationIntel(nearest, {
              baseAccuracy: 0.7,
              satelliteCoverage: true,
              deepReconActive: !!(currentPlayer.deepRecon && currentPlayer.deepRecon[nearest.id]),
              counterintelActive: (nearest.intel || 0) > 50
            });
            lines.push(`Missiles: ${distorted.missiles || 0} (${distorted._intelReliability}), Defense: ${distorted.defense || 0}`);
            lines.push(`Production: ${Math.floor(distorted.production || 0)}, Uranium: ${Math.floor(distorted.uranium || 0)}, Intel: ${Math.floor(distorted.intel || 0)}`);
            lines.push(`<span style="color: #ffa500; font-size: 0.85em">Intel Confidence: ${Math.round((distorted._intelConfidence || 0) * 100)}%</span>`);
          } else if (hasIntelCoverage && nearest.isPlayer) {
            lines.push(`Missiles: ${nearest.missiles || 0}, Defense: ${nearest.defense || 0}`);
            lines.push(`Production: ${Math.floor(nearest.production || 0)}, Uranium: ${Math.floor(nearest.uranium || 0)}, Intel: ${Math.floor(nearest.intel || 0)}`);
          } else {
            lines.push(`Surveillance required to view military and resource data`);
          }
          const info = `<div style="margin:8px 0">${lines.join('<br>')}</div>`;
          openModal(`${nearest.name} REGION`, info);
        }
      };

      // Keyboard controls
      const handleKeyDown = (e: KeyboardEvent) => {
        if(S.gameOver) return;

        switch(e.key) {
          case '1': handleBuild(); break;
          case '2': handleResearch(); break;
          case '3': handleIntel(); break;
          case '4': handleCulture(); break;
          case '5': handleImmigration(); break;
          case '6': handleDiplomacy(); break;
          case '7':
            e.preventDefault();
            handleAttackRef.current?.();
            break;
          case 'Enter': /* end turn */ break;
          case ' ':
            e.preventDefault();
            handlePauseToggle();
            break;
          case 's':
          case 'S': /* save */ break;
        }

        if (e.code === 'Numpad7') {
          e.preventDefault();
          handleAttackRef.current?.();
        }
      };

      const handleContextMenu = (e: MouseEvent) => {
        if (isDragging && dragButton === 2) {
          e.preventDefault();
        }
      };

      canvas.addEventListener('pointerdown', handlePointerDown);
      canvas.addEventListener('pointermove', handlePointerMove);
      canvas.addEventListener('pointerup', handlePointerUp);
      canvas.addEventListener('pointercancel', handlePointerCancel);
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      canvas.addEventListener('click', handleClick);
      canvas.addEventListener('dblclick', handleDoubleClick);
      canvas.addEventListener('contextmenu', handleContextMenu);
      canvas.addEventListener('touchstart', handleTouchStart, {passive: false});
      canvas.addEventListener('touchmove', handleTouchMove, {passive: false});
      canvas.addEventListener('touchend', handleTouchEnd, {passive: false});
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        if (typeof window !== 'undefined') {
          window.removeEventListener('resize', handleWindowResize);
        }
        if (canvas && activePointerId !== null && canvas.hasPointerCapture(activePointerId)) {
          canvas.releasePointerCapture(activePointerId);
          activePointerId = null;
        }
        canvas.removeEventListener('pointerdown', handlePointerDown);
        canvas.removeEventListener('pointermove', handlePointerMove);
        canvas.removeEventListener('pointerup', handlePointerUp);
        canvas.removeEventListener('pointercancel', handlePointerCancel);
        canvas.removeEventListener('wheel', handleWheel);
        canvas.removeEventListener('click', handleClick);
        canvas.removeEventListener('dblclick', handleDoubleClick);
        canvas.removeEventListener('contextmenu', handleContextMenu);
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchmove', handleTouchMove);
        canvas.removeEventListener('touchend', handleTouchEnd);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isGameStarted, handleBuild, handleResearch, handleIntel, handleCulture, handleImmigration, handleDiplomacy, handleMilitary, handlePauseToggle, openModal, resizeCanvas]);


  // Render functions for different phases
  const renderIntroScreen = () => (
    <div className="intro-screen">
      <div className="intro-screen__grid" aria-hidden="true" />
      <div className="intro-screen__scanlines" aria-hidden="true" />

      <div className="intro-screen__content">
        <IntroLogo />

        <p className="intro-screen__tagline">Want to play a game?</p>

        <button onClick={() => setGamePhase('leader')} className="intro-screen__cta">
          Start Game
        </button>
      </div>
    </div>
  );

  const renderLeaderSelection = () => (
    <div ref={interfaceRef} className="command-interface">
      <div className="command-interface__glow" aria-hidden="true" />
      <div className="command-interface__scanlines" aria-hidden="true" />
      
      <div className="fixed inset-0 bg-gradient-to-br from-background via-deep-space to-background flex items-center justify-center p-8">
        <div className="max-w-4xl w-full">
          <h2 className="text-3xl font-mono text-cyan text-center mb-8 tracking-widest uppercase glow-text">
            Select Commander
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {leaders.map((leader) => (
              <div
                key={leader.name}
                onClick={() => {
                  setSelectedLeader(leader.name);
                  setGamePhase('doctrine');
                }}
                className="bg-card border border-cyan/30 p-6 rounded-lg cursor-pointer hover:border-cyan hover:bg-cyan/10 transition-all duration-300 hover:shadow-lg hover:shadow-cyan/20"
              >
                <h3 className="text-xl font-mono text-neon-green mb-2">{leader.name}</h3>
                <p className="text-sm text-muted-foreground uppercase tracking-wide">{leader.ai}</p>
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <Button
              onClick={() => setGamePhase('intro')}
              className="px-6 py-2 bg-transparent border border-muted-foreground text-muted-foreground hover:border-cyan hover:text-cyan transition-all duration-300 font-mono uppercase tracking-wide"
            >
              Back
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDoctrineSelection = () => (
    <div ref={interfaceRef} className="command-interface">
      <div className="command-interface__glow" aria-hidden="true" />
      <div className="command-interface__scanlines" aria-hidden="true" />
      
      <div className="fixed inset-0 bg-gradient-to-br from-background via-deep-space to-background flex items-center justify-center p-8">
        <div className="max-w-6xl w-full">
          <h2 className="text-3xl font-mono text-neon-magenta text-center mb-2 tracking-widest uppercase glow-text">
            Select Doctrine
          </h2>
          <p className="text-center text-cyan font-mono mb-8">Commander: {selectedLeader}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {Object.entries(doctrines).map(([key, doctrine]) => (
              <div
                key={key}
                onClick={() => {
                  setSelectedDoctrine(key);
                  startGame(selectedLeader ?? undefined, key);
                  setGamePhase('game');
                }}
                className="bg-card border border-neon-magenta/30 p-6 rounded-lg cursor-pointer hover:border-neon-magenta hover:bg-neon-magenta/10 transition-all duration-300 hover:shadow-lg hover:shadow-neon-magenta/20 synthwave-card"
              >
                <h3 className="text-xl font-mono text-neon-yellow mb-2">{doctrine.name}</h3>
                <p className="text-sm text-cyan mb-3">{doctrine.desc}</p>
                <p className="text-xs text-neon-green font-mono">{doctrine.effects}</p>
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <Button
              onClick={() => setGamePhase('leader')}
              className="px-6 py-2 bg-transparent border border-muted-foreground text-muted-foreground hover:border-neon-magenta hover:text-neon-magenta transition-all duration-300 font-mono uppercase tracking-wide"
            >
              Back
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // Early returns for different phases
  if (gamePhase === 'intro') {
    return renderIntroScreen();
  }

  if (gamePhase === 'leader') {
    return renderLeaderSelection();
  }

  if (gamePhase === 'doctrine') {
    return renderDoctrineSelection();
  }

  const buildAllowed = coopEnabled ? canExecute('BUILD') : true;
  const researchAllowed = coopEnabled ? canExecute('RESEARCH') : true;
  const intelAllowed = coopEnabled ? canExecute('INTEL') : true;
  const bioWarfareAllowed = coopEnabled ? canExecute('BIOWARFARE') : true;
  const cultureAllowed = coopEnabled ? canExecute('CULTURE') : true;
  const immigrationAllowed = coopEnabled ? canExecute('IMMIGRATION') : true;
  const diplomacyAllowed = coopEnabled ? canExecute('DIPLOMACY') : true;

  return (
    <div ref={interfaceRef} className={`command-interface command-interface--${layoutDensity}`}>
      <div className="command-interface__glow" aria-hidden="true" />
      <div className="command-interface__scanlines" aria-hidden="true" />

      <div className="map-shell">
        <GlobeScene
          ref={canvasRef}
          cam={cam}
          nations={nations}
          worldCountries={worldCountries}
          onProjectorReady={handleProjectorReady}
          onPickerReady={handlePickerReady}
          mapStyle={mapStyle}
        />

        <div className="hud-layers pointer-events-none touch-none">
          {/* Minimal top status bar */}
          <header className="fixed top-0 left-0 right-0 h-12 bg-black/80 border-b border-cyan-500/30 backdrop-blur-sm flex items-center justify-between px-4 pointer-events-auto touch-auto z-50">
            <div className="flex items-center gap-6 text-xs font-mono">
              {/* DEFCON - Enlarged for prominence */}
              <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded">
                <span className="text-cyan-400 text-sm">DEFCON</span>
                <span className="text-neon-green font-bold text-2xl" id="defcon">5</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-cyan-400">TURN</span>
                <span className="text-neon-green font-bold text-base" id="turn">1</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-cyan-400">ACTIONS</span>
                <span className="text-neon-green font-bold text-base" id="actionsDisplay">1/1</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-cyan-400">CYBER</span>
                <span className="text-neon-green font-bold text-base" id="cyberDisplay">60/100</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <SyncStatusBadge />
              <div className="text-xs font-mono text-neon-magenta mr-4">
                <span className="text-cyan-400">DOOMSDAY</span>{' '}
                <span id="doomsdayTime" className="font-bold">7:00</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setOptionsOpen(true);
                  AudioSys.playSFX('click');
                }}
                className="h-7 px-2 text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
              >
                OPTIONS
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={toggleFullscreen}
                className="h-7 px-2 text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
              >
                {isFullscreen ? 'EXIT FS' : 'FULLSCREEN'}
              </Button>
            </div>
          </header>

          <MoraleHeatmapOverlay
            nations={nations.map(nation => ({ id: nation.id, name: nation.name, isPlayer: nation.isPlayer }))}
            metrics={governance.metrics}
          />
          <div className="pointer-events-auto fixed top-14 right-6 z-40 w-64">
            <ElectionCountdownWidget metrics={governance.metrics['player']} />
          </div>
          {coopEnabled ? (
            <div className="fixed top-14 right-4 pointer-events-auto touch-auto z-40 w-72">
              <ApprovalQueue />
            </div>
          ) : null}

          <div className="pointer-events-auto touch-auto">
            <ConflictResolutionDialog />
          </div>

          {isStrikePlannerOpen ? (
            <div className="pointer-events-auto fixed bottom-24 right-6 z-40 w-80 max-h-[60vh]">
              <div className="rounded border border-red-500/60 bg-black/85 backdrop-blur-sm shadow-lg shadow-red-500/20">
                <div className="flex items-center justify-between border-b border-red-500/30 px-3 py-2">
                  <span className="text-[10px] font-mono uppercase tracking-[0.35em] text-red-200">Strike Planner</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono ${selectedTarget ? 'text-red-300' : 'text-cyan-300/70'}`}
                    >
                      {selectedTarget ? 'LOCKED' : 'STANDBY'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsStrikePlannerOpen(false)}
                      className="inline-flex h-5 w-5 items-center justify-center rounded border border-red-500/40 text-red-200/80 transition hover:border-red-400 hover:text-red-200"
                      aria-label="Close strike planner"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-red-500/10">
                  {attackableNations.length === 0 ? (
                    <div className="px-3 py-4 text-[11px] text-cyan-200/70">
                      No hostile launch solutions available.
                    </div>
                  ) : (
                    attackableNations.map(nation => {
                      const isSelected = nation.id === selectedTargetId;
                      const population = Math.max(0, Math.round(nation.population ?? 0));
                      const defense = Math.max(0, Math.round(nation.defense ?? 0));
                      const missiles = Math.max(0, Math.round(Number(nation.missiles ?? 0)));
                      const instability = Math.max(0, Math.round(Number(nation.instability ?? 0)));

                      return (
                        <button
                          key={nation.id}
                          type="button"
                          onClick={() => handleTargetSelect(nation.id)}
                          className={`flex w-full items-center justify-between gap-3 border-l-2 px-3 py-2 text-left text-[11px] font-mono transition ${
                            isSelected
                              ? 'border-red-300/90 bg-red-500/20 text-red-100 shadow-inner'
                              : 'border-transparent text-cyan-200 hover:border-red-400/70 hover:bg-red-500/10'
                          }`}
                        >
                          <span className="flex-1">
                            <span className="block text-[12px] uppercase tracking-[0.25em]">{nation.name}</span>
                            <span className="block text-[10px] text-cyan-300/70">
                              POP {population}M • DEF {defense} • MISS {missiles}
                            </span>
                          </span>
                          <span className={`text-[10px] ${isSelected ? 'text-red-100' : 'text-red-200/80'}`}>
                            INSTAB {instability}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
                <div className="border-t border-red-500/30 px-3 py-2 text-[11px] text-cyan-200/80">
                  {selectedTarget ? (
                    <div className="space-y-1">
                      <p>
                        Locked on <span className="text-red-200">{selectedTarget.name}</span>. Population&nbsp;
                        {Math.max(0, Math.round(selectedTarget.population ?? 0))}M, defense{' '}
                        {Math.max(0, Math.round(selectedTarget.defense ?? 0))}, missile capacity{' '}
                        {Math.max(0, Math.round(Number(selectedTarget.missiles ?? 0)))}.
                      </p>
                      <p className="text-cyan-300/70">Confirm launch with ATTACK once satisfied with this solution.</p>
                    </div>
                  ) : (
                    <p>Select a hostile nation to arm the ATTACK command.</p>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {/* Minimal bottom utility stack */}
          <div className="fixed bottom-0 left-0 right-0 pointer-events-none touch-none z-50">
            <div className="flex flex-col gap-1">
              <NewsTicker
                items={newsItems}
                className="pointer-events-auto touch-auto"
              />
              <div className="h-16 sm:h-20 bg-black/90 border-t border-cyan-500/30 backdrop-blur-sm pointer-events-auto touch-auto">
                <div className="h-full flex items-center justify-center gap-1 px-4">
                  <Button
                    onClick={handleBuild}
                    variant="ghost"
                    size="icon"
                    data-role-locked={!buildAllowed}
                    data-tutorial="build-button"
                    className={`h-12 w-12 sm:h-14 sm:w-14 flex flex-col items-center justify-center gap-0.5 touch-manipulation active:scale-95 transition-transform ${
                      buildAllowed ? 'text-cyan-400 hover:text-neon-green hover:bg-cyan-500/10' : 'text-yellow-300/70 hover:text-yellow-200 hover:bg-yellow-500/10'
                    }`}
                    title={buildAllowed ? 'BUILD - Production and construction' : 'Await strategist approval or request authorization'}
                  >
                    <Factory className="h-5 w-5" />
                    <span className="text-[8px] font-mono">BUILD</span>
                  </Button>

                  {tutorialContext.progressDisclosure.showResearch && (
                    <Button
                      onClick={handleResearch}
                      variant="ghost"
                      size="icon"
                      data-role-locked={!researchAllowed}
                      data-tutorial="research-button"
                      className={`h-12 w-12 sm:h-14 sm:w-14 flex flex-col items-center justify-center gap-0.5 touch-manipulation active:scale-95 transition-transform ${
                        researchAllowed ? 'text-cyan-400 hover:text-neon-green hover:bg-cyan-500/10' : 'text-yellow-300/70 hover:text-yellow-200 hover:bg-yellow-500/10'
                      }`}
                      title={researchAllowed ? 'RESEARCH - Technology advancement' : 'Strategist approval required to manage research'}
                    >
                      <Microscope className="h-5 w-5" />
                      <span className="text-[8px] font-mono">RESEARCH</span>
                    </Button>
                  )}

                  {tutorialContext.progressDisclosure.showIntel && (
                    <Button
                      onClick={handleIntel}
                      variant="ghost"
                      size="icon"
                      data-role-locked={!intelAllowed}
                      data-tutorial="intel-button"
                      className={`h-12 w-12 sm:h-14 sm:w-14 flex flex-col items-center justify-center gap-0.5 touch-manipulation active:scale-95 transition-transform ${
                        intelAllowed ? 'text-cyan-400 hover:text-neon-green hover:bg-cyan-500/10' : 'text-yellow-300/70 hover:text-yellow-200 hover:bg-yellow-500/10'
                      }`}
                      title={intelAllowed ? 'INTEL - Intelligence operations' : 'Tactician authorization required to operate intel'}
                    >
                      <Satellite className="h-5 w-5" />
                      <span className="text-[8px] font-mono">INTEL</span>
                    </Button>
                  )}

                  <Button
                    onClick={handleBioWarfareLabToggle}
                    variant="ghost"
                    size="icon"
                    data-role-locked={!bioWarfareAllowed}
                    className={`h-12 w-12 sm:h-14 sm:w-14 flex flex-col items-center justify-center gap-0.5 touch-manipulation active:scale-95 transition-transform ${
                      bioWarfareAllowed && bioWarfareAvailable
                        ? 'text-cyan-400 hover:text-neon-green hover:bg-cyan-500/10'
                        : 'text-yellow-300/70 hover:text-yellow-200 hover:bg-yellow-500/10'
                    }`}
                    title={
                      bioWarfareAllowed
                        ? bioWarfareAvailable
                          ? 'BIOFORGE - Pathogen warfare lab'
                          : 'Enable pandemic integration and bio-weapon ops in options to access the lab'
                        : 'Command authorization required to access the BioForge lab'
                    }
                  >
                    <FlaskConical className="h-5 w-5" />
                    <span className="text-[8px] font-mono">BIO</span>
                  </Button>

                  <Button
                    onClick={handleLabConstructionToggle}
                    variant="ghost"
                    size="icon"
                    className={`h-12 w-12 sm:h-14 sm:w-14 flex flex-col items-center justify-center gap-0.5 touch-manipulation active:scale-95 transition-transform ${
                      labFacility.underConstruction
                        ? 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 animate-pulse'
                        : 'text-cyan-400 hover:text-neon-green hover:bg-cyan-500/10'
                    }`}
                    title={
                      labFacility.underConstruction
                        ? `Bio Lab Construction - ${labFacility.constructionProgress}/${labFacility.constructionTarget} turns`
                        : `Bio Lab Construction - Current: Tier ${labFacility.tier}`
                    }
                  >
                    <Microscope className="h-5 w-5" />
                    <span className="text-[8px] font-mono">LAB</span>
                  </Button>

                  {tutorialContext.progressDisclosure.showCulture && (
                    <Button
                      onClick={handleCulture}
                      variant="ghost"
                      size="icon"
                      data-role-locked={!cultureAllowed}
                      className={`h-12 w-12 sm:h-14 sm:w-14 flex flex-col items-center justify-center gap-0.5 touch-manipulation active:scale-95 transition-transform ${
                        cultureAllowed ? 'text-cyan-400 hover:text-neon-green hover:bg-cyan-500/10' : 'text-yellow-300/70 hover:text-yellow-200 hover:bg-yellow-500/10'
                      }`}
                      title={cultureAllowed ? 'CULTURE - Cultural warfare' : 'Requires co-commander approval to launch culture ops'}
                    >
                      <Radio className="h-5 w-5" />
                      <span className="text-[8px] font-mono">CULTURE</span>
                    </Button>
                  )}

                  {tutorialContext.progressDisclosure.showDiplomacy && (
                    <Button
                      onClick={handleImmigration}
                      variant="ghost"
                      size="icon"
                      data-role-locked={!immigrationAllowed}
                      className={`h-12 w-12 sm:h-14 sm:w-14 flex flex-col items-center justify-center gap-0.5 touch-manipulation active:scale-95 transition-transform ${
                        immigrationAllowed ? 'text-cyan-400 hover:text-neon-green hover:bg-cyan-500/10' : 'text-yellow-300/70 hover:text-yellow-200 hover:bg-yellow-500/10'
                      }`}
                      title={immigrationAllowed ? 'IMMIGRATION - Population management' : 'Immigration changes require strategist approval'}
                    >
                      <Users className="h-5 w-5" />
                      <span className="text-[8px] font-mono">IMMIGR</span>
                    </Button>
                  )}

                  {tutorialContext.progressDisclosure.showDiplomacy && (
                    <Button
                      onClick={handleDiplomacy}
                      variant="ghost"
                      size="icon"
                      data-role-locked={!diplomacyAllowed}
                      className={`h-12 w-12 sm:h-14 sm:w-14 flex flex-col items-center justify-center gap-0.5 touch-manipulation active:scale-95 transition-transform ${
                        diplomacyAllowed ? 'text-cyan-400 hover:text-neon-green hover:bg-cyan-500/10' : 'text-yellow-300/70 hover:text-yellow-200 hover:bg-yellow-500/10'
                    }`}
                      title={diplomacyAllowed ? 'DIPLOMACY - International relations' : 'Diplomatic moves require strategist consent'}
                    >
                      <Handshake className="h-5 w-5" />
                      <span className="text-[8px] font-mono">DIPLO</span>
                    </Button>
                  )}

                  <Button
                    onClick={handleMilitary}
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 sm:h-14 sm:w-14 text-cyan-400 hover:text-neon-green hover:bg-cyan-500/10 flex flex-col items-center justify-center gap-0.5 touch-manipulation active:scale-95 transition-transform"
                    title="MILITARY - Conventional command"
                  >
                    <Shield className="h-5 w-5" />
                    <span className="text-[8px] font-mono">MIL</span>
                  </Button>

                  <div className="w-px h-8 bg-cyan-500/30 mx-2" />

                  <Button
                    onClick={handleAttack}
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 sm:h-14 sm:w-14 text-red-400 hover:text-red-300 hover:bg-red-500/10 flex flex-col items-center justify-center gap-0.5 touch-manipulation active:scale-95 transition-transform"
                    title="ATTACK - Launch nuclear strike (select target in Strike Planner)"
                  >
                    <Zap className="h-5 w-5" />
                    <span className="text-[8px] font-mono">ATTACK</span>
                  </Button>

                  <div className="w-px h-8 bg-cyan-500/30 mx-2" />

                  <Button
                    onClick={handleEndTurn}
                    variant="ghost"
                    className="h-12 sm:h-14 px-4 sm:px-6 text-neon-yellow hover:text-neon-green hover:bg-cyan-500/10 flex flex-col items-center justify-center gap-0.5 touch-manipulation active:scale-95 transition-transform"
                    title="END TURN"
                  >
                    <ArrowRight className="h-5 w-5" />
                    <span className="text-[8px] font-mono">END TURN</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Events log - minimal bottom left corner */}
          <div className="fixed bottom-20 left-4 w-80 max-h-32 bg-black/80 border border-cyan-500/30 backdrop-blur-sm pointer-events-auto rounded overflow-hidden">
            <div className="text-[10px] font-mono text-cyan-400 bg-black/60 px-2 py-1 border-b border-cyan-500/30">
              EVENTS
            </div>
            <div id="log" className="text-[10px] font-mono text-cyan-300 p-2 overflow-y-auto max-h-24">
              {/* Populated by log() function */}
            </div>
          </div>
        </div>
      </div>

      <Sheet open={optionsOpen} onOpenChange={setOptionsOpen}>
        <SheetContent
          side="right"
          className="options-sheet"
        >
          <div className="options-sheet__decor">
            <SheetHeader>
              <SheetTitle className="options-sheet__title">COMMAND OPTIONS</SheetTitle>
              <SheetDescription className="options-sheet__description">
                Tune the command interface to match your control room preferences.
              </SheetDescription>
            </SheetHeader>

            <div className="options-section">
              <h3 className="options-section__heading">VISUAL THEMES</h3>
              <p className="options-section__subheading">Switch the world feed rendering profile.</p>
              <div className="theme-grid">
                {themeOptions.map(opt => {
                  const active = theme === opt.id;
                  return (
                    <Button
                      key={opt.id}
                      onClick={() => setTheme(opt.id)}
                      className={`theme-chip${active ? ' is-active' : ''}`}
                      type="button"
                    >
                      {opt.label.toUpperCase()}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="options-section">
              <h3 className="options-section__heading">MAP DISPLAY STYLE</h3>
              <p className="options-section__subheading">Choose how the global map is rendered.</p>
              <div className="layout-grid">
                {MAP_STYLE_OPTIONS.map((option) => {
                  const isActive = mapStyle === option.value;
                  return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleMapStyleChange(option.value)}
                    className={`layout-chip${isActive ? ' is-active' : ''}`}
                    aria-pressed={isActive}
                  >
                    <span className="layout-chip__label">{option.label}</span>
                    <span className="layout-chip__description">{option.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="options-section">
            <h3 className="options-section__heading">HUD LAYOUT</h3>
            <p className="options-section__subheading">Choose how much interface overlays the map.</p>
            <div className="layout-grid">
              {layoutDensityOptions.map((option) => {
                const isActive = layoutDensity === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setLayoutDensity(option.id)}
                    className={`layout-chip${isActive ? ' is-active' : ''}`}
                    aria-pressed={isActive}
                    title={option.description}
                  >
                    <span className="layout-chip__label">{option.label}</span>
                    <span className="layout-chip__description">{option.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="options-section">
            <h3 className="options-section__heading">CO-OP OPERATIONS</h3>
            <p className="options-section__subheading">
              {coopEnabled
                ? 'Review allied readiness, sync status, and role assignments.'
                : 'Single-commander mode active; approvals and state sync are paused.'}
            </p>
            <div className="options-toggle">
              <div className="flex flex-col text-left">
                <span className="tracking-[0.2em] text-[10px] text-cyan-300 uppercase">Shared Command</span>
                <span className="text-[11px] text-cyan-400/80">
                  {coopEnabled
                    ? 'Strategic actions may require allied approval to execute.'
                    : 'Approvals are bypassed and multiplayer messaging is suspended.'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={coopEnabled}
                  onCheckedChange={handleCoopToggle}
                  aria-label="Toggle co-op approvals"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="border-cyan-700/60 text-cyan-200 hover:bg-cyan-800/40"
                  onClick={() => handleCoopToggle(!coopEnabled)}
                >
                  {coopEnabled ? 'Disable' : 'Enable'}
                </Button>
              </div>
            </div>
            {coopEnabled ? (
              <div className="mt-4 space-y-3">
                <CoopStatusPanel />
              </div>
            ) : (
              <div className="mt-4 rounded border border-cyan-500/40 bg-black/40 p-3 text-xs text-cyan-200">
                Command approvals will be skipped and multiplayer sync paused until re-enabled.
              </div>
            )}
          </div>

          <div className="options-section">
            <h3 className="options-section__heading">AUDIO CONTROL</h3>
            <p className="options-section__subheading">Manage strategic alert audio and briefing ambience.</p>
            <div className="options-toggle">
              <span>MUSIC</span>
              <Switch checked={musicEnabled} onCheckedChange={handleMusicToggle} aria-label="Toggle music" />
            </div>
            <div className="options-toggle">
              <span>SOUND FX</span>
              <Switch checked={sfxEnabled} onCheckedChange={handleSfxToggle} aria-label="Toggle sound effects" />
            </div>
            <div className="options-slider">
              <div className="options-slider__label">
                <span>MUSIC GAIN</span>
                <span>{Math.round(musicVolume * 100)}%</span>
              </div>
              <Slider
                value={[musicVolume]}
                min={0}
                max={1}
                step={0.05}
                onValueChange={handleMusicVolumeChange}
                disabled={!musicEnabled}
                aria-label="Adjust music volume"
              />
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex flex-col text-left">
                <span className="tracking-[0.2em] text-[10px] text-cyan-300 uppercase">Soundtrack</span>
                <span className="text-[11px] text-cyan-400/80">{activeTrackMessage}</span>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  className="bg-black/60 border border-cyan-700 text-cyan-100 text-sm rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-cyan-500/60 disabled:opacity-50 disabled:cursor-not-allowed"
                  value={musicSelection}
                  onChange={handleMusicTrackChange}
                  disabled={!musicEnabled}
                  aria-label="Select soundtrack"
                >
                  <option value="random">Random Rotation</option>
                  {musicTracks.map(track => (
                    <option key={track.id} value={track.id}>
                      {track.title}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  className="bg-cyan-900/40 border border-cyan-700/60 text-cyan-200 hover:bg-cyan-800/60 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleNextTrack}
                  disabled={!musicEnabled}
                >
                  Advance Track
                </Button>
              </div>
            </div>
          </div>

          <div className="options-section">
            <h3 className="options-section__heading">UNCONVENTIONAL WARFARE</h3>
            <p className="options-section__subheading">Control how pandemic and bio-weapon systems factor into conquest planning.</p>
            <div className="options-toggle">
              <div className="flex flex-col text-left">
                <span className="tracking-[0.2em] text-[10px] text-cyan-300 uppercase">Pandemic Integration</span>
                <span className="text-[11px] text-cyan-400/80">Allow engineered outbreaks and containment play a role each turn.</span>
              </div>
              <Switch
                checked={pandemicIntegrationEnabled}
                onCheckedChange={(value) => {
                  setPandemicIntegrationEnabled(value);
                  toast({
                    title: value ? 'Pandemic integration enabled' : 'Pandemic integration disabled',
                    description: value
                      ? 'Bio-threat modelling now influences readiness, production, and conquest routes.'
                      : 'All pathogen events suppressed pending command audit.'
                  });
                }}
                aria-label="Toggle pandemic gameplay"
              />
            </div>
            <div className="options-toggle">
              <div className="flex flex-col text-left">
                <span className="tracking-[0.2em] text-[10px] text-cyan-300 uppercase">Bio-Weapon Conquest Ops</span>
                <span className="text-[11px] text-cyan-400/80">Enable offensive deployment of pathogens as a conquest vector. Changes are logged to the war-room audit trail.</span>
              </div>
              <Switch
                checked={bioWarfareEnabled}
                onCheckedChange={(value) => {
                  setBioWarfareEnabled(value);
                  toast({
                    title: value ? 'Bio-weapon ops authorized' : 'Bio-weapon ops barred',
                    description: value
                      ? 'Pandemic flashpoints may now be weaponized in pursuit of domination.'
                      : 'Offensive pathogen use disabled – only defensive monitoring remains.'
                  });
                }}
                aria-label="Toggle bioweapon conquest options"
              />
            </div>
          </div>
        </div>
        </SheetContent>
      </Sheet>

      <GovernanceEventDialog
        open={Boolean(governance.activeEvent)}
        event={governance.activeEvent}
        metrics={governance.activeEvent ? governance.metrics[governance.activeEvent.nationId] : undefined}
        onSelect={(optionId) => {
          const outcome = governance.selectOption(optionId);
          if (outcome) {
            toast({
              title: 'Governance Decision Logged',
              description: outcome.description,
            });
            updateDisplay();
          }
        }}
        onDismiss={() => {
          governance.dismissEvent();
          updateDisplay();
        }}
      />

      <Dialog open={Boolean(pendingLaunch)} onOpenChange={(open) => { if (!open) resetLaunchControl(); }}>
        <DialogContent className="max-w-2xl border border-cyan-500 bg-black text-cyan-100">
          <DialogHeader>
            <DialogTitle className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">Launch Control</DialogTitle>
            <DialogDescription className="text-cyan-200/70">
              Confirm strategic strike parameters before authorizing launch.
            </DialogDescription>
          </DialogHeader>
          {pendingLaunch && (
            <div className="space-y-6">
              <div className="rounded border border-cyan-500/40 bg-cyan-950/20 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-[0.3em] text-cyan-400">Target</span>
                  <span className="text-base font-semibold text-cyan-100">{pendingLaunch.target.name}</span>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-cyan-200/80 sm:grid-cols-2 sm:text-sm">
                  <div>Population Estimate: {Math.floor(pendingLaunch.target.population)}M</div>
                  <div>Current DEFCON: {S.defcon}</div>
                  <div>Actions Remaining: {S.actionsRemaining}</div>
                  <div>Radiation Index: {Math.max(0, Math.round((S.globalRadiation || 0) * 10) / 10)}</div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.25em] text-cyan-400">Warhead Yield</p>
                <RadioGroup
                  value={selectedWarheadYield !== null ? String(selectedWarheadYield) : undefined}
                  onValueChange={(value) => setSelectedWarheadYield(Number(value))}
                  className="space-y-3"
                >
                  {pendingLaunch.warheads.map(warhead => {
                    const optionId = `warhead-${warhead.yield}`;
                    const disabled = warhead.count <= 0 || S.defcon > warhead.requiredDefcon;
                    return (
                      <div
                        key={warhead.yield}
                        className={`flex items-start gap-3 rounded border border-cyan-500/40 bg-cyan-950/10 p-3 ${disabled ? 'opacity-50' : ''}`}
                      >
                        <RadioGroupItem
                          value={String(warhead.yield)}
                          id={optionId}
                          disabled={disabled}
                          className="mt-1 border-cyan-400 data-[state=checked]:border-cyan-200 data-[state=checked]:bg-cyan-400"
                        />
                        <Label htmlFor={optionId} className="flex-1 cursor-pointer text-sm text-cyan-100">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{warhead.yield}MT Payload</span>
                            <span className="text-xs uppercase tracking-[0.25em] text-cyan-300">Stock: {warhead.count}</span>
                          </div>
                          <div className="mt-1 text-xs text-cyan-300/80">Requires DEFCON ≤ {warhead.requiredDefcon}</div>
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.25em] text-cyan-400">Delivery Platform</p>
                <RadioGroup
                  value={selectedDeliveryMethod ?? undefined}
                  onValueChange={(value) => setSelectedDeliveryMethod(value as DeliveryMethod)}
                  className="space-y-3"
                >
                  {pendingLaunch.deliveryOptions.map(option => {
                    const optionId = `delivery-${option.id}`;
                    const disabled = option.count <= 0;
                    return (
                      <div
                        key={option.id}
                        className={`flex items-start gap-3 rounded border border-cyan-500/40 bg-cyan-950/10 p-3 ${disabled ? 'opacity-50' : ''}`}
                      >
                        <RadioGroupItem
                          value={option.id}
                          id={optionId}
                          disabled={disabled}
                          className="mt-1 border-cyan-400 data-[state=checked]:border-cyan-200 data-[state=checked]:bg-cyan-400"
                        />
                        <Label htmlFor={optionId} className="flex-1 cursor-pointer text-sm text-cyan-100">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{option.label}</span>
                            <span className="text-xs uppercase tracking-[0.25em] text-cyan-300">Ready: {option.count}</span>
                          </div>
                          <div className="mt-1 text-xs text-cyan-300/80">
                            {option.id === 'missile'
                              ? 'High-speed ICBM launch with MIRV capability.'
                              : option.id === 'bomber'
                                ? 'Crewed bomber sortie risking enemy air defenses.'
                                : 'Stealth launch from submerged ballistic submarine.'}
                          </div>
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              </div>
            </div>
          )}
          <DialogFooter className="mt-6 gap-3">
            <Button
              variant="outline"
              onClick={resetLaunchControl}
              className="border-cyan-500 text-cyan-200 hover:bg-cyan-500/10 hover:text-cyan-100"
            >
              Abort
            </Button>
            <Button
              onClick={confirmPendingLaunch}
              disabled={!pendingLaunch || selectedWarheadYield === null || !selectedDeliveryMethod}
              className="bg-cyan-500 text-black hover:bg-cyan-400 disabled:opacity-50"
            >
              Confirm Launch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-black border border-cyan-500 text-cyan-500 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-cyan-400">{modalContent.title}</DialogTitle>
          </DialogHeader>
          {(() => {
            const content = typeof modalContent.content === 'function' ? modalContent.content() : modalContent.content;
            if (typeof content === 'string') {
              return <div dangerouslySetInnerHTML={{ __html: content }} />;
            }
            return content ?? null;
          })()}
        </DialogContent>
      </Dialog>

      <BioWarfareLab
        open={isBioWarfareOpen}
        onOpenChange={setIsBioWarfareOpen}
        plagueState={plagueState}
        enabled={pandemicIntegrationEnabled && bioWarfareEnabled}
        labTier={labFacility.tier}
        availableNations={nations
          .filter(n => n.id !== playerNationId && !n.eliminated)
          .map(n => ({
            id: n.id,
            name: n.name,
            intelligence: n.intelligence || 50,
          }))}
        playerActions={S.actionsRemaining}
        onSelectPlagueType={selectPlagueType}
        onEvolveNode={evolveNode}
        onDevolveNode={devolveNode}
        onDeployBioWeapon={handleDeployBioWeapon}
      />

      <BioLabConstruction
        open={isLabConstructionOpen}
        onOpenChange={setIsLabConstructionOpen}
        labFacility={labFacility}
        constructionOptions={getConstructionOptions(
          getNationById(playerNationId)?.production || 0,
          getNationById(playerNationId)?.uranium || 0
        )}
        playerProduction={getNationById(playerNationId)?.production || 0}
        playerUranium={getNationById(playerNationId)?.uranium || 0}
        onStartConstruction={handleStartLabConstruction}
        onCancelConstruction={handleCancelLabConstruction}
      />

      {showPandemicPanel && (
        <PandemicPanel
          state={pandemicState}
          enabled={pandemicIntegrationEnabled}
          biowarfareEnabled={bioWarfareEnabled}
        />
      )}

      {activeFlashpoint && (
        <FlashpointModal
          flashpoint={activeFlashpoint}
          onResolve={(optionId) => {
            const result = resolveFlashpoint(optionId, activeFlashpoint);
            const player = PlayerManager.get();
            if (!player) return;

            const option = activeFlashpoint.options.find(opt => opt.id === optionId);
            if (!option) return;

            // Apply consequences based on outcome
            const outcome = result.success ? option.outcome.success : option.outcome.failure;
            
            if (outcome.defcon) {
              S.defcon = Math.max(1, Math.min(5, outcome.defcon));
              AudioSys.playSFX('defcon');
              addNewsItem('crisis', `DEFCON ${S.defcon}: Flashpoint resolved - ${result.success ? 'Success' : 'Failure'}`, 'critical');
            }
            
            if (player && player.id) {
              const governanceDelta: GovernanceDelta = {};
              if (typeof outcome.morale === 'number' && outcome.morale !== 0) {
                governanceDelta.morale = outcome.morale;
              }
              if (typeof outcome.publicOpinion === 'number' && outcome.publicOpinion !== 0) {
                governanceDelta.publicOpinion = outcome.publicOpinion;
              }
              if (typeof outcome.cabinetApproval === 'number' && outcome.cabinetApproval !== 0) {
                governanceDelta.cabinetApproval = outcome.cabinetApproval;
              }
              if (typeof outcome.electionTimer === 'number' && outcome.electionTimer !== 0) {
                governanceDelta.electionTimer = outcome.electionTimer;
              }

              if (Object.keys(governanceDelta).length > 0) {
                governance.applyGovernanceDelta(player.id, governanceDelta);
              }
            }
            
            if (outcome.intel) {
              player.intel = Math.max(0, (player.intel || 0) + outcome.intel);
            }

            if (outcome.production) {
              player.production = Math.max(0, player.production + outcome.production);
            }

            if (outcome.uranium) {
              player.uranium = Math.max(0, player.uranium + outcome.uranium);
            }

            if (typeof outcome.population === 'number') {
              player.population = Math.max(0, player.population + outcome.population);
            }

            if (typeof outcome.populationLoss === 'number') {
              player.population = Math.max(0, player.population - outcome.populationLoss);
            }

            if (typeof outcome.productionPenalty === 'number') {
              player.production = Math.max(0, (player.production || 0) - outcome.productionPenalty);
            }

            if (typeof outcome.instabilityIncrease === 'number') {
              player.instability = Math.max(0, (player.instability || 0) + outcome.instabilityIncrease);
            }

            if (typeof outcome.readinessPenalty === 'number') {
              player.defense = Math.max(0, (player.defense || 0) - outcome.readinessPenalty);
            }

            if (outcome.intelGain) {
              player.intel = Math.max(0, (player.intel || 0) + outcome.intelGain);
            }

            if (outcome.pandemicTrigger) {
              handlePandemicTrigger(outcome.pandemicTrigger);
            }

            if (outcome.containmentBoost) {
              handlePandemicCountermeasure({
                type: 'containment',
                value: outcome.containmentBoost,
                label: outcome.containmentLabel
              });
            }

            if (typeof outcome.vaccineProgress === 'number') {
              handlePandemicCountermeasure({
                type: 'vaccine',
                value: outcome.vaccineProgress,
                label: outcome.vaccineLabel
              });
            }

            if (outcome.mutationSpike) {
              handlePandemicCountermeasure({
                type: 'mutation',
                value: outcome.mutationSpike,
                label: outcome.mutationLabel
              });
            }

            if (outcome.suppressedRegion || outcome.suppressionStrength) {
              handlePandemicCountermeasure({
                type: 'suppression',
                region: outcome.suppressedRegion,
                value: outcome.suppressionStrength,
                label: outcome.suppressionLabel
              });
            }

            if (outcome.intelActor) {
              handlePandemicCountermeasure({
                type: 'intel',
                actor: outcome.intelActor,
                value: outcome.intelValue,
                label: outcome.intelLabel
              });
            }

            if (outcome.nuclearWar || outcome.worldEnds) {
              addNewsItem('crisis', 'NUCLEAR WAR INITIATED', 'critical');
              S.defcon = 1;
            } else if (result.success) {
              addNewsItem('diplomatic', `Crisis resolved: ${option.text}`, 'important');
            } else {
              addNewsItem('crisis', `Crisis escalated: ${option.text} failed`, 'urgent');
            }
            
            updateDisplay();
          }}
          onTimeout={() => {
            dismissFlashpoint();
            addNewsItem('crisis', 'CRISIS UNRESOLVED - Default action taken', 'critical');
          }}
        />
      )}

      <TutorialGuide 
        open={showTutorial} 
        onClose={() => {
          setShowTutorial(false);
          Storage.setItem('has_seen_tutorial', 'true');
        }} 
      />

      {showProgressiveTutorial && isGameStarted && (
        <TutorialOverlay
          steps={tutorialSteps}
          onComplete={handleComplete}
          onSkip={handleSkip}
        />
      )}

      {/* New Phase 1 Tutorial & Feedback Overlays */}
      <TutorialOverlay />
      <PhaseTransitionOverlay phase={S.phase} isTransitioning={isPhaseTransitioning} />
      <VictoryProgressPanel
        militaryProgress={(() => {
          const player = PlayerManager.get();
          if (!player) return 0;
          const totalNations = nations.length;
          const enemiesEliminated = nations.filter(n => !n.isPlayer && n.population <= 0).length;
          return (enemiesEliminated / Math.max(1, totalNations - 1)) * 100;
        })()}
        economicProgress={(() => {
          const player = PlayerManager.get();
          if (!player) return 0;
          const citiesNeeded = 12;
          return Math.min(100, ((player.cities || 1) / citiesNeeded) * 100);
        })()}
        culturalProgress={(() => {
          const player = PlayerManager.get();
          if (!player) return 0;
          return Math.min(100, ((player.culture || 0) / 100) * 100);
        })()}
        isVisible={isGameStarted && S.turn >= 5}
      />

      <GameHelper />
    </div>
  );
}
