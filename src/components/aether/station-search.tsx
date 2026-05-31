'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAetherStore } from '@/store/aether-store';
import { searchStations } from '@/lib/audio-utils';
import { cn } from '@/lib/utils';
import { Search, Plus, Loader2, X, Globe } from 'lucide-react';

interface StationSearchProps {
  className?: string;
}

export function StationSearch({ className }: StationSearchProps) {
  const [query, setQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    searchResults,
    searchLoading,
    setSearchResults,
    setSearchLoading,
    addStation,
    stations,
  } = useAetherStore();

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const results = await searchStations(q);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [setSearchResults, setSearchLoading]);

  const handleChange = useCallback((value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 500);
  }, [doSearch]);

  const clearSearch = () => {
    setQuery('');
    setSearchResults([]);
  };

  const addFromSearch = (name: string, url: string) => {
    const existingUrls = new Set(stations.map(s => s.url));
    if (existingUrls.has(url)) {
      useAetherStore.getState().addToast('Station already saved', 'info');
      return;
    }
    addStation({
      id: crypto.randomUUID(),
      name,
      url,
    });
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-aether-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Search stations..."
          className="w-full h-11 pl-10 pr-10 bg-white/5 border border-aether-border rounded-xl text-sm text-aether-text placeholder:text-aether-muted/60 focus:outline-none focus:border-aether-indigo/50 focus:ring-1 focus:ring-aether-indigo/30 transition-all"
        />
        {query && !searchLoading && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full text-aether-muted hover:text-aether-text transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        {searchLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-aether-indigo animate-spin" />
        )}
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="glass-panel-sm overflow-hidden">
          <div className="max-h-56 sm:max-h-64 overflow-y-auto aether-scroll divide-y divide-white/5">
            {searchResults.map((result, i) => (
              <div
                key={`${result.url}-${i}`}
                className="flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-2.5 hover:bg-white/[0.03] active:bg-white/[0.06] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-aether-text truncate">{result.name}</p>
                  {result.country && (
                    <p className="text-[11px] sm:text-xs text-aether-muted truncate flex items-center gap-1">
                      <Globe className="w-3 h-3 flex-shrink-0" />
                      {result.country}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => addFromSearch(result.name, result.url)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-aether-indigo/10 text-aether-indigo hover:bg-aether-indigo/20 active:bg-aether-indigo/30 transition-colors flex-shrink-0"
                  aria-label="Add station"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
