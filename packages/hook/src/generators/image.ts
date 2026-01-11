/**
 * Image Generator
 * Uses Google Gemini API to generate pixel art battle scenes
 */

import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { IMAGE_STYLE_PROMPT, STYLE_CONSISTENCY_PROMPT } from '@jrpg-visualizer/core';

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
        inlineData?: {
          mimeType: string;
          data: string;
        };
      }>;
    };
  }>;
  error?: {
    message: string;
    code: number;
  };
}

interface ContentPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export class ImageGenerator {
  private apiKey: string;
  private model: string = 'gemini-3-pro-image-preview';
  private outputDir: string;

  constructor(apiKey: string, outputDir: string) {
    this.apiKey = apiKey;
    this.outputDir = outputDir;

    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
  }

  /**
   * Generate a battle image with optional style reference images
   */
  async generateBattleImage(
    description: string,
    anchorImagePath: string | null,
    previousImagePath: string | null
  ): Promise<string | null> {
    try {
      const parts: ContentPart[] = [];

      // Build the prompt
      let prompt = `${IMAGE_STYLE_PROMPT}\n\nSCENE TO GENERATE:\n${description}`;

      // Add style consistency instructions if we have reference images
      if (anchorImagePath || previousImagePath) {
        prompt = `${prompt}\n\n${STYLE_CONSISTENCY_PROMPT}`;
      }

      parts.push({ text: prompt });

      // Add anchor image for style reference (if available)
      if (anchorImagePath && existsSync(anchorImagePath)) {
        const anchorData = this.loadImageAsBase64(anchorImagePath);
        if (anchorData) {
          parts.push({
            inlineData: {
              mimeType: 'image/png',
              data: anchorData,
            },
          });
        }
      }

      // Add previous image for scene continuity (if different from anchor)
      if (
        previousImagePath &&
        previousImagePath !== anchorImagePath &&
        existsSync(previousImagePath)
      ) {
        const previousData = this.loadImageAsBase64(previousImagePath);
        if (previousData) {
          parts.push({
            inlineData: {
              mimeType: 'image/png',
              data: previousData,
            },
          });
        }
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts,
            },
          ],
          generationConfig: {
            responseModalities: ['image', 'text'],
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Gemini API error: ${response.status} - ${errorText}`);
        return null;
      }

      const data: GeminiResponse = await response.json();

      if (data.error) {
        console.error(`Gemini API error: ${data.error.message}`);
        return null;
      }

      // Extract image from response
      const candidates = data.candidates ?? [];
      for (const candidate of candidates) {
        const parts = candidate.content?.parts ?? [];
        for (const part of parts) {
          if (part.inlineData?.mimeType?.startsWith('image/')) {
            return this.saveImage(part.inlineData.data, part.inlineData.mimeType);
          }
        }
      }

      console.error('No image in Gemini response');
      return null;
    } catch (error) {
      console.error('Failed to generate image:', error);
      return null;
    }
  }

  /**
   * Load an image file and return as base64
   */
  private loadImageAsBase64(imagePath: string): string | null {
    try {
      const buffer = readFileSync(imagePath);
      return buffer.toString('base64');
    } catch (error) {
      console.error(`Failed to load image: ${imagePath}`, error);
      return null;
    }
  }

  /**
   * Save base64 image data to a file
   */
  private saveImage(base64Data: string, mimeType: string): string {
    const extension = mimeType.split('/')[1] || 'png';
    const filename = `battle_${Date.now()}.${extension}`;
    const filepath = join(this.outputDir, filename);

    const buffer = Buffer.from(base64Data, 'base64');
    writeFileSync(filepath, buffer);

    return filepath;
  }
}
