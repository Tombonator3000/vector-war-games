import type { Nation } from '@/types/game';

function processNationTimerDecays(
  n: Nation,
  log: (msg: string, type?: string) => void
): void {
  // Cover ops countdown
  if (n.coverOpsTurns && n.coverOpsTurns > 0) {
    n.coverOpsTurns = Math.max(0, n.coverOpsTurns - 1);
  }

  // Deep recon countdown
  if (n.deepRecon) {
    for (const targetId of Object.keys(n.deepRecon)) {
      const remaining = Math.max(0, (n.deepRecon[targetId] || 0) - 1);
      if (remaining <= 0) {
        delete n.deepRecon[targetId];
      } else {
        n.deepRecon[targetId] = remaining;
      }
    }
  }

  // Sanctions countdown (new format with sanctionedBy)
  if (n.sanctionedBy) {
    for (const id of Object.keys(n.sanctionedBy)) {
      const remaining = Math.max(0, (n.sanctionedBy[id] || 0) - 1);
      if (remaining <= 0) {
        delete n.sanctionedBy[id];
      } else {
        n.sanctionedBy[id] = remaining;
      }
    }

    if (Object.keys(n.sanctionedBy).length === 0) {
      delete n.sanctionedBy;
      n.sanctioned = false;
      delete n.sanctionTurns;
      log(`Sanctions on ${n.name} expired.`, 'success');
    } else {
      n.sanctioned = true;
      n.sanctionTurns = Object.values(n.sanctionedBy).reduce((total, turns) => total + turns, 0);
    }
  } else if (n.sanctionTurns && n.sanctionTurns > 0) {
    // Legacy sanctions format
    n.sanctionTurns--;
    if (n.sanctionTurns <= 0) {
      n.sanctioned = false;
      delete n.sanctionTurns;
      log(`Sanctions on ${n.name} expired.`, 'success');
    }
  }

  // Treaty truce countdown
  if (n.treaties) {
    for (const treaty of Object.values(n.treaties)) {
      if (treaty && typeof treaty.truceTurns === 'number' && treaty.truceTurns > 0) {
        treaty.truceTurns = Math.max(0, treaty.truceTurns - 1);
        if (treaty.truceTurns === 0) {
          delete treaty.truceTurns;
        }
      }
    }
  }

  // Migrant tracking
  n.migrantsLastTurn = n.migrantsThisTurn || 0;
  n.migrantsThisTurn = 0;
}

export function processAllNationTimerDecays(
  nations: Nation[],
  log: (msg: string, type?: string) => void
): void {
  for (const n of nations) {
    processNationTimerDecays(n, log);
  }
}
