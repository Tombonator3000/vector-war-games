import { describe, it, expect, vi, afterEach } from 'vitest';
import { launch, productionPhase } from '../gamePhaseHandlers';
import type { LaunchDependencies } from '../gamePhaseHandlers';
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

describe('launch alliance restrictions', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createNation = (overrides: Partial<Nation> = {}): Nation => ({
    id: 'nation-a',
    isPlayer: false,
    name: 'Nation A',
    leader: 'Leader',
    lon: 0,
    lat: 0,
    color: '#ffffff',
    population: 100,
    missiles: 1,
    defense: 5,
    production: 5,
    uranium: 5,
    intel: 5,
    warheads: { 10: 1 },
    morale: 10,
    publicOpinion: 10,
    electionTimer: 0,
    cabinetApproval: 10,
    ...overrides,
  });

  const createState = (): GameState => ({
    defcon: 1,
    missiles: [],
    turn: 3,
  } as unknown as GameState);

  const createDeps = (state: GameState, nations: Nation[], overrides: Partial<LaunchDependencies> = {}) => {
    const log = vi.fn();
    const toast = vi.fn();
    const AudioSys = { playSFX: vi.fn() };
    const DoomsdayClock = { tick: vi.fn() };

    return {
      S: state,
      nations,
      log,
      toast,
      AudioSys,
      DoomsdayClock,
      WARHEAD_YIELD_TO_ID: new Map<number, string>(),
      RESEARCH_LOOKUP: {},
      PlayerManager: { get: () => nations[0] },
      projectLocal: vi.fn(),
      ...overrides,
    } satisfies LaunchDependencies & { log: ReturnType<typeof vi.fn>; toast: ReturnType<typeof vi.fn>; AudioSys: { playSFX: ReturnType<typeof vi.fn> }; DoomsdayClock: { tick: ReturnType<typeof vi.fn> } };
  };

  it('prevents allied nations from launching and surfaces a player warning', () => {
    const attacker = createNation({
      id: 'attacker',
      name: 'Attackerland',
      isPlayer: true,
      treaties: {
        defender: { alliance: true },
      },
    });

    const defender = createNation({ id: 'defender', name: 'Defenderia' });

    const state = createState();
    const deps = createDeps(state, [attacker, defender]);

    const result = launch(attacker, defender, 10, deps);

    expect(result).toBe(false);
    expect(deps.log).toHaveBeenCalledWith('Cannot attack Defenderia - alliance active!', 'warning');
    expect(deps.toast).toHaveBeenCalledWith({
      title: 'Alliance prevents strike',
      description: 'Cannot attack Defenderia - alliance active!',
    });
    expect(attacker.warheads[10]).toBe(1);
    expect(attacker.missiles).toBe(1);
    expect(state.missiles).toHaveLength(0);
    expect(deps.AudioSys.playSFX).not.toHaveBeenCalled();
    expect(deps.DoomsdayClock.tick).not.toHaveBeenCalled();
  });

  it('checks reciprocal alliance markers before allowing a strike', () => {
    const attacker = createNation({ id: 'attacker', name: 'Attackerland' });
    const defender = createNation({
      id: 'defender',
      name: 'Defenderia',
      alliances: ['attacker'],
      treaties: {
        attacker: { alliance: true },
      },
    });

    const state = createState();
    const deps = createDeps(state, [attacker, defender]);

    const result = launch(attacker, defender, 10, deps);

    expect(result).toBe(false);
    expect(deps.log).toHaveBeenCalledWith('Cannot attack Defenderia - alliance active!', 'warning');
    expect(deps.toast).not.toHaveBeenCalled();
    expect(attacker.warheads[10]).toBe(1);
    expect(attacker.missiles).toBe(1);
    expect(state.missiles).toHaveLength(0);
    expect(deps.AudioSys.playSFX).not.toHaveBeenCalled();
    expect(deps.DoomsdayClock.tick).not.toHaveBeenCalled();
  });
});
