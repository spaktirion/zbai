'use client';

import { useAetherStore } from '@/store/aether-store';
import { cn } from '@/lib/utils';
import { X, Info, CheckCircle, AlertTriangle } from 'lucide-react';

export function ToastContainer({ className }: { className?: string }) {
  const { toasts, removeToast } = useAetherStore();

  if (toasts.length === 0) return null;

  return (
    <div className={cn('fixed bottom-16 sm:bottom-20 left-0 right-0 z-50 flex flex-col items-center gap-2 pointer-events-none', className)}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="toast-animate pointer-events-auto glass-panel px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3 max-w-sm mx-3 sm:mx-4 shadow-xl"
          style={{ '--toast-duration': '3s' } as React.CSSProperties}
        >
          {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-aether-emerald flex-shrink-0" />}
          {toast.type === 'error' && <AlertTriangle className="w-4 h-4 text-aether-red flex-shrink-0" />}
          {toast.type === 'info' && <Info className="w-4 h-4 text-aether-indigo flex-shrink-0" />}
          <p className="text-sm text-aether-text flex-1">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="w-6 h-6 flex items-center justify-center rounded-full text-aether-muted hover:text-aether-text transition-colors flex-shrink-0"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
