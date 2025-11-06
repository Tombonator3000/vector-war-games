/**
 * Production Queue Hook
 *
 * Manages production queues, lines, and item completion for each nation.
 */

import { useState, useCallback, useEffect } from 'react';
import {
  ProductionQueue,
  ProductionLine,
  ProductionItem,
  ProductionCapacity,
  ProductionItemType,
  ProductionCompletionLog,
  ProductionAllocation,
} from '../types/production';
import { getProductionTemplate, calculateTurnsToComplete } from '../data/productionItems';

interface UseProductionQueueOptions {
  currentTurn: number;
  nations: Array<{ id: string; name: string }>;
}

export function useProductionQueue({ currentTurn, nations }: UseProductionQueueOptions) {
  const [queues, setQueues] = useState<Map<string, ProductionQueue>>(new Map());
  const [capacities, setCapacities] = useState<Map<string, ProductionCapacity>>(new Map());
  const [completionLog, setCompletionLog] = useState<ProductionCompletionLog[]>([]);

  /**
   * Initialize production queues for all nations
   */
  const initializeQueues = useCallback(() => {
    const newQueues = new Map<string, ProductionQueue>();
    const newCapacities = new Map<string, ProductionCapacity>();

    nations.forEach((nation) => {
      // Initialize production lines
      const lines: ProductionLine[] = [];
      const initialLines = 5; // Starting production lines

      for (let i = 1; i <= initialLines; i++) {
        lines.push({
          id: `${nation.id}-line-${i}`,
          nationId: nation.id,
          lineNumber: i,
          currentItem: null,
          efficiency: 50, // Start at 50% efficiency
          isActive: true,
          isPaused: false,
        });
      }

      newQueues.set(nation.id, {
        nationId: nation.id,
        lines,
        maxLines: 15,
        queuedItems: [],
      });

      newCapacities.set(nation.id, {
        nationId: nation.id,
        baseProduction: 100, // Base production capacity
        bonusProduction: 0,
        totalProduction: 100,
        productionUsed: 0,
        productionAvailable: 100,
      });
    });

    setQueues(newQueues);
    setCapacities(newCapacities);
  }, [nations]);

  /**
   * Get production queue for a nation
   */
  const getQueue = useCallback(
    (nationId: string): ProductionQueue | undefined => {
      return queues.get(nationId);
    },
    [queues]
  );

  /**
   * Get production capacity for a nation
   */
  const getCapacity = useCallback(
    (nationId: string): ProductionCapacity | undefined => {
      return capacities.get(nationId);
    },
    [capacities]
  );

  /**
   * Add a new production line (from building factory)
   */
  const addProductionLine = useCallback((nationId: string) => {
    setQueues((prev) => {
      const newQueues = new Map(prev);
      const queue = newQueues.get(nationId);

      if (!queue) return prev;

      if (queue.lines.length >= queue.maxLines) {
        console.warn(`Nation ${nationId} already at max production lines`);
        return prev;
      }

      const newLineNumber = queue.lines.length + 1;
      const newLine: ProductionLine = {
        id: `${nationId}-line-${newLineNumber}`,
        nationId,
        lineNumber: newLineNumber,
        currentItem: null,
        efficiency: 50,
        isActive: true,
        isPaused: false,
      };

      queue.lines.push(newLine);
      newQueues.set(nationId, { ...queue });

      return newQueues;
    });
  }, []);

  /**
   * Start production of an item
   */
  const startProduction = useCallback(
    (
      nationId: string,
      itemType: ProductionItemType,
      lineId?: string
    ): { success: boolean; message: string } => {
      const queue = queues.get(nationId);
      if (!queue) {
        return { success: false, message: 'Nation not found' };
      }

      // Find available line or use specified line
      let targetLine: ProductionLine | undefined;

      if (lineId) {
        targetLine = queue.lines.find((line) => line.id === lineId);
        if (!targetLine) {
          return { success: false, message: 'Production line not found' };
        }
        if (targetLine.currentItem) {
          return { success: false, message: 'Production line is busy' };
        }
      } else {
        targetLine = queue.lines.find((line) => line.isActive && !line.currentItem && !line.isPaused);
        if (!targetLine) {
          return { success: false, message: 'No available production lines' };
        }
      }

      // Get production template
      const template = getProductionTemplate(itemType);

      // Create production item
      const newItem: ProductionItem = {
        id: `${nationId}-${itemType}-${Date.now()}`,
        type: itemType,
        name: template.name,
        description: template.description,
        category: template.category,
        icon: template.icon,
        totalCost: template.resourceCosts.production,
        resourceCosts: template.resourceCosts,
        progress: 0,
        turnsToComplete: template.baseTurnsToComplete,
        turnsRemaining: template.baseTurnsToComplete,
        startedTurn: currentTurn,
        priorityLevel: 3, // Default priority
      };

      // Update queue
      setQueues((prev) => {
        const newQueues = new Map(prev);
        const updatedQueue = newQueues.get(nationId)!;
        const lineIndex = updatedQueue.lines.findIndex((l) => l.id === targetLine!.id);

        updatedQueue.lines[lineIndex] = {
          ...updatedQueue.lines[lineIndex],
          currentItem: newItem,
        };

        newQueues.set(nationId, { ...updatedQueue });
        return newQueues;
      });

      return { success: true, message: `Started production of ${template.name}` };
    },
    [queues, currentTurn]
  );

  /**
   * Cancel production on a line
   */
  const cancelProduction = useCallback(
    (nationId: string, lineId: string): { success: boolean; message: string } => {
      setQueues((prev) => {
        const newQueues = new Map(prev);
        const queue = newQueues.get(nationId);

        if (!queue) {
          return prev;
        }

        const lineIndex = queue.lines.findIndex((l) => l.id === lineId);
        if (lineIndex === -1) {
          return prev;
        }

        const line = queue.lines[lineIndex];
        if (!line.currentItem) {
          return prev;
        }

        // Clear the production item
        queue.lines[lineIndex] = {
          ...line,
          currentItem: null,
          efficiency: 50, // Reset efficiency
        };

        newQueues.set(nationId, { ...queue });
        return newQueues;
      });

      return { success: true, message: 'Production cancelled' };
    },
    []
  );

  /**
   * Pause/unpause a production line
   */
  const togglePause = useCallback((nationId: string, lineId: string) => {
    setQueues((prev) => {
      const newQueues = new Map(prev);
      const queue = newQueues.get(nationId);

      if (!queue) return prev;

      const lineIndex = queue.lines.findIndex((l) => l.id === lineId);
      if (lineIndex === -1) return prev;

      queue.lines[lineIndex] = {
        ...queue.lines[lineIndex],
        isPaused: !queue.lines[lineIndex].isPaused,
      };

      newQueues.set(nationId, { ...queue });
      return newQueues;
    });
  }, []);

  /**
   * Process production for all nations (called each turn)
   */
  const processTurnProduction = useCallback(() => {
    const newCompletions: ProductionCompletionLog[] = [];

    setQueues((prev) => {
      const newQueues = new Map(prev);

      nations.forEach((nation) => {
        const queue = newQueues.get(nation.id);
        const capacity = capacities.get(nation.id);

        if (!queue || !capacity) return;

        // Process each active production line
        queue.lines.forEach((line, lineIndex) => {
          if (!line.currentItem || line.isPaused || !line.isActive) {
            return;
          }

          const item = line.currentItem;

          // Increase efficiency over time (ramps to 100%)
          if (line.efficiency < 100) {
            line.efficiency = Math.min(100, line.efficiency + 10);
          }

          // Calculate production progress this turn
          const baseProductionPerLine = capacity.totalProduction / queue.lines.length;
          const effectiveProduction = baseProductionPerLine * (line.efficiency / 100);
          const progressPercentage = (effectiveProduction / item.totalCost) * 100;

          // Update progress
          item.progress = Math.min(100, item.progress + progressPercentage);
          item.turnsRemaining = Math.max(0, item.turnsRemaining - 1);

          // Check if completed
          if (item.progress >= 100 || item.turnsRemaining === 0) {
            // Log completion
            newCompletions.push({
              nationId: nation.id,
              itemType: item.type,
              itemName: item.name,
              completedTurn: currentTurn,
              effect: {
                type: 'add_building',
                payload: { itemType: item.type },
                message: `${item.name} construction completed!`,
              },
            });

            // Clear line
            queue.lines[lineIndex] = {
              ...line,
              currentItem: null,
              efficiency: 50, // Reset efficiency for next item
            };

            // Auto-assign queued item if available
            if (queue.queuedItems.length > 0) {
              const nextItem = queue.queuedItems.shift()!;
              queue.lines[lineIndex].currentItem = nextItem;
            }
          } else {
            // Update item in line
            queue.lines[lineIndex] = {
              ...line,
              currentItem: item,
            };
          }
        });

        newQueues.set(nation.id, { ...queue });
      });

      return newQueues;
    });

    // Add new completions to log
    if (newCompletions.length > 0) {
      setCompletionLog((prev) => [...prev, ...newCompletions]);
    }

    return newCompletions;
  }, [nations, capacities, currentTurn]);

  /**
   * Update production capacity (from bonuses, focuses, etc.)
   */
  const updateCapacity = useCallback(
    (
      nationId: string,
      updates: Partial<Pick<ProductionCapacity, 'baseProduction' | 'bonusProduction'>>
    ) => {
      setCapacities((prev) => {
        const newCapacities = new Map(prev);
        const capacity = newCapacities.get(nationId);

        if (!capacity) return prev;

        const updated = {
          ...capacity,
          ...updates,
        };

        updated.totalProduction = updated.baseProduction + updated.bonusProduction;
        updated.productionAvailable = updated.totalProduction;

        newCapacities.set(nationId, updated);
        return newCapacities;
      });
    },
    []
  );

  /**
   * Get active production count for a nation
   */
  const getActiveProductionCount = useCallback(
    (nationId: string): number => {
      const queue = queues.get(nationId);
      if (!queue) return 0;

      return queue.lines.filter((line) => line.currentItem !== null).length;
    },
    [queues]
  );

  /**
   * Get all items currently in production
   */
  const getProductionInProgress = useCallback(
    (nationId: string): ProductionItem[] => {
      const queue = queues.get(nationId);
      if (!queue) return [];

      return queue.lines
        .filter((line) => line.currentItem !== null)
        .map((line) => line.currentItem!);
    },
    [queues]
  );

  /**
   * Get recent completions
   */
  const getRecentCompletions = useCallback(
    (nationId: string, lastNTurns: number = 5): ProductionCompletionLog[] => {
      return completionLog.filter(
        (log) =>
          log.nationId === nationId && currentTurn - log.completedTurn <= lastNTurns
      );
    },
    [completionLog, currentTurn]
  );

  // Initialize on mount
  useEffect(() => {
    if (queues.size === 0) {
      initializeQueues();
    }
  }, [initializeQueues, queues.size]);

  return {
    // State
    queues,
    capacities,
    completionLog,

    // Queries
    getQueue,
    getCapacity,
    getActiveProductionCount,
    getProductionInProgress,
    getRecentCompletions,

    // Mutations
    startProduction,
    cancelProduction,
    togglePause,
    addProductionLine,
    updateCapacity,

    // Turn processing
    processTurnProduction,

    // Initialization
    initializeQueues,
  };
}
