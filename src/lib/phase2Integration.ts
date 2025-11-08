/**
 * Phase 2 Integration - Weeks 4-7
 * Integrates Domination, Corruption, and Convergence path systems with game state
 */

import { GreatOldOnesState, RegionalState } from '../types/greatOldOnes';

// Import Phase 2 systems
import {
  TerrorCampaign,
  MilitaryEngagement,
  GreatOldOneAwakening,
  performControlCheck,
  executeTerrorCampaign,
  resolveMilitaryEngagement,
} from './dominationPath';

import {
  InfluenceNetwork,
  MemeticCampaign,
  DreamRitual,
  PuppetGovernment,
  spreadMeme,
  generateCounterMeme,
} from './corruptionPath';

import {
  EnlightenmentProgram,
  TrueIntentionsMeter,
  CulturalMovement,
  SacrificeEconomy,
  progressEnlightenment,
  spreadCulturalMovement,
} from './convergencePath';

// ============================================================================
// PHASE 2 STATE EXTENSION
// ============================================================================

export interface Phase2State {
  /** Phase 2 unlocked? */
  unlocked: boolean;

  /** Current phase 2 week (4-7) */
  currentWeek: number;

  // === DOMINATION PATH ===
  domination: {
    terrorCampaigns: TerrorCampaign[];
    militaryEngagements: MilitaryEngagement[];
    greatOldOneAwakenings: GreatOldOneAwakening[];
    entityRampages: string[];  // Entity IDs that broke free
    fearLevel: number;  // Global fear scale 0-100
  };

  // === CORRUPTION PATH ===
  corruption: {
    influenceNetwork: InfluenceNetwork;
    memeticCampaigns: MemeticCampaign[];
    dreamRituals: DreamRitual[];
    puppetGovernments: PuppetGovernment[];
    sleeperCellsActivated: number;
    globalInfiltration: number;  // 0-100
  };

  // === CONVERGENCE PATH ===
  convergence: {
    enlightenmentPrograms: EnlightenmentProgram[];
    trueIntentionsMeter: TrueIntentionsMeter;
    culturalMovements: CulturalMovement[];
    sacrificeEconomy: SacrificeEconomy;
    voluntaryConversionRate: number;  // 0-100
    hybridsCreated: number;
  };

  // === SHARED SYSTEMS ===
  doctrinePoints: number;  // Earned through doctrine-specific actions
  elderOneFavor: {
    cthulhu: number;
    hastur: number;
    shubNiggurath: number;
    nyarlathotep: number;
  };
}

/**
 * Initialize Phase 2 state
 */
export function initializePhase2State(): Phase2State {
  return {
    unlocked: false,
    currentWeek: 4,

    domination: {
      terrorCampaigns: [],
      militaryEngagements: [],
      greatOldOneAwakenings: [],
      entityRampages: [],
      fearLevel: 0,
    },

    corruption: {
      influenceNetwork: {
        nodes: [],
        connections: [],
        networkPower: 0,
        depth: 0,
      },
      memeticCampaigns: [],
      dreamRituals: [],
      puppetGovernments: [],
      sleeperCellsActivated: 0,
      globalInfiltration: 0,
    },

    convergence: {
      enlightenmentPrograms: [],
      trueIntentionsMeter: {
        deceptionLevel: 0,
        promises: [],
        betrayals: [],
        redemptionAvailable: true,
        moralityScore: 0,
        publicTrust: 50,
      },
      culturalMovements: [],
      sacrificeEconomy: {
        volunteerPool: 0,
        martyrCults: [],
        pilgrimageSites: [],
        celebrities: [],
        ritualTourism: [],
      },
      voluntaryConversionRate: 0,
      hybridsCreated: 0,
    },

    doctrinePoints: 0,
    elderOneFavor: {
      cthulhu: 0,
      hastur: 0,
      shubNiggurath: 0,
      nyarlathotep: 0,
    },
  };
}

/**
 * Check if Phase 2 should unlock
 */
/**
 * Update Phase 2 systems (wrapper for processPhase2Turn for backward compatibility)
 */
