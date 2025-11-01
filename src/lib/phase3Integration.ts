/**
 * Phase 3 Integration - Weeks 8-11
 * Integrates narrative arcs, counter-occult mechanics, and endgame systems
 */

import { GreatOldOnesState } from '../types/greatOldOnes';
import { Phase2State } from './phase2Integration';
import { Phase3State, PlayerChoice, initializePhase3State } from '../types/phase3Types';

// Re-export for backward compatibility
export { initializePhase3State } from '../types/phase3Types';

// Import Phase 3 systems
import {
  determineMotivationBranch,
  progressMotivationReveal,
  revealGreatTruth,
  interpretTruth,
  triggerSchism,
  resolveSchism,
  generateRivalCult,
  progressRivalCult,
  interactWithRivalCult,
} from './week8NarrativeArcs';

import {
  progressResistanceResearch,
  deployResistanceTech,
  calculateGlobalUnity,
  formAlliance,
  planJointOperation,
  executeJointOperation,
  initiateSanityRestoration,
  applySanityRestoration,
  createTaskForce,
} from './week9CounterOccult';

import {
  checkVictoryConditions,
  generateCampaignAnalytics,
  generateLegacyPerks,
  generateNewCampaign,
} from './week10Endgame';

// ============================================================================
// PHASE 3 UNLOCK CONDITIONS
// ============================================================================

/**
 * Check if Phase 3 should unlock
 */
/**
 * Update Phase 3 systems (wrapper for processPhase3Turn for backward compatibility)
 */
export function updatePhase3Systems(
  gooState: GreatOldOnesState,
  phase2State: any,
  phase3State: Phase3State
): Phase3State {
  const { events, stateChanges } = processPhase3Turn(gooState, phase2State, phase3State);
  // Apply state changes to phase3State
  stateChanges.forEach(change => {
    applyPhase3StateChanges(phase3State, change);
  });
  return phase3State;
}

export function checkPhase3UnlockConditions(
  state: GreatOldOnesState,
  phase2: Phase2State
): {
  shouldUnlock: boolean;
  reason: string;
} {
  // Conditions:
  // 1. Phase 2 must be unlocked and progressed
  if (!phase2.unlocked) {
    return {
      shouldUnlock: false,
      reason: 'Phase 2 must be unlocked first',
    };
  }

  // 2. Significant global corruption (late game state)
  const avgCorruption =
    state.regions.reduce((sum, r) => sum + r.corruption, 0) / state.regions.length;
  if (avgCorruption < 50) {
    return {
      shouldUnlock: false,
      reason: `Need 50% average corruption (have ${avgCorruption.toFixed(0)}%)`,
    };
  }

  // 3. Either high entity count OR high infiltration OR high conversion
  const entityCount = state.summonedEntities.length;
  const infiltration = phase2.corruption.globalInfiltration;
  const conversion = phase2.convergence.voluntaryConversionRate;

  const latGameProgress = entityCount >= 3 || infiltration >= 60 || conversion >= 60;
  if (!latGameProgress) {
    return {
      shouldUnlock: false,
      reason: 'Need more doctrine progress (3+ entities OR 60%+ infiltration OR 60%+ conversion)',
    };
  }

  // 4. Doctrine points accumulated
  if (phase2.doctrinePoints < 50) {
    return {
      shouldUnlock: false,
      reason: `Need 50 doctrine points (have ${phase2.doctrinePoints})`,
    };
  }

  // 5. Sufficient campaign progress (turn count)
  if (state.alignment.turn < 40) {
    return {
      shouldUnlock: false,
      reason: `Campaign must progress to at least turn 40 (currently turn ${state.alignment.turn})`,
    };
  }

  return {
    shouldUnlock: true,
    reason: 'Phase 3: Advanced Systems & Late Game unlocked! The endgame approaches.',
  };
}

// ============================================================================
// TURN PROCESSING FOR PHASE 3 SYSTEMS
// ============================================================================

/**
 * Process Phase 3 systems each turn
 */
