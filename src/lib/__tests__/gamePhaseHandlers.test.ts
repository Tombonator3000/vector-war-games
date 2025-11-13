import { describe, it, expect, vi, afterEach } from 'vitest';
import { productionPhase } from '../gamePhaseHandlers';
import * as electionSystem from '../electionSystem';
import type { GameState, Nation } from '../../types/game';
import { SeededRandom } from '../seededRandom';

describe('productionPhase election consequences', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("invokes the shared game over handler when the player loses an election with a game over consequence", () => {
    const state = {
      turn: 12,
      gameOver: false,
      defcon: 5,
      scenario: {
        electionConfig: {
          enabled: true,
          interval: 4,
          minMoraleThreshold: 0,
          minPublicOpinionThreshold: 0,
          actionInfluenceMultiplier: 1,
          foreignInfluenceEnabled: false,
          loseElectionConsequence: 'gameOver' as const,
        },
      },
    } as unknown as GameState;

    const player: Nation = {
      id: 'player',
      isPlayer: true,
      name: 'Player Nation',
      leader: 'Leader',
      lon: 0,
      lat: 0,
      color: '#ffffff',
      population: 100,
      missiles: 5,
      defense: 5,
      production: 10,
      uranium: 5,
      intel: 5,
      warheads: { 10: 1 },
      morale: 20,
      publicOpinion: 10,
      electionTimer: 0,
      cabinetApproval: 15,
    };

    const nations: Nation[] = [player];
    const onGameOver = vi.fn(({ message }: { message: string }) => {
      (state as any).gameOver = true;
      (state as any).finalMessage = message;
    });

    const runElectionResult = {
      winner: 'opposition' as const,
      margin: 12,
      playerVoteShare: 44,
      oppositionVoteShare: 56,
      turnout: 60,
      swingFactors: ['Low morale'],
    };

    const runElectionSpy = vi
      .spyOn(electionSystem, 'runElection')
      .mockReturnValue(runElectionResult);

    const applyConsequencesSpy = vi
      .spyOn(electionSystem, 'applyElectionConsequences')
      .mockImplementation((nation: Nation) => {
        (nation as Nation).eliminated = true;
        return {
          gameOver: true,
          message: 'ELECTION DEFEAT! Mock narrative.',
        };
      });

    productionPhase({
      S: state,
      nations,
      log: vi.fn(),
      advanceResearch: vi.fn(),
      advanceCityConstruction: vi.fn(),
      leaders: [],
      PlayerManager: { get: () => player },
      conventionalState: undefined,
      rng: new SeededRandom(1),
      onGameOver,
    });

    expect(runElectionSpy).toHaveBeenCalledOnce();
    expect(applyConsequencesSpy).toHaveBeenCalledOnce();
    expect(onGameOver).toHaveBeenCalledTimes(1);
    expect(onGameOver).toHaveBeenCalledWith(
      expect.objectContaining({
        victory: false,
        cause: 'election',
        message: 'ELECTION DEFEAT! Mock narrative.',
      })
    );
    expect((state as any).gameOver).toBe(true);
    expect((state as any).finalMessage).toBe('ELECTION DEFEAT! Mock narrative.');
    expect(player.eliminated).toBe(true);
    expect(state.overlay?.text).toBe('VOTED OUT - GAME OVER');
    expect(player.electionTimer).toBe(4);
  });
});
