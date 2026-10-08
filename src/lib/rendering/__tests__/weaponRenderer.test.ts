import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GameState, Missile, Nation } from '@/types/game';
import type { CanvasDrawingDependencies } from '../types';
import { drawBombers, drawMissiles, drawSubmarines } from '../weaponRenderer';

function createNation(overrides: Partial<Nation> = {}): Nation {
  return {
    id: 'target', isPlayer: false, name: 'Target', leader: 'Leader',
    lon: 30, lat: 20, color: '#fff', population: 100, missiles: 5,
    defense: 0, production: 0, uranium: 0, intel: 0, warheads: {},
    morale: 50, publicOpinion: 50, electionTimer: 10, cabinetApproval: 50,
    ...overrides,
  };
}

function createMissile(overrides: Partial<Missile> = {}): Missile {
  return {
    t: 0.99, fromLon: 0, fromLat: 0, toLon: 30, toLat: 20,
    yield: 10, target: createNation(), ...overrides,
  };
}

function createContext() {
  return {
    save: vi.fn(), restore: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(),
    quadraticCurveTo: vi.fn(), stroke: vi.fn(), arc: vi.fn(), fill: vi.fn(),
    setLineDash: vi.fn(),
  };
}

function createDependencies(overrides: Partial<CanvasDrawingDependencies> = {}) {
  const state = {
    missiles: [], bombers: [], submarines: [], rings: [], fx: 1,
  } as unknown as GameState;
  return {
    S: state, nations: [], ctx: null, missileIcon: null, bomberIcon: null,
    submarineIcon: null, projectLocal: (lon: number, lat: number) => ({
      x: lon, y: lat, visible: true,
    }),
    explode: vi.fn(), log: vi.fn(), AudioSys: { playSFX: vi.fn() },
    ...overrides,
  } as unknown as CanvasDrawingDependencies;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('missile combat lifecycle', () => {
  it('replaces a MIRV carrier once with three payloads preserving its yield and delivery method', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    const deps = createDependencies();
    const carrier = createMissile({
      from: createNation({ id: 'attacker', researched: { mirv: true } }),
      yield: 10, isSubmarine: true,
    });
    deps.S.missiles.push(carrier);

    drawMissiles(deps);

    expect(deps.S.missiles).toHaveLength(3);
    expect(deps.S.missiles).not.toContain(carrier);
    expect(deps.S.missiles.every(missile => missile.isMirv && missile.isSubmarine)).toBe(true);
    expect(deps.S.missiles.reduce((sum, missile) => sum + missile.yield, 0)).toBeCloseTo(10);
    expect(deps.S.missiles[0].toLon).toBe(carrier.toLon);
    expect(deps.S.missiles[0].toLat).toBe(carrier.toLat);
    expect(deps.explode).not.toHaveBeenCalled();

    for (let frame = 0; frame < 70; frame++) drawMissiles(deps);

    expect(deps.S.missiles).toHaveLength(0);
    expect(deps.explode).toHaveBeenCalledTimes(3);
    const calls = vi.mocked(deps.explode).mock.calls;
    expect(calls.reduce((sum, call) => sum + call[3], 0)).toBeCloseTo(10);
    expect(calls.every(call => call[5] === 'submarine')).toBe(true);
    expect(vi.mocked(deps.log).mock.calls.filter(([message]) => message.includes('MIRV'))).toHaveLength(1);
  });

  it('does not add delayed MIRV payloads after a game reset', () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    const deps = createDependencies();
    deps.S.missiles.push(createMissile({
      from: createNation({ researched: { mirv: true } }),
    }));
    drawMissiles(deps);
    expect(deps.S.missiles).toHaveLength(3);

    deps.S.missiles = [];
    vi.runAllTimers();

    expect(deps.S.missiles).toHaveLength(0);
  });

  it('intercepts the carrier before it can deploy MIRV payloads', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const deps = createDependencies();
    deps.S.missiles.push(createMissile({
      target: createNation({ defense: 100 }),
      from: createNation({ researched: { mirv: true } }),
    }));

    drawMissiles(deps);

    expect(deps.S.missiles).toHaveLength(0);
    expect(deps.explode).not.toHaveBeenCalled();
    expect(vi.mocked(deps.log).mock.calls.some(([message]) => message.includes('MIRV'))).toBe(false);
  });

  it('checks defense at 95% flight progress even with the target hidden', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const deps = createDependencies({
      projectLocal: (x, y) => ({ x, y, visible: false }),
    });
    deps.S.missiles.push(createMissile({ t: 0.94, target: createNation({ defense: 100 }) }));

    drawMissiles(deps);

    expect(deps.S.missiles).toHaveLength(0);
    expect(deps.S.rings).toHaveLength(0);
    expect(deps.explode).not.toHaveBeenCalled();
  });

  it('does not retry a failed interception on each frame', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const deps = createDependencies();
    const missile = createMissile({ t: 0.94, target: createNation({ defense: 100 }) });
    deps.S.missiles.push(missile);

    drawMissiles(deps);
    drawMissiles(deps);

    expect(random).toHaveBeenCalledTimes(1);
    expect(missile.interceptChecked).toBe(true);
    expect(deps.S.missiles).toContain(missile);
  });

  it.each(['origin', 'target'] as const)('resolves impact once when the %s is hidden', hidden => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const ctx = createContext();
    const deps = createDependencies({
      ctx: ctx as unknown as CanvasRenderingContext2D,
      projectLocal: (x, y) => ({ x, y, visible: hidden === 'origin' ? x !== 0 : x === 0 }),
    });
    deps.S.missiles.push(createMissile());

    drawMissiles(deps);
    drawMissiles(deps);

    expect(deps.S.missiles).toHaveLength(0);
    expect(deps.explode).toHaveBeenCalledTimes(1);
    expect(deps.explode).toHaveBeenCalledWith(30, 20, expect.any(Object), 10, null, 'missile');
    expect(ctx.quadraticCurveTo).not.toHaveBeenCalled();
  });

  it('resolves impact with no canvas context', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const deps = createDependencies();
    deps.S.missiles.push(createMissile());

    drawMissiles(deps);

    expect(deps.explode).toHaveBeenCalledTimes(1);
    expect(deps.S.missiles).toHaveLength(0);
  });
});

