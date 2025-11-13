/**
 * AI Diplomacy Action Functions
 *
 * Functions for AI diplomatic actions including treaties, sanctions, alliances, and aid.
 * Extracted from Index.tsx as part of refactoring effort.
 *
 * PHASE 2 INTEGRATION: Now creates grievances and specialized alliances
 * PHASE 3 INTEGRATION: AI proactive diplomacy - AI-initiated negotiations
 */

import type { Nation } from '@/types/game';
import type { AllianceType } from '@/types/specializedAlliances';
import type { AIInitiatedNegotiation } from '@/types/negotiation';
import type { AidType, SanctionType } from '@/types/regionalMorale';
import { canAfford, pay } from '@/lib/gameUtils';
import { getNationById, ensureTreatyRecord, adjustThreat } from '@/lib/nationUtils';
import { onTreatyBroken, onSanctionHarm, formSpecializedAlliance, breakSpecializedAlliance } from '@/lib/diplomacyPhase2Integration';
import { checkAllTriggers } from '@/lib/aiNegotiationTriggers';
import { generateAINegotiationDeal } from '@/lib/aiNegotiationContentGenerator';
import { evaluateNegotiation } from '@/lib/aiNegotiationEvaluator';
import { applyNegotiationDeal } from '@/lib/negotiationUtils';
import { GameStateManager, type LocalGameState, type LocalNation } from '@/state/GameStateManager';

export interface InternationalPressureSanctionEvent {
  imposingNationId: string;
  targetNationId: string;
  duration: number;
  severity: number;
  types: SanctionType[];
}

export interface InternationalPressureAidEvent {
  donorNationId: string;
  recipientNationId: string;
  duration: number;
  types: AidType[];
  productionCommitment: number;
}

export interface InternationalPressureCallbacks {
  onSanctionsImposed?: (event: InternationalPressureSanctionEvent) => void;
  onAidSent?: (event: InternationalPressureAidEvent) => void;
}

let internationalPressureCallbacks: InternationalPressureCallbacks | null = null;

export function registerInternationalPressureCallbacks(
  callbacks: InternationalPressureCallbacks | null,
): void {
  internationalPressureCallbacks = callbacks;
}

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
 * PHASE 2: Now creates specialized alliances
 */
export function aiFormAlliance(
  actor: Nation,
  target: Nation,
  logFn: (msg: string, type?: string) => void,
  currentTurn?: number,
  allianceType?: AllianceType
): boolean {
  const cost = { production: 10, intel: 40 };
  if (!canAfford(actor, cost)) return false;
  pay(actor, cost);

  // PHASE 2: Create specialized alliance if turn number provided
  if (currentTurn !== undefined) {
    // Default to military alliance if not specified
    const type = allianceType || 'military';
    formSpecializedAlliance(actor, target, type, currentTurn);
    aiLogDiplomacy(actor, `enters a ${type} alliance with ${target.name}.`, logFn);
  } else {
    // Fallback to old system
    const treaty = ensureTreatyRecord(actor, target);
    const reciprocal = ensureTreatyRecord(target, actor);
    treaty.truceTurns = 999;
    reciprocal.truceTurns = 999;
    treaty.alliance = true;
    reciprocal.alliance = true;
    aiLogDiplomacy(actor, `enters an alliance with ${target.name}.`, logFn);
  }

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
  internationalPressureCallbacks?.onAidSent?.({
    donorNationId: actor.id,
    recipientNationId: target.id,
    duration: 4,
    types: ['economic'] as AidType[],
    productionCommitment: cost.production,
  });
  return true;
}

/**
 * Impose sanctions on another nation
 * PHASE 2: Creates grievance if sanctions cause significant harm
 */
