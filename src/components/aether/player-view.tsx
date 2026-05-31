'use client';

import { useRef, useCallback, useEffect } from 'react';
import { useAetherStore } from '@/store/aether-store';
import { AudioPlayer } from './audio-player';
import { MiniPlayer } from './mini-player';
import { RdsTicker } from './rds-ticker';
import { StationSearch } from './station-search';
import { StationList } from './station-list';
import { StationModal } from './station-modal';
import { cn } from '@/lib/utils';
import { Plus, Upload } from 'lucide-react';
import type { Station } from '@/types/station';

interface PlayerViewProps {
  className?: string;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onVolumeChange: (v: number) => void;
  onPlayStation: (station: Station | null) => void;
}

export function PlayerView({
  className,
  onTogglePlay,
  onNext,
  onPrev,
  onVolumeChange,
  onPlayStation,
}: PlayerViewProps) {
  const {
    isPlaying,
    rdsText,
    currentStation,
    miniPlayer,
    setMiniPlayer,
    setShowStationModal,
    remoteConnected,
    remotePlaying,
    remoteRds,
    remoteStationDisplay,
  } = useAetherStore();

  const scrollRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<HTMLDivElement>(null);

  // Handle scroll to trigger mini player (portrait: player-layout scrolls; desktop: stations-area scrolls)
  const handleScroll = useCallback(() => {
    const el = layoutRef.current || scrollRef.current;
    if (!el) return;
    const { scrollTop } = el;
    setMiniPlayer(scrollTop > 80);
  }, [setMiniPlayer]);

  // Reset mini player when station changes
  useEffect(() => {
    setMiniPlayer(false);
  }, [currentStation?.id, setMiniPlayer]);

  return (
    <div className={cn('flex flex-col h-full overflow-hidden', className)}>
      {/* RDS Ticker */}
      <div className="ticker-wrap px-1 pt-1">
        <RdsTicker
          text={remoteConnected
            ? (remoteRds || remoteStationDisplay)
            : (rdsText || currentStation?.name || '')}
          isActive={remoteConnected ? remotePlaying : isPlaying}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 overflow-hidden" style={{ padding: '0 clamp(0.25rem, 1vw, 0.5rem)' }}>
        <div ref={layoutRef} onScroll={handleScroll} className="player-layout h-full">

          {/* ── Player Controls (hidden in portrait when mini player is showing) ── */}
          <div className={cn('player-controls-area', miniPlayer && 'player-controls-hidden')}>
            <div className="glass-panel">
              <AudioPlayer
                onTogglePlay={onTogglePlay}
                onNext={onNext}
                onPrev={onPrev}
                onVolumeChange={onVolumeChange}
              />
            </div>
          </div>

          {/* ── Stations (independently scrollable on desktop, part of main scroll on phone) ── */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="player-stations-area flex flex-col gap-3 min-w-0 pb-20"
          >
            {/* Action Buttons */}
            <div className="action-buttons">
              <button
                onClick={() => {
                  useAetherStore.getState().setEditingStation(null);
                  setShowStationModal(true);
                }}
                className="btn-add h-11 rounded-xl bg-aether-indigo/10 text-aether-indigo hover:bg-aether-indigo/20 active:bg-aether-indigo/30 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Plus className="w-4 h-4 flex-shrink-0" />
                <span>Add Station</span>
              </button>
              <button
                onClick={() => {
                  useAetherStore.getState().setEditingStation(null);
                  useAetherStore.getState().setShowStationModal(true);
                }}
                className="btn-import h-11 px-4 rounded-xl bg-white/5 text-aether-muted hover:bg-white/10 hover:text-aether-text active:bg-white/15 transition-colors flex items-center justify-center gap-2 text-sm font-medium flex-shrink-0"
              >
                <Upload className="w-4 h-4 flex-shrink-0" />
                <span>Import</span>
              </button>
            </div>

            {/* Search */}
            <StationSearch />

            {/* Station List */}
            <StationList />
          </div>
        </div>
      </div>

      {/* Station Modal (Add/Edit/Delete/Import) */}
      <StationModal />

      {/* Mini Player — shows in portrait when scrolled past player controls */}
      {miniPlayer && (remoteConnected ? !!remoteStationDisplay : !!currentStation) && (
        <MiniPlayer
          onExpand={() => {
            const target = layoutRef.current || scrollRef.current;
            if (target) target.scrollTo({ top: 0, behavior: 'smooth' });
            setMiniPlayer(false);
          }}
          onTogglePlay={onTogglePlay}
          onNext={onNext}
          onPrev={onPrev}
        />
      )}
    </div>
  );
}
