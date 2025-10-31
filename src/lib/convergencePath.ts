/**
 * Path of Convergence - Weeks 6-7 Implementation
 * Enlightenment Engine, True Intentions Meter, Cultural Transformation, Voluntary Sacrifice
 */

import {
  GreatOldOnesState,
  RegionalState,
  Doctrine,
} from '../types/greatOldOnes';

// ============================================================================
// ENLIGHTENMENT ENGINE - Voluntary Transcendence Programs
// ============================================================================

export interface EnlightenmentProgram {
  id: string;
  name: string;
  description: string;
  regionId: string;

  /** Program type */
  type: 'mystery_school' | 'psychic_training' | 'meditation_center' | 'consciousness_research' | 'hybrid_evolution';

  /** How many people enrolled */
  enrollmentCount: number;

  /** Voluntary conversion rate */
  conversionRate: number;  // 0-100

  /** What level of truth are they told? */
  truthLevel: number;  // 0-100, 0 = pure lies, 100 = full cosmic truth

  /** Program reputation */
  reputation: number;  // 0-100, affects enrollment

  /** Curriculum stages */
  stages: CurriculumStage[];
  currentStage: number;
}

export interface CurriculumStage {
  stageNumber: number;
  name: string;
  description: string;

  /** What do students learn? */
  teachings: string[];

  /** How dangerous is this knowledge? */
  sanityRisk: number;  // 0-100

  /** Benefits for completing stage */
  benefits: StageCompletionBenefit[];

  /** Dropout rate if pushed too fast */
  dropoutRisk: number;
}

export interface StageCompletionBenefit {
  type: 'psychic_awakening' | 'reality_perception' | 'entity_communication' | 'voluntary_sacrifice' | 'hybrid_transition';
  description: string;
  value: number;
}

/**
 * Creates a new enlightenment program
 */
