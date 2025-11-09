/**
 * Advanced Propaganda Manager
 * Handles useful idiots, phobia campaigns, and religious weaponization
 */

import {
  UsefulIdiot,
  UsefulIdiotType,
  RecruitmentOperation,
  RecruitmentStatus,
  PhobiaCampaign,
  PhobiaType,
  PhobiaIntensity,
  PhobiaEffects,
  ReligiousWeapon,
  ReligiousWeaponType,
  ReligiousWarfareState,
  IntegratedPropagandaOperation,
  AdvancedPropagandaState,
  USEFUL_IDIOT_CONFIG,
  PHOBIA_CAMPAIGN_CONFIG,
  RELIGIOUS_WEAPON_CONFIG,
  UsefulIdiotAction,
  PropagandaObjective,
} from '../types/advancedPropaganda';
import { GameState, Nation } from '../types/game';
import { IdeologyType } from '../types/ideology';

// ============================================================================
// USEFUL IDIOTS SYSTEM
// ============================================================================

/**
 * Generate a plausible name for a useful idiot
 */
function generateIdiotName(type: UsefulIdiotType): string {
  const firstNames = ['James', 'Sarah', 'Michael', 'Emily', 'David', 'Lisa', 'Robert', 'Jennifer', 'William', 'Amanda'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

  return `${firstName} ${lastName}`;
}

/**
 * Generate a cover story for a useful idiot
 */
function generateCoverStory(type: UsefulIdiotType): string {
  const stories: Record<UsefulIdiotType, string[]> = {
    academic: [
      'A respected professor concerned about global cooperation',
      'An intellectual advocating for international understanding',
      'A scholar promoting cross-cultural dialogue',
    ],
    journalist: [
      'An independent journalist seeking the truth',
      'A media personality questioning mainstream narratives',
      'An investigative reporter uncovering corruption',
    ],
    politician: [
      'A reformist politician fighting for change',
      'A grassroots activist challenging the establishment',
      'A local leader concerned about foreign policy',
    ],
    celebrity: [
      'A humanitarian celebrity raising awareness',
      'A cultural icon promoting peace',
      'An entertainer speaking truth to power',
    ],
    business_leader: [
      'A pragmatic CEO advocating for economic cooperation',
      'An entrepreneur promoting global trade',
      'A business magnate concerned about market stability',
    ],
    religious_leader: [
      'A spiritual leader preaching unity',
      'A clergy member advocating for peace',
      'A faith leader concerned about moral decay',
    ],
    influencer: [
      'A social media star promoting awareness',
      'A viral content creator questioning narratives',
      'An online personality building communities',
    ],
  };

  const options = stories[type];
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Initiate recruitment of a useful idiot
 */
export function initiateRecruitment(
  gameState: GameState,
  recruiterNation: string,
  targetNation: string,
  targetType: UsefulIdiotType
): RecruitmentOperation | null {
  const recruiter = gameState.nations[recruiterNation];
  if (!recruiter) return null;

  const baseCost = USEFUL_IDIOT_CONFIG.RECRUITMENT_BASE_COST;
  const typeCost = USEFUL_IDIOT_CONFIG.TYPE_BONUSES[targetType].cost;
  const totalCost = Math.floor(baseCost * (typeCost / 100));

  if (recruiter.intel < totalCost) {
    return null; // Not enough intel
  }

  // Calculate success chance based on various factors
  let successChance = 50;

  // Ideology compatibility
  const targetNationData = gameState.nations[targetNation];
  if (targetNationData?.ideologyState) {
    const recruiterIdeology = recruiter.ideologyState?.currentIdeology;
    const targetIdeology = targetNationData.ideologyState.currentIdeology;

    if (recruiterIdeology === targetIdeology) {
      successChance -= 20; // Harder to recruit from similar ideology
    } else {
      successChance += 10; // Easier to exploit ideological differences
    }
  }

  // Relationship affects recruitment
  const relationship = recruiter.relationships?.[targetNation] || 0;
  successChance += Math.floor(relationship / 10);

  // Intel strength
  const intelRatio = recruiter.intel / 500;
  successChance += Math.min(20, Math.floor(intelRatio * 10));

  // Cultural influence
  const culturalInfluence = recruiter.culturalInfluences?.find(
    ci => ci.targetNation === targetNation
  );
  if (culturalInfluence) {
    successChance += Math.floor(culturalInfluence.strength / 5);
  }

  // Clamp success chance
  successChance = Math.max(20, Math.min(90, successChance));

  const operation: RecruitmentOperation = {
    id: `recruit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    targetType,
    targetNation,
    recruiterNation,
    intelInvestment: totalCost,
    turnsRemaining: Math.floor(Math.random() * 3) + 2, // 2-4 turns
    successChance,
    discovered: false,
    startedAt: gameState.turn,
  };

  // Deduct intel cost
  recruiter.intel -= totalCost;

  return operation;
}

/**
 * Process recruitment operations for a turn
 */
export function processRecruitmentOperations(
  gameState: GameState,
  operations: RecruitmentOperation[]
): { completed: UsefulIdiot[], failed: RecruitmentOperation[], ongoing: RecruitmentOperation[] } {
  const completed: UsefulIdiot[] = [];
  const failed: RecruitmentOperation[] = [];
  const ongoing: RecruitmentOperation[] = [];

  for (const operation of operations) {
    operation.turnsRemaining--;

    // Check for discovery
    const discoveryChance = 10;
    if (Math.random() * 100 < discoveryChance) {
      operation.discovered = true;

      // Damage relationship
      const recruiter = gameState.nations[operation.recruiterNation];
      const target = gameState.nations[operation.targetNation];
      if (recruiter && target && recruiter.relationships) {
        recruiter.relationships[operation.targetNation] =
          Math.max(-100, (recruiter.relationships[operation.targetNation] || 0) - 20);
      }

      failed.push(operation);
      continue;
    }

    if (operation.turnsRemaining <= 0) {
      // Recruitment complete, check success
      const success = Math.random() * 100 < operation.successChance;

      if (success) {
        const typeBonus = USEFUL_IDIOT_CONFIG.TYPE_BONUSES[operation.targetType];

        const idiot: UsefulIdiot = {
          id: `idiot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: generateIdiotName(operation.targetType),
          type: operation.targetType,
          nation: operation.targetNation,
          recruiterNation: operation.recruiterNation,

          influence: typeBonus.influence + Math.floor(Math.random() * 10),
          credibility: typeBonus.credibility + Math.floor(Math.random() * 10),
          ideologicalAlignment: 40 + Math.floor(Math.random() * 30),

          status: 'active',
          turnsActive: 0,
          totalPropagandaValue: 0,

          suspicionLevel: 10,
          exposureRisk: USEFUL_IDIOT_CONFIG.BASE_EXPOSURE_RISK,

          intelCostPerTurn: Math.floor(typeBonus.influence * USEFUL_IDIOT_CONFIG.MAINTENANCE_COST_MULTIPLIER),
          lastActionTurn: gameState.turn,

          coverStory: generateCoverStory(operation.targetType),
        };

        completed.push(idiot);
      } else {
        failed.push(operation);
      }
    } else {
      ongoing.push(operation);
    }
  }

  return { completed, failed, ongoing };
}

