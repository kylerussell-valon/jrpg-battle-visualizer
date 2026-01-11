import { NextRequest, NextResponse } from 'next/server';
import { getEventEmitter } from '@/lib/events';
import type { BattleEvent, BattleState, DashboardNotification } from '@jrpg-visualizer/core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET - Server-Sent Events endpoint for real-time updates
 */
export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  const emitter = getEventEmitter();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`)
      );

      // Send heartbeat every 30 seconds to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`)
          );
        } catch {
          clearInterval(heartbeat);
        }
      }, 30000);

      // Listen for battle updates
      const onBattleUpdate = (state: BattleState) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'battle_update', data: state })}\n\n`)
          );
        } catch {
          // Client disconnected
        }
      };

      // Listen for new events
      const onNewEvent = (event: BattleEvent) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'new_event', data: event })}\n\n`)
          );
        } catch {
          // Client disconnected
        }
      };

      emitter.on('battle_update', onBattleUpdate);
      emitter.on('new_event', onNewEvent);

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        emitter.off('battle_update', onBattleUpdate);
        emitter.off('new_event', onNewEvent);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}

/**
 * POST - Receive notifications from the hook
 */
export async function POST(request: NextRequest) {
  try {
    const notification: DashboardNotification = await request.json();
    const emitter = getEventEmitter();

    // Broadcast to all connected clients
    if (notification.event) {
      emitter.emit('new_event', notification.event);
    }
    if (notification.state) {
      emitter.emit('battle_update', notification.state);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to process notification:', error);
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}