export function updatePhase2Systems(
  state: GreatOldOnesState,
  phase2State: Phase2State
): Phase2State {
  const { events, stateChanges } = processPhase2Turn(state, phase2State);
  // Apply state changes to phase2State
  stateChanges.forEach(change => {
    applyPhase2StateChanges(phase2State, change);
  });
  return phase2State;
}

export function checkPhase2UnlockConditions(state: GreatOldOnesState): {
  shouldUnlock: boolean;
  reason: string;
} {
  // Conditions:
  // 1. Three regions have corruption > 30%
  const corruptedRegions = state.regions.filter(r => r.corruption > 30);
  if (corruptedRegions.length < 3) {
    return {
      shouldUnlock: false,
      reason: `Need 3 regions with >30% corruption (have ${corruptedRegions.length})`,
    };
  }

  // 2. High Priest council has ratified doctrine
  const councilUnity = state.council.unity;
  if (councilUnity < 60) {
    return {
      shouldUnlock: false,
      reason: `Council unity too low (need 60%, have ${councilUnity}%)`,
    };
  }

  // 3. At least 5 ritual sites established
  const totalSites = state.regions.reduce((sum, r) => sum + r.ritualSites.length, 0);
  if (totalSites < 5) {
    return {
      shouldUnlock: false,
      reason: `Need 5 ritual sites (have ${totalSites})`,
    };
  }

  // 4. Sufficient eldritch power accumulated
  if (state.resources.eldritchPower < 100) {
    return {
      shouldUnlock: false,
      reason: `Need 100 Eldritch Power (have ${state.resources.eldritchPower})`,
    };
  }

  return {
    shouldUnlock: true,
    reason: 'All Phase 2 unlock conditions met! Doctrine specialization available.',
  };
}

// ============================================================================
// TURN PROCESSING FOR PHASE 2 SYSTEMS
// ============================================================================

/**
 * Process Phase 2 systems each turn
 */
export function processPhase2Turn(
  state: GreatOldOnesState,
  phase2State: Phase2State
): {
  events: Phase2TurnEvent[];
  stateChanges: Phase2StateChange[];
} {
  const events: Phase2TurnEvent[] = [];
  const stateChanges: Phase2StateChange[] = [];

  if (!phase2State.unlocked) {
    // Check if should unlock
    const unlockCheck = checkPhase2UnlockConditions(state);
    if (unlockCheck.shouldUnlock) {
      phase2State.unlocked = true;
      events.push({
        type: 'phase2_unlock',
        message: 'Phase 2: Doctrine Specialization Unlocked!',
        description: unlockCheck.reason,
        importance: 'critical',
      });
    }
    return { events, stateChanges };
  }

  // Process based on selected doctrine
  if (state.doctrine === 'domination') {
    const dominationResults = processDominationTurn(state, phase2State);
    events.push(...dominationResults.events);
    stateChanges.push(...dominationResults.stateChanges);
  } else if (state.doctrine === 'corruption') {
    const corruptionResults = processCorruptionTurn(state, phase2State);
    events.push(...corruptionResults.events);
    stateChanges.push(...corruptionResults.stateChanges);
  } else if (state.doctrine === 'convergence') {
    const convergenceResults = processConvergenceTurn(state, phase2State);
    events.push(...convergenceResults.events);
    stateChanges.push(...convergenceResults.stateChanges);
  }

  // Process shared systems
  const sharedResults = processSharedSystems(state, phase2State);
  events.push(...sharedResults.events);
  stateChanges.push(...sharedResults.stateChanges);

  return { events, stateChanges };
}

/**
 * Process Domination-specific systems
 */
