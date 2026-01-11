/**
 * TodoWrite Event Handler
 * Orchestrates the battle visualization flow when TodoWrite is called
 */

import type { HookPayload, TodoWriteInput, StateTransition, BattleEvent } from '@jrpg-visualizer/core';
import { parseTranscript, formatBattleDuration, calculateDamage } from '@jrpg-visualizer/core';
import { BattleStateMachine } from './state-machine.js';
import { DescriptionGenerator } from '../generators/description.js';
import { ImageGenerator } from '../generators/image.js';
import { DashboardNotifier } from '../services/notifier.js';
import { shouldGenerateImage } from '../services/rate-limiter.js';

interface HandleResult {
  transition: StateTransition | null;
  event: BattleEvent | null;
  imagePath: string | null;
}

export async function handleTodoWrite(
  payload: HookPayload,
  todoInput: TodoWriteInput,
  config: {
    dbPath: string;
    imagesDir: string;
    dashboardUrl: string;
    anthropicApiKey: string;
    geminiApiKey: string;
  }
): Promise<HandleResult> {
  const stateMachine = new BattleStateMachine(config.dbPath);

  try {
    // Get previous todos to detect transitions
    const previousTodos = stateMachine.getPreviousTodos(payload.session_id);
    if (process.env.DEBUG) console.error('[DEBUG] Previous todos:', previousTodos.length);

    // Save current todos for next comparison
    stateMachine.saveTodos(payload.session_id, todoInput.todos);
    if (process.env.DEBUG) console.error('[DEBUG] Saved current todos');

    // Detect state transition
    const transition = stateMachine.detectTransition(
      previousTodos,
      todoInput.todos,
      payload.session_id
    );

    if (!transition) {
      // No interesting transition, nothing to visualize
      if (process.env.DEBUG) console.error('[DEBUG] No transition detected');
      return { transition: null, event: null, imagePath: null };
    }
    if (process.env.DEBUG) console.error('[DEBUG] Transition:', transition.type);

    // Parse transcript for context
    const context = parseTranscript(payload.transcript_path);
    if (process.env.DEBUG) console.error('[DEBUG] Context length:', context.length);

    // Generate battle description via Claude Opus 4.5
    const descriptionGen = new DescriptionGenerator(config.anthropicApiKey);
    if (process.env.DEBUG) console.error('[DEBUG] Generating description...');
    const description = await descriptionGen.generateDescription(transition, context);

    if (!description) {
      console.error('Failed to generate battle description');
      return { transition, event: null, imagePath: null };
    }
    if (process.env.DEBUG) console.error('[DEBUG] Description generated:', description.substring(0, 50) + '...');

    // Generate image if rate limit allows
    let imagePath: string | null = null;

    if (shouldGenerateImage()) {
      const imageGen = new ImageGenerator(config.geminiApiKey, config.imagesDir);

      // Get style reference images
      const anchorPath = stateMachine.getSessionAnchor(payload.session_id);
      const previousImagePath = stateMachine.getMostRecentImage(payload.session_id);

      imagePath = await imageGen.generateBattleImage(
        description,
        anchorPath,
        previousImagePath
      );

      // Save as anchor if this is the first image of the session
      if (imagePath && !anchorPath) {
        stateMachine.saveSessionAnchor(payload.session_id, imagePath);
      }
    }

    // Create and save battle event
    const event: Omit<BattleEvent, 'id'> = {
      sessionId: payload.session_id,
      eventType: transition.type,
      taskContent: transition.task.content,
      description,
      imagePath,
      damageDealt: calculateDamage(transition.task),
      createdAt: Date.now(),
    };

    const eventId = stateMachine.saveEvent(event);
    if (process.env.DEBUG) console.error('[DEBUG] Event saved with ID:', eventId);

    // Notify dashboard
    const notifier = new DashboardNotifier(config.dashboardUrl);
    await notifier.notify({
      ...event,
      id: eventId,
    }, transition.newState);

    return {
      transition,
      event: { ...event, id: eventId },
      imagePath,
    };
  } finally {
    stateMachine.close();
  }
}
