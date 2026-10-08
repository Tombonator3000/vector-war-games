/**
 * Advisor System Hook
 *
 * Main React hook for the AI advisor system.
 * Integrates voice generation, queue management, and event triggers.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type {
  AdvisorSystemState,
  AdvisorState,
  AdvisorRole,
  GameEvent,
} from '@/types/advisor.types';
import {
  ADVISOR_CONFIGS,
  INITIAL_ADVISOR_STATE,
  TRUST_MODIFIERS,
} from '@/data/advisors.data';
import { advisorVoiceSystem } from '@/lib/advisorVoice';
import { advisorQueue } from '@/lib/advisorQueue';
import { advisorTriggerSystem } from '@/lib/advisorTriggers';
import { checkTTSAvailability, getTTSConfig } from '@/config/tts.config';

/**
 * Initialize advisor states
 */
function initializeAdvisors(): Record<AdvisorRole, AdvisorState> {
  const advisors: Record<string, AdvisorState> = {};

  for (const role of Object.keys(ADVISOR_CONFIGS)) {
    advisors[role] = {
      role: role as AdvisorRole,
      ...INITIAL_ADVISOR_STATE,
    };
  }

  return advisors as Record<AdvisorRole, AdvisorState>;
}

/**
 * useAdvisorSystem Hook
 *
 * Provides advisor commentary, voice playback, and trust management.
 */
