/**
 * Real-time Event Types for Dashboard
 */

import type { BattleState, BattleEvent } from './battle.js';

export type SSEEventType =
  | 'connected'
  | 'battle_update'
  | 'new_event'
  | 'heartbeat';

export interface SSEMessage {
  type: SSEEventType;
  data?: BattleState | BattleEvent | null;
  timestamp?: number;
}

export interface DashboardNotification {
  event: BattleEvent;
  state: BattleState;
}
