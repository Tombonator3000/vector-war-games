/**
 * Spy Mission Executor
 *
 * Applies the actual effects of completed spy missions to game state
 */

import type { Nation, GameState } from '@/types/game';
import type { SpyMission, MissionResult, MissionReward } from '@/types/spySystem';

// ============================================================================
// MISSION EFFECT APPLICATION
// ============================================================================

/**
 * Apply mission rewards to game state
 */
export function applyMissionRewards(
  rewards: MissionReward,
  mission: SpyMission,
  spyNation: Nation,
  targetNation: Nation,
  gameState: GameState
): {
  updatedSpyNation: Nation;
  updatedTargetNation: Nation;
  updatedGameState: GameState;
  effectMessages: string[];
} {
  const effectMessages: string[] = [];
  let updatedSpyNation = { ...spyNation };
  let updatedTargetNation = { ...targetNation };
  let updatedGameState = { ...gameState };

  // Apply mission-specific effects
  switch (mission.type) {
    case 'steal-tech':
      const techResult = applyStealTech(rewards, updatedSpyNation, updatedTargetNation);
      updatedSpyNation = techResult.spyNation;
      effectMessages.push(...techResult.messages);
      break;

    case 'sabotage-production':
      const saboProdResult = applySabotageProduction(rewards, updatedTargetNation);
      updatedTargetNation = saboProdResult.targetNation;
      effectMessages.push(...saboProdResult.messages);
      break;

    case 'sabotage-military':
      const saboMilResult = applySabotageMilitary(rewards, updatedTargetNation);
      updatedTargetNation = saboMilResult.targetNation;
      effectMessages.push(...saboMilResult.messages);
      break;

    case 'rig-election':
      const electionResult = applyRigElection(rewards, updatedTargetNation);
      updatedTargetNation = electionResult.targetNation;
      effectMessages.push(...electionResult.messages);
      break;

    case 'sow-dissent':
      const dissentResult = applySowDissent(rewards, updatedTargetNation, updatedGameState);
      updatedTargetNation = dissentResult.targetNation;
      updatedGameState = dissentResult.gameState;
      effectMessages.push(...dissentResult.messages);
      break;

    case 'assassination':
      const assassinResult = applyAssassination(rewards, updatedTargetNation);
      updatedTargetNation = assassinResult.targetNation;
      effectMessages.push(...assassinResult.messages);
      break;

    case 'gather-intel':
      const intelResult = applyGatherIntel(rewards, updatedSpyNation);
      updatedSpyNation = intelResult.spyNation;
      effectMessages.push(...intelResult.messages);
      break;

    case 'propaganda':
      const propagandaResult = applyPropaganda(rewards, updatedTargetNation);
      updatedTargetNation = propagandaResult.targetNation;
      effectMessages.push(...propagandaResult.messages);
      break;

    case 'recruit-asset':
      effectMessages.push('Local asset recruited - future operations have +10% success rate');
      break;

    case 'cyber-assist':
      const cyberResult = applyCyberAssist(updatedTargetNation);
      updatedTargetNation = cyberResult.targetNation;
      effectMessages.push(...cyberResult.messages);
      break;

    case 'false-flag':
      const falseFlagResult = applyFalseFlag(updatedTargetNation, updatedGameState, spyNation);
      updatedGameState = falseFlagResult.gameState;
      effectMessages.push(...falseFlagResult.messages);
      break;

    case 'exfiltrate':
      const exfilResult = applyExfiltrate(rewards, updatedSpyNation);
      updatedSpyNation = exfilResult.spyNation;
      effectMessages.push(...exfilResult.messages);
      break;

    case 'counter-intel':
      effectMessages.push('Counter-intelligence sweep completed');
      break;
  }

  return {
    updatedSpyNation,
    updatedTargetNation,
    updatedGameState,
    effectMessages,
  };
}

// ============================================================================
// SPECIFIC MISSION EFFECTS
// ============================================================================

/**
 * Apply steal tech mission effects
 */
