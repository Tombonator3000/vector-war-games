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
import {
  addStrategicResource,
  initializeResourceStockpile,
} from '@/lib/territorialResourcesSystem';

// ============================================================================
// ABILITY HANDLER TYPES AND REGISTRY
// ============================================================================

/**
 * Context passed to each ability handler
 */
interface AbilityHandlerContext {
  ability: LeaderAbility;
  nation: Nation;
  gameState: GameState;
  nations: Nation[];
  targetId?: string;
}

/**
 * Result from an ability handler
 */
interface AbilityHandlerResult {
  effects: AbilityEffectResult[];
  message: string;
}

/**
 * Handler function type for executing ability effects
 */
type AbilityHandler = (ctx: AbilityHandlerContext) => AbilityHandlerResult;

/**
 * Registry mapping effect types to their handlers.
 * Using a registry pattern makes the code more extensible and eliminates the switch statement.
 */
const ABILITY_HANDLERS: Record<string, AbilityHandler> = {
  'force-peace': (ctx) => {
    const effects = executeForcePeace(ctx.nation, ctx.nations, ctx.ability.effect);
    return {
      effects,
      message: `${ctx.nation.name} has invoked ${ctx.ability.name}! All wars are temporarily suspended.`,
    };
  },

  'first-strike': (ctx) => {
    const effect = executeFirstStrike(ctx.nation, ctx.targetId, ctx.gameState, ctx.ability.effect, ctx.nations);
    return {
      effects: [effect],
      message: `${ctx.nation.name} launches a devastating ${ctx.ability.name}!`,
    };
  },

  'rapid-mobilization': (ctx) => {
    const effect = executeRapidMobilization(ctx.nation, ctx.ability.effect);
    return {
      effects: [effect],
      message: `${ctx.nation.name} activates ${ctx.ability.name}! Military production surges!`,
    };
  },

  'summon-entity': (ctx) => {
    const effect = executeSummonEntity(ctx.nation, ctx.targetId, ctx.gameState, ctx.ability.effect, ctx.nations);
    return {
      effects: [effect],
      message: `${ctx.nation.name} summons a Great Old One! Reality trembles!`,
    };
  },

  'reality-warp': (ctx) => {
    const effects = executeRealityWarp(ctx.nation, ctx.gameState, ctx.ability, ctx.nations);
    return {
      effects,
      message: `${ctx.nation.name} tears the fabric of reality with ${ctx.ability.name}!`,
    };
  },

  'false-flag': (ctx) => {
    const effect = executeFalseFlag(ctx.nation, ctx.targetId, ctx.gameState, ctx.ability.effect, ctx.nations);
    return {
      effects: [effect],
      message: `${ctx.nation.name} executes a masterful deception!`,
    };
  },

  'corruption-surge': (ctx) => {
    const effect = executeCorruptionSurge(ctx.nation, ctx.targetId, ctx.gameState, ctx.ability.effect, ctx.nations);
    return {
      effects: [effect],
      message: `${ctx.nation.name} spreads corruption across ${effect.targetName || 'the target'}!`,
    };
  },

  'missile-shield': (ctx) => {
    const effect = executeMissileShield(ctx.nation, ctx.ability.effect);
    return {
      effects: [effect],
      message: `${ctx.nation.name} activates impenetrable missile defense!`,
    };
  },

  'steal-resources': (ctx) => {
    const effects = executeStealResources(ctx.nation, ctx.targetId, ctx.gameState, ctx.ability.effect, ctx.nations);
    return {
      effects,
      message: `${ctx.nation.name} conducts covert resource acquisition!`,
    };
  },

  'boost-relationships': (ctx) => {
    const effects = executeBoostRelationships(ctx.nation, ctx.gameState, ctx.ability.effect, ctx.nations);
    return {
      effects,
      message: `${ctx.nation.name} improves international relations!`,
    };
  },

  'economic-boom': (ctx) => {
    const effect = executeEconomicBoom(ctx.nation, ctx.ability.effect);
    return {
      effects: [effect],
      message: `${ctx.nation.name} experiences an economic miracle!`,
    };
  },

  'propaganda-wave': (ctx) => {
    const effect = executePropagandaWave(ctx.nation, ctx.targetId, ctx.gameState, ctx.ability.effect, ctx.nations);
    return {
      effects: [effect],
      message: `${ctx.nation.name} unleashes a devastating propaganda campaign!`,
    };
  },
};

