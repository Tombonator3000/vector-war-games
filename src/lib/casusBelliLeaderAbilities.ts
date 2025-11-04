/**
 * Casus Belli Leader Abilities Integration
 *
 * Special Casus Belli granted by leader abilities.
 * Some leaders can declare war with special justifications or bypass requirements.
 */

import type { Nation } from '../types/game';
import type { CasusBelli } from '../types/casusBelli';
import { createCasusBelli } from './casusBelliUtils';

/**
 * Leader-specific Casus Belli types
 */
export interface LeaderCasusBelliAbility {
  leaderId: string;
  abilityId: string;
  casusBelliType: 'leader-special';
  justificationBonus: number;
  description: string;
  conditions?: {
    requiresIdeology?: string;
    requiresThreatLevel?: number;
    requiresGrievances?: boolean;
    bypassesTruces?: boolean;
  };
}

/**
 * Define leader abilities that grant special Casus Belli
 */
export const LEADER_CASUS_BELLI_ABILITIES: LeaderCasusBelliAbility[] = [
  {
    leaderId: 'jfk',
    abilityId: 'crisis-resolution',
    casusBelliType: 'leader-special',
    justificationBonus: 20,
    description: 'JFK can declare defensive wars with reduced justification requirements',
    conditions: {
      requiresThreatLevel: 50,
    },
  },
  {
    leaderId: 'khrushchev',
    abilityId: 'iron-curtain-strike',
    casusBelliType: 'leader-special',
    justificationBonus: 25,
    description: 'Khrushchev can launch preemptive strikes with enhanced justification',
    conditions: {
      requiresThreatLevel: 40,
    },
  },
  {
    leaderId: 'castro',
    abilityId: 'revolutionary-uprising',
    casusBelliType: 'leader-special',
    justificationBonus: 30,
    description: 'Castro can support liberation wars with revolutionary fervor',
  },
  {
    leaderId: 'nyarlathotep',
    abilityId: 'master-deceiver',
    casusBelliType: 'leader-special',
    justificationBonus: 40,
    description: 'Nyarlathotep can fabricate Casus Belli through deception',
    conditions: {
      bypassesTruces: true, // Can even break truces
    },
  },
];

/**
 * Check if a leader can grant special Casus Belli
 */
export function canLeaderGrantCasusBelli(
  leader: Nation,
  target: Nation,
  abilityId: string
): boolean {
  const ability = LEADER_CASUS_BELLI_ABILITIES.find(
    (a) => a.leaderId === leader.leader && a.abilityId === abilityId
  );

  if (!ability) return false;

  // Check conditions
  if (ability.conditions?.requiresThreatLevel) {
    const threatLevel = target.threats?.[leader.id] || 0;
    if (threatLevel < ability.conditions.requiresThreatLevel) return false;
  }

  if (ability.conditions?.requiresIdeology) {
    if (leader.ideologyState?.ideology !== ability.conditions.requiresIdeology) {
      return false;
    }
  }

  if (ability.conditions?.requiresGrievances) {
    const hasGrievances = leader.grievances?.some(
      (g) => g.againstNationId === target.id && !g.resolved
    );
    if (!hasGrievances) return false;
  }

  return true;
}

/**
 * Create special Casus Belli from leader ability
 */
export function createLeaderCasusBelli(
  leader: Nation,
  target: Nation,
  abilityId: string,
  currentTurn: number
): CasusBelli | null {
  const ability = LEADER_CASUS_BELLI_ABILITIES.find(
    (a) => a.leaderId === leader.leader && a.abilityId === abilityId
  );

  if (!ability) return null;

  if (!canLeaderGrantCasusBelli(leader, target, abilityId)) return null;

  // Calculate total justification
  let baseJustification = 30; // Base for leader abilities
  baseJustification += ability.justificationBonus;

  // Additional justification from threat level
  const threatLevel = target.threats?.[leader.id] || 0;
  baseJustification += Math.min(20, threatLevel / 5);

  const casusBelli = createCasusBelli(
    'leader-special',
    leader.id,
    target.id,
    Math.min(100, baseJustification),
    ability.description,
    currentTurn,
    {
      leaderAbilityId: abilityId,
      expiresIn: 15, // Leader CBs expire in 15 turns
      publicSupport: 60 + ability.justificationBonus / 2, // Higher public support
    }
  );

  return casusBelli;
}

/**
 * Get all leader abilities that can grant Casus Belli for a nation
 */
export function getLeaderCasusBelliAbilities(leader: Nation): LeaderCasusBelliAbility[] {
  return LEADER_CASUS_BELLI_ABILITIES.filter((a) => a.leaderId === leader.leader);
}

/**
 * Apply leader-specific war bonuses
 */
