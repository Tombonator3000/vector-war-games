/**
 * Edge-TTS Development Server
 *
 * Provides a local TTS API endpoint using Microsoft Edge's free neural TTS service.
 * This server is for development only - use ElevenLabs in production.
 *
 * Usage: node server/tts-dev-server.js
 * API: POST http://localhost:3001/api/tts
 */

import express from 'express';
import cors from 'cors';
import { tts, getVoices } from 'edge-tts/out/index.js';

const app = express();
const PORT = process.env.TTS_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

/**
 * Edge-TTS voice mapping for advisors
 * Maps ElevenLabs voiceIds to Edge-TTS voices with similar characteristics
 */
const VOICE_MAPPING = {
  // Military - General Marcus "Iron" Stone (Roger - Deep, authoritative)
  'CwhRBWXzGAHq8TQ4Fs17': 'en-US-GuyNeural',

  // Science - Dr. Eleanor Vance (Sarah - Calm, analytical)
  'EXAVITQu4vr4xnSDxMaL': 'en-US-JennyNeural',

  // Diplomatic - Ambassador Katherine Wei (Charlotte - Diplomatic, measured)
  'XB0fDUnXU5powFXDhCwa': 'en-GB-SoniaNeural',

  // Intel - Director James "Shadow" Garrett (Daniel - Measured, cryptic)
  'onwK4e9ZLuTAKqWW03F9': 'en-US-DavisNeural',

  // Economic - Secretary Hayes (Bill - Practical, numbers-focused)
  'pqHfZKP75CvOlQylNhV4': 'en-US-TonyNeural',

  // PR - Press Secretary Morgan (Jessica - Urgent, media-savvy)
  'cgSgspJ2msm6clMCkdW9': 'en-US-AriaNeural',
};

/**
 * Default voice for unmapped voiceIds
 */
const DEFAULT_VOICE = 'en-US-ChristopherNeural';

/**
 * Convert voice settings to SSML rate/pitch
 */
function getVoiceModifiers(voiceSettings) {
  const rate = voiceSettings?.style ? `${Math.round((voiceSettings.style - 0.5) * 40)}%` : '+0%';
  const pitch = voiceSettings?.stability ? `${Math.round((1 - voiceSettings.stability) * 10)}Hz` : '+0Hz';
  return { rate, pitch };
}

/**
 * Mock audio for testing when Edge-TTS is unavailable
 * Returns a minimal valid MP3 header (silent)
 */
function getMockAudio() {
  // Minimal MP3 frame (silent) - just enough to be valid
  return Buffer.from([
    0xFF, 0xFB, 0x90, 0x00, // MP3 frame header
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  ]);
}

/**
 * POST /api/tts - Generate speech from text
 *
 * Body:
 * - text: string (required) - Text to convert to speech
 * - voiceId: string (optional) - ElevenLabs voiceId (mapped to Edge-TTS)
 * - voiceSettings: object (optional) - Voice modifiers
 * - mock: boolean (optional) - Return mock audio for testing
 */
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voiceId, voiceSettings, mock } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Map ElevenLabs voiceId to Edge-TTS voice
    const edgeVoice = VOICE_MAPPING[voiceId] || DEFAULT_VOICE;
    const { rate, pitch } = getVoiceModifiers(voiceSettings);

    console.log(`[TTS] Generating speech: voice=${edgeVoice}, text="${text.substring(0, 50)}..."`);

    let audioBuffer;

    // Check if mock mode or if network is unavailable
    if (mock || process.env.TTS_MOCK === 'true') {
      console.log('[TTS] Using mock audio (testing mode)');
      audioBuffer = getMockAudio();
    } else {
      try {
        // Generate audio using Edge-TTS tts function
        audioBuffer = await tts(text, {
          voice: edgeVoice,
          rate: rate,
          pitch: pitch,
          volume: '+0%',
        });
      } catch (networkError) {
        // Fallback to mock on network errors
        console.warn('[TTS] Network error, falling back to mock audio:', networkError.message);
        console.log('[TTS] Tip: Edge-TTS requires internet access to speech.platform.bing.com');
        audioBuffer = getMockAudio();
      }
    }

    // Send audio as MP3
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
      'Cache-Control': 'public, max-age=3600',
    });

    res.send(audioBuffer);

    console.log(`[TTS] Generated ${audioBuffer.length} bytes of audio`);
  } catch (error) {
    console.error('[TTS] Error generating speech:', error);
    res.status(500).json({
      error: 'Failed to generate speech',
      details: error.message,
    });
  }
});

