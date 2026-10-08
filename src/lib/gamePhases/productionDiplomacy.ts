import type { GameState, Nation } from '@/types/game';
import type { PolicyEffects } from '@/types/policy';
import { applyTrustDecay } from '@/lib/trustAndFavorsUtils';
import { updateGrievancesAndClaimsPerTurn } from '@/lib/grievancesAndClaimsUtils';
import { updateAlliancesPerTurn } from '@/lib/specializedAlliancesUtils';
import { applyDIPIncome, updateDIPIncome } from '@/lib/diplomaticCurrencyUtils';

/** Apply immutable diplomacy helpers while retaining shared nation references. */
export function updateDiplomacyPhaseSystems(
  S: GameState,
  nations: Nation[],
  policyNationId: string | undefined,
  policyEffects: PolicyEffects | undefined
): void {
  const peaceTurns = S.diplomacy?.peaceTurns ?? 0;

  for (const nation of nations) {
    if (nation.population <= 0 || nation.eliminated) continue;

    const trustDecayModifier = nation.id === policyNationId
      ? policyEffects?.relationshipDecayModifier ?? 1
      : 1;
    let updated = applyTrustDecay(nation, S.turn, trustDecayModifier);
    updated = updateGrievancesAndClaimsPerTurn(updated, S.turn);
    updated = updateAlliancesPerTurn(updated, S.turn, nations);

    if (updated.diplomaticInfluence) {
      updated = applyDIPIncome(
        updateDIPIncome(updated, nations, S.turn, peaceTurns),
        S.turn
      );
    }

    // Missiles, PlayerManager and UI callbacks hold these objects by reference.
    Object.assign(nation, updated);
  }
}