export function processPhase3Turn(
  state: GreatOldOnesState,
  phase2: Phase2State,
  phase3: Phase3State
): {
  events: Phase3TurnEvent[];
  stateChanges: Phase3StateChange[];
} {
  const events: Phase3TurnEvent[] = [];
  const stateChanges: Phase3StateChange[] = [];

  if (!phase3.unlocked) {
    // Check if should unlock
    const unlockCheck = checkPhase3UnlockConditions(state, phase2);
    if (unlockCheck.shouldUnlock) {
      phase3.unlocked = true;
      events.push({
        type: 'phase3_unlock',
        message: 'Phase 3: Advanced Systems & Late Game Unlocked!',
        description: unlockCheck.reason,
        importance: 'critical',
      });

      // Initialize motivation branch if not set
      if (!phase3.narrative.motivationBranch) {
        phase3.narrative.motivationBranch = determineMotivationBranch(
          phase3.endgame.campaignState.majorChoices,
          state.doctrine
        );

        events.push({
          type: 'motivation_revealed',
          message: `Your True Motivation: ${phase3.narrative.motivationBranch.name}`,
          description: phase3.narrative.motivationBranch.description,
          importance: 'high',
        });
      }
    }
    return { events, stateChanges };
  }

  // Process Week 8: Narrative Systems
  const narrativeResults = processNarrativeTurn(state, phase2, phase3);
  events.push(...narrativeResults.events);
  stateChanges.push(...narrativeResults.stateChanges);

  // Process Week 9: Counter-Occult Systems
  const counterOccultResults = processCounterOccultTurn(state, phase2, phase3);
  events.push(...counterOccultResults.events);
  stateChanges.push(...counterOccultResults.stateChanges);

  // Process Week 10-11: Endgame Systems
  const endgameResults = processEndgameTurn(state, phase2, phase3);
  events.push(...endgameResults.events);
  stateChanges.push(...endgameResults.stateChanges);

  return { events, stateChanges };
}

// ============================================================================
// WEEK 8: NARRATIVE SYSTEMS
// ============================================================================

/**
 * Process narrative systems
 */
function processNarrativeTurn(
  state: GreatOldOnesState,
  phase2: Phase2State,
  phase3: Phase3State
): {
  events: Phase3TurnEvent[];
  stateChanges: Phase3StateChange[];
} {
  const events: Phase3TurnEvent[] = [];
  const stateChanges: Phase3StateChange[] = [];

  // 1. Progress Great Truth revelation
  if (phase3.narrative.greatTruth.revelationLevel < 100) {
    // Truth reveals naturally as corruption and entities increase
    const revealRate = state.resources.corruptionIndex / 100 + state.summonedEntities.length * 2;

    if (revealRate > 5) {
      const truthResult = revealGreatTruth(
        phase3.narrative.greatTruth,
        'ritual',
        revealRate / 10
      );

      if (truthResult.contradictionDiscovered) {
        events.push({
          type: 'truth_contradiction',
          message: `Contradiction Discovered: ${truthResult.contradictionDiscovered.title}`,
          description: truthResult.contradictionDiscovered.description,
          importance: 'high',
        });
      }

      if (phase3.narrative.greatTruth.revelationLevel >= 100 && !phase3.narrative.greatTruth.playerStance) {
        events.push({
          type: 'truth_complete',
          message: 'The Great Truth Revealed',
          description: 'You now know the true nature of what you serve. Choose how to interpret this knowledge.',
          importance: 'critical',
        });
      }
    }
  }

  // 2. Progress rival cults
  for (const cult of phase3.narrative.rivalCults) {
    const cultResult = progressRivalCult(cult, state.resources.corruptionIndex);

    if (cultResult.threat === 'critical') {
      events.push({
        type: 'rival_cult_threat',
        message: `CRITICAL: ${cult.name}`,
        description: cultResult.message,
        importance: 'high',
      });
    } else if (cultResult.operation) {
      events.push({
        type: 'rival_cult_activity',
        message: cult.name,
        description: cultResult.operation,
        importance: 'medium',
      });
    }
  }

  // 3. Check for new rival cults spawning
  if (
    state.resources.corruptionIndex > 60 &&
    phase3.narrative.rivalCults.length < 3 &&
    Math.random() > 0.9
  ) {
    const existingPatrons = phase3.narrative.rivalCults.map(c => c.patronEntity);
    const newCult = generateRivalCult(existingPatrons);
    phase3.narrative.rivalCults.push(newCult);

    events.push({
      type: 'rival_cult_emerges',
      message: 'New Rival Cult Detected',
      description: `${newCult.name} emerges, serving ${newCult.patronEntity}`,
      importance: 'high',
    });
  }

  // 4. Order faction tensions
  const avgFactionRelation =
    phase3.narrative.orderFactions.reduce((sum, f) => sum + f.playerRelation, 0) /
    phase3.narrative.orderFactions.length;

  if (avgFactionRelation < -20 && Math.random() > 0.95) {
    // Schism risk!
    const schism = triggerSchism(
      phase3.narrative.orderFactions,
      'Doctrine disagreement',
      Math.floor(Math.random() * 40) + 40
    );
    phase3.narrative.activeSchisms.push(schism);

    events.push({
      type: 'order_schism',
      message: `Order Schism: ${schism.name}`,
      description: schism.cause,
      importance: 'critical',
    });
  }

  // 5. Progress active schisms
  for (const schism of phase3.narrative.activeSchisms) {
    if (schism.severity > 80) {
      events.push({
        type: 'schism_critical',
        message: 'Order on Brink of Civil War',
        description: `${schism.name} threatens to tear the Order apart`,
        importance: 'critical',
      });

      stateChanges.push({
        type: 'veil_damage',
        value: 10,
        reason: 'Order infighting visible',
      });
    }
  }

  return { events, stateChanges };
}