function applyStealTech(
  rewards: MissionReward,
  spyNation: Nation,
  targetNation: Nation
): {
  spyNation: Nation;
  messages: string[];
} {
  const messages: string[] = [];
  const updated = { ...spyNation };

  if (rewards.techStolen) {
    // Grant the stolen tech to spy nation
    if (!updated.researched) {
      updated.researched = {};
    }
    updated.researched[rewards.techStolen] = true;

    messages.push(`Successfully stole technology: ${rewards.techStolen}`);

    // Cancel current research if it's the same as stolen tech
    if (updated.researchQueue?.projectId === rewards.techStolen) {
      updated.researchQueue = null;
      messages.push('Current research cancelled (already obtained via espionage)');
    }
  }

  if (rewards.intelGained) {
    updated.intel = (updated.intel || 0) + rewards.intelGained;
    messages.push(`Gained ${rewards.intelGained} Intel from stolen documents`);
  }

  return { spyNation: updated, messages };
}

/**
 * Apply sabotage production mission effects
 */
function applySabotageProduction(
  rewards: MissionReward,
  targetNation: Nation
): {
  targetNation: Nation;
  messages: string[];
} {
  const messages: string[] = [];
  const updated = { ...targetNation };

  if (rewards.productionDamage) {
    const actualDamage = Math.min(rewards.productionDamage, updated.production);
    updated.production = Math.max(0, updated.production - actualDamage);

    messages.push(`Sabotaged ${targetNation.name}'s production facilities (-${actualDamage} Production)`);

    // Also reduce max production temporarily if they have that property
    if (updated.maxProduction) {
      updated.maxProduction = Math.max(50, updated.maxProduction - Math.floor(actualDamage * 0.5));
    }

    // Increase instability
    if (updated.instability !== undefined) {
      updated.instability = Math.min(100, updated.instability + 10);
      messages.push(`Instability increased in ${targetNation.name}`);
    }
  }

  return { targetNation: updated, messages };
}

/**
 * Apply sabotage military mission effects
 */
function applySabotageMilitary(
  rewards: MissionReward,
  targetNation: Nation
): {
  targetNation: Nation;
  messages: string[];
} {
  const messages: string[] = [];
  const updated = { ...targetNation };

  // Damage military assets
  const missilesDamaged = Math.floor(updated.missiles * 0.2);
  if (missilesDamaged > 0) {
    updated.missiles = Math.max(0, updated.missiles - missilesDamaged);
    messages.push(`Destroyed ${missilesDamaged} missiles in ${targetNation.name}`);
  }

  // Reduce cyber readiness
  if (updated.cyber) {
    updated.cyber = { ...updated.cyber };
    updated.cyber.readiness = Math.max(0, updated.cyber.readiness - 30);
    messages.push(`Cyber readiness reduced in ${targetNation.name}`);
  }

  // Reduce defense temporarily
  const defenseReduction = Math.floor(updated.defense * 0.15);
  if (defenseReduction > 0) {
    updated.defense = Math.max(0, updated.defense - defenseReduction);
    messages.push(`Defense capabilities reduced (-${defenseReduction})`);
  }

  return { targetNation: updated, messages };
}

/**
 * Apply rig election mission effects
 */
function applyRigElection(
  rewards: MissionReward,
  targetNation: Nation
): {
  targetNation: Nation;
  messages: string[];
} {
  const messages: string[] = [];
  const updated = { ...targetNation };

  // Reduce morale
  if (rewards.moraleImpact) {
    updated.morale = Math.max(0, updated.morale + rewards.moraleImpact);
    messages.push(`Morale in ${targetNation.name} decreased by ${Math.abs(rewards.moraleImpact)}`);
  }

  // Reduce public opinion
  updated.publicOpinion = Math.max(0, updated.publicOpinion - 20);
  messages.push(`Public opinion decreased in ${targetNation.name}`);

  // Increase instability
  if (updated.instability !== undefined) {
    updated.instability = Math.min(100, updated.instability + 20);
    messages.push(`Political instability increased`);
  }

  // Trigger early election
  if (updated.electionTimer > 5) {
    updated.electionTimer = Math.min(updated.electionTimer, 5);
    messages.push(`Emergency election triggered`);
  }

  // Reduce cabinet approval
  updated.cabinetApproval = Math.max(0, updated.cabinetApproval - 25);
  messages.push(`Cabinet approval plummeted`);

  return { targetNation: updated, messages };
}