describe('bomber and submarine iteration', () => {
  it('intercepts consecutive bombers without skipping the next entry', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const deps = createDependencies();
    const target = createNation({ defense: 12 });
    deps.S.bombers.push(
      { t: 0.5, to: target, sx: 0, sy: 0, tx: 30, ty: 20, payload: { yield: 10 } },
      { t: 0.5, to: target, sx: 0, sy: 0, tx: 30, ty: 20, payload: { yield: 10 } },
    );

    drawBombers(deps);

    expect(deps.S.bombers).toHaveLength(0);
    expect(deps.AudioSys.playSFX).toHaveBeenCalledTimes(2);
    expect(deps.explode).not.toHaveBeenCalled();
  });

  it('resolves consecutive arriving bombers in the same frame', () => {
    const deps = createDependencies();
    const target = createNation();
    deps.S.bombers.push(
      { t: 0.999, detected: true, to: target, sx: 0, sy: 0, tx: 30, ty: 20, payload: { yield: 10 } },
      { t: 0.999, detected: true, to: target, sx: 0, sy: 0, tx: 30, ty: 20, payload: { yield: 10 } },
    );

    drawBombers(deps);

    expect(deps.S.bombers).toHaveLength(0);
    expect(deps.explode).toHaveBeenCalledTimes(2);
  });

  it('removes consecutive fully submerged submarines in the same frame', () => {
    const deps = createDependencies();
    deps.S.submarines!.push(
      { phase: 2, diveProgress: 0.99, x: 10, y: 20 },
      { phase: 2, diveProgress: 0.99, x: 30, y: 40 },
    );

    drawSubmarines(deps);

    expect(deps.S.submarines).toHaveLength(0);
  });

  it('launches each submarine payload once without a canvas context', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const deps = createDependencies();
    const target = createNation();
    deps.S.submarines!.push(
      { phase: 0, phaseProgress: 0.99, x: 10, y: 20, target, yield: 10 },
      { phase: 0, phaseProgress: 0.99, x: 30, y: 40, target, yield: 10 },
    );

    for (let frame = 0; frame < 4; frame++) drawSubmarines(deps);

    expect(deps.S.missiles).toHaveLength(2);
    expect(deps.S.missiles.every(missile => missile.isSubmarine)).toBe(true);
  });
});

describe('paused weapon animations', () => {
  it('renders missiles without advancing, intercepting, splitting, or detonating', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);
    const ctx = createContext();
    const deps = createDependencies({ ctx: ctx as unknown as CanvasRenderingContext2D });
    deps.S.paused = true;
    const missile = createMissile({
      t: 1, target: createNation({ defense: 100 }),
      from: createNation({ researched: { mirv: true } }),
    });
    deps.S.missiles.push(missile);

    drawMissiles(deps);

    expect(deps.S.missiles).toEqual([missile]);
    expect(missile.t).toBe(1);
    expect(missile.interceptChecked).toBeUndefined();
    expect(random).not.toHaveBeenCalled();
    expect(deps.explode).not.toHaveBeenCalled();
    expect(deps.S.rings).toHaveLength(0);
    expect(ctx.quadraticCurveTo).toHaveBeenCalledTimes(1);
  });

  it('freezes bomber progression and detection', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);
    const ctx = createContext();
    const deps = createDependencies({ ctx: ctx as unknown as CanvasRenderingContext2D });
    deps.S.paused = true;
    const bomber = {
      t: 1, to: createNation({ defense: 12 }), sx: 0, sy: 0,
      tx: 30, ty: 20, payload: { yield: 10 },
    };
    deps.S.bombers.push(bomber);

    drawBombers(deps);

    expect(deps.S.bombers).toEqual([bomber]);
    expect(bomber.t).toBe(1);
    expect(random).not.toHaveBeenCalled();
    expect(deps.explode).not.toHaveBeenCalled();
    expect(ctx.arc).toHaveBeenCalledTimes(1);
  });

  it('freezes all submarine stages and retains fully submerged entries', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const deps = createDependencies();
    deps.S.paused = true;
    const subs = [
      { phase: 0, phaseProgress: 1, x: 10, y: 20, target: createNation(), yield: 10 },
      { phase: 1, x: 30, y: 40 },
      { phase: 2, diveProgress: 1, x: 50, y: 60 },
    ];
    deps.S.submarines = structuredClone(subs);

    drawSubmarines(deps);

    expect(deps.S.submarines).toEqual(subs);
    expect(deps.S.missiles).toHaveLength(0);
    expect(random).not.toHaveBeenCalled();
  });
});
