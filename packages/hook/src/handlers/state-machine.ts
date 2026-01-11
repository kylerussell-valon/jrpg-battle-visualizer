/**
 * Battle State Machine
 * Detects todo state transitions and manages battle state persistence
 */

import Database from 'better-sqlite3';
import type {
  TodoItem,
  BattleState,
  StateTransition,
  TransitionType,
  BattleEvent,
  PartyMember,
} from '@jrpg-visualizer/core';
import {
  createBattleState,
  createVictoryState,
  createRetreatState,
  DEFAULT_PARTY,
} from '@jrpg-visualizer/core';

export class BattleStateMachine {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.initializeSchema();
  }

  private initializeSchema(): void {
    this.db.exec(`
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

      CREATE TABLE IF NOT EXISTS previous_todos (
        session_id TEXT PRIMARY KEY,
        todos_json TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS session_anchors (
        session_id TEXT PRIMARY KEY,
        anchor_path TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_events_session ON battle_events(session_id);
      CREATE INDEX IF NOT EXISTS idx_events_created ON battle_events(created_at);
    `);

    // Initialize party if empty
    const partyCount = this.db.prepare('SELECT COUNT(*) as count FROM party_members').get() as { count: number };
    if (partyCount.count === 0) {
      this.initializeParty();
    }
  }

  private initializeParty(): void {
    const insert = this.db.prepare(`
      INSERT INTO party_members (name, class, max_hp, current_hp, max_mp, current_mp, level, experience)
      VALUES (@name, @class, @maxHp, @currentHp, @maxMp, @currentMp, @level, @experience)
    `);

    for (const member of DEFAULT_PARTY) {
      insert.run({
        name: member.name,
        class: member.class,
        maxHp: member.maxHp,
        currentHp: member.currentHp,
        maxMp: member.maxMp,
        currentMp: member.currentMp,
        level: member.level,
        experience: member.experience,
      });
    }
  }

  /**
   * Get party members from database
   */
  getPartyMembers(): PartyMember[] {
    const rows = this.db.prepare('SELECT * FROM party_members').all() as any[];
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      class: row.class,
      maxHp: row.max_hp,
      currentHp: row.current_hp,
      maxMp: row.max_mp,
      currentMp: row.current_mp,
      level: row.level,
      experience: row.experience,
    }));
  }

  /**
   * Get previous todos for a session
   */
  getPreviousTodos(sessionId: string): TodoItem[] {
    const row = this.db.prepare(
      'SELECT todos_json FROM previous_todos WHERE session_id = ?'
    ).get(sessionId) as { todos_json: string } | undefined;

    return row ? JSON.parse(row.todos_json) : [];
  }

  /**
   * Save current todos for comparison next time
   */
  saveTodos(sessionId: string, todos: TodoItem[]): void {
    this.db.prepare(`
      INSERT OR REPLACE INTO previous_todos (session_id, todos_json, updated_at)
      VALUES (?, ?, ?)
    `).run(sessionId, JSON.stringify(todos), Date.now());
  }

  /**
   * Get current battle state for a session
   */
  getCurrentState(sessionId: string): BattleState | null {
    const row = this.db.prepare(
      'SELECT state_json FROM battle_state WHERE session_id = ?'
    ).get(sessionId) as { state_json: string } | undefined;

    return row ? JSON.parse(row.state_json) : null;
  }

  /**
   * Save battle state
   */
  saveState(state: BattleState): void {
    this.db.prepare(`
      INSERT OR REPLACE INTO battle_state (session_id, state_json, updated_at)
      VALUES (?, ?, ?)
    `).run(state.sessionId, JSON.stringify(state), Date.now());
  }

  /**
   * Save a battle event
   */
  saveEvent(event: Omit<BattleEvent, 'id'>): number {
    const result = this.db.prepare(`
      INSERT INTO battle_events (session_id, event_type, task_content, description, image_path, damage_dealt, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      event.sessionId,
      event.eventType,
      event.taskContent,
      event.description,
      event.imagePath,
      event.damageDealt,
      event.createdAt
    );

    return result.lastInsertRowid as number;
  }

  /**
   * Get session style anchor image path
   */
  getSessionAnchor(sessionId: string): string | null {
    const row = this.db.prepare(
      'SELECT anchor_path FROM session_anchors WHERE session_id = ?'
    ).get(sessionId) as { anchor_path: string } | undefined;

    return row?.anchor_path ?? null;
  }

  /**
   * Save session style anchor
   */
  saveSessionAnchor(sessionId: string, anchorPath: string): void {
    this.db.prepare(`
      INSERT OR REPLACE INTO session_anchors (session_id, anchor_path, created_at)
      VALUES (?, ?, ?)
    `).run(sessionId, anchorPath, Date.now());
  }

  /**
   * Get most recent image for a session
   */
  getMostRecentImage(sessionId: string): string | null {
    const row = this.db.prepare(`
      SELECT image_path FROM battle_events
      WHERE session_id = ? AND image_path IS NOT NULL
      ORDER BY created_at DESC LIMIT 1
    `).get(sessionId) as { image_path: string } | undefined;

    return row?.image_path ?? null;
  }

  /**
   * Detect state transition from todo changes
   */
  detectTransition(
    previousTodos: TodoItem[],
    currentTodos: TodoItem[],
    sessionId: string
  ): StateTransition | null {
    const party = this.getPartyMembers();

    // Find tasks that changed from pending to in_progress (BATTLE_START)
    for (const current of currentTodos) {
      const previous = previousTodos.find((t) => t.content === current.content);

      // New task started directly as in_progress
      if (!previous && current.status === 'in_progress') {
        const newState = createBattleState(current, sessionId, party);
        this.saveState(newState);
        return {
          type: 'BATTLE_START',
          task: current,
          newState,
        };
      }

      // Task transitioned from pending to in_progress
      if (previous?.status === 'pending' && current.status === 'in_progress') {
        const newState = createBattleState(current, sessionId, party);
        this.saveState(newState);
        return {
          type: 'BATTLE_START',
          task: current,
          previousState: this.getCurrentState(sessionId) ?? undefined,
          newState,
        };
      }

      // Task transitioned from in_progress to completed (VICTORY)
      if (previous?.status === 'in_progress' && current.status === 'completed') {
        const previousState = this.getCurrentState(sessionId);
        if (previousState) {
          const newState = createVictoryState(previousState, current);
          this.saveState(newState);
          return {
            type: 'VICTORY',
            task: current,
            previousState,
            newState,
          };
        }
      }
    }

    // Check for removed in_progress tasks (RETREAT)
    for (const previous of previousTodos) {
      if (previous.status === 'in_progress') {
        const stillExists = currentTodos.find((t) => t.content === previous.content);
        if (!stillExists) {
          const newState = createRetreatState(sessionId);
          this.saveState(newState);
          return {
            type: 'RETREAT',
            task: previous,
            previousState: this.getCurrentState(sessionId) ?? undefined,
            newState,
          };
        }
      }
    }

    return null;
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }
}