function processDominationTurn(
  state: GreatOldOnesState,
  phase2State: Phase2State
): {
  events: Phase2TurnEvent[];
  stateChanges: Phase2StateChange[];
} {
  const events: Phase2TurnEvent[] = [];
  const stateChanges: Phase2StateChange[] = [];

  // 1. Entity control checks
  for (const entity of state.summonedEntities) {
    const controlResult = performControlCheck(entity, state);

    if (!controlResult.maintained && entity.bound) {
      // Entity broke free!
      entity.bound = false;
      entity.task = 'rampage';
      phase2State.domination.entityRampages.push(entity.id);

      events.push({
        type: 'entity_rampage',
        message: `${entity.name} breaks free and rampages!`,
        description: controlResult.message,
        importance: 'high',
      });

      stateChanges.push({
        type: 'veil_damage',
        value: 20,
        reason: 'Rampaging entity witnessed',
      });
    } else if (controlResult.consequence) {
      events.push({
        type: 'entity_warning',
        message: `${entity.name} control weakening`,
        description: controlResult.consequence,
        importance: 'medium',
      });
    }

    // Update binding strength
    entity.bindingStrength = Math.max(
      0,
      Math.min(100, entity.bindingStrength + controlResult.bindingChange)
    );
  }

  // 2. Process active terror campaigns
  for (const campaign of phase2State.domination.terrorCampaigns) {
    const region = state.regions.find(r => r.regionId === campaign.targetRegionId);
    if (!region) continue;

    const assignedEntities = state.summonedEntities.filter(e =>
      campaign.assignedEntities.includes(e.id)
    );

    const terrorResult = executeTerrorCampaign(campaign, assignedEntities, region, state);

    events.push({
      type: 'terror_campaign',
      message: `Terror Campaign: ${campaign.name}`,
      description: terrorResult.message,
      importance: 'medium',
    });

    stateChanges.push({
      type: 'sanity_drain',
      value: terrorResult.sanityDrained,
      reason: `Terror campaign in ${campaign.targetRegionId}`,
    });

    stateChanges.push({
      type: 'veil_damage',
      value: terrorResult.veilDamage,
      reason: 'Terror campaign exposure',
    });

    // Add conversions
    if (terrorResult.conversions > 0) {
      stateChanges.push({
        type: 'cultist_recruitment',
        value: terrorResult.conversions,
        reason: 'Terror-induced conversions',
      });
    }

    // Update fear level
    phase2State.domination.fearLevel = Math.min(
      100,
      phase2State.domination.fearLevel + terrorResult.fearGenerated / 10
    );

    campaign.currentProgress += 1;
  }

  // 3. Progress Great Old One awakenings
  for (const awakening of phase2State.domination.greatOldOneAwakenings) {
    if (awakening.progress < 100) {
      // Natural slow progress
      awakening.progress += 1;

      if (awakening.progress >= 100 && awakening.currentStage < awakening.stages.length - 1) {
        events.push({
          type: 'awakening_ready',
          message: `${awakening.entityName} Awakening: Next Stage Ready`,
          description: `Stage ${awakening.currentStage + 1} can now be performed`,
          importance: 'high',
        });
      }
    }
  }

  return { events, stateChanges };
}

/**
 * Process Corruption-specific systems
 */
