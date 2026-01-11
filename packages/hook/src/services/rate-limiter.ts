/**
 * Rate Limiter
 * Prevents excessive API calls by enforcing minimum intervals
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const RATE_LIMIT_FILE = join(tmpdir(), 'jrpg-visualizer-rate-limit.json');
const MIN_INTERVAL_MS = 5000; // 5 seconds between image generations

interface RateLimitState {
  lastGeneration: number;
}

/**
 * Check if enough time has passed to generate a new image
 */
export function shouldGenerateImage(): boolean {
  try {
    if (existsSync(RATE_LIMIT_FILE)) {
      const content = readFileSync(RATE_LIMIT_FILE, 'utf-8');
      const state: RateLimitState = JSON.parse(content);
      const elapsed = Date.now() - state.lastGeneration;

      if (elapsed < MIN_INTERVAL_MS) {
        if (process.env.DEBUG) {
          console.log(`Rate limited: ${MIN_INTERVAL_MS - elapsed}ms remaining`);
        }
        return false;
      }
    }

    // Update last generation time
    const newState: RateLimitState = { lastGeneration: Date.now() };
    writeFileSync(RATE_LIMIT_FILE, JSON.stringify(newState), 'utf-8');

    return true;
  } catch (error) {
    // On error, allow generation (fail open)
    if (process.env.DEBUG) {
      console.error('Rate limit check failed:', error);
    }
    return true;
  }
}

/**
 * Reset the rate limiter (useful for testing)
 */
export function resetRateLimit(): void {
  try {
    if (existsSync(RATE_LIMIT_FILE)) {
      writeFileSync(RATE_LIMIT_FILE, JSON.stringify({ lastGeneration: 0 }), 'utf-8');
    }
  } catch {
    // Ignore errors
  }
}

/**
 * Get time until next generation is allowed (in ms)
 */
export function getTimeUntilNextGeneration(): number {
  try {
    if (existsSync(RATE_LIMIT_FILE)) {
      const content = readFileSync(RATE_LIMIT_FILE, 'utf-8');
      const state: RateLimitState = JSON.parse(content);
      const elapsed = Date.now() - state.lastGeneration;
      const remaining = MIN_INTERVAL_MS - elapsed;
      return Math.max(0, remaining);
    }
  } catch {
    // Ignore errors
  }
  return 0;
}
