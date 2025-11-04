/**
 * Doctrine Incident System
 *
 * Generates and manages doctrine incidents during gameplay.
 * Evaluates conditions, calculates probabilities, and applies consequences.
 */

import type { Nation, GameState } from '@/types/game';
import type {
  DoctrineIncident,
  DoctrineIncidentChoice,
  DoctrineIncidentState,
  DoctrineShiftState,
  DoctrineKey,
} from '@/types/doctrineIncidents';
import { DOCTRINE_INCIDENTS, getIncidentsForDoctrine } from './doctrineIncidentData';

/**
 * Initialize doctrine incident state for a new game
 */
export function initializeDoctrineIncidentState(): DoctrineIncidentState {
  return {
    activeIncident: null,
    resolvedIncidents: [],
    incidentHistory: [],
    lastIncidentTurn: 0,
  };
}

/**
 * Initialize doctrine shift tracking
 */
export function initializeDoctrineShiftState(startingDoctrine: DoctrineKey): DoctrineShiftState {
  return {
    currentDoctrine: startingDoctrine,
    shiftPoints: {
      mad: 0,
      defense: 0,
      firstStrike: 0,
      detente: 0,
    },
    shiftThreshold: 60,
    recentActions: [],
  };
}

/**
 * Check if an incident can occur given current game state
 */
export function canIncidentOccur(
  incident: DoctrineIncident,
  gameState: GameState,
  playerNation: Nation,
  incidentState: DoctrineIncidentState
): boolean {
  // Already resolved and not repeatable?
  if (!incident.repeatable && incidentState.resolvedIncidents.includes(incident.id)) {
    return false;
  }

  // Too soon since last incident? (minimum 3 turns between incidents)
  if (gameState.turn - incidentState.lastIncidentTurn < 3) {
    return false;
  }

  const conditions = incident.conditions;
  if (!conditions) return true;

  // Check turn requirements
  if (conditions.minTurn && gameState.turn < conditions.minTurn) {
    return false;
  }
  if (conditions.maxTurn && gameState.turn > conditions.maxTurn) {
    return false;
  }

  // Check war/peace requirements
  const atWar = Object.values(playerNation.threats || {}).some((threat) => threat > 50);
  if (conditions.requiresWar && !atWar) {
    return false;
  }
  if (conditions.requiresPeace && atWar) {
    return false;
  }

  // Check alliance requirements
  // Note: nations are stored separately, not on gameState
  const allNations = (window as any).__nations || [];
  const hasAllies = allNations.some(
    (nation: Nation) =>
      nation.id !== playerNation.id &&
      playerNation.treaties?.[nation.id]?.type === 'alliance' &&
      playerNation.treaties[nation.id].active
  );
  if (conditions.requiresAllies && !hasAllies) {
    return false;
  }

  // Check enemy requirements
  const hasEnemies = Object.values(playerNation.threats || {}).some((threat) => threat > 20);
  if (conditions.requiresEnemies && !hasEnemies) {
    return false;
  }

  // Check military minimums
  if (conditions.minMissiles && (playerNation.missiles || 0) < conditions.minMissiles) {
    return false;
  }
  if (conditions.minDefense && (playerNation.defense || 0) < conditions.minDefense) {
    return false;
  }

  // Check research requirements
  if (conditions.hasResearch) {
    const hasAllResearch = conditions.hasResearch.every(
      (researchId) => playerNation.researched?.[researchId]
    );
    if (!hasAllResearch) {
      return false;
    }
  }

  return true;
}

/**
 * Calculate probability of incident occurring this turn
 */
export function calculateIncidentProbability(
  incident: DoctrineIncident,
  gameState: GameState,
  playerNation: Nation
): number {
  let probability = incident.baseChance;

  // Increase probability based on game tension
  const avgThreat =
    Object.values(playerNation.threats || {}).reduce((sum, t) => sum + t, 0) /
      Object.keys(playerNation.threats || {}).length || 0;
  const tensionMultiplier = 1 + avgThreat / 100;
  probability *= tensionMultiplier;

  // Increase probability in mid-late game
  if (gameState.turn > 15) {
    probability *= 1.3;
  }
  if (gameState.turn > 30) {
    probability *= 1.5;
  }

  // Reduce if recent incident
  const turnsSinceLastIncident = gameState.turn - (gameState.doctrineIncidentState?.lastIncidentTurn || 0);
  if (turnsSinceLastIncident < 5) {
    probability *= 0.5;
  }

  return Math.min(probability, 100);
}

