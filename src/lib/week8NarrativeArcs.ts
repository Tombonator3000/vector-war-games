/**
 * Week 8: Narrative Arcs & Cosmic Secrets
 * Motivation reveals, Great Truth system, and Internal Order politics
 */

import { GreatOldOnesState, Doctrine } from '../types/greatOldOnes';
import {
  Phase3State,
  MotivationBranch,
  MotivationType,
  GreatTruthState,
  TruthContradiction,
  OrderSchism,
  RivalCult,
  OrderFactionState,
  PlayerChoice,
} from '../types/phase3Types';

// ============================================================================
// MOTIVATION REVEAL SYSTEM
// ============================================================================

/**
 * Determine player's motivation branch based on choices
 */
export function determineMotivationBranch(
  choices: PlayerChoice[],
  doctrine: Doctrine | null
): MotivationBranch {
  // Analyze player choices to determine primary motivation
  const scores: Record<MotivationType, number> = {
    world_domination: 0,
    human_ascension: 0,
    feed_old_ones: 0,
    prevent_catastrophe: 0,
    personal_apotheosis: 0,
  };

  // Score based on doctrine
  if (doctrine === 'domination') scores.world_domination += 30;
  if (doctrine === 'corruption') scores.world_domination += 20;
  if (doctrine === 'convergence') scores.human_ascension += 30;

  // Score based on specific choices
  for (const choice of choices) {
    if (choice.moralityChange < -10) {
      scores.feed_old_ones += 5;
      scores.world_domination += 3;
    } else if (choice.moralityChange > 10) {
      scores.human_ascension += 5;
      scores.prevent_catastrophe += 3;
    }

    // Check context for specific motivations
    if (choice.context.includes('power') || choice.context.includes('control')) {
      scores.world_domination += 2;
      scores.personal_apotheosis += 1;
    }
    if (choice.context.includes('sacrifice') || choice.context.includes('offering')) {
      scores.feed_old_ones += 3;
    }
    if (choice.context.includes('enlighten') || choice.context.includes('transcend')) {
      scores.human_ascension += 2;
    }
    if (choice.context.includes('prevent') || choice.context.includes('protect')) {
      scores.prevent_catastrophe += 4;
    }
    if (choice.context.includes('become') || choice.context.includes('transform')) {
      scores.personal_apotheosis += 3;
    }
  }

  // Find highest scoring motivation
  const primaryMotivation = (Object.keys(scores) as MotivationType[]).reduce((a, b) =>
    scores[a] > scores[b] ? a : b
  );

  return createMotivationBranch(primaryMotivation);
}

/**
 * Create a motivation branch
 */
function createMotivationBranch(type: MotivationType): MotivationBranch {
  const branches: Record<MotivationType, Omit<MotivationBranch, 'id'>> = {
    world_domination: {
      type: 'world_domination',
      name: 'The Conqueror',
      description:
        'You seek absolute power over humanity. The Old Ones are tools for your dominion.',
      triggeringChoices: [],
      revelationProgress: 0,
      flashbacksUnlocked: [],
      redemptionAvailable: true,
    },
    human_ascension: {
      type: 'human_ascension',
      name: 'The Shepherd',
      description:
        'You genuinely believe humanity can evolve through contact with cosmic forces.',
      triggeringChoices: [],
      revelationProgress: 0,
      flashbacksUnlocked: [],
      redemptionAvailable: true,
    },
    feed_old_ones: {
      type: 'feed_old_ones',
      name: 'The Devoted',
      description: 'You exist to serve the Great Old Ones, whatever the cost to humanity.',
      triggeringChoices: [],
      revelationProgress: 0,
      flashbacksUnlocked: [],
      redemptionAvailable: false,
    },
    prevent_catastrophe: {
      type: 'prevent_catastrophe',
      name: 'The Paradox',
      description:
        'You awaken the Old Ones to prevent something worse. Only you know the true threat.',
      triggeringChoices: [],
      revelationProgress: 0,
      flashbacksUnlocked: [],
      redemptionAvailable: true,
    },
    personal_apotheosis: {
      type: 'personal_apotheosis',
      name: 'The Ascendant',
      description: 'You plan to consume eldritch power and become a god yourself.',
      triggeringChoices: [],
      revelationProgress: 0,
      flashbacksUnlocked: [],
      redemptionAvailable: false,
    },
  };

  return {
    id: `motivation_${type}_${Date.now()}`,
    ...branches[type],
  };
}

/**
 * Progress the motivation reveal chain
 */