export function createEnlightenmentProgram(
  programType: EnlightenmentProgram['type'],
  regionId: string,
  truthLevel: number,
  initialInvestment: number,
  state: GreatOldOnesState
): {
  success: boolean;
  program?: EnlightenmentProgram;
  message: string;
} {
  // Base success chance
  let successChance = 60;

  // Investment helps with legitimacy
  successChance += Math.min(30, initialInvestment / 50);

  // Doctrine bonus
  if (state.doctrine === 'convergence') {
    successChance += 20;
  }

  // Regional corruption helps (less scrutiny)
  const region = state.regions.find(r => r.regionId === regionId);
  if (region) {
    successChance += region.corruption / 5;
  }

  const roll = Math.random() * 100;

  if (roll > successChance) {
    return {
      success: false,
      message: 'Failed to establish enlightenment program. Authorities suspicious.',
    };
  }

  const program: EnlightenmentProgram = {
    id: `enlightenment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: generateProgramName(programType),
    description: generateProgramDescription(programType),
    regionId,
    type: programType,
    enrollmentCount: Math.floor(50 + Math.random() * 100),
    conversionRate: 20 + (truthLevel / 5),
    truthLevel,
    reputation: 60 + Math.random() * 20,
    stages: generateCurriculum(programType, truthLevel),
    currentStage: 0,
  };

  return {
    success: true,
    program,
    message: `${program.name} established! Initial enrollment: ${program.enrollmentCount} seekers.`,
  };
}

/**
 * Generates curriculum based on program type and truth level
 */
function generateCurriculum(
  type: EnlightenmentProgram['type'],
  truthLevel: number
): CurriculumStage[] {
  const baseStages = {
    mystery_school: [
      {
        stageNumber: 1,
        name: 'Initiate',
        description: 'Basic meditation and ancient wisdom',
        teachings: ['Meditation techniques', 'Ancient symbolism', 'Dream journaling'],
        sanityRisk: 5,
        benefits: [{ type: 'psychic_awakening' as const, description: 'Minor psychic sensitivity', value: 10 }],
        dropoutRisk: 10,
      },
      {
        stageNumber: 2,
        name: 'Adept',
        description: 'Deep meditation and cosmic philosophy',
        teachings: ['Cosmic consciousness', 'Reality as illusion', 'Communication with higher beings'],
        sanityRisk: 20,
        benefits: [{ type: 'reality_perception' as const, description: 'See beyond the veil', value: 25 }],
        dropoutRisk: 25,
      },
      {
        stageNumber: 3,
        name: 'Master',
        description: 'Direct contact with cosmic entities',
        teachings: ['True names of entities', 'Ritual participation', 'Sacrifice as transcendence'],
        sanityRisk: truthLevel > 70 ? 60 : 40,
        benefits: [{ type: 'voluntary_sacrifice' as const, description: 'Willing to sacrifice for truth', value: 50 }],
        dropoutRisk: truthLevel > 70 ? 10 : 40,
      },
    ],

    psychic_training: [
      {
        stageNumber: 1,
        name: 'Awakening',
        description: 'Unlocking latent psychic abilities',
        teachings: ['Telepathy exercises', 'Remote viewing', 'Psychometry basics'],
        sanityRisk: 15,
        benefits: [{ type: 'psychic_awakening' as const, description: 'Basic psychic powers', value: 20 }],
        dropoutRisk: 20,
      },
      {
        stageNumber: 2,
        name: 'Expansion',
        description: 'Expanding consciousness beyond human limits',
        teachings: ['Connect with cosmic minds', 'Astral projection', 'Entity channeling'],
        sanityRisk: 35,
        benefits: [{ type: 'entity_communication' as const, description: 'Channel eldritch beings', value: 40 }],
        dropoutRisk: 30,
      },
      {
        stageNumber: 3,
        name: 'Transcendence',
        description: 'Merge consciousness with the cosmic whole',
        teachings: ['Ego death', 'Permanent connection', 'Becoming more than human'],
        sanityRisk: 70,
        benefits: [{ type: 'hybrid_transition' as const, description: 'Begin transformation', value: 80 }],
        dropoutRisk: truthLevel > 60 ? 15 : 50,
      },
    ],

    meditation_center: [
      {
        stageNumber: 1,
        name: 'Foundation',
        description: 'Stress relief and basic mindfulness',
        teachings: ['Breathing techniques', 'Mindfulness', 'Positive thinking'],
        sanityRisk: 0,
        benefits: [{ type: 'psychic_awakening' as const, description: 'Calm mind receptive to influence', value: 5 }],
        dropoutRisk: 5,
      },
      {
        stageNumber: 2,
        name: 'Deepening',
        description: 'Advanced meditation and visualization',
        teachings: ['Guided cosmic journeys', 'Meeting your higher self', 'Universal consciousness'],
        sanityRisk: 10,
        benefits: [{ type: 'reality_perception' as const, description: 'Question consensus reality', value: 15 }],
        dropoutRisk: 15,
      },
      {
        stageNumber: 3,
        name: 'Integration',
        description: 'Becoming one with the cosmos',
        teachings: ['We are all connected', 'Service to the greater whole', 'Voluntary giving'],
        sanityRisk: 25,
        benefits: [{ type: 'voluntary_sacrifice' as const, description: 'Willing to give everything', value: 30 }],
        dropoutRisk: 20,
      },
    ],

    consciousness_research: [
      {
        stageNumber: 1,
        name: 'Hypothesis',
        description: 'Scientific study of consciousness',
        teachings: ['Consciousness studies', 'Quantum mind theories', 'Non-local awareness'],
        sanityRisk: 10,
        benefits: [{ type: 'reality_perception' as const, description: 'Scientific questioning of reality', value: 20 }],
        dropoutRisk: 15,
      },
      {
        stageNumber: 2,
        name: 'Experimentation',
        description: 'Direct experiments with consciousness',
        teachings: ['Psychedelic research', 'Sensory deprivation', 'Contact experiments'],
        sanityRisk: 30,
        benefits: [{ type: 'entity_communication' as const, description: 'Documented entity contact', value: 35 }],
        dropoutRisk: 25,
      },
      {
        stageNumber: 3,
        name: 'Conclusion',
        description: 'Revolutionary findings about reality',
        teachings: ['Consciousness is fundamental', 'Material reality is illusion', 'Entities are real'],
        sanityRisk: 50,
        benefits: [{ type: 'voluntary_sacrifice' as const, description: 'Sacrifice for science', value: 45 }],
        dropoutRisk: truthLevel > 80 ? 10 : 35,
      },
    ],

    hybrid_evolution: [
      {
        stageNumber: 1,
        name: 'Assessment',
        description: 'Evaluation for hybrid potential',
        teachings: ['Genetic compatibility', 'Psychic baseline', 'Willingness testing'],
        sanityRisk: 20,
        benefits: [{ type: 'psychic_awakening' as const, description: 'Prepare mind for change', value: 25 }],
        dropoutRisk: 30,
      },
      {
        stageNumber: 2,
        name: 'Preparation',
        description: 'Mental and physical preparation for transformation',
        teachings: ['Accepting the non-human', 'Physical alterations', 'Embracing change'],
        sanityRisk: 50,
        benefits: [{ type: 'hybrid_transition' as const, description: 'Minor physical changes begin', value: 50 }],
        dropoutRisk: 40,
      },
      {
        stageNumber: 3,
        name: 'Metamorphosis',
        description: 'Full transformation into human-eldritch hybrid',
        teachings: ['Surrender humanity', 'Welcome new form', 'Serve the Old Ones'],
        sanityRisk: 90,
        benefits: [{ type: 'hybrid_transition' as const, description: 'Complete transformation', value: 100 }],
        dropoutRisk: truthLevel > 90 ? 5 : 60,
      },
    ],
  };

  return baseStages[type];
}

/**
 * Progress students through enlightenment program
 */
export function progressEnlightenment(
  program: EnlightenmentProgram,
  pushHard: boolean,  // Risk higher dropout for faster progress
  state: GreatOldOnesState
): {
  conversions: number;
  dropouts: number;
  sanityFragmentsGained: number;
  hybridsCreated: number;
  psychicsAwakened: number;
  message: string;
  warnings: string[];
} {
  const stage = program.stages[program.currentStage];
  const warnings: string[] = [];

  // Calculate dropout rate
  let dropoutRate = stage.dropoutRisk;
  if (pushHard) dropoutRate *= 1.5;
  if (program.truthLevel > 80) dropoutRate *= 0.7;  // High truth = fewer dropouts from those who stay
  if (program.reputation < 40) dropoutRate *= 1.3;

  const dropouts = Math.floor(program.enrollmentCount * (dropoutRate / 100));

  // Calculate conversions (people who complete stage and join Order)
  let conversionRate = program.conversionRate;
  if (pushHard) conversionRate *= 1.2;
  const conversions = Math.floor(program.enrollmentCount * (conversionRate / 100));

  // Calculate benefits
  let hybridsCreated = 0;
  let psychicsAwakened = 0;
  let sanityFragmentsGained = 0;

  for (const benefit of stage.benefits) {
    switch (benefit.type) {
      case 'hybrid_transition':
        hybridsCreated = Math.floor(conversions * 0.1);
        break;
      case 'psychic_awakening':
        psychicsAwakened = Math.floor(conversions * 0.3);
        break;
      case 'voluntary_sacrifice':
        sanityFragmentsGained = conversions * 5;
        break;
    }
  }

  // Sanity risk can cause issues
  if (stage.sanityRisk > 40 && Math.random() * 100 < stage.sanityRisk) {
    warnings.push(`Some students suffered psychotic breaks! Reputation at risk.`);
    program.reputation -= 10;
  }

  // Very high truth level with low-stage students can cause exposure
  if (program.truthLevel > 70 && program.currentStage < 2) {
    warnings.push(`Revealing too much too soon! Some students flee and talk to authorities.`);
  }

  return {
    conversions,
    dropouts,
    sanityFragmentsGained,
    hybridsCreated,
    psychicsAwakened,
    message: `Stage ${stage.stageNumber} "${stage.name}" progresses. ${conversions} conversions, ${dropouts} dropouts.`,
    warnings,
  };
}

// ============================================================================
// TRUE INTENTIONS METER - Deception vs. Honesty Tracking
// ============================================================================

export interface TrueIntentionsMeter {
  /** What you promise vs. what you deliver */
  deceptionLevel: number;  // 0-100, 0 = completely honest, 100 = total lies

  /** Historical promises */
  promises: Promise[];

  /** Tracked betrayals */
  betrayals: Betrayal[];

  /** Can still achieve redemption? */
  redemptionAvailable: boolean;

  /** Current moral trajectory */
  moralityScore: number;  // -100 (evil) to +100 (genuine enlightenment)

  /** Converts' trust level */
  publicTrust: number;  // 0-100
}

export interface Promise {
  id: string;
  turn: number;
  promiseText: string;
  promisedTo: 'individual' | 'group' | 'region' | 'humanity';
  category: 'transcendence' | 'protection' | 'knowledge' | 'power' | 'safety';

  kept: boolean | null;  // null = not yet resolved
  impact: number;  // How important was this promise?
}

export interface Betrayal {
  id: string;
  turn: number;
  betrayalType: 'false_transcendence' | 'unwilling_sacrifice' | 'hidden_enslavement' | 'deception_exposed' | 'broken_promise';
  description: string;
  severity: number;  // 1-10
  consequences: BetrayalConsequence[];
}

export interface BetrayalConsequence {
  type: 'mass_suicide' | 'violent_rejection' | 'investigator_surge' | 'convert_loss' | 'reputation_collapse' | 'redemption_locked';
  value: number;
  description: string;
}

/**
 * Makes a promise to converts/humanity
 */
export function makePromise(
  meter: TrueIntentionsMeter,
  promiseText: string,
  category: Promise['category'],
  promisedTo: Promise['promisedTo'],
  currentTurn: number
): Promise {
  const promise: Promise = {
    id: `promise_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    turn: currentTurn,
    promiseText,
    promisedTo,
    category,
    kept: null,
    impact: promisedTo === 'humanity' ? 10 : promisedTo === 'region' ? 5 : 1,
  };

  meter.promises.push(promise);
  return promise;
}

