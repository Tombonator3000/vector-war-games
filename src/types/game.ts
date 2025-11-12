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
import type { IdeologyState, RevolutionState } from './ideology';
import type { ResourceStockpile, ResourceTrade, TerritoryResources } from './territorialResources';
import type { ResourceMarket } from '@/lib/resourceMarketSystem';
import type { DepletionWarning } from '@/lib/resourceDepletionSystem';
import type { AdvancedPropagandaState } from './advancedPropaganda';

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
  alertLevel?: 'none' | 'elevated' | 'severe' | 'deadly';
}

export interface RelationshipEvent {
  turn: number;
  withNation: string;
  delta: number;
  reason: string;
  newValue: number;
}

export interface DefconChangeEvent {
  turn: number;
  previousDefcon: number;
  newDefcon: number;
  reason: string;
  category: 'escalation' | 'de-escalation';
  triggeredBy: 'player' | 'ai' | 'event' | 'system';
  timestamp: number;
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
  cityConstructionQueue?: { turnsRemaining: number; totalTurns: number } | null;
  treaties?: Record<string, Treaty>;
  satellites?: Record<string, number>; // targetId -> expiresAtTurn
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

  // DEFCON Peace Initiative System (Phase 2 Enhancement)
  lastAggressiveAction?: number;  // Turn number of last aggressive action (war, nukes, orbital strikes)
  lastPeaceInitiative?: number;   // Turn number of last peace initiative (cooldown tracking)
  activeTreaties?: Array<{        // Active peace treaties
    withNationId: string;
    expiryTurn: number;
    type: 'truce' | 'peace';
  }>;

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

  // Ideology System
  ideologyState?: IdeologyState;                    // Nation's ideology and support levels
  revolutionState?: RevolutionState;                // Revolution risk tracking

  // Casus Belli System (War Justification & Peace Terms)
  casusBelli?: import('./casusBelli').CasusBelli[];        // Available reasons for war
  activeWars?: import('./casusBelli').WarState[];          // Active wars this nation is involved in
  peaceOffers?: import('./casusBelli').PeaceOffer[];       // Pending peace offers

  // Bio-warfare capabilities (AI nations)
  bioLab?: BioLabFacility;
  plagueState?: PlagueState;
  bioStrategy?: 'stealth' | 'lethal' | 'balanced'; // AI evolution strategy

  // Leader Abilities (FASE 3.2)
  leaderAbilityState?: import('./leaderAbilities').LeaderAbilityState;

  // Spy Network System
  spyNetwork?: import('./spySystem').SpyNetworkState;
  pendingCyberRetaliation?: {
    // Queued retaliation plan when the nation traces a hostile cyber attack
    targetId: string;
    triggerTurn: number;
    reason: string;
  };

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

  // Territorial Resources System (Phase 4)
  resourceStockpile?: ResourceStockpile;    // Strategic resource stockpile (oil, uranium, rare earths, food)
  resourceGeneration?: {                     // Per-turn resource generation tracking
    oil: number;
    uranium: number;
    rare_earths: number;
    food: number;
  };
  radiationSickness?: number;               // Accumulated fallout sickness (0-100)
  falloutInstability?: number;              // Instability pressure generated by fallout
  falloutHunger?: number;                   // Hunger/starvation pressure from fallout (0-100)
  refugeeFlow?: number;                     // Civilians fleeing fallout zones per turn
}

export interface NationFalloutState {
  cumulativeIntensity: number;
  sickness: number;
  hunger: number;
  instability: number;
  refugeeFlow: number;
  lastSeverity: 'none' | 'elevated' | 'severe' | 'deadly';
  lastUpdated: number;
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
  defconHistory?: DefconChangeEvent[];
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
  overlay?: { text: string; ttl: number; tone?: 'info' | 'warning' | 'catastrophe'; sound?: string } | null;
  fx?: number;
  nuclearWinterLevel?: number;
  globalRadiation?: number;
  events?: boolean;
  diplomacy?: DiplomacyState;
  falloutMarks: FalloutMark[];
  falloutEffects?: Record<string, NationFalloutState>;
  satelliteOrbits: SatelliteOrbit[];
  nations: Nation[];

  /** Great Old Ones campaign mode state */
  greatOldOnes?: GreatOldOnesState;

  /** Diplomacy Phase 3 state */
  diplomacyPhase3?: import('./diplomacyPhase3').DiplomacyPhase3State;

  /** Multi-Party Diplomacy state (FASE 3.4) */
  multiPartyDiplomacy?: import('./multiPartyDiplomacy').MultiPartyDiplomacyState;

  /** Casus Belli System state */
  casusBelliState?: {
    allWars: import('./casusBelli').WarState[];        // All active wars in the game
    warHistory: import('./casusBelli').WarState[];     // Completed wars
  };

  /** Doctrine Incident System state */
  doctrineIncidentState?: DoctrineIncidentState;

  /** Doctrine Shift Tracking state */
  doctrineShiftState?: DoctrineShiftState;

  /** Territorial Resources System */
  territoryResources?: Record<string, TerritoryResources>;  // Resource deposits per territory
  resourceTrades?: ResourceTrade[];                         // Active resource trade agreements
  resourceMarket?: ResourceMarket;                          // Resource market with dynamic pricing
  depletionWarnings?: DepletionWarning[];                   // Active depletion warnings

  /** Advanced Propaganda System */
  advancedPropaganda?: AdvancedPropagandaState;            // Useful idiots, phobia campaigns, religious weapons
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
