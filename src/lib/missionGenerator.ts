/**
 * Mission Generator - Week 3
 * Procedural objectives, human counter-ops, outcome scoring
 */

import type {
  GreatOldOnesState,
  Doctrine,
  RegionalState,
  CosmicAlignment,
  OccultOperation,
} from '../types/greatOldOnes';

// ============================================================================
// MISSION TYPES
// ============================================================================

export type MissionCategory =
  | 'harvest_sanity'
  | 'perform_ritual'
  | 'spread_corruption'
  | 'silence_witnesses'
  | 'infiltrate_institution'
  | 'summon_entity'
  | 'defend_site'
  | 'counter_investigation';

export interface Mission {
  id: string;
  category: MissionCategory;
  title: string;
  description: string;
  regionId: string;

  /** Mission objectives */
  objectives: MissionObjective[];

  /** Difficulty (1-10) */
  difficulty: number;

  /** Rewards for completion */
  rewards: MissionRewards;

  /** Penalties for failure */
  penalties: MissionPenalties;

  /** Time limit (turns) */
  timeLimit: number;

  /** Current progress */
  progress: number;

  /** Status */
  status: 'available' | 'active' | 'completed' | 'failed' | 'expired';

  /** Turn created */
  createdTurn: number;

  /** Modifiers based on conditions */
  modifiers: MissionModifiers;
}

export interface MissionObjective {
  id: string;
  description: string;
  completed: boolean;
  progress: number;
  target: number;
}

export interface MissionRewards {
  sanityFragments?: number;
  eldritchPower?: number;
  corruptionGain?: number;
  cultistRecruits?: number;
  doctrinePoints?: number;
  specialReward?: string;
}

export interface MissionPenalties {
  veilDamage?: number;
  investigationHeat?: number;
  cultistLosses?: number;
  sanityLoss?: number;
}

export interface MissionModifiers {
  lunarPhaseBonus: number;
  planetaryAlignmentBonus: number;
  doctrineBonus: number;
  culturalModifier: number;
  investigationPenalty: number;
}

// ============================================================================
// MISSION TEMPLATES
// ============================================================================

export interface MissionTemplate {
  category: MissionCategory;
  titleTemplates: string[];
  descriptionTemplates: string[];

  /** Base difficulty range */
  difficultyRange: [number, number];

  /** Preferred doctrine */
  preferredDoctrine?: Doctrine;

  /** Base rewards */
  baseRewards: MissionRewards;

  /** Base penalties */
  basePenalties: MissionPenalties;

  /** Objective generator */
  generateObjectives: (state: GreatOldOnesState, region: RegionalState) => MissionObjective[];

  /** Time limit range */
  timeLimitRange: [number, number];
}

