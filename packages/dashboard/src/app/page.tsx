'use client';

import { useEffect, useCallback } from 'react';
import { useBattleStore } from '@/stores/battle';
import { useEventSource } from '@/hooks/useEventSource';
import { BattleScene } from '@/components/BattleScene';
import { BattleLog } from '@/components/BattleLog';
import { PartyStatus } from '@/components/PartyStatus';
import type { BattleState, BattleEvent } from '@jrpg-visualizer/core';

export default function BattleViewer() {
  const {
    battleState,
    events,
    isConnected,
    setBattleState,
    addEvent,
    setEvents,
    setConnected,
  } = useBattleStore();

  // Handle SSE messages
  const handleMessage = useCallback(
    (message: { type: string; data?: unknown }) => {
      if (message.type === 'battle_update' && message.data) {
        setBattleState(message.data as BattleState);
      }
      if (message.type === 'new_event' && message.data) {
        addEvent(message.data as BattleEvent);
      }
    },
    [setBattleState, addEvent]
  );

  // Connect to SSE
  useEventSource('/api/events', {
    onMessage: handleMessage,
    onConnect: () => setConnected(true),
    onDisconnect: () => setConnected(false),
  });

  // Load initial state
  useEffect(() => {
    fetch('/api/battles')
      .then((res) => res.json())
      .then((data) => {
        if (data.state) {
          setBattleState(data.state);
        }
        if (data.events) {
          setEvents(data.events);
        }
      })
      .catch((error) => {
        console.error('Failed to load initial state:', error);
      });
  }, [setBattleState, setEvents]);

  // Get latest event for the battle scene
  const latestEvent = events.length > 0 ? events[events.length - 1] : null;

  // Get party from state or use empty array
  const party = battleState?.party || [];

  return (
    <div className="min-h-screen bg-jrpg-blue text-white">
      {/* CRT scanline overlay */}
      <div className="fixed inset-0 pointer-events-none scanlines opacity-5 z-50" />

      <main className="container mx-auto p-4 space-y-4 max-w-6xl">
        {/* Header */}
        <header className="text-center py-4">
          <h1 className="text-3xl md:text-4xl font-bold text-jrpg-gold glow-text">
            JRPG BATTLE VISUALIZER
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            Watching Claude Code battles in real-time
          </p>

          {/* Connection status */}
          <div className="mt-2 flex items-center justify-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-jrpg-green' : 'bg-jrpg-red'
              }`}
            />
            <span className="text-xs text-gray-500">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </header>

        {/* Main battle scene */}
        <div className="border-4 border-jrpg-gold/50 rounded-lg overflow-hidden shadow-[0_0_30px_rgba(255,215,0,0.2)]">
          <BattleScene state={battleState} latestEvent={latestEvent} />
        </div>

        {/* Bottom panel: Party status + Battle log */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <PartyStatus party={party} />
          </div>
          <div className="lg:col-span-2">
            <BattleLog events={events} />
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center py-4 text-gray-600 text-xs">
          <p>Powered by Claude Opus 4.5 + Google Gemini</p>
        </footer>
      </main>
    </div>
  );
}
