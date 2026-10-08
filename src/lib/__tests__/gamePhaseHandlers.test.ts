import { describe, it, expect, vi, afterEach } from 'vitest';
import { launch, productionPhase, resolutionPhase } from '../gamePhaseHandlers';
import type { LaunchDependencies, ProductionPhaseDependencies, ResolutionPhaseDependencies } from '../gamePhaseHandlers';
import type { PolicyEffects } from '@/types/policy';
import * as electionSystem from '../electionSystem';
import type { GameState, Nation } from '../../types/game';
import { SeededRandom } from '../seededRandom';
import { processTerritorialResourceSystems } from '../gamePhases/territorialProduction';

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
describe('turn phase processing', () => {
  const createNation = (overrides: Partial<Nation> = {}): Nation => ({
    id: 'player',
    isPlayer: true,
    name: 'Player',
    leader: 'Leader',
    lon: 0,
    lat: 0,
    color: '#ffffff',
    population: 100,
    missiles: 1,
    defense: 5,
    production: 10,
    uranium: 5,
    intel: 5,
    warheads: { 10: 1 },
    morale: 60,
    publicOpinion: 60,
    electionTimer: 5,
    cabinetApproval: 60,
    ...overrides,
  });

  const createState = (nations: Nation[]): GameState => ({
    turn: 12,
    gameOver: false,
    defcon: 5,
    missiles: [],
    radiationZones: [],
    falloutMarks: [],
    nations,
  } as unknown as GameState);

  const createProductionDeps = (S: GameState, nations: Nation[]): ProductionPhaseDependencies => ({
    S,
    nations,
    log: vi.fn(),
    advanceResearch: vi.fn(),
    advanceCityConstruction: vi.fn(),
    leaders: [],
    PlayerManager: { get: () => nations.find(nation => nation.isPlayer) ?? null },
    rng: new SeededRandom(1),
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('applies off-screen missile impacts once and retains missiles still in flight', () => {
    const player = createNation();
    const state = createState([player]);
    const arrived = {
      t: 1, fromLon: 0, fromLat: 0, toLon: 50, toLat: 40,
      yield: 10, target: player, from: null,
    };
    const pending = { ...arrived, t: 0.5 };
    state.missiles = [arrived, pending];
    const explode = vi.fn();
    const deps: ResolutionPhaseDependencies = {
      S: state,
      nations: [player],
      log: vi.fn(),
      projectLocal: () => ({ x: 10, y: 20, visible: false }),
      explode,
      advanceResearch: vi.fn(),
      advanceCityConstruction: vi.fn(),
    };

    resolutionPhase(deps);
    resolutionPhase(deps);

    expect(explode).toHaveBeenCalledTimes(1);
    expect(explode).toHaveBeenCalledWith(10, 20, player, 10, null, 'missile');
    expect(state.missiles).toEqual([pending]);
  });

  it('advances research and construction once across a whole turn', () => {
    const player = createNation({
      researchQueue: { projectId: 'test', turnsRemaining: 3, totalTurns: 3 },
      cityConstructionQueue: { turnsRemaining: 3, totalTurns: 3 },
    });
    const state = createState([player]);
    const deps = createProductionDeps(state, [player]);
    deps.advanceResearch = vi.fn(nation => { nation.researchQueue!.turnsRemaining--; });
    deps.advanceCityConstruction = vi.fn(nation => { nation.cityConstructionQueue!.turnsRemaining--; });

    resolutionPhase({
      ...deps,
      projectLocal: () => ({ x: 0, y: 0, visible: true }),
      explode: vi.fn(),
    });
    expect(player.researchQueue?.turnsRemaining).toBe(3);
    productionPhase(deps);

    expect(player.researchQueue?.turnsRemaining).toBe(2);
    expect(player.cityConstructionQueue?.turnsRemaining).toBe(2);
    expect(deps.advanceResearch).toHaveBeenCalledTimes(1);
    expect(deps.advanceResearch).toHaveBeenCalledWith(player, 'PRODUCTION');
    expect(deps.advanceCityConstruction).toHaveBeenCalledTimes(1);
    expect(deps.advanceCityConstruction).toHaveBeenCalledWith(player, 'PRODUCTION');
  });

  it('persists grievance and alliance updates without replacing shared nation objects', () => {
    const player = createNation({
      grievances: [{
        id: 'grievance', type: 'broken-promise', severity: 'minor', againstNationId: 'ally',
        description: 'Broken promise', createdTurn: 0, expiresIn: 2,
        relationshipPenalty: -5, trustPenalty: -5, resolved: false,
      }],
      specializedAlliances: [{
        id: 'alliance', type: 'military', nation1Id: 'player', nation2Id: 'ally',
        createdTurn: 0, active: true, level: 1, cooperation: 60, obligations: [], benefits: [],
      }],
    });
    const ally = createNation({ id: 'ally', isPlayer: false });
    const nations = [player, ally];
    const state = createState(nations);

    productionPhase(createProductionDeps(state, nations));

    expect(nations[0]).toBe(player);
    expect(state.nations[0]).toBe(player);
    expect(player.grievances?.[0].expiresIn).toBe(1);
    expect(player.specializedAlliances?.[0].level).toBe(2);
    expect(player.specializedAlliances?.[0].cooperation).toBe(60.5);
  });

it('delivers and charges the final resource shipment exactly once', () => {
    const seller = createNation({
      id: 'seller', isPlayer: false, cities: 0, production: 100, uranium: 100,
      resourceStockpile: { oil: 500, uranium: 100, rare_earths: 400, food: 600 },
    });
    const buyer = createNation({
      id: 'buyer', cities: 0, production: 100, uranium: 10,
      resourceStockpile: { oil: 500, uranium: 10, rare_earths: 400, food: 600 },
    });
    const state = createState([seller, buyer]);
    state.territoryResources = {};
    state.resourceTrades = [{
      id: 'final-shipment', fromNationId: seller.id, toNationId: buyer.id,
      resource: 'uranium', amountPerTurn: 10, duration: 1, totalTurns: 1,
      pricePerTurn: 3, createdTurn: 0,
    }];
    const runResources = () => processTerritorialResourceSystems(
      state, [seller, buyer], { territories: {} }, buyer, new SeededRandom(1), vi.fn()
    );

    runResources();

    expect(seller.uranium).toBe(90);
    expect(buyer.uranium).toBe(20);
    expect(seller.production).toBe(103);
    expect(buyer.production).toBe(97);
    expect(state.resourceTrades).toEqual([]);
    runResources();
    expect(seller.uranium).toBe(90);
    expect(buyer.uranium).toBe(20);
    expect(seller.production).toBe(103);
    expect(buyer.production).toBe(97);
  });

  it('keeps trust stable when a policy disables relationship decay', () => {
    const player = createNation({
      trustRecords: { ally: { value: 90, lastUpdated: 0, history: [] } },
    });
    const state = createState([player]);
    const deps = createProductionDeps(state, [player]);
    deps.policyNationId = player.id;
    deps.policyEffects = { relationshipDecayModifier: 0 } as PolicyEffects;

    productionPhase(deps);

    expect(player.trustRecords?.ally.value).toBe(90);
  });

  it('honors zero-valued production policy modifiers', () => {
    const player = createNation();
    const state = createState([player]);
    const deps = createProductionDeps(state, [player]);
    deps.policyNationId = player.id;
    deps.policyEffects = { productionModifier: 0 } as PolicyEffects;

    productionPhase(deps);

    expect(player.production).toBe(10);
    expect(player.uranium).toBe(5);
    expect(player.intel).toBe(5);
  });

  it('does not give a nation with zero cities the default city bonus', () => {
    const player = createNation({ cities: 0 });
    const state = createState([player]);

    productionPhase(createProductionDeps(state, [player]));

    expect(player.production).toBe(30);
    expect(player.uranium).toBe(7);
    expect(player.intel).toBe(9);
  });

  it('uses conventional state from GameState when the caller omits its duplicate dependency', () => {
    const player = createNation({ cities: 0 });
    const state = createState([player]);
    state.conventional = {
      territories: {}, templates: {}, units: {}, logs: [],
    };

    productionPhase(createProductionDeps(state, [player]));

    expect(state.territoryResources).toEqual({});
    expect(state.resourceMarket).toBeDefined();
    expect(player.resourceGeneration).toBeDefined();
  });

  it('keeps zero morale at zero when city maintenance resources are missing', () => {
    const player = createNation({
      morale: 0,
      cities: 2,
      resourceStockpile: { oil: 0, uranium: 5, rare_earths: 0, food: 0 },
    });
    const state = createState([player]);
    const deps = createProductionDeps(state, [player]);
    deps.conventionalState = { territories: {} };

    productionPhase(deps);

    expect(player.morale).toBe(0);
  });

  it('does not produce resources or complete research for eliminated nations', () => {
    const player = createNation({ eliminated: true });
    const state = createState([player]);
    const deps = createProductionDeps(state, [player]);

    productionPhase(deps);

    expect(player.production).toBe(10);
    expect(player.intel).toBe(5);
    expect(deps.advanceResearch).not.toHaveBeenCalled();
    expect(deps.advanceCityConstruction).not.toHaveBeenCalled();
  });
});

