/**
 * SIMPLIFIED BIO-WARFARE LOGIC
 *
 * Game logic for simplified bio-warfare system
 */

import type { Nation, GameState } from '@/types/game';
import type { BioAttackDeployment } from '@/types/simplifiedBiowarfare';
import {
  calculateBioWeaponDamage,
  calculateBioAttackDuration,
  rollBioDetection,
  BIO_WEAPON_DEPLOYMENT_COST,
  BIO_WEAPON_RELATIONSHIP_PENALTY,
  BIO_WEAPON_GLOBAL_OPINION_PENALTY,
} from '@/types/simplifiedBiowarfare';
import { updateRelationship } from '@/lib/unifiedDiplomacyMigration';
import { applyBioWarfareDamage } from '@/lib/territorialResourcesSystem';

/**
 * Initialize bio-warfare state on a nation if not present
 */
export function initializeBioWarfareState(nation: Nation): Nation {
  return {
    ...nation,
    bioWeaponResearched: nation.bioWeaponResearched ?? false,
    bioDefenseLevel: nation.bioDefenseLevel ?? 0,
    activeBioAttacks: nation.activeBioAttacks ?? [],
  };
}

/**
 * Deploy bio-weapon against target
 */
export function deployBioWeapon(
  attacker: Nation,
  target: Nation,
  currentTurn: number
): {
  attacker: Nation;
  target: Nation;
  attack: BioAttackDeployment;
  success: boolean;
  detected: boolean;
  message: string;
} {
  // Check if attacker has bio-weapons
  if (!attacker.bioWeaponResearched) {
    return {
      attacker,
      target,
      attack: null as any,
      success: false,
      detected: false,
      message: 'Bio-weapons not researched',
    };
  }

  // Check if attacker can afford
  if (
    attacker.intel < BIO_WEAPON_DEPLOYMENT_COST.intel ||
    (attacker.uranium || 0) < BIO_WEAPON_DEPLOYMENT_COST.uranium
  ) {
    return {
      attacker,
      target,
      attack: null as any,
      success: false,
      detected: false,
      message: 'Insufficient resources',
    };
  }

  // Deduct costs from attacker
  const updatedAttacker = {
    ...attacker,
    intel: attacker.intel - BIO_WEAPON_DEPLOYMENT_COST.intel,
    uranium: (attacker.uranium || 0) - BIO_WEAPON_DEPLOYMENT_COST.uranium,
  };

  // Calculate attack parameters
  const duration = calculateBioAttackDuration();
  const basePopLoss = 0.03 + Math.random() * 0.02; // 3-5%
  const detected = rollBioDetection(target.bioDefenseLevel || 0);

  // Create attack deployment
  const attack: BioAttackDeployment = {
    id: `bio-${currentTurn}-${attacker.id}-${target.id}`,
    attackerId: attacker.id,
    targetId: target.id,
    deployedTurn: currentTurn,
    durationTurns: duration,
    turnsRemaining: duration,
    basePopulationLossPerTurn: basePopLoss,
    totalPopulationLost: 0,
    discovered: detected,
    discoveredOnTurn: detected ? currentTurn : undefined,
  };

  // Add attack to target's active attacks
  const updatedTarget = {
    ...target,
    activeBioAttacks: [...(target.activeBioAttacks || []), attack],
    bioAttacksSuffered: (target.bioAttacksSuffered || 0) + 1,
    lastBioAttackTurn: currentTurn,
    bioAttackedBy: detected
      ? [...(target.bioAttackedBy || []), attacker.id]
      : target.bioAttackedBy,
  };

  const message = detected
    ? `Bio-weapon deployed against ${target.name} but was DETECTED!`
    : `Bio-weapon deployed against ${target.name}. Attack will last ${duration} turns.`;

  return {
    attacker: updatedAttacker,
    target: updatedTarget,
    attack,
    success: true,
    detected,
    message,
  };
}

/**
 * Process bio-attack effects for a single turn
 */
export function processBioAttackTurn(
  nation: Nation,
  attack: BioAttackDeployment,
  currentTurn: number
): {
  nation: Nation;
  attack: BioAttackDeployment;
  damage: number;
  message: string;
} {
  if (attack.turnsRemaining <= 0) {
    return {
      nation,
      attack,
      damage: 0,
      message: '',
    };
  }

  // Calculate damage
  const damage = calculateBioWeaponDamage(nation.population, nation.bioDefenseLevel || 0);

  // Apply damage
  const updatedNation = {
    ...nation,
    population: Math.max(0, nation.population - damage),
  };

  // Update attack
  const updatedAttack: BioAttackDeployment = {
    ...attack,
    turnsRemaining: attack.turnsRemaining - 1,
    totalPopulationLost: attack.totalPopulationLost + damage,
  };

  const message = `Bio-weapon causes ${damage.toLocaleString()} casualties in ${nation.name}. (${
    attack.turnsRemaining - 1
  } turns remaining)`;

  return {
    nation: updatedNation,
    attack: updatedAttack,
    damage,
    message,
  };
}

