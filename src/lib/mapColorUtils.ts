/**
 * Shared map color computation utilities
 * Used by all map renderers (Three.js GlobeScene, Canvas 2D WorldRenderer)
 *
 * This module consolidates duplicate color computation logic that was
 * previously scattered across multiple files.
 *
 * @module mapColorUtils
 */

import { Color, MathUtils } from 'three';

// Color constants for map overlays
const INTEL_COLOR_START = new Color('#1d4ed8'); // Deep blue
const INTEL_COLOR_END = new Color('#38bdf8');   // Light blue
const RESOURCE_COLOR_START = new Color('#f97316'); // Orange
const RESOURCE_COLOR_END = new Color('#facc15');   // Yellow
const PANDEMIC_COLOR_START = new Color('#fee2e2'); // Light rose
const PANDEMIC_COLOR_MID = new Color('#f87171');   // Soft crimson
const PANDEMIC_COLOR_END = new Color('#991b1b');   // Deep blood red

/**
 * Compute diplomatic relationship color based on relationship score
 *
 * Color mapping:
 * - Green (#4ade80): Allied (score >= 60)
 * - Cyan (#22d3ee): Friendly (score >= 20)
 * - Red (#f87171): Hostile (score <= -40)
 * - Yellow (#facc15): Neutral (default)
 *
 * @param score - Relationship score (-100 to +100)
 * @returns Hex color string
 */
export function computeDiplomaticColor(score: number): string {
  if (score >= 60) return '#4ade80';   // Green - Allied
  if (score >= 20) return '#22d3ee';   // Cyan - Friendly
  if (score <= -40) return '#f87171';  // Red - Hostile
  return '#facc15';                    // Yellow - Neutral
}

/**
 * Compute intelligence coverage color based on intel level
 *
 * Uses a blue gradient from deep blue to light blue
 *
 * @param normalized - Intelligence level (0.0 to 1.0)
 * @returns Hex color string
 */
export function computeIntelColor(normalized: number): string {
  const clamped = MathUtils.clamp(normalized, 0, 1);
  return `#${INTEL_COLOR_START.clone().lerp(INTEL_COLOR_END, clamped).getHexString()}`;
}

/**
 * Compute resource distribution color based on resource amount
 *
 * Uses an orange-to-yellow gradient
 *
 * @param normalized - Resource amount (0.0 to 1.0)
 * @returns Hex color string
 */
export function computeResourceColor(normalized: number): string {
  const clamped = MathUtils.clamp(normalized, 0, 1);
  return `#${RESOURCE_COLOR_START.clone().lerp(RESOURCE_COLOR_END, clamped).getHexString()}`;
}

/**
 * Compute political stability/unrest color
 *
 * Color mapping:
 * - Green (#22c55e): Stable (stability >= 65)
 * - Yellow (#facc15): Tense (stability >= 45)
 * - Red (#f87171): Crisis (stability < 45)
 *
 * @param stability - Stability percentage (0-100)
 * @returns Hex color string
 */
export function computeUnrestColor(stability: number): string {
  if (stability >= 65) return '#22c55e';  // Green - Stable
  if (stability >= 45) return '#facc15';  // Yellow - Tense
  return '#f87171';                       // Red - Crisis
}

/**
 * Compute pandemic infection color based on infection intensity
 *
 * Uses a three-stop gradient that starts as a pale crimson when
 * infection is low, deepens into saturated red for mid-tier outbreaks,
 * and culminates in a dark blood-red for catastrophic spread.
 *
 * @param normalized - Infection intensity normalized between 0 and 1
 * @returns Hex color string representing infection severity
 */
export function computePandemicColor(normalized: number): string {
  const clamped = MathUtils.clamp(normalized, 0, 1);

  if (clamped <= 0.5) {
    const t = clamped / 0.5;
    return `#${PANDEMIC_COLOR_START.clone().lerp(PANDEMIC_COLOR_MID, t).getHexString()}`;
  }

  const t = (clamped - 0.5) / 0.5;
  return `#${PANDEMIC_COLOR_MID.clone().lerp(PANDEMIC_COLOR_END, t).getHexString()}`;
}

/**
 * Convert hex color to RGBA string
 *
 * @param color - Hex color string (e.g., '#ff0000')
 * @param alpha - Alpha value (0.0 to 1.0)
 * @returns RGBA string (e.g., 'rgba(255, 0, 0, 0.5)')
 */
export function colorToRgba(color: string, alpha: number): string {
  const parsed = new Color(color);
  const r = Math.round(parsed.r * 255);
  const g = Math.round(parsed.g * 255);
  const b = Math.round(parsed.b * 255);
  return `rgba(${r}, ${g}, ${b}, ${MathUtils.clamp(alpha, 0, 1)})`;
}
