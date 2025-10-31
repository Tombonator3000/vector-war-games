/**
 * Week 9: Counter-Occult Mechanics
 * Human resistance tech tree, investigation operations, and sanity restoration
 */

import { GreatOldOnesState, RegionalState } from '../types/greatOldOnes';
import {
  ResistanceResearch,
  ResistanceTechnology,
  ResearchPath,
  GlobalUnityState,
  HumanAlliance,
  JointOperation,
  InvestigationTaskForce,
  SanityRestoration,
  ExorcismOperation,
} from '../types/phase3Types';

// ============================================================================
// RESISTANCE RESEARCH SYSTEM
// ============================================================================

/**
 * Progress resistance research based on investigation heat and global conditions
 */
export function progressResistanceResearch(
  research: ResistanceResearch,
  state: GreatOldOnesState
): {
  progressGained: number;
  techUnlocked?: ResistanceTechnology;
  message: string;
} {
  // Base progress determined by investigation heat
  const avgInvestigationHeat =
    state.regions.reduce((sum, r) => sum + r.investigationHeat, 0) / state.regions.length;

  let baseProgress = avgInvestigationHeat / 10; // 0-10 progress per turn

  // Bonuses
  const veilBonus = state.veil.integrity < 50 ? (50 - state.veil.integrity) / 5 : 0; // Lower veil = more research
  const corruptionBonus = state.resources.corruptionIndex / 20; // Higher corruption = more research

  const progressGained = baseProgress + veilBonus + corruptionBonus;
  research.progress = Math.min(100, research.progress + progressGained);

  // Check for tech unlocks at milestones
  let techUnlocked: ResistanceTechnology | undefined;
  const milestones = [25, 50, 75, 100];

  for (const milestone of milestones) {
    if (research.progress >= milestone && research.unlockedTech.length < milestones.indexOf(milestone) + 1) {
      techUnlocked = generateResistanceTech(research.path, milestone);
      research.unlockedTech.push(techUnlocked);
      research.effectivenessAgainstOrder += techUnlocked.effectiveness;
      break;
    }
  }

  const message = techUnlocked
    ? `ALERT: Humanity has developed ${techUnlocked.name}!`
    : `Resistance research progresses: ${research.name} (${research.progress.toFixed(0)}%)`;

  return { progressGained, techUnlocked, message };
}

/**
 * Generate a resistance technology
 */
