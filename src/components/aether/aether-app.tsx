'use client';

import { useEffect, useState } from 'react';
import { useAetherStore } from '@/store/aether-store';
import { PlayerView } from './player-view';
import { ServerView } from './server-view';
import { RemoteView } from './remote-view';
import { ToastContainer } from './toast-container';
import { cn } from '@/lib/utils';
import { Radio, Server, Gamepad2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const tabs = [
  { id: 'player' as const, label: 'Player', icon: Radio },
  { id: 'server' as const, label: 'Server', icon: Server },
  { id: 'remote' as const, label: 'Remote', icon: Gamepad2 },
];

export function AetherApp() {
  const { currentView, navigate, initialize } = useAetherStore();
  const [isLandscape, setIsLandscape] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Track orientation for layout adaptation
  useEffect(() => {
    const check = () => {
      const landscape = window.innerWidth > window.innerHeight;
      const compact = landscape && window.innerHeight < 500;
      setIsLandscape(landscape);
      setIsCompact(compact);
    };

    check();

    const mql = window.matchMedia('(orientation: landscape)');
    const handler = () => check();
    mql.addEventListener('change', handler);
    window.addEventListener('resize', check);

    return () => {
      mql.removeEventListener('change', handler);
      window.removeEventListener('resize', check);
    };
  }, []);

  const viewVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  const tabIndex = tabs.findIndex(t => t.id === currentView);

  return (
    <div
      className={cn(
        'aether-container aether-bg',
        isCompact && 'landscape-compact'
      )}
    >
      {/* Header */}
      <header
        className="aether-header flex items-center justify-between flex-shrink-0"
        style={{
          padding: `max(0.75rem, env(safe-area-inset-top)) var(--app-padding) clamp(0.25rem, 0.8vw, 0.5rem)`,
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-aether-indigo/20 flex items-center justify-center">
            <Radio className="w-4 h-4 sm:w-5 sm:h-5 text-aether-indigo" />
          </div>
          <div>
            <h1 className="text-fluid-lg font-bold text-aether-text leading-tight">Aether Pro</h1>
            <p className="text-[10px] text-aether-muted font-mono">
              v0.3 &bull; Internet Radio
            </p>
          </div>
        </div>

        {/* Orientation indicator (subtle) */}
        {isLandscape && (
          <div className="text-[10px] text-aether-muted/40 font-mono hidden sm:block">
            {isCompact ? 'compact' : 'wide'}
          </div>
        )}
      </header>

      {/* Tab Navigation */}
      <nav
        className="aether-nav flex-shrink-0"
        style={{
          padding: `0 clamp(0.75rem, 2vw, 1.5rem) clamp(0.375rem, 1vw, 0.75rem)`,
        }}
      >
        <div className="tab-bar">
          {tabs.map((tab) => {
            const isActive = currentView === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.id)}
                className={cn(
                  'flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-aether-indigo text-white shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                    : 'text-aether-muted hover:text-aether-text hover:bg-white/5'
                )}
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* View Content */}
      <main className="flex-1 min-h-0 overflow-hidden relative" style={{ padding: `0 var(--app-padding)` }}>
        <AnimatePresence mode="wait" custom={tabIndex}>
          <motion.div
            key={currentView}
            custom={tabIndex}
            variants={viewVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute inset-0"
            style={{ padding: '0 var(--app-padding)' }}
          >
            <div className="h-full" style={{ margin: '0 calc(-1 * var(--app-padding))' }}>
              {currentView === 'player' && <PlayerView className="h-full" />}
              {currentView === 'server' && <ServerView className="h-full" />}
              {currentView === 'remote' && <RemoteView className="h-full" />}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Toasts */}
      <ToastContainer />
    </div>
  );
}
