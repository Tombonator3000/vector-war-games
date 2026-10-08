import type {
  ProductionCapacity,
  ProductionCompletionLog,
  ProductionLine,
  ProductionQueue,
} from '@/types/production';

interface ProductionTurnResult {
  queues: Map<string, ProductionQueue>;
  completions: ProductionCompletionLog[];
}

/** Advance a queue without mutating snapshots held by React or the caller. */
function advanceLine(line: ProductionLine, productionPerLine: number): ProductionLine {
  if (!line.currentItem || line.isPaused || !line.isActive) return line;

  const efficiency = Math.min(100, line.efficiency + 10);
  const effectiveProduction = productionPerLine * efficiency / 100;
  const item = line.currentItem;
  const progress = item.totalCost > 0
    ? Math.min(100, item.progress + effectiveProduction / item.totalCost * 100)
    : 100;
  const remainingCost = item.totalCost * (1 - progress / 100);
  const turnsRemaining = progress >= 100
    ? 0
    : effectiveProduction > 0
      ? Math.max(1, Math.ceil(remainingCost / effectiveProduction))
      : Math.max(1, item.turnsRemaining);

  return { ...line, efficiency, currentItem: { ...item, progress, turnsRemaining } };
}

export function advanceProductionQueues(
  queues: Map<string, ProductionQueue>,
  capacities: Map<string, ProductionCapacity>,
  currentTurn: number,
): ProductionTurnResult {
  const nextQueues = new Map(queues);
  const completions: ProductionCompletionLog[] = [];

  for (const [nationId, queue] of queues) {
    const capacity = capacities.get(nationId);
    if (!capacity || queue.lines.length === 0) continue;

    const queuedItems = [...queue.queuedItems];
    const productionPerLine = Math.max(0, capacity.totalProduction) / queue.lines.length;
    const lines = queue.lines.map((line) => {
      const advanced = advanceLine(line, productionPerLine);
      const item = advanced.currentItem;
      if (!item || item.progress < 100 || advanced === line) return advanced;

      completions.push({
        nationId,
        itemType: item.type,
        itemName: item.name,
        completedTurn: currentTurn,
        effect: {
          type: 'add_building',
          payload: { itemType: item.type },
          message: `${item.name} construction completed!`,
        },
      });
      return { ...advanced, currentItem: queuedItems.shift() ?? null, efficiency: 50 };
    });
    nextQueues.set(nationId, { ...queue, lines, queuedItems });
  }

  return { queues: nextQueues, completions };
}