/**
 * GET /api/tts/voices - List available voices
 */
app.get('/api/tts/voices', async (req, res) => {
  try {
    const voices = await getVoices();
    res.json({
      voiceMapping: VOICE_MAPPING,
      defaultVoice: DEFAULT_VOICE,
      advisors: {
        military: { elevenLabsId: 'CwhRBWXzGAHq8TQ4Fs17', edgeVoice: 'en-US-GuyNeural', description: 'Deep, authoritative male' },
        science: { elevenLabsId: 'EXAVITQu4vr4xnSDxMaL', edgeVoice: 'en-US-JennyNeural', description: 'Calm, analytical female' },
        diplomatic: { elevenLabsId: 'XB0fDUnXU5powFXDhCwa', edgeVoice: 'en-GB-SoniaNeural', description: 'Diplomatic, measured British female' },
        intel: { elevenLabsId: 'onwK4e9ZLuTAKqWW03F9', edgeVoice: 'en-US-DavisNeural', description: 'Measured, cryptic male' },
        economic: { elevenLabsId: 'pqHfZKP75CvOlQylNhV4', edgeVoice: 'en-US-TonyNeural', description: 'Practical, numbers-focused male' },
        pr: { elevenLabsId: 'cgSgspJ2msm6clMCkdW9', edgeVoice: 'en-US-AriaNeural', description: 'Urgent, expressive female' },
      },
      availableVoices: voices.length,
    });
  } catch (error) {
    res.json({
      voiceMapping: VOICE_MAPPING,
      defaultVoice: DEFAULT_VOICE,
      advisors: {
        military: { elevenLabsId: 'CwhRBWXzGAHq8TQ4Fs17', edgeVoice: 'en-US-GuyNeural', description: 'Deep, authoritative male' },
        science: { elevenLabsId: 'EXAVITQu4vr4xnSDxMaL', edgeVoice: 'en-US-JennyNeural', description: 'Calm, analytical female' },
        diplomatic: { elevenLabsId: 'XB0fDUnXU5powFXDhCwa', edgeVoice: 'en-GB-SoniaNeural', description: 'Diplomatic, measured British female' },
        intel: { elevenLabsId: 'onwK4e9ZLuTAKqWW03F9', edgeVoice: 'en-US-DavisNeural', description: 'Measured, cryptic male' },
        economic: { elevenLabsId: 'pqHfZKP75CvOlQylNhV4', edgeVoice: 'en-US-TonyNeural', description: 'Practical, numbers-focused male' },
        pr: { elevenLabsId: 'cgSgspJ2msm6clMCkdW9', edgeVoice: 'en-US-AriaNeural', description: 'Urgent, expressive female' },
      },
    });
  }
});

/**
 * GET /api/tts/health - Health check
 */
app.get('/api/tts/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'edge-tts-dev-server',
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║           Edge-TTS Development Server                      ║
║                                                            ║
║  FREE text-to-speech for advisor voices                    ║
║  No API key required!                                      ║
║                                                            ║
║  Endpoint: http://localhost:${PORT}/api/tts                  ║
║  Health:   http://localhost:${PORT}/api/tts/health           ║
║  Voices:   http://localhost:${PORT}/api/tts/voices           ║
║                                                            ║
║  For production, use ElevenLabs with proper backend.       ║
╚════════════════════════════════════════════════════════════╝
  `);
});

export default app;
