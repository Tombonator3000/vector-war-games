import type { Nation } from '@/types/game';
import { ensureTreatyRecord } from '@/lib/nationUtils';

type ActiveTreatyType = 'truce' | 'peace';

function cloneActiveTreaties(nation: Nation): Nation['activeTreaties'] {
  return nation.activeTreaties?.map(treaty => ({ ...treaty })) ?? [];
}

function upsertActiveTreaty(
  nation: Nation,
  withNationId: string,
  expiryTurn: number,
  type: ActiveTreatyType
): Nation['activeTreaties'] {
  const activeTreaties = cloneActiveTreaties(nation);
  const existingIndex = activeTreaties.findIndex(
    treaty => treaty.withNationId === withNationId && treaty.type === type
  );

  if (existingIndex >= 0) {
    const existing = activeTreaties[existingIndex];
    activeTreaties[existingIndex] = {
      ...existing,
      expiryTurn: Math.max(existing.expiryTurn, expiryTurn),
    };
  } else {
    activeTreaties.push({ withNationId, expiryTurn, type });
  }

  return activeTreaties;
}

function ensureAllianceList(nation: Nation, partnerId: string): string[] {
  const alliances = new Set([...(nation.alliances ?? [])]);
  alliances.add(partnerId);
  return Array.from(alliances);
}

function cloneTreaties(nation: Nation): Record<string, any> {
  return { ...(nation.treaties ?? {}) };
}

export function applyAllianceProposal(player: Nation, target: Nation) {
  const updatedPlayer: Nation = {
    ...player,
    alliances: ensureAllianceList(player, target.id),
    treaties: cloneTreaties(player),
  };
  const updatedTarget: Nation = {
    ...target,
    alliances: ensureAllianceList(target, player.id),
    treaties: cloneTreaties(target),
  };

  const playerTreaty = ensureTreatyRecord(updatedPlayer, updatedTarget);
  const targetTreaty = ensureTreatyRecord(updatedTarget, updatedPlayer);

  playerTreaty.alliance = true;
  targetTreaty.alliance = true;

  return { updatedPlayer, updatedTarget };
}

export function applyTruceProposal(
  player: Nation,
  target: Nation,
  duration: number,
  currentTurn: number
) {
  const expiryTurn = currentTurn + duration;

  const playerTreaties = cloneTreaties(player);
  const targetTreaties = cloneTreaties(target);

  const updatedPlayer: Nation = {
    ...player,
    treaties: playerTreaties,
    activeTreaties: upsertActiveTreaty(player, target.id, expiryTurn, 'truce'),
  };

  const targetRelationships = {
    ...(target.relationships ?? {}),
    [player.id]: Math.min(100, (target.relationships?.[player.id] ?? 0) + 15),
  };

  const updatedTarget: Nation = {
    ...target,
    treaties: targetTreaties,
    activeTreaties: upsertActiveTreaty(target, player.id, expiryTurn, 'truce'),
    relationships: targetRelationships,
  };

  const playerTreaty = ensureTreatyRecord(updatedPlayer, updatedTarget);
  const targetTreaty = ensureTreatyRecord(updatedTarget, updatedPlayer);

  const computeTruceTurns = (existing: unknown) =>
    Math.max(typeof existing === 'number' ? (existing as number) : 0, duration);

  playerTreaty.truceTurns = computeTruceTurns(playerTreaty.truceTurns);
  targetTreaty.truceTurns = computeTruceTurns(targetTreaty.truceTurns);

  playerTreaty.truceEstablishedTurn = currentTurn;
  targetTreaty.truceEstablishedTurn = currentTurn;

  const normalizeExpiry = (value: unknown) =>
    typeof value === 'number' && Number.isFinite(value) ? (value as number) : 0;

  playerTreaty.truceExpiryTurn = Math.max(normalizeExpiry(playerTreaty.truceExpiryTurn), expiryTurn);
  targetTreaty.truceExpiryTurn = Math.max(normalizeExpiry(targetTreaty.truceExpiryTurn), expiryTurn);

  return { updatedPlayer, updatedTarget, expiryTurn };
}