export const MISSION_TEMPLATES: Record<MissionCategory, MissionTemplate> = {
  harvest_sanity: {
    category: 'harvest_sanity',
    titleTemplates: [
      'Harvest the Broken',
      'Asylum Extraction',
      'Shattered Minds',
      'Sanity Collection Operation',
      'The Harvesting',
    ],
    descriptionTemplates: [
      'Deploy cultists to harvest sanity fragments from {institution}. The broken-minded will fuel our rituals.',
      'An asylum in {region} contains prime subjects. Extract their sanity before investigators intervene.',
      'A mass trauma event has left minds vulnerable. Harvest the fragments before they heal.',
      'Establish a therapy clinic as cover for systematic sanity extraction.',
    ],
    difficultyRange: [2, 5],
    preferredDoctrine: 'domination',
    baseRewards: {
      sanityFragments: 80,
      eldritchPower: 20,
    },
    basePenalties: {
      veilDamage: 5,
      investigationHeat: 10,
    },
    generateObjectives: (state, region) => [
      {
        id: 'harvest_fragments',
        description: 'Harvest 100 sanity fragments',
        completed: false,
        progress: 0,
        target: 100,
      },
      {
        id: 'avoid_detection',
        description: 'Complete harvest without raising alarm',
        completed: false,
        progress: 0,
        target: 1,
      },
    ],
    timeLimitRange: [3, 6],
  },

  perform_ritual: {
    category: 'perform_ritual',
    titleTemplates: [
      'The Midnight Ritual',
      'Eldritch Invocation',
      'Rites of Power',
      'Dark Ceremony',
      'Forbidden Working',
    ],
    descriptionTemplates: [
      'Perform a powerful ritual at {site} to generate eldritch power. The stars are nearly aligned.',
      'Channel cosmic energies through a ritual circle. Success will amplify our power significantly.',
      'A rare celestial alignment approaches. We must perform the ritual before it passes.',
      'The High Council demands a demonstration of power. Perform a major working.',
    ],
    difficultyRange: [3, 7],
    baseRewards: {
      eldritchPower: 150,
      doctrinePoints: 10,
    },
    basePenalties: {
      veilDamage: 8,
      investigationHeat: 15,
    },
    generateObjectives: (state, region) => {
      const ritualSite = region.ritualSites[0];
      return [
        {
          id: 'gather_power',
          description: 'Accumulate 100 eldritch power at ritual site',
          completed: false,
          progress: ritualSite?.storedPower || 0,
          target: 100,
        },
        {
          id: 'assign_cultists',
          description: 'Assign at least 3 cultist cells to ritual',
          completed: false,
          progress: 0,
          target: 3,
        },
        {
          id: 'complete_ritual',
          description: 'Complete the ritual successfully',
          completed: false,
          progress: 0,
          target: 1,
        },
      ];
    },
    timeLimitRange: [4, 8],
  },

  spread_corruption: {
    category: 'spread_corruption',
    titleTemplates: [
      'Seeds of Madness',
      'Cultural Subversion',
      'Corruption Campaign',
      'Ideological Infection',
      'The Rot Spreads',
    ],
    descriptionTemplates: [
      'Spread corruption through {region}\'s cultural institutions. Art, media, and philosophy shall serve us.',
      'Launch a campaign of memetic warfare. Eldritch ideas will take root in fertile minds.',
      'Corrupt the youth through education. Plant seeds that will grow into devotion.',
      'A social movement is gathering momentum. Redirect it toward our purposes.',
    ],
    difficultyRange: [3, 6],
    preferredDoctrine: 'corruption',
    baseRewards: {
      corruptionGain: 15,
      sanityFragments: 40,
      cultistRecruits: 2,
    },
    basePenalties: {
      veilDamage: 3,
      investigationHeat: 8,
    },
    generateObjectives: (state, region) => [
      {
        id: 'raise_corruption',
        description: 'Increase regional corruption by 10%',
        completed: false,
        progress: region.corruption,
        target: region.corruption + 10,
      },
      {
        id: 'recruit_converts',
        description: 'Recruit 50 new initiates',
        completed: false,
        progress: 0,
        target: 50,
      },
    ],
    timeLimitRange: [5, 10],
  },

  silence_witnesses: {
    category: 'silence_witnesses',
    titleTemplates: [
      'Silence the Witness',
      'Eliminate Loose Ends',
      'The Silencing',
      'Remove the Obstacle',
      'Witness Elimination',
    ],
    descriptionTemplates: [
      'A witness to our ritual must be silenced. Failure means exposure.',
      'An investigator has seen too much. Eliminate them before they report.',
      'Survivors of the last operation pose a threat. They must not be allowed to speak.',
      'A journalist is asking dangerous questions. Silence them permanently.',
    ],
    difficultyRange: [4, 8],
    preferredDoctrine: 'domination',
    baseRewards: {
      sanityFragments: 30,
      specialReward: 'veil_protection',
    },
    basePenalties: {
      veilDamage: 10,
      investigationHeat: 20,
    },
    generateObjectives: (state, region) => [
      {
        id: 'locate_witness',
        description: 'Locate the witness',
        completed: false,
        progress: 0,
        target: 1,
      },
      {
        id: 'eliminate_witness',
        description: 'Eliminate the witness without creating more witnesses',
        completed: false,
        progress: 0,
        target: 1,
      },
    ],
    timeLimitRange: [2, 4],
  },

  infiltrate_institution: {
    category: 'infiltrate_institution',
    titleTemplates: [
      'Institutional Infiltration',
      'The Long Con',
      'Deep Cover Operation',
      'Embed the Agent',
      'Inside Job',
    ],
    descriptionTemplates: [
      'Place an operative within {institution}. Long-term corruption begins with a single agent.',
      'A key position has opened in the government. Our agent must secure it.',
      'Build influence within the corporate hierarchy. Money is power, and we need both.',
      'The university is recruiting. An academic agent will spread forbidden knowledge.',
    ],
    difficultyRange: [5, 8],
    preferredDoctrine: 'corruption',
    baseRewards: {
      corruptionGain: 20,
      specialReward: 'infiltrator_recruited',
    },
    basePenalties: {
      veilDamage: 2,
      investigationHeat: 5,
    },
    generateObjectives: (state, region) => [
      {
        id: 'recruit_infiltrator',
        description: 'Recruit and train an infiltrator',
        completed: false,
        progress: 0,
        target: 1,
      },
      {
        id: 'establish_position',
        description: 'Secure position within target institution',
        completed: false,
        progress: 0,
        target: 1,
      },
      {
        id: 'reach_depth',
        description: 'Achieve 30% infiltration depth',
        completed: false,
        progress: 0,
        target: 30,
      },
    ],
    timeLimitRange: [6, 12],
  },

  summon_entity: {
    category: 'summon_entity',
    titleTemplates: [
      'The Summoning',
      'Call from Beyond',
      'Breach the Veil',
      'Invocation of Horror',
      'Entity Manifestation',
    ],
    descriptionTemplates: [
      'Summon {entity} at {site}. The entity will serve... if we can bind it.',
      'The stars align for summoning. Call forth an entity to serve the Order.',
      'Our power grows. It is time to manifest beings from beyond.',
      'Summon a guardian entity to protect our ritual sites from raids.',
    ],
    difficultyRange: [6, 10],
    preferredDoctrine: 'domination',
    baseRewards: {
      eldritchPower: 100,
      doctrinePoints: 20,
      specialReward: 'summoned_entity',
    },
    basePenalties: {
      veilDamage: 15,
      investigationHeat: 25,
      sanityLoss: 20,
    },
    generateObjectives: (state, region) => [
      {
        id: 'prepare_site',
        description: 'Prepare ritual site for summoning',
        completed: false,
        progress: 0,
        target: 1,
      },
      {
        id: 'gather_power',
        description: 'Accumulate required eldritch power',
        completed: false,
        progress: 0,
        target: 200,
      },
      {
        id: 'perform_summoning',
        description: 'Complete summoning ritual',
        completed: false,
        progress: 0,
        target: 1,
      },
      {
        id: 'bind_entity',
        description: 'Successfully bind the entity',
        completed: false,
        progress: 0,
        target: 1,
      },
    ],
    timeLimitRange: [5, 10],
  },

  defend_site: {
    category: 'defend_site',
    titleTemplates: [
      'Defend the Sanctum',
      'Repel the Raid',
      'Site Defense',
      'Stand Against the Light',
      'The Siege',
    ],
    descriptionTemplates: [
      'Investigators are mobilizing to raid {site}. Prepare defenses and repel them.',
      'Government forces approach our temple. We must defend at all costs.',
      'A counter-ritual team has located our nexus. Prevent them from disrupting our work.',
      'Armed forces are en route. Deploy cultists and entities to protect the site.',
    ],
    difficultyRange: [7, 10],
    baseRewards: {
      sanityFragments: 50,
      doctrinePoints: 15,
    },
    basePenalties: {
      cultistLosses: 5,
      veilDamage: 20,
    },
    generateObjectives: (state, region) => [
      {
        id: 'fortify_defenses',
        description: 'Activate defensive wards and glamour veils',
        completed: false,
        progress: 0,
        target: 1,
      },
      {
        id: 'deploy_forces',
        description: 'Deploy at least 5 cultist cells to defense',
        completed: false,
        progress: 0,
        target: 5,
      },
      {
        id: 'repel_attack',
        description: 'Successfully repel the attack',
        completed: false,
        progress: 0,
        target: 1,
      },
    ],
    timeLimitRange: [2, 3],
  },

  counter_investigation: {
    category: 'counter_investigation',
    titleTemplates: [
      'Counter-Intelligence',
      'Misdirect the Hunters',
      'False Trail',
      'Discredit the Investigator',
      'Operation Confusion',
    ],
    descriptionTemplates: [
      'An investigator is closing in. Create false leads to throw them off our trail.',
      'Plant evidence implicating a rival organization for our activities.',
      'Corrupt the investigation from within. Our mole in the agency will assist.',
      'Discredit the lead investigator. Ruin their reputation before they can expose us.',
    ],
    difficultyRange: [5, 7],
    preferredDoctrine: 'corruption',
    baseRewards: {
      specialReward: 'investigation_heat_reduced',
    },
    basePenalties: {
      veilDamage: 5,
    },
    generateObjectives: (state, region) => [
      {
        id: 'identify_investigator',
        description: 'Identify the lead investigator',
        completed: false,
        progress: 0,
        target: 1,
      },
      {
        id: 'create_false_trail',
        description: 'Plant false evidence and misdirection',
        completed: false,
        progress: 0,
        target: 1,
      },
      {
        id: 'reduce_heat',
        description: 'Reduce investigation heat by 20 points',
        completed: false,
        progress: 0,
        target: 20,
      },
    ],
    timeLimitRange: [4, 7],
  },
};

