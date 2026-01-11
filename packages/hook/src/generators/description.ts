/**
 * Description Generator
 * Uses Claude Opus 4.5 to generate JRPG battle scene descriptions
 */

import Anthropic from '@anthropic-ai/sdk';
import type { StateTransition } from '@jrpg-visualizer/core';
import {
  JRPG_SYSTEM_PROMPT,
  getBattleStartPrompt,
  getVictoryPrompt,
  getAttackPrompt,
  formatBattleDuration,
} from '@jrpg-visualizer/core';

export class DescriptionGenerator {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  /**
   * Generate a battle description based on the state transition
   */
  async generateDescription(
    transition: StateTransition,
    transcriptContext: string
  ): Promise<string | null> {
    try {
      const prompt = this.buildPrompt(transition, transcriptContext);

      const response = await this.client.messages.create({
        model: 'claude-opus-4-5-20251101',
        max_tokens: 500,
        system: JRPG_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const textBlock = response.content.find((block) => block.type === 'text');
      return textBlock && 'text' in textBlock ? textBlock.text : null;
    } catch (error) {
      console.error('Failed to generate description:', error);
      return null;
    }
  }

  /**
   * Build the appropriate prompt based on transition type
   */
  private buildPrompt(transition: StateTransition, context: string): string {
    const enemyName = transition.newState.currentEnemy?.name ?? 'Unknown Enemy';

    switch (transition.type) {
      case 'BATTLE_START':
        return getBattleStartPrompt(enemyName, transition.task.content, context);

      case 'VICTORY':
        const duration = formatBattleDuration(transition.previousState?.battleStartedAt ?? null);
        return getVictoryPrompt(enemyName, transition.task.content, duration);

      case 'ATTACK':
        return getAttackPrompt(enemyName, 'Code Manipulation', context);

      case 'RETREAT':
        return `The party retreats! Generate a brief JRPG retreat scene.

ABANDONED TASK: ${transition.task.content}
ENEMY: ${enemyName}

Describe the tactical retreat. Include:
- Party backing away from the enemy
- Enemy watching them leave
- Somber but strategic mood

Keep it under 80 words.`;

      case 'PARTY_WIPE':
        return `Defeat! Generate a JRPG game over scene.

VICTORIOUS ENEMY: ${enemyName}
TASK: ${transition.task.content}

Describe the defeat. Include:
- Party members fallen
- Screen fading to black
- "Continue?" prompt appearing

Keep it under 80 words. Dramatic but with a hint of "try again" hope.`;

      default:
        return `Generate a brief JRPG scene transition. The party prepares for their next challenge.`;
    }
  }
}
