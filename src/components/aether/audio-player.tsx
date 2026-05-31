'use client';

import { cn } from '@/lib/utils';
import { useAetherStore } from '@/store/aether-store';
import { Equalizer } from './equalizer';
import { VolumeControl } from './volume-control';
import { Play, Pause, SkipBack, SkipForward, Radio } from 'lucide-react';

interface AudioPlayerProps {
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onVolumeChange: (volume: number) => void;
  className?: string;
}

export function AudioPlayer({
  onTogglePlay,
  onNext,
  onPrev,
  onVolumeChange,
  className,
}: AudioPlayerProps) {
  const {
    currentStation,
    isPlaying,
    volume,
    rdsText,
    remoteConnected,
    remoteStationDisplay,
    remotePlaying,
    remoteRds,
    remoteVolume,
    remoteServerName,
  } = useAetherStore();

  // When remote connected, show server state; otherwise local state
  const displayStationName = remoteConnected ? remoteStationDisplay : (currentStation?.name || '');
  const displayPlaying = remoteConnected ? remotePlaying : isPlaying;
  const displayRds = remoteConnected ? remoteRds : rdsText;
  const displayVolume = remoteConnected ? remoteVolume : volume;
  const hasStation = remoteConnected ? !!remoteStationDisplay : !!currentStation;

  if (!hasStation) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-6 sm:py-8 text-center', className)}>
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/5 flex items-center justify-center mb-3 sm:mb-4">
          <Radio className="w-6 h-6 sm:w-7 sm:h-7 text-aether-muted" />
        </div>
        <p className="text-fluid-lg font-medium text-aether-muted">No Station Selected</p>
        <p className="text-fluid-sm text-aether-muted/60 mt-1">
          {remoteConnected ? 'Waiting for server status...' : 'Pick a station to start listening'}
        </p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col items-center gap-3 sm:gap-4 py-2 sm:py-4', className)}>
      {/* Equalizer */}
      <div className="eq-visual">
        <Equalizer isPlaying={displayPlaying} className="scale-125 sm:scale-150 mb-1 sm:mb-2" />
      </div>

      {/* Station Name */}
      <div className="text-center w-full px-2">
        <h2 className="text-fluid-xl font-semibold text-aether-text truncate">
          {displayRds || displayStationName}
        </h2>
        <p className="text-fluid-sm text-aether-muted mt-0.5 font-mono truncate">
          {remoteConnected
            ? `Remote: ${remoteServerName}`
            : currentStation?.url.replace(/^https?:\/\//, '').split('/')[0]}
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onPrev}
          className="player-btn-secondary w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-white/5 text-aether-muted hover:text-aether-text hover:bg-white/10 active:bg-white/15 transition-all"
          aria-label="Previous station"
        >
          <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <button
          onClick={onTogglePlay}
          className={cn(
            'player-btn-main w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center rounded-full transition-all',
            'bg-aether-indigo text-white shadow-lg active:scale-95',
            displayPlaying && 'pulse-glow'
          )}
          aria-label={displayPlaying ? 'Pause' : 'Play'}
        >
          {displayPlaying ? (
            <Pause className="w-6 h-6 sm:w-7 sm:h-7" />
          ) : (
            <Play className="w-6 h-6 sm:w-7 sm:h-7 ml-0.5" />
          )}
        </button>
        <button
          onClick={onNext}
          className="player-btn-secondary w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-white/5 text-aether-muted hover:text-aether-text hover:bg-white/10 active:bg-white/15 transition-all"
          aria-label="Next station"
        >
          <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Volume */}
      <VolumeControl
        volume={displayVolume}
        onChange={onVolumeChange}
        className="w-full max-w-[260px] sm:max-w-[300px]"
      />
    </div>
  );
}
