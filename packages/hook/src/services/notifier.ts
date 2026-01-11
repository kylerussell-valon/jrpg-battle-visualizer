/**
 * Dashboard Notifier
 * Sends battle events to the web dashboard via HTTP
 */

import type { BattleEvent, BattleState, DashboardNotification } from '@jrpg-visualizer/core';

export class DashboardNotifier {
  private dashboardUrl: string;

  constructor(dashboardUrl: string = 'http://localhost:3000') {
    this.dashboardUrl = dashboardUrl;
  }

  /**
   * Notify the dashboard of a new battle event
   */
  async notify(event: BattleEvent, state: BattleState): Promise<boolean> {
    try {
      const notification: DashboardNotification = { event, state };

      const response = await fetch(`${this.dashboardUrl}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notification),
      });

      if (!response.ok) {
        console.error(`Dashboard notification failed: ${response.status}`);
        return false;
      }

      return true;
    } catch (error) {
      // Dashboard might not be running - this is fine, don't fail the hook
      // Just log and continue
      if (process.env.DEBUG) {
        console.error('Could not notify dashboard:', error);
      }
      return false;
    }
  }
}
