'use client';

import { useAetherStore } from '@/store/aether-store';
import { ConnectionStatus } from './connection-status';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Play, Square, Wifi, Info, Radio } from 'lucide-react';

interface ServerViewProps {
  className?: string;
  serverRunning: boolean;
  onStartServer: () => void;
  onStopServer: () => void;
}

export function ServerView({ className, serverRunning, onStartServer, onStopServer }: ServerViewProps) {
  const { serverName, setServerName } = useAetherStore();

  return (
    <div className={cn('flex flex-col h-full overflow-y-auto aether-scroll gap-3', className)} style={{ padding: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}>
      {/* Server Status */}
      <div className="glass-panel">
        <div className="flex items-center gap-3 mb-4">
          <div className={cn(
            'w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0',
            serverRunning
              ? 'bg-aether-emerald/10 text-aether-emerald'
              : 'bg-white/5 text-aether-muted'
          )}>
            {serverRunning ? (
              <Wifi className="w-5 h-5 sm:w-6 sm:h-6" />
            ) : (
              <Radio className="w-5 h-5 sm:w-6 sm:h-6" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-fluid-lg font-semibold text-aether-text">Server Control</h2>
            <ConnectionStatus
              connected={serverRunning}
              label={serverRunning ? 'Server Live' : 'Offline'}
            />
          </div>
        </div>

        {serverRunning && (
          <div className="glass-panel-sm p-3 mb-4">
            <p className="text-xs text-aether-muted mb-1">Server ID</p>
            <p className="text-sm font-mono text-aether-indigo break-all">
              AETHER-ULTRA-{serverName}
            </p>
            <p className="text-xs text-aether-muted mt-2">
              Waiting for remote connections...
            </p>
            <p className="text-xs text-aether-muted mt-1">
              Switch to Player tab to control playback. Remotes will mirror your controls.
            </p>
          </div>
        )}

        {/* Server Name Input */}
        <div className="flex flex-col gap-1.5 sm:gap-2 mb-4">
          <label className="text-xs text-aether-muted font-medium">Server Name</label>
          <Input
            value={serverName}
            onChange={(e) => setServerName(e.target.value)}
            placeholder="MyRadioServer"
            disabled={serverRunning}
            className="bg-white/5 border-aether-border text-aether-text placeholder:text-aether-muted/60 focus-visible:border-aether-indigo/50 focus-visible:ring-aether-indigo/30 disabled:opacity-50"
          />
        </div>

        {/* Start/Stop Button */}
        {!serverRunning ? (
          <Button
            onClick={onStartServer}
            disabled={!serverName.trim()}
            className="w-full h-12 bg-aether-emerald hover:bg-aether-emerald/90 text-white text-sm font-medium rounded-xl"
          >
            <Play className="w-4 h-4 mr-2" />
            Start Server
          </Button>
        ) : (
          <Button
            onClick={onStopServer}
            className="w-full h-12 bg-aether-red/10 text-aether-red hover:bg-aether-red/20 border-0 text-sm font-medium rounded-xl"
          >
            <Square className="w-4 h-4 mr-2" />
            Stop Server
          </Button>
        )}
      </div>

      {/* How It Works */}
      <div className="glass-panel">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-5 h-5 text-aether-indigo flex-shrink-0" />
          <h3 className="text-fluid-base font-semibold text-aether-text">How It Works</h3>
        </div>
        <div className="flex flex-col gap-2.5 sm:gap-3 text-sm text-aether-muted">
          {[
            'Enter a unique server name and click Start Server',
            'Share your server name with friends or use auto-discover',
            'Use the Player tab to control playback locally',
            'Connected remotes receive all your playback commands',
            'Uses PeerJS for direct P2P connections — no central server needed',
          ].map((text, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-aether-indigo/10 text-aether-indigo flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                {i + 1}
              </div>
              <p className="leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Supported Commands */}
      <div className="glass-panel">
        <h3 className="text-fluid-base font-semibold text-aether-text mb-3">Remote Receives</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { cmd: 'PLAY', desc: 'Start playback' },
            { cmd: 'PAUSE', desc: 'Pause playback' },
            { cmd: 'NEXT', desc: 'Next station' },
            { cmd: 'PREV', desc: 'Previous station' },
            { cmd: 'VOLUME', desc: 'Set volume (0-1)' },
            { cmd: 'PLAY_STATION', desc: 'Play by URL' },
          ].map(({ cmd, desc }) => (
            <div key={cmd} className="glass-panel-sm p-2 sm:p-2.5">
              <p className="text-[11px] sm:text-xs font-mono text-aether-indigo">{cmd}</p>
              <p className="text-[11px] sm:text-xs text-aether-muted mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
