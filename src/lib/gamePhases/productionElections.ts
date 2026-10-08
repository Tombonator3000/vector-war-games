import type { GameState, Nation } from '@/types/game';
import type { ProductionPhaseDependencies } from '@/types/gamePhase.types';
import {
  calculatePublicOpinion,
  runElection,
  applyElectionConsequences,
  buildPublicOpinionAggregates,
} from '@/lib/electionSystem';

export function processElectionSystem(
  S: GameState,
  nations: Nation[],
  leaders: ProductionPhaseDependencies['leaders'],
  onGameOver: ((payload: { victory: boolean; message: string; cause?: string }) => void) | undefined,
  log: (msg: string, type?: string) => void
): void {
  if (!S.scenario?.electionConfig?.enabled) return;

  const electionConfig = S.scenario.electionConfig;
  const publicOpinionAggregates = buildPublicOpinionAggregates(nations, electionConfig);

  for (const n of nations) {
    if (n.population <= 0 || n.eliminated) continue;
    // Update public opinion based on current state
    n.publicOpinion = calculatePublicOpinion(n, electionConfig, publicOpinionAggregates[n.id]);

    // Decrease election timer
    if (n.electionTimer > 0) {
      n.electionTimer--;
    }

    // Check if it's election time
    if (n.electionTimer === 0 && electionConfig.interval > 0) {
      const result = runElection(n, electionConfig, publicOpinionAggregates);

      const electionLog = applyElectionConsequences(
        n,
        result,
        S.scenario.electionConfig,
        leaders
      );

      log(`${n.name}: ${electionLog.message}`, result.winner === 'incumbent' ? 'success' : 'alert');

      if (electionLog.gameOver && n.isPlayer) {
        if (onGameOver) {
          onGameOver({ victory: false, message: electionLog.message, cause: 'election' });
        } else {
          S.gameOver = true;
        }
        S.overlay = { text: 'VOTED OUT - GAME OVER', ttl: 5000 };
      }

      // Reset election timer
      n.electionTimer = S.scenario.electionConfig.interval;
    }
  }
}
