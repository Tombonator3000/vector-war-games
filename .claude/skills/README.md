# Claude Code Skills

This directory contains custom skills for Claude Code that extend its capabilities.

## Available Skills

### 🎨 Image Generation (`image-generation.skill.md`)

Generate AI images using Google's Nano Banana (Gemini 2.5 Flash Image API).

**Usage:**
```
Can you generate an image of [description]?
```

**Features:**
- Text-to-image generation using Gemini 2.5 Flash Image
- Automatic saving to `public/images/` directory
- Support for various aspect ratios
- Production-ready quality with SynthID watermarking

**Requirements:**
- `GOOGLE_API_KEY` environment variable must be set
- Get your API key from: https://aistudio.google.com/apikey

**Helper Scripts:**
- `scripts/generate-image.py` - Python implementation
- `scripts/generate-image.js` - Node.js implementation

## Setup

### 1. Get Google API Key

Visit [Google AI Studio](https://aistudio.google.com/apikey) to obtain your API key.

### 2. Set Environment Variable

```bash
export GOOGLE_API_KEY="your-api-key-here"
```

Add this to your `~/.bashrc` or `~/.zshrc` to persist across sessions.

### 3. Install Dependencies

**For Python scripts:**
```bash
pip install requests pillow
```

**For Node.js scripts:**
```bash
npm install axios
```

## Usage Examples

### Using Claude Code Skill

Simply ask Claude Code to generate an image:

```
User: Can you generate an image of a futuristic space station orbiting Earth?
Claude: [Uses image-generation skill to create and save the image]
```

### Using Python Script

```bash
# Basic usage
python scripts/generate-image.py "A serene mountain landscape at sunset"

# Custom filename
python scripts/generate-image.py -o mountain_sunset "A serene mountain landscape"

# Quiet mode (only output path)
python scripts/generate-image.py -q "Space exploration scene"
```

### Using Node.js Script

```bash
# Basic usage
node scripts/generate-image.js "A cyberpunk cityscape at night"

# Custom filename
node scripts/generate-image.js -o cyberpunk_city "A cyberpunk cityscape"

# Quiet mode
node scripts/generate-image.js -q "Retro 80s neon aesthetic"
```

## Tips for Better Images

### Good Prompts

✅ **Be specific and descriptive:**
- "Architectural render of a tranquil Japanese courtyard at dusk with volumetric lighting"
- "A futuristic space station orbiting Earth, photorealistic, 4K quality"
- "Cyberpunk cityscape at night with neon signs and rain, cinematic composition"

✅ **Include style keywords:**
- photorealistic, artistic, cinematic, painterly, sketch
- 4K, high resolution, detailed

✅ **Specify mood and lighting:**
- golden hour, dramatic lighting, soft ambient light
- moody, cheerful, mysterious, epic

### Avoid

❌ Vague prompts: "A nice picture"
❌ Conflicting styles: "photorealistic cartoon"
❌ Overly complex: combining too many unrelated elements

## Supported Features

- **Aspect Ratios:** 1:1, 16:9, 9:16, 4:3, 3:4, 21:9, and more
- **Resolution:** Up to 4K
- **Style Transfer:** Describe artistic styles in your prompt
- **Image Editing:** Can edit existing images (see skill documentation)
- **Text in Images:** Nano Banana Pro excels at rendering legible text

## Troubleshooting

### "GOOGLE_API_KEY not set"
Set your API key:
```bash
export GOOGLE_API_KEY="your-key-here"
```

### "401 Unauthorized"
Your API key is invalid. Get a new one from Google AI Studio.

### "429 Too Many Requests"
You've hit the rate limit. Wait a few minutes and try again.

### "No image data received"
The API request succeeded but didn't return an image. Check your prompt and try again.

## API Information

- **Model:** `gemini-2.5-flash-image`
- **Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent`
- **Cost:** ~258 tokens per image generation
- **Rate Limits:** Subject to Google's API rate limits

## Resources

- [Gemini API Documentation](https://ai.google.dev/gemini-api/docs/image-generation)
- [Google AI Studio](https://aistudio.google.com/)
- [Gemini on Vertex AI](https://cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/2-5-flash-image)

## Version History

- **v1.0** (2026-01-08): Initial release with Nano Banana (Gemini 2.5 Flash Image) support

---

**Note:** All images generated with Nano Banana include an invisible SynthID watermark for authentication and tracking.
