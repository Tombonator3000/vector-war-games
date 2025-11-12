import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createCasualtyAlertTracker,
  evaluateCasualtyMilestones,
  type CasualtySummaryPayload,
} from '@/lib/pandemic/casualtyAlertEvaluator';

const buildSummaryMock = vi.fn((payload: CasualtySummaryPayload) => payload);
const openModalMock = vi.fn();
const addNewsItemMock = vi.fn();

const defaultHandlers = {
  openModal: openModalMock,
  addNewsItem: addNewsItemMock,
  buildSummary: buildSummaryMock,
};

describe('evaluateCasualtyMilestones', () => {
  beforeEach(() => {
    openModalMock.mockClear();
    addNewsItemMock.mockClear();
    buildSummaryMock.mockClear();
  });

  it('triggers a global casualty alert when thresholds are crossed', () => {
    const tracker = createCasualtyAlertTracker();

    const result = evaluateCasualtyMilestones({
      tracker,
      pandemicCasualtyTally: 600_000,
      plagueKillTotal: 0,
      casualtyTotalsThisTurn: { alpha: 600_000 },
      nations: [{ id: 'alpha', name: 'Alpha' }],
      turn: 5,
      handlers: defaultHandlers,
    });

    expect(result).toBe(true);
    expect(openModalMock).toHaveBeenCalledTimes(1);
    expect(buildSummaryMock).toHaveBeenCalledTimes(1);
    const summaryPayload = buildSummaryMock.mock.calls[0][0];
    expect(openModalMock).toHaveBeenCalledWith('GLOBAL CASUALTY ALERT', summaryPayload);
    expect(addNewsItemMock).toHaveBeenCalledWith(
      'crisis',
      expect.stringContaining('500,000'),
      'critical',
    );
  });

  it('does not re-trigger the same global threshold twice', () => {
    const tracker = createCasualtyAlertTracker();

    evaluateCasualtyMilestones({
      tracker,
      pandemicCasualtyTally: 600_000,
      plagueKillTotal: 0,
      casualtyTotalsThisTurn: { alpha: 600_000 },
      nations: [{ id: 'alpha', name: 'Alpha' }],
      turn: 5,
      handlers: defaultHandlers,
    });

    openModalMock.mockClear();
    addNewsItemMock.mockClear();
    buildSummaryMock.mockClear();

    const result = evaluateCasualtyMilestones({
      tracker,
      pandemicCasualtyTally: 650_000,
      plagueKillTotal: 0,
      casualtyTotalsThisTurn: { alpha: 50_000 },
      nations: [{ id: 'alpha', name: 'Alpha' }],
      turn: 6,
      handlers: defaultHandlers,
    });

    expect(result).toBe(false);
    expect(openModalMock).not.toHaveBeenCalled();
    expect(addNewsItemMock).not.toHaveBeenCalled();
  });

  it('surfaces catastrophic single-nation spikes', () => {
    const tracker = createCasualtyAlertTracker();

    const result = evaluateCasualtyMilestones({
      tracker,
      pandemicCasualtyTally: 100_000,
      plagueKillTotal: 0,
      casualtyTotalsThisTurn: { bravo: 300_000 },
      nations: [{ id: 'bravo', name: 'Bravo' }],
      turn: 3,
      handlers: defaultHandlers,
    });

    expect(result).toBe(true);
    expect(buildSummaryMock).toHaveBeenCalledTimes(1);
    const summaryPayload = buildSummaryMock.mock.calls[0][0];
    expect(summaryPayload).toEqual(
      expect.objectContaining({
        focusNation: expect.objectContaining({ nationId: 'bravo' }),
      }),
    );
    expect(openModalMock).toHaveBeenCalledWith('CATASTROPHIC CASUALTIES REPORTED', summaryPayload);
    expect(addNewsItemMock).toHaveBeenCalledWith(
      'crisis',
      expect.stringContaining('300,000'),
      'urgent',
    );
  });
});
