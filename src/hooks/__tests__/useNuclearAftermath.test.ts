import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useNuclearAftermath } from '../useNuclearAftermath';
import { emitNuclearAftermathEvent, resetNuclearAftermathListeners } from '@/state/nuclearAftermathEvents';

describe('useNuclearAftermath', () => {
  afterEach(() => {
    resetNuclearAftermathListeners();
  });

  it('queues aftermath entries with configured delay', () => {
    const { result } = renderHook(() => useNuclearAftermath({ delay: 2 }));

    act(() => {
      emitNuclearAftermathEvent({
        nationName: 'Testland',
        humanitarianSummary: 'Millions feared dead as the firestorm sweeps the city.',
        environmentalSummary: 'Irradiated fallout clouds blot out the skyline.',
        stageSummaries: ['Shockwave topples critical infrastructure.'],
        severity: 1.8,
        totalRefugees: 3.5,
        turnCreated: 5,
      });
    });

    expect(result.current.queue).toHaveLength(1);
    expect(result.current.queue[0].turnsUntilReveal).toBe(2);
    expect(result.current.activeAftermath).toBeNull();
  });

  it('promotes ready aftermath entries into the active modal', async () => {
    const { result } = renderHook(() => useNuclearAftermath({ delay: 1 }));

    act(() => {
      result.current.enqueueAftermath({
        nationName: 'Arcadia',
        humanitarianSummary: 'Civilian casualty counts spike as rescue lines collapse.',
        environmentalSummary: 'Ash and fallout poison the river delta.',
        stageSummaries: ['Thermal pulse incinerates relief corridors.'],
        severity: 2.1,
        totalRefugees: 4.2,
        turnCreated: 10,
      });
    });

    expect(result.current.activeAftermath).toBeNull();

    act(() => {
      result.current.advanceTurn(11);
    });

    await waitFor(() => {
      expect(result.current.queue).toHaveLength(0);
    });

    await waitFor(() => {
      expect(result.current.visible).toHaveLength(1);
    });

    await waitFor(() => {
      expect(result.current.activeAftermath?.nationName).toBe('Arcadia');
    });

    act(() => {
      result.current.dismissActiveAftermath();
    });

    expect(result.current.activeAftermath).toBeNull();
  });
});