function processCorruptionTurn(
  state: GreatOldOnesState,
  phase2State: Phase2State
): {
  events: Phase2TurnEvent[];
  stateChanges: Phase2StateChange[];
} {
  const events: Phase2TurnEvent[] = [];
  const stateChanges: Phase2StateChange[] = [];

  // 1. Spread memetic agents
  for (const campaign of phase2State.corruption.memeticCampaigns) {
    const region = state.regions.find(r => r.regionId === campaign.targetRegionId);
    if (!region) continue;

    const amplificationNodes = phase2State.corruption.influenceNetwork.nodes.filter(
      n => campaign.amplificationNodes.includes(n.id)
    );

    const spreadResult = spreadMeme(campaign.agent, region, amplificationNodes, state);

    campaign.agent.reach = spreadResult.newReach;

    events.push({
      type: 'memetic_spread',
      message: `Meme spreads: ${campaign.agent.name}`,
      description: spreadResult.message,
      importance: 'low',
    });

    stateChanges.push({
      type: 'sanity_drain',
      value: spreadResult.sanityDrained,
      reason: `Memetic infection: ${campaign.agent.name}`,
    });

    stateChanges.push({
      type: 'corruption_gain',
      value: spreadResult.corruptionGained,
      reason: 'Memetic corruption',
    });

    // Counter-meme attempts
    if (spreadResult.counterMemeDetected) {
      const counterResult = generateCounterMeme(campaign.agent, region);

      if (counterResult.success) {
        campaign.agent.virality -= counterResult.viralityReduction;

        events.push({
          type: 'counter_meme',
          message: 'Counter-meme detected!',
          description: counterResult.message,
          importance: 'medium',
        });
      }
    }

    campaign.progress += 1;
  }

  // 2. Process dream rituals
  for (const ritual of phase2State.corruption.dreamRituals) {
    ritual.remainingTurns -= 1;

    if (ritual.remainingTurns <= 0) {
      events.push({
        type: 'dream_ritual_complete',
        message: `Dream Ritual Complete: ${ritual.name}`,
        description: `Nightmares fade from ${ritual.targetRegionId}`,
        importance: 'low',
      });

      // Remove ritual
      const index = phase2State.corruption.dreamRituals.indexOf(ritual);
      if (index > -1) {
        phase2State.corruption.dreamRituals.splice(index, 1);
      }
    } else {
      // Ongoing effects
      const region = state.regions.find(r => r.regionId === ritual.targetRegionId);
      if (region) {
        const sanityLoss = ritual.intensity * 0.2;

        stateChanges.push({
          type: 'sanity_drain',
          value: sanityLoss,
          reason: `Ongoing nightmares in ${ritual.targetRegionId}`,
        });
      }
    }
  }

  // 3. Calculate global infiltration
  const totalNodes = phase2State.corruption.influenceNetwork.nodes.length;
  const avgCorruption =
    totalNodes > 0
      ? phase2State.corruption.influenceNetwork.nodes.reduce((sum, n) => sum + n.corruptionLevel, 0) /
        totalNodes
      : 0;

  phase2State.corruption.globalInfiltration = avgCorruption;

  if (phase2State.corruption.globalInfiltration > 70) {
    events.push({
      type: 'infiltration_milestone',
      message: 'Deep State Achieved',
      description: 'Your influence network dominates global institutions!',
      importance: 'high',
    });
  }

  if (phase2State.corruption.influenceNetwork.nodes.length > 0) {
    const aggregated = phase2State.corruption.influenceNetwork.nodes.reduce(
      (acc, node) => {
        for (const benefit of node.benefits) {
          switch (benefit.type) {
            case 'resource_generation':
              acc.sanityFragments += benefit.value;
              break;
            case 'cultist_recruitment':
              acc.cultists += benefit.value;
              break;
            case 'ritual_support':
              acc.corruption += benefit.value;
              break;
            case 'veil_protection':
              acc.veil += benefit.value;
              break;
            case 'investigation_suppression':
              acc.veil += benefit.value;
              break;
          }
        }
        return acc;
      },
      { sanityFragments: 0, cultists: 0, corruption: 0, veil: 0 }
    );

    if (aggregated.sanityFragments > 0) {
      stateChanges.push({
        type: 'sanity_fragments',
        value: aggregated.sanityFragments,
        reason: 'Influence network siphons institutional resources',
      });
    }

    if (aggregated.cultists > 0) {
      stateChanges.push({
        type: 'cultist_recruitment',
        value: aggregated.cultists,
        reason: 'Influence network converts insiders into cultists',
      });
    }

    if (aggregated.corruption > 0) {
      stateChanges.push({
        type: 'corruption_gain',
        value: aggregated.corruption,
        reason: 'Institutional logistics accelerate ritual planning',
      });
    }

    if (aggregated.veil > 0) {
      stateChanges.push({
        type: 'veil_damage',
        value: -aggregated.veil,
        reason: 'Influence network suppresses public exposure',
      });
    }
  }

  return { events, stateChanges };
}

/**
 * Process Convergence-specific systems
 */
