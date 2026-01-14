# AI Advisor Backend Setup Guide

This document describes the backend setup required for the AI Advisor System's text-to-speech functionality.

## Overview

The AI Advisor System requires a backend proxy endpoint to securely call the ElevenLabs Text-to-Speech API. This prevents exposing API keys in the frontend code.

## Required Endpoint

**Endpoint:** `/api/tts`
**Method:** POST
**Content-Type:** application/json

### Request Format

```json
{
  "text": "Mr. President, we must act now.",
  "voiceId": "CwhRBWXzGAHq8TQ4Fs17",
  "model": "eleven_turbo_v2_5",
  "stability": 0.7,
  "similarityBoost": 0.8,
  "style": 0.6
}
```

### Response Format

Returns audio data as `ArrayBuffer` (binary audio file).

## Implementation Options

### Option 1: Supabase Edge Function

Since the project already uses Supabase, create an Edge Function:

```typescript
// supabase/functions/tts/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY')

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const { text, voiceId, model, stability, similarityBoost, style } = await req.json()

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY || '',
      },
      body: JSON.stringify({
        text,
        model_id: model,
        voice_settings: {
          stability,
          similarity_boost: similarityBoost,
          style,
        },
      }),
    }
  )

  if (!response.ok) {
    return new Response('TTS generation failed', { status: response.status })
  }

  const audioData = await response.arrayBuffer()

  return new Response(audioData, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Access-Control-Allow-Origin': '*',
    },
  })
})
```

Deploy:
```bash
supabase functions deploy tts
supabase secrets set ELEVENLABS_API_KEY=your_api_key_here
```

Update `.env`:
```
VITE_ELEVENLABS_API_ENDPOINT=https://your-project.supabase.co/functions/v1/tts
```

### Option 2: Netlify Function

Create `netlify/functions/tts.ts`:

```typescript
import type { Handler } from '@netlify/functions'

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const { text, voiceId, model, stability, similarityBoost, style } = JSON.parse(event.body || '{}')

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY || '',
      },
      body: JSON.stringify({
        text,
        model_id: model,
        voice_settings: {
          stability,
          similarity_boost: similarityBoost,
          style,
        },
      }),
    }
  )

  if (!response.ok) {
    return { statusCode: response.status, body: 'TTS generation failed' }
  }

  const audioData = await response.arrayBuffer()

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
    },
    body: Buffer.from(audioData).toString('base64'),
    isBase64Encoded: true,
  }
}
```

Update `netlify.toml`:
```toml
[build]
  functions = "netlify/functions"
```

### Option 3: Vercel Serverless Function

Create `api/tts.ts`:

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { text, voiceId, model, stability, similarityBoost, style } = req.body

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
      },
      body: JSON.stringify({
        text,
        model_id: model,
        voice_settings: {
          stability,
          similarity_boost: similarityBoost,
          style,
        },
      }),
    }
  )

  if (!response.ok) {
    return res.status(response.status).json({ error: 'TTS generation failed' })
  }

  const audioData = await response.arrayBuffer()

  res.setHeader('Content-Type', 'audio/mpeg')
  res.send(Buffer.from(audioData))
}
```

## Environment Variables

Add to your deployment platform:

```
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

Get your API key from: https://elevenlabs.io/app/settings/api-keys

## Testing

Once deployed, test the endpoint:

```bash
curl -X POST https://your-domain.com/api/tts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Test message from NORAD command",
    "voiceId": "CwhRBWXzGAHq8TQ4Fs17",
    "model": "eleven_turbo_v2_5",
    "stability": 0.7,
    "similarityBoost": 0.8,
    "style": 0.6
  }' \
  --output test.mp3
```

## Fallback Mode

The advisor system will work without the backend endpoint, but voice playback will be disabled. All other functionality (text commentary, trust system, personality reactions) will work normally.

## Cost Estimation

ElevenLabs pricing (as of 2026):
- Free tier: 10,000 characters/month
- Starter: $5/month for 30,000 characters
- Creator: $22/month for 100,000 characters

Average advisor line: ~50-150 characters
Expected usage: 50-200 lines per game session = 2,500-30,000 characters

**Recommendation:** Start with free tier for testing, upgrade to Starter for production.

## Security Notes

- ✅ Never expose API keys in frontend code
- ✅ Use environment variables on backend only
- ✅ Implement rate limiting on production endpoint
- ✅ Add CORS headers for your domain only
- ✅ Consider caching generated audio to reduce API calls

---

**Status:** Backend endpoint not yet implemented
**Priority:** Medium (system works without it)
**Impact:** Voice playback only - all other features functional
**Next Steps:** Choose deployment platform and implement endpoint