/**
 * Apply sow dissent mission effects
 */
function applySowDissent(
  rewards: MissionReward,
  targetNation: Nation,
  gameState: GameState
): {
  targetNation: Nation;
  gameState: GameState;
  messages: string[];
} {
  const messages: string[] = [];
  const updated = { ...targetNation };
  const updatedGameState = { ...gameState };

  // Apply trust impacts
  if (rewards.trustImpact) {
    if (!updated.trustRecords) {
      updated.trustRecords = {};
    }

    for (const [nationId, trustChange] of Object.entries(rewards.trustImpact)) {
      const currentTrust = updated.trustRecords[nationId]?.trustScore || 50;
      const newTrust = Math.max(0, Math.min(100, currentTrust + trustChange));

      updated.trustRecords[nationId] = {
        ...updated.trustRecords[nationId],
        trustScore: newTrust,
        lastUpdated: gameState.turn,
        history: [
          ...(updated.trustRecords[nationId]?.history || []),
          {
            turn: gameState.turn,
            delta: trustChange,
            reason: 'Propaganda campaign',
            newValue: newTrust,
          },
        ].slice(-20), // Keep last 20 events
      };

      const nation = updatedGameState.nations.find((n) => n.id === nationId);
      messages.push(`Trust between ${targetNation.name} and ${nation?.name || 'another nation'} decreased`);
    }
  }

  // Reduce morale
  updated.morale = Math.max(0, updated.morale - 10);
  messages.push(`Dissent sown in ${targetNation.name} - morale decreased`);

  return { targetNation: updated, gameState: updatedGameState, messages };
}

/**
 * Apply assassination mission effects
 */
function applyAssassination(
  rewards: MissionReward,
  targetNation: Nation
): {
  targetNation: Nation;
  messages: string[];
} {
  const messages: string[] = [];
  const updated = { ...targetNation };

  if (rewards.leaderAssassinated) {
    messages.push(`⚠️ ${targetNation.leader} assassinated in ${targetNation.name}!`);

    // Massive instability
    if (updated.instability !== undefined) {
      updated.instability = Math.min(100, updated.instability + 40);
      messages.push(`Extreme political instability in ${targetNation.name}`);
    }

    // Trigger immediate election
    updated.electionTimer = 1;
    messages.push(`Emergency election scheduled immediately`);

    // Plummet morale and public opinion
    updated.morale = Math.max(0, updated.morale - 30);
    updated.publicOpinion = Math.max(0, updated.publicOpinion - 35);
    messages.push(`National mourning - morale and opinion collapsed`);

    // Cabinet approval crashes
    updated.cabinetApproval = Math.max(0, updated.cabinetApproval - 40);

    // Reset leader abilities if any
    if (updated.leaderAbilityState) {
      // Leader abilities will be reset when new leader is elected
      messages.push(`Leadership transition underway`);
    }
  }

  return { targetNation: updated, messages };
}

/**
 * Apply gather intel mission effects
 */
function applyGatherIntel(
  rewards: MissionReward,
  spyNation: Nation
): {
  spyNation: Nation;
  messages: string[];
} {
  const messages: string[] = [];
  const updated = { ...spyNation };

  if (rewards.intelGained) {
    updated.intel = (updated.intel || 0) + rewards.intelGained;
    messages.push(`Gathered ${rewards.intelGained} Intel`);
  }

  return { spyNation: updated, messages };
}

/**
 * Apply propaganda mission effects
 */
function applyPropaganda(
  rewards: MissionReward,
  targetNation: Nation
): {
  targetNation: Nation;
  messages: string[];
} {
  const messages: string[] = [];
  const updated = { ...targetNation };

  if (rewards.moraleImpact) {
    updated.morale = Math.max(0, updated.morale + rewards.moraleImpact);
    messages.push(`Propaganda reduced morale in ${targetNation.name} by ${Math.abs(rewards.moraleImpact)}`);
  }

  // Also reduce public opinion
  updated.publicOpinion = Math.max(0, updated.publicOpinion - 15);
  messages.push(`Public opinion weakened`);

  return { targetNation: updated, messages };
}

