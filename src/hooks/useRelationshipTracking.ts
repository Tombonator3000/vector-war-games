/**
 * Relationship Tracking Hook
 *
 * Manages relationship changes between nations based on game actions.
 * Automatically handles bidirectional relationship updates and history tracking.
 */

import { useCallback } from 'react';
import {
  modifyRelationship,
  RelationshipDeltas,
  initializeRelationships,
} from '@/lib/relationshipUtils';
import type { Nation } from '@/types/game';

export interface UseRelationshipTrackingOptions {
  currentTurn: number;
  getNations: () => Nation[];
  setNations: (nations: Nation[]) => void;
}

export interface UseRelationshipTrackingReturn {
  /**
   * Track a nuclear strike and update relationships
   */
  trackNuclearStrike: (attackerId: string, targetId: string) => void;

  /**
   * Track a cyber attack and update relationships
   */
  trackCyberAttack: (attackerId: string, targetId: string) => void;

  /**
   * Track alliance formation and update relationships
   */
  trackAllianceFormed: (nation1Id: string, nation2Id: string) => void;

  /**
   * Track alliance break and update relationships
   */
  trackAllianceBreak: (nation1Id: string, nation2Id: string) => void;

  /**
   * Track war declaration and update relationships
   */
  trackWarDeclaration: (declarerId: string, targetId: string) => void;

  /**
   * Track war end and update relationships
   */
  trackWarEnd: (nation1Id: string, nation2Id: string) => void;

  /**
   * Track trade agreement and update relationships
   */
  trackTradeAgreement: (nation1Id: string, nation2Id: string) => void;

  /**
   * Track sanction imposed and update relationships
   */
  trackSanctionImposed: (sanctionerId: string, targetId: string) => void;

  /**
   * Track spy caught and update relationships
   */
  trackSpyCaught: (spyOwnerId: string, caughtById: string) => void;

  /**
   * Track refugee acceptance and update relationships
   */
  trackRefugeeAcceptance: (acceptorId: string, sourceId: string) => void;

  /**
   * Track border closure and update relationships
   */
  trackBorderClosure: (closerId: string, affectedId: string) => void;

  /**
   * Track intel sharing and update relationships
   */
  trackIntelSharing: (sharerId: string, recipientId: string) => void;

  /**
   * Track aid sent and update relationships
   */
  trackAidSent: (senderId: string, recipientId: string) => void;

  /**
   * Initialize relationships for all nations
   */
  initializeAllRelationships: () => void;

  /**
   * Apply a custom relationship change with a specific reason
   */
  applyRelationshipChange: (
    nationId: string,
    targetNationId: string,
    delta: number,
    reason: string,
    bidirectional?: boolean
  ) => void;
}

