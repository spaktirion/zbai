'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAetherStore } from '@/store/aether-store';
import { startMqttDiscovery } from '@/lib/peer-utils';
import { ConnectionStatus } from './connection-status';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link2, Unplug, Search, Loader2, Wifi, Clock, Radio, Info } from 'lucide-react';

interface RemoteViewProps {
  className?: string;
  remoteStatus: {
    station: string | null;
    playing: boolean;
    volume: number;
    rds: string;
  } | null;
  onConnect: (name: string) => void;
  onDisconnect: () => void;
}

export function RemoteView({ className, remoteStatus, onConnect, onDisconnect }: RemoteViewProps) {
  const {
    remoteConnected,
    remoteServerName,
    serverHistory,
    addToast,
  } = useAetherStore();

  const [connectName, setConnectName] = useState('');
  const [discovering, setDiscovering] = useState(false);
  const [discoveredServers, setDiscoveredServers] = useState<string[]>([]);
  const mqttRef = useRef<ReturnType<typeof startMqttDiscovery> | null>(null);

  const handleConnect = useCallback((name: string) => {
    if (!name.trim()) {
      addToast('Please enter a server name', 'error');
      return;
    }
    onConnect(name.trim());
  }, [onConnect, addToast]);

  // Auto-discover via MQTT
  const startDiscovery = useCallback(() => {
    setDiscovering(true);
    setDiscoveredServers([]);

    const mqtt = startMqttDiscovery((name) => {
      setDiscoveredServers(prev => {
        if (prev.includes(name)) return prev;
        return [...prev, name];
      });
    });

    mqttRef.current = mqtt;

    setTimeout(() => {
      setDiscovering(false);
      if (mqttRef.current) {
        mqttRef.current.stop();
        mqttRef.current = null;
      }
    }, 15000);
  }, []);

  const stopDiscovery = useCallback(() => {
    setDiscovering(false);
    if (mqttRef.current) {
      mqttRef.current.stop();
      mqttRef.current = null;
    }
  }, []);

  // Cleanup MQTT on unmount
  useEffect(() => {
    return () => {
      if (mqttRef.current) mqttRef.current.stop();
    };
  }, []);

  return (
    <div className={cn('flex flex-col h-full overflow-y-auto aether-scroll gap-3', className)} style={{ padding: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}>
      {/* Connection Status */}
      <div className="glass-panel">
        <div className="flex items-center gap-3 mb-4">
          <div className={cn(
            'w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0',
            remoteConnected
              ? 'bg-aether-emerald/10 text-aether-emerald'
              : 'bg-white/5 text-aether-muted'
          )}>
            {remoteConnected ? (
              <Wifi className="w-5 h-5 sm:w-6 sm:h-6" />
            ) : (
              <Link2 className="w-5 h-5 sm:w-6 sm:h-6" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-fluid-lg font-semibold text-aether-text">Remote Control</h2>
            <ConnectionStatus
              connected={remoteConnected}
              label={remoteConnected ? `Connected to ${remoteServerName}` : 'Not Connected'}
            />
          </div>
          {remoteConnected && (
            <Button
              onClick={onDisconnect}
              variant="destructive"
              size="sm"
              className="bg-aether-red/10 text-aether-red hover:bg-aether-red/20 border-0 flex-shrink-0"
            >
              <Unplug className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Disconnect</span>
            </Button>
          )}
        </div>

        {/* Connected Remote Status (read-only) */}
        {remoteConnected && remoteStatus && (
          <div className="glass-panel-sm p-3 sm:p-4 mb-4">
            <p className="text-xs text-aether-muted mb-2">Server Now Playing</p>
            <p className="text-sm font-medium text-aether-text">
              {remoteStatus.station || 'Nothing'}
            </p>
            {remoteStatus.rds && (
              <p className="text-xs text-aether-muted mt-1 font-mono">{remoteStatus.rds}</p>
            )}
            <div className="flex items-center gap-3 mt-3">
              <ConnectionStatus
                connected={remoteStatus.playing}
                label={remoteStatus.playing ? 'Playing' : 'Paused'}
              />
              <span className="text-xs text-aether-muted font-mono">
                Vol: {Math.round(remoteStatus.volume * 100)}%
              </span>
            </div>
            <p className="text-xs text-aether-indigo mt-3 flex items-center gap-1.5">
              <Radio className="w-3 h-3" />
              Switch to Player tab to control the server
            </p>
          </div>
        )}

        {/* Connect Input */}
        {!remoteConnected && (
          <>
            <div className="flex flex-col gap-1.5 sm:gap-2 mb-4">
              <label className="text-xs text-aether-muted font-medium">Server Name</label>
              <div className="flex gap-2">
                <Input
                  value={connectName}
                  onChange={(e) => setConnectName(e.target.value)}
                  placeholder="Enter server name..."
                  onKeyDown={(e) => e.key === 'Enter' && handleConnect(connectName)}
                  className="flex-1 bg-white/5 border-aether-border text-aether-text placeholder:text-aether-muted/60 focus-visible:border-aether-indigo/50 focus-visible:ring-aether-indigo/30"
                />
                <Button
                  onClick={() => handleConnect(connectName)}
                  disabled={!connectName.trim()}
                  className="bg-aether-indigo hover:bg-aether-indigo/90 text-white flex-shrink-0"
                >
                  <Link2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Auto Discover */}
            <div className="flex flex-col gap-2 mb-4">
              <Button
                onClick={discovering ? stopDiscovery : startDiscovery}
                variant="outline"
                className="w-full bg-white/5 border-aether-border text-aether-muted hover:bg-white/10 hover:text-aether-text h-11"
              >
                {discovering ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Auto-Discover Servers
                  </>
                )}
              </Button>

              {discovering && (
                <div className="flex items-center justify-center py-3">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 rounded-full border border-aether-indigo/30 scan-ring" />
                    <div className="absolute inset-0 rounded-full border border-aether-indigo/30 scan-ring" />
                    <div className="absolute inset-0 rounded-full border border-aether-indigo/30 scan-ring" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Radio className="w-4 h-4 text-aether-indigo" />
                    </div>
                  </div>
                </div>
              )}

              {discoveredServers.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  {discoveredServers.map(name => (
                    <button
                      key={name}
                      onClick={() => {
                        setConnectName(name);
                        handleConnect(name);
                      }}
                      className="glass-panel-sm px-3 sm:px-4 py-2 sm:py-2.5 text-left hover:border-aether-indigo/30 active:bg-white/[0.03] transition-colors"
                    >
                      <p className="text-sm text-aether-text">{name}</p>
                      <p className="text-[11px] sm:text-xs text-aether-muted font-mono">AETHER-ULTRA-{name}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Server History */}
      {serverHistory.length > 0 && !remoteConnected && (
        <div className="glass-panel">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-aether-indigo flex-shrink-0" />
            <h3 className="text-fluid-base font-semibold text-aether-text">Recent Servers</h3>
          </div>
          <div className="flex flex-col gap-1.5">
            {serverHistory.map(name => (
              <button
                key={name}
                onClick={() => {
                  setConnectName(name);
                  handleConnect(name);
                }}
                className="glass-panel-sm px-3 sm:px-4 py-2 sm:py-2.5 text-left hover:border-aether-indigo/30 active:bg-white/[0.03] transition-colors flex items-center gap-2"
              >
                <Wifi className="w-3.5 h-3.5 text-aether-muted flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-aether-text truncate">{name}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* How Remote Works */}
      <div className="glass-panel">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-5 h-5 text-aether-indigo flex-shrink-0" />
          <h3 className="text-fluid-base font-semibold text-aether-text">About Remote</h3>
        </div>
        <p className="text-sm text-aether-muted leading-relaxed">
          Connect to a running Aether Pro server to control it remotely.
          Once connected, switch to the Player tab — your play/pause, skip, and volume controls will
          be sent to the server instead of playing locally. Disconnect here to return to local playback.
          Connections use PeerJS for direct peer-to-peer communication.
        </p>
      </div>
    </div>
  );
}