/**
 * Process useful idiots for a turn
 */
export function processUsefulIdiots(
  gameState: GameState,
  idiots: UsefulIdiot[]
): { active: UsefulIdiot[], exposed: UsefulIdiot[], narratives: string[] } {
  const active: UsefulIdiot[] = [];
  const exposed: UsefulIdiot[] = [];
  const narratives: string[] = [];

  for (const idiot of idiots) {
    if (idiot.status === 'burned' || idiot.status === 'compromised') {
      continue; // Skip useless idiots
    }

    const recruiter = gameState.nations[idiot.recruiterNation];
    if (!recruiter) continue;

    // Check if recruiter can afford maintenance
    if (recruiter.intel < idiot.intelCostPerTurn) {
      idiot.status = 'compromised';
      idiot.suspicionLevel += 20;
      narratives.push(`${idiot.name} (${idiot.type}) has been neglected and is now compromised!`);
      active.push(idiot);
      continue;
    }

    // Deduct maintenance cost
    recruiter.intel -= idiot.intelCostPerTurn;

    // Generate propaganda value
    const propagandaValue = Math.floor(
      (idiot.influence * idiot.credibility * idiot.ideologicalAlignment) / 10000
    );

    idiot.totalPropagandaValue += propagandaValue;
    idiot.turnsActive++;

    // Apply effects to target nation
    const target = gameState.nations[idiot.nation];
    if (target) {
      // Reduce stability
      target.instability = (target.instability || 0) + propagandaValue * 0.1;

      // Reduce morale slightly
      target.morale = Math.max(0, target.morale - propagandaValue * 0.05);

      // Increase cultural influence
      const influence = recruiter.culturalInfluences?.find(
        ci => ci.targetNation === idiot.nation
      );
      if (influence) {
        influence.strength = Math.min(100, influence.strength + propagandaValue * 0.2);
      }

      // Affect pop loyalty
      if (target.popGroups) {
        for (const pop of target.popGroups) {
          if (Math.random() * 100 < propagandaValue) {
            pop.loyalty = Math.max(0, pop.loyalty - 1);
          }
        }
      }
    }

    // Check for exposure
    idiot.suspicionLevel += idiot.exposureRisk / 10;

    if (Math.random() * 100 < idiot.exposureRisk) {
      // Exposed!
      idiot.status = 'burned';
      idiot.exposureNarrative = `${idiot.name}, the ${idiot.type}, has been exposed as a propaganda agent for ${idiot.recruiterNation}!`;

      narratives.push(idiot.exposureNarrative);

      // Major diplomatic incident
      if (recruiter.relationships) {
        recruiter.relationships[idiot.nation] =
          Math.max(-100, (recruiter.relationships[idiot.nation] || 0) - 30);
      }

      exposed.push(idiot);
    } else {
      // Increase exposure risk over time
      idiot.exposureRisk = Math.min(50, idiot.exposureRisk + 0.5);
      active.push(idiot);
    }
  }

  return { active, exposed, narratives };
}

