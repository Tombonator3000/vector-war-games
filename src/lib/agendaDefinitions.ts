/**
 * Agenda Definitions
 *
 * Defines all primary and hidden agendas for AI leaders.
 * Each agenda represents a personality trait that affects diplomatic decisions.
 *
 * Inspired by Civilization's agenda system.
 */

import type { Nation, GameState } from '@/types/game';
import type { Agenda, AgendaModifier } from '@/types/negotiation';

const countWarheads = (nation: Nation): number => {
  return Object.values(nation.warheads || {}).reduce((sum, count) => sum + count, 0);
};

const getAllianceCount = (nation: Nation): number => nation.alliances?.length || 0;

const hasActiveWar = (nation: Nation): boolean => {
  const treaties = nation.treaties ? Object.values(nation.treaties) : [];
  return treaties.some(treaty => treaty.alliance === false && (treaty.truceTurns ?? 0) <= 0);
};

const getActiveWarCount = (nation: Nation): number => {
  const treaties = nation.treaties ? Object.values(nation.treaties) : [];
  return treaties.filter(treaty => treaty.alliance === false && (treaty.truceTurns ?? 0) <= 0).length;
};

const hasSharedAlliance = (a: Nation, b: Nation): boolean => {
  const aAlliances = a.alliances || [];
  const bAlliances = b.alliances || [];
  return aAlliances.includes(b.id) && bAlliances.includes(a.id);
};

const hasBrokenAlliance = (player: Nation, ai: Nation): boolean => {
  const treaty = player.treaties?.[ai.id];
  if (!treaty) {
    return false;
  }
  const allianceActive = hasSharedAlliance(player, ai);
  return !allianceActive && treaty.alliance === false && (treaty.truceTurns ?? 0) > 0;
};

const hasUsedNuclearWeapons = (player: Nation, _ai: Nation, gameState: GameState): boolean => {
  const environmentPenalty = player.environmentPenaltyTurns ?? 0;
  const winterLevel = gameState.nuclearWinterLevel ?? 0;
  const radiationZones = gameState.radiationZones?.length ?? 0;
  return environmentPenalty > 0 || winterLevel > 0 || radiationZones > 0;
};

const isNuclearDisarmed = (player: Nation): boolean => {
  const warheads = countWarheads(player);
  const missiles = player.missiles || 0;
  return warheads === 0 && missiles === 0;
};

const causesEnvironmentalDamage = (player: Nation): boolean => {
  return (player.environmentPenaltyTurns ?? 0) > 0;
};

const protectsEnvironment = (player: Nation): boolean => {
  const penalty = player.environmentPenaltyTurns ?? 0;
  const greenShift = player.greenShiftTurns ?? 0;
  return penalty === 0 && greenShift > 0;
};

const getMilitaryStrength = (nation: Nation): number => {
  const missiles = nation.missiles || 0;
  const bombers = (nation.bombers || 0) * 5;
  const submarines = (nation.submarines || 0) * 3;
  return missiles + bombers + submarines;
};

const hasSharedResources = (player: Nation, ai: Nation): boolean => {
  const favor = ai.favorBalances?.[player.id]?.value ?? 0;
  return favor > 20;
};

const hoardsResources = (player: Nation, ai: Nation): boolean => {
  const favor = ai.favorBalances?.[player.id]?.value ?? 0;
  return favor < -10;
};

const hasAdvancedTechnology = (player: Nation): boolean => {
  const researchCount = player.researched ? Object.keys(player.researched).length : 0;
  return researchCount > 10;
};

const hasStrongMilitary = (nation: Nation): boolean => getMilitaryStrength(nation) >= 50;

const hasWeakMilitary = (nation: Nation): boolean => getMilitaryStrength(nation) < 25;

const hasHighTrust = (ai: Nation, playerId: string): boolean => {
  const trust = ai.trustRecords?.[playerId]?.value ?? 50;
  return trust > 70;
};

const keepsPromises = (ai: Nation, playerId: string): boolean => {
  const promises = ai.diplomaticPromises || [];
  return promises.some(promise => promise.toNationId === playerId && !promise.broken);
};

const hasActiveTrade = (player: Nation): boolean => (player.production || 0) > 150;

const imposesSanctions = (player: Nation): boolean => {
  return (player.sanctionTurns ?? 0) > 0 || player.sanctioned === true;
};

const respectsCulture = (player: Nation): boolean => (player.cultureBombCostReduction ?? 0) > 0 || (player.greenShiftTurns ?? 0) > 0;

