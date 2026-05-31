// RDS Proxy Functions
const PROXIES = [
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
];

export async function proxyFetch(url: string): Promise<string | null> {
  for (const mk of PROXIES) {
    try {
      const res = await fetch(mk(url), { signal: AbortSignal.timeout(5000) });
      if (!res.ok) continue;
      const text = await res.text();
      try {
        const j = JSON.parse(text);
        return j.contents ?? text;
      } catch {
        return text;
      }
    } catch {
      continue;
    }
  }
  return null;
}

export async function fetchRdsInfo(stationUrl: string, customRdsUrl?: string): Promise<string | null> {
  // 1. If station has custom rdsUrl, fetch that
  if (customRdsUrl) {
    const text = await proxyFetch(customRdsUrl);
    if (text) return extractRdsText(text);
  }

  try {
    const urlObj = new URL(stationUrl);
    const base = `${urlObj.protocol}//${urlObj.host}`;

    // 2. Try Icecast /status-json.xsl
    try {
      const icecastUrl = `${base}/status-json.xsl`;
      const text = await proxyFetch(icecastUrl);
      if (text) {
        const data = JSON.parse(text);
        if (data.icestats?.source) {
          const source = Array.isArray(data.icestats.source) ? data.icestats.source[0] : data.icestats.source;
          if (source?.title) return source.title;
          if (source?.artist && source?.title) return `${source.artist} - ${source.title}`;
        }
      }
    } catch { /* continue */ }

    // 3. Try Shoutcast /7.html
    try {
      const shoutUrl = `${base}/7.html`;
      const text = await proxyFetch(shoutUrl);
      if (text) {
        const match = text.match(/<body>(.*?)<\/body>/i);
        if (match) {
          const parts = match[1].split(',');
          if (parts.length >= 7 && parts[6]) {
            return parts[6].trim();
          }
        }
      }
    } catch { /* continue */ }
  } catch {
    // Invalid URL, skip
  }

  return null;
}

function extractRdsText(text: string): string | null {
  try {
    const data = JSON.parse(text);
    if (data.title) return data.title;
    if (data.now_playing) return data.now_playing;
    if (data.icestats?.source) {
      const source = Array.isArray(data.icestats.source) ? data.icestats.source[0] : data.icestats.source;
      return source?.title || null;
    }
  } catch { /* not JSON */ }
  return text.trim() || null;
}

// Search Stations
export interface SearchStationResult {
  name: string;
  url: string;
  country?: string;
  favicon?: string;
}

export async function searchStations(query: string): Promise<SearchStationResult[]> {
  if (!query.trim()) return [];
  const res = await fetch(
    `https://de1.api.radio-browser.info/json/stations/search?name=${encodeURIComponent(query)}&limit=30&order=clickcount&reverse=true&hidebroken=true`
  );
  const data = await res.json();
  return data
    .map((s: Record<string, unknown>) => ({
      name: (s.name as string) || 'Unknown',
      url: (s.url_resolved as string) || (s.url as string) || '',
      country: (s.country as string) || undefined,
      favicon: (s.favicon as string) || undefined,
    }))
    .filter((s: SearchStationResult) => !!s.url);
}

// Parse M3U/M3U8 files
export function parseM3u(content: string): Array<{ name: string; url: string }> {
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  const stations: Array<{ name: string; url: string }> = [];
  let currentName = '';

  for (const line of lines) {
    if (line.startsWith('#EXTINF')) {
      const match = line.match(/,(.+)$/);
      currentName = match ? match[1].trim() : '';
    } else if (!line.startsWith('#') && (line.startsWith('http') || line.startsWith('rtmp') || line.startsWith('https'))) {
      stations.push({
        name: currentName || `Station ${stations.length + 1}`,
        url: line,
      });
      currentName = '';
    }
  }
  return stations;
}

// Parse PLS files
export function parsePls(content: string): Array<{ name: string; url: string }> {
  const stations: Array<{ name: string; url: string }> = [];
  const urlMatches = content.match(/File\d+\s*=\s*(.+)/gi) || [];
  const titleMatches = content.match(/Title\d+\s*=\s*(.+)/gi) || [];

  const urls: string[] = [];
  const names: string[] = [];

  urlMatches.forEach(m => {
    const url = m.split('=')[1]?.trim();
    if (url) urls.push(url);
  });

  titleMatches.forEach(m => {
    const name = m.split('=')[1]?.trim();
    if (name) names.push(name);
  });

  urls.forEach((url, i) => {
    stations.push({
      name: names[i] || `Station ${i + 1}`,
      url,
    });
  });

  return stations;
}

export function parsePlaylistFile(content: string, filename: string): Array<{ name: string; url: string }> {
  const ext = filename.toLowerCase();
  if (ext.endsWith('.pls')) return parsePls(content);
  if (ext.endsWith('.m3u') || ext.endsWith('.m3u8')) return parseM3u(content);
  // Try M3U as fallback
  return parseM3u(content);
}
