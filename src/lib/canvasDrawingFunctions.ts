/**
 * Canvas Drawing Functions (Refactored)
 *
 * This file has been refactored for better maintainability and modularity.
 * The original 1803-line monolithic file has been split into focused modules:
 *
 * - rendering/types.ts - Shared types, constants, and utilities
 * - rendering/satelliteRenderer.ts - Satellite orbits and signals
 * - rendering/fireRenderer.ts - VIIRS fire detection rendering
 * - rendering/weaponRenderer.ts - Missiles, bombers, and submarines
 * - rendering/conventionalForceRenderer.ts - Conventional military forces
 * - rendering/falloutRenderer.ts - Nuclear fallout zones
 * - rendering/effectsRenderer.ts - Particles and special effects
 *
 * This file now serves as a compatibility layer, re-exporting all functions
 * to maintain backward compatibility with existing code.
 */

// Re-export types and shared utilities
export type {
  CanvasDrawingDependencies,
  CanvasIcon,
  DrawIconOptions,
  DeliveryMethod,
  ConventionalUnitMarker,
  ConventionalMovementMarker,
  OverlayTone,
} from './rendering/types';

// Re-export satellite rendering functions
export {
  drawSatellites,
  registerSatelliteOrbit,
  drawSatelliteSignals,
} from './rendering/satelliteRenderer';

// Re-export fire rendering functions
export { drawVIIRSFires } from './rendering/fireRenderer';

// Re-export weapon rendering functions
export {
  drawMissiles,
  drawBombers,
  drawSubmarines,
} from './rendering/weaponRenderer';

// Re-export conventional force rendering functions
export { drawConventionalForces } from './rendering/conventionalForceRenderer';

// Re-export fallout rendering functions
export {
  drawFalloutMarks,
  upsertFalloutMark,
} from './rendering/falloutRenderer';

// Re-export effects rendering functions
export {
  drawParticles,
  drawFX,
} from './rendering/effectsRenderer';
