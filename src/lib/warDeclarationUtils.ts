/**
 * War Declaration Utilities
 *
 * Functions for declaring war, managing war goals, and tracking war score.
 * Integrates with Casus Belli system to ensure legitimate wars.
 */

import { v4 as uuidv4 } from 'uuid';
import type { Nation } from '../types/game';
import type {
  WarState,
  WarGoal,
  WarGoalType,
  WarGoalParameters,
  CasusBelli,
} from '../types/casusBelli';
import { PEACE_TERM_COSTS } from '../types/casusBelli';
import type { Grievance, Claim } from '../types/grievancesAndClaims';
import { useCasusBelli } from './casusBelliUtils';
import { createGrievance } from './grievancesAndClaimsUtils';

/**
 * Declare war with Casus Belli
 */
export function declareWar(
  attacker: Nation,
  defender: Nation,
  casusBelli: CasusBelli,
  warGoals: WarGoal[],
  currentTurn: number
): {
  warState: WarState;
  updatedCasusBelli: CasusBelli;
  newGrievances: Grievance[];
} {
  const warId = uuidv4();

  // Mark CB as used
  const updatedCasusBelli = useCasusBelli(casusBelli);

  // Create war state
  const warState: WarState = {
    id: warId,
    attackerNationId: attacker.id,
    defenderNationId: defender.id,
    casusBelliId: casusBelli.id,
    warGoals,
    startTurn: currentTurn,
    attackerWarScore: 0,
    defenderWarScore: 0,
    allies: {
      attacker: [],
      defender: [],
    },
    status: 'active',
  };

  // Create grievance for defender (they were attacked)
  const newGrievances: Grievance[] = [];

  // If war is unjustified, create surprise attack grievance
  if (casusBelli.justification < 30) {
    newGrievances.push(
      createGrievance(
        'surprise-attack',
        'severe',
        defender.id,
        attacker.id,
        `Surprise attack without valid Casus Belli`,
        currentTurn,
        0, // Permanent grievance
        -40,
        -30
      )
    );
  } else if (casusBelli.justification < 50) {
    // Weak CB = broken-treaty equivalent
    newGrievances.push(
      createGrievance(
        'broken-treaty',
        'major',
        defender.id,
        attacker.id,
        `War declared with weak justification`,
        currentTurn,
        30, // Lasts 30 turns
        -20,
        -15
      )
    );
  }

  return {
    warState,
    updatedCasusBelli,
    newGrievances,
  };
}

/**
 * Create a war goal
 */
export function createWarGoal(
  type: WarGoalType,
  targetNationId: string,
  parameters: WarGoalParameters,
  description: string
): WarGoal {
  const id = uuidv4();

  // Calculate required war score based on goal type
  let warScore = 50; // Default

  if (type === 'annex-territory' && parameters.territoryIds) {
    warScore = parameters.territoryIds.length * PEACE_TERM_COSTS.ANNEX_TERRITORY;
  } else if (type === 'annex-all') {
    warScore = PEACE_TERM_COSTS.ANNEX_ALL;
  } else if (type === 'regime-change') {
    warScore = PEACE_TERM_COSTS.REGIME_CHANGE;
  } else if (type === 'reparations') {
    const amount =
      (parameters.resourceAmount?.production || 0) +
      (parameters.resourceAmount?.intel || 0) +
      (parameters.resourceAmount?.research || 0);
    warScore =
      amount > 100
        ? PEACE_TERM_COSTS.REPARATIONS_MAJOR
        : PEACE_TERM_COSTS.REPARATIONS_MINOR;
  } else if (type === 'disarmament') {
    warScore = PEACE_TERM_COSTS.DISARMAMENT;
  } else if (type === 'vassal') {
    warScore = PEACE_TERM_COSTS.VASSAL;
  } else if (type === 'humiliate') {
    warScore = PEACE_TERM_COSTS.HUMILIATE;
  } else if (type === 'enforce-ideology') {
    warScore = PEACE_TERM_COSTS.ENFORCE_IDEOLOGY;
  } else if (type === 'demilitarize-zone' && parameters.demilitarizedTerritories) {
    warScore =
      parameters.demilitarizedTerritories.length *
      PEACE_TERM_COSTS.DEMILITARIZE_ZONE;
  } else if (type === 'liberate-territory' && parameters.territoryIds) {
    warScore = parameters.territoryIds.length * 15; // Slightly cheaper than annexation
  }

  return {
    id,
    type,
    targetNationId,
    parameters,
    warScore: Math.min(100, warScore),
    achieved: false,
    description,
  };
}

