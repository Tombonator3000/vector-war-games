/**
 * Agenda Definitions
 *
 * Defines all primary and hidden agendas for AI leaders.
 * Each agenda represents a personality trait that affects diplomatic decisions.
 *
 * Inspired by Civilization's agenda system.
 */

import type { Nation } from '@/types/game';
import type { Agenda, AgendaModifier } from '@/types/negotiation';

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
      },
      {
        condition: 'player has no nukes',
        effect: +10,
        description: 'You show restraint with nuclear weapons',
        evaluationBonus: +20,
      },
    ],
    checkCondition: (player: Nation, ai: Nation, gameState: any) => {
      // Check if player has used nuclear weapons
      // In a real implementation, this would check game history
      return (player.warheads && Object.keys(player.warheads).length > 0);
    },
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
      },
      {
        condition: 'player is peaceful',
        effect: +15,
        description: 'You are a peaceful nation',
        evaluationBonus: +30,
      },
    ],
    checkCondition: (player: Nation, ai: Nation, gameState: any) => {
      // This would check war history - placeholder for now
      return false;
    },
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
      },
      {
        condition: 'player broke alliance',
        effect: -40,
        description: 'You betrayed our alliance',
        evaluationBonus: -120,
      },
    ],
    checkCondition: (player: Nation, ai: Nation, gameState: any) => {
      const hasAlliance = ai.alliances?.includes(player.id);
      return hasAlliance || false;
    },
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
      },
      {
        condition: 'player respects isolation',
        effect: +10,
        description: 'You respect our desire for independence',
        evaluationBonus: +20,
      },
    ],
    checkCondition: (player: Nation, ai: Nation, gameState: any) => {
      const allianceCount = player.alliances?.length || 0;
      return allianceCount > 3;
    },
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
      },
      {
        condition: 'player is at war',
        effect: -15,
        description: 'You are engaged in warfare',
        evaluationBonus: -30,
      },
    ],
    checkCondition: (player: Nation, ai: Nation, gameState: any) => {
      // Check if player is currently at war
      const atWar = player.treaties && Object.values(player.treaties).some(
        (treaty: any) => treaty.alliance === false && treaty.truceTurns === undefined
      );
      return atWar || false;
    },
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
      },
      {
        condition: 'player damages environment',
        effect: -20,
        description: 'Your actions harm the environment',
        evaluationBonus: -50,
      },
    ],
    checkCondition: (player: Nation, ai: Nation, gameState: any) => {
      // Check environmental penalties
      return (player.environmentPenaltyTurns || 0) > 0;
    },
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
      },
      {
        condition: 'player threatens our supremacy',
        effect: -25,
        description: 'You challenge our military dominance',
        evaluationBonus: -60,
      },
    ],
    checkCondition: (player: Nation, ai: Nation, gameState: any) => {
      const playerMilitary = (player.missiles || 0) + (player.bombers || 0) * 5;
      const aiMilitary = (ai.missiles || 0) + (ai.bombers || 0) * 5;
      return playerMilitary > aiMilitary;
    },
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
      },
      {
        condition: 'player opposes ideology',
        effect: -25,
        description: 'Your ideology conflicts with ours',
        evaluationBonus: -65,
      },
    ],
    checkCondition: (player: Nation, ai: Nation, gameState: any) => {
      // Check if doctrines match
      return player.doctrine !== ai.doctrine;
    },
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
      },
      {
        condition: 'player is weak',
        effect: -10,
        description: 'You lack territorial ambition',
        evaluationBonus: -20,
      },
    ],
    checkCondition: (player: Nation, ai: Nation, gameState: any) => {
      // Check territory count
      const cities = player.cities || 1;
      return cities > 5;
    },
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
      },
      {
        condition: 'player hoards resources',
        effect: -10,
        description: 'You hoard your resources',
        evaluationBonus: -25,
      },
    ],
    checkCondition: (player: Nation, ai: Nation, gameState: any) => {
      // Check if player has sent aid recently
      const favorBalance = ai.favorBalances?.[player.id];
      return favorBalance && favorBalance.value > 20;
    },
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
      },
      {
        condition: 'player shares technology',
        effect: +20,
        description: 'You share your technological advances',
        evaluationBonus: +55,
      },
    ],
    checkCondition: (player: Nation, ai: Nation, gameState: any) => {
      const researchCount = player.researched ? Object.keys(player.researched).length : 0;
      return researchCount > 10;
    },
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
      },
      {
        condition: 'player has weak military',
        effect: -10,
        description: 'Your military is weak',
        evaluationBonus: -25,
      },
    ],
    checkCondition: (player: Nation, ai: Nation, gameState: any) => {
      const military = (player.missiles || 0) + (player.bombers || 0) * 5;
      return military > 50;
    },
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
      },
      {
        condition: 'player keeps promises',
        effect: +15,
        description: 'You honor your diplomatic commitments',
        evaluationBonus: +40,
      },
    ],
    checkCondition: (player: Nation, ai: Nation, gameState: any) => {
      const trust = ai.trustRecords?.[player.id]?.value || 50;
      return trust > 70;
    },
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
      },
      {
        condition: 'player is rigid',
        effect: -5,
        description: 'You are too inflexible',
        evaluationBonus: -15,
      },
    ],
    checkCondition: (player: Nation, ai: Nation, gameState: any) => {
      // Opportunist is always looking for advantage
      return true;
    },
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
      },
      {
        condition: 'player imposes sanctions',
        effect: -20,
        description: 'Your sanctions harm our trade',
        evaluationBonus: -55,
      },
    ],
    checkCondition: (player: Nation, ai: Nation, gameState: any) => {
      const production = player.production || 0;
      return production > 150;
    },
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
      },
      {
        condition: 'player threatens culture',
        effect: -20,
        description: 'You threaten our cultural identity',
        evaluationBonus: -50,
      },
    ],
    checkCondition: (player: Nation, ai: Nation, gameState: any) => {
      // Check for cultural aggression - placeholder
      return false;
    },
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