export function aiImposeSanctions(
  actor: Nation,
  target: Nation,
  logFn: (msg: string, type?: string) => void,
  currentTurn?: number
): boolean {
  if (target.sanctioned && target.sanctionedBy?.[actor.id]) return false;
  const cost = { intel: 15 };
  if (!canAfford(actor, cost)) return false;
  pay(actor, cost);
  target.sanctioned = true;
  target.sanctionTurns = Math.max(5, (target.sanctionTurns || 0) + 5);
  target.sanctionedBy = target.sanctionedBy || {};
  const existingSanctions = target.sanctionedBy[actor.id] || 0;
  target.sanctionedBy[actor.id] = existingSanctions + 5;

  // PHASE 2: Create grievance if this is adding to existing sanctions (showing harm)
  if (currentTurn !== undefined && existingSanctions > 0) {
    onSanctionHarm(target, actor, currentTurn);
  }

  aiLogDiplomacy(actor, `imposes sanctions on ${target.name}.`, logFn);
  adjustThreat(target, actor.id, 3);
  const severityLevel = Math.max(1, Math.min(5, Math.round((target.sanctionedBy[actor.id] || 5) / 5)));
  internationalPressureCallbacks?.onSanctionsImposed?.({
    imposingNationId: actor.id,
    targetNationId: target.id,
    duration: 5,
    severity: severityLevel,
    types: ['trade', 'financial'] as SanctionType[],
  });
  return true;
}

/**
 * Break treaties with another nation
 * PHASE 2: Now creates grievances
 */
