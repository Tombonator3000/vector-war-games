import type { BioLabFacility } from './bioLab';
import type { PlagueState } from './biowarfare';

export interface NationCyberProfile {
  readiness: number;
  maxReadiness: number;
  offense: number;
  defense: number;
  detection: number;
  attribution: number;
  research?: {
    firewalls?: boolean;
    intrusionDetection?: boolean;
  };
  lastAttribution?: {
    turn: number;
    attackerId: string;
    outcome: 'success' | 'failed';
    falseFlagged?: boolean;
    attributedTo?: string | null;
  };
}

export interface Nation {
  id: string;
  isPlayer: boolean;
  name: string;
  leader: string;
  doctrine?: string;
  ai?: string;
  lon: number;
  lat: number;
  color: string;
  population: number;
  missiles: number;
  bombers?: number;
  submarines?: number;
  defense: number;
  instability?: number;
  production: number;
  uranium: number;
  intel: number;
  cities?: number;
  warheads: Record<number, number>;
  researched?: Record<string, boolean>;
  researchQueue?: { projectId: string; turnsRemaining: number; totalTurns: number } | null;
  treaties?: Record<string, any>;
  satellites?: Record<string, boolean>;
  bordersClosedTurns?: number;
  greenShiftTurns?: number;
  threats?: Record<string, number>;
  migrantsThisTurn?: number;
  migrantsTotal?: number;
  migrantsLastTurn?: number;
  immigrants?: number;
  coverOpsTurns?: number;
  deepRecon?: Record<string, number>;
  sanctionTurns?: number;
  sanctioned?: boolean;
  sanctionedBy?: Record<string, number>;
  environmentPenaltyTurns?: number;
  cyber?: NationCyberProfile;
  morale: number;
  publicOpinion: number;
  electionTimer: number;
  cabinetApproval: number;
  productionMultiplier?: number;
  uraniumPerTurn?: number;
  hasASATCapability?: boolean;
  orbitalStrikesAvailable?: number;
  sabotageDetectionReduction?: number;
  unitAttackBonus?: number;
  unitDefenseBonus?: number;
  combinedArmsBonus?: number;
  immigrationBonus?: number;
  satelliteIntelBonus?: number;
  treatyLockDuration?: number;

  // Bio-warfare capabilities (AI nations)
  bioLab?: BioLabFacility;
  plagueState?: PlagueState;
  bioStrategy?: 'stealth' | 'lethal' | 'balanced'; // AI evolution strategy
}

export interface SatelliteOrbit {
  ownerId: string;
  targetId: string;
  startedAt: number;
  ttl: number;
  phaseOffset: number;
  direction: 1 | -1;
}

export interface DiplomacyState {
  peaceTurns: number;
  lastEvaluatedTurn: number;
  allianceRatio: number;
  influenceScore: number;
  nearVictoryNotified: boolean;
  victoryAnnounced: boolean;
}

export interface GameState {
  turn: number;
  defcon: number;
  phase: 'PLAYER' | 'AI' | 'RESOLUTION' | 'PRODUCTION';
  actionsRemaining: number;
  paused: boolean;
  gameOver: boolean;
  selectedLeader: string | null;
  selectedDoctrine: string | null;
  playerName?: string;
  difficulty?: string;
  missiles: any[];
  bombers: any[];
  submarines?: any[];
  explosions: any[];
  particles: any[];
  radiationZones: any[];
  empEffects: any[];
  rings: any[];
  refugeeCamps?: any[];
  screenShake: number;
  overlay?: { text: string; ttl: number } | null;
  fx?: number;
  nuclearWinterLevel?: number;
  globalRadiation?: number;
  events?: boolean;
  diplomacy?: DiplomacyState;
  satelliteOrbits: SatelliteOrbit[];
}

export interface ConventionalWarfareDelta {
  id: string;
  description: string;
  appliedAt: string;
  payload: Record<string, unknown>;
}

export interface MultiplayerSharedState {
  gameState?: GameState;
  nations?: Nation[];
  conventionalDeltas?: ConventionalWarfareDelta[];
}

export type MultiplayerActionType =
  | 'BUILD'
  | 'INTEL'
  | 'RESEARCH'
  | 'DIPLOMACY'
  | 'PRODUCTION'
  | 'CULTURE'
  | 'IMMIGRATION'
  | 'BIOWARFARE';
