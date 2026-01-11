/**
 * Transcript Parsing Utilities
 */

import { readFileSync, existsSync } from 'fs';
import type { TranscriptEntry, ContentBlock } from '../types/hook.js';

/**
 * Parse Claude Code transcript file and extract recent context
 * @param transcriptPath Path to the .jsonl transcript file
 * @param maxChars Maximum characters to return
 * @returns Recent conversation context as a string
 */
export function parseTranscript(transcriptPath: string, maxChars: number = 2000): string {
  try {
    if (!existsSync(transcriptPath)) {
      return '';
    }

    const content = readFileSync(transcriptPath, 'utf-8');

    // Handle both JSON array and JSONL formats
    let entries: TranscriptEntry[];

    if (content.trim().startsWith('[')) {
      // JSON array format
      entries = JSON.parse(content);
    } else {
      // JSONL format - each line is a separate JSON object
      entries = content
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter((entry): entry is TranscriptEntry => entry !== null);
    }

    // Get last few relevant messages for context
    const recentMessages = entries
      .slice(-15) // Last 15 entries
      .filter((entry) => entry.role === 'assistant' || entry.role === 'user')
      .map((entry) => extractTextContent(entry))
      .filter((text) => text.length > 0)
      .join('\n---\n');

    // Limit context size
    return recentMessages.slice(-maxChars);
  } catch (error) {
    console.error('Failed to parse transcript:', error);
    return '';
  }
}

/**
 * Extract text content from a transcript entry
 */
function extractTextContent(entry: TranscriptEntry): string {
  if (typeof entry.content === 'string') {
    return entry.content;
  }

  if (Array.isArray(entry.content)) {
    return entry.content
      .filter((block): block is ContentBlock =>
        block.type === 'text' && typeof block.text === 'string'
      )
      .map((block) => block.text!)
      .join('\n');
  }

  return '';
}

/**
 * Extract the most recent task being worked on from transcript
 */
export function extractCurrentTask(transcriptPath: string): string | null {
  try {
    const context = parseTranscript(transcriptPath, 5000);

    // Look for TodoWrite tool calls in reverse order
    const todoPattern = /TodoWrite.*?content['":\s]+['"]([^'"]+)['"]/gi;
    const matches = [...context.matchAll(todoPattern)];

    if (matches.length > 0) {
      return matches[matches.length - 1][1];
    }

    return null;
  } catch {
    return null;
  }
}
