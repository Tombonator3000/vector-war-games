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
import CesiumHeroGlobe from '@/components/CesiumHeroGlobe';
import CesiumViewer from '@/components/CesiumViewer';
import { useFlashpoints, type FlashpointOutcome } from '@/hooks/useFlashpoints';
import {
  usePandemic,
  type PandemicTriggerPayload,
  type PandemicCountermeasurePayload,
  type PandemicTurnContext
} from '@/hooks/usePandemic';
import { useBioWarfare } from '@/hooks/useBioWarfare';
import { initializeAllAINations, processAllAINationsBioWarfare } from '@/lib/aiBioWarfareIntegration';
import { DEPLOYMENT_METHODS } from '@/types/bioDeployment';
import type { BioLabTier } from '@/types/bioLab';
import type { EvolutionNodeId } from '@/types/biowarfare';
import { FlashpointModal } from '@/components/FlashpointModal';
import { FlashpointOutcomeModal } from '@/components/FlashpointOutcomeModal';
import GlobeScene, { PickerFn, ProjectorFn, type MapStyle } from '@/components/GlobeScene';
import { useFogOfWar } from '@/hooks/useFogOfWar';
import {
  useGovernance,
  type GovernanceNationRef,
  type GovernanceMetrics,
  type GovernanceDelta,
  type UseGovernanceReturn,
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
import { useGameEra } from '@/hooks/useGameEra';
import { useVictoryTracking } from '@/hooks/useVictoryTracking';
import { EraTransitionOverlay } from '@/components/EraTransitionOverlay';
import { ActionConsequencePreview } from '@/components/ActionConsequencePreview';
import { LockedFeatureWrapper } from '@/components/LockedFeatureBadge';
import { FEATURE_UNLOCK_INFO } from '@/types/era';
import type { ActionConsequences } from '@/types/consequences';
import { calculateActionConsequences } from '@/lib/consequenceCalculator';
import { applyRemoteGameStateSync } from '@/lib/coopSync';
import { CivilizationInfoPanel } from '@/components/CivilizationInfoPanel';
import { DiplomacyProposalOverlay } from '@/components/DiplomacyProposalOverlay';
import { EnhancedDiplomacyModal, type DiplomaticAction } from '@/components/EnhancedDiplomacyModal';
import { EndGameScreen } from '@/components/EndGameScreen';
import type { Nation, ConventionalWarfareDelta, NationCyberProfile, SatelliteOrbit, FalloutMark } from '@/types/game';
import type { DiplomacyProposal } from '@/types/diplomacy';
import { evaluateProposal, shouldAIInitiateProposal } from '@/lib/aiDiplomacyEvaluator';
import { CoopStatusPanel } from '@/components/coop/CoopStatusPanel';
import {
  checkPoliticalGameOver,
  generatePoliticalWarnings,
  shouldRegimeChangeOccur,
  executeRegimeChange,
  generateRegimeChangeNews,
  type AIPersonality,
} from '@/lib/regimeChange';
import { generateTurnNews } from '@/lib/politicalNews';
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
import { calculateBomberInterceptChance, getMirvSplitChance } from '@/lib/research';
import { getDefaultScenario, type ScenarioConfig, SCENARIOS } from '@/types/scenario';
import { getGameTimestamp, turnsUntilEvent, isEventTurn } from '@/lib/timeSystem';
import {
  calculatePublicOpinion,
  runElection,
  applyElectionConsequences,
  modifyOpinionFromAction,
  getElectionStatusMessage,
  type ElectionResult,
} from '@/lib/electionSystem';
import { enhancedAIActions } from '@/lib/aiActionEnhancements';
import { ScenarioSelectionPanel } from '@/components/ScenarioSelectionPanel';
import { IntroScreen } from '@/components/setup/IntroScreen';
import { LeaderSelectionScreen } from '@/components/setup/LeaderSelectionScreen';
import { DoctrineSelectionScreen } from '@/components/setup/DoctrineSelectionScreen';
import { canAfford, pay, getCityCost, canPerformAction, hasActivePeaceTreaty, isEligibleEnemyTarget } from '@/lib/gameUtils';
import { getNationById, ensureTreatyRecord, adjustThreat, hasOpenBorders } from '@/lib/nationUtils';
import { modifyRelationship } from '@/lib/relationshipUtils';
import { project, toLonLat, getPoliticalFill, resolvePublicAssetPath, POLITICAL_COLOR_PALETTE, type ProjectionContext } from '@/lib/renderingUtils';
import { GameStateManager, PlayerManager, DoomsdayClock, type LocalGameState, type LocalNation, createDefaultDiplomacyState } from '@/state';
import type { GreatOldOnesState } from '@/types/greatOldOnes';
import { initializeGreatOldOnesState } from '@/lib/greatOldOnesHelpers';
import { initializeWeek3State, updateWeek3Systems, type Week3ExtendedState } from '@/lib/greatOldOnesWeek3Integration';
import { initializePhase2State, updatePhase2Systems, checkPhase2UnlockConditions, type Phase2State } from '@/lib/phase2Integration';
import { initializePhase3State, updatePhase3Systems, checkPhase3UnlockConditions } from '@/lib/phase3Integration';
import type { Phase3State } from '@/types/phase3Types';
import { DoctrineSelectionPanel, OrderCommandPanel, SanityHeatMapPanel, RitualSitePanel, MissionBoardPanel, UnitRosterPanel } from '@/components/greatOldOnes';
import {
  aiSignMutualTruce,
  aiSignNonAggressionPact,
  aiFormAlliance,
  aiSendAid,
  aiImposeSanctions,
  aiBreakTreaties,
  aiRespondToSanctions,
  aiHandleTreatyStrain,
  aiHandleDiplomaticUrgencies,
  aiAttemptDiplomacy,
} from '@/lib/aiDiplomacyActions';
import {
  initializeGameTrustAndFavors,
  applyTrustDecay,
  modifyTrust,
  modifyFavors,
  createPromise,
  fulfillPromise,
  breakPromise,
} from '@/lib/trustAndFavorsUtils';
import { initializeGrievancesAndClaims, updateGrievancesAndClaimsPerTurn } from '@/lib/grievancesAndClaimsUtils';
import { initializeSpecializedAlliances, updateAlliancesPerTurn } from '@/lib/specializedAlliancesUtils';
import {
  updatePhase2PerTurn,
  resolveGrievancesWithApology,
  resolveGrievancesWithReparations,
} from '@/lib/diplomacyPhase2Integration';
import {
  initializeDiplomacyPhase3State,
  type DiplomacyPhase3State as DiplomacyPhase3SystemState,
} from '@/types/diplomacyPhase3';
import { calculateDIPIncome, applyDIPIncome, initializeDIP, spendDIP } from '@/lib/diplomaticCurrencyUtils';
import {
  launch as launchMissile,
  resolutionPhase as runResolutionPhase,
  productionPhase as runProductionPhase,
  type LaunchDependencies,
  type ResolutionPhaseDependencies,
  type ProductionPhaseDependencies,
} from '@/lib/gamePhaseHandlers';
import {
  drawWorld as renderWorld,
  drawNations as renderNations,
  drawWorldPath as renderWorldPath,
  type WorldRenderContext,
  type NationRenderContext,
} from '@/rendering/worldRenderer';
import {
  initializeInternationalCouncil,
  createResolution,
  addObserver,
  electCouncilMember,
  removeExpiredMembers,
  processExpiredVotes,
} from '@/lib/internationalCouncilUtils';
import { IntroLogo } from '@/components/intro/IntroLogo';
import { Starfield } from '@/components/intro/Starfield';
import { SpinningEarth } from '@/components/intro/SpinningEarth';
import { OperationModal, type OperationAction, type OperationModalProps } from '@/components/modals/OperationModal';
import { IntelReportContent } from '@/components/modals/IntelReportContent';
import { BuildModal } from '@/components/game/BuildModal';
import { ResearchModal } from '@/components/game/ResearchModal';
import { MilitaryModal } from '@/components/game/MilitaryModal';
import { OptionsMenu } from '@/components/OptionsMenu';
import { COSTS, RESEARCH_TREE, RESEARCH_LOOKUP, WARHEAD_RESEARCH_IDS, WARHEAD_YIELD_TO_ID, type ResourceCost, type ResearchProject } from '@/lib/gameConstants';
import { useModalManager, type ModalContentValue } from '@/hooks/game/useModalManager';
import { useNewsManager } from '@/hooks/game/useNewsManager';
import { getTrust, getFavors, FavorCosts } from '@/types/trustAndFavors';

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
      // Silent failure - localStorage may be disabled or full
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(`norad_${key}`);
    } catch (e) {
      // Silent failure - localStorage may be disabled
    }
  }
};

// Game State Types - now imported from @/state module (Phase 6 refactoring)
let governanceApiRef: UseGovernanceReturn | null = null;
let enqueueAIProposalRef: ((proposal: DiplomacyProposal) => void) | null = null;

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

const VIEWER_OPTIONS: { value: 'threejs' | 'cesium'; label: string; description: string }[] = [
  {
    value: 'threejs',
    label: 'Classic',
    description: 'Three.js tactical globe with retro vector styling.',
  },
  {
    value: 'cesium',
    label: 'Cesium',
    description: 'Photorealistic Cesium globe with geospatial overlays.',
  },
];

type ScreenResolution = 'auto' | '1280x720' | '1600x900' | '1920x1080' | '2560x1440' | '3840x2160';

const RESOLUTION_OPTIONS: { value: ScreenResolution; label: string; description: string; width?: number; height?: number }[] = [
  {
    value: 'auto',
    label: 'Auto',
    description: 'Responsive - fits available screen space.',
  },
  {
    value: '1280x720',
    label: '1280x720',
    description: 'HD - Lower performance demand, higher framerate.',
    width: 1280,
    height: 720,
  },
  {
    value: '1600x900',
    label: '1600x900',
    description: 'HD+ - Balanced clarity and performance.',
    width: 1600,
    height: 900,
  },
  {
    value: '1920x1080',
    label: '1920x1080',
    description: 'Full HD - Standard modern desktop display.',
    width: 1920,
    height: 1080,
  },
  {
    value: '2560x1440',
    label: '2560x1440',
    description: 'QHD - High clarity, requires more GPU resources.',
    width: 2560,
    height: 1440,
  },
  {
    value: '3840x2160',
    label: '3840x2160',
    description: '4K Ultra HD - Maximum detail, high performance cost.',
    width: 3840,
    height: 2160,
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
const radiationIcon = loadIcon('/icons/radiation.svg');

const conventionalIconLookup: Record<ForceType, CanvasIcon> = {
  army: armyIcon,
  navy: navyIcon,
  air: airIcon,
};

const MISSILE_ICON_BASE_SCALE = 0.14;
const BOMBER_ICON_BASE_SCALE = 0.18;
const SUBMARINE_ICON_BASE_SCALE = 0.2;
const RADIATION_ICON_BASE_SCALE = 0.16;
const easeInOutQuad = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const SATELLITE_ORBIT_RADIUS = 34;
const SATELLITE_ORBIT_TTL_MS = 180000;
const SATELLITE_ORBIT_SPEED = (Math.PI * 2) / 12000;
const MAX_FALLOUT_MARKS = 36;
const FALLOUT_GROWTH_RATE = 1.1; // units per second
const FALLOUT_DECAY_DELAY_MS = 12000;
const FALLOUT_DECAY_RATE = 0.04; // intensity per second once decay begins

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

// Global game state - now managed by GameStateManager (Phase 6 refactoring)
// Initialize GameStateManager (it has default state already)
// S now references the state from GameStateManager for backward compatibility
let S: LocalGameState = GameStateManager.getState();

// Expose S to window for hooks (needed by useFlashpoints to detect scenario)
if (typeof window !== 'undefined') {
  (window as any).S = S;
  console.log('[Game State] Exposed S to window at initialization. Scenario ID:', S.scenario?.id);
}

// Nations and deltas are now managed by GameStateManager
// Keep references for backward compatibility
let nations: LocalNation[] = GameStateManager.getNations();
let conventionalDeltas: ConventionalWarfareDelta[] = GameStateManager.getConventionalDeltas();
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
let lastFxTimestamp: number | null = null;

// Camera system
const cam = { x: 0, y: 0, zoom: 1, targetZoom: 1 };

// World data
let worldData: any = null;
let worldCountries: any = null;

// resolvePublicAssetPath moved to @/lib/renderingUtils

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
    // Texture load failed - fallback to standard rendering
    return null;
  });
}

