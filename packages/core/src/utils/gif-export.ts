/**
 * GIF export utility for creating animated GIFs from session images
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const gifenc = require('gifenc');
const { GIFEncoder, quantize, applyPalette } = gifenc;
import sharp from 'sharp';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import type { GifExportOptions, GifExportResult } from '../types/export.js';

const DEFAULT_DURATION_MS = 60000; // 60 seconds
const DEFAULT_MAX_WIDTH = 800;

/**
 * Generate a GIF from an array of image paths
 * @param imagePaths Array of absolute paths to images
 * @param options GIF export options
 * @returns GIF export result with buffer
 */
export async function generateGif(
  imagePaths: string[],
  options: GifExportOptions = {}
): Promise<GifExportResult> {
  const { totalDurationMs = DEFAULT_DURATION_MS, maxWidth = DEFAULT_MAX_WIDTH } = options;

  // Filter to existing images
  const validPaths = imagePaths.filter((p) => existsSync(p));

  if (validPaths.length === 0) {
    return {
      success: false,
      frameCount: 0,
      error: 'No valid images found for session',
    };
  }

  // Calculate frame delay (in centiseconds for GIF format)
  const frameDelayMs = totalDurationMs / validPaths.length;
  const frameDelayCentiseconds = Math.max(1, Math.round(frameDelayMs / 10));

  try {
    // Get dimensions from first image
    const firstImageMeta = await sharp(validPaths[0]).metadata();
    const aspectRatio = (firstImageMeta.height || 1) / (firstImageMeta.width || 1);
    const width = Math.min(firstImageMeta.width || maxWidth, maxWidth);
    const height = Math.round(width * aspectRatio);

    // Create GIF encoder
    const gif = GIFEncoder();

    // Process each frame
    for (const imagePath of validPaths) {
      // Load and resize image to RGBA
      const { data } = await sharp(imagePath)
        .resize(width, height, { fit: 'fill' })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Convert to Uint8Array for gifenc
      const rgba = new Uint8Array(data);

      // Quantize to 256 colors for GIF
      const palette = quantize(rgba, 256);
      const indexed = applyPalette(rgba, palette);

      // Write frame
      gif.writeFrame(indexed, width, height, {
        palette,
        delay: frameDelayCentiseconds,
      });
    }

    gif.finish();

    return {
      success: true,
      buffer: Buffer.from(gif.bytes()),
      frameCount: validPaths.length,
      frameDurationMs: frameDelayMs,
    };
  } catch (error) {
    return {
      success: false,
      frameCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error during GIF generation',
    };
  }
}

/**
 * Generate a GIF and save it to a file
 * @param imagePaths Array of absolute paths to images
 * @param outputPath Path where the GIF should be saved
 * @param options GIF export options
 * @returns GIF export result with file path
 */
export async function exportGifToFile(
  imagePaths: string[],
  outputPath: string,
  options: GifExportOptions = {}
): Promise<GifExportResult> {
  const result = await generateGif(imagePaths, options);

  if (result.success && result.buffer) {
    // Ensure output directory exists
    const outputDir = dirname(outputPath);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    writeFileSync(outputPath, result.buffer);
    result.filePath = outputPath;
  }

  return result;
}