export function progressMotivationReveal(
  branch: MotivationBranch,
  choice: PlayerChoice
): {
  progressGained: number;
  flashbackUnlocked?: string;
  message: string;
} {
  // Calculate progress gained based on choice alignment
  let progressGained = 5;

  // Bonus progress for aligned choices
  const alignment = calculateChoiceAlignment(branch.type, choice);
  progressGained += alignment * 2;

  branch.revelationProgress = Math.min(100, branch.revelationProgress + progressGained);
  branch.triggeringChoices.push(choice.choiceId);

  // Unlock flashbacks at milestones
  let flashbackUnlocked: string | undefined;
  if (branch.revelationProgress >= 25 && !branch.flashbacksUnlocked.includes('origin')) {
    flashbackUnlocked = 'origin';
    branch.flashbacksUnlocked.push('origin');
  } else if (
    branch.revelationProgress >= 50 &&
    !branch.flashbacksUnlocked.includes('first_contact')
  ) {
    flashbackUnlocked = 'first_contact';
    branch.flashbacksUnlocked.push('first_contact');
  } else if (
    branch.revelationProgress >= 75 &&
    !branch.flashbacksUnlocked.includes('turning_point')
  ) {
    flashbackUnlocked = 'turning_point';
    branch.flashbacksUnlocked.push('turning_point');
  } else if (branch.revelationProgress >= 100 && !branch.flashbacksUnlocked.includes('truth')) {
    flashbackUnlocked = 'truth';
    branch.flashbacksUnlocked.push('truth');
  }

  const message = flashbackUnlocked
    ? `Memory unlocked: ${flashbackUnlocked}. Your true motivation becomes clearer...`
    : `Your path becomes clearer (${branch.revelationProgress.toFixed(0)}%)`;

  return { progressGained, flashbackUnlocked, message };
}

/**
 * Calculate how aligned a choice is with a motivation
 */
function calculateChoiceAlignment(motivation: MotivationType, choice: PlayerChoice): number {
  // Returns 0-10 based on alignment
  const context = choice.context.toLowerCase();
  const selected = choice.optionSelected.toLowerCase();

  let alignment = 0;

  switch (motivation) {
    case 'world_domination':
      if (context.includes('power') || selected.includes('control')) alignment += 5;
      if (context.includes('dominate') || selected.includes('conquer')) alignment += 3;
      break;

    case 'human_ascension':
      if (context.includes('enlighten') || selected.includes('teach')) alignment += 5;
      if (context.includes('evolve') || selected.includes('transcend')) alignment += 3;
      if (choice.moralityChange > 0) alignment += 2;
      break;

    case 'feed_old_ones':
      if (context.includes('sacrifice') || selected.includes('offer')) alignment += 5;
      if (context.includes('serve') || selected.includes('worship')) alignment += 3;
      break;

    case 'prevent_catastrophe':
      if (context.includes('prevent') || selected.includes('protect')) alignment += 5;
      if (context.includes('save') || selected.includes('defend')) alignment += 3;
      break;

    case 'personal_apotheosis':
      if (context.includes('power for myself') || selected.includes('i will become')) alignment += 5;
      if (context.includes('consume') || selected.includes('absorb')) alignment += 3;
      break;
  }

  return Math.min(10, alignment);
}

// ============================================================================
// GREAT TRUTH SYSTEM
// ============================================================================

/**
 * Reveal part of the Great Truth
 */
export function revealGreatTruth(
  truth: GreatTruthState,
  source: 'ritual' | 'entity' | 'artifact' | 'vision' | 'revelation',
  revelationAmount: number
): {
  newRevelationLevel: number;
  contradictionDiscovered?: TruthContradiction;
  message: string;
} {
  const oldLevel = truth.revelationLevel;
  truth.revelationLevel = Math.min(100, truth.revelationLevel + revelationAmount);

  let contradictionDiscovered: TruthContradiction | undefined;

  // Discover contradictions at certain thresholds
  if (oldLevel < 30 && truth.revelationLevel >= 30) {
    contradictionDiscovered = generateContradiction('early', truth);
    truth.contradictions.push(contradictionDiscovered);
  } else if (oldLevel < 60 && truth.revelationLevel >= 60) {
    contradictionDiscovered = generateContradiction('middle', truth);
    truth.contradictions.push(contradictionDiscovered);
  } else if (oldLevel < 90 && truth.revelationLevel >= 90) {
    contradictionDiscovered = generateContradiction('late', truth);
    truth.contradictions.push(contradictionDiscovered);
  }

  const sourceMessages: Record<typeof source, string> = {
    ritual: 'A ritual reveals cosmic truths beyond mortal comprehension',
    entity: 'An entity whispers secrets from beyond the stars',
    artifact: 'An ancient artifact shows visions of reality unraveling',
    vision: 'A vision tears through your mind, showing the true nature of existence',
    revelation: 'Sudden clarity strikes - you understand what you truly serve',
  };

  const message = contradictionDiscovered
    ? `${sourceMessages[source]}... but something doesn't add up. ${contradictionDiscovered.title}`
    : sourceMessages[source];

  return {
    newRevelationLevel: truth.revelationLevel,
    contradictionDiscovered,
    message,
  };
}

