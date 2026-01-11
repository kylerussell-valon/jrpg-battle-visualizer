'use client';

import { create } from 'zustand';
import type { BattleState, BattleEvent } from '@jrpg-visualizer/core';

interface BattleStore {
  battleState: BattleState | null;
  events: BattleEvent[];
  isConnected: boolean;
  lastUpdate: number;

  setBattleState: (state: BattleState) => void;
  addEvent: (event: BattleEvent) => void;
  setEvents: (events: BattleEvent[]) => void;
  setConnected: (connected: boolean) => void;
  clearEvents: () => void;
}

export const useBattleStore = create<BattleStore>((set) => ({
  battleState: null,
  events: [],
  isConnected: false,
  lastUpdate: 0,

  setBattleState: (state) =>
    set({
      battleState: state,
      lastUpdate: Date.now(),
    }),

  addEvent: (event) =>
    set((prev) => ({
      events: [...prev.events.slice(-50), event], // Keep last 50 events
      lastUpdate: Date.now(),
    })),

  setEvents: (events) =>
    set({
      events: events.slice(-50),
      lastUpdate: Date.now(),
    }),

  setConnected: (connected) => set({ isConnected: connected }),

  clearEvents: () => set({ events: [] }),
}));