function processConvergenceTurn(
  state: GreatOldOnesState,
  phase2State: Phase2State
): {
  events: Phase2TurnEvent[];
  stateChanges: Phase2StateChange[];
} {
  const events: Phase2TurnEvent[] = [];
  const stateChanges: Phase2StateChange[] = [];

  // 1. Progress enlightenment programs
  for (const program of phase2State.convergence.enlightenmentPrograms) {
    const pushHard = false;  // Could be player choice
    const result = progressEnlightenment(program, pushHard, state);

    events.push({
      type: 'enlightenment_progress',
      message: `${program.name}: ${result.message}`,
      description: `Conversions: ${result.conversions}, Dropouts: ${result.dropouts}`,
      importance: 'low',
    });

    // Update state
    program.enrollmentCount = Math.max(
      0,
      program.enrollmentCount + result.conversions - result.dropouts
    );

    if (result.hybridsCreated > 0) {
      phase2State.convergence.hybridsCreated += result.hybridsCreated;

      events.push({
        type: 'hybrid_creation',
        message: `${result.hybridsCreated} Hybrids Created!`,
        description: 'Human-eldritch hybrids successfully transformed',
        importance: 'high',
      });
    }

    if (result.psychicsAwakened > 0) {
      stateChanges.push({
        type: 'psychic_awakening',
        value: result.psychicsAwakened,
        reason: `Enlightenment program: ${program.name}`,
      });
    }

    if (result.sanityFragmentsGained > 0) {
      stateChanges.push({
        type: 'sanity_fragments',
        value: result.sanityFragmentsGained,
        reason: 'Voluntary sacrifice from enlightened',
      });
    }

    // Warnings
    for (const warning of result.warnings) {
      events.push({
        type: 'program_warning',
        message: 'Program Issue',
        description: warning,
        importance: 'medium',
      });
    }
  }

  // 2. Spread cultural movements
  for (const movement of phase2State.convergence.culturalMovements) {
    const amplificationNodes: any[] = [];  // Could pull from corruption network if available

    const spreadResult = spreadCulturalMovement(movement, amplificationNodes, state);

    movement.reach = Math.min(100, movement.reach + spreadResult.reachGain);

    events.push({
      type: 'cultural_movement',
      message: `${movement.name}: ${spreadResult.message}`,
      description: `Reach: ${movement.reach.toFixed(1)}%`,
      importance: 'low',
    });

    if (spreadResult.conversions > 0) {
      stateChanges.push({
        type: 'cultist_recruitment',
        value: spreadResult.conversions,
        reason: `Cultural movement: ${movement.name}`,
      });
    }

    if (spreadResult.backlash) {
      stateChanges.push({
        type: 'veil_damage',
        value: 10,
        reason: 'Cultural movement backlash',
      });
    }
  }

  // 3. Calculate voluntary conversion rate
  const totalEnrollment = phase2State.convergence.enlightenmentPrograms.reduce(
    (sum, p) => sum + p.enrollmentCount,
    0
  );

  const avgConversionRate =
    phase2State.convergence.enlightenmentPrograms.length > 0
      ? phase2State.convergence.enlightenmentPrograms.reduce((sum, p) => sum + p.conversionRate, 0) /
        phase2State.convergence.enlightenmentPrograms.length
      : 0;

  phase2State.convergence.voluntaryConversionRate = avgConversionRate;

  // 4. True Intentions Meter natural decay/improvement
  const meter = phase2State.convergence.trueIntentionsMeter;

  // Trust naturally decays if deception is high
  if (meter.deceptionLevel > 50) {
    meter.publicTrust = Math.max(0, meter.publicTrust - 1);
  }

  // Check for major milestones
  if (meter.moralityScore > 70 && meter.redemptionAvailable) {
    events.push({
      type: 'redemption_milestone',
      message: 'Path to Redemption Open',
      description: 'You are genuinely guiding humanity toward enlightenment',
      importance: 'critical',
    });
  } else if (meter.moralityScore < -70) {
    events.push({
      type: 'morality_warning',
      message: 'Darkness Consumes',
      description: 'Your deception has crossed the point of no return',
      importance: 'high',
    });
  }

  return { events, stateChanges };
}

/**
 * Process systems shared across all doctrines
 */
function processSharedSystems(
  state: GreatOldOnesState,
  phase2State: Phase2State
): {
  events: Phase2TurnEvent[];
  stateChanges: Phase2StateChange[];
} {
  const events: Phase2TurnEvent[] = [];
  const stateChanges: Phase2StateChange[] = [];

  // Elder One favor accumulation based on doctrine actions
  // (This would be triggered by specific player actions)

  // Check for Phase 2 victory conditions
  const victoryCheck = checkPhase2VictoryConditions(state, phase2State);
  if (victoryCheck.achieved) {
    events.push({
      type: 'victory',
      message: `VICTORY: ${victoryCheck.victoryType}`,
      description: victoryCheck.description,
      importance: 'critical',
    });
  }

  return { events, stateChanges };
}

