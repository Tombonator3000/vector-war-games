import { describe, expect, it } from 'vitest';
import { updateFalloutImpacts, getFalloutSeverityLevel, FALLOUT_EFFECT_DECAY_FACTOR } from '@/lib/falloutEffects';
import type { GameState, Nation } from '@/types/game';

describe('falloutEffects', () => {
  const projectLocal = (lon: number, lat: number) => ({ x: lon, y: lat, visible: true });

  const createNation = (): Nation => ({
    id: 'alpha',
    isPlayer: true,
    name: 'Alpha',
    leader: 'Leader',
    lon: 0,
    lat: 0,
    color: '#fff',
    population: 1000000,
    missiles: 0,
    defense: 0,
    production: 100,
    uranium: 10,
    intel: 10,
    warheads: {},
    morale: 80,
    publicOpinion: 50,
    electionTimer: 10,
    cabinetApproval: 50,
    resourceStockpile: { oil: 10, uranium: 5, rare_earths: 5, food: 100 },
  });

  const createState = (): GameState => ({
    turn: 1,
    defcon: 5,
    phase: 'PLAYER',
    actionsRemaining: 1,
    paused: false,
    gameOver: false,
    selectedLeader: null,
    selectedDoctrine: null,
    missiles: [],
    bombers: [],
    explosions: [],
    particles: [],
    radiationZones: [],
    empEffects: [],
    rings: [],
    screenShake: 0,
    falloutMarks: [
      {
        id: 'mark_1',
        lon: 0,
        lat: 0,
        canvasX: 0,
        canvasY: 0,
        radius: 60,
        targetRadius: 60,
        intensity: 0.9,
        targetIntensity: 0.9,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastStrikeAt: Date.now(),
        growthRate: 0.2,
        decayDelayMs: 10000,
        decayRate: 0.001,
      },
    ],
    satelliteOrbits: [],
    nations: [],
  });

  it('accumulates fallout effects on nations', () => {
    const state = createState();
    const nation = createNation();

    updateFalloutImpacts(state, [nation], projectLocal);

    expect(nation.radiationSickness).toBeGreaterThan(0);
    expect(nation.falloutHunger).toBeGreaterThan(0);
    expect(nation.falloutInstability).toBeGreaterThan(0);
    expect(nation.refugeeFlow).toBeGreaterThan(0);
    expect(nation.population).toBeLessThan(1000000);
    expect(nation.resourceStockpile?.food ?? 0).toBeLessThan(100);
    expect(state.falloutEffects?.alpha?.lastSeverity).toBe('deadly');
  });

  it('decays fallout effects very slowly over multiple turns', () => {
    const state = createState();
    const nation = createNation();

    updateFalloutImpacts(state, [nation], projectLocal);
    const initialSickness = nation.radiationSickness ?? 0;

    // Remove marks to apply decay only
    state.falloutMarks = [];

    for (let i = 0; i < 25; i++) {
      updateFalloutImpacts(state, [nation], projectLocal);
    }

    const decayedSickness = nation.radiationSickness ?? 0;
    const expectedMinimum = initialSickness * Math.pow(FALLOUT_EFFECT_DECAY_FACTOR, 25);

    expect(decayedSickness).toBeGreaterThanOrEqual(expectedMinimum * 0.95);
    expect(decayedSickness).toBeGreaterThan(initialSickness * 0.6);
  });

  it('maps intensity to severity labels', () => {
    expect(getFalloutSeverityLevel(0)).toBe('none');
    expect(getFalloutSeverityLevel(0.3)).toBe('elevated');
    expect(getFalloutSeverityLevel(0.6)).toBe('severe');
    expect(getFalloutSeverityLevel(0.9)).toBe('deadly');
  });
});