/**
 * Perform action on useful idiot
 */
export function performIdiotAction(
  gameState: GameState,
  idiot: UsefulIdiot,
  action: UsefulIdiotAction
): { success: boolean, narrative: string, cost: number } {
  const recruiter = gameState.nations[idiot.recruiterNation];
  if (!recruiter) {
    return { success: false, narrative: 'Recruiter nation not found', cost: 0 };
  }

  let cost = 0;
  let narrative = '';
  let success = false;

  switch (action) {
    case 'amplify':
      cost = Math.floor(idiot.intelCostPerTurn * 3);
      if (recruiter.intel >= cost) {
        recruiter.intel -= cost;
        idiot.influence = Math.min(100, idiot.influence + 15);
        idiot.exposureRisk = Math.min(80, idiot.exposureRisk + 10);
        narrative = `${idiot.name}'s reach has been amplified! Influence increased to ${idiot.influence}.`;
        success = true;
      } else {
        narrative = 'Not enough intel to amplify.';
      }
      break;

    case 'protect':
      cost = Math.floor(idiot.intelCostPerTurn * 2);
      if (recruiter.intel >= cost) {
        recruiter.intel -= cost;
        idiot.exposureRisk = Math.max(5, idiot.exposureRisk - 15);
        idiot.suspicionLevel = Math.max(0, idiot.suspicionLevel - 20);
        narrative = `${idiot.name} has been protected. Exposure risk reduced to ${idiot.exposureRisk}%.`;
        success = true;
      } else {
        narrative = 'Not enough intel to protect.';
      }
      break;

    case 'burn':
      // Deliberately expose for maximum impact
      const target = gameState.nations[idiot.nation];
      if (target) {
        const impactValue = Math.floor((idiot.influence * idiot.credibility) / 50);
        target.instability = (target.instability || 0) + impactValue;
        target.morale = Math.max(0, target.morale - impactValue * 0.5);

        idiot.status = 'burned';
        narrative = `${idiot.name} has been deliberately exposed in a spectacular fashion! ${idiot.nation} suffers ${impactValue} instability.`;
        success = true;
      }
      break;

    case 'extract':
      cost = Math.floor(idiot.intelCostPerTurn * 1.5);
      if (recruiter.intel >= cost) {
        recruiter.intel -= cost;
        idiot.status = 'compromised';
        narrative = `${idiot.name} has been extracted from operation.`;
        success = true;
      } else {
        narrative = 'Not enough intel to extract.';
      }
      break;

    default:
      narrative = 'Unknown action';
  }

  return { success, narrative, cost };
}

