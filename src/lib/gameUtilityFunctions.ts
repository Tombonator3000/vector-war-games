/**
 * Game Utility Functions
 *
 * Extracted from Index.tsx to reduce file size and improve reusability.
 * Contains pure utility functions that don't depend on React state.
 */

import type { Nation } from '@/types/game';
import type { SanctionPackage, SanctionType } from '@/types/regionalMorale';
import type { ScenarioConfig } from '@/types/scenario';
import { getNationById } from '@/lib/nationUtils';

const DEFAULT_DEFCON_LEVEL = 5;

/**
 * Get DEFCON level for a scenario
 */
export const getScenarioDefcon = (scenario: ScenarioConfig): number =>
  scenario.id === 'nuclearWar' ? scenario.startingDefcon : DEFAULT_DEFCON_LEVEL;

const DEFCON_BADGE_BASE_CLASSES =
  'flex items-center gap-1.5 px-2.5 py-0.5 rounded border transition-all duration-200';
const DEFCON_VALUE_BASE_CLASSES = 'font-bold text-xl leading-none transition-colors duration-200';

/**
 * Get CSS classes for DEFCON indicator based on level
 */
export function getDefconIndicatorClasses(defcon: number): {
  badge: string;
  value: string;
} {
  if (defcon >= 4) {
    return {
      badge: 'bg-emerald-500/10 border-emerald-400/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
      value: 'text-emerald-200 drop-shadow-[0_0_6px_rgba(16,185,129,0.35)]',
    };
  }

  if (defcon === 3) {
    return {
      badge: 'bg-yellow-500/10 border-yellow-400/50 shadow-[0_0_12px_rgba(234,179,8,0.25)]',
      value: 'text-yellow-100 drop-shadow-[0_0_6px_rgba(234,179,8,0.4)]',
    };
  }

  const criticalGlow = 'shadow-[0_0_18px_rgba(248,113,113,0.45)] ring-1 ring-red-400/60';

  return {
    badge: `bg-red-500/20 border-red-400/70 ${criticalGlow} ${defcon === 1 ? 'animate-pulse' : ''}`.trim(),
    value: 'text-red-50 drop-shadow-[0_0_8px_rgba(248,113,113,0.55)]',
  };
}

/**
 * Resolve nation ID to nation name
 */
export const resolveNationName = (nationId: string, nations: Nation[]): string => {
  const nation = getNationById(nations, nationId);
  return nation?.name ?? nationId;
};

/**
 * Get list of nation names imposing sanctions from sanction packages
 */
export const getImposingNationNamesFromPackages = (
  packages: SanctionPackage[],
  nations: Nation[]
): string[] => {
  const imposingIds = new Set<string>();
  packages.forEach((pkg) => {
    pkg.imposingNations.forEach((nationId) => imposingIds.add(nationId));
  });
  return Array.from(imposingIds).map((id) => resolveNationName(id, nations));
};

/**
 * Format sanction type for display
 */
export const formatSanctionTypeLabel = (type: SanctionType): string => {
  switch (type) {
    case 'trade':
      return 'Trade';
    case 'financial':
      return 'Financial';
    case 'military':
      return 'Military';
    case 'diplomatic':
      return 'Diplomatic';
    case 'technology':
      return 'Technology';
    case 'travel':
      return 'Travel';
    default:
      return type;
  }
};

/**
 * Get leader initials from full name
 */
export const getLeaderInitials = (name?: string): string => {
  if (!name) {
    return '??';
  }

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();

  return initials || '??';
};

/**
 * Storage wrapper for localStorage with error handling
 */
export const Storage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(`norad_${key}`);
    } catch (e) {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(`norad_${key}`, value);
    } catch (e) {
      // Silent failure - localStorage may be disabled or full
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(`norad_${key}`);
    } catch (e) {
      // Silent failure - localStorage may be disabled
    }
  },
};

/**
 * Easing function for smooth animations
 */
export const easeInOutQuad = (t: number): number =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