const threatensCulture = (player: Nation): boolean => (player.coverOpsTurns ?? 0) > 0 || imposesSanctions(player);

// ============================================================================
// Primary Agendas (Always visible)
// ============================================================================

export const PRIMARY_AGENDAS: Agenda[] = [
  {
    id: 'anti-nuclear',
    type: 'primary',
    name: 'Nuclear Pacifist',
    description: 'Despises the use of nuclear weapons and will not tolerate it.',
    isRevealed: true,
    modifiers: [
      {
        condition: 'player used nukes',
        effect: -30,
        description: 'You have used nuclear weapons',
        evaluationBonus: -100,
        applies: (player: Nation, ai: Nation, gameState: GameState) =>
          hasUsedNuclearWeapons(player, ai, gameState),
      },
      {
        condition: 'player has no nukes',
        effect: +10,
        description: 'You show restraint with nuclear weapons',
        evaluationBonus: +20,
        applies: (player: Nation, _ai: Nation, _gameState: GameState) => isNuclearDisarmed(player),
      },
    ],
  },

  {
    id: 'warmonger-hater',
    type: 'primary',
    name: 'Warmonger Hater',
    description: 'Dislikes aggressive nations that declare many wars.',
    isRevealed: true,
    modifiers: [
      {
        condition: 'player declares many wars',
        effect: -25,
        description: 'You have declared too many wars',
        evaluationBonus: -80,
        applies: (player: Nation, _ai: Nation, _gameState: GameState) => getActiveWarCount(player) > 1,
      },
      {
        condition: 'player is peaceful',
        effect: +15,
        description: 'You are a peaceful nation',
        evaluationBonus: +30,
        applies: (player: Nation, _ai: Nation, _gameState: GameState) => getActiveWarCount(player) === 0,
      },
    ],
  },

  {
    id: 'loyal-friend',
    type: 'primary',
    name: 'Loyal Friend',
    description: 'Values long-term alliances and faithful allies.',
    isRevealed: true,
    modifiers: [
      {
        condition: 'long alliance with player',
        effect: +25,
        description: 'Our alliance has stood the test of time',
        evaluationBonus: +60,
        applies: (player: Nation, ai: Nation, _gameState: GameState) => hasSharedAlliance(player, ai),
      },
      {
        condition: 'player broke alliance',
        effect: -40,
        description: 'You betrayed our alliance',
        evaluationBonus: -120,
        applies: (player: Nation, ai: Nation, _gameState: GameState) => hasBrokenAlliance(player, ai),
      },
    ],
  },

  {
    id: 'isolationist',
    type: 'primary',
    name: 'Isolationist',
    description: 'Prefers minimal foreign entanglements and self-sufficiency.',
    isRevealed: true,
    modifiers: [
      {
        condition: 'player has many alliances',
        effect: -15,
        description: 'Your many alliances concern me',
        evaluationBonus: -40,
        applies: (player: Nation, _ai: Nation, _gameState: GameState) => getAllianceCount(player) > 3,
      },
      {
        condition: 'player respects isolation',
        effect: +10,
        description: 'You respect our desire for independence',
        evaluationBonus: +20,
        applies: (player: Nation, _ai: Nation, _gameState: GameState) => getAllianceCount(player) <= 1,
      },
    ],
  },

  {
    id: 'peacemonger',
    type: 'primary',
    name: 'Peacemonger',
    description: 'Seeks peace and diplomacy above all else.',
    isRevealed: true,
    modifiers: [
      {
        condition: 'player promotes peace',
        effect: +20,
        description: 'You are a champion of peace',
        evaluationBonus: +50,
        applies: (player: Nation, _ai: Nation, _gameState: GameState) => !hasActiveWar(player),
      },
      {
        condition: 'player is at war',
        effect: -15,
        description: 'You are engaged in warfare',
        evaluationBonus: -30,
        applies: (player: Nation, _ai: Nation, _gameState: GameState) => hasActiveWar(player),
      },
    ],
  },

  {
    id: 'resource-guardian',
    type: 'primary',
    name: 'Resource Guardian',
    description: 'Values environmental protection and sustainable resource use.',
    isRevealed: true,
    modifiers: [
      {
        condition: 'player protects environment',
        effect: +15,
        description: 'You protect the environment',
        evaluationBonus: +35,
        applies: (player: Nation, _ai: Nation, _gameState: GameState) => protectsEnvironment(player),
      },
      {
        condition: 'player damages environment',
        effect: -20,
        description: 'Your actions harm the environment',
        evaluationBonus: -50,
        applies: (player: Nation, _ai: Nation, _gameState: GameState) => causesEnvironmentalDamage(player),
      },
    ],
  },

  {
    id: 'military-superiority',
    type: 'primary',
    name: 'Military Supremacist',
    description: 'Believes in maintaining military superiority over all others.',
    isRevealed: true,
    modifiers: [
      {
        condition: 'player has strong military',
        effect: +10,
        description: 'You maintain a strong military',
        evaluationBonus: +25,
        applies: (player: Nation, ai: Nation, _gameState: GameState) => {
          const playerStrength = getMilitaryStrength(player);
          const aiStrength = Math.max(1, getMilitaryStrength(ai));
          return playerStrength >= aiStrength * 0.75 && playerStrength <= aiStrength * 1.1;
        },
      },
      {
        condition: 'player threatens our supremacy',
        effect: -25,
        description: 'You challenge our military dominance',
        evaluationBonus: -60,
        applies: (player: Nation, ai: Nation, _gameState: GameState) => {
          const playerStrength = getMilitaryStrength(player);
          const aiStrength = getMilitaryStrength(ai);
          return playerStrength > aiStrength * 1.1;
        },
      },
    ],
  },

  {
    id: 'ideological-purist',
    type: 'primary',
    name: 'Ideological Purist',
    description: 'Has strong ideological beliefs and expects others to follow.',
    isRevealed: true,
    modifiers: [
      {
        condition: 'player follows ideology',
        effect: +20,
        description: 'You share our ideology',
        evaluationBonus: +45,
        applies: (player: Nation, ai: Nation, _gameState: GameState) =>
          player.doctrine !== undefined && player.doctrine === ai.doctrine,
      },
      {
        condition: 'player opposes ideology',
        effect: -25,
        description: 'Your ideology conflicts with ours',
        evaluationBonus: -65,
        applies: (player: Nation, ai: Nation, _gameState: GameState) =>
          !!player.doctrine && !!ai.doctrine && player.doctrine !== ai.doctrine,
      },
    ],
  },
];

