'use client';

import { useState, useEffect } from 'react';
import type { Enemy } from '@jrpg-visualizer/core';

interface VictoryScreenProps {
  enemy: Enemy;
}

export function VictoryScreen({ enemy }: VictoryScreenProps) {
  const [showFlash, setShowFlash] = useState(true);
  const [showRewards, setShowRewards] = useState(false);

  // Calculate rewards based on enemy HP
  const expGained = Math.floor(enemy.maxHp * 1.5);
  const goldGained = Math.floor(enemy.maxHp * 0.8);

  useEffect(() => {
    // Flash effect
    const flashTimer = setTimeout(() => setShowFlash(false), 500);

    // Show rewards after flash
    const rewardsTimer = setTimeout(() => setShowRewards(true), 800);

    return () => {
      clearTimeout(flashTimer);
      clearTimeout(rewardsTimer);
    };
  }, []);

  return (
    <div className="aspect-video relative overflow-hidden bg-gradient-to-b from-indigo-900 via-purple-900 to-black">
      {/* Victory flash */}
      {showFlash && (
        <div className="absolute inset-0 bg-white animate-pulse" />
      )}

      {/* Main content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/* Victory text */}
        <div className="text-center mb-8 animate-victory">
          <h1 className="text-5xl text-jrpg-gold font-bold glow-text mb-2">
            VICTORY!
          </h1>
          <p className="text-white text-lg">
            Defeated <span className="text-jrpg-red">{enemy.name}</span>
          </p>
        </div>

        {/* Rewards panel */}
        {showRewards && (
          <div className="bg-black/80 rounded-lg border-2 border-jrpg-gold p-6 min-w-[300px] animate-fade-in">
            <h2 className="text-jrpg-gold text-center text-sm mb-4">REWARDS</h2>

            <div className="space-y-3">
              {/* EXP */}
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">EXP Gained</span>
                <span className="text-jrpg-cyan text-sm font-bold">
                  +{expGained.toLocaleString()}
                </span>
              </div>

              {/* Gold */}
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Gold</span>
                <span className="text-jrpg-gold text-sm font-bold">
                  +{goldGained.toLocaleString()} G
                </span>
              </div>

              {/* Task completed */}
              <div className="pt-3 border-t border-gray-700">
                <p className="text-jrpg-green text-xs text-center">
                  ✓ Task Completed
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Party celebration hint */}
        <p className="absolute bottom-8 text-gray-500 text-xs animate-pulse">
          The party celebrates their victory...
        </p>
      </div>

      {/* Particle effects */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-jrpg-gold rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              opacity: Math.random() * 0.5 + 0.5,
            }}
          />
        ))}
      </div>

      {/* CRT scanlines */}
      <div className="absolute inset-0 scanlines pointer-events-none" />
    </div>
  );
}