/**
 * Try to generate a random incident for the current turn
 */
export function tryGenerateIncident(
  gameState: GameState,
  playerNation: Nation,
  incidentState: DoctrineIncidentState
): DoctrineIncident | null {
  // Don't generate if there's already an active incident
  if (incidentState.activeIncident) {
    return null;
  }

  const playerDoctrine = playerNation.doctrine as DoctrineKey;
  if (!playerDoctrine) {
    return null;
  }

  // Get all eligible incidents for player's doctrine
  const eligibleIncidents = getIncidentsForDoctrine(playerDoctrine).filter((incident) =>
    canIncidentOccur(incident, gameState, playerNation, incidentState)
  );

  if (eligibleIncidents.length === 0) {
    return null;
  }

  // Roll for each incident
  for (const incident of eligibleIncidents) {
    const probability = calculateIncidentProbability(incident, gameState, playerNation);
    const roll = Math.random() * 100;

    if (roll < probability) {
      return incident;
    }
  }

  return null;
}

/**
 * Apply consequences of an incident choice
 */
export function applyIncidentConsequences(
  choice: DoctrineIncidentChoice,
  gameState: GameState,
  playerNation: Nation,
  shiftState: DoctrineShiftState
): {
  updatedNation: Nation;
  updatedShiftState: DoctrineShiftState;
  newsItems: Array<{ category: string; headline: string; priority: string }>;
  triggeredWar: boolean;
  brokeTreaties: boolean;
} {
  const consequences = choice.consequences;
  const updatedNation = { ...playerNation };
  const newsItems: Array<{ category: string; headline: string; priority: string }> = [];
  let triggeredWar = false;
  let brokeTreaties = false;

  // Apply resource costs
  if (consequences.goldCost) {
    updatedNation.gold = Math.max(0, (updatedNation.gold || 0) - consequences.goldCost);
  }
  if (consequences.productionCost) {
    updatedNation.production = Math.max(0, (updatedNation.production || 0) - consequences.productionCost);
  }
  if (consequences.intelCost) {
    updatedNation.intel = Math.max(0, (updatedNation.intel || 0) - consequences.intelCost);
  }

  // Apply military changes
  if (consequences.missileDelta) {
    updatedNation.missiles = Math.max(0, (updatedNation.missiles || 0) + consequences.missileDelta);
  }
  if (consequences.defenseDelta) {
    updatedNation.defense = Math.max(0, (updatedNation.defense || 0) + consequences.defenseDelta);
  }

  // Apply domestic changes
  if (consequences.instabilityDelta) {
    updatedNation.instability = Math.max(
      0,
      Math.min(100, (updatedNation.instability || 0) + consequences.instabilityDelta)
    );
  }
  if (consequences.moraleDelta) {
    updatedNation.morale = Math.max(
      0,
      Math.min(100, (updatedNation.morale || 0) + consequences.moraleDelta)
    );
  }

  // Apply doctrine shift
  const updatedShiftState = { ...shiftState };
  if (consequences.doctrineShift) {
    const { toward, amount } = consequences.doctrineShift;
    updatedShiftState.shiftPoints[toward] = Math.min(
      100,
      (updatedShiftState.shiftPoints[toward] || 0) + amount
    );

    // Track action
    updatedShiftState.recentActions.push({
      action: choice.text,
      turn: gameState.turn,
      shiftEffect: { toward, amount },
    });

    // Keep only last 10 actions
    if (updatedShiftState.recentActions.length > 10) {
      updatedShiftState.recentActions = updatedShiftState.recentActions.slice(-10);
    }
  }

  // Check for doctrine shift warning/trigger
  const maxShift = Math.max(...Object.values(updatedShiftState.shiftPoints));
  if (maxShift >= updatedShiftState.shiftThreshold) {
    const newDoctrine = Object.entries(updatedShiftState.shiftPoints).find(
      ([, points]) => points === maxShift
    )?.[0] as DoctrineKey;

    if (newDoctrine && newDoctrine !== shiftState.currentDoctrine) {
      // Trigger doctrine shift warning
      newsItems.push({
        category: 'political',
        headline: `DOCTRINE SHIFT WARNING: Moving toward ${newDoctrine.toUpperCase()} doctrine`,
        priority: 'critical',
      });
    }
  }

  // Apply relationship changes
  if (consequences.relationshipChanges) {
    // This would need to be integrated with the existing relationship system
    // For now, we'll just track it
  }

  if (consequences.globalRelationshipChange) {
    // Apply to all nations
    // This would modify the diplomacy state
  }

  // Special effects
  if (consequences.triggerWar) {
    triggeredWar = true;
  }

  if (consequences.breakTreaties) {
    brokeTreaties = true;
  }

  if (consequences.gainTech && updatedNation.researched) {
    updatedNation.researched[consequences.gainTech] = true;
  }

  // Add news event
  if (consequences.newsEvent) {
    newsItems.push(consequences.newsEvent);
  }

  return {
    updatedNation,
    updatedShiftState,
    newsItems,
    triggeredWar,
    brokeTreaties,
  };
}

