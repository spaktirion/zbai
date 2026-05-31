'use client';

import { cn } from '@/lib/utils';

interface EqualizerProps {
  isPlaying: boolean;
  className?: string;
}

const barHeights = [16, 28, 20, 32, 14, 24, 18];
const barDurations = [0.6, 0.8, 0.5, 0.7, 0.55, 0.65, 0.45];
const barDelays = [0, 0.15, 0.3, 0.1, 0.25, 0.2, 0.35];

export function Equalizer({ isPlaying, className }: EqualizerProps) {
  return (
    <div className={cn('flex items-end justify-center gap-[3px] h-10', className)}>
      {barHeights.map((height, i) => (
        <div
          key={i}
          className={cn(
            'w-[3px] rounded-full bg-aether-indigo eq-bar',
            isPlaying && 'playing'
          )}
          style={
            {
              '--eq-height': `${height}px`,
              '--eq-duration': `${barDurations[i]}s`,
              '--eq-delay': `${barDelays[i]}s`,
              height: '4px',
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
