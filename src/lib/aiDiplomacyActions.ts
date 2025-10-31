/**
 * AI Diplomacy Action Functions
 *
 * Functions for AI diplomatic actions including treaties, sanctions, alliances, and aid.
 * Extracted from Index.tsx as part of refactoring effort.
 */

import type { Nation } from '@/types/game';
import { canAfford, pay } from '@/lib/gameUtils';
import { getNationById, ensureTreatyRecord, adjustThreat } from '@/lib/nationUtils';

/**
 * Log diplomacy message
 * @param actor - Nation performing the action
 * @param message - Message to log
 * @param logFn - Logging function to use
 */
function aiLogDiplomacy(actor: Nation, message: string, logFn: (msg: string, type?: string) => void) {
  logFn(`${actor.name} ${message}`);
}

/**
 * Sign a mutual truce between two nations
 */
export function aiSignMutualTruce(
  actor: Nation,
  target: Nation,
  turns: number,
  logFn: (msg: string, type?: string) => void,
  reason?: string
): void {
  const treaty = ensureTreatyRecord(actor, target);
  const reciprocal = ensureTreatyRecord(target, actor);
  treaty.truceTurns = Math.max(treaty.truceTurns || 0, turns);
  reciprocal.truceTurns = Math.max(reciprocal.truceTurns || 0, turns);
  aiLogDiplomacy(actor, `agrees to a ${turns}-turn truce with ${target.name}${reason ? ` (${reason})` : ''}.`, logFn);
  adjustThreat(actor, target.id, -3);
  adjustThreat(target, actor.id, -2);
}

/**
 * Sign a non-aggression pact
 */
export function aiSignNonAggressionPact(
  actor: Nation,
  target: Nation,
  logFn: (msg: string, type?: string) => void
): boolean {
  const cost = { intel: 15 };
  if (!canAfford(actor, cost)) return false;
  pay(actor, cost);
  aiSignMutualTruce(actor, target, 5, logFn, 'non-aggression pact');
  return true;
}

/**
 * Form an alliance between two nations
 */
export function aiFormAlliance(
  actor: Nation,
  target: Nation,
  logFn: (msg: string, type?: string) => void
): boolean {
  const cost = { production: 10, intel: 40 };
  if (!canAfford(actor, cost)) return false;
  pay(actor, cost);
  const treaty = ensureTreatyRecord(actor, target);
  const reciprocal = ensureTreatyRecord(target, actor);
  treaty.truceTurns = 999;
  reciprocal.truceTurns = 999;
  treaty.alliance = true;
  reciprocal.alliance = true;
  aiLogDiplomacy(actor, `enters an alliance with ${target.name}.`, logFn);
  adjustThreat(actor, target.id, -5);
  adjustThreat(target, actor.id, -5);
  return true;
}

/**
 * Send economic aid to another nation
 */
export function aiSendAid(
  actor: Nation,
  target: Nation,
  logFn: (msg: string, type?: string) => void
): boolean {
  const cost = { production: 20 };
  if (!canAfford(actor, cost)) return false;
  pay(actor, cost);
  target.instability = Math.max(0, (target.instability || 0) - 10);
  aiLogDiplomacy(actor, `sends economic aid to ${target.name}, reducing their instability.`, logFn);
  adjustThreat(target, actor.id, -2);
  return true;
}

/**
 * Impose sanctions on another nation
 */
export function aiImposeSanctions(
  actor: Nation,
  target: Nation,
  logFn: (msg: string, type?: string) => void
): boolean {
  if (target.sanctioned && target.sanctionedBy?.[actor.id]) return false;
  const cost = { intel: 15 };
  if (!canAfford(actor, cost)) return false;
  pay(actor, cost);
  target.sanctioned = true;
  target.sanctionTurns = Math.max(5, (target.sanctionTurns || 0) + 5);
  target.sanctionedBy = target.sanctionedBy || {};
  target.sanctionedBy[actor.id] = (target.sanctionedBy[actor.id] || 0) + 5;
  aiLogDiplomacy(actor, `imposes sanctions on ${target.name}.`, logFn);
  adjustThreat(target, actor.id, 3);
  return true;
}

/**
 * Break treaties with another nation
 */
export function aiBreakTreaties(
  actor: Nation,
  target: Nation,
  logFn: (msg: string, type?: string) => void,
  reason?: string
): boolean {
  const treaty = ensureTreatyRecord(actor, target);
  const reciprocal = ensureTreatyRecord(target, actor);
  const hadAgreements = !!(treaty.truceTurns || treaty.alliance);
  if (!hadAgreements) return false;
  delete treaty.truceTurns;
  delete reciprocal.truceTurns;
  delete treaty.alliance;
  delete reciprocal.alliance;
  aiLogDiplomacy(actor, `terminates agreements with ${target.name}${reason ? ` (${reason})` : ''}.`, logFn);
  adjustThreat(actor, target.id, 6);
  adjustThreat(target, actor.id, 8);
  return true;
}

/**
 * Respond to sanctions imposed on the actor nation
 */
