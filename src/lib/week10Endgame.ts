/**
 * Week 10-11: Endgame & Replayability
 * Victory conditions, campaign analytics, and New Game+ systems
 */

import { GreatOldOnesState, Doctrine } from '../types/greatOldOnes';
import {
  Phase3State,
  EnhancedVictoryCondition,
  CampaignAnalytics,
  LegacyPerk,
  CampaignGenerator,
  PlayerChoice,
  LoreEntry,
} from '../types/phase3Types';
import { Phase2State } from '../lib/phase2Integration';

// ============================================================================
// VICTORY CONDITION CHECKING
// ============================================================================

/**
 * Check all possible victory conditions
 */
export function checkVictoryConditions(
  state: GreatOldOnesState,
  phase2: Phase2State,
  phase3: Phase3State
): EnhancedVictoryCondition[] {
  const victories: EnhancedVictoryCondition[] = [];

  // Check each victory type
  const totalDomination = checkTotalDomination(state, phase2, phase3);
  if (totalDomination) victories.push(totalDomination);

  const shadowEmpire = checkShadowEmpire(state, phase2, phase3);
  if (shadowEmpire) victories.push(shadowEmpire);

  const transcendence = checkTranscendence(state, phase2, phase3);
  if (transcendence) victories.push(transcendence);

  const convergence = checkConvergence(state, phase2, phase3);
  if (convergence) victories.push(convergence);

  const banishment = checkBanishment(state, phase2, phase3);
  if (banishment) victories.push(banishment);

  const cosmicJoke = checkCosmicJoke(state, phase2, phase3);
  if (cosmicJoke) victories.push(cosmicJoke);

  return victories;
}

/**
 * Check Total Domination victory
 */
function checkTotalDomination(
  state: GreatOldOnesState,
  phase2: Phase2State,
  phase3: Phase3State
): EnhancedVictoryCondition | null {
  if (state.doctrine !== 'domination') return null;

  const entitiesAwakened = state.summonedEntities.filter(e => e.tier === 'great_old_one').length;
  const avgSanity = state.regions.reduce((sum, r) => sum + r.sanitySanity, 0) / state.regions.length;

  const conditions = {
    entitiesAwakened: entitiesAwakened >= 3,
    highCorruption: state.resources.corruptionIndex >= 80,
    lowSanity: avgSanity <= 20,
  };

  const allConditionsMet = Object.values(conditions).every(c => c);

  if (!allConditionsMet) return null;

  // Determine variant based on player choices
  const variant = determineVictoryVariant(
    'domination',
    phase3.endgame.campaignState.majorChoices
  );

  const score = calculateVictoryScore(state, phase2, phase3, 'total_domination');

  return {
    type: 'total_domination',
    name: 'Total Domination',
    description: 'The Great Old Ones walk the Earth. Humanity kneels or perishes.',
    variant,
    conditionsMet: conditions,
    score,
    endingNarrative: generateEndingNarrative('total_domination', variant, state, phase3),
    newGamePlusUnlocks: ['remembered_terror', 'cult_legacy', 'entity_favor_cthulhu'],
  };
}

/**
 * Check Shadow Empire victory
 */
function checkShadowEmpire(
  state: GreatOldOnesState,
  phase2: Phase2State,
  phase3: Phase3State
): EnhancedVictoryCondition | null {
  if (state.doctrine !== 'corruption') return null;

  const regionsControlled = state.regions.filter(r => r.corruption > 70).length;
  const avgSanity = state.regions.reduce((sum, r) => sum + r.sanitySanity, 0) / state.regions.length;

  const conditions = {
    highCorruption: state.resources.corruptionIndex >= 90,
    regionsControlled: regionsControlled >= 12,
    maintainedSanity: avgSanity >= 40, // People don't know they're controlled
  };

  const allConditionsMet = Object.values(conditions).every(c => c);

  if (!allConditionsMet) return null;

  const variant = determineVictoryVariant(
    'corruption',
    phase3.endgame.campaignState.majorChoices
  );

  const score = calculateVictoryScore(state, phase2, phase3, 'shadow_empire');

  return {
    type: 'shadow_empire',
    name: 'Shadow Empire',
    description: 'The world serves the Order unknowingly. Puppet masters rule in darkness.',
    variant,
    conditionsMet: conditions,
    score,
    endingNarrative: generateEndingNarrative('shadow_empire', variant, state, phase3),
    newGamePlusUnlocks: ['infiltration_mastery', 'sleeper_network', 'puppet_inheritance'],
  };
}