// ============================================================================
// WEEK 9: COUNTER-OCCULT SYSTEMS
// ============================================================================

/**
 * Process counter-occult systems
 */
function processCounterOccultTurn(
  state: GreatOldOnesState,
  phase2: Phase2State,
  phase3: Phase3State
): {
  events: Phase3TurnEvent[];
  stateChanges: Phase3StateChange[];
} {
  const events: Phase3TurnEvent[] = [];
  const stateChanges: Phase3StateChange[] = [];

  // 1. Progress resistance research
  for (const research of phase3.counterOccult.resistanceResearch) {
    const researchResult = progressResistanceResearch(research, state);

    if (researchResult.techUnlocked) {
      events.push({
        type: 'resistance_tech',
        message: `ALERT: ${researchResult.techUnlocked.name} Developed`,
        description: researchResult.techUnlocked.description,
        importance: 'critical',
      });

      // Automatically deploy tech
      if (researchResult.techUnlocked.effectiveness > 50) {
        const targetRegion = state.regions.reduce((prev, curr) =>
          curr.corruption > prev.corruption ? curr : prev
        );

        const deployResult = deployResistanceTech(
          researchResult.techUnlocked,
          targetRegion.regionId,
          state
        );

        events.push({
          type: 'tech_deployed',
          message: deployResult.message,
          description: `Corruption reduced by ${deployResult.impact.corruptionReduced.toFixed(0)}`,
          importance: 'high',
        });

        stateChanges.push({
          type: 'corruption_loss',
          value: deployResult.impact.corruptionReduced,
          reason: `Resistance tech: ${researchResult.techUnlocked.name}`,
        });
      }
    }
  }

  // 2. Calculate and update global unity
  const newUnity = calculateGlobalUnity(state);
  phase3.counterOccult.globalUnity.unityScore = newUnity;

  if (newUnity > 70 && phase3.counterOccult.globalUnity.alliances.length < 2) {
    // Form new alliance
    const allianceTypes: Array<'religious' | 'scientific' | 'military' | 'political'> = [
      'religious',
      'scientific',
      'military',
      'political',
    ];
    const existingTypes = phase3.counterOccult.globalUnity.alliances.map(a => a.type);
    const availableTypes = allianceTypes.filter(t => !existingTypes.includes(t));

    if (availableTypes.length > 0) {
      const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
      const members = state.regions.slice(0, Math.floor(Math.random() * 5) + 3).map(r => r.regionName);

      const alliance = formAlliance(type, members, newUnity);
      phase3.counterOccult.globalUnity.alliances.push(alliance);

      events.push({
        type: 'alliance_formed',
        message: `Human Alliance Formed: ${alliance.name}`,
        description: `${members.length} regions unite against the Order`,
        importance: 'critical',
      });
    }
  }

  // 3. Execute joint operations
  for (const operation of phase3.counterOccult.globalUnity.jointOperations) {
    operation.turnsUntilLaunch--;
    operation.preparation = Math.min(
      100,
      ((planJointOperation.length - operation.turnsUntilLaunch) / planJointOperation.length) * 100
    );

    if (operation.turnsUntilLaunch <= 0) {
      const result = executeJointOperation(operation, state);

      events.push({
        type: result.success ? 'joint_op_success' : 'joint_op_failure',
        message: result.message,
        description: `Human casualties: ${result.casualties.humanLosses}, Cultist losses: ${result.casualties.cultistLosses}`,
        importance: result.success ? 'critical' : 'high',
      });

      if (result.success) {
        stateChanges.push({
          type: 'veil_restoration',
          value: result.damage.veilRestored,
          reason: 'Successful human operation',
        });
        stateChanges.push({
          type: 'corruption_loss',
          value: result.damage.corruptionReduced,
          reason: 'Purge operation',
        });
      }

      // Remove completed operation
      const index = phase3.counterOccult.globalUnity.jointOperations.indexOf(operation);
      if (index > -1) {
        phase3.counterOccult.globalUnity.jointOperations.splice(index, 1);
      }
    }
  }

  // 4. Plan new joint operations
  if (
    newUnity > 60 &&
    phase3.counterOccult.globalUnity.jointOperations.length < 2 &&
    phase3.counterOccult.globalUnity.alliances.length > 0
  ) {
    // Target highest corruption region or most powerful entity
    const highestCorruptionRegion = state.regions.reduce((prev, curr) =>
      curr.corruption > prev.corruption ? curr : prev
    );

    const operation = planJointOperation(
      phase3.counterOccult.globalUnity.alliances,
      highestCorruptionRegion.regionId,
      'region',
      'purge',
      state
    );

    phase3.counterOccult.globalUnity.jointOperations.push(operation);

    events.push({
      type: 'joint_op_planned',
      message: `Joint Operation Planned: ${operation.name}`,
      description: `Target: ${highestCorruptionRegion.regionName}, ${operation.turnsUntilLaunch} turns until launch`,
      importance: 'high',
    });
  }

  // 5. Apply sanity restoration programs
  for (const program of phase3.counterOccult.sanityRestoration) {
    const result = applySanityRestoration(program, state);

    if (result.sanityRestored > 5) {
      events.push({
        type: 'sanity_restored',
        message: `Sanity Restoration: ${program.name}`,
        description: result.message,
        importance: 'medium',
      });

      stateChanges.push({
        type: 'sanity_restoration',
        value: result.sanityRestored,
        reason: program.name,
      });
    }
  }

  // 6. Spawn task forces
  if (newUnity > 50 && phase3.counterOccult.taskForces.length < 3 && Math.random() > 0.85) {
    const taskForce = createTaskForce(newUnity);
    phase3.counterOccult.taskForces.push(taskForce);

    events.push({
      type: 'task_force_created',
      message: `Elite Task Force Formed: ${taskForce.name}`,
      description: `Led by ${taskForce.leader.name}, specializing in ${taskForce.leader.specialization}`,
      importance: 'high',
    });
  }

  return { events, stateChanges };
}

