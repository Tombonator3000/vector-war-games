import type { BioLabFacility } from './bioLab';
import type { PlagueState } from './biowarfare';
import type { ScenarioConfig } from './scenario';
import type { GreatOldOnesState } from './greatOldOnes';
import type { TrustRecord, FavorBalance, DiplomaticPromise } from './trustAndFavors';
import type { Grievance, Claim } from './grievancesAndClaims';
import type { SpecializedAlliance } from './specializedAlliances';
import type { DiplomaticInfluence, CouncilMembershipType } from './diplomacyPhase3';
import type { DoctrineIncidentState, DoctrineShiftState } from './doctrineIncidents';
import type { PopGroup, ImmigrationPolicyType } from './popSystem';
import type { CulturalInfluence, PropagandaCampaign, CulturalWonder } from './culturalWarfare';

export interface FalloutMark {
  id: string;
  lon: number;
  lat: number;
  canvasX: number;
  canvasY: number;
  radius: number;
  targetRadius: number;
  intensity: number;
  targetIntensity: number;
  createdAt: number;
  updatedAt: number;
  lastStrikeAt: number;
  growthRate: number;
  decayDelayMs: number;
  decayRate: number;
}

export interface RelationshipEvent {
  turn: number;
  withNation: string;
  delta: number;
  reason: string;
  newValue: number;
}

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
    advancedOffense?: boolean;
    stealthProtocols?: boolean;
    attributionObfuscation?: boolean;
    aiDefense?: boolean;
    cyberSuperweapon?: boolean;
  };
  lastAttribution?: {
    turn: number;
    attackerId: string;
    outcome: 'success' | 'failed';
    falseFlagged?: boolean;
    attributedTo?: string | null;
  };
}

export interface Treaty {
  truceTurns?: number;
  alliance?: boolean;
  [key: string]: unknown;
}

export interface Missile {
  [key: string]: unknown;
}

export interface Bomber {
  [key: string]: unknown;
}

export interface Submarine {
  [key: string]: unknown;
}

export interface Explosion {
  [key: string]: unknown;
}

export interface Particle {
  [key: string]: unknown;
}

export interface RadiationZone {
  [key: string]: unknown;
}

export interface EMPEffect {
  [key: string]: unknown;
}

export interface Ring {
  [key: string]: unknown;
}

export interface RefugeeCamp {
  [key: string]: unknown;
}

export interface Nation {
  id: string;
  isPlayer: boolean;
  name: string;
  leader: string;
  leaderName?: string;
  aiPersonality?: string;
  doctrine?: string;
  ai?: string;
  lon: number;
  lat: number;
  color: string;
  gold?: number;
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
  treaties?: Record<string, Treaty>;
  satellites?: Record<string, boolean>;
  intelOperationCooldowns?: Record<string, number>; // Unified intel operations cooldown tracking
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

  // Diplomacy and relationships
  alliances?: string[];
  relationships?: Record<string, number>; // Nation ID -> Relationship score (-100 to +100)
  relationshipHistory?: RelationshipEvent[]; // History of relationship changes

  // Trust and Favors (Phase 1 Diplomacy Enhancement)
  trustRecords?: Record<string, TrustRecord>; // Nation ID -> Trust record (0-100)
  favorBalances?: Record<string, FavorBalance>; // Nation ID -> Favor balance
  diplomaticPromises?: DiplomaticPromise[]; // Active promises made by this nation

  // Grievances and Claims (Phase 2 Diplomacy Enhancement)
  grievances?: Grievance[]; // Historical grievances against other nations
  claims?: Claim[]; // Territorial and resource claims

  // Specialized Alliances (Phase 2 Diplomacy Enhancement)
  specializedAlliances?: SpecializedAlliance[]; // Specialized alliance types

  // Diplomacy Phase 3
  diplomaticInfluence?: DiplomaticInfluence; // Diplomatic currency system
  councilMembership?: CouncilMembershipType; // International council membership

  // Diplomatic Reputation System (Phase 4)
  diplomaticReputation?: any; // Legacy type - to be migrated

