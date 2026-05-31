'use client';

import { useAetherStore } from '@/store/aether-store';
import { StationRow } from './station-row';
import { cn } from '@/lib/utils';
import { Radio } from 'lucide-react';

interface StationListProps {
  className?: string;
}

export function StationList({ className }: StationListProps) {
  const {
    stations,
    currentStation,
    isPlaying,
    playStation,
    setShowStationModal,
    setEditingStation,
    deleteStation,
    togglePlay,
  } = useAetherStore();

  const handleEdit = (station: typeof stations[number]) => {
    setEditingStation(station);
    setShowStationModal(true);
  };

  const handleDelete = (id: string) => {
    deleteStation(id);
  };

  const handleStationClick = (station: typeof stations[number]) => {
    if (currentStation?.id === station.id) {
      togglePlay();
    } else {
      playStation(station);
    }
  };

  return (
    <div className={cn('flex flex-col', className)}>
      {stations.length === 0 ? (
        <div className="glass-panel-sm flex flex-col items-center justify-center py-6 sm:py-8 px-4 text-center">
          <Radio className="w-8 h-8 text-aether-muted mb-2 sm:mb-3" />
          <p className="text-sm text-aether-muted">No stations saved yet</p>
          <p className="text-xs text-aether-muted/60 mt-1">
            Add stations manually or import a playlist
          </p>
        </div>
      ) : (
        <div className="station-grid">
          {stations.map((station) => (
            <StationRow
              key={station.id}
              station={station}
              isActive={currentStation?.id === station.id}
              isPlaying={currentStation?.id === station.id && isPlaying}
              onPlay={() => handleStationClick(station)}
              onEdit={() => handleEdit(station)}
              onDelete={() => handleDelete(station.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
