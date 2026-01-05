/**
 * Nuclear Launch Handler Functions
 *
 * Extracted from Index.tsx to reduce file size and improve maintainability.
 * Handles submarine and bomber nuclear launch logic.
 */

import type { Nation, GameState } from '@/types/game';
import type { ProjectedPoint } from '@/lib/renderingUtils';

// Dependencies that need to be injected
export interface NuclearLaunchDependencies {
  S: GameState;
  projectLocal: (lon: number, lat: number) => ProjectedPoint;
  AudioSys: any;
  toast: (options: any) => void;
  log: (msg: string, type?: string) => void;
}

/**
 * Launch a submarine-based ballistic missile strike
 */
export function launchSubmarine(
  from: Nation,
  to: Nation,
  yieldMT: number,
  deps: NuclearLaunchDependencies
): boolean {
  const { S, projectLocal, AudioSys, toast } = deps;

  const { x: fx, y: fy } = projectLocal(from.lon, from.lat);
  const { x: tx, y: ty } = projectLocal(to.lon, to.lat);

  S.submarines = S.submarines || [];
  S.submarines.push({
    x: fx + (Math.random() - 0.5) * 50,
    y: fy + (Math.random() - 0.5) * 50,
    phase: 0, // 0=surfacing, 1=launching, 2=diving
    targetX: tx,
    targetY: ty,
    yield: yieldMT,
    target: to,
    from
  });

  AudioSys.playSFX('launch');

  // Track statistics for submarine launches
  if (from.isPlayer) {
    if (!S.statistics) {
      S.statistics = {
        nukesLaunched: 0,
        nukesReceived: 0,
        enemiesDestroyed: 0,
        nonPandemicCasualties: 0,
      };
    }
    S.statistics.nukesLaunched++;

    toast({
      title: '🌊 Submarine Launched',
      description: `SLBM strike inbound to ${to.name}. ${yieldMT}MT warhead deployed.`,
      variant: 'destructive',
    });
  }

  return true;
}

/**
 * Launch a strategic bomber strike
 */
export function launchBomber(
  from: Nation,
  to: Nation,
  payload: { yield: number },
  deps: NuclearLaunchDependencies
): boolean {
  const { S, projectLocal, toast } = deps;

  // Add random offset to spread impacts across the country
  const lonOffset = (Math.random() - 0.5) * 6;
  const latOffset = (Math.random() - 0.5) * 6;

  const { x: sx, y: sy } = projectLocal(from.lon, from.lat);
  const { x: tx, y: ty } = projectLocal(to.lon + lonOffset, to.lat + latOffset);

  S.bombers.push({
    from,
    to,
    t: 0,
    sx,
    sy,
    tx,
    ty,
    payload
  });

  // Track statistics for bombers as nuclear launches
  if (from.isPlayer) {
    if (!S.statistics) {
      S.statistics = {
        nukesLaunched: 0,
        nukesReceived: 0,
        enemiesDestroyed: 0,
        nonPandemicCasualties: 0,
      };
    }
    S.statistics.nukesLaunched++;

    toast({
      title: '✈️ Bomber Dispatched',
      description: `Strategic bomber en route to ${to.name}. Payload armed.`,
      variant: 'destructive',
    });
  }

  return true;
}