export function aiBreakTreaties(
  actor: Nation,
  target: Nation,
  logFn: (msg: string, type?: string) => void,
  reason?: string,
  currentTurn?: number
): boolean {
  const treaty = ensureTreatyRecord(actor, target);
  const reciprocal = ensureTreatyRecord(target, actor);
  const hadAgreements = !!(treaty.truceTurns || treaty.alliance);
  if (!hadAgreements) return false;

  const wasAlliance = !!(treaty.alliance);

  // PHASE 2: Create grievance for breaking treaty
  if (currentTurn !== undefined) {
    onTreatyBroken(target, actor, wasAlliance, currentTurn);
  }

  // Break specialized alliance if exists
  if (wasAlliance && currentTurn !== undefined) {
    breakSpecializedAlliance(actor, target.id, target, currentTurn);
  }

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

  // Form alliances with trusted nations - DYNAMIC probability based on situation
  // Calculate dynamic alliance probability based on:
  // 1. Shared threats (common enemy with high military power)
  // 2. Relationship strength
  // 3. Desperation (low territories, low population)

  let allianceChance = 0.15; // Base 15% chance

  // Check for desperation (nation is weak)
  const actorTerritories = (actor as any).controlledTerritories?.length || 5;
  const actorPopulation = actor.population || 0;
  if (actorTerritories <= 3 || actorPopulation < 30) {
    allianceChance += 0.35; // +35% when desperate (total 50%)
  }

  // Check for shared threats (common powerful enemy)
  const sharedThreatBonus = others.some(enemy => {
    const actorThreat = actor.threats?.[enemy.id] || 0;
    const enemyMilitaryPower = (enemy.missiles || 0) + (enemy.bombers || 0) + ((enemy as any).conventionalUnits?.length || 0);
    // If enemy is threatening (threat >= 8) and has strong military (>10), increase alliance desire
    if (actorThreat >= 8 && enemyMilitaryPower > 10) {
      return true;
    }
    return false;
  });

  if (sharedThreatBonus) {
    allianceChance += 0.25; // +25% when facing powerful enemy (total 40% or 75% if desperate)
  }

  if (Math.random() < allianceChance) {
    const allianceCandidate = others
      .filter(target => {
        const threat = actor.threats?.[target.id] || 0;
        const treaty = actor.treaties?.[target.id];
        // Also consider relationship - prefer targets with positive relationship
        const relationship = actor.relationships?.[target.id] || 0;
        return threat <= 2 && !(treaty?.alliance) && relationship >= -10;
      })
      .sort((a, b) => {
        // Sort by relationship first, then by low threat
        const relA = actor.relationships?.[a.id] || 0;
        const relB = actor.relationships?.[b.id] || 0;
        if (relA !== relB) return relB - relA; // Higher relationship first
        return (actor.threats?.[a.id] || 0) - (actor.threats?.[b.id] || 0);
      })[0];

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

// ============================================================================
// PHASE 3: AI Proactive Diplomacy
// ============================================================================

/**
 * Check if negotiation would be a duplicate or too recent
 */
function shouldBlockDuplicateNegotiation(
  actor: Nation,
  targetNation: Nation,
  purpose: string,
  currentTurn: number
): boolean {
  // Check if already have an active treaty/alliance of the same type
  if (purpose === 'offer-alliance' || purpose === 'mutual-defense') {
    if (actor.alliances?.includes(targetNation.id)) {
      return true; // Already allied
    }
  }

  if (purpose === 'peace-offer' || purpose === 'reconciliation') {
    const treaty = actor.treaties?.[targetNation.id];
    if (treaty?.truceTurns && treaty.truceTurns > 0) {
      return true; // Already have active truce
    }
  }

  // Check cooldown tracking (stored in nation's aiDiplomacyCooldowns)
  const cooldowns = (actor as any).aiDiplomacyCooldowns || {};
  const key = `${targetNation.id}:${purpose}`;
  const lastNegotiation = cooldowns[key];

  if (lastNegotiation && currentTurn - lastNegotiation < 5) {
    return true; // Too recent (within 5 turns)
  }

  return false;
}

/**
 * Record negotiation for cooldown tracking
 */
function recordNegotiationCooldown(
  actor: Nation,
  targetNation: Nation,
  purpose: string,
  currentTurn: number
): void {
  if (!(actor as any).aiDiplomacyCooldowns) {
    (actor as any).aiDiplomacyCooldowns = {};
  }
  const key = `${targetNation.id}:${purpose}`;
  (actor as any).aiDiplomacyCooldowns[key] = currentTurn;
}

/**
 * Check if AI should initiate negotiation with player or other nations
 * Returns AI-initiated negotiation if triggered, null otherwise
 *
 * PHASE 3: AI Proactive Diplomacy
 */
export function aiCheckProactiveNegotiation(
  actor: Nation,
  targetNation: Nation,
  allNations: Nation[],
  currentTurn: number,
  globalNegotiationCount: number
): AIInitiatedNegotiation | null {
  // Only check for player or important nations
  if (actor.eliminated || targetNation.eliminated) {
    return null;
  }

  // Check if any trigger activates
  const triggerResult = checkAllTriggers(
    actor,
    targetNation,
    allNations,
    currentTurn,
    globalNegotiationCount
  );

  if (!triggerResult) {
    return null;
  }

  // Check for duplicates and cooldowns
  if (shouldBlockDuplicateNegotiation(actor, targetNation, triggerResult.purpose, currentTurn)) {
    return null;
  }

  // Generate the AI-initiated negotiation deal
  const aiNegotiation = generateAINegotiationDeal(
    actor,
    targetNation,
    allNations,
    triggerResult,
    currentTurn
  );

  // Record this negotiation for cooldown tracking
  recordNegotiationCooldown(actor, targetNation, triggerResult.purpose, currentTurn);

  return aiNegotiation;
}

/**
 * Validate negotiation before execution
 * Returns validation result with detailed errors if invalid
 */
function validateNegotiationBeforeExecution(
  negotiation: AIInitiatedNegotiation,
  initiator: Nation,
  target: Nation
): { valid: boolean; reason?: string } {
  // Check nations are still alive
  if (initiator.eliminated || target.eliminated) {
    return { valid: false, reason: 'One or both nations eliminated' };
  }

  // Validate based on negotiation purpose
  const deal = negotiation.proposedDeal;

  // Check if initiator can afford offered items
  for (const item of deal.offerItems || []) {
    if (item.type === 'gold' || item.type === 'production') {
      if ((initiator.production || 0) < (item.amount || 0)) {
        return {
          valid: false,
          reason: `${initiator.name} cannot afford ${item.amount} production (has ${initiator.production})`
        };
      }
    }
    if (item.type === 'intel') {
      if ((initiator.intel || 0) < (item.amount || 0)) {
        return {
          valid: false,
          reason: `${initiator.name} cannot afford ${item.amount} intel (has ${initiator.intel})`
        };
      }
    }
  }

  // Check if target can afford requested items
  for (const item of deal.requestItems || []) {
    if (item.type === 'gold' || item.type === 'production') {
      if ((target.production || 0) < (item.amount || 0)) {
        return {
          valid: false,
          reason: `${target.name} cannot afford ${item.amount} production (has ${target.production})`
        };
      }
    }
    if (item.type === 'intel') {
      if ((target.intel || 0) < (item.amount || 0)) {
        return {
          valid: false,
          reason: `${target.name} cannot afford ${item.amount} intel (has ${target.intel})`
        };
      }
    }
  }

  // Check for logical inconsistencies
  if (negotiation.purpose === 'offer-alliance' || negotiation.purpose === 'mutual-defense') {
    if (initiator.alliances?.includes(target.id)) {
      return { valid: false, reason: 'Nations are already allied' };
    }
  }

  return { valid: true };
}

/**
 * Handle AI auto-response to AI-to-AI negotiation
 * AI automatically evaluates and responds to negotiations from other AI
 * Returns updated nations array if changes were made
 */
function handleAItoAINegotiation(
  negotiation: AIInitiatedNegotiation,
  initiatorNation: Nation,
  targetNation: Nation,
  allNations: Nation[],
  currentTurn: number,
  logFn?: (msg: string, type?: string) => void
): Nation[] {
  // Validate negotiation before proceeding
  const validation = validateNegotiationBeforeExecution(negotiation, initiatorNation, targetNation);
  if (!validation.valid) {
    if (logFn) {
      logFn(
        `${initiatorNation.name}'s ${negotiation.purpose} with ${targetNation.name} failed validation: ${validation.reason}`,
        'diplomacy'
      );
    }
    console.warn('AI-to-AI negotiation validation failed:', validation.reason);
    return allNations; // Return unchanged nations
  }

  // Target AI evaluates the negotiation
  const evaluation = evaluateNegotiation(
    negotiation.proposedDeal,
    targetNation,
    initiatorNation,
    allNations,
    currentTurn
  );

  // Decide based on acceptance probability
  const willAccept = Math.random() * 100 < evaluation.acceptanceProbability;

  if (willAccept) {
    // Execute the deal immediately
    try {
      const globalState = GameStateManager.getState();
      const result = applyNegotiationDeal(
        negotiation.proposedDeal,
        initiatorNation,
        targetNation,
        allNations,
        currentTurn,
        globalState
      );

      if (result.gameState) {
        const updatedState = { ...result.gameState } as LocalGameState;
        updatedState.nations = result.allNations as LocalNation[];
        GameStateManager.setState(updatedState);
        GameStateManager.setNations(updatedState.nations);
      } else {
        const fallbackState = { ...globalState } as LocalGameState;
        fallbackState.nations = result.allNations as LocalNation[];
        GameStateManager.setState(fallbackState);
        GameStateManager.setNations(fallbackState.nations);
      }

      // Return the updated nations array from the result
      if (logFn) {
        logFn(
          `${targetNation.name} accepts ${negotiation.purpose} from ${initiatorNation.name} (probability: ${Math.round(evaluation.acceptanceProbability)}%)`,
          'diplomacy'
        );
      }

      return result.allNations;
    } catch (error) {
      // If execution fails, log the actual error with full details
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : '';

      if (logFn) {
        logFn(
          `${targetNation.name} tried to accept ${initiatorNation.name}'s ${negotiation.purpose} but execution failed: ${errorMsg}`,
          'diplomacy'
        );
      }

      console.error('AI-to-AI negotiation execution failed:', {
        error: errorMsg,
        stack: errorStack,
        negotiation,
        initiator: initiatorNation.name,
        target: targetNation.name
      });

      return allNations; // Return unchanged nations on error
    }
  } else {
    // AI rejects the deal
    if (logFn) {
      const reason = evaluation.rejectionReasons?.[0] || 'terms unacceptable';
      logFn(
        `${targetNation.name} rejects ${negotiation.purpose} from ${initiatorNation.name} (${reason}, probability: ${Math.round(evaluation.acceptanceProbability)}%)`,
        'diplomacy'
      );
    }
    return allNations; // Return unchanged nations on rejection
  }
}

/**
 * Process AI proactive diplomacy for all AI nations
 * Returns object with AI-initiated negotiations and updated nations array
 *
 * PHASE 3: Called during AI turn processing
 */
export function processAIProactiveDiplomacy(
  aiNations: Nation[],
  playerNation: Nation,
  allNations: Nation[],
  currentTurn: number,
  logFn?: (msg: string, type?: string) => void
): { negotiations: AIInitiatedNegotiation[]; updatedNations: Nation[] } {
  const aiNegotiations: AIInitiatedNegotiation[] = [];
  let updatedNations = [...allNations]; // Work with a copy that we'll update
  let playerNegotiationCount = 0;
  let aiToAiNegotiationCount = 0;

  // Shuffle AI nations to randomize who goes first
  const shuffledAI = [...aiNations].sort(() => Math.random() - 0.5);

  for (const aiNation of shuffledAI) {
    if (aiNation.eliminated) continue;

    // Get updated version of aiNation from updatedNations
    const currentAiNation = updatedNations.find(n => n.id === aiNation.id) || aiNation;

    // Check if AI wants to initiate negotiation with player
    // Separate limit for player negotiations (max 8 per turn across all AI)
    if (playerNegotiationCount < 8) {
      const currentPlayer = updatedNations.find(n => n.id === playerNation.id) || playerNation;
      const negotiationWithPlayer = aiCheckProactiveNegotiation(
        currentAiNation,
        currentPlayer,
        updatedNations,
        currentTurn,
        aiNegotiations.length
      );

      if (negotiationWithPlayer) {
        aiNegotiations.push(negotiationWithPlayer);
        playerNegotiationCount++;
        if (logFn) {
          logFn(`${currentAiNation.name} initiates ${negotiationWithPlayer.purpose} with ${currentPlayer.name}`, 'diplomacy');
        }
      }
    }

    // Check with other AI nations (AI-to-AI diplomacy enabled)
    // Separate limit for AI-to-AI negotiations (max 15 per turn total)
    // Each AI can do up to 2 AI-to-AI negotiations per turn
    if (aiToAiNegotiationCount < 15) {
      const otherAI = updatedNations.filter(n =>
        !n.isPlayer &&
        !n.eliminated &&
        n.id !== currentAiNation.id
      );

      if (otherAI.length > 0) {
        // Sort other AI by priority (relationship, threats, etc.)
        const sortedTargets = otherAI.sort((a, b) => {
          // Prioritize based on relationship strength and threat level
          const relA = currentAiNation.relationships?.[a.id] || 0; // Removed Math.abs()
          const relB = currentAiNation.relationships?.[b.id] || 0;
          const threatA = currentAiNation.threats?.[a.id] || 0;
          const threatB = currentAiNation.threats?.[b.id] || 0;

          // Different priority logic for positive vs negative relationships
          let priorityA = 0;
          let priorityB = 0;

          // Positive relationships (allies): prioritize strong positive relations
          if (relA > 0) {
            priorityA = relA * 1.5; // Boost positive relationships
          } else if (relA < -30) {
            // Negative relationships (enemies): prioritize if also high threat
            priorityA = Math.abs(relA) * 0.3 + (threatA * 0.7);
          }

          if (relB > 0) {
            priorityB = relB * 1.5;
          } else if (relB < -30) {
            priorityB = Math.abs(relB) * 0.3 + (threatB * 0.7);
          }

          return priorityB - priorityA;
        });

        // Check top 3 potential AI targets (or all if fewer than 3)
        const targetsToCheck = sortedTargets.slice(0, Math.min(3, sortedTargets.length));

        let aiNegotiationsThisTurn = 0;
        for (const targetAI of targetsToCheck) {
          // Stop if we've reached limits
          if (aiToAiNegotiationCount >= 15 || aiNegotiationsThisTurn >= 2) break;

          // CRITICAL FIX: Re-fetch currentAiNation from updatedNations after each negotiation
          // to ensure affordability checks reflect the latest resource state after previous deals
          const refreshedAiNation = updatedNations.find(n => n.id === aiNation.id) || currentAiNation;
          const currentTargetAI = updatedNations.find(n => n.id === targetAI.id) || targetAI;

          const negotiationWithAI = aiCheckProactiveNegotiation(
            refreshedAiNation,
            currentTargetAI,
            updatedNations,
            currentTurn,
            aiNegotiations.length
          );

          if (negotiationWithAI) {
            // AI-to-AI negotiation: Process immediately (no UI needed)
            if (logFn) {
              logFn(`${refreshedAiNation.name} initiates ${negotiationWithAI.purpose} with ${currentTargetAI.name}`, 'diplomacy');
            }

            // Target AI automatically evaluates and responds
            // This returns updated nations array
            updatedNations = handleAItoAINegotiation(
              negotiationWithAI,
              refreshedAiNation,
              currentTargetAI,
              updatedNations,
              currentTurn,
              logFn
            );

            aiToAiNegotiationCount++;
            aiNegotiationsThisTurn++;
          }
        }
      }
    }
  }

  return { negotiations: aiNegotiations, updatedNations };
}