function generateResistanceTech(
  path: ResearchPath,
  milestone: number
): ResistanceTechnology {
  const techs: Record<ResearchPath, Record<number, Omit<ResistanceTechnology, 'id'>>> = {
    occult_defense: {
      25: {
        name: 'Basic Wards',
        description: 'Simple protective circles that weaken eldritch influence',
        researchPath: 'occult_defense',
        counters: ['rituals'],
        effectiveness: 15,
        deployment: 0,
      },
      50: {
        name: 'Advanced Wards',
        description: 'Complex geometric patterns that disrupt ritual power',
        researchPath: 'occult_defense',
        counters: ['rituals', 'corruption'],
        effectiveness: 30,
        deployment: 0,
      },
      75: {
        name: 'Elder Sign Networks',
        description: 'Interconnected protection grids covering entire regions',
        researchPath: 'occult_defense',
        counters: ['rituals', 'entities', 'corruption'],
        effectiveness: 50,
        deployment: 0,
      },
      100: {
        name: 'Reality Stabilization Field',
        description: 'Large-scale fields that prevent all manifestations',
        researchPath: 'occult_defense',
        counters: ['rituals', 'entities', 'corruption', 'madness'],
        effectiveness: 75,
        deployment: 0,
      },
    },
    psychic_shielding: {
      25: {
        name: 'Mental Discipline Training',
        description: 'Basic meditation and focus techniques',
        researchPath: 'psychic_shielding',
        counters: ['madness'],
        effectiveness: 20,
        deployment: 0,
      },
      50: {
        name: 'Psychic Dampeners',
        description: 'Devices that block mental intrusion',
        researchPath: 'psychic_shielding',
        counters: ['madness', 'corruption'],
        effectiveness: 35,
        deployment: 0,
      },
      75: {
        name: 'Hive Mind Resistance',
        description: 'Collective consciousness that rejects eldritch influence',
        researchPath: 'psychic_shielding',
        counters: ['madness', 'corruption', 'infiltration'],
        effectiveness: 55,
        deployment: 0,
      },
      100: {
        name: 'Psychic Immunity',
        description: 'Complete mental protection for key personnel',
        researchPath: 'psychic_shielding',
        counters: ['madness', 'corruption', 'infiltration'],
        effectiveness: 80,
        deployment: 0,
      },
    },
    counter_rituals: {
      25: {
        name: 'Basic Banishment',
        description: 'Simple rituals to dismiss minor entities',
        researchPath: 'counter_rituals',
        counters: ['entities'],
        effectiveness: 25,
        deployment: 0,
      },
      50: {
        name: 'Advanced Exorcism',
        description: 'Powerful banishment capable of affecting major entities',
        researchPath: 'counter_rituals',
        counters: ['entities', 'rituals'],
        effectiveness: 40,
        deployment: 0,
      },
      75: {
        name: 'Mass Exorcism',
        description: 'Large-scale banishment affecting entire regions',
        researchPath: 'counter_rituals',
        counters: ['entities', 'rituals', 'corruption'],
        effectiveness: 60,
        deployment: 0,
      },
      100: {
        name: 'Permanent Sealing',
        description: 'Rituals that permanently bind Great Old Ones',
        researchPath: 'counter_rituals',
        counters: ['entities', 'rituals'],
        effectiveness: 85,
        deployment: 0,
      },
    },
    artifact_weapons: {
      25: {
        name: 'Blessed Weapons',
        description: 'Consecrated arms effective against lesser entities',
        researchPath: 'artifact_weapons',
        counters: ['entities'],
        effectiveness: 20,
        deployment: 0,
      },
      50: {
        name: 'Elder Artifacts',
        description: 'Ancient weapons that harm eldritch beings',
        researchPath: 'artifact_weapons',
        counters: ['entities', 'corruption'],
        effectiveness: 45,
        deployment: 0,
      },
      75: {
        name: 'Crafted Relics',
        description: 'Newly forged artifacts combining old and new knowledge',
        researchPath: 'artifact_weapons',
        counters: ['entities', 'rituals', 'corruption'],
        effectiveness: 65,
        deployment: 0,
      },
      100: {
        name: 'God-Slaying Arsenal',
        description: 'Weapons capable of harming even Great Old Ones',
        researchPath: 'artifact_weapons',
        counters: ['entities'],
        effectiveness: 90,
        deployment: 0,
      },
    },
    reality_anchors: {
      25: {
        name: 'Reality Beacons',
        description: 'Devices that reinforce normal physics',
        researchPath: 'reality_anchors',
        counters: ['rituals', 'entities'],
        effectiveness: 18,
        deployment: 0,
      },
      50: {
        name: 'Dimensional Locks',
        description: 'Prevent entities from manifesting',
        researchPath: 'reality_anchors',
        counters: ['entities', 'rituals'],
        effectiveness: 38,
        deployment: 0,
      },
      75: {
        name: 'Physics Enforcement Grid',
        description: 'Large-scale reality stabilization',
        researchPath: 'reality_anchors',
        counters: ['entities', 'rituals', 'madness'],
        effectiveness: 58,
        deployment: 0,
      },
      100: {
        name: 'Universal Constant',
        description: 'Makes reality immutable in protected zones',
        researchPath: 'reality_anchors',
        counters: ['entities', 'rituals', 'madness', 'corruption'],
        effectiveness: 88,
        deployment: 0,
      },
    },
  };

  const techData = techs[path][milestone];
  return {
    id: `tech_${path}_${milestone}_${Date.now()}`,
    ...techData,
  };
}

/**
 * Deploy resistance technology
 */
