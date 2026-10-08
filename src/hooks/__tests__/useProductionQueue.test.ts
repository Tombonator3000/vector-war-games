import { createElement, StrictMode, type ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useProductionQueue } from '../useProductionQueue';

const nations = [{ id: 'player', name: 'Player' }];
const lineId = 'player-line-1';
const strictWrapper = ({ children }: { children: ReactNode }) =>
  createElement(StrictMode, null, children);

describe('useProductionQueue', () => {
  it('rejects a second start on the same line within one React batch', () => {
    const { result } = renderHook(() => useProductionQueue({ nations, currentTurn: 1 }));
    const originalQueue = result.current.getQueue('player')!;
    act(() => {
      expect(result.current.startProduction('player', 'factory', lineId).success).toBe(true);
      expect(result.current.startProduction('player', 'icbm', lineId).success).toBe(false);
    });
    expect(result.current.getQueue('player')!.lines[0].currentItem!.type).toBe('factory');
    expect(originalQueue.lines[0].currentItem).toBeNull();
  });

  it('returns and logs completions synchronously under batching and StrictMode', () => {
    const { result } = renderHook(
      () => useProductionQueue({ nations, currentTurn: 1 }),
      { wrapper: strictWrapper },
    );
    act(() => {
      result.current.startProduction('player', 'factory', lineId);
      result.current.updateCapacity('player', { baseProduction: 1000 });
      const completions = result.current.processTurnProduction();
      expect(completions).toHaveLength(1);
      expect(completions[0].itemType).toBe('factory');
      expect(result.current.processTurnProduction()).toEqual([]);
    });
    expect(result.current.completionLog).toHaveLength(1);
    expect(result.current.getQueue('player')!.lines[0].currentItem).toBeNull();
  });

  it('advances production at most once for each turn without mutating old snapshots', () => {
    const { result, rerender } = renderHook(
      ({ currentTurn }) => useProductionQueue({ nations, currentTurn }),
      { initialProps: { currentTurn: 1 }, wrapper: strictWrapper },
    );
    act(() => { result.current.startProduction('player', 'factory', lineId); });
    const originalQueue = result.current.getQueue('player')!;
    act(() => {
      result.current.processTurnProduction();
      result.current.processTurnProduction();
    });
    expect(result.current.getQueue('player')!.lines[0].currentItem!.progress).toBeCloseTo(12);
    expect(originalQueue.lines[0].currentItem!.progress).toBe(0);
    expect(originalQueue.lines[0].efficiency).toBe(50);
    rerender({ currentTurn: 2 });
    act(() => { result.current.processTurnProduction(); });
    expect(result.current.getQueue('player')!.lines[0].currentItem!.progress).toBeCloseTo(26);
  });

  it('does not manufacture completed items with zero production capacity', () => {
    const { result, rerender } = renderHook(
      ({ currentTurn }) => useProductionQueue({ nations, currentTurn }),
      { initialProps: { currentTurn: 1 } },
    );
    act(() => {
      result.current.startProduction('player', 'icbm', lineId);
      result.current.updateCapacity('player', { baseProduction: 0 });
    });
    for (let currentTurn = 1; currentTurn <= 6; currentTurn++) {
      rerender({ currentTurn });
      act(() => { expect(result.current.processTurnProduction()).toEqual([]); });
    }
    expect(result.current.getQueue('player')!.lines[0].currentItem!.progress).toBe(0);
    expect(result.current.completionLog).toEqual([]);
    rerender({ currentTurn: 7 });
    act(() => {
      result.current.updateCapacity('player', { baseProduction: 1000 });
      expect(result.current.processTurnProduction()).toHaveLength(1);
    });
  });

  it('rejects explicitly selected paused lines and reports invalid cancellation', () => {
    const { result } = renderHook(() => useProductionQueue({ nations, currentTurn: 1 }));
    act(() => { result.current.togglePause('player', lineId); });
    act(() => {
      expect(result.current.startProduction('player', 'factory', lineId).success).toBe(false);
      expect(result.current.cancelProduction('player', 'missing-line').success).toBe(false);
    });
  });

  it('resets completion history and permits processing when queues are reinitialized', () => {
    const { result } = renderHook(() => useProductionQueue({ nations, currentTurn: 1 }));
    act(() => {
      result.current.startProduction('player', 'factory', lineId);
      result.current.updateCapacity('player', { baseProduction: 1000 });
      result.current.processTurnProduction();
    });
    act(() => {
      result.current.initializeQueues();
      result.current.startProduction('player', 'factory', lineId);
      result.current.updateCapacity('player', { baseProduction: 1000 });
      expect(result.current.processTurnProduction()).toHaveLength(1);
    });
    expect(result.current.completionLog).toHaveLength(1);
  });
});

