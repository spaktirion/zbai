// PeerJS types for global declarations
declare const Peer: any;
declare const mqtt: any;

export interface ServerCallbacks {
  onStart: () => void;
  onStop: () => void;
  onError: (msg: string) => void;
  onRemoteConnected: () => void;
  onRemoteDisconnected: () => void;
  onCommand: (cmd: string, payload?: unknown) => void;
}

export interface RemoteCallbacks {
  onConnected: () => void;
  onDisconnected: () => void;
  onError: (msg: string) => void;
  onStatus: (status: any) => void;
}

export function createServer(name: string, callbacks: ServerCallbacks) {
  const peerId = `AETHER-ULTRA-${name}`;
  let peer: any = null;
  let connections: any[] = [];

  try {
    peer = new Peer(peerId);

    peer.on('open', () => {
      callbacks.onStart();
    });

    peer.on('connection', (conn: any) => {
      connections.push(conn);
      callbacks.onRemoteConnected();

      conn.on('data', (raw: any) => {
        // PeerJS may deliver ArrayBuffer — always parse to object
        let data: any = raw;
        if (raw instanceof ArrayBuffer) {
          try { data = JSON.parse(new TextDecoder().decode(raw)); } catch { return; }
        } else if (typeof raw === 'string') {
          try { data = JSON.parse(raw); } catch { data = raw; }
        }
        console.log('[AETHER-SERVER] received data:', JSON.stringify(data));
        if (data?.type === 'command') {
          // Deserialize payload if it was JSON-stringified
          let payload = data.payload;
          if (typeof payload === 'string') {
            try { payload = JSON.parse(payload); } catch { /* keep string */ }
          }
          callbacks.onCommand(data.command, payload);
        }
      });

      conn.on('close', () => {
        connections = connections.filter(c => c !== conn);
        callbacks.onRemoteDisconnected();
      });

      conn.on('error', () => {
        connections = connections.filter(c => c !== conn);
        callbacks.onRemoteDisconnected();
      });
    });

    peer.on('error', (err: any) => {
      if (err.type === 'unavailable-id') {
        callbacks.onError(`Server name "${name}" is already taken. Try a different name.`);
      } else if (err.type === 'peer-unavailable') {
        // ignore
      } else {
        callbacks.onError(`Server error: ${err.message || err.type}`);
      }
    });
  } catch (e) {
    callbacks.onError(`Failed to create server: ${e}`);
  }

  function broadcastStatus(status: object) {
    connections.forEach(conn => {
      try { conn.send({ type: 'status', ...status }); } catch { /* ignore */ }
    });
  }

  function stop() {
    connections.forEach(conn => {
      try { conn.close(); } catch { /* ignore */ }
    });
    connections = [];
    if (peer) {
      try { peer.destroy(); } catch { /* ignore */ }
      peer = null;
    }
    callbacks.onStop();
  }

  return { stop, broadcastStatus, peer };
}

export function createRemote(serverName: string, callbacks: RemoteCallbacks) {
  const serverId = `AETHER-ULTRA-${serverName}`;
  let peer: any = null;
  let conn: any = null;

  try {
    peer = new Peer();

    peer.on('open', () => {
      conn = peer.connect(serverId, { reliable: true });

      conn.on('open', () => {
        callbacks.onConnected();
      });

      conn.on('data', (raw: any) => {
        let data: any = raw;
        if (raw instanceof ArrayBuffer) {
          try { data = JSON.parse(new TextDecoder().decode(raw)); } catch { return; }
        } else if (typeof raw === 'string') {
          try { data = JSON.parse(raw); } catch { data = raw; }
        }
        if (data?.type === 'status') {
          callbacks.onStatus(data);
        }
      });

      conn.on('close', () => {
        callbacks.onDisconnected();
      });

      conn.on('error', (err: any) => {
        callbacks.onError(`Connection error: ${err.message || 'Unknown'}`);
        callbacks.onDisconnected();
      });
    });

    peer.on('error', (err: any) => {
      if (err.type === 'peer-unavailable') {
        callbacks.onError(`Server "${serverName}" not found. Make sure it's running.`);
      } else {
        callbacks.onError(`Remote error: ${err.message || err.type}`);
      }
    });
  } catch (e) {
    callbacks.onError(`Failed to create remote: ${e}`);
  }

  function sendCommand(command: string, payload?: unknown) {
    if (conn) {
      // JSON-serialize payload to survive PeerJS BinaryPack
      const serialized = payload != null ? JSON.stringify(payload) : payload;
      const msg = { type: 'command', command, payload: serialized };
      console.log('[AETHER-REMOTE] sending:', JSON.stringify(msg));
      try { conn.send(msg); } catch (e) { console.error('[AETHER-REMOTE] send error:', e); }
    } else {
      console.warn('[AETHER-REMOTE] sendCommand called but conn is null');
    }
  }

  function disconnect() {
    if (conn) {
      try { conn.close(); } catch { /* ignore */ }
      conn = null;
    }
    if (peer) {
      try { peer.destroy(); } catch { /* ignore */ }
      peer = null;
    }
    callbacks.onDisconnected();
  }

  return { disconnect, sendCommand };
}

// MQTT Auto-discover
export function startMqttDiscovery(onFound: (name: string) => void) {
  let client: any = null;

  try {
    client = mqtt.connect('wss://test.mosquitto.org:8081', {
      clientId: `aether-discover-${Math.random().toString(36).slice(2, 8)}`,
      clean: true,
      connectTimeout: 5000,
    });

    client.on('connect', () => {
      client.subscribe('aether/server/#');
    });

    client.on('message', (topic: string, message: Buffer) => {
      if (topic.startsWith('aether/server/')) {
        const name = topic.replace('aether/server/', '');
        try {
          const data = JSON.parse(message.toString());
          if (data.active && name) {
            onFound(name);
          }
        } catch { /* ignore */ }
      }
    });

    client.on('error', () => { /* ignore */ });
  } catch { /* ignore */ }

  function stop() {
    if (client) {
      try { client.end(); } catch { /* ignore */ }
      client = null;
    }
  }

  return { stop };
}

export function announceServerMqtt(name: string) {
  let client: any = null;

  try {
    client = mqtt.connect('wss://test.mosquitto.org:8081', {
      clientId: `aether-server-${name}-${Math.random().toString(36).slice(2, 8)}`,
      clean: true,
      connectTimeout: 5000,
      keepalive: 30,
    });

    client.on('connect', () => {
      client.publish(
        `aether/server/${name}`,
        JSON.stringify({ active: true, ts: Date.now() }),
        { qos: 0, retain: true }
      );

      // Announce periodically
      const interval = setInterval(() => {
        if (client?.connected) {
          client.publish(
            `aether/server/${name}`,
            JSON.stringify({ active: true, ts: Date.now() }),
            { qos: 0, retain: true }
          );
        } else {
          clearInterval(interval);
        }
      }, 25000);

      // Store for cleanup
      (client as any)._aetherInterval = interval;
    });

    client.on('error', () => { /* ignore */ });
  } catch { /* ignore */ }

  function stop() {
    if (client) {
      try {
        client.publish(`aether/server/${name}`, JSON.stringify({ active: false, ts: Date.now() }), { qos: 0, retain: true });
      } catch { /* ignore */ }
      try {
        clearInterval((client as any)._aetherInterval);
      } catch { /* ignore */ }
      try { client.end(); } catch { /* ignore */ }
      client = null;
    }
  }

  return { stop };
}

export { Peer, mqtt };