// ============================================================================
// MISSION GENERATION
// ============================================================================

/**
 * Generate procedural missions based on current game state
 */
export function generateMissions(
  state: GreatOldOnesState,
  count: number = 3
): Mission[] {
  const missions: Mission[] = [];

  for (let i = 0; i < count; i++) {
    const mission = generateSingleMission(state);
    if (mission) {
      missions.push(mission);
    }
  }

  return missions;
}

/**
 * Generate a single mission
 */
function generateSingleMission(state: GreatOldOnesState): Mission | null {
  // Select mission category based on doctrine and state
  const category = selectMissionCategory(state);
  const template = MISSION_TEMPLATES[category];

  // Select region
  const region = selectMissionRegion(state, category);
  if (!region) return null;

  // Generate mission details
  const title = selectRandom(template.titleTemplates);
  const description = selectRandom(template.descriptionTemplates)
    .replace('{region}', region.regionName)
    .replace('{site}', region.ritualSites[0]?.name || 'the ritual site')
    .replace('{institution}', generateInstitutionName())
    .replace('{entity}', 'a Lesser Horror');

  // Calculate difficulty
  const baseDifficulty = randomInRange(template.difficultyRange[0], template.difficultyRange[1]);
  const difficulty = adjustDifficultyForState(baseDifficulty, state, region);

  // Generate objectives
  const objectives = template.generateObjectives(state, region);

  // Calculate modifiers
  const modifiers = calculateMissionModifiers(state, region, template);

  // Calculate rewards
  const rewards = calculateMissionRewards(template.baseRewards, difficulty, modifiers);

  // Calculate penalties
  const penalties = template.basePenalties;

  // Time limit
  const timeLimit = randomInRange(template.timeLimitRange[0], template.timeLimitRange[1]);

  const mission: Mission = {
    id: `mission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    category,
    title,
    description,
    regionId: region.regionId,
    objectives,
    difficulty,
    rewards,
    penalties,
    timeLimit,
    progress: 0,
    status: 'available',
    createdTurn: state.alignment.turn,
    modifiers,
  };

  return mission;
}

/**
 * Select mission category based on game state
 */
function selectMissionCategory(state: GreatOldOnesState): MissionCategory {
  const weights: Record<MissionCategory, number> = {
    harvest_sanity: 1.0,
    perform_ritual: 1.0,
    spread_corruption: 1.0,
    silence_witnesses: 0.5,
    infiltrate_institution: 0.8,
    summon_entity: 0.6,
    defend_site: 0.3,
    counter_investigation: 0.7,
  };

  // Adjust weights based on doctrine
  if (state.doctrine === 'domination') {
    weights.harvest_sanity *= 1.5;
    weights.summon_entity *= 2.0;
    weights.defend_site *= 1.5;
  } else if (state.doctrine === 'corruption') {
    weights.spread_corruption *= 2.0;
    weights.infiltrate_institution *= 2.0;
    weights.counter_investigation *= 1.5;
  } else if (state.doctrine === 'convergence') {
    weights.perform_ritual *= 1.5;
    weights.spread_corruption *= 1.3;
  }

  // Adjust based on state
  if (state.veil.integrity < 40) {
    weights.counter_investigation *= 2.0;
    weights.defend_site *= 2.0;
  }

  if (state.resources.sanityFragments < 200) {
    weights.harvest_sanity *= 2.0;
  }

  if (state.resources.eldritchPower < 300) {
    weights.perform_ritual *= 1.5;
  }

  // Weighted random selection
  return weightedRandom(weights);
}

/**
 * Select region for mission
 */
function selectMissionRegion(
  state: GreatOldOnesState,
  category: MissionCategory
): RegionalState | null {
  const eligibleRegions = state.regions.filter(region => {
    // Some missions require ritual sites
    if (['perform_ritual', 'summon_entity', 'defend_site'].includes(category)) {
      return region.ritualSites.length > 0;
    }

    // Some missions require cultist presence
    if (['harvest_sanity', 'spread_corruption', 'silence_witnesses'].includes(category)) {
      return region.cultistCells > 0;
    }

    return true;
  });

  if (eligibleRegions.length === 0) return null;

  // Prefer regions with high corruption for most missions
  const weights = eligibleRegions.map(r => r.corruption + 10);
  const index = weightedRandomIndex(weights);

  return eligibleRegions[index];
}

/**
 * Calculate mission modifiers
 */
function calculateMissionModifiers(
  state: GreatOldOnesState,
  region: RegionalState,
  template: MissionTemplate
): MissionModifiers {
  // Lunar phase bonus
  const lunarPhaseBonus = state.alignment.lunarPhase === 4 ? 0.2 : 0.0;

  // Planetary alignment bonus
  const planetaryAlignmentBonus = state.alignment.planetaryAlignment > 70 ? 0.15 : 0.0;

  // Doctrine bonus
  let doctrineBonus = 0.0;
  if (template.preferredDoctrine && state.doctrine === template.preferredDoctrine) {
    doctrineBonus = 0.25;
  }

  // Cultural modifier
  let culturalModifier = 0.0;
  if (region.culturalTraits.includes('rationalist')) culturalModifier -= 0.1;
  if (region.culturalTraits.includes('superstitious')) culturalModifier += 0.1;
  if (region.culturalTraits.includes('faithful')) culturalModifier -= 0.05;

  // Investigation penalty
  const investigationPenalty = region.investigationHeat / 200;

  return {
    lunarPhaseBonus,
    planetaryAlignmentBonus,
    doctrineBonus,
    culturalModifier,
    investigationPenalty,
  };
}

/**
 * Calculate final mission rewards
 */
function calculateMissionRewards(
  baseRewards: MissionRewards,
  difficulty: number,
  modifiers: MissionModifiers
): MissionRewards {
  const totalModifier = 1 +
    modifiers.lunarPhaseBonus +
    modifiers.planetaryAlignmentBonus +
    modifiers.doctrineBonus +
    modifiers.culturalModifier;

  const difficultyMultiplier = 1 + (difficulty / 10);

  return {
    sanityFragments: baseRewards.sanityFragments ?
      Math.floor(baseRewards.sanityFragments * totalModifier * difficultyMultiplier) : undefined,
    eldritchPower: baseRewards.eldritchPower ?
      Math.floor(baseRewards.eldritchPower * totalModifier * difficultyMultiplier) : undefined,
    corruptionGain: baseRewards.corruptionGain ?
      Math.floor(baseRewards.corruptionGain * totalModifier * difficultyMultiplier) : undefined,
    cultistRecruits: baseRewards.cultistRecruits,
    doctrinePoints: baseRewards.doctrinePoints ?
      Math.floor(baseRewards.doctrinePoints * difficultyMultiplier) : undefined,
    specialReward: baseRewards.specialReward,
  };
}

/**
 * Adjust difficulty based on current state
 */
function adjustDifficultyForState(
  baseDifficulty: number,
  state: GreatOldOnesState,
  region: RegionalState
): number {
  let difficulty = baseDifficulty;

  // Higher investigation heat increases difficulty
  difficulty += region.investigationHeat / 20;

  // Low cultist presence increases difficulty
  if (region.cultistCells < 3) {
    difficulty += 1;
  }

  // Low veil integrity increases difficulty (more scrutiny)
  if (state.veil.integrity < 40) {
    difficulty += 2;
  }

  return Math.max(1, Math.min(10, Math.floor(difficulty)));
}

// ============================================================================
// MISSION OUTCOME SCORING
// ============================================================================

export interface MissionOutcome {
  success: boolean;
  score: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
  actualRewards: MissionRewards;
  actualPenalties: MissionPenalties;
  feedback: string;
  doctrineImpact: number;
  elderOneFavor: number;
}

/**
 * Score mission completion
 */
export function scoreMissionOutcome(
  mission: Mission,
  completionTime: number,
  objectivesCompleted: number,
  bonusFactors: {
    noVeilDamage?: boolean;
    noCasulties?: boolean;
    speedBonus?: boolean;
  } = {}
): MissionOutcome {
  const objectiveCompletion = objectivesCompleted / mission.objectives.length;
  const success = objectiveCompletion >= 0.8; // 80% objectives required

  // Base score
  let score = objectiveCompletion * 100;

  // Time bonus/penalty
  const timeFactor = completionTime / mission.timeLimit;
  if (timeFactor < 0.5) {
    score += 20; // Speed bonus
  } else if (timeFactor > 1.0) {
    score -= 30; // Overtime penalty
  }

  // Bonus factors
  if (bonusFactors.noVeilDamage) score += 15;
  if (bonusFactors.noCasulties) score += 10;
  if (bonusFactors.speedBonus) score += 10;

  // Difficulty multiplier
  score *= (1 + mission.difficulty / 20);

  // Clamp score
  score = Math.max(0, Math.min(150, score));

  // Determine grade
  let grade: MissionOutcome['grade'];
  if (score >= 120) grade = 'S';
  else if (score >= 100) grade = 'A';
  else if (score >= 80) grade = 'B';
  else if (score >= 60) grade = 'C';
  else if (score >= 40) grade = 'D';
  else grade = 'F';

  // Calculate actual rewards (reduced for partial completion)
  const rewardMultiplier = success ? 1.0 : objectiveCompletion * 0.5;
  const actualRewards: MissionRewards = {
    sanityFragments: mission.rewards.sanityFragments ?
      Math.floor(mission.rewards.sanityFragments * rewardMultiplier) : undefined,
    eldritchPower: mission.rewards.eldritchPower ?
      Math.floor(mission.rewards.eldritchPower * rewardMultiplier) : undefined,
    corruptionGain: mission.rewards.corruptionGain ?
      Math.floor(mission.rewards.corruptionGain * rewardMultiplier) : undefined,
    cultistRecruits: success ? mission.rewards.cultistRecruits : 0,
    doctrinePoints: mission.rewards.doctrinePoints ?
      Math.floor(mission.rewards.doctrinePoints * rewardMultiplier) : undefined,
    specialReward: success ? mission.rewards.specialReward : undefined,
  };

  // Calculate penalties (increased for failure)
  const penaltyMultiplier = success ? 1.0 : 1.5;
  const actualPenalties: MissionPenalties = {
    veilDamage: mission.penalties.veilDamage && !bonusFactors.noVeilDamage ?
      Math.floor(mission.penalties.veilDamage * penaltyMultiplier) : 0,
    investigationHeat: mission.penalties.investigationHeat ?
      Math.floor(mission.penalties.investigationHeat * penaltyMultiplier) : undefined,
    cultistLosses: mission.penalties.cultistLosses && !bonusFactors.noCasulties ?
      Math.floor(mission.penalties.cultistLosses * penaltyMultiplier) : undefined,
    sanityLoss: mission.penalties.sanityLoss ?
      Math.floor(mission.penalties.sanityLoss * penaltyMultiplier) : undefined,
  };

  // Generate feedback
  const feedback = generateMissionFeedback(grade, mission.category, success);

  // Doctrine impact (affects council unity)
  const doctrineImpact = success ? Math.floor(score / 10) : -5;

  // Elder One favor (affects victory conditions)
  const elderOneFavor = success ? Math.floor(score / 20) : -3;

  return {
    success,
    score,
    grade,
    actualRewards,
    actualPenalties,
    feedback,
    doctrineImpact,
    elderOneFavor,
  };
}

function generateMissionFeedback(
  grade: MissionOutcome['grade'],
  category: MissionCategory,
  success: boolean
): string {
  if (!success) {
    return 'The mission was a failure. The High Council is displeased.';
  }

  const feedbackByGrade: Record<MissionOutcome['grade'], string[]> = {
    S: [
      'Flawless execution. The Great Old Ones take notice.',
      'Perfect. The Order advances significantly.',
      'Exemplary work. This will be remembered.',
    ],
    A: [
      'Excellent work. The Order prospers.',
      'Well executed. The darkness spreads.',
      'Success beyond expectations.',
    ],
    B: [
      'Satisfactory. The mission objectives were met.',
      'Good work. The Order benefits.',
      'Solid execution.',
    ],
    C: [
      'Adequate. The minimum was achieved.',
      'Acceptable, but there is room for improvement.',
      'The mission succeeded, barely.',
    ],
    D: [
      'Poor execution. Success came at great cost.',
      'The mission succeeded, but performance was lacking.',
      'Barely acceptable.',
    ],
    F: [
      'Complete failure.',
      'Unacceptable.',
    ],
  };

  const options = feedbackByGrade[grade];
  return selectRandom(options);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function selectRandom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function weightedRandom<T extends string>(weights: Record<T, number>): T {
  const keys = Object.keys(weights) as T[];
  const values = keys.map(k => weights[k]);
  const index = weightedRandomIndex(values);
  return keys[index];
}

function weightedRandomIndex(weights: number[]): number {
  const total = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * total;

  for (let i = 0; i < weights.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return i;
    }
  }

  return weights.length - 1;
}

function generateInstitutionName(): string {
  const types = ['University', 'Corporation', 'Government Agency', 'Media Outlet', 'Research Institute'];
  return selectRandom(types);
}

// ============================================================================
// HUMAN COUNTER-OPS
// ============================================================================

export interface CounterOperation {
  id: string;
  type: 'raid' | 'investigation' | 'counter_ritual' | 'exposure';
  title: string;
  description: string;
  targetRegionId: string;
  targetSiteId?: string;

  /** Threat level (1-10) */
  threatLevel: number;

  /** Turns until execution */
  turnsUntilExecution: number;

  /** Can this be countered? */
  counterable: boolean;

  /** Potential damage */
  potentialDamage: {
    cultistLosses?: number;
    siteDestruction?: boolean;
    veilDamage?: number;
    elderOneDisruption?: boolean;
  };
}

/**
 * Generate human counter-operations based on investigation heat
 */
export function generateCounterOps(state: GreatOldOnesState): CounterOperation[] {
  const counterOps: CounterOperation[] = [];

  state.regions.forEach(region => {
    // Higher investigation heat = more counter-ops
    if (region.investigationHeat > 50 && Math.random() < 0.3) {
      const counterOp = generateCounterOp(region, state);
      if (counterOp) {
        counterOps.push(counterOp);
      }
    }
  });

  return counterOps;
}

function generateCounterOp(
  region: RegionalState,
  state: GreatOldOnesState
): CounterOperation | null {
  const types: Array<CounterOperation['type']> = ['raid', 'investigation', 'counter_ritual', 'exposure'];
  const type = selectRandom(types);

  const threatLevel = Math.min(10, Math.floor(region.investigationHeat / 10));

  let counterOp: CounterOperation;

  switch (type) {
    case 'raid':
      const targetSite = selectRandom(region.ritualSites);
      if (!targetSite) return null;

      counterOp = {
        id: `counter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'raid',
        title: 'Impending Raid',
        description: `Investigators are planning a raid on ${targetSite.name}`,
        targetRegionId: region.regionId,
        targetSiteId: targetSite.id,
        threatLevel,
        turnsUntilExecution: randomInRange(2, 4),
        counterable: true,
        potentialDamage: {
          cultistLosses: threatLevel * 2,
          siteDestruction: threatLevel > 7,
          veilDamage: threatLevel * 3,
        },
      };
      break;

    case 'investigation':
      counterOp = {
        id: `counter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'investigation',
        title: 'Intensive Investigation',
        description: `A task force is investigating cult activity in ${region.regionName}`,
        targetRegionId: region.regionId,
        threatLevel,
        turnsUntilExecution: randomInRange(3, 6),
        counterable: true,
        potentialDamage: {
          veilDamage: threatLevel * 5,
        },
      };
      break;

    case 'counter_ritual':
      counterOp = {
        id: `counter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'counter_ritual',
        title: 'Counter-Ritual Operation',
        description: `Occult researchers are preparing a banishment ritual`,
        targetRegionId: region.regionId,
        threatLevel,
        turnsUntilExecution: randomInRange(4, 8),
        counterable: true,
        potentialDamage: {
          elderOneDisruption: true,
          veilDamage: -10, // Actually helps veil
        },
      };
      break;

    case 'exposure':
      counterOp = {
        id: `counter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'exposure',
        title: 'Media Exposure Threat',
        description: `Journalists are preparing to expose cult activities`,
        targetRegionId: region.regionId,
        threatLevel,
        turnsUntilExecution: randomInRange(2, 5),
        counterable: true,
        potentialDamage: {
          veilDamage: threatLevel * 8,
          cultistLosses: threatLevel,
        },
      };
      break;
  }

  return counterOp;
}
