import { describe, expect, it } from 'vitest';

import { applyNegotiationDeal } from '@/lib/negotiationUtils';
import type { GameState, Nation } from '@/types/game';
import type { NegotiationState } from '@/types/negotiation';

function createNation(overrides: Partial<Nation> = {}): Nation {
  return {
    id: overrides.id ?? 'nation-a',
    isPlayer: overrides.isPlayer ?? false,
    name: overrides.name ?? 'Nation A',
    leader: overrides.leader ?? 'Leader A',
    lon: overrides.lon ?? 0,
    lat: overrides.lat ?? 0,
    color: overrides.color ?? '#ffffff',
    population: overrides.population ?? 100,
    missiles: overrides.missiles ?? 0,
    defense: overrides.defense ?? 10,
    production: overrides.production ?? 100,
    uranium: overrides.uranium ?? 10,
    intel: overrides.intel ?? 50,
    morale: overrides.morale ?? 50,
    publicOpinion: overrides.publicOpinion ?? 50,
    electionTimer: overrides.electionTimer ?? 10,
    cabinetApproval: overrides.cabinetApproval ?? 50,
    warheads: overrides.warheads ?? {},
    alliances: overrides.alliances ?? [],
    relationships: overrides.relationships ?? {},
    resourceStockpile: overrides.resourceStockpile,
    controlledTerritories: overrides.controlledTerritories,
    treaties: overrides.treaties,
    activeTreaties: overrides.activeTreaties,
    trustRecords: overrides.trustRecords,
    favorBalances: overrides.favorBalances,
    diplomaticPromises: overrides.diplomaticPromises,
    grievances: overrides.grievances,
    threats: overrides.threats,
    researched: overrides.researched,
    researchQueue: overrides.researchQueue ?? null,
    sanctionedBy: overrides.sanctionedBy,
    sanctioned: overrides.sanctioned,
    bordersClosedTurns: overrides.bordersClosedTurns,
    ...overrides,
  };
}

function createNegotiation(
  initiatorId: string,
  respondentId: string,
  offerItems: NegotiationState['offerItems'],
  requestItems: NegotiationState['requestItems']
): NegotiationState {
  return {
    id: 'neg-1',
    initiatorId,
    respondentId,
    offerItems,
    requestItems,
    currentRound: 1,
    maxRounds: 5,
    status: 'active',
    history: [],
    createdTurn: 1,
  };
}

function createGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    turn: overrides.turn ?? 1,
    defcon: overrides.defcon ?? 5,
    defconHistory: overrides.defconHistory ?? [],
    phase: overrides.phase ?? 'PLAYER',
    actionsRemaining: overrides.actionsRemaining ?? 1,
    paused: overrides.paused ?? false,
    gameOver: overrides.gameOver ?? false,
    selectedLeader: overrides.selectedLeader ?? null,
    selectedDoctrine: overrides.selectedDoctrine ?? null,
    playerName: overrides.playerName,
    difficulty: overrides.difficulty,
    scenario: overrides.scenario,
    missiles: overrides.missiles ?? [],
    bombers: overrides.bombers ?? [],
    submarines: overrides.submarines ?? [],
    explosions: overrides.explosions ?? [],
    particles: overrides.particles ?? [],
    radiationZones: overrides.radiationZones ?? [],
    empEffects: overrides.empEffects ?? [],
    rings: overrides.rings ?? [],
    refugeeCamps: overrides.refugeeCamps ?? [],
    screenShake: overrides.screenShake ?? 0,
    overlay: overrides.overlay ?? null,
    fx: overrides.fx ?? 1,
    nuclearWinterLevel: overrides.nuclearWinterLevel ?? 0,
    globalRadiation: overrides.globalRadiation ?? 0,
    events: overrides.events ?? false,
    diplomacy: overrides.diplomacy ?? {
      peaceTurns: 0,
      lastEvaluatedTurn: 0,
      allianceRatio: 0,
      influenceScore: 0,
      nearVictoryNotified: false,
      victoryAnnounced: false,
    },
    falloutMarks: overrides.falloutMarks ?? [],
    falloutEffects: overrides.falloutEffects ?? {},
    satelliteOrbits: overrides.satelliteOrbits ?? [],
    diplomacyPhase3: overrides.diplomacyPhase3,
    multiPartyDiplomacy: overrides.multiPartyDiplomacy,
    casusBelliState: overrides.casusBelliState ?? { allWars: [], warHistory: [] },
    doctrineIncidentState: overrides.doctrineIncidentState,
    doctrineShiftState: overrides.doctrineShiftState,
    advancedPropaganda: overrides.advancedPropaganda,
    territoryResources: overrides.territoryResources,
    resourceTrades: overrides.resourceTrades ?? [],
    resourceMarket: overrides.resourceMarket,
    depletionWarnings: overrides.depletionWarnings ?? [],
    greatOldOnes: overrides.greatOldOnes,
    statistics:
      overrides.statistics ?? {
        nukesLaunched: 0,
        nukesReceived: 0,
        enemiesDestroyed: 0,
        nonPandemicCasualties: 0,
      },
    showEndGameScreen: overrides.showEndGameScreen ?? false,
    pendingEndGameReveal: overrides.pendingEndGameReveal,
    victoryProgressNotifications: overrides.victoryProgressNotifications,
    nations: overrides.nations ?? [],
    conventional:
      overrides.conventional ?? {
        templates: {},
        units: {},
        territories: {},
        logs: [],
      },
  };
}

