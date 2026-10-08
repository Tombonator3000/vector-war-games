import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GreatOldOnesState } from '@/types/greatOldOnes';
import type { Week3ExtendedState } from '@/lib/greatOldOnesWeek3Integration';
import type { Phase2State } from '@/lib/phase2Integration';
import type { Phase3State } from '@/types/phase3Types';
import { advanceGreatOldOnesCampaign, type CampaignSubsystems, type CampaignTurnOperations } from '../greatOldOnesCampaignTurn';

const state = {} as GreatOldOnesState;
const operations: CampaignTurnOperations = {
  updateWeek3: vi.fn((_state, current) => current),
  canUnlockPhase2: vi.fn(() => ({ shouldUnlock: false })),
  updatePhase2: vi.fn((_state, current) => current),
  canUnlockPhase3: vi.fn(() => ({ shouldUnlock: false })),
  updatePhase3: vi.fn((_state, _phase2, current) => current),
  onUnlock: vi.fn(),
};
const subsystems = (unlocked = false): CampaignSubsystems => ({
  week3: {} as Week3ExtendedState,
  phase2: { unlocked } as Phase2State,
  phase3: { unlocked } as Phase3State,
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(operations.canUnlockPhase2).mockReturnValue({ shouldUnlock: false });
  vi.mocked(operations.canUnlockPhase3).mockReturnValue({ shouldUnlock: false });
  vi.mocked(operations.updatePhase2).mockImplementation((_state, current) => current);
});

describe('Great Old Ones campaign turn coordination', () => {
  it('handles absent campaign subsystems without calling their processors', () => {
    const empty = { week3: null, phase2: null, phase3: null };
    expect(advanceGreatOldOnesCampaign(state, empty, operations)).toEqual(empty);
    expect(operations.updateWeek3).not.toHaveBeenCalled();
    expect(operations.updatePhase2).not.toHaveBeenCalled();
    expect(operations.updatePhase3).not.toHaveBeenCalled();
  });

  it('keeps locked phases inactive while continuing Week 3', () => {
    const result = advanceGreatOldOnesCampaign(state, subsystems(), operations);
    expect(operations.updateWeek3).toHaveBeenCalledOnce();
    expect(operations.updatePhase2).not.toHaveBeenCalled();
    expect(operations.updatePhase3).not.toHaveBeenCalled();
    expect(result.phase2?.unlocked).toBe(false);
    expect(operations.onUnlock).not.toHaveBeenCalled();
  });

  it('unlocks and advances each phase once without mutating the previous unlock flags', () => {
    vi.mocked(operations.canUnlockPhase2).mockReturnValue({ shouldUnlock: true });
    vi.mocked(operations.canUnlockPhase3).mockReturnValue({ shouldUnlock: true });
    const previous = subsystems();
    const next = advanceGreatOldOnesCampaign(state, previous, operations);
    expect(next.phase2?.unlocked).toBe(true);
    expect(next.phase3?.unlocked).toBe(true);
    expect(previous.phase2?.unlocked).toBe(false);
    expect(previous.phase3?.unlocked).toBe(false);
    expect(operations.updatePhase2).toHaveBeenCalledOnce();
    expect(operations.updatePhase3).toHaveBeenCalledOnce();
    expect(operations.onUnlock).toHaveBeenNthCalledWith(1, 2);
    expect(operations.onUnlock).toHaveBeenNthCalledWith(2, 3);
    advanceGreatOldOnesCampaign(state, next, operations);
    expect(operations.onUnlock).toHaveBeenCalledTimes(2);
  });

  it('passes the newly updated Phase 2 state into Phase 3 unlocking and processing', () => {
    const updatedPhase2 = { unlocked: true, doctrinePoints: 90 } as Phase2State;
    vi.mocked(operations.updatePhase2).mockReturnValue(updatedPhase2);
    vi.mocked(operations.canUnlockPhase3).mockReturnValue({ shouldUnlock: true });
    const current = subsystems(true);
    current.phase3!.unlocked = false;
    const next = advanceGreatOldOnesCampaign(state, current, operations);
    expect(operations.canUnlockPhase3).toHaveBeenCalledWith(state, updatedPhase2);
    expect(operations.updatePhase3).toHaveBeenCalledWith(state, updatedPhase2, next.phase3);
  });

  it('skips Phase 3 when its prerequisite state is absent', () => {
    advanceGreatOldOnesCampaign(state, { ...subsystems(true), phase2: null }, operations);
    expect(operations.canUnlockPhase3).not.toHaveBeenCalled();
    expect(operations.updatePhase3).not.toHaveBeenCalled();
  });
});
