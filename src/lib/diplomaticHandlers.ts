/**
 * Diplomatic Peace Handlers
 * Extracted from Index.tsx (Session 4 Part 2)
 *
 * Manages peace treaty negotiations, offers, and acceptances.
 */

import { toast } from "@/components/ui/use-toast";
import type { Nation } from '@/types';
import type { GameState } from '@/lib/gameState';
import type { WarState, PeaceOffer } from '@/types/casusBelli';
import { PlayerManager } from '@/lib/PlayerManager';
import { GameStateManager } from '@/lib/GameStateManager';
import { createPeaceOffer, createWhitePeaceTerms } from '@/lib/peaceTermsUtils';
import { endWar } from '@/lib/warDeclarationUtils';

export interface DiplomaticHandlerDependencies {
  S: GameState;
  log: (message: string, level?: string) => void;
  addNewsItem: (type: string, message: string, severity?: string) => void;
  applyNationUpdatesMap: (updates: Map<string, Partial<Nation>>) => void;
  triggerNationsUpdate?: () => void;
}

/**
 * Handles offering white peace to an opponent
 */
export function handleOfferPeaceExtracted(
  warId: string,
  deps: DiplomaticHandlerDependencies
): void {
  const { S, log, addNewsItem, applyNationUpdatesMap, triggerNationsUpdate } = deps;

  const player = PlayerManager.get();
  if (!player) {
    toast({ title: 'Unable to offer peace', description: 'Player nation not found.', variant: 'destructive' });
    return;
  }

  const warState = (player.activeWars || []).find((war) => war.id === warId);
  if (!warState) {
    toast({ title: 'Unable to offer peace', description: 'War state could not be located.', variant: 'destructive' });
    return;
  }

  const opponentId =
    warState.attackerNationId === player.id ? warState.defenderNationId : warState.attackerNationId;
  const opponent = GameStateManager.getNation(opponentId);
  if (!opponent) {
    toast({ title: 'Unable to offer peace', description: 'Opponent nation not found.', variant: 'destructive' });
    return;
  }

  const terms = createWhitePeaceTerms();
  const offer = createPeaceOffer(player, opponent, warState, terms, S.turn);

  const playerOffers: PeaceOffer[] = (player.peaceOffers || [])
    .filter((existing) => existing.id !== offer.id && existing.warId !== warState.id)
    .map((existing) => ({ ...existing }));
  playerOffers.push(offer);

  const opponentOffers: PeaceOffer[] = (opponent.peaceOffers || [])
    .filter((existing) => existing.id !== offer.id)
    .map((existing) => ({ ...existing }));
  opponentOffers.push(offer);

  const updates = new Map<string, Partial<Nation>>();
  updates.set(player.id, { peaceOffers: playerOffers } as Partial<Nation>);
  updates.set(opponent.id, { peaceOffers: opponentOffers } as Partial<Nation>);
  applyNationUpdatesMap(updates);

  toast({
    title: 'Peace Offer Sent',
    description: `White peace proposal sent to ${opponent.name}.`,
  });
  log(`Peace offer sent to ${opponent.name}`, 'diplomatic');
  addNewsItem('diplomatic', `${player.name || player.id} proposes peace to ${opponent.name}`, 'important');
  triggerNationsUpdate?.();
}

/**
 * Handles accepting a peace offer
 */
