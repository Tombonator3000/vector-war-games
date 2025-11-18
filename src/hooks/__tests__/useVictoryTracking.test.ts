import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Nation } from '@/types/game';
import { VICTORY_PATHS } from '@/types/streamlinedVictoryConditions';
import { useVictoryTracking } from '../useVictoryTracking';

const basePlayerNation: Nation = {
  id: 'player',
  isPlayer: true,
  name: 'Commander Zero',
  leader: 'Zero',
  lon: 0,
  lat: 0,
  color: '#fff',
  population: 60,
  missiles: 0,
  defense: 10,
  production: 250,
  uranium: 10,
  intel: 0,
  warheads: {},
  morale: 50,
  publicOpinion: 50,
  electionTimer: 0,
  cabinetApproval: 50,
  alliances: ['ally'],
  cities: 12,
};

const allyNation: Nation = {
  id: 'ally',
  isPlayer: false,
  name: 'Allied Nation',
  leader: 'Ally',
  lon: 10,
  lat: 10,
  color: '#0ff',
  population: 30,
  missiles: 0,
  defense: 5,
  production: 80,
  uranium: 5,
  intel: 0,
  warheads: {},
  morale: 40,
  publicOpinion: 40,
  electionTimer: 0,
  cabinetApproval: 40,
};

describe('useVictoryTracking', () => {
  it('resolves the player nation by isPlayer when the provided playerName does not match', () => {
    const { result } = renderHook(() =>
      useVictoryTracking({
        nations: [basePlayerNation, allyNation],
        playerName: 'Nonexistent Name',
        currentTurn: 55,
        defcon: 4,
        diplomacyState: {
          peaceTurns: 5,
          allianceRatio: 1,
          influenceScore: 0,
        },
      })
    );

    expect(result.current.paths).toHaveLength(VICTORY_PATHS.length);
    expect(result.current.closestVictory).toBe('diplomatic');
    expect(result.current.recommendedPath).toBe('diplomatic');
  });
});