export function deployResistanceTech(
  tech: ResistanceTechnology,
  targetRegionId: string,
  state: GreatOldOnesState
): {
  success: boolean;
  impact: {
    ritualsDisrupted: number;
    entitiesWeakened: number;
    corruptionReduced: number;
    sanityRestored: number;
  };
  message: string;
} {
  const region = state.regions.find(r => r.regionId === targetRegionId);
  if (!region) {
    return {
      success: false,
      impact: { ritualsDisrupted: 0, entitiesWeakened: 0, corruptionReduced: 0, sanityRestored: 0 },
      message: 'Invalid region',
    };
  }

  tech.deployment = Math.min(100, tech.deployment + 25);

  const impact = {
    ritualsDisrupted: 0,
    entitiesWeakened: 0,
    corruptionReduced: 0,
    sanityRestored: 0,
  };

  // Apply effects based on what the tech counters
  if (tech.counters.includes('rituals')) {
    impact.ritualsDisrupted = region.ritualSites.length;
    // Disrupt active rituals
    for (const site of region.ritualSites) {
      if (site.activeRitual) {
        site.activeRitual.successChance *= 1 - tech.effectiveness / 100;
      }
    }
  }

  if (tech.counters.includes('entities')) {
    const entitiesInRegion = state.summonedEntities.filter(e => e.regionId === targetRegionId);
    impact.entitiesWeakened = entitiesInRegion.length;
    for (const entity of entitiesInRegion) {
      entity.power *= 1 - tech.effectiveness / 100;
      entity.bindingStrength = Math.max(0, entity.bindingStrength - tech.effectiveness / 2);
    }
  }

  if (tech.counters.includes('corruption')) {
    const reduction = tech.effectiveness / 5;
    region.corruption = Math.max(0, region.corruption - reduction);
    impact.corruptionReduced = reduction;
  }

  if (tech.counters.includes('madness')) {
    const restoration = tech.effectiveness / 4;
    region.sanitySanity = Math.min(100, region.sanitySanity + restoration);
    impact.sanityRestored = restoration;
  }

  return {
    success: true,
    impact,
    message: `${tech.name} deployed in ${region.regionName}. The Order's power wanes!`,
  };
}

// ============================================================================
// GLOBAL UNITY SYSTEM
// ============================================================================

/**
 * Calculate global unity based on veil and corruption
 */
export function calculateGlobalUnity(state: GreatOldOnesState): number {
  // Unity increases when veil is low (truth is known)
  const veilFactor = (100 - state.veil.integrity) / 2; // 0-50

  // Unity increases with corruption (people are suffering)
  const corruptionFactor = state.resources.corruptionIndex / 3; // 0-33

  // Unity increases with low sanity (desperation)
  const avgSanity = state.regions.reduce((sum, r) => sum + r.sanitySanity, 0) / state.regions.length;
  const sanityFactor = (100 - avgSanity) / 6; // 0-16

  return Math.min(100, veilFactor + corruptionFactor + sanityFactor);
}

/**
 * Form a human alliance
 */
export function formAlliance(
  type: HumanAlliance['type'],
  members: string[],
  unityScore: number
): HumanAlliance {
  const names: Record<HumanAlliance['type'], string> = {
    religious: 'Ecumenical Anti-Cult Alliance',
    scientific: 'Global Scientific Task Force',
    military: 'Joint Anti-Occult Command',
    political: 'United Nations Anti-Corruption Initiative',
  };

  const baseStrength = unityScore / 2; // Strength based on global unity
  const memberBonus = members.length * 5;

  return {
    id: `alliance_${type}_${Date.now()}`,
    name: names[type],
    type,
    members,
    strength: Math.min(100, baseStrength + memberBonus),
    resources: {
      funding: Math.floor(members.length * 100 + unityScore * 10),
      personnel: Math.floor(members.length * 500 + unityScore * 50),
      technology: Math.floor(unityScore / 2),
    },
  };
}

/**
 * Plan a joint operation against the Order
 */