export function applyLeaderWarBonuses(
  leader: Nation,
  casusBelli: CasusBelli
): {
  attackBonus?: number;
  defenseBonus?: number;
  publicSupportBonus?: number;
  specialEffects?: string[];
} {
  const bonuses: {
    attackBonus?: number;
    defenseBonus?: number;
    publicSupportBonus?: number;
    specialEffects?: string[];
  } = {};

  // Leader-specific war bonuses based on CB type
  if (casusBelli.leaderAbilityId) {
    switch (leader.leader) {
      case 'khrushchev':
        bonuses.attackBonus = 15;
        bonuses.specialEffects = ['First strike missile bonus'];
        break;

      case 'castro':
        bonuses.publicSupportBonus = 20;
        bonuses.specialEffects = ['Revolutionary fervor', 'Morale boost'];
        break;

      case 'jfk':
        bonuses.defenseBonus = 20;
        bonuses.specialEffects = ['Crisis management', 'Allied support'];
        break;

      case 'nyarlathotep':
        bonuses.attackBonus = 25;
        bonuses.specialEffects = [
          'Corruption spreads',
          'Enemy morale penalty',
          'Reality distortion',
        ];
        break;
    }
  }

  // Special CB types grant bonuses
  if (casusBelli.type === 'defensive-pact') {
    bonuses.defenseBonus = (bonuses.defenseBonus || 0) + 10;
    bonuses.publicSupportBonus = (bonuses.publicSupportBonus || 0) + 15;
  }

  if (casusBelli.type === 'holy-war' && leader.ideologyState?.ideology) {
    const zealotry = leader.ideologyState.zealotry || 0;
    bonuses.publicSupportBonus = (bonuses.publicSupportBonus || 0) + zealotry * 30;
  }

  return bonuses;
}

/**
 * Check if leader can bypass war requirements
 */
export function canLeaderBypassWarRequirements(
  leader: Nation,
  abilityId: string
): {
  canBypassTruce: boolean;
  canBypassAlliance: boolean;
  canBypassCouncil: boolean;
} {
  const ability = LEADER_CASUS_BELLI_ABILITIES.find(
    (a) => a.leaderId === leader.leader && a.abilityId === abilityId
  );

  if (!ability) {
    return {
      canBypassTruce: false,
      canBypassAlliance: false,
      canBypassCouncil: false,
    };
  }

  return {
    canBypassTruce: ability.conditions?.bypassesTruces || false,
    canBypassAlliance: false, // No leader can attack allies
    canBypassCouncil: leader.leader === 'nyarlathotep', // Only Great Old Ones ignore council
  };
}

/**
 * Get leader war declaration flavor text
 */
export function getLeaderWarDeclarationFlavor(
  leader: Nation,
  target: Nation,
  casusBelli: CasusBelli
): string {
  const leaderFlavor: Record<string, string> = {
    jfk: `"We will not negotiate with fear, but we will never fear to negotiate. However, ${target.name} has left us no choice."`,
    khrushchev: `"We will bury them! ${target.name} must face the iron fist of the people!"`,
    castro: `"¡Patria o Muerte! The revolution comes to ${target.name}!"`,
    nyarlathotep: `"The crawling chaos spreads... ${target.name} will know the true face of horror."`,
  };

  return (
    leaderFlavor[leader.leader] ||
    `${leader.name} declares war on ${target.name} with Casus Belli: ${casusBelli.type}`
  );
}

/**
 * Calculate leader influence on peace negotiations
 */
export function getLeaderPeaceNegotiationModifier(
  leader: Nation,
  warScore: number
): {
  willingnessToNegotiate: number; // -50 to +50
  demandModifier: number; // 0.5 to 2.0
  flavorText: string;
} {
  const modifiers: Record<
    string,
    { willingnessToNegotiate: number; demandModifier: number; flavorText: string }
  > = {
    jfk: {
      willingnessToNegotiate: 30,
      demandModifier: 0.8,
      flavorText: 'JFK seeks diplomatic resolution',
    },
    khrushchev: {
      willingnessToNegotiate: warScore > 60 ? 20 : -20,
      demandModifier: 1.3,
      flavorText:
        warScore > 60
          ? 'Khrushchev demands unconditional surrender'
          : 'Khrushchev refuses to show weakness',
    },
    castro: {
      willingnessToNegotiate: -10,
      demandModifier: 1.1,
      flavorText: 'Castro fights for revolutionary ideals',
    },
    nyarlathotep: {
      willingnessToNegotiate: -50,
      demandModifier: 2.0,
      flavorText: 'The crawling chaos seeks total domination',
    },
  };

  return (
    modifiers[leader.leader] || {
      willingnessToNegotiate: 0,
      demandModifier: 1.0,
      flavorText: `${leader.name} considers peace terms`,
    }
  );
}
