/**
 * Type definitions for the AI Advisor System
 *
 * This module defines all TypeScript interfaces and types used throughout
 * the advisor system, including advisor personalities, voice configurations,
 * dialogue templates, and event triggers.
 */

/**
 * Advisor roles matching the game's strategic domains
 */
export type AdvisorRole = 'military' | 'science' | 'diplomatic' | 'intel' | 'economic' | 'pr';

/**
 * Priority levels for advisor commentary
 * Determines interruption behavior and queue priority
 */
export type CommentPriority = 'critical' | 'urgent' | 'important' | 'routine';

/**
 * Voice configuration for ElevenLabs TTS
 */
export interface VoiceConfig {
  voiceId: string;           // ElevenLabs voice ID
  model: string;             // Model version (e.g., 'eleven_turbo_v2_5')
  stability: number;         // 0-1, voice consistency
  similarityBoost: number;   // 0-1, voice similarity to original
  style: number;             // 0-1, expressiveness level
}

/**
 * Personality traits that influence advisor behavior
 */
export interface AdvisorPersonality {
  // Decision-making tendencies (0-100)
  hawkish: number;           // Prefers military solutions
  cautious: number;          // Risk-averse
  idealistic: number;        // Values principles over pragmatism
  secretive: number;         // Operates covertly
  pragmatic: number;         // Bottom-line focused
  imageConscious: number;    // Cares about optics
}

/**
 * Complete advisor configuration
 */
export interface AdvisorConfig {
  role: AdvisorRole;
  name: string;
  title: string;
  description: string;
  voiceConfig: VoiceConfig;
  personality: AdvisorPersonality;
  avatar?: string;           // Optional avatar image path
}

/**
 * Dynamic advisor state tracked during gameplay
 */
export interface AdvisorState {
  role: AdvisorRole;
  trustLevel: number;        // 0-100, player's trust in this advisor
  correctPredictions: number;
  wrongPredictions: number;
  timesIgnored: number;
  timesFollowed: number;
  lastSpoke: number;         // Timestamp of last comment
  isActive: boolean;         // Currently speaking
}

/**
 * Game event types that can trigger advisor comments
 */
export type GameEventType =
  | 'defcon_change'
  | 'research_complete'
  | 'treaty_signed'
  | 'treaty_broken'
  | 'intel_success'
  | 'intel_failure'
  | 'resource_low'
  | 'resource_critical'
  | 'morale_drop'
  | 'morale_surge'
  | 'nuclear_launch'
  | 'enemy_buildup'
  | 'flashpoint_triggered'
  | 'flashpoint_resolved'
  | 'pandemic_stage'
  | 'economic_crisis'
  | 'diplomatic_incident'
  | 'spy_discovered'
  | 'turn_start'
  | 'turn_end';

/**
 * Game event data passed to trigger system
 */
export interface GameEvent {
  type: GameEventType;
  data: Record<string, any>;
  timestamp: number;
  turn: number;
}

/**
 * Dialogue template for generating advisor comments
 */
export interface DialogueTemplate {
  eventType: GameEventType;
  advisorRole: AdvisorRole;
  priority: CommentPriority;
  conditions?: (event: GameEvent, gameState: any) => boolean; // Optional condition check
  templates: string[];       // Array of template strings with ${variable} placeholders
  weight?: number;           // Optional weight for random selection (default: 1)
}

/**
 * Queued advisor comment ready for audio generation
 */
export interface AdvisorComment {
  id: string;
  advisorRole: AdvisorRole;
  text: string;
  priority: CommentPriority;
  timestamp: number;
  event?: GameEvent;
}

/**
 * Audio buffer with metadata for playback
 */
export interface AdvisorAudio {
  commentId: string;
  advisorRole: AdvisorRole;
  audioBuffer: ArrayBuffer;
  duration: number;          // Duration in milliseconds
  priority: CommentPriority;
}

/**
 * Advisor system state
 */
export interface AdvisorSystemState {
  advisors: Record<AdvisorRole, AdvisorState>;
  commentQueue: AdvisorComment[];
  audioQueue: AdvisorAudio[];
  currentlyPlaying: AdvisorAudio | null;
  enabled: boolean;
  volume: number;            // 0-1
  voiceEnabled: boolean;     // Toggle TTS on/off
}

/**
 * Trigger condition for advisor commentary
 */
export interface TriggerCondition {
  eventType: GameEventType;
  advisorRoles: AdvisorRole[];  // Which advisors react to this event
  priority: CommentPriority;
  checkCondition?: (event: GameEvent, gameState: any) => boolean;
}