/**
 * Resolves a promise (kept or broken)
 */
export function resolvePromise(
  meter: TrueIntentionsMeter,
  promiseId: string,
  kept: boolean,
  actualOutcome: string
): {
  trustChange: number;
  moralityChange: number;
  betrayalTriggered: boolean;
  message: string;
} {
  const promise = meter.promises.find(p => p.id === promiseId);
  if (!promise) {
    return {
      trustChange: 0,
      moralityChange: 0,
      betrayalTriggered: false,
      message: 'Promise not found.',
    };
  }

  promise.kept = kept;

  if (kept) {
    // Keeping promises builds trust and morality
    const trustGain = promise.impact * 2;
    const moralityGain = promise.impact * 3;

    meter.publicTrust = Math.min(100, meter.publicTrust + trustGain);
    meter.moralityScore = Math.min(100, meter.moralityScore + moralityGain);

    return {
      trustChange: trustGain,
      moralityChange: moralityGain,
      betrayalTriggered: false,
      message: `Promise kept: "${promise.promiseText}". Trust increased. ${actualOutcome}`,
    };
  } else {
    // Breaking promises damages trust and triggers potential betrayal
    const trustLoss = promise.impact * 5;
    const moralityLoss = promise.impact * 4;

    meter.publicTrust = Math.max(0, meter.publicTrust - trustLoss);
    meter.moralityScore = Math.max(-100, meter.moralityScore - moralityLoss);
    meter.deceptionLevel = Math.min(100, meter.deceptionLevel + promise.impact * 2);

    // High-impact broken promises trigger betrayals
    const betrayalTriggered = promise.impact >= 5;

    return {
      trustChange: -trustLoss,
      moralityChange: -moralityLoss,
      betrayalTriggered,
      message: `Promise BROKEN: "${promise.promiseText}". ${betrayalTriggered ? 'BETRAYAL DETECTED!' : 'Trust damaged.'}`,
    };
  }
}

