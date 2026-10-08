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

export function productionPhase(deps: ProductionPhaseDependencies): void {
  if (!deps?.S || !Array.isArray(deps.nations) || deps.S.gameOver) return;

  const {
    S,
    nations,
    log,
    advanceResearch,
    advanceCityConstruction,
    leaders,
    PlayerManager,
    conventionalState: injectedConventionalState,
    onGameOver,
    policyEffects,
    policyNationId,
  } = deps;

  const conventionalState = injectedConventionalState ?? S.conventional;
  const player = PlayerManager?.get?.() ?? null;

  log('=== PRODUCTION PHASE ===', 'success');

  // 1. Initialize territorial resources system if needed
  initializeTerritorialResourcesSystem(S, conventionalState, log);

  // 2. Initialize resource stockpiles for all nations
  initializeNationStockpiles(nations);

  // 3. Apply ideology and government bonuses BEFORE resource generation
  applyIdeologyBonusesForProduction(nations);
  applyGovernmentBonusesForProduction(nations);

  // 4. Store policy effects for global access
  const policyEffectsByNation =
    policyNationId && policyEffects
      ? { [policyNationId]: policyEffects }
      : {};

  if (typeof window !== 'undefined') {
    (window as ProductionIntegrationWindow).__policyEffectsByNation = policyEffectsByNation;
  }

  // 5. Calculate base production for all nations
  processNationProductions(nations, player, policyNationId, policyEffects, log);

  // 6. Process territorial resource systems (market, depletion, trades, maintenance)
  processTerritorialResourceSystems(S, nations, conventionalState, player, deps.rng, log);

  // 7. Process timer decays for all nations
  processAllNationTimerDecays(nations, log);

  // 8. Handle elections
  processElectionSystem(S, nations, leaders, onGameOver, log);

  if (S.gameOver) return;

  // 9. Update diplomacy phase 1-3 systems
  updateDiplomacyPhaseSystems(S, nations, policyNationId, policyEffects);

  // 10. Advance research and city construction
  for (const n of nations) {
    if (n.population <= 0 || n.eliminated) continue;
    advanceResearch(n, 'PRODUCTION');
    advanceCityConstruction(n, 'PRODUCTION');
  }

  // 11. Process external integration APIs (Hearts of Iron systems)
  processExternalIntegrationAPIs(nations, conventionalState, log);
}
