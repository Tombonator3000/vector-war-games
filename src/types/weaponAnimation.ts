import type { Nation } from './game';

export interface BomberAnimation {
  t: number;
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  from?: Nation | null;
  to: Nation;
  payload: { yield: number };
  detected?: boolean;
}

export interface SubmarineAnimation {
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
  phase: 0 | 1 | 2;
  phaseProgress?: number;
  diveProgress?: number;
  from?: Nation | null;
  target: Nation;
  yield: number;
}
