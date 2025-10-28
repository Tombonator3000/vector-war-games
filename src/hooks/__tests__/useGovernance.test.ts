import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useGovernance, type GovernanceNationRef } from '../useGovernance';

interface MockNation extends GovernanceNationRef {
  instability?: number;
}

describe('useGovernance', () => {
  let nations: MockNation[];
  let turn: number;
  let newsSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    turn = 1;
    nations = [
      {
        id: 'player',
        name: 'Player',
        isPlayer: true,
        morale: 70,
        publicOpinion: 65,
        electionTimer: 6,
        cabinetApproval: 60,
        production: 40,
        intel: 20,
        uranium: 12,
        instability: 15,
      },
      {
        id: 'ai_0',
        name: 'Rival',
        isPlayer: false,
        morale: 58,
        publicOpinion: 55,
        electionTimer: 8,
        cabinetApproval: 52,
        production: 30,
        intel: 14,
        uranium: 9,
        instability: 18,
      },
    ];
    newsSpy = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const getNations = () => nations;

  const syncMetrics = (nationId: string, metrics: { morale: number; publicOpinion: number; electionTimer: number; cabinetApproval: number; }) => {
    const nation = nations.find((n) => n.id === nationId);
    if (nation) {
      nation.morale = metrics.morale;
      nation.publicOpinion = metrics.publicOpinion;
      nation.electionTimer = metrics.electionTimer;
      nation.cabinetApproval = metrics.cabinetApproval;
    }
  };

  const applyDelta = (nationId: string, delta: { instability?: number; production?: number; intel?: number; uranium?: number }) => {
    const nation = nations.find((n) => n.id === nationId);
    if (!nation) return;
    if (typeof delta.instability === 'number') {
      nation.instability = Math.max(0, (nation.instability ?? 0) + delta.instability);
    }
    if (typeof delta.production === 'number') {
      nation.production = Math.max(0, nation.production + delta.production);
    }
    if (typeof delta.intel === 'number') {
      nation.intel = Math.max(0, nation.intel + delta.intel);
    }
    if (typeof delta.uranium === 'number') {
      nation.uranium = Math.max(0, nation.uranium + delta.uranium);
    }
  };

  it('decays morale each turn based on approval drift', async () => {
    const { rerender } = renderHook(({ currentTurn }) =>
      useGovernance({
        currentTurn,
        getNations,
        onMetricsSync: syncMetrics,
        onApplyDelta: applyDelta,
      }),
    { initialProps: { currentTurn: turn } });

    turn += 1;
    rerender({ currentTurn: turn });

    await waitFor(() => {
      expect(nations[0].morale).toBeLessThan(70);
      expect(nations[0].publicOpinion).not.toBe(65);
    });
  });

  it('emits morale crisis event and applies option outcome', async () => {
    nations[0].morale = 50;
    nations[0].publicOpinion = 48;
    nations[0].cabinetApproval = 50;
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.01);

    const { result } = renderHook(({ currentTurn }) =>
      useGovernance({
        currentTurn,
        getNations,
        onMetricsSync: syncMetrics,
        onApplyDelta: applyDelta,
        onAddNewsItem: newsSpy,
      }),
    { initialProps: { currentTurn: turn } });

    await waitFor(() => {
      expect(result.current.activeEvent).not.toBeNull();
    });

    const optionId = result.current.activeEvent!.definition.options[0].id;

    await act(async () => {
      result.current.selectOption(optionId);
    });

    await waitFor(() => {
      expect(result.current.activeEvent).toBeNull();
    });

    expect(nations[0].morale).toBeGreaterThan(40);
    expect(newsSpy).toHaveBeenCalled();

    randomSpy.mockRestore();
  });

  it('triggers election turnover and resets timer', async () => {
    nations[0].electionTimer = 0;
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.02);

    const { result, rerender } = renderHook(({ currentTurn }) =>
      useGovernance({
        currentTurn,
        getNations,
        onMetricsSync: syncMetrics,
        onApplyDelta: applyDelta,
        onAddNewsItem: newsSpy,
      }),
    { initialProps: { currentTurn: turn } });

    await waitFor(() => {
      expect(result.current.activeEvent?.definition.id).toBe('election_cycle');
    });

    const electionOption = result.current.activeEvent!.definition.options[0].id;

    await act(async () => {
      result.current.selectOption(electionOption);
    });

    await waitFor(() => {
      expect(result.current.activeEvent).toBeNull();
    });

    turn += 1;
    rerender({ currentTurn: turn });

    await waitFor(() => {
      expect(nations[0].electionTimer).toBeGreaterThan(0);
    });

    randomSpy.mockRestore();
  });

  it('prevents morale crisis from reopening in the same turn after a negative outcome', async () => {
    nations[0].morale = 45;
    nations[0].publicOpinion = 40;
    nations[0].cabinetApproval = 55;

    const randomSpy = vi.spyOn(Math, 'random');
    randomSpy.mockReturnValue(0.99);
    randomSpy.mockReturnValueOnce(0.2);
    randomSpy.mockReturnValueOnce(0.1);

    const { result, rerender } = renderHook(({ currentTurn }) =>
      useGovernance({
        currentTurn,
        getNations,
        onMetricsSync: syncMetrics,
        onApplyDelta: applyDelta,
        onAddNewsItem: newsSpy,
      }),
    { initialProps: { currentTurn: turn } });

    await waitFor(() => {
      expect(result.current.activeEvent?.definition.id).toBe('morale_crisis');
    });

    const optionId = result.current.activeEvent!.definition.options[0].id;

    await act(async () => {
      result.current.selectOption(optionId);
    });

    await waitFor(() => {
      expect(result.current.activeEvent).toBeNull();
    });

    rerender({ currentTurn: turn });

    await waitFor(() => {
      expect(result.current.activeEvent).toBeNull();
    });

    turn += 1;
    rerender({ currentTurn: turn });

    await waitFor(() => {
      expect(result.current.activeEvent?.definition.id).toBe('morale_crisis');
    });

    randomSpy.mockRestore();
  });
});
