/**
 * Victory System Types
 *
 * STREAMLINED: Reduced from 6 to 4 clear victory paths
 * Removed: Cultural (too complex), Demographic (broken threshold)
 */

export type VictoryType =
  | 'diplomatic'
  | 'domination'
  | 'economic'
  | 'survival';

export interface VictoryCondition {
  id: string;
  description: string;
  current: number;
  required: number;
  isMet: boolean;
  unit?: string; // e.g., "nations", "turns", "cities", "population"
}

export interface VictoryMilestone {
  description: string;
  actionHint?: string; // Where in UI to take action
  priority: 'critical' | 'important' | 'optional';
}

export interface VictoryPath {
  type: VictoryType;
  name: string;
  icon: string;
  description: string;
  progress: number; // 0-100
  conditions: VictoryCondition[];
  nextMilestones: VictoryMilestone[];
  estimatedTurnsToVictory: number | null; // null if not on track
  isBlocked: boolean;
  blockReason?: string;
  color: string; // Tailwind color class
}

export interface VictoryAnalysis {
  paths: VictoryPath[];
  closestVictory: VictoryType | null;
  turnsUntilClosestVictory: number | null;
  recommendedPath: VictoryType | null;
  warnings: string[];
}
