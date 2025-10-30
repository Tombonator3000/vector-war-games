/**
 * Enhanced Political News & Banter System
 *
 * Generates dynamic news content based on:
 * - Current political stability of nations
 * - Recent events and regime changes
 * - International relations
 * - AI personality-driven commentary
 *
 * Inspired by real-world news cycles and strategy game event systems
 */

import type { AIPersonality } from './regimeChange';

export type NewsCategory = 'governance' | 'diplomatic' | 'crisis' | 'intel' | 'military' | 'economic';
export type NewsPriority = 'routine' | 'important' | 'urgent' | 'critical';

export interface PoliticalNewsItem {
  category: NewsCategory;
  text: string;
  priority: NewsPriority;
}

/**
 * Generate routine political news based on nation's stability
 */
export function generateRoutinePoliticalNews(
  nationName: string,
  morale: number,
  publicOpinion: number,
  cabinetApproval: number,
  instability: number,
  aiPersonality: AIPersonality
): PoliticalNewsItem | null {
  // Don't generate routine news too often (controlled by caller)
  if (Math.random() > 0.4) return null;

  // Determine nation's political state
  const isStable = instability < 40 && morale > 60 && publicOpinion > 55;
  const isUnstable = instability > 60 || morale < 40 || publicOpinion < 45;
  const isCrisis = instability > 75 || morale < 30 || publicOpinion < 30;

  // Select appropriate news template based on state
  if (isCrisis) {
    return generateCrisisNews(nationName, morale, publicOpinion, instability, aiPersonality);
  } else if (isUnstable) {
    return generateUnstableNews(nationName, morale, publicOpinion, instability, aiPersonality);
  } else if (isStable) {
    return generateStableNews(nationName, aiPersonality);
  }

  return null;
}

function generateStableNews(nationName: string, personality: AIPersonality): PoliticalNewsItem {
  const templates = [
    `${nationName} maintains high approval ratings amid international tensions.`,
    `${nationName}'s government enjoys strong public support.`,
    `${nationName} leadership reports stable governance and economic growth.`,
    `${nationName} citizens express confidence in current administration.`,
    `${nationName} political landscape remains calm despite global uncertainty.`,
  ];

  return {
    category: 'governance',
    text: templates[Math.floor(Math.random() * templates.length)],
    priority: 'routine',
  };
}

function generateUnstableNews(
  nationName: string,
  morale: number,
  publicOpinion: number,
  instability: number,
  personality: AIPersonality
): PoliticalNewsItem {
  const templates = [
    `${nationName} faces growing protests over government policies.`,
    `${nationName} approval ratings continue to decline.`,
    `${nationName} opposition parties gaining momentum.`,
    `${nationName} leadership under pressure from dissatisfied populace.`,
    `${nationName} political stability showing signs of strain.`,
    `${nationName} government struggles to maintain public confidence.`,
    `${nationName} media reports rising political tensions.`,
  ];

  return {
    category: 'governance',
    text: templates[Math.floor(Math.random() * templates.length)],
    priority: 'important',
  };
}

function generateCrisisNews(
  nationName: string,
  morale: number,
  publicOpinion: number,
  instability: number,
  personality: AIPersonality
): PoliticalNewsItem {
  const templates = [
    `${nationName} in CRISIS: Mass demonstrations paralyze capital!`,
    `${nationName} on the brink: Government legitimacy questioned!`,
    `${nationName} BREAKING: Military movements reported amid political chaos!`,
    `${nationName} URGENT: Opposition calls for immediate regime change!`,
    `${nationName} WARNING: Civil unrest spreading to multiple regions!`,
    `${nationName} ALERT: Government emergency meetings as stability collapses!`,
  ];

  return {
    category: 'crisis',
    text: templates[Math.floor(Math.random() * templates.length)],
    priority: 'urgent',
  };
}

/**
 * Generate news about election outcomes for AI nations
 */