// ============================================================================
// PHOBIA CAMPAIGNS
// ============================================================================

/**
 * Launch a phobia-based propaganda campaign
 */
export function launchPhobiaCampaign(
  gameState: GameState,
  sourceNation: string,
  targetNation: string,
  type: PhobiaType,
  intensity: PhobiaIntensity
): PhobiaCampaign | null {
  const source = gameState.nations[sourceNation];
  if (!source) return null;

  const cost = PHOBIA_CAMPAIGN_CONFIG.INTENSITY_COSTS[intensity];

  if (source.intel < cost) {
    return null; // Not enough intel
  }

  source.intel -= cost;

  const campaign: PhobiaCampaign = {
    id: `phobia-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    sourceNation,
    targetNation,
    intensity,
    intelCostPerTurn: Math.floor(cost * 0.3),
    turnsActive: 0,
    totalDuration: Math.floor(Math.random() * 5) + 5, // 5-10 turns
    currentPhobiaLevel: 10,
    spreadRate: PHOBIA_CAMPAIGN_CONFIG.SPREAD_RATES[intensity],
    paranoia: 0,
    radicalizedPops: 0,
    violentIncidents: 0,
    discovered: false,
    startedAt: gameState.turn,
    lastUpdated: gameState.turn,
  };

  return campaign;
}

/**
 * Process phobia campaigns for a turn
 */
export function processPhobiaCampaigns(
  gameState: GameState,
  campaigns: PhobiaCampaign[]
): { active: PhobiaCampaign[], completed: PhobiaCampaign[], narratives: string[] } {
  const active: PhobiaCampaign[] = [];
  const completed: PhobiaCampaign[] = [];
  const narratives: string[] = [];

  for (const campaign of campaigns) {
    const source = gameState.nations[campaign.sourceNation];
    const target = gameState.nations[campaign.targetNation];

    if (!source || !target) {
      completed.push(campaign);
      continue;
    }

    // Check if source can afford maintenance
    if (source.intel < campaign.intelCostPerTurn) {
      narratives.push(`Phobia campaign (${campaign.type}) in ${campaign.targetNation} has been abandoned due to lack of intel.`);
      completed.push(campaign);
      continue;
    }

    source.intel -= campaign.intelCostPerTurn;

    // Spread fear
    campaign.currentPhobiaLevel = Math.min(100, campaign.currentPhobiaLevel + campaign.spreadRate);
    campaign.turnsActive++;

    // Apply effects based on phobia type
    const effects = PHOBIA_CAMPAIGN_CONFIG.EFFECTS_MULTIPLIER[campaign.type];
    const intensity = campaign.currentPhobiaLevel / 100;

    if ('stability' in effects && effects.stability) {
      target.instability = (target.instability || 0) + Math.abs(effects.stability) * intensity;
    }

    if ('morale' in effects && effects.morale) {
      target.morale = Math.max(0, target.morale + effects.morale * intensity);
    }

    if ('production' in effects && effects.production) {
      // Production penalty applied via modifier (handled elsewhere)
    }

    // Increase paranoia
    campaign.paranoia = Math.min(100, campaign.paranoia + campaign.spreadRate * 0.5);

    // Chance of radicalization
    if (Math.random() * 100 < campaign.currentPhobiaLevel / 10) {
      campaign.radicalizedPops++;

      if (Math.random() * 100 < campaign.paranoia / 10) {
        campaign.violentIncidents++;
        narratives.push(`Violent incident in ${campaign.targetNation} due to ${campaign.type}!`);
        target.instability = (target.instability || 0) + 5;
      }
    }

    // Check for discovery
    const discoveryChance = PHOBIA_CAMPAIGN_CONFIG.DETECTION_RISKS[campaign.intensity];
    if (Math.random() * 100 < discoveryChance) {
      campaign.discovered = true;
      campaign.discoveryTurn = gameState.turn;
      campaign.exposureNarrative = `${campaign.targetNation} has uncovered a ${campaign.intensity} ${campaign.type} propaganda campaign orchestrated by ${campaign.sourceNation}!`;
      narratives.push(campaign.exposureNarrative);

      // Diplomatic fallout
      if (source.relationships) {
        source.relationships[campaign.targetNation] =
          Math.max(-100, (source.relationships[campaign.targetNation] || 0) - 25);
      }
    }

    // Check if campaign is complete
    if (campaign.turnsActive >= campaign.totalDuration || campaign.discovered) {
      completed.push(campaign);

      if (!campaign.discovered) {
        narratives.push(`Phobia campaign (${campaign.type}) in ${campaign.targetNation} has concluded. Fear level: ${campaign.currentPhobiaLevel}, Radicalized: ${campaign.radicalizedPops}`);
      }
    } else {
      campaign.lastUpdated = gameState.turn;
      active.push(campaign);
    }
  }

  return { active, completed, narratives };
}

/**
 * Calculate phobia effects for a nation
 */
export function calculatePhobiaEffects(
  nation: Nation,
  campaigns: PhobiaCampaign[]
): PhobiaEffects {
  const activePhobias = new Map<PhobiaType, number>();
  let totalStabilityPenalty = 0;
  let totalProductionPenalty = 0;
  let totalImmigrationPenalty = 0;
  let totalDiplomaticPenalty = 0;

  // Aggregate all active campaigns
  for (const campaign of campaigns) {
    if (campaign.targetNation === nation.id && !campaign.discovered) {
      const current = activePhobias.get(campaign.type) || 0;
      activePhobias.set(campaign.type, Math.max(current, campaign.currentPhobiaLevel));

      const effects = PHOBIA_CAMPAIGN_CONFIG.EFFECTS_MULTIPLIER[campaign.type];
      const intensity = campaign.currentPhobiaLevel / 100;

      if ('stability' in effects && effects.stability) totalStabilityPenalty += Math.abs(effects.stability) * intensity;
      if ('production' in effects && effects.production) totalProductionPenalty += Math.abs(effects.production) * intensity;
      if ('diplomacy' in effects && effects.diplomacy) totalDiplomaticPenalty += Math.abs(effects.diplomacy) * intensity;
    }
  }

  return {
    nation: nation.id,
    activePhobias,
    stabilityPenalty: totalStabilityPenalty,
    productionPenalty: totalProductionPenalty,
    immigrationPenalty: totalImmigrationPenalty,
    diplomaticPenalty: totalDiplomaticPenalty,
    manipulationBonus: totalStabilityPenalty * 0.5, // Afraid people easier to manipulate
    recruitmentBonus: totalStabilityPenalty * 0.3, // Easier to recruit useful idiots
  };
}

// ============================================================================
// RELIGIOUS WEAPONIZATION
// ============================================================================

/**
 * Deploy a religious weapon
 */
export function deployReligiousWeapon(
  gameState: GameState,
  sourceNation: string,
  targetNations: string[],
  type: ReligiousWeaponType
): ReligiousWeapon | null {
  const source = gameState.nations[sourceNation];
  if (!source) return null;

  const cost = RELIGIOUS_WEAPON_CONFIG.BASE_COSTS[type];

  if (source.intel < cost) {
    return null; // Not enough intel
  }

  // Check ideology compatibility
  const sourceIdeology = source.ideologyState?.currentIdeology;
  const compatibleIdeologies = RELIGIOUS_WEAPON_CONFIG.IDEOLOGY_COMPATIBILITY[type] as IdeologyType[];

  if (sourceIdeology && !compatibleIdeologies.includes(sourceIdeology)) {
    return null; // Incompatible ideology
  }

  source.intel -= cost;

  const bonuses = RELIGIOUS_WEAPON_CONFIG.FERVOR_BONUSES[type];

  const weapon: ReligiousWeapon = {
    id: `relig-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    sourceNation,
    targetNations,
    fervor: 30 + Math.floor(Math.random() * 20),
    reach: 40 + Math.floor(Math.random() * 20),
    conviction: 50 + Math.floor(Math.random() * 20),
    intelCostPerTurn: Math.floor(cost * 0.2),
    turnsActive: 0,
    populationMoraleBonus: ('morale' in bonuses ? bonuses.morale : 0) || 0,
    unitCombatBonus: ('combat' in bonuses ? bonuses.combat : 0) || 0,
    productionBonus: ('production' in bonuses ? bonuses.production : 0) || 0,
    stabilityBonus: ('stability' in bonuses ? bonuses.stability : 0) || 0,
    destabilizationEffect: ('target_stability' in bonuses && bonuses.target_stability) ? Math.abs(bonuses.target_stability) : 0,
    ideologicalConversion: 0,
    resistanceMovements: 0,
    backlashRisk: ('extremism_risk' in bonuses ? bonuses.extremism_risk : 0) || 0,
    extremismRisk: ('extremism_risk' in bonuses ? bonuses.extremism_risk : 0) || 0,
    compatibleIdeologies,
    incompatibleIdeologies: [],
    startedAt: gameState.turn,
    lastUpdated: gameState.turn,
  };

  return weapon;
}