/**
 * Check Transcendence victory
 */
function checkTranscendence(
  state: GreatOldOnesState,
  phase2: Phase2State,
  phase3: Phase3State
): EnhancedVictoryCondition | null {
  if (state.doctrine !== 'convergence') return null;

  const conditions = {
    highConversion: phase2.convergence.voluntaryConversionRate >= 80,
    highCorruption: state.resources.corruptionIndex >= 70,
    hybridsCreated: phase2.convergence.hybridsCreated >= 100,
  };

  const allConditionsMet = Object.values(conditions).every(c => c);

  if (!allConditionsMet) return null;

  // Check if this was benevolent or forced
  const moralityScore = phase2.convergence.trueIntentionsMeter.moralityScore;
  const variant = moralityScore > 50 ? 'benevolent' : moralityScore < -50 ? 'brutal' : 'cunning';

  const score = calculateVictoryScore(state, phase2, phase3, 'transcendence');

  return {
    type: 'transcendence',
    name: moralityScore > 50 ? 'True Transcendence' : 'Forced Transcendence',
    description:
      moralityScore > 50
        ? 'Humanity voluntarily merges with cosmic entities. A new hybrid civilization emerges.'
        : 'Humanity has been transformed, willing or not. They are no longer entirely human.',
    variant,
    conditionsMet: conditions,
    score,
    endingNarrative: generateEndingNarrative('transcendence', variant, state, phase3),
    newGamePlusUnlocks: ['hybrid_start', 'cosmic_knowledge', 'enlightenment_legacy'],
  };
}

/**
 * Check Convergence victory
 */
function checkConvergence(
  state: GreatOldOnesState,
  phase2: Phase2State,
  phase3: Phase3State
): EnhancedVictoryCondition | null {
  if (state.doctrine !== 'convergence') return null;

  const regionsControlled = state.regions.filter(r => r.corruption > 50).length;
  const avgSanity = state.regions.reduce((sum, r) => sum + r.sanitySanity, 0) / state.regions.length;

  const conditions = {
    moderateConversion: phase2.convergence.voluntaryConversionRate >= 60,
    maintainedSanity: avgSanity >= 50,
    sufficientControl: regionsControlled >= 8,
  };

  const allConditionsMet = Object.values(conditions).every(c => c);

  if (!allConditionsMet) return null;

  const variant = 'benevolent';

  const score = calculateVictoryScore(state, phase2, phase3, 'convergence');

  return {
    type: 'convergence',
    name: 'Convergence',
    description:
      'Humanity and the Old Ones coexist. A new age of cosmic enlightenment begins.',
    variant,
    conditionsMet: conditions,
    score,
    endingNarrative: generateEndingNarrative('convergence', variant, state, phase3),
    newGamePlusUnlocks: ['coexistence_start', 'balanced_power', 'symbiotic_legacy'],
  };
}

/**
 * Check Banishment victory (loss)
 */
function checkBanishment(
  state: GreatOldOnesState,
  phase2: Phase2State,
  phase3: Phase3State
): EnhancedVictoryCondition | null {
  const avgSanity = state.regions.reduce((sum, r) => sum + r.sanitySanity, 0) / state.regions.length;

  const conditions = {
    lowCorruption: state.resources.corruptionIndex <= 10,
    highSanity: avgSanity >= 70,
    noEntities: state.summonedEntities.length === 0,
  };

  // This is a loss condition - if humanity pushes back successfully
  const mostConditionsMet = Object.values(conditions).filter(c => c).length >= 2;

  if (!mostConditionsMet) return null;

  const variant = 'tragic';

  const score = calculateVictoryScore(state, phase2, phase3, 'banishment');

  return {
    type: 'banishment',
    name: 'Banishment',
    description:
      'The Order has been defeated. The entities return to their slumber... for now.',
    variant,
    conditionsMet: conditions,
    score,
    endingNarrative: generateEndingNarrative('banishment', variant, state, phase3),
    newGamePlusUnlocks: ['lessons_learned', 'hidden_knowledge', 'cycle_continues'],
  };
}

