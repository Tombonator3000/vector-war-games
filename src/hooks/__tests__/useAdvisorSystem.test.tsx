import { StrictMode, type PropsWithChildren } from 'react';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAdvisorSystem } from '../useAdvisorSystem';
import type { AdvisorAudio, AdvisorComment, GameEvent } from '@/types/advisor.types';

const mocks = vi.hoisted(() => ({
  checkTTS: vi.fn(),
  voice: {
    resetTTSAvailability: vi.fn(), stop: vi.fn(), getIsPlaying: vi.fn(),
    generateSpeech: vi.fn(), playAudio: vi.fn(), setVolume: vi.fn(),
  },
  queue: {
    enqueueComment: vi.fn(), dequeueComment: vi.fn(), shouldInterrupt: vi.fn(),
    enqueueAudio: vi.fn(), dequeueAudio: vi.fn(), setCurrentlyPlaying: vi.fn(), clear: vi.fn(),
  },
  triggers: { processEvent: vi.fn(), shouldAdvisorReact: vi.fn() },
}));

vi.mock('@/config/tts.config', () => ({
  getTTSConfig: () => ({ provider: 'edge-tts', endpoint: '/test', useFallback: true }),
  checkTTSAvailability: mocks.checkTTS,
}));
vi.mock('@/lib/advisorVoice', () => ({ advisorVoiceSystem: mocks.voice }));
vi.mock('@/lib/advisorQueue', () => ({ advisorQueue: mocks.queue }));
vi.mock('@/lib/advisorTriggers', () => ({ advisorTriggerSystem: mocks.triggers }));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