/**
 * Exposes deception to converts
 */
export function exposeDeception(
  meter: TrueIntentionsMeter,
  betrayalType: Betrayal['betrayalType'],
  description: string,
  severity: number,
  currentTurn: number,
  state: GreatOldOnesState
): {
  betrayal: Betrayal;
  canRecover: boolean;
  message: string;
} {
  const consequences: BetrayalConsequence[] = [];

  // Calculate consequences based on severity and current trust
  const trustModifier = (100 - meter.publicTrust) / 100;

  switch (betrayalType) {
    case 'false_transcendence':
      consequences.push({
        type: 'mass_suicide',
        value: severity * 10 * trustModifier,
        description: 'Desperate converts take their own lives',
      });
      consequences.push({
        type: 'convert_loss',
        value: severity * 20,
        description: 'Converts abandon the Order en masse',
      });
      break;

    case 'unwilling_sacrifice':
      consequences.push({
        type: 'violent_rejection',
        value: severity * 15 * trustModifier,
        description: 'Converts turn violent against the Order',
      });
      consequences.push({
        type: 'investigator_surge',
        value: severity * 10,
        description: 'Authorities mobilize in response to outcry',
      });
      break;

    case 'hidden_enslavement':
      consequences.push({
        type: 'reputation_collapse',
        value: severity * 25,
        description: 'All recruitment efforts cease',
      });
      consequences.push({
        type: 'investigator_surge',
        value: severity * 20,
        description: 'International investigation launched',
      });
      break;

    case 'deception_exposed':
      consequences.push({
        type: 'convert_loss',
        value: severity * 15,
        description: 'Truth spreads, converts flee',
      });
      consequences.push({
        type: 'investigator_surge',
        value: severity * 5,
        description: 'Media coverage intensifies scrutiny',
      });
      break;

    case 'broken_promise':
      consequences.push({
        type: 'convert_loss',
        value: severity * 10,
        description: 'Faith in Order shattered',
      });
      break;
  }

  // Severe betrayals (8+) lock redemption
  if (severity >= 8) {
    consequences.push({
      type: 'redemption_locked',
      value: 1,
      description: 'Too late for redemption. Path locked to domination.',
    });
    meter.redemptionAvailable = false;
  }

  const betrayal: Betrayal = {
    id: `betrayal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    turn: currentTurn,
    betrayalType,
    description,
    severity,
    consequences,
  };

  meter.betrayals.push(betrayal);

  // Massive morality loss
  meter.moralityScore = Math.max(-100, meter.moralityScore - (severity * 10));
  meter.publicTrust = Math.max(0, meter.publicTrust - (severity * 8));

  const canRecover = meter.redemptionAvailable && meter.moralityScore > -50;

  return {
    betrayal,
    canRecover,
    message: `DECEPTION EXPOSED: ${description}. Severity: ${severity}/10. ${canRecover ? 'Redemption still possible...' : 'Point of no return passed.'}`,
  };
}

/**
 * Attempts redemption arc
 */
export function attemptRedemption(
  meter: TrueIntentionsMeter,
  action: 'truth_revelation' | 'protect_converts' | 'genuine_enlightenment' | 'reject_entities' | 'self_sacrifice',
  resourceCost: number,
  state: GreatOldOnesState
): {
  success: boolean;
  moralityChange: number;
  newVictoryPath?: string;
  message: string;
} {
  if (!meter.redemptionAvailable) {
    return {
      success: false,
      moralityChange: 0,
      message: 'Redemption is no longer possible. You have gone too far.',
    };
  }

  // Redemption difficulty based on how evil you've become
  const redemptionDifficulty = Math.abs(meter.moralityScore) + meter.deceptionLevel;

  let successChance = 60 - redemptionDifficulty / 5;
  successChance += Math.min(30, resourceCost / 50);

  const actionBonuses = {
    truth_revelation: 20,
    protect_converts: 15,
    genuine_enlightenment: 25,
    reject_entities: 30,
    self_sacrifice: 40,
  };

  successChance += actionBonuses[action];

  const roll = Math.random() * 100;

  if (roll > successChance) {
    return {
      success: false,
      moralityChange: 5,
      message: `Redemption attempt fails. ${action} rejected by converts.`,
    };
  }

  // Success!
  const moralityGain = actionBonuses[action] * 2;
  meter.moralityScore = Math.min(100, meter.moralityScore + moralityGain);

  let newVictoryPath: string | undefined;

  if (meter.moralityScore > 50) {
    newVictoryPath = 'true_convergence';
  }

  return {
    success: true,
    moralityChange: moralityGain,
    newVictoryPath,
    message: `Redemption successful through ${action}! Morality +${moralityGain}. ${newVictoryPath ? 'New victory path unlocked: True Convergence' : 'Continue on path to redemption.'}`,
  };
}

// ============================================================================
// CULTURAL TRANSFORMATION
// ============================================================================

export interface CulturalMovement {
  id: string;
  name: string;
  type: 'religion' | 'philosophy' | 'art' | 'science' | 'education';
  regionId: string;

  /** How widespread? */
  reach: number;  // 0-100

  /** Core tenets */
  tenets: string[];

  /** How eldritch is it? */
  eldritchInfluence: number;  // 0-100

  /** How acceptable to mainstream? */
  legitimacy: number;  // 0-100

  /** Effects on region */
  effects: CulturalEffect[];
}

export interface CulturalEffect {
  type: 'sanity_normalization' | 'corruption_acceleration' | 'recruitment_boost' | 'veil_protection' | 'investigator_reduction';
  value: number;
  description: string;
}

/**
 * Creates a new cultural movement blending eldritch with traditional
 */
export function createCulturalMovement(
  movementType: CulturalMovement['type'],
  regionId: string,
  eldritchInfluence: number,
  coverAsMainstream: boolean,
  state: GreatOldOnesState
): {
  success: boolean;
  movement?: CulturalMovement;
  message: string;
} {
  let successChance = 50;

  // Doctrine bonus
  if (state.doctrine === 'convergence') {
    successChance += 25;
  }

  // Regional corruption helps
  const region = state.regions.find(r => r.regionId === regionId);
  if (region) {
    successChance += region.corruption / 4;
  }

  // Covering as mainstream helps legitimacy but limits eldritch content
  if (coverAsMainstream) {
    successChance += 20;
  }

  const roll = Math.random() * 100;

  if (roll > successChance) {
    return {
      success: false,
      message: 'Cultural movement fails to gain traction.',
    };
  }

  const movement: CulturalMovement = {
    id: `culture_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: generateMovementName(movementType),
    type: movementType,
    regionId,
    reach: 10 + Math.random() * 20,
    tenets: generateMovementTenets(movementType, eldritchInfluence),
    eldritchInfluence: coverAsMainstream ? Math.min(40, eldritchInfluence) : eldritchInfluence,
    legitimacy: coverAsMainstream ? 70 + Math.random() * 20 : 40 + Math.random() * 30,
    effects: generateCulturalEffects(movementType, eldritchInfluence),
  };

  return {
    success: true,
    movement,
    message: `${movement.name} founded! A new ${movementType} movement spreads through ${regionId}.`,
  };
}

