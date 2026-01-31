#!/usr/bin/env node
/**
 * PWA Icon Generator for Aegis Protocol
 * Generates PNG icons from an SVG template
 *
 * Run: node scripts/generate-pwa-icons.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public', 'pwa-icons');

// NORAD-themed radar icon as SVG
const createRadarIconSVG = (size, maskable = false) => {
  const padding = maskable ? size * 0.1 : 0;
  const innerSize = size - (padding * 2);
  const center = size / 2;
  const radius = innerSize / 2 - 10;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="#0a0a0a"/>

  <!-- Outer glow ring -->
  <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="#1a472a" stroke-width="3"/>

  <!-- Radar circles -->
  <circle cx="${center}" cy="${center}" r="${radius * 0.75}" fill="none" stroke="#2d5a3d" stroke-width="1.5" opacity="0.8"/>
  <circle cx="${center}" cy="${center}" r="${radius * 0.5}" fill="none" stroke="#2d5a3d" stroke-width="1.5" opacity="0.6"/>
  <circle cx="${center}" cy="${center}" r="${radius * 0.25}" fill="none" stroke="#2d5a3d" stroke-width="1.5" opacity="0.4"/>

  <!-- Crosshairs -->
  <line x1="${center}" y1="${center - radius}" x2="${center}" y2="${center + radius}" stroke="#3d7a4d" stroke-width="1" opacity="0.5"/>
  <line x1="${center - radius}" y1="${center}" x2="${center + radius}" y2="${center}" stroke="#3d7a4d" stroke-width="1" opacity="0.5"/>

  <!-- Radar sweep (static representation) -->
  <path d="M ${center} ${center} L ${center} ${center - radius} A ${radius} ${radius} 0 0 1 ${center + radius * 0.866} ${center - radius * 0.5} Z"
        fill="url(#sweepGradient)" opacity="0.6"/>

  <!-- Center dot -->
  <circle cx="${center}" cy="${center}" r="${radius * 0.08}" fill="#00ff41"/>

  <!-- Blips -->
  <circle cx="${center + radius * 0.4}" cy="${center - radius * 0.3}" r="${radius * 0.05}" fill="#ff3333" opacity="0.9"/>
  <circle cx="${center - radius * 0.5}" cy="${center + radius * 0.2}" r="${radius * 0.04}" fill="#ff3333" opacity="0.7"/>
  <circle cx="${center + radius * 0.2}" cy="${center + radius * 0.5}" r="${radius * 0.035}" fill="#ffaa00" opacity="0.8"/>

  <!-- AEGIS text (only for larger icons) -->
  ${size >= 192 ? `
  <text x="${center}" y="${center + radius + 20}"
        font-family="'Courier New', monospace"
        font-size="${size * 0.06}"
        font-weight="bold"
        fill="#00ff41"
        text-anchor="middle"
        letter-spacing="2">AEGIS</text>
  ` : ''}

  <!-- Gradient definition -->
  <defs>
    <linearGradient id="sweepGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#00ff41;stop-opacity:0.4"/>
      <stop offset="100%" style="stop-color:#00ff41;stop-opacity:0"/>
    </linearGradient>
  </defs>
</svg>`;
};

// Create SVG files (browsers can use these directly)
const sizes = [
  { size: 192, maskable: false },
  { size: 512, maskable: false },
  { size: 192, maskable: true },
  { size: 512, maskable: true }
];

console.log('Generating PWA icons...');

// Ensure directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

sizes.forEach(({ size, maskable }) => {
  const filename = maskable
    ? `icon-maskable-${size}x${size}.svg`
    : `icon-${size}x${size}.svg`;
  const filepath = path.join(publicDir, filename);
  const svg = createRadarIconSVG(size, maskable);

  fs.writeFileSync(filepath, svg);
  console.log(`  Created: ${filename}`);
});

// Also create a base64 encoded data URL version for fallback
const svg192 = createRadarIconSVG(192, false);
const base64 = Buffer.from(svg192).toString('base64');
console.log('\nBase64 data URL for 192x192 icon (for HTML fallback):');
console.log(`data:image/svg+xml;base64,${base64.substring(0, 50)}...`);

console.log('\n✓ PWA icons generated successfully!');
console.log('\nNote: For PNG conversion, you can use an online converter or:');
console.log('  npm install sharp');
console.log('  Then run convert-to-png.mjs');