export function planJointOperation(
  alliances: HumanAlliance[],
  targetId: string,
  targetType: JointOperation['targetType'],
  operationType: JointOperation['type'],
  state: GreatOldOnesState
): JointOperation {
  const participants = alliances.map(a => a.id);

  // Calculate success chance
  const totalStrength = alliances.reduce((sum, a) => sum + a.strength, 0);
  const avgStrength = totalStrength / alliances.length;

  let baseSuccess = avgStrength;

  // Modifiers based on target
  if (targetType === 'ritual_site') {
    const site = state.regions
      .flatMap(r => r.ritualSites)
      .find(s => s.id === targetId);
    if (site) {
      if (site.hasDefensiveWards) baseSuccess -= 20;
      if (site.hasGlamourVeil) baseSuccess -= 15;
      baseSuccess -= site.type === 'gateway' ? 30 : site.type === 'nexus' ? 20 : 10;
    }
  } else if (targetType === 'entity') {
    const entity = state.summonedEntities.find(e => e.id === targetId);
    if (entity) {
      baseSuccess -= entity.tier === 'great_old_one' ? 50 : entity.tier === 'avatar' ? 40 : 20;
    }
  }

  const successChance = Math.max(10, Math.min(90, baseSuccess));

  const turnsToPrep = operationType === 'assault' ? 3 : operationType === 'exorcism' ? 5 : 4;

  return {
    id: `joint_op_${Date.now()}`,
    name: `Operation ${generateOperationName()}`,
    type: operationType,
    targetId,
    targetType,
    participants,
    preparation: 0,
    successChance,
    turnsUntilLaunch: turnsToPrep,
  };
}

/**
 * Generate operation name
 */
function generateOperationName(): string {
  const adjectives = ['Divine', 'Righteous', 'Sacred', 'Pure', 'Eternal', 'Final'];
  const nouns = ['Light', 'Shield', 'Hammer', 'Sword', 'Dawn', 'Reckoning'];

  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];

  return `${adj} ${noun}`;
}

/**
 * Execute a joint operation
 */
export function executeJointOperation(
  operation: JointOperation,
  state: GreatOldOnesState
): {
  success: boolean;
  damage: {
    orderPowerLost: number;
    veilRestored: number;
    sanityRestored: number;
    corruptionReduced: number;
  };
  casualties: {
    humanLosses: number;
    cultistLosses: number;
  };
  message: string;
} {
  const roll = Math.random() * 100;
  const success = roll < operation.successChance;

  const damage = {
    orderPowerLost: 0,
    veilRestored: 0,
    sanityRestored: 0,
    corruptionReduced: 0,
  };

  const casualties = {
    humanLosses: 0,
    cultistLosses: 0,
  };

  if (success) {
    // Operation succeeds
    if (operation.targetType === 'ritual_site') {
      const site = state.regions
        .flatMap(r => r.ritualSites)
        .find(s => s.id === operation.targetId);
      if (site) {
        // Destroy or damage site
        site.storedPower = 0;
        site.hasDefensiveWards = false;
        site.hasGlamourVeil = false;
        if (site.activeRitual) {
          site.activeRitual = undefined;
        }
        damage.orderPowerLost = 30;
        damage.veilRestored = 10;
      }
    } else if (operation.targetType === 'entity') {
      const entity = state.summonedEntities.find(e => e.id === operation.targetId);
      if (entity && operation.type === 'exorcism') {
        // Banish entity
        const index = state.summonedEntities.indexOf(entity);
        if (index > -1) {
          state.summonedEntities.splice(index, 1);
        }
        damage.orderPowerLost = 50;
        damage.veilRestored = 20;
        damage.sanityRestored = 15;
      }
    } else if (operation.targetType === 'region') {
      const region = state.regions.find(r => r.regionId === operation.targetId);
      if (region) {
        region.corruption = Math.max(0, region.corruption - 30);
        region.sanitySanity = Math.min(100, region.sanitySanity + 20);
        damage.corruptionReduced = 30;
        damage.sanityRestored = 20;
        damage.veilRestored = 5;
      }
    }

    casualties.humanLosses = Math.floor(Math.random() * 100) + 50;
    casualties.cultistLosses = Math.floor(Math.random() * 200) + 100;

    return {
      success: true,
      damage,
      casualties,
      message: `${operation.name} succeeds! The Order suffers a major setback!`,
    };
  } else {
    // Operation fails
    casualties.humanLosses = Math.floor(Math.random() * 300) + 200;
    casualties.cultistLosses = Math.floor(Math.random() * 50);

    return {
      success: false,
      damage,
      casualties,
      message: `${operation.name} fails! Heavy casualties on the human side.`,
    };
  }
}