export function useRelationshipTracking({
  currentTurn,
  getNations,
  setNations,
}: UseRelationshipTrackingOptions): UseRelationshipTrackingReturn {
  /**
   * Helper to update a single nation's relationship
   */
  const updateNationRelationship = useCallback(
    (nationId: string, targetNationId: string, delta: number, reason: string) => {
      const nations = getNations();
      const nationIndex = nations.findIndex((n) => n.id === nationId);
      if (nationIndex === -1) return;

      const updatedNation = modifyRelationship(
        nations[nationIndex],
        targetNationId,
        delta,
        reason,
        currentTurn
      );

      const updatedNations = [...nations];
      updatedNations[nationIndex] = updatedNation;
      setNations(updatedNations);
    },
    [currentTurn, getNations, setNations]
  );

  /**
   * Apply a relationship change, optionally bidirectional
   */
  const applyRelationshipChange = useCallback(
    (
      nationId: string,
      targetNationId: string,
      delta: number,
      reason: string,
      bidirectional: boolean = false
    ) => {
      updateNationRelationship(nationId, targetNationId, delta, reason);

      if (bidirectional) {
        updateNationRelationship(targetNationId, nationId, delta, reason);
      }
    },
    [updateNationRelationship]
  );

  /**
   * Track a nuclear strike
   */
  const trackNuclearStrike = useCallback(
    (attackerId: string, targetId: string) => {
      const nations = getNations();
      const attacker = nations.find((n) => n.id === attackerId);
      const target = nations.find((n) => n.id === targetId);

      if (!attacker || !target) return;

      // Target's relationship with attacker severely damaged
      applyRelationshipChange(
        targetId,
        attackerId,
        RelationshipDeltas.NUCLEAR_STRIKE,
        `${attacker.name} launched nuclear weapons at us`,
        false
      );

      // Attacker's relationship with target also damaged (some regret)
      applyRelationshipChange(
        attackerId,
        targetId,
        RelationshipDeltas.NUCLEAR_STRIKE / 2,
        `We launched nuclear weapons at ${target.name}`,
        false
      );

      // All other nations also lose respect for the attacker
      nations.forEach((nation) => {
        if (nation.id !== attackerId && nation.id !== targetId && !nation.eliminated) {
          applyRelationshipChange(
            nation.id,
            attackerId,
            -10,
            `${attacker.name} used nuclear weapons`,
            false
          );
        }
      });
    },
    [applyRelationshipChange, getNations]
  );

  /**
   * Track a cyber attack
   */
  const trackCyberAttack = useCallback(
    (attackerId: string, targetId: string) => {
      const nations = getNations();
      const attacker = nations.find((n) => n.id === attackerId);

      if (!attacker) return;

      applyRelationshipChange(
        targetId,
        attackerId,
        RelationshipDeltas.CYBER_ATTACK,
        `${attacker.name} launched a cyber attack against us`,
        false
      );
    },
    [applyRelationshipChange, getNations]
  );

  /**
   * Track alliance formation
   */
  const trackAllianceFormed = useCallback(
    (nation1Id: string, nation2Id: string) => {
      const nations = getNations();
      const nation1 = nations.find((n) => n.id === nation1Id);
      const nation2 = nations.find((n) => n.id === nation2Id);

      if (!nation1 || !nation2) return;

      applyRelationshipChange(
        nation1Id,
        nation2Id,
        RelationshipDeltas.FORM_ALLIANCE,
        `Formed alliance with ${nation2.name}`,
        false
      );

      applyRelationshipChange(
        nation2Id,
        nation1Id,
        RelationshipDeltas.FORM_ALLIANCE,
        `Formed alliance with ${nation1.name}`,
        false
      );
    },
    [applyRelationshipChange, getNations]
  );

  /**
   * Track alliance break
   */
  const trackAllianceBreak = useCallback(
    (nation1Id: string, nation2Id: string) => {
      const nations = getNations();
      const nation1 = nations.find((n) => n.id === nation1Id);
      const nation2 = nations.find((n) => n.id === nation2Id);

      if (!nation1 || !nation2) return;

      applyRelationshipChange(
        nation1Id,
        nation2Id,
        RelationshipDeltas.BREAK_ALLIANCE,
        `Broke alliance with ${nation2.name}`,
        false
      );

      applyRelationshipChange(
        nation2Id,
        nation1Id,
        RelationshipDeltas.BREAK_ALLIANCE,
        `${nation1.name} broke alliance with us`,
        false
      );
    },
    [applyRelationshipChange, getNations]
  );

  /**
   * Track war declaration
   */
  const trackWarDeclaration = useCallback(
    (declarerId: string, targetId: string) => {
      const nations = getNations();
      const declarer = nations.find((n) => n.id === declarerId);

      if (!declarer) return;

      applyRelationshipChange(
        targetId,
        declarerId,
        RelationshipDeltas.DECLARE_WAR,
        `${declarer.name} declared war on us`,
        false
      );

      applyRelationshipChange(
        declarerId,
        targetId,
        RelationshipDeltas.DECLARE_WAR / 2,
        'Declared war',
        false
      );
    },
    [applyRelationshipChange, getNations]
  );

  /**
   * Track war end
   */
  const trackWarEnd = useCallback(
    (nation1Id: string, nation2Id: string) => {
      applyRelationshipChange(nation1Id, nation2Id, RelationshipDeltas.END_WAR, 'War ended', true);
    },
    [applyRelationshipChange]
  );

  /**
   * Track trade agreement
   */
  const trackTradeAgreement = useCallback(
    (nation1Id: string, nation2Id: string) => {
      applyRelationshipChange(
        nation1Id,
        nation2Id,
        RelationshipDeltas.TRADE_AGREEMENT,
        'Signed trade agreement',
        true
      );
    },
    [applyRelationshipChange]
  );

  /**
   * Track sanction imposed
   */
  const trackSanctionImposed = useCallback(
    (sanctionerId: string, targetId: string) => {
      const nations = getNations();
      const sanctioner = nations.find((n) => n.id === sanctionerId);

      if (!sanctioner) return;

      applyRelationshipChange(
        targetId,
        sanctionerId,
        RelationshipDeltas.SANCTION,
        `${sanctioner.name} imposed sanctions on us`,
        false
      );
    },
    [applyRelationshipChange, getNations]
  );

  /**
   * Track spy caught
   */
  const trackSpyCaught = useCallback(
    (spyOwnerId: string, caughtById: string) => {
      const nations = getNations();
      const spyOwner = nations.find((n) => n.id === spyOwnerId);

      if (!spyOwner) return;

      applyRelationshipChange(
        caughtById,
        spyOwnerId,
        RelationshipDeltas.SPY_CAUGHT,
        `Caught ${spyOwner.name} spying on us`,
        false
      );
    },
    [applyRelationshipChange, getNations]
  );

  /**
   * Track refugee acceptance
   */
  const trackRefugeeAcceptance = useCallback(
    (acceptorId: string, sourceId: string) => {
      const nations = getNations();
      const acceptor = nations.find((n) => n.id === acceptorId);

      if (!acceptor) return;

      applyRelationshipChange(
        sourceId,
        acceptorId,
        RelationshipDeltas.ACCEPT_REFUGEES,
        `${acceptor.name} accepted our refugees`,
        false
      );
    },
    [applyRelationshipChange, getNations]
  );

  /**
   * Track border closure
   */
  const trackBorderClosure = useCallback(
    (closerId: string, affectedId: string) => {
      const nations = getNations();
      const closer = nations.find((n) => n.id === closerId);

      if (!closer) return;

      applyRelationshipChange(
        affectedId,
        closerId,
        RelationshipDeltas.CLOSE_BORDERS,
        `${closer.name} closed borders to us`,
        false
      );
    },
    [applyRelationshipChange, getNations]
  );

  /**
   * Track intel sharing
   */
  const trackIntelSharing = useCallback(
    (sharerId: string, recipientId: string) => {
      const nations = getNations();
      const sharer = nations.find((n) => n.id === sharerId);

      if (!sharer) return;

      applyRelationshipChange(
        recipientId,
        sharerId,
        RelationshipDeltas.SHARE_INTEL,
        `${sharer.name} shared intelligence with us`,
        false
      );
    },
    [applyRelationshipChange, getNations]
  );

  /**
   * Track aid sent
   */
  const trackAidSent = useCallback(
    (senderId: string, recipientId: string) => {
      const nations = getNations();
      const sender = nations.find((n) => n.id === senderId);

      if (!sender) return;

      applyRelationshipChange(
        recipientId,
        senderId,
        RelationshipDeltas.SEND_AID,
        `${sender.name} sent aid to us`,
        false
      );
    },
    [applyRelationshipChange, getNations]
  );

  /**
   * Initialize relationships for all nations
   */
  const initializeAllRelationships = useCallback(() => {
    const nations = getNations();
    const nationIds = nations.map((n) => n.id);

    const updatedNations = nations.map((nation) => initializeRelationships(nation, nationIds));

    setNations(updatedNations);
  }, [getNations, setNations]);

  return {
    trackNuclearStrike,
    trackCyberAttack,
    trackAllianceFormed,
    trackAllianceBreak,
    trackWarDeclaration,
    trackWarEnd,
    trackTradeAgreement,
    trackSanctionImposed,
    trackSpyCaught,
    trackRefugeeAcceptance,
    trackBorderClosure,
    trackIntelSharing,
    trackAidSent,
    initializeAllRelationships,
    applyRelationshipChange,
  };
}
