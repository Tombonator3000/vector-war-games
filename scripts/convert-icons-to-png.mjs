#!/usr/bin/env node
/**
 * Convert SVG icons to PNG for PWA compatibility
 * Run: node scripts/convert-icons-to-png.mjs
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, '..', 'public', 'pwa-icons');

const conversions = [
  { input: 'icon-192x192.svg', output: 'icon-192x192.png', size: 192 },
  { input: 'icon-512x512.svg', output: 'icon-512x512.png', size: 512 },
  { input: 'icon-maskable-192x192.svg', output: 'icon-maskable-192x192.png', size: 192 },
  { input: 'icon-maskable-512x512.svg', output: 'icon-maskable-512x512.png', size: 512 },
];

async function convertIcons() {
  console.log('Converting SVG icons to PNG...\n');

  for (const { input, output, size } of conversions) {
    const inputPath = path.join(iconsDir, input);
    const outputPath = path.join(iconsDir, output);

    if (!fs.existsSync(inputPath)) {
      console.log(`  ⚠ Skipped: ${input} (not found)`);
      continue;
    }

    try {
      await sharp(inputPath)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      console.log(`  ✓ Converted: ${input} -> ${output}`);
    } catch (err) {
      console.error(`  ✗ Error converting ${input}:`, err.message);
    }
  }

  // Also create Apple Touch Icon (180x180)
  const appleIconInput = path.join(iconsDir, 'icon-192x192.svg');
  const appleIconOutput = path.join(iconsDir, 'apple-touch-icon.png');

  if (fs.existsSync(appleIconInput)) {
    try {
      await sharp(appleIconInput)
        .resize(180, 180)
        .png()
        .toFile(appleIconOutput);
      console.log(`  ✓ Created: apple-touch-icon.png (180x180)`);
    } catch (err) {
      console.error(`  ✗ Error creating apple-touch-icon:`, err.message);
    }
  }

  console.log('\n✓ Icon conversion complete!');
}

convertIcons().catch(console.error);