const comment: AdvisorComment = {
  id: 'test-comment', advisorRole: 'military', text: 'Stand by.',
  priority: 'important', timestamp: 1,
};
const audio: AdvisorAudio = {
  commentId: comment.id, advisorRole: comment.advisorRole, audioBuffer: new ArrayBuffer(0),
  duration: 1000, priority: comment.priority, text: comment.text,
};
const event: GameEvent = { type: 'turn_start', data: {}, timestamp: 1 };
const StrictWrapper = ({ children }: PropsWithChildren) => <StrictMode>{children}</StrictMode>;

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  mocks.checkTTS.mockResolvedValue(true);
  mocks.voice.getIsPlaying.mockReturnValue(false);
  mocks.voice.playAudio.mockResolvedValue(undefined);
  mocks.queue.dequeueComment.mockReturnValue(null);
  mocks.queue.dequeueAudio.mockReturnValue(null);
  mocks.queue.shouldInterrupt.mockReturnValue(false);
  mocks.triggers.processEvent.mockReturnValue([]);
  mocks.triggers.shouldAdvisorReact.mockReturnValue(true);
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('useAdvisorSystem asynchronous lifecycle', () => {
  it('discards a pending TTS readiness result after unmount', async () => {
    const availability = deferred<boolean>();
    mocks.checkTTS.mockReturnValue(availability.promise);
    const { unmount } = renderHook(() => useAdvisorSystem());

    unmount();
    await act(async () => { availability.resolve(true); await availability.promise; });

    expect(mocks.voice.resetTTSAvailability).not.toHaveBeenCalled();
    expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('TTS status: available'));
    expect(vi.getTimerCount()).toBe(0);
  });

  it('consumes a pending readiness rejection after unmount', async () => {
    const availability = deferred<boolean>();
    mocks.checkTTS.mockReturnValue(availability.promise);
    const { unmount } = renderHook(() => useAdvisorSystem());

    unmount();
    await act(async () => { availability.reject(new Error('offline')); await Promise.resolve(); });

    expect(mocks.voice.resetTTSAvailability).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it('does not let the first Strict Mode mount overwrite the active readiness check', async () => {
    const first = deferred<boolean>();
    const current = deferred<boolean>();
    mocks.checkTTS.mockReturnValueOnce(first.promise).mockReturnValueOnce(current.promise);
    const { result } = renderHook(() => useAdvisorSystem(), { wrapper: StrictWrapper });
    expect(mocks.checkTTS).toHaveBeenCalledTimes(2);

    await act(async () => { current.resolve(false); await current.promise; });
    expect(result.current.ttsStatus).toBe('unavailable');
    await act(async () => { first.resolve(true); await first.promise; });

    expect(result.current.ttsStatus).toBe('unavailable');
    expect(mocks.voice.resetTTSAvailability).not.toHaveBeenCalled();
  });

  it('keeps the latest retry result when an older readiness request resolves later', async () => {
    const first = deferred<boolean>();
    const retry = deferred<boolean>();
    mocks.checkTTS.mockReturnValueOnce(first.promise).mockReturnValueOnce(retry.promise);
    const { result } = renderHook(() => useAdvisorSystem());
    let retryResult!: Promise<boolean>;
    act(() => { retryResult = result.current.retryTTS(); });

    await act(async () => { retry.resolve(false); await retryResult; });
    expect(result.current.ttsStatus).toBe('unavailable');
    await act(async () => { first.resolve(true); await first.promise; });

    expect(result.current.ttsStatus).toBe('unavailable');
    expect(mocks.voice.resetTTSAvailability).toHaveBeenCalledTimes(1);
  });

  it('reports an unavailable service when readiness rejects instead of leaking a promise rejection', async () => {
    mocks.checkTTS.mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useAdvisorSystem());
    await act(async () => { await Promise.resolve(); });

    expect(result.current.ttsStatus).toBe('unavailable');
    expect(console.error).toHaveBeenCalledWith(
      '[AdvisorSystem] TTS availability check failed:', expect.any(Error),
    );
  });

  it('returns a failed retry safely when resetting the voice service throws', async () => {
    const pending = deferred<boolean>();
    mocks.checkTTS.mockReturnValue(pending.promise);
    const { result } = renderHook(() => useAdvisorSystem());
    mocks.voice.resetTTSAvailability.mockImplementation(() => { throw new Error('bad config'); });
    let retried!: boolean;
    await act(async () => { retried = await result.current.retryTTS(); });

    expect(retried).toBe(false);
    expect(result.current.ttsStatus).toBe('unavailable');
    await act(async () => { pending.resolve(true); await pending.promise; });
    expect(result.current.ttsStatus).toBe('unavailable');
  });

  it('does not enqueue speech that finishes after its hook unmounts', async () => {
    const generation = deferred<AdvisorAudio>();
    mocks.voice.generateSpeech.mockReturnValue(generation.promise);
    mocks.triggers.processEvent.mockReturnValue([comment]);
    mocks.queue.dequeueComment.mockReturnValueOnce(comment);
    const { result, unmount } = renderHook(() => useAdvisorSystem());
    act(() => { result.current.processGameEvent(event); });
    expect(mocks.voice.generateSpeech).toHaveBeenCalledTimes(1);

    unmount();
    await act(async () => { generation.resolve(audio); await generation.promise; });

    expect(mocks.queue.enqueueAudio).not.toHaveBeenCalled();
  });

  it('does not change the playback queue when old audio completes after unmount', async () => {
    const playback = deferred<void>();
    mocks.voice.playAudio.mockReturnValue(playback.promise);
    mocks.queue.dequeueAudio.mockReturnValueOnce(audio);
    const { unmount } = renderHook(() => useAdvisorSystem());
    act(() => { vi.advanceTimersByTime(500); });
    expect(mocks.voice.playAudio).toHaveBeenCalledTimes(1);

    unmount();
    const updatesAfterCleanup = mocks.queue.setCurrentlyPlaying.mock.calls.length;
    await act(async () => { playback.resolve(); await playback.promise; });

    expect(mocks.queue.setCurrentlyPlaying).toHaveBeenCalledTimes(updatesAfterCleanup);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('catches rejected audio playback and releases the active advisor', async () => {
    mocks.voice.playAudio.mockRejectedValue(new Error('audio device gone'));
    mocks.queue.dequeueAudio.mockReturnValueOnce(audio);
    const { result } = renderHook(() => useAdvisorSystem());
    await act(async () => { vi.advanceTimersByTime(500); await Promise.resolve(); });

    expect(result.current.currentlyPlaying).toBeNull();
    expect(result.current.advisors.military.isActive).toBe(false);
    expect(console.error).toHaveBeenCalledWith(
      '[AdvisorSystem] Error playing audio:', expect.any(Error),
    );
  });

  it('releases an active advisor immediately when voice playback is disabled', async () => {
    const playback = deferred<void>();
    mocks.voice.playAudio.mockReturnValue(playback.promise);
    mocks.queue.dequeueAudio.mockReturnValueOnce(audio);
    const { result } = renderHook(() => useAdvisorSystem());
    act(() => { vi.advanceTimersByTime(500); });
    expect(result.current.currentlyPlaying).toBe(audio);

    act(() => { result.current.toggleVoice(); });
    expect(result.current.currentlyPlaying).toBeNull();
    expect(result.current.advisors.military.isActive).toBe(false);
    await act(async () => { playback.resolve(); await playback.promise; });
  });
});

