import { create } from 'zustand';
import { Station, AppView } from '@/types/station';

const SAVED_KEY = 'aether_v02_saved';
const LEGACY_KEY = 'aether_v103_favorites';
const SERVER_NAME_KEY = 'aether_server_name';
const HISTORY_KEY = 'aether_history';

function loadStations(): Station[] {
  if (typeof window === 'undefined') return [];
  try {
    // Migration from legacy
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      try {
        const parsed = JSON.parse(legacy);
        if (Array.isArray(parsed)) {
          const migrated = parsed.map((s: any) => ({
            id: s.id || crypto.randomUUID(),
            name: s.name || s.stationName || 'Unknown',
            url: s.url || s.stationUrl || '',
            rdsUrl: s.rdsUrl || undefined,
          }));
          localStorage.setItem(SAVED_KEY, JSON.stringify(migrated));
          localStorage.removeItem(LEGACY_KEY);
          return migrated;
        }
      } catch { /* ignore */ }
    }
    const raw = localStorage.getItem(SAVED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveStations(stations: Station[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SAVED_KEY, JSON.stringify(stations));
}

function loadServerName(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(SERVER_NAME_KEY) || '';
}

function saveServerName(name: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SERVER_NAME_KEY, name);
}

function loadHistory(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveHistory(history: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 5)));
}

interface SearchStation {
  name: string;
  url: string;
  country?: string;
  favicon?: string;
}

interface AetherState {
  // Stations
  stations: Station[];
  currentStation: Station | null;
  currentStationIndex: number;

  // Playback
  isPlaying: boolean;
  volume: number;
  rdsText: string;

  // Search
  searchResults: SearchStation[];
  searchLoading: boolean;

  // Navigation
  currentView: AppView;

  // Server
  serverName: string;
  serverRunning: boolean;

  // Remote
  remoteConnected: boolean;
  remoteServerName: string;
  serverHistory: string[];
  sendRemoteCommand: (command: string, payload?: unknown) => void;
  // Remote display (synced from server status)
  remoteStationDisplay: string;
  remotePlaying: boolean;
  remoteRds: string;
  remoteVolume: number;

  // UI
  showStationModal: boolean;
  editingStation: Station | null;
  miniPlayer: boolean;
  toasts: Array<{ id: string; message: string; type: 'info' | 'success' | 'error' }>;

  // Actions
  initialize: () => void;
  playStation: (station: Station) => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
  setRdsText: (text: string) => void;
  nextStation: () => void;
  prevStation: () => void;
  addStation: (station: Station) => void;
  editStation: (station: Station) => void;
  deleteStation: (id: string) => void;
  importStations: (newStations: Station[]) => void;
  navigate: (view: AppView) => void;
  setSearchResults: (results: SearchStation[]) => void;
  setSearchLoading: (loading: boolean) => void;
  setServerName: (name: string) => void;
  setServerRunning: (running: boolean) => void;
  setRemoteConnected: (connected: boolean) => void;
  setRemoteServerName: (name: string) => void;
  addServerHistory: (name: string) => void;
  setShowStationModal: (show: boolean) => void;
  setEditingStation: (station: Station | null) => void;
  setMiniPlayer: (mini: boolean) => void;
  addToast: (message: string, type?: 'info' | 'success' | 'error') => void;
  removeToast: (id: string) => void;
  _setSendRemoteCommand: (fn: (command: string, payload?: unknown) => void) => void;
  updateRemoteStatus: (status: { station: string | null; playing: boolean; volume: number; rds: string }) => void;
  clearRemoteStatus: () => void;
}

