import { useEffect, useRef, useState, useCallback, useMemo, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { feature } from 'topojson-client';
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Factory, Microscope, Satellite, Radio, Users, Handshake, Zap, ArrowRight, Shield, FlaskConical, X, Menu, Save, FolderOpen, LogOut, Settings, AlertTriangle, Target, UserSearch, Swords, Flag } from 'lucide-react';
import { NewsTicker, NewsItem } from '@/components/NewsTicker';
import { PandemicPanel } from '@/components/PandemicPanel';
import { BioWarfareLab } from '@/components/BioWarfareLab';
import { useFlashpoints, type FlashpointOutcome } from '@/hooks/useFlashpoints';
import {
  usePandemic,
  type PandemicTriggerPayload,
  type PandemicCountermeasurePayload,
  type PandemicTurnContext
} from '@/hooks/usePandemic';
import { useBioWarfare } from '@/hooks/useBioWarfare';
import { useEconomicDepth } from '@/hooks/useEconomicDepth';
import { useMilitaryTemplates } from '@/hooks/useMilitaryTemplates';
import { useSupplySystem } from '@/hooks/useSupplySystem';
import { useVIIRS, getFireColor, getFireRadius, type VIIRSFirePoint } from '@/hooks/useVIIRS';
import { useWeatherRadar } from '@/hooks/useWeatherRadar';
import { useSatelliteSignals } from '@/hooks/useSatelliteSignals';
import { SatelliteGroundStationPanel } from '@/components/SatelliteGroundStationPanel';
import type { SignalSatellite, SignalTransmission, GroundStation as SignalGroundStation, SignalInterference } from '@/types/satelliteSignal';
import { initializeAllAINations, processAllAINationsBioWarfare } from '@/lib/aiBioWarfareIntegration';
import { PopSystemManager } from '@/lib/popSystemManager';
import { DEPLOYMENT_METHODS } from '@/types/bioDeployment';
import type { BioLabTier } from '@/types/bioLab';
import type { EvolutionNodeId } from '@/types/biowarfare';
import { FlashpointModal } from '@/components/FlashpointModal';
import { FlashpointOutcomeModal } from '@/components/FlashpointOutcomeModal';
import { DefconChangeModal } from '@/components/DefconChangeModal';
import { SpyMissionResultModal, type SpyMissionResultData } from '@/components/spy/SpyMissionResultModal';
import GlobeScene, {
  type GlobeSceneHandle,
  PickerFn,
  ProjectorFn,
  type MapStyle,
  type MapVisualStyle,
  type MapMode,
  type MapModeOverlayData,
  DEFAULT_MAP_STYLE,
  MAP_VISUAL_STYLES,
  MAP_MODES,
} from '@/components/GlobeScene';
import { useFogOfWar } from '@/hooks/useFogOfWar';
import {
  useGovernance,
  type GovernanceNationRef,
  type GovernanceMetrics,
  type GovernanceDelta,
  type UseGovernanceReturn,
  calculateMoraleProductionMultiplier,
  calculateMoraleRecruitmentModifier,
} from '@/hooks/useGovernance';
import { useOpposition } from '@/hooks/useOpposition';
import {
  useGovernment,
  type GovernmentNationRef,
  type UseGovernmentReturn,
} from '@/hooks/useGovernment';
import { GOVERNMENT_BONUSES, type GovernmentState } from '@/types/government';
import { TutorialGuide } from '@/components/TutorialGuide';
import { TutorialOverlay } from '@/components/TutorialOverlay';
import { useTutorial } from '@/hooks/useTutorial';
import { GameHelper } from '@/components/GameHelper';
import { useMultiplayer } from '@/contexts/MultiplayerProvider';
import { useRNG } from '@/contexts/RNGContext';
import { useTutorialContext } from '@/contexts/TutorialContext';
import { PhaseTransitionOverlay } from '@/components/PhaseTransitionOverlay';
import { CatastropheBanner } from '@/components/CatastropheBanner';
import { useGameEra } from '@/hooks/useGameEra';
import { useVictoryTracking } from '@/hooks/useVictoryTracking';
import { checkVictory } from '@/types/streamlinedVictoryConditions';
import { EraTransitionOverlay } from '@/components/EraTransitionOverlay';
import { DefconWarningOverlay } from '@/components/DefconWarningOverlay';
import { ActionConsequencePreview } from '@/components/ActionConsequencePreview';
import { GameSidebar } from '@/components/GameSidebar';
import { LockedFeatureWrapper } from '@/components/LockedFeatureBadge';
import { FEATURE_UNLOCK_INFO, type EraDefinition, type GameEra } from '@/types/era';
import type { ActionConsequences, ConsequenceCalculationContext } from '@/types/consequences';
import { calculateActionConsequences } from '@/lib/consequenceCalculator';
import { applyRemoteGameStateSync } from '@/lib/coopSync';
import { calculateNuclearImpact, applyNuclearImpactToNation } from '@/lib/nuclearDamageModel';
import { getFalloutSeverityLevel } from '@/lib/falloutEffects';
import { loadTerritoryData, type TerritoryPolygon } from '@/lib/territoryPolygons';
import { CivilizationInfoPanel } from '@/components/CivilizationInfoPanel';
import { ResourceStockpileDisplay } from '@/components/ResourceStockpileDisplay';
import { MarketStatusBadge } from '@/components/ResourceMarketPanel';
import type { DepletionWarning } from '@/lib/resourceDepletionSystem';
import type { SeededRandom } from '@/lib/seededRandom';
import { DiplomacyProposalOverlay } from '@/components/DiplomacyProposalOverlay';
import { EnhancedDiplomacyModal, type DiplomaticAction } from '@/components/EnhancedDiplomacyModal';
import { LeaderContactModal } from '@/components/LeaderContactModal';
import { CivStyleDiplomacyModal } from '@/components/CivStyleDiplomacyModal';
import { LeadersScreen } from '@/components/LeadersScreen';
import { AgendaRevelationNotification } from '@/components/AgendaRevelationNotification';
import { PopulationImpactFeedback } from '@/components/PopulationImpactFeedback';
import { LeaderOverviewPanel } from '@/components/LeaderOverviewPanel';
import { GovernmentStatusPanel } from '@/components/GovernmentStatusPanel';
import { StrategicOutliner } from '@/components/StrategicOutliner';
import type { StrategicOutlinerGroup } from '@/components/StrategicOutliner';
import { OrderOfBattlePanel } from '@/components/OrderOfBattlePanel';
import { AINegotiationNotificationQueue } from '@/components/AINegotiationNotification';
import { AIDiplomacyProposalModal } from '@/components/AIDiplomacyProposalModal';
import { EndGameScreen } from '@/components/EndGameScreen';
import type {
  GameState,
  Nation,
  ConventionalWarfareDelta,
  NationCyberProfile,
  SatelliteOrbit,
  FalloutMark,
  RadiationZone,
} from '@/types/game';
import type { WarState, PeaceOffer } from '@/types/casusBelli';
// Removed - using unified diplomacy DiplomaticProposal instead
import type { NegotiationState } from '@/types/negotiation';
import { evaluateNegotiation } from '@/lib/aiNegotiationEvaluator';
import { applyNegotiationDeal } from '@/lib/negotiationUtils';
import { evaluateProposal, shouldAIInitiateProposal } from '@/lib/aiDiplomacyEvaluator';
import { CoopStatusPanel } from '@/components/coop/CoopStatusPanel';
import {
  checkPoliticalGameOver,
  generatePoliticalWarnings,
  shouldRegimeChangeOccur,
  executeRegimeChange,
  generateRegimeChangeNews,
  type AIPersonality,
} from '@/lib/regimeChange';
import { generateTurnNews } from '@/lib/politicalNews';
import { ApprovalQueue } from '@/components/coop/ApprovalQueue';
import { ConflictResolutionDialog } from '@/components/coop/ConflictResolutionDialog';
import {
  useConventionalWarfare,
  type ConventionalState,
  type NationConventionalProfile,
  type ForceType,
  type TerritoryState,
  createDefaultConventionalState,
  createDefaultNationConventionalProfile,
  territoryAnchors,
} from '@/hooks/useConventionalWarfare';
import { makeAITurn as makeConventionalAITurn } from '@/lib/conventionalAI';
import { ConventionalForcesPanel } from '@/components/ConventionalForcesPanel';
import { TerritoryMapPanel } from '@/components/TerritoryMapPanel';
import { UnifiedIntelOperationsPanel } from '@/components/UnifiedIntelOperationsPanel';
import { SpyNetworkPanel } from '@/components/SpyNetworkPanel';
import WarCouncilPanel from '@/components/WarCouncilPanel';
import { ConsolidatedWarModal } from '@/components/ConsolidatedWarModal';
import {
  executeSatelliteDeployment,
  executeSabotageOperation,
  executeCyberAttack,
  INTEL_OPERATIONS,
  type IntelOperationType,
} from '@/types/unifiedIntelOperations';
import { UnifiedDiplomacyPanel } from '@/components/UnifiedDiplomacyPanel';
import { SimplifiedBioWarfarePanel } from '@/components/SimplifiedBioWarfarePanel';
import { AdvancedPropagandaPanel } from '@/components/AdvancedPropagandaPanel';
import { StreamlinedCulturePanel } from '@/components/StreamlinedCulturePanel';
import { NGOOperationsPanel } from '@/components/NGOOperationsPanel';
import type { ProposalType, DiplomaticProposal } from '@/types/unifiedDiplomacy';
import type { PropagandaType, CulturalWonderType, ImmigrationPolicy } from '@/types/streamlinedCulture';
import type { ImmigrationPolicyType } from '@/types/popSystem';
import { migrateGameDiplomacy, getRelationship } from '@/lib/unifiedDiplomacyMigration';
import { deployBioWeapon, processAllBioAttacks, initializeBioWarfareState } from '@/lib/simplifiedBioWarfareLogic';
import { launchPropagandaCampaign, buildWonder, applyImmigrationPolicy } from '@/lib/streamlinedCultureLogic';
import { clampDefenseValue, MAX_DEFENSE_LEVEL, calculateDirectNuclearDamage } from '@/lib/nuclearDamage';
import { calculateMissileInterceptChance } from '@/lib/missileDefense';
import { processImmigrationAndCultureTurn, initializeNationPopSystem } from '@/lib/immigrationCultureTurnProcessor';
import { initializeSpyNetwork } from '@/lib/spyNetworkUtils';
import { getPolicyById } from '@/lib/policyData';
import {
  initializeIdeologySystem,
  processIdeologySystemTurn,
  applyIdeologyBonusesForProduction,
  generateIdeologicalGrievances,
} from '@/lib/ideologyIntegration';
import {
  initializeGovernmentSystem,
  applyGovernmentBonuses,
  applyGovernmentBonusesForProduction,
  getGovernmentProductionMultiplier,
  getGovernmentResearchMultiplier,
  getGovernmentRecruitmentMultiplier,
  getGovernmentMilitaryCostReduction,
  getGovernmentOppositionSuppression,
  getGovernmentPropagandaEffectiveness,
} from '@/lib/governmentIntegration';
import {
  addStrategicResource,
  initializeResourceStockpile,
  spendStrategicResource,
} from '@/lib/territorialResourcesSystem';
import {
  useCyberWarfare,
  createDefaultNationCyberProfile,
  applyCyberResearchUnlock,
} from '@/hooks/useCyberWarfare';
import { useSpyNetwork } from '@/hooks/useSpyNetwork';
import { GovernanceEventDialog } from '@/components/governance/GovernanceEventDialog';
import { GovernanceDetailPanel } from '@/components/governance/GovernanceDetailPanel';
import { PolicySelectionPanel } from '@/components/governance/PolicySelectionPanel';
import { PoliticalStabilityOverlay } from '@/components/governance/PoliticalStabilityOverlay';
import { PandemicSpreadOverlay } from '@/components/pandemic/PandemicSpreadOverlay';
import { CasualtyImpactSummary } from '@/components/pandemic/CasualtyImpactSummary';
import { MapModeBar } from '@/components/MapModeBar';
import { MorphToggleButton } from '@/components/MorphToggleButton';
import { RadiationFalloutOverlay } from '@/components/radiation/RadiationFalloutOverlay';
import { MigrationFlowOverlay } from '@/components/migration/MigrationFlowOverlay';
import { usePolicySystem } from '@/hooks/usePolicySystem';
import { useNationalFocus } from '@/hooks/useNationalFocus';
import type { AvailableFocus } from '@/types/nationalFocus';
import { useInternationalPressure } from '@/hooks/useInternationalPressure';
import { useWarSupport } from '@/hooks/useWarSupport';
import { usePoliticalFactions } from '@/hooks/usePoliticalFactions';
import { useRegionalMorale } from '@/hooks/useRegionalMorale';
import { useMediaWarfare } from '@/hooks/useMediaWarfare';
import { IMMIGRATION_POLICIES } from '@/lib/immigrationPoliciesData';
import { useProductionQueue } from '@/hooks/useProductionQueue';
import { useResourceRefinement } from '@/hooks/useResourceRefinement';
import type {
  SanctionPackage,
  AidPackage,
  AidType,
  InternationalPressure,
  SanctionType,
} from '@/types/regionalMorale';
import { calculateBomberInterceptChance, getMirvSplitChance } from '@/lib/research';
import type { Unit } from '@/lib/unitModels';
import { getDefaultScenario, type ScenarioConfig, SCENARIOS } from '@/types/scenario';
import { getGameTimestamp, turnsUntilEvent, isEventTurn } from '@/lib/timeSystem';
import {
  calculatePublicOpinion,
  runElection,
  applyElectionConsequences,
  modifyOpinionFromAction,
  getElectionStatusMessage,
  type ElectionResult,
} from '@/lib/electionSystem';
import { enhancedAIActions } from '@/lib/aiActionEnhancements';
import { ScenarioSelectionPanel } from '@/components/ScenarioSelectionPanel';
import { IntroScreen } from '@/components/setup/IntroScreen';
import { LeaderSelectionScreen } from '@/components/setup/LeaderSelectionScreen';
import { canAfford, pay, getCityCost, getCityBuildTime, canPerformAction, hasActivePeaceTreaty, isEligibleEnemyTarget, handleDefconChange as baseHandleDefconChange, type DefconChangeCallbacks } from '@/lib/gameUtils';
import {
  getBuildContextExtracted,
  buildMissileExtracted,
  buildBomberExtracted,
  buildDefenseExtracted,
  buildCityExtracted,
  buildWarheadExtracted,
  handleBuildExtracted,
  handleResearchExtracted,
  type BuildHandlerDependencies,
} from '@/lib/buildHandlers';
import { handleAttackExtracted, type AttackHandlerDependencies, type PendingLaunchState as PendingLaunchStateType } from '@/lib/attackHandlers';
import { handleIntelExtracted, type IntelHandlerDependencies } from '@/lib/intelHandlers';
import {
  handleOfferPeaceExtracted,
  handleAcceptPeaceExtracted,
  handleRejectPeaceExtracted,
  type DiplomaticHandlerDependencies
} from '@/lib/diplomaticHandlers';
import { handleUseLeaderAbility as handleUseLeaderAbilityExtracted, type LeaderAbilityDeps } from '@/lib/leaderAbilityHandlers';
import { handleCulture as handleCultureExtracted, type CultureHandlerDeps } from '@/lib/cultureHandlers';
import { confirmPendingLaunch as confirmPendingLaunchExtracted, type LaunchConfirmationDeps } from '@/lib/launchConfirmationHandlers';
import {
  createCasualtyAlertTracker,
  evaluateCasualtyMilestones,
  type CasualtySummaryPayload,
} from '@/lib/pandemic/casualtyAlertEvaluator';
import { getNationById, adjustThreat, hasOpenBorders } from '@/lib/nationUtils';
import { applyAllianceProposal, applyTruceProposal } from '@/lib/diplomaticProposalUtils';
import { modifyRelationship, canFormAlliance, RELATIONSHIP_ALLIED } from '@/lib/relationshipUtils';
import {
  project,
  toLonLat,
  resolvePublicAssetPath,
  type ProjectedPoint,
} from '@/lib/renderingUtils';
import { GameStateManager, PlayerManager, DoomsdayClock, type LocalGameState, type LocalNation, createDefaultDiplomacyState } from '@/state';
import { CityLights } from '@/state/CityLights';
import type { GreatOldOnesState } from '@/types/greatOldOnes';
import { initializeGreatOldOnesState } from '@/lib/greatOldOnesHelpers';
import { initializeNationLeaderAbility, activateLeaderAbility } from '@/lib/leaderAbilityIntegration';
import type { ArmyGroupSummary } from '@/types/militaryTemplates';
import { getLeaderImage } from '@/lib/leaderImages';
import { initializeWeek3State, updateWeek3Systems, type Week3ExtendedState } from '@/lib/greatOldOnesWeek3Integration';
import { initializePhase2State, updatePhase2Systems, checkPhase2UnlockConditions, type Phase2State } from '@/lib/phase2Integration';
import { initializePhase3State, updatePhase3Systems, checkPhase3UnlockConditions } from '@/lib/phase3Integration';
import type { Phase3State } from '@/types/phase3Types';
import { DoctrineSelectionPanel, CouncilSchismModal, CouncilSchismButton, OrderCommandPanel, SanityHeatMapPanel, GlobalSanityIndicator, RegionalSanityOverlay, RitualSitePanel, MissionBoardPanel, UnitRosterPanel, Phase2DoctrinePanel } from '@/components/greatOldOnes';
import type { Phase2Operation } from '@/components/greatOldOnes/Phase2DoctrinePanel';
import {
  aiSignMutualTruce,
  aiSignNonAggressionPact,
  aiFormAlliance,
  aiSendAid,
  aiImposeSanctions,
  aiBreakTreaties,
  aiRespondToSanctions,
  aiHandleTreatyStrain,
  aiHandleDiplomaticUrgencies,
  aiAttemptDiplomacy,
  processAIProactiveDiplomacy,
  registerInternationalPressureCallbacks,
  type InternationalPressureSanctionEvent,
  type InternationalPressureAidEvent,
} from '@/lib/aiDiplomacyActions';
import { updateCasusBelliForAllNations, processWarDeclaration } from '@/lib/casusBelliIntegration';
import { createPeaceOffer, createWhitePeaceTerms } from '@/lib/peaceTermsUtils';
import { endWar } from '@/lib/warDeclarationUtils';
import {
  considerDiplomaticAction,
  applyRelationshipChange,
  getHostileNations,
} from '@/lib/aiUnifiedDiplomacy';
import {
  initializeGameTrustAndFavors,
  applyTrustDecay,
  modifyTrust,
  modifyFavors,
  createPromise,
  fulfillPromise,
  breakPromise,
} from '@/lib/trustAndFavorsUtils';
import { initializeGrievancesAndClaims, updateGrievancesAndClaimsPerTurn } from '@/lib/grievancesAndClaimsUtils';
import { initializeSpecializedAlliances, updateAlliancesPerTurn } from '@/lib/specializedAlliancesUtils';
import {
  updatePhase2PerTurn,
  resolveGrievancesWithApology,
  resolveGrievancesWithReparations,
} from '@/lib/diplomacyPhase2Integration';
import { initializeNationAgendas, processAgendaRevelations } from '@/lib/agendaSystem';
import { resetTriggerTracking } from '@/lib/aiNegotiationTriggers';
import {
  initializeDiplomacyPhase3State,
  type DiplomacyPhase3State as DiplomacyPhase3SystemState,
} from '@/types/diplomacyPhase3';
import { applyDIPIncome, initializeDIP, spendDIP } from '@/lib/diplomaticCurrencyUtils';
import {
  launch as launchMissile,
  resolutionPhase as runResolutionPhase,
  productionPhase as runProductionPhase,
  type LaunchDependencies,
  type ResolutionPhaseDependencies,
  type ProductionPhaseDependencies,
} from '@/lib/gamePhaseHandlers';
import {
  launchSubmarine as launchSubmarineExtracted,
  launchBomber as launchBomberExtracted,
  type NuclearLaunchDependencies,
} from '@/lib/nuclearLaunchHandlers';
import {
  drawSatellites as drawSatellitesExtracted,
  registerSatelliteOrbit as registerSatelliteOrbitExtracted,
  drawVIIRSFires as drawVIIRSFiresExtracted,
  drawSatelliteSignals as drawSatelliteSignalsExtracted,
  drawMissiles as drawMissilesExtracted,
  drawBombers as drawBombersExtracted,
  drawSubmarines as drawSubmarinesExtracted,
  drawConventionalForces as drawConventionalForcesExtracted,
  drawParticles as drawParticlesExtracted,
  drawFalloutMarks as drawFalloutMarksExtracted,
  upsertFalloutMark as upsertFalloutMarkExtracted,
  drawFX as drawFXExtracted,
  type CanvasDrawingDependencies,
} from '@/lib/canvasDrawingFunctions';
import {
  getScenarioDefcon,
  getDefconIndicatorClasses,
  DEFCON_BADGE_BASE_CLASSES,
  DEFCON_VALUE_BASE_CLASSES,
  resolveNationName as resolveNationNameUtil,
  getImposingNationNamesFromPackages as getImposingNationNamesUtil,
  formatSanctionTypeLabel as formatSanctionTypeUtil,
  getLeaderInitials as getLeaderInitialsUtil,
  Storage,
  easeInOutQuad,
} from '@/lib/gameUtilityFunctions';
import {
  drawWorld as renderWorld,
  drawNations as renderNations,
  drawWorldPath as renderWorldPath,
  drawTerritories as renderTerritories,
  type WorldRenderContext,
  type NationRenderContext,
  type TerritoryRenderContext,
  type ThemePalette,
} from '@/rendering/worldRenderer';
import {
  initializeInternationalCouncil,
  createResolution,
  addObserver,
  electCouncilMember,
  removeExpiredMembers,
  processExpiredVotes,
} from '@/lib/internationalCouncilUtils';
import { IntroLogo } from '@/components/intro/IntroLogo';
import {
  initializeDoctrineIncidentState,
  initializeDoctrineShiftState,
  updateDoctrineIncidentSystem,
  resolveIncident,
} from '@/lib/doctrineIncidentSystem';
import { DoctrineIncidentModal } from '@/components/DoctrineIncidentModal';
// DoctrineKey imported elsewhere
import { getLeaderDefaultDoctrine } from '@/data/leaderDoctrines';
import { Starfield } from '@/components/intro/Starfield';
import { SpinningEarth } from '@/components/intro/SpinningEarth';
import { OperationModal, type OperationAction, type OperationModalProps } from '@/components/modals/OperationModal';
import { IntelReportContent } from '@/components/modals/IntelReportContent';
import { BuildModal } from '@/components/game/BuildModal';
import { ResearchModal } from '@/components/game/ResearchModal';
import { OptionsMenu } from '@/components/OptionsMenu';
import { COSTS, RESEARCH_TREE, RESEARCH_LOOKUP, WARHEAD_RESEARCH_IDS, WARHEAD_YIELD_TO_ID, type ResourceCost, type ResearchProject } from '@/lib/gameConstants';
import { useModalManager, type ModalContentValue } from '@/hooks/game/useModalManager';
import { useNewsManager } from '@/hooks/game/useNewsManager';
import { getTrust, getFavors, FavorCosts } from '@/types/trustAndFavors';
import {
  bootstrapNationResourceState as bootstrapNationResourceStateExtracted,
  createCubanCrisisNation as createCubanCrisisNationExtracted,
  initializeCrisisRelationships as initializeCrisisRelationshipsExtracted,
  initializeCrisisGameSystems as initializeCrisisGameSystemsExtracted,
  finalizeCrisisGameState as finalizeCrisisGameStateExtracted,
  initCubanCrisisNations as initCubanCrisisNationsExtracted,
  resetGameState as resetGameStateExtracted,
  initNations as initNationsExtracted,
  type GameInitializationDependencies,
  type CrisisNationConfig,
} from '@/lib/gameInitialization';
import {
  startResearch as startResearchExtracted,
  advanceResearch as advanceResearchExtracted,
  advanceCityConstruction as advanceCityConstructionExtracted,
  type ResearchHandlerDependencies,
} from '@/lib/researchHandlers';
import {
  applyLeaderBonuses as applyLeaderBonusesExtracted,
  applyDoctrineEffects as applyDoctrineEffectsExtracted,
  mapAbilityCategoryToNewsCategory as mapAbilityCategoryToNewsCategoryExtracted,
} from '@/lib/leaderDoctrineHandlers';

// DEFCON utility functions now imported from @/lib/gameUtilityFunctions

type PressureDeltaState = { goldPenalty: number; aidGold: number };

let processInternationalPressureTurnFn: (() => void) | null = null;
let getTotalEconomicImpactFn:
  | ((nationId: string) => { productionPenalty: number; goldPenalty: number })
  | null = null;
let getAidBenefitsFn: ((nationId: string) => AidPackage['benefits']) | null = null;
let getPressureFn: ((nationId: string) => InternationalPressure | undefined) | null = null;
let getActiveSanctionsFn: (() => SanctionPackage[]) | null = null;
let presentSanctionDialog: ((packages: SanctionPackage[]) => void) | null = null;
let pressureDeltaState: PressureDeltaState = { goldPenalty: 0, aidGold: 0 };

const resetPressureDeltaState = () => {
  pressureDeltaState.goldPenalty = 0;
  pressureDeltaState.aidGold = 0;
};

// Wrapper functions for imported utilities
const resolveNationName = (nationId: string): string =>
  resolveNationNameUtil(nationId, GameStateManager.getNations());

const getImposingNationNamesFromPackages = (packages: SanctionPackage[]): string[] =>
  getImposingNationNamesUtil(packages, GameStateManager.getNations());

const formatSanctionTypeLabel = formatSanctionTypeUtil;

// Storage now imported from @/lib/gameUtilityFunctions

const getLeaderInitials = getLeaderInitialsUtil;

// Game State Types - now imported from @/state module (Phase 6 refactoring)
let governanceApiRef: UseGovernanceReturn | null = null;
let enqueueAIProposalRef: ((proposal: DiplomaticProposal) => void) | null = null;
let territoryListRef: { current: TerritoryState[] } = { current: [] };
let selectedTerritoryIdRef: { current: string | null } = { current: null };
let hoveredTerritoryIdRef: { current: string | null } = { current: null };
let dragTargetTerritoryIdRef: { current: string | null } = { current: null };
let draggingArmyRef: { current: { sourceId: string; armies: number } | null } = { current: null };

let policySystemRef: ReturnType<typeof usePolicySystem> | null = null;
let pandemicIntegrationEnabledRef = true;
let bioWarfareEnabledRef = true;
let pandemicStateRef: { casualtyTally?: number } | null = null;
let plagueStateRef: { plagueCompletionStats?: { totalKills?: number } } | null = null;

type NationalFocusSystemApi = ReturnType<typeof useNationalFocus>;

let focusApiRef: NationalFocusSystemApi | null = null;

const PROPOSAL_MAX_AGE = 10;

const isProposalExpired = (proposal: DiplomaticProposal, currentTurn: number): boolean => {
  return currentTurn - proposal.turn > PROPOSAL_MAX_AGE;
};

type ThemeId =
  | 'synthwave'
  | 'wargames'
  | 'noradBunker'
  | 'krasniy'
  | 'defcon1'
  | 'strangelove'
  | 'holographic';
type LayoutDensity = 'expanded' | 'compact' | 'minimal';

type LayoutDensityOption = {
  id: LayoutDensity;
  label: string;
  description: string;
};

type DeliveryMethod = 'missile' | 'bomber' | 'submarine';

interface PendingLaunchState {
  target: Nation;
  warheads: { yield: number; count: number; requiredDefcon: 1 | 2 }[];
  deliveryOptions: { id: DeliveryMethod; label: string; count: number }[];
}

const MAP_STYLE_OPTIONS: { value: MapVisualStyle; label: string; description: string }[] = [
  { value: 'realistic', label: 'Realistic', description: 'Satellite imagery with terrain overlays.' },
  {
    value: 'wireframe',
    label: 'Vector',
    description: 'Neon vector grid with luminous borders and elevation lines.',
  },
  {
    value: 'flat-realistic',
    label: 'Flat Realistic',
    description: 'High-resolution satellite texture rendered on the flat map.',
  },
];

const MAP_MODE_DESCRIPTIONS: Record<MapMode, { label: string; description: string }> = {
  standard: {
    label: 'Standard',
    description: 'Classic strategic overlay with nation markers and DEFCON grid.',
  },
  diplomatic: {
    label: 'Diplomatisk',
    description: 'Fargekoder nasjoner basert på relasjon til din regjering.',
  },
  intel: {
    label: 'Etterretning',
    description: 'Visualiserer overvåkingsdekning og rekognoseringsnivå.',
  },
  resources: {
    label: 'Ressurser',
    description: 'Fremhever strategiske lagre og markedspress.',
  },
  unrest: {
    label: 'Uro',
    description: 'Avdekker politisk stabilitet, opinion og krisesoner.',
  },
  pandemic: {
    label: 'Pandemi',
    description: 'Visualiserer global infeksjon, varme og laboratoriedeteksjon.',
  },
  radiation: {
    label: 'Stråling',
    description: 'Overvåker radioaktivt nedfall, sykdom og evakueringspress.',
  },
  migration: {
    label: 'Migrasjon',
    description: 'Kartlegger flyktningstrømmer, innvandring og demografisk press.',
  },
};

const MAP_MODE_HOTKEYS: Record<MapMode, string> = {
  standard: 'Alt+1',
  diplomatic: 'Alt+2',
  intel: 'Alt+3',
  resources: 'Alt+4',
  unrest: 'Alt+5',
  pandemic: 'Alt+6',
  radiation: 'Alt+7',
  migration: 'Alt+8',
};

const isVisualStyleValue = (value: unknown): value is MapVisualStyle =>
  typeof value === 'string' && MAP_VISUAL_STYLES.includes(value as MapVisualStyle);

const isMapModeValue = (value: unknown): value is MapMode =>
  typeof value === 'string' && MAP_MODES.includes(value as MapMode);

const FOCUS_BRANCH_METADATA: Record<
  'diplomatic' | 'economic' | 'intelligence' | 'military' | 'special',
  { title: string; description: string }
> = {
  diplomatic: {
    title: 'Diplomacy & Influence',
    description: 'Forge alliances, expand treaties, and sway global opinion.',
  },
  economic: {
    title: 'Economic Power',
    description: 'Invest in industry, trade, and infrastructure.',
  },
  intelligence: {
    title: 'Intelligence & Covert Ops',
    description: 'Enhance espionage, surveillance, and covert capabilities.',
  },
  military: {
    title: 'Military Doctrine',
    description: 'Strengthen armed forces and strategic readiness.',
  },
  special: {
    title: 'Special Projects',
    description: 'Pursue unique national ambitions and experimental paths.',
  },
};

type ScreenResolution = 'auto' | '1280x720' | '1600x900' | '1920x1080' | '2560x1440' | '3840x2160';

const RESOLUTION_OPTIONS: { value: ScreenResolution; label: string; description: string; width?: number; height?: number }[] = [
  {
    value: 'auto',
    label: 'Auto',
    description: 'Responsive - fits available screen space.',
  },
  {
    value: '1280x720',
    label: '1280x720',
    description: 'HD - Lower performance demand, higher framerate.',
    width: 1280,
    height: 720,
  },
  {
    value: '1600x900',
    label: '1600x900',
    description: 'HD+ - Balanced clarity and performance.',
    width: 1600,
    height: 900,
  },
  {
    value: '1920x1080',
    label: '1920x1080',
    description: 'Full HD - Standard modern desktop display.',
    width: 1920,
    height: 1080,
  },
  {
    value: '2560x1440',
    label: '2560x1440',
    description: 'QHD - High clarity, requires more GPU resources.',
    width: 2560,
    height: 1440,
  },
  {
    value: '3840x2160',
    label: '3840x2160',
    description: '4K Ultra HD - Maximum detail, high performance cost.',
    width: 3840,
    height: 2160,
  },
];

type CanvasIcon = HTMLImageElement | null;

type ConventionalUnitMarker = {
  unitId: string;
  ownerId: string;
  lon: number;
  lat: number;
  icon: CanvasIcon;
  forceType: ForceType;
};

type ConventionalMovementMarker = {
  id: string;
  unitId: string;
  ownerId: string;
  forceType: ForceType;
  icon: CanvasIcon;
  startLon: number;
  startLat: number;
  endLon: number;
  endLat: number;
  fromTerritoryId: string | null;
  toTerritoryId: string | null;
  progress: number;
  speed: number;
  createdAt: number;
};

type ConventionalMovementRegistration = {
  unitId: string;
  templateId?: string;
  ownerId: string;
  fromTerritoryId?: string | null;
  toTerritoryId?: string | null;
  fallbackEnd?: { lon: number; lat: number } | null;
};

const CONVENTIONAL_ICON_BASE_SCALE: Record<ForceType, number> = {
  army: 0.22,
  navy: 0.24,
  air: 0.2,
};

const loadIcon = (src: string): CanvasIcon => {
  if (typeof Image === 'undefined') {
    return null;
  }
  const image = new Image();
  // Prepend base URL to handle GitHub Pages deployment
  image.src = src.startsWith('/') ? import.meta.env.BASE_URL + src.slice(1) : src;
  return image;
};

const missileIcon = loadIcon('/icons/missile.svg');
const bomberIcon = loadIcon('/icons/bomber.svg');
const submarineIcon = loadIcon('/icons/submarine.svg');
const armyIcon = loadIcon('/icons/army.svg');
const navyIcon = loadIcon('/icons/navy.svg');
const airIcon = loadIcon('/icons/air.svg');
const radiationIcon = loadIcon('/icons/radiation.svg');
const satelliteIcon = loadIcon('/icons/satellite.svg');

const conventionalIconLookup: Record<ForceType, CanvasIcon> = {
  army: armyIcon,
  navy: navyIcon,
  air: airIcon,
};

const MISSILE_ICON_BASE_SCALE = 0.14;
const BOMBER_ICON_BASE_SCALE = 0.18;
const SUBMARINE_ICON_BASE_SCALE = 0.2;
const RADIATION_ICON_BASE_SCALE = 0.16;
const SATELLITE_ICON_BASE_SCALE = 0.18;
// easeInOutQuad now imported from @/lib/gameUtilityFunctions
const SATELLITE_ORBIT_RADIUS = 34;
const SATELLITE_ORBIT_TTL_MS = 3600000; // 1 hour - long enough for satellites to expire naturally via turn-based cleanup
const SATELLITE_ORBIT_SPEED = (Math.PI * 2) / 12000;
const MAX_FALLOUT_MARKS = 36;
const FALLOUT_GROWTH_RATE = 1.1; // units per second
const FALLOUT_DECAY_DELAY_MS = 12000;
const FALLOUT_DECAY_RATE = 0.04; // intensity per second once decay begins

const DIPLOMATIC_VICTORY_CRITERIA = {
  allianceRatio: 0.6,
  requiredDefcon: 4,
  peaceTurns: 4,
  influenceTarget: 120,
  nearProgressThreshold: 0.8,
  resetNearThreshold: 0.55
};

const layoutDensityOptions: LayoutDensityOption[] = [
  {
    id: 'expanded',
    label: 'Expanded',
    description: 'Full briefing overlay with maximum telemetry panels.',
  },
  {
    id: 'compact',
    label: 'Compact',
    description: 'Slimmed panels that free up more of the strategic map.',
  },
  {
    id: 'minimal',
    label: 'Minimal',
    description: 'Ultralight HUD that keeps essentials while spotlighting the globe.',
  },
];

const layoutDensityOrder: LayoutDensity[] = layoutDensityOptions.map((option) => option.id);

const THEME_SETTINGS: Record<ThemeId, ThemePalette> = {
  synthwave: {
    mapOutline: 'rgba(143,225,255,0.8)',
    grid: 'rgba(143,225,255,0.25)',
    radar: 'rgba(143,225,255,0.08)',
    ocean: 'rgba(40,100,220,0.6)',
    cloud: 'rgba(255,200,255,0.6)',
    mapFill: 'rgba(24,12,72,0.7)',
    mapFillWireframe: 'rgba(80,240,255,0.12)',
  },
  retro80s: {
    mapOutline: 'rgba(0,255,65,0.5)',
    grid: 'rgba(0,255,65,0.2)',
    radar: 'rgba(0,255,65,0.08)',
    ocean: 'rgba(30,70,160,0.65)',
    cloud: 'rgba(255,105,180,0.6)',
    mapFill: 'rgba(58,14,90,0.68)',
    mapFillWireframe: 'rgba(0,255,65,0.1)',
  },
  wargames: {
    mapOutline: 'rgba(0,255,0,0.4)',
    grid: 'rgba(0,255,0,0.1)',
    radar: 'rgba(0,255,0,0.05)',
    ocean: 'rgba(0,80,160,0.6)',
    cloud: 'rgba(150,150,150,0.6)',
    mapFill: 'rgba(8,48,18,0.58)',
    mapFillWireframe: 'rgba(0,255,0,0.1)',
  },
  nightmode: {
    mapOutline: 'rgba(102,204,255,0.5)',
    grid: 'rgba(102,204,255,0.18)',
    radar: 'rgba(102,204,255,0.07)',
    ocean: 'rgba(15,60,130,0.65)',
    cloud: 'rgba(160,200,240,0.45)',
    mapFill: 'rgba(10,30,66,0.68)',
    mapFillWireframe: 'rgba(102,204,255,0.1)',
  },
  highcontrast: {
    mapOutline: 'rgba(255,255,255,0.7)',
    grid: 'rgba(255,255,255,0.25)',
    radar: 'rgba(255,255,255,0.1)',
    ocean: 'rgba(20,80,160,0.7)',
    cloud: 'rgba(255,220,0,0.45)',
    mapFill: 'rgba(0,0,0,0.68)',
    mapFillWireframe: 'rgba(255,255,255,0.12)',
  },
  vectorclassic: {
    mapOutline: 'rgba(143,225,255,0.85)',
    grid: 'rgba(143,225,255,0.28)',
    radar: 'rgba(143,225,255,0.1)',
    ocean: 'rgba(10,45,110,0.7)',
    cloud: 'rgba(255,180,220,0.45)',
    mapFill: 'rgba(14,40,96,0.7)',
    mapFillWireframe: 'rgba(143,225,255,0.12)',
  },
  noradBunker: {
    mapOutline: 'rgba(120,180,80,0.6)',
    grid: 'rgba(255,191,0,0.2)',
    radar: 'rgba(120,180,80,0.08)',
    ocean: 'rgba(30,60,90,0.65)',
    cloud: 'rgba(140,140,130,0.5)',
    mapFill: 'rgba(50,55,50,0.68)',
    mapFillWireframe: 'rgba(120,180,80,0.12)',
  },
  krasniy: {
    mapOutline: 'rgba(220,40,40,0.7)',
    grid: 'rgba(255,215,0,0.25)',
    radar: 'rgba(220,40,40,0.1)',
    ocean: 'rgba(20,30,60,0.7)',
    cloud: 'rgba(180,60,60,0.55)',
    mapFill: 'rgba(60,15,15,0.7)',
    mapFillWireframe: 'rgba(220,40,40,0.15)',
  },
  defcon1: {
    mapOutline: 'rgba(255,30,30,0.85)',
    grid: 'rgba(255,255,255,0.3)',
    radar: 'rgba(255,30,30,0.15)',
    ocean: 'rgba(30,0,0,0.75)',
    cloud: 'rgba(255,100,100,0.6)',
    mapFill: 'rgba(80,10,10,0.75)',
    mapFillWireframe: 'rgba(255,30,30,0.18)',
  },
  strangelove: {
    mapOutline: 'rgba(0,255,0,0.45)',
    grid: 'rgba(200,200,200,0.2)',
    radar: 'rgba(0,255,0,0.06)',
    ocean: 'rgba(20,20,20,0.8)',
    cloud: 'rgba(160,160,160,0.55)',
    mapFill: 'rgba(30,30,30,0.75)',
    mapFillWireframe: 'rgba(0,255,0,0.12)',
  },
  holographic: {
    mapOutline: 'rgba(100,200,255,0.75)',
    grid: 'rgba(100,200,255,0.22)',
    radar: 'rgba(100,200,255,0.09)',
    ocean: 'rgba(5,25,45,0.7)',
    cloud: 'rgba(150,220,255,0.5)',
    mapFill: 'rgba(10,30,50,0.65)',
    mapFillWireframe: 'rgba(100,200,255,0.14)',
  }
};

const themeOptions: { id: ThemeId; label: string }[] = [
  { id: 'synthwave', label: 'Synthwave' },
  { id: 'wargames', label: 'WARGAMES' },
  { id: 'noradBunker', label: 'NORAD Bunker' },
  { id: 'krasniy', label: 'Красный' },
  { id: 'defcon1', label: 'DEFCON 1' },
  { id: 'strangelove', label: 'Strangelove' },
  { id: 'holographic', label: 'Holographic' }
];

let currentTheme: ThemeId = 'synthwave';
let currentMapStyle: MapVisualStyle = 'morphing';
let currentMapMode: MapMode = 'standard';
let currentMapModeData: MapModeOverlayData | null = null;
let selectedTargetRefId: string | null = null;
let uiUpdateCallback: (() => void) | null = null;
let gameLoopRunning = false; // Prevent multiple game loops
let isGameplayLoopEnabled = false;
let isAttractModeActive = false;
let globalRNG: SeededRandom | null = null; // Global RNG reference for use outside React component

const ENDGAME_REVEAL_MIN_DELAY_MS = 2500;
const ENDGAME_REVEAL_MAX_WAIT_MS = 12000;

// Global game state - now managed by GameStateManager (Phase 6 refactoring)
// Initialize GameStateManager (it has default state already)
// S now references the state from GameStateManager for backward compatibility
let S: LocalGameState = GameStateManager.getState();

// Expose S to window for hooks (needed by useFlashpoints to detect scenario)
if (typeof window !== 'undefined') {
  (window as any).S = S;
  console.log('[Game State] Exposed S to window at initialization. Scenario ID:', S.scenario?.id);
}

// Nations and deltas are now managed by GameStateManager
// Keep references for backward compatibility
let nations: LocalNation[] = GameStateManager.getNations();
let conventionalDeltas: ConventionalWarfareDelta[] = GameStateManager.getConventionalDeltas();
let suppressMultiplayerBroadcast = false;
let multiplayerPublisher: (() => void) | null = null;
let spyNetworkApi: ReturnType<typeof useSpyNetwork> | null = null;
let economicDepthApi: ReturnType<typeof useEconomicDepth> | null = null;
let militaryTemplatesApi: ReturnType<typeof useMilitaryTemplates> | null = null;
let supplySystemApi: ReturnType<typeof useSupplySystem> | null = null;
let triggerNationsUpdate: (() => void) | null = null;

type OverlayTone = 'info' | 'warning' | 'catastrophe';
type OverlayNotification = { text: string; expiresAt: number; tone?: OverlayTone; sound?: string };
type OverlayListener = (message: OverlayNotification | null) => void;
let overlayListener: OverlayListener | null = null;
let overlayTimeout: ReturnType<typeof setTimeout> | null = null;

type DefconAlertListener = (previousDefcon: number, newDefcon: number) => void;
const defconAlertListeners = new Set<DefconAlertListener>();

function subscribeToDefconOne(listener: DefconAlertListener): () => void {
  defconAlertListeners.add(listener);
  return () => {
    defconAlertListeners.delete(listener);
  };
}

function notifyDefconAlertListeners(previousDefcon: number, newDefcon: number) {
  defconAlertListeners.forEach((listener) => {
    try {
      listener(previousDefcon, newDefcon);
    } catch (error) {
      // Listener failures should not interrupt DEFCON handling
      console.error('Defcon alert listener failed', error);
    }
  });
}

function handleDefconChange(
  delta: number,
  reason: string,
  triggeredBy: 'player' | 'ai' | 'event' | 'system',
  callbacks?: DefconChangeCallbacks
): boolean {
  const previousDefcon = GameStateManager.getDefcon();
  const didChange = baseHandleDefconChange(delta, reason, triggeredBy, callbacks);

  if (didChange) {
    const newDefcon = GameStateManager.getDefcon();

    if (newDefcon === 1 && previousDefcon !== 1) {
      notifyDefconAlertListeners(previousDefcon, newDefcon);
    }
  }

  return didChange;
}

function registerOverlayListener(listener: OverlayListener | null) {
  overlayListener = listener;
}

function emitOverlayMessage(text: string, ttl: number, options?: { tone?: OverlayTone; sound?: string }) {
  S.overlay = { text, ttl, tone: options?.tone, sound: options?.sound };

  if (overlayTimeout) {
    clearTimeout(overlayTimeout);
    overlayTimeout = null;
  }

  overlayListener?.({ text, expiresAt: Date.now() + ttl, tone: options?.tone, sound: options?.sound });
  overlayTimeout = setTimeout(() => {
    overlayListener?.(null);
    overlayTimeout = null;
  }, ttl);

  if (options?.sound) {
    try {
      import('@/utils/audioManager')
        .then(({ audioManager }) => {
          audioManager.playCritical(options.sound!);
        })
        .catch(() => {
          /* ignore audio load failures */
        });
    } catch (error) {
      // Ignore audio import errors in non-browser contexts
    }
  }
}

type PhaseTransitionListener = (active: boolean) => void;
let phaseTransitionListener: PhaseTransitionListener | null = null;

function registerPhaseTransitionListener(listener: PhaseTransitionListener | null) {
  phaseTransitionListener = listener;
}

function notifyPhaseTransition(active: boolean) {
  phaseTransitionListener?.(active);
}

// Day/night cycle update listener for smooth texture blending
type DayNightUpdateListener = (targetBlend: number) => void;
let dayNightUpdateListener: DayNightUpdateListener | null = null;

function registerDayNightUpdateListener(listener: DayNightUpdateListener | null) {
  dayNightUpdateListener = listener;
}

function notifyDayNightUpdate(turn: number) {
  // Calculate blend based on turn (4-round cycle: day -> night -> day)
  // Rounds 1-2: Day to Night (blend 0 -> 1)
  // Rounds 3-4: Night to Day (blend 1 -> 0)
  const turnInCycle = ((turn - 1) % 4); // 0-3
  let targetBlend: number;

  if (turnInCycle < 2) {
    // First half of cycle: fade to night (0 -> 0.5 -> 1)
    targetBlend = turnInCycle / 2 + 0.5 / 2; // 0.25 at turn 1, 0.75 at turn 2
    targetBlend = turnInCycle === 0 ? 0 : turnInCycle === 1 ? 0.5 : 1;
  } else {
    // Second half of cycle: fade to day (1 -> 0.5 -> 0)
    targetBlend = turnInCycle === 2 ? 0.5 : 0;
  }

  dayNightUpdateListener?.(targetBlend);
}

const setMultiplayerPublisher = (publisher: (() => void) | null) => {
  multiplayerPublisher = publisher;
};

const broadcastMultiplayerState = () => {
  if (!suppressMultiplayerBroadcast && multiplayerPublisher) {
    multiplayerPublisher();
  }
};

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let startCanvas: HTMLCanvasElement;
let startCtx: CanvasRenderingContext2D;
let W = 1600, H = 900;
let globeProjector: ProjectorFn | null = null;
let globePicker: PickerFn | null = null;
let lastFxTimestamp: number | null = null;

// Camera system
const cam = { x: 0, y: 0, zoom: 1, targetZoom: 1 };

// World data
let worldData: any = null;
let worldCountries: any = null;
let worldLoadPromise: Promise<void> | null = null;

type SuperstateGeometryConfig = {
  isoA3?: string[];
  territoryIds?: string[];
  aliases?: string[];
};

const SUPERSTATE_GEOMETRY_CONFIG: Record<string, SuperstateGeometryConfig> = {
  EURASIA: {
    isoA3: [
      'RUS',
      'UKR',
      'BLR',
      'KAZ',
      'ARM',
      'AZE',
      'GEO',
      'MDA',
      'POL',
      'DEU',
      'FRA',
      'ESP',
      'ITA',
      'ROU',
      'BGR',
      'SVK',
      'CZE',
      'HUN',
      'SWE',
      'NOR',
      'FIN',
      'EST',
      'LVA',
      'LTU',
    ],
    territoryIds: ['eastern_bloc'],
    aliases: ['ai_0'],
  },
  EASTASIA: {
    isoA3: [
      'CHN',
      'MNG',
      'JPN',
      'KOR',
      'PRK',
      'VNM',
      'THA',
      'KHM',
      'LAO',
      'MMR',
      'TWN',
      'PHL',
      'MYS',
      'IDN',
    ],
    territoryIds: ['indo_pacific'],
    aliases: ['ai_1'],
  },
  SOUTHAM: {
    isoA3: [
      'BRA',
      'ARG',
      'CHL',
      'PER',
      'COL',
      'VEN',
      'ECU',
      'BOL',
      'PRY',
      'URY',
      'GUY',
      'SUR',
      'GUF',
    ],
    territoryIds: ['southern_front'],
    aliases: ['ai_2'],
  },
  AFRICA: {
    isoA3: [
      'DZA',
      'MAR',
      'TUN',
      'LBY',
      'EGY',
      'SDN',
      'SSD',
      'ETH',
      'SOM',
      'DJI',
      'ERI',
      'KEN',
      'UGA',
      'TZA',
      'RWA',
      'BDI',
      'COD',
      'COG',
      'GAB',
      'GNQ',
      'CAF',
      'CMR',
      'NGA',
      'NER',
      'MLI',
      'BFA',
      'SEN',
      'GMB',
      'GIN',
      'SLE',
      'LBR',
      'CIV',
      'GHA',
      'TGO',
      'BEN',
      'GNB',
      'CPV',
      'STP',
      'AGO',
      'ZMB',
      'ZWE',
      'NAM',
      'BWA',
      'ZAF',
      'LSO',
      'SWZ',
      'MWI',
      'MOZ',
      'MDG',
      'COM',
      'SYC',
      'MUS',
      'TCD',
      'MRT',
    ],
    territoryIds: ['equatorial_belt'],
    aliases: ['ai_3'],
  },
};

// resolvePublicAssetPath moved to @/lib/renderingUtils

const FLAT_REALISTIC_DAY_TEXTURE_URL = resolvePublicAssetPath('textures/earth_day_flat.jpg');
const FLAT_REALISTIC_NIGHT_TEXTURE_URL = resolvePublicAssetPath('textures/earth_night_flat.jpg');

let flatRealisticDayTexture: HTMLImageElement | null = null;
let flatRealisticNightTexture: HTMLImageElement | null = null;
let flatRealisticDayTexturePromise: Promise<HTMLImageElement | null> | null = null;
let flatRealisticNightTexturePromise: Promise<HTMLImageElement | null> | null = null;
let flatRealisticDayAbortController: AbortController | null = null;
let flatRealisticNightAbortController: AbortController | null = null;

function preloadFlatRealisticTexture(isDay: boolean = true): Promise<HTMLImageElement | null> {
  const url = isDay ? FLAT_REALISTIC_DAY_TEXTURE_URL : FLAT_REALISTIC_NIGHT_TEXTURE_URL;
  const texture = isDay ? flatRealisticDayTexture : flatRealisticNightTexture;
  const promise = isDay ? flatRealisticDayTexturePromise : flatRealisticNightTexturePromise;

  if (texture) {
    return Promise.resolve(texture);
  }

  if (promise) {
    return promise;
  }

  if (typeof window === 'undefined' || typeof Image === 'undefined') {
    return Promise.resolve(null);
  }

  // Cancel any previous load for this texture type
  const prevController = isDay ? flatRealisticDayAbortController : flatRealisticNightAbortController;
  if (prevController) {
    prevController.abort();
  }

  // Create new abort controller for this load
  const abortController = new AbortController();
  if (isDay) {
    flatRealisticDayAbortController = abortController;
  } else {
    flatRealisticNightAbortController = abortController;
  }

  const newPromise = new Promise<HTMLImageElement | null>((resolve, reject) => {
    const image = new Image();
    let isAborted = false;

    const cleanup = () => {
      if (isDay && flatRealisticDayAbortController === abortController) {
        flatRealisticDayAbortController = null;
      } else if (!isDay && flatRealisticNightAbortController === abortController) {
        flatRealisticNightAbortController = null;
      }
    };

    abortController.signal.addEventListener('abort', () => {
      isAborted = true;
      cleanup();
      reject(new Error('Texture load aborted'));
    });

    image.onload = () => {
      if (isAborted) return;

      if (isDay) {
        flatRealisticDayTexture = image;
      } else {
        flatRealisticNightTexture = image;
      }
      cleanup();
      resolve(image);
    };

    image.onerror = (event) => {
      if (isAborted) return;

      if (isDay) {
        flatRealisticDayTexturePromise = null;
      } else {
        flatRealisticNightTexturePromise = null;
      }
      cleanup();
      reject(
        event instanceof ErrorEvent
          ? event.error ?? new Error('Failed to load flat map texture')
          : new Error('Failed to load flat map texture'),
      );
    };

    image.src = url;
  });

  if (isDay) {
    flatRealisticDayTexturePromise = newPromise;
  } else {
    flatRealisticNightTexturePromise = newPromise;
  }

  return newPromise.catch(error => {
    // Texture load failed or aborted - fallback to standard rendering
    return null;
  });
}

function getFlatRealisticTextureState(blendOverride?: number) {
  // Calculate blend based on current turn (4-round cycle: day -> night -> day)
  // Rounds 1-2: Day to Night (blend 0 -> 1)
  // Rounds 3-4: Night to Day (blend 1 -> 0)
  const turnInCycle = ((S.turn - 1) % 4); // 0-3
  let calculatedBlend: number;
  
  if (turnInCycle < 2) {
    // First half of cycle: fade to night (0 -> 1)
    calculatedBlend = turnInCycle / 2;
  } else {
    // Second half of cycle: fade to day (1 -> 0)
    calculatedBlend = 1 - (turnInCycle - 2) / 2;
  }
  
  const blendSource = typeof blendOverride === 'number' ? blendOverride : calculatedBlend;
  const blend = Math.min(Math.max(blendSource, 0), 1);

  return {
    dayTexture: flatRealisticDayTexture,
    nightTexture: flatRealisticNightTexture,
    blend,
  };
}

// Leaders configuration
type LeaderScenarioTag = 'default' | 'cubanCrisis' | 'greatOldOnes';

interface LeaderDefinition {
  name: string;
  ai: string;
  color: string;
  isHistoricalCubanCrisis?: boolean;
  isLovecraftian?: boolean;
  scenarios?: LeaderScenarioTag[];
}

const leaders: LeaderDefinition[] = [
  // Historical leaders (for Cuban Crisis scenario)
  { name: 'John F. Kennedy', ai: 'balanced', color: '#0047AB', isHistoricalCubanCrisis: true, scenarios: ['cubanCrisis'] }, // US President, balanced approach during crisis
  { name: 'Nikita Khrushchev', ai: 'aggressive', color: '#CC0000', isHistoricalCubanCrisis: true, scenarios: ['cubanCrisis'] }, // Soviet Premier, aggressive but pragmatic
  { name: 'Fidel Castro', ai: 'aggressive', color: '#CE1126', isHistoricalCubanCrisis: true, scenarios: ['cubanCrisis'] }, // Cuban leader, revolutionary and aggressive
  
  // Cold War Historical Leaders
  { name: 'Ronald Reagan', ai: 'aggressive', color: '#C8102E', scenarios: ['default'] }, // 40th US President, aggressive Cold Warrior
  { name: 'Mikhail Gorbachev', ai: 'balanced', color: '#DA291C', scenarios: ['default'] }, // Soviet leader, reformist
  { name: 'Margaret Thatcher', ai: 'defensive', color: '#0087DC', scenarios: ['default'] }, // UK Prime Minister, Iron Lady
  { name: 'Mao Zedong', ai: 'aggressive', color: '#DE2910', scenarios: ['default'] }, // Chinese Communist leader
  { name: 'Charles de Gaulle', ai: 'defensive', color: '#002395', scenarios: ['default'] }, // French President, nationalist
  { name: 'Indira Gandhi', ai: 'balanced', color: '#FF9933', scenarios: ['default'] }, // Indian Prime Minister
  { name: 'Leonid Brezhnev', ai: 'defensive', color: '#DA291C', scenarios: ['default'] }, // Soviet General Secretary
  { name: 'Richard Nixon', ai: 'balanced', color: '#0047AB', scenarios: ['default'] }, // 37th US President
  { name: 'Jimmy Carter', ai: 'balanced', color: '#0047AB', scenarios: ['default'] }, // 39th US President, peace-focused
  { name: 'Dwight D. Eisenhower', ai: 'balanced', color: '#0047AB', scenarios: ['default'] }, // 34th US President, general
  { name: 'Lyndon B. Johnson', ai: 'aggressive', color: '#0047AB', scenarios: ['default'] }, // 36th US President
  { name: 'Gerald Ford', ai: 'balanced', color: '#0047AB', scenarios: ['default'] }, // 38th US President
  { name: 'Winston Churchill', ai: 'defensive', color: '#00247D', scenarios: ['default'] }, // UK Prime Minister, steadfast defender
  { name: 'Harry S. Truman', ai: 'balanced', color: '#3C3B6E', scenarios: ['default'] }, // US President, Truman Doctrine
  { name: 'Joseph Stalin', ai: 'aggressive', color: '#CC0000', scenarios: ['default'] }, // Soviet Premier, hardline expansionist
  { name: 'Pierre Trudeau', ai: 'balanced', color: '#FF0000', scenarios: ['default'] }, // Canadian Prime Minister, charismatic centrist
  { name: 'Zhou Enlai', ai: 'balanced', color: '#DE2910', scenarios: ['default'] }, // Chinese Premier, master diplomat
  { name: 'Deng Xiaoping', ai: 'defensive', color: '#D62828', scenarios: ['default'] }, // Chinese leader, pragmatic reformer
  { name: 'Ho Chi Minh', ai: 'aggressive', color: '#DA251D', scenarios: ['default'] }, // Vietnamese revolutionary leader
  { name: 'Josip Broz Tito', ai: 'balanced', color: '#0C4076', scenarios: ['default'] }, // Yugoslav president, non-aligned strategist
  { name: 'Gamal Abdel Nasser', ai: 'balanced', color: '#CE1126', scenarios: ['default'] }, // Egyptian president, pan-Arab champion
  { name: 'Jawaharlal Nehru', ai: 'defensive', color: '#FF9933', scenarios: ['default'] }, // Indian Prime Minister, non-aligned architect
  { name: 'Konrad Adenauer', ai: 'defensive', color: '#000000', scenarios: ['default'] }, // West German chancellor, pro-West builder
  { name: 'Willy Brandt', ai: 'balanced', color: '#00008B', scenarios: ['default'] }, // West German chancellor, Ostpolitik pioneer
  { name: 'Helmut Kohl', ai: 'defensive', color: '#1C1C1C', scenarios: ['default'] }, // German chancellor, unification steward
  { name: 'François Mitterrand', ai: 'balanced', color: '#0055A4', scenarios: ['default'] }, // French president, European integrationist
  { name: 'Sukarno', ai: 'aggressive', color: '#E30A17', scenarios: ['default'] }, // Indonesian president, revolutionary nationalist

  // Lovecraftian leaders (for Great Old Ones scenario)
  { name: 'Cthulhu', ai: 'aggressive', color: '#004d00', isLovecraftian: true, scenarios: ['greatOldOnes'] }, // The Great Dreamer, aggressive domination
  { name: 'Azathoth', ai: 'chaotic', color: '#1a0033', isLovecraftian: true, scenarios: ['greatOldOnes'] }, // The Blind Idiot God, chaotic and unpredictable
  { name: 'Nyarlathotep', ai: 'trickster', color: '#330033', isLovecraftian: true, scenarios: ['greatOldOnes'] }, // The Crawling Chaos, deceptive and manipulative
  { name: 'Hastur', ai: 'balanced', color: '#4d1a00', isLovecraftian: true, scenarios: ['greatOldOnes'] }, // The Unspeakable One, balanced corruption
  { name: 'Shub-Niggurath', ai: 'aggressive', color: '#003300', isLovecraftian: true, scenarios: ['greatOldOnes'] }, // The Black Goat, aggressive expansion
  { name: 'Yog-Sothoth', ai: 'defensive', color: '#1a1a33', isLovecraftian: true, scenarios: ['greatOldOnes'] }, // The Gate and the Key, strategic defense
  
  // Parody leaders (for Nuclear War: Last Man Standing campaign)
  { name: 'Ronnie Raygun', ai: 'aggressive', color: '#ff5555', scenarios: ['nuclearWar'] },
  { name: 'Tricky Dick', ai: 'defensive', color: '#5599ff', scenarios: ['nuclearWar'] },
  { name: 'Jimi Farmer', ai: 'balanced', color: '#55ff99', scenarios: ['nuclearWar'] },
  { name: 'E. Musk Rat', ai: 'chaotic', color: '#ff55ff', scenarios: ['nuclearWar'] },
  { name: 'Donnie Trumpf', ai: 'aggressive', color: '#ffaa55', scenarios: ['nuclearWar'] },
  { name: 'Atom Hus-Bomb', ai: 'aggressive', color: '#ff3333', scenarios: ['nuclearWar'] },
  { name: 'Krazy Re-Entry', ai: 'chaotic', color: '#cc44ff', scenarios: ['nuclearWar'] },
  { name: 'Odd\'n Wild Card', ai: 'trickster', color: '#44ffcc', scenarios: ['nuclearWar'] },
  { name: 'Oil-Stain Lint-Off', ai: 'balanced', color: '#88ff88', scenarios: ['nuclearWar'] },
  { name: 'Ruin Annihilator', ai: 'aggressive', color: '#ff6600', scenarios: ['nuclearWar']}
];

// Leader-Specific Passive Bonuses (FASE 2.1)
// Each leader gets 2 unique passive bonuses for strategic diversity
interface LeaderBonus {
  name: string;
  description: string;
  effect: (nation: Nation) => void;
}

const leaderBonuses: Record<string, LeaderBonus[]> = {
  // Historical Cuban Crisis Leaders
  'John F. Kennedy': [
    {
      name: '📜 Diplomatic Finesse',
      description: '+15% to peace treaty acceptance, +1 DIP per turn',
      effect: (nation) => {
        // @ts-expect-error - Legacy diplomacy influence system
        nation.diplomaticInfluence = nation.diplomaticInfluence || { current: 50, capacity: 200, generation: 3 };
        // @ts-expect-error - Legacy diplomacy influence system
        nation.diplomaticInfluence.generation = (nation.diplomaticInfluence.generation || 3) + 1;
      }
    },
    {
      name: '🎯 Precision Warfare',
      description: '+10% missile accuracy, -15% collateral damage',
      effect: (nation) => {
        nation.enemyMissileAccuracyReduction = (nation.enemyMissileAccuracyReduction || 0) - 0.10; // Enemies have 10% less accuracy against JFK
      }
    }
  ],
  'Nikita Khrushchev': [
    {
      name: '⚔️ Iron Fist',
      description: '-10% missile costs, +15% military intimidation',
      effect: (nation) => {
        nation.buildCostReduction = (nation.buildCostReduction || 0) + 0.10;
      }
    },
    {
      name: '🏭 Soviet Industry',
      description: '+15% production per turn',
      effect: (nation) => {
        nation.productionMultiplier = (nation.productionMultiplier || 1.0) + 0.15;
      }
    }
  ],
  'Fidel Castro': [
    {
      name: '🔥 Revolutionary Fervor',
      description: '+20% population morale, immunity to culture bombs',
      effect: (nation) => {
        nation.morale = Math.min(100, nation.morale + 20);
      }
    },
    {
      name: '🛡️ Guerrilla Defense',
      description: '+25% defense effectiveness',
      effect: (nation) => {
        const currentDefense = nation.defense ?? 0;
        nation.defense = clampDefenseValue(Math.floor(currentDefense * 1.25));
      }
    }
  ],

  // Lovecraftian Great Old Ones Leaders
  'Cthulhu': [
    {
      name: '🌊 Deep Sea Dominion',
      description: '+20% summoning power, -15% summoning backlash',
      effect: (nation) => {
        // Applied to Great Old Ones state in specialized handler
        nation.morale = Math.min(100, nation.morale + 10); // Cultists more devoted
      }
    },
    {
      name: '😱 Madness Aura',
      description: '+30% sanity harvest from terror',
      effect: (nation) => {
        nation.intel = Math.floor(nation.intel * 1.1); // Bonus intel from insanity
      }
    }
  ],
  'Azathoth': [
    {
      name: '🌀 Chaotic Flux',
      description: 'Random bonus each turn (10-30% to any stat)',
      effect: (nation) => {
        // Applied dynamically each turn - placeholder marker
        nation.morale = Math.min(100, nation.morale + 5);
      }
    },
    {
      name: '🎲 Unpredictable',
      description: '-20% enemy prediction accuracy',
      effect: (nation) => {
        nation.sabotageDetectionReduction = (nation.sabotageDetectionReduction || 0) + 0.20;
      }
    }
  ],
  'Nyarlathotep': [
    {
      name: '🎭 Master of Masks',
      description: '+40% infiltration speed, -25% detection',
      effect: (nation) => {
        nation.sabotageDetectionReduction = (nation.sabotageDetectionReduction || 0) + 0.25;
      }
    },
    {
      name: '🗣️ Whispering Shadows',
      description: '+50% memetic warfare effectiveness',
      effect: (nation) => {
        nation.memeWaveEffectiveness = (nation.memeWaveEffectiveness || 1.0) + 0.50;
      }
    }
  ],
  'Hastur': [
    {
      name: '🌫️ Yellow Sign',
      description: '+25% corruption spread, +15% willing conversions',
      effect: (nation) => {
        nation.stolenPopConversionRate = (nation.stolenPopConversionRate || 1.0) + 0.15;
      }
    },
    {
      name: '🤐 Unspeakable Presence',
      description: '-30% veil damage from operations',
      effect: (nation) => {
        nation.morale = Math.min(100, nation.morale + 5);
      }
    }
  ],
  'Shub-Niggurath': [
    {
      name: '🐐 Spawn of the Black Goat',
      description: '+30% entity spawning rate, +20% entity strength',
      effect: (nation) => {
        nation.unitAttackBonus = (nation.unitAttackBonus || 0) + 0.20;
      }
    },
    {
      name: '🌿 Primal Growth',
      description: '+20% population growth in corrupted areas',
      effect: (nation) => {
        nation.immigrationBonus = (nation.immigrationBonus || 0) + 0.20;
      }
    }
  ],
  'Yog-Sothoth': [
    {
      name: '🔮 The Gate and the Key',
      description: '+30% research speed, auto-reveal enemy research',
      effect: (nation) => {
        nation.autoRevealEnemyResearch = true;
      }
    },
    {
      name: '⏳ Temporal Manipulation',
      description: '+1 action per turn',
      effect: (nation) => {
        // Applied during turn start
      }
    }
  ],

  // Parody Leaders
  'Ronnie Raygun': [
    {
      name: '🎬 Star Wars Program',
      description: '+30% ABM defense effectiveness',
      effect: (nation) => {
        const currentDefense = nation.defense ?? 0;
        nation.defense = clampDefenseValue(Math.floor(currentDefense * 1.30));
      }
    },
    {
      name: '💰 Trickle Down Economics',
      description: '+20% production from high morale',
      effect: (nation) => {
        if (nation.morale > 70) {
          nation.productionMultiplier = (nation.productionMultiplier || 1.0) + 0.20;
        }
      }
    }
  ],
  'Tricky Dick': [
    {
      name: '🕵️ Watergate Skills',
      description: '+35% intelligence gathering, +20% cover ops duration',
      effect: (nation) => {
        nation.intel = Math.floor(nation.intel * 1.15);
      }
    },
    {
      name: '🤝 Détente Master',
      description: '+20% to non-aggression pact acceptance',
      effect: (nation) => {
        nation.morale = Math.min(100, nation.morale + 10);
      }
    }
  ],
  'Jimi Farmer': [
    {
      name: '🌾 Agricultural Surplus',
      description: '+25% population capacity, faster recovery',
      effect: (nation) => {
        nation.immigrationBonus = (nation.immigrationBonus || 0) + 0.25;
      }
    },
    {
      name: '☮️ Peace Dividend',
      description: '+15% production during peacetime',
      effect: (nation) => {
        nation.productionMultiplier = (nation.productionMultiplier || 1.0) + 0.10;
      }
    }
  ],
  'E. Musk Rat': [
    {
      name: '🚀 SpaceX Advantage',
      description: '+50% satellite deployment speed, +2 orbital slots',
      effect: (nation) => {
        nation.maxSatellites = (nation.maxSatellites || 3) + 2;
      }
    },
    {
      name: '🤖 AI Warfare',
      description: '+40% cyber offense, +25% cyber defense',
      effect: (nation) => {
        if (nation.cyber) {
          nation.cyber.offense = Math.floor(nation.cyber.offense * 1.40);
          nation.cyber.defense = Math.floor(nation.cyber.defense * 1.25);
        }
      }
    }
  ],
  'Donnie Trumpf': [
    {
      name: '🏗️ The Wall',
      description: 'Borders always closed, +30% immigration control',
      effect: (nation) => {
        nation.bordersClosedTurns = 999; // Permanently closed
      }
    },
    {
      name: '💬 Twitter Diplomacy',
      description: '+25% culture bomb effectiveness, -10% diplomatic costs',
      effect: (nation) => {
        nation.cultureBombCostReduction = (nation.cultureBombCostReduction || 0) + 0.25;
      }
    }
  ],
  'Atom Hus-Bomb': [
    {
      name: '☢️ Nuclear Zealot',
      description: '+20% warhead yield, -20% nuclear winter impact on self',
      effect: (nation) => {
        // Warhead bonus applied during launch calculations
        nation.morale = Math.min(100, nation.morale + 10);
      }
    },
    {
      name: '⚡ First Strike Doctrine',
      description: 'Missiles launch 25% faster',
      effect: (nation) => {
        nation.production = Math.floor(nation.production * 1.10);
      }
    }
  ],
  'Krazy Re-Entry': [
    {
      name: '🎪 Chaos Theory',
      description: 'Random events 30% more likely, +20% to all randomness',
      effect: (nation) => {
        nation.morale = Math.min(100, nation.morale + 15);
      }
    },
    {
      name: '🌪️ Unpredictable Madness',
      description: 'AI cannot accurately predict actions',
      effect: (nation) => {
        nation.sabotageDetectionReduction = (nation.sabotageDetectionReduction || 0) + 0.30;
      }
    }
  ],
  'Odd\'n Wild Card': [
    {
      name: '🃏 Trickster\'s Gambit',
      description: '+30% false intel generation, +25% deception success',
      effect: (nation) => {
        nation.memeWaveEffectiveness = (nation.memeWaveEffectiveness || 1.0) + 0.30;
      }
    },
    {
      name: '🎰 High Stakes',
      description: 'Double or nothing: +50% gains OR -25% losses randomly',
      effect: (nation) => {
        if (Math.random() > 0.5) {
          nation.productionMultiplier = (nation.productionMultiplier || 1.0) + 0.25;
        }
      }
    }
  ],
  'Oil-Stain Lint-Off': [
    {
      name: '🛢️ Petro-State',
      description: '+40% uranium generation, +20% production',
      effect: (nation) => {
        nation.uraniumPerTurn = (nation.uraniumPerTurn || 2) + 1;
        nation.productionMultiplier = (nation.productionMultiplier || 1.0) + 0.20;
      }
    },
    {
      name: '💼 Oligarch Network',
      description: '+25% intel from economic espionage',
      effect: (nation) => {
        nation.intel = Math.floor(nation.intel * 1.15);
      }
    }
  ],
  'Ruin Annihilator': [
    {
      name: '💀 Scorched Earth',
      description: '+35% damage to all targets, +20% to radiation zones',
      effect: (nation) => {
        nation.unitAttackBonus = (nation.unitAttackBonus || 0) + 0.35;
      }
    },
    {
      name: '🔥 Apocalypse Doctrine',
      description: 'Immune to morale penalties, thrives in chaos',
      effect: (nation) => {
        nation.morale = 100; // Always maximum morale
      }
    }
  ]
};

/**
 * Apply leader-specific bonuses to a nation
 * Called during game initialization
 */
// Wrapper function - delegates to extracted module
function applyLeaderBonuses(nation: Nation, leaderName: string): void {
  return applyLeaderBonusesExtracted(nation, leaderName);
}

// Doctrines configuration
const doctrines = {
  mad: {
    name: 'MUTUAL ASSURED DESTRUCTION',
    desc: 'Total retaliation doctrine',
    effects: '+2 missiles at start, -1 defense'
  },
  defense: {
    name: 'STRATEGIC DEFENSE',
    desc: 'Focus on protection systems',
    effects: '+3 defense at start, -1 missile'
  },
  firstStrike: {
    name: 'FIRST STRIKE',
    desc: 'Preemptive attack capability',
    effects: '+1 100MT warhead'
  },
  detente: {
    name: 'DÉTENTE',
    desc: 'Diplomatic engagement',
    effects: '+10 intel, +2 production, peaceful start'
  }
};

type DoctrineKey = keyof typeof doctrines;

// Wrapper function - delegates to extracted module
function applyDoctrineEffects(nation: Nation, doctrineKey?: DoctrineKey) {
  return applyDoctrineEffectsExtracted(nation, doctrineKey);
}

// Wrapper function - delegates to extracted module
function mapAbilityCategoryToNewsCategory(category: string): NewsItem['category'] {
  return mapAbilityCategoryToNewsCategoryExtracted(category);
}

// Game constants (COSTS, RESEARCH_TREE, RESEARCH_LOOKUP, WARHEAD_YIELD_TO_ID, etc.)
// now imported from @/lib/gameConstants (Phase 7 refactoring)

// ModalContentValue type now imported from @/hooks/game/useModalManager (Phase 7 refactoring)

// PlayerManager class now imported from @/state (Phase 6 refactoring)

// DoomsdayClock now imported from @/state (Phase 6 refactoring)

// Audio System
const MUSIC_TRACKS = [
  { id: 'vector-command', title: 'Vector Command Briefing', file: resolvePublicAssetPath('Muzak/vector-command.mp3') },
  { id: 'night-operations', title: 'Night Operations', file: resolvePublicAssetPath('Muzak/night-operations.mp3') },
  { id: 'diplomatic-channel', title: 'Diplomatic Channel', file: resolvePublicAssetPath('Muzak/diplomatic-channel.mp3') },
  { id: 'tactical-escalation', title: 'Tactical Escalation', file: resolvePublicAssetPath('Muzak/tactical-escalation.mp3') }
] as const;
type MusicTrack = (typeof MUSIC_TRACKS)[number];
type MusicTrackId = MusicTrack['id'];

const TRACK_METADATA: Record<MusicTrackId, MusicTrack> = MUSIC_TRACKS.reduce(
  (acc, track) => {
    acc[track.id] = track;
    return acc;
  },
  {} as Record<MusicTrackId, MusicTrack>
);

const AMBIENT_CLIPS = [
  { id: 'defcon1-siren', title: 'DEFCON 1 Critical Siren', file: resolvePublicAssetPath('sfx/defcon1-siren.mp3') },
  { id: 'defcon2-siren', title: 'DEFCON 2 Standby Siren', file: resolvePublicAssetPath('sfx/defcon2-siren.mp3') },
] as const;

type AmbientClip = (typeof AMBIENT_CLIPS)[number];
type AmbientClipId = AmbientClip['id'];

const AMBIENT_METADATA: Record<AmbientClipId, AmbientClip> = AMBIENT_CLIPS.reduce(
  (acc, clip) => {
    acc[clip.id] = clip;
    return acc;
  },
  {} as Record<AmbientClipId, AmbientClip>
);

const AudioSys = {
  audioContext: null as AudioContext | null,
  musicEnabled: true,
  sfxEnabled: true,
  musicVolume: 0.3,
  musicGainNode: null as GainNode | null,
  musicSource: null as AudioBufferSourceNode | null,
  musicCache: new Map<string, AudioBuffer>(),
  trackPromises: new Map<string, Promise<AudioBuffer>>(),
  preferredTrackId: null as MusicTrackId | null,
  pendingTrackId: null as MusicTrackId | null,
  currentTrackId: null as MusicTrackId | null,
  userInteractionPrimed: false,
  trackListeners: new Set<(trackId: MusicTrackId | null) => void>(),
  audioSupported: true,
  TRACK_METADATA,
  AMBIENT_METADATA,
  ambientEnabled: true,
  ambientVolume: 0.45,
  ambientGainNode: null as GainNode | null,
  ambientSource: null as AudioBufferSourceNode | null,
  ambientClipId: null as AmbientClipId | null,
  ambientDesiredClipId: null as AmbientClipId | null,
  ambientCache: new Map<AmbientClipId, AudioBuffer>(),
  ambientPromises: new Map<AmbientClipId, Promise<AudioBuffer>>(),

  init() {
    if (typeof window === 'undefined') return;
    if (!this.audioSupported) return;
    if (!this.audioContext) {
      try {
        const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextCtor) {
          throw new Error('Web Audio API is not available in this browser');
        }
        this.audioContext = new AudioContextCtor();
      } catch (error) {
        console.warn('Audio context initialization failed; disabling audio features.', error);
        this.audioSupported = false;
        this.sfxEnabled = false;
      }
    }
  },

  ensureMusicGain() {
    if (!this.audioContext) this.init();
    if (!this.audioContext) return null;
    if (!this.musicGainNode) {
      this.musicGainNode = this.audioContext.createGain();
      this.musicGainNode.gain.value = this.musicVolume;
      this.musicGainNode.connect(this.audioContext.destination);
    }
    return this.musicGainNode;
  },

  ensureAmbientGain() {
    if (!this.audioContext) this.init();
    if (!this.audioContext) return null;
    if (!this.ambientGainNode) {
      this.ambientGainNode = this.audioContext.createGain();
      this.ambientGainNode.gain.value = this.ambientVolume;
      this.ambientGainNode.connect(this.audioContext.destination);
    }
    return this.ambientGainNode;
  },

  async resumeContext() {
    if (!this.audioContext) this.init();
    if (!this.audioContext) return;
    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (error) {
        // Audio resume failed - expected in some environments
      }
    }
  },

  async loadMusicTrack(trackId: MusicTrackId) {
    if (this.musicCache.has(trackId)) {
      return this.musicCache.get(trackId)!;
    }
    if (this.trackPromises.has(trackId)) {
      return this.trackPromises.get(trackId)!;
    }

    const track = MUSIC_TRACKS.find(entry => entry.id === trackId);
    if (!track) {
      throw new Error(`Unknown track ${trackId}`);
    }

    const loadPromise = (async () => {
      try {
        const response = await fetch(track.file);
        if (!response.ok) {
          throw new Error(`Failed to load track: ${response.status} ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        if (!this.audioContext) this.init();
        if (!this.audioContext) throw new Error('Audio context unavailable');
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer.slice(0));
        this.musicCache.set(trackId, audioBuffer);
        return audioBuffer;
      } finally {
        this.trackPromises.delete(trackId);
      }
    })();

    this.trackPromises.set(trackId, loadPromise);
    return loadPromise;
  },

  async loadAmbientClip(clipId: AmbientClipId) {
    if (this.ambientCache.has(clipId)) {
      return this.ambientCache.get(clipId)!;
    }
    if (this.ambientPromises.has(clipId)) {
      return this.ambientPromises.get(clipId)!;
    }

    const clip = AMBIENT_METADATA[clipId];
    if (!clip) {
      throw new Error(`Unknown ambient clip ${clipId}`);
    }

    const loadPromise = (async () => {
      try {
        const response = await fetch(clip.file);
        if (!response.ok) {
          throw new Error(`Failed to load ambient clip: ${response.status} ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        if (!this.audioContext) this.init();
        if (!this.audioContext) throw new Error('Audio context unavailable');
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer.slice(0));
        this.ambientCache.set(clipId, audioBuffer);
        return audioBuffer;
      } finally {
        this.ambientPromises.delete(clipId);
      }
    })();

    this.ambientPromises.set(clipId, loadPromise);
    return loadPromise;
  },

  pickRandomTrack(excludeId?: MusicTrackId | null) {
    const available = MUSIC_TRACKS.filter(track => track.id !== excludeId);
    if (available.length === 0) {
      return MUSIC_TRACKS[0]?.id ?? null;
    }
    const choice = available[Math.floor(Math.random() * available.length)];
    return choice?.id ?? null;
  },

  async playTrack(trackId: MusicTrackId, { forceRestart = false }: { forceRestart?: boolean } = {}) {
    this.pendingTrackId = trackId;
    if (!this.musicEnabled) {
      return;
    }
    if (!this.audioContext) this.init();
    if (!this.audioContext) {
      return;
    }

    if (!this.userInteractionPrimed) {
      await this.resumeContext();
      if (this.audioContext?.state === 'running') {
        this.userInteractionPrimed = true;
      }
    }

    if (!this.userInteractionPrimed) {
      return;
    }

    if (!forceRestart && this.currentTrackId === trackId && this.musicSource) {
      return;
    }

    try {
      await this.resumeContext();
      const buffer = await this.loadMusicTrack(trackId);
      if (!buffer) return;
      if (!this.musicEnabled || this.pendingTrackId !== trackId) return;

      const gainNode = this.ensureMusicGain();
      if (!gainNode) return;

      this.stopMusic();

      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      const offset = Math.random() * Math.max(buffer.duration - 0.5, 0);
      source.loop = this.preferredTrackId !== null;
      source.connect(gainNode);
      source.onended = () => {
        if (!this.preferredTrackId) {
          const next = this.pickRandomTrack(trackId);
          if (next) {
            void this.playTrack(next, { forceRestart: true });
          }
        }
      };
      source.start(0, offset);
      this.musicSource = source;
      this.currentTrackId = trackId;
      this.notifyTrackListeners(trackId);
    } catch (error) {
      // Music playback failed - expected in some environments
    }
  },

  async playPreferredTrack({ forceRestart = false }: { forceRestart?: boolean } = {}) {
    if (!this.musicEnabled) {
      return;
    }
    let trackId = this.preferredTrackId;
    if (!trackId) {
      trackId = this.pickRandomTrack(this.currentTrackId);
    }
    if (!trackId) {
      return;
    }
    await this.playTrack(trackId, { forceRestart });
  },

  stopMusic() {
    if (this.musicSource) {
      this.musicSource.onended = null;
      try {
        this.musicSource.stop();
      } catch (error) {
        // Stop failed - already stopped or disposed
      }
      try {
        this.musicSource.disconnect();
      } catch (error) {
        // Disconnect failed - already disconnected
      }
    }
    this.musicSource = null;
    this.currentTrackId = null;
    this.notifyTrackListeners(null);
  },

  stopAmbientLoop() {
    this.ambientDesiredClipId = null;
    if (this.ambientSource) {
      try {
        this.ambientSource.stop();
      } catch (error) {
        // Stop failed - already stopped or disposed
      }
      try {
        this.ambientSource.disconnect();
      } catch (error) {
        // Disconnect failed - already disconnected
      }
    }
    this.ambientSource = null;
    this.ambientClipId = null;
  },

  async ensureAmbientPlayback({ forceRestart = false }: { forceRestart?: boolean } = {}) {
    const targetClip = this.ambientDesiredClipId;
    if (!targetClip) {
      this.stopAmbientLoop();
      return;
    }

    if (!this.ambientEnabled) {
      return;
    }

    if (!this.audioContext) this.init();
    if (!this.audioContext) {
      return;
    }

    if (!this.userInteractionPrimed) {
      await this.resumeContext();
      if (this.audioContext?.state === 'running') {
        this.userInteractionPrimed = true;
      }
    }

    if (!this.userInteractionPrimed) {
      return;
    }

    if (!forceRestart && this.ambientSource && this.ambientClipId === targetClip) {
      return;
    }

    try {
      await this.resumeContext();
      const buffer = await this.loadAmbientClip(targetClip);
      if (!buffer) return;
      if (!this.ambientEnabled || this.ambientDesiredClipId !== targetClip) return;

      const gainNode = this.ensureAmbientGain();
      if (!gainNode) return;

      this.stopAmbientLoop();

      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(gainNode);
      source.start();

      this.ambientSource = source;
      this.ambientClipId = targetClip;
    } catch (error) {
      // Ambient playback failed - expected in some environments
    }
  },

  startAmbientLoop(clipId: AmbientClipId, { forceRestart = false }: { forceRestart?: boolean } = {}) {
    this.ambientDesiredClipId = clipId;
    void this.ensureAmbientPlayback({ forceRestart });
  },

  setAmbientEnabled(enabled: boolean) {
    this.ambientEnabled = enabled;
    if (!enabled) {
      this.stopAmbientLoop();
    } else {
      void this.ensureAmbientPlayback({ forceRestart: true });
    }
  },

  setAmbientVolume(volume: number) {
    this.ambientVolume = volume;
    if (this.ambientGainNode && this.audioContext) {
      try {
        this.ambientGainNode.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.05);
      } catch (error) {
        this.ambientGainNode.gain.value = volume;
      }
    }
  },

  updateAmbientForDefcon(defconLevel: number) {
    // DEFCON 1 and 2 sirens should NOT be ambient loops
    // They play once via audioManager.playCritical() in handleDefconTransition()
    // No ambient loop needed for DEFCON sirens

    // Stop any existing DEFCON siren loops if they somehow got started
    if (
      this.ambientDesiredClipId === 'defcon1-siren' ||
      this.ambientDesiredClipId === 'defcon2-siren'
    ) {
      this.stopAmbientLoop();
    }
  },

  handleDefconTransition(previous: number, next: number) {
    // Stop any existing DEFCON siren ambient loops
    if (
      this.ambientDesiredClipId === 'defcon1-siren' ||
      this.ambientDesiredClipId === 'defcon2-siren'
    ) {
      this.stopAmbientLoop();
    }

    // Only play siren on escalation to DEFCON 1 or 2
    if (next !== 1 && next !== 2) {
      return;
    }

    const isEscalation = previous === 0 || next < previous;
    if (!isEscalation) {
      return;
    }

    // Play DEFCON siren ONCE (not as a loop)
    const triggerOscillatorFallback = () => {
      this.playSFX('defcon');
    };

    try {
      import('@/utils/audioManager')
        .then(({ audioManager }) => {
          try {
            const sirenKey = next === 1 ? 'defcon1-siren' : 'defcon2-siren';
            audioManager.playCritical(sirenKey);
          } catch (error) {
            triggerOscillatorFallback();
          }
        })
        .catch(() => {
          triggerOscillatorFallback();
        });
    } catch (error) {
      triggerOscillatorFallback();
    }
  },

  handleUserInteraction() {
    if (this.userInteractionPrimed) {
      void this.ensureAmbientPlayback({ forceRestart: false });
      return;
    }
    this.userInteractionPrimed = true;
    void this.playPreferredTrack({ forceRestart: true });
    void this.ensureAmbientPlayback({ forceRestart: false });
  },

  setPreferredTrack(trackId: MusicTrackId | null) {
    this.preferredTrackId = trackId;
    if (!trackId) {
      const next = this.pickRandomTrack(this.currentTrackId);
      if (next) {
        this.pendingTrackId = next;
        void this.playTrack(next, { forceRestart: true });
      }
      return;
    }
    this.pendingTrackId = trackId;
    void this.playTrack(trackId, { forceRestart: true });
  },

  getPreferredTrack() {
    return this.preferredTrackId;
  },

  getCurrentTrack() {
    return this.currentTrackId;
  },

  getTracks() {
    return MUSIC_TRACKS.slice();
  },

  getTrackMetadata(trackId: MusicTrackId) {
    return MUSIC_TRACKS.find(track => track.id === trackId) ?? null;
  },

  notifyTrackListeners(trackId: MusicTrackId | null) {
    this.trackListeners.forEach(listener => {
      try {
        listener(trackId);
      } catch (error) {
        // Listener error - continue notifying other listeners
      }
    });
  },

  subscribeToTrackChanges(listener: (trackId: MusicTrackId | null) => void) {
    this.trackListeners.add(listener);
    return () => {
      this.trackListeners.delete(listener);
    };
  },

  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (!enabled) {
      this.stopMusic();
    } else {
      void this.playPreferredTrack({ forceRestart: true });
    }
  },

  playNextTrack() {
    if (this.preferredTrackId) {
      void this.playTrack(this.preferredTrackId, { forceRestart: true });
      return;
    }
    const next = this.pickRandomTrack(this.currentTrackId);
    if (next) {
      this.pendingTrackId = next;
      void this.playTrack(next, { forceRestart: true });
    }
  },

  playSFX(type: string) {
    if (!this.sfxEnabled) return;
    
    // Try playing real sound effect first
    try {
      import('@/utils/audioManager').then(({ audioManager }) => {
        // Map AudioSys types to audioManager keys
        const soundMap: Record<string, string> = {
          'explosion': 'nuclear-explosion',
          'launch': 'missile-launch',
          'defcon': 'defcon1-siren',
          'click': audioManager.uiClickKey,
          'success': 'research-complete',
          'error': 'alert-warning',
          'build': 'build-complete',
          'research': 'research-complete',
          'intel': 'ui-success',
          'endturn': 'turn-start',
        };

        const soundKey = soundMap[type];
        if (soundKey) {
          if (type === 'explosion' || type === 'launch' || type === 'defcon') {
            audioManager.playSFX(soundKey);
          } else if (type === 'error') {
            audioManager.playCritical(soundKey);
          } else {
            audioManager.playUI(soundKey);
          }
          return; // Don't use oscillator if we're trying real sound
        }
      }).catch(() => {
        // Fall through to oscillator backup
      });
      return; // Don't use oscillator if we're trying real sound
    } catch (error) {
      // Fall through to oscillator backup
    }
    
    // Fallback: Use oscillator-based sounds
    if (!this.audioSupported) return;
    if (!this.audioContext) this.init();
    const context = this.audioContext;
    if (!context) return;

    try {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      // Define sound profiles for different events
      let freq = 400;
      let duration = 0.3;
      let volume = 0.1;
      let waveType: OscillatorType = 'sine';

      switch(type) {
        case 'explosion':
          freq = 80;
          duration = 0.5;
          volume = 0.15;
          waveType = 'sawtooth';
          break;
        case 'launch':
          freq = 200;
          duration = 0.4;
          volume = 0.12;
          waveType = 'square';
          break;
        case 'click':
          freq = 600;
          duration = 0.08;
          volume = 0.08;
          waveType = 'sine';
          break;
        case 'success':
          freq = 800;
          duration = 0.15;
          volume = 0.1;
          waveType = 'sine';
          break;
        case 'error':
          freq = 150;
          duration = 0.2;
          volume = 0.12;
          waveType = 'sawtooth';
          break;
        case 'build':
          freq = 500;
          duration = 0.25;
          volume = 0.1;
          waveType = 'triangle';
          break;
        case 'research':
          freq = 700;
          duration = 0.3;
          volume = 0.09;
          waveType = 'sine';
          break;
        case 'intel':
          freq = 900;
          duration = 0.2;
          volume = 0.08;
          waveType = 'sine';
          break;
        case 'defcon':
          freq = 300;
          duration = 0.5;
          volume = 0.15;
          waveType = 'square';
          break;
        case 'endturn':
          freq = 450;
          duration = 0.35;
          volume = 0.11;
          waveType = 'triangle';
          break;
        default:
          freq = 400;
          duration = 0.15;
          volume = 0.08;
      }

      oscillator.type = waveType;
      oscillator.frequency.setValueAtTime(freq, context.currentTime);

      gainNode.gain.setValueAtTime(volume, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + duration);

      oscillator.start();
      oscillator.stop(context.currentTime + duration);
    } catch (error) {
      // SFX playback failed - expected in some environments
    }
  },
  
  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
  },

  toggleSFX() {
    this.sfxEnabled = !this.sfxEnabled;
  },

  setMusicVolume(volume: number) {
    this.musicVolume = volume;
    if (this.musicGainNode && this.audioContext) {
      try {
        this.musicGainNode.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.05);
      } catch (error) {
        this.musicGainNode.gain.value = volume;
      }
    }
  },

  /**
   * Cleanup audio resources to prevent memory leaks.
   * Call this when the game is reset or the component unmounts.
   */
  cleanup() {
    // Stop all playing audio
    this.stopMusic();
    this.stopAmbient();

    // Clear audio caches
    this.musicCache.clear();
    this.ambientCache.clear();
    this.trackPromises.clear();
    this.ambientPromises.clear();

    // Clear listeners
    this.trackListeners.clear();

    // Reset state
    this.currentTrackId = null;
    this.pendingTrackId = null;
    this.preferredTrackId = null;
    this.ambientClipId = null;
    this.ambientDesiredClipId = null;
  }
};

// Atmosphere effects
const Atmosphere = {
  clouds: [] as Array<{ x: number; y: number; sizeX: number; sizeY: number; speed: number }>,
  stars: [] as Array<{ x: number; y: number; brightness: number }>,
  initialized: false,

  init() {
    if (this.initialized) return;
    this.stars = [];
    for (let i = 0; i < 120; i++) {
      this.stars.push({
        x: Math.random() * W,
        y: Math.random() * H * 0.6,
        brightness: Math.random()
      });
    }

    this.clouds = [];
    for (let i = 0; i < 16; i++) {
      this.clouds.push({
        x: Math.random() * W,
        y: Math.random() * H * 0.5,
        sizeX: 160 + Math.random() * 220,
        sizeY: 60 + Math.random() * 90,
        speed: 0.05 + Math.random() * 0.1
      });
    }
    this.initialized = true;
  },
  
  update() {
    this.clouds.forEach(cloud => {
      cloud.x += cloud.speed;
      if (cloud.x - cloud.sizeX > W) {
        cloud.x = -cloud.sizeX;
      }
    });
  },
  
  draw(context: CanvasRenderingContext2D, style: MapStyle) {
    if (!this.initialized) return;

    const palette = THEME_SETTINGS[currentTheme];
    const visualStyle = typeof style === 'string' ? style : style.visual;
    const isWireframe = visualStyle === 'wireframe';
    const isFlatRealistic = visualStyle === 'flat-realistic';

    context.fillStyle = 'rgba(255,255,255,0.25)';
    const starAlpha = isWireframe ? 0.45 : 0.4;
    this.stars.forEach(star => {
      context.globalAlpha = star.brightness * starAlpha;
      context.fillRect(star.x, star.y, 1, 1);
    });
    context.globalAlpha = 1;

    if (isWireframe) {
      return;
    }

    const cloudAlpha = isFlatRealistic ? 0.05 : 0.08;
    this.clouds.forEach(cloud => {
      context.save();
      context.globalAlpha = cloudAlpha;
      context.fillStyle = palette.cloud;
      context.beginPath();
      context.ellipse(cloud.x, cloud.y, cloud.sizeX, cloud.sizeY, 0, 0, Math.PI * 2);
      context.fill();
      context.restore();
    });
  }
};

// Ocean effects
const Ocean = {
  waves: [] as never[],
  
  init() {
    this.waves = [];
  },
  
  update() {
    // Waves naturally animate via sin functions
  },
  
  draw(context: CanvasRenderingContext2D, style: MapStyle) {
    // Ocean rendering intentionally disabled to remove sine-wave bands.
    this.waves = [];
    return;
  }
};

// City Lights system
const CityLights = {
  cities: [] as Array<{ lat: number; lon: number; brightness: number }>,
  
  generate() {
    this.cities = [];
    nations.forEach(nation => {
      if (nation.population > 0) {
        const cityCount = Math.min(20, Math.floor(nation.population / 10));
        for (let i = 0; i < cityCount; i++) {
          const spread = 15;
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * spread;
          this.cities.push({
            lat: nation.lat + Math.sin(angle) * dist,
            lon: nation.lon + Math.cos(angle) * dist,
            brightness: 0.5 + Math.random() * 0.5
          });
        }
      }
    });
  },
  
  addCity(lat: number, lon: number, brightness: number) {
    this.cities.push({ lat, lon, brightness });
  },
  
  destroyNear(x: number, y: number, radius: number): number {
    let destroyed = 0;
    this.cities = this.cities.filter(city => {
      const { x: cx, y: cy } = projectLocal(city.lon, city.lat);
      const dist = Math.hypot(cx - x, cy - y);
      if (dist < radius) {
        destroyed++;
        return false;
      }
      return true;
    });
    return destroyed;
  },
  
  draw(context: CanvasRenderingContext2D, style: MapStyle) {
    const visualStyle = typeof style === 'string' ? style : style.visual;
    if (visualStyle === 'wireframe') {
      return;
    }

    const time = Date.now();
    this.cities.forEach(city => {
      const { x, y, visible } = projectLocal(city.lon, city.lat);
      if (!visible) {
        return;
      }

      // Flickering light effect (satellite view)
      const flicker = 0.8 + Math.sin(time * 0.003 + city.lon + city.lat) * 0.2;
      const brightness = city.brightness * flicker;

      // Glow effect
      context.save();
      context.shadowColor = 'rgba(255,255,150,0.8)';
      context.shadowBlur = visualStyle === 'flat-realistic' ? 2 : 3;
      context.fillStyle = `rgba(255,255,100,${brightness * 0.6})`;
      context.fillRect(x - 0.8, y - 0.8, 1.6, 1.6);
      context.restore();
    });
    context.globalAlpha = 1;
  }
};

// Helper functions
// Game utility functions moved to @/lib/gameUtils and @/lib/nationUtils
// AI diplomacy functions moved to @/lib/aiDiplomacyActions

// Wrapper function - delegates to extracted module
function startResearch(tier: number | string): boolean {
  const deps: ResearchHandlerDependencies = {
    PlayerManager,
    toast,
    AudioSys,
    log,
    updateDisplay,
  };
  return startResearchExtracted(tier, deps);
}

// Wrapper function - delegates to extracted module
function advanceResearch(nation: Nation, phase: 'PRODUCTION' | 'RESOLUTION') {
  const deps: ResearchHandlerDependencies = {
    PlayerManager,
    toast,
    AudioSys,
    log,
    updateDisplay,
  };
  return advanceResearchExtracted(nation, phase, deps);
}

// Wrapper function - delegates to extracted module
function advanceCityConstruction(nation: Nation, phase: 'PRODUCTION' | 'RESOLUTION') {
  const deps: ResearchHandlerDependencies = {
    PlayerManager,
    toast,
    AudioSys,
    log,
    updateDisplay,
  };
  return advanceCityConstructionExtracted(nation, phase, deps);
}

// Wrapper function - delegates to extracted module
function bootstrapNationResourceState(nation: LocalNation) {
  return bootstrapNationResourceStateExtracted(nation);
}

// Cuban Crisis specific initialization with historical nations
// ============================================================================
// CUBAN CRISIS INITIALIZATION HELPER FUNCTIONS
// ============================================================================

// CrisisNationConfig interface now imported from @/lib/gameInitialization

// Wrapper function - delegates to extracted module
function createCubanCrisisNation(
  config: CrisisNationConfig,
  isPlayer: boolean,
  selectedDoctrine: DoctrineKey | undefined
): LocalNation {
  const deps: GameInitializationDependencies = {
    log,
    updateDisplay,
    applyLeaderBonuses,
    applyDoctrineEffects,
    initializeNationLeaderAbility,
  };
  return createCubanCrisisNationExtracted(config, isPlayer, selectedDoctrine, deps);
}

/**
 * Initializes historical relationships for Cuban Crisis scenario
 * Sets up threats, alliances, and diplomatic relationships between USA, USSR, and Cuba
 * @param usa - United States nation
 * @param ussr - Soviet Union nation
 * @param cuba - Cuba nation
 */
// Wrapper function - delegates to extracted module
function initializeCrisisRelationships(
  usa: LocalNation,
  ussr: LocalNation,
  cuba: LocalNation
): void {
  return initializeCrisisRelationshipsExtracted(usa, ussr, cuba);
}

/**
 * Initializes all game systems for Cuban Crisis scenario
 * Handles conventional warfare, AI, diplomacy, population, ideology, government, DIP, and agendas
 * @param nations - Array of all nations in the scenario
 * @param difficulty - Game difficulty level
 */
// Wrapper function - delegates to extracted module
function initializeCrisisGameSystems(nations: LocalNation[], difficulty: string): void {
  return initializeCrisisGameSystemsExtracted(nations, difficulty);
}

/**
 * Finalizes Cuban Crisis game state after all nations and systems are initialized
 * Sets turn, phase, game flags, and logs scenario information
 * @param nations - Array of all nations
 * @param playerLeaderName - Name of the player's chosen leader
 */
// Wrapper function - delegates to extracted module
function finalizeCrisisGameState(nations: LocalNation[], playerLeaderName: string): void {
  const deps: GameInitializationDependencies = {
    log,
    updateDisplay,
    applyLeaderBonuses,
    applyDoctrineEffects,
    initializeNationLeaderAbility,
  };
  return finalizeCrisisGameStateExtracted(nations, playerLeaderName, deps);
}

// ============================================================================
// MAIN CUBAN CRISIS INITIALIZATION FUNCTION
// ============================================================================

/**
 * Initializes nations and game state for Cuban Missile Crisis scenario (October 1962)
 * Creates USA, USSR, and Cuba with historical stats and configurations
 * @param playerLeaderName - Name of the leader the player chose (Kennedy, Khrushchev, or Castro)
 * @param playerLeaderConfig - Configuration for the player's chosen leader
 * @param selectedDoctrine - Strategic doctrine chosen by the player
 */
// Wrapper function - delegates to extracted module
function initCubanCrisisNations(playerLeaderName: string, playerLeaderConfig: any, selectedDoctrine: DoctrineKey | undefined) {
  const deps: GameInitializationDependencies = {
    log,
    updateDisplay,
    applyLeaderBonuses,
    applyDoctrineEffects,
    initializeNationLeaderAbility,
  };
  return initCubanCrisisNationsExtracted(playerLeaderName, playerLeaderConfig, selectedDoctrine, nations, deps);
}

/**
 * Completely resets all game state to initial values
 * Called when starting a new game to ensure no state persists from previous sessions
 */
// Wrapper function - delegates to extracted module
function resetGameState() {
  resetGameStateExtracted();
  // Update local module-level references after reset
  S = GameStateManager.getState();
  nations = GameStateManager.getNations();
  conventionalDeltas = GameStateManager.getConventionalDeltas();
}

// Game initialization
// Wrapper function - delegates to extracted module
function initNations() {
  const deps: GameInitializationDependencies = {
    log,
    updateDisplay,
    applyLeaderBonuses,
    applyDoctrineEffects,
    initializeNationLeaderAbility,
  };
  return initNationsExtracted(nations, deps);
}

// Banter system - Enhanced to use expanded banter pack
function maybeBanter(nation: Nation, chance: number, pool?: string) {
  if (Math.random() > chance) return;
  
  // Use the expanded banter system if available
  if (typeof window !== 'undefined' && window.banterSay) {
    try {
      // Determine pool based on context if not specified
      if (!pool && nation.aiPersonality) {
        pool = nation.aiPersonality; // Use AI personality as default pool
      }
      window.banterSay(pool || 'default', nation, 1);
      return;
    } catch (e) {
      // Fallback to basic banter if expanded system fails
    }
  }
  
  // Fallback basic banter messages
  const messages = [
    `${nation.name}: "The world will know our strength!"`,
    `${nation.name}: "This aggression will not stand!"`,
    `${nation.name}: "We are prepared for anything!"`,
    `${nation.name}: "Our resolve is absolute!"`,
    `${nation.name}: "Strategic advantage secured."`,
    `${nation.name}: "Deterrence is our doctrine."`,
  ];
  
  log(messages[Math.floor(Math.random() * messages.length)], 'warning');
}

// Immigration functions
// hasOpenBorders moved to @/lib/nationUtils

function performImmigration(type: string, target: Nation) {
  const player = PlayerManager.get();
  if (!player || !target) return false;

  if (!hasOpenBorders(target)) {
    const message = `${target.name} has sealed its borders.`;
    log(`Immigration blocked: ${message}`, 'warning');
    toast({ title: 'Borders closed', description: message });
    return false;
  }

  const trackMigrants = (recipient: Nation, amount: number) => {
    if (amount <= 0) return;
    recipient.migrantsThisTurn = (recipient.migrantsThisTurn || 0) + amount;
    recipient.migrantsTotal = (recipient.migrantsTotal || 0) + amount;
  };

  switch (type) {
    case 'skilled':
      if (!canAfford(player, COSTS.immigration_skilled)) break;

      { const amount = Math.max(1, Math.floor(target.population * 0.05));
        if (amount <= 0) break;
        target.population = Math.max(0, target.population - amount);
        player.population += amount;
        target.instability = (target.instability || 0) + 15;
        player.defense = clampDefenseValue((player.defense || 0) + 1);
        pay(player, COSTS.immigration_skilled);
        trackMigrants(player, amount);
        log(`Skilled immigration: +${amount}M talent from ${target.name}`);
        return true;
      }

    case 'mass':
      if (!canAfford(player, COSTS.immigration_mass)) break;

      { const amount = Math.max(1, Math.floor(target.population * 0.1));
        if (amount <= 0) break;
        target.population = Math.max(0, target.population - amount);
        player.population += amount;
        const instability = 25 + Math.floor(Math.random() * 11);
        target.instability = (target.instability || 0) + instability;
        pay(player, COSTS.immigration_mass);
        trackMigrants(player, amount);
        log(`Mass immigration: ${amount}M resettle from ${target.name} (+${instability} instability)`);
        return true;
      }

    case 'refugee':
      if (!canAfford(player, COSTS.immigration_refugee) || (player.instability || 0) < 50) break;

      { const amount = Math.max(1, Math.floor(target.population * 0.15));
        if (amount <= 0) break;
        target.population = Math.max(0, target.population - amount);
        player.population += amount;
        target.instability = (target.instability || 0) + 40;
        player.instability = Math.max(0, (player.instability || 0) - 20);
        pay(player, COSTS.immigration_refugee);
        trackMigrants(player, amount);
        log(`Refugee wave: ${amount}M flee ${target.name} (your instability -20)`);
        return true;
      }

    case 'brain':
      if (!canAfford(player, COSTS.immigration_brain)) break;

      { const amount = Math.max(1, Math.floor(target.population * 0.03));
        if (amount <= 0) break;
        target.population = Math.max(0, target.population - amount);
        player.population += amount;
        target.instability = (target.instability || 0) + 10;
        pay(player, COSTS.immigration_brain);
        trackMigrants(player, amount);
        log(`Brain drain: +${amount}M skilled workers from ${target.name}`);
        return true;
      }
  }

  return false;
}

// Launch function
// Wrapper function for launch - delegates to extracted module
function launch(from: Nation, to: Nation, yieldMT: number) {
  const deps: LaunchDependencies = {
    S,
    nations,
    log,
    toast,
    AudioSys,
    DoomsdayClock,
    WARHEAD_YIELD_TO_ID,
    RESEARCH_LOOKUP,
    PlayerManager,
    projectLocal,
  };
  return launchMissile(from, to, yieldMT, deps);
}

// Resolution Phase - wrapper function that delegates to extracted module
function resolutionPhase() {
  const deps: ResolutionPhaseDependencies = {
    S,
    nations,
    log,
    projectLocal,
    explode,
    advanceResearch,
    advanceCityConstruction,
  };
  runResolutionPhase(deps);
}

// Production Phase - wrapper function that delegates to extracted module
function productionPhase(rng: SeededRandom) {
  const player = PlayerManager.get();
  const deps: ProductionPhaseDependencies = {
    S,
    nations,
    log,
    advanceResearch,
    advanceCityConstruction,
    leaders,
    PlayerManager,
    rng,
    policyEffects: policySystemRef?.totalEffects,
    policyNationId: player?.id,
    onGameOver: ({ victory, message }) => {
      endGame(victory, message);
    },
  };
  runProductionPhase(deps);

  // Clean up refugee camps with expired TTL to prevent memory leaks
  if (S.refugeeCamps && S.refugeeCamps.length > 0) {
    S.refugeeCamps = S.refugeeCamps.filter((camp: { ttl: number }) => {
      camp.ttl--;
      return camp.ttl > 0;
    });
  }

  // Automatic de-escalation during peaceful periods
  const currentDefcon = GameStateManager.getDefcon();

  if (player && currentDefcon < 5) {
    const lastAggression = player.lastAggressiveAction || 0;
    const peacefulTurns = S.turn - lastAggression;
    const peacefulThreshold = 5; // Must be peaceful for 5 turns

    // Every 3rd turn of peaceful behavior, reduce tensions
    if (peacefulTurns >= peacefulThreshold && S.turn % 3 === 0) {
      handleDefconChange(1, 'Prolonged peace reduces global tensions', 'system', {
        onAudioTransition: AudioSys.handleDefconTransition,
        onLog: log,
        onUpdateDisplay: updateDisplay,
      });
    }
  }
}

// World map loading
function loadWorld(): Promise<void> {
  if (worldCountries) {
    return Promise.resolve();
  }

  if (worldLoadPromise) {
    return worldLoadPromise;
  }

  worldLoadPromise = (async () => {
    const CACHE_NAME = 'offlineTopo110m-v2';

    const processWorldData = (data: any, source: string): boolean => {
      if (!data) {
        return false;
      }

      if (data.type === 'Topology' && data.objects) {
        worldData = data;
        worldCountries = feature(data, data.objects.countries || data.objects.land);
      } else if (data.type === 'FeatureCollection') {
        worldData = null;
        worldCountries = data;
      } else {
        return false;
      }

      log(`World map loaded from ${source}`);
      if (uiUpdateCallback) uiUpdateCallback();
      return true;
    };

    const loadAndProcess = async (url: string, source: string): Promise<boolean> => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          return false;
        }
        const topo = await response.json();
        if (!processWorldData(topo, source)) {
          return false;
        }
        try {
          Storage.setItem(CACHE_NAME, JSON.stringify(topo));
        } catch (e) {
          // Could not cache - not critical, continue without cache
        }
        return true;
      } catch (e) {
        return false;
      }
    };

    try {
      const cached = Storage.getItem(CACHE_NAME);
      if (cached) {
        const data = JSON.parse(cached);
        if (processWorldData(data, 'cache')) {
          return;
        }
      }
    } catch (e) {
      // Cache load failed - continue to fetch sources
    }

    if (await loadAndProcess(resolvePublicAssetPath('data/countries-110m.json'), 'local asset')) {
      return;
    }

    if (await loadAndProcess('https://unpkg.com/world-atlas@2/countries-110m.json', 'CDN')) {
      return;
    }

    throw new Error('Failed to load world map data');
  })().catch(error => {
    worldLoadPromise = null;
    throw error;
  });

  return worldLoadPromise;
}

// Drawing functions
// Rendering utility functions - using extracted utilities from @/lib/renderingUtils
// Wrapper functions that use the global rendering context
function projectLocal(lon: number, lat: number): ProjectedPoint {
  const projected = project(lon, lat, { W, H, cam, globeProjector, globePicker });
  if (Array.isArray(projected)) {
    const [x, y] = projected;
    return { x, y, visible: true };
  }
  return projected;
}

function toLonLatLocal(x: number, y: number): [number, number] {
  return toLonLat(x, y, { W, H, cam, globeProjector, globePicker });
}

// World rendering - wrapper function that delegates to extracted module
function drawWorld(style: MapVisualStyle) {
  const { dayTexture, nightTexture, blend } = getFlatRealisticTextureState();
  const context: WorldRenderContext = {
    ctx,
    worldCountries,
    W,
    H,
    cam,
    currentTheme,
    themePalette: THEME_SETTINGS[currentTheme],
    flatRealisticDayTexture: dayTexture,
    flatRealisticNightTexture: nightTexture,
    flatRealisticBlend: blend,
    THEME_SETTINGS,
    projectLocal,
    preloadFlatRealisticTexture,
    mapMode: currentMapMode,
    modeData: currentMapModeData,
  };
  renderWorld(style, context);
}

function drawWorldPath(coords: number[][]) {
  if (!ctx) return;
  renderWorldPath(coords, ctx, projectLocal);
}

// Nation rendering - wrapper function that delegates to extracted module
function drawNations(style: MapVisualStyle) {
  const { dayTexture, nightTexture, blend } = getFlatRealisticTextureState();
  const context: NationRenderContext = {
    ctx,
    worldCountries,
    W,
    H,
    cam,
    currentTheme,
    themePalette: THEME_SETTINGS[currentTheme],
    flatRealisticDayTexture: dayTexture,
    flatRealisticNightTexture: nightTexture,
    flatRealisticBlend: blend,
    THEME_SETTINGS,
    projectLocal,
    preloadFlatRealisticTexture,
    nations,
    S,
    selectedTargetRefId,
    mapMode: currentMapMode,
    modeData: currentMapModeData,
  };
  renderNations(style, context);
}

// Territory rendering - wrapper function for Risk-style markers
function drawTerritoriesWrapper() {
  const currentTerritories = territoryListRef.current ?? [];
  if (!currentTerritories.length) return;

  const player = PlayerManager.get();
  if (!player) return;

  const { dayTexture, nightTexture, blend } = getFlatRealisticTextureState();
  const context: TerritoryRenderContext = {
    ctx,
    worldCountries,
    W,
    H,
    cam,
    currentTheme,
    themePalette: THEME_SETTINGS[currentTheme],
    flatRealisticDayTexture: dayTexture,
    flatRealisticNightTexture: nightTexture,
    flatRealisticBlend: blend,
    THEME_SETTINGS,
    projectLocal,
    preloadFlatRealisticTexture,
    mapMode: currentMapMode,
    modeData: currentMapModeData,
    territories: currentTerritories,
    playerId: player?.id ?? null,
    selectedTerritoryId: selectedTerritoryIdRef.current,
    hoveredTerritoryId: hoveredTerritoryIdRef.current,
    draggingTerritoryId: draggingArmyRef.current?.sourceId ?? null,
    dragTargetTerritoryId: dragTargetTerritoryIdRef.current,
  };
  renderTerritories(context);
}

// Helper function to build canvas drawing dependencies
function getCanvasDrawingDeps(): CanvasDrawingDependencies {
  return {
    S,
    nations,
    ctx,
    cam,
    W,
    H,
    projectLocal,
    toLonLatLocal,
    missileIcon,
    bomberIcon,
    submarineIcon,
    satelliteIcon,
    radiationIcon,
    conventionalIconLookup,
    CONVENTIONAL_ICON_BASE_SCALE,
    AudioSys,
    CityLights,
    PlayerManager,
    toast,
    log,
    explode,
    launch,
    handleDefconChange,
    updateDisplay,
    currentMapStyle,
    policySystemRef,
    lastFxTimestamp,
    setLastFxTimestamp: (value: number | null) => {
      lastFxTimestamp = value;
    },
  };
}

// Wrapper functions that inject dependencies into extracted canvas drawing functions

function drawSatellites(nowMs: number) {
  drawSatellitesExtracted(nowMs, getCanvasDrawingDeps());
}

function registerSatelliteOrbit(ownerId: string, targetId: string) {
  registerSatelliteOrbitExtracted(ownerId, targetId, getCanvasDrawingDeps());
}

function drawVIIRSFires(nowMs: number) {
  drawVIIRSFiresExtracted(nowMs, getCanvasDrawingDeps());
}

function drawSatelliteSignals(nowMs: number) {
  drawSatelliteSignalsExtracted(nowMs, getCanvasDrawingDeps());
}

function drawMissiles() {
  drawMissilesExtracted(getCanvasDrawingDeps());
}

function drawBombers() {
  drawBombersExtracted(getCanvasDrawingDeps());
}

function drawSubmarines() {
  drawSubmarinesExtracted(getCanvasDrawingDeps());
}

function drawConventionalForces() {
  drawConventionalForcesExtracted(getCanvasDrawingDeps());
}

function drawParticles() {
  drawParticlesExtracted(getCanvasDrawingDeps());
}

function drawFalloutMarks(deltaMs: number) {
  drawFalloutMarksExtracted(deltaMs, getCanvasDrawingDeps());
}

function upsertFalloutMark(
  x: number,
  y: number,
  lon: number,
  lat: number,
  yieldMT: number,
  targetNationId?: string | null
) {
  upsertFalloutMarkExtracted(x, y, lon, lat, yieldMT, targetNationId, getCanvasDrawingDeps());
}

function drawFX() {
  drawFXExtracted(getCanvasDrawingDeps());
}

function hasMadDoctrine(nation: Nation | null | undefined): boolean {
  if (!nation?.doctrine) {
    return false;
  }
  return nation.doctrine.toLowerCase() === 'mad';
}

function selectLargestWarheadYield(nation: Nation): number | null {
  const warheadEntries = Object.entries(nation.warheads || {}).filter(([, count]) => (count ?? 0) > 0);
  if (warheadEntries.length === 0) {
    return null;
  }

  const yields = warheadEntries
    .map(([yieldStr]) => Number(yieldStr))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (yields.length === 0) {
    return null;
  }

  return Math.max(...yields);
}

function triggerMadCounterstrike(
  defender: Nation,
  attacker: Nation,
  deliveryMethod: DeliveryMethod,
  incomingYield: number
): void {
  if (!hasMadDoctrine(defender)) {
    return;
  }

  if (defender.missiles <= 0) {
    return;
  }

  const retaliationYield = selectLargestWarheadYield(defender);
  if (!retaliationYield) {
    return;
  }

  const defconBefore = S.defcon;
  if (defconBefore > 1) {
    handleDefconChange(
      1 - defconBefore,
      `${defender.name} triggers MAD counterstrike protocols`,
      defender.isPlayer ? 'player' : 'system',
      {
        onAudioTransition: AudioSys.handleDefconTransition,
        onLog: (message, type) => log(message, type),
        onUpdateDisplay: updateDisplay,
      }
    );
  }

  const retaliationLaunched = launch(defender, attacker, retaliationYield);
  if (!retaliationLaunched) {
    return;
  }

  const retaliationDescriptor = `${retaliationYield}MT missile`;
  log(`☢️ MAD COUNTERSTRIKE: ${defender.name} launches ${retaliationDescriptor} at ${attacker.name}!`, 'alert');

  if (typeof window !== 'undefined' && (window as any).__gameAddNewsItem) {
    (window as any).__gameAddNewsItem(
      'military',
      `${defender.name} retaliates against ${attacker.name} under MAD protocols after a ${deliveryMethod} strike (${incomingYield}MT).`,
      'critical'
    );
  }

  if (defender.isPlayer) {
    toast({
      title: 'MAD Counterstrike Initiated',
      description: `Automatic retaliation targeting ${attacker.name} (${retaliationDescriptor}).`,
      variant: 'destructive',
    });
  } else if (attacker.isPlayer) {
    toast({
      title: 'Incoming MAD Retaliation',
      description: `${defender.name} launches an automatic ${retaliationDescriptor}!`,
      variant: 'destructive',
    });
  }
}

// Explosion function
function explode(
  x: number,
  y: number,
  target: Nation,
  yieldMT: number,
  attacker: Nation | null = null,
  deliveryMethod: DeliveryMethod = 'missile'
) {
  AudioSys.playSFX('explosion');

  const scale = Math.sqrt(yieldMT / 20);
  const particleCount = Math.floor(100 * scale);
  
  const blastRadius = Math.sqrt(yieldMT) * 10;
  const destroyed = CityLights.destroyNear(x, y, blastRadius);
  if (destroyed > 0) {
    log(`💡 ${destroyed} cities went dark`, 'warning');
  }
  
  if (target && !target.isPlayer) {
    maybeBanter(target, 0.7);
  }

  const [elon, elat] = toLonLatLocal(x, y);
  if (Number.isFinite(elon) && Number.isFinite(elat)) {
    upsertFalloutMark(x, y, elon, elat, yieldMT, target?.id ?? null);
  }

  // Create mushroom cloud particles
  const mushroomStemHeight = 20 * scale;
  const mushroomCapRadius = 12 * scale;
  
  // Stem particles (rising column)
  for (let i = 0; i < particleCount * 0.4; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * 3 * scale;
    S.particles.push({
      x: x + Math.cos(a) * r,
      y: y,
      vx: (Math.random() - 0.5) * 0.3 * scale,
      vy: -1.5 - Math.random() * 1.5,
      life: 600 + Math.random() * 400,
      max: 1000,
      type: 'mushroom-stem'
    });
  }
  
  // Cap particles (mushroom top)
  for (let i = 0; i < particleCount * 0.3; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * mushroomCapRadius;
    S.particles.push({
      x: x + Math.cos(a) * r * 0.3,
      y: y - mushroomStemHeight,
      vx: Math.cos(a) * (0.8 + Math.random() * 0.7),
      vy: -0.2 + Math.random() * 0.4,
      life: 800 + Math.random() * 600,
      max: 1400,
      type: 'mushroom-cap'
    });
  }
  
  // Ground blast particles
  for (let i = 0; i < particleCount * 0.3; i++) {
    const a = Math.random() * Math.PI * 2;
    const speed = (2 + Math.random() * 4) * scale;
    S.particles.push({
      x, y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed * 0.3,
      life: 400 + Math.random() * 300,
      max: 700,
      type: 'blast'
    });
  }

  S.rings.push({ lon: elon, lat: elat, r: 3, max: 120 * scale * (S.fx || 1), speed: 2, alpha: 1, type: 'shock' });
  S.rings.push({ lon: elon, lat: elat, r: 1, max: 40 * (S.fx || 1), speed: 1.5, alpha: 0.8, type: 'heat' });
  S.rings.push({ lon: elon, lat: elat, r: 2, max: 80 * scale * (S.fx || 1), speed: 2.5, alpha: 0.9, type: 'flash' });
  S.rings.push({ lon: elon, lat: elat, r: 4, max: 100 * scale * (S.fx || 1), speed: 1.5, alpha: 0.7, type: 'plasma' });

  const sparkCount = Math.floor(50 * scale);
  for (let j = 0; j < sparkCount; j++) {
    const a2 = Math.random() * Math.PI * 2;
    const spd = (0.5 + Math.random() * 2.5) * scale;
    S.particles.push({
      x, y,
      vx: Math.cos(a2) * spd,
      vy: Math.sin(a2) * spd,
      life: 300 + Math.random() * 300,
      max: 600,
      type: 'spark'
    });
  }

  const impact = calculateNuclearImpact({
    yieldMT,
    defense: target?.defense ?? 0,
    population: target?.population ?? 0,
    cities: target?.cities ?? 0,
    production: target?.production ?? 0,
    missiles: target?.missiles ?? 0,
    bombers: target?.bombers ?? 0,
    submarines: target?.submarines ?? 0,
    uranium: target?.uranium ?? 0,
    nationName: target?.name,
  });

  if (!Array.isArray(S.radiationZones)) {
    S.radiationZones = [];
  }

  const zoneRadius = Math.sqrt(yieldMT) * 8 * (1 + impact.severity * 0.3);
  const zoneIntensity = Math.max(0, yieldMT / 100 + impact.radiationDelta / 15);
  const radiationTimestamp = Date.now();
  const existingZones: RadiationZone[] = [...S.radiationZones];
  let mergedZone = false;

  for (const zone of existingZones) {
    const legacyZone = zone as unknown as { x?: number; y?: number };
    const baseX = Number.isFinite(zone.canvasX) ? zone.canvasX! : legacyZone.x ?? x;
    const baseY = Number.isFinite(zone.canvasY) ? zone.canvasY! : legacyZone.y ?? y;
    const distance = Math.hypot(baseX - x, baseY - y);
    const overlapThreshold = Math.max(zone.radius ?? zoneRadius, zoneRadius) * 0.75;
    const sameNation = target?.id && zone.nationId === target.id;

    if (sameNation || distance <= overlapThreshold) {
      const currentIntensity = Number.isFinite(zone.intensity) ? zone.intensity : 0;
      zone.intensity = Math.min(1.5, currentIntensity + zoneIntensity * 0.6);
      zone.radius = Math.max(zone.radius ?? zoneRadius, (zone.radius ?? zoneRadius) * 0.85 + zoneRadius * 0.35);
      zone.lon = Number.isFinite(elon) ? (Number.isFinite(zone.lon) ? (zone.lon + elon) / 2 : elon) : zone.lon;
      zone.lat = Number.isFinite(elat) ? (Number.isFinite(zone.lat) ? (zone.lat + elat) / 2 : elat) : zone.lat;
      zone.canvasX = x;
      zone.canvasY = y;
      zone.updatedAt = radiationTimestamp;
      zone.lastStrikeAt = radiationTimestamp;
      if (!zone.nationId && target?.id) {
        zone.nationId = target.id;
      }
      mergedZone = true;
      break;
    }
  }

  if (!mergedZone) {
    const newZone: RadiationZone = {
      id: `radiation_${radiationTimestamp}_${Math.random().toString(36).slice(2, 8)}`,
      lon: Number.isFinite(elon) ? elon : 0,
      lat: Number.isFinite(elat) ? elat : 0,
      radius: Math.max(18, zoneRadius),
      intensity: Math.min(1.25, zoneIntensity),
      createdAt: radiationTimestamp,
      updatedAt: radiationTimestamp,
      lastStrikeAt: radiationTimestamp,
      nationId: target?.id ?? null,
      canvasX: x,
      canvasY: y,
    };
    existingZones.push(newZone);
  }

  S.radiationZones = existingZones;

  const smokeBursts = Math.max(0, Math.round((impact.severity + impact.totalCityLosses * 0.6) * 12));
  for (let s = 0; s < smokeBursts; s++) {
    const ang = Math.random() * Math.PI * 2;
    const rad = Math.random() * 12;
    S.particles.push({
      x: x + Math.cos(ang) * rad,
      y: y + Math.sin(ang) * rad,
      vx: (Math.random() - 0.5) * 0.35,
      vy: -0.6 - Math.random() * 0.5,
      life: 900 + Math.random() * 800,
      max: 1600,
      type: 'smoke'
    });
  }

  if (impact.severity >= 1 || yieldMT >= 40) {
    S.empEffects.push({
      x,
      y,
      radius: Math.sqrt(yieldMT) * 15 * (1 + impact.severity * 0.2),
      duration: 30
    });

    nations.forEach(n => {
      const { x: nx, y: ny } = projectLocal(n.lon, n.lat);
      const dist = Math.hypot(nx - x, ny - y);
      if (dist < Math.sqrt(yieldMT) * 15 * (1 + impact.severity * 0.1)) {
        const defenseLoss = Math.min(5, Math.round(impact.severity * 2));
        const missileLoss = Math.max(0, Math.round(impact.severity));
        n.defense = Math.max(0, n.defense - defenseLoss);
        n.missiles = Math.max(0, n.missiles - missileLoss);
        log(`⚡ EMP disabled ${n.name}'s electronics!`, 'warning');
      }
    });
  }

  S.screenShake = Math.max(S.screenShake || 0, Math.min(25, yieldMT / 5 + impact.severity * 3));

  if (target) {
    if (attacker) {
      triggerMadCounterstrike(target, attacker, deliveryMethod, yieldMT);
    }

    const previousPopulation = target.population;
    applyNuclearImpactToNation(target, impact);

    const convertedCasualties = Number.isFinite(impact.totalCasualties)
      ? Math.max(0, Math.round(impact.totalCasualties * 1_000_000))
      : 0;
    if (convertedCasualties > 0) {
      GameStateManager.addNonPandemicCasualties(convertedCasualties);
      
      // Add visual population impact feedback
      setPopulationImpacts(prev => [...prev, {
        id: `impact-${Date.now()}-${Math.random()}`,
        casualties: convertedCasualties,
        targetName: target.name,
        timestamp: Date.now()
      }]);
    }

    // Track when nation was last nuked (for political events)
    target.lastNukedTurn = S.turn;

    log(`💥 ${yieldMT}MT detonation at ${target.name}! ${impact.humanitarianSummary}`, 'alert');
    impact.stageReports.forEach(stage => {
      if (stage.summary) {
        log(`☢️ ${stage.summary}`, 'warning');
      }
    });

    toast({
      title: `☢️ ${target.name} Devastated`,
      description: `${impact.humanitarianSummary} ${impact.environmentalSummary}`,
      variant: 'destructive',
      duration: 8000,
    });

    // Update instability from the strike
    target.instability = Math.min(100, (target.instability || 0) + yieldMT);

    emitOverlayMessage(impact.overlayMessage, 8000, { tone: 'catastrophe', sound: 'explosion-blast' });

    if (typeof window !== 'undefined' && window.__gameAddNewsItem) {
      window.__gameAddNewsItem('crisis', `${target.name} suffers nuclear annihilation: ${impact.humanitarianSummary}`, 'critical');
    }

    if (target.isPlayer) {
      if (!S.statistics) {
        S.statistics = {
          nukesLaunched: 0,
          nukesReceived: 0,
          enemiesDestroyed: 0,
          nonPandemicCasualties: 0,
        };
      }
      S.statistics.nukesReceived++;
    }

    if (previousPopulation > 0 && target.population <= 0 && !target.isPlayer) {
      const player = PlayerManager.get();
      if (player) {
        if (!S.statistics) {
          S.statistics = {
            nukesLaunched: 0,
            nukesReceived: 0,
            enemiesDestroyed: 0,
            nonPandemicCasualties: 0,
          };
        }
        S.statistics.enemiesDestroyed++;
      }
    }

    if (impact.totalRefugees > 0) {
      const refugeeId = `nuke-${target.id}-${Date.now()}`;
      S.refugeeCamps = S.refugeeCamps || [];
      S.refugeeCamps.push({ id: refugeeId, nationId: target.id, displaced: impact.totalRefugees, ttl: Math.max(5, Math.round(impact.severity * 10)) });
      log(`🚨 ${impact.totalRefugees.toFixed(1)}M refugees flee ${target.name}.`, 'warning');
    }

    if (governanceApiRef) {
      const moraleDelta = -Math.round(Math.max(2, impact.severity * 10));
      const opinionDelta = -Math.round(Math.max(1, impact.severity * 8));
      const cabinetDelta = -Math.round(Math.max(1, impact.severity * 6));
      governanceApiRef.applyGovernanceDelta(target.id, {
        morale: moraleDelta,
        publicOpinion: opinionDelta,
        cabinetApproval: cabinetDelta,
      }, `${target.name} reels from nuclear devastation.`);
    }

    if (impact.severity >= 1.2) {
      DoomsdayClock.tick(0.5 + impact.severity * 0.1);
    }
  }

  S.nuclearWinterLevel = (S.nuclearWinterLevel || 0) + impact.winterDelta;
  S.globalRadiation = (S.globalRadiation || 0) + impact.radiationDelta;

  if (impact.totalRefugees > 0 && !target) {
    S.refugeeCamps = S.refugeeCamps || [];
    S.refugeeCamps.push({ id: `nuke-unknown-${Date.now()}`, nationId: 'unknown', displaced: impact.totalRefugees, ttl: Math.max(5, Math.round(impact.severity * 10)) });
  }

  checkVictory();
  checkVictoryProgress();
}

// Launch submarine - wrapper function that delegates to extracted module
function launchSubmarine(from: Nation, to: Nation, yieldMT: number) {
  const deps: NuclearLaunchDependencies = {
    S,
    projectLocal,
    AudioSys,
    toast,
    log,
  };
  return launchSubmarineExtracted(from, to, yieldMT, deps);
}

// Launch bomber - wrapper function that delegates to extracted module
function launchBomber(from: Nation, to: Nation, payload: any) {
  const deps: NuclearLaunchDependencies = {
    S,
    projectLocal,
    AudioSys,
    toast,
    log,
  };
  return launchBomberExtracted(from, to, payload, deps);
}

// createDefaultDiplomacyState now imported from @/state (Phase 6 refactoring)
import type { DiplomacyState } from '@/state/GameStateManager';

function ensureDiplomacyState(): DiplomacyState {
  if (!S.diplomacy) {
    S.diplomacy = createDefaultDiplomacyState();
  }
  return S.diplomacy;
}

function evaluateDiplomaticProgress(player: Nation) {
  const diplomacy = ensureDiplomacyState();
  const aliveNations = nations.filter(n => n.population > 0);
  const potentialPartners = Math.max(1, aliveNations.length - 1);
  const allianceCount = aliveNations.filter(n => n !== player && player.treaties?.[n.id]?.alliance).length;
  const allianceRatio = potentialPartners > 0 ? allianceCount / potentialPartners : 0;
  const truceCount = aliveNations.filter(n => n !== player && player.treaties?.[n.id]?.truceTurns).length;

  if (diplomacy.lastEvaluatedTurn !== S.turn) {
    diplomacy.lastEvaluatedTurn = S.turn;
    if (S.defcon >= DIPLOMATIC_VICTORY_CRITERIA.requiredDefcon) {
      diplomacy.peaceTurns += 1;
    } else {
      diplomacy.peaceTurns = 0;
    }
  }

  const influenceScore =
    allianceCount * 25 +
    truceCount * 10 +
    (player.intel || 0) +
    Math.max(0, (player.production || 0) * 0.5) +
    S.defcon * 5;

  diplomacy.allianceRatio = allianceRatio;
  diplomacy.influenceScore = influenceScore;

  const allianceProgress = Math.min(1, allianceRatio / DIPLOMATIC_VICTORY_CRITERIA.allianceRatio);
  const peaceProgress = Math.min(1, diplomacy.peaceTurns / DIPLOMATIC_VICTORY_CRITERIA.peaceTurns);
  const influenceProgress = Math.min(1, influenceScore / DIPLOMATIC_VICTORY_CRITERIA.influenceTarget);
  const overallProgress = (allianceProgress + peaceProgress + influenceProgress) / 3;

  if (overallProgress < DIPLOMATIC_VICTORY_CRITERIA.resetNearThreshold) {
    diplomacy.nearVictoryNotified = false;
  }

  if (
    !diplomacy.nearVictoryNotified &&
    overallProgress >= DIPLOMATIC_VICTORY_CRITERIA.nearProgressThreshold &&
    (allianceProgress < 1 || peaceProgress < 1 || influenceProgress < 1)
  ) {
    diplomacy.nearVictoryNotified = true;
    toast({
      title: 'Diplomatic Momentum',
      description: 'World leaders are rallying behind you. Maintain the peace to secure a diplomatic victory.'
    });
    window.__gameAddNewsItem?.('diplomatic', 'Global coalition forming around your leadership', 'important');
  }

  const victoryAchieved =
    allianceRatio >= DIPLOMATIC_VICTORY_CRITERIA.allianceRatio &&
    diplomacy.peaceTurns >= DIPLOMATIC_VICTORY_CRITERIA.peaceTurns &&
    influenceScore >= DIPLOMATIC_VICTORY_CRITERIA.influenceTarget;

  if (victoryAchieved && !diplomacy.victoryAnnounced) {
    diplomacy.victoryAnnounced = true;
    toast({
      title: 'Diplomatic Victory Achieved',
      description: 'A worldwide alliance recognizes your leadership.'
    });
    window.__gameAddNewsItem?.('diplomatic', 'Diplomatic triumph! A global coalition is declared.', 'critical');
  }

  return {
    victory: victoryAchieved,
    message: victoryAchieved
      ? `DIPLOMATIC VICTORY - Forged alliances with ${allianceCount} nations, preserved peace for ${diplomacy.peaceTurns} turns, and achieved influence score ${Math.floor(
          influenceScore
        )}.`
      : undefined
  };
}

// Victory progress notifications
function checkVictoryProgress() {
  if (S.gameOver) return;

  const player = PlayerManager.get();
  if (!player) return;

  const alive = nations.filter(n => n.population > 0);
  const totalPop = alive.reduce((sum, n) => sum + n.population, 0);

  // Initialize progress tracking if not exists
  if (!S.victoryProgressNotifications) {
    S.victoryProgressNotifications = {
      economic: false,
      demographic: false,
      cultural: false,
      survival: false,
      domination: false,
    };
  }

  // Economic Victory Progress (10 cities)
  const cities = player.cities || 0;
  if (cities >= 7 && cities < 10 && !S.victoryProgressNotifications.economic) {
    S.victoryProgressNotifications.economic = true;
    toast({
      title: '🏭 Economic Victory Approaching',
      description: `${cities}/10 cities built. Industrial dominance within reach!`
    });
    log(`Economic Victory Progress: ${cities}/10 cities`, 'success');
  }

  // Demographic Victory Progress (60% population)
  const popPercent = totalPop > 0 ? (player.population / totalPop) * 100 : 0;
  if (popPercent >= 45 && popPercent < 60 && (player.instability || 0) < 30 && !S.victoryProgressNotifications.demographic) {
    S.victoryProgressNotifications.demographic = true;
    toast({
      title: '👥 Demographic Victory Approaching',
      description: `Control ${Math.round(popPercent)}% of world population (need 60%)`
    });
    log(`Demographic Victory Progress: ${Math.round(popPercent)}% population control`, 'success');
  }

  // Cultural Victory Progress (50 intel + >50% influence)
  const totalIntel = alive.reduce((sum, n) => sum + (n.intel || 0), 0);
  if (totalIntel > 0) {
    const influenceShare = ((player.intel || 0) / totalIntel) * 100;
    if ((player.intel || 0) >= 40 && influenceShare >= 40 && !S.victoryProgressNotifications.cultural) {
      S.victoryProgressNotifications.cultural = true;
      toast({
        title: '📻 Cultural Victory Approaching',
        description: `${Math.round(influenceShare)}% cultural influence (need 50% + 50 INTEL)`
      });
      log(`Cultural Victory Progress: ${Math.round(influenceShare)}% influence, ${player.intel || 0}/50 INTEL`, 'success');
    }
  }

  // Survival Victory Progress (50 turns)
  if (S.turn >= 40 && S.turn < 50 && player.population >= 50_000_000 && !S.victoryProgressNotifications.survival) {
    S.victoryProgressNotifications.survival = true;
    const turnsLeft = 50 - S.turn;
    toast({
      title: '🛡️ Survival Victory Approaching',
      description: `Survive ${turnsLeft} more turn${turnsLeft !== 1 ? 's' : ''} to achieve victory!`
    });
    log(`Survival Victory Progress: ${S.turn}/50 turns`, 'success');
  }

  // Domination Victory Progress
  const aliveEnemies = alive.filter(n => n.name !== player.name);
  if (aliveEnemies.length <= 2 && aliveEnemies.length > 0 && !S.victoryProgressNotifications.domination) {
    S.victoryProgressNotifications.domination = true;
    toast({
      title: '☢️ Total Domination Approaching',
      description: `Only ${aliveEnemies.length} nation${aliveEnemies.length !== 1 ? 's' : ''} remain!`
    });
    log(`Domination Victory Progress: ${aliveEnemies.length} enemies left`, 'success');
  }
}

// Victory check
function checkVictory() {
  if (S.gameOver) return;

  const player = PlayerManager.get();
  if (!player) return;

  const alive = nations.filter(n => n.population > 0);
  const totalPop = alive.reduce((sum, n) => sum + n.population, 0);

  // Check for political collapse (inspired by Paradox/Total War games)
  const playerGovernance = governanceApiRef?.metrics[player.id];
  if (playerGovernance) {
    const politicalCheck = checkPoliticalGameOver(
      playerGovernance.publicOpinion,
      playerGovernance.cabinetApproval,
      playerGovernance.morale
    );

    if (politicalCheck.gameOver && politicalCheck.reason) {
      endGame(false, politicalCheck.reason);
      return;
    }
  }

  const diplomacyResult = evaluateDiplomaticProgress(player);
  if (diplomacyResult.victory && diplomacyResult.message) {
    endGame(true, diplomacyResult.message);
    return;
  }

  if (player.population <= 0) {
    endGame(false, 'Your nation has been destroyed');
    return;
  }
  
  if (DoomsdayClock.minutes <= 0) {
    endGame(false, 'MUTUAL ASSURED DESTRUCTION');
    return;
  }
  
  if (alive.length === 1 && alive[0] === player) {
    endGame(true, 'TOTAL DOMINATION - You are the sole survivor!');
    return;
  }
  
  // Economic Victory - Enhanced with Phase 3 Economic Depth features
  const cities = player.cities || 1;
  let economicVictory = false;
  let economicVictoryReason = '';

  // Traditional path: 10 cities
  if (cities >= 10) {
    economicVictory = true;
    economicVictoryReason = 'Industrial supremacy achieved through city development!';
  }

  // Phase 3 Economic Depth path: Trade + Refinement + Infrastructure dominance
  if (economicDepthApi) {
    const economicPower = economicDepthApi.calculateEconomicPower();
    
    // economicPower is a number representing total economic strength
    if (typeof economicPower === 'number' && economicPower >= 1000) {
      economicVictory = true;
      economicVictoryReason = `Economic supremacy achieved! (Total Economic Power: ${Math.round(economicPower)})`;
    }
  }

  if (economicVictory) {
    endGame(true, `ECONOMIC VICTORY - ${economicVictoryReason}`);
    return;
  }

  if (totalPop > 0 && player.population / totalPop > 0.6 && (player.instability || 0) < 30) {
    endGame(true, 'DEMOGRAPHIC VICTORY - You control the world through immigration!');
    return;
  }

  // Cultural Victory - enhanced check integrating Cultural Warfare system
  const totalIntel = alive.reduce((sum, n) => sum + (n.intel || 0), 0);
  const totalCulturalPower = alive.reduce((sum, n) => sum + (n.culturalPower || 0), 0);

  if (totalIntel > 0 || totalCulturalPower > 0) {
    const influenceShare = totalIntel > 0 ? (player.intel || 0) / totalIntel : 0;
    const culturalShare = totalCulturalPower > 0 ? (player.culturalPower || 0) / totalCulturalPower : 0;

    // Active propaganda campaigns count toward victory
    const activeCampaigns = (player.propagandaCampaigns || []).length;

    // Cultural influences on other nations
    const dominatedNations = alive.filter(n => {
      if (n.isPlayer) return false;
      const influence = (player.culturalInfluences || []).find(ci => ci.targetNation === n.id);
      return influence && influence.strength >= 70; // 70+ strength = dominated
    }).length;

    // Multiple paths to Cultural Victory:
    // Path 1: Traditional intel dominance (50+ intel, 50%+ share)
    // Path 2: Cultural power dominance (80+ cultural power, 60%+ share)
    // Path 3: Cultural domination (dominate 60%+ of nations through influence)

    const path1Met = (player.intel || 0) >= 50 && influenceShare > 0.5;
    const path2Met = (player.culturalPower || 0) >= 80 && culturalShare > 0.6;
    const path3Met = alive.length > 0 && dominatedNations / alive.length >= 0.6;

    if (path1Met) {
      endGame(true, '📻 CULTURAL VICTORY - Your propaganda dominates the world\'s minds!');
      return;
    } else if (path2Met) {
      endGame(true, '🎭 CULTURAL VICTORY - Your culture has become the world\'s standard!');
      return;
    } else if (path3Met) {
      endGame(true, '🌍 CULTURAL VICTORY - Your influence has won hearts and minds globally!');
      return;
    }
  }

  if (S.turn >= 50 && player.population >= 50_000_000) {
    const score = S.turn * 10 + player.population * 5 + player.missiles * 20;
    endGame(true, `SURVIVAL VICTORY - Endured 50 turns! Score: ${score}`);
    return;
  }
}

// End game
function endGame(victory: boolean, message: string) {
  S.gameOver = true;
  S.endGameRevealRequiresConfirmation = true;

  const player = PlayerManager.get();
  if (!player) return;

  const score = S.turn * 10 + player.population * 5 + player.missiles * 20;
  const timestamp = new Date().toISOString();

  // Count alliances and wars
  const alliances = Object.values(player.treaties || {}).filter((t: any) => t.alliance).length;
  const wars = nations.filter(n => n.id !== player.id && n.population > 0 && !player.treaties?.[n.id]?.alliance).length;

  // Calculate doomsday minutes (from a 7:00 countdown)
  const doomsdayMinutes = Math.max(0, 7 - (5 - S.defcon) * 1.5);

  // Collect comprehensive game statistics
  const statistics = {
    playerName: S.playerName || S.selectedLeader || 'Player',
    leader: S.selectedLeader || 'Unknown Leader',
    doctrine: S.selectedDoctrine || 'None',
    turns: S.turn,
    finalScore: Math.floor(score),
    victory,
    victoryMessage: message,

    // Nation statistics
    finalPopulation: player.population,
    finalProduction: player.production,
    finalCities: player.cities || 0,
    finalMissiles: player.missiles,
    finalBombers: player.bombers || 0,
    finalSubmarines: player.submarines || 0,
    finalDefense: player.defense,
    finalUranium: player.uranium,
    finalIntel: player.intel,

    // Governance
    finalMorale: player.morale,
    finalPublicOpinion: player.publicOpinion,
    finalCabinetApproval: player.cabinetApproval,

    // Military actions
    nukesLaunched: S.statistics?.nukesLaunched || 0,
    nukesReceived: S.statistics?.nukesReceived || 0,
    enemiesDestroyed: S.statistics?.enemiesDestroyed || 0,

    // Diplomacy
    alliances,
    wars,

    // Game state
    finalDefcon: S.defcon,
    doomsdayMinutes,

    timestamp,
  };

  // Save highscore
  const highscores = JSON.parse(Storage.getItem('highscores') || '[]');
  highscores.push({
    name: statistics.playerName,
    doctrine: statistics.doctrine,
    score: statistics.finalScore,
    turns: S.turn,
    date: timestamp
  });
  highscores.sort((a: any, b: any) => b.score - a.score);
  Storage.setItem('highscores', JSON.stringify(highscores.slice(0, 10)));

  // Store statistics for end game screen and delay overlay until animations resolve
  S.endGameStatistics = statistics;
  S.pendingEndGameReveal = undefined;
  S.showEndGameScreen = false;

  if (victory) {
    log('🏆 VICTORY ACHIEVED!', 'success');
    log(`Victory Condition: ${message}`, 'success');
  } else {
    log('DEFEAT!', 'alert');
    log(message, 'alert');
  }
  log(`Final Score: ${Math.floor(score)}`, 'success');
}

// Logging function
function log(msg: string, type: string = 'normal') {
  const logEl = document.getElementById('log');
  if (!logEl) return;
  
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.textContent = `[T${S.turn}] ${msg}`;
  logEl.appendChild(entry);
  logEl.scrollTop = logEl.scrollHeight;
  
  // Keep log size manageable
  if (logEl.children.length > 100) {
    logEl.removeChild(logEl.firstChild!);
  }
}

// AI Turn - Complete strategic decision making
function aiTurn(n: Nation) {
  // AI name already shown in right-side panel during AI turns
  if (n.population <= 0) return;

  maybeBanter(n, 0.5); // Increased visibility
  
  // Determine AI personality modifiers
  let aggressionMod = 0;
  let defenseMod = 0;
  let economicMod = 0;
  let intelMod = 0;
  
  switch (n.aiPersonality) {
    case 'aggressive':
      aggressionMod = 0.3;
      defenseMod = -0.1;
      economicMod = 0.0;
      intelMod = 0.1;
      break;
    case 'defensive':
      aggressionMod = -0.2;
      defenseMod = 0.3;
      economicMod = 0.1;
      intelMod = 0.1;
      break;
    case 'balanced':
      aggressionMod = 0.0;
      defenseMod = 0.1;
      economicMod = 0.15;
      intelMod = 0.15;
      break;
    case 'isolationist':
      aggressionMod = -0.3;
      defenseMod = 0.2;
      economicMod = 0.2;
      intelMod = 0.0;
      break;
    case 'trickster':
      aggressionMod = 0.1;
      defenseMod = 0.0;
      economicMod = 0.05;
      intelMod = 0.35;
      break;
    case 'chaotic':
      aggressionMod = 0.2;
      defenseMod = -0.1;
      economicMod = 0.1;
      intelMod = 0.2;
      break;
  }
  
  // Calculate threats and priorities
  const enemies = nations.filter(t => 
    t !== n && 
    t.population > 0 && 
    !n.treaties?.[t.id]?.truceTurns
  );
  
  const player = PlayerManager.get();
  const playerThreat = player ? (n.threats?.[player.id] || 0) : 0;

  // Strategic decision tree
  const r = Math.random();

  if (aiHandleDiplomaticUrgencies(n, nations, log)) {
    return;
  }

  // Check if AI wants to initiate a proposal to the player
  if (player && !n.isPlayer) {
    // ENHANCED: Pass nations array to enable advanced trigger system
    const proposal = shouldAIInitiateProposal(n, player, S.turn, undefined, nations);
    if (proposal) {
      // Queue the proposal to show to player
      if (enqueueAIProposalRef) {
        enqueueAIProposalRef(proposal);
      } else {
        console.warn('[ai] Pending AI proposal handler missing; dropping proposal', proposal);
      }
      log(`${n.name} has sent a diplomatic proposal to ${player.name}.`);
      return;
    }
  }

  // UNIFIED DIPLOMACY: AI proactive diplomacy actions
  const diplomacyBias = 0.18 + Math.max(0, defenseMod * 0.5) + (n.aiPersonality === 'defensive' ? 0.1 : 0) + (n.aiPersonality === 'balanced' ? 0.05 : 0);
  if (Math.random() < diplomacyBias) {
    // Try unified diplomacy first
    const potentialTargets = nations.filter(t => t !== n && !t.eliminated);
    for (const target of potentialTargets) {
      const { action, reason } = considerDiplomaticAction(n, target, nations, S.turn);
      if (action) {
        
        // For now, just create a proposal to player if target is player
        if (target.isPlayer && player) {
          const proposal: DiplomaticProposal = {
            id: `ai-${n.id}-${target.id}-${S.turn}`,
            type: action,
            proposerId: n.id,
            targetId: target.id,
            message: `${n.name} proposes ${action}`,
            turn: S.turn,
            playerInitiated: false,
          };
          
          if (enqueueAIProposalRef) {
            enqueueAIProposalRef(proposal);
            log(`${n.name} proposes ${action} to ${target.name}`);
            return;
          }
        } else if (!target.isPlayer) {
          // AI-to-AI diplomacy - auto-accept if relationship is good enough
          log(`${n.name} ${action}s with ${target.name} (${reason})`);
          
          // Update relationships
          if (action === 'alliance') {
            applyRelationshipChange(nations, n.id, target.id, 40, `Alliance formed`, S.turn);
            n.alliances = n.alliances || [];
            if (!n.alliances.includes(target.id)) n.alliances.push(target.id);
            target.alliances = target.alliances || [];
            if (!target.alliances.includes(n.id)) target.alliances.push(n.id);
          } else if (action === 'truce') {
            applyRelationshipChange(nations, n.id, target.id, 15, `Truce agreed`, S.turn);
          } else if (action === 'aid') {
            applyRelationshipChange(nations, n.id, target.id, 10, `Aid sent`, S.turn);
          }
          return;
        }
      }
    }
    
    // Fallback to old system if unified diplomacy didn't trigger
    if (aiAttemptDiplomacy(n, nations, log)) {
      return;
    }
  }

  // 1. RESEARCH - Advance technology
  if (r < 0.08 + intelMod && !n.researchQueue) {
    const availableResearch = RESEARCH_TREE.filter(project => {
      if (n.researched?.[project.id]) return false;
      if (project.prerequisites?.some(prereq => !n.researched?.[prereq])) return false;
      return canAfford(n, project.cost);
    });
    
    if (availableResearch.length > 0) {
      const project = availableResearch.sort((a, b) => {
        // Prioritize warheads for aggressive AI
        if (a.category === 'warhead' && n.aiPersonality === 'aggressive') return -1;
        if (b.category === 'warhead' && n.aiPersonality === 'aggressive') return 1;
        // Prioritize defense for defensive AI
        if (a.category === 'defense' && n.aiPersonality === 'defensive') return -1;
        if (b.category === 'defense' && n.aiPersonality === 'defensive') return 1;
        return 0;
      })[0];
      
      if (canAfford(n, project.cost)) {
        pay(n, project.cost);
        n.researchQueue = { projectId: project.id, turnsRemaining: project.turns, totalTurns: project.turns };
        log(`${n.name} begins research: ${project.name}`);
        return;
      }
    }
  }
  
  // 2. INTELLIGENCE OPERATIONS
  if (r < 0.15 + intelMod && n.intel >= 5) {
    const intelTargets = enemies.filter(t => !n.satellites?.[t.id]);
    
    // Deploy satellite
    if (intelTargets.length > 0 && n.intel >= 5 && Math.random() < 0.6) {
      const target = intelTargets.sort((a, b) => {
        const aThreat = n.threats?.[a.id] || 0;
        const bThreat = n.threats?.[b.id] || 0;
        return bThreat - aThreat;
      })[0];
      
      n.intel -= 5;
      n.satellites = n.satellites || {};
      n.satellites[target.id] = S.turn + 5; // Expires after 5 turns
      log(`${n.name} deploys satellite over ${target.name}`);
      registerSatelliteOrbit(n.id, target.id);
      return;
    }
    
    // Sabotage enemy warheads
    if (n.intel >= 10 && Math.random() < 0.3) {
      const sabotageTargets = enemies.filter(t => 
        Object.values(t.warheads || {}).some(count => (count || 0) > 0)
      );
      
      if (sabotageTargets.length > 0) {
        const target = sabotageTargets.sort((a, b) => {
          const aThreat = n.threats?.[a.id] || 0;
          const bThreat = n.threats?.[b.id] || 0;
          return bThreat - aThreat;
        })[0];
        
        const warheadTypes = Object.keys(target.warheads || {}).filter(key => 
          (target.warheads?.[Number(key)] || 0) > 0
        );
        
        if (warheadTypes.length > 0) {
          const type = warheadTypes[Math.floor(Math.random() * warheadTypes.length)];
          const numericType = Number(type);
          if (target.warheads) {
            target.warheads[numericType] = Math.max(0, (target.warheads[numericType] || 0) - 1);
            if (target.warheads[numericType] <= 0) {
              delete target.warheads[numericType];
            }
          }
          n.intel -= 10;
          log(`${n.name} sabotages ${target.name}'s ${type}MT warhead`);
          return;
        }
      }
    }
    
    // Propaganda warfare
    if (n.intel >= 15 && Math.random() < 0.25) {
      const target = enemies[Math.floor(Math.random() * enemies.length)];
      n.intel -= 15;
      target.instability = (target.instability || 0) + 20;
      log(`${n.name} launches propaganda against ${target.name}`);
      return;
    }
  }
  
  // 3. CULTURE WARFARE
  if (r < 0.12 + intelMod && n.intel >= 2) {
    const cultureTargets = enemies.filter(t => t.population > 5);
    
    if (cultureTargets.length > 0 && n.intel >= 20 && Math.random() < 0.15) {
      // Culture bomb
      const target = cultureTargets.sort((a, b) => b.population - a.population)[0];
      const stolen = Math.max(1, Math.floor(target.population * 0.1));
      n.intel -= 20;
      target.population = Math.max(0, target.population - stolen);
      n.population += stolen;
      n.migrantsThisTurn = (n.migrantsThisTurn || 0) + stolen;
      n.migrantsTotal = (n.migrantsTotal || 0) + stolen;
      log(`${n.name} culture bombs ${target.name}, stealing ${stolen}M population`);
      return;
    } else if (n.intel >= 2 && Math.random() < 0.2) {
      // Meme wave
      const target = enemies[Math.floor(Math.random() * enemies.length)];
      const stolen = Math.min(5, Math.max(1, Math.floor(target.population * 0.02)));
      n.intel -= 2;
      target.population = Math.max(0, target.population - stolen);
      n.population += stolen;
      n.migrantsThisTurn = (n.migrantsThisTurn || 0) + stolen;
      n.migrantsTotal = (n.migrantsTotal || 0) + stolen;
      target.instability = (target.instability || 0) + 8;
      log(`${n.name} launches meme wave against ${target.name}`);
      return;
    }
  }
  
  // 4. MILITARY STRIKE - Attack if aggressive and at low DEFCON
  if (r < 0.35 + aggressionMod && S.defcon <= 2 && enemies.length > 0) {
    const target = enemies.sort((a, b) => {
      const compute = (t: Nation) => {
        const threat = n.threats ? (n.threats[t.id] || 0) : 0;
        let score = threat;
        const aiType = n.aiPersonality || '';
        if (aiType === 'balanced') score *= 1.0;
        else if (aiType === 'isolationist') score *= 1.5;
        else if (aiType === 'aggressive') score *= 1.2;
        const defWeight = aiType === 'aggressive' ? 0.4 : aiType === 'balanced' ? 0.6 : aiType === 'isolationist' ? 0.8 : 0.5;
        score -= (t.defense || 0) * defWeight;
        if (t.isPlayer) score += 5;
        return score;
      };
      return compute(b) - compute(a);
    })[0];
    
    const availableYields = Object.entries(n.warheads || {})
      .filter(([, count]) => (count || 0) > 0)
      .map(([yieldStr]) => Number(yieldStr))
      .sort((a, b) => b - a);

    const yieldMT = availableYields.find(value =>
      (value <= 50 && S.defcon <= 2) || (value > 50 && S.defcon === 1)
    );

    if (yieldMT !== undefined && n.missiles > 0) {
      const launchSucceeded = launch(n, target, yieldMT);
      if (launchSucceeded) {
        maybeBanter(n, 0.9, 'launch'); // Increased with specific pool
        if (target.isPlayer) {
          maybeBanter(n, 0.8, 'reactive_hit'); // Increased with specific pool
        }
        return;
      }
    }
  }
  
  // 5. BUILD MILITARY - Missiles and warheads
  if (r < 0.50 + aggressionMod) {
    // Build advanced warheads if researched
    const warheadYields = [200, 100, 50, 40, 20, 10];
    for (const yieldMT of warheadYields) {
      const researchId = `warhead_${yieldMT}`;
      if (n.researched?.[researchId]) {
        const cost = COSTS[`warhead_${yieldMT}` as keyof typeof COSTS];
        if (cost && canAfford(n, cost)) {
          pay(n, cost);
          n.warheads = n.warheads || {};
          n.warheads[yieldMT] = (n.warheads[yieldMT] || 0) + 1;
          log(`${n.name} builds ${yieldMT}MT warhead`);
          return;
        }
      }
    }
    
    // Build missiles
    if (canAfford(n, COSTS.missile) && n.missiles < 15) {
      pay(n, COSTS.missile);
      n.missiles++;
      log(`${n.name} builds missile`);
      maybeBanter(n, 0.5, 'build'); // Increased with specific pool
      return;
    }
    
    // Build bombers
    if (canAfford(n, COSTS.bomber) && (n.bombers || 0) < 5 && Math.random() < 0.3) {
      pay(n, COSTS.bomber);
      n.bombers = (n.bombers || 0) + 1;
      log(`${n.name} builds bomber`);
      return;
    }
  }
  
  // 6. BUILD DEFENSE
  if (r < 0.65 + defenseMod) {
    const currentDefense = n.defense ?? 0;
    if (n.researched?.defense_grid && canAfford(n, COSTS.defense) && currentDefense < MAX_DEFENSE_LEVEL) {
      pay(n, COSTS.defense);
      n.defense = clampDefenseValue(currentDefense + 2);
      log(`${n.name} upgrades defense`);
      return;
    }
  }
  
  // 7. ECONOMIC EXPANSION
  if (r < 0.80 + economicMod) {
    const maxCities = n.aiPersonality === 'isolationist' ? 5 : n.aiPersonality === 'balanced' ? 4 : 3;
    if ((n.cities || 1) < maxCities) {
      const cityCost = getCityCost(n);
      if (canAfford(n, cityCost)) {
        pay(n, cityCost);
        n.cities = (n.cities || 1) + 1;
        
        const spread = 6;
        const angle = Math.random() * Math.PI * 2;
        const newLat = n.lat + Math.sin(angle) * spread;
        const newLon = n.lon + Math.cos(angle) * spread;
        CityLights.addCity(newLat, newLon, 1.0);

        log(`${n.name} builds city #${n.cities}`);
        maybeBanter(n, 0.6, 'build'); // Increased with specific pool
        return;
      }
    }
  }
  
  // 8. ENHANCED DEFCON MANAGEMENT - Personality-based escalation/de-escalation
  const playerRelationship = getRelationship(n, PlayerManager.get()?.id || '', nations);
  const aiPersonality = n.ai || 'balanced';

  // CRITICAL: Emergency peace proposals at DEFCON 1
  if (S.defcon === 1 && !n.atWar && Math.random() < 0.6) {
    handleDefconChange(1, `${n.name} makes desperate plea for de-escalation to avoid nuclear war`, 'ai', {
      onAudioTransition: AudioSys.handleDefconTransition,
      onLog: log,
      onNewsItem: (cat, msg) => window.__gameAddNewsItem?.(cat, msg, 'critical'),
      onUpdateDisplay: updateDisplay,
      onShowModal: window.__gameSetDefconChangeEvent,
    });
    log(`☮️ ${n.name} urgently proposes peace talks to avert catastrophe!`, 'diplomatic');
    return;
  }

  // Aggressive AI: More likely to escalate, especially if relationships are poor
  if (aiPersonality === 'aggressive' && S.defcon > 1) {
    const escalationChance = playerRelationship < -30 ? 0.35 : 0.25;
    if (r < 0.90 + aggressionMod && Math.random() < escalationChance) {
      const messages = [
        `${n.name} conducts aggressive military exercises`,
        `${n.name} escalates tensions with provocative maneuvers`,
        `${n.name} demonstrates military strength through saber-rattling`,
      ];
      handleDefconChange(-1, messages[Math.floor(Math.random() * messages.length)], 'ai', {
        onAudioTransition: AudioSys.handleDefconTransition,
        onLog: log,
        onNewsItem: (cat, msg, prio) => window.__gameAddNewsItem?.(cat, msg, prio),
        onUpdateDisplay: updateDisplay,
        onShowModal: window.__gameSetDefconChangeEvent,
      });
      maybeBanter(n, 0.7); // Increased visibility
      return;
    }
  }

  // Defensive/Peaceful AI: Actively tries to de-escalate at low DEFCON
  if ((aiPersonality === 'defensive' || aiPersonality === 'isolationist') && S.defcon <= 3) {
    const deescalationChance = S.defcon <= 2 ? 0.5 : 0.3;
    if (Math.random() < deescalationChance) {
      const messages = [
        `${n.name} proposes emergency peace talks`,
        `${n.name} signals willingness to reduce military readiness`,
        `${n.name} calls for diplomatic crisis resolution`,
      ];
        handleDefconChange(1, messages[Math.floor(Math.random() * messages.length)], 'ai', {
        onAudioTransition: AudioSys.handleDefconTransition,
        onLog: log,
        onNewsItem: (cat, msg) => window.__gameAddNewsItem?.(cat, msg, S.defcon <= 2 ? 'urgent' : 'important'),
        onUpdateDisplay: updateDisplay,
        onShowModal: window.__gameSetDefconChangeEvent,
      });
      return;
    }
  }

  // Balanced AI: Context-dependent behavior
  if (aiPersonality === 'balanced') {
    // Try to de-escalate if good relations and low DEFCON
    if (playerRelationship > 50 && S.defcon <= 3 && Math.random() < 0.4) {
      handleDefconChange(1, `${n.name} leverages good relations to reduce tensions`, 'ai', {
        onAudioTransition: AudioSys.handleDefconTransition,
        onLog: log,
        onNewsItem: addNewsItem,
        onUpdateDisplay: updateDisplay,
        onShowModal: window.__gameSetDefconChangeEvent,
      });
      return;
    }
    // Escalate if poor relations
    else if (playerRelationship < -30 && S.defcon > 1 && Math.random() < 0.25) {
      handleDefconChange(-1, `${n.name} responds to perceived threats with increased military readiness`, 'ai', {
        onAudioTransition: AudioSys.handleDefconTransition,
        onLog: log,
        onNewsItem: addNewsItem,
        onUpdateDisplay: updateDisplay,
        onShowModal: window.__gameSetDefconChangeEvent,
      });
      return;
    }
  }

  // 9. DIPLOMACY - Occasionally de-escalate if defensive
  if (n.aiPersonality === 'defensive' || n.aiPersonality === 'balanced') {
    if (S.defcon < 5 && Math.random() < 0.1) {
      handleDefconChange(1, `${n.name} proposes diplomatic de-escalation`, 'ai', {
        onAudioTransition: AudioSys.handleDefconTransition,
        onLog: log,
        onNewsItem: addNewsItem,
        onUpdateDisplay: updateDisplay,
        onShowModal: window.__gameSetDefconChangeEvent,
      });
      maybeBanter(n, 0.3);
      return;
    }
  }

  // 10. CULTURAL VICTORY ATTEMPT - Check if AI has achieved cultural dominance
  const totalIntel = nations.reduce((sum, nation) => sum + (nation.intel || 0), 0);
  if (n.intel >= 50 && totalIntel > 0) {
    const influenceShare = n.intel / totalIntel;
    // AI attempts cultural victory if they have >50% influence
    if (influenceShare > 0.5 && Math.random() < 0.8) {
      n.intel -= 50;
      log(`${n.name} achieves CULTURAL VICTORY through propaganda dominance!`);
      endGame(false, `${n.name} wins through cultural hegemony - their propaganda has conquered the world's minds!`);
      return;
    }
  }

  // 11. ENHANCED AI ACTIONS - Cyber, Immigration, Conventional Warfare
  const enhancedActionExecuted = enhancedAIActions(
    n,
    nations,
    S.turn,
    COSTS,
    {
      templates: window.__conventionalWarfare?.templates,
      trainUnit: window.__conventionalWarfare?.trainUnit,
      deployUnit: window.__conventionalWarfare?.deployUnit,
      resolveBorderConflict: window.__conventionalWarfare?.resolveBorderConflict,
      getUnitsForNation: window.__conventionalWarfare?.getUnitsForNation,
      getTerritoriesForNation: window.__conventionalWarfare?.getTerritoriesForNation,
      getDeployableTerritories: window.__conventionalWarfare?.getDeployableTerritories,
      territories: window.__conventionalWarfare?.territories,
    },
    {
      launchCyberAttack: window.__cyberWarfare?.launchCyberAttack,
    },
    log
  );

  if (enhancedActionExecuted) {
    updateDisplay();
    return;
  }

  // @ts-expect-error - Legacy cyber warfare
  const cyberOutcome = window.__cyberAiPlan?.(n.id);
  // @ts-expect-error - Legacy cyber warfare
  if (cyberOutcome?.executed) {
    updateDisplay();
  }

  // NOTE: Conventional AI temporarily disabled during refactoring
  /*
  // NEW: Risk-style conventional warfare AI
  if (window.__conventionalAI) {
    const aiDecisions = window.__conventionalAI.makeAITurn(
      n.id,
      conventionalTerritories,
      window.__conventionalAI.getReinforcements(n.id)
    );

    // Execute reinforcements
    for (const decision of aiDecisions.reinforcements) {
      if (decision.toTerritoryId) {
        window.__conventionalAI.placeReinforcements(n.id, decision.toTerritoryId, decision.armies || 3);
        log(`${n.name}: ${decision.reason}`);
      }
    }

    // Execute attacks
    for (const decision of aiDecisions.attacks) {
      if (decision.fromTerritoryId && decision.toTerritoryId && decision.armies) {
        const result = window.__conventionalAI.attack(
          decision.fromTerritoryId,
          decision.toTerritoryId,
          decision.armies
        );
        if (result?.success) {
          log(`${n.name}: ${decision.reason} - ${result.attackerVictory ? 'Victory!' : 'Repelled'}`);
          if (result.attackerVictory) {
            maybeBanter(n, 0.6);
          }
        }
      }
    }

    // Execute moves
    for (const decision of aiDecisions.moves) {
      if (decision.fromTerritoryId && decision.toTerritoryId && decision.armies) {
        window.__conventionalAI.move(decision.fromTerritoryId, decision.toTerritoryId, decision.armies);
        log(`${n.name}: ${decision.reason}`);
      }
    }

    updateDisplay();
  }
  */
}

// Global flag to prevent multiple simultaneous endTurn calls
let turnInProgress = false;
// Track all AI turn timeouts for proper cleanup
let aiTurnTimeouts: ReturnType<typeof setTimeout>[] = [];

// End turn
function endTurn() {
  console.log('[Turn Debug] endTurn called, current phase:', S.phase, 'gameOver:', S.gameOver, 'turnInProgress:', turnInProgress);

  // Clear any pending AI turn timeouts from previous turn to prevent memory leaks
  if (aiTurnTimeouts.length > 0) {
    aiTurnTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    aiTurnTimeouts = [];
  }

  // Guard: prevent multiple simultaneous calls
  if (turnInProgress) {
    console.warn('[Turn Debug] Blocked: Turn already in progress');
    return;
  }

  if (S.gameOver) {
    if (S.endGameRevealRequiresConfirmation) {
      console.log('[Turn Debug] Confirming end game reveal');
      confirmEndGameReveal();
    } else {
      console.log('[Turn Debug] Blocked: gameOver state with no pending confirmation');
    }
    return;
  }

  if (S.phase !== 'PLAYER') {
    console.log('[Turn Debug] Blocked: not in PLAYER phase');
    return;
  }

  const player = PlayerManager.get();
  const playerNationName = player?.name ?? 'Player';

  // Set flag to prevent re-entry
  turnInProgress = true;
  notifyPhaseTransition(true);

  // Track the safety timer so it can be cleared after successful completion
  let safetyTimeout: ReturnType<typeof setTimeout> | null = null;

  S.actionsRemaining = 0;
  S.phase = 'AI';
  console.log('[Turn Debug] Phase set to AI, turn lock acquired');
  updateDisplay();
  
  const aiNations = nations.filter(n => !n.isPlayer && n.population > 0);
  const actionsPerAI = S.defcon >= 4 ? 1 : S.defcon >= 2 ? 2 : 3;
  console.log('[Turn Debug] AI nations:', aiNations.length, 'actions per AI:', actionsPerAI);
  
  let aiActionCount = 0;
  aiNations.forEach(ai => {
    for (let i = 0; i < actionsPerAI; i++) {
      const timeoutId = setTimeout(() => {
        try {
          console.log('[Turn Debug] AI turn executing for', ai.name);
          aiTurn(ai);
        } catch (error) {
          console.error('[Turn Debug] ERROR in AI turn for', ai.name, ':', error);
        }
      }, 500 * aiActionCount++);
      aiTurnTimeouts.push(timeoutId);
    }
  });
  
  // Compute dynamic safety timeout to cover the full AI + production sequence
  const resolutionDelay = aiActionCount * 500 + 500;
  const productionPhaseDelay = 1500;
  const safetyBuffer = 3000;
  const minimumSafetyTimeout = 30000;
  const computedSafetyTimeout = Math.max(
    minimumSafetyTimeout,
    resolutionDelay + productionPhaseDelay + safetyBuffer
  );

  safetyTimeout = setTimeout(() => {
    if (turnInProgress) {
      console.error('[Turn Debug] SAFETY: Force-releasing turn lock after timeout');
      turnInProgress = false;
      if (S.phase !== 'PLAYER') {
        S.phase = 'PLAYER';
        S.actionsRemaining = S.defcon >= 4 ? 1 : S.defcon >= 2 ? 2 : 3;
        updateDisplay();
      }
      notifyPhaseTransition(false);
    }
    safetyTimeout = null;
  }, computedSafetyTimeout);
  aiTurnTimeouts.push(safetyTimeout);

  console.log(
    '[Turn Debug] Resolution phase scheduled in',
    resolutionDelay,
    'ms (safety timeout:',
    computedSafetyTimeout,
    'ms)'
  );
  
  const resolutionTimeoutId = setTimeout(() => {
    try {
      console.log('[Turn Debug] RESOLUTION phase starting');
      S.phase = 'RESOLUTION';
      updateDisplay();
      resolutionPhase();
    } catch (error) {
      console.error('[Turn Debug] ERROR in RESOLUTION phase:', error);
      log('⚠️ Error in resolution phase - continuing turn', 'warning');
    }

    const productionTimeoutId = setTimeout(() => {
      try {
        console.log('[Turn Debug] PRODUCTION phase starting');
        S.phase = 'PRODUCTION';
        if (globalRNG) {
          productionPhase(globalRNG);
        }
      } catch (error) {
        console.error('[Turn Debug] ERROR in PRODUCTION phase:', error);
        log('⚠️ Error in production phase - continuing turn', 'warning');
      }

      try {
        // Apply policy effects for player nation
        const policySystem = policySystemRef;

        try {
          if (player && policySystem?.totalEffects) {
            const effects = policySystem.totalEffects;

            // Apply per-turn resource gains/costs
            if (effects.goldPerTurn) {
              player.gold = Math.max(0, (player.gold || 0) + effects.goldPerTurn);
            }
            if (effects.uraniumPerTurn) {
              addStrategicResource(player, 'uranium', effects.uraniumPerTurn);
            }
            if (effects.intelPerTurn) {
              player.intel = Math.max(0, (player.intel || 0) + effects.intelPerTurn);
            }

            // Apply maintenance costs for active policies
            const maintenanceGovernanceDelta: GovernanceDelta = {
              morale: 0,
              publicOpinion: 0,
            };

            policySystem.activePolicies.forEach((activePolicy) => {
              const policy = getPolicyById(activePolicy.policyId);
              if (policy?.maintenanceCost) {
                if (policy.maintenanceCost.gold) {
                  player.gold = Math.max(0, (player.gold || 0) - policy.maintenanceCost.gold);
                }
                if (policy.maintenanceCost.intel) {
                  player.intel = Math.max(0, (player.intel || 0) - policy.maintenanceCost.intel);
                }
                if (policy.maintenanceCost.moralePerTurn) {
                  maintenanceGovernanceDelta.morale =
                    (maintenanceGovernanceDelta.morale || 0) + policy.maintenanceCost.moralePerTurn;
                }
                if (policy.maintenanceCost.approvalPerTurn) {
                  maintenanceGovernanceDelta.publicOpinion =
                    (maintenanceGovernanceDelta.publicOpinion || 0) + policy.maintenanceCost.approvalPerTurn;
                }
              }
            });

            if (
              governanceApiRef?.applyGovernanceDelta &&
              (maintenanceGovernanceDelta.morale !== 0 || maintenanceGovernanceDelta.publicOpinion !== 0)
            ) {
              governanceApiRef.applyGovernanceDelta(player.id, maintenanceGovernanceDelta);
            }

            // Apply governance modifiers from policies
            if (governanceApiRef?.metrics[player.id]) {
              const delta: GovernanceDelta = {
                morale: effects.moraleModifier || 0,
                publicOpinion: effects.publicOpinionModifier || 0,
                cabinetApproval: effects.cabinetApprovalModifier || 0,
                instability: effects.instabilityModifier || 0,
              };
              governanceApiRef.applyGovernanceDelta(player.id, delta);
            }
          }
        } catch (error) {
          console.error('[Turn Debug] ERROR applying policy effects:', error);
          log('⚠️ Error applying policy effects - continuing turn', 'warning');
        } finally {
          try {
            const focusApi = focusApiRef;
            const focusTurnCompletions = focusApi?.processTurnFocusProgress?.() ?? [];

            if (focusTurnCompletions.length > 0) {
              focusTurnCompletions.forEach((completion) => {
                const nation = nations.find((entry) => entry.id === completion.nationId);
                const nationName = nation?.name ?? completion.nationId;
                const priority: NewsItem['priority'] = nation?.isPlayer ? 'important' : 'routine';
                window.__gameAddNewsItem?.(
                  'governance',
                  `${nationName} completes national focus: ${completion.focusName}`,
                  priority
                );
              });
            }

            // Apply national focus effects for player nation
            if (player && focusApi) {
              const completedFocuses = focusApi.getCompletedFocuses(player.id);
              let focusGoldPerTurn = 0;
              let focusIntelPerTurn = 0;

              completedFocuses.forEach((focus) => {
                focus.effects.forEach((effect) => {
                  if (effect.statChanges) {
                    if (effect.statChanges.goldPerTurn) {
                      focusGoldPerTurn += effect.statChanges.goldPerTurn;
                    }
                    if (effect.statChanges.intelPerTurn) {
                      focusIntelPerTurn += effect.statChanges.intelPerTurn;
                    }
                  }
                });
              });

              if (focusGoldPerTurn !== 0) {
                player.gold = Math.max(0, (player.gold || 0) + focusGoldPerTurn);
              }
              if (focusIntelPerTurn !== 0) {
                player.intel = Math.max(0, (player.intel || 0) + focusIntelPerTurn);
              }
            }
          } catch (error) {
            console.error('[Turn Debug] ERROR processing focus progression:', error);
            log('⚠️ Error processing national focus progression - continuing turn', 'warning');
          }
        }

        // Apply international pressure effects (aid and sanctions) for player nation
        if (player) {
          processInternationalPressureTurnFn?.();
          const economicImpact =
            getTotalEconomicImpactFn?.(player.id) ?? { productionPenalty: 0, goldPenalty: 0 };
          const aidBenefits = getAidBenefitsFn?.(player.id) ?? ({} as AidPackage['benefits']);
          const previousGoldPenalty = pressureDeltaState.goldPenalty;
          const previousAidGold = pressureDeltaState.aidGold;
          const currentGoldPenalty = economicImpact.goldPenalty ?? 0;
          const currentAidGold = aidBenefits.goldPerTurn ?? 0;
          const activeSanctionPackages = (() => {
            if (!player || !getPressureFn || !getActiveSanctionsFn) {
              return [] as SanctionPackage[];
            }

            const playerPressure = getPressureFn(player.id);
            if (!playerPressure?.activeSanctions?.length) {
              return [] as SanctionPackage[];
            }

            const activeSanctionIds = new Set(playerPressure.activeSanctions);
            return getActiveSanctionsFn().filter((pkg) => activeSanctionIds.has(pkg.id));
          })();
          const imposingNationNames = getImposingNationNamesFromPackages(activeSanctionPackages);
          const imposingLabel =
            imposingNationNames.length > 0 ? imposingNationNames.join(', ') : 'foreign powers';

          if (currentGoldPenalty !== previousGoldPenalty) {
            if (currentGoldPenalty > 0) {
              window.__gameAddNewsItem?.(
                'diplomatic',
                `${playerNationName} loses ${currentGoldPenalty} gold per turn to foreign sanctions.`,
                'important',
              );
              if (activeSanctionPackages.length > 0) {
                presentSanctionDialog?.(activeSanctionPackages);
              }
              toast({
                title: 'Sanctions drain treasury',
                description: `${playerNationName} forfeits ${currentGoldPenalty} gold this turn under sanctions from ${imposingLabel}.`,
                variant: 'destructive',
              });
            } else if (previousGoldPenalty > 0) {
              window.__gameAddNewsItem?.(
                'diplomatic',
                `Sanctions ease and ${playerNationName} regains trade revenues.`,
                'important',
              );
              toast({
                title: 'Sanctions relief',
                description: `${playerNationName} no longer loses gold to sanctions this turn.`,
              });
            }
          }

          if (currentAidGold !== previousAidGold) {
            if (currentAidGold > 0) {
              window.__gameAddNewsItem?.(
                'diplomatic',
                `${playerNationName} receives ${currentAidGold} gold per turn from aid coalitions.`,
                'info',
              );
              toast({
                title: 'Aid package disbursed',
                description: `${playerNationName} gains ${currentAidGold} gold this turn from international assistance.`,
                variant: 'success',
              });
            } else if (previousAidGold > 0) {
              window.__gameAddNewsItem?.(
                'diplomatic',
                `Aid shipments wind down for ${playerNationName}.`,
                'info',
              );
              toast({
                title: 'Aid concluded',
                description: `${playerNationName} no longer receives gold from international aid this turn.`,
              });
            }
          }

          pressureDeltaState.goldPenalty = currentGoldPenalty;
          pressureDeltaState.aidGold = currentAidGold;

          if (currentGoldPenalty > 0) {
            player.gold = Math.max(0, (player.gold || 0) - currentGoldPenalty);
          }

          if (currentAidGold > 0) {
            player.gold = Math.max(0, (player.gold || 0) + currentAidGold);
          }
        }

      S.turn++;
      S.phase = 'PLAYER';
      S.actionsRemaining = S.defcon >= 4 ? 1 : S.defcon >= 2 ? 2 : 3;

      // Trigger day/night cycle animation
      notifyDayNightUpdate(S.turn);

      // Update formal war state and espionage systems for the new turn
      const casusUpdatedNations = updateCasusBelliForAllNations(nations, S.turn) as LocalNation[];
      nations = casusUpdatedNations;
      GameStateManager.setNations(casusUpdatedNations);
      PlayerManager.setNations(casusUpdatedNations);
      spyNetworkApi?.processTurnStart();
      triggerNationsUpdate?.();

        // Release the turn lock and clear safety timeout
        turnInProgress = false;
        if (safetyTimeout) {
          clearTimeout(safetyTimeout);
          safetyTimeout = null;
        }
        notifyPhaseTransition(false);
        console.log('[Turn Debug] Turn complete! New turn:', S.turn, 'Phase:', S.phase, 'Actions:', S.actionsRemaining, 'turn lock released');
      } catch (error) {
        console.error('[Turn Debug] ERROR in post-production processing:', error);
        log('⚠️ Error completing turn - resetting to player phase', 'alert');
        
        // Ensure turn advances even on error
        S.turn++;
        S.phase = 'PLAYER';
        S.actionsRemaining = S.defcon >= 4 ? 1 : S.defcon >= 2 ? 2 : 3;

        // Trigger day/night cycle animation
        notifyDayNightUpdate(S.turn);

        // Release turn lock
        turnInProgress = false;
        if (safetyTimeout) {
          clearTimeout(safetyTimeout);
          safetyTimeout = null;
        }
        notifyPhaseTransition(false);
        console.log('[Turn Debug] Turn salvaged after error! New turn:', S.turn);
      }

      // Decrement intel operation cooldowns
      nations.forEach(nation => {
        if (nation.intelOperationCooldowns) {
          Object.keys(nation.intelOperationCooldowns).forEach(opType => {
            if (nation.intelOperationCooldowns![opType] > 0) {
              nation.intelOperationCooldowns![opType]--;
              if (nation.intelOperationCooldowns![opType] <= 0) {
                delete nation.intelOperationCooldowns![opType];
              }
            }
          });
        }

        // Clean up expired satellites
        if (nation.satellites) {
          Object.keys(nation.satellites).forEach(targetId => {
            const expiresAtTurn = nation.satellites![targetId];
            if (S.turn >= expiresAtTurn) {
              delete nation.satellites![targetId];
              if (nation.isPlayer) {
                log(`Satellite coverage over target has expired`, 'info');
              }
            }
          });
        }
      });

      // Process Agenda Revelations (Phase 4): Check if hidden agendas should be revealed
      const refreshedPlayer = PlayerManager.get();
      if (refreshedPlayer) {
        const { nations: nationsAfterRevelations, revelations } = processAgendaRevelations(
          nations,
          refreshedPlayer,
          S.turn
        );

        // Update nations array with revealed agendas
        if (revelations.length > 0) {
          nations.length = 0;
          nations.push(...nationsAfterRevelations);
          GameStateManager.setNations(nations);
          PlayerManager.setNations(nations);

          // Show revelation notifications
          revelations.forEach((revelation, index) => {
            const nation = nations.find(n => n.id === revelation.nationId);
            if (nation) {
              console.log(`💡 AGENDA REVEALED: ${nation.name} - ${revelation.agenda.name}`);
              log(`💡 You've learned more about ${nation.name}'s motivations: ${revelation.agenda.name}`, 'success');

              // Show notification modal for the first revelation
              // (If multiple revelations occur, only show one at a time)
              // NOTE: Agenda revelation UI temporarily disabled during refactoring
              /*
              if (index === 0) {
                setAgendaRevelationData({
                  nationName: nation.name,
                  agenda: revelation.agenda,
                });
                setAgendaRevelationOpen(true);
              }
              */
            }
          });
        }
      }

      // Process AI-Initiated Negotiations (Phase 3): AI proactive diplomacy
      if (player) {
        const aiNations = nations.filter(n => !n.isPlayer && !n.eliminated);

        // Use the proper integrated function for AI proactive diplomacy
        const diplomacyResult = processAIProactiveDiplomacy(
          aiNations,
          player,
          nations,
          S.turn,
          log
        );

        // CRITICAL: Apply updated nations from AI-to-AI negotiations
        // AI-to-AI negotiations modify nation states (alliances, resources, etc.)
        nations = diplomacyResult.updatedNations;
        GameStateManager.setNations(nations);
        PlayerManager.setNations(nations);

        // Add new negotiations to state
        // NOTE: AI negotiations UI temporarily disabled during refactoring
        /*
        if (diplomacyResult.negotiations.length > 0) {
          setAiInitiatedNegotiations(prev => [...prev, ...diplomacyResult.negotiations]);
        }
        */
      }

      // Process immigration and culture systems for all nations
      try {
        processImmigrationAndCultureTurn(nations, S);
        GameStateManager.setNations(nations);
        PlayerManager.setNations(nations);
      } catch (error) {
        console.error('Error processing immigration and culture turn:', error);
      }

      // Process ideology system for all nations
      try {
        const ideologyEvents = processIdeologySystemTurn(nations, S);

        // Log ideology events (revolutions, etc.)
        ideologyEvents.forEach(event => {
          if (event.type === 'revolution') {
            log(`🔥 REVOLUTION! ${event.description}`, 'crisis');
          } else if (event.type === 'ideology_change') {
            log(`⚖️ ${event.description}`, 'alert');
          }
        });

        // Generate ideological grievances between incompatible nations
        generateIdeologicalGrievances(nations, S.turn);

        GameStateManager.setNations(nations);
        PlayerManager.setNations(nations);
      } catch (error) {
        console.error('Error processing ideology turn:', error);
      }

      // Process simplified bio-attack effects for all nations
      const messages: string[] = [];
      const updatedNationsFromBio = nations.map(nation => {
        if (nation.eliminated) return nation;

        const result = processAllBioAttacks(nation, S.turn);
        messages.push(...result.messages);

        if (result.totalDamage > 0) {
          log(`${nation.name} suffers ${result.totalDamage.toLocaleString()} casualties from bio-weapons`, 'crisis');
        }

        return result.nation;
      });

      nations = updatedNationsFromBio;
      GameStateManager.setNations(updatedNationsFromBio);
      PlayerManager.setNations(updatedNationsFromBio);

      // Process AI bio-warfare for all AI nations
      const difficulty = S.difficulty || 'medium';
      processAllAINationsBioWarfare(nations, S.turn, difficulty, {
        onLabConstructionStart: (nationId, tier) => {
          const nation = nations.find(n => n.id === nationId);
          if (nation && window.__gameAddNewsItem) {
            window.__gameAddNewsItem('military', `${nation.name} has begun constructing bio-laboratory (Tier ${tier})`, 'alert');
          }
        },
        onPlagueSelected: (nationId, plagueType) => {
          const nation = nations.find(n => n.id === nationId);
          if (nation && window.__gameAddNewsItem) {
            window.__gameAddNewsItem('crisis', `INTELLIGENCE: ${nation.name} has initiated bio-weapon program`, 'critical');
          }
        },
        onNodeEvolved: (nationId, nodeId) => {
          // Silent - too many events otherwise
        },
        onDeployment: (nationId, targets) => {
          const nation = nations.find(n => n.id === nationId);
          if (nation && window.__gameAddNewsItem) {
            window.__gameAddNewsItem('crisis', `ALERT: Bio-weapon deployment detected from ${nation.name}`, 'critical');
          }
        }
      });

      window.__cyberAdvance?.();

      // Find plague owner (nation with active bio-lab and plague)
      const plagueOwner = nations?.find(n => n.bioLab && n.plagueState?.plagueStarted);
      const pandemicResult = window.__pandemicAdvance?.({
        turn: S.turn,
        defcon: S.defcon,
        playerPopulation: player?.population ?? 0,
        difficulty: S.difficulty || 'normal',
        plagueOwnerId: plagueOwner?.id
      });

      const casualtyEntries = Object.entries(pandemicResult?.casualtyTotals ?? {});
      const hasPerNationCasualties = casualtyEntries.some(([, value]) => (value ?? 0) > 0);

      if (pandemicResult && player) {
        // @ts-expect-error - Legacy pandemic result structure
        if (pandemicResult.productionPenalty) {
          // @ts-expect-error - Legacy pandemic result structure
          player.production = Math.max(0, (player.production || 0) - pandemicResult.productionPenalty);
        }
        // @ts-expect-error - Legacy pandemic result structure
        if (pandemicResult.instabilityIncrease) {
          // @ts-expect-error - Legacy pandemic result structure
          player.instability = Math.max(0, (player.instability || 0) + pandemicResult.instabilityIncrease);
        }
        // @ts-expect-error - Legacy pandemic result structure
        if (pandemicResult.actionsPenalty) {
          // @ts-expect-error - Legacy pandemic result structure
          S.actionsRemaining = Math.max(0, S.actionsRemaining - pandemicResult.actionsPenalty);
        }
        // @ts-expect-error - Legacy pandemic result structure
        if (pandemicResult.intelGain) {
          // @ts-expect-error - Legacy pandemic result structure
          player.intel = Math.max(0, (player.intel || 0) + pandemicResult.intelGain);
        }
      }

      let populationAdjusted = false;
      if (casualtyEntries.length > 0) {
        for (const [nationId, deaths] of casualtyEntries) {
          const rawDeaths = deaths ?? 0;
          if (rawDeaths <= 0) continue;

          const nation = nations.find(n => n.id === nationId);
          if (!nation) continue;

          const populationLossMillions = rawDeaths / 1_000_000;
          if (populationLossMillions <= 0) continue;

          if (nation.popGroups && nation.popGroups.length > 0) {
            PopSystemManager.applyCasualties(nation.popGroups, populationLossMillions);
            nation.population = Math.max(0, PopSystemManager.getTotalPopulation(nation.popGroups));
          } else {
            nation.population = Math.max(0, nation.population - populationLossMillions);
          }

          if (nation.isPlayer && player) {
            if (player === nation) {
              player.population = nation.population;
            } else if (player.popGroups && player.popGroups.length > 0) {
              PopSystemManager.applyCasualties(player.popGroups, populationLossMillions);
              player.population = Math.max(0, PopSystemManager.getTotalPopulation(player.popGroups));
            } else {
              player.population = Math.max(0, player.population - populationLossMillions);
            }
          }

          populationAdjusted = true;
        }
      }

      if (!hasPerNationCasualties && pandemicResult?.populationLoss && player) {
        const populationLossMillions = pandemicResult.populationLoss / 1_000_000;
        if (populationLossMillions > 0) {
          if (player.popGroups && player.popGroups.length > 0) {
            PopSystemManager.applyCasualties(player.popGroups, populationLossMillions);
            player.population = Math.max(0, PopSystemManager.getTotalPopulation(player.popGroups));
          } else {
            player.population = Math.max(0, player.population - populationLossMillions);
          }
          populationAdjusted = true;
        }
      }

      if (populationAdjusted) {
        updateDisplay();
      }

      if (pandemicIntegrationEnabledRef || bioWarfareEnabledRef) {
        const globalPandemicCasualties = pandemicStateRef?.casualtyTally ?? 0;
        const plagueKillTotal = plagueStateRef?.plagueCompletionStats?.totalKills ?? 0;
        const hasTurnCasualties = casualtyEntries.some(([, value]) => (value ?? 0) > 0);

        if (hasTurnCasualties || globalPandemicCasualties > 0 || plagueKillTotal > 0) {
          evaluateCasualtyMilestones({
            tracker: casualtyAlertTrackerRef.current,
            pandemicCasualtyTally: globalPandemicCasualties,
            plagueKillTotal,
            casualtyTotalsThisTurn: pandemicResult?.casualtyTotals,
            nations: nations.map((nation) => ({ id: nation.id, name: nation.name })),
            turn: S.turn,
            handlers: {
              openModal,
              addNewsItem,
              buildSummary: (payload: CasualtySummaryPayload) => (
                <CasualtyImpactSummary summary={payload} />
              ),
            },
          });
        }
      }

      // Trigger flashpoint check at start of new turn
      if (window.__gameTriggerFlashpoint) {
        const flashpoint = window.__gameTriggerFlashpoint(S.turn, S.defcon);
        if (flashpoint) {
          window.__gameAddNewsItem?.('crisis', `CRITICAL: ${flashpoint.title}`, 'critical');
        }
      }

      // Check for AI regime changes (inspired by Hearts of Iron 4 & Civilization 6)
      const aiNationsForRegimeCheck = nations.filter(n => !n.isPlayer && n.population > 0);
      aiNationsForRegimeCheck.forEach(nation => {
        const metrics = governanceApiRef?.metrics[nation.id];
        if (!metrics || !governanceApiRef) return;

        const shouldChange = shouldRegimeChangeOccur(
          nation.instability || 0,
          metrics.publicOpinion,
          metrics.morale,
          metrics.cabinetApproval,
          false // We'd need to track failed elections to pass true here
        );

        if (shouldChange && nation.aiPersonality) {
          const result = executeRegimeChange(
            nation.aiPersonality as AIPersonality,
            nation.leader,
            nation.instability || 0
          );

          if (result.occurred && result.newPersonality && result.newLeader && result.newMetrics) {
            // Apply regime change
            nation.aiPersonality = result.newPersonality;
            nation.ai = result.newPersonality;
            nation.leader = result.newLeader;

            // Apply military losses (divisions, missiles reduced)
            if (result.militaryLosses) {
              nation.missiles = Math.floor(nation.missiles * (1 - result.militaryLosses));
              if (nation.bombers) {
                nation.bombers = Math.floor(nation.bombers * (1 - result.militaryLosses));
              }
              if (nation.submarines) {
                nation.submarines = Math.floor(nation.submarines * (1 - result.militaryLosses));
              }
            }

            // Reset governance metrics
            governanceApiRef.applyGovernanceDelta(nation.id, {
              morale: result.newMetrics.morale - metrics.morale,
              publicOpinion: result.newMetrics.publicOpinion - metrics.publicOpinion,
              cabinetApproval: result.newMetrics.cabinetApproval - metrics.cabinetApproval,
              electionTimer: result.newMetrics.electionTimer - metrics.electionTimer,
            });

            nation.instability = result.newMetrics.instability;

            // Generate breaking news
            const newsItem = generateRegimeChangeNews(nation.name, result);
            if (window.__gameAddNewsItem) {
              window.__gameAddNewsItem('crisis', newsItem.text, newsItem.priority);
            }
          }
        }
      });

      // Generate political warnings for player
      const playerForWarnings = PlayerManager.get();
      if (playerForWarnings) {
        const playerMetrics = governanceApiRef?.metrics[playerForWarnings.id];
        if (playerMetrics) {
          const warnings = generatePoliticalWarnings(
            playerMetrics.publicOpinion,
            playerMetrics.cabinetApproval,
            playerMetrics.morale
          );

          warnings.forEach(warning => {
            if (window.__gameAddNewsItem) {
              window.__gameAddNewsItem('crisis', warning.text, warning.priority);
            }
          });
        }
      }

      // Generate enhanced political news (every 2-3 turns)
      if (window.__gameAddNewsItem && S.turn % 2 === 0) {
        const newsNations = nations
          .filter(n => n.population > 0)
          .map(n => {
            const metrics = governanceApiRef?.metrics[n.id];
            return {
              name: n.name,
              morale: metrics?.morale || 60,
              publicOpinion: metrics?.publicOpinion || 60,
              cabinetApproval: metrics?.cabinetApproval || 60,
              instability: n.instability || 0,
              ai: (n.aiPersonality || 'balanced') as AIPersonality,
              isPlayer: n.isPlayer,
            };
          });

        const turnNews = generateTurnNews(newsNations, S.turn);
        turnNews.forEach(item => {
          window.__gameAddNewsItem(item.category, item.text, item.priority);
        });
      }

      // Update Great Old Ones campaign systems (if active)
      if (S.scenario?.id === 'greatOldOnes' && S.greatOldOnes) {
        const gooState = S.greatOldOnes;

        // Update Week 3 systems (ritual sites, units, missions)
        if (week3State) {
          const updatedWeek3 = updateWeek3Systems(gooState, week3State);
          setWeek3State(updatedWeek3);
        }

        // Update Phase 2 systems (if unlocked)
        if (phase2State) {
          // Check if phase 2 should unlock
          if (!phase2State.unlocked) {
            const unlockCheck = checkPhase2UnlockConditions(gooState);
            if (unlockCheck.shouldUnlock) {
              phase2State.unlocked = true;
              if (window.__gameAddNewsItem) {
                window.__gameAddNewsItem('occult', 'Phase 2 Doctrine Paths Unlocked', 'info');
              }
            }
          }

          if (phase2State.unlocked) {
            const updatedPhase2 = updatePhase2Systems(gooState, phase2State);
            setPhase2State(updatedPhase2);
          }
        }

        // Update Phase 3 systems (if unlocked)
        if (phase3State && phase2State) {
          // Check if phase 3 should unlock
          if (!phase3State.unlocked) {
            const unlockCheck = checkPhase3UnlockConditions(gooState, phase2State);
            if (unlockCheck.shouldUnlock) {
              phase3State.unlocked = true;
              if (window.__gameAddNewsItem) {
                window.__gameAddNewsItem('occult', 'Phase 3 Endgame Systems Unlocked', 'critical');
              }
            }
          }

          if (phase3State.unlocked) {
            const updatedPhase3 = updatePhase3Systems(gooState, phase2State, phase3State);
            setPhase3State(updatedPhase3);
          }
        }

        // Persist updated state
        setGreatOldOnesState({ ...gooState });
        GameStateManager.setGreatOldOnes(gooState);
      }

      updateDisplay();
      checkVictory();
      checkVictoryProgress();
    }, productionPhaseDelay);
    aiTurnTimeouts.push(productionTimeoutId);
  }, resolutionDelay);
  aiTurnTimeouts.push(resolutionTimeoutId);
}

// Update display
function updateDisplay() {
  const player = PlayerManager.get();
  if (!player) return;

  const defconClasses = getDefconIndicatorClasses(S.defcon);
  const defconBadgeEl = document.getElementById('defconBadge');
  if (defconBadgeEl) {
    defconBadgeEl.className = `${DEFCON_BADGE_BASE_CLASSES} ${defconClasses.badge}`;
  }

  const defconEl = document.getElementById('defcon');
  if (defconEl) {
    defconEl.textContent = S.defcon.toString();
    defconEl.className = `${DEFCON_VALUE_BASE_CLASSES} ${defconClasses.value}`;
  }
  AudioSys.updateAmbientForDefcon(S.defcon);
  
  const turnEl = document.getElementById('turn');
  if (turnEl) turnEl.textContent = S.turn.toString();
  
  const maxActions = S.defcon >= 4 ? 1 : S.defcon >= 2 ? 2 : 3;
  const actionsEl = document.getElementById('actionsDisplay');
  if (actionsEl) actionsEl.textContent = `${S.actionsRemaining}/${maxActions}`;

  const gameTimeEl = document.getElementById('gameTimeDisplay');
  if (gameTimeEl) {
    const timeConfig = S.scenario?.timeConfig ?? getDefaultScenario().timeConfig;
    const timestamp = getGameTimestamp(Math.max(0, S.turn - 1), timeConfig);
    gameTimeEl.textContent = timestamp;
  }

  const phaseEl = document.getElementById('phaseBadge');
  if (phaseEl) phaseEl.textContent = S.phase;
  
  const productionEl = document.getElementById('productionDisplay');
  if (productionEl) productionEl.textContent = (player.production || 0).toString();
  
  const uraniumEl = document.getElementById('uraniumDisplay');
  if (uraniumEl) uraniumEl.textContent = (player.uranium || 0).toString();
  
  const intelEl = document.getElementById('intelDisplay');
  if (intelEl) intelEl.textContent = (player.intel || 0).toString();

  const goldEl = document.getElementById('goldDisplay');
  if (goldEl) goldEl.textContent = Math.floor(player.gold ?? 0).toString();

  const citiesEl = document.getElementById('citiesDisplay');
  if (citiesEl) citiesEl.textContent = (player.cities || 1).toString();
  
  const popEl = document.getElementById('popDisplay');
  if (popEl) popEl.textContent = Math.floor(player.population).toString();
  
  const leaderEl = document.getElementById('leaderDisplay');
  if (leaderEl) leaderEl.textContent = player.leader;
  
  const doctrineEl = document.getElementById('doctrineDisplay');
  if (doctrineEl) doctrineEl.textContent = (player.doctrine || 'none').toUpperCase();
  
  const missileEl = document.getElementById('missileDisplay');
  if (missileEl) missileEl.textContent = player.missiles.toString();
  
  const bomberEl = document.getElementById('bomberDisplay');
  if (bomberEl) bomberEl.textContent = (player.bombers || 0).toString();
  
  const defenseEl = document.getElementById('defenseDisplay');
  if (defenseEl) defenseEl.textContent = player.defense.toString();
  
  const instabilityEl = document.getElementById('instabilityDisplay');
  if (instabilityEl) instabilityEl.textContent = Math.floor(player.instability || 0).toString();
  
  const warheadText = Object.entries(player.warheads || {})
    .map(([y, c]) => `${y}MT:${c}`)
    .join(' ');
  const warheadEl = document.getElementById('warheadDisplay');
  if (warheadEl) warheadEl.textContent = warheadText || 'NONE';

  updateScoreboard();
  DoomsdayClock.update();

  if (uiUpdateCallback) {
    uiUpdateCallback();
  }

  broadcastMultiplayerState();
}

function updateScoreboard() {
  const scoreList = document.getElementById('scoreList');
  if (!scoreList) return;

  scoreList.innerHTML = '';
  const sorted = [...nations].sort((a, b) => b.population - a.population);
  sorted.forEach(n => {
    const entry = document.createElement('div');
    entry.className = 'score-entry';
    entry.innerHTML = `<span style="color:${n.color}">${n.name}</span><span>${Math.floor(n.population)}M</span>`;
    scoreList.appendChild(entry);
  });
}

function hasActiveEndGameAnimations(): boolean {
  const missilesActive = Array.isArray(S.missiles) && S.missiles.length > 0;
  const bombersActive = Array.isArray(S.bombers) && S.bombers.length > 0;
  const submarinesActive = Array.isArray(S.submarines) && S.submarines.length > 0;

  return missilesActive || bombersActive || submarinesActive;
}

function confirmEndGameReveal() {
  if (!S.pendingEndGameReveal) {
    const now = Date.now();
    S.pendingEndGameReveal = {
      initiatedAt: now,
      minRevealAt: now + ENDGAME_REVEAL_MIN_DELAY_MS,
    };
  }

  S.endGameRevealRequiresConfirmation = false;
  S.showEndGameScreen = false;
  triggerNationsUpdate?.();
}

function maybeRevealEndGameScreen() {
  if (S.endGameRevealRequiresConfirmation) {
    return;
  }

  const pendingReveal = S.pendingEndGameReveal;
  if (!pendingReveal) {
    return;
  }

  const now = Date.now();
  const animationsActive = hasActiveEndGameAnimations();
  const exceededMaxWait = now - pendingReveal.initiatedAt >= ENDGAME_REVEAL_MAX_WAIT_MS;

  if ((now >= pendingReveal.minRevealAt && !animationsActive) || exceededMaxWait) {
    S.showEndGameScreen = true;
    S.pendingEndGameReveal = undefined;
    triggerNationsUpdate?.();
  }
}

// Game loop
function gameLoop() {
  requestAnimationFrame(gameLoop);

  if (!ctx) {
    return;
  }

  const applyCanvasDefaults = () => {
    ctx.imageSmoothingEnabled = !(currentTheme === 'retro80s' || currentTheme === 'wargames');
  };

  applyCanvasDefaults();

  const nowMs = Date.now();
  const isWireframeStyle = currentMapStyle === 'wireframe';
  const isMorphingStyle = currentMapStyle === 'morphing';

  ctx.clearRect(0, 0, W, H);

  // Always advance atmospheric/ocean animations so swapping styles stays seamless
  Atmosphere.update();
  Ocean.update();

  // Skip 2D canvas rendering for morphing style - the 3D MorphingGlobe handles all map rendering
  if (!isWireframeStyle && !isMorphingStyle) {
    Atmosphere.draw(ctx, currentMapStyle);
    Ocean.draw(ctx, currentMapStyle);
  }

  cam.zoom += (cam.targetZoom - cam.zoom) * 0.1;

  // Skip 2D land mass rendering for morphing and wireframe styles
  // Morphing uses 3D MorphingGlobe, wireframe uses 3D vector overlay
  if (!isWireframeStyle && !isMorphingStyle) {
    drawWorld(currentMapStyle);
    CityLights.draw(ctx, currentMapStyle);
  }

  // Draw nation labels and territory markers
  // In morphing mode, territory markers are rendered by TerritoryMarkers component in 3D scene
  // so we skip 2D canvas territory rendering to avoid duplication
  drawNations(currentMapStyle);
  if (!isMorphingStyle) {
    drawTerritoriesWrapper();
  }

  drawSatellites(nowMs);
  drawVIIRSFires(nowMs);
  drawSatelliteSignals(nowMs);
  drawMissiles();
  drawBombers();
  drawSubmarines();
  drawConventionalForces();
  drawParticles();
  drawFX();

  maybeRevealEndGameScreen();
}

// Consume action
function consumeAction() {
  S.actionsRemaining--;
  updateDisplay();

  // Player must manually click "End Turn" - no automatic turn end
  if (S.actionsRemaining <= 0) {
    emitOverlayMessage('NO ACTIONS REMAINING - Click End Turn', 2000);
  }
}

// React Component
export default function NoradVector() {
  console.log('[DEBUG] NoradVector component rendering');

  const navigate = useNavigate();
  const interfaceRef = useRef<HTMLDivElement>(null);
  const globeSceneRef = useRef<GlobeSceneHandle | null>(null);
  const [gamePhase, setGamePhase] = useState('intro');
  console.log('[DEBUG] Initial gamePhase:', gamePhase);
  const { rng, resetRNG } = useRNG();
  const [isGameStarted, setIsGameStarted] = useState(false);
  const hasAutoplayedTurnOneMusicRef = useRef(false);
  const hasBootstrappedGameRef = useRef(false);
  const [, setRenderTick] = useState(0);
  const [pressureSyncKey, setPressureSyncKey] = useState(0);
  const pressureInitializedNationsRef = useRef<Set<string>>(new Set());
  const pressureDeltaRef = useRef<PressureDeltaState>(pressureDeltaState);
  const syncPressureDeltaState = () => {
    const delta = pressureDeltaRef.current;
    pressureDeltaState.goldPenalty = delta.goldPenalty;
    pressureDeltaState.aidGold = delta.aidGold;
    pressureDeltaRef.current = pressureDeltaState;
  };

  // Modal management - Extracted to useModalManager hook (Phase 7 refactoring)
  const { showModal, modalContent, openModal, closeModal } = useModalManager();
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(() => {
    const stored = Storage.getItem('selected_scenario');
    if (stored && stored in SCENARIOS) {
      return stored;
    }
    return S.scenario?.id ?? getDefaultScenario().id;
  });
  const [isScenarioPanelOpen, setIsScenarioPanelOpen] = useState(false);
  const scenarioOptions = useMemo(() => Object.values(SCENARIOS), []);
  const selectedScenario = useMemo(() => {
    return SCENARIOS[selectedScenarioId] ?? getDefaultScenario();
  }, [selectedScenarioId]);
  const [selectedLeader, setSelectedLeader] = useState<string | null>(null);
  const [selectedDoctrine, setSelectedDoctrine] = useState<string | null>(null);
  const [pendingLaunch, setPendingLaunch] = useState<PendingLaunchState | null>(null);
  const [selectedWarheadYield, setSelectedWarheadYield] = useState<number | null>(null);
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState<DeliveryMethod | null>(null);
  const [theme, setTheme] = useState<ThemeId>('synthwave');
  const [layoutDensity, setLayoutDensity] = useState<LayoutDensity>(() => {
    const stored = Storage.getItem('layout_density');
    if (stored === 'expanded' || stored === 'compact' || stored === 'minimal') {
      return stored;
    }
    return 'compact';
  });
  const [showMinimalApprovalQueue, setShowMinimalApprovalQueue] = useState(false);
  const [showMinimalCommandSheet, setShowMinimalCommandSheet] = useState(false);
  const [isLeaderOverviewOpen, setLeaderOverviewOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [civInfoPanelOpen, setCivInfoPanelOpen] = useState(false);
  const [civInfoDefaultTab, setCivInfoDefaultTab] = useState<'own-status' | 'enemy-status' | 'diplomacy' | 'research'>('own-status');
  const [activeDiplomacyProposal, setActiveDiplomacyProposal] = useState<DiplomacyProposal | null>(null);
  const [pendingAIProposals, setPendingAIProposals] = useState<DiplomacyProposal[]>([]);
  const [showEnhancedDiplomacy, setShowEnhancedDiplomacy] = useState(false);
  const [showCivStyleDiplomacy, setShowCivStyleDiplomacy] = useState(false);
  const [civStyleDiplomacyTarget, setCivStyleDiplomacyTarget] = useState<string | null>(null);
  const [isDefconWarningVisible, setIsDefconWarningVisible] = useState(false);
  const defconWarningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerDefconWarning = useCallback(() => {
    setIsDefconWarningVisible(true);

    if (defconWarningTimeoutRef.current) {
      clearTimeout(defconWarningTimeoutRef.current);
    }

    defconWarningTimeoutRef.current = setTimeout(() => {
      setIsDefconWarningVisible(false);
      defconWarningTimeoutRef.current = null;
    }, 5000);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToDefconOne((previousDefcon, newDefcon) => {
      if (newDefcon === 1 && previousDefcon !== 1) {
        triggerDefconWarning();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [triggerDefconWarning]);

  useEffect(() => {
    return () => {
      if (defconWarningTimeoutRef.current) {
        clearTimeout(defconWarningTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (layoutDensity !== 'minimal') {
      setShowMinimalApprovalQueue(false);
      setShowMinimalCommandSheet(false);
    }
  }, [layoutDensity]);

  // Update global RNG reference for use outside React component
  useEffect(() => {
    globalRNG = rng;
  }, [rng]);

  const refreshGameState = useCallback((updatedNations: LocalNation[]) => {
    nations = updatedNations;
    GameStateManager.setNations(updatedNations);
    PlayerManager.setNations(updatedNations);
    setRenderTick((tick) => tick + 1);
    updateDisplay();
  }, []);

  const applyNationUpdate = useCallback(
    (nationId: string, updates: Partial<Nation>) => {
      const current = GameStateManager.getNations();
      const index = current.findIndex((nation) => nation.id === nationId);
      if (index === -1) {
        return;
      }

      const updated = [...current];
      updated[index] = { ...updated[index], ...updates } as LocalNation;
      refreshGameState(updated);
    },
    [refreshGameState]
  );

  const applyNationUpdatesMap = useCallback(
    (updates: Map<string, Partial<Nation>>) => {
      if (updates.size === 0) {
        return;
      }

      const current = GameStateManager.getNations();
      const updated = current.map((nation) => {
        const patch = updates.get(nation.id);
        return patch ? ({ ...nation, ...patch } as LocalNation) : nation;
      });

      refreshGameState(updated);
    },
    [refreshGameState]
  );

  const playerNation = useMemo(() => nations.find(n => n.isPlayer), [nations]);
  const playerNationId = playerNation?.id ?? null;
  const playerNationName = playerNation?.name ?? 'Player';
  const advancedGameState = GameStateManager.getState();
  const enemyNations = useMemo(() => nations.filter(n => !n.isPlayer && !n.eliminated), [nations]);
  const currentPlayerLeaderName = playerNation?.leaderName || playerNation?.leader;
  const playerLeaderImage = useMemo(() => getLeaderImage(currentPlayerLeaderName), [currentPlayerLeaderName]);
  const playerLeaderInitials = useMemo(() => getLeaderInitials(currentPlayerLeaderName), [currentPlayerLeaderName]);
  const renderSanctionsDialog = useCallback(
    (packages: SanctionPackage[]) => {
      const imposingNames = getImposingNationNamesFromPackages(packages);
      openModal(
        'Sanctions enacted',
        () => (
          <div className="space-y-4">
            <p className="text-sm text-cyan-200/80">
              {imposingNames.length > 0
                ? `${imposingNames.join(', ')} sanctioned ${playerNationName}.`
                : `${playerNationName} is facing coordinated sanctions.`}
            </p>
            <div className="grid gap-4 sm:grid-cols-1">
              {packages.map((pkg) => {
                const sanctionImposers = getImposingNationNamesFromPackages([pkg]);
                const durationLabel =
                  pkg.duration < 0
                    ? 'Indefinite duration'
                    : `${pkg.turnsRemaining}/${pkg.duration} turns remaining`;

                return (
                  <div
                    key={pkg.id}
                    className="rounded-lg border border-cyan-500/30 bg-slate-900/60 p-4 shadow-md shadow-cyan-900/50"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-base font-semibold text-cyan-100">
                          {sanctionImposers.length > 0
                            ? `Imposed by ${sanctionImposers.join(', ')}`
                            : 'Imposed by foreign coalition'}
                        </p>
                        <p className="text-xs text-cyan-200/70">
                          Severity {pkg.severity}/10 • {durationLabel}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {pkg.type.map((type) => (
                          <span
                            key={`${pkg.id}-${type}`}
                            className="rounded-full border border-cyan-500/50 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-100"
                          >
                            {formatSanctionTypeLabel(type)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-cyan-100/80">
                      {pkg.rationale ?? 'No explicit rationale provided.'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ),
      );
    },
    [openModal, playerNationName],
  );

  useEffect(() => {
    presentSanctionDialog = renderSanctionsDialog;
    return () => {
      presentSanctionDialog = null;
    };
  }, [renderSanctionsDialog]);
  const playerDepletionWarnings = useMemo<DepletionWarning[]>(() => {
    if (!playerNation || !S.depletionWarnings || !S.conventional?.territories) {
      return [];
    }

    const territories = S.conventional.territories;

    return S.depletionWarnings.filter(warning => {
      const territory = territories[warning.territoryId];
      return territory?.controllingNationId === playerNation.id;
    });
  }, [playerNation, S.depletionWarnings, S.conventional?.territories]);

  // Leader Contact Modal state
  const [leaderContactModalOpen, setLeaderContactModalOpen] = useState(false);
  const [leaderContactTargetNationId, setLeaderContactTargetNationId] = useState<string | null>(null);
  const [activeNegotiations, setActiveNegotiations] = useState<NegotiationState[]>([]);

  // Leaders Screen state (Civilization-style leader overview)
  const [leadersScreenOpen, setLeadersScreenOpen] = useState(false);

  // Agenda Revelation Notification state (Phase 4)
  const [agendaRevelationOpen, setAgendaRevelationOpen] = useState(false);
  const [agendaRevelationData, setAgendaRevelationData] = useState<{
    nationName: string;
    agenda: any;
  } | null>(null);

  // News ticker and flashpoints - MUST be declared before blockingModalActive useMemo
  const { newsItems, addNewsItem } = useNewsManager();
  const [currentFlashpointOutcome, setCurrentFlashpointOutcome] = useState<FlashpointOutcome | null>(null);
  const [currentSpyMissionResult, setCurrentSpyMissionResult] = useState<SpyMissionResultData | null>(null);
  const {
    activeFlashpoint,
    pendingFollowUps,
    triggerRandomFlashpoint,
    resolveFlashpoint,
    dismissFlashpoint,
  } = useFlashpoints();

  // NASA VIIRS satellite fire detection layer
  const viirsHook = useVIIRS();

  // Weather radar cloud layer
  const weatherRadarHook = useWeatherRadar();

  // Satellite signal simulation
  const satelliteSignals = useSatelliteSignals({
    currentTurn: S.turn,
    getNation: (id) => nations.find((n) => n.id === id),
    nations,
    onLog: (msg) => log(msg, 'info'),
    enabled: isGameStarted && gamePhase === 'playing',
  });

  // Satellite communications panel state
  const [isSatelliteCommsOpen, setIsSatelliteCommsOpen] = useState(false);

  // Great Old Ones state - MUST be declared before blockingModalActive useMemo
  const [greatOldOnesState, setGreatOldOnesState] = useState<GreatOldOnesState | null>(null);
  const [councilSchismModalOpen, setCouncilSchismModalOpen] = useState(false);
  const [regionalSanityOverlayVisible, setRegionalSanityOverlayVisible] = useState(false);
  const [phase2PanelOpen, setPhase2PanelOpen] = useState(false);
  const [defconChangeEvent, setDefconChangeEvent] = useState<import('@/types/game').DefconChangeEvent | null>(null);
  const focusCompletionCountRef = useRef(0);
  const [week3State, setWeek3State] = useState<Week3ExtendedState | null>(null);
  const [phase2State, setPhase2State] = useState<Phase2State | null>(null);
  const [phase3State, setPhase3State] = useState<Phase3State | null>(null);
  const [diplomacyPhase3State, setDiplomacyPhase3State] = useState<DiplomacyPhase3SystemState | null>(
    () => S.diplomacyPhase3 ?? null
  );

  // Modal and panel states - MUST be declared before blockingModalActive useMemo
  const [isBioWarfareOpen, setIsBioWarfareOpen] = useState(() => selectedScenarioId === 'pandemic2020');
  const [isCulturePanelOpen, setIsCulturePanelOpen] = useState(false);
  const [showGovernanceDetails, setShowGovernanceDetails] = useState(false);
  const [showPolicyPanel, setShowPolicyPanel] = useState(false);
  const [isStrikePlannerOpen, setIsStrikePlannerOpen] = useState(false);
  const [isNationalFocusOpen, setIsNationalFocusOpen] = useState(false);
  const [isIntelOperationsOpen, setIsIntelOperationsOpen] = useState(false);
  const [isSpyPanelOpen, setIsSpyPanelOpen] = useState(false);

  useEffect(() => {
    if (!playerNationId) {
      setIsNationalFocusOpen(false);
    }
  }, [playerNationId]);
  const [isWarCouncilOpen, setIsWarCouncilOpen] = useState(false);
  const [populationImpacts, setPopulationImpacts] = useState<Array<{ id: string; casualties: number; targetName: string; timestamp: number }>>([]);

  const activeDoctrineIncident = S.doctrineIncidentState?.activeIncident ?? null;
  const doctrineIncidentActive = Boolean(activeDoctrineIncident);

  const otherBlockingModalActive = useMemo(
    () =>
      Boolean(
        activeFlashpoint ||
          currentFlashpointOutcome ||
          currentSpyMissionResult ||
          phase2PanelOpen ||
          councilSchismModalOpen ||
          showEnhancedDiplomacy ||
          leaderContactModalOpen ||
          leadersScreenOpen ||
          isIntelOperationsOpen ||
          isCulturePanelOpen ||
          isBioWarfareOpen ||
          isWarCouncilOpen ||
          isSpyPanelOpen ||
          showGovernanceDetails ||
          showPolicyPanel ||
          isStrikePlannerOpen ||
          civInfoPanelOpen
      ),
    [
      activeFlashpoint,
      currentFlashpointOutcome,
      currentSpyMissionResult,
      phase2PanelOpen,
      councilSchismModalOpen,
      showEnhancedDiplomacy,
      leaderContactModalOpen,
      leadersScreenOpen,
      isIntelOperationsOpen,
      isCulturePanelOpen,
      isBioWarfareOpen,
      isWarCouncilOpen,
      isSpyPanelOpen,
      showGovernanceDetails,
      showPolicyPanel,
      isStrikePlannerOpen,
      civInfoPanelOpen,
    ],
  );

  const blockingModalActive = doctrineIncidentActive || otherBlockingModalActive;

  // AI-Initiated Negotiations state (Phase 4)
  const [aiInitiatedNegotiations, setAiInitiatedNegotiations] = useState<any[]>([]);
  const [activeAIProposal, setActiveAIProposal] = useState<any | null>(null);

  useEffect(() => {
    enqueueAIProposalRef = (proposal) => {
      setPendingAIProposals(prev => {
        const activeTurn = S.turn;
        const filtered = prev.filter(item => !isProposalExpired(item, activeTurn));
        if (isProposalExpired(proposal, activeTurn)) {
          console.info('[diplomacy] Dropped expired proposal', proposal);
          return filtered;
        }
        return [...filtered, proposal];
      });
    };
    return () => {
      enqueueAIProposalRef = null;
    };
  }, [setPendingAIProposals]);

  useEffect(() => {
    const activeTurn = S.turn;
    setPendingAIProposals(prev => {
      const filtered = prev.filter(item => !isProposalExpired(item, activeTurn));
      return filtered.length === prev.length ? prev : filtered;
    });

    if (activeDiplomacyProposal && isProposalExpired(activeDiplomacyProposal, activeTurn)) {
      const proposer = getNationById(nations, activeDiplomacyProposal.proposerId);
      const target = getNationById(nations, activeDiplomacyProposal.targetId);
      toast({
        title: 'Diplomatic proposal expired',
        description: `${proposer?.name ?? 'A nation'}'s ${activeDiplomacyProposal.type} proposal to ${target?.name ?? 'its counterpart'} expired after ${PROPOSAL_MAX_AGE} turns.`,
      });
      setActiveDiplomacyProposal(null);
    }
  }, [S.turn, activeDiplomacyProposal, nations, setPendingAIProposals, getNationById]);

  useEffect(() => {
    triggerNationsUpdate = () => {
      setRenderTick((tick) => tick + 1);
      setPressureSyncKey((key) => key + 1);
    };
    return () => {
      triggerNationsUpdate = null;
    };
  }, [setPressureSyncKey]);
  const [mapStyle, setMapStyle] = useState<MapStyle>(() => {
    const storedVisual = Storage.getItem('map_style_visual') ?? Storage.getItem('map_style');
    const storedMode = Storage.getItem('map_mode');
    const visual = isVisualStyleValue(storedVisual) ? storedVisual : (() => {
      Storage.setItem('map_style_visual', DEFAULT_MAP_STYLE.visual);
      Storage.setItem('map_style', DEFAULT_MAP_STYLE.visual);
      return DEFAULT_MAP_STYLE.visual;
    })();
    const mode = isMapModeValue(storedMode) ? storedMode : DEFAULT_MAP_STYLE.mode;
    return { visual, mode };
  });
  const [isFlatMapDay, setIsFlatMapDay] = useState<boolean>(true);
  // Vector overlay (country borders) disabled by default - too distracting
  const [showVectorOverlay, setShowVectorOverlay] = useState<boolean>(false);
  // Vector-only mode: hide earth texture and show only vector borders (for WARGAMES theme)
  const [vectorOnlyMode, setVectorOnlyMode] = useState<boolean>(false);
  const [dayNightBlend, setDayNightBlend] = useState<number>(0);
  const dayNightBlendAnimationFrameRef = useRef<number | null>(null);
  const dayNightBlendAnimationStartRef = useRef<number | null>(null);
  const dayNightBlendRef = useRef<number>(0); // Track current value for animation
  const stopDayNightBlendAnimation = useCallback(() => {
    if (dayNightBlendAnimationFrameRef.current) {
      cancelAnimationFrame(dayNightBlendAnimationFrameRef.current);
      dayNightBlendAnimationFrameRef.current = null;
    }
    dayNightBlendAnimationStartRef.current = null;
  }, []);
  const animateDayNightBlendTo = useCallback((targetBlend: number) => {
    const clampedTarget = Math.min(Math.max(targetBlend, 0), 1);

    const startBlend = dayNightBlendRef.current;
    if (Math.abs(startBlend - clampedTarget) < 0.001) {
      stopDayNightBlendAnimation();
      dayNightBlendRef.current = clampedTarget;
      setDayNightBlend(clampedTarget);
      return;
    }

    stopDayNightBlendAnimation();
    const duration = 400;

    const step = (timestamp: number) => {
      if (dayNightBlendAnimationStartRef.current === null) {
        dayNightBlendAnimationStartRef.current = timestamp;
      }

      const elapsed = timestamp - dayNightBlendAnimationStartRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = progress < 0.5
        ? 2 * progress * progress
        : -1 + (4 - 2 * progress) * progress;
      const nextBlend = startBlend + (clampedTarget - startBlend) * easedProgress;

      dayNightBlendRef.current = nextBlend;
      setDayNightBlend(nextBlend);

      if (progress < 1) {
        dayNightBlendAnimationFrameRef.current = requestAnimationFrame(step);
      } else {
        stopDayNightBlendAnimation();
        dayNightBlendRef.current = clampedTarget;
        setDayNightBlend(clampedTarget);
      }
    };

    dayNightBlendAnimationFrameRef.current = requestAnimationFrame(step);
  }, [stopDayNightBlendAnimation]);
  const lastFlatMapModeRef = useRef<boolean>(true);

  const handleMapStyleChange = useCallback((style: MapVisualStyle) => {
    setMapStyle(prev => {
      if (prev.visual === style) {
        return prev;
      }

      Storage.setItem('map_style_visual', style);
      Storage.setItem('map_style', style);
      currentMapStyle = style;
      AudioSys.playSFX('click');
      if (style === 'flat-realistic') {
        void Promise.all([preloadFlatRealisticTexture(true), preloadFlatRealisticTexture(false)]);
      }
      toast({
        title: 'Kartstil oppdatert',
        description: `Visuell stil satt til ${style}`,
      });

      return { ...prev, visual: style };
    });
  }, [toast]);

  const handleMapModeChange = useCallback((mode: MapMode) => {
    setMapStyle(prev => {
      if (prev.mode === mode) {
        return prev;
      }

      Storage.setItem('map_mode', mode);
      AudioSys.playSFX('click');
      toast({
        title: `Kartmodus: ${MAP_MODE_DESCRIPTIONS[mode].label}`,
        description: MAP_MODE_DESCRIPTIONS[mode].description,
      });

      currentMapMode = mode;
      return { ...prev, mode };
    });
  }, [toast]);

  const handleDayNightToggle = useCallback(() => {
    // Day/night is now automatic based on round number
    AudioSys.playSFX('click');
    toast({
      title: 'Dag/Natt modus',
      description: 'Dag/natt-syklusen er nå automatisk basert på runde',
    });
  }, [toast]);

  useEffect(() => {
    const scenario = SCENARIOS[selectedScenarioId] ?? getDefaultScenario();
    S.scenario = scenario;
    Storage.setItem('selected_scenario', scenario.id);
  }, [selectedScenarioId]);

  const handleScenarioSelect = useCallback((scenarioId: string) => {
    if (!(scenarioId in SCENARIOS)) {
      return;
    }
    setSelectedScenarioId(scenarioId);
    setIsScenarioPanelOpen(false);

    // Update window.S when scenario is selected to ensure hooks can detect it
    if (typeof window !== 'undefined' && (window as any).S) {
      console.log('[Game State] Scenario selected:', scenarioId);
    }
  }, []);

  const handleIntroStart = useCallback(() => {
    console.log('[DEBUG] handleIntroStart called');
    const scenario = SCENARIOS[selectedScenarioId] ?? getDefaultScenario();
    console.log('[DEBUG] Selected scenario:', scenario?.id);
    S.scenario = scenario;
    S.turn = 1;
    S.phase = 'PLAYER';
    S.gameOver = false;
    S.paused = false;
    const defcon = getScenarioDefcon(scenario);
    console.log('[DEBUG] Initial DEFCON:', defcon);
    S.defcon = defcon;
    S.actionsRemaining = defcon >= 4 ? 1 : defcon >= 2 ? 2 : 3;

    // Initialize Great Old Ones campaign if selected
    if (scenario.id === 'greatOldOnes') {
      const gooState = initializeGreatOldOnesState();
      S.greatOldOnes = gooState;
      GameStateManager.setGreatOldOnes(gooState);
      setGreatOldOnesState(gooState);
      setWeek3State(initializeWeek3State());
      setPhase2State(initializePhase2State());
      setPhase3State(initializePhase3State());

      // Switch to Church of Cthulhu soundtrack
      AudioSys.setPreferredTrack('cthulhu-1');
      Storage.setItem('audio_music_track', 'cthulhu-1');
    } else {
      // Clear Great Old Ones state for other scenarios
      S.greatOldOnes = undefined;
      GameStateManager.setGreatOldOnes(undefined);
      setGreatOldOnesState(null);
      setWeek3State(null);
      setPhase2State(null);
      setPhase3State(null);

      // Reset to random soundtrack for non-Cthulhu scenarios
      const storedTrack = Storage.getItem('audio_music_track');
      if (storedTrack === 'cthulhu-1' || storedTrack === 'cthulhu-2') {
        AudioSys.setPreferredTrack(null);
        Storage.setItem('audio_music_track', 'random');
      }
    }

    // Expose updated S to window after scenario is set
    if (typeof window !== 'undefined') {
      (window as any).S = S;
      console.log('[Game State] Exposed S to window after intro start. Scenario ID:', S.scenario?.id);
    }

    updateDisplay();
    setGamePhase('leader');
  }, [selectedScenarioId, setGamePhase]);

  // Screen resolution preference
  const [screenResolution, setScreenResolution] = useState<ScreenResolution>(() => {
    const stored = Storage.getItem('screen_resolution');
    if (stored === 'auto' || stored === '1280x720' || stored === '1600x900' || stored === '1920x1080' || stored === '2560x1440' || stored === '3840x2160') {
      return stored;
    }
    return 'auto';
  });

  const handleResolutionSelect = useCallback((resolution: ScreenResolution) => {
    setScreenResolution(resolution);
    Storage.setItem('screen_resolution', resolution);
    const selectedOption = RESOLUTION_OPTIONS.find(opt => opt.value === resolution);
    toast({
      title: `Resolution: ${selectedOption?.label ?? resolution}`,
      description: selectedOption?.description ?? 'Resolution updated',
    });
  }, []);

  // Tutorial and phase transition system
  const tutorialContext = useTutorialContext();
  const [isPhaseTransitioning, setIsPhaseTransitioning] = useState(false);
  const [overlayBanner, setOverlayBanner] = useState<OverlayNotification | null>(null);
  const activeOverlay = overlayBanner && overlayBanner.expiresAt > Date.now() ? overlayBanner : null;
  const isCatastrophicOverlay = activeOverlay?.tone === 'catastrophe';
  const bannerOverlay = !isCatastrophicOverlay ? activeOverlay : null;

  // Era system state
  const [showEraTransition, setShowEraTransition] = useState(false);
  const [eraTransitionQueued, setEraTransitionQueued] = useState(false);
  const [eraTransitionData, setEraTransitionData] = useState<{
    era: 'early' | 'mid' | 'late';
    name: string;
    description: string;
    features: any[];
  } | null>(null);

  // Consequence preview state
  const [consequencePreview, setConsequencePreview] = useState<ActionConsequences | null>(null);
  const [consequenceCallback, setConsequenceCallback] = useState<(() => void) | null>(null);
  const queueConsequencePreview = useCallback(
    (consequences: ActionConsequences | null, onConfirm?: () => void) => {
      if (!consequences) return false;
      setConsequencePreview(consequences);
      setConsequenceCallback(onConfirm ?? null);
      return true;
    },
    [],
  );

  useEffect(() => {
    const listener: PhaseTransitionListener = (active) => {
      setIsPhaseTransitioning(active);
    };
    registerPhaseTransitionListener(listener);
    return () => {
      registerPhaseTransitionListener(null);
    };
  }, []);

  // Register day/night update listener for smooth texture blending
  useEffect(() => {
    const listener: DayNightUpdateListener = (targetBlend) => {
      animateDayNightBlendTo(targetBlend);
    };
    registerDayNightUpdateListener(listener);
    // Trigger initial blend based on current turn
    notifyDayNightUpdate(S.turn);
    return () => {
      registerDayNightUpdateListener(null);
    };
  }, [animateDayNightBlendTo]);

  useEffect(() => {
    const listener: OverlayListener = (message) => {
      setOverlayBanner(message);
    };
    registerOverlayListener(listener);
    return () => {
      registerOverlayListener(null);
    };
  }, []);

  useEffect(() => {
    if (!overlayBanner) {
      return;
    }

    const remaining = overlayBanner.expiresAt - Date.now();
    if (remaining <= 0) {
      setOverlayBanner(null);
      return;
    }

    const timeout = setTimeout(() => {
      setOverlayBanner(prev => {
        if (!prev) {
          return null;
        }
        return prev.expiresAt <= Date.now() ? null : prev;
      });
    }, remaining);

    return () => {
      clearTimeout(timeout);
    };
  }, [overlayBanner]);

  useEffect(() => {
    currentMapStyle = mapStyle.visual;
    if (mapStyle.visual === 'flat-realistic' || mapStyle.visual === 'wireframe') {
      const expectedX = (W - W * cam.zoom) / 2;
      const expectedY = (H - H * cam.zoom) / 2;
      const needsRecentering = Math.abs(cam.x - expectedX) > 0.5 || Math.abs(cam.y - expectedY) > 0.5;
      if (needsRecentering) {
        cam.x = expectedX;
        cam.y = expectedY;
      }
    }
  }, [cam.x, cam.y, cam.zoom, mapStyle.visual]);
  useEffect(() => {
    currentMapMode = mapStyle.mode;
  }, [mapStyle.mode]);
  useEffect(() => {
    // Preload textures immediately on mount - wait for day texture to ensure it's ready
    Promise.all([preloadFlatRealisticTexture(true), preloadFlatRealisticTexture(false)])
      .catch(err => console.error('Error preloading textures:', err));
  }, []);
  useEffect(() => {
    void loadWorld();
  }, []);
  useEffect(() => {
    if (mapStyle.visual === 'flat-realistic') {
      Promise.all([preloadFlatRealisticTexture(true), preloadFlatRealisticTexture(false)])
        .catch(err => console.error('Error preloading textures:', err));
    }
  }, [mapStyle.visual]);
  const storedMusicEnabled = Storage.getItem('audio_music_enabled');
  const initialMusicEnabled = storedMusicEnabled === 'true' ? true : storedMusicEnabled === 'false' ? false : AudioSys.musicEnabled;
  const storedSfxEnabled = Storage.getItem('audio_sfx_enabled');
  const initialSfxEnabled = storedSfxEnabled === 'true' ? true : storedSfxEnabled === 'false' ? false : AudioSys.sfxEnabled;
  const storedAmbientEnabled = Storage.getItem('audio_ambient_enabled');
  const initialAmbientEnabled = storedAmbientEnabled === 'true' ? true : storedAmbientEnabled === 'false' ? false : AudioSys.ambientEnabled;
  // Always start at 15% volume
  const initialMusicVolume = 0.15;
  const storedAmbientVolume = Storage.getItem('audio_ambient_volume');
  const initialAmbientVolume = (() => {
    if (storedAmbientVolume) {
      const parsed = parseFloat(storedAmbientVolume);
      if (!Number.isNaN(parsed)) {
        return Math.min(1, Math.max(0, parsed));
      }
    }
    return AudioSys.ambientVolume;
  })();
  const storedMusicTrack = Storage.getItem('audio_music_track');
  const initialMusicSelection: string = (() => {
    if (storedMusicTrack === 'random') {
      return 'random';
    }
    if (storedMusicTrack) {
      const metadata = AudioSys.getTrackMetadata(storedMusicTrack as MusicTrackId);
      if (metadata) {
        return metadata.id;
      }
    }
    return AudioSys.getPreferredTrack() ?? 'random';
  })();

  const [musicEnabled, setMusicEnabled] = useState(initialMusicEnabled);
  const [sfxEnabled, setSfxEnabled] = useState(initialSfxEnabled);
  const [ambientEnabled, setAmbientEnabled] = useState(initialAmbientEnabled);
  const [musicVolume, setMusicVolume] = useState(initialMusicVolume);
  const [ambientVolume, setAmbientVolume] = useState(initialAmbientVolume);
  const [musicSelection, setMusicSelection] = useState<string>(initialMusicSelection);
  const [dayNightAutoCycleEnabled, setDayNightAutoCycleEnabled] = useState(() => {
    const stored = Storage.getItem('map_daynight_autocycle');
    return stored === 'true';
  });
  useEffect(() => {
    lastFlatMapModeRef.current = isFlatMapDay;
  }, [isFlatMapDay]);
  const [coopEnabled, setCoopEnabled] = useState(() => {
    const stored = Storage.getItem('option_coop_enabled');
    if (stored === 'true' || stored === 'false') {
      return stored === 'true';
    }
    return false;
  });
  const [activeTrackId, setActiveTrackId] = useState<MusicTrackId | null>(AudioSys.getCurrentTrack());

  useEffect(() => {
    AudioSys.setMusicEnabled(initialMusicEnabled);
    AudioSys.sfxEnabled = initialSfxEnabled;
    AudioSys.setMusicVolume(initialMusicVolume);
    AudioSys.setAmbientEnabled(initialAmbientEnabled);
    AudioSys.setAmbientVolume(initialAmbientVolume);
    AudioSys.updateAmbientForDefcon(S.defcon);
    if (initialMusicSelection === 'random') {
      AudioSys.setPreferredTrack(null);
    } else {
      if (AudioSys.TRACK_METADATA[initialMusicSelection as MusicTrackId]) {
        AudioSys.setPreferredTrack(initialMusicSelection as MusicTrackId);
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      stopDayNightBlendAnimation();
    };
  }, [stopDayNightBlendAnimation]);

  const musicTracks = useMemo(() => AudioSys.getTracks(), []);
  const [pandemicIntegrationEnabled, setPandemicIntegrationEnabled] = useState(() => {
    const stored = Storage.getItem('option_pandemic_integration');
    if (stored === 'true' || stored === 'false') {
      return stored === 'true';
    }
    return true;
  });
  const [bioWarfareEnabled, setBioWarfareEnabled] = useState(() => {
    const stored = Storage.getItem('option_biowarfare_conquest');
    if (stored === 'true' || stored === 'false') {
      return stored === 'true';
    }
    return true;
  });
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const lastTargetPingIdRef = useRef<string | null>(null);
  const [selectedTerritoryId, setSelectedTerritoryId] = useState<string | null>(null);
  const [hoveredTerritoryId, setHoveredTerritoryId] = useState<string | null>(null);
  const [draggingArmy, setDraggingArmy] = useState<{ sourceId: string; armies: number } | null>(null);
  const [draggingArmyPosition, setDraggingArmyPosition] = useState<{ x: number; y: number } | null>(null);
  const [dragTargetTerritoryId, setDragTargetTerritoryId] = useState<string | null>(null);
  const [conventionalState, setConventionalState] = useState<ConventionalState>(() => {
    const stored = Storage.getItem('conventional_state');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ConventionalState;
        return parsed;
      } catch (error) {
        // Parse failed - use default state
      }
    }
    return S.conventional ?? createDefaultConventionalState(
      nations.map(nation => ({ id: nation.id, isPlayer: nation.isPlayer }))
    );
  });

  const territoryList = useMemo<TerritoryState[]>(() => {
    const source = conventionalState?.territories as unknown;
    if (!source) {
      return [];
    }
    if (Array.isArray(source)) {
      return source as TerritoryState[];
    }
    return Object.values(source as Record<string, TerritoryState>);
  }, [conventionalState]);

  const territoryMap = useMemo(() => {
    const map = new Map<string, TerritoryState>();
    territoryList.forEach(territory => {
      map.set(territory.id, territory);
    });
    return map;
  }, [territoryList]);

  // Update module-level territoryListRef
  useEffect(() => {
    territoryListRef.current = territoryList;
  }, [territoryList]);

  // Update module-level territory state refs
  useEffect(() => {
    selectedTerritoryIdRef.current = selectedTerritoryId;
  }, [selectedTerritoryId]);

  useEffect(() => {
    hoveredTerritoryIdRef.current = hoveredTerritoryId;
  }, [hoveredTerritoryId]);

  useEffect(() => {
    dragTargetTerritoryIdRef.current = dragTargetTerritoryId;
  }, [dragTargetTerritoryId]);

  useEffect(() => {
    draggingArmyRef.current = draggingArmy;
  }, [draggingArmy]);

  const getTerritoryById = useCallback(
    (territoryId: string | null | undefined) => {
      if (!territoryId) {
        return null;
      }
      return territoryMap.get(territoryId) ?? null;
    },
    [territoryMap],
  );

  const dragTargetName = useMemo(() => {
    if (!dragTargetTerritoryId) {
      return null;
    }
    return territoryMap.get(dragTargetTerritoryId)?.name ?? null;
  }, [dragTargetTerritoryId, territoryMap]);

  const [territoryPolygons, setTerritoryPolygons] = useState<TerritoryPolygon[]>([]);

  useEffect(() => {
    let isMounted = true;

    loadTerritoryData()
      .then((data) => {
        if (isMounted) {
          setTerritoryPolygons(data);
        }
      })
      .catch((error) => {
        console.error('[Index] Failed to load territory polygons', error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedLeaderGlobal = S.selectedLeader;
  const selectedDoctrineGlobal = S.selectedDoctrine;
  const playerNameGlobal = S.playerName;
  const hasOverlayCanvas = Boolean(globeSceneRef.current?.overlayCanvas);

  useEffect(() => {
    if (isGameStarted) {
      return;
    }

    if (gamePhase !== 'game') {
      return;
    }

    if (!selectedLeaderGlobal || !selectedDoctrineGlobal || !playerNameGlobal) {
      return;
    }

    setIsGameStarted(true);
  }, [gamePhase, isGameStarted, playerNameGlobal, selectedDoctrineGlobal, selectedLeaderGlobal]);

  useEffect(() => {
    if (!isGameStarted) {
      return;
    }

    if (hasAutoplayedTurnOneMusicRef.current) {
      return;
    }

    if (S.turn !== 1) {
      return;
    }

    if (!AudioSys.musicEnabled) {
      return;
    }

    let cancelled = false;

    void (async () => {
      while (!cancelled && AudioSys.musicEnabled && !AudioSys.getCurrentTrack()) {
        await AudioSys.resumeContext();
        await AudioSys.playPreferredTrack();
        if (AudioSys.getCurrentTrack()) {
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 250));
      }

      if (!cancelled && AudioSys.getCurrentTrack()) {
        hasAutoplayedTurnOneMusicRef.current = true;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isGameStarted]);

  useEffect(() => {
    console.log('[DEBUG] Bootstrap useEffect triggered, isGameStarted:', isGameStarted);
    if (!isGameStarted) {
      return;
    }

    const canvasElement = globeSceneRef.current?.overlayCanvas ?? null;
    if (!canvasElement) {
      console.log('[DEBUG] Bootstrap aborted - no overlay canvas yet');
      return;
    }

    console.log('[DEBUG] Bootstrap: Canvas available, setting up game loop');
    canvas = canvasElement;
    ctx = canvasElement.getContext('2d')!;

    if (!gameLoopRunning) {
      gameLoopRunning = true;
      requestAnimationFrame(gameLoop);
    }

    if (hasBootstrappedGameRef.current) {
      console.log('[DEBUG] Bootstrap: Already bootstrapped, enabling gameplay loop');
      isGameplayLoopEnabled = true;
      isAttractModeActive = false;
      return;
    }

    console.log('[DEBUG] Bootstrap: First time setup, initializing systems');
    hasBootstrappedGameRef.current = true;

    AudioSys.init();
    Atmosphere.init();
    Ocean.init();

    if (nations.length === 0) {
      console.log('[DEBUG] Bootstrap: Initializing nations');
      initNations();
      setConventionalState(S.conventional ?? createDefaultConventionalState());
      CityLights.generate();

      // Initialize simplified systems for all nations
      const initializedNations = nations.map(nation => {
        // Initialize bio-warfare state
        const withBio = initializeBioWarfareState(nation);

        // Initialize relationships if not present
        if (!withBio.relationships) {
          withBio.relationships = {};
        }

        return withBio;
      });

      // Apply diplomacy migration
      const migratedNations = migrateGameDiplomacy(initializedNations);
      nations = migratedNations;
      GameStateManager.setNations(migratedNations);
      PlayerManager.setNations(migratedNations);

      log('Simplified gameplay systems initialized', 'system');
    }

    isGameplayLoopEnabled = true;
    isAttractModeActive = false;
  }, [hasOverlayCanvas, isGameStarted, setConventionalState]);
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') {
        return;
      }
      if (!AudioSys.musicEnabled) {
        return;
      }
      void (async () => {
        await AudioSys.resumeContext();
        await AudioSys.playPreferredTrack({ forceRestart: false });
      })();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    AudioSys.init();
    const audioContext = AudioSys.audioContext;
    const handleStateChange = (event: Event) => {
      const context = event.target as AudioContext | null;
      if (!context) {
        return;
      }
      if (context.state !== 'running') {
        return;
      }
      if (!AudioSys.musicEnabled) {
        return;
      }
      void (async () => {
        await AudioSys.resumeContext();
        await AudioSys.playPreferredTrack({ forceRestart: false });
      })();
    };

    audioContext?.addEventListener('statechange', handleStateChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      audioContext?.removeEventListener('statechange', handleStateChange);
    };
  }, []);
  const [uiTick, setUiTick] = useState(0);
  const [overlayProjectorFn, setOverlayProjectorFn] = useState<ProjectorFn | null>(null);
  const [overlayProjectorVersion, setOverlayProjectorVersion] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPaused, setIsPaused] = useState(S.paused);
  const [showTutorial, setShowTutorial] = useState(() => {
    const hasSeenTutorial = Storage.getItem('has_seen_tutorial');
    return hasSeenTutorial !== 'true';
  });

  // Tutorial restart callbacks
  const handleRestartModalTutorial = useCallback(() => {
    Storage.removeItem('has_seen_tutorial');
    setShowTutorial(true);
    toast({
      title: 'Tutorial restarted',
      description: 'The introductory tutorial will now be shown.',
    });
  }, []);

  const handleRestartInteractiveTutorial = useCallback(() => {
    tutorialContext.enableTutorial();
    toast({
      title: 'Interactive guide restarted',
      description: 'The in-game interactive tutorial will now restart from the beginning.',
    });
  }, [tutorialContext]);

  useEffect(() => {
    Storage.setItem('option_coop_enabled', coopEnabled ? 'true' : 'false');
  }, [coopEnabled]);

  const handleCoopToggle = useCallback((enabled: boolean) => {
    setCoopEnabled(enabled);
    toast({
      title: enabled ? 'Co-op approvals enabled' : 'Co-op approvals disabled',
      description: enabled
        ? 'Command approvals and multiplayer sync have been reactivated.'
        : 'Single-commander mode active. Actions will auto-approve until re-enabled.',
    });
  }, []);

  useEffect(() => {
    if (!(pandemicIntegrationEnabled && bioWarfareEnabled)) {
      setIsBioWarfareOpen(false);
    }
  }, [pandemicIntegrationEnabled, bioWarfareEnabled]);
  const handleAttackRef = useRef<() => void>(() => {});
  const handleProjectorReady = useCallback(
    (projector: ProjectorFn) => {
      globeProjector = projector;
      setOverlayProjectorFn(() => projector);
      setOverlayProjectorVersion(0);
    },
    [setOverlayProjectorFn, setOverlayProjectorVersion],
  );
  const handleProjectorUpdate = useCallback(
    (projector: ProjectorFn, revision: number) => {
      globeProjector = projector;
      setOverlayProjectorFn(() => projector);
      setOverlayProjectorVersion(revision);
    },
    [setOverlayProjectorFn, setOverlayProjectorVersion],
  );
  const handlePickerReady = useCallback((picker: PickerFn) => {
    globePicker = picker;
  }, []);
  const { ensureAction, registerStateListener, publishState, canExecute } = useMultiplayer();

  const requestApproval = useCallback(
    async (action: Parameters<typeof ensureAction>[0], options?: Parameters<typeof ensureAction>[1]) => {
      if (!coopEnabled) {
        return true;
      }
      return ensureAction(action, options);
    },
    [coopEnabled, ensureAction],
  );

  const broadcastState = useCallback(() => {
    if (!coopEnabled) {
      return;
    }
    const sanitizedState: LocalGameState = {
      ...S,
      falloutMarks: Array.isArray(S.falloutMarks)
        ? S.falloutMarks.map(mark => ({ ...mark }))
        : [],
    };
    publishState({
      gameState: sanitizedState,
      nations: nations.map(nation => ({ ...nation })),
      conventionalDeltas: conventionalDeltas.map(delta => ({ ...delta })),
    });
  }, [coopEnabled, publishState]);

  useEffect(() => {
    if (!coopEnabled) {
      setMultiplayerPublisher(null);
      return () => setMultiplayerPublisher(null);
    }
    setMultiplayerPublisher(() => broadcastState);
    return () => setMultiplayerPublisher(null);
  }, [broadcastState, coopEnabled]);

  useEffect(() => {
    if (!coopEnabled) {
      return;
    }
    const unsubscribe = registerStateListener(envelope => {
      const { state } = envelope;
      suppressMultiplayerBroadcast = true;
      try {
        if (state.gameState) {
          const remoteState = state.gameState as Partial<LocalGameState>;
          S = applyRemoteGameStateSync(remoteState);
          if (!Array.isArray(S.satelliteOrbits)) {
            S.satelliteOrbits = [];
          }
          if (!Array.isArray(S.falloutMarks)) {
            S.falloutMarks = [];
          }
        }
        if (state.nations) {
          nations = state.nations.map(nation => ({ ...nation }));
          GameStateManager.setNations(nations);
          PlayerManager.setNations(nations);
        }
        if (state.conventionalDeltas) {
          conventionalDeltas = state.conventionalDeltas.map(delta => ({ ...delta }));
          GameStateManager.setConventionalDeltas(conventionalDeltas);
        }
      } finally {
        suppressMultiplayerBroadcast = false;
      }
      updateDisplay();
    });
    return unsubscribe;
  }, [coopEnabled, registerStateListener]);

  useEffect(() => {
    const unsubscribe = AudioSys.subscribeToTrackChanges(trackId => {
      setActiveTrackId(trackId);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const unlock = () => {
      AudioSys.handleUserInteraction();
    };
    const options: AddEventListenerOptions = { once: true, passive: true };
    window.addEventListener('pointerdown', unlock, options);
    window.addEventListener('keydown', unlock, options);
    window.addEventListener('touchstart', unlock, options);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
  }, []);

  // News ticker and flashpoints - Moved up before blockingModalActive
  const [isOutlinerCollapsed, setIsOutlinerCollapsed] = useState(false);
  const [outlinerAttentionTick, setOutlinerAttentionTick] = useState(0);
  const globalStrategicOutlinerRef = useRef<HTMLDivElement | null>(null);
  const leaderStrategicOutlinerRef = useRef<HTMLDivElement | null>(null);
  const strategicOutlinerHotkeys = useMemo(() => ({ toggle: 'O', focus: 'Shift+O' }), []);
  const handleOutlinerToggle = useCallback(() => {
    setIsOutlinerCollapsed((previous) => {
      const next = !previous;
      if (!next) {
        setOutlinerAttentionTick(Date.now());
      }
      return next;
    });
    AudioSys.playSFX('click');
  }, [setOutlinerAttentionTick]);
  const { distortNationIntel, generateFalseIntel } = useFogOfWar(rng);


  const getAllNations = useCallback(() => nations, []);

  // Integrated bio-warfare system (combines pandemic + evolution tree)
  const {
    pandemicState,
    triggerPandemic,
    applyCountermeasure: applyPandemicCountermeasure,
    advancePandemicTurn,
    upgradeTrait: upgradePandemicTrait,
    downgradeTrait: downgradePandemicTrait,
    resetTraits: resetPandemicTraits,
    deployTraits: deployPandemicTraits
  } = usePandemic(addNewsItem, rng);

  const showPandemicPanel = useMemo(() => {
    if (!pandemicIntegrationEnabled) {
      return false;
    }

    if (bioWarfareEnabled && isBioWarfareOpen) {
      return true;
    }

    const {
      active,
      outbreaks,
      globalInfection,
      mutationLevel,
      vaccineProgress,
      casualtyTally,
    } = pandemicState;

    if (active) {
      return true;
    }

    const hasOutbreakActivity = outbreaks.some(
      (outbreak) => outbreak.infection > 0 || outbreak.heat > 0,
    );

    const hasPandemicMomentum =
      globalInfection > 0 ||
      mutationLevel > 0 ||
      vaccineProgress > 0 ||
      casualtyTally > 0;

    return hasOutbreakActivity || hasPandemicMomentum;
  }, [
    pandemicIntegrationEnabled,
    bioWarfareEnabled,
    isBioWarfareOpen,
    pandemicState,
  ]);

  // Evolution tree system for Plague Inc style gameplay
  const {
    plagueState,
    labFacility,
    applyCountermeasure: applyBioWarfareCountermeasure,
    selectPlagueType,
    evolveNode,
    devolveNode,
    addDNAPoints,
    startLabConstruction,
    cancelLabConstruction,
    getConstructionOptions,
    deployBioWeapon,
    triggerBioWarfare,
    advanceBioWarfareTurn,
    onCountryInfected,
    availableNodes,
    calculateSpreadModifiers,
  } = useBioWarfare(addNewsItem, selectedScenario);

  const previousLabTierRef = useRef<BioLabTier>(labFacility.tier);
  const casualtyAlertTrackerRef = useRef(createCasualtyAlertTracker());

  // Keep module-level refs in sync with hook state for use in endTurn()
  useEffect(() => {
    pandemicStateRef = pandemicState;
  }, [pandemicState]);

  useEffect(() => {
    plagueStateRef = plagueState;
  }, [plagueState]);

  const pandemicCasualtyTally = pandemicState?.casualtyTally ?? 0;
  const plagueTotalKills = plagueState?.plagueCompletionStats?.totalKills ?? 0;
  const nonPandemicCasualtyTally = GameStateManager.getStatistics().nonPandemicCasualties ?? 0;

  const globalCasualtyDisplay = useMemo(() => {
    const totalCasualties =
      Math.max(0, pandemicCasualtyTally) +
      Math.max(0, plagueTotalKills) +
      Math.max(0, nonPandemicCasualtyTally);

    if (totalCasualties <= 0) {
      return null;
    }

    const compactFormatter = new Intl.NumberFormat(undefined, {
      notation: 'compact',
      maximumFractionDigits: 1,
    });

    return {
      total: totalCasualties,
      displayValue: compactFormatter.format(totalCasualties),
      fullValue: Math.round(totalCasualties).toLocaleString(),
    };
  }, [pandemicCasualtyTally, plagueTotalKills, nonPandemicCasualtyTally]);

  const renderCasualtyBadge = useCallback(
    (extraClasses?: string) => {
      if (!globalCasualtyDisplay) {
        return null;
      }

      const className = `flex items-center justify-center gap-2 rounded-full border border-rose-500/40 bg-black/70 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.35em] text-rose-200 shadow-[0_0_12px_rgba(244,63,94,0.35)] ${extraClasses ?? ''}`.trim();

      return (
        <div
          role="status"
          aria-live="polite"
          aria-label={`Global casualties ${globalCasualtyDisplay.fullValue}`}
          className={className}
        >
          <span className="text-rose-300/80">CASUALTIES</span>
          <span className="text-rose-300 text-xs tracking-[0.25em]">{globalCasualtyDisplay.displayValue}</span>
        </div>
      );
    },
    [globalCasualtyDisplay],
  );

  useEffect(() => {
    const previousTier = previousLabTierRef.current;
    const currentTier = labFacility.tier;

    if (currentTier !== previousTier) {
      const player = PlayerManager.get();

      if (player) {
        PlayerManager.set({
          ...player,
          bioLab: { ...labFacility },
        });
      }

      if (
        currentTier > previousTier &&
        currentTier >= 3 &&
        previousTier < 3 &&
        pandemicIntegrationEnabled &&
        bioWarfareEnabled
      ) {
        setIsBioWarfareOpen(true);
        toast({
          title: 'BioForge Facility Online',
          description: 'Tier 3 bio-warfare lab activated. Advanced operations unlocked.',
        });
        log('BioForge lab Tier 3 activated - advanced operations unlocked', 'success');
      }

      previousLabTierRef.current = currentTier;
    }
  }, [
    labFacility.tier,
    bioWarfareEnabled,
    pandemicIntegrationEnabled,
  ]);

  useEffect(() => {
    if (
      selectedScenarioId === 'pandemic2020' &&
      labFacility.tier >= 3 &&
      pandemicIntegrationEnabled &&
      bioWarfareEnabled
    ) {
      setIsBioWarfareOpen(true);
    }
  }, [
    selectedScenarioId,
    labFacility.tier,
    bioWarfareEnabled,
    pandemicIntegrationEnabled,
  ]);

  const handleUseLeaderAbility = useCallback(
    (targetId?: string) => {
      const deps: LeaderAbilityDeps = {
        toast,
        gameState: S,
        nations,
        log,
        addNewsItem,
        updateDisplay,
      };
      handleUseLeaderAbilityExtracted(targetId, deps);
    },
    [toast, nations, log, addNewsItem, updateDisplay]
  );

  // Hearts of Iron Phase 2: Memoize nations data to prevent infinite loops
  const memoizedNationsForTemplates = useMemo(() =>
    nations.map(n => ({ id: n.id, name: n.name })),
    [nations.map(n => `${n.id}-${n.name}`).join(',')]
  );

  const memoizedNationsForSupply = useMemo(() =>
    nations.map(n => ({
      id: n.id,
      name: n.name,
      territories: conventionalState?.territories
        ? Object.keys(conventionalState.territories).filter(
            tid => conventionalState.territories[tid]?.controllingNationId === n.id
          )
        : []
    })),
    [nations.map(n => n.id).join(','), conventionalState?.territories]
  );

  const memoizedDomesticNationSummaries = useMemo(
    () => nations.map(n => ({ id: n.id, name: n.name, ideology: n.ideology })),
    [nations.map(n => `${n.id}-${n.name}-${n.ideology ?? ''}`).join(',')]
  );

  const memoizedNationIdNameList = useMemo(
    () => nations.map(n => ({ id: n.id, name: n.name })),
    [nations.map(n => `${n.id}-${n.name}`).join(',')]
  );

  // Hearts of Iron Phase 2: Military Templates System - MUST be declared before useConventionalWarfare
  const militaryTemplates = useMilitaryTemplates({
    currentTurn: S.turn,
    nations: memoizedNationsForTemplates,
  });

  const { templateStates: militaryTemplateStates, deployedUnits: militaryDeployedUnits } = militaryTemplates;

  // Hearts of Iron Phase 2: Supply System - MUST be declared before useConventionalWarfare
  const supplySystem = useSupplySystem({
    currentTurn: S.turn,
    nations: memoizedNationsForSupply,
  });

  const conventional = useConventionalWarfare({
    initialState: conventionalState,
    currentTurn: S.turn,
    getNation: getNationById,
    onStateChange: setConventionalState,
    onConsumeAction: consumeAction,
    onUpdateDisplay: updateDisplay,
    onDefconChange: (delta) => {
      const reason = delta < 0
        ? 'Military tensions escalate from territorial conflict'
        : 'Global tensions ease from resolved territorial disputes';

      handleDefconChange(delta, reason, 'system', {
        onAudioTransition: AudioSys.handleDefconTransition,
        onLog: log,
        onNewsItem: addNewsItem,
        onUpdateDisplay: updateDisplay,
        onShowModal: setDefconChangeEvent,
      });
    },
    onRelationshipChange: (nationId1, nationId2, delta, reason, currentTurn) => {
      const index1 = nations.findIndex(nation => nation.id === nationId1);
      const index2 = nations.findIndex(nation => nation.id === nationId2);

      if (index1 === -1 || index2 === -1) {
        return;
      }

      const nation1 = nations[index1];
      const nation2 = nations[index2];

      const updatedNation1 = modifyRelationship(nation1, nationId2, delta, reason, currentTurn);
      const updatedNation2 = modifyRelationship(nation2, nationId1, delta, reason, currentTurn);

      const updatedNations = [...nations];
      updatedNations[index1] = updatedNation1 as LocalNation;
      updatedNations[index2] = updatedNation2 as LocalNation;
      nations = updatedNations;
      GameStateManager.setNations(updatedNations);
      PlayerManager.setNations(updatedNations);

      if (Math.abs(delta) >= 10) {
        const message = delta < 0
          ? `${nation1.name} ↔ ${nation2.name} relations deteriorate (${delta})`
          : `${nation1.name} ↔ ${nation2.name} relations improve (+${delta})`;
        log(message, delta < 0 ? 'warning' : 'success');
        addNewsItem('diplomatic', message, Math.abs(delta) >= 25 ? 'critical' : 'important');
      }
      updateDisplay();
    },
    militaryTemplatesApi: {
      getTemplate: militaryTemplates.getTemplate,
      getTemplateStats: militaryTemplates.getTemplateStats,
    },
    supplySystemApi: {
      getTerritorySupply: supplySystem.getTerritorySupply,
    },
  });

  const [globeUnits, setGlobeUnits] = useState<Unit[]>([]);

  const conventionalUnitsState = conventional.state?.units;
  const conventionalTemplatesState = conventional.state?.templates;

  useEffect(() => {
    if (!conventionalUnitsState) {
      setGlobeUnits([]);
      return;
    }

    const mappedUnits: Unit[] = [];

    Object.values(conventionalUnitsState).forEach((unit) => {
      if (unit.status !== 'deployed' || !unit.locationId) {
        return;
      }

      const territory = territoryMap.get(unit.locationId);
      if (!territory) {
        return;
      }

      const template = conventionalTemplatesState?.[unit.templateId];
      const unitType = template?.id ?? unit.templateId;

      mappedUnits.push({
        id: unit.id,
        lon: territory.anchorLon,
        lat: territory.anchorLat,
        type: unitType,
      });
    });

    setGlobeUnits(mappedUnits);
  }, [conventionalUnitsState, conventionalTemplatesState, territoryMap]);

  const cyber = useCyberWarfare({
    currentTurn: S.turn,
    getNation: getNationById,
    getNations: getAllNations,
    onLog: (message, tone) => log(message, tone),
    onToast: payload => toast(payload),
    onNews: addNewsItem,
    onDefconShift: (delta, reason) => {
      handleDefconChange(delta, reason, 'system', {
        onAudioTransition: AudioSys.handleDefconTransition,
        onLog: log,
        onNewsItem: addNewsItem,
        onUpdateDisplay: updateDisplay,
        onShowModal: setDefconChangeEvent,
      });
    },
  });

  const spyNetwork = useSpyNetwork({
    currentTurn: S.turn,
    getNation: (id: string) => GameStateManager.getNation(id),
    getNations: () => GameStateManager.getNations(),
    updateNation: applyNationUpdate,
    updateNations: applyNationUpdatesMap,
    getGameState: () => GameStateManager.getState(),
    onLog: (message, tone) => log(message, tone),
    onToast: (payload) => toast(payload),
    onMissionResult: (result) => {
      setCurrentSpyMissionResult(result as SpyMissionResultData);
    },
  });

  const warSupport = useWarSupport({
    currentTurn: S.turn,
    nations: memoizedDomesticNationSummaries,
  });

  const politicalFactions = usePoliticalFactions({
    currentTurn: S.turn,
    onFactionDemand: (nationId, demand) => {
      const nation = getNationById(nations, nationId);
      const severityLabel = demand.severity === 'ultimatum'
        ? 'ULTIMATUM'
        : demand.severity === 'demand'
          ? 'Demand'
          : 'Request';
      const message = `${severityLabel}: ${nation?.name ?? 'Unknown nation'} faction issues ${demand.description}`;
      log(message, demand.severity === 'ultimatum' ? 'warning' : 'info');

      if (nation?.isPlayer) {
        addNewsItem('governance', message, demand.severity === 'ultimatum' ? 'critical' : 'important');
        toast({
          title: 'Faction Pressure',
          description: demand.description,
          variant: demand.severity === 'ultimatum' ? 'destructive' : 'default',
        });
      }
    },
    onCoupAttempt: (nationId, coup) => {
      const nation = getNationById(nations, nationId);
      const message = `⚠️ Coup plotting detected in ${nation?.name ?? 'unknown nation'} (success chance ${Math.round(coup.successChance)}%)`;
      log(message, 'warning');
      if (nation?.isPlayer) {
        addNewsItem('governance', message, 'critical');
        toast({
          title: 'Coup Attempt Detected',
          description: 'Domestic factions are mobilizing against your government.',
          variant: 'destructive',
        });
      }
    },
    onCoalitionShift: (nationId, factionId, joined) => {
      const nation = getNationById(nations, nationId);
      const direction = joined ? 'joined' : 'left';
      log(`Faction ${factionId} has ${direction} the ruling coalition in ${nation?.name ?? 'unknown nation'}.`, 'info');
    },
  });

  const { initializeFactions, getFactionsForNation } = politicalFactions;

  const regionalMorale = useRegionalMorale({
    territories: territoryList,
    currentTurn: S.turn,
    onMoraleChange: (territoryId, oldMorale, newMorale) => {
      const territory = territoryMap.get(territoryId);
      const controllingNation = territory?.controllingNationId ? getNationById(nations, territory.controllingNationId) : null;
      if (!controllingNation?.isPlayer) {
        return;
      }

      const delta = newMorale - oldMorale;
      if (Math.abs(delta) < 10) {
        return;
      }

      const tone = delta < 0 ? 'warning' : 'success';
      const priority = delta < 0 ? 'important' : 'info';
      const message = `${territory?.name ?? 'Unknown territory'} morale ${delta < 0 ? 'drops' : 'improves'} to ${Math.round(newMorale)}.`;
      log(message, tone);
      addNewsItem('domestic', message, priority);
    },
    onProtestStart: (territoryId, protest) => {
      const territory = territoryMap.get(territoryId);
      const controllingNation = territory?.controllingNationId ? getNationById(nations, territory.controllingNationId) : null;
      const cause = protest.causes[0]?.replace(/_/g, ' ') ?? 'unrest';
      const message = `Protest erupts in ${territory?.name ?? 'unknown territory'} over ${cause}.`;
      log(message, 'warning');
      if (controllingNation?.isPlayer) {
        addNewsItem('domestic', message, 'important');
        toast({
          title: 'Domestic Unrest',
          description: `Civilians rally over ${cause}.`,
          variant: 'destructive',
        });
      }
    },
    onStrikeStart: (territoryId, strike) => {
      const territory = territoryMap.get(territoryId);
      const controllingNation = territory?.controllingNationId ? getNationById(nations, territory.controllingNationId) : null;
      const demandType = strike.strikerDemands[0]?.type.replace(/_/g, ' ') ?? 'grievances';
      const message = `Workers strike in ${territory?.name ?? 'unknown territory'} over ${demandType}.`;
      log(message, 'warning');
      if (controllingNation?.isPlayer) {
        addNewsItem('domestic', message, 'important');
      }
    },
    onCivilWarRisk: (nationId, risk) => {
      const nation = getNationById(nations, nationId);
      if (!nation?.isPlayer) {
        return;
      }
      const message = `Civil war risk at ${Math.round(risk.riskLevel)}% after ${risk.turnsAtRisk} turns of unrest.`;
      log(message, 'warning');
      addNewsItem('domestic', message, risk.riskLevel >= 80 ? 'critical' : 'important');
      if (risk.riskLevel >= 80) {
        toast({
          title: 'Civil War Imminent',
          description: 'Stabilize your nation immediately to prevent collapse.',
          variant: 'destructive',
        });
      }
    },
  });

  const mediaWarfare = useMediaWarfare({
    currentTurn: S.turn,
    onCampaignStarted: (campaign) => {
      const source = getNationById(nations, campaign.sourceNationId);
      const target = getNationById(nations, campaign.targetNationId);
      const description = `${campaign.type.replace(/_/g, ' ')} campaign launched by ${source?.name ?? 'Unknown'} targeting ${target?.name ?? 'Unknown'}.`;
      log(description, 'info');
      if (source?.isPlayer || target?.isPlayer) {
        addNewsItem('media', description, 'info');
      }
    },
    onCampaignExposed: (campaign) => {
      const source = getNationById(nations, campaign.sourceNationId);
      const target = getNationById(nations, campaign.targetNationId);
      const message = `Propaganda campaign from ${source?.name ?? 'Unknown'} exposed by ${target?.name ?? 'Unknown'}!`;
      log(message, 'warning');
      addNewsItem('media', message, 'important');
      if (source?.isPlayer || target?.isPlayer) {
        toast({
          title: 'Propaganda Exposed',
          description: message,
          variant: 'destructive',
        });
      }
    },
    onMediaEvent: (event) => {
      const nation = getNationById(nations, event.nationId);
      if (!nation) {
        return;
      }
      const baseMessage = `${nation.name}: ${event.type.replace(/_/g, ' ')} media event.`;
      const priority = event.severity === 'major' ? 'important' : event.severity === 'critical' ? 'critical' : 'info';
      addNewsItem('media', baseMessage, priority);
      if (nation.isPlayer) {
        log(baseMessage, event.severity === 'critical' ? 'warning' : 'info');
      }
    },
  });

  const { initializeMediaPower, getMediaPower } = mediaWarfare;

  const productionQueue = useProductionQueue({
    nations: memoizedNationIdNameList,
    currentTurn: S.turn,
  });

  const resourceRefinement = useResourceRefinement({
    nations: memoizedNationIdNameList,
  });

  // Hearts of Iron Phase 3: Economic Depth System
  const economicDepth = useEconomicDepth(
    nations,
    S.turn,
    playerNationId
  );

  useEffect(() => {
    spyNetworkApi = spyNetwork;
    return () => {
      if (spyNetworkApi === spyNetwork) {
        spyNetworkApi = null;
      }
    };
  }, [spyNetwork]);

  useEffect(() => {
    economicDepthApi = economicDepth;
    if (typeof window !== 'undefined') {
      (window as any).economicDepthApi = economicDepth;
    }
    return () => {
      if (economicDepthApi === economicDepth) {
        economicDepthApi = null;
        if (typeof window !== 'undefined') {
          (window as any).economicDepthApi = null;
        }
      }
    };
  }, [economicDepth]);

  useEffect(() => {
    militaryTemplatesApi = militaryTemplates;
    if (typeof window !== 'undefined') {
      (window as any).militaryTemplatesApi = militaryTemplates;
    }
    return () => {
      if (militaryTemplatesApi === militaryTemplates) {
        militaryTemplatesApi = null;
        if (typeof window !== 'undefined') {
          (window as any).militaryTemplatesApi = null;
        }
      }
    };
  }, [militaryTemplates]);

  useEffect(() => {
    supplySystemApi = supplySystem;
    if (typeof window !== 'undefined') {
      (window as any).supplySystemApi = supplySystem;
    }
    return () => {
      if (supplySystemApi === supplySystem) {
        supplySystemApi = null;
        if (typeof window !== 'undefined') {
          (window as any).supplySystemApi = null;
        }
      }
    };
  }, [supplySystem]);

  useEffect(() => {
    memoizedNationIdNameList.forEach(({ id, name }) => {
      if (getFactionsForNation(id).length === 0) {
        initializeFactions(id, name, 'cold_war');
      }
    });
  }, [memoizedNationIdNameList, getFactionsForNation, initializeFactions]);

  useEffect(() => {
    memoizedNationIdNameList.forEach(({ id }) => {
      if (!getMediaPower(id)) {
        initializeMediaPower(id);
      }
    });
  }, [memoizedNationIdNameList, getMediaPower, initializeMediaPower]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).warSupportApi = warSupport;
    }
    return () => {
      if (typeof window !== 'undefined' && (window as any).warSupportApi === warSupport) {
        delete (window as any).warSupportApi;
      }
    };
  }, [warSupport]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).politicalFactionsApi = politicalFactions;
    }
    return () => {
      if (typeof window !== 'undefined' && (window as any).politicalFactionsApi === politicalFactions) {
        delete (window as any).politicalFactionsApi;
      }
    };
  }, [politicalFactions]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).regionalMoraleApi = regionalMorale;
    }
    return () => {
      if (typeof window !== 'undefined' && (window as any).regionalMoraleApi === regionalMorale) {
        delete (window as any).regionalMoraleApi;
      }
    };
  }, [regionalMorale]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).mediaWarfareApi = mediaWarfare;
    }
    return () => {
      if (typeof window !== 'undefined' && (window as any).mediaWarfareApi === mediaWarfare) {
        delete (window as any).mediaWarfareApi;
      }
    };
  }, [mediaWarfare]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).productionQueueApi = productionQueue;
    }
    return () => {
      if (typeof window !== 'undefined' && (window as any).productionQueueApi === productionQueue) {
        delete (window as any).productionQueueApi;
      }
    };
  }, [productionQueue]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).resourceRefinementApi = resourceRefinement;
    }
    return () => {
      if (typeof window !== 'undefined' && (window as any).resourceRefinementApi === resourceRefinement) {
        delete (window as any).resourceRefinementApi;
      }
    };
  }, [resourceRefinement]);

  const {
    getActionAvailability: getCyberActionAvailability,
    launchAttack: launchCyberAttack,
    launchFalseFlag: launchCyberFalseFlag,
    hardenNetworks: hardenCyberNetworks,
    advanceTurn: advanceCyberTurn,
    runAiPlan: runCyberAiPlan,
  } = cyber;

  const governanceNationsRef = useRef(nations);
  const governanceNationIdsSignatureRef = useRef<string>('');
  const [governanceNationsVersion, setGovernanceNationsVersion] = useState(0);

  useEffect(() => {
    governanceNationsRef.current = nations;
    const signature = nations
      .map((nation) => nation.id)
      .sort()
      .join('|');
    if (signature !== governanceNationIdsSignatureRef.current) {
      governanceNationIdsSignatureRef.current = signature;
      setGovernanceNationsVersion((version) => version + 1);
    }
  }, [nations]);

  const getGovernanceNations = useCallback(
    () => governanceNationsRef.current as unknown as GovernanceNationRef[],
    [],
  );

  const handleGovernanceMetricsSync = useCallback(
    (nationId: string, metrics: GovernanceMetrics) => {
      const nation = getNationById(governanceNationsRef.current, nationId);
      if (!nation) return;
      nation.morale = metrics.morale;
      nation.publicOpinion = metrics.publicOpinion;
      nation.electionTimer = metrics.electionTimer;
      nation.cabinetApproval = metrics.cabinetApproval;
    },
    [],
  );

  const handleGovernanceDelta = useCallback(
    (nationId: string, delta: GovernanceDelta) => {
      const nation = getNationById(governanceNationsRef.current, nationId);
      if (!nation) return;
      if (typeof delta.instability === 'number') {
        nation.instability = Math.max(0, (nation.instability || 0) + delta.instability);
      }
      if (typeof delta.production === 'number') {
        nation.production = Math.max(0, nation.production + delta.production);
      }
      if (typeof delta.intel === 'number') {
        nation.intel = Math.max(0, (nation.intel || 0) + delta.intel);
      }
      if (typeof delta.uranium === 'number') {
        addStrategicResource(nation, 'uranium', delta.uranium);
      }
    },
    [],
  );

  const handleOppositionUpdate = useCallback(
    (nationId: string, oppositionState: import('@/types/opposition').OppositionState) => {
      const nation = getNationById(governanceNationsRef.current, nationId);
      if (!nation) return;
      nation.oppositionState = oppositionState;

      // Apply opposition action effects
      const latestAction = oppositionState.recentActions[0];
      if (latestAction && latestAction.turn === S.turn) {
        // Apply effects through governance delta
        handleGovernanceDelta(nationId, latestAction.effects);
      }
    },
    [handleGovernanceDelta],
  );

  const governance = useGovernance({
    currentTurn: S.turn,
    getNations: getGovernanceNations,
    onMetricsSync: handleGovernanceMetricsSync,
    onApplyDelta: handleGovernanceDelta,
    onAddNewsItem: (category, text, priority) => addNewsItem(category, text, priority),
    nationsVersion: governanceNationsVersion,
  });

  // Government system
  const government = useGovernment({
    currentTurn: S.turn,
    getNations: () => nations.map(n => ({
      id: n.id,
      name: n.name,
      isPlayer: n.isPlayer,
      morale: n.morale,
      publicOpinion: n.publicOpinion,
      cabinetApproval: n.cabinetApproval,
      instability: n.instability,
      electionTimer: n.electionTimer,
      missiles: n.missiles,
      bombers: n.bombers,
      submarines: n.submarines,
      governmentState: n.governmentState,
    })),
    onGovernmentSync: (nationId, state) => {
      const nation = getNationById(governanceNationsRef.current, nationId);
      if (nation) {
        nation.governmentState = state;
      }
    },
    onGovernmentTransition: (nationId, transition) => {
      const nation = nations.find(n => n.id === nationId);
      if (nation) {
        addNewsItem(
          'governance',
          `${nation.name}: ${transition.description}`,
          transition.peaceful ? 'important' : 'critical'
        );
      }
    },
    onAddNewsItem: (category, text, priority) => addNewsItem(category, text, priority),
    nationsVersion: governanceNationsVersion,
  });

  // Opposition tracking system
  useOpposition({
    currentTurn: S.turn,
    getNations: getGovernanceNations,
    metrics: governance.metrics,
    onUpdateOpposition: handleOppositionUpdate,
    onAddNewsItem: (category, text, priority) => addNewsItem(category, text, priority),
  });

  const playerGovernanceMetrics = playerNation ? governance.metrics[playerNation.id] : undefined;

  const mapModeData = useMemo<MapModeOverlayData>(() => {
    const playerNation = nations.find(n => n.isPlayer) || null;
    const playerId = playerNation?.id ?? null;
    const relationships: Record<string, number> = {};
    const intelLevels: Record<string, number> = {};
    const resourceTotals: Record<string, number> = {};
    const unrest: Record<string, { morale: number; publicOpinion: number; instability: number }> = {};
    const pandemicOverlay = {
      infections: {} as Record<string, number>,
      heat: {} as Record<string, number>,
      casualties: {} as Record<string, number>,
      detections: {} as Record<string, boolean>,
      stage: pandemicState.stage,
      globalInfection: pandemicState.globalInfection,
      globalCasualties: pandemicState.casualtyTally,
      vaccineProgress: pandemicState.vaccineProgress,
    };
    const migrationOverlay = {
      inflow: {} as Record<string, number>,
      outflow: {} as Record<string, number>,
      net: {} as Record<string, number>,
      policyRate: {} as Record<string, number>,
      bonusMultiplier: {} as Record<string, number>,
      attraction: {} as Record<string, number>,
      pressure: {} as Record<string, number>,
    };
    const radiationOverlay: NonNullable<MapModeOverlayData['radiation']> = {
      exposures: {},
      sickness: {},
      refugeePressure: {},
      falloutMarks: [],
      radiationZones: [],
      globalRadiation: Number.isFinite(S.globalRadiation)
        ? Math.round(Number(S.globalRadiation) * 100) / 100
        : 0,
    };

    const roundToHundred = (value: number) =>
      Number.isFinite(value) ? Math.round(value * 100) / 100 : 0;

    const nationById = new Map<string, Nation>();
    const nationByName = new Map<string, Nation>();
    const coordinateNations = nations.filter(
      nation => Number.isFinite(nation.lon) && Number.isFinite(nation.lat),
    );

    const resolveNationIdForLocation = (
      candidateId: string | null | undefined,
      lon: number,
      lat: number,
    ): string | null => {
      if (candidateId && nationById.has(candidateId)) {
        return candidateId;
      }
      if (!Number.isFinite(lon) || !Number.isFinite(lat) || coordinateNations.length === 0) {
        return null;
      }
      let closest: { id: string; distance: number } | null = null;
      const latRad = (lat * Math.PI) / 180;

      coordinateNations.forEach(nation => {
        const lon2 = Number(nation.lon);
        const lat2 = Number(nation.lat);
        if (!Number.isFinite(lon2) || !Number.isFinite(lat2)) {
          return;
        }
        const lonDelta = (lon2 - lon) * Math.cos((latRad + (lat2 * Math.PI) / 180) / 2);
        const latDelta = lat2 - lat;
        const distance = Math.hypot(lonDelta, latDelta);
        if (!closest || distance < closest.distance) {
          closest = { id: nation.id, distance };
        }
      });

      return closest?.id ?? null;
    };

    const registerExposure = (nationId: string | null | undefined, value: number) => {
      if (!nationId) {
        return;
      }
      const clamped = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
      const previous = radiationOverlay.exposures[nationId] ?? 0;
      if (clamped > previous) {
        radiationOverlay.exposures[nationId] = clamped;
      }
    };

    nations.forEach(nation => {
      nationById.set(nation.id, nation);
      if (typeof nation.name === 'string') {
        nationByName.set(nation.name.toLowerCase(), nation);
      }

      relationships[nation.id] = playerNation
        ? playerNation.relationships?.[nation.id] ?? nation.relationships?.[playerNation.id] ?? (nation.isPlayer ? 100 : 0)
        : 0;

      intelLevels[nation.id] = nation.intel ?? 0;

      if (nation.resourceStockpile) {
        const { oil = 0, uranium = 0, rare_earths = 0, food = 0 } = nation.resourceStockpile;
        resourceTotals[nation.id] = oil + uranium + rare_earths + food;
      } else {
        const production = nation.production ?? 0;
        const uranium = nation.uranium ?? 0;
        const intel = nation.intel ?? 0;
        resourceTotals[nation.id] = production + uranium + intel;
      }

      const metrics = governance.metrics[nation.id];
      unrest[nation.id] = metrics
        ? {
            morale: metrics.morale ?? nation.morale ?? 50,
            publicOpinion: metrics.publicOpinion ?? nation.publicOpinion ?? 50,
            instability: metrics.instability ?? nation.instability ?? 0,
          }
        : {
            morale: nation.morale ?? 50,
            publicOpinion: nation.publicOpinion ?? 50,
            instability: nation.instability ?? 0,
          };

      const refugeeOutflow = Math.max(0, Number(nation.refugeeFlow ?? 0));
      const migrantsRecent = Math.max(
        0,
        Number(nation.migrantsThisTurn ?? 0),
        Number(nation.migrantsLastTurn ?? 0),
        Number(nation.immigrants ?? 0),
      );

      const policyKey = nation.currentImmigrationPolicy as ImmigrationPolicyType | undefined;
      const policyDef = policyKey ? IMMIGRATION_POLICIES[policyKey] : undefined;
      const policyRate = Number.isFinite(policyDef?.immigrationRate) ? policyDef!.immigrationRate : 0;

      const bonusRaw = Number(nation.immigrationBonus ?? 0);
      let bonusMultiplier = 1;
      if (Number.isFinite(bonusRaw) && bonusRaw !== 0) {
        if (bonusRaw > 0 && bonusRaw < 1) {
          bonusMultiplier = 1 + bonusRaw;
        } else if (bonusRaw >= 1) {
          bonusMultiplier = bonusRaw;
        } else {
          bonusMultiplier = Math.max(0.25, 1 + bonusRaw);
        }
      }

      const projectedInbound = policyRate * bonusMultiplier;
      const inbound = Math.max(projectedInbound, migrantsRecent);
      const netFlow = inbound - refugeeOutflow;

      const normalizedInbound = Math.min(1, inbound / 12);
      const normalizedPolicy = Math.min(1, policyRate / 10);
      const normalizedBonus = Math.min(1, Math.max(0, bonusMultiplier - 1) / 1.5);
      const attractionScore = Math.round(
        Math.min(1, normalizedInbound * 0.5 + normalizedPolicy * 0.25 + normalizedBonus * 0.25) * 100,
      );

      const normalizedOutflow = Math.min(1, refugeeOutflow / 8);
      const flowBalance = inbound > 0 ? Math.min(1, refugeeOutflow / Math.max(inbound, 0.5)) : normalizedOutflow;
      const pressureScore = Math.round(Math.min(1, normalizedOutflow * 0.6 + flowBalance * 0.4) * 100);

      migrationOverlay.inflow[nation.id] = roundToHundred(inbound);
      migrationOverlay.outflow[nation.id] = roundToHundred(refugeeOutflow);
      migrationOverlay.net[nation.id] = roundToHundred(netFlow);
      migrationOverlay.policyRate[nation.id] = roundToHundred(policyRate);
      migrationOverlay.bonusMultiplier[nation.id] = roundToHundred(bonusMultiplier);
      migrationOverlay.attraction[nation.id] = Math.max(0, Math.min(100, attractionScore));
      migrationOverlay.pressure[nation.id] = Math.max(0, Math.min(100, pressureScore));

      const sicknessScore = Number.isFinite(nation.radiationSickness)
        ? Math.max(0, Math.min(100, Math.round(nation.radiationSickness ?? 0)))
        : 0;
      radiationOverlay.sickness[nation.id] = sicknessScore;
      if (sicknessScore > 0) {
        registerExposure(nation.id, sicknessScore);
      }

      const refugeePressureScore = Math.max(0, Math.min(100, Math.round(refugeeOutflow * 12)));
      radiationOverlay.refugeePressure[nation.id] = refugeePressureScore;
      if (refugeePressureScore > 0) {
        registerExposure(nation.id, refugeePressureScore * 0.6);
      }
    });

    if (pandemicIntegrationEnabled) {
      pandemicState.outbreaks.forEach(outbreak => {
        if (!outbreak) return;
        const regionKey = typeof outbreak.region === 'string' ? outbreak.region : '';
        const match = nationById.get(regionKey) ?? nationByName.get(regionKey.toLowerCase());
        if (!match) return;

        const infectionValue = Number.isFinite(outbreak.infection)
          ? Math.max(0, Math.min(100, outbreak.infection))
          : 0;
        const heatValue = Number.isFinite(outbreak.heat)
          ? Math.max(0, Math.min(100, outbreak.heat))
          : 0;

        if (infectionValue > 0) {
          pandemicOverlay.infections[match.id] = Math.max(pandemicOverlay.infections[match.id] ?? 0, infectionValue);
        }
        if (heatValue > 0) {
          pandemicOverlay.heat[match.id] = Math.max(pandemicOverlay.heat[match.id] ?? 0, heatValue);
        }
      });
    }

    if (pandemicIntegrationEnabled && bioWarfareEnabled) {
      plagueState.countryInfections.forEach((infection, nationId) => {
        const infectionLevel = Number.isFinite(infection?.infectionLevel)
          ? Math.max(0, Math.min(100, infection.infectionLevel))
          : 0;
        const suspicion = Number.isFinite(infection?.suspicionLevel)
          ? Math.max(0, Math.min(100, infection.suspicionLevel))
          : 0;
        const deaths = Number.isFinite(infection?.deaths)
          ? Math.max(0, infection.deaths)
          : 0;

        if (infectionLevel > 0) {
          pandemicOverlay.infections[nationId] = Math.max(pandemicOverlay.infections[nationId] ?? 0, infectionLevel);
        }
        if (suspicion > 0) {
          pandemicOverlay.heat[nationId] = Math.max(pandemicOverlay.heat[nationId] ?? 0, suspicion);
        }
        if (deaths > 0) {
          pandemicOverlay.casualties[nationId] = Math.max(pandemicOverlay.casualties[nationId] ?? 0, deaths);
        }
        if (infection?.detectedBioWeapon) {
          pandemicOverlay.detections[nationId] = true;
        }
      });
    }

    const falloutMarks = Array.isArray(S.falloutMarks) ? S.falloutMarks : [];
    falloutMarks.forEach(mark => {
      const normalizedIntensity = Number.isFinite(mark.intensity)
        ? Math.max(0, Math.min(1, mark.intensity))
        : 0;
      const associatedNation = resolveNationIdForLocation(mark.nationId, mark.lon, mark.lat);
      if (associatedNation) {
        registerExposure(associatedNation, normalizedIntensity * 100);
      }

      radiationOverlay.falloutMarks.push({
        id: mark.id,
        lon: mark.lon,
        lat: mark.lat,
        intensity: normalizedIntensity,
        alertLevel: mark.alertLevel ?? 'none',
        nationId: associatedNation ?? mark.nationId ?? null,
      });
    });

    const radiationZones = Array.isArray(S.radiationZones) ? S.radiationZones : [];
    radiationZones.forEach(zone => {
      const normalizedIntensity = Number.isFinite(zone.intensity)
        ? Math.max(0, Math.min(1, zone.intensity))
        : 0;
      const zoneNation = resolveNationIdForLocation(zone.nationId, zone.lon, zone.lat);
      if (zoneNation) {
        registerExposure(zoneNation, normalizedIntensity * 100);
      }

      radiationOverlay.radiationZones.push({
        id: zone.id,
        lon: Number.isFinite(zone.lon) ? zone.lon : 0,
        lat: Number.isFinite(zone.lat) ? zone.lat : 0,
        intensity: normalizedIntensity,
        radius: Number.isFinite(zone.radius) ? zone.radius : 0,
        nationId: zoneNation ?? zone.nationId ?? null,
      });
    });

    return {
      playerId,
      relationships,
      intelLevels,
      resourceTotals,
      unrest,
      pandemic: pandemicIntegrationEnabled ? pandemicOverlay : undefined,
      migration: migrationOverlay,
      radiation: radiationOverlay,
    };
  }, [
    bioWarfareEnabled,
    governance.metrics,
    nations,
    pandemicIntegrationEnabled,
    pandemicState,
    plagueState.countryInfections,
    S.falloutMarks,
    Array.isArray(S.falloutMarks) ? S.falloutMarks.length : 0,
    S.radiationZones,
    Array.isArray(S.radiationZones) ? S.radiationZones.length : 0,
    S.globalRadiation,
  ]);

  useEffect(() => {
    currentMapModeData = mapModeData;
  }, [mapModeData]);

  const showTerritories = territoryPolygons.length > 0;
  const showUnits = globeUnits.length > 0;

  const pandemicCountryGeometry = useMemo(() => {
    const collection = worldCountries as FeatureCollection<Polygon | MultiPolygon> | null;
    const features = (collection?.features as Feature<Polygon | MultiPolygon>[] | undefined) ?? [];

    if (features.length === 0 && territoryPolygons.length === 0) {
      return null;
    }

    const normalizeKey = (value: unknown): string | null => {
      if (value === null || value === undefined) {
        return null;
      }
      const raw = String(value).trim();
      if (!raw) {
        return null;
      }
      const normalized = raw.toLowerCase().replace(/[^a-z0-9]+/g, '');
      return normalized || null;
    };

    const register = (
      map: Map<string, Feature<Polygon | MultiPolygon>>,
      value: unknown,
      featureRef: Feature<Polygon | MultiPolygon>,
    ) => {
      const key = normalizeKey(value);
      if (!key) {
        return;
      }
      if (!map.has(key)) {
        map.set(key, featureRef);
      }
    };

    const lookup = new Map<string, Feature<Polygon | MultiPolygon>>();
    const isoFeatureIndex = new Map<string, Feature<Polygon | MultiPolygon>>();
    const territoryIndex = new Map<string, TerritoryPolygon>();

    territoryPolygons.forEach(polygon => {
      const idKey = normalizeKey(polygon.id);
      if (idKey && !territoryIndex.has(idKey)) {
        territoryIndex.set(idKey, polygon);
      }
      const nameKey = normalizeKey(polygon.name);
      if (nameKey && !territoryIndex.has(nameKey)) {
        territoryIndex.set(nameKey, polygon);
      }
    });

    const candidateKeys = [
      'name',
      'NAME',
      'name_long',
      'NAME_LONG',
      'formal_en',
      'FORMAL_EN',
      'admin',
      'ADMIN',
      'sovereignt',
      'SOVEREIGNT',
      'abbrev',
      'ABBREV',
      'postal',
      'POSTAL',
      'iso_a3',
      'ISO_A3',
      'iso_a2',
      'ISO_A2',
      'adm0_a3',
      'ADM0_A3',
      'gu_a3',
      'GU_A3',
      'wb_a3',
      'WB_A3',
      'brk_a3',
      'BRK_A3',
    ] as const;

    const isoKeys = [
      'iso_a3',
      'ISO_A3',
      'adm0_a3',
      'ADM0_A3',
      'wb_a3',
      'WB_A3',
      'brk_a3',
      'BRK_A3',
    ] as const;

    for (const featureEntry of features) {
      if (!featureEntry) {
        continue;
      }

      register(lookup, featureEntry.id, featureEntry);

      const properties = featureEntry.properties as Record<string, unknown> | undefined;
      if (!properties) {
        continue;
      }

      for (const key of candidateKeys) {
        if (Object.prototype.hasOwnProperty.call(properties, key)) {
          register(lookup, properties[key], featureEntry);
        }
      }

      for (const isoKey of isoKeys) {
        if (Object.prototype.hasOwnProperty.call(properties, isoKey)) {
          const normalizedIso = normalizeKey(properties[isoKey]);
          if (normalizedIso && !isoFeatureIndex.has(normalizedIso)) {
            isoFeatureIndex.set(normalizedIso, featureEntry);
          }
        }
      }
    }

    const addFeatureGeometry = (
      target: MultiPolygon['coordinates'],
      source: Feature<Polygon | MultiPolygon>,
    ) => {
      const geometry = source.geometry;
      if (!geometry) {
        return;
      }
      if (geometry.type === 'Polygon') {
        target.push(geometry.coordinates);
      } else if (geometry.type === 'MultiPolygon') {
        target.push(...geometry.coordinates);
      }
    };

    const addTerritoryGeometry = (
      target: MultiPolygon['coordinates'],
      polygon: TerritoryPolygon,
    ) => {
      const geometry = polygon.geometry;
      if (geometry.type === 'Polygon') {
        target.push(geometry.coordinates);
      } else if (geometry.type === 'MultiPolygon') {
        target.push(...geometry.coordinates);
      }
    };

    for (const [superstateId, config] of Object.entries(SUPERSTATE_GEOMETRY_CONFIG)) {
      const aggregatedPolygons: MultiPolygon['coordinates'] = [];
      const seen = new Set<Feature<Polygon | MultiPolygon>>();

      for (const isoCode of config.isoA3 ?? []) {
        const normalizedIso = normalizeKey(isoCode);
        if (!normalizedIso) {
          continue;
        }
        const sourceFeature = isoFeatureIndex.get(normalizedIso);
        if (sourceFeature && !seen.has(sourceFeature)) {
          seen.add(sourceFeature);
          addFeatureGeometry(aggregatedPolygons, sourceFeature);
        }
      }

      for (const territoryId of config.territoryIds ?? []) {
        const normalizedId = normalizeKey(territoryId);
        if (!normalizedId) {
          continue;
        }
        const polygon = territoryIndex.get(normalizedId);
        if (polygon) {
          addTerritoryGeometry(aggregatedPolygons, polygon);
        }
      }

      if (aggregatedPolygons.length === 0) {
        continue;
      }

      const syntheticFeature: Feature<MultiPolygon> = {
        type: 'Feature',
        id: superstateId,
        properties: {
          name: superstateId,
          superstateId,
          memberIsoA3: config.isoA3 ?? [],
          synthetic: true,
        },
        geometry: {
          type: 'MultiPolygon',
          coordinates: aggregatedPolygons,
        },
      };

      const registrationKeys = new Set<string>([superstateId, `superstate:${superstateId}`]);
      for (const alias of config.aliases ?? []) {
        registrationKeys.add(alias);
        registrationKeys.add(`superstate:${alias}`);
      }

      registrationKeys.forEach(key => register(lookup, key, syntheticFeature));
    }

    return lookup.size > 0 ? lookup : null;
  }, [territoryPolygons, worldCountries, uiTick]);

  // Policy system for strategic national policies
  const player = nations.find(n => n.isPlayer);
  const policySystem = usePolicySystem({
    currentTurn: S.turn,
    nationId: player?.id || '',
    availableGold: player?.gold || 0,
    availableProduction: player?.production || 0,
    availableIntel: player?.intel || 0,
    onResourceCost: (gold, production, intel) => {
      if (player) {
        player.gold = Math.max(0, (player.gold || 0) - gold);
        player.production = Math.max(0, player.production - production);
        player.intel = Math.max(0, (player.intel || 0) - intel);
        updateDisplay();
      }
    },
    onAddNewsItem: (category, text, priority) => addNewsItem(category, text, priority),
  });

  policySystemRef = policySystem;

  useEffect(() => {
    policySystemRef = policySystem;

    return () => {
      if (policySystemRef === policySystem) {
        policySystemRef = null;
      }
    };
  }, [policySystem]);

  // National focus system for strategic national objectives
  const nationalFocusSystem = useNationalFocus({
    currentTurn: S.turn,
    nations: nations.map(n => ({ id: n.id, name: n.name })),
  });

  focusApiRef = nationalFocusSystem;

  const focusStates = nationalFocusSystem.focusStates;
  const focusCompletionLog = nationalFocusSystem.completionLog;

  useEffect(() => {
    focusApiRef = nationalFocusSystem;

    return () => {
      if (focusApiRef === nationalFocusSystem) {
        focusApiRef = null;
      }
    };
  }, [nationalFocusSystem]);

  useEffect(() => {
    if (nations.length === 0) {
      return;
    }

    const hasAllStates = nations.every((nation) => focusStates.has(nation.id));
    if (!hasAllStates || focusStates.size === 0) {
      nationalFocusSystem.initializeFocusTrees();
    }
  }, [nations, focusStates, nationalFocusSystem.initializeFocusTrees]);

  useEffect(() => {
    const completions = focusCompletionLog;

    if (completions.length < focusCompletionCountRef.current) {
      focusCompletionCountRef.current = completions.length;
    }

    if (!playerNationId) {
      focusCompletionCountRef.current = completions.length;
      return;
    }

    if (completions.length > focusCompletionCountRef.current) {
      const newEntries = completions.slice(focusCompletionCountRef.current);
      newEntries
        .filter((entry) => entry.nationId === playerNationId)
        .forEach((entry) => {
          const effectSummary = entry.effects
            .map((effect) => effect.message)
            .filter((message): message is string => Boolean(message))
            .join(' ');

          toast({
            title: 'National Focus Complete',
            description: effectSummary
              ? `${entry.focusName}: ${effectSummary}`
              : `${entry.focusName} is now complete.`,
          });
        });

      focusCompletionCountRef.current = completions.length;
    }
  }, [focusCompletionLog, playerNationId]);

  const playerActiveFocus = playerNationId
    ? nationalFocusSystem.getActiveFocus(playerNationId)
    : null;
  const availableFocuses = playerNationId
    ? nationalFocusSystem.getAvailableFocuses(playerNationId)
    : [];
  const availableFocusLookup = useMemo(
    () => new Map(availableFocuses.map((focus) => [focus.id, focus] as const)),
    [availableFocuses]
  );
  const focusPaths = playerNationId
    ? nationalFocusSystem.getFocusesByPath(playerNationId)
    : null;

  const handleStartFocus = useCallback(
    (focus: AvailableFocus) => {
      if (!playerNationId) {
        return;
      }

      const result = nationalFocusSystem.startFocus(playerNationId, focus.id);

      toast({
        title: result.success ? 'Focus Started' : 'Unable to start focus',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      });

      if (result.success) {
        addNewsItem(
          'governance',
          `${playerNationName} begins national focus: ${focus.name}`,
          'important'
        );
      }
    },
    [playerNationId, nationalFocusSystem, addNewsItem, playerNationName]
  );

  const handleCancelFocus = useCallback(() => {
    if (!playerNationId) {
      return;
    }

    const result = nationalFocusSystem.cancelFocus(playerNationId);

    toast({
      title: result.success ? 'Focus Cancelled' : 'No active focus',
      description: result.message,
      variant: result.success ? 'default' : 'destructive',
    });

    if (result.success) {
      addNewsItem(
        'governance',
        `${playerNationName} cancels its current national focus`,
        'routine'
      );
    }
  }, [playerNationId, nationalFocusSystem, addNewsItem, playerNationName]);

  const handleSanctionsImposedNotification = useCallback(
    (sanctions: SanctionPackage) => {
      const targetNation = getNationById(GameStateManager.getNations(), sanctions.targetNationId);
      const targetName = targetNation?.name ?? sanctions.targetNationId;
      const imposerNames = getImposingNationNamesFromPackages([sanctions]);
      const imposerLabel = imposerNames.length > 0 ? imposerNames.join(', ') : 'international coalitions';

      addNewsItem('diplomatic', `Sanctions imposed on ${targetName}`, 'high');

      if (playerNationId && sanctions.targetNationId === playerNationId) {
        const penalty = Math.max(0, sanctions.effects.goldPenalty);
        toast({
          title: penalty > 0 ? 'Sanctions tighten' : 'Sanctions enacted',
          description:
            penalty > 0
              ? `${playerNationName} will lose ${penalty} gold each turn under sanctions from ${imposerLabel}.`
              : `${playerNationName} faces new international sanctions from ${imposerLabel}.`,
          variant: penalty > 0 ? 'destructive' : 'default',
        });
      }
    },
    [addNewsItem, playerNationId, playerNationName, toast],
  );

  const handleAidGrantedNotification = useCallback(
    (aid: AidPackage) => {
      const recipientNation = getNationById(GameStateManager.getNations(), aid.recipientNationId);
      const recipientName = recipientNation?.name ?? aid.recipientNationId;

      addNewsItem('diplomatic', `International aid granted to ${recipientName}`, 'medium');

      if (playerNationId && aid.recipientNationId === playerNationId) {
        const aidGold = Math.max(0, aid.benefits.goldPerTurn ?? 0);
        toast({
          title: 'International aid arrives',
          description:
            aidGold > 0
              ? `${playerNationName} gains ${aidGold} gold per turn from relief packages.`
              : `${playerNationName} receives humanitarian support from the global community.`,
          variant: 'success',
        });
      }
    },
    [addNewsItem, playerNationId, playerNationName, toast],
  );

  // International pressure system for sanctions and aid
  const {
    initializePressure: initializeInternationalPressure,
    imposeSanctions: imposeInternationalSanctions,
    grantAid: grantInternationalAid,
    processTurnUpdates: processInternationalPressureTurn,
    getPressure,
    getTotalEconomicImpact,
    getAidBenefits,
    sanctions,
    reset: resetInternationalPressure,
  } = useInternationalPressure({
    currentTurn: S.turn,
    onResolutionPassed: (resolution) => {
      addNewsItem('diplomatic', `UN Resolution passed: ${resolution.name}`, 'high');
    },
    onSanctionsImposed: handleSanctionsImposedNotification,
    onAidGranted: handleAidGrantedNotification,
  });

  processInternationalPressureTurnFn = processInternationalPressureTurn;
  getTotalEconomicImpactFn = getTotalEconomicImpact;
  getAidBenefitsFn = getAidBenefits;
  getPressureFn = getPressure;
  getActiveSanctionsFn = () => sanctionPackages;
  syncPressureDeltaState();

  useEffect(() => {
    return () => {
      processInternationalPressureTurnFn = null;
      getTotalEconomicImpactFn = null;
      getAidBenefitsFn = null;
      getPressureFn = null;
      getActiveSanctionsFn = null;
      resetPressureDeltaState();
      pressureDeltaRef.current = pressureDeltaState;
    };
  }, []);

  const ensurePressureTracking = useCallback(
    (nationId: string | null | undefined) => {
      if (!nationId) {
        return;
      }

      if (!pressureInitializedNationsRef.current.has(nationId)) {
        initializeInternationalPressure(nationId);
        pressureInitializedNationsRef.current.add(nationId);
      }
    },
    [initializeInternationalPressure],
  );

  useEffect(() => {
    const currentNations = GameStateManager.getNations();
    currentNations.forEach((nation) => ensurePressureTracking(nation.id));
  }, [ensurePressureTracking, pressureSyncKey]);

  const handleAISanctionImposed = useCallback(
    (event: InternationalPressureSanctionEvent) => {
      ensurePressureTracking(event.targetNationId);
      ensurePressureTracking(event.imposingNationId);
      imposeInternationalSanctions(
        event.targetNationId,
        [event.imposingNationId],
        event.types,
        event.severity,
        event.duration,
      );
    },
    [ensurePressureTracking, imposeInternationalSanctions],
  );

  const handleAIAidGranted = useCallback(
    (event: InternationalPressureAidEvent) => {
      ensurePressureTracking(event.recipientNationId);
      ensurePressureTracking(event.donorNationId);
      grantInternationalAid(
        event.recipientNationId,
        [event.donorNationId],
        event.types,
        event.duration,
        [],
      );
    },
    [ensurePressureTracking, grantInternationalAid],
  );

  useEffect(() => {
    registerInternationalPressureCallbacks({
      onSanctionsImposed: handleAISanctionImposed,
      onAidSent: handleAIAidGranted,
    });

    return () => {
      registerInternationalPressureCallbacks(null);
    };
  }, [handleAISanctionImposed, handleAIAidGranted]);

  // Era system for progressive complexity
  const handleEraChange = useCallback(
    (newEra: GameEra, oldEra: GameEra, definitions: Record<GameEra, EraDefinition>) => {
      const eraDef = definitions[newEra];
      const previousEraFeatures = definitions[oldEra]?.unlockedFeatures ?? [];
      const newFeatures = eraDef.unlockedFeatures.filter(
        (feature) => !previousEraFeatures.includes(feature)
      );

      const transitionPayload = {
        era: newEra,
        name: eraDef.name,
        description: eraDef.description,
        features: newFeatures.map((feature) => {
          const info = FEATURE_UNLOCK_INFO[feature];
          return {
            ...info,
            unlockTurn: eraDef.startTurn,
          };
        }),
      };

      setEraTransitionData(transitionPayload);

      if (blockingModalActive) {
        setEraTransitionQueued(true);
        setShowEraTransition(false);
      } else {
        setShowEraTransition(true);
        setEraTransitionQueued(false);
      }

      addNewsItem(
        'crisis',
        `🎯 ${eraDef.name} begins! New systems unlocked.`,
        'urgent'
      );
    },
    [addNewsItem, blockingModalActive],
  );

  const gameEra = useGameEra({
    currentTurn: S.turn,
    scenario: S.scenario,
    onEraChange: handleEraChange,
  });

  useEffect(() => {
    if (!eraTransitionData) {
      return;
    }

    if (blockingModalActive) {
      if (!eraTransitionQueued) {
        setEraTransitionQueued(true);
      }

      if (showEraTransition) {
        setShowEraTransition(false);
      }
      return;
    }

    if (!showEraTransition) {
      setShowEraTransition(true);
    }

    if (eraTransitionQueued) {
      setEraTransitionQueued(false);
    }
  }, [blockingModalActive, eraTransitionData, eraTransitionQueued, showEraTransition]);

  // Victory tracking system
  const victoryAnalysis = useVictoryTracking({
    nations,
    playerName: S.playerName || 'Player',
    currentTurn: S.turn,
    defcon: S.defcon,
    diplomacyState: S.diplomacy,
  });

  // Victory progress milestone notifications
  const [victoryMilestones, setVictoryMilestones] = useState<Record<string, number>>({});
  const [aiVictoryWarnings, setAiVictoryWarnings] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (S.gameOver) return;

    victoryAnalysis.paths.forEach(path => {
      if (!path || typeof path.progress !== 'number') return;
      
      const pathKey = path.type;
      const currentProgress = Math.floor(path.progress);
      const lastNotifiedProgress = victoryMilestones[pathKey] || 0;

      // Check for milestone thresholds: 50%, 70%, 90%
      const milestones = [50, 70, 90];
      for (const milestone of milestones) {
        if (currentProgress >= milestone && lastNotifiedProgress < milestone) {
          // Show toast notification
          const emoji = milestone >= 90 ? '🏆' : milestone >= 70 ? '⚠️' : '📊';
          const urgency = milestone >= 90 ? 'CRITICAL' : milestone >= 70 ? 'WARNING' : 'NOTICE';

          toast({
            title: `${emoji} ${urgency}: ${path.name}`,
            description: `You are ${currentProgress}% toward ${path.name}! ${milestone >= 70 ? 'Press your advantage!' : 'Keep pushing forward.'}`,
            duration: milestone >= 70 ? 8000 : 5000,
          });

          // Update the milestone tracker
          setVictoryMilestones(prev => ({
            ...prev,
            [pathKey]: milestone,
          }));

          // Only show one toast per update
          break;
        }
      }
    });
  }, [victoryAnalysis, S.gameOver, victoryMilestones]);

  // AI Victory tracking - warn player if AI nations are close to victory
  useEffect(() => {
    if (S.gameOver) return;

    const aiNations = nations.filter(n => !n.isPlayer && !n.eliminated);

    aiNations.forEach(aiNation => {
      const gameState = {
        turn: S.turn,
        defcon: S.defcon,
        diplomacy: S.diplomacy,
      };

      const aiVictoryCheck = checkVictory(aiNation, nations, gameState as any);

      // Guard against undefined progress
      if (!aiVictoryCheck || !aiVictoryCheck.progress) return;

      // Find the AI's highest progress
      const progressValues = Object.values(aiVictoryCheck.progress).filter(v => typeof v === 'number');
      if (progressValues.length === 0) return;
      
      const maxProgress = Math.max(...progressValues);
      const warningKey = `${aiNation.id}-70`;
      const alreadyWarned = aiVictoryWarnings[warningKey];

      // Warn if AI is 70%+ on any path and we haven't warned about this yet
      if (maxProgress >= 70 && !alreadyWarned) {
        const leadingPath = Object.entries(aiVictoryCheck.progress).find(
          ([_, progress]) => progress === maxProgress
        );

        if (leadingPath) {
          const pathName = leadingPath[0];
          const pathProgress = Math.floor(leadingPath[1]);

          toast({
            title: `🚨 THREAT: ${aiNation.name} Approaching Victory!`,
            description: `${aiNation.name} is ${pathProgress}% toward ${pathName} victory! Take action to prevent their victory!`,
            duration: 10000,
            variant: 'destructive',
          });

          addLog(`⚠️ INTEL: ${aiNation.name} is approaching ${pathName} victory (${pathProgress}%)`);

          setAiVictoryWarnings(prev => ({
            ...prev,
            [warningKey]: true,
          }));
        }
      }
    });
  }, [nations, S.turn, S.gameOver, S.defcon, S.diplomacy, aiVictoryWarnings]);

  useEffect(() => {
    governanceApiRef = governance;
    return () => {
      if (governanceApiRef === governance) {
        governanceApiRef = null;
      }
    };
  }, [governance]);

  useEffect(() => {
    pandemicIntegrationEnabledRef = pandemicIntegrationEnabled;
  }, [pandemicIntegrationEnabled]);

  useEffect(() => {
    bioWarfareEnabledRef = bioWarfareEnabled;
  }, [bioWarfareEnabled]);

  useEffect(() => {
    const nextState = conventional.state;
    if (!nextState) {
      S.conventionalUnits = [];
      S.conventionalMovements = S.conventionalMovements ?? [];
      return;
    }

    S.conventional = nextState;

    const deployedMarkers: ConventionalUnitMarker[] = [];
    const activeUnitIds = new Set<string>();

    Object.values(nextState.units ?? {}).forEach((unit) => {
      activeUnitIds.add(unit.id);
      if (unit.status !== 'deployed' || !unit.locationId) {
        return;
      }
      const anchor = territoryAnchors[unit.locationId];
      if (!anchor) {
        return;
      }
      const template = nextState.templates[unit.templateId];
      const forceType: ForceType = template?.type ?? 'army';
      deployedMarkers.push({
        unitId: unit.id,
        ownerId: unit.ownerId,
        lon: anchor.lon,
        lat: anchor.lat,
        icon: conventionalIconLookup[forceType],
        forceType,
      });
    });

    S.conventionalUnits = deployedMarkers;

    const filteredMovements = (S.conventionalMovements ?? []).filter((movement) => {
      if (!activeUnitIds.has(movement.unitId)) {
        return false;
      }
      if (movement.toTerritoryId && !territoryAnchors[movement.toTerritoryId]) {
        return false;
      }
      return true;
    });

    S.conventionalMovements = filteredMovements;

    try {
      Storage.setItem('conventional_state', JSON.stringify(nextState));
    } catch (error) {
      // Persistence failed - not critical, game continues
    }
  }, [conventional.state]);

  const {
    units: conventionalUnits,
    territories: conventionalTerritories,
    templates: conventionalTemplatesMap,
    logs: conventionalLogs,
    trainUnit: trainConventionalUnit,
    deployUnit: deployConventionalUnitBase,
    moveArmies: moveConventionalArmies,
    resolveBorderConflict: resolveConventionalBorderConflictBase,
    resolveProxyEngagement: resolveConventionalProxyEngagement,
    getUnitsForNation: getConventionalUnitsForNation,
    placeReinforcements: placeConventionalReinforcements,
    getReinforcements: getConventionalReinforcements,
  } = conventional;

  const playerSnapshot = useMemo(() => {
    if (!player) {
      return null;
    }
    const metrics = governance.metrics[player.id];
    if (!metrics) {
      return null;
    }
    const profile = player.conventional ?? createDefaultNationConventionalProfile();
    return {
      id: player.id,
      name: player.name,
      metrics,
      production: player.production ?? 0,
      intel: player.intel ?? 0,
      uranium: player.uranium ?? 0,
      instability: player.instability ?? 0,
      readiness: profile.readiness,
      professionalism: profile.professionalism,
      tradition: profile.tradition,
    };
  }, [player, governance.metrics]);

  const playerForceSummary = useMemo(() => {
    if (!playerSnapshot) {
      return null;
    }
    const units = Object.values(conventionalUnits ?? {});
    const ownedUnits = units.filter((unit) => unit.ownerId === playerSnapshot.id);
    const deployed = ownedUnits.filter((unit) => unit.status === 'deployed').length;
    const reserve = ownedUnits.length - deployed;
    return {
      deployed,
      reserve,
      readiness: playerSnapshot.readiness,
      professionalism: playerSnapshot.professionalism,
      tradition: playerSnapshot.tradition,
    };
  }, [conventionalUnits, playerSnapshot]);

  const playerArmyGroupSummaries = useMemo<ArmyGroupSummary[]>(() => {
    if (!playerNationId) {
      return [];
    }
    return militaryTemplates.getArmyGroupSummaries(playerNationId);
  }, [
    militaryTemplates,
    militaryTemplateStates,
    militaryDeployedUnits,
    playerNationId,
  ]);

  const latestConventionalEvents = useMemo(() => {
    return (conventionalLogs ?? []).slice(-2).reverse();
  }, [conventionalLogs]);

  const moveArmiesRef = useRef(moveConventionalArmies);
  useEffect(() => {
    moveArmiesRef.current = moveConventionalArmies;
  }, [moveConventionalArmies]);

  const resolveBorderConflictRef = useRef(resolveConventionalBorderConflictBase);
  useEffect(() => {
    resolveBorderConflictRef.current = resolveConventionalBorderConflictBase;
  }, [resolveConventionalBorderConflictBase]);

  const getNationAnchor = useCallback((ownerId: string) => {
    let nation = getNationById(nations, ownerId);
    if (!nation && ownerId === 'player') {
      nation = nations.find((entry) => entry.isPlayer) ?? null;
    }
    return nation ? { lon: nation.lon, lat: nation.lat } : null;
  }, []);

  const registerConventionalMovement = useCallback(
    ({
      unitId,
      templateId,
      ownerId,
      fromTerritoryId,
      toTerritoryId,
      fallbackEnd,
    }: ConventionalMovementRegistration) => {
      if (!ownerId) {
        return;
      }

      const template = templateId ? conventionalTemplatesMap[templateId] : undefined;
      const forceType: ForceType = template?.type ?? 'army';

      const targetAnchor =
        (toTerritoryId ? territoryAnchors[toTerritoryId] : undefined) ??
        fallbackEnd ??
        getNationAnchor(ownerId);

      if (!targetAnchor) {
        return;
      }

      const originAnchor =
        (fromTerritoryId ? territoryAnchors[fromTerritoryId] : undefined) ??
        getNationAnchor(ownerId) ??
        targetAnchor;

      const startLon = originAnchor.lon;
      const startLat = originAnchor.lat;
      const endLon = targetAnchor.lon;
      const endLat = targetAnchor.lat;

      if (Math.hypot(endLon - startLon, endLat - startLat) < 0.01) {
        return;
      }

      const movement: ConventionalMovementMarker = {
        id: `${unitId}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
        unitId,
        ownerId,
        forceType,
        icon: conventionalIconLookup[forceType],
        startLon,
        startLat,
        endLon,
        endLat,
        fromTerritoryId: fromTerritoryId ?? null,
        toTerritoryId: toTerritoryId ?? null,
        progress: 0,
        speed: 0.012 + Math.random() * 0.01,
        createdAt: Date.now(),
      };

      const existing = (S.conventionalMovements ?? []).filter((entry) => entry.unitId !== unitId);
      S.conventionalMovements = [...existing, movement];
    },
    [conventionalTemplatesMap, getNationAnchor],
  );

  const deployConventionalUnit = useCallback(
    (unitId: string, territoryId: string) => {
      const currentUnit = conventionalUnits[unitId] ?? conventional.state.units[unitId];
      const fromTerritoryId = currentUnit?.locationId ?? null;
      const ownerId = currentUnit?.ownerId ?? 'player';
      const templateId = currentUnit?.templateId;

      const result = deployConventionalUnitBase(unitId, territoryId);
      if (result.success) {
        registerConventionalMovement({
          unitId,
          templateId,
          ownerId,
          fromTerritoryId,
          toTerritoryId: territoryId,
        });
      }
      return result;
    },
    [conventional.state.units, conventionalUnits, deployConventionalUnitBase, registerConventionalMovement],
  );

  const findStagingTerritory = useCallback(
    (ownerId: string, territoryId: string): string | null => {
      const territory = conventionalTerritories[territoryId];
      if (!territory) {
        return null;
      }
      for (const neighborId of territory.neighbors) {
        const neighbor = conventionalTerritories[neighborId];
        if (neighbor && neighbor.controllingNationId === ownerId) {
          return neighbor.id;
        }
      }
      return null;
    },
    [conventionalTerritories],
  );

  // New Risk-style attack function
  const resolveConventionalAttack = useCallback(
    (fromTerritoryId: string, toTerritoryId: string, attackingArmies: number) => {
      const fromTerritory = conventionalTerritories[fromTerritoryId];
      const toTerritory = conventionalTerritories[toTerritoryId];

      if (!fromTerritory || !toTerritory) {
        return { success: false, reason: 'Invalid territories' };
      }

      const attackerId = fromTerritory.controllingNationId;
      const defenderId = toTerritory.controllingNationId;

      const result = resolveConventionalBorderConflictBase(fromTerritoryId, toTerritoryId, attackingArmies);

      if (result.success && attackerId) {
        // Register visual movement on map
        registerConventionalMovement({
          unitId: `attack_${Date.now()}`,
          templateId: 'armored_corps',
          ownerId: attackerId,
          fromTerritoryId,
          toTerritoryId,
        });
      }

      return result;
    },
    [conventionalTerritories, registerConventionalMovement, resolveConventionalBorderConflictBase],
  );

  // Legacy wrapper for old signature (keeps existing modal working)
  const resolveConventionalBorderConflict = useCallback(
    (territoryId: string, attackerId: string, defenderId: string) => {
      // Find an adjacent territory owned by attacker to use as source
      const territory = conventionalTerritories[territoryId];
      if (!territory) {
        return { success: false, reason: 'Unknown territory' };
      }

      const attackerTerritory = Object.values(conventionalTerritories).find(
        t => t.controllingNationId === attackerId &&
             territory.neighbors.includes(t.id)
      );

      if (!attackerTerritory) {
        return { success: false, reason: 'No adjacent territory to attack from' };
      }

      // Use all available armies minus 1
      const attackingArmies = Math.max(1, attackerTerritory.armies - 1);
      return resolveConventionalAttack(attackerTerritory.id, territoryId, attackingArmies);
    },
    [conventionalTerritories, resolveConventionalAttack],
  );

  const moveConventionalArmiesWithAnimation = useCallback(
    (fromTerritoryId: string, toTerritoryId: string, count: number) => {
      const fromTerritory = conventionalTerritories[fromTerritoryId];
      const result = moveConventionalArmies(fromTerritoryId, toTerritoryId, count);

      if (result.success && fromTerritory?.controllingNationId) {
        registerConventionalMovement({
          unitId: `move_${Date.now()}`,
          templateId: 'armored_corps',
          ownerId: fromTerritory.controllingNationId,
          fromTerritoryId,
          toTerritoryId,
        });
      }

      return result;
    },
    [conventionalTerritories, moveConventionalArmies, registerConventionalMovement],
  );

  useEffect(() => {
    window.__cyberAdvance = advanceCyberTurn;
    window.__cyberAiPlan = runCyberAiPlan;
    return () => {
      delete window.__cyberAdvance;
      delete window.__cyberAiPlan;
    };
  }, [advanceCyberTurn, runCyberAiPlan]);

  // Expose conventional AI functions for Risk-style gameplay
  useEffect(() => {
    window.__conventionalAI = {
      makeAITurn: (aiId: string, territories: any, reinforcements: number) =>
        makeConventionalAITurn(aiId, territories, reinforcements),
      getReinforcements: (nationId: string) => getConventionalReinforcements(nationId),
      placeReinforcements: placeConventionalReinforcements,
      attack: resolveConventionalAttack,
      move: moveConventionalArmiesWithAnimation,
    };
    return () => {
      delete window.__conventionalAI;
    };
  }, [
    getConventionalReinforcements,
    placeConventionalReinforcements,
    resolveConventionalAttack,
    moveConventionalArmiesWithAnimation,
  ]);

  const handlePandemicTrigger = useCallback((payload: PandemicTriggerPayload) => {
    if (!pandemicIntegrationEnabled) {
      addNewsItem(
        'science',
        'Pandemic simulations disabled – scenario logged for NORAD audit.',
        'important'
      );
      return;
    }
    if (!bioWarfareEnabled) {
      addNewsItem(
        'diplomatic',
        'Bio-weapon conquest protocols disabled – engineered outbreak denied.',
        'important'
      );
      return;
    }
    triggerBioWarfare(payload);
  }, [pandemicIntegrationEnabled, bioWarfareEnabled, triggerBioWarfare, addNewsItem]);

  const handlePandemicCountermeasure = useCallback((payload: PandemicCountermeasurePayload) => {
    if (!pandemicIntegrationEnabled) return;
    applyPandemicCountermeasure(payload);
  }, [pandemicIntegrationEnabled, applyPandemicCountermeasure]);

  const handlePandemicAdvance = useCallback((context: PandemicTurnContext) => {
    if (!pandemicIntegrationEnabled) return null;
    return advanceBioWarfareTurn(context, nations ?? []);
  }, [pandemicIntegrationEnabled, advanceBioWarfareTurn, nations]);

  // Progressive tutorial system
  const tutorialSteps = [
    {
      id: 'welcome',
      title: 'Velkommen til NORAD Command',
      description: 'Du er kommandør for en supermakt. Målet er å overleve og dominere gjennom strategi, diplomati og militær makt.',
      position: 'center' as const,
      allowSkip: true,
    },
    {
      id: 'defcon',
      title: 'DEFCON Status',
      description: 'DEFCON viser krigsberedskap. Jo lavere tall, jo nærmere atomkrig. Hold et øye med dette!',
      target: '#defcon',
      position: 'bottom' as const,
    },
    {
      id: 'resources',
      title: 'Ressurspanel',
      description: 'Her ser du produksjon, uran og intel. Disse regenereres hver runde og brukes til å bygge og forske.',
      target: '.hud-module:has(#production)',
      position: 'left' as const,
    },
    {
      id: 'build',
      title: 'Byggemeny',
      description: 'Klikk BUILD for å konstruere raketter, bombefly og forsvar. Husk å montere stridshoder!',
      target: 'button:has(.lucide-factory)',
      position: 'top' as const,
    },
    {
      id: 'research',
      title: 'Forskningssystem',
      description: 'Forsk frem kraftigere våpen og forsvarsssystemer. Hver teknologi tar flere runder.',
      target: 'button:has(.lucide-microscope)',
      position: 'top' as const,
    },
    {
      id: 'globe',
      title: 'Globeinteraksjon',
      description: 'Klikk på fiendtlige nasjoner for å se detaljer og utføre handlinger. Satellitter avslører mer info.',
      position: 'center' as const,
    },
  ];

  const { showTutorial: showProgressiveTutorial, handleComplete, handleSkip } = useTutorial('progressive_onboarding', tutorialSteps);

  // Expose functions globally for game loop access
  const addNewsItemRef = useRef(addNewsItem);
  const triggerRandomFlashpointRef = useRef(triggerRandomFlashpoint);
  const triggerPandemicRef = useRef(handlePandemicTrigger);
  const applyPandemicCountermeasureRef = useRef(handlePandemicCountermeasure);
  const advancePandemicTurnRef = useRef(handlePandemicAdvance);
  
  useEffect(() => {
    addNewsItemRef.current = addNewsItem;
    triggerRandomFlashpointRef.current = triggerRandomFlashpoint;
    triggerPandemicRef.current = handlePandemicTrigger;
    applyPandemicCountermeasureRef.current = handlePandemicCountermeasure;
    advancePandemicTurnRef.current = handlePandemicAdvance;

    // Make available globally
    window.__gameAddNewsItem = addNewsItem;
    window.__gameSetDefconChangeEvent = setDefconChangeEvent;
    window.__gameTriggerFlashpoint = (turn: number, defcon: number) => triggerRandomFlashpointRef.current(turn, defcon);
    window.__pandemicTrigger = (payload: unknown) => triggerPandemicRef.current(payload as any);
    window.__pandemicCountermeasure = (payload: unknown) => applyPandemicCountermeasureRef.current(payload as any);
    window.__pandemicAdvance = (context: unknown) => advancePandemicTurnRef.current(context as any);
  }, [addNewsItem, setDefconChangeEvent, triggerRandomFlashpoint, handlePandemicTrigger, handlePandemicCountermeasure, handlePandemicAdvance]);

  useEffect(() => {
    Storage.setItem('layout_density', layoutDensity);
  }, [layoutDensity]);

  useEffect(() => {
    Storage.setItem('option_pandemic_integration', pandemicIntegrationEnabled ? 'true' : 'false');
  }, [pandemicIntegrationEnabled]);

  useEffect(() => {
    Storage.setItem('option_biowarfare_conquest', bioWarfareEnabled ? 'true' : 'false');
  }, [bioWarfareEnabled]);

  const activeLayout = useMemo(
    () => layoutDensityOptions.find((option) => option.id === layoutDensity) ?? layoutDensityOptions[0],
    [layoutDensity],
  );

  const cycleLayoutDensity = useCallback(() => {
    const currentIndex = layoutDensityOrder.indexOf(layoutDensity);
    const nextIndex = (currentIndex + 1) % layoutDensityOrder.length;
    const nextDensity = layoutDensityOrder[nextIndex];
    setLayoutDensity(nextDensity);
    const nextLayout = layoutDensityOptions.find((option) => option.id === nextDensity);
    if (nextLayout) {
      toast({ title: `HUD layout: ${nextLayout.label}`, description: nextLayout.description });
    }
  }, [layoutDensity]);

  const handlePauseToggle = useCallback(() => {
    if (S.gameOver) return;
    S.paused = !S.paused;
    setIsPaused(S.paused);
    log(S.paused ? 'Simulation paused.' : 'Simulation resumed.', S.paused ? 'warning' : 'success');
    toast({
      title: S.paused ? 'Simulation paused' : 'Simulation resumed',
      description: S.paused ? 'Time-on-target calculations are frozen.' : 'Command routines restored.',
    });
    if (uiUpdateCallback) {
      uiUpdateCallback();
    }
  }, []);

  const handleSaveSnapshot = useCallback(() => {
    try {
      const payload = {
        timestamp: new Date().toISOString(),
        state: {
          turn: S.turn,
          defcon: S.defcon,
          phase: S.phase,
          actionsRemaining: S.actionsRemaining,
          selectedLeader: S.selectedLeader,
          selectedDoctrine: S.selectedDoctrine,
          scenarioId: S.scenario?.id ?? getDefaultScenario().id,
          doomsdayMinutes: DoomsdayClock.minutes,
          conventional: S.conventional,
        },
      };
      Storage.setItem('save_snapshot', JSON.stringify(payload));
      log('Strategic snapshot saved.', 'success');
      toast({ title: 'Save complete', description: 'Strategic snapshot stored in secure buffers.' });
    } catch (error) {
      console.error('Save failed', error);
      log('Save failed: secure storage unavailable.', 'alert');
      toast({ title: 'Save failed', description: 'Unable to access secure storage.' });
    }
  }, []);

  const resizeCanvas = useCallback(() => {
    const element = globeSceneRef.current?.overlayCanvas ?? null;
    if (!element) return;

    const parent = element.parentElement;
    const rect = parent?.getBoundingClientRect();
    const fallbackWidth = typeof window !== 'undefined' ? window.innerWidth : element.width;
    const fallbackHeight = typeof window !== 'undefined' ? window.innerHeight : element.height;
    let width = Math.floor(rect?.width ?? fallbackWidth);
    let height = Math.floor(rect?.height ?? fallbackHeight);

    // Apply resolution override if not set to 'auto'
    if (screenResolution !== 'auto') {
      const resolutionOption = RESOLUTION_OPTIONS.find(opt => opt.value === screenResolution);
      if (resolutionOption?.width && resolutionOption?.height) {
        width = Math.min(resolutionOption.width, width);
        height = Math.min(resolutionOption.height, height);

        // Maintain aspect ratio of the selected resolution
        const targetAspect = resolutionOption.width / resolutionOption.height;
        const containerAspect = (rect?.width ?? fallbackWidth) / (rect?.height ?? fallbackHeight);

        if (containerAspect > targetAspect) {
          // Container is wider - fit to height
          width = Math.floor(height * targetAspect);
        } else {
          // Container is taller - fit to width
          height = Math.floor(width / targetAspect);
        }
      }
    }

    if (width <= 0 || height <= 0) {
      return;
    }

    // Calculate device pixel ratio for sharp rendering on high-DPI displays
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    
    // Set display size (CSS pixels)
    element.style.width = '100%';
    element.style.height = '100%';

    // Set internal resolution (actual pixels)
    const internalWidth = Math.floor(width * dpr);
    const internalHeight = Math.floor(height * dpr);

    const sizeChanged = element.width !== internalWidth || element.height !== internalHeight;
    if (sizeChanged) {
      element.width = internalWidth;
      element.height = internalHeight;
      
      // Re-get context and scale after resizing canvas (resizing resets context state)
      const context = element.getContext('2d', { alpha: true });
      if (context) {
        ctx = context;
        context.scale(dpr, dpr);
      }
      
      W = width;
      H = height;
      cam.x = (W - W * cam.zoom) / 2;
      cam.y = (H - H * cam.zoom) / 2;
    } else {
      W = width;
      H = height;
    }
  }, [screenResolution]);

  useEffect(() => {
    const element = globeSceneRef.current?.overlayCanvas ?? null;
    if (!element) {
      // Retry after a short delay if canvas not ready yet
      const retryTimer = setTimeout(() => {
        const retryElement = globeSceneRef.current?.overlayCanvas;
        if (retryElement) {
          canvas = retryElement;
          const context = retryElement.getContext('2d', { alpha: true });
          if (context) {
            ctx = context;
            // Apply devicePixelRatio scaling
            const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
            context.scale(dpr, dpr);
          }
          resizeCanvas();

          const shouldStartLoop = isGameplayLoopEnabled || isAttractModeActive || isGameStarted;
          if (!gameLoopRunning && shouldStartLoop) {
            gameLoopRunning = true;
            requestAnimationFrame(gameLoop);
          }
        }
      }, 100);

      return () => clearTimeout(retryTimer);
    }

    canvas = element;
    const context = element.getContext('2d', { alpha: true });
    if (context) {
      ctx = context;
      // Apply devicePixelRatio scaling
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      context.scale(dpr, dpr);
    }

    resizeCanvas();

    if (!isGameplayLoopEnabled) {
      isAttractModeActive = true;
    }

    const shouldStartLoop = isGameplayLoopEnabled || isAttractModeActive || isGameStarted;
    if (!gameLoopRunning && shouldStartLoop) {
      gameLoopRunning = true;
      requestAnimationFrame(gameLoop);
    }
    
    // Add window resize listener
    const handleResize = () => {
      resizeCanvas();
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isGameStarted, resizeCanvas]);

  const toggleFullscreen = useCallback(() => {
    AudioSys.playSFX('click');
    if (typeof document === 'undefined') return;
    const element = interfaceRef.current ?? document.documentElement;

    if (!document.fullscreenElement) {
      if (element.requestFullscreen) {
        void element.requestFullscreen().catch(() => {
          toast({ title: 'Fullscreen blocked', description: 'Browser prevented entering fullscreen mode.' });
        });
      } else {
        toast({ title: 'Fullscreen unsupported', description: 'This browser does not support fullscreen mode.' });
      }
    } else if (document.exitFullscreen) {
      void document.exitFullscreen().catch(() => {
        toast({ title: 'Fullscreen error', description: 'Unable to exit fullscreen mode.' });
      });
    }
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
      resizeCanvas();
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    handleFullscreenChange();

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [resizeCanvas]);

  useEffect(() => {
    if (isGameStarted) {
      resizeCanvas();
    }
  }, [isGameStarted, resizeCanvas]);

  const handleMusicToggle = useCallback((checked: boolean) => {
    AudioSys.setMusicEnabled(checked);
    Storage.setItem('audio_music_enabled', String(checked));
    setMusicEnabled(checked);
  }, []);

  const handleSfxToggle = useCallback((checked: boolean) => {
    AudioSys.sfxEnabled = checked;
    Storage.setItem('audio_sfx_enabled', String(checked));
    setSfxEnabled(checked);
  }, []);

  const handleAmbientToggle = useCallback((checked: boolean) => {
    AudioSys.setAmbientEnabled(checked);
    Storage.setItem('audio_ambient_enabled', String(checked));
    setAmbientEnabled(checked);
    if (checked) {
      AudioSys.updateAmbientForDefcon(S.defcon);
    }
  }, []);

  const handleMusicVolumeChange = useCallback((volume: number) => {
    const normalizedVolume = Math.min(1, Math.max(0, volume));
    AudioSys.setMusicVolume(normalizedVolume);
    // Don't save to storage - always reset to 15% on page load
    setMusicVolume(normalizedVolume);
  }, []);

  const handleAmbientVolumeChange = useCallback((volume: number) => {
    const normalizedVolume = Math.min(1, Math.max(0, volume));
    AudioSys.setAmbientVolume(normalizedVolume);
    Storage.setItem('audio_ambient_volume', normalizedVolume.toString());
    setAmbientVolume(normalizedVolume);
  }, []);

  const handleMusicTrackChange = useCallback((selection: string) => {
    setMusicSelection(selection);
    if (selection === 'random') {
      AudioSys.setPreferredTrack(null);
      Storage.setItem('audio_music_track', 'random');
    } else {
      AudioSys.setPreferredTrack(selection as MusicTrackId);
      Storage.setItem('audio_music_track', selection);
    }
  }, []);

  const handleNextTrack = useCallback(() => {
    AudioSys.playNextTrack();
  }, []);

  const handleDayNightAutoCycleToggle = useCallback((enabled: boolean) => {
    setDayNightAutoCycleEnabled(enabled);
  }, []);

  const activeTrackMeta = useMemo(() => (activeTrackId ? AudioSys.getTrackMetadata(activeTrackId) : null), [activeTrackId]);

  const activeTrackMessage = useMemo(() => {
    if (!musicEnabled) {
      return 'Music disabled';
    }
    if (activeTrackMeta) {
      return `Now playing: ${activeTrackMeta.title}`;
    }
    if (!AudioSys.userInteractionPrimed) {
      return 'Awaiting first interaction to start playback';
    }
    if (musicSelection !== 'random') {
      const selected = AudioSys.getTrackMetadata(musicSelection as MusicTrackId);
      if (selected) {
        return `Preparing: ${selected.title}`;
      }
    }
    return 'Preparing soundtrack';
  }, [activeTrackMeta, musicEnabled, musicSelection]);

  useEffect(() => {
    const stored = Storage.getItem('theme');
    if (stored && themeOptions.some(opt => opt.id === stored)) {
      const valid = stored as ThemeId;
      setTheme(valid);
      currentTheme = valid;
    } else {
      currentTheme = 'synthwave';
    }
  }, []);

  useEffect(() => {
    currentTheme = theme;
    const classNames = themeOptions.map(opt => `theme-${opt.id}`);
    if (typeof document !== 'undefined') {
      document.body.classList.remove(...classNames);
      document.body.classList.add(`theme-${theme}`);
    }
    Storage.setItem('theme', theme);
    const overlayCanvas = globeSceneRef.current?.overlayCanvas;
    if (overlayCanvas) {
      overlayCanvas.style.imageRendering = theme === 'retro80s' || theme === 'wargames' ? 'pixelated' : 'auto';
    }

    // WARGAMES theme: enable vector-only mode (hide earth texture, show only vector borders)
    // This applies to both globe and flat 2D views
    if (theme === 'wargames') {
      setVectorOnlyMode(true);
      setShowVectorOverlay(true); // Ensure vector overlay is visible
    } else {
      setVectorOnlyMode(false);
      // Don't auto-disable vector overlay when switching away from wargames
      // User may have explicitly enabled it
    }
  }, [theme]);

  useEffect(() => {
    uiUpdateCallback = () => setUiTick(prev => prev + 1);
    return () => {
      uiUpdateCallback = null;
    };
  }, []);

  useEffect(() => {
    selectedTargetRefId = selectedTargetId;
  }, [selectedTargetId]);

  useEffect(
    () => () => {
      globeProjector = null;
      globePicker = null;
      setOverlayProjectorFn(null);
    },
    [setOverlayProjectorFn],
  );

  useEffect(() => {
    setIsPaused(S.paused);
  }, [uiTick]);

  useEffect(() => {
    if (!selectedTargetId) return;
    const player = PlayerManager.get();
    const target = nations.find(n => n.id === selectedTargetId);
    if (!target || !isEligibleEnemyTarget(player, target)) {
      setSelectedTargetId(null);
    }
  }, [selectedTargetId, uiTick]);

  useEffect(() => {
    if (!isGameStarted) {
      setSelectedTargetId(null);
    }
  }, [isGameStarted]);

  const targetableNations = useMemo(() => {
    void uiTick;
    return nations
      .filter(n => !n.isPlayer && n.population > 0)
      .sort((a, b) => b.population - a.population);
  }, [uiTick]);

  const attackableNations = useMemo(() => {
    const player = PlayerManager.get();
    return targetableNations.filter(nation => isEligibleEnemyTarget(player, nation));
  }, [targetableNations]);

  const selectedTarget = useMemo(() => {
    if (!selectedTargetId) return null;
    return attackableNations.find(nation => nation.id === selectedTargetId) ?? null;
  }, [attackableNations, selectedTargetId]);

  const handleTargetSelect = useCallback((nationId: string) => {
    AudioSys.playSFX('click');
    setSelectedTargetId(prev => (prev === nationId ? null : nationId));
  }, []);

  useEffect(() => {
    if (!selectedTarget) {
      lastTargetPingIdRef.current = null;
      return;
    }

    if (lastTargetPingIdRef.current === selectedTarget.id) {
      return;
    }

    lastTargetPingIdRef.current = selectedTarget.id;
    S.rings = S.rings || [];
    S.rings.push({
      lon: selectedTarget.lon,
      lat: selectedTarget.lat,
      r: 2,
      max: 90,
      speed: 2.4,
      alpha: 0.85,
      type: 'sonar',
    });
    if (uiUpdateCallback) {
      uiUpdateCallback();
    }
  }, [selectedTarget]);

  // Dependency injection helper for attack handlers
  const getAttackHandlerDeps = useCallback((): AttackHandlerDependencies => {
    return {
      S,
      nations,
      isGameStarted,
      isStrikePlannerOpen,
      selectedTargetId,
      AudioSys,
      setIsStrikePlannerOpen,
      setSelectedTargetId,
      setPendingLaunch,
      setSelectedWarheadYield,
      setSelectedDeliveryMethod,
      hasActivePeaceTreaty,
    };
  }, [S, nations, isGameStarted, isStrikePlannerOpen, selectedTargetId, AudioSys, setIsStrikePlannerOpen, setSelectedTargetId, setPendingLaunch, setSelectedWarheadYield, setSelectedDeliveryMethod, hasActivePeaceTreaty]);

  const handleAttack = useCallback(() => handleAttackExtracted(getAttackHandlerDeps()), [getAttackHandlerDeps]);

  const resetLaunchControl = useCallback(() => {
    setPendingLaunch(null);
    setSelectedWarheadYield(null);
    setSelectedDeliveryMethod(null);
  }, []);

  const triggerConsequenceAlerts = useCallback((consequences: ActionConsequences) => {
    if (!consequences) return;

    AudioSys.playSFX('defcon');

    if (consequences.targetName) {
      const lingering = consequences.longTerm[1]?.description ?? consequences.longTerm[0]?.description;
      emitOverlayMessage(
        `☢️ ${consequences.targetName} is swallowed by irradiated night. ${lingering}`,
        9000
      );
    } else {
      emitOverlayMessage(
        '☢️ Nuclear fire blooms across the horizon and the world holds its breath.',
        9000
      );
    }

    const formatProbability = (value?: number) =>
      value !== undefined ? ` (${Math.round(value)}% chance)` : '';

    const raiseDarkToast = (title: string, description: string) =>
      toast({
        title,
        description,
        variant: 'destructive',
        className: 'bg-slate-950 border-red-900 text-red-100 shadow-[0_0_35px_rgba(220,38,38,0.45)]',
      });

    consequences.longTerm.forEach((entry) => {
      raiseDarkToast(
        'Long-term Horror',
        `${entry.icon ?? '☢️'} ${entry.description}${formatProbability(entry.probability)}`
      );
    });

    consequences.risks.forEach((risk) => {
      raiseDarkToast(
        'Escalating Risk',
        `${risk.icon ?? '⚠️'} ${risk.description}${formatProbability(risk.probability)}`
      );
    });

    (consequences.warnings ?? []).forEach((warning) => {
      raiseDarkToast('Warning', warning);
    });
  }, []);

  const confirmPendingLaunch = useCallback(() => {
    const deps: LaunchConfirmationDeps = {
      pendingLaunch,
      selectedWarheadYield,
      selectedDeliveryMethod,
      toast,
      resetLaunchControl,
      gameState: S,
      log,
      triggerConsequenceAlerts,
      consumeAction,
      queueConsequencePreview,
      setConsequencePreview,
      setConsequenceCallback,
      playSFX: AudioSys.playSFX,
    };
    confirmPendingLaunchExtracted(deps);
  }, [
    pendingLaunch,
    selectedWarheadYield,
    selectedDeliveryMethod,
    toast,
    resetLaunchControl,
    log,
    triggerConsequenceAlerts,
    consumeAction,
    queueConsequencePreview,
    setConsequencePreview,
    setConsequenceCallback,
  ]);

  const startGame = useCallback((leaderOverride?: string, doctrineOverride?: string) => {
    console.log('[DEBUG] startGame called with leader:', leaderOverride, 'doctrine:', doctrineOverride);
    const leaderToUse = leaderOverride ?? selectedLeader;
    const doctrineToUse = doctrineOverride ?? selectedDoctrine;

    if (!leaderToUse || !doctrineToUse) {
      console.log('[DEBUG] startGame aborted - missing leader or doctrine');
      return;
    }

    console.log('[DEBUG] Starting game with leader:', leaderToUse, 'doctrine:', doctrineToUse);
    // CRITICAL: Reset all game state before starting a new game
    // This ensures no state persists from previous sessions (immigration policy, etc.)
    resetGameState();
    resetRNG();
    resetInternationalPressure();
    pressureInitializedNationsRef.current.clear();
    resetPressureDeltaState();
    pressureDeltaRef.current = pressureDeltaState;

    // Reset bootstrap flag to allow game initialization to run again
    hasBootstrappedGameRef.current = false;
    hasAutoplayedTurnOneMusicRef.current = false;

    // Re-sync S reference after reset
    S = GameStateManager.getState();

    // Reapply the selected scenario after reset so campaign settings persist
    const scenario = SCENARIOS[selectedScenarioId] ?? getDefaultScenario();
    S.scenario = scenario;
    const defcon = getScenarioDefcon(scenario);
    S.defcon = defcon;
    S.actionsRemaining = defcon >= 4 ? 1 : defcon >= 2 ? 2 : 3;

    S.selectedLeader = leaderToUse;
    S.selectedDoctrine = doctrineToUse;
    S.playerName = leaderToUse;

    // Reset AI negotiation trigger tracking for new game
    resetTriggerTracking();

    // Initialize Doctrine Incident System
    S.doctrineIncidentState = initializeDoctrineIncidentState();
    S.doctrineShiftState = initializeDoctrineShiftState(doctrineToUse as DoctrineKey);
    console.log('[Doctrine System] Initialized for doctrine:', doctrineToUse);

    // Expose updated S to window when game starts
    if (typeof window !== 'undefined') {
      (window as any).S = S;
      console.log('[Game State] Exposed S to window at game start. Scenario ID:', S.scenario?.id, 'Leader:', leaderToUse, 'Doctrine:', doctrineToUse);
    }

    setIsGameStarted(true);
  }, [resetRNG, selectedLeader, selectedDoctrine, selectedScenarioId]);

  // Doctrine Incident Choice Handler
  const handleDoctrineIncidentChoice = useCallback((choiceId: string) => {
    if (!S.doctrineIncidentState?.activeIncident || !S.doctrineShiftState) {
      console.error('[Doctrine System] No active incident to resolve');
      return;
    }

    const playerNation = PlayerManager.get();
    if (!playerNation) {
      console.error('[Doctrine System] No player nation found');
      return;
    }

    try {
      const result = resolveIncident(
        S.doctrineIncidentState.activeIncident,
        choiceId,
        S,
        playerNation,
        S.doctrineIncidentState,
        S.doctrineShiftState
      );

      // Apply updates
      PlayerManager.set(result.updatedNation);
      S.doctrineIncidentState = result.updatedIncidentState;
      S.doctrineShiftState = result.updatedShiftState;

      // Add news items
      result.newsItems.forEach(newsItem => {
        addNewsItem(newsItem.category, newsItem.headline, newsItem.priority);
      });

      // Handle special effects
      if (result.triggeredWar) {
        log('⚔️ Your decision has triggered war!', 'alert');

        // Mark as aggressive action
        const player = PlayerManager.get();
        if (player) {
          player.lastAggressiveAction = S.turn;
        }

        handleDefconChange(-1, 'Your decision has triggered war!', 'player', {
          onAudioTransition: AudioSys.handleDefconTransition,
          onLog: log,
          onNewsItem: addNewsItem,
          onUpdateDisplay: updateDisplay,
          onShowModal: setDefconChangeEvent,
        });
      }

      if (result.brokeTreaties) {
        log('📜 Treaties have been broken!', 'warning');
      }

      // Show follow-up incident if any
      if (result.followUpIncidentId) {
        // Will be triggered on next turn
        console.log('[Doctrine System] Follow-up incident queued:', result.followUpIncidentId);
      }

      console.log('[Doctrine System] Incident resolved:', choiceId);
      updateDisplay();
    } catch (err) {
      console.error('[Doctrine System] Error resolving incident:', err);
      toast({
        title: 'Error',
        description: 'Failed to process your choice. Please try again.',
      });
    }
  }, []);

  const handleIntelOperations = useCallback(() => {
    AudioSys.playSFX('click');
    setIsIntelOperationsOpen(true);
  }, []);

  const handleSatelliteComms = useCallback(() => {
    AudioSys.playSFX('click');
    setIsSatelliteCommsOpen(true);
  }, []);

  const handleDeploySatellite = useCallback((targetId: string) => {
    const player = PlayerManager.get();
    if (!player) return;

    // Execute satellite deployment
    const result = executeSatelliteDeployment(player, getNationById(nations, targetId) as Nation, S.turn);

    // Deduct intel cost
    player.intel = Math.max(0, player.intel - INTEL_OPERATIONS.satellite.intelCost);

    // Set cooldown
    if (!player.intelOperationCooldowns) {
      player.intelOperationCooldowns = {};
    }
    player.intelOperationCooldowns['satellite'] = INTEL_OPERATIONS.satellite.cooldown;

    // Apply satellite coverage with expiry turn
    if (!player.satellites) {
      player.satellites = {};
    }
    player.satellites[targetId] = result.expiresAtTurn;

    // Register satellite orbit for visual display
    registerSatelliteOrbit(player.id, targetId);

    log(`Deployed satellite over ${result.targetId}. Intel coverage active for ${result.duration} turns.`);
    toast({ title: 'Satellite Deployed', description: `Intelligence coverage established over target nation` });
    setIsIntelOperationsOpen(false);
  }, [nations, S.turn, log]);

  const handleSabotageOperation = useCallback((targetId: string, targetType: 'missiles' | 'warheads') => {
    const player = PlayerManager.get();
    const target = getNationById(nations, targetId) as Nation;
    if (!player || !target) return;

    // Execute sabotage
    const result = executeSabotageOperation(player, target, targetType);

    // Deduct intel cost
    player.intel = Math.max(0, player.intel - INTEL_OPERATIONS.sabotage.intelCost);

    // Set cooldown
    if (!player.intelOperationCooldowns) {
      player.intelOperationCooldowns = {};
    }
    player.intelOperationCooldowns['sabotage'] = INTEL_OPERATIONS.sabotage.cooldown;

    log(result.message);

    if (result.discovered) {
      toast({
        title: 'Sabotage Detected!',
        description: `Operation was discovered by ${target.name}`,
        variant: 'destructive'
      });

      // Apply relationship penalty
      if (result.relationshipPenalty && player.relationships) {
        player.relationships[targetId] = Math.max(-100,
          (player.relationships[targetId] || 0) + result.relationshipPenalty
        );
      }
    } else {
      toast({ title: 'Sabotage Complete', description: result.message });
    }

    setIsIntelOperationsOpen(false);
  }, [nations, log]);

  const handleCyberAttackOperation = useCallback((targetId: string) => {
    const player = PlayerManager.get();
    const target = getNationById(nations, targetId) as Nation;
    if (!player || !target) return;

    // Execute cyber attack
    const result = executeCyberAttack(player, target);

    // Deduct intel cost
    player.intel = Math.max(0, player.intel - INTEL_OPERATIONS['cyber-attack'].intelCost);

    // Set cooldown
    if (!player.intelOperationCooldowns) {
      player.intelOperationCooldowns = {};
    }
    player.intelOperationCooldowns['cyber-attack'] = INTEL_OPERATIONS['cyber-attack'].cooldown;

    log(result.message);

    const currentTurn = GameStateManager.getTurn();
    let updatedPlayer = player;
    let updatedTarget = target;

    if (result.relationshipPenalty !== 0) {
      const reason = result.attributed
        ? `${target.name} traced your cyber attack`
        : `${target.name} detected suspicious cyber activity`;
      updatedPlayer = modifyRelationship(updatedPlayer, target.id, result.relationshipPenalty, reason, currentTurn) as Nation;
      updatedTarget = modifyRelationship(updatedTarget, player.id, result.relationshipPenalty, reason, currentTurn) as Nation;
    }

    if (result.defconDelta !== 0) {
      const defconReason = result.attributed
        ? `${target.name} escalates readiness after tracing a cyber attack`
        : `${target.name} heightens readiness after cyber intrusion`;
      handleDefconChange(result.defconDelta, defconReason, 'ai', {
        onAudioTransition: AudioSys.handleDefconTransition,
        onLog: log,
        onNewsItem: addNewsItem,
        onUpdateDisplay: updateDisplay,
        onShowModal: setDefconChangeEvent,
      });
    }

    let retaliationQueued = false;

    if (result.discovered) {
      const toastTitle = result.attributed ? 'Cyber Attack Attributed!' : 'Cyber Attack Detected';
      const toastDescription = result.attributed ? `Attack traced back to you!` : `Target detected the attack`;
      toast({
        title: toastTitle,
        description: toastDescription,
        variant: result.attributed ? 'destructive' : 'default'
      });

      if (result.attributed) {
        const retaliation = spyNetworkApi?.launchCounterIntel(target.id, player.id);
        retaliationQueued = Boolean(retaliation?.success);

        // CRITICAL FIX: launchCounterIntel mutates target nation via GameStateManager.updateNation
        // We must fetch the updated state to avoid overwriting those changes (intel cost, spy network)
        const freshTarget = getNationById(GameStateManager.getNations(), target.id) as Nation;
        if (freshTarget) {
          updatedTarget = freshTarget;
        }

        if (!retaliationQueued) {
          updatedTarget = {
            ...updatedTarget,
            pendingCyberRetaliation: {
              targetId: player.id,
              triggerTurn: currentTurn + 1,
              reason: 'Cyber attack attribution',
            },
          };
          retaliationQueued = true;
        }

        if (retaliationQueued) {
          result.retaliationExpected = true;
          log(`${target.name} vows retaliation after tracing the cyber attack.`);
          addNewsItem('intel', `${target.name} prepares counter-operations after tracing a cyber attack to ${player.name}.`, 'urgent');
        }
      } else {
        addNewsItem('intel', `${target.name} increases cyber defenses after detecting hostile network probes.`, 'important');
      }
    } else {
      toast({ title: 'Cyber Attack Successful', description: result.message });
    }

    PlayerManager.set(updatedPlayer);
    GameStateManager.updateNation(updatedTarget.id, updatedTarget);
    nations = GameStateManager.getNations();
    PlayerManager.setNations(nations);

    updateDisplay();
    setIsIntelOperationsOpen(false);
  }, [nations, log, addNewsItem, updateDisplay]);

  // ResearchModal - Extracted to src/components/game/ResearchModal.tsx (Phase 7 refactoring)
  const renderResearchModal = useCallback((): ReactNode => {
    return <ResearchModal closeModal={closeModal} startResearch={startResearch} />;
  }, [closeModal, startResearch]);

  // ============================================================
  // BUILD HANDLERS - Extracted to src/lib/buildHandlers.ts (Session 4)
  // ============================================================

  const getBuildHandlerDeps = useCallback((): BuildHandlerDependencies => {
    return {
      S,
      isGameStarted,
      AudioSys,
      log,
      updateDisplay,
      consumeAction,
      closeModal,
      openModal,
      renderBuildModal,
      requestApproval,
      setCivInfoDefaultTab,
      setCivInfoPanelOpen,
    };
  }, [isGameStarted, log, updateDisplay, consumeAction, closeModal, openModal, renderBuildModal, requestApproval, setCivInfoDefaultTab, setCivInfoPanelOpen]);

  const getBuildContext = useCallback((actionLabel: string): Nation | null => getBuildContextExtracted(actionLabel, getBuildHandlerDeps()), [getBuildHandlerDeps]);

  const buildMissile = useCallback(() => buildMissileExtracted(getBuildHandlerDeps()), [getBuildHandlerDeps]);

  const buildBomber = useCallback(() => buildBomberExtracted(getBuildHandlerDeps()), [getBuildHandlerDeps]);

  const buildDefense = useCallback(() => buildDefenseExtracted(getBuildHandlerDeps()), [getBuildHandlerDeps]);

  const buildCity = useCallback(() => buildCityExtracted(getBuildHandlerDeps()), [getBuildHandlerDeps]);

  const buildWarhead = useCallback((yieldMT: number) => buildWarheadExtracted(yieldMT, getBuildHandlerDeps()), [getBuildHandlerDeps]);


  // BuildModal - Extracted to src/components/game/BuildModal.tsx (Phase 7 refactoring)
  const renderBuildModal = useCallback((): ReactNode => {
    return (
      <BuildModal
        isGameStarted={isGameStarted}
        buildMissile={buildMissile}
        buildBomber={buildBomber}
        buildDefense={buildDefense}
        buildCity={buildCity}
        buildWarhead={buildWarhead}
      />
    );
  }, [isGameStarted, buildMissile, buildBomber, buildDefense, buildCity, buildWarhead]);

  const handleBuild = useCallback(async () => handleBuildExtracted(getBuildHandlerDeps()), [getBuildHandlerDeps]);

  const handleResearch = useCallback(async () => handleResearchExtracted(getBuildHandlerDeps()), [getBuildHandlerDeps]);

  // Dependency injection helper for intel handlers
  const getIntelHandlerDeps = useCallback((): IntelHandlerDependencies => {
    return {
      S,
      nations,
      targetableNations,
      AudioSys,
      log,
      openModal,
      closeModal,
      updateDisplay,
      consumeAction,
      getBuildContext,
      requestApproval,
      getCyberActionAvailability,
      launchCyberAttack,
      hardenCyberNetworks,
      launchCyberFalseFlag,
      registerSatelliteOrbit,
      adjustThreat,
      handleDefconChange,
      addNewsItem,
      setDefconChangeEvent,
      isEligibleEnemyTarget,
    };
  }, [S, nations, targetableNations, AudioSys, log, openModal, closeModal, updateDisplay, consumeAction, getBuildContext, requestApproval, getCyberActionAvailability, launchCyberAttack, hardenCyberNetworks, launchCyberFalseFlag, registerSatelliteOrbit, adjustThreat, handleDefconChange, addNewsItem, setDefconChangeEvent, isEligibleEnemyTarget]);

  const handleIntel = useCallback(async () => handleIntelExtracted(getIntelHandlerDeps()), [getIntelHandlerDeps]);

  const handleStartLabConstruction = useCallback((tier: number) => {
    const player = getNationById(nations, playerNationId);
    if (!player) return;

    const result = startLabConstruction(tier as BioLabTier, player.production, player.uranium);

    if (result.success) {
      toast({
        title: 'Construction Started',
        description: result.message,
        duration: 3000,
      });
    } else {
      toast({
        title: 'Construction Failed',
        description: result.message,
        variant: 'destructive',
        duration: 3000,
      });
    }
  }, [startLabConstruction, playerNationId, getNationById]);

  const handleCancelLabConstruction = useCallback(() => {
    const result = cancelLabConstruction();

    if (result.success) {
      toast({
        title: 'Construction Cancelled',
        description: result.message,
        duration: 3000,
      });
    }
  }, [cancelLabConstruction]);

  const handleDeployBioWeapon = useCallback((selections: Array<{
    nationId: string;
    nationName: string;
    deploymentMethod: string;
    useFalseFlag: boolean;
    falseFlagNationId: string | null;
  }>) => {
    // Calculate total intel cost
    const totalIntelCost = selections.reduce((total, selection) => {
      const method = DEPLOYMENT_METHODS.find(m => m.id === selection.deploymentMethod);
      return total + (method?.intelCost || 0);
    }, 0);

    const player = PlayerManager.get();
    if (!player) return;

    const targetNations = selections
      .map((selection) => getNationById(nations, selection.nationId))
      .filter((nation): nation is Nation => Boolean(nation));

    if (targetNations.length === 0) {
      toast({
        title: 'No valid targets',
        description: 'Select at least one valid nation for bio-weapon deployment.',
        variant: 'destructive',
      });
      return;
    }

    const bioContext: ConsequenceCalculationContext = {
      playerNation: player,
      targetNation: targetNations[0],
      allNations: GameStateManager.getNations(),
      currentDefcon: S.defcon,
      currentTurn: S.turn,
      gameState: S as GameState,
    };

    const preview = calculateActionConsequences('deploy_bio_weapon', bioContext, {
      targetNations,
      plagueType: plagueState.selectedPlagueType || 'Bio-weapon',
    });

    const blockedReasons = preview?.blockedReasons ? [...preview.blockedReasons] : [];
    if ((player.intel || 0) < totalIntelCost) {
      blockedReasons.push(`Requires ${totalIntelCost} Intel. Current: ${Math.floor(player.intel || 0)}`);
    }

    const previewToShow = preview
      ? {
          ...preview,
          costs: { ...(preview.costs ?? {}), intel: totalIntelCost },
          blockedReasons: blockedReasons.length > 0 ? blockedReasons : preview.blockedReasons,
        }
      : null;

    const executeDeploy = () => {
      player.intel = Math.max(0, (player.intel || 0) - totalIntelCost);
      deployBioWeapon(selections, S.turn);
    };

    if (queueConsequencePreview(previewToShow, blockedReasons.length === 0 ? executeDeploy : undefined)) {
      return;
    }

    if ((player.intel || 0) < totalIntelCost) {
      toast({
        title: 'Insufficient Intel',
        description: `You need ${totalIntelCost} Intel to deploy this bio-weapon strike.`,
        variant: 'destructive',
      });
      return;
    }

    executeDeploy();
  }, [
    deployBioWeapon,
    S.turn,
    S.defcon,
    plagueState.selectedPlagueType,
    getNationById,
    nations,
    queueConsequencePreview,
    toast,
  ]);

  // ========== SIMPLIFIED SYSTEM HANDLERS ==========

  // Unified Diplomacy Handlers
  const handleDiplomaticProposal = useCallback((type: ProposalType, targetId: string, terms?: any) => {
    const player = PlayerManager.get();
    const target = getNationById(nations, targetId);
    if (!player || !target) return;

    log(`Diplomatic proposal sent: ${type} to ${target.name}`, 'diplomatic');

    // Apply relationship changes based on proposal type
    if (type === 'aid' && terms?.resourceAmount) {
      // Deduct resources and improve relationship
      player.production = Math.max(0, player.production - terms.resourceAmount);

      const updatedNations = nations.map(n => {
        if (n.id === target.id && n.relationships) {
          return {
            ...n,
            relationships: {
              ...n.relationships,
              [player.id]: Math.min(100, (n.relationships[player.id] || 0) + 10),
            },
          };
        }
        if (n.id === player.id && n.relationships) {
          return {
            ...n,
            relationships: {
              ...n.relationships,
              [targetId]: Math.min(100, (n.relationships[targetId] || 0) + 10),
            },
          };
        }
        return n;
      });

      nations = updatedNations;
      GameStateManager.setNations(updatedNations);
      PlayerManager.setNations(updatedNations);

      ensurePressureTracking(target.id);
      ensurePressureTracking(player.id);
      const aidTypes: AidType[] = terms.resourceAmount >= 60 ? ['economic', 'humanitarian'] : ['economic'];
      const aidDuration = Math.min(8, Math.max(3, Math.ceil(terms.resourceAmount / 20)));
      grantInternationalAid(target.id, [player.id], aidTypes, aidDuration, []);

      // Significant aid demonstrates goodwill and reduces tensions
      if (terms.resourceAmount >= 50) {
        handleDefconChange(1, `Generous aid to ${target.name} demonstrates goodwill and eases tensions`, 'player', {
          onAudioTransition: AudioSys.handleDefconTransition,
          onLog: log,
          onNewsItem: addNewsItem,
          onUpdateDisplay: updateDisplay,
          onShowModal: setDefconChangeEvent,
        });

        toast({
          title: 'Aid Sent',
          description: `Sent ${terms.resourceAmount} production to ${target.name}. Relationship improved by +10. Global tensions reduced.`,
        });
      } else {
        toast({
          title: 'Aid Sent',
          description: `Sent ${terms.resourceAmount} production to ${target.name}. Relationship improved by +10.`,
        });
      }
    } else if (type === 'alliance') {
      // Check if relationship is high enough
      const relationship = getRelationship(player, targetId, nations);
      const allianceContext: ConsequenceCalculationContext = {
        playerNation: player,
        targetNation: target,
        allNations: nations,
        currentDefcon: S.defcon,
        currentTurn: S.turn,
        gameState: S as GameState,
      };

      const executeAlliance = () => {
        const { updatedPlayer, updatedTarget } = applyAllianceProposal(player, target);
        const updatedNations = nations.map(n => {
          if (n.id === updatedPlayer.id) {
            return updatedPlayer;
          }
          if (n.id === updatedTarget.id) {
            return updatedTarget;
          }
          return n;
        });

        nations = updatedNations;
        GameStateManager.setNations(updatedNations);
        PlayerManager.setNations(updatedNations);
        log(`Alliance formed between ${player.name} and ${target.name}!`, 'diplomatic');

        // Alliance formation reduces global tensions
        handleDefconChange(1, `Alliance between ${player.name} and ${target.name} reduces global tensions`, 'player', {
          onAudioTransition: AudioSys.handleDefconTransition,
          onLog: log,
          onNewsItem: addNewsItem,
          onUpdateDisplay: updateDisplay,
          onShowModal: setDefconChangeEvent,
        });

        toast({
          title: 'Alliance Formed',
          description: `You are now allied with ${target.name}. Global tensions reduced.`,
        });
      };

      const alliancePreview = calculateActionConsequences('form_alliance', allianceContext, { targetNation: target });
      if (alliancePreview) {
        const blockedReasons = alliancePreview.blockedReasons ? [...alliancePreview.blockedReasons] : [];
        if (!canFormAlliance(relationship)) {
          blockedReasons.push(
            `${target.name} requires a relationship of at least +${RELATIONSHIP_ALLIED}. Current: ${relationship}`,
          );
        }

        const previewToShow = {
          ...alliancePreview,
          blockedReasons: blockedReasons.length > 0 ? blockedReasons : alliancePreview.blockedReasons,
        };

        if (queueConsequencePreview(previewToShow, canFormAlliance(relationship) ? executeAlliance : undefined)) {
          return;
        }
      }

      if (!canFormAlliance(relationship)) {
        toast({
          title: 'Alliance Rejected',
          description: `${target.name} requires a relationship of at least +${RELATIONSHIP_ALLIED}. Current: ${relationship}`,
          variant: 'destructive',
        });
        return;
      }

      executeAlliance();
    } else if (type === 'truce') {
      // Establish temporary peace treaty
      const truceDuration = terms?.duration || 10; // Default 10 turns
      const { updatedPlayer, updatedTarget, expiryTurn: truceExpiryTurn } = applyTruceProposal(
        player,
        target,
        truceDuration,
        S.turn
      );
      const updatedNations = nations.map(n => {
        if (n.id === updatedPlayer.id) {
          return updatedPlayer;
        }
        if (n.id === updatedTarget.id) {
          return updatedTarget;
        }
        return n;
      });

      nations = updatedNations;
      GameStateManager.setNations(updatedNations);
      PlayerManager.setNations(updatedNations);
      log(`Truce established between ${player.name} and ${target.name} for ${truceDuration} turns`, 'diplomatic');

      // Truce has stronger de-escalation effect at critical DEFCON levels
      const currentDefcon = GameStateManager.getDefcon();
      const defconBonus = currentDefcon <= 2 ? 2 : 1; // Larger impact at crisis levels
      handleDefconChange(
        defconBonus,
        `Truce agreement between ${player.name} and ${target.name} de-escalates conflict`,
        'player',
        {
          onAudioTransition: AudioSys.handleDefconTransition,
          onLog: log,
          onNewsItem: addNewsItem,
          onUpdateDisplay: updateDisplay,
          onShowModal: setDefconChangeEvent,
        }
      );

      toast({
        title: 'Truce Established',
        description: `${truceDuration}-turn peace treaty with ${target.name}. Global tensions significantly reduced.`,
      });
    } else if (type === 'peace-initiative') {
      // Global peace initiative - costs resources, improves relations with ALL nations, +1 DEFCON
      const peaceCost = { production: 100, intel: 50 };

      // Check resources
      if (player.production < peaceCost.production || player.intel < peaceCost.intel) {
        toast({
          title: 'Insufficient Resources',
          description: `Peace Initiative requires ${peaceCost.production} production and ${peaceCost.intel} intel.`,
          variant: 'destructive',
        });
        return;
      }

      // Check cooldown (can only be used every 5 turns)
      const cooldownTurns = 5;
      if (player.lastPeaceInitiative && (S.turn - player.lastPeaceInitiative) < cooldownTurns) {
        const turnsRemaining = cooldownTurns - (S.turn - player.lastPeaceInitiative);
        toast({
          title: 'Initiative Not Ready',
          description: `Peace Initiative can be used again in ${turnsRemaining} turns.`,
          variant: 'destructive',
        });
        return;
      }

      // Check if player has been aggressive recently (blocks if attacked in last 3 turns)
      if (player.lastAggressiveAction && (S.turn - player.lastAggressiveAction) < 3) {
        toast({
          title: 'Initiative Rejected',
          description: 'Recent aggressive actions make peace initiatives implausible. Wait 3 turns after hostilities.',
          variant: 'destructive',
        });
        return;
      }

      // Deduct resources
      player.production = Math.max(0, player.production - peaceCost.production);
      player.intel = Math.max(0, player.intel - peaceCost.intel);
      player.lastPeaceInitiative = S.turn;

      // Improve relations with ALL living nations
      const updatedNations = nations.map(n => {
        if (n.id === player.id) {
          return { ...player };
        }
        if (!n.eliminated && n.id !== player.id) {
          return {
            ...n,
            relationships: {
              ...n.relationships,
              [player.id]: Math.min(100, (n.relationships?.[player.id] || 0) + 15),
            },
          };
        }
        return n;
      });

      nations = updatedNations;
      GameStateManager.setNations(updatedNations);
      PlayerManager.setNations(updatedNations);
      log(`${player.name} launches global peace initiative`, 'diplomatic');

      // Peace initiative always provides +1 DEFCON
      handleDefconChange(1, `${player.name}'s peace initiative reduces global tensions`, 'player', {
        onAudioTransition: AudioSys.handleDefconTransition,
        onLog: log,
        onNewsItem: addNewsItem,
        onUpdateDisplay: updateDisplay,
        onShowModal: setDefconChangeEvent,
      });

      toast({
        title: 'Peace Initiative Launched',
        description: `All nations respond positively (+15 relations). Global tensions reduced. Next initiative available in ${cooldownTurns} turns.`,
      });
    }
  }, [nations, log, toast, S.turn, addNewsItem, updateDisplay]);

  // Simplified Bio-Warfare Handlers
  const handleBioWeaponResearch = useCallback(() => {
    const player = PlayerManager.get();
    if (!player) return;

    player.bioWeaponResearched = true;
    player.production = Math.max(0, player.production - 100);
    player.intel = Math.max(0, player.intel - 50);

    log('Bio-weapon research completed', 'military');
    toast({
      title: 'Bio-Weapons Ready',
      description: 'Your nation can now deploy biological weapons.',
    });
  }, [log, toast]);

  const handleBioDefenseUpgrade = useCallback(() => {
    const player = PlayerManager.get();
    if (!player) return;

    const currentLevel = player.bioDefenseLevel || 0;
    if (currentLevel >= 3) return;

    const nextDefense = [
      { prod: 80, intel: 30 },
      { prod: 150, intel: 50 },
      { prod: 250, intel: 80 },
    ][currentLevel];

    player.bioDefenseLevel = currentLevel + 1;
    player.production = Math.max(0, player.production - nextDefense.prod);
    player.intel = Math.max(0, player.intel - nextDefense.intel);

    log(`Bio-defense upgraded to level ${currentLevel + 1}`, 'military');
    toast({
      title: 'Bio-Defense Upgraded',
      description: `Now at level ${currentLevel + 1}. Increased protection against bio-weapons.`,
    });
  }, [log, toast]);

  const handleSimplifiedBioWeaponDeploy = useCallback((targetId: string) => {
    const player = PlayerManager.get();
    const target = getNationById(nations, targetId);
    if (!player || !target) return;

    const result = deployBioWeapon(player, target, S.turn);

    if (!result.success) {
      toast({
        title: 'Deployment Failed',
        description: result.message,
        variant: 'destructive',
      });
      return;
    }

    // Update nations
    const updatedNations = nations.map(n => {
      if (n.id === player.id) return result.attacker;
      if (n.id === target.id) return result.target;
      return n;
    });
    nations = updatedNations;
    GameStateManager.setNations(updatedNations);
    PlayerManager.setNations(updatedNations);

    log(result.message, 'military');
    toast({
      title: result.detected ? 'Bio-Weapon Detected!' : 'Bio-Weapon Deployed',
      description: result.message,
      variant: result.detected ? 'destructive' : 'default',
    });
  }, [nations, S.turn, log, toast]);

  // Streamlined Culture Handlers
  const handleAdvancedPropagandaUpdate = useCallback((updated: GameState) => {
    const nextState = updated as LocalGameState;
    GameStateManager.setState(nextState);
    const nextNations = updated.nations as LocalNation[];
    GameStateManager.setNations(nextNations);
    PlayerManager.setNations(nextNations);
    nations = nextNations;
    S = GameStateManager.getState();
    setRenderTick((t) => t + 1);
    triggerNationsUpdate?.();
    updateDisplay();
  }, [setRenderTick]);

  const handleLaunchPropaganda = useCallback((type: PropagandaType, targetId: string) => {
    const player = PlayerManager.get();
    const target = getNationById(nations, targetId);
    if (!player || !target) return;

    const result = launchPropagandaCampaign(player, target, type, S.turn, nations);

    if (!result.success) {
      toast({
        title: 'Campaign Failed',
        description: result.message,
        variant: 'destructive',
      });
      return;
    }

    // Update nations
    const launcherWithCampaign: Nation = Array.isArray(result.launcher.propagandaCampaigns)
      ? result.launcher.propagandaCampaigns.some(campaign => campaign.id === result.campaign.id)
        ? result.launcher
        : {
            ...result.launcher,
            propagandaCampaigns: [...result.launcher.propagandaCampaigns, result.campaign],
          } as Nation
      : {
          ...result.launcher,
          propagandaCampaigns: [result.campaign],
        } as Nation;

    const updatedNations = nations.map(n => {
      if (n.id === player.id) return launcherWithCampaign;
      if (n.id === target.id) return result.target;
      return n;
    });
    nations = updatedNations;
    GameStateManager.setNations(updatedNations);
    PlayerManager.setNations(updatedNations);

    PlayerManager.set(launcherWithCampaign);

    triggerNationsUpdate?.();

    log(result.message, 'diplomatic');
    toast({
      title: result.discovered ? 'Campaign Discovered!' : 'Propaganda Launched',
      description: result.message,
      variant: result.discovered ? 'destructive' : 'default',
    });
  }, [nations, S.turn, log, toast]);

  const handleBuildWonder = useCallback((wonderType: CulturalWonderType) => {
    const player = PlayerManager.get();
    if (!player) return;

    const result = buildWonder(player, wonderType, S.turn);

    if (!result.success) {
      toast({
        title: 'Construction Failed',
        description: result.message,
        variant: 'destructive',
      });
      return;
    }

    // Update player nation
    const updatedNations = nations.map(n => {
      if (n.id === player.id) return result.nation;
      return n;
    });
    nations = updatedNations;
    GameStateManager.setNations(updatedNations);
    PlayerManager.setNations(updatedNations);

    triggerNationsUpdate?.();

    log(result.message, 'diplomatic');
    toast({
      title: 'Wonder Complete',
      description: result.message,
    });
  }, [nations, S.turn, log, toast]);

  const handleSetImmigrationPolicy = useCallback((policy: ImmigrationPolicy) => {
    const player = PlayerManager.get();
    if (!player) return;

    const updatedPlayer = applyImmigrationPolicy(player, policy);

    const updatedNations = nations.map(n => {
      if (n.id === player.id) return updatedPlayer;
      return n;
    });
    nations = updatedNations;
    GameStateManager.setNations(updatedNations);
    PlayerManager.setNations(updatedNations);

    triggerNationsUpdate?.();

    log(`Immigration policy changed to: ${policy}`, 'diplomatic');
    toast({
      title: 'Policy Updated',
      description: `Immigration policy set to: ${policy}`,
    });
  }, [nations, log, toast]);

  // ========== END SIMPLIFIED SYSTEM HANDLERS ==========

  // Casus Belli & War Council Handlers
  const handleDeclareWar = useCallback(
    (targetNationId: string, casusBelliId: string) => {
      const player = PlayerManager.get();
      if (!player) {
        toast({
          title: 'Unable to declare war',
          description: 'Player nation not found.',
          variant: 'destructive',
        });
        return;
      }

      const defender = GameStateManager.getNation(targetNationId);
      if (!defender) {
        toast({
          title: 'Unable to declare war',
          description: 'Target nation not found.',
          variant: 'destructive',
        });
        return;
      }

      const casusBelli = (player.casusBelli || []).find((cb) => cb.id === casusBelliId);
      if (!casusBelli) {
        toast({
          title: 'Casus Belli unavailable',
          description: 'Selected justification could not be found.',
          variant: 'destructive',
        });
        return;
      }

      const context: ConsequenceCalculationContext = {
        playerNation: player,
        targetNation: defender,
        allNations: GameStateManager.getNations(),
        currentDefcon: S.defcon,
        currentTurn: S.turn,
        gameState: S as GameState,
      };

      const executeDeclaration = () => {
        const result = processWarDeclaration(
          player,
          defender,
          casusBelli,
          GameStateManager.getNations(),
          GameStateManager.getState(),
          S.turn
        );

        if (!result.success || !result.warState) {
          toast({
            title: 'War declaration blocked',
            description: result.message,
            variant: 'destructive',
          });
          log(result.message, 'warning');
          return;
        }

        const currentNations = GameStateManager.getNations();
        const replacementMap = new Map<string, Nation>();
        result.updatedNations.forEach((nation) => {
          replacementMap.set(nation.id, nation);
        });
        replacementMap.set(result.updatedAttacker.id, result.updatedAttacker);
        replacementMap.set(result.updatedDefender.id, result.updatedDefender);

        const merged = currentNations.map((nation) => {
          const update = replacementMap.get(nation.id);
          return update ? ({ ...nation, ...update } as LocalNation) : nation;
        });

        refreshGameState(merged);

        const casusState = S.casusBelliState ?? { allWars: [], warHistory: [] };
        casusState.allWars = [
          ...(casusState.allWars || []).filter((war) => war.id !== result.warState.id),
          result.warState,
        ];
        casusState.warHistory = casusState.warHistory || [];
        S.casusBelliState = casusState;

        log(result.message, 'alert');
        toast({ title: 'War Declared', description: result.message });
        addNewsItem('military', result.message, 'critical');

        if (result.councilResolution) {
          const resolutionTitle = result.councilResolution.title ?? 'Council intervention triggered';
          const resolutionDescription =
            result.councilResolution.description ?? 'International Council responds to the conflict.';
          addNewsItem('diplomatic', resolutionTitle, 'important');
          toast({ title: 'Council Intervention', description: resolutionDescription });
        }

        triggerNationsUpdate?.();
      };

      const preview = calculateActionConsequences('declare_war', context, { targetNation: defender });
      if (queueConsequencePreview(preview, executeDeclaration)) {
        return;
      }

      executeDeclaration();
    },
    [refreshGameState, toast, addNewsItem, queueConsequencePreview]
  );

  // Dependency injection helper for diplomatic handlers
  const getDiplomaticHandlerDeps = useCallback((): DiplomaticHandlerDependencies => {
    return {
      S,
      log,
      addNewsItem,
      applyNationUpdatesMap,
      triggerNationsUpdate,
    };
  }, [S, log, addNewsItem, applyNationUpdatesMap, triggerNationsUpdate]);

  const handleOfferPeace = useCallback(
    (warId: string) => handleOfferPeaceExtracted(warId, getDiplomaticHandlerDeps()),
    [getDiplomaticHandlerDeps]
  );

  const handleAcceptPeace = useCallback(
    (offerId: string) => handleAcceptPeaceExtracted(offerId, getDiplomaticHandlerDeps()),
    [getDiplomaticHandlerDeps]
  );

  const handleRejectPeace = useCallback(
    (offerId: string) => handleRejectPeaceExtracted(offerId, getDiplomaticHandlerDeps()),
    [getDiplomaticHandlerDeps]
  );

  const handleCulture = useCallback(async () => {
    const deps: CultureHandlerDeps = {
      requestApproval,
      playSFX: AudioSys.playSFX,
      getBuildContext,
      toast,
      log,
      updateDisplay,
      consumeAction,
      endGame,
      openModal,
      closeModal,
      targetableNations,
      nations,
    };
    await handleCultureExtracted(deps, OperationModal);
  }, [
    requestApproval,
    getBuildContext,
    toast,
    log,
    updateDisplay,
    consumeAction,
    endGame,
    openModal,
    closeModal,
    targetableNations,
    nations,
  ]);


  // REMOVED: Immigration Ops button - functionality integrated into Cultural Operations
  // const handleImmigration = useCallback(async () => { ... }, []);

  const handleDiplomacy = useCallback(async () => {
    const approved = await requestApproval('DIPLOMACY', { description: 'Diplomatic operations request' });
    if (!approved) return;
    AudioSys.playSFX('click');

    // Show enhanced diplomacy modal with Phase 3 features
    setShowEnhancedDiplomacy(true);
  }, [requestApproval]);

  // Legacy diplomacy code removed (was ~400 lines of unreachable dead code after return statement)

  useEffect(() => {
    handleAttackRef.current = handleAttack;
  }, [handleAttack]);

  // Diplomacy Proposal Handlers
  const handleAcceptProposal = useCallback(() => {
    if (!activeDiplomacyProposal) return;

    const proposer = getNationById(nations, activeDiplomacyProposal.proposerId);
    const target = getNationById(nations, activeDiplomacyProposal.targetId);

    if (!proposer || !target) {
      setActiveDiplomacyProposal(null);
      return;
    }

    // Execute the diplomatic action based on proposal type
    switch (activeDiplomacyProposal.type) {
      case 'alliance':
        aiFormAlliance(proposer, target, log);
        log(`${target.name} accepts alliance with ${proposer.name}!`);
        break;

      case 'truce': {
        const duration = activeDiplomacyProposal.terms.duration || 3;
        aiSignMutualTruce(proposer, target, duration, log, 'Diplomatic agreement');
        log(`${target.name} accepts ${duration}-turn truce with ${proposer.name}.`);
        break;
      }

      case 'non-aggression':
        aiSignNonAggressionPact(proposer, target, log);
        log(`${target.name} signs non-aggression pact with ${proposer.name}.`);
        break;

      case 'aid-request':
        if (target.production >= 20) {
          target.production -= 20;
          proposer.production += 15;
          if (proposer.instability) proposer.instability = Math.max(0, proposer.instability - 10);
          log(`${target.name} provides economic aid to ${proposer.name}.`);
        }
        break;

      case 'sanction-lift':
        if (target.sanctionedBy?.[proposer.id]) {
          delete target.sanctionedBy[proposer.id];
          log(`${target.name} lifts sanctions against ${proposer.name}.`);
        }
        break;

      case 'peace-offer':
        aiSignMutualTruce(proposer, target, 5, 'Peace agreement');
        adjustThreat(proposer, target.id, -5);
        adjustThreat(target, proposer.id, -5);
        log(`${target.name} accepts peace with ${proposer.name}.`);
        break;
    }

    // Improve relations
    adjustThreat(proposer, target.id, -2);

    toast({
      title: 'Proposal Accepted',
      description: `You have accepted ${proposer.name}'s proposal.`
    });

    setActiveDiplomacyProposal(null);
  }, [activeDiplomacyProposal, getNationById, toast]);

  const handleRejectProposal = useCallback(() => {
    if (!activeDiplomacyProposal) return;

    const proposer = getNationById(nations, activeDiplomacyProposal.proposerId);
    const target = getNationById(nations, activeDiplomacyProposal.targetId);

    if (!proposer || !target) {
      setActiveDiplomacyProposal(null);
      return;
    }

    // Damage relations for rejection (-6 penalty like Civ 6)
    adjustThreat(proposer, target.id, 6);

    log(`${target.name} rejects ${proposer.name}'s diplomatic proposal. Relations have deteriorated.`);

    toast({
      title: 'Proposal Rejected',
      description: `You have rejected ${proposer.name}'s proposal. Relations have worsened.`,
      variant: 'destructive'
    });

    setActiveDiplomacyProposal(null);
  }, [activeDiplomacyProposal, getNationById, toast]);

  // Handler for opening leader contact modal
  const handleContactLeader = useCallback((nationId: string) => {
    setLeaderContactTargetNationId(nationId);
    setLeaderContactModalOpen(true);
  }, []);

  // Handler for proposing a deal from negotiation interface
  const handleProposeDeal = useCallback((negotiation: NegotiationState) => {
    const player = PlayerManager.get();
    if (!player) return;

    const targetNation = getNationById(nations, negotiation.respondentId);
    if (!targetNation) return;

    // Evaluate the negotiation with AI
    const evaluation = evaluateNegotiation(
      negotiation,
      targetNation,
      player,
      nations,
      S.turn
    );

    // Check if AI accepts
    const roll = Math.random() * 100;
    const accepted = roll <= evaluation.acceptanceProbability;

    if (accepted) {
      // Apply the deal
      const result = applyNegotiationDeal(negotiation, player, targetNation, nations, S.turn, S);

      const updatedState = (result.gameState ? { ...result.gameState } : { ...S }) as LocalGameState;
      const updatedLocalNations = result.allNations as LocalNation[];
      updatedState.nations = updatedLocalNations;

      GameStateManager.setState(updatedState);
      GameStateManager.setNations(updatedLocalNations);
      PlayerManager.setNations(updatedLocalNations);

      S = updatedState;
      nations = updatedLocalNations;

      toast({
        title: 'Deal Accepted!',
        description: `${result.respondent.name} has accepted your proposal.`,
      });
    } else {
      toast({
        title: 'Deal Rejected',
        description: evaluation.feedback || `${targetNation.name} has rejected your proposal.`,
        variant: 'destructive',
      });

      // If there's a counter-offer, the NegotiationInterface will handle it
    }

    // Close the modal
    setLeaderContactModalOpen(false);
    setLeaderContactTargetNationId(null);
  }, [nations, S, toast]);

  const handleEnhancedDiplomacyAction = useCallback((action: DiplomaticAction, target?: Nation) => {
    const player = PlayerManager.get();
    if (!player) return;

    const currentTurn = S.turn;
    const targetNation = target
      ? nations.find((nation) => nation.id === target.id) ?? target
      : undefined;

    if (action.requiresTarget && !targetNation) {
      toast({
        title: 'Select a target nation',
        description: 'Choose a nation before executing this diplomatic action.',
        variant: 'destructive',
      });
      return;
    }

    if (action.id === 'defcon-deescalate') {
      const currentDefcon = GameStateManager.getDefcon();
      if (currentDefcon >= 5) {
        toast({
          title: 'DEFCON already stable',
          description: 'Global readiness is already at DEFCON 5. No further de-escalation is possible.',
          variant: 'destructive',
        });
        return;
      }
    }

    if (action.id === 'defcon-escalate') {
      const currentDefcon = GameStateManager.getDefcon();
      if (!canPerformAction('escalate', currentDefcon)) {
        toast({
          title: 'DEFCON already critical',
          description: 'Global readiness is already at DEFCON 1. No further escalation is possible.',
          variant: 'destructive',
        });
        return;
      }
    }

    if (action.id === 'call-in-favor' && targetNation) {
      const availableFavors = getFavors(player, targetNation.id);
      if (availableFavors <= 0) {
        toast({
          title: 'No favors available',
          description: `${targetNation.name} does not owe you any favors to call in.`,
          variant: 'destructive',
        });
        return;
      }
    }

    if (action.id === 'verify-promise' && targetNation) {
      const playerHasPromise = player.diplomaticPromises?.some(
        (p) => p.toNationId === targetNation.id && !p.fulfilled && !p.broken
      );
      const targetHasPromise = targetNation.diplomaticPromises?.some(
        (p) => p.toNationId === player.id && !p.fulfilled && !p.broken
      );
      if (!playerHasPromise && !targetHasPromise) {
        toast({
          title: 'No promises to verify',
          description: `${targetNation.name} has no active promises with you right now.`,
        });
        return;
      }
    }

    const ensurePhase3State = (): DiplomacyPhase3SystemState => {
      if (!S.diplomacyPhase3) {
        S.diplomacyPhase3 = initializeDiplomacyPhase3State(S.turn);
      }

      if (!S.diplomacyPhase3.phase3Enabled) {
        S.diplomacyPhase3 = {
          ...S.diplomacyPhase3,
          phase3Enabled: true,
          activatedTurn: Math.min(S.diplomacyPhase3.activatedTurn ?? currentTurn, currentTurn),
        };
      }

      return S.diplomacyPhase3;
    };

    const persistPhase3State = (nextPhase3: DiplomacyPhase3SystemState) => {
      S.diplomacyPhase3 = nextPhase3;
      const nextState = { ...S, diplomacyPhase3: nextPhase3 } as LocalGameState;
      GameStateManager.setState(nextState);
      S = nextState;
      (window as any).S = S;
      setDiplomacyPhase3State(nextPhase3);
    };

    const ensureCouncil = () => {
      let phase3 = ensurePhase3State();
      if (phase3.internationalCouncil) {
        return phase3.internationalCouncil;
      }

      const permanentMembers = nations
        .filter((nation) => nation.councilMembership === 'permanent')
        .map((nation) => nation.id);

      let council = initializeInternationalCouncil(currentTurn, permanentMembers);

      const electedMembers = nations.filter((nation) => nation.councilMembership === 'elected');
      for (const member of electedMembers) {
        council = electCouncilMember(council, member.id, currentTurn);
      }

      const observerMembers = nations.filter((nation) => nation.councilMembership === 'observer');
      for (const observer of observerMembers) {
        council = addObserver(council, observer.id);
      }

      phase3 = {
        ...phase3,
        phase3Enabled: true,
        internationalCouncil: council,
      };

      persistPhase3State(phase3);
      return council;
    };

    let updatedPlayer: Nation = player;
    let updatedTarget: Nation | undefined = targetNation;
    let newsItem: { text: string; priority: 'info' | 'important' | 'critical' } | null = null;
    let toastPayload: { title: string; description: string; variant?: 'default' | 'destructive' | 'success' } | null = null;

    const trySpendDip = (cost: number, reason: string, withNationId?: string): boolean => {
      const spent = spendDIP(updatedPlayer, cost, reason, currentTurn, withNationId ?? updatedTarget?.id);
      if (!spent) {
        toast({
          title: 'Insufficient DIP',
          description: `This action requires ${cost} DIP.`,
          variant: 'destructive',
        });
        return false;
      }

      updatedPlayer = spent;
      return true;
    };

    if (
      action.dipCost &&
      action.id !== 'propose-resolution' &&
      action.id !== 'call-session' &&
      action.id !== 'defcon-deescalate' &&
      action.id !== 'defcon-escalate'
    ) {
      const success = trySpendDip(action.dipCost, action.id, targetNation?.id);
      if (!success) {
        return;
      }
    }

    switch (action.id) {
      case 'build-trust': {
        if (!updatedTarget) break;
        const reason = `Trust-building summit with ${updatedTarget.name}`;
        updatedPlayer = modifyTrust(updatedPlayer, updatedTarget.id, 3, reason, currentTurn);
        updatedTarget = modifyTrust(updatedTarget, updatedPlayer.id, 6, reason, currentTurn);
        updatedPlayer = modifyRelationship(updatedPlayer, updatedTarget.id, 4, reason, currentTurn);
        updatedTarget = modifyRelationship(updatedTarget, updatedPlayer.id, 5, reason, currentTurn);

        const playerTrust = getTrust(updatedPlayer, updatedTarget.id);
        const targetTrust = getTrust(updatedTarget, updatedPlayer.id);

        toastPayload = {
          title: 'Trust Building Successful',
          description: `Your trust in ${updatedTarget.name} is now ${playerTrust}, and their trust in you is ${targetTrust}.`,
        };
        newsItem = {
          text: `${player.name} orchestrates a trust-building summit with ${updatedTarget.name}, raising mutual confidence.`,
          priority: 'important',
        };
        log(`${player.name} increases mutual trust with ${updatedTarget.name} through diplomatic outreach.`);
        break;
      }
      case 'grant-favor': {
        if (!updatedTarget) break;
        const favorAmount = 4;
        const reason = `Granted strategic favor to ${updatedTarget.name}`;
        updatedPlayer = modifyFavors(updatedPlayer, updatedTarget.id, favorAmount, reason, currentTurn);
        updatedTarget = modifyFavors(updatedTarget, updatedPlayer.id, -favorAmount, reason, currentTurn);
        updatedTarget = modifyTrust(updatedTarget, updatedPlayer.id, 5, reason, currentTurn);
        updatedPlayer = modifyRelationship(updatedPlayer, updatedTarget.id, 3, reason, currentTurn);
        updatedTarget = modifyRelationship(updatedTarget, updatedPlayer.id, 4, reason, currentTurn);

        const favorBalance = getFavors(updatedPlayer, updatedTarget.id);
        toastPayload = {
          title: 'Favor Granted',
          description: `${updatedTarget.name} now owes you ${favorBalance} favor(s). Their trust in you improved.`,
        };
        newsItem = {
          text: `${player.name} extends crucial support to ${updatedTarget.name}, earning diplomatic leverage.`,
          priority: 'important',
        };
        log(`${player.name} granted a diplomatic favor to ${updatedTarget.name}, strengthening leverage.`);
        break;
      }
      case 'call-in-favor': {
        if (!updatedTarget) break;
        const availableFavors = Math.max(0, getFavors(updatedPlayer, updatedTarget.id));
        const spendAmount = Math.min(availableFavors, FavorCosts.REQUEST_AID);
        const reason = `Called in favor from ${updatedTarget.name}`;
        updatedPlayer = modifyFavors(updatedPlayer, updatedTarget.id, -spendAmount, reason, currentTurn);
        updatedTarget = modifyFavors(updatedTarget, updatedPlayer.id, spendAmount, reason, currentTurn);
        updatedPlayer = modifyTrust(updatedPlayer, updatedTarget.id, 2, reason, currentTurn);
        updatedTarget = modifyTrust(updatedTarget, updatedPlayer.id, -2, reason, currentTurn);
        updatedPlayer = modifyRelationship(updatedPlayer, updatedTarget.id, 2, reason, currentTurn);
        updatedTarget = modifyRelationship(updatedTarget, updatedPlayer.id, -1, reason, currentTurn);

        toastPayload = {
          title: 'Favor Called In',
          description: `${updatedTarget.name} honored your request. Remaining favors owed: ${Math.max(0, getFavors(updatedPlayer, updatedTarget.id))}.`,
        };
        newsItem = {
          text: `${player.name} calls in a diplomatic favor from ${updatedTarget.name}, pressing for tangible support.`,
          priority: 'important',
        };
        log(`${player.name} called in a favor from ${updatedTarget.name}, adjusting diplomatic balances.`);
        break;
      }
      case 'make-promise': {
        if (!updatedTarget) break;
        const promiseTerms = {
          duration: 8,
          targetNationId: updatedTarget.id,
          trustReward: 8,
          trustPenalty: 12,
          relationshipPenalty: -10,
        } as const;
        updatedPlayer = createPromise(updatedPlayer, updatedTarget.id, 'no-attack', promiseTerms, currentTurn);
        const reason = `Pledged non-aggression toward ${updatedTarget.name}`;
        updatedTarget = modifyTrust(updatedTarget, updatedPlayer.id, 4, reason, currentTurn);
        updatedPlayer = modifyRelationship(updatedPlayer, updatedTarget.id, 2, reason, currentTurn);
        updatedTarget = modifyRelationship(updatedTarget, updatedPlayer.id, 5, reason, currentTurn);

        toastPayload = {
          title: 'Promise Recorded',
          description: `Your non-aggression pledge to ${updatedTarget.name} will last ${promiseTerms.duration} turns.`,
        };
        newsItem = {
          text: `${player.name} publicly pledges restraint toward ${updatedTarget.name}, easing regional tensions.`,
          priority: 'info',
        };
        log(`${player.name} made a non-aggression promise to ${updatedTarget.name}.`);
        break;
      }
      case 'verify-promise': {
        if (!updatedTarget) break;
        const reason = `Promise verification with ${updatedTarget.name}`;
        const activeTargetPromise = updatedTarget.diplomaticPromises?.find(
          (p) => p.toNationId === updatedPlayer.id && !p.fulfilled && !p.broken
        );
        const activePlayerPromise = updatedPlayer.diplomaticPromises?.find(
          (p) => p.toNationId === updatedTarget.id && !p.fulfilled && !p.broken
        );

        let description = '';
        let priority: 'info' | 'important' | 'critical' = 'info';

        if (activeTargetPromise && currentTurn > activeTargetPromise.expiresTurn) {
          updatedTarget = breakPromise(updatedTarget, activeTargetPromise.id, currentTurn);
          updatedPlayer = modifyTrust(
            updatedPlayer,
            updatedTarget.id,
            -8,
            `Verified broken promise by ${updatedTarget.name}`,
            currentTurn
          );
          updatedPlayer = modifyRelationship(
            updatedPlayer,
            updatedTarget.id,
            -6,
            `Verified broken promise by ${updatedTarget.name}`,
            currentTurn
          );
          description = `${updatedTarget.name} failed to uphold their promise. Trust erodes sharply.`;
          priority = 'critical';
          log(`${player.name} confirmed ${updatedTarget.name} broke a promise.`);
        } else {
          if (activeTargetPromise && currentTurn >= activeTargetPromise.expiresTurn) {
            updatedTarget = fulfillPromise(updatedTarget, activeTargetPromise.id, currentTurn);
            updatedPlayer = modifyTrust(updatedPlayer, updatedTarget.id, 6, reason, currentTurn);
            updatedPlayer = modifyRelationship(updatedPlayer, updatedTarget.id, 4, reason, currentTurn);
            description = `${updatedTarget.name} fulfilled their promise.`;
            priority = 'important';
            log(`${player.name} verified that ${updatedTarget.name} kept their promise.`);
          } else if (activeTargetPromise) {
            updatedPlayer = modifyTrust(updatedPlayer, updatedTarget.id, 2, reason, currentTurn);
            updatedTarget = modifyRelationship(updatedTarget, updatedPlayer.id, 2, reason, currentTurn);
            description = `${updatedTarget.name} reaffirmed their ongoing promise.`;
            priority = 'info';
            log(`${player.name} checked on an active promise with ${updatedTarget.name}.`);
          }

          if (activePlayerPromise && currentTurn >= activePlayerPromise.expiresTurn) {
            updatedPlayer = fulfillPromise(updatedPlayer, activePlayerPromise.id, currentTurn);
            updatedTarget = modifyTrust(updatedTarget, updatedPlayer.id, 5, reason, currentTurn);
            updatedTarget = modifyRelationship(updatedTarget, updatedPlayer.id, 3, reason, currentTurn);
            description = description
              ? `${description} Your commitment is now logged as fulfilled.`
              : 'Your commitment is now logged as fulfilled.';
            priority = priority === 'critical' ? 'critical' : 'important';
            log(`${player.name} finalized a promise made to ${updatedTarget.name}.`);
          }
        }

        if (!description) {
          description = 'No new promise updates were recorded.';
          log(`${player.name} found no change while verifying promises with ${updatedTarget.name}.`);
        }

        toastPayload = {
          title: 'Promise Verification',
          description,
        };
        newsItem = {
          text: `${player.name} audits diplomatic promises with ${updatedTarget.name}. ${description}`,
          priority,
        };
        break;
      }
      case 'apologize': {
        if (!updatedTarget) break;
        const { apologizer, victim, resolvedGrievanceCount } = resolveGrievancesWithApology(
          updatedPlayer,
          updatedTarget,
          currentTurn
        );
        updatedPlayer = apologizer;
        updatedTarget = victim;

        const targetTrust = getTrust(updatedTarget, updatedPlayer.id);
        const resolutionText =
          resolvedGrievanceCount > 0
            ? `Resolved ${resolvedGrievanceCount} grievance(s).`
            : 'No outstanding grievances remained, but goodwill improved.';
        toastPayload = {
          title: 'Formal Apology Issued',
          description: `${resolutionText} ${updatedTarget.name}'s trust in you is now ${targetTrust}.`,
        };
        newsItem = {
          text: `${player.name} issued a formal apology to ${updatedTarget.name}. ${resolutionText}`,
          priority: resolvedGrievanceCount > 0 ? 'important' : 'info',
        };
        log(`${player.name} apologized to ${updatedTarget.name}, ${resolutionText}`);
        break;
      }
      case 'reparations': {
        if (!updatedTarget) break;
        const { payer, recipient, resolvedGrievanceCount } = resolveGrievancesWithReparations(
          updatedPlayer,
          updatedTarget,
          currentTurn,
          'major'
        );
        updatedPlayer = payer;
        updatedTarget = recipient;

        const favorBalance = getFavors(updatedPlayer, updatedTarget.id);
        const resolutionText =
          resolvedGrievanceCount > 0
            ? `Resolved ${resolvedGrievanceCount} grievance(s) through compensation.`
            : 'Strengthened relations through proactive compensation.';
        toastPayload = {
          title: 'Reparations Delivered',
          description: `${resolutionText} ${updatedTarget.name} now owes you ${favorBalance} favor(s).`,
        };
        newsItem = {
          text: `${player.name} offers reparations to ${updatedTarget.name}. ${resolutionText}`,
          priority: 'important',
        };
        log(`${player.name} provided reparations to ${updatedTarget.name}. ${resolutionText}`);
        break;
      }
      case 'propose-resolution': {
        if (action.dipCost && !trySpendDip(action.dipCost, 'propose-resolution')) {
          return;
        }

        const council = ensureCouncil();
        const resolutionType = targetNation ? 'sanction' : 'humanitarian-aid';
        const resolutionTitle = targetNation
          ? `Emergency Action on ${targetNation.name}`
          : 'Global Stability Resolution';
        const resolutionDescription = targetNation
          ? `${player.name} urges the council to impose sanctions on ${targetNation.name} for destabilizing actions.`
          : `${player.name} calls upon the council to coordinate humanitarian relief and monitoring to ease global tensions.`;

        const resolutionParameters = targetNation
          ? {
              severity: 60,
              duration: 5,
              penalties: ['Coordinated economic sanctions enforced by council members.'],
            }
          : {
              duration: 4,
              rewards: ['Shared humanitarian aid resources to stabilize the crisis.'],
              conditions: ['Report progress back to the council at the next session.'],
            };

        const resolutionResult = createResolution(
          council,
          resolutionType,
          resolutionTitle,
          resolutionDescription,
          updatedPlayer.id,
          currentTurn,
          resolutionParameters,
          targetNation?.id
        );

        const phase3 = ensurePhase3State();
        const updatedPhase3 = {
          ...phase3,
          internationalCouncil: resolutionResult.council,
          phase3Enabled: true,
        };
        persistPhase3State(updatedPhase3);

        toastPayload = {
          title: 'Resolution Proposed',
          description: `Your resolution "${resolutionResult.resolution.title}" is now before the council.`,
        };
        newsItem = {
          text: `${player.name} tables "${resolutionResult.resolution.title}" for immediate council deliberation.`,
          priority: 'important',
        };
        log(`${player.name} proposed the resolution "${resolutionResult.resolution.title}" to the International Council.`);
        break;
      }
      case 'call-session': {
        if (action.dipCost && !trySpendDip(action.dipCost, 'call-session')) {
          return;
        }

        let council = ensureCouncil();
        council = removeExpiredMembers(council, currentTurn);
        council = processExpiredVotes(council, currentTurn);
        council = addObserver(council, updatedPlayer.id);
        const acceleratedCouncil = {
          ...council,
          nextMeetingTurn: Math.min(council.nextMeetingTurn, currentTurn),
        };

        const phase3 = ensurePhase3State();
        const updatedPhase3 = {
          ...phase3,
          internationalCouncil: acceleratedCouncil,
          phase3Enabled: true,
        };
        persistPhase3State(updatedPhase3);

        toastPayload = {
          title: 'Emergency Session Convened',
          description: 'The council is assembling immediately to address your emergency motion.',
        };
        newsItem = {
          text: `${player.name} forces an emergency sitting of the International Council, accelerating the next meeting.`,
          priority: 'critical',
        };
        log(`${player.name} called an emergency session of the International Council.`);
        break;
      }
      case 'defcon-deescalate': {
        if (action.dipCost && !trySpendDip(action.dipCost, 'defcon-deescalate')) {
          return;
        }

        const defconBefore = GameStateManager.getDefcon();
        const reason = `${player.name} coordinates a global de-escalation campaign`;
        const defconChanged = handleDefconChange(1, reason, 'player', {
          onAudioTransition: AudioSys.handleDefconTransition,
          onLog: log,
          onNewsItem: addNewsItem,
          onUpdateDisplay: updateDisplay,
          onShowModal: setDefconChangeEvent,
        });

        if (!defconChanged) {
          toastPayload = {
            title: 'DEFCON unchanged',
            description: 'Diplomatic pressure failed to move the global alert level.',
            variant: 'destructive',
          };
          break;
        }

        const newDefcon = GameStateManager.getDefcon();
        toastPayload = {
          title: 'DEFCON De-escalated',
          description: `Global alert level relaxed from DEFCON ${defconBefore} to DEFCON ${newDefcon}.`,
        };
        newsItem = {
          text: `${player.name} orchestrates wide-reaching assurances, easing the world to DEFCON ${newDefcon}.`,
          priority: 'important',
        };
        log(`${player.name} leveraged diplomatic channels to shift DEFCON from ${defconBefore} to ${newDefcon}.`);
        break;
      }
      case 'defcon-escalate': {
        if (!updatedTarget) break;
        if (action.dipCost && !trySpendDip(action.dipCost, 'defcon-escalate', updatedTarget.id)) {
          return;
        }

        const defconBefore = GameStateManager.getDefcon();
        if (!canPerformAction('escalate', defconBefore)) {
          toastPayload = {
            title: 'DEFCON unchanged',
            description: 'Global readiness cannot climb any higher.',
            variant: 'destructive',
          };
          break;
        }

        const reason = `${player.name} antagonizes ${updatedTarget.name}, forcing heightened readiness`;
        const defconChanged = handleDefconChange(-1, reason, 'player', {
          onAudioTransition: AudioSys.handleDefconTransition,
          onLog: log,
          onNewsItem: addNewsItem,
          onUpdateDisplay: updateDisplay,
          onShowModal: setDefconChangeEvent,
        });

        if (!defconChanged) {
          toastPayload = {
            title: 'DEFCON unchanged',
            description: 'The world resists your attempts to inflame tensions.',
            variant: 'destructive',
          };
          break;
        }

        updatedPlayer = modifyTrust(updatedPlayer, updatedTarget.id, -4, reason, currentTurn);
        updatedTarget = modifyTrust(updatedTarget, updatedPlayer.id, -6, reason, currentTurn);
        updatedPlayer = modifyRelationship(updatedPlayer, updatedTarget.id, -6, reason, currentTurn);
        updatedTarget = modifyRelationship(updatedTarget, updatedPlayer.id, -8, reason, currentTurn);
        adjustThreat(updatedPlayer, updatedTarget.id, 12);
        adjustThreat(updatedTarget, updatedPlayer.id, 25);
        updatedPlayer = { ...updatedPlayer, lastAggressiveAction: currentTurn };

        const newDefcon = GameStateManager.getDefcon();
        toastPayload = {
          title: 'DEFCON Escalated',
          description: `Global alert level spiked from DEFCON ${defconBefore} to DEFCON ${newDefcon}.`,
          variant: 'destructive',
        };
        newsItem = {
          text: `${player.name} deliberately provokes ${updatedTarget.name}, plunging the world toward DEFCON ${newDefcon}.`,
          priority: 'critical',
        };
        log(`${player.name} escalated tensions with ${updatedTarget.name}, moving DEFCON from ${defconBefore} to ${newDefcon}.`);
        break;
      }
      case 'back-channel': {
        if (!updatedTarget) break;
        const reason = `Back-channel talks with ${updatedTarget.name}`;
        updatedPlayer = modifyTrust(updatedPlayer, updatedTarget.id, 2, reason, currentTurn);
        updatedTarget = modifyTrust(updatedTarget, updatedPlayer.id, 3, reason, currentTurn);
        updatedPlayer = modifyRelationship(updatedPlayer, updatedTarget.id, 2, reason, currentTurn);
        updatedTarget = modifyRelationship(updatedTarget, updatedPlayer.id, 3, reason, currentTurn);

        toastPayload = {
          title: 'Back-Channel Opened',
          description: `Confidential line with ${updatedTarget.name} established. Trust improved on both sides.`,
        };
        newsItem = {
          text: `${player.name} establishes discreet communications with ${updatedTarget.name}.`,
          priority: 'info',
        };
        log(`${player.name} initiated back-channel communications with ${updatedTarget.name}.`);
        break;
      }
      default:
        break;
    }

    const updatedNations = nations.map((nation) => {
      if (nation.id === updatedPlayer.id) {
        return updatedPlayer;
      }
      if (updatedTarget && nation.id === updatedTarget.id) {
        return updatedTarget;
      }
      return nation;
    });

    nations = updatedNations;
    GameStateManager.setNations(updatedNations);
    PlayerManager.setNations(updatedNations);

    if (newsItem) {
      window.__gameAddNewsItem?.('diplomatic', newsItem.text, newsItem.priority);
    }

    if (toastPayload) {
      toast(toastPayload);
    }

    updateDisplay();
    consumeAction();
    setShowEnhancedDiplomacy(false);
  }, [toast, updateDisplay, consumeAction, setDiplomacyPhase3State]);

  const handleCivStyleDiplomacyAction = useCallback((actionId: string, response?: 'accept' | 'support' | 'reject') => {
    const player = PlayerManager.get();
    if (!player || !civStyleDiplomacyTarget) return;

    const target = getNationById(nations, civStyleDiplomacyTarget);
    if (!target) return;

    const currentTurn = S.turn;
    let updatedPlayer: Nation = player;
    let updatedTarget: Nation = target;
    let newsItem: { text: string; priority: 'info' | 'important' | 'critical' } | null = null;
    let toastPayload: { title: string; description: string; variant?: 'default' | 'destructive' | 'success' } | null = null;

    // Handle different diplomatic actions
    switch (actionId) {
      case 'research-collaboration': {
        const cost = response === 'support' ? 75 : 60;
        const playerInfluence = player.diplomaticInfluence?.currentInfluence || 0;

        if (playerInfluence < cost) {
          toast({
            title: 'Insufficient Influence',
            description: `You need ${cost} Influence for this action.`,
            variant: 'destructive',
          });
          return;
        }

        // Deduct influence
        updatedPlayer = {
          ...updatedPlayer,
          diplomaticInfluence: {
            ...updatedPlayer.diplomaticInfluence,
            currentInfluence: playerInfluence - cost,
            points: (updatedPlayer.diplomaticInfluence?.points || 0) - cost,
          },
        } as Nation;

        // Apply effects
        updatedPlayer = modifyRelationship(updatedPlayer, target.id, response === 'support' ? 12 : 5, 'Research collaboration', currentTurn);
        updatedTarget = modifyRelationship(updatedTarget, player.id, response === 'support' ? 12 : 5, 'Research collaboration', currentTurn);

        toastPayload = {
          title: 'Research Collaboration Started',
          description: `You and ${target.name} are now collaborating on research.`,
          variant: 'success',
        };
        newsItem = {
          text: `${player.name} initiates research collaboration with ${target.name}.`,
          priority: 'important',
        };
        break;
      }
      case 'military-aid': {
        const cost = 60;
        const playerInfluence = player.diplomaticInfluence?.currentInfluence || 0;

        if (playerInfluence < cost) {
          toast({
            title: 'Insufficient Influence',
            description: `You need ${cost} Influence for this action.`,
            variant: 'destructive',
          });
          return;
        }

        updatedPlayer = {
          ...updatedPlayer,
          diplomaticInfluence: {
            ...updatedPlayer.diplomaticInfluence,
            currentInfluence: playerInfluence - cost,
            points: (updatedPlayer.diplomaticInfluence?.points || 0) - cost,
          },
        } as Nation;

        updatedPlayer = modifyRelationship(updatedPlayer, target.id, 8, 'Military aid', currentTurn);
        updatedTarget = modifyRelationship(updatedTarget, player.id, 8, 'Military aid', currentTurn);

        toastPayload = {
          title: 'Military Aid Provided',
          description: `${target.name} receives military support.`,
          variant: 'success',
        };
        newsItem = {
          text: `${player.name} provides military aid to ${target.name}.`,
          priority: 'important',
        };
        break;
      }
      case 'economic-support': {
        const cost = 50;
        const playerInfluence = player.diplomaticInfluence?.currentInfluence || 0;

        if (playerInfluence < cost) {
          toast({
            title: 'Insufficient Influence',
            description: `You need ${cost} Influence for this action.`,
            variant: 'destructive',
          });
          return;
        }

        updatedPlayer = {
          ...updatedPlayer,
          diplomaticInfluence: {
            ...updatedPlayer.diplomaticInfluence,
            currentInfluence: playerInfluence - cost,
            points: (updatedPlayer.diplomaticInfluence?.points || 0) - cost,
          },
        } as Nation;

        updatedPlayer = modifyRelationship(updatedPlayer, target.id, 10, 'Economic support', currentTurn);
        updatedTarget = modifyRelationship(updatedTarget, player.id, 10, 'Economic support', currentTurn);

        toastPayload = {
          title: 'Economic Support Provided',
          description: `${target.name} receives financial aid.`,
          variant: 'success',
        };
        newsItem = {
          text: `${player.name} extends economic support to ${target.name}.`,
          priority: 'important',
        };
        break;
      }
      case 'cultural-exchange': {
        const cost = 40;
        const playerInfluence = player.diplomaticInfluence?.currentInfluence || 0;

        if (playerInfluence < cost) {
          toast({
            title: 'Insufficient Influence',
            description: `You need ${cost} Influence for this action.`,
            variant: 'destructive',
          });
          return;
        }

        updatedPlayer = {
          ...updatedPlayer,
          diplomaticInfluence: {
            ...updatedPlayer.diplomaticInfluence,
            currentInfluence: playerInfluence - cost,
            points: (updatedPlayer.diplomaticInfluence?.points || 0) - cost,
          },
        } as Nation;

        updatedPlayer = modifyRelationship(updatedPlayer, target.id, 15, 'Cultural exchange', currentTurn);
        updatedTarget = modifyRelationship(updatedTarget, player.id, 15, 'Cultural exchange', currentTurn);

        toastPayload = {
          title: 'Cultural Exchange Established',
          description: `Cultural programs with ${target.name} improve relations.`,
          variant: 'success',
        };
        newsItem = {
          text: `${player.name} and ${target.name} establish cultural exchange programs.`,
          priority: 'info',
        };
        break;
      }
      case 'reconciliation': {
        const cost = 60;
        const playerInfluence = player.diplomaticInfluence?.currentInfluence || 0;

        if (playerInfluence < cost) {
          toast({
            title: 'Insufficient Influence',
            description: `You need ${cost} Influence for this action.`,
            variant: 'destructive',
          });
          return;
        }

        updatedPlayer = {
          ...updatedPlayer,
          diplomaticInfluence: {
            ...updatedPlayer.diplomaticInfluence,
            currentInfluence: playerInfluence - cost,
            points: (updatedPlayer.diplomaticInfluence?.points || 0) - cost,
          },
        } as Nation;

        updatedPlayer = modifyRelationship(updatedPlayer, target.id, 20, 'Reconciliation', currentTurn);
        updatedTarget = modifyRelationship(updatedTarget, player.id, 20, 'Reconciliation', currentTurn);

        toastPayload = {
          title: 'Reconciliation Successful',
          description: `Relations with ${target.name} significantly improved.`,
          variant: 'success',
        };
        newsItem = {
          text: `${player.name} and ${target.name} reconcile past grievances.`,
          priority: 'important',
        };
        break;
      }
      case 'hinder-research': {
        const cost = 80;
        const playerInfluence = player.diplomaticInfluence?.currentInfluence || 0;

        if (playerInfluence < cost) {
          toast({
            title: 'Insufficient Influence',
            description: `You need ${cost} Influence for this action.`,
            variant: 'destructive',
          });
          return;
        }

        updatedPlayer = {
          ...updatedPlayer,
          diplomaticInfluence: {
            ...updatedPlayer.diplomaticInfluence,
            currentInfluence: playerInfluence - cost,
            points: (updatedPlayer.diplomaticInfluence?.points || 0) - cost,
          },
        } as Nation;

        updatedPlayer = modifyRelationship(updatedPlayer, target.id, -15, 'Research sanctions', currentTurn);
        updatedTarget = modifyRelationship(updatedTarget, player.id, -15, 'Research sanctions', currentTurn);

        toastPayload = {
          title: 'Sanctions Imposed',
          description: `${target.name}'s research is being hindered.`,
          variant: 'default',
        };
        newsItem = {
          text: `${player.name} imposes research sanctions on ${target.name}.`,
          priority: 'important',
        };
        break;
      }
      case 'hinder-production': {
        const cost = 80;
        const playerInfluence = player.diplomaticInfluence?.currentInfluence || 0;

        if (playerInfluence < cost) {
          toast({
            title: 'Insufficient Influence',
            description: `You need ${cost} Influence for this action.`,
            variant: 'destructive',
          });
          return;
        }

        updatedPlayer = {
          ...updatedPlayer,
          diplomaticInfluence: {
            ...updatedPlayer.diplomaticInfluence,
            currentInfluence: playerInfluence - cost,
            points: (updatedPlayer.diplomaticInfluence?.points || 0) - cost,
          },
        } as Nation;

        updatedPlayer = modifyRelationship(updatedPlayer, target.id, -15, 'Production sanctions', currentTurn);
        updatedTarget = modifyRelationship(updatedTarget, player.id, -15, 'Production sanctions', currentTurn);

        toastPayload = {
          title: 'Sanctions Imposed',
          description: `${target.name}'s production is being hindered.`,
          variant: 'default',
        };
        newsItem = {
          text: `${player.name} imposes production sanctions on ${target.name}.`,
          priority: 'important',
        };
        break;
      }
      case 'denounce': {
        const cost = 60;
        const playerInfluence = player.diplomaticInfluence?.currentInfluence || 0;

        if (playerInfluence < cost) {
          toast({
            title: 'Insufficient Influence',
            description: `You need ${cost} Influence for this action.`,
            variant: 'destructive',
          });
          return;
        }

        updatedPlayer = {
          ...updatedPlayer,
          diplomaticInfluence: {
            ...updatedPlayer.diplomaticInfluence,
            currentInfluence: playerInfluence - cost,
            points: (updatedPlayer.diplomaticInfluence?.points || 0) - cost,
          },
        } as Nation;

        updatedPlayer = modifyRelationship(updatedPlayer, target.id, -20, 'Public denunciation', currentTurn);
        updatedTarget = modifyRelationship(updatedTarget, player.id, -20, 'Public denunciation', currentTurn);

        toastPayload = {
          title: 'Denunciation Successful',
          description: `You publicly condemned ${target.name}.`,
          variant: 'default',
        };
        newsItem = {
          text: `${player.name} publicly denounces ${target.name} on the world stage.`,
          priority: 'critical',
        };
        break;
      }
      case 'steal-tech': {
        const cost = 100;
        const playerInfluence = player.diplomaticInfluence?.currentInfluence || 0;

        if (playerInfluence < cost) {
          toast({
            title: 'Insufficient Influence',
            description: `You need ${cost} Influence for this action.`,
            variant: 'destructive',
          });
          return;
        }

        updatedPlayer = {
          ...updatedPlayer,
          diplomaticInfluence: {
            ...updatedPlayer.diplomaticInfluence,
            currentInfluence: playerInfluence - cost,
            points: (updatedPlayer.diplomaticInfluence?.points || 0) - cost,
          },
        } as Nation;

        // 30% chance of detection
        const detected = Math.random() < 0.3;
        if (detected) {
          updatedPlayer = modifyRelationship(updatedPlayer, target.id, -30, 'Espionage detected', currentTurn);
          updatedTarget = modifyRelationship(updatedTarget, player.id, -30, 'Espionage detected', currentTurn);

          toastPayload = {
            title: 'Espionage Detected!',
            description: `${target.name} discovered your spy operation. Relations severely damaged.`,
            variant: 'destructive',
          };
          newsItem = {
            text: `${target.name} catches ${player.name} attempting to steal technology!`,
            priority: 'critical',
          };
        } else {
          toastPayload = {
            title: 'Technology Stolen',
            description: `Successfully acquired technology from ${target.name} without detection.`,
            variant: 'success',
          };
        }
        break;
      }
      case 'sabotage': {
        const cost = 90;
        const playerInfluence = player.diplomaticInfluence?.currentInfluence || 0;

        if (playerInfluence < cost) {
          toast({
            title: 'Insufficient Influence',
            description: `You need ${cost} Influence for this action.`,
            variant: 'destructive',
          });
          return;
        }

        updatedPlayer = {
          ...updatedPlayer,
          diplomaticInfluence: {
            ...updatedPlayer.diplomaticInfluence,
            currentInfluence: playerInfluence - cost,
            points: (updatedPlayer.diplomaticInfluence?.points || 0) - cost,
          },
        } as Nation;

        // 40% chance of detection
        const detected = Math.random() < 0.4;
        if (detected) {
          updatedPlayer = modifyRelationship(updatedPlayer, target.id, -35, 'Sabotage detected', currentTurn);
          updatedTarget = modifyRelationship(updatedTarget, player.id, -35, 'Sabotage detected', currentTurn);

          toastPayload = {
            title: 'Sabotage Detected!',
            description: `${target.name} discovered your sabotage operation. Relations severely damaged.`,
            variant: 'destructive',
          };
          newsItem = {
            text: `${target.name} catches ${player.name} attempting sabotage!`,
            priority: 'critical',
          };
        } else {
          toastPayload = {
            title: 'Sabotage Successful',
            description: `Successfully sabotaged ${target.name}'s production without detection.`,
            variant: 'success',
          };
        }
        break;
      }
      default:
        toast({
          title: 'Action Not Implemented',
          description: `The action "${actionId}" is not yet implemented.`,
          variant: 'destructive',
        });
        return;
    }

    // Update nations
    const updatedNations = nations.map(nation => {
      if (nation.id === player.id) return updatedPlayer;
      if (nation.id === target.id) return updatedTarget;
      return nation;
    });

    nations = updatedNations;
    GameStateManager.setNations(updatedNations);
    PlayerManager.setNations(updatedNations);

    if (newsItem) {
      window.__gameAddNewsItem?.('diplomatic', newsItem.text, newsItem.priority);
    }

    if (toastPayload) {
      toast(toastPayload);
    }

    updateDisplay();
    consumeAction();
    setShowCivStyleDiplomacy(false);
    setCivStyleDiplomacyTarget(null);
  }, [toast, updateDisplay, consumeAction, civStyleDiplomacyTarget, getNationById]);

  const handlePhase2Operation = useCallback((operation: Phase2Operation) => {
    if (!greatOldOnesState || !phase2State) return;

    const { type, cost } = operation;

    // Check if resources are available
    for (const [resource, amount] of Object.entries(cost)) {
      if (resource === 'sanityFragments' && greatOldOnesState.resources.sanityFragments < amount) {
        toast({
          title: 'Insufficient Resources',
          description: `Need ${amount} Sanity Fragments`,
          variant: 'destructive',
        });
        return;
      }
      if (resource === 'eldritchPower' && greatOldOnesState.resources.eldritchPower < amount) {
        toast({
          title: 'Insufficient Resources',
          description: `Need ${amount} Eldritch Power`,
          variant: 'destructive',
        });
        return;
      }
    }

    // Deduct resources
    const updatedState = { ...greatOldOnesState };
    if (cost.sanityFragments) {
      updatedState.resources.sanityFragments -= cost.sanityFragments;
    }
    if (cost.eldritchPower) {
      updatedState.resources.eldritchPower -= cost.eldritchPower;
    }

    // Apply operation effects
    let title = '';
    let description = '';
    let logMessage = '';

    switch (type) {
      case 'summon-entity':
        title = 'Entity Summoned';
        description = 'A bound entity now serves the Order';
        logMessage = 'Summoned an eldritch entity through profane rituals';
        // Note: Full entity summoning would require adding to summonedEntities array
        break;
      case 'terror-campaign':
        title = 'Terror Campaign Launched';
        description = 'Fear spreads through public manifestations';
        logMessage = 'Initiated terror campaign using bound entities';
        if (phase2State.domination) {
          phase2State.domination.fearLevel = Math.min(100, phase2State.domination.fearLevel + 10);
        }
        break;
      case 'military-assault':
        title = 'Military Assault';
        description = 'Entities engage conventional forces in direct combat';
        logMessage = 'Commanded entities to assault military targets';
        break;
      case 'awakening-ritual':
        title = 'Awakening Ritual';
        description = 'Progress made toward awakening a Great Old One';
        logMessage = 'Performed awakening ritual at aligned sites';
        break;
      case 'infiltrate-institution':
        title = 'Institution Infiltrated';
        description = 'Influence node established';
        logMessage = 'Infiltrated a key institution with cultist agents';
        break;
      case 'launch-memetic-agent':
        title = 'Memetic Agent Deployed';
        description = 'Idea virus spreading through population';
        logMessage = 'Launched memetic campaign to spread eldritch concepts';
        break;
      case 'dream-invasion':
        title = 'Dream Invasion';
        description = 'Mass nightmares afflict target region';
        logMessage = 'Conducted dream invasion ritual, spreading madness';
        updatedState.veil.integrity = Math.max(0, updatedState.veil.integrity - 2);
        break;
      case 'activate-sleeper-cells':
        title = 'Sleeper Cells Activated';
        description = 'Coordinated network-wide operation executed';
        logMessage = 'Activated sleeper cells across influence network';
        break;
      case 'establish-program':
        title = 'Enlightenment Program Established';
        description = 'New program recruiting voluntary converts';
        logMessage = 'Established enlightenment program for willing initiates';
        break;
      case 'cultural-movement':
        title = 'Cultural Movement Started';
        description = 'Philosophical/artistic movement spreading ideology';
        logMessage = 'Launched cultural movement to normalize eldritch philosophy';
        break;
      case 'celebrity-endorsement':
        title = 'Celebrity Endorsement Secured';
        description = 'High-profile figure now promotes the Order';
        logMessage = 'Recruited celebrity endorser for mainstream appeal';
        if (phase2State.convergence) {
          phase2State.convergence.voluntaryConversionRate += 5;
        }
        break;
      case 'redemption-act':
        title = 'Redemption Act';
        description = 'Attempting to redeem past betrayals';
        logMessage = 'Performed act of redemption to restore trust';
        if (phase2State.convergence) {
          phase2State.convergence.trueIntentionsMeter.moralityScore += 10;
        }
        break;
      default:
        title = 'Operation Complete';
        description = `Executed ${type}`;
        logMessage = `Completed Phase 2 operation: ${type}`;
    }

    // Update states
    setGreatOldOnesState(updatedState);
    setPhase2State({ ...phase2State });
    GameStateManager.setGreatOldOnes(updatedState);

    // Show feedback
    toast({ title, description });
    log(logMessage, 'occult');
    if (window.__gameAddNewsItem) {
      window.__gameAddNewsItem('occult', logMessage, 'important');
    }

    updateDisplay();
  }, [greatOldOnesState, phase2State, toast, updateDisplay]);

  // Show pending AI proposals when phase transitions to player
  useEffect(() => {
    if (S.phase === 'PLAYER' && pendingAIProposals.length > 0 && !activeDiplomacyProposal) {
      // Show the first pending proposal
      const nextProposal = pendingAIProposals[0];
      setActiveDiplomacyProposal(nextProposal);
      setPendingAIProposals(prev => prev.slice(1));
    }
  }, [S.phase, pendingAIProposals, activeDiplomacyProposal]);

  const handleEndTurn = useCallback(() => {
    AudioSys.playSFX('endturn');
    endTurn();
  }, []);

  useEffect(() => {
    if (!isGameStarted) {
      return;
    }

    const overlayCanvas = globeSceneRef.current?.overlayCanvas;
    if (overlayCanvas) {
      canvas = overlayCanvas;
      ctx = canvas.getContext('2d')!;

      resizeCanvas();

      const handleWindowResize = () => {
        resizeCanvas();
      };

      if (typeof window !== 'undefined') {
        window.addEventListener('resize', handleWindowResize);
      }

      // Setup mouse and touch controls
      let isDragging = false;
      let dragButton: number | null = null;
      let dragStart = { x: 0, y: 0 };
      let touching = false;
      let touchStart = { x: 0, y: 0 };
      let zoomedIn = false;
      type PointerMode = 'none' | 'map-pan' | 'unit-drag';
      let pointerMode: PointerMode = 'none';
      let dragSourceTerritoryId: string | null = null;
      let dragArmiesCount = 0;
      let dragTargetId: string | null = null;
      let lastHoverId: string | null = null;

      const getTerritories = () => territoryListRef.current ?? [];

      const updateHover = (territoryId: string | null) => {
        if (lastHoverId !== territoryId) {
          lastHoverId = territoryId;
          setHoveredTerritoryId(territoryId);
        }
      };

      const resetUnitDragState = () => {
        dragSourceTerritoryId = null;
        dragArmiesCount = 0;
        dragTargetId = null;
        pointerMode = 'none';
        setDraggingArmy(null);
        setDraggingArmyPosition(null);
        setDragTargetTerritoryId(null);
        updateHover(null);
      };

      const isBoundedFlatProjection = () => currentMapStyle === 'flat-realistic';
      const minZoom = isBoundedFlatProjection() ? 1 : 0.5;

      const clampLatitude = () => {
        const maxLat = 85;
        const minLat = -85;
        const height = H || canvas.height || 0;
        if (!height) return;

        const zoomLevel = Math.max(minZoom, Math.min(3, cam.targetZoom));
        const camYForLat = (lat: number) =>
          height / 2 - (height * zoomLevel * (90 - lat)) / 180;

        const northCamY = camYForLat(maxLat);
        const southCamY = camYForLat(minLat);
        const minCamY = Math.min(northCamY, southCamY);
        const maxCamY = Math.max(northCamY, southCamY);
        cam.y = Math.min(Math.max(cam.y, minCamY), maxCamY);
      };

      const clampPanBounds = () => {
        clampLatitude();

        if (!isBoundedFlatProjection()) {
          return;
        }

        const width = W || canvas?.width || 0;
        if (!width) {
          return;
        }

        const zoomLevel = Math.max(minZoom, Math.min(3, cam.targetZoom));
        const scaledWidth = width * zoomLevel;

        if (scaledWidth <= width) {
          cam.x = (width - scaledWidth) / 2;
          return;
        }

        const minX = width - scaledWidth;
        const maxX = 0;
        cam.x = Math.min(Math.max(cam.x, minX), maxX);
      };

      const applyZoomToPoint = (
        requestedZoom: number,
        focalX: number,
        focalY: number,
        focalProjection: ReturnType<typeof projectLocal>,
      ) => {
        const prevZoom = cam.zoom;
        const clampedZoom = Math.max(minZoom, Math.min(3, requestedZoom));
        const zoomScale = prevZoom > 0 ? clampedZoom / prevZoom : 1;

        cam.targetZoom = clampedZoom;
        cam.zoom = clampedZoom;

        if (isBoundedFlatProjection() && Math.abs(clampedZoom - minZoom) < 0.01) {
          cam.x = (W - W * cam.zoom) / 2;
          cam.y = (H - H * cam.zoom) / 2;
        } else if (focalProjection.visible) {
          cam.x = focalX - (focalProjection.x - cam.x) * zoomScale;
          cam.y = focalY - (focalProjection.y - cam.y) * zoomScale;
        } else {
          cam.x = W / 2 - (W / 2 - cam.x) * zoomScale;
          cam.y = H / 2 - (H / 2 - cam.y) * zoomScale;
        }

        clampPanBounds();
      };

      let activePointerId: number | null = null;

      const handlePointerUp = (e: PointerEvent) => {
        if (canvas && activePointerId !== null && canvas.hasPointerCapture(activePointerId)) {
          canvas.releasePointerCapture(activePointerId);
        }
        activePointerId = null;

        if (pointerMode === 'unit-drag') {
          const player = PlayerManager.get();
          const territories = getTerritories();
          const source = territories.find(entry => entry.id === dragSourceTerritoryId) ?? null;
          const target = dragTargetId ? territories.find(entry => entry.id === dragTargetId) ?? null : null;

          if (player && source && source.controllingNationId === player.id) {
            const maxAvailable = Math.max(1, source.armies - 1);
            const armiesToSend = Math.min(maxAvailable, Math.max(1, dragArmiesCount));

            if (armiesToSend < 1) {
              AudioSys.playSFX('error');
              toast({ title: 'Cannot move armies', description: 'At least one army must remain behind.', variant: 'destructive' });
            } else if (target && source.neighbors.includes(target.id)) {
              if (!target.controllingNationId || target.controllingNationId === player.id) {
                const result = moveArmiesRef.current?.(source.id, target.id, armiesToSend);
                if (result?.success) {
                  AudioSys.playSFX('success');
                  toast({
                    title: 'Armies redeployed',
                    description: `Moved ${armiesToSend} armies from ${source.name} to ${target.name}.`,
                  });
                  setSelectedTerritoryId(target.id);
                } else if (result && !result.success) {
                  AudioSys.playSFX('error');
                  toast({ title: 'Cannot move armies', description: result.reason, variant: 'destructive' });
                  setSelectedTerritoryId(source.id);
                }
              } else {
                const result = resolveBorderConflictRef.current?.(source.id, target.id, armiesToSend);
                if (result?.success) {
                  AudioSys.playSFX('success');
                  toast({
                    title: 'Assault initiated',
                    description: `Launching ${armiesToSend} armies into ${target.name}.`,
                  });
                  setSelectedTerritoryId(null);
                } else if (result && !result.success) {
                  AudioSys.playSFX('error');
                  toast({ title: 'Cannot launch attack', description: result.reason, variant: 'destructive' });
                  setSelectedTerritoryId(source.id);
                }
              }
            } else if (dragTargetId) {
              AudioSys.playSFX('error');
              toast({ title: 'Invalid target', description: 'Armies can only move to adjacent territories.', variant: 'destructive' });
              setSelectedTerritoryId(source.id);
            }
          }

          resetUnitDragState();
        }

        isDragging = false;
        dragButton = null;
        if (pointerMode !== 'unit-drag') {
          pointerMode = 'none';
        }
      };

      const handlePointerDown = (e: PointerEvent) => {
        if (e.button !== 0 && e.button !== 2) return;

        const rect = canvas?.getBoundingClientRect();
        const territories = getTerritories();
        const player = PlayerManager.get();

        if (
          e.button === 0 &&
          !S.gameOver &&
          rect &&
          player &&
          territories.length > 0
        ) {
          const mx = e.clientX - rect.left;
          const my = e.clientY - rect.top;

          for (const territory of territories) {
            const { x: tx, y: ty, visible } = projectLocal(territory.anchorLon, territory.anchorLat);
            if (!visible) {
              continue;
            }
            const dist = Math.hypot(mx - tx, my - ty);
            if (dist < 25 && territory.controllingNationId === player.id && territory.armies > 1) {
              pointerMode = 'unit-drag';
              isDragging = true;
              dragButton = e.button;
              dragStart = { x: e.clientX, y: e.clientY };
              dragSourceTerritoryId = territory.id;
              const maxAvailable = Math.max(1, territory.armies - 1);
              const desiredCount = e.shiftKey
                ? 1
                : e.altKey
                ? Math.max(1, Math.floor(territory.armies / 2))
                : maxAvailable;
              dragArmiesCount = Math.min(maxAvailable, desiredCount);
              dragTargetId = null;
              updateHover(null);
              setSelectedTerritoryId(territory.id);
              setDraggingArmy({ sourceId: territory.id, armies: dragArmiesCount });
              setDraggingArmyPosition({ x: mx, y: my });
              setDragTargetTerritoryId(null);
              activePointerId = e.pointerId;
              canvas?.setPointerCapture(e.pointerId);
              AudioSys.playSFX('click');
              return;
            }
          }
        }

        pointerMode = 'map-pan';
        setDragTargetTerritoryId(null);
        setDraggingArmy(null);
        setDraggingArmyPosition(null);
        isDragging = true;
        dragButton = e.button;
        dragStart = { x: e.clientX, y: e.clientY };
        activePointerId = e.pointerId;
        canvas?.setPointerCapture(e.pointerId);
      };

      const handlePointerMove = (e: PointerEvent) => {
        const rect = canvas?.getBoundingClientRect();

        if (!isDragging && pointerMode !== 'unit-drag') {
          if (rect) {
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            let nextHover: string | null = null;
            for (const territory of getTerritories()) {
              const { x: tx, y: ty, visible } = projectLocal(territory.anchorLon, territory.anchorLat);
              if (!visible) {
                continue;
              }
              const dist = Math.hypot(mx - tx, my - ty);
              if (dist < 25) {
                nextHover = territory.id;
                break;
              }
            }
            updateHover(nextHover);
          }
        }

        if (pointerMode === 'unit-drag') {
          if (!rect) return;
          const mx = e.clientX - rect.left;
          const my = e.clientY - rect.top;
          setDraggingArmyPosition({ x: mx, y: my });

          const territories = getTerritories();
          const source = territories.find(entry => entry.id === dragSourceTerritoryId) ?? null;
          let nextTarget: string | null = null;

          if (source) {
            for (const territory of territories) {
              if (territory.id === source.id) continue;
              const { x: tx, y: ty, visible } = projectLocal(territory.anchorLon, territory.anchorLat);
              if (!visible) {
                continue;
              }
              const dist = Math.hypot(mx - tx, my - ty);
              if (dist < 28) {
                nextTarget = territory.id;
                break;
              }
            }
            if (nextTarget && !source.neighbors.includes(nextTarget)) {
              nextTarget = null;
            }
          }

          if (dragTargetId !== nextTarget) {
            dragTargetId = nextTarget;
            setDragTargetTerritoryId(nextTarget);
            updateHover(nextTarget);
          }
          return;
        }

        if (!isDragging) return;
        if (pointerMode !== 'map-pan') {
          return;
        }
        if (e.buttons === 0) {
          handlePointerUp(e);
          return;
        }

        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        dragStart = { x: e.clientX, y: e.clientY };

        // Pan factors for "grab and move" style - map follows drag direction
        const panFactorX = 0.85;
        const panFactorY = 0.75;

        cam.x += dx * panFactorX;
        cam.y += dy * panFactorY;
        clampPanBounds();
      };

      const handlePointerCancel = (e: PointerEvent) => {
        if (canvas && activePointerId !== null && canvas.hasPointerCapture(activePointerId)) {
          canvas.releasePointerCapture(activePointerId);
        }
        activePointerId = null;
        if (pointerMode === 'unit-drag') {
          resetUnitDragState();
        }
        isDragging = false;
        dragButton = null;
        pointerMode = 'none';
      };

      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const focalX = e.clientX - rect.left;
        const focalY = e.clientY - rect.top;

        const isCtrlZoom = e.ctrlKey;
        const isTrackpadScroll = Math.abs(e.deltaX) > 0.01 || Math.abs(e.deltaY) < 40;

        // Trackpad pan (two-finger swipe) - "grab and move" style for consistency
        if (isTrackpadScroll && !isCtrlZoom) {
          const panDampening = Math.max(0.35, Math.min(1.25, 1 / Math.max(0.2, cam.zoom)));
          const panScale = 0.65 * panDampening;
          cam.x += e.deltaX * panScale;
          cam.y += e.deltaY * panScale;
          clampPanBounds();
          return;
        }

        const [focalLon, focalLat] = toLonLatLocal(focalX, focalY);
        const focalProjection = projectLocal(focalLon, focalLat);
        const zoomIntensity = isCtrlZoom ? 0.003 : 0.0015;
        const delta = Math.exp(-e.deltaY * zoomIntensity);
        const newZoom = cam.targetZoom * delta;

        applyZoomToPoint(newZoom, focalX, focalY, focalProjection);
      };

      let touchStartTime = 0;
      let lastTouchDistance = 0;
      let initialPinchDistance = 0;
      let initialPinchZoom = 1;

      const getTouchDistance = (touches: TouchList) => {
        if (touches.length < 2) return 0;
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
      };

      const handleTouchStart = (e: TouchEvent) => {
        touchStartTime = Date.now();
        
        if(e.touches.length === 1) {
          touching = true;
          touchStart = {x: e.touches[0].clientX, y: e.touches[0].clientY};
        } else if (e.touches.length === 2) {
          // Start pinch gesture
          e.preventDefault();
          lastTouchDistance = getTouchDistance(e.touches);
          initialPinchDistance = lastTouchDistance;
          initialPinchZoom = cam.targetZoom;
          touching = false;
        }
      };

      const handleTouchMove = (e: TouchEvent) => {
        if (e.touches.length === 2) {
          // Pinch-to-zoom
          e.preventDefault();
          if (!canvas) return;
          const newDistance = getTouchDistance(e.touches);
          if (lastTouchDistance > 0 && initialPinchDistance > 0) {
            const scaleFactor = newDistance / initialPinchDistance;
            const rect = canvas.getBoundingClientRect();
            const midpointX = ((e.touches[0].clientX + e.touches[1].clientX) / 2) - rect.left;
            const midpointY = ((e.touches[0].clientY + e.touches[1].clientY) / 2) - rect.top;
            const [focalLon, focalLat] = toLonLatLocal(midpointX, midpointY);
            const focalProjection = projectLocal(focalLon, focalLat);
            const newZoom = Math.max(minZoom, Math.min(3, initialPinchZoom * scaleFactor));
            applyZoomToPoint(newZoom, midpointX, midpointY, focalProjection.visible
              ? focalProjection
              : { ...focalProjection, visible: true, x: midpointX, y: midpointY });

            lastTouchDistance = newDistance;
          }
        } else if(touching && e.touches.length === 1) {
          // Single finger pan
          e.preventDefault();

          const nx = e.touches[0].clientX, ny = e.touches[0].clientY;
          const dx = nx - touchStart.x;
          const dy = ny - touchStart.y;

          // Only pan if moved more than 5px (prevents accidental pan on tap)
          if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
            // Pan factors for "grab and move" style - map follows finger direction
            const panFactorX = 0.85;
            const panFactorY = 0.75;

            cam.x += dx * panFactorX;
            cam.y += dy * panFactorY;
            clampPanBounds();
            touchStart = {x: nx, y: ny};
          }
        }
      };

      const handleTouchEnd = (e: TouchEvent) => { 
        const touchDuration = Date.now() - touchStartTime;
        
        // Handle tap (quick touch < 300ms)
        if (e.changedTouches.length === 1 && touchDuration < 300 && touching) {
          const rect = canvas.getBoundingClientRect();
          const touch = e.changedTouches[0];
          const mx = touch.clientX - rect.left;
          const my = touch.clientY - rect.top;
          
          // Check if tapped on a nation (simulate click for intel)
          if (!S.gameOver) {
            const player = PlayerManager.get();
            if (player && player.satellites) {
              for (const n of nations) {
                if (n.isPlayer) continue;
                if (!player.satellites[n.id]) continue;
                if (n.population <= 0) continue;
                const { x: nx, y: ny, visible } = projectLocal(n.lon, n.lat);
                if (!visible) {
                  continue;
                }
                const dist = Math.hypot(mx - nx, my - ny);
                
                if (dist < 30) { // Larger hit area for touch
                  let intelHtml = `<div style="margin:8px 0;padding:6px;border:1px solid rgba(124,255,107,.3);">`;
                  intelHtml += `<strong>${n.name}</strong><br>`;
                  intelHtml += `Missiles: ${n.missiles} | Defense: ${n.defense}<br>`;
                  intelHtml += `Warheads: ${Object.entries(n.warheads || {}).map(([k, v]) => `${k}MT×${v}`).join(', ')}<br>`;
                  intelHtml += `Production: ${Math.floor(n.production || 0)} | Uranium: ${Math.floor(n.uranium || 0)} | Intel: ${Math.floor(n.intel || 0)}<br>`;
                  intelHtml += `Migrants (This Turn / Total): ${(n.migrantsThisTurn || 0)} / ${(n.migrantsTotal || 0)}<br>`;
                  intelHtml += `Population: ${Math.floor(n.population)}M | Instability: ${Math.floor(n.instability || 0)}`;
                  intelHtml += `</div>`;
                  openModal(`${n.name} INTEL`, intelHtml);
                  break;
                }
              }
            }
          }
        }
        
        touching = false;
        lastTouchDistance = 0;
        initialPinchDistance = 0;
      };

      // Click handler for satellite intelligence and territories
      const handleClick = (e: MouseEvent) => {
        if (e.button !== 0) return;
        if (isDragging) return;
        if (S.gameOver) return;
        const player = PlayerManager.get();
        if (!player) return;

        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        // Check for territory clicks first (higher priority)
        const territories = territoryListRef.current ?? [];
        if (territories.length > 0) {
          for (const territory of territories) {
            const { x: tx, y: ty, visible } = projectLocal(territory.anchorLon, territory.anchorLat);
            if (!visible) {
              continue;
            }
            const dist = Math.hypot(mx - tx, my - ty);
            const hitRadius = 25;

            if (dist < hitRadius) {
              const sourceTerritory = getTerritoryById(selectedTerritoryId);
              if (sourceTerritory && sourceTerritory.id !== territory.id) {
                if (sourceTerritory.neighbors.includes(territory.id)) {
                  const isAttack = territory.controllingNationId !== player.id;
                  // Actions will be handled through TerritoryMapPanel callbacks
                  if (!isAttack) {
                    setDragTargetTerritoryId(territory.id);
                  }
                }
              }
              setSelectedTerritoryId(territory.id);
              AudioSys.playSFX('click');
              return; // Exit early - don't check nations
            }
          }
        }

        // Check for nation clicks (original logic)
        for (const n of nations) {
          if (n.isPlayer) continue;
          if (n.population <= 0) continue;
          const { x: nx, y: ny, visible } = projectLocal(n.lon, n.lat);
          if (!visible) {
            continue;
          }
          const dist = Math.hypot(mx - nx, my - ny);

          if (dist < 20) {
            // Shift+Click or Ctrl+Click to contact leader directly (Civilization-style)
            if (e.shiftKey || e.ctrlKey) {
              AudioSys.playSFX('click');
              handleContactLeader(n.id);
              break;
            }

            // Regular click shows intel if satellite coverage exists
            if (!player.satellites || !player.satellites[n.id]) {
              // No satellite coverage - offer to contact leader instead
              const lines = [];
              lines.push(`<strong>${n.name}</strong>`);
              lines.push(`<span style="color: #ffa500;">No satellite coverage</span>`);
              lines.push(`<br><em>Tip: Hold Shift and click to contact their leader</em>`);
              const info = `<div style="margin:8px 0;padding:6px;border:1px solid rgba(124,255,107,.3);">${lines.join('<br>')}</div>`;
              openModal(`${n.name}`, info);
              break;
            }

            let intelHtml = `<div style="margin:8px 0;padding:6px;border:1px solid rgba(124,255,107,.3);">`;
            intelHtml += `<strong>${n.name}</strong><br>`;
            intelHtml += `Missiles: ${n.missiles} | Defense: ${n.defense}<br>`;
            intelHtml += `Warheads: ${Object.entries(n.warheads || {}).map(([k, v]) => `${k}MT×${v}`).join(', ')}<br>`;
            intelHtml += `Production: ${Math.floor(n.production || 0)} | Uranium: ${Math.floor(n.uranium || 0)} | Intel: ${Math.floor(n.intel || 0)}<br>`;
            intelHtml += `Migrants (This Turn / Total): ${(n.migrantsThisTurn || 0)} / ${(n.migrantsTotal || 0)}<br>`;
            intelHtml += `Population: ${Math.floor(n.population)}M | Instability: ${Math.floor(n.instability || 0)}<br>`;
            intelHtml += `<br><em style="color: #7cff6b;">💡 Shift+Click to contact leader</em>`;
            intelHtml += `</div>`;
            openModal(`${n.name} INTEL`, intelHtml);
            break;
          }
        }
      };

      // Double-click zoom functionality
      const handleDoubleClick = (e: MouseEvent) => {
        if (isDragging) return;
        if (S.gameOver) return;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        
        if (zoomedIn) {
          applyZoomToPoint(minZoom, W / 2, H / 2, { x: W / 2, y: H / 2, visible: true });
          zoomedIn = false;
          return;
        }

        const [lon, lat] = toLonLatLocal(mx, my);
        const newZoom = Math.max(minZoom, Math.min(3, cam.targetZoom * 1.5));
        const focalProjection = projectLocal(lon, lat);
        applyZoomToPoint(newZoom, mx, my, focalProjection.visible
          ? focalProjection
          : { ...focalProjection, visible: true, x: mx, y: my });
        zoomedIn = true;
        
        let nearest = null;
        let minDist = Infinity;
        for (const nn of nations) {
          const d = Math.hypot((nn.lon || 0) - lon, (nn.lat || 0) - lat);
          if (d < minDist) { minDist = d; nearest = nn; }
        }
        
        if (nearest) {
          const lines = [];
          lines.push(`<strong>${nearest.name}</strong>`);
          if (nearest.leader) lines.push(`Leader: ${nearest.leader}`);
          if (nearest.doctrine) lines.push(`Doctrine: ${nearest.doctrine}`);
          lines.push(`Population: ${Math.floor(nearest.population || 0)}M`);
          lines.push(`Cities: ${nearest.cities || 0}`);
          lines.push(`Instability: ${Math.floor(nearest.instability || 0)}`);
          
          const currentPlayer = PlayerManager.get();
          const hasIntelCoverage = currentPlayer && currentPlayer.satellites && currentPlayer.satellites[nearest.id];
          if (hasIntelCoverage && !nearest.isPlayer) {
            // Apply fog of war to enemy nations
            const distorted = distortNationIntel(nearest, {
              baseAccuracy: 0.7,
              satelliteCoverage: true,
              deepReconActive: !!(currentPlayer.deepRecon && currentPlayer.deepRecon[nearest.id]),
              counterintelActive: (nearest.intel || 0) > 50
            });
            lines.push(`Missiles: ${distorted.missiles || 0} (${distorted._intelReliability}), Defense: ${distorted.defense || 0}`);
            lines.push(`Production: ${Math.floor(distorted.production || 0)}, Uranium: ${Math.floor(distorted.uranium || 0)}, Intel: ${Math.floor(distorted.intel || 0)}`);
            lines.push(`<span style="color: #ffa500; font-size: 0.85em">Intel Confidence: ${Math.round((distorted._intelConfidence || 0) * 100)}%</span>`);
          } else if (hasIntelCoverage && nearest.isPlayer) {
            lines.push(`Missiles: ${nearest.missiles || 0}, Defense: ${nearest.defense || 0}`);
            lines.push(`Production: ${Math.floor(nearest.production || 0)}, Uranium: ${Math.floor(nearest.uranium || 0)}, Intel: ${Math.floor(nearest.intel || 0)}`);
          } else {
            lines.push(`Surveillance required to view military and resource data`);
          }
          const info = `<div style="margin:8px 0">${lines.join('<br>')}</div>`;
          openModal(`${nearest.name} REGION`, info);
        }
      };

      // Keyboard controls
      const handleKeyDown = (e: KeyboardEvent) => {
        if(S.gameOver) return;

        if (e.altKey) {
          switch (e.key) {
            case '1':
              e.preventDefault();
              handleMapModeChange('standard');
              return;
            case '2':
              e.preventDefault();
              handleMapModeChange('diplomatic');
              return;
            case '3':
              e.preventDefault();
              handleMapModeChange('intel');
              return;
            case '4':
              e.preventDefault();
              handleMapModeChange('resources');
              return;
            case '5':
              e.preventDefault();
              handleMapModeChange('unrest');
              return;
            case '6':
              e.preventDefault();
              handleMapModeChange('pandemic');
              return;
            default:
              break;
          }
        }

        switch(e.key) {
          case '1': handleBuild(); break;
          case '2': handleResearch(); break;
          case '3': handleIntel(); break;
          case '4': handleCulture(); break;
          case '6': handleDiplomacy(); break;
          case 'o':
          case 'O':
            e.preventDefault();
            if (e.shiftKey) {
              AudioSys.playSFX('click');
              setIsOutlinerCollapsed(false);
              setOutlinerAttentionTick(Date.now());
            } else {
              handleOutlinerToggle();
            }
            break;
          case 'l': // 'L' for Leaders - open leaders screen (Civilization-style)
          case 'L':
            if (S.phase === 'PLAYER') {
              e.preventDefault();
              AudioSys.playSFX('click');
              setLeadersScreenOpen(true);
            }
            break;
          case '7':
            e.preventDefault();
            handleAttackRef.current?.();
            break;
          case 'i':
          case 'I':
            e.preventDefault();
            setCivInfoPanelOpen(prev => !prev);
            break;
          case 'n':
          case 'N':
            if (mapStyle.visual === 'flat-realistic') {
              e.preventDefault();
              handleDayNightToggle();
            }
            break;
          case 'm':
          case 'M':
            if (mapStyle.visual === 'morphing') {
              e.preventDefault();
              globeSceneRef.current?.toggleMorphView();
            }
            break;
          case 'Enter': /* end turn */ break;
          case ' ':
            e.preventDefault();
            handlePauseToggle();
            break;
          case 's':
          case 'S': /* save */ break;
        }

        if (e.code === 'Numpad7') {
          e.preventDefault();
          handleAttackRef.current?.();
        }
      };

      const handleContextMenu = (e: MouseEvent) => {
        if (isDragging && dragButton === 2) {
          e.preventDefault();
        }
      };

      canvas.addEventListener('pointerdown', handlePointerDown);
      canvas.addEventListener('pointermove', handlePointerMove);
      canvas.addEventListener('pointerup', handlePointerUp);
      canvas.addEventListener('pointercancel', handlePointerCancel);
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      canvas.addEventListener('click', handleClick);
      canvas.addEventListener('dblclick', handleDoubleClick);
      canvas.addEventListener('contextmenu', handleContextMenu);
      canvas.addEventListener('touchstart', handleTouchStart, {passive: false});
      canvas.addEventListener('touchmove', handleTouchMove, {passive: false});
      canvas.addEventListener('touchend', handleTouchEnd, {passive: false});
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        if (typeof window !== 'undefined') {
          window.removeEventListener('resize', handleWindowResize);
        }
        if (canvas && activePointerId !== null && canvas.hasPointerCapture(activePointerId)) {
          canvas.releasePointerCapture(activePointerId);
          activePointerId = null;
        }
        canvas.removeEventListener('pointerdown', handlePointerDown);
        canvas.removeEventListener('pointermove', handlePointerMove);
        canvas.removeEventListener('pointerup', handlePointerUp);
        canvas.removeEventListener('pointercancel', handlePointerCancel);
        canvas.removeEventListener('wheel', handleWheel);
        canvas.removeEventListener('click', handleClick);
        canvas.removeEventListener('dblclick', handleDoubleClick);
        canvas.removeEventListener('contextmenu', handleContextMenu);
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchmove', handleTouchMove);
        canvas.removeEventListener('touchend', handleTouchEnd);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [currentMapStyle, isGameStarted, handleBuild, handleResearch, handleIntel, handleCulture, handleDiplomacy, handleOutlinerToggle, handlePauseToggle, handleMapModeChange, openModal, resizeCanvas, setIsOutlinerCollapsed, setOutlinerAttentionTick]);

  const buildAllowed = coopEnabled ? canExecute('BUILD') : true;
  const researchAllowed = coopEnabled ? canExecute('RESEARCH') : true;
  const intelAllowed = coopEnabled ? canExecute('INTEL') : true;
  const bioWarfareAllowed = coopEnabled ? canExecute('BIOWARFARE') : true;
  const cultureAllowed = coopEnabled ? canExecute('CULTURE') : true;
  const diplomacyAllowed = coopEnabled ? canExecute('DIPLOMACY') : true;
  const bioForgeUnlocked = labFacility.tier >= 3 && pandemicIntegrationEnabled && bioWarfareEnabled;
  const hasBioForgeAccess = bioForgeUnlocked && bioWarfareAllowed;

  const strategicOutlinerGroups = useMemo<StrategicOutlinerGroup[]>(() => {
    const groups: StrategicOutlinerGroup[] = [];

    const militaryItems: StrategicOutlinerGroup['items'] = [];

    const postureLabel = (posture: string) =>
      posture === 'offensive'
        ? 'Offensiv'
        : posture === 'defensive'
          ? 'Defensiv'
          : posture === 'reserve'
            ? 'Reserve'
            : posture === 'support'
              ? 'Støtte'
              : posture;

    const frontlineStatusLabel = (status: string) =>
      status === 'breakthrough'
        ? 'Gjennombrudd'
        : status === 'pressured'
          ? 'Presset'
          : status === 'stalled'
            ? 'Stanset'
            : 'Stabil';

    const supplyStateLabel = (state: string) =>
      state === 'critical' ? 'Kritisk forsyning' : state === 'strained' ? 'Anstrengt forsyning' : 'Sikker forsyning';

    const frontlineSeverity = (
      status: string,
      supply: string,
      contested: boolean
    ): 'normal' | 'warning' | 'critical' => {
      if (status === 'breakthrough' || supply === 'critical' || contested) {
        return 'critical';
      }
      if (status === 'pressured' || supply === 'strained') {
        return 'warning';
      }
      return 'normal';
    };

    const groupSeverity = (summary: ArmyGroupSummary): 'normal' | 'warning' | 'critical' => {
      const readiness = summary.readiness;
      const supply = summary.supplyLevel;
      const frontlineAlerts = summary.frontlines.map((frontline) =>
        frontlineSeverity(frontline.status, frontline.supplyState, frontline.contested)
      );

      if (
        readiness <= 35 ||
        supply <= 35 ||
        frontlineAlerts.some((severity) => severity === 'critical')
      ) {
        return 'critical';
      }
      if (
        readiness < 55 ||
        supply < 55 ||
        frontlineAlerts.some((severity) => severity === 'warning')
      ) {
        return 'warning';
      }
      return 'normal';
    };

    if (playerArmyGroupSummaries.length > 0) {
      playerArmyGroupSummaries.forEach((summary) => {
        const readiness = Math.round(summary.readiness);
        const supply = Math.round(summary.supplyLevel);
        const status = groupSeverity(summary);
        const frontlineSummary = summary.frontlines.length
          ? summary.frontlines
              .map(
                (frontline) =>
                  `${frontline.name}: ${frontlineStatusLabel(frontline.status)} • ${supplyStateLabel(frontline.supplyState)}`
              )
              .join(' • ')
          : 'Ingen frontlinjer tilordnet';

        militaryItems.push({
          id: `army-group-${summary.group.id}`,
          title: `${summary.group.name} • ${summary.group.theater}`,
          subtitle: `${postureLabel(summary.group.posture)} • ${summary.units.length} enheter`,
          description: frontlineSummary,
          icon: <Swords className="h-4 w-4" />,
          status,
          meta: `Beredskap ${readiness}% • Forsyning ${supply}%`,
        });

        summary.frontlines.forEach((frontline) => {
          const severity = frontlineSeverity(frontline.status, frontline.supplyState, frontline.contested);
          if (severity === 'normal') {
            return;
          }

          militaryItems.push({
            id: `frontline-${frontline.id}`,
            title: `${frontline.name} • ${frontline.axis}`,
            subtitle: `Teater ${frontline.theater}`,
            description: `${frontlineStatusLabel(frontline.status)} • ${supplyStateLabel(frontline.supplyState)} • Readiness ${Math.round(frontline.readiness)}%`,
            icon: <Target className="h-4 w-4" />,
            status: severity,
            meta: frontline.contested ? `Kamp pågår • ${summary.group.name}` : `Støttes av ${summary.group.name}`,
          });
        });
      });
    }

    if (playerForceSummary && playerSnapshot) {
      const readiness = Math.round(playerForceSummary.readiness);
      const readinessStatus: 'normal' | 'warning' | 'critical' =
        readiness <= 35 ? 'critical' : readiness < 55 ? 'warning' : 'normal';
      const professionalism = Math.round(playerForceSummary.professionalism);
      const tradition = Math.round(playerForceSummary.tradition);
      const doctrineTilt = professionalism - tradition;
      const doctrineLabel =
        doctrineTilt >= 12
          ? 'Kvalitetsfokus'
          : doctrineTilt <= -12
            ? 'Massemobilisering'
            : 'Hybrid-styrke';
      const groupBreakdown = playerArmyGroupSummaries
        .map((summary) => `${summary.group.name}: ${Math.round(summary.readiness)}%`)
        .join(' • ');
      const metaSegments = [`Profesjonalitet ${professionalism}%`, `Tradisjon ${tradition}%`];
      if (groupBreakdown) {
        metaSegments.push(groupBreakdown);
      }
      militaryItems.push({
        id: 'force-readiness',
        title: `Total beredskap ${readiness}%`,
        subtitle: `${playerForceSummary.deployed} deployert • ${playerForceSummary.reserve} i reserve • Prof ${professionalism}% / Trad ${tradition}%`,
        description:
          playerArmyGroupSummaries.length > 0
            ? `Grupper: ${playerArmyGroupSummaries.length}`
            : 'Ingen armégrupper organisert',
        icon: <Shield className="h-4 w-4" />,
        status: readinessStatus,
        meta: [doctrineLabel, ...metaSegments].join(' • '),
      });
    }

    if (playerSnapshot) {
      const production = Math.round(playerSnapshot.production);
      const intel = Math.round(playerSnapshot.intel);
      const uranium = Math.round(playerSnapshot.uranium);
      const instability = Math.round(playerSnapshot.instability ?? 0);
      const productionStatus: 'normal' | 'warning' | 'critical' =
        production <= 25 ? 'critical' : production < 70 ? 'warning' : 'normal';
      militaryItems.push({
        id: 'resource-stockpile',
        title: `Industripool ${production}`,
        subtitle: `Intel ${intel} • Uran ${uranium}`,
        icon: <Factory className="h-4 w-4" />,
        status: productionStatus,
        meta: `Instabilitet ${instability}%`,
      });

      const industrialMacros = [`BUILD ${buildAllowed ? '✓' : '✕'}`, `RESEARCH ${researchAllowed ? '✓' : '✕'}`];
      militaryItems.push({
        id: 'macro-industrial',
        title: 'Makro: Industri',
        subtitle: industrialMacros.join(' • '),
        icon: <Zap className="h-4 w-4" />,
        status: buildAllowed && researchAllowed ? 'normal' : 'warning',
      });
    }

    latestConventionalEvents.forEach((event) => {
      const involvesPlayer =
        !!playerSnapshot &&
        (event.casualties?.[playerSnapshot.id] !== undefined ||
          event.instabilityDelta?.[playerSnapshot.id] !== undefined ||
          event.productionDelta?.[playerSnapshot.id] !== undefined);
      const engagementStatus: 'normal' | 'warning' | 'critical' =
        involvesPlayer && event.type !== 'movement' ? 'warning' : 'normal';
      militaryItems.push({
        id: `conventional-${event.id}`,
        title: event.summary,
        subtitle: `${event.type === 'border' ? 'Grensekonflikt' : event.type === 'proxy' ? 'Proxy-operasjon' : 'Manøver'} • Tur ${event.turn}`,
        icon: <Target className="h-4 w-4" />,
        status: engagementStatus,
      });
    });

    if (militaryItems.length > 0) {
      groups.push({
        id: 'military',
        title: 'Produksjon & Militær',
        items: militaryItems,
        accentColor: 'text-cyan-200',
      });
    }

    const governanceItems: StrategicOutlinerGroup['items'] = [];

    const defconStatus: 'normal' | 'warning' | 'critical' =
      S.defcon <= 2 ? 'critical' : S.defcon <= 3 ? 'warning' : 'normal';
    governanceItems.push({
      id: 'defcon',
      title: `DEFCON ${S.defcon}`,
      subtitle:
        S.defcon <= 2
          ? 'Nær global eskalering'
          : S.defcon <= 3
            ? 'Høy spenning i blokken'
            : 'Strategisk stabilitet overvåkes',
      icon: <AlertTriangle className="h-4 w-4" />,
      status: defconStatus,
    });

    if (playerSnapshot) {
      const morale = Math.round(playerSnapshot.metrics.morale);
      const publicOpinion = Math.round(playerSnapshot.metrics.publicOpinion);
      const cabinetApproval = Math.round(playerSnapshot.metrics.cabinetApproval);
      const electionTimer = Math.max(0, Math.round(playerSnapshot.metrics.electionTimer));
      const moraleStatus: 'normal' | 'warning' | 'critical' =
        morale <= 40 ? 'critical' : morale < 55 ? 'warning' : 'normal';
      const cabinetStatus: 'normal' | 'warning' | 'critical' =
        cabinetApproval <= 40 ? 'critical' : cabinetApproval < 55 ? 'warning' : 'normal';
      const electionStatus: 'normal' | 'warning' | 'critical' =
        electionTimer <= 1 ? 'critical' : electionTimer <= 3 ? 'warning' : 'normal';
      const combinedStatus: 'normal' | 'warning' | 'critical' =
        moraleStatus === 'critical' || cabinetStatus === 'critical' || electionStatus === 'critical'
          ? 'critical'
          : moraleStatus === 'warning' || cabinetStatus === 'warning' || electionStatus === 'warning'
            ? 'warning'
            : 'normal';

      governanceItems.push({
        id: 'governance-health',
        title: `Innenrikspolitikk ${morale}% moral`,
        subtitle: `Opinion ${publicOpinion}% • Kabinett ${cabinetApproval}% • Valg om ${electionTimer} turer`,
        icon: <Users className="h-4 w-4" />,
        status: combinedStatus,
      });
    }

    const diplomaticMacros = [`DIPLOMACY ${diplomacyAllowed ? '✓' : '✕'}`, `CULTURE ${cultureAllowed ? '✓' : '✕'}`];
    governanceItems.push({
      id: 'macro-diplomacy',
      title: 'Makro: Diplomati & Kultur',
      subtitle: diplomaticMacros.join(' • '),
      icon: <Handshake className="h-4 w-4" />,
      status: diplomacyAllowed && cultureAllowed ? 'normal' : 'warning',
    });

    if (governance.activeEvent) {
      const severity = governance.activeEvent.definition.severity;
      const severityStatus: 'normal' | 'warning' | 'critical' =
        severity === 'critical' ? 'critical' : severity === 'serious' ? 'warning' : 'normal';
      governanceItems.push({
        id: `governance-event-${governance.activeEvent.definition.id}`,
        title: governance.activeEvent.definition.title,
        subtitle: governance.activeEvent.definition.summary,
        icon: <Handshake className="h-4 w-4" />,
        status: severityStatus,
      });
    }

    if (governanceItems.length > 0) {
      groups.push({
        id: 'governance',
        title: 'Diplomati & Styresett',
        items: governanceItems,
        accentColor: 'text-emerald-200',
      });
    }

    const intelItems: StrategicOutlinerGroup['items'] = [];

    const intelMacros = [`INTEL ${intelAllowed ? '✓' : '✕'}`, `BIO ${bioWarfareAllowed ? '✓' : '✕'}`];
    intelItems.push({
      id: 'macro-intel',
      title: 'Makro: Etterretning',
      subtitle: intelMacros.join(' • '),
      icon: <Radio className="h-4 w-4" />,
      status: intelAllowed && bioWarfareAllowed ? 'normal' : 'warning',
    });

    if (activeFlashpoint) {
      const severityStatus: 'normal' | 'warning' | 'critical' =
        activeFlashpoint.severity === 'major' ? 'warning' : 'critical';
      intelItems.push({
        id: `flashpoint-${activeFlashpoint.id}`,
        title: activeFlashpoint.title,
        subtitle: `Responder innen ${Math.max(1, Math.round(activeFlashpoint.timeLimit))}s`,
        description: activeFlashpoint.description,
        icon: <Radio className="h-4 w-4" />,
        status: severityStatus,
      });
    } else if ((pendingFollowUps ?? []).length > 0) {
      intelItems.push({
        id: 'flashpoint-tracking',
        title: 'Varslede etterspill',
        subtitle: `${(pendingFollowUps ?? []).length} potensielle hendelser overvåkes`,
        icon: <Radio className="h-4 w-4" />,
        status: 'warning',
      });
    }

    const infection = Math.round(pandemicState.globalInfection);
    const vaccine = Math.round(pandemicState.vaccineProgress);
    const casualties = Math.round(pandemicState.casualtyTally);
    const activeBioThreat =
      pandemicState.active || infection > 0 || pandemicState.outbreaks.some((outbreak) => outbreak.infection > 0);
    if (activeBioThreat) {
      const stageStatus: 'normal' | 'warning' | 'critical' =
        pandemicState.stage === 'collapse'
          ? 'critical'
          : pandemicState.stage === 'pandemic'
            ? 'critical'
            : pandemicState.stage === 'epidemic'
              ? 'warning'
              : 'normal';
      intelItems.push({
        id: 'pandemic-status',
        title: `${pandemicState.strainName || 'Biohazard'} • ${pandemicState.stage.toUpperCase()}`,
        subtitle: `Infeksjon ${infection}% • Vaksine ${vaccine}% • Tap ${casualties.toLocaleString()}`,
        icon: <FlaskConical className="h-4 w-4" />,
        status: stageStatus,
      });

      const severeOutbreak = [...pandemicState.outbreaks].sort((a, b) => b.infection - a.infection)[0];
      if (severeOutbreak && severeOutbreak.infection >= 25) {
        intelItems.push({
          id: `outbreak-${severeOutbreak.region}`,
          title: `Hotspot: ${severeOutbreak.region}`,
          subtitle: `Infeksjon ${Math.round(severeOutbreak.infection)} • Heat ${Math.round(severeOutbreak.heat)}`,
          icon: <AlertTriangle className="h-4 w-4" />,
          status: severeOutbreak.infection >= 60 ? 'critical' : 'warning',
        });
      }
    }

    if (intelItems.length > 0) {
      groups.push({
        id: 'intel',
        title: 'Etterretning & Krise',
        items: intelItems,
        accentColor: 'text-sky-200',
      });
    }

    return groups;
  }, [
    activeFlashpoint,
    bioWarfareAllowed,
    buildAllowed,
    cultureAllowed,
    diplomacyAllowed,
    governance.activeEvent,
    intelAllowed,
    latestConventionalEvents,
    pandemicState,
    pendingFollowUps,
    playerForceSummary,
    playerArmyGroupSummaries,
    playerSnapshot,
    researchAllowed,
  ]);

  // Render functions for different phases
  // Screen render functions - now using extracted components (Phase 7 refactoring)
  const renderIntroScreen = () => {
    try {
      console.log('[DEBUG] renderIntroScreen called');
      console.log('[DEBUG] scenarioOptions:', scenarioOptions);
      console.log('[DEBUG] selectedScenario:', selectedScenario);
      console.log('[DEBUG] musicTracks:', musicTracks);

      const highscores = JSON.parse(Storage.getItem('highscores') || '[]').slice(0, 5);
      console.log('[DEBUG] highscores loaded:', highscores);

      return (
        <IntroScreen
          scenarioOptions={scenarioOptions}
          selectedScenarioId={selectedScenarioId}
          selectedScenario={selectedScenario}
          isScenarioPanelOpen={isScenarioPanelOpen}
          highscores={highscores}
          onStart={handleIntroStart}
          onScenarioSelect={handleScenarioSelect}
          onOpenScenarioPanel={() => setIsScenarioPanelOpen(true)}
          onCloseScenarioPanel={setIsScenarioPanelOpen}
          mapStyle={mapStyle}
          onMapStyleChange={handleMapStyleChange}
          dayNightAutoCycleEnabled={dayNightAutoCycleEnabled}
          onDayNightAutoCycleToggle={handleDayNightAutoCycleToggle}
          musicEnabled={musicEnabled}
          onMusicToggle={handleMusicToggle}
          sfxEnabled={sfxEnabled}
          onSfxToggle={handleSfxToggle}
          musicVolume={musicVolume}
          onMusicVolumeChange={handleMusicVolumeChange}
          musicSelection={musicSelection}
          onMusicTrackChange={handleMusicTrackChange}
          onNextTrack={handleNextTrack}
          activeTrackMessage={activeTrackMessage}
          musicTracks={musicTracks}
        />
      );
    } catch (error) {
      console.error('[ERROR] renderIntroScreen failed:', error);
      return (
        <div style={{ padding: '20px', color: 'red', background: 'white' }}>
          <h1>Error in IntroScreen</h1>
          <pre>{error instanceof Error ? error.message : String(error)}</pre>
          <pre>{error instanceof Error ? error.stack : ''}</pre>
        </div>
      );
    }
  };

  const renderLeaderSelection = () => {
    try {
      console.log('[DEBUG] renderLeaderSelection called');

      // Filter leaders based on scenario - only historical leaders for Cuban Crisis, only lovecraftian for Great Old Ones, only parody for Nuclear War
      const isCubanCrisisScenario = S.scenario?.id === 'cubanCrisis';
      const isGreatOldOnesScenario = S.scenario?.id === 'greatOldOnes';
      const isNuclearWarScenario = S.scenario?.id === 'nuclearWar';
      const availableLeaders = leaders.filter((leader) => {
        const tags = leader.scenarios
          ?? (leader.isLovecraftian
            ? ['greatOldOnes']
            : leader.isHistoricalCubanCrisis
              ? ['cubanCrisis']
              : ['default']);

        if (isCubanCrisisScenario) {
          return tags.includes('cubanCrisis');
        }

        if (isGreatOldOnesScenario) {
          return tags.includes('greatOldOnes');
        }

        if (isNuclearWarScenario) {
          return tags.includes('nuclearWar');
        }

        return tags.includes('default');
      });

      console.log('[DEBUG] availableLeaders:', availableLeaders.length);

      return (
        <LeaderSelectionScreen
          interfaceRef={interfaceRef}
          leaders={availableLeaders}
          onSelectLeader={(leaderName) => {
            console.log('[DEBUG] Leader selected:', leaderName);
            setSelectedLeader(leaderName);

            // Auto-assign doctrine based on leader
            const defaultDoctrine = getLeaderDefaultDoctrine(leaderName);
            console.log('[DEBUG] Auto-assigned doctrine:', defaultDoctrine);
            setSelectedDoctrine(defaultDoctrine);

            // Start game directly with leader's doctrine
            startGame(leaderName, defaultDoctrine);
            setGamePhase('game');
          }}
          onBack={() => setGamePhase('intro')}
        />
      );
    } catch (error) {
      console.error('[ERROR] renderLeaderSelection failed:', error);
      return (
        <div style={{ padding: '20px', color: 'red', background: 'white' }}>
          <h1>Error in LeaderSelectionScreen</h1>
          <pre>{error instanceof Error ? error.message : String(error)}</pre>
          <pre>{error instanceof Error ? error.stack : ''}</pre>
        </div>
      );
    }
  };

  const overlayCanvas = globeSceneRef.current?.overlayCanvas ?? null;
  const overlayCanvasWidth = overlayCanvas?.width ?? 0;
  const overlayCanvasHeight = overlayCanvas?.height ?? 0;

  const effectiveOverlayProjector = useMemo<ProjectorFn | null>(() => {
    if (overlayProjectorFn) {
      return overlayProjectorFn;
    }
    if (!overlayCanvas) {
      return null;
    }

    const width = overlayCanvasWidth;
    const height = overlayCanvasHeight;

    return (lon: number, lat: number) => {
      const projected = project(lon, lat, {
        W: width,
        H: height,
        cam,
        globeProjector: null,
        globePicker,
      });

      if (Array.isArray(projected)) {
        const [x, y] = projected;
        return { x, y, visible: true };
      }

      return projected;
    };
  }, [
    overlayProjectorFn,
    overlayCanvas,
    overlayCanvasHeight,
    overlayCanvasWidth,
    overlayProjectorVersion,
    cam.x,
    cam.y,
    cam.zoom,
    cam.targetZoom,
    globePicker,
  ]);

  const defconIndicatorClasses = useMemo(() => getDefconIndicatorClasses(S.defcon), [S.defcon]);

  // Early returns for different phases
  console.log('[DEBUG] Render phase:', gamePhase);
  if (gamePhase === 'intro') {
    console.log('[DEBUG] Rendering IntroScreen');
    return renderIntroScreen();
  }

  if (gamePhase === 'leader') {
    console.log('[DEBUG] Rendering LeaderSelectionScreen');
    return renderLeaderSelection();
  }

  // Note: Doctrine selection phase removed - doctrine is now auto-assigned based on leader
  // See getLeaderDefaultDoctrine() in src/data/leaderDoctrines.ts

  const strikePlannerPanel = (
    <div className="rounded-lg border border-cyan-500/40 bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-sm shadow-2xl">
      <div className="flex items-center justify-between border-b border-cyan-500/30 bg-black/40 px-4 py-3">
        <span className="text-sm font-mono font-semibold uppercase tracking-wider text-cyan-300">Strike Planner</span>
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-mono ${selectedTarget ? 'text-red-300' : 'text-cyan-300/70'}`}
          >
            {selectedTarget ? 'LOCKED' : 'STANDBY'}
          </span>
          <button
            type="button"
            onClick={() => setIsStrikePlannerOpen(false)}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close strike planner"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="max-h-48 overflow-y-auto divide-y divide-cyan-500/10">
        {attackableNations.length === 0 ? (
          <div className="px-4 py-4 text-sm text-gray-400">
            No hostile launch solutions available.
          </div>
        ) : (
          attackableNations.map(nation => {
            const isSelected = nation.id === selectedTargetId;
            const population = Math.max(0, Math.round(nation.population ?? 0));
            const defense = Math.max(0, Math.round(nation.defense ?? 0));
            const missiles = Math.max(0, Math.round(Number(nation.missiles ?? 0)));
            const instability = Math.max(0, Math.round(Number(nation.instability ?? 0)));

            return (
              <button
                key={nation.id}
                type="button"
                onClick={() => handleTargetSelect(nation.id)}
                className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-colors ${
                  isSelected
                    ? 'bg-cyan-500/20 border-l-2 border-cyan-500/50 text-cyan-300'
                    : 'bg-slate-800/50 hover:bg-slate-700/50 text-gray-300'
                }`}
              >
                <span className="flex-1">
                  <span className="block text-[12px] uppercase tracking-[0.25em]">{nation.name}</span>
                  <span className="block text-[10px] text-cyan-300/70">
                    POP {population}M • DEF {defense} • MISS {missiles}
                  </span>
                </span>
                <span className={`text-[10px] ${isSelected ? 'text-red-100' : 'text-red-200/80'}`}>
                  INSTAB {instability}
                </span>
              </button>
            );
          })
        )}
      </div>
      <div className="px-4 py-3 text-sm text-gray-400">
        {selectedTarget ? (
          <div className="space-y-1">
            <p>
              Locked on <span className="text-cyan-300 font-semibold">{selectedTarget.name}</span>. Population&nbsp;
              {Math.max(0, Math.round(selectedTarget.population ?? 0))}M, defense{' '}
              {Math.max(0, Math.round(selectedTarget.defense ?? 0))}, missile capacity{' '}
              {Math.max(0, Math.round(Number(selectedTarget.missiles ?? 0)))}.
            </p>
            <p className="text-gray-500 text-xs">Confirm launch with ATTACK once satisfied with this solution.</p>
          </div>
        ) : (
          <p>Select a hostile nation to arm the ATTACK command.</p>
        )}
      </div>
    </div>
  );

  return (
    <div ref={interfaceRef} className={`command-interface command-interface--${layoutDensity}`}>
      <div className="command-interface__glow" aria-hidden="true" />
      <div className="command-interface__scanlines" aria-hidden="true" />

      <div className="map-shell">
        <GlobeScene
          ref={globeSceneRef}
          cam={cam}
          nations={nations}
          worldCountries={worldCountries}
          territories={territoryPolygons}
          territoryStates={territoryList}
          playerId={playerNationId}
          units={globeUnits}
          onProjectorReady={handleProjectorReady}
          onProjectorUpdate={handleProjectorUpdate}
          onPickerReady={handlePickerReady}
          mapStyle={mapStyle}
          modeData={mapModeData}
          showTerritories={false}
          showTerritoryMarkers={true}
          showUnits={showUnits}
          flatMapVariant={isFlatMapDay}
          dayNightBlend={dayNightBlend}
          showVectorOverlay={showVectorOverlay}
          vectorOnlyMode={vectorOnlyMode}
          vectorColor={theme === 'wargames' ? '#00ff00' : '#2ef1ff'}
          vectorOpacity={theme === 'wargames' ? 0.9 : 0.7}
          weatherClouds={weatherRadarHook.clouds}
          showWeatherClouds={weatherRadarHook.enabled}
          weatherCloudOpacity={0.75}
          showCloudShadows={true}
        />

        {draggingArmy && draggingArmyPosition && (
          <div className="pointer-events-none absolute inset-0 z-30">
            <div
              className="pointer-events-none flex flex-col items-center"
              style={{ transform: `translate(${draggingArmyPosition.x - 24}px, ${draggingArmyPosition.y - 24}px)` }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-cyan-400 bg-cyan-500/30 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.65)] backdrop-blur-sm">
                <span className="text-sm font-bold">{draggingArmy.armies}</span>
              </div>
              {dragTargetName && (
                <div className="mt-1 rounded bg-black/70 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wide text-yellow-300 shadow-lg">
                  Drop on {dragTargetName}
                </div>
              )}
            </div>
          </div>
        )}

        {overlayCanvas && mapStyle.mode === 'unrest' && (
          <PoliticalStabilityOverlay
            nations={nations.map(n => ({
              id: n.id,
              name: n.name,
              lon: n.lon || 0,
              lat: n.lat || 0,
              morale: mapModeData.unrest[n.id]?.morale ?? 50,
              publicOpinion: mapModeData.unrest[n.id]?.publicOpinion ?? 50,
              instability: mapModeData.unrest[n.id]?.instability ?? 0,
            }))}
            canvasWidth={overlayCanvas.width}
            canvasHeight={overlayCanvas.height}
            projector={effectiveOverlayProjector}
            projectorRevision={overlayProjectorVersion}
            visible={mapStyle.mode === 'unrest'}
          />
        )}

        {overlayCanvas && mapStyle.mode === 'pandemic' && mapModeData.pandemic && (
          <PandemicSpreadOverlay
            nations={nations.map(n => ({
              id: n.id,
              name: n.name,
              lon: n.lon || 0,
              lat: n.lat || 0,
            }))}
            canvasWidth={overlayCanvas.width}
            canvasHeight={overlayCanvas.height}
            projector={effectiveOverlayProjector}
            projectorRevision={overlayProjectorVersion}
            visible={mapStyle.mode === 'pandemic'}
            pandemic={mapModeData.pandemic}
            countryFeatureLookup={pandemicCountryGeometry}
            worldCountryFeatures={worldCountries as FeatureCollection<Polygon | MultiPolygon> | null}
          />
        )}

        {overlayCanvas && mapStyle.mode === 'radiation' && mapModeData.radiation && (
          <RadiationFalloutOverlay
            nations={nations.map(n => ({
              id: n.id,
              name: n.name,
              lon: n.lon || 0,
              lat: n.lat || 0,
            }))}
            canvasWidth={overlayCanvas.width}
            canvasHeight={overlayCanvas.height}
            projector={effectiveOverlayProjector}
            projectorRevision={overlayProjectorVersion}
            visible={mapStyle.mode === 'radiation'}
            radiation={mapModeData.radiation}
            countryFeatureLookup={pandemicCountryGeometry}
            worldCountryFeatures={worldCountries as FeatureCollection<Polygon | MultiPolygon> | null}
          />
        )}

        {overlayCanvas && mapStyle.mode === 'migration' && mapModeData.migration && (
          <MigrationFlowOverlay
            nations={nations.map(n => ({
              id: n.id,
              name: n.name,
              lon: n.lon || 0,
              lat: n.lat || 0,
            }))}
            canvasWidth={overlayCanvas.width}
            canvasHeight={overlayCanvas.height}
            projector={effectiveOverlayProjector}
            projectorRevision={overlayProjectorVersion}
            visible={mapStyle.mode === 'migration'}
            migration={mapModeData.migration}
            countryFeatureLookup={pandemicCountryGeometry}
            worldCountryFeatures={worldCountries as FeatureCollection<Polygon | MultiPolygon> | null}
          />
        )}

        <div className="hud-layers pointer-events-none touch-none">
          <div className="game-top-stack pointer-events-none">
            <header className="game-top-bar w-full bg-black/80 border-b border-cyan-500/30 backdrop-blur-sm flex items-center justify-between pointer-events-auto touch-auto">
              <div className="game-top-bar__metrics flex items-center gap-5 text-[11px] font-mono">
              {/* DEFCON - Enlarged for prominence */}
              <div
                id="defconBadge"
                className={`${DEFCON_BADGE_BASE_CLASSES} ${defconIndicatorClasses.badge}`}
              >
                <span className="text-cyan-300 text-xs tracking-wide">DEFCON</span>
                <span
                  className={`${DEFCON_VALUE_BASE_CLASSES} ${defconIndicatorClasses.value}`}
                  id="defcon"
                >
                  {S.defcon}
                </span>
              </div>

              {/* Global Sanity - Great Old Ones Campaign */}
              {S.scenario?.id === 'greatOldOnes' && greatOldOnesState && greatOldOnesState.doctrine && (
                <GlobalSanityIndicator state={greatOldOnesState} />
              )}

              <div className="flex items-center gap-1.5">
                <span className="text-cyan-300 text-[11px] tracking-wide">TURN</span>
                <span className="text-neon-green font-semibold text-sm" id="turn">1</span>
              </div>
              {layoutDensity !== 'minimal' && (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="text-cyan-300 text-[11px] tracking-wide">ACTIONS</span>
                    <span className="text-neon-green font-semibold text-sm" id="actionsDisplay">1/1</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-cyan-300 text-[11px] tracking-wide">DATE</span>
                    <span className="text-neon-green font-semibold text-sm" id="gameTimeDisplay">—</span>
                  </div>
                  {/* Strategic Resources Display */}
                  {(() => {
                    const playerNation = nations.find(n => n.isPlayer);
                    const hasStockpile = !!playerNation?.resourceStockpile;
                    const hasMarket = !!S.resourceMarket;

                    if (!hasStockpile && !hasMarket) {
                      return null;
                    }

                    return (
                      <div className="flex items-center gap-3 pl-3 ml-3 border-l border-cyan-500/30">
                        {playerNation && (
                          <div className="flex items-center gap-3 text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <span className="text-cyan-300 tracking-wide">PROD</span>
                              <span
                                className="font-mono font-semibold text-neon-green"
                                id="productionDisplay"
                              >
                                {Math.floor(playerNation.production ?? 0)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-cyan-300 tracking-wide">INTEL</span>
                              <span
                                className="font-mono font-semibold text-neon-green"
                                id="intelDisplay"
                              >
                                {Math.floor(playerNation.intel ?? 0)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-cyan-300 tracking-wide">GOLD</span>
                              <span
                                className="font-mono font-semibold text-neon-green"
                                id="goldDisplay"
                              >
                                {Math.floor(playerNation.gold ?? 0)}
                              </span>
                            </div>
                          </div>
                        )}
                        {hasStockpile && (
                          <ResourceStockpileDisplay nation={playerNation!} compact={true} />
                        )}
                        {hasMarket && S.resourceMarket && (
                          <MarketStatusBadge market={S.resourceMarket} />
                        )}
                      </div>
                    );
                  })()}
                </>
              )}
              </div>

              <div className="game-top-bar__actions flex items-center gap-2.5">
                {layoutDensity !== 'minimal' && (
                  <>
                    <div className="text-[11px] font-mono text-neon-magenta mr-3">
                      <span className="text-cyan-300 tracking-wide">DOOMSDAY</span>{' '}
                      <span id="doomsdayTime" className="font-bold">7:00</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setCivInfoPanelOpen(true);
                        AudioSys.playSFX('click');
                      }}
                      className="h-6 px-2 text-[11px] text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
                      title="Empire Status (Press I)"
                    >
                      EMPIRE INFO
                    </Button>

                    <MapModeBar
                      mode={mapStyle.mode}
                      onModeChange={handleMapModeChange}
                      descriptions={MAP_MODE_DESCRIPTIONS}
                      hotkeys={MAP_MODE_HOTKEYS}
                    />

                    {mapStyle.visual === 'morphing' && (
                      <MorphToggleButton
                        globeRef={globeSceneRef}
                        visible={true}
                      />
                    )}
                  </>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-[11px] text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                    >
                      <Menu className="h-3.5 w-3.5 mr-1" />
                      MENU
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-48 bg-black/95 border-cyan-500/50 backdrop-blur-sm z-50"
                  >
                  <DropdownMenuItem
                    onClick={() => {
                      setOptionsOpen(true);
                      AudioSys.playSFX('click');
                    }}
                    className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20 cursor-pointer focus:bg-cyan-500/20 focus:text-cyan-300"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Options
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator className="bg-cyan-500/30" />
                  
                  <DropdownMenuItem
                    onClick={() => {
                      toast({ title: 'Save Game', description: 'Save functionality coming soon' });
                      AudioSys.playSFX('click');
                    }}
                    className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20 cursor-pointer focus:bg-cyan-500/20 focus:text-cyan-300"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem
                    onClick={() => {
                      toast({ title: 'Load Game', description: 'Load functionality coming soon' });
                      AudioSys.playSFX('click');
                    }}
                    className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20 cursor-pointer focus:bg-cyan-500/20 focus:text-cyan-300"
                  >
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Load
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator className="bg-cyan-500/30" />
                  
                  <DropdownMenuItem
                    onClick={() => {
                      if (confirm('Are you sure you want to quit? Unsaved progress will be lost.')) {
                        navigate('/');
                        AudioSys.playSFX('click');
                      }
                    }}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/20 cursor-pointer focus:bg-red-500/20 focus:text-red-300"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Quit
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={toggleFullscreen}
                className="h-6 px-2 text-[11px] text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
              >
                {isFullscreen ? 'EXIT FS' : 'FULLSCREEN'}
              </Button>
              </div>
            </header>

            {layoutDensity !== 'minimal' && (
              <div className="game-top-ticker pointer-events-auto touch-auto">
                <NewsTicker
                  items={newsItems}
                  className="pointer-events-auto touch-auto"
                />
              </div>
            )}
          </div>

          {coopEnabled ? (
            layoutDensity === 'minimal' ? (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  className="fixed right-3 pointer-events-auto touch-auto z-40 h-10 w-10 rounded-full border border-cyan-500/40 bg-black/70 text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/20"
                  style={{ top: 'calc(var(--game-top-stack-offset) + 0.5rem)' }}
                  onClick={() => setShowMinimalApprovalQueue(true)}
                  aria-label="Open approval queue"
                >
                  <Handshake className="h-4 w-4" />
                </Button>
                <Sheet open={showMinimalApprovalQueue} onOpenChange={setShowMinimalApprovalQueue}>
                  <SheetContent
                    side="right"
                    className="w-[min(22rem,90vw)] border-cyan-500/40 bg-gradient-to-br from-slate-950/95 to-slate-900/95 text-cyan-100"
                  >
                    <SheetHeader>
                      <SheetTitle className="text-sm font-mono tracking-[0.3em] text-cyan-300">Approval Queue</SheetTitle>
                      <SheetDescription className="text-xs text-cyan-200/70">
                        Review and authorize cooperative operations.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="mt-4">
                      <ApprovalQueue />
                    </div>
                  </SheetContent>
                </Sheet>
              </>
            ) : (
              <div
                className="fixed right-3 pointer-events-auto touch-auto z-40 sm:w-80 w-[calc(100%-2rem)] max-w-[min(20rem,calc(100%-2rem))]"
                style={{ top: 'var(--game-top-stack-offset)' }}
              >
                <ApprovalQueue />
              </div>
            )
          ) : null}

          <div className="pointer-events-auto touch-auto">
            <ConflictResolutionDialog />
          </div>

          {layoutDensity !== 'minimal' && isStrikePlannerOpen ? (
            <div className="pointer-events-auto fixed bottom-24 right-3 z-40 sm:w-80 w-[calc(100%-2rem)] max-w-[min(20rem,calc(100%-2rem))] max-h-[60vh]">
              {strikePlannerPanel}
            </div>
          ) : null}

          {layoutDensity === 'minimal' ? (
            <>
              <Button
                size="icon"
                variant="ghost"
                className={`fixed bottom-24 right-4 z-40 h-10 w-10 rounded-full border border-cyan-500/40 bg-black/70 text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/20 ${
                  isStrikePlannerOpen ? 'ring-2 ring-cyan-400/70' : ''
                }`}
                onClick={() => setIsStrikePlannerOpen(true)}
                aria-label="Open strike planner"
              >
                <Target className="h-4 w-4" />
              </Button>
              <Sheet open={isStrikePlannerOpen} onOpenChange={setIsStrikePlannerOpen}>
                <SheetContent
                  side="right"
                  className="w-[min(22rem,90vw)] border-cyan-500/40 bg-gradient-to-br from-slate-950/95 to-slate-900/95 text-cyan-100"
                >
                  {strikePlannerPanel}
                </SheetContent>
              </Sheet>
            </>
          ) : null}

          {/* Bottom command interface stack */}
          {layoutDensity !== 'minimal' ? (
            <div
              className="fixed bottom-0 left-0 right-0 pointer-events-none touch-none z-50"
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              <div className="flex flex-col gap-1">
                <div className="h-16 sm:h-20 pointer-events-auto touch-auto">
                  <div className="h-full flex flex-wrap items-end justify-center gap-1 px-4 sm:flex-nowrap dock-container">
                    <Button
                      onClick={handleBuild}
                      variant="ghost"
                      size="icon"
                      data-role-locked={!buildAllowed}
                      data-tutorial="build-button"
                      className={`dock-button h-12 w-12 sm:h-14 sm:w-14 flex flex-col items-center justify-center gap-0.5 touch-manipulation ${
                        buildAllowed ? 'text-cyan-400 hover:text-neon-green hover:bg-cyan-500/10' : 'text-yellow-300/70 hover:text-yellow-200 hover:bg-yellow-500/10'
                      }`}
                      title={buildAllowed ? 'BUILD - Production and construction' : 'Await strategist approval or request authorization'}
                    >
                      <Factory className="h-5 w-5" />
                      <span className="text-[8px] font-mono">BUILD</span>
                    </Button>

                    <Button
                      onClick={handleResearch}
                      variant="ghost"
                      size="icon"
                      data-role-locked={!researchAllowed}
                      data-tutorial="research-button"
                      className={`dock-button h-12 w-12 sm:h-14 sm:w-14 flex flex-col items-center justify-center gap-0.5 touch-manipulation ${
                        researchAllowed ? 'text-cyan-400 hover:text-neon-green hover:bg-cyan-500/10' : 'text-yellow-300/70 hover:text-yellow-200 hover:bg-yellow-500/10'
                      }`}
                      title={researchAllowed ? 'RESEARCH - Technology advancement' : 'Strategist approval required to manage research'}
                    >
                      <Microscope className="h-5 w-5" />
                      <span className="text-[8px] font-mono">RESEARCH</span>
                    </Button>

                    <Button
                      onClick={handleIntelOperations}
                      variant="ghost"
                      size="icon"
                      data-role-locked={!intelAllowed}
                      data-tutorial="intel-button"
                      className={`dock-button h-12 w-12 sm:h-14 sm:w-14 flex flex-col items-center justify-center gap-0.5 touch-manipulation ${
                        intelAllowed ? 'text-cyan-400 hover:text-neon-green hover:bg-cyan-500/10' : 'text-yellow-300/70 hover:text-yellow-200 hover:bg-yellow-500/10'
                      }`}
                      title={intelAllowed ? 'INTEL - Intelligence & spy operations' : 'Tactician authorization required to operate intel'}
                    >
                      <Target className="h-5 w-5" />
                      <span className="text-[8px] font-mono">INTEL</span>
                    </Button>

                    <Button
                      onClick={handleSatelliteComms}
                      variant="ghost"
                      size="icon"
                      data-tutorial="satcom-button"
                      className="dock-button h-12 w-12 sm:h-14 sm:w-14 flex flex-col items-center justify-center gap-0.5 touch-manipulation text-cyan-400 hover:text-neon-green hover:bg-cyan-500/10"
                      title="SATCOM - Satellite communications & signal monitoring"
                    >
                      <Radio className="h-5 w-5" />
                      <span className="text-[8px] font-mono">SATCOM</span>
                    </Button>

                    {bioForgeUnlocked ? (
                      <Button
                        onClick={() => setIsBioWarfareOpen(true)}
                        variant="ghost"
                        size="icon"
                        data-role-locked={!bioWarfareAllowed}
                        disabled={!hasBioForgeAccess}
                        className={`dock-button h-12 w-12 sm:h-14 sm:w-14 flex flex-col items-center justify-center gap-0.5 touch-manipulation ${
                          hasBioForgeAccess
                            ? 'text-cyan-400 hover:text-neon-green hover:bg-cyan-500/10'
                            : 'text-yellow-300/70 hover:text-yellow-200 hover:bg-yellow-500/10'
                        }`}
                        title={
                          hasBioForgeAccess
                            ? 'BIOFORGE - Advanced bio-warfare operations'
                            : 'Requires Tier 3 BioForge access and co-commander approval'
                        }
                      >
                        <FlaskConical className="h-5 w-5" />
                        <span className="text-[8px] font-mono">BIO</span>
                      </Button>
                    ) : null}

                    <Button
                      onClick={() => setIsCulturePanelOpen(!isCulturePanelOpen)}
                      variant="ghost"
                      size="icon"
                      data-role-locked={!cultureAllowed}
                      className={`dock-button h-12 w-12 sm:h-14 sm:w-14 flex flex-col items-center justify-center gap-0.5 touch-manipulation ${
                        cultureAllowed ? 'text-cyan-400 hover:text-neon-green hover:bg-cyan-500/10' : 'text-yellow-300/70 hover:text-yellow-200 hover:bg-yellow-500/10'
                      }`}
                      title={cultureAllowed ? 'CULTURE - Cultural warfare & NGO operations' : 'Requires co-commander approval to launch culture ops'}
                    >
                      <Radio className="h-5 w-5" />
                      <span className="text-[8px] font-mono">CULTURE</span>
                    </Button>

                    <Button
                      onClick={() => setShowPolicyPanel(true)}
                      variant="ghost"
                      size="icon"
                      className="dock-button h-12 w-12 sm:h-14 sm:w-14 flex flex-col items-center justify-center gap-0.5 touch-manipulation text-cyan-400 hover:text-neon-green hover:bg-cyan-500/10"
                      title="POLICY - National strategic policies"
                    >
                      <Shield className="h-5 w-5" />
                      <span className="text-[8px] font-mono">POLICY</span>
                    </Button>

                    <Button
                      onClick={handleDiplomacy}
                      variant="ghost"
                      size="icon"
                      data-role-locked={!diplomacyAllowed}
                      className={`dock-button h-12 w-12 sm:h-14 sm:w-14 flex flex-col items-center justify-center gap-0.5 touch-manipulation ${
                        diplomacyAllowed ? 'text-cyan-400 hover:text-neon-green hover:bg-cyan-500/10' : 'text-yellow-300/70 hover:text-yellow-200 hover:bg-yellow-500/10'
                      }`}
                      title={diplomacyAllowed ? 'DIPLOMACY - International relations' : 'Diplomatic moves require strategist consent'}
                    >
                      <Handshake className="h-5 w-5" />
                      <span className="text-[8px] font-mono">DIPLO</span>
                    </Button>

                    <Button
                      onClick={() => setIsWarCouncilOpen(true)}
                      variant="ghost"
                      size="icon"
                      className="dock-button h-12 w-12 sm:h-14 sm:w-14 flex flex-col items-center justify-center gap-0.5 touch-manipulation text-cyan-400 hover:text-neon-green hover:bg-cyan-500/10"
                      title="WAR - Unified warfare command: declarations, conventional forces, and peace"
                    >
                      <Swords className="h-5 w-5" />
                      <span className="text-[8px] font-mono">WAR</span>
                    </Button>

                    {playerNation && playerGovernanceMetrics && governance.metrics[playerNation.id] ? (
                      <Button
                        onClick={() => setLeaderOverviewOpen(true)}
                        variant="ghost"
                        size="icon"
                        className="dock-button h-12 w-12 sm:h-14 sm:w-14 flex flex-col items-center justify-center gap-0.5 touch-manipulation text-cyan-400 hover:text-neon-green hover:bg-cyan-500/10"
                        title="LEADER - Review biography and abilities"
                      >
                        <Avatar className="h-6 w-6 border border-cyan-500/40 bg-black/60 text-[10px]">
                          {playerLeaderImage ? (
                            <AvatarImage
                              src={playerLeaderImage}
                              alt={currentPlayerLeaderName ? `${currentPlayerLeaderName} portrait` : 'Leader portrait'}
                            />
                          ) : null}
                          <AvatarFallback>{playerLeaderInitials}</AvatarFallback>
                        </Avatar>
                        <span className="text-[8px] font-mono">LEADER</span>
                      </Button>
                    ) : null}

                    <div className="dock-divider w-px h-8 bg-cyan-500/30 mx-2" />

                    <Button
                      onClick={handleAttack}
                      variant="ghost"
                      size="icon"
                      className="dock-button h-12 w-12 sm:h-14 sm:w-14 text-red-400 hover:text-red-300 hover:bg-red-500/10 flex flex-col items-center justify-center gap-0.5 touch-manipulation"
                      title="ATTACK - Launch nuclear strike (select target in Strike Planner)"
                    >
                      <Zap className="h-5 w-5" />
                      <span className="text-[8px] font-mono">ATTACK</span>
                    </Button>

                    <div className="dock-divider w-px h-8 bg-cyan-500/30 mx-2" />

                    <Button
                      onClick={handleEndTurn}
                      variant="ghost"
                      className="dock-button h-12 sm:h-14 px-4 sm:px-6 text-neon-yellow hover:text-neon-green hover:bg-cyan-500/10 flex flex-col items-center justify-center gap-0.5 touch-manipulation"
                      title="END TURN"
                    >
                      <ArrowRight className="h-5 w-5" />
                      <span className="text-[8px] font-mono">END TURN</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-full border border-cyan-500/40 bg-black/70 px-4 py-2 text-[11px] font-mono tracking-[0.3em] text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/20"
                onClick={() => setShowMinimalCommandSheet(true)}
              >
                <Menu className="mr-2 h-4 w-4" />
                ACTIONS
              </Button>
              <Sheet open={showMinimalCommandSheet} onOpenChange={setShowMinimalCommandSheet}>
                <SheetContent
                  side="bottom"
                  className="h-auto max-h-[80vh] overflow-y-auto border-t border-cyan-500/40 bg-gradient-to-t from-slate-950/95 to-slate-900/95 text-cyan-100"
                >
                  <SheetHeader>
                    <SheetTitle className="text-sm font-mono tracking-[0.3em] text-cyan-300">Command Actions</SheetTitle>
                    <SheetDescription className="text-xs text-cyan-200/70">
                      Quick access to the full operations bar while in minimal HUD mode.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <Button
                      onClick={() => {
                        handleBuild();
                        setShowMinimalCommandSheet(false);
                      }}
                      variant="ghost"
                      size="icon"
                      data-role-locked={!buildAllowed}
                      data-tutorial="build-button"
                      className={`h-16 w-full flex flex-col items-center justify-center gap-1 rounded border border-cyan-500/30 bg-black/60 text-[10px] font-mono ${
                        buildAllowed ? 'text-cyan-300 hover:text-neon-green hover:bg-cyan-500/10' : 'text-yellow-300/70 hover:text-yellow-200 hover:bg-yellow-500/10'
                      }`}
                      title={buildAllowed ? 'BUILD - Production and construction' : 'Await strategist approval or request authorization'}
                    >
                      <Factory className="h-5 w-5" />
                      BUILD
                    </Button>
                    <Button
                      onClick={() => {
                        handleResearch();
                        setShowMinimalCommandSheet(false);
                      }}
                      variant="ghost"
                      size="icon"
                      data-role-locked={!researchAllowed}
                      data-tutorial="research-button"
                      className={`h-16 w-full flex flex-col items-center justify-center gap-1 rounded border border-cyan-500/30 bg-black/60 text-[10px] font-mono ${
                        researchAllowed ? 'text-cyan-300 hover:text-neon-green hover:bg-cyan-500/10' : 'text-yellow-300/70 hover:text-yellow-200 hover:bg-yellow-500/10'
                      }`}
                      title={researchAllowed ? 'RESEARCH - Technology advancement' : 'Strategist approval required to manage research'}
                    >
                      <Microscope className="h-5 w-5" />
                      RESEARCH
                    </Button>
                    <Button
                      onClick={() => {
                        handleIntelOperations();
                        setShowMinimalCommandSheet(false);
                      }}
                      variant="ghost"
                      size="icon"
                      data-role-locked={!intelAllowed}
                      data-tutorial="intel-button"
                      className={`h-16 w-full flex flex-col items-center justify-center gap-1 rounded border border-cyan-500/30 bg-black/60 text-[10px] font-mono ${
                        intelAllowed ? 'text-cyan-300 hover:text-neon-green hover:bg-cyan-500/10' : 'text-yellow-300/70 hover:text-yellow-200 hover:bg-yellow-500/10'
                      }`}
                      title={intelAllowed ? 'INTEL - Intelligence & spy operations' : 'Tactician authorization required to operate intel'}
                    >
                      <Target className="h-5 w-5" />
                      INTEL
                    </Button>
                    {bioForgeUnlocked ? (
                      <Button
                        onClick={() => {
                          setIsBioWarfareOpen(true);
                          setShowMinimalCommandSheet(false);
                        }}
                        variant="ghost"
                        size="icon"
                        data-role-locked={!bioWarfareAllowed}
                        disabled={!hasBioForgeAccess}
                        className={`h-16 w-full flex flex-col items-center justify-center gap-1 rounded border border-cyan-500/30 bg-black/60 text-[10px] font-mono ${
                          hasBioForgeAccess
                            ? 'text-cyan-300 hover:text-neon-green hover:bg-cyan-500/10'
                            : 'text-yellow-300/70 hover:text-yellow-200 hover:bg-yellow-500/10'
                        }`}
                        title={
                          hasBioForgeAccess
                            ? 'BIOFORGE - Advanced bio-warfare operations'
                            : 'Requires Tier 3 BioForge access and co-commander approval'
                        }
                      >
                        <FlaskConical className="h-5 w-5" />
                        BIOFORGE
                      </Button>
                    ) : null}
                    <Button
                      onClick={() => {
                        setIsCulturePanelOpen(!isCulturePanelOpen);
                        setShowMinimalCommandSheet(false);
                      }}
                      variant="ghost"
                      size="icon"
                      data-role-locked={!cultureAllowed}
                      className={`h-16 w-full flex flex-col items-center justify-center gap-1 rounded border border-cyan-500/30 bg-black/60 text-[10px] font-mono ${
                        cultureAllowed ? 'text-cyan-300 hover:text-neon-green hover:bg-cyan-500/10' : 'text-yellow-300/70 hover:text-yellow-200 hover:bg-yellow-500/10'
                      }`}
                      title={cultureAllowed ? 'CULTURE - Cultural warfare (simplified)' : 'Requires co-commander approval to launch culture ops'}
                    >
                      <Radio className="h-5 w-5" />
                      CULTURE
                    </Button>
                    <Button
                      onClick={() => {
                        setShowPolicyPanel(true);
                        setShowMinimalCommandSheet(false);
                      }}
                      variant="ghost"
                      size="icon"
                      className="h-16 w-full flex flex-col items-center justify-center gap-1 rounded border border-cyan-500/30 bg-black/60 text-[10px] font-mono text-cyan-300 hover:text-neon-green hover:bg-cyan-500/10"
                      title="POLICY - National strategic policies"
                    >
                      <Shield className="h-5 w-5" />
                      POLICY
                    </Button>
                    <Button
                      onClick={() => {
                        handleDiplomacy();
                        setShowMinimalCommandSheet(false);
                      }}
                      variant="ghost"
                      size="icon"
                      data-role-locked={!diplomacyAllowed}
                      className={`h-16 w-full flex flex-col items-center justify-center gap-1 rounded border border-cyan-500/30 bg-black/60 text-[10px] font-mono ${
                        diplomacyAllowed ? 'text-cyan-300 hover:text-neon-green hover:bg-cyan-500/10' : 'text-yellow-300/70 hover:text-yellow-200 hover:bg-yellow-500/10'
                      }`}
                      title={diplomacyAllowed ? 'DIPLOMACY - International relations' : 'Diplomatic moves require strategist consent'}
                    >
                      <Handshake className="h-5 w-5" />
                      DIPLO
                    </Button>
                    <Button
                      onClick={() => {
                        setIsWarCouncilOpen(true);
                        setShowMinimalCommandSheet(false);
                      }}
                      variant="ghost"
                      size="icon"
                      className="h-16 w-full flex flex-col items-center justify-center gap-1 rounded border border-cyan-500/30 bg-black/60 text-[10px] font-mono text-cyan-300 hover:text-neon-green hover:bg-cyan-500/10"
                      title="WAR - Unified warfare command: declarations, conventional forces, and peace"
                    >
                      <Swords className="h-5 w-5" />
                      WAR
                    </Button>
                    {playerNation && playerGovernanceMetrics ? (
                      <Button
                        onClick={() => {
                          setLeaderOverviewOpen(true);
                          setShowMinimalCommandSheet(false);
                        }}
                        variant="ghost"
                        size="icon"
                        className="h-16 w-full flex flex-col items-center justify-center gap-1 rounded border border-cyan-500/30 bg-black/60 text-[10px] font-mono text-cyan-300 hover:text-neon-green hover:bg-cyan-500/10"
                        title="LEADER - Review biography and abilities"
                      >
                        <Avatar className="h-10 w-10 border border-cyan-500/40 bg-black/60 text-[12px]">
                          {playerLeaderImage ? (
                            <AvatarImage
                              src={playerLeaderImage}
                              alt={currentPlayerLeaderName ? `${currentPlayerLeaderName} portrait` : 'Leader portrait'}
                            />
                          ) : null}
                          <AvatarFallback>{playerLeaderInitials}</AvatarFallback>
                        </Avatar>
                        LEADER
                      </Button>
                    ) : null}
                    <Button
                      onClick={() => {
                        handleAttack();
                        setShowMinimalCommandSheet(false);
                      }}
                      variant="ghost"
                      size="icon"
                      className="h-16 w-full flex flex-col items-center justify-center gap-1 rounded border border-red-500/40 bg-black/60 text-[10px] font-mono text-red-300 hover:text-red-200 hover:bg-red-500/10"
                      title="ATTACK - Launch nuclear strike (select target in Strike Planner)"
                    >
                      <Zap className="h-5 w-5" />
                      ATTACK
                    </Button>
                    <Button
                      onClick={() => {
                        handleEndTurn();
                        setShowMinimalCommandSheet(false);
                      }}
                      variant="ghost"
                      className="h-16 w-full flex flex-col items-center justify-center gap-1 rounded border border-cyan-500/30 bg-black/60 text-[10px] font-mono text-neon-yellow hover:text-neon-green hover:bg-cyan-500/10"
                      title="END TURN"
                    >
                      <ArrowRight className="h-5 w-5" />
                      END TURN
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </>
          )}

          {/* Events log - moved to bottom-4 next to buttons */}
          <div className="fixed bottom-4 left-4 w-80 max-h-32 bg-black/80 border border-cyan-500/30 backdrop-blur-sm pointer-events-auto rounded overflow-hidden z-40">
            <div className="text-[10px] font-mono text-cyan-400 bg-black/60 px-2 py-1 border-b border-cyan-500/30">
              EVENTS
            </div>
            <div id="log" className="text-[10px] font-mono text-cyan-300 p-2 overflow-y-auto max-h-24">
              {/* Populated by log() function */}
            </div>
          </div>
        </div>
      </div>

      <Sheet open={optionsOpen} onOpenChange={setOptionsOpen}>
        <SheetContent
          side="right"
          className="options-sheet"
        >
          <SheetHeader>
            <SheetTitle className="options-sheet__title">COMMAND OPTIONS</SheetTitle>
            <SheetDescription className="options-sheet__description">
              Tune the command interface to match your control room preferences.
            </SheetDescription>
          </SheetHeader>
          <OptionsMenu
            theme={theme}
            onThemeChange={setTheme}
            mapStyle={mapStyle}
            onMapStyleChange={handleMapStyleChange}
            dayNightAutoCycleEnabled={dayNightAutoCycleEnabled}
            onDayNightAutoCycleToggle={handleDayNightAutoCycleToggle}
            showInGameFeatures={true}
            onChange={updateDisplay}
            currentTurn={S.turn}
            musicEnabled={musicEnabled}
            onMusicToggle={handleMusicToggle}
            sfxEnabled={sfxEnabled}
            onSfxToggle={handleSfxToggle}
            ambientEnabled={ambientEnabled}
            onAmbientToggle={handleAmbientToggle}
            musicVolume={musicVolume}
            onMusicVolumeChange={handleMusicVolumeChange}
            ambientVolume={ambientVolume}
            onAmbientVolumeChange={handleAmbientVolumeChange}
            musicSelection={musicSelection}
            onMusicTrackChange={handleMusicTrackChange}
            onNextTrack={handleNextTrack}
            activeTrackMessage={activeTrackMessage}
            musicTracks={musicTracks}
            showVectorOverlay={showVectorOverlay}
            onVectorOverlayToggle={setShowVectorOverlay}
            showVIIRSLayer={viirsHook.enabled}
            onVIIRSLayerToggle={viirsHook.setEnabled}
            showWeatherClouds={weatherRadarHook.enabled}
            onWeatherCloudsToggle={weatherRadarHook.setEnabled}
          />
        </SheetContent>
      </Sheet>

      <GovernanceEventDialog
        open={Boolean(governance.activeEvent)}
        event={governance.activeEvent}
        metrics={governance.activeEvent ? governance.metrics[governance.activeEvent.nationId] : undefined}
        onSelect={(optionId) => {
          const outcome = governance.selectOption(optionId);
          if (outcome) {
            toast({
              title: 'Governance Decision Logged',
              description: outcome.description,
            });
            updateDisplay();
          }
        }}
        onDismiss={() => {
          governance.dismissEvent();
          updateDisplay();
        }}
      />

      {player && governance.metrics[player.id] ? (
        <GovernanceDetailPanel
          open={showGovernanceDetails}
          onOpenChange={setShowGovernanceDetails}
          metrics={governance.metrics[player.id]}
          nationName={player.name}
          instability={governance.metrics[player.id].instability || 0}
          production={player.production}
          intel={player.intel || 0}
        />
      ) : null}

      {player ? (
        <PolicySelectionPanel
          open={showPolicyPanel}
          onOpenChange={setShowPolicyPanel}
          activePolicies={policySystem.activePolicies}
          availableGold={player.gold || 0}
          availableProduction={player.production}
          availableIntel={player.intel || 0}
          currentTurn={S.turn}
          playerActiveFocus={playerActiveFocus}
          focusPaths={focusPaths}
          availableFocusLookup={availableFocusLookup}
          onStartFocus={handleStartFocus}
          onCancelFocus={handleCancelFocus}
          onEnactPolicy={(policyId) => {
            const result = policySystem.enactPolicy(policyId);
            if (result.success) {
              toast({
                title: 'Policy Enacted',
                description: 'The policy has been successfully enacted.',
              });
              updateDisplay();
            } else {
              toast({
                title: 'Failed to Enact Policy',
                description: result.reason || 'Unknown error',
                variant: 'destructive',
              });
            }
          }}
          onRepealPolicy={(policyId) => {
            const result = policySystem.repealPolicy(policyId);
            if (result.success) {
              toast({
                title: 'Policy Repealed',
                description: 'The policy has been successfully repealed.',
              });
              updateDisplay();
            } else {
              toast({
                title: 'Failed to Repeal Policy',
                description: result.reason || 'Unknown error',
                variant: 'destructive',
              });
            }
          }}
        />
      ) : null}

      <Sheet open={isNationalFocusOpen} onOpenChange={setIsNationalFocusOpen}>
        <SheetContent
          side="right"
          className="w-[min(26rem,90vw)] border-cyan-500/40 bg-gradient-to-br from-slate-950/95 to-slate-900/95 text-cyan-100"
        >
          <SheetHeader>
            <SheetTitle className="text-xl font-semibold text-cyan-200">
              National Focus
            </SheetTitle>
            <SheetDescription className="text-sm text-cyan-300/70">
              Direct long-term strategic initiatives. Focuses progress automatically at the
              end of each turn.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 flex h-full flex-col gap-4 overflow-y-auto pr-1">
            {!playerNationId ? (
              <div className="rounded-lg border border-cyan-500/30 bg-slate-950/70 p-4 text-sm text-cyan-200/80">
                National focus controls will unlock once a player nation is selected.
              </div>
            ) : !focusPaths ? (
              <div className="rounded-lg border border-cyan-500/30 bg-slate-950/70 p-4 text-sm text-cyan-200/80">
                Initializing focus trees...
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-cyan-500/30 bg-slate-950/70 p-4">
                  {playerActiveFocus ? (
                    <div className="space-y-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-base font-semibold text-cyan-100">
                            {playerActiveFocus.focus.name}
                          </p>
                          <p className="mt-1 text-sm text-cyan-300/80">
                            {playerActiveFocus.focus.description}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelFocus}
                          className="text-red-300 hover:text-red-200 hover:bg-red-500/10"
                        >
                          Cancel Focus
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Progress value={playerActiveFocus.progress} className="h-2 bg-cyan-500/20" />
                        <div className="flex items-center justify-between text-xs text-cyan-300/80">
                          <span>{Math.round(playerActiveFocus.progress)}% complete</span>
                          <span>{playerActiveFocus.turnsRemaining} turns remaining</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-sm text-cyan-200/85">
                      <p className="font-semibold text-cyan-100">No active focus.</p>
                      <p>Select a focus below to guide your nation&apos;s strategic efforts.</p>
                    </div>
                  )}
                </div>

                {Object.entries(focusPaths).map(([branch, focuses]) => {
                  const metadata = FOCUS_BRANCH_METADATA[branch as keyof typeof FOCUS_BRANCH_METADATA];
                  const branchHasFocuses = focuses.length > 0;

                  return (
                    <div key={branch} className="rounded-lg border border-cyan-500/20 bg-slate-950/60 p-4">
                      <div className="flex flex-col gap-1">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-200">
                          {metadata?.title ?? branch}
                        </h3>
                        {metadata?.description ? (
                          <p className="text-xs text-cyan-300/70">{metadata.description}</p>
                        ) : null}
                      </div>

                      <div className="mt-3 space-y-3">
                        {branchHasFocuses
                          ? focuses.map((focus) => {
                              const focusInfo = availableFocusLookup.get(focus.id);
                              if (!focusInfo) {
                                return null;
                              }

                              let statusLabel: string | null = null;
                              let statusClass = 'text-xs font-semibold uppercase tracking-wide';

                              if (focusInfo.isCompleted) {
                                statusLabel = 'Completed';
                                statusClass += ' text-neon-green';
                              } else if (focusInfo.isActive) {
                                statusLabel = 'In Progress';
                                statusClass += ' text-cyan-200';
                              } else if (focusInfo.isLocked) {
                                statusLabel = 'Locked';
                                statusClass += ' text-red-300';
                              }

                              const canStart =
                                focusInfo.canStart && !focusInfo.isActive && !focusInfo.isCompleted;

                              return (
                                <div
                                  key={focus.id}
                                  className="rounded-lg border border-cyan-500/30 bg-slate-950/80 p-3"
                                >
                                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                      <p className="text-sm font-semibold text-cyan-100">{focus.name}</p>
                                      <p className="mt-1 text-xs text-cyan-300/80">{focus.description}</p>
                                    </div>
                                    {statusLabel ? <span className={statusClass}>{statusLabel}</span> : null}
                                  </div>

                                  <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-cyan-300/80">
                                    <span>Duration: {focus.completionTime} turns</span>
                                    {focus.prerequisites.length > 0 ? (
                                      <span>Prerequisites: {focus.prerequisites.length}</span>
                                    ) : null}
                                  </div>

                                  {focusInfo.missingPrerequisites.length > 0 && !focusInfo.canStart ? (
                                    <p className="mt-2 text-xs text-yellow-300">
                                      Requires: {focusInfo.missingPrerequisites.join(', ')}
                                    </p>
                                  ) : null}

                                  {focusInfo.isLocked ? (
                                    <p className="mt-2 text-xs text-red-300">
                                      Locked by a mutually exclusive focus path.
                                    </p>
                                  ) : null}

                                  {canStart ? (
                                    <div className="mt-3 flex justify-end">
                                      <Button
                                        size="sm"
                                        onClick={() => handleStartFocus(focusInfo)}
                                        className="bg-cyan-500 text-black hover:bg-cyan-400"
                                      >
                                        Start Focus
                                      </Button>
                                    </div>
                                  ) : null}
                                </div>
                              );
                            })
                          : (
                              <p className="text-xs text-cyan-300/70">
                                No focuses available in this branch yet.
                              </p>
                            )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={Boolean(pendingLaunch) && !consequencePreview} onOpenChange={(open) => { if (!open) resetLaunchControl(); }}>
        <DialogContent className="max-w-2xl border border-cyan-500/40 bg-gradient-to-br from-slate-900/95 to-slate-800/95 text-cyan-100 backdrop-blur-sm">
          <DialogHeader className="border-b border-cyan-500/30 bg-black/40 -m-4 sm:-m-6 mb-4 sm:mb-6 p-4 sm:p-6">
            <DialogTitle className="text-2xl font-bold text-cyan-300 font-mono uppercase tracking-wider">Launch Control</DialogTitle>
            <DialogDescription className="text-sm text-gray-400 mt-1">
              Confirm strategic strike parameters before authorizing launch.
            </DialogDescription>
          </DialogHeader>
          {pendingLaunch && !consequencePreview && (
            <div className="space-y-6">
              <div className="rounded border border-cyan-500/40 bg-cyan-950/20 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-[0.3em] text-cyan-400">Target</span>
                  <span className="text-base font-semibold text-cyan-100">{pendingLaunch.target.name}</span>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-cyan-200/80 sm:grid-cols-2 sm:text-sm">
                  <div>Population Estimate: {Math.floor(pendingLaunch.target.population)}M</div>
                  <div>Current DEFCON: {S.defcon}</div>
                  <div>Actions Remaining: {S.actionsRemaining}</div>
                  <div>Radiation Index: {Math.max(0, Math.round((S.globalRadiation || 0) * 10) / 10)}</div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.25em] text-cyan-400">Warhead Yield</p>
                <RadioGroup
                  value={selectedWarheadYield !== null ? String(selectedWarheadYield) : undefined}
                  onValueChange={(value) => setSelectedWarheadYield(Number(value))}
                  className="space-y-3"
                >
                  {pendingLaunch.warheads.map(warhead => {
                    const optionId = `warhead-${warhead.yield}`;
                    const disabled = warhead.count <= 0 || S.defcon > warhead.requiredDefcon;
                    return (
                      <div
                        key={warhead.yield}
                        className={`flex items-start gap-3 rounded border border-cyan-500/40 bg-cyan-950/10 p-3 ${disabled ? 'opacity-50' : ''}`}
                      >
                        <RadioGroupItem
                          value={String(warhead.yield)}
                          id={optionId}
                          disabled={disabled}
                          className="mt-1 border-cyan-400 data-[state=checked]:border-cyan-200 data-[state=checked]:bg-cyan-400"
                        />
                        <Label htmlFor={optionId} className="flex-1 cursor-pointer text-sm text-cyan-100">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{warhead.yield}MT Payload</span>
                            <span className="text-xs uppercase tracking-[0.25em] text-cyan-300">Stock: {warhead.count}</span>
                          </div>
                          <div className="mt-1 text-xs text-cyan-300/80">Requires DEFCON ≤ {warhead.requiredDefcon}</div>
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.25em] text-cyan-400">Delivery Platform</p>
                <RadioGroup
                  value={selectedDeliveryMethod ?? undefined}
                  onValueChange={(value) => setSelectedDeliveryMethod(value as DeliveryMethod)}
                  className="space-y-3"
                >
                  {pendingLaunch.deliveryOptions.map(option => {
                    const optionId = `delivery-${option.id}`;
                    const disabled = option.count <= 0;
                    return (
                      <div
                        key={option.id}
                        className={`flex items-start gap-3 rounded border border-cyan-500/40 bg-cyan-950/10 p-3 ${disabled ? 'opacity-50' : ''}`}
                      >
                        <RadioGroupItem
                          value={option.id}
                          id={optionId}
                          disabled={disabled}
                          className="mt-1 border-cyan-400 data-[state=checked]:border-cyan-200 data-[state=checked]:bg-cyan-400"
                        />
                        <Label htmlFor={optionId} className="flex-1 cursor-pointer text-sm text-cyan-100">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{option.label}</span>
                            <span className="text-xs uppercase tracking-[0.25em] text-cyan-300">Ready: {option.count}</span>
                          </div>
                          <div className="mt-1 text-xs text-cyan-300/80">
                            {option.id === 'missile'
                              ? 'High-speed ICBM launch with MIRV capability.'
                              : option.id === 'bomber'
                                ? 'Crewed bomber sortie risking enemy air defenses.'
                                : 'Stealth launch from submerged ballistic submarine.'}
                          </div>
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              </div>
            </div>
          )}
          <DialogFooter className="mt-6 gap-3">
            <Button
              variant="outline"
              onClick={resetLaunchControl}
              className="border-cyan-500 text-cyan-200 hover:bg-cyan-500/10 hover:text-cyan-100"
            >
              Abort
            </Button>
            <Button
              onClick={confirmPendingLaunch}
              disabled={!pendingLaunch || consequencePreview !== null || selectedWarheadYield === null || !selectedDeliveryMethod}
              className="bg-cyan-500 text-black hover:bg-cyan-400 disabled:opacity-50"
            >
              Confirm Launch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showModal} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 border border-cyan-500/40 text-cyan-100 max-w-6xl max-h-[85vh] overflow-y-auto backdrop-blur-sm">
          <DialogHeader className="border-b border-cyan-500/30 bg-black/40 -m-4 sm:-m-6 mb-4 sm:mb-6 p-4 sm:p-6">
            <DialogTitle className="text-2xl font-bold text-cyan-300 font-mono uppercase tracking-wider">{modalContent.title}</DialogTitle>
          </DialogHeader>
          {(() => {
            const content = typeof modalContent.content === 'function' ? modalContent.content() : modalContent.content;
            if (typeof content === 'string') {
              return <div dangerouslySetInnerHTML={{ __html: content }} />;
            }
            return content ?? null;
          })()}
        </DialogContent>
      </Dialog>

      {isBioWarfareOpen && (() => {
        const player = PlayerManager.get();
        if (!player) return null;

        const enemies = nations.filter(n => !n.eliminated && n.id !== player.id);
        const activeBioAttacks = nations.flatMap(n => n.activeBioAttacks || []);
        const labTier = labFacility.tier as BioLabTier;
        const advancedEnabled =
          labTier >= 3 && pandemicIntegrationEnabled && bioWarfareEnabled;

        if (advancedEnabled) {
          const availableNations = enemies.map(enemy => ({
            id: enemy.id,
            name: enemy.name,
            intelligence: enemy.intel ?? 0,
          }));

          return (
            <BioWarfareLab
              open={isBioWarfareOpen}
              onOpenChange={setIsBioWarfareOpen}
              plagueState={plagueState}
              enabled={advancedEnabled}
              labTier={labTier}
              availableNations={availableNations}
              playerActions={S.actionsRemaining}
              playerIntel={player.intel ?? 0}
              onSelectPlagueType={selectPlagueType}
              onEvolveNode={(nodeId) => evolveNode({ nodeId })}
              onDevolveNode={(nodeId) => devolveNode({ nodeId })}
              onDeployBioWeapon={(selections) => deployBioWeapon(selections, S.turn)}
            />
          );
        }

        return (
          <SimplifiedBioWarfarePanel
            player={player}
            enemies={enemies}
            activeBioAttacks={activeBioAttacks}
            onResearchBioWeapon={handleBioWeaponResearch}
            onUpgradeBioDefense={handleBioDefenseUpgrade}
            onDeployBioWeapon={handleSimplifiedBioWeaponDeploy}
            onClose={() => setIsBioWarfareOpen(false)}
          />
        );
      })()}

      <Dialog open={isIntelOperationsOpen} onOpenChange={setIsIntelOperationsOpen}>
        <DialogContent className="max-w-4xl border border-cyan-500/40 bg-gradient-to-br from-slate-900/95 to-slate-800/95 text-cyan-100 backdrop-blur-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-cyan-500/30 bg-black/40 -m-4 sm:-m-6 mb-4 sm:mb-6 p-4 sm:p-6">
            <DialogTitle className="text-2xl font-bold text-cyan-300 font-mono uppercase tracking-wider">
              Intelligence & Espionage Operations
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-400 mt-1">
              Intel operations, spy networks, and counter-intelligence
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="intel" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-black/40 border border-cyan-500/30">
              <TabsTrigger value="intel" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">
                Intel Ops
              </TabsTrigger>
              <TabsTrigger value="spy" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">
                Spy Network
              </TabsTrigger>
            </TabsList>
            <TabsContent value="intel" className="mt-4">
              <UnifiedIntelOperationsPanel
                player={PlayerManager.get() || {} as Nation}
                enemies={nations.filter(n => !n.isPlayer && !n.eliminated)}
                onDeploySatellite={handleDeploySatellite}
                onSabotageOperation={handleSabotageOperation}
                onCyberAttack={handleCyberAttackOperation}
                operationCooldowns={PlayerManager.get()?.intelOperationCooldowns}
              />
            </TabsContent>
            <TabsContent value="spy" className="mt-4">
              {playerNation ? (
                <SpyNetworkPanel
                  player={playerNation}
                  enemies={enemyNations}
                  onRecruitSpy={(cover, targetNation, specialization) => {
                    spyNetwork.recruitSpy(playerNation.id, {
                      cover,
                      targetNation,
                      specialization,
                    });
                  }}
                  onLaunchMission={(spyId, targetNationId, missionType) => {
                    spyNetwork.launchMission(playerNation.id, spyId, targetNationId, missionType);
                  }}
                  onLaunchCounterIntel={() => {
                    spyNetwork.launchCounterIntel(playerNation.id);
                  }}
                  calculateMissionSuccessChance={(spyId, targetNationId, missionType) =>
                    spyNetwork.calculateMissionSuccessChance(spyId, playerNation.id, targetNationId, missionType)
                  }
                  calculateDetectionRisk={(spyId, targetNationId, missionType) =>
                    spyNetwork.calculateDetectionRisk(spyId, playerNation.id, targetNationId, missionType)
                  }
                />
              ) : (
                <div className="text-sm text-slate-400">Player nation not initialized.</div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Satellite Communications Panel */}
      <Dialog open={isSatelliteCommsOpen} onOpenChange={setIsSatelliteCommsOpen}>
        <DialogContent className="max-w-4xl border border-cyan-500/40 bg-gradient-to-br from-slate-900/95 to-slate-800/95 text-cyan-100 backdrop-blur-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-cyan-500/30 bg-black/40 -m-4 sm:-m-6 mb-4 sm:mb-6 p-4 sm:p-6">
            <DialogTitle className="text-2xl font-bold text-cyan-300 font-mono uppercase tracking-wider flex items-center gap-2">
              <Satellite className="w-6 h-6" />
              Satellite Communications
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-400 mt-1">
              Monitor satellite orbits, ground stations, and signal transmissions
            </DialogDescription>
          </DialogHeader>
          <SatelliteGroundStationPanel
            state={satelliteSignals.state}
            playerId={playerNationId ?? undefined}
            onDeploySatellite={(type) => {
              if (playerNationId) {
                satelliteSignals.deploySatellite(playerNationId, type);
              }
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isWarCouncilOpen} onOpenChange={setIsWarCouncilOpen}>
        <DialogContent className="max-w-6xl border border-cyan-500/40 bg-gradient-to-br from-slate-900/95 to-slate-800/95 text-cyan-100 backdrop-blur-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-cyan-500/30 bg-black/40 -m-4 sm:-m-6 mb-4 sm:mb-6 p-4 sm:p-6">
            <DialogTitle className="text-2xl font-bold text-cyan-300 font-mono uppercase tracking-wider">
              Warfare Command
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-400 mt-1">
              Manage declarations, conventional forces, and peace negotiations.
            </DialogDescription>
          </DialogHeader>
          {playerNation ? (
            <ConsolidatedWarModal
              player={playerNation}
              nations={nations}
              currentTurn={S.turn}
              onDeclareWar={handleDeclareWar}
              onOfferPeace={handleOfferPeace}
              onAcceptPeace={handleAcceptPeace}
              onRejectPeace={handleRejectPeace}
              conventionalTerritories={conventionalTerritories}
              conventionalTemplatesMap={conventionalTemplatesMap}
              armyGroups={playerArmyGroupSummaries}
              strategicOutlinerGroups={strategicOutlinerGroups}
              isOutlinerCollapsed={isOutlinerCollapsed}
              onOutlinerToggle={handleOutlinerToggle}
              conventionalLogs={conventionalLogs}
              trainConventionalUnit={trainConventionalUnit}
              resolveConventionalAttack={resolveConventionalAttack}
              moveConventionalArmies={moveConventionalArmiesWithAnimation}
              resolveConventionalProxyEngagement={resolveConventionalProxyEngagement}
              placeConventionalReinforcements={placeConventionalReinforcements}
              getConventionalReinforcements={getConventionalReinforcements}
              toast={toast}
              addNewsItem={addNewsItem}
            />
          ) : (
            <div className="text-sm text-slate-400">Player nation not initialized.</div>
          )}
        </DialogContent>
      </Dialog>

      {/* Streamlined Culture Panel */}
      <Dialog open={isCulturePanelOpen} onOpenChange={setIsCulturePanelOpen}>
        <DialogContent className="max-w-5xl border border-cyan-500/40 bg-gradient-to-br from-slate-900/95 to-slate-800/95 text-cyan-100 backdrop-blur-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-cyan-500/30 bg-black/40 -m-4 sm:-m-6 mb-4 sm:mb-6 p-4 sm:p-6">
            <DialogTitle className="text-2xl font-bold text-cyan-300 font-mono uppercase tracking-wider">
              Cultural Operations
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-400 mt-1">
              Launch propaganda campaigns, build cultural wonders, and set immigration policies
            </DialogDescription>
          </DialogHeader>
          {advancedGameState?.advancedPropaganda && playerNation ? (
            <Tabs defaultValue="advanced" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="advanced">Advanced Propaganda</TabsTrigger>
                <TabsTrigger value="streamlined">Core Culture & Immigration</TabsTrigger>
              </TabsList>
              <TabsContent value="advanced" className="mt-4">
                <AdvancedPropagandaPanel
                  gameState={advancedGameState}
                  nation={playerNation}
                  allNations={nations}
                  onUpdate={handleAdvancedPropagandaUpdate}
                  onLog={log}
                />
              </TabsContent>
              <TabsContent value="streamlined" className="mt-4">
                <StreamlinedCulturePanel
                  player={PlayerManager.get() || {} as Nation}
                  enemies={nations.filter(n => !n.eliminated && n.id !== (PlayerManager.get()?.id))}
                  allNations={nations}
                  currentTurn={S.turn}
                  onLaunchPropaganda={handleLaunchPropaganda}
                  onBuildWonder={handleBuildWonder}
                  onSetImmigrationPolicy={handleSetImmigrationPolicy}
                  currentImmigrationPolicy={(PlayerManager.get()?.currentImmigrationPolicy as ImmigrationPolicy) || 'restricted'}
                  onNGORefresh={() => {
                    const updatedNations = GameStateManager.getNations();
                    setNations(updatedNations);
                    PlayerManager.setNations(updatedNations);
                  }}
                  onClose={() => setIsCulturePanelOpen(false)}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <StreamlinedCulturePanel
              player={PlayerManager.get() || {} as Nation}
              enemies={nations.filter(n => !n.eliminated && n.id !== (PlayerManager.get()?.id))}
              allNations={nations}
              currentTurn={S.turn}
              onLaunchPropaganda={handleLaunchPropaganda}
              onBuildWonder={handleBuildWonder}
              onSetImmigrationPolicy={handleSetImmigrationPolicy}
              currentImmigrationPolicy={(PlayerManager.get()?.currentImmigrationPolicy as ImmigrationPolicy) || 'restricted'}
              onNGORefresh={() => {
                const updatedNations = GameStateManager.getNations();
                setNations(updatedNations);
                PlayerManager.setNations(updatedNations);
              }}
              onClose={() => setIsCulturePanelOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {showPandemicPanel && (
        <PandemicPanel
          state={pandemicState}
          enabled={pandemicIntegrationEnabled}
          biowarfareEnabled={bioWarfareEnabled}
          playerPopulation={PlayerManager.get()?.population}
        />
      )}

      {(() => {
        const player = PlayerManager.get();
        if (!player) {
          return null;
        }

        const metrics = governance.metrics[player.id];
        if (!metrics) {
          return null;
        }

        return (
          <Dialog open={isLeaderOverviewOpen} onOpenChange={setLeaderOverviewOpen}>
            <DialogContent className="max-w-5xl border-none bg-transparent p-0 shadow-none">
              <LeaderOverviewPanel
                nation={player}
                abilityState={player.leaderAbilityState}
                allNations={nations}
                currentTurn={S.turn}
                onUseAbility={(targetId) => {
                  handleUseLeaderAbility(targetId);
                  setLeaderOverviewOpen(false);
                }}
                governanceMetrics={metrics}
                instability={metrics.instability || 0}
                onOpenGovernanceDetails={() => setShowGovernanceDetails(true)}
                onOpenPolicyPanel={() => setShowPolicyPanel(true)}
                onOpenNationalFocus={() => setIsNationalFocusOpen(true)}
                strategicOutlinerGroups={strategicOutlinerGroups}
                isOutlinerCollapsed={isOutlinerCollapsed}
                onOutlinerToggle={handleOutlinerToggle}
                strategicOutlinerHotkeys={strategicOutlinerHotkeys}
                outlinerAttentionTick={outlinerAttentionTick}
                strategicOutlinerRef={leaderStrategicOutlinerRef}
              />
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* Remove Strategic Outliner from fixed position - now inside Warfare Command modal */}

      {/* Great Old Ones Campaign UI */}
      {S.scenario?.id === 'greatOldOnes' && greatOldOnesState && (
        <>
          <div className="fixed top-20 left-4 z-40 space-y-4 max-w-md max-h-[calc(100vh-6rem)] overflow-y-auto">
            {!greatOldOnesState.doctrine && (
              <DoctrineSelectionPanel
                canSelect={true}
                onSelectDoctrine={(doctrine) => {
                  const updatedState = { ...greatOldOnesState, doctrine };
                  setGreatOldOnesState(updatedState);
                  GameStateManager.setGreatOldOnes(updatedState);
                  toast({ title: 'Doctrine Selected', description: `Path of ${doctrine} chosen` });
                }}
              />
            )}

            {greatOldOnesState.doctrine && (
              <>
                <OrderCommandPanel
                  state={greatOldOnesState}
                  onIssueOrder={(order) => {
                    // Handle order execution
                    toast({ title: 'Order Issued', description: order });
                  }}
                />

                {/* Phase 2 Operations Button - Only shown if Phase 2 is unlocked */}
                {phase2State && phase2State.unlocked && (
                  <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-lg text-slate-100 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-purple-500" />
                        Phase 2 Operations
                      </CardTitle>
                      <CardDescription>
                        Execute doctrine-specific operations and track victory progress
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        variant="default"
                        onClick={() => setPhase2PanelOpen(true)}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        Open Phase 2 Panel
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>

          <div className="fixed top-20 right-4 z-40 space-y-4 max-w-md max-h-[calc(100vh-6rem)] overflow-y-auto">
            {greatOldOnesState.doctrine && week3State && (
              <>
                <RitualSitePanel state={greatOldOnesState} />
                <MissionBoardPanel
                  state={greatOldOnesState}
                  availableMissions={week3State.availableMissions}
                  activeMissions={week3State.activeMissions}
                  infiltrators={week3State.infiltrators}
                  onAssignMission={(missionId, infiltratorIds) => {
                    // Handle mission assignment
                    toast({ title: 'Mission Assigned', description: `Mission ${missionId} assigned` });
                  }}
                />
                <UnitRosterPanel
                  state={greatOldOnesState}
                  infiltrators={week3State.infiltrators}
                />
              </>
            )}
          </div>
        </>
      )}

      {/* Regional Sanity Overlay - Great Old Ones map overlay */}
      {S.scenario?.id === 'greatOldOnes' && greatOldOnesState && greatOldOnesState.doctrine && (
        <RegionalSanityOverlay
          state={greatOldOnesState}
          showOverlay={regionalSanityOverlayVisible}
          onToggleOverlay={() => setRegionalSanityOverlayVisible(!regionalSanityOverlayVisible)}
        />
      )}

      {/* Council Schism Button - Great Old Ones bottom action */}
      {S.scenario?.id === 'greatOldOnes' && greatOldOnesState && greatOldOnesState.doctrine && !greatOldOnesState.councilSchismUsed && (
        <CouncilSchismButton
          onClick={() => setCouncilSchismModalOpen(true)}
          councilUnity={greatOldOnesState.council?.unity || 0}
          eldritchPower={greatOldOnesState.resources?.eldritchPower || 0}
        />
      )}

      {/* Council Schism Modal - Great Old Ones doctrine change */}
      {S.scenario?.id === 'greatOldOnes' && greatOldOnesState && (
        <CouncilSchismModal
          open={councilSchismModalOpen}
          onClose={() => setCouncilSchismModalOpen(false)}
          currentDoctrine={greatOldOnesState.doctrine}
          councilUnity={greatOldOnesState.council?.unity || 0}
          eldritchPower={greatOldOnesState.resources?.eldritchPower || 0}
          onConfirmSchism={(newDoctrine) => {
            // Apply costs
            const updatedState = {
              ...greatOldOnesState,
              doctrine: newDoctrine,
              councilSchismUsed: true,
              resources: {
                ...greatOldOnesState.resources,
                eldritchPower: Math.max(0, (greatOldOnesState.resources?.eldritchPower || 0) - 100),
              },
              council: {
                ...greatOldOnesState.council,
                unity: Math.max(0, (greatOldOnesState.council?.unity || 0) - 30),
              } as any,
              veil: {
                ...greatOldOnesState.veil,
                integrity: Math.max(0, (greatOldOnesState.veil?.integrity || 100) - 10),
              },
            };

            setGreatOldOnesState(updatedState);
            GameStateManager.setGreatOldOnes(updatedState);

            // Spawn investigators as consequence
            log(`Council Schism! Doctrine changed to ${newDoctrine}. Council Unity -30, Eldritch Power -100, Veil -10`, 'warning');
            toast({
              title: '⚡ Council Schism!',
              description: `The Esoteric Order has shifted to the Path of ${newDoctrine}. The council is fractured.`,
              variant: 'destructive',
            });

            // Add some High Priests may leave
            if (Math.random() < 0.3 && updatedState.council?.members) {
              const loyalMembers = updatedState.council.members.filter(m => m.loyalty > 50);
              if (loyalMembers.length < updatedState.council.members.length) {
                const leftCount = updatedState.council.members.length - loyalMembers.length;
                log(`${leftCount} High Priest${leftCount > 1 ? 's' : ''} left the council due to the schism!`, 'warning');
              }
            }
          }}
        />
      )}

      {/* Phase 2 Doctrine Operations Panel */}
      {S.scenario?.id === 'greatOldOnes' && greatOldOnesState && phase2State && phase2PanelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <Phase2DoctrinePanel
            state={greatOldOnesState}
            phase2State={phase2State}
            onClose={() => setPhase2PanelOpen(false)}
            onOperation={handlePhase2Operation}
          />
        </div>
      )}

      {activeFlashpoint && (
        <FlashpointModal
          flashpoint={activeFlashpoint}
          onResolve={(optionId) => {
            const result = resolveFlashpoint(optionId, activeFlashpoint, S.turn);
            const player = PlayerManager.get();
            if (!player) return;

            const option = activeFlashpoint.options.find(opt => opt.id === optionId);
            if (!option) return;

            // Store outcome for display
            setCurrentFlashpointOutcome(result.flashpointOutcome);

            // Apply consequences based on outcome
            const outcome = result.success ? option.outcome.success : option.outcome.failure;

            // Award DNA points if applicable
            if (result.dnaAwarded && result.dnaAwarded > 0) {
              addDNAPoints({
                reason: 'milestone',
                amount: result.dnaAwarded,
                message: `Flashpoint resolved: +${result.dnaAwarded} DNA from intel/samples`,
              });
              addNewsItem('science', `Flashpoint intel secured: +${result.dnaAwarded} DNA points`, 'important');
            }
            
            if (outcome.defcon) {
              const previousDefcon = S.defcon;
              const newDefcon = Math.max(1, Math.min(5, outcome.defcon));
              const delta = newDefcon - previousDefcon;
              if (delta !== 0) {
                const reason = `Flashpoint resolved - ${result.success ? 'Success' : 'Failure'}`;
                handleDefconChange(delta, reason, 'event', {
                  onAudioTransition: AudioSys.handleDefconTransition,
                  onLog: log,
                  onNewsItem: addNewsItem,
                  onUpdateDisplay: updateDisplay,
                  onShowModal: setDefconChangeEvent,
                });
              }
            }
            
            if (player && player.id) {
              const governanceDelta: GovernanceDelta = {};
              if (typeof outcome.morale === 'number' && outcome.morale !== 0) {
                governanceDelta.morale = outcome.morale;
              }
              if (typeof outcome.publicOpinion === 'number' && outcome.publicOpinion !== 0) {
                governanceDelta.publicOpinion = outcome.publicOpinion;
              }
              if (typeof outcome.cabinetApproval === 'number' && outcome.cabinetApproval !== 0) {
                governanceDelta.cabinetApproval = outcome.cabinetApproval;
              }
              if (typeof outcome.electionTimer === 'number' && outcome.electionTimer !== 0) {
                governanceDelta.electionTimer = outcome.electionTimer;
              }

              if (Object.keys(governanceDelta).length > 0) {
                governance.applyGovernanceDelta(player.id, governanceDelta);
              }
            }
            
            if (outcome.intel) {
              player.intel = Math.max(0, (player.intel || 0) + outcome.intel);
            }

            if (outcome.production) {
              player.production = Math.max(0, player.production + outcome.production);
            }

            if (outcome.uranium) {
              addStrategicResource(player, 'uranium', outcome.uranium);
            }

            if (typeof outcome.population === 'number') {
              player.population = Math.max(0, player.population + outcome.population);
            }

            if (typeof outcome.populationLoss === 'number') {
              player.population = Math.max(0, player.population - outcome.populationLoss);
            }

            if (typeof outcome.productionPenalty === 'number') {
              player.production = Math.max(0, (player.production || 0) - outcome.productionPenalty);
            }

            if (typeof outcome.instabilityIncrease === 'number') {
              player.instability = Math.max(0, (player.instability || 0) + outcome.instabilityIncrease);
            }

            if (typeof outcome.readinessPenalty === 'number') {
              player.defense = Math.max(0, (player.defense || 0) - outcome.readinessPenalty);
            }

            if (outcome.intelGain) {
              player.intel = Math.max(0, (player.intel || 0) + outcome.intelGain);
            }

            if (outcome.pandemicTrigger) {
              handlePandemicTrigger(outcome.pandemicTrigger);
            }

            if (outcome.containmentBoost) {
              handlePandemicCountermeasure({
                type: 'containment',
                value: outcome.containmentBoost,
                label: outcome.containmentLabel
              });
            }

            if (typeof outcome.vaccineProgress === 'number') {
              handlePandemicCountermeasure({
                type: 'vaccine',
                value: outcome.vaccineProgress,
                label: outcome.vaccineLabel
              });
            }

            if (outcome.mutationSpike) {
              handlePandemicCountermeasure({
                type: 'mutation',
                value: outcome.mutationSpike,
                label: outcome.mutationLabel
              });
            }

            if (outcome.suppressedRegion || outcome.suppressionStrength) {
              handlePandemicCountermeasure({
                type: 'suppression',
                region: outcome.suppressedRegion,
                value: outcome.suppressionStrength,
                label: outcome.suppressionLabel
              });
            }

            if (outcome.intelActor) {
              handlePandemicCountermeasure({
                type: 'intel',
                actor: outcome.intelActor,
                value: outcome.intelValue,
                label: outcome.intelLabel
              });
            }

            if (outcome.madCounterstrikeInitiated) {
              addNewsItem('crisis', 'MAD COUNTERSTRIKE AUTHORIZED - RETALIATORY LAUNCHES UNDERWAY', 'critical');
              const delta = 1 - S.defcon;
              if (delta !== 0) {
                handleDefconChange(delta, 'MAD COUNTERSTRIKE AUTHORIZED - RETALIATORY LAUNCHES UNDERWAY', 'event', {
                  onAudioTransition: AudioSys.handleDefconTransition,
                  onLog: log,
                  onNewsItem: addNewsItem,
                  onUpdateDisplay: updateDisplay,
                  onShowModal: setDefconChangeEvent,
                });
              }
            } else if (outcome.nuclearWar || outcome.worldEnds) {
              addNewsItem('crisis', 'NUCLEAR WAR INITIATED', 'critical');
              const delta = 1 - S.defcon;
              if (delta !== 0) {
                handleDefconChange(delta, 'NUCLEAR WAR INITIATED', 'event', {
                  onAudioTransition: AudioSys.handleDefconTransition,
                  onLog: log,
                  onNewsItem: addNewsItem,
                  onUpdateDisplay: updateDisplay,
                  onShowModal: setDefconChangeEvent,
                });
              }
            } else if (result.success) {
              addNewsItem('diplomatic', `Crisis resolved: ${option.text}`, 'important');
            } else {
              addNewsItem('crisis', `Crisis escalated: ${option.text} failed`, 'urgent');
            }
            
            updateDisplay();
          }}
          onTimeout={() => {
            dismissFlashpoint();
            addNewsItem('crisis', 'CRISIS UNRESOLVED - Default action taken', 'critical');
          }}
        />
      )}

      {currentFlashpointOutcome && (
        <FlashpointOutcomeModal
          outcome={currentFlashpointOutcome}
          onClose={() => setCurrentFlashpointOutcome(null)}
        />
      )}

      {defconChangeEvent && (
        <DefconChangeModal
          event={defconChangeEvent}
          scenario={S.scenario}
          onClose={() => setDefconChangeEvent(null)}
        />
      )}

      {currentSpyMissionResult && (
        <SpyMissionResultModal
          result={currentSpyMissionResult}
          onClose={() => setCurrentSpyMissionResult(null)}
        />
      )}

      <TutorialGuide 
        open={showTutorial} 
        onClose={() => {
          setShowTutorial(false);
          Storage.setItem('has_seen_tutorial', 'true');
        }} 
      />

      {/* New Phase 1 Tutorial & Feedback Overlays */}
      <PhaseTransitionOverlay
        phase={S.phase}
        isTransitioning={isPhaseTransitioning}
        defcon={S.defcon}
        overlay={isPhaseTransitioning ? activeOverlay : null}
      />

      {!isPhaseTransitioning && bannerOverlay && (
        <CatastropheBanner
          message={bannerOverlay.text}
          tone={bannerOverlay.tone}
          expiresAt={bannerOverlay.expiresAt}
        />
      )}

      <DefconWarningOverlay isVisible={isDefconWarningVisible} />

      {/* Population Impact Feedback */}
      <PopulationImpactFeedback 
        impacts={populationImpacts}
        onImpactComplete={(id) => {
          setPopulationImpacts(prev => prev.filter(impact => impact.id !== id));
        }}
      />

      {/* Era Transition Overlay */}
      {showEraTransition && eraTransitionData && (
        <EraTransitionOverlay
          isVisible={showEraTransition}
          newEra={eraTransitionData.era}
          eraName={eraTransitionData.name}
          eraDescription={eraTransitionData.description}
          unlockedFeatures={eraTransitionData.features}
          onDismiss={() => {
            setShowEraTransition(false);
            setEraTransitionData(null);
            setEraTransitionQueued(false);
          }}
        />
      )}

      {/* Action Consequence Preview */}
      {consequencePreview && (
        <ActionConsequencePreview
          consequences={consequencePreview}
          onConfirm={() => {
            if (consequenceCallback) {
              consequenceCallback();
            }
            setConsequencePreview(null);
            setConsequenceCallback(null);
          }}
          onCancel={() => {
            setConsequencePreview(null);
            setConsequenceCallback(null);
          }}
          isVisible={consequencePreview !== null}
        />
      )}

      {layoutDensity !== 'minimal' && (
        <GameSidebar
          victoryAnalysis={victoryAnalysis}
          era={gameEra}
          currentTurn={S.turn}
          defcon={S.defcon}
          className="fixed bottom-4 left-4 z-40 pointer-events-auto"
        />
      )}

      <CivilizationInfoPanel
        nations={nations}
        isOpen={civInfoPanelOpen}
        onClose={() => setCivInfoPanelOpen(false)}
        currentTurn={S.turn}
        governanceMetrics={governance.metrics}
        victoryAnalysis={victoryAnalysis}
        onStartResearch={startResearch}
        bioLabFacility={labFacility}
        onStartBioLabConstruction={handleStartLabConstruction}
        onCancelBioLabConstruction={handleCancelLabConstruction}
        defaultTab={civInfoDefaultTab}
        doctrineShiftState={S.doctrineShiftState}
        resourceMarket={S.resourceMarket}
        depletionWarnings={playerDepletionWarnings}
        onOpenFullDiplomacy={() => setShowEnhancedDiplomacy(true)}
      />

      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2 sm:gap-3">
        <GameHelper
          triggerButtonClassName="z-50 h-12 w-12 rounded-full border border-cyan-500/40 bg-slate-950/80 text-cyan-200 shadow-lg transition hover:text-neon-green hover:bg-cyan-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          onRestartModalTutorial={handleRestartModalTutorial}
          onRestartInteractiveTutorial={handleRestartInteractiveTutorial}
        />
        {renderCasualtyBadge('w-full justify-end text-right')}
      </div>

      {/* Diplomacy Proposal Overlay */}
      {activeDiplomacyProposal && (() => {
        const proposer = getNationById(nations, activeDiplomacyProposal.proposerId);
        const target = getNationById(nations, activeDiplomacyProposal.targetId);

        if (!proposer || !target) return null;

        return (
          <DiplomacyProposalOverlay
            proposal={activeDiplomacyProposal}
            proposer={proposer}
            target={target}
            onAccept={handleAcceptProposal}
            onReject={handleRejectProposal}
            onClose={() => setActiveDiplomacyProposal(null)}
          />
        );
      })()}

      {/* Enhanced Diplomacy Modal - Phase 1, 2, 3 Full Features */}
      {showEnhancedDiplomacy && (() => {
        const player = PlayerManager.get();
        if (!player) return null;

        return (
          <EnhancedDiplomacyModal
            player={player}
            nations={nations}
            phase3State={diplomacyPhase3State || undefined}
            currentTurn={S.turn}
            sanctions={sanctions}
            getPressure={getPressure}
            onClose={() => setShowEnhancedDiplomacy(false)}
            onAction={handleEnhancedDiplomacyAction}
            onOpenLeadersScreen={() => {
              setShowEnhancedDiplomacy(false);
              setLeadersScreenOpen(true);
            }}
          />
        );
      })()}

      {/* Leader Contact Modal (Phase 2 Negotiation System) */}
      {leaderContactModalOpen && leaderContactTargetNationId && (() => {
        const player = PlayerManager.get();
        const targetNation = getNationById(nations, leaderContactTargetNationId);

        if (!player || !targetNation) return null;

        return (
          <LeaderContactModal
            open={leaderContactModalOpen}
            onClose={() => {
              setLeaderContactModalOpen(false);
              setLeaderContactTargetNationId(null);
            }}
            playerNation={player}
            targetNation={targetNation}
            allNations={nations}
            currentTurn={S.turn}
            onProposeDeal={handleProposeDeal}
            onMakeRequest={(action) => {
              toast({
                title: 'Request Made',
                description: `Request sent to ${targetNation.name}`,
              });
            }}
            onDiscuss={() => {
              toast({
                title: 'Discussion',
                description: `You discussed relations with ${targetNation.name}`,
              });
            }}
          />
        );
      })()}

      {/* Civ Style Diplomacy Modal (Civilization-inspired diplomatic actions) */}
      {showCivStyleDiplomacy && civStyleDiplomacyTarget && (() => {
        const player = PlayerManager.get();
        const targetNation = getNationById(nations, civStyleDiplomacyTarget);

        if (!player || !targetNation) return null;

        return (
          <CivStyleDiplomacyModal
            isOpen={showCivStyleDiplomacy}
            onClose={() => {
              setShowCivStyleDiplomacy(false);
              setCivStyleDiplomacyTarget(null);
            }}
            player={player}
            target={targetNation}
            onAction={handleCivStyleDiplomacyAction}
          />
        );
      })()}

      {/* Leaders Screen (Civilization-style leader overview) */}
      {leadersScreenOpen && (() => {
        const player = PlayerManager.get();
        if (!player) return null;

        return (
          <LeadersScreen
            open={leadersScreenOpen}
            onClose={() => setLeadersScreenOpen(false)}
            playerNation={player}
            allNations={nations}
            onContactLeader={handleContactLeader}
            onOpenCivStyleDiplomacy={(nationId) => {
              setCivStyleDiplomacyTarget(nationId);
              setShowCivStyleDiplomacy(true);
            }}
          />
        );
      })()}

      {/* Agenda Revelation Notification (Phase 4) */}
      {agendaRevelationOpen && agendaRevelationData && (
        <AgendaRevelationNotification
          open={agendaRevelationOpen}
          onClose={() => {
            setAgendaRevelationOpen(false);
            setAgendaRevelationData(null);
          }}
          nationName={agendaRevelationData.nationName}
          agenda={agendaRevelationData.agenda}
        />
      )}

      {/* AI-Initiated Negotiations Notification Queue (Phase 4) */}
      {aiInitiatedNegotiations.length > 0 && (
        <AINegotiationNotificationQueue
          negotiations={aiInitiatedNegotiations}
          allNations={nations}
          onView={(negotiation) => {
            // Open the dramatic Civilization-style diplomacy modal
            setActiveAIProposal(negotiation);
            // Remove from notification queue
            setAiInitiatedNegotiations(prev =>
              prev.filter(n => n.proposedDeal.id !== negotiation.proposedDeal.id)
            );
          }}
          onDismiss={(negotiationId) => {
            // Remove from queue
            setAiInitiatedNegotiations(prev =>
              prev.filter(n => n.proposedDeal.id !== negotiationId)
            );
          }}
        />
      )}

      {/* AI Diplomacy Proposal Modal - Civilization Style */}
      {activeAIProposal && (() => {
        const aiNation = nations.find(n => n.id === activeAIProposal.aiNationId);
        const playerNation = nations.find(n => n.id === humanPlayerId);
        if (!aiNation || !playerNation) return null;

        const relationship = aiNation.relationships?.[humanPlayerId] || 0;
        const trust = getTrust(aiNation, humanPlayerId);

        return (
          <AIDiplomacyProposalModal
            open={true}
            onClose={() => setActiveAIProposal(null)}
            negotiation={activeAIProposal}
            aiNation={aiNation}
            playerNation={playerNation}
            relationship={relationship}
            trust={trust}
            onAccept={() => {
              // Apply the deal
              const result = applyNegotiationDeal(
                activeAIProposal.proposedDeal,
                playerNation,
                aiNation,
                nations,
                turn,
                S
              );

              const updatedState = (result.gameState ? { ...result.gameState } : { ...S }) as LocalGameState;
              const updatedLocalNations = result.allNations as LocalNation[];

              // Improve relationship before committing state
              const improvedNations = updatedLocalNations.map(n => {
                if (n.id === aiNation.id) {
                  const newRelationship = Math.min(100, (n.relationships?.[humanPlayerId] || 0) + 10);
                  return {
                    ...n,
                    relationships: {
                      ...n.relationships,
                      [humanPlayerId]: newRelationship,
                    },
                  };
                }
                return n;
              });

              updatedState.nations = improvedNations;

              GameStateManager.setState(updatedState);
              GameStateManager.setNations(improvedNations);
              PlayerManager.setNations(improvedNations);

              S = updatedState;
              setNations(improvedNations);

              // Log success
              addLog(`✅ Accepted ${aiNation.name}'s proposal: ${activeAIProposal.message}`);

              // Show success toast
              toast({
                title: "Deal Accepted",
                description: `You have accepted ${aiNation.name}'s proposal.`,
                variant: "default",
              });

              setActiveAIProposal(null);
            }}
            onReject={() => {
              // Worsen relationship
              const updatedNations = nations.map(n => {
                if (n.id === aiNation.id) {
                  const penalty = activeAIProposal.urgency === 'critical' ? -15 : -10;
                  const newRelationship = Math.max(-100, (n.relationships?.[humanPlayerId] || 0) + penalty);
                  return {
                    ...n,
                    relationships: {
                      ...n.relationships,
                      [humanPlayerId]: newRelationship
                    }
                  };
                }
                return n;
              });
              setNations(updatedNations);

              // Log rejection
              addLog(`❌ Rejected ${aiNation.name}'s proposal.`);

              // Show rejection toast
              toast({
                title: "Proposal Rejected",
                description: `${aiNation.name} is displeased with your decision.`,
                variant: "destructive",
              });

              setActiveAIProposal(null);
            }}
          />
        );
      })()}

      {/* Doctrine Incident Modal */}
      {doctrineIncidentActive && !otherBlockingModalActive && activeDoctrineIncident && (
        <DoctrineIncidentModal
          incident={activeDoctrineIncident}
          onChoose={handleDoctrineIncidentChoice}
        />
      )}

      {/* End Game Screen */}
      {S.showEndGameScreen && S.endGameStatistics && (
        <EndGameScreen
          statistics={S.endGameStatistics}
          highscores={JSON.parse(Storage.getItem('highscores') || '[]')}
          onRestart={() => {
            window.location.reload();
          }}
          onMainMenu={() => {
            navigate('/');
          }}
        />
      )}
    </div>
  );
}
