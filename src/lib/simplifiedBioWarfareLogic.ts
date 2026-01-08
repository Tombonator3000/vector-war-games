/**
 * SIMPLIFIED BIO-WARFARE LOGIC
 *
 * Game logic for simplified bio-warfare system
 */

import type { Nation, GameState } from '@/types/game';
import type { BioAttackDeployment } from '@/types/simplifiedBiowarfare';
import type { SeededRandom } from '@/lib/seededRandom';
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
  // Note: Bio-warfare properties are stored in researched state
  return {
    ...nation,
    researched: {
      ...nation.researched,
      bioWeaponResearched: nation.researched?.bioWeaponResearched ?? false,
    }
  };
}

/**
 * Deploy bio-weapon against target
 */
export function deployBioWeapon(
  attacker: Nation,
  target: Nation,
  currentTurn: number,
  rng: SeededRandom
): {
  attacker: Nation;
  target: Nation;
  attack: BioAttackDeployment;
  success: boolean;
  detected: boolean;
  message: string;
} {
  // Check if attacker has bio-weapons (stored in researched state)
  if (!attacker.researched?.bioWeaponResearched) {
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
  const duration = calculateBioAttackDuration(rng);
  const basePopLoss = 0.03 + rng.next() * 0.02; // 3-5%
  const bioDefenseLevel = 0; // Bio defense not fully implemented yet
  const detected = rollBioDetection(bioDefenseLevel, rng);

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

  // Add attack to target's active attacks (stored in separate tracking system)
  const updatedTarget = {
    ...target,
    // Bio attacks tracked separately, not on Nation object directly
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
  currentTurn: number,
  rng: SeededRandom
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

  // Calculate damage - bioDefenseLevel stored in researched or defaults to 0
  const bioDefenseLevel = (nation.researched?.bioDefenseLevel as unknown as number) || 0;
  const damage = calculateBioWeaponDamage(nation.population, bioDefenseLevel, rng);

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
  conventionalState?: any,
  rng?: SeededRandom
): {
  nation: Nation;
  messages: string[];
  totalDamage: number;
} {
  // Access activeBioAttacks from researched - it should be an array
  const activeBioAttacks = (nation.researched?.activeBioAttacks as unknown as any[]) || [];
  if (activeBioAttacks.length === 0) {
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
    const totalFoodDamage = Math.min(0.90, damagePerAttack * activeBioAttacks.length);

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

  for (const attack of activeBioAttacks) {
    // If no RNG provided, we can't process attacks deterministically
    // This should not happen in production, but we need to handle it
    if (!rng) {
      console.warn('processAllBioAttacks called without RNG - bio-attacks cannot be processed deterministically');
      break;
    }

    const result = processBioAttackTurn(updatedNation, attack, currentTurn, rng);
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
      researched: {
        ...updatedNation.researched,
        activeBioAttacks: updatedAttacks as any,
      },
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
  if (!nation.researched?.bioWeaponResearched) {
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
    const activeBioAttacks = (nation.researched?.activeBioAttacks as unknown as any[]) || [];
    if (activeBioAttacks.length > 0) {
      attacks.push(...activeBioAttacks);
    }
  }

  return attacks;
}
