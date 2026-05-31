'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAetherStore } from '@/store/aether-store';
import { useAudio } from '@/hooks/use-audio';
import { createServer, announceServerMqtt, createRemote, startMqttDiscovery } from '@/lib/peer-utils';
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
  const { currentView, navigate, initialize, remoteConnected } = useAetherStore();
  const [isLandscape, setIsLandscape] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  // ─── AUDIO (lives here, persists across all tabs) ───
  const { toggle: audioToggle, changeVolume: audioChangeVolume } = useAudio();

  // ─── SERVER (lives here, persists across all tabs) ───
  const {
    serverName,
    serverRunning,
    setServerRunning,
    addToast,
    _setSendRemoteCommand,
  } = useAetherStore();

  const serverRef = useRef<ReturnType<typeof createServer> | null>(null);
  const mqttServerRef = useRef<ReturnType<typeof announceServerMqtt> | null>(null);
  const broadcastRef = useRef<((status: object) => void) | null>(null);

  const startServer = useCallback(() => {
    if (!serverName.trim()) {
      addToast('Please enter a server name', 'error');
      return;
    }

    const server = createServer(serverName.trim(), {
      onStart: () => {
        setServerRunning(true);
        addToast(`Server "${serverName.trim()}" is live!`, 'success');
        if (mqttServerRef.current) mqttServerRef.current.stop();
        mqttServerRef.current = announceServerMqtt(serverName.trim());
      },
      onStop: () => {
        setServerRunning(false);
        if (mqttServerRef.current) {
          mqttServerRef.current.stop();
          mqttServerRef.current = null;
        }
      },
      onError: (msg) => {
        addToast(msg, 'error');
        setServerRunning(false);
      },
      onRemoteConnected: () => {
        addToast('Remote connected!', 'success');
      },
      onRemoteDisconnected: () => {
        addToast('Remote disconnected', 'info');
      },
      onCommand: (cmd, _payload) => {
        const store = useAetherStore.getState();
        switch (cmd) {
          case 'PLAY':
            if (!store.isPlaying) store.togglePlay();
            break;
          case 'PAUSE':
            if (store.isPlaying) store.togglePlay();
            break;
          case 'NEXT':
            store.nextStation();
            break;
          case 'PREV':
            store.prevStation();
            break;
          case 'VOLUME':
            store.setVolume(typeof _payload === 'number' ? _payload : 0.8);
            break;
          case 'PLAY_STATION':
            if (typeof _payload === 'string') {
              const station = store.stations.find(s => s.url === _payload);
              if (station) store.playStation(station);
            }
            break;
        }
      },
    });

    serverRef.current = server;
    broadcastRef.current = server.broadcastStatus;
  }, [serverName, setServerRunning, addToast]);

  const stopServer = useCallback(() => {
    if (serverRef.current) {
      serverRef.current.stop();
      serverRef.current = null;
      broadcastRef.current = null;
    }
  }, []);

  // Broadcast status to remotes periodically
  useEffect(() => {
    if (!serverRunning || !broadcastRef.current) return;
    const interval = setInterval(() => {
      const store = useAetherStore.getState();
      broadcastRef.current?.({
        station: store.currentStation?.name || null,
        playing: store.isPlaying,
        volume: store.volume,
        rds: store.rdsText,
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [serverRunning]);

  // ─── REMOTE (lives here, persists across all tabs) ───
  const {
    setRemoteConnected,
    setRemoteServerName,
    addServerHistory,
  } = useAetherStore();

  const [remoteStatus, setRemoteStatus] = useState<{
    station: string | null;
    playing: boolean;
    volume: number;
    rds: string;
  } | null>(null);

  const remoteRef = useRef<ReturnType<typeof createRemote> | null>(null);

  const connectRemote = useCallback((name: string) => {
    if (!name.trim()) {
      addToast('Please enter a server name', 'error');
      return;
    }

    // Disconnect existing if any
    if (remoteRef.current) {
      remoteRef.current.disconnect();
      remoteRef.current = null;
    }

    const cleanName = name.trim();
    setRemoteServerName(cleanName);

    const remote = createRemote(cleanName, {
      onConnected: () => {
        setRemoteConnected(true);
        addServerHistory(cleanName);
        addToast(`Connected to "${cleanName}"`, 'success');
        // Pause local audio when connecting as remote
        if (useAetherStore.getState().isPlaying) {
          useAetherStore.setState({ isPlaying: false });
        }
      },
      onDisconnected: () => {
        setRemoteConnected(false);
        setRemoteStatus(null);
        setRemoteServerName('');
        remoteRef.current = null;
        _setSendRemoteCommand(() => () => {});
        useAetherStore.getState().clearRemoteStatus();
      },
      onError: (msg) => {
        addToast(msg, 'error');
        setRemoteConnected(false);
        setRemoteServerName('');
        remoteRef.current = null;
        useAetherStore.getState().clearRemoteStatus();
      },
      onStatus: (status) => {
        setRemoteStatus({
          station: status.station || null,
          playing: status.playing || false,
          volume: status.volume ?? 0.8,
          rds: status.rds || '',
        });
        // Sync to store so player UI updates
        useAetherStore.getState().updateRemoteStatus({
          station: status.station || null,
          playing: status.playing || false,
          volume: status.volume ?? 0.8,
          rds: status.rds || '',
        });
      },
    });

    remoteRef.current = remote;

    // Wire up sendRemoteCommand in the store so player-view can use it
    _setSendRemoteCommand((command: string, payload?: unknown) => {
      if (remoteRef.current) {
        remoteRef.current.sendCommand(command, payload);
      }
    });
  }, [setRemoteConnected, setRemoteServerName, addServerHistory, addToast, _setSendRemoteCommand]);

  const disconnectRemote = useCallback(() => {
    if (remoteRef.current) {
      remoteRef.current.disconnect();
      remoteRef.current = null;
    }
  }, []);

  // ─── INIT & ORIENTATION ───
  useEffect(() => {
    initialize();
  }, [initialize]);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (serverRef.current) serverRef.current.stop();
      if (mqttServerRef.current) mqttServerRef.current.stop();
      if (remoteRef.current) remoteRef.current.disconnect();
    };
  }, []);

  // ─── SMART PLAYER ACTIONS ───
  // If remote connected → send command to remote server
  // If not remote → control local audio
  const togglePlay = useCallback(() => {
    if (remoteConnected) {
      // Use server's playing state, not local
      const store = useAetherStore.getState();
      useAetherStore.getState().sendRemoteCommand(store.remotePlaying ? 'PAUSE' : 'PLAY');
    } else {
      audioToggle();
    }
  }, [remoteConnected, audioToggle]);

  const changeVolume = useCallback((v: number) => {
    if (remoteConnected) {
      useAetherStore.getState().sendRemoteCommand('VOLUME', v);
      // Update local display immediately
      useAetherStore.getState().updateRemoteStatus({
        ...useAetherStore.getState(),
        volume: v,
        station: useAetherStore.getState().remoteStationDisplay || null,
        playing: useAetherStore.getState().remotePlaying,
        rds: useAetherStore.getState().remoteRds,
      });
    } else {
      audioChangeVolume(v);
    }
  }, [remoteConnected, audioChangeVolume]);

  const nextStation = useCallback(() => {
    if (remoteConnected) {
      useAetherStore.getState().sendRemoteCommand('NEXT');
    } else {
      useAetherStore.getState().nextStation();
    }
  }, [remoteConnected]);

  const prevStation = useCallback(() => {
    if (remoteConnected) {
      useAetherStore.getState().sendRemoteCommand('PREV');
    } else {
      useAetherStore.getState().prevStation();
    }
  }, [remoteConnected]);

  const playStation = useCallback((station: { url: string } | null) => {
    if (remoteConnected && station) {
      useAetherStore.getState().sendRemoteCommand('PLAY_STATION', station.url);
    } else if (station) {
      useAetherStore.getState().playStation(station);
    }
  }, [remoteConnected]);

  // ─── RENDER ───
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

        {remoteConnected && (
          <div className="px-2 py-1 rounded-md bg-aether-emerald/10 text-aether-emerald text-[10px] font-medium flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-aether-emerald animate-pulse" />
            REMOTE
          </div>
        )}

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
              {currentView === 'player' && (
                <PlayerView
                  className="h-full"
                  onTogglePlay={togglePlay}
                  onNext={nextStation}
                  onPrev={prevStation}
                  onVolumeChange={changeVolume}
                  onPlayStation={playStation}
                />
              )}
              {currentView === 'server' && (
                <ServerView
                  className="h-full"
                  serverRunning={serverRunning}
                  onStartServer={startServer}
                  onStopServer={stopServer}
                />
              )}
              {currentView === 'remote' && (
                <RemoteView
                  className="h-full"
                  remoteStatus={remoteStatus}
                  onConnect={connectRemote}
                  onDisconnect={disconnectRemote}
                />
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Toasts */}
      <ToastContainer />
    </div>
  );
}
