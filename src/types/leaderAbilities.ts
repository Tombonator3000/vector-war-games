/**
 * Leader Abilities Types - FASE 3.2
 *
 * Implements activatable leader abilities:
 * - Each leader has 1 unique ability
 * - Can be used 1-2 times per game
 * - Cooldown-based system
 * - Strategic impact on gameplay
 */

import type { Nation, GameState } from './game';

/**
 * Leader ability state
 */
export interface LeaderAbility {
  id: string;                          // Unique ability ID
  name: string;                        // Display name
  description: string;                 // What the ability does
  icon: string;                        // Icon/emoji for display
  maxUses: number;                     // Maximum times it can be used (1-2)
  usesRemaining: number;               // How many uses left
  cooldownTurns: number;               // Turns before can use again
  currentCooldown: number;             // Current cooldown remaining
  lastUsedTurn: number | null;         // When it was last used
  effect: LeaderAbilityEffect;         // The actual effect
  targetType: AbilityTargetType;       // What the ability targets
  requirements?: AbilityRequirement[]; // Conditions to use
  category: AbilityCategory;           // Category of ability
}

/**
 * Type of ability target
 */
export type AbilityTargetType =
  | 'self'              // Affects own nation
  | 'single-nation'     // Target a specific nation
  | 'all-nations'       // Affects all nations
  | 'all-enemies'       // Affects all hostile nations
  | 'all-allies'        // Affects all allied nations
  | 'global';           // Global effect (game state)

/**
 * Category of ability
 */
export type AbilityCategory =
  | 'diplomatic'   // Diplomatic bonuses
  | 'military'     // Military advantages
  | 'economic'     // Resource/production boosts
  | 'intelligence' // Espionage/intel bonuses
  | 'special';     // Unique/special effects

/**
 * Leader ability effect configuration
 */
export interface LeaderAbilityEffect {
  type: LeaderAbilityEffectType;
  duration?: number;                   // Effect duration in turns (if temporary)
  value?: number;                      // Numeric value for effect
  targetId?: string;                   // Specific target nation ID
  metadata?: Record<string, any>;      // Additional effect-specific data
}

/**
 * Types of leader ability effects
 */
export type LeaderAbilityEffectType =
  // Diplomatic abilities
  | 'force-peace'              // Force end to war
  | 'instant-alliance'         // Instant alliance formation
  | 'boost-relationships'      // Boost relationship with all nations
  | 'diplomatic-immunity'      // Cannot be denounced/sanctioned
  | 'summon-council'           // Call international council meeting

  // Military abilities
  | 'first-strike'             // Next attack has massive advantage
  | 'missile-shield'           // Temporary invulnerability to missiles
  | 'counterstrike'            // Auto-retaliate to next attack
  | 'rapid-mobilization'       // Instant military production
  | 'tactical-advantage'       // Combat bonuses for duration

  // Economic abilities
  | 'economic-boom'            // Massive temporary production boost
  | 'resource-windfall'        // Instant resource gain
  | 'steal-resources'          // Steal from target nation
  | 'trade-monopoly'           // Boost income from all sources
  | 'emergency-funding'        // One-time large gold/production

  // Intelligence abilities
  | 'total-surveillance'       // Reveal all enemy plans/research
  | 'false-flag'               // Frame another nation for action
  | 'propaganda-wave'          // Massive morale/opinion shift
  | 'sabotage-campaign'        // Damage enemy infrastructure
  | 'decrypt-communications'   // Read all diplomatic communications

  // Special abilities (Great Old Ones)
  | 'summon-entity'            // Summon powerful entity
  | 'mass-madness'             // Drive population insane
  | 'veil-restoration'         // Repair veil damage
  | 'corruption-surge'         // Massive corruption spread
  | 'reality-warp';            // Unpredictable reality-altering effect

/**
 * Requirement to use an ability
 */
export interface AbilityRequirement {
  type: RequirementType;
  value: number;
  description: string;
}

/**
 * Types of ability requirements
 */
export type RequirementType =
  | 'min-turn'          // Minimum game turn
  | 'min-relationship'  // Minimum relationship with target
  | 'at-war'            // Must be at war
  | 'at-peace'          // Must be at peace
  | 'min-resources'     // Minimum resources required
  | 'max-cooldown';     // Maximum cooldown (must wait)

