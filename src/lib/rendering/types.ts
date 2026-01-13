/**
 * Shared Types and Constants for Canvas Rendering
 *
 * Extracted from canvasDrawingFunctions.ts for better modularity.
 * Contains all shared types, interfaces, and constants used across rendering modules.
 */

import type { Nation, GameState } from '@/types/game';
import type { ProjectedPoint } from '@/lib/renderingUtils';
import type { ForceType } from '@/hooks/useConventionalWarfare';

// ============================================================================
// Type Definitions
// ============================================================================

export type CanvasIcon = HTMLImageElement | null;

export type DrawIconOptions = {
  alpha?: number;
};

export type DeliveryMethod = 'missile' | 'bomber' | 'submarine';

export type ConventionalUnitMarker = {
  id: string;
  lon: number;
  lat: number;
  ownerId: string;
  forceType: ForceType;
  icon?: CanvasIcon;
};

export type ConventionalMovementMarker = {
  id: string;
  startLon: number;
  startLat: number;
  endLon: number;
  endLat: number;
  ownerId: string;
  forceType: ForceType;
  progress: number;
  speed: number;
  icon?: CanvasIcon;
};

export type OverlayTone = 'info' | 'warning' | 'catastrophe';

// ============================================================================
// Constants
// ============================================================================

export const SATELLITE_ORBIT_RADIUS = 34;
export const SATELLITE_ORBIT_TTL_MS = 3600000; // 1 hour
export const SATELLITE_ORBIT_SPEED = (Math.PI * 2) / 12000;
export const MAX_FALLOUT_MARKS = 36;
export const FALLOUT_GROWTH_RATE = 1.1; // units per second
export const FALLOUT_DECAY_DELAY_MS = 12000;
export const FALLOUT_DECAY_RATE = 0.04; // intensity per second once decay begins
export const MISSILE_ICON_BASE_SCALE = 0.14;
export const BOMBER_ICON_BASE_SCALE = 0.18;
export const SUBMARINE_ICON_BASE_SCALE = 0.2;
export const RADIATION_ICON_BASE_SCALE = 0.16;
export const SATELLITE_ICON_BASE_SCALE = 0.18;

// ============================================================================
// Dependencies Interface
// ============================================================================

export interface CanvasDrawingDependencies {
  // Core state
  S: GameState;
  nations: Nation[];

  // Canvas context and camera
  ctx: CanvasRenderingContext2D | null;
  cam: { x: number; y: number; zoom: number; targetZoom: number };
  W: number;
  H: number;

  // Projection functions
  projectLocal: (lon: number, lat: number) => ProjectedPoint;
  toLonLatLocal: (x: number, y: number) => [number, number];

  // Icon assets
  missileIcon: CanvasIcon;
  bomberIcon: CanvasIcon;
  submarineIcon: CanvasIcon;
  satelliteIcon: CanvasIcon;
  radiationIcon: CanvasIcon;
  conventionalIconLookup: Record<ForceType, CanvasIcon>;

  // Conventional force icon base scales
  CONVENTIONAL_ICON_BASE_SCALE: Record<ForceType, number>;

  // Game systems
  AudioSys: any;
  CityLights: any;
  PlayerManager: any;
  toast: (options: any) => void;
  log: (msg: string, type?: string) => void;

  // Game functions
  explode: (
    x: number,
    y: number,
    target: Nation,
    yieldMT: number,
    attacker: Nation | null,
    deliveryMethod: DeliveryMethod
  ) => void;
  launch: (from: Nation, to: Nation, yieldMT: number) => boolean;
  handleDefconChange: (
    delta: number,
    reason: string,
    source: string,
    callbacks: any
  ) => void;
  updateDisplay: () => void;

  // State variables
  currentMapStyle: string;
  policySystemRef: any;
  lastFxTimestamp: number | null;
  setLastFxTimestamp: (timestamp: number | null) => void;
}

// ============================================================================
// Helper Function: drawIcon
// ============================================================================

/**
 * Draws an icon on the canvas with rotation and scaling.
 * Used by multiple rendering modules.
 */
export function drawIcon(
  icon: CanvasIcon,
  x: number,
  y: number,
  angle: number,
  baseScale: number,
  options: DrawIconOptions | undefined,
  deps: CanvasDrawingDependencies
) {
  const { ctx, cam } = deps;
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