// ============================================================================
// Hidden Agendas (Revealed over time)
// ============================================================================

export const HIDDEN_AGENDAS: Agenda[] = [
  {
    id: 'expansionist',
    type: 'hidden',
    name: 'Expansionist',
    description: 'Respects strong territorial expansion and growth.',
    isRevealed: false,
    modifiers: [
      {
        condition: 'player has many territories',
        effect: +15,
        description: 'Impressed by your territorial expansion',
        evaluationBonus: +35,
        applies: (player: Nation, _ai: Nation, _gameState: GameState) => (player.cities || 0) > 5,
      },
      {
        condition: 'player is weak',
        effect: -10,
        description: 'You lack territorial ambition',
        evaluationBonus: -20,
        applies: (player: Nation, _ai: Nation, _gameState: GameState) => (player.cities || 0) <= 2,
      },
    ],
  },

  {
    id: 'resource-hungry',
    type: 'hidden',
    name: 'Resource Hungry',
    description: 'Desires access to resources and values nations that share.',
    isRevealed: false,
    modifiers: [
      {
        condition: 'player shares resources',
        effect: +20,
        description: 'You generously share your resources',
        evaluationBonus: +50,
        applies: (player: Nation, ai: Nation, _gameState: GameState) => hasSharedResources(player, ai),
      },
      {
        condition: 'player hoards resources',
        effect: -10,
        description: 'You hoard your resources',
        evaluationBonus: -25,
        applies: (player: Nation, ai: Nation, _gameState: GameState) => hoardsResources(player, ai),
      },
    ],
  },

  {
    id: 'tech-enthusiast',
    type: 'hidden',
    name: 'Tech Enthusiast',
    description: 'Values scientific progress and technological advancement.',
    isRevealed: false,
    modifiers: [
      {
        condition: 'player has advanced tech',
        effect: +15,
        description: 'Your technological progress impresses me',
        evaluationBonus: +40,
        applies: (player: Nation, _ai: Nation, _gameState: GameState) => hasAdvancedTechnology(player),
      },
      {
        condition: 'player shares technology',
        effect: +20,
        description: 'You share your technological advances',
        evaluationBonus: +55,
        applies: (player: Nation, ai: Nation, _gameState: GameState) =>
          hasAdvancedTechnology(player) && hasSharedResources(player, ai),
      },
    ],
  },

  {
    id: 'militarist',
    type: 'hidden',
    name: 'Militarist',
    description: 'Respects military strength and martial prowess.',
    isRevealed: false,
    modifiers: [
      {
        condition: 'player has strong military',
        effect: +15,
        description: 'Your military strength is admirable',
        evaluationBonus: +40,
        applies: (player: Nation, _ai: Nation, _gameState: GameState) => hasStrongMilitary(player),
      },
      {
        condition: 'player has weak military',
        effect: -10,
        description: 'Your military is weak',
        evaluationBonus: -25,
        applies: (player: Nation, _ai: Nation, _gameState: GameState) => hasWeakMilitary(player),
      },
    ],
  },

  {
    id: 'diplomat',
    type: 'hidden',
    name: 'Diplomat',
    description: 'Values diplomatic engagement and international cooperation.',
    isRevealed: false,
    modifiers: [
      {
        condition: 'player engages diplomatically',
        effect: +20,
        description: 'You are an active diplomat',
        evaluationBonus: +50,
        applies: (player: Nation, ai: Nation, _gameState: GameState) =>
          hasHighTrust(ai, player.id) || getAllianceCount(player) > 0 || getAllianceCount(ai) > 0,
      },
      {
        condition: 'player keeps promises',
        effect: +15,
        description: 'You honor your diplomatic commitments',
        evaluationBonus: +40,
        applies: (player: Nation, ai: Nation, _gameState: GameState) => keepsPromises(ai, player.id),
      },
    ],
  },

  {
    id: 'opportunist',
    type: 'hidden',
    name: 'Opportunist',
    description: 'Values flexibility and changing allegiances when beneficial.',
    isRevealed: false,
    modifiers: [
      {
        condition: 'mutually beneficial',
        effect: +10,
        description: 'This benefits us both',
        evaluationBonus: +30,
        applies: (player: Nation, ai: Nation, _gameState: GameState) =>
          hasSharedResources(player, ai) || getAllianceCount(player) > 0 || getAllianceCount(ai) > 0,
      },
      {
        condition: 'player is rigid',
        effect: -5,
        description: 'You are too inflexible',
        evaluationBonus: -15,
        applies: (player: Nation, ai: Nation, _gameState: GameState) =>
          getAllianceCount(player) === 0 && !hasSharedResources(player, ai),
      },
    ],
  },

  {
    id: 'trade-partner',
    type: 'hidden',
    name: 'Trade Partner',
    description: 'Values economic cooperation and mutually beneficial trade.',
    isRevealed: false,
    modifiers: [
      {
        condition: 'player trades actively',
        effect: +15,
        description: 'Our trade relationship is valuable',
        evaluationBonus: +40,
        applies: (player: Nation, _ai: Nation, _gameState: GameState) => hasActiveTrade(player),
      },
      {
        condition: 'player imposes sanctions',
        effect: -20,
        description: 'Your sanctions harm our trade',
        evaluationBonus: -55,
        applies: (player: Nation, _ai: Nation, _gameState: GameState) => imposesSanctions(player),
      },
    ],
  },

  {
    id: 'cultural-preservationist',
    type: 'hidden',
    name: 'Cultural Preservationist',
    description: 'Values cultural heritage and tradition.',
    isRevealed: false,
    modifiers: [
      {
        condition: 'player respects culture',
        effect: +15,
        description: 'You respect our cultural heritage',
        evaluationBonus: +35,
        applies: (player: Nation, _ai: Nation, _gameState: GameState) => respectsCulture(player),
      },
      {
        condition: 'player threatens culture',
        effect: -20,
        description: 'You threaten our cultural identity',
        evaluationBonus: -50,
        applies: (player: Nation, _ai: Nation, _gameState: GameState) => threatensCulture(player),
      },
    ],
  },
];

/**
 * Get all available agendas
 */
export function getAllAgendas(): Agenda[] {
  return [...PRIMARY_AGENDAS, ...HIDDEN_AGENDAS];
}

/**
 * Get a specific agenda by ID
 */
export function getAgendaById(id: string): Agenda | undefined {
  return getAllAgendas().find(a => a.id === id);
}

/**
 * Get all primary agendas
 */
export function getPrimaryAgendas(): Agenda[] {
  return PRIMARY_AGENDAS;
}

/**
 * Get all hidden agendas
 */
export function getHiddenAgendas(): Agenda[] {
  return HIDDEN_AGENDAS;
}