/**
 * Spreads cultural movement through region
 */
export function spreadCulturalMovement(
  movement: CulturalMovement,
  amplificationNodes: any[],  // Media/academia influence nodes
  state: GreatOldOnesState
): {
  reachGain: number;
  conversions: number;
  backlash: boolean;
  message: string;
} {
  // Growth rate based on legitimacy
  let growthRate = movement.legitimacy / 10;

  // Amplification from nodes
  const mediaBoost = amplificationNodes
    .filter((n: any) => n.institutionType === 'media')
    .reduce((sum: number, n: any) => sum + n.corruptionLevel / 20, 0);

  growthRate += mediaBoost;

  // Eldritch influence can cause backlash
  const backlashChance = movement.eldritchInfluence - movement.legitimacy;
  const backlash = Math.random() * 100 < backlashChance;

  if (backlash) {
    growthRate *= 0.5;
  }

  const reachGain = Math.min(100 - movement.reach, growthRate);
  const conversions = Math.floor(reachGain * 50);

  return {
    reachGain,
    conversions,
    backlash,
    message: `${movement.name} spreads (+${reachGain.toFixed(1)}% reach). ${conversions} new converts. ${backlash ? 'Traditional groups push back!' : ''}`,
  };
}

// ============================================================================
// VOLUNTARY SACRIFICE ECONOMY
// ============================================================================