/**
 * Process all bio-attacks for a nation in a turn
 * Now also damages food production in controlled territories
 */
export function processAllBioAttacks(
  nation: Nation,
  currentTurn: number,
  gameState?: GameState,
  conventionalState?: any
): {
  nation: Nation;
  messages: string[];
  totalDamage: number;
} {
  if (!nation.activeBioAttacks || nation.activeBioAttacks.length === 0) {
    return {
      nation,
      messages: [],
      totalDamage: 0,
    };
  }

  let updatedNation = { ...nation };
  const messages: string[] = [];
  let totalDamage = 0;
  const updatedAttacks: BioAttackDeployment[] = [];

  // Bio-warfare damages food production in controlled territories
  if (gameState?.territoryResources && conventionalState?.territories) {
    const controlledTerritories = Object.values(conventionalState.territories).filter(
      (t: any) => t.controllingNationId === nation.id
    );

    // Each active bio-attack reduces food production by 10% per turn
    const damagePerAttack = 0.10;
    const totalFoodDamage = Math.min(0.90, damagePerAttack * nation.activeBioAttacks.length);

    controlledTerritories.forEach((territory: any) => {
      const territoryResource = gameState.territoryResources![territory.id];
      if (territoryResource) {
        applyBioWarfareDamage(territoryResource, totalFoodDamage);
      }
    });

    if (totalFoodDamage > 0) {
      messages.push(`Bio-warfare reduces food production by ${Math.round(totalFoodDamage * 100)}% in ${nation.name}`);
    }
  }

  for (const attack of nation.activeBioAttacks) {
    const result = processBioAttackTurn(updatedNation, attack, currentTurn);
    updatedNation = result.nation;
    totalDamage += result.damage;

    if (result.message) {
      messages.push(result.message);
    }

    // Keep attack if it still has turns remaining
    if (result.attack.turnsRemaining > 0) {
      updatedAttacks.push(result.attack);
    } else {
      messages.push(
        `Bio-weapon attack on ${nation.name} has run its course. Total casualties: ${result.attack.totalPopulationLost.toLocaleString()}`
      );
    }
  }

  return {
    nation: {
      ...updatedNation,
      activeBioAttacks: updatedAttacks,
    },
    messages,
    totalDamage,
  };
}

/**
 * Apply relationship penalties for discovered bio-weapon use
 */
export function applyBioWeaponDiplomaticPenalties(
  nations: Nation[],
  attackerId: string,
  targetId: string,
  discovered: boolean,
  currentTurn: number
): Nation[] {
  if (!discovered) {
    return nations;
  }

  return nations.map(nation => {
    // Direct target relationship
    if (nation.id === targetId) {
      const attacker = nations.find(n => n.id === attackerId);
      if (attacker) {
        const { nationA: updatedTarget } = updateRelationship(
          nation,
          attacker,
          BIO_WEAPON_RELATIONSHIP_PENALTY,
          'Bio-weapon attack',
          currentTurn
        );
        return updatedTarget;
      }
    }

    // Global opinion penalty for all other nations
    if (nation.id !== attackerId && nation.id !== targetId && !nation.eliminated) {
      const attacker = nations.find(n => n.id === attackerId);
      if (attacker) {
        const { nationA: updatedNation } = updateRelationship(
          nation,
          attacker,
          BIO_WEAPON_GLOBAL_OPINION_PENALTY,
          'Bio-weapon use (discovered)',
          currentTurn
        );
        return updatedNation;
      }
    }

    return nation;
  });
}

/**
 * Check if nation can deploy bio-weapon
 */
export function canDeployBioWeapon(nation: Nation): {
  canDeploy: boolean;
  reason?: string;
} {
  if (!nation.bioWeaponResearched) {
    return { canDeploy: false, reason: 'Bio-weapons not researched' };
  }

  if (nation.intel < BIO_WEAPON_DEPLOYMENT_COST.intel) {
    return {
      canDeploy: false,
      reason: `Insufficient intel (need ${BIO_WEAPON_DEPLOYMENT_COST.intel})`,
    };
  }

  if ((nation.uranium || 0) < BIO_WEAPON_DEPLOYMENT_COST.uranium) {
    return {
      canDeploy: false,
      reason: `Insufficient uranium (need ${BIO_WEAPON_DEPLOYMENT_COST.uranium})`,
    };
  }

  return { canDeploy: true };
}

/**
 * Get all active bio-attacks (for UI display)
 */
export function getAllActiveBioAttacks(nations: Nation[]): BioAttackDeployment[] {
  const attacks: BioAttackDeployment[] = [];

  for (const nation of nations) {
    if (nation.activeBioAttacks) {
      attacks.push(...nation.activeBioAttacks);
    }
  }

  return attacks;
}
