#!/usr/bin/env python3
"""
Image Generation Script using Nano Banana (Gemini 2.5 Flash Image API)

This script generates images using Google's Gemini 2.5 Flash Image API
and saves them to the public/images directory.

Usage:
    export GOOGLE_API_KEY="your-api-key-here"
    python scripts/generate-image.py "A futuristic space station orbiting Earth"

Requirements:
    pip install requests pillow
"""

import os
import sys
import requests
from PIL import Image
from io import BytesIO
import base64
from datetime import datetime
import argparse


def generate_image(prompt: str, output_filename: str = None, verbose: bool = True) -> str:
    """
    Generate an image using Nano Banana (Gemini 2.5 Flash Image API)

    Args:
        prompt: Text description of the image to generate
        output_filename: Optional custom filename (without extension)
        verbose: Print progress messages

    Returns:
        Path to the saved image file
    """
    # Check for API key
    api_key = os.environ.get('GOOGLE_API_KEY')
    if not api_key:
        raise ValueError(
            "GOOGLE_API_KEY environment variable not set.\n"
            "Get your API key from: https://aistudio.google.com/apikey\n"
            "Then set it: export GOOGLE_API_KEY='your-key-here'"
        )

    if verbose:
        print(f"📝 Prompt: {prompt}")
        print("🎨 Generating image with Nano Banana...")

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
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=60)
        response.raise_for_status()
    except requests.exceptions.HTTPError as e:
        if response.status_code == 401:
            raise ValueError("Invalid API key. Please check your GOOGLE_API_KEY.")
        elif response.status_code == 403:
            raise ValueError("API key doesn't have required permissions.")
        elif response.status_code == 429:
            raise ValueError("Rate limit exceeded. Please wait and try again.")
        else:
            raise ValueError(f"API request failed: {e}")
    except requests.exceptions.Timeout:
        raise ValueError("API request timed out. Please try again.")
    except requests.exceptions.RequestException as e:
        raise ValueError(f"Network error: {e}")

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
        raise ValueError("No image data received from API. Response: " + str(result))

    if verbose:
        print("✅ Image received from API")
        print("💾 Saving image...")

    # Decode base64 image
    try:
        image_bytes = base64.b64decode(image_data)
        img = Image.open(BytesIO(image_bytes))
    except Exception as e:
        raise ValueError(f"Failed to decode image data: {e}")

    # Generate filename if not provided
    if not output_filename:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        # Create safe filename from prompt (first 30 chars)
        safe_prompt = "".join(
            c if c.isalnum() or c in (' ', '-', '_') else ''
            for c in prompt[:30]
        ).strip().replace(' ', '_')
        output_filename = f"generated_{safe_prompt}_{timestamp}"

    # Ensure public/images directory exists
    os.makedirs("public/images", exist_ok=True)

    # Save to public/images
    output_path = f"public/images/{output_filename}.png"
    img.save(output_path)

    if verbose:
        print(f"✨ Image saved to: {output_path}")
        print(f"📐 Dimensions: {img.width}x{img.height}")

    return output_path


def main():
    parser = argparse.ArgumentParser(
        description="Generate images using Nano Banana (Gemini 2.5 Flash Image API)"
    )
    parser.add_argument(
        "prompt",
        type=str,
        help="Text description of the image to generate"
    )
    parser.add_argument(
        "-o", "--output",
        type=str,
        default=None,
        help="Custom output filename (without extension)"
    )
    parser.add_argument(
        "-q", "--quiet",
        action="store_true",
        help="Suppress progress messages"
    )

    args = parser.parse_args()

    try:
        output_path = generate_image(
            prompt=args.prompt,
            output_filename=args.output,
            verbose=not args.quiet
        )

        if args.quiet:
            print(output_path)

    except ValueError as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