/**
 * Generate a truth contradiction
 */
function generateContradiction(
  stage: 'early' | 'middle' | 'late',
  truth: GreatTruthState
): TruthContradiction {
  const contradictions = {
    early: [
      {
        title: 'The Benevolent Lie',
        description: 'Some entities seem to genuinely help humans, contradicting the malevolent narrative',
        evidence: ['Healed cultists', 'Prophetic warnings', 'Gifts of knowledge'],
        weight: 3,
      },
      {
        title: 'Ancient Protection',
        description: 'Ancient wards were built to protect something, not imprison it',
        evidence: ['Ward orientations', 'Protective symbols', 'Guardian entities'],
        weight: 4,
      },
    ],
    middle: [
      {
        title: 'The Cycle of Awakening',
        description: 'This has happened before. Multiple times. Humanity always survives.',
        evidence: ['Archaeological records', 'Genetic memories', 'Prehistoric art'],
        weight: 6,
      },
      {
        title: 'Entity Disagreement',
        description: 'The Great Old Ones seem to disagree about what should happen',
        evidence: ['Conflicting visions', 'Rival cults', 'Entity conflicts'],
        weight: 5,
      },
    ],
    late: [
      {
        title: 'The Greater Threat',
        description: 'There is something the Old Ones fear. Something worse.',
        evidence: ['Entity terror', 'Defensive preparations', 'Cosmic warnings'],
        weight: 8,
      },
      {
        title: 'You Were Always Free',
        description: 'You were never controlled. Every choice was yours. The horror is willing.',
        evidence: ['No psychic compulsion', 'Clear memories', 'Conscious decisions'],
        weight: 9,
      },
    ],
  };

  const options = contradictions[stage];
  const selected = options[Math.floor(Math.random() * options.length)];

  return {
    id: `contradiction_${stage}_${Date.now()}`,
    ...selected,
  };
}

/**
 * Player interprets the truth
 */
export function interpretTruth(
  truth: GreatTruthState,
  interpretation: GreatTruthState['interpretation']
): {
  accepted: boolean;
  consequences: string[];
  message: string;
} {
  truth.interpretation = interpretation;

  // Determine actual consequence based on interpretation and previous actions
  const consequences: string[] = [];

  if (interpretation === 'malevolent') {
    truth.playerStance = 'horrified';
    consequences.push('Order members question your commitment');
    consequences.push('Entities sense your doubt');
    consequences.push('Redemption path opens');
  } else if (interpretation === 'benevolent') {
    truth.playerStance = 'believer';
    consequences.push('Order unity strengthens');
    consequences.push('Voluntary conversions increase');
    consequences.push('Entities favor you');
  } else if (interpretation === 'indifferent') {
    truth.playerStance = 'opportunist';
    consequences.push('Pragmatic faction gains power');
    consequences.push('Entities neither help nor hinder');
  }

  const messages: Record<typeof interpretation, string> = {
    malevolent:
      'You see them for what they truly are: destroyers. What have you done?',
    benevolent: 'They will save us. Humanity will ascend. You believe.',
    indifferent:
      'They care nothing for us, good or ill. We are insects to them.',
    unknown: 'The truth remains shrouded in mystery.',
  };

  return {
    accepted: true,
    consequences,
    message: messages[interpretation],
  };
}

// ============================================================================
// INTERNAL ORDER POLITICS
// ============================================================================

/**
 * Trigger a schism in the Order
 */