// ============================================================================
// SANITY RESTORATION
// ============================================================================

/**
 * Initiate sanity restoration program
 */
export function initiateSanityRestoration(
  type: SanityRestoration['type'],
  regions: string[]
): SanityRestoration {
  const programs: Record<SanityRestoration['type'], Omit<SanityRestoration, 'id' | 'activeRegions'>> = {
    therapy: {
      type: 'therapy',
      name: 'Mass Therapy Programs',
      effectiveness: 60,
      restorationRate: 0.5,
      vulnerable: true,
    },
    memetic_counter: {
      type: 'memetic_counter',
      name: 'Counter-Memetic Campaigns',
      effectiveness: 70,
      restorationRate: 0.8,
      vulnerable: true,
    },
    religious_revival: {
      type: 'religious_revival',
      name: 'Religious Revival Movement',
      effectiveness: 55,
      restorationRate: 0.6,
      vulnerable: false,
    },
    pharmaceutical: {
      type: 'pharmaceutical',
      name: 'Anti-Psychotic Distribution',
      effectiveness: 65,
      restorationRate: 0.7,
      vulnerable: true,
    },
  };

  return {
    id: `sanity_restoration_${type}_${Date.now()}`,
    activeRegions: regions,
    ...programs[type],
  };
}

/**
 * Apply sanity restoration
 */
export function applySanityRestoration(
  program: SanityRestoration,
  state: GreatOldOnesState
): {
  sanityRestored: number;
  regionsAffected: string[];
  message: string;
} {
  let totalRestored = 0;
  const regionsAffected: string[] = [];

  for (const regionId of program.activeRegions) {
    const region = state.regions.find(r => r.regionId === regionId);
    if (!region) continue;

    const restoration = program.restorationRate * (program.effectiveness / 100);
    region.sanitySanity = Math.min(100, region.sanitySanity + restoration);
    totalRestored += restoration;
    regionsAffected.push(regionId);
  }

  return {
    sanityRestored: totalRestored,
    regionsAffected,
    message: `${program.name} restores ${totalRestored.toFixed(1)} sanity across ${regionsAffected.length} regions`,
  };
}

// ============================================================================
// INVESTIGATION TASK FORCES
// ============================================================================

/**
 * Create investigation task force
 */
export function createTaskForce(
  globalUnity: number
): InvestigationTaskForce {
  const leaders = [
    { name: 'Director Sarah Chen', specialization: 'Occult Research', abilities: ['artifact_detection', 'ritual_knowledge'] },
    { name: 'Agent Marcus Stone', specialization: 'Combat Operations', abilities: ['tactical_assault', 'entity_combat'] },
    { name: 'Dr. Elena Volkov', specialization: 'Psychic Defense', abilities: ['psychic_resistance', 'mind_shield'] },
    { name: 'Inspector James Blackwood', specialization: 'Investigation', abilities: ['infiltration_detection', 'cult_tracking'] },
  ];

  const leader = leaders[Math.floor(Math.random() * leaders.length)];

  const baseCapability = globalUnity / 2;

  return {
    id: `taskforce_${Date.now()}`,
    name: `Task Force ${generateTaskForceName()}`,
    leader,
    capabilities: {
      investigation: baseCapability + Math.random() * 20,
      combat: baseCapability + Math.random() * 20,
      occultKnowledge: baseCapability + Math.random() * 20,
      psychicResistance: baseCapability + Math.random() * 20,
    },
  };
}

/**
 * Generate task force name
 */
function generateTaskForceName(): string {
  const prefixes = ['Alpha', 'Omega', 'Sigma', 'Delta', 'Gamma'];
  const suffixes = ['Sentinel', 'Guardian', 'Vanguard', 'Aegis', 'Bastion'];

  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

  return `${prefix}-${suffix}`;
}