export const useAetherStore = create<AetherState>((set, get) => ({
  // Initial state
  stations: [],
  currentStation: null,
  currentStationIndex: -1,
  isPlaying: false,
  volume: 0.8,
  rdsText: '',
  searchResults: [],
  searchLoading: false,
  currentView: 'player',
  serverName: '',
  serverRunning: false,
  remoteConnected: false,
  remoteServerName: '',
  serverHistory: [],
  remoteStationDisplay: '',
  remotePlaying: false,
  remoteRds: '',
  remoteVolume: 0.8,
  showStationModal: false,
  editingStation: null,
  miniPlayer: false,
  toasts: [],

  initialize: () => {
    const stations = loadStations();
    const serverName = loadServerName();
    const serverHistory = loadHistory();
    set({ stations, serverName, serverHistory });
  },

  playStation: (station) => {
    const { stations } = get();
    const index = stations.findIndex(s => s.id === station.id);
    set({
      currentStation: station,
      currentStationIndex: index >= 0 ? index : -1,
      isPlaying: true,
      rdsText: station.name,
      miniPlayer: false,
    });
  },

  togglePlay: () => set(state => ({ isPlaying: !state.isPlaying })),

  setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),

  setRdsText: (text) => set({ rdsText: text }),

  nextStation: () => {
    const { stations, currentStationIndex, isPlaying } = get();
    if (stations.length === 0) return;
    const next = (currentStationIndex + 1) % stations.length;
    const station = stations[next];
    set({
      currentStation: station,
      currentStationIndex: next,
      isPlaying,
      rdsText: station.name,
    });
  },

  prevStation: () => {
    const { stations, currentStationIndex, isPlaying } = get();
    if (stations.length === 0) return;
    const prev = currentStationIndex <= 0 ? stations.length - 1 : currentStationIndex - 1;
    const station = stations[prev];
    set({
      currentStation: station,
      currentStationIndex: prev,
      isPlaying,
      rdsText: station.name,
    });
  },

  addStation: (station) => {
    const { stations } = get();
    const updated = [...stations, station];
    saveStations(updated);
    set({ stations: updated });
    get().addToast(`Added "${station.name}"`, 'success');
  },

  editStation: (station) => {
    const { stations } = get();
    const updated = stations.map(s => s.id === station.id ? station : s);
    saveStations(updated);
    set({
      stations: updated,
      currentStation: get().currentStation?.id === station.id ? station : get().currentStation,
    });
    get().addToast(`Updated "${station.name}"`, 'success');
  },

  deleteStation: (id) => {
    const { stations, currentStation, currentStationIndex } = get();
    const updated = stations.filter(s => s.id !== id);
    saveStations(updated);
    let newCurrent = currentStation;
    let newIndex = currentStationIndex;
    if (currentStation?.id === id) {
      if (updated.length > 0) {
        newIndex = Math.min(currentStationIndex, updated.length - 1);
        newCurrent = updated[newIndex];
      } else {
        newCurrent = null;
        newIndex = -1;
      }
    } else if (currentStationIndex > updated.length - 1) {
      newIndex = updated.length - 1;
    }
    set({
      stations: updated,
      currentStation: newCurrent,
      currentStationIndex: newIndex,
      isPlaying: updated.length === 0 ? false : get().isPlaying,
    });
  },

  importStations: (newStations) => {
    const { stations } = get();
    const existingUrls = new Set(stations.map(s => s.url));
    const toAdd = newStations.filter(s => !existingUrls.has(s.url));
    const updated = [...stations, ...toAdd];
    saveStations(updated);
    set({ stations: updated });
    get().addToast(`Imported ${toAdd.length} station${toAdd.length !== 1 ? 's' : ''}`, 'success');
  },

  navigate: (view) => set({ currentView: view }),

  setSearchResults: (results) => set({ searchResults: results }),
  setSearchLoading: (loading) => set({ searchLoading: loading }),

  setServerName: (name) => {
    saveServerName(name);
    set({ serverName: name });
  },

  setServerRunning: (running) => set({ serverRunning: running }),

  setRemoteConnected: (connected) => set({ remoteConnected: connected }),

  setRemoteServerName: (name) => set({ remoteServerName: name }),

  sendRemoteCommand: (_command, _payload) => {
    // no-op by default; overwritten by aether-app when remote is active
  },

  _setSendRemoteCommand: (fn) => set({ sendRemoteCommand: fn }),

  updateRemoteStatus: (status) => set({
    remoteStationDisplay: status.station || '',
    remotePlaying: status.playing,
    remoteRds: status.rds,
    remoteVolume: status.volume,
  }),

  clearRemoteStatus: () => set({
    remoteStationDisplay: '',
    remotePlaying: false,
    remoteRds: '',
    remoteVolume: 0.8,
  }),

  addServerHistory: (name) => {
    const { serverHistory } = get();
    const updated = [name, ...serverHistory.filter(n => n !== name)];
    saveHistory(updated);
    set({ serverHistory: updated });
  },

  setShowStationModal: (show) => set({ showStationModal: show }),

  setEditingStation: (station) => set({ editingStation: station }),

  setMiniPlayer: (mini) => set({ miniPlayer: mini }),

  addToast: (message, type = 'info') => {
    const id = crypto.randomUUID();
    set(state => ({
      toasts: [...state.toasts, { id, message, type }],
    }));
    setTimeout(() => get().removeToast(id), 3000);
  },

  removeToast: (id) => {
    set(state => ({
      toasts: state.toasts.filter(t => t.id !== id),
    }));
  },
}));
