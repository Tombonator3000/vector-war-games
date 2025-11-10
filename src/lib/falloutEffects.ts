import type { GameState, Nation, FalloutMark, NationFalloutState } from '@/types/game';

type ProjectLocalFn = (lon: number, lat: number) => { x: number; y: number; visible?: boolean };

type ResolutionLogger = (msg: string, type?: string) => void;

export const FALLOUT_EFFECT_DECAY_FACTOR = 0.995; // Slow decay per resolution cycle
const FALLOUT_SICKNESS_MULTIPLIER = 28;
const FALLOUT_HUNGER_MULTIPLIER = 22;
const FALLOUT_INSTABILITY_MULTIPLIER = 18;
const FALLOUT_REFUGEE_MULTIPLIER = 0.0025; // Percent of population displaced per severity point
const FALLOUT_FOOD_STOCKPILE_LOSS = 9;

export type FalloutSeverity = 'none' | 'elevated' | 'severe' | 'deadly';

export function getFalloutSeverityLevel(intensity: number): FalloutSeverity {
  if (intensity >= 0.85) return 'deadly';
  if (intensity >= 0.55) return 'severe';
  if (intensity >= 0.25) return 'elevated';
  return 'none';
}

function defaultNationFalloutState(): NationFalloutState {
  return {
    cumulativeIntensity: 0,
    sickness: 0,
    hunger: 0,
    instability: 0,
    refugeeFlow: 0,
    lastSeverity: 'none',
    lastUpdated: Date.now(),
  };
}

function computeSeverityFromMark(mark: FalloutMark, nationPoint: { x: number; y: number }): number {
  const dx = nationPoint.x - mark.canvasX;
  const dy = nationPoint.y - mark.canvasY;
  const distance = Math.hypot(dx, dy);
  if (distance > mark.radius) {
    return 0;
  }

  const proximity = 1 - distance / Math.max(mark.radius, 1);
  return Math.max(0, mark.intensity * proximity);
}

export function updateFalloutImpacts(
  S: GameState,
  nations: Nation[],
  projectLocal: ProjectLocalFn,
  log?: ResolutionLogger
): void {
  if (!S.falloutEffects) {
    S.falloutEffects = {};
  }

  const nationCoords = new Map<string, { x: number; y: number }>();
  nations.forEach(nation => {
    const { x, y } = projectLocal(nation.lon, nation.lat);
    nationCoords.set(nation.id, { x, y });
  });

  const severityMap = new Map<string, number>();

  if (Array.isArray(S.falloutMarks)) {
    for (const mark of S.falloutMarks) {
      const markCoords = projectLocal(mark.lon, mark.lat);
      mark.canvasX = markCoords.x;
      mark.canvasY = markCoords.y;

      nations.forEach(nation => {
        const coords = nationCoords.get(nation.id);
        if (!coords) return;
        const severity = computeSeverityFromMark(mark, coords);
        if (severity <= 0) {
          return;
        }
        severityMap.set(nation.id, (severityMap.get(nation.id) ?? 0) + severity);
      });
    }
  }

  const now = Date.now();

  nations.forEach(nation => {
    const severity = severityMap.get(nation.id) ?? 0;
    const previousState = S.falloutEffects?.[nation.id] ?? defaultNationFalloutState();

    const nextState: NationFalloutState = {
      cumulativeIntensity: previousState.cumulativeIntensity * FALLOUT_EFFECT_DECAY_FACTOR + severity,
      sickness: previousState.sickness * FALLOUT_EFFECT_DECAY_FACTOR + severity * FALLOUT_SICKNESS_MULTIPLIER,
      hunger: previousState.hunger * FALLOUT_EFFECT_DECAY_FACTOR + severity * FALLOUT_HUNGER_MULTIPLIER,
      instability:
        previousState.instability * FALLOUT_EFFECT_DECAY_FACTOR + severity * FALLOUT_INSTABILITY_MULTIPLIER,
      refugeeFlow:
        previousState.refugeeFlow * FALLOUT_EFFECT_DECAY_FACTOR +
        severity * FALLOUT_REFUGEE_MULTIPLIER * Math.max(nation.population, 0),
      lastSeverity: severity > 0 ? getFalloutSeverityLevel(Math.min(1, severity)) : 'none',
      lastUpdated: now,
    };

    S.falloutEffects![nation.id] = nextState;

    nation.radiationSickness = Math.min(100, nextState.sickness);
    nation.falloutHunger = Math.min(100, nextState.hunger);
    nation.falloutInstability = Math.min(100, nextState.instability);
    nation.refugeeFlow = Math.round(nextState.refugeeFlow);

    if (severity > 0) {
      const instabilityDelta = Math.max(0, Math.round(severity * 6 + nextState.instability * 0.02));
      if (instabilityDelta > 0) {
        nation.instability = Math.min(200, (nation.instability ?? 0) + instabilityDelta);
        nation.morale = Math.max(0, (nation.morale ?? 0) - instabilityDelta);
      }

      const refugeesThisTurn = Math.max(0, Math.floor(severity * Math.max(nation.population, 0) * 0.002));
      if (refugeesThisTurn > 0) {
        nation.population = Math.max(0, nation.population - refugeesThisTurn);
        nation.migrantsThisTurn = (nation.migrantsThisTurn ?? 0) + refugeesThisTurn;
        nation.migrantsTotal = (nation.migrantsTotal ?? 0) + refugeesThisTurn;
        if (log) {
          log(`${nation.name} faces ${refugeesThisTurn.toLocaleString()} fallout refugees fleeing the hot zone.`, 'warning');
        }
      }

      if (nation.resourceStockpile) {
        const foodLoss = Math.max(0, Math.round(severity * FALLOUT_FOOD_STOCKPILE_LOSS));
        if (foodLoss > 0) {
          nation.resourceStockpile.food = Math.max(0, nation.resourceStockpile.food - foodLoss);
        }
      }
    }

    // Apply slow decay when severity is zero but previous effects linger
    if (severity === 0) {
      nation.radiationSickness = Math.max(0, nation.radiationSickness ?? 0);
      nation.falloutHunger = Math.max(0, nation.falloutHunger ?? 0);
      nation.falloutInstability = Math.max(0, nation.falloutInstability ?? 0);
      nation.refugeeFlow = Math.max(0, nation.refugeeFlow ?? 0);
    }
  });
}
