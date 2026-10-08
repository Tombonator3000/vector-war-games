/**
 * Owns immutable production queues and exposes synchronous, atomic commands.
 * Refs keep commands consistent when React batches several actions together.
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import type {
  ProductionQueue,
  ProductionLine,
  ProductionItem,
  ProductionCapacity,
  ProductionItemType,
  ProductionCompletionLog,
} from '../types/production';
import { getProductionTemplate } from '../data/productionItems';
import { advanceProductionQueues } from '../utils/productionQueue.utils';

interface UseProductionQueueOptions {
  currentTurn: number;
  nations: Array<{ id: string; name: string }>;
}

export function useProductionQueue({ currentTurn, nations }: UseProductionQueueOptions) {
  const [queues, setQueues] = useState<Map<string, ProductionQueue>>(new Map());
  const [capacities, setCapacities] = useState<Map<string, ProductionCapacity>>(new Map());
  const [completionLog, setCompletionLog] = useState<ProductionCompletionLog[]>([]);
  const queuesRef = useRef(queues);
  const capacitiesRef = useRef(capacities);
  const lastProcessedTurn = useRef<number | null>(null);
  const itemSequence = useRef(0);

  const commitQueues = useCallback((next: Map<string, ProductionQueue>) => {
    queuesRef.current = next;
    setQueues(next);
  }, []);

  const commitCapacities = useCallback((next: Map<string, ProductionCapacity>) => {
    capacitiesRef.current = next;
    setCapacities(next);
  }, []);

  const initializeQueues = useCallback(() => {
    const nextQueues = new Map<string, ProductionQueue>();
    const nextCapacities = new Map<string, ProductionCapacity>();
    for (const nation of nations) {
      const lines: ProductionLine[] = Array.from({ length: 5 }, (_, index) => ({
        id: `${nation.id}-line-${index + 1}`,
        nationId: nation.id, lineNumber: index + 1,
        currentItem: null, efficiency: 50, isActive: true, isPaused: false,
      }));
      nextQueues.set(nation.id, { nationId: nation.id, lines, maxLines: 15, queuedItems: [] });
      nextCapacities.set(nation.id, {
        nationId: nation.id, baseProduction: 100, bonusProduction: 0,
        totalProduction: 100, productionUsed: 0, productionAvailable: 100,
      });
    }
    lastProcessedTurn.current = null;
    commitQueues(nextQueues);
    commitCapacities(nextCapacities);
    setCompletionLog([]);
  }, [nations, commitQueues, commitCapacities]);

  const getQueue = useCallback((nationId: string) => queuesRef.current.get(nationId), []);
  const getCapacity = useCallback((nationId: string) => capacitiesRef.current.get(nationId), []);

  const replaceQueue = useCallback((nationId: string, queue: ProductionQueue) => {
    const next = new Map(queuesRef.current);
    next.set(nationId, queue);
    commitQueues(next);
  }, [commitQueues]);

  const addProductionLine = useCallback((nationId: string) => {
    const queue = queuesRef.current.get(nationId);
    if (!queue || queue.lines.length >= queue.maxLines) return;
    const lineNumber = queue.lines.length + 1;
    const line: ProductionLine = {
      id: `${nationId}-line-${lineNumber}`, nationId, lineNumber,
      currentItem: null, efficiency: 50, isActive: true, isPaused: false,
    };
    replaceQueue(nationId, { ...queue, lines: [...queue.lines, line] });
  }, [replaceQueue]);

  const startProduction = useCallback((
    nationId: string, itemType: ProductionItemType, lineId?: string,
  ): { success: boolean; message: string } => {
    const queue = queuesRef.current.get(nationId);
    if (!queue) return { success: false, message: 'Nation not found' };
    const line = lineId
      ? queue.lines.find((candidate) => candidate.id === lineId)
      : queue.lines.find((candidate) => candidate.isActive && !candidate.isPaused && !candidate.currentItem);
    if (!line) return { success: false, message: lineId ? 'Production line not found' : 'No available production lines' };
    if (line.currentItem) return { success: false, message: 'Production line is busy' };
    if (!line.isActive || line.isPaused) return { success: false, message: 'Production line is unavailable' };

    const template = getProductionTemplate(itemType);
    if (!template) return { success: false, message: 'Unknown production item' };
    const newItem: ProductionItem = {
      id: `${nationId}-${itemType}-${Date.now()}-${++itemSequence.current}`,
      type: itemType, name: template.name, description: template.description,
      category: template.category, icon: template.icon,
      totalCost: template.resourceCosts.production, resourceCosts: { ...template.resourceCosts },
      progress: 0, turnsToComplete: template.baseTurnsToComplete,
      turnsRemaining: template.baseTurnsToComplete, startedTurn: currentTurn, priorityLevel: 3,
    };
    replaceQueue(nationId, {
      ...queue,
      lines: queue.lines.map((candidate) => candidate.id === line.id ? { ...candidate, currentItem: newItem } : candidate),
    });
    return { success: true, message: `Started production of ${template.name}` };
  }, [currentTurn, replaceQueue]);

  const cancelProduction = useCallback((nationId: string, lineId: string) => {
    const queue = queuesRef.current.get(nationId);
    const line = queue?.lines.find((candidate) => candidate.id === lineId);
    if (!queue || !line?.currentItem) return { success: false, message: 'No production to cancel' };
    replaceQueue(nationId, {
      ...queue,
      lines: queue.lines.map((candidate) => candidate.id === lineId
        ? { ...candidate, currentItem: null, efficiency: 50 } : candidate),
    });
    return { success: true, message: 'Production cancelled' };
  }, [replaceQueue]);

  const togglePause = useCallback((nationId: string, lineId: string) => {
    const queue = queuesRef.current.get(nationId);
    if (!queue) return;
    replaceQueue(nationId, {
      ...queue,
      lines: queue.lines.map((line) => line.id === lineId ? { ...line, isPaused: !line.isPaused } : line),
    });
  }, [replaceQueue]);

  const processTurnProduction = useCallback((): ProductionCompletionLog[] => {
    if (lastProcessedTurn.current === currentTurn) return [];
    lastProcessedTurn.current = currentTurn;
    const result = advanceProductionQueues(queuesRef.current, capacitiesRef.current, currentTurn);
    commitQueues(result.queues);
    if (result.completions.length > 0) setCompletionLog((previous) => [...previous, ...result.completions]);
    return result.completions;
  }, [currentTurn, commitQueues]);

  const updateCapacity = useCallback((
    nationId: string,
    updates: Partial<Pick<ProductionCapacity, 'baseProduction' | 'bonusProduction'>>,
  ) => {
    const capacity = capacitiesRef.current.get(nationId);
    if (!capacity) return;
    const updated = { ...capacity };
    for (const key of ['baseProduction', 'bonusProduction'] as const) {
      const value = updates[key];
      if (value !== undefined && Number.isFinite(value)) updated[key] = value;
    }
    updated.totalProduction = Math.max(0, updated.baseProduction + updated.bonusProduction);
    updated.productionAvailable = Math.max(0, updated.totalProduction - updated.productionUsed);
    const next = new Map(capacitiesRef.current);
    next.set(nationId, updated);
    commitCapacities(next);
  }, [commitCapacities]);

  const getActiveProductionCount = useCallback((nationId: string): number =>
    queuesRef.current.get(nationId)?.lines.filter((line) => line.currentItem !== null).length ?? 0, []);

  const getProductionInProgress = useCallback((nationId: string): ProductionItem[] =>
    queuesRef.current.get(nationId)?.lines.flatMap((line) => line.currentItem ? [line.currentItem] : []) ?? [], []);

  const getRecentCompletions = useCallback((nationId: string, lastNTurns = 5) =>
    completionLog.filter((log) => log.nationId === nationId
      && currentTurn >= log.completedTurn && currentTurn - log.completedTurn <= lastNTurns),
  [completionLog, currentTurn]);

  useEffect(() => {
    if (queuesRef.current.size === 0 && nations.length > 0) initializeQueues();
  }, [initializeQueues, nations.length]);

  return {
    queues, capacities, completionLog,
    getQueue, getCapacity, getActiveProductionCount, getProductionInProgress, getRecentCompletions,
    startProduction, cancelProduction, togglePause, addProductionLine, updateCapacity,
    processTurnProduction, initializeQueues,
  };
}

