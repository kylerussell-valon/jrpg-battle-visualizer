'use client';

import { useState } from 'react';

interface ExportGifButtonProps {
  sessionId: string | null;
  imageCount: number;
}

export function ExportGifButton({ sessionId, imageCount }: ExportGifButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleExport = async () => {
    if (!sessionId || imageCount === 0) return;

    setIsExporting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/export/gif', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Export failed');
      }

      // Trigger download
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `battle_${sessionId}.gif`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const isDisabled = !sessionId || imageCount === 0 || isExporting;
  const frameDuration = imageCount > 0 ? Math.round(60000 / imageCount) : 0;

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleExport}
        disabled={isDisabled}
        className={`
          px-4 py-2 rounded border-2 font-bold text-sm
          transition-all duration-200
          ${
            isDisabled
              ? 'bg-gray-700 border-gray-600 text-gray-500 cursor-not-allowed'
              : success
                ? 'bg-jrpg-green border-jrpg-green text-black'
                : 'bg-jrpg-purple border-jrpg-gold text-jrpg-gold hover:bg-jrpg-gold hover:text-jrpg-purple'
          }
        `}
      >
        {isExporting ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin">*</span>
            Generating...
          </span>
        ) : success ? (
          <span>Downloaded!</span>
        ) : (
          <span>Export GIF ({imageCount} frames)</span>
        )}
      </button>

      {imageCount > 0 && !isExporting && !success && (
        <span className="text-xs text-gray-500">
          60s total | {frameDuration}ms per frame
        </span>
      )}

      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
