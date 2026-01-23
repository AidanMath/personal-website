#!/usr/bin/env node

/**
 * Image to Sand Converter
 *
 * Converts an image into sand grain data for the pixel sand simulation.
 *
 * Usage:
 *   node tools/image-to-sand.js <image-path> [options]
 *
 * Options:
 *   --pixel-size <n>    Size of each sand grain in pixels (default: 3)
 *   --width <n>         Target width to scale image to (default: image width)
 *   --height <n>        Target height to scale image to (default: image height)
 *   --output <path>     Output file path (default: ./sand-grains-data.ts)
 *   --skip-alpha <n>    Skip pixels with alpha below this threshold 0-255 (default: 0, disabled)
 *   --skip-color <hex>  Skip pixels matching this color (e.g., #e8dcc8 for sky)
 *   --tolerance <n>     Color matching tolerance for skip-color (default: 30)
 *
 * Example:
 *   node tools/image-to-sand.js /tmp/great_wave.jpg --pixel-size 3 --width 400
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    imagePath: null,
    pixelSize: 3,
    width: null,
    height: null,
    output: './src/app/components/sand-background/sand-grains-data.ts',
    skipAlpha: 0,
    skipColor: null,
    tolerance: 30,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--pixel-size' && args[i + 1]) {
      options.pixelSize = parseInt(args[++i], 10);
    } else if (arg === '--width' && args[i + 1]) {
      options.width = parseInt(args[++i], 10);
    } else if (arg === '--height' && args[i + 1]) {
      options.height = parseInt(args[++i], 10);
    } else if (arg === '--output' && args[i + 1]) {
      options.output = args[++i];
    } else if (arg === '--skip-alpha' && args[i + 1]) {
      options.skipAlpha = parseInt(args[++i], 10);
    } else if (arg === '--skip-color' && args[i + 1]) {
      options.skipColor = args[++i];
    } else if (arg === '--tolerance' && args[i + 1]) {
      options.tolerance = parseInt(args[++i], 10);
    } else if (!arg.startsWith('--')) {
      options.imagePath = arg;
    }
  }

  return options;
}

// Parse hex color to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Check if two colors match within tolerance
function colorsMatch(r1, g1, b1, r2, g2, b2, tolerance) {
  return Math.abs(r1 - r2) <= tolerance &&
         Math.abs(g1 - g2) <= tolerance &&
         Math.abs(b1 - b2) <= tolerance;
}

async function processImage(options) {
  console.log(`\nProcessing image: ${options.imagePath}`);
  console.log(`Pixel size: ${options.pixelSize}`);

  // Load image metadata
  const metadata = await sharp(options.imagePath).metadata();
  console.log(`Original size: ${metadata.width}x${metadata.height}`);

  // Calculate target dimensions
  let targetWidth = options.width || metadata.width;
  let targetHeight = options.height || metadata.height;

  // If only width specified, maintain aspect ratio
  if (options.width && !options.height) {
    targetHeight = Math.round((options.width / metadata.width) * metadata.height);
  }
  // If only height specified, maintain aspect ratio
  if (options.height && !options.width) {
    targetWidth = Math.round((options.height / metadata.height) * metadata.width);
  }

  console.log(`Target size: ${targetWidth}x${targetHeight}`);

  // Calculate grid dimensions
  const cols = Math.ceil(targetWidth / options.pixelSize);
  const rows = Math.ceil(targetHeight / options.pixelSize);
  console.log(`Grid: ${cols} cols x ${rows} rows = ${cols * rows} potential grains`);

  // Resize image to match grid (one pixel per grain)
  const { data, info } = await sharp(options.imagePath)
    .resize(cols, rows, { fit: 'fill' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  console.log(`Resampled to: ${info.width}x${info.height}`);

  // Parse skip color if provided
  const skipRgb = options.skipColor ? hexToRgb(options.skipColor) : null;
  if (skipRgb) {
    console.log(`Skipping color: ${options.skipColor} (tolerance: ${options.tolerance})`);
  }

  // Extract grain data
  const grains = [];
  let skippedAlpha = 0;
  let skippedColor = 0;

  for (let row = 0; row < info.height; row++) {
    for (let col = 0; col < info.width; col++) {
      const idx = (row * info.width + col) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      // Skip transparent pixels
      if (options.skipAlpha > 0 && a < options.skipAlpha) {
        skippedAlpha++;
        continue;
      }

      // Skip matching color
      if (skipRgb && colorsMatch(r, g, b, skipRgb.r, skipRgb.g, skipRgb.b, options.tolerance)) {
        skippedColor++;
        continue;
      }

      // Convert color to normalized RGBA (0-1 range)
      grains.push({
        x: col,
        y: row,
        color: [
          Math.round((r / 255) * 1000) / 1000,
          Math.round((g / 255) * 1000) / 1000,
          Math.round((b / 255) * 1000) / 1000,
          Math.round((a / 255) * 1000) / 1000,
        ]
      });
    }
  }

  console.log(`\nResults:`);
  console.log(`  Total pixels: ${info.width * info.height}`);
  console.log(`  Skipped (alpha): ${skippedAlpha}`);
  console.log(`  Skipped (color): ${skippedColor}`);
  console.log(`  Final grains: ${grains.length}`);

  return {
    grains,
    cols: info.width,
    rows: info.height,
    pixelSize: options.pixelSize,
    targetWidth,
    targetHeight,
  };
}

function generateTypeScript(data) {
  const { grains, cols, rows, pixelSize, targetWidth, targetHeight } = data;

  // Generate optimized output - store as arrays for smaller file size
  let output = `// Auto-generated sand grain data from image
// Grid: ${cols}x${rows}, Pixel size: ${pixelSize}, Target: ${targetWidth}x${targetHeight}
// Total grains: ${grains.length}

import { RGBAColor } from './models/sand-grain.model';

export interface ImageGrainData {
  x: number;
  y: number;
  color: RGBAColor;
}

export const IMAGE_GRAIN_DATA: ImageGrainData[] = [\n`;

  // Write grains in compact format
  for (let i = 0; i < grains.length; i++) {
    const g = grains[i];
    output += `  {x:${g.x},y:${g.y},color:[${g.color.join(',')}]}`;
    if (i < grains.length - 1) output += ',';
    output += '\n';
  }

  output += `];

export const IMAGE_METADATA = {
  cols: ${cols},
  rows: ${rows},
  pixelSize: ${pixelSize},
  targetWidth: ${targetWidth},
  targetHeight: ${targetHeight},
};
`;

  return output;
}

async function main() {
  const options = parseArgs();

  if (!options.imagePath) {
    console.log(`
Image to Sand Converter

Usage:
  node tools/image-to-sand.js <image-path> [options]

Options:
  --pixel-size <n>    Size of each sand grain in pixels (default: 3)
  --width <n>         Target width to scale image to
  --height <n>        Target height to scale image to
  --output <path>     Output file path
  --skip-color <hex>  Skip pixels matching this color (e.g., #e8dcc8)
  --tolerance <n>     Color matching tolerance (default: 30)

Example:
  node tools/image-to-sand.js /tmp/great_wave.jpg --width 400 --skip-color "#e8dcc8"
`);
    process.exit(1);
  }

  if (!fs.existsSync(options.imagePath)) {
    console.error(`Error: Image not found: ${options.imagePath}`);
    process.exit(1);
  }

  try {
    const data = await processImage(options);
    const typescript = generateTypeScript(data);

    // Ensure output directory exists
    const outputDir = path.dirname(options.output);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(options.output, typescript);
    console.log(`\nOutput written to: ${options.output}`);
    console.log(`File size: ${(fs.statSync(options.output).size / 1024).toFixed(1)} KB`);

  } catch (error) {
    console.error('Error processing image:', error.message);
    process.exit(1);
  }
}

main();