export function triggerSchism(
  factions: OrderFactionState[],
  cause: string,
  severity: number
): OrderSchism {
  // Determine which factions are involved
  const involvedFactions = factions
    .filter(f => Math.random() > 0.3) // 70% chance each faction involved
    .map(f => f.faction);

  // At least 2 factions must be involved
  if (involvedFactions.length < 2) {
    involvedFactions.push(...factions.slice(0, 2).map(f => f.faction));
  }

  const schism: OrderSchism = {
    id: `schism_${Date.now()}`,
    name: generateSchismName(cause),
    cause,
    factions: involvedFactions,
    loyalists: [],
    rebels: [],
    severity,
    resolvable: severity < 70,
    consequences: generateSchismConsequences(severity),
  };

  return schism;
}

/**
 * Generate schism name based on cause
 */
function generateSchismName(cause: string): string {
  if (cause.includes('doctrine')) return 'The Doctrinal Divide';
  if (cause.includes('sacrifice')) return 'The Blood Schism';
  if (cause.includes('power')) return 'The War of Ascension';
  if (cause.includes('method')) return 'The Methodological Split';
  return 'The Great Fracture';
}

/**
 * Generate schism consequences
 */
function generateSchismConsequences(severity: number): string[] {
  const consequences: string[] = [];

  if (severity > 30) {
    consequences.push('Operations slowed by internal conflict');
  }
  if (severity > 50) {
    consequences.push('Cultist cells defect to rival faction');
    consequences.push('Ritual sites become contested');
  }
  if (severity > 70) {
    consequences.push('Open warfare between factions');
    consequences.push('Veil integrity damaged by infighting');
    consequences.push('Investigators exploit the division');
  }
  if (severity > 90) {
    consequences.push('Order may fracture permanently');
    consequences.push('Great Old Ones withdraw favor');
  }

  return consequences;
}

/**
 * Resolve a schism through player choice
 */
export function resolveSchism(
  schism: OrderSchism,
  resolution: 'unity' | 'purge_rebels' | 'compromise' | 'civil_war',
  factions: OrderFactionState[]
): {
  success: boolean;
  newSeverity: number;
  consequences: string[];
  message: string;
} {
  let success = false;
  let newSeverity = schism.severity;
  const consequences: string[] = [];
  let message = '';

  switch (resolution) {
    case 'unity':
      if (schism.resolvable) {
        success = true;
        newSeverity = Math.max(0, schism.severity - 40);
        consequences.push('Factions reconcile');
        consequences.push('Council unity restored');
        message = 'Through wisdom and diplomacy, the Order stands united once more.';

        // Boost all faction relations
        for (const faction of factions) {
          faction.playerRelation = Math.min(100, faction.playerRelation + 20);
        }
      } else {
        success = false;
        message = 'The divide is too deep. Unity is impossible.';
      }
      break;

    case 'purge_rebels':
      success = true;
      newSeverity = 0;
      consequences.push('Rebel faction eliminated');
      consequences.push('Order power reduced');
      consequences.push('Remaining factions fear you');
      message = 'Blood has been spilled. The rebels are no more, but at what cost?';

      // Remove weakest faction
      const weakestFaction = factions.reduce((a, b) => (a.power < b.power ? a : b));
      weakestFaction.power = 0;
      for (const faction of factions) {
        if (faction !== weakestFaction) {
          faction.playerRelation = Math.max(-100, faction.playerRelation - 30);
        }
      }
      break;

    case 'compromise':
      success = schism.severity < 80;
      newSeverity = success ? Math.max(0, schism.severity - 25) : schism.severity + 10;
      if (success) {
        consequences.push('Uneasy peace achieved');
        consequences.push('Some factions dissatisfied');
        message = 'A compromise is reached, though not all are happy.';
      } else {
        consequences.push('Compromise fails');
        consequences.push('Schism worsens');
        message = 'Your attempt at compromise pleases no one.';
      }
      break;

    case 'civil_war':
      success = false; // War is never really success
      newSeverity = 100;
      consequences.push('Order enters civil war');
      consequences.push('Massive veil damage');
      consequences.push('Investigators exploit chaos');
      consequences.push('Elder One favor lost');
      message = 'The Order tears itself apart. Madness consumes madness.';

      // All factions lose power
      for (const faction of factions) {
        faction.power = Math.max(0, faction.power - 30);
      }
      break;
  }

  return { success, newSeverity, consequences, message };
}

// ============================================================================
// RIVAL CULTS
// ============================================================================

/**
 * Generate a rival cult
 */