/**
 * Result of using a leader ability
 */
export interface AbilityUseResult {
  success: boolean;
  message: string;
  effects: AbilityEffectResult[];
  newState: LeaderAbilityState;
}

/**
 * Individual effect result
 */
export interface AbilityEffectResult {
  targetId: string;
  targetName: string;
  effectType: string;
  description: string;
  value?: number;
}

/**
 * Complete leader ability state for a nation
 */
export interface LeaderAbilityState {
  leaderName: string;
  ability: LeaderAbility;
  isAvailable: boolean;                // Can be used right now?
  unavailableReason?: string;          // Why not available?
  history: AbilityUseHistory[];        // History of uses
}

/**
 * History of ability usage
 */
export interface AbilityUseHistory {
  turn: number;
  targetId?: string;
  targetName?: string;
  result: string;
  effectDescription: string;
}

/**
 * Check if ability can be used
 */
export function canUseAbility(
  ability: LeaderAbility,
  nation: Nation,
  gameState: GameState,
  targetId?: string
): { canUse: boolean; reason?: string } {
  // Check uses remaining
  if (ability.usesRemaining <= 0) {
    return { canUse: false, reason: 'No uses remaining' };
  }

  // Check cooldown
  if (ability.currentCooldown > 0) {
    return { canUse: false, reason: `On cooldown for ${ability.currentCooldown} more turns` };
  }

  // Check requirements
  if (ability.requirements) {
    for (const req of ability.requirements) {
      const reqCheck = checkRequirement(req, nation, gameState, targetId);
      if (!reqCheck.met) {
        return { canUse: false, reason: reqCheck.reason };
      }
    }
  }

  // Check target-specific requirements
  if (ability.targetType === 'single-nation' && !targetId) {
    return { canUse: false, reason: 'Must select a target nation' };
  }

  return { canUse: true };
}

/**
 * Check if a specific requirement is met
 */
function checkRequirement(
  requirement: AbilityRequirement,
  nation: Nation,
  gameState: GameState,
  targetId?: string
): { met: boolean; reason?: string } {
  switch (requirement.type) {
    case 'min-turn':
      if (gameState.turn < requirement.value) {
        return { met: false, reason: `Available after turn ${requirement.value}` };
      }
      break;

    case 'min-relationship':
      if (targetId) {
        const relationship = nation.relationship?.[targetId] || 0;
        if (relationship < requirement.value) {
          return { met: false, reason: requirement.description };
        }
      }
      break;

    case 'at-war':
      const hasWar = Object.values(nation.relationship || {}).some(r => r < -50);
      if (!hasWar) {
        return { met: false, reason: 'Must be at war' };
      }
      break;

    case 'at-peace':
      const hasEnemies = Object.values(nation.relationship || {}).some(r => r < -25);
      if (hasEnemies) {
        return { met: false, reason: 'Must be at peace' };
      }
      break;

    case 'min-resources':
      // Check based on metadata in requirement
      break;
  }

  return { met: true };
}

/**
 * Update ability state (cooldown, etc.) each turn
 */
export function updateAbilityPerTurn(ability: LeaderAbility): LeaderAbility {
  const updated = { ...ability };

  // Decrement cooldown
  if (updated.currentCooldown > 0) {
    updated.currentCooldown = Math.max(0, updated.currentCooldown - 1);
  }

  return updated;
}

/**
 * Use a leader ability
 */
export function useAbility(
  ability: LeaderAbility,
  currentTurn: number
): LeaderAbility {
  if (ability.usesRemaining <= 0 || ability.currentCooldown > 0) {
    throw new Error('Cannot use ability: not available');
  }

  return {
    ...ability,
    usesRemaining: ability.usesRemaining - 1,
    currentCooldown: ability.cooldownTurns,
    lastUsedTurn: currentTurn,
  };
}

/**
 * Initialize leader ability state for a nation
 */
export function initializeLeaderAbilityState(
  leaderName: string,
  ability: LeaderAbility
): LeaderAbilityState {
  return {
    leaderName,
    ability: {
      ...ability,
      usesRemaining: ability.maxUses,
      currentCooldown: 0,
      lastUsedTurn: null,
    },
    isAvailable: true,
    history: [],
  };
}
