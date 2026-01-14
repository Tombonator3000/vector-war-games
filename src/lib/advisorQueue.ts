/**
 * Advisor Queue System
 *
 * Manages the queue of advisor comments, handles priority-based playback,
 * and resolves conflicts when multiple advisors want to speak.
 */

import {
  AdvisorComment,
  AdvisorAudio,
  CommentPriority,
  AdvisorRole,
} from '@/types/advisor.types';
import {
  PRIORITY_LEVELS,
  ADVISOR_PRIORITY_ORDER,
} from '@/data/advisors.data';

/**
 * Queue configuration
 */
const MAX_QUEUE_SIZE = {
  critical: 10,    // Always queue critical
  urgent: 5,       // Up to 5 urgent
  important: 3,    // Max 3 important
  routine: 1,      // Only 1 routine
};

/**
 * AdvisorQueue manages comment and audio queues with priority handling
 */
export class AdvisorQueue {
  private commentQueue: AdvisorComment[] = [];
  private audioQueue: AdvisorAudio[] = [];
  private currentlyPlaying: AdvisorAudio | null = null;

  /**
   * Add comment to queue with priority handling
   */
  enqueueComment(comment: AdvisorComment): boolean {
    const priorityLevel = PRIORITY_LEVELS[comment.priority];

    // Critical always interrupts
    if (comment.priority === 'critical') {
      this.commentQueue.unshift(comment);
      return true;
    }

    // Check queue size for priority level
    const existingAtPriority = this.commentQueue.filter(
      (c) => c.priority === comment.priority
    ).length;

    if (existingAtPriority >= MAX_QUEUE_SIZE[comment.priority]) {
      console.log(
        `[AdvisorQueue] Queue full for ${comment.priority} priority, dropping comment`
      );
      return false;
    }

    // Insert based on priority
    const insertIndex = this.commentQueue.findIndex(
      (c) => PRIORITY_LEVELS[c.priority] < priorityLevel
    );

    if (insertIndex === -1) {
      this.commentQueue.push(comment);
    } else {
      this.commentQueue.splice(insertIndex, 0, comment);
    }

    return true;
  }

  /**
   * Get next comment from queue
   */
  dequeueComment(): AdvisorComment | null {
    return this.commentQueue.shift() || null;
  }

  /**
   * Add audio to playback queue
   */
  enqueueAudio(audio: AdvisorAudio): void {
    const priorityLevel = PRIORITY_LEVELS[audio.priority];

    // Critical always goes to front
    if (audio.priority === 'critical') {
      this.audioQueue.unshift(audio);
      return;
    }

    // Insert based on priority
    const insertIndex = this.audioQueue.findIndex(
      (a) => PRIORITY_LEVELS[a.priority] < priorityLevel
    );

    if (insertIndex === -1) {
      this.audioQueue.push(audio);
    } else {
      this.audioQueue.splice(insertIndex, 0, audio);
    }
  }

  /**
   * Get next audio from queue
   */
  dequeueAudio(): AdvisorAudio | null {
    return this.audioQueue.shift() || null;
  }

  /**
   * Peek at next audio without removing
   */
  peekNextAudio(): AdvisorAudio | null {
    return this.audioQueue[0] || null;
  }

  /**
   * Resolve conflict when multiple advisors want to speak
   *
   * Returns the advisor role that should speak based on priority order
   */
  resolveConflict(advisorRoles: AdvisorRole[]): AdvisorRole | null {
    for (const role of ADVISOR_PRIORITY_ORDER) {
      if (advisorRoles.includes(role as AdvisorRole)) {
        return role as AdvisorRole;
      }
    }
    return advisorRoles[0] || null;
  }

  /**
   * Set currently playing audio
   */
  setCurrentlyPlaying(audio: AdvisorAudio | null): void {
    this.currentlyPlaying = audio;
  }

  /**
   * Get currently playing audio
   */
  getCurrentlyPlaying(): AdvisorAudio | null {
    return this.currentlyPlaying;
  }

  /**
   * Check if advisor is currently speaking
   */
  isAdvisorSpeaking(role: AdvisorRole): boolean {
    return this.currentlyPlaying?.advisorRole === role;
  }

  /**
   * Get queue size for priority level
   */
  getQueueSize(priority?: CommentPriority): number {
    if (priority) {
      return this.commentQueue.filter((c) => c.priority === priority).length;
    }
    return this.commentQueue.length;
  }

  /**
   * Get audio queue size
   */
  getAudioQueueSize(): number {
    return this.audioQueue.length;
  }

  /**
   * Clear all queues
   */
  clear(): void {
    this.commentQueue = [];
    this.audioQueue = [];
    this.currentlyPlaying = null;
  }

  /**
   * Clear comments from specific advisor
   */
  clearAdvisor(role: AdvisorRole): void {
    this.commentQueue = this.commentQueue.filter((c) => c.advisorRole !== role);
    this.audioQueue = this.audioQueue.filter((a) => a.advisorRole !== role);
  }

  /**
   * Remove low-priority items to make room
   */
  pruneQueue(): void {
    // Remove routine items first
    this.commentQueue = this.commentQueue.filter((c) => c.priority !== 'routine');

    // Then remove excess important items
    const important = this.commentQueue.filter((c) => c.priority === 'important');
    if (important.length > MAX_QUEUE_SIZE.important) {
      const toRemove = important.slice(MAX_QUEUE_SIZE.important);
      this.commentQueue = this.commentQueue.filter((c) => !toRemove.includes(c));
    }
  }

  /**
   * Get queue state for debugging
   */
  getQueueState() {
    return {
      commentQueue: this.commentQueue.map((c) => ({
        role: c.advisorRole,
        priority: c.priority,
        text: c.text.substring(0, 50) + '...',
      })),
      audioQueue: this.audioQueue.map((a) => ({
        role: a.advisorRole,
        priority: a.priority,
        duration: a.duration,
      })),
      currentlyPlaying: this.currentlyPlaying
        ? {
            role: this.currentlyPlaying.advisorRole,
            priority: this.currentlyPlaying.priority,
          }
        : null,
    };
  }

  /**
   * Check if should interrupt current playback
   */
  shouldInterrupt(newPriority: CommentPriority): boolean {
    if (!this.currentlyPlaying) {
      return false;
    }

    const currentPriority = PRIORITY_LEVELS[this.currentlyPlaying.priority];
    const newPriorityLevel = PRIORITY_LEVELS[newPriority];

    // Only critical can interrupt
    return newPriority === 'critical' && newPriorityLevel > currentPriority;
  }
}

/**
 * Singleton instance
 */
export const advisorQueue = new AdvisorQueue();
