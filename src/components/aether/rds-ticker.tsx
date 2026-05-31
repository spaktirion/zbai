'use client';

import { cn } from '@/lib/utils';

interface RdsTickerProps {
  text: string;
  isActive: boolean;
  className?: string;
}

export function RdsTicker({ text, isActive, className }: RdsTickerProps) {
  if (!text) return null;

  return (
    <div
      className={cn(
        'glass-panel-sm overflow-hidden w-full py-1.5 sm:py-2',
        className
      )}
    >
      <div className="overflow-hidden whitespace-nowrap">
        <span
          className={cn(
            'ticker-marquee inline-block text-aether-indigo font-mono text-[11px] sm:text-xs',
            isActive && 'active'
          )}
          style={
            {
              '--ticker-duration': `${Math.max(10, text.length * 0.15)}s`,
            } as React.CSSProperties
          }
        >
          {text} &nbsp;&nbsp; &#9835; &nbsp;&nbsp; {text} &nbsp;&nbsp; &#9835; &nbsp;&nbsp;
        </span>
      </div>
    </div>
  );
}
