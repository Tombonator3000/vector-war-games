#!/usr/bin/env node
/**
 * Image Generation Script using Nano Banana (Gemini 2.5 Flash Image API)
 *
 * This script generates images using Google's Gemini 2.5 Flash Image API
 * and saves them to the public/images directory.
 *
 * Usage:
 *   export GOOGLE_API_KEY="your-api-key-here"
 *   node scripts/generate-image.js "A futuristic space station orbiting Earth"
 *
 * Requirements:
 *   npm install axios
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * Generate an image using Nano Banana (Gemini 2.5 Flash Image API)
 *
 * @param {string} prompt - Text description of the image to generate
 * @param {string|null} outputFilename - Optional custom filename (without extension)
 * @param {boolean} verbose - Print progress messages
 * @returns {Promise<string>} Path to the saved image file
 */
async function generateImage(prompt, outputFilename = null, verbose = true) {
    // Check for API key
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        throw new Error(
            'GOOGLE_API_KEY environment variable not set.\n' +
            'Get your API key from: https://aistudio.google.com/apikey\n' +
            'Then set it: export GOOGLE_API_KEY="your-key-here"'
        );
    }

    if (verbose) {
        console.log(`📝 Prompt: ${prompt}`);
        console.log('🎨 Generating image with Nano Banana...');
    }

    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent';

    try {
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
            },
            timeout: 60000
        });

        if (verbose) {
            console.log('✅ Image received from API');
            console.log('💾 Saving image...');
        }

        // Extract image data
        const candidates = response.data.candidates;
        if (!candidates || candidates.length === 0) {
            throw new Error('No candidates in API response');
        }

        const parts = candidates[0].content.parts;
        if (!parts || parts.length === 0) {
            throw new Error('No parts in API response');
        }

        const inlineData = parts.find(part => part.inlineData)?.inlineData;
        if (!inlineData || !inlineData.data) {
            throw new Error('No image data in API response');
        }

        const imageData = inlineData.data;
        const imageBuffer = Buffer.from(imageData, 'base64');

        // Generate filename if not provided
        if (!outputFilename) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
            const safePrompt = prompt.substring(0, 30)
                .replace(/[^a-z0-9]/gi, '_')
                .replace(/_+/g, '_')
                .replace(/^_|_$/g, '');
            outputFilename = `generated_${safePrompt}_${timestamp}`;
        }

        // Ensure public/images directory exists
        const imagesDir = path.join('public', 'images');
        if (!fs.existsSync(imagesDir)) {
            fs.mkdirSync(imagesDir, { recursive: true });
        }

        // Save to public/images
        const outputPath = path.join(imagesDir, `${outputFilename}.png`);
        fs.writeFileSync(outputPath, imageBuffer);

        if (verbose) {
            console.log(`✨ Image saved to: ${outputPath}`);
        }

        return outputPath;

    } catch (error) {
        if (error.response) {
            const status = error.response.status;
            if (status === 401) {
                throw new Error('Invalid API key. Please check your GOOGLE_API_KEY.');
            } else if (status === 403) {
                throw new Error("API key doesn't have required permissions.");
            } else if (status === 429) {
                throw new Error('Rate limit exceeded. Please wait and try again.');
            } else {
                throw new Error(`API request failed with status ${status}: ${error.message}`);
            }
        } else if (error.code === 'ECONNABORTED') {
            throw new Error('API request timed out. Please try again.');
        } else {
            throw error;
        }
    }
}

// CLI interface
async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
        console.log(`
Usage: node generate-image.js [OPTIONS] <prompt>

Generate images using Nano Banana (Gemini 2.5 Flash Image API)

Arguments:
  prompt              Text description of the image to generate

Options:
  -o, --output NAME   Custom output filename (without extension)
  -q, --quiet         Suppress progress messages
  -h, --help          Show this help message

Examples:
  node generate-image.js "A serene mountain landscape at sunset"
  node generate-image.js -o my_image "A cyberpunk cityscape at night"
  node generate-image.js -q "Space exploration scene"
        `);
        process.exit(0);
    }

    let prompt = '';
    let outputFilename = null;
    let verbose = true;

    // Parse arguments
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '-o' || args[i] === '--output') {
            outputFilename = args[++i];
        } else if (args[i] === '-q' || args[i] === '--quiet') {
            verbose = false;
        } else {
            prompt = args[i];
        }
    }

    if (!prompt) {
        console.error('❌ Error: No prompt provided');
        process.exit(1);
    }

    try {
        const outputPath = await generateImage(prompt, outputFilename, verbose);

        if (!verbose) {
            console.log(outputPath);
        }

    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { generateImage };