// Leaders configuration
const leaders: { name: string; ai: string; color: string; isHistoricalCubanCrisis?: boolean; isLovecraftian?: boolean }[] = [
  // Historical leaders (for Cuban Crisis scenario)
  { name: 'John F. Kennedy', ai: 'balanced', color: '#0047AB', isHistoricalCubanCrisis: true }, // US President, balanced approach during crisis
  { name: 'Nikita Khrushchev', ai: 'aggressive', color: '#CC0000', isHistoricalCubanCrisis: true }, // Soviet Premier, aggressive but pragmatic
  { name: 'Fidel Castro', ai: 'aggressive', color: '#CE1126', isHistoricalCubanCrisis: true }, // Cuban leader, revolutionary and aggressive
  // Lovecraftian leaders (for Great Old Ones scenario)
  { name: 'Cthulhu', ai: 'aggressive', color: '#004d00', isLovecraftian: true }, // The Great Dreamer, aggressive domination
  { name: 'Azathoth', ai: 'chaotic', color: '#1a0033', isLovecraftian: true }, // The Blind Idiot God, chaotic and unpredictable
  { name: 'Nyarlathotep', ai: 'trickster', color: '#330033', isLovecraftian: true }, // The Crawling Chaos, deceptive and manipulative
  { name: 'Hastur', ai: 'balanced', color: '#4d1a00', isLovecraftian: true }, // The Unspeakable One, balanced corruption
  { name: 'Shub-Niggurath', ai: 'aggressive', color: '#003300', isLovecraftian: true }, // The Black Goat, aggressive expansion
  { name: 'Yog-Sothoth', ai: 'defensive', color: '#1a1a33', isLovecraftian: true }, // The Gate and the Key, strategic defense
  // Parody leaders (for other scenarios)
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
      if (window.__gameAddNewsItem) {
        window.__gameAddNewsItem('military', `${nation.name} adopts First Strike Doctrine`, 'critical');
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

// Game constants (COSTS, RESEARCH_TREE, RESEARCH_LOOKUP, WARHEAD_YIELD_TO_ID, etc.)
// now imported from @/lib/gameConstants (Phase 7 refactoring)

// ModalContentValue type now imported from @/hooks/game/useModalManager (Phase 7 refactoring)

// PlayerManager class now imported from @/state (Phase 6 refactoring)

// DoomsdayClock now imported from @/state (Phase 6 refactoring)

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
        const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
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
        // Audio resume failed - expected in some environments
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
      const offset = Math.random() * Math.max(buffer.duration - 0.5, 0);
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
      source.start(0, offset);
      this.musicSource = source;
      this.currentTrackId = trackId;
      this.notifyTrackListeners(trackId);
    } catch (error) {
      // Music playback failed - expected in some environments
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
        // Stop failed - already stopped or disposed
      }
      try {
        this.musicSource.disconnect();
      } catch (error) {
        // Disconnect failed - already disconnected
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
        // Listener error - continue notifying other listeners
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
    
    // Try playing real sound effect first
    try {
      // Map AudioSys types to audioManager keys
      const soundMap: Record<string, string> = {
        'explosion': 'nuclear-explosion',
        'launch': 'missile-launch',
        'click': 'ui-click',
        'success': 'research-complete',
        'error': 'alert-warning',
        'build': 'build-complete',
        'research': 'research-complete',
        'intel': 'ui-success',
        'defcon': 'defcon-change',
        'endturn': 'turn-start',
      };
      
      const soundKey = soundMap[type];
      if (soundKey) {
        import('@/utils/audioManager').then(({ audioManager }) => {
          if (type === 'explosion' || type === 'launch' || type === 'defcon') {
            audioManager.playSFX(soundKey);
          } else if (type === 'error') {
            audioManager.playCritical(soundKey);
          } else {
            audioManager.playUI(soundKey);
          }
        }).catch(() => {
          // Fall through to oscillator backup
        });
        return; // Don't use oscillator if we're trying real sound
      }
    } catch (error) {
      // Fall through to oscillator backup
    }
    
    // Fallback: Use oscillator-based sounds
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
      // SFX playback failed - expected in some environments
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
  clouds: [] as Array<{ x: number; y: number; sizeX: number; sizeY: number; speed: number }>,
  stars: [] as Array<{ x: number; y: number; brightness: number }>,
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
  waves: [] as never[],
  
  init() {
    this.waves = [];
  },
  
  update() {
    // Waves naturally animate via sin functions
  },
  
  draw(context: CanvasRenderingContext2D, style: MapStyle) {
    // Ocean rendering intentionally disabled to remove sine-wave bands.
    this.waves = [];
    return;
  }
};

// City Lights system
const CityLights = {
  cities: [] as Array<{ lat: number; lon: number; brightness: number }>,
  
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
      const [cx, cy] = projectLocal(city.lon, city.lat);
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
      const [x, y] = projectLocal(city.lon, city.lat);

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
// Game utility functions moved to @/lib/gameUtils and @/lib/nationUtils
// AI diplomacy functions moved to @/lib/aiDiplomacyActions

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

// Cuban Crisis specific initialization with historical nations
function initCubanCrisisNations(playerLeaderName: string, playerLeaderConfig: any, selectedDoctrine: DoctrineKey | undefined) {
  const player = PlayerManager.get();

  // Determine which historical leader the player chose
  const isKennedy = playerLeaderName === 'John F. Kennedy';
  const isKhrushchev = playerLeaderName === 'Nikita Khrushchev';
  const isCastro = playerLeaderName === 'Fidel Castro';

  // USA (Kennedy) - historically had superior nuclear arsenal
  const usaNation: LocalNation = {
    id: isKennedy ? 'player' : 'usa',
    isPlayer: isKennedy,
    name: 'United States',
    leader: 'John F. Kennedy',
    ai: 'balanced',
    lon: -95,
    lat: 39,
    color: '#0047AB',
    population: 186, // 1962 US population in millions
    missiles: 25, // USA had significant ICBM advantage
    bombers: 15, // Strategic Air Command was strong
    submarines: 5, // Polaris submarines
    defense: 8, // NORAD and early warning systems
    instability: 0,
    morale: isKennedy ? 72 : 65,
    publicOpinion: isKennedy ? 68 : 60,
    electionTimer: 0,
    cabinetApproval: isKennedy ? 64 : 55,
    production: 40, // Strong industrial base
    uranium: 30, // Large stockpile
    intel: isKennedy ? 15 : 10,
    cities: 2,
    warheads: { 20: 15, 50: 10, 100: 5 }, // Varied arsenal
    researched: { warhead_20: true, warhead_50: true, warhead_100: true },
    researchQueue: null,
    treaties: {},
    threats: {},
    migrantsThisTurn: 0,
    migrantsTotal: 0,
    conventional: createDefaultNationConventionalProfile('navy'),
    controlledTerritories: [],
    cyber: createDefaultNationCyberProfile(), // Minimal - no real cyber warfare in 1962
  };

  if (isKennedy) {
    applyDoctrineEffects(usaNation, selectedDoctrine);
  }
  nations.push(usaNation);

  // USSR (Khrushchev) - historically had fewer missiles but was building up
  const ussrNation: LocalNation = {
    id: isKhrushchev ? 'player' : 'ussr',
    isPlayer: isKhrushchev,
    name: 'Soviet Union',
    leader: 'Nikita Khrushchev',
    ai: 'aggressive',
    lon: 37,
    lat: 55,
    color: '#CC0000',
    population: 220, // 1962 USSR population in millions
    missiles: 10, // USSR had fewer ICBMs (missile gap was a myth)
    bombers: 12, // Strong bomber force
    submarines: 4, // Growing submarine fleet
    defense: 10, // Extensive air defense network
    instability: 5,
    morale: isKhrushchev ? 70 : 68,
    publicOpinion: isKhrushchev ? 65 : 60,
    electionTimer: 0,
    cabinetApproval: isKhrushchev ? 60 : 55,
    production: 35, // Strong but less efficient than US
    uranium: 25,
    intel: isKhrushchev ? 15 : 12,
    cities: 2,
    warheads: { 20: 8, 50: 12, 100: 8 }, // Emphasis on larger warheads
    researched: { warhead_20: true, warhead_50: true, warhead_100: true },
    researchQueue: null,
    treaties: {},
    threats: {},
    migrantsThisTurn: 0,
    migrantsTotal: 0,
    conventional: createDefaultNationConventionalProfile('army'),
    controlledTerritories: [],
    cyber: createDefaultNationCyberProfile(),
  };

  if (isKhrushchev) {
    applyDoctrineEffects(ussrNation, selectedDoctrine);
  }
  nations.push(ussrNation);

  // Cuba (Castro) - revolutionary state with Soviet support
  const cubaNation: LocalNation = {
    id: isCastro ? 'player' : 'cuba',
    isPlayer: isCastro,
    name: 'Cuba',
    leader: 'Fidel Castro',
    ai: 'aggressive',
    lon: -80,
    lat: 22,
    color: '#CE1126',
    population: 7, // 1962 Cuba population in millions
    missiles: 0, // No ICBMs, but hosted Soviet IRBMs
    bombers: 1, // Limited air force
    submarines: 0, // No submarines
    defense: 5, // Soviet SAM batteries
    instability: 10,
    morale: isCastro ? 75 : 80,
    publicOpinion: isCastro ? 70 : 75,
    electionTimer: 0,
    cabinetApproval: isCastro ? 65 : 70,
    production: 8, // Small economy
    uranium: 2, // Minimal resources
    intel: isCastro ? 12 : 8,
    cities: 1,
    warheads: { 10: 2 }, // Soviet-supplied tactical nukes
    researched: {},
    researchQueue: null,
    treaties: {},
    threats: {},
    migrantsThisTurn: 0,
    migrantsTotal: 0,
    conventional: createDefaultNationConventionalProfile('army'),
    controlledTerritories: [],
    cyber: createDefaultNationCyberProfile(),
  };

  if (isCastro) {
    applyDoctrineEffects(cubaNation, selectedDoctrine);
  }
  nations.push(cubaNation);

  // Initialize threat levels (historically accurate tensions)
  usaNation.threats = {
    [ussrNation.id]: 75,
    [cubaNation.id]: 90,
  }; // Very high threat from Cuba
  ussrNation.threats = {
    [usaNation.id]: 70,
    [cubaNation.id]: 0,
  }; // Cuba is allied
  cubaNation.threats = {
    [usaNation.id]: 95,
    [ussrNation.id]: 0,
  }; // Extreme threat from USA

  // Set up alliances
  ussrNation.alliances = [cubaNation.id];
  cubaNation.alliances = [ussrNation.id];

  // Initialize relationships
  usaNation.relationships = {
    [ussrNation.id]: -80,
    [cubaNation.id]: -95,
  };
  ussrNation.relationships = {
    [usaNation.id]: -80,
    [cubaNation.id]: 85,
  };
  cubaNation.relationships = {
    [usaNation.id]: -95,
    [ussrNation.id]: 85,
  };

  // Initialize conventional warfare state
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

  // Initialize AI bio-warfare capabilities (minimal for 1962)
  const difficulty = S.difficulty || 'medium';
  initializeAllAINations(nations, difficulty);

  // Initialize Diplomacy Phase 1-3 systems
  initializeGameTrustAndFavors(nations);
  initializeGrievancesAndClaims(nations);
  initializeSpecializedAlliances(nations);

  // Initialize DIP (Diplomatic Influence Points) for all nations
  nations.forEach((nation, index) => {
    nations[index] = initializeDIP(nation);
  });

  log('=== CUBAN MISSILE CRISIS - OCTOBER 1962 ===', 'critical');
  log(`Leader: ${playerLeaderName}`, 'success');
  log(`Doctrine: ${S.selectedDoctrine}`, 'success');
  log('The world stands on the brink of nuclear war...', 'warning');

  S.turn = 1;
  S.phase = 'PLAYER';
  S.paused = false;
  S.gameOver = false;
  S.diplomacy = createDefaultDiplomacyState();
  S.actionsRemaining = 2; // Crisis demands quick decisions

  // Initialize Phase 3 state
  if (!S.diplomacyPhase3) {
    S.diplomacyPhase3 = initializeDiplomacyPhase3State(S.turn);
  }

  updateDisplay();
}

// Game initialization
function initNations() {
  // Prevent re-initialization if game is already running
  if (nations.length > 0 && S.turn > 1) {
    console.warn('Attempted to re-initialize game - blocked');
    return;
  }

  nations = [];
  GameStateManager.setNations(nations);
  PlayerManager.setNations(nations);
  PlayerManager.reset();

  const playerLeaderName = S.selectedLeader || 'PLAYER';
  const playerLeaderConfig = leaders.find(l => l.name === playerLeaderName);
  const selectedDoctrine = (S.selectedDoctrine as DoctrineKey | null) || undefined;

  // Check if we're in Cuban Crisis scenario
  const isCubanCrisis = S.scenario?.id === 'cubanCrisis';

  if (isCubanCrisis) {
    // Historical Cuban Missile Crisis setup
    initCubanCrisisNations(playerLeaderName, playerLeaderConfig, selectedDoctrine);
    return;
  }
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

  // Initialize Diplomacy Phase 1-3 systems
  initializeGameTrustAndFavors(nations);
  initializeGrievancesAndClaims(nations);
  initializeSpecializedAlliances(nations);

  // Initialize DIP (Diplomatic Influence Points) for all nations
  nations.forEach((nation, index) => {
    nations[index] = initializeDIP(nation);
  });

  log('=== GAME START ===', 'success');
  log(`Leader: ${playerLeaderName}`, 'success');
  log(`Doctrine: ${S.selectedDoctrine}`, 'success');

  S.turn = 1;
  S.phase = 'PLAYER';
  S.paused = false;
  S.gameOver = false;
  S.diplomacy = createDefaultDiplomacyState();
  S.actionsRemaining = S.defcon >= 4 ? 1 : S.defcon >= 2 ? 2 : 3;

  // Initialize Phase 3 state
  if (!S.diplomacyPhase3) {
    S.diplomacyPhase3 = initializeDiplomacyPhase3State(S.turn);
  }

  updateDisplay();
}

// Banter system - Enhanced to use expanded banter pack
function maybeBanter(nation: Nation, chance: number, pool?: string) {
  if (Math.random() > chance) return;
  
  // Use the expanded banter system if available
  if (typeof window !== 'undefined' && window.banterSay) {
    try {
      // Determine pool based on context if not specified
      if (!pool && nation.ai) {
        pool = nation.ai; // Use AI personality as default pool
      }
      window.banterSay(pool || 'default', nation, 1);
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
// hasOpenBorders moved to @/lib/nationUtils

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
// Wrapper function for launch - delegates to extracted module
function launch(from: Nation, to: Nation, yieldMT: number) {
  const deps: LaunchDependencies = {
    S,
    nations,
    log,
    toast,
    AudioSys,
    DoomsdayClock,
    WARHEAD_YIELD_TO_ID,
    RESEARCH_LOOKUP,
    PlayerManager,
    projectLocal,
  };
  return launchMissile(from, to, yieldMT, deps);
}

// Resolution Phase - wrapper function that delegates to extracted module
function resolutionPhase() {
  const deps: ResolutionPhaseDependencies = {
    S,
    nations,
    log,
    projectLocal,
    explode,
    advanceResearch,
  };
  runResolutionPhase(deps);
}

// Production Phase - wrapper function that delegates to extracted module
function productionPhase() {
  const deps: ProductionPhaseDependencies = {
    S,
    nations,
    log,
    advanceResearch,
    leaders,
    PlayerManager,
  };
  runProductionPhase(deps);
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
    // Cache load failed - fallback to CDN fetch
  }

  try {
    log('Fetching world map from CDN...');
    const response = await fetch('https://unpkg.com/world-atlas@2/countries-110m.json');
    if (response.ok) {
      const topo = await response.json();

      try {
        Storage.setItem(CACHE_NAME, JSON.stringify(topo));
      } catch (e) {
        // Could not cache - not critical, continue without cache
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
    // CDN fetch failed - fallback to embedded data
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
// Rendering utility functions - using extracted utilities from @/lib/renderingUtils
// Wrapper functions that use the global rendering context
function projectLocal(lon: number, lat: number): [number, number] {
  return project(lon, lat, { W, H, cam, globeProjector, globePicker });
}

function toLonLatLocal(x: number, y: number): [number, number] {
  return toLonLat(x, y, { W, H, cam, globeProjector, globePicker });
}

// World rendering - wrapper function that delegates to extracted module
function drawWorld(style: MapStyle) {
  const context: WorldRenderContext = {
    ctx,
    worldCountries,
    W,
    H,
    cam,
    currentTheme,
    flatRealisticTexture,
    flatRealisticTexturePromise,
    THEME_SETTINGS,
    projectLocal,
    preloadFlatRealisticTexture,
    getPoliticalFill,
  };
  renderWorld(style, context);
}

function drawWorldPath(coords: number[][]) {
  if (!ctx) return;
  renderWorldPath(coords, ctx, projectLocal);
}

// Nation rendering - wrapper function that delegates to extracted module
function drawNations(style: MapStyle) {
  const context: NationRenderContext = {
    ctx,
    worldCountries,
    W,
    H,
    cam,
    currentTheme,
    flatRealisticTexture,
    flatRealisticTexturePromise,
    THEME_SETTINGS,
    projectLocal,
    preloadFlatRealisticTexture,
    getPoliticalFill,
    nations,
    S,
    selectedTargetRefId,
  };
  renderNations(style, context);
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

    const [targetX, targetY] = projectLocal(targetNation.lon, targetNation.lat);
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
    
    const [sx, sy] = projectLocal(m.fromLon, m.fromLat);
    const [tx, ty] = projectLocal(m.toLon, m.toLat);
    
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
    const [sx, sy] = projectLocal(movement.startLon, movement.startLat);
    const [ex, ey] = projectLocal(movement.endLon, movement.endLat);
    const dx = ex - sx;
    const dy = ey - sy;
    const distance = Math.hypot(dx, dy);
    const nation = getNationById(nations, movement.ownerId);
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
    const [x, y] = projectLocal(marker.lon, marker.lat);
    const nation = getNationById(nations, marker.ownerId);
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

function drawFalloutMarks(deltaMs: number) {
  if (!ctx || currentMapStyle !== 'flat-realistic') {
    return;
  }

  if (!Array.isArray(S.falloutMarks)) {
    S.falloutMarks = [];
    return;
  }

  const now = Date.now();
  const deltaSeconds = Math.max(0.016, deltaMs / 1000);
  const updatedMarks: FalloutMark[] = [];

  for (const mark of S.falloutMarks) {
    const next: FalloutMark = { ...mark };

    const growthFactor = Math.min(1, next.growthRate * deltaSeconds);
    if (next.radius < next.targetRadius) {
      const radiusDelta = (next.targetRadius - next.radius) * growthFactor;
      next.radius = Math.min(next.targetRadius, next.radius + radiusDelta);
    }

    if (next.intensity < next.targetIntensity) {
      const intensityDelta = (next.targetIntensity - next.intensity) * (growthFactor * 0.8);
      next.intensity = Math.min(next.targetIntensity, next.intensity + intensityDelta);
    }

    if (now - next.lastStrikeAt > next.decayDelayMs) {
      const decayAmount = next.decayRate * deltaSeconds;
      next.intensity = Math.max(0, next.intensity - decayAmount);
      next.targetIntensity = Math.max(0, next.targetIntensity - decayAmount * 0.5);
      const shrink = next.targetRadius * decayAmount * 0.2;
      if (next.radius > next.targetRadius * 0.6) {
        next.radius = Math.max(next.targetRadius * 0.6, next.radius - shrink);
      }
    }

    next.updatedAt = now;
    const [px, py] = projectLocal(next.lon, next.lat);
    next.canvasX = px;
    next.canvasY = py;

    if (next.intensity <= 0.015) {
      continue;
    }

    updatedMarks.push(next);

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = Math.min(0.85, next.intensity + 0.05);
    const gradient = ctx.createRadialGradient(px, py, Math.max(4, next.radius * 0.25), px, py, next.radius);
    gradient.addColorStop(0, 'rgba(120,255,180,0.75)');
    gradient.addColorStop(0.45, 'rgba(60,200,120,0.35)');
    gradient.addColorStop(1, 'rgba(10,80,30,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(px, py, next.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawIcon(radiationIcon, px, py, 0, RADIATION_ICON_BASE_SCALE, {
      alpha: Math.min(0.9, next.intensity + 0.15),
    });
  }

  if (updatedMarks.length > MAX_FALLOUT_MARKS) {
    updatedMarks
      .sort((a, b) => a.lastStrikeAt - b.lastStrikeAt)
      .splice(0, updatedMarks.length - MAX_FALLOUT_MARKS);
  }

  S.falloutMarks = updatedMarks;
}

function upsertFalloutMark(x: number, y: number, lon: number, lat: number, yieldMT: number) {
  if (!Array.isArray(S.falloutMarks)) {
    S.falloutMarks = [];
  }

  const now = Date.now();
  const intensityBoost = Math.min(1, 0.25 + yieldMT / 160);
  const baseRadius = Math.max(24, Math.sqrt(Math.max(1, yieldMT)) * 12);
  const growthRate = FALLOUT_GROWTH_RATE * (0.8 + Math.sqrt(Math.max(1, yieldMT)) * 0.02);
  const decayDelay = Math.max(FALLOUT_DECAY_DELAY_MS, 8000 + yieldMT * 180);
  const decayRate = FALLOUT_DECAY_RATE * (0.6 + Math.sqrt(Math.max(1, yieldMT)) * 0.015);
  const mergeThreshold = Math.max(baseRadius * 0.6, 30);

  let targetMark: FalloutMark | undefined;
  for (const mark of S.falloutMarks) {
    const dist = Math.hypot(mark.canvasX - x, mark.canvasY - y);
    if (dist <= Math.max(mergeThreshold, mark.radius * 0.8)) {
      targetMark = mark;
      break;
    }
  }

  if (targetMark) {
    targetMark.lon = (targetMark.lon + lon) / 2;
    targetMark.lat = (targetMark.lat + lat) / 2;
    targetMark.canvasX = x;
    targetMark.canvasY = y;
    targetMark.targetRadius = Math.max(targetMark.targetRadius, baseRadius * 1.1);
    targetMark.radius = Math.min(targetMark.targetRadius, targetMark.radius + baseRadius * 0.15);
    targetMark.targetIntensity = Math.min(1, targetMark.targetIntensity + intensityBoost * 0.7);
    targetMark.intensity = Math.min(1, targetMark.intensity + intensityBoost * 0.35);
    targetMark.lastStrikeAt = now;
    targetMark.updatedAt = now;
    targetMark.growthRate = Math.max(targetMark.growthRate, growthRate);
    targetMark.decayDelayMs = Math.max(targetMark.decayDelayMs, decayDelay);
    targetMark.decayRate = Math.max(targetMark.decayRate, decayRate);
  } else {
    const newMark: FalloutMark = {
      id: `fallout_${now}_${Math.random().toString(36).slice(2, 8)}`,
      lon,
      lat,
      canvasX: x,
      canvasY: y,
      radius: Math.max(18, baseRadius * 0.45),
      targetRadius: baseRadius,
      intensity: Math.min(1, intensityBoost * 0.6),
      targetIntensity: intensityBoost,
      createdAt: now,
      updatedAt: now,
      lastStrikeAt: now,
      growthRate,
      decayDelayMs: decayDelay,
      decayRate,
    };
    S.falloutMarks.push(newMark);
  }

  if (S.falloutMarks.length > MAX_FALLOUT_MARKS) {
    S.falloutMarks
      .sort((a, b) => a.lastStrikeAt - b.lastStrikeAt)
      .splice(0, S.falloutMarks.length - MAX_FALLOUT_MARKS);
  }
}

function drawFX() {
  if (!ctx) return;

  const now = Date.now();
  const deltaMs = lastFxTimestamp === null ? 16 : Math.max(1, now - lastFxTimestamp);
  lastFxTimestamp = now;

  if (S.screenShake && S.screenShake > 0) {
    const shakeX = (Math.random() - 0.5) * S.screenShake;
    const shakeY = (Math.random() - 0.5) * S.screenShake;
    ctx.save();
    ctx.translate(shakeX, shakeY);
    S.screenShake *= 0.9;
  }

  if (currentMapStyle === 'flat-realistic') {
    drawFalloutMarks(deltaMs);
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
      const projected = projectLocal(b.lon, b.lat);
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

  const [elon, elat] = toLonLatLocal(x, y);
  if (Number.isFinite(elon) && Number.isFinite(elat)) {
    upsertFalloutMark(x, y, elon, elat, yieldMT);
  }

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
      const [nx, ny] = projectLocal(n.lon, n.lat);
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
    const oldPopulation = target.population;
    target.population = Math.max(0, target.population - damage);
    target.instability = Math.min(100, (target.instability || 0) + yieldMT);

    log(`💥 ${yieldMT}MT detonation at ${target.name}! -${Math.floor(damage)}M`, "alert");

    // Track statistics
    if (target.isPlayer) {
      if (!S.statistics) S.statistics = { nukesLaunched: 0, nukesReceived: 0, enemiesDestroyed: 0 };
      S.statistics.nukesReceived++;
    }
    // Track if target was destroyed by this nuke
    if (oldPopulation > 0 && target.population <= 0 && !target.isPlayer) {
      const player = PlayerManager.get();
      if (player) {
        if (!S.statistics) S.statistics = { nukesLaunched: 0, nukesReceived: 0, enemiesDestroyed: 0 };
        S.statistics.enemiesDestroyed++;
      }
    }

    if (yieldMT >= 50) {
      DoomsdayClock.tick(0.5);
    }
  }
  
  checkVictory();
}

// Launch submarine
function launchSubmarine(from: Nation, to: Nation, yieldMT: number) {
  const [fx, fy] = projectLocal(from.lon, from.lat);
  const [tx, ty] = projectLocal(to.lon, to.lat);
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

  // Track statistics for submarine launches
  if (from.isPlayer) {
    if (!S.statistics) S.statistics = { nukesLaunched: 0, nukesReceived: 0, enemiesDestroyed: 0 };
    S.statistics.nukesLaunched++;

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
  const [sx, sy] = projectLocal(from.lon, from.lat);
  const [tx, ty] = projectLocal(to.lon, to.lat);

  S.bombers.push({
    from, to,
    t: 0,
    sx, sy, tx, ty,
    payload
  });

  // Track statistics for bombers as nuclear launches
  if (from.isPlayer) {
    if (!S.statistics) S.statistics = { nukesLaunched: 0, nukesReceived: 0, enemiesDestroyed: 0 };
    S.statistics.nukesLaunched++;

    toast({
      title: '✈️ Bomber Dispatched',
      description: `Strategic bomber en route to ${to.name}. Payload armed.`,
      variant: 'destructive',
    });
  }

  return true;
}

// createDefaultDiplomacyState now imported from @/state (Phase 6 refactoring)

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
    window.__gameAddNewsItem?.('diplomatic', 'Global coalition forming around your leadership', 'important');
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
    window.__gameAddNewsItem?.('diplomatic', 'Diplomatic triumph! A global coalition is declared.', 'critical');
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

  // Check for political collapse (inspired by Paradox/Total War games)
  const playerGovernance = governanceApiRef?.metrics[player.id];
  if (playerGovernance) {
    const politicalCheck = checkPoliticalGameOver(
      playerGovernance.publicOpinion,
      playerGovernance.cabinetApproval,
      playerGovernance.morale
    );

    if (politicalCheck.gameOver && politicalCheck.reason) {
      endGame(false, politicalCheck.reason);
      return;
    }
  }

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
  if (!player) return;

  const score = S.turn * 10 + player.population * 5 + player.missiles * 20;
  const timestamp = new Date().toISOString();

  // Count alliances and wars
  const alliances = Object.values(player.treaties || {}).filter((t: any) => t.alliance).length;
  const wars = nations.filter(n => n.id !== player.id && n.population > 0 && !player.treaties?.[n.id]?.alliance).length;

  // Calculate doomsday minutes (from a 7:00 countdown)
  const doomsdayMinutes = Math.max(0, 7 - (5 - S.defcon) * 1.5);

  // Collect comprehensive game statistics
  const statistics = {
    playerName: S.playerName || S.selectedLeader || 'Player',
    leader: S.selectedLeader || 'Unknown Leader',
    doctrine: S.selectedDoctrine || 'None',
    turns: S.turn,
    finalScore: Math.floor(score),
    victory,
    victoryMessage: message,

    // Nation statistics
    finalPopulation: player.population,
    finalProduction: player.production,
    finalCities: player.cities || 0,
    finalMissiles: player.missiles,
    finalBombers: player.bombers || 0,
    finalSubmarines: player.submarines || 0,
    finalDefense: player.defense,
    finalUranium: player.uranium,
    finalIntel: player.intel,

    // Governance
    finalMorale: player.morale,
    finalPublicOpinion: player.publicOpinion,
    finalCabinetApproval: player.cabinetApproval,

    // Military actions
    nukesLaunched: S.statistics?.nukesLaunched || 0,
    nukesReceived: S.statistics?.nukesReceived || 0,
    enemiesDestroyed: S.statistics?.enemiesDestroyed || 0,

    // Diplomacy
    alliances,
    wars,

    // Game state
    finalDefcon: S.defcon,
    doomsdayMinutes,

    timestamp,
  };

  // Save highscore
  const highscores = JSON.parse(Storage.getItem('highscores') || '[]');
  highscores.push({
    name: statistics.playerName,
    doctrine: statistics.doctrine,
    score: statistics.finalScore,
    turns: S.turn,
    date: timestamp
  });
  highscores.sort((a: any, b: any) => b.score - a.score);
  Storage.setItem('highscores', JSON.stringify(highscores.slice(0, 10)));

  // Store statistics for end game screen
  S.endGameStatistics = statistics;
  S.showEndGameScreen = true;

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

  if (aiHandleDiplomaticUrgencies(n, nations, log)) {
    return;
  }

  // Check if AI wants to initiate a proposal to the player
  if (player && !n.isPlayer) {
    const proposal = shouldAIInitiateProposal(n, player, S.turn);
    if (proposal) {
      // Queue the proposal to show to player
      if (enqueueAIProposalRef) {
        enqueueAIProposalRef(proposal);
      } else {
        console.warn('[ai] Pending AI proposal handler missing; dropping proposal', proposal);
      }
      log(`${n.name} has sent a diplomatic proposal to ${player.name}.`);
      return;
    }
  }

  const diplomacyBias = 0.18 + Math.max(0, defenseMod * 0.5) + (n.ai === 'defensive' ? 0.1 : 0) + (n.ai === 'balanced' ? 0.05 : 0);
  if (Math.random() < diplomacyBias) {
    if (aiAttemptDiplomacy(n, nations, log)) {
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

  // 10. CULTURAL VICTORY ATTEMPT - Check if AI has achieved cultural dominance
  const totalIntel = nations.reduce((sum, nation) => sum + (nation.intel || 0), 0);
  if (n.intel >= 50 && totalIntel > 0) {
    const influenceShare = n.intel / totalIntel;
    // AI attempts cultural victory if they have >50% influence
    if (influenceShare > 0.5 && Math.random() < 0.8) {
      n.intel -= 50;
      log(`${n.name} achieves CULTURAL VICTORY through propaganda dominance!`);
      endGame(false, `${n.name} wins through cultural hegemony - their propaganda has conquered the world's minds!`);
      return;
    }
  }

  // 11. ENHANCED AI ACTIONS - Cyber, Immigration, Conventional Warfare
  const enhancedActionExecuted = enhancedAIActions(
    n,
    nations,
    S.turn,
    COSTS,
    {
      templates: window.__conventionalWarfare?.templates,
      trainUnit: window.__conventionalWarfare?.trainUnit,
      deployUnit: window.__conventionalWarfare?.deployUnit,
      resolveBorderConflict: window.__conventionalWarfare?.resolveBorderConflict,
      getUnitsForNation: window.__conventionalWarfare?.getUnitsForNation,
    },
    {
      launchCyberAttack: window.__cyberWarfare?.launchCyberAttack,
    },
    log
  );

  if (enhancedActionExecuted) {
    updateDisplay();
    return;
  }

  const cyberOutcome = window.__cyberAiPlan?.(n.id);
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
          if (nation && window.__gameAddNewsItem) {
            window.__gameAddNewsItem('military', `${nation.name} has begun constructing bio-laboratory (Tier ${tier})`, 'alert');
          }
        },
        onPlagueSelected: (nationId, plagueType) => {
          const nation = nations.find(n => n.id === nationId);
          if (nation && window.__gameAddNewsItem) {
            window.__gameAddNewsItem('crisis', `INTELLIGENCE: ${nation.name} has initiated bio-weapon program`, 'critical');
          }
        },
        onNodeEvolved: (nationId, nodeId) => {
          // Silent - too many events otherwise
        },
        onDeployment: (nationId, targets) => {
          const nation = nations.find(n => n.id === nationId);
          if (nation && window.__gameAddNewsItem) {
            window.__gameAddNewsItem('crisis', `ALERT: Bio-weapon deployment detected from ${nation.name}`, 'critical');
          }
        }
      });

      window.__cyberAdvance?.();

      const player = PlayerManager.get();
      // Find plague owner (nation with active bio-lab and plague)
      const plagueOwner = nations?.find(n => n.bioLab && n.plagueState?.plagueStarted);
      const pandemicResult = window.__pandemicAdvance?.({
        turn: S.turn,
        defcon: S.defcon,
        playerPopulation: player?.population ?? 0,
        difficulty: S.difficulty || 'normal',
        plagueOwnerId: plagueOwner?.id
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

      let populationAdjusted = false;
      if (pandemicResult?.casualtyTotals) {
        for (const [nationId, deaths] of Object.entries(pandemicResult.casualtyTotals)) {
          if (deaths <= 0) continue;
          const nation = nations.find(n => n.id === nationId);
          if (!nation) continue;
          const populationLoss = deaths / 1_000_000;
          if (populationLoss <= 0) continue;
          nation.population = Math.max(0, nation.population - populationLoss);
          if (nation.isPlayer && player) {
            player.population = Math.max(0, player.population - populationLoss);
          }
          populationAdjusted = true;
        }
      }

      if (populationAdjusted) {
        updateDisplay();
      }

      // Trigger flashpoint check at start of new turn
      if (window.__gameTriggerFlashpoint) {
        const flashpoint = window.__gameTriggerFlashpoint(S.turn, S.defcon);
        if (flashpoint) {
          window.__gameAddNewsItem?.('crisis', `CRITICAL: ${flashpoint.title}`, 'critical');
        }
      }

      // Check for AI regime changes (inspired by Hearts of Iron 4 & Civilization 6)
      const aiNationsForRegimeCheck = nations.filter(n => !n.isPlayer && n.population > 0);
      aiNationsForRegimeCheck.forEach(nation => {
        const metrics = governanceApiRef?.metrics[nation.id];
        if (!metrics || !governanceApiRef) return;

        const shouldChange = shouldRegimeChangeOccur(
          nation.instability || 0,
          metrics.publicOpinion,
          metrics.morale,
          metrics.cabinetApproval,
          false // We'd need to track failed elections to pass true here
        );

        if (shouldChange && nation.ai) {
          const result = executeRegimeChange(
            nation.ai as AIPersonality,
            nation.leader,
            nation.instability || 0
          );

          if (result.occurred && result.newPersonality && result.newLeader && result.newMetrics) {
            // Apply regime change
            nation.ai = result.newPersonality;
            nation.leader = result.newLeader;

            // Apply military losses (divisions, missiles reduced)
            if (result.militaryLosses) {
              nation.missiles = Math.floor(nation.missiles * (1 - result.militaryLosses));
              if (nation.bombers) {
                nation.bombers = Math.floor(nation.bombers * (1 - result.militaryLosses));
              }
              if (nation.submarines) {
                nation.submarines = Math.floor(nation.submarines * (1 - result.militaryLosses));
              }
            }

            // Reset governance metrics
            governanceApiRef.applyGovernanceDelta(nation.id, {
              morale: result.newMetrics.morale - metrics.morale,
              publicOpinion: result.newMetrics.publicOpinion - metrics.publicOpinion,
              cabinetApproval: result.newMetrics.cabinetApproval - metrics.cabinetApproval,
              electionTimer: result.newMetrics.electionTimer - metrics.electionTimer,
            });

            nation.instability = result.newMetrics.instability;

            // Generate breaking news
            const newsItem = generateRegimeChangeNews(nation.name, result);
            if (window.__gameAddNewsItem) {
              window.__gameAddNewsItem('crisis', newsItem.text, newsItem.priority);
            }
          }
        }
      });

      // Generate political warnings for player
      const playerForWarnings = PlayerManager.get();
      if (playerForWarnings) {
        const playerMetrics = governanceApiRef?.metrics[playerForWarnings.id];
        if (playerMetrics) {
          const warnings = generatePoliticalWarnings(
            playerMetrics.publicOpinion,
            playerMetrics.cabinetApproval,
            playerMetrics.morale
          );

          warnings.forEach(warning => {
            if (window.__gameAddNewsItem) {
              window.__gameAddNewsItem('crisis', warning.text, warning.priority);
            }
          });
        }
      }

      // Generate enhanced political news (every 2-3 turns)
      if (window.__gameAddNewsItem && S.turn % 2 === 0) {
        const newsNations = nations
          .filter(n => n.population > 0)
          .map(n => {
            const metrics = governanceApiRef?.metrics[n.id];
            return {
              name: n.name,
              morale: metrics?.morale || 60,
              publicOpinion: metrics?.publicOpinion || 60,
              cabinetApproval: metrics?.cabinetApproval || 60,
              instability: n.instability || 0,
              ai: (n.ai || 'balanced') as AIPersonality,
              isPlayer: n.isPlayer,
            };
          });

        const turnNews = generateTurnNews(newsNations, S.turn);
        turnNews.forEach(item => {
          window.__gameAddNewsItem(item.category, item.text, item.priority);
        });
      }

      // Update Great Old Ones campaign systems (if active)
      if (S.scenario?.id === 'greatOldOnes' && S.greatOldOnes) {
        const gooState = S.greatOldOnes;

        // Update Week 3 systems (ritual sites, units, missions)
        if (week3State) {
          const updatedWeek3 = updateWeek3Systems(gooState, week3State);
          setWeek3State(updatedWeek3);
        }

        // Update Phase 2 systems (if unlocked)
        if (phase2State) {
          // Check if phase 2 should unlock
          if (!phase2State.unlocked) {
            const unlockCheck = checkPhase2UnlockConditions(gooState);
            if (unlockCheck.shouldUnlock) {
              phase2State.unlocked = true;
              if (window.__gameAddNewsItem) {
                window.__gameAddNewsItem('occult', 'Phase 2 Doctrine Paths Unlocked', 'info');
              }
            }
          }

          if (phase2State.unlocked) {
            const updatedPhase2 = updatePhase2Systems(gooState, phase2State);
            setPhase2State(updatedPhase2);
          }
        }

        // Update Phase 3 systems (if unlocked)
        if (phase3State && phase2State) {
          // Check if phase 3 should unlock
          if (!phase3State.unlocked) {
            const unlockCheck = checkPhase3UnlockConditions(gooState, phase2State);
            if (unlockCheck.shouldUnlock) {
              phase3State.unlocked = true;
              if (window.__gameAddNewsItem) {
                window.__gameAddNewsItem('occult', 'Phase 3 Endgame Systems Unlocked', 'critical');
              }
            }
          }

          if (phase3State.unlocked) {
            const updatedPhase3 = updatePhase3Systems(gooState, phase2State, phase3State);
            setPhase3State(updatedPhase3);
          }
        }

        // Persist updated state
        setGreatOldOnesState({ ...gooState });
        GameStateManager.setGreatOldOnes(gooState);
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

  const gameTimeEl = document.getElementById('gameTimeDisplay');
  if (gameTimeEl) {
    const timeConfig = S.scenario?.timeConfig ?? getDefaultScenario().timeConfig;
    const timestamp = getGameTimestamp(Math.max(0, S.turn - 1), timeConfig);
    gameTimeEl.textContent = timestamp;
  }

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
  const hasBootstrappedGameRef = useRef(false);

  // Modal management - Extracted to useModalManager hook (Phase 7 refactoring)
  const { showModal, modalContent, openModal, closeModal } = useModalManager();
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(() => {
    const stored = Storage.getItem('selected_scenario');
    if (stored && stored in SCENARIOS) {
      return stored;
    }
    return S.scenario?.id ?? getDefaultScenario().id;
  });
  const [isScenarioPanelOpen, setIsScenarioPanelOpen] = useState(false);
  const scenarioOptions = useMemo(() => Object.values(SCENARIOS), []);
  const selectedScenario = useMemo(() => {
    return SCENARIOS[selectedScenarioId] ?? getDefaultScenario();
  }, [selectedScenarioId]);
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
  const [civInfoPanelOpen, setCivInfoPanelOpen] = useState(false);
  const [civInfoDefaultTab, setCivInfoDefaultTab] = useState<'own-status' | 'enemy-status' | 'diplomacy' | 'research'>('own-status');
  const [activeDiplomacyProposal, setActiveDiplomacyProposal] = useState<DiplomacyProposal | null>(null);
  const [pendingAIProposals, setPendingAIProposals] = useState<DiplomacyProposal[]>([]);
  const [showEnhancedDiplomacy, setShowEnhancedDiplomacy] = useState(false);

  useEffect(() => {
    enqueueAIProposalRef = (proposal) => {
      setPendingAIProposals(prev => [...prev, proposal]);
    };
    return () => {
      enqueueAIProposalRef = null;
    };
  }, [setPendingAIProposals]);
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
      return stored as MapStyle;
    }

    return 'flat-realistic';
  });

  const handleMapStyleChange = useCallback((style: MapStyle) => {
    setMapStyle(prev => {
      if (prev === style) {
        return prev;
      }

      Storage.setItem('map_style', style);
      currentMapStyle = style;
      AudioSys.playSFX('click');
      if (style === 'flat-realistic') {
        void preloadFlatRealisticTexture();
      }
      toast({
        title: 'Map style updated',
        description: `Display mode changed to ${style}`,
      });

      return style;
    });
  }, [toast]);

  useEffect(() => {
    const scenario = SCENARIOS[selectedScenarioId] ?? getDefaultScenario();
    S.scenario = scenario;
    Storage.setItem('selected_scenario', scenario.id);
  }, [selectedScenarioId]);

  const handleScenarioSelect = useCallback((scenarioId: string) => {
    if (!(scenarioId in SCENARIOS)) {
      return;
    }
    setSelectedScenarioId(scenarioId);
    setIsScenarioPanelOpen(false);

    // Update window.S when scenario is selected to ensure hooks can detect it
    if (typeof window !== 'undefined' && (window as any).S) {
      console.log('[Game State] Scenario selected:', scenarioId);
    }
  }, []);

  const handleIntroStart = useCallback(() => {
    const scenario = SCENARIOS[selectedScenarioId] ?? getDefaultScenario();
    S.scenario = scenario;
    S.turn = 1;
    S.phase = 'PLAYER';
    S.gameOver = false;
    S.paused = false;
    S.defcon = scenario.startingDefcon;
    S.actionsRemaining = S.defcon >= 4 ? 1 : S.defcon >= 2 ? 2 : 3;

    // Initialize Great Old Ones campaign if selected
    if (scenario.id === 'greatOldOnes') {
      const gooState = initializeGreatOldOnesState();
      S.greatOldOnes = gooState;
      GameStateManager.setGreatOldOnes(gooState);
      setGreatOldOnesState(gooState);
      setWeek3State(initializeWeek3State());
      setPhase2State(initializePhase2State());
      setPhase3State(initializePhase3State());
    } else {
      // Clear Great Old Ones state for other scenarios
      S.greatOldOnes = undefined;
      GameStateManager.setGreatOldOnes(undefined);
      setGreatOldOnesState(null);
      setWeek3State(null);
      setPhase2State(null);
      setPhase3State(null);
    }

    // Expose updated S to window after scenario is set
    if (typeof window !== 'undefined') {
      (window as any).S = S;
      console.log('[Game State] Exposed S to window after intro start. Scenario ID:', S.scenario?.id);
    }

    updateDisplay();
    setGamePhase('leader');
  }, [selectedScenarioId, setGamePhase]);

  // Globe viewer type - Three.js or Cesium
  const [viewerType, setViewerType] = useState<'threejs' | 'cesium'>(() => {
    const stored = Storage.getItem('viewer_type');
    return stored === 'cesium' ? 'cesium' : 'threejs';
  });

  const handleViewerSelect = useCallback((nextType: 'threejs' | 'cesium') => {
    setViewerType(prev => {
      if (prev === nextType) {
        return prev;
      }

      Storage.setItem('viewer_type', nextType);
      return nextType;
    });
  }, []);

  // Screen resolution preference
  const [screenResolution, setScreenResolution] = useState<ScreenResolution>(() => {
    const stored = Storage.getItem('screen_resolution');
    if (stored === 'auto' || stored === '1280x720' || stored === '1600x900' || stored === '1920x1080' || stored === '2560x1440' || stored === '3840x2160') {
      return stored;
    }
    return 'auto';
  });

  const handleResolutionSelect = useCallback((resolution: ScreenResolution) => {
    setScreenResolution(resolution);
    Storage.setItem('screen_resolution', resolution);
    const selectedOption = RESOLUTION_OPTIONS.find(opt => opt.value === resolution);
    toast({
      title: `Resolution: ${selectedOption?.label ?? resolution}`,
      description: selectedOption?.description ?? 'Resolution updated',
    });
  }, []);

  // Tutorial and phase transition system
  const tutorialContext = useTutorialContext();
  const [isPhaseTransitioning, setIsPhaseTransitioning] = useState(false);

  // Era system state
  const [showEraTransition, setShowEraTransition] = useState(false);
  const [eraTransitionData, setEraTransitionData] = useState<{
    era: 'early' | 'mid' | 'late';
    name: string;
    description: string;
    features: any[];
  } | null>(null);

  // Consequence preview state
  const [consequencePreview, setConsequencePreview] = useState<ActionConsequences | null>(null);
  const [consequenceCallback, setConsequenceCallback] = useState<(() => void) | null>(null);

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

  // Great Old Ones state
  const [greatOldOnesState, setGreatOldOnesState] = useState<GreatOldOnesState | null>(null);
  const [week3State, setWeek3State] = useState<Week3ExtendedState | null>(null);
  const [phase2State, setPhase2State] = useState<Phase2State | null>(null);
  const [phase3State, setPhase3State] = useState<Phase3State | null>(null);
  const [diplomacyPhase3State, setDiplomacyPhase3State] = useState<DiplomacyPhase3SystemState | null>(
    () => S.diplomacyPhase3 ?? null
  );
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
        // Parse failed - use default state
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
    if (!isGameStarted) {
      return;
    }

    if (hasBootstrappedGameRef.current) {
      return;
    }

    hasBootstrappedGameRef.current = true;

    AudioSys.init();
    Atmosphere.init();
    Ocean.init();

    if (nations.length === 0) {
      initNations();
      setConventionalState(S.conventional ?? createDefaultConventionalState());
      CityLights.generate();
    }

    if (!gameLoopRunning) {
      gameLoopRunning = true;
      loadWorld().then(() => {
        requestAnimationFrame(gameLoop);
      });
    }
  }, [isGameStarted, setConventionalState]);
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

  // Tutorial restart callbacks
  const handleRestartModalTutorial = useCallback(() => {
    Storage.removeItem('has_seen_tutorial');
    setShowTutorial(true);
    toast({
      title: 'Tutorial restarted',
      description: 'The introductory tutorial will now be shown.',
    });
  }, []);

  const handleRestartInteractiveTutorial = useCallback(() => {
    tutorialContext.enableTutorial();
    toast({
      title: 'Interactive guide restarted',
      description: 'The in-game interactive tutorial will now restart from the beginning.',
    });
  }, [tutorialContext]);

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
    const sanitizedState: LocalGameState = {
      ...S,
      falloutMarks: Array.isArray(S.falloutMarks)
        ? S.falloutMarks.map(mark => ({ ...mark }))
        : [],
    };
    publishState({
      gameState: sanitizedState,
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
          const remoteState = state.gameState as Partial<LocalGameState>;
          S = applyRemoteGameStateSync(remoteState);
          if (!Array.isArray(S.satelliteOrbits)) {
            S.satelliteOrbits = [];
          }
          if (!Array.isArray(S.falloutMarks)) {
            S.falloutMarks = [];
          }
        }
        if (state.nations) {
          nations = state.nations.map(nation => ({ ...nation }));
          GameStateManager.setNations(nations);
          PlayerManager.setNations(nations);
        }
        if (state.conventionalDeltas) {
          conventionalDeltas = state.conventionalDeltas.map(delta => ({ ...delta }));
          GameStateManager.setConventionalDeltas(conventionalDeltas);
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
  // News management - Extracted to useNewsManager hook (Phase 7 refactoring)
  const { newsItems, addNewsItem } = useNewsManager();
  const [currentFlashpointOutcome, setCurrentFlashpointOutcome] = useState<FlashpointOutcome | null>(null);
  const { activeFlashpoint, triggerRandomFlashpoint, resolveFlashpoint, dismissFlashpoint } = useFlashpoints();
  const { distortNationIntel, generateFalseIntel } = useFogOfWar();


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
      const nation = getNationById(nations, nationId);
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
      const nation = getNationById(nations, nationId);
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

  // Era system for progressive complexity
  const gameEra = useGameEra({
    currentTurn: S.turn,
    scenario: S.scenario,
    onEraChange: (newEra, oldEra, definitions) => {
      const eraDef = definitions[newEra];
      const previousEraFeatures = definitions[oldEra]?.unlockedFeatures ?? [];
      const newFeatures = eraDef.unlockedFeatures.filter(
        (feature) => !previousEraFeatures.includes(feature)
      );

      setEraTransitionData({
        era: newEra,
        name: eraDef.name,
        description: eraDef.description,
        features: newFeatures.map((feature) => {
          const info = FEATURE_UNLOCK_INFO[feature];
          return {
            ...info,
            unlockTurn: eraDef.startTurn,
          };
        }),
      });
      setShowEraTransition(true);

      addNewsItem(
        'crisis',
        `🎯 ${eraDef.name} begins! New systems unlocked.`,
        'urgent'
      );
    },
  });

  // Victory tracking system
  const victoryAnalysis = useVictoryTracking({
    nations,
    playerName: S.playerName || 'Player',
    currentTurn: S.turn,
    defcon: S.defcon,
    diplomacyState: S.diplomacy,
  });

  useEffect(() => {
    governanceApiRef = governance;
    return () => {
      if (governanceApiRef === governance) {
        governanceApiRef = null;
      }
    };
  }, [governance]);

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
      // Persistence failed - not critical, game continues
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
    let nation = getNationById(nations, ownerId);
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
    window.__cyberAdvance = advanceCyberTurn;
    window.__cyberAiPlan = runCyberAiPlan;
    return () => {
      delete window.__cyberAdvance;
      delete window.__cyberAiPlan;
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
    window.__gameAddNewsItem = addNewsItem;
    window.__gameTriggerFlashpoint = triggerRandomFlashpoint;
    window.__pandemicTrigger = (payload: unknown) => triggerPandemicRef.current(payload as any);
    window.__pandemicCountermeasure = (payload: unknown) => applyPandemicCountermeasureRef.current(payload as any);
    window.__pandemicAdvance = (context: unknown) => advancePandemicTurnRef.current(context as any);
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
          scenarioId: S.scenario?.id ?? getDefaultScenario().id,
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
    let width = Math.floor(rect?.width ?? fallbackWidth);
    let height = Math.floor(rect?.height ?? fallbackHeight);

    // Apply resolution override if not set to 'auto'
    if (screenResolution !== 'auto') {
      const resolutionOption = RESOLUTION_OPTIONS.find(opt => opt.value === screenResolution);
      if (resolutionOption?.width && resolutionOption?.height) {
        width = Math.min(resolutionOption.width, width);
        height = Math.min(resolutionOption.height, height);

        // Maintain aspect ratio of the selected resolution
        const targetAspect = resolutionOption.width / resolutionOption.height;
        const containerAspect = (rect?.width ?? fallbackWidth) / (rect?.height ?? fallbackHeight);

        if (containerAspect > targetAspect) {
          // Container is wider - fit to height
          width = Math.floor(height * targetAspect);
        } else {
          // Container is taller - fit to width
          height = Math.floor(width / targetAspect);
        }
      }
    }

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
  }, [screenResolution]);

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

    // Expose updated S to window when game starts
    if (typeof window !== 'undefined') {
      (window as any).S = S;
      console.log('[Game State] Exposed S to window at game start. Scenario ID:', S.scenario?.id, 'Leader:', leaderToUse, 'Doctrine:', doctrineToUse);
    }

    setIsGameStarted(true);
  }, [selectedLeader, selectedDoctrine]);

  // MilitaryModal - Extracted to src/components/game/MilitaryModal.tsx (Phase 7 refactoring)
  const renderMilitaryModal = useCallback((): ReactNode => {
    return (
      <MilitaryModal
        conventionalUnits={conventionalUnits}
        conventionalTerritories={conventionalTerritories}
        conventionalTemplatesMap={conventionalTemplatesMap}
        conventionalLogs={conventionalLogs}
        trainConventionalUnit={trainConventionalUnit}
        deployConventionalUnit={deployConventionalUnit}
        getConventionalUnitsForNation={getConventionalUnitsForNation}
        resolveConventionalBorderConflict={resolveConventionalBorderConflict}
        resolveConventionalProxyEngagement={resolveConventionalProxyEngagement}
        toast={toast}
        addNewsItem={addNewsItem}
      />
    );
  }, [
    conventionalUnits,
    conventionalTerritories,
    conventionalTemplatesMap,
    conventionalLogs,
    trainConventionalUnit,
    deployConventionalUnit,
    getConventionalUnitsForNation,
    resolveConventionalBorderConflict,
    resolveConventionalProxyEngagement,
    toast,
    addNewsItem,
  ]);

  const handleMilitary = useCallback(() => {
    openModal('CONVENTIONAL COMMAND', renderMilitaryModal);
  }, [openModal, renderMilitaryModal]);

  // ResearchModal - Extracted to src/components/game/ResearchModal.tsx (Phase 7 refactoring)
  const renderResearchModal = useCallback((): ReactNode => {
    return <ResearchModal closeModal={closeModal} startResearch={startResearch} />;
  }, [closeModal, startResearch]);

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


  // BuildModal - Extracted to src/components/game/BuildModal.tsx (Phase 7 refactoring)
  const renderBuildModal = useCallback((): ReactNode => {
    return (
      <BuildModal
        isGameStarted={isGameStarted}
        buildMissile={buildMissile}
        buildBomber={buildBomber}
        buildDefense={buildDefense}
        buildCity={buildCity}
        buildWarhead={buildWarhead}
      />
    );
  }, [isGameStarted, buildMissile, buildBomber, buildDefense, buildCity, buildWarhead]);

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
    setCivInfoDefaultTab('research');
    setCivInfoPanelOpen(true);
  }, [requestApproval]);

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
          openModal('INTELLIGENCE REPORT', <IntelReportContent player={commander} nations={nations} onClose={closeModal} />);
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
            adjustThreat(target, commander.id, 15);
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
            adjustThreat(target, commander.id, 35);
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
            const warheadTypes = Object.keys(target.warheads || {}).filter(key => (target.warheads?.[Number(key)] || 0) > 0);
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
              adjustThreat(target, commander.id, 20);
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
    setCivInfoDefaultTab('research');
    setCivInfoPanelOpen(true);
  }, []);

  const handleStartLabConstruction = useCallback((tier: number) => {
    const player = getNationById(nations, playerNationId);
    if (!player) return;

    const result = startLabConstruction(tier as BioLabTier, player.production, player.uranium);

    if (result.success) {
      toast({
        title: 'Construction Started',
        description: result.message,
        duration: 3000,
      });
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
    // Calculate total intel cost
    const totalIntelCost = selections.reduce((total, selection) => {
      const method = DEPLOYMENT_METHODS.find(m => m.id === selection.deploymentMethod);
      return total + (method?.intelCost || 0);
    }, 0);

    // Deduct intel from player
    const player = PlayerManager.get();
    if (player) {
      player.intel = Math.max(0, (player.intel || 0) - totalIntelCost);
    }

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

    // Show enhanced diplomacy modal with Phase 3 features
    setShowEnhancedDiplomacy(true);
    return;

    // Legacy diplomacy actions (kept for reference, unreachable)
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
        case 'truce': {
          if (!target) return false;
          // Create proposal for AI to evaluate
          const truceProposal: DiplomacyProposal = {
            id: `player-truce-${S.turn}-${Date.now()}`,
            type: 'truce',
            proposerId: commander.id,
            targetId: target.id,
            terms: { duration: 2 },
            message: `${commander.name} proposes a 2-turn truce with ${target.name}.`,
            turn: S.turn,
            playerInitiated: true
          };

          const truceResponse = evaluateProposal(truceProposal, target, commander, nations);

          if (truceResponse.accepted) {
            ensureTreaty(commander, target).truceTurns = 2;
            ensureTreaty(target, commander).truceTurns = 2;
            log(`${target.name} accepts truce for 2 turns. ${truceResponse.reason}`);
            toast({
              title: 'Truce Accepted',
              description: `${target.name} agrees to a 2-turn ceasefire.`
            });
          } else {
            log(`${target.name} rejects truce proposal. ${truceResponse.reason}`);
            toast({
              title: 'Truce Rejected',
              description: truceResponse.reason,
              variant: 'destructive'
            });
            // Penalty for rejection
            adjustThreat(target, commander.id, 3);
          }
          updateDisplay();
          consumeAction();
          return true;
        }

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
          if (window.__gameAddNewsItem) {
            window.__gameAddNewsItem('diplomatic', `UN Security Council approves de-escalation - DEFCON ${S.defcon}`, 'important');
          }
          updateDisplay();
          consumeAction();
          return true;

        case 'alliance': {
          if (!target) return false;
          if ((commander.production || 0) < 10 || (commander.intel || 0) < 40) {
            toast({ title: 'Insufficient resources', description: 'You need 10 PRODUCTION and 40 INTEL to form an alliance.' });
            return false;
          }

          // Create alliance proposal for AI to evaluate
          const allianceProposal: DiplomacyProposal = {
            id: `player-alliance-${S.turn}-${Date.now()}`,
            type: 'alliance',
            proposerId: commander.id,
            targetId: target.id,
            terms: {},
            message: `${commander.name} proposes a permanent alliance with ${target.name}.`,
            turn: S.turn,
            playerInitiated: true
          };

          const allianceResponse = evaluateProposal(allianceProposal, target, commander, nations);

          if (allianceResponse.accepted) {
            commander.production = Math.max(0, (commander.production || 0) - 10);
            commander.intel -= 40;
            ensureTreaty(commander, target).truceTurns = 999;
            ensureTreaty(commander, target).alliance = true;
            ensureTreaty(target, commander).truceTurns = 999;
            ensureTreaty(target, commander).alliance = true;
            log(`${target.name} accepts alliance! ${allianceResponse.reason}`);
            toast({
              title: 'Alliance Formed',
              description: `${target.name} agrees to a permanent alliance!`
            });
          } else {
            log(`${target.name} rejects alliance proposal. ${allianceResponse.reason}`);
            toast({
              title: 'Alliance Rejected',
              description: allianceResponse.reason,
              variant: 'destructive'
            });
            // Penalty for rejection
            adjustThreat(target, commander.id, 4);
          }
          updateDisplay();
          consumeAction();
          return true;
        }

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

        case 'pact': {
          if (!target) return false;
          if ((commander.intel || 0) < 15) {
            toast({ title: 'Insufficient intel', description: 'You need 15 INTEL for a non-aggression pact.' });
            return false;
          }

          // Create non-aggression pact proposal for AI to evaluate
          const pactProposal: DiplomacyProposal = {
            id: `player-pact-${S.turn}-${Date.now()}`,
            type: 'non-aggression',
            proposerId: commander.id,
            targetId: target.id,
            terms: { duration: 5 },
            message: `${commander.name} proposes a 5-turn non-aggression pact with ${target.name}.`,
            turn: S.turn,
            playerInitiated: true
          };

          const pactResponse = evaluateProposal(pactProposal, target, commander, nations);

          if (pactResponse.accepted) {
            commander.intel -= 15;
            ensureTreaty(commander, target).truceTurns = 5;
            ensureTreaty(target, commander).truceTurns = 5;
            log(`${target.name} accepts non-aggression pact. ${pactResponse.reason}`);
            toast({
              title: 'Pact Accepted',
              description: `${target.name} agrees to a 5-turn non-aggression pact.`
            });
          } else {
            log(`${target.name} rejects non-aggression pact. ${pactResponse.reason}`);
            toast({
              title: 'Pact Rejected',
              description: pactResponse.reason,
              variant: 'destructive'
            });
            // Penalty for rejection
            adjustThreat(target, commander.id, 3);
          }
          updateDisplay();
          consumeAction();
          return true;
        }

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

  // Diplomacy Proposal Handlers
  const handleAcceptProposal = useCallback(() => {
    if (!activeDiplomacyProposal) return;

    const proposer = getNationById(nations, activeDiplomacyProposal.proposerId);
    const target = getNationById(nations, activeDiplomacyProposal.targetId);

    if (!proposer || !target) {
      setActiveDiplomacyProposal(null);
      return;
    }

    // Execute the diplomatic action based on proposal type
    switch (activeDiplomacyProposal.type) {
      case 'alliance':
        aiFormAlliance(proposer, target, log);
        log(`${target.name} accepts alliance with ${proposer.name}!`);
        break;

      case 'truce': {
        const duration = activeDiplomacyProposal.terms.duration || 3;
        aiSignMutualTruce(proposer, target, duration, log, 'Diplomatic agreement');
        log(`${target.name} accepts ${duration}-turn truce with ${proposer.name}.`);
        break;
      }

      case 'non-aggression':
        aiSignNonAggressionPact(proposer, target, log);
        log(`${target.name} signs non-aggression pact with ${proposer.name}.`);
        break;

      case 'aid-request':
        if (target.production >= 20) {
          target.production -= 20;
          proposer.production += 15;
          if (proposer.instability) proposer.instability = Math.max(0, proposer.instability - 10);
          log(`${target.name} provides economic aid to ${proposer.name}.`);
        }
        break;

      case 'sanction-lift':
        if (target.sanctionedBy?.[proposer.id]) {
          delete target.sanctionedBy[proposer.id];
          log(`${target.name} lifts sanctions against ${proposer.name}.`);
        }
        break;

      case 'peace-offer':
        aiSignMutualTruce(proposer, target, 5, 'Peace agreement');
        adjustThreat(proposer, target.id, -5);
        adjustThreat(target, proposer.id, -5);
        log(`${target.name} accepts peace with ${proposer.name}.`);
        break;
    }

    // Improve relations
    adjustThreat(proposer, target.id, -2);

    toast({
      title: 'Proposal Accepted',
      description: `You have accepted ${proposer.name}'s proposal.`
    });

    setActiveDiplomacyProposal(null);
  }, [activeDiplomacyProposal, getNationById, toast]);

  const handleRejectProposal = useCallback(() => {
    if (!activeDiplomacyProposal) return;

    const proposer = getNationById(nations, activeDiplomacyProposal.proposerId);
    const target = getNationById(nations, activeDiplomacyProposal.targetId);

    if (!proposer || !target) {
      setActiveDiplomacyProposal(null);
      return;
    }

    // Damage relations for rejection (-6 penalty like Civ 6)
    adjustThreat(proposer, target.id, 6);

    log(`${target.name} rejects ${proposer.name}'s diplomatic proposal. Relations have deteriorated.`);

    toast({
      title: 'Proposal Rejected',
      description: `You have rejected ${proposer.name}'s proposal. Relations have worsened.`,
      variant: 'destructive'
    });

    setActiveDiplomacyProposal(null);
  }, [activeDiplomacyProposal, getNationById, toast]);

  const handleEnhancedDiplomacyAction = useCallback((action: DiplomaticAction, target?: Nation) => {
    const player = PlayerManager.get();
    if (!player) return;

    const currentTurn = S.turn;
    const targetNation = target
      ? nations.find((nation) => nation.id === target.id) ?? target
      : undefined;

    if (action.requiresTarget && !targetNation) {
      toast({
        title: 'Select a target nation',
        description: 'Choose a nation before executing this diplomatic action.',
        variant: 'destructive',
      });
      return;
    }

    if (action.id === 'call-in-favor' && targetNation) {
      const availableFavors = getFavors(player, targetNation.id);
      if (availableFavors <= 0) {
        toast({
          title: 'No favors available',
          description: `${targetNation.name} does not owe you any favors to call in.`,
          variant: 'destructive',
        });
        return;
      }
    }

    if (action.id === 'verify-promise' && targetNation) {
      const playerHasPromise = player.diplomaticPromises?.some(
        (p) => p.toNationId === targetNation.id && !p.fulfilled && !p.broken
      );
      const targetHasPromise = targetNation.diplomaticPromises?.some(
        (p) => p.toNationId === player.id && !p.fulfilled && !p.broken
      );
      if (!playerHasPromise && !targetHasPromise) {
        toast({
          title: 'No promises to verify',
          description: `${targetNation.name} has no active promises with you right now.`,
        });
        return;
      }
    }

    const ensurePhase3State = (): DiplomacyPhase3SystemState => {
      if (!S.diplomacyPhase3) {
        S.diplomacyPhase3 = initializeDiplomacyPhase3State(S.turn);
      }

      if (!S.diplomacyPhase3.phase3Enabled) {
        S.diplomacyPhase3 = {
          ...S.diplomacyPhase3,
          phase3Enabled: true,
          activatedTurn: Math.min(S.diplomacyPhase3.activatedTurn ?? currentTurn, currentTurn),
        };
      }

      return S.diplomacyPhase3;
    };

    const persistPhase3State = (nextPhase3: DiplomacyPhase3SystemState) => {
      S.diplomacyPhase3 = nextPhase3;
      const nextState = { ...S, diplomacyPhase3: nextPhase3 } as LocalGameState;
      GameStateManager.setState(nextState);
      S = nextState;
      (window as any).S = S;
      setDiplomacyPhase3State(nextPhase3);
    };

    const ensureCouncil = () => {
      let phase3 = ensurePhase3State();
      if (phase3.internationalCouncil) {
        return phase3.internationalCouncil;
      }

      const permanentMembers = nations
        .filter((nation) => nation.councilMembership === 'permanent')
        .map((nation) => nation.id);

      let council = initializeInternationalCouncil(currentTurn, permanentMembers);

      const electedMembers = nations.filter((nation) => nation.councilMembership === 'elected');
      for (const member of electedMembers) {
        council = electCouncilMember(council, member.id, currentTurn);
      }

      const observerMembers = nations.filter((nation) => nation.councilMembership === 'observer');
      for (const observer of observerMembers) {
        council = addObserver(council, observer.id);
      }

      phase3 = {
        ...phase3,
        phase3Enabled: true,
        internationalCouncil: council,
      };

      persistPhase3State(phase3);
      return council;
    };

    let updatedPlayer: Nation = player;
    let updatedTarget: Nation | undefined = targetNation;
    let newsItem: { text: string; priority: 'info' | 'important' | 'critical' } | null = null;
    let toastPayload: { title: string; description: string; variant?: 'default' | 'destructive' | 'success' } | null = null;

    const trySpendDip = (cost: number, reason: string, withNationId?: string): boolean => {
      const spent = spendDIP(updatedPlayer, cost, reason, currentTurn, withNationId ?? updatedTarget?.id);
      if (!spent) {
        toast({
          title: 'Insufficient DIP',
          description: `This action requires ${cost} DIP.`,
          variant: 'destructive',
        });
        return false;
      }

      updatedPlayer = spent;
      return true;
    };

    if (
      action.dipCost &&
      action.id !== 'propose-resolution' &&
      action.id !== 'call-session'
    ) {
      const success = trySpendDip(action.dipCost, action.id, targetNation?.id);
      if (!success) {
        return;
      }
    }

    switch (action.id) {
      case 'build-trust': {
        if (!updatedTarget) break;
        const reason = `Trust-building summit with ${updatedTarget.name}`;
        updatedPlayer = modifyTrust(updatedPlayer, updatedTarget.id, 3, reason, currentTurn);
        updatedTarget = modifyTrust(updatedTarget, updatedPlayer.id, 6, reason, currentTurn);
        updatedPlayer = modifyRelationship(updatedPlayer, updatedTarget.id, 4, reason, currentTurn);
        updatedTarget = modifyRelationship(updatedTarget, updatedPlayer.id, 5, reason, currentTurn);

        const playerTrust = getTrust(updatedPlayer, updatedTarget.id);
        const targetTrust = getTrust(updatedTarget, updatedPlayer.id);

        toastPayload = {
          title: 'Trust Building Successful',
          description: `Your trust in ${updatedTarget.name} is now ${playerTrust}, and their trust in you is ${targetTrust}.`,
        };
        newsItem = {
          text: `${player.name} orchestrates a trust-building summit with ${updatedTarget.name}, raising mutual confidence.`,
          priority: 'important',
        };
        log(`${player.name} increases mutual trust with ${updatedTarget.name} through diplomatic outreach.`);
        break;
      }
      case 'grant-favor': {
        if (!updatedTarget) break;
        const favorAmount = 4;
        const reason = `Granted strategic favor to ${updatedTarget.name}`;
        updatedPlayer = modifyFavors(updatedPlayer, updatedTarget.id, favorAmount, reason, currentTurn);
        updatedTarget = modifyFavors(updatedTarget, updatedPlayer.id, -favorAmount, reason, currentTurn);
        updatedTarget = modifyTrust(updatedTarget, updatedPlayer.id, 5, reason, currentTurn);
        updatedPlayer = modifyRelationship(updatedPlayer, updatedTarget.id, 3, reason, currentTurn);
        updatedTarget = modifyRelationship(updatedTarget, updatedPlayer.id, 4, reason, currentTurn);

        const favorBalance = getFavors(updatedPlayer, updatedTarget.id);
        toastPayload = {
          title: 'Favor Granted',
          description: `${updatedTarget.name} now owes you ${favorBalance} favor(s). Their trust in you improved.`,
        };
        newsItem = {
          text: `${player.name} extends crucial support to ${updatedTarget.name}, earning diplomatic leverage.`,
          priority: 'important',
        };
        log(`${player.name} granted a diplomatic favor to ${updatedTarget.name}, strengthening leverage.`);
        break;
      }
      case 'call-in-favor': {
        if (!updatedTarget) break;
        const availableFavors = Math.max(0, getFavors(updatedPlayer, updatedTarget.id));
        const spendAmount = Math.min(availableFavors, FavorCosts.REQUEST_AID);
        const reason = `Called in favor from ${updatedTarget.name}`;
        updatedPlayer = modifyFavors(updatedPlayer, updatedTarget.id, -spendAmount, reason, currentTurn);
        updatedTarget = modifyFavors(updatedTarget, updatedPlayer.id, spendAmount, reason, currentTurn);
        updatedPlayer = modifyTrust(updatedPlayer, updatedTarget.id, 2, reason, currentTurn);
        updatedTarget = modifyTrust(updatedTarget, updatedPlayer.id, -2, reason, currentTurn);
        updatedPlayer = modifyRelationship(updatedPlayer, updatedTarget.id, 2, reason, currentTurn);
        updatedTarget = modifyRelationship(updatedTarget, updatedPlayer.id, -1, reason, currentTurn);

        toastPayload = {
          title: 'Favor Called In',
          description: `${updatedTarget.name} honored your request. Remaining favors owed: ${Math.max(0, getFavors(updatedPlayer, updatedTarget.id))}.`,
        };
        newsItem = {
          text: `${player.name} calls in a diplomatic favor from ${updatedTarget.name}, pressing for tangible support.`,
          priority: 'important',
        };
        log(`${player.name} called in a favor from ${updatedTarget.name}, adjusting diplomatic balances.`);
        break;
      }
      case 'make-promise': {
        if (!updatedTarget) break;
        const promiseTerms = {
          duration: 8,
          targetNationId: updatedTarget.id,
          trustReward: 8,
          trustPenalty: 12,
          relationshipPenalty: -10,
        } as const;
        updatedPlayer = createPromise(updatedPlayer, updatedTarget.id, 'no-attack', promiseTerms, currentTurn);
        const reason = `Pledged non-aggression toward ${updatedTarget.name}`;
        updatedTarget = modifyTrust(updatedTarget, updatedPlayer.id, 4, reason, currentTurn);
        updatedPlayer = modifyRelationship(updatedPlayer, updatedTarget.id, 2, reason, currentTurn);
        updatedTarget = modifyRelationship(updatedTarget, updatedPlayer.id, 5, reason, currentTurn);

        toastPayload = {
          title: 'Promise Recorded',
          description: `Your non-aggression pledge to ${updatedTarget.name} will last ${promiseTerms.duration} turns.`,
        };
        newsItem = {
          text: `${player.name} publicly pledges restraint toward ${updatedTarget.name}, easing regional tensions.`,
          priority: 'info',
        };
        log(`${player.name} made a non-aggression promise to ${updatedTarget.name}.`);
        break;
      }
      case 'verify-promise': {
        if (!updatedTarget) break;
        const reason = `Promise verification with ${updatedTarget.name}`;
        const activeTargetPromise = updatedTarget.diplomaticPromises?.find(
          (p) => p.toNationId === updatedPlayer.id && !p.fulfilled && !p.broken
        );
        const activePlayerPromise = updatedPlayer.diplomaticPromises?.find(
          (p) => p.toNationId === updatedTarget.id && !p.fulfilled && !p.broken
        );

        let description = '';
        let priority: 'info' | 'important' | 'critical' = 'info';

        if (activeTargetPromise && currentTurn > activeTargetPromise.expiresTurn) {
          updatedTarget = breakPromise(updatedTarget, activeTargetPromise.id, currentTurn);
          updatedPlayer = modifyTrust(
            updatedPlayer,
            updatedTarget.id,
            -8,
            `Verified broken promise by ${updatedTarget.name}`,
            currentTurn
          );
          updatedPlayer = modifyRelationship(
            updatedPlayer,
            updatedTarget.id,
            -6,
            `Verified broken promise by ${updatedTarget.name}`,
            currentTurn
          );
          description = `${updatedTarget.name} failed to uphold their promise. Trust erodes sharply.`;
          priority = 'critical';
          log(`${player.name} confirmed ${updatedTarget.name} broke a promise.`);
        } else {
          if (activeTargetPromise && currentTurn >= activeTargetPromise.expiresTurn) {
            updatedTarget = fulfillPromise(updatedTarget, activeTargetPromise.id, currentTurn);
            updatedPlayer = modifyTrust(updatedPlayer, updatedTarget.id, 6, reason, currentTurn);
            updatedPlayer = modifyRelationship(updatedPlayer, updatedTarget.id, 4, reason, currentTurn);
            description = `${updatedTarget.name} fulfilled their promise.`;
            priority = 'important';
            log(`${player.name} verified that ${updatedTarget.name} kept their promise.`);
          } else if (activeTargetPromise) {
            updatedPlayer = modifyTrust(updatedPlayer, updatedTarget.id, 2, reason, currentTurn);
            updatedTarget = modifyRelationship(updatedTarget, updatedPlayer.id, 2, reason, currentTurn);
            description = `${updatedTarget.name} reaffirmed their ongoing promise.`;
            priority = 'info';
            log(`${player.name} checked on an active promise with ${updatedTarget.name}.`);
          }

          if (activePlayerPromise && currentTurn >= activePlayerPromise.expiresTurn) {
            updatedPlayer = fulfillPromise(updatedPlayer, activePlayerPromise.id, currentTurn);
            updatedTarget = modifyTrust(updatedTarget, updatedPlayer.id, 5, reason, currentTurn);
            updatedTarget = modifyRelationship(updatedTarget, updatedPlayer.id, 3, reason, currentTurn);
            description = description
              ? `${description} Your commitment is now logged as fulfilled.`
              : 'Your commitment is now logged as fulfilled.';
            priority = priority === 'critical' ? 'critical' : 'important';
            log(`${player.name} finalized a promise made to ${updatedTarget.name}.`);
          }
        }

        if (!description) {
          description = 'No new promise updates were recorded.';
          log(`${player.name} found no change while verifying promises with ${updatedTarget.name}.`);
        }

        toastPayload = {
          title: 'Promise Verification',
          description,
        };
        newsItem = {
          text: `${player.name} audits diplomatic promises with ${updatedTarget.name}. ${description}`,
          priority,
        };
        break;
      }
      case 'apologize': {
        if (!updatedTarget) break;
        const { apologizer, victim, resolvedGrievanceCount } = resolveGrievancesWithApology(
          updatedPlayer,
          updatedTarget,
          currentTurn
        );
        updatedPlayer = apologizer;
        updatedTarget = victim;

        const targetTrust = getTrust(updatedTarget, updatedPlayer.id);
        const resolutionText =
          resolvedGrievanceCount > 0
            ? `Resolved ${resolvedGrievanceCount} grievance(s).`
            : 'No outstanding grievances remained, but goodwill improved.';
        toastPayload = {
          title: 'Formal Apology Issued',
          description: `${resolutionText} ${updatedTarget.name}'s trust in you is now ${targetTrust}.`,
        };
        newsItem = {
          text: `${player.name} issued a formal apology to ${updatedTarget.name}. ${resolutionText}`,
          priority: resolvedGrievanceCount > 0 ? 'important' : 'info',
        };
        log(`${player.name} apologized to ${updatedTarget.name}, ${resolutionText}`);
        break;
      }
      case 'reparations': {
        if (!updatedTarget) break;
        const { payer, recipient, resolvedGrievanceCount } = resolveGrievancesWithReparations(
          updatedPlayer,
          updatedTarget,
          currentTurn,
          'major'
        );
        updatedPlayer = payer;
        updatedTarget = recipient;

        const favorBalance = getFavors(updatedPlayer, updatedTarget.id);
        const resolutionText =
          resolvedGrievanceCount > 0
            ? `Resolved ${resolvedGrievanceCount} grievance(s) through compensation.`
            : 'Strengthened relations through proactive compensation.';
        toastPayload = {
          title: 'Reparations Delivered',
          description: `${resolutionText} ${updatedTarget.name} now owes you ${favorBalance} favor(s).`,
        };
        newsItem = {
          text: `${player.name} offers reparations to ${updatedTarget.name}. ${resolutionText}`,
          priority: 'important',
        };
        log(`${player.name} provided reparations to ${updatedTarget.name}. ${resolutionText}`);
        break;
      }
      case 'propose-resolution': {
        if (action.dipCost && !trySpendDip(action.dipCost, 'propose-resolution')) {
          return;
        }

        const council = ensureCouncil();
        const resolutionType = targetNation ? 'sanction' : 'humanitarian-aid';
        const resolutionTitle = targetNation
          ? `Emergency Action on ${targetNation.name}`
          : 'Global Stability Resolution';
        const resolutionDescription = targetNation
          ? `${player.name} urges the council to impose sanctions on ${targetNation.name} for destabilizing actions.`
          : `${player.name} calls upon the council to coordinate humanitarian relief and monitoring to ease global tensions.`;

        const resolutionParameters = targetNation
          ? {
              severity: 60,
              duration: 5,
              penalties: ['Coordinated economic sanctions enforced by council members.'],
            }
          : {
              duration: 4,
              rewards: ['Shared humanitarian aid resources to stabilize the crisis.'],
              conditions: ['Report progress back to the council at the next session.'],
            };

        const resolutionResult = createResolution(
          council,
          resolutionType,
          resolutionTitle,
          resolutionDescription,
          updatedPlayer.id,
          currentTurn,
          resolutionParameters,
          targetNation?.id
        );

        const phase3 = ensurePhase3State();
        const updatedPhase3 = {
          ...phase3,
          internationalCouncil: resolutionResult.council,
          phase3Enabled: true,
        };
        persistPhase3State(updatedPhase3);

        toastPayload = {
          title: 'Resolution Proposed',
          description: `Your resolution "${resolutionResult.resolution.title}" is now before the council.`,
        };
        newsItem = {
          text: `${player.name} tables "${resolutionResult.resolution.title}" for immediate council deliberation.`,
          priority: 'important',
        };
        log(`${player.name} proposed the resolution "${resolutionResult.resolution.title}" to the International Council.`);
        break;
      }
      case 'call-session': {
        if (action.dipCost && !trySpendDip(action.dipCost, 'call-session')) {
          return;
        }

        let council = ensureCouncil();
        council = removeExpiredMembers(council, currentTurn);
        council = processExpiredVotes(council, currentTurn);
        council = addObserver(council, updatedPlayer.id);
        const acceleratedCouncil = {
          ...council,
          nextMeetingTurn: Math.min(council.nextMeetingTurn, currentTurn),
        };

        const phase3 = ensurePhase3State();
        const updatedPhase3 = {
          ...phase3,
          internationalCouncil: acceleratedCouncil,
          phase3Enabled: true,
        };
        persistPhase3State(updatedPhase3);

        toastPayload = {
          title: 'Emergency Session Convened',
          description: 'The council is assembling immediately to address your emergency motion.',
        };
        newsItem = {
          text: `${player.name} forces an emergency sitting of the International Council, accelerating the next meeting.`,
          priority: 'critical',
        };
        log(`${player.name} called an emergency session of the International Council.`);
        break;
      }
      case 'back-channel': {
        if (!updatedTarget) break;
        const reason = `Back-channel talks with ${updatedTarget.name}`;
        updatedPlayer = modifyTrust(updatedPlayer, updatedTarget.id, 2, reason, currentTurn);
        updatedTarget = modifyTrust(updatedTarget, updatedPlayer.id, 3, reason, currentTurn);
        updatedPlayer = modifyRelationship(updatedPlayer, updatedTarget.id, 2, reason, currentTurn);
        updatedTarget = modifyRelationship(updatedTarget, updatedPlayer.id, 3, reason, currentTurn);

        toastPayload = {
          title: 'Back-Channel Opened',
          description: `Confidential line with ${updatedTarget.name} established. Trust improved on both sides.`,
        };
        newsItem = {
          text: `${player.name} establishes discreet communications with ${updatedTarget.name}.`,
          priority: 'info',
        };
        log(`${player.name} initiated back-channel communications with ${updatedTarget.name}.`);
        break;
      }
      default:
        break;
    }

    const updatedNations = nations.map((nation) => {
      if (nation.id === updatedPlayer.id) {
        return updatedPlayer;
      }
      if (updatedTarget && nation.id === updatedTarget.id) {
        return updatedTarget;
      }
      return nation;
    });

    nations = updatedNations;
    GameStateManager.setNations(updatedNations);
    PlayerManager.setNations(updatedNations);

    if (newsItem) {
      window.__gameAddNewsItem?.('diplomatic', newsItem.text, newsItem.priority);
    }

    if (toastPayload) {
      toast(toastPayload);
    }

    updateDisplay();
    consumeAction();
    setShowEnhancedDiplomacy(false);
  }, [toast, updateDisplay, consumeAction, setDiplomacyPhase3State]);

  // Show pending AI proposals when phase transitions to player
  useEffect(() => {
    if (S.phase === 'PLAYER' && pendingAIProposals.length > 0 && !activeDiplomacyProposal) {
      // Show the first pending proposal
      const nextProposal = pendingAIProposals[0];
      setActiveDiplomacyProposal(nextProposal);
      setPendingAIProposals(prev => prev.slice(1));
    }
  }, [S.phase, pendingAIProposals, activeDiplomacyProposal]);

  const handleEndTurn = useCallback(() => {
    AudioSys.playSFX('endturn');
    endTurn();
  }, []);

  useEffect(() => {
    if (!isGameStarted || viewerType !== 'threejs') {
      return;
    }

    if (canvasRef.current) {
      canvas = canvasRef.current;
      ctx = canvas.getContext('2d')!;

      resizeCanvas();

      const handleWindowResize = () => {
        resizeCanvas();
      };

      if (typeof window !== 'undefined') {
        window.addEventListener('resize', handleWindowResize);
      }

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
        const [focalLon, focalLat] = toLonLatLocal(focalX, focalY);
        const prevZoom = cam.zoom;
        const [projectedX, projectedY] = projectLocal(focalLon, focalLat);

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
            const [focalLon, focalLat] = toLonLatLocal(midpointX, midpointY);
            const prevZoom = cam.zoom;
            const [projectedX, projectedY] = projectLocal(focalLon, focalLat);
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
                const [nx, ny] = projectLocal(n.lon, n.lat);
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
          const [nx, ny] = projectLocal(n.lon, n.lat);
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
        
        const [lon, lat] = toLonLatLocal(mx, my);
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
          case 'i':
          case 'I':
            e.preventDefault();
            setCivInfoPanelOpen(prev => !prev);
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
  }, [isGameStarted, viewerType, handleBuild, handleResearch, handleIntel, handleCulture, handleImmigration, handleDiplomacy, handleMilitary, handlePauseToggle, openModal, resizeCanvas]);


  // Render functions for different phases
  // Screen render functions - now using extracted components (Phase 7 refactoring)
  const renderIntroScreen = () => {
    const highscores = JSON.parse(Storage.getItem('highscores') || '[]').slice(0, 5);
    return (
      <IntroScreen
        scenarioOptions={scenarioOptions}
        selectedScenarioId={selectedScenarioId}
        selectedScenario={selectedScenario}
        isScenarioPanelOpen={isScenarioPanelOpen}
        highscores={highscores}
        onStart={handleIntroStart}
        onScenarioSelect={handleScenarioSelect}
        onOpenScenarioPanel={() => setIsScenarioPanelOpen(true)}
        onCloseScenarioPanel={setIsScenarioPanelOpen}
        mapStyle={mapStyle}
        onMapStyleChange={handleMapStyleChange}
        viewerType={viewerType}
        onViewerTypeChange={handleViewerSelect}
      />
    );
  };

  const renderLeaderSelection = () => {
    // Filter leaders based on scenario - only historical leaders for Cuban Crisis, only lovecraftian for Great Old Ones
    const isCubanCrisisScenario = S.scenario?.id === 'cubanCrisis';
    const isGreatOldOnesScenario = S.scenario?.id === 'greatOldOnes';
    const availableLeaders = isCubanCrisisScenario
      ? leaders.filter(l => l.isHistoricalCubanCrisis === true)
      : isGreatOldOnesScenario
        ? leaders.filter(l => l.isLovecraftian === true)
        : leaders;

    return (
      <LeaderSelectionScreen
        interfaceRef={interfaceRef}
        leaders={availableLeaders}
        onSelectLeader={(leaderName) => {
          setSelectedLeader(leaderName);
          // For Great Old Ones, skip doctrine selection during setup
          // The doctrine will be selected in-game via DoctrineSelectionPanel
          if (isGreatOldOnesScenario) {
            startGame(leaderName, undefined);
            setGamePhase('game');
          } else {
            setGamePhase('doctrine');
          }
        }}
        onBack={() => setGamePhase('intro')}
      />
    );
  };

  const renderDoctrineSelection = () => (
    <DoctrineSelectionScreen
      interfaceRef={interfaceRef}
      doctrines={doctrines}
      selectedLeader={selectedLeader}
      onSelectDoctrine={(doctrineKey) => {
        setSelectedDoctrine(doctrineKey);
        startGame(selectedLeader ?? undefined, doctrineKey);
        setGamePhase('game');
      }}
      onBack={() => setGamePhase('leader')}
    />
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
        {viewerType === 'threejs' ? (
          <GlobeScene
            ref={canvasRef}
            cam={cam}
            nations={nations}
            worldCountries={worldCountries}
            onProjectorReady={handleProjectorReady}
            onPickerReady={handlePickerReady}
            mapStyle={mapStyle}
          />
        ) : (
          <CesiumViewer
            territories={Object.values(conventional.state.territories)}
            units={Object.values(conventional.state.units)}
            nations={nations}
            onTerritoryClick={(territoryId) => {
              // Territory click handler - reserved for future interaction
            }}
            onUnitClick={(unitId) => {
              // Unit click handler - reserved for future interaction
            }}
            enableDayNight={true}
            mapStyle={mapStyle}
            className="w-full h-full"
          />
        )}

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
                <span className="text-cyan-400">DATE</span>
                <span className="text-neon-green font-bold text-base" id="gameTimeDisplay">—</span>
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
                  setCivInfoPanelOpen(true);
                  AudioSys.playSFX('click');
                }}
                className="h-7 px-2 text-xs text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
                title="Empire Status (Press I)"
              >
                EMPIRE INFO
              </Button>
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
              <div className="rounded-lg border border-cyan-500/40 bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-sm shadow-2xl">
                <div className="flex items-center justify-between border-b border-cyan-500/30 bg-black/40 px-4 py-3">
                  <span className="text-sm font-mono font-semibold uppercase tracking-wider text-cyan-300">Strike Planner</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono ${selectedTarget ? 'text-red-300' : 'text-cyan-300/70'}`}
                    >
                      {selectedTarget ? 'LOCKED' : 'STANDBY'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsStrikePlannerOpen(false)}
                      className="text-gray-400 hover:text-white transition-colors"
                      aria-label="Close strike planner"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-cyan-500/10">
                  {attackableNations.length === 0 ? (
                    <div className="px-4 py-4 text-sm text-gray-400">
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
                          className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-colors ${
                            isSelected
                              ? 'bg-cyan-500/20 border-l-2 border-cyan-500/50 text-cyan-300'
                              : 'bg-slate-800/50 hover:bg-slate-700/50 text-gray-300'
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
                <div className="border-t border-cyan-500/30 px-4 py-3 text-sm text-gray-400">
                  {selectedTarget ? (
                    <div className="space-y-1">
                      <p>
                        Locked on <span className="text-cyan-300 font-semibold">{selectedTarget.name}</span>. Population&nbsp;
                        {Math.max(0, Math.round(selectedTarget.population ?? 0))}M, defense{' '}
                        {Math.max(0, Math.round(selectedTarget.defense ?? 0))}, missile capacity{' '}
                        {Math.max(0, Math.round(Number(selectedTarget.missiles ?? 0)))}.
                      </p>
                      <p className="text-gray-500 text-xs">Confirm launch with ATTACK once satisfied with this solution.</p>
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
          <SheetHeader>
            <SheetTitle className="options-sheet__title">COMMAND OPTIONS</SheetTitle>
            <SheetDescription className="options-sheet__description">
              Tune the command interface to match your control room preferences.
            </SheetDescription>
          </SheetHeader>
          <OptionsMenu
            theme={theme}
            onThemeChange={setTheme}
            mapStyle={mapStyle}
            onMapStyleChange={handleMapStyleChange}
            viewerType={viewerType}
            onViewerTypeChange={handleViewerSelect}
            showInGameFeatures={true}
            onChange={updateDisplay}
          />
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
        <DialogContent className="max-w-2xl border border-cyan-500/40 bg-gradient-to-br from-slate-900/95 to-slate-800/95 text-cyan-100 backdrop-blur-sm">
          <DialogHeader className="border-b border-cyan-500/30 bg-black/40 -m-4 sm:-m-6 mb-4 sm:mb-6 p-4 sm:p-6">
            <DialogTitle className="text-2xl font-bold text-cyan-300 font-mono uppercase tracking-wider">Launch Control</DialogTitle>
            <DialogDescription className="text-sm text-gray-400 mt-1">
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

      <Dialog open={showModal} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 border border-cyan-500/40 text-cyan-100 max-w-6xl max-h-[85vh] overflow-y-auto backdrop-blur-sm">
          <DialogHeader className="border-b border-cyan-500/30 bg-black/40 -m-4 sm:-m-6 mb-4 sm:mb-6 p-4 sm:p-6">
            <DialogTitle className="text-2xl font-bold text-cyan-300 font-mono uppercase tracking-wider">{modalContent.title}</DialogTitle>
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
        playerIntel={PlayerManager.get()?.intel || 0}
        onSelectPlagueType={selectPlagueType}
        onEvolveNode={(nodeId: string) => evolveNode({ nodeId: nodeId as EvolutionNodeId })}
        onDevolveNode={(nodeId: string) => devolveNode({ nodeId: nodeId as EvolutionNodeId })}
        onDeployBioWeapon={handleDeployBioWeapon}
      />

      {showPandemicPanel && (
        <PandemicPanel
          state={pandemicState}
          enabled={pandemicIntegrationEnabled}
          biowarfareEnabled={bioWarfareEnabled}
          playerPopulation={PlayerManager.get()?.population}
        />
      )}

      {/* Great Old Ones Campaign UI */}
      {S.scenario?.id === 'greatOldOnes' && greatOldOnesState && (
        <>
          <div className="fixed top-20 left-4 z-40 space-y-4 max-w-md">
            {!greatOldOnesState.doctrine && (
              <DoctrineSelectionPanel
                canSelect={true}
                onSelectDoctrine={(doctrine) => {
                  const updatedState = { ...greatOldOnesState, doctrine };
                  setGreatOldOnesState(updatedState);
                  GameStateManager.setGreatOldOnes(updatedState);
                  toast({ title: 'Doctrine Selected', description: `Path of ${doctrine} chosen` });
                }}
              />
            )}

            {greatOldOnesState.doctrine && (
              <>
                <SanityHeatMapPanel state={greatOldOnesState} />
                <OrderCommandPanel
                  state={greatOldOnesState}
                  onIssueOrder={(order) => {
                    // Handle order execution
                    toast({ title: 'Order Issued', description: order });
                  }}
                />
              </>
            )}
          </div>

          <div className="fixed top-20 right-4 z-40 space-y-4 max-w-md">
            {greatOldOnesState.doctrine && week3State && (
              <>
                <RitualSitePanel state={greatOldOnesState} />
                <MissionBoardPanel
                  state={greatOldOnesState}
                  availableMissions={week3State.availableMissions}
                  activeMissions={week3State.activeMissions}
                  infiltrators={week3State.infiltrators}
                  onAssignMission={(missionId, infiltratorIds) => {
                    // Handle mission assignment
                    toast({ title: 'Mission Assigned', description: `Mission ${missionId} assigned` });
                  }}
                />
                <UnitRosterPanel
                  state={greatOldOnesState}
                  infiltrators={week3State.infiltrators}
                />
              </>
            )}
          </div>
        </>
      )}

      {activeFlashpoint && (
        <FlashpointModal
          flashpoint={activeFlashpoint}
          onResolve={(optionId) => {
            const result = resolveFlashpoint(optionId, activeFlashpoint, S.turn);
            const player = PlayerManager.get();
            if (!player) return;

            const option = activeFlashpoint.options.find(opt => opt.id === optionId);
            if (!option) return;

            // Store outcome for display
            setCurrentFlashpointOutcome(result.flashpointOutcome);

            // Apply consequences based on outcome
            const outcome = result.success ? option.outcome.success : option.outcome.failure;

            // Award DNA points if applicable
            if (result.dnaAwarded && result.dnaAwarded > 0) {
              addDNAPoints({
                reason: 'milestone',
                amount: result.dnaAwarded,
                message: `Flashpoint resolved: +${result.dnaAwarded} DNA from intel/samples`,
              });
              addNewsItem('science', `Flashpoint intel secured: +${result.dnaAwarded} DNA points`, 'important');
            }
            
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

      {currentFlashpointOutcome && (
        <FlashpointOutcomeModal
          outcome={currentFlashpointOutcome}
          onClose={() => setCurrentFlashpointOutcome(null)}
        />
      )}

      <TutorialGuide 
        open={showTutorial} 
        onClose={() => {
          setShowTutorial(false);
          Storage.setItem('has_seen_tutorial', 'true');
        }} 
      />

      {/* New Phase 1 Tutorial & Feedback Overlays */}
      <PhaseTransitionOverlay phase={S.phase} isTransitioning={isPhaseTransitioning} />

      {/* Era Transition Overlay */}
      {showEraTransition && eraTransitionData && (
        <EraTransitionOverlay
          isVisible={showEraTransition}
          newEra={eraTransitionData.era}
          eraName={eraTransitionData.name}
          eraDescription={eraTransitionData.description}
          unlockedFeatures={eraTransitionData.features}
          onDismiss={() => setShowEraTransition(false)}
        />
      )}

      {/* Action Consequence Preview */}
      {consequencePreview && (
        <ActionConsequencePreview
          consequences={consequencePreview}
          onConfirm={() => {
            if (consequenceCallback) {
              consequenceCallback();
            }
            setConsequencePreview(null);
            setConsequenceCallback(null);
          }}
          onCancel={() => {
            setConsequencePreview(null);
            setConsequenceCallback(null);
          }}
          isVisible={consequencePreview !== null}
        />
      )}

      <CivilizationInfoPanel
        nations={nations}
        isOpen={civInfoPanelOpen}
        onClose={() => setCivInfoPanelOpen(false)}
        currentTurn={S.turn}
        governanceMetrics={governance.metrics}
        victoryAnalysis={victoryAnalysis}
        onStartResearch={startResearch}
        bioLabFacility={labFacility}
        onStartBioLabConstruction={handleStartLabConstruction}
        onCancelBioLabConstruction={handleCancelLabConstruction}
        defaultTab={civInfoDefaultTab}
      />

      <GameHelper
        onRestartModalTutorial={handleRestartModalTutorial}
        onRestartInteractiveTutorial={handleRestartInteractiveTutorial}
      />

      {/* Diplomacy Proposal Overlay */}
      {activeDiplomacyProposal && (() => {
        const proposer = getNationById(nations, activeDiplomacyProposal.proposerId);
        const target = getNationById(nations, activeDiplomacyProposal.targetId);

        if (!proposer || !target) return null;

        return (
          <DiplomacyProposalOverlay
            proposal={activeDiplomacyProposal}
            proposer={proposer}
            target={target}
            onAccept={handleAcceptProposal}
            onReject={handleRejectProposal}
            onClose={() => setActiveDiplomacyProposal(null)}
          />
        );
      })()}

      {/* Enhanced Diplomacy Modal */}
      {showEnhancedDiplomacy && (() => {
        const player = PlayerManager.get();
        if (!player) return null;

        return (
          <EnhancedDiplomacyModal
            player={player}
            nations={nations}
            phase3State={diplomacyPhase3State ?? undefined}
            onClose={() => setShowEnhancedDiplomacy(false)}
            onAction={handleEnhancedDiplomacyAction}
          />
        );
      })()}

      {/* End Game Screen */}
      {S.showEndGameScreen && S.endGameStatistics && (
        <EndGameScreen
          statistics={S.endGameStatistics}
          highscores={JSON.parse(Storage.getItem('highscores') || '[]')}
          onRestart={() => {
            window.location.reload();
          }}
          onMainMenu={() => {
            navigate('/');
          }}
        />
      )}
    </div>
  );
}