// ============================================================================
// MAIN EXECUTOR
// ============================================================================

/**
 * Execute a leader ability
 */
export function executeLeaderAbility(
  ability: LeaderAbility,
  nation: Nation,
  gameState: GameState,
  targetId?: string
): AbilityUseResult {
  const nations = PlayerManager.getNations().length
    ? PlayerManager.getNations()
    : gameState.nations || [];

  try {
    // Update ability state (decrement uses, set cooldown)
    const newAbilityState = useAbility(ability, gameState.turn);

    // Build handler context
    const ctx: AbilityHandlerContext = {
      ability,
      nation,
      gameState,
      nations,
      targetId,
    };

    // Look up and execute the handler from the registry
    const handler = ABILITY_HANDLERS[ability.effect.type];
    const { effects, message } = handler
      ? handler(ctx)
      : {
          effects: [] as AbilityEffectResult[],
          message: `${nation.name} uses ${ability.name}, but the effect is not yet implemented.`,
        };

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
  nations: Nation[],
  effect: LeaderAbilityEffect
): AbilityEffectResult[] {
  const results: AbilityEffectResult[] = [];
  const duration = effect.duration || 3;

  // Find all nations at war with the player
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
  effect: LeaderAbilityEffect,
  nations: Nation[]
): AbilityEffectResult {
  const bonus = effect.value || 100;
  const duration = effect.duration || 1;
  const defensePenalty = effect.metadata?.defensePenalty ?? 0.5;
  const selfDamage = effect.metadata?.selfDamage || 0;

  // Apply temporary first strike bonus
  nation.firstStrikeBonus = bonus;
  nation.firstStrikeActive = true;
  nation.firstStrikeTurnsRemaining = duration;

  if (selfDamage > 0) {
    const populationLoss = Math.floor((nation.population * selfDamage) / 100);
    nation.population = Math.max(0, nation.population - populationLoss);
    nation.morale = Math.max(0, nation.morale - Math.min(40, selfDamage));
  }

  const target = targetId ? nations.find(n => n.id === targetId) : undefined;

  if (target) {
    const originalDefense = target.defense;
    const defenseReduction = Math.round(originalDefense * defensePenalty);
    target.defense = Math.max(0, originalDefense - defenseReduction);
    target.morale = Math.max(0, target.morale - 40);
    target.publicOpinion = Math.max(0, target.publicOpinion - 30);
    target.instability = Math.min(100, (target.instability || 0) + 25);

    if (!nation.relationships) nation.relationships = {};
    if (!target.relationships) target.relationships = {};

    nation.relationships[target.id] = clamp(
      (nation.relationships[target.id] ?? 0) - 40,
      -100,
      100
    );
    target.relationships[nation.id] = clamp(
      (target.relationships[nation.id] ?? 0) - 60,
      -100,
      100
    );

    return {
      targetId: target.id,
      targetName: target.name,
      effectType: 'first-strike',
      description: `+${bonus}% attack effectiveness and -${Math.round(
        defensePenalty * 100
      )}% enemy defense for ${duration} turn(s)`,
      value: bonus,
    };
  }

  return {
    targetId: targetId || nation.id,
    targetName: 'Selected targets',
    effectType: 'first-strike',
    description: `+${bonus}% attack effectiveness for ${duration} turn(s)`,
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
  effect: LeaderAbilityEffect,
  nations: Nation[]
): AbilityEffectResult {
  const targets: Nation[] = [];
  if (targetId) {
    const explicitTarget = nations.find(n => n.id === targetId);
    if (explicitTarget) targets.push(explicitTarget);
  } else {
    for (const other of nations) {
      if (other.id === nation.id) continue;
      const relationship = nation.relationships?.[other.id] ?? 0;
      if (relationship < 0) {
        targets.push(other);
      }
    }
  }

  if (targets.length > 0) {
    const populationLossPercent = effect.value || 50;
    const defensePenalty = effect.duration ? effect.value || 0 : 0;

    for (const target of targets) {
      const populationLoss = Math.floor((target.population * populationLossPercent) / 100);
      target.population = Math.max(0, target.population - populationLoss);
      target.morale = Math.max(0, target.morale - 60);
      target.publicOpinion = Math.max(0, target.publicOpinion - 50);
      target.instability = Math.min(100, (target.instability || 0) + 40);
      if (!target.relationships) target.relationships = {};
      target.relationships[nation.id] = clamp(
        (target.relationships[nation.id] ?? 0) - 50,
        -100,
        100
      );

      if (!nation.relationships) nation.relationships = {};
      nation.relationships[target.id] = clamp(
        (nation.relationships[target.id] ?? 0) - 30,
        -100,
        100
      );

      if (defensePenalty) {
        target.unitDefenseBonus = (target.unitDefenseBonus || 0) - defensePenalty;
      }
    }

    return {
      targetId: targets.length === 1 ? targets[0].id : 'multiple-enemies',
      targetName: targets.length === 1 ? targets[0].name : 'All hostile nations',
      effectType: 'summon-entity',
      description: targets.length === 1
        ? `Entity devastates nation: -${populationLossPercent}% population, +40 instability, -60 morale`
        : `Entities terrorize all hostile nations: -${populationLossPercent}% population and -60 morale each`,
      value: populationLossPercent,
    };
  }

  return {
    targetId: nation.id,
    targetName: 'No target',
    effectType: 'summon-entity',
    description: 'Entity summoned but no valid enemy was found',
  };
}

function executeRealityWarp(
  nation: Nation,
  gameState: GameState,
  ability: LeaderAbility,
  nations: Nation[]
): AbilityEffectResult[] {
  const results: AbilityEffectResult[] = [];

  initializeResourceStockpile(nation);
  const getUranium = () => nation.resourceStockpile?.uranium ?? 0;
  const setUranium = (amount: number) => {
    const current = getUranium();
    addStrategicResource(nation, 'uranium', amount - current);
  };

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
      setUranium(Math.floor(getUranium() * 2));

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
      setUranium(Math.floor(getUranium() / 2));

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
        {
          const pairs: string[] = [];
          for (let i = 0; i < nations.length; i++) {
            for (let j = i + 1; j < nations.length; j++) {
              const first = nations[i];
              const second = nations[j];
              if (!first.relationships) first.relationships = {};
              if (!second.relationships) second.relationships = {};
              const delta = Math.floor(Math.random() * 61) - 30; // -30 to +30
              first.relationships[second.id] = clamp(
                (first.relationships[second.id] ?? 0) + delta,
                -100,
                100
              );
              second.relationships[first.id] = clamp(
                (second.relationships[first.id] ?? 0) + delta,
                -100,
                100
              );
              pairs.push(`${first.name}↔${second.name} (${delta >= 0 ? '+' : ''}${delta})`);
            }
          }

          results.push({
            targetId: nation.id,
            targetName: nation.name,
            effectType: 'reality-warp',
            description: `Relationships reshuffled: ${pairs.join(', ')}`,
          });
        }
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
        setUranium(getUranium() * 2);
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
    const affected: string[] = [];
    for (const other of nations) {
      const multiplier = 1 + (Math.random() * 0.6 - 0.3); // ±30%
      other.production = Math.max(0, Math.floor(other.production * multiplier));
      other.population = Math.max(0, Math.floor(other.population * multiplier));
      other.morale = clamp(Math.round(other.morale * multiplier), 0, 100);
      other.publicOpinion = clamp(Math.round(other.publicOpinion * multiplier), 0, 100);

      if (other !== nation) {
        if (Math.random() < 0.5) {
          other.alliances = other.alliances || [];
          if (!other.alliances.includes(nation.id)) {
            other.alliances.push(nation.id);
          }
        } else if (other.alliances) {
          other.alliances = other.alliances.filter(id => id !== nation.id);
        }
      }

      affected.push(other.name);
    }

    results.push({
      targetId: nation.id,
      targetName: nation.name,
      effectType: 'reality-warp',
      description: `Azathoth's chaos storm warps reality for: ${affected.join(', ')}`,
    });
  }

  return results;
}

function executeFalseFlag(
  nation: Nation,
  targetId: string | undefined,
  gameState: GameState,
  effect: LeaderAbilityEffect,
  nations: Nation[]
): AbilityEffectResult {
  const target = targetId ? nations.find(n => n.id === targetId) : undefined;
  const relationshipDrop = effect.value || 40;

  if (target) {
    if (!target.relationships) target.relationships = {};
    if (!nation.relationships) nation.relationships = {};

    for (const other of nations) {
      if (other.id === target.id) continue;
      if (!other.relationships) other.relationships = {};
      other.relationships[target.id] = clamp(
        (other.relationships[target.id] ?? 0) - relationshipDrop,
        -100,
        100
      );

      if (target.relationships) {
        target.relationships[other.id] = clamp(
          (target.relationships[other.id] ?? 0) - Math.floor(relationshipDrop / 2),
          -100,
          100
        );
      }
    }

    target.morale = Math.max(0, target.morale - 40);
    target.publicOpinion = Math.max(0, target.publicOpinion - 35);
    target.instability = Math.min(100, (target.instability || 0) + 30);

    nation.relationships[target.id] = clamp(
      (nation.relationships[target.id] ?? 0) - 10,
      -100,
      100
    );
    target.relationships[nation.id] = clamp(
      (target.relationships[nation.id] ?? 0) - relationshipDrop,
      -100,
      100
    );

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
  effect: LeaderAbilityEffect,
  nations: Nation[]
): AbilityEffectResult {
  const target = targetId ? nations.find(n => n.id === targetId) : undefined;
  const conversionRate = (effect.value || 20) / 100;
  const duration = effect.duration || 4;

  if (target) {
    // Mark target for corruption
    target.corruptionActive = true;
    target.corruptionRate = conversionRate;
    target.corruptionTurnsRemaining = duration;
    target.corruptionSourceId = nation.id;

    target.morale = Math.max(0, target.morale - 30);
    target.publicOpinion = Math.max(0, target.publicOpinion - 25);
    target.instability = Math.min(100, (target.instability || 0) + 35);

    if (!target.relationships) target.relationships = {};
    if (!nation.relationships) nation.relationships = {};
    target.relationships[nation.id] = clamp(
      (target.relationships[nation.id] ?? 0) - 35,
      -100,
      100
    );
    nation.relationships[target.id] = clamp(
      (nation.relationships[target.id] ?? 0) - 15,
      -100,
      100
    );

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
  effect: LeaderAbilityEffect,
  nations: Nation[]
): AbilityEffectResult[] {
  const results: AbilityEffectResult[] = [];
  const baseSteal = effect.value || 100;

  if (effect.metadata?.intelSteal && effect.metadata?.productionSteal && targetId) {
    const target = nations.find(n => n.id === targetId);
    if (target) {
      const intelStolen = Math.min(target.intel, effect.metadata.intelSteal);
      const productionStolen = Math.min(target.production, effect.metadata.productionSteal);

      target.intel -= intelStolen;
      target.production -= productionStolen;
      nation.intel += intelStolen;
      nation.production += productionStolen;

      if (!nation.relationships) nation.relationships = {};
      if (!target.relationships) target.relationships = {};

      nation.relationships[target.id] = clamp(
        (nation.relationships[target.id] ?? 0) - 15,
        -100,
        100
      );
      target.relationships[nation.id] = clamp(
        (target.relationships[nation.id] ?? 0) - 30,
        -100,
        100
      );

      results.push({
        targetId: target.id,
        targetName: target.name,
        effectType: 'steal-resources',
        description: `Stole ${intelStolen} Intel and ${productionStolen} Production`,
      });
    }
  } else {
    for (const other of nations) {
      if (other.id === nation.id) continue;
      const productionStolen = Math.min(other.production, baseSteal);
      other.production -= productionStolen;
      nation.production += productionStolen;

      if (!other.relationships) other.relationships = {};
      if (!nation.relationships) nation.relationships = {};

      other.relationships[nation.id] = clamp(
        (other.relationships[nation.id] ?? 0) - 25,
        -100,
        100
      );
      nation.relationships[other.id] = clamp(
        (nation.relationships[other.id] ?? 0) - 10,
        -100,
        100
      );

      results.push({
        targetId: other.id,
        targetName: other.name,
        effectType: 'steal-resources',
        description: `Stole ${productionStolen} Production from ${other.name}`,
      });
    }

    if (effect.metadata?.goldGain) {
      nation.gold = (nation.gold || 0) + effect.metadata.goldGain;
    }

    if (effect.metadata?.corruption) {
      const enemies = nations.filter(other => other.id !== nation.id).slice(0, effect.metadata.corruption);
      for (const enemy of enemies) {
        enemy.corruptionActive = true;
        enemy.corruptionRate = Math.max(enemy.corruptionRate || 0, 0.1);
        enemy.corruptionTurnsRemaining = Math.max(enemy.corruptionTurnsRemaining || 0, 3);
        enemy.corruptionSourceId = nation.id;
      }
    }
  }

  return results;
}

function executeBoostRelationships(
  nation: Nation,
  gameState: GameState,
  effect: LeaderAbilityEffect,
  nations: Nation[]
): AbilityEffectResult[] {
  const results: AbilityEffectResult[] = [];
  const boost = effect.value || 30;

  if (!nation.relationships) nation.relationships = {};

  for (const other of nations) {
    if (other.id === nation.id) continue;
    if (!other.relationships) other.relationships = {};

    const newRelation = clamp((nation.relationships[other.id] ?? 0) + boost, -100, 100);
    nation.relationships[other.id] = newRelation;
    other.relationships[nation.id] = clamp((other.relationships[nation.id] ?? 0) + boost, -100, 100);

    if (newRelation >= 50) {
      nation.alliances = nation.alliances || [];
      other.alliances = other.alliances || [];
      if (!nation.alliances.includes(other.id)) {
        nation.alliances.push(other.id);
      }
      if (!other.alliances.includes(nation.id)) {
        other.alliances.push(nation.id);
      }
    }

    results.push({
      targetId: other.id,
      targetName: other.name,
      effectType: 'boost-relationships',
      description: `Relationship improved to ${nation.relationships[other.id]}`,
      value: boost,
    });
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
  effect: LeaderAbilityEffect,
  nations: Nation[]
): AbilityEffectResult {
  const target = targetId ? nations.find(n => n.id === targetId) : undefined;
  const relationshipDrop = effect.value || 50;

  if (target) {
    if (!nation.relationships) nation.relationships = {};
    if (!target.relationships) target.relationships = {};

    for (const other of nations) {
      if (other.id === target.id) continue;
      if (!other.relationships) other.relationships = {};

      other.relationships[target.id] = clamp(
        (other.relationships[target.id] ?? 0) - relationshipDrop,
        -100,
        100
      );

      if (target.relationships) {
        target.relationships[other.id] = clamp(
          (target.relationships[other.id] ?? 0) - Math.floor(relationshipDrop / 2),
          -100,
          100
        );
      }
    }

    target.morale = Math.max(0, target.morale - 40);
    target.publicOpinion = Math.max(0, target.publicOpinion - 45);
    target.instability = Math.min(100, (target.instability || 0) + 35);

    nation.relationships[target.id] = clamp(
      (nation.relationships[target.id] ?? 0) - 5,
      -100,
      100
    );
    target.relationships[nation.id] = clamp(
      (target.relationships[nation.id] ?? 0) - relationshipDrop,
      -100,
      100
    );

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

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