export interface SacrificeEconomy {
  /** Willing volunteers available */
  volunteerPool: number;

  /** Martyr cults (people racing to be consumed) */
  martyrCults: MartyrCult[];

  /** Pilgrimage sites */
  pilgrimageSites: PilgrimageSite[];

  /** Celebrity endorsements */
  celebrities: CelebrityEndorser[];

  /** Ritual tourism operations */
  ritualTourism: RitualTourismOperation[];
}

export interface MartyrCult {
  id: string;
  name: string;
  regionId: string;
  memberCount: number;

  /** Fanaticism level */
  fanaticism: number;  // 0-100

  /** Are they competing with other martyr cults? */
  competitive: boolean;
}

export interface PilgrimageSite {
  id: string;
  ritualSiteId: string;
  name: string;

  /** Pilgrims per turn */
  pilgrimsPerTurn: number;

  /** % who volunteer for sacrifice */
  volunteerRate: number;

  /** Tourist cover operation */
  touristCover: boolean;
}

export interface CelebrityEndorser {
  id: string;
  name: string;
  fame: number;  // 0-100

  /** What they're endorsing */
  endorsement: 'enlightenment_programs' | 'pilgrimage' | 'transcendence' | 'sacrifice';

  /** How many followers do they bring? */
  influence: number;
}