export function generateElectionNews(
  nationName: string,
  wasSuccessful: boolean,
  morale: number,
  publicOpinion: number
): PoliticalNewsItem {
  if (wasSuccessful) {
    const positiveTemplates = [
      `${nationName} election results: Incumbent coalition secures renewed mandate.`,
      `${nationName} voters express confidence in leadership during election.`,
      `${nationName} government strengthened by successful election outcome.`,
      `${nationName} elections conclude with strong voter turnout and clear mandate.`,
    ];

    return {
      category: 'governance',
      text: positiveTemplates[Math.floor(Math.random() * positiveTemplates.length)],
      priority: 'routine',
    };
  } else {
    const negativeTemplates = [
      `${nationName} election results: Fractured coalition struggles to maintain control.`,
      `${nationName} voters signal dissatisfaction in contested election.`,
      `${nationName} government weakened by poor election performance.`,
      `${nationName} elections reveal deep political divisions.`,
      `${nationName} disputed election results spark protests.`,
    ];

    return {
      category: 'governance',
      text: negativeTemplates[Math.floor(Math.random() * negativeTemplates.length)],
      priority: 'important',
    };
  }
}

/**
 * Generate international commentary between AI nations
 * (AI nations commenting on each other's political situations)
 */
export function generateInternationalCommentary(
  observerName: string,
  observerPersonality: AIPersonality,
  targetName: string,
  targetInstability: number,
  targetMorale: number
): PoliticalNewsItem | null {
  // Only generate commentary sometimes to avoid spam
  if (Math.random() > 0.3) return null;

  // Only comment on nations in crisis or very unstable
  if (targetInstability < 60 && targetMorale > 40) return null;

  const templates = getCommentaryTemplates(observerPersonality, targetName, targetInstability);

  if (templates.length === 0) return null;

  return {
    category: 'diplomatic',
    text: templates[Math.floor(Math.random() * templates.length)],
    priority: 'routine',
  };
}

function getCommentaryTemplates(
  personality: AIPersonality,
  targetName: string,
  instability: number
): string[] {
  const isCritical = instability > 75;

  switch (personality) {
    case 'aggressive':
      return isCritical
        ? [
            `${targetName}'s weakness presents opportunities, observers note.`,
            `${targetName}'s political chaos shows the cost of poor leadership.`,
            `${targetName}'s instability makes them vulnerable, analysts warn.`,
          ]
        : [
            `${targetName} showing signs of internal strain.`,
            `${targetName}'s difficulties noted by international observers.`,
          ];

    case 'defensive':
      return isCritical
        ? [
            `International community expresses concern over ${targetName}'s stability.`,
            `${targetName}'s crisis raises regional security concerns.`,
            `Diplomatic channels monitor ${targetName}'s deteriorating situation.`,
          ]
        : [
            `${targetName} political situation being watched carefully.`,
            `Observers note growing challenges in ${targetName}.`,
          ];

    case 'balanced':
      return isCritical
        ? [
            `${targetName}'s political turmoil draws international attention.`,
            `${targetName} struggles with governance challenges.`,
          ]
        : [
            `${targetName} faces political headwinds.`,
          ];

    case 'isolationist':
      // Isolationists rarely comment on others
      return [];

    case 'trickster':
      return isCritical
        ? [
            `${targetName}'s problems create interesting possibilities.`,
            `${targetName}'s chaos: One nation's crisis is another's opportunity.`,
          ]
        : [
            `${targetName} showing cracks in the facade.`,
          ];

    case 'chaotic':
      return isCritical
        ? [
            `${targetName} burns while the world watches. Beautiful chaos!`,
            `${targetName}'s collapse accelerates. The spiral continues!`,
          ]
        : [
            `${targetName} teetering on the edge. Let's see what happens!`,
          ];

    default:
      return [];
  }
}

/**
 * Generate tension-building news that hints at possible flashpoints
 * Call this to create atmosphere before potential crises
 */
export function generateTensionNews(defcon: number, turn: number): PoliticalNewsItem | null {
  // More likely to generate tension news at lower DEFCON levels
  const chance = defcon <= 3 ? 0.3 : 0.15;
  if (Math.random() > chance) return null;

  const tensionTemplates = [
    'Intelligence reports unusual military activity in contested regions.',
    'Diplomatic channels report increased communications traffic.',
    'SIGINT detects heightened chatter among rogue actors.',
    'Global security analysts warn of emerging flashpoint risks.',
    'Strategic command reports anomalies in early warning systems.',
    'International observers note rising tensions in multiple hotspots.',
    'CIA briefing highlights potential crisis scenarios developing.',
    'NSA intercepts suggest coordinated activities by hostile groups.',
    'Pentagon increases readiness posture amid uncertain threats.',
    'State Department issues travel warnings for volatile regions.',
  ];

  return {
    category: 'intel',
    text: tensionTemplates[Math.floor(Math.random() * tensionTemplates.length)],
    priority: defcon <= 2 ? 'urgent' : 'important',
  };
}

