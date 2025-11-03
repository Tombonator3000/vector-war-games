import { describe, expect, it } from 'vitest';

import { shouldRevealHiddenAgenda } from '@/lib/agendaSystem';
import { initializeGameTrustAndFavors, modifyTrust } from '@/lib/trustAndFavorsUtils';
import type { Nation } from '@/types/game';

describe('shouldRevealHiddenAgenda', () => {
  it('reveals hidden agendas when trust and relationship thresholds are met before long-term timeout', () => {
    const playerNation: Nation = {
      id: 'player',
      isPlayer: true,
      name: 'Player',
      leader: 'Player Leader',
      lon: 0,
      lat: 0,
      color: '#ffffff',
      population: 100,
      missiles: 0,
      defense: 0,
      production: 0,
      uranium: 0,
      intel: 0,
      warheads: {},
      morale: 50,
      publicOpinion: 50,
      electionTimer: 0,
      cabinetApproval: 0,
    };

    const aiNationBase: Nation = {
      id: 'ai',
      isPlayer: false,
      name: 'AI Nation',
      leader: 'AI Leader',
      lon: 10,
      lat: 10,
      color: '#000000',
      population: 100,
      missiles: 0,
      defense: 0,
      production: 0,
      uranium: 0,
      intel: 0,
      warheads: {},
      morale: 50,
      publicOpinion: 50,
      electionTimer: 0,
      cabinetApproval: 0,
      relationships: { player: 40 },
    };

    let [initializedPlayer, initializedAi] = initializeGameTrustAndFavors([
      playerNation,
      aiNationBase,
    ]);

    initializedAi = {
      ...initializedAi,
      firstContactTurn: { [initializedPlayer.id]: 1 },
    };

    // Without additional trust growth, the agenda should remain hidden.
    expect(shouldRevealHiddenAgenda(initializedPlayer, initializedAi, 12)).toBe(false);

    // Boost trust above the reveal threshold before the long-term timeout is reached.
    initializedAi = modifyTrust(
      initializedAi,
      initializedPlayer.id,
      15,
      'Joint crisis response',
      12,
    );

    expect(shouldRevealHiddenAgenda(initializedPlayer, initializedAi, 12)).toBe(true);
  });
});
