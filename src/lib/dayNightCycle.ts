/** Four turn cycle: day -> dusk -> night -> dawn. */
export function getDayNightBlendForTurn(turn: number): number {
  if (!Number.isFinite(turn)) return 0;
  const phase = ((Math.floor(turn) - 1) % 4 + 4) % 4;
  return phase <= 2 ? phase / 2 : 0.5;
}
