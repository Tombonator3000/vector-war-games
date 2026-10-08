import type { GameState, Nation } from './game';
import type { PolicyEffects } from './policy';
import type { ConventionalState, TerritoryState } from '@/hooks/useConventionalWarfare';
import type { ProjectedPoint } from '@/lib/renderingUtils';
import type { SeededRandom } from '@/lib/seededRandom';
import type { validateLaunch } from '@/lib/launchValidation';
import type { applyElectionConsequences } from '@/lib/electionSystem';

export type PhaseLog = (message: string, type?: string) => void;
export interface ProductionIntegrationWindow extends Window {
  __policyEffectsByNation?: Record<string, PolicyEffects>;
  economicDepthApi?: {
    processEconomicTurn: (stockpiles: Map<string, import('./territorialResources').ResourceStockpile>) => unknown;
    nationRefineryStats?: Map<string, { totalOutput?: { steel?: number; electronics?: number } }>;
  };
  supplySystemApi?: {
    updateSupplyDemand: (territoryId: string, demand: number) => unknown;
    processTurnSupply: () => unknown;
    getAttritionEffects: () => readonly unknown[];
  };
  productionQueueApi?: {
    processTurnProduction: () => import('./production').ProductionCompletionLog[];
  };
}

export interface ConventionalPhaseState extends Pick<ConventionalState, 'territories'> {
  territories: Record<string, TerritoryState & { garrisonsPresent?: readonly unknown[] }>;
}

export interface LaunchDependencies {
  S: GameState;
  nations: Nation[];
  log: PhaseLog;
  toast: (options: { title: string; description?: string; variant?: 'default' | 'destructive' }) => void;
  AudioSys: { playSFX: (name: string) => void };
  DoomsdayClock: { tick: (amount: number) => void };
  WARHEAD_YIELD_TO_ID: Map<number, string>;
  RESEARCH_LOOKUP: Parameters<typeof validateLaunch>[0]['researchLookup'];
  PlayerManager: { get: () => Nation | null };
  projectLocal: (lon: number, lat: number) => ProjectedPoint;
}

export interface ResolutionPhaseDependencies {
  S: GameState;
  nations: Nation[];
  log: PhaseLog;
  projectLocal: (lon: number, lat: number) => ProjectedPoint;
  explode: (
    x: number,
    y: number,
    target: Nation,
    yieldMT: number,
    attacker?: Nation | null,
    deliveryMethod?: 'missile' | 'bomber' | 'submarine'
  ) => void;
  // Retained for existing integrations. Queues advance once, in production.
  advanceResearch: (nation: Nation, phase: 'PRODUCTION' | 'RESOLUTION') => void;
  advanceCityConstruction: (nation: Nation, phase: 'PRODUCTION' | 'RESOLUTION') => void;
}

export interface ProductionPhaseDependencies {
  S: GameState;
  nations: Nation[];
  log: PhaseLog;
  advanceResearch: (nation: Nation, phase: 'PRODUCTION' | 'RESOLUTION') => void;
  advanceCityConstruction: (nation: Nation, phase: 'PRODUCTION' | 'RESOLUTION') => void;
  leaders: Parameters<typeof applyElectionConsequences>[3];
  PlayerManager: { get: () => Nation | null };
  conventionalState?: ConventionalPhaseState;
  rng: SeededRandom;
  policyEffects?: PolicyEffects;
  policyNationId?: string;
  onGameOver?: (payload: { victory: boolean; message: string; cause?: string }) => void;
}