/**
 * Check Cosmic Joke victory (secret ending)
 */
function checkCosmicJoke(
  state: GreatOldOnesState,
  phase2: Phase2State,
  phase3: Phase3State
): EnhancedVictoryCondition | null {
  // This requires specific narrative choices
  const truthRevealed = phase3.narrative.greatTruth.revelationLevel >= 100;
  const playerStanceHorrified = phase3.narrative.greatTruth.playerStance === 'horrified';
  const highEntities = state.summonedEntities.length >= 5;

  if (!truthRevealed || !playerStanceHorrified || !highEntities) return null;

  const conditions = {
    truthRevealed,
    playerHorrified: playerStanceHorrified,
    summonedEntities: highEntities,
  };

  const variant = 'tragic';

  const score = calculateVictoryScore(state, phase2, phase3, 'cosmic_joke');

  return {
    type: 'cosmic_joke',
    name: 'The Cosmic Joke',
    description:
      'You were never in control. You served a greater entity all along. Free will was the illusion.',
    variant,
    conditionsMet: conditions,
    score,
    endingNarrative: generateEndingNarrative('cosmic_joke', variant, state, phase3),
    newGamePlusUnlocks: ['true_sight', 'cosmic_awareness', 'eldritch_mastery'],
  };
}

// ============================================================================
// VICTORY SCORING AND NARRATIVES
// ============================================================================

/**
 * Determine victory variant based on player choices
 */
function determineVictoryVariant(
  doctrine: Doctrine,
  choices: PlayerChoice[]
): EnhancedVictoryCondition['variant'] {
  const avgMorality =
    choices.length > 0
      ? choices.reduce((sum, c) => sum + c.moralityChange, 0) / choices.length
      : 0;

  if (avgMorality > 5) return 'benevolent';
  if (avgMorality < -5) return 'brutal';

  // Check for specific patterns
  const cunningChoices = choices.filter(c =>
    c.context.includes('deception') || c.context.includes('manipulation')
  ).length;

  const tragicChoices = choices.filter(c =>
    c.context.includes('sacrifice') || c.context.includes('loss')
  ).length;

  if (cunningChoices > choices.length * 0.3) return 'cunning';
  if (tragicChoices > choices.length * 0.3) return 'tragic';

  return 'pyrrhic';
}

/**
 * Calculate victory score
 */
function calculateVictoryScore(
  state: GreatOldOnesState,
  phase2: Phase2State,
  phase3: Phase3State,
  victoryType: string
): number {
  let score = 1000; // Base score

  // Doctrine efficiency bonus
  score += phase2.doctrinePoints * 10;

  // Elder One favor bonus
  const totalFavor = Object.values(phase2.elderOneFavor).reduce((sum, f) => sum + f, 0);
  score += totalFavor;

  // Completion speed bonus (inverse of turn count)
  const turnCount = state.alignment.turn;
  const speedBonus = Math.max(0, 1000 - turnCount * 2);
  score += speedBonus;

  // Corruption efficiency
  score += state.resources.corruptionIndex * 5;

  // Veil management (different for different victories)
  if (victoryType === 'shadow_empire') {
    // Shadow empire rewards high veil
    score += state.veil.integrity * 3;
  } else if (victoryType === 'total_domination') {
    // Domination doesn't care about veil
    score += (100 - state.veil.integrity) * 2;
  }

  // Entity summoning bonus
  score += state.summonedEntities.length * 50;

  // Penalty for losses
  const schismPenalty = phase3.narrative.activeSchisms.reduce((sum, s) => sum + s.severity, 0);
  score -= schismPenalty * 2;

  // Resistance penalty
  const resistancePenalty = phase3.counterOccult.globalUnity.unityScore;
  score -= resistancePenalty * 5;

  return Math.max(0, Math.floor(score));
}

/**
 * Generate ending narrative
 */