/**
 * Process religious weapons for a turn
 */
export function processReligiousWeapons(
  gameState: GameState,
  weapons: ReligiousWeapon[]
): { active: ReligiousWeapon[], backfired: ReligiousWeapon[], narratives: string[] } {
  const active: ReligiousWeapon[] = [];
  const backfired: ReligiousWeapon[] = [];
  const narratives: string[] = [];

  for (const weapon of weapons) {
    const source = gameState.nations[weapon.sourceNation];
    if (!source) continue;

    // Check maintenance cost
    if (source.intel < weapon.intelCostPerTurn) {
      narratives.push(`Religious weapon (${weapon.type}) has been abandoned by ${weapon.sourceNation}.`);
      continue;
    }

    source.intel -= weapon.intelCostPerTurn;
    weapon.turnsActive++;

    // Apply bonuses to source nation
    if (weapon.populationMoraleBonus > 0) {
      source.morale = Math.min(100, source.morale + weapon.populationMoraleBonus * 0.1);
    }

    if (weapon.productionBonus > 0) {
      // Production bonus applied via modifier (handled elsewhere)
    }

    if (weapon.stabilityBonus > 0) {
      source.instability = Math.max(0, (source.instability || 0) - weapon.stabilityBonus * 0.1);
    }

    // Apply penalties to target nations
    for (const targetId of weapon.targetNations) {
      const target = gameState.nations[targetId];
      if (!target) continue;

      if (weapon.destabilizationEffect > 0) {
        target.instability = (target.instability || 0) + weapon.destabilizationEffect * 0.1;
      }

      // Chance of ideological conversion
      if (Math.random() * 100 < weapon.fervor / 10) {
        weapon.ideologicalConversion++;

        if (target.popGroups && target.popGroups.length > 0) {
          const randomPop = target.popGroups[Math.floor(Math.random() * target.popGroups.length)];
          randomPop.loyalty = Math.max(0, randomPop.loyalty - 5);
          randomPop.happiness = Math.max(0, randomPop.happiness - 3);
        }
      }

      // Chance of resistance movement
      if (Math.random() * 100 < weapon.conviction / 20) {
        weapon.resistanceMovements++;
        narratives.push(`Resistance movement sparked in ${targetId} by ${weapon.sourceNation}'s ${weapon.type}!`);
        target.instability = (target.instability || 0) + 5;
      }
    }

    // Check for backlash
    if (Math.random() * 100 < weapon.backlashRisk) {
      // Weapon backfires!
      weapon.extremismRisk += 10;

      if (weapon.extremismRisk > 50) {
        narratives.push(`BACKLASH: ${weapon.sourceNation}'s ${weapon.type} has created dangerous extremism!`);
        source.instability = (source.instability || 0) + 15;
        backfired.push(weapon);
      } else {
        narratives.push(`Warning: ${weapon.sourceNation}'s ${weapon.type} is showing signs of extremism (risk: ${weapon.extremismRisk}%).`);
        source.instability = (source.instability || 0) + 5;
        active.push(weapon);
      }
    } else {
      // Strengthen over time
      weapon.fervor = Math.min(100, weapon.fervor + 2);
      weapon.reach = Math.min(100, weapon.reach + 1);
      weapon.lastUpdated = gameState.turn;
      active.push(weapon);
    }
  }

  return { active, backfired, narratives };
}