export function useAdvisorSystem() {
  const [systemState, setSystemState] = useState<AdvisorSystemState>({
    advisors: initializeAdvisors(),
    commentQueue: [],
    audioQueue: [],
    currentlyPlaying: null,
    enabled: true,
    volume: 0.7,
    voiceEnabled: true,
  });

  const [ttsStatus, setTtsStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');
  const [ttsProvider, setTtsProvider] = useState<string>('unknown');

  const lifecycleRef = useRef<symbol | null>(null);
  const processingRef = useRef<symbol | null>(null);
  const playbackRef = useRef<symbol | null>(null);
  const playbackInProgressRef = useRef<symbol | null>(null);
  const ttsRequestRef = useRef(0);
  const playbackIntervalRef = useRef<number | null>(null);

  /**
   * Check TTS availability on mount and periodically
   */
  const checkTTS = useCallback(async () => {
    const lifecycle = lifecycleRef.current;
    if (!lifecycle) return false;
    const request = ++ttsRequestRef.current;

    try {
      const config = getTTSConfig();
      setTtsProvider(config.provider);
      const available = await checkTTSAvailability();
      if (lifecycleRef.current !== lifecycle || ttsRequestRef.current !== request) return available;
      setTtsStatus(available ? 'available' : 'unavailable');
      if (available) advisorVoiceSystem.resetTTSAvailability();
      console.log(`[AdvisorSystem] TTS status: ${available ? 'available' : 'unavailable'}, provider: ${config.provider}`);
      return available;
    } catch (error) {
      if (lifecycleRef.current === lifecycle && ttsRequestRef.current === request) {
        setTtsStatus('unavailable');
        console.error('[AdvisorSystem] TTS availability check failed:', error);
      }
      return false;
    }
  }, []);

  /**
   * Retry TTS connection
   */
  const retryTTS = useCallback(async () => {
    if (!lifecycleRef.current) return false;
    ttsRequestRef.current++;
    setTtsStatus('checking');
    try {
      advisorVoiceSystem.resetTTSAvailability();
    } catch (error) {
      setTtsStatus('unavailable');
      console.error('[AdvisorSystem] TTS retry failed:', error);
      return false;
    }
    return checkTTS();
  }, [checkTTS]);

  /**
   * Process game event and generate advisor comments
   */
  const processGameEvent = useCallback(
    (event: GameEvent, gameState?: any) => {
      if (!lifecycleRef.current || !systemState.enabled) return;

      console.log('[AdvisorSystem] Processing event:', event.type);

      // Generate comments for this event
      const comments = advisorTriggerSystem.processEvent(event, gameState || {});

      // Filter by advisor trust and personality
      const validComments = comments.filter((comment) => {
        const advisor = systemState.advisors[comment.advisorRole];
        return advisorTriggerSystem.shouldAdvisorReact(
          comment.advisorRole,
          event,
          advisor.trustLevel
        );
      });

      // Add to queue
      validComments.forEach((comment) => {
        advisorQueue.enqueueComment(comment);
      });

      // Update state
      setSystemState((prev) => ({
        ...prev,
        commentQueue: [...prev.commentQueue, ...validComments],
      }));

      // Start processing if not already running (fire-and-forget with error handling)
      processQueue().catch((error) => {
        console.error('[AdvisorSystem] Error processing queue:', error);
      });
    },
    [systemState.enabled, systemState.advisors]
  );

  /**
   * Process comment queue and generate audio
   */
  const processQueue = useCallback(async () => {
    const lifecycle = lifecycleRef.current;
    if (!lifecycle || processingRef.current === lifecycle) return;
    processingRef.current = lifecycle;

    try {
      while (lifecycleRef.current === lifecycle) {
        const comment = advisorQueue.dequeueComment();
        if (!comment) break;

        try {
          // Check if should interrupt current playback
          if (advisorQueue.shouldInterrupt(comment.priority)) {
            advisorVoiceSystem.stop();
            setSystemState((prev) => ({ ...prev, currentlyPlaying: null }));
          }

          // Generate audio
          const voiceConfig = ADVISOR_CONFIGS[comment.advisorRole].voiceConfig;
          const audio = await advisorVoiceSystem.generateSpeech(comment, voiceConfig);
          if (lifecycleRef.current !== lifecycle) break;

          // Add to audio queue
          advisorQueue.enqueueAudio(audio);

          // Update state
          setSystemState((prev) => ({
            ...prev,
            audioQueue: [...prev.audioQueue, audio],
          }));
        } catch (commentError) {
          console.error('[AdvisorSystem] Error processing comment:', commentError);
          // Continue to next comment even if one fails
        }
      }
    } finally {
      if (processingRef.current === lifecycle) processingRef.current = null;
    }
  }, []);

  /**
   * Start audio playback loop
   */
  const startPlaybackLoop = useCallback(() => {
    const lifecycle = lifecycleRef.current;
    if (!lifecycle || playbackIntervalRef.current !== null) return;
    const playback = Symbol('advisor playback');
    playbackRef.current = playback;

    const playNext = async () => {
      if (lifecycleRef.current !== lifecycle || playbackRef.current !== playback) return;
      if (playbackInProgressRef.current === playback) return;
      if (!systemState.voiceEnabled) return;
      if (advisorVoiceSystem.getIsPlaying()) return;

      const nextAudio = advisorQueue.dequeueAudio();
      if (!nextAudio) return;
      playbackInProgressRef.current = playback;

      // Update currently playing
      advisorQueue.setCurrentlyPlaying(nextAudio);
      setSystemState((prev) => ({
        ...prev,
        currentlyPlaying: nextAudio,
      }));

      // Update advisor state
      setSystemState((prev) => ({
        ...prev,
        advisors: {
          ...prev.advisors,
          [nextAudio.advisorRole]: {
            ...prev.advisors[nextAudio.advisorRole],
            isActive: true,
            lastSpoke: Date.now(),
          },
        },
      }));

      // Play audio
      try {
        await advisorVoiceSystem.playAudio(nextAudio);
      } catch (error) {
        console.error('[AdvisorSystem] Error playing audio:', error);
      } finally {
        if (playbackInProgressRef.current === playback) playbackInProgressRef.current = null;
      }
      if (lifecycleRef.current !== lifecycle || playbackRef.current !== playback) return;

      // Mark inactive after playback
      setSystemState((prev) => ({
        ...prev,
        currentlyPlaying: null,
        advisors: {
          ...prev.advisors,
          [nextAudio.advisorRole]: {
            ...prev.advisors[nextAudio.advisorRole],
            isActive: false,
          },
        },
      }));

      advisorQueue.setCurrentlyPlaying(null);
    };

    playbackIntervalRef.current = window.setInterval(() => {
      void playNext().catch((error) => {
        console.error('[AdvisorSystem] Playback loop failed:', error);
      });
    }, 500);
  }, [systemState.voiceEnabled]);

  /**
   * Stop playback loop
   */
  const stopPlaybackLoop = useCallback(() => {
    playbackRef.current = null;
    if (playbackIntervalRef.current !== null) {
      clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }
    advisorVoiceSystem.stop();
    advisorQueue.setCurrentlyPlaying(null);
    if (lifecycleRef.current) {
      setSystemState((prev) => {
        const role = prev.currentlyPlaying?.advisorRole;
        if (!role) return prev;
        return {
          ...prev,
          currentlyPlaying: null,
          advisors: { ...prev.advisors, [role]: { ...prev.advisors[role], isActive: false } },
        };
      });
    }
  }, []);

  /**
   * Update advisor trust based on player action
   */
  const updateTrust = useCallback(
    (role: AdvisorRole, modifier: keyof typeof TRUST_MODIFIERS) => {
      setSystemState((prev) => {
        const advisor = prev.advisors[role];
        const change = TRUST_MODIFIERS[modifier];
        const newTrust = Math.max(0, Math.min(100, advisor.trustLevel + change));

        return {
          ...prev,
          advisors: {
            ...prev.advisors,
            [role]: {
              ...advisor,
              trustLevel: newTrust,
            },
          },
        };
      });
    },
    []
  );

  /**
   * Record advisor prediction result
   */
  const recordPrediction = useCallback((role: AdvisorRole, correct: boolean) => {
    setSystemState((prev) => {
      const advisor = prev.advisors[role];
      return {
        ...prev,
        advisors: {
          ...prev.advisors,
          [role]: {
            ...advisor,
            correctPredictions: correct
              ? advisor.correctPredictions + 1
              : advisor.correctPredictions,
            wrongPredictions: !correct
              ? advisor.wrongPredictions + 1
              : advisor.wrongPredictions,
          },
        },
      };
    });

    updateTrust(role, correct ? 'PREDICTION_CORRECT' : 'PREDICTION_WRONG');
  }, [updateTrust]);

  /**
   * Record player following/ignoring advisor
   */
  const recordPlayerChoice = useCallback(
    (role: AdvisorRole, followed: boolean, success?: boolean) => {
      setSystemState((prev) => {
        const advisor = prev.advisors[role];
        return {
          ...prev,
          advisors: {
            ...prev.advisors,
            [role]: {
              ...advisor,
              timesFollowed: followed
                ? advisor.timesFollowed + 1
                : advisor.timesFollowed,
              timesIgnored: !followed ? advisor.timesIgnored + 1 : advisor.timesIgnored,
            },
          },
        };
      });

      // Update trust based on outcome
      if (followed && success !== undefined) {
        updateTrust(
          role,
          success ? 'ADVICE_FOLLOWED_SUCCESS' : 'ADVICE_FOLLOWED_FAILURE'
        );
      }
    },
    [updateTrust]
  );

  /**
   * Toggle advisor system
   */
  const toggleEnabled = useCallback(() => {
    setSystemState((prev) => ({ ...prev, enabled: !prev.enabled }));
  }, []);

  /**
   * Toggle voice playback
   */
  const toggleVoice = useCallback(() => {
    setSystemState((prev) => ({ ...prev, voiceEnabled: !prev.voiceEnabled }));
  }, []);

  /**
   * Set volume
   */
  const setVolume = useCallback((volume: number) => {
    advisorVoiceSystem.setVolume(volume);
    setSystemState((prev) => ({ ...prev, volume }));
  }, []);

  /**
   * Clear all queues
   */
  const clearQueues = useCallback(() => {
    advisorQueue.clear();
    advisorVoiceSystem.stop();
    setSystemState((prev) => ({
      ...prev,
      commentQueue: [],
      audioQueue: [],
      currentlyPlaying: null,
    }));
  }, []);

  /**
   * Get advisor by role
   */
  const getAdvisor = useCallback(
    (role: AdvisorRole) => {
      return {
        config: ADVISOR_CONFIGS[role],
        state: systemState.advisors[role],
      };
    },
    [systemState.advisors]
  );

  // Invalidate every pending continuation, including Strict Mode's first mount.
  useEffect(() => {
    const lifecycle = Symbol('advisor lifecycle');
    lifecycleRef.current = lifecycle;
    return () => {
      if (lifecycleRef.current === lifecycle) lifecycleRef.current = null;
      ttsRequestRef.current++;
      advisorQueue.clear();
    };
  }, []);

  // Start playback loop on mount
  useEffect(() => {
    startPlaybackLoop();
    return () => stopPlaybackLoop();
  }, [startPlaybackLoop, stopPlaybackLoop]);

  // Check TTS availability on mount
  useEffect(() => {
    void checkTTS();
  }, [checkTTS]);

  return {
    // State
    advisors: systemState.advisors,
    currentlyPlaying: systemState.currentlyPlaying,
    enabled: systemState.enabled,
    voiceEnabled: systemState.voiceEnabled,
    volume: systemState.volume,

    // Methods
    processGameEvent,
    updateTrust,
    recordPrediction,
    recordPlayerChoice,
    toggleEnabled,
    toggleVoice,
    setVolume,
    clearQueues,
    getAdvisor,

    // Queue info
    queueSize: systemState.commentQueue.length,
    audioQueueSize: systemState.audioQueue.length,

    // TTS status
    ttsStatus,
    ttsProvider,
    retryTTS,
  };
}

