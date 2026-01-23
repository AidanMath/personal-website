#!/usr/bin/env node

/**
 * Test render script - renders grain data to an image file for verification
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Read and parse the TypeScript data file
const dataFile = path.join(__dirname, '../src/app/components/sand-background/sand-grains-data.ts');
const content = fs.readFileSync(dataFile, 'utf-8');

// Extract the metadata
const metadataMatch = content.match(/export const IMAGE_METADATA = \{([^}]+)\}/s);
if (!metadataMatch) {
  console.error('Could not find IMAGE_METADATA');
  process.exit(1);
}

// Parse metadata manually
const metadata = {};
const metaLines = metadataMatch[1].split('\n');
for (const line of metaLines) {
  const match = line.match(/(\w+):\s*(\d+)/);
  if (match) {
    metadata[match[1]] = parseInt(match[2]);
  }
}

console.log('Metadata:', metadata);

// Extract grain data using regex
const grainMatches = content.matchAll(/\{x:(\d+),y:(\d+),color:\[([^\]]+)\]\}/g);
const grains = [];
for (const match of grainMatches) {
  const x = parseInt(match[1]);
  const y = parseInt(match[2]);
  const colorParts = match[3].split(',').map(parseFloat);
  grains.push({ x, y, color: colorParts });
}

console.log(`Loaded ${grains.length} grains`);

// Create canvas
const pixelSize = metadata.pixelSize || 4;
const width = metadata.cols * pixelSize;
const height = metadata.rows * pixelSize;

console.log(`Canvas: ${width}x${height}, Pixel size: ${pixelSize}`);

const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Clear with sky color
ctx.fillStyle = '#e8dcc8';
ctx.fillRect(0, 0, width, height);

// Draw grains
let minX = Infinity, maxX = -Infinity;
let minY = Infinity, maxY = -Infinity;

for (const grain of grains) {
  const r = Math.round(grain.color[0] * 255);
  const g = Math.round(grain.color[1] * 255);
  const b = Math.round(grain.color[2] * 255);

  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(
    grain.x * pixelSize,
    grain.y * pixelSize,
    pixelSize - 1,
    pixelSize - 1
  );

  minX = Math.min(minX, grain.x);
  maxX = Math.max(maxX, grain.x);
  minY = Math.min(minY, grain.y);
  maxY = Math.max(maxY, grain.y);
}

console.log(`Grain bounds: x=[${minX}, ${maxX}], y=[${minY}, ${maxY}]`);

// Save to file
const outputPath = path.join(__dirname, 'test-render-output.png');
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(outputPath, buffer);

console.log(`Saved to: ${outputPath}`);
