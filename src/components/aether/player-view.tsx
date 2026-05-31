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

  // Handle scroll to trigger mini player
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop } = scrollRef.current;
    setMiniPlayer(scrollTop > 100);
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

      {/* Main Content - scrollable */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto aether-scroll pb-4"
        style={{ padding: '0 clamp(0.25rem, 1vw, 0.5rem)' }}
      >
        <div className="player-layout min-h-full">
          {/* Player Controls Area */}
          <div className="player-controls-area flex-shrink-0">
            <div className="glass-panel">
              <AudioPlayer
                onTogglePlay={onTogglePlay}
                onNext={onNext}
                onPrev={onPrev}
                onVolumeChange={onVolumeChange}
              />
            </div>
          </div>

          {/* Stations Area */}
          <div className="player-stations-area flex-1 flex flex-col gap-3 min-w-0 pb-20">
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

      {/* Mini Player (sticky at bottom when scrolled) */}
      {miniPlayer && (remoteConnected ? !!remoteStationDisplay : !!currentStation) && (
        <MiniPlayer
          onExpand={() => {
            if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
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
