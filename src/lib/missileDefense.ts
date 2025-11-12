export interface MissileInterceptBreakdown {
  totalChance: number;
  baseChance: number;
  allyChances: number[];
}

const BASE_DEFENSE_INTERCEPT_RATE = 0.02; // 2% per defense point for the primary target
const ALLIED_DEFENSE_INTERCEPT_RATE = 0.01; // 1% per defense point for allied contributions
export const MAX_MISSILE_INTERCEPT_CHANCE = 0.75;

/**
 * Normalize missile interception odds so they remain capped and consistent across the UI.
 *
 * @param baseDefense Defense score of the primary target nation.
 * @param alliedDefenses Defense scores for allied nations contributing interception support.
 */
export function calculateMissileInterceptChance(
  baseDefense: number,
  alliedDefenses: number[] = []
): MissileInterceptBreakdown {
  const sanitizedBaseDefense = Math.max(0, baseDefense);
  const sanitizedAlliedDefenses = alliedDefenses.map((defense) => Math.max(0, defense));

  const baseChance = sanitizedBaseDefense * BASE_DEFENSE_INTERCEPT_RATE;
  const rawAllyChances = sanitizedAlliedDefenses.map(
    (defense) => defense * ALLIED_DEFENSE_INTERCEPT_RATE
  );
  const rawTotal = baseChance + rawAllyChances.reduce((sum, chance) => sum + chance, 0);

  if (rawTotal === 0) {
    return {
      totalChance: 0,
      baseChance: 0,
      allyChances: rawAllyChances.map(() => 0),
    };
  }

  const cappedTotal = Math.min(MAX_MISSILE_INTERCEPT_CHANCE, rawTotal);
  const scale = rawTotal > 0 ? cappedTotal / rawTotal : 0;

  return {
    totalChance: cappedTotal,
    baseChance: baseChance * scale,
    allyChances: rawAllyChances.map((chance) => chance * scale),
  };
}
