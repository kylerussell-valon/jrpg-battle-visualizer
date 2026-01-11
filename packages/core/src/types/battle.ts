/**
 * JRPG Battle System Types
 */

export type JRPGClass =
  | 'Sage'        // Claude - master of all coding arts
  | 'Architect'   // System design, planning
  | 'Debugger'    // Bug fixing specialist
  | 'Scribe'      // Documentation, comments
  | 'Artificer'   // Feature implementation
  | 'Guardian'    // Testing, validation
  | 'Chronomancer'; // Git, version control

export type Element =
  | 'DEBUG'
  | 'LOGIC'
  | 'PATTERN'
  | 'ASSERT'
  | 'ARCHITECTURE'
  | 'SYNTAX'
  | 'REFACTOR';

export interface Ability {
  name: string;
  mpCost: number;
  damage: number;
  element: Element;
  description: string;
}

export interface PartyMember {
  id: number;
  name: string;
  class: JRPGClass;
  maxHp: number;
  currentHp: number;
  maxMp: number;
  currentMp: number;
  level: number;
  experience: number;
  abilities?: Ability[];
}

export interface Enemy {
  name: string;
  description: string;
  maxHp: number;
  currentHp: number;
  weakness: Element;
  sprite?: string;
}

export interface BattleState {
  sessionId: string;
  inBattle: boolean;
  currentEnemy: Enemy | null;
  party: PartyMember[];
  turnCount: number;
  battleStartedAt: number | null;
  totalDamageDealt: number;
  abilitiesUsed: string[];
}

export interface BattleEvent {
  id?: number;
  sessionId: string;
  eventType: TransitionType;
  taskContent: string;
  description: string;
  imagePath: string | null;
  damageDealt: number;
  createdAt: number;
}

export type TransitionType =
  | 'BATTLE_START'   // pending → in_progress
  | 'ATTACK'         // tool use during battle
  | 'VICTORY'        // in_progress → completed
  | 'RETREAT'        // task removed/cancelled
  | 'PARTY_WIPE';    // multiple failures

export interface TodoItem {
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  activeForm: string;
}

export interface StateTransition {
  type: TransitionType;
  task: TodoItem;
  previousState?: BattleState;
  newState: BattleState;
}
