'use client';

import { cn } from '@/lib/utils';
import { useAetherStore } from '@/store/aether-store';
import { Equalizer } from './equalizer';
import { Play, Pause, SkipBack, SkipForward, ChevronUp } from 'lucide-react';

interface MiniPlayerProps {
  onExpand: () => void;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  className?: string;
}

export function MiniPlayer({ onExpand, onTogglePlay, onNext, onPrev, className }: MiniPlayerProps) {
  const {
    currentStation,
    isPlaying,
    rdsText,
    remoteConnected,
    remoteStationDisplay,
    remotePlaying,
    remoteRds,
    remoteServerName,
  } = useAetherStore();

  const displayStationName = remoteConnected ? remoteStationDisplay : (currentStation?.name || '');
  const displayPlaying = remoteConnected ? remotePlaying : isPlaying;
  const displayRds = remoteConnected ? remoteRds : rdsText;
  const hasStation = remoteConnected ? !!remoteStationDisplay : !!currentStation;

  if (!hasStation) return null;

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40',
        'md:left-1/2 md:-translate-x-1/2',
        'glass-panel rounded-none md:rounded-t-2xl',
        'px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3',
        className
      )}
      style={{
        paddingBottom: 'calc(0.625rem + env(safe-area-inset-bottom, 0px))',
        maxWidth: 'var(--mini-max-width, 100%)',
      }}
    >
      {/* Expand Button */}
      <button
        onClick={onExpand}
        className="w-9 h-9 flex items-center justify-center rounded-lg text-aether-muted hover:text-aether-text hover:bg-white/5 active:bg-white/10 transition-colors flex-shrink-0"
        aria-label="Expand player"
      >
        <ChevronUp className="w-4 h-4" />
      </button>

      {/* EQ + Station Info */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        <Equalizer isPlaying={displayPlaying} className="flex-shrink-0 scale-90" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-aether-text truncate">
            {displayRds || displayStationName}
          </p>
          <p className="text-[10px] sm:text-xs text-aether-muted font-mono truncate">
            {remoteConnected
              ? `Remote: ${remoteServerName}`
              : currentStation?.url.replace(/^https?:\/\//, '').split('/')[0]}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
        <button
          onClick={onPrev}
          className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full text-aether-muted hover:text-aether-text active:text-aether-indigo transition-colors"
          aria-label="Previous station"
        >
          <SkipBack className="w-4 h-4" />
        </button>
        <button
          onClick={onTogglePlay}
          className={cn(
            'w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full transition-all active:scale-95',
            'bg-aether-indigo text-white',
            displayPlaying && 'pulse-glow'
          )}
          aria-label={displayPlaying ? 'Pause' : 'Play'}
        >
          {displayPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>
        <button
          onClick={onNext}
          className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full text-aether-muted hover:text-aether-text active:text-aether-indigo transition-colors"
          aria-label="Next station"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