describe('applyNegotiationDeal item effects', () => {
  it('transfers technology to the receiver of a share-tech item', () => {
    const initiator = createNation({ id: 'initiator', researched: {} });
    const respondent = createNation({ id: 'respondent', researched: {} });
    const negotiation = createNegotiation(
      initiator.id,
      respondent.id,
      [],
      [{ type: 'share-tech', techId: 'fusion-reactor' }]
    );

    const result = applyNegotiationDeal(negotiation, initiator, respondent, [initiator, respondent], 10);

    expect(result.initiator.researched?.['fusion-reactor']).toBe(true);
  });

  it('creates a truce treaty and transfers territory ownership when specified', () => {
    const territoryId = 'territory-1';
    const initiator = createNation({ id: 'initiator', controlledTerritories: [territoryId] });
    const respondent = createNation({ id: 'respondent' });
    const gameState = createGameState({
      conventional: {
        templates: {},
        units: {},
        logs: [],
        territories: {
          [territoryId]: {
            id: territoryId,
            name: 'Test Territory',
            region: 'Region',
            type: 'land',
            anchorLat: 0,
            anchorLon: 0,
            controllingNationId: initiator.id,
            contestedBy: [],
            strategicValue: 1,
            productionBonus: 0,
            instabilityModifier: 0,
            conflictRisk: 0,
            neighbors: [],
            armies: 0,
            unitComposition: { army: 0, navy: 0, air: 0 },
          },
        },
      },
    });

    const negotiation = createNegotiation(
      initiator.id,
      respondent.id,
      [
        {
          type: 'treaty',
          subtype: 'truce',
          duration: 5,
          metadata: { territoryId },
        },
      ],
      []
    );

    const result = applyNegotiationDeal(
      negotiation,
      initiator,
      respondent,
      [initiator, respondent],
      10,
      gameState
    );

    expect(result.respondent.controlledTerritories).toContain(territoryId);
    expect(result.initiator.controlledTerritories).not.toContain(territoryId);
    expect(result.gameState?.conventional?.territories?.[territoryId].controllingNationId).toBe(
      respondent.id
    );
  });

  it('creates resource trades for resource-share items when game state is provided', () => {
    const initiator = createNation({ id: 'initiator' });
    const respondent = createNation({ id: 'respondent' });
    const negotiation = createNegotiation(
      initiator.id,
      respondent.id,
      [
        {
          type: 'resource-share',
          amount: 6,
          duration: 4,
          metadata: { resource: 'oil' },
        },
      ],
      []
    );

    const gameState = createGameState();

    const result = applyNegotiationDeal(
      negotiation,
      initiator,
      respondent,
      [initiator, respondent],
      5,
      gameState
    );

    expect(result.gameState?.resourceTrades).toHaveLength(1);
    const trade = result.gameState?.resourceTrades?.[0];
    expect(trade?.fromNationId).toBe('initiator');
    expect(trade?.toNationId).toBe('respondent');
    expect(trade?.resource).toBe('oil');
    expect(trade?.amountPerTurn).toBe(6);
  });

  it('adds to receiver stockpile when resource-share is accepted without global state', () => {
    const initiator = createNation({ id: 'initiator' });
    const respondent = createNation({
      id: 'respondent',
      resourceStockpile: { oil: 0, uranium: 0, rare_earths: 0, food: 0 },
    });
    const negotiation = createNegotiation(
      initiator.id,
      respondent.id,
      [
        {
          type: 'resource-share',
          amount: 3,
          duration: 5,
          metadata: { resource: 'oil' },
        },
      ],
      []
    );

    const result = applyNegotiationDeal(negotiation, initiator, respondent, [initiator, respondent], 2);

    expect(result.respondent.resourceStockpile?.oil).toBe(3);
  });

  it('creates reciprocal resource trades for trade agreements', () => {
    const initiator = createNation({ id: 'initiator' });
    const respondent = createNation({ id: 'respondent' });
    const negotiation = createNegotiation(
      initiator.id,
      respondent.id,
      [
        {
          type: 'trade-agreement',
          duration: 6,
          metadata: {
            exports: { resource: 'oil', amount: 5 },
            imports: { resource: 'rare_earths', amount: 2 },
          },
        },
      ],
      []
    );

    const gameState = createGameState();

    const result = applyNegotiationDeal(
      negotiation,
      initiator,
      respondent,
      [initiator, respondent],
      3,
      gameState
    );

    expect(result.gameState?.resourceTrades).toHaveLength(2);
    const [exportTrade, importTrade] = result.gameState!.resourceTrades!;
    expect(exportTrade.fromNationId).toBe('initiator');
    expect(exportTrade.resource).toBe('oil');
    expect(importTrade.fromNationId).toBe('respondent');
    expect(importTrade.resource).toBe('rare_earths');
  });

  it('opens borders for both nations', () => {
    const initiator = createNation({ id: 'initiator', bordersClosedTurns: 5 });
    const respondent = createNation({ id: 'respondent', bordersClosedTurns: 5 });
    const negotiation = createNegotiation(
      initiator.id,
      respondent.id,
      [
        {
          type: 'open-borders',
          duration: 8,
        },
      ],
      []
    );

    const result = applyNegotiationDeal(negotiation, initiator, respondent, [initiator, respondent], 7);

    expect(result.initiator.bordersClosedTurns).toBe(0);
    expect(result.respondent.bordersClosedTurns).toBe(0);
    expect(result.initiator.treaties?.[respondent.id]?.openBordersTurns).toBe(8);
    expect(result.respondent.treaties?.[initiator.id]?.openBordersTurns).toBe(8);
  });

  it('resolves grievances with grievance-apology items', () => {
    const grievance = {
      id: 'grievance-1',
      type: 'broken-treaty',
      description: 'Breach',
      createdTurn: 1,
      expiresIn: 10,
      againstNationId: 'initiator',
      trustPenalty: -10,
      resolved: false,
    };

    const initiator = createNation({ id: 'initiator' });
    const respondent = createNation({ id: 'respondent', grievances: [grievance] });
    const negotiation = createNegotiation(
      initiator.id,
      respondent.id,
      [
        {
          type: 'grievance-apology',
          grievanceId: 'grievance-1',
        },
      ],
      []
    );

    const result = applyNegotiationDeal(negotiation, initiator, respondent, [initiator, respondent], 5);

    expect(result.respondent.grievances?.[0].resolved).toBe(true);
  });

  it('updates favor balances for favor-exchange', () => {
    const initiator = createNation({
      id: 'initiator',
      favorBalances: {
        respondent: { value: 0, lastUpdated: 0, history: [] },
      },
    });
    const respondent = createNation({
      id: 'respondent',
      favorBalances: {
        initiator: { value: 0, lastUpdated: 0, history: [] },
      },
    });
    const negotiation = createNegotiation(
      initiator.id,
      respondent.id,
      [
        {
          type: 'favor-exchange',
          amount: 5,
        },
      ],
      []
    );

    const result = applyNegotiationDeal(negotiation, initiator, respondent, [initiator, respondent], 4);

    expect(result.initiator.favorBalances?.respondent.value).toBe(-5);
    expect(result.respondent.favorBalances?.initiator.value).toBe(5);
  });

  it('adds diplomatic promises for promise items', () => {
    const initiator = createNation({ id: 'initiator', diplomaticPromises: [] });
    const respondent = createNation({ id: 'respondent' });
    const negotiation = createNegotiation(
      initiator.id,
      respondent.id,
      [
        {
          type: 'promise',
          subtype: 'not-attack',
          duration: 6,
        },
      ],
      []
    );

    const result = applyNegotiationDeal(negotiation, initiator, respondent, [initiator, respondent], 9);

    expect(result.initiator.diplomaticPromises).toHaveLength(1);
    expect(result.initiator.diplomaticPromises?.[0].type).toBe('no-attack');
  });

  it('raises threat levels when join-war is accepted', () => {
    const initiator = createNation({ id: 'initiator', threats: {} });
    const respondent = createNation({ id: 'respondent', threats: {} });
    const negotiation = createNegotiation(
      initiator.id,
      respondent.id,
      [
        {
          type: 'join-war',
          targetId: 'target-nation',
        },
      ],
      []
    );

    const result = applyNegotiationDeal(negotiation, initiator, respondent, [initiator, respondent], 12);

    expect(result.respondent.threats?.['target-nation']).toBeGreaterThan(0);
    expect(result.initiator.threats?.['target-nation']).toBeGreaterThan(0);
  });

  it('applies military-support modifiers', () => {
    const initiator = createNation({ id: 'initiator', production: 50 });
    const respondent = createNation({ id: 'respondent', defense: 20 });
    const negotiation = createNegotiation(
      initiator.id,
      respondent.id,
      [
        {
          type: 'military-support',
          duration: 6,
        },
      ],
      []
    );

    const result = applyNegotiationDeal(negotiation, initiator, respondent, [initiator, respondent], 11);

    expect(result.respondent.defense).toBeGreaterThan(20);
    expect(result.initiator.production).toBeLessThan(50);
    expect(result.respondent.treaties?.[initiator.id]?.militarySupportTurns).toBeGreaterThanOrEqual(6);
  });
});