export interface RitualTourismOperation {
  id: string;
  name: string;
  regionId: string;

  /** Cover as wellness retreat / spiritual journey */
  cover: string;

  /** Tourists per turn */
  tourists: number;

  /** Conversion rate */
  conversionRate: number;

  /** How much do they pay? (covers operation costs) */
  revenue: number;
}

/**
 * Recruits voluntary sacrifices (higher yield than unwilling)
 */
export function recruitVoluntarySacrifices(
  targetCount: number,
  method: 'pilgrimage' | 'martyr_cult' | 'enlightenment_graduate' | 'celebrity_influence',
  economy: SacrificeEconomy,
  state: GreatOldOnesState
): {
  volunteersGained: number;
  powerYield: number;
  qualityBonus: number;
  message: string;
} {
  let successRate = 0.5;

  // Doctrine bonus
  if (state.doctrine === 'convergence') {
    successRate = 0.8;
  }

  // Method effectiveness
  const methodBonus = {
    pilgrimage: 0.6,
    martyr_cult: 0.9,
    enlightenment_graduate: 0.7,
    celebrity_influence: 0.5,
  };

  successRate *= methodBonus[method];

  const volunteersGained = Math.floor(targetCount * successRate);

  // Willing sacrifices yield MORE power
  const qualityBonus = 2.0;  // 2x power from willing vs. unwilling
  const powerYield = volunteersGained * 10 * qualityBonus;

  return {
    volunteersGained,
    powerYield,
    qualityBonus,
    message: `${volunteersGained} willing sacrifices obtained via ${method}. Power yield: ${powerYield} (${qualityBonus}x quality bonus)`,
  };
}

/**
 * Celebrity endorsement campaign
 */
