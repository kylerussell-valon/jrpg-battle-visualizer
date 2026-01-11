'use client';

import { useState, useEffect } from 'react';
import type { BattleState, BattleEvent } from '@jrpg-visualizer/core';
import { EnemyDisplay } from './EnemyDisplay';
import { VictoryScreen } from './VictoryScreen';

interface BattleSceneProps {
  state: BattleState | null;
  latestEvent: BattleEvent | null;
}

export function BattleScene({ state, latestEvent }: BattleSceneProps) {
  const [showVictory, setShowVictory] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);

  // Update image when latest event changes
  useEffect(() => {
    if (latestEvent?.imagePath) {
      setImageError(false);
      setCurrentImage(latestEvent.imagePath);
    }
  }, [latestEvent?.imagePath]);

  // Show victory animation when battle ends
  useEffect(() => {
    if (latestEvent?.eventType === 'VICTORY') {
      setShowVictory(true);
      const timer = setTimeout(() => setShowVictory(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [latestEvent?.eventType]);

  // Build image URL
  const imageUrl = currentImage
    ? `/api/images/${encodeURIComponent(currentImage)}`
    : null;

  if (!state && !latestEvent) {
    return (
      <div className="aspect-video flex items-center justify-center bg-gradient-to-b from-jrpg-purple to-jrpg-blue">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-float">🎮</div>
          <p className="text-gray-400 text-lg">Awaiting battle...</p>
          <p className="text-gray-500 text-xs mt-2">
            Start a task in Claude Code to begin
          </p>
        </div>
      </div>
    );
  }

  if (showVictory && state?.currentEnemy) {
    return <VictoryScreen enemy={state.currentEnemy} />;
  }

  return (
    <div className="aspect-video relative overflow-hidden bg-gradient-to-b from-indigo-900 via-purple-900 to-gray-900">
      {/* Background - generated image or animated fallback */}
      {imageUrl && !imageError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt="Battle scene"
          className="absolute inset-0 w-full h-full object-cover pixelated"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="absolute inset-0">
          {/* Animated starfield background */}
          <div className="absolute inset-0 bg-stars opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/50 to-gray-900" />
        </div>
      )}

      {/* Battle UI overlay */}
      <div className="absolute inset-0 flex flex-col justify-between p-4">
        {/* Enemy info - top left (only show when no image, to avoid overlap with generated UI) */}
        {state?.currentEnemy && state.inBattle && !imageUrl && (
          <EnemyDisplay enemy={state.currentEnemy} />
        )}

        {/* Minimal task indicator when image is showing */}
        {state?.currentEnemy && state.inBattle && imageUrl && !imageError && (
          <div className="self-start">
            <div className="bg-black/80 rounded px-3 py-1.5 border border-gray-700">
              <p className="text-gray-400 text-xs truncate max-w-xs" title={state.currentEnemy.description}>
                {state.currentEnemy.description}
              </p>
            </div>
          </div>
        )}

        {/* Spacer for layout */}
        <div className="flex-1" />

        {/* Battle ended message */}
        {state && !state.inBattle && !showVictory && (
          <div className="self-center">
            <div className="bg-black/80 px-6 py-3 rounded border border-jrpg-gold">
              <p className="text-jrpg-gold text-lg">Battle Complete</p>
            </div>
          </div>
        )}
      </div>

      {/* Turn counter */}
      {state?.turnCount && state.turnCount > 0 && (
        <div className="absolute top-4 right-4 bg-black/70 px-3 py-1 rounded">
          <span className="text-jrpg-gold text-xs">Turn {state.turnCount}</span>
        </div>
      )}

      {/* CRT scanline overlay */}
      <div className="absolute inset-0 scanlines pointer-events-none" />
    </div>
  );
}