/**
 * Check Phase 2 victory conditions
 */
export function checkPhase2VictoryConditions(
  state: GreatOldOnesState,
  phase2State: Phase2State
): {
  achieved: boolean;
  victoryType?: string;
  description?: string;
} {
  // Domination victory: Great Old One awakened
  if (state.doctrine === 'domination') {
    const fullyAwakened = phase2State.domination.greatOldOneAwakenings.find(
      a => a.currentStage === a.stages.length - 1 && a.progress >= 100
    );

    if (fullyAwakened) {
      return {
        achieved: true,
        victoryType: 'Total Domination',
        description: `${fullyAwakened.entityName} walks the Earth! Humanity kneels or perishes!`,
      };
    }
  }

  // Corruption victory: Shadow Empire
  if (state.doctrine === 'corruption') {
    const avgCorruption =
      state.regions.reduce((sum, r) => sum + r.corruption, 0) / state.regions.length;

    if (avgCorruption > 90 && phase2State.corruption.puppetGovernments.length >= 8) {
      return {
        achieved: true,
        victoryType: 'Shadow Empire',
        description: 'The world unknowingly serves the Order. You rule from the shadows!',
      };
    }
  }

  // Convergence victory: Transcendence
  if (state.doctrine === 'convergence') {
    if (
      phase2State.convergence.voluntaryConversionRate > 80 &&
      phase2State.convergence.hybridsCreated > 100
    ) {
      const meter = phase2State.convergence.trueIntentionsMeter;

      if (meter.moralityScore > 50) {
        return {
          achieved: true,
          victoryType: 'True Convergence',
          description:
            'Humanity willingly transcends! A new cosmic consciousness emerges in harmony!',
        };
      } else {
        return {
          achieved: true,
          victoryType: 'Forced Transcendence',
          description:
            'Humanity has been transformed, willing or not. They are no longer entirely human.',
        };
      }
    }
  }

  return { achieved: false };
}

// ============================================================================
// EVENT AND STATE CHANGE TYPES
// ============================================================================

export interface Phase2TurnEvent {
  type:
    | 'phase2_unlock'
    | 'entity_rampage'
    | 'entity_warning'
    | 'terror_campaign'
    | 'awakening_ready'
    | 'memetic_spread'
    | 'counter_meme'
    | 'dream_ritual_complete'
    | 'infiltration_milestone'
    | 'enlightenment_progress'
    | 'hybrid_creation'
    | 'program_warning'
    | 'cultural_movement'
    | 'redemption_milestone'
    | 'morality_warning'
    | 'victory';

  message: string;
  description: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
}

export interface Phase2StateChange {
  type:
    | 'veil_damage'
    | 'sanity_drain'
    | 'cultist_recruitment'
    | 'corruption_gain'
    | 'psychic_awakening'
    | 'sanity_fragments';

  value: number;
  reason: string;
}

/**
 * Apply state changes to main game state
 */
export function applyPhase2StateChanges(
  state: GreatOldOnesState,
  changes: Phase2StateChange[]
): void {
  for (const change of changes) {
    switch (change.type) {
      case 'veil_damage':
        if (change.value >= 0) {
          state.veil.integrity = Math.max(
            0,
            state.veil.integrity - change.value
          );
        } else {
          state.veil.integrity = Math.min(
            100,
            state.veil.integrity - change.value
          );
        }
        break;

      case 'sanity_drain':
        // Apply globally or to specific region based on reason
        // For now, apply globally
        const perRegionLoss = change.value / state.regions.length;
        for (const region of state.regions) {
          region.sanitySanity = Math.max(0, region.sanitySanity - perRegionLoss);
        }
        break;

      case 'cultist_recruitment':
        // Add to cultist cells (simplified)
        // Would need region targeting in real implementation
        break;

      case 'corruption_gain':
        const perRegionGain = change.value / state.regions.length;
        for (const region of state.regions) {
          region.corruption = Math.min(100, region.corruption + perRegionGain);
        }
        break;

      case 'sanity_fragments':
        state.resources.sanityFragments = Math.min(
          state.limits.maxSanityFragments,
          state.resources.sanityFragments + change.value
        );
        break;
    }
  }
}
