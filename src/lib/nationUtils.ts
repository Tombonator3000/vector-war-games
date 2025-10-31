/**
 * Nation Utility Functions
 *
 * Functions for managing nations, treaties, and threats.
 * Extracted from Index.tsx as part of refactoring effort.
 */

import type { Nation } from '@/types/game';

/**
 * Find a nation by its ID
 * @param nations - Array of nations to search
 * @param id - Nation ID to find
 */
export function getNationById(nations: Nation[], id: string): Nation | undefined {
  return nations.find(n => n.id === id);
}

/**
 * Ensure a treaty record exists between two nations
 * @param self - The nation creating/accessing the treaty
 * @param other - The other nation in the treaty
 * @returns The treaty record
 */
export function ensureTreatyRecord(self: Nation, other: Nation) {
  self.treaties = self.treaties || {};
  self.treaties[other.id] = self.treaties[other.id] || {};
  return self.treaties[other.id];
}

/**
 * Adjust threat level between nations
 * @param nation - The nation whose threat perception is being adjusted
 * @param otherId - ID of the other nation
 * @param delta - Amount to change threat (positive or negative)
 */
export function adjustThreat(nation: Nation, otherId: string, delta: number): void {
  nation.threats = nation.threats || {};
  const next = Math.max(0, Math.min(100, (nation.threats[otherId] || 0) + delta));
  if (next <= 0) {
    delete nation.threats[otherId];
  } else {
    nation.threats[otherId] = next;
  }
}

/**
 * Check if open borders policy is active for a nation
 * @param nation - The nation to check
 * @returns true if borders are open
 */
export function hasOpenBorders(nation?: Nation | null): boolean {
  return (nation?.bordersClosedTurns ?? 0) <= 0;
}
