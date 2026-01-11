#!/usr/bin/env tsx
/**
 * CLI tool to export session images as GIF
 *
 * Usage:
 *   pnpm export-gif <session-id>
 *   pnpm export-gif --list
 *   pnpm export-gif --latest
 */

import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const projectRoot = process.cwd();
const dbPath = join(projectRoot, 'data', 'battles.db');
const exportsDir = join(projectRoot, 'data', 'exports');

function getDatabase() {
  if (!existsSync(dbPath)) {
    console.error('Error: Database not found at', dbPath);
    console.error('Make sure you have run at least one battle session first.');
    process.exit(1);
  }
  return new Database(dbPath);
}

function listSessions() {
  const db = getDatabase();
  const rows = db
    .prepare(
      `
    SELECT
      session_id,
      COUNT(CASE WHEN image_path IS NOT NULL THEN 1 END) as image_count,
      MIN(created_at) as first_event,
      MAX(created_at) as last_event
    FROM battle_events
    GROUP BY session_id
    HAVING image_count > 0
    ORDER BY last_event DESC
  `
    )
    .all() as Array<{
    session_id: string;
    image_count: number;
    first_event: number;
    last_event: number;
  }>;

  if (rows.length === 0) {
    console.log('\nNo sessions with images found.');
    console.log('Start a battle session first by using Claude Code with the hook installed.');
    db.close();
    return;
  }

  console.log('\nAvailable Sessions:\n');
  console.log('Session ID'.padEnd(40) + 'Images'.padEnd(10) + 'Last Activity');
  console.log('-'.repeat(70));

  for (const row of rows) {
    const date = new Date(row.last_event).toLocaleString();
    console.log(row.session_id.padEnd(40) + row.image_count.toString().padEnd(10) + date);
  }

  console.log('\nTo export a session, run:');
  console.log('  pnpm export-gif <session-id>');
  console.log('  pnpm export-gif --latest\n');

  db.close();
}

function getLatestSessionId(): string | null {
  const db = getDatabase();
  const row = db
    .prepare(
      `
    SELECT session_id FROM battle_state
    ORDER BY updated_at DESC LIMIT 1
  `
    )
    .get() as { session_id: string } | undefined;
  db.close();
  return row?.session_id ?? null;
}

function getSessionImages(sessionId: string): string[] {
  const db = getDatabase();
  const rows = db
    .prepare(
      `
    SELECT image_path FROM battle_events
    WHERE session_id = ? AND image_path IS NOT NULL
    ORDER BY created_at ASC
  `
    )
    .all(sessionId) as Array<{ image_path: string }>;
  db.close();
  return rows.map((r) => r.image_path);
}

async function exportSession(sessionId: string) {
  console.log(`\nExporting session: ${sessionId}`);

  const imagePaths = getSessionImages(sessionId);

  if (imagePaths.length === 0) {
    console.error('Error: No images found for this session');
    process.exit(1);
  }

  console.log(`Found ${imagePaths.length} images`);
  console.log(`Frame duration: ${Math.round(60000 / imagePaths.length)}ms`);

  // Ensure exports directory exists
  if (!existsSync(exportsDir)) {
    mkdirSync(exportsDir, { recursive: true });
  }

  const outputPath = join(exportsDir, `battle_${sessionId}_${Date.now()}.gif`);

  console.log('\nGenerating GIF...');

  // Dynamic import from built package
  const { exportGifToFile } = await import('../packages/core/dist/index.js');

  const result = await exportGifToFile(imagePaths, outputPath, {
    sessionId,
    totalDurationMs: 60000,
    maxWidth: 800,
  });

  if (result.success) {
    console.log(`\n  GIF exported successfully!`);
    console.log(`  Frames: ${result.frameCount}`);
    console.log(`  Duration: 60 seconds`);
    console.log(`  Frame delay: ${result.frameDurationMs?.toFixed(0)}ms`);
    console.log(`  Output: ${result.filePath}\n`);
  } else {
    console.error(`\n  Export failed: ${result.error}`);
    process.exit(1);
  }
}

// Main
const args = process.argv.slice(2);

if (args.includes('--list') || args.includes('-l')) {
  listSessions();
} else if (args.includes('--latest')) {
  const sessionId = getLatestSessionId();
  if (sessionId) {
    exportSession(sessionId);
  } else {
    console.error('Error: No sessions found');
    process.exit(1);
  }
} else if (args.length > 0 && !args[0].startsWith('-')) {
  exportSession(args[0]);
} else {
  console.log(`
JRPG Battle Visualizer - GIF Export Tool

Usage:
  pnpm export-gif <session-id>   Export a specific session
  pnpm export-gif --latest       Export the most recent session
  pnpm export-gif --list         List all available sessions

Output:
  GIFs are saved to ./data/exports/
  Duration: 30 seconds total
  `);
}
