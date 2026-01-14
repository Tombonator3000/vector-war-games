/**
 * Advisor Voice System - ElevenLabs TTS Integration
 *
 * Handles text-to-speech generation via ElevenLabs API for advisor commentary.
 * Implements caching, error handling, and audio buffer management.
 */

import { VoiceConfig, AdvisorAudio, AdvisorComment } from '@/types/advisor.types';

/**
 * Cache for generated audio to avoid redundant API calls
 * Key format: "role:text" (first 100 chars of text for key)
 */
const audioCache = new Map<string, ArrayBuffer>();

/**
 * Maximum cache size (in entries)
 */
const MAX_CACHE_SIZE = 100;

/**
 * Cache TTL in milliseconds (15 minutes)
 */
const CACHE_TTL = 15 * 60 * 1000;

/**
 * Cache entry with timestamp
 */
interface CacheEntry {
  buffer: ArrayBuffer;
  timestamp: number;
}

/**
 * Enhanced cache with TTL support
 */
const enhancedCache = new Map<string, CacheEntry>();

/**
 * AdvisorVoice class manages TTS generation and playback
 */
export class AdvisorVoiceSystem {
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private isPlaying = false;
  private volume = 0.7;

  /**
   * Initialize audio context
   */
  private initAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  /**
   * Generate cache key from comment
   */
  private getCacheKey(comment: AdvisorComment): string {
    const textKey = comment.text.substring(0, 100).toLowerCase().trim();
    return `${comment.advisorRole}:${textKey}`;
  }

  /**
   * Clean expired cache entries
   */
  private cleanCache(): void {
    const now = Date.now();
    for (const [key, entry] of enhancedCache.entries()) {
      if (now - entry.timestamp > CACHE_TTL) {
        enhancedCache.delete(key);
      }
    }

    // If still too large, remove oldest entries
    if (enhancedCache.size > MAX_CACHE_SIZE) {
      const entries = Array.from(enhancedCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toRemove = entries.slice(0, enhancedCache.size - MAX_CACHE_SIZE);
      toRemove.forEach(([key]) => enhancedCache.delete(key));
    }
  }

  /**
   * Generate speech via ElevenLabs API
   *
   * @param comment - The advisor comment to convert to speech
   * @param voiceConfig - Voice configuration for TTS
   * @returns Audio buffer ready for playback
   */
  async generateSpeech(
    comment: AdvisorComment,
    voiceConfig: VoiceConfig
  ): Promise<AdvisorAudio> {
    // Check cache first
    const cacheKey = this.getCacheKey(comment);
    const cached = enhancedCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[AdvisorVoice] Cache hit for: ${comment.text.substring(0, 50)}...`);
      return {
        commentId: comment.id,
        advisorRole: comment.advisorRole,
        audioBuffer: cached.buffer,
        duration: await this.getAudioDuration(cached.buffer),
        priority: comment.priority,
      };
    }

    try {
      console.log(`[AdvisorVoice] Generating TTS for ${comment.advisorRole}: ${comment.text}`);

      // Call ElevenLabs API
      // Note: In production, this should go through a backend API to keep API keys secure
      const response = await this.callElevenLabsAPI(comment.text, voiceConfig);

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
      }

      const audioBuffer = await response.arrayBuffer();

      // Cache the result
      enhancedCache.set(cacheKey, {
        buffer: audioBuffer,
        timestamp: Date.now(),
      });
      this.cleanCache();

      const duration = await this.getAudioDuration(audioBuffer);

      return {
        commentId: comment.id,
        advisorRole: comment.advisorRole,
        audioBuffer,
        duration,
        priority: comment.priority,
      };
    } catch (error) {
      console.error('[AdvisorVoice] TTS generation failed:', error);

      // Return fallback silent audio
      return this.createSilentAudio(comment);
    }
  }

  /**
   * Call ElevenLabs Text-to-Speech API
   *
   * @param text - Text to convert to speech
   * @param voiceConfig - Voice configuration
   * @returns Response with audio data
   */
  private async callElevenLabsAPI(
    text: string,
    voiceConfig: VoiceConfig
  ): Promise<Response> {
    // In development, use mock API or backend proxy
    const apiEndpoint = import.meta.env.VITE_ELEVENLABS_API_ENDPOINT || '/api/tts';
    const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;

    if (!apiKey && !apiEndpoint.startsWith('/api')) {
      console.warn('[AdvisorVoice] No ElevenLabs API key configured. Using fallback.');
      throw new Error('No API key configured');
    }

    // Backend proxy approach (recommended for production)
    if (apiEndpoint.startsWith('/api')) {
      return fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voiceId: voiceConfig.voiceId,
          model: voiceConfig.model,
          voiceSettings: {
            stability: voiceConfig.stability,
            similarity_boost: voiceConfig.similarityBoost,
            style: voiceConfig.style,
          },
        }),
      });
    }

    // Direct API approach (only for development/testing)
    return fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceConfig.voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey || '',
        },
        body: JSON.stringify({
          text,
          model_id: voiceConfig.model,
          voice_settings: {
            stability: voiceConfig.stability,
            similarity_boost: voiceConfig.similarityBoost,
            style: voiceConfig.style,
          },
        }),
      }
    );
  }

  /**
   * Get audio duration from buffer
   */
  private async getAudioDuration(audioBuffer: ArrayBuffer): Promise<number> {
    try {
      const ctx = this.initAudioContext();
      const decoded = await ctx.decodeAudioData(audioBuffer.slice(0));
      return decoded.duration * 1000; // Convert to milliseconds
    } catch (error) {
      console.error('[AdvisorVoice] Failed to decode audio duration:', error);
      return 5000; // Default 5 seconds
    }
  }

  /**
   * Create silent audio fallback
   */
  private createSilentAudio(comment: AdvisorComment): AdvisorAudio {
    // Create minimal silent audio buffer
    const ctx = this.initAudioContext();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 1, ctx.sampleRate);

    // Convert AudioBuffer to ArrayBuffer (simplified approach)
    const arrayBuffer = new ArrayBuffer(0);

    return {
      commentId: comment.id,
      advisorRole: comment.advisorRole,
      audioBuffer: arrayBuffer,
      duration: 1000,
      priority: comment.priority,
    };
  }

  /**
   * Play audio from advisor
   */
  async playAudio(advisorAudio: AdvisorAudio): Promise<void> {
    if (this.isPlaying) {
      this.stop();
    }

    try {
      const ctx = this.initAudioContext();

      // Resume context if suspended (browser autoplay policy)
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const audioBuffer = await ctx.decodeAudioData(advisorAudio.audioBuffer.slice(0));

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;

      // Create gain node for volume control
      const gainNode = ctx.createGain();
      gainNode.gain.value = this.volume;

      source.connect(gainNode);
      gainNode.connect(ctx.destination);

      this.currentSource = source;
      this.isPlaying = true;

      return new Promise((resolve) => {
        source.onended = () => {
          this.isPlaying = false;
          this.currentSource = null;
          resolve();
        };

        source.start(0);
      });
    } catch (error) {
      console.error('[AdvisorVoice] Playback failed:', error);
      this.isPlaying = false;
      this.currentSource = null;
    }
  }

  /**
   * Stop current playback
   */
  stop(): void {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch (error) {
        // Already stopped
      }
      this.currentSource = null;
    }
    this.isPlaying = false;
  }

  /**
   * Set playback volume
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Check if currently playing
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Clear audio cache
   */
  clearCache(): void {
    enhancedCache.clear();
    audioCache.clear();
  }
}

/**
 * Singleton instance
 */
export const advisorVoiceSystem = new AdvisorVoiceSystem();