/**
 * Resolve an incident by applying the chosen option
 */
export function resolveIncident(
  incident: DoctrineIncident,
  choiceId: string,
  gameState: GameState,
  playerNation: Nation,
  incidentState: DoctrineIncidentState,
  shiftState: DoctrineShiftState
): {
  updatedNation: Nation;
  updatedIncidentState: DoctrineIncidentState;
  updatedShiftState: DoctrineShiftState;
  newsItems: Array<{ category: string; headline: string; priority: string }>;
  followUpIncidentId?: string;
  triggeredWar: boolean;
  brokeTreaties: boolean;
} {
  const choice = incident.choices.find((c) => c.id === choiceId);
  if (!choice) {
    throw new Error(`Invalid choice ID: ${choiceId}`);
  }

  const result = applyIncidentConsequences(choice, gameState, playerNation, shiftState);

  const updatedIncidentState: DoctrineIncidentState = {
    ...incidentState,
    activeIncident: null,
    resolvedIncidents: [...incidentState.resolvedIncidents, incident.id],
    incidentHistory: [
      ...incidentState.incidentHistory,
      {
        incidentId: incident.id,
        turn: gameState.turn,
        choiceId: choice.id,
        outcome: choice.text,
      },
    ],
    lastIncidentTurn: gameState.turn,
  };

  return {
    updatedNation: result.updatedNation,
    updatedIncidentState,
    updatedShiftState: result.updatedShiftState,
    newsItems: result.newsItems,
    followUpIncidentId: choice.followUpIncident,
    triggeredWar: result.triggeredWar,
    brokeTreaties: result.brokeTreaties,
  };
}

/**
 * Update doctrine incident system each turn
 */
export function updateDoctrineIncidentSystem(
  gameState: GameState,
  playerNation: Nation,
  incidentState: DoctrineIncidentState
): DoctrineIncidentState {
  // Try to generate new incident if none active
  if (!incidentState.activeIncident) {
    const newIncident = tryGenerateIncident(gameState, playerNation, incidentState);
    if (newIncident) {
      return {
        ...incidentState,
        activeIncident: newIncident,
      };
    }
  }

  return incidentState;
}

/**
 * Get doctrine shift progress summary for UI
 */
export function getDoctrineShiftSummary(shiftState: DoctrineShiftState): {
  currentDoctrine: DoctrineKey;
  closestAlternative: DoctrineKey | null;
  progressToShift: number; // 0-100
  isWarning: boolean; // true if > 60%
  isCritical: boolean; // true if > 80%
} {
  const maxShift = Math.max(...Object.values(shiftState.shiftPoints));
  const closestAlternative =
    maxShift > 0
      ? (Object.entries(shiftState.shiftPoints).find(([, points]) => points === maxShift)?.[0] as DoctrineKey)
      : null;

  const progressToShift = Math.min(100, (maxShift / shiftState.shiftThreshold) * 100);

  return {
    currentDoctrine: shiftState.currentDoctrine,
    closestAlternative:
      closestAlternative === shiftState.currentDoctrine ? null : closestAlternative,
    progressToShift,
    isWarning: progressToShift >= 60,
    isCritical: progressToShift >= 80,
  };
}
