'use client';

import { useState, useEffect } from 'react';

export function useOrientation() {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      const portrait = window.innerHeight > window.innerWidth;
      setOrientation(portrait ? 'portrait' : 'landscape');
      setIsMobile(window.innerWidth < 768);
    };

    check();

    // Use matchMedia for orientation (works without JS resize listeners)
    const mql = window.matchMedia('(orientation: portrait)');
    const handler = (e: MediaQueryListEvent) => {
      setOrientation(e.matches ? 'portrait' : 'landscape');
    };
    mql.addEventListener('change', handler);

    return () => mql.removeEventListener('change', handler);
  }, []);

  return { orientation, isMobile };
}
