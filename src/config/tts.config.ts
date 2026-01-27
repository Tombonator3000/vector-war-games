/**
 * TTS Configuration
 *
 * Configures text-to-speech backend based on environment.
 * - Development: Uses Edge-TTS (free, no API key)
 * - Production: Uses ElevenLabs (high quality, requires API key)
 */

export type TTSProvider = 'edge-tts' | 'elevenlabs';

/**
 * Edge-TTS voice mapping
 * Maps advisor roles to Edge-TTS neural voices
 */
export const EDGE_TTS_VOICES: Record<string, string> = {
  // Military - Deep, authoritative male
  military: 'en-US-GuyNeural',

  // Science - Calm, analytical female
  science: 'en-US-JennyNeural',

  // Diplomatic - Diplomatic, measured British female
  diplomatic: 'en-GB-SoniaNeural',

  // Intel - Measured, cryptic male
  intel: 'en-US-DavisNeural',

  // Economic - Practical, numbers-focused male
  economic: 'en-US-TonyNeural',

  // PR - Urgent, expressive female
  pr: 'en-US-AriaNeural',
};

/**
 * TTS Configuration interface
 */
export interface TTSConfig {
  provider: TTSProvider;
  endpoint: string;
  apiKey?: string;
  useFallback: boolean;
}

/**
 * Get TTS configuration based on environment
 */
export function getTTSConfig(): TTSConfig {
  const isDev = import.meta.env.DEV;
  const hasElevenLabsKey = !!import.meta.env.VITE_ELEVENLABS_API_KEY;
  const customEndpoint = import.meta.env.VITE_ELEVENLABS_API_ENDPOINT;
  const edgeTTSEndpoint = import.meta.env.VITE_EDGE_TTS_ENDPOINT || 'http://localhost:3001/api/tts';

  // In development without ElevenLabs key, use Edge-TTS
  if (isDev && !hasElevenLabsKey) {
    return {
      provider: 'edge-tts',
      endpoint: edgeTTSEndpoint,
      useFallback: true,
    };
  }

  // Production or development with ElevenLabs key
  return {
    provider: 'elevenlabs',
    endpoint: customEndpoint || '/api/tts',
    apiKey: import.meta.env.VITE_ELEVENLABS_API_KEY,
    useFallback: true,
  };
}

/**
 * Check if TTS is available
 * Tests the configured endpoint
 */
export async function checkTTSAvailability(): Promise<boolean> {
  const config = getTTSConfig();

  try {
    if (config.provider === 'edge-tts') {
      const response = await fetch(`${config.endpoint.replace('/api/tts', '')}/api/tts/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      });
      return response.ok;
    }

    // For ElevenLabs, we can't easily check without making a real request
    return true;
  } catch {
    return false;
  }
}

/**
 * Log TTS configuration status
 */
export function logTTSStatus(): void {
  const config = getTTSConfig();

  console.log('[TTS Config]', {
    provider: config.provider,
    endpoint: config.endpoint,
    hasApiKey: !!config.apiKey,
    mode: import.meta.env.DEV ? 'development' : 'production',
  });

  if (config.provider === 'edge-tts') {
    console.log('[TTS] Using Edge-TTS (FREE) - Start dev server with: npm run tts:dev');
  } else {
    console.log('[TTS] Using ElevenLabs - Ensure backend proxy is configured');
  }
}