/**
 * Generate news about flashpoint aftermath and consequences
 */
export function generateFlashpointAftermathNews(
  flashpointType: string,
  success: boolean,
  severity: 'major' | 'critical' | 'catastrophic'
): PoliticalNewsItem {
  const aftermathTemplates: Record<string, { success: string[]; failure: string[] }> = {
    terrorist: {
      success: [
        'Counter-terrorism operation succeeds, threat neutralized.',
        'Special forces operation prevents catastrophic attack.',
        'Intelligence breakthrough foils major terrorist plot.',
      ],
      failure: [
        'Security failure: Terrorist operation causes major casualties.',
        'Counter-terrorism operation fails, situation deteriorates.',
        'Crisis escalates as containment efforts prove insufficient.',
      ],
    },
    coup: {
      success: [
        'Political crisis resolved through diplomatic intervention.',
        'Military coup thwarted, stability restored.',
        'International coalition prevents regime collapse.',
      ],
      failure: [
        'Coup succeeds, regional instability spreads.',
        'Failed intervention leads to hostile new regime.',
        'Power vacuum creates dangerous security situation.',
      ],
    },
    accident: {
      success: [
        'Nuclear incident averted through quick action.',
        'Accident contained, catastrophe prevented.',
        'Crisis de-escalation successful, war avoided.',
      ],
      failure: [
        'Accident spirals into major international incident.',
        'Failed containment leads to regional catastrophe.',
        'Situation deteriorates beyond control.',
      ],
    },
    blackswan: {
      success: [
        'Unprecedented crisis managed through decisive action.',
        'Black swan event contained, new protocols established.',
        'Unthinkable scenario averted by bold leadership.',
      ],
      failure: [
        'Unprecedented crisis overwhelms response capabilities.',
        'Black swan event triggers cascading failures.',
        'Unthinkable scenario becomes reality.',
      ],
    },
  };

  const templates = aftermathTemplates[flashpointType] || aftermathTemplates.blackswan;
  const list = success ? templates.success : templates.failure;

  return {
    category: success ? 'diplomatic' : 'crisis',
    text: list[Math.floor(Math.random() * list.length)],
    priority: severity === 'catastrophic' ? 'critical' : success ? 'important' : 'urgent',
  };
}

/**
 * Generate multiple news items for current turn
 * Call this each turn to create dynamic news feed
 */
export function generateTurnNews(
  nations: Array<{
    name: string;
    morale: number;
    publicOpinion: number;
    cabinetApproval: number;
    instability: number;
    ai: AIPersonality;
    isPlayer: boolean;
  }>,
  turnNumber: number
): PoliticalNewsItem[] {
  const newsItems: PoliticalNewsItem[] = [];

  // Generate routine political news (1-3 items per turn)
  const newsCount = 1 + Math.floor(Math.random() * 3);

  for (let i = 0; i < newsCount && nations.length > 0; i++) {
    const nation = nations[Math.floor(Math.random() * nations.length)];

    const item = generateRoutinePoliticalNews(
      nation.name,
      nation.morale,
      nation.publicOpinion,
      nation.cabinetApproval,
      nation.instability,
      nation.ai
    );

    if (item) {
      newsItems.push(item);
    }
  }

  // Occasionally generate international commentary (1 in 3 turns)
  if (Math.random() < 0.33 && nations.length >= 2) {
    const observer = nations[Math.floor(Math.random() * nations.length)];
    const targets = nations.filter(n => n.name !== observer.name);

    if (targets.length > 0) {
      const target = targets[Math.floor(Math.random() * targets.length)];

      const commentary = generateInternationalCommentary(
        observer.name,
        observer.ai,
        target.name,
        target.instability,
        target.morale
      );

      if (commentary) {
        newsItems.push(commentary);
      }
    }
  }

  return newsItems;
}
