'use client';

import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  connected: boolean;
  label?: string;
  className?: string;
}

export function ConnectionStatus({ connected, label, className }: ConnectionStatusProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'w-2.5 h-2.5 rounded-full',
          connected
            ? 'bg-aether-emerald shadow-[0_0_8px_rgba(16,185,129,0.5)]'
            : 'bg-aether-red shadow-[0_0_8px_rgba(239,68,68,0.5)]'
        )}
      />
      <span className={cn(
        'text-xs font-mono',
        connected ? 'text-aether-emerald' : 'text-aether-red'
      )}>
        {label || (connected ? 'Connected' : 'Disconnected')}
      </span>
    </div>
  );
}
