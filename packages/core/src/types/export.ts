/**
 * Types for GIF export functionality
 */

export interface GifExportOptions {
  sessionId?: string;
  totalDurationMs?: number; // Default: 30000 (30 seconds)
  maxWidth?: number; // Default: 800
  quality?: number; // 1-30, lower = better quality
}

export interface GifExportResult {
  success: boolean;
  buffer?: Buffer;
  filePath?: string;
  frameCount: number;
  frameDurationMs?: number;
  error?: string;
}

export interface SessionImageInfo {
  sessionId: string;
  imagePaths: string[];
  imageCount: number;
}