function generateEndingNarrative(
  victoryType: string,
  variant: EnhancedVictoryCondition['variant'],
  state: GreatOldOnesState,
  phase3: Phase3State
): string {
  const narratives: Record<string, Record<string, string>> = {
    total_domination: {
      brutal:
        'The stars align. Cthulhu rises from R\'lyeh, and the world drowns in madness. You stand atop a mountain of corpses, master of a broken world. Was it worth it?',
      cunning:
        'Through careful planning, the Great Old Ones awaken. You manipulated every piece, every sacrifice. Now you rule beside them, architect of the new age.',
      benevolent:
        'The Old Ones return, and to your surprise, they reshape reality into something... beautiful. Perhaps you were right all along.',
      tragic:
        'They awaken. And you realize too late what you\'ve done. The world ends not with a bang, but with the laughter of mad gods.',
      pyrrhic:
        'Victory, but at tremendous cost. The Old Ones walk, but so few remain to witness it. Even you question if this was worth the price.',
    },
    shadow_empire: {
      cunning:
        'Perfect. The world bows to invisible chains. Governments, corporations, religions - all serve the Order without knowing. You are the spider at the center of the web.',
      brutal:
        'Through blackmail, murder, and corruption, you control everything. The shadow empire is built on fear and blood. And it is absolute.',
      benevolent:
        'Surprisingly, your hidden rule brings stability. Perhaps humanity needs guidance from the shadows. Perhaps you are their shepherd.',
      tragic:
        'You rule the world, but you are alone. Everyone you cared about sacrificed to reach this point. The crown is hollow.',
      pyrrhic:
        'The shadow empire stands, but resistance grows. How long can you maintain control? Victory feels temporary.',
    },
    transcendence: {
      benevolent:
        'Humanity willingly embraces cosmic truth. Together with the Old Ones, a new hybrid civilization emerges. You guided them to genuine enlightenment.',
      brutal:
        'The transformation is complete. What remains is neither human nor eldritch, but something in between. They did not all go willingly.',
      cunning:
        'You convinced them it was their choice. And perhaps it was. The line between guidance and manipulation blurs in cosmic matters.',
      tragic:
        'They transcend, but you realize the cost too late. What they became is not what you promised. The guilt is eternal.',
      pyrrhic:
        'Humanity evolves, but many were lost in the process. The survivors are changed, but changed is not always better.',
    },
    convergence: {
      benevolent:
        'True coexistence achieved. Humanity and the Old Ones share the cosmos. You have ushered in an age of genuine cosmic enlightenment.',
      cunning:
        'The peace holds, but only through your constant manipulation. Both sides would war without your hidden guidance.',
      tragic:
        'Peace, but those you loved did not live to see it. Every relationship sacrificed for this fragile harmony.',
      pyrrhic:
        'The convergence succeeds, but barely. The peace is uneasy, and you wonder how long it will last.',
      brutal:
        'You forced this convergence through blood and terror. It holds, but the foundations are soaked in suffering.',
    },
    banishment: {
      tragic:
        'Defeated. The entities return to their slumber, the Order scattered. But you know the truth - they will return. They always return.',
      pyrrhic:
        'You fought well, but humanity proved stronger. As you face judgment, you wonder if you were wrong from the start.',
      brutal:
        'Crushed utterly. Your methods were too extreme, and turned even your own against you. Now you face the consequences.',
      cunning:
        'Banished, but not destroyed. You planted seeds that will grow again. This is merely... a delay. The cycle continues.',
      benevolent:
        'Defeated, but humanity survives. Perhaps this was always the better outcome. You accept your fate with strange peace.',
    },
    cosmic_joke: {
      tragic:
        'The terrible truth: You were never the cultist. You WERE the Great Old One, experiencing mortality. Now you remember. Now you awaken. Humanity ends, but so does your experiment in being human.',
      cunning:
        'How delightfully cosmic. You served Nyarlathotep all along, thinking you led. The Crawling Chaos laughs at your realization.',
      brutal:
        'Free will was always an illusion. Every choice predetermined by entities beyond comprehension. You were their puppet, dancing on cosmic strings.',
      pyrrhic:
        'You achieved everything you wanted, only to discover it was what THEY wanted all along. Victory and defeat are the same.',
      benevolent:
        'In the end, you understand: there are no villains in cosmic horror. Only beings too vast to comprehend morality. You played your part perfectly.',
    },
  };

  return narratives[victoryType]?.[variant] || 'The end comes, as was always inevitable.';
}

