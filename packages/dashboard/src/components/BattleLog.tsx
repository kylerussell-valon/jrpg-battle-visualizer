'use client';

import { useEffect, useRef } from 'react';
import type { BattleEvent } from '@jrpg-visualizer/core';

interface BattleLogProps {
  events: BattleEvent[];
}

export function BattleLog({ events }: BattleLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events.length]);

  // Get event styling
  const getEventStyle = (eventType: string) => {
    switch (eventType) {
      case 'BATTLE_START':
        return {
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/30',
          label: 'STARTED',
          icon: '▶'
        };
      case 'VICTORY':
        return {
          color: 'text-green-400',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/30',
          label: 'COMPLETED',
          icon: '✓'
        };
      case 'ATTACK':
        return {
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/30',
          label: 'IN PROGRESS',
          icon: '⋯'
        };
      case 'RETREAT':
        return {
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500/30',
          label: 'PAUSED',
          icon: '⏸'
        };
      case 'PARTY_WIPE':
        return {
          color: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30',
          label: 'FAILED',
          icon: '✗'
        };
      default:
        return {
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500/30',
          label: 'UPDATE',
          icon: '•'
        };
    }
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Clean up description - remove excessive markdown/emoji for cleaner log
  const cleanDescription = (desc: string) => {
    return desc
      .replace(/^#+ /gm, '') // Remove markdown headers
      .replace(/\*+/g, '') // Remove asterisks
      .replace(/[⚔️🏆💥🎮✨🔥⚡]/g, '') // Remove common emoji
      .replace(/---+/g, '') // Remove horizontal rules
      .trim()
      .slice(0, 150);
  };

  return (
    <div className="bg-jrpg-purple/50 rounded-lg border border-gray-700 h-full flex flex-col">
      <div className="px-4 py-2 border-b border-gray-700 flex items-center justify-between">
        <h2 className="text-jrpg-gold text-sm">TASK LOG</h2>
        <span className="text-gray-500 text-xs">{events.length} events</span>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[300px]"
      >
        {events.length === 0 ? (
          <p className="text-gray-500 text-xs text-center py-4">
            Waiting for tasks...
          </p>
        ) : (
          events.map((event) => {
            const style = getEventStyle(event.eventType);
            return (
              <div
                key={event.id || event.createdAt}
                className={`rounded p-3 border ${style.bgColor} ${style.borderColor} animate-fade-in`}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className={`${style.color} text-sm font-mono`}>{style.icon}</span>
                    <span className={`text-xs font-medium ${style.color}`}>
                      {style.label}
                    </span>
                  </div>
                  <span className="text-gray-600 text-xs whitespace-nowrap font-mono">
                    {formatTime(event.createdAt)}
                  </span>
                </div>

                {/* Task name */}
                <p className="text-white text-sm mb-1 truncate" title={event.taskContent}>
                  {event.taskContent}
                </p>

                {/* Status description */}
                {event.description && (
                  <p className="text-gray-400 text-xs leading-relaxed">
                    {cleanDescription(event.description)}
                    {event.description.length > 150 ? '...' : ''}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