/**
 * Add ally to war
 */
export function addAllyToWar(
  warState: WarState,
  allyNationId: string,
  side: 'attacker' | 'defender'
): WarState {
  const updatedAllies = { ...warState.allies };

  if (side === 'attacker' && !updatedAllies.attacker.includes(allyNationId)) {
    updatedAllies.attacker.push(allyNationId);
  } else if (
    side === 'defender' &&
    !updatedAllies.defender.includes(allyNationId)
  ) {
    updatedAllies.defender.push(allyNationId);
  }

  return {
    ...warState,
    allies: updatedAllies,
  };
}

/**
 * Update war score based on military events
 */
export function updateWarScore(
  warState: WarState,
  event: {
    type:
      | 'occupy-territory'
      | 'major-battle-win'
      | 'minor-battle-win'
      | 'destroy-army'
      | 'nuclear-strike'
      | 'blockade'
      | 'capital-occupation'
      | 'defensive-victory';
    beneficiary: 'attacker' | 'defender';
    magnitude?: number; // For scalable events
  }
): WarState {
  let scoreChange = 0;

  switch (event.type) {
    case 'occupy-territory':
      scoreChange = 10;
      break;
    case 'major-battle-win':
      scoreChange = 15;
      break;
    case 'minor-battle-win':
      scoreChange = 5;
      break;
    case 'destroy-army':
      scoreChange = 20;
      break;
    case 'nuclear-strike':
      scoreChange = 30;
      break;
    case 'blockade':
      scoreChange = 8;
      break;
    case 'capital-occupation':
      scoreChange = 40;
      break;
    case 'defensive-victory':
      scoreChange = 12;
      break;
  }

  if (event.magnitude) {
    scoreChange *= event.magnitude;
  }

  const updatedState = { ...warState };

  if (event.beneficiary === 'attacker') {
    updatedState.attackerWarScore = Math.min(
      100,
      warState.attackerWarScore + scoreChange
    );
  } else {
    updatedState.defenderWarScore = Math.min(
      100,
      warState.defenderWarScore + scoreChange
    );
  }

  return updatedState;
}

/**
 * Check if war goals can be enforced based on war score
 */
export function canEnforceWarGoals(warState: WarState): {
  canEnforce: boolean;
  achievableGoals: WarGoal[];
  unachievableGoals: WarGoal[];
} {
  const achievableGoals: WarGoal[] = [];
  const unachievableGoals: WarGoal[] = [];

  for (const goal of warState.warGoals) {
    if (warState.attackerWarScore >= goal.warScore) {
      achievableGoals.push(goal);
    } else {
      unachievableGoals.push(goal);
    }
  }

  return {
    canEnforce: achievableGoals.length > 0,
    achievableGoals,
    unachievableGoals,
  };
}

/**
 * Mark war goal as achieved
 */
export function achieveWarGoal(
  warState: WarState,
  warGoalId: string
): WarState {
  return {
    ...warState,
    warGoals: warState.warGoals.map((goal) =>
      goal.id === warGoalId ? { ...goal, achieved: true } : goal
    ),
  };
}

/**
 * Get war summary
 */
export function getWarSummary(warState: WarState): {
  duration: number;
  attackerScore: number;
  defenderScore: number;
  leadingSide: 'attacker' | 'defender' | 'stalemate';
  achievedGoals: number;
  totalGoals: number;
  canEndWithVictory: boolean;
} {
  const achievedGoals = warState.warGoals.filter((g) => g.achieved).length;
  const totalGoals = warState.warGoals.length;

  let leadingSide: 'attacker' | 'defender' | 'stalemate' = 'stalemate';
  if (warState.attackerWarScore > warState.defenderWarScore + 20) {
    leadingSide = 'attacker';
  } else if (warState.defenderWarScore > warState.attackerWarScore + 20) {
    leadingSide = 'defender';
  }

  const { canEnforce } = canEnforceWarGoals(warState);

  return {
    duration: 0, // Should be calculated from current turn - start turn
    attackerScore: warState.attackerWarScore,
    defenderScore: warState.defenderWarScore,
    leadingSide,
    achievedGoals,
    totalGoals,
    canEndWithVictory: canEnforce,
  };
}

/**
 * End war and set status
 */
export function endWar(
  warState: WarState,
  outcome: 'white-peace' | 'attacker-victory' | 'defender-victory'
): WarState {
  return {
    ...warState,
    status: outcome,
  };
}

/**
 * Calculate war exhaustion for a nation
 */