/**
 * Calculate religious warfare state for a nation
 */
export function calculateReligiousWarfareState(
  nation: Nation,
  weapons: ReligiousWeapon[]
): ReligiousWarfareState {
  const activeWeapons = weapons.filter(w => w.sourceNation === nation.id);

  let totalFervor = 0;
  let totalExtremism = 0;

  for (const weapon of activeWeapons) {
    totalFervor += weapon.fervor;
    totalExtremism += weapon.extremismRisk;
  }

  const avgFervor = activeWeapons.length > 0 ? totalFervor / activeWeapons.length : 0;
  const avgExtremism = activeWeapons.length > 0 ? totalExtremism / activeWeapons.length : 0;

  return {
    nation: nation.id,
    activeWeapons,
    religiousDefense: 50, // Default
    secularization: 50,
    religiousFervor: avgFervor,
    ideologicalZealotry: avgExtremism,
    internalExtremists: Math.floor(avgExtremism / 10),
    violentExtremism: avgExtremism > 70,
    religiousSchisms: Math.floor(avgExtremism / 25),
  };
}

// ============================================================================
// INTEGRATED OPERATIONS
// ============================================================================

/**
 * Create an integrated propaganda operation combining multiple tactics
 */
export function createIntegratedOperation(
  gameState: GameState,
  sourceNation: string,
  targetNation: string,
  name: string,
  objectives: PropagandaObjective[]
): IntegratedPropagandaOperation {
  return {
    id: `integrated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    sourceNation,
    targetNation,
    usefulIdiots: [],
    phobiaCampaigns: [],
    religiousWeapons: [],
    synergyBonus: 0,
    totalEffectiveness: 0,
    totalIntelCost: 0,
    startedAt: gameState.turn,
    estimatedCompletionTurn: gameState.turn + 10,
    objectives,
    completedObjectives: [],
  };
}

/**
 * Calculate synergy bonus for integrated operations
 */
export function calculateSynergyBonus(operation: IntegratedPropagandaOperation): number {
  let bonus = 0;

  const hasIdiots = operation.usefulIdiots.length > 0;
  const hasPhobias = operation.phobiaCampaigns.length > 0;
  const hasReligious = operation.religiousWeapons.length > 0;

  // Two tactics together
  if ((hasIdiots && hasPhobias) || (hasIdiots && hasReligious) || (hasPhobias && hasReligious)) {
    bonus += 15;
  }

  // All three tactics
  if (hasIdiots && hasPhobias && hasReligious) {
    bonus += 25;
  }

  return Math.min(50, bonus);
}

/**
 * Evaluate objectives for integrated operation
 */
export function evaluateObjectives(
  gameState: GameState,
  operation: IntegratedPropagandaOperation
): string[] {
  const newlyCompleted: string[] = [];
  const target = gameState.nations[operation.targetNation];

  if (!target) return newlyCompleted;

  for (const objective of operation.objectives) {
    if (objective.completed) continue;

    let completed = false;

    switch (objective.type) {
      case 'destabilize':
        if ((target.instability || 0) > 50) completed = true;
        break;
      case 'paralyze':
        if (target.morale < 30) completed = true;
        break;
      case 'convert':
        if (target.ideologyState?.ideologyStability && target.ideologyState.ideologyStability < 40) {
          completed = true;
        }
        break;
      case 'radicalize':
        // Check for radicalization
        const radicalizedPops = target.popGroups?.filter(p => p.loyalty < 30).length || 0;
        if (radicalizedPops > 0) completed = true;
        break;
      case 'divide':
        // Check for internal conflicts
        if ((target.instability || 0) > 40 && target.morale < 50) completed = true;
        break;
    }

    if (completed) {
      objective.completed = true;
      operation.completedObjectives.push(objective.id);
      newlyCompleted.push(objective.id);
    }
  }

  return newlyCompleted;
}

// ============================================================================
// MAIN TURN PROCESSOR
// ============================================================================

/**
 * Process all advanced propaganda for a turn
 */
export function processAdvancedPropaganda(
  gameState: GameState,
  state: AdvancedPropagandaState
): { narratives: string[], state: AdvancedPropagandaState } {
  const narratives: string[] = [];

  // Process recruitment operations
  const recruitmentResults = processRecruitmentOperations(gameState, state.recruitmentOperations);
  state.recruitmentOperations = recruitmentResults.ongoing;
  state.usefulIdiots.push(...recruitmentResults.completed);
  state.totalUsefulIdiotsRecruited += recruitmentResults.completed.length;

  for (const failed of recruitmentResults.failed) {
    if (failed.discovered) {
      narratives.push(`Recruitment operation in ${failed.targetNation} was discovered!`);
      state.totalExposures++;
    }
  }

  // Process useful idiots
  const idiotResults = processUsefulIdiots(gameState, state.usefulIdiots);
  state.usefulIdiots = idiotResults.active;
  narratives.push(...idiotResults.narratives);
  state.totalExposures += idiotResults.exposed.length;

  // Process phobia campaigns
  const phobiaResults = processPhobiaCampaigns(gameState, state.phobiaCampaigns);
  state.phobiaCampaigns = phobiaResults.active;
  narratives.push(...phobiaResults.narratives);
  state.totalOperationsCompleted += phobiaResults.completed.length;

  // Process religious weapons
  const religiousResults = processReligiousWeapons(gameState, state.religiousWeapons);
  state.religiousWeapons = religiousResults.active;
  narratives.push(...religiousResults.narratives);

  // Process integrated operations
  for (const operation of state.integratedOperations) {
    operation.synergyBonus = calculateSynergyBonus(operation);
    const completed = evaluateObjectives(gameState, operation);

    if (completed.length > 0) {
      narratives.push(`Integrated operation "${operation.name}" completed ${completed.length} objectives!`);
    }
  }

  // Calculate effects for all nations
  for (const nationId in gameState.nations) {
    const nation = gameState.nations[nationId];

    // Calculate phobia effects
    const phobiaEffects = calculatePhobiaEffects(nation, state.phobiaCampaigns);
    state.phobiaEffects.set(nationId, phobiaEffects);

    // Calculate religious warfare state
    const religiousState = calculateReligiousWarfareState(nation, state.religiousWeapons);
    state.religiousWarfareStates.set(nationId, religiousState);
  }

  return { narratives, state };
}

/**
 * Initialize advanced propaganda state
 */
export function initializeAdvancedPropagandaState(): AdvancedPropagandaState {
  return {
    usefulIdiots: [],
    recruitmentOperations: [],
    phobiaCampaigns: [],
    religiousWeapons: [],
    integratedOperations: [],
    phobiaEffects: new Map(),
    religiousWarfareStates: new Map(),
    totalIntelSpent: 0,
    totalOperationsCompleted: 0,
    totalUsefulIdiotsRecruited: 0,
    totalExposures: 0,
  };
}
