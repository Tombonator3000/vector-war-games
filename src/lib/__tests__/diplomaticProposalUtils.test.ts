import { describe, it, expect } from 'vitest';
import { applyAllianceProposal, applyTruceProposal } from '@/lib/diplomaticProposalUtils';
import { hasActivePeaceTreaty, isEligibleEnemyTarget } from '@/lib/gameUtils';
import type { Nation } from '@/types/game';

function createNation(overrides: Partial<Nation>): Nation {
  return {
    id: 'nation',
    isPlayer: false,
    name: 'Nation',
    leader: 'Leader',
    lon: 0,
    lat: 0,
    color: '#ffffff',
    population: 100,
    missiles: 0,
    defense: 0,
    production: 100,
    uranium: 0,
    intel: 0,
    warheads: {},
    morale: 50,
    publicOpinion: 50,
    electionTimer: 0,
    cabinetApproval: 50,
    ...overrides,
  } as Nation;
}

describe('diplomaticProposalUtils', () => {
  it('marks treaties as alliances for both nations and blocks hostile targeting', () => {
    const player = createNation({ id: 'player', isPlayer: true, alliances: [], treaties: {} });
    const target = createNation({ id: 'target', name: 'Target', treaties: {} });

    const { updatedPlayer, updatedTarget } = applyAllianceProposal(player, target);

    expect(updatedPlayer.treaties?.[target.id]?.alliance).toBe(true);
    expect(updatedTarget.treaties?.[player.id]?.alliance).toBe(true);

    expect(hasActivePeaceTreaty(updatedPlayer, updatedTarget)).toBe(true);
    expect(isEligibleEnemyTarget(updatedPlayer, updatedTarget)).toBe(false);
  });

  it('applies truce metadata to treaty records and active treaty lists', () => {
    const player = createNation({ id: 'player', isPlayer: true, treaties: {} });
    const target = createNation({ id: 'target', name: 'Target', treaties: {} });

    const duration = 6;
    const currentTurn = 10;
    const { updatedPlayer, updatedTarget, expiryTurn } = applyTruceProposal(
      player,
      target,
      duration,
      currentTurn
    );

    const playerTreaty = updatedPlayer.treaties?.[target.id];
    const targetTreaty = updatedTarget.treaties?.[player.id];

    expect(playerTreaty?.truceTurns).toBe(duration);
    expect(targetTreaty?.truceTurns).toBe(duration);
    expect(playerTreaty?.truceEstablishedTurn).toBe(currentTurn);
    expect(targetTreaty?.truceEstablishedTurn).toBe(currentTurn);
    expect(playerTreaty?.truceExpiryTurn).toBe(expiryTurn);
    expect(targetTreaty?.truceExpiryTurn).toBe(expiryTurn);

    const playerActive = updatedPlayer.activeTreaties?.find(
      treaty => treaty.withNationId === target.id && treaty.type === 'truce'
    );
    const targetActive = updatedTarget.activeTreaties?.find(
      treaty => treaty.withNationId === player.id && treaty.type === 'truce'
    );

    expect(playerActive).toBeTruthy();
    expect(playerActive?.expiryTurn).toBe(expiryTurn);
    expect(targetActive).toBeTruthy();
    expect(targetActive?.expiryTurn).toBe(expiryTurn);

    expect(hasActivePeaceTreaty(updatedPlayer, updatedTarget)).toBe(true);
    expect(isEligibleEnemyTarget(updatedPlayer, updatedTarget)).toBe(false);
  });
});
