/**
 * Advisor Voice System - Multi-Provider TTS Integration
 *
 * Handles text-to-speech generation for advisor commentary.
 * Supports multiple providers:
 * - Edge-TTS (development): FREE, no API key required
 * - ElevenLabs (production): High quality, requires API key
 *
 * Implements caching, error handling, and audio buffer management.
 */

import { VoiceConfig, AdvisorAudio, AdvisorComment } from '@/types/advisor.types';
import { getTTSConfig, logTTSStatus, TTSConfig } from '@/config/tts.config';

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
  private ttsConfig: TTSConfig;
  private ttsAvailable = true;

  constructor() {
    this.ttsConfig = getTTSConfig();
    logTTSStatus();
  }

  /**
   * Initialize audio context
   * Returns null if AudioContext is not available
   */
  private initAudioContext(): AudioContext | null {
    if (!this.audioContext) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) {
          console.warn('[AdvisorVoice] AudioContext not available in this environment');
          return null;
        }
        this.audioContext = new AudioContextClass();
      } catch (error) {
        console.warn('[AdvisorVoice] Failed to create AudioContext:', error);
        return null;
      }
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

      // Call TTS API (Edge-TTS in dev, ElevenLabs in production)
      const response = await this.callTTSAPI(comment.text, voiceConfig);

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
   * Call TTS API (Edge-TTS or ElevenLabs based on config)
   *
   * @param text - Text to convert to speech
   * @param voiceConfig - Voice configuration
   * @returns Response with audio data
   */
  private async callTTSAPI(
    text: string,
    voiceConfig: VoiceConfig
  ): Promise<Response> {
    // Check if TTS was previously marked unavailable
    if (!this.ttsAvailable && this.ttsConfig.useFallback) {
      throw new Error('TTS service unavailable');
    }

    // Use Edge-TTS in development (FREE)
    if (this.ttsConfig.provider === 'edge-tts') {
      return this.callEdgeTTSAPI(text, voiceConfig);
    }

    // Use ElevenLabs in production
    return this.callElevenLabsAPI(text, voiceConfig);
  }

  /**
   * Call Edge-TTS API (development - FREE)
   */
  private async callEdgeTTSAPI(
    text: string,
    voiceConfig: VoiceConfig
  ): Promise<Response> {
    console.log(`[AdvisorVoice] Using Edge-TTS (FREE) - endpoint: ${this.ttsConfig.endpoint}`);

    try {
      const response = await fetch(this.ttsConfig.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voiceId: voiceConfig.voiceId, // Will be mapped server-side
          voiceSettings: {
            stability: voiceConfig.stability,
            similarity_boost: voiceConfig.similarityBoost,
            style: voiceConfig.style,
          },
        }),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      if (!response.ok) {
        throw new Error(`Edge-TTS error: ${response.status}`);
      }

      return response;
    } catch (error) {
      // Mark TTS as unavailable to avoid repeated failures
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.warn('[AdvisorVoice] Edge-TTS server not running. Start with: npm run tts:dev');
        this.ttsAvailable = false;
      }
      throw error;
    }
  }

  /**
   * Call ElevenLabs Text-to-Speech API (production)
   *
   * @param text - Text to convert to speech
   * @param voiceConfig - Voice configuration
   * @returns Response with audio data
   */
  private async callElevenLabsAPI(
    text: string,
    voiceConfig: VoiceConfig
  ): Promise<Response> {
    const apiEndpoint = this.ttsConfig.endpoint;
    const apiKey = this.ttsConfig.apiKey;

    if (!apiKey && !apiEndpoint.startsWith('/api') && !apiEndpoint.startsWith('http://localhost')) {
      console.warn('[AdvisorVoice] No ElevenLabs API key configured. Using fallback.');
      throw new Error('No API key configured');
    }

    // Backend proxy approach (recommended for production)
    if (apiEndpoint.startsWith('/api') || apiEndpoint.includes('localhost')) {
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
   * Reset TTS availability (call after config change or to retry)
   */
  resetTTSAvailability(): void {
    this.ttsAvailable = true;
    this.ttsConfig = getTTSConfig();
    logTTSStatus();
  }

  /**
   * Check if TTS is currently available
   */
  isTTSAvailable(): boolean {
    return this.ttsAvailable;
  }

  /**
   * Get audio duration from buffer
   */
  private async getAudioDuration(audioBuffer: ArrayBuffer): Promise<number> {
    try {
      const ctx = this.initAudioContext();
      if (!ctx) {
        return 5000; // Default 5 seconds if no AudioContext
      }
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
    // Create empty audio buffer as fallback (no AudioContext needed)
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

    // Skip playback if audio buffer is empty (fallback/silent audio)
    if (!advisorAudio.audioBuffer || advisorAudio.audioBuffer.byteLength === 0) {
      console.log('[AdvisorVoice] Skipping playback for empty audio buffer');
      return;
    }

    try {
      const ctx = this.initAudioContext();
      if (!ctx) {
        console.warn('[AdvisorVoice] Cannot play audio: AudioContext not available');
        return;
      }

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
