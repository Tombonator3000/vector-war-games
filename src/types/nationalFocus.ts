/**
 * National Focus Tree Types
 *
 * Hearts of Iron IV-inspired national focus tree system.
 * Provides branching strategic paths for national development.
 */

import { IdeologyType } from './ideology';

export interface NationalFocus {
  id: string;
  name: string;
  description: string;
  icon: string;

  // Tree position
  column: number; // 0-4 (left to right: diplomacy, economy, intelligence, military, special)
  row: number; // 0-15 (top to bottom)

  // Requirements
  prerequisites: string[]; // Focus IDs that must be completed first
  mutuallyExclusive: string[]; // Focus IDs that lock out this focus
  ppCost: number; // Political power to start
  completionTime: number; // Turns to complete

  // Effects
  effects: FocusEffect[];

  // Availability
  nationSpecific?: string[]; // Only for certain nation IDs
  ideologyRequirement?: IdeologyType;
  eraRequirement?: number; // Minimum turn
  researchRequirement?: string[]; // Tech IDs required
}

export interface FocusEffect {
  type:
    | 'stat_bonus'
    | 'unlock'
    | 'resource_bonus'
    | 'unique_action'
    | 'production_bonus'
    | 'military_bonus'
    | 'diplomatic_bonus'
    | 'research_bonus';

  // Stat bonuses (permanent unless duration specified)
  statChanges?: {
    productionMultiplier?: number; // 1.15 = +15%
    researchMultiplier?: number;
    ppPerTurn?: number;
    influenceBonus?: number;
    intelPerTurn?: number;
    missileCapacity?: number;
    productionLines?: number;
    goldPerTurn?: number;
    diplomacyPerTurn?: number;
  };

  // Unlocks
  unlocks?: {
    buildings?: string[]; // Building type IDs
    units?: string[]; // Unit type IDs
    decisions?: string[]; // Decision IDs
    victoryPaths?: string[]; // Victory condition IDs
    technologies?: string[]; // Tech IDs
  };

  // Duration (default -1 = permanent)
  duration?: number;

  // Message
  message: string;
}

export interface FocusTreeState {
  nationId: string;
  activeFocus: string | null; // Currently active focus ID
  activeFocusProgress: number; // 0-100%
  activeFocusTurnsRemaining: number;
  completedFocuses: string[]; // List of completed focus IDs
  lockedFocuses: string[]; // Focuses locked due to mutual exclusivity
  availableFocuses: string[]; // Focuses that can be started
}

export interface FocusTreeLayout {
  nationId: string;
  focusesByPath: {
    diplomatic: NationalFocus[];
    economic: NationalFocus[];
    intelligence: NationalFocus[];
    military: NationalFocus[];
    special: NationalFocus[];
  };
}

export interface FocusCompletionLog {
  nationId: string;
  focusId: string;
  focusName: string;
  completedTurn: number;
  effects: FocusEffect[];
}

// Helper type for UI
export interface AvailableFocus extends NationalFocus {
  canStart: boolean;
  missingPrerequisites: string[];
  isLocked: boolean;
  isCompleted: boolean;
  isActive: boolean;
}

// Focus paths enum
export enum FocusPath {
  DIPLOMATIC = 'diplomatic',
  ECONOMIC = 'economic',
  INTELLIGENCE = 'intelligence',
  MILITARY = 'military',
  SPECIAL = 'special',
}

// Focus branch types for mutual exclusivity
export interface FocusBranch {
  branchName: string;
  description: string;
  focusIds: string[];
  mutuallyExclusiveWith: string[]; // Other branch IDs
}
