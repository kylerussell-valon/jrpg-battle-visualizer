/**
 * JRPG Constants - Enemy Mappings, Classes, Abilities
 */

import type { JRPGClass, Element, Ability, PartyMember } from '../types/battle.js';

/**
 * Map task keywords to enemy names
 */
export const ENEMY_MAPPINGS: Array<{ keywords: string[]; name: string; weakness: Element }> = [
  { keywords: ['bug', 'fix', 'error', 'issue'], name: 'Glitch Fiend', weakness: 'DEBUG' },
  { keywords: ['test', 'spec', 'coverage'], name: 'Test Golem', weakness: 'ASSERT' },
  { keywords: ['refactor', 'clean', 'reorganize'], name: 'Code Hydra', weakness: 'PATTERN' },
  { keywords: ['implement', 'add', 'create', 'build'], name: 'Feature Dragon', weakness: 'ARCHITECTURE' },
  { keywords: ['update', 'upgrade', 'migrate'], name: 'Version Specter', weakness: 'LOGIC' },
  { keywords: ['delete', 'remove', 'deprecate'], name: 'Legacy Wraith', weakness: 'REFACTOR' },
  { keywords: ['review', 'audit', 'check'], name: 'Review Sentinel', weakness: 'LOGIC' },
  { keywords: ['deploy', 'release', 'ship'], name: 'Deploy Titan', weakness: 'ASSERT' },
  { keywords: ['document', 'readme', 'comment'], name: 'Doc Specter', weakness: 'SYNTAX' },
  { keywords: ['optimize', 'performance', 'speed'], name: 'Lag Beast', weakness: 'PATTERN' },
  { keywords: ['security', 'auth', 'permission'], name: 'Shadow Guardian', weakness: 'LOGIC' },
  { keywords: ['api', 'endpoint', 'route'], name: 'Gateway Wyrm', weakness: 'ARCHITECTURE' },
  { keywords: ['database', 'query', 'schema'], name: 'Data Elemental', weakness: 'SYNTAX' },
  { keywords: ['ui', 'component', 'style', 'css'], name: 'Pixel Phantom', weakness: 'PATTERN' },
];

/**
 * Default enemy for unmatched tasks
 */
export const DEFAULT_ENEMY = {
  name: 'Code Elemental',
  weakness: 'LOGIC' as Element,
};

/**
 * Class abilities for party members
 */
export const CLASS_ABILITIES: Record<JRPGClass, Ability[]> = {
  Sage: [
    { name: 'Analyze', mpCost: 10, damage: 0, element: 'LOGIC', description: 'Reveal enemy weakness' },
    { name: 'Refactor Storm', mpCost: 50, damage: 300, element: 'REFACTOR', description: 'Massive restructuring damage' },
    { name: 'Debug Ray', mpCost: 30, damage: 200, element: 'DEBUG', description: 'Purifying light attack' },
  ],
  Architect: [
    { name: 'Blueprint Strike', mpCost: 25, damage: 150, element: 'ARCHITECTURE', description: 'Structured attack' },
    { name: 'Foundation Slam', mpCost: 40, damage: 250, element: 'PATTERN', description: 'Pattern-based assault' },
  ],
  Debugger: [
    { name: 'Breakpoint', mpCost: 15, damage: 100, element: 'DEBUG', description: 'Stop enemy in tracks' },
    { name: 'Stack Trace', mpCost: 35, damage: 200, element: 'DEBUG', description: 'Trace and destroy' },
  ],
  Scribe: [
    { name: 'Document Slash', mpCost: 20, damage: 120, element: 'SYNTAX', description: 'Well-documented attack' },
    { name: 'README Blast', mpCost: 30, damage: 180, element: 'SYNTAX', description: 'Comprehensive damage' },
  ],
  Artificer: [
    { name: 'Feature Forge', mpCost: 30, damage: 180, element: 'ARCHITECTURE', description: 'Craft new attack' },
    { name: 'Implementation Ray', mpCost: 45, damage: 280, element: 'LOGIC', description: 'Execute implementation' },
  ],
  Guardian: [
    { name: 'Assert Shield', mpCost: 20, damage: 80, element: 'ASSERT', description: 'Defensive assertion' },
    { name: 'Test Barrage', mpCost: 35, damage: 220, element: 'ASSERT', description: 'Multi-test attack' },
  ],
  Chronomancer: [
    { name: 'Commit Strike', mpCost: 25, damage: 160, element: 'LOGIC', description: 'Save state attack' },
    { name: 'Revert', mpCost: 40, damage: 0, element: 'REFACTOR', description: 'Undo enemy action' },
  ],
};

/**
 * Default party composition
 */
export const DEFAULT_PARTY: Omit<PartyMember, 'id'>[] = [
  {
    name: 'Claude',
    class: 'Sage',
    maxHp: 999,
    currentHp: 999,
    maxMp: 500,
    currentMp: 500,
    level: 50,
    experience: 0,
    abilities: CLASS_ABILITIES.Sage,
  },
  {
    name: 'TypeScript',
    class: 'Guardian',
    maxHp: 800,
    currentHp: 800,
    maxMp: 200,
    currentMp: 200,
    level: 45,
    experience: 0,
    abilities: CLASS_ABILITIES.Guardian,
  },
  {
    name: 'Git',
    class: 'Chronomancer',
    maxHp: 600,
    currentHp: 600,
    maxMp: 300,
    currentMp: 300,
    level: 40,
    experience: 0,
    abilities: CLASS_ABILITIES.Chronomancer,
  },
];

/**
 * Calculate enemy HP based on task complexity
 */
export function calculateEnemyHp(taskContent: string): number {
  const wordCount = taskContent.split(/\s+/).length;
  const baseHp = 100;
  const complexityMultiplier = Math.min(wordCount * 15, 300);
  return baseHp + complexityMultiplier;
}

/**
 * Get enemy info from task content
 */
export function getEnemyFromTask(taskContent: string): { name: string; weakness: Element } {
  const lowerContent = taskContent.toLowerCase();

  for (const mapping of ENEMY_MAPPINGS) {
    if (mapping.keywords.some((keyword) => lowerContent.includes(keyword))) {
      return { name: mapping.name, weakness: mapping.weakness };
    }
  }

  return DEFAULT_ENEMY;
}