export function launchCelebrityEndorsement(
  celebrityFame: number,
  endorsementType: CelebrityEndorser['endorsement'],
  region: RegionalState,
  state: GreatOldOnesState
): {
  success: boolean;
  celebrity?: CelebrityEndorser;
  followersGained: number;
  message: string;
} {
  let successChance = 40 + celebrityFame / 2;

  // Corruption helps
  successChance += region.corruption / 5;

  const roll = Math.random() * 100;

  if (roll > successChance) {
    return {
      success: false,
      followersGained: 0,
      message: 'Celebrity endorsement attempt fails. Target resists.',
    };
  }

  const celebrity: CelebrityEndorser = {
    id: `celeb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: generateCelebrityName(),
    fame: celebrityFame,
    endorsement: endorsementType,
    influence: Math.floor(celebrityFame * 100),
  };

  return {
    success: true,
    celebrity,
    followersGained: celebrity.influence,
    message: `${celebrity.name} endorses ${endorsementType}! ${celebrity.influence} followers join immediately.`,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateProgramName(type: EnlightenmentProgram['type']): string {
  const names = {
    mystery_school: ['The Esoteric Academy', 'Ancient Wisdom Institute', 'School of Hidden Knowledge'],
    psychic_training: ['Psychic Development Center', 'Mind Expansion Institute', 'Consciousness Academy'],
    meditation_center: ['Tranquility Meditation Center', 'Inner Peace Foundation', 'Mindfulness Sanctuary'],
    consciousness_research: ['Consciousness Research Institute', 'Institute of Advanced Mind Studies', 'Reality Research Center'],
    hybrid_evolution: ['Human Evolution Project', 'Next Stage Initiative', 'Transcendence Program'],
  };

  const options = names[type];
  return options[Math.floor(Math.random() * options.length)];
}

function generateProgramDescription(type: EnlightenmentProgram['type']): string {
  const descriptions = {
    mystery_school: 'An exclusive school teaching ancient esoteric wisdom',
    psychic_training: 'Scientific training to unlock latent psychic abilities',
    meditation_center: 'A peaceful center for meditation and spiritual growth',
    consciousness_research: 'Cutting-edge research into the nature of consciousness',
    hybrid_evolution: 'A program to help humanity transcend biological limitations',
  };

  return descriptions[type];
}

function generateMovementName(type: CulturalMovement['type']): string {
  const names = {
    religion: ['The Church of Cosmic Truth', 'Universal Consciousness Faith', 'The Awakened'],
    philosophy: ['Neo-Cosmicism', 'Transcendental Realism', 'The New Philosophy'],
    art: ['The Impossible Art Movement', 'Non-Euclidean Renaissance', 'Cosmic Horror Aesthetic'],
    science: ['New Paradigm Science', 'Consciousness-First Physics', 'Reality Studies'],
    education: ['Expanded Curriculum Initiative', 'Consciousness Education', 'New Learning Framework'],
  };

  const options = names[type];
  return options[Math.floor(Math.random() * options.length)];
}

function generateMovementTenets(type: CulturalMovement['type'], eldritchLevel: number): string[] {
  const baseTenets = {
    religion: ['All consciousness is connected', 'We are part of something greater', 'Death is transformation'],
    philosophy: ['Reason has limits', 'Reality is malleable', 'Cosmic perspective liberates'],
    art: ['Beauty in the impossible', 'Express the ineffable', 'Art opens minds'],
    science: ['Consciousness is fundamental', 'New physics paradigm', 'Empirical study of entities'],
    education: ['Teach cosmic truth', 'Expand young minds', 'Question everything'],
  };

  const eldritchTenets = {
    religion: ['The Old Ones are gods', 'Sacrifice brings enlightenment', 'Humanity must evolve'],
    philosophy: ['Humanity is insignificant', 'Embrace cosmic horror', 'Madness is wisdom'],
    art: ['Channel eldritch visions', 'Depict the Old Ones', 'Art as ritual'],
    science: ['Entities are real', 'Reality is illusion', 'Physics bends to will'],
    education: ['Teach the true names', 'Train ritual practitioners', 'Indoctrinate youth'],
  };

  const tenets = [...baseTenets[type]];

  if (eldritchLevel > 50) {
    tenets.push(...eldritchTenets[type]);
  }

  return tenets;
}

function generateCulturalEffects(type: CulturalMovement['type'], eldritchLevel: number): CulturalEffect[] {
  const effects: CulturalEffect[] = [];

  // All movements provide some benefits
  effects.push({
    type: 'recruitment_boost',
    value: 10 + eldritchLevel / 10,
    description: `+${(10 + eldritchLevel / 10).toFixed(1)}% recruitment rate`,
  });

  // Type-specific effects
  if (type === 'religion') {
    effects.push({
      type: 'sanity_normalization',
      value: eldritchLevel / 5,
      description: 'Madness becomes acceptable',
    });
  } else if (type === 'education') {
    effects.push({
      type: 'corruption_acceleration',
      value: eldritchLevel / 3,
      description: 'Youth corruption accelerated',
    });
  } else if (type === 'art') {
    effects.push({
      type: 'veil_protection',
      value: 10,
      description: 'Eldritch imagery normalized',
    });
  }

  return effects;
}

function generateCelebrityName(): string {
  const names = ['Dr. Aria Blackwood', 'Marcus Steele', 'Luna Rivera', 'Professor Chen Wei', 'Sage Morrison'];
  return names[Math.floor(Math.random() * names.length)];
}
