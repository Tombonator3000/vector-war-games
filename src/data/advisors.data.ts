/**
 * Advisor Configuration Data
 *
 * Defines the personalities, voice configurations, and characteristics
 * of the six advisors in the NORAD VECTOR command system.
 *
 * Based on specifications from agents.md
 */

import { AdvisorConfig } from '@/types/advisor.types';

/**
 * Complete advisor configurations
 * Each advisor has a distinct personality, voice, and area of expertise
 */
export const ADVISOR_CONFIGS: Record<string, AdvisorConfig> = {
  military: {
    role: 'military',
    name: 'General Marcus "Iron" Stone',
    title: 'Military Advisor',
    description: 'Hawkish, direct, action-oriented. Favors military solutions and values strength.',
    voiceConfig: {
      voiceId: 'CwhRBWXzGAHq8TQ4Fs17', // Roger - Deep, authoritative
      model: 'eleven_turbo_v2_5',
      stability: 0.7,
      similarityBoost: 0.8,
      style: 0.6, // More expressive
    },
    personality: {
      hawkish: 95,
      cautious: 20,
      idealistic: 15,
      secretive: 40,
      pragmatic: 75,
      imageConscious: 30,
    },
  },

  science: {
    role: 'science',
    name: 'Dr. Eleanor Vance',
    title: 'Science Advisor',
    description: 'Rational, cautious, long-term thinker. Emphasizes consequences and fears escalation.',
    voiceConfig: {
      voiceId: 'EXAVITQu4vr4xnSDxMaL', // Sarah - Calm, analytical
      model: 'eleven_turbo_v2_5',
      stability: 0.9,
      similarityBoost: 0.7,
      style: 0.3, // More neutral
    },
    personality: {
      hawkish: 10,
      cautious: 95,
      idealistic: 70,
      secretive: 20,
      pragmatic: 80,
      imageConscious: 25,
    },
  },

  diplomatic: {
    role: 'diplomatic',
    name: 'Ambassador Katherine Wei',
    title: 'Diplomatic Advisor',
    description: 'Patient, persuasive, idealistic. Prefers negotiation and values reputation.',
    voiceConfig: {
      voiceId: 'XB0fDUnXU5powFXDhCwa', // Charlotte - Diplomatic, measured
      model: 'eleven_turbo_v2_5',
      stability: 0.8,
      similarityBoost: 0.8,
      style: 0.5,
    },
    personality: {
      hawkish: 15,
      cautious: 60,
      idealistic: 85,
      secretive: 25,
      pragmatic: 65,
      imageConscious: 80,
    },
  },

  intel: {
    role: 'intel',
    name: 'Director James "Shadow" Garrett',
    title: 'Intelligence Director',
    description: 'Paranoid, secretive, pragmatic. Sees threats everywhere and distrusts everyone.',
    voiceConfig: {
      voiceId: 'onwK4e9ZLuTAKqWW03F9', // Daniel - Measured, cryptic
      model: 'eleven_turbo_v2_5',
      stability: 0.8,
      similarityBoost: 0.6,
      style: 0.4,
    },
    personality: {
      hawkish: 70,
      cautious: 85,
      idealistic: 20,
      secretive: 98,
      pragmatic: 90,
      imageConscious: 15,
    },
  },

  economic: {
    role: 'economic',
    name: 'Secretary Hayes',
    title: 'Economic Advisor',
    description: 'Pragmatic, numbers-focused. Opposes expensive wars and values economic warfare.',
    voiceConfig: {
      voiceId: 'pqHfZKP75CvOlQylNhV4', // Bill - Practical, numbers-focused
      model: 'eleven_turbo_v2_5',
      stability: 0.85,
      similarityBoost: 0.7,
      style: 0.35,
    },
    personality: {
      hawkish: 30,
      cautious: 75,
      idealistic: 25,
      secretive: 35,
      pragmatic: 98,
      imageConscious: 40,
    },
  },

  pr: {
    role: 'pr',
    name: 'Press Secretary Morgan',
    title: 'Public Relations',
    description: 'Image-conscious, politically aware. Obsessed with optics and public opinion.',
    voiceConfig: {
      voiceId: 'cgSgspJ2msm6clMCkdW9', // Jessica - Urgent, media-savvy
      model: 'eleven_turbo_v2_5',
      stability: 0.75,
      similarityBoost: 0.8,
      style: 0.7, // Very expressive
    },
    personality: {
      hawkish: 20,
      cautious: 60,
      idealistic: 40,
      secretive: 45,
      pragmatic: 70,
      imageConscious: 98,
    },
  },
};

/**
 * Initial advisor state for new game sessions
 */
export const INITIAL_ADVISOR_STATE = {
  trustLevel: 50,
  correctPredictions: 0,
  wrongPredictions: 0,
  timesIgnored: 0,
  timesFollowed: 0,
  lastSpoke: 0,
  isActive: false,
};

/**
 * Trust level modifiers based on player actions
 */
export const TRUST_MODIFIERS = {
  ADVICE_FOLLOWED_SUCCESS: 5,
  ADVICE_FOLLOWED_FAILURE: -10,
  ADVICE_IGNORED_WOULD_SUCCEED: -3,
  ADVICE_IGNORED_WOULD_FAIL: 2,
  PREDICTION_CORRECT: 3,
  PREDICTION_WRONG: -5,
};

/**
 * Priority thresholds for interruption behavior
 * Higher priority comments can interrupt lower priority ones
 */
export const PRIORITY_LEVELS = {
  critical: 4,    // Interrupts everything
  urgent: 3,      // Waits for current line
  important: 2,   // Queues (max 3)
  routine: 1,     // Only plays during idle
};

/**
 * Advisor role priority order for conflict resolution
 * When multiple advisors want to speak simultaneously
 */
export const ADVISOR_PRIORITY_ORDER: string[] = [
  'military',
  'intel',
  'diplomatic',
  'science',
  'economic',
  'pr',
];
