/**
 * Seed Party Script
 * Initializes the default party members in the database
 */

import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';
import { config as loadEnv } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// Load environment
loadEnv({ path: join(projectRoot, '.env') });

const dataDir = join(projectRoot, 'data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DATABASE_PATH || join(dataDir, 'battles.db');
const db = new Database(dbPath);

// Create tables if they don't exist
db.exec(`
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
  )
`);

// Clear existing party
db.exec('DELETE FROM party_members');

// Default party
const partyMembers = [
  {
    name: 'Claude',
    class: 'Sage',
    max_hp: 999,
    current_hp: 999,
    max_mp: 500,
    current_mp: 500,
    level: 50,
    experience: 0,
  },
  {
    name: 'TypeScript',
    class: 'Guardian',
    max_hp: 800,
    current_hp: 800,
    max_mp: 200,
    current_mp: 200,
    level: 45,
    experience: 0,
  },
  {
    name: 'Git',
    class: 'Chronomancer',
    max_hp: 600,
    current_hp: 600,
    max_mp: 300,
    current_mp: 300,
    level: 40,
    experience: 0,
  },
];

const insert = db.prepare(`
  INSERT INTO party_members (name, class, max_hp, current_hp, max_mp, current_mp, level, experience)
  VALUES (@name, @class, @max_hp, @current_hp, @max_mp, @current_mp, @level, @experience)
`);

for (const member of partyMembers) {
  insert.run({
    name: member.name,
    class: member.class,
    max_hp: member.max_hp,
    current_hp: member.current_hp,
    max_mp: member.max_mp,
    current_mp: member.current_mp,
    level: member.level,
    experience: member.experience,
  });
}

console.log('Party initialized successfully!');
console.log('Members:');
for (const member of partyMembers) {
  console.log(`  - ${member.name} (${member.class}) Lv.${member.level}`);
}

db.close();
