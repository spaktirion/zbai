'use client';

import { cn } from '@/lib/utils';
import { Volume2, Volume1, VolumeX } from 'lucide-react';

interface VolumeControlProps {
  volume: number;
  onChange: (volume: number) => void;
  className?: string;
}

export function VolumeControl({ volume, onChange, className }: VolumeControlProps) {
  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  const toggleMute = () => {
    onChange(volume === 0 ? 0.8 : 0);
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <button
        onClick={toggleMute}
        className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full text-aether-muted hover:text-aether-text active:text-aether-indigo transition-colors"
        aria-label={volume === 0 ? 'Unmute' : 'Mute'}
      >
        <VolumeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
      <div className="flex-1 min-w-0">
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full"
          aria-label="Volume"
        />
      </div>
      <span className="text-xs text-aether-muted font-mono w-8 text-right tabular-nums flex-shrink-0">
        {Math.round(volume * 100)}%
      </span>
    </div>
  );
}
