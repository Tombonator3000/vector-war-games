import type { PolicyEffects } from '@/types/policy';
import type { ProductionPhaseDependencies, ProductionIntegrationWindow } from '@/types/gamePhase.types';
import { applyIdeologyBonusesForProduction } from '@/lib/ideologyIntegration';
import { applyGovernmentBonusesForProduction } from '@/lib/governmentIntegration';
import { processNationProductions } from './nationProduction';
import {
  initializeTerritorialResourcesSystem,
  initializeNationStockpiles,
  processTerritorialResourceSystems,
} from './territorialProduction';
import { processAllNationTimerDecays } from './productionTimers';
import { processElectionSystem } from './productionElections';
import { updateDiplomacyPhaseSystems } from './productionDiplomacy';
import { processExternalIntegrationAPIs } from './productionIntegrations';

function publishPolicyEffects(nationId?: string, effects?: PolicyEffects): void {
  if (typeof window === 'undefined') return;
  (window as ProductionIntegrationWindow).__policyEffectsByNation =
    nationId && effects ? { [nationId]: effects } : {};
}

/** Advance each production subsystem once in its defined order. */
export function productionPhase(deps: ProductionPhaseDependencies): void {
  if (!deps?.S || !Array.isArray(deps.nations) || deps.S.gameOver) return;

  const { S, nations, log, PlayerManager, policyNationId, policyEffects } = deps;
  const conventionalState = deps.conventionalState ?? S.conventional;
  const player = PlayerManager?.get?.() ?? null;
  log('=== PRODUCTION PHASE ===', 'success');

  initializeTerritorialResourcesSystem(S, conventionalState, log);
  initializeNationStockpiles(nations);
  applyIdeologyBonusesForProduction(nations);
  applyGovernmentBonusesForProduction(nations);
  publishPolicyEffects(policyNationId, policyEffects);
  processNationProductions(nations, player, policyNationId, policyEffects, log);
  processTerritorialResourceSystems(S, nations, conventionalState, player, deps.rng, log);
  processAllNationTimerDecays(nations, log);
  processElectionSystem(S, nations, deps.leaders, deps.onGameOver, log);
  if (S.gameOver) return;

  updateDiplomacyPhaseSystems(S, nations, policyNationId, policyEffects);
  for (const nation of nations) {
    if (nation.population <= 0 || nation.eliminated) continue;
    deps.advanceResearch(nation, 'PRODUCTION');
    deps.advanceCityConstruction(nation, 'PRODUCTION');
  }
  processExternalIntegrationAPIs(nations, conventionalState, log);
}
