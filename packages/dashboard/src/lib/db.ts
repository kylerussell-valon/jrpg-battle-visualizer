import Database from 'better-sqlite3';
import { join } from 'path';
import type { BattleState, BattleEvent, PartyMember } from '@jrpg-visualizer/core';

// Database path - resolve from project root
const projectRoot = process.cwd().includes('packages/dashboard')
  ? join(process.cwd(), '..', '..')
  : process.cwd();

const dbPath = process.env.DATABASE_PATH || join(projectRoot, 'data', 'battles.db');

// Database singleton
let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    db = new Database(dbPath);
    initializeSchema(db);
  }
  return db;
}

function initializeSchema(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS battle_state (
      session_id TEXT PRIMARY KEY,
      state_json TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS battle_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      task_content TEXT,
      description TEXT,
      image_path TEXT,
      damage_dealt INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS party_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      class TEXT NOT NULL,
      max_hp INTEGER NOT NULL,
      current_hp INTEGER NOT NULL,
      max_mp INTEGER NOT NULL,
      current_mp INTEGER NOT NULL,
      level INTEGER DEFAULT 1,
      experience INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_events_session ON battle_events(session_id);
    CREATE INDEX IF NOT EXISTS idx_events_created ON battle_events(created_at);
  `);
}

export function getLatestBattleState(): BattleState | null {
  const database = getDatabase();
  const row = database
    .prepare('SELECT state_json FROM battle_state ORDER BY updated_at DESC LIMIT 1')
    .get() as { state_json: string } | undefined;

  return row ? JSON.parse(row.state_json) : null;
}

export function getRecentEvents(limit: number = 50): BattleEvent[] {
  const database = getDatabase();
  const rows = database
    .prepare(`
      SELECT id, session_id, event_type, task_content, description, image_path, damage_dealt, created_at
      FROM battle_events
      ORDER BY created_at DESC
      LIMIT ?
    `)
    .all(limit) as Array<{
      id: number;
      session_id: string;
      event_type: string;
      task_content: string;
      description: string;
      image_path: string | null;
      damage_dealt: number;
      created_at: number;
    }>;

  return rows
    .map((row) => ({
      id: row.id,
      sessionId: row.session_id,
      eventType: row.event_type as BattleEvent['eventType'],
      taskContent: row.task_content,
      description: row.description,
      imagePath: row.image_path,
      damageDealt: row.damage_dealt,
      createdAt: row.created_at,
    }))
    .reverse(); // Return in chronological order
}

export function getPartyMembers(): PartyMember[] {
  const database = getDatabase();
  const rows = database.prepare('SELECT * FROM party_members').all() as Array<{
    id: number;
    name: string;
    class: string;
    max_hp: number;
    current_hp: number;
    max_mp: number;
    current_mp: number;
    level: number;
    experience: number;
  }>;

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    class: row.class as PartyMember['class'],
    maxHp: row.max_hp,
    currentHp: row.current_hp,
    maxMp: row.max_mp,
    currentMp: row.current_mp,
    level: row.level,
    experience: row.experience,
  }));
}

/**
 * Get all image paths for a specific session in chronological order
 */
export function getSessionImages(sessionId: string): string[] {
  const database = getDatabase();
  const rows = database
    .prepare(
      `
      SELECT image_path FROM battle_events
      WHERE session_id = ? AND image_path IS NOT NULL
      ORDER BY created_at ASC
    `
    )
    .all(sessionId) as Array<{ image_path: string }>;

  return rows.map((row) => row.image_path);
}

/**
 * Get the current/most recent session ID
 */
export function getCurrentSessionId(): string | null {
  const database = getDatabase();
  const row = database
    .prepare(
      `
      SELECT session_id FROM battle_state
      ORDER BY updated_at DESC
      LIMIT 1
    `
    )
    .get() as { session_id: string } | undefined;

  return row?.session_id ?? null;
}

/**
 * Get all available session IDs with their image counts
 */
export function getAvailableSessions(): Array<{
  sessionId: string;
  imageCount: number;
  firstEventAt: number;
  lastEventAt: number;
}> {
  const database = getDatabase();
  const rows = database
    .prepare(
      `
      SELECT
        session_id,
        COUNT(CASE WHEN image_path IS NOT NULL THEN 1 END) as image_count,
        MIN(created_at) as first_event_at,
        MAX(created_at) as last_event_at
      FROM battle_events
      GROUP BY session_id
      HAVING image_count > 0
      ORDER BY last_event_at DESC
    `
    )
    .all() as Array<{
    session_id: string;
    image_count: number;
    first_event_at: number;
    last_event_at: number;
  }>;

  return rows.map((row) => ({
    sessionId: row.session_id,
    imageCount: row.image_count,
    firstEventAt: row.first_event_at,
    lastEventAt: row.last_event_at,
  }));
}