// ============================================================================
// CAMPAIGN ANALYTICS
// ============================================================================

/**
 * Generate campaign analytics
 */
export function generateCampaignAnalytics(
  state: GreatOldOnesState,
  phase2: Phase2State,
  phase3: Phase3State,
  victoryType: string | null
): CampaignAnalytics {
  const score = victoryType
    ? calculateVictoryScore(state, phase2, phase3, victoryType)
    : calculateVictoryScore(state, phase2, phase3, 'incomplete');

  const grade = calculateGrade(score);

  // Collect sanity timeline
  const sanityTimeline = phase3.endgame.campaignState.historicalEvents
    .filter(e => e.impact.some(i => i.type === 'sanity'))
    .map(e => ({
      turn: e.turn,
      globalSanity:
        state.regions.reduce((sum, r) => sum + r.sanitySanity, 0) / state.regions.length,
      cause: e.name,
    }));

  // Build corruption map
  const corruptionMap = state.regions.map(r => ({
    regionId: r.regionId,
    peakCorruption: r.corruption,
    firstInstitutionFell: 'Unknown', // Would track this in real implementation
    institutionsFallen: [], // Would track this in real implementation
  }));

  // Build entity log
  const entityLog = state.summonedEntities.map(e => ({
    entityName: e.name,
    tier: e.tier,
    turnSummoned: 0, // Would track this
    rampaged: !e.bound,
    terrorCaused: e.terrorRadius * 10,
  }));

  return {
    overallScore: score,
    grade,
    doctrinePerformance: {
      doctrine: state.doctrine || 'domination',
      efficiency: phase2.doctrinePoints / state.alignment.turn,
      missionsCompleted: state.missionLog.length,
      favorGained: Object.values(phase2.elderOneFavor).reduce((sum, f) => sum + f, 0),
    },
    sanityTimeline,
    corruptionMap,
    entityLog,
    investigatorLog: [], // Would track encounters
    missionStats: {
      total: state.campaignProgress.missionsCompleted.length,
      successful: state.campaignProgress.missionsCompleted.length,
      failed: 0,
      perfectScores: 0,
      averageDifficulty: 5,
    },
    loreUnlocked: generateLoreEntries(state, phase2, phase3),
  };
}

/**
 * Calculate grade from score
 */
function calculateGrade(score: number): 'S' | 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 5000) return 'S';
  if (score >= 4000) return 'A';
  if (score >= 3000) return 'B';
  if (score >= 2000) return 'C';
  if (score >= 1000) return 'D';
  return 'F';
}

/**
 * Generate lore entries based on campaign
 */
function generateLoreEntries(
  state: GreatOldOnesState,
  phase2: Phase2State,
  phase3: Phase3State
): LoreEntry[] {
  const lore: LoreEntry[] = [];

  // Unlock lore for each Great Old One summoned
  for (const entity of state.summonedEntities) {
    if (entity.tier === 'great_old_one') {
      lore.push({
        id: `lore_entity_${entity.id}`,
        category: 'entity',
        title: `${entity.name}: The Truth Revealed`,
        content: `You gazed upon ${entity.name} and lived to remember. Few can claim such fortune.`,
        unlockedBy: 'Summoned Great Old One',
        rarity: 'legendary',
      });
    }
  }

  // Unlock lore for Great Truth revelation
  if (phase3.narrative.greatTruth.revelationLevel >= 100) {
    lore.push({
      id: 'lore_great_truth',
      category: 'ritual',
      title: 'The Great Truth',
      content:
        'You learned the true nature of the Old Ones. Whether that knowledge brings comfort or horror depends on what you chose to believe.',
      unlockedBy: 'Fully revealed Great Truth',
      rarity: 'legendary',
    });
  }

  return lore;
}

// ============================================================================
// LEGACY PERKS
// ============================================================================

/**
 * Generate legacy perks for New Game+
 */