  // Agenda System (Leader personality traits)
  agendas?: import('./negotiation').Agenda[]; // Primary, hidden, and situational agendas
  hasEmbassyWith?: Record<string, boolean>; // Track which nations have established embassies
  firstContactTurn?: Record<string, number>; // Track when first contact was made with each nation

  readinessRegen?: number;
  detectionReduction?: number;
  buildCostReduction?: number;
  maxProduction?: number;
  maxIntel?: number;
  maxUranium?: number;
  cultureBombCostReduction?: number;
  maxTreaties?: number;
  stolenPopConversionRate?: number;
  maxSatellites?: number;
  enemyMissileAccuracyReduction?: number;
  memeWaveEffectiveness?: number;
  autoRevealEnemyResearch?: boolean;
  hasRegimeDestabilization?: boolean;
  eliminated?: boolean;
  intelligence?: number;

  // Pop System & Cultural Warfare (Enhanced Immigration & Culture)
  popGroups?: PopGroup[];                           // Detailed population groups
  culturalIdentity?: string;                        // National culture (defaults to nation name)
  culturalPower?: number;                           // Cultural strength (0-100+)
  assimilationRate?: number;                        // Base assimilation rate per turn
  currentImmigrationPolicy?: ImmigrationPolicyType; // Active immigration policy
  culturalInfluences?: CulturalInfluence[];         // Cultural influence zones
  propagandaCampaigns?: PropagandaCampaign[];       // Active propaganda campaigns
  culturalWonders?: CulturalWonder[];               // Built cultural wonders
  activeCulturalDefenses?: string[];                // Active defense types

  // Bio-warfare capabilities (AI nations)
  bioLab?: BioLabFacility;
  plagueState?: PlagueState;
  bioStrategy?: 'stealth' | 'lethal' | 'balanced'; // AI evolution strategy

  // Leader Abilities (FASE 3.2)
  leaderAbilityState?: import('./leaderAbilities').LeaderAbilityState;

  // Temporary ability effects
  firstStrikeBonus?: number;
  firstStrikeActive?: boolean;
  firstStrikeTurnsRemaining?: number;
  rapidMobilizationActive?: boolean;
  rapidMobilizationCostReduction?: number;
  rapidMobilizationTurnsRemaining?: number;
  missileShieldActive?: boolean;
  missileShieldTurnsRemaining?: number;
  economicBoomActive?: boolean;
  economicBoomMultiplier?: number;
  economicBoomTurnsRemaining?: number;
  corruptionActive?: boolean;
  corruptionRate?: number;
  corruptionTurnsRemaining?: number;
  corruptionSourceId?: string;
  extraTurnGranted?: boolean;
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
  scenario?: ScenarioConfig;
  missiles: Missile[];
  bombers: Bomber[];
  submarines?: Submarine[];
  explosions: Explosion[];
  particles: Particle[];
  radiationZones: RadiationZone[];
  empEffects: EMPEffect[];
  rings: Ring[];
  refugeeCamps?: RefugeeCamp[];
  screenShake: number;
  overlay?: { text: string; ttl: number } | null;
  fx?: number;
  nuclearWinterLevel?: number;
  globalRadiation?: number;
  events?: boolean;
  diplomacy?: DiplomacyState;
  falloutMarks: FalloutMark[];
  satelliteOrbits: SatelliteOrbit[];

  /** Great Old Ones campaign mode state */
  greatOldOnes?: GreatOldOnesState;

  /** Diplomacy Phase 3 state */
  diplomacyPhase3?: import('./diplomacyPhase3').DiplomacyPhase3State;

  /** Multi-Party Diplomacy state (FASE 3.4) */
  multiPartyDiplomacy?: import('./multiPartyDiplomacy').MultiPartyDiplomacyState;

  /** Doctrine Incident System state */
  doctrineIncidentState?: DoctrineIncidentState;

  /** Doctrine Shift Tracking state */
  doctrineShiftState?: DoctrineShiftState;
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
