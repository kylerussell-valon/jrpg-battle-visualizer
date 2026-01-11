'use client';

import type { Enemy } from '@jrpg-visualizer/core';

interface EnemyDisplayProps {
  enemy: Enemy;
}

export function EnemyDisplay({ enemy }: EnemyDisplayProps) {
  const hpPercent = Math.max(0, Math.min(100, (enemy.currentHp / enemy.maxHp) * 100));

  return (
    <div className="self-start w-full max-w-sm">
      <div className="bg-black/80 rounded px-4 py-2 border border-gray-700">
        {/* Enemy name */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white text-sm font-bold">{enemy.name}</h3>
          <span className="text-gray-400 text-xs">
            Weak: <span className="text-jrpg-cyan">{enemy.weakness}</span>
          </span>
        </div>

        {/* HP Bar */}
        <div className="mb-1">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">HP</span>
            <span className="text-white">
              {enemy.currentHp} / {enemy.maxHp}
            </span>
          </div>
          <div className="h-3 bg-gray-800 rounded overflow-hidden border border-gray-600">
            <div
              className="h-full enemy-hp-bar transition-all duration-300"
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>

        {/* Task description (truncated) */}
        <p className="text-gray-500 text-xs mt-2 truncate" title={enemy.description}>
          {enemy.description}
        </p>
      </div>
    </div>
  );
}
