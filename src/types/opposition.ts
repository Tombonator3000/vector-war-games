/**
 * Opposition System
 * Tracks domestic opposition strength, platform, and actions
 */

export type OppositionPlatform = 'dovish' | 'hawkish' | 'isolationist' | 'internationalist' | 'populist' | 'technocratic';

export interface OppositionAction {
  id: string;
  type: 'no_confidence' | 'leak' | 'promise_reform' | 'scandal' | 'protest';
  turn: number;
  effects: {
    morale?: number;
    publicOpinion?: number;
    cabinetApproval?: number;
    instability?: number;
  };
  description: string;
}

export interface OppositionState {
  /** Opposition strength (0-100) - represents how powerful the opposition is */
  strength: number;

  /** Opposition platform - determines their policy positions and actions */
  platform: OppositionPlatform;

  /** Recent actions taken by opposition */
  recentActions: OppositionAction[];

  /** Turn when opposition was last active */
  lastActiveTurn: number;

  /** Whether opposition is currently mobilizing for election challenge */
  mobilizing: boolean;
}

/**
 * Calculate opposition activity level based on government performance
 */
export function calculateOppositionActivity(
  publicOpinion: number,
  cabinetApproval: number,
  morale: number,
  instability: number
): number {
  // Opposition becomes more active when government is weak
  const opinionPenalty = Math.max(0, 50 - publicOpinion) * 0.8;
  const approvalPenalty = Math.max(0, 50 - cabinetApproval) * 0.6;
  const moralePenalty = Math.max(0, 50 - morale) * 0.4;
  const instabilityBonus = Math.min(instability * 0.5, 30);

  return Math.min(100, opinionPenalty + approvalPenalty + moralePenalty + instabilityBonus);
}

/**
 * Get opposition platform description
 */
export function getOppositionPlatformDescription(platform: OppositionPlatform): string {
  switch (platform) {
    case 'dovish':
      return 'Peace-focused opposition demanding immediate de-escalation and diplomacy.';
    case 'hawkish':
      return 'Militarist opposition demanding stronger military action and total victory.';
    case 'isolationist':
      return 'Isolationist opposition calling for withdrawal from international conflicts.';
    case 'internationalist':
      return 'Globalist opposition pushing for stronger alliances and multilateral cooperation.';
    case 'populist':
      return 'Populist opposition exploiting public discontent with anti-establishment rhetoric.';
    case 'technocratic':
      return 'Expert-led opposition promising rational, evidence-based policy solutions.';
  }
}

/**
 * Determine opposition platform based on government's policies and situation
 */
export function determineOppositionPlatform(
  currentMorale: number,
  isAtWar: boolean,
  allianceCount: number
): OppositionPlatform {
  if (isAtWar && currentMorale < 50) {
    return 'dovish'; // Peace platform when war is unpopular
  }
  if (isAtWar && currentMorale >= 60) {
    return 'hawkish'; // Demand more aggressive action
  }
  if (allianceCount === 0) {
    return 'internationalist'; // Push for alliances if isolated
  }
  if (allianceCount > 3) {
    return 'isolationist'; // Push for independence if over-committed
  }

  // Default to populist when no clear policy divide
  return 'populist';
}