export function generateRivalCult(
  excludePatrons: string[] = []
): RivalCult {
  const patrons = [
    'cthulhu',
    'hastur',
    'nyarlathotep',
    'azathoth',
    'yog_sothoth',
  ] as const;

  const availablePatrons = patrons.filter(p => !excludePatrons.includes(p));
  const patron = availablePatrons[Math.floor(Math.random() * availablePatrons.length)];

  const names: Record<typeof patron, string> = {
    cthulhu: 'The Esoteric Order of Dagon',
    hastur: 'The Yellow Sign Brotherhood',
    nyarlathotep: 'The Cult of the Crawling Chaos',
    azathoth: 'The Dancers at the Center',
    yog_sothoth: 'The Gatekeepers',
  };

  return {
    id: `rival_${patron}_${Date.now()}`,
    name: names[patron],
    patronEntity: patron,
    power: Math.floor(Math.random() * 40) + 30, // 30-70
    progress: Math.floor(Math.random() * 30), // 0-30
    relationshipType: Math.random() > 0.7 ? 'potential_ally' : 'hostile',
  };
}

/**
 * Progress rival cult activities
 */
export function progressRivalCult(
  cult: RivalCult,
  globalCorruption: number
): {
  progressGained: number;
  operation?: string;
  threat: 'low' | 'medium' | 'high' | 'critical';
  message: string;
} {
  // Rival cults progress faster when global corruption is high
  const baseProgress = 2;
  const corruptionBonus = globalCorruption > 50 ? (globalCorruption - 50) / 10 : 0;
  const progressGained = baseProgress + corruptionBonus;

  cult.progress = Math.min(100, cult.progress + progressGained);

  // Generate operation if cult is active
  let operation: string | undefined;
  if (Math.random() > 0.7) {
    const operations = [
      'Summoning ritual in progress',
      'Recruiting from your cultists',
      'Sabotaging your ritual sites',
      'Racing to awaken their patron',
      'Attempting to expose you to investigators',
    ];
    operation = operations[Math.floor(Math.random() * operations.length)];
    cult.currentOperation = operation;
  }

  // Determine threat level
  let threat: 'low' | 'medium' | 'high' | 'critical';
  if (cult.progress < 30) threat = 'low';
  else if (cult.progress < 60) threat = 'medium';
  else if (cult.progress < 90) threat = 'high';
  else threat = 'critical';

  const message =
    threat === 'critical'
      ? `${cult.name} is dangerously close to their goal!`
      : `${cult.name} grows in power (${cult.progress.toFixed(0)}%)`;

  return { progressGained, operation, threat, message };
}

/**
 * Attempt to ally with or destroy a rival cult
 */
export function interactWithRivalCult(
  cult: RivalCult,
  action: 'ally' | 'destroy' | 'sabotage' | 'ignore'
): {
  success: boolean;
  consequences: string[];
  message: string;
} {
  const consequences: string[] = [];
  let success = false;
  let message = '';

  switch (action) {
    case 'ally':
      if (cult.relationshipType === 'potential_ally') {
        success = Math.random() > 0.3; // 70% success
        if (success) {
          cult.relationshipType = 'potential_ally';
          consequences.push('Gained rival cult as ally');
          consequences.push('Combined operations possible');
          consequences.push('Share resources and knowledge');
          message = `${cult.name} agrees to an alliance. Together you are stronger.`;
        } else {
          consequences.push('Alliance rejected');
          cult.relationshipType = 'hostile';
          message = `${cult.name} spurns your offer. They are now your enemy.`;
        }
      } else {
        success = false;
        message = `${cult.name} would never ally with you.`;
      }
      break;

    case 'destroy':
      success = Math.random() > 0.5; // 50% success
      if (success) {
        cult.power = 0;
        cult.progress = 0;
        consequences.push('Rival cult destroyed');
        consequences.push('Their patron displeased');
        consequences.push('Their resources claimed');
        message = `${cult.name} has been utterly destroyed.`;
      } else {
        cult.power += 10;
        consequences.push('Assault failed');
        consequences.push('Rival cult strengthened');
        consequences.push('Veil damaged by conflict');
        message = `Your assault on ${cult.name} has failed. They are now stronger.`;
      }
      break;

    case 'sabotage':
      success = Math.random() > 0.35; // 65% success
      if (success) {
        cult.progress = Math.max(0, cult.progress - 30);
        consequences.push('Rival cult progress delayed');
        message = `${cult.name}'s operations have been sabotaged.`;
      } else {
        consequences.push('Sabotage detected');
        cult.relationshipType = 'hostile';
        message = `${cult.name} detected your sabotage!`;
      }
      break;

    case 'ignore':
      success = true;
      message = `You choose not to interfere with ${cult.name}.`;
      break;
  }

  return { success, consequences, message };
}
