/**
 * Advisor System Hook
 *
 * Main React hook for the AI advisor system.
 * Integrates voice generation, queue management, and event triggers.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  AdvisorSystemState,
  AdvisorState,
  AdvisorRole,
  GameEvent,
  AdvisorComment,
} from '@/types/advisor.types';
import {
  ADVISOR_CONFIGS,
  INITIAL_ADVISOR_STATE,
  TRUST_MODIFIERS,
} from '@/data/advisors.data';
import { advisorVoiceSystem } from '@/lib/advisorVoice';
import { advisorQueue } from '@/lib/advisorQueue';
import { advisorTriggerSystem } from '@/lib/advisorTriggers';

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

  const processingRef = useRef(false);
  const playbackIntervalRef = useRef<number | null>(null);

  /**
   * Process game event and generate advisor comments
   */
  const processGameEvent = useCallback(
    (event: GameEvent, gameState?: any) => {
      if (!systemState.enabled) return;

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
    if (processingRef.current) return;
    processingRef.current = true;

    try {
      while (true) {
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
      processingRef.current = false;
    }
  }, []);

  /**
   * Start audio playback loop
   */
  const startPlaybackLoop = useCallback(() => {
    if (playbackIntervalRef.current) return;

    const playNext = async () => {
      if (!systemState.voiceEnabled) return;
      if (advisorVoiceSystem.getIsPlaying()) return;

      const nextAudio = advisorQueue.dequeueAudio();
      if (!nextAudio) return;

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
      await advisorVoiceSystem.playAudio(nextAudio);

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

    playbackIntervalRef.current = window.setInterval(playNext, 500);
  }, [systemState.voiceEnabled]);

  /**
   * Stop playback loop
   */
  const stopPlaybackLoop = useCallback(() => {
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }
    advisorVoiceSystem.stop();
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

  // Start playback loop on mount
  useEffect(() => {
    startPlaybackLoop();
    return () => stopPlaybackLoop();
  }, [startPlaybackLoop, stopPlaybackLoop]);

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
  };
}