// ============================================================================
// WEEK 10-11: ENDGAME SYSTEMS
// ============================================================================

/**
 * Process endgame systems
 */
function processEndgameTurn(
  state: GreatOldOnesState,
  phase2: Phase2State,
  phase3: Phase3State
): {
  events: Phase3TurnEvent[];
  stateChanges: Phase3StateChange[];
} {
  const events: Phase3TurnEvent[] = [];
  const stateChanges: Phase3StateChange[] = [];

  // 1. Check victory conditions every turn
  const victories = checkVictoryConditions(state, phase2, phase3);

  if (victories.length > 0) {
    phase3.endgame.availableVictories = victories;

    // Check for immediate victories (game enders)
    const immediateVictory = victories.find(
      v =>
        v.type === 'total_domination' ||
        v.type === 'shadow_empire' ||
        v.type === 'transcendence' ||
        v.type === 'banishment'
    );

    if (immediateVictory && !phase3.endgame.achievedVictory) {
      phase3.endgame.achievedVictory = immediateVictory;

      events.push({
        type: 'victory_achieved',
        message: `GAME OVER: ${immediateVictory.name}`,
        description: immediateVictory.description,
        importance: 'critical',
      });

      // Generate analytics
      phase3.endgame.analytics = generateCampaignAnalytics(
        state,
        phase2,
        phase3,
        immediateVictory.type
      );

      // Generate legacy perks
      phase3.endgame.legacyPerks = generateLegacyPerks(state, phase2, phase3.endgame.analytics);

      events.push({
        type: 'campaign_complete',
        message: `Campaign Complete - Grade: ${phase3.endgame.analytics.grade}`,
        description: `Score: ${phase3.endgame.analytics.overallScore}. ${phase3.endgame.legacyPerks.length} legacy perks unlocked for New Game+`,
        importance: 'critical',
      });
    }
  }

  // 2. Check for approaching victory conditions
  for (const victory of victories) {
    const conditionsMetCount = Object.values(victory.conditionsMet).filter(c => c).length;
    const totalConditions = Object.values(victory.conditionsMet).length;

    if (conditionsMetCount === totalConditions - 1) {
      events.push({
        type: 'victory_approaching',
        message: `${victory.name} Within Reach`,
        description: `Only one condition remaining for ${victory.type}`,
        importance: 'high',
      });
    }
  }

  return { events, stateChanges };
}

