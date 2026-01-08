# Image Generation with Nano Banana

This skill enables AI image generation using Google's Nano Banana (Gemini 2.5 Flash Image) API.

## Overview

When the user requests an image to be generated, use this skill to:
1. Generate images using the Gemini 2.5 Flash Image API (Nano Banana)
2. Save generated images to the `public/images/` directory
3. Provide the user with the file path for easy access

## API Details

**Model:** `gemini-2.5-flash-image`
**Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent`
**Authentication:** Requires `GOOGLE_API_KEY` environment variable

## Usage Instructions

### When to Use This Skill

Use this skill when the user:
- Explicitly asks for an image to be generated
- Requests visual content creation
- Asks you to create, generate, or make an image

### Implementation Steps

1. **Extract the prompt**: Understand what the user wants to generate
2. **Generate the image**: Use the Gemini API to create the image
3. **Save to public/images/**: Store with a descriptive filename
4. **Provide feedback**: Tell the user where the image was saved

### Example Code Pattern

```python
import os
import requests
from PIL import Image
from io import BytesIO
import base64
from datetime import datetime

def generate_image(prompt: str, output_filename: str = None) -> str:
    """
    Generate an image using Nano Banana (Gemini 2.5 Flash Image API)

    Args:
        prompt: Text description of the image to generate
        output_filename: Optional custom filename (without extension)

    Returns:
        Path to the saved image file
    """
    api_key = os.environ.get('GOOGLE_API_KEY')
    if not api_key:
        raise ValueError("GOOGLE_API_KEY environment variable not set")

    # API endpoint
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent"

    # Request headers
    headers = {
        "x-goog-api-key": api_key,
        "Content-Type": "application/json"
    }

    # Request body
    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }],
        "generationConfig": {
            "temperature": 1.0,
            "topP": 0.95,
            "topK": 40,
            "maxOutputTokens": 8192
        }
    }

    # Make API request
    response = requests.post(url, headers=headers, json=payload)
    response.raise_for_status()

    # Extract image data
    result = response.json()

    # Get inline image data from response
    image_data = None
    for candidate in result.get('candidates', []):
        for part in candidate.get('content', {}).get('parts', []):
            if 'inlineData' in part:
                image_data = part['inlineData']['data']
                break
        if image_data:
            break

    if not image_data:
        raise ValueError("No image data received from API")

    # Decode base64 image
    image_bytes = base64.b64decode(image_data)
    img = Image.open(BytesIO(image_bytes))

    # Generate filename if not provided
    if not output_filename:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        # Create safe filename from prompt (first 30 chars)
        safe_prompt = "".join(c if c.isalnum() or c in (' ', '-', '_') else ''
                             for c in prompt[:30]).strip().replace(' ', '_')
        output_filename = f"generated_{safe_prompt}_{timestamp}"

    # Save to public/images
    output_path = f"public/images/{output_filename}.png"
    img.save(output_path)

    return output_path

# Usage example:
# image_path = generate_image("A futuristic space station orbiting Earth")
# print(f"Image saved to: {image_path}")
```

### Alternative: Using Node.js

```javascript
const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function generateImage(prompt, outputFilename = null) {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        throw new Error('GOOGLE_API_KEY environment variable not set');
    }

    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent';

    const response = await axios.post(url, {
        contents: [{
            parts: [{ text: prompt }]
        }],
        generationConfig: {
            temperature: 1.0,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 8192
        }
    }, {
        headers: {
            'x-goog-api-key': apiKey,
            'Content-Type': 'application/json'
        }
    });

    // Extract image data
    const imageData = response.data.candidates[0].content.parts[0].inlineData.data;
    const imageBuffer = Buffer.from(imageData, 'base64');

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safePrompt = prompt.substring(0, 30).replace(/[^a-z0-9]/gi, '_');
    const filename = outputFilename || `generated_${safePrompt}_${timestamp}`;

    // Save to public/images
    const outputPath = path.join('public', 'images', `${filename}.png`);
    fs.writeFileSync(outputPath, imageBuffer);

    return outputPath;
}

// Usage:
// generateImage('A cyberpunk cityscape at night').then(console.log);
```

### Using cURL (Quick Test)

```bash
#!/bin/bash

PROMPT="A serene mountain landscape at sunset"
OUTPUT_FILE="public/images/generated_$(date +%s).png"

# Make API request and save response
response=$(curl -s -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent" \
  -H "x-goog-api-key: $GOOGLE_API_KEY" \
  -H 'Content-Type: application/json' \
  -d "{
    \"contents\": [{
      \"parts\": [{\"text\": \"$PROMPT\"}]
    }]
  }")

# Extract base64 image data (requires jq)
image_data=$(echo "$response" | jq -r '.candidates[0].content.parts[0].inlineData.data')

# Decode and save
echo "$image_data" | base64 -d > "$OUTPUT_FILE"
echo "Image saved to: $OUTPUT_FILE"
```

## Configuration

### Required Environment Variable

Set your Google API key before using this skill:

```bash
export GOOGLE_API_KEY="your-api-key-here"
```

You can get an API key from [Google AI Studio](https://aistudio.google.com/apikey).

### Supported Aspect Ratios

Gemini 2.5 Flash Image supports 10 different aspect ratios:
- Square: 1:1
- Portrait: 2:3, 3:4, 9:16
- Landscape: 16:9, 4:3, 3:2
- Ultra-wide: 21:9, 9:21
- Social media optimized ratios

Specify aspect ratio in your prompt or use generation config parameters.

## Features

- **High Quality**: Production-ready image generation
- **Fast**: Optimized for speed with flash model
- **Watermarked**: Includes invisible SynthID watermark
- **Cost-Effective**: Reduced token usage (258 tokens per image)
- **Flexible**: Supports text-to-image and image editing

## Important Notes

1. **API Key Required**: Must have valid `GOOGLE_API_KEY` environment variable set
2. **Rate Limits**: Respect Google's API rate limits
3. **File Storage**: Images saved to `public/images/` directory
4. **Naming Convention**: Use descriptive filenames based on prompt + timestamp
5. **Model Name**: Use `gemini-2.5-flash-image` (preview versions deprecated as of Jan 15, 2026)

## Error Handling

Common errors and solutions:
- **401 Unauthorized**: Check API key is valid and set correctly
- **403 Forbidden**: Verify API key has required permissions
- **429 Too Many Requests**: Rate limit reached, wait before retrying
- **500 Server Error**: Temporary API issue, retry with exponential backoff

## Example Prompts

**Good prompts:**
- "Architectural render of a tranquil Japanese courtyard at dusk with volumetric lighting"
- "A futuristic space station orbiting Earth, photorealistic, 4K quality"
- "Cyberpunk cityscape at night with neon signs and rain, cinematic composition"

**Tips for better results:**
- Be specific and descriptive
- Include style keywords (photorealistic, artistic, cinematic, etc.)
- Specify lighting and mood
- Mention composition or framing if needed

## References

- [Gemini API Image Generation Docs](https://ai.google.dev/gemini-api/docs/image-generation)
- [Gemini 2.5 Flash Image on Vertex AI](https://cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/2-5-flash-image)
- [Google AI Studio](https://aistudio.google.com/)

---

**Skill Version:** 1.0
**Last Updated:** 2026-01-08
**Model:** gemini-2.5-flash-image
**Status:** Production Ready