export function generateLegacyPerks(
  state: GreatOldOnesState,
  phase2: Phase2State,
  analytics: CampaignAnalytics
): LegacyPerk[] {
  const perks: LegacyPerk[] = [];

  // Perk for high score
  if (analytics.grade === 'S' || analytics.grade === 'A') {
    perks.push({
      id: 'perk_eldritch_favor',
      name: 'Eldritch Favor',
      description: 'The Great Old Ones remember your service',
      type: 'eldritch_favor',
      effects: {
        resourceBonus: 50,
        startingCultists: 5,
      },
      unlockCondition: 'Achieved grade A or higher',
    });
  }

  // Perk for surviving with low sanity
  const avgSanity =
    state.regions.reduce((sum, r) => sum + r.sanitySanity, 0) / state.regions.length;
  if (avgSanity < 30) {
    perks.push({
      id: 'perk_remembered_madness',
      name: 'Remembered Madness',
      description: 'Humanity has genetic memory of previous awakening attempts',
      type: 'remembered_madness',
      effects: {
        investigatorHandicap: -20,
      },
      unlockCondition: 'Won with global sanity below 30',
    });
  }

  // Perk for high corruption
  if (state.resources.corruptionIndex > 80) {
    perks.push({
      id: 'perk_cult_inheritance',
      name: 'Cult Inheritance',
      description: 'Start with established network from previous run',
      type: 'cult_inheritance',
      effects: {
        startingCultists: 10,
        startingSites: 3,
      },
      unlockCondition: 'Won with corruption above 80',
    });
  }

  // Perk for summoning Great Old Ones
  if (analytics.entityLog.some(e => e.tier === 'great_old_one')) {
    perks.push({
      id: 'perk_forbidden_knowledge',
      name: 'Forbidden Knowledge',
      description: 'Knowledge of summoning rituals persists',
      type: 'forbidden_knowledge',
      effects: {
        doctrineUnlock: true,
      },
      unlockCondition: 'Successfully summoned a Great Old One',
    });
  }

  return perks;
}

// ============================================================================
// CAMPAIGN GENERATOR
// ============================================================================

/**
 * Generate a new campaign with modifiers
 */
export function generateNewCampaign(
  generator: CampaignGenerator,
  legacyPerks: LegacyPerk[]
): {
  modifiedState: Partial<GreatOldOnesState>;
  eventSchedule: { turn: number; eventId: string }[];
  message: string;
} {
  const modifiedState: Partial<GreatOldOnesState> = {};

  // Apply era modifiers
  if (generator.era === 'victorian') {
    // Victorian era: slower corruption, lower tech resistance
    generator.modifiers.corruptionDifficulty *= 0.8;
    generator.modifiers.investigatorSpawnRate *= 0.7;
  } else if (generator.era === 'cold_war') {
    // Cold War: paranoia helps, but also increases investigation
    generator.modifiers.investigatorSpawnRate *= 1.3;
  } else if (generator.era === 'cyberpunk') {
    // Cyberpunk: technology aids both sides
    generator.modifiers.investigatorSpawnRate *= 1.2;
  }

  // Apply legacy perks
  for (const perk of legacyPerks) {
    if (perk.effects.startingCultists) {
      // Would add starting cultists
    }
    if (perk.effects.startingSites) {
      // Would add starting sites
    }
    if (perk.effects.investigatorHandicap) {
      generator.modifiers.investigatorSpawnRate *= 1 + perk.effects.investigatorHandicap / 100;
    }
  }

  // Generate event schedule
  const eventSchedule: { turn: number; eventId: string }[] = [];

  if (generator.storyBeats.firstManifestation) {
    eventSchedule.push({
      turn: Math.floor(Math.random() * 20) + 30,
      eventId: 'first_manifestation',
    });
  }

  if (generator.storyBeats.greatSchism) {
    eventSchedule.push({
      turn: Math.floor(Math.random() * 20) + 60,
      eventId: 'great_schism',
    });
  }

  return {
    modifiedState,
    eventSchedule,
    message: `New campaign generated in ${generator.era} era with ${legacyPerks.length} legacy perks`,
  };
}
