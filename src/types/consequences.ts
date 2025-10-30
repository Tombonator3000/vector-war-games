/**
 * Action Consequence Preview System
 *
 * Shows players what will happen before they take major actions
 * Inspired by XCOM's hit chances and Civ's "What if" tooltips
 */

export type ActionType =
  | 'launch_missile'
  | 'launch_bomber'
  | 'deploy_submarine'
  | 'form_alliance'
  | 'break_alliance'
  | 'cyber_attack'
  | 'deploy_bio_weapon'
  | 'declare_war'
  | 'build_city'
  | 'deploy_conventional';

export type ConsequenceSeverity = 'positive' | 'neutral' | 'negative' | 'critical';

export interface Consequence {
  description: string;
  severity: ConsequenceSeverity;
  probability?: number; // 0-100, undefined means guaranteed
  icon?: string;
}

export interface ActionConsequences {
  actionType: ActionType;
  actionTitle: string;
  actionDescription: string;
  targetName?: string;

  // Main consequences
  immediate: Consequence[];
  longTerm: Consequence[];
  risks: Consequence[];

  // Metrics changes
  defconChange?: { from: number; to: number };
  relationshipChanges?: { nation: string; change: number }[];
  victoryImpact?: { victoryType: string; impact: string };

  // Success estimation
  successProbability?: number; // 0-100
  successDescription?: string;

  // Resource costs
  costs?: {
    production?: number;
    uranium?: number;
    intel?: number;
    actions?: number;
  };

  // Warnings
  warnings?: string[];
  blockedReasons?: string[];
}

export interface ConsequenceCalculationContext {
  playerNation: any;
  targetNation?: any;
  allNations: any[];
  currentDefcon: number;
  currentTurn: number;
  gameState: any;
}
