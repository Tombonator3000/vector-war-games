/**
 * Doctrine Incidents & Crisis System Types
 *
 * Defines random events that challenge a nation's doctrine choice
 * and force meaningful decisions with consequences.
 */

import type { NewsItem } from '@/components/NewsTicker';

export type DoctrineKey = 'mad' | 'defense' | 'firstStrike' | 'detente';

export type IncidentSeverity = 'minor' | 'major' | 'critical';

export interface DoctrineIncidentChoice {
  id: string;
  text: string;
  doctrineAlignment: DoctrineKey | 'neutral';
  consequences: {
    // Relationship changes
    relationshipChanges?: Record<string, number>; // nationId -> change
    globalRelationshipChange?: number;

    // Resource impacts
    goldCost?: number;
    productionCost?: number;
    intelCost?: number;

    // Military impacts
    missileDelta?: number;
    defenseDelta?: number;
    instabilityDelta?: number;
    moraleDelta?: number;

    // Doctrine shift
    doctrineShift?: {
      toward: DoctrineKey;
      amount: number; // 0-100
    };

    // Diplomacy impacts
    trustChange?: number; // global or specific nation
    deterrenceChange?: number; // affects attack likelihood

    // Special effects
    triggerWar?: boolean;
    breakTreaties?: boolean;
    gainTech?: string; // research project id

    // Narrative
    newsEvent?: {
      category: NewsItem['category'];
      headline: string;
      priority: NewsItem['priority'];
    };
  };
  followUpIncident?: string; // id of incident that may trigger after
}

export interface DoctrineIncident {
  id: string;
  doctrineType: DoctrineKey;
  title: string;
  description: string;
  severity: IncidentSeverity;
  choices: DoctrineIncidentChoice[];

  // Conditions for this incident to appear
  conditions?: {
    minTurn?: number;
    maxTurn?: number;
    requiresWar?: boolean;
    requiresPeace?: boolean;
    requiresAllies?: boolean;
    requiresEnemies?: boolean;
    minMissiles?: number;
    minDefense?: number;
    hasResearch?: string[]; // requires these research projects
  };

  // How likely this incident is (modified by game state)
  baseChance: number; // 0-100 per turn

  // Once-per-game or repeatable?
  repeatable: boolean;

  // Visual/audio cues
  urgency: 'low' | 'medium' | 'high' | 'critical';
  iconType?: 'warning' | 'crisis' | 'opportunity' | 'decision';
}

export interface DoctrineIncidentState {
  activeIncident: DoctrineIncident | null;
  resolvedIncidents: string[]; // ids of incidents already handled
  incidentHistory: {
    incidentId: string;
    turn: number;
    choiceId: string;
    outcome: string;
  }[];
  lastIncidentTurn: number;
}

/**
 * Doctrine Shift Tracking
 * Tracks how player actions move them toward different doctrines
 */
export interface DoctrineShiftState {
  currentDoctrine: DoctrineKey;
  shiftPoints: Record<DoctrineKey, number>; // accumulate points toward shift
  shiftThreshold: number; // default 60, when reached triggers shift warning
  recentActions: {
    action: string;
    turn: number;
    shiftEffect: { toward: DoctrineKey; amount: number };
  }[];
}
