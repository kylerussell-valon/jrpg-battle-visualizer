/**
 * Claude Code Hook Payload Types
 */

import type { TodoItem } from './battle.js';

export interface HookPayload {
  hook_event_name: string;
  tool_name: string;
  tool_input: unknown;
  tool_output?: unknown;
  transcript_path: string;
  session_id: string;
  cwd: string;
  permission_mode: string;
  tool_use_id?: string;
}

export interface TodoWriteInput {
  todos: TodoItem[];
}

export interface HookOutput {
  continue: boolean;
  stopReason?: string | null;
  suppressOutput?: boolean;
  systemMessage?: string;
}

export interface TranscriptEntry {
  role: 'user' | 'assistant' | 'system';
  content: string | ContentBlock[];
  timestamp?: number;
}

export interface ContentBlock {
  type: 'text' | 'tool_use' | 'tool_result';
  text?: string;
  name?: string;
  input?: unknown;
  content?: string;
}
