/**
 * Battle State Utility Functions
 */

import type { BattleState, PartyMember, Enemy, TodoItem } from '../types/battle.js';
import { getEnemyFromTask, calculateEnemyHp, DEFAULT_PARTY } from '../constants/jrpg.js';

/**
 * Create initial battle state when a new battle starts
 */
export function createBattleState(
  task: TodoItem,
  sessionId: string,
  party?: PartyMember[]
): BattleState {
  const enemyInfo = getEnemyFromTask(task.content);

  const enemy: Enemy = {
    name: enemyInfo.name,
    description: task.content,
    maxHp: calculateEnemyHp(task.content),
    currentHp: calculateEnemyHp(task.content),
    weakness: enemyInfo.weakness,
  };

  return {
    sessionId,
    inBattle: true,
    currentEnemy: enemy,
    party: party || DEFAULT_PARTY.map((p, i) => ({ ...p, id: i + 1 })),
    turnCount: 1,
    battleStartedAt: Date.now(),
    totalDamageDealt: 0,
    abilitiesUsed: [],
  };
}

/**
 * Create victory state when battle is won
 */
export function createVictoryState(
  previousState: BattleState,
  task: TodoItem
): BattleState {
  return {
    ...previousState,
    inBattle: false,
    currentEnemy: previousState.currentEnemy
      ? {
          ...previousState.currentEnemy,
          currentHp: 0,
        }
      : null,
  };
}

/**
 * Create retreat state when task is cancelled
 */
export function createRetreatState(sessionId: string): BattleState {
  return {
    sessionId,
    inBattle: false,
    currentEnemy: null,
    party: DEFAULT_PARTY.map((p, i) => ({ ...p, id: i + 1 })),
    turnCount: 0,
    battleStartedAt: null,
    totalDamageDealt: 0,
    abilitiesUsed: [],
  };
}

/**
 * Format battle duration as human-readable string
 */
export function formatBattleDuration(startTime: number | null): string {
  if (!startTime) return 'unknown';

  const elapsed = Date.now() - startTime;
  const seconds = Math.floor(elapsed / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

/**
 * Calculate damage dealt based on task complexity
 */
export function calculateDamage(task: TodoItem): number {
  const baseAmount = 50;
  const wordBonus = task.content.split(/\s+/).length * 5;
  const randomVariance = Math.floor(Math.random() * 20) - 10;

  return baseAmount + wordBonus + randomVariance;
}