export function calculateWarExhaustion(
  nation: Nation,
  warState: WarState,
  currentTurn: number
): number {
  const warDuration = currentTurn - warState.startTurn;

  // Base exhaustion grows with duration
  let exhaustion = Math.min(50, warDuration * 2);

  // Losing side has higher exhaustion
  const isAttacker = warState.attackerNationId === nation.id;
  const myScore = isAttacker
    ? warState.attackerWarScore
    : warState.defenderWarScore;
  const enemyScore = isAttacker
    ? warState.defenderWarScore
    : warState.attackerWarScore;

  if (enemyScore > myScore) {
    const scoreDiff = enemyScore - myScore;
    exhaustion += scoreDiff / 2;
  }

  // High casualties increase exhaustion (if we tracked casualties)
  // For now, use a simple model

  return Math.min(100, exhaustion);
}

/**
 * Check if a nation should seek peace
 */
export function shouldSeekPeace(
  nation: Nation,
  warState: WarState,
  currentTurn: number
): boolean {
  const exhaustion = calculateWarExhaustion(nation, warState, currentTurn);

  // Seek peace if exhaustion is very high
  if (exhaustion > 80) return true;

  // Seek peace if losing badly
  const isAttacker = warState.attackerNationId === nation.id;
  const myScore = isAttacker
    ? warState.attackerWarScore
    : warState.defenderWarScore;
  const enemyScore = isAttacker
    ? warState.defenderWarScore
    : warState.attackerWarScore;

  if (enemyScore > myScore + 40) return true;

  // Attacker might seek peace if war goals are impossible
  if (isAttacker) {
    const { canEnforce } = canEnforceWarGoals(warState);
    if (!canEnforce && warState.attackerWarScore < 30) return true;
  }

  return false;
}

/**
 * Get automatic war goals based on Casus Belli
 */
export function getDefaultWarGoals(
  casusBelli: CasusBelli,
  attacker: Nation,
  defender: Nation,
  claims: Claim[]
): WarGoal[] {
  const goals: WarGoal[] = [];

  switch (casusBelli.type) {
    case 'territorial-claim':
      // Add goals for each claimed territory
      if (casusBelli.claimIds) {
        const relevantClaims = claims.filter((c) =>
          casusBelli.claimIds?.includes(c.id)
        );
        if (relevantClaims.length > 0) {
          // For simplicity, create a generic annexation goal
          goals.push(
            createWarGoal(
              'annex-territory',
              defender.id,
              {
                // territoryIds would need to be extracted from claims
              },
              `Annex territories based on claims`
            )
          );
        }
      }
      break;

    case 'liberation-war':
      goals.push(
        createWarGoal(
          'liberate-territory',
          defender.id,
          {},
          `Liberate occupied territories`
        )
      );
      break;

    case 'holy-war':
      goals.push(
        createWarGoal(
          'enforce-ideology',
          defender.id,
          {
            ideologyType: attacker.ideology?.name,
          },
          `Enforce ${attacker.ideology?.name || 'ideology'}`
        )
      );
      break;

    case 'grievance-retribution':
      goals.push(
        createWarGoal(
          'humiliate',
          defender.id,
          {},
          `Punish for grievances`
        )
      );
      goals.push(
        createWarGoal(
          'reparations',
          defender.id,
          {
            resourceAmount: {
              production: 50,
              intel: 30,
            },
          },
          `Demand reparations`
        )
      );
      break;

    case 'regime-change':
      goals.push(
        createWarGoal(
          'regime-change',
          defender.id,
          {},
          `Overthrow hostile regime`
        )
      );
      break;

    case 'preemptive-strike':
      goals.push(
        createWarGoal(
          'disarmament',
          defender.id,
          {
            militaryReduction: 50,
          },
          `Reduce military threat by 50%`
        )
      );
      break;

    case 'defensive-pact':
      goals.push(
        createWarGoal(
          'liberate-territory',
          defender.id,
          {},
          `Defend ally`
        )
      );
      break;

    case 'punitive-expedition':
      goals.push(
        createWarGoal(
          'reparations',
          defender.id,
          {
            resourceAmount: {
              production: 75,
            },
          },
          `Punish treaty violations`
        )
      );
      break;

    case 'council-authorized':
      // Goals would be specified by council resolution
      goals.push(
        createWarGoal(
          'humiliate',
          defender.id,
          {},
          `Enforce council mandate`
        )
      );
      break;

    default:
      // Generic conquest goal
      goals.push(
        createWarGoal(
          'humiliate',
          defender.id,
          {},
          `Generic war objective`
        )
      );
  }

  return goals;
}