export function aiRespondToSanctions(
  actor: Nation,
  nations: Nation[],
  logFn: (msg: string, type?: string) => void
): boolean {
  if (!actor.sanctioned || !actor.sanctionedBy) return false;
  const sanctioners = Object.keys(actor.sanctionedBy)
    .map(id => getNationById(nations, id))
    .filter((nation): nation is Nation => !!nation && nation.population > 0);

  if (sanctioners.length === 0) return false;

  const prioritized = sanctioners.sort((a, b) => {
    const aThreat = actor.threats?.[a.id] || 0;
    const bThreat = actor.threats?.[b.id] || 0;
    return bThreat - aThreat;
  });

  const topSanctioner = prioritized[0];
  if (!topSanctioner) return false;

  // Try counter-sanctions if affordable and no alliance
  const treaty = actor.treaties?.[topSanctioner.id];
  if ((!treaty || !treaty.alliance) && aiImposeSanctions(actor, topSanctioner, logFn)) {
    aiLogDiplomacy(actor, `retaliates against ${topSanctioner.name} for sanctions.`, logFn);
    return true;
  }

  // Attempt to de-escalate via truce if counter-sanctions failed
  if (!treaty?.truceTurns) {
    aiSignMutualTruce(actor, topSanctioner, 2, logFn, 'attempting to ease sanctions');
    return true;
  }

  return false;
}

/**
 * Handle strained treaty relationships
 */
export function aiHandleTreatyStrain(
  actor: Nation,
  nations: Nation[],
  logFn: (msg: string, type?: string) => void
): boolean {
  if (!actor.treaties) return false;
  const strained = Object.entries(actor.treaties)
    .map(([id, treaty]) => ({ id, treaty, partner: getNationById(nations, id) }))
    .filter(({ treaty, partner }) => partner && (treaty?.truceTurns || treaty?.alliance));

  for (const { id, treaty, partner } of strained) {
    if (!partner) continue;
    const threat = actor.threats?.[id] || 0;
    if (threat > 12) {
      return aiBreakTreaties(actor, partner, logFn, 'due to rising hostilities');
    }
    if (treaty?.alliance && partner.sanctionedBy?.[actor.id]) {
      // Alliance member sanctioning us is a breach
      return aiBreakTreaties(actor, partner, logFn, 'after alliance breach');
    }
  }

  return false;
}

/**
 * Handle diplomatic urgencies (sanctions and treaty strain)
 */
export function aiHandleDiplomaticUrgencies(
  actor: Nation,
  nations: Nation[],
  logFn: (msg: string, type?: string) => void
): boolean {
  if (aiRespondToSanctions(actor, nations, logFn)) {
    return true;
  }

  if (aiHandleTreatyStrain(actor, nations, logFn)) {
    return true;
  }

  return false;
}

/**
 * Attempt various diplomatic actions based on threats and relationships
 */
export function aiAttemptDiplomacy(
  actor: Nation,
  nations: Nation[],
  logFn: (msg: string, type?: string) => void
): boolean {
  const others = nations.filter(n => n !== actor && n.population > 0);
  if (others.length === 0) return false;

  const sortedByThreat = others
    .map(target => ({ target, threat: actor.threats?.[target.id] || 0 }))
    .sort((a, b) => b.threat - a.threat);

  const highest = sortedByThreat[0];
  if (highest && highest.threat >= 8) {
    const treaty = actor.treaties?.[highest.target.id];
    if (!treaty?.truceTurns) {
      if (highest.threat >= 12 && aiSignNonAggressionPact(actor, highest.target, logFn)) {
        return true;
      }
      aiSignMutualTruce(actor, highest.target, 2, logFn, 'to diffuse tensions');
      return true;
    }
    if (!treaty?.alliance && highest.threat >= 15 && aiBreakTreaties(actor, highest.target, logFn, 'after repeated provocations')) {
      return true;
    }
  }

  // Sanction persistently hostile nations
  const sanctionTarget = sortedByThreat.find(entry => entry.threat >= 10 && !actor.treaties?.[entry.target.id]?.alliance);
  if (sanctionTarget && Math.random() < 0.6 && aiImposeSanctions(actor, sanctionTarget.target, logFn)) {
    return true;
  }

  // Support unstable allies or low-threat partners
  const aidCandidate = others
    .filter(target => (actor.treaties?.[target.id]?.alliance || actor.treaties?.[target.id]?.truceTurns) && (target.instability || 0) >= 10)
    .sort((a, b) => (b.instability || 0) - (a.instability || 0))[0];

  if (aidCandidate && aiSendAid(actor, aidCandidate, logFn)) {
    return true;
  }

  // Form alliances with trusted nations occasionally
  if (Math.random() < 0.15) {
    const allianceCandidate = others
      .filter(target => {
        const threat = actor.threats?.[target.id] || 0;
        const treaty = actor.treaties?.[target.id];
        return threat <= 2 && !(treaty?.alliance);
      })
      .sort((a, b) => (actor.threats?.[a.id] || 0) - (actor.threats?.[b.id] || 0))[0];

    if (allianceCandidate && aiFormAlliance(actor, allianceCandidate, logFn)) {
      return true;
    }
  }

  // Offer truces when moderately threatened
  const moderateThreat = sortedByThreat.find(entry => entry.threat >= 5 && !(actor.treaties?.[entry.target.id]?.truceTurns));
  if (moderateThreat && Math.random() < 0.6) {
    aiSignMutualTruce(actor, moderateThreat.target, 2, logFn);
    return true;
  }

  return false;
}