/**
 * Apply cyber assist mission effects
 */
function applyCyberAssist(
  targetNation: Nation
): {
  targetNation: Nation;
  messages: string[];
} {
  const messages: string[] = [];
  const updated = { ...targetNation };

  if (updated.cyber) {
    updated.cyber = { ...updated.cyber };

    // Temporarily weaken cyber defenses
    updated.cyber.defense = Math.max(0, updated.cyber.defense - 15);
    updated.cyber.detection = Math.max(0, updated.cyber.detection - 10);

    messages.push(`Cyber defenses weakened in ${targetNation.name}`);
    messages.push(`Future cyber and espionage operations will be easier`);
  }

  return { targetNation: updated, messages };
}

/**
 * Apply false flag mission effects
 */
function applyFalseFlag(
  targetNation: Nation,
  gameState: GameState,
  spyNation: Nation
): {
  gameState: GameState;
  messages: string[];
} {
  const messages: string[] = [];
  const updatedGameState = { ...gameState };

  // Find a third nation to frame
  const otherNations = updatedGameState.nations.filter(
    (n) => n.id !== targetNation.id && n.id !== spyNation.id && !n.eliminated
  );

  if (otherNations.length > 0) {
    // Pick nation with lowest relationship with target
    const framedNation = otherNations.sort((a, b) => {
      const aRel = targetNation.relationships?.[a.id] || 0;
      const bRel = targetNation.relationships?.[b.id] || 0;
      return aRel - bRel;
    })[0];

    messages.push(`False flag operation successful - ${framedNation.name} implicated`);
    messages.push(`${targetNation.name} believes ${framedNation.name} is responsible`);

    // Could add relationship penalties between target and framed nation here
    // This would be done in the diplomatic integration
  } else {
    messages.push(`False flag operation completed but no suitable target to frame`);
  }

  return { gameState: updatedGameState, messages };
}

/**
 * Apply exfiltrate mission effects
 */
function applyExfiltrate(
  rewards: MissionReward,
  spyNation: Nation
): {
  spyNation: Nation;
  messages: string[];
} {
  const messages: string[] = [];
  const updated = { ...spyNation };

  if (rewards.intelGained) {
    updated.intel = (updated.intel || 0) + rewards.intelGained;
    messages.push(`Asset exfiltrated - gained ${rewards.intelGained} Intel`);
  }

  messages.push(`High-value asset successfully extracted`);

  return { spyNation: updated, messages };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get description of mission effects for UI
 */
export function getMissionEffectDescription(missionType: string): string {
  const descriptions: Record<string, string> = {
    'steal-tech': 'Steal a random completed research from target nation',
    'sabotage-production': 'Reduce target production by 30% and increase instability',
    'sabotage-military': 'Destroy 20% of missiles and reduce defense capabilities',
    'rig-election': 'Reduce morale, trigger early elections, and cause political chaos',
    'sow-dissent': 'Reduce trust with other nations and damage morale',
    'assassination': 'Assassinate leader, trigger immediate elections, cause massive instability',
    'gather-intel': 'Gather valuable intelligence (+40 Intel)',
    'counter-intel': 'Hunt for enemy spies in your territory',
    'propaganda': 'Spread propaganda to reduce morale and public opinion',
    'recruit-asset': 'Recruit local asset to improve future operations',
    'cyber-assist': 'Weaken cyber defenses for easier future operations',
    'false-flag': 'Frame another nation for an attack',
    'exfiltrate': 'Extract a high-value asset or defector',
  };

  return descriptions[missionType] || 'Unknown mission type';
}

/**
 * Get mission risk level for UI
 */
export function getMissionRiskLevel(detectionRisk: number): 'low' | 'medium' | 'high' | 'extreme' {
  if (detectionRisk < 25) return 'low';
  if (detectionRisk < 50) return 'medium';
  if (detectionRisk < 75) return 'high';
  return 'extreme';
}

/**
 * Get mission duration description
 */
export function getMissionDurationDescription(turns: number): string {
  if (turns === 1) return '1 turn';
  return `${turns} turns`;
}