export function handleAcceptPeaceExtracted(
  offerId: string,
  deps: DiplomaticHandlerDependencies
): void {
  const { S, log, addNewsItem, applyNationUpdatesMap, triggerNationsUpdate } = deps;

  const player = PlayerManager.get();
  if (!player) {
    toast({ title: 'Unable to process offer', description: 'Player nation not found.', variant: 'destructive' });
    return;
  }

  const offer = (player.peaceOffers || []).find((po) => po.id === offerId);
  if (!offer) {
    toast({ title: 'Offer expired', description: 'Peace offer could not be found.', variant: 'destructive' });
    return;
  }

  if (offer.toNationId !== player.id) {
    toast({ title: 'Offer not addressed to player', description: 'Cannot accept outgoing offer.', variant: 'destructive' });
    return;
  }

  const opponent = GameStateManager.getNation(offer.fromNationId);
  if (!opponent) {
    toast({ title: 'Unable to process offer', description: 'Opposing nation not found.', variant: 'destructive' });
    return;
  }

  const warState = (player.activeWars || []).find((war) => war.id === offer.warId);
  if (!warState) {
    toast({ title: 'War not found', description: 'Conflict already ended or missing.', variant: 'destructive' });
    return;
  }

  const status: WarState['status'] = offer.terms.type === 'white-peace'
    ? 'white-peace'
    : warState.attackerNationId === player.id
      ? 'defender-victory'
      : 'attacker-victory';
  const resolvedWar = endWar(warState, status);

  const updatedPlayerWars = (player.activeWars || []).filter((war) => war.id !== warState.id);
  const updatedOpponentWars = (opponent.activeWars || []).filter((war) => war.id !== warState.id);
  const updatedPlayerOffers: PeaceOffer[] = (player.peaceOffers || [])
    .filter((po) => po.id !== offerId)
    .map((existing) => ({ ...existing }));
  const updatedOpponentOffers: PeaceOffer[] = (opponent.peaceOffers || [])
    .filter((po) => po.id !== offerId)
    .map((existing) => ({ ...existing }));

  const updates = new Map<string, Partial<Nation>>();
  updates.set(player.id, { activeWars: updatedPlayerWars, peaceOffers: updatedPlayerOffers } as Partial<Nation>);
  updates.set(opponent.id, { activeWars: updatedOpponentWars, peaceOffers: updatedOpponentOffers } as Partial<Nation>);
  applyNationUpdatesMap(updates);

  const casusState = S.casusBelliState ?? { allWars: [], warHistory: [] };
  casusState.allWars = (casusState.allWars || []).filter((war) => war.id !== warState.id);
  casusState.warHistory = [...(casusState.warHistory || []), resolvedWar];
  S.casusBelliState = casusState;

  toast({ title: 'Peace Accepted', description: `Peace agreed with ${opponent.name}.` });
  log(`Peace concluded with ${opponent.name}`, 'success');
  addNewsItem('diplomatic', `${player.name || player.id} accepts peace with ${opponent.name}`, 'important');
  triggerNationsUpdate?.();
}

/**
 * Handles rejecting a peace offer
 */
export function handleRejectPeaceExtracted(
  offerId: string,
  deps: DiplomaticHandlerDependencies
): void {
  const { log, addNewsItem, applyNationUpdatesMap, triggerNationsUpdate } = deps;

  const player = PlayerManager.get();
  if (!player) {
    toast({ title: 'Unable to process offer', description: 'Player nation not found.', variant: 'destructive' });
    return;
  }

  const offer = (player.peaceOffers || []).find((po) => po.id === offerId);
  if (!offer) {
    toast({ title: 'Offer not found', description: 'The peace offer may have expired.', variant: 'destructive' });
    return;
  }

  const opponentId = offer.fromNationId === player.id ? offer.toNationId : offer.fromNationId;
  const opponent = GameStateManager.getNation(opponentId);

  const updatedPlayerOffers: PeaceOffer[] = (player.peaceOffers || [])
    .filter((po) => po.id !== offerId)
    .map((existing) => ({ ...existing }));
  const updates = new Map<string, Partial<Nation>>();
  updates.set(player.id, { peaceOffers: updatedPlayerOffers } as Partial<Nation>);

  if (opponent) {
    const updatedOpponentOffers: PeaceOffer[] = (opponent.peaceOffers || [])
      .filter((po) => po.id !== offerId)
      .map((existing) => ({ ...existing }));
    updates.set(opponent.id, { peaceOffers: updatedOpponentOffers } as Partial<Nation>);
  }

  applyNationUpdatesMap(updates);

  toast({
    title: 'Peace Offer Rejected',
    description: `Peace offer from ${opponent?.name ?? 'opponent'} rejected.`,
    variant: 'destructive',
  });
  log(`Peace offer rejected from ${opponent?.name ?? 'opponent'}`, 'warning');
  addNewsItem('diplomatic', `${player.name || player.id} rejects peace from ${opponent?.name ?? 'opponent'}`, 'alert');
  triggerNationsUpdate?.();
}
