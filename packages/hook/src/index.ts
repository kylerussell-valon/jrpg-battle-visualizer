/**
 * JRPG Battle Visualizer - Claude Code Hook
 *
 * This script is triggered by Claude Code's PostToolUse hook on TodoWrite calls.
 * It detects todo state transitions and generates JRPG battle visualizations.
 */

import { readFileSync, existsSync, mkdirSync, appendFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config as loadEnv } from 'dotenv';
import type { HookPayload, TodoWriteInput, HookOutput } from '@jrpg-visualizer/core';
import { handleTodoWrite } from './handlers/todo-write.js';

// Debug: Log that hook was triggered
const hookLog = '/tmp/jrpg-hook-debug.log';
appendFileSync(hookLog, `\n--- Hook triggered at ${new Date().toISOString()} ---\n`);

// Load environment variables
const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..', '..', '..');

// Try to load .env from project root
loadEnv({ path: join(projectRoot, '.env') });

/**
 * Output hook result to stdout (required by Claude Code)
 */
function outputResult(result: HookOutput): void {
  console.log(JSON.stringify(result));
}

/**
 * Get configuration from environment variables
 */
function getConfig() {
  const dataDir = process.env.DATABASE_PATH
    ? dirname(process.env.DATABASE_PATH)
    : join(projectRoot, 'data');

  // Ensure data directory exists
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  const imagesDir = process.env.IMAGES_DIR || join(dataDir, 'images');
  if (!existsSync(imagesDir)) {
    mkdirSync(imagesDir, { recursive: true });
  }

  return {
    dbPath: process.env.DATABASE_PATH || join(dataDir, 'battles.db'),
    imagesDir,
    dashboardUrl: process.env.DASHBOARD_URL || 'http://localhost:3000',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
  };
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  try {
    // Read JSON from stdin (Claude Code passes hook data this way)
    const input = readFileSync(0, 'utf-8');

    if (!input.trim()) {
      // No input, exit cleanly
      outputResult({ continue: true });
      return;
    }

    const payload: HookPayload = JSON.parse(input);

    // Only process TodoWrite tool calls
    if (payload.tool_name !== 'TodoWrite') {
      outputResult({ continue: true });
      return;
    }

    const todoInput = payload.tool_input as TodoWriteInput;

    // Validate todo input
    if (!todoInput?.todos || !Array.isArray(todoInput.todos)) {
      outputResult({ continue: true });
      return;
    }

    const config = getConfig();

    // Check for required API keys
    if (!config.anthropicApiKey) {
      if (process.env.DEBUG) {
        console.error('ANTHROPIC_API_KEY not set');
      }
      outputResult({ continue: true });
      return;
    }

    if (!config.geminiApiKey) {
      if (process.env.DEBUG) {
        console.error('GEMINI_API_KEY not set');
      }
      outputResult({ continue: true });
      return;
    }

    // Handle the TodoWrite event
    const result = await handleTodoWrite(payload, todoInput, config);

    if (process.env.DEBUG && result.transition) {
      console.error(`Battle event: ${result.transition.type}`);
      if (result.imagePath) {
        console.error(`Image saved: ${result.imagePath}`);
      }
    }

    // Always return success to not block Claude Code
    outputResult({ continue: true });
  } catch (error) {
    // Log error but don't fail the hook
    if (process.env.DEBUG) {
      console.error('Hook error:', error);
    }

    // Always return success to not block Claude Code
    outputResult({ continue: true });
  }
}

// Run
main().catch((error) => {
  console.error('Fatal error:', error);
  // Still output success to not block Claude Code
  outputResult({ continue: true });
  process.exit(0);
});
