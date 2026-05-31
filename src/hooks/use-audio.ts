'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAetherStore } from '@/store/aether-store';

export function useAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rdsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    currentStation,
    isPlaying,
    volume,
    remoteConnected,
    playStation: storePlayStation,
    togglePlay: storeTogglePlay,
    setRdsText,
    nextStation,
    prevStation,
    setVolume: storeSetVolume,
  } = useAetherStore();

  // Create audio element
  useEffect(() => {
    if (typeof window !== 'undefined' && !audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'none';
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // Sync play/pause state — ONLY when NOT connected as remote
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentStation) return;

    // Don't play local audio when acting as remote
    if (remoteConnected) {
      audio.pause();
      return;
    }

    if (isPlaying) {
      if (audio.src !== currentStation.url) {
        audio.src = currentStation.url;
        audio.load();
      }
      audio.play().catch(() => { /* autoplay blocked */ });
    } else {
      audio.pause();
    }
  }, [isPlaying, currentStation, remoteConnected]);

  // Pause local audio immediately when remote connects
  useEffect(() => {
    if (remoteConnected && audioRef.current) {
      audioRef.current.pause();
    }
  }, [remoteConnected]);

  // Sync volume
  useEffect(() => {
    if (audioRef.current && !remoteConnected) {
      audioRef.current.volume = volume;
    }
  }, [volume, remoteConnected]);

  // Handle audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      if (!useAetherStore.getState().isPlaying) {
        useAetherStore.setState({ isPlaying: true });
      }
    };

    const handlePause = () => {
      if (useAetherStore.getState().isPlaying && !useAetherStore.getState().remoteConnected) {
        useAetherStore.setState({ isPlaying: false });
      }
    };

    const handleError = () => {
      useAetherStore.getState().addToast('Audio stream error. Trying to reconnect...', 'error');
    };

    const handleWaiting = () => {
      useAetherStore.setState({ rdsText: 'Buffering...' });
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);
    audio.addEventListener('waiting', handleWaiting);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('waiting', handleWaiting);
    };
  }, []);

  // RDS Polling — ONLY when playing locally (not remote)
  useEffect(() => {
    if (rdsIntervalRef.current) {
      clearInterval(rdsIntervalRef.current);
      rdsIntervalRef.current = null;
    }

    // Don't poll RDS when connected as remote (server sends it)
    if (isPlaying && currentStation && !remoteConnected) {
      const fetchRds = async () => {
        try {
          const { fetchRdsInfo } = await import('@/lib/audio-utils');
          const text = await fetchRdsInfo(currentStation.url, currentStation.rdsUrl);
          if (text) setRdsText(text);
        } catch { /* ignore */ }
      };

      fetchRds();
      rdsIntervalRef.current = setInterval(fetchRds, 15000);
    }

    return () => {
      if (rdsIntervalRef.current) clearInterval(rdsIntervalRef.current);
    };
  }, [isPlaying, currentStation, setRdsText, remoteConnected]);

  // Keep audio alive when tab is hidden
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && isPlaying && audioRef.current && !remoteConnected) {
        const silenceCtx = new AudioContext();
        const oscillator = silenceCtx.createOscillator();
        const gain = silenceCtx.createGain();
        gain.gain.value = 0.001;
        oscillator.connect(gain);
        gain.connect(silenceCtx.destination);
        oscillator.start();
        setTimeout(() => {
          oscillator.stop();
          silenceCtx.close();
        }, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isPlaying, remoteConnected]);

  // Media Session API
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentStation) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentStation.name,
      artist: 'Aether Pro',
      album: 'Internet Radio',
    });

    navigator.mediaSession.setActionHandler('play', () => {
      if (!useAetherStore.getState().isPlaying) storeTogglePlay();
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      if (useAetherStore.getState().isPlaying) storeTogglePlay();
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => nextStation());
    navigator.mediaSession.setActionHandler('previoustrack', () => prevStation());

    return () => {
      try {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
      } catch { /* ignore */ }
    };
  }, [currentStation, nextStation, prevStation, storeTogglePlay]);

  const play = useCallback((station: typeof currentStation) => {
    if (station) {
      storePlayStation(station);
    }
  }, [storePlayStation]);

  const toggle = useCallback(() => {
    storeTogglePlay();
  }, [storeTogglePlay]);

  const changeVolume = useCallback((v: number) => {
    storeSetVolume(v);
  }, [storeSetVolume]);

  return { play, toggle, changeVolume, audioRef };
}