// ============================================================================
// EVENT AND STATE CHANGE TYPES
// ============================================================================

export interface Phase3TurnEvent {
  type:
    | 'phase3_unlock'
    | 'motivation_revealed'
    | 'truth_contradiction'
    | 'truth_complete'
    | 'rival_cult_emerges'
    | 'rival_cult_threat'
    | 'rival_cult_activity'
    | 'order_schism'
    | 'schism_critical'
    | 'resistance_tech'
    | 'tech_deployed'
    | 'alliance_formed'
    | 'joint_op_planned'
    | 'joint_op_success'
    | 'joint_op_failure'
    | 'sanity_restored'
    | 'task_force_created'
    | 'victory_achieved'
    | 'victory_approaching'
    | 'campaign_complete';

  message: string;
  description: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
}

export interface Phase3StateChange {
  type:
    | 'veil_damage'
    | 'veil_restoration'
    | 'corruption_loss'
    | 'sanity_restoration'
    | 'order_power_loss'
    | 'global_unity_increase';

  value: number;
  reason: string;
}

/**
 * Apply state changes to main game state
 */
export function applyPhase3StateChanges(
  state: GreatOldOnesState,
  changes: Phase3StateChange[]
): void {
  for (const change of changes) {
    switch (change.type) {
      case 'veil_damage':
        state.veil.integrity = Math.max(0, state.veil.integrity - change.value);
        break;

      case 'veil_restoration':
        state.veil.integrity = Math.min(100, state.veil.integrity + change.value);
        break;

      case 'corruption_loss':
        const perRegionLoss = change.value / state.regions.length;
        for (const region of state.regions) {
          region.corruption = Math.max(0, region.corruption - perRegionLoss);
        }
        state.resources.corruptionIndex = Math.max(
          0,
          state.resources.corruptionIndex - change.value
        );
        break;

      case 'sanity_restoration':
        const perRegionGain = change.value / state.regions.length;
        for (const region of state.regions) {
          region.sanitySanity = Math.min(100, region.sanitySanity + perRegionGain);
        }
        break;

      case 'order_power_loss':
        // Reduce eldritch power
        state.resources.eldritchPower = Math.max(
          0,
          state.resources.eldritchPower - change.value
        );
        break;
    }
  }
}

/**
 * Initialize Phase 3 state wrapper
 */
export function initializePhase3StateWrapper(seed?: string): Phase3State {
  return initializePhase3State(seed);
}
