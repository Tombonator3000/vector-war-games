/**
 * Leader Ability Executor - FASE 3.2
 *
 * Handles execution of leader abilities and their effects on game state.
 */

import type { Nation, GameState } from '@/types/game';
import type {
  LeaderAbility,
  LeaderAbilityEffect,
  AbilityUseResult,
  AbilityEffectResult,
} from '@/types/leaderAbilities';
import { useAbility } from '@/types/leaderAbilities';
import PlayerManager from '@/state/PlayerManager';

/**
 * Execute a leader ability
 */
export function executeLeaderAbility(
  ability: LeaderAbility,
  nation: Nation,
  gameState: GameState,
  targetId?: string
): AbilityUseResult {
  const effects: AbilityEffectResult[] = [];
  let message = '';

  try {
    // Update ability state (decrement uses, set cooldown)
    const newAbilityState = useAbility(ability, gameState.turn);

    // Execute the effect based on type
    switch (ability.effect.type) {
      case 'force-peace':
        const peaceEffects = executeForcePeace(nation, gameState, ability.effect);
        effects.push(...peaceEffects);
        message = `${nation.name} has invoked ${ability.name}! All wars are temporarily suspended.`;
        break;

      case 'first-strike':
        const strikeEffect = executeFirstStrike(nation, targetId, gameState, ability.effect);
        effects.push(strikeEffect);
        message = `${nation.name} launches a devastating ${ability.name}!`;
        break;

      case 'rapid-mobilization':
        const mobilizationEffect = executeRapidMobilization(nation, ability.effect);
        effects.push(mobilizationEffect);
        message = `${nation.name} activates ${ability.name}! Military production surges!`;
        break;

      case 'summon-entity':
        const summonEffect = executeSummonEntity(nation, targetId, gameState, ability.effect);
        effects.push(summonEffect);
        message = `${nation.name} summons a Great Old One! Reality trembles!`;
        break;

      case 'reality-warp':
        const warpEffects = executeRealityWarp(nation, gameState, ability);
        effects.push(...warpEffects);
        message = `${nation.name} tears the fabric of reality with ${ability.name}!`;
        break;

      case 'false-flag':
        const flagEffect = executeFalseFlag(nation, targetId, gameState, ability.effect);
        effects.push(flagEffect);
        message = `${nation.name} executes a masterful deception!`;
        break;

      case 'corruption-surge':
        const corruptionEffect = executeCorruptionSurge(nation, targetId, gameState, ability.effect);
        effects.push(corruptionEffect);
        message = `${nation.name} spreads corruption across ${effects[0]?.targetName || 'the target'}!`;
        break;

      case 'missile-shield':
        const shieldEffect = executeMissileShield(nation, ability.effect);
        effects.push(shieldEffect);
        message = `${nation.name} activates impenetrable missile defense!`;
        break;

      case 'steal-resources':
        const stealEffects = executeStealResources(nation, targetId, gameState, ability.effect);
        effects.push(...stealEffects);
        message = `${nation.name} conducts covert resource acquisition!`;
        break;

      case 'boost-relationships':
        const boostEffects = executeBoostRelationships(nation, gameState, ability.effect);
        effects.push(...boostEffects);
        message = `${nation.name} improves international relations!`;
        break;

      case 'economic-boom':
        const boomEffect = executeEconomicBoom(nation, ability.effect);
        effects.push(boomEffect);
        message = `${nation.name} experiences an economic miracle!`;
        break;

      case 'propaganda-wave':
        const propagandaEffect = executePropagandaWave(nation, targetId, gameState, ability.effect);
        effects.push(propagandaEffect);
        message = `${nation.name} unleashes a devastating propaganda campaign!`;
        break;

      default:
        message = `${nation.name} uses ${ability.name}, but the effect is not yet implemented.`;
    }

    return {
      success: true,
      message,
      effects,
      newState: {
        leaderName: nation.leader,
        ability: newAbilityState,
        isAvailable: newAbilityState.usesRemaining > 0 && newAbilityState.currentCooldown === 0,
        history: [],
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to use ${ability.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      effects: [],
      newState: {
        leaderName: nation.leader,
        ability,
        isAvailable: false,
        unavailableReason: 'Error during execution',
        history: [],
      },
    };
  }
}

// ============================================================================
// EFFECT IMPLEMENTATIONS
// ============================================================================

function executeForcePeace(
  nation: Nation,
  gameState: GameState,
  effect: LeaderAbilityEffect
): AbilityEffectResult[] {
  const results: AbilityEffectResult[] = [];
  const duration = effect.duration || 3;

  // Find all nations at war with the player
  const nations = PlayerManager.getNations();
  for (const otherNation of nations) {
    if (otherNation.id === nation.id) continue;

    const relationship = nation.relationships?.[otherNation.id] || 0;
    if (relationship < -50) {
      // Force truce
      if (!nation.treaties) nation.treaties = {};
      if (!otherNation.treaties) otherNation.treaties = {};

      nation.treaties[otherNation.id] = { truceTurns: duration, forcedPeace: true };
      otherNation.treaties[nation.id] = { truceTurns: duration, forcedPeace: true };

      // Improve relationship slightly
      if (nation.relationships) {
        nation.relationships[otherNation.id] = Math.max(-40, relationship + 10);
      }
      if (otherNation.relationships) {
        otherNation.relationships[nation.id] = Math.max(-40, relationship + 10);
      }

      results.push({
        targetId: otherNation.id,
        targetName: otherNation.name,
        effectType: 'force-peace',
        description: `Forced ${duration}-turn truce established`,
      });
    }
  }

  return results;
}

function executeFirstStrike(
  nation: Nation,
  targetId: string | undefined,
  gameState: GameState,
  effect: LeaderAbilityEffect
): AbilityEffectResult {
  const bonus = effect.value || 100;

  // Apply temporary first strike bonus
  nation.firstStrikeBonus = bonus;
  nation.firstStrikeActive = true;
  nation.firstStrikeTurnsRemaining = effect.duration || 1;

  const target = targetId ? gameState.nations.find(n => n.id === targetId) : null;

  return {
    targetId: targetId || nation.id,
    targetName: target?.name || 'Selected targets',
    effectType: 'first-strike',
    description: `+${bonus}% attack effectiveness for ${effect.duration || 1} turn(s)`,
    value: bonus,
  };
}

function executeRapidMobilization(
  nation: Nation,
  effect: LeaderAbilityEffect
): AbilityEffectResult {
  const costReduction = effect.value || 30;
  const duration = effect.duration || 5;
  const freeMissiles = effect.metadata?.freeMissiles || 3;

  // Grant free missiles
  nation.missiles += freeMissiles;

  // Boost morale
  nation.morale = Math.min(100, nation.morale + 50);

  // Apply production cost reduction
  nation.rapidMobilizationActive = true;
  nation.rapidMobilizationCostReduction = costReduction / 100;
  nation.rapidMobilizationTurnsRemaining = duration;

  return {
    targetId: nation.id,
    targetName: nation.name,
    effectType: 'rapid-mobilization',
    description: `+${freeMissiles} missiles, +50 morale, -${costReduction}% costs for ${duration} turns`,
    value: costReduction,
  };
}

function executeSummonEntity(
  nation: Nation,
  targetId: string | undefined,
  gameState: GameState,
  effect: LeaderAbilityEffect
): AbilityEffectResult {
  const target = targetId ? gameState.nations.find(n => n.id === targetId) : null;

  if (target) {
    const populationLoss = (effect.value || 50) / 100;

    // Reduce target population
    target.population = Math.floor(target.population * (1 - populationLoss));

    // Increase instability
    target.instability = Math.min(100, (target.instability || 0) + 40);

    // Reduce morale
    target.morale = Math.max(0, target.morale - 60);

    return {
      targetId: target.id,
      targetName: target.name,
      effectType: 'summon-entity',
      description: `Entity devastates nation: -${effect.value}% population, +40 instability, -60 morale`,
      value: effect.value,
    };
  }

  return {
    targetId: nation.id,
    targetName: 'No target',
    effectType: 'summon-entity',
    description: 'Entity summoned but no target selected',
  };
}

function executeRealityWarp(
  nation: Nation,
  gameState: GameState,
  ability: LeaderAbility
): AbilityEffectResult[] {
  const results: AbilityEffectResult[] = [];

  // Handle special reality warp effects
  if (ability.effect.metadata?.extraTurn) {
    // Yog-Sothoth: Extra turn
    nation.extraTurnGranted = true;
    results.push({
      targetId: nation.id,
      targetName: nation.name,
      effectType: 'reality-warp',
      description: 'Granted extra turn - can act twice!',
    });
  } else if (ability.effect.metadata?.coinFlip) {
    // Odd'n Wild Card: Coin flip gamble
    const success = Math.random() > 0.5;

    if (success) {
      nation.gold = (nation.gold || 0) * 2;
      nation.production = Math.floor(nation.production * 2);
      nation.intel = Math.floor(nation.intel * 2);
      nation.uranium = Math.floor(nation.uranium * 2);

      // Boost all relationships
      if (nation.relationships) {
        for (const otherId in nation.relationships) {
          nation.relationships[otherId] = Math.min(100, nation.relationships[otherId] + 50);
        }
      }

      results.push({
        targetId: nation.id,
        targetName: nation.name,
        effectType: 'reality-warp',
        description: 'JACKPOT! All resources doubled, +50 to all relationships!',
      });
    } else {
      nation.gold = Math.floor((nation.gold || 0) / 2);
      nation.production = Math.floor(nation.production / 2);
      nation.intel = Math.floor(nation.intel / 2);
      nation.uranium = Math.floor(nation.uranium / 2);

      results.push({
        targetId: nation.id,
        targetName: nation.name,
        effectType: 'reality-warp',
        description: 'BUST! All resources halved. The gamble failed.',
      });
    }
  } else if (ability.effect.metadata?.random) {
    // Krazy Re-Entry: Completely random
    const randomOutcome = Math.floor(Math.random() * 6);

    switch (randomOutcome) {
      case 0:
        nation.production *= 3;
        results.push({
          targetId: nation.id,
          targetName: nation.name,
          effectType: 'reality-warp',
          description: 'Production tripled!',
        });
        break;
      case 1:
        nation.missiles = Math.floor(nation.missiles / 2);
        results.push({
          targetId: nation.id,
          targetName: nation.name,
          effectType: 'reality-warp',
          description: 'Missiles vanish into thin air!',
        });
        break;
      case 2:
        // All nations gain/lose random relationships
        for (const other of gameState.nations) {
          if (other.id !== nation.id && nation.relationship) {
            nation.relationship[other.id] = Math.floor(Math.random() * 200) - 100;
          }
        }
        results.push({
          targetId: nation.id,
          targetName: nation.name,
          effectType: 'reality-warp',
          description: 'All relationships randomized!',
        });
        break;
      case 3:
        nation.morale = 100;
        nation.population *= 1.5;
        results.push({
          targetId: nation.id,
          targetName: nation.name,
          effectType: 'reality-warp',
          description: 'Population boom and morale maximized!',
        });
        break;
      case 4:
        // Teleport to random location
        nation.lon = Math.random() * 360 - 180;
        nation.lat = Math.random() * 180 - 90;
        results.push({
          targetId: nation.id,
          targetName: nation.name,
          effectType: 'reality-warp',
          description: 'Nation teleported to random location!',
        });
        break;
      case 5:
        nation.uranium *= 2;
        nation.intel *= 2;
        results.push({
          targetId: nation.id,
          targetName: nation.name,
          effectType: 'reality-warp',
          description: 'Uranium and intel doubled!',
        });
        break;
    }
  } else {
    // Azathoth: Chaos storm
    const variance = (ability.effect.value || 30) / 100;

    for (const targetNation of gameState.nations) {
      const multiplier = 1 + (Math.random() * variance * 2 - variance);
      targetNation.production = Math.floor(targetNation.production * multiplier);
      targetNation.morale = Math.max(0, Math.min(100, targetNation.morale * multiplier));

      if (targetNation.defense) {
        targetNation.defense = Math.floor(targetNation.defense * multiplier);
      }

      results.push({
        targetId: targetNation.id,
        targetName: targetNation.name,
        effectType: 'reality-warp',
        description: `Stats randomized by ${Math.round((multiplier - 1) * 100)}%`,
        value: multiplier,
      });
    }
  }

  return results;
}

function executeFalseFlag(
  nation: Nation,
  targetId: string | undefined,
  gameState: GameState,
  effect: LeaderAbilityEffect
): AbilityEffectResult {
  const target = targetId ? gameState.nations.find(n => n.id === targetId) : null;
  const relationshipDrop = effect.value || 40;

  if (target) {
    // Make all nations dislike the target
    for (const other of gameState.nations) {
      if (other.id !== target.id && other.relationship) {
        other.relationship[target.id] = Math.max(
          -100,
          (other.relationship[target.id] || 0) - relationshipDrop
        );
      }

      // Update target's view of others
      if (target.relationship) {
        target.relationship[other.id] = Math.max(
          -100,
          (target.relationship[other.id] || 0) - relationshipDrop
        );
      }
    }

    // Reduce target morale
    target.morale = Math.max(0, target.morale - 40);

    return {
      targetId: target.id,
      targetName: target.name,
      effectType: 'false-flag',
      description: `-${relationshipDrop} relationship with all nations, -40 morale`,
      value: relationshipDrop,
    };
  }

  return {
    targetId: nation.id,
    targetName: 'No target',
    effectType: 'false-flag',
    description: 'False flag operation failed - no target',
  };
}

function executeCorruptionSurge(
  nation: Nation,
  targetId: string | undefined,
  gameState: GameState,
  effect: LeaderAbilityEffect
): AbilityEffectResult {
  const target = targetId ? gameState.nations.find(n => n.id === targetId) : null;
  const conversionRate = (effect.value || 20) / 100;
  const duration = effect.duration || 4;

  if (target) {
    // Mark target for corruption
    target.corruptionActive = true;
    target.corruptionRate = conversionRate;
    target.corruptionTurnsRemaining = duration;
    target.corruptionSourceId = nation.id;

    return {
      targetId: target.id,
      targetName: target.name,
      effectType: 'corruption-surge',
      description: `${effect.value}% population conversion per turn for ${duration} turns`,
      value: effect.value,
    };
  }

  return {
    targetId: nation.id,
    targetName: 'No target',
    effectType: 'corruption-surge',
    description: 'Corruption surge failed - no target',
  };
}

function executeMissileShield(
  nation: Nation,
  effect: LeaderAbilityEffect
): AbilityEffectResult {
  const duration = effect.duration || 3;

  nation.missileShieldActive = true;
  nation.missileShieldTurnsRemaining = duration;

  return {
    targetId: nation.id,
    targetName: nation.name,
    effectType: 'missile-shield',
    description: `Complete missile immunity for ${duration} turns`,
    value: duration,
  };
}

function executeStealResources(
  nation: Nation,
  targetId: string | undefined,
  gameState: GameState,
  effect: LeaderAbilityEffect
): AbilityEffectResult[] {
  const results: AbilityEffectResult[] = [];
  const baseSteal = effect.value || 100;

  if (effect.metadata?.intelSteal && effect.metadata?.productionSteal && targetId) {
    // Tricky Dick: Steal from single target
    const target = gameState.nations.find(n => n.id === targetId);
    if (target) {
      const intelStolen = Math.min(target.intel, effect.metadata.intelSteal);
      const productionStolen = Math.min(target.production, effect.metadata.productionSteal);

      target.intel -= intelStolen;
      target.production -= productionStolen;
      nation.intel += intelStolen;
      nation.production += productionStolen;

      results.push({
        targetId: target.id,
        targetName: target.name,
        effectType: 'steal-resources',
        description: `Stole ${intelStolen} Intel and ${productionStolen} Production`,
      });
    }
  } else {
    // Oil-Stain Lint-Off: Steal from all nations
    for (const target of gameState.nations) {
      if (target.id === nation.id) continue;

      const productionStolen = Math.min(target.production, baseSteal);
      target.production -= productionStolen;
      nation.production += productionStolen;

      results.push({
        targetId: target.id,
        targetName: target.name,
        effectType: 'steal-resources',
        description: `Stole ${productionStolen} Production`,
      });
    }

    // Gain gold
    const goldGain = effect.metadata?.goldGain || 300;
    nation.gold = (nation.gold || 0) + goldGain;
  }

  return results;
}

function executeBoostRelationships(
  nation: Nation,
  gameState: GameState,
  effect: LeaderAbilityEffect
): AbilityEffectResult[] {
  const results: AbilityEffectResult[] = [];
  const boost = effect.value || 30;

  for (const other of gameState.nations) {
    if (other.id === nation.id) continue;

    if (!nation.relationship) nation.relationship = {};
    if (!other.relationship) other.relationship = {};

    nation.relationship[other.id] = Math.min(100, (nation.relationship[other.id] || 0) + boost);
    other.relationship[nation.id] = Math.min(100, (other.relationship[nation.id] || 0) + boost);

    // Form alliance with friendly nations
    if (nation.relationship[other.id] >= 50) {
      if (!nation.treaties) nation.treaties = {};
      if (!other.treaties) other.treaties = {};

      nation.treaties[other.id] = { alliance: true };
      other.treaties[nation.id] = { alliance: true };

      results.push({
        targetId: other.id,
        targetName: other.name,
        effectType: 'boost-relationships',
        description: `+${boost} relationship, alliance formed`,
        value: boost,
      });
    } else {
      results.push({
        targetId: other.id,
        targetName: other.name,
        effectType: 'boost-relationships',
        description: `+${boost} relationship`,
        value: boost,
      });
    }
  }

  return results;
}

function executeEconomicBoom(
  nation: Nation,
  effect: LeaderAbilityEffect
): AbilityEffectResult {
  const productionBoost = (effect.value || 200) / 100;
  const duration = effect.duration || 3;

  // Grant immediate resources if metadata specifies unlocking tech
  if (effect.metadata?.unlockAllTech) {
    if (!nation.researched) nation.researched = {};
    nation.researched['abm'] = true;
    nation.researched['mirv'] = true;
    nation.researched['stealth'] = true;
    nation.researched['emp'] = true;
    nation.researched['cyberwarfare'] = true;
  }

  // Apply production multiplier
  nation.economicBoomActive = true;
  nation.economicBoomMultiplier = 1 + productionBoost;
  nation.economicBoomTurnsRemaining = duration;

  return {
    targetId: nation.id,
    targetName: nation.name,
    effectType: 'economic-boom',
    description: `+${effect.value}% production for ${duration} turns${effect.metadata?.unlockAllTech ? ', all tech unlocked' : ''}`,
    value: effect.value,
  };
}

function executePropagandaWave(
  nation: Nation,
  targetId: string | undefined,
  gameState: GameState,
  effect: LeaderAbilityEffect
): AbilityEffectResult {
  const target = targetId ? gameState.nations.find(n => n.id === targetId) : null;
  const relationshipDrop = effect.value || 50;

  if (target) {
    // All nations lose relationship with target
    for (const other of gameState.nations) {
      if (other.id === target.id || other.id === nation.id) continue;

      if (!other.relationship) other.relationship = {};
      other.relationship[target.id] = Math.max(
        -100,
        (other.relationship[target.id] || 0) - relationshipDrop
      );
    }

    // Target loses morale
    target.morale = Math.max(0, target.morale - 40);

    return {
      targetId: target.id,
      targetName: target.name,
      effectType: 'propaganda-wave',
      description: `All nations: -${relationshipDrop} relationship with target, target: -40 morale`,
      value: relationshipDrop,
    };
  }

  return {
    targetId: nation.id,
    targetName: 'No target',
    effectType: 'propaganda-wave',
    description: 'Propaganda wave failed - no target',
  };
}
