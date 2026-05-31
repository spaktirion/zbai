'use client';

import { cn } from '@/lib/utils';
import { Station } from '@/types/station';
import { Play, Pause, Pencil, Trash2, Radio } from 'lucide-react';

interface StationRowProps {
  station: Station;
  isActive: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  onEdit: () => void;
  onDelete: () => void;
  className?: string;
}

export function StationRow({
  station,
  isActive,
  isPlaying,
  onPlay,
  onEdit,
  onDelete,
  className,
}: StationRowProps) {
  return (
    <div
      className={cn(
        'glass-panel-sm flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 transition-all duration-200 group overflow-hidden',
        isActive && 'border-aether-indigo/40 shadow-[0_0_12px_rgba(99,102,241,0.15)]',
        !isActive && 'hover:border-aether-border/60 hover:bg-white/[0.02] active:bg-white/[0.04]',
        className
      )}
    >
      {/* Play/Pause Button */}
      <button
        onClick={onPlay}
        className={cn(
          'flex-shrink-0 flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full transition-all duration-200 active:scale-95',
          isActive
            ? 'bg-aether-indigo text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]'
            : 'bg-white/5 text-aether-muted hover:text-aether-text hover:bg-white/10'
        )}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isActive && isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4 ml-0.5" />
        )}
      </button>

      {/* Station Info */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm font-medium truncate',
          isActive ? 'text-aether-indigo' : 'text-aether-text'
        )}>
          {station.name}
        </p>
        <p className="text-[11px] sm:text-xs text-aether-muted truncate font-mono">
          {station.url.replace(/^https?:\/\//, '').split('/')[0]}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
        {isActive && isPlaying && (
          <Radio className="w-3 h-3 text-aether-indigo mr-0.5 animate-pulse" />
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg text-aether-muted hover:text-aether-text hover:bg-white/5 active:bg-white/10 transition-colors"
          aria-label="Edit station"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg text-aether-muted hover:text-aether-red hover:bg-aether-red/10 active:bg-aether-red/20 transition-colors"
          aria-label="Delete station"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
