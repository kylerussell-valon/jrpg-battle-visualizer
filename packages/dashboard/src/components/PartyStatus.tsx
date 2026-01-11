'use client';

import type { PartyMember } from '@jrpg-visualizer/core';

interface PartyStatusProps {
  party: PartyMember[];
}

export function PartyStatus({ party }: PartyStatusProps) {
  // Calculate session stats
  const totalTasks = party.length > 0 ? Math.max(1, party[0]?.level || 1) : 0;
  const completedTasks = party.length > 0 ? Math.floor((party[0]?.experience || 0) / 100) : 0;

  return (
    <div className="bg-jrpg-purple/50 rounded-lg p-4 border border-gray-700 h-full">
      <h2 className="text-jrpg-gold text-sm mb-3">SESSION STATUS</h2>

      <div className="space-y-4">
        {/* Claude status */}
        <div className="bg-black/40 rounded p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-jrpg-green animate-pulse" />
            <span className="text-white text-sm font-medium">Claude Code</span>
          </div>
          <p className="text-gray-400 text-xs">Active session</p>
        </div>

        {/* Tools in use */}
        <div className="bg-black/40 rounded p-3">
          <p className="text-gray-500 text-xs mb-2">ACTIVE TOOLS</p>
          <div className="flex flex-wrap gap-1">
            <ToolBadge name="TodoWrite" active />
            <ToolBadge name="Read" />
            <ToolBadge name="Edit" />
            <ToolBadge name="Bash" />
          </div>
        </div>

        {/* Progress */}
        <div className="bg-black/40 rounded p-3">
          <p className="text-gray-500 text-xs mb-2">TASK PROGRESS</p>
          <div className="flex items-center justify-between">
            <span className="text-white text-lg font-bold">{completedTasks}</span>
            <span className="text-gray-500 text-xs">completed</span>
          </div>
          <div className="mt-2 h-1.5 bg-gray-800 rounded overflow-hidden">
            <div
              className="h-full bg-jrpg-green transition-all duration-500"
              style={{ width: `${Math.min(100, (completedTasks / Math.max(1, totalTasks)) * 100)}%` }}
            />
          </div>
        </div>

        {/* Model info */}
        <div className="text-center pt-2 border-t border-gray-700/50">
          <p className="text-gray-600 text-xs">Powered by</p>
          <p className="text-gray-400 text-xs">Claude Opus 4.5 + Gemini</p>
        </div>
      </div>
    </div>
  );
}

function ToolBadge({ name, active = false }: { name: string; active?: boolean }) {
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs ${
        active
          ? 'bg-jrpg-green/20 text-jrpg-green border border-jrpg-green/30'
          : 'bg-gray-800 text-gray-500'
      }`}
    >
      {name}
    </span>
  );
}
